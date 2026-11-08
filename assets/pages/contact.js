import { esc, icons } from "../core/util.js";
import { pageHead } from "./common.js";

// No form: the club is reached where it actually answers, Instagram and email.
export function render(site) {
  const c = site.contact || {};
  return `
  ${pageHead("Contact", `Say hello, <em class="serif">or join in.</em>`, "The fastest way to reach the club is a DM on Instagram. Announcements, results and photos go there first.")}
  <section class="wrap">
    <div class="reach">
      <a class="reach-main glass" href="${esc(site.instagram)}" target="_blank" rel="noopener" data-sw="box">
        <span class="idx">Instagram</span>
        <h2>${esc(site.instagram_handle)}</h2>
        <p>Next events, results and photos. DM us to join or collaborate.</p>
        <span class="btn primary">Open Instagram ${icons.arrow}</span>
      </a>
      <div class="reach-side">
        ${c.email ? `<a class="card" href="mailto:${esc(c.email)}" data-sw="box"><span class="idx">Email</span><h3 style="font-size:1.1rem">${esc(c.email)}</h3><p>${esc(c.coordinators || "")}</p></a>` : ""}
        <div class="card" data-sw="box"><span class="idx">Where</span><p style="color:var(--text)">${esc(c.location || site.college)}</p></div>
      </div>
    </div>
  </section>`;
}

export function wire() {}
