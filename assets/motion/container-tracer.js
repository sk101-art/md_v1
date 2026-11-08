// Container Tracer (Ania-inspired): a container's real rounded perimeter is drawn
// progressively, a bright head travels the edge, then the glass surface resolves.
import { pageRect, radiusOf } from "./selection-geometry.js";
import { motion } from "../core/util.js";

const NS = "http://www.w3.org/2000/svg";

export function roundedRectPath(w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  // start at top edge just after the top-left corner, run clockwise, close at the start
  return [
    `M ${r} 0`,
    `H ${w - r}`,
    r ? `A ${r} ${r} 0 0 1 ${w} ${r}` : "",
    `V ${h - r}`,
    r ? `A ${r} ${r} 0 0 1 ${w - r} ${h}` : "",
    `H ${r}`,
    r ? `A ${r} ${r} 0 0 1 0 ${h - r}` : "",
    `V ${r}`,
    r ? `A ${r} ${r} 0 0 1 ${r} 0` : "",
    "Z"
  ].join(" ");
}

/**
 * Trace an element's perimeter inside `layer` (document-space overlay).
 * Resolves when the edge is fully drawn and the surface has resolved.
 */
export function traceContainer(el, layer, { duration = 0.75, delay = 0, color = "#5878D8", onResolve, run } = {}) {
  return new Promise(resolve => {
    if (!el || !layer || motion.reduced || typeof gsap === "undefined") {
      onResolve && onResolve();
      return resolve();
    }
    const rect = pageRect(el);
    const radius = radiusOf(el);
    const w = Math.max(8, rect.w), h = Math.max(8, rect.h);

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "trace-svg");
    svg.setAttribute("width", w + 4);
    svg.setAttribute("height", h + 4);
    svg.style.transform = `translate(${rect.x - 2}px, ${rect.y - 2}px)`;
    const g = document.createElementNS(NS, "g");
    g.setAttribute("transform", "translate(2 2)");
    const d = roundedRectPath(w, h, radius);

    const base = document.createElementNS(NS, "path");
    base.setAttribute("d", d);
    base.setAttribute("stroke", "#C7D1DD");
    base.setAttribute("stroke-width", "1");

    const lit = document.createElementNS(NS, "path");
    lit.setAttribute("d", d);
    lit.setAttribute("stroke", color);
    lit.setAttribute("stroke-width", "1.6");

    g.append(base, lit);
    svg.append(g);
    layer.append(svg);

    const len = base.getTotalLength();
    base.style.strokeDasharray = `${len}`;
    base.style.strokeDashoffset = `${len}`;
    const seg = Math.min(140, len * 0.18);
    lit.style.strokeDasharray = `${seg} ${len}`;
    lit.style.strokeDashoffset = `${seg}`;

    const head = document.createElement("i");
    head.className = "trace-head";
    head.style.opacity = "0";
    layer.append(head);

    let resolved = false;
    const state = { p: 0 };
    const tl = gsap.timeline({
      delay,
      onComplete: () => {
        gsap.to([svg, head], { opacity: 0, duration: 0.35, onComplete: () => { svg.remove(); head.remove(); resolve(); } });
      }
    });
    tl.set(head, { opacity: 1 });
    tl.to(state, {
      p: 1,
      duration,
      ease: "power2.inOut",
      onUpdate: () => {
        const at = state.p * len;
        base.style.strokeDashoffset = `${len - at}`;
        lit.style.strokeDashoffset = `${seg - at}`;
        const pt = base.getPointAtLength(Math.min(len, at));
        head.style.transform = `translate(${rect.x + pt.x}px, ${rect.y + pt.y}px)`;
        if (!resolved && state.p > 0.55) { resolved = true; onResolve && onResolve(); }
      }
    });
    if (run) run.track(tl, () => { svg.remove(); head.remove(); if (!resolved) { resolved = true; onResolve && onResolve(); } resolve(); });
  });
}
