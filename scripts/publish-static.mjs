// Static publishing pass (run after content changes):  node scripts/publish-static.mjs
//  1. renders a 1200x630 share image for every page into assets/og/
//  2. writes each page's content into its HTML file, so link previews, search engines and
//     visitors without JavaScript see the real page (the live site replaces it on load)
//  3. sets per-page share tags (description, og:image, large Twitter/WhatsApp card)
// Needs Playwright (a dev tool only; the site itself has no build step).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE_URL = "https://sk101-art.github.io/md_v1/";
const PORT = 4199;
const site = JSON.parse(readFileSync(join(ROOT, "content/site.json"), "utf8"));
const { events } = JSON.parse(readFileSync(join(ROOT, "content/events.json"), "utf8"));
const team = JSON.parse(readFileSync(join(ROOT, "content/team.json"), "utf8"));

const PAGES = [
  { file: "index.html", og: "home", title: "MAD Club | NHCE", head: "Don't just use the future.", accent: "Build it.", desc: `${site.full_name} at ${site.college}. Hackathons, build challenges and design events since ${site.established}.` },
  { file: "events.html", og: "events", title: "Events | MAD Club", head: "Every event we've run,", accent: "since 2023.", desc: `All ${events.length} MAD Club events: Git Out'26, Game Design'26, Appsylum'25 and more, with rounds and photos.` },
  { file: "event.html", og: "events", title: "Event | MAD Club", head: "Inside a MAD event:", accent: "rounds and photos.", desc: "Rounds, format, venue and photos from a MAD Club NHCE event." },
  { file: "about.html", og: "about", title: "About | MAD Club", head: "A student club", accent: "that ships.", desc: site.about?.who || "" },
  { file: "achievements.html", og: "achievements", title: "Achievements | MAD Club", head: "What we've", accent: "built together.", desc: "Events, participants and projects from MAD Club NHCE." },
  { file: "team.html", og: "team", title: "Team | MAD Club", head: "The people", accent: "behind MAD.", desc: `The ${team.current.length}-member core team of MAD Club NHCE for ${team.current_year}.` },
  { file: "gallery.html", og: "gallery", title: "Gallery | MAD Club", head: "Every event,", accent: "in frames.", desc: "Photos from MAD Club NHCE events: Git Out'26, Game Design'26, Appsylum'25 and more." },
  { file: "contact.html", og: "contact", title: "Contact | MAD Club", head: "Say hello,", accent: "or join in.", desc: `Reach MAD Club NHCE on Instagram (${site.instagram_handle}) or by email.` }
];
const COLOURS = ["#D4A62A", "#E8609E", "#7B45B8", "#19B4CF", "#2F8CEB", "#F07C2E", "#1FA77F", "#4F5BE0", "#84B832", "#C04BC9", "#E0444F"];

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ogHtml = p => `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0}
  body{width:1200px;height:630px;font-family:Inter,sans-serif;color:#18212F;overflow:hidden;position:relative;
    background:radial-gradient(90% 80% at 100% 0%,rgba(166,216,212,.55),transparent 60%),radial-gradient(80% 70% at 0% 100%,rgba(231,217,189,.65),transparent 60%),linear-gradient(180deg,#F7F8FA,#E9EDF2)}
  .rays{position:absolute;right:-90px;bottom:-140px;width:640px;opacity:.22}
  .brand{position:absolute;left:72px;top:64px;display:flex;align-items:center;gap:18px}
  .brand img{height:64px}.brand b{font:700 30px/1 "Inter Display",Inter}.brand span{font:600 15px/1 "DejaVu Sans Mono",monospace;letter-spacing:.18em;padding:7px 12px;border:1.5px solid rgba(24,33,47,.2);border-radius:999px;color:#3E4A5C}
  h1{position:absolute;left:72px;top:200px;width:880px;font:700 84px/1.0 "Inter Display",Inter;letter-spacing:-.04em}
  h1 em{font-style:italic;font-weight:400;font-family:"DejaVu Serif",serif;letter-spacing:-.03em;color:#3D5BBF}
  .ring{position:absolute;right:120px;top:96px;width:150px;height:150px}
  .ring i{position:absolute;width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 3px 8px rgba(24,33,47,.25)}
  .foot{position:absolute;left:72px;bottom:56px;font:500 22px/1 Inter;color:#4A5566}
</style></head><body>
  <img class="rays" src="${SITE_URL ? "http://localhost:" + PORT + "/assets/brand/mad-rays.svg" : ""}">
  <div class="brand"><img src="http://localhost:${PORT}/assets/brand/mad-logo.svg"><b>MAD Club</b><span>NHCE</span></div>
  <div class="ring">${COLOURS.map((c, i) => { const a = -Math.PI / 2 + (i / 11) * Math.PI * 2; return `<i style="background:${c};left:${67 + Math.cos(a) * 62}px;top:${67 + Math.sin(a) * 62}px"></i>`; }).join("")}</div>
  <h1>${esc(p.head)} <em>${esc(p.accent)}</em></h1>
  <div class="foot">${esc(site.full_name)} · ${esc(site.college)}</div>
</body></html>`;

// the event detail page has no single subject at a static URL: give it the full event index
const eventIndex = () => `<header class="page-head wrap"><p class="eyebrow">Events</p><h1>MAD Club events</h1></header>
  <section class="wrap"><ul class="pre-list">${[...events].reverse().map(e => `<li><a href="event.html?e=${encodeURIComponent(e.slug)}"><b>${esc(e.name)}</b></a> · ${esc(e.semester)} · ${esc(e.category || "Event")}<br>${esc(e.description)}</li>`).join("")}</ul></section>`;

const setMeta = (html, p) => {
  const url = p.file === "index.html" ? SITE_URL : SITE_URL + p.file;
  const img = `${SITE_URL}assets/og/${p.og}.jpg`;
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(p.desc)}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(p.desc)}">`);
  html = html.replace(/<meta property="og:image[^>]*>|<meta property="og:site_name"[^>]*>|<meta name="twitter:image"[^>]*>|<meta property="og:image:(width|height)"[^>]*>/g, "");
  html = html.replace(/<meta name="twitter:card" content="[^"]*">/, `<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${img}">`);
  html = html.replace(/<meta property="og:type" content="website">/, `<meta property="og:type" content="website"><meta property="og:site_name" content="MAD Club NHCE"><meta property="og:image" content="${img}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">`);
  html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  return html;
};

const server = spawn(process.execPath, [join(ROOT, "scripts/serve.js")], { env: { ...process.env, PORT: String(PORT) }, stdio: "ignore" });
await new Promise(r => setTimeout(r, 900));
const browser = await chromium.launch();
try {
  mkdirSync(join(ROOT, "assets/og"), { recursive: true });
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const p of PAGES.filter((x, i, a) => a.findIndex(y => y.og === x.og) === i)) {
    await og.setContent(ogHtml(p), { waitUntil: "networkidle" });
    await og.screenshot({ path: join(ROOT, `assets/og/${p.og}.jpg`), type: "jpeg", quality: 86 });
    console.log("share image", p.og);
  }
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  for (const p of PAGES) {
    let body;
    if (p.file === "event.html") body = eventIndex();
    else {
      await page.goto(`http://localhost:${PORT}/${p.file}?still`, { waitUntil: "networkidle" });
      await page.waitForTimeout(600);
      body = await page.evaluate(() => {
        const m = document.querySelector("#main").cloneNode(true);
        m.querySelectorAll("dialog, script, canvas, .stage, .build-panel, .sw-hold").forEach(n => n.classList.contains("sw-hold") ? n.classList.remove("sw-hold") : n.remove());
        m.querySelectorAll("[data-sw], [data-sw-g], [data-holo], [data-holo-node], [data-holo-by], [style*='--holo']").forEach(n => { ["data-sw", "data-sw-g", "data-holo", "data-holo-node", "data-holo-by"].forEach(a => n.removeAttribute(a)); });
        m.querySelectorAll(".holo-wait, .holo-colour, .holo-true").forEach(n => n.classList.remove("holo-wait", "holo-colour", "holo-true"));
        return m.innerHTML;
      });
    }
    const f = join(ROOT, p.file);
    let html = readFileSync(f, "utf8");
    const nav = `<nav class="pre-nav wrap" aria-label="Pages">${PAGES.filter(x => x.file !== "event.html").map(x => `<a href="${x.file}">${esc(x.title.split(" |")[0].replace("MAD Club", "Home"))}</a>`).join(" · ")}</nav>`;
    html = html.replace(/<main id="main">[\s\S]*?<\/main>/, `<main id="main"><div class="pre">${nav}${body}</div></main>`);
    html = setMeta(html, p);
    writeFileSync(f, html);
    console.log("static page", p.file, Math.round(body.length / 1024) + " KB");
  }
} finally {
  await browser.close();
  server.kill();
}
