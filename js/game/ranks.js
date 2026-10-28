// =====================================================
// LEADERBOARD RANKS
// -----------------------------------------------------
// Everyone starts at the bottom of the alphabet (Z) and climbs
// towards A. Points come from the three public numbers on a
// player's leaderboard line:
//   +1 per battle of their furthest run (up to 14)
//   +10 per Champion win
//   +10 more per flawless win (nobody fell)
// The letter steps get wider towards the top (see RANK_STEP).
// =====================================================

export const POINTS = { best: 1, win: 10, clean: 10 };
export const RANK_STEP = 3; // points for the first step; letter n above Z needs RANK_STEP * n^1.5
const LETTERS = "ZYXWVUTSRQPONMLKJIHGFEDCBA".split("");

export const rankScore = (p) => (p?.best ?? 0) * POINTS.best + (p?.wins ?? 0) * POINTS.win + (p?.cleanWins ?? 0) * POINTS.clean;
const need = (n) => Math.round(RANK_STEP * n ** 1.5);

// { letter, score, from, next }: points where this letter starts and where the next one does (null at A)
export function rankOf(score) {
  let n = 0;
  while (n < LETTERS.length - 1 && score >= need(n + 1)) n++;
  return { letter: LETTERS[n], score, from: need(n), next: n < LETTERS.length - 1 ? need(n + 1) : null };
}
