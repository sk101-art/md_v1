import { esc, icons } from "../core/util.js";
import { pageHead, posterCard } from "./common.js";
import { loadData } from "../core/content.js";

const SITE_REPO = "https://github.com/sk101-art/md_v1";

export async function render(site, events) {
  const a = await loadData("achievements");
  const flags = events.filter(e => e.flagship && e.status === "completed");
  return `
  ${pageHead("Achievements", `Work we can <em class="serif">point to.</em>`, "Flagship events the club has run and projects built by members.")}

  <section class="wrap" aria-label="Numbers">
    <div class="stats">${(a.stats || []).map(s => `<div class="stat" data-sw="block"><b data-count>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("")}</div>
  </section>

  ${(a.apps || []).length ? `
  <section class="section wrap" aria-labelledby="apps-h">
    <div class="section-head"><div><p class="eyebrow" data-sw="text">Member projects</p><h2 id="apps-h" data-sw="text">Apps built in the club</h2></div></div>
    ${a.apps.map(app => {
      // Only link to a project's own repository; the website repo is not the app's codebase
      const link = app.link && app.link.replace(/\/+$/, "") !== SITE_REPO ? app.link : "";
      return `
      <article class="case glass" data-sw="box">
        <div>
          <p class="eyebrow">${esc(app.category)} · ${esc(app.status)}</p>
          <h3>${esc(app.name)}</h3>
          <p class="tagline">${esc(app.tagline || "")}</p>
          <p>${esc(app.text)}</p>
          <div class="chips">${(app.tech || []).map(t => `<span>${esc(t)}</span>`).join("")}</div>
          <ul>${(app.features || []).map(f => `<li>${esc(f)}</li>`).join("")}</ul>
          ${app.metrics ? `<p class="note">Reported by the club: ${esc(app.metrics)}</p>` : ""}
          ${link ? `<p style="margin-top:18px"><a class="btn sm" href="${esc(link)}" target="_blank" rel="noopener">View project ${icons.arrow}</a></p>` : ""}
        </div>
        <div class="case-art">${app.image ? `<img src="${esc(app.image)}" alt="${esc(app.name)} screenshot" style="width:100%;height:100%;object-fit:cover">` : `<div class="placeholder-art"><span>${esc(app.name)}</span></div>`}</div>
      </article>`;
    }).join("")}
  </section>` : ""}

  <section class="section wrap" aria-labelledby="fl-h">
    <div class="section-head"><div><p class="eyebrow" data-sw="text">Flagships</p><h2 id="fl-h" data-sw="text">Events run end to end</h2></div></div>
    <div class="posters">${flags.map(e => posterCard(e)).join("")}</div>
  </section>`;
}
