// Segmented controls / tablists with a spring selection frame that briefly
// shows its anchor handles while it morphs between options (Swarm "Morph" in miniature).
import { $$ } from "./util.js";

export function wireSeg(container, { onSelect, selectedAttr = "aria-pressed", scope, initial } = {}) {
  if (!container) return null;
  const items = $$("button", container).filter(b => b.parentElement === container);
  let frame = container.querySelector(":scope > .seg-frame");
  if (!frame) { frame = document.createElement("span"); frame.className = "seg-frame"; frame.setAttribute("aria-hidden", "true"); container.prepend(frame); }
  let timer = 0;
  const place = (btn, animate = true) => {
    if (!btn) return;
    const c = container.getBoundingClientRect();
    const r = btn.getBoundingClientRect();
    const k = c.width / (container.offsetWidth || c.width) || 1; // undo ancestor CSS scale
    if (!animate) frame.style.transition = "none";
    frame.style.width = `${r.width / k}px`;
    frame.style.height = `${r.height / k}px`;
    frame.style.transform = `translate(${(r.left - c.left) / k - container.clientLeft}px, ${(r.top - c.top) / k - container.clientTop}px)`;
    if (!animate) { void frame.offsetWidth; frame.style.transition = ""; }
    else { frame.classList.add("moving"); clearTimeout(timer); timer = setTimeout(() => frame.classList.remove("moving"), 420); }
  };
  const select = (btn, { silent = false, animate = true } = {}) => {
    items.forEach(b => b.setAttribute(selectedAttr, String(b === btn)));
    if (selectedAttr === "aria-selected") items.forEach(b => b.tabIndex = b === btn ? 0 : -1);
    place(btn, animate);
    if (!silent && onSelect) onSelect(btn, items.indexOf(btn));
  };
  items.forEach((b, i) => {
    b.addEventListener("click", () => select(b));
    b.addEventListener("keydown", e => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) return;
      if (selectedAttr !== "aria-selected") return;
      e.preventDefault();
      let j = i;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % items.length;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + items.length) % items.length;
      if (e.key === "Home") j = 0;
      if (e.key === "End") j = items.length - 1;
      items[j].focus();
      select(items[j]);
    });
  });
  const start = initial != null ? items[initial] : items.find(b => b.getAttribute(selectedAttr) === "true") || items[0];
  select(start, { silent: true, animate: false });
  const ro = new ResizeObserver(() => place(items.find(b => b.getAttribute(selectedAttr) === "true"), false));
  ro.observe(container);
  if (scope) scope.add(() => ro.disconnect());
  return { select: (i, o) => select(items[i], o), items, refresh: () => place(items.find(b => b.getAttribute(selectedAttr) === "true"), false) };
}
