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

// Every Pokémon you had this run, fallen ones too (the team challenges look at all of them)
const everyone = (team, run) => [...new Set([...(run.seenSpecies ?? []), ...team.map((m) => m.species)])];
// "Only ... types": every Pokémon you had has at least one of these types
const onlyTypes = (...types) => (team, run, ctx) => team.length > 0 && everyone(team, run).every((k) => ctx.data.pokemonByKey[k]?.types.some((t) => types.includes(t)));

// tier: a tier is shown once you have beaten enough challenges (see REVEAL_AT); before that it is a "???" row.
// rule: needs a Skill Tree mode switched on / toggle: has its own switch in the Challenges window
export const CHALLENGES = [
  // Tier 1: from the start
  { id: "flawless", tier: 1, name: "Flawless", text: "Win a run without a single Pokémon falling.",
    check: (team, run) => !run.fallen.length },
  { id: "little-cup", tier: 1, name: "Don't evolve", text: "Don't evolve anything.",
    check: (team, run) => run.evolutions === 0 },
  { id: "fully-evolved", tier: 1, name: "Fully evolved", text: "Win with a team of six fully evolved Pokémon.",
    check: (team, run, ctx) => team.length === 6 && team.every((m) => !ctx.dex.evolvesTo[m.species]?.length) },
  { id: "shiny", tier: 1, name: "Shiny champion", text: "Win with a shiny Pokémon on your team.",
    check: (team) => team.some((m) => m.shiny) },
  // Tier 2
  { id: "starters", tier: 2, name: "Starter squad", text: "Win with six Pokémon from starter lines (any stage).",
    check: (team, run, ctx) => team.length === 6 && (() => { const roots = starterRoots(); return team.every((m) => roots.has(rootOf(ctx, m.species))); })() },
  { id: "single-gen", tier: 2, name: "One generation", text: "Win using Pokémon of a single generation only (fallen ones too).",
    check: (team, run, ctx) => new Set(everyone(team, run).map((k) => ctx.data.pokemonByKey[k]?.gen)).size === 1 },
  { id: "no-rerolls", tier: 2, name: "No rerolls", text: "Win a run without using a single reroll, in the recruit screens or the shop.",
    check: (team, run) => run.rerollsUsed === 0 },
  { id: "rich", tier: 2, name: "Rich trainer", text: "Win a run with ₽5,000 or more unspent.",
    check: (team, run) => (run.money ?? 0) >= 5000 },
  // Tier 3: the evil teams. Only these types, every Pokémon you ever had (fallen ones too)
  { id: "team-magma", tier: 3, name: "Team Magma", text: "Win using only Fire types.", check: onlyTypes("fire") },
  { id: "team-aqua", tier: 3, name: "Team Aqua", text: "Win using only Water types.", check: onlyTypes("water") },
  { id: "team-rocket", tier: 3, name: "Team Rocket", text: "Win using only Poison and Normal types.", check: onlyTypes("poison", "normal") },
  { id: "team-galactic", tier: 3, name: "Team Galactic", text: "Win using only Steel and Psychic types.", check: onlyTypes("steel", "psychic") },
  { id: "team-plasma", tier: 3, name: "Team Plasma", text: "Win using only Dark and Ghost types.", check: onlyTypes("dark", "ghost") },
  // Tier 4: the hardest, and the Skill Tree modes
  { id: "legend", tier: 4, name: "Legend in the team", text: "Win with a Legendary or Mythical Pokémon on your team.",
    check: (team, run, ctx) => team.some((m) => dataOf(ctx, m).isLegendary || dataOf(ctx, m).isMythical) },
  { id: "fixed-six", tier: 4, name: "Fixed six", text: "Pick six Pokémon at the start, never recruit another, and win.",
    rule: "Switch on in New run → Challenges", toggle: "fixedSix", check: (team, run) => run.settings?.fixedSix === true },
  { id: "hard-win", tier: 4, name: "Hard mode", text: "Win with Hard mode on.", rule: "Needs the Hard mode node", check: (team, run) => !!run.settings?.modes?.hard },
  { id: "gyms-win", tier: 4, name: "Random gyms", text: "Win with Random gyms on.", rule: "Needs the Random gyms node", check: (team, run) => !!run.settings?.modes?.opponents },
  { id: "mono-win", tier: 4, name: "Mono type", text: "Win with Mono type on.", rule: "Needs the Mono type node", check: (team, run) => !!run.settings?.modes?.mono },
  { id: "noitems-win", tier: 4, name: "No items", text: "Win with No items on.", rule: "Needs the No items node", check: (team, run) => !!run.settings?.modes?.noitems },
];

// A tier shows up once you have beaten this many challenges in total (tier 1 is open from the start)
export const REVEAL_AT = { 1: 0, 2: 2, 3: 5, 4: 8 };
export const isRevealed = (c, beatenCount) => beatenCount >= (REVEAL_AT[c.tier] ?? 0);
// How many more you have to beat to see the next tier, or null when everything is shown
export const toNextTier = (beatenCount) => { const next = Object.values(REVEAL_AT).find((n) => n > beatenCount); return next === undefined ? null : next - beatenCount; };

// Ideas that are not tracked yet: shown on the Challenges board as a "coming soon" checklist (see UNLOCK-IDEAS.md)
export const PLANNED = [
  { id: "starter-evolutions", name: "Starter evolutions", text: "Reach the final stage of all 15 starters, over any number of runs." },
  { id: "starter-team", name: "Starter team", text: "Have six starter-line Pokémon on your team at once, at any stage." },
  { id: "hidden-abilities", name: "Hidden abilities", text: "Win with three or more Pokémon that have their Hidden ability." },
  { id: "no-shop", name: "No shopping", text: "Win without buying anything in the shop." },
  { id: "stone-master", name: "Stone master", text: "Evolve five Pokémon with stones in one run." },
  { id: "type-collector", name: "Type collector", text: "Win a run with each of the 17 types, over many runs." },
];

// At the end of a won run: remember which challenges it beat
export function noteChallenges(meta, run, ctx) {
  const done = new Set(meta.challenges ?? []);
  for (const c of CHALLENGES) if (!done.has(c.id) && c.check(run.team, run, ctx)) done.add(c.id);
  meta.challenges = [...done];
}
