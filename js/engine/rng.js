// =====================================================
// SEEDED RANDOM NUMBERS
// -----------------------------------------------------
// The RNG state lives inside the battle state, so a
// saved battle resumes with exactly the same rolls.
// (mulberry32)
// =====================================================

export function nextRandom(state) {
  let t = (state.rng = (state.rng + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Integer between min and max (both included)
export function randomInt(state, min, max) {
  return min + Math.floor(nextRandom(state) * (max - min + 1));
}

// true with the given percent chance (0–100)
export function chance(state, percent) {
  return nextRandom(state) * 100 < percent;
}

export function pick(state, list) {
  return list[Math.floor(nextRandom(state) * list.length)];
}
