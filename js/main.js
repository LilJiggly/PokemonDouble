// =====================================================
// POKÉMON DOUBLE — START UP
// -----------------------------------------------------
// Loads the data and the rule tables from DESIGN.md,
// then hands over to the run screens.
// =====================================================

import { loadData } from "./engine/data.js";
import { setCharacters } from "./game/characters.js";
import { loadMeta } from "./game/meta.js";
import { applySpriteMode } from "./game/sprite-mode.js";
import { watchSpriteFit } from "./ui/sprite-fit.js";
import { setSpriteOffsets } from "./ui/sprite-align.js";
import { parseRules } from "./game/rules.js";
import { Pokedex } from "./game/pokedex.js";
import { RunUI } from "./ui/run-screens.js";
import { DevTools } from "./ui/dev-tools.js";

async function boot() {
  const hub = document.getElementById("hub");
  hub.hidden = false;
  hub.innerHTML = `<p>Loading Pokémon data…</p>`;

  const getJson = (f) => fetch(f).then((r) => r.json());
  const [data, designText, evolutions, tms, characters, ...leaderFiles] = await Promise.all([
    loadData("data"),
    fetch("DESIGN.md").then((r) => r.text()),
    getJson("data/evolutions.json"),
    getJson("data/tms.json"),
    getJson("data/characters.json"),
    ...[1, 2, 3, 4, 5].map((g) => getJson(`data/leaders/gen${g}.json`)),
  ]);
  applySpriteMode(data, loadMeta().sprites);
  watchSpriteFit();
  setCharacters(characters);
  setSpriteOffsets(await getJson("data/sprite-offsets.json").catch(() => ({})));
  const rules = parseRules(designText, data);
  const ctx = {
    data,
    rules,
    dex: new Pokedex(data, evolutions, rules),
    tms,
    leaders: Object.fromEntries(leaderFiles.map((f) => [f.gen, f])),
  };
  // The debug panel (press L) can bring you back to the screen you were on
  new DevTools(new RunUI(ctx), ctx).boot();
}

boot().catch((err) => {
  console.error(err);
  const hub = document.getElementById("hub");
  hub.hidden = false;
  hub.innerHTML = `<h1>Something went wrong</h1><p>${err.message}</p>
    <p>Open the game through a local server (e.g. Live Server), not as a file.</p>`;
});
