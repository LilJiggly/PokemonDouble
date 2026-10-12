// =====================================================
// POKÉMON DOUBLE — START UP
// -----------------------------------------------------
// Loads the data and the rule tables from DESIGN.md,
// then hands over to the run screens.
// =====================================================

import { loadData } from "./engine/data.js";
import { parseRules } from "./game/rules.js";
import { Pokedex } from "./game/pokedex.js";
import { RunUI } from "./ui/run-screens.js";

async function boot() {
  const hub = document.getElementById("hub");
  hub.hidden = false;
  hub.innerHTML = `<p>Loading Pokémon data…</p>`;

  const getJson = (f) => fetch(f).then((r) => r.json());
  const [data, designText, evolutions, tms, ...leaderFiles] = await Promise.all([
    loadData("data"),
    fetch("DESIGN.md").then((r) => r.text()),
    getJson("data/evolutions.json"),
    getJson("data/tms.json"),
    ...[1, 2, 3, 4].map((g) => getJson(`data/leaders/gen${g}.json`)),
  ]);
  const rules = parseRules(designText, data);
  const ctx = {
    data,
    rules,
    dex: new Pokedex(data, evolutions, rules),
    tms,
    leaders: Object.fromEntries(leaderFiles.map((f) => [f.gen, f])),
  };
  new RunUI(ctx).start();
}

boot().catch((err) => {
  console.error(err);
  const hub = document.getElementById("hub");
  hub.hidden = false;
  hub.innerHTML = `<h1>Something went wrong</h1><p>${err.message}</p>
    <p>Open the game through a local server (e.g. Live Server), not as a file.</p>`;
});
