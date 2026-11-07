// Persistent shell: floating glass navigation pill, mobile sheet, appearance toggle,
// command palette, footer, draft banner and the optional developer HUD.
import { $, $$, esc, icons, normalizeRoute, semKey, semYear, yearLabel } from "./util.js";
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

export function setTheme(t, persist = true) {
  root.dataset.theme = t === "dark" ? "dark" : "light";
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
          <img class="brand-mark" src="assets/brand/mad-emblem.svg" alt="" width="34" height="34">
          <span class="brand-name">${esc(site.name)}</span><span class="brand-tag">${esc(site.college_short)}</span>
        </a>
        <nav class="nav-links" aria-label="Primary" data-sw="block"><span class="nav-indicator" aria-hidden="true"></span><ul>${navLinks}</ul></nav>
        <div class="nav-tools" data-sw="block">
          <button class="icon-btn search-btn" id="open-pal" type="button" aria-label="Search pages and events (Ctrl K)">${icons.search}<span>Search</span><kbd>Ctrl K</kbd></button>
          <button class="icon-btn" id="theme-btn" type="button"></button>
          <button class="icon-btn menu-btn" id="menu-btn" type="button" aria-expanded="false" aria-controls="menu-sheet">Menu</button>
        </div>
      </div>
    </header>
    <nav class="menu-sheet glass" id="menu-sheet" aria-label="Menu">${NAV.map(([h, t]) => `<a href="${h}">${t}</a>`).join("")}</nav>`);

  const years = [...new Set(events.map(e => semYear(e.semester)).filter(Boolean))].sort().reverse();
  document.body.insertAdjacentHTML("beforeend", `
    <footer class="foot">
      <div class="wrap">
        <div class="foot-grid">
          <div>
            <div class="foot-mark"><img src="assets/brand/mad-emblem.svg" alt="" width="40" height="40"><b>${esc(site.name)}</b></div>
            <p>${esc(site.full_name)}, ${esc(site.college)}. Est. ${esc(site.established)}.</p>
            <p><a href="${esc(site.instagram)}" target="_blank" rel="noopener">${esc(site.instagram_handle)}</a>${site.contact?.email ? ` · <a href="mailto:${esc(site.contact.email)}">${esc(site.contact.email)}</a>` : ""}</p>
          </div>
          <div><h4>Explore</h4><ul>${NAV.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join("")}</ul></div>
          <div><h4>Event archive</h4><ul>${years.map(y => `<li><a href="events.html?y=${esc(y)}">${yearLabel(y)}</a></li>`).join("")}</ul></div>
        </div>
        <div class="foot-legal"><span>&copy; ${new Date().getFullYear()} ${esc(site.full_name)}, ${esc(site.college_short)}. ${esc(site.tagline || "")}</span><span><a href="admin/">Editor</a></span></div>
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
  $("#theme-btn").onclick = () => setTheme(root.dataset.theme === "dark" ? "light" : "dark");

  // mobile sheet
  const sheet = $("#menu-sheet"), mb = $("#menu-btn");
  const setMenu = open => { sheet.classList.toggle("open", open); mb.setAttribute("aria-expanded", String(open)); mb.textContent = open ? "Close" : "Menu"; };
  mb.onclick = () => setMenu(!sheet.classList.contains("open"));
  sheet.addEventListener("click", e => e.target.closest("a") && setMenu(false));
  document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

  wirePalette(site, events, navigate);
  wireDevHud(director);
}

export function markActive(route) {
  $$(".nav-links a, .menu-sheet a").forEach(a => {
    const on = normalizeRoute(a.getAttribute("href")) === route || (route === "event" && a.getAttribute("href") === "events.html");
    if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  placeIndicator();
}

export function placeIndicator() {
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
