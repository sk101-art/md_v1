// Screen-space particle field: one fixed canvas above content, particles kept in
// document coordinates so donor emission, flight and local construction share one space.
import { clamp } from "../core/util.js";

const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class ParticleField {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.className = "build-layer";
    this.canvas.setAttribute("aria-hidden", "true");
    document.body.append(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.p = [];
    this.scan = null;          // { x, w, y } materialization scan line in page coords
    this.outlines = [];        // faint strokes drawn once a group has formed
    this.running = false;
    this._raf = 0;
    this._onResize = () => this.resize();
    window.addEventListener("resize", this._onResize, { passive: true });
    this.resize();
  }
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    this.canvas.width = Math.round(window.innerWidth * dpr);
    this.canvas.height = Math.round(window.innerHeight * dpr);
  }
  add(list) { this.p.push(...list); }
  clear() { this.p = []; this.outlines = []; this.scan = null; this._paint(performance.now()); }

  start(onFrame) {
    this.onFrame = onFrame;
    if (this.running) return;
    this.running = true;
    const loop = now => {
      if (!this.running) return;
      this._paint(now);
      if (this.onFrame) this.onFrame(now);
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }
  stop() { this.running = false; cancelAnimationFrame(this._raf); }

  // position along the curved flight path
  pos(p, t) {
    const e = easeInOut(t);
    const u = 1 - e;
    return {
      x: u * u * p.sx + 2 * u * e * p.cx + e * e * p.tx,
      y: u * u * p.sy + 2 * u * e * p.cy + e * e * p.ty
    };
  }

  _paint(now) {
    const { ctx, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.translate(-window.scrollX, -window.scrollY);

    // faint formed outlines (chassis / containers) that read as construction lines
    for (const o of this.outlines) {
      const a = clamp((now - o.t0) / 400, 0, 1) * o.alpha;
      if (a <= 0) continue;
      ctx.globalAlpha = a;
      ctx.strokeStyle = o.color;
      ctx.lineWidth = o.width || 1;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(o.x, o.y, o.w, o.h, o.r); else ctx.rect(o.x, o.y, o.w, o.h);
      ctx.stroke();
    }

    for (const p of this.p) {
      if (now < p.t0) continue;
      const t = clamp((now - p.t0) / p.dur, 0, 1);
      p.t = t;
      let alpha = p.alpha ?? 1;
      if (this.scan && p.ty > this.scan.y - 2 && p.gone !== true) {
        p.fade = (p.fade || 0) + 0.08; // body has materialized past this particle
      }
      if (p.fade) alpha *= Math.max(0, 1 - p.fade);
      if (alpha <= 0.01) continue;
      const cur = this.pos(p, t);
      ctx.globalAlpha = alpha;
      if (t < 1) {
        const prev = this.pos(p, Math.max(0, t - 0.07));
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * 0.7;
        ctx.globalAlpha = alpha * 0.35;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(cur.x, cur.y);
        ctx.stroke();
        ctx.globalAlpha = alpha;
      }
      const shimmer = t >= 1 ? 0.85 + 0.15 * Math.sin(now / 180 + p.seed) : 1;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha * shimmer;
      ctx.beginPath();
      ctx.arc(cur.x, cur.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.scan) {
      const { x, w, y } = this.scan;
      ctx.globalAlpha = 0.9;
      const g = ctx.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, "rgba(88,120,216,0)");
      g.addColorStop(0.5, "rgba(88,120,216,0.9)");
      g.addColorStop(1, "rgba(88,120,216,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - 10, y - 1, w + 20, 2);
    }
    ctx.globalAlpha = 1;
  }

  /** Small celebratory burst — used only after a real server confirmation. */
  burst(x, y, colors = ["#5878D8", "#A6D8D4", "#E7D9BD"]) {
    const now = performance.now();
    const list = [];
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 90;
      list.push({ sx: x, sy: y, cx: x + Math.cos(a) * d * 0.6, cy: y + Math.sin(a) * d * 0.6 - 20, tx: x + Math.cos(a) * d, ty: y + Math.sin(a) * d, t0: now + Math.random() * 80, dur: 700 + Math.random() * 300, size: 1.6, color: colors[i % colors.length], seed: i, alpha: 1 });
    }
    this.add(list);
    this.start();
    setTimeout(() => {
      list.forEach(p => (p.fade = 1));
      this.p = this.p.filter(p => !list.includes(p));
      if (!this.p.length) { this.stop(); this._paint(performance.now()); }
    }, 1300);
  }

  destroy() {
    this.stop();
    window.removeEventListener("resize", this._onResize);
    this.canvas.remove();
  }
}
