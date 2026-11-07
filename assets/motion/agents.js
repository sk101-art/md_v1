// Collaborator identities and cursor elements
import { icons } from "../core/util.js";

export const ROLES = [
  { id: "design", name: "Design", color: "var(--agent-design)", hex: "#5878D8", speed: 1.0 },
  { id: "build", name: "Build", color: "var(--agent-build)", hex: "#C8664A", speed: 1.12 },
  { id: "motion", name: "Motion", color: "var(--agent-motion)", hex: "#9A8CCB", speed: 0.92 },
  { id: "review", name: "Review", color: "var(--agent-review)", hex: "#4FA59D", speed: 0.86 },
  { id: "ship", name: "Ship", color: "var(--agent-ship)", hex: "#C9A23F", speed: 1.05 }
];

// The crew: 11 builders, one per member of the core team, each in a colour of its own. On the
// Team page every builder projects its own member's card, in its own colour: gold for the
// President, satin violet for the Secretary, and a distinct hue for everyone else.
const mix = (rgb, k) => rgb.map(v => Math.round(v + (255 - v) * k));
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const builder = (id, name, hex, speed = 1) => {
  const c = hexRgb(hex);
  return { id, name, color: hex, hex, speed,
    holo: { main: c, text: mix(c, 0.18), line: mix(c, 0.32), streak: mix(c, 0.45), hot: mix(c, 0.9), scan: mix(c, 0.7) } };
};
// role labels keep the swarm's vocabulary; the colour is what identifies each builder
export const CREW_ROLES = [
  builder("sujay", "Design", "#D4A62A", 1.0),      // gold
  builder("manushree", "Build", "#E8609E", 1.12),  // rose
  builder("satin", "Motion", "#7B45B8", 0.96),     // satin violet
  builder("marylin", "Review", "#19B4CF", 0.86),   // cyan
  builder("hari", "Ship", "#2F8CEB", 1.05),        // azure
  builder("prajna", "Design", "#F07C2E", 1.0),     // tangerine
  builder("poojitha", "Build", "#1FA77F", 1.1),    // emerald
  builder("rajeev", "Motion", "#4F5BE0", 0.94),    // indigo
  builder("faidh", "Review", "#84B832", 0.9),      // lime
  builder("mrinal", "Ship", "#C04BC9", 1.04),      // magenta
  builder("sanjay", "Design", "#E0444F", 1.0)      // crimson
];
export const SATIN = CREW_ROLES[2];

// The visitor's pointer in page coordinates; agents near it are nudged aside.
export const visitor = { x: -1e5, y: -1e5 };
const YIELD_R = 90, YIELD_PUSH = 34;

export class Agent {
  constructor(layer, role, index) {
    this.role = role;
    this.index = index;
    this.x = 0;
    this.y = 0;
    this.busy = false;
    this.el = document.createElement("div");
    this.el.className = "sw-agent";
    this.el.style.setProperty("--c", role.color);
    this.el.style.setProperty("--i", String(index));
    // only the first instance of each role carries a visible name tag
    this.el.innerHTML = `<i class="sw-dotc"></i>${icons.cursor}${index < ROLES.length ? `<span class="sw-name">${role.name}</span>` : ""}`;
    layer.append(this.el);
    if (index < ROLES.length) this.el.classList.add("named");
  }
  setMode(m) { this.mode = m; this.el.classList.toggle("dot", m === "dot"); }
  place(x, y) {
    this.x = x; this.y = y;
    if (this.mode === "dot") { this.el.style.transform = `translate3d(${x}px, ${y}px, 0)`; return; }
    let dx = x - visitor.x, dy = y - visitor.y;
    const d = Math.hypot(dx, dy);
    if (d < YIELD_R && d > 0.01) {
      const k = (1 - d / YIELD_R) * YIELD_PUSH;
      x += (dx / d) * k; y += (dy / d) * k;
    }
    this.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }
  press() {
    const svg = this.el.querySelector("svg");
    if (svg && svg.animate) svg.animate([{ transform: "scale(1)" }, { transform: "scale(.78)" }, { transform: "scale(1)" }], { duration: 220, easing: "ease-out" });
  }
  remove() { this.el.remove(); }
}
