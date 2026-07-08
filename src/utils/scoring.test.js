import { describe, it, expect } from "vitest";
import { calculateScore, resolveWinner } from "./scoring";

describe("calculateScore", () => {
  it("returns 0 when the secret ingredient was skipped — the hard rule", () => {
    expect(
      calculateScore({
        usedSecretIngredient: false,
        aiCreativityScore: 50,
        aiEffortScore: 30,
        memoriesTaken: 5,
      })
    ).toBe(0);
  });

  it("adds the +20 secret ingredient bonus", () => {
    expect(
      calculateScore({ usedSecretIngredient: true, aiCreativityScore: 0, aiEffortScore: 0 })
    ).toBe(20);
  });

  it("caps memory points at 50 even with more than 5 photos", () => {
    const withFive = calculateScore({
      usedSecretIngredient: true, aiCreativityScore: 0, aiEffortScore: 0, memoriesTaken: 5,
    });
    const withTen = calculateScore({
      usedSecretIngredient: true, aiCreativityScore: 0, aiEffortScore: 0, memoriesTaken: 10,
    });
    expect(withFive).toBe(70); // 20 + 50
    expect(withTen).toBe(withFive);
  });

  it("applies the swap penalty", () => {
    const swapped = calculateScore({
      usedSecretIngredient: true, aiCreativityScore: 30, aiEffortScore: 0, swappedIngredient: true,
    });
    const kept = calculateScore({
      usedSecretIngredient: true, aiCreativityScore: 30, aiEffortScore: 0, swappedIngredient: false,
    });
    expect(kept - swapped).toBe(10);
  });

  it("never exceeds 100 or drops below 0", () => {
    expect(
      calculateScore({
        usedSecretIngredient: true, aiCreativityScore: 50, aiEffortScore: 30, memoriesTaken: 5,
      })
    ).toBe(100);
    expect(
      calculateScore({
        usedSecretIngredient: true, aiCreativityScore: 0, aiEffortScore: 0, swappedIngredient: true,
      })
    ).toBeGreaterThanOrEqual(0);
  });
});

describe("resolveWinner", () => {
  it("declares a tie when scores are within 5 points", () => {
    expect(resolveWinner(70, 74, "Sofia", "Marco").winner).toBe("tie");
    expect(resolveWinner(74, 70, "Sofia", "Marco").winner).toBe("tie");
    expect(resolveWinner(70, 75, "Sofia", "Marco").winner).toBe("tie");
  });

  it("picks the higher scorer outside the tie window", () => {
    expect(resolveWinner(80, 70, "Sofia", "Marco").winner).toBe("Sofia");
    expect(resolveWinner(60, 90, "Sofia", "Marco").winner).toBe("Marco");
  });

  it("keeps full points for a decisive win", () => {
    const r = resolveWinner(90, 60, "Sofia", "Marco");
    expect(r.p1Points).toBe(90);
    expect(r.p2Points).toBe(60);
  });
});
