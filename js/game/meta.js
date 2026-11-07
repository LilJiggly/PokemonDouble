// =====================================================
// ROGUELITE PROGRESSION (DESIGN.md §3i)
// -----------------------------------------------------
// Trainer Points (TP) earned at the end of every run,
// spent on permanent Trainer upgrades. Saved separately
// from runs, so it survives losing.
// =====================================================

import { noteRunEnd } from "./progress.js";

export const META_KEY = "pd.meta";

// Version 1 = the skill tree. Older saves had seven flat upgrades; migrateMeta() refunds them
export const TREE_VERSION = 1;
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
  for (const [id, level] of Object.entries(meta.upgrades ?? {})) refund += (OLD_UPGRADE_COST[id] ?? 0) * (Number(level) || 0);
  meta.tp = (meta.tp ?? 0) + refund;
  meta.upgrades = {};
  meta.treeVersion = TREE_VERSION;
  if (refund > 0) meta.refundNote = refund; // shown once on the skill tree screen
  return true;
}

export function loadMeta(storage = globalThis.localStorage) {
  try {
    const raw = JSON.parse(storage.getItem(META_KEY));
    // A brand new save starts on the tree; an old one is migrated (and refunded) as it is read
    const meta = { ...emptyMeta(), ...raw };
    if (raw && !(raw.treeVersion >= TREE_VERSION)) { meta.treeVersion = 0; migrateMeta(meta); }
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
      else if (kind === "perk" && !(a in perks)) perks[a] = Number(b) * level; // a perk without its own line above (IV floor)
    }
  }
  return perks;
}

// How many battles of the run were beaten (a win = all 14)
export function beatenCount(run) {
  return run.screen === "won" ? 14 : Math.max(0, (run.lastBattle?.order ?? 1) - 1);
}

// Progress for character unlocks (see unlocks.js)
export function recordRun(meta, run, ctx = null) {
  meta.runs += 1;
  meta.best = Math.max(meta.best ?? 0, beatenCount(run));
  if (run.screen === "won") {
    meta.wins = (meta.wins ?? 0) + 1;
    meta.winGens = { ...meta.winGens, [run.settings.gen]: (meta.winGens?.[run.settings.gen] ?? 0) + 1 };
  }
  if (ctx) noteRunEnd(meta, run, ctx); // lines, types, clean wins… for the character unlocks
}

// +25% Trainer Points for a run with Fixed Six or a Mode switched on
export const CHALLENGE_RUN_BONUS = 25;
export const isChallengeRun = (run) => !!(run.settings?.fixedSix || Object.values(run.settings?.modes ?? {}).some(Boolean));

// TP for a finished run: per opponent beaten, plus the Hall of Fame bonus, plus the skill tree's pay increase and the challenge run bonus
export function trainerPointsFor(run, rules) {
  const beaten = beatenCount(run);
  let tp = 0;
  for (let order = 1; order <= beaten; order++) {
    if (order <= 8) tp += rules.tp.gym;
    else if (order <= 12) tp += rules.tp.elite;
    else if (order === 13) tp += rules.tp.champion;
    else tp += rules.tp.hallOfFame;
  }
  const pct = (run.perks?.tpPct ?? 0) + (isChallengeRun(run) ? CHALLENGE_RUN_BONUS : 0);
  return pct ? Math.round(tp * (1 + pct / 100)) : tp;
}
