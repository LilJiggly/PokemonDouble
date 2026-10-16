// =====================================================
// TRAINER SPRITE MANIFEST
// -----------------------------------------------------
// Reads Pokémon Showdown's sprite folder listing (text only, no
// images) and writes data/trainer-sprites.json: for each of our
// trainers, every sprite version that exists there ("avail") and
// the ones already saved in images/trainers/variants ("have").
// The Trainer Gallery shows what's in "have".
// Usage: node tools/build-trainer-manifest.mjs
// =====================================================

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LISTING = "https://play.pokemonshowdown.com/sprites/trainers/";
// our id → Showdown name, when they differ
const NAMES = { "lt-surge": "ltsurge", "crasher-wake": "crasherwake", gold: "ethan" };

const ids = new Set();
for (const g of [1, 2, 3, 4]) {
  const file = JSON.parse(await fs.readFile(path.join(ROOT, "data", "leaders", `gen${g}.json`), "utf8"));
  for (const o of file.opponents) {
    if (o.id === "rival") o.options.forEach((r) => ids.add(r.id));
    else if (o.id === "tate-and-liza") { ids.add("tate"); ids.add("liza"); }
    else ids.add(o.id);
  }
}
for (const c of ["red", "leaf", "ethan", "lyra", "brendan", "may", "lucas", "dawn"]) ids.add(c);

const html = await (await fetch(LISTING)).text();
const listed = [...html.matchAll(/href="([^"]+)\.png"/g)].map((m) => m[1]);

let have = [];
try { have = (await fs.readdir(path.join(ROOT, "images", "trainers", "variants"))).filter((f) => f.endsWith(".png")).map((f) => f.slice(0, -4)); } catch { /* none yet */ }

const manifest = {};
for (const id of [...ids].sort()) {
  const base = NAMES[id] ?? id;
  const avail = listed.filter((n) => n === base || n.startsWith(`${base}-`) || new RegExp(`^${base}\\d`).test(n));
  manifest[id] = { showdown: base, avail, have: avail.filter((n) => have.includes(n)) };
}
await fs.writeFile(path.join(ROOT, "data", "trainer-sprites.json"), JSON.stringify(manifest, null, 1));
console.log(`${Object.keys(manifest).length} trainers, ${Object.values(manifest).reduce((a, m) => a + m.avail.length, 0)} sprite versions listed, ${have.length} saved`);
