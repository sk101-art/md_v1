// Surface physics: glass that catches the pointer's light, magnetic primary buttons,
// a scroll-progress hairline in the nav pill, and depth on poster photography.
import { $, $$, motion, finePointer } from "../core/util.js";

export function wireSurfaces() {
  // light follows the pointer across glass, cards and posters
  if (finePointer) {
    let lit = null;
    window.addEventListener("pointermove", e => {
      const el = e.target.closest?.(".glass, .card, .poster, .btn");
      if (lit && lit !== el) lit.classList.remove("lit");
      lit = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
      el.classList.add("lit");

      // magnetic primary buttons
      const mag = e.target.closest?.(".btn.primary, .build-btn");
      if (mag && !motion.reduced) {
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        mag.style.setProperty("--tx", `${(dx * 8).toFixed(1)}px`);
        mag.style.setProperty("--ty", `${(dy * 6).toFixed(1)}px`);
      }
    }, { passive: true });
    document.addEventListener("pointerout", e => {
      const mag = e.target.closest?.(".btn.primary, .build-btn");
      if (mag && !mag.contains(e.relatedTarget)) { mag.style.removeProperty("--tx"); mag.style.removeProperty("--ty"); }
    });
  }

  // scroll progress + poster depth, one rAF per scroll burst
  let ticking = false;
  const frame = () => {
    ticking = false;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const bar = $(".nav-progress");
    if (bar) bar.style.transform = `scaleX(${(scrollY / max).toFixed(4)})`;
    if (motion.reduced) return;
    for (const img of $$(".poster-media img, .ev-media img")) {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) continue;
      const k = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; // -1..1 around centre
      img.style.translate = `0 ${(k * -18).toFixed(1)}px`;
    }
  };
  const kick = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", kick, { passive: true });
  document.addEventListener("mad:route", kick);
  kick();
}
