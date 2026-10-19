// =====================================================
// RUN SCREENS
// -----------------------------------------------------
// Title, new-run setup, draft, hub (team management),
// recruit & item cards, run over, Hall of Fame.
// Battles are handed to BattleScreen.
// =====================================================

import { Battle } from "../engine/battle.js";
import { BattleScreen, moveStats, CATEGORY_LABEL } from "./battle-screen.js";
import { startTitleBanner } from "./title-banner.js";
import { terrainFor } from "./terrain.js";
import { CHARACTERS, GEN_LABELS, characterById } from "../game/characters.js";
import { SPRITE_MODES, applySpriteMode } from "../game/sprite-mode.js";
import { isUnlocked, unlockText, unlockedIds } from "../game/unlocks.js";
import { VERSION } from "../version.js";
import * as Run from "../game/run.js";
import { loadMeta, saveMeta, buyUpgrade, canBuyUpgrade, upgradeLevel, perksFromMeta, trainerPointsFor, recordRun } from "../game/meta.js";
import { ITEMS, POCKETS, pocketOf, itemInfo, itemSprite } from "../game/item-catalog.js";
import { itemLabel } from "../game/pokedex.js";
import { calcStats, DEFAULT_IVS, DEFAULT_EVS } from "../engine/pokemon.js";
import { NATURES, STAT_NAMES } from "../engine/constants.js";

const RUN_KEY = "pd.run";
const HOF_KEY = "pd.hallOfFame";
const DETAIL_TABS = [
  { id: "stats", label: "Stats", icon: "protein" },
  { id: "abilities", label: "Abilities", icon: "ability-patch" },
  { id: "evolution", label: "Evolution", icon: "everstone" },
  { id: "moves", label: "Moves", icon: "tm-normal" },
];
const STOP_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "E1", "E2", "E3", "E4", "C", "R"];

const store = {
  get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked/full */ } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } },
};

export class RunUI {
  constructor(ctx) {
    this.ctx = ctx;
    this.hub = document.getElementById("hub");
    this.app = document.getElementById("app");
    this.run = null;
    this.preview = false; // debug panel preview: nothing is saved (see dev-tools.js)
    this.battleScreen = null;
    try { this.showEffects = localStorage.getItem("pd.showEffects") === "1"; } catch { this.showEffects = false; }
    try { this.teamView = localStorage.getItem("pd.teamView") === "grid" ? "grid" : "detailed"; } catch { this.teamView = "detailed"; }
  }

  save() { if (this.run && !this.preview) store.set(RUN_KEY, this.run); }

  // Remember which screen is open, so the debug option "stay on this screen" can come back to it after a reload
  trackView(name) {
    if (this.preview) return;
    try { sessionStorage.setItem("pd.dev.view", name); } catch { /* ignore */ }
  }

  // Used by the debug panel: show a screen that isn't part of a run, or continue the saved run
  openView(name) {
    if (name === "setup") this.renderSetup();
    else if (name === "upgrades") this.renderUpgrades();
    else if (name === "hof") this.renderHallOfFame();
    else this.start();
  }
  resumeSaved() {
    const saved = store.get(RUN_KEY);
    if (!saved || ["over", "won"].includes(saved.screen)) return false;
    this.run = saved;
    this.render();
    return true;
  }

  showHub() {
    this.battleScreen?.destroy();
    this.battleScreen = null;
    this.app.hidden = true; this.hub.hidden = false; window.scrollTo(0, 0);
  }
  showBattle() { this.hub.hidden = true; this.app.hidden = false; this.lastScreen = "battle"; }

  // ===============================
  // ROUTING
  // ===============================

  start() {
    const saved = store.get(RUN_KEY);
    this.renderTitle(saved && !["over", "won"].includes(saved.screen) ? saved : null);
  }

  render() {
    const run = this.run;
    this.trackView("run");
    this.save();
    // Staying on the same screen (e.g. after giving an item): keep the scroll
    // position and any move descriptions that were opened
    const sameScreen = this.lastScreen === run.screen && !this.hub.hidden;
    const scrollY = window.scrollY;
    const openCards = sameScreen
      ? [...this.hub.querySelectorAll(".move-card.open[data-key]")].map((c) => c.dataset.key)
      : [];
    this.lastScreen = run.screen;

    switch (run.screen) {
      case "draft": case "recruit": this.renderRecruitOffer(); break;
      case "items": this.renderItemOffer(); break;
      case "hub": this.renderHubScreen(); break;
      case "battle": this.renderBattle(); return;
      case "over": this.renderOver(); return;
      case "won": this.renderWon(); return;
    }

    if (sameScreen) {
      for (const key of openCards) {
        const card = this.hub.querySelector(`.move-card[data-key="${key}"]`);
        card?.classList.add("open");
        card?.querySelector(".mc-toggle")?.setAttribute("aria-expanded", "true");
      }
      window.scrollTo(0, scrollY);
    }
  }

  // ===============================
  // TITLE & SETUP
  // ===============================

  renderTitle(savedRun) {
    this.trackView("title");
    this.showHub();
    const hof = store.get(HOF_KEY) ?? [];
    const meta = loadMeta();
    this.hub.className = "hub title-screen";
    this.hub.innerHTML = `
      <div class="logo">Pokémon Double</div>
      <div class="title-banner" aria-hidden="true"></div>
      <p>A doubles gauntlet. Pick a generation, draft your starters and beat every gym, the Elite Four, the Champion and your Rival.<br>
      Fainted Pokémon are gone for good.</p>
      <div class="menu-list">
        ${savedRun ? `<button class="btn primary" data-act="continue">Continue run</button>` : ""}
        <button class="btn ${savedRun ? "" : "primary"}" data-act="new">New run</button>
        <button class="btn" data-act="upgrades">Trainer Upgrades <span class="tp-pill">${meta.tp} TP</span></button>
        <button class="btn" data-act="hof" ${hof.length ? "" : "disabled"}>Hall of Fame (${hof.length})</button>
      </div>
      ${savedRun ? `<p class="empty-note">Saved run: Gen ${savedRun.settings.gen}, next battle #${savedRun.order}, ${savedRun.team.length} Pokémon. Starting a new run replaces it.</p>` : ""}
      <p class="credits">Fan project, not for sale. Pokémon © Nintendo / Creatures / Game Freak / The Pokémon Company.<br>
        Pokémon &amp; item sprites and data: PokeAPI. Trainer sprites: Pokémon Showdown and its sprite artists.
        Player back sprites: Bulbagarden Archives.</p>
      <p class="version-tag">v${VERSION}</p>`;
    startTitleBanner(this.hub.querySelector(".title-banner"), this.ctx.data, this.ctx.leaders,
      () => characterById(loadMeta().character).back);
    this.hub.onclick = (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "continue") { this.run = savedRun; this.render(); }
      if (act === "new") this.renderSetup();
      if (act === "hof") this.renderHallOfFame();
      if (act === "upgrades") this.renderUpgrades();
    };
  }

  renderUpgrades() {
    this.trackView("upgrades");
    this.showHub();
    const meta = loadMeta();
    const upgrades = this.ctx.rules.upgrades;
    this.hub.className = "hub";
    this.hub.innerHTML = `
      <div class="offer-head">
        <div><h1>Trainer Upgrades</h1>
          <p>Earn Trainer Points (TP) at the end of every run, won or lost. Upgrades are permanent and apply to new runs.</p></div>
        <div class="row-buttons"><span class="tp-pill big">${meta.tp} TP</span><button class="btn" data-act="title">◀ Title</button></div>
      </div>
      <div class="upgrade-grid">${upgrades.map((u) => {
        const level = upgradeLevel(meta, u.id);
        const maxed = level >= u.max;
        return `<div class="upgrade-card ${maxed ? "maxed" : ""}">
          <div class="upgrade-top"><h3>${u.name}</h3><span class="pips">${Array.from({ length: u.max }, (_, i) => `<i class="${i < level ? "on" : ""}"></i>`).join("")}</span></div>
          <p>${u.effect}</p>
          <button class="btn small" data-buy="${u.id}" ${canBuyUpgrade(meta, u) ? "" : "disabled"}>${maxed ? "Maxed" : `Buy · ${u.cost} TP`}</button>
        </div>`;
      }).join("")}</div>
      <p class="empty-note">Runs so far: ${meta.runs} · TP earned in total: ${meta.earned}</p>`;
    this.hub.onclick = async (e) => {
      if (e.target.closest("[data-act]")?.dataset.act === "title") { this.start(); return; }
      const id = e.target.closest("[data-buy]")?.dataset.buy;
      if (!id) return;
      const u = upgrades.find((x) => x.id === id);
      const ok = await this.modal({
        title: `Buy ${u.name}?`,
        body: `<p>${u.effect}</p><p>Costs ${u.cost} TP. You have ${meta.tp} TP.</p>`,
        options: [{ value: true, label: `Yes, buy for ${u.cost} TP` }],
        cancel: "Not now",
      });
      if (!ok) return;
      buyUpgrade(meta, u);
      saveMeta(meta);
      this.renderUpgrades();
    };
  }

  renderSetup() {
    this.trackView("setup");
    this.hub.className = "hub";
    const meta = loadMeta();
    const unlocks = this.ctx.rules.characterUnlocks ?? {};
    const locked = (c) => !isUnlocked(meta, unlocks[c.id]);
    if (locked(characterById(meta.character))) { meta.character = "lucas"; saveMeta(meta); } // a character that is still locked
    const gens = [1, 2, 3, 4, 5].map((g) => {
      const file = this.ctx.leaders[g];
      const pools = this.ctx.rules.teamPools?.[g] ?? {};
      const built = file.opponents.filter((o) => o.id === "rival" ? o.options.every((r) => pools[`rival-${r.id}`]) : pools[o.id]).length;
      return `<label class="choice"><input type="radio" name="gen" value="${g}" ${g === 1 ? "checked" : ""}>
        Gen ${g} · ${file.region} <small>${built}/14 team pools ready</small></label>`;
    }).join("");
    const pools = [1, 2, 3, 4, 5].map((g) => `<label class="choice"><input type="checkbox" name="pool" value="${g}" checked> Gen ${g}</label>`).join("");
    this.hub.innerHTML = `
      <h1>New run</h1>
      <section class="card-panel character-picker" aria-label="Choose your character">
        <h2>Your character</h2>
        <p>Your sprite is only for looks: the opponent can be the same trainer. Win runs, collect trophies and beat battles to unlock more trainers
          (${CHARACTERS.filter((c) => !locked(c)).length}/${CHARACTERS.length} unlocked).</p>
        ${[1, 2, 3, 4, 5].map((g) => `<h3 class="character-gen">${GEN_LABELS[g]}</h3>
        <div class="characters" role="radiogroup" aria-label="${GEN_LABELS[g]}">${CHARACTERS.filter((c) => c.gen === g).map((c) => `
          <button class="character ${c.id === meta.character ? "selected" : ""} ${locked(c) ? "locked" : ""}" role="radio" aria-checked="${c.id === meta.character}"
            data-act="character" data-id="${c.id}" title="${locked(c) ? `Locked: ${unlockText(unlocks[c.id])}` : c.name}" ${locked(c) ? "disabled" : ""}>
            <img src="${c.front}" alt=""><span>${locked(c) ? "🔒 " : ""}${c.name}</span>
            ${locked(c) ? `<small>${unlockText(unlocks[c.id])}</small>` : ""}
          </button>`).join("")}</div>`).join("")}
      </section>
      <section class="card-panel">
        <h2>Pokémon sprites</h2>
        <p>Applies to every battle and screen. You can change it again here before any run.</p>
        <div class="choice-row">${SPRITE_MODES.map((m) => `<label class="choice"><input type="radio" name="sprites" value="${m.id}" ${m.id === meta.sprites ? "checked" : ""}>
          ${m.label} <small>${m.hint}</small></label>`).join("")}</div>
      </section>
      <section class="card-panel">
        <h2>Challenge Gen</h2>
        <p>Which gyms, Elite Four, Champion and Rival you fight. Each opponent's team is drawn at random from their team pool.</p>
        <div class="choice-row">${gens}</div>
      </section>
      <section class="card-panel">
        <h2>Pokémon Pool</h2>
        <p>Which generations your recruits can come from.</p>
        <div class="choice-row">${pools}</div>
      </section>
      <div class="row-buttons">
        <button class="btn" data-act="back">◀ Back</button>
        <button class="btn primary" data-act="go">Start the draft</button>
      </div>`;
    this.hub.onchange = (e) => {
      if (e.target.name !== "sprites") return;
      const m = loadMeta();
      m.sprites = e.target.value;
      saveMeta(m);
      applySpriteMode(this.ctx.data, m.sprites);
    };
    this.hub.onclick = (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "back") this.start();
      if (act === "character") {
        const id = e.target.closest("[data-id]").dataset.id;
        const m = loadMeta();
        m.character = id;
        saveMeta(m);
        for (const b of this.hub.querySelectorAll(".character")) {
          b.classList.toggle("selected", b.dataset.id === id);
          b.setAttribute("aria-checked", String(b.dataset.id === id));
        }
      }
      if (act === "go") {
        const gen = Number(this.hub.querySelector("input[name=gen]:checked").value);
        const pools = [...this.hub.querySelectorAll("input[name=pool]:checked")].map((i) => Number(i.value));
        if (!pools.length) { alert("Pick at least one generation for the Pokémon Pool."); return; }
        const meta = loadMeta();
        this.run = Run.newRun(this.ctx, { gen, pools, perks: perksFromMeta(meta), character: meta.character });
        this.render();
      }
    };
  }

  // ===============================
  // SHARED PIECES
  // ===============================

  sprite(mon, back = false) {
    const s = this.ctx.data.pokemonByKey[mon.species].sprites;
    return back ? (mon.shiny ? s.backShiny : s.back) : (mon.shiny ? s.frontShiny : s.front);
  }

  typeBadges(species) {
    return this.ctx.data.pokemonByKey[species].types.map((t) => `<span class="type-badge" style="background: var(--t-${t})">${t}</span>`).join(" ");
  }

  // Every ability the species can have; the active one gets an arrow and full opacity
  abilityList(mon) {
    const { normal, hidden } = this.ctx.data.pokemonByKey[mon.species].abilities;
    const all = [...normal.map((a) => ({ id: a, hidden: false })), ...(hidden ? [{ id: hidden, hidden: true }] : [])];
    return `<ul class="ability-list" aria-label="Abilities">${all.map(({ id, hidden: ha }) => {
      const info = this.ctx.data.abilities[id];
      const active = id === mon.ability;
      return `<li class="${active ? "active" : ""}" title="${info?.shortEffect ?? ""}">
        <span class="ab-arrow" aria-hidden="true">${active ? "▶" : ""}</span>
        <span class="ab-name">${info?.name ?? id}</span>${ha ? `<span class="ab-ha">HA</span>` : ""}
        ${active ? `<span class="sr-only">(active)</span>` : ""}
      </li>`;
    }).join("")}</ul>`;
  }

  // Details window: every possible ability with its full description (no hover needed)
  abilityDetails(mon) {
    const { normal, hidden } = this.ctx.data.pokemonByKey[mon.species].abilities;
    const all = [...normal.map((id) => ({ id, ha: false })), ...(hidden ? [{ id: hidden, ha: true }] : [])];
    return `<ul class="ability-full">${all.map(({ id, ha }) => {
      const info = this.ctx.data.abilities[id];
      const active = id === mon.ability;
      return `<li class="${active ? "active" : ""}">
        <div class="ab-head"><span class="ab-arrow" aria-hidden="true">${active ? "▶" : ""}</span><b>${info?.name ?? id}</b>
          ${ha ? `<span class="ab-ha">Hidden</span>` : ""}${active ? `<span class="ab-now">Current</span>` : ""}</div>
        <p>${info?.shortEffect ?? "No description."}</p>
      </li>`;
    }).join("")}</ul>`;
  }

  abilityText(mon) {
    const p = this.ctx.data.pokemonByKey[mon.species];
    const name = this.ctx.data.abilities[mon.ability]?.name ?? mon.ability;
    return p.abilities.hidden === mon.ability ? `${name} <b title="Hidden Ability">(HA)</b>` : name;
  }

  // One move as a card: name, type, category, power, accuracy, PP and what it does.
  // compact: no description (used on the narrow recruit cards)
  // toggle: show an "Effect" button to open/close the description (team builder)
  moveCard(id, { compact = false, toggle = false, key = "" } = {}) {
    const m = this.ctx.data.moves[id];
    const plain = /^Inflicts regular damage( with no additional effect)?\.?$/i.test(m.shortEffect ?? "");
    const desc = !m.shortEffect || plain ? "Just damage, no extra effect." : m.shortEffect;
    return `
      <div class="move-card ${compact ? "compact" : ""}" ${key ? `data-key="${key}"` : ""} data-type="${m.type}" style="--type: var(--t-${m.type})" title="${m.name} · ${moveStats(m)}\n${desc}">
        <div class="mc-name">${m.name}</div>
        <div class="mc-tags"><span class="mc-type">${m.type}</span><span class="cat-pill ${m.category}">${CATEGORY_LABEL[m.category]}</span></div>
        <div class="mc-stats">
          <span><small>Pow</small>${m.power ?? "—"}</span>
          <span><small>Acc</small>${m.accuracy ?? "—"}</span>
          <span><small>PP</small>${m.pp}</span>
        </div>
        ${compact ? "" : `
        ${toggle ? `<button class="mc-toggle" data-act="toggle-desc" type="button" aria-expanded="false">Effect <span aria-hidden="true">▾</span></button>` : ""}
        <div class="mc-desc-box"><div class="mc-desc">${desc}</div></div>`}
      </div>`;
  }

  // opts.keyPrefix: gives each card a stable key (used to keep opened descriptions open)
  moveGrid(moves, opts = {}) {
    return `<div class="move-cards">${moves.map((id, i) => this.moveCard(id, { ...opts, key: opts.keyPrefix ? `${opts.keyPrefix}:${i}:${id}` : "" })).join("")}</div>`;
  }

  // "Pebbles ♂ (Geodude)": nickname first, species in small text
  monName(mon) {
    const p = this.ctx.data.pokemonByKey[mon.species];
    const gender = mon.gender ? ` <span class="gender ${mon.gender}" style="color:${mon.gender === "M" ? "#3878f8" : "#f05078"}">${mon.gender === "M" ? "♂" : "♀"}</span>` : "";
    const species = mon.nickname && mon.nickname !== p.name ? ` <span class="species-name">${p.name}</span>` : "";
    return `${mon.nickname ?? p.name}${gender}${mon.shiny ? ` <span class="shiny" title="Shiny">★</span>` : ""}${species}`;
  }

  // ===============================
  // TRAINERS
  // ===============================

  trainerSprites(opp) {
    const ids = opp.order === Run.FINAL_ORDER ? [this.run.rival.id]
      : opp.id === "tate-and-liza" ? ["tate", "liza"] : [opp.id];
    return ids.map((id) => `images/trainers/${id}.png`);
  }

  partyBalls(count, fainted = 0) {
    return `<span class="party-balls" aria-label="${count} Pokémon">${Array.from({ length: count }, (_, i) =>
      `<img src="images/ui/ball.png" alt="" class="${i >= count - fainted ? "out" : ""}">`).join("")}</span>`;
  }

  itemImg(id) {
    return `<img src="${itemSprite(id)}" alt="" onerror="this.style.visibility='hidden'">`;
  }

  track() {
    const order = this.run.order;
    // On the recruit/item screens the current battle is already won
    const beaten = ["recruit", "items"].includes(this.run.screen) ? order : order - 1;
    return `<div class="track">${STOP_LABELS.map((label, i) => {
      const n = i + 1;
      const cls = n <= beaten ? "done" : n === beaten + 1 && this.run.screen === "hub" ? "current" : "";
      return `${i === 8 || i === 12 ? `<span class="sep"></span>` : ""}<span class="stop ${cls}" title="Battle ${n}">${label}</span>`;
    }).join("")}</div>`;
  }

  // Generic choice dialog → resolves with an option's value, or null when cancelled
  // layout "cards": options are shown as a 2-column grid of cards (e.g. move cards)
  // nav: shows ◀ ▶ around the title (also arrow keys and swipe); resolves with { nav: -1 | 1 }
  // Buttons inside the body with data-result='{"…":…}' close the dialog with that object.
  // onOpen(dialogElement): runs once the dialog is on screen (e.g. to wire up tabs)
  modal({ title, label = "", body = "", head = "", options = [], cancel = "Cancel", layout = "list", wide = false, nav = false, onOpen = null }) {
    return new Promise((resolve) => {
      const backdrop = document.createElement("div");
      backdrop.className = `modal-backdrop ${layout === "cards" || wide ? "wide" : ""} ${layout === "actions" ? "details" : ""}`;
      // Three parts: a fixed top (head + title), a scrolling middle, a fixed bottom (Close)
      backdrop.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true" ${label ? `aria-label="${label}"` : ""}>
          <div class="modal-head">${head}${title ? `<h2>${title}</h2>` : ""}</div>
          <div class="modal-body">
            ${body ? `<div>${body}</div>` : ""}
            <div class="options ${layout === "cards" ? "card-options" : layout === "actions" ? "action-options" : ""}">
              ${options.map((o, i) => `<button class="${layout === "cards" ? "card-choice" : layout === "actions" ? "btn small" : "btn"}" data-i="${i}" ${o.disabled ? "disabled" : ""}>${o.html ?? o.label}</button>`).join("")}
            </div>
          </div>
          ${cancel ? `<div class="modal-foot"><button class="btn" data-cancel>${cancel}</button></div>` : ""}
        </div>`;
      const close = (value) => { backdrop.remove(); document.removeEventListener("keydown", onKey); resolve(value); };
      const onKey = (e) => {
        if (e.key === "Escape" && cancel) close(null);
        if (nav && (e.key === "ArrowLeft" || e.key === "ArrowRight")) close({ nav: e.key === "ArrowLeft" ? -1 : 1 });
      };
      document.addEventListener("keydown", onKey);
      backdrop.onclick = (e) => {
        if (e.target === backdrop && cancel) return close(null);
        const btn = e.target.closest("button");
        if (!btn || btn.disabled) return;
        if (btn.hasAttribute("data-cancel")) return close(null);
        if (btn.dataset.result) return close(JSON.parse(btn.dataset.result));
        if (btn.dataset.i === undefined) return; // buttons inside the body (e.g. effect toggles)
        close(options[Number(btn.dataset.i)].value);
      };
      // Swipe left / right on phones to flip through Pokémon
      if (nav) {
        let start = null;
        backdrop.addEventListener("touchstart", (e) => { start = e.touches[0]; }, { passive: true });
        backdrop.addEventListener("touchend", (e) => {
          if (!start) return;
          const dx = e.changedTouches[0].clientX - start.clientX;
          const dy = e.changedTouches[0].clientY - start.clientY;
          start = null;
          if (Math.abs(dx) > 70 && Math.abs(dy) < 50) close({ nav: dx > 0 ? -1 : 1 });
        });
      }
      document.body.appendChild(backdrop);
      // Focus the first button without scrolling the window down to it
      backdrop.querySelector(".modal-body button:not(:disabled), .modal-foot button")?.focus({ preventScroll: true });
      backdrop.querySelector(".modal-body").scrollTop = 0;
      onOpen?.(backdrop.querySelector(".modal"));
    });
  }

  // "Who is this for" row at the top of move dialogs
  dialogMon(mon) {
    const i = this.run.team.indexOf(mon);
    return `<div class="dialog-mon"><img src="${this.sprite(mon)}" alt="">
      <div><b>${this.monName(mon)}</b><small>Lv ${mon.level} · ${i + 1}/${this.run.team.length}</small>
      <div class="dialog-moves">Knows: ${mon.moves.map((m) => this.ctx.data.moves[m].name).join(", ")}</div></div></div>`;
  }

  // Team member next to this one (wraps around): for ◀ ▶ in dialogs
  neighbour(mon, step) {
    const team = this.run.team;
    const i = team.indexOf(mon);
    return team[(i + step + team.length) % team.length];
  }

  // Team position buttons on the hub's detailed cards: tap a slot to swap places with whoever is there
  slotStrip(mon) {
    const team = this.run.team;
    const here = team.indexOf(mon);
    return `<div class="slot-strip" role="group" aria-label="Team position">
      <span class="slot-label">Position</span>
      ${team.map((m, j) => `<button class="slot ${j === here ? "current" : ""} ${j < 2 ? "lead" : ""}" data-act="slot" data-uid="${mon.uid}" data-slot="${j}"
          ${j === here ? `aria-current="true" disabled` : ""} title="Slot ${j + 1}${j < 2 ? " (lead)" : ""}: ${j === here ? "here" : `swap with ${this.ctx.data.pokemonByKey[m.species].name}`}"><span>${j + 1}</span></button>`).join("")}
    </div>`;
  }

  // Selector at the top of the dialogs: one sprite per Pokémon, tap to look at that one
  monStrip(mon) {
    const team = this.run.team;
    if (team.length < 2) return "";
    return `<div class="mon-strip" role="group" aria-label="Choose a Pokémon">${team.map((m, j) => `
      <button class="mon-pick ${m === mon ? "current" : ""} ${j < 2 ? "lead" : ""}" data-result='{"goto":${m.uid}}' ${m === mon ? `aria-current="true"` : ""}
        title="${this.ctx.data.pokemonByKey[m.species].name}${j < 2 ? " (lead)" : ""}"><img src="${this.sprite(m)}" alt="${this.ctx.data.pokemonByKey[m.species].name}"></button>`).join("")}</div>`;
  }

  // ===============================
  // RECRUIT OFFER (draft too)
  // ===============================

  renderRecruitOffer() {
    this.showHub();
    const run = this.run;
    const offer = run.offer;
    const starter = offer.starter;
    this.hub.className = "hub";
    const multi = offer.picksLeft > 1;
    const cards = offer.options.map((o, i) => {
      const m = o.spec;
      const p = this.ctx.data.pokemonByKey[m.species];
      const nature = m.nature.charAt(0).toUpperCase() + m.nature.slice(1);
      return `
        <button class="offer-card tier-${o.tier} ${o.taken ? "taken" : ""}" data-pick="${i}" style="animation-delay:${i * 80}ms"
          role="${multi ? "checkbox" : "radio"}" aria-checked="false" ${o.taken || offer.picksLeft <= 0 ? "disabled" : ""}>
          <span class="select-mark" aria-hidden="true"></span>
          <span class="tier">${o.tier}${o.taken ? " · picked" : ""}</span>
          <img class="big" src="${this.sprite(m)}" alt="">
          <span class="name">${this.monName(m)}</span>
          <span>${this.typeBadges(m.species)}</span>
          <span class="detail">Lv ${m.level} · ${nature}</span>
          ${this.abilityList(m)}
          ${this.moveGrid(m.moves, { compact: true })}
          <span class="detail">Base stat total ${p.bst}</span>
        </button>`;
    }).join("");
    const headline = starter ? "Choose your starters"
      : `You beat ${run.lastBattle?.opponent}! Recruit time`;
    const replacement = offer.replacementPicks ? ` Includes ${offer.replacementPicks} replacement pick${offer.replacementPicks > 1 ? "s" : ""} for the Pokémon you lost.` : "";
    const rerollTip = this.rerollsLeft(offer) > 0 && offer.picksLeft > 1 ? ` Not happy with the rest? Confirm your picks first, then use the reroll: cards you picked stay, the others are replaced.` : "";
    const sub = starter ? `Select ${offer.picksLeft} of ${offer.options.length}, then confirm. They'll fight Gym 1 at level ${offer.level}.${rerollTip}`
      : `Select up to ${offer.picksLeft} (${offer.picks} of ${offer.options.length}), then confirm. Recruits join at level ${offer.level}.${replacement}${run.team.length >= 6 ? " Your team is full: picking means replacing someone." : ""}${rerollTip}`;
    this.hub.innerHTML = `
      ${starter ? "" : this.track()}
      <div class="post-battle">${this.rewardsBanner()}${this.nextUpCard()}</div>
      ${this.fallenNotice()}
      <div class="offer-head">
        <div><h1>${headline}</h1><p>${sub}</p></div>
        <div class="row-buttons">
          <button class="btn" data-act="reroll" ${this.rerollsLeft(offer) <= 0 || offer.picksLeft <= 0 ? "disabled" : ""}
            title="Replaces every card you haven't confirmed. Cards you picked stay.">${this.rerollsLeft(offer) <= 0 ? "No rerolls left" : `🎲 Free reroll (${this.rerollsLeft(offer)})`}</button>
          ${starter ? "" : `<button class="btn" data-act="skip">${offer.picksLeft < offer.picks ? "Done" : "Skip"}</button>`}
        </div>
      </div>
      <div class="offer-grid" role="${multi ? "group" : "radiogroup"}" aria-label="Recruits">${cards}</div>
      <div class="confirm-bar"><span class="confirm-text"></span><button class="btn primary" data-act="confirm" disabled>Confirm</button></div>
      ${run.team.length ? `<section class="card-panel"><h3>Your team (${run.team.length}/6)</h3><div class="team-grid">${run.team.map((m) => this.miniCard(m)).join("")}</div></section>` : ""}`;

    const nameOf = (i) => this.ctx.data.pokemonByKey[offer.options[i].spec.species].name;
    const selection = this.setupSelection({
      limit: offer.picksLeft,
      exact: starter,
      describe: (sel) => sel.length
        ? `${starter ? "Starters" : "Recruit"}: <b>${sel.map(nameOf).join(", ")}</b>`
        : `Select ${starter ? offer.picksLeft : `up to ${offer.picksLeft}`} Pokémon`,
      confirmLabel: (sel) => (starter && sel.length < offer.picksLeft
        ? `Select ${offer.picksLeft - sel.length} more` : `Confirm${sel.length > 1 ? ` (${sel.length})` : ""}`),
    });

    // Take the selected cards (asks who to release when the team is full)
    const confirmPicks = async () => {
      for (const index of selection.get()) {
        if (run.offer !== offer) break;
        let replace = null;
        if (run.team.length >= 6) {
          replace = await this.modal({
            title: "Your team is full",
            body: `<p>Who makes room for ${nameOf(index)}? They'll be released (their held item goes to your bag).</p>`,
            options: run.team.map((m) => ({ value: m.uid, html: `<img src="${this.sprite(m)}" alt=""> ${this.monName(m)} <small>Lv ${m.level}</small>` })),
            cancel: `Don't take ${nameOf(index)}`,
          });
          if (replace === null) continue;
        }
        Run.pickRecruit(run, this.ctx, index, replace);
      }
    };

    this.hub.onclick = async (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "skip") { Run.skipOffer(run, this.ctx); this.render(); return; }
      if (act === "reroll") {
        const chosen = selection.get();
        const options = [];
        if (chosen.length) options.push({ value: "keep", html: `<b>Confirm ${chosen.map(nameOf).join(", ")}</b>, then reroll the rest <small>Your picks stay, only the other cards change</small>` });
        options.push({ value: "drop", html: chosen.length ? `Reroll without picking <small>Your current selection is cleared</small>` : `🎲 Reroll` });
        const how = await this.modal({
          title: "Use your free reroll?",
          body: `<p>Cards you have confirmed stay. Every other card is replaced by a new one.${offer.picksLeft > 1 && !chosen.length ? " Tip: select the ones you like and confirm first, then reroll for the rest." : ""}</p>`,
          options,
          cancel: "Keep these cards",
        });
        if (!how) return;
        if (how === "keep") await confirmPicks();
        if (run.offer === offer && offer.picksLeft > 0) Run.rerollOffer(run, this.ctx);
        this.render();
        return;
      }
      if (act === "confirm") {
        await confirmPicks();
        this.render();
        return;
      }
      selection.click(e);
    };
  }

  // Cards that select like radio buttons (limit 1) or checkboxes (limit > 1), without re-rendering.
  // Fills the .confirm-bar and returns { get(), click(event) }.
  setupSelection({ limit, exact = false, describe, confirmLabel }) {
    const selected = [];
    const bar = this.hub.querySelector(".confirm-bar");
    const text = bar.querySelector(".confirm-text");
    const confirm = bar.querySelector("[data-act=confirm]");
    const update = () => {
      for (const card of this.hub.querySelectorAll("[data-pick]")) {
        const on = selected.includes(Number(card.dataset.pick));
        card.classList.toggle("selected", on);
        card.setAttribute("aria-checked", String(on));
      }
      text.innerHTML = describe(selected);
      confirm.textContent = confirmLabel(selected);
      confirm.disabled = selected.length === 0 || (exact && selected.length < limit);
      bar.classList.toggle("active", selected.length > 0);
      // Several picks allowed and all used: the other cards dim until one is unselected
      for (const grid of this.hub.querySelectorAll(".offer-grid")) grid.classList.toggle("maxed", limit > 1 && selected.length >= limit);
    };
    update();
    return {
      get: () => [...selected],
      click: (e) => {
        const card = e.target.closest("[data-pick]");
        if (!card || card.disabled) return;
        const index = Number(card.dataset.pick);
        const at = selected.indexOf(index);
        if (at !== -1) selected.splice(at, 1);
        else {
          if (selected.length >= limit && limit > 1) {
            // Don't silently swap a pick out: tell the player to unselect one first
            text.innerHTML = `You already picked ${limit}. <b>Unselect one</b> to choose this one instead.`;
            card.classList.remove("shake");
            void card.offsetWidth;
            card.classList.add("shake");
            return;
          }
          if (selected.length >= limit) selected.shift(); // a single pick works like a radio button
          selected.push(index);
        }
        update();
      },
    };
  }

  // "Next up": the opponent after this screen (revealed right after a win, and in the draft)
  nextUpCard() {
    const opp = this.run.nextOpponent;
    if (!opp) return "";
    const name = opp.title === "Rival" ? `Rival ${opp.name}` : `${opp.title} ${opp.name}`;
    return `<section class="card-panel next-up">
      <span class="title">Next up · battle #${opp.order}</span>
      <div class="trainer-row">
        <div class="trainer-portrait">${this.trainerSprites(opp).map((src) => `<img src="${src}" alt="" onerror="this.remove()">`).join("")}</div>
        <div>
          <span class="who">${name}</span>
          ${opp.theme ? `<div><span class="type-badge" style="background: var(--t-${opp.theme})">${opp.theme}</span></div>` : ""}
          <div class="next-facts">Lv ${opp.level} · ${opp.teamSize} Pokémon</div>
          ${this.partyBalls(opp.teamSize)}
        </div>
      </div>
    </section>`;
  }

  rerollsLeft(offer) {
    return offer.rerollsLeft ?? (offer.rerolled ? 0 : 1);
  }

  rewardsBanner() {
    const r = this.run.lastBattle?.rewards;
    if (!r || this.run.screen === "draft") return "";
    return `<section class="card-panel rewards">
      <h3>Rewards from ${this.run.lastBattle.opponent}</h3>
      <div class="reward-row">
        <span class="reward">💰 ₽${r.money.toLocaleString()}${r.flawless ? ` <small>(flawless bonus)</small>` : ""}</span>
        ${r.tm ? `<span class="reward">💿 ${Run.tmLabel(this.ctx, r.tm)}</span>` : ""}
      </div>
      ${r.tm ? this.moveGrid([r.tm]) : ""}
    </section>`;
  }

  fallenNotice() {
    const fallen = this.run.lastBattle?.fallen ?? [];
    if (!fallen.length || this.run.screen === "draft") return "";
    return `<section class="card-panel"><h3>Fallen in battle</h3>
      <div class="fallen-list">${fallen.map((f) => `<div class="mon"><img src="${this.sprite(f)}" alt="">${f.name}</div>`).join("")}</div></section>`;
  }

  miniCard(m) {
    return `<div class="mon-card"><div class="mon-head"><img src="${this.sprite(m)}" alt="">
      <div><div class="mon-name">${this.monName(m)}</div><div class="mon-sub">Lv ${m.level} · ${this.abilityText(m)}</div></div></div></div>`;
  }

  // ===============================
  // ITEM OFFER
  // ===============================

  renderItemOffer() {
    this.showHub();
    const offer = this.run.offer;
    this.hub.className = "hub";
    const multi = offer.picksLeft > 1;
    const cards = offer.options.map((o, i) => {
      const item = itemInfo(o.id);
      const kind = { held: "Held item", bag: "Bag item", evo: "Evolution item", patch: "Ability item" }[item.kind];
      return `
        <button class="offer-card tier-${o.tier} ${o.taken ? "taken" : ""}" data-pick="${i}" style="animation-delay:${i * 80}ms"
          role="${multi ? "checkbox" : "radio"}" aria-checked="false" ${o.taken || offer.picksLeft <= 0 ? "disabled" : ""}>
          <span class="select-mark" aria-hidden="true"></span>
          <span class="tier">${o.tier} · ${kind}</span>
          <img class="item" src="${itemSprite(o.id)}" alt="" onerror="this.style.visibility='hidden'">
          <span class="name">${item.name}</span>
          <span class="detail">${item.desc}</span>
          ${this.run.bag[o.id] ? `<span class="detail">In bag: ${this.run.bag[o.id]}</span>` : ""}
        </button>`;
    }).join("");
    this.hub.innerHTML = `
      ${this.track()}
      <div class="post-battle">${this.nextUpCard()}</div>
      <div class="offer-head">
        <div><h1>${this.run.order === 0 ? "Pick your starting items" : "Pick an item"}</h1><p>Select ${offer.picksLeft > 1 ? `up to ${offer.picksLeft}` : "1"} of ${offer.options.length}, then confirm. Held items can be given to a Pokémon in the next screen.</p></div>
        <button class="btn" data-act="skip">Skip</button>
      </div>
      <div class="offer-grid" role="${multi ? "group" : "radiogroup"}" aria-label="Items">${cards}</div>
      <div class="confirm-bar"><span class="confirm-text"></span><button class="btn primary" data-act="confirm" disabled>Confirm</button></div>`;

    const nameOf = (i) => itemInfo(offer.options[i].id).name;
    const selection = this.setupSelection({
      limit: offer.picksLeft,
      describe: (sel) => (sel.length ? `Take: <b>${sel.map(nameOf).join(", ")}</b>` : `Select ${offer.picksLeft > 1 ? `up to ${offer.picksLeft} items` : "an item"}`),
      confirmLabel: (sel) => `Confirm${sel.length > 1 ? ` (${sel.length})` : ""}`,
    });

    this.hub.onclick = (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "skip") { Run.skipOffer(this.run, this.ctx); this.render(); return; }
      if (act === "confirm") {
        for (const index of selection.get()) {
          if (this.run.offer !== offer) break;
          Run.pickItem(this.run, this.ctx, index);
        }
        // Fewer picked than allowed: the rest are skipped
        if (this.run.offer === offer) Run.skipOffer(this.run, this.ctx);
        this.render();
        return;
      }
      selection.click(e);
    };
  }

  // ===============================
  // HUB
  // ===============================

  renderHubScreen() {
    this.showHub();
    const { run, ctx } = this;
    const opp = run.opponent;
    this.hub.className = "hub";
    const messages = run.messages.splice(0);
    const bagEntries = Object.entries(run.bag).sort((a, b) => itemInfo(a[0]).name.localeCompare(itemInfo(b[0]).name));
    const patches = ["ability-patch", "hidden-ability-patch"].filter((p) => run.bag[p] > 0);

    const team = run.team.map((m, i) => {
      const evo = ctx.dex.evolutionOptions(m, run.bag);
      const evoReady = evo.some((o) => o.ready);
      const relearn = Run.relearnableMoves(ctx, m).length;
      const tms = Run.teachableTMs(run, ctx, m).length;
      const nature = m.nature.charAt(0).toUpperCase() + m.nature.slice(1);
      return `
        <div class="mon-card ${i < 2 ? "lead" : ""}" draggable="true" data-drag="mon" data-uid="${m.uid}">
          ${i < 2 ? `<span class="lead-tag">LEAD</span>` : ""}
          <div class="mon-head">
            <img src="${this.sprite(m)}" alt="">
            <div>
              <div class="mon-name">${this.monName(m)}</div>
              <div class="mon-sub">Lv ${m.level} · ${nature}</div>
              <div>${this.typeBadges(m.species)}</div>
            </div>
          </div>
          ${this.abilityList(m)}
          ${this.statStrip(m)}
          <div class="mon-item">${m.item ? `<span class="held-chip" draggable="true" data-drag="held" data-uid="${m.uid}" title="Drag to another Pokémon or back to the Bag">${this.itemImg(m.item)} ${itemInfo(m.item).name}</span>` : `<span class="mon-sub">No held item</span>`}</div>
          ${this.moveGrid(m.moves, { toggle: true, keyPrefix: m.uid })}
          ${run.team.length > 1 ? this.slotStrip(m) : ""}
          <div class="mon-actions">
            <button class="btn small" data-act="item" data-uid="${m.uid}">Item</button>
            <button class="btn small" data-act="moves" data-uid="${m.uid}" ${relearn ? "" : "disabled"}>Moves</button>
            ${evo.length ? `<button class="btn small ${evoReady ? "ready" : ""}" data-act="evolve" data-uid="${m.uid}">Evolve${evoReady ? "!" : ""}</button>` : ""}
            ${patches.length ? `<button class="btn small" data-act="patch" data-uid="${m.uid}">Ability</button>` : ""}
            ${tms ? `<button class="btn small" data-act="tm" data-uid="${m.uid}">TM (${tms})</button>` : ""}
          </div>
        </div>`;
    }).join("");

    const oppName = opp.title === "Rival" ? `Rival ${opp.name}` : `${opp.title} ${opp.name}`;
    this.hub.innerHTML = `
      <div class="hub-top">
        <div class="me-card">
          <img src="${characterById(run.character ?? loadMeta().character).front}" alt="">
          <div><b>${characterById(run.character ?? loadMeta().character).name}</b><small>Gen ${run.settings.gen} · ${ctx.leaders[run.settings.gen].region}</small></div>
        </div>
        ${this.track()}
        <div class="row-buttons"><span class="money">₽${run.money.toLocaleString()}</span><button class="btn" data-act="title">Save & quit</button></div>
      </div>
      ${messages.length ? `<div class="messages">${messages.map((m) => `<p>${m}</p>`).join("")}</div>` : ""}
      <div class="hub-main">
        <section class="card-panel opponent-card">
          <span class="title">Next battle · #${opp.order}</span>
          <div class="trainer-row">
            <div class="trainer-portrait">${this.trainerSprites(opp).map((src) => `<img src="${src}" alt="" onerror="this.remove()">`).join("")}</div>
            <div><span class="who">${oppName}</span>${this.partyBalls(opp.teamSize)}</div>
          </div>
          ${opp.theme ? `<span><span class="type-badge" style="background: var(--t-${opp.theme})">${opp.theme}</span></span>` : ""}
          <dl class="facts">
            <dt>Their level</dt><dd>${opp.level}</dd>
            <dt>Your level</dt><dd>${opp.playerLevel ?? opp.level}${(opp.playerLevel ?? opp.level) > opp.level ? ` <small>(+${opp.playerLevel - opp.level} bonus)</small>` : ""}</dd>
            <dt>Team</dt><dd>${opp.teamSize} Pokémon</dd>
            <dt>Format</dt><dd>Double battle</dd>
          </dl>
          ${opp.pooled ? `<p class="empty-note">Random team from their pool.</p>` : opp.placeholder ? `<p class="empty-note">Placeholder team (no pool yet).</p>` : ""}
          <p class="empty-note">Your first two Pokémon lead. Your team is fully healed.</p>
          <button class="btn primary" data-act="battle">Battle!</button>
        </section>
        ${this.bagPanel()}
        ${this.shopPanel()}
        <section class="card-panel">
          <div class="team-head">
            <h2>Team (${run.team.length}/6)</h2>
            <div class="row-buttons team-tools">
              ${this.teamView === "grid" ? "" : `<button class="btn small" data-act="toggle-all-desc">${this.showEffects ? "Hide all effects" : "Show all effects"}</button>`}
              <button class="btn small" data-act="toggle-view" aria-pressed="${this.teamView === "grid"}">${this.teamView === "grid" ? "▤ Detailed" : "▦ Grid"}</button>
            </div>
          </div>
          ${this.teamView === "grid"
            ? `<div class="team-tiles">${run.team.map((m, i) => this.teamTile(m, i)).join("")}</div>
               <p class="empty-note">Tap a Pokémon for its stats, evolution line and actions. Drag and drop to chance the order.</p>`
            : `<div class="team-grid">${team}</div>`}
          ${run.fallen.length ? `<h3 class="fallen-heading">Fallen</h3><div class="fallen-list">${run.fallen.map((f) => `<div class="mon"><img src="${this.sprite(f)}" alt="">${f.name}<small>#${f.order} ${f.opponent}</small></div>`).join("")}</div>` : ""}
        </section>
      </div>`;

    this.hub.classList.toggle("show-effects", !!this.showEffects);
    this.hub.onclick = (e) => this.onHubClick(e);
    this.attachDragDrop();
    if (run.pendingMoves.length) this.askPendingMove();
  }

  // ===============================
  // DRAG & DROP (hub)
  // Bag items / TMs → Pokémon, held item → other Pokémon or Bag,
  // Pokémon → another Pokémon's position.
  // ===============================

  attachDragDrop() {
    const hub = this.hub;
    const targetOf = (el) => el.closest(".mon-card, .team-tile") ?? el.closest(".bag-panel");
    const accepts = (drag, target) => {
      if (!drag || !target) return false;
      const isMon = target.matches(".mon-card, .team-tile");
      if (drag.kind === "mon") return isMon && Number(target.dataset.uid) !== drag.uid;
      if (drag.kind === "held") return (isMon && Number(target.dataset.uid) !== drag.uid) || target.matches(".bag-panel");
      return isMon; // bag item or TM onto a Pokémon
    };
    const clear = () => hub.querySelectorAll(".drop-ok, .dragging").forEach((el) => el.classList.remove("drop-ok", "dragging"));

    hub.ondragstart = (e) => {
      const el = e.target.closest?.("[data-drag]");
      if (!el) return;
      const kind = el.dataset.drag;
      this.drag = { kind, uid: Number(el.dataset.uid), item: el.dataset.item, move: el.dataset.move };
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", kind);
      el.classList.add("dragging");
      e.stopPropagation();
    };
    hub.ondragover = (e) => {
      const target = targetOf(e.target);
      hub.querySelectorAll(".drop-ok").forEach((el) => el !== target && el.classList.remove("drop-ok"));
      if (!accepts(this.drag, target)) return;
      e.preventDefault();
      target.classList.add("drop-ok");
    };
    hub.ondragend = () => { clear(); this.drag = null; };
    hub.ondrop = async (e) => {
      const target = targetOf(e.target);
      const drag = this.drag;
      clear();
      this.drag = null;
      if (!accepts(drag, target)) return;
      e.preventDefault();
      const { run, ctx } = this;
      const toUid = Number(target.dataset.uid);
      const mon = run.team.find((m) => m.uid === toUid);
      if (drag.kind === "mon") {
        Run.moveTeamMemberTo(run, drag.uid, run.team.indexOf(mon));
      } else if (drag.kind === "held") {
        if (target.matches(".bag-panel")) Run.takeItem(run, drag.uid);
        else Run.moveHeldItem(run, drag.uid, toUid);
      } else if (drag.kind === "tm") {
        if (!ctx.data.pokemonByKey[mon.species].learnset.machine.includes(drag.move)) {
          await this.modal({ title: `${Run.displayName(ctx, mon)} can't learn ${ctx.data.moves[drag.move].name}`, cancel: "OK" });
          return;
        }
        await this.tmDialog(mon, drag.move);
      } else if (drag.kind === "bag") {
        const kind = ITEMS[drag.item]?.kind;
        if (kind === "held") Run.giveItem(run, toUid, drag.item);
        else if (kind === "evo") await this.evolveDialog(mon);
        else if (kind === "patch") await this.patchDialog(mon);
      }
      this.render();
    };
  }

  // ===============================
  // BAG POCKETS
  // ===============================

  tmIcon(move) {
    return `<img src="images/items/tm-${this.ctx.data.moves[move].type}.png" alt="" onerror="this.style.visibility='hidden'">`;
  }

  bagPanel() {
    const { run, ctx } = this;
    const pockets = POCKETS;
    const entries = Object.entries(run.bag).sort((a, b) => itemInfo(a[0]).name.localeCompare(itemInfo(b[0]).name));
    const byPocket = Object.fromEntries(pockets.map((p) => [p.id, []]));
    for (const [id, n] of entries) {
      const usable = ["held", "evo", "patch"].includes(ITEMS[id]?.kind);
      const label = `${this.itemImg(id)} ${itemInfo(id).name} ×${n}`;
      byPocket[pocketOf(id)].push(usable
        ? `<button class="bag-entry draggable" data-act="bag-use" data-item="${id}" draggable="true" data-drag="bag"
            title="${itemInfo(id).desc} · Tap or drag onto a Pokémon">${label}</button>`
        : `<span class="bag-entry" title="${itemInfo(id).desc}">${label}</span>`);
    }
    byPocket.tms = run.tms.map((mv) =>
      `<button class="bag-entry tm-entry draggable" data-act="tm-bag" data-move="${mv}" draggable="true" data-drag="tm"
        style="--type: var(--t-${ctx.data.moves[mv].type})" title="${ctx.data.moves[mv].shortEffect} · Tap or drag onto a Pokémon to teach">${this.tmIcon(mv)} ${Run.tmLabel(ctx, mv)}</button>`);
    const empty = {
      items: "Held items from item cards and the shop.",
      medicine: "Potions and status heals.",
      berries: "Berries to give to your Pokémon.",
      battle: "X items, Dire Hit and Guard Spec.",
      tms: "Every opponent you beat gives you a reusable TM.",
      key: "Evolution stones, Link Cable and Ability Patches.",
    };
    const active = this.bagPocket ?? "items";
    return `<section class="card-panel bag-panel">
      <h2>Bag</h2>
      <div class="tabs pocket-tabs" role="tablist" aria-label="Bag pockets">${pockets.map((p) => `
        <button class="tab ${p.id === active ? "active" : ""} ${byPocket[p.id].length ? "" : "empty"}" role="tab"
          aria-selected="${p.id === active}" data-act="pocket" data-pocket="${p.id}" title="${p.label}">
          <img src="images/items/${p.icon}.png" alt="">
          <span class="tab-count">${byPocket[p.id].length}</span>
        </button>`).join("")}</div>
      ${pockets.map((p) => `
        <div class="pocket" data-pocket-panel="${p.id}" role="tabpanel" ${p.id === active ? "" : "hidden"}>
          <h3>${p.label}</h3>
          ${byPocket[p.id].length ? `<div class="bag-list">${byPocket[p.id].join("")}</div>` : `<p class="empty-note">Empty. ${empty[p.id]}</p>`}
        </div>`).join("")}
    </section>`;
  }

  // ===============================
  // GRID MODE: tiles + details window
  // ===============================

  teamTile(m, i) {
    const { run, ctx } = this;
    const evoReady = ctx.dex.evolutionOptions(m, run.bag).some((o) => o.ready);
    const p = ctx.data.pokemonByKey[m.species];
    return `
      <button class="team-tile ${i < 2 ? "lead" : ""}" data-act="details" data-uid="${m.uid}" draggable="true" data-drag="mon" style="--type: var(--t-${p.types[0]})">
        ${i < 2 ? `<span class="lead-tag">LEAD</span>` : ""}
        ${evoReady ? `<span class="evo-tag">Evolve!</span>` : ""}
        <img src="${this.sprite(m)}" alt="">
        <span class="tile-name">${this.monName(m)}</span>
        <span class="tile-sub">Lv ${m.level}</span>
        <span>${this.typeBadges(m.species)}</span>
        <span class="tile-item">${m.item ? `${this.itemImg(m.item)} ${itemInfo(m.item).name}` : "No item"}</span>
      </button>`;
  }

  // The six stats at this level in one row (the detailed team cards; the full table is in the details window)
  statStrip(m) {
    const p = this.ctx.data.pokemonByKey[m.species];
    const stats = calcStats(p.baseStats, m.level, m.nature, { ...DEFAULT_IVS, ...m.ivs }, { ...DEFAULT_EVS, ...m.evs }, m.species);
    const [up, down] = NATURES[m.nature] ?? [];
    return `<div class="stat-strip" aria-label="Stats">${["hp", "atk", "def", "spa", "spd", "spe"].map((k) =>
      `<span class="${k === up ? "up" : k === down ? "down" : ""}" title="${STAT_NAMES[k]}"><i>${{ hp: "HP", atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe" }[k]}</i><b>${stats[k]}</b></span>`).join("")}</div>`;
  }

  statsTable(m) {
    const p = this.ctx.data.pokemonByKey[m.species];
    const ivs = { ...DEFAULT_IVS, ...m.ivs };
    const evs = { ...DEFAULT_EVS, ...m.evs };
    const stats = calcStats(p.baseStats, m.level, m.nature, ivs, evs, m.species);
    const [up, down] = NATURES[m.nature] ?? [];
    const rows = ["hp", "atk", "def", "spa", "spd", "spe"].map((s) => {
      const mark = s === up ? `<span class="nat up" title="Raised by ${m.nature}">▲</span>` : s === down ? `<span class="nat down" title="Lowered by ${m.nature}">▼</span>` : "";
      const pct = Math.min(100, (p.baseStats[s] / 180) * 100);
      return `<tr class="${s === up ? "up" : s === down ? "down" : ""}">
        <th>${STAT_NAMES[s]} ${mark}</th>
        <td>${p.baseStats[s]}</td>
        <td class="bar-cell"><span class="stat-bar" style="width:${pct}%"></span></td>
        <td>${ivs[s]}</td><td>${evs[s]}</td>
        <td class="total">${stats[s]}</td>
      </tr>`;
    }).join("");
    return `<table class="stats-table">
      <thead><tr><th>Stat</th><th>Base</th><th></th><th>IV</th><th>EV</th><th>Lv ${m.level}</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><th>Total</th><td>${p.bst}</td><td></td><td></td><td></td><td></td></tr></tfoot>
    </table>`;
  }

  // The whole evolution line as columns (stage 1 → 2 → 3), with what each step needs
  evolutionLine(m) {
    const { ctx } = this;
    const dex = ctx.dex;
    const root = dex.lineOf[m.species];
    const stages = [[root]];
    while (true) {
      const next = stages[stages.length - 1].flatMap((k) => (dex.evolvesTo[k] ?? []).map((e) => e.to));
      if (!next.length) break;
      stages.push(next);
    }
    if (stages.length === 1) return `<p class="empty-note">${ctx.data.pokemonByKey[m.species].name} doesn't evolve.</p>`;
    const method = (k) => {
      const from = dex.evolvesFrom[k];
      if (!from) return "";
      const mm = from.method;
      const lvl = dex.earliestLevel(k);
      const gender = mm.gender ? ` (${mm.gender === "M" ? "♂" : "♀"})` : "";
      switch (mm.kind) {
        case "level": return `Lv ${mm.level}${gender}`;
        case "stone": return `${itemLabel(mm.item)}${gender} · Lv ${lvl}+`;
        case "trade": return mm.heldItem ? `Hold ${itemLabel(mm.heldItem)} · Lv ${lvl}+` : `Link Cable · Lv ${lvl}+`;
        case "friendship": return `Lv ${lvl}`;
        case "held": return `Hold ${itemLabel(mm.heldItem)} · Lv ${lvl}+`;
        case "shed": return "Bonus with Ninjask";
        default: return `Lv ${lvl}`;
      }
    };
    return `<div class="evo-line">${stages.map((col, i) => `
      ${i > 0 ? `<span class="evo-arrow" aria-hidden="true">→</span>` : ""}
      <div class="evo-stage">${col.map((k) => `
        <div class="evo-mon ${k === m.species ? "current" : ""}">
          <img src="${ctx.data.pokemonByKey[k].sprites.front}" alt="">
          <b>${ctx.data.pokemonByKey[k].name}</b>
          ${i > 0 ? `<small>${method(k)}</small>` : ""}
        </div>`).join("")}</div>`).join("")}</div>`;
  }

  async detailsDialog(uid) {
    const { run, ctx } = this;
    const mon = run.team.find((m) => m.uid === uid);
    if (!mon) return;
    const i = run.team.indexOf(mon);
    const p = ctx.data.pokemonByKey[mon.species];
    const nature = mon.nature.charAt(0).toUpperCase() + mon.nature.slice(1);
    const [up, down] = NATURES[mon.nature] ?? [];
    const evo = ctx.dex.evolutionOptions(mon, run.bag);
    const patches = ["ability-patch", "hidden-ability-patch"].some((x) => run.bag[x] > 0);
    const tms = Run.teachableTMs(run, ctx, mon).length;
    const relearn = Run.relearnableMoves(ctx, mon).length;
    const act = (value, label, { disabled = false, ready = false } = {}) =>
      `<button class="btn small ${ready ? "ready" : ""}" data-result='{"act":"${value}"}' ${disabled ? "disabled" : ""}>${label}</button>`;
    const active = this.detailsTab ?? "stats";
    const body = `
      <div class="details">
        <div class="details-head">
          <img src="${this.sprite(mon)}" alt="">
          <div class="details-info">
            <div class="details-name">${this.monName(mon)}</div>
            <div class="tile-sub">Lv ${mon.level} · ${this.typeBadges(mon.species)} · <span class="tier-label tier-${ctx.dex.tier(mon.species)}">${ctx.dex.tier(mon.species)}</span></div>
            <div class="tile-sub">Nature: <b>${nature}</b>${up ? ` (+${STAT_NAMES[up]}, −${STAT_NAMES[down]})` : " (neutral)"}</div>
            <div class="tile-sub">Held: ${mon.item ? `${this.itemImg(mon.item)} ${itemInfo(mon.item).name}` : "none"} · Slot ${i + 1}/${run.team.length}${i < 2 ? " (lead)" : ""}</div>
          </div>
          <div class="details-actions">
            ${act("item", mon.item ? "Change item" : "Give item")}
            ${run.team.length > 1 ? act("swap", "Swap place…") : ""}
          </div>
        </div>
        <div class="tabs details-tabs" role="tablist" aria-label="Details">${DETAIL_TABS.map((t) => `
          <button class="tab ${t.id === active ? "active" : ""}" role="tab" data-tab="${t.id}"
            aria-selected="${t.id === active}"><img src="images/items/${t.icon}.png" alt=""><span>${t.label}</span></button>`).join("")}
        </div>
        <div class="tab-panels">
        <section data-tab-panel="stats">${this.statsTable(mon)}</section>
        <section data-tab-panel="abilities">${this.abilityDetails(mon)}
          ${patches ? `<div class="panel-actions">${act("patch", "Use an Ability Patch…")}</div>` : ""}</section>
        <section data-tab-panel="evolution">${this.evolutionLine(mon)}
          ${evo.length ? `<div class="panel-actions">${act("evolve", evo.some((o) => o.ready) ? "Evolve!" : "Evolve…", { ready: evo.some((o) => o.ready) })}</div>` : ""}</section>
        <section data-tab-panel="moves">${this.moveGrid(mon.moves, { toggle: true })}
          <div class="panel-actions">
            <button class="btn small" data-local="effects" type="button">${this.showEffects ? "Hide all effects" : "Show all effects"}</button>
            ${act("moves", "Relearn a move…", { disabled: !relearn })}
            ${tms ? act("tm", `Teach a TM (${tms})…`) : ""}
          </div></section>
        </div>
      </div>`;
    const result = await this.modal({
      title: "",
      label: `${p.name}, Pokémon ${i + 1} of ${run.team.length}`,
      head: this.monStrip(mon),
      body,
      layout: "actions",
      wide: true,
      nav: run.team.length > 1,
      options: [],
      cancel: "Close",
      onOpen: (dialog) => {
        const show = (id) => {
          this.detailsTab = id;
          for (const tab of dialog.querySelectorAll("[data-tab]")) {
            tab.classList.toggle("active", tab.dataset.tab === id);
            tab.setAttribute("aria-selected", String(tab.dataset.tab === id));
          }
          for (const panel of dialog.querySelectorAll("[data-tab-panel]")) {
            const off = panel.dataset.tabPanel !== id;
            panel.classList.toggle("off", off);
            panel.setAttribute("aria-hidden", String(off));
          }
        };
        show(active);
        dialog.classList.toggle("show-effects", !!this.showEffects);
        dialog.addEventListener("click", (e) => {
          const tab = e.target.closest("[data-tab]");
          if (tab) show(tab.dataset.tab);
          const toggle = e.target.closest("[data-act=toggle-desc]");
          if (toggle) {
            const open = toggle.closest(".move-card").classList.toggle("open");
            toggle.setAttribute("aria-expanded", String(open));
          }
          const all = e.target.closest("[data-local=effects]");
          if (all) {
            this.showEffects = !this.showEffects;
            try { localStorage.setItem("pd.showEffects", this.showEffects ? "1" : "0"); } catch { /* ignore */ }
            dialog.classList.toggle("show-effects", this.showEffects);
            all.textContent = this.showEffects ? "Hide all effects" : "Show all effects";
          }
        });
      },
    });
    if (!result) return;
    if (result.goto) return this.detailsDialog(result.goto);
    if (result.nav) return this.detailsDialog(this.neighbour(mon, result.nav).uid);
    if (result.act === "swap") await this.swapDialog(mon);
    if (result.act === "item") await this.itemDialog(mon);
    if (result.act === "moves") await this.relearnDialog(mon);
    if (result.act === "evolve") await this.evolveDialog(mon);
    if (result.act === "patch") await this.patchDialog(mon);
    if (result.act === "tm") await this.tmDialog(mon);
    this.render();
    await this.detailsDialog(uid); // reopen with the updated info
  }

  // "Swap place…": pick who this Pokémon trades team slots with
  async swapDialog(mon) {
    const { run } = this;
    const here = run.team.indexOf(mon);
    const index = await this.modal({
      title: `Swap ${this.ctx.data.pokemonByKey[mon.species].name}'s place`,
      body: `<p>Slot ${here + 1} of ${run.team.length}. Your first two Pokémon lead the battle. Pick who ${here < 2 ? "takes" : "swaps with"} this slot.</p>`,
      options: run.team.map((m, j) => ({
        value: j,
        disabled: j === here,
        html: `<img src="${this.sprite(m)}" alt=""> ${this.monName(m)} <small>Slot ${j + 1}${j < 2 ? " · Lead" : ""}${j === here ? " · this one" : ""}</small>`,
      })),
    });
    if (index !== null) Run.swapTeamMember(run, mon.uid, index);
  }

  // The shop is split into sections (tabs) like the Bag: held items, berries, medicine…
  shopPanel() {
    const { run, ctx } = this;
    const stock = (run.shop?.stock ?? []).map((e, i) => ({ e, i }));
    const tms = (run.shop?.tms ?? []).map((t, i) => ({ t, i }));
    const inSection = (id) => stock.filter(({ e }) => pocketOf(e.id) === id);
    const left = (id) => (id === "tms" ? tms.filter(({ t }) => !t.sold) : inSection(id).filter(({ e }) => !e.sold)).length;
    const cost = Run.shopRerollCost(run, ctx);

    const itemRow = ({ e, i }) => {
      const item = itemInfo(e.id);
      return `<div class="shop-item tier-${e.tier} ${e.sold ? "sold" : ""}" title="${item.desc}">
        ${this.itemImg(e.id)}
        <div><b>${item.name}</b><small>${item.desc}</small></div>
        <button class="btn small" data-act="buy" data-i="${i}" ${e.sold || run.money < e.price ? "disabled" : ""}>${e.sold ? "Sold" : `₽${e.price.toLocaleString()}`}</button>
      </div>`;
    };
    const tmRow = ({ t, i }) => {
      const m = ctx.data.moves[t.move];
      return `<div class="shop-item tm-shop ${t.sold ? "sold" : ""}" style="--type: var(--t-${m.type})" title="${m.shortEffect}">
        ${this.tmIcon(t.move)}
        <div><b>${Run.tmLabel(ctx, t.move)}</b><small>${m.type} · ${m.category}${m.power ? ` · ${m.power} power` : ""}. ${m.shortEffect}</small></div>
        <button class="btn small" data-act="buy-tm" data-i="${i}" ${t.sold || run.money < t.price ? "disabled" : ""}>${t.sold ? "Sold" : `₽${t.price.toLocaleString()}`}</button>
      </div>`;
    };

    return `<section class="card-panel shop-panel">
      <div class="team-head"><h2>Shop</h2>
        <div class="row-buttons team-tools">
          <button class="btn small" data-act="shop-reroll" ${run.money < cost ? "disabled" : ""}
            title="New stock. The first reroll after each battle is free.">🎲 ${cost ? `₽${cost.toLocaleString()}` : "Free"}</button>
          <button class="btn small" data-act="sell" ${Object.keys(run.bag).length ? "" : "disabled"}>Sell</button>
        </div>
      </div>
      <p class="empty-note">New stock after every battle. You have ₽${run.money.toLocaleString()}.</p>
      ${POCKETS.map((p) => {
        const rows = p.id === "tms" ? tms.map(tmRow) : inSection(p.id).map(itemRow);
        if (!rows.length) return "";
        return `<div class="pocket shop-section" data-shop-section="${p.id}">
          <h3><img src="images/items/${p.icon}.png" alt=""> ${p.label} <span class="tab-count">${left(p.id)}</span></h3>
          <div class="shop-grid">${rows.join("")}</div>
        </div>`;
      }).join("")}
    </section>`;
  }

  async onHubClick(e) {
    const btn = e.target.closest("[data-act]");
    if (!btn || btn.disabled) return;
    const { run, ctx } = this;
    const act = btn.dataset.act;
    // Description toggles: no re-render needed
    if (act === "toggle-desc") {
      const card = btn.closest(".move-card");
      const open = card.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      return;
    }
    if (act === "tm-bag") {
      await this.teachFromBag(btn.dataset.move);
      this.render();
      return;
    }
    if (act === "bag-use") {
      await this.useFromBag(btn.dataset.item);
      this.render();
      return;
    }
    if (act === "pocket") {
      this.bagPocket = btn.dataset.pocket;
      for (const tab of this.hub.querySelectorAll("[data-act=pocket]")) {
        const on = tab.dataset.pocket === this.bagPocket;
        tab.classList.toggle("active", on);
        tab.setAttribute("aria-selected", String(on));
      }
      for (const panel of this.hub.querySelectorAll("[data-pocket-panel]")) panel.hidden = panel.dataset.pocketPanel !== this.bagPocket;
      return;
    }
    if (act === "toggle-view") {
      this.teamView = this.teamView === "grid" ? "detailed" : "grid";
      try { localStorage.setItem("pd.teamView", this.teamView); } catch { /* ignore */ }
      this.render();
      return;
    }
    if (act === "details") {
      await this.detailsDialog(Number(btn.dataset.uid));
      return;
    }
    if (act === "toggle-all-desc") {
      this.showEffects = !this.showEffects;
      try { localStorage.setItem("pd.showEffects", this.showEffects ? "1" : "0"); } catch { /* ignore */ }
      this.hub.classList.toggle("show-effects", this.showEffects);
      btn.textContent = this.showEffects ? "Hide all effects" : "Show all effects";
      return;
    }
    const uid = Number(btn.dataset.uid);
    const mon = run.team.find((m) => m.uid === uid);

    if (act === "title") { this.save(); this.start(); return; }
    if (act === "battle") {
      const result = Run.startBattle(run, ctx);
      if (!result.ok) { await this.modal({ title: result.reason, cancel: "OK" }); return; }
      this.save();
      this.playBattle(result.battle, { initialEvents: result.events });
      return;
    }
    if (act === "slot") Run.swapTeamMember(run, uid, Number(btn.dataset.slot));
    if (act === "item") await this.itemDialog(mon);
    if (act === "moves") await this.relearnDialog(mon);
    if (act === "evolve") await this.evolveDialog(mon);
    if (act === "patch") await this.patchDialog(mon);
    if (act === "tm") await this.tmDialog(mon);
    if (act === "shop-reroll") {
      const cost = Run.shopRerollCost(run, ctx);
      if (cost) {
        const ok = await this.modal({
          title: `Reroll the shop for ₽${cost.toLocaleString()}?`,
          body: `<p>You have ₽${run.money.toLocaleString()}. The first reroll after each battle is free.</p>`,
          options: [{ value: true, label: `Reroll for ₽${cost.toLocaleString()}` }],
          cancel: "No",
        });
        if (!ok) return;
      }
      Run.rerollShop(run, ctx);
    }
    if (act === "buy-tm") {
      const t = run.shop.tms[Number(btn.dataset.i)];
      const ok = await this.modal({
        title: `Buy ${Run.tmLabel(ctx, t.move)}?`,
        body: `<div class="new-move">${this.moveCard(t.move)}</div>
          <p>Reusable: teach it to as many Pokémon as you like. ₽${t.price.toLocaleString()} · you have ₽${run.money.toLocaleString()}</p>`,
        options: [{ value: true, label: `Buy for ₽${t.price.toLocaleString()}` }],
        cancel: "No",
      });
      if (ok) Run.buyTM(run, ctx, Number(btn.dataset.i));
    }
    if (act === "buy") {
      const entry = run.shop.stock[Number(btn.dataset.i)];
      const ok = await this.modal({
        title: `Buy ${itemInfo(entry.id).name}?`,
        body: `<div class="confirm-mon">${this.itemImg(entry.id)}<div>${itemInfo(entry.id).desc}</div></div>
          <p>₽${entry.price.toLocaleString()} · you have ₽${run.money.toLocaleString()}</p>`,
        options: [{ value: true, label: `Buy for ₽${entry.price.toLocaleString()}` }],
        cancel: "No",
      });
      if (ok) Run.buyItem(run, ctx, Number(btn.dataset.i));
    }
    if (act === "sell") {
      const id = await this.modal({
        title: "Sell an item",
        body: `<p>Items sell for half their shop price.</p>`,
        options: Object.entries(run.bag).map(([id, n]) => ({ value: id, html: `${this.itemImg(id)} ${itemInfo(id).name} ×${n} <small>sells for ₽${Run.sellPrice(ctx, id).toLocaleString()}</small>` })),
      });
      if (id) Run.sellItem(run, ctx, id);
    }
    this.render();
  }

  async askPendingMove() {
    const { run, ctx } = this;
    const q = run.pendingMoves[0];
    const mon = run.team.find((m) => m.uid === q.uid);
    if (!mon) { Run.answerMove(run, ctx, null); this.render(); return; }
    const newMove = ctx.data.moves[q.move];
    const choice = await this.modal({
      title: `${ctx.data.pokemonByKey[mon.species].name} wants to learn ${newMove.name}`,
      body: `<p class="modal-label">New move</p><div class="new-move">${this.moveCard(q.move)}</div>
        <p class="modal-label">Pick a move to forget</p>`,
      layout: "cards",
      options: mon.moves.map((id, i) => ({ value: i, html: this.moveCard(id) })),
      cancel: `Don't learn ${newMove.name}`,
    });
    Run.answerMove(run, ctx, choice);
    this.render();
  }

  async itemDialog(mon) {
    const { run } = this;
    const held = Object.keys(run.bag).filter((id) => ITEMS[id]?.kind === "held");
    const options = held.map((id) => ({ value: id, html: `${this.itemImg(id)} ${itemInfo(id).name} <small>${itemInfo(id).desc}</small>` }));
    if (mon.item) options.unshift({ value: "__take", html: `Take ${itemInfo(mon.item).name} back` });
    if (!options.length) { await this.modal({ title: "No held items in your bag", cancel: "OK" }); return; }
    const choice = await this.modal({ title: `Give ${this.ctx.data.pokemonByKey[mon.species].name} an item`, options });
    if (choice === "__take") Run.takeItem(run, mon.uid);
    else if (choice) Run.giveItem(run, mon.uid, choice);
  }

  async relearnDialog(mon) {
    const { run, ctx } = this;
    const moves = Run.relearnableMoves(ctx, mon);
    const move = await this.modal({
      title: `Move Relearner`,
      head: this.monStrip(mon),
      body: `${this.dialogMon(mon)}
        <p>${moves.length ? `Any level-up move up to level ${mon.level}. Free. Pick a move to learn.` : "No moves to relearn right now."}</p>`,
      layout: "cards",
      nav: run.team.length > 1,
      options: moves.map((id) => ({ value: id, html: this.moveCard(id) })),
    });
    if (move?.goto) return this.relearnDialog(run.team.find((m) => m.uid === move.goto));
    if (move?.nav) return this.relearnDialog(this.neighbour(mon, move.nav));
    if (!move) return;
    let replace = null;
    if (mon.moves.length >= 4) {
      replace = await this.modal({
        title: `Learn ${ctx.data.moves[move].name}`,
        body: `<p class="modal-label">New move</p><div class="new-move">${this.moveCard(move)}</div>
          <p class="modal-label">Pick a move to forget</p>`,
        layout: "cards",
        options: mon.moves.map((id, i) => ({ value: i, html: this.moveCard(id) })),
      });
      if (replace === null) return;
    }
    Run.relearnMove(run, ctx, mon.uid, move, replace);
  }

  // Held item, evolution item or Ability Patch tapped in the Bag: pick who gets it
  // (the touch-friendly version of dragging it onto a Pokémon)
  async useFromBag(id) {
    const { run, ctx } = this;
    const kind = ITEMS[id]?.kind;
    const info = itemInfo(id);
    const hint = (mon) => {
      if (kind === "held") return mon.item ? `holds ${itemInfo(mon.item).name}` : "no item";
      if (kind === "evo") {
        const opts = ctx.dex.evolutionOptions(mon, run.bag);
        return opts.some((o) => o.ready) ? "can evolve" : opts.length ? "not ready yet" : "doesn't evolve";
      }
      return ctx.data.abilities[mon.ability]?.name ?? mon.ability;
    };
    const uid = await this.modal({
      title: kind === "held" ? `Give ${info.name}` : `Use ${info.name}`,
      body: `<div class="confirm-mon">${this.itemImg(id)}<div>${info.desc}</div></div><p>Which Pokémon?</p>`,
      options: run.team.map((mon) => ({
        value: mon.uid,
        disabled: kind === "evo" && !ctx.dex.evolutionOptions(mon, run.bag).length,
        html: `<img src="${this.sprite(mon)}" alt=""> ${this.monName(mon)} <small>${hint(mon)}</small>`,
      })),
    });
    if (uid === null) return;
    const mon = run.team.find((m) => m.uid === uid);
    if (kind === "held") Run.giveItem(run, uid, id);
    else if (kind === "evo") await this.evolveDialog(mon);
    else if (kind === "patch") await this.patchDialog(mon);
  }

  // Pick a team member for a TM clicked in the Bag, then the move to forget
  async teachFromBag(move) {
    const { run, ctx } = this;
    const uid = await this.modal({
      title: `Teach ${Run.tmLabel(ctx, move)}`,
      body: `<div class="new-move">${this.moveCard(move)}</div><p>Which Pokémon should learn it?</p>`,
      options: run.team.map((mon) => {
        const can = ctx.data.pokemonByKey[mon.species].learnset.machine.includes(move);
        const knows = mon.moves.includes(move);
        return {
          value: mon.uid,
          disabled: !can || knows,
          html: `<img src="${this.sprite(mon)}" alt=""> ${this.monName(mon)} <small>${knows ? "already knows it" : can ? "can learn it" : "can't learn it"}</small>`,
        };
      }),
    });
    if (uid === null) return;
    await this.tmDialog(run.team.find((x) => x.uid === uid), move);
  }

  async tmDialog(mon, preselected = null) {
    const { run, ctx } = this;
    const moves = Run.teachableTMs(run, ctx, mon);
    const move = preselected ?? await this.modal({
      title: `Teach a TM`,
      head: preselected ? "" : this.monStrip(mon),
      body: `${this.dialogMon(mon)}
        <p>${moves.length ? "TMs are reusable: teaching one doesn't use it up." : "None of your TMs fit this Pokémon."}</p>`,
      layout: "cards",
      nav: !preselected && run.team.length > 1,
      options: moves.map((id) => ({ value: id, html: this.moveCard(id) })),
    });
    if (move?.goto) return this.tmDialog(run.team.find((m) => m.uid === move.goto));
    if (move?.nav) return this.tmDialog(this.neighbour(mon, move.nav));
    if (!move) return;
    let replace = null;
    if (mon.moves.length >= 4) {
      replace = await this.modal({
        title: `Learn ${ctx.data.moves[move].name}`,
        body: `<p class="modal-label">New move</p><div class="new-move">${this.moveCard(move)}</div>
          <p class="modal-label">Pick a move to forget</p>`,
        layout: "cards",
        options: mon.moves.map((id, i) => ({ value: i, html: this.moveCard(id) })),
      });
      if (replace === null) return;
    }
    Run.teachTM(run, ctx, mon.uid, move, replace);
  }

  async evolveDialog(mon) {
    const { run, ctx } = this;
    const options = ctx.dex.evolutionOptions(mon, run.bag);
    const to = await this.modal({
      title: `Evolve ${ctx.data.pokemonByKey[mon.species].name}?`,
      options: options.map((o) => ({
        value: o.to,
        disabled: !o.ready,
        html: `<img src="${ctx.data.pokemonByKey[o.to].sprites.front}" alt=""> ${o.name} <small>${o.ready ? "Ready!" : `Needs: ${o.needs.join(", ")}`}</small>`,
      })),
      cancel: "Not now",
    });
    if (!to) return;
    Run.evolve(run, ctx, mon.uid, to);
  }

  async patchDialog(mon) {
    const { run, ctx } = this;
    const p = ctx.data.pokemonByKey[mon.species];
    const abilityName = (a) => ctx.data.abilities[a]?.name ?? a;
    const options = [];
    if (run.bag["ability-patch"]) {
      const other = p.abilities.normal.find((a) => a !== mon.ability);
      options.push({ value: "ability-patch", disabled: !other, html: `${this.itemImg("ability-patch")} Ability Patch <small>${other ? `→ ${abilityName(other)}` : "no other normal Ability"}</small>` });
    }
    if (run.bag["hidden-ability-patch"]) {
      const ha = p.abilities.hidden;
      options.push({ value: "hidden-ability-patch", disabled: !ha || ha === mon.ability, html: `${this.itemImg("hidden-ability-patch")} Hidden Ability Patch <small>${ha ? `→ ${abilityName(ha)}` : "no Hidden Ability"}</small>` });
    }
    const kind = await this.modal({ title: `Change ${p.name}'s Ability (now ${abilityName(mon.ability)})`, options });
    if (kind) Run.usePatch(run, ctx, mon.uid, kind);
  }

  // ===============================
  // BATTLE
  // ===============================

  renderBattle() {
    // Resuming a saved battle
    const battle = new Battle(this.ctx.data, this.run.battle);
    this.playBattle(battle, { resumed: true });
  }

  playBattle(battle, runOpts) {
    this.showBattle();
    const mine = this.run;
    const screen = new BattleScreen(battle, {
      data: this.ctx.data,
      terrain: terrainFor(this.run.opponent),
      playerBack: characterById(this.run.character ?? loadMeta().character).back,
      trainer: {
        title: this.run.opponent.title === "Rival" ? "Rival" : this.run.opponent.title,
        name: this.run.opponent.name,
        sprites: this.trainerSprites(this.run.opponent),
      },
      onSave: (state) => { if (this.run !== mine) return; this.run.battle = state; this.save(); },
      onEnd: async () => {
        screen.destroy();
        await new Promise((r) => setTimeout(r, 900));
        if (this.run !== mine) return;
        Run.finishBattle(this.run, this.ctx);
        this.render();
      },
    });
    this.battleScreen = screen;
    screen.run(runOpts);
  }

  // ===============================
  // END OF RUN
  // ===============================

  // Trainer Points for a finished run (only once per run)
  awardTrainerPoints() {
    const run = this.run;
    const tp = trainerPointsFor(run, this.ctx.rules);
    if (!run.tpAwarded && !this.preview) {
      const meta = loadMeta();
      const before = unlockedIds(meta, this.ctx.rules.characterUnlocks ?? {}, CHARACTERS);
      meta.tp += tp;
      meta.earned += tp;
      recordRun(meta, run);
      saveMeta(meta);
      run.tpAwarded = true;
      run.newUnlocks = unlockedIds(meta, this.ctx.rules.characterUnlocks ?? {}, CHARACTERS).filter((id) => !before.includes(id));
    }
    const fresh = (run.newUnlocks ?? []).map((id) => characterById(id));
    return `<p class="tp-earned">+${tp} Trainer Points <small>(spend them in Trainer Upgrades)</small></p>
      ${fresh.length ? `<section class="card-panel"><h3>New trainers unlocked!</h3>
        <div class="characters">${fresh.map((c) => `<div class="character selected"><img src="${c.front}" alt=""><span>${c.name}</span></div>`).join("")}</div></section>` : ""}`;
  }

  renderOver() {
    this.showHub();
    const run = this.run;
    const tpLine = this.awardTrainerPoints();
    this.hub.className = "hub end-screen";
    this.hub.innerHTML = `
      <div class="big">Run over</div>
      <p>Defeated by ${run.lastBattle?.opponent} at battle #${run.lastBattle?.order} of 14.</p>
      ${tpLine}
      <section class="card-panel"><h3>Fallen this run</h3>
        <div class="fallen-list">${run.fallen.map((f) => `<div class="mon"><img src="${this.sprite(f)}" alt="">${f.name}<small>Lv ${f.level} · #${f.order}</small></div>`).join("")}</div>
      </section>
      <div class="row-buttons"><button class="btn primary" data-act="new">New run</button><button class="btn" data-act="upgrades">Trainer Upgrades</button><button class="btn" data-act="title">Title</button></div>`;
    if (!this.preview) store.remove(RUN_KEY);
    this.hub.onclick = (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "new") this.renderSetup();
      if (act === "title") this.start();
      if (act === "upgrades") this.renderUpgrades();
    };
  }

  renderWon() {
    this.showHub();
    const run = this.run;
    const tpLine = this.awardTrainerPoints();
    const entry = {
      date: new Date().toISOString().slice(0, 10),
      gen: run.settings.gen,
      region: this.ctx.leaders[run.settings.gen].region,
      rival: run.rival.name,
      team: run.team.map((m) => ({ species: m.species, shiny: m.shiny, level: m.level, ability: m.ability, item: m.item, moves: m.moves })),
      fallen: run.fallen.length,
    };
    if (!run.hallOfFameSaved && !this.preview) {
      const hof = store.get(HOF_KEY) ?? [];
      hof.unshift(entry);
      store.set(HOF_KEY, hof);
      run.hallOfFameSaved = true;
    }
    if (!this.preview) store.remove(RUN_KEY);
    this.hub.className = "hub end-screen";
    this.hub.innerHTML = `
      <div class="big">Hall of Fame!</div>
      <p>You beat ${entry.region}'s gauntlet and your Rival ${entry.rival}. ${entry.fallen ? `${entry.fallen} Pokémon fell along the way.` : "Nobody fell. Flawless!"}</p>
      ${tpLine}
      <div class="hof-team">${entry.team.map((m) => `<div class="mon"><img src="${this.sprite(m)}" alt="">${this.ctx.data.pokemonByKey[m.species].name}<small>Lv ${m.level}</small></div>`).join("")}</div>
      <div class="row-buttons"><button class="btn primary" data-act="new">New run</button><button class="btn" data-act="upgrades">Trainer Upgrades</button><button class="btn" data-act="hof">Hall of Fame</button></div>`;
    this.hub.onclick = (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "new") this.renderSetup();
      if (act === "hof") this.renderHallOfFame();
      if (act === "upgrades") this.renderUpgrades();
    };
  }

  renderHallOfFame() {
    this.trackView("hof");
    this.showHub();
    const hof = store.get(HOF_KEY) ?? [];
    this.hub.className = "hub";
    this.hub.innerHTML = `
      <div class="offer-head"><h1>Hall of Fame</h1><button class="btn" data-act="title">◀ Title</button></div>
      ${hof.map((e) => `
        <section class="card-panel hof-entry">
          <h3>${e.date} · Gen ${e.gen} ${e.region} · Rival ${e.rival} · ${e.fallen} fallen</h3>
          <div class="hof-team">${e.team.map((m) => `<div class="mon"><img src="${this.sprite(m)}" alt="">${this.ctx.data.pokemonByKey[m.species].name}<small>Lv ${m.level}</small></div>`).join("")}</div>
        </section>`).join("") || `<p>No champions yet.</p>`}`;
    this.hub.onclick = (e) => {
      if (e.target.closest("[data-act]")?.dataset.act === "title") this.start();
    };
  }
}
