// =====================================================
// HOVER TEXT
// -----------------------------------------------------
// One small bubble for the whole site. Anything with data-tip="…" shows it at once when you point at it.
// Only the hover texts that really help use it (Skill Tree nodes, Abilities); every other title="…" stays a plain
// browser tooltip. Touch screens show nothing.
// =====================================================

let bubble = null;
let current = null;

function hide() {
  if (bubble) bubble.hidden = true;
  current = null;
}

function show(el) {
  const text = el.dataset.tip;
  if (!text) return hide();
  if (!bubble) {
    bubble = document.createElement("div");
    bubble.className = "hover-tip";
    bubble.setAttribute("role", "tooltip");
    document.body.appendChild(bubble);
  }
  current = el;
  bubble.textContent = text;
  bubble.hidden = false;
  // Above the element, kept inside the window (below it when there is no room above)
  const r = el.getBoundingClientRect();
  const b = bubble.getBoundingClientRect();
  let left = r.left + r.width / 2 - b.width / 2;
  left = Math.max(6, Math.min(left, window.innerWidth - b.width - 6));
  let top = r.top - b.height - 8;
  if (top < 6) top = r.bottom + 8;
  bubble.style.left = `${left}px`;
  bubble.style.top = `${top}px`;
}

export function initTooltips() {
  document.addEventListener("mouseover", (e) => {
    const el = e.target.closest?.("[data-tip]");
    if (!el) return;
    if (el !== current) show(el);
  });
  document.addEventListener("mouseout", (e) => {
    if (current && !current.contains(e.relatedTarget)) hide();
  });
  for (const type of ["mousedown", "dragstart", "scroll", "keydown"]) document.addEventListener(type, hide, true);
}
