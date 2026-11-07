import { esc, $, icons } from "../core/util.js";
import { pageHead } from "./common.js";
import { wireSeg } from "../core/seg.js";
import { ParticleField } from "../graphics/particle-field.js";

const INTENTS = [
  ["join", "Join the club"],
  ["register", "Register for an event"],
  ["collaborate", "Collaborate"],
  ["general", "Something else"]
];

export function render(site, events) {
  const c = site.contact || {};
  const q = new URLSearchParams(location.search);
  const intent = INTENTS.some(i => i[0] === q.get("intent")) ? q.get("intent") : "join";
  const evSlug = q.get("event");
  const ev = events.find(e => e.slug === evSlug);
  const endpoint = (c.form_endpoint || "").trim();
  const openEvents = events.filter(e => e.status === "open" || e.status === "upcoming");

  return `
  ${pageHead("Contact", `Say hello, <em class="serif">or join in.</em>`, "Tell us who you are and what you would like to build. A coordinator replies by email.")}
  <section class="wrap">
    <div class="contact">
      <form class="contact-form glass form" id="contact-form" ${endpoint ? `action="${esc(endpoint)}"` : ""} method="POST" novalidate data-sw="box">
        <div class="field"><span id="intent-l">I want to</span>
          <div class="seg" id="intent" role="group" aria-labelledby="intent-l">
            ${INTENTS.map(([k, t]) => `<button type="button" data-v="${k}" aria-pressed="${k === intent}">${t}</button>`).join("")}
          </div>
          <input type="hidden" name="intent" id="intent-input" value="${esc(intent)}">
        </div>
        <label class="field" id="event-field" ${intent === "register" ? "" : "hidden"}><span>Event</span>
          <select name="event">${openEvents.map(e => `<option value="${esc(e.slug)}" ${ev && ev.slug === e.slug ? "selected" : ""}>${esc(e.name)}</option>`).join("")}</select>
        </label>
        <label class="field"><span>Full name</span><input name="name" required autocomplete="name"></label>
        <label class="field"><span>Email</span><input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></label>
        <label class="field"><span>Branch and semester</span><input name="department" required placeholder="e.g. CSE, 5th semester"></label>
        <label class="field"><span>Message</span><textarea name="message" rows="4" required placeholder="What would you like to build, learn or organise?"></textarea></label>
        <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
        <div class="form-status" id="form-status" role="status" aria-live="polite"></div>
        <button class="btn primary" type="submit" id="submit">${endpoint ? "Send message" : "Write an email instead"} ${icons.arrow}</button>
      </form>
      <aside>
        <div class="card" data-sw="box"><span class="idx">Instagram</span><h3><a href="${esc(site.instagram)}" target="_blank" rel="noopener">${esc(site.instagram_handle)}</a></h3><p>Event announcements, results and photos.</p></div>
        ${c.email ? `<div class="card" data-sw="box"><span class="idx">Email</span><h3 style="font-size:1.1rem"><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></h3><p>${esc(c.coordinators || "")}</p></div>` : ""}
        <div class="card" data-sw="box"><span class="idx">Where</span><p style="color:var(--text)">${esc(c.location || site.college)}</p></div>
      </aside>
    </div>
  </section>`;
}

export function wire({ site, scope }) {
  const form = $("#contact-form");
  if (!form) return;
  const status = $("#form-status"), submit = $("#submit"), hidden = $("#intent-input"), evField = $("#event-field");
  const endpoint = form.getAttribute("action") || "";
  const email = (site.contact && site.contact.email) || "";
  wireSeg($("#intent"), { scope, onSelect: b => { hidden.value = b.dataset.v; evField.hidden = b.dataset.v !== "register"; } });

  const say = (cls, html) => { status.className = `form-status show ${cls}`; status.innerHTML = html; };
  const label = submit.innerHTML;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!form.checkValidity()) {
      const bad = form.querySelector(":invalid");
      say("err", "Please fill in the highlighted fields.");
      bad && bad.focus();
      return;
    }
    const data = new FormData(form);
    if (!endpoint) {
      // No verified endpoint configured: hand off to the visitor's mail app. Never fake success.
      const body = [...data.entries()].filter(([k]) => k !== "_gotcha").map(([k, v]) => `${k}: ${v}`).join("\n");
      if (email) location.href = `mailto:${email}?subject=${encodeURIComponent("MAD Club: " + hidden.value)}&body=${encodeURIComponent(body)}`;
      say("info", `Your email app should open with the message filled in. If it does not, write to ${email ? `<a href="mailto:${esc(email)}">${esc(email)}</a>` : "us"} or DM <a href="${esc(site.instagram)}" target="_blank" rel="noopener">${esc(site.instagram_handle)}</a>.`);
      return;
    }
    submit.disabled = true;
    submit.textContent = "Sending…";
    status.className = "form-status";
    try {
      const res = await fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      say("ok", "Sent. The server confirmed your message, and a coordinator will reply by email.");
      form.reset();
      const r = submit.getBoundingClientRect();
      const f = new ParticleField();
      f.burst(r.left + r.width / 2 + scrollX, r.top + r.height / 2 + scrollY);
      scope.timeout(() => f.destroy(), 1600);
    } catch {
      say("err", `It did not go through, so nothing was sent. Please try again, or reach us ${email ? `at <a href="mailto:${esc(email)}">${esc(email)}</a> or ` : ""}on <a href="${esc(site.instagram)}" target="_blank" rel="noopener">Instagram</a>.`);
    } finally {
      submit.disabled = false;
      submit.innerHTML = label;
    }
  });
}
