// Shared helpers
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const wait = ms => new Promise(r => setTimeout(r, ms));
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;

const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
// The device's reduced-motion setting is honoured by default; a visitor can explicitly
// opt back in (Settings app, the notice chip, Ctrl+K, or ?motion in the URL).
export const motion = {
  get osReduced() { return rm.matches; },
  get override() { try { return localStorage.getItem("mad_motion") || ""; } catch { return ""; } },
  set override(v) { try { v ? localStorage.setItem("mad_motion", v) : localStorage.removeItem("mad_motion"); } catch {} },
  get reduced() {
    try {
      const q = new URLSearchParams(location.search);
      if (q.has("still")) return true;
      if (q.has("motion")) return false;
    } catch {}
    if (this.override === "on") return false;
    if (this.override === "off") return true;
    return rm.matches;
  }
};
// Returning visitors (seen in the last 7 days) skip the intro and get a quick one-pass build
const WEEK = 7 * 864e5;
export const visit = {
  returning: (() => { try { const t = +localStorage.getItem("mad_seen_at"); return !!t && Date.now() - t < WEEK && !new URLSearchParams(location.search).has("intro"); } catch { return false; } })(),
  mark() { try { localStorage.setItem("mad_seen_at", String(Date.now())); } catch {} }
};

// Performance tier: "lite" keeps every effect but lighter (fewer particles, no glow filters,
// solid panels instead of frosted glass). Chosen by the visitor, or automatically when the
// device is slow (measured frame rate during the first seconds, or very little memory).
export const perf = {
  get choice() { try { return localStorage.getItem("mad_perf") || ""; } catch { return ""; } },
  set choice(v) { try { v ? localStorage.setItem("mad_perf", v) : localStorage.removeItem("mad_perf"); } catch {} this.apply(); },
  get auto() { try { return localStorage.getItem("mad_perf_auto") === "lite"; } catch { return false; } },
  get lite() {
    try { const q = new URLSearchParams(location.search); if (q.has("lite")) return true; if (q.has("full")) return false; } catch {}
    if (this.choice) return this.choice === "lite";
    return this.auto || (navigator.deviceMemory && navigator.deviceMemory <= 2);
  },
  apply() { document.documentElement.classList.toggle("lite", !!this.lite); },
  // average frame rate over `ms` while the intro (or first build) animates
  probe(ms = 2200) {
    return new Promise(res => {
      let n = 0, t0 = 0, worst = 0, last = 0;
      const f = t => {
        if (!t0) { t0 = last = t; }
        worst = Math.max(worst, t - last); last = t; n++;
        if (t - t0 < ms) requestAnimationFrame(f);
        else res({ fps: (n * 1000) / (t - t0), worst });
      };
      requestAnimationFrame(f);
    });
  },
  async measure() {
    if (this.choice || document.hidden) return;
    const { fps } = await this.probe();
    if (fps < 40) { try { localStorage.setItem("mad_perf_auto", "lite"); } catch {} this.apply(); }
  }
};
// particle and trace budgets scale with the tier
export const budget = n => Math.round(n * (perf.lite ? 0.35 : 1));
export const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
export const isSmall = () => window.innerWidth < 720;

export const photoSrc = p => (/^(data:|https?:|\/\/)/i.test(p) ? p : String(p).replace(/^\/+/, ""));
export const semKey = s => {
  const m = String(s).match(/^(\d\d)-(\d\d) (Odd|Even)/);
  return m ? +m[1] * 10 + (m[3] === "Even" ? 2 : 1) : -1;
};
export const semYear = s => (String(s).match(/^\d\d-\d\d/) || [""])[0];
export const yearLabel = y => `20${y.replace("-", "–20")}`;

// '/' and 'index.html' always resolve to home (regression guard from the audit)
export function normalizeRoute(url) {
  if (!url) return "home";
  const clean = String(url).split("?")[0].split("#")[0];
  if (clean.endsWith("/")) return "home"; // site root, including /md_v1/ on GitHub Pages
  const last = clean.split("/").filter(Boolean).pop() || "home";
  const name = last.replace(/\.html$/i, "");
  if (name === "index" || name === "" || name === "home") return "home";
  return name;
}

// A link counts as a real external profile only if it points past the bare domain
export const isRealProfile = url => {
  try {
    const u = new URL(url);
    return u.pathname.replace(/\/+$/, "").length > 1;
  } catch { return false; }
};

export const icons = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/></svg>',
  build: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M10 18.5h4"/></svg>',
  arrow: '<span class="arrow" aria-hidden="true">&rarr;</span>',
  cursor: '<svg viewBox="0 0 17 21" aria-hidden="true"><path d="M1.5 1.5 15 9.2l-6.1 1.7-3.1 6.6z"/></svg>'
};
