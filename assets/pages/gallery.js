import { esc, $, $$, photoSrc, semKey, motion } from "../core/util.js";
import { pageHead } from "./common.js";
import { wireSeg } from "../core/seg.js";

// Every event photo in one place: a filterable mosaic with a shared-element lightbox.
const withPhotos = events => [...events]
  .filter(e => (e.photos || []).length)
  .sort((a, b) => semKey(b.semester) - semKey(a.semester) || String(b.start_at).localeCompare(String(a.start_at)));

export function render(site, events) {
  const evs = withPhotos(events);
  const total = evs.reduce((n, e) => n + e.photos.length, 0);
  const pick = new URLSearchParams(location.search).get("e");
  const sel = evs.some(e => e.slug === pick) ? pick : "all";
  let n = 0;
  return `
  ${pageHead("Gallery", `Every event, <em class="serif">in frames.</em>`, `${total} photos from ${evs.length} events. Tap any photo to open it.`)}
  <section class="wrap">
    <div class="tools" data-sw="block">
      <div class="seg gal-seg" id="f-ev" role="group" aria-label="Event">
        <button type="button" data-v="all" aria-pressed="${sel === "all"}">All</button>
        ${evs.map(e => `<button type="button" data-v="${esc(e.slug)}" aria-pressed="${sel === e.slug}">${esc(e.name)}</button>`).join("")}
      </div>
    </div>
    <div class="mosaic" id="mosaic">
      ${evs.map(e => e.photos.map((p, k) => `
        <button type="button" class="tile${motion.reduced ? "" : " negative"}" data-ev="${esc(e.slug)}" data-i="${n++}" data-src="${esc(photoSrc(p))}"
          data-cap="${esc(e.name)} · ${k + 1} of ${e.photos.length}" data-href="event.html?e=${encodeURIComponent(e.slug)}"
          ${sel !== "all" && sel !== e.slug ? "hidden" : ""} aria-label="Open ${esc(e.name)} photo ${k + 1}" data-sw="media">
          <img src="${esc(photoSrc(p))}" alt="${esc(e.name)}, photo ${k + 1}" loading="lazy" decoding="async">
          <span class="tile-cap"><b>${esc(e.name)}</b><small>${esc(e.semester)}</small></span>
        </button>`).join("")).join("")}
    </div>
  </section>

  <dialog class="lb" id="lb" aria-label="Photo viewer">
    <img src="" alt="">
    <div class="lb-bar"><span class="mono" id="lb-cap"></span>
      <span><a class="btn sm ghost" id="lb-ev" href="#">Event</a>
      <button class="btn sm" type="button" id="lb-prev" aria-label="Previous photo">&larr;</button>
      <button class="btn sm" type="button" id="lb-next" aria-label="Next photo">&rarr;</button>
      <button class="btn sm primary" type="button" id="lb-close">Close</button></span></div>
  </dialog>`;
}

export function wire({ scope, director }) {
  const box = $("#mosaic");
  if (!box) return;
  const tiles = $$(".tile", box);
  // darkroom: each photo waits as a negative; when a builder finishes building it, it develops
  if (!motion.reduced) {
    const dev = t => { if (!t.classList.contains("negative") || t.classList.contains("sw-hold")) return; t.classList.remove("negative"); t.classList.add("developing"); setTimeout(() => t.classList.remove("developing"), 2200); };
    const mo = new MutationObserver(ms => ms.forEach(m => dev(m.target)));
    tiles.forEach(t => mo.observe(t, { attributes: true, attributeFilter: ["class"] }));
    scope.add(() => mo.disconnect());
    // anything shown without a build (filter changes, motion switched off) develops on sight
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setTimeout(() => dev(e.target), 600)), { threshold: 0.2 });
    tiles.forEach(t => io.observe(t));
    scope.add(() => io.disconnect());
  }

  wireSeg($("#f-ev"), {
    scope,
    onSelect: b => director.morph(box, () => {
      const v = b.dataset.v;
      const first = new Map(tiles.map(t => [t, t.getBoundingClientRect()]));
      tiles.forEach(t => (t.hidden = !(v === "all" || t.dataset.ev === v)));
      const u = new URL(location.href);
      v === "all" ? u.searchParams.delete("e") : u.searchParams.set("e", v);
      history.replaceState(history.state, "", u);
      tiles.filter(t => !t.hidden).forEach((t, i) => {
        const f = first.get(t), l = t.getBoundingClientRect();
        if (f && f.width && (f.left !== l.left || f.top !== l.top)) t.animate([{ transform: `translate(${f.left - l.left}px,${f.top - l.top}px)` }, { transform: "none" }], { duration: 520, easing: "cubic-bezier(.34,1.15,.64,1)" });
        else if (!f || !f.width) t.animate([{ opacity: 0, transform: "translateY(14px) scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 420, delay: Math.min(i * 24, 360), easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
      });
    })
  });

  // lightbox walks only the photos currently shown
  const lb = $("#lb"), img = $("img", lb), cap = $("#lb-cap", lb), evLink = $("#lb-ev", lb);
  let list = [], k = 0, opener = null;
  const show = i => {
    k = (i + list.length) % list.length;
    const t = list[k];
    img.src = t.dataset.src;
    img.alt = t.querySelector("img").alt;
    cap.textContent = t.dataset.cap;
    evLink.href = t.dataset.href;
    evLink.textContent = "Event page";
  };
  tiles.forEach(t => scope.on(t, "click", () => {
    list = tiles.filter(x => !x.hidden);
    opener = t;
    show(list.indexOf(t));
    const r = t.getBoundingClientRect();
    lb.showModal();
    const z = img.getBoundingClientRect();
    if (z.width && img.animate) img.animate([{ transform: `translate(${r.left - z.left}px, ${r.top - z.top}px) scale(${r.width / z.width})`, transformOrigin: "0 0" }, { transform: "none", transformOrigin: "0 0" }], { duration: 420, easing: "cubic-bezier(.16,1,.3,1)" });
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
  // swipe on touch screens
  let sx = null;
  lb.addEventListener("touchstart", e => (sx = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", e => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 48) show(k + (dx < 0 ? 1 : -1));
    sx = null;
  });
}
