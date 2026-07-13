import { describe, it, expect, beforeEach } from "vitest";
import { QUESTIONS, getQuestionsForTone, questionDepth } from "./questions";

// questions.js persists rotation state via localStorage — stub it for node.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, v),
  removeItem: (k) => store.delete(k),
};

describe("question rotation", () => {
  beforeEach(() => store.clear());

  it("never repeats a question until the tone's pool is exhausted", () => {
    const poolSize = QUESTIONS.flirty.length; // 6
    const first = getQuestionsForTone("flirty", 3);
    const second = getQuestionsForTone("flirty", 3);
    const seen = [...first, ...second];
    expect(new Set(seen).size).toBe(Math.min(poolSize, 6)); // all distinct
  });

  it("starts a fresh cycle once the pool runs dry instead of failing", () => {
    getQuestionsForTone("flirty", 3);
    getQuestionsForTone("flirty", 3); // pool of 6 now exhausted
    const third = getQuestionsForTone("flirty", 3);
    expect(third).toHaveLength(3);
    third.forEach((q) => expect(QUESTIONS.flirty).toContain(q));
  });

  it("tracks tones independently (deep is earned from night 2)", () => {
    getQuestionsForTone("flirty", 3);
    const deep = getQuestionsForTone("deep", 3, 5);
    expect(deep).toHaveLength(3);
    deep.forEach((q) => expect(QUESTIONS.deep).toContain(q));
  });

  it("downgrades deep to mix on the very first nights — too soon to probe", () => {
    const early = getQuestionsForTone("deep", 3, 0);
    early.forEach((q) => expect(QUESTIONS.mix).toContain(q));
  });

  it("supportive bias overrides the AI's tone on rough nights", () => {
    const qs = getQuestionsForTone("flirty", 3, 3, "supportive");
    qs.forEach((q) => expect(QUESTIONS.supportive).toContain(q));
  });

  it("supportive nights never get the earned deep question injected", () => {
    for (let i = 0; i < 10; i++) {
      const qs = getQuestionsForTone("mix", 3, 10, "supportive");
      qs.forEach((q) => expect(QUESTIONS.deep).not.toContain(q));
    }
  });

  it("falls back to the mix pool for unknown tones", () => {
    const qs = getQuestionsForTone("nonsense", 2);
    qs.forEach((q) => expect(QUESTIONS.mix).toContain(q));
  });

  it("every night runs light then deep — the same arc every time", () => {
    for (let i = 0; i < 8; i++) {
      store.clear();
      const [q1, q2] = getQuestionsForTone("mix", 2, 5);
      expect(questionDepth(q1)).toBe("light");
      expect(questionDepth(q2)).toBe("deep");
    }
  });

  it("supportive nights still sequence light → gentle-deep, from their own pool only", () => {
    for (let i = 0; i < 8; i++) {
      store.clear();
      const [q1, q2] = getQuestionsForTone("flirty", 2, 10, "supportive");
      expect(questionDepth(q1)).toBe("light");
      expect(QUESTIONS.supportive).toContain(q1);
      expect(QUESTIONS.supportive).toContain(q2);
      expect(QUESTIONS.deep).not.toContain(q2);
    }
  });
});
