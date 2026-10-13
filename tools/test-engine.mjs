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

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
