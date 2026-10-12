// =====================================================
// DOWNLOAD ITEM SPRITES
// Usage: node tools/fetch-item-sprites.mjs
// Saves every item in js/game/item-catalog.js to images/items/<id>.png
// =====================================================

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ITEMS } from "../js/game/item-catalog.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "images", "items");
const BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";

// Extra sprites used as icons (bag pocket tabs, details tabs, TM discs per type)
const TYPES = ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground",
  "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel"];
const ICONS = Object.fromEntries([
  ...["protein", "everstone", "poke-ball", "hp-up", "rare-candy", "exp-share"].map((id) => [id, {}]),
  ...TYPES.map((t) => [`tm-${t}`, {}]),
]);

await fs.mkdir(OUT, { recursive: true });
const missing = [];
for (const [id, item] of Object.entries({ ...ITEMS, ...ICONS })) {
  const file = path.join(OUT, `${id}.png`);
  try { await fs.access(file); continue; } catch { /* not downloaded yet */ }
  let ok = false;
  for (const name of [item.sprite, id].filter(Boolean)) {
    const res = await fetch(`${BASE}/${name}.png`);
    if (res.ok) {
      await fs.writeFile(file, Buffer.from(await res.arrayBuffer()));
      ok = true;
      break;
    }
  }
  if (!ok) missing.push(id);
}
console.log(`Items: ${Object.keys(ITEMS).length}, missing sprites: ${missing.length ? missing.join(", ") : "none"}`);
