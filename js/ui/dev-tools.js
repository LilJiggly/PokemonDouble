// =====================================================
// DEBUG PANEL (press L)
// -----------------------------------------------------
// For working on the look of the game:
//  • Live CSS: when css/styles.css changes, the new styles are
//    swapped in without reloading the page.
//  • Stay on this screen: after any reload (Live Server, F5) you
//    come back to the same screen and scroll position.
//  • Freeze: pauses animations and the title banner.
//  • Screens: jump to any screen. These are previews built from a
//    fixed test run: they never touch your real save, Trainer
//    Points or Hall of Fame.
// Hidden until you press L (not while typing in a field).
// =====================================================

import * as Run from "../game/run.js";
import { loadMeta } from "../game/meta.js";

const OPTS_KEY = "pd.dev.opts";
const VIEW_KEY = "pd.dev.view";
const SCROLL_KEY = "pd.dev.scroll";
const OPEN_KEY = "pd.dev.open";

const read = (storage, key) => { try { return storage.getItem(key); } catch { return null; } };
const write = (storage, key, value) => { try { storage.setItem(key, value); } catch { /* ignore */ } };

// [id, label] per group
const MENUS = [["title", "Title"], ["setup", "New run"], ["upgrades", "Upgrades"], ["hof", "Hall of Fame"]];
const RUN_SCREENS = [
  ["draft", "Draft"], ["starter-items", "Starter items"], ["hub", "Hub"], ["hub-grid", "Hub (grid)"],
  ["details", "Details window"], ["recruit", "Recruit"], ["items", "Item pick"], ["over", "Game over"], ["won", "Hall of Fame win"],
];
const BATTLE_SCREENS = [
  ["battle", "Intro"], ["battle-commands", "Commands"], ["battle-moves", "Moves"], ["battle-targets", "Targets"],
  ["battle-party", "Pokémon"], ["battle-summary", "Switch-in summary"],
];

export class DevTools {
  constructor(ui, ctx) {
    this.ui = ui;
    this.ctx = ctx;
    this.opts = { live: true, stay: true, freeze: false, ...JSON.parse(read(localStorage, OPTS_KEY) ?? "{}") };
    this.enabled = read(localStorage, OPTS_KEY) !== null; // the panel was opened before
    this.cssText = null;
    window.addEventListener("keydown", (e) => this.onKey(e));
    window.addEventListener("scroll", () => this.saveScroll(), { passive: true });
  }

  // Start the game: back to the remembered screen, or the normal start
  async boot() {
    if (this.enabled) {
      this.applyFreeze();
      if (this.opts.live) this.startLiveCss();
      if (read(sessionStorage, OPEN_KEY) === "1") this.openPanel();
    }
    const view = this.enabled && this.opts.stay ? read(sessionStorage, VIEW_KEY) : null;
    if (!view) { this.ui.start(); return; }
    if (view.startsWith("preview:")) await this.show(view.slice(8));
    else if (view === "run") { if (!this.ui.resumeSaved()) this.ui.start(); }
    else this.ui.openView(view);
    this.restoreScroll();
  }

  // ---------- hotkey and panel ----------

  onKey(e) {
    if (e.key.toLowerCase() !== "l" || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
    e.preventDefault();
    if (this.panel) this.closePanel(); else this.openPanel();
  }

  openPanel() {
    if (this.panel) return;
    // Opening the panel turns the debug features on (and remembers that)
    if (!this.enabled) {
      this.enabled = true;
      this.saveOpts();
      this.applyFreeze();
      if (this.opts.live) this.startLiveCss();
    }
    write(sessionStorage, OPEN_KEY, "1");
    const panel = document.createElement("aside");
    panel.id = "dev-panel";
    panel.setAttribute("aria-label", "Debug panel");
    panel.innerHTML = `
      <header><b>Debug</b> <small>press L to hide</small><button data-dev="close" aria-label="Close">×</button></header>
      <label><input type="checkbox" data-opt="live" ${this.opts.live ? "checked" : ""}> Live CSS <small data-dev="css-status"></small></label>
      <label><input type="checkbox" data-opt="stay" ${this.opts.stay ? "checked" : ""}> Stay on this screen after a reload</label>
      <label><input type="checkbox" data-opt="freeze" ${this.opts.freeze ? "checked" : ""}> Freeze animations</label>
      <section><h4>Screens <small>(previews, nothing is saved)</small></h4>
        <div class="dev-group"><span>Menus</span>${MENUS.map(([id, label]) => `<button data-screen="${id}">${label}</button>`).join("")}</div>
        <div class="dev-group"><span>Run</span>${RUN_SCREENS.map(([id, label]) => `<button data-screen="${id}">${label}</button>`).join("")}</div>
        <div class="dev-group"><span>Battle</span>${BATTLE_SCREENS.map(([id, label]) => `<button data-screen="${id}">${label}</button>`).join("")}</div>
        <button class="dev-wide" data-screen="real">◀ Back to my real game</button>
      </section>`;
    panel.addEventListener("click", (e) => this.onPanelClick(e));
    panel.addEventListener("change", (e) => this.onPanelChange(e));
    document.body.appendChild(panel);
    this.panel = panel;
    this.updateStatus();
    this.markCurrent();
  }

  closePanel() {
    this.panel?.remove();
    this.panel = null;
    write(sessionStorage, OPEN_KEY, "0");
  }

  onPanelClick(e) {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.dataset.dev === "close") this.closePanel();
    if (btn.dataset.screen) this.show(btn.dataset.screen);
  }

  onPanelChange(e) {
    const opt = e.target.dataset.opt;
    if (!opt) return;
    this.opts[opt] = e.target.checked;
    this.saveOpts();
    if (opt === "freeze") this.applyFreeze();
    if (opt === "live") { if (this.opts.live) this.startLiveCss(); else this.stopLiveCss(); }
    if (opt === "stay" && !this.opts.stay) { try { sessionStorage.removeItem(VIEW_KEY); } catch { /* ignore */ } }
  }

  saveOpts() { write(localStorage, OPTS_KEY, JSON.stringify(this.opts)); }

  markCurrent() {
    if (!this.panel) return;
    const view = read(sessionStorage, VIEW_KEY) ?? "";
    const current = view.startsWith("preview:") ? view.slice(8) : null;
    for (const b of this.panel.querySelectorAll("[data-screen]")) b.classList.toggle("on", b.dataset.screen === current);
  }

  // ---------- freeze ----------

  applyFreeze() {
    document.documentElement.classList.toggle("dev-freeze", !!(this.enabled && this.opts.freeze));
  }

  // ---------- live CSS ----------

  startLiveCss() {
    this.stopLiveCss();
    this.cssTimer = setInterval(() => this.pollCss(), 800);
    this.pollCss();
  }

  stopLiveCss() {
    clearInterval(this.cssTimer);
    this.cssTimer = null;
    this.updateStatus();
  }

  async pollCss() {
    const link = document.querySelector('link[rel="stylesheet"][href*="styles.css"]');
    if (!link) return;
    const base = link.getAttribute("href").split("?")[0];
    try {
      const text = await (await fetch(`${base}?t=${Date.now()}`, { cache: "no-store" })).text();
      if (this.cssText !== null && text !== this.cssText) {
        // Load the new sheet next to the old one and remove the old one when it's ready (no flash)
        const next = link.cloneNode();
        next.href = `${base}?v=${Date.now()}`;
        next.onload = () => link.remove();
        link.after(next);
        this.lastCssUpdate = new Date();
      }
      this.cssText = text;
    } catch { /* server restarting: try again next time */ }
    this.updateStatus();
  }

  updateStatus() {
    const el = this.panel?.querySelector("[data-dev=css-status]");
    if (!el) return;
    el.textContent = !this.opts.live ? "off" : this.lastCssUpdate ? `updated ${this.lastCssUpdate.toLocaleTimeString()}` : "watching…";
  }

  // ---------- scroll ----------

  saveScroll() {
    if (!this.enabled) return;
    clearTimeout(this.scrollTimer);
    this.scrollTimer = setTimeout(() => write(sessionStorage, SCROLL_KEY, String(window.scrollY)), 120);
  }

  restoreScroll() {
    const y = Number(read(sessionStorage, SCROLL_KEY) ?? 0);
    if (!y) return;
    for (const wait of [60, 400]) setTimeout(() => window.scrollTo(0, y), wait);
  }

  // ---------- screens ----------

  // A fixed test run (same seed every time), advanced to the stage a screen needs
  buildRun(stage) {
    const { ctx } = this;
    const run = Run.newRun(ctx, { gen: 1, pools: [1, 2, 3, 4, 5], seed: 1234, character: loadMeta().character });
    if (stage === "draft") return run;
    for (let i = 0; i < run.offer.options.length && run.offer.picksLeft > 0; i++) Run.pickRecruit(run, ctx, i);
    if (stage === "starter-items") return run;
    for (let i = 0; run.screen === "items" && i < run.offer.options.length; i++) Run.pickItem(run, ctx, i);
    if (run.screen === "items") Run.skipOffer(run, ctx);
    run.money = 6000;
    if (["hub", "hub-grid", "details"].includes(stage) || stage.startsWith("battle")) return run;

    // After winning battle 1: rewards, next opponent, recruit offer
    const tm = ctx.tms?.[0]?.move;
    if (tm) run.tms.push(tm);
    run.lastBattle = { won: true, order: 1, opponent: run.opponent.name, fallen: [], rewards: { money: 225, flawless: true, tm } };
    run.nextOpponent = Run.chooseOpponent(run, ctx, 2);
    const row = Run.rowFor(ctx, 1);
    run.offer = Run.makeRecruitOffer(run, ctx, { count: row.recruitOptions, picks: row.recruitPicks, odds: row.odds, level: Run.playerLevelFor(ctx, 2) });
    run.screen = "recruit";
    if (stage === "recruit") return run;
    if (stage === "items") { Run.pickRecruit(run, ctx, 0); return run; }

    // The end screens
    run.lastBattle = { won: false, order: 3, opponent: "Lt. Surge", fallen: [] };
    run.fallen = run.team.map((m) => ({ species: m.species, name: m.nickname ?? m.species, level: m.level, order: 3, opponent: "Lt. Surge" }));
    run.screen = stage === "won" ? "won" : "over";
    run.order = stage === "won" ? 14 : 3;
    return run;
  }

  // Wait for something on screen, clicking through battle text meanwhile
  async until(find, { advance = true, timeout = 25000 } = {}) {
    const start = Date.now();
    const token = this.token;
    while (Date.now() - start < timeout && token === this.token) { // a newer screen cancels this wait
      const el = find();
      if (el) return el;
      if (advance) document.getElementById("textbox")?.click();
      await new Promise((r) => setTimeout(r, 250));
    }
    return null;
  }

  async show(stage) {
    const { ui } = this;
    if (stage === "real") {
      ui.preview = false;
      ui.teamView = read(localStorage, "pd.teamView") === "detailed" ? "detailed" : "grid"; // the grid is the default
      write(sessionStorage, VIEW_KEY, "run");
      if (!ui.resumeSaved()) ui.start();
      this.markCurrent();
      return;
    }
    if (MENUS.some(([id]) => id === stage)) {
      this.token = (this.token ?? 0) + 1;
      ui.preview = false; // menus are real screens: nothing here changes a run
      ui.openView(stage);
      write(sessionStorage, VIEW_KEY, stage);
      this.markCurrent();
      return;
    }

    this.token = (this.token ?? 0) + 1;
    ui.preview = true;
    write(sessionStorage, VIEW_KEY, `preview:${stage}`);
    ui.teamView = stage === "hub-grid" || stage === "details" ? "grid" : "detailed";
    ui.run = this.buildRun(stage);
    if (stage.startsWith("battle")) await this.showBattle(stage);
    else {
      ui.render();
      if (stage === "details") ui.detailsDialog(ui.run.team[0].uid);
    }
    this.markCurrent();
    this.restoreScroll();
  }

  async showBattle(stage) {
    const { ui, ctx } = this;
    const token = this.token;
    const result = Run.startBattle(ui.run, ctx);
    ui.playBattle(result.battle, { initialEvents: result.events });
    if (stage === "battle") return;
    const click = (sel) => document.querySelector(sel)?.click();
    if (!(await this.until(() => document.querySelector(".cmd-grid"))) || token !== this.token) return;
    if (stage === "battle-commands") return;
    if (stage === "battle-party" || stage === "battle-summary") {
      click(".cmd-grid .party");
      if (stage === "battle-summary") {
        const bench = await this.until(() => [...document.querySelectorAll(".party-card:not(:disabled):not(.unavailable)")].at(-1), { advance: false });
        bench?.click();
      }
      return;
    }
    click(".cmd-grid .fight");
    if (stage === "battle-targets") {
      // The first move that needs a target (single-target moves ask who to hit)
      const battle = ui.battleScreen?.battle;
      const slot = battle?.getRequest(0).slots.find((sl) => sl.moves);
      const pick = slot?.moves.find((m) => !m.disabled && ["selected-pokemon", "selected-pokemon-me-first"].includes(m.target));
      if (pick) document.querySelector(`.move-btn[data-move="${pick.index}"]`)?.click();
    }
  }
}
