// MAD OS: the finished phone is a real little operating system.
// Boot -> lock screen -> home screen -> the MAD logo lands as an app icon and opens itself.
// Apps: MAD (events feed + detail), Gallery, Team, About, Join, Settings, plus Instagram/Website links.
import { $, $$, esc, photoSrc, semKey, motion, icons } from "../core/util.js";
import { loadData } from "../core/content.js";
import { setTheme, playMotion } from "../core/shell.js";

const ICON = {
  team: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.2c2.4.2 4 1.8 4.5 4.3"/></svg>',
  about: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.2"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17.2" cy="6.8" r=".9" fill="currentColor"/></svg>',
  web: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5s-1.2 6.1-3.8 8.5c-2.6-2.4-3.8-5.2-3.8-8.5S9.4 5.9 12 3.5Z"/></svg>',
  gallery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="m3.8 16 4.7-4.6 3.7 3.6 2.4-2.3 5.6 5.2"/><circle cx="15.5" cy="9" r="1.6"/></svg>',
  join: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m14.5 5-7 7 7 7"/></svg>',
  signal: '<svg viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>',
  wifi: '<svg viewBox="0 0 16 12" fill="currentColor"><path d="M8 11.8 5.6 9.4a3.4 3.4 0 0 1 4.8 0Z"/><path d="M3.4 7.2a6.5 6.5 0 0 1 9.2 0l-1.4 1.4a4.5 4.5 0 0 0-6.4 0Z" opacity=".95"/><path d="M1.1 4.9a9.8 9.8 0 0 1 13.8 0l-1.4 1.4a7.8 7.8 0 0 0-11 0Z" opacity=".9"/></svg>',
  battery: '<svg viewBox="0 0 27 13" fill="none"><rect x=".5" y=".5" width="23" height="12" rx="3.5" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="18" height="9" rx="2" fill="currentColor"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill="currentColor" opacity=".45"/></svg>'
};

const APPS = {
  mad: { name: "MAD Club", tint: "#FFFFFF", img: "assets/brand/mad-app-icon.svg" },
  gallery: { name: "Gallery", tint: "linear-gradient(160deg,#F4D58D,#E39B6B)", glyph: ICON.gallery },
  join: { name: "Join", tint: "linear-gradient(160deg,#2A3445,#18212F)", glyph: ICON.join },
  settings: { name: "Settings", tint: "linear-gradient(160deg,#C7D1DD,#8C98AA)", glyph: ICON.settings },
  team: { name: "Team", tint: "linear-gradient(160deg,#7F9AF0,#4561C4)", glyph: ICON.team },
  about: { name: "About", tint: "linear-gradient(160deg,#B7E3DF,#4FA59D)", glyph: ICON.about },
  instagram: { name: "Instagram", tint: "linear-gradient(160deg,#9A8CCB,#C8664A)", glyph: ICON.camera, external: true },
  website: { name: "Website", tint: "linear-gradient(160deg,#F7F8FA,#D9E0E8)", glyph: ICON.web, dark: true, href: "events.html" }
};

const clock = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
const dateLine = () => new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch {} };

function iconHtml(id, { slot = false } = {}) {
  const a = APPS[id];
  const tile = a.img
    ? `<span class="ic-tile ic-img${slot ? " ic-slot" : ""}"><img src="${a.img}" alt=""></span>`
    : `<span class="ic-tile" style="background:${a.tint};color:${a.dark ? "#18212F" : "#fff"}">${a.glyph}</span>`;
  const label = `<span class="ic-label">${esc(a.name)}</span>`;
  if (a.external) return `<a class="ic" data-app="${id}" href="#" target="_blank" rel="noopener" aria-label="${esc(a.name)} (opens in a new tab)">${tile}${label}</a>`;
  if (a.href) return `<a class="ic" data-app="${id}" href="${a.href}" aria-label="Open the ${esc(a.name)}">${tile}${label}</a>`;
  return `<button type="button" class="ic" data-app="${id}" aria-label="Open ${esc(a.name)}">${tile}${label}</button>`;
}

export function osMarkup(site, events) {
  const sorted = [...events].sort((a, b) => semKey(b.semester) - semKey(a.semester));
  const flags = events.filter(e => e.flagship).length;
  const photos = events.reduce((n, e) => n + (e.photos || []).length, 0);
  return `
  <div class="os" data-screen="off" data-app="">
    <div class="os-status" aria-hidden="true">
      <span class="os-time">${clock()}</span>
      <span class="os-sys">${ICON.signal}${ICON.wifi}${ICON.battery}</span>
    </div>
    <div class="os-wall" aria-hidden="true"></div>
    <section class="os-boot" aria-hidden="true"><img src="assets/brand/mad-logo.svg" alt=""></section>
    <section class="os-lock" aria-label="Lock screen">
      <p class="lk-date">${dateLine()}</p>
      <p class="lk-time">${clock()}</p>
      <div class="lk-note">
        <span class="lk-ic"><img src="assets/brand/mad-app-icon.svg" alt=""></span>
        <span><b>MAD Club</b><small>${events.length} events in the archive since ${esc(site.established)}. Open the app to browse them.</small></span>
      </div>
      <button type="button" class="lk-unlock">Swipe up or tap to open</button>
    </section>
    <section class="os-home" aria-label="Home screen">
      <div class="os-widget">
        <span class="w-k">MAD Club · ${esc(site.college_short)}</span>
        <span class="w-big">${events.length}<small>events since ${esc(site.established)}</small></span>
        <span class="w-row"><span><b>${flags}</b> flagships</span><span><b>${photos}</b> photos</span></span>
        <span class="w-latest">Latest: ${esc(sorted[0]?.name || "")}</span>
      </div>
      <div class="os-grid">${["team", "about", "instagram", "website"].map(id => iconHtml(id)).join("")}</div>
      <div class="os-dots" aria-hidden="true"><i class="on"></i><i></i></div>
      <div class="os-dock">${["mad", "gallery", "join", "settings"].map(id => iconHtml(id, { slot: id === "mad" })).join("")}</div>
    </section>
    <section class="os-app" aria-live="polite">
      <div class="app-splash" aria-hidden="true"><img src="" alt=""></div>
      <div class="app-stack"></div>
    </section>
    <div class="os-banner" role="status" aria-live="polite"></div>
    <button type="button" class="os-ind" aria-label="Go to home screen"><i></i></button>
  </div>`;
}

export class MadOS {
  constructor({ root, site, events, scope, onRebuild, onFullscreen }) {
    this.root = root;
    this.site = site;
    this.events = [...events].sort((a, b) => semKey(b.semester) - semKey(a.semester));
    this.scope = scope;
    this.onRebuild = onRebuild;
    this.onFullscreen = onFullscreen;
    this.os = $(".os", root);
    this.app = $(".os-app", this.os);
    this.stack = $(".app-stack", this.os);
    this.current = null;
    this.launchedFrom = null;

    scope.interval(() => $$(".os-time, .lk-time", this.os).forEach(t => (t.textContent = clock())), 15000);

    const ig = $('.ic[data-app="instagram"]', this.os);
    if (ig) ig.href = site.instagram;

    this.os.addEventListener("click", e => {
      const ic = e.target.closest(".ic");
      if (ic && !APPS[ic.dataset.app].external && !APPS[ic.dataset.app].href) { e.preventDefault(); this.launch(ic.dataset.app, ic); return; }
      if (e.target.closest(".lk-unlock")) this.unlock();
      const back = e.target.closest("[data-back]");
      if (back) this.pop();
      const ev = e.target.closest("[data-ev]");
      if (ev) this.push(this.eventPage(ev.dataset.ev));
      const ph = e.target.closest("[data-photo]");
      if (ph) this.viewPhoto(ph.dataset.photo, ph);
      const act = e.target.closest("[data-act]");
      if (act) this.action(act.dataset.act, act);
    });
    this.wireGestures();
  }

  set(screen) { this.os.dataset.screen = screen; }

  // ---------- boot sequence ----------
  async boot({ fast = false } = {}) {
    const t = fast || motion.reduced ? 0 : 1;
    this.set("boot");
    await this.wait(650 * t);
    this.set("lock");
    await this.wait(1100 * t);
    await this.unlock();
  }
  async unlock() {
    if (this.os.dataset.screen !== "lock") return;
    this.set("home");
    buzz(8);
    if (!motion.reduced) {
      const items = [$(".os-widget", this.os), ...$$(".os-grid .ic, .os-dock .ic", this.os)];
      await Promise.all(items.map((el, i) => el.animate(
        [{ opacity: 0, transform: "scale(.6) translateY(14px)" }, { opacity: 1, transform: "none" }],
        { duration: 420, delay: 40 + i * 45, easing: "cubic-bezier(.34,1.45,.64,1)", fill: "backwards" }).finished.catch(() => {})));
    }
  }
  reset() {
    this.current = null;
    this.busy = false;
    this.os.dataset.app = "";
    this.stack.innerHTML = "";
    this.island(false);
    this.set("off");
    const slot = this.madSlot();
    slot && slot.classList.add("ic-slot");
  }
  madSlot() { return $('.os-dock .ic[data-app="mad"] .ic-tile', this.os); }
  installMad() {
    const slot = this.madSlot();
    slot.classList.remove("ic-slot");
    if (!motion.reduced) slot.animate([{ transform: "scale(.82)" }, { transform: "scale(1.08)" }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.34,1.5,.64,1)" });
    buzz(12);
  }

  wait(ms) { return new Promise(r => this.scope.timeout(r, ms)); }

  // ---------- app lifecycle ----------
  rectIn(el) {
    const s = this.os.getBoundingClientRect(), r = el.getBoundingClientRect();
    const k = s.width / this.os.offsetWidth || 1;
    return { x: (r.left - s.left) / k, y: (r.top - s.top) / k, w: r.width / k, h: r.height / k, W: this.os.offsetWidth, H: this.os.offsetHeight };
  }
  insetFor(r, rad = 14) { return `inset(${r.y}px ${r.W - r.x - r.w}px ${r.H - r.y - r.h}px ${r.x}px round ${rad}px)`; }

  _drain() { const q = this._q; this._q = null; if (q) this.launch(q[0], q[1]); }
  async launch(id, fromEl) {
    if (this.busy) { this._q = [id, fromEl]; return; } // taps during an animation are queued, not dropped
    if (this.current) await this.home(true);
    this.busy = true;
    const from = fromEl || $(`.ic[data-app="${id}"]`, this.os);
    const tile = from ? $(".ic-tile", from) : null;
    this.launchedFrom = tile;
    this.current = id;
    this.os.dataset.app = id;
    this.stack.innerHTML = "";
    this.stack.append(this.page(id));
    const splash = $(".app-splash", this.app);
    const a = APPS[id];
    splash.style.background = a.img ? "#fff" : a.tint;
    splash.innerHTML = a.img ? `<img src="${a.img}" alt="">` : `<span style="color:${a.dark ? "#18212F" : "#fff"}">${a.glyph}</span>`;
    this.set("app");
    this.island(true, a.name);
    buzz(10);
    if (!motion.reduced && tile) {
      const r = this.rectIn(tile);
      const full = "inset(0px 0px 0px 0px round 40px)";
      splash.style.opacity = "1";
      await this.app.animate([{ clipPath: this.insetFor(r, 14) }, { clipPath: full }], { duration: 520, easing: "cubic-bezier(.2,.9,.2,1)" }).finished.catch(() => {});
      await this.wait(id === "mad" ? 420 : 140);
      await splash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: "forwards" }).finished.catch(() => {});
    }
    splash.style.opacity = "0";
    this.island(false);
    this.busy = false;
    this._drain();
  }
  async home(quick = false) {
    if (!this.current || (this.busy && !quick)) return;
    this.busy = true;
    const tile = this.launchedFrom;
    if (!motion.reduced && tile) {
      const r = this.rectIn(tile);
      await this.app.animate([{ clipPath: "inset(0px 0px 0px 0px round 40px)", opacity: 1 }, { clipPath: this.insetFor(r, 14), opacity: 0.2 }], { duration: quick ? 220 : 380, easing: "cubic-bezier(.4,0,.2,1)" }).finished.catch(() => {});
    }
    this.current = null;
    this.os.dataset.app = "";
    this.set("home");
    this.stack.innerHTML = "";
    this.app.style.transform = "";
    this.busy = false;
    if (!quick) this._drain();
  }
  island(on, label = "") {
    const isl = this.os.parentElement && this.os.parentElement.querySelector(":scope > .phone-island");
    if (!isl) return;
    isl.classList.toggle("live", on);
    isl.innerHTML = on ? `<img src="assets/brand/mad-app-icon.svg" alt=""><span>${esc(label)}</span>` : "";
  }
  banner(text) {
    const b = $(".os-banner", this.os);
    b.innerHTML = `<img src="assets/brand/mad-app-icon.svg" alt=""><span>${text}</span>`;
    b.classList.add("on");
    this.scope.timeout(() => b.classList.remove("on"), 2600);
  }

  // ---------- navigation inside an app ----------
  push(pageEl) {
    const prev = this.stack.lastElementChild;
    this.stack.append(pageEl);
    if (motion.reduced) { prev && (prev.hidden = true); return; }
    pageEl.animate([{ transform: "translateX(100%)" }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.2,.9,.2,1)" });
    prev && prev.animate([{ transform: "none" }, { transform: "translateX(-28%)", opacity: 0.6 }], { duration: 420, easing: "cubic-bezier(.2,.9,.2,1)", fill: "forwards" });
  }
  async pop() {
    const top = this.stack.lastElementChild, prev = top && top.previousElementSibling;
    if (!prev) return this.home();
    if (!motion.reduced) {
      prev.getAnimations().forEach(a => a.cancel());
      prev.animate([{ transform: "translateX(-28%)", opacity: 0.6 }, { transform: "none", opacity: 1 }], { duration: 360, easing: "cubic-bezier(.2,.9,.2,1)" });
      await top.animate([{ transform: top.style.transform || "none" }, { transform: "translateX(100%)" }], { duration: 360, easing: "cubic-bezier(.2,.9,.2,1)" }).finished.catch(() => {});
    }
    prev.hidden = false;
    top.remove();
  }

  // ---------- gestures: swipe up to go home, edge swipe to go back ----------
  wireGestures() {
    const ind = $(".os-ind", this.os);
    let sy = 0, dragging = false;
    ind.addEventListener("click", () => (this.current ? this.home() : this.os.dataset.screen === "lock" && this.unlock()));
    ind.addEventListener("pointerdown", e => { sy = e.clientY; dragging = true; ind.setPointerCapture(e.pointerId); });
    ind.addEventListener("pointermove", e => {
      if (!dragging || !this.current) return;
      const dy = Math.min(0, e.clientY - sy);
      const p = Math.min(1, -dy / 160);
      this.app.style.transform = `translateY(${dy * 0.5}px) scale(${1 - p * 0.18})`;
      this.app.style.borderRadius = `${20 + p * 20}px`;
    });
    const end = e => {
      if (!dragging) return;
      dragging = false;
      const dy = e.clientY - sy;
      if (this.current && dy < -40) this.home();
      else if (this.current) { this.app.style.transform = ""; }
    };
    ind.addEventListener("pointerup", end);
    ind.addEventListener("pointercancel", end);

    // lock screen: swipe up anywhere
    const lock = $(".os-lock", this.os);
    let ly = 0;
    lock.addEventListener("pointerdown", e => (ly = e.clientY));
    lock.addEventListener("pointerup", e => { if (ly - e.clientY > 30) this.unlock(); });

    // edge swipe back inside apps
    let ex = 0, edge = false;
    this.stack.addEventListener("pointerdown", e => {
      const r = this.stack.getBoundingClientRect();
      edge = e.clientX - r.left < 24 && this.stack.children.length > 1;
      ex = e.clientX;
    });
    this.stack.addEventListener("pointermove", e => {
      if (!edge) return;
      const dx = Math.max(0, e.clientX - ex);
      const top = this.stack.lastElementChild;
      if (top) top.style.transform = `translateX(${dx}px)`;
    });
    this.stack.addEventListener("pointerup", e => {
      if (!edge) return;
      edge = false;
      const top = this.stack.lastElementChild;
      if (e.clientX - ex > 70) this.pop();
      else if (top) top.style.transform = "";
    });
  }

  // ---------- app pages ----------
  shell(title, body, { back = false, large = true, sub = "" } = {}) {
    const p = document.createElement("div");
    p.className = "app-page";
    p.innerHTML = `
      <header class="ap-bar">${back ? `<button type="button" class="ap-back" data-back aria-label="Back">${ICON.back}<span>Back</span></button>` : "<span></span>"}
        ${large ? "" : `<b class="ap-mini">${esc(title)}</b>`}<span></span></header>
      <div class="ap-scroll">${large ? `<h2 class="ap-title">${esc(title)}</h2>${sub ? `<p class="ap-sub">${sub}</p>` : ""}` : ""}${body}</div>`;
    return p;
  }
  page(id) {
    const s = this.site;
    if (id === "mad") {
      const years = [...new Set(this.events.map(e => e.semester.slice(0, 5)))];
      return this.shell("Events", `
        <div class="ap-chips" role="group" aria-label="Year">${["All", ...years].map((y, i) => `<button type="button" data-act="year" data-y="${y}" aria-pressed="${i === 0}">${y === "All" ? "All" : "20" + y.replace("-", "–")}</button>`).join("")}</div>
        <div class="ap-feed">${this.events.map(e => this.card(e)).join("")}</div>`, { sub: `${this.events.length} events · all completed` });
    }
    if (id === "gallery") {
      const all = this.events.flatMap(e => (e.photos || []).map(p => ({ p: photoSrc(p), e })));
      return this.shell("Gallery", `<div class="ap-grid">${all.map((x, i) => `<button type="button" data-photo="${i}" aria-label="${esc(x.e.name)} photo"><img src="${esc(x.p)}" alt="${esc(x.e.name)}" loading="lazy"></button>`).join("")}</div>`, { sub: `${all.length} photos from ${new Set(all.map(x => x.e.slug)).size} events` });
    }
    if (id === "team") {
      const p = this.shell("Team", `<div class="ap-list" id="ap-team"><p class="ap-sub">Loading…</p></div>`);
      loadData("team").then(t => {
        const box = $("#ap-team", p);
        if (!box) return;
        const ini = n => n.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
        box.innerHTML = `<p class="ap-sub">Core team ${esc(t.current_year)}</p>` + (t.current || []).map(m => `<div class="ap-row"><span class="ap-av">${esc(ini(m.name))}</span><span><b>${esc(m.name)}</b><small>${esc(m.role)}</small></span></div>`).join("");
      }).catch(() => {});
      return p;
    }
    if (id === "about") {
      const pipe = s.learning_pipeline || [];
      return this.shell("About", `
        <p class="ap-quote">${esc(s.about?.manifesto_quote || "")}</p>
        <div class="ap-list">${pipe.map(x => `<div class="ap-row"><span class="ap-av n">${esc(x.step)}</span><span><b>${esc(x.name)}</b><small>${esc(x.desc)}</small></span></div>`).join("")}</div>
        <a class="ap-cta ghost" href="about.html">Read the full story</a>`, { sub: `${esc(s.full_name)}, est. ${esc(s.established)}` });
    }
    if (id === "join") {
      return this.shell("Join MAD", `
        <div class="ap-hero"><img src="assets/brand/mad-logo.svg" alt=""><p>${esc(s.cta_text || "")}</p></div>
        <a class="ap-cta" href="contact.html">Apply on the website</a>
        <a class="ap-cta ghost" href="${esc(s.instagram)}" target="_blank" rel="noopener">Follow ${esc(s.instagram_handle)}</a>
        ${s.contact?.email ? `<a class="ap-cta ghost" href="mailto:${esc(s.contact.email)}">${esc(s.contact.email)}</a>` : ""}`, {});
    }
    if (id === "settings") {
      const dark = document.documentElement.dataset.theme === "dark";
      return this.shell("Settings", `
        <div class="ap-group">
          <label class="ap-set"><span><b>Graphite appearance</b><small>Switches the whole website, not just this phone</small></span>
            <input type="checkbox" role="switch" data-act="theme" ${dark ? "checked" : ""}></label>
          <label class="ap-set"><span><b>Animations</b><small>Swarm build and motion across the site</small></span>
            <input type="checkbox" role="switch" data-act="motion" ${motion.reduced ? "" : "checked"}></label>
          <button type="button" class="ap-set" data-act="replay"><span><b>Replay the site build</b><small>Watch the swarm construct this page again</small></span><i>${icons.arrow}</i></button>
          <button type="button" class="ap-set" data-act="rebuild"><span><b>Rebuild this phone</b><small>Replay the particle build from the start</small></span><i>${icons.arrow}</i></button>
          ${this.onFullscreen ? `<button type="button" class="ap-set" data-act="full"><span><b>Full screen</b><small>Turn your screen into this phone</small></span><i>${icons.arrow}</i></button>` : ""}
        </div>
        <p class="ap-sub">MAD OS · built from real page elements on ${esc(s.name)}'s website.</p>`, {});
    }
    return this.shell(id, "");
  }
  card(e) {
    const cover = e.photos && e.photos[0] ? photoSrc(e.photos[0]) : "";
    return `<button type="button" class="ap-card" data-ev="${esc(e.slug)}" data-y="${esc(e.semester.slice(0, 5))}">
      <span class="ap-cover">${cover ? `<img src="${esc(cover)}" alt="" loading="lazy">` : `<span class="ap-ph c${e.slug.length % 4}"><img src="assets/brand/mad-rays.svg" alt=""></span>`}</span>
      <span class="ap-meta"><small>${esc(e.semester)}${e.flagship ? " · Flagship" : ""}</small><b>${esc(e.name)}</b><span>${esc(e.category || "Event")}</span></span></button>`;
  }
  eventPage(slug) {
    const e = this.events.find(x => x.slug === slug);
    const cover = e.photos && e.photos[0] ? photoSrc(e.photos[0]) : "";
    const p = this.shell(e.name, `
      <div class="ap-banner">${cover ? `<img src="${esc(cover)}" alt="${esc(e.name)}">` : `<span class="ap-ph big c${e.slug.length % 4}"><img src="assets/brand/mad-rays.svg" alt=""><b>${esc(e.name)}</b></span>`}</div>
      <h2 class="ap-title">${esc(e.name)}</h2>
      <p class="ap-sub">${esc(e.semester)} · ${esc(e.category || "Event")} · Completed</p>
      <p class="ap-text">${esc(e.description)}</p>
      ${(e.rounds || []).length ? `<h3 class="ap-h">Rounds</h3><div class="ap-list">${e.rounds.map(r => `<div class="ap-row"><span class="ap-av n">${esc(r.round)}</span><span><b>${esc(r.title)}</b><small>${esc(r.summary)}</small></span></div>`).join("")}</div>` : ""}
      ${(e.photos || []).length > 1 ? `<h3 class="ap-h">Photos</h3><div class="ap-strip">${e.photos.slice(0, 8).map(ph => `<img src="${esc(photoSrc(ph))}" alt="" loading="lazy">`).join("")}</div>` : ""}
      <a class="ap-cta" href="event.html?e=${encodeURIComponent(e.slug)}">Open the full event page</a>`, { back: true, large: false });
    return p;
  }
  viewPhoto(i, from) {
    const img = $("img", from);
    const v = document.createElement("div");
    v.className = "ap-viewer";
    v.innerHTML = `<img src="${img.src}" alt="${esc(img.alt)}"><button type="button" aria-label="Close photo">Done</button>`;
    this.app.append(v);
    if (!motion.reduced) {
      const r = this.rectIn(from);
      v.animate([{ clipPath: this.insetFor(r, 8), background: "rgba(0,0,0,0)" }, { clipPath: "inset(0 0 0 0 round 0px)", background: "rgba(0,0,0,1)" }], { duration: 360, easing: "cubic-bezier(.2,.9,.2,1)" });
    }
    const close = () => v.remove();
    $("button", v).onclick = close;
    v.addEventListener("click", e => { if (e.target === v) close(); });
  }
  action(act, el) {
    if (act === "theme") { setTheme(el.checked ? "dark" : "light", true, el); buzz(6); }
    if (act === "rebuild") this.onRebuild && this.onRebuild();
    if (act === "replay") playMotion();
    if (act === "motion") { motion.override = el.checked ? "on" : "off"; if (el.checked) playMotion(); }
    if (act === "full") this.onFullscreen && this.onFullscreen();
    if (act === "year") {
      const page = el.closest(".app-page");
      $$("[data-act=year]", page).forEach(b => b.setAttribute("aria-pressed", String(b === el)));
      const y = el.dataset.y;
      $$(".ap-card", page).forEach(c => {
        const show = y === "All" || c.dataset.y === y;
        if (show && c.hidden && !motion.reduced) c.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 300 });
        c.hidden = !show;
      });
      buzz(5);
    }
  }
}
