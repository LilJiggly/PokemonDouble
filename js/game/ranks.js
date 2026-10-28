// =====================================================
// LEADERBOARD RANKS
// -----------------------------------------------------
// Everyone starts at the bottom of the alphabet (Z) and climbs
// towards A. Points come from the public numbers on a
// player's leaderboard line:
//   +1 per battle of their furthest run (up to 14)
//   +10 per Champion win
//   +10 more per flawless win (nobody fell)
//   +1 per badge collected (up to 40)
//   +1 per trainer unlocked beyond the ones everyone starts with
// The letter steps get wider towards the top (see RANK_STEP).
// =====================================================

export const POINTS = { best: 1, win: 10, clean: 10, badge: 1, trainer: 1 };
export const START_TRAINERS = 8; // trainers everyone has from the start (they give no points)
export const RANK_STEP = 12; // points for the first step
export const RANK_POWER = 1.25; // the steps get wider towards A: letter n above Z needs RANK_STEP * n^RANK_POWER points
const LETTERS = "ZYXWVUTSRQPONMLKJIHGFEDCBA".split("");

export const rankScore = (p) => (p?.best ?? 0) * POINTS.best + (p?.wins ?? 0) * POINTS.win + (p?.cleanWins ?? 0) * POINTS.clean
  + (p?.badges ?? 0) * POINTS.badge + Math.max(0, (p?.trainers ?? 0) - START_TRAINERS) * POINTS.trainer;
const need = (n) => Math.round(RANK_STEP * n ** RANK_POWER);

// { letter, score, from, next }: points where this letter starts and where the next one does (null at A)
export function rankOf(score) {
  let n = 0;
  while (n < LETTERS.length - 1 && score >= need(n + 1)) n++;
  return { letter: LETTERS[n], score, from: need(n), next: n < LETTERS.length - 1 ? need(n + 1) : null };
}
