// The Crew: exactly 11 builders (one for each core team role). They assemble in a ring on a
// blank screen ("Assigning builders"), become cursors to build the site, and between jobs they
// orbit the visitor's pointer as small particles until the swarm needs them again.
import { Agent, ROLES, visitor } from "./agents.js";
import { isSmall } from "../core/util.js";
import { makeSvg, powerNetwork } from "../graphics/power-fx.js";
const sleep = ms => new Promise(r => setTimeout(r, ms));

export const CREW_SIZE = 11;

export class Crew {
  constructor(layer) {
    this.layer = layer;
    this.agents = [];
    this.free = new Set();
    this.spin = 0;
    this.spinV = 0.55;   // rad/s, eased toward its resting speed
    this.rCur = 30;      // current ring radius, eased toward the target
    this.anchor = null;  // during the intro the ring turns around the logo, not the pointer
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
    if (this.anchor) return this.anchor;
    // centred on the arrow's body, not its tip (the tip is the hotspot; the eye reads the shape)
    if (this.mouse && visitor.x > -1e4) return { x: visitor.x + 5, y: visitor.y + 8 };
    const vw = window.innerWidth, vh = window.innerHeight;
    return { x: window.scrollX + vw - 46, y: window.scrollY + vh - (isSmall() ? 132 : 54) };
  }

  /** Intro: 11 empty glass nodes on a blank screen light up clockwise as each builder arrives;
   *  then the club logo appears in the centre and a glow flows from it along circuit traces
   *  into every node, which powers the builders on. Everything is laid out relative to the
   *  live centre of the screen, so a window or panel resizing mid-intro keeps it centred. */
  async intro({ fast = false } = {}) {
    this.ensure();
    const R = isSmall() ? 70 : 92;
    const BOX = R * 2 + 120;                                // local square the drawing lives in
    const C = BOX / 2;
    const off = i => {                                      // clockwise from 12 o'clock
      const ang = -Math.PI / 2 + (i / CREW_SIZE) * Math.PI * 2;
      return { x: Math.cos(ang) * R, y: Math.sin(ang) * R, ang };
    };
    const centre = () => ({ x: window.scrollX + window.innerWidth / 2, y: window.scrollY + window.innerHeight / 2 - 16 });
    this.introCentre = centre;

    const stage = document.createElement("div");
    stage.className = "crew-stage";
    stage.setAttribute("role", "status");
    stage.innerHTML = `<div class="crew-box" style="width:${BOX}px;height:${BOX}px"></div>
      <div class="crew-label"><b>Assigning builders</b><span class="ci-n">00 / ${CREW_SIZE}</span><span class="ci-role">&nbsp;</span></div>`;
    document.body.append(stage);
    this.stage = stage;
    const box = stage.querySelector(".crew-box");
    const svg = makeSvg(box, BOX, BOX, "crew-svg");
    const nodes = Array.from({ length: CREW_SIZE }, (_, i) => {
      const n = document.createElement("i");
      n.className = "crew-node";
      const p = off(i);
      n.style.left = `${C + p.x}px`; n.style.top = `${C + p.y}px`;
      n.style.setProperty("--c", this.agents[i].role.color);
      box.append(n);
      return n;
    });
    nodes.forEach((n, i) => n.animate([{ opacity: 0, transform: "translate(-50%,-50%) scale(.6)" }, { opacity: 1, transform: "translate(-50%,-50%) scale(1)" }], { duration: 360, delay: i * 18, easing: "cubic-bezier(.34,1.4,.64,1)", fill: "backwards" }));

    // builders sit in their nodes; keep them there if the viewport changes size
    let seated = 0;
    const seat = () => { const c = centre(); for (let i = 0; i < seated; i++) { const p = off(i); this.agents[i].place(c.x + p.x, c.y + p.y); } };
    const onResize = () => { if (this.pause) seat(); if (this.anchor) this.anchor = centre(); };
    window.addEventListener("resize", onResize);

    this.pause = true;
    await sleep(fast ? 160 : 320);
    const step = fast ? 55 : 110;
    for (let i = 0; i < CREW_SIZE; i++) {
      const a = this.agents[i];
      seated = i + 1;
      seat();
      a.el.style.opacity = "1";
      a.el.animate([{ opacity: 0, filter: "blur(4px)" }, { opacity: 1, filter: "none" }], { duration: 300 });
      nodes[i].classList.add("lit");
      stage.querySelector(".ci-n").textContent = `${String(i + 1).padStart(2, "0")} / ${CREW_SIZE}`;
      stage.querySelector(".ci-role").textContent = a.role.name;
      await sleep(step);
    }

    // the club logo arrives in the centre, glowing
    stage.querySelector("b").textContent = "Powering up";
    stage.querySelector(".ci-role").textContent = "MAD Club";
    const logo = document.createElement("img");
    logo.className = "crew-logo";
    logo.src = "assets/brand/mad-logo.svg";
    logo.alt = "";
    box.append(logo);
    this.logo = logo;
    await logo.animate([{ opacity: 0, transform: "translate(-50%,-50%) scale(.5)" }, { opacity: 1, transform: "translate(-50%,-50%) scale(1)" }], { duration: 420, easing: "cubic-bezier(.34,1.5,.64,1)", fill: "forwards" }).finished.catch(() => {});
    logo.classList.add("charging");

    // a glow flows from the logo along a circuit into each node; each node powers on as it arrives
    const ends = nodes.map((_, i) => { const p = off(i); return { x: C + p.x, y: C + p.y, ang: p.ang }; });
    await powerNetwork(svg, { x: C, y: C }, ends, {
      r0: 30, lay: fast ? 260 : 420, flow: fast ? 480 : 760, stagger: fast ? 10 : 24,
      onArrive: i => { nodes[i].classList.add("powered"); this.agents[i].el.animate([{ transform: this.agents[i].el.style.transform + " scale(1)" }, { transform: this.agents[i].el.style.transform + " scale(1.9)" }, { transform: this.agents[i].el.style.transform + " scale(1)" }], { duration: 360 }); }
    }).done;
    stage.querySelector("b").textContent = "Builders powered";
    stage.querySelector(".ci-role").textContent = "Design · Build · Motion · Review · Ship";
    svg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, delay: 120, fill: "forwards" });

    // ALIVE: the power sets the ring in motion around the logo, starting exactly where each dot
    // sits, spinning up and settling; that same orbit later follows the visitor's cursor.
    const c = centre();
    this.agents.forEach(a => { a.oc = { x: c.x, y: c.y }; });
    this.anchor = c;
    this.rCur = R;
    this.anchorR = R;
    this.spin = -Math.PI / 2;
    this.spinV = 5.2;
    nodes.forEach((n, i) => n.animate([{ opacity: 1, transform: "translate(-50%,-50%) scale(1)" }, { opacity: 0, transform: "translate(-50%,-50%) scale(1.6)" }], { duration: 520, delay: i * 14, fill: "forwards", easing: "ease-out" }));
    this.pause = false;
    this.kick();
    await sleep(fast ? 420 : 760);
    this._introCleanup = () => window.removeEventListener("resize", onResize);
  }

  /** The logo leaves the centre and settles into its place in the nav; it stays there (as a
   *  stand-in) until the swarm has built the real brand mark underneath it. */
  async landLogo(target) {
    const stage = this.stage, logo = this.logo;
    if (!stage) return;
    this.stage = this.logo = null;
    stage.querySelectorAll(".crew-node, .crew-label").forEach(n => n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 360, fill: "forwards" }));
    // the ring lets go of the logo and drifts to the visitor's pointer, still turning
    this.anchor = null;
    this.anchorR = null;
    this._introCleanup && this._introCleanup();
    if (!logo || !target) { setTimeout(() => stage.remove(), 400); return; }
    const a = logo.getBoundingClientRect(), z = target.getBoundingClientRect();
    logo.classList.remove("charging");
    const dx = z.left + z.width / 2 - (a.left + a.width / 2), dy = z.top + z.height / 2 - (a.top + a.height / 2);
    const k = z.height / a.height;
    await logo.animate([
      { transform: "translate(-50%,-50%) scale(1)" },
      { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 - 40}px)) scale(${(1 + k) / 2 + 0.15}) rotate(-6deg)`, offset: 0.5 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${k})` }
    ], { duration: 820, easing: "cubic-bezier(.65,0,.35,1)", fill: "forwards" }).finished.catch(() => {});
    // hand over to the real logo once the swarm has built it
    const brand = target.closest("[data-sw]") || target;
    const done = () => { logo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" }); setTimeout(() => stage.remove(), 220); };
    const t0 = performance.now();
    const wait = () => (!brand.classList.contains("sw-hold") || performance.now() - t0 > 6000 ? done() : requestAnimationFrame(wait));
    wait();
  }

  /** Take n builders off the ring, nearest to `near` first. They become cursors. */
  claim(n, near) {
    this.ensure();
    const pool = [...this.free];
    if (near) pool.sort((a, b) => Math.hypot(a.x - near.x, a.y - near.y) - Math.hypot(b.x - near.x, b.y - near.y));
    const out = pool.slice(0, n);
    out.forEach(a => { this.free.delete(a); a.oc = null; a.setMode("cursor"); a.el.style.opacity = "1"; });
    return out;
  }
  /** Builders finished: they turn back into particles and rejoin the ring. */
  release(list) {
    list.filter(a => a.crew).forEach(a => { a.setMode("dot"); a.returning = true; a.oc = { x: a.x, y: a.y }; this.free.add(a); });
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
    this.spinV += (0.55 - this.spinV) * Math.min(1, dt * 1.6);
    this.spin += dt * this.spinV;
    if (!this.pause && this.free.size) {
      const c = this.centre();
      const ring = [...this.free].sort((a, b) => a.index - b.index);
      const Rt = this.anchorR || (this.mouse ? 30 : 16);
      this.rCur += (Rt - this.rCur) * Math.min(1, dt * 3);
      const R = this.rCur;
      const breathe = Math.sin(now / 700) * 1.5;            // the whole ring breathes together
      ring.forEach((a, j) => {
        // each builder follows its own slightly-lagged copy of the centre (comet trail while
        // moving), but sits on one exact circle around it, so at rest the ring is perfectly round
        if (!a.oc) a.oc = { x: a.x, y: a.y };
        const k = this.anchor ? 1 : 0.16 + (a.index % 4) * 0.05;
        a.oc.x += (c.x - a.oc.x) * k;
        a.oc.y += (c.y - a.oc.y) * k;
        const slot = ring.length === CREW_SIZE ? a.index : j;
        const ang = this.spin + (slot / ring.length) * Math.PI * 2;
        const tx = a.oc.x + Math.cos(ang) * (R + breathe), ty = a.oc.y + Math.sin(ang) * (R + breathe);
        // returning from a job: glide in rather than jump onto the ring
        if (a.returning) {
          a.place(a.x + (tx - a.x) * 0.18, a.y + (ty - a.y) * 0.18);
          if (Math.hypot(tx - a.x, ty - a.y) < 3) a.returning = false;
        } else a.place(tx, ty);
      });
    }
    this.raf = requestAnimationFrame(t => this.frame(t));
  }
  setDim(on) { this.layer.classList.toggle("crew-dim", on); }
  hideAll(on) { this.layer.classList.toggle("crew-off", on); }
}
