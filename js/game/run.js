// =====================================================
// THE RUN
// -----------------------------------------------------
// All run logic, no screen code. The whole run is one
// JSON-safe object (`run`), saved after every action.
// Random rolls use the run's own seeded RNG, so offers
// don't change when the page is reloaded.
//
// Screens (run.screen):
//   draft → hub → battle → recruit → items → hub → …
//   over (lost) / won (beat the Final Rival)
// =====================================================

import { nextRandom } from "../engine/rng.js";
import { Battle } from "../engine/battle.js";
import { createRecruit, levelUpMovesAt } from "./recruit.js";
import { emptyRunStats, STARTER_LINES } from "./progress.js";
import { itemOddsFor, tmMaxPowerFor, TIERS } from "./rules.js";
import { ITEMS, pocketOf } from "./item-catalog.js";
import { hasPerk as badgeHasPerk, perkParam, battleBonus } from "./badges.js";

// Held items that trigger once per battle and are back afterwards
const RESTORED_AFTER_BATTLE = new Set(["focus-sash"]);
export const FINAL_ORDER = 14;
export const REPLACEMENT_PICK_CAP = 2;
const NATURES = ["hardy", "adamant", "modest", "jolly", "timid", "bold", "impish", "calm", "careful", "brave", "quiet", "naive", "hasty"];

// ctx = { data, dex, rules, tms, leaders: { 1: gen1Json, … } }

// Is this gym-badge perk equipped? (§3k)
export const hasPerk = (run, ctx, id) => badgeHasPerk(run, ctx.rules, id);
// The number of a run badge effect (0 when the badge isn't worn; it grows with the badge's strength)
const perkN = (run, ctx, id, none = 0) => perkParam(run, ctx.rules, id, none);

// TMs that do nothing in this game are never given (§3g)
const TM_EXCLUDED = new Set(["flash", "natural-gift", "fling", "snatch", "recycle"]);
// Bigger Bag upgrade kits (§3i)
const BAG_KITS = [{}, { "super-potion": 2 }, { "super-potion": 2, "sitrus-berry": 1, "full-heal": 1 }];

const rand = (run) => () => nextRandom(run);
const pickOne = (run, list) => list[Math.floor(nextRandom(run) * list.length)];

function rollTier(run, odds, available) {
  const entries = TIERS.filter((t) => available.has(t) && (odds[t] ?? 0) > 0).map((t) => [t, odds[t]]);
  if (!entries.length) return [...available][0];
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let r = nextRandom(run) * total;
  for (const [t, w] of entries) {
    if ((r -= w) < 0) return t;
  }
  return entries[entries.length - 1][0];
}

// ===============================
// NEW RUN & DRAFT
// ===============================

// perks: Trainer upgrades from meta progression (see meta.js perksFromMeta)
export function newRun(ctx, { gen, pools, seed = Math.floor(Math.random() * 2 ** 32), perks = {}, character = "lucas", badges = [], badgeLinks = [], badgeOff = [] }) {
  const run = {
    version: 1,
    character,
    rng: seed >>> 0,
    settings: { gen, pools: [...pools].sort() },
    perks: { scout: 0, dice: 0, allowance: 0, bag: 0, gift: 0, hidden: 0, shiny: 0, ...perks },
    money: 0,
    tms: [],
    shop: null,
    startedOn: new Date().toISOString().slice(0, 10),
    order: 0,
    screen: "draft",
    team: [],
    bag: {},
    nextUid: 1,
    fallen: [],
    pendingMoves: [],
    stats: emptyRunStats(), // counters for the character unlocks (progress.js)
    badges: { slots: Array.from({ length: 8 }, (_, i) => badges[i] ?? null), links: badgeLinks, off: badgeOff.filter((id) => badges.includes(id)), equipped: badges.filter(Boolean), gen }, // the badge case, frozen for this run (§3k)
    offer: null,
    opponent: null,
    battle: null,
    rival: null,
    messages: [],
  };
  for (const [id, count] of Object.entries(ctx.rules.startingBag ?? {})) {
    if (ITEMS[id]) addToBag(run, id, count);
  }
  for (const [id, count] of Object.entries(BAG_KITS[Math.min(run.perks.bag, 2)])) addToBag(run, id, count);
  run.money = (ctx.rules.money?.start ?? 500) + run.perks.allowance * 500;
  const rivalEntry = leaderFor(run, ctx, FINAL_ORDER);
  run.rival = pickOne(run, rivalEntry.options);
  run.nextOpponent = chooseOpponent(run, ctx, 1);

  const row = ctx.rules.progression.find((r) => r.order === 0);
  const level = playerLevelFor(ctx, 1);
  run.offer = makeRecruitOffer(run, ctx, { count: row.recruitOptions + run.perks.scout, picks: row.recruitPicks, odds: row.odds, level, starter: true });
  applyCharacterPerk(run, ctx);
  return run;
}

// The perk of the chosen trainer (the Effect column of §3j). Effects, separated by ";":
//   money:300  bag:oran-berry:2  item-pick:1  starter-reroll:1  starter:kanto  first-recruit:ralts
function applyCharacterPerk(run, ctx) {
  const effect = ctx.rules.characterUnlocks?.[run.character]?.effect;
  if (!effect || effect === "—") return;
  for (const part of effect.split(";").map((x) => x.trim())) {
    const [kind, a, b] = part.split(":");
    if (kind === "money") run.money += Number(a);
    else if (kind === "bag" && ITEMS[a]) addToBag(run, a, Number(b ?? 1));
    else if (kind === "item-pick") run.perks.gift += Number(a);
    else if (kind === "starter-reroll") run.offer.rerollsLeft += Number(a);
    else if (kind === "first-recruit") guaranteeOption(run, ctx, a);
    else if (kind === "starter") {
      const pools = new Set(run.settings.pools);
      const lines = (STARTER_LINES[a] ?? []).filter((k) => ctx.data.pokemonByKey[k] && pools.has(ctx.data.pokemonByKey[k].gen));
      const roots = new Set(lines);
      if (lines.length && !run.offer.options.some((o) => roots.has(ctx.dex.lineOf[o.spec.species]))) guaranteeOption(run, ctx, pickOne(run, lines));
    }
  }
}

// Make sure the offer has a card of this species' line: it replaces the last card
function guaranteeOption(run, ctx, speciesKey) {
  const offer = run.offer;
  const p = ctx.data.pokemonByKey[speciesKey];
  if (!offer || !p || !run.settings.pools.includes(p.gen)) return;
  const root = ctx.dex.lineOf[speciesKey];
  if (offer.options.some((o) => ctx.dex.lineOf[o.spec.species] === root)) return;
  const spec = createRecruit(ctx.data, speciesKey, offer.level, rand(run), recruitChances(run, ctx));
  spec.abilitySlot = abilitySlotOf(ctx, spec);
  const card = { spec, tier: ctx.dex.tier(root), taken: false };
  if (offer.options.length) offer.options[offer.options.length - 1] = card;
  else offer.options.push(card);
}

// Opponent's level for a battle
export function levelFor(ctx, order) {
  return ctx.rules.progression.find((r) => r.order === order)?.level ?? 50;
}

// The player's level for a battle: enemy level + Level bonus (§3a)
export function playerLevelFor(ctx, order) {
  const row = ctx.rules.progression.find((r) => r.order === order);
  return (row?.level ?? 50) + (row?.levelBonus ?? 0);
}

export function rowFor(ctx, order) {
  return ctx.rules.progression.find((r) => r.order === order);
}

export function leaderFor(run, ctx, order) {
  return ctx.leaders[run.settings.gen].opponents.find((o) => o.order === order);
}

// ===============================
// RECRUIT OFFERS
// ===============================

function teamLines(run, ctx) {
  return new Set(run.team.map((m) => ctx.dex.lineOf[m.species]));
}

// Candidate lines grouped by tier
function candidateLines(run, ctx, { level, starter }) {
  const { dex, data } = ctx;
  const pools = new Set(run.settings.pools);
  const inPool = (k) => pools.has(data.pokemonByKey[k].gen);
  const taken = teamLines(run, ctx);
  const byTier = {};
  for (const root of Object.keys(dex.lines)) {
    if (taken.has(root)) continue;
    let species;
    if (starter) {
      const first = dex.firstStage(root);
      if (!inPool(first) || !dex.isLegalAt(first, level)) continue;
      const p = data.pokemonByKey[first];
      if (p.isLegendary || p.isMythical) continue;
      // Pokémon that don't evolve only if they're Common or Uncommon (§3a starter rule)
      if (dex.isSingleStage(first) && dex.tierRank(dex.tier(first)) > dex.tierRank("uncommon")) continue;
      species = [first];
    } else {
      species = dex.highestLegalStages(root, level, inPool);
      if (!species.length) continue;
    }
    const tier = dex.tier(root);
    (byTier[tier] ??= []).push({ root, species });
  }
  return byTier;
}

export function makeRecruitOffer(run, ctx, { count, picks, odds, level, starter = false }) {
  const byTier = candidateLines(run, ctx, { level, starter });
  const options = [];
  const usedRoots = new Set();
  for (let i = 0; i < count; i++) {
    const available = new Set(TIERS.filter((t) => byTier[t]?.some((c) => !usedRoots.has(c.root))));
    if (!available.size) break;
    const tier = rollTier(run, odds, available);
    const choices = byTier[tier].filter((c) => !usedRoots.has(c.root));
    const pick = pickOne(run, choices);
    usedRoots.add(pick.root);
    const species = pickOne(run, pick.species);
    const spec = createRecruit(ctx.data, species, level, rand(run), recruitChances(run, ctx));
    spec.abilitySlot = abilitySlotOf(ctx, spec);
    options.push({ spec, tier, taken: false });
  }
  return { kind: "recruit", starter, options, picks, picksLeft: Math.min(picks, options.length), level, odds,
    rerollsLeft: 1 + (run.perks?.dice ?? 0) + perkN(run, ctx, "reroll") };
}

function recruitChances(run, ctx) {
  return {
    hidden: Math.min(0.6, (run.perks?.hidden ? 0.2 : 0.1) + perkN(run, ctx, "hidden")),
    shiny: run.perks?.shiny ? 1 / 128 : 1 / 512,
  };
}

// One free reroll per recruit offer: every card that wasn't picked is replaced
export function rerollOffer(run, ctx) {
  const offer = run.offer;
  // Older saves used a "rerolled" flag instead of a counter
  if (offer && offer.rerollsLeft === undefined) offer.rerollsLeft = offer.rerolled ? 0 : 1;
  if (offer?.kind !== "recruit" || offer.rerollsLeft <= 0 || offer.picksLeft <= 0) return { ok: false };
  const kept = offer.options.filter((o) => o.taken);
  const count = offer.options.length - kept.length;
  // Offers saved before rerolls existed don't store their odds: use §3a
  const odds = offer.odds ?? rowFor(ctx, offer.starter ? 0 : run.order).odds;
  const fresh = makeRecruitOffer(run, ctx, { count, picks: offer.picks, odds, level: offer.level, starter: offer.starter });
  offer.options = [...kept, ...fresh.options];
  offer.rerollsLeft -= 1;
  return { ok: true };
}

function abilitySlotOf(ctx, mon) {
  const p = ctx.data.pokemonByKey[mon.species];
  if (p.abilities.hidden === mon.ability) return "H";
  return String(Math.max(0, p.abilities.normal.indexOf(mon.ability)));
}

// Take an offered Pokémon. replaceUid: team member to release when the team is full.
export function pickRecruit(run, ctx, optionIndex, replaceUid = null) {
  const offer = run.offer;
  const option = offer?.options[optionIndex];
  if (offer?.kind !== "recruit" || !option || option.taken || offer.picksLeft <= 0) return { ok: false, reason: "Can't pick that." };
  if (run.team.length >= 6) {
    const idx = run.team.findIndex((m) => m.uid === replaceUid);
    if (idx === -1) return { ok: false, reason: "Choose a team member to replace." };
    const [released] = run.team.splice(idx, 1);
    if (released.item) addToBag(run, released.item);
    run.messages.push(`${released.name ?? displayName(ctx, released)} was released.`);
  }
  option.taken = true;
  offer.picksLeft -= 1;
  const mon = { ...structuredClone(option.spec), uid: run.nextUid++ };
  run.team.push(mon);
  noteRecruited(run, ctx, mon.species, offer.starter);
  if (offer.picksLeft <= 0) finishOffer(run, ctx);
  return { ok: true };
}

// Swap badge (§3k): once (twice when boosted) per recruit screen, trade one of your Pokémon for a recruit card without using a pick.
// The recruit takes the released Pokémon's place in the team order.
export function swapForRecruit(run, ctx, optionIndex, uid) {
  const offer = run.offer;
  const option = offer?.options[optionIndex];
  if (offer?.kind !== "recruit" || offer.starter || !option || option.taken || (offer.swapsUsed ?? 0) >= perkN(run, ctx, "swap")) return { ok: false };
  const idx = run.team.findIndex((m) => m.uid === uid);
  if (idx === -1) return { ok: false };
  const [released] = run.team.splice(idx, 1);
  if (released.item) addToBag(run, released.item);
  run.messages.push(`${released.nickname ?? displayName(ctx, released)} was swapped out for a new recruit.`);
  option.taken = true;
  offer.swapsUsed = (offer.swapsUsed ?? 0) + 1;
  run.team.splice(idx, 0, { ...structuredClone(option.spec), uid: run.nextUid++ });
  noteRecruited(run, ctx, option.spec.species, false);
  return { ok: true };
}

// Counters for the character unlocks (progress.js)
function noteRecruited(run, ctx, species, starter) {
  run.stats ??= emptyRunStats();
  if (!run.stats.species.includes(species)) run.stats.species.push(species);
  if (starter) run.stats.picks.push(ctx.dex.lineOf[species] ?? species);
}

export function skipOffer(run, ctx) {
  if (run.offer?.starter && run.offer.picksLeft > 0) return { ok: false, reason: "Pick your starters first." };
  finishOffer(run, ctx);
  return { ok: true };
}

function finishOffer(run, ctx) {
  const offer = run.offer;
  run.offer = null;
  if (offer.kind === "recruit") {
    startItemOffer(run, ctx);
  } else {
    enterHub(run, ctx, run.order + 1);
  }
}

// ===============================
// ITEM OFFERS
// ===============================

function startItemOffer(run, ctx) {
  const row = rowFor(ctx, run.order);
  if (!row?.itemOptions) {
    enterHub(run, ctx, run.order + 1);
    return;
  }
  const odds = itemOddsFor(ctx.rules, run.order);
  const gift = run.order === 0 ? (run.perks?.gift ?? 0) : 0;
  const box = run.order === 0 ? { picks: 0, cards: 0 } : perkN(run, ctx, "gift", { picks: 0, cards: 0 }); // Gift Box badge
  const giftBadge = box.picks;
  const giftCards = gift + box.cards;
  const scout = run.order === 0 ? 0 : perkN(run, ctx, "scout");
  const teamSpecies = new Set(run.team.map((m) => m.species));
  const byTier = {};
  for (const [id, item] of Object.entries(ITEMS)) {
    if (item.species && !item.species.some((s) => teamSpecies.has(s))) continue;
    (byTier[item.tier] ??= []).push(id);
  }
  const options = [];
  const used = new Set();
  for (let i = 0; i < row.itemOptions + giftCards + scout; i++) {
    const available = new Set(Object.keys(byTier).filter((t) => byTier[t].some((id) => !used.has(id))));
    const tier = rollTier(run, odds, available);
    const id = pickOne(run, byTier[tier].filter((x) => !used.has(x)));
    used.add(id);
    options.push({ id, tier, taken: false });
  }
  run.offer = { kind: "item", options, picks: row.itemPicks + gift + giftBadge, picksLeft: row.itemPicks + gift + giftBadge };
  run.screen = "items";
}

export function pickItem(run, ctx, optionIndex) {
  const offer = run.offer;
  const option = offer?.options[optionIndex];
  if (offer?.kind !== "item" || !option || option.taken || offer.picksLeft <= 0) return { ok: false };
  option.taken = true;
  offer.picksLeft -= 1;
  addToBag(run, option.id);
  if (offer.picksLeft <= 0) finishOffer(run, ctx);
  return { ok: true };
}

export function addToBag(run, id, n = 1) {
  run.bag[id] = (run.bag[id] ?? 0) + n;
}

function removeFromBag(run, id, n = 1) {
  run.bag[id] = (run.bag[id] ?? 0) - n;
  if (run.bag[id] <= 0) delete run.bag[id];
}

// ===============================
// HUB (between battles)
// ===============================

export function enterHub(run, ctx, order) {
  run.order = order;
  run.screen = "hub";
  levelTeam(run, ctx, playerLevelFor(ctx, order));
  // The next opponent is usually already known (revealed after the previous win)
  run.opponent = run.nextOpponent?.order === order ? run.nextOpponent : chooseOpponent(run, ctx, order);
  run.nextOpponent = null;
  run.shop = makeShop(run, ctx);
}

// Auto-level the team to the next opponent's level (§2), queueing new moves
function levelTeam(run, ctx, level) {
  for (const mon of run.team) {
    if (mon.level >= level) continue;
    const old = mon.level;
    mon.level = level;
    const p = ctx.data.pokemonByKey[mon.species];
    for (const [lvl, move] of p.learnset.levelUp) {
      if (lvl <= old || lvl > level || mon.moves.includes(move) || !ctx.data.moves[move]) continue;
      // Free slot: learned at once. Full: it waits in the Moves bar's "can learn" list. Either way it is flagged as new until you look at it.
      if (mon.moves.length < 4) {
        mon.moves.push(move);
        run.messages.push(`${displayName(ctx, mon)} learned ${ctx.data.moves[move].name}!`);
      }
      (mon.fresh ??= []).push(move);
    }
  }
}

// replaceIndex: which of the 4 moves to forget, or null to skip learning
export function answerMove(run, ctx, replaceIndex) {
  const q = run.pendingMoves.shift();
  if (!q) return;
  const mon = run.team.find((m) => m.uid === q.uid);
  if (!mon || replaceIndex === null || replaceIndex === undefined) return;
  mon.moves[replaceIndex] = q.move;
}

// The player looked at a new move (hovered it): it is no longer highlighted
export function seeMove(run, uid, move) {
  const mon = run.team.find((m) => m.uid === uid);
  if (mon?.fresh) mon.fresh = mon.fresh.filter((id) => id !== move);
}

// Move Relearner: any level-up move up to the current level
export function relearnableMoves(ctx, mon) {
  const p = ctx.data.pokemonByKey[mon.species];
  const seen = new Set(mon.moves);
  const out = [];
  for (const [lvl, move] of p.learnset.levelUp) {
    if (lvl <= mon.level && !seen.has(move) && ctx.data.moves[move]) {
      seen.add(move);
      out.push(move);
    }
  }
  return out;
}

export function relearnMove(run, ctx, uid, move, replaceIndex) {
  const mon = run.team.find((m) => m.uid === uid);
  if (!mon || !relearnableMoves(ctx, mon).includes(move)) return;
  if (mon.moves.length < 4) mon.moves.push(move);
  else mon.moves[replaceIndex] = move;
}

// Swap two of a Pokémon's moves (drag & drop in the Moves bar)
export function swapMoves(run, uid, i, j) {
  const mon = run.team.find((m) => m.uid === uid);
  if (!mon || i === j || !mon.moves[i] || !mon.moves[j]) return;
  [mon.moves[i], mon.moves[j]] = [mon.moves[j], mon.moves[i]];
}

export function moveTeamMember(run, uid, delta) {
  const i = run.team.findIndex((m) => m.uid === uid);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= run.team.length) return;
  [run.team[i], run.team[j]] = [run.team[j], run.team[i]];
}

// Swap a team member with whoever is in another slot (team slot buttons)
export function swapTeamMember(run, uid, index) {
  const i = run.team.findIndex((m) => m.uid === uid);
  if (i < 0 || index < 0 || index >= run.team.length || i === index) return;
  [run.team[i], run.team[index]] = [run.team[index], run.team[i]];
}

// Move a team member to a new position (drag & drop)
export function moveTeamMemberTo(run, uid, index) {
  const i = run.team.findIndex((m) => m.uid === uid);
  if (i < 0 || index < 0 || index >= run.team.length || i === index) return;
  const [mon] = run.team.splice(i, 1);
  run.team.splice(index, 0, mon);
}

// Move a held item from one Pokémon to another (swaps if the other holds one)
export function moveHeldItem(run, fromUid, toUid) {
  const from = run.team.find((m) => m.uid === fromUid);
  const to = run.team.find((m) => m.uid === toUid);
  if (!from?.item || !to || from === to) return;
  [from.item, to.item] = [to.item, from.item];
}

export function giveItem(run, uid, itemId) {
  const mon = run.team.find((m) => m.uid === uid);
  if (!mon || !(run.bag[itemId] > 0) || ITEMS[itemId]?.kind !== "held") return;
  if (mon.item) addToBag(run, mon.item);
  removeFromBag(run, itemId);
  mon.item = itemId;
  run.stats ??= emptyRunStats();
  run.stats.items += 1;
  if (itemId.endsWith("-berry")) run.stats.berries += 1;
}

export function takeItem(run, uid) {
  const mon = run.team.find((m) => m.uid === uid);
  if (!mon?.item) return;
  addToBag(run, mon.item);
  mon.item = null;
}

export function evolve(run, ctx, uid, to) {
  const mon = run.team.find((m) => m.uid === uid);
  if (!mon) return { ok: false };
  const option = ctx.dex.evolutionOptions(mon, run.bag).find((o) => o.to === to);
  if (!option?.ready) return { ok: false, reason: option?.needs.join(", ") };
  const fromName = displayName(ctx, mon);
  const fromSpecies = mon.species;
  mon.species = to;
  const p = ctx.data.pokemonByKey[to];
  mon.ability = mon.abilitySlot === "H" && p.abilities.hidden ? p.abilities.hidden
    : p.abilities.normal[Number(mon.abilitySlot)] ?? p.abilities.normal[0];
  run.messages.push(`${fromName} evolved into ${p.name}!`);

  // Shedinja: a free bonus when Nincada becomes Ninjask (if there's room)
  if (fromSpecies === "nincada" && to === "ninjask" && run.team.length < 6) {
    const shed = createRecruit(ctx.data, "shedinja", mon.level, rand(run), recruitChances(run, ctx));
    shed.moves = [...mon.moves];
    shed.nature = mon.nature;
    shed.abilitySlot = "0";
    run.team.push({ ...shed, uid: run.nextUid++ });
    run.messages.push("Something appeared in the empty slot: Shedinja joined your team!");
  }
  return { ok: true };
}

// kind: "ability-patch" (other normal ability) or "hidden-ability-patch"
export function usePatch(run, ctx, uid, kind) {
  const mon = run.team.find((m) => m.uid === uid);
  if (!mon || !(run.bag[kind] > 0)) return { ok: false };
  const p = ctx.data.pokemonByKey[mon.species];
  if (kind === "hidden-ability-patch") {
    if (!p.abilities.hidden || mon.ability === p.abilities.hidden) return { ok: false, reason: "No Hidden Ability to switch to." };
    mon.ability = p.abilities.hidden;
    mon.abilitySlot = "H";
  } else {
    const others = p.abilities.normal.filter((a) => a !== mon.ability);
    if (!others.length) return { ok: false, reason: "No other normal Ability." };
    mon.ability = others[0];
    mon.abilitySlot = String(p.abilities.normal.indexOf(others[0]));
  }
  run.bag[kind] -= 1; // patches are used up
  if (run.bag[kind] <= 0) delete run.bag[kind];
  run.messages.push(`${displayName(ctx, mon)}'s Ability became ${ctx.data.abilities[mon.ability]?.name ?? mon.ability}!`);
  return { ok: true };
}

export function displayName(ctx, mon) {
  return mon.nickname ?? ctx.data.pokemonByKey[mon.species].name;
}

// ===============================
// SHOP (§3h)
// ===============================

export function priceOf(ctx, id) {
  return ctx.rules.shopPrices?.[ITEMS[id]?.tier] ?? 500;
}

// Haggler badge: cheaper shop prices
const haggle = (run, ctx, price) => Math.max(1, Math.round(price * (1 - perkN(run, ctx, "haggler"))));

// Deals (§3h): every time the shop restocks, a few items and one TM are on sale
export const SALE = { items: 2, tms: 1, discounts: [20, 25, 30, 40, 50] };

function putOnSale(run, entries, count) {
  const open = entries.filter((e) => !e.sale && e.price > 1);
  for (let i = 0; i < count && open.length; i++) {
    const [e] = open.splice(Math.floor(nextRandom(run) * open.length), 1);
    const pct = SALE.discounts[Math.floor(nextRandom(run) * SALE.discounts.length)];
    e.was = e.price;
    e.sale = pct;
    e.price = Math.max(1, Math.round(e.price * (1 - pct / 100)));
  }
}

function makeShop(run, ctx) {
  const odds = itemOddsFor(ctx.rules, Math.max(1, run.order));
  const teamSpecies = new Set(run.team.map((m) => m.species));
  // Item ids by section, then by tier
  const bySection = {};
  for (const [id, item] of Object.entries(ITEMS)) {
    if (item.species && !item.species.some((s) => teamSpecies.has(s))) continue;
    ((bySection[pocketOf(id)] ??= {})[item.tier] ??= []).push(id);
  }
  // Every section rolls its own items with the item odds (§3d)
  const counts = ctx.rules.shopStock ?? {};
  const stock = [];
  for (const section of ["items", "berries", "medicine", "battle", "key"]) {
    const byTier = bySection[section] ?? {};
    const used = new Set();
    for (let i = 0; i < (counts[section] ?? 0); i++) {
      const available = new Set(Object.keys(byTier).filter((t) => byTier[t].some((id) => !used.has(id))));
      if (!available.size) break;
      const tier = rollTier(run, odds, available);
      const id = pickOne(run, byTier[tier].filter((x) => !used.has(x)));
      used.add(id);
      stock.push({ id, tier, price: haggle(run, ctx, priceOf(ctx, id)), sold: false });
    }
  }
  // TMs you don't own, within the power limit for this battle (§3g)
  const max = tmMaxPowerFor(ctx.rules, Math.max(1, run.order));
  const owned = new Set(run.tms);
  const tmPool = (ctx.tms ?? []).filter((t) => !TM_EXCLUDED.has(t.move) && !owned.has(t.move)
    && (ctx.data.moves[t.move].power ?? 0) <= max);
  const tms = [];
  for (let i = 0; i < (counts.tms ?? 3) && tmPool.length; i++) {
    const [t] = tmPool.splice(Math.floor(nextRandom(run) * tmPool.length), 1);
    tms.push({ move: t.move, price: haggle(run, ctx, tmPrice(ctx, t.move)), sold: false });
  }
  putOnSale(run, stock, SALE.items);
  putOnSale(run, tms, SALE.tms);
  return { stock, tms, rerolls: run.shop?.order === run.order ? run.shop.rerolls : 0, order: run.order };
}

export function tmPrice(ctx, move) {
  const m = ctx.rules.money ?? {};
  const power = ctx.data.moves[move]?.power ?? 0;
  return power > 85 ? (m.tmHigh ?? 5000) : power > 60 ? (m.tmMid ?? 3000) : (m.tmLow ?? 1500);
}

// First reroll per battle is free, after that it costs money (§3h)
export function shopRerollCost(run, ctx) {
  return (run.shop?.rerolls ?? 0) === 0 ? 0 : (ctx.rules.money?.reroll ?? 200);
}

export function rerollShop(run, ctx) {
  const cost = shopRerollCost(run, ctx);
  if (run.money < cost) return { ok: false, reason: "Not enough money." };
  run.money -= cost;
  const rerolls = (run.shop?.rerolls ?? 0) + 1;
  run.shop = makeShop(run, ctx);
  run.shop.rerolls = rerolls;
  return { ok: true };
}

export function buyTM(run, ctx, index) {
  const entry = run.shop?.tms?.[index];
  if (!entry || entry.sold) return { ok: false, reason: "Sold out." };
  if (run.money < entry.price) return { ok: false, reason: "Not enough money." };
  run.money -= entry.price;
  entry.sold = true;
  if (!run.tms.includes(entry.move)) run.tms.push(entry.move);
  return { ok: true };
}

export function buyItem(run, ctx, index) {
  const entry = run.shop?.stock[index];
  if (!entry || entry.sold) return { ok: false, reason: "Sold out." };
  if (run.money < entry.price) return { ok: false, reason: "Not enough money." };
  run.money -= entry.price;
  entry.sold = true;
  addToBag(run, entry.id);
  return { ok: true };
}

export function sellPrice(ctx, id) {
  return Math.floor(priceOf(ctx, id) / 2);
}

export function sellItem(run, ctx, id) {
  if (!(run.bag[id] > 0)) return { ok: false };
  removeFromBag(run, id);
  run.money += sellPrice(ctx, id);
  return { ok: true };
}

// ===============================
// TMs (§3g) — reusable
// ===============================

function rollTM(run, ctx) {
  const opp = run.opponent;
  const owned = new Set(run.tms);
  const max = tmMaxPowerFor(ctx.rules, opp.order);
  const all = (ctx.tms ?? []).filter((t) => !TM_EXCLUDED.has(t.move) && !owned.has(t.move));
  const ofType = all.filter((t) => !opp.theme || ctx.data.moves[t.move].type === opp.theme);
  const power = (t) => ctx.data.moves[t.move].power ?? 0;
  let pool = ofType.filter((t) => power(t) <= max);
  if (!pool.length && ofType.length) {
    const weakest = Math.min(...ofType.map(power));
    pool = ofType.filter((t) => power(t) === weakest);
  }
  if (!pool.length) pool = all.filter((t) => power(t) <= max);
  if (!pool.length) return null;
  return pickOne(run, pool).move;
}

export function tmLabel(ctx, move) {
  const tm = (ctx.tms ?? []).find((t) => t.move === move);
  return `${tm?.tm ?? "TM"} ${ctx.data.moves[move]?.name ?? move}`;
}

// TMs this Pokémon can learn (and doesn't know yet)
export function teachableTMs(run, ctx, mon) {
  const learnable = new Set(ctx.data.pokemonByKey[mon.species].learnset.machine);
  return run.tms.filter((move) => learnable.has(move) && !mon.moves.includes(move));
}

export function teachTM(run, ctx, uid, move, replaceIndex) {
  const mon = run.team.find((m) => m.uid === uid);
  if (!mon || !teachableTMs(run, ctx, mon).includes(move)) return { ok: false };
  if (mon.moves.length < 4) mon.moves.push(move);
  else if (replaceIndex !== null && replaceIndex !== undefined) mon.moves[replaceIndex] = move;
  else return { ok: false };
  run.messages.push(`${displayName(ctx, mon)} learned ${ctx.data.moves[move].name}!`);
  return { ok: true };
}

// ===============================
// OPPONENTS
// ===============================

export function chooseOpponent(run, ctx, order) {
  const entry = leaderFor(run, ctx, order);
  const row = rowFor(ctx, order);
  const name = order === FINAL_ORDER ? run.rival.name : entry.name;
  const base = { order, id: entry.id, name, title: entry.title, theme: entry.theme, level: row.level,
    playerLevel: row.level + (row.levelBonus ?? 0), teamSize: row.teamSize };
  // Team pools (§5) take priority over handcrafted sets
  const pool = ctx.rules.teamPools?.[run.settings.gen]?.[order === FINAL_ORDER ? `rival-${run.rival.id}` : entry.id];
  if (pool?.some((g) => g?.length)) return { ...base, pooled: true, team: poolTeam(run, ctx, entry, row, pool) };
  if (entry.sets.length) {
    const setIndex = Math.floor(nextRandom(run) * entry.sets.length);
    return { ...base, setIndex, placeholder: false };
  }
  return { ...base, placeholder: true, team: placeholderTeam(run, ctx, entry, row) };
}

// One random opponent Pokémon at the battle level
// Smeargle only knows Sketch, and the AI uses it badly (it needs the foe to have moved first).
// Opponent Smeargle come with moves already sketched, like a trainer's Smeargle in the games.
const SMEARGLE_SKETCHES = [
  "thunderbolt", "ice-beam", "flamethrower", "shadow-ball", "psychic", "earthquake", "surf", "energy-ball",
  "crunch", "aura-sphere", "thunder-wave", "recover", "protect", "swords-dance", "calm-mind", "will-o-wisp",
];
function smeargleMoves(run, ctx) {
  const pool = SMEARGLE_SKETCHES.filter((m) => ctx.data.moves[m]);
  const picked = [];
  while (picked.length < 4 && pool.length) picked.push(pool.splice(Math.floor(nextRandom(run) * pool.length), 1)[0]);
  return picked;
}

function opponentMon(run, ctx, species, level) {
  const p = ctx.data.pokemonByKey[species];
  return {
    species, level,
    ability: p.abilities.normal[Math.floor(nextRandom(run) * p.abilities.normal.length)],
    nature: NATURES[Math.floor(nextRandom(run) * NATURES.length)],
    moves: species === "smeargle" ? smeargleMoves(run, ctx) : levelUpMovesAt(p, level, ctx.data),
    item: null,
  };
}

// Random team from the trainer's pool (§5 Team pools). The battle position picks the power
// groups; a thin window widens one group down (never Group 0), then up, until there's enough choice.
function poolTeam(run, ctx, entry, row, groups) {
  const { dex, data } = ctx;
  const level = row.level;
  const top = groups.length - 1;
  let [lo, hi] = ctx.rules.poolGroups?.[row.order] ?? [1, top];
  // Evolution line → its strongest legal species inside the window
  const linesIn = (lo, hi) => {
    const best = new Map();
    for (let g = lo; g <= hi; g++) {
      for (const k of groups[g] ?? []) {
        if (!dex.isLegalAt(k, level) || dex.isBaby(k)) continue;
        const line = dex.lineOf[k];
        const cur = best.get(line);
        if (!cur || data.pokemonByKey[k].bst > data.pokemonByKey[cur].bst) best.set(line, k);
      }
    }
    return best;
  };
  const need = Math.ceil(row.teamSize * (ctx.rules.minChoice ?? 1.5));
  let lines = linesIn(lo, hi);
  while (lines.size < need && (lo > 1 || hi < top)) {
    if (lo > 1) lo--; else hi++;
    lines = linesIn(lo, hi);
  }

  // Legendaries and Mythicals are drawn less often (§5 Legendary weight)
  const rare = (k) => data.pokemonByKey[k].isLegendary || data.pokemonByKey[k].isMythical;
  // First one at Legendary weight, a second one at Second legendary weight, never more than the max
  const { legendaryWeight = 0.15, secondLegendaryWeight = 0.05, maxLegendaries = 2 } = ctx.rules;
  let options = [...lines.values()];
  const team = [];
  let legends = 0;
  while (team.length < row.teamSize && options.length) {
    const weightOf = (k) => !rare(k) ? 1 : legends >= maxLegendaries ? 0 : legends ? secondLegendaryWeight : legendaryWeight;
    options = options.filter((k) => weightOf(k) > 0);
    if (!options.length) break;
    let roll = nextRandom(run) * options.reduce((sum, k) => sum + weightOf(k), 0);
    let i = 0;
    while (i < options.length - 1 && (roll -= weightOf(options[i])) >= 0) i++;
    const [species] = options.splice(i, 1);
    if (rare(species)) legends++;
    team.push(opponentMon(run, ctx, species, level));
  }
  if (team.length < row.teamSize) {
    const taken = new Set(team.map((m) => dex.lineOf[m.species]));
    const extra = placeholderTeam(run, ctx, entry, { ...row, teamSize: row.teamSize + taken.size })
      .filter((m) => !taken.has(dex.lineOf[m.species]));
    team.push(...extra.slice(0, row.teamSize - team.length));
  }
  return team;
}

// Until a leader has a pool or handmade sets: a random team that fits their type theme
function placeholderTeam(run, ctx, entry, row) {
  const { dex, data } = ctx;
  const level = row.level;
  const candidates = [];
  for (const root of Object.keys(dex.lines)) {
    const stages = dex.highestLegalStages(root, level).filter((k) => !entry.theme || data.pokemonByKey[k].types.includes(entry.theme));
    const p = stages.length && data.pokemonByKey[stages[0]];
    if (!p || p.isMythical || (p.isLegendary && row.order < 13)) continue;
    candidates.push(stages);
  }
  const team = [];
  const pool = [...candidates];
  while (team.length < row.teamSize && pool.length) {
    const i = Math.floor(nextRandom(run) * pool.length);
    const [stages] = pool.splice(i, 1);
    team.push(opponentMon(run, ctx, stages[Math.floor(nextRandom(run) * stages.length)], level));
  }
  return team;
}

export function opponentTeam(run, ctx) {
  const opp = run.opponent;
  if (opp.pooled) return { team: opp.team, script: [], setName: "Random team" };
  if (opp.placeholder) return { team: opp.team, script: [], setName: "Placeholder team" };
  const entry = leaderFor(run, ctx, opp.order);
  const set = entry.sets[opp.setIndex];
  return { team: set.team.map((m) => ({ ...m, level: opp.level })), script: set.script ?? [], setName: set.name };
}

// ===============================
// BATTLE
// ===============================

export function startBattle(run, ctx) {
  if (run.pendingMoves.length) return { ok: false, reason: "Decide on the new moves first." };
  const foe = opponentTeam(run, ctx);
  const bag = {};
  for (const [id, count] of Object.entries(run.bag)) {
    const item = ITEMS[id];
    if (item?.kind === "bag" && item.battle) bag[id] = { name: item.name, count, effect: item.effect };
  }
  const title = run.opponent.title === "Rival" ? "Rival" : run.opponent.title;
  const battle = Battle.create(ctx.data, {
    seed: Math.floor(nextRandom(run) * 2 ** 32),
    terrain: run.opponent.theme ?? "normal", // Camouflage turns into the arena's type
    sides: [
      { name: "You", isPlayer: true, team: run.team.map((m) => ({ ...m })), bag, badge: battleBonus(run, ctx.rules) },
      { name: `${title} ${run.opponent.name}`, team: foe.team, script: foe.script },
    ],
  });
  run.battle = battle.state;
  run.screen = "battle";
  return { ok: true, battle, events: battle.takeEvents() };
}

// After the battle: permadeath, items, then offers (or the end of the run)
export function finishBattle(run, ctx) {
  const st = run.battle;
  const won = st.winner === 0;
  const side = st.sides[0];
  const survivors = [];
  side.team.forEach((bm, i) => {
    const mon = run.team[i];
    // Items that are only used up for the length of the battle (the Focus Sash)
    const keeps = RESTORED_AFTER_BATTLE.has(bm.consumedItem) && !bm.item ? bm.consumedItem : null;
    if (bm.fainted) {
      // Permadeath: gone for good. Its held item (if not used up) returns to the bag.
      if (bm.item) addToBag(run, bm.item);
      else if (keeps) addToBag(run, keeps);
      run.fallen.push({ species: mon.species, name: displayName(ctx, mon), level: mon.level, order: run.order, opponent: run.opponent.name });
      return;
    }
    if (bm.item) mon.item = bm.item;
    else if (keeps) mon.item = keeps;
    else if (bm.consumedItem) mon.item = null; // single use: lost for good
    // Sketch is permanent: the sketched move replaces the Sketch slot for the rest of the run
    for (const { index, move } of bm.sketched ?? []) mon.moves[index] = move;
    // (knocked off / swapped away items come back after battle)
    survivors.push(mon);
  });
  run.team = survivors;
  for (const [id, n] of Object.entries(side.usedItems ?? {})) removeFromBag(run, id, n);
  run.lastBattle = { won, order: run.order, opponent: run.opponent.name, fallen: run.fallen.filter((f) => f.order === run.order) };
  run.battle = null;

  // Rewards for a win: prize money and a TM (§3g, §3h)
  if (won) {
    const m = ctx.rules.money ?? { perBattle: 150, flawlessBonus: 50 };
    let prize = m.perBattle * run.order;
    const flawless = run.lastBattle.fallen.length === 0;
    if (flawless) prize = Math.round(prize * (1 + m.flawlessBonus / 100));
    // Gym badge (§3k): the leader's badge is unlocked for good (saved by the screen code); the equipped badges' perks count now
    const badge = run.order >= 1 && run.order <= 8 ? { gen: run.settings.gen, order: run.order } : null;
    prize = Math.round(prize * (1 + perkN(run, ctx, "wallet"))); // Lucky Wallet badge
    // Interest badge: a share of the money you held before this prize (up to a cap)
    const bank = perkN(run, ctx, "interest", null);
    const interest = bank ? Math.min(bank.cap, Math.floor(run.money * bank.rate)) : 0;
    run.money += prize + interest;
    const tm = rollTM(run, ctx);
    if (tm) run.tms.push(tm);
    const extraTms = [];
    if (nextRandom(run) < perkN(run, ctx, "tm")) { // TM Master badge: a chance of one more TM
      const t = rollTM(run, ctx);
      if (t && !run.tms.includes(t)) { run.tms.push(t); extraTms.push(t); }
    }
    run.lastBattle.rewards = { money: prize, interest, flawless, tm, extraTms, badge };
    // Reveal who's next, so recruit choices can be based on it
    if (run.order < FINAL_ORDER && run.team.length) run.nextOpponent = chooseOpponent(run, ctx, run.order + 1);
  }

  if (!won || !run.team.length) {
    run.screen = "over";
    return;
  }
  if (run.order >= FINAL_ORDER) {
    run.screen = "won";
    return;
  }
  const row = rowFor(ctx, run.order);
  if (row.recruitOptions > 0) {
    const level = playerLevelFor(ctx, run.order + 1);
    // Replacement picks: +1 pick and +1 card per Pokémon lost this battle (DESIGN.md §3a)
    const lost = run.lastBattle.fallen.length;
    const bonus = Math.min(REPLACEMENT_PICK_CAP, lost, Math.max(0, 6 - run.team.length));
    const extra = perkN(run, ctx, "recruit", { picks: 0, cards: 0 }); // Extra Recruit badge
    const extraPicks = extra.picks;
    const extraCards = extra.cards + perkN(run, ctx, "scout"); // Extra Recruit and Scout badges
    run.offer = makeRecruitOffer(run, ctx, { count: row.recruitOptions + bonus + extraCards, picks: row.recruitPicks + bonus + extraPicks, odds: row.odds, level });
    run.offer.replacementPicks = bonus;
    run.screen = "recruit";
  } else {
    startItemOffer(run, ctx);
  }
}
