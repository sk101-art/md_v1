// The finished phone: real tabs, real events, inertial hover. Hover activates only once live.
import { $, $$, esc, finePointer, motion, icons } from "../core/util.js";
import { wireSeg } from "../core/seg.js";

export function wireLivingPhone({ scope }) {
  const phone = $("#phone");
  const stage = $(".stage");
  if (!phone) return { activate() {} };

  const views = $$(".os-view", phone);
  const tabs = wireSeg($(".os-tabs", phone), {
    selectedAttr: "aria-selected",
    scope,
    onSelect: (_, i) => views.forEach((v, j) => v.classList.toggle("on", i === j))
  });

  const items = $$(".os-list button", phone);
  const desc = $("#os-desc", phone), open = $("#os-open", phone);
  items.forEach(btn => btn.addEventListener("click", () => {
    items.forEach(b => b.setAttribute("aria-current", String(b === btn)));
    desc.textContent = btn.dataset.desc;
    open.href = `event.html?e=${encodeURIComponent(btn.dataset.slug)}`;
    open.innerHTML = `Open ${esc(btn.dataset.name)} ${icons.arrow}`;
  }));

  let active = false;
  const activate = () => {
    active = true;
    tabs && tabs.refresh();
    if (!finePointer || motion.reduced || !stage) return;
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      phone.style.setProperty("--rx", `${(-cy * 7).toFixed(2)}deg`);
      phone.style.setProperty("--ry", `${(cx * 9).toFixed(2)}deg`);
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) raf = requestAnimationFrame(loop);
      else raf = 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    scope.on(stage, "pointermove", e => {
      if (!active || stage.dataset.state !== "live") return;
      const r = stage.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      kick();
    }, { passive: true });
    scope.on(stage, "pointerleave", () => { tx = 0; ty = 0; kick(); });
    scope.add(() => cancelAnimationFrame(raf));
  };
  return { activate };
}
