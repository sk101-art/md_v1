// Geometry sampling: evenly spaced points on rounded-rect perimeters, sparse fills, circles.

export function perimeter(rect, step, radius = 0) {
  const { x, y, w, h } = rect;
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  const pts = [];
  const straight = (x0, y0, x1, y1) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.round(len / step));
    for (let i = 0; i < n; i++) pts.push({ x: x0 + ((x1 - x0) * i) / n, y: y0 + ((y1 - y0) * i) / n });
  };
  const arc = (cx, cy, a0, a1) => {
    const len = Math.abs(a1 - a0) * r;
    const n = Math.max(2, Math.round(len / step));
    for (let i = 0; i < n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
  };
  // clockwise from the top edge, ordered so particles can arrive "along" the outline
  straight(x + r, y, x + w - r, y);
  if (r) arc(x + w - r, y + r, -Math.PI / 2, 0);
  straight(x + w, y + r, x + w, y + h - r);
  if (r) arc(x + w - r, y + h - r, 0, Math.PI / 2);
  straight(x + w - r, y + h, x + r, y + h);
  if (r) arc(x + r, y + h - r, Math.PI / 2, Math.PI);
  straight(x, y + h - r, x, y + r);
  if (r) arc(x + r, y + r, Math.PI, Math.PI * 1.5);
  return pts.map((p, i) => ({ ...p, order: i / pts.length }));
}

export function fill(rect, count, exclude = []) {
  const pts = [];
  let guard = 0;
  while (pts.length < count && guard++ < count * 6) {
    const p = { x: rect.x + Math.random() * rect.w, y: rect.y + Math.random() * rect.h };
    if (exclude.some(e => p.x > e.x && p.x < e.x + e.w && p.y > e.y && p.y < e.y + e.h)) continue;
    pts.push({ ...p, order: Math.random() });
  }
  return pts;
}

export function hline(x0, x1, y, step) {
  const pts = [];
  for (let x = x0; x <= x1; x += step) pts.push({ x, y, order: (x - x0) / Math.max(1, x1 - x0) });
  return pts;
}

export function rectOfEl(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
}

export function radiusPx(el, scale = 1) {
  return (parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0) * scale;
}
