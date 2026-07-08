import { describe, it, expect } from "vitest";
import { BADGES, getNewBadges } from "./badges";

describe("getNewBadges", () => {
  it("unlocks First Flame after the first game", () => {
    const unlocked = getNewBadges(1, []);
    expect(unlocked.map((b) => b.id)).toContain("first_flame");
  });

  it("does not re-award badges the couple already has", () => {
    const unlocked = getNewBadges(3, ["first_flame"]);
    expect(unlocked.map((b) => b.id)).toEqual(["hat_trick"]);
  });

  it("awards all missed milestones at once (e.g. resumed profiles)", () => {
    const unlocked = getNewBadges(7, []);
    expect(unlocked.map((b) => b.id)).toEqual(
      expect.arrayContaining(["first_flame", "hat_trick", "lucky_seven"])
    );
  });

  it("awards nothing at zero games", () => {
    expect(getNewBadges(0, [])).toHaveLength(0);
  });

  it("badge thresholds are strictly increasing", () => {
    const thresholds = BADGES.map((b) => b.gamesRequired);
    const sorted = [...thresholds].sort((a, b) => a - b);
    expect(thresholds).toEqual(sorted);
    expect(new Set(thresholds).size).toBe(thresholds.length);
  });
});
