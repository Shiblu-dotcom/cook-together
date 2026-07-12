import { describe, it, expect } from "vitest";
import { normalizeJudgmentForMode } from "./mode";

const fullJudgment = {
  p1Reaction: "Sofia, the sauce sang.",
  p2Reaction: "Marco, the sear was brave.",
  plateScore: 84,
  winner: "Sofia",
  winnerReason: "The sauce carried it.",
  coupleTitle: "The Beautifully Chaotic Duo",
  compatibilityScore: 91,
  compatibilityReason: "Like salt and butter.",
  futurePrediction: "A pop-up restaurant by accident.",
  secretIngredientComment: "Both secrets made it home.",
  theWord: "Golden",
};

describe("play for fun vs play to win", () => {
  it("fun mode never carries a winner, a plate score, or a compatibility number", () => {
    const fun = normalizeJudgmentForMode(fullJudgment, "fun");
    expect(fun.winner).toBe("");
    expect(fun.winnerReason).toBe("");
    expect(fun.plateScore).toBe(0);
    expect(fun.compatibilityScore).toBe(0);
    expect(fun.compatibilityReason).toBe("");
  });

  it("fun mode keeps the warm parts: reactions, title, prediction, the Word", () => {
    const fun = normalizeJudgmentForMode(fullJudgment, "fun");
    expect(fun.p1Reaction).toBe(fullJudgment.p1Reaction);
    expect(fun.p2Reaction).toBe(fullJudgment.p2Reaction);
    expect(fun.coupleTitle).toBe(fullJudgment.coupleTitle);
    expect(fun.futurePrediction).toBe(fullJudgment.futurePrediction);
    expect(fun.secretIngredientComment).toBe(fullJudgment.secretIngredientComment);
    expect(fun.theWord).toBe(fullJudgment.theWord);
  });

  it("win mode passes the judgment through untouched", () => {
    expect(normalizeJudgmentForMode(fullJudgment, "win")).toEqual(fullJudgment);
  });
});
