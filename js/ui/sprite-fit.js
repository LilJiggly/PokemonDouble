// =====================================================
// SPRITE FIT (animated sprites outside battles)
// -----------------------------------------------------
// Animated Gen 5 sprites are cropped to the Pokémon, so Corsola and Taillow
// have different image sizes. In a fixed box ("contain") each one would fill
// the box, making small Pokémon look as big as large ones. This draws them at
// one shared scale instead (natural size × box / 72), so a Cherubi stays much
// smaller than a Charizard. Only sprites bigger than 72 px are shrunk to fit.
// =====================================================

const FRAME = 72; // sprites up to this many px are drawn at box / 72; bigger ones are shrunk to fill the box
const isAnimated = (img) => (img.getAttribute("src") ?? "").includes("/gen5-ani/") && !img.closest(".scene, .banner-frame");

function fit(img) {
  if (!isAnimated(img) || !img.naturalWidth) return;
  for (const p of ["width", "height", "margin", "aspectRatio"]) img.style[p] = "";
  const box = img.getBoundingClientRect().width; // the size the page's CSS gives this image
  if (!box) return;
  const scale = box / Math.max(FRAME, img.naturalWidth, img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  img.style.width = `${w}px`;
  img.style.height = `${h}px`;
  img.style.aspectRatio = "auto";
  // Pad with margins so the image still takes up exactly its box (and sits in the middle of it)
  img.style.margin = `${Math.max(0, (box - h) / 2)}px ${Math.max(0, (box - w) / 2)}px`;
  img.style.objectFit = "fill";
}

function check(img) {
  if (!isAnimated(img)) return;
  if (img.complete && img.naturalWidth) fit(img);
  else img.addEventListener("load", () => fit(img), { once: true });
}

export function watchSpriteFit(root = document.body) {
  const scan = (node) => {
    if (node.nodeType !== 1) return;
    if (node.tagName === "IMG") check(node);
    node.querySelectorAll?.("img").forEach(check);
  };
  new MutationObserver((list) => {
    for (const m of list) {
      m.addedNodes.forEach(scan);
      if (m.type === "attributes") check(m.target);
    }
  }).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
  let timer;
  addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(() => root.querySelectorAll("img").forEach(check), 150);
  });
  scan(root);
}
