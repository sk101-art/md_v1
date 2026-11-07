// Swarm Director: multi-agent collaborative construction of real UI regions.
// Recipes: construct (2-pass skeleton -> fill, or 1-pass), rebuild teardown, morph,
// connect, disperse. Geometry is always measured from the live DOM.
import { Agent, ROLES } from "./agents.js";
import { pageRect, radiusOf, inViewport, lineRects, dist } from "./selection-geometry.js";
import { traceContainer, roundedRectPath } from "./container-tracer.js";
import { motion, wait, clamp, isSmall } from "../core/util.js";

const NS = "http://www.w3.org/2000/svg";
const HOLD_SAFETY_MS = 9000;

class Run {
  constructor(kind) {
    this.kind = kind;
    this.cancelled = false;
    this.items = new Set();
    this.cleanups = new Set();
  }
  track(tween, onKill) { const it = { tween, onKill }; this.items.add(it); return it; }
  cleanup(fn) { this.cleanups.add(fn); }
  cancel() {
    if (this.cancelled) return;
    this.cancelled = true;
    for (const it of this.items) { try { it.tween && it.tween.kill(); } catch {} try { it.onKill && it.onKill(); } catch {} }
    this.items.clear();
    for (const fn of this.cleanups) { try { fn(); } catch {} }
    this.cleanups.clear();
  }
}

function kindOf(el) { return el.dataset.sw || "block"; }
function groupOf(el) {
  if (el.dataset.swG != null) return +el.dataset.swG;
  return kindOf(el) === "box" ? 0 : 1;
}

export class SwarmDirector {
  constructor() {
    this.layer = document.createElement("div");
    this.layer.className = "swarm-layer";
    this.layer.setAttribute("aria-hidden", "true");
    document.body.append(this.layer);

    this.agents = [];
    this.runs = new Set();
    this.observers = [];
    this.held = new Set();
    this.crosses = [];
    this.stats = { constructs: 0, layers: 0, lastMs: 0 };
    this._buildHud();

    let rw = window.innerWidth;
    window.addEventListener("resize", () => {
      if (Math.abs(window.innerWidth - rw) > 40) { rw = window.innerWidth; this.skip(); }
    }, { passive: true });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && this.hud.classList.contains("on")) this.skip();
    });
  }

  get enabled() { return !motion.reduced && typeof gsap !== "undefined"; }
  get busy() { return [...this.runs].some(r => r.kind === "main" && !r.cancelled); }

  // ---------- holding / revealing ----------
  layersIn(root) {
    return [...root.querySelectorAll("[data-sw]")].filter(el => !el.hasAttribute("data-sw-skip") && !el.closest("[data-sw-off]"));
  }
  hold(root) {
    if (!this.enabled) return [];
    const els = this.layersIn(root);
    els.forEach(el => { el.classList.add("sw-hold"); this.held.add(el); });
    const t = setTimeout(() => els.forEach(el => this._release(el)), HOLD_SAFETY_MS);
    this._safety = this._safety || new Set();
    this._safety.add(t);
    return els;
  }
  _release(el) { el.classList.remove("sw-hold"); this.held.delete(el); }
  releaseAll() { for (const el of [...this.held]) this._release(el); }

  revealEl(el, kind, dur = 0.42) {
    this._release(el);
    if (!this.enabled || !el.animate) return Promise.resolve();
    let kf;
    if (kind === "text" || kind === "block") kf = [{ clipPath: "inset(-4px 100% -4px -4px)", opacity: 0.35 }, { clipPath: "inset(-4px -4px -4px -4px)", opacity: 1 }];
    else if (kind === "media") kf = [{ clipPath: "inset(0 0 100% 0)", opacity: 0.5 }, { clipPath: "inset(0 0 0% 0)", opacity: 1 }];
    else kf = [{ opacity: 0 }, { opacity: 1 }];
    const a = el.animate(kf, { duration: dur * 1000, easing: "cubic-bezier(.16,1,.3,1)" });
    return a.finished.catch(() => {});
  }

  // ---------- primitives ----------
  _tween(run, target, vars) {
    return new Promise(res => {
      if (!run || run.cancelled) return res();
      const t = gsap.to(target, { ...vars, onComplete: () => { vars.onComplete && vars.onComplete(); res(); } });
      run.track(t, res);
    });
  }
  _spawnAgents(n, around) {
    const out = [];
    const vw = window.innerWidth, vh = window.innerHeight, sx = window.scrollX, sy = window.scrollY;
    for (let i = 0; i < n; i++) {
      const role = ROLES[i % ROLES.length];
      const a = new Agent(this.layer, role, i);
      // scatter across the (blank) canvas like the reference: spread, not clustered
      const gx = (i % 5 + 0.5) / 5, gy = (Math.floor(i / 5) + 0.5) / Math.ceil(n / 5);
      const x = sx + vw * clamp(gx + (Math.random() - 0.5) * 0.16, 0.04, 0.96);
      const y = sy + vh * clamp(0.18 + gy * 0.62 + (Math.random() - 0.5) * 0.14, 0.08, 0.92);
      a.place(around ? around.x : x, around ? around.y : y);
      a.el.style.opacity = "0";
      gsap.to(a.el, { opacity: 1, duration: 0.25, delay: i * 0.03 });
      out.push(a);
    }
    return out;
  }
  _move(run, agent, x, y, base = 1) {
    const d = dist(agent, { x, y });
    const dur = clamp((d / 1500) * base / agent.role.speed, 0.16, 0.6) * (0.9 + Math.random() * 0.2);
    const p = { x: agent.x, y: agent.y };
    // x and y on different eases -> natural curved hand path
    return Promise.all([
      this._tween(run, p, { x, duration: dur, ease: "power2.inOut", onUpdate: () => agent.place(p.x, p.y) }),
      this._tween(run, p, { y, duration: dur, ease: "power3.inOut" })
    ]);
  }
  _box(rect, { fill = "clear", dims = true, color } = {}) {
    const b = document.createElement("div");
    b.className = `sw-box ${fill}`;
    if (color) b.style.setProperty("--select", color);
    b.innerHTML = `<i></i><i></i><i></i><i></i>${dims ? '<span class="sw-dim"></span>' : ""}`;
    this._setBox(b, rect);
    this.layer.append(b);
    return b;
  }
  _setBox(b, r) {
    b.style.transform = `translate(${r.x}px, ${r.y}px)`;
    b.style.width = `${Math.max(0, r.w)}px`;
    b.style.height = `${Math.max(0, r.h)}px`;
    const d = b.querySelector(".sw-dim");
    if (d) d.textContent = `${Math.round(r.w)} × ${Math.round(r.h)}`;
  }
  async _drag(run, agent, rect, opts) {
    const b = this._box({ x: rect.x, y: rect.y, w: 0, h: 0 }, opts);
    run.cleanup(() => b.remove());
    const s = { w: 0, h: 0 };
    const dur = clamp(0.2 + (rect.w + rect.h) / 4200, 0.2, 0.42);
    await this._tween(run, s, {
      w: rect.w, h: rect.h, duration: dur, ease: "power2.out",
      onUpdate: () => { this._setBox(b, { x: rect.x, y: rect.y, w: s.w, h: s.h }); agent.place(rect.x + s.w, rect.y + s.h); }
    });
    return b;
  }
  _fadeOut(run, el, d = 0.16, delay = 0) {
    return this._tween(run, el, { opacity: 0, duration: d, delay, onComplete: () => el.remove() });
  }
  _skeleton(el, kind) {
    const pieces = [];
    const r = pageRect(el);
    const mk = (x, y, w, h, rad, outline) => {
      const f = document.createElement("div");
      f.className = "sw-frag";
      f.style.cssText = `transform:translate(${x}px,${y}px);width:${w}px;height:${h}px;border-radius:${rad}px;` +
        (outline ? "background:transparent;border:1px solid var(--silver);" : "");
      this.layer.append(f);
      pieces.push(f);
    };
    if (kind === "text") {
      const lines = lineRects(el);
      if (lines.length) lines.forEach(l => mk(l.x, l.y, l.w, l.h, 3));
      else mk(r.x, r.y, r.w, r.h, 4);
    } else if (kind === "box") {
      mk(r.x, r.y, r.w, r.h, radiusOf(el), true);
    } else {
      mk(r.x, r.y, r.w, r.h, Math.max(4, radiusOf(el)));
    }
    return pieces;
  }
  _cross(x, y, color) {
    const c = document.createElement("i");
    c.className = "sw-cross";
    c.style.left = `${x}px`;
    c.style.top = `${y}px`;
    if (color) c.style.setProperty("--c", color);
    this.layer.append(c);
    gsap.to(c, { opacity: 1, duration: 0.2, delay: Math.random() * 0.25 });
    return c;
  }
  _guide(run, y) {
    const g = document.createElement("i");
    g.className = "sw-guide";
    g.style.top = `${y}px`;
    g.style.left = `${window.scrollX}px`;
    g.style.width = `${window.innerWidth}px`;
    this.layer.append(g);
    run.cleanup(() => g.remove());
    gsap.fromTo(g, { opacity: 0, scaleX: 0 }, { opacity: 0.75, scaleX: 1, duration: 0.25, ease: "power2.out" });
    gsap.to(g, { opacity: 0, duration: 0.3, delay: 0.45, onComplete: () => g.remove() });
  }

  // ---------- scheduler: agents claim the nearest of the next K layers ----------
  async _schedule(run, agents, layers, task) {
    const pending = [...layers];
    const worker = async (agent, i) => {
      await wait(i * 45);
      while (pending.length && !run.cancelled) {
        const K = Math.min(pending.length, Math.max(2, agents.length));
        let best = 0, bd = Infinity;
        for (let k = 0; k < K; k++) {
          const d = dist(agent, pending[k].rect) + k * 90; // keep overall reading order
          if (d < bd) { bd = d; best = k; }
        }
        const L = pending.splice(best, 1)[0];
        try { await task(agent, L); } catch (e) { console.warn("[swarm]", e); this._release(L.el); }
      }
    };
    await Promise.all(agents.map(worker));
  }

  _describe(els) {
    return els
      .map(el => ({ el, kind: kindOf(el), group: groupOf(el), rect: pageRect(el), skel: [] }))
      .filter(L => L.rect.w > 1 && L.rect.h > 1)
      .sort((a, b) => a.group - b.group || (Math.abs(a.rect.y - b.rect.y) > 12 ? a.rect.y - b.rect.y : a.rect.x - b.rect.x));
  }

  // ---------- HUD ----------
  _buildHud() {
    const h = document.createElement("div");
    h.className = "sw-hud";
    h.setAttribute("role", "status");
    h.innerHTML = `<span class="dots">${ROLES.map(r => `<i style="--c:${r.color}"></i>`).join("")}</span>
      <span class="txt">0 agents · 0/0 layers</span><span class="meter"><b></b></span>
      <button type="button" class="sw-skip">Skip</button>`;
    document.body.append(h);
    h.querySelector(".sw-skip").addEventListener("click", () => this.skip());
    this.hud = h;
  }
  _hud(on, n = 0, done = 0, total = 0, verb = "") {
    this.hud.classList.toggle("on", on);
    if (!on) return;
    this.hud.querySelector(".txt").textContent = `${verb ? verb + " · " : ""}${n} agents · ${done}/${total} layers`;
    this.hud.querySelector(".meter b").style.width = `${total ? (done / total) * 100 : 0}%`;
  }

  // ---------- recipes ----------

  /** Construct: cursors arrive, select, lay skeletons, fill content, deselect. */
  async construct(root, { agents = isSmall() ? 5 : 10, passes = 2, hud = true, deferBelow = true } = {}) {
    const els = this.layersIn(root);
    if (!this.enabled) { els.forEach(el => this._release(el)); return; }
    const t0 = performance.now();
    const visible = els.filter(el => inViewport(el, 20));
    const later = els.filter(el => !visible.includes(el));
    if (deferBelow && later.length) this._deferUntilVisible(later);
    else later.forEach(el => this._release(el));

    const run = new Run("main");
    this.runs.add(run);
    const layers = this._describe(visible);
    const total = layers.length * passes;
    let done = 0;
    const tick = () => { done++; if (hud) this._hud(true, this.agents.length, done, total, "Building"); };

    if (!this.agents.length) this.agents = this._spawnAgents(Math.min(agents, Math.max(3, layers.length)));
    if (hud) this._hud(true, this.agents.length, 0, total, "Building");

    // placement marks where each layer will land
    const marks = new Map();
    layers.slice(0, 40).forEach((L, i) => marks.set(L, this._cross(L.rect.x, L.rect.y, ROLES[i % ROLES.length].color)));
    run.cleanup(() => marks.forEach(c => c.remove()));

    const fill = async (agent, L) => {
      // select existing skeleton, then the real content resolves inside it
      await this._move(run, agent, L.rect.x + Math.min(L.rect.w * 0.35, 120), L.rect.y + Math.min(L.rect.h * 0.5, 40));
      if (run.cancelled) return;
      const b = this._box(L.rect, { fill: "tint" });
      run.cleanup(() => b.remove());
      gsap.fromTo(b, { scale: 1.015, opacity: 0.4 }, { scale: 1, opacity: 1, duration: 0.14, transformOrigin: "50% 50%" });
      if (L.kind === "box") {
        L.skel.forEach(s => s.remove());
        await traceContainer(L.el, this.layer, { duration: clamp(0.45 + (L.rect.w + L.rect.h) / 5000, 0.45, 0.85), run, onResolve: () => this.revealEl(L.el, "box", 0.45) });
      } else {
        const rev = this.revealEl(L.el, L.kind, L.kind === "media" ? 0.5 : 0.4);
        L.skel.forEach((s, i) => gsap.to(s, { opacity: 0, duration: 0.3, delay: i * 0.03, onComplete: () => s.remove() }));
        await rev;
      }
      tick();
      await this._fadeOut(run, b, 0.16, 0.05);
    };

    const layDown = async (agent, L) => {
      await this._move(run, agent, L.rect.x, L.rect.y);
      if (run.cancelled) return;
      const b = await this._drag(run, agent, L.rect, { fill: "clear" });
      if (run.cancelled) return;
      L.skel = this._skeleton(L.el, L.kind);
      L.skel.forEach(s => gsap.fromTo(s, { opacity: 0 }, { opacity: 1, duration: 0.14 }));
      run.cleanup(() => L.skel.forEach(s => s.remove()));
      const m = marks.get(L); if (m) gsap.to(m, { opacity: 0, duration: 0.2, onComplete: () => m.remove() });
      if (L.kind !== "box" && Math.random() < 0.28) this._guide(run, L.rect.y);
      tick();
      await this._fadeOut(run, b, 0.14, 0.04);
    };

    const single = async (agent, L) => {
      await this._move(run, agent, L.rect.x, L.rect.y);
      if (run.cancelled) return;
      const b = await this._drag(run, agent, L.rect, { fill: L.kind === "box" ? "clear" : "skeleton" });
      const m = marks.get(L); if (m) m.remove();
      if (run.cancelled) return;
      if (L.kind === "box") {
        await traceContainer(L.el, this.layer, { duration: 0.6, run, onResolve: () => this.revealEl(L.el, "box", 0.4) });
      } else {
        b.classList.add("tint");
        b.style.transition = "background-color 300ms";
        b.style.backgroundColor = "transparent";
        await this.revealEl(L.el, L.kind);
      }
      tick();
      await this._fadeOut(run, b, 0.14, 0.04);
    };

    try {
      if (passes === 2) {
        await this._schedule(run, this.agents, layers, layDown);
        await this._schedule(run, this.agents, layers, fill);
      } else {
        await this._schedule(run, this.agents, layers, single);
      }
    } finally {
      layers.forEach(L => this._release(L.el));
      run.cancel(); // cleanup any stragglers
      this.runs.delete(run);
      if (hud) this._hud(false);
      this.stats.constructs++;
      this.stats.layers = layers.length;
      this.stats.lastMs = Math.round(performance.now() - t0);
      await this.disperse();
    }
  }

  /** Rebuild teardown: selected regions fragment into neutral pieces and the canvas clears. */
  async teardown(root, { agents = isSmall() ? 5 : 10, max = 14 } = {}) {
    if (!this.enabled) return;
    this.cancelRuns();
    const run = new Run("main");
    this.runs.add(run);
    const els = this.layersIn(root).filter(el => inViewport(el, 0) && !el.classList.contains("sw-hold"));
    const layers = this._describe(els).filter(L => L.kind !== "box").slice(0, max);
    // the containers on screen fade with their contents
    const boxes = this.layersIn(root).filter(el => inViewport(el) && kindOf(el) === "box");
    if (!this.agents.length) this.agents = this._spawnAgents(agents);
    let done = 0;
    this._hud(true, this.agents.length, 0, layers.length, "Rebuilding");

    const tear = async (agent, L) => {
      await this._move(run, agent, L.rect.x, L.rect.y, 0.6);
      if (run.cancelled) return;
      const b = this._box(L.rect, { fill: "tint" });
      run.cleanup(() => b.remove());
      const frags = this._skeleton(L.el, L.kind === "box" ? "block" : L.kind);
      run.cleanup(() => frags.forEach(f => f.remove()));
      L.el.style.opacity = "0";
      agent.place(L.rect.x + L.rect.w, L.rect.y + L.rect.h);
      await Promise.all(frags.map((f, i) => this._tween(run, f, { scaleX: 0, opacity: 0, transformOrigin: "0 50%", duration: 0.24, delay: 0.06 + i * 0.03, ease: "power2.in", onComplete: () => f.remove() })));
      done++;
      this._hud(true, this.agents.length, done, layers.length, "Rebuilding");
      await this._fadeOut(run, b, 0.1);
    };
    boxes.forEach(el => gsap.to(el, { opacity: 0, duration: 0.35, delay: 0.15 }));
    try {
      await this._schedule(run, this.agents, layers, tear);
      // blank canvas beat with scattered marks
      if (!run.cancelled) {
        const vw = window.innerWidth, vh = window.innerHeight;
        for (let i = 0; i < 12; i++) {
          const c = this._cross(window.scrollX + vw * (0.08 + Math.random() * 0.84), window.scrollY + vh * (0.15 + Math.random() * 0.75), ROLES[i % 5].color);
          setTimeout(() => c.remove(), 700);
        }
        await wait(140);
      }
    } finally {
      run.cancel();
      this.runs.delete(run);
    }
  }

  /** Morph: a selection frame wraps a region, the region changes, the frame resizes to fit. */
  async morph(el, mutate, { color = "#5878D8" } = {}) {
    if (!this.enabled || !el) { await mutate(); return; }
    const run = new Run("mini");
    this.runs.add(run);
    const a = pageRect(el, 6);
    const agent = new Agent(this.layer, ROLES[0], 99);
    agent.place(a.x + a.w - 8, a.y - 10);
    gsap.fromTo(agent.el, { opacity: 0 }, { opacity: 1, duration: 0.15 });
    const b = this._box(a, { fill: "clear", color });
    gsap.fromTo(b, { opacity: 0 }, { opacity: 1, duration: 0.12 });
    try {
      await mutate();
      const z = pageRect(el, 6);
      const s = { ...a };
      await this._tween(run, s, {
        x: z.x, y: z.y, w: z.w, h: z.h, duration: 0.42, ease: "power3.out",
        onUpdate: () => { this._setBox(b, s); agent.place(s.x + s.w - 8, s.y + s.h - 8); }
      });
      await wait(120);
    } finally {
      gsap.to([b, agent.el], { opacity: 0, duration: 0.2, onComplete: () => { b.remove(); agent.remove(); } });
      run.cancel();
      this.runs.delete(run);
    }
  }

  /** Connect: an agent draws persistent paths between nodes inside a page-owned SVG. */
  async connect(svg, nodes, { color = "#5878D8", side = "left" } = {}) {
    if (!svg || nodes.length < 2) return;
    const host = svg.getBoundingClientRect();
    const pts = nodes.map(n => {
      const r = n.getBoundingClientRect();
      return { x: (side === "left" ? r.left + 27 : r.left + r.width / 2) - host.left, y: r.top + r.height / 2 - host.top };
    });
    svg.innerHTML = "";
    const paths = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1];
      const path = document.createElementNS(NS, "path");
      const bulge = 18;
      path.setAttribute("d", `M ${p.x} ${p.y + 12} C ${p.x - bulge} ${p.y + (q.y - p.y) * 0.4}, ${q.x - bulge} ${p.y + (q.y - p.y) * 0.6}, ${q.x} ${q.y - 12}`);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", color);
      path.setAttribute("stroke-width", "1.2");
      path.setAttribute("stroke-dasharray", "3 4");
      path.setAttribute("opacity", "0.55");
      svg.append(path);
      paths.push(path);
    }
    if (!this.enabled) return;
    const run = new Run("mini");
    this.runs.add(run);
    const agent = new Agent(this.layer, ROLES[3], 98);
    const ox = host.left + window.scrollX, oy = host.top + window.scrollY;
    agent.place(ox + pts[0].x, oy + pts[0].y);
    gsap.fromTo(agent.el, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    try {
      for (const path of paths) {
        const len = path.getTotalLength();
        const mask = document.createElementNS(NS, "path");
        path.style.clipPath = "none";
        path.setAttribute("stroke-dashoffset", "0");
        // draw-on using a solid overlay stroke, then hand over to the dashed resting style
        const draw = path.cloneNode();
        draw.removeAttribute("stroke-dasharray");
        draw.setAttribute("opacity", "0.9");
        draw.style.strokeDasharray = `${len}`;
        draw.style.strokeDashoffset = `${len}`;
        svg.append(draw);
        path.style.opacity = "0";
        const s = { p: 0 };
        await this._tween(run, s, {
          p: 1, duration: 0.42, ease: "power2.inOut",
          onUpdate: () => {
            draw.style.strokeDashoffset = `${len * (1 - s.p)}`;
            const pt = path.getPointAtLength(len * s.p);
            agent.place(ox + pt.x, oy + pt.y);
          }
        });
        path.style.opacity = "";
        gsap.to(draw, { opacity: 0, duration: 0.4, onComplete: () => draw.remove() });
        void mask;
      }
    } finally {
      gsap.to(agent.el, { opacity: 0, duration: 0.25, delay: 0.1, onComplete: () => agent.remove() });
      run.cancel();
      this.runs.delete(run);
    }
  }

  /** Briefly frame a set of elements (e.g. particle donors) with selection boxes. */
  frameEls(els, ms = 800) {
    if (!this.enabled) return;
    els.forEach((el, i) => {
      const b = this._box(pageRect(el, 4), { fill: "clear", dims: i < 3 });
      gsap.fromTo(b, { opacity: 0 }, { opacity: 1, duration: 0.15, delay: i * 0.05 });
      gsap.to(b, { opacity: 0, duration: 0.25, delay: ms / 1000 + i * 0.03, onComplete: () => b.remove() });
    });
  }

  /** Disperse: cursors drift out of the content and dissolve, returning control. */
  async disperse() {
    const ag = this.agents.splice(0);
    if (!ag.length) return;
    const vw = window.innerWidth;
    await Promise.all(ag.map((a, i) => new Promise(res => {
      const p = { x: a.x, y: a.y };
      const toX = a.x + (a.x - window.scrollX < vw / 2 ? -60 : 60);
      gsap.to(p, { x: toX, y: a.y + 30, duration: 0.45, delay: i * 0.02, ease: "power2.in", onUpdate: () => a.place(p.x, p.y) });
      gsap.to(a.el, { opacity: 0, duration: 0.4, delay: 0.1 + i * 0.02, onComplete: () => { a.remove(); res(); } });
    })));
  }

  // ---------- section-scoped constructs as content scrolls in ----------
  _deferUntilVisible(els) {
    const groups = new Map();
    for (const el of els) {
      const sec = el.closest("[data-sw-section], section, .section") || el.parentElement;
      if (!groups.has(sec)) groups.set(sec, []);
      groups.get(sec).push(el);
    }
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const list = groups.get(e.target) || [];
        this._sectionConstruct(list);
      }
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.01 });
    groups.forEach((_, sec) => io.observe(sec));
    this.observers.push(io);
  }
  async _sectionConstruct(els) {
    if (!this.enabled) { els.forEach(el => this._release(el)); return; }
    const run = new Run("section");
    this.runs.add(run);
    const layers = this._describe(els);
    const n = clamp(Math.ceil(layers.length / 4), 1, 3);
    const agents = [];
    for (let i = 0; i < n; i++) {
      const a = new Agent(this.layer, ROLES[(i + this.stats.constructs) % ROLES.length], 50 + i);
      const r = layers[i] ? layers[i].rect : { x: window.scrollX + 40, y: window.scrollY + 40 };
      a.place(r.x - 30 - i * 20, r.y - 40);
      gsap.fromTo(a.el, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      agents.push(a);
    }
    const quick = async (agent, L) => {
      await this._move(run, agent, L.rect.x, L.rect.y, 0.7);
      if (run.cancelled) return;
      if (L.kind === "box") {
        const b = this._box(L.rect, { fill: "clear", dims: L.rect.w > 160 });
        run.cleanup(() => b.remove());
        agent.place(L.rect.x + L.rect.w, L.rect.y + L.rect.h);
        await traceContainer(L.el, this.layer, { duration: 0.55, run, onResolve: () => this.revealEl(L.el, "box", 0.35) });
        await this._fadeOut(run, b, 0.12);
      } else {
        const b = await this._drag(run, agent, L.rect, { fill: "skeleton", dims: L.rect.w > 120 });
        if (run.cancelled) return;
        b.style.transition = "background-color 260ms";
        b.style.backgroundColor = "transparent";
        await this.revealEl(L.el, L.kind, 0.34);
        await this._fadeOut(run, b, 0.12);
      }
    };
    try {
      await this._schedule(run, agents, layers, quick);
    } finally {
      layers.forEach(L => this._release(L.el));
      run.cancel();
      this.runs.delete(run);
      agents.forEach((a, i) => gsap.to(a.el, { opacity: 0, duration: 0.3, delay: 0.05 + i * 0.04, onComplete: () => a.remove() }));
    }
  }

  // ---------- control ----------
  cancelRuns() {
    for (const r of [...this.runs]) r.cancel();
    this.runs.clear();
  }
  skip() {
    this.cancelRuns();
    this.releaseAll();
    this._hud(false);
    this.layer.querySelectorAll(".sw-box,.sw-frag,.sw-cross,.sw-guide,.trace-svg,.trace-head").forEach(n => n.remove());
    this.disperse();
  }
  /** Route exit: stop everything, keep cursors for continuity unless asked. */
  reset({ keepAgents = false } = {}) {
    this.cancelRuns();
    this.observers.splice(0).forEach(o => o.disconnect());
    (this._safety || new Set()).forEach(clearTimeout);
    this._safety = new Set();
    this.releaseAll();
    this.layer.querySelectorAll(".sw-box,.sw-frag,.sw-guide,.trace-svg,.trace-head").forEach(n => n.remove());
    if (!keepAgents) { this.agents.splice(0).forEach(a => a.remove()); this._hud(false); }
  }
}

export { roundedRectPath };
