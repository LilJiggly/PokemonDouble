// =====================================================
// CHARACTER UNLOCKS (DESIGN.md §3j)
// -----------------------------------------------------
// Each playable character has an unlock rule in the §3j table. A rule is one or more clauses:
//   A or B        either way unlocks the trainer
//   A and B       both are needed
// Clauses:
//   Start                    available from the beginning
//   Runs: 5                  finish 5 runs (won or lost)
//   Wins: 3                  reach the Hall of Fame 3 times
//   Win Gen 2                reach the Hall of Fame in Challenge Gen 2 (a regional trophy)
//   Beat battle 10           beat battle #10 (§3a numbering) in any run
//   TP earned: 25            earn 25 Trainer Points in total
//   Line win: ralts          reach the Hall of Fame with a Pokémon of that evolution line on the team
//   Line gym 4: ralts        have that line on the team when beating battle #4
//   Line picks 3: ralts      pick that line at the starter draft in 3 runs
//   Starters: kanto          have all three starter lines of a region on the team together
//   Type win: dark           reach the Hall of Fame with a Pokémon of that type on the team
//   Type gym 5: fighting     have that type on the team when beating battle #5
//   Species: 25              recruit 25 different species in total
//   Badges: 16               own 16 badges
//   Clean win                reach the Hall of Fame without losing a Pokémon ("Clean win Gen 5" for a Challenge Gen)
//   Clean gym 4              get through battle #4 without losing a Pokémon
//   Quick wins: 3            win gym battles in 4 turns or fewer, 3 times
//   Berries: 30 / Items: 25  give 30 berries / 25 held items to your Pokémon in total
//   Diverse win              reach the Hall of Fame with six different types on the team
//   Full team: dragon        win a battle with a team of six Pokémon of that type
//   Win all gens             reach the Hall of Fame in every Challenge Gen (1–5)
//   Fast win: 60             reach the Hall of Fame within 60 minutes of play time
//   Team: a, b, c            win a battle with all of those exact species on the team together
//   Friendship: 5            recruit 5 different Pokémon that evolved by friendship (Crobat, Blissey, Lucario…)
// Progress comes from the meta save (see progress.js). Trainers are granted by grantUnlocks(): at most
// 2 per run, so unlocking feels like an event.
// =====================================================

import { readTable } from "./design-tables.js";

const clean = (s) => String(s ?? "").replace(/[`*_]/g, "").trim();

export const MAX_UNLOCKS_PER_RUN = 2;

// Trainers whose unlock stays secret in the picker until you have them (everyone else shows how to unlock them)
export const HIDDEN_TRAINERS = new Set(["lance", "steven", "red-e", "silver"]);

// One clause of a rule → { kind, n, arg }
const CLAUSES = [
  [/^start$/i, () => ({ kind: "start" })],
  [/^win gen (\d+)$/i, (m) => ({ kind: "winGen", n: +m[1] })],
  [/^wins:?\s*(\d+)$/i, (m) => ({ kind: "wins", n: +m[1] })],
  [/^runs:?\s*(\d+)$/i, (m) => ({ kind: "runs", n: +m[1] })],
  [/^beat battle (\d+)$/i, (m) => ({ kind: "beat", n: +m[1] })],
  [/^tp earned:?\s*(\d+)$/i, (m) => ({ kind: "tp", n: +m[1] })],
  [/^line win:?\s*([\w-]+)$/i, (m) => ({ kind: "lineWin", n: 1, arg: m[1].toLowerCase() })],
  [/^line gym (\d+):?\s*([\w-]+)$/i, (m) => ({ kind: "lineGym", n: +m[1], arg: m[2].toLowerCase() })],
  [/^line picks (\d+):?\s*([\w-]+)$/i, (m) => ({ kind: "linePicks", n: +m[1], arg: m[2].toLowerCase() })],
  [/^starters:?\s*(\w+)$/i, (m) => ({ kind: "starters", n: 1, arg: m[1].toLowerCase() })],
  [/^type win:?\s*(\w+)$/i, (m) => ({ kind: "typeWin", n: 1, arg: m[1].toLowerCase() })],
  [/^type gym (\d+):?\s*(\w+)$/i, (m) => ({ kind: "typeGym", n: +m[1], arg: m[2].toLowerCase() })],
  [/^species:?\s*(\d+)$/i, (m) => ({ kind: "species", n: +m[1] })],
  [/^badges:?\s*(\d+)$/i, (m) => ({ kind: "badges", n: +m[1] })],
  [/^clean win gen (\d+)$/i, (m) => ({ kind: "cleanWinGen", n: 1, arg: m[1] })],
  [/^clean win$/i, () => ({ kind: "cleanWin", n: 1 })],
  [/^clean gym (\d+)$/i, (m) => ({ kind: "cleanGym", n: +m[1] })],
  [/^quick wins:?\s*(\d+)$/i, (m) => ({ kind: "quick", n: +m[1] })],
  [/^berries:?\s*(\d+)$/i, (m) => ({ kind: "berries", n: +m[1] })],
  [/^items:?\s*(\d+)$/i, (m) => ({ kind: "items", n: +m[1] })],
  [/^diverse win$/i, () => ({ kind: "diverse", n: 1 })],
  [/^full team:?\s*(\w+)$/i, (m) => ({ kind: "fullTeam", n: 1, arg: m[1].toLowerCase() })],
  [/^win all gens$/i, () => ({ kind: "winAll", n: 5 })],
  [/^fast win:?\s*(\d+)$/i, (m) => ({ kind: "fast", n: +m[1] })],
  [/^friendship:?\s*(\d+)$/i, (m) => ({ kind: "friendly", n: +m[1] })],
  [/^team:?\s*([\w, -]+)$/i, (m) => { const arg = m[1].split(",").map((x) => x.trim().toLowerCase()).filter(Boolean); return { kind: "team", n: arg.length, arg }; }],
];

// Species that evolve by friendship (set at start up from the Pokédex): recruiting them counts for "Friendship: N"
let friendshipSpecies = new Set();
export function setFriendshipSpecies(list) { friendshipSpecies = new Set(list); }

export function parseClause(text) {
  const t = clean(text);
  for (const [re, make] of CLAUSES) {
    const m = t.match(re);
    if (m) return make(m);
  }
  return { kind: "start" };
}

// "A or B and C" → [[A], [B, C]] (any alternative with all its clauses)
export function parseRule(text) {
  return clean(text).split(/\s+or\s+/i).map((alt) => alt.split(/\s+and\s+/i).map(parseClause));
}

export function parseUnlocks(markdown) {
  const rules = {};
  if (!markdown.includes("### 3j.")) return rules;
  for (const row of readTable(markdown, "### 3j.")) {
    const id = clean(row["ID"]);
    const alts = parseRule(row["Unlock"]);
    rules[id] = {
      id,
      alts,
      start: alts.some((a) => a.every((c) => c.kind === "start")),
      perk: clean(row["Perk"]),
      effect: clean(row["Effect"]),
    };
  }
  return rules;
}

const count = (obj, key) => obj?.[key] ?? 0;

// How far along the player is for one clause: { have, need }
export function clauseProgress(meta, c) {
  switch (c.kind) {
    case "runs": return { have: meta.runs ?? 0, need: c.n };
    case "wins": return { have: meta.wins ?? 0, need: c.n };
    case "winGen": return { have: count(meta.winGens, c.n), need: 1 };
    case "beat": return { have: meta.best ?? 0, need: c.n };
    case "tp": return { have: meta.earned ?? 0, need: c.n };
    case "lineWin": return { have: count(meta.lineWins, c.arg), need: 1 };
    case "lineGym": return { have: count(meta.lineGym, c.arg), need: c.n };
    case "linePicks": return { have: count(meta.picks, c.arg), need: c.n };
    case "starters": return { have: meta.starters?.[c.arg] ? 1 : 0, need: 1 };
    case "typeWin": return { have: count(meta.typeWins, c.arg), need: 1 };
    case "typeGym": return { have: count(meta.typeGym, c.arg), need: c.n };
    case "species": return { have: (meta.species ?? []).length, need: c.n };
    case "badges": return { have: (meta.badges ?? []).length, need: c.n };
    case "cleanWin": return { have: meta.cleanWins ?? 0, need: 1 };
    case "cleanWinGen": return { have: count(meta.cleanWinGens, c.arg), need: 1 };
    case "cleanGym": return { have: meta.cleanGym ?? 0, need: c.n };
    case "quick": return { have: meta.quickWins ?? 0, need: c.n };
    case "berries": return { have: meta.berries ?? 0, need: c.n };
    case "items": return { have: meta.items ?? 0, need: c.n };
    case "diverse": return { have: meta.diverseWins ?? 0, need: 1 };
    case "fullTeam": return { have: meta.fullTeam?.[c.arg] ? 1 : 0, need: 1 };
    case "winAll": return { have: [1, 2, 3, 4, 5].filter((g) => count(meta.winGens, g) > 0).length, need: 5 };
    case "fast": return { have: (meta.fastestWin ?? Infinity) <= c.n * 60000 ? 1 : 0, need: 1 };
    case "team": return { have: Math.min(c.n, meta.teamBest?.[c.arg.join(",")] ?? 0), need: c.n };
    case "friendly": return { have: (meta.species ?? []).filter((k) => friendshipSpecies.has(k)).length, need: c.n };
    default: return { have: 1, need: 1 };
  }
}

// 0..1 for one rule: its best alternative (the weakest clause of it)
export function ruleProgress(meta, rule) {
  if (!rule) return 1;
  return Math.max(...rule.alts.map((alt) => Math.min(...alt.map((c) => {
    const { have, need } = clauseProgress(meta, c);
    return Math.min(1, have / need);
  }))));
}

// Are the conditions met (whether or not the trainer has been granted yet)?
export function meetsRule(meta, rule) {
  return !rule || ruleProgress(meta, rule) >= 1;
}

// Granted trainers are kept in meta.unlocked. Saves from before that list existed fall back to the conditions.
export function isUnlocked(meta, rule) {
  if (!rule || rule.start) return true;
  if (!meta.unlocked) return meetsRule(meta, rule) || meta.character === rule.id;
  return meta.unlocked.includes(rule.id);
}

// Grant trainers whose conditions are met (in table order), at most `max` at a time. Returns the new ids.
export function grantUnlocks(meta, rules, characters, max = MAX_UNLOCKS_PER_RUN) {
  if (!meta.unlocked) {
    meta.unlocked = characters.filter((c) => isUnlocked(meta, rules[c.id])).map((c) => c.id);
    return [];
  }
  const granted = [];
  for (const c of characters) {
    if (granted.length >= max) break;
    const rule = rules[c.id];
    if (rule && !meta.unlocked.includes(c.id) && !rule.start && meetsRule(meta, rule)) {
      meta.unlocked.push(c.id);
      granted.push(c.id);
    }
  }
  return granted;
}

const nice = (s) => String(s ?? "").replace(/-/g, " ").replace(/^./, (x) => x.toUpperCase());

export function clauseText(c) {
  switch (c.kind) {
    case "runs": return `Finish ${c.n} runs`;
    case "wins": return c.n === 1 ? "Win a run" : `Win ${c.n} runs`;
    case "winGen": return `Win Gen ${c.n}`;
    case "beat": return `Beat battle #${c.n}`;
    case "tp": return `Earn ${c.n} Trainer Points`;
    case "lineWin": return `Win with a ${nice(c.arg)} line Pokémon`;
    case "lineGym": return `Beat battle #${c.n} with a ${nice(c.arg)} line`;
    case "linePicks": return `Draft ${nice(c.arg)} ${c.n} times`;
    case "starters": return `All 3 ${nice(c.arg)} starters on one team`;
    case "typeWin": return `Win with a ${nice(c.arg)}-type`;
    case "typeGym": return `Beat battle #${c.n} with a ${nice(c.arg)}-type`;
    case "species": return `Recruit ${c.n} different Pokémon`;
    case "badges": return `Own ${c.n} badges`;
    case "cleanWin": return "Win without losing a Pokémon";
    case "cleanWinGen": return `Win Gen ${c.arg} with no losses`;
    case "cleanGym": return `Beat battle #${c.n} with no losses`;
    case "quick": return `Win ${c.n} gyms in 4 turns or less`;
    case "berries": return `Give out ${c.n} berries`;
    case "items": return `Give out ${c.n} held items`;
    case "diverse": return "Win with 6 different types";
    case "fullTeam": return `Win a battle with 6 ${nice(c.arg)}-types`;
    case "winAll": return "Win every generation";
    case "fast": return `Win a run in ${c.n} minutes`;
    case "team": return `Win a battle with all ${c.n} of these Pokémon`;
    case "friendly": return `Recruit ${c.n} friendship evolutions`;
    default: return "";
  }
}

export function unlockText(rule) {
  if (!rule) return "";
  return rule.alts.map((alt) => alt.map(clauseText).join(" and ")).join(", or ");
}

// The locked trainer closest to unlocking (for the hint in the picker); null if none
export function nextHint(meta, rules, characters) {
  const locked = characters.filter((c) => !isUnlocked(meta, rules[c.id]));
  let best = null;
  for (const c of locked) {
    const score = ruleProgress(meta, rules[c.id]);
    if (!best || score > best.score) best = { character: c, score, ready: score >= 1 };
  }
  return best;
}

// Ids of every character unlocked in this meta save
export const unlockedIds = (meta, rules, characters) => characters.filter((c) => isUnlocked(meta, rules[c.id])).map((c) => c.id);
