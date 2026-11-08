import { icons, $, wait, motion } from "../core/util.js";

export function render() {
  return `
  <header class="page-head wrap lost">
    <p class="eyebrow" data-sw="text">Page not found</p>
    <h1 data-sw="text" tabindex="-1">Nothing was built <em class="serif">here.</em></h1>
    <p class="lead" data-sw="text">The builders searched every page for this one. It does not exist, or it has moved.</p>
    <p data-sw="block" style="display:flex;gap:12px;flex-wrap:wrap;margin-top:24px">
      <a class="btn primary" href="index.html">Go home ${icons.arrow}</a>
      <a class="btn" href="events.html">Browse events</a>
    </p>
    <div class="lost-field" aria-hidden="true"></div>
  </header>`;
}

// Five builders wander the empty page with search lights, checking spots and shrugging at each other
export function wire({ scope, director }) {
  const field = $(".lost-field");
  if (!field || motion.reduced || !director || !director.enabled) return;
  let alive = true;
  scope.add(() => (alive = false));
  (async () => {
    await (director.introPromise || Promise.resolve());
    while (alive && director.busy) await wait(200);
    if (!alive) return;
    const team = director._claim(5, null);
    scope.add(() => director.crew.release(team));
    team.forEach(a => a.el.classList.add("searching"));
    scope.add(() => team.forEach(a => a.el.classList.remove("searching")));
    await Promise.all(team.map(async (a, i) => {
      await wait(i * 160);
      while (alive) {
        const r = field.getBoundingClientRect();
        const x = r.left + scrollX + 30 + Math.random() * Math.max(60, r.width - 60), y = r.top + scrollY + 20 + Math.random() * Math.max(40, r.height - 40);
        const p = { x: a.x, y: a.y };
        await new Promise(res => gsap.to(p, { x, y, duration: 0.9 + Math.random() * 0.8, ease: "power2.inOut", onUpdate: () => alive && a.place(p.x, p.y), onComplete: res }));
        if (!alive) break;
        director._click(a);
        await wait(500 + Math.random() * 900);
      }
    }));
  })();
}
