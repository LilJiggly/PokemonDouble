// =====================================================
// POKÉMON DOUBLE — START UP
// -----------------------------------------------------
// Loads the data and the rule tables from DESIGN.md,
// then hands over to the run screens.
// =====================================================

import { loadData } from "./engine/data.js";
import { setCharacters } from "./game/characters.js";
import { loadMeta, saveMeta, onSave, persistMigration } from "./game/meta.js";
import { backfillChallenges } from "./game/challenges.js";
import { initCloud, noteLocalSave } from "./game/cloud.js";
import { applySpriteMode } from "./game/sprite-mode.js";
import { watchSpriteFit } from "./ui/sprite-fit.js";
import { setSpriteOffsets } from "./ui/sprite-align.js";
import { parseRules } from "./game/rules.js";
import { setFriendshipSpecies } from "./game/unlocks.js";
import { Pokedex } from "./game/pokedex.js";
import { RunUI } from "./ui/run-screens.js";
import { DevTools } from "./ui/dev-tools.js";

async function boot() {
  persistMigration(); // saves from before the skill tree: refund the old upgrades once
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
    ...[1, 2, 3, 4, 5].map((g) => getJson(`data/leaders/evil${g}.json`).catch(() => null)), // the evil team paths
  ]);
  const evilFiles = leaderFiles.splice(5);
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
    evil: Object.fromEntries(evilFiles.filter(Boolean).map((f) => [Number(String(f.gen).replace("e", "")), f])), // evil paths by generation (Run: settings.path "evil")
  };
  // Wins saved in the Hall of Fame count for the challenges they fit, even from before the challenge existed
  try {
    const hof = JSON.parse(localStorage.getItem("pd.hallOfFame") ?? "[]");
    const meta = loadMeta();
    if (hof.length && backfillChallenges(meta, hof, ctx)) saveMeta(meta);
  } catch { /* ignore */ }
  setFriendshipSpecies(Object.entries(ctx.dex.evolvesFrom).filter(([, e]) => e.method.kind === "friendship").map(([k]) => k));
  // The debug panel (press L) can bring you back to the screen you were on
  new DevTools(new RunUI(ctx), ctx).boot();
  onSave(noteLocalSave); // cloud save: copies every save to Firestore when signed in (see js/firebase-config.js)
  initCloud();
}

boot().catch((err) => {
  console.error(err);
  const hub = document.getElementById("hub");
  hub.hidden = false;
  hub.innerHTML = `<h1>Something went wrong</h1><p>${err.message}</p>
    <p>Open the game through a local server (e.g. Live Server), not as a file.</p>`;
});
