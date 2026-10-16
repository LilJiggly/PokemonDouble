// =====================================================
// DOUBLE BATTLE ENGINE (Gen 4 rules + DESIGN.md exceptions)
// -----------------------------------------------------
// The whole battle lives in `battle.state`, a plain
// JSON-safe object, so it can be saved every turn and
// resumed exactly (the RNG state is inside it too).
//
// Flow:
//   const battle = Battle.create(data, { sides, seed })
//   battle.takeEvents()               → lead switch-ins
//   battle.getRequest(side)           → what a side must choose
//   battle.submitTurn([p1, p2])       → events of the turn
//   battle.submitSwitches([p1, p2])   → when Pokémon fainted
// =====================================================

import {
  typeMultiplier, stageMultiplier, accuracyStageMultiplier, CRIT_CHANCE, STAT_NAMES, STATUS_NAMES, TYPES,
} from "./constants.js";
import { createBattlePokemon, emptyBoosts } from "./pokemon.js";
import { nextRandom, randomInt, chance, pick } from "./rng.js";
import {
  makesContact, PUNCH, SOUND, RECOIL, TWO_TURN, HITS_INVULNERABLE, RECHARGE, RAMPAGE, THAWS_USER, WEATHER_HEAL,
  CALL_BANNED, MIMIC_BANNED, SKETCH_BANNED, ME_FIRST_BANNED, MIRRORABLE_TARGETS, GRAVITY_BANNED,
  REFLECT_TARGETS, REFLECT_BANNED, SNATCH_TARGETS, SNATCH_BANNED,
  ALWAYS_CRIT, IGNORE_STAGES, USES_DEFENSE, PLEDGE,
} from "./moveflags.js";
import {
  TYPE_BOOST_ITEMS, SPECIES_STAT_ITEMS, CHOICE_ITEMS, RESIST_BERRIES, CURE_BERRIES, PINCH_BERRIES,
  HEAL_BERRIES, WEATHER_ROCKS, isBerry,
} from "./items.js";

const WEATHER_MOVES = { "rain-dance": "rain", "sunny-day": "sun", sandstorm: "sand", hail: "hail" };
const WEATHER_ABILITIES = { drizzle: "rain", drought: "sun", "sand-stream": "sand", "snow-warning": "hail" };
const WEATHER_START = {
  rain: "It started to rain!", sun: "The sunlight turned harsh!",
  sand: "A sandstorm kicked up!", hail: "It started to hail!",
};
const WEATHER_END = {
  rain: "The rain stopped.", sun: "The sunlight faded.",
  sand: "The sandstorm subsided.", hail: "The hail stopped.",
};

// Defender abilities that Mold Breaker ignores
const BREAKABLE = new Set(`
  battle-armor big-pecks clear-body contrary damp dry-skin filter flash-fire flower-gift friend-guard
  heatproof heavy-metal hyper-cutter immunity inner-focus insomnia keen-eye leaf-guard levitate
  light-metal lightning-rod limber magic-bounce magma-armor marvel-scale motor-drive multiscale
  oblivious own-tempo sand-veil sap-sipper shell-armor shield-dust simple snow-cloak solid-rock
  soundproof sticky-hold storm-drain sturdy suction-cups tangled-feet telepathy thick-fat unaware
  vital-spirit volt-absorb water-absorb water-veil white-smoke wonder-guard wonder-skin overcoat
`.trim().split(/\s+/));

const STATUS_CURE_TEXT = {
  brn: "'s burn was healed.", par: " was cured of paralysis.", psn: " was cured of its poisoning.",
  tox: " was cured of its poisoning.", slp: " woke up!", frz: " thawed out!",
};

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export class Battle {
  constructor(data, state) {
    this.data = data;
    this.state = state;
    this.events = [];
    this.currentMove = null; // { user, move } while a move is running
  }

  // ===============================
  // SETUP
  // ===============================

  // sides: [{ name, isPlayer, team: [spec…], script: [...] }, …]
  // terrain: the arena's type (Camouflage turns the user into it)
  static create(data, { sides, seed = Date.now(), terrain = "normal" }) {
    const state = {
      version: 1,
      rng: seed >>> 0,
      turn: 0,
      phase: "start",
      terrain,
      winner: null,
      field: { weather: null, weatherTurns: 0, trickRoom: 0 },
      sides: sides.map((s, i) => ({
        index: i,
        name: s.name,
        isPlayer: !!s.isPlayer,
        script: s.script ?? [],
        team: s.team.map((spec, ti) => ({ ...createBattlePokemon(spec, data), side: i, teamIndex: ti })),
        active: [null, null],
        conditions: {},
        wish: null,
        // Bag items usable in battle: { id: { name, count, effect } }. usedItems counts what was used.
        bag: s.bag ?? {},
        usedItems: {},
      })),
    };
    const battle = new Battle(data, state);
    battle.start();
    return battle;
  }

  start() {
    const st = this.state;
    for (const side of st.sides) {
      const healthy = side.team.filter((m) => !m.fainted).slice(0, 2);
      healthy.forEach((m, slot) => {
        side.active[slot] = m.teamIndex;
        this.onEnterField(m);
        this.log({ t: "switch", ...this.ref(m), species: m.species, name: m.name, hp: m.hp, maxHp: m.maxHp,
          text: side.isPlayer ? `Go! ${m.name}!` : `${side.name} sent out ${m.name}!` });
      });
    }
    for (const m of this.bySpeed(this.activeMons())) this.runSwitchInAbility(m);
    st.turn = 1;
    st.phase = "choose";
    this.log({ t: "turn", turn: 1 });
  }

  takeEvents() {
    const e = this.events;
    this.events = [];
    return e;
  }

  log(event) {
    this.events.push(event);
  }

  msg(text, extra = {}) {
    this.log({ t: "msg", text, ...extra });
  }

  // ===============================
  // LOOKUPS
  // ===============================

  side(i) { return this.state.sides[i]; }

  monAt(sideIndex, slot) {
    const ti = this.state.sides[sideIndex].active[slot];
    return ti === null || ti === undefined ? null : this.state.sides[sideIndex].team[ti];
  }

  slotOf(mon) { return this.state.sides[mon.side].active.indexOf(mon.teamIndex); }

  isActive(mon) { return !!mon && !mon.fainted && this.slotOf(mon) !== -1; }

  activeMons() {
    const out = [];
    for (const side of this.state.sides) {
      for (let slot = 0; slot < 2; slot++) {
        const m = this.monAt(side.index, slot);
        if (m && !m.fainted) out.push(m);
      }
    }
    return out;
  }

  allyOf(mon) {
    const slot = this.slotOf(mon);
    const ally = this.monAt(mon.side, 1 - slot);
    return ally && !ally.fainted ? ally : null;
  }

  foesOf(mon) { return this.activeMons().filter((m) => m.side !== mon.side); }

  bench(sideIndex) {
    const side = this.state.sides[sideIndex];
    return side.team.filter((m) => !m.fainted && !side.active.includes(m.teamIndex));
  }

  ref(mon) { return { side: mon.side, slot: this.slotOf(mon), teamIndex: mon.teamIndex }; }

  // "Larvitar" for the player, "the foe's Larvitar" for the opponent
  name(mon, start = false) {
    const n = this.state.sides[mon.side].isPlayer ? mon.name : `the foe's ${mon.name}`;
    return start ? capitalize(n) : n;
  }

  move(id) { return this.data.moves[id]; }

  // ===============================
  // ABILITIES / ITEMS / WEATHER
  // ===============================

  // Ability as seen when this Pokémon is hit by a move (Mold Breaker ignores some)
  ability(mon) {
    if (!mon || mon.volatile.abilitySuppressed) return null;
    const cm = this.currentMove;
    if (cm && cm.user !== mon && cm.moldBreaker && BREAKABLE.has(mon.ability)) return null;
    return mon.ability;
  }

  item(mon) {
    if (!mon?.item || mon.volatile.embargo || mon.ability === "klutz" || this.state.field.magicRoom > 0) return null;
    return mon.item;
  }

  weather() {
    const w = this.state.field.weather;
    if (!w) return null;
    if (this.activeMons().some((m) => m.ability === "cloud-nine" || m.ability === "air-lock")) return null;
    return w;
  }

  isGrounded(mon) {
    if (this.state.field.gravity > 0) return true;
    if (mon.item === "iron-ball" || mon.volatile.ingrain || mon.volatile.smackedDown) return true;
    if (mon.volatile.telekinesis > 0) return false;
    if (mon.types.includes("flying") || this.ability(mon) === "levitate" || mon.volatile.magnetRise) return false;
    return true;
  }

  consumeItem(mon, text) {
    const item = mon.item;
    mon.consumedItem = item;
    mon.item = null;
    if (mon.ability === "unburden") mon.volatile.unburden = true;
    this.log({ t: "item", ...this.ref(mon), item, consumed: true, text });
  }

  setWeather(type, source) {
    const field = this.state.field;
    if (field.weather === type) return false;
    field.weather = type;
    // Weather from abilities lasts until replaced (Gen 4); moves last 5 turns, 8 with the matching rock
    field.weatherTurns = source?.fromAbility ? 0 : (source && this.item(source.mon) === WEATHER_ROCKS[type] ? 8 : 5);
    this.log({ t: "weather", weather: type, text: WEATHER_START[type] });
    return true;
  }

  // ===============================
  // STATS
  // ===============================

  speed(mon) {
    let s = mon.stats.spe * stageMultiplier(mon.boosts.spe);
    const ab = mon.volatile.abilitySuppressed ? null : mon.ability;
    const w = this.weather();
    if ((ab === "swift-swim" && w === "rain") || (ab === "chlorophyll" && w === "sun") || (ab === "sand-rush" && w === "sand")) s *= 2;
    if (ab === "quick-feet" && mon.status) s *= 1.5;
    if (ab === "unburden" && mon.volatile.unburden) s *= 2;
    if (ab === "slow-start" && mon.volatile.slowStart > 0) s *= 0.5;
    const item = this.item(mon);
    if (item === "choice-scarf") s *= 1.5;
    if (item === "iron-ball" || item === "macho-brace") s *= 0.5;
    const sp = SPECIES_STAT_ITEMS[item];
    if (sp && sp.species.includes(mon.species) && sp.mods.spe) s *= sp.mods.spe;
    if (mon.status === "par" && ab !== "quick-feet") s *= 0.25;
    if (this.state.sides[mon.side].conditions.tailwind) s *= 2;
    if (this.state.sides[mon.side].conditions.swamp) s *= 0.25;
    return Math.floor(s);
  }

  // Order a list of Pokémon fastest first (Trick Room reverses), ties random
  bySpeed(mons) {
    const tr = this.state.field.trickRoom > 0;
    return mons
      .map((m) => ({ m, s: this.speed(m), r: nextRandom(this.state) }))
      .sort((a, b) => (tr ? a.s - b.s : b.s - a.s) || a.r - b.r)
      .map((x) => x.m);
  }

  // Attack or Sp. Atk used for damage
  attackStat(user, stat, crit, target) {
    let stage = user.boosts[stat];
    if (this.ability(target) === "unaware") stage = 0;
    if (crit && stage < 0) stage = 0;
    let v = user.stats[stat] * stageMultiplier(stage);
    const ab = user.volatile.abilitySuppressed ? null : user.ability;
    const w = this.weather();
    if (stat === "atk") {
      if (ab === "huge-power" || ab === "pure-power") v *= 2;
      if (ab === "guts" && user.status) v *= 1.5;
      if (ab === "hustle") v *= 1.5;
      if (ab === "slow-start" && user.volatile.slowStart > 0) v *= 0.5;
      if (ab === "toxic-boost" && (user.status === "psn" || user.status === "tox")) v *= 1.5;
      if (w === "sun" && [user, this.allyOf(user)].some((m) => m && m.ability === "flower-gift")) v *= 1.5;
    } else {
      if ((ab === "plus" || ab === "minus") && this.allyOf(user) && ["plus", "minus"].includes(this.allyOf(user).ability)) v *= 1.5;
      if (ab === "solar-power" && w === "sun") v *= 1.5;
      if (ab === "flare-boost" && user.status === "brn") v *= 1.5;
    }
    const item = this.item(user);
    if (ab === "defeatist" && user.hp <= user.maxHp / 2) v *= 0.5;
    if (CHOICE_ITEMS[item] === stat) v *= 1.5;
    const sp = SPECIES_STAT_ITEMS[item];
    if (sp && sp.species.includes(user.species) && sp.mods[stat]) v *= sp.mods[stat];
    return Math.max(1, Math.floor(v));
  }

  defenseStat(target, stat, crit, user) {
    let stage = target.boosts[stat];
    if (user && user.ability === "unaware" && !user.volatile.abilitySuppressed) stage = 0;
    if (crit && stage > 0) stage = 0;
    const cm = this.currentMove;
    if (cm && cm.user === user && IGNORE_STAGES.has(cm.move.key)) stage = 0;
    const base = this.state.field.wonderRoom > 0 ? (stat === "def" ? "spd" : "def") : stat; // Wonder Room swaps the stats, not the stages
    let v = target.stats[base] * stageMultiplier(stage);
    const ab = this.ability(target);
    const w = this.weather();
    if (stat === "def" && ab === "marvel-scale" && target.status) v *= 1.5;
    if (stat === "spd" && w === "sand" && target.types.includes("rock")) v *= 1.5;
    if (stat === "spd" && w === "sun" && [target, this.allyOf(target)].some((m) => m && m.ability === "flower-gift")) v *= 1.5;
    const item = this.item(target);
    const sp = SPECIES_STAT_ITEMS[item];
    if (sp && sp.species.includes(target.species) && sp.mods[stat]) v *= sp.mods[stat];
    return Math.max(1, Math.floor(v));
  }

  // ===============================
  // REQUESTS & CHOICES
  // ===============================

  // What a side has to choose right now
  getRequest(sideIndex) {
    const st = this.state;
    const side = st.sides[sideIndex];
    if (st.phase === "ended") return { type: "wait" };

    if (st.phase === "switch") {
      const slots = [];
      for (let slot = 0; slot < 2; slot++) {
        if (side.pendingSwitch?.includes(slot)) slots.push({ slot });
      }
      return slots.length
        ? { type: "switch", slots, options: this.bench(sideIndex).map((m) => m.teamIndex) }
        : { type: "wait" };
    }

    const slots = [];
    for (let slot = 0; slot < 2; slot++) {
      const mon = this.monAt(sideIndex, slot);
      if (!mon || mon.fainted) continue;
      slots.push({ slot, teamIndex: mon.teamIndex, ...this.slotOptions(mon) });
    }
    return { type: "move", slots };
  }

  slotOptions(mon) {
    const forced = this.forcedMove(mon);
    if (forced) return { forced, moves: [], canSwitch: false, switchOptions: [] };

    const moves = mon.moves.map((m, i) => {
      const move = this.move(m.id);
      let disabled = m.pp <= 0;
      if (mon.volatile.choiceLock && mon.volatile.choiceLock !== m.id && this.item(mon) in CHOICE_ITEMS) disabled = true;
      if (mon.volatile.taunt && move.category === "status") disabled = true;
      if (mon.volatile.disabled?.move === m.id) disabled = true;
      if (this.isImprisoned(mon, m.id) || (this.state.field.gravity > 0 && GRAVITY_BANNED.has(m.id))) disabled = true;
      if (mon.volatile.torment && mon.volatile.lastMove === m.id) disabled = true;
      if (mon.volatile.encore && mon.volatile.encore.move !== m.id) disabled = true;
      return { index: i, id: m.id, name: move.name, type: this.moveType(mon, move), pp: m.pp, maxPp: m.maxPp,
        target: move.target, disabled };
    });
    const struggle = moves.every((m) => m.disabled);
    const trapped = this.isTrapped(mon);
    const bag = Object.entries(this.state.sides[mon.side].bag ?? {})
      .filter(([, b]) => b.count > 0)
      .map(([id, b]) => ({ id, name: b.name, count: b.count }));
    return {
      moves,
      struggle,
      bag,
      canSwitch: !trapped && this.bench(mon.side).length > 0,
      switchOptions: trapped ? [] : this.bench(mon.side).map((m) => m.teamIndex),
    };
  }

  // A foe's Imprison seals every move it also knows
  isImprisoned(mon, moveId) {
    if (moveId === "struggle") return false;
    return this.foesOf(mon).some((f) => f.volatile.imprison && f.moves.some((m) => m.id === moveId));
  }

  // Moves the Pokémon is locked into (no choice this turn)
  forcedMove(mon) {
    const v = mon.volatile;
    if (v.recharge) return { id: "recharge" };
    if (v.charging) return { id: v.charging.move, target: v.charging.target };
    if (v.rampage) return { id: v.rampage.move };
    if (v.rollout) return { id: v.rollout.move, target: v.rollout.target };
    return null;
  }

  isTrapped(mon) {
    if (this.item(mon) === "shed-shell" || mon.types.includes("ghost")) return false;
    if (mon.volatile.trapped || mon.volatile.meanLook || mon.volatile.ingrain) return true;
    for (const foe of this.foesOf(mon)) {
      const ab = foe.volatile.abilitySuppressed ? null : foe.ability;
      if (ab === "shadow-tag" && mon.ability !== "shadow-tag") return true;
      if (ab === "arena-trap" && this.isGrounded(mon)) return true;
      if (ab === "magnet-pull" && mon.types.includes("steel")) return true;
    }
    return false;
  }

  // Valid targets for a move used from a position (for the UI)
  targetOptions(mon, moveId) {
    const move = this.move(moveId);
    if (!["selected-pokemon", "selected-pokemon-me-first"].includes(move.target)) return [];
    return this.activeMons().filter((m) => m !== mon).map((m) => this.ref(m));
  }

  // choices: [sideChoices, sideChoices]; sideChoices: [{ slot, type: "move", move: index, target: {side, slot} }
  //                                                  | { slot, type: "switch", teamIndex }]
  submitTurn(choices) {
    const st = this.state;
    if (st.phase !== "choose") throw new Error(`Can't submit a turn in phase "${st.phase}"`);

    const actions = [];
    for (const side of st.sides) {
      for (let slot = 0; slot < 2; slot++) {
        const mon = this.monAt(side.index, slot);
        if (!mon || mon.fainted) continue;
        const choice = choices[side.index]?.find((c) => c.slot === slot) ?? { type: "move", move: 0 };
        actions.push(this.buildAction(mon, slot, choice));
      }
    }

    // Reset per-turn flags
    for (const m of this.activeMons()) {
      const v = m.volatile;
      v.protect = false; v.endure = false; v.helpingHand = false; v.followMe = false;
      v.flinch = false; v.moved = false; v.damagedBy = []; v.hurtThisTurn = false;
      v.magicCoat = false; v.snatch = false;
      v.lastDamage = null;
    }
    for (const side of st.sides) { side.conditions.followMe = null; delete side.conditions.wideGuard; delete side.conditions.quickGuard; }
    for (const a of actions) if (a.type === "move") a.mon.volatile.pendingMove = a.moveId;

    // Switches first, then moves by priority → speed
    const tr = st.field.trickRoom > 0;
    for (const a of actions) {
      a.speed = this.speed(a.mon);
      a.random = nextRandom(st);
      a.quick = a.type === "move" && this.item(a.mon) === "quick-claw" && chance(st, 20) ? 1 : 0;
      a.slow = a.type === "move" && ["lagging-tail", "full-incense"].includes(this.item(a.mon)) ? 1 : 0;
    }
    actions.sort((a, b) => {
      const aSwitch = a.type === "switch";
      const bSwitch = b.type === "switch";
      if (aSwitch !== bSwitch) return aSwitch ? -1 : 1;
      if (aSwitch) return b.speed - a.speed || a.random - b.random;
      return b.priority - a.priority
        || b.quick - a.quick
        || a.slow - b.slow
        || (tr ? a.speed - b.speed : b.speed - a.speed)
        || a.random - b.random;
    });
    this.turnOrder = actions.map((a) => a.mon);

    this.queue = actions; // After You moves an action forward in this list
    for (const a of actions) {
      this.currentAction = a;
      if (st.phase === "ended") break;
      if (a.mon.fainted || !this.isActive(a.mon)) continue;
      if (a.type === "switch") {
        this.doSwitch(a.mon.side, this.slotOf(a.mon), a.teamIndex);
      } else if (a.type === "item") {
        this.useBagItem(a.mon.side, a.item, a.teamIndex);
      } else {
        this.runMoveAction(a);
      }
      a.mon.volatile.moved = true;
      this.checkWin();
    }

    if (st.phase !== "ended") this.endOfTurn();
    if (st.phase !== "ended") this.afterTurn();
    return this.takeEvents();
  }

  buildAction(mon, slot, choice) {
    const forced = this.forcedMove(mon);
    if (forced) {
      const priority = forced.id === "recharge" ? 0 : this.move(forced.id).priority;
      return { type: "move", mon, slot, moveId: forced.id, target: forced.target ?? null, priority, forced: true };
    }
    if (choice.type === "switch") {
      return { type: "switch", mon, slot, teamIndex: choice.teamIndex, priority: 100 };
    }
    if (choice.type === "item") {
      return { type: "item", mon, slot, item: choice.item, teamIndex: choice.teamIndex, priority: 50 };
    }
    const opts = this.slotOptions(mon);
    let moveId;
    if (opts.struggle) moveId = "struggle";
    else {
      const chosen = opts.moves[choice.move];
      moveId = chosen && !chosen.disabled ? chosen.id : opts.moves.find((m) => !m.disabled).id;
    }
    // Prankster: status moves go first
    const prank = mon.ability === "prankster" && !mon.volatile.abilitySuppressed && this.move(moveId).category === "status" ? 1 : 0;
    return { type: "move", mon, slot, moveId, target: choice.target ?? null, priority: this.move(moveId).priority + prank };
  }

  // After the turn: who needs replacing?
  afterTurn() {
    const st = this.state;
    let waiting = false;
    for (const side of st.sides) {
      side.pendingSwitch = [];
      const bench = this.bench(side.index);
      for (let slot = 0; slot < 2; slot++) {
        const mon = this.monAt(side.index, slot);
        if (mon && !mon.fainted) continue;
        if (mon?.fainted) side.active[slot] = null;
        if (side.pendingSwitch.length < bench.length) side.pendingSwitch.push(slot);
      }
      if (side.pendingSwitch.length) waiting = true;
    }
    if (waiting) {
      st.phase = "switch";
    } else {
      st.turn += 1;
      st.phase = "choose";
      this.log({ t: "turn", turn: st.turn });
    }
  }

  // choices: [[{ slot, teamIndex }], [...]] for every pending slot
  submitSwitches(choices) {
    const st = this.state;
    if (st.phase !== "switch") throw new Error(`Can't submit switches in phase "${st.phase}"`);
    const entering = [];
    for (const side of st.sides) {
      const used = new Set();
      for (const slot of side.pendingSwitch ?? []) {
        let teamIndex = choices[side.index]?.find((c) => c.slot === slot)?.teamIndex;
        const valid = this.bench(side.index).filter((m) => !used.has(m.teamIndex)).map((m) => m.teamIndex);
        if (!valid.includes(teamIndex)) teamIndex = valid[0];
        if (teamIndex === undefined) continue;
        used.add(teamIndex);
        entering.push({ side: side.index, slot, teamIndex });
      }
      side.pendingSwitch = [];
    }
    // Send in, then switch-in effects by speed
    const mons = entering.map((e) => this.placeOnField(e.side, e.slot, e.teamIndex));
    for (const m of this.bySpeed(mons)) {
      this.applyEntryHazards(m);
      if (!m.fainted) this.runSwitchInAbility(m);
    }
    this.checkWin();
    if (st.phase !== "ended") {
      // A hazard KO can require another replacement
      this.afterTurnReplacementsOnly();
    }
    return this.takeEvents();
  }

  afterTurnReplacementsOnly() {
    const st = this.state;
    for (const side of st.sides) {
      for (let slot = 0; slot < 2; slot++) {
        const m = this.monAt(side.index, slot);
        if (m?.fainted) side.active[slot] = null;
      }
    }
    const needs = st.sides.some((side) => [0, 1].some((slot) => !this.monAt(side.index, slot)) && this.bench(side.index).length);
    if (needs) {
      for (const side of st.sides) {
        side.pendingSwitch = [];
        const bench = this.bench(side.index);
        for (let slot = 0; slot < 2; slot++) {
          if (!this.monAt(side.index, slot) && side.pendingSwitch.length < bench.length) side.pendingSwitch.push(slot);
        }
      }
      st.phase = "switch";
    } else {
      st.turn += 1;
      st.phase = "choose";
      this.log({ t: "turn", turn: st.turn });
    }
  }

  // ===============================
  // BAG ITEMS
  // ===============================

  useBagItem(sideIndex, itemId, teamIndex) {
    const side = this.state.sides[sideIndex];
    const entry = side.bag[itemId];
    const target = side.team[teamIndex];
    if (!entry || entry.count <= 0 || !target || target.fainted) return;
    const effect = entry.effect ?? {};
    const who = side.isPlayer ? "You" : side.name;
    this.log({ t: "bagItem", side: sideIndex, item: itemId, teamIndex, text: `${who} used ${/^[AEIOUX]/.test(entry.name) ? "an" : "a"} ${entry.name} on ${target.name}!` });

    const active = this.isActive(target);
    let did = false;
    if (effect.heal && target.hp < target.maxHp) {
      const amount = effect.heal === "full" ? target.maxHp : effect.heal;
      const healed = Math.min(amount, target.maxHp - target.hp);
      target.hp += healed;
      this.log({ t: "heal", ...this.ref(target), hp: target.hp, maxHp: target.maxHp, amount: healed, bench: !active,
        text: `${target.name}'s HP was restored.` });
      did = true;
    }
    if (effect.cure) {
      if (target.status && effect.cure.includes(target.status)) { this.cureStatus(target); did = true; }
      if (target.volatile?.confusion && effect.cure.includes("confusion")) {
        delete target.volatile.confusion;
        this.msg(`${target.name} snapped out of its confusion!`);
        did = true;
      }
    }
    if (effect.boost && active) did = this.boost(target, effect.boost, target) || did;
    if (effect.focusEnergy && active && !target.volatile.focusEnergy) {
      target.volatile.focusEnergy = true;
      this.msg(`${target.name} is getting pumped!`);
      did = true;
    }
    if (effect.mist && !side.conditions.mist) {
      side.conditions.mist = 5;
      this.msg(`${side.isPlayer ? "Your team" : "The foe's team"} became shrouded in mist!`);
      did = true;
    }
    if (!did) {
      this.msg("But it had no effect.");
      return;
    }
    entry.count -= 1;
    side.usedItems[itemId] = (side.usedItems[itemId] ?? 0) + 1;
  }

  // ===============================
  // SWITCHING
  // ===============================

  onEnterField(mon) {
    mon.volatile = { activeTurns: 0 };
    mon.boosts = emptyBoosts();
    if (mon.ability === "slow-start") mon.volatile.slowStart = 5;
  }

  onLeaveField(mon) {
    const ab = mon.volatile.abilitySuppressed ? null : mon.ability;
    if (ab === "natural-cure" && mon.status) mon.status = null;
    if (ab === "regenerator" && !mon.fainted) mon.hp = Math.min(mon.maxHp, mon.hp + Math.floor(mon.maxHp / 3));
    if (mon.status === "tox") mon.statusTurns = 1;
    this.restoreForm(mon);
    for (const k of ["mudSport", "waterSport"]) if (this.state.field[k] === this.monKey(mon)) delete this.state.field[k];
    // Foes that were trapped / seeded by this Pokémon are released
    for (const other of this.activeMons()) {
      if (other.volatile.trapped?.by === mon.teamIndex + ":" + mon.side) delete other.volatile.trapped;
      if (other.volatile.meanLook === mon.teamIndex + ":" + mon.side) delete other.volatile.meanLook;
    }
    mon.volatile = {};
    mon.boosts = emptyBoosts();
  }

  // Everything that only lasts while the Pokémon is in battle: Transform, Mimic, Power Trick, type changes
  restoreForm(mon) {
    const v = mon.volatile;
    if (v.transformed && v.original) {
      mon.ability = v.original.ability;
      mon.stats = v.original.stats;
      mon.weightKg = v.original.weightKg;
      mon.moves = v.original.moves;
    }
    if (v.originalAbility) mon.ability = v.originalAbility;
    if (v.originalWeight !== undefined) mon.weightKg = v.originalWeight;
    if (v.splitBackup) Object.assign(mon.stats, v.splitBackup);
    if (v.mimic && !v.mimic.afterTransform) mon.moves[v.mimic.index] = v.mimic.move;
    if (v.powerTrick && !v.powerTrickSkip) [mon.stats.atk, mon.stats.def] = [mon.stats.def, mon.stats.atk];
    if (v.originalTypes) mon.types = v.originalTypes;
  }

  placeOnField(sideIndex, slot, teamIndex) {
    const side = this.state.sides[sideIndex];
    const mon = side.team[teamIndex];
    side.active[slot] = teamIndex;
    this.onEnterField(mon);
    const pass = side.batonPass;
    if (pass) {
      mon.boosts = pass.boosts;
      Object.assign(mon.volatile, pass.volatile);
      side.batonPass = null;
    }
    if (side.healingWish) {
      mon.hp = mon.maxHp;
      mon.status = null;
      side.healingWish = false;
      this.msg(`The healing wish came true for ${this.name(mon)}!`);
    }
    this.log({ t: "switch", ...this.ref(mon), species: mon.species, name: mon.name, hp: mon.hp, maxHp: mon.maxHp,
      text: side.isPlayer ? `Go! ${mon.name}!` : `${side.name} sent out ${mon.name}!` });
    return mon;
  }

  doSwitch(sideIndex, slot, teamIndex, { batonPass = false } = {}) {
    const side = this.state.sides[sideIndex];
    const out = this.monAt(sideIndex, slot);
    const incoming = side.team[teamIndex];
    if (!incoming || incoming.fainted || side.active.includes(teamIndex)) return false;
    if (out) {
      if (batonPass) {
        const keep = {};
        for (const k of ["confusion", "focusEnergy", "substitute", "leechSeed", "ingrain", "aquaRing", "magnetRise", "meanLook", "trapped"]) {
          if (out.volatile[k] !== undefined) keep[k] = out.volatile[k];
        }
        side.batonPass = { boosts: { ...out.boosts }, volatile: keep };
      }
      this.log({ t: "switchOut", ...this.ref(out), text: side.isPlayer ? `${out.name}, come back!` : `${side.name} withdrew ${out.name}!` });
      this.onLeaveField(out);
    }
    const mon = this.placeOnField(sideIndex, slot, teamIndex);
    this.applyEntryHazards(mon);
    if (!mon.fainted) this.runSwitchInAbility(mon);
    return true;
  }

  applyEntryHazards(mon) {
    const c = this.state.sides[mon.side].conditions;
    if (c.stealthRock) {
      const eff = mon.types.reduce((a, t) => a * typeMultiplier("rock", t), 1);
      this.indirectDamage(mon, Math.floor((mon.maxHp * eff) / 8), `Pointed stones dug into ${this.name(mon)}!`);
    }
    if (c.spikes && this.isGrounded(mon) && !mon.fainted) {
      const frac = [0, 1 / 8, 1 / 6, 1 / 4][c.spikes];
      this.indirectDamage(mon, Math.floor(mon.maxHp * frac), `${this.name(mon, true)} is hurt by spikes!`);
    }
    if (c.toxicSpikes && this.isGrounded(mon) && !mon.fainted) {
      if (mon.types.includes("poison")) {
        c.toxicSpikes = 0;
        this.msg(`The poison spikes disappeared around ${this.name(mon)}'s feet!`);
      } else {
        this.trySetStatus(mon, c.toxicSpikes >= 2 ? "tox" : "psn", null);
      }
    }
  }

  runSwitchInAbility(mon) {
    const ab = mon.volatile.abilitySuppressed ? null : mon.ability;
    if (WEATHER_ABILITIES[ab]) {
      this.setWeather(WEATHER_ABILITIES[ab], { fromAbility: true, mon });
    } else if (ab === "intimidate") {
      this.log({ t: "ability", ...this.ref(mon), ability: ab, text: `${this.name(mon, true)}'s Intimidate!` });
      for (const foe of this.foesOf(mon)) {
        if (foe.volatile.substitute) continue;
        this.boost(foe, { atk: -1 }, mon);
      }
    } else if (ab === "download") {
      const foes = this.foesOf(mon);
      const def = foes.reduce((a, f) => a + this.defenseStat(f, "def"), 0);
      const spd = foes.reduce((a, f) => a + this.defenseStat(f, "spd"), 0);
      this.boost(mon, def < spd ? { atk: 1 } : { spa: 1 }, mon);
    } else if (ab === "pressure") {
      this.msg(`${this.name(mon, true)} is exerting its Pressure!`);
    } else if (ab === "mold-breaker") {
      this.msg(`${this.name(mon, true)} breaks the mold!`);
    } else if (ab === "trace") {
      const options = this.foesOf(mon).filter((f) => !["trace", "multitype", "forecast", "flower-gift", "imposter"].includes(f.ability));
      if (options.length) {
        const f = pick(this.state, options);
        this.setAbility(mon, f.ability);
        this.msg(`${this.name(mon, true)} traced ${this.name(f)}'s ${this.data.abilities[f.ability]?.name ?? f.ability}!`);
        this.runSwitchInAbility(mon);
      }
    } else if (ab === "anticipation" || ab === "forewarn" || ab === "frisk") {
      // Information abilities: just flavour text for now
      this.msg(`${this.name(mon, true)}'s ${this.data.abilities[ab].name} activated.`);
    }
  }

  // ===============================
  // HP CHANGES
  // ===============================

  // Damage from a move hit. Returns damage dealt.
  applyMoveDamage(target, amount) {
    amount = Math.max(0, Math.min(amount, target.hp));
    target.hp -= amount;
    return amount;
  }

  // Damage that isn't from a direct hit (weather, poison, recoil…)
  indirectDamage(mon, amount, text, { recoil = false } = {}) {
    if (mon.fainted || amount <= 0) return 0;
    if (mon.ability === "magic-guard" && !mon.volatile.abilitySuppressed) return 0;
    amount = Math.max(1, Math.min(amount, mon.hp));
    mon.hp -= amount;
    this.log({ t: "damage", ...this.ref(mon), hp: mon.hp, maxHp: mon.maxHp, amount, indirect: true, recoil, text });
    if (mon.hp <= 0) this.faint(mon);
    else this.checkHpBerries(mon);
    return amount;
  }

  heal(mon, amount, text) {
    if (mon.fainted || mon.volatile.healBlock || mon.hp >= mon.maxHp) return 0;
    amount = Math.max(1, Math.min(Math.floor(amount), mon.maxHp - mon.hp));
    mon.hp += amount;
    this.log({ t: "heal", ...this.ref(mon), hp: mon.hp, maxHp: mon.maxHp, amount, text });
    return amount;
  }

  faint(mon) {
    if (mon.fainted) return;
    this.state.sides[mon.side].lastFaintTurn = this.state.turn;
    mon.hp = 0;
    mon.fainted = true;
    this.log({ t: "faint", ...this.ref(mon), text: `${this.name(mon, true)} fainted!` });
    mon.volatile = {};
    mon.boosts = emptyBoosts();
  }

  checkWin() {
    const st = this.state;
    if (st.phase === "ended") return true;
    const alive = st.sides.map((s) => s.team.some((m) => !m.fainted));
    if (alive.every(Boolean)) return false;
    st.phase = "ended";
    st.winner = alive[0] ? 0 : alive[1] ? 1 : null; // null = both sides out (draw)
    const text = st.winner === null ? "The battle ended in a draw!"
      : st.sides[st.winner].isPlayer ? `You defeated ${st.sides[1 - st.winner].name}!`
        : `You were defeated by ${st.sides[st.winner].name}...`;
    this.log({ t: "end", winner: st.winner, text });
    return true;
  }

  // ===============================
  // STATUS & BOOSTS
  // ===============================

  trySetStatus(target, status, source, { fromMove = false, statusMove = false } = {}) {
    if (target.fainted) return false;
    const fail = (text) => { if (statusMove) this.msg(text ?? "But it failed!"); return false; };
    if (target.status) {
      return fail(target.status === status || (status === "psn" && target.status === "tox")
        ? `${this.name(target, true)} is already ${STATUS_NAMES[target.status]}!` : "But it failed!");
    }
    const t = target.types;
    if (status === "brn" && t.includes("fire")) return fail(`It doesn't affect ${this.name(target)}...`);
    if ((status === "psn" || status === "tox") && (t.includes("poison") || t.includes("steel"))) return fail(`It doesn't affect ${this.name(target)}...`);
    if (status === "frz" && (t.includes("ice") || this.weather() === "sun")) return fail();
    if (source && source !== target && this.state.sides[target.side].conditions.safeguard) {
      return fail(`${this.name(target, true)} is protected by Safeguard!`);
    }
    if (target.volatile.substitute && source && source !== target && fromMove) return fail();
    const ab = this.ability(target);
    const blocked = (ab === "immunity" && (status === "psn" || status === "tox"))
      || (ab === "limber" && status === "par")
      || ((ab === "insomnia" || ab === "vital-spirit") && status === "slp")
      || (ab === "water-veil" && status === "brn")
      || (ab === "magma-armor" && status === "frz")
      || (ab === "leaf-guard" && this.weather() === "sun");
    if (blocked) return fail(`${this.name(target, true)}'s ${this.data.abilities[ab].name} prevents it!`);

    target.status = status;
    if (status === "slp") {
      target.statusTurns = randomInt(this.state, 2, 4); // can't move for 1–3 turns (Gen 5 rule)
      if (ab === "early-bird") target.statusTurns = Math.ceil(target.statusTurns / 2);
    } else if (status === "tox") {
      target.statusTurns = 1;
    }
    const verb = { brn: "was burned!", par: "is paralyzed! It may be unable to move!", psn: "was poisoned!",
      tox: "was badly poisoned!", slp: "fell asleep!", frz: "was frozen solid!" }[status];
    this.log({ t: "status", ...this.ref(target), status, text: `${this.name(target, true)} ${verb}` });

    // Synchronize passes burn/paralysis/poison back
    if (ab === "synchronize" && source && source !== target && ["brn", "par", "psn", "tox"].includes(status)) {
      this.trySetStatus(source, status, target);
    }
    this.checkStatusBerries(target);
    return true;
  }

  cureStatus(mon, text) {
    if (!mon.status) return;
    const s = mon.status;
    mon.status = null;
    mon.statusTurns = 0;
    this.log({ t: "cure", ...this.ref(mon), status: s, text: text ?? `${this.name(mon, true)}${STATUS_CURE_TEXT[s]}` });
  }

  tryConfuse(target, source, { statusMove = false } = {}) {
    if (target.fainted) return false;
    if (target.volatile.confusion) {
      if (statusMove) this.msg(`${this.name(target, true)} is already confused!`);
      return false;
    }
    if (this.ability(target) === "own-tempo" || (source !== target && this.state.sides[target.side].conditions.safeguard)) {
      if (statusMove) this.msg("But it failed!");
      return false;
    }
    target.volatile.confusion = randomInt(this.state, 1, 4);
    this.log({ t: "volatile", ...this.ref(target), volatile: "confusion", text: `${this.name(target, true)} became confused!` });
    this.checkStatusBerries(target);
    return true;
  }

  // changes: { atk: -1, … }. Returns true if anything changed.
  boost(target, changes, source, { statusMove = false } = {}) {
    if (target.fainted) return false;
    const ab = this.ability(target);
    const fromFoe = source && source.side !== target.side;
    let any = false;
    let dropped = false;
    for (let [stat, amount] of Object.entries(changes)) {
      if (ab === "simple") amount *= 2;
      if (ab === "contrary") amount = -amount;
      if (amount < 0 && fromFoe) {
        if (target.volatile.substitute && this.currentMove) continue;
        if (this.state.sides[target.side].conditions.mist) { this.msg(`${this.name(target, true)} is protected by the mist!`); continue; }
        if (ab === "clear-body" || ab === "white-smoke"
          || (ab === "hyper-cutter" && stat === "atk") || (ab === "keen-eye" && stat === "accuracy")
          || (ab === "big-pecks" && stat === "def")) {
          if (statusMove || source?.ability === "intimidate") this.msg(`${this.name(target, true)}'s ${this.data.abilities[ab].name} prevents its ${STAT_NAMES[stat]} from being lowered!`);
          continue;
        }
      }
      const before = target.boosts[stat];
      const after = Math.max(-6, Math.min(6, before + amount));
      if (after === before) {
        if (statusMove || amount > 0 || source === target) {
          this.msg(`${this.name(target, true)}'s ${STAT_NAMES[stat]} won't go ${amount > 0 ? "higher" : "lower"}!`);
        }
        continue;
      }
      target.boosts[stat] = after;
      any = true;
      if (after < before) dropped = true;
      const diff = after - before;
      const how = diff >= 3 ? "rose drastically!" : diff === 2 ? "rose sharply!" : diff === 1 ? "rose!"
        : diff === -1 ? "fell!" : diff === -2 ? "harshly fell!" : "severely fell!";
      this.log({ t: "boost", ...this.ref(target), stat, amount: diff, stage: after, text: `${this.name(target, true)}'s ${STAT_NAMES[stat]} ${how}` });
    }
    if (dropped && fromFoe) {
      if (ab === "defiant") this.boost(target, { atk: 2 }, target);
      if (ab === "competitive") this.boost(target, { spa: 2 }, target);
    }
    if (dropped && this.item(target) === "white-herb") {
      for (const s of Object.keys(target.boosts)) if (target.boosts[s] < 0) target.boosts[s] = 0;
      this.consumeItem(target, `${this.name(target, true)} returned its stats to normal using its White Herb!`);
    }
    return any;
  }

  // ===============================
  // BERRIES & ITEM TRIGGERS
  // ===============================

  checkHpBerries(mon) {
    const item = this.item(mon);
    if (!item || mon.fainted) return;
    if (this.foesOf(mon).some((f) => f.ability === "unnerve") && isBerry(item)) return;
    const gluttony = mon.ability === "gluttony";
    if (HEAL_BERRIES[item] && mon.hp <= mon.maxHp / 2) {
      const b = HEAL_BERRIES[item];
      const amount = b.flat ?? Math.floor(mon.maxHp * b.fraction);
      this.consumeItem(mon, `${this.name(mon, true)} ate its ${this.itemName(item)}!`);
      this.heal(mon, amount, `${this.name(mon, true)} restored health!`);
    } else if (PINCH_BERRIES[item] && mon.hp <= mon.maxHp / (gluttony ? 2 : 4)) {
      this.consumeItem(mon, `${this.name(mon, true)} ate its ${this.itemName(item)}!`);
      this.boost(mon, { [PINCH_BERRIES[item]]: 1 }, mon);
    } else if (item === "lansat-berry" && mon.hp <= mon.maxHp / (gluttony ? 2 : 4)) {
      this.consumeItem(mon, `${this.name(mon, true)} ate its Lansat Berry!`);
      mon.volatile.focusEnergy = true;
      this.msg(`${this.name(mon, true)} is getting pumped!`);
    } else if (item === "starf-berry" && mon.hp <= mon.maxHp / (gluttony ? 2 : 4)) {
      this.consumeItem(mon, `${this.name(mon, true)} ate its Starf Berry!`);
      this.boost(mon, { [pick(this.state, ["atk", "def", "spa", "spd", "spe"])]: 2 }, mon);
    }
  }

  checkStatusBerries(mon) {
    const item = this.item(mon);
    const cures = CURE_BERRIES[item];
    if (!cures || mon.fainted) return;
    const statusHit = mon.status && cures.includes(mon.status);
    const confHit = mon.volatile.confusion && cures.includes("confusion");
    if (!statusHit && !confHit) return;
    this.consumeItem(mon, `${this.name(mon, true)} ate its ${this.itemName(item)}!`);
    if (statusHit) this.cureStatus(mon);
    if (confHit) {
      delete mon.volatile.confusion;
      this.msg(`${this.name(mon, true)} snapped out of its confusion!`);
    }
  }

  itemName(item) {
    return item.split("-").map(capitalize).join(" ");
  }

  // ===============================
  // MOVE TYPE & POWER
  // ===============================

  moveType(user, move) {
    if (move.key === "struggle") return "???";
    if (move.key === "weather-ball") {
      return { rain: "water", sun: "fire", sand: "rock", hail: "ice" }[this.weather()] ?? "normal";
    }
    if (move.key === "hidden-power") return this.hiddenPower(user).type;
    if (user.ability === "normalize" && !user.volatile.abilitySuppressed) return "normal";
    return move.type;
  }

  hiddenPower(mon) {
    const order = ["hp", "atk", "def", "spe", "spa", "spd"];
    let typeSum = 0;
    let powerSum = 0;
    order.forEach((s, i) => {
      typeSum += (mon.ivs[s] % 2) << i;
      powerSum += ((mon.ivs[s] >> 1) % 2) << i;
    });
    const hpTypes = TYPES.filter((t) => t !== "normal");
    return { type: hpTypes[Math.floor((typeSum * 15) / 63)], power: Math.floor((powerSum * 40) / 63) + 30 };
  }

  basePower(user, target, move) {
    const st = this.state;
    const pct = (m) => m.hp / m.maxHp;
    switch (move.key) {
      case "low-kick": case "grass-knot": {
        const w = target.weightKg;
        return w < 10 ? 20 : w < 25 ? 40 : w < 50 ? 60 : w < 100 ? 80 : w < 200 ? 100 : 120;
      }
      case "flail": case "reversal": {
        const p = Math.floor((64 * user.hp) / user.maxHp);
        return p <= 1 ? 200 : p <= 5 ? 150 : p <= 12 ? 100 : p <= 21 ? 80 : p <= 42 ? 40 : 20;
      }
      case "eruption": case "water-spout": return Math.max(1, Math.floor(150 * pct(user)));
      case "wring-out": case "crush-grip": return 1 + Math.floor(120 * pct(target));
      case "gyro-ball": return Math.min(150, Math.floor((25 * this.speed(target)) / Math.max(1, this.speed(user))) + 1);
      case "return": case "frustration": return 102; // no friendship system: always max power
      case "hidden-power": return this.hiddenPower(user).power;
      case "weather-ball": return this.weather() ? 100 : 50;
      case "magnitude": return user.volatile.magnitude ?? 70;
      case "facade": return user.status && user.status !== "slp" && user.status !== "frz" ? 140 : 70;
      case "brine": return target.hp <= target.maxHp / 2 ? 130 : 65;
      case "payback": return target.volatile.moved ? 100 : 50;
      case "avalanche": case "revenge":
        return user.volatile.damagedBy?.some((d) => d.side === target.side && d.teamIndex === target.teamIndex) ? 120 : 60;
      case "assurance": return target.volatile.hurtThisTurn ? 100 : 50;
      case "wake-up-slap": return target.status === "slp" ? 120 : 60;
      case "smelling-salts": return target.status === "par" ? 120 : 60;
      case "punishment": {
        const ups = Object.values(target.boosts).reduce((a, b) => a + Math.max(0, b), 0);
        return Math.min(200, 60 + 20 * ups);
      }
      case "trump-card": {
        const left = user.moves.find((m) => m.id === "trump-card")?.pp ?? 0;
        return [200, 80, 60, 50][left] ?? 40;
      }
      case "rollout": case "ice-ball": {
        const n = user.volatile.rollout?.count ?? 0;
        return 30 * 2 ** n * (user.volatile.defenseCurl ? 2 : 1);
      }
      case "fury-cutter": return Math.min(160, 10 * 2 ** (user.volatile.furyCutter ?? 0));
      case "pursuit": return 40;
      case "venoshock": return target.status === "psn" || target.status === "tox" ? 130 : 65;
      case "hex": return target.status ? 100 : 50;
      case "acrobatics": return this.item(user) ? 55 : 110;
      case "retaliate": return this.state.sides[user.side].lastFaintTurn === st.turn - 1 || this.state.sides[user.side].lastFaintTurn === st.turn ? 140 : 70;
      case "stored-power": return 20 + 20 * Object.values(user.boosts).reduce((a, b) => a + Math.max(0, b), 0);
      case "heavy-slam": case "heat-crash": {
        const r = user.weightKg / Math.max(0.1, target.weightKg);
        return r >= 5 ? 120 : r >= 4 ? 100 : r >= 3 ? 80 : r >= 2 ? 60 : 40;
      }
      case "electro-ball": {
        const r = this.speed(user) / Math.max(1, this.speed(target));
        return r >= 4 ? 150 : r >= 3 ? 120 : r >= 2 ? 80 : r >= 1 ? 60 : 40;
      }
      case "echoed-voice": return 40 * (st.field.echoCount ?? 1);
      case "round": return st.field.roundTurn === st.turn ? 120 : 60;
      case "fusion-flare": case "fusion-bolt": return st.field.fusion?.turn === st.turn && st.field.fusion.key !== move.key ? 200 : 100;
      case "water-pledge": case "fire-pledge": case "grass-pledge": return user.volatile.pledgeCombo ? 150 : 50;
      case "spit-up": return 100 * (user.volatile.stockpile ?? 1);
      case "present": return user.volatile.present ?? 40;
      case "triple-kick": return 10 * (user.volatile.hitNumber ?? 1);
      case "struggle": return 50;
      default: return move.power ?? 0;
    }
  }

  // Base power after ability/item modifiers (Gen 4 applies most of these to power)
  modifiedPower(user, target, move, type, bp) {
    const ab = user.volatile.abilitySuppressed ? null : user.ability;
    const tab = this.ability(target);
    const item = this.item(user);
    let p = bp;
    if (user.volatile.helpingHand) p *= 1.5;
    if (TYPE_BOOST_ITEMS[item] === type) p *= 1.2;
    if (item === "muscle-band" && move.category === "physical") p *= 1.1;
    if (item === "wise-glasses" && move.category === "special") p *= 1.1;
    if (item === "adamant-orb" && user.species === "dialga" && (type === "dragon" || type === "steel")) p *= 1.2;
    if (item === "lustrous-orb" && user.species === "palkia" && (type === "dragon" || type === "water")) p *= 1.2;
    if (ab === "technician" && bp <= 60) p *= 1.5;
    if (ab === "iron-fist" && PUNCH.has(move.key)) p *= 1.2;
    if (ab === "reckless" && RECOIL.has(move.key)) p *= 1.2;
    if (ab === "rivalry" && user.gender && target.gender) p *= user.gender === target.gender ? 1.25 : 0.75;
    const pinch = { blaze: "fire", torrent: "water", overgrow: "grass", swarm: "bug" }[ab];
    if (pinch === type && user.hp <= user.maxHp / 3) p *= 1.5;
    if (ab === "sand-force" && this.weather() === "sand" && ["rock", "ground", "steel"].includes(type)) p *= 1.3;
    if (ab === "sheer-force" && this.hasSecondary(move)) p *= 1.3;
    if (ab === "analytic" && this.turnOrder && this.turnOrder.filter((m) => !m.volatile.moved && m !== user).length === 0) p *= 1.3;
    if (user.volatile.charge && type === "electric") p *= 2;
    if (user.volatile.meFirst) p *= 1.5;
    if (type === "electric" && this.sportActive("mudSport")) p *= 0.5;
    if (type === "fire" && this.sportActive("waterSport")) p *= 0.5;
    if (tab === "thick-fat" && (type === "fire" || type === "ice")) p *= 0.5;
    if (tab === "heatproof" && type === "fire") p *= 0.5;
    if (tab === "dry-skin" && type === "fire") p *= 1.25;
    if (move.key === "solar-beam" && ["rain", "sand", "hail"].includes(this.weather())) p *= 0.5;
    return Math.max(1, Math.floor(p));
  }

  hasSecondary(move) {
    const m = move.meta;
    if (!m) return false;
    return (m.ailmentChance > 0 && m.ailmentChance < 100 && move.category !== "status")
      || m.flinchChance > 0
      || (m.statChance > 0 && (m.category === "damage-lower" || (m.category === "damage-raise" && move.statChanges.every((s) => s.change > 0))));
  }

  effectiveness(type, target) {
    if (type === "???") return 1;
    let eff = 1;
    for (const t of target.types) {
      let m = typeMultiplier(type, t);
      if (m === 0 && t === "ghost" && (type === "normal" || type === "fighting")
        && (target.volatile.foresight || this.currentMove?.user?.ability === "scrappy")) m = 1;
      if (m === 0 && t === "dark" && type === "psychic" && target.volatile.miracleEye) m = 1;
      eff *= m;
    }
    if (type === "ground" && !this.isGrounded(target)) eff = 0;
    if (type === "ground" && eff === 0 && this.isGrounded(target) && target.types.includes("flying")) {
      eff = target.types.filter((t) => t !== "flying").reduce((a, t) => a * typeMultiplier("ground", t), 1);
    }
    return eff;
  }

  critStage(user, move) {
    let s = move.meta?.critRate ?? 0;
    if (user.volatile.focusEnergy) s += 2;
    const ab = user.volatile.abilitySuppressed ? null : user.ability;
    if (ab === "super-luck") s += 1;
    const item = this.item(user);
    if (item === "scope-lens" || item === "razor-claw") s += 1;
    if ((item === "stick" && user.species === "farfetchd") || (item === "lucky-punch" && user.species === "chansey")) s += 2;
    return Math.min(4, s);
  }

  // ===============================
  // DAMAGE (Gen 4 formula)
  // ===============================

  calcDamage(user, target, move, { type, crit, spread, roll }) {
    const bp = this.modifiedPower(user, target, move, type, this.basePower(user, target, move));
    const physical = move.category === "physical";
    const atk = move.key === "foul-play" ? this.attackStat(target, "atk", crit, user) : this.attackStat(user, physical ? "atk" : "spa", crit, target);
    let def = this.defenseStat(target, physical || USES_DEFENSE.has(move.key) ? "def" : "spd", crit, user);
    if (move.key === "self-destruct" || move.key === "explosion") def = Math.max(1, Math.floor(def / 2));

    let d = Math.floor(Math.floor((Math.floor((2 * user.level) / 5) + 2) * bp * atk / 50) / def);

    // Mod1
    if (physical && user.status === "brn" && user.ability !== "guts") d = Math.floor(d / 2);
    const tside = this.state.sides[target.side];
    const screen = physical ? tside.conditions.reflect : tside.conditions.lightScreen;
    if (screen && !crit && user.ability !== "infiltrator") {
      const doubles = this.activeMons().filter((m) => m.side === target.side).length > 1;
      d = Math.floor(doubles ? (d * 2) / 3 : d / 2);
    }
    if (spread) d = Math.floor((d * 3) / 4);
    const w = this.weather();
    if ((w === "rain" && type === "water") || (w === "sun" && type === "fire")) d = Math.floor(d * 1.5);
    if ((w === "rain" && type === "fire") || (w === "sun" && type === "water")) d = Math.floor(d / 2);
    if (user.volatile.flashFire && type === "fire") d = Math.floor(d * 1.5);
    d += 2;

    if (crit) d *= user.ability === "sniper" ? 3 : 2;
    if (this.item(user) === "life-orb") d = Math.floor((d * 13) / 10);
    d = Math.floor((d * roll) / 100);

    if (user.types.includes(type)) d = Math.floor(d * (user.ability === "adaptability" ? 2 : 1.5));
    const eff = this.effectiveness(type, target);
    for (const t of target.types) {
      const m = type === "???" ? 1 : typeMultiplier(type, t);
      if (m !== 0) d = Math.floor(d * m);
    }

    // Mod3
    const tab = this.ability(target);
    if ((tab === "solid-rock" || tab === "filter") && eff > 1) d = Math.floor((d * 3) / 4);
    if (this.item(user) === "expert-belt" && eff > 1) d = Math.floor((d * 6) / 5);
    if (user.ability === "tinted-lens" && eff < 1) d *= 2;
    if (tab === "multiscale" && target.hp === target.maxHp) d = Math.floor(d / 2);
    const tally = this.allyOf(target);
    if (tally && this.ability(tally) === "friend-guard") d = Math.floor((d * 3) / 4);
    return Math.max(1, d);
  }

  // ===============================
  // MOVE EXECUTION
  // ===============================

  runMoveAction(action) {
    const user = action.mon;
    const v = user.volatile;
    v.activeTurns = v.activeTurns ?? 0;
    delete v.grudge;

    if (action.moveId === "recharge") {
      delete v.recharge;
      this.msg(`${this.name(user, true)} must recharge!`);
      return;
    }
    if (!this.canMove(user, action)) {
      // Interrupted rampage/charge/rollout ends
      delete v.charging; delete v.rollout; delete v.furyCutter;
      if (v.rampage) delete v.rampage;
      return;
    }
    this.useMove(user, action.moveId, action.target, { fromChoice: !action.forced });
  }

  // Sleep, freeze, flinch, confusion, paralysis… Returns false if the Pokémon can't act.
  canMove(user, action) {
    const st = this.state;
    const v = user.volatile;
    const moveId = action.moveId;

    if (user.status === "slp") {
      user.statusTurns -= 1;
      if (user.statusTurns <= 0) {
        this.cureStatus(user);
      } else {
        this.log({ t: "cant", ...this.ref(user), reason: "slp", text: `${this.name(user, true)} is fast asleep.` });
        if (moveId !== "sleep-talk" && moveId !== "snore") return false;
      }
    }
    if (user.status === "frz") {
      if (THAWS_USER.has(moveId) || chance(st, 20)) {
        this.cureStatus(user);
      } else {
        this.log({ t: "cant", ...this.ref(user), reason: "frz", text: `${this.name(user, true)} is frozen solid!` });
        return false;
      }
    }
    if (user.ability === "truant" && !user.volatile.abilitySuppressed) {
      v.truant = !v.truant;
      if (!v.truant) {
        this.log({ t: "cant", ...this.ref(user), reason: "truant", text: `${this.name(user, true)} is loafing around!` });
        return false;
      }
    }
    if (v.flinch) {
      this.log({ t: "cant", ...this.ref(user), reason: "flinch", text: `${this.name(user, true)} flinched!` });
      if (user.ability === "steadfast") this.boost(user, { spe: 1 }, user);
      return false;
    }
    const move = this.move(moveId);
    if (v.taunt && move.category === "status") {
      this.log({ t: "cant", ...this.ref(user), reason: "taunt", text: `${this.name(user, true)} can't use ${move.name} after the taunt!` });
      return false;
    }
    if (v.disabled?.move === moveId) {
      this.log({ t: "cant", ...this.ref(user), reason: "disable", text: `${this.name(user, true)}'s ${move.name} is disabled!` });
      return false;
    }
    if (this.isImprisoned(user, moveId)) {
      this.log({ t: "cant", ...this.ref(user), reason: "imprison", text: `${this.name(user, true)} can't use the sealed ${move.name}!` });
      return false;
    }
    if (st.field.gravity > 0 && GRAVITY_BANNED.has(moveId)) {
      this.log({ t: "cant", ...this.ref(user), reason: "gravity", text: `${this.name(user, true)} can't use ${move.name} because of gravity!` });
      return false;
    }
    if (v.confusion) {
      v.confusion -= 1;
      if (v.confusion <= 0) {
        delete v.confusion;
        this.msg(`${this.name(user, true)} snapped out of its confusion!`);
      } else {
        this.msg(`${this.name(user, true)} is confused!`);
        if (chance(st, 50)) {
          const atk = this.attackStat(user, "atk", false, user);
          const def = this.defenseStat(user, "def", false, user);
          let d = Math.floor(Math.floor((Math.floor((2 * user.level) / 5) + 2) * 40 * atk / 50) / def) + 2;
          d = Math.floor((d * randomInt(st, 85, 100)) / 100);
          const dealt = this.applyMoveDamage(user, d);
          this.log({ t: "damage", ...this.ref(user), hp: user.hp, maxHp: user.maxHp, amount: dealt, text: "It hurt itself in its confusion!" });
          if (user.hp <= 0) this.faint(user);
          return false;
        }
      }
    }
    if (v.attract && this.item(user) === "mental-herb") {
      delete v.attract;
      this.consumeItem(user, `${this.name(user, true)} cured its infatuation using its Mental Herb!`);
    }
    if (v.attract && this.isActive(this.findMon(v.attract))) {
      this.msg(`${this.name(user, true)} is in love!`);
      if (chance(st, 50)) {
        this.log({ t: "cant", ...this.ref(user), reason: "attract", text: `${this.name(user, true)} is immobilized by love!` });
        return false;
      }
    }
    if (user.status === "par" && chance(st, 25)) {
      this.log({ t: "cant", ...this.ref(user), reason: "par", text: `${this.name(user, true)} is paralyzed! It can't move!` });
      return false;
    }
    return true;
  }

  findMon(key) {
    if (!key) return null;
    const [ti, side] = key.split(":").map(Number);
    return this.state.sides[side]?.team[ti] ?? null;
  }

  monKey(mon) { return `${mon.teamIndex}:${mon.side}`; }

  // Resolve who a move hits
  resolveTargets(user, move, chosen) {
    const foes = this.foesOf(user);
    const ally = this.allyOf(user);
    switch (move.target) {
      case "user": case "users-field": case "opponents-field": case "entire-field": case "user-and-allies":
      case "specific-move": case "all-pokemon": case "user-or-ally":
        return [user];
      case "ally": return ally ? [ally] : [];
      case "all-opponents": return foes;
      case "all-other-pokemon": return this.activeMons().filter((m) => m !== user);
      case "random-opponent": return foes.length ? [pick(this.state, foes)] : [];
      default: {
        // Single target
        let target = chosen ? this.monAt(chosen.side, chosen.slot) : null;
        if (!target || target.fainted) {
          if (chosen && chosen.side === user.side) return [];
          target = foes.length ? pick(this.state, foes) : null;
        }
        if (!target) return [];
        if (target.side !== user.side) {
          // Follow Me
          const fm = this.state.sides[target.side].conditions.followMe;
          const fmMon = fm && this.findMon(fm);
          if (fmMon && this.isActive(fmMon)) target = fmMon;
        }
        // Lightningrod / Storm Drain (Gen 5: draw in from any position)
        const type = this.moveType(user, move);
        const drawAbility = type === "electric" ? "lightning-rod" : type === "water" ? "storm-drain" : null;
        if (drawAbility && this.ability(target) !== drawAbility) {
          const drawer = this.bySpeed(this.activeMons().filter((m) => m !== user && this.ability(m) === drawAbility))[0];
          if (drawer) {
            target = drawer;
            this.msg(`${this.name(drawer, true)} took the attack!`);
          }
        }
        return [target];
      }
    }
  }

  useMove(user, moveId, chosenTarget, { fromChoice = true, calledBy = null } = {}) {
    const st = this.state;
    const v = user.volatile;
    let move = this.move(moveId);

    // PP
    if (fromChoice && moveId !== "struggle") {
      const slot = user.moves.find((m) => m.id === moveId);
      if (slot) {
        const pressure = this.foesOf(user).filter((f) => f.ability === "pressure").length;
        slot.pp = Math.max(0, slot.pp - 1 - (pressure ? 1 : 0));
      }
      if (this.item(user) in CHOICE_ITEMS) v.choiceLock = moveId;
    }

    this.log({ t: "move", ...this.ref(user), move: moveId, name: move.name, type: this.moveType(user, move),
      text: calledBy ? `${move.name}!` : `${this.name(user, true)} used ${move.name}!` });

    if (!calledBy) {
      v.lastMove = moveId;
      st.field.previousMove = st.field.lastMove ?? null; // Copycat copies this
      st.field.lastMove = moveId;
    }
    if (moveId !== "fury-cutter") delete v.furyCutter;

    // Two-turn moves
    const two = TWO_TURN[moveId];
    if (two && !v.charging && moveId === "sky-drop") {
      // Picks the target up: it can't move this turn. Fails on Flying types and heavy Pokémon.
      const t = chosenTarget && this.monAt(chosenTarget.side, chosenTarget.slot);
      if (!t || t.fainted || t.types.includes("flying") || t.weightKg >= 200 || t.volatile.substitute) { this.msg("But it failed!"); return; }
      if (!t.volatile.moved) t.volatile.flinch = true;
    }
    if (two && !v.charging) {
      const skip = (moveId === "solar-beam" && this.weather() === "sun");
      if (!skip) {
        if (moveId === "skull-bash") this.boost(user, { def: 1 }, user);
        if (this.item(user) === "power-herb") {
          this.consumeItem(user, `${this.name(user, true)} became fully charged due to its Power Herb!`);
        } else {
          v.charging = { move: moveId, target: chosenTarget, invulnerable: two.invulnerable ?? null };
          this.msg(`${this.name(user, true)} ${two.text}`);
          return;
        }
      }
    } else if (v.charging) {
      delete v.charging;
    }

    // Moves that call other moves
    if (moveId === "metronome" || moveId === "sleep-talk" || moveId === "nature-power") {
      let next;
      if (moveId === "nature-power") next = "tri-attack";
      else if (moveId === "sleep-talk") {
        if (user.status !== "slp") { this.msg("But it failed!"); return; }
        const options = user.moves.map((m) => m.id).filter((id) => id !== "sleep-talk" && !TWO_TURN[id]);
        if (!options.length) { this.msg("But it failed!"); return; }
        next = pick(st, options);
      } else {
        const banned = new Set(["metronome", "struggle", "sleep-talk", "counter", "mirror-coat", "protect", "detect",
          "endure", "focus-punch", "helping-hand", "follow-me", "transform", "mimic", "sketch", "thief", "covet",
          "trick", "switcheroo", "assist", "copycat", "me-first", "feint", "destiny-bond", "snatch"]);
        next = pick(st, Object.keys(this.data.moves).filter((k) => !banned.has(k)));
      }
      const nm = this.move(next);
      const target = ["selected-pokemon", "selected-pokemon-me-first"].includes(nm.target) ? null : chosenTarget;
      this.useMove(user, next, target, { fromChoice: false, calledBy: moveId });
      return;
    }

    let targets = this.resolveTargets(user, move, chosenTarget);
    if (!targets.length) {
      this.msg("But there was no target...");
      return;
    }

    // Wide Guard / Quick Guard
    targets = this.applyGuards(user, move, targets);
    if (!targets.length) return;

    // Snatch: another Pokémon steals a self-targeted status move
    if (move.category === "status" && this.trySnatch(user, move)) return;

    // Future Sight / Doom Desire: hits two turns later
    if (moveId === "future-sight" || moveId === "doom-desire") { this.scheduleFutureAttack(user, move, targets[0]); return; }

    const moldBreaker = ["mold-breaker", "turboblaze", "teravolt"].includes(user.ability) && !v.abilitySuppressed;
    this.currentMove = { user, move, moldBreaker };
    try {
      if (move.category === "status") this.runStatusMove(user, move, targets, chosenTarget);
      else this.runDamagingMove(user, move, targets);
    } finally {
      this.currentMove = null;
    }

    // Locks after the move
    if (RAMPAGE.has(moveId)) {
      if (!v.rampage) v.rampage = { move: moveId, turns: randomInt(st, 2, 3) };
      v.rampage.turns -= 1;
      if (v.rampage.turns <= 0) {
        delete v.rampage;
        if (!user.fainted) this.tryConfuse(user, user);
      }
    }
  }

  // Gen 4 rules: the damage is worked out now (typeless: no STAB, no type effectiveness, so even
  // Dark types are hit by Future Sight) and dealt at the end of the 2nd turn after this one.
  // The target is whoever stands in that slot by then.
  scheduleFutureAttack(user, move, target) {
    const side = this.state.sides[target.side];
    const slot = this.slotOf(target);
    side.future ??= {};
    if (side.future[slot]) { this.msg("But it failed!"); return; }
    if (!chance(this.state, move.accuracy ?? 100)) { this.msg(`${this.name(user, true)}'s attack missed!`); return; }
    const damage = this.calcDamage(user, target, move, { type: "???", crit: false, spread: false, roll: randomInt(this.state, 85, 100) });
    side.future[slot] = { turns: 3, damage, move: move.key, name: move.name, user: user.name };
    this.msg(move.key === "doom-desire" ? `${this.name(user, true)} chose Doom Desire as its destiny!` : `${this.name(user, true)} foresaw an attack!`);
  }

  resolveFutureAttack(side, slot, hit) {
    const target = this.monAt(side.index, slot);
    if (!target || target.fainted) return;
    this.msg(`${target.name} took the ${hit.name} attack!`);
    const dealt = this.applyMoveDamage(target, hit.damage);
    this.log({ t: "damage", ...this.ref(target), hp: target.hp, maxHp: target.maxHp, amount: dealt, crit: false, effectiveness: 1, move: hit.move, text: "" });
    if (target.hp <= 0) this.faint(target);
    else this.checkHpBerries(target);
  }

  // ---------- Status moves ----------

  runStatusMove(user, move, targets, chosenTarget) {
    const key = move.key;
    const special = STATUS_MOVES[key];
    if (this.reflectField(user, move)) return;
    if (special) {
      if (targets[0] && this.reflectedByCoat(user, move, targets[0])) return;
      special.call(this, user, move, targets, chosenTarget);
      return;
    }
    const meta = move.meta ?? {};
    const isSelf = ["user", "user-and-allies", "users-field"].includes(move.target);

    if (meta.category === "heal") {
      let frac = (meta.healing || 50) / 100;
      if (WEATHER_HEAL.has(key)) {
        const w = this.weather();
        frac = w === "sun" ? 2 / 3 : w ? 1 / 4 : 1 / 2;
      }
      if (user.hp >= user.maxHp) { this.msg(`${this.name(user, true)}'s HP is full!`); return; }
      this.heal(user, Math.ceil(user.maxHp * frac), `${this.name(user, true)} regained health!`);
      return;
    }

    if (isSelf) {
      const affected = move.target === "user-and-allies" ? [user, this.allyOf(user)].filter(Boolean) : [user];
      for (const t of affected) {
        if (move.statChanges.length) this.boost(t, this.changesObj(move), user, { statusMove: true });
      }
      if (key === "defense-curl") user.volatile.defenseCurl = true;
      if (key === "minimize") user.volatile.minimize = true;
      if (!move.statChanges.length && meta.category !== "net-good-stats") this.notImplemented(move);
      return;
    }

    for (const target of targets) {
      if (target.fainted) continue;
      if (this.reflectedByCoat(user, move, target)) continue;
      if (!this.checkProtectAndHit(user, move, target)) continue;
      if (target !== user && SOUND.has(key) && this.ability(target) === "soundproof") {
        this.msg(`${this.name(target, true)}'s Soundproof blocks it!`);
        continue;
      }
      // Magic Bounce reflects status moves
      if (target !== user && this.ability(target) === "magic-bounce" && !user.volatile.bounced) {
        this.msg(`${this.name(target, true)} bounced the ${move.name} back!`);
        user.volatile.bounced = true;
        this.runStatusMove(target, move, [user], null);
        delete user.volatile.bounced;
        continue;
      }
      if (target.volatile.substitute && target !== user && meta.category !== "net-good-stats") {
        this.msg("But it failed!");
        continue;
      }
      if (meta.category === "ailment" || meta.category === "swagger") {
        if (meta.category === "swagger") this.boost(target, this.changesObj(move), user);
        this.applyAilment(user, target, move, { statusMove: true });
      } else if (meta.category === "net-good-stats") {
        if (target.volatile.substitute && target !== user) { this.msg("But it failed!"); continue; }
        this.boost(target, this.changesObj(move), user, { statusMove: true });
      } else {
        this.notImplemented(move);
      }
    }
  }

  // Wide Guard blocks multi-target moves, Quick Guard blocks priority moves, for the Pokémon on their side
  applyGuards(user, move, targets) {
    const spread = ["all-opponents", "all-other-pokemon"].includes(move.target);
    return targets.filter((t) => {
      const c = this.state.sides[t.side].conditions;
      if (spread && c.wideGuard) { this.msg(`Wide Guard protected ${this.name(t)}!`); return false; }
      if (move.priority > 0 && t.side !== user.side && c.quickGuard) { this.msg(`Quick Guard protected ${this.name(t)}!`); return false; }
      return true;
    });
  }

  // Magic Coat: the first status move aimed at the holder this turn goes back to the user
  reflectedByCoat(user, move, target) {
    if (this.reflecting || target === user || !target.volatile.magicCoat) return false;
    if (!REFLECT_TARGETS.has(move.target) || REFLECT_BANNED.has(move.key)) return false;
    target.volatile.magicCoat = false;
    this.msg(`${this.name(target, true)}'s Magic Coat bounced ${move.name} back!`);
    this.reflecting = true;
    try { this.runStatusMove(target, move, [user], null); } finally { this.reflecting = false; }
    return true;
  }

  // Same for hazards (Spikes…) aimed at the foe's whole side
  reflectField(user, move) {
    if (this.reflecting || move.target !== "opponents-field" || REFLECT_BANNED.has(move.key)) return false;
    const coat = this.foesOf(user).find((f) => f.volatile.magicCoat);
    if (!coat) return false;
    coat.volatile.magicCoat = false;
    this.msg(`${this.name(coat, true)}'s Magic Coat bounced ${move.name} back!`);
    this.reflecting = true;
    try { this.runStatusMove(coat, move, [coat], null); } finally { this.reflecting = false; }
    return true;
  }

  // Snatch: the fastest waiting Pokémon uses the move instead
  trySnatch(user, move) {
    if (this.reflecting || !SNATCH_TARGETS.has(move.target) || SNATCH_BANNED.has(move.key) || move.key === "magic-coat") return false;
    const thief = this.bySpeed(this.activeMons().filter((m) => m !== user && m.volatile.snatch))[0];
    if (!thief) return false;
    thief.volatile.snatch = false;
    this.msg(`${this.name(thief, true)} snatched ${this.name(user)}'s move!`);
    this.runStatusMove(thief, move, this.resolveTargets(thief, move, null), null);
    return true;
  }

  // Mud Sport / Water Sport last while their user is in battle
  sportActive(key) {
    const k = this.state.field[key];
    return !!k && this.isActive(this.findMon(k));
  }

  // Abilities that react to being hit (the target is still standing)
  hitAbilities(user, target, move, type, crit) {
    const ab = this.ability(target);
    if (!ab) return;
    if (ab === "weak-armor" && move.category === "physical") {
      this.msg(`${this.name(target, true)}'s Weak Armor!`);
      this.boost(target, { def: -1, spe: 1 }, target);
    }
    if (ab === "justified" && type === "dark") this.boost(target, { atk: 1 }, target);
    if (ab === "rattled" && ["bug", "ghost", "dark"].includes(type)) this.boost(target, { spe: 1 }, target);
    if (ab === "anger-point" && crit && target.boosts.atk < 6) {
      target.boosts.atk = 6;
      this.msg(`${this.name(target, true)} maxed its Attack!`);
    }
  }

  // Pledge moves: used right after an ally's different Pledge move they combine (150 power + a side effect)
  pledgeStep(user, key) {
    const st = this.state;
    const f = st.field.pledge;
    if (f && f.turn === st.turn && f.side === user.side && f.key !== key) {
      delete st.field.pledge;
      user.volatile.pledgeCombo = [f.key, key].sort().join("+");
      return "combo";
    }
    const ally = this.allyOf(user);
    const next = ally && !ally.volatile.moved ? ally.volatile.pendingMove : null;
    if (next && PLEDGE.has(next) && next !== key) {
      st.field.pledge = { turn: st.turn, side: user.side, key };
      this.msg(`${this.name(user, true)} is waiting for ${this.name(ally)}'s move...`);
      return "wait";
    }
    return "normal";
  }

  pledgeEffect(user, combo) {
    const mine = this.state.sides[user.side].conditions;
    const theirs = this.state.sides[1 - user.side].conditions;
    if (combo === "fire-pledge+water-pledge") { mine.rainbow = 4; this.msg("A rainbow appeared in the sky on your side!"); }
    else if (combo === "fire-pledge+grass-pledge") { theirs.seaOfFire = 4; this.msg("A sea of fire enveloped the opposing side!"); }
    else if (combo === "grass-pledge+water-pledge") { theirs.swamp = 4; this.msg("A swamp enveloped the opposing side!"); }
  }

  // The Pokémon is replaced by a random one from its team (Dragon Tail, Circle Throw, Roar…)
  dragOut(target) {
    if (target.fainted || this.ability(target) === "suction-cups" || target.volatile.ingrain) {
      if (!target.fainted) this.msg(`${this.name(target, true)} anchored itself!`);
      return false;
    }
    const bench = this.bench(target.side);
    if (!bench.length) return false;
    return this.doSwitch(target.side, this.slotOf(target), pick(this.state, bench).teamIndex);
  }

  // Skill Swap, Entrainment, Mummy…: the old Ability comes back when the Pokémon leaves the field
  setAbility(mon, ability) {
    if (!mon.volatile.transformed) mon.volatile.originalAbility ??= mon.ability;
    mon.ability = ability;
  }

  changesObj(move) {
    return Object.fromEntries(move.statChanges.map((s) => [s.stat, s.change]));
  }

  notImplemented(move) {
    this.log({ t: "msg", text: "But nothing happened!", notImplemented: move.key });
  }

  // Protect, semi-invulnerability, accuracy and immunities. Returns true if the move connects.
  checkProtectAndHit(user, move, target, { type } = {}) {
    const st = this.state;
    if (target === user) return true;
    if (target.volatile.protect && move.key !== "feint" && !["ally"].includes(move.target)) {
      this.log({ t: "protected", ...this.ref(target), text: `${this.name(target, true)} protected itself!` });
      return false;
    }
    const inv = target.volatile.charging?.invulnerable;
    if (inv && !(move.key in HITS_INVULNERABLE[inv]) && user.ability !== "no-guard" && target.ability !== "no-guard") {
      this.log({ t: "miss", ...this.ref(target), text: `${this.name(target, true)} avoided the attack!` });
      return false;
    }

    // Absorbing abilities (checked before type immunity, so a Ground-type Lightning Rod still gets its boost)
    const mType = type ?? this.moveType(user, move);
    const tab = this.ability(target);
    const absorb = { "volt-absorb": "electric", "water-absorb": "water", "dry-skin": "water", "motor-drive": "electric",
      "flash-fire": "fire", "lightning-rod": "electric", "storm-drain": "water", "sap-sipper": "grass" }[tab];
    if (absorb === mType && move.target !== "all-pokemon") {
      this.log({ t: "ability", ...this.ref(target), ability: tab, text: `${this.name(target, true)}'s ${this.data.abilities[tab].name}!` });
      if (tab === "volt-absorb" || tab === "water-absorb" || tab === "dry-skin") {
        if (!this.heal(target, target.maxHp / 4, `${this.name(target, true)} restored HP!`)) this.msg("It doesn't affect it...");
      } else if (tab === "motor-drive") this.boost(target, { spe: 1 }, target);
      else if (tab === "lightning-rod" || tab === "storm-drain") this.boost(target, { spa: 1 }, target);
      else if (tab === "sap-sipper") this.boost(target, { atk: 1 }, target);
      else if (tab === "flash-fire") { target.volatile.flashFire = true; this.msg(`The power of ${this.name(target)}'s Fire-type moves rose!`); }
      return false;
    }
    // Type immunity for damaging moves (and Thunder Wave)
    if (move.category !== "status" || move.key === "thunder-wave") {
      if (this.effectiveness(mType, target) === 0) {
        this.log({ t: "immune", ...this.ref(target), text: `It doesn't affect ${this.name(target)}...` });
        return false;
      }
    }
    if (tab === "wonder-guard" && move.category !== "status" && this.effectiveness(mType, target) <= 1 && mType !== "???") {
      this.msg(`${this.name(target, true)} avoided damage with Wonder Guard!`);
      return false;
    }

    // Accuracy
    if (move.meta?.category === "ohko") {
      if (target.level > user.level || this.ability(target) === "sturdy") {
        this.msg(this.ability(target) === "sturdy" ? `${this.name(target, true)} was protected by Sturdy!` : "But it failed!");
        return false;
      }
      if (!chance(st, 30 + user.level - target.level)) {
        this.log({ t: "miss", ...this.ref(target), text: `${this.name(user, true)}'s attack missed!` });
        return false;
      }
      return true;
    }
    let acc = move.accuracy;
    const w = this.weather();
    if (move.key === "thunder") acc = w === "rain" ? null : w === "sun" ? 50 : acc;
    if (move.key === "blizzard" && w === "hail") acc = null;
    if (acc === null || acc === undefined) return true;
    if (user.ability === "no-guard" || tab === "no-guard" || target.volatile.lockedOnBy === this.monKey(user) || target.volatile.telekinesis > 0) return true;

    let accStage = user.boosts.accuracy;
    let evaStage = target.boosts.evasion;
    if (this.ability(target) === "unaware") accStage = 0;
    if (user.ability === "unaware" || target.volatile.foresight || target.volatile.miracleEye) evaStage = Math.min(0, evaStage);
    let a = acc * accuracyStageMultiplier(accStage - evaStage);
    if (st.field.gravity > 0) a *= 5 / 3;
    if ([user, this.allyOf(user)].some((m) => m && m.ability === "victory-star")) a *= 1.1;
    if (user.ability === "compound-eyes") a *= 1.3;
    if (user.ability === "hustle" && move.category === "physical") a *= 0.8;
    const item = this.item(user);
    if (item === "wide-lens") a *= 1.1;
    if (item === "zoom-lens" && target.volatile.moved) a *= 1.2;
    if (tab === "sand-veil" && w === "sand") a *= 0.8;
    if (tab === "snow-cloak" && w === "hail") a *= 0.8;
    if (tab === "tangled-feet" && target.volatile.confusion) a *= 0.5;
    const titem = this.item(target);
    if (titem === "bright-powder" || titem === "lax-incense") a *= 0.9;
    if (!chance(st, a)) {
      this.log({ t: "miss", ...this.ref(target), text: `${this.name(user, true)}'s attack missed!` });
      return false;
    }
    return true;
  }

  // ---------- Damaging moves ----------

  runDamagingMove(user, move, targets) {
    const st = this.state;
    const key = move.key;
    const type = this.moveType(user, move);

    // Moves with conditions before hitting
    if (key === "fake-out" && user.volatile.activeTurns > 0) { this.msg("But it failed!"); return; }
    if (key === "focus-punch" && user.volatile.hurtThisTurn) {
      this.msg(`${this.name(user, true)} lost its focus and couldn't move!`);
      return;
    }
    if (key === "sucker-punch") {
      const t = targets[0];
      const act = t && this.turnOrder?.includes(t) && !t.volatile.moved;
      const tMove = t?.volatile.pendingMove && this.move(t.volatile.pendingMove);
      if (!act || !tMove || tMove.category === "status") { this.msg("But it failed!"); return; }
    }
    const t0 = targets[0];
    if ((key === "dream-eater" && t0?.status !== "slp") || (key === "snore" && user.status !== "slp")
      || (key === "spit-up" && !user.volatile.stockpile) || ["fling", "natural-gift", "bide"].includes(key)) {
      this.msg("But it failed!");
      return;
    }
    if (key === "brick-break" && t0 && t0.side !== user.side) {
      const c = this.state.sides[t0.side].conditions;
      if (c.reflect || c.lightScreen) {
        delete c.reflect; delete c.lightScreen;
        this.msg("It shattered the barrier!");
      }
    }
    if ((key === "self-destruct" || key === "explosion")
      && this.activeMons().some((m) => this.ability(m) === "damp")) {
      this.msg("Damp prevents the explosion!");
      return;
    }
    if (key === "magnitude") {
      const r = randomInt(st, 1, 100);
      const [lvl, bp] = r <= 5 ? [4, 10] : r <= 15 ? [5, 30] : r <= 35 ? [6, 50] : r <= 65 ? [7, 70] : r <= 85 ? [8, 90] : r <= 95 ? [9, 110] : [10, 150];
      user.volatile.magnitude = bp;
      this.msg(`Magnitude ${lvl}!`);
    }
    if (key === "present") {
      const r = randomInt(st, 1, 100);
      if (r <= 20) {
        for (const t of targets) this.heal(t, t.maxHp / 4, `${this.name(t, true)} regained health!`);
        return;
      }
      user.volatile.present = r <= 60 ? 40 : r <= 90 ? 80 : 120;
    }

    // Moves whose power depends on earlier uses
    if (key === "echoed-voice") {
      const e = st.field.echo;
      const count = e && e.turn === st.turn ? e.count : e && e.turn === st.turn - 1 ? Math.min(5, e.count + 1) : 1;
      st.field.echo = { turn: st.turn, count };
      st.field.echoCount = count;
    }
    if (PLEDGE.has(key) && this.pledgeStep(user, key) === "wait") return;

    const spread = targets.length > 1;
    let totalDealt = 0;
    let anyHit = false;
    const sheerForce = user.ability === "sheer-force" && !user.volatile.abilitySuppressed && this.hasSecondary(move);

    for (const target of targets) {
      if (target.fainted || user.fainted) continue;
      // Synchronoise only hits Pokémon that share a type with the user
      if (key === "synchronoise" && !target.types.some((t) => user.types.includes(t))) {
        this.log({ t: "immune", ...this.ref(target), text: `It doesn't affect ${this.name(target)}...` });
        continue;
      }
      if (!this.checkProtectAndHit(user, move, target, { type })) continue;
      if (key === "feint" && target.volatile.protect) {
        target.volatile.protect = false;
        this.msg(`${this.name(target, true)} fell for the feint!`);
      }
      anyHit = true;

      const fixed = this.fixedDamage(user, target, move);
      if (fixed === false) continue;

      const hits = this.hitCount(user, move);
      let dealtToTarget = 0;
      let hitsLanded = 0;
      for (let h = 1; h <= hits; h++) {
        if (target.fainted || user.fainted) break;
        user.volatile.hitNumber = h;
        const crit = fixed === null && !["battle-armor", "shell-armor"].includes(this.ability(target))
          && !this.state.sides[target.side].conditions.luckyChant
          && (ALWAYS_CRIT.has(key) || nextRandom(st) < CRIT_CHANCE[this.critStage(user, move)]);
        let dmg = fixed ?? this.calcDamage(user, target, move, { type, crit, spread, roll: randomInt(st, 85, 100) });

        // Resist berries
        const eff = this.effectiveness(type, target);
        const rb = RESIST_BERRIES[this.item(target)];
        if (fixed === null && rb === type && (eff > 1 || type === "normal")) {
          dmg = Math.floor(dmg / 2);
          this.consumeItem(target, `The ${this.itemName(target.item)} weakened the damage to ${this.name(target)}!`);
        }

        // Substitute
        if (target.volatile.substitute && !SOUND.has(key)) {
          const sub = target.volatile.substitute;
          const taken = Math.min(sub, dmg);
          target.volatile.substitute = sub - taken;
          this.log({ t: "substitute", ...this.ref(target), text: "The substitute took damage for it!" });
          if (target.volatile.substitute <= 0) {
            delete target.volatile.substitute;
            this.msg(`${this.name(target, true)}'s substitute faded!`);
          }
          dealtToTarget += taken;
          hitsLanded++;
          continue;
        }

        // Survive at 1 HP
        if (dmg >= target.hp) {
          const tab = this.ability(target);
          if (key === "false-swipe") dmg = target.hp - 1;
          else if (target.volatile.endure) { dmg = target.hp - 1; this.msg(`${this.name(target, true)} endured the hit!`); }
          else if (tab === "sturdy" && target.hp === target.maxHp) {
            dmg = target.hp - 1;
            this.msg(`${this.name(target, true)} endured the hit with Sturdy!`);
          } else if (this.item(target) === "focus-sash" && target.hp === target.maxHp) {
            dmg = target.hp - 1;
            this.consumeItem(target, `${this.name(target, true)} hung on using its Focus Sash!`);
          } else if (this.item(target) === "focus-band" && chance(st, 10)) {
            dmg = target.hp - 1;
            this.msg(`${this.name(target, true)} hung on using its Focus Band!`);
          }
        }

        const dealt = this.applyMoveDamage(target, dmg);
        dealtToTarget += dealt;
        hitsLanded++;
        target.volatile.hurtThisTurn = true;
        target.volatile.lastHitType = type;
        target.volatile.lastDamage = { amount: dealt, category: move.category, by: this.monKey(user), side: user.side, slot: this.slotOf(user) };
        (target.volatile.damagedBy ??= []).push({ side: user.side, teamIndex: user.teamIndex });
        this.log({ t: "damage", ...this.ref(target), hp: target.hp, maxHp: target.maxHp, amount: dealt, crit,
          effectiveness: fixed === null ? eff : 1, move: key, text: crit ? "A critical hit!" : "" });
        if (hits === 1) this.logEffectiveness(target, eff, fixed);

        if (target.hp > 0) this.hitAbilities(user, target, move, type, crit);
        if (target.hp <= 0) {
          if (target.volatile.grudge) {
            const slotUsed = user.moves.find((m) => m.id === key);
            if (slotUsed) {
              slotUsed.pp = 0;
              this.msg(`${this.name(user, true)}'s ${move.name} lost all its PP due to the grudge!`);
            }
          }
          if (target.volatile.destinyBond) {
            this.msg(`${this.name(target, true)} took its attacker down with it!`);
            this.faint(user);
          }
          if (makesContact(move) && this.ability(target) === "aftermath" && !user.fainted) {
            this.indirectDamage(user, Math.floor(user.maxHp / 4), `${this.name(user, true)} was caught in the aftermath!`);
          }
          this.faint(target);
          if (user.ability === "moxie" && !user.fainted && !user.volatile.abilitySuppressed) this.boost(user, { atk: 1 }, user);
        } else {
          if (makesContact(move)) this.contactEffects(user, target);
          if (!sheerForce) this.secondaryEffects(user, target, move, dealt);
          if (target.status === "frz" && type === "fire") this.cureStatus(target);
          this.checkHpBerries(target);
        }
        if (key === "wake-up-slap" && target.status === "slp") this.cureStatus(target);
        if (key === "smelling-salts" && target.status === "par") this.cureStatus(target);
      }
      if (hits > 1 && hitsLanded) {
        this.logEffectiveness(target, this.effectiveness(type, target), fixed);
        this.msg(`Hit ${hitsLanded} time(s)!`);
      }
      totalDealt += dealtToTarget;

      if (hitsLanded && !target.fainted) {
        if (key === "smack-down") {
          target.volatile.smackedDown = true;
          delete target.volatile.magnetRise; delete target.volatile.telekinesis;
          if (target.volatile.charging?.invulnerable === "air") delete target.volatile.charging;
          this.msg(`${this.name(target, true)} fell straight down!`);
        }
        if (key === "flame-burst") {
          const next = this.allyOf(target);
          if (next) this.indirectDamage(next, Math.max(1, Math.floor(next.maxHp / 16)), `${this.name(next, true)} was hurt by the bursting flame!`);
        }
        if (key === "clear-smog" && !target.volatile.substitute) {
          target.boosts = emptyBoosts();
          this.msg(`${this.name(target, true)}'s stat changes were removed!`);
        }
        if (key === "incinerate" && target.item && isBerry(target.item) && this.ability(target) !== "sticky-hold") {
          this.msg(`${this.name(target, true)}'s ${this.itemName(target.item)} was burned up!`);
          target.item = null;
        }
        if ((key === "dragon-tail" || key === "circle-throw") && !user.fainted) this.dragOut(target);
      }

      // Effects that happen once per target, after all hits
      if (dealtToTarget > 0 && !user.fainted) {
        if (move.meta?.drain > 0) {
          let heal = Math.floor((dealtToTarget * move.meta.drain) / 100);
          if (this.item(user) === "big-root") heal = Math.floor(heal * 1.3);
          if (this.ability(target) === "liquid-ooze") {
            this.indirectDamage(user, heal, `${this.name(user, true)} sucked up the liquid ooze!`);
          } else {
            this.heal(user, heal, `${this.name(target, true)} had its energy drained!`);
          }
        }
        if (key === "knock-off" && target.item && this.ability(target) !== "sticky-hold") {
          const item = target.item;
          target.item = null;
          this.msg(`${this.name(user, true)} knocked off ${this.name(target)}'s ${this.itemName(item)}!`);
        }
        if ((key === "thief" || key === "covet") && !user.item && target.item && this.ability(target) !== "sticky-hold") {
          user.item = target.item;
          target.item = null;
          this.msg(`${this.name(user, true)} stole ${this.name(target)}'s ${this.itemName(user.item)}!`);
        }
      }
    }

    if (!anyHit) {
      delete user.volatile.rollout;
      if (key === "jump-kick" || key === "hi-jump-kick") {
        this.indirectDamage(user, Math.floor(user.maxHp / 2), `${this.name(user, true)} kept going and crashed!`);
      }
    }

    // Recoil (once, from total damage)
    if (totalDealt > 0 && !user.fainted) {
      const rockHead = user.ability === "rock-head" && !user.volatile.abilitySuppressed;
      if (key === "struggle") {
        this.indirectDamage(user, Math.floor(user.maxHp / 4), `${this.name(user, true)} is damaged by recoil!`, { recoil: true });
      } else if (move.meta?.drain < 0 && !rockHead) {
        this.indirectDamage(user, Math.max(1, Math.floor((totalDealt * -move.meta.drain) / 100)), `${this.name(user, true)} is damaged by recoil!`, { recoil: true });
      }
      if (this.item(user) === "life-orb" && !sheerForce && !user.fainted) {
        this.indirectDamage(user, Math.floor(user.maxHp / 10), `${this.name(user, true)} lost some of its HP!`, { recoil: true });
      }
      if (this.item(user) === "shell-bell" && !user.fainted) {
        this.heal(user, Math.floor(totalDealt / 8), `${this.name(user, true)} restored a little HP using its Shell Bell!`);
      }
    }

    // User faints / needs to recharge / switches
    if (key === "self-destruct" || key === "explosion" || key === "memento" || (key === "final-gambit" && anyHit)) this.faint(user);
    if (user.volatile.pledgeCombo && anyHit) this.pledgeEffect(user, user.volatile.pledgeCombo);
    delete user.volatile.pledgeCombo;
    if (key === "round") st.field.roundTurn = st.turn;
    if (key === "fusion-flare" || key === "fusion-bolt") st.field.fusion = { turn: st.turn, key };
    if (RECHARGE.has(key) && anyHit && !user.fainted) user.volatile.recharge = true;
    if ((key === "rollout" || key === "ice-ball") && anyHit && !user.fainted) {
      const r = user.volatile.rollout ?? { move: key, count: 0, target: targets[0] && this.ref(targets[0]) };
      r.count += 1;
      if (r.count >= 5) delete user.volatile.rollout;
      else user.volatile.rollout = r;
    }
    if (key === "fury-cutter" && anyHit) user.volatile.furyCutter = Math.min(4, (user.volatile.furyCutter ?? 0) + 1);
    if (key === "rapid-spin" && anyHit && !user.fainted) {
      const c = this.state.sides[user.side].conditions;
      delete c.spikes; delete c.toxicSpikes; delete c.stealthRock;
      delete user.volatile.leechSeed; delete user.volatile.trapped;
    }
    if ((key === "u-turn" || key === "volt-switch") && anyHit && !user.fainted) this.autoSwitch(user);
    if (key === "spit-up") delete user.volatile.stockpile;
    delete user.volatile.magnitude;
    delete user.volatile.present;
    delete user.volatile.hitNumber;
  }

  logEffectiveness(target, eff, fixed) {
    if (fixed !== null) return;
    if (eff > 1) this.log({ t: "effective", ...this.ref(target), effectiveness: eff, text: "It's super effective!" });
    else if (eff < 1) this.log({ t: "effective", ...this.ref(target), effectiveness: eff, text: "It's not very effective..." });
  }

  // Fixed damage moves. Returns a number, null (normal calc), or false (failed).
  fixedDamage(user, target, move) {
    const st = this.state;
    switch (move.key) {
      case "seismic-toss": case "night-shade": return user.level;
      case "dragon-rage": return 40;
      case "sonic-boom": return 20;
      case "super-fang": return Math.max(1, Math.floor(target.hp / 2));
      case "final-gambit": return Math.max(1, user.hp);
      case "psywave": return Math.max(1, Math.floor((user.level * randomInt(st, 50, 150)) / 100));
      case "endeavor":
        if (target.hp <= user.hp) { this.msg("But it failed!"); return false; }
        return target.hp - user.hp;
      case "counter": case "mirror-coat": case "metal-burst": {
        const last = user.volatile.lastDamage;
        const want = move.key === "counter" ? "physical" : move.key === "mirror-coat" ? "special" : null;
        if (!last || (want && last.category !== want)) { this.msg("But it failed!"); return false; }
        return Math.floor(last.amount * (move.key === "metal-burst" ? 1.5 : 2));
      }
      default:
        if (move.meta?.category === "ohko") return target.hp;
        return null;
    }
  }

  hitCount(user, move) {
    const meta = move.meta;
    if (move.key === "triple-kick") return 3;
    if (!meta?.minHits) return 1;
    if (meta.minHits === meta.maxHits) return meta.minHits;
    if (user.ability === "skill-link") return meta.maxHits;
    const r = randomInt(this.state, 1, 8); // 2: 3/8, 3: 3/8, 4: 1/8, 5: 1/8
    return r <= 3 ? 2 : r <= 6 ? 3 : r === 7 ? 4 : 5;
  }

  contactEffects(user, target) {
    const st = this.state;
    const tab = this.ability(target);
    if (user.fainted) return;
    if (tab === "static" && chance(st, 30)) this.trySetStatus(user, "par", target);
    else if (tab === "flame-body" && chance(st, 30)) this.trySetStatus(user, "brn", target);
    else if (tab === "poison-point" && chance(st, 30)) this.trySetStatus(user, "psn", target);
    else if (tab === "rough-skin") this.indirectDamage(user, Math.floor(user.maxHp / 8), `${this.name(user, true)} was hurt by Rough Skin!`);
    else if (tab === "iron-barbs") this.indirectDamage(user, Math.floor(user.maxHp / 8), `${this.name(user, true)} was hurt by Iron Barbs!`);
    else if (tab === "mummy" && !["mummy", "multitype", "wonder-guard"].includes(user.ability)) {
      this.setAbility(user, "mummy");
      this.msg(`${this.name(user, true)}'s Ability became Mummy!`);
    } else if (tab === "effect-spore" && chance(st, 30)) this.trySetStatus(user, pick(st, ["psn", "par", "slp"]), target);
    else if (tab === "cute-charm" && chance(st, 30) && user.gender && target.gender && user.gender !== target.gender && !user.volatile.attract) {
      user.volatile.attract = this.monKey(target);
      this.msg(`${this.name(user, true)} fell in love!`);
    } else if (tab === "cursed-body" && chance(st, 30)) {
      user.volatile.disabled = { move: user.volatile.lastMove, turns: 4 };
      this.msg(`${this.name(user, true)}'s ${this.move(user.volatile.lastMove)?.name} was disabled!`);
    }
    if (target.item === "sticky-barb" && !user.item) {
      user.item = "sticky-barb";
      target.item = null;
    }
    if (user.ability === "poison-touch" && chance(st, 30)) this.trySetStatus(target, "psn", user);
  }

  secondaryEffects(user, target, move, dealt) {
    const st = this.state;
    const meta = move.meta;
    if (!meta) return;
    const serene = (user.ability === "serene-grace" ? 2 : 1) * (this.state.sides[user.side].conditions.rainbow ? 2 : 1);
    const shieldDust = this.ability(target) === "shield-dust";

    if (meta.category === "damage-ailment" && meta.ailmentChance > 0 && !shieldDust) {
      if (chance(st, meta.ailmentChance * serene)) this.applyAilment(user, target, move, {});
    }
    if (user.ability === "stench" && !meta.flinchChance && !shieldDust && chance(st, 10)) this.flinch(target);
    if (meta.flinchChance > 0 && !shieldDust) {
      if (chance(st, meta.flinchChance * serene)) this.flinch(target);
    } else if (["kings-rock", "razor-fang"].includes(this.item(user)) && !shieldDust && chance(st, 10)) {
      this.flinch(target);
    }
    if (move.statChanges.length && meta.statChance > 0) {
      if (meta.category === "damage-raise") {
        if (chance(st, meta.statChance * (meta.statChance < 100 ? serene : 1))) this.boost(user, this.changesObj(move), user);
      } else if (meta.category === "damage-lower" && !shieldDust) {
        if (chance(st, meta.statChance * serene)) this.boost(target, this.changesObj(move), user);
      }
    }
  }

  flinch(target) {
    if (target.volatile.moved || this.ability(target) === "inner-focus") return;
    target.volatile.flinch = true;
  }

  // Apply a move's ailment (status or volatile)
  applyAilment(user, target, move, { statusMove }) {
    const st = this.state;
    const a = move.meta.ailment;
    switch (a) {
      case "burn": return this.trySetStatus(target, "brn", user, { fromMove: true, statusMove });
      case "paralysis": return this.trySetStatus(target, "par", user, { fromMove: true, statusMove });
      case "freeze": return this.trySetStatus(target, "frz", user, { fromMove: true, statusMove });
      case "sleep": return this.trySetStatus(target, "slp", user, { fromMove: true, statusMove });
      case "poison":
        return this.trySetStatus(target, move.key === "toxic" || move.key === "poison-fang" ? "tox" : "psn", user, { fromMove: true, statusMove });
      case "unknown": // Tri Attack
        return this.trySetStatus(target, pick(st, ["brn", "par", "frz"]), user, { fromMove: true });
      case "confusion": return this.tryConfuse(target, user, { statusMove });
      case "trap":
        if (!target.volatile.trapped) {
          const turns = this.item(user) === "grip-claw" ? 5 : randomInt(st, 2, 5);
          target.volatile.trapped = { by: this.monKey(user), turns, move: move.name };
          this.msg(`${this.name(target, true)} was trapped by ${move.name}!`);
        }
        return true;
      case "yawn":
        if (target.status || target.volatile.yawn) { this.msg("But it failed!"); return false; }
        target.volatile.yawn = 2;
        this.msg(`${this.name(user, true)} made ${this.name(target)} drowsy!`);
        return true;
      case "leech-seed":
        if (target.types.includes("grass") || target.volatile.leechSeed) {
          this.msg(`${this.name(target, true)} evaded the attack!`);
          return false;
        }
        target.volatile.leechSeed = { side: user.side, slot: this.slotOf(user) };
        this.msg(`${this.name(target, true)} was seeded!`);
        return true;
      case "infatuation":
        if (!user.gender || !target.gender || user.gender === target.gender || target.volatile.attract
          || this.ability(target) === "oblivious") { this.msg("But it failed!"); return false; }
        target.volatile.attract = this.monKey(user);
        this.msg(`${this.name(target, true)} fell in love!`);
        return true;
      case "disable": {
        const last = target.volatile.lastMove;
        if (!last || target.volatile.disabled) { this.msg("But it failed!"); return false; }
        target.volatile.disabled = { move: last, turns: randomInt(st, 4, 7) };
        this.msg(`${this.name(target, true)}'s ${this.move(last).name} was disabled!`);
        return true;
      }
      case "torment":
        target.volatile.torment = true;
        this.msg(`${this.name(target, true)} was subjected to torment!`);
        return true;
      case "nightmare":
        if (target.status !== "slp") { this.msg("But it failed!"); return false; }
        target.volatile.nightmare = true;
        this.msg(`${this.name(target, true)} began having a nightmare!`);
        return true;
      case "perish-song":
        for (const m of this.activeMons()) {
          if (m.volatile.perish === undefined && this.ability(m) !== "soundproof") m.volatile.perish = 3;
        }
        this.msg("All Pokémon hearing the song will faint in three turns!");
        return true;
      case "ingrain":
        user.volatile.ingrain = true;
        this.msg(`${this.name(user, true)} planted its roots!`);
        return true;
      case "embargo":
        target.volatile.embargo = 5;
        this.msg(`${this.name(target, true)} can't use items anymore!`);
        return true;
      case "heal-block":
        target.volatile.healBlock = 5;
        this.msg(`${this.name(target, true)} was prevented from healing!`);
        return true;
      case "no-type-immunity":
        if (move.key === "miracle-eye") target.volatile.miracleEye = true;
        else target.volatile.foresight = true;
        this.msg(`${this.name(user, true)} identified ${this.name(target)}!`);
        return true;
      default:
        this.notImplemented(move);
        return false;
    }
  }

  // U-turn / Baton Pass: switch to the next healthy Pokémon in team order
  autoSwitch(user, { batonPass = false } = {}) {
    const bench = this.bench(user.side);
    if (!bench.length) return false;
    return this.doSwitch(user.side, this.slotOf(user), bench[0].teamIndex, { batonPass });
  }

  // ===============================
  // END OF TURN
  // ===============================

  endOfTurn() {
    const st = this.state;
    const field = st.field;

    // Weather
    if (field.weather) {
      if (field.weatherTurns > 0) {
        field.weatherTurns -= 1;
        if (field.weatherTurns === 0) {
          this.log({ t: "weather", weather: null, text: WEATHER_END[field.weather] });
          field.weather = null;
        }
      }
      const w = this.weather();
      if (w === "sand" || w === "hail") {
        this.msg(w === "sand" ? "The sandstorm rages." : "Hail continues to fall.");
        for (const m of this.bySpeed(this.activeMons())) {
          const ab = this.ability(m);
          if (w === "sand" && (m.types.some((t) => ["rock", "ground", "steel"].includes(t)) || ["sand-veil", "sand-force", "sand-rush", "overcoat"].includes(ab))) continue;
          if (w === "hail" && (m.types.includes("ice") || ["snow-cloak", "ice-body", "overcoat"].includes(ab))) {
            if (ab === "ice-body") this.heal(m, m.maxHp / 16, `${this.name(m, true)}'s Ice Body restored its HP!`);
            continue;
          }
          if (m.volatile.charging?.invulnerable === "underground" || m.volatile.charging?.invulnerable === "underwater") continue;
          this.indirectDamage(m, Math.floor(m.maxHp / 16), `${this.name(m, true)} is buffeted by the ${w === "sand" ? "sandstorm" : "hail"}!`);
        }
      }
      if (w === "rain" || w === "sun") {
        for (const m of this.bySpeed(this.activeMons())) {
          const ab = this.ability(m);
          if (w === "rain" && ab === "rain-dish") this.heal(m, m.maxHp / 16, `${this.name(m, true)}'s Rain Dish restored its HP!`);
          if (w === "rain" && ab === "dry-skin") this.heal(m, m.maxHp / 8, `${this.name(m, true)}'s Dry Skin restored its HP!`);
          if (w === "sun" && (ab === "dry-skin" || ab === "solar-power")) this.indirectDamage(m, Math.floor(m.maxHp / 8), `${this.name(m, true)} was hurt by the sunlight!`);
          if (w === "rain" && ab === "hydration" && m.status) this.cureStatus(m);
        }
      }
    }

    // Wish
    for (const side of st.sides) {
      if (side.wish) {
        side.wish.turns -= 1;
        if (side.wish.turns <= 0) {
          const target = this.monAt(side.index, side.wish.slot);
          if (target && !target.fainted) this.heal(target, side.wish.amount, `${side.wish.name}'s wish came true!`);
          side.wish = null;
        }
      }
    }

    // Future Sight / Doom Desire
    for (const side of st.sides) {
      for (const slot of Object.keys(side.future ?? {})) {
        const hit = side.future[slot];
        hit.turns -= 1;
        if (hit.turns > 0) continue;
        delete side.future[slot];
        this.resolveFutureAttack(side, Number(slot), hit);
      }
    }

    // Per-Pokémon effects, fastest first
    for (const m of this.bySpeed(this.activeMons())) {
      if (m.fainted) continue;
      const v = m.volatile;
      const ab = v.abilitySuppressed ? null : m.ability;
      const item = this.item(m);

      if (v.ingrain) this.heal(m, m.maxHp / 16, `${this.name(m, true)} absorbed nutrients with its roots!`);
      if (ab === "healer") {
        const friend = this.allyOf(m);
        if (friend?.status && chance(st, 30)) this.cureStatus(friend, `${this.name(m, true)}'s Healer cured ${this.name(friend)}'s status!`);
      }
      if (st.sides[m.side].conditions.seaOfFire && !m.types.includes("fire")) this.indirectDamage(m, Math.floor(m.maxHp / 8), `${this.name(m, true)} is hurt by the sea of fire!`);
      if (v.aquaRing) this.heal(m, m.maxHp / 16, `A veil of water restored ${this.name(m)}'s HP!`);
      if (ab === "speed-boost" && v.activeTurns > 0) this.boost(m, { spe: 1 }, m);
      if (ab === "shed-skin" && m.status && chance(st, 30)) this.cureStatus(m);
      if (item === "leftovers") this.heal(m, m.maxHp / 16, `${this.name(m, true)} restored a little HP using its Leftovers!`);
      if (item === "black-sludge") {
        if (m.types.includes("poison")) this.heal(m, m.maxHp / 16, `${this.name(m, true)} restored a little HP using its Black Sludge!`);
        else this.indirectDamage(m, Math.floor(m.maxHp / 8), `${this.name(m, true)} is hurt by its Black Sludge!`);
      }
      if (m.fainted) continue;

      if (v.leechSeed) {
        const seeder = this.monAt(v.leechSeed.side, v.leechSeed.slot);
        if (seeder && !seeder.fainted) {
          const dealt = this.indirectDamage(m, Math.floor(m.maxHp / 8), `${this.name(m, true)}'s health is sapped by Leech Seed!`);
          if (dealt) {
            if (ab === "liquid-ooze") this.indirectDamage(seeder, dealt, `${this.name(seeder, true)} sucked up the liquid ooze!`);
            else this.heal(seeder, dealt, "");
          }
        }
      }
      if (m.fainted) continue;

      if (m.status === "brn") {
        this.indirectDamage(m, Math.floor(m.maxHp / (ab === "heatproof" ? 16 : 8)), `${this.name(m, true)} is hurt by its burn!`);
      } else if (m.status === "psn" || m.status === "tox") {
        if (ab === "poison-heal") this.heal(m, m.maxHp / 8, `${this.name(m, true)} is healed by Poison Heal!`);
        else if (m.status === "psn") this.indirectDamage(m, Math.floor(m.maxHp / 8), `${this.name(m, true)} is hurt by poison!`);
        else {
          this.indirectDamage(m, Math.floor((m.maxHp * m.statusTurns) / 16), `${this.name(m, true)} is hurt by poison!`);
          m.statusTurns = Math.min(15, m.statusTurns + 1);
        }
      }
      if (m.fainted) continue;
      if (v.nightmare && m.status === "slp") this.indirectDamage(m, Math.floor(m.maxHp / 4), `${this.name(m, true)} is locked in a nightmare!`);
      if (v.curse) this.indirectDamage(m, Math.floor(m.maxHp / 4), `${this.name(m, true)} is afflicted by the curse!`);
      if (m.fainted) continue;

      if (v.trapped) {
        const binder = this.findMon(v.trapped.by);
        if (!binder || !this.isActive(binder)) delete v.trapped;
        else {
          v.trapped.turns -= 1;
          if (v.trapped.turns <= 0) {
            this.msg(`${this.name(m, true)} was freed from ${v.trapped.move}!`);
            delete v.trapped;
          } else {
            this.indirectDamage(m, Math.floor(m.maxHp / 16), `${this.name(m, true)} is hurt by ${v.trapped.move}!`);
          }
        }
      }
      if (m.fainted) continue;

      if (v.taunt) { v.taunt -= 1; if (v.taunt <= 0) { delete v.taunt; this.msg(`${this.name(m, true)}'s taunt wore off!`); } }
      if (v.disabled) { v.disabled.turns -= 1; if (v.disabled.turns <= 0) { delete v.disabled; this.msg(`${this.name(m, true)} is no longer disabled!`); } }
      if (v.encore) { v.encore.turns -= 1; if (v.encore.turns <= 0) delete v.encore; }
      if (v.embargo) { v.embargo -= 1; if (v.embargo <= 0) delete v.embargo; }
      if (v.telekinesis) { v.telekinesis -= 1; if (v.telekinesis <= 0) { delete v.telekinesis; this.msg(`${this.name(m, true)} was freed from the telekinesis!`); } }
      if (v.healBlock) { v.healBlock -= 1; if (v.healBlock <= 0) delete v.healBlock; }
      if (v.magnetRise) { v.magnetRise -= 1; if (v.magnetRise <= 0) delete v.magnetRise; }
      if (v.slowStart > 0) { v.slowStart -= 1; if (v.slowStart === 0) this.msg(`${this.name(m, true)} finally got its act together!`); }
      if (v.yawn) {
        v.yawn -= 1;
        if (v.yawn <= 0) {
          delete v.yawn;
          this.trySetStatus(m, "slp", null);
        }
      }
      if (v.perish !== undefined) {
        this.msg(`${this.name(m, true)}'s perish count fell to ${v.perish}.`);
        if (v.perish <= 0) this.faint(m);
        else v.perish -= 1;
      }
      if (m.fainted) continue;

      // Status orbs
      if (item === "toxic-orb" && !m.status) this.trySetStatus(m, "tox", m);
      if (item === "flame-orb" && !m.status) this.trySetStatus(m, "brn", m);
      if (item === "sticky-barb") this.indirectDamage(m, Math.floor(m.maxHp / 8), `${this.name(m, true)} is hurt by its Sticky Barb!`);
      if (!m.fainted) this.checkHpBerries(m);

      v.activeTurns = (v.activeTurns ?? 0) + 1;
      v.protectCount = v.protectedThisTurn ? v.protectCount : 0;
      v.protectedThisTurn = false;
      delete v.charge;
    }

    // Side conditions
    for (const side of st.sides) {
      const c = side.conditions;
      for (const [k, label] of [["reflect", "Reflect"], ["lightScreen", "Light Screen"], ["tailwind", "tailwind"],
        ["safeguard", "Safeguard"], ["mist", "mist"], ["luckyChant", "Lucky Chant"],
        ["rainbow", "rainbow"], ["seaOfFire", "sea of fire"], ["swamp", "swamp"]]) {
        if (c[k]) {
          c[k] -= 1;
          if (c[k] <= 0) {
            delete c[k];
            this.msg(`${side.isPlayer ? "Your team's" : "The foe's"} ${label} wore off!`);
          }
        }
      }
    }
    for (const [k, text] of [["wonderRoom", "Wonder Room wore off, and the Defense stats returned to normal!"], ["magicRoom", "Magic Room wore off, and held items regained their effects!"]]) {
      if (field[k] > 0) { field[k] -= 1; if (field[k] === 0) this.msg(text); }
    }
    if (field.gravity > 0) {
      field.gravity -= 1;
      if (field.gravity === 0) this.msg("Gravity returned to normal!");
    }
    if (field.trickRoom > 0) {
      field.trickRoom -= 1;
      if (field.trickRoom === 0) this.msg("The twisted dimensions returned to normal!");
    }
    this.checkWin();
  }
}

// =====================================================
// STATUS MOVES WITH SPECIAL EFFECTS
// (called with `this` = the battle)
// =====================================================

function protectMove(user) {
  const v = user.volatile;
  const anyoneLeft = this.turnOrder?.some((m) => m !== user && !m.volatile.moved && !m.fainted);
  const odds = 1 / 2 ** (v.protectCount ?? 0);
  if (!anyoneLeft || nextRandom(this.state) >= odds) {
    v.protectCount = 0;
    this.msg("But it failed!");
    return false;
  }
  v.protectCount = (v.protectCount ?? 0) + 1;
  v.protectedThisTurn = true;
  return true;
}

function weatherMove(user, move) {
  if (!this.setWeather(WEATHER_MOVES[move.key], { mon: user })) this.msg("But it failed!");
}

function sideCondition(key, turns, text) {
  return function (user) {
    const c = this.state.sides[user.side].conditions;
    if (c[key]) { this.msg("But it failed!"); return; }
    c[key] = typeof turns === "function" ? turns.call(this, user) : turns;
    this.msg(text.replace("{side}", this.state.sides[user.side].isPlayer ? "your team" : "the foe's team"));
  };
}

const screenTurns = function (user) { return this.item(user) === "light-clay" ? 8 : 5; };

const STATUS_MOVES = {
  protect(user) { if (protectMove.call(this, user)) { user.volatile.protect = true; this.msg(`${this.name(user, true)} protected itself!`); } },
  detect(user) { if (protectMove.call(this, user)) { user.volatile.protect = true; this.msg(`${this.name(user, true)} protected itself!`); } },
  endure(user) { if (protectMove.call(this, user)) { user.volatile.endure = true; this.msg(`${this.name(user, true)} braced itself!`); } },

  "helping-hand"(user, move, targets) {
    const ally = targets[0];
    if (!ally || ally.volatile.moved) { this.msg("But it failed!"); return; }
    ally.volatile.helpingHand = true;
    this.msg(`${this.name(user, true)} is ready to help ${this.name(ally)}!`);
  },
  "follow-me"(user) {
    this.state.sides[user.side].conditions.followMe = this.monKey(user);
    this.msg(`${this.name(user, true)} became the center of attention!`);
  },

  "rain-dance": weatherMove, "sunny-day": weatherMove, sandstorm: weatherMove, hail: weatherMove,

  "trick-room"() {
    const f = this.state.field;
    if (f.trickRoom > 0) { f.trickRoom = 0; this.msg("The twisted dimensions returned to normal!"); }
    else { f.trickRoom = 5; this.msg("It twisted the dimensions!"); }
  },
  reflect: sideCondition("reflect", screenTurns, "Reflect raised {side}'s Defense!"),
  "light-screen": sideCondition("lightScreen", screenTurns, "Light Screen raised {side}'s Sp. Def!"),
  tailwind: sideCondition("tailwind", 3, "The tailwind blew from behind {side}!"),
  safeguard: sideCondition("safeguard", 5, "{side} became cloaked in a mystical veil!"),
  mist: sideCondition("mist", 5, "{side} became shrouded in mist!"),
  "lucky-chant": sideCondition("luckyChant", 5, "The Lucky Chant shielded {side} from critical hits!"),

  spikes(user) {
    const c = this.state.sides[1 - user.side].conditions;
    if ((c.spikes ?? 0) >= 3) { this.msg("But it failed!"); return; }
    c.spikes = (c.spikes ?? 0) + 1;
    this.msg("Spikes were scattered all around the foe's team!");
  },
  "toxic-spikes"(user) {
    const c = this.state.sides[1 - user.side].conditions;
    if ((c.toxicSpikes ?? 0) >= 2) { this.msg("But it failed!"); return; }
    c.toxicSpikes = (c.toxicSpikes ?? 0) + 1;
    this.msg("Poison spikes were scattered all around the foe's team!");
  },
  "stealth-rock"(user) {
    const c = this.state.sides[1 - user.side].conditions;
    if (c.stealthRock) { this.msg("But it failed!"); return; }
    c.stealthRock = true;
    this.msg("Pointed stones float in the air around the foe's team!");
  },
  defog(user, move, targets) {
    for (const side of this.state.sides) {
      const c = side.conditions;
      delete c.spikes; delete c.toxicSpikes; delete c.stealthRock;
    }
    const c = this.state.sides[1 - user.side].conditions;
    delete c.reflect; delete c.lightScreen; delete c.safeguard; delete c.mist;
    for (const t of targets) if (t !== user) this.boost(t, { evasion: -1 }, user);
    this.msg("The field was cleared!");
  },

  haze() {
    for (const m of this.activeMons()) m.boosts = emptyBoosts();
    this.msg("All stat changes were eliminated!");
  },
  rest(user) {
    if (user.hp >= user.maxHp || ["insomnia", "vital-spirit"].includes(user.ability)) { this.msg("But it failed!"); return; }
    user.status = "slp";
    user.statusTurns = 3;
    this.log({ t: "status", ...this.ref(user), status: "slp", text: `${this.name(user, true)} went to sleep!` });
    this.heal(user, user.maxHp, `${this.name(user, true)} regained health!`);
  },
  substitute(user) {
    const cost = Math.floor(user.maxHp / 4);
    if (user.volatile.substitute || user.hp <= cost) { this.msg("But it failed!"); return; }
    user.hp -= cost;
    user.volatile.substitute = cost;
    this.log({ t: "damage", ...this.ref(user), hp: user.hp, maxHp: user.maxHp, amount: cost, indirect: true, text: `${this.name(user, true)} made a substitute!` });
  },
  taunt(user, move, targets) {
    const t = targets[0];
    if (!t || !this.checkProtectAndHit(user, move, t)) return;
    if (t.volatile.taunt) { this.msg("But it failed!"); return; }
    t.volatile.taunt = randomInt(this.state, 3, 5);
    this.msg(`${this.name(t, true)} fell for the taunt!`);
  },
  encore(user, move, targets) {
    const t = targets[0];
    if (!t || !this.checkProtectAndHit(user, move, t)) return;
    const last = t.volatile.lastMove;
    if (!last || t.volatile.encore || ["encore", "struggle", "mimic", "transform"].includes(last)) { this.msg("But it failed!"); return; }
    t.volatile.encore = { move: last, turns: randomInt(this.state, 4, 8) };
    this.msg(`${this.name(t, true)} received an encore!`);
  },
  curse(user, move, targets, chosen) {
    if (user.types.includes("ghost")) {
      const foes = this.foesOf(user);
      const t = chosen ? this.monAt(chosen.side, chosen.slot) : null;
      const target = t && !t.fainted && t.side !== user.side ? t : foes[0];
      if (!target || target.volatile.curse) { this.msg("But it failed!"); return; }
      user.hp = Math.max(0, user.hp - Math.floor(user.maxHp / 2));
      this.log({ t: "damage", ...this.ref(user), hp: user.hp, maxHp: user.maxHp, indirect: true, text: `${this.name(user, true)} cut its own HP and laid a curse on ${this.name(target)}!` });
      target.volatile.curse = true;
      if (user.hp <= 0) this.faint(user);
    } else {
      this.boost(user, { atk: 1, def: 1, spe: -1 }, user, { statusMove: true });
    }
  },
  "belly-drum"(user) {
    const cost = Math.floor(user.maxHp / 2);
    if (user.hp <= cost || user.boosts.atk >= 6) { this.msg("But it failed!"); return; }
    user.hp -= cost;
    user.boosts.atk = 6;
    this.log({ t: "damage", ...this.ref(user), hp: user.hp, maxHp: user.maxHp, indirect: true, text: `${this.name(user, true)} cut its own HP and maximized its Attack!` });
  },
  "pain-split"(user, move, targets) {
    const t = targets[0];
    if (!t || !this.checkProtectAndHit(user, move, t)) return;
    const avg = Math.floor((user.hp + t.hp) / 2);
    for (const m of [user, t]) {
      m.hp = Math.min(m.maxHp, avg);
      this.log({ t: "heal", ...this.ref(m), hp: m.hp, maxHp: m.maxHp, text: "" });
    }
    this.msg("The battlers shared their pain!");
  },
  "destiny-bond"(user) {
    user.volatile.destinyBond = true;
    this.msg(`${this.name(user, true)} is trying to take its foe down with it!`);
  },
  "focus-energy"(user) {
    if (user.volatile.focusEnergy) { this.msg("But it failed!"); return; }
    user.volatile.focusEnergy = true;
    this.msg(`${this.name(user, true)} is getting pumped!`);
  },
  charge(user) {
    user.volatile.charge = true;
    this.msg(`${this.name(user, true)} began charging power!`);
    this.boost(user, { spd: 1 }, user);
  },
  "aqua-ring"(user) {
    user.volatile.aquaRing = true;
    this.msg(`${this.name(user, true)} surrounded itself with a veil of water!`);
  },
  "magnet-rise"(user) {
    if (user.volatile.magnetRise) { this.msg("But it failed!"); return; }
    user.volatile.magnetRise = 5;
    this.msg(`${this.name(user, true)} levitated with electromagnetism!`);
  },
  wish(user) {
    const side = this.state.sides[user.side];
    if (side.wish) { this.msg("But it failed!"); return; }
    side.wish = { turns: 2, slot: this.slotOf(user), amount: Math.floor(user.maxHp / 2), name: user.name };
    this.msg(`${this.name(user, true)} made a wish!`);
  },
  "heal-bell"(user) {
    for (const m of this.state.sides[user.side].team) if (!m.fainted && m.status) this.cureStatus(m);
    this.msg("A bell chimed!");
  },
  aromatherapy(user) {
    for (const m of this.state.sides[user.side].team) if (!m.fainted && m.status) this.cureStatus(m);
    this.msg("A soothing aroma wafted through the area!");
  },
  refresh(user) {
    if (!["brn", "par", "psn", "tox"].includes(user.status)) { this.msg("But it failed!"); return; }
    this.cureStatus(user);
  },
  "psych-up"(user, move, targets) {
    const t = targets[0];
    if (!t) return;
    user.boosts = { ...t.boosts };
    this.msg(`${this.name(user, true)} copied ${this.name(t)}'s stat changes!`);
  },
  "power-swap"(user, move, targets) { swapBoosts.call(this, user, targets[0], ["atk", "spa"], "Attack and Sp. Atk"); },
  "guard-swap"(user, move, targets) { swapBoosts.call(this, user, targets[0], ["def", "spd"], "Defense and Sp. Def"); },
  "heart-swap"(user, move, targets) { swapBoosts.call(this, user, targets[0], ["atk", "def", "spa", "spd", "spe", "accuracy", "evasion"], "stat changes"); },
  acupressure(user) {
    const stats = ["atk", "def", "spa", "spd", "spe", "accuracy", "evasion"].filter((s) => user.boosts[s] < 6);
    if (!stats.length) { this.msg("But it failed!"); return; }
    this.boost(user, { [pick(this.state, stats)]: 2 }, user);
  },
  memento(user, move, targets) {
    const t = targets[0];
    if (t && this.checkProtectAndHit(user, move, t)) this.boost(t, { atk: -2, spa: -2 }, user, { statusMove: true });
    this.faint(user);
  },
  "healing-wish"(user) {
    if (!this.bench(user.side).length) { this.msg("But it failed!"); return; }
    this.state.sides[user.side].healingWish = true;
    this.faint(user);
  },
  "lunar-dance"(user) { STATUS_MOVES["healing-wish"].call(this, user); },
  "baton-pass"(user) {
    if (!this.bench(user.side).length) { this.msg("But it failed!"); return; }
    this.autoSwitch(user, { batonPass: true });
  },
  roar(user, move, targets) { forceSwitch.call(this, user, move, targets); },
  whirlwind(user, move, targets) { forceSwitch.call(this, user, move, targets); },
  "mean-look"(user, move, targets) { trapMove.call(this, user, move, targets); },
  block(user, move, targets) { trapMove.call(this, user, move, targets); },
  "spider-web"(user, move, targets) { trapMove.call(this, user, move, targets); },
  "lock-on"(user, move, targets) { lockOn.call(this, user, move, targets); },
  "mind-reader"(user, move, targets) { lockOn.call(this, user, move, targets); },
  "skill-swap"(user, move, targets) {
    const t = targets[0];
    if (!t || ["wonder-guard", "multitype"].includes(t.ability) || ["wonder-guard", "multitype"].includes(user.ability)) { this.msg("But it failed!"); return; }
    const mine = user.ability;
    this.setAbility(user, t.ability);
    this.setAbility(t, mine);
    this.msg(`${this.name(user, true)} swapped Abilities with its target!`);
  },
  "role-play"(user, move, targets) {
    const t = targets[0];
    if (!t || ["wonder-guard", "multitype", "trace"].includes(t.ability)) { this.msg("But it failed!"); return; }
    this.setAbility(user, t.ability);
    this.msg(`${this.name(user, true)} copied ${this.name(t)}'s Ability!`);
  },
  "worry-seed"(user, move, targets) {
    const t = targets[0];
    if (!t || !this.checkProtectAndHit(user, move, t) || ["truant", "multitype"].includes(t.ability)) { this.msg("But it failed!"); return; }
    this.setAbility(t, "insomnia");
    if (t.status === "slp") this.cureStatus(t);
    this.msg(`${this.name(t, true)} acquired Insomnia!`);
  },
  "gastro-acid"(user, move, targets) {
    const t = targets[0];
    if (!t || !this.checkProtectAndHit(user, move, t)) return;
    t.volatile.abilitySuppressed = true;
    this.msg(`${this.name(t, true)}'s Ability was suppressed!`);
  },
  trick(user, move, targets) { swapItems.call(this, user, targets[0]); },
  switcheroo(user, move, targets) { swapItems.call(this, user, targets[0]); },
  splash() { this.msg("But nothing happened!"); },
  teleport() { this.msg("But it failed!"); },
  "sleep-talk"() { this.msg("But it failed!"); },
  stockpile(user) {
    const n = user.volatile.stockpile ?? 0;
    if (n >= 3) { this.msg("But it failed!"); return; }
    user.volatile.stockpile = n + 1;
    this.msg(`${this.name(user, true)} stockpiled ${n + 1}!`);
    this.boost(user, { def: 1, spd: 1 }, user);
  },
  swallow(user) {
    const n = user.volatile.stockpile ?? 0;
    if (!n) { this.msg("But it failed!"); return; }
    this.heal(user, user.maxHp * [0, 0.25, 0.5, 1][n], `${this.name(user, true)} regained health!`);
    delete user.volatile.stockpile;
  },

  // ---------- Moves that use other moves ----------
  "mirror-move"(user, move, targets) {
    const t = targets[0];
    const last = t?.volatile.lastMove;
    const copied = last && this.move(last);
    if (!copied || CALL_BANNED.has(last) || last === "mirror-move" || !MIRRORABLE_TARGETS.has(copied.target)) { this.msg("But it failed!"); return; }
    this.useMove(user, last, this.ref(t), { fromChoice: false, calledBy: "mirror-move" });
  },
  copycat(user, move, targets, chosen) {
    const last = this.state.field.previousMove;
    if (!last || CALL_BANNED.has(last)) { this.msg("But it failed!"); return; }
    callAnother.call(this, user, last, chosen, "copycat");
  },
  assist(user, move, targets, chosen) {
    const pool = [];
    for (const m of this.state.sides[user.side].team) {
      if (m === user) continue;
      for (const mv of m.moves) if (!CALL_BANNED.has(mv.id)) pool.push(mv.id);
    }
    if (!pool.length) { this.msg("But it failed!"); return; }
    callAnother.call(this, user, pick(this.state, pool), chosen, "assist");
  },
  "me-first"(user, move, targets) {
    const t = targets[0];
    const planned = t && t.side !== user.side && !t.volatile.moved ? t.volatile.pendingMove : null;
    if (!planned || ME_FIRST_BANNED.has(planned) || this.move(planned).category === "status") { this.msg("But it failed!"); return; }
    user.volatile.meFirst = true;
    try { this.useMove(user, planned, this.ref(t), { fromChoice: false, calledBy: "me-first" }); } finally { delete user.volatile.meFirst; }
  },

  // ---------- Copying moves, forms and types ----------
  mimic(user, move, targets) {
    const t = targets[0];
    if (!t || !this.checkProtectAndHit(user, move, t)) return;
    const last = t.volatile.lastMove;
    const index = user.moves.findIndex((m) => m.id === "mimic");
    if (!last || index === -1 || MIMIC_BANNED.has(last) || user.volatile.mimic || user.moves.some((m) => m.id === last)) { this.msg("But it failed!"); return; }
    const learned = this.move(last);
    // Gen 4: the copy has 5 PP, and it's gone when the Pokémon leaves the field
    user.volatile.mimic = { index, move: { ...user.moves[index] }, afterTransform: !!user.volatile.transformed };
    user.moves[index] = { id: last, pp: Math.min(5, learned.pp), maxPp: learned.pp };
    this.msg(`${this.name(user, true)} learned ${learned.name}!`);
  },
  sketch(user, move, targets) {
    const t = targets[0];
    if (!t || !this.checkProtectAndHit(user, move, t)) return;
    const last = t.volatile.lastMove;
    const index = user.moves.findIndex((m) => m.id === "sketch");
    if (!last || index === -1 || SKETCH_BANNED.has(last) || user.volatile.transformed || user.moves.some((m) => m.id === last)) { this.msg("But it failed!"); return; }
    const learned = this.move(last);
    // Permanent: the run keeps the sketched move (see finishBattle)
    user.moves[index] = { id: last, pp: learned.pp, maxPp: learned.pp };
    (user.sketched ??= []).push({ index, move: last });
    this.msg(`${this.name(user, true)} sketched ${learned.name}!`);
  },
  transform(user, move, targets) {
    const t = targets[0];
    if (!t || !this.checkProtectAndHit(user, move, t)) return;
    if (user.volatile.transformed || t.volatile.transformed || t.volatile.substitute) { this.msg("But it failed!"); return; }
    const v = user.volatile;
    v.original = { ability: user.ability, stats: user.stats, weightKg: user.weightKg, moves: user.moves.map((m) => ({ ...m })) };
    v.originalTypes ??= [...user.types];
    v.transformed = t.species;
    user.types = [...t.types];
    user.ability = t.ability;
    user.stats = { ...t.stats, hp: user.stats.hp };
    user.weightKg = t.weightKg;
    user.moves = t.moves.map((m) => ({ id: m.id, pp: Math.min(5, m.maxPp), maxPp: m.maxPp }));
    user.boosts = { ...t.boosts };
    this.log({ t: "transform", ...this.ref(user), species: t.species, shiny: t.shiny, text: `${this.name(user, true)} transformed into ${this.name(t)}!` });
  },
  conversion(user) {
    const options = [...new Set(user.moves.filter((m) => m.id !== "conversion").map((m) => this.move(m.id).type))].filter((t) => t !== "???" && !user.types.includes(t));
    if (!options.length) { this.msg("But it failed!"); return; }
    changeType.call(this, user, pick(this.state, options));
  },
  "conversion-2"(user) {
    const hit = user.volatile.lastHitType;
    const options = hit ? TYPES.filter((t) => t !== "???" && typeMultiplier(hit, t) < 1 && !(user.types.length === 1 && user.types[0] === t)) : [];
    if (!options.length) { this.msg("But it failed!"); return; }
    changeType.call(this, user, pick(this.state, options));
  },
  camouflage(user) {
    const type = this.state.terrain ?? "normal";
    if (user.types.length === 1 && user.types[0] === type) { this.msg("But it failed!"); return; }
    changeType.call(this, user, type);
  },
  "power-trick"(user) {
    const s = user.stats;
    [s.atk, s.def] = [s.def, s.atk];
    user.volatile.powerTrick = !user.volatile.powerTrick;
    user.volatile.powerTrickSkip = !!user.volatile.transformed; // a transformed form is thrown away on leaving anyway
    this.msg(`${this.name(user, true)} switched its Attack and Defense!`);
  },
  "psycho-shift"(user, move, targets) {
    const t = targets[0];
    if (!user.status) { this.msg("But it failed!"); return; }
    if (!t || !this.checkProtectAndHit(user, move, t)) return;
    if (this.trySetStatus(t, user.status, user, { fromMove: true, statusMove: true })) this.cureStatus(user);
  },

  // ---------- Move and PP tricks ----------
  disable(user, move, targets) {
    const t = targets[0];
    if (!t || !this.checkProtectAndHit(user, move, t)) return;
    const last = t.volatile.lastMove;
    const slot = last && t.moves.find((m) => m.id === last);
    if (t.volatile.disabled || !slot || slot.pp <= 0 || last === "struggle") { this.msg("But it failed!"); return; }
    t.volatile.disabled = { move: last, turns: randomInt(this.state, 4, 7) };
    this.msg(`${this.name(t, true)}'s ${this.move(last).name} was disabled!`);
  },
  spite(user, move, targets) {
    const t = targets[0];
    if (!t || !this.checkProtectAndHit(user, move, t)) return;
    const last = t.volatile.lastMove;
    const slot = last && t.moves.find((m) => m.id === last);
    if (!slot || slot.pp <= 0 || last === "struggle") { this.msg("But it failed!"); return; }
    const cut = Math.min(4, slot.pp);
    slot.pp -= cut;
    this.msg(`It reduced the PP of ${this.name(t)}'s ${this.move(last).name} by ${cut}!`);
  },
  imprison(user) {
    if (user.volatile.imprison) { this.msg("But it failed!"); return; }
    user.volatile.imprison = true;
    this.msg(`${this.name(user, true)} sealed the opponents' moves!`);
  },
  grudge(user) {
    user.volatile.grudge = true;
    this.msg(`${this.name(user, true)} wants its target to bear a grudge!`);
  },
  recycle(user) {
    if (!user.consumedItem || user.item) { this.msg("But it failed!"); return; }
    user.item = user.consumedItem;
    user.consumedItem = null;
    delete user.volatile.unburden;
    this.msg(`${this.name(user, true)} found one ${this.itemName(user.item)}!`);
  },

  // ---------- Gen 5 ----------
  "heal-pulse"(user, move, targets) {
    const t = targets[0];
    if (!t || !this.checkProtectAndHit(user, move, t)) return;
    if (t.hp >= t.maxHp) { this.msg(`${this.name(t, true)}'s HP is full!`); return; }
    this.heal(t, Math.ceil(t.maxHp / 2), `${this.name(t, true)} regained health!`);
  },
  "wide-guard"(user) { if (protectMove.call(this, user)) { this.state.sides[user.side].conditions.wideGuard = true; this.msg("Wide Guard protected the team!"); } },
  "quick-guard"(user) { if (protectMove.call(this, user)) { this.state.sides[user.side].conditions.quickGuard = true; this.msg("Quick Guard protected the team!"); } },
  "rage-powder"(user) {
    this.state.sides[user.side].conditions.followMe = this.monKey(user);
    this.msg(`${this.name(user, true)} became the center of attention!`);
  },
  "guard-split"(user, move, targets) { splitStats.call(this, user, targets[0], ["def", "spd"], "defensive"); },
  "power-split"(user, move, targets) { splitStats.call(this, user, targets[0], ["atk", "spa"], "offensive"); },
  "wonder-room"() {
    const f = this.state.field;
    if (f.wonderRoom > 0) { f.wonderRoom = 0; this.msg("Wonder Room wore off, and the Defense stats returned to normal!"); }
    else { f.wonderRoom = 5; this.msg("It created a bizarre area in which the Defense and Sp. Def stats are swapped!"); }
  },
  "magic-room"() {
    const f = this.state.field;
    if (f.magicRoom > 0) { f.magicRoom = 0; this.msg("Magic Room wore off, and held items regained their effects!"); }
    else { f.magicRoom = 5; this.msg("It created a bizarre area in which Pokémon's held items lose their effects!"); }
  },
  soak(user, move, targets) {
    const t = targets[0];
    if (!t || !this.checkProtectAndHit(user, move, t)) return;
    if (t.types.length === 1 && t.types[0] === "water") { this.msg("But it failed!"); return; }
    t.volatile.originalTypes ??= [...t.types];
    t.types = ["water"];
    this.msg(`${this.name(t, true)} transformed into the Water type!`);
  },
  "simple-beam"(user, move, targets) {
    const t = targets[0];
    if (!t || !this.checkProtectAndHit(user, move, t) || ["truant", "multitype", "simple"].includes(t.ability)) { this.msg("But it failed!"); return; }
    this.setAbility(t, "simple");
    this.msg(`${this.name(t, true)} acquired Simple!`);
  },
  entrainment(user, move, targets) {
    const t = targets[0];
    if (!t || !this.checkProtectAndHit(user, move, t) || ["truant", "multitype"].includes(t.ability) || ["trace", "multitype", "flower-gift", "forecast"].includes(user.ability)) { this.msg("But it failed!"); return; }
    this.setAbility(t, user.ability);
    this.msg(`${this.name(t, true)} acquired ${this.data.abilities[user.ability]?.name ?? user.ability}!`);
  },
  bestow(user, move, targets) {
    const t = targets[0];
    if (!t || !user.item || t.item || !this.checkProtectAndHit(user, move, t)) { this.msg("But it failed!"); return; }
    t.item = user.item;
    user.item = null;
    if (user.ability === "unburden") user.volatile.unburden = true;
    this.msg(`${this.name(user, true)} gave its ${this.itemName(t.item)} to ${this.name(t)}!`);
  },
  "after-you"(user, move, targets) {
    const t = targets[0];
    const queue = this.queue ?? [];
    const here = queue.indexOf(this.currentAction);
    const there = queue.findIndex((a, i) => i > here && a.mon === t && a.type === "move");
    if (!t || there === -1 || there === here + 1) { this.msg("But it failed!"); return; }
    queue.splice(here + 1, 0, ...queue.splice(there, 1));
    this.msg(`${this.name(t, true)} took the kind offer!`);
  },
  "ally-switch"(user) {
    const ally = this.allyOf(user);
    if (!ally) { this.msg("But it failed!"); return; }
    const side = this.state.sides[user.side];
    side.active = [side.active[1], side.active[0]];
    const occupants = [0, 1].map((slot) => { const m = this.monAt(user.side, slot); return { teamIndex: m.teamIndex, hp: m.hp, maxHp: m.maxHp }; });
    this.log({ t: "swapPlaces", side: user.side, occupants, text: `${this.name(user, true)} and ${this.name(ally)} swapped places!` });
  },
  quash(user, move, targets) {
    const t = targets[0];
    const queue = this.queue ?? [];
    const here = queue.indexOf(this.currentAction);
    const there = queue.findIndex((a, i) => i > here && a.mon === t && a.type === "move");
    if (!t || there === -1 || there === queue.length - 1 || !this.checkProtectAndHit(user, move, t)) { this.msg("But it failed!"); return; }
    queue.push(...queue.splice(there, 1));
    this.msg(`${this.name(t, true)}'s move was postponed!`);
  },
  "reflect-type"(user, move, targets) {
    const t = targets[0];
    if (!t || !this.checkProtectAndHit(user, move, t)) return;
    user.volatile.originalTypes ??= [...user.types];
    user.types = [...t.types];
    this.msg(`${this.name(user, true)}'s type changed to match ${this.name(t)}'s!`);
  },
  telekinesis(user, move, targets) {
    const t = targets[0];
    if (!t || !this.checkProtectAndHit(user, move, t) || t.volatile.telekinesis || t.volatile.ingrain || t.volatile.smackedDown || this.state.field.gravity > 0) { this.msg("But it failed!"); return; }
    t.volatile.telekinesis = 3;
    this.msg(`${this.name(t, true)} was hurled into the air!`);
  },
  autotomize(user) {
    this.boost(user, { spe: 2 }, user, { statusMove: true });
    if (!user.volatile.transformed) user.volatile.originalWeight ??= user.weightKg;
    user.weightKg = Math.max(0.1, user.weightKg - 100);
  },

  // ---------- Defence and field ----------
  ingrain(user) {
    if (user.volatile.ingrain) { this.msg("But it failed!"); return; }
    user.volatile.ingrain = true;
    this.msg(`${this.name(user, true)} planted its roots!`);
  },
  "magic-coat"(user) {
    user.volatile.magicCoat = true;
    this.msg(`${this.name(user, true)} shrouded itself with Magic Coat!`);
  },
  snatch(user) {
    user.volatile.snatch = true;
    this.msg(`${this.name(user, true)} waits for a target to make a move!`);
  },
  "mud-sport"(user) {
    if (this.sportActive("mudSport")) { this.msg("But it failed!"); return; }
    this.state.field.mudSport = this.monKey(user);
    this.msg("Electricity's power was weakened!");
  },
  "water-sport"(user) {
    if (this.sportActive("waterSport")) { this.msg("But it failed!"); return; }
    this.state.field.waterSport = this.monKey(user);
    this.msg("Fire's power was weakened!");
  },
  gravity() {
    const f = this.state.field;
    if (f.gravity > 0) { this.msg("But it failed!"); return; }
    f.gravity = 5;
    for (const m of this.activeMons()) {
      // Fly / Bounce are cut short and Magnet Rise ends
      if (m.volatile.charging?.invulnerable === "air") delete m.volatile.charging;
      delete m.volatile.magnetRise;
    }
    this.msg("Gravity intensified!");
  },
};

// Guard Split / Power Split: both Pokémon get the average (back to normal when they leave the field)
function splitStats(user, t, keys, label) {
  if (!t || !this.checkProtectAndHit(user, this.currentMove.move, t)) return;
  for (const m of [user, t]) {
    if (m.volatile.transformed) continue;
    m.volatile.splitBackup ??= {};
    for (const k of keys) m.volatile.splitBackup[k] ??= m.stats[k];
  }
  for (const k of keys) {
    const avg = Math.floor((user.stats[k] + t.stats[k]) / 2);
    user.stats[k] = avg;
    t.stats[k] = avg;
  }
  this.msg(`${this.name(user, true)} shared its ${label} power with the target!`);
}

// Assist / Copycat: use another move, aimed at a random foe when it needs a target
function callAnother(user, moveId, chosen, calledBy) {
  const next = this.move(moveId);
  const target = ["selected-pokemon", "selected-pokemon-me-first"].includes(next.target) ? null : chosen;
  this.useMove(user, moveId, target, { fromChoice: false, calledBy });
}

// Conversion, Conversion 2, Camouflage (undone when the Pokémon leaves the field)
function changeType(user, type) {
  user.volatile.originalTypes ??= [...user.types];
  user.types = [type];
  this.msg(`${this.name(user, true)} transformed into the ${capitalize(type)} type!`);
}

function swapBoosts(user, target, stats, label) {
  if (!target || !this.checkProtectAndHit(user, this.currentMove.move, target)) return;
  for (const s of stats) [user.boosts[s], target.boosts[s]] = [target.boosts[s], user.boosts[s]];
  this.msg(`${this.name(user, true)} switched ${label} changes with ${this.name(target)}!`);
}

function forceSwitch(user, move, targets) {
  const t = targets[0];
  if (!t || !this.checkProtectAndHit(user, move, t)) return;
  if (this.ability(t) === "suction-cups" || t.volatile.ingrain) { this.msg(`${this.name(t, true)} anchored itself!`); return; }
  const bench = this.bench(t.side);
  if (!bench.length) { this.msg("But it failed!"); return; }
  this.doSwitch(t.side, this.slotOf(t), pick(this.state, bench).teamIndex);
}

function trapMove(user, move, targets) {
  const t = targets[0];
  if (!t || !this.checkProtectAndHit(user, move, t) || t.volatile.meanLook) { this.msg("But it failed!"); return; }
  t.volatile.meanLook = this.monKey(user);
  this.msg(`${this.name(t, true)} can't escape now!`);
}

function lockOn(user, move, targets) {
  const t = targets[0];
  if (!t) return;
  t.volatile.lockedOnBy = this.monKey(user);
  this.msg(`${this.name(user, true)} took aim at ${this.name(t)}!`);
}

function swapItems(user, target) {
  if (!target || (!user.item && !target.item) || this.ability(target) === "sticky-hold") { this.msg("But it failed!"); return; }
  [user.item, target.item] = [target.item, user.item];
  this.msg(`${this.name(user, true)} switched items with its target!`);
}
