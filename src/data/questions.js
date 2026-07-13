export const QUESTIONS = {
  flirty: [
    "What's one thing your partner does that you find secretly adorable?",
    "If tonight's dish was named after a moment with your partner, what would it be called?",
    "What's one thing you wish your partner knew you loved about them?",
    "Describe your partner in exactly 3 ingredients. Go.",
    "What's the most attractive thing your partner has done in the kitchen?",
    "If you could steal one thing from your partner's personality, what would it be?",
  ],
  deep: [
    "What's something you've been meaning to tell your partner but haven't yet?",
    "What's a dream you have that you haven't talked about much?",
    "What's something your partner did recently that made you proud of them?",
    "If you could cook one meal for your partner on the hardest day of their life, what would it be and why?",
    "What's one fear you have that you've never fully shared with your partner?",
    "What moment with your partner do you replay in your head most often?",
  ],
  funny: [
    "What's the worst meal you've ever cooked? Be honest.",
    "If this dish goes wrong, what's your excuse?",
    "What would Gordon Ramsay say about your cooking right now?",
    "Rate your partner's cooking face right now out of 10. No lying.",
    "If your cooking style was a movie genre, what would it be?",
    "What's the most ridiculous thing you've ever eaten and pretended to like?",
  ],
  mix: [
    "One word that describes your partner when they're focused.",
    "What's something your partner makes you want to be better at?",
    "If this meal had a soundtrack, what song would it be?",
    "What habit of your partner's secretly makes you smile?",
  ],
  // Supportive — for comfort and divergent nights. Gentle, low-exposure,
  // bridge-building. Never probing: nobody already raw gets cracked open.
  supportive: [
    "What's one thing your partner could take off your plate this week?",
    "What's something small that always makes your partner feel better?",
    "What's one thing that went right today, even a tiny one?",
    "If you two could escape anywhere this weekend, where would you take your partner?",
    "What meal from your past always feels like a hug?",
    "What's one way your partner made your life easier recently?",
  ],
};

// Depth tags — every question is light or deep. Light opens the door,
// deep walks through it. Each night asks light FIRST, deep second: escalation
// inside a single night, separate from the across-nights trust gating below.
const DEEP_TAGGED = new Set([
  ...QUESTIONS.deep,
  "What's one thing you wish your partner knew you loved about them?", // flirty
  "What's something your partner makes you want to be better at?", // mix
  // Supportive's gentle-deep — opening up without probing:
  "What's one thing your partner could take off your plate this week?",
  "What's one way your partner made your life easier recently?",
]);
export const questionDepth = (q) => (DEEP_TAGGED.has(q) ? "deep" : "light");

// Rotation memory: questions a couple has already been asked, persisted so
// repeat game nights get fresh questions until the pool is exhausted.
const USED_KEY = "cook_together_used_questions";

const loadUsed = () => {
  try {
    const raw = localStorage.getItem(USED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveUsed = (used) => {
  try {
    localStorage.setItem(USED_KEY, JSON.stringify(used));
  } catch {
    /* storage full — rotation degrades gracefully to random */
  }
};

// Depth escalates with trust: the deep questions are earned, not default.
// Early nights keep it light; once the game has hosted a few nights it has
// the standing to ask what actually matters.
const toneForNight = (tone, gamesPlayed) => {
  if (tone === "deep" && gamesPlayed < 2) return "mix"; // too soon
  return tone;
};

// `bias` comes from the couple's day signal and overrides the AI's tone:
// "supportive" on comfort/divergent nights (never probe someone who's raw),
// "flirty" on celebration nights.
export const getQuestionsForTone = (tone, count = 2, gamesPlayed = 0, bias = null) => {
  const baseTone = bias && QUESTIONS[bias] ? bias : tone;
  const effectiveTone = toneForNight(baseTone, gamesPlayed);
  const pool = QUESTIONS[effectiveTone] || QUESTIONS.mix;
  let used = loadUsed();

  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  // Draw preferring never-seen questions; recycle the candidate set's used
  // entries only when it's fully exhausted.
  const draw = (cands, exclude) => {
    if (!cands.length) return null;
    let fresh = cands.filter((q) => !used.includes(q) && !exclude.includes(q));
    if (!fresh.length) {
      used = used.filter((q) => !cands.includes(q));
      fresh = cands.filter((q) => !exclude.includes(q));
    }
    return fresh.length ? rand(fresh) : null;
  };
  // Fresh-only draw — returns null instead of recycling. Used for the deep
  // slot so a dry deep well falls back to light rather than repeating.
  const drawFresh = (cands, exclude) => {
    const fresh = cands.filter((q) => !used.includes(q) && !exclude.includes(q));
    return fresh.length ? rand(fresh) : null;
  };

  const lights = pool.filter((q) => questionDepth(q) === "light");
  // The deep slot: the night's own deeper questions, plus the earned deep
  // pool once trust exists. Supportive nights only ever use their own
  // gentle-deep — never probe someone who's already raw.
  let deeps = pool.filter((q) => questionDepth(q) === "deep");
  if (effectiveTone !== "supportive" && effectiveTone !== "deep" && gamesPlayed >= 2) {
    deeps = [...new Set([...deeps, ...QUESTIONS.deep])];
  }

  // The ritual shape: light first, deep second — the same arc every night.
  const picked = [];
  const first = draw(lights.length ? lights : pool, picked);
  if (first) picked.push(first);
  const second = drawFresh(deeps, picked) || draw(pool, picked);
  if (second) picked.push(second);
  while (picked.length < count) {
    const extra = draw(pool, picked);
    if (!extra) break;
    picked.push(extra);
  }

  saveUsed([...new Set([...used, ...picked])]);
  return picked.slice(0, count);
};
