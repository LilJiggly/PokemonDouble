// =====================================================
// DOWNLOAD BLACK 2 / WHITE 2 TRAINER SPRITES
// Usage: node tools/fetch-b2w2-trainer-sprites.mjs
// Source: Bulbagarden Archives (https://archives.bulbagarden.net, category
// "Generation V Trainer sprites"). The category page itself blocks scripts, so the
// file list comes from sprites.html (the saved gallery page in the project folder).
// Only the trainers that are in this game are downloaded, as
// images/trainers/variants/<id>-b2w2.png. Existing files are skipped.
// =====================================================

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "images", "trainers", "variants");

// our id → name in the Bulbagarden file name (Spr_B2W2_<name>.png), when it differs from the display name
const NAMES = { "lt-surge": "Lt_Surge", "crasher-wake": "Crasher_Wake", "tate-and-liza": null };

const html = await fs.readFile(path.join(ROOT, "sprites.html"), "utf8");
const files = new Map(); // lowercase name → { url, name }
for (const m of html.matchAll(/src="(https:\/\/archives\.bulbagarden\.net\/media\/upload\/[^"]*?\/(Spr_B2W2_[^/"]+\.png))"/g)) {
  files.set(m[2].slice("Spr_B2W2_".length, -4).toLowerCase(), { url: m[1], name: m[2] });
}

const trainers = [];
for (const g of [1, 2, 3, 4, 5]) {
  const file = JSON.parse(await fs.readFile(path.join(ROOT, "data", "leaders", `gen${g}.json`), "utf8"));
  for (const o of file.opponents) {
    if (o.id === "rival") trainers.push(...o.options.map((r) => ({ id: r.id, name: r.name })));
    else if (o.id === "tate-and-liza") trainers.push({ id: "tate", name: "Tate" }, { id: "liza", name: "Liza" });
    else trainers.push({ id: o.id, name: o.name });
  }
}

await fs.mkdir(OUT, { recursive: true });
const missing = [];
let count = 0, bytes = 0;
for (const t of new Map(trainers.map((t) => [t.id, t])).values()) {
  const key = (NAMES[t.id] ?? t.name.replace(/[. ]+/g, "_").replace(/_$/, "")).toLowerCase();
  const hit = files.get(key);
  if (!hit) { missing.push(t.id); continue; }
  const dest = path.join(OUT, `${t.id}-b2w2.png`);
  try { await fs.access(dest); continue; } catch { /* not downloaded yet */ }
  const res = await fetch(hit.url);
  if (!res.ok) { missing.push(`${t.id} (${res.status})`); continue; }
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buf);
  bytes += buf.length;
  count++;
}
console.log(`${count} new sprites (${Math.round(bytes / 1024)} KB). No Black 2 / White 2 sprite for: ${missing.join(", ") || "none"}`);
