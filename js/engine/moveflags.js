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
  twineedle feint metal-burst secret-power sacred-fire
`);

// Special moves that DO make contact
const CONTACT_SPECIAL = set("petal-dance grass-knot wring-out");

export const PUNCH = set(`
  bullet-punch comet-punch dizzy-punch drain-punch dynamic-punch fire-punch focus-punch hammer-arm
  ice-punch mach-punch mega-punch meteor-mash shadow-punch sky-uppercut thunder-punch
`);

export const SOUND = set(`
  grass-whistle growl heal-bell hyper-voice metal-sound perish-song roar screech sing snore
  supersonic uproar bug-buzz chatter
`);

// Reckless boosts these
export const RECOIL = set(`
  double-edge take-down submission brave-bird flare-blitz head-smash volt-tackle wood-hammer
  jump-kick hi-jump-kick
`);

// Charge on turn 1, hit on turn 2. Semi-invulnerable ones can't be hit (mostly) while charging.
export const TWO_TURN = {
  fly: { invulnerable: "air", text: "flew up high!" },
  bounce: { invulnerable: "air", text: "sprang up!" },
  dig: { invulnerable: "underground", text: "burrowed its way under the ground!" },
  dive: { invulnerable: "underwater", text: "hid underwater!" },
  "shadow-force": { invulnerable: "vanished", text: "vanished instantly!" },
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
