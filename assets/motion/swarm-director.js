// Swarm Director: multi-agent collaborative construction of real UI regions.
// Recipes: construct (2-pass skeleton -> fill, or 1-pass), rebuild teardown, morph,
// connect, disperse. Geometry is always measured from the live DOM.
import { Agent, ROLES, visitor } from "./agents.js";
import { pageRect, radiusOf, inViewport, lineRects, dist } from "./selection-geometry.js";
import { traceContainer, roundedRectPath } from "./container-tracer.js";
import { motion, wait, clamp, isSmall } from "../core/util.js";

const NS = "http://www.w3.org/2000/svg";
const PATH_OK = typeof CSS !== "undefined" && CSS.supports && CSS.supports("clip-path", 'path("M0 0H1V1Z")');
const HOLD_SAFETY_MS = 1200;

// Numbers count up the moment their layer is built (once).
function countUp(el, dir) {
  const nodes = el.matches("[data-count]") ? [el] : [...el.querySelectorAll("[data-count]")];
  nodes.forEach(n => {
    if (n.dataset.counted) return;
    n.dataset.counted = "1";
    const m = n.textContent.trim().match(/^(\d+)(.*)$/);
    if (!m || !dir.enabled) return;
    const end = +m[1], suf = m[2], isYear = end > 1900 && end < 2100;
    const from = isYear ? end - 12 : 0;
    const o = { v: from };
    gsap.to(o, { v: end, duration: isYear ? 0.9 : 1.1, ease: "power3.out", onUpdate: () => (n.textContent = Math.round(o.v) + suf) });
  });
}

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
    this.inFlight = new Set();
    this.crosses = [];
    this.stats = { constructs: 0, layers: 0, lastMs: 0 };
    this._buildHud();

    // A width change invalidates measured geometry: stop the current build and let the sweep
    // rebuild whatever is still unbuilt at the new size (never just reveal it). Debounced, so a
    // panel or window opening animation doesn't cancel the arrival.
    let rw = window.innerWidth, rt = 0;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        if (Math.abs(window.innerWidth - rw) < 40) return;
        rw = window.innerWidth;
        this.restart();
      }, 260);
    }, { passive: true });

    // ---- time: base pace, interaction boost (visitor is impatient), Shift = slow motion ----
    this.base = 1; this.boost = 1; this.slow = 1;
    const hurry = e => {
      if (!this.busy || (e.target && e.target.closest && e.target.closest(".sw-hud"))) return;
      if (e.type === "keydown" && e.key === "Shift") return;
      this.boost = 2.6; this.setRate();
    };
    ["wheel", "touchmove", "pointerdown", "keydown"].forEach(t => window.addEventListener(t, hurry, { passive: true }));
    window.addEventListener("keydown", e => {
      if (e.key !== "Shift" || e.repeat || /input|textarea|select/i.test(document.activeElement?.tagName || "")) return;
      this.slow = 0.18; this.setRate(); this._slowChip(true);
    });
    window.addEventListener("keyup", e => { if (e.key === "Shift" && this.slow !== 1) { this.slow = 1; this.setRate(); this._slowChip(false); } });
    window.addEventListener("blur", () => { if (this.slow !== 1) { this.slow = 1; this.setRate(); this._slowChip(false); } });

    // ---- the visitor joins the session: a "You" tag on the real pointer while the swarm works ----
    this.you = document.createElement("div");
    this.you.className = "sw-you";
    this.you.textContent = "You";
    this.you.setAttribute("aria-hidden", "true");
    document.body.append(this.you);
    window.addEventListener("pointermove", e => {
      visitor.x = e.pageX; visitor.y = e.pageY;
      if (e.pointerType === "mouse") this.you.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 18}px)`;
    }, { passive: true });
    document.addEventListener("pointerleave", () => { visitor.x = visitor.y = -1e5; });

    // Sweep: anything held and on screen that no build has claimed is handed to the swarm.
    setInterval(() => {
      if (this.busy || !this.held.size || document.hidden) return;
      const late = [...this.held].filter(el => !this.inFlight.has(el) && inViewport(el, -24));
      if (late.length) this._sectionConstruct(late);
    }, 1000);
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && this.hud.classList.contains("on")) this.skip();
    });
  }

  get rate() { return this.base * this.boost * this.slow; }
  setRate() {
    const r = this.rate;
    if (typeof gsap !== "undefined") gsap.globalTimeline.timeScale(r);
    try { document.getAnimations().forEach(a => (a.playbackRate = r)); } catch {}
  }
  _slowChip(on) {
    let c = document.querySelector(".sw-slow");
    if (!c) { c = document.createElement("div"); c.className = "sw-slow"; c.setAttribute("role", "status"); c.innerHTML = "<b>0.18×</b> slow motion · release Shift"; document.body.append(c); }
    c.classList.toggle("on", on);
  }
  _click(agent) {
    agent.press();
    const c = document.createElement("i");
    c.className = "sw-click";
    c.style.setProperty("--c", agent.role.color);
    c.style.left = `${agent.x}px`;
    c.style.top = `${agent.y}px`;
    this.layer.append(c);
    gsap.fromTo(c, { scale: 0.3, opacity: 0.9 }, { scale: 2.4, opacity: 0, duration: 0.5, ease: "power2.out", onComplete: () => c.remove() });
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
    // Hard safety: if motion is switched off mid-way, nothing may stay hidden.
    this._safety = this._safety || new Set();
    const t = setTimeout(() => { if (!this.enabled) this.releaseAll(); }, HOLD_SAFETY_MS);
    this._safety.add(t);
    return els;
  }
  _release(el) { el.classList.remove("sw-hold"); this.held.delete(el); this.inFlight.delete(el); }
  releaseAll() { for (const el of [...this.held]) this._release(el); }

  revealEl(el, kind, dur = 0.42) {
    this._release(el);
    if (!this.enabled || !el.animate) return Promise.resolve();
    let kf;
    if (kind === "text" || kind === "block") kf = [{ clipPath: "inset(-4px 100% -4px -4px)", opacity: 0.35 }, { clipPath: "inset(-4px -4px -4px -4px)", opacity: 1 }];
    else if (kind === "media") kf = [{ clipPath: "inset(0 0 100% 0)", opacity: 0.5 }, { clipPath: "inset(0 0 0% 0)", opacity: 1 }];
    else kf = [{ opacity: 0 }, { opacity: 1 }];
    const a = el.animate(kf, { duration: dur * 1000, easing: "cubic-bezier(.16,1,.3,1)" });
    a.playbackRate = this.rate;
    countUp(el, this);
    return a.finished.catch(() => {});
  }

  /** Skeleton bars become the real lines: each bar is consumed left-to-right as its line appears. */
  async _morphText(run, L) {
    const el = L.el, bars = L.skel.filter(s => s.dataset.w);
    this._release(el);
    if (!PATH_OK || !bars.length || !this.enabled) {
      L.skel.forEach(s => s.remove());
      return this.revealEl(el, "text");
    }
    const er = el.getBoundingClientRect();
    const ox = er.left + window.scrollX, oy = er.top + window.scrollY;
    const lines = bars.map(s => {
      const x = +s.dataset.x, y = +s.dataset.y, w = +s.dataset.w, h = +s.dataset.h;
      const full = h / 0.64;
      return { s, x, w, top: y - 0.18 * full - oy, H: full, lx: x - ox };
    });
    const N = lines.length;
    const st = { p: 0 };
    const draw = () => {
      let d = "";
      lines.forEach((l, j) => {
        const f = clamp(st.p * N - j, 0, 1);
        if (f > 0) d += `M${l.lx - 6} ${l.top - 2}h${(l.w + 12) * f}v${l.H + 4}h${-(l.w + 12) * f}Z`;
        l.s.style.transform = `translate(${l.x + l.w * f}px, ${+l.s.dataset.y}px)`;
        l.s.style.width = `${Math.max(0, l.w * (1 - f))}px`;
        l.s.style.opacity = String(1 - f * 0.4);
      });
      el.style.clipPath = d ? `path("${d}")` : "inset(0 100% 0 0)";
    };
    draw();
    countUp(el, this);
    await this._tween(run, st, { p: 1, duration: clamp(0.14 * N + 0.22, 0.32, 0.95), ease: "power1.inOut", onUpdate: draw });
    el.style.clipPath = "";
    L.skel.forEach(s => s.remove());
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
    // a hand, not a robot: fast launch, slight overshoot, settle; axes desynchronised for a curved path
    return Promise.all([
      this._tween(run, p, { x, duration: dur, ease: "back.out(1.35)", onUpdate: () => agent.place(p.x, p.y) }),
      this._tween(run, p, { y, duration: dur * 0.88, ease: "back.out(1.1)" })
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
    this._click(agent);
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
      if (kind === "text") Object.assign(f.dataset, { x, y, w, h });
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
    this.you.classList.toggle("on", on);
    if (!on) { if (this.boost !== 1) { this.boost = 1; this.setRate(); } return; }
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
    layers.forEach(L => this.inFlight.add(L.el));
    visible.filter(el => !layers.some(L => L.el === el)).forEach(el => this._release(el));
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
      const b = this._box(L.rect, { fill: "clear" });
      run.cleanup(() => b.remove());
      this._click(agent);
      gsap.fromTo(b, { scale: 1.015, opacity: 0.4 }, { scale: 1, opacity: 1, duration: 0.14, transformOrigin: "50% 50%" });
      if (L.kind === "text") {
        await this._morphText(run, L);
      } else if (L.kind === "box") {
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
      const b = await this._drag(run, agent, L.rect, { fill: L.kind === "box" || L.kind === "text" ? "clear" : "skeleton" });
      const m = marks.get(L); if (m) m.remove();
      if (run.cancelled) return;
      if (L.kind === "text") {
        L.skel = this._skeleton(L.el, "text");
        run.cleanup(() => L.skel.forEach(s => s.remove()));
        await this._morphText(run, L);
      } else if (L.kind === "box") {
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
  // Every held element is observed on its own: whatever scrolls into view (vertically or
  // inside a horizontal rail) is built by the swarm right there, batched per frame.
  _deferUntilVisible(els) {
    let batch = [], timer = 0;
    const flush = () => { timer = 0; const list = batch; batch = []; if (list.length) this._sectionConstruct(list); };
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        if (!this.held.has(e.target) || this.inFlight.has(e.target)) continue;
        this.inFlight.add(e.target);
        batch.push(e.target);
      }
      if (batch.length && !timer) timer = setTimeout(flush, 70);
    }, { rootMargin: "0px 0px -48px 0px", threshold: 0 });
    els.forEach(el => io.observe(el));
    this.observers.push(io);
  }
  async _sectionConstruct(els) {
    if (!this.enabled) { els.forEach(el => this._release(el)); return; }
    const run = new Run("section");
    this.runs.add(run);
    const layers = this._describe(els);
    layers.forEach(L => this.inFlight.add(L.el));
    els.filter(el => !layers.some(L => L.el === el)).forEach(el => this._release(el));
    const n = clamp(Math.ceil(layers.length / 3), 1, 4);
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
        const b = await this._drag(run, agent, L.rect, { fill: L.kind === "text" ? "clear" : "skeleton", dims: L.rect.w > 120 });
        if (run.cancelled) return;
        if (L.kind === "text") {
          L.skel = this._skeleton(L.el, "text");
          run.cleanup(() => L.skel.forEach(s => s.remove()));
          await this._morphText(run, L);
        } else {
          b.style.transition = "background-color 260ms";
          b.style.backgroundColor = "transparent";
          await this.revealEl(L.el, L.kind, 0.34);
        }
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
  restart() {
    if (!this.enabled) return this.skip();
    const pending = [...this.held];
    this.cancelRuns();
    this._hud(false);
    this.layer.querySelectorAll(".sw-box,.sw-frag,.sw-cross,.sw-guide,.trace-svg,.trace-head").forEach(n => n.remove());
    // cancelled builds release their layers; put the unbuilt ones back on hold for the sweep
    setTimeout(() => pending.forEach(el => { if (el.isConnected) { el.classList.add("sw-hold"); this.held.add(el); this.inFlight.delete(el); } }), 30);
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
