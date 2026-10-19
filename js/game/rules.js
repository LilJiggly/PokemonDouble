// =====================================================
// RULE TABLES FROM DESIGN.md
// -----------------------------------------------------
// Reads §3b (tiers + overrides), §3c (level gating +
// species overrides) and §3d (item odds) so editing the
// tables in DESIGN.md changes the game.
// =====================================================

import { readTable, parseProgression } from "./design-tables.js";
import { parseUnlocks } from "./unlocks.js";

export const TIERS = ["common", "uncommon", "rare", "epic", "legendary"];

const firstNumber = (text) => {
  const m = String(text ?? "").match(/\d+/);
  return m ? Number(m[0]) : null;
};
const clean = (text) => String(text ?? "").replace(/\*|_/g, "").trim();

// "Mr. Mime" → "mr-mime", "Farfetch'd" → "farfetchd"
export function nameToKey(name, data) {
  const target = clean(name).toLowerCase();
  const hit = data.pokemon.find((p) => p.name.toLowerCase() === target);
  return hit?.key ?? target.replace(/[.'’]/g, "").replace(/\s+/g, "-");
}

export function parseRules(markdown, data) {
  // §3b tier cutoffs: lowest BST of each tier
  const tierRows = readTable(markdown, "### 3b.");
  const tierMinBst = {};
  for (const row of tierRows) {
    const tier = clean(row["Tier"]).toLowerCase();
    if (tier === "legendary") continue;
    const text = row["Final form of the line"];
    tierMinBst[tier] = /under/i.test(text) ? 0 : firstNumber(text);
  }

  // §3b tier overrides (second table in the section)
  const tierOverrides = {};
  for (const row of readTableAfter(markdown, "### 3b.", "**Tier overrides:**")) {
    const first = clean(row["Line"]).split("→")[0];
    const tier = clean(row["Override tier"]).toLowerCase();
    if (first && TIERS.includes(tier)) tierOverrides[nameToKey(first, data)] = tier;
  }

  // §3c gating levels
  const gating = { stone: 30, trade: 36, friendship: 25, other: 30, legendary: 45, singleRare: 30, singleEpic: 40 };
  for (const row of readTable(markdown, "### 3c.")) {
    const method = row["Evolution method"].toLowerCase();
    const level = firstNumber(row["Earliest level"]);
    if (level === null) continue;
    if (method.includes("stone")) gating.stone = level;
    else if (method.includes("trade")) gating.trade = level;
    else if (method.includes("friendship")) gating.friendship = level;
    else if (method.includes("other")) gating.other = level;
    else if (method.includes("legendary")) gating.legendary = level;
    else if (method.includes("rare")) gating.singleRare = level;
    else if (method.includes("epic")) gating.singleEpic = level;
  }

  // §3c species overrides (rows in _italics_ are examples and are skipped)
  const speciesOverrides = {};
  for (const row of readTableAfter(markdown, "### 3c.", "**Species overrides**")) {
    if (String(row["Species"]).trim().startsWith("_")) continue;
    const level = firstNumber(row["Earliest level"]);
    if (level !== null) speciesOverrides[nameToKey(row["Species"], data)] = level;
  }

  // §3d item odds per stage
  const itemOdds = readTable(markdown, "### 3d.").map((row) => ({
    label: row["After"],
    odds: Object.fromEntries(["common", "uncommon", "rare", "epic"].map((t) => [t, firstNumber(row[capitalize(t)]) ?? 0])),
  }));

  // §3f starting bag (item names → ids)
  const startingBag = {};
  if (markdown.includes("### 3f.")) {
    for (const row of readTable(markdown, "### 3f.")) {
      const id = clean(row["Item"]).toLowerCase().replace(/[.'’]/g, "").replace(/\s+/g, "-");
      const count = firstNumber(row["Count"]);
      if (id && count) startingBag[id] = count;
    }
  }

  // §3g TM power limit per stage
  const tmMaxPower = readTable(markdown, "### 3g.").map((row) => ({
    label: row["After"],
    max: /any/i.test(row["Max TM power"]) ? Infinity : firstNumber(row["Max TM power"]),
  }));

  // §3h shop prices + money rules (two tables)
  const shopPrices = {};
  for (const row of readTable(markdown, "### 3h.")) {
    shopPrices[clean(row["Tier"]).toLowerCase()] = firstNumber(row["Price"]);
  }
  const money = { start: 500, perBattle: 150, flawlessBonus: 50, tmLow: 1500, tmMid: 3000, tmHigh: 5000, reroll: 200 };
  for (const row of readTableAfter(markdown, "### 3h.", "| Money rule")) {
    const rule = clean(row["Money rule"] ?? row[Object.keys(row)[0]]).toLowerCase();
    const n = firstNumber(row["Amount"]);
    if (rule.includes("starting")) money.start = n;
    else if (rule.includes("prize")) money.perBattle = n;
    else if (rule.includes("flawless")) money.flawlessBonus = n;
    else if (rule.includes("tm price") && rule.includes("86")) money.tmHigh = n;
    else if (rule.includes("tm price") && rule.includes("61")) money.tmMid = n;
    else if (rule.includes("tm price")) money.tmLow = n;
    else if (rule.includes("reroll")) money.reroll = n;
  }

  // §3h shop sections: how many items each section sells
  const shopStock = { items: 4, berries: 3, medicine: 3, battle: 2, key: 2, tms: 3 };
  for (const row of readTableAfter(markdown, "### 3h.", "| Shop section")) {
    const name = clean(row["Shop section"]).toLowerCase();
    const n = firstNumber(row["Items for sale"]);
    const id = name.includes("berr") ? "berries" : name.includes("medic") ? "medicine" : name.includes("battle") ? "battle"
      : name.includes("key") ? "key" : name.includes("tm") ? "tms" : name.includes("item") ? "items" : null;
    if (id && n !== null) shopStock[id] = n;
  }

  // §3i Trainer Points and upgrades
  const tp = { gym: 1, elite: 2, champion: 3, hallOfFame: 5 };
  const upgrades = [];
  if (markdown.includes("### 3i.")) {
    for (const row of readTable(markdown, "### 3i.")) {
      const what = clean(row["Earned for"]).toLowerCase();
      const n = firstNumber(row["TP"]);
      if (what.includes("gym")) tp.gym = n;
      else if (what.includes("elite")) tp.elite = n;
      else if (what.includes("champion")) tp.champion = n;
      else if (what.includes("hall")) tp.hallOfFame = n;
    }
    for (const row of readTableAfter(markdown, "### 3i.", "| ID |")) {
      upgrades.push({
        id: clean(row["ID"]),
        name: clean(row["Upgrade"]),
        max: firstNumber(row["Max level"]),
        cost: firstNumber(row["Cost per level"]),
        effect: clean(row["Effect per level"]),
      });
    }
  }

  // §5 team pools: { gen: { trainerId: [[group 0 keys], [group 1 keys], …] } }
  const percent = (label, fallback) => Number(markdown.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*(\\d+)%`))?.[1] ?? fallback) / 100;
  const legendaryWeight = percent("Legendary weight", 15);
  const secondLegendaryWeight = percent("Second legendary weight", 5);
  const maxLegendaries = Number(markdown.match(/\*\*Max legendaries:\*\*\s*(\d+)/)?.[1] ?? 2);
  const minChoice = Number(markdown.match(/\*\*Minimum choice:\*\*[^*]*\*\*([\d.]+)×/)?.[1] ?? 1.5);
  const teamPools = {};
  for (const line of markdown.split("\n")) {
    const m = line.match(/^#{3,6} .*\(`gen(\d+):([\w-]+)`\)/);
    if (!m) continue;
    const groups = [];
    for (const row of readTable(markdown, line)) {
      const g = firstNumber(row["Group"]);
      if (g === null) continue;
      // Species (trainer's type) and Filler (other types) are drawn the same way
      const keys = `${row["Species"] ?? ""},${row["Filler"] ?? ""}`.split(",").map((n) => n.trim()).filter((n) => n && n !== "—").map((n) => nameToKey(n, data));
      const unknown = keys.filter((k) => !data.pokemonByKey[k]);
      if (unknown.length) console.warn(`Team pool ${m[2]}: unknown species ${unknown.join(", ")}`);
      groups[g] = keys.filter((k) => data.pokemonByKey[k]);
    }
    (teamPools[Number(m[1])] ??= {})[m[2]] = groups;
  }

  // §5 power groups per battle: { order: [lowest, highest] }
  const poolGroups = {};
  if (markdown.includes("**Groups per battle:**")) {
    for (const row of readTable(markdown, "**Groups per battle:**")) {
      const [lo, hi = lo] = String(row["Groups"]).match(/\d+/g)?.map(Number) ?? [];
      if (lo !== undefined) poolGroups[firstNumber(row["#"])] = [lo, hi];
    }
  }

  return {
    shopStock,
    characterUnlocks: parseUnlocks(markdown),
    teamPools,
    poolGroups,
    minChoice,
    legendaryWeight,
    secondLegendaryWeight,
    maxLegendaries,
    tmMaxPower,
    shopPrices,
    money,
    tp,
    upgrades,
    startingBag,
    progression: parseProgression(markdown),
    tierMinBst,
    tierOverrides,
    gating,
    speciesOverrides,
    itemOdds,
  };
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Table that follows a marker line inside a section
function readTableAfter(markdown, heading, marker) {
  const start = markdown.indexOf(heading);
  if (start === -1) return [];
  const markerAt = markdown.indexOf(marker, start);
  const nextHeading = markdown.indexOf("\n### ", start + heading.length);
  if (markerAt === -1 || (nextHeading !== -1 && markerAt > nextHeading)) return [];
  // Re-use readTable by giving it a fake heading at the marker
  // A marker that starts with "|" is the table's own header row: keep it
  const from = marker.startsWith("|") ? markerAt : markerAt + marker.length;
  const slice = "#### MARKER\n" + markdown.slice(from);
  return readTable(slice, "#### MARKER");
}

// Item odds row for a battle order (1–13)
// TM power limit for a battle order (1–14)
export function tmMaxPowerFor(rules, order) {
  const rows = rules.tmMaxPower;
  const find = (re) => rows.find((r) => re.test(r.label))?.max;
  if (order <= 3) return find(/1.3/) ?? 60;
  if (order <= 6) return find(/4.6/) ?? 85;
  if (order <= 8) return find(/7.8/) ?? Infinity;
  return find(/elite|champion|rival/i) ?? Infinity;
}

export function itemOddsFor(rules, order) {
  const rows = rules.itemOdds;
  const find = (re) => rows.find((r) => re.test(r.label))?.odds;
  if (order <= 2) return find(/1.2/);
  if (order <= 4) return find(/3.4/);
  if (order <= 6) return find(/5.6/);
  if (order <= 8) return find(/7.8/);
  return find(/elite|champion/i) ?? rows[rows.length - 1].odds;
}
