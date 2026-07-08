import { describe, it, expect } from "vitest";
import { computeNightSignal, describeNightForAI } from "./nightSignal";

describe("computeNightSignal", () => {
  it("defaults to balanced when the check-in was skipped", () => {
    const s = computeNightSignal({});
    expect(s.coupleState).toBe("balanced");
    expect(s.easyFor).toBeNull();
    expect(s.twistStyle).toBe("any");
    expect(s.questionToneOverride).toBeNull();
  });

  it("both up → celebration", () => {
    const s = computeNightSignal({ p1Valence: 5, p2Valence: 4, p1Energy: 4, p2Energy: 4 });
    expect(s.coupleState).toBe("celebration");
    expect(s.twistStyle).toBe("hard"); // both wired
  });

  it("both down → comfort night with soft twist and supportive questions", () => {
    const s = computeNightSignal({ p1Valence: 2, p2Valence: 1, p1Energy: 3, p2Energy: 3 });
    expect(s.coupleState).toBe("comfort");
    expect(s.twistStyle).toBe("fun");
    expect(s.questionToneOverride).toBe("supportive");
  });

  it("both wiped but not sad → gentle night", () => {
    const s = computeNightSignal({ p1Valence: 3, p2Valence: 3, p1Energy: 2, p2Energy: 1 });
    expect(s.coupleState).toBe("gentle");
    expect(s.twistStyle).toBe("fun");
  });

  it("one up one down → divergent, protecting the down partner", () => {
    const s = computeNightSignal({ p1Valence: 5, p2Valence: 2, p1Energy: 4, p2Energy: 2 });
    expect(s.coupleState).toBe("divergent");
    expect(s.downPartner).toBe("p2");
    expect(s.easyFor).toBe("p2"); // wiped + rough day = forgiving ingredient
    expect(s.questionToneOverride).toBe("supportive");
    expect(s.twistStyle).toBe("fun");
  });

  it("energy imbalance alone assigns the forgiving ingredient", () => {
    const s = computeNightSignal({ p1Valence: 3, p2Valence: 3, p1Energy: 1, p2Energy: 4 });
    expect(s.easyFor).toBe("p1");
  });

  it("never assigns easyFor when both are equally drained", () => {
    const s = computeNightSignal({ p1Valence: 3, p2Valence: 3, p1Energy: 2, p2Energy: 2 });
    expect(s.easyFor).toBeNull();
  });
});

describe("describeNightForAI", () => {
  it("names the down partner on divergent nights", () => {
    const night = computeNightSignal({ p1Valence: 2, p2Valence: 5, p1Energy: 2, p2Energy: 4 });
    const text = describeNightForAI(night, "Sofia", "Marco");
    expect(text).toContain("Sofia had a hard day");
    expect(text).toContain("SUBTLETY RULE");
  });

  it("always carries the subtlety guardrail", () => {
    for (const checkIn of [{}, { p1Valence: 5, p2Valence: 5 }, { p1Valence: 1, p2Valence: 1 }]) {
      const text = describeNightForAI(computeNightSignal(checkIn), "A", "B");
      expect(text).toContain("never mention their moods");
    }
  });
});
