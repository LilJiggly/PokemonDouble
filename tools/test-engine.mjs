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

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
