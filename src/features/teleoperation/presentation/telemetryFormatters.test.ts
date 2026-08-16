import { describe, expect, it } from "vitest";
import {
  formatBucketPosition,
  formatHeading,
  formatReportedSpeed,
  normalizeHeading,
} from "./telemetryFormatters";

describe("telemetry formatters", () => {
  it("shows speed as a positive magnitude", () => {
    expect(formatReportedSpeed(-7.26)).toBe("7.3 km/h");
  });

  it("normalizes headings across multiple rotations", () => {
    expect(normalizeHeading(-725)).toBe(355);
    expect(normalizeHeading(730)).toBe(10);
    expect(formatHeading(-90)).toBe("270°");
  });

  it("keeps bucket position inside its display range", () => {
    expect(formatBucketPosition(-5)).toBe("0%");
    expect(formatBucketPosition(48.6)).toBe("49%");
    expect(formatBucketPosition(120)).toBe("100%");
  });
});
