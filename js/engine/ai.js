// =====================================================
// BATTLE AI
// -----------------------------------------------------
// Scores every move + target for each active Pokémon
// and picks a good one. Follows a team set's script
// (e.g. "turn 1: Solrock uses Will-O-Wisp on its ally")
// and knows a few doubles tricks on its own.
// =====================================================

import { nextRandom } from "./rng.js";

const WEATHER_OF = { "rain-dance": "rain", "sunny-day": "sun", sandstorm: "sand", hail: "hail" };
const STATUS_OF_AILMENT = { burn: "brn", paralysis: "par", sleep: "slp", freeze: "frz", poison: "psn" };
// Abilities that like having a status condition
const LIKES_STATUS = new Set(["guts", "flare-boost", "toxic-boost", "quick-feet", "marvel-scale", "poison-heal"]);

// ===============================
// PUBLIC
// ===============================

export function chooseTurn(battle, sideIndex) {
  const req = battle.getRequest(sideIndex);
  if (req.type !== "move") return [];
  const choices = [];
  let focusTarget = null;

  for (const slotReq of req.slots) {
    const mon = battle.monAt(sideIndex, slotReq.slot);
    if (slotReq.forced) {
      choices.push({ slot: slotReq.slot, type: "move", move: 0 });
      continue;
    }
    const scripted = scriptChoice(battle, mon, slotReq, choices);
    if (scripted) {
      choices.push(scripted);
      continue;
    }
    const options = scoreOptions(battle, mon, slotReq, choices, focusTarget);
    const choice = pickOption(battle, options);
    choices.push({ slot: slotReq.slot, type: "move", move: choice.move, target: choice.target });
    if (choice.damaging && choice.target) focusTarget = choice.target;
  }
  return choices;
}

export function chooseSwitches(battle, sideIndex) {
  const req = battle.getRequest(sideIndex);
  if (req.type !== "switch") return [];
  const used = new Set();
  return req.slots.map(({ slot }) => {
    const options = battle.bench(sideIndex).filter((m) => !used.has(m.teamIndex));
    let best = options[0];
    let bestScore = -Infinity;
    for (const m of options) {
      const s = matchupScore(battle, m) + nextRandom(battle.state) * 10;
      if (s > bestScore) { best = m; bestScore = s; }
    }
    used.add(best.teamIndex);
    return { slot, teamIndex: best.teamIndex };
  });
}

// ===============================
// SCRIPT (team set strategy)
// ===============================

function scriptChoice(battle, mon, slotReq, earlier) {
  const side = battle.state.sides[mon.side];
  const step = side.script.find((s) => s.turn === battle.state.turn && s.species === mon.species);
  if (!step) return null;
  const moveOpt = slotReq.moves.find((m) => m.id === step.move && !m.disabled);
  if (!moveOpt) return null;

  let target = null;
  if (step.target === "ally") {
    const ally = battle.allyOf(mon);
    if (!ally) return null;
    target = battle.ref(ally);
  } else if (step.target === "foe" || ["selected-pokemon", "selected-pokemon-me-first"].includes(moveOpt.target)) {
    // The foe the partner can hurt the most (or the healthiest one)
    const foes = battle.foesOf(mon);
    if (!foes.length) return null;
    const partner = battle.allyOf(mon);
    let best = foes[0];
    let bestScore = -Infinity;
    for (const f of foes) {
      const s = partner ? bestDamagePct(battle, partner, f) : f.hp / f.maxHp;
      if (s > bestScore) { best = f; bestScore = s; }
    }
    const already = earlier.find((c) => c.target);
    target = already?.target ?? battle.ref(best);
  }
  return { slot: slotReq.slot, type: "move", move: moveOpt.index, target };
}

// ===============================
// SCORING
// ===============================

function scoreOptions(battle, mon, slotReq, earlier, focusTarget) {
  const options = [];
  if (slotReq.struggle) return [{ move: 0, target: null, score: 1 }];
  const ally = battle.allyOf(mon);
  const allyChoice = ally && earlier.find((c) => c.slot === battle.slotOf(ally));

  for (const m of slotReq.moves) {
    if (m.disabled) continue;
    const move = battle.move(m.id);
    const single = ["selected-pokemon", "selected-pokemon-me-first"].includes(move.target);
    const targets = single ? battle.activeMons().filter((t) => t !== mon) : [null];

    for (const t of targets) {
      let score;
      let damaging = false;
      if (move.category !== "status") {
        damaging = true;
        if (t && t.side === mon.side) continue; // don't attack the partner
        score = damageScore(battle, mon, move, t);
        if (t && focusTarget && focusTarget.side === t.side && focusTarget.slot === battle.slotOf(t)) score *= 1.15;
      } else {
        score = statusScore(battle, mon, move, t, ally, allyChoice);
      }
      options.push({ move: m.index, target: t ? battle.ref(t) : null, score, damaging });
    }
  }
  return options.length ? options : [{ move: 0, target: null, score: 0 }];
}

function pickOption(battle, options) {
  options.sort((a, b) => b.score - a.score);
  const [best, second] = options;
  if (second && second.score > best.score * 0.75 && nextRandom(battle.state) < 0.25) return second;
  return best;
}

function wouldBeImmune(battle, user, move, target) {
  const type = battle.moveType(user, move);
  if (battle.effectiveness(type, target) === 0) return true;
  const ab = target.ability;
  const absorbs = { "volt-absorb": "electric", "water-absorb": "water", "dry-skin": "water", "motor-drive": "electric",
    "flash-fire": "fire", "lightning-rod": "electric", "storm-drain": "water", "sap-sipper": "grass" };
  if (absorbs[ab] === type && user.ability !== "mold-breaker") return true;
  if (ab === "wonder-guard" && battle.effectiveness(type, target) <= 1) return true;
  return false;
}

// Expected % of the target's current HP removed (0–100+)
function estimateDamage(battle, user, move, target, spread) {
  if (wouldBeImmune(battle, user, move, target)) return 0;
  const fixed = { "seismic-toss": user.level, "night-shade": user.level, "dragon-rage": 40, "sonic-boom": 20,
    "super-fang": Math.floor(target.hp / 2) }[move.key];
  let dmg;
  if (fixed !== undefined) dmg = fixed;
  else {
    battle.currentMove = { user, move, moldBreaker: user.ability === "mold-breaker" };
    try {
      dmg = battle.calcDamage(user, target, move, { type: battle.moveType(user, move), crit: false, spread, roll: 92 });
    } finally {
      battle.currentMove = null;
    }
    if (move.meta?.minHits) dmg *= (move.meta.minHits + move.meta.maxHits) / 2;
  }
  return dmg;
}

function bestDamagePct(battle, user, target) {
  let best = 0;
  for (const m of user.moves) {
    const move = battle.move(m.id);
    if (move.category === "status" || m.pp <= 0) continue;
    best = Math.max(best, Math.min(1, estimateDamage(battle, user, move, target, false) / target.hp));
  }
  return best;
}

function damageScore(battle, user, move, chosen) {
  const acc = (move.accuracy ?? 100) / 100;
  const targets = chosen ? [chosen]
    : move.target === "all-opponents" ? battle.foesOf(user)
      : move.target === "all-other-pokemon" ? battle.activeMons().filter((m) => m !== user)
        : battle.foesOf(user);
  const spread = targets.length > 1 && move.target !== "random-opponent";
  let score = 0;
  for (const t of targets) {
    const dmg = estimateDamage(battle, user, move, t, spread);
    const pct = Math.min(dmg, t.hp) / t.maxHp;
    let s = pct * 100;
    if (dmg >= t.hp) s += 40;
    if (t.side === user.side) {
      // Hitting the partner with a spread move
      s = dmg >= t.hp ? -150 : -s * 1.5;
      if (t.volatile.protect || t.volatile.pendingMove === "protect" || t.volatile.pendingMove === "detect") s = 0;
    }
    score += move.target === "random-opponent" ? s / targets.length : s;
  }
  score *= acc;
  if (move.key === "self-destruct" || move.key === "explosion") score -= 60 * (user.hp / user.maxHp);
  if (move.key === "fake-out") score = user.volatile.activeTurns > 0 ? -100 : score + 40;
  if (move.priority > 0) score += 5;
  if (RECHARGE_MOVES.has(move.key)) score *= 0.8;
  return score;
}

const RECHARGE_MOVES = new Set(["hyper-beam", "giga-impact", "blast-burn", "hydro-cannon", "frenzy-plant", "rock-wrecker", "roar-of-time"]);

function teamBenefitsFromWeather(battle, mon, weather) {
  const team = battle.state.sides[mon.side].team.filter((m) => !m.fainted);
  return team.some((m) => {
    const ab = m.ability;
    const moves = m.moves.map((x) => battle.move(x.id));
    if (weather === "rain") return ab === "swift-swim" || ab === "rain-dish" || ab === "hydration" || moves.some((x) => x.type === "water" && x.category !== "status");
    if (weather === "sun") return ab === "chlorophyll" || ab === "solar-power" || ab === "flower-gift" || moves.some((x) => x.type === "fire" && x.category !== "status");
    if (weather === "sand") return m.types.includes("rock") || ab === "sand-veil" || ab === "sand-force" || ab === "sand-rush";
    if (weather === "hail") return m.types.includes("ice") || ab === "snow-cloak" || ab === "ice-body";
    return false;
  });
}

function statusScore(battle, mon, move, target, ally, allyChoice) {
  const key = move.key;
  const meta = move.meta ?? {};
  const field = battle.state.field;
  const foes = battle.foesOf(mon);
  const hpPct = mon.hp / mon.maxHp;

  // Moves that only make sense against a foe
  const foeOnly = new Set(["disable", "spite", "psycho-shift", "transform", "mimic", "mirror-move", "me-first", "sketch"]);
  if (foeOnly.has(key) && (!target || target.side === mon.side)) return -100;

  if (WEATHER_OF[key]) {
    const w = WEATHER_OF[key];
    return field.weather === w ? -50 : teamBenefitsFromWeather(battle, mon, w) ? 75 : 5;
  }
  switch (key) {
    case "protect": case "detect": {
      if ((mon.volatile.protectCount ?? 0) > 0) return -50;
      let s = 8;
      if (hpPct < 0.25) s += 25;
      const allyMove = allyChoice && ally && ally.moves[allyChoice.move] && battle.move(ally.moves[allyChoice.move].id);
      if (allyMove && allyMove.target === "all-other-pokemon" && allyMove.category !== "status") s += 80;
      return s;
    }
    case "helping-hand":
      return ally && ally.moves.some((m) => battle.move(m.id).category !== "status") ? 35 : -50;
    case "follow-me":
      return ally && ally.hp / ally.maxHp < 0.5 ? 35 : 10;
    case "trick-room": {
      if (field.trickRoom > 0) return -80;
      const mine = [mon, ally].filter(Boolean).reduce((a, m) => a + battle.speed(m), 0);
      const theirs = foes.reduce((a, m) => a + battle.speed(m), 0);
      return mine < theirs ? 85 : -40;
    }
    case "reflect": return battle.state.sides[mon.side].conditions.reflect ? -50 : 45;
    case "light-screen": return battle.state.sides[mon.side].conditions.lightScreen ? -50 : 45;
    case "tailwind": return battle.state.sides[mon.side].conditions.tailwind ? -50 : 50;
    case "taunt":
      if (!target || target.side === mon.side || target.volatile.taunt) return -50;
      return target.moves.some((m) => battle.move(m.id).category === "status") ? 35 : 5;
    case "substitute": return mon.volatile.substitute || hpPct < 0.5 ? -50 : 20;
    case "ingrain": return mon.volatile.ingrain ? -50 : hpPct < 0.85 ? 25 : 8;
    case "gravity": return field.gravity > 0 ? -50 : foes.some((f) => !battle.isGrounded(f)) && ![mon, ally].some((m) => m && !battle.isGrounded(m)) ? 40 : 5;
    case "disable": return target.volatile.disabled || !target.volatile.lastMove ? -50 : 25;
    case "spite": return target.volatile.lastMove ? 12 : -50;
    case "mimic": case "mirror-move": case "sketch": return target.volatile.lastMove ? 22 : -50;
    case "copycat": return field.previousMove ? 22 : -50;
    case "assist": return battle.state.sides[mon.side].team.some((m) => m !== mon && m.moves.length) ? 25 : -50;
    case "me-first": return 8;
    case "transform": return mon.volatile.transformed || target.volatile.transformed ? -100
      : Object.values(target.stats).reduce((a, b) => a + b, 0) > Object.values(mon.stats).reduce((a, b) => a + b, 0) * 1.15 ? 40 : 3;
    case "psycho-shift": return mon.status && !target.status ? 45 : -60;
    case "power-trick": return mon.volatile.powerTrick ? -40 : mon.stats.def > mon.stats.atk * 1.4 && mon.moves.some((m) => battle.move(m.id).category === "physical") ? 40 : -30;
    case "recycle": return mon.consumedItem && !mon.item ? 30 : -50;
    case "imprison": return foes.some((f) => f.moves.some((m) => mon.moves.some((mm) => mm.id === m.id))) ? 30 : -40;
    case "grudge": return hpPct < 0.3 ? 15 : -20;
    case "magic-coat": return foes.some((f) => f.moves.some((m) => battle.move(m.id).category === "status")) ? 15 : 3;
    case "snatch": return 8;
    case "mud-sport": return field.mudSport ? -50 : foes.some((f) => f.moves.some((m) => battle.move(m.id).type === "electric" && battle.move(m.id).category !== "status")) ? 25 : -40;
    case "water-sport": return field.waterSport ? -50 : foes.some((f) => f.moves.some((m) => battle.move(m.id).type === "fire" && battle.move(m.id).category !== "status")) ? 25 : -40;
    case "conversion": case "conversion-2": case "camouflage": return 3;
    case "haze": {
      const foeBoosts = foes.reduce((a, f) => a + Object.values(f.boosts).reduce((x, y) => x + Math.max(0, y), 0), 0);
      return foeBoosts >= 2 ? 50 : -20;
    }
  }

  if (meta.category === "heal") return hpPct < 0.5 ? 60 : hpPct < 0.75 ? 20 : -30;

  if (["user", "user-and-allies"].includes(move.target) && move.statChanges.length) {
    let s = 0;
    for (const { stat, change } of move.statChanges) {
      const stage = mon.boosts[stat] ?? 0;
      if (change > 0 && stage < 4) s += (stat === "spe" && foes.some((f) => battle.speed(f) > battle.speed(mon)) ? 30 : 18) * Math.min(change, 2);
    }
    return hpPct > 0.6 ? s : s * 0.3;
  }

  if (!target) return 5;
  const isAlly = target.side === mon.side;

  if (meta.category === "ailment" || meta.category === "swagger") {
    const status = STATUS_OF_AILMENT[meta.ailment] ?? (key === "toxic" ? "tox" : null);
    if (status) {
      if (target.status) return -100;
      if (status === "brn" && target.types.includes("fire")) return -100;
      if ((status === "psn" || status === "tox") && (target.types.includes("poison") || target.types.includes("steel"))) return -100;
      if (key === "thunder-wave" && battle.effectiveness("electric", target) === 0) return -100;
      if (isAlly) return LIKES_STATUS.has(target.ability) && status !== "slp" && status !== "frz" ? 120 : -200;
      if (LIKES_STATUS.has(target.ability)) return -40;
      if (status === "slp") return 60;
      if (status === "par") return battle.speed(target) > battle.speed(mon) ? 45 : 30;
      if (status === "brn") return target.stats.atk > target.stats.spa ? 45 : 20;
      if (status === "tox") return 35;
      return 25;
    }
    if (isAlly) return -200;
    if (meta.ailment === "confusion") return target.volatile.confusion ? -50 : 25;
    if (meta.ailment === "yawn") return target.status || target.volatile.yawn ? -50 : 40;
    if (meta.ailment === "leech-seed") return target.types.includes("grass") || target.volatile.leechSeed ? -50 : 30;
    return 10;
  }

  if (meta.category === "net-good-stats" && move.statChanges.length) {
    if (isAlly) return -100;
    let s = 0;
    for (const { stat, change } of move.statChanges) {
      if (change < 0 && target.boosts[stat] > -3) s += 15 * -change;
    }
    // Lower defenses before the partner attacks
    if (ally && move.statChanges.some((c) => c.stat === "def" || c.stat === "spd")) s += 10;
    return s;
  }
  return 5;
}

// How well a Pokémon would do against the current foes (for replacements)
function matchupScore(battle, mon) {
  const foes = battle.activeMons().filter((m) => m.side !== mon.side);
  let s = 0;
  for (const f of foes) s += bestDamagePct(battle, mon, f) * 100;
  return s + (mon.hp / mon.maxHp) * 20;
}
