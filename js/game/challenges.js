// =====================================================
// CHALLENGES (shown on the Leaderboards, "Challenges" tab)
// -----------------------------------------------------
// Each one is checked when a run is won. Beaten ones are kept in meta.challenges (a list of ids)
// and published on your public leaderboard line. More ideas: UNLOCK-IDEAS.md.
// check(team, run, ctx): team = the winning team, run.seenSpecies = every Pokémon you ever had this run.
// =====================================================

import { STARTER_LINES } from "./progress.js";

const starterRoots = () => new Set(Object.values(STARTER_LINES).flat()); // (a function: progress.js and this file import each other)
const rootOf = (ctx, species) => ctx.dex.lineOf[species] ?? species;
const dataOf = (ctx, mon) => ctx.data.pokemonByKey[mon.species];

export const CHALLENGES = [
  { id: "flawless", name: "Flawless", text: "Win a run without a single Pokémon falling.",
    check: (team, run) => !run.fallen.length },
  { id: "starters", name: "Starter squad", text: "Win with six Pokémon from starter lines (any stage).",
    check: (team, run, ctx) => team.length === 6 && (() => { const roots = starterRoots(); return team.every((m) => roots.has(rootOf(ctx, m.species))); })() },
  { id: "single-gen", name: "One generation", text: "Win using Pokémon of a single generation only (fallen ones too).",
    check: (team, run, ctx) => new Set([...(run.seenSpecies ?? []), ...team.map((m) => m.species)].map((k) => ctx.data.pokemonByKey[k]?.gen)).size === 1 },
  { id: "little-cup", name: "Little cup", text: "Win with a team of six unevolved Pokémon.",
    check: (team, run, ctx) => team.length === 6 && team.every((m) => !ctx.dex.evolvesFrom[m.species]) },
  { id: "fully-evolved", name: "Fully evolved", text: "Win with a team of six fully evolved Pokémon.",
    check: (team, run, ctx) => team.length === 6 && team.every((m) => !ctx.dex.evolvesTo[m.species]?.length) },
  { id: "shiny", name: "Shiny champion", text: "Win with a shiny Pokémon on your team.",
    check: (team) => team.some((m) => m.shiny) },
  { id: "legend", name: "Legend in the team", text: "Win with a Legendary or Mythical Pokémon on your team.",
    check: (team, run, ctx) => team.some((m) => dataOf(ctx, m).isLegendary || dataOf(ctx, m).isMythical) },
  { id: "no-rerolls", name: "No rerolls", text: "Win a run without using a single reroll, in the recruit screens or the shop.",
    check: (team, run) => run.rerollsUsed === 0 },
  { id: "fixed-six", name: "Fixed six", text: "Pick six Pokémon at the start, never recruit another, and win.",
    rule: "Switch on in New run → Challenges", toggle: "fixedSix", check: (team, run) => run.settings?.fixedSix === true },
  { id: "rich", name: "Rich trainer", text: "Win a run with ₽5,000 or more unspent.",
    check: (team, run) => (run.money ?? 0) >= 5000 },
];

// Ideas that are not tracked yet: shown on the Challenges board as a "coming soon" checklist (see UNLOCK-IDEAS.md)
export const PLANNED = [
  { id: "starter-evolutions", name: "Starter evolutions", text: "Reach the final stage of all 15 starters, over any number of runs." },
  { id: "starter-team", name: "Starter team", text: "Have six starter-line Pokémon on your team at once, at any stage." },
  { id: "hidden-abilities", name: "Hidden abilities", text: "Win with three or more Pokémon that have their Hidden ability." },
  { id: "no-shop", name: "No shopping", text: "Win without buying anything in the shop." },
  { id: "no-healing", name: "No healing items", text: "Win without using a Potion or any other healing item." },
  { id: "stone-master", name: "Stone master", text: "Evolve five Pokémon with stones in one run." },
  { id: "type-collector", name: "Type collector", text: "Win a run with each of the 17 types, over many runs." },
];

// At the end of a won run: remember which challenges it beat
export function noteChallenges(meta, run, ctx) {
  const done = new Set(meta.challenges ?? []);
  for (const c of CHALLENGES) if (!done.has(c.id) && c.check(run.team, run, ctx)) done.add(c.id);
  meta.challenges = [...done];
}
