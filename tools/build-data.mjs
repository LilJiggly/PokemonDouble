// =====================================================
// BUILD GAME DATA FROM POKEAPI
// -----------------------------------------------------
// Downloads Pokémon #1–649 (Gen 1–5) from PokeAPI and
// writes the game data into /data and sprites into
// /images/sprites/gen4 (Pokémon #1–493, Gen 4 art) and
// /images/sprites/gen5 (Pokémon #494–649, Black/White art).
// Gen 1–4 Pokémon keep their Gen 4 values; Gen 5 Pokémon
// and Gen 5 moves use their Black/White values.
//
// Usage:
//   node tools/build-data.mjs              (data + sprites)
//   node tools/build-data.mjs --no-sprites (data only)
//
// Raw API responses are cached in tools/.cache so
// re-running is fast and doesn't hit the API again.
// =====================================================

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = path.join(ROOT, "tools", ".cache");
const DATA_DIR = path.join(ROOT, "data");
const SPRITE_DIR = path.join(ROOT, "images", "sprites", "gen4");
const SPRITE_DIR_5 = path.join(ROOT, "images", "sprites", "gen5");

const API = "https://pokeapi.co/api/v2";
const MAX_ID = 649;
const LAST_GEN4_ID = 493;
// Values are taken as they were in this generation / version group
const targetGen = (id) => (id > LAST_GEN4_ID ? 5 : 4);
const TARGET_VERSION_GROUP = "platinum";
const TARGET_VERSION_GROUP_5 = "black-white";
const LEARNSET_VERSION_GROUPS = ["platinum", "heartgold-soulsilver"];
const LEARNSET_VERSION_GROUPS_5 = ["black-white", "black-2-white-2"];
const CONCURRENCY = 8;
const WITH_SPRITES = !process.argv.includes("--no-sprites");

// ===============================
// HELPERS
// ===============================

const GEN_NUMBER = {
  "generation-i": 1, "generation-ii": 2, "generation-iii": 3,
  "generation-iv": 4, "generation-v": 5, "generation-vi": 6,
  "generation-vii": 7, "generation-viii": 8, "generation-ix": 9,
};

const STAT_KEYS = {
  hp: "hp", attack: "atk", defense: "def",
  "special-attack": "spa", "special-defense": "spd", speed: "spe",
};

const idFromUrl = (url) => Number(url.split("/").filter(Boolean).pop());
const englishName = (names, fallback) =>
  names?.find((n) => n.language.name === "en")?.name ?? fallback;
const englishShortEffect = (entries) =>
  (entries?.find((e) => e.language.name === "en")?.short_effect ?? "").replace(/\s+/g, " ").trim();

async function exists(file) {
  try { await fs.access(file); return true; } catch { return false; }
}

// Fetch JSON with a file cache and simple retries
async function getJson(url) {
  const key = url.replace(API + "/", "").replace(/\/$/, "").replace(/[/?=&]/g, "_");
  const file = path.join(CACHE_DIR, key + ".json");
  if (await exists(file)) return JSON.parse(await fs.readFile(file, "utf8"));

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const json = await res.json();
      await fs.writeFile(file, JSON.stringify(json));
      return json;
    } catch (err) {
      if (attempt === 4) throw err;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

async function downloadFile(url, file) {
  if (await exists(file)) return true;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 404) return false;
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      await fs.writeFile(file, Buffer.from(await res.arrayBuffer()));
      return true;
    } catch (err) {
      if (attempt === 4) throw err;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

// Run an async function over a list with limited concurrency
async function mapLimit(items, fn, label) {
  const results = new Array(items.length);
  let next = 0;
  let done = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
      done++;
      if (label && (done % 50 === 0 || done === items.length)) {
        process.stdout.write(`\r  ${label}: ${done}/${items.length}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  if (label) process.stdout.write("\n");
  return results;
}

// PokeAPI "past_*" entries mean: these values applied up to and including
// that generation. For Gen 4 we apply every entry with generation >= 4,
// latest first, so the entry closest to Gen 4 wins (same idea for Gen 5).
function pastEntriesForGen(pastList, gen) {
  return (pastList ?? [])
    .filter((p) => GEN_NUMBER[p.generation.name] >= gen)
    .sort((a, b) => GEN_NUMBER[b.generation.name] - GEN_NUMBER[a.generation.name]);
}

// ===============================
// POKÉMON
// ===============================

function gen4Types(pokemon) {
  let types = pokemon.types;
  for (const past of pastEntriesForGen(pokemon.past_types, targetGen(pokemon.id))) types = past.types;
  return types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name);
}

function gen4Stats(pokemon) {
  const stats = {};
  for (const s of pokemon.stats) stats[STAT_KEYS[s.stat.name]] = s.base_stat;
  for (const past of pastEntriesForGen(pokemon.past_stats, targetGen(pokemon.id))) {
    for (const s of past.stats) {
      if (STAT_KEYS[s.stat.name]) stats[STAT_KEYS[s.stat.name]] = s.base_stat;
    }
  }
  return stats;
}

// Normal abilities as they were in Gen 4, plus the Hidden Ability
// from the latest data (design rule: Hidden Abilities from Gen 5+).
function gameAbilities(pokemon) {
  const slots = {};
  for (const a of pokemon.abilities) slots[a.slot] = a.ability?.name ?? null;
  for (const past of pastEntriesForGen(pokemon.past_abilities, targetGen(pokemon.id))) {
    for (const a of past.abilities) {
      if (a.is_hidden) continue;
      slots[a.slot] = a.ability?.name ?? null;
    }
  }
  const normal = [slots[1], slots[2]].filter(Boolean);
  const hidden = pokemon.abilities.find((a) => a.is_hidden)?.ability?.name ?? null;
  return { normal: [...new Set(normal)], hidden: normal.includes(hidden) ? null : hidden };
}

function learnset(pokemon) {
  const levelUp = new Map();
  const sets = { machine: new Set(), tutor: new Set(), egg: new Set() };
  const gen5 = pokemon.id > LAST_GEN4_ID;
  const groups = gen5 ? LEARNSET_VERSION_GROUPS_5 : LEARNSET_VERSION_GROUPS;
  const mainGroup = gen5 ? TARGET_VERSION_GROUP_5 : TARGET_VERSION_GROUP;

  for (const m of pokemon.moves) {
    const move = m.move.name;
    for (const d of m.version_group_details) {
      if (!groups.includes(d.version_group.name)) continue;
      const method = d.move_learn_method.name;
      if (method === "level-up") {
        const lvl = d.level_learned_at;
        // Prefer Platinum (Gen 5: Black/White) levels; only use the other game if the first doesn't have the move
        const isPlat = d.version_group.name === mainGroup;
        const prev = levelUp.get(move);
        if (!prev || (isPlat && !prev.plat) || (isPlat === prev.plat && lvl < prev.lvl)) {
          levelUp.set(move, { lvl, plat: isPlat });
        }
      } else if (sets[method]) {
        sets[method].add(move);
      }
    }
  }

  // Gen 1–4 Pokémon also get what Black/White and Black 2/White 2 added (new TMs, tutors, level-up moves).
  // Their Platinum/HGSS moves and levels stay exactly as they are; this only adds.
  if (!gen5) {
    for (const m of pokemon.moves) {
      for (const d of m.version_group_details) {
        if (!LEARNSET_VERSION_GROUPS_5.includes(d.version_group.name)) continue;
        const method = d.move_learn_method.name;
        if (method === "level-up") {
          if (!levelUp.has(m.move.name)) levelUp.set(m.move.name, { lvl: Math.max(1, d.level_learned_at), plat: false });
        } else if (sets[method]) {
          sets[method].add(m.move.name);
        }
      }
    }
  }

  return {
    levelUp: [...levelUp.entries()]
      .map(([move, { lvl }]) => [lvl, move])
      .sort((a, b) => a[0] - b[0] || a[1].localeCompare(b[1])),
    machine: [...sets.machine].sort(),
    tutor: [...sets.tutor].sort(),
    egg: [...sets.egg].sort(),
  };
}

// ===============================
// MOVES
// ===============================

function gen4Move(move, versionGroupOrder) {
  // Every move uses its Black/White values (power, accuracy, PP, type), for Gen 1–4 moves too
  const target = TARGET_VERSION_GROUP_5;
  const platOrder = versionGroupOrder[target];
  const values = {
    type: move.type.name,
    power: move.power,
    accuracy: move.accuracy,
    pp: move.pp,
    effectChance: move.effect_chance,
  };

  // past_values: the values listed applied BEFORE that version group.
  // Apply changes made after Platinum, latest first, so the earliest wins.
  const later = (move.past_values ?? [])
    .filter((p) => versionGroupOrder[p.version_group.name] > platOrder)
    .sort((a, b) => versionGroupOrder[b.version_group.name] - versionGroupOrder[a.version_group.name]);
  for (const p of later) {
    if (p.type) values.type = p.type.name;
    if (p.power !== null) values.power = p.power;
    if (p.accuracy !== null) values.accuracy = p.accuracy;
    if (p.pp !== null) values.pp = p.pp;
    if (p.effect_chance !== null) values.effectChance = p.effect_chance;
  }

  // Moves whose power became variable in Gen 5 (Beat Up, Punishment…) keep their fixed Platinum power
  if (values.power === null) {
    const plat = versionGroupOrder[TARGET_VERSION_GROUP];
    const earlier = (move.past_values ?? []).filter((p) => versionGroupOrder[p.version_group.name] > plat && p.power !== null)
      .sort((a, b) => versionGroupOrder[a.version_group.name] - versionGroupOrder[b.version_group.name])[0];
    if (earlier) values.power = earlier.power;
  }

  const meta = move.meta;
  return {
    id: move.id,
    name: englishName(move.names, move.name),
    gen: GEN_NUMBER[move.generation.name],
    ...values,
    category: move.damage_class.name,
    priority: move.priority,
    target: move.target.name,
    shortEffect: englishShortEffect(move.effect_entries).replace(/\$effect_chance/g, values.effectChance ?? ""),
    meta: meta && {
      category: meta.category?.name ?? null,
      ailment: meta.ailment?.name ?? null,
      ailmentChance: meta.ailment_chance,
      flinchChance: meta.flinch_chance,
      critRate: meta.crit_rate,
      drain: meta.drain,
      healing: meta.healing,
      minHits: meta.min_hits,
      maxHits: meta.max_hits,
      minTurns: meta.min_turns,
      maxTurns: meta.max_turns,
      statChance: meta.stat_chance,
    },
    statChanges: move.stat_changes.map((s) => ({ stat: STAT_KEYS[s.stat.name] ?? s.stat.name, change: s.change })),
  };
}

// ===============================
// EVOLUTIONS
// ===============================

// Flatten an evolution chain into "from → to" links (only species #1–493)
function flattenChain(node, links = []) {
  const fromId = idFromUrl(node.species.url);
  for (const child of node.evolves_to) {
    const toId = idFromUrl(child.species.url);
    if (fromId <= MAX_ID && toId <= MAX_ID) {
      links.push({
        from: node.species.name,
        to: child.species.name,
        details: child.evolution_details.map((d) => {
          const out = { trigger: d.trigger.name };
          for (const [k, v] of Object.entries(d)) {
            if (k === "trigger" || v === null || v === false || v === "") continue;
            out[k] = typeof v === "object" && v.name ? v.name : v;
          }
          return out;
        }),
      });
    }
    flattenChain(child, links);
  }
  return links;
}

// ===============================
// MAIN
// ===============================

async function main() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.mkdir(DATA_DIR, { recursive: true });

  console.log("Version groups…");
  const vgList = await getJson(`${API}/version-group?limit=100`);
  const vgs = await mapLimit(vgList.results, (v) => getJson(v.url));
  const versionGroupOrder = Object.fromEntries(vgs.map((v) => [v.name, v.order]));

  console.log("Pokémon #1–" + MAX_ID + "…");
  const ids = Array.from({ length: MAX_ID }, (_, i) => i + 1);
  const pokemonRaw = await mapLimit(ids, (id) => getJson(`${API}/pokemon/${id}`), "pokemon");
  const speciesRaw = await mapLimit(ids, (id) => getJson(`${API}/pokemon-species/${id}`), "species");

  const chainUrls = [...new Set(speciesRaw.map((s) => s.evolution_chain.url))];
  const chainsRaw = await mapLimit(chainUrls, (u) => getJson(u), "evolution chains");

  const pokemon = pokemonRaw.map((p, i) => {
    const s = speciesRaw[i];
    const baseStats = gen4Stats(p);
    return {
      id: p.id,
      key: s.name,
      name: englishName(s.names, s.name),
      gen: GEN_NUMBER[s.generation.name],
      types: gen4Types(p),
      baseStats,
      bst: Object.values(baseStats).reduce((a, b) => a + b, 0),
      abilities: gameAbilities(p),
      genderRate: s.gender_rate, // -1 = genderless, otherwise female chance in eighths
      isLegendary: s.is_legendary,
      isMythical: s.is_mythical,
      isBaby: s.is_baby,
      evolvesFrom: s.evolves_from_species?.name ?? null,
      evolutionChain: idFromUrl(s.evolution_chain.url),
      heightM: p.height / 10, // PokeAPI height is in decimeters
      weightKg: p.weight / 10, // PokeAPI weight is in hectograms
      sprites: {
        front: `images/sprites/${p.id > LAST_GEN4_ID ? "gen5" : "gen4"}/front/${p.id}.png`,
        back: `images/sprites/${p.id > LAST_GEN4_ID ? "gen5" : "gen4"}/back/${p.id}.png`,
        frontShiny: `images/sprites/${p.id > LAST_GEN4_ID ? "gen5" : "gen4"}/front-shiny/${p.id}.png`,
        backShiny: `images/sprites/${p.id > LAST_GEN4_ID ? "gen5" : "gen4"}/back-shiny/${p.id}.png`,
      },
      learnset: learnset(p),
    };
  });

  // Moves: everything any of these Pokémon can learn in Gen 4
  // Struggle isn't in any learnset but every battle needs it
  const moveNames = new Set(["struggle"]);
  for (const p of pokemon) {
    for (const [, m] of p.learnset.levelUp) moveNames.add(m);
    for (const k of ["machine", "tutor", "egg"]) p.learnset[k].forEach((m) => moveNames.add(m));
  }
  console.log(`Moves (${moveNames.size})…`);
  const movesRaw = await mapLimit([...moveNames], (m) => getJson(`${API}/move/${m}`), "moves");
  const moves = Object.fromEntries(
    movesRaw.sort((a, b) => a.id - b.id).map((m) => [m.name, gen4Move(m, versionGroupOrder)])
  );

  // Abilities: every normal + hidden ability used
  const abilityNames = new Set();
  for (const p of pokemon) {
    p.abilities.normal.forEach((a) => abilityNames.add(a));
    if (p.abilities.hidden) abilityNames.add(p.abilities.hidden);
  }
  console.log(`Abilities (${abilityNames.size})…`);
  const abilitiesRaw = await mapLimit([...abilityNames], (a) => getJson(`${API}/ability/${a}`), "abilities");
  const abilities = Object.fromEntries(
    abilitiesRaw.sort((a, b) => a.id - b.id).map((a) => [a.name, {
      id: a.id,
      name: englishName(a.names, a.name),
      gen: GEN_NUMBER[a.generation.name],
      shortEffect: englishShortEffect(a.effect_entries),
    }])
  );

  const evolutions = chainsRaw.flatMap((c) => flattenChain(c.chain));

  // Write data files
  const write = (name, obj) => fs.writeFile(path.join(DATA_DIR, name), JSON.stringify(obj, null, 1) + "\n");
  await write("pokemon.json", pokemon);
  await write("moves.json", moves);
  await write("abilities.json", abilities);
  await write("evolutions.json", evolutions);

  // Sprites
  const missingSprites = [];
  if (WITH_SPRITES) {
    const kinds = {
      front: (s) => s.front_default,
      back: (s) => s.back_default,
      "front-shiny": (s) => s.front_shiny,
      "back-shiny": (s) => s.back_shiny,
    };
    for (const kind of Object.keys(kinds)) {
      await fs.mkdir(path.join(SPRITE_DIR, kind), { recursive: true });
      await fs.mkdir(path.join(SPRITE_DIR_5, kind), { recursive: true });
    }

    const jobs = [];
    for (const p of pokemonRaw) {
      const gen5 = p.id > LAST_GEN4_ID;
      const plat = gen5 ? p.sprites.versions["generation-v"]["black-white"] : p.sprites.versions["generation-iv"].platinum;
      const hgss = gen5 ? plat : p.sprites.versions["generation-iv"]["heartgold-soulsilver"];
      for (const [kind, pick] of Object.entries(kinds)) {
        const url = pick(plat) ?? pick(hgss);
        if (url) jobs.push({ url, file: path.join(gen5 ? SPRITE_DIR_5 : SPRITE_DIR, kind, `${p.id}.png`), label: `${p.name} ${kind}` });
        else missingSprites.push(`${p.name} ${kind}`);
      }
    }
    console.log(`Sprites (${jobs.length})…`);
    await mapLimit(jobs, async (j) => {
      if (!(await downloadFile(j.url, j.file))) missingSprites.push(j.label);
    }, "sprites");
  }

  const manifest = {
    builtOn: new Date().toISOString().slice(0, 10),
    source: "PokeAPI (https://pokeapi.co)",
    rules: "Pokémon #1–493: Gen 4 types, base stats, normal abilities and move values, learnsets from Platinum + HeartGold/SoulSilver plus what Black/White and Black 2/White 2 added. Pokémon #494–649: Black/White values, learnsets from Black/White + Black 2/White 2. All moves: Black/White power, accuracy, PP and type. Hidden Abilities from latest data",
    counts: {
      pokemon: pokemon.length,
      moves: Object.keys(moves).length,
      abilities: Object.keys(abilities).length,
      evolutionLinks: evolutions.length,
    },
    missingSprites,
  };
  await write("manifest.json", manifest);

  console.log("\nDone:", manifest.counts);
  if (missingSprites.length) console.log("Missing sprites:", missingSprites.length, missingSprites.slice(0, 10));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
