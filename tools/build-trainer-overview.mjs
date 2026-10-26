// =====================================================
// TRAINER OVERVIEW
// -----------------------------------------------------
// Builds trainer-overview.html (cards per trainer with their pool by power group, shared pools and the handmade sets)
// and trainer-pools.csv (trainer, gen, group, species, filler) from DESIGN.md §5 and data/leaders/.
// Usage: node tools/build-trainer-overview.mjs
// =====================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readTable } from "../js/game/design-tables.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const design = fs.readFileSync(path.join(ROOT, "DESIGN.md"), "utf8");
const pokemon = JSON.parse(fs.readFileSync(path.join(ROOT, "data/pokemon.json"), "utf8"));
const list = Array.isArray(pokemon) ? pokemon : Object.values(pokemon);
const byName = Object.fromEntries(list.map((p) => [p.name.toLowerCase(), p]));
const byKey = Object.fromEntries(list.map((p) => [p.key, p]));
const leaders = Object.fromEntries([1, 2, 3, 4, 5].map((g) => [g, JSON.parse(fs.readFileSync(path.join(ROOT, `data/leaders/gen${g}.json`), "utf8"))]));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// --- Pools from DESIGN.md ---
const trainers = [];
for (const line of design.split("\n")) {
  const m = line.match(/^#{3,6} (.*?) \(`gen(\d+):([\w-]+)`\)/);
  if (!m) continue;
  const gen = Number(m[2]), id = m[3];
  const [title, theme] = m[1].split(" · ");
  const groups = {};
  for (const row of readTable(design, line)) {
    const g = Number(String(row["Group"]).match(/\d+/)?.[0]);
    if (Number.isNaN(g)) continue;
    const split = (s) => String(s ?? "").split(",").map((x) => x.trim()).filter((x) => x && x !== "—");
    groups[g] = { species: split(row["Species"]), filler: split(row["Filler"]) };
  }
  const file = leaders[gen].opponents.find((o) => o.id === id || (id.startsWith("rival") && o.id === "rival"));
  trainers.push({ gen, id, title, theme: theme ?? "", order: file?.order ?? 14, groups, sets: id.startsWith("rival") ? [] : (file?.sets ?? []) });
}
trainers.sort((a, b) => a.gen - b.gen || a.order - b.order || a.id.localeCompare(b.id));

// Pools that are identical to another trainer's
const sig = (t) => JSON.stringify(Object.entries(t.groups).map(([g, v]) => [g, v.species.slice().sort(), v.filler.slice().sort()]));
const shared = new Map();
for (const t of trainers) (shared.get(sig(t)) ?? shared.set(sig(t), []).get(sig(t))).push(t);

// Groups per battle
let perBattle = [];
try { perBattle = readTable(design, "**Groups per battle:**"); } catch { /* optional */ }

// --- CSV ---
const csv = ["trainer,gen,title,type,battle,group,species,filler"];
for (const t of trainers) for (const [g, v] of Object.entries(t.groups)) {
  for (const s of v.species) csv.push([t.id, t.gen, `"${t.title}"`, t.theme, t.order, g, s, "no"].join(","));
  for (const s of v.filler) csv.push([t.id, t.gen, `"${t.title}"`, t.theme, t.order, g, s, "yes"].join(","));
}
fs.writeFileSync(path.join(ROOT, "trainer-pools.csv"), csv.join("\n") + "\n");

// --- HTML ---
const TYPE_COLORS = { normal: "#a8a878", fire: "#f08030", water: "#6890f0", electric: "#f8d030", grass: "#78c850", ice: "#98d8d8", fighting: "#c03028", poison: "#a040a0", ground: "#e0c068", flying: "#a890f0", psychic: "#f85888", bug: "#a8b820", rock: "#b8a038", ghost: "#705898", dragon: "#7038f8", dark: "#705848", steel: "#b8b8d0" };
const chip = (name, filler) => {
  const p = byName[name.toLowerCase()];
  const type = p?.types?.[0];
  return `<span class="mon ${filler ? "filler" : ""}" style="--t:${TYPE_COLORS[type] ?? "#667"}" title="${esc(name)}${p ? ` · BST ${p.bst} · ${p.types.join("/")}` : ""}${filler ? " · filler (other type)" : ""}">
    ${p ? `<img src="images/sprites/gen5/front/${p.id}.png" alt="">` : ""}<small>${esc(name)}</small>${p ? `<span class="types">${p.types.map((t) => `<i style="background:${TYPE_COLORS[t] ?? "#667"}">${esc(t)}</i>`).join("")}</span>` : ""}</span>`;
};
// Trainer sprites (images/trainers/<id>.png): Tate & Liza are two, final rivals use their rival's name
const spritesOf = (t) => {
  const ids = t.id === "tate-and-liza" ? ["tate", "liza"] : [t.id.replace(/^rival-/, "")];
  return ids.filter((id) => fs.existsSync(path.join(ROOT, `images/trainers/${id}.png`)));
};
// One card per type: every leader of a type shares the same pool. Pokémon that only some of them have (their personal
// filler, or Gen 5 species that only Unova trainers use) get that trainer's small face. Trainers without a type
// (rivals, champions) keep one card per distinct pool.
const owns = (t, group, name) => (t.groups[group]?.species.includes(name) || t.groups[group]?.filler.includes(name));
const cardFor = (ts) => {
  const entries = new Map(); // "group|name" → { group, name, owners, filler }
  for (const t of ts) for (const [g, v] of Object.entries(t.groups)) {
    for (const [list, filler] of [[v.species, false], [v.filler, true]]) for (const name of list) {
      const key = `${g}|${name}`;
      const e = entries.get(key) ?? { group: Number(g), name, owners: [], filler };
      if (!e.owners.includes(t)) e.owners.push(t);
      e.filler = e.filler && filler; // typed species in any trainer's list count as the type's own
      entries.set(key, e);
    }
  }
  const groupsPresent = [...new Set(ts.flatMap((t) => Object.keys(t.groups).map(Number)))].sort((x, y) => x - y);
  const tile = (e) => {
    const gen5 = byName[e.name.toLowerCase()]?.gen === 5; // Unova species: only Unova trainers can have them, not a personal pick
    const only = e.owners.length < ts.length && !gen5 ? e.owners : [];
    const faces = only.flatMap((o) => spritesOf(o).slice(0, 1).map((id) => `<img class="face" src="images/trainers/${id}.png" alt="" title="Only ${esc(o.title.replace(/^(Gym Leader|Elite Four|Champion) /, ""))}">`));
    return chip(e.name, e.filler).replace(/<\/span>$/, `${faces.length ? `<span class="faces-corner">${faces.slice(0, 3).join("")}</span>` : ""}${gen5 ? `<span class="g5" title="Gen 5 Pokémon: only the Unova trainers use it">5</span>` : ""}</span>`);
  };
  const rows = groupsPresent.map((g) => {
    const es = [...entries.values()].filter((e) => e.group === g).sort((x, y) => (x.owners.length < ts.length) - (y.owners.length < ts.length) || (byName[x.name.toLowerCase()]?.id ?? 0) - (byName[y.name.toLowerCase()]?.id ?? 0));
    return `<tr><th>${g}</th><td>${es.length ? es.map(tile).join("") : `<span class="none">—</span>`}</td></tr>`;
  }).join("");
  const names = ts.map((x) => `<span class="who" data-g="${x.gen}"><span class="faces">${spritesOf(x).map((id) => `<img src="images/trainers/${id}.png" alt="">`).join("")}</span><span>${esc(x.title.replace(/^(Gym Leader|Elite Four|Champion) /, ""))}<i>Gen ${x.gen} · #${x.order}</i></span></span>`).join("");
  const kind = [...new Set(ts.map((x) => x.theme).filter((x) => x && !/signature/.test(x)))].join(" / ") || "signature lines";
  const sets = ts.filter((x) => x.sets.length).map((x) => `<details><summary>${esc(x.title)}: ${x.sets.length} handmade sets</summary>${x.sets.map((st) => `<div class="set"><b>${esc(st.name)}</b> <small>${esc(st.notes ?? "")}</small><div class="team">${st.team.map((m) => `<div>${chip(byKey[m.species]?.name ?? m.species, false)}<small>${esc((m.moves ?? []).join(", "))}${m.item ? ` · ${esc(m.item)}` : ""}${m.ability ? ` · ${esc(m.ability)}` : ""}</small></div>`).join("")}</div></div>`).join("")}</details>`).join("");
  return `<section class="card" data-gens="${[...new Set(ts.map((x) => x.gen))].join(",")}" data-search="${esc(`${ts.map((x) => `${x.title} ${x.id}`).join(" ")} ${kind} ${[...entries.values()].map((e) => e.name).join(" ")}`.toLowerCase())}">
    <h2>${esc(kind)}</h2><div class="whos">${names}</div>
    <table>${rows}</table>${sets}</section>`;
};
const byTheme = new Map();
const signature = [];
for (const t of trainers) {
  if (t.theme && !/signature/.test(t.theme)) (byTheme.get(t.theme) ?? byTheme.set(t.theme, []).get(t.theme)).push(t);
  else signature.push(t);
}
const sigGroups = new Map();
for (const t of signature) (sigGroups.get(sig(t)) ?? sigGroups.set(sig(t), []).get(sig(t))).push(t);
const pools = [...byTheme.values(), ...sigGroups.values()];
const card = cardFor;
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Trainer overview</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; padding: 16px 20px 60px; background: #1d2330; color: #eef4f8; font: 15px/1.4 system-ui, sans-serif; }
  h1 { margin: 0 0 4px; } p.sub { margin: 0 0 14px; color: #aebccf; }
  .bar { position: sticky; top: 0; z-index: 5; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 10px 0; background: #1d2330; }
  .bar input { flex: 1; min-width: 220px; padding: 8px 12px; background: #2a3346; border: 2px solid #4c5a78; border-radius: 8px; color: inherit; font: inherit; }
  .bar button { padding: 8px 14px; background: #2a3346; border: 2px solid #4c5a78; border-radius: 8px; color: inherit; font: inherit; cursor: pointer; }
  .bar button.on { background: #f8d030; border-color: #f8d030; color: #1d2330; font-weight: 700; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(520px, 1fr)); gap: 14px; margin-top: 8px; }
  .card { background: #2a3346; border: 2px solid #3c4862; border-radius: 12px; padding: 12px 14px; }
  .card h2 { margin: 0 0 6px; font-size: 17px; } .card h2 small { color: #aebccf; font-weight: 400; font-size: 13px; margin-left: 6px; }
  .whos { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 8px; } .who { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px 4px 6px; background: #38425c; border-radius: 12px; font-size: 14px; font-weight: 600; } .who i { display: block; color: #aebccf; font-style: normal; font-weight: 400; font-size: 12px; } .faces { display: inline-flex; } .mon { position: relative; } .g5 { position: absolute; top: 2px; left: 2px; padding: 0 5px; background: #38425c; border-radius: 8px; font-size: 10px; font-weight: 700; color: #aebccf; } .faces-corner { position: absolute; top: -8px; right: -8px; display: flex; flex-direction: column; } .mon .face { width: 32px; height: 32px; padding: 0; box-sizing: border-box; object-fit: none; object-position: 50% 4%; background: #232a3b; border: 2px solid #f8d030; border-radius: 50%; image-rendering: pixelated; margin-bottom: -6px; } .faces img { height: 52px; width: auto; image-rendering: pixelated; } .team { display: flex; flex-wrap: wrap; gap: 6px; } .team > div { width: 150px; } .team > div > small { display: block; }
  table { width: 100%; border-collapse: collapse; } th { width: 28px; padding: 4px 6px 4px 0; vertical-align: top; color: #aebccf; font-weight: 600; text-align: left; }
  td { padding: 3px 0; } .mon { display: inline-flex; flex-direction: column; align-items: center; width: 76px; margin: 2px 4px 2px 0; padding: 2px 2px 3px; background: color-mix(in srgb, var(--t) 28%, #232a3b); border: 2px solid var(--t); border-radius: 10px; text-align: center; } .mon img { width: 56px; height: 56px; object-fit: contain; image-rendering: pixelated; } .mon small { font-size: 11px; line-height: 1.1; overflow-wrap: anywhere; } .mon .types { display: flex; flex-direction: column; gap: 2px; margin-top: 3px; width: 100%; } .mon .types i { display: block; padding: 0 2px; border-radius: 6px; color: #10131c; font-size: 10px; font-style: normal; font-weight: 700; text-transform: uppercase; line-height: 14px; }
  .mon.filler { opacity: .7; border-style: dashed; } .none { color: #667; }
  details { margin-top: 8px; } summary { cursor: pointer; color: #f8d030; } .set { margin: 6px 0; padding: 6px 8px; background: #232a3b; border-radius: 8px; } .set ul { margin: 4px 0 0; padding-left: 18px; } .set small { color: #aebccf; }
  .legend { margin: 6px 0 12px; color: #aebccf; font-size: 13px; } .legend table { width: auto; margin-top: 6px; } .legend td, .legend th { padding: 2px 12px 2px 0; width: auto; }
  .hide { display: none; }
</style></head><body>
<h1>Trainer overview</h1>
<p class="sub">${trainers.length} trainers in ${pools.length} pools · built from DESIGN.md §5 and data/leaders/ by tools/build-trainer-overview.mjs · CSV: trainer-pools.csv</p>
<div class="legend">Pools are listed by power group (0 = dead weight, 5 = strongest). Each battle uses a window of groups (below). Solid border = the trainer's type, dashed = filler from other types. Hover a Pokémon for BST and types. Every leader of a type shares one pool, in every generation, so there is one card per type. A small face on a Pokémon means only that trainer has it (personal filler, or a Gen 5 species).
${perBattle.length ? `<table><tr><th>Battle</th>${perBattle.map((r) => `<td>${esc(String(r["Battle"]).replace("Elite Four #", "E4 ").replace("Gym ", "G"))}</td>`).join("")}</tr><tr><th>Groups</th>${perBattle.map((r) => `<td>${esc(r["Groups"])}</td>`).join("")}</tr></table>` : ""}</div>
<div class="bar"><input id="q" placeholder="Search a trainer, type or Pokémon (e.g. Skarmory, electric, brock)…"></div>
<div class="grid" id="grid">${pools.map(card).join("")}</div>
<script>
  const cards = [...document.querySelectorAll(".card")];
  const apply = () => { const q = document.getElementById("q").value.toLowerCase().trim();
    for (const c of cards) c.classList.toggle("hide", (q && !c.dataset.search.includes(q))); };
  document.getElementById("q").oninput = apply;
</script></body></html>`;
fs.writeFileSync(path.join(ROOT, "trainer-overview.html"), html);
console.log(`${trainers.length} trainers → trainer-overview.html, trainer-pools.csv (${csv.length - 1} rows)`);
