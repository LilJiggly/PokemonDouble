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
import { Battle } from "../js/engine/battle.js";
import { ITEMS, pocketOf } from "../js/game/item-catalog.js";
import { SLOT_UNLOCKS, slotUnlocked, unlockedSlotCount, badgeStatBoost, statOfBadge, unlockBadge, placeBadge, removeBadge, caseOf, caseStrengths, randomZones, validZones, badgeName, setBonus, battleBonus, perkInfo, perkOfBadge, ALL_BADGES } from "../js/game/badges.js";
import { emptyMeta, recordRun } from "../js/game/meta.js";
import { grantUnlocks, isUnlocked, meetsRule, unlockText, nextHint, parseRule, setFriendshipSpecies } from "../js/game/unlocks.js";
import { levelUpMovesAt } from "../js/game/recruit.js";
import { noteBattleWon } from "../js/game/progress.js";
import { rankOf, rankScore } from "../js/game/ranks.js";
import { mergeSaves } from "../js/game/cloud.js";

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
  const m = mergeSaves({ meta: { runs: 2, wins: 1, best: 9, badges: ["1-1"], upgrades: { scout: 1 } }, hof: [], run: null },
    { meta: { runs: 4, wins: 2, best: 14, badges: ["1-2"], upgrades: { scout: 2 } }, hof: [], run: null });
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
  const berry = Object.keys(ITEMS).find((id) => pocketOf(id) === "berries");
  assert(may.charFx.discount.berry === 50 && berry, "May (R/S): berries half price");
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

test("Cynthia: her six Platinum Pokémon can all be recruited before the end of a run; having all six in one run unlocks her", () => {
  const team = ["garchomp", "spiritomb", "roserade", "togekiss", "lucario", "milotic"];
  const rule = unlockRules.cynthia;
  assert(rule && rule.alts[0][0].kind === "obtain", "rule parsed");
  const lastLevel = Run.levelFor(ctx, 13);
  for (const k of team) assert(ctx.dex.highestLegalStages(ctx.dex.lineOf[k], lastLevel, () => true).includes(k), `${k} is recruitable by level ${lastLevel}`);
  const m = emptyMeta();
  const run = { team: [{ species: "garchomp" }], seenSpecies: ["garchomp", "spiritomb", "roserade", "pikachu"], fallen: [], lastBattle: { order: 3 }, order: 3, stats: { species: [], items: 0, berries: 0, picks: [] } };
  noteBattleWon(m, run, ctx);
  eq(m.obtainBest[team.join(",")].length, 3, "three of the six in this run (released and fallen ones count)");
  assert(!meetsRule(m, rule), "not yet");
  const m2 = emptyMeta();
  noteBattleWon(m2, { ...run, team: [{ species: "lucario" }], seenSpecies: ["garchomp", "spiritomb", "roserade", "togekiss", "milotic"] }, ctx);
  assert(meetsRule(m2, rule), "all six at some point of one run (not at once) unlock Cynthia");
  const m3 = emptyMeta();
  noteBattleWon(m3, { ...run, seenSpecies: ["garchomp", "spiritomb"] }, ctx);
  noteBattleWon(m3, { ...run, seenSpecies: ["roserade", "togekiss"], team: [] }, ctx);
  assert(!meetsRule(m3, rule), "pieces from different runs don't add up");
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

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
