import { esc, $, $$, semYear, semKey, yearLabel, icons, motion } from "../core/util.js";
import { posterCard, pageHead } from "./common.js";
import { wireSeg } from "../core/seg.js";

export function render(site, events) {
  const years = [...new Set(events.map(e => semYear(e.semester)).filter(Boolean))].sort().reverse();
  const q = new URLSearchParams(location.search);
  const y = years.includes(q.get("y")) ? q.get("y") : "all";
  return `
  ${pageHead("Events", `Hackathons, design sprints <em class="serif">and arenas.</em>`, `All ${events.length} MAD events since ${site.established}: what ran, who it was for, and the photos.`)}
  <section class="wrap" aria-label="Filter events">
    <div class="tools" data-sw="block">
      <div class="tools-row">
        <label class="search"><span class="sr">Search events</span>${icons.search}<input id="q" type="search" placeholder="Search by name, topic or semester" autocomplete="off"></label>
        <span class="count" id="count" aria-live="polite"></span>
      </div>
      <div class="tools-row">
        <div class="seg" id="f-kind" role="group" aria-label="Type">
          <button type="button" data-v="all" aria-pressed="true">All</button>
          <button type="button" data-v="flagship" aria-pressed="false">Flagships</button>
          <button type="button" data-v="photos" aria-pressed="false">With photos</button>
        </div>
        <div class="seg" id="f-year" role="group" aria-label="Academic year">
          <button type="button" data-v="all" aria-pressed="${y === "all"}">All years</button>
          ${years.map(v => `<button type="button" data-v="${v}" aria-pressed="${y === v}">${yearLabel(v)}</button>`).join("")}
        </div>
      </div>
    </div>
    <div id="grid" class="posters" data-sw-off></div>
    <div class="archive" id="archive" data-sw-off></div>
  </section>`;
}

export function wire({ events, scope, director }) {
  const state = { q: "", kind: "all", year: new URLSearchParams(location.search).get("y") || "all" };
  const grid = $("#grid"), count = $("#count"), archive = $("#archive");
  const sorted = [...events].sort((a, b) => semKey(b.semester) - semKey(a.semester) || String(b.start_at).localeCompare(String(a.start_at)));

  const draw = () => {
    const first = new Map($$(".poster", grid).map(c => [c.dataset.slug, c.getBoundingClientRect()]));
    const q = state.q.trim().toLowerCase();
    const list = sorted.filter(e =>
      (state.kind === "all" || (state.kind === "flagship" ? e.flagship : (e.photos || []).length > 0)) &&
      (state.year === "all" || semYear(e.semester) === state.year) &&
      (!q || `${e.name} ${e.description} ${e.semester} ${e.category || ""}`.toLowerCase().includes(q)));
    count.textContent = `${list.length} of ${events.length} events`;
    // documented events get the full poster; the early ones (names and rounds only) sit in a
    // compact archive timeline underneath
    const full = list.filter(e => e.date_confirmed !== false), early = list.filter(e => e.date_confirmed === false);
    grid.innerHTML = full.length
      ? full.map(e => posterCard(e)).join("").replaceAll(' data-sw="box"', "")
      : early.length ? "" : `<div class="empty" style="grid-column:1/-1">No events match. Try another filter or clear the search.</div>`;
    archive.innerHTML = early.length ? `<h2 class="archive-h">The early years <span>${early.length} event${early.length > 1 ? "s" : ""}, 2023 to 2025</span></h2>
      <ol class="archive-list">${early.map(e => `<li class="arc" data-sw="block">
        <span class="arc-sem">${esc(e.semester)}</span>
        <span class="arc-main"><b>${esc(e.name)}</b><small>${esc(e.description)}</small>
          ${(e.rounds || []).length ? `<span class="arc-rounds">${e.rounds.map(r => `<i>${esc(r.title)}</i>`).join("")}</span>` : ""}</span>
        ${(e.photos || []).length ? `<a class="btn sm ghost" href="gallery.html?e=${encodeURIComponent(e.slug)}">${e.photos.length} photos</a>` : ""}
      </li>`).join("")}</ol>` : "";
    if (motion.reduced) return;
    $$(".poster", grid).forEach((c, i) => {
      const f = first.get(c.dataset.slug);
      const l = c.getBoundingClientRect();
      if (f) {
        const dx = f.left - l.left, dy = f.top - l.top;
        if (dx || dy) c.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: "none" }], { duration: 520, easing: "cubic-bezier(.34,1.2,.64,1)" });
      } else {
        c.animate([{ opacity: 0, clipPath: "inset(0 0 100% 0 round 24px)" }, { opacity: 1, clipPath: "inset(0 0 0% 0 round 24px)" }], { duration: 480, delay: i * 40, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
      }
    });
  };

  wireSeg($("#f-kind"), { scope, onSelect: b => { state.kind = b.dataset.v; director.morph(grid, draw); } });
  wireSeg($("#f-year"), { scope, onSelect: b => { state.year = b.dataset.v; director.morph(grid, draw); } });
  scope.on($("#q"), "input", e => { state.q = e.target.value; draw(); });
  draw();

  // Construct the initial poster wall with the swarm (cards are created after hold)
  $$(".poster", grid).forEach(c => c.setAttribute("data-sw", "box"));
  grid.removeAttribute("data-sw-off");
  archive.removeAttribute("data-sw-off");
  return { construct: true };
}
