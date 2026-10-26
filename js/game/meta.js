// =====================================================
// ROGUELITE PROGRESSION (DESIGN.md §3i)
// -----------------------------------------------------
// Trainer Points (TP) earned at the end of every run,
// spent on permanent Trainer upgrades. Saved separately
// from runs, so it survives losing.
// =====================================================

import { noteRunEnd } from "./progress.js";

export const META_KEY = "pd.meta";

export function emptyMeta() {
  return { tp: 0, earned: 0, runs: 0, upgrades: {}, character: "lucas", sprites: "gen5", wins: 0, winGens: {}, best: 0, reach: {}, badges: [], badgeCase: [], badgeLinks: [], badgeOff: [] };
}

export function loadMeta(storage = globalThis.localStorage) {
  try {
    return { ...emptyMeta(), ...JSON.parse(storage.getItem(META_KEY)) };
  } catch {
    return emptyMeta();
  }
}

export function saveMeta(meta, storage = globalThis.localStorage) {
  try { storage.setItem(META_KEY, JSON.stringify(meta)); } catch { /* storage blocked */ }
}

export function upgradeLevel(meta, id) {
  return meta.upgrades[id] ?? 0;
}

export function canBuyUpgrade(meta, upgrade) {
  return upgradeLevel(meta, upgrade.id) < upgrade.max && meta.tp >= upgrade.cost;
}

export function buyUpgrade(meta, upgrade) {
  if (!canBuyUpgrade(meta, upgrade)) return false;
  meta.tp -= upgrade.cost;
  meta.upgrades[upgrade.id] = upgradeLevel(meta, upgrade.id) + 1;
  return true;
}

// The upgrades a new run starts with (copied into the run, so later purchases don't change it)
export function perksFromMeta(meta) {
  const lvl = (id) => upgradeLevel(meta, id);
  return {
    scout: lvl("scout"),
    dice: lvl("dice"),
    allowance: lvl("allowance"),
    bag: lvl("bag"),
    gift: lvl("gift"),
    hidden: lvl("hidden"),
    shiny: lvl("shiny"),
  };
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

// TP for a finished run: per opponent beaten, plus the Hall of Fame bonus
export function trainerPointsFor(run, rules) {
  const beaten = beatenCount(run);
  let tp = 0;
  for (let order = 1; order <= beaten; order++) {
    if (order <= 8) tp += rules.tp.gym;
    else if (order <= 12) tp += rules.tp.elite;
    else if (order === 13) tp += rules.tp.champion;
    else tp += rules.tp.hallOfFame;
  }
  return tp;
}
