import { describe, expect, it } from "vitest";
import { getAgeStatus, roundAge } from "./useReadableAge";

describe("readable age presentation", () => {
  it("rounds noisy values to readable 25 ms steps", () => {
    expect(roundAge(237)).toBe(225);
    expect(roundAge(241)).toBe(250);
  });

  it("uses plain freshness labels", () => {
    expect(getAgeStatus(100).label).toBe("Fresh");
    expect(getAgeStatus(300).label).toBe("Delayed");
    expect(getAgeStatus(600).label).toBe("Stale");
  });
});
