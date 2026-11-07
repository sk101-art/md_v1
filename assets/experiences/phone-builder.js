// Particle Build: user-triggered phone construction from real UI donors.
// IDLE -> READY -> ACTIVATING -> EMITTING -> CONVERGING -> CHASSIS -> CONTAINERS ->
// MATERIALIZING -> LOGO_APPROACH -> POWERING_UP -> COMPLETE -> RESETTING
import { ParticleField } from "../graphics/particle-field.js";
import { perimeter, fill, rectOfEl, radiusPx } from "../graphics/geometry-sampling.js";
import { $, $$, motion, isSmall, clamp, wait } from "../core/util.js";
import { makeSvg, evenEndpoints, powerNetwork } from "../graphics/power-fx.js";

const COPY = {
  READY: ["Stage is empty", "Press Build to assemble the phone"],
  ACTIVATING: ["Gathering parts", "Selecting donor components"],
  EMITTING: ["Releasing particles", "Only from the site's tabs"],
  CONVERGING: ["In flight", "Particles converging on the stage"],
  CHASSIS: ["Chassis formed", "Rails, corners, buttons, camera"],
  CONTAINERS: ["Tracing the interface", "Screen, header, tabs, cards"],
  MATERIALIZING: ["Materializing", "Satin body and glass screen"],
  LOGO_APPROACH: ["Club logo incoming", "The logo powers the phone"],
  POWERING_UP: ["Powering up", "Booting MAD OS"],
  INSTALLING: ["Installing MAD", "The club logo becomes an app"],
  COMPLETE: ["Live", "Tap apps · drag beside the phone to spin it"],
  RESETTING: ["Clearing the stage", ""]
};

export class PhoneBuilder {
  constructor({ scope, director, os, onLive }) {
    this.scope = scope;
    this.os = os;
    this.director = director;
    this.onLive = onLive;
    this.stage = $(".stage");
    this.phone = $("#phone");
    this.btn = $("#build-btn");
    this.panel = $(".build-panel");
    this.field = null;
    this.state = "IDLE";
    this.token = 0;
    if (!this.stage || !this.phone || !this.btn) return;

    this.set("READY");
    scope.on(this.btn, "click", async () => {
      if (this.busy) return this.skip();
      if (this.state === "COMPLETE") await this.reset();
      this.build();
    });
    const reset = $("#build-reset");
    reset && scope.on(reset, "click", () => this.reset());
    scope.add(() => this.destroy());
  }

  get busy() { return !["IDLE", "READY", "COMPLETE"].includes(this.state); }

  set(state, progress) {
    this.state = state;
    this.stage.dataset.phase = state.toLowerCase();
    const c = COPY[state];
    if (c) {
      const b = $("#build-status b"), s = $("#build-status span");
      if (b) b.textContent = c[0];
      if (s) s.textContent = c[1];
    }
    if (progress != null) { const bar = $(".build-progress i"); if (bar) bar.style.width = `${progress}%`; }
    const label = $(".build-btn .label");
    if (label) label.textContent = this.busy ? "Skip build" : state === "COMPLETE" ? "Rebuild" : "Build the phone";
    this.panel && this.panel.classList.toggle("done", state === "COMPLETE");
    document.dispatchEvent(new CustomEvent("mad:build", { detail: { state } }));
  }

  // The phone is made only from the website's own tabs: Home, Events, About, Achievements,
  // Team, Contact (or the bottom tab bar on phones). Everything the club is, becomes the device.
  donors() {
    const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const top = $$(".nav-links a").filter(vis);
    return top.length ? top : $$(".tabbar a").filter(vis);
  }

  targets() {
    const ph = this.phone;
    const R = rectOfEl(ph);
    const scale = R.w / 300;
    const small = isSmall();
    const k = small ? 1.4 : 1; // sparser sampling on small screens
    const T = { chassis: [], containers: [], detail: [], meta: { R, scale } };
    const push = (arr, pts, color, size) => pts.forEach(p => arr.push({ ...p, color, size }));

    // CHASSIS: rounded perimeter (outer + inner rail), side buttons, camera island
    push(T.chassis, perimeter(R, 4.2 * k, 50 * scale), "#3E4A5C", 1.5);
    const inner = { x: R.x + 5 * scale, y: R.y + 5 * scale, w: R.w - 10 * scale, h: R.h - 10 * scale };
    push(T.chassis, perimeter(inner, 7 * k, 45 * scale), "#8C98AA", 1.1);
    $$(".phone-btn", ph).forEach(b => push(T.chassis, perimeter(rectOfEl(b), 3, 1), "#3E4A5C", 1.3));
    const island = $(".phone-island", ph);
    if (island) push(T.chassis, perimeter(rectOfEl(island), 3.2, 14 * scale), "#18212F", 1.3);

    // CONTAINERS: screen and every real interface region on it
    const screen = $(".phone-screen", ph);
    if (screen) push(T.containers, perimeter(rectOfEl(screen), 5.5 * k, 40 * scale), "#5878D8", 1.25);
    const regions = [".os-widget", ".os-grid .ic-tile", ".os-dock", ".os-dock .ic-tile", ".os-ind i"];
    regions.forEach(sel => $$(sel, ph).forEach(el => {
      const r = rectOfEl(el);
      if (r.w < 2) return;
      push(T.containers, perimeter(r, 5 * k, radiusPx(el, scale)), "#5878D8", 1.05);
    }));
    // DETAIL: sparse fill marks inside regions (text rows, tab labels)
    $$(".os-time, .os-sys, .w-k, .w-big, .w-row, .w-latest, .os-grid .ic-label", ph).forEach(el => {
      const r = rectOfEl(el);
      if (r.w < 2) return;
      push(T.detail, fill({ x: r.x, y: r.y + r.h * 0.3, w: r.w * 0.9, h: r.h * 0.4 }, Math.round(clamp(r.w / (small ? 14 : 8), 3, 22))), "#4FA59D", 0.95);
    });
    return T;
  }

  async build() {
    if (this.busy) return;
    const my = ++this.token;
    const alive = () => my === this.token && this.scope.alive;
    if (motion.reduced) return this.finishInstant();

    // on small screens the stage sits below the controls: bring it into view first
    const sr = this.stage.getBoundingClientRect();
    if (sr.bottom > window.innerHeight + 40 || sr.top < 0) {
      const y = window.scrollY + sr.top - Math.max(70, (window.innerHeight - sr.height) / 2);
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      await wait(550);
      if (!alive()) return;
    }

    // ACTIVATING
    this.btn.classList.add("pressed");
    setTimeout(() => this.btn.classList.remove("pressed"), 180);
    this.set("ACTIVATING", 4);
    const donors = this.donors();
    donors.forEach((d, i) => setTimeout(() => d.classList.add("donor-glow"), i * 60));
    if (this.director && this.director.enabled) this.director.frameEls(donors, 900);
    const names = donors.map(d => d.textContent.trim()).filter(Boolean);
    const sub = $("#build-status span"); if (sub) sub.textContent = `Tabs: ${names.join(", ")}`;
    this.stage.dataset.state = "building";
    await wait(520);
    if (!alive()) return;

    // EMITTING
    this.field = this.field || new ParticleField();
    this.field.clear();
    const T = this.targets();
    const now = performance.now();
    const donorRects = donors.map(rectOfEl);
    const donorPts = donorRects.map((r, i) => perimeter(r, 6, radiusPx(donors[i])));
    const assign = (list, group, startAt, spread, dur) => list.map((t, i) => {
      const di = i % donorPts.length;
      const pool = donorPts[di];
      const o = pool[(i * 7 + group * 13) % pool.length] || { x: donorRects[di].x, y: donorRects[di].y };
      const dx = t.x - o.x, dy = t.y - o.y;
      const d = Math.hypot(dx, dy) || 1;
      const bend = (Math.random() < 0.5 ? -1 : 1) * (0.18 + Math.random() * 0.2) * d;
      return {
        sx: o.x, sy: o.y,
        cx: o.x + dx * 0.5 + (-dy / d) * bend,
        cy: o.y + dy * 0.5 + (dx / d) * bend - d * 0.12,
        tx: t.x, ty: t.y,
        // grouped, staggered arrival: perimeter order drives the delay so outlines draw around
        t0: now + startAt + (t.order ?? Math.random()) * spread + Math.random() * 120,
        dur: dur * (0.85 + Math.random() * 0.3),
        size: t.size, color: t.color, group, seed: Math.random() * 6.28, alpha: 1
      };
    });
    const flight = isSmall() ? 1050 : 1250;
    const chassis = assign(T.chassis, 0, 0, 650, flight);
    const containers = assign(T.containers, 1, 1650, 700, flight);
    const detail = assign(T.detail, 2, 2400, 500, flight * 0.9);
    const all = [...chassis, ...containers, ...detail];
    this.field.add(all);
    this.set("EMITTING", 10);
    this.field.start();
    this.scope.add(() => this.field && this.field.stop());

    const arrived = list => list.filter(p => p.t >= 1).length / list.length;
    const until = (fn, timeout = 6000) => new Promise(res => {
      const t0 = performance.now();
      const step = () => {
        if (!alive()) return res(false);
        if (fn() || performance.now() - t0 > timeout) return res(true);
        requestAnimationFrame(step);
      };
      step();
    });

    // CONVERGING: progress is tied to actual arrivals
    await until(() => chassis.some(p => p.t > 0.3));
    if (!alive()) return;
    this.set("CONVERGING");
    this.field.onFrame = () => {
      const a = arrived(all);
      const bar = $(".build-progress i");
      if (bar) bar.style.width = `${10 + a * 60}%`;
    };
    donors.forEach(d => d.classList.remove("donor-glow"));

    // CHASSIS formed: hold the recognizable outline
    await until(() => arrived(chassis) > 0.985);
    if (!alive()) return;
    this.set("CHASSIS");
    const { R, scale } = T.meta;
    this.field.outlines.push({ x: R.x, y: R.y, w: R.w, h: R.h, r: 50 * scale, color: "#3E4A5C", alpha: 0.35, t0: performance.now() });

    // CONTAINERS: perimeters first, detail afterwards, then hold
    await until(() => arrived(containers) > 0.4);
    if (!alive()) return;
    this.set("CONTAINERS");
    const screen = $(".phone-screen", this.phone);
    if (screen) { const s = rectOfEl(screen); this.field.outlines.push({ ...s, r: 40 * scale, color: "#5878D8", alpha: 0.4, t0: performance.now() }); }
    await until(() => arrived(containers) > 0.99 && arrived(detail) > 0.97);
    if (!alive()) return;
    await wait(520);
    if (!alive()) return;

    // MATERIALIZING: the DOM phone is revealed exactly where the particles stand
    this.field.onFrame = null;
    this.set("MATERIALIZING", 72);
    this.stage.dataset.state = "materializing";
    this.phone.classList.add("mat");
    const scan = { p: 0 };
    await new Promise(res => {
      gsap.to(scan, {
        p: 1, duration: 1.05, ease: "power2.inOut",
        onUpdate: () => {
          const top = 100 - scan.p * 100;
          this.phone.style.setProperty("--clip-top", `${top}%`);
          this.field.scan = { x: R.x, w: R.w, y: R.y + R.h * (top / 100) };
          const bar = $(".build-progress i"); if (bar) bar.style.width = `${72 + scan.p * 12}%`;
        },
        onComplete: res
      });
    });
    if (!alive()) return;
    this.field.scan = null;
    this.field.outlines = [];
    this.phone.classList.remove("mat");
    this.phone.style.removeProperty("--clip-top");
    this.field.p.forEach(p => (p.fade = Math.max(p.fade || 0, 0.01)));
    setTimeout(() => { if (this.field) { this.field.p = []; } }, 500);

    // LOGO_APPROACH: the club logo (a motion duplicate; the nav logo stays put) flies into
    // the dark screen. Its arrival is what powers the phone on.
    this.set("LOGO_APPROACH", 84);
    this.stage.dataset.state = "logo";
    const bootImg = $(".os-boot img", this.phone);
    const landed = await this.fly($(".nav .brand-mark"), bootImg, { morph: false, alive, dur: 1.15 });
    if (!alive()) return;

    // POWERING_UP: the logo glows, circuits grow out of it across the dark screen to every part
    // of the interface it is about to power, then blue lightning strikes and the phone boots
    this.set("POWERING_UP", 90);
    this.stage.dataset.state = "powering";
    if (landed) landed.classList.add("charging");
    await this.powerUp(bootImg, alive);
    if (!alive()) { landed && landed.remove(); return; }
    if (this.os) this.os.set("boot");
    if (landed) landed.remove();
    this.pulse(bootImg);
    if (this.os) await this.os.boot();
    if (!alive()) return;

    // INSTALLING: the same logo travels from where it booted into the dock and becomes the app
    this.set("INSTALLING", 96);
    const slot = this.os ? this.os.madSlot() : null;
    if (slot) {
      const ghost = await this.fly(this.bootRect, slot, { morph: true, alive, dur: 0.9, arc: 40 });
      if (!alive()) return;
      this.os.installMad();
      this.pulse(slot);
      if (ghost) ghost.remove();
    }
    this.field.stop();
    this.field.clear();
    this.complete();
    // ...and a builder comes over and taps it, opening the Events app
    this.scope.timeout(() => this.tapApp(), 450);
  }

  async powerUp(logoEl, alive) {
    const screen = $(".phone-screen", this.phone);
    if (!screen || !logoEl) return;
    const W = screen.offsetWidth, H = screen.offsetHeight;
    const sr = screen.getBoundingClientRect(), k = sr.width / W || 1;
    const lr = logoEl.getBoundingClientRect();
    const o = { x: (lr.left - sr.left + lr.width / 2) / k, y: (lr.top - sr.top + lr.height / 2) / k };
    const svg = makeSvg(screen, W, H, "phone-pfx");
    const rate = this.director ? this.director.rate : 1;
    // circuits fan out evenly in every direction from the logo's edge
    const ends = evenEndpoints(o, W, H, isSmall() ? 18 : 24, 14);
    let arrived = 0;
    const net = powerNetwork(svg, o, ends, {
      r0: Math.max(lr.width, lr.height) / k / 2 + 2, rate,
      lay: 800, flow: 1500, stagger: 55,
      fine: isSmall() ? 26 : 40, fineBox: { W, H, inset: 8 },
      onArrive: () => { arrived++; if (arrived === 1) { try { navigator.userActivation?.hasBeenActive && navigator.vibrate && navigator.vibrate(8); } catch {} } }
    });
    await net.done;
    if (!alive()) { svg.remove(); return; }
    // the glow that reached every endpoint washes inward and the interface forms out of it
    const wash = document.createElement("div");
    wash.className = "phone-wash";
    wash.style.setProperty("--ox", `${(o.x / W) * 100}%`);
    wash.style.setProperty("--oy", `${(o.y / H) * 100}%`);
    screen.append(wash);
    const w = wash.animate([{ opacity: 0 }, { opacity: 1, offset: 0.45 }, { opacity: 0 }], { duration: 900, easing: "ease-in-out", fill: "forwards" });
    w.playbackRate = rate;
    svg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, delay: 250, fill: "forwards" }).finished.then(() => svg.remove()).catch(() => svg.remove());
    setTimeout(() => wash.remove(), 1000 / rate);
    await new Promise(r => setTimeout(r, 380 / rate));
  }

  // A builder from the crew flies over and taps the MAD app (the logo that powered the phone)
  async tapApp() {
    if (!this.os || this.state !== "COMPLETE") return;
    const slot = this.os.madSlot();
    const d = this.director;
    if (!slot || !d || !d.enabled) return this.os.launch("mad");
    const r = slot.getBoundingClientRect();
    const at = { x: r.left + scrollX + r.width * 0.55, y: r.top + scrollY + r.height * 0.55 };
    const [a, ...help] = d._claim(4, at);
    if (!a) return this.os.launch("mad");
    // three helpers gather round the icon while the lead taps it
    help.forEach((h, i) => {
      const ang = -Math.PI / 2 + (i - 1) * 0.9, R = r.width * 0.95;
      const p = { x: h.x, y: h.y };
      gsap.to(p, { x: at.x + Math.cos(ang) * R, y: at.y - r.height * 0.2 + Math.sin(ang) * R, duration: 0.6 + i * 0.08, ease: "back.out(1.2)", onUpdate: () => h.place(p.x, p.y) });
    });
    await new Promise(res => {
      const p = { x: a.x, y: a.y };
      gsap.to(p, { x: at.x, y: at.y, duration: 0.7, ease: "back.out(1.2)", onUpdate: () => a.place(p.x, p.y), onComplete: res });
    });
    if (this.state !== "COMPLETE") { d.crew.release([a, ...help]); return; }
    d._click(a);
    slot.animate([{ transform: "scale(1)" }, { transform: "scale(.86)" }, { transform: "scale(1)" }], { duration: 260 });
    await this.os.launch("mad");
    d.crew.release([a, ...help]);
  }

  /** Fly a duplicate of the logo from an element (or rect) to an element; optional logo->icon morph. */
  async fly(from, toEl, { morph = false, alive, dur = 1, arc = 120 } = {}) {
    if (!from || !toEl) return null;
    const a = from.getBoundingClientRect ? from.getBoundingClientRect() : from;
    const clone = document.createElement("div");
    clone.className = "emblem-flight";
    clone.innerHTML = `<img class="ef-logo" src="assets/brand/mad-logo.svg" alt=""><img class="ef-icon" src="assets/brand/mad-app-icon.svg" alt="">`;
    document.body.append(clone);
    this.clone = clone;
    const logo = $(".ef-logo", clone), icon = $(".ef-icon", clone);
    const s = { t: 0 };
    await new Promise(res => gsap.to(s, {
      t: 1, duration: dur, ease: "power2.inOut",
      onUpdate: () => {
        const z = toEl.getBoundingClientRect(); // live target (handles scroll / tilt)
        const t = s.t;
        const w = a.width + (z.width - a.width) * t;
        const h = a.height + (z.height - a.height) * t;
        const x = a.left + (z.left - a.left) * t;
        const y = a.top + (z.top - a.top) * t - Math.sin(t * Math.PI) * arc;
        const grow = 1 + Math.sin(t * Math.PI) * (morph ? 0.5 : 0.9);
        const rot = Math.sin(t * Math.PI) * -18;
        clone.style.width = `${w}px`;
        clone.style.height = `${h}px`;
        clone.style.transform = `translate(${x}px, ${y}px) perspective(700px) rotateY(${rot}deg) scale(${grow})`;
        const m = morph ? Math.min(1, Math.max(0, (t - 0.2) / 0.5)) : 0;
        logo.style.opacity = String(1 - m);
        icon.style.opacity = String(m);
      },
      onComplete: res
    }));
    this.clone = null;
    if (alive && !alive()) { clone.remove(); return null; }
    const r = toEl.getBoundingClientRect();
    this.bootRect = { left: r.left, top: r.top, width: r.width, height: r.height };
    return clone;
  }

  pulse(el) {
    const ring = $(".power-ring", this.phone);
    if (!ring) return;
    if (el && el !== this.phone) {
      const p = this.phone.getBoundingClientRect(), r = el.getBoundingClientRect();
      const k = p.width / this.phone.offsetWidth || 1;
      ring.style.left = `${(r.left - p.left + r.width / 2) / k}px`;
      ring.style.top = `${(r.top - p.top + r.height / 2) / k}px`;
    }
    ring.classList.remove("go"); void ring.offsetWidth; ring.classList.add("go");
  }

  complete() {
    this.stage.dataset.state = "live";
    this.set("COMPLETE", 100);
    this.onLive && this.onLive();
  }

  finishInstant() {
    this.token++;
    if (this.field) { this.field.stop(); this.field.clear(); }
    if (this.clone) { this.clone.remove(); this.clone = null; }
    $$(".donor-glow").forEach(d => d.classList.remove("donor-glow"));
    this.phone.classList.remove("mat");
    this.phone.style.removeProperty("--clip-top");
    if (this.os) { this.os.set("home"); this.os.installMad(); }
    this.complete();
  }
  skip() { this.finishInstant(); }

  async reset() {
    this.token++;
    this.set("RESETTING", 0);
    if (this.os) this.os.reset();
    if (this.field) { this.field.stop(); this.field.clear(); }
    if (!motion.reduced && this.stage.dataset.state === "live") {
      await this.phone.animate([{ opacity: 1, transform: getComputedStyle(this.phone).transform }, { opacity: 0, transform: "scale(0.96)" }], { duration: 320, easing: "ease-in" }).finished.catch(() => {});
    }
    this.stage.dataset.state = "idle";
    this.set("READY", 0);
  }

  destroy() {
    this.token++;
    if (this.field) { this.field.destroy(); this.field = null; }
    if (this.clone) { this.clone.remove(); this.clone = null; }
    $$(".donor-glow").forEach(d => d.classList.remove("donor-glow"));
  }
}
