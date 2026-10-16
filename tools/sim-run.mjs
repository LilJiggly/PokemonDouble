// =====================================================
// FULL RUN SIMULATOR
// -----------------------------------------------------
// Plays whole runs with the AI making every decision
// (draft, recruits, items, battles) to test the run loop
// and see how far an average run gets.
//
// Usage: node tools/sim-run.mjs [--n 50] [--gen 1] [--verbose]
// =====================================================

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareData } from "../js/engine/data.js";
import { Battle } from "../js/engine/battle.js";
import { chooseTurn, chooseSwitches } from "../js/engine/ai.js";
import { parseRules } from "../js/game/rules.js";
import { Pokedex } from "../js/game/pokedex.js";
import * as Run from "../js/game/run.js";
import { ITEMS } from "../js/game/item-catalog.js";

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
const rules = parseRules(await fs.readFile(path.join(ROOT, "DESIGN.md"), "utf8"), data);
const dex = new Pokedex(data, await readJson("data/evolutions.json"), rules);
const leaders = {};
for (const g of [1, 2, 3, 4, 5]) leaders[g] = await readJson(`data/leaders/gen${g}.json`);
const ctx = { data, dex, rules, leaders, tms: await readJson("data/tms.json") };

const N = Number(arg("n", 30));
const GEN = Number(arg("gen", 1));
const VERBOSE = process.argv.includes("--verbose");
const BOOST = process.argv.includes("--boost");
const FIRST_ONLY = process.argv.includes("--first"); // stop after the first battle (Gym 1 difficulty)
const tierScore = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };

function playRun(seed) {
  const run = Run.newRun(ctx, { gen: GEN, pools: [1, 2, 3, 4, 5], seed });
  let guard = 0;
  while (!["over", "won"].includes(run.screen) && guard++ < 500) {
    // Every step goes through JSON, like saving and reloading the page
    const copy = JSON.parse(JSON.stringify(run));
    Object.assign(run, copy);

    if (run.screen === "draft" || run.screen === "recruit") {
      // Take the highest-tier options; replace the weakest member when full
      const order = run.offer.options.map((o, i) => [i, tierScore[o.tier]]).sort((a, b) => b[1] - a[1]);
      for (const [i, score] of order) {
        if (run.offer?.kind !== "recruit" || run.offer.picksLeft <= 0) break;
        if (run.team.length >= 6) {
          const weakest = [...run.team].sort((a, b) => tierScore[dex.tier(a.species)] - tierScore[dex.tier(b.species)])[0];
          if (tierScore[dex.tier(weakest.species)] >= score) { Run.skipOffer(run, ctx); break; }
          Run.pickRecruit(run, ctx, i, weakest.uid);
        } else {
          Run.pickRecruit(run, ctx, i);
        }
      }
      if (run.offer?.kind === "recruit") Run.skipOffer(run, ctx);
    } else if (run.screen === "items") {
      Run.pickItem(run, ctx, run.offer.options.findIndex((o) => !o.taken));
    } else if (run.screen === "hub") {
      while (run.pendingMoves.length) Run.answerMove(run, ctx, null);
      // Evolve whatever can evolve, hand out held items
      for (const mon of run.team) {
        const opt = dex.evolutionOptions(mon, run.bag).find((o) => o.ready);
        if (opt) Run.evolve(run, ctx, mon.uid, opt.to);
        const held = Object.keys(run.bag).find((id) => ITEMS[id]?.kind === "held");
        if (!mon.item && held) Run.giveItem(run, mon.uid, held);
      }
      // --boost: test option, the player's team fights 40 levels higher
      const realLevels = run.team.map((m) => m.level);
      if (BOOST) run.team.forEach((m) => { m.level += 40; });
      const { battle, events } = Run.startBattle(run, ctx);
      if (BOOST) run.team.forEach((m, i) => { m.level = realLevels[i]; });
      const log = [...events];
      let turns = 0;
      while (battle.state.phase !== "ended" && turns++ < 300) {
        if (battle.state.phase === "choose") log.push(...battle.submitTurn([chooseTurn(battle, 0), chooseTurn(battle, 1)]));
        else log.push(...battle.submitSwitches([chooseSwitches(battle, 0), chooseSwitches(battle, 1)]));
      }
      run.battle = battle.state;
      Run.finishBattle(run, ctx);
      if (FIRST_ONLY) return run;
      if (VERBOSE) {
        console.log(`  #${run.lastBattle.order} ${run.lastBattle.opponent}: ${run.lastBattle.won ? "won" : "LOST"}`
          + `${run.lastBattle.fallen.length ? ` (lost ${run.lastBattle.fallen.map((f) => f.name).join(", ")})` : ""}`
          + ` · team: ${run.team.map((m) => `${data.pokemonByKey[m.species].name} ${m.level}`).join(", ")}`
          + (run.lastBattle.rewards ? ` · +₽${run.lastBattle.rewards.money}${run.lastBattle.rewards.tm ? `, ${Run.tmLabel(ctx, run.lastBattle.rewards.tm)}` : ""}` : ""));
      }
    }
  }
  return run;
}

const reached = {};
let wins = 0;
let crashes = 0;
for (let i = 0; i < N; i++) {
  try {
    if (VERBOSE) console.log(`Run ${i + 1}`);
    const run = playRun(5000 + i);
    if (run.screen === "won") wins++;
    const key = run.screen === "won" ? "won" : run.screen === "over" ? `lost at #${run.lastBattle?.order}` : run.lastBattle ? `won #${run.lastBattle.order}` : `stuck on ${run.screen}`;
    reached[key] = (reached[key] ?? 0) + 1;
  } catch (err) {
    crashes++;
    if (crashes <= 3) console.error("CRASH:", err.stack);
  }
}
console.log(`\nGen ${GEN} · ${N} AI runs · wins: ${wins} · crashes: ${crashes}`);
console.log(Object.entries(reached).sort().map(([k, v]) => `${k}: ${v}`).join("\n"));
