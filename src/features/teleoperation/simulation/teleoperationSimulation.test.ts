import { describe, expect, it } from "vitest";
import { TeleoperationSimulation } from "./teleoperationSimulation";

describe("TeleoperationSimulation", () => {
  it("applies fresh commands after network delay", () => {
    const sim = new TeleoperationSimulation(0);
    sim.issueCommand("forward");
    expect(sim.tick(20).machine.activeCommand).toBe("stop");
    expect(sim.tick(30).machine.activeCommand).toBe("forward");
  });

  it("disconnect causes heartbeat timeout and reconnect restores communication", () => {
    const sim = new TeleoperationSimulation(0);
    sim.setNetwork({ connected: false });
    expect(sim.tick(1100).safety.state).toBe("safe-stop");
    sim.setNetwork({ connected: true });
    sim.tick(1150);
    expect(sim.tick(1200).safety.state).toBe("normal");
  });

  it("supervised mode keeps moving locally between network messages", () => {
    const sim = new TeleoperationSimulation(0);
    sim.setMode("supervised");
    sim.setTarget(80, 50);
    const before = sim.getSnapshot().machine.x;
    sim.tick(100);
    sim.tick(200);
    expect(sim.getSnapshot().machine.x).toBeGreaterThan(before);
  });

  it("direct and supervised control behave differently", () => {
    const direct = new TeleoperationSimulation(0);
    direct.setNetwork({ connected: false });
    direct.issueCommand("forward");
    direct.tick(100);

    const supervised = new TeleoperationSimulation(0);
    supervised.setMode("supervised");
    supervised.setTarget(80, 58);
    supervised.tick(100);
    expect(supervised.getSnapshot().machine.x).toBeGreaterThan(direct.getSnapshot().machine.x);
  });
});
