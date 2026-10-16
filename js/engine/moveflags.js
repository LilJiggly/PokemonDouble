// =====================================================
// MOVE FLAGS (Gen 4)
// -----------------------------------------------------
// PokeAPI doesn't include move flags like "contact" or
// "sound", so they're listed here.
// =====================================================

const set = (s) => new Set(s.trim().split(/\s+/));

// Physical moves that do NOT make contact
const NON_CONTACT_PHYSICAL = set(`
  attack-order barrage beat-up bone-club bone-rush bonemerang bullet-seed earthquake egg-bomb
  explosion self-destruct fissure fling gunk-shot ice-shard icicle-spear magnet-bomb magnitude
  natural-gift pay-day pin-missile poison-sting present psycho-cut razor-leaf rock-blast rock-slide
  rock-throw rock-tomb rock-wrecker sand-tomb seed-bomb sky-attack spike-cannon stone-edge
  twineedle feint metal-burst secret-power sacred-fire bulldoze smack-down icicle-crash fusion-bolt
`);

// Special moves that DO make contact
const CONTACT_SPECIAL = set("petal-dance grass-knot wring-out");

export const PUNCH = set(`
  bullet-punch comet-punch dizzy-punch drain-punch dynamic-punch fire-punch focus-punch hammer-arm
  ice-punch mach-punch mega-punch meteor-mash shadow-punch sky-uppercut thunder-punch
`);

export const SOUND = set(`
  grass-whistle growl heal-bell hyper-voice metal-sound perish-song roar screech sing snore
  supersonic uproar bug-buzz chatter snarl relic-song round echoed-voice
`);

// Reckless boosts these
export const RECOIL = set(`
  double-edge take-down submission brave-bird flare-blitz head-smash volt-tackle wood-hammer
  jump-kick hi-jump-kick wild-charge head-charge
`);

// Charge on turn 1, hit on turn 2. Semi-invulnerable ones can't be hit (mostly) while charging.
export const TWO_TURN = {
  fly: { invulnerable: "air", text: "flew up high!" },
  bounce: { invulnerable: "air", text: "sprang up!" },
  dig: { invulnerable: "underground", text: "burrowed its way under the ground!" },
  dive: { invulnerable: "underwater", text: "hid underwater!" },
  "shadow-force": { invulnerable: "vanished", text: "vanished instantly!" },
  "sky-drop": { invulnerable: "air", text: "took the target high into the air!" },
  "solar-beam": { text: "absorbed light!" },
  "skull-bash": { text: "tucked in its head!" },
  "sky-attack": { text: "became cloaked in a harsh light!" },
  "razor-wind": { text: "whipped up a whirlwind!" },
};

// Moves that still hit a semi-invulnerable target (×2 power where noted)
export const HITS_INVULNERABLE = {
  air: { gust: 2, twister: 2, thunder: 1, "sky-uppercut": 1 },
  underground: { earthquake: 2, magnitude: 2, fissure: 1 },
  underwater: { surf: 2, whirlpool: 2 },
  vanished: {},
};

export const RECHARGE = set("hyper-beam giga-impact blast-burn hydro-cannon frenzy-plant rock-wrecker roar-of-time");

export const RAMPAGE = set("outrage thrash petal-dance");

export const THAWS_USER = set("flame-wheel sacred-fire");

export const WEATHER_HEAL = set("moonlight morning-sun synthesis");

export function makesContact(move) {
  if (move.category === "physical") return !NON_CONTACT_PHYSICAL.has(move.key);
  if (move.category === "special") return CONTACT_SPECIAL.has(move.key);
  return false;
}

// ---------------------------------------------------------------
// Moves that copy or call other moves (Gen 4 rules, simplified)
// ---------------------------------------------------------------

// Assist and Copycat can't call these
export const CALL_BANNED = set(`
  assist chatter copycat counter covet destiny-bond detect endure feint focus-punch follow-me helping-hand
  me-first metronome mimic mirror-coat mirror-move protect sketch sleep-talk snatch struggle switcheroo thief
  transform trick
`);
export const MIMIC_BANNED = set("chatter metronome mimic sketch struggle transform");
export const SKETCH_BANNED = set("chatter sketch struggle");
export const ME_FIRST_BANNED = set("chatter counter covet focus-punch me-first metronome mirror-coat struggle thief");
// Mirror Move only copies moves aimed at other Pokémon
export const MIRRORABLE_TARGETS = set("selected-pokemon selected-pokemon-me-first all-opponents all-other-pokemon random-opponent");

// Can't be used while Gravity is active
export const GRAVITY_BANNED = set("fly bounce jump-kick hi-jump-kick magnet-rise splash");

// Magic Coat bounces status moves aimed at the user's side, except these
export const REFLECT_TARGETS = set("selected-pokemon selected-pokemon-me-first all-opponents random-opponent");
export const REFLECT_BANNED = set(`
  psych-up role-play skill-swap transform mimic sketch guard-swap power-swap heart-swap pain-split
  perish-song conversion-2 mirror-move me-first
`);

// Snatch steals these kinds of status moves (aimed at the user or its side)
export const SNATCH_TARGETS = set("user users-field user-and-allies");
export const SNATCH_BANNED = set("snatch baton-pass copycat assist metronome sleep-talk conversion-2 splash teleport");

// ---------------------------------------------------------------
// Gen 5 moves
// ---------------------------------------------------------------

export const ALWAYS_CRIT = set("storm-throw frost-breath");
// Ignore the target's defensive stat stages
export const IGNORE_STAGES = set("chip-away sacred-sword");
// Special moves that hit the target's Defense
export const USES_DEFENSE = set("psyshock psystrike secret-sword");
export const PLEDGE = set("water-pledge fire-pledge grass-pledge");
