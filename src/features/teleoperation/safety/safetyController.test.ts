import { describe, expect, it } from "vitest";
import { commandShouldBeRejected, DEFAULT_SAFETY_CONFIG, evaluateSafety } from "./safetyController";

const network = { rttMs: 50, jitterMs: 0, packetLossPercent: 0, bandwidthMbps: 12, connected: true };

describe("safety rules", () => {
  it("accepts a fresh, newer command", () => {
    expect(commandShouldBeRejected(100, 4, 3, DEFAULT_SAFETY_CONFIG)).toBeNull();
  });

  it("rejects stale commands when protection is on", () => {
    expect(commandShouldBeRejected(500, 4, 3, DEFAULT_SAFETY_CONFIG)).toBe("too-old");
  });

  it("changes to safe stop after heartbeat timeout", () => {
    expect(evaluateSafety(1001, 0, network, DEFAULT_SAFETY_CONFIG, false).state).toBe("safe-stop");
  });

  it("restores normal state after a new heartbeat", () => {
    expect(evaluateSafety(1100, 1090, network, DEFAULT_SAFETY_CONFIG, false).state).toBe("normal");
  });
});
