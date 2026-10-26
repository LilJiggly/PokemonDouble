// =====================================================
// GYM BADGES (DESIGN.md §3k)
// -----------------------------------------------------
// Every gym leader has a personal badge with its own effect (Brock → Boulder Badge). Beating the leader in any run
// unlocks the badge for good: 40 badges (5 Challenge Gens × 8 gyms) in the meta save, shared by every run.
// Before a new run you put up to 8 badges in your badge case, a 4 × 2 grid (any generations). The case can't change
// during the run. Every badge is like a joker in Balatro: its own effect, nothing is repeated (EFFECTS below).
//
// Strength: a badge's strength is its gym number (1–8: the first gyms give weak effects, the last ones strong ones).
// Zones: the 8 slots are split into random zones (groups of 1–3 touching slots, new ones for every run). Every zone
// boosts the badges inside it: +3 strength in a zone of one slot, +2 for two, +1 for three. So where you put your badges
// matters. Effect numbers per strength: see EFFECTS.
// Set bonus: several badges of one generation anywhere in the case give your Pokémon a small stat bonus (§3k).
// Badge ids look like "1-3" (Challenge Gen 1, gym 3).
// =====================================================

import { readTable } from "./design-tables.js";

export const CASE_SIZE = 8;
export const CASE_COLUMNS = 4;
export const MAX_STRENGTH = 10;
// Strength a zone adds to every badge in it, by the number of slots in the zone
export const ZONE_BOOST = { 1: 3, 2: 2, 3: 1 };
export const zoneBoost = (size) => ZONE_BOOST[size] ?? 1;

// Badge names per Challenge Gen, in gym order (Unova = Black 2 / White 2)
export const BADGE_NAMES = {
  1: ["Boulder", "Cascade", "Thunder", "Rainbow", "Soul", "Marsh", "Volcano", "Earth"],
  2: ["Zephyr", "Hive", "Plain", "Fog", "Storm", "Mineral", "Glacier", "Rising"],
  3: ["Stone", "Knuckle", "Dynamo", "Heat", "Balance", "Feather", "Mind", "Rain"],
  4: ["Coal", "Forest", "Relic", "Cobble", "Fen", "Mine", "Icicle", "Beacon"],
  5: ["Basic", "Toxic", "Insect", "Bolt", "Quake", "Jet", "Legend", "Wave"],
};
export const badgeId = (gen, order) => `${gen}-${order}`;
export const parseBadgeId = (id) => { const [gen, order] = String(id).split("-").map(Number); return { gen, order }; };
export const badgeName = (gen, order) => `${BADGE_NAMES[gen]?.[order - 1] ?? `Gym ${order}`} Badge`;
export const badgeImage = (id) => `images/badges/${id}.png`;
export const ALL_BADGES = [1, 2, 3, 4, 5].flatMap((gen) => Array.from({ length: 8 }, (_, i) => badgeId(gen, i + 1)));

// --- The effects ---------------------------------------------------------------------------------
// param(strength): the number the game uses (a fraction, a chance, a count, or { … } for effects with two numbers).
// text(param): what it says. Strength 1 is weak (a few percent), strength 8–10 is strong.
const pct = (v) => `${Math.round(v * 1000) / 10}%`;
const lin = (base, step) => (L) => base + step * (L - 1);
// Damage, stat and heal effects are toned down: x0.7
const soft = (f) => (L) => Math.round(f(L) * 0.7 * 1000) / 1000;
const wardText = (what) => (v) => `Each time something tries to ${what} one of your Pokémon, there is a ${pct(v)} chance it is stopped`;
const ward = (name, what) => ({ name, param: (L) => Math.min(0.75, 0.1 + 0.07 * (L - 1)), text: wardText(what) });
export const EFFECTS = {
  // Battle
  "sturdy-stone": { name: "Sturdy Stone", param: soft(lin(0.03, 0.02)), text: (v) => `A Pokémon at full HP takes ${pct(v)} less damage from every hit` },
  "weakness-guard": { name: "Bedrock", param: soft(lin(0.04, 0.02)), text: (v) => `Attacks that are super effective against your Pokémon do ${pct(v)} less damage` },
  opener: { name: "Opening Salvo", param: soft(lin(0.06, 0.03)), text: (v) => `On turn 1 of every battle, your attacks do ${pct(v)} more damage` },
  "last-stand": { name: "Last Stand", param: soft(lin(0.05, 0.03)), text: (v) => `Your Pokémon with less than a third of their HP left do ${pct(v)} more damage` },
  revenge: { name: "Vengeance", param: soft(lin(0.02, 0.01)), text: (v) => `Each of your Pokémon that has fainted in this battle adds ${pct(v)} to your damage (up to 3 fainted)` },
  closer: { name: "Closer", param: soft(lin(0.04, 0.025)), text: (v) => `Your attacks do ${pct(v)} more damage to foes at half HP or less` },
  "super-effective": { name: "Weakness Hunter", param: soft(lin(0.03, 0.02)), text: (v) => `Your super effective attacks do ${pct(v)} more damage` },
  "stab-plus": { name: "Signature Style", param: soft(lin(0.02, 0.015)), text: (v) => `Attacks that match the user's own type get ${pct(v)} extra power, on top of the usual bonus` },
  "crit-eye": { name: "Sharp Eyes", param: soft(lin(0.02, 0.015)), text: (v) => `Your attacks have ${pct(v)} extra chance to be critical hits` },
  accuracy: { name: "Eagle Eye", param: soft(lin(0.02, 0.01)), text: (v) => `Your attacks are ${pct(v)} more likely to hit` },
  dodge: { name: "Thick Fog", param: soft(lin(0.02, 0.01)), text: (v) => `Foes' attacks are ${pct(v)} more likely to miss` },
  "multi-hit": { name: "Swarm", param: (L) => (L >= 6 ? 3 : 2), text: (v) => `Moves that hit several times hit at least ${v} times` },
  vampire: { name: "Vampire", param: soft(lin(0.03, 0.015)), text: (v) => `Your Pokémon heal ${pct(v)} of the damage they deal` },
  thorns: { name: "Spikes", param: soft(lin(0.02, 0.01)), text: (v) => `Foes that hit your Pokémon with a contact move lose ${pct(v)} of their max HP` },
  regen: { name: "Regrowth", param: soft(lin(0.01, 0.005)), text: (v) => `Your Pokémon heal ${pct(v)} of their max HP at the end of every turn` },
  "ko-heal": { name: "Spoils of War", param: soft(lin(0.04, 0.025)), text: (v) => `A Pokémon that knocks out a foe heals ${pct(v)} of its max HP` },
  "second-wind": { name: "Second Wind", param: lin(0.05, 0.03), text: (v) => `When one of your Pokémon would faint, there is a ${pct(v)} chance it hangs on with 1 HP instead (once per battle)` },
  "stat-atk": { name: "Brawler", param: soft(lin(0.02, 0.01)), text: (v) => `Your Pokémon's Attack is ${pct(v)} higher` },
  "stat-spa": { name: "Mind Over Matter", param: soft(lin(0.02, 0.01)), text: (v) => `Your Pokémon's Sp. Atk is ${pct(v)} higher` },
  "stat-def": { name: "Iron Skin", param: soft(lin(0.02, 0.01)), text: (v) => `Your Pokémon's Defense is ${pct(v)} higher` },
  "stat-spd": { name: "Dragon Scales", param: soft(lin(0.02, 0.01)), text: (v) => `Your Pokémon's Sp. Def is ${pct(v)} higher` },
  "stat-spe": { name: "Tailwind", param: soft(lin(0.02, 0.01)), text: (v) => `Your Pokémon's Speed is ${pct(v)} higher` },
  "para-ward": ward("Static Guard", "paralyze"),
  "poison-ward": ward("Antidote Charm", "poison"),
  "burn-ward": ward("Frost Veil", "burn"),
  "sleep-ward": ward("Wide Awake", "put to sleep"),
  "rain-start": { name: "Rainmaker", param: (L) => Math.min(5, 2 + Math.ceil(L / 2)), text: (v) => `Rain starts when every battle begins and lasts ${v} turns` },
  // Only Rainmaker calls weather, so weather badges never clash; the others boost a family of types
  "fire-boost": { name: "Sunbringer", param: soft(lin(0.04, 0.02)), text: (v) => `Your Fire moves do ${pct(v)} more damage` },
  "rock-boost": { name: "Sand Caller", param: soft(lin(0.04, 0.02)), text: (v) => `Your Rock, Ground and Steel moves do ${pct(v)} more damage` },
  "ice-boost": { name: "Cold Snap", param: soft(lin(0.04, 0.02)), text: (v) => `Your Ice moves do ${pct(v)} more damage` },
  // Run
  recruit: { name: "Extra Recruit", param: (L) => ({ cards: 1, picks: L >= 8 ? 1 : 0 }), text: (v) => `Every recruit screen shows ${v.cards} more card${v.cards > 1 ? "s" : ""}${v.picks ? ` and lets you take ${v.picks} more Pokémon` : ""}` },
  swap: { name: "Swap", param: (L) => (L >= 8 ? 2 : 1), text: (v) => `On every recruit screen you can trade one of your Pokémon for any card, ${v === 1 ? "once" : "twice"}. A trade doesn't use a pick` },
  reroll: { name: "Reroller", param: (L) => (L >= 8 ? 2 : 1), text: (v) => `${v} extra free reroll${v > 1 ? "s" : ""} on every recruit screen` },
  scout: { name: "Scout", param: (L) => (L >= 8 ? 2 : 1), text: (v) => `${v} extra card${v > 1 ? "s" : ""} on every recruit screen and item screen` },
  wallet: { name: "Lucky Wallet", param: soft(lin(0.05, 0.025)), text: (v) => `You earn ${pct(v)} more prize money after every win` },
  hidden: { name: "Hidden Potential", param: soft(lin(0.03, 0.015)), text: (v) => `${pct(v)} extra chance that a recruit has its Hidden Ability` },
  gift: { name: "Gift Box", param: (L) => ({ cards: 1, picks: L >= 8 ? 1 : 0 }), text: (v) => `Every item screen shows ${v.cards} more card${v.cards > 1 ? "s" : ""}${v.picks ? ` and lets you take ${v.picks} more item` : ""}` },
  tm: { name: "TM Master", param: soft(lin(0.1, 0.05)), text: (v) => `After every win there is a ${pct(v)} chance to get a second TM` },
  interest: { name: "Interest", param: (L) => ({ rate: 0.02 + 0.007 * (L - 1), cap: 60 + 25 * (L - 1) }), text: (v) => `After every win you earn ${pct(v.rate)} of the money you hold (at most ₽${v.cap})` },
  haggler: { name: "Haggler", param: soft(lin(0.03, 0.015)), text: (v) => `Everything in the shop costs ${pct(v)} less` },
};

// Name, text and number of an effect at a strength
export function perkInfo(perkId, strength = 1) {
  const e = EFFECTS[perkId];
  if (!e) return { name: String(perkId), effect: "", param: null };
  const param = e.param(strength);
  return { name: e.name, effect: e.text(param), param };
}

// Which effect each leader's badge gives (used when §3k is missing from DESIGN.md)
const row = (gen, ids) => ids.map((id, i) => [`${gen}-${i + 1}`, id]);
export const DEFAULT_BADGE_PERKS = Object.fromEntries([
  ...row(1, ["sturdy-stone", "rain-start", "para-ward", "regen", "poison-ward", "stat-spa", "fire-boost", "rock-boost"]),
  ...row(2, ["stat-spe", "multi-hit", "wallet", "dodge", "stat-atk", "stat-def", "ice-boost", "super-effective"]),
  ...row(3, ["weakness-guard", "opener", "crit-eye", "last-stand", "interest", "accuracy", "swap", "vampire"]),
  ...row(4, ["revenge", "reroll", "second-wind", "closer", "ko-heal", "thorns", "burn-ward", "recruit"]),
  ...row(5, ["scout", "stab-plus", "hidden", "sleep-ward", "haggler", "tm", "stat-spd", "gift"]),
]);
// The stat every badge raises by itself (like the badges of the main games): by the gym's type. It is always on;
// only the secondary effect (EFFECTS) has an on / off switch. The table in §3k can override it (Stat column).
export const DEFAULT_BADGE_STATS = {
  "1-1": "def", "1-2": "spd", "1-3": "spe", "1-4": "spd", "1-5": "atk", "1-6": "spa", "1-7": "spa", "1-8": "atk",
  "2-1": "spe", "2-2": "atk", "2-3": "def", "2-4": "spa", "2-5": "atk", "2-6": "def", "2-7": "spd", "2-8": "spa",
  "3-1": "def", "3-2": "atk", "3-3": "spe", "3-4": "spa", "3-5": "def", "3-6": "spe", "3-7": "spa", "3-8": "spd",
  "4-1": "def", "4-2": "spd", "4-3": "spa", "4-4": "atk", "4-5": "spd", "4-6": "def", "4-7": "spd", "4-8": "spe",
  "5-1": "def", "5-2": "atk", "5-3": "atk", "5-4": "spe", "5-5": "atk", "5-6": "spe", "5-7": "spa", "5-8": "spd",
};
export const STAT_NAME = { atk: "Attack", def: "Defense", spa: "Sp. Atk", spd: "Sp. Def", spe: "Speed" };
// How much of that stat a badge gives at a strength: 1% at strength 1 up to 5.5% at strength 10
export const badgeStatBoost = (strength) => Math.round((0.01 + 0.005 * (strength - 1)) * 1000) / 1000;
export const DEFAULT_SETS = [{ count: 3, pct: 2 }, { count: 5, pct: 4 }, { count: 8, pct: 6 }];

export function parseBadges(markdown) {
  const out = { perks: DEFAULT_BADGE_PERKS, sets: DEFAULT_SETS, stats: DEFAULT_BADGE_STATS };
  if (!markdown.includes("### 3k.")) return out;
  const clean = (s) => String(s ?? "").replace(/[`*_]/g, "").trim();
  const rows = readTable(markdown, "### 3k.").map((r) => [clean(r["ID"]), clean(r["Perk"])]).filter(([id, perk]) => /^\d-\d$/.test(id) && perk);
  if (rows.length) out.perks = { ...DEFAULT_BADGE_PERKS, ...Object.fromEntries(rows) };
  const statRows = readTable(markdown, "### 3k.").map((r) => [clean(r["ID"]), clean(r["Stat"]).toLowerCase()]).filter(([id, st]) => /^\d-\d$/.test(id) && STAT_NAME[st]);
  if (statRows.length) out.stats = { ...DEFAULT_BADGE_STATS, ...Object.fromEntries(statRows) };
  if (markdown.includes("#### Set bonus")) {
    const sets = readTable(markdown, "#### Set bonus").map((r) => ({ count: Number(clean(r["Badges of one generation"])), pct: Number(clean(r["Stat bonus"]).replace("%", "")) })).filter((s) => s.count && s.pct);
    if (sets.length) out.sets = sets.sort((a, b) => a.count - b.count);
  }
  return out;
}

export const statOfBadge = (rules, id) => (rules?.badges?.stats ?? DEFAULT_BADGE_STATS)[id] ?? null;
export const perkOfBadge = (rules, id) => (rules?.badges?.perks ?? DEFAULT_BADGE_PERKS)[id] ?? null;

// --- The case: 8 slots in a 4 × 2 grid (null = empty) ------------------------------------------------

// Random zones: the 4 × 2 case split into rectangles of 1–3 slots (one slot, two side by side, two on top of each other,
// or three in a row), like the boxes in the sketch. rand() → [0, 1). Slots are numbered row by row: 0–3 on top, 4–7 below.
const ZONE_SHAPES = [[1, 1], [1, 1], [1, 2], [1, 2], [2, 1], [1, 3]]; // [rows, columns], the common shapes twice
export function randomZones(rand = Math.random) {
  const rows = CASE_SIZE / CASE_COLUMNS;
  const taken = new Set();
  const zones = [];
  for (let i = 0; i < CASE_SIZE; i++) {
    if (taken.has(i)) continue;
    const row = Math.floor(i / CASE_COLUMNS), col = i % CASE_COLUMNS;
    const fits = ZONE_SHAPES.filter(([h, w]) => {
      if (row + h > rows || col + w > CASE_COLUMNS) return false;
      for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) if (taken.has((row + r) * CASE_COLUMNS + col + c)) return false;
      return true;
    });
    const [h, w] = fits[Math.floor(rand() * fits.length)];
    const zone = [];
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) { const n = (row + r) * CASE_COLUMNS + col + c; taken.add(n); zone.push(n); }
    zones.push(zone);
  }
  return zones;
}

// Are these zones rectangles that cover the whole case? (older saves had pairs and odd shapes)
export function validZones(zones) {
  const flat = (zones ?? []).flat();
  if (new Set(flat).size !== CASE_SIZE || flat.length !== CASE_SIZE) return false;
  return zones.every((z) => {
    const cols = new Set(z.map((n) => n % CASE_COLUMNS)), rows = new Set(z.map((n) => Math.floor(n / CASE_COLUMNS)));
    return z.length === cols.size * rows.size && Math.max(...cols) - Math.min(...cols) + 1 === cols.size && Math.max(...rows) - Math.min(...rows) + 1 === rows.size;
  });
}
export const randomLinks = randomZones; // older name

// Strength of the badge in each slot: its gym number plus the boost of the zone it sits in (max 10).
// links = the zones: [[0, 1], [2], …]. → [{ id, slot, gen, gym, zone, boost, strength }] for the filled slots
export function caseStrengths(slots, links = []) {
  return slots.map((id, i) => {
    if (!id) return null;
    const { gen, order } = parseBadgeId(id);
    const zone = links.findIndex((z) => z.includes(i));
    const boost = zone === -1 ? 0 : zoneBoost(links[zone].length);
    return { id, slot: i, gen, gym: order, zone, boost, strength: Math.min(MAX_STRENGTH, order + boost) };
  }).filter(Boolean);
}

// Set bonus: badges from one generation. Each generation with enough badges adds its best tier. → { pct, parts }
export function setBonus(ids, rules) {
  const sets = rules?.badges?.sets ?? DEFAULT_SETS;
  const byGen = {};
  for (const id of ids.filter(Boolean)) byGen[parseBadgeId(id).gen] = (byGen[parseBadgeId(id).gen] ?? 0) + 1;
  const parts = [];
  for (const [gen, count] of Object.entries(byGen)) {
    const tier = [...sets].reverse().find((s) => count >= s.count);
    if (tier) parts.push({ gen: Number(gen), count, pct: tier.pct });
  }
  return { pct: parts.reduce((n, p) => n + p.pct, 0), parts };
}

// --- In a run: the case is frozen into run.badges = { slots: [8 ids or null], links: the zones [[0, 1], [2], …], off: [ids whose effect is switched off], equipped: [ids], gen } ---

// Effect id → { strength, param } for the equipped badges
export function activeEffects(run, rules) {
  const out = {};
  const off = new Set(run.badges?.off ?? []); // effects you switched off in the badge case
  for (const b of caseStrengths(run.badges?.slots ?? run.badges?.equipped ?? [], run.badges?.links ?? [])) {
    if (off.has(b.id)) continue;
    const perk = perkOfBadge(rules, b.id);
    if (perk && EFFECTS[perk]) out[perk] = { strength: b.strength, param: EFFECTS[perk].param(b.strength), id: b.id };
  }
  return out;
}
export const hasPerk = (run, rules, perkId) => !!activeEffects(run, rules)[perkId];
// The number of a run effect (what it adds), or `none` when the badge isn't worn
export const perkParam = (run, rules, perkId, none = 0) => activeEffects(run, rules)[perkId]?.param ?? none;

// What the battle needs from the case: { stats: { atk: 0.04, … }, effects: { opener: 0.12, … } } (or null).
// Run effects are left out, they are used in run.js.
const STAT_EFFECTS = { "stat-atk": "atk", "stat-spa": "spa", "stat-def": "def", "stat-spd": "spd", "stat-spe": "spe" };
const RUN_EFFECTS = new Set(["recruit", "swap", "reroll", "scout", "wallet", "hidden", "gift", "tm", "interest", "haggler"]);
export function battleBonus(run, rules) {
  const slots = run.badges?.slots ?? run.badges?.equipped ?? [];
  const set = setBonus(slots, rules).pct / 100;
  const stats = { atk: set, def: set, spa: set, spd: set, spe: set };
  const effects = {};
  // Every badge raises its own stat, whether or not its effect is switched on
  for (const b of caseStrengths(slots, run.badges?.links ?? [])) {
    const stat = statOfBadge(rules, b.id);
    if (stat) stats[stat] += badgeStatBoost(b.strength);
  }
  for (const [id, e] of Object.entries(activeEffects(run, rules))) {
    if (STAT_EFFECTS[id]) stats[STAT_EFFECTS[id]] += e.param;
    else if (!RUN_EFFECTS.has(id)) effects[id] = e.param;
  }
  return Object.values(stats).some(Boolean) || Object.keys(effects).length ? { stats, effects } : null;
}

// --- In the meta save ---

export const ownedBadges = (meta) => new Set(meta.badges ?? []);

// A gym leader was beaten: unlock the badge. Returns true when it is new.
export function unlockBadge(meta, gen, order) {
  const id = badgeId(gen, order);
  meta.badges ??= [];
  if (meta.badges.includes(id)) return false;
  meta.badges.push(id);
  return true;
}

// The badge case with only badges you own, always CASE_SIZE long (empty slots are null)
export function caseOf(meta) {
  const owned = ownedBadges(meta);
  const seen = new Set();
  return Array.from({ length: CASE_SIZE }, (_, i) => {
    const id = meta.badgeCase?.[i];
    if (!id || !owned.has(id) || seen.has(id)) return null;
    seen.add(id);
    return id;
  });
}

// Put a badge into a slot (or the first free one), taking it out of its old slot first. Returns false if there is no room.
export function placeBadge(meta, id, slot = null) {
  const slots = caseOf(meta);
  if (!ownedBadges(meta).has(id)) return false;
  const from = slots.indexOf(id);
  const to = slot ?? slots.findIndex((s) => s === null);
  if (to === -1) return false;
  if (to === from) return true;
  if (from !== -1) slots[from] = slots[to]; // dragging between slots swaps them
  slots[to] = id;
  meta.badgeCase = slots;
  return true;
}

export function removeBadge(meta, slot) {
  const slots = caseOf(meta);
  slots[slot] = null;
  meta.badgeCase = slots;
}
