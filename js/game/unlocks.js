// =====================================================
// CHARACTER UNLOCKS (DESIGN.md §3j)
// -----------------------------------------------------
// Each playable character has an unlock rule in the §3j table:
//   Start               available from the beginning
//   Runs: 5             finish 5 runs (won or lost)
//   Wins: 3             reach the Hall of Fame 3 times
//   Win Gen 2           reach the Hall of Fame in Challenge Gen 2 (a regional trophy)
//   Beat battle 10      beat battle #10 (§3a numbering) in any run
//   TP earned: 25       earn 25 Trainer Points in total
// Progress comes from the meta save (see meta.js: runs, wins, winGens, best, earned).
// =====================================================

import { readTable } from "./design-tables.js";

const clean = (s) => String(s ?? "").replace(/[`*_]/g, "").trim();

export function parseUnlocks(markdown) {
  const rules = {};
  if (!markdown.includes("### 3j.")) return rules;
  for (const row of readTable(markdown, "### 3j.")) {
    const id = clean(row["ID"]);
    const text = clean(row["Unlock"]);
    const n = Number(text.match(/\d+/)?.[0] ?? 0);
    const lower = text.toLowerCase();
    const kind = lower.startsWith("win gen") ? "winGen" : lower.startsWith("wins") ? "wins" : lower.startsWith("runs") ? "runs"
      : lower.startsWith("beat") ? "beat" : lower.startsWith("tp") ? "tp" : "start";
    rules[id] = { kind, n, perk: clean(row["Perk"]) };
  }
  return rules;
}

// How far along the player is: { have, need }
export function unlockProgress(meta, rule) {
  switch (rule.kind) {
    case "runs": return { have: meta.runs ?? 0, need: rule.n };
    case "wins": return { have: meta.wins ?? 0, need: rule.n };
    case "winGen": return { have: meta.winGens?.[rule.n] ?? 0, need: 1 };
    case "beat": return { have: meta.best ?? 0, need: rule.n };
    case "tp": return { have: meta.earned ?? 0, need: rule.n };
    default: return { have: 1, need: 1 };
  }
}

export function isUnlocked(meta, rule) {
  if (!rule) return true; // characters missing from the table are free
  const { have, need } = unlockProgress(meta, rule);
  return have >= need;
}

export function unlockText(rule) {
  switch (rule?.kind) {
    case "runs": return `Finish ${rule.n} runs`;
    case "wins": return rule.n === 1 ? "Reach the Hall of Fame" : `Reach the Hall of Fame ${rule.n} times`;
    case "winGen": return `Reach the Hall of Fame in Gen ${rule.n}`;
    case "beat": return `Beat battle #${rule.n}`;
    case "tp": return `Earn ${rule.n} Trainer Points`;
    default: return "";
  }
}

// Ids of every character unlocked in this meta save
export const unlockedIds = (meta, rules, characters) => characters.filter((c) => isUnlocked(meta, rules[c.id])).map((c) => c.id);
