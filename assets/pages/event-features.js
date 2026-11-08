// Event features: the event pass, story mode and Game Design's genre bowl.
// Everything shown comes from the event's own data (content/events.json).
import { esc, $, $$, photoSrc, motion } from "../core/util.js";

const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const dateOf = ev => {
  const d = ev.start_at ? new Date(ev.start_at) : null;
  return ev.date_confirmed !== false && d && !isNaN(d) && d <= new Date() ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
};

/* ------------------------------------------------------------------ event pass */
// a ticket for the event: its facts on the left, a stub with the event code and a barcode drawn
// from the event's name on the right. Tilts toward the pointer with a moving sheen.
export function passHtml(ev) {
  const code = ev.slug.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 10);
  const bars = [...Array(34)].map((_, i) => { const w = 1 + ((hash(ev.slug + i) >>> 3) % 3); return w; });
  let x = 0;
  const barcode = `<svg viewBox="0 0 ${bars.reduce((a, w) => a + w + 1.4, 0)} 40" preserveAspectRatio="none" aria-hidden="true">${bars.map((w, i) => { const r = `<rect x="${x.toFixed(1)}" width="${w}" height="40"${i % 7 === 3 ? ' opacity=".5"' : ""}/>`; x += w + 1.4; return r; }).join("")}</svg>`;
  const cell = (k, v) => (v ? `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>` : "");
  const cover = (ev.photos || [])[0];
  return `
  <section class="section wrap" aria-label="Event pass">
    <div class="pass-wrap"><article class="pass" data-sw="box" style="${cover ? `--cover:url('${esc(new URL(photoSrc(ev.poster || cover), location.href).href)}')` : ""}">
      <div class="pass-main">
        <span class="pass-k">MAD Club · Event pass</span>
        <b class="pass-name">${esc(ev.name)}</b>
        <span class="pass-cat">${esc(ev.category || "Event")} · ${esc(ev.semester)}</span>
        <dl class="pass-grid">${cell("Date", dateOf(ev))}${cell("Venue", ev.venue)}${cell("Rounds", (ev.rounds || []).length ? String(ev.rounds.length) : "")}${cell("Participants", ev.participants ? String(ev.participants) : "")}</dl>
      </div>
      <div class="pass-stub">
        <span class="pass-k">Event code</span>
        <b class="pass-code">${esc(code)}</b>
        <span class="pass-bar">${barcode}</span>
        <span class="pass-done">Completed</span>
      </div>
      <i class="pass-sheen" aria-hidden="true"></i>
    </article></div>
  </section>`;
}
export function wirePass(scope) {
  const p = $(".pass");
  if (!p || motion.reduced) return;
  scope.on(p, "pointermove", e => {
    const r = p.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    p.style.setProperty("--rx", `${(-y * 6).toFixed(2)}deg`);
    p.style.setProperty("--ry", `${(x * 9).toFixed(2)}deg`);
    p.style.setProperty("--sx", `${((x + 0.5) * 100).toFixed(1)}%`);
  });
  scope.on(p, "pointerleave", () => { p.style.setProperty("--rx", "0deg"); p.style.setProperty("--ry", "0deg"); p.style.setProperty("--sx", "-30%"); });
}

/* ------------------------------------------------------------------ story mode */
// The event as a story: title, each round, then the photos. Tap right/left to move, hold to
// pause, swipe down or Esc to close. Auto-advances like a social story.
export function wireStory(ev, scope) {
  const btn = $("#story");
  if (!btn) return;
  const slides = [
    { kind: "title" },
    ...(ev.rounds || []).filter(r => r.summary).map(r => ({ kind: "round", r })),
    ...(ev.photos || []).map(src => ({ kind: "photo", src: photoSrc(src) })),
    { kind: "end" }
  ];
  const d = document.createElement("dialog");
  d.className = "story";
  d.setAttribute("aria-label", `${ev.name} story`);
  d.innerHTML = `<div class="st-frame">
      <div class="st-bars">${slides.map(() => "<i><b></b></i>").join("")}</div>
      <div class="st-head"><img src="assets/brand/mad-app-icon.svg" alt=""><span><b>${esc(ev.name)}</b><small>${esc(ev.semester)}</small></span><button type="button" class="st-x" aria-label="Close story">×</button></div>
      <div class="st-stage" aria-live="polite"></div>
      <button type="button" class="st-prev" aria-label="Previous"></button><button type="button" class="st-next" aria-label="Next"></button>
    </div>`;
  document.body.append(d);
  scope.add(() => d.remove());
  const stage = $(".st-stage", d), bars = $$(".st-bars b", d);
  let i = 0, t0 = 0, paused = false, raf = 0, pausedAt = 0;
  const dur = s => (s.kind === "photo" ? 3800 : s.kind === "round" ? 5200 : 4200);
  const draw = () => {
    const s = slides[i];
    bars.forEach((b, k) => (b.style.width = k < i ? "100%" : "0%"));
    stage.innerHTML = s.kind === "title"
      ? `<div class="st-card st-title"><span>${esc(ev.category || "Event")}</span><h2>${esc(ev.name)}</h2><p>${esc(ev.description)}</p>${ev.participants ? `<small>${esc(String(ev.participants))} participants${ev.venue ? ` · ${esc(ev.venue)}` : ""}</small>` : ""}</div>`
      : s.kind === "round"
      ? `<div class="st-card"><span>Round ${esc(s.r.round)}</span><h2>${esc(s.r.title)}</h2><p>${esc(s.r.summary)}</p></div>`
      : s.kind === "photo"
      ? `<img class="st-photo" src="${esc(s.src)}" alt="${esc(ev.name)} photo">`
      : `<div class="st-card st-end"><h2>That was ${esc(ev.name)}.</h2><p>${(ev.photos || []).length} photos in the gallery.</p><a class="btn primary" href="gallery.html?e=${encodeURIComponent(ev.slug)}">Open the gallery</a></div>`;
    t0 = performance.now();
  };
  const go = k => { if (k < 0) k = 0; if (k >= slides.length) return close(); i = k; draw(); };
  const tick = now => {
    if (!d.open) return;
    if (!paused) {
      const p = Math.min(1, (now - t0) / dur(slides[i]));
      bars[i].style.width = `${p * 100}%`;
      if (p >= 1) { if (i < slides.length - 1) go(i + 1); else bars[i].style.width = "100%"; }
    }
    raf = requestAnimationFrame(tick);
  };
  const open = () => { i = 0; d.showModal(); draw(); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); };
  const close = () => { cancelAnimationFrame(raf); if (d.open) d.close(); };
  scope.on(btn, "click", open);
  $(".st-x", d).onclick = close;
  $(".st-next", d).onclick = () => go(i + 1);
  $(".st-prev", d).onclick = () => go(i - 1);
  d.addEventListener("cancel", e => { e.preventDefault(); close(); });
  d.addEventListener("keydown", e => { if (e.key === "ArrowRight") go(i + 1); if (e.key === "ArrowLeft") go(i - 1); });
  // hold to pause, swipe down to close
  let sy = 0, held = 0;
  d.addEventListener("pointerdown", e => { sy = e.clientY; held = setTimeout(() => { paused = true; pausedAt = performance.now(); d.classList.add("paused"); }, 180); });
  const up = e => {
    clearTimeout(held);
    if (paused) { t0 += performance.now() - pausedAt; paused = false; d.classList.remove("paused"); }
    if (e.clientY - sy > 90) close();
  };
  d.addEventListener("pointerup", up);
  d.addEventListener("pointercancel", up);
}

/* ------------------------------------------------------------------ Game Design: the genre bowl */
const GENRE_LINES = {
  Arcade: { line: "Fast reflexes, high scores, one more try.", c: "#E8609E" },
  Puzzle: { line: "Logic first: every level is a lock to open.", c: "#1FA77F" },
  Racing: { line: "Speed, lines and the perfect lap.", c: "#F07C2E" }
};
export function bowlHtml(ev) {
  const g = ev.genres || [];
  return `
  <section class="section wrap bowl-sec" aria-labelledby="bowl-h">
    <div class="section-head"><div><p class="eyebrow" data-sw="text">The draw</p><h2 id="bowl-h" data-sw="text">Draw a genre, like the participants did</h2></div></div>
    <div class="bowl-wrap" data-sw="box">
      <button type="button" class="bowl" id="bowl" aria-label="Draw a chit from the bowl">
        <span class="bowl-chits">${g.map((x, k) => `<i style="--k:${k}"></i>`).join("")}${g.map((x, k) => `<i style="--k:${k + 3}"></i>`).join("")}</span>
        <span class="bowl-glass"></span>
        <span class="bowl-hint">Tap the bowl</span>
      </button>
      <div class="chit-out" id="chit-out" aria-live="polite"><p class="chit-wait">Every participant drew one of ${g.length} genres: ${g.map(esc).join(", ")}.</p></div>
    </div>
  </section>`;
}
export function wireBowl(ev, scope) {
  const bowl = $("#bowl"), out = $("#chit-out"), sec = $(".bowl-sec");
  if (!bowl) return;
  const genres = ev.genres || [];
  let last = -1, n = 0;
  scope.on(bowl, "click", () => {
    let k;
    do { k = Math.floor(Math.random() * genres.length); } while (genres.length > 1 && k === last);
    last = k; n++;
    const name = genres[k], info = GENRE_LINES[name] || { line: "", c: "var(--accent)" };
    sec.style.setProperty("--genre", info.c);
    bowl.classList.remove("shake"); void bowl.offsetWidth; bowl.classList.add("shake");
    out.innerHTML = `<div class="chit" style="--genre:${info.c}"><small>Chit ${n}</small><b>${esc(name)}</b><span>${esc(info.line)}</span></div>`;
    const chit = $(".chit", out);
    if (!motion.reduced) {
      const b = bowl.getBoundingClientRect(), c = chit.getBoundingClientRect();
      chit.animate([
        { transform: `translate(${b.left + b.width / 2 - (c.left + c.width / 2)}px, ${b.top + b.height * 0.4 - (c.top + c.height / 2)}px) scale(.2) rotate(-30deg)`, opacity: 0 },
        { transform: `translate(${(b.left + b.width / 2 - (c.left + c.width / 2)) * 0.4}px, -60px) scale(.6) rotate(10deg)`, opacity: 1, offset: 0.45 },
        { transform: "none", opacity: 1 }
      ], { duration: 720, easing: "cubic-bezier(.2,.9,.2,1)" });
      chit.animate([{ clipPath: "inset(0 0 70% 0 round 14px)" }, { clipPath: "inset(0 0 70% 0 round 14px)", offset: 0.6 }, { clipPath: "inset(0 0 0% 0 round 14px)" }], { duration: 900, easing: "cubic-bezier(.16,1,.3,1)" });
    }
  });
}
