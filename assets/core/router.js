// Content router: static-hostable routes with history, focus management,
// Swarm Rebuild transitions, interrupt safety and per-route lifecycle cleanup.
import { $, normalizeRoute, motion } from "./util.js";
import { Scope } from "./lifecycle.js";
import { markActive } from "./shell.js";
import { captureShared, playShared } from "../motion/transition-director.js";
import * as home from "../pages/home.js";
import * as eventsPage from "../pages/events.js";
import * as eventPage from "../pages/event.js";
import * as about from "../pages/about.js";
import * as achievements from "../pages/achievements.js";
import * as team from "../pages/team.js";
import * as contact from "../pages/contact.js";
import * as notfound from "../pages/notfound.js";

const PAGES = {
  home: { m: home, title: "MAD Club | NHCE" },
  events: { m: eventsPage, title: "Events | MAD Club" },
  event: { m: eventPage, title: "Event | MAD Club" },
  about: { m: about, title: "About | MAD Club" },
  achievements: { m: achievements, title: "Achievements | MAD Club" },
  team: { m: team, title: "Team | MAD Club" },
  contact: { m: contact, title: "Contact | MAD Club" },
  notfound: { m: notfound, title: "Page not found | MAD Club" }
};

const known = new Set(Object.keys(PAGES));

export class Router {
  constructor({ site, events, director }) {
    this.site = site;
    this.events = events;
    this.director = director;
    this.scope = null;
    this.gen = 0;
    this.main = $("#main");
    this.first = true;

    document.addEventListener("click", e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest("a[href]");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || /^(#|mailto:|tel:|https?:|\/\/)/i.test(href)) return;
      if (!/\.html(\?|#|$)/i.test(href)) return;
      const route = normalizeRoute(href);
      if (!known.has(route) || route === "notfound") return;
      e.preventDefault();
      if (a.closest(".poster")) captureShared(a);
      this.navigate(href);
    });

    window.addEventListener("popstate", () => this.go(location.pathname.split("/").pop() + location.search, { push: false, restore: history.state && history.state.scroll }));
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  }

  navigate(href) {
    const target = new URL(href, location.href);
    if (target.pathname === location.pathname && target.search === location.search) {
      window.scrollTo({ top: 0, behavior: motion.reduced ? "auto" : "smooth" });
      return;
    }
    return this.go(href, { push: true });
  }

  async go(href, { push = true, restore = 0 } = {}) {
    const my = ++this.gen;
    const d = this.director;
    // remember where we were for Back
    try { history.replaceState({ ...(history.state || {}), scroll: window.scrollY }, ""); } catch {}

    // Swarm Rebuild teardown of the outgoing page (interruptible)
    if (!this.first) {
      if (d.enabled) await d.teardown(this.main);
      else { this.main.classList.add("fade-out"); await new Promise(r => setTimeout(r, 140)); }
      if (my !== this.gen) return;
    }
    if (push) history.pushState({ scroll: 0 }, "", href);
    await this.render(my, { restore });
  }

  async render(my = ++this.gen, { restore = 0 } = {}) {
    const d = this.director;
    const route = (() => { const r = normalizeRoute(location.pathname); return known.has(r) ? r : "notfound"; })();
    const page = PAGES[route];

    if (this.scope) this.scope.dispose();
    d.reset({ keepAgents: true });
    this.scope = new Scope(route);

    const html = await page.m.render(this.site, this.events);
    if (my !== this.gen) return;
    document.body.dataset.page = route;
    if (route !== "event") document.title = page.title;
    this.main.innerHTML = html;
    this.main.classList.remove("fade-out");
    markActive(route);

    const ctx = { site: this.site, events: this.events, scope: this.scope, director: d, route };
    const res = page.m.wire ? page.m.wire(ctx) || {} : {};
    void res;

    // hold layers before first paint of the new page
    if (this.first) d.hold(document.getElementById("nav"));
    d.hold(this.main);
    window.scrollTo(0, restore || 0);

    // focus management for keyboard and screen reader users (not on first load)
    if (!this.first) {
      const h1 = this.main.querySelector("h1");
      if (h1) h1.focus({ preventScroll: true });
    }
    playShared(this.scope);

    const arrival = this.first;
    let seen = false;
    try { seen = sessionStorage.getItem("mad_arrived") === "1"; sessionStorage.setItem("mad_arrived", "1"); } catch {}
    this.first = false;

    if (arrival) {
      // Arrival: nav + page constructed together, full two-pass skeleton -> fill (shorter on revisit)
      const wrap = { querySelectorAll: sel => [...document.getElementById("nav").querySelectorAll(sel), ...this.main.querySelectorAll(sel)] };
      await d.construct(wrap, { passes: seen ? 1 : 2 });
    } else {
      await d.construct(this.main, { passes: 1 });
    }
  }
}
