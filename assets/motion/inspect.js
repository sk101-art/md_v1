// Inspect mode (press I): hover anything to see it the way a design tool would.
// Selection box with W x H, plus type, colour, radius and padding of the element under the pointer.
import { $ } from "../core/util.js";

const rgbToHex = c => {
  const m = String(c).match(/rgba?\(([^)]+)\)/);
  if (!m) return c;
  const [r, g, b, a] = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
  if (a === 0) return "transparent";
  return "#" + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
};
const px = v => `${Math.round(parseFloat(v) || 0)}`;

export class Inspector {
  constructor() {
    this.on = false;
    this.box = document.createElement("div");
    this.box.className = "ins-box";
    this.box.innerHTML = `<i></i><i></i><i></i><i></i><span class="ins-dim"></span><span class="ins-pad"></span>`;
    this.card = document.createElement("div");
    this.card.className = "ins-card";
    this.pill = document.createElement("div");
    this.pill.className = "ins-pill";
    this.pill.setAttribute("role", "status");
    this.pill.innerHTML = `<b>Inspect</b> Hover anything · <kbd>I</kbd> to exit`;
    [this.box, this.card, this.pill].forEach(n => { n.setAttribute("aria-hidden", n === this.pill ? "false" : "true"); document.body.append(n); });

    this.move = e => this.at(e.clientX, e.clientY, e.target);
    this.scroll = () => this.target && this.paint(this.target);
    document.addEventListener("keydown", e => {
      if (e.key.toLowerCase() !== "i" || e.ctrlKey || e.metaKey || e.altKey) return;
      if (/input|textarea|select/i.test(document.activeElement?.tagName || "") || document.activeElement?.isContentEditable) return;
      this.toggle();
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && this.on) this.toggle(false); });
  }
  toggle(force) {
    this.on = force ?? !this.on;
    document.documentElement.classList.toggle("inspecting", this.on);
    window.__mad?.director?.crew.setDim(this.on);
    [this.box, this.card, this.pill].forEach(n => n.classList.toggle("on", this.on));
    if (this.on) {
      window.addEventListener("pointermove", this.move, { passive: true });
      window.addEventListener("scroll", this.scroll, { passive: true });
    } else {
      window.removeEventListener("pointermove", this.move);
      window.removeEventListener("scroll", this.scroll);
      this.target = null;
    }
  }
  at(x, y, t) {
    if (!t || t.closest(".ins-card, .ins-pill, .sw-hud")) return;
    // prefer meaningful elements over anonymous wrappers
    const el = t.closest("h1,h2,h3,h4,p,a,button,img,svg,input,textarea,li,small,b,span,.card,.poster,.glass,.stat,.tag,.ic,.ap-card") || t;
    if (el === this.target) return this.place(x, y);
    this.target = el;
    this.paint(el);
    this.place(x, y);
  }
  paint(el) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    Object.assign(this.box.style, { transform: `translate(${r.left}px, ${r.top}px)`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: cs.borderRadius });
    $(".ins-dim", this.box).textContent = `${Math.round(r.width)} × ${Math.round(r.height)}`;
    const pad = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(px);
    const hasPad = pad.some(v => +v > 0);
    $(".ins-pad", this.box).textContent = hasPad ? `padding ${pad.join(" ")}` : "";
    const font = cs.fontFamily.split(",")[0].replace(/["']/g, "");
    const name = el.tagName.toLowerCase() + (el.classList[0] ? `.${el.classList[0]}` : "");
    const fg = rgbToHex(cs.color), bg = rgbToHex(cs.backgroundColor);
    this.card.innerHTML = `
      <b class="ins-name">${name}</b>
      <span><em>Font</em>${font} · ${px(cs.fontSize)}px / ${cs.fontWeight}</span>
      <span><em>Line</em>${cs.lineHeight === "normal" ? "normal" : px(cs.lineHeight) + "px"} · ${cs.letterSpacing === "normal" ? "0" : cs.letterSpacing}</span>
      <span><em>Colour</em><i style="background:${cs.color}"></i>${fg}</span>
      ${bg !== "transparent" ? `<span><em>Fill</em><i style="background:${cs.backgroundColor}"></i>${bg}</span>` : ""}
      ${parseFloat(cs.borderTopLeftRadius) ? `<span><em>Radius</em>${px(cs.borderTopLeftRadius)}px</span>` : ""}`;
  }
  place(x, y) {
    const w = this.card.offsetWidth || 220, h = this.card.offsetHeight || 120;
    const nx = x + 18 + w > innerWidth ? x - w - 14 : x + 18;
    const ny = y + 18 + h > innerHeight ? y - h - 14 : y + 18;
    this.card.style.transform = `translate(${nx}px, ${ny}px)`;
  }
}
