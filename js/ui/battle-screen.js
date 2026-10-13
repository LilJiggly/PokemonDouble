// =====================================================
// BATTLE SCREEN
// -----------------------------------------------------
// Draws the battle (top screen), plays back the engine's
// events with animations and text, and collects the
// player's choices on the touch menu (bottom screen).
// =====================================================

import { chooseTurn, chooseSwitches } from "../engine/ai.js";
import { alignSprite, hovers } from "./sprite-align.js";
import { itemInfo } from "../game/item-catalog.js";
import { NATURES, STAT_NAMES } from "../engine/constants.js";

const PLAYER = 0;
const FOE = 1;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const posKey = (side, slot) => `${side}-${slot}`;
export const CATEGORY_LABEL = { physical: "Physical", special: "Special", status: "Status" };
export const TARGET_LABEL = {
  "selected-pokemon": "One Pokémon of your choice",
  "selected-pokemon-me-first": "One Pokémon of your choice",
  "all-opponents": "Both foes",
  "all-other-pokemon": "Everyone else, including your partner!",
  "random-opponent": "A random foe",
  user: "Itself",
  ally: "Your partner",
  "user-or-ally": "Itself or your partner",
  "users-field": "Your whole side",
  "user-and-allies": "Your whole side",
  "opponents-field": "The foe's side",
  "entire-field": "The whole field",
  "all-pokemon": "Every Pokémon",
  "specific-move": "Depends on the situation",
};

// Short line with category, power and accuracy for a move
export function moveStats(move, { withCategory = true } = {}) {
  const parts = withCategory ? [CATEGORY_LABEL[move.category]] : [];
  if (move.power) parts.push(`${move.power} power`);
  parts.push(move.accuracy ? `${move.accuracy}% accuracy` : "never misses");
  if (move.priority > 0) parts.push(`priority +${move.priority}`);
  if (move.priority < 0) parts.push(`priority ${move.priority}`);
  return parts.join(" · ");
}

const TEXT_SPEED = { normal: { char: 14, hold: 750 }, fast: { char: 5, hold: 350 } };

export class BattleScreen {
  // battle: Battle instance. opts: { data, onSave(state), onEnd(winner), terrain,
  //   trainer: { title, name, sprites: [url] } }
  constructor(battle, { data, onSave, onEnd, terrain = "normal", trainer = null, playerBack = null }) {
    this.terrain = terrain;
    this.playerBack = playerBack;
    this.trainer = trainer;
    this.battle = battle;
    this.data = data;
    this.onSave = onSave ?? (() => {});
    this.onEnd = onEnd ?? (() => {});
    this.scene = document.getElementById("scene");
    this.menu = document.getElementById("menu");
    this.textbox = document.getElementById("textbox");
    this.textEl = document.getElementById("text");
    this.turnBadge = document.getElementById("turnBadge");
    this.speed = localStorage.getItem("pd.textSpeed") === "fast" ? "fast" : "normal";
    this.view = {}; // what's shown at each position: { teamIndex, hp, maxHp, status }
    this.skip = null;

    this.textbox.onclick = () => this.skip?.();
    this.keyHandler = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        if (this.skip) { e.preventDefault(); this.skip(); }
      }
    };
    document.addEventListener("keydown", this.keyHandler);
  }

  destroy() {
    document.removeEventListener("keydown", this.keyHandler);
  }

  // ===============================
  // MAIN LOOP
  // ===============================

  async run({ resumed = false, initialEvents = [] } = {}) {
    this.clearScene();
    this.showWaiting();
    this.initParty();
    if (resumed) {
      this.renderFromState();
      await this.say("The battle continues!");
    } else {
      await this.trainerIntro();
      await this.play(initialEvents);
      this.onSave(this.battle.state);
    }

    const b = this.battle;
    while (b.state.phase !== "ended") {
      if (b.state.phase === "choose") {
        const playerChoices = await this.collectTurnChoices();
        const foeChoices = chooseTurn(b, FOE);
        this.showWaiting();
        const events = b.submitTurn([playerChoices, foeChoices]);
        this.onSave(b.state);
        await this.play(events);
      } else if (b.state.phase === "switch") {
        const req = b.getRequest(PLAYER);
        const playerSwitches = req.type === "switch" ? await this.collectReplacements(req) : [];
        const foeSwitches = chooseSwitches(b, FOE);
        this.showWaiting();
        const events = b.submitSwitches([playerSwitches, foeSwitches]);
        this.onSave(b.state);
        await this.play(events);
      }
    }
    this.onEnd(b.state.winner);
  }

  // ===============================
  // SCENE RENDERING
  // ===============================

  sprite(side, slot) { return this.scene.querySelector(`.sprite[data-pos="${posKey(side, slot)}"]`); }
  hpbox(side, slot) { return this.scene.querySelector(`.hpbox[data-pos="${posKey(side, slot)}"]`); }

  clearScene() {
    this.view = {};
    for (const side of [PLAYER, FOE]) {
      for (const slot of [0, 1]) {
        const s = this.sprite(side, slot);
        s.className = `sprite ${side === PLAYER ? "player" : "foe"} s${slot}`;
        s.removeAttribute("src");
        this.hpbox(side, slot).classList.remove("visible");
      }
    }
    this.scene.dataset.weather = "";
    this.scene.dataset.terrain = this.terrain;
    this.turnBadge.textContent = "";
  }

  // ===============================
  // TRAINER INTRO + PARTY BALLS
  // ===============================

  async trainerIntro() {
    if (!this.trainer?.sprites?.length) return;
    const intro = document.createElement("div");
    intro.className = "trainer-intro";
    intro.innerHTML = this.trainer.sprites.map((src) => `<img src="${src}" alt="">`).join("");
    this.scene.appendChild(intro);
    intro.querySelectorAll("img").forEach((img) => alignSprite(img)); // feet on the foe baseline
    let me = null;
    if (this.playerBack) {
      me = document.createElement("img");
      me.className = "player-trainer player enter-left";
      me.src = this.playerBack;
      me.alt = "";
      this.scene.appendChild(me);
      alignSprite(me); // feet on the player's line
    }
    await this.say(`${this.trainer.title} ${this.trainer.name} would like to battle!`);
    intro.classList.add("leave");
    me?.classList.add("leave-left");
    await sleep(this.speed === "fast" ? 250 : 450);
    intro.remove();
    me?.remove();
  }

  // Which team members have fainted, per side (from what the player has seen so far)
  initParty() {
    this.party = this.battle.state.sides.map((side) => side.team.map((m) => m.fainted));
    for (const side of [PLAYER, FOE]) {
      let bar = this.scene.querySelector(`.party-bar.${side === PLAYER ? "player" : "foe"}`);
      if (!bar) {
        bar = document.createElement("div");
        bar.className = `party-bar ${side === PLAYER ? "player" : "foe"}`;
        this.scene.appendChild(bar);
      }
    }
    this.renderParty();
  }

  renderParty() {
    for (const side of [PLAYER, FOE]) {
      const bar = this.scene.querySelector(`.party-bar.${side === PLAYER ? "player" : "foe"}`);
      bar.innerHTML = this.party[side].map((out) => `<img src="images/ui/ball.png" alt="" class="${out ? "out" : ""}">`).join("");
      bar.setAttribute("aria-label", `${this.party[side].filter((o) => !o).length} of ${this.party[side].length} Pokémon left`);
    }
  }

  // Draw everything straight from the battle state (used when resuming a save)
  renderFromState() {
    const st = this.battle.state;
    for (const side of st.sides) {
      for (const slot of [0, 1]) {
        const mon = this.battle.monAt(side.index, slot);
        if (mon && !mon.fainted) {
          this.placeMon(side.index, slot, mon.teamIndex, mon.hp, mon.maxHp);
          this.view[posKey(side.index, slot)].status = mon.status;
          this.drawHpbox(side.index, slot);
        }
      }
    }
    this.scene.dataset.weather = st.field.weather ?? "";
    this.turnBadge.textContent = `Turn ${st.turn}`;
  }

  monData(side, teamIndex) { return this.battle.state.sides[side].team[teamIndex]; }

  spriteUrl(mon, side) {
    const species = this.data.pokemonByKey[mon.species];
    const s = species.sprites;
    if (side === PLAYER) return mon.shiny ? s.backShiny : s.back;
    return mon.shiny ? s.frontShiny : s.front;
  }

  placeMon(side, slot, teamIndex, hp, maxHp) {
    const mon = this.monData(side, teamIndex);
    this.view[posKey(side, slot)] = { teamIndex, hp, maxHp, status: mon.status };
    const img = this.sprite(side, slot);
    img.className = `sprite ${side === PLAYER ? "player" : "foe"} s${slot} visible`;
    img.src = this.spriteUrl(mon, side);
    img.alt = mon.name;
    const species = this.data.pokemonByKey[mon.species];
    alignSprite(img, { hover: hovers(species) });
    this.drawHpbox(side, slot);
    this.hpbox(side, slot).classList.add("visible");
  }

  drawHpbox(side, slot) {
    const v = this.view[posKey(side, slot)];
    if (!v) return;
    const mon = this.monData(side, v.teamIndex);
    const box = this.hpbox(side, slot);
    const gender = mon.gender ? `<span class="gender ${mon.gender}">${mon.gender === "M" ? "♂" : "♀"}</span>` : "";
    box.innerHTML = `
      <div class="row">
        <span class="name">${mon.name}${gender}</span>
        <span class="level">Lv${mon.level}</span>
      </div>
      <div class="bar-row">
        <span class="status ${v.status ?? ""}">${v.status ? v.status.toUpperCase() : ""}</span>
        <span class="hp-label">HP</span>
        <div class="hpbar"><i></i></div>
      </div>
      <div class="hp-numbers">${v.hp}/${v.maxHp}</div>`;
    this.setBar(box, v.hp, v.maxHp, false);
  }

  setBar(box, hp, maxHp, animate = true) {
    const bar = box.querySelector(".hpbar > i");
    if (!bar) return;
    const pct = Math.max(0, hp / maxHp);
    if (!animate) bar.style.transition = "none";
    bar.style.width = `${pct * 100}%`;
    bar.className = pct <= 0.2 ? "red" : pct <= 0.5 ? "yellow" : "";
    if (!animate) {
      void bar.offsetWidth;
      bar.style.transition = "";
    }
  }

  async animateHp(side, slot, hp, maxHp) {
    const v = this.view[posKey(side, slot)];
    if (!v) return;
    const box = this.hpbox(side, slot);
    const from = v.hp;
    v.hp = hp;
    v.maxHp = maxHp;
    this.setBar(box, hp, maxHp, true);
    const numbers = box.querySelector(".hp-numbers");
    const steps = 12;
    for (let i = 1; i <= steps; i++) {
      numbers.textContent = `${Math.round(from + ((hp - from) * i) / steps)}/${maxHp}`;
      await sleep(this.speed === "fast" ? 18 : 45);
    }
  }

  async animateSprite(side, slot, cls, ms) {
    const img = this.sprite(side, slot);
    img.classList.remove(cls);
    void img.offsetWidth;
    img.classList.add(cls);
    await sleep(this.speed === "fast" ? ms * 0.6 : ms);
    if (cls !== "faint" && cls !== "leave") img.classList.remove(cls);
  }

  // ===============================
  // TEXT BOX
  // ===============================

  // Type out a message; click / Enter skips ahead
  say(text) {
    if (!text) return Promise.resolve();
    const { char, hold } = TEXT_SPEED[this.speed];
    return new Promise((resolve) => {
      let i = 0;
      let done = false;
      this.textbox.classList.remove("waiting");
      const finish = () => {
        if (done) return;
        done = true;
        clearInterval(timer);
        clearTimeout(holdTimer);
        this.skip = null;
        resolve();
      };
      let holdTimer;
      const typed = () => {
        this.textEl.textContent = text;
        this.textbox.classList.add("waiting");
        this.skip = finish;
        holdTimer = setTimeout(finish, hold);
      };
      this.skip = () => { clearInterval(timer); typed(); };
      const timer = setInterval(() => {
        i += 1;
        this.textEl.textContent = text.slice(0, i);
        if (i >= text.length) { clearInterval(timer); typed(); }
      }, char);
    });
  }

  // ===============================
  // EVENT PLAYBACK
  // ===============================

  async play(events) {
    for (const e of events) await this.playEvent(e);
  }

  async playEvent(e) {
    switch (e.t) {
      case "turn":
        this.turnBadge.textContent = `Turn ${e.turn}`;
        return;
      case "switch":
        this.placeMon(e.side, e.slot, e.teamIndex, e.hp, e.maxHp);
        await this.animateSprite(e.side, e.slot, "enter", 450);
        return this.say(e.text);
      case "transform": {
        // The Pokémon looks like its target until it leaves the field
        const img = this.sprite(e.side, e.slot);
        const sprites = this.data.pokemonByKey[e.species].sprites;
        img.src = e.side === PLAYER ? (e.shiny ? sprites.backShiny : sprites.back) : (e.shiny ? sprites.frontShiny : sprites.front);
        alignSprite(img, { hover: hovers(this.data.pokemonByKey[e.species]) });
        return this.say(e.text);
      }
      case "switchOut":
        await this.say(e.text);
        await this.animateSprite(e.side, e.slot, "leave", 300);
        this.hpbox(e.side, e.slot).classList.remove("visible");
        delete this.view[posKey(e.side, e.slot)];
        return;
      case "move":
        this.hpbox(e.side, e.slot).classList.add("active-turn");
        await this.say(e.text);
        await this.animateSprite(e.side, e.slot, "attack", 300);
        this.hpbox(e.side, e.slot).classList.remove("active-turn");
        return;
      case "damage":
        if (e.indirect) await this.say(e.text);
        else this.animateSprite(e.side, e.slot, "hit", 450);
        await this.animateHp(e.side, e.slot, e.hp, e.maxHp);
        if (!e.indirect) await this.say(e.text);
        return;
      case "heal":
        await this.animateHp(e.side, e.slot, e.hp, e.maxHp);
        return this.say(e.text);
      case "faint":
        if (this.party?.[e.side]) { this.party[e.side][e.teamIndex] = true; this.renderParty(); }
        await this.animateSprite(e.side, e.slot, "faint", 500);
        this.hpbox(e.side, e.slot).classList.remove("visible");
        delete this.view[posKey(e.side, e.slot)];
        return this.say(e.text);
      case "status": {
        const v = this.view[posKey(e.side, e.slot)];
        if (v) { v.status = e.status; this.drawHpbox(e.side, e.slot); }
        return this.say(e.text);
      }
      case "cure": {
        const v = this.view[posKey(e.side, e.slot)];
        if (v) { v.status = null; this.drawHpbox(e.side, e.slot); }
        return this.say(e.text);
      }
      case "weather":
        this.scene.dataset.weather = e.weather ?? "";
        return this.say(e.text);
      case "end":
        return this.say(e.text);
      default:
        return this.say(e.text);
    }
  }

  // ===============================
  // MENUS
  // ===============================

  setMenu(html) {
    this.menu.innerHTML = html;
    return this.menu;
  }

  showWaiting() {
    this.setMenu(`<div class="panel result"></div>`);
  }

  // Ask each of the player's active Pokémon what to do (with Back between them)
  async collectTurnChoices() {
    const req = this.battle.getRequest(PLAYER);
    const slots = req.slots;
    const choices = [];
    let i = 0;
    while (i < slots.length) {
      const slotReq = slots[i];
      if (slotReq.forced) {
        choices[i] = { slot: slotReq.slot, type: "move", move: 0 };
        i++;
        continue;
      }
      const taken = choices.slice(0, i).filter((c) => c?.type === "switch").map((c) => c.teamIndex);
      // Bag items already chosen this turn by the other slot
      const reserved = {};
      for (const c of choices.slice(0, i)) if (c?.type === "item") reserved[c.item] = (reserved[c.item] ?? 0) + 1;
      const choice = await this.commandMenu(slotReq, i > 0, taken, reserved);
      if (choice === "back") {
        i = Math.max(0, i - 1);
        while (i > 0 && slots[i].forced) i--;
        continue;
      }
      choices[i] = choice;
      i++;
    }
    return choices;
  }

  commandMenu(slotReq, canGoBack, takenSwitches, reserved = {}) {
    const mon = this.monData(PLAYER, slotReq.teamIndex);
    const bag = (slotReq.bag ?? []).filter((b) => b.count - (reserved[b.id] ?? 0) > 0);
    return new Promise((resolve) => {
      const menu = this.setMenu(`
        <div class="menu-title">What will <b>${mon.name}</b> do?</div>
        <div class="cmd-grid">
          <button class="btn fight" data-cmd="fight">FIGHT</button>
          <button class="btn bag" data-cmd="bag" ${bag.length ? "" : "disabled"}>BAG</button>
          <button class="btn party" data-cmd="party" ${slotReq.canSwitch ? "" : "disabled"}>POKéMON</button>
        </div>
        <div class="menu-footer">
          <button class="btn" data-cmd="back" ${canGoBack ? "" : "disabled"}>◀ Back</button>
          <button class="btn" data-cmd="speed">Text: ${this.speed === "fast" ? "Fast" : "Normal"}</button>
        </div>`);
      menu.onclick = async (ev) => {
        const cmd = ev.target.closest("button")?.dataset.cmd;
        if (!cmd) return;
        if (cmd === "back") resolve("back");
        if (cmd === "speed") {
          this.speed = this.speed === "fast" ? "normal" : "fast";
          localStorage.setItem("pd.textSpeed", this.speed);
          resolve(await this.commandMenu(slotReq, canGoBack, takenSwitches, reserved));
        }
        if (cmd === "fight") {
          const r = await this.moveMenu(slotReq, mon);
          resolve(r === "back" ? await this.commandMenu(slotReq, canGoBack, takenSwitches, reserved) : r);
        }
        if (cmd === "bag") {
          const r = await this.bagMenu(slotReq, bag, reserved);
          resolve(r === null ? await this.commandMenu(slotReq, canGoBack, takenSwitches, reserved) : r);
        }
        if (cmd === "party") {
          const options = slotReq.switchOptions.filter((t) => !takenSwitches.includes(t));
          const teamIndex = await this.partyMenu({ title: `Switch ${mon.name} with…`, options, canCancel: true, summary: true });
          resolve(teamIndex === null ? await this.commandMenu(slotReq, canGoBack, takenSwitches, reserved)
            : { slot: slotReq.slot, type: "switch", teamIndex });
        }
      };
      menu.querySelector(".fight").focus();
    });
  }

  moveMenu(slotReq, mon) {
    return new Promise((resolve) => {
      if (slotReq.struggle) {
        resolve({ slot: slotReq.slot, type: "move", move: 0 });
        return;
      }
      const buttons = slotReq.moves.map((m) => {
        const data = this.data.moves[m.id];
        return `
        <button class="btn move-btn" data-move="${m.index}" ${m.disabled ? "disabled" : ""}
          style="--type: var(--t-${m.type === "???" ? "unknown" : m.type})">
          <span class="move-name">${m.name}</span>
          <span class="move-meta">
            <span class="type-pill">${m.type}</span>
            <span class="cat-pill ${data.category}">${CATEGORY_LABEL[data.category]}</span>
            <span>PP ${m.pp}/${m.maxPp}</span>
          </span>
          <span class="move-power">${data.power ? `Pow ${data.power}` : "—"} · ${data.accuracy ? `Acc ${data.accuracy}` : "Acc —"}</span>
        </button>`;
      }).join("");
      const menu = this.setMenu(`
        <div class="move-info" id="moveInfo"></div>
        <div class="move-grid">${buttons}</div>
        <div class="menu-footer"><button class="btn" data-back>◀ Back</button></div>`);
      const info = menu.querySelector("#moveInfo");
      const showInfo = (index) => {
        const m = slotReq.moves[index];
        const data = this.data.moves[m.id];
        info.innerHTML = `
          <div class="move-info-head"><b>${data.name}</b> <span class="cat-pill ${data.category}">${CATEGORY_LABEL[data.category]}</span>
            <span class="move-info-stats">${moveStats(data, { withCategory: false })}</span></div>
          <div class="move-info-effect" title="${data.shortEffect}">${data.shortEffect || "No extra effect."}</div>
          <div class="move-info-target">Hits: ${TARGET_LABEL[data.target] ?? data.target}</div>`;
      };
      showInfo(slotReq.moves.findIndex((m) => !m.disabled) >= 0 ? slotReq.moves.findIndex((m) => !m.disabled) : 0);
      const onPoint = (ev) => {
        const btn = ev.target.closest(".move-btn");
        if (btn) showInfo(Number(btn.dataset.move));
      };
      menu.addEventListener("mouseover", onPoint);
      menu.addEventListener("focusin", onPoint);
      menu.onclick = async (ev) => {
        const btn = ev.target.closest("button");
        if (!btn) return;
        if (btn.hasAttribute("data-back")) { resolve("back"); return; }
        const index = Number(btn.dataset.move);
        const move = slotReq.moves[index];
        const self = this.battle.monAt(PLAYER, slotReq.slot);
        const targets = this.battle.targetOptions(self, move.id);
        if (!targets.length) { resolve({ slot: slotReq.slot, type: "move", move: index }); return; }
        if (targets.length === 1) { resolve({ slot: slotReq.slot, type: "move", move: index, target: targets[0] }); return; }
        const target = await this.targetMenu(move, targets);
        resolve(target === null ? await this.moveMenu(slotReq, mon) : { slot: slotReq.slot, type: "move", move: index, target });
      };
      menu.querySelector(".move-btn:not(:disabled)")?.focus();
    });
  }

  targetMenu(move, targets) {
    return new Promise((resolve) => {
      const cell = (side, slot) => {
        const valid = targets.find((t) => t.side === side && t.slot === slot);
        const mon = this.battle.monAt(side, slot);
        if (!mon || mon.fainted) return `<button class="btn target-btn ${side === FOE ? "foe" : "ally"}" disabled></button>`;
        const img = this.data.pokemonByKey[mon.species].sprites.front;
        return `<button class="btn target-btn ${side === FOE ? "foe" : "ally"}" data-side="${side}" data-slot="${slot}" ${valid ? "" : "disabled"}>
          <img src="${img}" alt="">
          <span><span class="who">${side === FOE ? "Foe" : "Ally"}</span><br><span class="tname">${mon.name}</span></span>
        </button>`;
      };
      const menu = this.setMenu(`
        <div class="menu-title">Use <b>${move.name}</b> on…</div>
        <div class="target-grid">${cell(FOE, 0)}${cell(FOE, 1)}${cell(PLAYER, 0)}${cell(PLAYER, 1)}</div>
        <div class="menu-footer"><button class="btn" data-back>◀ Back</button></div>`);
      menu.onclick = (ev) => {
        const btn = ev.target.closest("button");
        if (!btn) return;
        if (btn.hasAttribute("data-back")) { resolve(null); return; }
        resolve({ side: Number(btn.dataset.side), slot: Number(btn.dataset.slot) });
      };
      menu.querySelector(".target-btn:not(:disabled)")?.focus();
    });
  }

  // Use a bag item (takes this Pokémon's turn)
  async bagMenu(slotReq, bag, reserved) {
    const item = await new Promise((resolve) => {
      const buttons = bag.map((b) => `
        <button class="btn party-card" data-item="${b.id}">
          <img src="images/items/${b.id}.png" alt="" onerror="this.style.visibility='hidden'">
          <span class="pname">${b.name}</span>
          <span class="pinfo">×${b.count - (reserved[b.id] ?? 0)}</span>
        </button>`).join("");
      const menu = this.setMenu(`
        <div class="menu-title">Use an item (uses this Pokémon's turn)</div>
        <div class="party-grid">${buttons}</div>
        <div class="menu-footer"><button class="btn" data-back>◀ Back</button></div>`);
      menu.onclick = (ev) => {
        const btn = ev.target.closest("button");
        if (!btn) return;
        resolve(btn.hasAttribute("data-back") ? null : btn.dataset.item);
      };
    });
    if (!item) return null;
    const side = this.battle.state.sides[PLAYER];
    const options = side.team.filter((m) => !m.fainted).map((m) => m.teamIndex);
    const name = bag.find((b) => b.id === item).name;
    const teamIndex = await this.partyMenu({ title: `Use ${name} on…`, options, canCancel: true });
    if (teamIndex === null) return this.bagMenu(slotReq, bag, reserved);
    return { slot: slotReq.slot, type: "item", item, teamIndex };
  }

  // Pick a team member. Returns teamIndex or null (cancelled). All six fit: 2 columns × 3 rows.
  // summary: tapping a Pokémon first shows everything about it (HP, ability, item, stats, moves
  // with PP) with a "Send out" button, so you can decide before switching. Works for Pokémon
  // that can't be picked too (in battle, fainted): the button then says why.
  partyMenu({ title, options, canCancel, summary = false }) {
    const side = this.battle.state.sides[PLAYER];
    const hpClass = (m) => { const pct = m.hp / m.maxHp; return pct <= 0.2 ? "red" : pct <= 0.5 ? "yellow" : ""; };
    const spriteOf = (m) => this.data.pokemonByKey[m.species].sprites[m.shiny ? "frontShiny" : "front"];
    return new Promise((resolve) => {
      const grid = () => {
        const cards = side.team.map((m) => {
          const active = side.active.includes(m.teamIndex);
          const selectable = options.includes(m.teamIndex);
          const pct = m.hp / m.maxHp;
          return `<button class="btn party-card ${m.fainted ? "fainted" : active ? "active-mon" : ""} ${summary && !selectable ? "unavailable" : ""}" data-team="${m.teamIndex}" ${selectable || summary ? "" : "disabled"}>
            <img src="${spriteOf(m)}" alt="">
            <span class="pname">${m.name} <span class="pinfo">Lv${m.level}</span></span>
            <span class="hpbar"><i class="${hpClass(m)}" style="width:${pct * 100}%"></i></span>
            <span class="pinfo">${m.fainted ? "Fainted" : `${m.hp}/${m.maxHp} HP`}${m.status ? ` · ${m.status.toUpperCase()}` : ""}${active ? " · In battle" : ""}</span>
          </button>`;
        }).join("");
        const menu = this.setMenu(`
          <div class="menu-title">${title}${summary ? ` <small>· tap one for details</small>` : ""}</div>
          <div class="party-grid">${cards}</div>
          ${canCancel ? `<div class="menu-footer"><button class="btn" data-back>◀ Back</button></div>` : ""}`);
        menu.onclick = (ev) => {
          const btn = ev.target.closest("button");
          if (!btn || btn.disabled) return;
          if (btn.hasAttribute("data-back")) { resolve(null); return; }
          const teamIndex = Number(btn.dataset.team);
          if (summary) details(side.team[teamIndex]);
          else resolve(teamIndex);
        };
        menu.querySelector(".party-card:not(:disabled):not(.unavailable)")?.focus();
      };

      const details = (m) => {
        const species = this.data.pokemonByKey[m.species];
        const ability = this.data.abilities[m.ability];
        const [up, down] = NATURES[m.nature] ?? [];
        const active = side.active.includes(m.teamIndex);
        const canSend = options.includes(m.teamIndex);
        const why = m.fainted ? "Fainted" : active ? "Already in battle" : "Can't switch in";
        const gender = m.gender ? `<span class="gender ${m.gender}">${m.gender === "M" ? "♂" : "♀"}</span>` : "";
        const SHORT = { atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe" };
        const stat = (k) => `<span class="${k === up ? "up" : k === down ? "down" : ""}" title="${STAT_NAMES[k]}"><small>${SHORT[k]}</small>${m.stats[k]}</span>`;
        const moves = m.moves.map((mv) => {
          const info = this.data.moves[mv.id];
          return `<div class="sum-move" style="--type: var(--t-${info.type})" title="${info.shortEffect ?? ""}">
            <b>${info.name}</b>
            <span>${info.type} · ${CATEGORY_LABEL[info.category]}</span>
            <span>Pow ${info.power ?? "—"} · Acc ${info.accuracy ?? "—"} · PP ${mv.pp}/${mv.maxPp}</span>
          </div>`;
        }).join("");
        const menu = this.setMenu(`
          <div class="sum">
            <div class="sum-top">
              <img src="${spriteOf(m)}" alt="">
              <div class="sum-info">
                <div class="sum-name"><b>${m.name}</b>${gender} <span class="pinfo">Lv${m.level}</span>
                  ${m.types.map((t) => `<span class="sum-type" style="background: var(--t-${t})">${t}</span>`).join("")}</div>
                <div class="sum-hp"><span class="hpbar"><i class="${hpClass(m)}" style="width:${(m.hp / m.maxHp) * 100}%"></i></span>
                  <span class="pinfo">${m.fainted ? "Fainted" : `${m.hp}/${m.maxHp}`}${m.status ? ` ${m.status.toUpperCase()}` : ""}</span></div>
                <div class="pinfo sum-ability"><b>${ability?.name ?? m.ability}</b>${species.abilities.hidden === m.ability ? " (HA)" : ""}: ${ability?.shortEffect ?? ""}</div>
                <div class="pinfo">Item: <b>${m.item ? itemInfo(m.item).name : "none"}</b> · ${m.nature[0].toUpperCase()}${m.nature.slice(1)}</div>
              </div>
            </div>
            <div class="sum-stats">${["atk", "def", "spa", "spd", "spe"].map(stat).join("")}</div>
            <div class="sum-moves">${moves}</div>
          </div>
          <div class="menu-footer">
            <button class="btn" data-back>◀ Back</button>
            <button class="btn primary" data-send ${canSend ? "" : "disabled"}>${canSend ? "Send out" : why}</button>
          </div>`);
        menu.onclick = (ev) => {
          const btn = ev.target.closest("button");
          if (!btn || btn.disabled) return;
          if (btn.hasAttribute("data-back")) { grid(); return; }
          if (btn.hasAttribute("data-send")) resolve(m.teamIndex);
        };
        menu.querySelector("[data-send]:not(:disabled)")?.focus();
      };

      grid();
    });
  }

  async collectReplacements(req) {
    const picks = [];
    for (const { slot } of req.slots) {
      const options = req.options.filter((t) => !picks.some((p) => p.teamIndex === t));
      const teamIndex = await this.partyMenu({ title: "Choose a Pokémon to send out", options, canCancel: false, summary: true });
      picks.push({ slot, teamIndex });
    }
    return picks;
  }
}
