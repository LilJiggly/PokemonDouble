// =====================================================
// TARGET ICON
// -----------------------------------------------------
// A tiny picture of a double battle (foes on top, you and your partner below) with the Pokémon a move hits
// filled in: red = foes it hits, green = you / your partner. Used on move cards, in the battle move menu and
// in the Moves bar. Damaging moves show every Pokémon they hit in red, even your partner. The text is the tooltip.
// =====================================================

const SPOT = { foeL: [6, 5], foeR: [18, 5], me: [6, 16], ally: [18, 16] };

// foe / me / ally: filled spots. maybe: spots that may be hit (dotted). bar: a line for field moves
const PATTERNS = {
  "selected-pokemon": { foe: ["foeL"], text: "One Pokémon of your choice (usually a foe)" },
  "selected-pokemon-me-first": { foe: ["foeL"], text: "One Pokémon of your choice" },
  "all-opponents": { foe: ["foeL", "foeR"], text: "Both foes" },
  "all-other-pokemon": { foe: ["foeL", "foeR"], ally: ["ally"], text: "Everyone else, including your partner" },
  "random-opponent": { maybe: ["foeL", "foeR"], text: "One random foe" },
  user: { me: ["me"], text: "Itself" },
  ally: { ally: ["ally"], text: "Your partner" },
  "user-or-ally": { maybe: ["me", "ally"], text: "Itself or your partner" },
  "user-and-allies": { me: ["me"], ally: ["ally"], text: "You and your partner" },
  "users-field": { me: ["me"], ally: ["ally"], bar: "mine", text: "Your whole side" },
  "opponents-field": { foe: ["foeL", "foeR"], bar: "foe", text: "The foes' side" },
  "entire-field": { maybe: ["foeL", "foeR", "me", "ally"], bar: "all", text: "The whole field" },
  "all-pokemon": { foe: ["foeL", "foeR"], me: ["me"], ally: ["ally"], text: "Every Pokémon" },
  "specific-move": { foe: ["foeL"], text: "Depends: the one that hit you for Counter and Mirror Coat" },
};

export function targetText(target) {
  return PATTERNS[target]?.text ?? "";
}

// move (optional): when it is a damaging move, your partner and you are red too if they get hit (they take damage)
export function targetIcon(target, move = null) {
  const p = PATTERNS[target];
  if (!p) return "";
  const dot = (key) => {
    const [x, y] = SPOT[key];
    const damaging = !!move && move.category !== "status";
    const cls = (p.foe ?? []).includes(key) ? "foe"
      : (p.me ?? []).includes(key) ? (damaging ? "foe" : "me")
      : (p.ally ?? []).includes(key) ? (damaging ? "foe" : "ally")
      : (p.maybe ?? []).includes(key) ? "maybe" : "";
    return `<circle class="ti-dot ${cls}" cx="${x}" cy="${y}" r="3.4"/>`;
  };
  const bar = p.bar === "foe" ? `<line class="ti-bar foe" x1="1" y1="9.6" x2="23" y2="9.6"/>`
    : p.bar === "mine" ? `<line class="ti-bar me" x1="1" y1="12.4" x2="23" y2="12.4"/>`
    : p.bar === "all" ? `<line class="ti-bar" x1="1" y1="11" x2="23" y2="11"/>` : "";
  return `<span class="target-icon" title="Hits: ${p.text}" aria-label="Hits: ${p.text}"><svg viewBox="0 0 24 22" aria-hidden="true">${bar}${Object.keys(SPOT).map(dot).join("")}</svg></span>`;
}

// Physical / Special / Status: one plain shape each, in the text colour (star, ring, bar)
const CATEGORY_ICONS = {
  physical: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.2 9.8 6.2 14.8 8 9.8 9.8 8 14.8 6.2 9.8 1.2 8 6.2 6.2Z"/></svg>`,
  special: `<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>`,
  status: `<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="6.6" width="12" height="2.8" rx="1.4"/></svg>`,
};
const CATEGORY_TEXT = { physical: "Physical: uses Attack and Defense", special: "Special: uses Sp. Atk and Sp. Def", status: "Status: no direct damage" };

export function categoryIcon(category) {
  const svg = CATEGORY_ICONS[category];
  return svg ? `<span class="cat-icon ${category}" title="${CATEGORY_TEXT[category]}">${svg}</span>` : "";
}
