import { esc, icons, $, $$, semKey } from "../core/util.js";
import { posterCard, splitTitle, statusLabel } from "./common.js";
import { PhoneBuilder } from "../experiences/phone-builder.js";
import { wireLivingPhone } from "../experiences/living-phone.js";

export function render(site, events) {
  const flags = events.filter(e => e.flagship && e.status === "completed");
  const next = events.find(e => e.status === "open") || events.find(e => e.status === "upcoming");
  const phoneEvents = [...events].sort((a, b) => semKey(b.semester) - semKey(a.semester)).slice(0, 4);
  const pipe = site.learning_pipeline || [];

  return `
  <section class="hero wrap" aria-labelledby="hero-title">
    <div class="hero-copy">
      <img class="hero-emblem" src="assets/brand/mad-emblem.svg" alt="" width="72" height="72" data-sw="media">
      <p class="eyebrow" data-sw="text">${esc(site.hero_badge || `${site.full_name} · ${site.college_short}`)}</p>
      <h1 class="hero-title" id="hero-title" data-sw="text" tabindex="-1">${splitTitle(site.hero_title || "Don't just use the future. Build it.")}</h1>
      <p class="lead" data-sw="text">${esc(site.hero_lead)}</p>
      <div class="hero-actions">
        <a class="btn primary" href="events.html" data-sw="block">${esc(site.hero_cta_primary || "Explore events")} ${icons.arrow}</a>
        <a class="btn" href="contact.html" data-sw="block">${esc(site.hero_cta_secondary || "Join the club")}</a>
      </div>
      <div class="build-panel glass" data-sw="box">
        <button type="button" class="build-btn" id="build-btn" aria-describedby="build-status">
          <span class="knob">${icons.build}</span><span class="label">Build the phone</span>
        </button>
        <div class="build-status" id="build-status" aria-live="polite">
          <b>Stage is empty</b><span>Press Build to assemble the phone</span>
          <div class="build-progress" aria-hidden="true"><i></i></div>
        </div>
        <div class="build-extra">
          <button type="button" class="btn sm ghost" id="build-reset">Reset</button>
        </div>
      </div>
    </div>

    <div class="stage" data-state="idle" aria-label="Phone build stage">
      <div class="stage-marks" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <p class="stage-hint" aria-hidden="true">Empty stage</p>
      <div class="stage-floor" aria-hidden="true"></div>
      <div class="phone" id="phone">
        <span class="phone-btn vol-up"></span><span class="phone-btn vol-down"></span><span class="phone-btn power"></span>
        <div class="phone-screen">
          <span class="phone-island"></span>
          <span class="power-ring"></span>
          <div class="os">
            <div class="os-top">
              <span class="os-brand"><img src="assets/brand/mad-emblem.svg" alt="">MAD OS</span>
              <small>${esc(site.college_short)}</small>
            </div>
            <div class="os-tabs" role="tablist" aria-label="Phone app">
              <button role="tab" aria-selected="true" aria-controls="os-v0" id="os-t0">Events</button>
              <button role="tab" aria-selected="false" aria-controls="os-v1" id="os-t1">Club</button>
              <button role="tab" aria-selected="false" aria-controls="os-v2" id="os-t2">Join</button>
            </div>
            <div class="os-view on" id="os-v0" role="tabpanel" aria-labelledby="os-t0">
              <ul class="os-list">
                ${phoneEvents.map((e, i) => `
                  <li><button type="button" data-slug="${esc(e.slug)}" data-desc="${esc(e.description)}" data-name="${esc(e.name)}" aria-current="${i === 0}">
                    <b>${esc(e.name)}</b><span>${esc(e.semester)}</span><i>${esc(statusLabel(e.status))}</i>
                  </button></li>`).join("")}
              </ul>
              <div class="os-detail">
                <p id="os-desc">${esc(phoneEvents[0]?.description || "")}</p>
                <a id="os-open" href="event.html?e=${encodeURIComponent(phoneEvents[0]?.slug || "")}">Open ${esc(phoneEvents[0]?.name || "")} ${icons.arrow}</a>
              </div>
            </div>
            <div class="os-view" id="os-v1" role="tabpanel" aria-labelledby="os-t1">
              <div class="os-fact"><small>Founded</small><b>${esc(site.established)}</b></div>
              <div class="os-fact"><small>Home</small><b>${esc(site.college)}</b></div>
              <div class="os-fact"><small>Flagship events</small><b>${flags.map(e => esc(e.name)).join(", ")}</b></div>
              <div class="os-fact"><small>Instagram</small><b>${esc(site.instagram_handle)}</b></div>
            </div>
            <div class="os-view" id="os-v2" role="tabpanel" aria-labelledby="os-t2">
              <div class="os-fact"><small>Open to</small><b>${esc(site.college_short)} students who want to build apps</b></div>
              ${next ? `<div class="os-fact"><small>${esc(statusLabel(next.status))}</small><b>${esc(next.name)}</b></div>` : ""}
              <div class="os-join">
                <a href="contact.html">Apply to join ${icons.arrow}</a>
                <a class="alt" href="${esc(site.instagram)}" target="_blank" rel="noopener">Follow ${esc(site.instagram_handle)}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="wrap" aria-label="Club at a glance">
    <div class="stats">
      ${(site.stats || []).map(s => `<div class="stat" data-sw="block"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("")}
    </div>
  </section>

  <section class="section wrap" aria-labelledby="flagships">
    <div class="section-head">
      <div>
        <p class="eyebrow" data-sw="text">Flagship events</p>
        <h2 id="flagships" data-sw="text">What we have built together</h2>
      </div>
      <a class="btn" href="events.html" data-sw="block">All ${events.length} events ${icons.arrow}</a>
    </div>
    <div class="posters">
      ${flags.map((e, i) => posterCard(e, { wide: i === 0, half: flags.length === 4 && i > 1 })).join("")}
    </div>
  </section>

  ${pipe.length ? `
  <section class="section wrap" aria-labelledby="journey-h">
    <div class="section-head">
      <div>
        <p class="eyebrow" data-sw="text">The member journey</p>
        <h2 id="journey-h" data-sw="text">From first idea to shipped app</h2>
      </div>
      <p data-sw="text">Five stages every MAD project moves through. Select a stage to see what it involves.</p>
    </div>
    <div class="journey">
      <div class="journey-steps" role="tablist" aria-label="Journey stages" aria-orientation="vertical">
        <svg class="journey-svg" aria-hidden="true"></svg>
        ${pipe.map((p, i) => `
          <button class="journey-step" role="tab" id="js-${i}" aria-controls="journey-panel" aria-selected="${i === 0}" data-sw="block">
            <span class="n">${esc(p.step)}</span><b>${esc(p.name)}</b><small>${esc(p.tag)}</small>
          </button>`).join("")}
      </div>
      <div class="journey-panel glass" id="journey-panel" role="tabpanel" aria-live="polite" data-sw="box">
        <p class="eyebrow" id="jp-tag">${esc(pipe[0].tag)}</p>
        <h3 id="jp-name">${esc(pipe[0].step)}. ${esc(pipe[0].name)}</h3>
        <p id="jp-desc">${esc(pipe[0].desc)}</p>
      </div>
    </div>
  </section>` : ""}

  ${(site.highlights || []).length ? `
  <section class="section wrap" aria-labelledby="how-h">
    <div class="section-head">
      <div>
        <p class="eyebrow" data-sw="text">How we work</p>
        <h2 id="how-h" data-sw="text">Principles</h2>
      </div>
    </div>
    <div class="principles">
      ${site.highlights.map((h, i) => `
        <article class="card" data-sw="box">
          <span class="idx">${String(i + 1).padStart(2, "0")} · ${esc(h.tag || "")}</span>
          <h3>${esc(h.title)}</h3>
          <p>${esc(h.text)}</p>
        </article>`).join("")}
    </div>
  </section>` : ""}

  <section class="section wrap" aria-labelledby="cta-h">
    <div class="cta-band glass" data-sw="box">
      <div>
        <img class="cta-mark" src="assets/brand/mad-emblem.svg" alt="" width="64" height="64">
        ${next ? `<p class="eyebrow">${esc(statusLabel(next.status))} · ${esc(next.name)}</p>` : ""}
        <h2 id="cta-h">${esc(site.cta_title)}</h2>
        <p class="lead">${esc(site.cta_text)}</p>
      </div>
      <div class="actions">
        ${next ? `<a class="btn primary" href="event.html?e=${encodeURIComponent(next.slug)}">${next.status === "open" ? "Register for" : "See"} ${esc(next.name)} ${icons.arrow}</a>` : ""}
        <a class="btn" href="contact.html">Join MAD Club</a>
      </div>
    </div>
  </section>`;
}

export function wire(ctx) {
  const { scope, director } = ctx;
  const live = wireLivingPhone(ctx);
  new PhoneBuilder({ scope, director, onLive: () => live.activate() });

  // Journey: tablist + Swarm Connect paths between stages
  const pipe = ctx.site.learning_pipeline || [];
  const steps = $(".journey-steps");
  if (steps) {
    const btns = $$(".journey-step", steps);
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
    const panel = $("#journey-panel");
    const select = i => {
      btns.forEach((b, j) => { b.setAttribute("aria-selected", String(i === j)); b.tabIndex = i === j ? 0 : -1; });
      const p = pipe[i];
      director.morph(panel, () => {
        $("#jp-tag").textContent = p.tag;
        $("#jp-name").textContent = `${p.step}. ${p.name}`;
        $("#jp-desc").textContent = p.desc;
      });
    };
    const io = scope.observe(new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting)) {
        io.disconnect();
        scope.timeout(() => director.connect($(".journey-svg"), btns), 900);
      }
    }, { threshold: 0.4 }));
    io.observe(steps);
  }
}
