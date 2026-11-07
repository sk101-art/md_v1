// Persistent shell: floating glass navigation pill, mobile sheet, appearance toggle,
// command palette, footer, draft banner and the optional developer HUD.
import { $, $$, esc, icons, normalizeRoute, semKey, semYear, yearLabel, motion } from "./util.js";
import { draftKeys } from "./content.js";

export const NAV = [
  ["index.html", "Home"],
  ["events.html", "Events"],
  ["about.html", "About"],
  ["achievements.html", "Achievements"],
  ["team.html", "Team"],
  ["contact.html", "Contact"]
];

const root = document.documentElement;
const TI = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const TABS = [
  ["index.html", "Home", TI('<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1Z"/>')],
  ["events.html", "Events", TI('<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/>')],
  ["achievements.html", "Work", TI('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M17 6h3a3 3 0 0 1-3 4M7 6H4a3 3 0 0 0 3 4"/>')],
  ["team.html", "Team", TI('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.2c2.4.2 4 1.8 4.5 4.3"/>')],
  ["contact.html", "Join", TI('<path d="M12 5v14M5 12h14"/>')]
];

export function setTheme(t, persist = true, origin = null) {
  const next = t === "dark" ? "dark" : "light";
  // circular reveal from the control that was pressed (View Transitions where supported)
  if (origin && document.startViewTransition && !motion.reduced && next !== root.dataset.theme) {
    const r = origin.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => applyTheme(next, persist));
    vt.ready.then(() => document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] },
      { duration: 620, easing: "cubic-bezier(.65,0,.35,1)", pseudoElement: "::view-transition-new(root)" })).catch(() => {});
    return;
  }
  applyTheme(next, persist);
}
function applyTheme(t, persist) {
  root.dataset.theme = t;
  if (persist) { try { localStorage.setItem("mad_theme", root.dataset.theme); } catch {} }
  const m = $('meta[name="theme-color"]');
  if (m) m.content = root.dataset.theme === "dark" ? "#0F141C" : "#F7F8FA";
  const b = $("#theme-btn");
  if (b) {
    b.innerHTML = root.dataset.theme === "dark" ? icons.sun : icons.moon;
    b.setAttribute("aria-label", root.dataset.theme === "dark" ? "Switch to light appearance" : "Switch to Graphite (dark) appearance");
  }
}

export function buildShell(site, events, { navigate, director }) {
  const navLinks = NAV.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join("");
  document.body.insertAdjacentHTML("afterbegin", `
    <a class="skip" href="#main">Skip to content</a>
    <header class="nav" id="nav">
      <div class="nav-pill glass" data-sw="box" data-sw-g="0">
        <a class="brand" href="index.html" aria-label="${esc(site.name)} home" data-sw="block">
          <img class="brand-mark" src="assets/brand/mad-logo.svg" alt="" width="23" height="36">
          <span class="brand-name">${esc(site.name)}</span><span class="brand-tag">${esc(site.college_short)}</span>
        </a>
        <span class="nav-progress" aria-hidden="true"></span>
        <nav class="nav-links" aria-label="Primary" data-sw="block"><span class="nav-indicator" aria-hidden="true"></span><ul>${navLinks}</ul></nav>
        <div class="nav-tools" data-sw="block">
          <button class="icon-btn search-btn" id="open-pal" type="button" aria-label="Search pages and events (Ctrl K)">${icons.search}<span>Search</span><kbd>Ctrl K</kbd></button>
          <button class="icon-btn" id="theme-btn" type="button"></button>
          <button class="icon-btn menu-btn" id="menu-btn" type="button" aria-expanded="false" aria-controls="menu-sheet">Menu</button>
        </div>
      </div>
    </header>
    <nav class="menu-sheet glass" id="menu-sheet" aria-label="Menu">${NAV.map(([h, t]) => `<a href="${h}">${t}</a>`).join("")}</nav>
    <nav class="tabbar glass" aria-label="Quick navigation"><span class="tab-ind" aria-hidden="true"></span>${TABS.map(([h, t, ic]) => `<a href="${h}">${ic}<span>${t}</span></a>`).join("")}</nav>`);

  const years = [...new Set(events.map(e => semYear(e.semester)).filter(Boolean))].sort().reverse();
  document.body.insertAdjacentHTML("beforeend", `
    <footer class="foot">
      <div class="wrap">
        <div class="foot-grid">
          <div>
            <div class="foot-mark" data-sw="media"><img src="assets/brand/mad-logo.svg" alt="" width="30" height="46"><b>${esc(site.name)}</b></div>
            <p>${esc(site.full_name)}, ${esc(site.college)}. Est. ${esc(site.established)}.</p>
            <p><a href="${esc(site.instagram)}" target="_blank" rel="noopener">${esc(site.instagram_handle)}</a>${site.contact?.email ? ` · <a href="mailto:${esc(site.contact.email)}">${esc(site.contact.email)}</a>` : ""}</p>
          </div>
          <div><h4>Explore</h4><ul>${NAV.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join("")}</ul></div>
          <div><h4>Event archive</h4><ul>${years.map(y => `<li><a href="events.html?y=${esc(y)}">${yearLabel(y)}</a></li>`).join("")}</ul></div>
        </div>
        <div class="foot-legal"><span>&copy; ${new Date().getFullYear()} ${esc(site.full_name)}, ${esc(site.college_short)}. ${esc(site.tagline || "")}</span><span><button type="button" class="linkish" id="replay-build">Replay the build</button> · <a href="admin/">Editor</a></span></div>
      </div>
    </footer>`);

  // drafts preview banner (admin testing editor)
  const drafts = draftKeys().map(k => k.slice(12));
  if (drafts.length) {
    document.body.insertAdjacentHTML("beforeend", `<div class="draft-banner" role="status">Previewing unpublished drafts: ${esc(drafts.join(", "))} <button type="button" id="discard-drafts">Discard</button><a href="admin/">Editor</a></div>`);
    $("#discard-drafts").onclick = () => { draftKeys().forEach(k => { try { localStorage.removeItem(k); } catch {} }); location.reload(); };
  }

  // appearance
  let saved = null;
  try { saved = localStorage.getItem("mad_theme"); } catch {}
  setTheme(saved || "light", false);
  $("#theme-btn").onclick = e => setTheme(root.dataset.theme === "dark" ? "light" : "dark", true, e.currentTarget);

  // mobile sheet
  const sheet = $("#menu-sheet"), mb = $("#menu-btn");
  const setMenu = open => { sheet.classList.toggle("open", open); mb.setAttribute("aria-expanded", String(open)); mb.textContent = open ? "Close" : "Menu"; };
  mb.onclick = () => setMenu(!sheet.classList.contains("open"));
  sheet.addEventListener("click", e => e.target.closest("a") && setMenu(false));
  document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

  $("#replay-build").onclick = () => playMotion();
  motionNotice();
  wirePalette(site, events, navigate);
  wireDevHud(director);
}

// Turn animations on (overriding a reduced-motion device setting) and replay the build
export function playMotion() {
  if (motion.reduced) motion.override = "on";
  $(".motion-chip")?.remove();
  document.dispatchEvent(new CustomEvent("mad:replay"));
}

// Honour reduced motion, but say so, and offer a way in
function motionNotice() {
  if (!motion.osReduced || motion.override) return;
  document.body.insertAdjacentHTML("beforeend", `<div class="motion-chip glass" role="status">
    <span>Animations are paused because your device asks for reduced motion.</span>
    <button type="button" class="btn sm primary" id="mc-play">Play animations</button>
    <button type="button" class="mc-x" id="mc-x" aria-label="Keep animations off">&times;</button></div>`);
  $("#mc-play").onclick = () => playMotion();
  $("#mc-x").onclick = () => { motion.override = "off"; $(".motion-chip")?.remove(); };
}

export function markActive(route) {
  $$(".nav-links a, .menu-sheet a, .tabbar a").forEach(a => {
    const on = normalizeRoute(a.getAttribute("href")) === route || (route === "event" && a.getAttribute("href") === "events.html");
    if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  placeIndicator();
}

export function placeIndicator() {
  const ti = $(".tab-ind"), tb = $(".tabbar");
  if (ti && tb) {
    const cur = $("a[aria-current]", tb);
    if (cur) {
      const c = tb.getBoundingClientRect(), r = cur.getBoundingClientRect();
      ti.style.width = `${r.width}px`;
      ti.style.transform = `translateX(${r.left - c.left}px)`;
      ti.style.opacity = "1";
    } else ti.style.opacity = "0";
  }
  const ind = $(".nav-indicator"), links = $(".nav-links");
  if (!ind || !links) return;
  const a = $("a[aria-current]", links);
  if (!a) { ind.classList.remove("on"); return; }
  const c = links.getBoundingClientRect(), r = a.getBoundingClientRect();
  ind.style.width = `${r.width}px`;
  ind.style.transform = `translateX(${r.left - c.left}px)`;
  ind.classList.add("on");
}
window.addEventListener("resize", () => placeIndicator(), { passive: true });

function wirePalette(site, events, navigate) {
  const d = document.createElement("dialog");
  d.className = "pal";
  d.setAttribute("aria-label", "Search");
  d.innerHTML = `<input id="pal-input" type="text" role="combobox" aria-expanded="true" aria-controls="pal-list" aria-autocomplete="list" placeholder="Search pages and events" autocomplete="off">
    <ul id="pal-list" role="listbox"></ul>
    <div class="pal-hint"><span><kbd>&uarr;</kbd> <kbd>&darr;</kbd> to move, <kbd>Enter</kbd> to open</span><span><kbd>Esc</kbd> to close</span></div>`;
  document.body.append(d);
  const items = [
    ...NAV.map(([h, t]) => ({ g: "Page", t, run: () => navigate(h) })),
    ...[...events].sort((a, b) => semKey(b.semester) - semKey(a.semester)).map(e => ({ g: "Event", t: e.name, s: `${e.semester} · ${e.category || "Event"}`, run: () => navigate(`event.html?e=${encodeURIComponent(e.slug)}`) })),
    { g: "Motion", t: "Replay the swarm build", run: () => playMotion() },
    { g: "Design", t: "Inspect mode (press I)", s: "Hover anything to see size, type and colour", run: () => window.__mad?.inspector?.toggle(true) },
    { g: "Design", t: "Slow motion: hold Shift", s: "Study any animation at 0.18× speed", run: () => {} },
    { g: "Motion", t: "Turn animations off", run: () => { motion.override = "off"; location.reload(); } },
    { g: "Appearance", t: "Toggle light / Graphite appearance", run: () => setTheme(root.dataset.theme === "dark" ? "light" : "dark") },
    { g: "Social", t: `Open Instagram ${site.instagram_handle}`, run: () => window.open(site.instagram, "_blank", "noopener") }
  ];
  const input = $("#pal-input", d), list = $("#pal-list", d);
  let sel = 0, shown = [];
  const draw = () => {
    const q = input.value.trim().toLowerCase();
    shown = items.filter(i => !q || `${i.t} ${i.s || ""} ${i.g}`.toLowerCase().includes(q)).slice(0, 9);
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    list.innerHTML = shown.map((i, k) => `<li role="option" id="pal-o${k}" aria-selected="${k === sel}" data-k="${k}"><span><b>${esc(i.t)}</b>${i.s ? `<small>${esc(i.s)}</small>` : ""}</span><kbd>${i.g}</kbd></li>`).join("") || `<li aria-disabled="true">No matches</li>`;
    input.setAttribute("aria-activedescendant", shown.length ? `pal-o${sel}` : "");
  };
  const run = k => { const i = shown[k]; if (!i) return; d.close(); i.run(); };
  input.oninput = () => { sel = 0; draw(); };
  input.onkeydown = e => {
    if (e.key === "ArrowDown") { sel = (sel + 1) % Math.max(1, shown.length); draw(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { sel = (sel - 1 + shown.length) % Math.max(1, shown.length); draw(); e.preventDefault(); }
    else if (e.key === "Enter") run(sel);
  };
  list.onclick = e => { const li = e.target.closest("li[data-k]"); if (li) run(+li.dataset.k); };
  d.addEventListener("click", e => { if (e.target === d) d.close(); });
  const open = () => { input.value = ""; sel = 0; draw(); d.showModal(); input.focus(); };
  $("#open-pal").onclick = open;
  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); d.open ? d.close() : open(); }
    else if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName) && !d.open) {
      const q = $("#q");
      e.preventDefault();
      q ? q.focus() : open();
    }
  });
}

// Engineering metrics live here, behind Ctrl+Shift+D, never in the visitor UI.
function wireDevHud(director) {
  let el = null, raf = 0, build = "IDLE";
  document.addEventListener("mad:build", e => { build = e.detail.state; });
  const toggle = () => {
    if (el) { el.remove(); el = null; cancelAnimationFrame(raf); return; }
    el = document.createElement("aside");
    el.className = "dev-hud";
    el.setAttribute("aria-label", "Developer HUD");
    document.body.append(el);
    let frames = 0, last = performance.now(), fps = 0;
    const loop = now => {
      frames++;
      if (now - last > 500) {
        fps = Math.round((frames * 1000) / (now - last)); frames = 0; last = now;
        el.innerHTML = `route <b>${document.body.dataset.page}</b><br>fps <b>${fps}</b><br>build <b>${build}</b><br>swarm runs <b>${director.runs.size}</b> · agents <b>${director.agents.length}</b><br>last construct <b>${director.stats.layers}</b> layers in <b>${director.stats.lastMs}ms</b><br>reduced motion <b>${!director.enabled}</b><br><button type="button" id="dev-x">Close</button>`;
        $("#dev-x", el).onclick = toggle;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  };
  document.addEventListener("keydown", e => { if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") { e.preventDefault(); toggle(); } });
}
