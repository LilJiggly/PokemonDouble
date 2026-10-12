// =====================================================
// POKÉDEX RULES
// -----------------------------------------------------
// Evolution lines, rarity tiers (§3b), level gating
// (§3c) and what a Pokémon can evolve into (§2).
// =====================================================

import { TIERS } from "./rules.js";

// Version groups up to Gen 4 (official evolution methods of that era)
const GEN4_GROUPS = new Set([
  "red-blue", "yellow", "gold-silver", "crystal", "ruby-sapphire", "emerald", "firered-leafgreen",
  "diamond-pearl", "platinum", "heartgold-soulsilver", "colosseum", "xd",
]);

// Our own evolution rules where the official one doesn't fit (§2 Evolution)
const METHOD_OVERRIDES = {
  leafeon: { kind: "stone", item: "leaf-stone" },
  glaceon: { kind: "stone", item: "ice-stone" },
};

export class Pokedex {
  constructor(data, evolutions, rules) {
    this.data = data;
    this.rules = rules;
    this.byKey = data.pokemonByKey;

    // Evolution links: species → [{ to, method }]
    this.evolvesTo = {};
    this.evolvesFrom = {};
    for (const link of evolutions) {
      if (!this.byKey[link.from] || !this.byKey[link.to]) continue;
      const method = this.classify(link);
      (this.evolvesTo[link.from] ??= []).push({ to: link.to, method });
      this.evolvesFrom[link.to] = { from: link.from, method };
    }

    // Lines: every species → its line root (babies included)
    this.lineOf = {};
    this.lines = {};
    for (const p of data.pokemon) {
      let root = p.key;
      while (this.evolvesFrom[root]) root = this.evolvesFrom[root].from;
      this.lineOf[p.key] = root;
      (this.lines[root] ??= []).push(p.key);
    }

    this.tierCache = {};
    this.levelCache = {};
  }

  // ===============================
  // EVOLUTION METHODS
  // ===============================

  classify(link) {
    if (METHOD_OVERRIDES[link.to]) return METHOD_OVERRIDES[link.to];
    const old = link.details.filter((d) => GEN4_GROUPS.has(d.version_group));
    const d = (old.length ? old : link.details)[0] ?? { trigger: "level-up" };
    const gender = d.gender === 1 ? "F" : d.gender === 2 ? "M" : null;
    if (d.trigger === "shed") return { kind: "shed" };
    if (d.trigger === "use-item") return { kind: "stone", item: d.item, gender };
    if (d.trigger === "trade") return { kind: "trade", heldItem: d.held_item ?? null };
    if (d.min_happiness) return { kind: "friendship" };
    if (d.held_item) return { kind: "held", heldItem: d.held_item };
    if (d.location || d.known_move || d.known_move_type || d.min_beauty || d.party_species || d.party_type) {
      return { kind: "other" };
    }
    if (d.min_level) return { kind: "level", level: d.min_level, gender };
    return { kind: "other" };
  }

  methodLevel(method) {
    const g = this.rules.gating;
    switch (method.kind) {
      case "level": return method.level;
      case "stone": return g.stone;
      case "trade": return g.trade;
      case "friendship": return g.friendship;
      case "shed": return 20;
      default: return g.other;
    }
  }

  // ===============================
  // LINES & TIERS
  // ===============================

  isBaby(key) { return !!this.byKey[key]?.isBaby; }

  // A species that came out before its baby pre-evolution (Pikachu, Snorlax…) counts as a base form
  isBaseForm(key) {
    const from = this.evolvesFrom[key];
    if (!from) return true;
    return this.isBaby(from.from) && this.byKey[key].gen < this.byKey[from.from].gen;
  }

  // Species that doesn't evolve and has no (non-baby) pre-evolution
  isSingleStage(key) {
    return this.isBaseForm(key) && !(this.evolvesTo[key]?.length);
  }

  lineMembers(key) { return this.lines[this.lineOf[key]]; }

  finalForms(key) {
    return this.lineMembers(key).filter((k) => !this.evolvesTo[k]?.length);
  }

  // Tier of the whole line (by its strongest final form, plus overrides)
  tier(key) {
    const root = this.lineOf[key];
    if (this.tierCache[root]) return this.tierCache[root];
    const members = this.lineMembers(key);
    let tier;
    const override = members.map((m) => this.rules.tierOverrides[m]).find(Boolean);
    if (override) tier = override;
    else if (members.some((m) => this.byKey[m].isLegendary || this.byKey[m].isMythical)) tier = "legendary";
    else {
      const bst = Math.max(...this.finalForms(key).map((k) => this.byKey[k].bst));
      tier = "common";
      for (const t of ["uncommon", "rare", "epic"]) {
        if (this.rules.tierMinBst[t] !== undefined && bst >= this.rules.tierMinBst[t]) tier = t;
      }
    }
    this.tierCache[root] = tier;
    return tier;
  }

  tierRank(tier) { return TIERS.indexOf(tier); }

  // ===============================
  // LEVEL GATING (§3c)
  // ===============================

  earliestLevel(key) {
    if (this.levelCache[key] !== undefined) return this.levelCache[key];
    const p = this.byKey[key];
    const g = this.rules.gating;
    let level;
    if (this.rules.speciesOverrides[key] !== undefined) level = this.rules.speciesOverrides[key];
    else if (p.isLegendary || p.isMythical) level = g.legendary;
    else if (this.isBaseForm(key)) {
      const tier = this.tier(key);
      level = this.isSingleStage(key) ? (tier === "epic" ? g.singleEpic : tier === "rare" ? g.singleRare : 1) : 1;
    } else {
      const { from, method } = this.evolvesFrom[key];
      level = Math.max(this.methodLevel(method), this.earliestLevel(from));
    }
    this.levelCache[key] = level;
    return level;
  }

  isLegalAt(key, level) { return this.earliestLevel(key) <= level; }

  // The deepest legal stages of a line at this level (for "offered at highest legal stage")
  highestLegalStages(rootKey, level, allowed = () => true) {
    const legal = this.lines[rootKey].filter((k) => this.isLegalAt(k, level) && allowed(k) && !this.isBaby(k));
    if (!legal.length) return [];
    const depth = (k) => { let d = 0; let c = k; while (this.evolvesFrom[c]) { c = this.evolvesFrom[c].from; d++; } return d; };
    const max = Math.max(...legal.map(depth));
    return legal.filter((k) => depth(k) === max);
  }

  // First non-baby stage of a line (starter draft offers these)
  firstStage(rootKey) {
    if (!this.isBaby(rootKey)) return rootKey;
    return (this.evolvesTo[rootKey] ?? []).map((e) => e.to).find((k) => !this.isBaby(k)) ?? rootKey;
  }

  // ===============================
  // EVOLVING A TEAM MEMBER (§2 Evolution)
  // ===============================

  // mon: { species, level, gender, item }, bag: { itemId: count }
  evolutionOptions(mon, bag) {
    const out = [];
    for (const { to, method } of this.evolvesTo[mon.species] ?? []) {
      if (method.kind === "shed") continue; // Shedinja comes as a bonus with Ninjask
      const needLevel = this.earliestLevel(to);
      const reasons = [];
      if (mon.level < needLevel) reasons.push(`Lv ${needLevel}`);
      if (method.gender && mon.gender !== method.gender) continue; // e.g. only male Kirlia → Gallade
      if (method.kind === "stone" && !(bag[method.item] > 0)) reasons.push(itemLabel(method.item));
      if (method.kind === "trade") {
        if (!(bag["link-cable"] > 0)) reasons.push("Link Cable");
        if (method.heldItem && mon.item !== method.heldItem) reasons.push(`holding ${itemLabel(method.heldItem)}`);
      }
      if (method.kind === "held" && mon.item !== method.heldItem) reasons.push(`holding ${itemLabel(method.heldItem)}`);
      out.push({ to, name: this.byKey[to].name, method, ready: reasons.length === 0, needs: reasons });
    }
    return out;
  }
}

export function itemLabel(id) {
  return String(id).split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
