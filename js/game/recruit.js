// =====================================================
// RECRUITS
// -----------------------------------------------------
// Builds a recruited Pokémon following DESIGN.md §2
// "Recruit stats": random nature, ability 90% normal /
// 10% Hidden, gender by species ratio, 1/512 shiny,
// moves = last 4 level-up moves at its level.
// =====================================================

const NATURE_LIST = [
  "hardy", "lonely", "brave", "adamant", "naughty", "bold", "docile", "relaxed", "impish", "lax",
  "timid", "hasty", "serious", "jolly", "naive", "modest", "mild", "quiet", "bashful", "rash",
  "calm", "gentle", "sassy", "careful", "quirky",
];

export const HIDDEN_ABILITY_CHANCE = 0.1;

// Random nicknames for recruits (fun, short, gender-neutral)
export const NICKNAMES = `
  Pebbles Biscuit Noodle Pickles Sprout Mochi Waffles Nugget Pepper Ziggy Bolt Comet Pixel Echo Tofu
  Gizmo Muffin Rocket Sunny Blaze Puddle Clover Maple Dusty Bubbles Peanut Jellybean Turbo Ember Frost
  Thunder Marble Cosmo Chip Domino Twix Rascal Scout Bandit Fizz Kiwi Mango Olive Pretzel Sushi Taco
  Nacho Dumpling Gumbo Zappy Sparky Shadow Misty Rusty Stormy Pippin Wiggles Bean Button Crumble Doodle
  Fudge Goober Hopper Jinx Kipper Lumpy Mossy Nimbus Orbit Pudding Quill Rumble Scruffy Tinker Velvet
  Whisker Yeti Zest Acorn Boulder Cinder Drizzle Flint Gravel Hazel Ivy Jasper Juniper Lotus Meteor
  Nova Onyx Pumpkin Quartz Riptide Saffron Thistle Umber Vortex Willow Zephyr Atlas Banjo Cricket Dynamo
  Fable Glimmer Hiccup Inkwell Jumbo Kazoo Lantern Mustard Nebula Oatmeal Pistachio Ripple Sherbet
  Truffle Waddles Yoyo Zigzag Bonbon Cupcake Sprinkles Toffee Gnocchi Paprika Ravioli Wasabi
`.trim().split(/\s+/);
export const SHINY_CHANCE = 1 / 512;

// rand: function returning a number in [0, 1)
const pickFrom = (list, rand) => list[Math.floor(rand() * list.length)];

export function levelUpMovesAt(species, level, data) {
  const learned = species.learnset.levelUp.filter(([lvl, m]) => lvl <= level && data.moves[m]).map(([, m]) => m);
  // Last 4 distinct moves, keeping the order they were learned
  const seen = new Set();
  const lastFour = [];
  for (let i = learned.length - 1; i >= 0 && lastFour.length < 4; i--) {
    if (!seen.has(learned[i])) {
      seen.add(learned[i]);
      lastFour.unshift(learned[i]);
    }
  }
  return lastFour;
}

// chances: { hidden, shiny } (Trainer upgrades can raise them)
export function createRecruit(data, speciesKey, level, rand = Math.random, chances = {}) {
  const species = data.pokemonByKey[speciesKey];
  const { normal, hidden } = species.abilities;
  const ability = hidden && rand() < (chances.hidden ?? HIDDEN_ABILITY_CHANCE) ? hidden : pickFrom(normal, rand);
  const gender = species.genderRate === -1 ? null : rand() < species.genderRate / 8 ? "F" : "M";
  const moves = levelUpMovesAt(species, level, data);
  return {
    species: speciesKey,
    nickname: pickFrom(NICKNAMES, rand),
    level,
    nature: pickFrom(NATURE_LIST, rand),
    ability,
    gender,
    shiny: rand() < (chances.shiny ?? SHINY_CHANCE),
    item: null,
    moves: moves.length ? moves : ["struggle"],
  };
}

// First-stage, non-legendary species (used for test battles until the draft exists)
export function firstStageSpecies(data) {
  return data.pokemon.filter((p) => !p.evolvesFrom && !p.isLegendary && !p.isMythical && !p.isBaby);
}
