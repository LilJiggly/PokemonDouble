// =====================================================
// PLAYER CHARACTERS
// Front sprites: Pokémon Showdown. Back sprites: Bulbagarden Archives.
// =====================================================

export const CHARACTERS = [
  { id: "red", name: "Red", game: "FireRed / LeafGreen" },
  { id: "leaf", name: "Leaf", game: "FireRed / LeafGreen" },
  { id: "ethan", name: "Ethan", game: "HeartGold / SoulSilver" },
  { id: "lyra", name: "Lyra", game: "HeartGold / SoulSilver" },
  { id: "brendan", name: "Brendan", game: "Emerald" },
  { id: "may", name: "May", game: "Emerald" },
  { id: "lucas", name: "Lucas", game: "Platinum" },
  { id: "dawn", name: "Dawn", game: "Platinum" },
].map((c) => ({ ...c, front: `images/trainers/${c.id}.png`, back: `images/trainers/back/${c.id}.png` }));

export function characterById(id) {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[6];
}
