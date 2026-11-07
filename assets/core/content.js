// Content loader: reads editable JSON from content/, honouring /admin/ drafts in this browser
const cache = new Map();

async function fetchJson(name) {
  try {
    const draft = localStorage.getItem("mad_content_" + name);
    if (draft) return JSON.parse(draft);
  } catch {}
  const res = await fetch(`content/${name}.json`);
  if (!res.ok) throw new Error(`Could not load content/${name}.json`);
  return res.json();
}

export function loadData(name) {
  if (!cache.has(name)) cache.set(name, fetchJson(name));
  return cache.get(name);
}

export function draftKeys() {
  try { return Object.keys(localStorage).filter(k => k.startsWith("mad_content_")); } catch { return []; }
}
