// =====================================================
// PROGRESS COUNTERS FOR CHARACTER UNLOCKS (DESIGN.md §3j)
// -----------------------------------------------------
// A run collects small counters in run.stats; they are merged into the meta save after every battle
// and at the end of a run. unlocks.js reads the meta counters.
// =====================================================

import { noteChallenges } from "./challenges.js";

export const STARTER_LINES = {
  kanto: ["bulbasaur", "charmander", "squirtle"],
  johto: ["chikorita", "cyndaquil", "totodile"],
  hoenn: ["treecko", "torchic", "mudkip"],
  sinnoh: ["turtwig", "chimchar", "piplup"],
  unova: ["snivy", "tepig", "oshawott"],
};

export const emptyRunStats = () => ({ species: [], items: 0, berries: 0, picks: [] });

const bump = (obj, key, by = 1) => { obj[key] = (obj[key] ?? 0) + by; };
const raise = (obj, key, value) => { obj[key] = Math.max(obj[key] ?? 0, value); };

const rootOf = (ctx, species) => ctx.dex.lineOf[species] ?? species;
const typesOf = (ctx, mon) => ctx.data.pokemonByKey[mon.species].types;

// Move the run's counters into the meta save
function mergeStats(meta, run) {
  const s = run.stats;
  if (!s) return;
  meta.species = [...new Set([...(meta.species ?? []), ...s.species])];
  meta.items = (meta.items ?? 0) + s.items;
  meta.berries = (meta.berries ?? 0) + s.berries;
  meta.picks ??= {};
  for (const root of s.picks) bump(meta.picks, root);
  run.stats = emptyRunStats();
}

// "Obtain: a, b, c" unlocks (Cynthia): the most of those species you had on your team during one run (at any time, not at once)
function noteObtained(meta, run, ctx) {
  const seen = new Set([...(run.seenSpecies ?? []), ...run.team.map((m) => m.species)]);
  for (const rule of Object.values(ctx.rules?.characterUnlocks ?? {})) {
    for (const alt of rule.alts) for (const c of alt) {
      if (c.kind !== "obtain") continue;
      const key = c.arg.join(",");
      const got = c.arg.filter((k) => seen.has(k));
      (meta.obtainBest ??= {});
      if (got.length > (meta.obtainBest[key]?.length ?? 0)) meta.obtainBest[key] = got;
    }
  }
}

// After a battle was won: lines and types on the team, quick wins, clean runs, starter sets
export function noteBattleWon(meta, run, ctx, { turns = null } = {}) {
  const order = run.lastBattle?.order ?? run.order;
  meta.lineGym ??= {};
  meta.typeGym ??= {};
  meta.starters ??= {};
  noteObtained(meta, run, ctx);
  const roots = new Set(run.team.map((m) => rootOf(ctx, m.species)));
  for (const root of roots) raise(meta.lineGym, root, order);
  for (const type of new Set(run.team.flatMap((m) => typesOf(ctx, m)))) raise(meta.typeGym, type, order);
  if (run.team.length === 6) {
    meta.fullTeam ??= {};
    for (const type of typesOf(ctx, run.team[0])) if (run.team.every((m) => typesOf(ctx, m).includes(type))) meta.fullTeam[type] = true;
  }
  meta.battlesWon = (meta.battlesWon ?? 0) + 1;
  if (turns !== null) { meta.battleTurns = (meta.battleTurns ?? 0) + turns; meta.battleTurnCount = (meta.battleTurnCount ?? 0) + 1; }
  if (order >= 1 && order <= 8 && turns !== null && turns <= 4) meta.quickWins = (meta.quickWins ?? 0) + 1;
  if (!run.fallen.length) meta.cleanGym = Math.max(meta.cleanGym ?? 0, order);
  for (const [region, lines] of Object.entries(STARTER_LINES)) {
    if (lines.every((l) => roots.has(l))) meta.starters[region] = true;
  }
  mergeStats(meta, run);
}

// At the end of a run (won or lost)
export function noteRunEnd(meta, run, ctx) {
  noteObtained(meta, run, ctx);
  mergeStats(meta, run);
  // Totals for the Stats screen (the profile)
  const add = (key, n) => { meta[key] = (meta[key] ?? 0) + (n ?? 0); };
  add("pokemonLost", run.fallen?.length);
  add("recruited", run.lines?.length);
  add("shiniesFound", run.shinies);
  add("evolutionsDone", run.evolutions);
  add("rerollsDone", run.rerollsUsed);
  add("playMs", run.playMs);
  if (run.screen !== "won" && run.lastBattle?.forfeited) add("forfeits", 1);
  else if (run.screen !== "won" && run.lastBattle) add("battlesLost", 1);
  if (run.screen !== "won") return;
  meta.lineWins ??= {};
  meta.typeWins ??= {};
  meta.cleanWinGens ??= {};
  for (const root of new Set(run.team.map((m) => rootOf(ctx, m.species)))) bump(meta.lineWins, root);
  const types = new Set(run.team.flatMap((m) => typesOf(ctx, m)));
  for (const type of types) bump(meta.typeWins, type);
  if (types.size >= 6) meta.diverseWins = (meta.diverseWins ?? 0) + 1;
  if (run.playMs > 0) meta.fastestWin = Math.min(meta.fastestWin ?? Infinity, run.playMs);
  // Wins with a run mode on (for "Mode win: X" trainer unlocks)
  meta.modeWins ??= {};
  const modes = Object.entries(run.settings?.modes ?? {}).filter(([, on]) => on).map(([k]) => (k === "opponents" ? "gyms" : k));
  if (run.settings?.fixedSix) modes.push("fixed");
  if (run.settings?.path === "evil") modes.push("evil");
  if (run.settings?.path === "mixed") modes.push("mixed");
  for (const mode of modes) bump(meta.modeWins, mode);
  noteChallenges(meta, run, ctx);
  if (!run.fallen.length) {
    meta.cleanWins = (meta.cleanWins ?? 0) + 1;
    if (run.settings?.path !== "mixed") bump(meta.cleanWinGens, run.settings.gen);
  }
}
