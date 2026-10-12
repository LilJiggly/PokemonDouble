// =====================================================
// GAME DATA
// -----------------------------------------------------
// Wraps the JSON files from /data into one object the
// engine uses. Works in the browser and in Node.
// =====================================================

export function prepareData({ pokemon, moves, abilities }) {
  const movesWithKeys = {};
  for (const [key, move] of Object.entries(moves)) movesWithKeys[key] = { ...move, key };
  return {
    pokemon,
    pokemonByKey: Object.fromEntries(pokemon.map((p) => [p.key, p])),
    moves: movesWithKeys,
    abilities,
  };
}

// Browser: load from the site
export async function loadData(base = "data") {
  const get = (f) => fetch(`${base}/${f}`).then((r) => r.json());
  const [pokemon, moves, abilities] = await Promise.all([
    get("pokemon.json"), get("moves.json"), get("abilities.json"),
  ]);
  return prepareData({ pokemon, moves, abilities });
}
