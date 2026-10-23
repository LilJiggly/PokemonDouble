// =====================================================
// POKÉMON SPRITE STYLE
// -----------------------------------------------------
// "gen4"     Gen 4 art (Platinum / HeartGold) for #1–493, static (Gen 5 art for #494–649)
// "gen5"     Gen 5 (Black / White) art for everything, static
// "gen5-ani" Gen 5 art for everything, animated (GIF)
// Rewrites each Pokémon's sprite paths in place, so the rest of the game just uses species.sprites.
// =====================================================

export const SPRITE_MODES = [
  { id: "gen5", label: "Static", hint: "Gen 5 art, still images" },
  { id: "gen5-ani", label: "Moving", hint: "Gen 5 art, animated" },
  { id: "gen4", label: "Gen 4 (static)", hint: "Platinum / HeartGold art for Gen 1–4, cut off at the textbox" },
];
export const DEFAULT_SPRITE_MODE = "gen5";

const KINDS = { front: "front", back: "back", frontShiny: "front-shiny", backShiny: "back-shiny" };

export function applySpriteMode(data, mode = DEFAULT_SPRITE_MODE) {
  if (!SPRITE_MODES.some((m) => m.id === mode)) mode = DEFAULT_SPRITE_MODE;
  for (const p of data.pokemon) {
    const gen4 = mode === "gen4" && p.id <= 493;
    const dir = gen4 ? "gen4" : mode === "gen5-ani" ? "gen5-ani" : "gen5";
    const ext = mode === "gen5-ani" ? "gif" : "png";
    for (const [key, folder] of Object.entries(KINDS)) p.sprites[key] = `images/sprites/${dir}/${folder}/${p.id}.${ext}`;
  }
  // Castform's Sunny / Rainy / Snowy forms (swapped in by the Forecast ability)
  const castform = data.pokemon.find((p) => p.key === "castform");
  if (castform) {
    const dir = mode === "gen5-ani" ? "gen5-ani" : mode === "gen4" ? "gen4" : "gen5";
    const ext = mode === "gen5-ani" ? "gif" : "png";
    castform.forms = Object.fromEntries(["sunny", "rainy", "snowy"].map((form) => [form,
      Object.fromEntries(Object.entries(KINDS).map(([key, folder]) => [key, `images/sprites/${dir}/${folder}/${castform.id}-${form}.${ext}`]))]));
  }
  data.spriteMode = mode;
}
