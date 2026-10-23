// =====================================================
// GYM BADGES (DESIGN.md §3k)
// -----------------------------------------------------
// Every gym leader has a personal badge with its own effect (Brock → Boulder Badge). Beating the leader in any run
// unlocks the badge for good: 40 badges (5 Challenge Gens × 8 gyms) in the meta save, shared by every run.
// Before a new run you put up to 8 badges in your badge case, a 4 × 2 grid (any generations). The case can't change
// during the run. Every badge is like a joker in Balatro: its own effect, nothing is repeated (EFFECTS below).
//
// Strength: a badge's strength is its gym number (1–8: the first gyms give weak effects, the last ones strong ones).
// Links: the case has 1, 2 or 3 random pairs of linked slots (new ones for every run). Two badges in a linked pair
// boost each other: +2 strength each. So where you put your badges matters. Effect numbers per strength: see EFFECTS.
// Set bonus: several badges of one generation anywhere in the case give your Pokémon a small stat bonus (§3k).
// Badge ids look like "1-3" (Challenge Gen 1, gym 3).
// =====================================================

import { readTable } from "./design-tables.js";

export const CASE_SIZE = 8;
export const CASE_COLUMNS = 4;
export const MAX_STRENGTH = 10;
export const LINK_BOOST = 2;

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
export const EFFECTS = {
  // Battle
  "sturdy-stone": { name: "Sturdy Stone", param: soft(lin(0.03, 0.02)), text: (v) => `Your Pokémon at full HP take ${pct(v)} less damage` },
  "weakness-guard": { name: "Bedrock", param: soft(lin(0.04, 0.02)), text: (v) => `Super effective moves against you deal ${pct(v)} less damage` },
  opener: { name: "Opening Salvo", param: soft(lin(0.08, 0.04)), text: (v) => `On the first turn of a battle your moves deal ${pct(v)} more damage` },
  "last-stand": { name: "Last Stand", param: soft(lin(0.06, 0.035)), text: (v) => `Your Pokémon below 1/3 HP deal ${pct(v)} more damage` },
  revenge: { name: "Vengeance", param: soft(lin(0.02, 0.01)), text: (v) => `+${pct(v)} damage for each of your Pokémon that has fainted this battle (up to 3)` },
  closer: { name: "Closer", param: soft(lin(0.04, 0.025)), text: (v) => `Your moves deal ${pct(v)} more damage to targets below half HP` },
  "super-effective": { name: "Weakness Hunter", param: soft(lin(0.03, 0.02)), text: (v) => `Your super effective moves deal ${pct(v)} more damage` },
  "stab-plus": { name: "Signature Style", param: soft(lin(0.02, 0.015)), text: (v) => `Same-type attack bonus +${pct(v)}` },
  "crit-eye": { name: "Sharp Eyes", param: soft(lin(0.02, 0.015)), text: (v) => `Your moves have a +${pct(v)} chance to be critical hits` },
  accuracy: { name: "Eagle Eye", param: soft(lin(0.02, 0.01)), text: (v) => `Your moves are ${pct(v)} more accurate` },
  dodge: { name: "Thick Fog", param: soft(lin(0.02, 0.01)), text: (v) => `Foes' moves are ${pct(v)} less accurate` },
  "multi-hit": { name: "Swarm", param: (L) => (L >= 5 ? 3 : 2), text: (v) => `Your multi-hit moves always hit at least ${v} times` },
  vampire: { name: "Vampire", param: soft(lin(0.03, 0.015)), text: (v) => `Your damaging moves heal you for ${pct(v)} of the damage dealt` },
  thorns: { name: "Spikes", param: soft(lin(0.02, 0.01)), text: (v) => `Foes that make contact with your Pokémon lose ${pct(v)} of their max HP` },
  regen: { name: "Regrowth", param: soft(lin(0.01, 0.005)), text: (v) => `Your Pokémon heal ${pct(v)} of their max HP at the end of every turn` },
  "ko-heal": { name: "Spoils of War", param: soft(lin(0.05, 0.03)), text: (v) => `A Pokémon that knocks out a foe recovers ${pct(v)} of its max HP` },
  "second-wind": { name: "Second Wind", param: lin(0.08, 0.05), text: (v) => `${pct(v)} chance that a Pokémon that would faint survives with 1 HP (once per battle)` },
  "stat-atk": { name: "Brawler", param: soft(lin(0.02, 0.01)), text: (v) => `+${pct(v)} Attack` },
  "stat-spa": { name: "Mind Over Matter", param: soft(lin(0.02, 0.01)), text: (v) => `+${pct(v)} Sp. Atk` },
  "stat-def": { name: "Iron Skin", param: soft(lin(0.02, 0.01)), text: (v) => `+${pct(v)} Defense` },
  "stat-spd": { name: "Dragon Scales", param: soft(lin(0.02, 0.01)), text: (v) => `+${pct(v)} Sp. Def` },
  "stat-spe": { name: "Tailwind", param: soft(lin(0.02, 0.01)), text: (v) => `+${pct(v)} Speed` },
  "para-ward": { name: "Static Guard", param: (L) => Math.min(0.9, 0.1 + 0.08 * (L - 1)), text: (v) => `${pct(v)} chance to block paralysis` },
  "poison-ward": { name: "Antidote Charm", param: (L) => Math.min(0.9, 0.1 + 0.08 * (L - 1)), text: (v) => `${pct(v)} chance to block poison` },
  "burn-ward": { name: "Frost Veil", param: (L) => Math.min(0.9, 0.1 + 0.08 * (L - 1)), text: (v) => `${pct(v)} chance to block burns` },
  "sleep-ward": { name: "Wide Awake", param: (L) => Math.min(0.9, 0.1 + 0.08 * (L - 1)), text: (v) => `${pct(v)} chance to block sleep` },
  "rain-start": { name: "Rainmaker", param: (L) => Math.min(5, 2 + Math.ceil(L / 2)), text: (v) => `Rain falls at the start of every battle (${v} turns)` },
  "sun-start": { name: "Sunbringer", param: (L) => Math.min(5, 2 + Math.ceil(L / 2)), text: (v) => `Harsh sunlight at the start of every battle (${v} turns)` },
  "sand-start": { name: "Sand Caller", param: (L) => Math.min(5, 2 + Math.ceil(L / 2)), text: (v) => `A sandstorm at the start of every battle (${v} turns)` },
  "hail-start": { name: "Cold Snap", param: (L) => Math.min(5, 2 + Math.ceil(L / 2)), text: (v) => `Hail at the start of every battle (${v} turns)` },
  // Run
  recruit: { name: "Extra Recruit", param: (L) => ({ cards: 1, picks: L >= 5 ? 1 : 0 }), text: (v) => `+${v.cards} card${v.picks ? ` and +${v.picks} pick` : ""} on every recruit screen` },
  swap: { name: "Swap", param: (L) => (L >= 5 ? 2 : 1), text: (v) => `${v === 1 ? "Once" : "Twice"} per recruit screen, swap one of your Pokémon for any card (no pick needed)` },
  reroll: { name: "Reroller", param: (L) => (L >= 6 ? 2 : 1), text: (v) => `+${v} free reroll${v > 1 ? "s" : ""} on every recruit screen` },
  scout: { name: "Scout", param: (L) => (L >= 6 ? 2 : 1), text: (v) => `+${v} card${v > 1 ? "s" : ""} on every recruit and item screen` },
  wallet: { name: "Lucky Wallet", param: soft(lin(0.1, 0.03)), text: (v) => `+${pct(v)} prize money` },
  hidden: { name: "Hidden Potential", param: soft(lin(0.03, 0.015)), text: (v) => `+${pct(v)} Hidden Ability chance for recruits` },
  gift: { name: "Gift Box", param: (L) => ({ cards: 1, picks: L >= 5 ? 1 : 0 }), text: (v) => `+${v.cards} card${v.picks ? ` and +${v.picks} pick` : ""} on every item screen` },
  tm: { name: "TM Master", param: soft(lin(0.15, 0.1)), text: (v) => `${pct(v)} chance of an extra TM after every battle` },
  interest: { name: "Interest", param: (L) => ({ rate: 0.03 + 0.01 * (L - 1), cap: 100 + 40 * (L - 1) }), text: (v) => `After every win you earn ${pct(v.rate)} of the money you hold (at most ₽${v.cap})` },
  haggler: { name: "Haggler", param: soft(lin(0.03, 0.015)), text: (v) => `Shop prices are ${pct(v)} lower` },
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
  ...row(1, ["sturdy-stone", "rain-start", "para-ward", "regen", "poison-ward", "stat-spa", "sun-start", "sand-start"]),
  ...row(2, ["stat-spe", "multi-hit", "wallet", "dodge", "stat-atk", "stat-def", "hail-start", "super-effective"]),
  ...row(3, ["weakness-guard", "opener", "crit-eye", "last-stand", "interest", "accuracy", "swap", "vampire"]),
  ...row(4, ["revenge", "reroll", "second-wind", "closer", "ko-heal", "thorns", "burn-ward", "recruit"]),
  ...row(5, ["scout", "stab-plus", "hidden", "sleep-ward", "haggler", "tm", "stat-spd", "gift"]),
]);
export const DEFAULT_SETS = [{ count: 3, pct: 2 }, { count: 5, pct: 4 }, { count: 8, pct: 6 }];

export function parseBadges(markdown) {
  const out = { perks: DEFAULT_BADGE_PERKS, sets: DEFAULT_SETS };
  if (!markdown.includes("### 3k.")) return out;
  const clean = (s) => String(s ?? "").replace(/[`*_]/g, "").trim();
  const rows = readTable(markdown, "### 3k.").map((r) => [clean(r["ID"]), clean(r["Perk"])]).filter(([id, perk]) => /^\d-\d$/.test(id) && perk);
  if (rows.length) out.perks = { ...DEFAULT_BADGE_PERKS, ...Object.fromEntries(rows) };
  if (markdown.includes("#### Set bonus")) {
    const sets = readTable(markdown, "#### Set bonus").map((r) => ({ count: Number(clean(r["Badges of one generation"])), pct: Number(clean(r["Stat bonus"]).replace("%", "")) })).filter((s) => s.count && s.pct);
    if (sets.length) out.sets = sets.sort((a, b) => a.count - b.count);
  }
  return out;
}

export const perkOfBadge = (rules, id) => (rules?.badges?.perks ?? DEFAULT_BADGE_PERKS)[id] ?? null;

// --- The case: 8 slots in a 4 × 2 grid (null = empty) ------------------------------------------------

// Random links: 1, 2 or 3 pairs of different slots, e.g. [[0, 6], [2, 3]]. rand() → [0, 1)
export function randomLinks(rand = Math.random) {
  const pairs = 1 + Math.floor(rand() * 3);
  const slots = Array.from({ length: CASE_SIZE }, (_, i) => i);
  for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
  return Array.from({ length: pairs }, (_, k) => [slots[2 * k], slots[2 * k + 1]].sort((a, b) => a - b));
}

// Strength of the badge in each slot: its gym number, +2 when it sits in a linked pair and the other slot of the pair
// also holds a badge (max 10). links = [[a, b], …]. → [{ id, slot, gen, gym, boost, strength }] for the filled slots
export function caseStrengths(slots, links = []) {
  return slots.map((id, i) => {
    if (!id) return null;
    const { gen, order } = parseBadgeId(id);
    const pair = links.find((l) => l.includes(i));
    const partner = pair ? pair[0] === i ? pair[1] : pair[0] : null;
    const boost = partner !== null && slots[partner] ? LINK_BOOST : 0;
    return { id, slot: i, gen, gym: order, boost, partner, strength: Math.min(MAX_STRENGTH, order + boost) };
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

// --- In a run: the case is frozen into run.badges = { slots: [8 ids or null], links: [[a, b], …], off: [ids whose effect is switched off], equipped: [ids], gen } ---

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
