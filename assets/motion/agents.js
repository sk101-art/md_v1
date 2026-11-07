// Collaborator identities and cursor elements
import { icons } from "../core/util.js";

export const ROLES = [
  { id: "design", name: "Design", color: "var(--agent-design)", hex: "#5878D8", speed: 1.0 },
  { id: "build", name: "Build", color: "var(--agent-build)", hex: "#C8664A", speed: 1.12 },
  { id: "motion", name: "Motion", color: "var(--agent-motion)", hex: "#9A8CCB", speed: 0.92 },
  { id: "review", name: "Review", color: "var(--agent-review)", hex: "#4FA59D", speed: 0.86 },
  { id: "ship", name: "Ship", color: "var(--agent-ship)", hex: "#C9A23F", speed: 1.05 }
];

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
    // only the first instance of each role carries a visible name tag
    this.el.innerHTML = `${icons.cursor}${index < ROLES.length ? `<span class="sw-name">${role.name}</span>` : ""}`;
    layer.append(this.el);
    if (index < ROLES.length) this.el.classList.add("named");
  }
  place(x, y) {
    this.x = x; this.y = y;
    this.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }
  remove() { this.el.remove(); }
}
