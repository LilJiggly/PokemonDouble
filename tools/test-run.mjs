// =====================================================
// RUN-LEVEL TESTS (gym badges, perks)
// Usage: node tools/test-run.mjs
// =====================================================

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareData } from "../js/engine/data.js";
import { parseRules } from "../js/game/rules.js";
import { Pokedex } from "../js/game/pokedex.js";
import * as Run from "../js/game/run.js";
import { badgeStatBoost, statOfBadge, unlockBadge, placeBadge, removeBadge, caseOf, caseStrengths, randomZones, validZones, badgeName, setBonus, battleBonus, perkInfo, perkOfBadge, ALL_BADGES } from "../js/game/badges.js";
import { emptyMeta, recordRun } from "../js/game/meta.js";
import { grantUnlocks, isUnlocked, meetsRule, unlockText, nextHint, parseRule } from "../js/game/unlocks.js";
import { levelUpMovesAt } from "../js/game/recruit.js";
import { noteBattleWon } from "../js/game/progress.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (p) => JSON.parse(await fs.readFile(path.join(ROOT, p), "utf8"));
const data = prepareData({ pokemon: await readJson("data/pokemon.json"), moves: await readJson("data/moves.json"), abilities: await readJson("data/abilities.json") });
const rules = parseRules(await fs.readFile(path.join(ROOT, "DESIGN.md"), "utf8"), data);
const dex = new Pokedex(data, await readJson("data/evolutions.json"), rules);
const leaders = {};
for (const g of [1, 2, 3, 4, 5]) leaders[g] = await readJson(`data/leaders/gen${g}.json`);
const ctx = { data, dex, rules, leaders, tms: await readJson("data/tms.json") };

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name}\n      ${e.message}`); }
}
const assert = (c, m) => { if (!c) throw new Error(m); };
const eq = (a, b, m) => { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); };

function freshRun(badges = []) {
  const run = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 7, badges });
  for (let i = 0; i < 3; i++) Run.pickRecruit(run, ctx, i);
  return run;
}
const offerFor = (run) => Run.makeRecruitOffer(run, ctx, { count: 3, picks: 1, odds: ctx.rules.progression[1].odds, level: 14 });

console.log("Badge collection and case");
test("Winning a gym unlocks its badge once; the badge name follows the Challenge Gen", () => {
  const meta = emptyMeta();
  assert(unlockBadge(meta, 1, 1), "new");
  assert(!unlockBadge(meta, 1, 1), "second time is not new");
  eq(badgeName(1, 1), "Boulder Badge", "Kanto");
  eq(badgeName(5, 8), "Wave Badge", "Unova");
});
test("The case takes 8 badges from any generation, swaps when dragged onto a filled slot, and ignores badges you don't own", () => {
  const meta = emptyMeta();
  for (const [g, o] of [[1, 1], [2, 3], [5, 2]]) unlockBadge(meta, g, o);
  assert(placeBadge(meta, "1-1") && placeBadge(meta, "2-3"), "place");
  eq(caseOf(meta).join(), "1-1,2-3,,,,,,", "case");
  assert(placeBadge(meta, "5-2", 1), "onto a filled slot");
  eq(caseOf(meta).slice(0, 2).join(), "1-1,5-2", "slot 1 replaced");
  assert(placeBadge(meta, "1-1", 1), "drag between slots");
  eq(caseOf(meta).slice(0, 2).join(), "5-2,1-1", "swapped");
  assert(!placeBadge(meta, "3-4"), "not owned");
  removeBadge(meta, 0);
  eq(caseOf(meta)[0], null, "removed");
});

console.log("Perks");
test("Every badge has its own effect (no duplicates) and Brock always gives the Boulder Badge's effect", () => {
  const perks = ALL_BADGES.map((id) => perkOfBadge(ctx.rules, id));
  assert(perks.every(Boolean), "a badge has no effect");
  eq(new Set(perks).size, 40, "unique effects");
  eq(perkOfBadge(ctx.rules, "1-1"), "sturdy-stone", "Boulder Badge");
});
test("Reroller (Gardenia's Forest Badge) gives +1 free reroll", () => {
  eq(offerFor(freshRun()).rerollsLeft, 1, "no badges");
  eq(offerFor(freshRun(["4-2"])).rerollsLeft, 2, "Forest Badge");
  eq(offerFor(freshRun(["1-1"])).rerollsLeft, 1, "another leader's badge has another effect");
});
test("Swap (Tate & Liza's Mind Badge, gym 7 in a one-slot zone: strength 10) trades a Pokémon for a card without a pick, twice per recruit screen", () => {
  const run = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 7, badges: ["3-7"], badgeLinks: [[0], [1, 2, 3, 4, 5, 6, 7]] });
  for (let i = 0; i < 3; i++) Run.pickRecruit(run, ctx, i);
  run.order = 1;
  run.offer = offerFor(run);
  const slot0Species = run.offer.options[0].spec.species;
  assert(Run.swapForRecruit(run, ctx, 0, run.team[0].uid).ok, "swap failed");
  eq(run.team.length, 3, "team size");
  eq(run.team[0].species, slot0Species, "the recruit takes the old slot");
  eq(run.offer.picksLeft, 1, "no pick used");
  assert(Run.swapForRecruit(run, ctx, 1, run.team[1].uid).ok, "second swap");
  assert(!Run.swapForRecruit(run, ctx, 2, run.team[2].uid).ok, "only twice");
});
test("Without the Swap badge, swapping is refused", () => {
  const run = freshRun();
  run.offer = offerFor(run);
  assert(!Run.swapForRecruit(run, ctx, 0, run.team[0].uid).ok, "should be refused");
});
test("Haggler (Clay's Quake Badge) makes the shop cheaper (9% at gym 5)", () => {
  const shop = (badges) => { const r = freshRun(badges); r.order = 1; Run.rerollShop(r, ctx); return r.shop; };
  const plain = shop([]), cheap = shop(["5-5"]);
  eq(plain.stock.length, cheap.stock.length, "same stock size");
  const total = (sh) => sh.stock.reduce((n, e) => n + e.price, 0) + sh.tms.reduce((n, e) => n + e.price, 0);
  const off = perkInfo("haggler", 5).param;
  assert(Math.abs(total(cheap) / total(plain) - (1 - off)) < 0.02, `cheap ${total(cheap)} vs plain ${total(plain)} (expected about ${Math.round(off * 100)}% off)`);
});

console.log("Strength, set bonus and battle effects");
test("Strength = gym number + the boost of its zone (+3 alone, +2 for two slots, +1 for three)", () => {
  const st = (slots, zones) => Object.fromEntries(caseStrengths(slots, zones).map((b) => [b.id, b.strength]));
  const slots = ["1-1", "2-2", null, null, null, null, "1-8", "3-3"];
  eq(st(slots, [])["1-1"], 1, "no zones");
  const s = st(slots, [[0, 1], [6], [7]]);
  eq(s["1-1"], 3, "two-slot zone: +2");
  eq(s["2-2"], 4, "everyone in the zone gets it");
  eq(s["1-8"], 10, "capped at 10");
  eq(s["3-3"], 6, "one-slot zone: +3");
  eq(st(["1-1", "1-2", "1-3", null, null, null, null, null], [[0, 1, 2]])["1-3"], 4, "three-slot zone: +1");
});
test("Random zones cover the whole case with touching groups of 1–3 slots", () => {
  const sizes = new Set();
  for (let i = 0; i < 300; i++) {
    const zones = randomZones();
    const flat = zones.flat().sort((a, b) => a - b);
    eq(flat.join(), "0,1,2,3,4,5,6,7", "every slot exactly once");
    for (const z of zones) {
      assert(z.length >= 1 && z.length <= 3, "zone size");
      sizes.add(z.length);
      // touching: every slot has a neighbour in the zone (left/right/up/down)
      if (z.length > 1) assert(z.every((a) => z.some((b) => b !== a && ((Math.abs(a - b) === 1 && Math.floor(a / 4) === Math.floor(b / 4)) || Math.abs(a - b) === 4))), `zone ${z} touches`);
    }
  }
  eq([...sizes].sort().join(), "1,2,3", "all sizes happen");
  for (let i = 0; i < 100; i++) assert(validZones(randomZones()), "every zone is a rectangle");
  assert(!validZones([[0, 1], [2, 3, 4], [5, 6, 7]]), "an L-shape is not valid");
  assert(!validZones([[0, 5], [1, 2, 3, 4, 6, 7]]), "pairs that are not boxes are not valid");
});
test("Effects scale with the gym: weak at the first gyms, strong at the last", () => {
  const early = perkInfo("sturdy-stone", 1).param, late = perkInfo("sturdy-stone", 8).param;
  assert(early <= 0.05, `Sturdy Stone at strength 1 is ${early}`);
  assert(late > early * 3, "it grows");
  eq(perkInfo("reroll", 2).param, 1, "Reroller early");
  eq(perkInfo("reroll", 8).param, 2, "Reroller late");
  eq(perkInfo("recruit", 2).param.picks, 0, "Extra Recruit gives no extra pick early");
  eq(perkInfo("recruit", 8).param.picks, 1, "…but one late");
});
test("Set bonus: 3 / 5 / 8 badges from one generation, generations add up", () => {
  eq(setBonus(["1-1", "1-2"], ctx.rules).pct, 0, "two");
  eq(setBonus(["1-1", "1-2", "1-3"], ctx.rules).pct, 2, "three");
  eq(setBonus(["1-1", "1-2", "1-3", "1-4", "1-5"], ctx.rules).pct, 4, "five");
  eq(setBonus(["1-1", "1-2", "1-3", "2-1", "2-2", "2-3", "3-1", "5-5"], ctx.rules).pct, 4, "3 + 3 from two generations");
  eq(setBonus(ALL_BADGES.slice(0, 8), ctx.rules).pct, 6, "full set");
});
test("Badge effects and stats reach the battle, scaled by strength", () => {
  const slots = ["1-1", "1-2", "1-3", null, "2-5", null, null, null]; // sturdy-stone, rain-start, para-ward and Brawler
  const b = battleBonus({ badges: { slots, links: [[0, 1]] } }, ctx.rules); // slots 0 and 1 are linked: +2 each
  eq(Object.keys(b.effects).sort().join(), "para-ward,rain-start,sturdy-stone", "battle effects");
  eq(b.effects["sturdy-stone"], perkInfo("sturdy-stone", 3).param, "Boulder (gym 1) + link = strength 3");
  eq(b.stats.atk.toFixed(3), (0.02 + perkInfo("stat-atk", 5).param + badgeStatBoost(5)).toFixed(3), "set bonus (3 Kanto badges) + Brawler + the badge's own Attack boost (gym 5, not linked)");
  eq(b.stats.def.toFixed(3), (0.02 + badgeStatBoost(3)).toFixed(3), "set bonus + Boulder Badge's own Defense boost (strength 3)");
  eq(battleBonus({ badges: { slots: Array(8).fill(null) } }, ctx.rules), null, "nothing equipped");
});

test("A badge's effect can be switched off (the badge still counts for the set bonus)", () => {
  const slots = ["1-1", "1-2", "1-3", null, null, null, null, null];
  const on = battleBonus({ badges: { slots, links: [] } }, ctx.rules);
  const off = battleBonus({ badges: { slots, links: [], off: ["1-2"] } }, ctx.rules);
  assert("rain-start" in on.effects && !("rain-start" in off.effects), "rain effect switched off");
  assert("sturdy-stone" in off.effects, "other badges keep working");
  eq(off.stats.atk, on.stats.atk, "set bonus unchanged");
});

console.log("Character unlocks");
const CHARS = (await readJson("data/characters.json")).map((c) => ({ id: c.id, name: c.name }));
const unlockRules = ctx.rules.characterUnlocks;
test("Rules parse: Start, or / and, line and starter clauses", () => {
  assert(unlockRules.ethan.start && !unlockRules.wally.start, "start flags");
  eq(unlockRules.wally.alts.length, 3, "Wally has three ways");
  eq(unlockRules["red-e"].alts[0].length, 2, "Red (Battle Frontier) needs both");
  assert(unlockText(unlockRules.wally).includes("Ralts"), "readable text");
  eq(parseRule("Line gym 4: ralts")[0][0].n, 4, "gym number");
});
test("Conditions use the right counters", () => {
  const m = emptyMeta();
  assert(!meetsRule(m, unlockRules.wally), "locked at first");
  m.lineWins = { ralts: 1 };
  assert(meetsRule(m, unlockRules.wally), "a Ralts-line win unlocks Wally");
  const m2 = emptyMeta();
  m2.picks = { ralts: 3 };
  assert(meetsRule(m2, unlockRules.wally), "picking Ralts 3 times also does");
  const m3 = emptyMeta();
  m3.wins = 3;
  assert(!meetsRule(m3, unlockRules["red-e"]), "needs the Kanto starters as well");
  m3.starters = { kanto: true };
  assert(meetsRule(m3, unlockRules["red-e"]), "both clauses met");
});
test("At most 2 trainers are granted at a time; the rest wait", () => {
  const m = emptyMeta();
  grantUnlocks(m, unlockRules, CHARS); // first call: sets up the list from the old conditions
  m.runs = 20; m.wins = 5; m.species = Array.from({ length: 120 }, (_, i) => `s${i}`);
  m.winGens = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 };
  const first = grantUnlocks(m, unlockRules, CHARS);
  eq(first.length, 2, "two granted");
  assert(!isUnlocked(m, unlockRules[CHARS.map((c) => c.id).find((id) => meetsRule(m, unlockRules[id]) && !m.unlocked.includes(id))]), "an eligible trainer is still waiting");
  const second = grantUnlocks(m, unlockRules, CHARS);
  assert(second.length === 2 && !second.some((id) => first.includes(id)), "next two the next time");
});
test("Winning a battle records lines, types, quick wins and clean runs; a won run adds the win counters", () => {
  const run = freshRun();
  run.lastBattle = { order: 3, won: true };
  const m = emptyMeta();
  noteBattleWon(m, run, ctx, { turns: 3 });
  eq(m.quickWins, 1, "quick win");
  eq(m.cleanGym, 3, "clean through battle 3");
  assert(Object.keys(m.lineGym).length > 0 && Object.keys(m.typeGym).length > 0, "lines and types");
  assert(m.species.length >= 3, "species recruited so far");
  run.screen = "won";
  recordRun(m, run, ctx);
  eq(m.cleanWins, 1, "clean win");
  assert(Object.keys(m.lineWins).length > 0, "line wins");
  assert(nextHint(m, unlockRules, CHARS), "there is still a hint");
});
test("Trainer perks: Leaf's money, May's berries, Wally's Ralts, Red's Kanto starter", () => {
  const base = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 11, character: "lucas" });
  const leaf = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 11, character: "leaf" });
  eq(leaf.money - base.money, 300, "+300 money");
  const may = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 11, character: "may" });
  eq((may.bag["oran-berry"] ?? 0) - (base.bag["oran-berry"] ?? 0), 2, "two berries");
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const w = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed, character: "wally" });
    assert(w.offer.options.some((o) => ctx.dex.lineOf[o.spec.species] === "ralts"), `Ralts in the draft (seed ${seed})`);
    const r = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed, character: "red" });
    assert(r.offer.options.some((o) => ["bulbasaur", "charmander", "squirtle"].includes(ctx.dex.lineOf[o.spec.species])), `Kanto starter (seed ${seed})`);
  }
});

test("Every badge raises one stat by itself, even when its effect is switched off", () => {
  eq(statOfBadge(ctx.rules, "1-1"), "def", "Boulder Badge (rock) raises Defense");
  const slots = ["1-1", null, null, null, null, null, null, null];
  const on = battleBonus({ badges: { slots, links: [] } }, ctx.rules);
  const off = battleBonus({ badges: { slots, links: [], off: ["1-1"] } }, ctx.rules);
  eq(on.stats.def, badgeStatBoost(1), "strength 1: 1%");
  eq(off.stats.def, on.stats.def, "still there when switched off");
  assert("sturdy-stone" in on.effects && !("sturdy-stone" in (off?.effects ?? {})), "only the effect switches off");
  assert(badgeStatBoost(10) <= 0.06, "stays small");
});

test("Low-level Pokémon don't start with a heavy hitter (Sudowoodo's level-1 Wood Hammer, power 120)", () => {
  const sudowoodo = data.pokemonByKey.sudowoodo;
  const at = (level) => levelUpMovesAt(sudowoodo, level, data);
  assert(!at(12).includes("wood-hammer") && !at(12).includes("hammer-arm"), `level 12: ${at(12)}`);
  assert(at(12).length >= 3, "still has moves");
  assert(!at(30).includes("wood-hammer"), "not at 30 either");
  assert(at(55).some((m) => ["wood-hammer", "hammer-arm"].includes(m)), "late in the run it may use them");
  for (const m of at(12)) assert((data.moves[m].power ?? 0) <= 75, `${m} is within the cap`);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
