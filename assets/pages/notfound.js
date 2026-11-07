import { icons } from "../core/util.js";

export function render() {
  return `
  <header class="page-head wrap">
    <p class="eyebrow" data-sw="text">Page not found</p>
    <h1 data-sw="text" tabindex="-1">Nothing was built <em class="serif">here.</em></h1>
    <p class="lead" data-sw="text">The page you asked for does not exist or has moved.</p>
    <p data-sw="block" style="display:flex;gap:12px;flex-wrap:wrap;margin-top:24px">
      <a class="btn primary" href="index.html">Go home ${icons.arrow}</a>
      <a class="btn" href="events.html">Browse events</a>
    </p>
  </header>`;
}
