// =====================================================
// TITLE BANNER
// -----------------------------------------------------
// A looping mini battle scene on the title screen: random
// fully evolved Pokémon, random HP, a battle message and
// sometimes weather. Built from the real battle screen's
// styles, so it always matches the game. New scene every
// few seconds with a crossfade.
// =====================================================

import { alignSprite, hovers } from "./sprite-align.js";
import { TERRAINS } from "./terrain.js";

const SLIDE_MS = 5000;
const WEATHER = ["rain", "sun", "sand", "hail"];
const MESSAGES = [
  (a, move) => `${a} used ${move}!`,
  (a, move) => `${a} used ${move}! It's super effective!`,
  (a, move) => `${a} used ${move}! A critical hit!`,
  (a) => `Go! ${a}!`,
];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

// Fully evolved, non-legendary Pokémon from all gens
export function bannerPool(data) {
  return data.pokemon.filter((p) => !p.isLegendary && !p.isMythical && !p.isBaby
    && p.bst >= 400 && !data.pokemon.some((q) => q.evolvesFrom === p.key));
}

export function alignScene(root, data) {
  for (const img of root.querySelectorAll(".sprite")) {
    alignSprite(img, { hover: hovers(data.pokemonByKey[img.dataset.species]) });
  }
  for (const img of root.querySelectorAll(".trainer-intro img, .player-trainer")) alignSprite(img);
}

// All trainers from the leader files: { title, name, sprites: [url] }
export function bannerTrainers(leaders) {
  const out = [];
  for (const file of Object.values(leaders ?? {})) {
    for (const o of file.opponents) {
      if (o.id === "rival") {
        for (const r of o.options) out.push({ title: "Rival", name: r.name, sprites: [`images/trainers/${r.id}.png`] });
      } else {
        const ids = o.id === "tate-and-liza" ? ["tate", "liza"] : [o.id];
        out.push({ title: o.title, name: o.name, sprites: ids.map((id) => `images/trainers/${id}.png`) });
      }
    }
  }
  return out;
}

// playerBack(): url of the player's character back sprite (shown in trainer scenes)
export function startTitleBanner(container, data, leaders = null, playerBack = null) {
  const pool = bannerPool(data);
  const trainers = bannerTrainers(leaders);
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  container.innerHTML = `<div class="banner-frame"><div class="banner-slide"></div><div class="banner-slide"></div></div>`;
  const slides = [...container.querySelectorAll(".banner-slide")];
  let current = 0;

  const show = () => {
    const slide = slides[current];
    // About a third of the scenes: a trainer stepping up to battle
    const trainer = trainers.length && Math.random() < 0.35 ? pick(trainers) : null;
    slide.innerHTML = sceneHtml(pool, data, { trainer, playerBack: playerBack?.() });
    alignScene(slide, data);
    slides.forEach((s, i) => s.classList.toggle("on", i === current));
    current = 1 - current;
  };

  show();
  const timer = setInterval(() => {
    // Stop when the title screen is gone
    if (!container.isConnected) { clearInterval(timer); return; }
    if (document.documentElement.classList.contains("dev-freeze")) return; // debug panel: Freeze
    show();
  }, reduceMotion ? SLIDE_MS * 2 : SLIDE_MS);
}

// One scene. opts.terrain / opts.weather force a look (used by tools/scene-preview.html).
// opts.trainer: show that trainer on the foe platform instead of two foe Pokémon.
export function sceneHtml(pool, data, opts = {}) {
  // opts.mons: four fixed Pokémon (player 0, player 1, foe 0, foe 1) and no randomness, for side-by-side previews
  const fixed = !!opts.mons;
  const mons = opts.mons ?? Array.from({ length: 4 }, () => pick(pool));
  const level = () => (fixed ? 50 : 30 + Math.floor(Math.random() * 40));
  const hpBox = (p, side, slot) => {
    const pct = fixed ? 0.75 : 0.15 + Math.random() * 0.85;
    const maxHp = Math.floor(p.baseStats.hp * 2 * 0.6 + 60);
    const hp = Math.max(1, Math.round(maxHp * pct));
    const color = pct <= 0.2 ? "red" : pct <= 0.5 ? "yellow" : "";
    const gender = fixed || p.genderRate === -1 ? "" : Math.random() < p.genderRate / 8
      ? `<span class="gender F">♀</span>` : `<span class="gender M">♂</span>`;
    return `<div class="hpbox ${side} s${slot} visible">
      <div class="row"><span class="name">${p.name}${gender}</span><span class="level">Lv${level()}</span></div>
      <div class="bar-row"><span class="status"></span><span class="hp-label">HP</span>
        <div class="hpbar"><i class="${color}" style="width:${pct * 100}%"></i></div></div>
      <div class="hp-numbers">${hp}/${maxHp}</div>
    </div>`;
  };
  const shiny = () => !fixed && Math.random() < 1 / 32;
  const sprite = (p, side, slot) => {
    const s = p.sprites;
    const src = side === "player" ? (shiny() ? s.backShiny : s.back) : (shiny() ? s.frontShiny : s.front);
    return `<img class="sprite ${side} s${slot} visible enter" src="${src}" data-species="${p.key}" alt="">`;
  };

  // A damaging level-up move of the attacker for the message
  const attacker = mons[Math.floor(Math.random() * 2)];
  const moves = attacker.learnset.levelUp.map(([, m]) => data.moves[m]).filter((m) => m && m.power >= 60);
  const move = moves.length ? pick(moves).name : "Tackle";
  const text = fixed ? `Go! ${attacker.name}!` : pick(MESSAGES)(attacker.name, move);
  const weather = opts.weather ?? (!fixed && Math.random() < 0.35 ? pick(WEATHER) : "");
  const terrain = opts.terrain ?? (fixed ? "normal" : pick(TERRAINS));
  const balls = (n, out = 0) => Array.from({ length: n }, (_, i) =>
    `<img src="images/ui/ball.png" alt="" class="${i >= n - out ? "out" : ""}">`).join("");

  if (opts.trainer) {
    const t = opts.trainer;
    const size = 2 + Math.floor(Math.random() * 5);
    return `<div class="scene" data-weather="" data-terrain="${terrain}">
      <div class="weather-layer"></div>
      <div class="platform platform-foe"></div>
      <div class="platform platform-player"></div>
      <div class="trainer-intro still">${t.sprites.map((src) => `<img src="${src}" alt="">`).join("")}</div>
      ${opts.playerBack ? `<img class="player-trainer player" src="${opts.playerBack}" alt="">`
        : `${sprite(mons[1], "player", 1)}${sprite(mons[0], "player", 0)}${hpBox(mons[0], "player", 0)}${hpBox(mons[1], "player", 1)}`}
      <div class="party-bar foe">${balls(size)}</div>
      <div class="party-bar player">${balls(2 + Math.floor(Math.random() * 5))}</div>
      <div class="textbox waiting"><p>${t.title} ${t.name} would like to battle!</p><span class="advance" aria-hidden="true">▼</span></div>
    </div>`;
  }

  return `<div class="scene" data-weather="${weather}" data-terrain="${terrain}">
    <div class="weather-layer"></div>
    <div class="platform platform-foe"></div>
    <div class="platform platform-player"></div>
    ${sprite(mons[3], "foe", 1)}${sprite(mons[2], "foe", 0)}
    ${sprite(mons[1], "player", 1)}${sprite(mons[0], "player", 0)}
    ${hpBox(mons[2], "foe", 0)}${hpBox(mons[3], "foe", 1)}
    ${hpBox(mons[0], "player", 0)}${hpBox(mons[1], "player", 1)}
    <div class="textbox waiting"><p>${text}</p><span class="advance" aria-hidden="true">▼</span></div>
  </div>`;
}
