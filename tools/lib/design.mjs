// =====================================================
// READ TABLES FROM DESIGN.md (Node wrapper)
// =====================================================

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readTable as readTableFromText, parseProgression } from "../../js/game/design-tables.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const readDesign = () => fs.readFile(path.join(ROOT, "DESIGN.md"), "utf8");

export async function readTable(headingPrefix) {
  return readTableFromText(await readDesign(), headingPrefix);
}

export async function readProgression() {
  return parseProgression(await readDesign());
}
