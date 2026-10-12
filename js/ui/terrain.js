// =====================================================
// BATTLE ARENAS
// Each arena is a colour palette per type (sky, ground,
// platforms), see the .scene[data-terrain] styles.
// =====================================================

export const TERRAINS = ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground",
  "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel"];

// opponent: run.opponent ({ order, theme }). No theme (Champion, Rival) → normal.
export function terrainFor(opponent) {
  return opponent?.theme && TERRAINS.includes(opponent.theme) ? opponent.theme : "normal";
}
