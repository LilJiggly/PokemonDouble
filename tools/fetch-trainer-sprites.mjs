// =====================================================
// DOWNLOAD TRAINER SPRITES
// Usage: node tools/fetch-trainer-sprites.mjs
// Source: Pokémon Showdown (https://play.pokemonshowdown.com/sprites/trainers/)
// Saved as images/trainers/<our id>.png
// =====================================================

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "images", "trainers");
const BASE = "https://play.pokemonshowdown.com/sprites/trainers";

// our id → Showdown file name (when they differ)
const NAMES = {
  "lt-surge": "ltsurge", lorelei: "lorelei-gen3", agatha: "agatha-gen3", phoebe: "phoebe-gen3",
  drake: "drake-gen3", "crasher-wake": "crasherwake", gold: "ethan", tate: "tate", liza: "liza",
};

const leaders = [];
for (const g of [1, 2, 3, 4]) {
  const file = JSON.parse(await fs.readFile(path.join(ROOT, "data", "leaders", `gen${g}.json`), "utf8"));
  for (const o of file.opponents) {
    if (o.id === "rival") leaders.push(...o.options.map((r) => r.id));
    else if (o.id === "tate-and-liza") leaders.push("tate", "liza");
    else leaders.push(o.id);
  }
}
// Player characters (for the player side)
leaders.push("lucas", "dawn", "red", "leaf-gen3");

await fs.mkdir(OUT, { recursive: true });
const ids = [...new Set(leaders)];
const missing = [];
let bytes = 0;
for (const id of ids) {
  const file = path.join(OUT, `${id.replace("-gen3", "")}.png`);
  try { await fs.access(file); continue; } catch { /* not downloaded yet */ }
  const res = await fetch(`${BASE}/${NAMES[id] ?? id}.png`);
  if (!res.ok) { missing.push(id); continue; }
  const buf = Buffer.from(await res.arrayBuffer());
  bytes += buf.length;
  await fs.writeFile(file, buf);
}
console.log(`${ids.length - missing.length} trainer sprites (${Math.round(bytes / 1024)} KB new), missing: ${missing.join(", ") || "none"}`);
