// Fallback words used only if AI fails
export const FALLBACK_WORDS = [
  "Fearless", "Tender", "Chaotic", "Playful", "Electric",
  "Warm", "Radiant", "Untamed", "Honest", "Alive",
  "Golden", "Fierce", "Gentle", "Bold", "Soft",
  "Luminous", "Brave", "Quirky", "Vivid", "True",
];

export const getFallbackWord = () => {
  return FALLBACK_WORDS[Math.floor(Math.random() * FALLBACK_WORDS.length)];
};
