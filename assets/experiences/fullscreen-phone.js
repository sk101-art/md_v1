// Full-screen mode: the OS leaves the mockup and takes over the visitor's own screen.
// The live OS node is moved (state preserved), with a shared-element expansion both ways.
import { $, motion } from "../core/util.js";

export class FullscreenPhone {
  constructor({ scope, screen }) {
    this.scope = scope;
    this.screen = screen;
    this.d = document.createElement("dialog");
    this.d.className = "os-full";
    this.d.setAttribute("aria-label", "MAD OS full screen");
    this.d.innerHTML = `<div class="os-full-screen"><span class="phone-island"></span></div><button type="button" class="os-full-close">Exit full screen</button>`;
    document.body.append(this.d);
    this.host = $(".os-full-screen", this.d);
    $(".os-full-close", this.d).onclick = () => this.close();
    this.d.addEventListener("cancel", e => { e.preventDefault(); this.close(); });
    scope.add(() => { this.restore(); this.d.remove(); });
  }
  get isOpen() { return this.d.open; }

  async open() {
    const os = $(".os", this.screen);
    if (!os || this.isOpen) return;
    const from = this.screen.getBoundingClientRect();
    this.d.showModal();
    document.documentElement.style.overflow = "hidden";
    this.host.append(os);
    const to = this.host.getBoundingClientRect();
    if (!motion.reduced) {
      const sx = from.width / to.width, sy = from.height / to.height;
      await this.host.animate([
        { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) translate(-50%, -50%) scale(${sx}, ${sy})`, transformOrigin: "0 0", borderRadius: "40px" },
        { transform: "translate(-50%, -50%)", transformOrigin: "0 0" }
      ], { duration: 560, easing: "cubic-bezier(.2,.9,.2,1)", composite: "replace" }).finished.catch(() => {});
    }
    try { navigator.vibrate && navigator.vibrate(10); } catch {}
    $(".os-ind", os)?.focus();
  }

  async close() {
    if (!this.isOpen) return;
    const to = this.screen.getBoundingClientRect();
    const from = this.host.getBoundingClientRect();
    if (!motion.reduced && to.width) {
      const sx = to.width / from.width, sy = to.height / from.height;
      await this.host.animate([
        { transform: "translate(-50%, -50%)" },
        { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) translate(-50%, -50%) scale(${sx}, ${sy})`, transformOrigin: "0 0" }
      ], { duration: 460, easing: "cubic-bezier(.4,0,.2,1)" }).finished.catch(() => {});
    }
    this.restore();
    this.d.close();
  }
  restore() {
    const os = $(".os", this.host);
    if (os) this.screen.append(os);
    document.documentElement.style.overflow = "";
  }
}
