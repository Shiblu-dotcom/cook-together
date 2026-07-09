// The dish book: 103 real dishes, every one 15-minute-doable in one home
// kitchen with a single stove. Each is tagged with the couple states it
// suits, the format it fits, and a ready-made two-person split — so the
// night can offer a concrete head start instead of just a theme.
import db from "./dishes.json";

export const DISHES = db.dishes;

// The Conductor speaks in couple states; the dish book uses its own labels.
const DISH_STATE = {
  celebration: "up",
  comfort: "down",
  gentle: "wiped",
  divergent: "divergent",
  balanced: null, // any dish state fits an ordinary night
};

// App formats → dish-book formats. The easy shape happily takes no-cook
// dishes too — assembling side by side is still cooking together.
const FORMAT_MATCH = {
  "two-component": ["two-components"],
  "one-dish": ["two-roles", "no-cook"],
};

/**
 * Suggest a dish for tonight. `coupleState` is the Conductor's word
 * (celebration/comfort/gentle/divergent/balanced) or "new-pair";
 * `format` is the app's ("two-component" | "one-dish").
 * `exclude` lets a reshuffle avoid repeating the current suggestion.
 */
export const suggestDish = (coupleState, format, { newPair = false, exclude = [] } = {}) => {
  const state = newPair ? "new-pair" : DISH_STATE[coupleState] ?? null;
  const formats = FORMAT_MATCH[format] || ["two-roles", "no-cook"];

  let pool = DISHES.filter(
    (d) =>
      formats.includes(d.format) &&
      (!state || d.couple_states.includes(state)) &&
      !exclude.includes(d.name)
  );
  // Never come back empty-handed: relax the state, then the format.
  if (pool.length === 0) {
    pool = DISHES.filter((d) => formats.includes(d.format) && !exclude.includes(d.name));
  }
  if (pool.length === 0) pool = DISHES.filter((d) => !exclude.includes(d.name));
  if (pool.length === 0) pool = DISHES;

  return pool[Math.floor(Math.random() * pool.length)];
};
