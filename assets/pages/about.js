import { esc, $, $$ } from "../core/util.js";
import { pageHead } from "./common.js";

export function render(site) {
  const a = site.about || {};
  const pipe = site.learning_pipeline || [];
  return `
  ${pageHead("About", `Building <em class="serif">the builders.</em>`, `${site.full_name} at ${site.college}, founded in ${site.established}.`)}

  <section class="wrap">
    <div class="manifesto glass" data-sw="box">
      <p class="eyebrow">What we believe</p>
      <blockquote>${esc(a.manifesto_quote || "")}</blockquote>
    </div>
  </section>

  <section class="section wrap">
    <div class="grid">
      <article class="card" data-sw="box"><span class="idx">01 · Who we are</span><p style="color:var(--text)">${esc(a.who)}</p></article>
      <article class="card" data-sw="box"><span class="idx">02 · Objective</span><p style="color:var(--text)">${esc(a.objective)}</p></article>
      <article class="card" data-sw="box"><span class="idx">03 · What members learn</span><p style="color:var(--text)">${esc(a.outcomes)}</p></article>
    </div>
  </section>

  ${pipe.length ? `
  <section class="section wrap" aria-labelledby="pipe-h">
    <div class="section-head"><div><p class="eyebrow" data-sw="text">How a project moves</p><h2 id="pipe-h" data-sw="text">Discover to ship</h2></div>
    <p data-sw="text">The same five stages shape our workshops, hackathons and member projects.</p></div>
    <div class="journey">
      <div class="journey-steps" role="tablist" aria-label="Project stages" aria-orientation="vertical">
        <svg class="journey-svg" aria-hidden="true"></svg>
        ${pipe.map((p, i) => `<button class="journey-step" role="tab" aria-controls="ap-panel" aria-selected="${i === 0}" data-sw="block"><span class="n">${esc(p.step)}</span><b>${esc(p.name)}</b><small>${esc(p.tag)}</small></button>`).join("")}
      </div>
      <div class="journey-panel glass" id="ap-panel" role="tabpanel" aria-live="polite" data-sw="box">
        <p class="eyebrow" id="ap-tag">${esc(pipe[0].tag)}</p>
        <h3 id="ap-name">${esc(pipe[0].step)}. ${esc(pipe[0].name)}</h3>
        <p id="ap-desc">${esc(pipe[0].desc)}</p>
      </div>
    </div>
  </section>` : ""}

  ${(a.timeline || []).length ? `
  <section class="section wrap" aria-labelledby="tl-h">
    <div class="section-head"><div><p class="eyebrow" data-sw="text">Since ${esc(site.established)}</p><h2 id="tl-h" data-sw="text">Our timeline</h2></div></div>
    <div class="timeline">${a.timeline.map(t => `<div class="tl" data-sw="block"><span class="yr">${esc(t.year)}</span><div><h4>${esc(t.title)}</h4><p>${esc(t.desc)}</p></div></div>`).join("")}</div>
  </section>` : ""}

  ${(a.committees || []).length ? `
  <section class="section wrap" aria-labelledby="cm-h">
    <div class="section-head"><div><p class="eyebrow" data-sw="text">How the club runs</p><h2 id="cm-h" data-sw="text">Committees</h2></div></div>
    <div class="grid">${a.committees.map((c, i) => `<article class="card" data-sw="box"><span class="idx">0${i + 1} · ${esc(c.role)}</span><h3>${esc(c.name)}</h3><p>${esc(c.desc)}</p></article>`).join("")}</div>
  </section>` : ""}`;
}

export function wire({ site, scope, director }) {
  const pipe = site.learning_pipeline || [];
  const steps = $(".journey-steps");
  if (!steps) return;
  const btns = $$(".journey-step", steps);
  const panel = $("#ap-panel");
  const select = i => {
    btns.forEach((b, j) => { b.setAttribute("aria-selected", String(i === j)); b.tabIndex = i === j ? 0 : -1; });
    const p = pipe[i];
    director.morph(panel, () => {
      $("#ap-tag").textContent = p.tag;
      $("#ap-name").textContent = `${p.step}. ${p.name}`;
      $("#ap-desc").textContent = p.desc;
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
