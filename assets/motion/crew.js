// The Crew: exactly 11 builders (one for each core team role). They assemble in a ring on a
// blank screen ("Assigning builders"), become cursors to build the site, and between jobs they
// orbit the visitor's pointer as small particles until the swarm needs them again.
import { Agent, ROLES, visitor } from "./agents.js";
import { isSmall } from "../core/util.js";

export const CREW_SIZE = 11;

export class Crew {
  constructor(layer) {
    this.layer = layer;
    this.agents = [];
    this.free = new Set();
    this.spin = 0;
    this.last = 0;
    this.raf = 0;
    this.dim = false;
    this.mouse = false;
    window.addEventListener("pointermove", e => { this.mouse = e.pointerType === "mouse"; }, { passive: true });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) this.kick(); });
  }

  ensure() {
    if (this.agents.length) return;
    for (let i = 0; i < CREW_SIZE; i++) {
      const a = new Agent(this.layer, ROLES[i % ROLES.length], i);
      a.crew = true;
      a.setMode("dot");
      a.el.style.opacity = "0";
      const c = this.centre();
      a.place(c.x, c.y);
      this.agents.push(a);
      this.free.add(a);
    }
  }

  // where the idle ring lives: around the visitor's pointer, or parked in a corner on touch
  centre() {
    if (this.mouse && visitor.x > -1e4) return { x: visitor.x, y: visitor.y };
    const vw = window.innerWidth, vh = window.innerHeight;
    return { x: window.scrollX + vw - 46, y: window.scrollY + vh - (isSmall() ? 132 : 54) };
  }

  /** Intro: dots arrive one by one on a circle in the middle of a blank screen. */
  async intro({ fast = false } = {}) {
    this.ensure();
    const vw = window.innerWidth, vh = window.innerHeight;
    const cx = window.scrollX + vw / 2, cy = window.scrollY + vh / 2 - 10;
    const R = isSmall() ? 46 : 58;
    const ui = document.createElement("div");
    ui.className = "crew-intro";
    ui.setAttribute("role", "status");
    ui.innerHTML = `<b>Assigning builders</b><span class="ci-n">00 / ${CREW_SIZE}</span><span class="ci-role">&nbsp;</span>`;
    document.body.append(ui);
    this.pause = true; // the orbit loop leaves the ring alone during the intro
    const step = fast ? 45 : 95;
    const pos = i => {
      const ang = -Math.PI / 2 + (i / CREW_SIZE) * Math.PI * 2;
      return { x: cx + Math.cos(ang) * R, y: cy + Math.sin(ang) * R, ang };
    };
    for (let i = 0; i < CREW_SIZE; i++) {
      const a = this.agents[i], p = pos(i);
      a.place(p.x, p.y);
      a.el.style.opacity = "1";
      a.el.animate([{ transform: `translate3d(${cx}px, ${cy}px, 0) scale(0)` }, { transform: `translate3d(${p.x}px, ${p.y}px, 0) scale(1)` }], { duration: 420, easing: "cubic-bezier(.34,1.56,.64,1)" });
      ui.querySelector(".ci-n").textContent = `${String(i + 1).padStart(2, "0")} / ${CREW_SIZE}`;
      ui.querySelector(".ci-role").textContent = a.role.name;
      await new Promise(r => setTimeout(r, step));
    }
    // a full turn of the assembled ring, then hand over to the site build
    ui.querySelector("b").textContent = "Builders assigned";
    ui.querySelector(".ci-role").textContent = "Design · Build · Motion · Review · Ship";
    await new Promise(res => {
      const t0 = performance.now(), dur = fast ? 380 : 720;
      const tick = now => {
        const k = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        this.agents.forEach((a, i) => {
          const ang = -Math.PI / 2 + (i / CREW_SIZE) * Math.PI * 2 + e * Math.PI * 2;
          const r = R * (1 - 0.12 * Math.sin(k * Math.PI));
          a.place(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
        });
        k < 1 ? requestAnimationFrame(tick) : res();
      };
      requestAnimationFrame(tick);
    });
    ui.classList.add("out");
    setTimeout(() => ui.remove(), 400);
    this.pause = false;
    this.kick();
  }

  /** Take n builders off the ring, nearest to `near` first. They become cursors. */
  claim(n, near) {
    this.ensure();
    const pool = [...this.free];
    if (near) pool.sort((a, b) => Math.hypot(a.x - near.x, a.y - near.y) - Math.hypot(b.x - near.x, b.y - near.y));
    const out = pool.slice(0, n);
    out.forEach(a => { this.free.delete(a); a.setMode("cursor"); a.el.style.opacity = "1"; });
    return out;
  }
  /** Builders finished: they turn back into particles and rejoin the ring. */
  release(list) {
    list.filter(a => a.crew).forEach(a => { a.setMode("dot"); this.free.add(a); });
    list.filter(a => !a.crew).forEach(a => a.remove());
    this.kick();
  }
  get available() { return this.free.size; }

  kick() { if (!this.raf && this.agents.length) { this.last = performance.now(); this.raf = requestAnimationFrame(t => this.frame(t)); } }
  frame(now) {
    this.raf = 0;
    if (document.hidden) return;
    const dt = Math.min(64, now - this.last) / 1000;
    this.last = now;
    this.spin += dt * 0.55;
    if (!this.pause && this.free.size) {
      const c = this.centre();
      const ring = [...this.free].sort((a, b) => a.index - b.index);
      const R = this.mouse ? 30 : 16;
      ring.forEach((a, j) => {
        const ang = this.spin + (j / ring.length) * Math.PI * 2;
        const r = R + Math.sin(now / 520 + a.index) * 2.2; // breathing
        const tx = c.x + Math.cos(ang) * r, ty = c.y + Math.sin(ang) * r;
        const k = 0.09 + (a.index % 4) * 0.035;            // staggered lag = comet-like trail
        a.place(a.x + (tx - a.x) * k, a.y + (ty - a.y) * k);
      });
    }
    this.raf = requestAnimationFrame(t => this.frame(t));
  }
  setDim(on) { this.layer.classList.toggle("crew-dim", on); }
  hideAll(on) { this.layer.classList.toggle("crew-off", on); }
}
