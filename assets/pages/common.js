// Shared page fragments
import { esc, photoSrc, icons } from "../core/util.js";

export const coverOf = e => (e.photos && e.photos[0] ? photoSrc(e.photos[0]) : e.poster ? photoSrc(e.poster) : "");
export const statusLabel = s => ({ open: "Registration open", upcoming: "Upcoming", completed: "Completed", archived: "Archive" }[s] || s);

export function posterCard(e, { wide = false, half = false } = {}) {
  const cover = coverOf(e);
  return `
    <a class="poster${wide ? " wide" : half ? " half" : ""}" href="event.html?e=${encodeURIComponent(e.slug)}" data-slug="${esc(e.slug)}" data-sw="box">
      <div class="poster-media">
        ${cover
          ? `<img src="${esc(cover)}" alt="${esc(e.name)}" loading="lazy" decoding="async" data-shared="${esc(e.slug)}">`
          : `<div class="placeholder-art" data-shared="${esc(e.slug)}"><span>${esc(e.name)}</span></div>`}
        <span class="tag ${esc(e.status)}">${esc(statusLabel(e.status))}</span>
      </div>
      <div class="poster-body">
        <div class="poster-meta"><span>${esc(e.semester)}</span><span>${esc(e.category || "Event")}</span></div>
        <h3>${esc(e.name)}</h3>
        <p>${esc(e.description)}</p>
        <span class="poster-cta">${e.status === "open" ? "Details and registration" : "Details and photos"} ${icons.arrow}</span>
      </div>
    </a>`;
}

export function pageHead(eyebrow, title, lead) {
  return `
    <header class="page-head wrap">
      <p class="eyebrow" data-sw="text">${esc(eyebrow)}</p>
      <h1 data-sw="text" tabindex="-1">${title}</h1>
      ${lead ? `<p class="lead" data-sw="text">${esc(lead)}</p>` : ""}
    </header>`;
}

// Render a headline whose final sentence is set in the editorial serif
export function splitTitle(t) {
  const s = String(t || "").trim();
  const m = s.match(/^(.*[.!?])\s+([^.!?]+[.!?]?)$/);
  if (!m) return esc(s);
  return `${esc(m[1])} <em class="serif">${esc(m[2])}</em>`;
}
