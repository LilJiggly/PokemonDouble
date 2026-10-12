// =====================================================
// CHECK LEADER TEAM SETS
// -----------------------------------------------------
// Usage: node tools/check-sets.mjs
//
// ERRORS  = things the game can't load (typos, unknown
//           names, wrong team size, too many moves).
// NOTES   = "off-book" choices. Allowed on purpose,
//           just listed so you know.
// =====================================================

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NATURES } from "../js/engine/constants.js";
import { readProgression } from "./lib/design.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = path.join(ROOT, "tools", ".cache");
const readJson = async (p) => JSON.parse(await fs.readFile(path.join(ROOT, p), "utf8"));

// All item names from PokeAPI (cached after the first run)
async function itemNames() {
  const file = path.join(CACHE_DIR, "item-list.json");
  try {
    return new Set(JSON.parse(await fs.readFile(file, "utf8")));
  } catch {
    const res = await fetch("https://pokeapi.co/api/v2/item?limit=3000");
    const names = (await res.json()).results.map((r) => r.name);
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(file, JSON.stringify(names));
    return new Set(names);
  }
}

const pokemon = await readJson("data/pokemon.json");
const moves = await readJson("data/moves.json");
const abilities = await readJson("data/abilities.json");
const items = await itemNames();
const progression = await readProgression();
const byKey = Object.fromEntries(pokemon.map((p) => [p.key, p]));

const leaderFiles = (await fs.readdir(path.join(ROOT, "data", "leaders"))).filter((f) => f.endsWith(".json"));
let errorCount = 0;
let noteCount = 0;

for (const file of leaderFiles) {
  const gen = await readJson(`data/leaders/${file}`);
  for (const opp of gen.opponents) {
    const row = progression.find((r) => r.order === opp.order);
    console.log(`\n${file} · #${opp.order} ${opp.name} (Lv ${row?.level ?? "?"}, team of ${row?.teamSize ?? "?"})`);

    for (const set of opp.sets) {
      const errors = [];
      const notes = [];

      if (row && set.team.length !== row.teamSize) {
        errors.push(`team has ${set.team.length} Pokémon, §3a says ${row.teamSize}`);
      }
      const species = set.team.map((m) => m.species);
      if (new Set(species).size !== species.length) errors.push("duplicate species");

      for (const mon of set.team) {
        const p = byKey[mon.species];
        if (!p) { errors.push(`unknown species "${mon.species}"`); continue; }
        const label = p.name;

        if (!(mon.nature in NATURES)) errors.push(`${label}: unknown nature "${mon.nature}"`);
        if (mon.item && !items.has(mon.item)) errors.push(`${label}: unknown item "${mon.item}"`);

        if (!abilities[mon.ability]) {
          errors.push(`${label}: unknown ability "${mon.ability}"`);
        } else if (!p.abilities.normal.includes(mon.ability) && p.abilities.hidden !== mon.ability) {
          notes.push(`${label} can't normally have ${abilities[mon.ability].name}`);
        }

        if (!mon.moves?.length || mon.moves.length > 4) errors.push(`${label}: needs 1–4 moves`);
        const learnable = new Set([
          ...p.learnset.levelUp.map(([, m]) => m),
          ...p.learnset.machine, ...p.learnset.tutor, ...p.learnset.egg,
        ]);
        for (const m of mon.moves ?? []) {
          if (!moves[m]) errors.push(`${label}: unknown move "${m}"`);
          else if (!learnable.has(m)) notes.push(`${label} can't normally learn ${moves[m].name}`);
        }
      }

      for (const step of set.script ?? []) {
        if (!species.includes(step.species)) errors.push(`script: "${step.species}" isn't in this set`);
        const mon = set.team.find((m) => m.species === step.species);
        if (mon && !mon.moves.includes(step.move)) errors.push(`script: ${step.species} doesn't have "${step.move}"`);
      }

      const status = errors.length ? "✗" : "✓";
      console.log(`  ${status} ${set.name}`);
      errors.forEach((e) => console.log(`      ERROR: ${e}`));
      notes.forEach((n) => console.log(`      note:  ${n}`));
      errorCount += errors.length;
      noteCount += notes.length;
    }
  }
}

console.log(`\n${errorCount} error(s), ${noteCount} off-book note(s).`);
process.exit(errorCount ? 1 : 0);
