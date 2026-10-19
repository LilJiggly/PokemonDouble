// =====================================================
// GAME DATA
// -----------------------------------------------------
// Wraps the JSON files from /data into one object the
// engine uses. Works in the browser and in Node.
// =====================================================

export function prepareData({ pokemon, moves, abilities }) {
  const movesWithKeys = {};
  for (const [key, move] of Object.entries(moves)) movesWithKeys[key] = { ...move, key };
  // Say it in the description when a move goes before or after the normal order (Aqua Jet, Quick Attack…)
  for (const move of Object.values(movesWithKeys)) {
    if (!move.priority) continue;
    const n = move.priority > 0 ? `+${move.priority}` : `${move.priority}`;
    move.shortEffect = `${move.shortEffect ?? ""} Priority ${n}: ${move.priority > 0 ? "goes before" : "goes after"} normal moves.`.trim();
  }
  // PokeAPI lists Conversion 2 as aimed at a Pokémon, but it only changes the user's type
  if (movesWithKeys["conversion-2"]) movesWithKeys["conversion-2"].target = "user";
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
