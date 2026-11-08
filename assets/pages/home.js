import { esc, icons, $, $$, semKey, finePointer, motion } from "../core/util.js";
import { posterCard, splitTitle } from "./common.js";
import { PhoneBuilder } from "../experiences/phone-builder.js";
import { MadOS, osMarkup } from "../experiences/mad-os.js";
import { FullscreenPhone } from "../experiences/fullscreen-phone.js";

export function render(site, events) {
  const flags = [...events].filter(e => e.flagship).sort((a, b) => semKey(b.semester) - semKey(a.semester) || String(b.start_at).localeCompare(String(a.start_at)));
  const pipe = site.learning_pipeline || [];

  return `
  <section class="hero wrap" aria-labelledby="hero-title">
    <div class="hero-copy">
      <p class="eyebrow" data-sw="text">${esc(site.hero_badge || `${site.full_name} · ${site.college_short}`)}</p>
      <h1 class="hero-title" id="hero-title" data-sw="text" tabindex="-1">${splitTitle(site.hero_title || "Don't just use the future. Build it.")}</h1>
      <p class="lead" data-sw="text">${esc(site.hero_lead)}</p>
      <div class="hero-actions">
        <a class="btn primary" href="events.html" data-sw="block">${esc(site.hero_cta_primary || "Explore events")} ${icons.arrow}</a>
        <a class="btn" href="contact.html" data-sw="block">${esc(site.hero_cta_secondary || "Join the club")}</a>
      </div>
      <div class="build-panel glass" data-sw="box">
        <button type="button" class="build-btn" id="build-btn" aria-describedby="build-status">
          <span class="knob">${icons.build}</span><span class="label">Build the phone</span>
        </button>
        <div class="build-status" id="build-status" aria-live="polite">
          <b>Stage is empty</b><span>Press Build to assemble the phone</span>
          <div class="build-progress" aria-hidden="true"><i></i></div>
        </div>
        <div class="build-extra">
          <button type="button" class="btn sm" id="build-full">Full screen</button>
          <button type="button" class="btn sm ghost" id="build-reset">Reset</button>
        </div>
      </div>
      <p class="build-tip" data-sw="text">
        <span class="tip-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg></span>
        <span class="tip-txt">The phone runs this website. Build it, then open its <b>Settings</b> app to switch dark mode, animations, lite effects and builder sounds.</span>
        <button type="button" class="tip-btn" id="open-settings" hidden>Open Settings</button>
      </p>
    </div>

    <div class="stage" data-state="idle" aria-label="Phone build stage">
      <div class="stage-marks" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <p class="stage-hint" aria-hidden="true">Empty stage</p>
      <div class="stage-floor" aria-hidden="true"></div>
      <div class="phone" id="phone">
        <span class="phone-btn vol-up"></span><span class="phone-btn vol-down"></span><span class="phone-btn power"></span>
        <div class="phone-screen">
          <span class="phone-island"></span>
          <span class="power-ring"></span>
          ${osMarkup(site, events)}
        </div>
      </div>
    </div>
  </section>

  <section class="wrap" aria-label="Club at a glance">
    <div class="stats">
      ${(site.stats || []).map(s => `<div class="stat" data-sw="block"><b data-count>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("")}
    </div>
  </section>

  <section class="section wrap" aria-labelledby="flagships">
    <div class="section-head">
      <div>
        <p class="eyebrow" data-sw="text">Flagship events</p>
        <h2 id="flagships" data-sw="text">What we have built together</h2>
      </div>
      <a class="btn" href="events.html" data-sw="block">All ${events.length} events ${icons.arrow}</a>
    </div>
    <div class="posters rail" id="flag-rail">
      ${flags.map((e, i) => posterCard(e, { wide: i === 0 })).join("")}
    </div>
    <div class="rail-dots" aria-hidden="true">${flags.map((_, i) => `<i${i === 0 ? ' class="on"' : ""}></i>`).join("")}</div>
  </section>

  ${pipe.length ? `
  <section class="section wrap" aria-labelledby="journey-h">
    <div class="section-head">
      <div>
        <p class="eyebrow" data-sw="text">The member journey</p>
        <h2 id="journey-h" data-sw="text">From first idea to shipped app</h2>
      </div>
      <p data-sw="text">Five stages every MAD project moves through. Select a stage to see what it involves.</p>
    </div>
    <div class="journey">
      <div class="journey-steps" role="tablist" aria-label="Journey stages" aria-orientation="vertical">
        <svg class="journey-svg" aria-hidden="true"></svg>
        ${pipe.map((p, i) => `
          <button class="journey-step" role="tab" id="js-${i}" aria-controls="journey-panel" aria-selected="${i === 0}" data-sw="block">
            <span class="n">${esc(p.step)}</span><b>${esc(p.name)}</b><small>${esc(p.tag)}</small>
          </button>`).join("")}
      </div>
      <div class="journey-panel glass" id="journey-panel" role="tabpanel" aria-live="polite" data-sw="box">
        <p class="eyebrow" id="jp-tag">${esc(pipe[0].tag)}</p>
        <h3 id="jp-name">${esc(pipe[0].step)}. ${esc(pipe[0].name)}</h3>
        <p id="jp-desc">${esc(pipe[0].desc)}</p>
      </div>
    </div>
  </section>` : ""}

  ${(site.highlights || []).length ? `
  <section class="section wrap" aria-labelledby="how-h">
    <div class="section-head">
      <div>
        <p class="eyebrow" data-sw="text">How we work</p>
        <h2 id="how-h" data-sw="text">Principles</h2>
      </div>
    </div>
    <div class="principles">
      ${site.highlights.map((h, i) => `
        <article class="card" data-sw="box">
          <span class="idx">${String(i + 1).padStart(2, "0")} · ${esc(h.tag || "")}</span>
          <h3>${esc(h.title)}</h3>
          <p>${esc(h.text)}</p>
        </article>`).join("")}
    </div>
  </section>` : ""}

  <section class="section wrap" aria-labelledby="cta-h">
    <div class="cta-band glass" data-sw="box">
      <div>
        <img class="cta-mark" src="assets/brand/mad-logo.svg" alt="" width="42" height="64">
        <p class="eyebrow">${events.length} events since ${esc(site.established)}</p>
        <h2 id="cta-h">${esc(site.cta_title)}</h2>
        <p class="lead">${esc(site.cta_text)}</p>
      </div>
      <div class="actions">
        <a class="btn primary" href="contact.html">Join MAD Club ${icons.arrow}</a>
        <a class="btn" href="${esc(site.instagram)}" target="_blank" rel="noopener">Follow ${esc(site.instagram_handle)}</a>
      </div>
    </div>
  </section>`;
}

export function wire(ctx) {
  const { scope, director, site, events } = ctx;
  const screen = $(".phone-screen");
  let builder = null;
  const full = new FullscreenPhone({ scope, screen });
  const os = new MadOS({
    root: screen, site, events, scope,
    onRebuild: async () => { await full.close(); await builder.reset(); builder.build(); },
    onFullscreen: () => full.open(),
    swarm: director
  });
  builder = new PhoneBuilder({ scope, director, os, onLive: () => { liveHover(scope); tipLive(true); } });
  // the hint under Build: once the phone is live, it opens the phone's Settings app directly
  const tipBtn = $("#open-settings"), tipTxt = $(".build-tip .tip-txt");
  const tipLive = on => {
    if (!tipBtn) return;
    tipBtn.hidden = !on;
    if (tipTxt) tipTxt.innerHTML = on
      ? "Use the phone's <b>Settings</b> app to control this website: dark mode, animations, lite effects and builder sounds."
      : "The phone runs this website. Build it, then open its <b>Settings</b> app to switch dark mode, animations, lite effects and builder sounds.";
  };
  scope.on(document, "mad:build", e => { if (e.detail.state === "RESETTING" || e.detail.state === "READY") tipLive(false); });
  tipBtn && scope.on(tipBtn, "click", () => {
    const ph = $("#phone"), r = ph && ph.getBoundingClientRect();
    if (r && (r.top < 0 || r.bottom > innerHeight)) window.scrollTo({ top: scrollY + r.top - Math.max(70, (innerHeight - r.height) / 2), behavior: "smooth" });
    os.launch("settings");
  });
  if (window.__mad) window.__mad.os = os; // inspectable from the console, like the director
  const fb = $("#build-full");
  fb && scope.on(fb, "click", () => full.open());

  // Flagship rail: on small screens it becomes a snap carousel with live dots
  const rail = $("#flag-rail"), dots = $$(".rail-dots i");
  if (rail && dots.length) {
    scope.on(rail, "scroll", () => {
      const cards = $$(".poster", rail);
      const mid = rail.scrollLeft + rail.clientWidth / 2;
      let k = 0, best = Infinity;
      cards.forEach((c, i) => { const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < best) { best = d; k = i; } });
      dots.forEach((d, i) => d.classList.toggle("on", i === k));
    }, { passive: true });
  }

  // Journey: tablist + Swarm Connect paths between stages
  const pipe = site.learning_pipeline || [];
  const steps = $(".journey-steps");
  if (steps) {
    const btns = $$(".journey-step", steps);
    const panel = $("#journey-panel");
    const select = i => {
      btns.forEach((b, j) => { b.setAttribute("aria-selected", String(i === j)); b.tabIndex = i === j ? 0 : -1; });
      const p = pipe[i];
      director.morph(panel, () => {
        $("#jp-tag").textContent = p.tag;
        $("#jp-name").textContent = `${p.step}. ${p.name}`;
        $("#jp-desc").textContent = p.desc;
      });
    };
    btns.forEach((b, i) => {
      b.tabIndex = i === 0 ? 0 : -1;
      b.addEventListener("click", () => select(i));
      b.addEventListener("keydown", e => {
        const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (!k) return;
        e.preventDefault();
        const j = (i + k + btns.length) % btns.length;
        btns[j].focus();
        select(j);
      });
    });
    const io = scope.observe(new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting)) { io.disconnect(); scope.timeout(() => director.connect($(".journey-svg"), btns), 900); }
    }, { threshold: 0.4 }));
    io.observe(steps);
  }
}

// Once live, the phone can be picked up: drag beside it (or on its frame) to spin it in 3D,
// it springs back with inertia; pointer hover adds a gentle tilt; touch devices tilt with the hand.
function liveHover(scope) {
  const phone = $("#phone"), stage = $(".stage");
  if (!phone || !stage || motion.reduced) return;
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;          // hover tilt target / current (-0.5..0.5)
  let drag = null, rx = 0, ry = 0, vx = 0, vy = 0;      // hand rotation (deg) and velocity
  const apply = () => {
    phone.style.setProperty("--rx", `${(-cy * 7 + rx).toFixed(2)}deg`);
    phone.style.setProperty("--ry", `${(cx * 9 + ry).toFixed(2)}deg`);
  };
  const loop = () => {
    cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
    if (!drag) {
      // spring back to rest with a little inertia
      vx += -rx * 0.06; vy += -ry * 0.06; vx *= 0.86; vy *= 0.86;
      rx += vx; ry += vy;
    }
    apply();
    const moving = Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001 || Math.abs(rx) > 0.05 || Math.abs(ry) > 0.05 || drag;
    raf = moving ? requestAnimationFrame(loop) : 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  scope.add(() => cancelAnimationFrame(raf));
  const live = () => stage.dataset.state === "live";

  stage.classList.toggle("grab", true);
  scope.on(stage, "pointerdown", e => {
    if (!live() || e.target.closest(".os")) return;   // the screen stays fully usable
    drag = { x: e.clientX, y: e.clientY, rx, ry, t: performance.now() };
    stage.setPointerCapture(e.pointerId);
    stage.classList.add("grabbing");
    kick();
  });
  scope.on(stage, "pointermove", e => {
    if (drag) {
      const nrx = Math.max(-38, Math.min(38, drag.rx - (e.clientY - drag.y) * 0.35));
      const nry = Math.max(-70, Math.min(70, drag.ry + (e.clientX - drag.x) * 0.45));
      vx = nrx - rx; vy = nry - ry; rx = nrx; ry = nry;
      return;
    }
    if (!finePointer || !live() || e.target.closest(".os")) return;
    const r = stage.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5; kick();
  }, { passive: true });
  const end = () => { if (!drag) return; drag = null; stage.classList.remove("grabbing"); kick(); };
  scope.on(stage, "pointerup", end);
  scope.on(stage, "pointercancel", end);
  scope.on(stage, "pointerleave", () => { tx = 0; ty = 0; kick(); });

  if (!finePointer && "DeviceOrientationEvent" in window && typeof DeviceOrientationEvent.requestPermission !== "function") {
    scope.on(window, "deviceorientation", e => {
      if (!live() || e.gamma == null) return;
      tx = Math.max(-0.5, Math.min(0.5, e.gamma / 60)); ty = Math.max(-0.5, Math.min(0.5, (e.beta - 40) / 80)); kick();
    }, { passive: true });
  }
}
