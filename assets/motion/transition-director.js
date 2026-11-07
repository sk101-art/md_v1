// Shared-element transitions across routes (poster -> event detail).
import { motion } from "../core/util.js";

let pending = null;

export function captureShared(link) {
  const media = link.querySelector("[data-shared]");
  if (!media) return;
  const r = media.getBoundingClientRect();
  pending = { slug: media.dataset.shared, rect: r, src: media.tagName === "IMG" ? media.currentSrc || media.src : "", radius: getComputedStyle(media.closest(".poster-media") || media).borderTopLeftRadius };
}

export function playShared(scope) {
  const p = pending;
  pending = null;
  if (!p || motion.reduced) return false;
  const target = document.getElementById("ev-cover");
  if (!target) return false;
  const host = target.closest(".ev-media") || target;
  const z = host.getBoundingClientRect();
  if (!z.width) return false;
  const ghost = document.createElement("div");
  ghost.style.cssText = `position:fixed;left:0;top:0;z-index:57;overflow:hidden;pointer-events:none;border-radius:24px;box-shadow:var(--shadow-3);background:var(--bg-2);` +
    `width:${z.width}px;height:${z.height}px;transform-origin:0 0;`;
  if (p.src) ghost.innerHTML = `<img src="${p.src}" alt="" style="width:100%;height:100%;object-fit:cover">`;
  document.body.append(ghost);
  host.style.visibility = "hidden";
  const sx = p.rect.width / z.width, sy = p.rect.height / z.height;
  const a = ghost.animate([
    { transform: `translate(${p.rect.left}px, ${p.rect.top}px) scale(${sx}, ${sy})` },
    { transform: `translate(${z.left}px, ${z.top}px) scale(1, 1)` }
  ], { duration: 620, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" });
  const done = () => { host.style.visibility = ""; ghost.remove(); };
  a.finished.then(done).catch(done);
  scope.add(done);
  return true;
}
