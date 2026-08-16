import { describe, expect, it } from "vitest";
import { guidedLabs } from "./guidedLabs";
import { getLabWorkspace } from "./labWorkspace";

describe("focused lab workspaces", () => {
  it("keeps every lab to three or fewer learning views", () => {
    for (const lab of guidedLabs) {
      expect(getLabWorkspace(lab.id).modules.length).toBeLessThanOrEqual(3);
    }
  });

  it("shows timing views only where they teach the lesson", () => {
    expect(getLabWorkspace("latency").modules).toContain("trace");
    expect(getLabWorkspace("jitter").modules).toContain("timeline");
    expect(getLabWorkspace("jitter").modules).not.toContain("scene");
  });

  it("keeps the local safety view in the disconnect lab", () => {
    expect(getLabWorkspace("disconnect").modules).toContain("safety");
    expect(getLabWorkspace("disconnect").modules).toContain("scene");
  });
});
