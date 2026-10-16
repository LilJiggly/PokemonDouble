// =====================================================
// DOWNLOAD PLAYER-CHARACTER SPRITES AND BUILD data/characters.json
// Usage: node tools/fetch-back-sprites.mjs
// Back sprites: Bulbagarden Archives ("Trainer back sprites"). The category page blocks scripts,
//   so the file list and links come from sprites.html (the saved gallery page in the project folder).
// Front sprites (picker, hub card): Pokémon Showdown (https://play.pokemonshowdown.com/sprites/trainers/).
//   Characters without a front sprite there are left out (Old Man, Dude, Pokémon Dude, Roxie's Father).
// Nate and Rosa: only the Black 2 / White 2 version (the Pokéstar costumes are left out).
// Saves images/trainers/back/<id>.png and images/trainers/<id>.png; existing files are skipped.
// =====================================================

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TRAINERS = path.join(ROOT, "images", "trainers");
const SHOWDOWN = "https://play.pokemonshowdown.com/sprites/trainers";

// id, name, game, generation group, Bulbagarden back file, Showdown front name (null = none)
// Ids of the first eight and of trainers that are also opponents match images/trainers/<id>.png.
const C = (id, name, game, gen, back, front) => ({ id, name, game, gen, back, front });
const CHARACTERS = [
  C("red-gb", "Red", "Red / Blue", 1, "RGB_Red_Back.png", "red-gen1rb"),
  C("oak", "Prof. Oak", "Yellow", 1, "Y_Oak_Back.png", "oak-gen1"),
  C("ethan-gsc", "Ethan", "Gold / Silver / Crystal", 2, "GSC_Ethan_Back.png", "ethan-gen2"),
  C("kris", "Kris", "Crystal", 2, "C_Kris_Back.png", "kris-gen2"),
  C("ethan-sw97", "Ethan", "Spaceworld '97", 2, "SW97_Ethan_Back.png", "ethan-gen2"),
  C("ethan", "Ethan", "HeartGold / SoulSilver", 2, "HGSS_Ethan_Back.png", "ethan"),
  C("lyra", "Lyra", "HeartGold / SoulSilver", 2, "HGSS_Lyra_Back.png", "lyra"),
  C("lance", "Lance", "HeartGold / SoulSilver", 2, "HGSS_Lance_Back.png", "lance"),
  C("silver", "Silver", "HeartGold / SoulSilver", 2, "HGSS_Silver_Back.png", "silver"),
  C("gold-beta", "Gold", "HeartGold beta", 2, "GoldHGSS_beta_back.png", "ethan"),
  C("red", "Red", "FireRed / LeafGreen", 3, "FRLG_Red_Back.png", "red-gen3"),
  C("leaf", "Leaf", "FireRed / LeafGreen", 3, "FRLG_Leaf_Back.png", "leaf-gen3"),
  C("brendan-rs", "Brendan", "Ruby / Sapphire", 3, "RS_Brendan_Back.png", "brendan-gen3rs"),
  C("may-rs", "May", "Ruby / Sapphire", 3, "RS_May_Back.png", "may-gen3rs"),
  C("brendan", "Brendan", "Emerald", 3, "E_Brendan_Back.png", "brendan-e"),
  C("may", "May", "Emerald", 3, "E_May_Back.png", "may-e"),
  C("red-e", "Red", "Emerald (Battle Frontier)", 3, "E_Red_Back.png", "red-gen3"),
  C("leaf-e", "Leaf", "Emerald (Battle Frontier)", 3, "E_Leaf_Back.png", "leaf-gen3"),
  C("steven", "Steven", "Emerald", 3, "E_Steven_Back.png", "steven-gen3"),
  C("wally", "Wally", "Ruby / Sapphire", 3, "RS_Wally_Back.png", "wally-gen3"),
  C("lucas", "Lucas", "Platinum", 4, "Pt_Lucas_Back.png", "lucas"),
  C("dawn", "Dawn", "Platinum", 4, "Pt_Dawn_Back.png", "dawn"),
  C("barry", "Barry", "Platinum", 4, "Pt_Barry_Back.png", "barry"),
  C("lucas-dp", "Lucas", "Diamond / Pearl", 4, "DP_Lucas_Back.png", "lucas"),
  C("dawn-dp", "Dawn", "Diamond / Pearl", 4, "DP_Dawn_Back.png", "dawn"),
  C("barry-dp", "Barry", "Diamond / Pearl", 4, "DP_Barry_Back.png", "barry"),
  C("buck", "Buck", "Diamond / Pearl", 4, "DP_Buck_Back.png", "buck"),
  C("cheryl", "Cheryl", "Diamond / Pearl", 4, "DP_Cheryl_Back.png", "cheryl"),
  C("marley", "Marley", "Diamond / Pearl", 4, "DP_Marley_Back.png", "marley"),
  C("mira", "Mira", "Diamond / Pearl", 4, "DP_Mira_Back.png", "mira"),
  C("riley", "Riley", "Diamond / Pearl", 4, "DP_Riley_Back.png", "riley"),
  C("hilbert", "Hilbert", "Black / White", 5, "BW_Hilbert_Back.png", "hilbert"),
  C("hilda", "Hilda", "Black / White", 5, "BW_Hilda_Back.png", "hilda"),
  C("cheren-bw", "Cheren", "Black / White", 5, "BW_Cheren_Back.png", "cheren"),
  C("juniper", "Prof. Juniper", "Black / White", 5, "BW_Juniper_Back.png", "juniper"),
  C("nate", "Nate", "Black 2 / White 2", 5, "B2W2_Nate_Back.png", "nate"),
  C("rosa", "Rosa", "Black 2 / White 2", 5, "B2W2_Rosa_Back.png", "rosa"),
  C("bianca", "Bianca", "Black 2 / White 2", 5, "B2W2_Bianca_Back.png", "bianca"),
  C("cheren", "Cheren", "Black 2 / White 2", 5, "B2W2_Cheren_Back.png", "cheren"),
  C("hugh", "Hugh", "Black 2 / White 2", 5, "B2W2_Hugh_Back.png", "hugh"),
  C("chili", "Chili", "Black 2 / White 2", 5, "B2W2_Chili_Back.png", "chili"),
  C("cilan", "Cilan", "Black 2 / White 2", 5, "B2W2_Cilan_Back.png", "cilan"),
  C("cress", "Cress", "Black 2 / White 2", 5, "B2W2_Cress_Back.png", "cress"),
];

// Back sprite files in sprites.html → full-size image link (thumbnail links point at the original)
const html = await fs.readFile(path.join(ROOT, "sprites.html"), "utf8");
const links = new Map();
for (const m of html.matchAll(/<img[^>]*src="(https:\/\/archives\.bulbagarden\.net\/media\/upload\/[^"]+\.png)"/g)) {
  const url = m[1].replace("/thumb/", "/").replace(/\/[^/]*$/, (x) => x).replace(/(\.png)\/\d+px-[^/]+$/, "$1");
  const file = decodeURIComponent(url.split("/").pop());
  links.set(file, url);
}
const linkFor = (file) => links.get(decodeURIComponent(file));

const exists = (f) => fs.access(f).then(() => true, () => false);
async function save(url, dest) {
  if (await exists(dest)) return 0;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buf);
  return buf.length;
}

let bytes = 0, backs = 0, fronts = 0, extra = 0;
const problems = [];
const out = [];
for (const c of CHARACTERS) {
  const url = linkFor(c.back);
  const backDest = path.join(TRAINERS, "back", `${c.id}.png`);
  try {
    if (!url && !(await exists(backDest))) throw new Error(`no link for ${c.back}`);
    const n = url ? await save(url, backDest) : 0;
    if (n) { bytes += n; backs++; }
  } catch (e) { problems.push(`back ${c.id}: ${e.message}`); continue; }
  const frontDest = path.join(TRAINERS, `${c.id}.png`);
  let hasFront = await exists(frontDest);
  if (!hasFront && c.front) {
    try { const n = await save(`${SHOWDOWN}/${c.front}.png`, frontDest); bytes += n; fronts++; hasFront = true; }
    catch (e) { problems.push(`front ${c.id}: ${e.message}`); }
  }
  out.push({ id: c.id, name: c.name, game: c.game, gen: c.gen, front: hasFront ? `images/trainers/${c.id}.png` : `images/trainers/back/${c.id}.png`, back: `images/trainers/back/${c.id}.png` });
}

await fs.writeFile(path.join(ROOT, "data", "characters.json"), JSON.stringify(out, null, 1) + "\n");
console.log(`${out.length} characters. New: ${backs} back sprites, ${fronts} front sprites (${Math.round(bytes / 1024)} KB).`);
if (problems.length) console.log("Problems:\n" + problems.join("\n"));
