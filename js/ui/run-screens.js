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
import { isUnlocked, HIDDEN_TRAINERS, unlockText, unlockedIds, grantUnlocks, nextHint as nextUnlockHint, ruleProgressText, MAX_UNLOCKS_PER_RUN } from "../game/unlocks.js";
import { noteBattleWon, STARTER_LINES } from "../game/progress.js";
import { sceneHtml, alignScene } from "./title-banner.js";
import { CASE_SIZE, badgeId, badgeImage, badgeName, caseOf, caseStrengths, ownedBadges, randomZones, validZones, SLOT_UNLOCKS, slotUnlocked, unlockedSlotCount, statOfBadge, badgeStatBoost, STAT_NAME, parseBadgeId, perkInfo, perkOfBadge, perkParam, placeBadge, removeBadge, setBonus, unlockBadge } from "../game/badges.js";
import { targetIcon, categoryIcon } from "./target-icon.js";
import { rankScore, rankOf } from "../game/ranks.js";
import { play as playMusic } from "../game/music.js";
import { CHALLENGES, MONO_TYPES, PLANNED, secretAt, secretRevealed } from "../game/challenges.js";
import { VERSION } from "../version.js";
import * as Run from "../game/run.js";
import { loadMeta, saveMeta, buyUpgrade, canBuyUpgrade, upgradeLevel, lockReason, nextCost, perksFromMeta, unlockedRules, winsInGen, tpCheck, restoreTp, MONO_TRIALS_NEEDED, monoTrials, monoTrialsDone, spentOnTree, respecTree, RESPEC_FEE, trainerPointsFor, recordRun, noteSave } from "../game/meta.js";
import { cloudAvailable, state as cloudState, onCloudChange, signIn, signOutUser, allPlayers, publicName, cleanUsername, cleanTagline, setSyncChooser, setPublicStats } from "../game/cloud.js";
import { buildStats, ownedSpecies } from "../game/stats.js";
import { ITEMS, POCKETS, pocketOf, itemInfo, itemSprite } from "../game/item-catalog.js";
import { itemLabel } from "../game/pokedex.js";
import { calcStats, DEFAULT_IVS, DEFAULT_EVS, hiddenPowerOf } from "../engine/pokemon.js";
import { NATURES, STAT_NAMES } from "../engine/constants.js";

// The Trainer Card artwork (images/ui/trainer-card-480x340.svg) inlined so its colours follow the CSS variables on .case-board
const CARD_COLORS = ["red", "blue", "green", "purple", "gold", "silver", "bronze", "black"];
let cardArtId = 0;
function cardArt() {
  const n = ++cardArtId;
  return `<svg class="card-art" viewBox="0 0 480 340" aria-hidden="true">
    <defs>
      <linearGradient id="card-g${n}" x1="10" y1="10" x2="10" y2="330" gradientUnits="userSpaceOnUse"><stop offset="0" class="c-bg"/><stop offset="1" class="c-bg2"/></linearGradient>
      <clipPath id="card-c${n}"><path d="M22 10 L458 10 C464.627 10 470 15.373 470 22 L470 318 C470 324.627 464.627 330 458 330 L22 330 C15.373 330 10 324.627 10 318 L10 22 C10 15.373 15.373 10 22 10 Z"/></clipPath>
    </defs>
    <path d="M21 9 L459 9 C468.941 9 477 17.059 477 27 L477 319 C477 328.941 468.941 337 459 337 L21 337 C11.059 337 3 328.941 3 319 L3 27 C3 17.059 11.059 9 21 9 Z" fill="#000" fill-opacity="0.25"/>
    <path class="c-edge" d="M21 3 L459 3 C468.941 3 477 11.059 477 21 L477 319 C477 328.941 468.941 337 459 337 L21 337 C11.059 337 3 328.941 3 319 L3 21 C3 11.059 11.059 3 21 3 Z"/>
    <path class="c-frame" d="M22 6 L458 6 C466.837 6 474 13.163 474 22 L474 318 C474 326.837 466.837 334 458 334 L22 334 C13.163 334 6 326.837 6 318 L6 22 C6 13.163 13.163 6 22 6 Z"/>
    <path d="M22 10 L458 10 C464.627 10 470 15.373 470 22 L470 318 C470 324.627 464.627 330 458 330 L22 330 C15.373 330 10 324.627 10 318 L10 22 C10 15.373 15.373 10 22 10 Z" fill="url(#card-g${n})"/>
    <g clip-path="url(#card-c${n})"><path d="M368.5 67 C435.603 67 490 121.397 490 188.5 C490 255.603 435.603 310 368.5 310 C301.397 310 247 255.603 247 188.5 C247 121.397 301.397 67 368.5 67 Z M484.679 188.5 C484.679 124.336 432.664 72.321 368.5 72.321 C304.336 72.321 252.321 124.336 252.321 188.5 C252.321 252.664 304.336 304.679 368.5 304.679 C432.664 304.679 484.679 252.664 484.679 188.5 Z" fill="#ffffff" opacity="0.07"/> <path d="M368.5 105.135 C414.541 105.135 451.865 142.459 451.865 188.5 C451.865 206.397 446.225 222.977 436.626 236.559 L405.587 205.519 C407.968 200.339 409.296 194.575 409.296 188.5 C409.296 188.066 409.289 187.633 409.275 187.203 L409.275 187.202 C408.59 165.272 390.597 147.704 368.5 147.704 C362.425 147.704 356.661 149.032 351.481 151.413 L320.441 120.374 C334.023 110.775 350.603 105.135 368.5 105.135 Z M385.519 225.587 L416.559 256.626 C402.977 266.225 386.397 271.865 368.5 271.865 C322.459 271.865 285.135 234.541 285.135 188.5 C285.135 170.603 290.775 154.023 300.374 140.441 L331.413 171.481 C329.032 176.661 327.704 182.425 327.704 188.5 C327.704 211.031 345.969 229.296 368.5 229.296 C374.575 229.296 380.339 227.968 385.519 225.587 Z" class="c-ring"/> <path d="M368.5 167.215 C380.255 167.215 389.785 176.745 389.785 188.5 C389.785 200.255 380.255 209.785 368.5 209.785 C356.745 209.785 347.215 200.255 347.215 188.5 C347.215 176.745 356.745 167.215 368.5 167.215 Z" class="c-ring"/> <path d="M-24.136 172.928 L-17.064 165.856 L182.139 365.059 L175.067 372.131 Z" fill="#ffffff" opacity="0.07"/> <path d="M-37.987 182.063 L-30.915 174.991 L168.288 374.194 L161.216 381.266 Z" fill="#ffffff" opacity="0.07"/> <path d="M-51.837 191.198 L-44.765 184.126 L154.438 383.329 L147.366 390.401 Z" fill="#ffffff" opacity="0.07"/> <path d="M-65.688 200.332 L-58.616 193.26 L140.587 392.464 L133.515 399.536 Z" fill="#ffffff" opacity="0.07"/></g>
    <path class="c-field" d="M271.821 22 L445.172 22 C450.048 22 454 26.925 454 33 L454 33 C454 39.075 450.048 44 445.172 44 L271.821 44 C266.945 44 262.993 39.075 262.993 33 L262.993 33 C262.993 26.925 266.945 22 271.821 22 Z"/>
    <path d="M32.306 54 L221.694 54 C226.281 54 230 58.477 230 64 L230 64 C230 69.523 226.281 74 221.694 74 L32.306 74 C27.719 74 24 69.523 24 64 L24 64 C24 58.477 27.719 54 32.306 54 Z" fill="#fff" fill-opacity="0.28"/>
  </svg>`;
}

const RUN_KEY = "pd.run";
const HOF_KEY = "pd.hallOfFame";
const DETAIL_TABS = [
  { id: "stats", label: "Stats", icon: "protein" },
  { id: "abilities", label: "Abilities", icon: "ability-patch" },
  { id: "evolution", label: "Evolution", icon: "everstone" },
  { id: "moves", label: "Moves", icon: "tm-normal" },
];
// Which generation's wins open the run rules (Mixed Gens counts your best generation)
const ruleGen = (meta) => (["mixed", "gauntlet"].includes(meta.setup?.path) ? "m" : meta.setup?.gen);
// The colour of a progress text: nothing yet, on the way, nearly there
const progressClass = (share) => (share >= 0.75 ? "near" : share > 0 ? "some" : "none");
const TYPE_CHOICES = ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel"];
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const STOP_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "E1", "E2", "E3", "E4", "C", "R"];

const escapeHtml = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const store = {
  get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked/full */ } noteSave(); },
  remove(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } noteSave(); },
};

// The most iconic Pokémon of each generation (the box art legends), and the starter trios
const ICONIC = { 1: "charizard", 2: "lugia", 3: "rayquaza", 4: "dialga", 5: "reshiram" };
// The evil team path of each generation: a trainer sprite for its card (images/trainers)
const EVIL_ICON = { 1: "giovanni", 2: "archer", 3: "archie", 4: "cyrus", 5: "ghetsis" };
const STARTER_TRIOS = [["bulbasaur", "charmander", "squirtle"], ["chikorita", "cyndaquil", "totodile"], ["treecko", "torchic", "mudkip"], ["turtwig", "chimchar", "piplup"], ["snivy", "tepig", "oshawott"]];

export class RunUI {
  constructor(ctx) {
    this.ctx = ctx;
    // Play time of the run in progress (the Fast win unlock): counts while the page is open and visible
    setInterval(() => {
      if (this.run && !this.preview && document.visibilityState === "visible" && !["won", "over"].includes(this.run.screen)) this.run.playMs = (this.run.playMs ?? 0) + 5000;
    }, 5000);
    setSyncChooser((cloud, local) => this.syncChoice(cloud, local));
    setPublicStats((meta) => ({ trainers: CHARACTERS.filter((c) => isUnlocked(meta, ctx.rules.characterUnlocks?.[c.id])).length }));
    this.hub = document.getElementById("hub");
    this.app = document.getElementById("app");
    this.run = null;
    this.preview = false; // debug panel preview: nothing is saved (see dev-tools.js)
    this.battleScreen = null;
    try { this.showEffects = localStorage.getItem("pd.showEffects") === "1"; } catch { this.showEffects = false; }
    try { this.teamView = localStorage.getItem("pd.teamView") === "detailed" ? "detailed" : "grid"; } catch { this.teamView = "grid"; }
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
    else if (name === "leaderboards" && cloudAvailable()) this.renderLeaderboards();
    else if (name === "hof") this.renderHallOfFame();
    else if (name === "profile") this.renderProfile();
    else if (name === "challenges") this.renderChallenges();
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
    playMusic("hub");
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
    // The "can learn" list in the Moves bar keeps its scroll too (for the same Pokémon)
    const learnBox = this.hub.querySelector(".moves-panel .move-chips.scroll");
    const learnScroll = sameScreen && learnBox ? { uid: this.moveFocus, top: learnBox.scrollTop } : null;
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
      const box = this.hub.querySelector(".moves-panel .move-chips.scroll");
      if (box && learnScroll && learnScroll.uid === this.moveFocus) box.scrollTop = learnScroll.top;
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
      <div class="menu-list">
        ${savedRun ? `<button class="btn primary" data-act="continue">Continue run</button>` : ""}
        <button class="btn ${savedRun ? "" : "primary"}" data-act="new">New run</button>
        <button class="btn" data-act="upgrades">Skill Tree <span class="tp-pill">${meta.tp} TP</span></button>
        <button class="btn" data-act="challenges">Challenges <span class="tp-pill">${(meta.challenges ?? []).length}/${CHALLENGES.length}</span></button>
        <button class="btn" data-act="hof">Hall of Fame</button>
        <button class="btn" data-act="profile">Profile</button>
        ${cloudAvailable() ? `<button class="btn" data-act="leaderboards">Leaderboards</button>` : ""}
      </div>
      ${cloudAvailable() ? `<div class="account" data-account>${this.accountHtml()}</div>` : ""}
      ${savedRun ? `<p class="empty-note">Saved run: Gen ${savedRun.settings.gen}, next battle #${savedRun.order}, ${savedRun.team.length} Pokémon. Starting a new run replaces it.</p>` : ""}
      <p class="credits">Fan project, not for sale. Pokémon © Nintendo / Creatures / Game Freak / The Pokémon Company.<br>
        Pokémon &amp; item sprites and data: PokeAPI. Trainer sprites: Pokémon Showdown and its sprite artists.
        Player back sprites: Bulbagarden Archives.</p>
      <p class="version-tag">v${VERSION}</p>`;
    startTitleBanner(this.hub.querySelector(".title-banner"), this.ctx.data, this.ctx.leaders,
      () => characterById(loadMeta().character).back);
    this.stopAccountWatch?.();
    if (cloudAvailable()) this.stopAccountWatch = onCloudChange(() => {
      const box = this.hub.querySelector("[data-account]");
      if (box) box.innerHTML = this.accountHtml(); else this.stopAccountWatch?.();
    });
    this.hub.onclick = async (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "sign-in") { try { await signIn(); } catch (err) { if (err?.code !== "auth/popup-closed-by-user") alert(`Could not sign in: ${err.message}`); } return; }
      if (act === "sign-out") { await signOutUser(); return; }
      if (act === "username") {
        const m = loadMeta();
        const raw = prompt("Your name on the leaderboards (up to 16 characters). Leave empty to use your Google first name.", m.username ?? publicName(m));
        if (raw !== null) { m.username = cleanUsername(raw); saveMeta(m); const box = this.hub.querySelector("[data-account]"); if (box) box.innerHTML = this.accountHtml(); }
        return;
      }
      if (act === "leaderboards") { this.renderLeaderboards(); return; }
      if (act === "continue") { this.run = savedRun; this.render(); }
      if (act === "new") this.renderSetup();
      if (act === "hof") this.renderHallOfFame();
      if (act === "upgrades") this.renderUpgrades();
      if (act === "profile") this.renderProfile();
      if (act === "challenges") this.renderChallenges();
    };
  }

  // First login on a device that already has progress: use the online save, keep this device, or combine them
  syncChoice(cloud, local) {
    return this.modal({
      title: "Your progress",
      variant: "settings",
      body: `<p class="opt-note">This account already has a save, and this device has one too. What should happen?</p>
        <div class="opt-grid sync-grid">
          <button class="opt-tile" data-result='"merge"'><b>Combine both</b><small>Adds up runs, wins and TP, keeps the higher upgrade levels and joins badges, unlocks and the Hall of Fame.</small><em>Online: ${cloud}<br>This device: ${local}</em></button>
          <button class="opt-tile" data-result='"cloud"'><b>Use the online save</b><small>Replaces what is on this device.</small><em>${cloud}</em></button>
          <button class="opt-tile" data-result='"local"'><b>Keep this device</b><small>Replaces the online save.</small><em>${local}</em></button>
        </div>`,
      options: [],
      cancel: "",
    }).then((r) => r ?? "local");
  }

  // Google login and cloud save status, under the title menu
  accountHtml() {
    const c = cloudState();
    if (!c.user) return `<button class="btn small" data-act="sign-in">Sign in with Google</button>`;
    const dot = { syncing: "Saving…", synced: "Saved", error: "Offline", idle: "" }[c.status];
    return `<span class="account-who">${escapeHtml(publicName(loadMeta()))}${dot ? `<small>${dot}</small>` : ""}</span>
      <button class="link-btn" data-act="username">Change name</button><button class="link-btn" data-act="sign-out">Sign out</button>`;
  }

  // Tabs: Ranks (everyone, a letter from Z up to A, see ranks.js) and one top 20 per number
  async renderLeaderboards(boardId = "ranks") {
    this.trackView("leaderboards");
    this.showHub();
    this.hub.className = "hub framed";
    this.hub.innerHTML = `
      <div class="offer-head"><h1>Leaderboards</h1><button class="btn" data-act="title">◀ Title</button></div>
      <div class="tabs board-tabs">
        ${[{ id: "ranks", label: "Players" }, { id: "challenges", label: "Challenges" }].map((b) => `<button class="tab ${b.id === boardId ? "active" : ""}" data-act="board" data-board="${b.id}">${b.label}</button>`).join("")}
        <span class="tab-group" role="group" aria-label="Long lists"><em>Lists</em>${[{ id: "hof", label: "Hall of Fame" }, { id: "pokemon", label: "Most used" }].map((b) => `<button class="tab ${b.id === boardId ? "active" : ""}" data-act="board" data-board="${b.id}">${b.label}</button>`).join("")}</span>
      </div>
      ${boardId === "hof" ? `<p class="rank-note">The latest winning teams of all players, newest first.</p>` : ""}
      ${boardId === "challenges" ? `<p class="rank-note">Special goals for a winning run. Beat one in any run to put your name on it.</p>` : ""}
      ${boardId === "pokemon" ? `<p class="rank-note">The Pokémon that were in the most winning Hall of Fame teams, across all players.</p>` : ""}
      <p class="rank-note click-note">Click a player to see their profile: trainer, favourite team, stats and champion teams.</p>
      ${boardId === "ranks" ? `<p class="rank-note">Everyone starts at Z. Climb towards A: points for your furthest run, every Champion win and flawless win, every badge and every trainer you unlock.</p>` : ""}
      <section class="card-panel"><ol class="board-list" data-board-list><li class="empty-note">Loading…</li></ol></section>`;
    this.boardPlayers = new Map(); // uid → the line, for the profile window
    const avatarOf = (p) => { const c = CHARACTERS.find((x) => x.id === p.avatar); return c ? `<img class="board-avatar" src="${c.front}" alt="">` : `<img class="board-avatar default" src="images/ui/ball.png" alt="" title="No trainer picked yet">`; };
    const stagger = (box) => box.querySelectorAll(":scope > li").forEach((li, i) => li.style.setProperty("--i", Math.min(i, 24)));
    const favOf = (p) => { const list = (p.favs ?? []).filter((k) => this.ctx.data.pokemonByKey[k]); const mon = list.length ? this.ctx.data.pokemonByKey[list[Math.floor(Math.random() * list.length)]] : null; return mon ? `<img class="rc-fav" src="${mon.sprites.front}" alt="${escapeHtml(mon.name)}" title="${escapeHtml(mon.name)}">` : ""; };
    this.hub.onclick = (e) => {
      const el = e.target.closest("[data-act]");
      if (el?.dataset.act === "title") this.start();
      if (el?.dataset.act === "board") this.renderLeaderboards(el.dataset.board);
      const row = e.target.closest("[data-uid]"); // a row or a name tag
      if (row && !el) this.playerProfile(this.boardPlayers.get(row.dataset.uid)); // a click on a player opens their profile
    };
    if (boardId === "hof" || boardId === "challenges") {
      let players;
      try { players = this.patchMine(await allPlayers()); } catch (err) { console.error(err); players = null; }
      const box = this.hub.querySelector("[data-board-list]");
      if (!box) return;
      const myId = cloudState().user?.uid;
      if (players === null) { box.innerHTML = `<li class="empty-note">Could not load the leaderboard.</li>`; return; }
      if (boardId === "challenges") {
        for (const p of players) this.boardPlayers.set(p.uid, p);
        const mine = new Set(loadMeta().challenges ?? []);
        const total = Math.max(1, players.length);
        const row = (c) => {
          const done = players.filter((p) => p.challenges?.includes(c.id)).sort((a, b) => String(a.name).localeCompare(String(b.name)));
          const pills = done.slice(0, 10).map((p) => `<span class="user-pill clickable ${p.uid === myId ? "me" : ""}" data-uid="${p.uid}">${avatarOf(p).replace("board-avatar", "pill-avatar")}${escapeHtml(p.name ?? "Trainer")}</span>`).join("") + (done.length > 10 ? `<span class="user-pill more">+${done.length - 10} more</span>` : "");
          return `<li class="challenge-row ${mine.has(c.id) ? "done" : ""}"><span class="ch-check" title="${mine.has(c.id) ? "You beat this one" : "Not beaten yet"}">${mine.has(c.id) ? "✓" : ""}</span>
            <span class="who"><span class="ch-title"><strong>${c.name}</strong><em class="ch-tag ${c.rule ? "rule" : ""}">${c.rule ? `Rule: ${c.rule}` : "Any run"}</em>${mine.has(c.id) ? `<em class="ch-done-tag">Done</em>` : ""}</span><small>${c.text}${c.hint ? ` <em class="ch-hint">${c.hint}</em>` : ""}</small>
            <span class="ch-bar" title="${done.length} of ${players.length} players"><i style="width:${Math.round(done.length / total * 100)}%"></i></span>
            ${done.length ? `<span class="user-pills">${pills}</span>` : ""}</span>
            <b>${done.length}<small> / ${players.length}</small></b></li>`;
        };
        box.innerHTML = `<li class="ch-head"><b>${CHALLENGES.filter((c) => mine.has(c.id)).length} of ${CHALLENGES.length}</b> beaten by you<small>Beat a challenge in a winning run. Most count in any run; a rule challenge needs its switch on before you start.</small></li>`
          + this.challengeRows(CHALLENGES, mine, row)
          + `<li class="ch-head soon"><b>Coming soon</b><small>Ideas on the list. They aren't tracked yet.</small></li>`
          + PLANNED.map((c) => `<li class="challenge-row planned"><span class="ch-check"></span><span class="who"><span class="ch-title"><strong>${c.name}</strong></span><small>${c.text}${c.hint ? ` <em class="ch-hint">${c.hint}</em>` : ""}</small></span></li>`).join("");
        stagger(box);
        return;
      }
      for (const p of players) this.boardPlayers.set(p.uid, p);
      const entries = players.flatMap((p) => (p.hof ?? []).map((e) => ({ ...e, name: p.name ?? "Trainer", uid: p.uid, avatar: p.avatar }))).filter((e) => e.t?.some((m) => this.ctx.data.pokemonByKey[m.s]))
        .sort((a, b) => String(b.d).localeCompare(String(a.d)) || a.name.localeCompare(b.name)).slice(0, 30);
      box.innerHTML = entries.length ? entries.map((e) => `<li class="hof-row clickable ${e.uid === myId ? "me" : ""}" data-uid="${e.uid}"><span class="who"><strong>${avatarOf(e)}${escapeHtml(e.name)}</strong><small>${e.d} · Gen ${e.g} ${this.ctx.leaders[e.g]?.region ?? ""} · ${e.f ? `${e.f} fallen` : "Flawless"}</small>
          <span class="hof-mini">${e.t.filter((m) => this.ctx.data.pokemonByKey[m.s]).map((m) => { const mon = this.ctx.data.pokemonByKey[m.s]; return `<span class="mon" title="${mon.name} Lv ${m.l}"><img src="${m.sh ? mon.sprites.frontShiny : mon.sprites.front}" alt="${mon.name}"><small>Lv ${m.l}</small></span>`; }).join("")}</span></span></li>`).join("")
        : `<li class="empty-note">No champion teams yet. Win a run to start the board!</li>`;
      stagger(box);
      return;
    }
    if (boardId === "pokemon") {
      let players;
      try { players = this.patchMine(await allPlayers()); } catch (err) { console.error(err); players = null; }
      const box = this.hub.querySelector("[data-board-list]");
      if (!box) return;
      const totals = {};
      const users = {}; // species → who used it, and how many times
      for (const p of players ?? []) {
        for (const [k, n] of Object.entries(p.used ?? {})) {
          if (!this.ctx.data.pokemonByKey[k]) continue;
          totals[k] = (totals[k] ?? 0) + n;
          this.boardPlayers.set(p.uid, p);
          (users[k] ??= []).push({ name: p.name ?? "Trainer", n, uid: p.uid });
        }
      }
      const pills = (k) => {
        const list = users[k].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
        return `<span class="user-pills">${list.slice(0, 6).map((u) => `<span class="user-pill clickable" data-uid="${u.uid}">${avatarOf(this.boardPlayers.get(u.uid) ?? {}).replace("board-avatar", "pill-avatar")}${escapeHtml(u.name)}${u.n > 1 ? ` x ${u.n}` : ""}</span>`).join("")}${list.length > 6 ? `<span class="user-pill more">+${list.length - 6} more</span>` : ""}</span>`;
      };
      const top = Object.entries(totals).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 20);
      box.innerHTML = players === null ? `<li class="empty-note">Could not load the leaderboard.</li>`
        : top.length ? top.map(([k, n], i) => { const mon = this.ctx.data.pokemonByKey[k];
          return `<li><span class="rank">${i + 1}</span><img class="board-mon" src="${mon.sprites.front}" alt=""><span class="who">${escapeHtml(mon.name)}${pills(k)}</span><b>${n}<small> ${n === 1 ? "win" : "wins"}</small></b></li>`; }).join("")
        : `<li class="empty-note">No champion teams yet. Win a run to start the list!</li>`;
      stagger(box);
      return;
    }
    // One table for the players: rank, Champion wins, trainers unlocked and badges. Click a heading to sort by it.
    let rows;
    try { rows = this.patchMine(await allPlayers()).map((p) => ({ ...p, score: rankScore(p) })); } catch (err) { console.error(err); rows = null; }
    const list = this.hub.querySelector("[data-board-list]");
    if (!list) return; // left the screen meanwhile
    const me = cloudState().user?.uid;
    if (rows === null) { list.innerHTML = `<li class="empty-note">Could not load the ranks.</li>`; return; }
    if (!rows.length) { list.innerHTML = `<li class="empty-note">Nobody here yet. Win a run to be first!</li>`; return; }
    this.boardSort ??= "score";
    const COLUMNS = [["score", "Rank"], ["wins", "Champion wins"], ["trainers", "Trainers"], ["badges", "Badges"]];
    const favs = new Map(rows.map((p) => [p.uid, favOf(p)])); // (the same Pokémon while you sort)
    const draw = () => {
      const key = this.boardSort;
      const sorted = [...rows].sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0) || b.score - a.score || String(a.name).localeCompare(String(b.name)));
      const head = `<li class="board-head"><span></span><span></span><span class="bh-player">Player</span>${COLUMNS.map(([k, label]) => `<button class="bh-col ${k === key ? "on" : ""}" data-act="sort" data-sort="${k}">${label}${k === key ? " ▾" : ""}</button>`).join("")}</li>`;
      list.innerHTML = head + sorted.map((p, i) => {
        const r = rankOf(p.score);
        const bar = r.next ? `<span class="rank-bar" title="${r.next - p.score} points to the next letter"><i style="width:${Math.round((p.score - r.from) / (r.next - r.from) * 100)}%"></i></span>` : `<span class="rank-bar top"><i style="width:100%"></i></span>`;
        this.boardPlayers.set(p.uid, p);
        const t = (25 - (r.letter.charCodeAt(0) - 65)) / 25; // 0 for Z, 1 for A: from a dull blue to gold
        const colour = `hsl(${Math.round(215 - 165 * t)} ${Math.round(25 + 65 * t)}% ${Math.round(48 + 14 * t)}%)`;
        const cell = (k, v, small = "") => `<b class="bh-val ${k === key ? "on" : ""}">${v}${small ? `<small>${small}</small>` : ""}</b>`;
        return `<li class="rank-card player-row clickable ${p.uid === me ? "me" : ""} ${i < 3 ? `podium p${i + 1}` : ""}" data-uid="${p.uid}" style="--lc:${colour}">
          <span class="rank-pos">${["🥇", "🥈", "🥉"][i] ?? i + 1}</span>
          <span class="rank-letter" style="background:${colour}">${r.letter}</span>
          <span class="pr-player">${avatarOf(p).replace("board-avatar", "rc-avatar")}<span class="rc-main"><b class="rc-name">${escapeHtml(p.name ?? "Trainer")}</b><small>${p.tagline ? escapeHtml(p.tagline) : `${p.score} pts`}</small>${bar}</span>${favs.get(p.uid)}</span>
          ${cell("score", p.score, " pts")}${cell("wins", p.wins ?? 0)}${cell("trainers", p.trainers ?? 1)}${cell("badges", p.badges ?? 0, " / 40")}</li>`;
      }).join("");
      stagger(list);
    };
    this.boardSort = COLUMNS.some(([k]) => k === this.boardSort) ? this.boardSort : "score";
    draw();
    list.onclick = (e) => {
      const b = e.target.closest("[data-act='sort']");
      if (!b) return;
      e.stopPropagation();
      this.boardSort = b.dataset.sort;
      draw();
    };
  }

  // ===============================
  // PROFILE & STATS
  // ===============================

  // Everything the profile header needs: the trainer avatar, the name, the rank
  // Your own line on the boards always shows your current trainer, tagline and favourites (the saved line can be older)
  patchMine(list) {
    const uid = cloudState().user?.uid;
    if (!uid) return list;
    const meta = loadMeta();
    const me = this.myProfile(meta);
    return list.map((p) => (p.uid === uid ? { ...p, avatar: me.avatar.id, tagline: me.tagline || p.tagline, favs: (meta.profile?.favs ?? []).filter(Boolean).length ? meta.profile.favs.filter(Boolean) : p.favs } : p));
  }

  myProfile(meta) {
    const hof = store.get(HOF_KEY) ?? [];
    const unlocks = this.ctx.rules.characterUnlocks ?? {};
    const open = CHARACTERS.filter((c) => isUnlocked(meta, unlocks[c.id]));
    const avatar = open.find((c) => c.id === meta.profile?.avatar) ?? characterById(meta.character);
    const line = { best: meta.best ?? 0, wins: meta.wins ?? 0, cleanWins: meta.cleanWins ?? 0, badges: (meta.badges ?? []).length, trainers: open.length };
    return { hof, open, avatar, name: publicName(meta), tagline: cleanTagline(meta.profile?.tagline), rank: rankOf(rankScore(line)), score: rankScore(line), trainers: open.length };
  }

  // The Profile screen: Stats (everything counted) and Customize (name, line, avatar, six favourites)
  renderProfile(tab = this.profileTab ?? "stats") {
    this.trackView("profile");
    this.showHub();
    this.profileTab = tab;
    const meta = loadMeta();
    const me = this.myProfile(meta);
    const { data } = this.ctx;
    this.hub.className = "hub framed";
    const favs = (meta.profile?.favs ?? []).filter((k) => data.pokemonByKey[k]).slice(0, 6);
    const head = `<div class="profile-head">
      <img class="profile-avatar" src="${me.avatar.front}" alt="">
      <div class="profile-who"><h1>${escapeHtml(me.name)}</h1>${me.tagline ? `<p>${escapeHtml(me.tagline)}</p>` : `<p class="empty-note">No tagline yet</p>`}</div>
      <div class="profile-rank" title="${me.score} points"><b>${me.rank.letter}</b><small>${me.score} pts</small></div>
      <button class="btn" data-act="title">◀ Title</button></div>`;
    const tabs = `<div class="tabs board-tabs">${[["stats", "Stats"], ["custom", "Customize"]].map(([id, label]) => `<button class="tab ${tab === id ? "active" : ""}" data-act="ptab" data-tab="${id}">${label}</button>`).join("")}</div>`;
    let body;
    if (tab === "stats") {
      const sections = buildStats(meta, me.hof, this.ctx, { trainers: me.trainers, trainersTotal: CHARACTERS.length });
      body = `<div class="stat-sections">${sections.map((sec) => `<section class="stat-section"><h3>${sec.title}</h3>
        ${sec.action ? `<div class="tp-restore"><p>${sec.action.text}</p><button class="btn" data-act="${sec.action.act}">${sec.action.label}</button></div>` : ""}<div class="stat-grid">${sec.rows.map((r) => `<div class="stat ${r.wide ? "wide" : ""}"><span>${r.label}</span><b>${escapeHtml(String(r.value))}</b>${r.hint ? `<small>${escapeHtml(r.hint)}</small>` : ""}</div>`).join("")}</div></section>`).join("")}</div>`;
    } else {
      body = `<div class="profile-edit">
        <label class="field"><span>Name on the leaderboards</span><input data-field="username" maxlength="16" value="${escapeHtml(meta.username ?? "")}" placeholder="${escapeHtml(me.name)}"><small>Up to 16 characters. Empty uses your Google first name.</small></label>
        <label class="field"><span>Tagline</span><input data-field="tagline" maxlength="40" value="${escapeHtml(meta.profile?.tagline ?? "")}" placeholder="A short line under your name"><small>Up to 40 characters.</small></label>
        <div class="field"><span>Avatar</span><div class="avatar-grid">${me.open.map((c) => `<button class="avatar-pick ${c.id === me.avatar.id ? "selected" : ""}" data-act="avatar" data-id="${c.id}" title="${c.name}"><img src="${c.front}" alt=""><small>${c.name}</small></button>`).join("")}</div>
          <small>The trainers you have unlocked. ${me.open.length} of ${CHARACTERS.length}.</small></div>
        <div class="field"><span>Favourite team</span><div class="fav-slots">${Array.from({ length: 6 }, (_, i) => {
          const k = favs[i];
          return k ? `<button class="fav-slot filled" data-act="fav" data-i="${i}" title="Change ${data.pokemonByKey[k].name}"><img src="${data.pokemonByKey[k].sprites.front}" alt=""><small>${data.pokemonByKey[k].name}</small></button>`
            : `<button class="fav-slot" data-act="fav" data-i="${i}"><span>+</span><small>Pick</small></button>`;
        }).join("")}</div><small>Six Pokémon you have had. Everyone sees them on your profile${cloudAvailable() ? " in the leaderboards" : ""}.</small></div>
        ${favs.length ? `<button class="link-btn" data-act="clear-favs">Clear the team</button>` : ""}
      </div>`;
    }
    this.hub.innerHTML = `${head}${tabs}${body}`;
    // Typing saves when you leave the field
    this.hub.onchange = (e) => {
      const f = e.target.dataset?.field;
      if (!f) return;
      const m = loadMeta();
      if (f === "username") m.username = cleanUsername(e.target.value);
      if (f === "tagline") (m.profile ??= {}).tagline = cleanTagline(e.target.value);
      saveMeta(m);
      this.renderProfile("custom");
    };
    this.hub.onclick = async (e) => {
      const el = e.target.closest("[data-act]");
      const act = el?.dataset.act;
      if (act === "title") { this.hub.onchange = null; this.start(); return; }
      if (act === "ptab") { this.renderProfile(el.dataset.tab); return; }
      const m = loadMeta();
      if (act === "avatar") { (m.profile ??= {}).avatar = el.dataset.id; saveMeta(m); this.renderProfile("custom"); }
      if (act === "restore-tp") {
        const c = tpCheck(m, this.ctx.rules);
        const ok = await this.modal({
          title: "Restore Trainer Points?",
          body: `<p>Your wins pay at least ${c.floor} TP, but the earned total is ${c.earned}. This adds the missing ${c.missing} TP to your earned total and to the points you can spend.</p>`,
          options: [{ value: true, label: `Restore ${c.missing} TP` }],
          cancel: "Not now",
        });
        if (ok) { const fresh = loadMeta(); restoreTp(fresh, this.ctx.rules); saveMeta(fresh); this.renderProfile("stats"); }
        return;
      }
      if (act === "clear-favs") { (m.profile ??= {}).favs = []; saveMeta(m); this.renderProfile("custom"); }
      if (act === "fav") {
        const key = await this.speciesPicker(ownedSpecies(m, me.hof, this.ctx), m.profile?.favs ?? []);
        if (key === undefined) return;
        const list = [...(m.profile?.favs ?? [])].filter((k) => data.pokemonByKey[k]);
        const i = Number(el.dataset.i);
        if (key === "") list.splice(i, 1); else { const at = list.indexOf(key); if (at >= 0) list.splice(at, 1); list.splice(Math.min(i, list.length), 0, key); }
        (m.profile ??= {}).favs = list.slice(0, 6);
        saveMeta(m);
        this.renderProfile("custom");
      }
    };
  }

  // Pick one of the Pokémon you have had (a search box and a grid). Resolves with its key, "" to empty the slot, undefined when closed
  speciesPicker(owned, current) {
    const { data } = this.ctx;
    if (!owned.length) return this.modal({ title: "No Pokémon yet", body: `<p class="opt-note">Recruit a Pokémon in a run and it shows up here.</p>`, options: [], cancel: "Close" }).then(() => undefined);
    return this.modal({
      title: "Pick a favourite",
      wide: true,
      body: `<input class="species-search" placeholder="Search by name" aria-label="Search by name">
        <div class="species-grid">${owned.map((k) => `<button class="species-pick ${current.includes(k) ? "chosen" : ""}" data-result='${JSON.stringify(k)}' data-name="${data.pokemonByKey[k].name.toLowerCase()}" title="${data.pokemonByKey[k].name}"><img src="${data.pokemonByKey[k].sprites.front}" alt=""><small>${data.pokemonByKey[k].name}</small></button>`).join("")}</div>`,
      options: [],
      cancel: "Cancel",
      actions: `<button class="btn" data-result='""'>Empty this slot</button>`,
      onOpen: (dialog) => {
        const input = dialog.querySelector(".species-search");
        input.addEventListener("input", () => {
          const q = input.value.trim().toLowerCase();
          dialog.querySelectorAll(".species-pick").forEach((b) => { b.hidden = q && !b.dataset.name.includes(q); });
        });
        input.focus();
      },
    }).then((r) => (r === null ? undefined : r));
  }

  // Another player's profile, from the leaderboards: avatar, rank, numbers, favourite team, latest champion teams, challenges
  // The profile window of a player (click a row on the leaderboards): a banner in their rank colour, the numbers, the favourite team, champion teams
  playerProfile(p) {
    if (!p) return;
    const { data } = this.ctx;
    const avatar = CHARACTERS.find((c) => c.id === p.avatar);
    const score = rankScore(p);
    const rank = rankOf(score);
    const t = (25 - (rank.letter.charCodeAt(0) - 65)) / 25; // 0 for Z, 1 for A: from a dull blue to gold
    const colour = `hsl(${Math.round(215 - 165 * t)} ${Math.round(25 + 65 * t)}% ${Math.round(48 + 14 * t)}%)`;
    const bar = rank.next ? Math.round((score - rank.from) / (rank.next - rank.from) * 100) : 100;
    const mon = (k, extra = "") => { const d = data.pokemonByKey[k]; return d ? `<span class="pp-mon" title="${escapeHtml(d.name)}"><img src="${d.sprites.front}" alt="${escapeHtml(d.name)}">${extra}</span>` : ""; };
    const favKeys = (p.favs ?? []).filter((k) => data.pokemonByKey[k]).slice(0, 6);
    const favs = Array.from({ length: 6 }, (_, i) => favKeys[i]
      ? `<span class="pp-fav">${mon(favKeys[i], `<small>${escapeHtml(data.pokemonByKey[favKeys[i]].name)}</small>`)}</span>`
      : `<span class="pp-fav empty"><span>?</span></span>`).join("");
    const teams = (p.hof ?? []).map((e) => `<div class="pp-team"><div class="pp-team-head"><b>${escapeHtml(String(e.d))}</b><span>Gen ${e.g} · ${escapeHtml(this.ctx.leaders[e.g]?.region ?? "")}</span><em class="${e.f ? "" : "flawless"}">${e.f ? `${e.f} fallen` : "Flawless"}</em></div><div class="pp-team-mons">${(e.t ?? []).map((m) => mon(m.s, `<small>Lv ${m.l}</small>`)).join("")}</div></div>`).join("");
    const done = CHALLENGES.filter((c) => p.challenges?.includes(c.id));
    const stat = (icon, label, value) => `<div class="pp-stat"><i>${icon}</i><span>${label}</span><b>${value}</b></div>`;
    return this.modal({
      title: "",
      variant: "player-profile",
      body: `<div class="pp-banner" style="--lc:${colour}">
          <div class="pp-who"><div class="pp-avatar">${avatar ? `<img src="${avatar.front}" alt="">` : `<img class="default" src="images/ui/ball.png" alt="">`}</div>
            <div><h2 class="pp-name">${escapeHtml(p.name ?? "Trainer")}</h2>
              <p class="pp-tagline">${p.tagline ? escapeHtml(p.tagline) : `<span class="empty-note">${avatar ? avatar.name : "No trainer picked yet"}</span>`}</p>
              ${p.tagline && avatar ? `<p class="pp-trainer">Plays as ${avatar.name}</p>` : ""}</div></div>
          <div class="pp-rank"><b style="background:${colour}">${rank.letter}</b><span>${score} pts</span><i class="pp-rank-bar"><i style="width:${bar}%;background:${colour}"></i></i></div></div>
        <div class="pp-stats">${stat("🏆", "Champion wins", p.wins ?? 0)}${stat("⚔️", "Furthest battle", `${p.best ?? 0} / 14`)}${stat("✨", "Flawless wins", p.cleanWins ?? 0)}${stat("🎖️", "Badges", `${p.badges ?? 0} / 40`)}${stat("🧢", "Trainers", `${p.trainers ?? 0} / ${CHARACTERS.length}`)}${stat("✅", "Challenges", `${done.length} / ${CHALLENGES.length}`)}</div>
        <h4 class="ch-section">Favourite team</h4><div class="pp-favs">${favs}</div>
        ${teams ? `<h4 class="ch-section">Latest champion teams</h4>${teams}` : ""}
        ${done.length ? `<h4 class="ch-section">Challenges beaten</h4><div class="user-pills">${done.map((c) => `<span class="user-pill done">✓ ${escapeHtml(c.name)}</span>`).join("")}</div>` : ""}`,
      options: [],
      cancel: "Close",
    });
  }

  // The skill tree: one panel per arm, side by side. A panel builds upwards: the bottom row is open, every node above needs the one below
  renderUpgrades(tab = this.treeTab) {
    this.trackView("upgrades");
    this.showHub();
    const meta = loadMeta();
    const nodes = this.ctx.rules.upgrades;
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const refund = meta.refundNote;
    const spentTotal = spentOnTree(meta, nodes);
    const arms = [...new Set(nodes.map((n) => n.arm))];
    const active = arms.includes(tab) ? tab : arms[0];
    this.treeTab = active; // the tab you were on stays after buying
    const armProgress = (arm) => { const list = nodes.filter((n) => n.arm === arm); return `${list.reduce((a, n) => a + upgradeLevel(meta, n.id), 0)}/${list.reduce((a, n) => a + n.max, 0)}`; };
    // Every tab has the same size: the widest and the tallest panel decide, a smaller panel sits at the bottom, centred
    const maxCols = Math.max(...nodes.map((n) => n.pos[0] + n.span));
    const maxRows = Math.max(...nodes.map((n) => n.pos[1])) + 1;
    const panel = (arm) => {
      const list = nodes.filter((n) => n.arm === arm);
      const cols = Math.max(...list.map((n) => n.pos[0] + n.span));
      const rows = maxRows;
      // Empty cells of the grid are drawn as faint slots
      const taken = new Set(list.flatMap((n) => Array.from({ length: n.span }, (_, i) => `${n.pos[0] + i},${n.pos[1]}`)));
      const slots = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (!taken.has(`${x},${y}`)) slots.push(`<span class="tree-slot" style="grid-column:${x + 1};grid-row:${rows - y}"></span>`);
      const spent = list.reduce((a, n) => a + upgradeLevel(meta, n.id), 0), total = list.reduce((a, n) => a + n.max, 0);
      const html = list.map((n) => {
        const level = upgradeLevel(meta, n.id);
        const maxed = level >= n.max;
        const reason = lockReason(meta, n, nodes);
        const state = maxed ? "maxed" : reason ? "locked" : meta.tp >= nextCost(meta, n) ? "ready" : "poor";
        const stat = /^(hp|atk|def|spa|spd|spe)-/.test(n.id) ? n.id.split("-")[0] : "";
        const label = maxed ? "Maxed" : reason ? "🔒" : `${nextCost(meta, n)} TP`;
        const lit = n.requires.length && n.requires.every((r) => upgradeLevel(meta, r.id) >= r.level);

        return `<button class="tree-node ${state} ${level ? "owned" : ""} ${lit ? "lit" : ""} ${n.id.startsWith("final-") ? "final" : ""}" data-node="${n.id}" ${stat ? `data-stat="${stat}"` : ""}
          style="grid-column:${n.pos[0] + 1} / span ${n.span};grid-row:${rows - n.pos[1]}" data-tip="${escapeHtml(this.nodeHint(n, level))}">
          ${n.icon ? `<img src="${itemSprite(n.icon)}" alt="">` : ""}
          <b>${escapeHtml(n.name)}</b>
          <span class="foot"><span class="pips">${n.max > 1 ? Array.from({ length: n.max }, (_, i) => `<i class="${i < level ? "on" : ""}"></i>`).join("") : ""}</span><small>${label}</small></span></button>`;
      }).join("");
      return `<section class="tree-panel" data-arm="${arm}" style="--cols:${maxCols}">
        <div class="tree-grid" data-rows="${rows}" style="grid-template-columns:repeat(${cols}, minmax(var(--node-w), 148px));grid-template-rows:repeat(${rows}, var(--node-h))">${slots.join("")}${html}</div></section>`;
    };
    this.hub.className = "hub framed wide";
    this.hub.innerHTML = `
      <div class="offer-head">
        <div><h1>Skill Tree</h1>
          <p>Spend Trainer Points on permanent upgrades. Every panel builds upwards: finish a node to open the one above it.</p></div>
        <div class="row-buttons"><span class="tp-pill big">${meta.tp} TP</span><button class="btn" data-act="respec" ${spentTotal ? "" : "disabled"} title="Take back every upgrade for most of the Trainer Points you spent">Respec</button><button class="btn" data-act="title">◀ Title</button></div>
      </div>
      ${refund ? `<p class="refund-note">The upgrades you had were refunded: <b>+${refund} TP</b>. Spend them in the new skill tree.</p>` : ""}
      <div class="tabs tree-tabs">${arms.map((a) => `<button class="tab ${a === active ? "active" : ""}" data-tab="${a}" data-arm="${a}">${a}<small>${armProgress(a)}</small></button>`).join("")}</div>
      <div class="tree-panels">${panel(active)}</div>
      <p class="empty-note">Runs so far: ${meta.runs} · TP earned in total: ${meta.earned}</p>`;
    if (refund) { delete meta.refundNote; saveMeta(meta); } // shown once
    // Lines between the nodes (drawn from where the nodes really are), and a hover that shows what a node needs
    const grid = this.hub.querySelector(".tree-grid");
    const draw = () => this.drawTreeLines(grid, nodes, meta);
    requestAnimationFrame(draw);
    if (this.treeResize) window.removeEventListener("resize", this.treeResize);
    this.treeResize = draw;
    window.addEventListener("resize", draw);
    const mark = (id, on) => {
      const n = byId[id];
      if (!n) return;
      for (const r of n.requires) grid.querySelector(`[data-node="${r.id}"]`)?.classList.toggle("needed", on); // what you have to finish first
      grid.querySelectorAll(`path[data-to="${id}"]`).forEach((p) => p.classList.toggle("hl", on));
      grid.querySelectorAll(`path[data-from="${id}"]`).forEach((p) => { p.classList.toggle("hl-next", on); grid.querySelector(`[data-node="${p.dataset.to}"]`)?.classList.toggle("opens", on); }); // what it opens
    };
    grid.onmouseover = (e) => { const id = e.target.closest("[data-node]")?.dataset.node; if (id) mark(id, true); };
    grid.onmouseout = (e) => { const id = e.target.closest("[data-node]")?.dataset.node; if (id) mark(id, false); };
    this.hub.onclick = async (e) => {
      if (e.target.closest("[data-act]")?.dataset.act === "title") { this.start(); return; }
      if (e.target.closest("[data-act]")?.dataset.act === "respec") {
        const m0 = loadMeta();
        const spent = spentOnTree(m0, nodes);
        const refund = Math.floor(spent * (1 - RESPEC_FEE));
        const ok = await this.modal({
          title: "Respec the Skill Tree?",
          body: `<p>Every upgrade is taken back and you start the tree again.</p>
            <div class="nd"><div class="nd-row"><span>You spent</span><b>${spent} TP</b></div><div class="nd-row"><span>Fee (${Math.round(RESPEC_FEE * 100)}%)</span><b>−${spent - refund} TP</b></div><div class="nd-row"><span>You get back</span><b>${refund} TP</b></div></div>`,
          options: [{ value: true, label: `Respec, get ${refund} TP back` }],
          cancel: "Keep my upgrades",
        });
        if (!ok) return;
        const fresh = loadMeta();
        respecTree(fresh, nodes);
        saveMeta(fresh);
        this.renderUpgrades(active);
        return;
      }
      const tabBtn = e.target.closest("[data-tab]");
      if (tabBtn) { this.renderUpgrades(tabBtn.dataset.tab); return; }
      const id = e.target.closest("[data-node]")?.dataset.node;
      if (!id) return;
      const u = byId[id];
      const m = loadMeta();
      const level = upgradeLevel(m, u.id);
      const reason = lockReason(m, u, nodes);
      const cost = level < u.max ? nextCost(m, u) : null;
      const canBuy = level < u.max && !reason && m.tp >= cost;
      const STAT = { hp: "HP", atk: "Attack", def: "Defense", spa: "Sp. Atk", spd: "Sp. Def", spe: "Speed" };
      // What one level gives, in a few words: "+2 Sp. Def" / "+2%" / the table's own text for the rest
      const parts = u.does.split(";").map((d) => d.trim().split(":"));
      const first = parts[0];
      let big = u.effect, small = "", gain = null;
      if (first[0] === "stat-flat" || first[0] === "stat-pct") {
        const pct = first[0] === "stat-pct";
        const each = Number(first[2]);
        const names = parts.map((p2) => STAT[p2[1]]).join(" · ");
        big = `+${each}${pct ? "%" : ""} ${names}`;
        small = parts.length > 1 ? "for your whole team, in every battle" : "for every Pokémon, in every battle";
        if (parts.length === 1) gain = `${pct ? "+" : "+"}${each * level}${pct ? "%" : ""} → +${each * Math.min(level + 1, u.max)}${pct ? "%" : ""}`;
      } else if (first[0] === "tp-pct") {
        big = `+${first[1]}% Trainer Points`; small = "from every run";
        gain = `+${Number(first[1]) * level}% → +${Number(first[1]) * Math.min(level + 1, u.max)}%`;
      }
      const pips = Array.from({ length: u.max }, (_, i) => `<i class="${i < level ? "on" : ""}"></i>`).join("");
      const icon = u.icon ? `<img class="node-icon" src="${itemSprite(u.icon)}" alt="">` : "";
      const stat = /^(hp|atk|def|spa|spd|spe)-/.test(u.id) ? u.id.split("-")[0] : "";
      const body = `<div class="nd" ${stat ? `data-stat="${stat}"` : ""}>
        <div class="nd-top">${icon}<div><div class="nd-big">${escapeHtml(big)}</div>${small ? `<div class="nd-small">${small}</div>` : ""}</div></div>
        <div class="nd-row"><span>Level</span><span class="nd-pips">${pips}</span><b>${level} / ${u.max}</b></div>
        ${gain ? `<div class="nd-row"><span>This node</span><b>${gain}</b></div>` : ""}
        ${level >= u.max ? `<div class="nd-note done">Finished</div>` : reason ? `<div class="nd-note locked">🔒 ${escapeHtml(reason)}</div>`
          : `<div class="nd-row"><span>Your TP</span><b>${m.tp} → ${Math.max(0, m.tp - cost)}</b></div>`}
      </div>`;
      const buy = level >= u.max || reason ? "" : canBuy ? `<button class="btn buy" data-result="true">Buy · ${cost} TP</button>` : `<button class="btn buy" disabled>Need ${cost - m.tp} more TP</button>`;
      const ok = await this.modal({ title: u.name, body, options: [], cancel: reason || level >= u.max ? "Close" : "Not now", actions: buy, variant: "node-modal" });
      if (!ok) return;
      const fresh = loadMeta();
      buyUpgrade(fresh, u, nodes);
      saveMeta(fresh);
      const top = window.scrollY;
      this.renderUpgrades(active);
      window.scrollTo(0, top); // stay where you were
    };
  }

  // Lines from every node up to the nodes it needs: up from the one below, along the free space under the row, up into the node.
  // Lit when that requirement is met.
  drawTreeLines(grid, nodes, meta) {
    if (!grid?.isConnected) return;
    grid.querySelector("svg.tree-lines")?.remove();
    const g = grid.getBoundingClientRect();
    const box = (el) => { const r = el.getBoundingClientRect(); return { x: r.left - g.left + r.width / 2, top: r.top - g.top, bottom: r.bottom - g.top }; };
    const els = Object.fromEntries([...grid.querySelectorAll("[data-node]")].map((e) => [e.dataset.node, e]));
    const paths = [];
    for (const n of nodes) {
      const to = els[n.id];
      if (!to) continue;
      const T = box(to);
      for (const r of n.requires) {
        const from = els[r.id];
        if (!from) continue;
        const F = box(from);
        const met = upgradeLevel(meta, r.id) >= r.level;
        const gapY = T.bottom + 14; // the gap right under the node's row
        const d = F.top > T.bottom ? `M${F.x} ${F.top}V${gapY}H${T.x}V${T.bottom}` : `M${F.x} ${F.top}L${T.x} ${T.bottom}`;
        paths.push({ met, html: `<path data-from="${r.id}" data-to="${n.id}" class="${met ? "lit" : ""}" d="${d}"/>` });
      }
    }
    paths.sort((a, b) => a.met - b.met); // lit lines on top
    grid.insertAdjacentHTML("afterbegin", `<svg class="tree-lines" width="${g.width}" height="${g.height}" aria-hidden="true">${paths.map((p) => p.html).join("")}</svg>`);
  }

  // Debug panel option "Show locked and hidden choices": everything the progressive reveal hides is shown (and marked)
  revealAll() {
    try { return !!JSON.parse(localStorage.getItem("pd.dev.opts") ?? "{}").reveal; } catch { return false; }
  }

  // Re-draw the open setup screen (the debug panel toggles what it shows)
  refreshView() {
    let view = null;
    try { view = sessionStorage.getItem("pd.dev.view"); } catch { /* ignore */ }
    if (view === "setup") this.renderSetup();
  }

  // How far you got in a Challenge Gen: the pips (8 gyms, Elite Four, Champion, Final Rival) and a line of text
  // The small hover text of a Skill Tree node: "+4 HP" (and what you have so far), or the node's effect text for the others
  nodeHint(n, level = 0) {
    const STAT = { hp: "HP", atk: "Attack", def: "Defense", spa: "Sp. Atk", spd: "Sp. Def", spe: "Speed" };
    const parts = n.does.split(";").map((d) => d.trim()).filter((d) => /^(stat-flat|stat-pct|tp-pct)/.test(d));
    const others = n.does.split(";").map((d) => d.trim()).filter((d) => d && !/^(stat-flat|stat-pct|tp-pct)/.test(d));
    if (!parts.length || others.some((d) => !d.startsWith("unlock:"))) return n.effect; // (a node that also does something else keeps its full text)
    const text = (part, times) => {
      const [kind, a, b] = part.split(":");
      const v = Number(kind === "tp-pct" ? a : b) * times;
      return kind === "stat-flat" ? `+${v} ${STAT[a]}` : kind === "stat-pct" ? `+${v}% ${STAT[a]}` : `+${v}% Trainer Points`;
    };
    const gain = parts.map((p) => text(p, 1)).join(", ");
    return `${gain}${level ? ` (you have ${parts.map((p) => text(p, level)).join(", ")})` : ""}`;
  }

  genProgress(meta, g) { // g is a generation (1 to 5) or "e1" to "e5" for an evil team path
    const evil = String(g).startsWith("e");
    const beaten = Math.min(14, Math.max(0, (meta.reach?.[g] ?? 1) - 1));
    const cleared = g === "m" ? meta.mixedWins ?? 0 : g === "g" ? meta.gauntletWins ?? 0 : evil ? meta.evilWins?.[String(g).slice(1)] ?? 0 : meta.winGens?.[g] ?? 0;
    const pips = Array.from({ length: 14 }, (_, i) => `<i class="${i < (cleared ? 14 : beaten) ? "done" : ""} ${i < 8 ? "gym" : i < 12 ? "e4" : "top"}"></i>`).join("");
    const text = cleared ? `Cleared ${cleared > 1 ? `×${cleared}` : "✓"}` : beaten ? `Best: ${beaten} of 14 beaten` : "Not played yet";
    return { pips: `<span class="gen-progress" aria-hidden="true">${pips}</span>`, text };
  }

  // NEW RUN: a summary of your loadout as cards (remembered from last time). Tap a card to change it, then Start.
  // The badge case card appears after your first badge.
  renderSetup() {
    this.trackView("setup");
    this.hub.className = "hub setup-screen";
    const meta = loadMeta();
    // this run's boost zones (older saves had pairs that don't cover the whole case)
    if (!validZones(meta.badgeLinks)) { meta.badgeLinks = randomZones(); saveMeta(meta); }
    const unlocks = this.ctx.rules.characterUnlocks ?? {};
    const reveal = this.revealAll();
    const locked = (c) => !isUnlocked(meta, unlocks[c.id]);
    if (locked(characterById(meta.character))) { meta.character = "lucas"; saveMeta(meta); } // a character that is still locked
    meta.setup ??= { gen: 1, pools: [1, 2, 3, 4, 5] };
    const setup = meta.setup;
    const owned = ownedBadges(meta);
    const hasBadges = owned.size > 0;
    const c = characterById(meta.character);
    const slots = caseOf(meta);
    const evilPath = setup.path === "evil" && !!this.ctx.evil?.[setup.gen] && this.evilOpen(meta, setup.gen);
    const mixedPath = setup.path === "mixed" && this.mixedOpen(meta);
    const gauntletPath = setup.path === "gauntlet" && this.mixedOpen(meta);
    const gp = this.genProgress(meta, gauntletPath ? "g" : mixedPath ? "m" : evilPath ? `e${setup.gen}` : setup.gen);
    const spriteMode = SPRITE_MODES.find((m) => m.id === meta.sprites) ?? SPRITE_MODES[0];
    // Icons that follow the settings: the equipped badges in this run's zones, one starter per generation (dim = not in the pool)
    const ZONE_COLORS = ["#5ec8ff", "#ff8fd0", "#9be564", "#ffb454", "#c79bff", "#5eead0", "#ff7b72", "#e6e36b"];
    const zoneOf = (i) => (meta.badgeLinks ?? []).findIndex((z) => z.slots?.includes(i));
    const caseIcon = `<span class="sc-slots">${slots.map((id, i) => `<span class="sc-slot ${id ? "" : "empty"}" style="--zone: ${ZONE_COLORS[zoneOf(i)] ?? "#6d7ba0"}">${id ? this.badgeImg(id) : ""}</span>`).join("")}</span>`;
    // One starter per generation, drawn again every time this screen opens (fire, water and grass all show up)
    this.starterPicks = STARTER_TRIOS.map((trio) => trio[Math.floor(Math.random() * 3)]);
    const poolIcon = `<span class="sc-starters">${this.starterPicks.map((k, i) => `<img class="${setup.pools.includes(i + 1) ? "" : "off"}" src="${this.ctx.data.pokemonByKey[k].sprites.front}" alt="Gen ${i + 1}">`).join("")}</span>`;
    const challengeIcon = gauntletPath ? `<span class="sc-rainbow">⚔️</span>` : mixedPath ? `<span class="sc-rainbow">🌈</span>` : evilPath ? `<img class="sc-img" src="images/trainers/${EVIL_ICON[setup.gen]}.png" alt="">` : `<img class="sc-img" src="${this.ctx.data.pokemonByKey[ICONIC[setup.gen]].sprites.front}" alt="">`;
    const spriteDir = spriteMode.id === "gen5-ani" ? "gen5-ani" : spriteMode.id === "gen4" ? "gen4" : "gen5";
    const spriteIcon = `<img class="sc-img" src="images/sprites/${spriteDir}/front/9.${spriteMode.id === "gen5-ani" ? "gif" : "png"}" alt="">`;
    const choices = this.runChoices(meta);
    const MODE_NAMES = { moves: "Random moves", levels: "Random levels", rainbow: "Rainbow", hard: "Hard mode", noitems: "No items", mono: "Mono type", opponents: "Random gyms" };
    const runModes = [choices.fixedSix ? "Fixed Six" : null, ...Object.keys(choices.modes).map((k) => MODE_NAMES[k])].filter(Boolean); // challenge runs (Challenge window)
    const rules = [setup.dupes !== false ? "Dupes clause" : null, choices.favType ? "Type Magnet" : null, Object.keys(choices.picks).length ? `${Object.keys(choices.picks).length} pick${Object.keys(choices.picks).length > 1 ? "s" : ""}` : null].filter(Boolean);
    const card = ({ act, label, body, sub, ghost = "" }) => `<button class="setup-card ${ghost ? "ghost" : ""}" data-act="${act}">
      <span class="sc-label">${label}${ghost ? ` <em class="sc-hidden" title="Hidden until you win your first badge">${ghost}</em>` : ""}</span>
      <span class="sc-body">${body}</span><span class="sc-sub">${sub}</span><span class="sc-go" aria-hidden="true">Change ▸</span></button>`;
    this.hub.innerHTML = `
      <h1>New run</h1>
      <div class="setup-grid">
        ${card({ act: "pick-character", label: "Trainer", body: `<img class="sc-img" src="${c.front}" alt=""><b>${c.name}</b>`, sub: `${CHARACTERS.filter((x) => !locked(x)).length} of ${CHARACTERS.length} unlocked` })}
        ${card({ act: "pick-gen", label: "Challenge", body: `${challengeIcon}<b>${gauntletPath ? "Gauntlet" : mixedPath ? "Mixed Gens" : this.ctx.leaders[setup.gen].region}</b>${gp.pips}`, sub: runModes.length ? `${gp.text} · ${runModes.join(", ")}` : gp.text })}
        ${hasBadges || reveal ? card({ act: "badge-editor", label: "Badge case", ghost: hasBadges ? "" : "hidden",
          body: caseIcon,
          sub: `${slots.filter(Boolean).length} of ${unlockedSlotCount(meta)} slots · ${owned.size} badges owned` }) : ""}
        ${card({ act: "pick-pool", label: "Pokémon Pool",
          body: `${poolIcon}<b>${setup.pools.length === 5 ? "All generations" : `Gen ${setup.pools.join(", ")}`}</b>`, sub: "Where your recruits come from" })}
        ${card({ act: "pick-rules", label: "Rules",
          body: `<span class="sc-chal ${rules.length ? "on" : ""}">${rules.length}</span><b>${rules.length ? `${rules.length} rule${rules.length > 1 ? "s" : ""} on` : "No rules on"}</b>`, sub: rules.join(", ") || "Helpers and picks" })}
        ${card({ act: "pick-sprites", label: "Sprites", body: `${spriteIcon}<b>${spriteMode.label}</b>`, sub: spriteMode.hint })}
      </div>
      <div class="row-buttons">
        <button class="btn" data-act="back">◀ Back</button>
        <button class="btn primary start-btn" data-act="go"><img class="btn-ball" src="images/ui/ball.png" alt=""> Start the draft</button>
      </div>`;
    this.hub.ondragstart = this.hub.ondragover = this.hub.ondragend = this.hub.ondrop = null;
    this.hub.onclick = async (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      const m = loadMeta();
      m.setup ??= { gen: 1, pools: [1, 2, 3, 4, 5] };
      if (act === "back") this.start();
      if (act === "badge-editor") { await this.badgeCaseDialog(); this.renderSetup(); }
      if (act === "pick-character") {
        const id = await this.characterDialog(m);
        if (id) { m.character = id; saveMeta(m); this.renderSetup(); }
      }
      if (act === "pick-gen") {
        const g = await this.challengeDialog(m);
        if (g) {
          const evil = typeof g === "string" && !["m", "g"].includes(g); // "e3" = the evil team path of Gen 3; "m" = Mixed Gens; "g" = the Gauntlet
          const prev = { gen: m.setup.gen, path: m.setup.path };
          if (g === "m") m.setup.path = "mixed";
          else if (g === "g") m.setup.path = "gauntlet";
          else { m.setup.gen = evil ? Number(g.slice(1)) : g; m.setup.path = evil ? "evil" : "normal"; }
          const ok = await this.runTypeDialog(m); // which kind of run
          if (!ok) Object.assign(m.setup, prev); // backed out: keep the old challenge
          saveMeta(m);
        }
        this.renderSetup();
      }
      if (act === "pick-pool") { await this.poolDialog(m); this.renderSetup(); }
      if (act === "pick-rules") { await this.rulesDialog(m); this.renderSetup(); }
      if (act === "pick-sprites") {
        const id = await this.spritesDialog(m);
        if (id) { m.sprites = id; saveMeta(m); applySpriteMode(this.ctx.data, id); this.renderSetup(); }
      }
      if (act === "go") {
        this.run = Run.newRun(this.ctx, { gen: ["mixed", "gauntlet"].includes(this.runChoices(m).path) ? 1 + Math.floor(Math.random() * 5) : m.setup.gen, pools: m.setup.pools, perks: perksFromMeta(m, this.ctx.rules), character: m.character, dupes: m.setup.dupes !== false, ...this.runChoices(m), badges: caseOf(m), badgeLinks: m.badgeLinks, badgeOff: m.badgeOff ?? [] });
        saveMeta(m);
        this.render();
      }
    };
  }

  // The four settings windows share one layout: a short line, a grid of option tiles (the chosen one is highlighted), a footer button.

  // What picking a trainer gives you (only perks the game applies; planned ones don't show)
  perkText(id) {
    const rule = (this.ctx.rules.characterUnlocks ?? {})[id];
    return rule?.effect && rule.effect !== "—" ? rule.perk : "No perk yet";
  }

  // The trainer picker: unlocked trainers by generation, and a hint about the next one
  // How far you are with a locked trainer: coloured text such as "2 of 5" (none for a yes or no condition)
  unlockBar(meta, rule) {
    const { share, text } = ruleProgressText(meta, rule);
    return text ? `<small class="progress-text ${progressClass(share)}">${text}</small>` : "";
  }

  // "Obtain: a, b, c" / "Final team: a, b, c" unlocks (Cynthia): the Pokémon you need, the ones you had in your best run lit up
  requiredTeam(rule, meta) {
    const c = rule?.alts.flat().find((x) => x.kind === "obtain" || x.kind === "finalTeam");
    if (!c) return "";
    const have = new Set((c.kind === "finalTeam" ? meta.finalTeamBest : meta.obtainBest)?.[c.arg.join(",")] ?? []); // from your best run so far
    const got = have.size;
    return `<span class="req-team">${c.arg.map((k) => { const p = this.ctx.data.pokemonByKey[k]; return p ? `<img class="${have.has(k) ? "got" : ""}" src="${p.sprites.front}" alt="${p.name}" title="${p.name}${have.has(k) ? " (obtained)" : ""}">` : ""; }).join("")}</span>`;
  }

  async characterDialog(meta) {
    const unlocks = this.ctx.rules.characterUnlocks ?? {};
    const reveal = this.revealAll();
    const locked = (c) => !isUnlocked(meta, unlocks[c.id]);
    const secret = (c) => locked(c) && HIDDEN_TRAINERS.has(c.id) && !reveal;
    const secretCount = CHARACTERS.filter(secret).length;
    const group = (g) => CHARACTERS.filter((c) => c.gen === g);
    const how = (c) => (unlocks[c.id] && !unlocks[c.id].start ? `<small class="how-unlocked">Unlocked: ${unlockText(unlocks[c.id])}</small>` : "");
    const tile = (c) => secret(c)
      ? `<div class="opt-tile locked secret" title="A secret trainer"><img src="${c.front}" alt=""><b>🔒 ???</b><small>A secret trainer. Keep playing to find out.</small></div>`
      : locked(c)
        ? `<div class="opt-tile locked" title="Locked: ${unlockText(unlocks[c.id])}"><img src="${c.front}" alt=""><b>🔒 ${c.name}</b><small>${unlockText(unlocks[c.id])}</small>${this.requiredTeam(unlocks[c.id], meta)}${this.unlockBar(meta, unlocks[c.id])}</div>`
        : `<button class="opt-tile ${c.id === meta.character ? "selected" : ""}" data-result='${JSON.stringify(c.id)}'><img src="${c.front}" alt=""><b>${c.name}</b><small class="perk-text">${this.perkText(c.id)}</small>${how(c)}</button>`;
    let showLocked = true;
    try { showLocked = localStorage.getItem("pd.showLocked") !== "0"; } catch { /* ignore */ }
    const body = `<div class="note-row"><p class="opt-note">Your trainer is just for looks. Locked trainers show how to unlock them${secretCount ? `; ${secretCount} secret one${secretCount === 1 ? "" : "s"} stay${secretCount === 1 ? "s" : ""} hidden` : ""}.</p>
      <label class="switch-row">Show locked<span class="switch"><input type="checkbox" data-locked-toggle ${showLocked ? "checked" : ""}><span class="track-dot"></span></span></label></div>
      <div data-trainer-list class="${showLocked ? "" : "hide-locked"}">
      ${[1, 2, 3, 4, 5].filter((g) => group(g).length).map((g) => `<section class="opt-section"><h3>${GEN_LABELS[g]}</h3>
        <div class="opt-grid trainer-grid">${group(g).map(tile).join("")}</div></section>`).join("")}</div>`;
    return this.modal({
      title: "Trainer", variant: "settings", body, options: [], cancel: "Close",
      onOpen: (dialog) => {
        const apply = (on) => {
          dialog.querySelector("[data-trainer-list]").classList.toggle("hide-locked", !on);
          dialog.querySelectorAll(".opt-section").forEach((sec) => { sec.hidden = !on && !sec.querySelector(".opt-tile:not(.locked)"); });
        };
        apply(showLocked);
        dialog.addEventListener("change", (e) => {
          if (!e.target.matches("[data-locked-toggle]")) return;
          try { localStorage.setItem("pd.showLocked", e.target.checked ? "1" : "0"); } catch { /* ignore */ }
          apply(e.target.checked);
        });
      },
    });
  }

  // The Challenge Gen picker: one tile per generation with a progress bar
  async challengeDialog(meta) {
    const reveal = this.revealAll();
    const tile = (g) => {
      const beaten = Math.min(14, Math.max(0, (meta.reach?.[g] ?? 1) - 1));
      const cleared = meta.winGens?.[g] ?? 0;
      const done = cleared ? 14 : beaten;
      const text = cleared ? `Cleared ${cleared > 1 ? `×${cleared}` : "✓"}` : beaten ? `${beaten} of 14 beaten` : "Not played yet";
      return `<button class="opt-tile gen-tile ${g === meta.setup.gen && meta.setup.path !== "evil" ? "selected" : ""}" data-result="${g}">
        <img src="${this.ctx.data.pokemonByKey[ICONIC[g]].sprites.front}" alt=""><b class="gen-no">Gen ${g}</b><span>${this.ctx.leaders[g].region}</span>
        <i class="gen-bar"><i style="width:${(done / 14) * 100}%"></i></i><small>${text}</small></button>`;
    };
    // The evil team paths open when you have won the normal path of the same generation (the debug panel shows them anyway)
    const evilTile = (g) => {
      const file = this.ctx.evil?.[g];
      if (!file) return "";
      const open = this.evilOpen(meta, g);
      const gp = this.genProgress(meta, `e${g}`);
      const done = String(gp.text).startsWith("Cleared") ? 14 : Math.min(14, Math.max(0, (meta.reach?.[`e${g}`] ?? 1) - 1));
      const icon = `<img class="evil-sprite" src="images/trainers/${EVIL_ICON[g]}.png" alt="">`;
      if (!open) return `<div class="opt-tile gen-tile evil locked"><span class="evil-icon">${icon}</span><b class="gen-no">🔒 Gen ${g}</b><span>${file.region}</span><small>Win Gen ${g} first</small></div>`;
      return `<button class="opt-tile gen-tile evil ${g === meta.setup.gen && meta.setup.path === "evil" ? "selected" : ""} ${meta.winGens?.[g] > 0 ? "" : "dev-shown"}" data-result='"e${g}"'>
        <span class="evil-icon">${icon}</span><b class="gen-no">Gen ${g}</b><span>${file.region}</span>
        <i class="gen-bar"><i style="width:${(done / 14) * 100}%"></i></i><small>${gp.text}</small></button>`;
    };
    // Final paths: Mixed Gens opens once every generation is won. The Gauntlet (all five back to back) is still to be designed.
    const mixedOpen = this.mixedOpen(meta);
    const mp = this.genProgress(meta, "m");
    const gp2 = this.genProgress(meta, "g");
    const finalTile = (id, icon, title, sub, progress, selected, open, lockText) => open
      ? `<button class="opt-tile gen-tile final ${selected ? "selected" : ""} ${[1, 2, 3, 4, 5].every((g) => meta.winGens?.[g] > 0) ? "" : "dev-shown"}" data-result='"${id}"'>
          <span class="evil-icon rainbow">${icon}</span><b class="gen-no">${title}</b><span>${sub}</span>${progress.pips}<small>${progress.text}</small></button>`
      : `<div class="opt-tile gen-tile final locked"><span class="evil-icon rainbow">${icon}</span><b class="gen-no">🔒 ${title}</b><span>${sub}</span><small>${lockText}</small></div>`;
    const finalTiles = finalTile("m", "🌈", "Mixed Gens", "Every region", mp, meta.setup.path === "mixed", mixedOpen, "Win all 5 generations")
      + finalTile("g", "⚔️", "Gauntlet", "All 5 back to back · 30 battles", gp2, meta.setup.path === "gauntlet", mixedOpen, "Win all 5 generations")
      + `<div class="opt-tile gen-tile final locked"><span class="evil-icon rainbow">🏔️</span><b class="gen-no">Marathon</b><span>All 5, 70 battles</span><small>Coming soon</small></div>`;
    return this.modal({
      title: "Challenge",
      variant: "settings",
      body: `<p class="opt-note">Which gyms, Elite Four and Champion you fight. You choose the kind of run next.</p>
        <div class="opt-grid">${[1, 2, 3, 4, 5].map(tile).join("")}</div>
        ${Object.keys(this.ctx.evil ?? {}).length ? `<h4 class="ch-section">Evil team paths</h4>
        <p class="opt-note">Fight the evil team of each generation instead, grunts to boss. Each opens when you win the normal path of the same generation.</p>
        <div class="opt-grid">${[1, 2, 3, 4, 5].map(evilTile).join("")}</div>` : ""}
        <h4 class="ch-section">Final paths</h4>
        <p class="opt-note">They open when you have won all five generations.</p>
        <div class="opt-grid final-grid">${finalTiles}</div>`,
      options: [],
      cancel: "Close",
    });
  }

  // An evil team path is open once you have won the normal path of that generation (the debug panel opens them all)
  // A Skill Tree pick must be a Pokémon (or its evolution line) you have recruited before
  pickable(meta, key) {
    if (this.revealAll()) return true;
    const line = this.ctx.dex.lineOf[key];
    return (meta.species ?? []).some((k) => this.ctx.dex.lineOf[k] === line);
  }

  // The run rules you can use now. The debug panel's "Show locked and hidden choices" opens every one of them.
  ownedRules(meta) {
    const set = unlockedRules(loadMeta(), this.ctx.rules, ruleGen(meta));
    if (this.revealAll()) {
      for (const id of [...Object.keys(this.ctx.rules.ruleUnlocks ?? {}), "mode-mono"]) set.add(id);
      for (const n of this.ctx.rules.upgrades) for (const d of n.does.split(";")) if (d.trim().startsWith("unlock:")) set.add(d.trim().slice(7));
    }
    return set;
  }

  // Mixed Gens (a final path) opens when every generation has been won on its normal path
  mixedOpen(meta) { return [1, 2, 3, 4, 5].every((g) => (meta.winGens?.[g] ?? 0) > 0) || this.revealAll(); }
  evilOpen(meta, g) { return (meta.winGens?.[g] ?? 0) > 0 || this.revealAll(); }

  // Which generations your recruits can come from: tap a tile to include or leave out (changes apply at once)
  async poolDialog(meta) {
    const picks = this.starterPicks ?? STARTER_TRIOS.map((t) => t[0]);
    const tile = (g) => `<button class="opt-tile ${meta.setup.pools.includes(g) ? "selected" : "off"}" data-gen="${g}">
      <img src="${this.ctx.data.pokemonByKey[picks[g - 1]].sprites.front}" alt=""><b>Gen ${g}</b><small>${this.ctx.leaders[g].region}</small></button>`;
    await this.modal({
      title: "Pokémon Pool",
      variant: "settings",
      body: `<div class="note-row"><p class="opt-note">Tap to include a generation. Recruits come from the highlighted ones.</p></div>
        <div class="opt-grid" data-pool>${[1, 2, 3, 4, 5].map(tile).join("")}</div>`,
      options: [],
      cancel: "Done",
      onOpen: (dialog) => {
        dialog.addEventListener("click", (e) => {
          const t = e.target.closest("[data-gen]");
          if (!t) return;
          const g = Number(t.dataset.gen);
          const on = new Set(meta.setup.pools);
          if (on.has(g)) { if (on.size > 1) on.delete(g); } else on.add(g); // at least one
          meta.setup.pools = [...on].sort();
          const m = loadMeta();
          m.setup ??= { gen: meta.setup.gen, pools: [] };
          m.setup.pools = meta.setup.pools;
          saveMeta(m);
          dialog.querySelector("[data-pool]").innerHTML = [1, 2, 3, 4, 5].map(tile).join("");
        });
      },
    });
  }

  // The run modes and Skills picks that are switched on, and that you own (a locked one in an old setup is ignored)
  runChoices(meta) {
    const owned = this.ownedRules(meta);
    const set = meta.setup ?? {};
    const modes = {};
    for (const k of ["moves", "levels", "rainbow", "hard", "noitems"]) if (owned.has(`mode-${k}`) && set.modes?.[k]) modes[k] = true;
    if (owned.has("mode-opponents") && ["mixed", "wild"].includes(set.opponents)) modes.opponents = set.opponents;
    const fixedSix = owned.has("mode-fixed") && set.fixedSix === true;
    const monoType = owned.has("mode-mono") && TYPE_CHOICES.includes(set.monoType) ? set.monoType : "";
    if (monoType) modes.mono = true;
    const picks = {};
    for (const [slot, node] of [["starter", "starter-pick"], ["encounter", "encounter-pick"], ["legend", "legend-pick"], ["mythic", "mythic-pick"]]) {
      const key = set.picks?.[slot];
      if (owned.has(node) && key && this.ctx.data.pokemonByKey[key] && this.pickable(meta, key)) picks[slot] = key;
    }
    const item = set.picks?.item;
    if (owned.has("pick-item") && item && ITEMS[item]?.kind === "held") picks.item = item;
    const path = (set.path === "mixed" || set.path === "gauntlet") && this.mixedOpen(meta) ? set.path : set.path === "evil" && this.ctx.evil?.[set.gen] && this.evilOpen(meta, set.gen) ? "evil" : "normal";
    if (path !== "normal") { delete modes.opponents; if (path === "evil") delete modes.rainbow; } // (the evil paths have their own gym order; Mixed Gens plans its own, Rainbow makes the type order random)
    const favType = (perksFromMeta(meta, this.ctx.rules).typeMagnet ?? 0) > 0 && TYPE_CHOICES.includes(set.favType) ? set.favType : "";
    return { modes, picks, monoType, path, favType, fixedSix };
  }

  // The challenge rows you can see: later tiers show as one "???" line each until you have beaten enough challenges
  challengeRows(list, mine, row) {
    const reveal = this.revealAll(); // debug panel: show the secret ones too
    const out = [];
    const group = (title, inGroup, note = "") => {
      const done = inGroup.filter((c) => mine.has(c.id)).length;
      out.push(`<li class="ch-tier-head"><b>${title}</b><small>${done} of ${inGroup.length} beaten${note}</small></li>`);
    };
    for (const tier of [...new Set(list.filter((c) => !c.secret).map((c) => c.tier))].sort()) {
      const inTier = list.filter((c) => !c.secret && c.tier === tier);
      group(`Tier ${tier}`, inTier);
      out.push(...inTier.map(row));
    }
    // Secret challenges: listed once you have beaten most of the others (one you beat by accident is listed anyway)
    const secret = list.filter((c) => c.secret);
    if (secret.length) {
      const beaten = list.filter((c) => !c.secret && mine.has(c.id)).length;
      const open = secretRevealed(beaten);
      const hidden = secret.filter((c) => !mine.has(c.id));
      group("Secret", secret, open ? "" : ` · beat ${secretAt() - beaten} more challenges to see the rest`);
      out.push(...secret.filter((c) => open || mine.has(c.id)).map(row));
      if (!open && hidden.length) {
        if (reveal) out.push(...hidden.map((c) => row(c).replace('<li class="challenge-row', '<li class="challenge-row dev-shown')));
        else out.push(`<li class="challenge-row hidden-tier"><span class="ch-check">?</span><span class="who"><span class="ch-title"><strong>${hidden.length} secret challenge${hidden.length > 1 ? "s" : ""}</strong></span><small>Beat ${secretAt() - beaten} more challenges to reveal ${hidden.length > 1 ? "them" : "it"}.</small></span></li>`);
      }
    }
    return out.join("");
  }

  // Run rules: switches and choices for the next run (the Rules tile of the New run screen)
  // Rule cards (used by the Challenge window for challenge runs and the Rules window for helpers). A rule stays locked (greyed, with where to unlock it) until opened.
  ruleKit(meta) {
    const owned = this.ownedRules(meta);
    const nodeOf = (unlock) => this.ctx.rules.upgrades.find((n) => n.does.split(";").some((d) => d.trim() === `unlock:${unlock}`));
    const card = ({ title, text, control, unlock = null }) => {
      const locked = unlock && !owned.has(unlock);
      const node = locked ? nodeOf(unlock) : null;
      const wins = this.ctx.rules.ruleUnlocks?.[unlock]; // a rule that opens by winning runs
      const regionName = this.ctx.leaders[meta.setup.gen]?.region ?? `Gen ${meta.setup.gen}`;
      const lockLine = wins !== undefined ? `Win <em>${regionName}</em> <em>${wins} time${wins > 1 ? "s" : ""}</em> to unlock (${winsInGen(meta, ruleGen(meta))} so far)`
        : `Unlock <em>${node?.name ?? unlock}</em> in the Skill Tree${node ? ` (${node.arm})` : ""}`;
      return `<div class="rule-card ${locked ? "locked" : ""}"><b>${locked ? "🔒 " : ""}${title}</b><small>${text}</small>
        ${locked ? `<span class="rule-lock">${lockLine}</span>` : control}</div>`;
    };
    const toggle = (attr, key, on) => `<label class="rule-switch"><span class="switch"><input type="checkbox" ${attr}="${key}" ${on ? "checked" : ""}><span class="track-dot"></span></span><em>${on ? "On" : "Off"}</em></label>`;
    const select = (attr, key, current, options) => `<select class="rule-select" ${attr}="${key}">${options.map(([v, label]) => `<option value="${v}" ${current === v ? "selected" : ""}>${label}</option>`).join("")}</select>`;
    return { card, toggle, select };
  }

  // One change handler for every rule control (switches and selects write straight into meta.setup)
  onRuleChange(dialog, meta) {
    dialog.addEventListener("change", (e) => {
      const t = e.target;
      const m = loadMeta();
      m.setup ??= { gen: meta.setup.gen, pools: [...meta.setup.pools] };
      if (t.dataset?.rule) { m.setup[t.dataset.rule] = t.checked; meta.setup[t.dataset.rule] = t.checked; }
      else if (t.dataset?.mode) { (m.setup.modes ??= {})[t.dataset.mode] = t.checked; meta.setup.modes = m.setup.modes; }
      else if (t.dataset?.pick) { (m.setup.picks ??= {})[t.dataset.pick] = t.value; meta.setup.picks = m.setup.picks; }
      else if (t.dataset?.opp) { m.setup.opponents = t.value; meta.setup.opponents = t.value; }
      else if (t.dataset?.mono) { m.setup.monoType = t.value; meta.setup.monoType = t.value; }
      else if (t.dataset?.fav) { m.setup.favType = t.value; meta.setup.favType = t.value; }
      else return;
      saveMeta(m);
      const label = t.closest(".rule-switch")?.querySelector("em");
      if (label) label.textContent = t.checked ? "On" : "Off";
    });
  }

  // After a generation is picked: which kind of run (Bloons style). Tiles switch on and off, so runs can be combined; "Standard" clears them all.
  async runTypeDialog(meta) {
    const region = meta.setup.path === "mixed" ? "Mixed Gens" : meta.setup.path === "gauntlet" ? "The Gauntlet" : this.ctx.leaders[meta.setup.gen]?.region ?? `Gen ${meta.setup.gen}`;
    const owned = this.ownedRules(meta);
    const real = unlockedRules(loadMeta(), this.ctx.rules, ruleGen(meta));
    const TYPES = TYPE_CHOICES.map((t) => [t, cap(t)]);
    const sel = (attr, cur, opts) => `<select class="rule-select" ${attr} onclick="event.stopPropagation()">${opts.map(([v, l]) => `<option value="${v}" ${cur === v ? "selected" : ""}>${l}</option>`).join("")}</select>`;
    const st = () => meta.setup;
    const evil = ["evil", "mixed", "gauntlet"].includes(meta.setup.path); // (their own gym order)
    const mixed = ["mixed", "gauntlet"].includes(meta.setup.path); // (the final paths: unlocks count your best generation)
    const gauntletPath = meta.setup.path === "gauntlet";
    // Easiest first; each opens by winning this generation more often (see the rule unlock table in DESIGN.md)
    const defs = [
      { id: "hard", unlock: "mode-hard", name: "Hard mode", text: "Foes are 2 levels higher, bring one more Pokémon from battle 3, and have perfect IVs, a good Nature and a held item.", on: () => st().modes?.hard === true },
      { id: "levels", unlock: "mode-levels", name: "Random levels", text: "Recruits arrive up to 5 levels above or below.", on: () => st().modes?.levels === true },
      { id: "moves", unlock: "mode-moves", name: "Random moves", text: "Recruits come with random moves.", on: () => st().modes?.moves === true },
      { id: "rainbow", unlock: "mode-rainbow", name: "Rainbow", text: gauntletPath ? "The five regions come in a random order instead of Kanto to Unova." : mixed ? "The gym types come in a random order instead of the usual one." : "The gyms of this generation come in a random order, so any type can be next.", on: () => st().modes?.rainbow === true, evilOff: !mixed },
      { id: "noitems", unlock: "mode-noitems", name: "No items", text: "No bag, no item screens, and the shop sells only TMs.", on: () => st().modes?.noitems === true },
      { id: "opponents", unlock: "mode-opponents", name: "Random gyms", text: "Battles 1 to 8 (the gyms) are fought against leaders from any generation instead of one region. Pick how they are chosen below.", on: () => !!st().opponents, evilOff: true,
        extra: () => sel('data-opp="1"', st().opponents || "mixed", [["mixed", "One of each type"], ["wild", "Any leaders (types can repeat)"]]) },
      { id: "mono", unlock: "mode-mono", name: "Mono type", text: "Every card you are offered is this type, so the whole team ends up one type. A Pokémon that will evolve into the type can join too, but waits on the bench until it does.", on: () => !!st().monoType,
        extra: () => sel('data-mono="1"', st().monoType || "normal", TYPES) },
      { id: "fixedSix", unlock: "mode-fixed", name: "Fixed Six", text: "Pick six Pokémon at the start and never recruit another.", on: () => st().fixedSix === true },
      { id: "twelve", name: "12 mon run", text: "Battles 13 and 14 become 12 against 12, two trainers at once.", soon: true, on: () => false },
    ];
    const tile = (d) => {
      if (d.soon) return `<div class="opt-tile run-tile locked"><b>${d.name}</b><small>${d.text}</small><small><em>Coming soon</em></small></div>`;
      if (d.evilOff && evil) return `<div class="opt-tile run-tile locked"><b>${d.name}</b><small>${mixed ? "The final paths pick their own leaders." : "Evil teams have their own gym order."}</small></div>`;
      const locked = d.unlock && !owned.has(d.unlock);
      if (locked) {
        if (d.unlock === "mode-mono") {
          const trials = monoTrials(meta), done = monoTrialsDone(meta);
          return `<div class="opt-tile run-tile locked wide-lock"><b>🔒 ${d.name}</b><small>Do any ${MONO_TRIALS_NEEDED} of these:</small>${trials.map((t) => `<small class="trial ${t.done ? "done" : ""}">${t.done ? "✔" : "○"} ${t.label}</small>`).join("")}<small class="progress-text ${progressClass(done / MONO_TRIALS_NEEDED)}">${Math.min(done, MONO_TRIALS_NEEDED)} of ${MONO_TRIALS_NEEDED}</small></div>`;
        }
        const w = this.ctx.rules.ruleUnlocks?.[d.unlock] ?? 1;
        return `<div class="opt-tile run-tile locked"><b>🔒 ${d.name}</b><small>Win ${mixed ? "any generation" : region} ${w} time${w > 1 ? "s" : ""}</small>${w > 1 ? `<small class="progress-text ${progressClass(winsInGen(meta, ruleGen(meta)) / w)}">${Math.min(winsInGen(meta, ruleGen(meta)), w)} of ${w}</small>` : ""}</div>`;
      }
      const dev = d.unlock && !real.has(d.unlock) ? "dev-shown" : ""; // (opened by the debug panel only)
      return `<button class="opt-tile run-tile ${d.on() ? "selected" : ""} ${dev}" data-run="${d.id}"><b>${d.name}</b><small>${d.text}</small>${d.extra ? d.extra() : ""}</button>`;
    };
    const anyOn = () => defs.some((d) => (!d.unlock || owned.has(d.unlock)) && !(d.evilOff && evil) && d.on());
    const body = () => `<p class="opt-note">${region}: how do you want to play it? Pick as many as you like.</p>
      <div class="opt-grid run-grid"><button class="opt-tile run-tile ${anyOn() ? "" : "selected"}" data-run="standard"><b>Standard</b><small>The normal run, no extra rules.</small></button>${defs.map(tile).join("")}</div>`;
    const write = (fn) => { const m = loadMeta(); m.setup ??= { gen: meta.setup.gen, pools: [...meta.setup.pools] }; fn(m.setup); saveMeta(m); fn(meta.setup); };
    return this.modal({
      title: "Choose your run",
      variant: "settings",
      body: body(),
      options: [{ label: "Select", value: true }],
      cancel: "Back",
      onOpen: (dialog) => {
        const refresh = () => { dialog.querySelector(".modal-body > div").innerHTML = body(); };
        dialog.addEventListener("click", (e) => {
          const t = e.target.closest("[data-run]");
          if (!t || e.target.closest("select")) return;
          const id = t.dataset.run;
          if (id === "standard") write((x) => { x.fixedSix = false; x.modes = {}; x.opponents = ""; x.monoType = ""; });
          else if (id === "fixedSix") write((x) => { x.fixedSix = !x.fixedSix; });
          else if (id === "opponents") write((x) => { x.opponents = x.opponents ? "" : "mixed"; });
          else if (id === "mono") write((x) => { x.monoType = x.monoType ? "" : "normal"; });
          else write((x) => { x.modes = { ...(x.modes ?? {}), [id]: !x.modes?.[id] }; });
          refresh();
        });
        dialog.addEventListener("change", (e) => {
          const t = e.target;
          if (t.dataset?.opp) write((x) => { x.opponents = t.value; });
          else if (t.dataset?.mono) write((x) => { x.monoType = t.value; });
        });
      },
    });
  }

  async rulesDialog(meta) {
    const owned = this.ownedRules(meta);
    const { data } = this.ctx;
    const modes = meta.setup.modes ?? {};
    const picks = meta.setup.picks ?? {};
    const magnetN = Math.min(3, perksFromMeta(loadMeta(), this.ctx.rules).typeMagnet ?? 0);
    const { card, toggle, select } = this.ruleKit(meta);
    const options = (list, chosen) => [["", "Random"], ...list.map((p) => [p.key, `${p.name} (Gen ${p.gen})`])].map(([v, label]) => [v, label]);
    // Picks only offer Pokémon you have recruited before (in any run); the debug panel shows them all
    const known = (p) => this.pickable(meta, p.key);
    const lists = {
      starter: Object.values(STARTER_LINES).flat().map((k) => data.pokemonByKey[k]).filter(Boolean).filter(known),
      encounter: data.pokemon.filter((p) => !p.evolvesFrom && !p.isLegendary && !p.isMythical).filter(known),
      legend: data.pokemon.filter((p) => p.isLegendary && !p.isMythical).filter(known),
      mythic: data.pokemon.filter((p) => p.isMythical).filter(known),
    };
    const pick = (slot, unlock, title, text) => card({ title, text, unlock, control: select("data-pick", slot, picks[slot] ?? "", options(lists[slot])) });
    const heldItems = Object.entries(ITEMS).filter(([, it]) => it.kind === "held" && ["common", "uncommon"].includes(it.tier)).map(([id, it]) => [id, it.name]).sort((a, b) => a[1].localeCompare(b[1]));
    const helpers = [
      card({ title: "Dupes clause", text: "A Pokémon line you had before, even a fallen one, won't be offered as a recruit again.", control: toggle("data-rule", "dupes", meta.setup.dupes !== false) }),
      card({ title: "Type Magnet", text: `${magnetN ? `At least ${magnetN} of the cards on every recruit screen are this type` : "Some of the cards on every recruit screen are this type"}, when one can be offered. The other cards stay random.`, unlock: "type-magnet",
        control: select("data-fav", "favType", meta.setup.favType ?? "", [["", "Off"], ...TYPE_CHOICES.map((t) => [t, cap(t)])]) }),
      pick("starter", "starter-pick", "Starter pick", "This starter line is always in your draft. Only Pokémon you have recruited before."),
      pick("encounter", "encounter-pick", "Encounter pick", "Always on your first recruit screen. Only Pokémon you have recruited before."),
      pick("legend", "legend-pick", "Legendary pick", "On the recruit screen after battle 7. Only Pokémon you have recruited before."),
      pick("mythic", "mythic-pick", "Mythical pick", "On the recruit screen after battle 11. Only Pokémon you have recruited before."),
      card({ title: "Starting item", text: "A held item you begin every run with.", unlock: "pick-item", control: select("data-pick", "item", picks.item ?? "", [["", "None"], ...heldItems]) }),
    ].join("");
    await this.modal({
      title: "Rules",
      variant: "settings rules-modal",
      body: `<div class="note-row"><p class="opt-note">Rules help you steer the next run. Most come from the Skill Tree. The harder challenge runs (Fixed Six, Hard mode and more) come up after you pick a generation in the Challenge window.</p></div>
        <div class="rule-grid">${helpers}</div>`,
      options: [],
      cancel: "Done",
      onOpen: (dialog) => {
        this.onRuleChange(dialog, meta);
      },
    });
  }

  // The challenge checklist, grouped by tier (Challenges in the main menu)
  renderChallenges() {
    this.trackView("challenges");
    this.showHub();
    const mine = new Set(loadMeta().challenges ?? []);
    const tag = (c) => (c.toggle || c.rule ? `<em class="ch-tag rule">Needs a rule</em>` : `<em class="ch-tag">Any run</em>`);
    const left = secretAt() - CHALLENGES.filter((c) => !c.secret && mine.has(c.id)).length;
    const secretHidden = CHALLENGES.filter((c) => c.secret && !mine.has(c.id)).length;
    this.hub.className = "hub framed";
    this.hub.innerHTML = `
      <div class="offer-head"><div><h1>Challenges</h1>
        <p>A challenge is beaten by winning a run. Most count in any run; the ones marked "Needs a rule" need that rule switched on in Rules on the New run screen first. ${left > 0 && secretHidden ? `${secretHidden} secret challenges are hidden at the end: beat ${left} more to see them.` : "The secret challenges are open."}</p></div>
        <button class="btn" data-act="title">◀ Title</button></div>
      <h4 class="ch-section">Challenges <small>${CHALLENGES.filter((c) => mine.has(c.id)).length} of ${CHALLENGES.length} beaten</small></h4>
      <ol class="board-list ch-list">${this.challengeRows(CHALLENGES, mine, (c) => `<li class="challenge-row ${mine.has(c.id) ? "done" : ""}"><span class="ch-check">${mine.has(c.id) ? "✓" : ""}</span>
        <span class="who"><span class="ch-title"><strong>${c.name}</strong>${tag(c)}</span><small>${c.text}${c.hint ? ` <em class="ch-hint">${c.hint}</em>` : ""}</small></span></li>`)}</ol>
      <h4 class="ch-section">Coming soon</h4>
      <ol class="board-list ch-list">${PLANNED.map((c) => `<li class="challenge-row planned"><span class="ch-check"></span><span class="who"><span class="ch-title"><strong>${c.name}</strong></span><small>${c.text}</small></span></li>`).join("")}</ol>`;
    this.hub.onclick = (e) => { if (e.target.closest("[data-act]")?.dataset.act === "title") this.start(); };
  }

  // The sprite style: the same battle scene in each style, so you see the difference
  async spritesDialog(meta) {
    const { data } = this.ctx;
    const pick = (key, mode) => {
      const p = data.pokemonByKey[key];
      const dir = mode === "gen5-ani" ? "gen5-ani" : mode === "gen4" && p.id <= 493 ? "gen4" : "gen5";
      const ext = mode === "gen5-ani" ? "gif" : "png";
      const sprites = Object.fromEntries(Object.entries({ front: "front", back: "back", frontShiny: "front-shiny", backShiny: "back-shiny" }).map(([k, f]) => [k, `images/sprites/${dir}/${f}/${p.id}.${ext}`]));
      return { ...p, sprites };
    };
    const scene = (mode) => `<div class="banner-frame"><div class="banner-slide on">${sceneHtml([], data, { terrain: "normal", mons: ["charizard", "blastoise", "garchomp", "gengar"].map((k) => pick(k, mode)) })}</div></div>`;
    const tiles = SPRITE_MODES.map((m) => `<button class="opt-tile sprite-tile ${m.id === meta.sprites ? "selected" : ""}" data-result='${JSON.stringify(m.id)}'>${scene(m.id)}<b>${m.label}</b><small>${m.hint}</small></button>`).join("");
    return this.modal({
      title: "Pokémon sprites",
      variant: "settings",
      body: `<p class="opt-note">Same battle, three styles: foes show their front sprites, your side shows back sprites.</p>
        <div class="opt-grid sprite-grid">${tiles}</div>`,
      options: [],
      cancel: "Close",
      onOpen: (dialog) => alignScene(dialog, data),
    });
  }

  // The badge case in a settings window (drag badges in and out, tap one for details), like the other settings
  async badgeCaseDialog() {
    const meta = loadMeta();
    if (!validZones(meta.badgeLinks)) { meta.badgeLinks = randomZones(); saveMeta(meta); }
    await this.modal({
      title: "",
      head: `<div class="window-head"><h2>Badge case</h2><button class="btn small" data-act="case-help">? How it works</button></div>`,
      variant: "settings case-window",
      body: `<div data-case-body>${this.badgeCasePanel(meta)}</div>`,
      options: [],
      cancel: "Done",
      onOpen: (dialog) => {
        const root = dialog.parentElement; // the whole window, so drags and the windows on top of it work
        const redrawCase = () => { dialog.querySelector("[data-case-body]").innerHTML = this.badgeCasePanel(loadMeta()); };
    root.addEventListener("click", async (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "case-help") { await this.caseHelp(); return; }
      if (act === "card-color") {
        const m = loadMeta();
        m.cardColor = e.target.closest("[data-color]").dataset.color;
        saveMeta(m);
        redrawCase();
        return;
      }
      if (act === "perks") { await this.perksDialog(); redrawCase(); return; }
      if (act === "shelf-tab") {
        this.shelfGen = Number(e.target.closest("[data-gen]").dataset.gen);
        redrawCase();
        return;
      }
      // Tap a badge (in the case or in the collection): its details, and what you can do with it
      if (act === "badge-open") {
        // flip through the badges of the generation you are looking at
        const badge = e.target.closest("[data-badge]").dataset.badge;
        await this.badgeDialog(badge, Array.from({ length: 8 }, (_, i) => badgeId(parseBadgeId(badge).gen, i + 1)));
        redrawCase();
        return;
      }
      // Tap an empty slot: pick which badge goes there
      if (act === "case-slot") {
        const i = Number(e.target.closest("[data-slot]").dataset.slot);
        const id = caseOf(loadMeta())[i];
        if (id) await this.badgeDialog(id, caseOf(loadMeta()).filter(Boolean)); else await this.slotDialog(i);
        redrawCase();
        return;
      }
      if (act === "case-remove") {
        const m = loadMeta();
        removeBadge(m, Number(e.target.closest("[data-slot]").dataset.slot));
        saveMeta(m);
        redrawCase();
        return;
      }
      if (act === "case-clear") {
        const m = loadMeta();
        m.badgeCase = Array(CASE_SIZE).fill(null);
        saveMeta(m);
        redrawCase();
        return;
      }
      if (act === "case-auto") {
        // Strongest badges first (a higher gym number is stronger), into the slots with the biggest zone boost first
        const m = loadMeta();
        const zones = m.badgeLinks ?? [];
        const boostOf = (i) => zones.find((x) => x.slots?.includes(i))?.boost ?? 0;
        const order = Array.from({ length: CASE_SIZE }, (_, i) => i).filter((i) => slotUnlocked(m, i)).sort((a, b) => boostOf(b) - boostOf(a) || a - b);
        const byGen = {};
        for (const id of ownedBadges(m)) byGen[parseBadgeId(id).gen] = (byGen[parseBadgeId(id).gen] ?? 0) + 1;
        const best = [...ownedBadges(m)].sort((x, y) => parseBadgeId(y).order - parseBadgeId(x).order || byGen[parseBadgeId(y).gen] - byGen[parseBadgeId(x).gen] || parseBadgeId(x).gen - parseBadgeId(y).gen)
          .slice(0, order.length);
        const slots = Array(CASE_SIZE).fill(null);
        best.forEach((id, k) => { slots[order[k]] = id; });
        m.badgeCase = slots;
        saveMeta(m);
        redrawCase();
        return;
      }
    });
    // Drag a badge onto a slot of the case (a filled slot swaps), or off the case onto the collection to take it out.
    // Slots light up while you drag.
    root.ondragstart = (e) => {
      const el = e.target.closest?.("[data-badge]");
      if (!el) return;
      this.badgeDrag = el.dataset.badge;
      this.badgeDragFromCase = el.classList.contains("case-slot");
      root.classList.add("badge-dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", this.badgeDrag);
    };
    root.ondragover = (e) => {
      if (!this.badgeDrag) return;
      const slot = e.target.closest?.(".case-slot[data-slot]");
      root.querySelectorAll(".case-slot.drop-ok").forEach((el) => el !== slot && el.classList.remove("drop-ok"));
      if (!slot) {
        if (this.badgeDragFromCase && e.target.closest?.(".badge-shelves")) e.preventDefault();
        return;
      }
      e.preventDefault();
      slot.classList.add("drop-ok");
    };
    root.ondragend = () => {
      this.badgeDrag = null;
      this.badgeDragFromCase = false;
      root.classList.remove("badge-dragging");
      root.querySelectorAll(".drop-ok").forEach((el) => el.classList.remove("drop-ok"));
    };
    root.ondrop = (e) => {
      if (!this.badgeDrag) return;
      const slot = e.target.closest?.(".case-slot[data-slot]");
      const m = loadMeta();
      if (slot) {
        e.preventDefault();
        placeBadge(m, this.badgeDrag, Number(slot.dataset.slot));
      } else if (this.badgeDragFromCase && e.target.closest?.(".badge-shelves")) {
        e.preventDefault();
        const at = caseOf(m).indexOf(this.badgeDrag);
        if (at !== -1) removeBadge(m, at);
      } else return;
      saveMeta(m);
      this.badgeDrag = null;
      this.badgeDragFromCase = false;
      root.classList.remove("badge-dragging");
      redrawCase();
    };

      },
    });
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
      return `<li class="${active ? "active" : ""}" data-tip="${escapeHtml(info?.shortEffect ?? "")}">
        <span class="ab-arrow" aria-hidden="true">${active ? "▶" : ""}</span>
        <span class="ab-name">${info?.name ?? id}</span>${ha ? `<span class="ab-ha" data-tip="Hidden Ability: a rarer Ability this species can have">HA</span>` : ""}
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
  // A move's data as it is for this Pokémon: Hidden Power's type and power come from its IVs
  moveData(id, mon) {
    const m = this.ctx.data.moves[id];
    if (id === "return" || id === "frustration") return { ...m, power: 102 }; // no friendship system: always the maximum
    if (id !== "hidden-power") return m;
    return { ...m, ...hiddenPowerOf(mon?.ivs ?? DEFAULT_IVS) };
  }

  moveCard(id, { compact = false, toggle = false, key = "", mon = null, slot = null } = {}) {
    const m = this.moveData(id, mon);
    // A move of a Pokémon on the Team card: drag it onto another to swap, or drop a learnable move on it to replace it
    const fresh = slot !== null && mon?.fresh?.includes(id);
    const slotAttrs = slot === null ? "" : `data-slot="${slot}" data-uid="${mon.uid}" data-move="${id}" data-from="known" data-drag="slot" draggable="true"`;
    const plain = /^Inflicts regular damage( with no additional effect)?\.?$/i.test(m.shortEffect ?? "");
    const desc = !m.shortEffect || plain ? "Just damage, no extra effect." : m.shortEffect;
    return `
      <div class="move-card ${compact ? "compact" : ""} ${fresh ? "is-new" : ""}" ${slotAttrs} ${key ? `data-key="${key}"` : ""} data-type="${m.type}" style="--type: var(--t-${m.type})" title="${m.name} · ${moveStats(m)}\n${desc}">
        <div class="mc-name">${m.name}${fresh ? ` <em class="new-tag">New</em>` : ""}</div>
        <div class="mc-tags"><span class="mc-type">${m.type}</span><span class="cat-pill ${m.category}">${categoryIcon(m.category)}</span>${targetIcon(m.target, m)}</div>
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
    const { slots = false, ...rest } = opts;
    const empty = slots ? Array.from({ length: Math.max(0, 4 - moves.length) }, (_, k) => `<div class="move-card empty-slot" data-slot="${moves.length + k}" data-uid="${opts.mon.uid}">Empty slot</div>`).join("") : "";
    return `<div class="move-cards">${moves.map((id, i) => this.moveCard(id, { mon: opts.mon, ...rest, slot: slots ? i : null, key: opts.keyPrefix ? `${opts.keyPrefix}:${i}:${id}` : "" })).join("")}${empty}</div>`;
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
    const ids = opp.sprites?.length ? opp.sprites // (a Team path: one or two trainers)
      : opp.order === Run.FINAL_ORDER ? [this.run.rival.id]
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
    const run = this.run;
    if (Run.isGauntlet(run)) return this.gauntletTrack();
    const order = run.order;
    // On the recruit/item screens the current battle is already won
    const beaten = ["recruit", "items"].includes(run.screen) ? order : order - 1;
    // Faces are revealed as you reach them, and stay revealed in later runs of the same Challenge Gen
    const evil = run.settings.path === "evil";
    const gen = run.settings.path === "mixed" ? "m" : evil ? `e${run.settings.gen}` : run.settings.gen; // (a Team path has its own progress)
    const meta = loadMeta();
    const reached = Math.max(meta.reach?.[gen] ?? 0, beaten + 1);
    if (!this.preview && reached > (meta.reach?.[gen] ?? 0)) {
      meta.reach = { ...meta.reach, [gen]: reached };
      saveMeta(meta);
    }
    const lineup = evil ? this.ctx.evil[run.settings.gen].opponents : this.ctx.leaders[run.settings.gen].opponents;
    return `<div class="track">${STOP_LABELS.map((label, i) => {
      const n = i + 1;
      const cls = n <= beaten ? "done" : n === beaten + 1 && run.screen === "hub" ? "current" : "";
      const sep = i === 8 || i === 12 ? `<span class="sep"></span>` : "";
      const o = n <= 13 && run.gymPlan ? Run.leaderFor(run, this.ctx, n) : lineup[i]; // (Random gyms: the gym that really stands there)
      if (!o || n > reached) return `${sep}<span class="stop ${cls}" title="Battle ${n}">${label}</span>`;
      const rival = n === Run.FINAL_ORDER && !evil;
      const id = rival ? run.rival?.id : o.sprites?.[0] ?? (o.id === "tate-and-liza" ? "tate" : o.id);
      const name = rival ? `Rival ${run.rival?.name ?? ""}` : `${o.title} ${o.name}`;
      const type = o.theme ?? null;
      return `${sep}<span class="stop face ${cls}" title="Battle ${n}: ${name}${type ? ` (${type})` : ""}"
        style="background-image: url('images/trainers/${id}.png'); ${type ? `--ring: var(--t-${type});` : ""}"><i>${label}</i></span>`;
    }).join("")}</div>`;
  }

  // The Gauntlet's progress: five chapter pips (the regions) and the six stops of the chapter you are in
  gauntletTrack() {
    const run = this.run;
    const inOffer = ["recruit", "items"].includes(run.screen);
    const justEnded = inOffer && run.order === Run.FINAL_ORDER; // (the chapter that ended already counts as the next one)
    const beaten = justEnded ? 0 : Math.max(0, run.order - Run.GAUNTLET_FIRST + (inOffer ? 1 : 0));
    const lineup = this.ctx.leaders[run.settings.gen].opponents;
    const pips = run.chapterGens.map((g, c) => `<span class="chapter-pip ${c < run.chapter ? "done" : c === run.chapter ? "current" : ""}" title="${escapeHtml(this.ctx.leaders[g].region)}">${this.ctx.leaders[g].region}</span>`).join("");
    const stops = STOP_LABELS.slice(Run.GAUNTLET_FIRST - 1).map((label, i) => {
      const n = Run.GAUNTLET_FIRST + i;
      const cls = i < beaten ? "done" : i === beaten && run.screen === "hub" ? "current" : "";
      const o = lineup.find((x) => x.order === n);
      const rival = n === Run.FINAL_ORDER;
      if (!o || i > beaten) return `<span class="stop ${cls}" title="Battle ${i + 1} of the chapter">${label}</span>`;
      const id = rival ? run.rival?.id : o.sprites?.[0] ?? o.id;
      const type = o.theme ?? null;
      return `<span class="stop face ${cls}" title="${escapeHtml(rival ? `Rival ${run.rival?.name ?? ""}` : `${o.title} ${o.name}`)}${type ? ` (${type})` : ""}" style="background-image: url('images/trainers/${id}.png'); ${type ? `--ring: var(--t-${type});` : ""}"><i>${label}</i></span>`;
    }).join("");
    return `<div class="gauntlet-track"><div class="chapter-pips">${pips}</div><div class="track">${stops}</div></div>`;
  }

  // Generic choice dialog → resolves with an option's value, or null when cancelled
  // layout "cards": options are shown as a 2-column grid of cards (e.g. move cards)
  // nav: shows ◀ ▶ around the title (also arrow keys and swipe); resolves with { nav: -1 | 1 }
  // Buttons inside the body with data-result='{"…":…}' close the dialog with that object.
  // onOpen(dialogElement): runs once the dialog is on screen (e.g. to wire up tabs)
  modal({ title, label = "", body = "", head = "", options = [], cancel = "Cancel", layout = "list", wide = false, nav = false, onOpen = null, variant = "", actions = "" }) {
    return new Promise((resolve) => {
      const backdrop = document.createElement("div");
      // A yes / no question (one plain option and a way out): the option becomes a coloured button at the bottom right
      const confirm = layout === "list" && cancel && options.length === 1 && !/<(img|small)/.test(options[0].html ?? "") ? options[0] : null;
      backdrop.className = `modal-backdrop ${layout === "cards" || wide ? "wide" : ""} ${layout === "actions" ? "details" : ""} ${variant}`;
      // Three parts: a fixed top (head + title), a scrolling middle, a fixed bottom (Close)
      backdrop.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true" ${label ? `aria-label="${label}"` : ""}>
          <div class="modal-head">${head}${title ? `<h2>${title}</h2>` : ""}</div>
          <div class="modal-body">
            ${body ? `<div>${body}</div>` : ""}
            <div class="options ${layout === "cards" ? "card-options" : layout === "actions" ? "action-options" : ""}">
              ${confirm ? "" : options.map((o, i) => `<button class="${layout === "cards" ? "card-choice" : layout === "actions" ? "btn small" : "btn"}" data-i="${i}" ${o.disabled ? "disabled" : ""}>${o.html ?? o.label}</button>`).join("")}
            </div>
          </div>
          ${cancel ? `<div class="modal-foot ${confirm ? "confirm-foot" : ""}"><button class="btn" data-cancel>${cancel}</button>${actions}${confirm ? `<button class="btn confirm" data-i="0" ${confirm.disabled ? "disabled" : ""}>${confirm.html ?? confirm.label}</button>` : ""}</div>` : ""}
        </div>`;
      const close = (value) => { backdrop.remove(); document.removeEventListener("keydown", onKey); resolve(value); };
      const onKey = (e) => {
        if (backdrop !== [...document.querySelectorAll(".modal-backdrop")].pop()) return; // only the window on top reacts
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
      // A team strip in the head (data-reorder): drag a Pokémon onto another one to change the team order
      let dragUid = null;
      const stripPick = (e) => e.target.closest?.(".mon-strip[data-reorder] .mon-pick[data-uid]");
      backdrop.addEventListener("dragstart", (e) => {
        const b = stripPick(e);
        if (!b) return;
        dragUid = Number(b.dataset.uid);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", "mon");
        b.classList.add("dragging");
      });
      backdrop.addEventListener("dragover", (e) => { if (dragUid !== null && stripPick(e)) e.preventDefault(); });
      backdrop.addEventListener("dragend", () => { dragUid = null; backdrop.querySelectorAll(".dragging").forEach((el) => el.classList.remove("dragging")); });
      backdrop.addEventListener("drop", (e) => {
        const b = stripPick(e);
        if (dragUid === null || !b) return;
        e.preventDefault();
        const run = this.run;
        Run.moveTeamMemberTo(run, dragUid, run.team.findIndex((m) => m.uid === Number(b.dataset.uid)));
        dragUid = null;
        this.save();
        const strip = backdrop.querySelector(".mon-strip[data-reorder]");
        const current = run.team.find((m) => m.uid === Number(strip.dataset.current));
        if (current) strip.outerHTML = this.monStrip(current);
        this.render(); // the team behind the window follows
      });
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
  // Hovering a new move marks it as seen: its highlight (and the Pokémon's dot) goes away
  markSeen(e) {
    const el = e.target.closest?.(".is-new[data-move]");
    if (!el) return;
    const uid = Number(el.dataset.uid);
    Run.seeMove(this.run, uid, el.dataset.move);
    el.classList.remove("is-new");
    el.querySelector(".new-tag")?.remove();
    const mon = this.run.team.find((m) => m.uid === uid);
    if (!mon?.fresh?.length) document.querySelectorAll(`.new-dot[data-uid="${uid}"], .new-tag[data-uid="${uid}"]`).forEach((x) => x.remove());
  }

  // Small yellow dot on a Pokémon that has a move you haven't looked at yet
  newDot(mon) {
    return mon.fresh?.length ? `<i class="new-dot" data-uid="${mon.uid}" title="New move available"></i>` : "";
  }

  monStrip(mon) {
    const team = this.run.team;
    if (team.length < 2) return "";
    return `<div class="mon-strip" role="group" aria-label="Choose a Pokémon" data-reorder data-current="${mon.uid}">${team.map((m, j) => `
      <button class="mon-pick ${m === mon ? "current" : ""} ${j < 2 ? "lead" : ""}" data-result='{"goto":${m.uid}}' data-uid="${m.uid}" draggable="true" ${m === mon ? `aria-current="true"` : ""}
        title="${this.ctx.data.pokemonByKey[m.species].name}${j < 2 ? " (lead)" : ""} (drag to change the order)"><img src="${this.sprite(m)}" alt="${this.ctx.data.pokemonByKey[m.species].name}">${this.newDot(m)}</button>`).join("")}</div>`;
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
    const cards = offer.options.map((o, i) => {
      const m = o.spec;
      const nature = m.nature.charAt(0).toUpperCase() + m.nature.slice(1);
      return `
        <button class="offer-card tier-${o.tier} ${o.taken ? "taken" : ""}" data-act="recruit-open" data-pick="${i}" style="animation-delay:${i * 80}ms"
          ${o.taken || offer.picksLeft <= 0 ? "disabled" : ""}>
          <span class="tier">${o.tier}${o.taken ? " · picked" : ""}</span>
          <img class="big" src="${this.sprite(m)}" alt="">
          <span class="name">${this.monName(m)}</span>
          <span>${this.typeBadges(m.species)}</span>
          ${o.pending ? `<span class="bench-note" data-tip="Mono type: it waits on the bench, out of battle, until it has evolved into ${cap(run.settings.monoType)}">Benched until ${cap(run.settings.monoType)}</span>` : ""}
          <span class="detail">Lv ${m.level} · ${nature}</span>
          ${run.charFx?.["iv-rating"] && m.ivs ? `<span class="detail iv-rating" title="How close its hidden stat boosts (IVs) are to perfect">IVs ${Math.round(Object.values(m.ivs).reduce((a, b) => a + b, 0) / 186 * 100)}%</span>` : ""}
          ${o.taken ? "" : `<span class="open-hint">Tap for details</span>`}
        </button>`;
    }).join("");
    const headline = starter ? (run.settings.fixedSix || Run.isGauntlet(run) ? "Choose your six Pokémon" : "Choose your starters")
      : `You beat ${run.lastBattle?.opponent}! Recruit time`;
    const picks = offer.picksLeft;
    const meter = `<div class="pick-meter" aria-label="${picks} of ${offer.picks} picks left"><span class="pm-count"><b>${picks}</b> of ${offer.picks} pick${offer.picks > 1 ? "s" : ""} left</span>
      <span class="pm-dots">${Array.from({ length: offer.picks }, (_, i) => `<i class="${i < offer.picks - picks ? "done" : ""}"></i>`).join("")}</span></div>`;
    const sub = `Tap a card to see it, then lock it in. They join at Lv ${offer.level}.${!starter && run.team.length >= 6 ? " Team full: you'll swap one out." : ""}${offer.magnet ? ` 🧲 Type Magnet: ${cap(offer.magnet.type)} cards are favoured.` : ""}`;
    this.hub.innerHTML = `
      ${starter ? "" : this.track()}
      <div class="post-battle">${this.rewardsBanner()}${this.nextUpCard()}</div>
      ${this.fallenNotice()}
      <div class="offer-head">
        <div><h1>${headline}</h1><p>${sub}</p>${meter}</div>
        <div class="row-buttons">
          <button class="btn reroll-btn ${this.rerollsLeft(offer) <= 0 ? "" : "free"}" data-act="reroll" ${this.rerollsLeft(offer) <= 0 || offer.picksLeft <= 0 ? "disabled" : ""}
            title="Replaces every card you haven't locked in. Locked-in Pokémon stay.">${this.rerollsLeft(offer) <= 0 ? "No rerolls left" : `<span class="dice">🎲</span> Free reroll${this.rerollsLeft(offer) > 1 ? ` ×${this.rerollsLeft(offer)}` : ""}`}</button>
          ${!starter && (offer.swapsUsed ?? 0) < perkParam(run, this.ctx.rules, "swap") + (run.perks?.tree?.run?.swap ?? 0) ? `<button class="btn" data-act="swap" title="Swap: trade one of your Pokémon for any card, without using a pick.">🔁 Swap</button>` : ""}
          ${starter ? "" : `<button class="btn" data-act="skip" title="${offer.picksLeft < offer.picks ? "Skip the rest of your picks" : "Take nobody"}">Skip</button>`}
        </div>
      </div>
      <div class="offer-grid" role="group" aria-label="Recruits">${cards}</div>
      ${run.team.length ? `<section class="card-panel"><h3>Your team (${run.team.length}/6)</h3><div class="team-grid">${run.team.map((m) => this.miniCard(m)).join("")}</div></section>` : ""}`;

    this.hub.onclick = async (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "details") { await this.detailsDialog(Number(e.target.closest("[data-uid]").dataset.uid)); return; }
      if (act === "recruit-open") {
        // The same panel as your team's details, for a Pokémon you could recruit, with a Lock in button
        await this.recruitDialog(Number(e.target.closest("[data-pick]").dataset.pick));
        this.render();
        return;
      }
      if (act === "skip") { Run.skipOffer(run, this.ctx); this.render(); return; }
      if (act === "swap") {
        if (await this.swapDialog(offer)) this.render();
        return;
      }
      if (act === "reroll") {
        const ok = await this.modal({
          title: "Use your free reroll?",
          body: `<p>Every card you haven't locked in is replaced by a new one. Pokémon you locked in stay.</p>`,
          options: [{ value: true, html: "🎲 Reroll" }],
          cancel: "Keep these cards",
        });
        if (ok && run.offer === offer) { Run.rerollOffer(run, this.ctx); this.render(); }
      }
    };
  }

  // The recruit screen's Pokémon panel: the same layout as the details window of your team, plus a Lock in button.
  // ◀ ▶ and the sprites at the top flip through the cards.
  async recruitDialog(index) {
    const { run, ctx } = this;
    const offer = run.offer;
    const o = offer.options[index];
    if (!o || o.taken || offer.picksLeft <= 0) return false;
    const m = o.spec;
    const p = ctx.data.pokemonByKey[m.species];
    const nature = m.nature.charAt(0).toUpperCase() + m.nature.slice(1);
    const [up, down] = NATURES[m.nature] ?? [];
    const active = DETAIL_TABS.some((t) => t.id === this.detailsTab) ? this.detailsTab : "stats";
    const head = `<div class="mon-strip" role="group" aria-label="Choose a Pokémon">${offer.options.map((x, j) => `
      <button class="mon-pick ${j === index ? "current" : ""}" data-result='{"goto":${j}}' ${x.taken ? "disabled" : ""} title="${ctx.data.pokemonByKey[x.spec.species].name}"><img src="${this.sprite(x.spec)}" alt=""></button>`).join("")}</div>`;
    const body = `
      <div class="details">
        <div class="details-head">
          <img src="${this.sprite(m)}" alt="">
          <div class="details-info">
            <div class="details-name">${this.monName(m)}</div>
            <div class="tile-sub">Lv ${m.level} · ${this.typeBadges(m.species)} · <span class="tier-label tier-${o.tier}">${o.tier}</span></div>
            <div class="tile-sub">Nature: <b>${nature}</b>${up ? ` (+${STAT_NAMES[up]}, −${STAT_NAMES[down]})` : " (neutral)"}</div>
            <div class="tile-sub">Base stat total ${p.bst}</div>
          </div>
        </div>
        <div class="tabs details-tabs" role="tablist" aria-label="Details">${DETAIL_TABS.map((t) => `
          <button class="tab ${t.id === active ? "active" : ""}" role="tab" data-tab="${t.id}"
            aria-selected="${t.id === active}"><img src="images/items/${t.icon}.png" alt=""><span>${t.label}</span></button>`).join("")}
        </div>
        <div class="tab-panels">
          <section data-tab-panel="stats">${this.statsTable(m)}</section>
          <section data-tab-panel="abilities">${this.abilityDetails(m)}</section>
          <section data-tab-panel="evolution">${this.evolutionLine(m)}</section>
          <section data-tab-panel="moves">
            <div class="dm-top"><span class="dm-hint">What it knows right now.</span>
              <label class="switch" title="Show what every move does"><input type="checkbox" data-local="effects" ${this.showEffects ? "checked" : ""}><span class="track-dot"></span> Effects</label></div>
            ${this.moveGrid(m.moves, { mon: m })}
          </section>
        </div>
      </div>`;
    const result = await this.modal({
      title: "",
      label: `${p.name}, recruit option ${index + 1} of ${offer.options.length}`,
      actions: `<span class="foot-spacer"></span><span class="foot-note">${offer.picksLeft} of ${offer.picks} pick${offer.picks > 1 ? "s" : ""} left</span><button class="btn primary" data-result='{"act":"lock"}'>Lock in</button>`,
      head,
      body,
      layout: "actions",
      wide: true,
      nav: offer.options.filter((x) => !x.taken).length > 1,
      options: [],
      cancel: "Close",
      onOpen: (dialog) => this.wireDetailTabs(dialog, active),
    });
    if (!result) return false;
    if (result.goto !== undefined) return this.recruitDialog(result.goto);
    if (result.nav) {
      const open = offer.options.map((x, j) => j).filter((j) => !offer.options[j].taken);
      const at = open.indexOf(index);
      return this.recruitDialog(open[(at + result.nav + open.length) % open.length]);
    }
    if (result.act === "lock") return this.lockIn(index);
    return false;
  }

  // Lock in a recruit (asks who to release when the team is full)
  async lockIn(index) {
    const { run, ctx } = this;
    const name = ctx.data.pokemonByKey[run.offer.options[index].spec.species].name;
    let replace = null;
    if (run.team.length >= 6) {
      replace = await this.modal({
        title: "Your team is full",
        body: `<p>Who makes room for ${name}? They'll be released (their held item goes to your bag).</p>`,
        options: run.team.map((m) => ({ value: m.uid, html: `<img src="${this.sprite(m)}" alt=""> ${this.monName(m)} <small>Lv ${m.level}</small>` })),
        cancel: `Don't take ${name}`,
      });
      if (replace === null) return false;
    }
    return Run.pickRecruit(run, ctx, index, replace).ok;
  }

  // Tabs and the Effects switch of a details-style window (the details of your team and of recruits)
  wireDetailTabs(dialog, active) {
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
      if (e.target.closest("[data-local=effects]")) {
        this.showEffects = !this.showEffects;
        try { localStorage.setItem("pd.showEffects", this.showEffects ? "1" : "0"); } catch { /* ignore */ }
        dialog.classList.toggle("show-effects", this.showEffects);
      }
    });
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
      <span class="title">Next up · ${Run.isGauntlet(this.run) ? `chapter ${this.run.chapter + 1} of ${Run.GAUNTLET_CHAPTERS}, battle ${opp.order - Run.GAUNTLET_FIRST + 1} of 6` : `battle #${opp.order}`}</span>
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
        ${r.interest ? `<span class="reward">💰 +₽${r.interest.toLocaleString()} <small>(Interest)</small></span>` : ""}
      </div>
      ${r.badge ? this.badgeNotice(r.badge, r.badgeNew) : ""}
      ${r.tm ? this.tmNotice(r.tm) : ""}
      ${(r.extraTms ?? []).map((t) => this.tmNotice(t, "TM Master")).join("")}
    </section>`;
  }

  fallenNotice() {
    const saved = this.run.lastBattle?.revived ?? [];
    const savedNote = saved.length ? `<section class="card-panel"><h3>Saved by your trainer's perk</h3><p>${saved.join(", ")} fell but pulled through.</p></section>` : "";
    const fallen = this.run.lastBattle?.fallen ?? [];
    if (!fallen.length || this.run.screen === "draft") return savedNote;
    return `<section class="card-panel"><h3>Fallen in battle</h3>
      <div class="fallen-list">${fallen.map((f) => `<div class="mon"><img src="${this.sprite(f)}" alt="">${f.name}</div>`).join("")}</div></section>${savedNote}`;
  }

  // Mono type: a Pokémon that is not of the type yet waits on the bench
  benchTag(m) {
    if (!Run.benched(this.run, this.ctx, m)) return "";
    return `<span class="bench-note" data-tip="Mono type: it stays out of battle until it has evolved into ${cap(this.run.settings.monoType)}">Benched until ${cap(this.run.settings.monoType)}</span>`;
  }

  // A team member on the recruit and item screens: tap it for its details
  miniCard(m) {
    return `<button class="mon-card mini" data-act="details" data-uid="${m.uid}" title="Tap for details">${this.newDot(m)}<div class="mon-head"><img src="${this.sprite(m)}" alt="">
      <div><div class="mon-name">${this.monName(m)}</div><div class="mon-sub">Lv ${m.level} · ${this.abilityText(m)}</div>${this.benchTag(m)}</div></div></button>`;
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
        <div><h1>${this.run.order === 0 ? "Pick your starting items" : "Pick an item"}</h1><p>Tap to select, then confirm. Held items go to a Pokémon next.</p>
          <div class="pick-meter" data-pick-meter><span class="pm-count"><b>0</b> of ${offer.picksLeft} pick${offer.picksLeft > 1 ? "s" : ""} taken</span>
            <span class="pm-dots">${Array.from({ length: offer.picksLeft }, () => "<i></i>").join("")}</span></div></div>
        <button class="btn" data-act="skip">Skip</button>
      </div>
      <div class="offer-grid" role="${multi ? "group" : "radiogroup"}" aria-label="Items">${cards}</div>
      <div class="confirm-bar"><span class="confirm-text"></span><button class="btn primary" data-act="confirm" disabled>Confirm</button></div>
      ${this.run.team.length ? `<section class="card-panel"><h3>Your team (${this.run.team.length}/6)</h3><div class="team-grid">${this.run.team.map((m) => this.miniCard(m)).join("")}</div></section>` : ""}`;

    const nameOf = (i) => itemInfo(offer.options[i].id).name;
    const selection = this.setupSelection({
      limit: offer.picksLeft,
      describe: (sel) => {
        // the pick meter follows what you have selected
        const meter = this.hub.querySelector("[data-pick-meter]");
        if (meter) {
          meter.querySelector("b").textContent = sel.length;
          meter.querySelectorAll(".pm-dots i").forEach((dot, i) => dot.classList.toggle("done", i < sel.length));
        }
        return sel.length ? `Take: <b>${sel.map(nameOf).join(", ")}</b>` : `Select ${offer.picksLeft > 1 ? `up to ${offer.picksLeft} items` : "an item"}`;
      },
      confirmLabel: (sel) => `Confirm${sel.length > 1 ? ` (${sel.length})` : ""}`,
    });

    this.hub.onclick = async (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "details") { await this.detailsDialog(Number(e.target.closest("[data-uid]").dataset.uid)); return; }
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
    const patches = ["ability-patch", "hidden-ability-patch", "nature-mint"].filter((p) => run.bag[p] > 0);

    // Detailed view: one Pokémon in the middle (the one picked in the strip above it)
    const focus = run.team.find((m) => m.uid === this.moveFocus) ?? run.team[0];
    this.moveFocus = focus?.uid;
    const team = run.team.map((m, i) => ({ m, i })).filter(({ m }) => m === focus).map(({ m, i }) => {
      const evo = ctx.dex.evolutionOptions(m, run.bag);
      const evoReady = evo.some((o) => o.ready);
      const nature = m.nature.charAt(0).toUpperCase() + m.nature.slice(1);
      return `
        <div class="mon-card ${i < 2 ? "lead" : ""}" draggable="true" data-drag="mon" data-uid="${m.uid}">
          ${Run.benched(run, ctx, m) ? "" : i < 2 ? `<span class="lead-tag">LEAD</span>` : ""}${this.benchTag(m)}
          <div class="mon-head with-ability">
            <img src="${this.sprite(m)}" alt="">
            <div>
              <div class="mon-name">${this.monName(m)}</div>
              <div class="mon-sub">Lv ${m.level} · ${nature} <span class="nature-effect">${this.natureEffect(m.nature, true)}</span></div>
              <div>${this.typeBadges(m.species)}</div>
            </div>
            ${this.abilityList(m)}
          </div>
          ${this.statStrip(m)}
          <div class="mon-item">${m.item ? `<span class="item-slot held-chip" draggable="true" data-drag="held" data-uid="${m.uid}" title="Drag to another Pokémon or back to the Bag">${this.itemImg(m.item)} ${itemInfo(m.item).name}</span>` : `<span class="item-slot empty" title="Drag an item here, or tap Item"><i aria-hidden="true">+</i> Held item</span>`}</div>
          ${this.moveGrid(m.moves, { keyPrefix: m.uid, mon: m, slots: true })}
          ${run.team.length > 1 ? this.slotStrip(m) : ""}
          <div class="mon-actions">
            <button class="btn small" data-act="item" data-uid="${m.uid}">Item</button>
            ${evo.length ? `<button class="btn small ${evoReady ? "ready" : ""}" data-act="evolve" data-uid="${m.uid}">Evolve${evoReady ? "!" : ""}</button>` : ""}
            ${patches.length ? `<button class="btn small" data-act="patch" data-uid="${m.uid}">Patch / Mint</button>` : ""}
          </div>
        </div>`;
    }).join("");

    const oppName = opp.title === "Rival" ? `Rival ${opp.name}` : `${opp.title} ${opp.name}`;
    this.hub.innerHTML = `
      <div class="hub-top">
        <div class="me-card">
          <img src="${characterById(run.character ?? loadMeta().character).front}" alt="">
          <div><b>${characterById(run.character ?? loadMeta().character).name}</b><small>Gen ${run.settings.gen} · ${Run.regionOf(run, ctx)}</small></div>
        </div>
        ${this.track()}
        <div class="row-buttons"><span class="money">₽${run.money.toLocaleString()}</span>${this.badgeButton()}<button class="btn" data-act="title">Save & quit</button><button class="btn forfeit" data-act="forfeit" title="Give up this run">Forfeit</button></div>
      </div>
      ${messages.length ? `<div class="messages">${messages.map((m) => `<p>${m}</p>`).join("")}</div>` : ""}
      <div class="hub-main">
        <div class="hub-left">
        <section class="card-panel opponent-card">
          <span class="title">Next battle · #${opp.order}</span>
          <div class="trainer-row">
            <div class="trainer-portrait">${this.trainerSprites(opp).map((src) => `<img src="${src}" alt="" onerror="this.remove()">`).join("")}</div>
            <div><span class="who">${oppName}</span>${this.partyBalls(opp.teamSize)}</div>
          </div>
          ${opp.theme ? `<span><span class="type-badge" style="background: var(--t-${opp.theme})">${opp.theme}</span></span>` : ""}
          ${this.badgeTeaser(opp)}
          <dl class="facts">
            <dt>Their level</dt><dd>${opp.level}</dd>
            <dt>Your level</dt><dd>${opp.playerLevel ?? opp.level}${(opp.playerLevel ?? opp.level) > opp.level ? ` <small>(+${opp.playerLevel - opp.level} bonus)</small>` : ""}</dd>
            <dt>Team</dt><dd>${opp.teamSize} Pokémon</dd>
            <dt>Format</dt><dd>Double battle</dd>
          </dl>
          ${opp.pooled ? `<p class="empty-note">Random team from their pool.</p>` : opp.placeholder ? `<p class="empty-note">${this.run.settings.path === "evil" ? `A team of ${opp.theme ?? "any"} types.` : "Placeholder team (no pool yet)."}</p>` : ""}
          <p class="empty-note">Your first two Pokémon lead. Your team is fully healed.</p>
          <button class="btn primary" data-act="battle">Battle!</button>
        </section>
        ${this.bagPanel()}
        </div>
        ${this.sidePanel()}
        <section class="card-panel">
          <div class="team-head">
            <h2>Team (${run.team.length}/6)</h2>
            <div class="row-buttons team-tools">
              ${this.teamView === "grid" ? "" : `<label class="switch" title="Show what every move does"><input type="checkbox" data-act="toggle-all-desc" ${this.showEffects ? "checked" : ""}><span class="track-dot"></span> Effects</label>`}
              <button class="btn small" data-act="toggle-view" aria-pressed="${this.teamView === "grid"}">${this.teamView === "grid" ? "▤ Detailed" : "▦ Grid"}</button>
            </div>
          </div>
          ${this.teamView === "grid"
            ? `<div class="team-tiles">${run.team.map((m, i) => this.teamTile(m, i)).join("")}</div>
               <p class="empty-note">Tap a Pokémon for details. Drag to change the order.</p>`
            : `${this.monPicker(focus)}<div class="team-grid focus-card">${team}</div>`}
          ${run.fallen.length ? `<h3 class="fallen-heading">Fallen</h3><div class="fallen-list">${run.fallen.map((f) => `<div class="mon"><img src="${this.sprite(f)}" alt="">${f.name}<small>#${f.order} ${f.opponent}</small></div>`).join("")}</div>` : ""}
        </section>
      </div>`;

    this.hub.classList.toggle("show-effects", !!this.showEffects);
    this.hub.onclick = (e) => this.onHubClick(e);
    this.hub.onmouseover = (e) => this.markSeen(e);
    this.attachDragDrop();
  }

  // ===============================
  // DRAG & DROP (hub)
  // Bag items / TMs → Pokémon, held item → other Pokémon or Bag,
  // Pokémon → another Pokémon's position.
  // ===============================

  attachDragDrop() {
    const hub = this.hub;
    // Moves go onto a move slot (Moves bar) or onto a move of the Team card; everything else onto a Pokémon or the Bag
    const SLOT = ".move-slot, .mon-card .move-card[data-slot]";
    const targetOf = (el) => {
      if (this.drag && ["learn", "slot"].includes(this.drag.kind)) return el.closest(SLOT);
      return el.closest(".mon-card, .team-tile, .mon-pick") ?? el.closest(".bag-panel");
    };
    const accepts = (drag, target) => {
      if (!drag || !target) return false;
      // learn a move onto a slot, or swap two of the Pokémon's moves
      if (drag.kind === "learn") return target.matches(SLOT);
      if (drag.kind === "slot") return target.matches(SLOT) && Number(target.dataset.slot) !== drag.slot && Number(target.dataset.uid) === drag.uid;
      if (target.matches(SLOT)) return false;
      const isMon = target.matches(".mon-card, .team-tile, .mon-pick");
      if (drag.kind === "mon") return isMon && Number(target.dataset.uid) !== drag.uid;
      if (drag.kind === "held") return (isMon && Number(target.dataset.uid) !== drag.uid) || target.matches(".bag-panel");
      return isMon; // bag item or TM onto a Pokémon
    };
    const clear = () => hub.querySelectorAll(".drop-ok, .dragging").forEach((el) => el.classList.remove("drop-ok", "dragging"));

    hub.ondragstart = (e) => {
      const el = e.target.closest?.("[data-drag]");
      if (!el) return;
      const kind = el.dataset.drag;
      this.drag = { kind, uid: Number(el.dataset.uid), item: el.dataset.item, move: el.dataset.move, from: el.dataset.from, slot: Number(el.dataset.slot) };
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
      if (drag.kind === "learn" || drag.kind === "slot") {
        const slot = Number(target.dataset.slot);
        if (drag.kind === "slot") Run.swapMoves(run, toUid, drag.slot, slot);
        else if (drag.from === "tm") Run.teachTM(run, ctx, toUid, drag.move, slot);
        else Run.relearnMove(run, ctx, toUid, drag.move, slot);
        this.render();
        return;
      }
      if (drag.kind === "mon") {
        Run.moveTeamMemberTo(run, drag.uid, run.team.indexOf(mon));
      } else if (drag.kind === "held") {
        if (target.matches(".bag-panel")) Run.takeItem(run, drag.uid);
        else Run.moveHeldItem(run, drag.uid, toUid);
      } else if (drag.kind === "bag") {
        const kind = ITEMS[drag.item]?.kind;
        if (kind === "held") Run.giveItem(run, toUid, drag.item);
        else if (kind === "evo") await this.evolveDialog(mon);
        else if (kind === "patch") await this.patchDialog(mon);
      }
      this.render();
    };
  }

  // Right column: Moves and Shop share it, with tabs
  sidePanel() {
    const tab = this.sideTab === "shop" ? "shop" : "moves";
    return `<section class="card-panel side-panel">
      <div class="tabs side-tabs" role="tablist" aria-label="Moves and Shop">
        <button class="tab ${tab === "moves" ? "active" : ""}" role="tab" aria-selected="${tab === "moves"}" data-act="side-tab" data-tab="moves">Moves</button>
        <button class="tab ${tab === "shop" ? "active" : ""}" role="tab" aria-selected="${tab === "shop"}" data-act="side-tab" data-tab="shop">Shop</button>
      </div>
      ${tab === "shop" ? this.shopPanel() : this.movesPanel()}
    </section>`;
  }

  // ===============================
  // GYM BADGES (§3k)
  // ===============================

  badgeImg(id, extra = "") {
    const { gen, order } = parseBadgeId(id);
    return `<img class="badge-img ${extra}" src="${badgeImage(id)}" alt="${badgeName(gen, order)}">`;
  }

  // The badge a gym leader gives, greyed out until you own it (a teaser in the Next battle panel)
  badgeTeaser(opp) {
    if (opp.order < 1 || opp.order > 8 || this.run.settings.path === "evil") return ""; // (no badges on a Team path)
    const gen = opp.gen ?? this.run.settings.gen, order = opp.gymOrder ?? opp.order; // (Random gyms: the badge of the gym's own game)
    const id = badgeId(gen, order);
    const owned = ownedBadges(loadMeta()).has(id);
    const name = badgeName(gen, order);
    return `<div class="badge-teaser ${owned ? "owned" : ""}" title="${owned ? `You already have the ${name}` : `Beat ${opp.name} to win the ${name}`}">
      ${this.badgeImg(id, owned ? "" : "locked")}<span>${owned ? `${name} ✓` : `${name}`}</span></div>`;
  }

  // The TM a gym leader gives: a quiet line like the badge notice (teach it from the TM list)
  tmNotice(id, extra = "") {
    const m = this.ctx.data.moves[id];
    if (!m) return "";
    return `<div class="badge-notice tm-notice"><span class="tm-disc" aria-hidden="true">💿</span>
      <div><b>${Run.tmLabel(this.ctx, id)}${extra ? ` <em>(${extra})</em>` : ""}</b>
      <small>${m.type[0].toUpperCase()}${m.type.slice(1)} · ${CATEGORY_LABEL[m.category]} · ${m.power ? `Pow ${m.power}` : "no power"} · ${m.accuracy ? `Acc ${m.accuracy}` : "never misses"}. ${m.shortEffect ? `${m.shortEffect} ` : ""}Teach it from your TM list.</small></div></div>`;
  }

  // The badge you just won (new ones are saved to your collection for every later run). What it does is shown in the badge case.
  badgeNotice(badge, isNew) {
    const id = badgeId(badge.gen, badge.order);
    return `<div class="badge-notice">${this.badgeImg(id)}
      <div><b>${badgeName(badge.gen, badge.order)}${isNew ? " unlocked!" : ""}</b>
      <small>${isNew ? "Added to your badge collection. Check it in the badge case before your next run." : "You already have this badge."}</small></div></div>`;
  }

  // The case as 8 slots (4 × 2), drawn as separate coloured boxes: the boost zones. Every badge in a box is stronger (★).
  caseGrid(slots, zones = [], { editable = false, owned = Infinity, name = "", color = "red", weak = 0 } = {}) {
    const strengths = Object.fromEntries(caseStrengths(slots, zones, weak).map((b) => [b.slot, b]));
    const COLS = 4;
    // Old saves can have pairs that aren't boxes: show those slots on their own
    const shown = validZones(zones) ? zones : slots.map((_, i) => ({ slots: [i], boost: 0 }));
    const slotHtml = (i, boost) => {
      const id = slots[i];
      if ((SLOT_UNLOCKS[i] ?? 0) > owned) {
        return `<div class="case-slot locked" data-slot="${i}" ${editable ? `data-act="case-slot"` : ""} title="Locked: own ${SLOT_UNLOCKS[i]} badges to open this slot">
          <span class="slot-lock">🔒</span><small>${SLOT_UNLOCKS[i]} badges</small></div>`;
      }
      const st = strengths[i];
      const perk = id ? perkInfo(perkOfBadge(this.ctx.rules, id), st.strength) : null;
      const zoneText = boost ? ` In a ${"★".repeat(boost)} zone: stronger.` : "";
      return `<div class="case-slot ${id ? "filled" : ""}" data-slot="${i}" ${editable ? `data-act="case-slot"` : ""} ${id && editable ? `draggable="true" data-badge="${id}"` : ""}
        title="${id ? `${badgeName(st.gen, st.gym)}: ${perk.name}, ${perk.effect}.${zoneText}` : `Slot ${i + 1}.${zoneText}`}">
        ${id ? `${this.badgeImg(id)}${statOfBadge(this.ctx.rules, id) ? `<span class="slot-stat">+${Math.round(badgeStatBoost(st.strength) * 1000) / 10}% ${STAT_NAME[statOfBadge(this.ctx.rules, id)]}</span>` : ""}` : `<span class="slot-no">${i + 1}</span>`}
        ${id && editable ? `<button class="case-x" data-act="case-remove" data-slot="${i}" title="Take it out of the case" aria-label="Take it out of the case">×</button>` : ""}</div>`;
    };
    const open = SLOT_UNLOCKS.filter((n) => n <= owned).length;
    return `<div class="case-board card-${color}">
      ${cardArt()}
      <b class="card-title">TRAINER'S CARD</b><span class="card-name">${name}</span>
      <div class="card-id">${open} of ${CASE_SIZE} slots open</div>
      <div class="card-label">BADGES</div>
      <div class="case-slots" role="group" aria-label="Badge case">${shown.map((z, k) => {
      const sorted = [...z.slots].sort((a, b) => a - b);
      const row = Math.floor(sorted[0] / COLS), col = sorted[0] % COLS;
      const w = new Set(sorted.map((n) => n % COLS)).size, h = new Set(sorted.map((n) => Math.floor(n / COLS))).size;
      const boost = z.boost;
      return `<div class="case-zone zone-${validZones(zones) ? k : -1}" style="grid-column: ${col + 1} / span ${w}; grid-row: ${row + 1} / span ${h}; --cols: ${w}">
        ${boost ? `<span class="zone-boost" title="Every badge in this box is stronger">${"★".repeat(boost)}</span>` : ""}
        ${sorted.map((i) => slotHtml(i, boost)).join("")}</div>`;
    }).join("")}</div></div>`;
  }

  // What a badge case gives: one chip per badge effect (at its strength), and the set bonus per generation
  // off: ids of badges whose effect is switched off. editable: show an on / off switch on every effect (New run screen)
  perkChips(slots, links = [], { off = [], editable = false, weak = 0 } = {}) {
    const worn = caseStrengths(slots, links, weak);
    if (!worn.length) return `<p class="empty-note">${editable ? "Nothing yet: drag a badge into the case to see what it does." : "No badges equipped this run."}</p>`;
    const set = setBonus(slots, this.ctx.rules);
    return `<div class="perk-chips">${worn.map((b) => {
      const perk = perkInfo(perkOfBadge(this.ctx.rules, b.id), b.strength);
      const isOff = off.includes(b.id);
      return `<span class="perk-chip ${isOff ? "off" : ""}">${this.badgeImg(b.id, "mini")}<span><b>${perk.name}</b><small class="stat-line">+${Math.round(badgeStatBoost(b.strength) * 1000) / 10}% ${STAT_NAME[statOfBadge(this.ctx.rules, b.id)] ?? ""} · whole team</small><small>${isOff ? "Switched off" : perk.effect}</small></span>
        ${editable ? `<label class="switch"><input type="checkbox" data-act="badge-fx" data-badge="${b.id}" ${isOff ? "" : "checked"}><span class="track-dot"></span></label>` : ""}</span>`;
    }).join("")}${set.parts.map((p) => `<span class="perk-chip set"><span class="set-gen">Gen ${p.gen}</span><span><b>Set bonus: ${p.count} badges</b><small>+${p.pct}% Attack, Defense, Sp. Atk, Sp. Def and Speed for your Pokémon</small></span></span>`).join("")}</div>
      ${editable ? `<p class="empty-note">Use a switch to turn a badge's effect off for this run.</p>` : ""}`;
  }

  badgeButton() {
    const b = this.run.badges?.equipped ?? [];
    return `<button class="btn badges-btn" data-act="badges" title="Your badge case for this run">
      ${b.map((id) => this.badgeImg(id)).join("")}<span>Badges ${b.length}</span></button>`;
  }

  // In a run the badge case is locked: this only shows it
  async badgesDialog() {
    const { run } = this;
    const slots = run.badges?.slots ?? Array.from({ length: CASE_SIZE }, (_, i) => run.badges?.equipped?.[i] ?? null);
    await this.modal({
      title: "Your badge case",
      variant: "settings",
      body: `<p class="opt-note">Locked in for this run.</p>
        <div class="run-case">
          ${this.caseGrid(slots, run.badges?.links ?? [], { name: characterById(run.character ?? loadMeta().character).name, color: loadMeta().cardColor, weak: run.charFx?.["weak-badge"] ?? 0 })}
          ${this.perkChips(slots, run.badges?.links ?? [], { off: run.badges?.off ?? [], weak: run.charFx?.["weak-badge"] ?? 0 })}
        </div>`,
      cancel: "Close",
    });
  }

  // New run screen: the badge case. Drag badges in and out, or tap a badge for its details and what to do with it.
  badgeCasePanel(meta) {
    const slots = caseOf(meta);
    const links = meta.badgeLinks ?? [];
    const owned = ownedBadges(meta);
    const leaders = this.ctx.leaders;
    const rulesSets = this.ctx.rules.badges?.sets ?? [{ count: 3, pct: 2 }, { count: 5, pct: 4 }, { count: 8, pct: 6 }];
    const tiers = rulesSets.map((t) => t.count);
    const shelfGen = this.shelfGen ?? 1;
    const shelf = (g) => {
      const inCase = slots.filter((id) => id && parseBadgeId(id).gen === g).length;
      const pct = setBonus(slots.filter((id) => id && parseBadgeId(id).gen === g), this.ctx.rules).pct;
      const top = tiers[tiers.length - 1];
      const nextTier = tiers.find((t) => t > inCase);
      const marks = tiers.map((t) => `<i class="notch ${inCase >= t ? "on" : ""}" style="left:${(t / top) * 100}%"></i>`).join("");
      return `<div class="badge-row"><div class="badge-row-head"><span class="badge-row-label">Gen ${g} · ${leaders[g].region}</span>
        <span class="set-meter"><span class="set-text">${nextTier ? `${inCase} in case · ${nextTier - inCase} more for +${rulesSets.find((t) => t.count === nextTier)?.pct ?? "?"}%` : "Full set"}</span>${pct ? `<b>+${pct}% stats</b>` : ""}</span></div>
        <div class="set-bar" aria-hidden="true"><i class="fill" style="width:${Math.min(100, (inCase / top) * 100)}%"></i>${marks}</div>
        <div class="badge-tiles">${Array.from({ length: 8 }, (_, i) => {
          const id = badgeId(g, i + 1);
          const gym = leaders[g].opponents[i];
          return owned.has(id)
            ? `<button class="badge-tile ${slots.includes(id) ? "in-case" : ""}" data-act="badge-open" data-badge="${id}" draggable="true">${this.badgeImg(id)}${slots.includes(id) ? `<i class="in-mark">✓</i>` : ""}</button>`
            : `<button class="badge-tile locked" data-act="badge-open" data-badge="${id}">${this.badgeImg(id, "locked")}<i class="lock">🔒</i></button>`;
        }).join("")}</div></div>`;
    };
    return `<p class="opt-note">Drag a badge into a slot, or tap it for details.<br>The case locks when the run starts.</p>
      <div class="case-layout">
        <div class="case-left">
          ${this.caseGrid(slots, links, { editable: true, owned: owned.size, name: characterById(meta.character).name, color: meta.cardColor })}
          <div class="case-tools"><button class="btn small" data-act="case-auto">Auto-fill</button>
            <button class="btn small" data-act="case-clear" ${slots.some(Boolean) ? "" : "disabled"}>Clear</button>
            <button class="btn small" data-act="perks">Perks (${slots.filter(Boolean).length}/${CASE_SIZE})</button>
            <div class="card-colors" role="group" aria-label="Card colour">${CARD_COLORS.map((c) => `<button class="card-dot card-${c} ${c === (meta.cardColor ?? "red") ? "on" : ""}" data-act="card-color" data-color="${c}" title="${c[0].toUpperCase()}${c.slice(1)}" aria-label="${c} card"></button>`).join("")}</div>
</div>
        </div>
        <div class="case-main">
          <div class="tabs shelf-tabs" role="tablist" aria-label="Badge generations">${[1, 2, 3, 4, 5].map((g) => {
            const have = Array.from({ length: 8 }, (_, i) => owned.has(badgeId(g, i + 1))).filter(Boolean).length;
            return `<button class="tab ${g === shelfGen ? "active" : ""}" role="tab" aria-selected="${g === shelfGen}" data-act="shelf-tab" data-gen="${g}">
              <span>Gen ${g}</span><small class="tab-have">${have}/8</small></button>`;
          }).join("")}</div>
          <div class="badge-shelves">${shelf(shelfGen)}</div>
        </div>
      </div>`;
  }

  // One badge: what it does at its strength, where it sits, and what you can do with it
  // list: the badges you can flip through with ◀ ▶ (the badges in your case, or the generation you were looking at)
  async badgeDialog(id, list = null) {
    const meta = loadMeta();
    const { gen, order } = parseBadgeId(id);
    const gym = this.ctx.leaders[gen].opponents[order - 1];
    const owned = ownedBadges(meta).has(id);
    const slots = caseOf(meta);
    const zones = meta.badgeLinks ?? [];
    const at = slots.indexOf(id);
    const st = at !== -1 ? caseStrengths(slots, zones).find((b) => b.id === id) : null;
    const strength = st?.strength ?? order;
    const perkId = perkOfBadge(this.ctx.rules, id);
    const perk = perkInfo(perkId, strength);
    const stat = statOfBadge(this.ctx.rules, id);
    const pctText = (v) => `${Math.round(v * 1000) / 10}%`;
    const off = (meta.badgeOff ?? []).includes(id);
    // Numbers that the zone made bigger are highlighted; the grey table shows every zone level
    const NUM = /₽?\d+(\.\d+)?%?/g;
    const boosted = !!st?.boost;
    const hl = (t) => (boosted ? t.replace(NUM, '<mark class="hl">$&</mark>') : t);
    const table = `<table class="bd-table"><tr><th>By zone</th>${stat ? `<th>Base</th>` : ""}<th>Special</th></tr>${[0, 1, 2, 3, 4].map((b) => {
      const str = Math.min(10, order + b);
      const info = perkInfo(perkId, str);
      return `<tr class="${st && st.boost === b ? "now" : ""}"><td>${b ? "★".repeat(b) : "No zone"}</td>${stat ? `<td>+${pctText(badgeStatBoost(str))}</td>` : ""}<td>${(info.effect.match(NUM) ?? []).join(" · ")}</td></tr>`;
    }).join("")}</table>`;
    // Set bonus of this badge's generation: wearing 3 / 5 / 8 badges of it adds a bit to every stat
    const tiers = this.ctx.rules.badges?.sets ?? [{ count: 3, pct: 2 }, { count: 5, pct: 4 }, { count: 8, pct: 6 }];
    const inCase = slots.filter((x) => x && parseBadgeId(x).gen === gen).length;
    const setPct = [...tiers].reverse().find((t) => inCase >= t.count)?.pct ?? 0;
    const statNow = badgeStatBoost(strength) * 100;
    const total = Math.round((statNow + (st ? setPct : 0)) * 10) / 10;
    // The final number first, with the sum that makes it right next to it
    const equation = stat ? (st && setPct
      ? `= <mark class="hl">${pctText(badgeStatBoost(strength))}</mark> base effect + <mark class="hl">${setPct}%</mark> set bonus`
      : `= ${pctText(badgeStatBoost(strength))} base effect${st ? " (no set bonus yet)" : ""}`) : "";
    const setText = `<p class="bd-set"><b>Gen ${gen} set bonus:</b> wear ${tiers.map((t) => `${t.count} badges for +${t.pct}%`).join(", ")} to <b>all stats</b> of your team (the full set of ${tiers[tiers.length - 1].count} gives +${tiers[tiers.length - 1].pct}%). In your case: ${inCase}${setPct ? `, so +${setPct}% is active` : ""}. A badge counts for the set even when its special effect is switched off.</p>`;
    const where = !owned ? `<p class="empty-note">🔒 Locked. Beat ${gym.name} (Gym ${order}) in Gen ${gen} to win it.</p>`
      : st && st.boost ? `<p class="empty-note">In a ${"★".repeat(st.boost)} zone: this badge is stronger here.</p>`
      : st ? ""
      : `<p class="empty-note">Not in the case. A zone with more ★ makes it stronger.</p>`;
    // ◀ ▶ and the icons at the top flip through the badges of the list
    const ids = list?.includes(id) ? list : [id];
    const strip = ids.length > 1 ? `<div class="badge-strip" role="group" aria-label="Badges">${ids.map((x) => {
      const o = ownedBadges(meta).has(x);
      return `<button class="strip-badge ${x === id ? "current" : ""}" data-result='${JSON.stringify({ goto: x })}' title="${badgeName(parseBadgeId(x).gen, parseBadgeId(x).order)}">${this.badgeImg(x, o ? "" : "locked")}</button>`;
    }).join("")}</div>` : "";
    const result = await this.modal({
      title: badgeName(gen, order),
      variant: "badge-window",
      head: strip,
      nav: ids.length > 1,
      body: `<div class="badge-detail">
        <div class="bd-head">${this.badgeImg(id, owned ? "" : "locked")}<div><b>${gym.name}'s badge</b><small>Gen ${gen} · Gym ${order}</small></div></div>
        <div class="bd-cols">
          <div class="bd-col">
            ${stat ? `<div class="bd-stat"><small class="bd-kind">Base effect · whole team, always on</small>
              <div class="bd-final"><b>${boosted || setPct ? `<mark class="hl">+${total}%</mark>` : `+${total}%`} ${STAT_NAME[stat]}</b><span class="bd-eq">${equation}</span></div></div>` : ""}
            <div class="bd-effect"><small class="bd-kind">Special effect${st ? " · can be switched off" : ""}</small><b>${perk.name}</b><p>${off && st ? "Switched off for this run." : hl(perk.effect)}.</p></div>
            ${st ? `<label class="switch bd-switch" title="Off: the special effect doesn't work this run. The base effect and the set bonus stay"><input type="checkbox" data-local="fx" ${off ? "" : "checked"}><span class="track-dot"></span> Special effect on</label>` : ""}
            ${where}
          </div>
          <div class="bd-col">
            ${table}
            ${setText}
          </div>
        </div></div>`,
      cancel: "Close",
      onOpen: (dialog) => dialog.addEventListener("change", (e) => {
        if (e.target.closest("[data-local=fx]")) {
          const m = loadMeta();
          const set = new Set(m.badgeOff ?? []);
          if (e.target.checked) set.delete(id); else set.add(id);
          m.badgeOff = [...set];
          saveMeta(m);
          dialog.querySelector(".bd-effect p").innerHTML = e.target.checked ? `${hl(perk.effect)}.` : "Switched off for this run.";
          dialog.querySelector(".bd-effect").classList.toggle("off", !e.target.checked);
        }
      }),
    });
    if (result?.goto) return this.badgeDialog(result.goto, ids);
    if (result?.nav) return this.badgeDialog(ids[(ids.indexOf(id) + result.nav + ids.length) % ids.length], ids);
  }

  // An empty slot: choose a badge for it
  async slotDialog(i) {
    const meta = loadMeta();
    if (!slotUnlocked(meta, i)) {
      await this.modal({
        title: `Slot ${i + 1} is locked`,
        body: `<p>This slot opens when you own <b>${SLOT_UNLOCKS[i]} badges</b>. You have ${meta.badges?.length ?? 0}. Win gym battles to earn more.</p>`,
        cancel: "Got it",
      });
      return;
    }
    const slots = caseOf(meta);
    const zones = meta.badgeLinks ?? [];
    const boost = zones.find((x) => x.slots?.includes(i))?.boost ?? 0;
    const free = [...ownedBadges(meta)].filter((id) => !slots.includes(id)).sort((a, b) => parseBadgeId(b).order - parseBadgeId(a).order);
    const id = await this.modal({
      title: `Slot ${i + 1}`,
      body: `<p>${boost ? `This slot is in a ${"★".repeat(boost)} zone: every badge here is stronger.` : "This slot has no zone boost."}</p>`,
      options: free.map((b) => {
        const { gen, order } = parseBadgeId(b);
        const perk = perkInfo(perkOfBadge(this.ctx.rules, b), Math.min(10, order + boost));
        return { value: b, html: `${this.badgeImg(b, "mini")} ${badgeName(gen, order)} <small>${perk.name}</small>` };
      }),
      cancel: free.length ? "Cancel" : "Close",
    });
    if (!id) return;
    const m = loadMeta();
    placeBadge(m, id, i);
    saveMeta(m);
  }

  // What the badges in the case give, with a switch for each effect
  async perksDialog() {
    const render = () => { const m = loadMeta(); return this.perkChips(caseOf(m), m.badgeLinks ?? [], { off: m.badgeOff ?? [], editable: true }); };
    await this.modal({
      title: "Your perks",
      wide: true,
      body: `<div class="case-perks" data-perks>${render()}</div>`,
      cancel: "Close",
      onOpen: (dialog) => dialog.addEventListener("change", (e) => {
        const id = e.target.closest?.("[data-act=badge-fx]")?.dataset.badge;
        if (!id) return;
        const m = loadMeta();
        const set = new Set(m.badgeOff ?? []);
        if (!set.delete(id)) set.add(id);
        m.badgeOff = [...set];
        saveMeta(m);
        dialog.querySelector("[data-perks]").innerHTML = render();
      }),
    });
  }

  // The rules of the case, for the "How it works" button
  async caseHelp() {
    await this.modal({
      title: "How the badge case works",
      body: `<p>Gym leaders give badges. Once you own one you keep it for every later run.</p>
        <p><b>Fill the case</b> with up to ${CASE_SIZE} badges from any generation. Their perks last the whole run and can't be changed once it starts.</p>
        <p><b>Zones:</b> the case is split into four coloured zones, and every badge inside a zone gets stronger. The top-left zone (2 slots) gives ★, the top-right zone (2 slots) ★★, the bottom-left zone (3 slots) ★★★ and the bottom-right slot ★★★★. A small zone has a bigger boost but fits fewer badges, so where you put your badges matters.</p>
        <p><b>Set bonus:</b> several badges from one generation (3, 5 or 8) give a bonus to your Pokémon's stats.</p>
        <p><b>Base and special effect:</b> every badge has a <b>base effect</b> (it raises one stat of your whole team, always on) and a <b>special effect</b> (the badge's own trick). The switch next to a special effect turns it off for the run if you don't want it.</p>`,
      cancel: "Got it",
    });
  }

  // Swap badge: pick a recruit card, then the Pokémon you give up
  async swapDialog(offer) {
    const { run, ctx } = this;
    const nameOf = (m) => ctx.data.pokemonByKey[m.species].name;
    const card = await this.modal({
      title: "Swap: which recruit do you want?",
      body: `<p>You give up one of your Pokémon for it. This doesn't use a pick.</p>`,
      options: offer.options.map((o, i) => ({ value: i, disabled: o.taken, html: `<img src="${this.sprite(o.spec)}" alt=""> ${this.monName(o.spec)} <small>Lv ${o.spec.level} · ${o.tier}</small>` })),
      cancel: "Cancel",
    });
    if (card === null) return false;
    const uid = await this.modal({
      title: `Who goes in exchange for ${nameOf(offer.options[card].spec)}?`,
      body: `<p>They're released and their item goes to your bag.</p>`,
      options: run.team.map((m) => ({ value: m.uid, html: `<img src="${this.sprite(m)}" alt=""> ${this.monName(m)} <small>Lv ${m.level}</small>` })),
      cancel: "Cancel",
    });
    if (uid === null) return false;
    return Run.swapForRecruit(run, ctx, card, uid).ok;
  }

  // ===============================
  // MOVES BAR (right of the team)
  // The chosen Pokémon's four moves, plus every move it can relearn and every TM it can learn.
  // Drag a move from the lists onto one of the four slots to learn it (replacing that move),
  // or drag one slot onto another to change the order.
  // ===============================

  // What a move does, in words ("Just damage" for plain attacks)
  effectText(id) {
    const m = this.ctx.data.moves[id];
    return !m.shortEffect || /^Inflicts regular damage( with no additional effect)?\.?$/i.test(m.shortEffect) ? "Just damage, no extra effect." : m.shortEffect;
  }

  // The popup for a move in the Moves bar: its details, and for a new move the choice of which slot it takes
  async movePopup(mon, id, from) {
    const { run, ctx } = this;
    const m = this.moveData(id, mon);
    const learnable = from !== "known";
    const options = learnable ? [0, 1, 2, 3].filter((i) => i <= mon.moves.length).map((i) => ({
      value: i,
      html: mon.moves[i] ? `Learn it in place of <b>${ctx.data.moves[mon.moves[i]].name}</b>` : `Learn it in an <b>empty slot</b>`,
    })) : [];
    const slot = await this.modal({
      title: `${m.name}${from === "tm" ? " (TM)" : ""}`,
      wide: true,
      body: `<div class="new-move">${this.moveCard(id, { mon })}</div>
        ${learnable ? `<p>${Run.displayName(ctx, mon)} can learn this. ${from === "tm" ? "TMs are reusable: teaching one doesn't use it up." : "Level-up moves are free."}</p>` : `<p>${Run.displayName(ctx, mon)} already knows this move. Drag it onto another slot to change the order.</p>`}`,
      options,
      cancel: learnable ? "Not now" : "Close",
    });
    if (slot === null || !learnable) return;
    if (from === "tm") Run.teachTM(run, ctx, mon.uid, id, slot);
    else Run.relearnMove(run, ctx, mon.uid, id, slot);
  }

  // category + "50 pow · 100%" + the target icon, for a move row
  mvStats(id, mon = null) {
    const m = this.moveData(id, mon);
    return `<span class="mv-stats"><span class="mv-line"><span class="cat-pill ${m.category}">${categoryIcon(m.category)}</span>${m.power ? `<b>${m.power}</b> pow · ` : ""}${m.accuracy ? `${m.accuracy}%` : "—"}</span>${targetIcon(m.target, m)}</span>`;
  }

  // Every move a Pokémon can learn right now (TMs you own first, then missed level-up moves) as tappable rows.
  // dialog: inside the details window the rows close it and hand the move back (data-result) instead of data-act.
  learnList(mon, { dialog = false } = {}) {
    const { run, ctx } = this;
    const moves = ctx.data.moves;
    const tms = Run.teachableTMs(run, ctx, mon);
    const relearn = Run.relearnableMoves(ctx, mon).reverse().filter((id) => !tms.includes(id));
    const chip = (id, from) => {
      const how = dialog ? `data-result='${JSON.stringify({ act: "move-popup", move: id, from })}'` : `data-act="move-popup"`;
      const fresh = mon.fresh?.includes(id);
      return `<button class="move-chip ${fresh ? "is-new" : ""}" data-uid="${mon.uid}" ${how} data-from="${from}" data-move="${id}" draggable="true" data-drag="learn"
        style="--type: var(--t-${this.moveData(id, mon).type})" title="Tap for details · Drag onto a move to learn it in its place">
        <span class="mv-name">${from === "tm" ? "TM " : ""}${moves[id].name}${fresh ? ` <em class="new-tag">New</em>` : ""}</span>${this.mvStats(id, mon)}
        ${this.showEffects ? `<span class="mv-effect">${this.effectText(id)}</span>` : ""}</button>`;
    };
    const rows = [...tms.map((id) => chip(id, "tm")), ...relearn.map((id) => chip(id, "relearn"))];
    return { html: rows.join(""), count: rows.length, tms: tms.length };
  }

  // A TM tapped in the Bag: its details and who can learn it, then the usual popup to pick the slot
  async tmBagPopup(move) {
    const { run, ctx } = this;
    const uid = await this.modal({
      title: Run.tmLabel(ctx, move),
      body: `<div class="new-move">${this.moveCard(move)}</div><p>TMs are reusable. Which Pokémon should learn it?</p>`,
      options: run.team.map((mon) => {
        const can = ctx.data.pokemonByKey[mon.species].learnset.machine.includes(move);
        const knows = mon.moves.includes(move);
        return {
          value: mon.uid,
          disabled: !can || knows,
          html: `<img src="${this.sprite(mon)}" alt=""> ${this.monName(mon)} <small>${knows ? "already knows it" : can ? "can learn it" : "can't learn it"}</small>`,
        };
      }),
      cancel: "Close",
    });
    if (uid === null) return;
    this.moveFocus = uid;
    await this.movePopup(run.team.find((m) => m.uid === uid), move, "tm");
  }

  // The row of small Pokémon at the top: tap one to look at it (the Team card and the learnable moves follow)
  monPicker(mon) {
    const { run, ctx } = this;
    return `<div class="mon-strip" role="group" aria-label="Choose a Pokémon">${run.team.map((m) => `
        <button class="mon-pick ${m === mon ? "current" : ""}" data-act="move-focus" data-uid="${m.uid}" data-drag="mon" draggable="true" title="${Run.displayName(ctx, m)} (drag to change the order)"><img src="${this.sprite(m)}" alt="">${this.newDot(m)}</button>`).join("")}</div>`;
  }

  movesPanel() {
    const { run, ctx } = this;
    if (!run.team.length) return "";
    const learnOnly = this.teamView === "detailed"; // the Team card shows its moves: this panel is just what it can learn
    const mon = run.team.find((m) => m.uid === this.moveFocus) ?? run.team[0];
    this.moveFocus = mon.uid;
    const moves = ctx.data.moves;
    const stats = (id) => this.mvStats(id, mon);
    const slots = [0, 1, 2, 3].map((i) => {
      const id = mon.moves[i];
      if (!id) return `<div class="move-slot empty" data-slot="${i}" data-uid="${mon.uid}"><span class="mv-name">Empty slot</span></div>`;
      const fresh = mon.fresh?.includes(id);
      return `<div class="move-slot ${fresh ? "is-new" : ""}" data-slot="${i}" data-uid="${mon.uid}" draggable="true" data-drag="slot" data-act="move-popup" data-move="${id}" data-from="known" style="--type: var(--t-${this.moveData(id, mon).type})"
        title="Tap for details · Drag onto another slot to change the order">
        <span class="mv-name">${moves[id].name}${fresh ? ` <em class="new-tag">New</em>` : ""}</span>${stats(id)}
        ${this.showEffects ? `<span class="mv-effect">${this.effectText(id)}</span>` : ""}</div>`;
    }).join("");
    const all = this.learnList(mon);
    if (learnOnly) {
      return `<div class="moves-panel">
        <div class="moves-for"><span><b>${Run.displayName(ctx, mon)}</b> <small>Lv ${mon.level}</small></span>
          <label class="switch" title="Show what every move does"><input type="checkbox" data-act="chip-effects" ${this.showEffects ? "checked" : ""}><span class="track-dot"></span> Effects</label></div>
        <h3>Moves it can learn <small>${all.count} · ${all.tms} TM${all.tms === 1 ? "" : "s"}</small></h3>
        <div class="move-chips scroll">${all.html || `<p class="empty-note">No new moves right now. Win battles for TMs, or level up.</p>`}</div>
        <p class="empty-note">Drag a move onto one of ${Run.displayName(ctx, mon)}'s moves to learn it.</p>
      </div>`;
    }
    return `<div class="moves-panel">
      ${this.monPicker(mon)}
      <div class="moves-for"><span><b>${Run.displayName(ctx, mon)}</b> <small>Lv ${mon.level}</small></span>
        <label class="switch" title="Show what every move does"><input type="checkbox" data-act="chip-effects" ${this.showEffects ? "checked" : ""}><span class="track-dot"></span> Effects</label></div>
      <div class="move-slots">${slots}</div>
      <h3>Moves it can learn <small>${all.count} · ${all.tms} TM${all.tms === 1 ? "" : "s"}</small></h3>
      <div class="move-chips scroll">${all.html || `<p class="empty-note">No new moves right now. Win battles for TMs, or level up.</p>`}</div>
      <p class="empty-note">Drag a move onto a slot to learn or swap it. Tap one for details.</p>
    </div>`;
  }

  // ===============================
  // BAG POCKETS
  // ===============================

  tmIcon(move) {
    return `<img src="images/items/tm-${this.ctx.data.moves[move].type}.png" alt="" onerror="this.style.visibility='hidden'">`;
  }

  bagPanel() {
    const { run, ctx } = this;
    // Berries, medicine and battle items are retired: their pockets only show for a saved run that still holds some
    const holds = (id) => Object.keys(run.bag).some((k) => pocketOf(k) === id);
    const pockets = POCKETS.filter((p) => !["berries", "medicine", "battle"].includes(p.id) || holds(p.id));
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
      `<button class="bag-entry tm-entry" data-act="tm-bag" data-move="${mv}" style="--type: var(--t-${ctx.data.moves[mv].type})"
        title="${ctx.data.moves[mv].shortEffect} · Tap to see who can learn it">${this.tmIcon(mv)} ${Run.tmLabel(ctx, mv)}</button>`);
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
        ${m.fresh?.length ? `<span class="new-tag" data-uid="${m.uid}">New move!</span>` : ""}
        <img src="${this.sprite(m)}" alt="">
        <span class="tile-name">${this.monName(m)}</span>
        <span class="tile-sub">Lv ${m.level}</span>
        <span>${this.typeBadges(m.species)}</span>
        <span class="tile-item" ${m.item ? `draggable="true" data-drag="held" data-uid="${m.uid}" title="Drag onto another Pokémon to give it this item, or onto the Bag to take it back"` : ""}>${m.item ? `${this.itemImg(m.item)} ${itemInfo(m.item).name}` : "No item"}</span>
      </button>`;
  }

  // What a nature does, in words: "+Attack, −Sp. Atk" (or neutral)
  natureEffect(nature, short = false) {
    const [up, down] = NATURES[nature] ?? [];
    return up ? `<span class="nat up">+${STAT_NAMES[up]}</span> <span class="nat down">−${STAT_NAMES[down]}</span>` : (short ? "(neutral)" : "Neutral nature");
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
    const stats = calcStats(p.baseStats, m.level, m.nature, ivs, { ...DEFAULT_EVS, ...m.evs }, m.species);
    const [up, down] = NATURES[m.nature] ?? [];
    const rows = ["hp", "atk", "def", "spa", "spd", "spe"].map((s) => {
      const mark = s === up ? `<span class="nat up" title="Raised by ${m.nature}">▲</span>` : s === down ? `<span class="nat down" title="Lowered by ${m.nature}">▼</span>` : "";
      const pct = Math.min(100, (p.baseStats[s] / 180) * 100);
      const ivPct = Math.min(100 - pct, (ivs[s] / 2 / 180) * 100); // an IV point is worth half a base point in the stat formula
      return `<tr class="${s === up ? "up" : s === down ? "down" : ""}">
        <th>${STAT_NAMES[s]} ${mark}</th>
        <td>${p.baseStats[s]}</td>
        <td class="bar-cell"><span class="stat-track"><span class="stat-bar" style="width:${pct}%" title="Base ${p.baseStats[s]}"></span><span class="stat-iv" style="width:${ivPct}%" title="IV ${ivs[s]}"></span></span></td>
        <td>${ivs[s]}</td>
        <td class="total">${stats[s]}</td>
      </tr>`;
    }).join("");
    return `<table class="stats-table">
      <thead><tr><th>Stat</th><th>Base</th><th class="bar-legend"><i class="base"></i>Base <i class="iv"></i>IV</th><th>IV</th><th>Lv ${m.level}</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><th>Total</th><td>${p.bst}</td><td></td><td></td><td></td></tr></tfoot>
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
    // Many branches (Eevee): a 3 by 3 grid, the first stage in the middle and the evolutions around it
    if (stages.length === 2 && stages[0].length === 1 && stages[1].length >= 4 && stages[1].length <= 8) {
      const RING = [[1, 1], [1, 2], [1, 3], [2, 3], [3, 3], [3, 2], [3, 1], [2, 1]]; // row, column, clockwise from the top left
      const tile = (k, at, i) => `<div class="evo-mon compact ${k === m.species ? "current" : ""}" style="grid-row:${at[0]};grid-column:${at[1]}">
          <img src="${ctx.data.pokemonByKey[k].sprites.front}" alt="">
          <b>${ctx.data.pokemonByKey[k].name}</b>
          ${i >= 0 ? `<small>${method(k)}</small>` : ""}</div>`;
      return `<div class="evo-ring">${tile(stages[0][0], [2, 2], -1)}${stages[1].map((k, i) => tile(k, RING[i], i)).join("")}</div>`;
    }
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
    const patches = ["ability-patch", "hidden-ability-patch", "nature-mint"].some((x) => run.bag[x] > 0);
    const act = (value, label, { disabled = false, ready = false } = {}) =>
      `<button class="btn small ${ready ? "ready" : ""}" data-result='{"act":"${value}"}' ${disabled ? "disabled" : ""}>${label}</button>`;
    const active = DETAIL_TABS.some((t) => t.id === this.detailsTab) ? this.detailsTab : "stats";
    const learn = this.learnList(mon, { dialog: true });
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
          ${patches ? `<div class="panel-actions">${act("patch", "Use a Patch or Mint…")}</div>` : ""}</section>
        <section data-tab-panel="evolution">${this.evolutionLine(mon)}
          ${evo.length ? `<div class="panel-actions">${act("evolve", evo.some((o) => o.ready) ? "Evolve!" : "Evolve…", { ready: evo.some((o) => o.ready) })}</div>` : ""}</section>
        <section data-tab-panel="moves">
          <div class="dm-top"><span class="dm-hint">Tap a move to read what it does.</span>
            <label class="switch" title="Show what every move does"><input type="checkbox" data-local="effects" ${this.showEffects ? "checked" : ""}><span class="track-dot"></span> Effects</label></div>
          <div class="dm-grid">
            <div class="dm-known"><h4>Knows <small>drag to change the order</small></h4>
              ${this.moveGrid(mon.moves, { mon })}
              ${mon.moves.length < 4 ? `<div class="move-cards empty-slots">${Array.from({ length: 4 - mon.moves.length }, (_, k) => `<div class="move-card empty-slot" data-slot="${mon.moves.length + k}">Empty slot</div>`).join("")}</div>` : ""}
              <button data-result='{"act":"reload"}' data-reload hidden type="button"></button></div>
            <div class="dm-learn"><h4>Can learn <small>${learn.count}${learn.tms ? ` · ${learn.tms} TM${learn.tms === 1 ? "" : "s"}` : ""}</small></h4>
              <div class="move-chips">${learn.html || `<p class="empty-note">No new moves right now.</p>`}</div></div>
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
        // On wide screens the learnable moves sit in their own column to the right of the window
        const backdrop = dialog.parentElement;
        const side = dialog.querySelector(".dm-learn");
        const out = side && window.matchMedia("(min-width: 1100px)").matches;
        if (out) {
          backdrop.classList.add("has-side");
          dialog.querySelector(".dm-grid").classList.add("learn-out");
          side.classList.add("side-column");
          backdrop.appendChild(side);
        }
        // The learnable moves keep their scroll position when the window reopens for the same Pokémon
        const scroller = out ? side : dialog.querySelector(".dm-learn .move-chips");
        if (scroller) {
          scroller.addEventListener("scroll", () => { this.learnScrollDlg = { uid: mon.uid, top: scroller.scrollTop }; });
        }
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
          if (out) side.hidden = id !== "moves";
        };
        show(active);
        if (scroller && this.learnScrollDlg?.uid === mon.uid) {
          const top = this.learnScrollDlg.top;
          scroller.scrollTop = top;
          if (!scroller.scrollTop && top) { // not visible yet (another tab is open): apply when the Moves tab is shown
            backdrop.addEventListener("click", (e) => { if (e.target.closest("[data-tab=moves]")) scroller.scrollTop = top; }, { once: true });
          }
        }
        backdrop.classList.toggle("show-effects", !!this.showEffects);
        dialog.classList.toggle("show-effects", !!this.showEffects);
        // Moves tab: drag a known move onto another to swap them, or drag a learnable move onto one to learn it in its place
        dialog.querySelectorAll(".dm-known .move-cards:not(.empty-slots) .move-card").forEach((card, i) => {
          card.draggable = true;
          card.dataset.slot = i;
          card.dataset.drag = "slot";
        });
        backdrop.addEventListener("mouseover", (e) => this.markSeen(e));
        let drag = null;
        const target = (e) => e.target.closest?.(".dm-known .move-card[data-slot]");
        backdrop.addEventListener("dragstart", (e) => {
          const el = e.target.closest?.("[data-drag]");
          if (!el) return;
          drag = { kind: el.dataset.drag, slot: Number(el.dataset.slot), move: el.dataset.move, from: el.dataset.from };
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", "move");
        });
        backdrop.addEventListener("dragover", (e) => {
          const t = target(e);
          backdrop.querySelectorAll(".drop-ok").forEach((x) => x !== t && x.classList.remove("drop-ok"));
          if (!drag || !t || (drag.kind === "slot" && Number(t.dataset.slot) === drag.slot)) return;
          e.preventDefault();
          t.classList.add("drop-ok");
        });
        backdrop.addEventListener("dragend", () => { drag = null; backdrop.querySelectorAll(".drop-ok").forEach((x) => x.classList.remove("drop-ok")); });
        backdrop.addEventListener("drop", (e) => {
          const t = target(e);
          if (!drag || !t) return;
          e.preventDefault();
          const slot = Number(t.dataset.slot);
          if (drag.kind === "slot") Run.swapMoves(run, mon.uid, drag.slot, slot);
          else if (drag.from === "tm") Run.teachTM(run, ctx, mon.uid, drag.move, slot);
          else Run.relearnMove(run, ctx, mon.uid, drag.move, slot);
          drag = null;
          backdrop.querySelector("[data-reload]")?.click(); // closes the window; it reopens with the new moves
        });
        backdrop.addEventListener("click", (e) => {
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
            backdrop.classList.toggle("show-effects", this.showEffects);
            // (the switch moves by itself)
          }
        });
      },
    });
    if (!result) return;
    if (result.goto) return this.detailsDialog(result.goto);
    if (result.nav) return this.detailsDialog(this.neighbour(mon, result.nav).uid);
    if (result.act === "move-popup") await this.movePopup(mon, result.move, result.from);
    if (result.act === "swap") await this.swapDialog(mon);
    if (result.act === "item") await this.itemDialog(mon);
    if (result.act === "evolve") await this.evolveDialog(mon);
    if (result.act === "patch") await this.patchDialog(mon);
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
  // Price of a shop entry: plain text, with the old price struck through and a −% tag when it is on sale
  priceTag(e) {
    if (e.sold) return `<span class="price">Sold</span>`;
    if (!e.sale) return `<span class="price">₽${e.price.toLocaleString()}</span>`;
    return `<span class="price sale"><s>₽${e.was.toLocaleString()}</s> ₽${e.price.toLocaleString()}</span>`;
  }

  shopPanel() {
    const { run, ctx } = this;
    const stock = (run.shop?.stock ?? []).map((e, i) => ({ e, i }));
    const tms = (run.shop?.tms ?? []).map((t, i) => ({ t, i }));
    const inSection = (id) => stock.filter(({ e }) => pocketOf(e.id) === id && !e.sale);
    const left = (id) => (id === "tms" ? tms.filter(({ t }) => !t.sold && !t.sale) : inSection(id).filter(({ e }) => !e.sold)).length;
    const cost = Run.shopRerollCost(run, ctx);

    const itemRow = ({ e, i }) => {
      const item = itemInfo(e.id);
      // The whole row is the buy button; the price is plain text
      return `<button class="shop-item tier-${e.tier} ${e.sold ? "sold" : ""} ${e.sale ? "on-sale" : ""}" title="${item.desc}" data-act="buy" data-i="${i}" ${e.sold || run.money < e.price ? "disabled" : ""}>
        ${this.itemImg(e.id)}
        <span class="si-text"><b>${item.name}</b><small>${item.desc}</small></span>
        ${this.priceTag(e)}
      </button>`;
    };
    const tmRow = ({ t, i }) => {
      const m = ctx.data.moves[t.move];
      return `<button class="shop-item tm-shop ${t.sold ? "sold" : ""} ${t.sale ? "on-sale" : ""}" style="--type: var(--t-${m.type})" title="${m.shortEffect}" data-act="buy-tm" data-i="${i}" ${t.sold || run.money < t.price ? "disabled" : ""}>
        ${this.tmIcon(t.move)}
        <span class="si-text"><b>${Run.tmLabel(ctx, t.move)}</b><small>${m.type} · ${m.category}${m.power ? ` · ${m.power} power` : ""}. ${m.shortEffect}</small></span>
        ${this.priceTag(t)}
      </button>`;
    };

    return `<div class="shop-panel">
      <div class="team-head"><span class="empty-note">You have ₽${run.money.toLocaleString()}.</span>
        <div class="row-buttons team-tools">
          <button class="btn small reroll-btn ${cost ? "" : "free"}" data-act="shop-reroll" ${run.money < cost ? "disabled" : ""}
            title="New stock and new deals. The first restock after each battle is free."><span class="dice">🎲</span> Restock ${cost ? `₽${cost.toLocaleString()}` : "<b>FREE</b>"}</button>
          <button class="btn small" data-act="sell" ${Object.keys(run.bag).length ? "" : "disabled"}>Sell</button>
        </div>
      </div>
      <p class="empty-note">New stock after every battle.</p>
      ${(() => {
        const deals = [...stock.filter(({ e }) => e.sale).map(itemRow), ...tms.filter(({ t }) => t.sale).map(tmRow)];
        return deals.length ? `<div class="pocket shop-section deals">
          <h3><span class="deal-title">🔥 Today's deals</span> <span class="tab-count">${deals.length}</span></h3>
          <div class="shop-grid">${deals.join("")}</div></div>` : "";
      })()}
      ${POCKETS.map((p) => {
        const rows = p.id === "tms" ? tms.filter(({ t }) => !t.sale).map(tmRow) : inSection(p.id).map(itemRow);
        if (!rows.length) return "";
        const folded = this.shopFolded?.has(p.id);
        return `<div class="pocket shop-section ${folded ? "folded" : ""}" data-shop-section="${p.id}">
          <h3><button class="shop-head" data-act="shop-fold" data-section="${p.id}" aria-expanded="${!folded}">
            <span class="fold-arrow" aria-hidden="true">▾</span><img src="images/items/${p.icon}.png" alt=""> ${p.label} <span class="tab-count">${left(p.id)}</span></button></h3>
          ${folded ? "" : `<div class="shop-grid">${rows.join("")}</div>`}
        </div>`;
      }).join("")}
    </div>`;
  }

  async onHubClick(e) {
    // The Team card (Detailed view): a tap on the card itself opens the details window, like a tile in the Grid view
    const teamCard = e.target.closest(".focus-card .mon-card");
    if (teamCard && !e.target.closest("button, label, input, .move-card, .item-slot, .slot-strip, .mon-actions, [data-act]")) {
      await this.detailsDialog(Number(teamCard.dataset.uid));
      return;
    }
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
    if (act === "shop-fold") {
      // Fold or unfold a shop section
      this.shopFolded ??= new Set();
      const id = btn.dataset.section;
      if (!this.shopFolded.delete(id)) this.shopFolded.add(id);
      this.render();
      return;
    }
    if (act === "side-tab") {
      this.sideTab = btn.dataset.tab;
      this.render();
      return;
    }
    if (act === "badges") {
      await this.badgesDialog();
      return;
    }
    if (act === "move-focus") {
      this.moveFocus = Number(btn.dataset.uid);
      this.render();
      return;
    }
    if (act === "tm-bag") {
      await this.tmBagPopup(btn.dataset.move);
      this.render();
      return;
    }
    if (act === "move-popup") {
      const mon = run.team.find((m) => m.uid === Number(btn.dataset.uid));
      if (mon) await this.movePopup(mon, btn.dataset.move, btn.dataset.from);
      this.render();
      return;
    }
    if (act === "chip-effects") {
      this.showEffects = !this.showEffects;
      try { localStorage.setItem("pd.showEffects", this.showEffects ? "1" : "0"); } catch { /* ignore */ }
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
      this.render();
      return;
    }
    const uid = Number(btn.dataset.uid);
    const mon = run.team.find((m) => m.uid === uid);

    if (act === "title") { this.save(); this.start(); return; }
    if (act === "forfeit") { if (await this.askForfeit()) this.forfeitRun(); return; }
    if (act === "battle") {
      const result = Run.startBattle(run, ctx);
      if (!result.ok) { await this.modal({ title: result.reason, cancel: "OK" }); return; }
      this.save();
      this.playBattle(result.battle, { initialEvents: result.events });
      return;
    }
    if (act === "slot") Run.swapTeamMember(run, uid, Number(btn.dataset.slot));
    if (act === "item") await this.itemDialog(mon);
    if (act === "evolve") await this.evolveDialog(mon);
    if (act === "patch") await this.patchDialog(mon);
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
          <p>Reusable: teach it to as many Pokémon as you like. ${t.sale ? `<s>₽${t.was.toLocaleString()}</s> ` : ""}₽${t.price.toLocaleString()} · you have ₽${run.money.toLocaleString()}</p>`,
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
          <p>${entry.sale ? `<s>₽${entry.was.toLocaleString()}</s> ` : ""}₽${entry.price.toLocaleString()} · you have ₽${run.money.toLocaleString()}</p>`,
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
    if (run.bag["nature-mint"]) {
      options.push({ value: "nature-mint", html: `${this.itemImg("nature-mint")} Nature Mint <small>now ${cap(mon.nature)}${run.bag["nature-mint"] > 1 ? ` · you have ${run.bag["nature-mint"]}` : ""}</small>` });
    }
    const kind = await this.modal({ title: `Use a patch or mint on ${p.name}`, options });
    if (kind === "nature-mint") return this.mintDialog(mon);
    if (kind) Run.usePatch(run, ctx, mon.uid, kind);
  }

  // Nature Mint: pick the new Nature (one neutral one, Serious, stands for the five that change nothing)
  async mintDialog(mon) {
    const { run, ctx } = this;
    const label = (n) => { const [up, down] = NATURES[n] ?? []; return up ? `+${STAT_NAMES[up]} −${STAT_NAMES[down]}` : "no stat changes"; };
    const options = Object.keys(NATURES).filter((n) => NATURES[n] || n === "serious")
      .map((n) => ({ value: n, disabled: n === mon.nature, html: `${cap(n)} <small>${label(n)}${n === mon.nature ? " · now" : ""}</small>` }));
    const nature = await this.modal({ title: `${ctx.data.pokemonByKey[mon.species].name}: new Nature`, options, wide: true });
    if (nature) Run.useNatureMint(run, ctx, mon.uid, nature);
  }

  // ===============================
  // BATTLE
  // ===============================

  // Forfeit: ask first, then end the run as a loss (the battles you beat still pay Trainer Points)
  askForfeit() {
    const beaten = ["recruit", "items"].includes(this.run.screen) ? this.run.order : this.run.order - 1;
    return this.modal({
      title: "Forfeit this run?",
      body: `<p>The run ends here and your team is gone. You keep the Trainer Points for the ${Math.max(0, beaten)} battle${beaten === 1 ? "" : "s"} you beat.</p>`,
      options: [{ value: true, label: "Yes, forfeit" }],
      cancel: "Keep playing",
      variant: "forfeit-modal",
    });
  }

  forfeitRun() {
    Run.forfeit(this.run);
    this.battleScreen?.destroy();
    this.battleScreen = null;
    this.render();
  }

  renderBattle() {
    // Resuming a saved battle
    const battle = new Battle(this.ctx.data, this.run.battle);
    this.playBattle(battle, { resumed: true });
  }

  playBattle(battle, runOpts) {
    this.showBattle();
    const o = this.run.opponent;
    playMusic(this.run.settings.path === "evil" ? (o.order === 14 ? "rival" : o.order === 13 ? "champion" : o.order >= 9 ? "elite" : "gym")
      : { "Gym Leader": "gym", "Elite Four": "elite", Champion: "champion", Rival: "rival" }[o.title] ?? "battle");
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
      onForfeit: async () => { if (this.run === mine && await this.askForfeit()) this.forfeitRun(); },
      onEnd: async () => {
        screen.destroy();
        await new Promise((r) => setTimeout(r, 900));
        if (this.run !== mine) return;
        const turns = this.run.battle?.turn ?? null;
        Run.finishBattle(this.run, this.ctx);
        // Winning a gym unlocks its badge for good (§3k)
        const reward = this.run.lastBattle?.rewards;
        let granted = [];
        if (!this.preview) {
          const meta = loadMeta();
          if (reward?.badge) reward.badgeNew = unlockBadge(meta, reward.badge.gen, reward.badge.order);
          // Progress for the character unlocks (§3j): at most 2 new trainers per run
          if (this.run.lastBattle?.won) noteBattleWon(meta, this.run, this.ctx, { turns });
          const rules = this.ctx.rules.characterUnlocks ?? {};
          granted = grantUnlocks(meta, rules, CHARACTERS, MAX_UNLOCKS_PER_RUN - (this.run.unlockedThisRun?.length ?? 0));
          saveMeta(meta);
          this.run.unlockedThisRun = [...(this.run.unlockedThisRun ?? []), ...granted];
        }
        this.render();
        if (granted.length && !["over", "won"].includes(this.run.screen)) await this.announceUnlocks(granted);
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
      meta.tp += tp;
      meta.earned += tp;
      recordRun(meta, run, this.ctx);
      const granted = grantUnlocks(meta, this.ctx.rules.characterUnlocks ?? {}, CHARACTERS, MAX_UNLOCKS_PER_RUN - (run.unlockedThisRun?.length ?? 0));
      saveMeta(meta);
      run.tpAwarded = true;
      run.newUnlocks = [...(run.unlockedThisRun ?? []), ...granted];
    }
    const fresh = (run.newUnlocks ?? []).map((id) => characterById(id));
    const bonus = run.perks?.tpPct ? `pay increase +${run.perks.tpPct}%` : "";
    return `<p class="tp-earned">+${tp} Trainer Points <small>(${bonus ? `${bonus}; ` : ""}spend them in the Skill Tree)</small></p>
      ${fresh.length ? `<section class="card-panel"><h3>New trainers unlocked!</h3>
        <div class="characters">${fresh.map((c) => `<div class="character selected"><img src="${c.front}" alt=""><span>${c.name}</span><small class="how-unlocked"><em>How you unlocked them:</em> ${unlockText((this.ctx.rules.characterUnlocks ?? {})[c.id])}</small>${this.perkLine(c.id)}</div>`).join("")}</div></section>` : ""}`;
  }

  // What a trainer's perk does (only perks the game applies are shown)
  perkLine(id) {
    const rule = (this.ctx.rules.characterUnlocks ?? {})[id];
    return rule?.effect && rule.effect !== "—" ? `<small>Perk: ${rule.perk}</small>` : "";
  }

  // "New trainer!" one at a time, with what they do
  async announceUnlocks(ids) {
    for (const id of ids) {
      const c = characterById(id);
      const perk = this.perkLine(id);
      await this.modal({
        title: "New trainer unlocked!",
        variant: "unlock-modal",
        body: `<div class="unlock-card"><img src="${c.front}" alt=""><b>${c.name}</b><p class="unlocked-how"><em>How you unlocked them:</em> ${unlockText((this.ctx.rules.characterUnlocks ?? {})[id])}</p>${perk ? `<p>${perk.replace(/<\/?small>/g, "")}</p>` : ""}<p class="empty-note">Pick them on the New run screen.</p></div>`,
        cancel: "Nice!",
      });
    }
  }

  renderOver() {
    this.showHub();
    const run = this.run;
    const tpLine = this.awardTrainerPoints();
    this.hub.className = "hub end-screen";
    this.hub.innerHTML = `
      <div class="big">Run over</div>
      <p>${run.lastBattle?.forfeited ? `You gave up at ${Run.isGauntlet(run) ? `chapter ${run.chapter + 1}, battle ${run.lastBattle.order - 8} of 6` : `battle #${run.lastBattle.order} of 14`}.` : `Defeated by ${run.lastBattle?.opponent} at ${Run.isGauntlet(run) ? `chapter ${run.chapter + 1}, battle ${(run.lastBattle?.order ?? 9) - 8} of 6` : `battle #${run.lastBattle?.order} of 14`}.`}</p>
      ${tpLine}
      <section class="card-panel"><h3>Fallen this run</h3>
        <div class="fallen-list">${run.fallen.map((f) => `<div class="mon"><img src="${this.sprite(f)}" alt="">${f.name}<small>Lv ${f.level} · #${f.order}</small></div>`).join("")}</div>
      </section>
      <div class="row-buttons"><button class="btn primary" data-act="new">New run</button><button class="btn" data-act="upgrades">Skill Tree</button><button class="btn" data-act="title">Title</button></div>`;
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
      region: Run.regionOf(run, this.ctx),
      rival: run.rival.name,
      team: run.team.map((m) => ({ species: m.species, shiny: m.shiny, level: m.level, ability: m.ability, item: m.item, moves: m.moves })),
      fallen: run.fallen.length,
      // The run rules it was won with (Fixed Six, modes, Mono type), so challenges can be checked again later
      rules: { ...(["evil", "mixed", "gauntlet"].includes(run.settings.path) ? { path: run.settings.path } : {}), ...(run.settings.fixedSix ? { fixedSix: true } : {}), ...(Object.keys(run.settings.modes ?? {}).length ? { modes: run.settings.modes } : {}), ...(run.settings.monoType ? { monoType: run.settings.monoType } : {}) },
      // Every Pokémon that fell on the way, for the Hall of Fame (older entries only have the number)
      fallenMons: run.fallen.map((f) => ({ species: f.species, name: f.name, level: f.level, order: f.order, opponent: f.opponent })),
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
      ${this.fallenMemorial(entry.fallenMons)}
      <div class="row-buttons"><button class="btn primary" data-act="new">New run</button><button class="btn" data-act="upgrades">Skill Tree</button><button class="btn" data-act="hof">Hall of Fame</button></div>`;
    this.hub.onclick = (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "new") this.renderSetup();
      if (act === "hof") this.renderHallOfFame();
      if (act === "upgrades") this.renderUpgrades();
    };
  }

  // The Pokémon that fell during a run, shown in grey under the team in the Hall of Fame
  fallenMemorial(list) {
    if (!list?.length) return "";
    return `<h4 class="fallen-heading">In memory of ${list.length} fallen Pokémon</h4>
      <div class="fallen-list memorial">${list.map((f) => `<div class="mon" title="${f.name} fell against ${f.opponent ?? "an opponent"} (battle #${f.order})"><img src="${this.sprite(f)}" alt="">${f.name}<small>Lv ${f.level} · #${f.order}</small></div>`).join("")}</div>`;
  }

  renderHallOfFame() {
    this.trackView("hof");
    this.showHub();
    const hof = store.get(HOF_KEY) ?? [];
    this.hub.className = "hub framed";
    this.hub.innerHTML = `
      <div class="offer-head"><h1>Hall of Fame</h1><button class="btn" data-act="title">◀ Title</button></div>
      ${hof.map((e) => `
        <section class="card-panel hof-entry">
          <h3>${e.date} · Gen ${e.gen} ${e.region} · Rival ${e.rival} · ${e.fallen} fallen</h3>
          <div class="hof-team">${e.team.map((m) => `<div class="mon"><img src="${this.sprite(m)}" alt="">${this.ctx.data.pokemonByKey[m.species].name}<small>Lv ${m.level}</small></div>`).join("")}</div>
          ${this.fallenMemorial(e.fallenMons)}
        </section>`).join("") || `<div class="empty-note hof-empty"><b>No champions yet.</b><p>Beat the Elite Four, the Champion and your Rival and your team is saved here.</p></div>`}`;
    this.hub.onclick = (e) => {
      if (e.target.closest("[data-act]")?.dataset.act === "title") this.start();
    };
  }
}
