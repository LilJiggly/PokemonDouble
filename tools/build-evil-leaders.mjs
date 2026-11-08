// =====================================================
// EVIL TEAM PATHS: writes data/leaders/evil1.json … evil5.json
// Usage: node tools/build-evil-leaders.mjs
// -----------------------------------------------------
// One path per generation, 14 battles like the normal game (so levels, rarities and rewards stay as they are):
//   1–8 grunts and commanders, 9–12 the team's elite, 13 the boss, 14 the final boss.
// Battles 1–12 get a random team from the team's own Pokémon (`pool`) and the character's `signature` Pokémon (see personalTeam in run.js).
// The boss and final boss (13, 14) have handcrafted teams, written below and saved in the JSON.
// Edit the ROSTERS and run the script again to change a path.
// =====================================================

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareData } from "../js/engine/data.js";
import { levelUpMovesAt } from "../js/game/recruit.js";

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
  1: ["rattata", "zubat", "koffing", "grimer", "ekans", "meowth", "machop", "drowzee", "magnemite", "voltorb", "cubone", "houndour", "murkrow", "sneasel", "onix",
      "geodude", "growlithe", "vulpix", "gastly", "kadabra", "primeape", "tauros", "scyther", "pinsir", "magmar", "electabuzz", "hitmonlee", "hitmonchan", "lickitung", "rhyhorn",
      "tangela", "kangaskhan", "gyarados", "snorlax", "porygon", "dratini", "aerodactyl", "umbreon", "scizor", "steelix", "tyranitar"],
  2: ["rattata", "zubat", "koffing", "grimer", "ekans", "meowth", "houndour", "murkrow", "sneasel", "gloom", "magnemite", "voltorb", "growlithe", "slugma",
      "machop", "drowzee", "onix", "geodude", "gastly", "cubone", "scyther", "pinsir", "magmar", "electabuzz", "tauros", "gyarados", "ursaring", "sandslash", "quagsire",
      "misdreavus", "pupitar", "larvitar", "scizor", "steelix", "heracross", "umbreon", "dragonair", "kingdra", "rhyhorn", "snorlax"],
  3: { "Team Aqua": ["poochyena", "carvanha", "zubat", "wailmer", "tentacool", "wingull", "corphish", "barboach", "mightyena", "sharpedo", "golbat", "huntail", "gorebyss", "relicanth",
                     "clamperl", "spheal", "luvdisc", "lotad", "mudkip", "sealeo", "pelipper", "manectric", "linoone", "shiftry", "nuzleaf", "crawdaunt", "whiscash", "milotic", "walrein", "ludicolo",
                     "gyarados", "kingdra", "tentacruel", "ninjask", "zangoose", "seviper", "absol"],
       "Team Magma": ["poochyena", "numel", "slugma", "zubat", "baltoy", "torkoal", "geodude", "makuhita", "mightyena", "camerupt", "golbat", "magcargo", "graveler", "claydol",
                      "hariyama", "aron", "lairon", "trapinch", "vibrava", "swalot", "koffing", "weezing", "houndour", "houndoom", "mawile", "skarmory", "flygon", "nosepass", "sableye", "ursaring",
                      "rhydon", "golem", "magmar", "ninetales", "arcanine", "flareon", "tyranitar"] },
  4: ["zubat", "stunky", "glameow", "bronzor", "croagunk", "shellos", "kricketot", "murkrow", "magnemite", "carnivine", "buizel", "machop", "gastly", "skorupi",
      "golbat", "skuntank", "purugly", "bronzong", "toxicroak", "gastrodon", "kricketune", "honchkrow", "magneton", "floatzel", "haunter", "drapion", "weavile", "sneasel", "mismagius",
      "luxio", "shinx", "mightyena", "houndoom", "gligar", "rhydon", "electivire", "magmortar", "lucario", "tangrowth", "mamoswine", "rotom"],
  5: ["patrat", "lillipup", "purrloin", "sandile", "scraggy", "trubbish", "throh", "sawk", "venipede", "yamask", "foongus", "cottonee", "zorua", "timburr", "vanillite",
      "watchog", "herdier", "liepard", "krokorok", "scrafty", "garbodor", "scolipede", "cofagrigus", "amoonguss", "whimsicott", "zoroark", "gurdurr", "vanillish", "darumaka", "pawniard",
      "bisharp", "deino", "mienfoo", "sigilyph", "golett", "tympole", "frillish", "ferroseed", "tirtouga", "archen", "klink", "cryogonal", "beartic", "druddigon", "conkeldurr", "krookodile"],
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
    { sprites: ["giovanni"], id: "giovanni", title: "Team Rocket Boss", name: "Giovanni", theme: "ground", team: ["persian", "dugtrio", "nidoqueen", "nidoking", "rhydon", "kangaskhan"] },
    { sprites: ["giovanni"], id: "giovanni", title: "Final Boss", name: "Giovanni", theme: null, team: ["mewtwo", "nidoking", "nidoqueen", "rhyperior", "dugtrio", "persian"] },
  ],
  2: [
    { sprites: ["archer"], id: "archer", title: "Team Rocket Boss", name: "Archer", theme: "dark", team: ["houndoom", "crobat", "arbok", "weezing", "honchkrow", "muk"] },
    { sprites: ["giovanni", "archer"], id: "giovanni", title: "Final Boss", name: "Giovanni and Archer", theme: null, team: ["gyarados", "houndoom", "crobat", "persian", "nidoking", "rhydon"] },
  ],
  3: [
    { sprites: ["archie", "maxie"], id: "archie", title: "Team Aqua and Magma", name: "Archie and Maxie", theme: null, team: ["kyogre", "groudon", "sharpedo", "camerupt", "crobat", "mightyena"] },
    { sprites: ["zinnia"], id: "zinnia", title: "Final Boss", name: "Zinnia", theme: "dragon", team: ["rayquaza", "salamence", "altaria", "lunatone", "garchomp", "tyranitar"] },
  ],
  4: [
    { sprites: ["cyrus"], id: "cyrus", title: "Team Galactic Boss", name: "Cyrus", theme: "dark", team: ["honchkrow", "gyarados", "crobat", "weavile", "houndoom", "toxicroak"] },
    { sprites: ["cyrus"], id: "cyrus", title: "Final Boss", name: "Cyrus", theme: null, team: ["dialga", "palkia", "giratina", "weavile", "honchkrow", "crobat"] },
  ],
  5: [
    { sprites: ["n"], id: "n", title: "King of Team Plasma", name: "N", theme: null, team: ["zoroark", "klinklang", "vanilluxe", "archeops", "carracosta", "reshiram"] },
    { sprites: ["ghetsis"], id: "ghetsis", title: "Final Boss", name: "Ghetsis", theme: null, team: ["kyurem", "hydreigon", "cofagrigus", "seismitoad", "drapion", "eelektross"] },
  ],
};

const ITEMS = ["leftovers", "life-orb", "expert-belt", "choice-scarf", "shell-bell", "muscle-band"];
const NATURE_FOR = { physical: "adamant", special: "modest" };

// A handcrafted mon: its first normal ability, its best-fitting Nature and the moves a recruit of that level would know
function mon(key, index) {
  const sp = data.pokemonByKey[key];
  if (!sp) throw new Error(`Unknown species ${key}`);
  const moves = levelUpMovesAt(sp, 70, data);
  for (const m of moves) if (!data.moves[m]) throw new Error(`${key}: unknown move ${m}`);
  const physical = sp.baseStats.atk >= sp.baseStats.spa;
  return { species: key, ability: sp.abilities.normal[0], nature: NATURE_FOR[physical ? "physical" : "special"], item: ITEMS[index % ITEMS.length], moves };
}

for (const [gen, roster] of Object.entries(ROSTERS)) {
  const teamPool = (title) => { const t = TEAM_POOLS[gen]; return Array.isArray(t) ? t : t[Object.keys(t).find((k) => title.startsWith(k))]; };
  for (const k of [...(Array.isArray(TEAM_POOLS[gen]) ? TEAM_POOLS[gen] : Object.values(TEAM_POOLS[gen]).flat()), ...Object.values(SIGNATURE).flat()]) if (!data.pokemonByKey[k]) throw new Error(`Unknown species ${k}`);
  const opponents = roster.rows.map(([id, title, name, theme], i) => ({ order: i + 1, id, name, title, theme, ...(SIGNATURE[id] ? { signature: SIGNATURE[id] } : {}), pool: teamPool(title), sets: [] }));
  const [boss, final] = BOSSES[gen];
  const bossEntry = (b, order) => ({ order, id: b.id, sprites: b.sprites, name: b.name, title: b.title, theme: b.theme,
    sets: [{ name: `${b.name}'s team`, notes: "Handcrafted team.", script: [], team: b.team.map(mon) }] });
  opponents.push(bossEntry(boss, 13));
  const finalEntry = bossEntry(final, 14);
  finalEntry.options = [{ id: final.id, name: final.name }]; // the final slot is picked like the Rival (run.rival)
  opponents.push(finalEntry);
  const out = { gen: `e${gen}`, region: roster.region, basedOn: `Team path of generation ${gen}`, opponents };
  await fs.writeFile(path.join(ROOT, `data/leaders/evil${gen}.json`), JSON.stringify(out, null, 2) + "\n");
  console.log(`evil${gen}.json: ${opponents.length} battles`);
}
