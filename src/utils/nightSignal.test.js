import { describe, it, expect } from "vitest";
import { computeNightSignal, describeNightForAI, formatForNight } from "./nightSignal";

describe("formatForNight", () => {
  it("celebration nights build two components on one plate", () => {
    const checkIn = { p1Valence: 5, p2Valence: 4, p1Energy: 4, p2Energy: 4 };
    const { format, roles } = formatForNight(computeNightSignal(checkIn), checkIn, { gamesPlayed: 5 });
    expect(format).toBe("two-component");
    expect([roles.p1, roles.p2].sort()).toEqual(["the main", "the sauce & side"]);
  });

  it("comfort and gentle nights get one dish, two roles", () => {
    for (const checkIn of [
      { p1Valence: 2, p2Valence: 1, p1Energy: 3, p2Energy: 3 },
      { p1Valence: 3, p2Valence: 3, p1Energy: 1, p2Energy: 2 },
    ]) {
      const { format, roles } = formatForNight(computeNightSignal(checkIn), checkIn, { gamesPlayed: 9 });
      expect(format).toBe("one-dish");
      expect([roles.p1, roles.p2].sort()).toEqual(["heat", "prep"]);
    }
  });

  it("divergent nights give prep to the partner having the rough day", () => {
    const checkIn = { p1Valence: 1, p2Valence: 4, p1Energy: 2, p2Energy: 4 };
    const signal = computeNightSignal(checkIn);
    expect(signal.downPartner).toBe("p1");
    const { format, roles } = formatForNight(signal, checkIn, { gamesPlayed: 9 });
    expect(format).toBe("one-dish");
    expect(roles.p1).toBe("prep");
    expect(roles.p2).toBe("heat");
  });

  it("new pairs always get the gentle shape, even on a celebration read", () => {
    const checkIn = { p1Valence: 5, p2Valence: 5, p1Energy: 5, p2Energy: 5 };
    const { format } = formatForNight(computeNightSignal(checkIn), checkIn, { newPair: true, gamesPlayed: 20 });
    expect(format).toBe("one-dish");
  });

  it("balanced nights: easy while the game is new, ambitious after", () => {
    const checkIn = { p1Valence: 3, p2Valence: 3, p1Energy: 3, p2Energy: 3 };
    const signal = computeNightSignal(checkIn);
    expect(formatForNight(signal, checkIn, { gamesPlayed: 0 }).format).toBe("one-dish");
    expect(formatForNight(signal, checkIn, { gamesPlayed: 4 }).format).toBe("two-component");
  });

  it("the lighter component goes to whoever has less in the tank", () => {
    const checkIn = { p1Valence: 4, p2Valence: 4, p1Energy: 2, p2Energy: 4 };
    const signal = computeNightSignal(checkIn);
    expect(signal.easyFor).toBe("p1");
    const { roles } = formatForNight(signal, checkIn, { gamesPlayed: 5 });
    expect(roles.p1).toBe("the sauce & side");
  });
});

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
