import { describe, expect, it } from "vitest";
import {
  getDroppedPacketProgress,
  getPacketReplayDuration,
  getPacketReplayProgress,
  shouldShowDrop,
} from "./packetAnimation";

describe("packet animation replay", () => {
  it("keeps fast packets visible without changing their real delay", () => {
    expect(getPacketReplayDuration(25)).toBeGreaterThanOrEqual(600);
    expect(getPacketReplayProgress(25, 25)).toBeLessThan(0.1);
  });

  it("still makes slower packets take longer to cross", () => {
    expect(getPacketReplayDuration(500)).toBeGreaterThan(getPacketReplayDuration(25));
  });

  it("holds a dropped packet where its replay stops", () => {
    expect(shouldShowDrop(0.54)).toBe(false);
    expect(shouldShowDrop(0.55)).toBe(true);
    expect(getDroppedPacketProgress(0.9)).toBe(0.55);
  });
});
