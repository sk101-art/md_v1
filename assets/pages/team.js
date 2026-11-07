import { esc, $, $$, isRealProfile, photoSrc } from "../core/util.js";
import { pageHead } from "./common.js";
import { loadData } from "../core/content.js";
import { wireSeg } from "../core/seg.js";
import { HoloProjector } from "../experiences/holo-projector.js";

const initials = n => n.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();

function person(p, extra = "", { holo = false } = {}) {
  const links = [
    isRealProfile(p.github) ? `<a href="${esc(p.github)}" target="_blank" rel="noopener">GitHub</a>` : "",
    isRealProfile(p.linkedin) ? `<a href="${esc(p.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : ""
  ].filter(Boolean).join("");
  // the current team: every card the same size, portrait on top, projected by the builders
  const attrs = holo ? `class="person card holo-wait" data-holo${p.holo_node ? ` data-holo-node="${esc(p.holo_node)}"` : ""}` : `class="person card" data-sw="box"`;
  return `
    <article ${attrs} data-comm="${esc((p.committee || "").toLowerCase())}">
      ${holo
        ? `<div class="portrait${p.portrait ? "" : " ph"}">${p.portrait
            ? `<img src="${esc(photoSrc(p.portrait))}" alt="${esc(p.name)}, ${esc(p.role)}" loading="lazy" decoding="async">`
            : `<img class="ph-rays" src="assets/brand/mad-rays.svg" alt=""><span>${esc(initials(p.name))}</span>`}</div>`
        : `<div class="avatar">${p.portrait ? `<img src="${esc(photoSrc(p.portrait))}" alt="">` : esc(initials(p.name))}</div>`}
      <h4>${esc(p.name)}</h4>
      <span class="role">${esc(p.role)}${extra}</span>
      ${p.bio ? `<p>${esc(p.bio)}</p>` : ""}
      ${links ? `<div class="links">${links}</div>` : ""}
    </article>`;
}

export async function render() {
  const t = await loadData("team");
  const comms = [...new Set((t.current || []).map(p => p.committee).filter(Boolean))];
  return `
  ${pageHead("Team", `The people <em class="serif">behind MAD.</em>`, `Core team for ${t.current_year}.`)}
  <section class="wrap">
    <div class="tools" data-sw="block">
      <div class="seg" id="f-comm" role="group" aria-label="Committee">
        <button type="button" data-v="all" aria-pressed="true">Everyone</button>
        ${comms.map(c => `<button type="button" data-v="${esc(c.toLowerCase())}" aria-pressed="false">${esc(c)}</button>`).join("")}
      </div>
    </div>
    <div class="people" id="people">${(t.current || []).map(p => person(p, "", { holo: true })).join("")}</div>
  </section>
  ${(t.earlier || []).length ? `
  <section class="section wrap" aria-labelledby="alum-h">
    <div class="section-head"><div><p class="eyebrow" data-sw="text">Earlier leadership</p><h2 id="alum-h" data-sw="text">Founders and alumni</h2></div></div>
    <div class="people">${t.earlier.map(p => person({ ...p, bio: p.bio || "" }, p.year ? ` · ${esc(p.year)}` : "")).join("")}</div>
  </section>` : ""}`;
}

export function wire({ scope, director }) {
  const grid = $("#people");
  // the 11 builders project the 11 members: one builder, four projector nodes, per card
  new HoloProjector({ scope, director }).watch($$(".person[data-holo]", grid));
  wireSeg($("#f-comm"), {
    scope,
    onSelect: b => director.morph(grid, () => {
      const v = b.dataset.v;
      const cards = $$(".person", grid);
      const first = new Map(cards.map(c => [c, c.getBoundingClientRect()]));
      cards.forEach(c => (c.hidden = !(v === "all" || c.dataset.comm === v)));
      cards.filter(c => !c.hidden).forEach(c => {
        const f = first.get(c), l = c.getBoundingClientRect();
        if (f && f.width && (f.left !== l.left || f.top !== l.top)) c.animate([{ transform: `translate(${f.left - l.left}px,${f.top - l.top}px)` }, { transform: "none" }], { duration: 480, easing: "cubic-bezier(.34,1.2,.64,1)" });
        else if (!f || !f.width) c.animate([{ opacity: 0, transform: "scale(.97)" }, { opacity: 1, transform: "none" }], { duration: 360, easing: "ease-out" });
      });
    })
  });
}
