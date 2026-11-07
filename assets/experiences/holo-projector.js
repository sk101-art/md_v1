// Holo Projector (Team page): each of the 11 builders leaves the cursor ring, flies to one
// person's card, splits into 4 projector nodes (44 in total) that take the card's corners,
// and projects the card into existence: light cones sweep down, thousands of particles fly
// from the corners to trace the card outline, the photo's real edges and every text line;
// then the hologram takes on colour and dissolves seamlessly into the real card.
import { Agent } from "../motion/agents.js";
import { pageRect, lineRects } from "../motion/selection-geometry.js";
import { motion, isSmall, $$, clamp } from "../core/util.js";

const COBALT = [88, 120, 216], SEA = [79, 165, 157];
// default hologram palette (cobalt); a builder's role may carry its own (the satin violet one)
const BLUE = { main: COBALT, text: SEA, line: [120, 160, 255], streak: [143, 176, 255], hot: [234, 241, 255], scan: [200, 218, 255] };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// ---------- geometry helpers ----------
function perimeterPts(w, h, r, step) {
  const pts = [];
  const seg = (x0, y0, x1, y1) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step)); for (let i = 0; i < n; i++) pts.push({ x: x0 + (x1 - x0) * i / n, y: y0 + (y1 - y0) * i / n }); };
  const arc = (cx, cy, a0, a1) => { const n = Math.max(2, Math.round(Math.abs(a1 - a0) * r / step)); for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }); } };
  seg(r, 0, w - r, 0); arc(w - r, r, -Math.PI / 2, 0); seg(w, r, w, h - r); arc(w - r, h - r, 0, Math.PI / 2);
  seg(w - r, h, r, h); arc(r, h - r, Math.PI / 2, Math.PI); seg(0, h - r, 0, r); arc(r, r, Math.PI, Math.PI * 1.5);
  return pts;
}

// Sobel edges of an image drawn "object-fit: cover" into a w x h box. Returns sampled edge
// points (local to the box) and an edge layer canvas tinted in hologram blue.
function edgesOf(img, w, h, count, tint = BLUE.line) {
  const k = Math.min(1, 380 / w);                // analyse at <= 380px wide, then scale up
  const W = Math.max(8, Math.round(w * k)), H = Math.max(8, Math.round(h * k));
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d", { willReadFrequently: true });
  const ir = img.naturalWidth / img.naturalHeight, br = W / H;
  let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
  if (ir > br) { sw = sh * br; sx = (img.naturalWidth - sw) / 2; } else { sh = sw / br; sy = (img.naturalHeight - sh) / 2; }
  x.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
  let data;
  try { data = x.getImageData(0, 0, W, H).data; } catch { return { pts: [], layer: null }; }
  const g = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) g[i] = data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114;
  const mag = new Float32Array(W * H);
  let max = 1;
  for (let yy = 1; yy < H - 1; yy++) for (let xx = 1; xx < W - 1; xx++) {
    const i = yy * W + xx;
    const gx = -g[i - W - 1] - 2 * g[i - 1] - g[i + W - 1] + g[i - W + 1] + 2 * g[i + 1] + g[i + W + 1];
    const gy = -g[i - W - 1] - 2 * g[i - W] - g[i - W + 1] + g[i + W - 1] + 2 * g[i + W] + g[i + W + 1];
    const m = Math.hypot(gx, gy);
    mag[i] = m; if (m > max) max = m;
  }
  // tinted edge layer (the hologram line drawing)
  const layer = document.createElement("canvas");
  layer.width = W; layer.height = H;
  const lx = layer.getContext("2d");
  const out = lx.createImageData(W, H);
  const cand = [];
  for (let i = 0; i < W * H; i++) {
    const v = Math.min(1, (mag[i] / max) * 2.6);
    const a = v < 0.12 ? 0 : v;
    out.data[i * 4] = tint[0]; out.data[i * 4 + 1] = tint[1]; out.data[i * 4 + 2] = tint[2]; out.data[i * 4 + 3] = Math.round(a * 255);
    if (v > 0.32) cand.push(i);
  }
  lx.putImageData(out, 0, 0);
  // sample points on the strongest edges
  const pts = [];
  for (let n = 0; n < count && cand.length; n++) {
    const i = cand[(Math.random() * cand.length) | 0];
    pts.push({ x: ((i % W) + Math.random() * 0.8) / k, y: (((i / W) | 0) + Math.random() * 0.8) / k });
  }
  return { pts, layer };
}

export class HoloProjector {
  constructor({ scope, director }) {
    this.scope = scope;
    this.d = director;
    this.jobs = new Set();
    this.reserved = new Set(); // builder roles promised to a particular card
    this.raf = 0;
    scope.add(() => { this.jobs.forEach(j => j.kill()); cancelAnimationFrame(this.raf); });
  }

  get enabled() { return this.d && this.d.enabled; }

  /** Cards wait (empty containers) until they are on screen, then get a projection. */
  watch(cards) {
    if (!this.enabled) { cards.forEach(c => c.classList.remove("holo-wait")); return; }
    cards.forEach(c => c.dataset.holoNode && this.reserved.add(c.dataset.holoNode));
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        this.project(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.18 });
    cards.forEach(c => io.observe(c));
    this.scope.observe(io);
  }

  async project(card) {
    // after the loading intro and the page's own build, so the crew arrives together
    if (this.d.introPromise) await this.d.introPromise.catch(() => {});
    while ((this.d.busy || this.d.introActive) && this.scope.alive) await sleep(100);
    // one builder per card, from the ring; wait politely if they are all busy
    const t0 = performance.now();
    while (this.d.crew.available < 1 && performance.now() - t0 < 6000 && this.scope.alive) await sleep(90);
    if (!this.scope.alive) return;
    // a card can ask for one particular builder (Sathvikha's card is projected by the satin
    // violet one); that builder is kept for it, and every other card uses the rest of the crew
    const want = card.dataset.holoNode || "";
    const crew = this.d.crew;
    const mine = a => a.role.id === want;
    const reserved = a => this.reserved.has(a.role.id) && a.role.id !== want;
    if (want) {
      const t1 = performance.now();
      while (!crew.agents.some(a => mine(a) && crew.free.has(a)) && performance.now() - t1 < 8000 && this.scope.alive) await sleep(90);
      if (!this.scope.alive) return;
    }
    const R = pageRect(card);
    const near = { x: R.x + R.w / 2, y: R.y + R.h / 2 };
    let [lead] = want ? this.d._claim(1, near, { only: mine }) : this.d._claim(1, near, { exclude: reserved });
    if (!lead && want) [lead] = this.d._claim(1, near);
    if (want) this.reserved.delete(want);
    if (!lead) { card.classList.remove("holo-wait"); return; }
    if (lead.role.holo) card.style.setProperty("--holo-tint", `rgb(${lead.role.holo.main})`);
    const job = new Job(this, card, lead);
    this.jobs.add(job);
    try { await job.run(); } catch (e) { console.warn("[holo]", e); job.reveal(true); }
    finally { this.jobs.delete(job); }
  }

  tick() {
    if (this.raf) return;
    const loop = now => {
      this.raf = 0;
      this.jobs.forEach(j => j.paint(now));
      if (this.jobs.size) this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
}

class Job {
  constructor(owner, card, lead) {
    this.o = owner; this.card = card; this.lead = lead;
    this.pal = (lead.role && lead.role.holo) || BLUE;
    this.nodes = [lead];
    this.alive = true;
    this.p = [];        // particles
    this.scan = -1;     // scanline y (local), -1 = off
    this.beams = 0;     // cone intensity
    this.trace = 0;     // 0..1 how much of the edge layer is revealed (by scanline)
    this.fade = 1;      // overall hologram opacity
  }
  kill() { this.alive = false; this.cleanup(); this.reveal(true); }

  move(a, x, y, dur, delay = 0) {
    return new Promise(res => {
      const p = { x: a.x, y: a.y };
      gsap.to(p, { x, y, duration: dur, delay, ease: "power3.inOut", onUpdate: () => a.place(p.x, p.y), onComplete: res });
    });
  }

  async run() {
    const { card } = this;
    const photo = card.querySelector(".portrait img:not(.ph-rays), .avatar img");
    const big = !!photo; // portraits get the dense trace
    if (photo && !photo.complete) await new Promise(r => { photo.onload = photo.onerror = r; });
    const R = pageRect(card);
    this.R = R;
    const W = R.w, H = R.h;
    const rad = parseFloat(getComputedStyle(card).borderTopLeftRadius) || 20;

    // canvas over the (still empty) container, in document space
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cv = document.createElement("canvas");
    cv.className = "holo-cv";
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.cssText = `left:${R.x}px;top:${R.y}px;width:${W}px;height:${H}px`;
    this.o.d.layer.append(cv);
    this.cv = cv; this.ctx = cv.getContext("2d"); this.dpr = dpr;

    // 1) the builder arrives at the centre of the container as a node
    this.lead.setMode("dot");
    this.lead.el.classList.add("holo-node");
    await this.move(this.lead, R.x + W / 2, R.y + H / 2, 0.75);
    if (!this.alive) return;

    // 2) it replicates into four nodes, one per corner (11 builders x 4 = 44 projectors)
    const cx = R.x + W / 2, cy = R.y + H / 2;
    for (let i = 0; i < 3; i++) {
      const r = new Agent(this.o.d.layer, this.lead.role, 200 + i);
      r.setMode("dot");
      r.el.classList.add("holo-node");
      r.el.style.opacity = "1";
      r.place(cx, cy);
      r.el.animate([{ transform: `translate3d(${cx}px,${cy}px,0) scale(0)` }, { transform: `translate3d(${cx}px,${cy}px,0) scale(1)` }], { duration: 260, delay: i * 60 });
      this.nodes.push(r);
    }
    await sleep(220);
    const inset = 3;
    this.corners = [
      { x: inset, y: inset }, { x: W - inset, y: inset },
      { x: W - inset, y: H - inset }, { x: inset, y: H - inset }
    ];
    await Promise.all(this.nodes.map((n, i) => this.move(n, R.x + this.corners[i].x, R.y + this.corners[i].y, 0.55, i * 0.05)));
    if (!this.alive) return;
    this.nodes.forEach(n => n.el.classList.add("projecting"));

    // 3) build the targets: outline, photo edges, avatar, every text line
    const local = el => { const r = el.getBoundingClientRect(), c = card.getBoundingClientRect(); return { x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height }; };
    const targets = [];
    const add = (x, y, kind) => targets.push({ x, y, kind });
    perimeterPts(W, H, rad, big ? 4 : 5).forEach(p => add(p.x, p.y, "edge"));
    if (photo) {
      const box = local(photo.closest(".portrait") || photo);
      perimeterPts(box.w, box.h, 14, 5).forEach(p => add(box.x + p.x, box.y + p.y, "edge"));
      const e = edgesOf(photo, box.w, box.h, isSmall() ? 1100 : 1800, this.pal.line);
      e.pts.forEach(p => add(box.x + p.x, box.y + p.y, "img"));
      this.edgeLayer = e.layer; this.edgeBox = box;
    } else {
      const av = card.querySelector(".portrait, .avatar");
      if (av) { const b = local(av); perimeterPts(b.w, b.h, 16, 3).forEach(p => add(b.x + p.x, b.y + p.y, "edge")); for (let i = 0; i < 70; i++) add(b.x + b.w * (0.28 + Math.random() * 0.44), b.y + b.h * (0.32 + Math.random() * 0.36), "img"); }
    }
    $$("h3, h4, .role, p, .links a, .chips span", card).forEach(t => {
      lineRects(t, 8).forEach(l => {
        const lx = l.x - R.x, ly = l.y - R.y;
        for (let x = 0; x < l.w; x += big ? 2.6 : 3.2) add(lx + x, ly + l.h * (0.2 + Math.random() * 0.6), "text");
      });
    });
    const now = performance.now();
    const traceMs = big ? 2100 : 1500;
    this.traceMs = traceMs;
    this.p = targets.map((t, i) => {
      // nearest pair of corners shares the work; launch follows the scanline from top to bottom
      const c = this.corners[t.x < W / 2 ? (t.y < H / 2 ? 0 : 3) : (t.y < H / 2 ? 1 : 2)];
      const alt = this.corners[(i * 7) % 4];
      const src = Math.random() < 0.7 ? c : alt;
      const launch = now + (t.y / H) * traceMs * 0.85 + Math.random() * 140;
      return { sx: src.x, sy: src.y, tx: t.x, ty: t.y, t0: launch, dur: 420 + Math.random() * 420, kind: t.kind, s: t.kind === "img" ? 0.75 + Math.random() * 0.6 : t.kind === "edge" ? 1.1 : 0.8 };
    });
    this.start = now;
    this.o.tick();

    // 4) light cones sweep the container top to bottom while the particles land
    await new Promise(res => gsap.to(this, {
      beams: 1, duration: 0.3,
      onComplete: () => { this.scan = 0; gsap.to(this, { scan: H, duration: traceMs / 1000 * 1.05, ease: "none", onComplete: res }); }
    }));
    if (!this.alive) return;
    await sleep(380);

    // 5) colour: the hologram takes on colour and becomes the real card
    gsap.to(this, { beams: 0, duration: 0.5 });
    this.reveal(false, big);
    await new Promise(res => gsap.to(this, { fade: 0, duration: big ? 1.5 : 0.9, delay: big ? 0.35 : 0.15, ease: "power2.inOut", onComplete: res }));

    // 6) the four nodes fold back into one, which returns to the cursor ring
    this.nodes.forEach(n => n.el.classList.remove("projecting"));
    await Promise.all(this.nodes.map(n => this.move(n, R.x + W / 2, R.y + H / 2, 0.45)));
    this.nodes.slice(1).forEach(n => n.remove());
    this.cleanup();
    this.lead.el.classList.remove("holo-node");
    this.o.d.crew.release([this.lead]);
  }

  reveal(instant, big) {
    const card = this.card;
    if (instant || motion.reduced) { card.classList.remove("holo-wait"); return; }
    card.classList.add("holo-colour");
    card.classList.remove("holo-wait");
    // tint -> true colour, and the hologram scanlines fade away
    setTimeout(() => card.classList.add("holo-true"), big ? 260 : 120);
    setTimeout(() => card.classList.remove("holo-colour", "holo-true"), big ? 2200 : 1300);
  }

  cleanup() {
    if (this.cv) this.cv.remove();
    this.nodes.slice(1).forEach(n => n.el.isConnected && n.remove());
  }

  paint(now) {
    if (!this.cv || !this.alive) return;
    const { ctx, dpr, R, pal } = this;
    const W = R.w, H = R.h;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = this.fade;

    // light cones from each projector node to the band being traced
    if (this.beams > 0.01 && this.scan >= 0) {
      const y = Math.min(H, this.scan);
      this.corners.forEach((c, i) => {
        const g = ctx.createLinearGradient(c.x, c.y, W / 2, y);
        g.addColorStop(0, `rgba(${pal.main},${0.22 * this.beams})`);
        g.addColorStop(1, `rgba(${pal.main},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(i % 3 === 0 ? 0 : W * 0.15, y - 10);
        ctx.lineTo(i % 3 === 0 ? W * 0.85 : W, y + 10);
        ctx.closePath();
        ctx.fill();
      });
    }

    // the photo's edge drawing, revealed by the scanline (the actual hologram line art)
    if (this.edgeLayer && this.scan > 0) {
      const b = this.edgeBox, cut = clamp(this.scan - b.y, 0, b.h);
      if (cut > 0) {
        ctx.save();
        ctx.globalAlpha = this.fade * 0.85;
        ctx.beginPath(); ctx.rect(b.x, b.y, b.w, cut); ctx.clip();
        ctx.drawImage(this.edgeLayer, b.x, b.y, b.w, b.h);
        ctx.restore();
        ctx.globalAlpha = this.fade;
      }
    }

    // particles: streak from a corner, land, and keep glowing as part of the projection
    for (const p of this.p) {
      if (now < p.t0) continue;
      const t = Math.min(1, (now - p.t0) / p.dur), e = ease(t);
      const x = p.sx + (p.tx - p.sx) * e, y = p.sy + (p.ty - p.sy) * e;
      if (t < 1) {
        const e2 = ease(Math.max(0, t - 0.12));
        ctx.strokeStyle = `rgba(${pal.streak},${0.5 * this.fade})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(p.sx + (p.tx - p.sx) * e2, p.sy + (p.ty - p.sy) * e2);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      const col = p.kind === "text" ? pal.text : pal.main;
      ctx.fillStyle = t < 1 ? `rgba(${pal.hot},0.95)` : `rgba(${col},${p.kind === "img" ? 0.75 : 0.9})`;
      ctx.fillRect(x - p.s / 2, y - p.s / 2, p.s, p.s);
    }

    // the scanline itself
    if (this.scan >= 0 && this.scan < H && this.beams > 0.05) {
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, `rgba(${pal.streak},0)`); g.addColorStop(0.5, `rgba(${pal.scan},${0.9 * this.beams})`); g.addColorStop(1, `rgba(${pal.streak},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, this.scan - 1, W, 2);
    }
    ctx.globalAlpha = 1;
  }
}
