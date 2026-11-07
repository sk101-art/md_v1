// Shared helpers
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const wait = ms => new Promise(r => setTimeout(r, ms));
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;

const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
export const motion = {
  get reduced() {
    try { if (new URLSearchParams(location.search).has("still")) return true; } catch {}
    return rm.matches;
  }
};
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
