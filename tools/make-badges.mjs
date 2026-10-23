// =====================================================
// MAKE BADGE IMAGES
// Usage: node tools/make-badges.mjs
// Draws 40 gym badge icons (5 Challenge Gens × 8 gyms) as SVG in images/badges/<gen>-<gym>.svg.
// The shape depends on the gym number, the colour on the leader's type, the corner mark on the gen.
// They are placeholders: drop real badge art (same file names) into images/badges/ to replace them.
// =====================================================

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "images", "badges");
const COLORS = {
  normal: "#a8a878", fire: "#f08030", water: "#6890f0", electric: "#f8d030", grass: "#78c850", ice: "#98d8d8", fighting: "#c03028",
  poison: "#a040a0", ground: "#e0c068", flying: "#a890f0", psychic: "#f85888", bug: "#a8b820", rock: "#b8a038", ghost: "#705898",
  dragon: "#7038f8", dark: "#705848", steel: "#b8b8d0",
};
const ROMAN = ["", "I", "II", "III", "IV", "V"];

const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v + amt * (amt < 0 ? v : 255 - v))));
  return `#${[n >> 16, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, "0")).join("")}`;
};
const star = (cx, cy, R, r, n = 5) => Array.from({ length: n * 2 }, (_, i) => {
  const a = (Math.PI * i) / n - Math.PI / 2, rad = i % 2 ? r : R;
  return `${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`;
}).join(" ");
const poly = (cx, cy, R, n, rot = -Math.PI / 2) => Array.from({ length: n }, (_, i) => {
  const a = rot + (2 * Math.PI * i) / n;
  return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`;
}).join(" ");

// 8 shapes, one per gym number: [outer, inner]
const SHAPES = [
  (c) => [`<circle cx="32" cy="32" r="26" fill="${c}"/>`, `<circle cx="32" cy="32" r="12" fill="#fff" fill-opacity=".55"/>`],
  (c) => [`<polygon points="${poly(32, 32, 28, 6)}" fill="${c}"/>`, `<polygon points="${poly(32, 32, 13, 6)}" fill="#fff" fill-opacity=".55"/>`],
  (c) => [`<polygon points="${star(32, 33, 29, 13)}" fill="${c}"/>`, `<circle cx="32" cy="33" r="6" fill="#fff" fill-opacity=".6"/>`],
  (c) => [`<polygon points="32,4 58,32 32,60 6,32" fill="${c}"/>`, `<polygon points="32,18 46,32 32,46 18,32" fill="#fff" fill-opacity=".55"/>`],
  (c) => [`<path d="M10 8h44v26c0 12-10 20-22 24C20 54 10 46 10 34z" fill="${c}"/>`, `<path d="M20 16h24v17c0 7-6 12-12 14-6-2-12-7-12-14z" fill="#fff" fill-opacity=".55"/>`],
  (c) => [Array.from({ length: 6 }, (_, i) => `<ellipse cx="32" cy="17" rx="9" ry="14" transform="rotate(${i * 60} 32 32)" fill="${c}"/>`).join(""), `<circle cx="32" cy="32" r="8" fill="#fff" fill-opacity=".65"/>`],
  (c) => [`<path d="M32 4C44 20 54 28 54 40a22 22 0 0 1-44 0C10 28 20 20 32 4z" fill="${c}"/>`, `<ellipse cx="25" cy="38" rx="6" ry="10" fill="#fff" fill-opacity=".5" transform="rotate(20 25 38)"/>`],
  (c) => [`<polygon points="${poly(32, 32, 28, 8, -Math.PI / 8)}" fill="${c}"/>`, `<polygon points="${star(32, 32, 15, 7, 4)}" fill="#fff" fill-opacity=".6"/>`],
];

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  let n = 0;
  for (const gen of [1, 2, 3, 4, 5]) {
    const leaders = JSON.parse(await fs.readFile(path.join(ROOT, "data", "leaders", `gen${gen}.json`), "utf8")).opponents;
    for (let order = 1; order <= 8; order++) {
      const color = COLORS[leaders[order - 1].theme] ?? COLORS.normal;
      const [outer, inner] = SHAPES[order - 1](color);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs><radialGradient id="g" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></radialGradient></defs>
  <g stroke="${shade(color, -0.45)}" stroke-width="3" stroke-linejoin="round">${outer}</g>
  <g stroke="none">${outer.replace(/ fill="[^"]*"/g, ' fill="url(#g)"')}</g>
  ${inner}
  <text x="58" y="61" text-anchor="end" font-family="Georgia, serif" font-weight="bold" font-size="12" fill="#fff" stroke="#000" stroke-opacity=".6" stroke-width="2.5" paint-order="stroke">${ROMAN[gen]}</text>
</svg>
`;
      await fs.writeFile(path.join(OUT, `${gen}-${order}.svg`), svg);
      n++;
    }
  }
  console.log(`${n} badge images in images/badges/`);
}
main();
