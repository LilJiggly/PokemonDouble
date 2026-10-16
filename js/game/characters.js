// =====================================================
// PLAYER CHARACTERS
// Loaded from data/characters.json (made by tools/fetch-back-sprites.mjs).
// Back sprites: Bulbagarden Archives. Front sprites: Pokémon Showdown.
// Any trainer with a back sprite can be played, so mirror battles are possible.
// =====================================================

export let CHARACTERS = [];
export const GEN_LABELS = { 1: "Gen 1 · Kanto", 2: "Gen 2 · Johto", 3: "Gen 3 · Hoenn / Kanto", 4: "Gen 4 · Sinnoh", 5: "Gen 5 · Unova" };

export function setCharacters(list) {
  CHARACTERS = list;
}

export function characterById(id) {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS.find((c) => c.id === "lucas") ?? CHARACTERS[0];
}
