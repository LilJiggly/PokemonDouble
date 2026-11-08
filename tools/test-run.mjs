// =====================================================
// RUN-LEVEL TESTS (gym badges, perks)
// Usage: node tools/test-run.mjs
// =====================================================

import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareData } from "../js/engine/data.js";
import { parseRules } from "../js/game/rules.js";
import { Pokedex } from "../js/game/pokedex.js";
import * as Run from "../js/game/run.js";
import { Battle } from "../js/engine/battle.js";
import { ITEMS, pocketOf } from "../js/game/item-catalog.js";
import { SLOT_UNLOCKS, slotUnlocked, unlockedSlotCount, badgeStatBoost, statOfBadge, unlockBadge, placeBadge, removeBadge, caseOf, caseStrengths, randomZones, validZones, badgeName, setBonus, battleBonus, perkInfo, perkOfBadge, ALL_BADGES } from "../js/game/badges.js";
import { tpCheck, restoreTp, beatenCount } from "../js/game/meta.js";
import { emptyMeta, recordRun, migrateMeta, perksFromMeta, unlockedRules, spentOnTree, respecTree, canBuyUpgrade, buyUpgrade, lockReason, trainerPointsFor } from "../js/game/meta.js";
import { ruleProgressText } from "../js/game/unlocks.js";
import { grantUnlocks, isUnlocked, meetsRule, unlockText, nextHint, parseRule, setFriendshipSpecies } from "../js/game/unlocks.js";
import { levelUpMovesAt } from "../js/game/recruit.js";
import { noteBattleWon, noteRunEnd } from "../js/game/progress.js";
import { CHALLENGES, MONO_TYPES, secretAt, secretRevealed, backfillChallenges } from "../js/game/challenges.js";
import { buildStats, ownedSpecies, fmtDuration } from "../js/game/stats.js";
import { rankOf, rankScore } from "../js/game/ranks.js";
import { mergeSaves } from "../js/game/cloud.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (p) => JSON.parse(await fs.readFile(path.join(ROOT, p), "utf8"));
const data = prepareData({ pokemon: await readJson("data/pokemon.json"), moves: await readJson("data/moves.json"), abilities: await readJson("data/abilities.json") });
const rules = parseRules(await fs.readFile(path.join(ROOT, "DESIGN.md"), "utf8"), data);
const dex = new Pokedex(data, await readJson("data/evolutions.json"), rules);
const leaders = {};
for (const g of [1, 2, 3, 4, 5]) leaders[g] = await readJson(`data/leaders/gen${g}.json`);
const evil = {};
for (const g of [1, 2, 3, 4, 5]) evil[g] = await readJson(`data/leaders/evil${g}.json`);
const ctx = { data, dex, rules, leaders, evil, tms: await readJson("data/tms.json") };

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
  const run = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 7, badges: ["3-7"], badgeLinks: [{ slots: [0], boost: 3 }, { slots: [1, 2, 3, 4, 5, 6, 7], boost: 1 }] });
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
test("Strength = gym number + the boost of its zone (+1 to +4)", () => {
  const st = (slots, zones) => Object.fromEntries(caseStrengths(slots, zones).map((b) => [b.id, b.strength]));
  const slots = ["1-1", "2-2", null, null, null, null, "1-8", "3-3"];
  eq(st(slots, [])["1-1"], 1, "no zones");
  const s = st(slots, [{ slots: [0, 1], boost: 2 }, { slots: [6], boost: 1 }, { slots: [7], boost: 4 }]);
  eq(s["1-1"], 3, "a ★★ zone: +2");
  eq(s["2-2"], 4, "everyone in the zone gets it");
  eq(s["1-8"], 9, "★ zone: 8 + 1");
  eq(s["3-3"], 7, "★★★★ zone: 3 + 4");
  eq(st(["1-8", null, null, null, null, null, null, null], [{ slots: [0], boost: 4 }])["1-8"], 10, "capped at 10");
});
test("The case's zones are fixed: A A B B / C C C D with ★, ★★, ★★★ and ★★★★", () => {
  const zones = randomZones();
  eq(zones.map((z) => z.slots.join("")).join(" "), "01 23 456 7", "the slots of each zone");
  eq(zones.map((z) => z.boost).join(), "1,2,3,4", "boosts ★ to ★★★★");
  assert(validZones(zones), "valid");
  assert(!validZones([{ slots: [0, 1], boost: 2 }, { slots: [2, 3], boost: 1 }, { slots: [4, 5, 6], boost: 3 }, { slots: [7], boost: 4 }]), "other layouts and older saves are replaced");
  const st = Object.fromEntries(caseStrengths(["1-1", "1-1x", null, null, null, null, null, "1-8"].map((x) => (x === "1-1x" ? "1-2" : x)), zones).map((b) => [b.id, b.strength]));
  eq(st["1-1"], 2, "gym 1 in the ★ zone");
  eq(st["1-8"], 10, "gym 8 in the ★★★★ zone is capped at 10");
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
  const b = battleBonus({ badges: { slots, links: [{ slots: [0, 1], boost: 2 }] } }, ctx.rules); // slots 0 and 1 share a ★★ zone: +2 each
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
  const sample = { alts: parseRule("Wins: 3 and Starters: kanto or Line picks 3: ralts") };
  eq(sample.alts.length, 2, "'or' makes two ways");
  eq(sample.alts[0].length, 2, "'and' needs both");
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
  const sample = { alts: parseRule("Wins: 3 and Starters: kanto or Line picks 3: ralts") };
  assert(meetsRule(m2, sample), "picking Ralts 3 times is the second way");
  const m3 = emptyMeta();
  m3.wins = 3;
  assert(!meetsRule(m3, sample), "needs the Kanto starters as well");
  m3.starters = { kanto: true };
  assert(meetsRule(m3, sample), "both clauses met");
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
  eq((may.bag["wise-glasses"] ?? 0) - (base.bag["wise-glasses"] ?? 0), 1, "a Wise Glasses");
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

test("A thin pool repeats Pokémon instead of leaving the team short", () => {
  const run = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 3 });
  const row = { ...Run.rowFor(ctx, 1), teamSize: 4, level: 12, order: 1 };
  const team = Run.poolTeam(run, { ...ctx, rules: { ...ctx.rules, minChoice: 0.1 } }, { id: "brock" }, row, [[], ["geodude", "onix"]]);
  eq(team.length, 4, "a full team");
  const species = team.map((m) => m.species);
  assert(new Set(species).size <= 2, `only two species exist, so some repeat: ${species}`);
  assert(species.filter((s) => s === "geodude").length >= 1 && species.filter((s) => s === "onix").length >= 1, "both are used before repeating");
});

test("Case slots open up as you own more badges", () => {
  eq(SLOT_UNLOCKS.join(), "0,0,0,4,8,14,22,32", "thresholds");
  const m = emptyMeta();
  for (const id of ["1-1", "1-2", "1-3"]) unlockBadge(m, ...id.split("-").map(Number));
  eq(unlockedSlotCount(m), 3, "three slots at the start");
  assert(!slotUnlocked(m, 3), "slot 4 is locked with 3 badges");
  assert(!placeBadge(m, "1-1", 3), "can't put a badge in a locked slot");
  assert(placeBadge(m, "1-1"), "auto placement works");
  eq(caseOf(m).indexOf("1-1"), 0, "…into the first open slot");
  unlockBadge(m, 1, 4);
  eq(unlockedSlotCount(m), 4, "the 4th badge opens slot 4");
  assert(placeBadge(m, "1-4", 3), "now slot 4 takes a badge");
  m.badgeCase = ["1-1", "1-2", "1-3", "1-4", null, null, null, "1-4"]; // a badge saved in a slot that is not open is ignored
  eq(caseOf(m)[7], null, "locked slots stay empty");
});

test("Ranks: everyone starts at Z and climbs; saves combine without losing progress", () => {
  eq(rankOf(rankScore({})).letter, "Z", "new players are Z");
  assert(rankOf(rankScore({ best: 14, wins: 1 })).letter < "Z", "a first win climbs");
  eq(rankOf(rankScore({ best: 14, wins: 40, cleanWins: 30, badges: 40, trainers: 37 })).letter, "A", "a long career reaches A");
  const m = mergeSaves({ meta: { treeVersion: 1, runs: 2, wins: 1, best: 9, badges: ["1-1"], upgrades: { scout: 1 } }, hof: [], run: null },
    { meta: { treeVersion: 1, runs: 4, wins: 2, best: 14, badges: ["1-2"], upgrades: { scout: 2 } }, hof: [], run: null });
  eq(m.meta.runs, 6, "runs add up");
  eq(m.meta.best, 14, "best keeps the higher");
  eq(m.meta.badges.length, 2, "badges are joined");
  eq(m.meta.upgrades.scout, 2, "upgrades keep the higher level");
});

test("Trainer perks: start items, extra cards, shop discounts, shiny odds, battle effects", () => {
  const mk = (character, seed = 11) => Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed, character });
  const base = mk("lucas");
  eq(mk("red-e").perks.gift, 1, "Red (Battle Frontier): one extra item pick");
  eq(mk("steven").bag["metal-coat"], 1, "Steven: Metal Coat");
  eq(mk("hilbert").offer.options.length, base.offer.options.length + 1, "Hilbert: one extra starter card");
  eq(mk("red-gb").offer.options.length, base.offer.options.length + 1, "Red (R/B): one extra Kanto starter card");
  eq(mk("mira").perks.scout, 1, "Mira: one extra recruit card");
  eq(mk("hugh").charFx.prize, 10, "Hugh: +10% prize money");
  eq(mk("dawn").perks.dice, 1, "Dawn: one extra reroll");
  eq(mk("red-e").charFx.stat.all, 5, "Red (Battle Frontier): +5% to all stats");
  eq(mk("barry").bag["quick-claw"], 1, "Barry: Quick Claw");
  eq(mk("chili").charFx.power.fire, 5, "Chili: Fire moves 5% harder");
  const may = mk("may-rs");
  assert(may.charFx.discount.evo === 50, "May (R/S): evolution stones half price");
  // In battle: Fire moves hit harder with the perk, Potions heal more
  const fx = { stats: {}, names: {}, effects: { "power-fire": 0.05, potion: 20 } };
  const mkBattle = (badge) => Battle.create(ctx.data, { seed: 3, sides: [{ name: "P", isPlayer: true, team: [{ species: "charizard", level: 50, nature: "hardy", moves: ["flamethrower"] }, { species: "magikarp", level: 50, nature: "hardy", moves: ["splash"] }], badge, bag: { potion: { name: "Potion", count: 1, effect: { heal: 20 } } } }, { name: "F", team: [{ species: "snorlax", level: 50, nature: "hardy", moves: ["splash"] }, { species: "magikarp", level: 50, nature: "hardy", moves: ["splash"] }] }] });
  const dmgOf = (b) => b.calcDamage(b.monAt(0, 0), b.monAt(1, 0), ctx.data.moves.flamethrower, { type: "fire", crit: false, spread: false, roll: 100 });
  assert(dmgOf(mkBattle(fx)) > dmgOf(mkBattle(null)), "Fire hits harder with the perk");
});

test("Dupes clause: a fallen line doesn't come back as a recruit, unless the clause is off", () => {
  const seen = (dupes) => {
    let hits = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const run = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed, dupes });
      run.fallen.push({ species: "volcarona", name: "Volcarona", level: 20, order: 1, opponent: "x" });
      run.lines.push(ctx.dex.lineOf.volcarona);
      const offer = Run.makeRecruitOffer(run, ctx, { count: 12, picks: 1, odds: ctx.rules.progression[1].odds, level: 30 });
      if (offer.options.some((o) => ctx.dex.lineOf[o.spec.species] === ctx.dex.lineOf.volcarona)) hits++;
    }
    return hits;
  };
  eq(seen(true), 0, "never offered with the clause");
  assert(seen(false) > 0, "offered when the clause is off");
});

test("New unlock clauses: full team, every generation, fast win, friendship evolutions; foes have random IVs", () => {
  const m = emptyMeta();
  const full = parseRule("Full team: dragon");
  assert(!meetsRule(m, { alts: full }), "locked at first");
  m.fullTeam = { dragon: true };
  assert(meetsRule(m, { alts: full }), "a team of six Dragon-types");
  const all = { alts: parseRule("Win all gens") };
  m.winGens = { 1: 1, 2: 1, 3: 1, 4: 1 };
  assert(!meetsRule(m, all), "four generations are not enough");
  m.winGens[5] = 1;
  assert(meetsRule(m, all), "every generation");
  const fast = { alts: parseRule("Fast win: 60") };
  m.fastestWin = 61 * 60000;
  assert(!meetsRule(m, fast), "61 minutes is too slow");
  m.fastestWin = 59 * 60000;
  assert(meetsRule(m, fast), "under an hour");
  setFriendshipSpecies(["crobat", "blissey", "lucario"]);
  const fr = { alts: parseRule("Friendship: 2") };
  m.species = ["crobat", "pikachu"];
  assert(!meetsRule(m, fr), "one friendship evolution");
  m.species.push("lucario");
  assert(meetsRule(m, fr), "two friendship evolutions");
  const foeIvs = new Set();
  for (let seed = 1; seed <= 12; seed++) {
    const r = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed });
    r.order = 1;
    r.opponent = r.nextOpponent;
    for (const mon of Run.opponentTeam(r, ctx).team) foeIvs.add(JSON.stringify(mon.ivs));
  }
  assert(foeIvs.size > 5, "foe IVs vary");
});

test("Cynthia: her six Platinum Pokémon can all be recruited before the end of a run; winning the last battle with all six on your team unlocks her", () => {
  const team = ["garchomp", "spiritomb", "roserade", "togekiss", "lucario", "milotic"];
  const rule = unlockRules.cynthia;
  assert(rule && rule.alts[0][0].kind === "finalTeam", "rule parsed");
  const lastLevel = Run.levelFor(ctx, 13);
  for (const k of team) assert(ctx.dex.highestLegalStages(ctx.dex.lineOf[k], lastLevel, () => true).includes(k), `${k} is recruitable by level ${lastLevel}`);
  const end = (m, run) => noteRunEnd(m, { fallen: [], lines: [], settings: { gen: 1, modes: {} }, stats: { species: [], items: 0, berries: 0, picks: [] }, order: 14, lastBattle: { order: 14 }, ...run }, ctx);
  const mon = (species) => ({ species, level: 70, moves: [] });
  const m = emptyMeta();
  end(m, { screen: "won", team: team.slice(0, 5).map(mon) });
  eq(m.finalTeamBest[team.join(",")].length, 5, "five of the six in the last battle");
  assert(!meetsRule(m, rule), "five is not enough");
  const lost = emptyMeta();
  end(lost, { screen: "lost", team: team.map(mon) });
  assert(!meetsRule(lost, rule), "all six but losing the last battle does not count");
  const early = emptyMeta();
  end(early, { screen: "lost", team: team.map(mon), order: 9, lastBattle: { order: 9 } });
  assert(!early.finalTeamBest, "a run that never reached the last battle records nothing");
  const m2 = emptyMeta();
  end(m2, { screen: "won", team: [...team.map(mon), mon("pikachu")].slice(0, 6) });
  assert(meetsRule(m2, rule), "winning the last battle with all six unlocks Cynthia");
});

test("Locked trainers show their progress", () => {
  const m = { ...emptyMeta(), wins: 2 };
  const wins5 = Object.values(unlockRules).find((r) => r.alts.length === 1 && r.alts[0].length === 1 && r.alts[0][0].kind === "wins" && r.alts[0][0].n === 5);
  if (wins5) { const p = ruleProgressText(m, wins5); eq(p.text, "2 of 5", "text"); eq(Math.round(p.share * 100), 40, "share"); }
  const c = ruleProgressText({ ...emptyMeta(), finalTeamBest: { "garchomp,spiritomb,roserade,togekiss,lucario,milotic": ["garchomp", "lucario"] } }, unlockRules.cynthia);
  eq(c.text, "", "Cynthia: a team to bring, no count"); assert(c.share > 0, "…but the share still moves");
});

test("Trainer Points check: earned, spent, left, and a restore up to what the wins pay", () => {
  const meta = { ...emptyMeta(), wins: 15, earned: 100, tp: 0, upgrades: { "hp-flat": 1 } };
  const c = tpCheck(meta, rules);
  eq(c.fullRun, 24, "a full run pays 24"); eq(c.floor, 360, "15 wins pay at least 360"); eq(c.missing, 260, "260 below that");
  eq(c.spent, rules.upgrades.find((n) => n.id === "hp-flat").costs[0], "spent on the tree");
  eq(restoreTp(meta, rules), 260, "restores the difference"); eq(meta.earned, 360, "earned is raised"); eq(meta.tp, 260, "and so is the balance");
  eq(restoreTp(meta, rules), 0, "nothing more to restore");
  const sections = buildStats({ ...emptyMeta(), wins: 3, earned: 80 }, [], ctx, { trainers: 1, trainersTotal: 37 });
  const tp = sections.find((s) => s.title === "Trainer Points");
  assert(tp && !tp.action, "an earned total above the floor shows no restore");
  assert(buildStats({ ...emptyMeta(), wins: 15, earned: 10 }, [], ctx, {}).find((s) => s.title === "Trainer Points").action, "below the floor: a restore");
});

test("Hilda, Bianca and Riley perks", () => {
  const afterFirstBattle = (character, seed) => {
    const r = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed, character });
    Run.pickRecruit(r, ctx, 0);
    while (r.offer?.kind === "recruit" && r.offer.picksLeft > 0) Run.pickRecruit(r, ctx, r.offer.options.findIndex((o) => !o.taken));
    r.order = 1;
    r.opponent = r.nextOpponent;
    Run.startBattle(r, ctx);
    r.battle.winner = 0;
    Run.finishBattle(r, ctx);
    return r;
  };
  const base = afterFirstBattle("lucas", 21);
  const bianca = afterFirstBattle("bianca", 21);
  const hilda = afterFirstBattle("hilda", 21);
  eq(base.screen, "recruit", "a recruit screen follows battle 1");
  eq(bianca.offer.rerollsLeft, base.offer.rerollsLeft + 1, "Bianca: one more free reroll");
  eq(hilda.offer.options.length, base.offer.options.length + 1, "Hilda: one more card");
  assert(hilda.offer.options.at(-1).tier === "rare", "…and it is Rare");
  const slots = ["1-1", "1-5", null, null, null, null, null, null];
  const plain = caseStrengths(slots, []);
  const riley = caseStrengths(slots, [], 1);
  eq(riley.find((b) => b.id === "1-1").strength, plain.find((b) => b.id === "1-1").strength + 1, "Riley: the weakest badge gets +1");
  eq(riley.find((b) => b.id === "1-5").strength, plain.find((b) => b.id === "1-5").strength, "…and only that one");
});

test("Fixed Six: pick six at the start, and no recruit screen follows a battle", () => {
  const r = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 5, fixedSix: true });
  eq(r.offer.picks, 6, "six picks");
  assert(r.offer.options.length >= 6, "enough cards to choose from");
  while (r.offer?.kind === "recruit" && r.offer.picksLeft > 0) Run.pickRecruit(r, ctx, r.offer.options.findIndex((o) => !o.taken));
  eq(r.team.length, 6, "a full team of six");
  r.order = 1;
  r.opponent = r.nextOpponent;
  Run.startBattle(r, ctx);
  r.battle.winner = 0;
  Run.finishBattle(r, ctx);
  assert(r.screen !== "recruit", `no recruit screen (got ${r.screen})`);
  assert(CHALLENGES.find((c) => c.id === "fixed-six").check(r.team, r, ctx), "counts for the challenge");
});

test("Old Hall of Fame wins count again for the challenges they fit (a mono Water win gives Team Aqua)", () => {
  const meta = emptyMeta();
  const hof = [
    { team: ["squirtle", "psyduck", "poliwag", "staryu", "magikarp", "lapras"].map((k) => ({ species: k, level: 60 })), fallen: 1, fallenMons: [{ species: "horsea" }] },
    { team: [{ species: "charmander", level: 50, shiny: true }, { species: "squirtle", level: 50 }], fallen: 0, fallenMons: [], rules: { modes: { hard: true } } },
  ];
  assert(backfillChallenges(meta, hof, ctx), "something was added");
  assert(meta.challenges.includes("team-aqua"), "Team Aqua from the all-Water team (the fallen Horsea is Water too)");
  assert(meta.challenges.includes("flawless") && meta.challenges.includes("shiny") && meta.challenges.includes("hard-win"), "flawless, shiny and the Hard mode win from the second entry");
  assert(!meta.challenges.includes("team-magma"), "not Team Magma");
  assert(!backfillChallenges(meta, hof, ctx), "a second pass adds nothing");
  const bad = emptyMeta();
  backfillChallenges(bad, [{ team: [{ species: "squirtle", level: 5 }], fallen: 0, fallenMons: [{ species: "charmander" }] }], ctx);
  assert(!bad.challenges.includes("team-aqua"), "a fallen Fire type breaks Team Aqua");
});
test("Bigger Bag starts the run with random held items", () => {
  const give = (bag) => Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 5, perks: { bag } }).bag;
  eq(Object.keys(give(0)).length, 0, "nothing without the node");
  eq(Object.values(give(1)).reduce((a, b) => a + b, 0), 1, "level 1: one item");
  eq(Object.values(give(2)).reduce((a, b) => a + b, 0), 2, "level 2: two items");
  assert(Object.keys(give(2)).every((id) => ITEMS[id].kind === "held" && !ITEMS[id].retired), "held items only, none retired");
});

test("Forfeit ends the run as a loss and still pays for the battles you beat", () => {
  const r = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 4 });
  while (r.offer?.kind === "recruit" && r.offer.picksLeft > 0) Run.pickRecruit(r, ctx, r.offer.options.findIndex((o) => !o.taken));
  // In the hub before battle 4: three battles are beaten
  r.screen = "hub"; r.order = 4; r.opponent = r.nextOpponent;
  Run.forfeit(r);
  eq(r.screen, "over", "the run is over"); assert(r.lastBattle.forfeited, "marked as forfeited");
  eq(trainerPointsFor(r, rules), 3, "3 gyms beaten = 3 TP");
  // On the recruit screen after battle 5 the fifth is already won
  const r2 = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 4 });
  r2.screen = "recruit"; r2.order = 5; Run.forfeit(r2);
  eq(trainerPointsFor(r2, rules), 5, "5 gyms beaten = 5 TP");
  // Mid battle 1: nothing beaten yet
  const r3 = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 4 });
  r3.screen = "battle"; r3.order = 1; r3.opponent = { name: "Brock" }; Run.forfeit(r3);
  eq(trainerPointsFor(r3, rules), 0, "forfeiting the first battle pays nothing");
  const meta = emptyMeta();
  noteRunEnd(meta, { ...r, fallen: [], lines: [], settings: r.settings, stats: null }, ctx);
  eq(meta.forfeits, 1, "counted as a forfeit"); eq(meta.battlesLost ?? 0, 0, "…not as a lost battle");
});

console.log("Evil team paths");
test("Evil team paths: 14 battles each, bosses with anchors, signatures and pools, no badges, own win counter", () => {
  for (const g of [1, 2, 3, 4, 5]) {
    const file = ctx.evil[g];
    eq(file.opponents.length, 14, `Gen ${g}: 14 battles`);
    assert(file.opponents.every((o, i) => o.order === i + 1 && o.id && o.name && o.title), `Gen ${g}: orders 1 to 14 in a row`);
    for (const b of file.opponents.filter((o) => o.order >= 13)) {
      assert(b.signature.length >= 4 && b.pool.length >= 6, `Gen ${g} battle ${b.order}: a signature and a pool`);
      assert([...b.anchor, ...b.signature, ...b.pool].every((k) => data.pokemonByKey[k]), `Gen ${g} battle ${b.order}: real species`);
    }
    for (const o of file.opponents.filter((x) => x.order <= 12)) assert(o.pool.length >= 14 && o.pool.length <= 24, `Gen ${g} battle ${o.order}: a themed pool of 14 to 24 (${o.pool.length})`);
    assert(file.opponents[13].options?.length === 1, `Gen ${g}: the final slot works like the Rival`);
    for (const o of file.opponents) for (const id of o.sprites ?? [o.id]) assert(fsSync.existsSync(path.join(ROOT, `images/trainers/${id}.png`)), `${id}.png exists`);
  }
  // A run on the Gen 4 path
  const r = Run.newRun(ctx, { gen: 4, pools: [1, 2, 3, 4, 5], seed: 8, path: "evil" });
  eq(r.settings.path, "evil", "the path is saved in the run");
  eq(Run.leaderFor(r, ctx, 7).name, "Mars", "battle 7 is Mars");
  eq(Run.regionOf(r, ctx), "Sinnoh · Team Galactic", "the region is the team's");
  while (r.offer?.kind === "recruit" && r.offer.picksLeft > 0) Run.pickRecruit(r, ctx, r.offer.options.findIndex((o) => !o.taken));
  for (const order of [1, 7, 13, 14]) {
    const run = structuredClone(r); run.order = order; run.opponent = Run.chooseOpponent(run, ctx, order);
    const team = Run.opponentTeam(run, ctx).team;
    assert(team.length >= 2 && team.every((m) => data.pokemonByKey[m.species]), `battle ${order}: a team`);
    if (order === 14) assert(team.some((m) => m.species === "dialga"), "the finale has Dialga");
    if (order === 1) assert(team.every((m) => ctx.evil[4].opponents[0].pool.some((k) => ctx.dex.lineOf[k] === ctx.dex.lineOf[m.species])), "a grunt brings the team's own Pokémon, whatever their type");
  }
  // Winning gym 1 gives no badge on a Team path, and the run pays +25%
  r.order = 1; r.opponent = Run.chooseOpponent(r, ctx, 1); Run.startBattle(r, ctx); r.battle.winner = 0; Run.finishBattle(r, ctx);
  eq(r.lastBattle.rewards.badge, null, "no badge on a Team path");
  eq(trainerPointsFor({ screen: "won", perks: {}, settings: { path: "evil" } }, rules), 24, "a Team path pays the normal 24 TP (no bonus)");
  // Its wins are counted apart from the normal Challenge Gen wins
  const meta = emptyMeta();
  recordRun(meta, { screen: "won", settings: { gen: 4, path: "evil" }, team: [], fallen: [], lastBattle: { order: 14 } }, null);
  eq(meta.winGens?.[4] ?? 0, 0, "not a normal Gen 4 win"); eq(meta.evilWins[4], 1, "an evil Gen 4 win");
  // The challenge for the path
  const c = CHALLENGES.find((x) => x.id === "evil-4");
  assert(c.check([], { settings: { path: "evil", gen: 4 } }, ctx) && !c.check([], { settings: { path: "evil", gen: 3 } }, ctx) && !c.check([], { settings: { gen: 4 } }, ctx), "the Evil Sinnoh challenge needs that path");
});

test("Type Magnet: three upgrades, the favoured type turns up on every recruit screen (starter draft and rerolls too)", () => {
  const m = emptyMeta();
  m.upgrades = { "type-magnet": 1, "type-magnet-2": 1, "type-magnet-3": 1 };
  const perks = perksFromMeta(m, rules);
  eq(perks.typeMagnet, 3, "three upgrades add up to three cards"); assert(perks.unlocked.includes("type-magnet"), "the first one unlocks the Rules card");
  const typeCount = (offer, type) => offer.options.filter((o) => data.pokemonByKey[o.spec.species].types.includes(type)).length;
  for (const type of ["steel", "ice", "ghost", "water"]) for (const seed of [1, 2, 3, 4, 5, 6]) {
    const r = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed, perks, favType: type });
    assert(typeCount(r.offer, type) >= 3, `${type}, seed ${seed}: 3 cards of the type in the starter draft (got ${typeCount(r.offer, type)})`);
    eq(r.offer.magnet.type, type, "the offer says which type is favoured");
    const before = r.offer.options.length;
    r.offer.rerollsLeft = 1; Run.rerollOffer(r, ctx);
    assert(typeCount(r.offer, type) >= 3 && r.offer.options.length === before, `${type}: a reroll keeps them`);
    while (r.offer?.kind === "recruit" && r.offer.picksLeft > 0) Run.pickRecruit(r, ctx, r.offer.options.findIndex((o) => !o.taken && data.pokemonByKey[o.spec.species].types.includes(type)) >= 0 ? r.offer.options.findIndex((o) => !o.taken && data.pokemonByKey[o.spec.species].types.includes(type)) : r.offer.options.findIndex((o) => !o.taken));
    r.order = 1; r.opponent = r.nextOpponent; Run.startBattle(r, ctx); r.battle.winner = 0; Run.finishBattle(r, ctx);
    if (r.offer?.kind === "recruit") assert(typeCount(r.offer, type) >= 2, `${type}, seed ${seed}: the recruit screen after battle 1 has the type (got ${typeCount(r.offer, type)})`);
  }
  // Off without a favoured type, with fewer upgrades it gives fewer cards, and Mono type already has them all
  const none = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 3, perks });
  eq(none.offer.magnet, null, "no favoured type, no Magnet");
  const one = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 3, perks: { ...perks, typeMagnet: 1 }, favType: "ghost" });
  assert(typeCount(one.offer, "ghost") >= 1, "one upgrade: one card");
  const mono = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 3, perks, favType: "ghost", modes: { mono: true }, monoType: "water" });
  eq(mono.offer.magnet, null, "Mono type needs no Magnet");
});

test("Run rules open by winning the generation you play (per generation); the Modes nodes are gone and what was spent on them comes back", () => {
  assert(!rules.upgrades.some((n) => n.id.startsWith("mode-")), "no mode nodes in the tree");
  eq(Object.keys(rules.ruleUnlocks).length, 7, "seven rules in the unlock table (Mono type opens with challenges)");
  const open = (meta, gen) => [...unlockedRules({ ...emptyMeta(), ...meta }, rules, gen)].filter((id) => id.startsWith("mode-")).sort();
  eq(open({}, 1).length, 0, "nothing at the start");
  eq(open({ winGens: { 1: 1 } }, 1).join(), "mode-hard,mode-levels", "1 win in Gen 1: Hard mode and Random levels");
  eq(open({ winGens: { 1: 2 } }, 1).length, 4, "2 wins: Random moves and Rainbow too");
  eq(open({ winGens: { 1: 3 } }, 1).length, 6, "3 wins: No items and Random gyms too");
  eq(open({ winGens: { 1: 4 } }, 1).length, 6, "4 wins: nothing new");
  eq(open({ winGens: { 1: 5 } }, 1).length, 7, "5 wins: Fixed Six");
  const monoIds = MONO_TYPES.map((m) => m.id);
  const hasMono = (meta) => open(meta, 1).includes("mode-mono");
  assert(!hasMono({}), "no trials: no Mono type");
  assert(!hasMono({ challenges: ["hard-win", "flawless"] }), "two trials are not enough");
  assert(hasMono({ challenges: ["hard-win", "flawless", "legend"] }), "any three trials open Mono type");
  assert(hasMono({ challenges: [...monoIds.slice(0, 3), "flawless"], evilWins: { 2: 1 } }), "3 type challenges, a flawless win and an evil path win");
  assert(!hasMono({ challenges: monoIds.slice(0, 2) }), "2 type challenges are not a trial yet");
  assert(hasMono({ challenges: ["hard-win"], winGens: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }, evilWins: { 1: 1 } }), "all generations and an evil path win, plus Hard mode");
  eq(open({ winGens: { 1: 3 } }, 2).length, 0, "…but Gen 2 has to be won on its own");
  eq(open({ winGens: { 2: 1 }, evilWins: { 2: 1 } }, 2).length, 4, "an evil path win of that generation counts too");
  assert(unlockedRules({ ...emptyMeta(), upgrades: { "type-magnet": 1 } }, rules, 1).has("type-magnet"), "Skill Tree unlocks still count");
  // Respec: every upgrade back for 80% of the TP spent
  const rm = emptyMeta();
  rm.upgrades = { "hp-flat": 2, "atk-flat": 1, "type-magnet": 1 };
  rm.tp = 3;
  const spent = spentOnTree(rm, rules.upgrades);
  eq(spent, 3 + 5 + 3 + 40, "the TP spent: HP + (3 and 5), Attack + (3) and Type Magnet (40)");
  const r = respecTree(rm, rules.upgrades);
  eq(r.refund, Math.floor(spent * 0.8), "80% comes back"); eq(r.fee, spent - r.refund, "20% is the fee");
  eq(rm.tp, 3 + r.refund, "added to the TP"); eq(Object.keys(rm.upgrades).length, 0, "the tree is empty again");
  eq(spentOnTree(rm, rules.upgrades), 0, "nothing left to take back");
  // A save from version 1 that bought Modes nodes: refunded once
  const old = { treeVersion: 1, tp: 5, upgrades: { "mode-hard": 1, "mode-mono": 1, "hp-flat": 2, "mode-moves": 1 } };
  assert(migrateMeta(old), "migrated");
  eq(old.tp, 5 + 60 + 60 + 40, "the TP of the three mode nodes comes back");
  assert(!("mode-hard" in old.upgrades) && old.upgrades["hp-flat"] === 2, "only the mode nodes are removed");
  eq(old.refundNote, 160, "the Skill Tree tells the player");
  assert(!migrateMeta(old), "only once");
});
test("Trainers can unlock after clearing a special mode (Mode win, Evil win)", () => {
  const meta = { ...emptyMeta(), modeWins: { hard: 1 }, evilWins: { 3: 1, 4: 2 } };
  const rule = (text) => ({ alts: parseRule(text) });
  const have = (text) => meetsRule(meta, rule(text));
  assert(have("Mode win: hard") && !have("Mode win: mono"), "Mode win: hard");
  assert(have("Evil win Gen 3") && !have("Evil win Gen 5"), "Evil win Gen 3");
  assert(have("Evil wins: 2") && !have("Evil wins: 3"), "two different evil paths");
  eq(unlockText(rule("Mode win: noitems")), "Win with No items on", "readable text");
  const run = { screen: "won", team: [], fallen: [], lines: [], settings: { gen: 2, path: "evil", fixedSix: true, modes: { hard: true, opponents: "mixed" } }, stats: null, lastBattle: { order: 14 } };
  const m = emptyMeta();
  noteRunEnd(m, run, ctx);
  assert(m.modeWins.hard === 1 && m.modeWins.gyms === 1 && m.modeWins.fixed === 1 && m.modeWins.evil === 1, "a win counts for every mode it was won with");
});

console.log("Stats and profile");
test("Stats: sections from the meta save and the Hall of Fame; owned species for the favourites", () => {
  const meta = { ...emptyMeta(), runs: 10, wins: 4, best: 14, cleanWins: 1, battlesWon: 80, battleTurns: 400, battleTurnCount: 80, pokemonLost: 12, playMs: 5400000, species: ["charmander", "pikachu"], challenges: ["flawless"], winGens: { 1: 3, 2: 1 }, typeWins: { fire: 3 }, lineWins: { charmander: 2 } };
  const hof = [{ team: [{ species: "charizard", level: 62 }, { species: "pikachu", level: 58, shiny: true }] }, { team: [{ species: "charizard", level: 70 }] }];
  const sections = buildStats(meta, hof, ctx, { trainers: 9, trainersTotal: 36 });
  const all = Object.fromEntries(sections.flatMap((sec) => sec.rows.map((r) => [r.label, String(r.value)])));
  eq(all["Win rate"], "40%", "win rate"); eq(all["Average turns per win"], "5.0", "turns per win"); eq(all["Time played"], "1 h 30 min", "time played");
  eq(all["Favourite champion"], "Charizard (2)", "most used champion"); eq(all["Highest level in a champion team"], "70", "highest level");
  eq(all["Shiny champions"], "1", "shiny champions"); eq(all["Trainers unlocked"], "9 of 36", "trainers");
  assert(sections.length >= 5 && sections.flatMap((s) => s.rows).length >= 30, "a good list of stats");
  const owned = ownedSpecies(meta, hof, ctx);
  assert(["charmander", "pikachu", "charizard"].every((k) => owned.includes(k)), "recruited species and champion team members");
  assert(owned.indexOf("charmander") < owned.indexOf("pikachu"), "sorted by Pokédex number");
  eq(fmtDuration(30000), "under a minute", "short times");
});

console.log("Items");
test("Berries and healing items are retired from offers, the shop and the starting bag; Nature Mint changes a Nature", () => {
  const retired = new Set(Object.entries(ITEMS).filter(([, it]) => it.retired).map(([id]) => id));
  assert(retired.has("potion") && retired.has("sitrus-berry") && retired.has("full-restore") && !retired.has("leftovers") && retired.has("x-attack") && retired.has("dire-hit") && retired.has("guard-spec"), "the right items are retired (battle items too)");
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const r = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed });
    assert(Object.keys(r.bag).every((id) => !retired.has(id)), "nothing retired in the starting bag");
    while (r.offer?.kind === "recruit" && r.offer.picksLeft > 0) Run.pickRecruit(r, ctx, r.offer.options.findIndex((o) => !o.taken));
    for (let order = 1; order <= 6; order++) {
      r.order = order; r.opponent = r.nextOpponent ?? Run.chooseOpponent(r, ctx, order);
      const shop = Run.rerollShop(r, ctx) && r.shop;
      assert((r.shop?.stock ?? []).every((e) => !retired.has(e.id)), "no retired item in the shop");
    }
  }
  const r = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 2 });
  while (r.offer?.kind === "recruit" && r.offer.picksLeft > 0) Run.pickRecruit(r, ctx, r.offer.options.findIndex((o) => !o.taken));
  const mon = r.team[0];
  r.bag["nature-mint"] = 1;
  const was = mon.nature;
  assert(Run.useNatureMint(r, ctx, mon.uid, was === "adamant" ? "modest" : "adamant").ok, "the mint works");
  assert(mon.nature !== was, "the Nature changed");
  assert(!r.bag["nature-mint"], "the mint is used up");
  assert(!Run.useNatureMint(r, ctx, mon.uid, "modest").ok, "no mint, no change");
});

console.log("Skill tree");
test("Old upgrades are refunded once; merging two old saves refunds both and never double counts", () => {
  const old = { tp: 4, upgrades: { dice: 2, allowance: 3, scout: 1 }, wins: 3 };
  assert(migrateMeta(old), "an old save is migrated");
  eq(old.tp, 4 + 2 * 5 + 3 * 3 + 1, "every TP spent comes back (dice 5 x2, allowance 3 x3, scout 1)");
  eq(Object.keys(old.upgrades).length, 0, "upgrades start over");
  eq(old.refundNote, 20, "the screen can tell the player");
  assert(!migrateMeta(old), "a second pass does nothing");
  eq(old.tp, 24, "…and refunds nothing again");
  const merged = mergeSaves({ meta: { tp: 1, upgrades: { shiny: 1 } }, hof: [], run: null }, { meta: { tp: 2, upgrades: { shiny: 1 } }, hof: [], run: null });
  eq(merged.meta.tp, 1 + 5 + 2 + 5, "both sides refunded, TP added up");
  eq(Object.keys(merged.meta.upgrades).length, 0, "nothing is owned for free");
});
test("Skill tree: every panel builds upwards, milestones gate the late nodes, effects reach the run", () => {
  const nodes = rules.upgrades;
  const node = (id) => nodes.find((n) => n.id === id);
  assert(nodes.length > 50 && nodes.every((n) => n.max > 0 && n.pos.length === 2 && n.icon), "the table is parsed, every node has an icon");
  const m = emptyMeta();
  m.tp = 2000;
  assert(canBuyUpgrade(m, node("atk-flat"), nodes) && canBuyUpgrade(m, node("hp-pct"), nodes) && canBuyUpgrade(m, node("starter-pick"), nodes), "the bottom row of every panel is open from the start");
  assert(!canBuyUpgrade(m, node("atk-flat-2"), nodes), "the next tier needs the one below finished");
  buyUpgrade(m, node("atk-flat"), nodes);
  assert(!canBuyUpgrade(m, node("atk-flat-2"), nodes), "…finished means every level of it");
  buyUpgrade(m, node("atk-flat"), nodes);
  assert(canBuyUpgrade(m, node("atk-flat-2"), nodes), "now tier 2 opens");
  assert(canBuyUpgrade(m, node("atk-pct"), nodes), "the percentage path is separate and was open all along");
  assert(/Win 3 runs/.test(lockReason(m, { ...node("encounter-pick"), requires: [] }, nodes)), "Encounter pick needs 3 wins");
  m.wins = 3;
  buyUpgrade(m, node("starter-pick"), nodes);
  assert(canBuyUpgrade(m, node("encounter-pick"), nodes), "…then it opens above Starter pick");
  assert(!canBuyUpgrade(m, node("final-atk"), nodes), "the final upgrade needs every Attack path finished");
  // Finish all six Attack paths
  for (const stat of ["atk", "spa", "spe"]) for (const kind of ["flat", "pct"]) {
    for (const id of [`${stat}-${kind}`, `${stat}-${kind}-2`, `${stat}-${kind}-3`]) while (canBuyUpgrade(m, node(id), nodes)) buyUpgrade(m, node(id), nodes);
  }
  assert(canBuyUpgrade(m, node("final-atk"), nodes), "with all six paths finished the final upgrade opens");
  assert(!canBuyUpgrade(m, node("final-def"), nodes), "…but not the Defense one");
  buyUpgrade(m, node("final-atk"), nodes);
  const perks = perksFromMeta(m, rules);
  eq(perks.tree.flat.atk, 10, "5 flat levels x +2 Attack");
  eq(perks.tree.pct.atk, 0.1 + 0.05, "5 percentage levels x 2% plus the final +5%");
  eq(perks.tree.pct.spe, 0.1 + 0.05, "the final upgrade reaches all three Attack stats");
  eq(perks.tree.flat.hp ?? 0, 0, "nothing bought in Defense");
  m.upgrades.tp = 2;
  eq(perksFromMeta(m, rules).tpPct, 20, "Pay increase: +10% per level");
  const run = { screen: "won", perks: { tpPct: 20 }, settings: {} };
  eq(trainerPointsFor(run, rules), Math.round(24 * 1.2), "a full win pays 24 TP, +20%");
  eq(trainerPointsFor({ ...run, settings: { modes: { rainbow: true }, fixedSix: true, path: "evil" } }, rules), Math.round(24 * 1.2), "modes, Fixed Six and the evil paths pay no extra TP");
});
test("The tree only raises stats in battle: no node has a battle effect, and the masteries are stat boosts", () => {
  const nodes = rules.upgrades;
  assert(nodes.every((n) => !/^battle:/.test(n.does)), "no battle: effects in the tree");
  const m = emptyMeta();
  m.upgrades = { "hp-mastery": 2, "spe-mastery": 1 };
  const perks = perksFromMeta(m, rules);
  assert(Math.abs(perks.tree.pct.hp - 0.04) < 1e-9 && Math.abs(perks.tree.pct.spe - 0.02) < 1e-9, "Mastery: +2% per level");
});
test("Skill tree economy and run nodes: Haggler, Swap, Wallet, TM Master, Interest, Extra Recruit, Wide Choice, Starter reroll, Training, Second Chance, IV floor", () => {
  const m = emptyMeta();
  m.upgrades = { haggler: 3, swap: 1, wallet: 2, "tm-master": 1, interest: 2, "extra-recruit": 1, "wide-choice": 1, "starter-reroll": 1, "rare-first": 1, training: 1, "second-chance": 1, "iv-floor": 1, "mode-hard": 1 };
  const perks = perksFromMeta(m, rules);
  assert(Math.abs(perks.tree.run.haggler - 0.09) < 1e-9, "Haggler: 3 levels of 3%");
  eq(perks.tree.run.swap, 1, "Swap");
  assert(Math.abs(perks.tree.run.wallet - 0.07) < 1e-9, "Lucky Wallet: 2 levels of 3.5%");
  eq(perks.interestLevel, 2, "Interest level");
  eq(perks.recruitCards, 1, "Extra Recruit"); eq(perks.recruitPicks, 1, "Wide Choice");
  eq(perks.starterReroll, 1, "Starter reroll"); eq(perks.rareFirst, 1, "Rare first"); eq(perks.training, 1, "Training"); eq(perks.revive, 1, "Second Chance"); eq(perks.ivFloor, 5, "IV floor");
  const start = (extra = {}) => Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 3, perks: { ...perks, ...extra } });
  eq(start().offer.rerollsLeft, start({ starterReroll: 0 }).offer.rerollsLeft + 1, "Starter reroll: one more reroll on the draft");
  assert(Math.min(...start().offer.options.map((o) => Math.min(...Object.values(o.spec.ivs)))) >= 20, "IV floor: no IV under 20");
  // Swap works without a badge, once per recruit screen
  const r2 = start();
  while (r2.offer?.kind === "recruit" && r2.offer.picksLeft > 0) Run.pickRecruit(r2, ctx, r2.offer.options.findIndex((o) => !o.taken));
  r2.order = 1; r2.opponent = r2.nextOpponent; Run.startBattle(r2, ctx); r2.battle.winner = 0; Run.finishBattle(r2, ctx);
  assert(r2.offer?.kind === "recruit", "a recruit screen");
  const plain = start({ recruitCards: 0, recruitPicks: 0, rareFirst: 0 });
  while (plain.offer?.kind === "recruit" && plain.offer.picksLeft > 0) Run.pickRecruit(plain, ctx, plain.offer.options.findIndex((o) => !o.taken));
  plain.order = 1; plain.opponent = plain.nextOpponent; Run.startBattle(plain, ctx); plain.battle.winner = 0; Run.finishBattle(plain, ctx);
  eq(r2.offer.options.length, plain.offer.options.length + 2, "Extra Recruit (+1 card) and Rare first (+1 Rare card)");
  eq(r2.offer.picks, plain.offer.picks + 1, "Wide Choice: +1 pick");
  assert(Run.swapForRecruit(r2, ctx, 0, r2.team[0].uid).ok, "Swap works without a badge");
  assert(!Run.swapForRecruit(r2, ctx, 1, r2.team[1].uid).ok, "…once");
  // Training: +1 level in a gym battle
  const trained = start();
  while (trained.offer?.kind === "recruit" && trained.offer.picksLeft > 0) Run.pickRecruit(trained, ctx, trained.offer.options.findIndex((o) => !o.taken));
  trained.order = 1; trained.opponent = trained.nextOpponent;
  const lvl = trained.team[0].level;
  eq(Run.startBattle(trained, ctx).battle.monAt(0, 0).level, lvl + 1, "Training");
  // Second Chance: a Pokémon that fell in a won battle is saved, once
  const fell = start();
  while (fell.offer?.kind === "recruit" && fell.offer.picksLeft > 0) Run.pickRecruit(fell, ctx, fell.offer.options.findIndex((o) => !o.taken));
  fell.order = 1; fell.opponent = fell.nextOpponent; Run.startBattle(fell, ctx);
  const bm = fell.battle.sides[0].team[0]; bm.fainted = true; bm.hp = 0; fell.battle.winner = 0;
  const before = fell.team.length;
  Run.finishBattle(fell, ctx);
  eq(fell.team.length, before, "nobody was lost");
  eq(fell.fallen.length, 0, "…the Pokémon is saved");
  // Interest: money grows by a share of what you hold
  const bank = start(); bank.money = 1000;
  while (bank.offer?.kind === "recruit" && bank.offer.picksLeft > 0) Run.pickRecruit(bank, ctx, bank.offer.options.findIndex((o) => !o.taken));
  bank.order = 1; bank.opponent = bank.nextOpponent; Run.startBattle(bank, ctx); bank.battle.winner = 0;
  const noBank = structuredClone(bank); noBank.perks.interestLevel = 0;
  Run.finishBattle(bank, ctx); Run.finishBattle(noBank, ctx);
  assert(bank.money > noBank.money, "Interest adds money");
});
test("Hard mode, Mono type, No items and Random gyms (modes)", () => {
  const pools = [1, 2, 3, 4, 5];
  const normal = Run.chooseOpponent(Run.newRun(ctx, { gen: 1, pools: [1], seed: 6 }), ctx, 1);
  const hard = Run.chooseOpponent(Run.newRun(ctx, { gen: 1, pools: [1], seed: 6, modes: { hard: true } }), ctx, 1);
  eq(hard.level, normal.level + Run.HARD_MODE_LEVELS, "Hard mode: opponents +2 levels");
  eq(hard.playerLevel, normal.playerLevel, "…your level is unchanged");
  // Mono type
  const mono = Run.newRun(ctx, { gen: 1, pools, seed: 7, modes: { mono: true }, monoType: "water" });
  assert(mono.offer.options.length >= 4 && mono.offer.options.every((o) => ctx.data.pokemonByKey[o.spec.species].types.includes("water")), "every recruit is a Water type");
  // No items
  const none = Run.newRun(ctx, { gen: 1, pools, seed: 8, modes: { noitems: true } });
  eq(Object.keys(none.bag).length, 0, "no bag at the start");
  while (none.offer?.kind === "recruit" && none.offer.picksLeft > 0) Run.pickRecruit(none, ctx, none.offer.options.findIndex((o) => !o.taken));
  assert(none.screen === "hub", `no starter item screen (got ${none.screen})`);
  assert(!none.shop || none.shop.stock.length === 0, "the shop sells no items (only TMs)");
  // Starting item
  const item = Run.newRun(ctx, { gen: 1, pools, seed: 9, picks: { item: "leftovers" } });
  eq(item.bag.leftovers, 1, "a Leftovers in the bag");
  // Random gyms
  const gens = (plan) => new Set(plan.map((g) => g.gen));
  const key = (g) => `${g.gen}-${g.order}`;
  for (const seed of [1, 2, 3, 4, 5]) {
    const sh = Run.newRun(ctx, { gen: 3, pools, seed, modes: { opponents: "shuffled" } }).gymPlan;
    eq(sh.length, 8, "8 gyms"); eq(gens(sh).size, 1, "shuffled keeps the Challenge Gen"); eq(sh[0].gen, 3, "…Gen 3");
    eq(new Set(sh.map(key)).size, 8, "…all different");
    const mixed = Run.newRun(ctx, { gen: 3, pools, seed, modes: { opponents: "mixed" } }).gymPlan;
    const types = mixed.map((g) => ctx.leaders[g.gen].opponents.find((o) => o.order === g.order).theme);
    eq(mixed.length, 8, "mixed: 8 gyms"); eq(new Set(types).size, 8, "mixed: all different types");
    const wild = Run.newRun(ctx, { gen: 3, pools, seed, modes: { opponents: "wild" } }).gymPlan;
    eq(new Set(wild.map(key)).size, 8, "wild: 8 different gyms");
  }
  const rr = Run.newRun(ctx, { gen: 3, pools, seed: 11, modes: { opponents: "mixed" } });
  const plan = rr.gymPlan[0];
  const leader = Run.leaderFor(rr, ctx, 1);
  eq(leader.gen, plan.gen, "the battle uses the planned leader"); eq(leader.gymOrder, plan.order, "…and its place in its own game");
  while (rr.offer?.kind === "recruit" && rr.offer.picksLeft > 0) Run.pickRecruit(rr, ctx, rr.offer.options.findIndex((o) => !o.taken));
  rr.order = 1; rr.opponent = rr.nextOpponent; Run.startBattle(rr, ctx); rr.battle.winner = 0; Run.finishBattle(rr, ctx);
  eq(rr.lastBattle.rewards.badge.gen, plan.gen, "the badge is the gym's own (generation)"); eq(rr.lastBattle.rewards.badge.order, plan.order, "…and number");
});
test("Skill tree stat bonuses reach the battle: flat and percentage, HP too", () => {
  const spec = { species: "machamp", level: 50, nature: "hardy", moves: ["tackle"] };
  const plain = Battle.create(data, { seed: 1, sides: [{ name: "P", isPlayer: true, team: [spec] }, { name: "F", team: [spec] }] }).monAt(0, 0);
  const boosted = Battle.create(data, { seed: 1, sides: [{ name: "P", isPlayer: true, team: [spec], bonus: { flat: { atk: 10, hp: 20 }, pct: { atk: 0.1, hp: 0.1 } } }, { name: "F", team: [spec] }] }).monAt(0, 0);
  eq(boosted.stats.atk, Math.floor(plain.stats.atk * 1.1) + 10, "Attack: +10% then +10");
  eq(boosted.maxHp, Math.floor(plain.maxHp * 1.1) + 20, "max HP");
  eq(boosted.hp, boosted.maxHp, "and the Pokémon starts at full HP");
});
test("Rainbow: this generation's 8 gyms in a random order", () => {
  const r = Run.newRun(ctx, { gen: 3, pools: [1, 2, 3, 4, 5], seed: 5, modes: { rainbow: true } });
  eq(r.gymPlan.length, 8, "8 gyms"); eq(new Set(r.gymPlan.map((g) => g.gen)).size, 1, "all of Gen 3"); eq(new Set(r.gymPlan.map((g) => g.order)).size, 8, "all different");
});
test("Mixed Gens: 8 gyms, 4 Elite Four and a Champion of different types from any game", () => {
  const r = Run.newRun(ctx, { gen: 2, pools: [1, 2, 3, 4, 5], seed: 8, path: "mixed" });
  eq(r.gymPlan.length, 13, "13 planned battles");
  const L = (n) => Run.leaderFor(r, ctx, n);
  eq(new Set([1, 2, 3, 4, 5, 6, 7, 8].map((n) => L(n).theme)).size, 8, "8 gym types, all different");
  eq(new Set([9, 10, 11, 12].map((n) => L(n).theme)).size, 4, "4 Elite Four types, all different");
  assert([1, 2, 3, 4, 5, 6, 7, 8].every((n) => L(n).gymOrder >= 1 && L(n).gymOrder <= 8), "gyms are gyms");
  eq(L(13).title, "Champion", "a Champion at 13"); eq(Run.regionOf(r, ctx), "All regions", "region name");
  const types = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => L(n).theme);
  const rb = Run.newRun(ctx, { gen: 2, pools: [1, 2, 3, 4, 5], seed: 8, path: "mixed", modes: { rainbow: true } });
  eq(rb.gymPlan.length, 13, "Rainbow keeps the plan");
  assert(types.length === 8, "types listed");
});
test("Mixed Gens: every battle can be set up, and a win counts as a Mixed Gens win only", () => {
  const r = Run.newRun(ctx, { gen: 2, pools: [1, 2, 3, 4, 5], seed: 12, path: "mixed" });
  for (let n = 1; n <= 14; n++) { const o = Run.chooseOpponent(r, ctx, n); assert(o && o.name, `battle ${n} has an opponent`); }
  const meta = emptyMeta();
  recordRun(meta, { screen: "won", team: [], fallen: [], lines: [], settings: { gen: 2, path: "mixed", modes: {} }, playMs: 1 });
  eq(meta.mixedWins, 1, "counted as a Mixed Gens win"); eq(meta.winGens[2] ?? 0, 0, "…not as a Gen 2 win");
});
test("Hard mode: 2 levels, one more Pokémon from battle 3, perfect IVs and a held item", () => {
  const plain = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 21, path: "evil" });
  const hard = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 21, path: "evil", modes: { hard: true } });
  const a = Run.chooseOpponent(plain, ctx, 5), b = Run.chooseOpponent(hard, ctx, 5);
  eq(b.level, a.level + Run.HARD_MODE_LEVELS, "level"); eq(Run.HARD_MODE_LEVELS, 2, "2 levels");
  eq(b.team.length, Math.min(6, a.team.length + 1), "one more Pokémon");
  assert(b.team.every((m) => m.item && Object.values(m.ivs).every((v) => v === 31)), "item and perfect IVs");
  assert(a.team.every((m) => !m.item), "a normal run has none");
  eq(Run.chooseOpponent(hard, ctx, 2).team.length, Run.chooseOpponent(plain, ctx, 2).team.length, "no extra Pokémon in battle 2");
});
test("Evil teams bring their own Pokémon: signature first, then the team pool", () => {
  for (const gen of [1, 2, 3, 4, 5]) {
    const r = Run.newRun(ctx, { gen, pools: [1, 2, 3, 4, 5], seed: 30 + gen, path: "evil" });
    for (let n = 1; n <= 12; n++) {
      const entry = evil[gen].opponents[n - 1];
      const o = Run.chooseOpponent(r, ctx, n);
      assert(o.team.length === o.teamSize, `evil ${gen} battle ${n}: full team`);
      const own = new Set([...entry.pool, ...(entry.signature ?? [])].map((k) => ctx.dex.lineOf[k]));
      const ownCount = o.team.filter((m) => own.has(ctx.dex.lineOf[m.species])).length;
      assert(ownCount >= Math.min(o.team.length, 2), `evil ${gen} battle ${n}: mostly the team's own Pokémon (${ownCount} of ${o.team.length})`);
    }
  }
  const p = Run.chooseOpponent(Run.newRun(ctx, { gen: 3, pools: [1, 2, 3, 4, 5], seed: 9, path: "evil" }), ctx, 11);
  assert(p.team.some((m) => ["numel", "camerupt", "mightyena", "crobat", "poochyena", "golbat", "zubat"].includes(m.species)), "Maxie brings his own");
});
test("Evil paths are a step harder: 1 level up, perfect IVs, items for the elite; Mixed Gens pays double plus a bonus", () => {
  const norm = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 40 });
  const ev = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 40, path: "evil" });
  eq(Run.chooseOpponent(ev, ctx, 3).level, Run.chooseOpponent(norm, ctx, 3).level + Run.EVIL_LEVELS, "+1 level");
  const e3 = Run.chooseOpponent(ev, ctx, 3), e10 = Run.chooseOpponent(ev, ctx, 10);
  assert(e3.team.every((m) => Object.values(m.ivs).every((v) => v === 31) && !m.item), "perfect IVs, no items early");
  assert(e10.team.every((m) => m.item), "items from battle 9");
  const win = { screen: "won", order: 14, team: [], fallen: [], settings: { path: "mixed", modes: {} } };
  const plainTp = trainerPointsFor({ ...win, settings: { path: "normal", modes: {} } }, rules);
  eq(trainerPointsFor(win, rules), plainTp * 2 + 50, "Mixed Gens TP: double, +50 for finishing");
});
test("Mono type: a Pokémon that will become the type can be recruited but waits on the bench", () => {
  assert(Run.eventuallyType(ctx, "onix", "steel"), "Onix becomes Steel (Steelix)");
  assert(!Run.eventuallyType(ctx, "pikachu", "steel"), "Pikachu never does");
  const r = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 3, modes: { mono: true }, monoType: "steel" });
  assert(r.offer.options.every((o) => ctx.data.pokemonByKey[o.spec.species].types.includes("steel") && !o.pending), "the starter draft is only the type");
  // Later recruit screens can hold a pending card (any seed; look for one over some tries)
  let found = null;
  for (let seed = 1; seed < 400 && !found; seed++) {
    const q = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed, modes: { mono: true }, monoType: "steel" });
    const offer = Run.makeRecruitOffer(q, ctx, { count: 6, picks: 1, odds: ctx.rules.progression[2].odds ?? ctx.rules.progression[0].odds, level: 20 });
    found = offer.options.find((o) => o.pending);
  }
  assert(found && !ctx.data.pokemonByKey[found.spec.species].types.includes("steel"), "a card that is not Steel yet is marked pending");
  // On the bench: out of the battle, back in the team afterwards
  const q = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 5, modes: { mono: true }, monoType: "steel" });
  const steel = { ...q.offer.options[0].spec, uid: 101 };
  const onix = { ...steel, species: "onix", uid: 102, moves: levelUpMovesAt(ctx.data.pokemonByKey.onix, 30, ctx.data) };
  q.team = [steel, onix]; q.order = 1; q.opponent = Run.chooseOpponent(q, ctx, 1);
  Run.startBattle(q, ctx);
  eq(q.battle.sides[0].team.length, 1, "only the Steel Pokémon fights");
  q.battle.winner = 0; Run.finishBattle(q, ctx);
  eq(q.team.length, 2, "the benched one is still in the team"); eq(q.team[1].species, "onix", "…in its place");
  assert(Run.benched(q, ctx, onix) && !Run.benched(q, ctx, steel), "benched() tells them apart");
});
test("Gauntlet: five chapters of Elite Four, Champion and rival, 30 battles, carried over", () => {
  const play = (modes = {}, seed = 14) => {
    const r = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed, path: "gauntlet", modes });
    assert(r.offer.starter && r.offer.options.length >= 12 && r.offer.picks === 6, "a draft of six to start");
    while (r.offer && r.team.length < 6) { const i = r.offer.options.findIndex((o) => !o.taken); if (i < 0) break; Run.pickRecruit(r, ctx, i); if (!r.offer || r.offer.picksLeft <= 0) break; }
    if (r.offer) Run.skipOffer(r, ctx);
    return r;
  };
  const r = play();
  eq(r.order, 9, "the first battle is the first Elite Four member"); eq(r.chapter, 0, "chapter 1"); eq(r.settings.gen, 1, "Kanto first");
  assert(r.team.length >= 1 && r.team.every((m) => m.level >= 56), "the team is at the level of battle 9");
  const regions = []; const levels = []; let battles = 0;
  while (r.screen !== "won" && r.screen !== "over" && battles < 40) {
    if (r.screen === "recruit" || r.screen === "items") { if (r.offer) Run.skipOffer(r, ctx); else Run.leaveItems?.(r, ctx); if (r.screen === "items") { r.screen = "hub"; r.order = Run.nextOrder(r); Run.enterHub(r, ctx, r.order); } continue; }
    if (r.screen === "hub") {
      regions.push(r.settings.gen); levels.push(r.opponent.level);
      Run.startBattle(r, ctx); r.battle.winner = 0; Run.finishBattle(r, ctx); battles++;
    }
  }
  eq(battles, 30, "30 battles"); eq(r.screen, "won", "won after the last rival");
  eq(regions.join(""), "111111222222333333444444555555", "Kanto to Unova, six battles each");
  eq(levels[0], 56, "chapter 1 starts at battle 9's level"); eq(levels[6], 56 + 6, "chapter 2 is 6 levels more"); eq(levels[29], 70 + 24, "the last rival is level 94");
  eq(beatenCount(r), 30, "30 beaten"); eq(trainerPointsFor(r, rules), 3 * 5 * (4 * rules.tp.elite + rules.tp.champion + rules.tp.hallOfFame), "triple TP: 240");
  const rb = play({ rainbow: true }, 3);
  eq(new Set(rb.chapterGens).size, 5, "Rainbow: all five regions, in some order");
  eq(Run.regionOf(r, ctx), "Gauntlet", "region name");
  const meta = emptyMeta();
  recordRun(meta, { ...r, settings: { ...r.settings } }, ctx);
  eq(meta.gauntletWins, 1, "its own win counter"); eq(Object.keys(meta.winGens ?? {}).length, 0, "no generation win");
});
test("Evil battles vary from run to run, and bosses keep their signature Pokémon", () => {
  const teamOf = (seed, gen, order) => { const r = Run.newRun(ctx, { gen, pools: [1, 2, 3, 4, 5], seed, path: "evil" }); return Run.chooseOpponent(r, ctx, order).team.map((m) => m.species).sort().join(","); };
  for (const [gen, order] of [[1, 3], [3, 11], [1, 13], [4, 14]]) assert(new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => teamOf(s, gen, order))).size >= 4, `Gen ${gen} battle ${order}: different teams in different runs`);
  const gio = ctx.evil[1].opponents[12];
  for (let seed = 1; seed < 12; seed++) {
    const team = Run.chooseOpponent(Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed, path: "evil" }), ctx, 13).team;
    assert(team.length === 6 && team.filter((m) => gio.signature.some((k) => ctx.dex.lineOf[k] === ctx.dex.lineOf[m.species])).length >= 3, "Giovanni brings at least 3 of his own");
  }
  const final = Run.chooseOpponent(Run.newRun(ctx, { gen: 3, pools: [1, 2, 3, 4, 5], seed: 2, path: "evil" }), ctx, 14).team.map((m) => m.species);
  assert(final.includes("rayquaza"), "Zinnia always brings Rayquaza");
});
test("Evil battles with a type tag really lean into it", () => {
  let checked = 0;
  for (const gen of [1, 2, 3, 4, 5]) for (let seed = 1; seed <= 4; seed++) {
    const r = Run.newRun(ctx, { gen, pools: [1, 2, 3, 4, 5], seed, path: "evil" });
    for (let n = 1; n <= 12; n++) {
      const o = Run.chooseOpponent(r, ctx, n);
      if (!o.theme) continue;
      const match = o.team.filter((m) => data.pokemonByKey[m.species].types.includes(o.theme)).length;
      assert(match >= 1, `Gen ${gen} battle ${n} (${o.theme}): at least one Pokémon of the tag's type (${o.team.map((m) => m.species).join(", ")})`);
      checked++;
    }
  }
  assert(checked > 200, "many battles checked");
});
test("Mono type ignores a pick of another type", () => {
  const r = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 4, modes: { mono: true }, monoType: "water", picks: { starter: "charmander" } });
  assert(r.offer.options.every((o) => ctx.data.pokemonByKey[o.spec.species].types.includes("water")), "every card is water, the Charmander pick is skipped");
});
test("Run modes: Random levels and moves, and the Skills picks", () => {
  const r = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 9, modes: { levels: true, moves: true }, picks: { starter: "charmander" } });
  assert(r.offer.options.some((o) => ctx.dex.lineOf[o.spec.species] === "charmander"), "the picked starter is in the draft");
  const levels = new Set(r.offer.options.map((o) => o.spec.level));
  assert(levels.size > 1, "levels differ between cards");
  assert(r.offer.options.every((o) => o.spec.moves.length >= 1 && o.spec.moves.every((mv) => ctx.data.moves[mv])), "random moves are real moves");
  const plain = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 9 });
  assert(JSON.stringify(plain.offer.options.map((o) => o.spec.moves)) !== JSON.stringify(r.offer.options.map((o) => o.spec.moves)), "moves differ from a normal draft");
});

console.log("Challenges");
test("A won run records the challenges it beat, and a lost run records none", () => {
  const mon = (species, extra = {}) => ({ species, level: 50, ...extra });
  const won = { screen: "won", team: ["charmander", "squirtle", "bulbasaur", "caterpie", "rattata", "pidgey"].map((k) => mon(k)), fallen: [], settings: { gen: 1 }, evolutions: 0, seenSpecies: ["charmander", "squirtle", "bulbasaur", "caterpie", "rattata", "pidgey"], money: 6000, stats: null };
  const meta = emptyMeta();
  noteRunEnd(meta, won, ctx);
  for (const id of ["flawless", "single-gen", "little-cup", "rich"]) assert(meta.challenges.includes(id), `${id} beaten`);
  for (const id of ["starters", "fully-evolved", "shiny", "legend"]) assert(!meta.challenges.includes(id), `${id} not beaten`);
  const lost = emptyMeta();
  noteRunEnd(lost, { ...won, screen: "lost" }, ctx);
  assert(!(lost.challenges ?? []).length, "a lost run beats nothing");
  const rr = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 7, badges: [] });
  eq(rr.rerollsUsed, 0, "a new run starts at 0 rerolls");
  Run.rerollOffer(rr, ctx);
  eq(rr.rerollsUsed, 1, "a recruit reroll counts");
  assert(CHALLENGES.find((c) => c.id === "no-rerolls").check([], { rerollsUsed: 0 }, ctx) && !CHALLENGES.find((c) => c.id === "no-rerolls").check([], rr, ctx), "No rerolls challenge");
  // "Don't evolve anything": evolving once ends it
  assert(!CHALLENGES.find((c) => c.id === "little-cup").check(won.team, { ...won, evolutions: 1 }, ctx), "an evolution ends it");
  // Team challenges: only those types, fallen Pokémon too
  const team = (keys) => ({ team: keys.map((k) => mon(k)), run: { fallen: [], seenSpecies: keys, settings: {} } });
  const magma = CHALLENGES.find((c) => c.id === "team-magma");
  const fire = team(["charmander", "growlithe", "vulpix", "ponyta", "magmar", "flareon"]);
  assert(magma.check(fire.team, fire.run, ctx), "six Fire types beat Team Magma");
  const mixed = team(["charmander", "growlithe", "vulpix", "ponyta", "magmar", "squirtle"]);
  assert(!magma.check(mixed.team, mixed.run, ctx), "one Water type breaks it");
  const fell = { ...fire.run, seenSpecies: [...fire.run.seenSpecies, "squirtle"] };
  assert(!magma.check(fire.team, fell, ctx), "…and so does a fallen Water type");
  assert(CHALLENGES.find((c) => c.id === "team-aqua").check(team(["squirtle", "psyduck"]).team, team(["squirtle", "psyduck"]).run, ctx), "Team Aqua: Water types");
  // Tiers show up as you beat challenges
  // Secret challenges: three super hard ones, listed once you have beaten 80% of the others
  const secret = CHALLENGES.filter((c) => c.secret);
  eq(secret.length, 3, "three secret challenges");
  eq(secretAt(), Math.ceil(CHALLENGES.filter((c) => !c.secret).length * 0.8), "revealed at 80% of the others");
  assert(!secretRevealed(secretAt() - 1) && secretRevealed(secretAt()), "the secret ones open at that number");
  const hard = (modes, extra = {}) => ({ fallen: [], settings: { modes, ...extra } });
  assert(CHALLENGES.find((c) => c.id === "secret-perfect").check([], hard({ hard: true }), ctx) && !CHALLENGES.find((c) => c.id === "secret-perfect").check([], { ...hard({ hard: true }), fallen: [{}] }, ctx), "Perfect champion: Hard mode and nobody falls");
  assert(CHALLENGES.find((c) => c.id === "secret-iron").check([], hard({ noitems: true, hard: true }, { fixedSix: true }), ctx) && !CHALLENGES.find((c) => c.id === "secret-iron").check([], hard({ hard: true }, { fixedSix: true }), ctx), "Iron trainer needs all three rules");
  // One challenge per type, and the rarer the type the higher the tier
  const types = [...new Set(Object.values(ctx.data.pokemonByKey).flatMap((p) => p.types))];
  eq(MONO_TYPES.length, types.length, "a challenge for every type");
  assert(types.every((t) => MONO_TYPES.some((m) => m.type === t)), "…each type once");
  const count = (t) => Object.values(ctx.data.pokemonByKey).filter((p) => p.types.includes(t)).length;
  for (const m of MONO_TYPES) eq(m.count, count(m.type), `${m.type}: the number in the table is the real count`);
  for (const a of MONO_TYPES) for (const b of MONO_TYPES) if (a.count > b.count) assert(a.tier <= b.tier, `${a.type} (${a.count}) is not harder than ${b.type} (${b.count})`);
  assert(MONO_TYPES.every((m) => m.tier >= 3), "mono type challenges start at tier 3");
  eq(new Set(CHALLENGES.map((c) => c.tier)).size, 5, "five tiers");
  assert(CHALLENGES.find((c) => c.id === "flawless").tier === 5, "Flawless is one of the hardest");
  assert(new Set(CHALLENGES.map((c) => c.id)).size === CHALLENGES.length, "challenge ids are unique");
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
