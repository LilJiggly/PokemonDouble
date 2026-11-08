// =====================================================
// EVIL TEAM PATHS: writes data/leaders/evil1.json … evil5.json
// Usage: node tools/build-evil-leaders.mjs
// -----------------------------------------------------
// One path per generation, 14 battles like the normal game (so levels, rarities and rewards stay as they are):
//   1–8 grunts and commanders, 9–12 the team's elite, 13 the boss, 14 the final boss.
// Battles 1–12 get a random team from the team's own Pokémon (`pool`) and the character's `signature` Pokémon (see personalTeam in run.js).
// The boss and final boss (13, 14) bring their `anchor` Pokémon (always), some of their `signature` Pokémon and the rest from their `pool`.
// Edit the ROSTERS and run the script again to change a path.
// =====================================================

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareData } from "../js/engine/data.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (p) => JSON.parse(await fs.readFile(path.join(ROOT, p), "utf8"));
const data = prepareData({ pokemon: await readJson("data/pokemon.json"), moves: await readJson("data/moves.json"), abilities: await readJson("data/abilities.json") });

// [sprite id, title, name, theme] for battles 1 to 12. The game shows "title name", e.g. "Team Aqua Admin Matt".
const G = (id, theme, team = "Team Rocket", name = "Grunt") => [id, team, name, theme];
const ROSTERS = {
  1: { region: "Kanto · Team Rocket", rows: [
    G("rocketgrunt", "normal"), G("rocketgruntf", "poison"), G("rocketgrunt", "ground"), G("rocketgruntf", "fighting"),
    G("scientist", "electric", "Team Rocket", "Scientist"), G("rocketgrunt", "psychic"), G("scientist", "poison", "Team Rocket", "Scientist"), G("rocketgruntf", "rock"),
    G("petrel", "poison", "Team Rocket Executive", "Petrel"), G("proton", "poison", "Team Rocket Executive", "Proton"),
    G("ariana", "dark", "Team Rocket Executive", "Ariana"), G("archer", "dark", "Team Rocket Executive", "Archer"),
  ] },
  2: { region: "Johto · Team Rocket", rows: [
    G("rocketgrunt", "dark"), G("rocketgruntf", "poison"), G("rocketgrunt", "normal"), G("rocketgruntf", "dark"),
    G("rocketgrunt", "flying"), G("rocketgruntf", "poison"), G("petrel", "poison", "Team Rocket Executive", "Petrel"), G("proton", "dark", "Team Rocket Executive", "Proton"),
    G("ariana", "poison", "Team Rocket Executive", "Ariana"), G("rocketgrunt", "dark", "Team Rocket", "Elite Grunt"),
    G("rocketgruntf", "psychic", "Team Rocket", "Elite Grunt"), G("proton", "poison", "Team Rocket Executive", "Proton"),
  ] },
  3: { region: "Hoenn · Team Aqua and Magma", rows: [
    G("aquagrunt", "water", "Team Aqua"), G("magmagrunt", "fire", "Team Magma"), G("aquagruntf", "water", "Team Aqua"), G("magmagruntf", "ground", "Team Magma"),
    G("matt", "water", "Team Aqua Admin", "Matt"), G("tabitha", "fire", "Team Magma Admin", "Tabitha"),
    G("shelly", "water", "Team Aqua Admin", "Shelly"), G("courtney", "fire", "Team Magma Admin", "Courtney"),
    G("aquagrunt", "dark", "Team Aqua", "Elite Grunt"), G("magmagrunt", "rock", "Team Magma", "Elite Grunt"),
    G("maxie", "fire", "Team Magma Leader", "Maxie"), G("archie", "water", "Team Aqua Leader", "Archie"),
  ] },
  4: { region: "Sinnoh · Team Galactic", rows: [
    G("galacticgrunt", "poison", "Team Galactic"), G("galacticgruntf", "dark", "Team Galactic"), G("galacticgrunt", "steel", "Team Galactic"), G("galacticgruntf", "normal", "Team Galactic"),
    G("galacticgrunt", "fighting", "Team Galactic"), G("galacticgruntf", "psychic", "Team Galactic"),
    G("mars", "normal", "Team Galactic Commander", "Mars"), G("jupiter", "poison", "Team Galactic Commander", "Jupiter"), G("saturn", "steel", "Team Galactic Commander", "Saturn"),
    G("galacticgrunt", "psychic", "Team Galactic", "Elite Grunt"), G("galacticgruntf", "dark", "Team Galactic", "Elite Grunt"), G("saturn", "psychic", "Team Galactic Commander", "Saturn"),
  ] },
  5: { region: "Unova · Team Plasma", rows: [
    G("plasmagrunt", "dark", "Team Plasma"), G("plasmagruntf", "normal", "Team Plasma"), G("plasmagrunt", "poison", "Team Plasma"), G("plasmagruntf", "ghost", "Team Plasma"),
    G("plasmagrunt", "psychic", "Team Plasma"), G("plasmagruntf", "fighting", "Team Plasma"),
    G("shadowtriad", "dark", "Team Plasma", "Shadow Triad"), G("colress", "electric", "Team Plasma Scientist", "Colress"),
    G("zinzolin", "ice", "Team Plasma Sage", "Zinzolin"), G("rood", "poison", "Team Plasma Sage", "Rood"),
    G("plasmagrunt", "steel", "Team Plasma", "Elite Grunt"), G("plasmagruntf", "dark", "Team Plasma", "Elite Grunt"),
  ] },
};

// Each team's own Pokémon (any stage: the game uses the strongest stage that is legal at the battle's level), and the signature Pokémon of
// every named character, who bring those first. Grunts use the team pool, preferring the arena type of their battle (the row's theme).
const TEAM_POOLS = {
  // Kanto: Rocket's Pokémon (poison, normal, ground and dark-ish) and what the Game Corner and Silph Co. held
  1: ["rattata", "zubat", "koffing", "grimer", "ekans", "meowth", "machop", "drowzee", "magnemite", "voltorb", "cubone", "onix", "gastly", "tauros", "kangaskhan", "hitmonlee", "porygon", "growlithe", "sandshrew", "mankey", "electabuzz", "abra", "geodude"],
  // Johto: the same gang a few years on, with the Radio Tower and Mahogany Pokémon
  2: ["rattata", "zubat", "koffing", "grimer", "ekans", "meowth", "houndour", "murkrow", "sneasel", "oddish", "magnemite", "voltorb", "growlithe", "onix", "geodude", "scyther", "larvitar", "magikarp", "electabuzz", "drowzee", "sentret", "snubbull"],
  3: { "Team Aqua": ["poochyena", "carvanha", "zubat", "wailmer", "tentacool", "wingull", "corphish", "barboach", "spheal", "clamperl", "luvdisc", "feebas", "lotad", "mudkip", "seviper"],
       "Team Magma": ["poochyena", "numel", "slugma", "zubat", "baltoy", "torkoal", "geodude", "makuhita", "aron", "trapinch", "koffing", "houndour", "nosepass", "sableye", "spoink"] },
  4: ["zubat", "stunky", "glameow", "bronzor", "croagunk", "shellos", "kricketot", "murkrow", "magnemite", "carnivine", "buizel", "machop", "gastly", "skorupi", "sneasel", "houndour", "gligar", "luxio", "onix", "bidoof", "chingling", "riolu"],
  5: ["patrat", "lillipup", "purrloin", "sandile", "scraggy", "trubbish", "throh", "sawk", "venipede", "yamask", "zorua", "timburr", "vanillite", "pawniard", "klink", "minccino", "litwick", "frillish", "munna", "tynamo", "joltik"],
};
const SIGNATURE = {
  petrel: ["koffing", "houndour", "murkrow"], proton: ["koffing", "zubat", "houndour"], ariana: ["arbok", "gloom", "murkrow"], archer: ["houndoom", "arbok", "murkrow"],
  scientist: ["magnemite", "voltorb", "porygon"],
  matt: ["sharpedo", "mightyena", "golbat"], shelly: ["carvanha", "mightyena", "tentacruel"], archie: ["sharpedo", "crobat", "mightyena"],
  tabitha: ["camerupt", "mightyena", "zubat"], courtney: ["numel", "camerupt", "mightyena"], maxie: ["camerupt", "mightyena", "crobat"],
  mars: ["purugly", "skuntank", "golbat"], jupiter: ["skuntank", "purugly", "bronzor"], saturn: ["toxicroak", "bronzong", "golbat"],
  shadowtriad: ["liepard", "zoroark", "scrafty"], colress: ["magneton", "klink", "beheeyem"], zinzolin: ["cryogonal", "vanillish", "beartic"], rood: ["scolipede", "krookodile", "cofagrigus"],
};

// The boss (13) and the final boss (14): [sprite ids], title, name, theme, team (species keys)
const BOSSES = {
  1: [
    { sprites: ["giovanni"], id: "giovanni", title: "Team Rocket Boss", name: "Giovanni", theme: "ground", anchor: [],
      signature: ["persian", "dugtrio", "nidoqueen", "nidoking", "rhydon", "kangaskhan"],
      pool: ["sandslash", "marowak", "golem", "donphan", "steelix", "tauros", "rhyperior", "gengar", "onix", "machamp"] },
    { sprites: ["giovanni"], id: "giovanni", title: "Final Boss", name: "Giovanni", theme: null, anchor: ["mewtwo"],
      signature: ["nidoking", "nidoqueen", "rhyperior", "dugtrio", "persian", "kangaskhan", "rhydon"],
      pool: ["sandslash", "marowak", "golem", "steelix", "tauros", "donphan", "gengar", "machamp", "mamoswine"] },
  ],
  2: [
    { sprites: ["archer"], id: "archer", title: "Team Rocket Boss", name: "Archer", theme: "dark", anchor: [],
      signature: ["houndoom", "crobat", "arbok", "weezing", "honchkrow", "muk"],
      pool: ["weavile", "tyranitar", "gengar", "drapion", "skuntank", "umbreon", "sableye", "bisharp"] },
    { sprites: ["giovanni", "archer"], id: "giovanni", title: "Final Boss", name: "Giovanni and Archer", theme: null, anchor: ["gyarados"],
      signature: ["houndoom", "crobat", "persian", "nidoking", "rhydon", "dugtrio", "weezing"],
      pool: ["nidoqueen", "arbok", "honchkrow", "muk", "tyranitar", "steelix", "kangaskhan", "weavile"] },
  ],
  3: [
    { sprites: ["archie", "maxie"], id: "archie", title: "Team Aqua and Magma", name: "Archie and Maxie", theme: null, anchor: ["kyogre", "groudon"],
      signature: ["sharpedo", "camerupt", "crobat", "mightyena", "tentacruel", "torkoal"],
      pool: ["golbat", "whiscash", "crawdaunt", "magcargo", "wailord", "milotic", "houndoom", "weezing", "claydol"] },
    { sprites: ["zinnia"], id: "zinnia", title: "Final Boss", name: "Zinnia", theme: "dragon", anchor: ["rayquaza"],
      signature: ["salamence", "altaria", "lunatone", "garchomp", "tyranitar", "flygon"],
      pool: ["dragonite", "kingdra", "haxorus", "hydreigon", "aggron", "metagross", "gyarados", "druddigon"] },
  ],
  4: [
    { sprites: ["cyrus"], id: "cyrus", title: "Team Galactic Boss", name: "Cyrus", theme: "dark", anchor: [],
      signature: ["honchkrow", "gyarados", "crobat", "weavile", "houndoom", "toxicroak"],
      pool: ["skuntank", "drapion", "mismagius", "bronzong", "magnezone", "tyranitar", "gengar", "purugly"] },
    { sprites: ["cyrus"], id: "cyrus", title: "Final Boss", name: "Cyrus", theme: null, anchor: ["dialga", "palkia", "giratina"],
      signature: ["weavile", "honchkrow", "crobat", "toxicroak"],
      pool: ["gyarados", "houndoom", "skuntank", "drapion", "bronzong", "magnezone", "mismagius"] },
  ],
  5: [
    { sprites: ["n"], id: "n", title: "King of Team Plasma", name: "N", theme: null, anchor: ["reshiram"],
      signature: ["zoroark", "klinklang", "vanilluxe", "archeops", "carracosta", "swanna"],
      pool: ["haxorus", "sigilyph", "bouffalant", "reuniclus", "braviary", "ferrothorn", "garbodor", "leavanny"] },
    { sprites: ["ghetsis"], id: "ghetsis", title: "Final Boss", name: "Ghetsis", theme: null, anchor: ["kyurem"],
      signature: ["hydreigon", "cofagrigus", "seismitoad", "drapion", "eelektross", "bisharp"],
      pool: ["krookodile", "scolipede", "golurk", "mandibuzz", "garbodor", "amoonguss", "weavile", "toxicroak"] },
  ],
};

// The type tag of a battle gives its rewards (the TM type) and its look, and the team leans into it (half the team, when the pool has the
// Pokémon). A tag the pool can't back up (fewer than 3 lines with a Pokémon of that type, any stage) moves to the best-supported type nobody else
// on the path has, so "Fighting" never stands on a team with a single fighter.
const evolutions = JSON.parse(await fs.readFile(path.join(ROOT, "data/evolutions.json"), "utf8"));
const evoTo = {};
for (const l of evolutions) (evoTo[l.from] ??= []).push(l.to);
const stagesOf = (k, acc = new Set()) => { acc.add(k); (evoTo[k] ?? []).forEach((t) => stagesOf(t, acc)); return acc; };
const TYPES = ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel"];
const support = (o, type) => new Set([...(o.pool ?? []), ...(o.signature ?? [])].filter((k) => [...stagesOf(k)].some((st) => data.pokemonByKey[st]?.types.includes(type)))).size;
function fitThemes(opponents, gen) {
  const used = new Set(opponents.filter((o) => o.theme && support(o, o.theme) >= 3).map((o) => o.theme));
  for (const o of opponents) {
    if (!o.theme || support(o, o.theme) >= 3) continue;
    const best = TYPES.map((t) => ({ t, n: support(o, t) })).filter((x) => x.n >= 3).sort((a, b) => (used.has(a.t) - used.has(b.t)) || b.n - a.n)[0];
    console.log(`  evil${gen} battle ${o.order}: ${o.theme} (${support(o, o.theme)}) -> ${best?.t ?? "none"}`);
    o.theme = best?.t ?? null;
    if (o.theme) used.add(o.theme);
  }
}

for (const [gen, roster] of Object.entries(ROSTERS)) {
  const teamPool = (title) => { const t = TEAM_POOLS[gen]; return Array.isArray(t) ? t : t[Object.keys(t).find((k) => title.startsWith(k))]; };
  for (const k of [...(Array.isArray(TEAM_POOLS[gen]) ? TEAM_POOLS[gen] : Object.values(TEAM_POOLS[gen]).flat()), ...Object.values(SIGNATURE).flat()]) if (!data.pokemonByKey[k]) throw new Error(`Unknown species ${k}`);
  const opponents = roster.rows.map(([id, title, name, theme], i) => ({ order: i + 1, id, name, title, theme, ...(SIGNATURE[id] ? { signature: SIGNATURE[id] } : {}), pool: teamPool(title), sets: [] }));
  fitThemes(opponents, gen);
  const [boss, final] = BOSSES[gen];
  const bossEntry = (b, order) => {
    for (const k of [...b.anchor, ...b.signature, ...b.pool]) if (!data.pokemonByKey[k]) throw new Error(`Unknown species ${k}`);
    return { order, id: b.id, sprites: b.sprites, name: b.name, title: b.title, theme: b.theme, anchor: b.anchor, signature: b.signature, pool: b.pool, sets: [] };
  };
  opponents.push(bossEntry(boss, 13));
  const finalEntry = bossEntry(final, 14);
  finalEntry.options = [{ id: final.id, name: final.name }]; // the final slot is picked like the Rival (run.rival)
  opponents.push(finalEntry);
  const out = { gen: `e${gen}`, region: roster.region, basedOn: `Team path of generation ${gen}`, opponents };
  await fs.writeFile(path.join(ROOT, `data/leaders/evil${gen}.json`), JSON.stringify(out, null, 2) + "\n");
  console.log(`evil${gen}.json: ${opponents.length} battles`);
}
