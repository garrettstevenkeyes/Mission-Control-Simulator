import type { NetworkCondition, SafetyConfig, SafetyStatus } from "../types";

export const DEFAULT_SAFETY_CONFIG: SafetyConfig = {
  heartbeatTimeoutMs: 1000,
  maxCommandAgeMs: 500,
  highLatencyRttMs: 500,
  highLossPercent: 15,
  rejectStaleCommands: true,
};

export function evaluateSafety(
  now: number,
  lastHeartbeatAt: number,
  network: NetworkCondition,
  config: SafetyConfig,
  emergencyStop: boolean,
): SafetyStatus {
  const heartbeatAgeMs = Math.max(0, now - lastHeartbeatAt);
  if (emergencyStop) {
    return { state: "emergency-stop", reason: "Emergency stop is active", speedLimit: 0, heartbeatAgeMs };
  }
  if (heartbeatAgeMs > config.heartbeatTimeoutMs) {
    return { state: "safe-stop", reason: "Heartbeat timed out", speedLimit: 0, heartbeatAgeMs };
  }
  if (network.rttMs >= config.highLatencyRttMs) {
    return { state: "degraded", reason: "High latency: speed reduced", speedLimit: 0.45, heartbeatAgeMs };
  }
  if (network.packetLossPercent >= config.highLossPercent) {
    return { state: "degraded", reason: "High packet loss: speed reduced", speedLimit: 0.6, heartbeatAgeMs };
  }
  return { state: "normal", reason: "Local checks are healthy", speedLimit: 1, heartbeatAgeMs };
}

export function commandShouldBeRejected(
  ageMs: number,
  sequence: number,
  lastSequence: number,
  config: SafetyConfig,
): "too-old" | "out-of-order" | null {
  if (sequence <= lastSequence) return "out-of-order";
  if (config.rejectStaleCommands && ageMs >= config.maxCommandAgeMs) return "too-old";
  return null;
}
