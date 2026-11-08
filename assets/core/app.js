// MAD Club site entry point (ES module, no build step; GitHub Pages friendly)
import { $, visit, perf } from "./util.js";
import { loadData } from "./content.js";
import { buildShell } from "./shell.js";
import { Router } from "./router.js";
import { SwarmDirector } from "../motion/swarm-director.js";
import { Inspector } from "../motion/inspect.js";
import { wireSurfaces } from "../motion/surface.js";

(async function boot() {
  const main = $("#main");
  try {
    // The crew assembles on a blank screen while the content loads
    perf.apply();
    const director = new SwarmDirector();
    let fast = false;
    try { fast = sessionStorage.getItem("mad_arrived") === "1"; } catch {}
    // returning this week: no "assigning builders" intro, the ring is simply there
    const quick = visit.returning;
    if (director.enabled && !quick) document.documentElement.classList.add("booting");
    const intro = quick ? director.quickStart() : director.intro({ fast });
    if (director.enabled) perf.measure(); // a slow device switches itself to lite effects
    visit.mark();
    const [site, { events }] = await Promise.all([loadData("site"), loadData("events")]);
    let router = null;
    buildShell(site, events, { navigate: href => router && router.navigate(href), director });
    router = new Router({ site, events, director });
    const inspector = new Inspector();
    wireSurfaces();
    window.__mad = { director, router, inspector };
    await router.render({ intro: quick ? null : intro });
  } catch (err) {
    console.error("[MAD] boot failed", err);
    document.documentElement.classList.remove("booting");
    const file = location.protocol === "file:";
    main.innerHTML = `<header class="page-head wrap"><h1>Something went wrong.</h1>
      <p class="lead">${file ? "Open the site through a local server (npm start) so the content files can load." : "The content could not be loaded. Please refresh."}</p>
      <p><button class="btn primary" type="button" onclick="location.reload()">Reload</button></p></header>`;
  }
})();
