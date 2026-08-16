import { describe, expect, it } from "vitest";
import { buildCommandTrace, getTraceLesson } from "./commandTrace";
import type { LoopTiming } from "../types";

const completed: LoopTiming = {
  commandSequence: 42,
  commandType: "forward",
  sentAt: 1000,
  scheduledDeliveryAt: 1075,
  result: "applied",
  receivedAt: 1075,
  reactedAt: 1105,
  feedbackMeasuredAt: 1125,
  feedbackAt: 1180,
};

describe("command trace", () => {
  it("turns one command into six understandable steps", () => {
    const steps = buildCommandTrace(completed, 1200);
    expect(steps).toHaveLength(6);
    expect(steps.every((step) => step.status === "complete")).toBe(true);
    expect(steps[5].outcome).toBe("180 ms total");
  });

  it("shows where a dropped command stops", () => {
    const dropped: LoopTiming = { ...completed, result: "lost", receivedAt: undefined, reactedAt: undefined, feedbackMeasuredAt: undefined, feedbackAt: undefined };
    const steps = buildCommandTrace(dropped, 1200);
    expect(steps[1].status).toBe("error");
    expect(steps[2].outcome).toBe("never arrived");
  });

  it("explains outbound delay versus the complete loop", () => {
    expect(getTraceLesson(completed, 1200)).toContain("75 ms");
    expect(getTraceLesson(completed, 1200)).toContain("180 ms");
  });
});
