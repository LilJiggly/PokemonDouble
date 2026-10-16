// =====================================================
// SPRITE ALIGNMENT
// -----------------------------------------------------
// Gen 4 sprites sit at different spots inside their
// 80×80 frame, so placing the frames alone leaves gaps
// and floating Pokémon. This measures each sprite's
// visible pixels once and shifts it so its feet touch
// the platform and it's centred in its spot.
// Flying / Levitate Pokémon hover a little, like in the games.
// =====================================================

// Hand-tuned nudges per sprite file (data/sprite-offsets.json, made on tools/sprite-check.html):
// { "images/sprites/gen4/front/25.png": { "x": 1.5, "y": -2 } }, in % of the 80 px sprite frame.
// "_settings" holds the Gen 5 back-sprite look: backScale (bigger = closer to the camera) and
// backSink (share of the sprite's height that sinks behind the textbox).
let offsets = {};
let settings = { backScale: 1.15, backSink: 0.25 };
export function setSpriteOffsets(o) {
  offsets = o ?? {};
  settings = { backScale: 1.15, backSink: 0.25, ...(offsets._settings ?? {}) };
}
export const getSpriteSettings = () => ({ ...settings });
// Shiny sprites share the regular sprite's nudge (…/front-shiny/25.png → …/front/25.png)
export const spriteKey = (img) => (img.getAttribute("src") ?? "").replace(/^(\.\.\/)+/, "").split("?")[0].replace("-shiny/", "/");

const boxes = new Map(); // src → { left, right, top, bottom, width, height }
const HOVER_PERCENT = 5;
const BASE_SIZE = 80; // Gen 4 sprites
const CHARACTER_HEIGHT = 74; // visible height every player character is scaled to (Lucas ≈ 67 px, Gen 5 sprites ≈ 110 px)

function measure(img) {
  const cached = boxes.get(img.src);
  if (cached) return cached;
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d", { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  let pixels;
  try {
    pixels = g.getImageData(0, 0, w, h).data;
  } catch {
    return null; // image from another origin: leave it as it is
  }
  let left = w, right = -1, top = h, bottom = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (pixels[(y * w + x) * 4 + 3] > 16) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  const box = right < 0 ? null : { left, right: right + 1, top, bottom: bottom + 1, width: w, height: h };
  boxes.set(img.src, box);
  return box;
}

// hover: true for floating Pokémon (see hovers()). Every other sprite stands with its
// lowest pixel on the frame's bottom edge (= the baseline set in CSS).
// Back sprites (your own Pokémon) never hover: they always stand on the line.
// Gen 5 back sprites (static or animated) are drawn bigger and sink behind the textbox (see settings).
// Sizes: sprites keep their real pixel size (Gen 4: 80, Gen 5: 96, animated: varies), 1 px = 1 px of the 256 px screen.
export function alignSprite(img, { hover = false } = {}) {
  if (img.classList.contains("player")) hover = false;
  const apply = () => {
    const box = measure(img);
    if (!box) return;
    const src = img.getAttribute("src") ?? "";
    const gen5Back = img.classList.contains("player") && src.includes("/gen5") && src.includes("/back");
    // Player characters: small old sprites (Gen 1–3) are enlarged and the big Gen 5 ones shrunk, so everyone is about as tall
    const character = img.classList.contains("player-trainer");
    const visible = box.bottom - box.top;
    const k = gen5Back ? settings.backScale
      : character ? Math.min(1.5, Math.max(0.5, CHARACTER_HEIGHT / visible)) : 1;
    const w = box.width * k;
    const h = box.height * k;
    img.style.width = w === BASE_SIZE ? "" : `${(w / 256 * 100).toFixed(3)}%`;
    img.style.aspectRatio = box.width === box.height ? "" : `${box.width} / ${box.height}`;
    // Everything below is in sprite px: image top-left sits on the frame's top-left corner
    let dx = BASE_SIZE / 2 - ((box.left + box.right) / 2) * k;
    let dy = BASE_SIZE - box.bottom * k;
    if (gen5Back) dy += settings.backSink * (box.bottom - box.top) * k;
    if (hover) dy -= BASE_SIZE * HOVER_PERCENT / 100;
    const nudge = offsets[spriteKey(img)];
    if (nudge) { dx += (nudge.x ?? 0) / 100 * BASE_SIZE; dy += (nudge.y ?? 0) / 100 * BASE_SIZE; }
    img.style.translate = `${(dx / w * 100).toFixed(2)}% ${(dy / h * 100).toFixed(2)}%`;
  };
  img.style.translate = "";
  img.style.width = "";
  if (img.complete && img.naturalWidth) apply();
  else img.addEventListener("load", apply, { once: true });
}

// Pokémon whose Gen 4 sprite shows them floating or flying (without Levitate).
// Flying types that are drawn standing (Pidgey, Charizard…) stay on the ground.
const FLOATERS = new Set(`
  zubat golbat crobat butterfree beautifly dustox venomoth masquerain ninjask volbeat illumise
  yanma yanmega mothim combee vespiquen magnemite magneton magnezone shuppet banette
  drifloon drifblim beldum metang froslass dusknoir mew celebi jirachi togekiss
  porygon-z mantyke hoppip skiploom jumpluff togetic
`.trim().split(/\s+/));

// Should this species hover above the platform?
export function hovers(species) {
  return FLOATERS.has(species.key)
    || species.abilities.normal.includes("levitate")
    || species.abilities.hidden === "levitate";
}
