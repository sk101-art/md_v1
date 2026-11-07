// MAD Club site entry point (ES module, no build step; GitHub Pages friendly)
import { $ } from "./util.js";
import { loadData } from "./content.js";
import { buildShell } from "./shell.js";
import { Router } from "./router.js";
import { SwarmDirector } from "../motion/swarm-director.js";

(async function boot() {
  const main = $("#main");
  try {
    const [site, { events }] = await Promise.all([loadData("site"), loadData("events")]);
    const director = new SwarmDirector();
    let router = null;
    buildShell(site, events, { navigate: href => router && router.navigate(href), director });
    router = new Router({ site, events, director });
    window.__mad = { director, router };
    await router.render();
  } catch (err) {
    console.error("[MAD] boot failed", err);
    const file = location.protocol === "file:";
    main.innerHTML = `<header class="page-head wrap"><h1>Something went wrong.</h1>
      <p class="lead">${file ? "Open the site through a local server (npm start) so the content files can load." : "The content could not be loaded. Please refresh."}</p>
      <p><button class="btn primary" type="button" onclick="location.reload()">Reload</button></p></header>`;
  }
})();
