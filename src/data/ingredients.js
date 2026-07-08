export const SECRET_INGREDIENTS = [
  { emoji: "🍋", name: "Lemon zest", category: "citrus", difficulty: "easy" },
  { emoji: "🌶️", name: "Ghost pepper flakes", category: "spicy", difficulty: "hard" },
  { emoji: "🍫", name: "Dark chocolate", category: "sweet", difficulty: "medium" },
  { emoji: "🥑", name: "Avocado", category: "fresh", difficulty: "easy" },
  { emoji: "🧀", name: "Blue cheese", category: "savory", difficulty: "medium" },
  { emoji: "🍍", name: "Pineapple", category: "tropical", difficulty: "easy" },
  { emoji: "🍅", name: "Sun-dried tomatoes", category: "savory", difficulty: "easy" },
  { emoji: "🍯", name: "Honey", category: "sweet", difficulty: "easy" },
  { emoji: "🧄", name: "Black garlic", category: "savory", difficulty: "medium" },
  { emoji: "🌿", name: "Fresh basil", category: "herb", difficulty: "easy" },
  { emoji: "🍊", name: "Blood orange juice", category: "citrus", difficulty: "medium" },
  { emoji: "🥜", name: "Peanut butter", category: "nutty", difficulty: "easy" },
  { emoji: "🫙", name: "White miso paste", category: "umami", difficulty: "hard" },
  { emoji: "🍌", name: "Overripe banana", category: "sweet", difficulty: "easy" },
  { emoji: "🧅", name: "Caramelized onion", category: "savory", difficulty: "medium" },
  { emoji: "🫐", name: "Frozen blueberries", category: "sweet", difficulty: "easy" },
  { emoji: "🥥", name: "Coconut cream", category: "tropical", difficulty: "medium" },
  { emoji: "🍵", name: "Matcha powder", category: "earthy", difficulty: "medium" },
  { emoji: "🫚", name: "Truffle oil", category: "luxury", difficulty: "medium" },
  { emoji: "🌰", name: "Tahini", category: "nutty", difficulty: "medium" },
];

export const getAlternatives = (ingredient, count = 3) => {
  const sameCategory = SECRET_INGREDIENTS.filter(
    (i) => i.category === ingredient.category && i.name !== ingredient.name
  );
  const otherCategory = SECRET_INGREDIENTS.filter(
    (i) => i.category !== ingredient.category && i.name !== ingredient.name
  );
  const pool = [...sameCategory, ...otherCategory];
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const getRandomIngredients = (count = 2) => {
  const shuffled = [...SECRET_INGREDIENTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};
