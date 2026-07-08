import { describe, it, expect } from "vitest";
import { SECRET_INGREDIENTS, getAlternatives, getRandomIngredients, getThemeProfile } from "./ingredients";
import { THEMES } from "./themes";
import { QUESTIONS } from "./questions";
import { TWISTS } from "./twists";
import { COOP_MOMENTS } from "./coopMoments";
import { DIETARY_RULE, buildContextPrompt, buildJudgmentPrompt } from "../utils/aiPrompts";

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
