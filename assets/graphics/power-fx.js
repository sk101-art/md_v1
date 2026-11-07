// Power effects: PCB-style circuit traces that grow out of the club logo, and blue lightning.
// Everything draws into an SVG you pass in, in that SVG's own coordinate space.
const NS = "http://www.w3.org/2000/svg";
const BLUE = "#7FA6FF", CORE = "#E8F0FF";

export function makeSvg(host, w, h, cls = "pfx") {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", cls);
  svg.setAttribute("width", w);
  svg.setAttribute("height", h);
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = `<defs><filter id="pfx-glow" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
  host.append(svg);
  return svg;
}

const el = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };

/** Circuit traces: from origin to each target with right-angle elbows, pads, and a travelling spark. */
export function circuit(svg, o, targets, { dur = 700, color = BLUE, stagger = 40, rate = 1 } = {}) {
  const g = el("g", { filter: "url(#pfx-glow)" });
  svg.append(g);
  const anims = targets.map((t, i) => {
    // leave the logo radially, then turn like a PCB track: horizontal run, vertical run, short tail
    const dx = t.x - o.x, dy = t.y - o.y;
    const lead = 0.22;
    const a = { x: o.x + dx * lead, y: o.y + dy * lead };
    const b = Math.abs(dx) > Math.abs(dy) ? { x: a.x + (t.x - a.x) * 0.7, y: a.y } : { x: a.x, y: a.y + (t.y - a.y) * 0.7 };
    const c = Math.abs(dx) > Math.abs(dy) ? { x: b.x, y: t.y } : { x: t.x, y: b.y };
    const d = `M${o.x} ${o.y}L${a.x} ${a.y}L${b.x} ${b.y}L${c.x} ${c.y}L${t.x} ${t.y}`;
    const path = el("path", { d, fill: "none", stroke: color, "stroke-width": 1.4, "stroke-linejoin": "round", "stroke-linecap": "round", opacity: 0.9 });
    g.append(path);
    [a, b, c].forEach(p => g.append(el("circle", { cx: p.x, cy: p.y, r: 1.6, fill: color, opacity: 0 })));
    const pad = el("circle", { cx: t.x, cy: t.y, r: 2.6, fill: CORE, opacity: 0 });
    g.append(pad);
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;
    const delay = i * stagger;
    const draw = path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: dur, delay, easing: "cubic-bezier(.5,0,.2,1)", fill: "forwards" });
    draw.playbackRate = rate;
    // pads light up as the track passes them
    [...g.querySelectorAll("circle")].slice(-4).forEach((c2, k) => {
      const an = c2.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: delay + dur * (k === 3 ? 0.95 : 0.25 + k * 0.22), fill: "forwards" });
      an.playbackRate = rate;
    });
    // a spark rides the track once it has been laid
    const spark = el("circle", { r: 2.2, fill: CORE });
    g.append(spark);
    const sp = spark.animate([{ offsetDistance: "0%" }, { offsetDistance: "100%" }], { duration: dur * 0.8, delay: delay + dur * 0.35, easing: "ease-in", fill: "forwards" });
    spark.style.offsetPath = `path("${d}")`;
    sp.playbackRate = rate;
    return draw.finished.catch(() => {});
  });
  return { done: Promise.all(anims), g };
}

// Midpoint-displacement bolt with occasional forks
function bolt(x1, y1, x2, y2, disp, out, depth = 0) {
  if (disp < 1.6 || depth > 7) { out.push([x2, y2]); return; }
  const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * disp;
  const my = (y1 + y2) / 2 + (Math.random() - 0.5) * disp;
  bolt(x1, y1, mx, my, disp / 2, out, depth + 1);
  bolt(mx, my, x2, y2, disp / 2, out, depth + 1);
}
function boltPath(a, b, jag = 0.32) {
  const pts = [[a.x, a.y]];
  bolt(a.x, a.y, b.x, b.y, Math.hypot(b.x - a.x, b.y - a.y) * jag, pts);
  return "M" + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L");
}

/** Blue lightning from origin to targets: a few flickering strikes, then it fades. */
export function lightning(svg, o, targets, { flashes = 4, gap = 70, rate = 1, onStrike } = {}) {
  const g = el("g", { filter: "url(#pfx-glow)" });
  svg.append(g);
  return new Promise(res => {
    let n = 0;
    const strike = () => {
      g.innerHTML = "";
      targets.forEach(t => {
        const d = boltPath(o, t);
        g.append(el("path", { d, fill: "none", stroke: BLUE, "stroke-width": 3.2, opacity: 0.45, "stroke-linejoin": "round" }));
        g.append(el("path", { d, fill: "none", stroke: CORE, "stroke-width": 1.1, "stroke-linejoin": "round" }));
        if (Math.random() < 0.45) {
          // a fork that dies out halfway
          const m = { x: o.x + (t.x - o.x) * (0.3 + Math.random() * 0.3), y: o.y + (t.y - o.y) * (0.3 + Math.random() * 0.3) };
          const f = { x: m.x + (Math.random() - 0.5) * 60, y: m.y + (Math.random() - 0.5) * 60 };
          g.append(el("path", { d: boltPath(m, f, 0.4), fill: "none", stroke: BLUE, "stroke-width": 0.9, opacity: 0.8 }));
        }
      });
      g.style.opacity = String(0.65 + Math.random() * 0.35);
      onStrike && onStrike(n);
      n++;
      if (n < flashes) setTimeout(strike, (gap + Math.random() * 40) / rate);
      else {
        const fade = g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, fill: "forwards" });
        fade.playbackRate = rate;
        fade.finished.then(() => { g.remove(); res(); }).catch(() => { g.remove(); res(); });
      }
    };
    strike();
  });
}


/* ------------------------------------------------------------------------------------------ */
/* Circuit network: even, all-directions PCB fan-out with a glow that flows along every trace. */
/* ------------------------------------------------------------------------------------------ */

// Octilinear route (45° + straight runs) from a to b, leaving `a` along a short radial stub
function route(a, b, flip) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const ax = Math.abs(dx), ay = Math.abs(dy), sx = Math.sign(dx) || 1, sy = Math.sign(dy) || 1;
  const diag = Math.min(ax, ay);
  const pts = [a];
  if (flip) { // straight first, then the diagonal
    const p1 = ax > ay ? { x: a.x + sx * (ax - diag), y: a.y } : { x: a.x, y: a.y + sy * (ay - diag) };
    pts.push(p1);
  } else {    // diagonal first, then straight
    pts.push({ x: a.x + sx * diag, y: a.y + sy * diag });
  }
  pts.push(b);
  return pts;
}
const toD = pts => "M" + pts.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("L");

/** Evenly spread endpoints around o inside a W x H box (inset), at alternating depths. */
export function evenEndpoints(o, W, H, n = 22, inset = 16) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 + 0.13;
    const cx = Math.cos(ang), cy = Math.sin(ang);
    // distance from o to the inset boundary along this ray
    const tx = cx > 0 ? (W - inset - o.x) / cx : cx < 0 ? (inset - o.x) / cx : Infinity;
    const ty = cy > 0 ? (H - inset - o.y) / cy : cy < 0 ? (inset - o.y) / cy : Infinity;
    const reach = Math.min(tx, ty);
    const depth = [0.96, 0.62, 0.82, 0.48][i % 4];
    out.push({ x: o.x + cx * reach * depth, y: o.y + cy * reach * depth, ang });
  }
  return out;
}

/**
 * A powered circuit board grown from the logo:
 *  - main traces leave the logo's edge evenly in all directions (octilinear PCB routing)
 *  - each main trace forks at its end into fine tapering branches (no round end pads)
 *  - a second layer of thinner, fainter traces also grows out of the logo
 *  - a glow travels from the logo along every trace and on into its branches, slowly,
 *    lighting the copper behind it; `onArrive(i)` fires when a main trace's glow reaches its fork.
 */
export function powerNetwork(svg, o, ends, {
  r0 = 24, lay = 700, flow = 1300, stagger = 40, rate = 1, color = "#6F95F2",
  fine = 0, fineBox = null, branches = true, onArrive
} = {}) {
  const base = el("g"), glowG = el("g", { filter: "url(#pfx-glow)" });
  svg.append(base, glowG);
  const traces = [];
  const addTrace = (pts, w, op, kind) => {
    const d = toD(pts);
    const p = el("path", { d, fill: "none", stroke: color, "stroke-width": w, "stroke-linejoin": "round", "stroke-linecap": "round", opacity: op });
    base.append(p);
    const t = { p, d, len: p.getTotalLength(), w, op, kind, pts };
    traces.push(t);
    return t;
  };
  const radial = (ang, r) => ({ x: o.x + Math.cos(ang) * r, y: o.y + Math.sin(ang) * r });

  // main traces
  const mains = ends.map((e, i) => {
    const ang = e.ang ?? Math.atan2(e.y - o.y, e.x - o.x);
    const pts = [radial(ang, r0), ...route(radial(ang, r0 + 10), e, i % 2 === 1)];
    const t = addTrace(pts, 1.15, 0.3, "main");
    t.i = i;
    // tapering forks at the end: continue straight + split at ±45°, each fading thinner
    t.kids = [];
    if (branches) {
      const last = pts[pts.length - 2], end = pts[pts.length - 1];
      const dir = Math.atan2(end.y - last.y, end.x - last.x);
      const spread = [0, Math.PI / 4, -Math.PI / 4];
      spread.forEach((da, k) => {
        if (k === 0 && i % 3 === 0) return; // some forks only split, never continue
        const L = 10 + ((i * 7 + k * 5) % 14);
        const a1 = dir + da;
        const mid = { x: end.x + Math.cos(a1) * L * 0.55, y: end.y + Math.sin(a1) * L * 0.55 };
        // the tip bends back toward the parent's direction, like a PCB stub
        const tip = { x: mid.x + Math.cos(dir) * L * 0.45, y: mid.y + Math.sin(dir) * L * 0.45 };
        t.kids.push([
          addTrace([end, mid], 0.75, 0.24, "fork"),
          addTrace([mid, tip], 0.42, 0.16, "tip")
        ]);
      });
    }
    return t;
  });

  // fine secondary layer: thinner, fainter traces, also born at the logo's edge
  const fines = [];
  if (fine && fineBox) {
    const { W, H, inset = 10 } = fineBox;
    for (let j = 0; j < fine; j++) {
      const ang = (j / fine) * Math.PI * 2 + 0.31;
      const cx = Math.cos(ang), cy = Math.sin(ang);
      const tx = cx > 0 ? (W - inset - o.x) / cx : cx < 0 ? (inset - o.x) / cx : Infinity;
      const ty = cy > 0 ? (H - inset - o.y) / cy : cy < 0 ? (inset - o.y) / cy : Infinity;
      const reach = Math.min(tx, ty) * [0.9, 0.7, 0.55, 0.8, 0.4][j % 5];
      const e = { x: o.x + cx * reach, y: o.y + cy * reach };
      const pts = [radial(ang, r0 - 2), ...route(radial(ang, r0 + 4), e, j % 3 === 0)];
      const t = addTrace(pts, 0.5, 0.14, "fine");
      t.j = j;
      fines.push(t);
    }
  }

  // 1) copper is laid from the logo outward
  traces.forEach((t, k) => {
    t.p.style.strokeDasharray = `${t.len}`;
    const delay = t.kind === "main" ? t.i * 10 : t.kind === "fine" ? 120 + t.j * 6 : lay * 0.8;
    const a = t.p.animate([{ strokeDashoffset: t.len }, { strokeDashoffset: 0 }], { duration: t.kind === "main" || t.kind === "fine" ? lay : lay * 0.4, delay, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
    a.playbackRate = rate;
  });

  // 2) a glow runs along a trace; resolves when it reaches the end
  const glow = (t, { delay = 0, dur = flow, w = 3, core = 1.2, seg = 46, haloOp = 0.55 } = {}) => new Promise(res => {
    const L = t.len, sg = Math.min(seg, L * 0.6);
    const mk = (width, op, col) => {
      const f = t.p.cloneNode();
      f.setAttribute("stroke", col); f.setAttribute("stroke-width", width); f.setAttribute("opacity", op);
      f.style.strokeDasharray = `${sg} ${L + sg}`; f.style.strokeDashoffset = `${sg}`;
      glowG.append(f);
      return f;
    };
    const halo = mk(w, haloOp, "#8FB0FF"), c = mk(core, 1, "#EAF1FF");
    const fr = [{ strokeDashoffset: sg }, { strokeDashoffset: -L }];
    const op = { duration: dur, delay, easing: "cubic-bezier(.45,0,.3,1)", fill: "forwards" };
    const a1 = halo.animate(fr, op), a2 = c.animate(fr, op);
    a1.playbackRate = a2.playbackRate = rate;
    // copper behind the glow stays energised
    const lit = t.p.animate([{ opacity: t.op, stroke: color }, { opacity: Math.min(0.95, t.op * 2.8), stroke: "#A9C1FF" }], { ...op, duration: dur });
    lit.playbackRate = rate;
    a2.finished.then(() => { halo.remove(); c.remove(); res(); }).catch(res);
  });

  const mainFlows = mains.map((t, i) => glow(t, { delay: lay * 0.6 + (i % 8) * stagger }).then(async () => {
    onArrive && onArrive(i, ends[i]);
    // the glow carries on into the forks, then out to the tapering tips
    await Promise.all(t.kids.map(([f, tip]) =>
      glow(f, { dur: flow * 0.32, w: 2, core: 0.8, seg: 14, haloOp: 0.45 })
        .then(() => glow(tip, { dur: flow * 0.28, w: 1.2, core: 0.5, seg: 10, haloOp: 0.35 }))));
  }));
  const fineFlows = fines.map((t, j) => glow(t, { delay: lay * 0.75 + (j % 10) * stagger * 0.8, dur: flow * 1.25, w: 1.6, core: 0.6, seg: 30, haloOp: 0.35 }));
  return { done: Promise.all([...mainFlows, ...fineFlows]), g: base, glowG };
}
