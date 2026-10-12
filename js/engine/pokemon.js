// =====================================================
// BUILD A BATTLE POKÉMON
// -----------------------------------------------------
// Turns a team entry like
//   { species: "larvitar", level: 12, nature: "adamant",
//     ability: "guts", item: "oran-berry", moves: [...] }
// into the object the battle engine works with.
// =====================================================

import { NATURES } from "./constants.js";

const STATS = ["hp", "atk", "def", "spa", "spd", "spe"];

// Recruits use perfect IVs and no EVs (DESIGN.md §2 Recruit stats)
export const DEFAULT_IVS = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
export const DEFAULT_EVS = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };

export function calcStats(baseStats, level, nature, ivs = DEFAULT_IVS, evs = DEFAULT_EVS, species = "") {
  const stats = {};
  const [up, down] = NATURES[nature] ?? [];
  for (const s of STATS) {
    const core = Math.floor(((2 * baseStats[s] + ivs[s] + Math.floor(evs[s] / 4)) * level) / 100);
    if (s === "hp") {
      stats.hp = species === "shedinja" ? 1 : core + level + 10;
    } else {
      let value = core + 5;
      if (s === up) value = Math.floor(value * 1.1);
      if (s === down) value = Math.floor(value * 0.9);
      stats[s] = value;
    }
  }
  return stats;
}

export function emptyBoosts() {
  return { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, accuracy: 0, evasion: 0 };
}

// spec: team entry. data: { pokemonByKey, moves }
export function createBattlePokemon(spec, data) {
  const species = data.pokemonByKey[spec.species];
  if (!species) throw new Error(`Unknown species: ${spec.species}`);

  const level = spec.level ?? 50;
  const nature = spec.nature ?? "hardy";
  const ivs = { ...DEFAULT_IVS, ...spec.ivs };
  const evs = { ...DEFAULT_EVS, ...spec.evs };
  const stats = calcStats(species.baseStats, level, nature, ivs, evs, species.key);

  const moves = (spec.moves ?? []).slice(0, 4).map((id) => {
    const move = data.moves[id];
    if (!move) throw new Error(`Unknown move: ${id}`);
    // PP Ups aren't in the game, so max PP is the base PP
    return { id, pp: move.pp ?? 1, maxPp: move.pp ?? 1 };
  });

  return {
    species: species.key,
    name: spec.nickname ?? species.name,
    level,
    nature,
    gender: spec.gender ?? null,
    shiny: !!spec.shiny,
    types: [...species.types],
    baseStats: { ...species.baseStats },
    ivs,
    evs,
    stats,
    maxHp: stats.hp,
    hp: spec.hp ?? stats.hp,
    weightKg: species.weightKg,
    ability: spec.ability ?? species.abilities.normal[0],
    item: spec.item ?? null,
    consumedItem: null, // item used up this battle (berries, Focus Sash, …)
    moves,
    status: spec.status ?? null, // brn | par | psn | tox | slp | frz
    statusTurns: 0, // sleep turns left / toxic counter
    boosts: emptyBoosts(),
    volatile: {},
    fainted: (spec.hp ?? stats.hp) <= 0,
  };
}
