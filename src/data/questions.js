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
};

export const getQuestionsForTone = (tone, count = 3) => {
  const pool = QUESTIONS[tone] || QUESTIONS.mix;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};
