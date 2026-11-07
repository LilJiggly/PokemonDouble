// =====================================================
// STATS (the Stats tab of the Profile screen)
// -----------------------------------------------------
// Everything is worked out from the meta save (counters kept by progress.js and meta.js) and the Hall of Fame.
// buildStats() returns sections of { label, value, hint? } rows. Nothing here is saved.
// =====================================================

import { CHALLENGES } from "./challenges.js";

export const fmtDuration = (ms) => {
  const min = Math.floor((ms ?? 0) / 60000);
  if (min < 1) return "under a minute";
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
};
const pct = (a, b) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "–");
const top = (obj, n = 3) => Object.entries(obj ?? {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// meta: the meta save, hof: the Hall of Fame entries, ctx: { data }, extra: { trainers, trainersTotal }
export function buildStats(meta, hof, ctx, extra = {}) {
  const name = (k) => ctx.data.pokemonByKey[k]?.name ?? k;
  const runs = meta.runs ?? 0, wins = meta.wins ?? 0;
  const won = meta.battlesWon ?? 0, lost = meta.battlesLost ?? 0;

  // From the champion teams: who and what you win with
  const used = {}, types = {};
  let highest = 0, shinyWins = 0;
  for (const e of hof ?? []) {
    for (const m of e.team ?? []) {
      used[m.species] = (used[m.species] ?? 0) + 1;
      for (const t of ctx.data.pokemonByKey[m.species]?.types ?? []) types[t] = (types[t] ?? 0) + 1;
      highest = Math.max(highest, m.level ?? 0);
      if (m.shiny) shinyWins++;
    }
  }
  const [favMon] = top(used, 1), [favType] = top(types, 1);
  const gens = (obj) => [1, 2, 3, 4, 5].map((g) => `Gen ${g}: ${obj?.[g] ?? 0}`).join(" · ");
  const lines = top(meta.lineWins, 3).map(([k, n]) => `${name(k)} ${n}`).join(" · ");
  const typeWins = top(meta.typeWins, 3).map(([t, n]) => `${cap(t)} ${n}`).join(" · ");
  const beaten = (meta.challenges ?? []).length;
  const allGens = [1, 2, 3, 4, 5].filter((g) => (meta.winGens?.[g] ?? 0) > 0).length;

  return [
    { title: "Overview", rows: [
      { label: "Runs played", value: runs },
      { label: "Champion wins", value: wins },
      { label: "Win rate", value: pct(wins, runs), hint: "Wins per run" },
      { label: "Furthest battle", value: `${meta.best ?? 0} of 14` },
      { label: "Flawless wins", value: meta.cleanWins ?? 0, hint: "Nobody fell" },
      { label: "Time played", value: fmtDuration(meta.playMs), hint: "Counted for runs finished since v0.37" },
      { label: "Fastest win", value: meta.fastestWin ? fmtDuration(meta.fastestWin) : "–" },
      { label: "Trainer Points earned", value: meta.earned ?? 0, hint: `${meta.tp ?? 0} left to spend` },
    ] },
    { title: "Battles", rows: [
      { label: "Battles won", value: won },
      { label: "Runs ended by a loss", value: lost },
      { label: "Battles per run", value: runs ? (won / runs).toFixed(1) : "–" },
      { label: "Average turns per win", value: meta.battleTurnCount ? (meta.battleTurns / meta.battleTurnCount).toFixed(1) : "–" },
      { label: "Quick gym wins", value: meta.quickWins ?? 0, hint: "A gym in 4 turns or fewer" },
      { label: "Best clean gym streak", value: meta.cleanGym ?? 0, hint: "Furthest battle with nobody lost" },
      { label: "Pokémon lost", value: meta.pokemonLost ?? 0 },
    ] },
    { title: "Pokémon", rows: [
      { label: "Species recruited", value: `${(meta.species ?? []).length} of ${ctx.data.pokemon.length}` },
      { label: "Recruits in total", value: meta.recruited ?? 0 },
      { label: "Shinies found", value: meta.shiniesFound ?? 0 },
      { label: "Shiny champions", value: shinyWins, hint: "Shinies in Hall of Fame teams" },
      { label: "Evolutions", value: meta.evolutionsDone ?? 0 },
      { label: "Rerolls used", value: meta.rerollsDone ?? 0 },
      { label: "Held items given", value: meta.items ?? 0 },
      { label: "Highest level in a champion team", value: highest || "–" },
      { label: "Favourite champion", value: favMon ? `${name(favMon[0])} (${favMon[1]})` : "–", hint: "In the most Hall of Fame teams" },
      { label: "Favourite type", value: favType ? `${cap(favType[0])} (${favType[1]})` : "–" },
    ] },
    { title: "Collection", rows: [
      { label: "Badges", value: `${(meta.badges ?? []).length} of 40` },
      { label: "Trainers unlocked", value: extra.trainers != null ? `${extra.trainers} of ${extra.trainersTotal}` : "–" },
      { label: "Challenges beaten", value: `${beaten} of ${CHALLENGES.length}` },
      { label: "Generations won", value: `${allGens} of 5` },
      { label: "Champion teams saved", value: (hof ?? []).length },
    ] },
    { title: "Wins in detail", rows: [
      { label: "Wins per generation", value: gens(meta.winGens), wide: true },
      { label: "Flawless wins per generation", value: gens(meta.cleanWinGens), wide: true },
      { label: "Most winning lines", value: lines || "–", wide: true },
      { label: "Most winning types", value: typeWins || "–", wide: true },
    ] },
  ];
}

// Species you have had, for choosing favourites: everything recruited so far, plus every Hall of Fame team member
export function ownedSpecies(meta, hof, ctx) {
  const set = new Set(meta.species ?? []);
  for (const e of hof ?? []) for (const m of e.team ?? []) set.add(m.species);
  return [...set].filter((k) => ctx.data.pokemonByKey[k]).sort((a, b) => ctx.data.pokemonByKey[a].id - ctx.data.pokemonByKey[b].id);
}
