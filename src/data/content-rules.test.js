import { describe, it, expect } from "vitest";
import { SECRET_INGREDIENTS, getAlternatives, getRandomIngredients, getThemeProfile } from "./ingredients";
import { THEMES } from "./themes";
import { QUESTIONS } from "./questions";
import { TWISTS } from "./twists";
import { COOP_MOMENTS } from "./coopMoments";
import {
  CALM_THEMES, CALM_MOMENTS, CALM_QUESTIONS, CALM_WORDS, CALM_WITNESS_FALLBACKS,
  getCalmTheme, getCalmMoment, getCalmQuestion, getCalmWord, getCalmWitnessFallback,
} from "./calm";
import { DISHES, suggestDish, cookSecondsForDish, stepsForDish } from "./dishes";
import { DIETARY_RULE, buildContextPrompt, buildJudgmentPrompt, buildWitnessPrompt } from "../utils/aiPrompts";

// Hard content rule: no pork or alcohol anywhere — static data or AI prompts.
// This test is the enforcement mechanism; if someone adds "bacon" back, CI fails.
const BANNED = /\b(pork|bacon|ham|prosciutto|lard|wine|beer|alcohol|champagne|vodka|whiskey|rum|liqueur|brandy)\b/i;
const BANNED_EMOJI = /[🥓🥂🍷🍺🍾🍸🍹]/u;

const scanText = (label, text) => {
  it(`${label} contains no pork or alcohol references`, () => {
    expect(text).not.toMatch(BANNED);
    expect(text).not.toMatch(BANNED_EMOJI);
  });
};

describe("dietary content rules", () => {
  scanText("ingredients", JSON.stringify(SECRET_INGREDIENTS));
  scanText("themes", JSON.stringify(THEMES));
  scanText("questions", JSON.stringify(QUESTIONS));
  scanText("twists", JSON.stringify(TWISTS));
  scanText("coop moments", JSON.stringify(COOP_MOMENTS));
  scanText("calm themes", JSON.stringify(CALM_THEMES));
  scanText("calm moments", JSON.stringify(CALM_MOMENTS));
  scanText("calm questions", JSON.stringify(CALM_QUESTIONS));
  scanText("calm words", JSON.stringify(CALM_WORDS));
  scanText("calm witness fallbacks", JSON.stringify(CALM_WITNESS_FALLBACKS));
  scanText("dish book", JSON.stringify(DISHES));

  it("DIETARY_RULE is injected into both AI prompts", () => {
    const fakeState = {
      p1Name: "A", p2Name: "B",
      checkIn: { craving: [], vibe: "", relationshipLength: "", p1Skill: 3, p2Skill: 3 },
      aiContext: { theme: "", judgePersonality: "", judgeReason: "" },
      memories: [],
    };
    expect(buildContextPrompt(fakeState)).toContain(DIETARY_RULE);
    expect(buildJudgmentPrompt(fakeState)).toContain(DIETARY_RULE);
  });
});

describe("calm night rules", () => {
  const calmState = {
    p1Name: "Sofia",
    p2Name: "Marco",
    calmTheme: "Soup and Bread",
    dish1Name: "Tuesday Soup",
    history: { gamesPlayed: 3, pastWords: ["Golden", "Braver"] },
  };

  it("witness prompt carries the dietary rule and the hard rules", () => {
    const prompt = buildWitnessPrompt(calmState);
    expect(prompt).toContain(DIETARY_RULE);
    expect(prompt).toContain("Never tease, critique");
    expect(prompt).toContain("Never mention scores, winning");
    expect(prompt).toContain("Never speculate about why the night was hard");
    expect(prompt).toContain("Never use therapy language");
    expect(prompt).toContain("silence counts fully as success");
  });

  it("witness prompt works with no history and no dish name", () => {
    const prompt = buildWitnessPrompt({ p1Name: "A", p2Name: "B" });
    expect(prompt).toContain("something warm");
    expect(prompt).not.toContain("undefined");
  });

  it("calm questions ask about gratitude or curiosity, never grievance", () => {
    const grievance = /\b(wrong|fight|argue|argument|fault|blame|fix us|problem|annoy)\b/i;
    for (const q of CALM_QUESTIONS) {
      expect(q).not.toMatch(grievance);
    }
  });

  it("calm helpers return members of their pools", () => {
    for (let i = 0; i < 10; i++) {
      expect(CALM_THEMES).toContainEqual(getCalmTheme());
      expect(CALM_MOMENTS).toContain(getCalmMoment());
      expect(CALM_QUESTIONS).toContain(getCalmQuestion());
      expect(CALM_WORDS).toContain(getCalmWord());
      expect(CALM_WITNESS_FALLBACKS).toContain(getCalmWitnessFallback());
    }
  });

  it("calm words are single quiet words, not phrases", () => {
    for (const w of CALM_WORDS) {
      expect(w).toMatch(/^[A-Z][a-z]+$/);
    }
  });
});

describe("dish book", () => {
  it("every dish has a name, format, split, secrets, and couple states", () => {
    expect(DISHES.length).toBeGreaterThan(50);
    for (const d of DISHES) {
      expect(d.name).toBeTruthy();
      expect(["no-cook", "two-roles", "two-components"]).toContain(d.format);
      expect(d.split.person_a).toBeTruthy();
      expect(d.split.person_b).toBeTruthy();
      expect(d.secret_ingredients.length).toBeGreaterThan(0);
      expect(d.couple_states.length).toBeGreaterThan(0);
    }
  });

  it("suggestDish respects the format", () => {
    for (let i = 0; i < 20; i++) {
      expect(suggestDish("celebration", "two-component").format).toBe("two-components");
      expect(["two-roles", "no-cook"]).toContain(suggestDish("comfort", "one-dish").format);
    }
  });

  it("new pairs only draw new-pair dishes", () => {
    for (let i = 0; i < 20; i++) {
      const d = suggestDish("celebration", "one-dish", { newPair: true });
      expect(d.couple_states).toContain("new-pair");
    }
  });

  it("reshuffling never repeats the excluded dish", () => {
    const first = suggestDish("comfort", "one-dish");
    for (let i = 0; i < 15; i++) {
      expect(suggestDish("comfort", "one-dish", { exclude: [first.name] }).name).not.toBe(first.name);
    }
  });

  it("every couple state has one-dish options to fall back on", () => {
    for (const state of ["celebration", "comfort", "gentle", "divergent", "balanced"]) {
      expect(suggestDish(state, "one-dish")).toBeTruthy();
    }
  });

  it("the clock matches the dish: easy 12, medium 15, hard 20 minutes", () => {
    expect(cookSecondsForDish({ difficulty: "easy" })).toBe(12 * 60);
    expect(cookSecondsForDish({ difficulty: "medium" })).toBe(15 * 60);
    expect(cookSecondsForDish({ difficulty: "hard" })).toBe(20 * 60);
    expect(cookSecondsForDish(null)).toBe(15 * 60); // no suggestion → the classic clock
  });

  it("every dish yields 2-4 short, glanceable beats per person", () => {
    for (const d of DISHES) {
      for (const side of ["a", "b"]) {
        const steps = stepsForDish(d, side);
        expect(steps.length).toBeGreaterThanOrEqual(2);
        expect(steps.length).toBeLessThanOrEqual(4);
        for (const s of steps) {
          expect(s.length).toBeLessThan(95); // glanceable, not a paragraph
          expect(s).not.toMatch(/^\s*$/);
        }
      }
    }
  });

  it("beats read as commands, not descriptions", () => {
    const fried = DISHES.find((d) => d.name === "Egg Fried Rice");
    const heat = stepsForDish(fried, "b");
    expect(heat[0]).toBe("Fry everything in the wok"); // "Fries…" → imperative
    const prep = stepsForDish(fried, "a");
    expect(prep[0]).toMatch(/^Get out: /);
    expect(prep[1]).toBe("Prep rice, veg, egg"); // short fragments folded, not orphaned
  });
});

describe("ingredient helpers", () => {
  it("getRandomIngredients returns distinct ingredients", () => {
    for (let i = 0; i < 20; i++) {
      const [a, b] = getRandomIngredients(2);
      expect(a.name).not.toBe(b.name);
    }
  });

  it("getAlternatives never offers the original back", () => {
    for (const ing of SECRET_INGREDIENTS) {
      const alts = getAlternatives(ing, 3);
      expect(alts).toHaveLength(3);
      expect(alts.map((a) => a.name)).not.toContain(ing.name);
    }
  });

  it("every ingredient has an emoji, name, category, difficulty, and fits", () => {
    for (const ing of SECRET_INGREDIENTS) {
      expect(ing.emoji).toBeTruthy();
      expect(ing.name).toBeTruthy();
      expect(ing.category).toBeTruthy();
      expect(["easy", "medium", "hard"]).toContain(ing.difficulty);
      expect(["savory", "dessert", "any"]).toContain(ing.fits);
    }
  });
});

describe("theme-matched ingredients", () => {
  it("classifies themes into profiles", () => {
    expect(getThemeProfile("Dessert for Dinner")).toBe("dessert");
    expect(getThemeProfile("Street Taco Wars")).toBe("savory");
    expect(getThemeProfile("Mystery Ingredient Battle")).toBe("open");
    expect(getThemeProfile("Midnight Snack Showdown")).toBe("open");
  });

  it("dessert themes never deal savory-only ingredients", () => {
    for (let i = 0; i < 30; i++) {
      const picks = getRandomIngredients(2, "Dessert for Dinner");
      picks.forEach((p) => expect(["dessert", "any"]).toContain(p.fits));
    }
  });

  it("savory themes never deal dessert-only ingredients", () => {
    for (let i = 0; i < 30; i++) {
      const picks = getRandomIngredients(2, "Street Taco Wars");
      picks.forEach((p) => expect(["savory", "any"]).toContain(p.fits));
    }
  });

  it("swap alternatives stay inside the theme's profile", () => {
    const banana = SECRET_INGREDIENTS.find((i) => i.name === "Overripe banana");
    for (let i = 0; i < 20; i++) {
      const alts = getAlternatives(banana, 3, "Dessert for Dinner");
      alts.forEach((a) => expect(["dessert", "any"]).toContain(a.fits));
    }
  });
});
