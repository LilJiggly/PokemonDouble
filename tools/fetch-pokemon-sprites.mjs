// =====================================================
// DOWNLOAD GEN 5 POKÉMON SPRITES (static + animated)
// Usage: node tools/fetch-pokemon-sprites.mjs
// Source: PokeAPI sprites repo, Black/White art (https://github.com/PokeAPI/sprites)
// Static   → images/sprites/gen5/<front|back|front-shiny|back-shiny>/<id>.png        (#1–649)
// Animated → images/sprites/gen5-ani/<front|back|front-shiny|back-shiny>/<id>.gif    (#1–649)
// Also Castform's Sunny / Rainy / Snowy forms (gen4, gen5, gen5-ani) as 351-<form>.
// Files that already exist are skipped, so it can be re-run.
// (Gen 4 sprites and the Gen 5 Pokémon's static sprites come from tools/build-data.mjs.)
// =====================================================

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white";
const LAST = 649;
const KINDS = { front: "", back: "back/", "front-shiny": "shiny/", "back-shiny": "back/shiny/" };

const jobs = [];
for (let id = 1; id <= LAST; id++) {
  for (const [kind, sub] of Object.entries(KINDS)) {
    jobs.push({ url: `${BASE}/${sub}${id}.png`, file: path.join(ROOT, "images/sprites/gen5", kind, `${id}.png`) });
    jobs.push({ url: `${BASE}/animated/${sub}${id}.gif`, file: path.join(ROOT, "images/sprites/gen5-ani", kind, `${id}.gif`) });
  }
}

// Castform's weather forms (Forecast): PokeAPI form ids 10013–10015, saved as <dex number>-<form>
const FORMS = [{ id: 10013, dex: 351, name: "sunny" }, { id: 10014, dex: 351, name: "rainy" }, { id: 10015, dex: 351, name: "snowy" }];
const GEN4 = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/platinum";
for (const f of FORMS) {
  for (const [kind, sub] of Object.entries(KINDS)) {
    jobs.push({ url: `${BASE}/${sub}${f.id}.png`, file: path.join(ROOT, "images/sprites/gen5", kind, `${f.dex}-${f.name}.png`) });
    jobs.push({ url: `${BASE}/animated/${sub}${f.id}.gif`, file: path.join(ROOT, "images/sprites/gen5-ani", kind, `${f.dex}-${f.name}.gif`) });
    jobs.push({ url: `${GEN4}/${sub}${f.id}.png`, file: path.join(ROOT, "images/sprites/gen4", kind, `${f.dex}-${f.name}.png`) });
  }
}

const exists = (f) => fs.access(f).then(() => true, () => false);
let done = 0, bytes = 0;
const failed = [];
async function run(job) {
  if (await exists(job.file)) return;
  await fs.mkdir(path.dirname(job.file), { recursive: true });
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(job.url);
      if (res.status === 404) { failed.push(job.url); return; }
      if (!res.ok) throw new Error(String(res.status));
      const buf = Buffer.from(await res.arrayBuffer());
      await fs.writeFile(job.file, buf);
      bytes += buf.length;
      return;
    } catch { await new Promise((r) => setTimeout(r, 500 * (attempt + 1))); }
  }
  failed.push(job.url);
}
const queue = [...jobs];
await Promise.all(Array.from({ length: 8 }, async () => {
  while (queue.length) {
    await run(queue.shift());
    if (++done % 250 === 0) console.log(`${done}/${jobs.length} (${(bytes / 1e6).toFixed(1)} MB)`);
  }
}));
console.log(`Done. ${(bytes / 1e6).toFixed(1)} MB new, ${failed.length} missing`);
if (failed.length) await fs.writeFile(path.join(ROOT, "tools", ".sprite-missing.txt"), failed.join("\n") + "\n");
