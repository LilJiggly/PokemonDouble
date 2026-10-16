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
// Gens 1–4 trainers use Pokémon up to Gen 4 (as in DESIGN.md); Unova trainers use everything up to Gen 5
const list = (Array.isArray(pokemon) ? pokemon : Object.values(pokemon)).filter((p) => p.gen <= (gen === 5 ? 5 : 4));
const byName = Object.fromEntries(list.map((p) => [p.name.toLowerCase(), p]));
const byKey = Object.fromEntries(list.map((p) => [p.key, p]));

// Lowest BST of power groups 1–5 (keep in sync with the cutoff table in DESIGN.md)
const CUTOFFS = [0, 350, 430, 490, 535];
// Group 0: dead weight in battle (no real moves or one-trick). Listed, but no battle uses it.
const DEAD_WEIGHT = new Set(["magikarp", "feebas", "caterpie", "metapod", "weedle", "kakuna", "wurmple",
  "silcoon", "cascoon", "kricketot", "burmy", "unown", "shedinja"]);
const groupOf = (p) => DEAD_WEIGHT.has(p.key) ? 0 : CUTOFFS.findLastIndex((min) => p.bst >= min) + 1;

// Trainers without a type: signature species (their earlier stages are added). Keys: "<gen>:<id>"
const SIGNATURE = {
  "1:blue": "Pidgeot, Alakazam, Rhyperior, Exeggutor, Gyarados, Arcanine, Machamp, Charizard, Blastoise, Venusaur, Tyranitar, Heracross, Aerodactyl, Jolteon",
  "1:rival-red": "Raichu, Espeon, Snorlax, Venusaur, Charizard, Blastoise, Lapras, Aerodactyl, Gengar, Dragonite",
  "1:rival-green": "Clefable, Starmie, Ninetales, Victreebel, Nidoqueen, Vaporeon, Wigglytuff, Venusaur, Charizard, Blastoise, Kangaskhan, Gardevoir",
  "2:rival-silver": "Crobat, Honchkrow, Weavile, Magnezone, Alakazam, Gengar, Weezing, Kingdra, Feraligatr, Meganium, Typhlosion, Houndoom",
  "2:rival-gold": "Typhlosion, Feraligatr, Meganium, Ampharos, Espeon, Umbreon, Snorlax, Togekiss, Sudowoodo, Lapras, Raichu, Tauros, Dragonite, Gengar, Scizor",
  "3:rival-brendan": "Swampert, Sceptile, Blaziken, Slaking, Aggron, Manectric, Gardevoir, Flygon, Crobat, Pelipper, Ludicolo, Linoone, Alakazam, Walrein, Salamence",
  "3:rival-may": "Blaziken, Sceptile, Swampert, Gardevoir, Altaria, Absol, Lanturn, Camerupt, Roserade, Flygon, Delcatty, Swellow, Milotic, Walrein, Salamence",
  "4:cynthia": "Spiritomb, Roserade, Togekiss, Lucario, Milotic, Garchomp, Gastrodon, Gallade, Weavile, Dragonite, Gengar, Leafeon",
  "4:rival-barry": "Staraptor, Infernape, Empoleon, Torterra, Heracross, Alakazam, Snorlax, Floatzel, Rapidash, Roserade, Garchomp, Ambipom",
  "4:rival-dawn": "Staraptor, Empoleon, Infernape, Torterra, Togekiss, Gardevoir, Lucario, Ambipom, Vaporeon, Houndoom, Roserade, Lopunny",
  "5:rival-hugh": "Emboar, Serperior, Samurott, Zoroark, Haxorus, Chandelure, Hydreigon, Conkeldurr, Excadrill, Garchomp, Lucario, Staraptor",
  "5:rival-bianca": "Serperior, Emboar, Samurott, Musharna, Lilligant, Zebstrika, Mandibuzz, Gardevoir, Reuniclus, Togekiss, Roserade, Flareon",
  "5:rival-cheren": "Stoutland, Unfezant, Bisharp, Serperior, Emboar, Samurott, Zebstrika, Mandibuzz, Slaking, Jolteon, Ambipom, Garchomp",
  "4:rival-lucas": "Staraptor, Torterra, Infernape, Empoleon, Gallade, Garchomp, Heracross, Luxray, Floatzel, Ambipom, Roserade, Magnezone",
};
SIGNATURE["1:rival-blue"] = SIGNATURE["1:blue"];

// Filler: species outside the trainer's type (their earlier stages are added).
// Mostly the trainer's picks from the original games, to thicken thin pools. Keys: "<gen>:<id>"
const FILLER = {
  "1:brock": "Steelix",
  "1:lt-surge": "Porygon-Z, Skarmory, Bronzong",
  "1:erika": "Butterfree, Beautifly",
  "1:koga": "Forretress, Ninjask",
  "1:sabrina": "Venomoth",
  "1:giovanni": "Persian, Kangaskhan",
  "1:lorelei": "Slowbro, Slowking",
  "1:bruno": "Steelix",
  "1:agatha": "Arbok, Crobat",
  "1:lance": "Gyarados, Charizard, Aerodactyl",

  "2:falkner": "Delibird, Skarmory",
  "2:bugsy": "Kabutops",
  "2:whitney": "Blissey",
  "2:morty": "Arbok, Crobat",
  "2:chuck": "Hariyama",
  "2:jasmine": "Skarmory, Forretress",
  "2:pryce": "Slowbro, Slowking",
  "2:clair": "Gyarados, Charizard, Aerodactyl",
  "2:will": "Slowbro, Slowking, Bronzong",
  "2:koga": "Forretress, Ninjask",
  "2:bruno": "Steelix, Onix",
  "2:karen": "Vileplume, Cacturne",
  "2:lance": "Gyarados, Charizard, Aerodactyl",

  "3:wattson": "Porygon-Z, Skarmory, Bronzong",
  "3:flannery": "Castform",
  "3:norman": "Chansey",
  "3:winona": "Skarmory, Dragonite",
  "3:tate-and-liza": "Venomoth, Bronzong",
  "3:juan": "Slowbro, Slowking",
  "3:sidney": "Shiftry, Cacturne",
  "3:phoebe": "Arbok, Crobat",
  "3:glacia": "Slowbro, Slowking",
  "3:drake": "Gyarados, Charizard, Aerodactyl",

  "4:fantina": "Arbok, Crobat",
  "4:maylene": "Hariyama, Lucario",
  "4:byron": "Skarmory, Forretress",
  "4:candice": "Medicham, Slowbro",
  "4:volkner": "Porygon-Z, Octillery",
  "4:aaron": "Vileplume, Cacturne",
  "4:bertha": "Steelix, Quagsire",
  "4:flint": "Camerupt",
  "4:lucian": "Venomoth, Bronzong",

  "5:roxie": "Crobat",
  "5:elesa": "Raichu",
  "5:drayden": "Gyarados, Charizard, Aerodactyl",
  "5:shauntal": "Arbok, Crobat",
  "5:marshal": "Onix, Steelix",
  "5:grimsley": "Chandelure, Vileplume",
  "5:iris": "Gyarados, Charizard, Aerodactyl",
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
    filler = [...new Set([...withEarlierStages(FILLER[`${gen}:${t.id}`] ?? ""), ...withEarlierStages(pool.map((p) => p.name).join(","))])]
      .filter((p) => !inPool.has(p) && p.key !== "eevee"); // Eevee: branched Normal line, not a real pre-evo
  } else {
    pool = withEarlierStages(SIGNATURE[`${gen}:${t.id}`] ?? "");
    filler = [];
  }
  const label = t.theme ? TYPE_NAMES[t.theme] ?? cap(t.theme) : "signature lines";
  md += `#### ${t.name} · ${label} (\`gen${gen}:${t.id}\`)\n\n| Group | Species | Filler |\n|---|---|---|\n`;
  for (let g = 0; g <= CUTOFFS.length; g++) md += `| ${g} | ${names(pool, g)} | ${names(filler, g)} |\n`;
  md += "\n";
}
process.stdout.write(md);
