// Secret ingredients. `fits` says what kind of cooking the ingredient
// belongs in — "savory", "dessert", or "any" — so a dessert night never
// hands someone blue cheese and taco night never hands someone matcha.
export const SECRET_INGREDIENTS = [
  { emoji: "🍋", name: "Lemon zest", category: "citrus", difficulty: "easy", fits: "any" },
  { emoji: "🌶️", name: "Ghost pepper flakes", category: "spicy", difficulty: "hard", fits: "savory" },
  { emoji: "🍫", name: "Dark chocolate", category: "sweet", difficulty: "medium", fits: "any" },
  { emoji: "🥑", name: "Avocado", category: "fresh", difficulty: "easy", fits: "savory" },
  { emoji: "🧀", name: "Blue cheese", category: "savory", difficulty: "medium", fits: "savory" },
  { emoji: "🍍", name: "Pineapple", category: "tropical", difficulty: "easy", fits: "any" },
  { emoji: "🍅", name: "Sun-dried tomatoes", category: "savory", difficulty: "easy", fits: "savory" },
  { emoji: "🍯", name: "Honey", category: "sweet", difficulty: "easy", fits: "any" },
  { emoji: "🧄", name: "Black garlic", category: "savory", difficulty: "medium", fits: "savory" },
  { emoji: "🌿", name: "Fresh basil", category: "herb", difficulty: "easy", fits: "any" },
  { emoji: "🍊", name: "Blood orange juice", category: "citrus", difficulty: "medium", fits: "any" },
  { emoji: "🥜", name: "Peanut butter", category: "nutty", difficulty: "easy", fits: "any" },
  { emoji: "🫙", name: "White miso paste", category: "umami", difficulty: "hard", fits: "savory" },
  { emoji: "🍌", name: "Overripe banana", category: "sweet", difficulty: "easy", fits: "dessert" },
  { emoji: "🧅", name: "Caramelized onion", category: "savory", difficulty: "medium", fits: "savory" },
  { emoji: "🫐", name: "Frozen blueberries", category: "sweet", difficulty: "easy", fits: "dessert" },
  { emoji: "🥥", name: "Coconut cream", category: "tropical", difficulty: "medium", fits: "any" },
  { emoji: "🍵", name: "Matcha powder", category: "earthy", difficulty: "medium", fits: "dessert" },
  { emoji: "🫚", name: "Truffle oil", category: "luxury", difficulty: "medium", fits: "savory" },
  { emoji: "🌰", name: "Tahini", category: "nutty", difficulty: "medium", fits: "any" },
];

// The AI can invent theme names freely, so we classify by keywords rather
// than matching against the static theme list.
export const getThemeProfile = (themeName = "") => {
  const t = String(themeName).toLowerCase();
  if (/dessert|sweet|cake|pastry|bak(e|ing)|chocolate|candy|sugar/.test(t)) return "dessert";
  if (/mystery|anything|surprise|chaos|snack/.test(t)) return "open";
  return "savory";
};

const poolForTheme = (themeName) => {
  const profile = getThemeProfile(themeName);
  if (profile === "open") return SECRET_INGREDIENTS;
  const pool = SECRET_INGREDIENTS.filter(
    (i) => i.fits === profile || i.fits === "any"
  );
  // Safety net: never return a pool too small to play with.
  return pool.length >= 4 ? pool : SECRET_INGREDIENTS;
};

export const getAlternatives = (ingredient, count = 3, themeName = "") => {
  const pool = poolForTheme(themeName).filter((i) => i.name !== ingredient.name);
  const sameCategory = pool.filter((i) => i.category === ingredient.category);
  const otherCategory = pool.filter((i) => i.category !== ingredient.category);
  const ordered = [
    ...sameCategory.sort(() => Math.random() - 0.5),
    ...otherCategory.sort(() => Math.random() - 0.5),
  ];
  return ordered.slice(0, count);
};

// `easyFor` bends the deal to the night: if one partner had a rough day,
// their slot ("p1" = first, "p2" = second) draws from easy ingredients only,
// so the game quietly goes gentle on them.
export const getRandomIngredients = (count = 2, themeName = "", easyFor = null) => {
  const pool = poolForTheme(themeName);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const picks = shuffled.slice(0, count);

  const easySlot = easyFor === "p1" ? 0 : easyFor === "p2" ? 1 : -1;
  if (easySlot >= 0 && picks[easySlot] && picks[easySlot].difficulty !== "easy") {
    const easy = shuffled.find(
      (i) => i.difficulty === "easy" && !picks.some((p) => p.name === i.name)
    );
    if (easy) picks[easySlot] = easy;
  }
  return picks;
};
