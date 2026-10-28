// =====================================================
// PROGRESS COUNTERS FOR CHARACTER UNLOCKS (DESIGN.md §3j)
// -----------------------------------------------------
// A run collects small counters in run.stats; they are merged into the meta save after every battle
// and at the end of a run. unlocks.js reads the meta counters.
// =====================================================

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

// After a battle was won: lines and types on the team, quick wins, clean runs, starter sets
export function noteBattleWon(meta, run, ctx, { turns = null } = {}) {
  const order = run.lastBattle?.order ?? run.order;
  meta.lineGym ??= {};
  meta.typeGym ??= {};
  meta.starters ??= {};
  const roots = new Set(run.team.map((m) => rootOf(ctx, m.species)));
  for (const root of roots) raise(meta.lineGym, root, order);
  for (const type of new Set(run.team.flatMap((m) => typesOf(ctx, m)))) raise(meta.typeGym, type, order);
  // "Team: a, b, c" unlocks (Cynthia): the most of those species you had on the team at once in a won battle
  const have = new Set(run.team.map((m) => m.species));
  for (const rule of Object.values(ctx.rules?.characterUnlocks ?? {})) {
    for (const alt of rule.alts) for (const c of alt) {
      if (c.kind !== "team") continue;
      const key = c.arg.join(",");
      (meta.teamBest ??= {})[key] = Math.max(meta.teamBest[key] ?? 0, c.arg.filter((k) => have.has(k)).length);
    }
  }
  if (run.team.length === 6) {
    meta.fullTeam ??= {};
    for (const type of typesOf(ctx, run.team[0])) if (run.team.every((m) => typesOf(ctx, m).includes(type))) meta.fullTeam[type] = true;
  }
  if (order >= 1 && order <= 8 && turns !== null && turns <= 4) meta.quickWins = (meta.quickWins ?? 0) + 1;
  if (!run.fallen.length) meta.cleanGym = Math.max(meta.cleanGym ?? 0, order);
  for (const [region, lines] of Object.entries(STARTER_LINES)) {
    if (lines.every((l) => roots.has(l))) meta.starters[region] = true;
  }
  mergeStats(meta, run);
}

// At the end of a run (won or lost)
export function noteRunEnd(meta, run, ctx) {
  mergeStats(meta, run);
  if (run.screen !== "won") return;
  meta.lineWins ??= {};
  meta.typeWins ??= {};
  meta.cleanWinGens ??= {};
  for (const root of new Set(run.team.map((m) => rootOf(ctx, m.species)))) bump(meta.lineWins, root);
  const types = new Set(run.team.flatMap((m) => typesOf(ctx, m)));
  for (const type of types) bump(meta.typeWins, type);
  if (types.size >= 6) meta.diverseWins = (meta.diverseWins ?? 0) + 1;
  if (run.playMs > 0) meta.fastestWin = Math.min(meta.fastestWin ?? Infinity, run.playMs);
  if (!run.fallen.length) {
    meta.cleanWins = (meta.cleanWins ?? 0) + 1;
    bump(meta.cleanWinGens, run.settings.gen);
  }
}
