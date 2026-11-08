// Collaborator identities and cursor elements
import { icons } from "../core/util.js";

export const ROLES = [
  { id: "design", name: "Design", color: "var(--agent-design)", hex: "#5878D8", speed: 1.0 },
  { id: "build", name: "Build", color: "var(--agent-build)", hex: "#C8664A", speed: 1.12 },
  { id: "motion", name: "Motion", color: "var(--agent-motion)", hex: "#9A8CCB", speed: 0.92 },
  { id: "review", name: "Review", color: "var(--agent-review)", hex: "#4FA59D", speed: 0.86 },
  { id: "ship", name: "Ship", color: "var(--agent-ship)", hex: "#C9A23F", speed: 1.05 }
];

// The crew: 11 builders, one per core team role. Each wears its role's short tag and its own
// colour (gold for the President, satin violet for the Secretary, a distinct hue for everyone
// else). Committee builders ("board") lay everything out first; the core four approve and create.
// On the Team page each builder projects the card of the person who holds its role.
const mix = (rgb, k) => rgb.map(v => Math.round(v + (255 - v) * k));
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const builder = (id, short, name, tier, hex, speed = 1) => {
  const c = hexRgb(hex);
  return { id, short, name, tier, color: hex, hex, speed,
    holo: { main: c, text: mix(c, 0.18), line: mix(c, 0.32), streak: mix(c, 0.45), hot: mix(c, 0.9), scan: mix(c, 0.7) } };
};
export const CREW_ROLES = [
  builder("sujay", "PRES", "President", "core", "#D4A62A", 1.0),                       // gold
  builder("manushree", "VP", "Vice President", "core", "#E8609E", 1.08),               // rose
  builder("satin", "SEC", "Secretary", "core", "#7B45B8", 0.98),                       // satin violet
  builder("marylin", "TRES", "Treasurer", "core", "#19B4CF", 0.94),                    // cyan
  builder("hari", "PGM CH", "Program Committee Chair", "board", "#2F8CEB", 1.05),      // azure
  builder("prajna", "PGM VC", "Program Committee Vice Chair", "board", "#F07C2E", 1.0),// tangerine
  builder("poojitha", "PRJ CH", "Project Committee Chair", "board", "#1FA77F", 1.1),   // emerald
  builder("rajeev", "PRJ VC", "Project Committee Vice Chair", "board", "#4F5BE0", 0.96),// indigo
  builder("faidh", "MKT CH", "Marketing Committee Chair", "board", "#84B832", 0.92),   // lime
  builder("mrinal", "MKT VC", "Marketing Committee Vice Chair", "board", "#C04BC9", 1.04), // magenta
  builder("sanjay", "REV CH", "Review Committee Chair", "board", "#E0444F", 1.0)       // crimson
];
export const SATIN = CREW_ROLES[2];
// a stand-in when every builder is busy elsewhere
export const HELPER = { id: "helper", short: "+1", name: "Helper", tier: "board", color: "#8A93A1", hex: "#8A93A1", speed: 1 };

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
    // crew builders wear their role's short tag (PRES, VP, PGM CH...); the full title on hover/AT
    const tag = role.short || (index < ROLES.length ? role.name : "");
    this.el.innerHTML = `<i class="sw-dotc"></i>${icons.cursor}${tag ? `<span class="sw-name" title="${role.name}">${tag}</span>` : ""}`;
    layer.append(this.el);
    if (tag) this.el.classList.add("named");
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
