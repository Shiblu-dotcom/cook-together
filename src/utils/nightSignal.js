// The conductor. The check-in captures two private signals per person —
// valence (rough day → great day) and energy (wiped → wired), both 1–5 —
// and this module combines them into one night signal that every stage of
// the game listens to: theme, ingredients, questions, twist, Chef, judge,
// and the Word.
//
// The prime directive is SUBTLETY: the struggling partner should just
// experience a night that happened to be kind. Nothing downstream may ever
// say "because you had a bad day". And because check-ins are self-reported
// (people can be wrong, or hide), the steering stays gentle — it nudges,
// it never forces a mood nobody asked for.

const up = (v) => v >= 4;
const down = (v) => v <= 2;
const wiped = (e) => e <= 2;
const wired = (e) => e >= 4;

/**
 * @param {object} checkIn — expects p1Valence/p1Energy/p2Valence/p2Energy
 *   (1–5, default 3 = neutral, e.g. when the couple skipped the check-in).
 * @returns {{
 *   coupleState: "celebration"|"comfort"|"gentle"|"divergent"|"balanced",
 *   downPartner: null|"p1"|"p2",
 *   easyFor: null|"p1"|"p2",
 *   twistStyle: "fun"|"hard"|"any",
 *   questionToneOverride: null|"supportive",
 * }}
 */
export const computeNightSignal = (checkIn = {}) => {
  const v1 = Number(checkIn.p1Valence ?? 3);
  const e1 = Number(checkIn.p1Energy ?? 3);
  const v2 = Number(checkIn.p2Valence ?? 3);
  const e2 = Number(checkIn.p2Energy ?? 3);

  // ── Couple state ─────────────────────────────────────────────────────────
  let coupleState = "balanced";
  let downPartner = null;

  if (up(v1) && up(v2)) {
    coupleState = "celebration";
  } else if (down(v1) && down(v2)) {
    coupleState = "comfort";
  } else if (down(v1) || down(v2)) {
    // One partner is down (the other is neutral or up) — the delicate night.
    coupleState = "divergent";
    downPartner = down(v1) ? "p1" : "p2";
  } else if (wiped(e1) && wiped(e2)) {
    coupleState = "gentle"; // nobody's sad, everybody's tired
  }

  // ── Effort follows energy ────────────────────────────────────────────────
  // A rough day drains like low energy does. Whoever has meaningfully less
  // in the tank draws the forgiving ingredient — silently.
  let easyFor = null;
  const load1 = e1 + (down(v1) ? -1 : 0);
  const load2 = e2 + (down(v2) ? -1 : 0);
  if (load1 <= 2 && load2 >= 3) easyFor = "p1";
  else if (load2 <= 2 && load1 >= 3) easyFor = "p2";

  // ── Twist difficulty follows the room ────────────────────────────────────
  let twistStyle = "any";
  if (coupleState === "comfort" || coupleState === "gentle" || coupleState === "divergent") {
    twistStyle = "fun"; // keep it light when anyone needs a breather
  } else if (wired(e1) && wired(e2)) {
    twistStyle = "hard"; // both buzzing — spice it up
  }

  // ── Questions never probe someone already raw ────────────────────────────
  let questionToneOverride = null;
  if (coupleState === "comfort" || coupleState === "divergent") {
    questionToneOverride = "supportive";
  }

  return { coupleState, downPartner, easyFor, twistStyle, questionToneOverride };
};

// ── The shape of the night ──────────────────────────────────────────────────
// One plate, always — one kitchen can't host two separate dishes. The couple
// state decides how that plate is split:
//   "two-component" — ambitious: each person owns a distinct part of one plate
//   "one-dish"      — easy: one simple dish, two roles (prep / heat)
// Both keep the secrets, the reveal, and per-person contribution in judging.
export const formatForNight = (signal = {}, checkIn = {}, { newPair = false, gamesPlayed = 0 } = {}) => {
  const e1 = Number(checkIn.p1Energy ?? 3);
  const e2 = Number(checkIn.p2Energy ?? 3);

  // Two components: the sauce & side is the lighter part — it goes, silently,
  // to whoever has less in the tank tonight.
  const componentRoles = () =>
    signal.easyFor === "p1"
      ? { p1: "the sauce & side", p2: "the main" }
      : { p1: "the main", p2: "the sauce & side" };

  // One dish: prep is the kinder job — hands busy, mind quiet. The heavier
  // day gets it; the steadier partner takes the stove and the timing.
  const kitchenRoles = () => {
    const restFor = signal.downPartner || signal.easyFor;
    return restFor === "p2" ? { p1: "heat", p2: "prep" } : { p1: "prep", p2: "heat" };
  };

  // New pairs always get the gentle shape, whatever the check-in says.
  if (newPair) return { format: "one-dish", roles: kitchenRoles() };

  switch (signal.coupleState) {
    case "celebration": // both arrived full — give them something to build
      return { format: "two-component", roles: componentRoles() };
    case "comfort":     // heavy day — one simple dish, shoulder to shoulder
    case "gentle":      // running on empty — same
    case "divergent":   // one up, one down — the easy shape, tilted kindly
      return { format: "one-dish", roles: kitchenRoles() };
    default: {
      // Balanced: energy decides. Both buzzing → build something; otherwise
      // ambitious only once they know the game.
      if (e1 >= 4 && e2 >= 4) return { format: "two-component", roles: componentRoles() };
      return gamesPlayed < 2
        ? { format: "one-dish", roles: kitchenRoles() }
        : { format: "two-component", roles: componentRoles() };
    }
  }
};

/**
 * Renders the night signal as a prompt block for the AI calls (context +
 * judgment). Includes the subtlety guardrail every downstream prompt needs.
 */
export const describeNightForAI = (night, p1Name, p2Name) => {
  if (!night) return "";
  const who = night.downPartner === "p1" ? p1Name : night.downPartner === "p2" ? p2Name : null;
  const stateLine = {
    celebration: "Both had a great day — this is a celebration night. Ambitious themes, playful energy, roasting is welcome.",
    comfort: "Both had a rough day — this is a comfort night. Warm, nostalgic, gentle. No pressure, no mockery.",
    gentle: "Both are running on empty tonight. Keep everything low-effort and easygoing.",
    divergent: `${who} had a hard day while their partner is doing well — the delicate night. Lean warm and low-stakes. Be quietly protective of ${who}: never mock them, and if the scores are close, it's fine to let ${who} edge the win — but keep it believable.`,
    balanced: "An ordinary day for both — play it straight and let the vibe they picked lead.",
  }[night.coupleState];

  return `
TONIGHT'S EMOTIONAL READ (private, from their check-ins): ${stateLine}
SUBTLETY RULE (absolute): never mention their moods, their day ratings, or that the night adapts to them. No "after the day you had". The kindness must be invisible — they should just experience a night that happened to fit.`;
};
