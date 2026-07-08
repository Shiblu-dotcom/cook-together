export const TWISTS = [
  { id: "one_hand", text: "⚡ TWIST: One hand only for the next 2 minutes!", difficulty: "fun" },
  { id: "swap", text: "⚡ TWIST: Swap ONE ingredient with your partner right now!", difficulty: "strategic" },
  { id: "commentary", text: "⚡ TWIST: Narrate every step like a cooking show host!", difficulty: "fun" },
  { id: "add_sweet", text: "⚡ TWIST: Add something sweet to your dish immediately!", difficulty: "strategic" },
  { id: "partner_stirs", text: "⚡ TWIST: Your partner must stir your dish for 30 seconds!", difficulty: "fun" },
  { id: "whisper", text: "⚡ TWIST: Whisper only for the rest of the challenge!", difficulty: "fun" },
  { id: "name_it", text: "⚡ TWIST: Stop and dramatically name your dish right now!", difficulty: "fun" },
  { id: "blindfold", text: "⚡ TWIST: Close your eyes and smell your partner's dish — guess one ingredient!", difficulty: "strategic" },
  { id: "switch_stations", text: "⚡ TWIST: Switch cooking stations for 60 seconds!", difficulty: "hard" },
  { id: "no_utensils", text: "⚡ TWIST: No utensils for the next 90 seconds. Hands only!", difficulty: "hard" },
];

export const getRandomTwist = () => {
  return TWISTS[Math.floor(Math.random() * TWISTS.length)];
};
