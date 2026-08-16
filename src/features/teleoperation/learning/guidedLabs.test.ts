import { describe, expect, it } from "vitest";
import { TeleoperationSimulation } from "../simulation/teleoperationSimulation";
import { getLiveLabObservation, guidedLabs, isGuidedLabComplete } from "./guidedLabs";

describe("guided labs", () => {
  it("provides a complete learning path", () => {
    expect(guidedLabs).toHaveLength(7);
    for (const lab of guidedLabs) {
      expect(lab.steps.length).toBeGreaterThanOrEqual(3);
      expect(lab.whatHappened.length).toBeGreaterThan(40);
      expect(lab.takeaway.length).toBeGreaterThan(30);
    }
  });

  it("does not mark a baseline complete before the user experiments", () => {
    const snapshot = new TeleoperationSimulation(0).getSnapshot();
    expect(isGuidedLabComplete("baseline", snapshot)).toBe(false);
    expect(getLiveLabObservation("baseline", snapshot)).toContain("No command");
  });
});
