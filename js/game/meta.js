// =====================================================
// ROGUELITE PROGRESSION (DESIGN.md §3i)
// -----------------------------------------------------
// Trainer Points (TP) earned at the end of every run,
// spent on permanent Trainer upgrades. Saved separately
// from runs, so it survives losing.
// =====================================================

import { noteRunEnd } from "./progress.js";
import { MONO_TYPES } from "./challenges.js";

export const META_KEY = "pd.meta";

// Version 1 = the skill tree (older saves had seven flat upgrades, refunded). Version 2 = the run rules open by wins, so the
// Modes nodes left the tree and what was spent on them is refunded.
export const TREE_VERSION = 2;
const REMOVED_NODE_COST = { "mode-moves": 40, "mode-levels": 40, "mode-mons": 40, "mode-hard": 60, "mode-noitems": 50, "mode-opponents": 80, "mode-mono": 60 };
// What the old upgrades cost per level, for the refund
const OLD_UPGRADE_COST = { scout: 1, dice: 5, allowance: 3, bag: 3, gift: 1, hidden: 5, shiny: 5 };

export function emptyMeta() {
  return { treeVersion: TREE_VERSION, tp: 0, earned: 0, runs: 0, upgrades: {}, character: "lucas", sprites: "gen5", wins: 0, winGens: {}, best: 0, reach: {}, badges: [], badgeCase: [], badgeLinks: [], badgeOff: [] };
}

// Saves from before the skill tree: every Trainer Point spent on the old upgrades comes back and the upgrades start over.
// Safe to call again: it only acts on a save without a tree version. Returns true when it changed something.
export function migrateMeta(meta) {
  if (!meta || meta.treeVersion >= TREE_VERSION) return false;
  let refund = 0;
  if (!(meta.treeVersion >= 1)) { // the old flat upgrades
    for (const [id, level] of Object.entries(meta.upgrades ?? {})) refund += (OLD_UPGRADE_COST[id] ?? 0) * (Number(level) || 0);
    meta.upgrades = {};
  }
  for (const [id, cost] of Object.entries(REMOVED_NODE_COST)) { // the Modes nodes
    if ((meta.upgrades?.[id] ?? 0) > 0) { refund += cost; delete meta.upgrades[id]; }
  }
  meta.tp = (meta.tp ?? 0) + refund;
  meta.treeVersion = TREE_VERSION;
  if (refund > 0) meta.refundNote = (meta.refundNote ?? 0) + refund; // shown once on the skill tree screen
  return true;
}

export function loadMeta(storage = globalThis.localStorage) {
  try {
    const raw = JSON.parse(storage.getItem(META_KEY));
    // A brand new save starts on the tree; an old one is migrated (and refunded) as it is read
    const meta = { ...emptyMeta(), ...raw };
    if (raw && !(raw.treeVersion >= TREE_VERSION)) { meta.treeVersion = raw.treeVersion ?? 0; migrateMeta(meta); }
    return meta;
  } catch {
    return emptyMeta();
  }
}

// At start up: write a migrated save back, so the refund is stored once (and reaches the cloud save)
export function persistMigration(storage = globalThis.localStorage) {
  try {
    const raw = JSON.parse(storage.getItem(META_KEY));
    if (raw && !(raw.treeVersion >= TREE_VERSION)) saveMeta(loadMeta(storage), storage);
  } catch { /* ignore */ }
}

// The browser build registers a listener (cloud save) that hears about every save
let saveListener = null;
export function onSave(fn) { saveListener = fn; }
export function noteSave() { saveListener?.(); }
export function saveMeta(meta, storage = globalThis.localStorage) {
  try { storage.setItem(META_KEY, JSON.stringify(meta)); } catch { /* storage blocked */ }
  saveListener?.();
}

export function upgradeLevel(meta, id) {
  return meta.upgrades[id] ?? 0;
}

// ---- the skill tree (nodes come from the DESIGN.md §3i table, see rules.js) ----

const needMet = (meta, { kind, arg }) => kind === "wins" ? (meta.wins ?? 0) >= Number(arg)
  : kind === "earned" ? (meta.earned ?? 0) >= Number(arg)
    : kind === "challenge" ? (meta.challenges ?? []).includes(arg) : true;

// What is stopping you from buying the next level of a node: null (nothing), or a short reason
export function lockReason(meta, upgrade, nodes) {
  for (const r of upgrade.requires ?? []) {
    if (upgradeLevel(meta, r.id) < r.level) return `Needs ${nodes?.find((n) => n.id === r.id)?.name ?? r.id}${r.level > 1 ? ` level ${r.level}` : ""}`;
  }
  for (const n of upgrade.needs ?? []) {
    if (!needMet(meta, n)) return n.kind === "wins" ? `Win ${n.arg} run${n.arg > 1 ? "s" : ""} (${meta.wins ?? 0} so far)` : n.kind === "earned" ? `Earn ${n.arg} TP in total` : `Beat the ${n.arg} challenge`;
  }
  return null;
}

export const nextCost = (meta, upgrade) => upgrade.costs[upgradeLevel(meta, upgrade.id)];

export function canBuyUpgrade(meta, upgrade, nodes) {
  return upgradeLevel(meta, upgrade.id) < upgrade.max && !lockReason(meta, upgrade, nodes) && meta.tp >= nextCost(meta, upgrade);
}

export function buyUpgrade(meta, upgrade, nodes) {
  if (!canBuyUpgrade(meta, upgrade, nodes)) return false;
  meta.tp -= nextCost(meta, upgrade);
  meta.upgrades[upgrade.id] = upgradeLevel(meta, upgrade.id) + 1;
  return true;
}

const BASE_PERKS = new Set(["scout", "dice", "allowance", "bag", "gift", "hidden", "shiny", "shiny2"]); // (these are read by node id above)
// The upgrades a new run starts with (copied into the run, so later purchases don't change it)
// rules: the parsed rules (for the tree's stat bonuses, Trainer Point bonus and unlocked features)
export function perksFromMeta(meta, rules = null) {
  const lvl = (id) => upgradeLevel(meta, id);
  const perks = {
    scout: lvl("scout"),
    dice: lvl("dice"),
    allowance: lvl("allowance"),
    bag: lvl("bag"),
    gift: lvl("gift"),
    hidden: lvl("hidden"),
    shiny: lvl("shiny"),
    shiny2: lvl("shiny2"),
    tree: { flat: {}, pct: {}, run: {} }, // stat bonuses for the whole team in battle, and run effects (haggler, swap…). The tree does nothing else in a fight
    tpPct: 0, // % more Trainer Points at the end of the run
    unlocked: [], // features: starter-pick, mode-moves…
  };
  for (const u of rules?.upgrades ?? []) {
    const level = lvl(u.id);
    if (!level) continue;
    for (const part of u.does.split(";")) { // a node can do several things
      const [kind, a, b] = part.trim().split(":");
      if (kind === "stat-flat") perks.tree.flat[a] = (perks.tree.flat[a] ?? 0) + Number(b) * level;
      else if (kind === "stat-pct") perks.tree.pct[a] = (perks.tree.pct[a] ?? 0) + (Number(b) * level) / 100;
      else if (kind === "tp-pct") perks.tpPct += Number(a) * level;
      else if (kind === "unlock") perks.unlocked.push(a);
      else if (kind === "run") perks.tree.run[a] = (perks.tree.run[a] ?? 0) + Number(b) * level;
      else if (kind === "perk" && !BASE_PERKS.has(a)) perks[a] = (perks[a] ?? 0) + Number(b) * level; // a perk without its own line above (IV floor, Type Magnet…), added up over its nodes
    }
  }
  return perks;
}

// How many times you have won a generation (its normal path or its evil team path)
// (gen "m" = Mixed Gens: your best generation, plus the Mixed Gens wins)
export const winsInGen = (meta, gen) => gen === "m" ? Math.max(0, ...[1, 2, 3, 4, 5].map((g) => winsInGen(meta, g))) + (meta.mixedWins ?? 0) : (meta.winGens?.[gen] ?? 0) + (meta.evilWins?.[gen] ?? 0);

// Mono type opens when you have done any 3 of these 6 trials (any run, any generation): a mix of skill, risk and exploring
export const MONO_TRIALS_NEEDED = 3;
export const monoChallengesDone = (meta) => MONO_TYPES.filter((m) => (meta.challenges ?? []).includes(m.id)).length;
export function monoTrials(meta) {
  const has = (id) => (meta.challenges ?? []).includes(id);
  const types = monoChallengesDone(meta);
  return [
    { id: "types", label: `Beat 3 type challenges (${Math.min(types, 3)} of 3)`, done: types >= 3 },
    { id: "hard", label: "Win with Hard mode on", done: has("hard-win") },
    { id: "flawless", label: "Win without losing a Pokémon", done: has("flawless") },
    { id: "legend", label: "Win with a Legendary or Mythical on your team", done: has("legend") },
    { id: "evil", label: "Win an evil team path", done: [1, 2, 3, 4, 5].some((g) => (meta.evilWins?.[g] ?? 0) > 0) || [1, 2, 3, 4, 5].some((g) => has(`evil-${g}`)) },
    { id: "all", label: "Win all five generations", done: [1, 2, 3, 4, 5].every((g) => (meta.winGens?.[g] ?? 0) > 0) },
  ];
}
export const monoTrialsDone = (meta) => monoTrials(meta).filter((t) => t.done).length;

// The run rules and picks you can use: the ones the Skill Tree unlocks, and the rules that open by winning THE generation you are about to play
export function unlockedRules(meta, rules, gen) {
  const set = new Set(perksFromMeta(meta, rules).unlocked);
  const wins = winsInGen(meta, gen);
  for (const [id, need] of Object.entries(rules?.ruleUnlocks ?? {})) if (wins >= need) set.add(id);
  if (monoTrialsDone(meta) >= MONO_TRIALS_NEEDED) set.add("mode-mono"); // Mono type opens with the trials above, not with wins
  return set;
}

// Respec: take back every upgrade for most of the Trainer Points spent on them (a fee of 20%)
export const RESPEC_FEE = 0.2;
export function spentOnTree(meta, nodes) {
  let spent = 0;
  for (const n of nodes) for (let i = 0; i < upgradeLevel(meta, n.id); i++) spent += n.costs[i] ?? 0;
  return spent;
}
export function respecTree(meta, nodes) {
  const spent = spentOnTree(meta, nodes);
  const refund = Math.floor(spent * (1 - RESPEC_FEE));
  for (const n of nodes) delete meta.upgrades[n.id];
  meta.tp += refund;
  meta.respecFees = (meta.respecFees ?? 0) + (spent - refund); // (for the Trainer Points check)
  return { spent, refund, fee: spent - refund };
}

// Trainer Points check (Profile → Stats): what you earned, spent and have left, and the least you must have earned by now.
// A won run pays at least a full run (every gym, Elite Four member, the Champion and the Hall of Fame), so wins × that is a floor.
// Champion wins as the records count them: every win is also counted in its generation, evil path, Mixed Gens or Gauntlet counter. Those
// counters were never added up when two saves were combined (the total was), so a total above this sum counted some wins twice.
export function recordedWins(meta) {
  const sum = (o) => Object.values(o ?? {}).reduce((a, n) => a + (Number(n) || 0), 0);
  return sum(meta.winGens) + sum(meta.evilWins) + (meta.mixedWins ?? 0) + (meta.gauntletWins ?? 0);
}
export const winsCheck = (meta) => ({ saved: meta.wins ?? 0, records: recordedWins(meta), extra: Math.max(0, (meta.wins ?? 0) - recordedWins(meta)) });
// The counters that were added together when two saves were combined (so they were doubled by the same factor as the wins)
const COMBINED_COUNTERS = ["earned", "runs", "cleanWins", "battlesWon", "battlesLost", "battleTurns", "battleTurnCount", "pokemonLost", "recruited", "shiniesFound", "evolutionsDone", "rerollsDone", "playMs", "forfeits"];
// Bring the total back to the records, and the counters that were doubled with it by the same share. The Trainer Points are worked out again
// as earned minus what the Skill Tree upgrades cost (the upgrades were not added together, so they are right). Returns how many wins were taken off.
export function fixWins(meta, nodes = null) {
  const { extra, records, saved } = winsCheck(meta);
  if (extra <= 0) return 0;
  const share = records / saved;
  for (const k of COMBINED_COUNTERS) if (typeof meta[k] === "number") meta[k] = Math.round(meta[k] * share);
  meta.wins = records;
  meta.runs = Math.max(meta.runs ?? 0, records);
  meta.cleanWins = Math.min(meta.cleanWins ?? 0, records);
  if (nodes) meta.tp = Math.max(0, (meta.earned ?? 0) - spentOnTree(meta, nodes) - (meta.respecFees ?? 0));
  return extra;
}

export function tpCheck(meta, rules) {
  const t = rules.tp;
  const fullRun = t.gym * 8 + t.elite * 4 + t.champion + t.hallOfFame;
  const earned = meta.earned ?? 0;
  const floor = Math.min(meta.wins ?? 0, recordedWins(meta)) * fullRun; // (not more than the records show: a doubled total must not pay out)
  return { earned, spent: spentOnTree(meta, rules.upgrades), left: meta.tp ?? 0, fees: meta.respecFees ?? 0, fullRun, floor, missing: Math.max(0, floor - earned) };
}
// If the earned total is below that floor (a save that lost progress), bring earned and the balance up to it. Returns the points added.
export function restoreTp(meta, rules) {
  const { missing } = tpCheck(meta, rules);
  if (missing > 0) { meta.earned = (meta.earned ?? 0) + missing; meta.tp = (meta.tp ?? 0) + missing; }
  return missing;
}

// How many battles of the run were beaten (a win = all 14)
export function beatenCount(run) {
  if (run.settings?.path === "gauntlet") { // 6 battles a chapter, the first is battle 9
    const per = 14 - 9 + 1;
    return run.screen === "won" ? 5 * per : Math.min(5 * per, (run.chapter ?? 0) * per + Math.max(0, (run.lastBattle?.order ?? 9) - 9 + (run.lastBattle?.won ? 1 : 0)));
  }
  return run.screen === "won" ? 14 : Math.max(0, (run.lastBattle?.order ?? 1) - 1);
}

// Progress for character unlocks (see unlocks.js)
export function recordRun(meta, run, ctx = null) {
  meta.runs += 1;
  meta.best = Math.max(meta.best ?? 0, beatenCount(run));
  if (run.screen === "won") {
    meta.wins = (meta.wins ?? 0) + 1;
    // A Team path win is counted apart, so it doesn't count as the normal Challenge Gen win (and doesn't open the next unlocks by itself)
    if (run.settings?.path === "gauntlet") meta.gauntletWins = (meta.gauntletWins ?? 0) + 1; // a final path: counted apart
    else if (run.settings?.path === "mixed") meta.mixedWins = (meta.mixedWins ?? 0) + 1;
    else if (run.settings?.path === "evil") meta.evilWins = { ...meta.evilWins, [run.settings.gen]: (meta.evilWins?.[run.settings.gen] ?? 0) + 1 };
    else meta.winGens = { ...meta.winGens, [run.settings.gen]: (meta.winGens?.[run.settings.gen] ?? 0) + 1 };
  }
  if (ctx) noteRunEnd(meta, run, ctx); // lines, types, clean wins… for the character unlocks
}

// TP for a finished run: per opponent beaten, plus the Hall of Fame bonus, plus the skill tree's pay increase
export const MIXED_WIN_BONUS = 50;
export function trainerPointsFor(run, rules) {
  const beaten = beatenCount(run);
  let tp = 0;
  const gauntlet = run.settings?.path === "gauntlet";
  for (let n = 1; n <= beaten; n++) {
    const order = gauntlet ? 9 + ((n - 1) % 6) : n; // (a Gauntlet chapter pays like battles 9 to 14)
    if (order <= 8) tp += rules.tp.gym;
    else if (order <= 12) tp += rules.tp.elite;
    else if (order === 13) tp += rules.tp.champion;
    else tp += rules.tp.hallOfFame;
  }
  if (gauntlet) tp *= 3; // the Gauntlet pays triple
  if (run.settings?.path === "mixed") tp = tp * 2 + (beaten >= 14 ? MIXED_WIN_BONUS : 0); // the final path pays double, and a lot more for finishing it
  const pct = run.perks?.tpPct ?? 0;
  return pct ? Math.round(tp * (1 + pct / 100)) : tp;
}
