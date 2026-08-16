import { describe, expect, it } from "vitest";
import { NetworkEngine, type RandomSource } from "./networkEngine";
import type { NetworkCondition } from "../types";

class FixedRandom implements RandomSource {
  constructor(private value: number) {}
  next() { return this.value; }
  between(min: number, max: number) { return min + this.value * (max - min); }
}

const healthy: NetworkCondition = {
  rttMs: 100,
  jitterMs: 0,
  packetLossPercent: 0,
  bandwidthMbps: 12,
  connected: true,
};

describe("NetworkEngine", () => {
  it("delays delivery by one-way latency", () => {
    const engine = new NetworkEngine(new FixedRandom(0.5));
    engine.send({ id: "p1", kind: "command", direction: "outbound", payload: {}, createdAt: 0 }, healthy);
    expect(engine.tick(49).delivered).toHaveLength(0);
    expect(engine.tick(50).delivered).toHaveLength(1);
  });

  it("uses jitter to change the delay", () => {
    const early = new NetworkEngine(new FixedRandom(0));
    const late = new NetworkEngine(new FixedRandom(1));
    const input = { id: "p1", kind: "command" as const, direction: "outbound" as const, payload: {}, createdAt: 0 };
    const network = { ...healthy, jitterMs: 30 };
    expect(early.send(input, network).scheduledDeliveryAt).toBe(20);
    expect(late.send(input, network).scheduledDeliveryAt).toBe(80);
  });

  it("never delivers dropped packets", () => {
    const engine = new NetworkEngine(new FixedRandom(0));
    engine.send({ id: "p1", kind: "command", direction: "outbound", payload: {}, createdAt: 0 }, { ...healthy, packetLossPercent: 30 });
    const result = engine.tick(100);
    expect(result.delivered).toHaveLength(0);
    expect(result.dropped).toHaveLength(1);
  });

  it("stops delivery while disconnected", () => {
    const engine = new NetworkEngine(new FixedRandom(0.5));
    engine.send({ id: "p1", kind: "heartbeat", direction: "outbound", payload: {}, createdAt: 0 }, { ...healthy, connected: false });
    expect(engine.tick(100).dropped[0].dropReason).toBe("disconnect");
  });
});
