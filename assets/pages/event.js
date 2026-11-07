import { esc, $, $$, photoSrc, semKey, icons } from "../core/util.js";
import { coverOf, statusLabel } from "./common.js";

export function render(site, events) {
  const slug = new URLSearchParams(location.search).get("e");
  const ev = events.find(x => x.slug === slug);
  if (!ev) {
    document.title = "Event not found | MAD Club";
    return `<header class="page-head wrap"><p class="eyebrow">Not found</p><h1 tabindex="-1">That event is not in the catalogue.</h1>
      <p class="lead">It may have been renamed or removed.</p><p><a class="btn primary" href="events.html">Back to all events ${icons.arrow}</a></p></header>`;
  }
  document.title = `${ev.name} | MAD Club NHCE`;
  const photos = ev.photos || [];
  const cover = coverOf(ev);
  const sorted = [...events].sort((a, b) => semKey(b.semester) - semKey(a.semester));
  const i = sorted.findIndex(x => x.slug === ev.slug);
  const older = sorted[i + 1], newer = sorted[i - 1];
  const reg = ev.status === "open" || ev.status === "upcoming" ? ev.registration_url : "";
  const fact = (k, v) => (v ? `<div><small>${k}</small><span>${esc(v)}</span></div>` : "");
  const when = ev.start_at ? new Date(ev.start_at) : null;
  const whenTxt = when && !isNaN(when) ? when.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "";

  return `
  <section class="wrap ev-hero">
    <div>
      <p class="eyebrow" data-sw="text">${esc(ev.semester)} · ${esc(ev.category || "Event")}</p>
      <h1 data-sw="text" tabindex="-1">${esc(ev.name)}</h1>
      <p data-sw="block"><span class="tag ${esc(ev.status)}">${esc(statusLabel(ev.status))}</span></p>
      <p class="lead" data-sw="text">${esc(ev.description)}</p>
      <div class="facts" data-sw="box">
        ${fact("Date", whenTxt)}${fact("Venue", ev.venue)}${fact("Team size", ev.team_size)}${fact("Eligibility", ev.eligibility)}
      </div>
      <div class="ev-actions" data-sw="block">
        ${reg ? `<a class="btn primary" href="${esc(reg)}">Register for ${esc(ev.name)} ${icons.arrow}</a>` : ""}
        <a class="btn" href="events.html">All events</a>
        <button type="button" class="btn ghost" id="share">Copy link</button>
        <span class="sr" id="share-status" aria-live="polite"></span>
      </div>
    </div>
    <div class="ev-media" data-sw-skip>
      ${cover ? `<img src="${esc(cover)}" alt="${esc(ev.name)}" id="ev-cover">` : `<div class="placeholder-art" id="ev-cover"><span>${esc(ev.name)}</span></div>`}
    </div>
  </section>

  ${(ev.highlights || []).length ? `
  <section class="section wrap">
    <div class="section-head"><div><p class="eyebrow" data-sw="text">Highlights</p><h2 data-sw="text">What made it work</h2></div></div>
    <div class="grid">${ev.highlights.map((h, k) => `<div class="card" data-sw="box"><span class="idx">${String(k + 1).padStart(2, "0")}</span><p style="color:var(--text)">${esc(typeof h === "string" ? h : h.text || h.title || "")}</p></div>`).join("")}</div>
  </section>` : ""}

  ${(ev.rounds || []).length ? `
  <section class="section wrap">
    <div class="section-head"><div><p class="eyebrow" data-sw="text">Format</p><h2 data-sw="text">Rounds</h2></div></div>
    <div class="rounds">${ev.rounds.map(r => `
      <div class="round card" data-sw="box"><div class="when">Round ${esc(r.round)}${r.time ? `<br>${esc(r.time)}` : ""}</div>
      <div><h4>${esc(r.title)}</h4><p>${esc(r.summary)}</p></div></div>`).join("")}</div>
  </section>` : ""}

  ${(ev.prizes || []).length ? `
  <section class="section wrap">
    <div class="section-head"><div><p class="eyebrow" data-sw="text">Recognition</p><h2 data-sw="text">Prizes</h2></div></div>
    <div class="grid">${ev.prizes.map(p => `<div class="card" data-sw="box"><span class="idx">${esc(p.position)}</span><h3>${esc(p.reward)}</h3></div>`).join("")}</div>
  </section>` : ""}

  ${(ev.faq || []).length ? `
  <section class="section wrap">
    <div class="section-head"><div><p class="eyebrow" data-sw="text">Questions</p><h2 data-sw="text">FAQ</h2></div></div>
    <div class="grid two">${ev.faq.map(f => `<div class="card" data-sw="box"><h4>${esc(f.q)}</h4><p>${esc(f.a)}</p></div>`).join("")}</div>
  </section>` : ""}

  <section class="section wrap">
    <div class="section-head"><div><p class="eyebrow" data-sw="text">Gallery</p><h2 data-sw="text">${photos.length ? `${photos.length} photo${photos.length > 1 ? "s" : ""}` : "Photos"}</h2></div></div>
    ${photos.length ? `<div class="gallery">${photos.map((p, k) => `
      <button type="button" class="shot" data-k="${k}" data-src="${esc(photoSrc(p))}" aria-label="Open photo ${k + 1} of ${photos.length}" data-sw="media">
        <img src="${esc(photoSrc(p))}" alt="${esc(ev.name)}, photo ${k + 1}" loading="lazy" decoding="async"></button>`).join("")}</div>`
      : `<div class="empty">Photos will appear here after the event.</div>`}
    <nav class="pager" aria-label="More events">
      ${older ? `<a class="btn sm ghost" href="event.html?e=${encodeURIComponent(older.slug)}">&larr; ${esc(older.name)}</a>` : "<span></span>"}
      ${newer ? `<a class="btn sm ghost" href="event.html?e=${encodeURIComponent(newer.slug)}">${esc(newer.name)} &rarr;</a>` : "<span></span>"}
    </nav>
  </section>

  <dialog class="lb" id="lb" aria-label="Photo viewer">
    <img src="" alt="">
    <div class="lb-bar"><span class="mono" id="lb-cap"></span>
      <span><button class="btn sm" type="button" id="lb-prev" aria-label="Previous photo">&larr;</button>
      <button class="btn sm" type="button" id="lb-next" aria-label="Next photo">&rarr;</button>
      <button class="btn sm primary" type="button" id="lb-close">Close</button></span></div>
  </dialog>`;
}

export function wire({ scope }) {
  const share = $("#share");
  share && scope.on(share, "click", async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      share.textContent = "Link copied";
      $("#share-status").textContent = "Link copied to clipboard";
      scope.timeout(() => (share.textContent = "Copy link"), 2000);
    } catch { share.textContent = "Copy failed"; }
  });

  const lb = $("#lb");
  const shots = $$(".shot");
  if (!lb || !shots.length) return;
  const img = $("img", lb), cap = $("#lb-cap", lb);
  let k = 0, opener = null;
  const show = i => {
    k = (i + shots.length) % shots.length;
    img.src = shots[k].dataset.src;
    img.alt = shots[k].querySelector("img").alt;
    cap.textContent = `${k + 1} / ${shots.length}`;
  };
  shots.forEach((s, i) => s.addEventListener("click", () => {
    opener = s;
    show(i);
    // shared-element expansion from the thumbnail
    const r = s.getBoundingClientRect();
    lb.showModal();
    const z = img.getBoundingClientRect();
    if (z.width && img.animate) img.animate([{ transform: `translate(${r.left - z.left}px, ${r.top - z.top}px) scale(${r.width / z.width})`, transformOrigin: "0 0" }, { transform: "none", transformOrigin: "0 0" }], { duration: 380, easing: "cubic-bezier(.16,1,.3,1)" });
    $("#lb-close", lb).focus();
  }));
  $("#lb-prev", lb).onclick = () => show(k - 1);
  $("#lb-next", lb).onclick = () => show(k + 1);
  $("#lb-close", lb).onclick = () => lb.close();
  lb.addEventListener("close", () => opener && opener.focus());
  lb.addEventListener("click", e => { if (e.target === lb) lb.close(); });
  scope.on(document, "keydown", e => {
    if (!lb.open) return;
    if (e.key === "ArrowRight") show(k + 1);
    if (e.key === "ArrowLeft") show(k - 1);
  });
}
