// =====================================================
// HELD ITEMS (Gen 4)
// -----------------------------------------------------
// Lookup tables used by the battle engine. Behaviour
// that needs battle context lives in battle.js.
// =====================================================

// Type-boosting held items (×1.2 base power)
export const TYPE_BOOST_ITEMS = {
  "silk-scarf": "normal", charcoal: "fire", "mystic-water": "water", magnet: "electric",
  "miracle-seed": "grass", "never-melt-ice": "ice", "black-belt": "fighting", "poison-barb": "poison",
  "soft-sand": "ground", "sharp-beak": "flying", "twisted-spoon": "psychic", "silver-powder": "bug",
  "hard-stone": "rock", "spell-tag": "ghost", "dragon-fang": "dragon", "black-glasses": "dark",
  "metal-coat": "steel",
  "flame-plate": "fire", "splash-plate": "water", "zap-plate": "electric", "meadow-plate": "grass",
  "icicle-plate": "ice", "fist-plate": "fighting", "toxic-plate": "poison", "earth-plate": "ground",
  "sky-plate": "flying", "mind-plate": "psychic", "insect-plate": "bug", "stone-plate": "rock",
  "spooky-plate": "ghost", "draco-plate": "dragon", "dread-plate": "dark", "iron-plate": "steel",
  "sea-incense": "water", "wave-incense": "water", "rose-incense": "grass", "odd-incense": "psychic",
  "rock-incense": "rock",
};

// Species-only stat items: item → { species, stats multiplier }
export const SPECIES_STAT_ITEMS = {
  "light-ball": { species: ["pikachu"], mods: { atk: 2, spa: 2 } },
  "thick-club": { species: ["cubone", "marowak"], mods: { atk: 2 } },
  "deep-sea-tooth": { species: ["clamperl"], mods: { spa: 2 } },
  "deep-sea-scale": { species: ["clamperl"], mods: { spd: 2 } },
  "metal-powder": { species: ["ditto"], mods: { def: 2 } },
  "quick-powder": { species: ["ditto"], mods: { spe: 2 } },
  "soul-dew": { species: ["latios", "latias"], mods: { spa: 1.5, spd: 1.5 } },
};

export const CHOICE_ITEMS = { "choice-band": "atk", "choice-specs": "spa", "choice-scarf": "spe" };

// Berries that halve a super-effective hit of this type
export const RESIST_BERRIES = {
  "occa-berry": "fire", "passho-berry": "water", "wacan-berry": "electric", "rindo-berry": "grass",
  "yache-berry": "ice", "chople-berry": "fighting", "kebia-berry": "poison", "shuca-berry": "ground",
  "coba-berry": "flying", "payapa-berry": "psychic", "tanga-berry": "bug", "charti-berry": "rock",
  "kasib-berry": "ghost", "haban-berry": "dragon", "colbur-berry": "dark", "babiri-berry": "steel",
  "chilan-berry": "normal", // Chilan works on any Normal hit
};

// Status-curing berries: item → statuses it cures ("confusion" = volatile)
export const CURE_BERRIES = {
  "cheri-berry": ["par"], "chesto-berry": ["slp"], "pecha-berry": ["psn", "tox"],
  "rawst-berry": ["brn"], "aspear-berry": ["frz"], "persim-berry": ["confusion"],
  "lum-berry": ["par", "slp", "psn", "tox", "brn", "frz", "confusion"],
};

// Pinch berries (activate at 25% HP, 50% with Gluttony): item → stat boosted by 1
export const PINCH_BERRIES = {
  "liechi-berry": "atk", "ganlon-berry": "def", "salac-berry": "spe",
  "petaya-berry": "spa", "apicot-berry": "spd",
};

// Heal berries (activate at 50% HP)
export const HEAL_BERRIES = {
  "oran-berry": { flat: 10 },
  "sitrus-berry": { fraction: 1 / 4 },
  "figy-berry": { fraction: 1 / 8 }, "wiki-berry": { fraction: 1 / 8 }, "mago-berry": { fraction: 1 / 8 },
  "aguav-berry": { fraction: 1 / 8 }, "iapapa-berry": { fraction: 1 / 8 },
};

export const WEATHER_ROCKS = {
  rain: "damp-rock", sun: "heat-rock", sand: "smooth-rock", hail: "icy-rock",
};

export function isBerry(item) {
  return !!item && item.endsWith("-berry");
}
