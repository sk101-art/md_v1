// Particle Build: user-triggered phone construction from real UI donors.
// IDLE -> READY -> ACTIVATING -> EMITTING -> CONVERGING -> CHASSIS -> CONTAINERS ->
// MATERIALIZING -> LOGO_APPROACH -> POWERING_UP -> COMPLETE -> RESETTING
import { ParticleField } from "../graphics/particle-field.js";
import { perimeter, fill, rectOfEl, radiusPx } from "../graphics/geometry-sampling.js";
import { $, $$, motion, isSmall, clamp, wait } from "../core/util.js";

const COPY = {
  READY: ["Stage is empty", "Press Build to assemble the phone"],
  ACTIVATING: ["Gathering parts", "Selecting donor components"],
  EMITTING: ["Releasing particles", "From the headline, controls and nav"],
  CONVERGING: ["In flight", "Particles converging on the stage"],
  CHASSIS: ["Chassis formed", "Rails, corners, buttons, camera"],
  CONTAINERS: ["Tracing the interface", "Screen, header, tabs, cards"],
  MATERIALIZING: ["Materializing", "Satin body and glass screen"],
  LOGO_APPROACH: ["Installing the core", "MAD emblem in transit"],
  POWERING_UP: ["Powering up", "Booting MAD OS"],
  COMPLETE: ["Live", "Try the tabs on the phone"],
  RESETTING: ["Clearing the stage", ""]
};

export class PhoneBuilder {
  constructor({ scope, director, onLive }) {
    this.scope = scope;
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

  donors() {
    const pick = [
      $(".nav .brand"), $(".hero-title"), $(".hero .lead"), $(".hero-actions .btn.primary"),
      $(".hero-actions .btn:not(.primary)"), this.btn, $(".nav-links")
    ];
    return pick.filter(el => el && el.getBoundingClientRect().width > 0);
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
    const regions = [".os-top", ".os-tabs", ".os-list button", ".os-detail"];
    regions.forEach(sel => $$(sel, ph).forEach(el => {
      const r = rectOfEl(el);
      if (r.w < 2) return;
      push(T.containers, perimeter(r, 5 * k, radiusPx(el, scale)), "#5878D8", 1.05);
    }));
    // DETAIL: sparse fill marks inside regions (text rows, tab labels)
    $$(".os-list button b, .os-list button span, .os-tabs button, .os-detail p, .os-brand", ph).forEach(el => {
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

    // LOGO_APPROACH: a motion duplicate travels; the nav emblem stays put
    this.set("LOGO_APPROACH", 86);
    this.stage.dataset.state = "logo";
    await this.flyEmblem(alive);
    if (!alive()) return;

    // POWERING_UP
    this.set("POWERING_UP", 95);
    this.stage.dataset.state = "powering";
    const ring = $(".power-ring", this.phone);
    if (ring) { ring.classList.remove("go"); void ring.offsetWidth; ring.classList.add("go"); }
    const os = $(".os", this.phone);
    if (os) {
      os.style.opacity = "1";
      const parts = [...os.children];
      parts.forEach((el, i) => el.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 420, delay: 120 + i * 90, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" }));
    }
    await wait(650);
    if (!alive()) return;
    if (os) os.style.opacity = "";
    this.field.stop();
    this.field.clear();
    this.complete();
  }

  async flyEmblem(alive) {
    const src = $(".nav .brand-mark");
    const target = $(".os-brand img", this.phone) || $(".phone-screen", this.phone);
    if (!src || !target) return;
    const a = src.getBoundingClientRect();
    const screen = $(".phone-screen", this.phone).getBoundingClientRect();
    const clone = document.createElement("div");
    clone.className = "emblem-flight";
    clone.innerHTML = `<img src="assets/brand/mad-emblem.svg" alt="">`;
    document.body.append(clone);
    this.clone = clone;
    const big = 64;
    const cx = screen.left + screen.width / 2 - big / 2, cy = screen.top + screen.height * 0.42 - big / 2;
    const s = { t: 0 };
    const sx = a.left, sy = a.top, sw = a.width;
    await new Promise(res => gsap.to(s, {
      t: 1, duration: 1.0, ease: "power2.inOut",
      onUpdate: () => {
        const t = s.t;
        const x = sx + (cx - sx) * t;
        const y = sy + (cy - sy) * t - Math.sin(t * Math.PI) * 90; // shallow arc
        const size = sw + (big - sw) * t;
        const rot = Math.sin(t * Math.PI) * -14;
        clone.style.width = clone.style.height = `${size}px`;
        clone.style.transform = `translate(${x}px, ${y}px) perspective(600px) rotateY(${rot}deg) rotateX(${rot * 0.5}deg)`;
      },
      onComplete: res
    }));
    if (!alive()) { clone.remove(); return; }
    // settle into the status-bar brand position
    const tr = target.getBoundingClientRect();
    await new Promise(res => gsap.to(s, {
      t: 0, duration: 0.55, delay: 0.25, ease: "power3.inOut",
      onUpdate: () => {
        const k = 1 - s.t;
        const x = cx + (tr.left - cx) * k, y = cy + (tr.top - cy) * k;
        const size = big + (tr.width - big) * k;
        clone.style.width = clone.style.height = `${size}px`;
        clone.style.transform = `translate(${x}px, ${y}px)`;
      },
      onComplete: res
    }));
    gsap.to(clone, { opacity: 0, duration: 0.25, onComplete: () => clone.remove() });
    this.clone = null;
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
    const os = $(".os", this.phone); if (os) os.style.opacity = "";
    this.complete();
  }
  skip() { this.finishInstant(); }

  async reset() {
    this.token++;
    this.set("RESETTING", 0);
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
