// =====================================================
// BATTLE SIMULATOR
// -----------------------------------------------------
// Runs AI-vs-AI battles to stress-test the engine and
// get a feel for how hard a leader's sets are.
//
// Usage:
//   node tools/sim.mjs                 (Brock, 200 battles per set)
//   node tools/sim.mjs --n 50
//   node tools/sim.mjs --show          (print one full battle)
//   node tools/sim.mjs --leader brock --gen 1
// =====================================================

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareData } from "../js/engine/data.js";
import { Battle } from "../js/engine/battle.js";
import { chooseTurn, chooseSwitches } from "../js/engine/ai.js";
import { readProgression } from "./lib/design.mjs";
import { createRecruit, firstStageSpecies } from "../js/game/recruit.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (p) => JSON.parse(await fs.readFile(path.join(ROOT, p), "utf8"));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
};

const data = prepareData({
  pokemon: await readJson("data/pokemon.json"),
  moves: await readJson("data/moves.json"),
  abilities: await readJson("data/abilities.json"),
});
const N = Number(arg("n", 200));
const SHOW = process.argv.includes("--show");
const gen = await readJson(`data/leaders/gen${arg("gen", 1)}.json`);
const leader = gen.opponents.find((o) => o.id === arg("leader", "brock"));
const progression = await readProgression();
const level = progression.find((r) => r.order === leader.order).level;

// Random player team: first-stage recruits made exactly like the game makes them
let seed = 12345;
const rand = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
const firstStage = firstStageSpecies(data).filter((p) => p.bst < 500);
const randomPlayerMon = () => createRecruit(data, firstStage[Math.floor(rand() * firstStage.length)].key, level, rand);

function runBattle(set, battleSeed) {
  const team = set.team.map((m) => ({ ...m, level }));
  const playerTeam = [randomPlayerMon(), randomPlayerMon()];
  const battle = Battle.create(data, {
    seed: battleSeed,
    sides: [
      { name: "Player", isPlayer: true, team: playerTeam },
      { name: leader.name, team, script: set.script },
    ],
  });
  const log = [...battle.takeEvents()];
  let guard = 0;
  while (battle.state.phase !== "ended" && guard++ < 300) {
    if (battle.state.phase === "choose") {
      log.push(...battle.submitTurn([chooseTurn(battle, 0), chooseTurn(battle, 1)]));
    } else if (battle.state.phase === "switch") {
      log.push(...battle.submitSwitches([chooseSwitches(battle, 0), chooseSwitches(battle, 1)]));
    }
  }
  // Round-trip through JSON like a save/load every battle, to catch non-serializable state
  JSON.parse(JSON.stringify(battle.state));
  return { battle, log, playerTeam, timedOut: guard >= 300 };
}

const notImplemented = {};
let crashes = 0;
console.log(`${leader.name} (Lv ${level}) vs random first-stage teams · ${N} battles per set\n`);
console.log("Set".padEnd(24), "Leader win %".padEnd(14), "Avg turns");

for (const set of leader.sets) {
  let wins = 0;
  let turns = 0;
  for (let i = 0; i < N; i++) {
    try {
      const { battle, log, timedOut } = runBattle(set, 1000 + i);
      if (timedOut) console.log(`  ! battle ${i} hit the turn limit`);
      if (battle.state.winner === 1) wins++;
      turns += battle.state.turn;
      for (const e of log) if (e.notImplemented) notImplemented[e.notImplemented] = (notImplemented[e.notImplemented] ?? 0) + 1;
    } catch (err) {
      crashes++;
      if (crashes <= 3) console.error(`  CRASH in "${set.name}" battle ${i}:`, err.stack);
    }
  }
  console.log(set.name.padEnd(24), `${((wins / N) * 100).toFixed(0)}%`.padEnd(14), (turns / N).toFixed(1));
}

console.log(`\nCrashes: ${crashes}`);
if (Object.keys(notImplemented).length) console.log("Moves that did nothing (not implemented):", notImplemented);

if (SHOW) {
  const { log, playerTeam } = runBattle(leader.sets[Number(arg("set", 0))], Number(arg("seed", 7)));
  console.log(`\n--- Example battle: ${playerTeam.map((m) => m.species).join(" + ")} vs ${leader.sets[Number(arg("set", 0))].name} ---`);
  for (const e of log) {
    if (e.t === "turn") console.log(`\n== Turn ${e.turn} ==`);
    else if (e.text) console.log(e.text + (e.t === "damage" && !e.indirect ? ` (${e.hp}/${e.maxHp} HP)` : ""));
    else if (e.t === "damage") console.log(`  → ${e.amount} damage (${e.hp}/${e.maxHp} HP)`);
  }
}
