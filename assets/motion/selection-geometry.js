// Real target geometry from the DOM, in document (page) coordinates.
export function pageRect(el, pad = 0) {
  const r = el.getBoundingClientRect();
  return {
    x: r.left + window.scrollX - pad,
    y: r.top + window.scrollY - pad,
    w: r.width + pad * 2,
    h: r.height + pad * 2,
    vx: r.left,
    vy: r.top
  };
}

export function radiusOf(el) {
  const v = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  const r = el.getBoundingClientRect();
  return Math.min(v, r.width / 2, r.height / 2);
}

export function inViewport(el, margin = 0) {
  const r = el.getBoundingClientRect();
  return r.bottom > -margin && r.top < window.innerHeight + margin &&
    r.right > -margin && r.left < window.innerWidth + margin && r.width > 0 && r.height > 0;
}

// Per-line boxes for a text block, used as neutral skeleton pieces.
export function lineRects(el, maxLines = 6) {
  try {
    const range = document.createRange();
    range.selectNodeContents(el);
    const raw = [...range.getClientRects()].filter(r => r.width > 2 && r.height > 2);
    const lines = [];
    for (const r of raw) {
      const last = lines[lines.length - 1];
      if (last && Math.abs(last.top - r.top) < r.height * 0.5) {
        last.left = Math.min(last.left, r.left);
        last.right = Math.max(last.right, r.right);
        last.bottom = Math.max(last.bottom, r.bottom);
      } else {
        lines.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom, height: r.height });
      }
    }
    return lines.slice(0, maxLines).map(l => {
      const h = l.bottom - l.top;
      const inset = h * 0.18;
      return { x: l.left + window.scrollX, y: l.top + window.scrollY + inset, w: l.right - l.left, h: Math.max(4, h - inset * 2) };
    });
  } catch {
    return [];
  }
}

export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
