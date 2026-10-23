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
import { unlockBadge, placeBadge, removeBadge, caseOf, caseStrengths, randomLinks, badgeName, setBonus, battleBonus, perkInfo, perkOfBadge, ALL_BADGES } from "../js/game/badges.js";
import { emptyMeta } from "../js/game/meta.js";

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
test("Swap (Tate & Liza's Mind Badge, gym 7) trades a Pokémon for a card without a pick, twice per recruit screen at this strength", () => {
  const run = freshRun(["3-7"]);
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
test("Strength = gym number, +2 for a badge in a linked pair whose other slot also holds a badge", () => {
  const st = (slots, links) => Object.fromEntries(caseStrengths(slots, links).map((b) => [b.id, b.strength]));
  const slots = ["1-1", "2-2", null, null, null, null, "1-8", "3-3"];
  eq(st(slots, [])["1-1"], 1, "no links");
  const s = st(slots, [[0, 1], [6, 7]]);
  eq(s["1-1"], 3, "1-1 linked with 2-2 (both filled): +2");
  eq(s["2-2"], 4, "2-2 gets the boost too");
  eq(s["1-8"], 10, "capped at 10");
  eq(s["3-3"], 5, "3-3 linked with 1-8");
  eq(st(["1-1", null, null, null, null, null, null, null], [[0, 1]])["1-1"], 1, "the other slot is empty: no boost");
});
test("Random links: 1, 2 or 3 pairs of different slots", () => {
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    const links = randomLinks();
    seen.add(links.length);
    const flat = links.flat();
    assert(links.length >= 1 && links.length <= 3, "pair count");
    eq(new Set(flat).size, flat.length, "every slot at most once");
    assert(flat.every((n) => n >= 0 && n < 8), "slot range");
  }
  eq([...seen].sort().join(), "1,2,3", "all three counts happen");
});
test("Effects scale with the gym: weak at the first gyms, strong at the last", () => {
  const early = perkInfo("sturdy-stone", 1).param, late = perkInfo("sturdy-stone", 8).param;
  assert(early <= 0.05, `Sturdy Stone at strength 1 is ${early}`);
  assert(late > early * 3, "it grows");
  eq(perkInfo("reroll", 2).param, 1, "Reroller early");
  eq(perkInfo("reroll", 7).param, 2, "Reroller late");
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
  eq(b.stats.atk.toFixed(3), (0.02 + perkInfo("stat-atk", 5).param).toFixed(3), "set bonus (3 Kanto badges) + Brawler (gym 5, not linked)");
  eq(b.stats.def, 0.02, "set bonus only");
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

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
