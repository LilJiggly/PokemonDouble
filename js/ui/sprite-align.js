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

const boxes = new Map(); // src → { left, right, top, bottom, width, height }
const HOVER_PERCENT = 5;

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
export function alignSprite(img, { hover = false } = {}) {
  if (img.classList.contains("player")) hover = false;
  const apply = () => {
    const box = measure(img);
    if (!box) return;
    const dx = ((box.width / 2 - (box.left + box.right) / 2) / box.width) * 100;
    let dy = ((box.height - box.bottom) / box.height) * 100;
    if (hover) dy -= HOVER_PERCENT;
    img.style.translate = `${dx.toFixed(2)}% ${dy.toFixed(2)}%`;
  };
  img.style.translate = "";
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
