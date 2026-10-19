// =====================================================
// ITEM CATALOG (mirrors DESIGN.md §3e)
// -----------------------------------------------------
// kind:  "held"  = given to a Pokémon
//        "bag"   = used from the bag (battle = usable in battle)
//        "evo"   = evolution item, used from the team screen (multi-use)
//        "patch" = ability patch, used from the team screen (multi-use)
// species: only offered when one of these is on the team
// sprite: PokeAPI item sprite name when it differs from the id
// =====================================================

const held = (tier, name, desc, extra = {}) => ({ kind: "held", tier, name, desc, ...extra });
const bag = (tier, name, desc, effect) => ({ kind: "bag", tier, name, desc, battle: true, effect });
const evo = (tier, name, desc, extra = {}) => ({ kind: "evo", tier, name, desc, ...extra });

const TYPE_BOOSTERS = {
  "silk-scarf": "Normal", charcoal: "Fire", "mystic-water": "Water", magnet: "Electric", "miracle-seed": "Grass",
  "never-melt-ice": "Ice", "black-belt": "Fighting", "poison-barb": "Poison", "soft-sand": "Ground",
  "sharp-beak": "Flying", "twisted-spoon": "Psychic", "silver-powder": "Bug", "hard-stone": "Rock",
  "spell-tag": "Ghost", "dragon-fang": "Dragon", "black-glasses": "Dark",
};
const RESIST_BERRIES = {
  "occa-berry": "Fire", "passho-berry": "Water", "wacan-berry": "Electric", "rindo-berry": "Grass",
  "yache-berry": "Ice", "chople-berry": "Fighting", "kebia-berry": "Poison", "shuca-berry": "Ground",
  "coba-berry": "Flying", "payapa-berry": "Psychic", "tanga-berry": "Bug", "charti-berry": "Rock",
  "kasib-berry": "Ghost", "haban-berry": "Dragon", "colbur-berry": "Dark", "babiri-berry": "Steel",
};
const titleCase = (id) => id.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

export const ITEMS = {
  // ---------- Common ----------
  "oran-berry": held("common", "Oran Berry", "Restores 10 HP at half HP or less. Single use: lost once it triggers."),
  "sitrus-berry": held("common", "Sitrus Berry", "Restores 1/4 of max HP at half HP or less. Single use: lost once it triggers."),
  "cheri-berry": held("common", "Cheri Berry", "Cures paralysis. Single use: lost once it triggers."),
  "chesto-berry": held("common", "Chesto Berry", "Wakes the holder up. Single use: lost once it triggers."),
  "pecha-berry": held("common", "Pecha Berry", "Cures poison. Single use: lost once it triggers."),
  "rawst-berry": held("common", "Rawst Berry", "Cures a burn. Single use: lost once it triggers."),
  "aspear-berry": held("common", "Aspear Berry", "Thaws the holder out. Single use: lost once it triggers."),
  ...Object.fromEntries(Object.entries(TYPE_BOOSTERS).map(([id, type]) =>
    [id, held("common", titleCase(id), `Boosts ${type}-type moves by 20%.`)])),
  potion: bag("common", "Potion", "Restores 20 HP.", { heal: 20 }),
  "super-potion": bag("common", "Super Potion", "Restores 50 HP.", { heal: 50 }),
  antidote: bag("common", "Antidote", "Cures poison.", { cure: ["psn", "tox"] }),
  "paralyze-heal": bag("common", "Paralyze Heal", "Cures paralysis.", { cure: ["par"] }),
  "burn-heal": bag("common", "Burn Heal", "Cures a burn.", { cure: ["brn"] }),
  awakening: bag("common", "Awakening", "Wakes a Pokémon up.", { cure: ["slp"] }),
  "ice-heal": bag("common", "Ice Heal", "Thaws a frozen Pokémon.", { cure: ["frz"] }),

  // ---------- Uncommon ----------
  "lum-berry": held("uncommon", "Lum Berry", "Cures any status or confusion. Single use: lost once it triggers."),
  "muscle-band": held("uncommon", "Muscle Band", "Boosts physical moves by 10%."),
  "wise-glasses": held("uncommon", "Wise Glasses", "Boosts special moves by 10%."),
  "scope-lens": held("uncommon", "Scope Lens", "Raises the critical-hit ratio."),
  "quick-claw": held("uncommon", "Quick Claw", "Sometimes lets the holder move first (20%)."),
  "bright-powder": held("uncommon", "Bright Powder", "Lowers foes' accuracy by 10%."),
  "shell-bell": held("uncommon", "Shell Bell", "Heals 1/8 of the damage the holder deals."),
  "black-sludge": held("uncommon", "Black Sludge", "Heals Poison types 1/16 each turn. Hurts others."),
  ...Object.fromEntries(Object.entries(RESIST_BERRIES).map(([id, type]) =>
    [id, held("uncommon", titleCase(id), `Halves a super-effective ${type} hit once. Single use: lost once it triggers.`)])),
  "chilan-berry": held("uncommon", "Chilan Berry", "Halves a Normal-type hit once. Single use: lost once it triggers."),
  "hyper-potion": bag("uncommon", "Hyper Potion", "Restores 200 HP.", { heal: 200 }),
  "full-heal": bag("uncommon", "Full Heal", "Cures any status and confusion.", { cure: ["psn", "tox", "par", "brn", "slp", "frz", "confusion"] }),
  "x-attack": bag("uncommon", "X Attack", "Raises Attack by 1 in battle.", { boost: { atk: 1 } }),
  "x-defense": bag("uncommon", "X Defense", "Raises Defense by 1 in battle.", { boost: { def: 1 } }),
  "x-sp-atk": bag("uncommon", "X Sp. Atk", "Raises Sp. Atk by 1 in battle.", { boost: { spa: 1 } }),
  "x-sp-def": bag("uncommon", "X Sp. Def", "Raises Sp. Def by 1 in battle.", { boost: { spd: 1 } }),
  "x-speed": bag("uncommon", "X Speed", "Raises Speed by 1 in battle.", { boost: { spe: 1 } }),
  "dire-hit": bag("uncommon", "Dire Hit", "Raises the critical-hit ratio in battle.", { focusEnergy: true }),
  "guard-spec": bag("uncommon", "Guard Spec.", "Protects your side's stats from being lowered for 5 turns.", { mist: true }),

  // ---------- Rare ----------
  leftovers: held("rare", "Leftovers", "Restores 1/16 of max HP each turn."),
  "expert-belt": held("rare", "Expert Belt", "Boosts super-effective moves by 20%."),
  "focus-sash": held("rare", "Focus Sash", "Survives one KO hit from full HP, once per battle. You keep it after the battle."),
  "white-herb": held("rare", "White Herb", "Restores lowered stats once. Single use: lost once it triggers."),
  "mental-herb": held("rare", "Mental Herb", "Cures infatuation once. Single use: lost once it triggers."),
  "power-herb": held("rare", "Power Herb", "Skips the charge turn of a two-turn move once. Single use: lost once it triggers."),
  "light-clay": held("rare", "Light Clay", "Reflect and Light Screen last 8 turns."),
  "damp-rock": held("rare", "Damp Rock", "Rain Dance lasts 8 turns."),
  "heat-rock": held("rare", "Heat Rock", "Sunny Day lasts 8 turns."),
  "smooth-rock": held("rare", "Smooth Rock", "Sandstorm lasts 8 turns."),
  "icy-rock": held("rare", "Icy Rock", "Hail lasts 8 turns."),
  "liechi-berry": held("rare", "Liechi Berry", "Raises Attack at 1/4 HP. Single use: lost once it triggers."),
  "salac-berry": held("rare", "Salac Berry", "Raises Speed at 1/4 HP. Single use: lost once it triggers."),
  "petaya-berry": held("rare", "Petaya Berry", "Raises Sp. Atk at 1/4 HP. Single use: lost once it triggers."),
  "toxic-orb": held("rare", "Toxic Orb", "Badly poisons the holder at the end of a turn."),
  "flame-orb": held("rare", "Flame Orb", "Burns the holder at the end of a turn."),
  "razor-claw": held("rare", "Razor Claw", "Raises the critical-hit ratio. Evolves Sneasel."),
  "razor-fang": held("rare", "Razor Fang", "May make the target flinch. Evolves Gligar."),
  "kings-rock": held("rare", "King's Rock", "May make the target flinch. Trade evolutions: Poliwhirl, Slowpoke."),
  "metal-coat": held("rare", "Metal Coat", "Boosts Steel-type moves by 20%. Trade evolutions: Onix, Scyther."),
  "dragon-scale": held("rare", "Dragon Scale", "Trade evolution: Seadra → Kingdra."),
  "up-grade": held("rare", "Up-Grade", "Trade evolution: Porygon → Porygon2."),
  "dubious-disc": held("rare", "Dubious Disc", "Trade evolution: Porygon2 → Porygon-Z."),
  protector: held("rare", "Protector", "Trade evolution: Rhydon → Rhyperior."),
  electirizer: held("rare", "Electirizer", "Trade evolution: Electabuzz → Electivire."),
  magmarizer: held("rare", "Magmarizer", "Trade evolution: Magmar → Magmortar."),
  "reaper-cloth": held("rare", "Reaper Cloth", "Trade evolution: Dusclops → Dusknoir."),
  "oval-stone": held("rare", "Oval Stone", "Evolves Happiny."),
  "max-potion": bag("rare", "Max Potion", "Fully restores HP.", { heal: "full" }),
  ...Object.fromEntries(["fire-stone", "water-stone", "thunder-stone", "leaf-stone", "moon-stone", "sun-stone",
    "shiny-stone", "dusk-stone", "dawn-stone", "ice-stone"].map((id) => [id, evo("rare", titleCase(id), "Evolves certain Pokémon. Not used up upon evolution.")])),
  "link-cable": evo("rare", "Link Cable", "Triggers trade evolutions. Not used up upon evolution.", { sprite: "linking-cord" }),
  "ability-patch": { kind: "patch", tier: "rare", name: "Ability Patch", desc: "Switches a Pokémon to its other normal Ability. Single use: lost once applied.", sprite: "ability-capsule" },

  // ---------- Epic ----------
  "choice-band": held("epic", "Choice Band", "Attack ×1.5, but locks the holder into one move."),
  "choice-specs": held("epic", "Choice Specs", "Sp. Atk ×1.5, but locks the holder into one move."),
  "choice-scarf": held("epic", "Choice Scarf", "Speed ×1.5, but locks the holder into one move."),
  "life-orb": held("epic", "Life Orb", "Moves do 30% more damage; costs 10% HP per hit."),
  "full-restore": bag("epic", "Full Restore", "Fully restores HP and cures status.", { heal: "full", cure: ["psn", "tox", "par", "brn", "slp", "frz", "confusion"] }),
  "hidden-ability-patch": { kind: "patch", tier: "epic", name: "Hidden Ability Patch", desc: "Switches a Pokémon to its Hidden Ability. Single use: lost once applied.", sprite: "ability-patch" },

  // ---------- Species-only (roll as Rare) ----------
  "light-ball": held("rare", "Light Ball", "Doubles Pikachu's Attack and Sp. Atk.", { species: ["pikachu"] }),
  "thick-club": held("rare", "Thick Club", "Doubles Cubone's and Marowak's Attack.", { species: ["cubone", "marowak"] }),
  "metal-powder": held("rare", "Metal Powder", "Doubles Ditto's Defense.", { species: ["ditto"] }),
  stick: held("rare", "Stick", "Raises Farfetch'd's critical-hit ratio.", { species: ["farfetchd"], sprite: "leek" }),
  "lucky-punch": held("rare", "Lucky Punch", "Raises Chansey's critical-hit ratio.", { species: ["chansey"] }),
  "deep-sea-tooth": held("rare", "DeepSeaTooth", "Doubles Clamperl's Sp. Atk. Trade evolution: Clamperl → Huntail.", { species: ["clamperl"] }),
  "deep-sea-scale": held("rare", "DeepSeaScale", "Doubles Clamperl's Sp. Def. Trade evolution: Clamperl → Gorebyss.", { species: ["clamperl"] }),
};

export function itemSprite(id) {
  return `images/items/${id}.png`;
}

export function itemInfo(id) {
  return ITEMS[id] ?? { kind: "held", tier: "common", name: titleCase(id), desc: "" };
}

// Bag / shop section an item belongs to
export const POCKETS = [
  { id: "items", label: "Items", icon: "leftovers" },
  { id: "berries", label: "Berries", icon: "oran-berry" },
  { id: "medicine", label: "Medicine", icon: "potion" },
  { id: "battle", label: "Battle", icon: "x-attack" },
  { id: "key", label: "Key Items", icon: "thunder-stone" },
  { id: "tms", label: "TMs", icon: "tm-normal" },
];
export function pocketOf(id) {
  const item = ITEMS[id];
  if (!item || item.kind === "evo" || item.kind === "patch") return "key";
  if (item.kind === "bag") return item.effect?.boost || item.effect?.focusEnergy || item.effect?.mist ? "battle" : "medicine";
  return id.endsWith("-berry") ? "berries" : "items";
}
