// The calm night (repair mode). Two principles govern everything here and
// they differ from the Conductor's:
//   1. No winner, ever. One dish, one outcome, one "you two".
//   2. Lightest possible touch. The app creates conditions and gets out of
//      the way. Two people cooking in silence IS a success.
// It is not therapy and never pretends to be. It never diagnoses, never
// forces a feeling, and every stage has a graceful exit.

// Warm, familiar, zero-challenge. Never clever.
export const CALM_THEMES = [
  { name: "Something Warm", emoji: "🍲" },
  { name: "The Pasta Night", emoji: "🍝" },
  { name: "Breakfast for Dinner", emoji: "🥞" },
  { name: "Grandma's Table", emoji: "🫕" },
  { name: "Soup and Bread", emoji: "🍜" },
  { name: "The Usual, Together", emoji: "🍚" },
];

// One small designed instant of contact — a step you can't do apart.
// Nothing corny. Just a moment where you can't avoid being present.
export const CALM_MOMENTS = [
  "One of you holds the bowl. The other stirs.",
  "Trade tasks for the next two minutes — no explaining, just show each other.",
  "Both hands on the same knife-free task: tear the herbs together.",
  "One pours, one holds the pan steady.",
  "Taste it at the same time. One spoon each. No verdicts.",
  "Stand shoulder to shoulder for the next step, whatever it is.",
];

// One question, late, skippable. Gratitude and curiosity — never grievance,
// never "what's wrong with us". A door, not a demand.
export const CALM_QUESTIONS = [
  "What's one thing you've been carrying this week?",
  "What's something I did recently that you noticed?",
  "What's one small thing that would make tomorrow lighter?",
  "When did you last feel like we were a good team?",
  "What's something you're glad we did, even if we never said so?",
];

// Arc words for nights that started heavy. Used as fallback when the AI
// isn't available; the witness prompt reaches for the same register.
export const CALM_WORDS = [
  "Steadied", "Held", "Closer", "Softer", "Quieter",
  "Mended", "Warmer", "Here", "Enough", "Still",
];

// Canned witness lines — the no-AI fallback. Warm, plain, no judging.
export const CALM_WITNESS_FALLBACKS = [
  "You made something together on a night it wasn't easy to. That's the whole thing, really.",
  "One dish, four hands. Whatever today was, the kitchen is warmer than it was an hour ago.",
  "Nobody had to say much. You showed up next to each other anyway — and something got made.",
];

export const getCalmTheme = () =>
  CALM_THEMES[Math.floor(Math.random() * CALM_THEMES.length)];

export const getCalmMoment = () =>
  CALM_MOMENTS[Math.floor(Math.random() * CALM_MOMENTS.length)];

export const getCalmQuestion = () =>
  CALM_QUESTIONS[Math.floor(Math.random() * CALM_QUESTIONS.length)];

export const getCalmWord = () =>
  CALM_WORDS[Math.floor(Math.random() * CALM_WORDS.length)];

export const getCalmWitnessFallback = () =>
  CALM_WITNESS_FALLBACKS[Math.floor(Math.random() * CALM_WITNESS_FALLBACKS.length)];
