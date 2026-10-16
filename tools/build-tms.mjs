// =====================================================
// BUILD THE TM LIST
// Usage: node tools/build-tms.mjs  (after build-data.mjs)
// Writes data/tms.json: TM01–TM92 from Platinum, then the moves that
// Black/White added as TMs, numbered TM93 onward (in Black/White order).
// HMs are left out.
// =====================================================

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = path.join(ROOT, "tools", ".cache");
const API = "https://pokeapi.co/api/v2";

async function getJson(url) {
  const key = url.replace(API + "/", "").replace(/\/$/, "").replace(/[/?=&]/g, "_");
  const file = path.join(CACHE_DIR, key + ".json");
  try { return JSON.parse(await fs.readFile(file, "utf8")); } catch { /* not cached */ }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const json = await res.json();
  await fs.writeFile(file, JSON.stringify(json));
  return json;
}

const moves = JSON.parse(await fs.readFile(path.join(ROOT, "data", "moves.json"), "utf8"));
const tms = [];
for (const id of Object.keys(moves)) {
  const raw = await getJson(`${API}/move/${id}`);
  const entry = raw.machines?.find((m) => m.version_group.name === "platinum");
  if (!entry) continue;
  const machine = await getJson(entry.machine.url);
  const name = machine.item.name; // "tm26" or "hm04"
  if (!name.startsWith("tm")) continue;
  tms.push({ tm: name.toUpperCase(), number: Number(name.slice(2)), move: id });
}
tms.sort((a, b) => a.number - b.number);

// Gen 5 TMs: moves that are a TM in Black/White but not in Platinum's list
const have = new Set(tms.map((t) => t.move));
const extra = [];
for (const id of Object.keys(moves)) {
  if (have.has(id)) continue;
  const raw = await getJson(`${API}/move/${id}`);
  const entry = raw.machines?.find((m) => m.version_group.name === "black-white");
  if (!entry) continue;
  const machine = await getJson(entry.machine.url);
  const name = machine.item.name;
  if (!name.startsWith("tm")) continue;
  extra.push({ id, bw: Number(name.slice(2)) });
}
extra.sort((a, b) => a.bw - b.bw);
let next = Math.max(...tms.map((t) => t.number)) + 1;
for (const e of extra) tms.push({ tm: `TM${next}`, number: next++, move: e.id, blackWhite: `TM${String(e.bw).padStart(2, "0")}` });
await fs.writeFile(path.join(ROOT, "data", "tms.json"), JSON.stringify(tms, null, 1) + "\n");
console.log(`${tms.length} TMs written to data/tms.json`);
