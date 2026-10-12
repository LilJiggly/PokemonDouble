// =====================================================
// BUILD TEAM POOLS
// -----------------------------------------------------
// Prints the §5 "Team pools" markdown for one Challenge
// Gen: every non-baby species of each
// trainer's type (Gen 1–4, Gen 4 typing), split into
// power groups by base stat total. Trainers without a
// type use their signature lines (all stages).
// Filler (other types) goes in its own column.
//
// Paste the output into DESIGN.md, then edit it by hand.
// Usage: node tools/build-pools.mjs [gen]
// =====================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gen = Number(process.argv[2] ?? 1);
const pokemon = JSON.parse(fs.readFileSync(path.join(ROOT, "data/pokemon.json"), "utf8"));
const leaders = JSON.parse(fs.readFileSync(path.join(ROOT, `data/leaders/gen${gen}.json`), "utf8"));
const list = Array.isArray(pokemon) ? pokemon : Object.values(pokemon);
const byName = Object.fromEntries(list.map((p) => [p.name.toLowerCase(), p]));
const byKey = Object.fromEntries(list.map((p) => [p.key, p]));

// Lowest BST of power groups 1–5 (keep in sync with the cutoff table in DESIGN.md)
const CUTOFFS = [0, 350, 430, 490, 535];
// Group 0: dead weight in battle (no real moves or one-trick). Listed, but no battle uses it.
const DEAD_WEIGHT = new Set(["magikarp", "feebas", "caterpie", "metapod", "weedle", "kakuna", "wurmple",
  "silcoon", "cascoon", "kricketot", "burmy", "unown", "shedinja"]);
const groupOf = (p) => DEAD_WEIGHT.has(p.key) ? 0 : CUTOFFS.findLastIndex((min) => p.bst >= min) + 1;

// Trainers without a type: signature species (their earlier stages are added)
const SIGNATURE = {
  blue: "Pidgeot, Alakazam, Rhyperior, Exeggutor, Gyarados, Arcanine, Machamp, Charizard, Blastoise, Venusaur, Tyranitar, Heracross, Aerodactyl, Jolteon",
  "rival-red": "Raichu, Espeon, Snorlax, Venusaur, Charizard, Blastoise, Lapras, Aerodactyl, Gengar, Dragonite",
  "rival-green": "Clefable, Starmie, Ninetales, Victreebel, Nidoqueen, Vaporeon, Wigglytuff, Venusaur, Charizard, Blastoise, Kangaskhan, Gardevoir",
};
SIGNATURE["rival-blue"] = SIGNATURE.blue;

// Filler: species outside the trainer's type (their earlier stages are added).
// Mostly the trainer's picks from the original games. Shown in their own column.
const FILLER = {
  brock: "Steelix",
  "lt-surge": "Porygon-Z, Skarmory, Bronzong",
  erika: "Butterfree, Beautifly",
  koga: "Forretress, Ninjask",
  sabrina: "Venomoth",
  giovanni: "Persian, Kangaskhan",
  lorelei: "Slowbro, Slowking",
  bruno: "Steelix",
  agatha: "Arbok, Crobat",
  lance: "Gyarados, Charizard, Aerodactyl",
};

// Legendaries and Mythicals are allowed (level gating keeps them late); babies are not
const usable = (p) => !p.isBaby;

// Species plus their earlier stages
function withEarlierStages(names) {
  const out = new Set();
  for (const name of names.split(",").map((n) => n.trim().toLowerCase()).filter(Boolean)) {
    if (!byName[name]) throw new Error(`Unknown species: ${name}`);
    for (let p = byName[name]; p; p = byKey[p.evolvesFrom]) if (usable(p)) out.add(p);
  }
  return [...out];
}

const TYPE_NAMES = { ice: "Ice" };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const trainers = [];
for (const o of leaders.opponents) {
  if (o.id === "rival") for (const r of o.options) trainers.push({ id: `rival-${r.id}`, name: `${r.name} (Final Rival)`, theme: null });
  else trainers.push({ id: o.id, name: `${o.title} ${o.name}`, theme: o.theme });
}

const names = (mons, g) => mons.filter((p) => groupOf(p) === g).sort((a, b) => a.bst - b.bst || a.id - b.id).map((p) => p.name).join(", ") || "—";

let md = "";
for (const t of trainers) {
  let pool, filler;
  if (t.theme) {
    pool = list.filter((p) => usable(p) && p.types.includes(t.theme));
    // Filler = hand picks + earlier stages of type species that aren't the type themselves (Shellder → Cloyster)
    const inPool = new Set(pool);
    filler = [...new Set([...withEarlierStages(FILLER[t.id] ?? ""), ...withEarlierStages(pool.map((p) => p.name).join(","))])]
      .filter((p) => !inPool.has(p) && p.key !== "eevee"); // Eevee: branched Normal line, not a real pre-evo
  } else {
    pool = withEarlierStages(SIGNATURE[t.id] ?? "");
    filler = [];
  }
  const label = t.theme ? TYPE_NAMES[t.theme] ?? cap(t.theme) : "signature lines";
  md += `#### ${t.name} · ${label} (\`gen${gen}:${t.id}\`)\n\n| Group | Species | Filler |\n|---|---|---|\n`;
  for (let g = 0; g <= CUTOFFS.length; g++) md += `| ${g} | ${names(pool, g)} | ${names(filler, g)} |\n`;
  md += "\n";
}
process.stdout.write(md);
