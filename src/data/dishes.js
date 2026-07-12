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

// The clock matches the dish, not a constant: easy 12, medium 15, hard 20.
// Fixed once the night starts — the pressure is the point.
const DIFFICULTY_MINUTES = { easy: 12, medium: 15, hard: 20 };
export const cookSecondsForDish = (dish) =>
  (DIFFICULTY_MINUTES[dish?.difficulty] || 15) * 60;

// Turn a dish's third-person split ("Boils pasta, saves pasta water") into
// imperative beats ("Boil the pasta" · "Save pasta water").
const toImperative = (clause) => {
  const t = clause.trim();
  return (t.charAt(0).toUpperCase() + t.slice(1)).replace(/^(\S+)/, (verb) => {
    if (/ies$/.test(verb)) return verb.replace(/ies$/, "y");        // fries → fry
    if (/(ss|sh|ch|x)es$/.test(verb)) return verb.replace(/es$/, ""); // tosses → toss
    if (/[^s]s$/.test(verb)) return verb.replace(/s$/, "");          // boils → boil
    return verb;
  });
};

/**
 * 3–4 glanceable beats per person, derived from the dish itself. No
 * measurements, no timings — short enough to read with messy hands.
 * `side` is "a" (the prep-side role) or "b" (the heat-side role).
 */
export const stepsForDish = (dish, side) => {
  if (!dish) return [];
  const raw = side === "a" ? dish.split.person_a : dish.split.person_b;
  // Fold one-word fragments back into the previous clause so "Preps rice,
  // veg, egg" stays one beat instead of degrading to "Veg" / "Egg".
  const clauses = raw.split(/,\s*/).reduce((acc, part) => {
    const p = part.trim();
    if (acc.length && p.split(/\s+/).length < 2) acc[acc.length - 1] += `, ${p}`;
    else acc.push(p);
    return acc;
  }, []);
  const beats = clauses.map(toImperative);
  if (side === "a") {
    return [`Get out: ${dish.pantry_core.join(", ")}`, ...beats].slice(0, 4);
  }
  return [...beats, "Plate it together — make it look on purpose"].slice(0, 4);
};

/**
 * Suggest a dish for tonight. `coupleState` is the Conductor's word
 * (celebration/comfort/gentle/divergent/balanced) or "new-pair";
 * `format` is the app's ("two-component" | "one-dish").
 * `exclude` lets a reshuffle avoid repeating the current suggestion.
 */
// Never hand a nervous cook a dish they can't make. `skill` is the couple's
// combined read (1–5, from the check-in sliders): low keeps to easy dishes
// (which is where all 29 no-cook dishes live), medium unlocks medium,
// high unlocks everything.
const difficultiesForSkill = (skill) => {
  if (skill == null) return null; // no reading → no restriction
  if (skill <= 2) return ["easy"];
  if (skill <= 3) return ["easy", "medium"];
  return null; // 4–5: anything, including hard
};

export const suggestDish = (coupleState, format, { newPair = false, exclude = [], skill = null } = {}) => {
  const state = newPair ? "new-pair" : DISH_STATE[coupleState] ?? null;
  const formats = FORMAT_MATCH[format] || ["two-roles", "no-cook"];
  const allowed = difficultiesForSkill(skill);

  let pool = DISHES.filter(
    (d) =>
      formats.includes(d.format) &&
      (!state || d.couple_states.includes(state)) &&
      (!allowed || allowed.includes(d.difficulty)) &&
      !exclude.includes(d.name)
  );
  // Relax the state first but never the skill guard — a couple that can't
  // cook should get a different vibe before they get a harder dish.
  if (pool.length === 0) {
    pool = DISHES.filter(
      (d) => formats.includes(d.format) && (!allowed || allowed.includes(d.difficulty)) && !exclude.includes(d.name)
    );
  }
  if (pool.length === 0) {
    pool = DISHES.filter((d) => (!allowed || allowed.includes(d.difficulty)) && !exclude.includes(d.name));
  }
  // Never come back empty-handed: relax the state, then the format.
  if (pool.length === 0) {
    pool = DISHES.filter((d) => formats.includes(d.format) && !exclude.includes(d.name));
  }
  if (pool.length === 0) pool = DISHES.filter((d) => !exclude.includes(d.name));
  if (pool.length === 0) pool = DISHES;

  return pool[Math.floor(Math.random() * pool.length)];
};
