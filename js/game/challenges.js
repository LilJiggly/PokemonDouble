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

// One challenge per type: win using only Pokémon of that type (a dual type counts for each of its types; fallen Pokémon count too).
// The tier follows how many Pokémon have the type (species of all five generations), so the rarer the type the harder the challenge:
// the 4 most common types are tier 3, the next 6 tier 4 and the 7 rarest tier 5. (The five that existed before keep their ids.)
// [type, id, name, tier, number of Pokémon with the type]
const MONO = [
  ["water", "team-aqua", "Team Aqua", 3, 109], ["normal", "mono-normal", "Whitney", 3, 97], ["flying", "mono-flying", "Falkner", 3, 82], ["grass", "mono-grass", "Erika", 3, 75],
  ["psychic", "mono-psychic", "Sabrina", 4, 68], ["bug", "mono-bug", "Bugsy", 4, 63], ["ground", "mono-ground", "Giovanni", 4, 58], ["poison", "team-rocket", "Team Rocket", 4, 57],
  ["fire", "team-magma", "Team Magma", 4, 48], ["rock", "mono-rock", "Brock", 4, 47],
  ["fighting", "mono-fighting", "Maylene", 5, 40], ["electric", "mono-electric", "Lt. Surge", 5, 39], ["dark", "team-plasma", "Team Plasma", 5, 39], ["steel", "team-galactic", "Team Galactic", 5, 37],
  ["ice", "mono-ice", "Candice", 5, 29], ["dragon", "mono-dragon", "Lance", 5, 29], ["ghost", "mono-ghost", "Morty", 5, 27],
];
export const MONO_TYPES = MONO.map(([type, id, name, tier, count]) => ({ type, id, name, tier, count }));

// tier: 1 (easiest) to 5 (hardest), used to group the list. Every challenge is always listed, except the secret ones at the end (see SECRET_AT).
// rule: needs a run rule switched on (it opens by winning runs) / toggle: needs the Fixed Six rule (New run → Rules)
export const CHALLENGES = [
  // Tier 1: from the start
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
  // Tier 3
  { id: "legend", tier: 3, name: "Legend in the team", text: "Win with a Legendary or Mythical Pokémon on your team.",
    check: (team, run, ctx) => team.some((m) => dataOf(ctx, m).isLegendary || dataOf(ctx, m).isMythical) },
  // Tiers 3 to 5: every type on its own (see MONO above)
  ...MONO_TYPES.map(({ type, id, name, tier, count }) => ({ id, tier, name, text: `Win using only ${type.charAt(0).toUpperCase()}${type.slice(1)} types.`, hint: `${count} Pokémon have this type`, check: onlyTypes(type) })),
  // Tier 4 and 5: the Skill Tree modes
  // The evil team paths (they open when you win the normal path of that generation)
  ...[[1, "Evil Kanto", "Team Rocket"], [2, "Evil Johto", "Team Rocket"], [3, "Evil Hoenn", "Team Aqua and Magma"], [4, "Evil Sinnoh", "Team Galactic"], [5, "Evil Unova", "Team Plasma"]]
    .map(([gen, name, team]) => ({ id: `evil-${gen}`, tier: 4, name, text: `Win the ${team} path of Gen ${gen}.`, rule: "Needs the evil path (open it by winning Gen " + gen + ")", check: (t, run) => run.settings?.path === "evil" && run.settings?.gen === gen })),
  { id: "fixed-six", tier: 4, name: "Fixed six", text: "Pick six Pokémon at the start, never recruit another, and win.",
    rule: "Needs the Fixed Six run (New run → Challenge)", toggle: "fixedSix", check: (team, run) => run.settings?.fixedSix === true },
  { id: "hard-win", tier: 4, name: "Hard mode", text: "Win with Hard mode on.", rule: "Needs the Hard mode rule", check: (team, run) => !!run.settings?.modes?.hard },
  { id: "gyms-win", tier: 4, name: "Random gyms", text: "Win with Random gyms on.", rule: "Needs the Random gyms rule", check: (team, run) => !!run.settings?.modes?.opponents },
  { id: "flawless", tier: 5, name: "Flawless", text: "Win a run without a single Pokémon falling.",
    check: (team, run) => !run.fallen.length },
  { id: "mono-win", tier: 5, name: "Mono type", text: "Win with Mono type on.", rule: "Needs the Mono type rule", check: (team, run) => !!run.settings?.modes?.mono },
  { id: "noitems-win", tier: 5, name: "No items", text: "Win with No items on.", rule: "Needs the No items rule", check: (team, run) => !!run.settings?.modes?.noitems },
  // The final path (opens when all five generations are won)
  { id: "mixed-win", tier: 5, name: "Mixed Gens", text: "Win the Mixed Gens path.", rule: "Needs Mixed Gens (win all 5 generations first)", check: (t, run) => run.settings?.path === "mixed" },
  { id: "mixed-hard", tier: 5, name: "Mixed and hard", text: "Win Mixed Gens with Hard mode on.", rule: "Needs Mixed Gens and the Hard mode rule", check: (t, run) => run.settings?.path === "mixed" && !!run.settings?.modes?.hard },
  // Secret: super hard, only listed once you have beaten most of the others (or one of them by accident)
  { id: "secret-perfect", secret: true, tier: 5, name: "Perfect champion", text: "Win with Hard mode on and nobody falling.", rule: "Needs the Hard mode rule",
    check: (team, run) => !!run.settings?.modes?.hard && !run.fallen.length },
  { id: "secret-pure", secret: true, tier: 5, name: "Pure and perfect", text: "Win a Mono type run with nobody falling.", rule: "Needs the Mono type rule",
    check: (team, run) => !!run.settings?.modes?.mono && !run.fallen.length },
  { id: "secret-iron", secret: true, tier: 5, name: "Iron trainer", text: "Win with Fixed Six, No items and Hard mode all switched on.", rule: "Needs three rules",
    check: (team, run) => run.settings?.fixedSix === true && !!run.settings?.modes?.noitems && !!run.settings?.modes?.hard },
];

// The secret challenges are listed once you have beaten this share of all the others
export const SECRET_SHARE = 0.8;
export const secretAt = () => Math.ceil(CHALLENGES.filter((c) => !c.secret).length * SECRET_SHARE);
export const secretRevealed = (beatenCount) => beatenCount >= secretAt();

// Ideas that are not tracked yet: shown on the Challenges board as a "coming soon" checklist (see UNLOCK-IDEAS.md)
export const PLANNED = [
  { id: "starter-evolutions", name: "Starter evolutions", text: "Reach the final stage of all 15 starters, over any number of runs." },
  { id: "starter-team", name: "Starter team", text: "Have six starter-line Pokémon on your team at once, at any stage." },
  { id: "hidden-abilities", name: "Hidden abilities", text: "Win with three or more Pokémon that have their Hidden ability." },
  { id: "no-shop", name: "No shopping", text: "Win without buying anything in the shop." },
  { id: "stone-master", name: "Stone master", text: "Evolve five Pokémon with stones in one run." },
];

// Older Hall of Fame entries: challenges that only depend on the winning team, its fallen Pokémon and the saved run rules.
// Re-checked at start up so a win from before a challenge existed still counts (and nothing is lost if the tick was missed).
const BACKFILL = new Set(["flawless", "fully-evolved", "shiny", "starters", "legend", "fixed-six", "mixed-win", "mixed-hard", "evil-1", "evil-2", "evil-3", "evil-4", "evil-5", "hard-win", "gyms-win", "mono-win", "noitems-win", "secret-perfect", "secret-pure", "secret-iron", ...MONO_TYPES.map((m) => m.id)]);
export function backfillChallenges(meta, hof, ctx) {
  const done = new Set(meta.challenges ?? []);
  const before = done.size;
  for (const entry of hof ?? []) {
    const team = entry.team ?? [];
    const run = {
      fallen: Array.from({ length: entry.fallen ?? entry.fallenMons?.length ?? 0 }),
      seenSpecies: [...team.map((m) => m.species), ...(entry.fallenMons ?? []).map((f) => f.species)],
      settings: { ...(entry.rules ?? {}), gen: entry.gen },
    };
    for (const c of CHALLENGES) {
      if (!BACKFILL.has(c.id) || done.has(c.id)) continue;
      try { if (team.length && c.check(team, run, ctx)) done.add(c.id); } catch { /* an old entry without the data */ }
    }
  }
  meta.challenges = [...done];
  return done.size !== before;
}

// At the end of a won run: remember which challenges it beat
export function noteChallenges(meta, run, ctx) {
  const done = new Set(meta.challenges ?? []);
  for (const c of CHALLENGES) if (!done.has(c.id) && c.check(run.team, run, ctx)) done.add(c.id);
  meta.challenges = [...done];
}
