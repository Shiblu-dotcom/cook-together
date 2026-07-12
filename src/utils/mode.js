// The two ways to play a game night. Both keep the secret ingredients —
// they're what make it a game. The difference is only in how it ends:
//   "fun" (default) — no winner, no plate score, no compatibility number.
//                     The judge still reacts warmly to the plate and to each
//                     person's part, and the title, prediction, badges, and
//                     the Word all survive.
//   "win"           — the full contest: plate score, winner, compatibility.
// Repair mode never touches this — the calm night has its own rules.

/**
 * Enforce the mode contract on whatever the judge returned. In "fun" mode
 * the competitive fields are stripped no matter what the AI said, so no
 * screen downstream can ever render a winner, a score, or a percentage.
 */
export const normalizeJudgmentForMode = (judgment, mode) => {
  if (mode !== "fun") return judgment;
  return {
    ...judgment,
    winner: "",
    winnerReason: "",
    plateScore: 0,
    compatibilityScore: 0,
    compatibilityReason: "",
  };
};
