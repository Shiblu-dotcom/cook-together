import { describe, it, expect, beforeEach } from "vitest";
import { QUESTIONS, getQuestionsForTone } from "./questions";

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

  it("tracks tones independently", () => {
    getQuestionsForTone("flirty", 3);
    const deep = getQuestionsForTone("deep", 3);
    expect(deep).toHaveLength(3);
    deep.forEach((q) => expect(QUESTIONS.deep).toContain(q));
  });

  it("falls back to the mix pool for unknown tones", () => {
    const qs = getQuestionsForTone("nonsense", 2);
    qs.forEach((q) => expect(QUESTIONS.mix).toContain(q));
  });
});
