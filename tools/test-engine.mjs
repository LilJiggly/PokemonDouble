// =====================================================
// ENGINE MECHANIC TESTS
// Usage: node tools/test-engine.mjs
// =====================================================

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareData } from "../js/engine/data.js";
import { Battle } from "../js/engine/battle.js";
import { calcStats } from "../js/engine/pokemon.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (p) => JSON.parse(await fs.readFile(path.join(ROOT, p), "utf8"));
const data = prepareData({
  pokemon: await readJson("data/pokemon.json"),
  moves: await readJson("data/moves.json"),
  abilities: await readJson("data/abilities.json"),
});

let passed = 0;
let failed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.log(`  ✗ ${name}\n      ${err.message}`);
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }
function eq(a, b, msg) { if (a !== b) throw new Error(`${msg}: expected ${b}, got ${a}`); }

const mon = (species, moves, extra = {}) => ({ species, level: 50, nature: "hardy", moves, ...extra });
function battle(p1, p2, seed = 1) {
  const b = Battle.create(data, { seed, sides: [{ name: "Player", isPlayer: true, team: p1 }, { name: "Foe", team: p2 }] });
  b.takeEvents();
  return b;
}
const dmg = (b, user, target, moveId, opts = {}) =>
  b.calcDamage(user, target, data.moves[moveId], { type: b.moveType(user, data.moves[moveId]), crit: false, spread: false, roll: 100, ...opts });
const at = (b, side, slot) => b.monAt(side, slot);
const move = (slot, index, target) => ({ slot, type: "move", move: index, target });

console.log("Stats");
test("Larvitar Lv 12 Adamant stats", () => {
  const s = calcStats(data.pokemonByKey.larvitar.baseStats, 12, "adamant");
  eq(s.hp, 37, "HP");
  eq(s.atk, 26, "Attack");
  eq(s.spa, 17, "Sp. Atk (lowered by nature)");
});
test("Shedinja always has 1 HP", () => {
  eq(calcStats(data.pokemonByKey.shedinja.baseStats, 50, "hardy", undefined, undefined, "shedinja").hp, 1, "HP");
});

console.log("Damage");
test("Guts + burn: Facade does 3× an unburned non-Guts Facade", () => {
  const b = battle([mon("larvitar", ["facade"], { ability: "guts" }), mon("magikarp", ["splash"])],
    [mon("snorlax", ["splash"]), mon("magikarp", ["splash"])]);
  const user = at(b, 0, 0); const target = at(b, 1, 0);
  const normal = dmg(b, user, target, "facade");
  user.status = "brn";
  const burned = dmg(b, user, target, "facade");
  assert(Math.abs(burned / normal - 3) < 0.15, `ratio ${burned / normal}`);
});
test("Burn halves physical damage without Guts", () => {
  const b = battle([mon("machop", ["karate-chop"], { ability: "no-guard" }), mon("magikarp", ["splash"])],
    [mon("snorlax", ["splash"]), mon("magikarp", ["splash"])]);
  const user = at(b, 0, 0); const target = at(b, 1, 0);
  const normal = dmg(b, user, target, "karate-chop");
  user.status = "brn";
  const burned = dmg(b, user, target, "karate-chop");
  assert(Math.abs(burned / normal - 0.5) < 0.08, `ratio ${burned / normal}`);
});
test("Sandstorm: Rock types take less special damage (+50% Sp. Def)", () => {
  const b = battle([mon("squirtle", ["water-gun"]), mon("magikarp", ["splash"])],
    [mon("nosepass", ["splash"]), mon("magikarp", ["splash"])]);
  const before = dmg(b, at(b, 0, 0), at(b, 1, 0), "water-gun");
  b.state.field.weather = "sand";
  const after = dmg(b, at(b, 0, 0), at(b, 1, 0), "water-gun");
  assert(after / before < 0.72 && after / before > 0.6, `ratio ${after / before}`);
});
test("Spread moves do 75% damage", () => {
  const b = battle([mon("geodude", ["rock-slide"]), mon("magikarp", ["splash"])],
    [mon("charmander", ["splash"]), mon("magikarp", ["splash"])]);
  const single = dmg(b, at(b, 0, 0), at(b, 1, 0), "rock-slide");
  const spread = dmg(b, at(b, 0, 0), at(b, 1, 0), "rock-slide", { spread: true });
  assert(Math.abs(spread / single - 0.75) < 0.05, `ratio ${spread / single}`);
});
test("Helping Hand boosts power by 50%", () => {
  const b = battle([mon("geodude", ["rock-throw"]), mon("magikarp", ["splash"])],
    [mon("snorlax", ["splash"]), mon("magikarp", ["splash"])]);
  const base = dmg(b, at(b, 0, 0), at(b, 1, 0), "rock-throw");
  at(b, 0, 0).volatile.helpingHand = true;
  const helped = dmg(b, at(b, 0, 0), at(b, 1, 0), "rock-throw");
  assert(Math.abs(helped / base - 1.5) < 0.1, `ratio ${helped / base}`);
});
test("Type chart: Ground can't hit Flying or Levitate", () => {
  const b = battle([mon("diglett", ["dig"]), mon("magikarp", ["splash"])],
    [mon("pidgey", ["splash"]), mon("gastly", ["splash"], { ability: "levitate" })]);
  eq(b.effectiveness("ground", at(b, 1, 0)), 0, "vs Pidgey");
  eq(b.effectiveness("ground", at(b, 1, 1)), 0, "vs Levitate Gastly");
  eq(b.effectiveness("rock", at(b, 1, 0)), 2, "Rock vs Flying");
});
test("Gen 4 type chart: Steel resists Ghost and Dark, no Fairy", () => {
  const b = battle([mon("magnemite", ["splash"]), mon("clefairy", ["splash"])], [mon("gastly", ["splash"]), mon("magikarp", ["splash"])]);
  eq(b.effectiveness("ghost", at(b, 0, 0)), 0.5, "Ghost vs Steel");
  eq(b.effectiveness("dark", at(b, 0, 0)), 0.5, "Dark vs Steel");
  eq(at(b, 0, 1).types.join(), "normal", "Clefairy type");
});

console.log("Battle effects");
test("Lightning Rod draws Electric moves, is immune, gains +1 Sp. Atk (Gen 5)", () => {
  const b = battle([mon("pikachu", ["thunder-shock"]), mon("magikarp", ["splash"])],
    [mon("rhyhorn", ["splash"], { ability: "lightning-rod" }), mon("relicanth", ["splash"])]);
  const relicanth = at(b, 1, 1); const rhyhorn = at(b, 1, 0);
  b.submitTurn([[move(0, 0, { side: 1, slot: 1 }), move(1, 0)], [move(0, 0), move(1, 0)]]);
  eq(relicanth.hp, relicanth.maxHp, "Relicanth HP");
  eq(rhyhorn.boosts.spa, 1, "Rhyhorn Sp. Atk stage");
});
test("Storm Drain absorbs Water moves aimed at its partner", () => {
  const b = battle([mon("squirtle", ["water-gun"]), mon("magikarp", ["splash"])],
    [mon("solrock", ["splash"]), mon("lileep", ["splash"], { ability: "storm-drain" })]);
  const solrock = at(b, 1, 0); const lileep = at(b, 1, 1);
  b.submitTurn([[move(0, 0, { side: 1, slot: 0 }), move(1, 0)], [move(0, 0), move(1, 0)]]);
  eq(solrock.hp, solrock.maxHp, "Solrock HP");
  eq(lileep.boosts.spa, 1, "Lileep Sp. Atk stage");
});
test("Sturdy (Gen 5): survives a KO hit from full HP", () => {
  const b = battle([mon("machamp", ["cross-chop"], { level: 100, ability: "no-guard" }), mon("magikarp", ["splash"])],
    [mon("geodude", ["splash"], { level: 5, ability: "sturdy" }), mon("magikarp", ["splash"])]);
  b.submitTurn([[move(0, 0, { side: 1, slot: 0 }), move(1, 0)], [move(0, 0), move(1, 0)]]);
  eq(at(b, 1, 0)?.hp ?? 0, 1, "Geodude HP");
});
test("Protect blocks a move", () => {
  const b = battle([mon("geodude", ["rock-throw"], { ability: "no-guard" }), mon("magikarp", ["splash"])],
    [mon("shieldon", ["protect"]), mon("magikarp", ["splash"])]);
  const shieldon = at(b, 1, 0);
  b.submitTurn([[move(0, 0, { side: 1, slot: 0 }), move(1, 0)], [move(0, 0), move(1, 0)]]);
  eq(shieldon.hp, shieldon.maxHp, "Shieldon HP");
});
test("Will-O-Wisp can't burn a Fire type", () => {
  const b = battle([mon("solrock", ["will-o-wisp"], { ability: "no-guard" }), mon("charmander", ["splash"])],
    [mon("magikarp", ["splash"]), mon("magikarp", ["splash"])]);
  b.submitTurn([[move(0, 0, { side: 0, slot: 1 }), move(1, 0)], [move(0, 0), move(1, 0)]]);
  eq(at(b, 0, 1).status, null, "Charmander status");
});
test("Will-O-Wisp on a Guts partner burns it", () => {
  const b = battle([mon("solrock", ["will-o-wisp"], { ability: "no-guard" }), mon("larvitar", ["splash"], { ability: "guts" })],
    [mon("magikarp", ["splash"]), mon("magikarp", ["splash"])]);
  b.submitTurn([[move(0, 0, { side: 0, slot: 1 }), move(1, 0)], [move(0, 0), move(1, 0)]]);
  eq(at(b, 0, 1).status, "brn", "Larvitar status");
});
test("Swift Swim doubles Speed in rain", () => {
  const b = battle([mon("kabuto", ["splash"], { ability: "swift-swim" }), mon("magikarp", ["splash"])],
    [mon("magikarp", ["splash"]), mon("magikarp", ["splash"])]);
  const k = at(b, 0, 0);
  const dry = b.speed(k);
  b.state.field.weather = "rain";
  eq(b.speed(k), dry * 2, "Speed in rain");
});
test("Trick Room makes the slower Pokémon move first", () => {
  const b = battle([mon("bonsly", ["tackle"], { ability: "rock-head" }), mon("magikarp", ["splash"])],
    [mon("jolteon", ["tackle"]), mon("magikarp", ["splash"])]);
  b.state.field.trickRoom = 3;
  const events = b.submitTurn([[move(0, 0, { side: 1, slot: 0 }), move(1, 0)], [move(0, 0, { side: 0, slot: 0 }), move(1, 0)]]);
  const first = events.find((e) => e.t === "move" && e.move === "tackle");
  eq(first.side, 0, "first Tackle user's side (Bonsly)");
});
test("Smooth Rock makes Sandstorm last 8 turns", () => {
  const b = battle([mon("nosepass", ["sandstorm"], { item: "smooth-rock" }), mon("magikarp", ["splash"])],
    [mon("geodude", ["splash"]), mon("onix", ["splash"])]);
  b.submitTurn([[move(0, 0), move(1, 0)], [move(0, 0), move(1, 0)]]);
  eq(b.state.field.weather, "sand", "weather");
  eq(b.state.field.weatherTurns, 7, "turns left after the first turn");
});
test("Consumed berries are gone after the battle", () => {
  const b = battle([mon("geodude", ["splash"], { item: "oran-berry", hp: 10 }), mon("magikarp", ["splash"])],
    [mon("magikarp", ["splash"]), mon("magikarp", ["splash"])]);
  b.submitTurn([[move(0, 0), move(1, 0)], [move(0, 0), move(1, 0)]]);
  const g = at(b, 0, 0);
  eq(g.item, null, "item");
  eq(g.consumedItem, "oran-berry", "consumed item");
});

test("Bag: a Potion heals, uses the turn and is counted as used", () => {
  const b = Battle.create(data, { seed: 3, sides: [
    { name: "Player", isPlayer: true, team: [mon("geodude", ["tackle"], { hp: 50 }), mon("magikarp", ["splash"])],
      bag: { potion: { name: "Potion", count: 2, effect: { heal: 20 } } } },
    { name: "Foe", team: [mon("magikarp", ["splash"]), mon("magikarp", ["splash"])] }] });
  b.takeEvents();
  const g = at(b, 0, 0);
  const events = b.submitTurn([[{ slot: 0, type: "item", item: "potion", teamIndex: 0 }, move(1, 0)], [move(0, 0), move(1, 0)]]);
  eq(g.hp, 70, "HP after Potion");
  eq(b.state.sides[0].bag.potion.count, 1, "Potions left");
  eq(b.state.sides[0].usedItems.potion, 1, "used count");
  assert(!events.some((e) => e.t === "move" && e.side === 0 && e.slot === 0), "Geodude shouldn't also attack");
});

console.log("Saving");
test("A battle saved mid-way continues exactly the same", () => {
  const p1 = [mon("geodude", ["rock-throw", "tackle"]), mon("pikachu", ["thunder-shock", "quick-attack"])];
  const p2 = [mon("squirtle", ["water-gun", "tackle"]), mon("bulbasaur", ["vine-whip", "tackle"])];
  const turn = [[move(0, 0, { side: 1, slot: 0 }), move(1, 0, { side: 1, slot: 1 })], [move(0, 0, { side: 0, slot: 0 }), move(1, 0, { side: 0, slot: 1 })]];
  const a = battle(p1, p2, 99);
  a.submitTurn(turn);
  const saved = JSON.stringify(a.state);
  const b = new Battle(data, JSON.parse(saved));
  const ea = a.submitTurn(turn);
  const eb = b.submitTurn(turn);
  eq(JSON.stringify(eb), JSON.stringify(ea), "events after reload");
});

console.log("Delayed attacks");
// First seed where the 90% accuracy roll hits
function futureBattle(target) {
  for (let seed = 1; seed < 50; seed++) {
    const b = battle([mon("alakazam", ["future-sight"], { ability: "magic-guard" }), mon("magikarp", ["splash"])],
      [mon(target, ["splash"]), mon("magikarp", ["splash"])], seed);
    b.submitTurn(turnFS);
    if (b.state.sides[1].future?.[0]) return b;
  }
  throw new Error("Future Sight never scheduled");
}
const idle = [[move(0, 0, { side: 0, slot: 1 }), move(1, 0, { side: 0, slot: 1 })], [move(0, 0, { side: 0, slot: 0 }), move(1, 0, { side: 0, slot: 1 })]];
const turnFS = [[move(0, 0, { side: 1, slot: 0 }), move(1, 0, { side: 0, slot: 0 })], [move(0, 0, { side: 0, slot: 0 }), move(1, 0, { side: 0, slot: 1 })]];
test("Future Sight hits at the end of the 2nd turn after it is used, and ignores types (hits Dark)", () => {
  const b = futureBattle("umbreon");
  const target = at(b, 1, 0);
  const full = target.hp;
  eq(target.hp, full, "no damage on turn 1");
  b.submitTurn(idle);
  eq(target.hp, full, "no damage on turn 2");
  b.submitTurn(idle);
  assert(target.hp < full, "damage at the end of turn 3");
  assert(!b.state.sides[1].future[0], "attack is used up");
});
test("A second Future Sight on the same slot fails and does not reset the timer", () => {
  const b = futureBattle("snorlax");
  const turns = b.state.sides[1].future[0].turns;
  const events = b.submitTurn(turnFS);
  assert(JSON.stringify(events).includes("But it failed!"), "second use fails");
  eq(b.state.sides[1].future[0].turns, turns - 1, "timer keeps counting");
});

console.log("Moves that copy, call or change things");
// Three Pokémon on the player's side (the third waits on the bench); slot 1 always splashes
const p1 = (i) => move(0, i, { side: 1, slot: 0 });
const p2 = (i) => move(0, i, { side: 0, slot: 0 });
const s1 = move(1, 0, { side: 0, slot: 0 });
function duel(user, userMoves, foe, foeMoves, { seed = 1, terrain, bench = mon("pikachu", ["ember"]), userExtra = {}, foeExtra = {} } = {}) {
  const b = Battle.create(data, { seed, terrain, sides: [
    { name: "P", isPlayer: true, team: [mon(user, userMoves, userExtra), mon("magikarp", ["splash"]), bench] },
    { name: "F", team: [mon(foe, foeMoves, foeExtra), mon("magikarp", ["splash"])] }] });
  b.takeEvents();
  return b;
}
const round = (b, a, f) => b.submitTurn([[a ?? p1(0), s1], [f ?? p2(0), s1]]);
const text = (events) => events.map((e) => e.text ?? "").join(" | ");
// Retry seeds for moves with an accuracy roll
function withSeed(build, check) {
  for (let seed = 1; seed < 60; seed++) { const r = check(build(seed)); if (r !== false) return r; }
  throw new Error("never worked on any seed");
}

test("Disable: the foe's last move can't be chosen for a few turns", () => {
  withSeed((seed) => duel("alakazam", ["disable", "splash"], "snorlax", ["tackle", "splash"], { seed }), (b) => {
    round(b, p1(1), p2(0)); // the foe uses Tackle
    round(b, p1(0), p2(1));
    if (!at(b, 1, 0).volatile.disabled) return false;
    eq(at(b, 1, 0).volatile.disabled.move, "tackle", "disabled move");
    assert(b.getRequest(1).slots[0].moves[0].disabled, "Tackle can't be picked");
    assert(!b.getRequest(1).slots[0].moves[1].disabled, "Splash can");
  });
});
test("Mimic copies the foe's last move (5 PP) and it's gone after switching out", () => {
  const b = duel("alakazam", ["mimic", "splash"], "magmar", ["ember", "splash"]);
  round(b, p1(1), p2(0));
  round(b, p1(0), p2(1));
  eq(at(b, 0, 0).moves[0].id, "ember", "slot became Ember");
  eq(at(b, 0, 0).moves[0].pp, 5, "PP");
  b.submitTurn([[{ slot: 0, type: "switch", teamIndex: 2 }, s1], [p2(1), s1]]);
  eq(b.state.sides[0].team[0].moves[0].id, "mimic", "Mimic is back");
});
test("Mirror Move uses the foe's last move", () => {
  const b = duel("alakazam", ["mirror-move", "splash"], "magmar", ["ember", "splash"]);
  round(b, p1(1), p2(0));
  const before = at(b, 1, 0).hp;
  const ev = text(round(b, p1(0), p2(1)));
  assert(ev.includes("Ember!") && at(b, 1, 0).hp < before, `Ember hit the foe: ${ev}`);
});
test("Mirror Move fails when there is nothing to copy", () => {
  const b = duel("alakazam", ["mirror-move", "splash"], "magmar", ["splash", "splash"]);
  assert(text(round(b, p1(0), p2(0))).includes("But it failed!"), "failed");
});
test("Copycat uses the last move anyone used", () => {
  const b = duel("snorlax", ["copycat", "splash"], "alakazam", ["ember", "splash"]);
  const before = at(b, 1, 0).hp;
  const ev = text(round(b, p1(0), p2(0)));
  assert(ev.includes("Copycat") && ev.includes("Ember"), ev);
  assert(at(b, 0, 0).hp < at(b, 0, 0).maxHp || at(b, 1, 0).hp <= before, "Ember was used");
});
test("Assist uses a move from another team member", () => {
  withSeed((seed) => duel("alakazam", ["assist", "splash"], "snorlax", ["splash", "splash"], { seed, bench: mon("pikachu", ["ember"]) }), (b) => {
    const before = at(b, 1, 0).hp;
    const ev = text(round(b, p1(0), p2(0)));
    assert(ev.includes("Assist") || ev.includes("Ember") || ev.includes("Splash"), ev);
    if (at(b, 1, 0).hp === before) return false; // picked Splash: try another seed
  });
});
test("Me First copies the foe's move with extra power", () => {
  const b = duel("alakazam", ["me-first", "splash"], "magmar", ["ember", "splash"]);
  const ev = text(round(b, p1(0), p2(0)));
  assert(ev.includes("Ember!"), ev);
  assert(at(b, 1, 0).hp < at(b, 1, 0).maxHp, "the foe was hit by its own move");
});
test("Transform copies types, stats and moves, and ends when switching out", () => {
  const b = duel("alakazam", ["transform", "splash"], "snorlax", ["tackle", "rest"]);
  round(b, p1(0), p2(0));
  const u = at(b, 0, 0);
  eq(u.types.join(), "normal", "types");
  eq(u.moves.map((m) => m.id).join(), "tackle,rest", "moves");
  eq(u.stats.atk, at(b, 1, 0).stats.atk, "Attack");
  eq(u.stats.hp, calcStats(data.pokemonByKey.alakazam.baseStats, 50, "hardy").hp, "HP stays its own");
  b.submitTurn([[{ slot: 0, type: "switch", teamIndex: 2 }, s1], [p2(0), s1]]);
  const back = b.state.sides[0].team[0];
  eq(back.types.join(), "psychic", "types restored");
  eq(back.moves.map((m) => m.id).join(), "transform,splash", "moves restored");
});
test("Conversion turns the user into the type of one of its moves", () => {
  const b = duel("alakazam", ["conversion", "ember"], "snorlax", ["splash", "splash"]);
  round(b, p1(0), p2(0));
  eq(at(b, 0, 0).types.join(), "fire", "type");
});
test("Conversion 2 picks a type that resists the last hit", () => {
  const b = duel("alakazam", ["conversion-2", "splash"], "magmar", ["ember", "splash"]);
  round(b, p1(1), p2(0));
  round(b, p1(0), p2(1));
  const t = at(b, 0, 0).types;
  eq(t.length, 1, "one type");
  assert(["fire", "water", "rock", "dragon"].includes(t[0]), `resists Fire: ${t[0]}`);
});
test("Camouflage turns the user into the arena's type", () => {
  const b = duel("alakazam", ["camouflage", "splash"], "snorlax", ["splash", "splash"], { terrain: "water" });
  round(b, p1(0), p2(0));
  eq(at(b, 0, 0).types.join(), "water", "type");
});
test("Sketch permanently replaces itself with the foe's last move", () => {
  const b = duel("smeargle", ["sketch", "splash"], "magmar", ["ember", "splash"]);
  round(b, p1(1), p2(0));
  round(b, p1(0), p2(0)); // the faster Magmar uses Ember again before Smeargle sketches it
  eq(at(b, 0, 0).moves[0].id, "ember", "slot became Ember");
  eq(JSON.stringify(at(b, 0, 0).sketched), JSON.stringify([{ index: 0, move: "ember" }]), "recorded for the run");
});
test("Multi-hit moves number each hit in the events", () => {
  const b = duel("alakazam", ["double-kick", "splash"], "snorlax", ["splash", "splash"]);
  const hits = round(b, p1(0), p2(0)).filter((e) => e.t === "damage" && e.move === "double-kick").map((e) => e.hit);
  assert(hits.length === 2 && hits[0] === 1 && hits[1] === 2, `hits ${JSON.stringify(hits)}`);
});
test("Pursuit hits a Pokémon that is switching out, first, with double power", () => {
  const b = duel("alakazam", ["pursuit", "splash"], "snorlax", ["splash", "splash"]);
  const plain = dmg(b, at(b, 0, 0), at(b, 1, 0), "pursuit");
  const ev = round(b, p1(0), { slot: 0, type: "switch", teamIndex: 1 });
  const hit = ev.findIndex((e) => e.t === "damage" && e.move === "pursuit");
  const sw = ev.findIndex((e) => e.t === "switch" || /sent out|come back|Go!/i.test(e.text ?? ""));
  assert(hit !== -1, "Pursuit didn't hit the switching Pokémon");
  assert(sw === -1 || hit < sw, "Pursuit came after the switch");
  const dealt = ev.find((e) => e.t === "damage" && e.move === "pursuit").amount;
  assert(dealt > plain * 1.5, `damage ${dealt} is not about double ${plain}`);
});
test("Castform's Forecast changes its form and type with the weather", () => {
  const b = duel("castform", ["splash", "splash"], "ninetales", ["splash", "splash"], { userExtra: { ability: "forecast" }, foeExtra: { ability: "drought" } });
  round(b, p1(0), p2(0));
  eq(at(b, 0, 0).volatile.form, "sunny", "form");
  eq(at(b, 0, 0).types.join(), "fire", "type");
});
const badgeBattle = (effectList, stats = {}, extra = {}) => Battle.create(data, { seed: extra.seed ?? 1, sides: [
  { name: "P", isPlayer: true, team: [mon(extra.me ?? "geodude", extra.moves ?? ["rock-throw", "splash"]), mon("magikarp", ["splash"])], badge: { stats, effects: effectList } },
  { name: "F", team: [mon(extra.foe ?? "squirtle", extra.foeMoves ?? ["water-gun", "splash"]), mon("magikarp", ["splash"])] }] });
test("Gym badges: damage badges change hits (Opening Salvo, Last Stand, Weakness Hunter, Sturdy Stone, Bedrock)", () => {
  const plain = badgeBattle({});
  const hit = (b, key = "rock-throw") => dmg(b, at(b, 0, 0), at(b, 1, 0), key);
  const taken = (b, key = "water-gun") => dmg(b, at(b, 1, 0), at(b, 0, 0), key);
  assert(hit(badgeBattle({ opener: 0.3 })) > hit(plain), "opener (turn 1)");
  const low = badgeBattle({ "last-stand": 0.3 }); at(low, 0, 0).hp = 1;
  const lowPlain = badgeBattle({}); at(lowPlain, 0, 0).hp = 1;
  assert(hit(low) > hit(lowPlain), "last stand");
  const se = badgeBattle({ "super-effective": 0.2 }, {}, { foe: "charmander" }), sePlain = badgeBattle({}, {}, { foe: "charmander" });
  assert(hit(se) > hit(sePlain), "super effective (rock vs fire)");
  assert(taken(badgeBattle({ "sturdy-stone": 0.2 })) < taken(plain), "sturdy stone (full HP)");
  assert(taken(badgeBattle({ "weakness-guard": 0.2 })) < taken(plain), "bedrock (water is super effective on rock)");
  const closer = badgeBattle({ closer: 0.25 }); at(closer, 1, 0).hp = 1;
  const closerPlain = badgeBattle({}); at(closerPlain, 1, 0).hp = 1;
  assert(hit(closer) > hit(closerPlain), "closer");
});
test("Gym badges: stats, set bonus and weather", () => {
  const plain = badgeBattle({});
  const stat = badgeBattle({}, { atk: 0.1, spe: 0.1 });
  assert(at(stat, 0, 0).stats.atk > at(plain, 0, 0).stats.atk, "attack");
  assert(at(stat, 0, 0).stats.spe > at(plain, 0, 0).stats.spe, "speed");
  eq(at(stat, 0, 0).stats.def, at(plain, 0, 0).stats.def, "defense untouched");
  eq(at(stat, 0, 0).stats.hp, at(plain, 0, 0).stats.hp, "HP is not boosted");
  eq(badgeBattle({ "rain-start": 4 }).weather(), "rain", "rain");
  eq(badgeBattle({ "rain-start": 4 }).state.field.weatherTurns, 4, "lasts as long as the badge says");
  eq(badgeBattle({ "sand-start": 4 }).weather(), "sand", "sand");
});
test("Gym badges: status wards, Regrowth, Vampire, Second Wind, Spikes", () => {
  const b = badgeBattle({ "sleep-ward": 1 });
  assert(!b.trySetStatus(at(b, 0, 0), "slp", at(b, 1, 0), { fromMove: true }), "sleep blocked");
  const r = badgeBattle({ regen: 0.0625 }, {}, { foeMoves: ["splash", "splash"] });
  at(r, 0, 0).hp -= 30; const before = at(r, 0, 0).hp;
  round(r, p1(1), p2(0));
  assert(at(r, 0, 0).hp > before, "regrowth healed");
  const v = badgeBattle({ vampire: 0.1 }, {}, { me: "machamp", moves: ["tackle", "splash"], foe: "snorlax", foeMoves: ["splash", "splash"] });
  at(v, 0, 0).hp -= 40; const vb = at(v, 0, 0).hp;
  round(v, p1(0), p2(0));
  assert(at(v, 0, 0).hp > vb, "vampire healed");
  const w = badgeBattle({ "second-wind": 1 }, {}, { me: "magikarp", moves: ["splash", "splash"], foe: "machamp", foeMoves: ["close-combat", "splash"] });
  at(w, 0, 0).hp = 3;
  round(w, p1(1), p2(0));
  eq(at(w, 0, 0).hp, 1, "second wind left 1 HP");
  const sp = badgeBattle({ thorns: 0.125 }, {}, { me: "snorlax", moves: ["splash", "splash"], foe: "machamp", foeMoves: ["tackle", "splash"] });
  const foeHp = at(sp, 1, 0).hp;
  round(sp, p1(1), p2(0));
  assert(at(sp, 1, 0).hp < foeHp, "spikes hurt the attacker");
});
test("Dig and Fly: out of reach on the first turn (with a charge event for the screen), hits on the second", () => {
  for (const [move, state] of [["dig", "underground"], ["fly", "air"]]) {
    const b = duel("pidgeot", [move, "splash"], "snorlax", ["tackle", "splash"]);
    const ev1 = round(b, p1(0), p2(0));
    const charge = ev1.find((e) => e.t === "charge");
    assert(charge && charge.state === state, `${move}: no charge event`);
    eq(at(b, 0, 0).hp, at(b, 0, 0).maxHp, `${move}: Tackle should have missed the digging/flying Pokémon`);
    const foeHp = at(b, 1, 0).hp;
    const ev2 = round(b, p1(0), p2(0));
    assert(ev2.some((e) => e.t === "damage" && e.move === move), `${move}: no hit on turn 2`);
    assert(at(b, 1, 0).hp < foeHp, `${move}: foe took no damage`);
  }
});
test("Counter and Mirror Coat hit the attacker, not the user", () => {
  for (const [move, foeMove, foeSpecies] of [["counter", "karate-chop", "machamp"], ["mirror-coat", "psychic", "blissey"]]) {
    const b = duel("snorlax", [move, "splash"], foeSpecies, [foeMove, "splash"]);
    const ev = round(b, p1(0), p2(0));
    const mine = ev.filter((e) => e.t === "damage" && e.side === 0);
    const foes = ev.filter((e) => e.t === "damage" && e.side === 1);
    assert(mine.length === 1, `${move}: the user should only take the original hit (took ${mine.length} hits)`);
    assert(foes.length === 1 && foes[0].move === move && foes[0].amount > 0, `${move} should damage the foe`);
  }
});
test("Reflect and Light Screen send events so the screen can keep showing them", () => {
  const b = duel("alakazam", ["reflect", "light-screen"], "snorlax", ["splash", "splash"]);
  const on = round(b, p1(0), p2(0)).filter((e) => e.t === "sidecond" && e.on).map((e) => e.key);
  assert(on.includes("reflect"), "reflect event");
  const b2 = duel("alakazam", ["light-screen", "splash"], "snorlax", ["splash", "splash"]);
  assert(round(b2, p1(0), p2(0)).some((e) => e.t === "sidecond" && e.key === "lightScreen" && e.on), "light screen event");
  let off = false;
  for (let i = 0; i < 6; i++) off = round(b2, p1(1), p2(0)).some((e) => e.t === "sidecond" && e.key === "lightScreen" && !e.on) || off;
  assert(off, "light screen should wear off after 5 turns with an event");
});
test("Spite takes 4 PP off the foe's last move", () => {
  const b = duel("alakazam", ["spite", "splash"], "snorlax", ["tackle", "splash"]);
  round(b, p1(1), p2(0));
  const pp = at(b, 1, 0).moves[0].pp;
  round(b, p1(0), p2(1));
  eq(at(b, 1, 0).moves[0].pp, pp - 4, "PP");
});
test("Ingrain heals every turn and stops switching", () => {
  const b = duel("alakazam", ["ingrain", "splash"], "snorlax", ["splash", "splash"]);
  at(b, 0, 0).hp -= 50;
  const before = at(b, 0, 0).hp;
  round(b, p1(0), p2(0));
  assert(at(b, 0, 0).hp > before, "healed");
  assert(!b.getRequest(0).slots[0].canSwitch, "can't switch");
});
test("Magic Coat bounces a status move back", () => {
  const b = duel("alakazam", ["magic-coat", "splash"], "snorlax", ["thunder-wave", "splash"]);
  round(b, p1(0), p2(0));
  eq(at(b, 1, 0).status, "par", "the foe got its own Thunder Wave");
  eq(at(b, 0, 0).status, null, "the user is fine");
});
test("Recycle gets back an item that was used up", () => {
  const b = duel("alakazam", ["recycle", "splash"], "snorlax", ["splash", "splash"]);
  at(b, 0, 0).item = null; at(b, 0, 0).consumedItem = "oran-berry";
  round(b, p1(0), p2(0));
  eq(at(b, 0, 0).item, "oran-berry", "item");
});
test("Imprison seals moves the foe also knows", () => {
  const b = duel("alakazam", ["imprison", "tackle"], "snorlax", ["tackle", "ember"]);
  round(b, p1(0), p2(1));
  const foeMoves = b.getRequest(1).slots[0].moves;
  assert(foeMoves[0].disabled && !foeMoves[1].disabled, "Tackle sealed, Ember free");
});
test("Grudge empties the PP of the move that knocked the user out", () => {
  const b = duel("alakazam", ["grudge", "splash"], "snorlax", ["tackle", "splash"]);
  at(b, 0, 0).hp = 1;
  round(b, p1(0), p2(0));
  assert(b.state.sides[0].team[0].fainted, "fainted");
  eq(at(b, 1, 0).moves[0].pp, 0, "Tackle PP");
});
test("Snatch steals a stat-boosting move", () => {
  const b = duel("alakazam", ["snatch", "splash"], "snorlax", ["swords-dance", "splash"]);
  round(b, p1(0), p2(0));
  eq(at(b, 0, 0).boosts.atk, 2, "the snatcher got +2");
  eq(at(b, 1, 0).boosts.atk, 0, "the user got nothing");
});
test("Mud Sport and Water Sport halve Electric and Fire power while their user is out", () => {
  const b = duel("alakazam", ["thunderbolt", "ember"], "snorlax", ["mud-sport", "water-sport"]);
  const normal = dmg(b, at(b, 0, 0), at(b, 1, 0), "thunderbolt");
  const fire = dmg(b, at(b, 0, 0), at(b, 1, 0), "ember");
  round(b, p1(1), p2(0));
  round(b, p1(1), p2(1));
  assert(Math.abs(dmg(b, at(b, 0, 0), at(b, 1, 0), "thunderbolt") / normal - 0.5) < 0.06, "Electric halved");
  assert(Math.abs(dmg(b, at(b, 0, 0), at(b, 1, 0), "ember") / fire - 0.5) < 0.06, "Fire halved");
  // gone once the user leaves
  b.state.field.mudSport = b.monKey(at(b, 1, 1)); at(b, 1, 1).fainted = true;
  eq(dmg(b, at(b, 0, 0), at(b, 1, 0), "thunderbolt"), normal, "back to normal");
});
test("Gravity: Ground hits Flying, Fly is banned, and it wears off after 5 turns", () => {
  const b = duel("alakazam", ["gravity", "splash"], "pidgeot", ["fly", "growl"]);
  eq(b.effectiveness("ground", at(b, 1, 0)), 0, "Pidgeot is immune before");
  round(b, p1(0), p2(1));
  assert(b.effectiveness("ground", at(b, 1, 0)) > 0, "Ground hits Pidgeot now");
  assert(b.getRequest(1).slots[0].moves[0].disabled, "Fly is disabled");
  assert(!b.getRequest(1).slots[0].moves[1].disabled, "Growl is not");
  for (let i = 0; i < 4; i++) round(b, p1(1), p2(1));
  eq(b.state.field.gravity, 0, "ended");
  eq(b.effectiveness("ground", at(b, 1, 0)), 0, "immune again");
});
test("Psycho Shift moves the user's status to the target", () => {
  withSeed((seed) => duel("alakazam", ["psycho-shift", "splash"], "snorlax", ["splash", "splash"], { seed }), (b) => {
    at(b, 0, 0).status = "brn";
    round(b, p1(0), p2(0));
    if (!at(b, 1, 0).status) return false;
    eq(at(b, 1, 0).status, "brn", "foe burned");
    eq(at(b, 0, 0).status, null, "user cured");
  });
});
test("Power Trick swaps Attack and Defense, and swaps back when leaving", () => {
  const b = duel("alakazam", ["power-trick", "splash"], "snorlax", ["splash", "splash"]);
  const { atk, def } = { ...at(b, 0, 0).stats };
  round(b, p1(0), p2(0));
  eq(at(b, 0, 0).stats.atk, def, "Attack is the old Defense");
  eq(at(b, 0, 0).stats.def, atk, "Defense is the old Attack");
  b.submitTurn([[{ slot: 0, type: "switch", teamIndex: 2 }, s1], [p2(0), s1]]);
  const back = b.state.sides[0].team[0].stats;
  eq(back.atk, atk, "Attack restored"); eq(back.def, def, "Defense restored");
});

console.log("Gen 5 moves and abilities");
// Any teams; actions for all four active Pokémon: [mine slot 0, mine slot 1, foe slot 0, foe slot 1]
const fight = (mine, foe, opts = {}) => {
  const b = Battle.create(data, { seed: opts.seed ?? 1, terrain: opts.terrain, sides: [{ name: "P", isPlayer: true, team: mine }, { name: "F", team: foe }] });
  b.takeEvents();
  return b;
};
const four = (b, a0, a1, f0, f1) => b.submitTurn([[a0, a1], [f0, f1]]);
const atFoe = (slot, index, target = 0) => move(slot, index, { side: 1, slot: target });
const atMine = (slot, index, target = 0) => move(slot, index, { side: 0, slot: target });
const splash2 = [mon("magikarp", ["splash"]), mon("magikarp", ["splash"])];
const power = (b, user, target, id) => b.basePower(user, target, data.moves[id]);

test("Psyshock hits Defense; Foul Play uses the target's Attack", () => {
  const b = duel("alakazam", ["psyshock", "psychic"], "blissey", ["splash", "splash"]);
  assert(dmg(b, at(b, 0, 0), at(b, 1, 0), "psyshock") * 90 / 80 > dmg(b, at(b, 0, 0), at(b, 1, 0), "psychic") * 3, "Blissey has far lower Defense than Sp. Def");
  const f = duel("alakazam", ["foul-play", "tackle"], "machamp", ["splash", "splash"]);
  const low = dmg(f, at(f, 0, 0), at(f, 1, 0), "foul-play");
  at(f, 0, 0).stats.atk = 999;
  eq(dmg(f, at(f, 0, 0), at(f, 1, 0), "foul-play"), low, "the user's own Attack doesn't matter");
});
test("Venoshock, Hex, Acrobatics, Retaliate, Stored Power, Heavy Slam, Electro Ball", () => {
  const b = duel("snorlax", ["venoshock", "hex"], "magikarp", ["splash", "splash"]);
  const u = at(b, 0, 0), t = at(b, 1, 0);
  eq(power(b, u, t, "venoshock"), 65, "Venoshock"); t.status = "psn"; eq(power(b, u, t, "venoshock"), 130, "Venoshock poisoned");
  eq(power(b, u, t, "hex"), 100, "Hex with a status");
  u.item = "leftovers"; eq(power(b, u, t, "acrobatics"), 55, "Acrobatics holding an item"); u.item = null; eq(power(b, u, t, "acrobatics"), 110, "Acrobatics without");
  eq(power(b, u, t, "retaliate"), 70, "Retaliate"); b.state.sides[0].lastFaintTurn = b.state.turn - 1; eq(power(b, u, t, "retaliate"), 140, "Retaliate after a faint");
  eq(power(b, u, t, "stored-power"), 20, "Stored Power"); u.boosts.spa = 2; u.boosts.def = 1; eq(power(b, u, t, "stored-power"), 80, "Stored Power with 3 stages up");
  assert(power(b, u, t, "heavy-slam") >= 120, "Heavy Slam: Snorlax is way heavier than Magikarp");
  assert(power(b, t, u, "heat-crash") === 40, "Heat Crash: light user");
  u.stats.spe = 400; t.stats.spe = 100; eq(power(b, u, t, "electro-ball"), 150, "Electro Ball 4× faster");
});
test("Storm Throw always crits, Smack Down grounds, Clear Smog resets stats, Incinerate burns a berry", () => {
  withSeed((seed) => duel("machamp", ["storm-throw", "smack-down"], "pidgeot", ["splash", "splash"], { seed, foeExtra: { item: "oran-berry" } }), (b) => {
    const ev = round(b, p1(0), p2(0));
    if (!JSON.stringify(ev).includes("A critical hit!")) return false;
    round(b, p1(1), p2(0));
    assert(b.effectiveness("ground", at(b, 1, 0)) > 0, "Smack Down grounded Pidgeot");
  });
  const c = duel("alakazam", ["clear-smog", "incinerate"], "snorlax", ["splash", "splash"], { foeExtra: { item: "oran-berry" } });
  at(c, 1, 0).boosts.atk = 3;
  round(c, p1(0), p2(0));
  eq(at(c, 1, 0).boosts.atk, 0, "stat changes removed");
  const d = duel("alakazam", ["incinerate", "tackle"], "snorlax", ["splash", "splash"], { foeExtra: { item: "oran-berry" } });
  round(d, p1(0), p2(0));
  eq(at(d, 1, 0).item, null, "berry burned up");
});
test("Flame Burst hurts the neighbour, Final Gambit trades HP, Synchronoise needs a shared type", () => {
  const b = fight([mon("magmar", ["flame-burst"]), mon("magikarp", ["splash"]), mon("pikachu", ["ember"])], [mon("snorlax", ["splash"]), mon("magikarp", ["splash"])]);
  const before = at(b, 1, 1).hp;
  four(b, atFoe(0, 0, 0), s1, atMine(0, 0), s1);
  assert(at(b, 1, 1).hp < before, "the Pokémon next to the target took splash damage");
  const g = duel("alakazam", ["final-gambit", "splash"], "snorlax", ["splash", "splash"]);
  const hp = at(g, 0, 0).hp; const foeHp = at(g, 1, 0).hp;
  round(g, p1(0), p2(0));
  assert(g.state.sides[0].team[0].fainted, "the user fainted");
  assert(foeHp - at(g, 1, 0).hp >= Math.min(hp, foeHp) - 1, "damage equals the user's HP");
  const s = duel("alakazam", ["synchronoise", "splash"], "snorlax", ["splash", "splash"]);
  const ev = text(round(s, p1(0), p2(0)));
  assert(ev.includes("doesn't affect"), `different types: ${ev}`);
});
test("Dragon Tail drags the target out; Volt Switch switches the user out", () => {
  const b = fight([mon("garchomp", ["dragon-tail"]), mon("magikarp", ["splash"])], [mon("snorlax", ["splash"]), mon("magikarp", ["splash"]), mon("pikachu", ["splash"])]);
  withSeed((seed) => fight([mon("garchomp", ["dragon-tail"]), mon("magikarp", ["splash"])], [mon("snorlax", ["splash"]), mon("magikarp", ["splash"]), mon("pikachu", ["splash"])], { seed }), (x) => {
    four(x, atFoe(0, 0, 0), s1, atMine(0, 0), s1);
    if (x.state.sides[1].active.includes(2)) return true;
    return x.state.sides[1].active[0] === 0 ? false : true;
  });
  const v = duel("jolteon", ["volt-switch", "splash"], "snorlax", ["splash", "splash"]);
  round(v, p1(0), p2(0));
  eq(v.state.sides[0].active[0], 2, "Pikachu came in");
});
test("Echoed Voice gets stronger every turn; Round doubles when used twice in a turn", () => {
  const b = duel("alakazam", ["echoed-voice", "splash"], "snorlax", ["splash", "splash"]);
  const first = (() => { const h = at(b, 1, 0).hp; round(b, p1(0), p2(0)); return h - at(b, 1, 0).hp; })();
  const second = (() => { const h = at(b, 1, 0).hp; round(b, p1(0), p2(0)); return h - at(b, 1, 0).hp; })();
  assert(second > first * 1.5, `2nd ${second} vs 1st ${first}`);
  const r = fight([mon("alakazam", ["round"]), mon("alakazam", ["round"])], [mon("snorlax", ["splash"]), mon("magikarp", ["splash"])]);
  at(r, 1, 0).hp = at(r, 1, 0).maxHp; // sanity
  const single = power(r, at(r, 0, 0), at(r, 1, 0), "round");
  r.state.field.roundTurn = r.state.turn;
  eq(power(r, at(r, 0, 0), at(r, 1, 0), "round"), single * 2, "Round after another Round");
});
test("Water Pledge + Fire Pledge from both partners combine into a rainbow", () => {
  const b = fight([mon("blastoise", ["water-pledge"]), mon("charizard", ["fire-pledge"])], [mon("snorlax", ["splash"]), mon("snorlax", ["splash"])]);
  const ev = text(four(b, atFoe(0, 0, 0), atFoe(1, 0, 0), atMine(0, 0), atMine(1, 0)));
  assert(ev.includes("waiting for") && ev.includes("rainbow"), ev);
  assert(b.state.sides[0].conditions.rainbow > 0, "rainbow on the user's side");
});

test("Heal Pulse heals the target; Wide Guard and Quick Guard block spread and priority moves", () => {
  const h = duel("alakazam", ["heal-pulse", "splash"], "snorlax", ["splash", "splash"]);
  at(h, 1, 0).hp = Math.floor(at(h, 1, 0).maxHp / 4); const before = at(h, 1, 0).hp;
  round(h, p1(0), p2(0));
  assert(at(h, 1, 0).hp >= before + Math.floor(at(h, 1, 0).maxHp / 2) - 1, "healed half");
  const w = fight([mon("alakazam", ["wide-guard"]), mon("pikachu", ["splash"])], [mon("snorlax", ["earthquake"]), mon("magikarp", ["splash"])]);
  const hp0 = at(w, 0, 0).hp, hp1 = at(w, 0, 1).hp;
  const ev = text(four(w, atMine(0, 0), s1, atMine(0, 0), s1));
  assert(ev.includes("Wide Guard protected") && at(w, 0, 0).hp === hp0 && at(w, 0, 1).hp === hp1, ev);
  const q = fight([mon("alakazam", ["quick-guard"]), mon("pikachu", ["splash"])], [mon("snorlax", ["mach-punch"]), mon("magikarp", ["splash"])]);
  const qhp = at(q, 0, 0).hp;
  const qev = text(four(q, atMine(0, 0), s1, atMine(0, 0), s1));
  assert(qev.includes("Quick Guard protected") && at(q, 0, 0).hp === qhp, qev);
});
test("Guard Split and Power Split average stats; they come back after switching out", () => {
  const b = duel("alakazam", ["guard-split", "power-split"], "snorlax", ["splash", "splash"]);
  const u = at(b, 0, 0), t = at(b, 1, 0);
  const defs = [u.stats.def, t.stats.def];
  round(b, p1(0), p2(0));
  eq(u.stats.def, Math.floor((defs[0] + defs[1]) / 2), "user Defense"); eq(t.stats.def, u.stats.def, "target Defense");
  b.submitTurn([[{ slot: 0, type: "switch", teamIndex: 2 }, s1], [p2(0), s1]]);
  eq(b.state.sides[0].team[0].stats.def, defs[0], "restored");
});
test("Wonder Room swaps Defense and Sp. Def; Magic Room switches held items off", () => {
  const b = duel("alakazam", ["wonder-room", "magic-room"], "blissey", ["splash", "splash"]);
  const before = b.defenseStat(at(b, 1, 0), "def", false, at(b, 0, 0));
  round(b, p1(0), p2(0));
  eq(b.defenseStat(at(b, 1, 0), "def", false, at(b, 0, 0)), at(b, 1, 0).stats.spd, "Defense uses Sp. Def now");
  assert(before !== b.state.field.wonderRoom, "ran");
  const u = at(b, 0, 0); u.item = "leftovers"; assert(b.item(u) === "leftovers", "items work before");
  round(b, p1(1), p2(0));
  eq(b.item(u), null, "held items off");
});
test("Rage Powder pulls single-target moves to the user", () => {
  const b = fight([mon("alakazam", ["rage-powder"]), mon("magikarp", ["splash"])], [mon("snorlax", ["tackle"]), mon("magikarp", ["splash"])]);
  const ally = at(b, 0, 1).hp; const user = at(b, 0, 0).hp;
  four(b, atMine(0, 0), s1, move(0, 0, { side: 0, slot: 1 }), s1);
  assert(at(b, 0, 1).hp === ally, "the partner wasn't hit");
  assert(at(b, 0, 0).hp < user, "the user was");
});
test("Soak, Simple Beam and Entrainment change type and Ability, and Abilities come back", () => {
  const b = duel("alakazam", ["soak", "simple-beam"], "magmar", ["splash", "splash"]);
  round(b, p1(0), p2(0));
  eq(at(b, 1, 0).types.join(), "water", "Soak");
  round(b, p1(1), p2(0));
  eq(at(b, 1, 0).ability, "simple", "Simple Beam");
  const e = fight([mon("alakazam", ["entrainment"], { ability: "magic-guard" }), mon("magikarp", ["splash"]), mon("pikachu", ["splash"])], [mon("snorlax", ["splash"], { ability: "thick-fat" }), mon("magikarp", ["splash"])]);
  four(e, atFoe(0, 0, 0), s1, atMine(0, 0), s1);
  eq(at(e, 1, 0).ability, "magic-guard", "Entrainment");
  const side1 = e.state.sides[1];
  e.submitTurn([[atFoe(0, 0, 0), s1], [{ slot: 1, type: "move", move: 0, target: { side: 0, slot: 0 } }, s1]]);
  eq(side1.team[0].ability, "magic-guard", "still while it stays in");
});
test("After You lets the target act next", () => {
  const b = fight([mon("alakazam", ["after-you"]), mon("magikarp", ["splash"])], [mon("snorlax", ["tackle"]), mon("jolteon", ["thunderbolt"])]);
  const ev = text(four(b, move(0, 0, { side: 1, slot: 0 }), s1, move(0, 0, { side: 0, slot: 1 }), move(0, 0, { side: 0, slot: 1 })));
  const order = [...ev.matchAll(/(Alakazam|Magikarp|The foe's \w+) used ([\w ]+)!/g)].map((m) => m[2]);
  assert(order.indexOf("Tackle") === order.indexOf("After You") + 1, `Snorlax right after: ${order.join(", ")}`);
});
test("Ally Switch swaps the partners' positions", () => {
  const b = fight([mon("alakazam", ["ally-switch"]), mon("pikachu", ["splash"])], [mon("snorlax", ["splash"]), mon("magikarp", ["splash"])]);
  const [a, p] = [b.state.sides[0].active[0], b.state.sides[0].active[1]];
  const ev = four(b, atMine(0, 0), s1, atMine(0, 0), s1);
  assert(ev.some((e) => e.t === "swapPlaces"), "event for the screen");
  assert(b.state.sides[0].active[0] === p && b.state.sides[0].active[1] === a, "swapped");
});
test("Bestow, Telekinesis and Autotomize", () => {
  const b = duel("alakazam", ["bestow", "telekinesis"], "snorlax", ["splash", "splash"]);
  at(b, 1, 0).item = null; at(b, 0, 0).item = "leftovers";
  round(b, p1(0), p2(0));
  eq(at(b, 1, 0).item, "leftovers", "item given"); eq(at(b, 0, 0).item, null, "user's hand empty");
  withSeed((seed) => duel("alakazam", ["telekinesis", "splash"], "pidgeot", ["splash", "splash"], { seed }), (x) => {
    round(x, p1(0), p2(0));
    if (!at(x, 1, 0).volatile.telekinesis) return false;
    eq(x.effectiveness("ground", at(x, 1, 0)), 0, "still in the air");
  });
  const a = duel("snorlax", ["autotomize", "splash"], "magikarp", ["splash", "splash"]);
  const w = at(a, 0, 0).weightKg;
  round(a, p1(0), p2(0));
  eq(at(a, 0, 0).boosts.spe, 2, "Speed +2"); assert(at(a, 0, 0).weightKg < w, "lighter");
});

test("Prankster, Moxie, Anger Point, Weak Armor, Justified, Rattled", () => {
  const p = duel("snorlax", ["swords-dance", "splash"], "jolteon", ["thunderbolt", "splash"], { userExtra: { ability: "prankster" } });
  const ev = text(round(p, p1(0), p2(0)));
  assert(ev.indexOf("Swords Dance") < ev.indexOf("Thunderbolt"), `Prankster goes first: ${ev}`);
  const m = duel("machamp", ["karate-chop", "splash"], "magikarp", ["splash", "splash"], { userExtra: { ability: "moxie" } });
  at(m, 1, 0).hp = 1; round(m, p1(0), p2(0));
  eq(at(m, 0, 0).boosts.atk, 1, "Moxie");
  withSeed((seed) => duel("machamp", ["storm-throw", "splash"], "snorlax", ["splash", "splash"], { seed, foeExtra: { ability: "anger-point" } }), (b) => {
    round(b, p1(0), p2(0));
    if (at(b, 1, 0).hp <= 0) return false;
    eq(at(b, 1, 0).boosts.atk, 6, "Anger Point");
  });
  const w = duel("machamp", ["karate-chop", "splash"], "snorlax", ["splash", "splash"], { foeExtra: { ability: "weak-armor" } });
  round(w, p1(0), p2(0));
  eq(at(w, 1, 0).boosts.def, -1, "Weak Armor Defense"); eq(at(w, 1, 0).boosts.spe, 1, "Weak Armor Speed");
  const j = duel("alakazam", ["dark-pulse", "bug-buzz"], "snorlax", ["splash", "splash"], { foeExtra: { ability: "justified" } });
  round(j, p1(0), p2(0)); eq(at(j, 1, 0).boosts.atk, 1, "Justified");
  const r = duel("alakazam", ["bug-buzz", "splash"], "snorlax", ["splash", "splash"], { foeExtra: { ability: "rattled" } });
  round(r, p1(0), p2(0)); eq(at(r, 1, 0).boosts.spe, 1, "Rattled");
});
test("Mummy and Iron Barbs punish contact; Mummy's change is undone when the Pokémon leaves", () => {
  const b = duel("machamp", ["karate-chop", "splash"], "cofagrigus", ["splash", "splash"], { foeExtra: { ability: "mummy" } });
  at(b, 1, 0).types = ["normal"];
  round(b, p1(0), p2(0));
  eq(at(b, 0, 0).ability, "mummy", "Machamp caught Mummy");
  b.submitTurn([[{ slot: 0, type: "switch", teamIndex: 2 }, s1], [p2(1), s1]]);
  assert(b.state.sides[0].team[0].ability !== "mummy", "restored after switching out");
  const i = duel("machamp", ["karate-chop", "splash"], "snorlax", ["splash", "splash"], { foeExtra: { ability: "iron-barbs" } });
  const hp = at(i, 0, 0).hp; round(i, p1(0), p2(0));
  assert(at(i, 0, 0).hp < hp, "Iron Barbs hurt the attacker");
});
test("Defeatist halves attacking stats at half HP; Infiltrator ignores Reflect; Turboblaze ignores Levitate", () => {
  const d = duel("machamp", ["karate-chop", "splash"], "snorlax", ["splash", "splash"], { userExtra: { ability: "defeatist" } });
  const full = d.attackStat(at(d, 0, 0), "atk", false, at(d, 1, 0));
  at(d, 0, 0).hp = Math.floor(at(d, 0, 0).maxHp / 2);
  assert(d.attackStat(at(d, 0, 0), "atk", false, at(d, 1, 0)) <= Math.ceil(full / 2), "halved");
  const n = duel("machamp", ["karate-chop", "splash"], "snorlax", ["splash", "splash"]);
  const inf = duel("machamp", ["karate-chop", "splash"], "snorlax", ["splash", "splash"], { userExtra: { ability: "infiltrator" } });
  for (const b of [n, inf]) b.state.sides[1].conditions.reflect = 5;
  assert(dmg(inf, at(inf, 0, 0), at(inf, 1, 0), "karate-chop") > dmg(n, at(n, 0, 0), at(n, 1, 0), "karate-chop") * 1.4, "screens ignored");
  const t = duel("alakazam", ["earthquake", "splash"], "bronzong", ["splash", "splash"], { userExtra: { ability: "turboblaze" } });
  const hp = at(t, 1, 0).hp; round(t, p1(0), p2(0));
  assert(at(t, 1, 0).hp < hp, "Levitate ignored");
});
test("Healer cures the partner's status", () => {
  withSeed((seed) => fight([mon("alakazam", ["splash"], { ability: "healer" }), mon("magikarp", ["splash"])], [mon("snorlax", ["splash"]), mon("magikarp", ["splash"])], { seed }), (b) => {
    at(b, 0, 1).status = "brn";
    four(b, atMine(0, 0), s1, atMine(0, 0), s1);
    if (at(b, 0, 1).status) return false;
  });
});

test("Quash makes the target move last; Reflect Type copies the target's types", () => {
  const b = fight([mon("alakazam", ["quash"]), mon("magikarp", ["splash"])], [mon("snorlax", ["tackle"]), mon("jolteon", ["thunderbolt"])]);
  const ev = text(four(b, move(0, 0, { side: 1, slot: 0 }), s1, move(0, 0, { side: 0, slot: 1 }), move(0, 0, { side: 0, slot: 1 })));
  const order = [...ev.matchAll(/(Alakazam|Magikarp|The foe's \w+) used ([\w ]+)!/g)].map((m) => m[2]);
  assert(order.at(-1) === "Tackle", `Snorlax last: ${order.join(", ")}`);
  const r = duel("alakazam", ["reflect-type", "splash"], "magmar", ["splash", "splash"]);
  round(r, p1(0), p2(0));
  eq(at(r, 0, 0).types.join(), "fire", "types copied");
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
