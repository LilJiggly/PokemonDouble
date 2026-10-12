// =====================================================
// READ TABLES FROM DESIGN.md
// -----------------------------------------------------
// DESIGN.md is the editable source of truth for the run
// progression (§3a). This parser works on the file's
// text, so both the browser game and the Node tools
// use exactly the same numbers.
// =====================================================

// Rows of the first markdown table after a heading starting with `headingPrefix`
export function readTable(markdown, headingPrefix) {
  const lines = markdown.split("\n");
  const start = lines.findIndex((l) => l.startsWith(headingPrefix));
  if (start === -1) throw new Error(`Heading not found in DESIGN.md: ${headingPrefix}`);

  const rows = [];
  let header = null;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("#")) break;
    if (!line.startsWith("|")) {
      if (header) break;
      continue;
    }
    const cells = line.slice(1, -1).split("|").map((c) => c.trim());
    if (!header) header = cells;
    else if (!cells.every((c) => /^-+$/.test(c))) {
      rows.push(Object.fromEntries(header.map((h, j) => [h, cells[j]])));
    }
  }
  return rows;
}

// §3a as numbers: one entry per battle (# 0 = starter draft)
export function parseProgression(markdown) {
  const num = (v) => (v === undefined || v === "—" || v === "" ? null : Number(v.replace("%", "")));
  return readTable(markdown, "### 3a.").map((r) => ({
    order: num(r["#"]),
    opponent: r["Opponent"].replace(/_/g, ""),
    level: num(r["Enemy level"]),
    levelBonus: num(r["Level bonus"]) ?? 0,
    teamSize: num(r["Enemy team size"]),
    recruitOptions: num(r["Recruit options"]),
    recruitPicks: num(r["Recruit picks"]),
    odds: {
      common: num(r["Common"]),
      uncommon: num(r["Uncommon"]),
      rare: num(r["Rare"]),
      epic: num(r["Epic"]),
      legendary: num(r["Legendary"]),
    },
    itemOptions: num(r["Item options"]),
    itemPicks: num(r["Item picks"]),
  }));
}
