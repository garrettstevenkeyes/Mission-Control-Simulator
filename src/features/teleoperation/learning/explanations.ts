import type { SimulationSnapshot } from "../types";

export function currentExplanation(snapshot: SimulationSnapshot, deep: boolean): { title: string; text: string; action: string } {
  if (!snapshot.network.connected) return {
    title: "The link is down",
    text: "Mission Control can no longer reach the machine. The edge computer must make the immediate safety decision locally.",
    action: "Watch the heartbeat timer trigger a safe stop.",
  };
  if (snapshot.safety.state === "safe-stop") return {
    title: "The machine stopped itself",
    text: "No heartbeat arrived before the timeout. The machine did not wait for a remote service to decide what to do.",
    action: "Reconnect to restore heartbeat messages.",
  };
  if (snapshot.network.packetLossPercent >= 10) return {
    title: "Some messages never arrive",
    text: deep ? "Loss forces a choice between reliability and freshness. Waiting to resend old state can make the view less current." : "Sending something does not guarantee it arrived. Watch for packet markers that turn into an ×.",
    action: "Try holding a movement control and watch the command timeline.",
  };
  if (snapshot.network.jitterMs >= 100) return {
    title: "Timing is uneven",
    text: deep ? "Jitter is variation in packet delay. Queueing and changing network paths can make later packets arrive before earlier ones." : "Average latency can look fine while each message arrives at a different pace. That makes control feel unpredictable.",
    action: "Send left, right, then stop. Compare each command age.",
  };
  if (snapshot.mode === "supervised" && snapshot.network.rttMs >= 300) return {
    title: "The fast loop moved local",
    text: "The network is poor, but the edge computer handles the small movement steps near the machine. Each step does not need a round trip.",
    action: "Click a target and compare this with Direct mode.",
  };
  if (snapshot.network.rttMs >= 300) return {
    title: "You are reacting to the past",
    text: deep ? "The feedback loop includes outbound delay, machine reaction, sensing, and return delay. This creates stale state: a correct view of an earlier moment." : "Your command arrives late, and the visual result also has to travel back. The full delay matters more than either trip alone.",
    action: "Compare the solid machine with the faded operator view.",
  };
  if (snapshot.network.bandwidthMbps < 3) return {
    title: "The view updates less often",
    text: "Limited bandwidth lowers the simulated visual update rate and adds delay. The control packets are small, but the visual feed is not.",
    action: "Move the machine and watch the faded view lag behind.",
  };
  if (snapshot.mode === "supervised") return {
    title: "The fast loop moved local",
    text: "You send a target once. The edge computer handles the small movement steps near the machine, so each step does not need a round trip.",
    action: "Click a target, then raise latency while it moves.",
  };
  return {
    title: "The loop feels responsive",
    text: "A command travels to the excavator. The result is measured and travels back. On this healthy link, both trips are short and steady.",
    action: "Raise round-trip latency to 400 ms and try the same move.",
  };
}

export const whyTopics = [
  ["Why timestamps?", "A timestamp says when a command or measurement was created. It lets the receiver tell fresh information from old information."],
  ["Why sequence numbers?", "A sequence number shows message order. If command #42 arrives after #43, the machine can see that #42 is older."],
  ["Why heartbeats?", "Heartbeats are small, regular messages. If they stop arriving, the machine knows the remote controller may no longer be reachable."],
  ["Why does jitter matter?", "Jitter means packet delay keeps changing. Even with a good average, uneven timing makes the machine response hard to predict."],
  ["Why local safety?", "The network can slow down or disappear. Immediate stop and limit decisions must still work when remote systems cannot be reached."],
  ["Why local autonomy?", "A local controller can handle fast, small steps near the machine. The operator sends intent instead of every movement update."],
] as const;
