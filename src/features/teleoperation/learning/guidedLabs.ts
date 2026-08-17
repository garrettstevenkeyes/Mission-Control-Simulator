import type { ControlMode, NetworkCondition, SimulationSnapshot } from "../types";

export type GuidedLabId = "baseline" | "latency" | "jitter" | "loss" | "stale" | "disconnect" | "local-control";

export interface GuidedLabSetup {
  network: NetworkCondition;
  mode: ControlMode;
  rejectStaleCommands: boolean;
}

export interface GuidedLabDefinition {
  id: GuidedLabId;
  shortTitle: string;
  title: string;
  question: string;
  goal: string;
  setup: GuidedLabSetup;
  steps: string[];
  watch: string[];
  whatHappened: string;
  engineeringResponse: string;
  takeaway: string;
  deepExplanation: string;
}

const healthyNetwork: NetworkCondition = {
  rttMs: 50,
  jitterMs: 5,
  packetLossPercent: 0,
  bandwidthMbps: 12,
  connected: true,
};

export const guidedLabs: GuidedLabDefinition[] = [
  {
    id: "baseline",
    shortTitle: "Baseline",
    title: "Feel a healthy control loop",
    question: "What does remote control feel like when the network is fast and steady?",
    goal: "Create a baseline so later failures have something clear to compare against.",
    setup: { network: healthyNetwork, mode: "direct", rejectStaleCommands: true },
    steps: ["Load the healthy setup.", "Hold Forward briefly, then release it.", "Notice how closely the machine and faded operator view follow each other."],
    watch: ["Configured network RTT", "Measured command-to-view", "Machine vs operator view"],
    whatHappened: "Network RTT measures travel through the network. Command-to-view time also includes machine response, waiting for the next feedback sample, and updating the operator's view. That is why it is higher.",
    engineeringResponse: "Measure this healthy case first. A baseline makes later delay, loss, and safety behavior easier to reason about.",
    takeaway: "Network RTT is only one part of the delay the operator feels. Teleoperation depends on the complete command-to-view loop.",
    deepExplanation: "This simulator samples visual feedback every 100 ms and processes updates every 50 ms. A command may wait for both, so a 50 ms network RTT can produce about 150 ms from input to visible result. Real systems add camera capture, encoding, decoding, and rendering too.",
  },
  {
    id: "latency",
    shortTitle: "Latency",
    title: "React to an older view",
    question: "Why does 400 ms of round-trip latency make direct driving difficult?",
    goal: "See that the operator waits for the full loop, not only the outbound command.",
    setup: { network: { ...healthyNetwork, rttMs: 400 }, mode: "direct", rejectStaleCommands: true },
    steps: ["Load the high-latency setup.", "Tap Forward or Rotate once.", "Follow the six steps in the command trace."],
    watch: ["Command trip", "Total loop time", "Operator's faded view"],
    whatHappened: "The machine received the command after the outbound delay. Its response then had to be sampled and returned to the operator. Network travel, machine response, feedback sampling, and view updates all contribute to command-to-view time.",
    engineeringResponse: "Reduce unnecessary network trips, show state age, limit speed, and move fast control decisions closer to the machine.",
    takeaway: "A short command trip is not enough. The operator acts on the complete feedback loop.",
    deepExplanation: "Propagation delay is travel time across the network. Queueing delay is time spent waiting behind other traffic. Both can make the returned view older.",
  },
  {
    id: "jitter",
    shortTitle: "Jitter",
    title: "Make timing unpredictable",
    question: "Can a decent average latency still feel bad?",
    goal: "Compare average delay with the uneven delay of individual commands.",
    setup: { network: { ...healthyNetwork, rttMs: 120, jitterMs: 220 }, mode: "direct", rejectStaleCommands: true },
    steps: ["Load the high-jitter setup.", "Send Left, Right, and Stop in quick succession.", "Compare their ages in the command timeline."],
    watch: ["Jitter setting", "Command age differences", "Arrival order"],
    whatHappened: "Each packet received a different delay. A later command can arrive before an earlier one, even when the average looks acceptable.",
    engineeringResponse: "Track sequence numbers, reject older order, smooth operator input, and design around freshness instead of averages alone.",
    takeaway: "Low average latency does not guarantee predictable control when packet timing changes wildly.",
    deepExplanation: "Jitter is variation in delivery time. It can also change packet ordering, so a newer command may arrive before an older one.",
  },
  {
    id: "loss",
    shortTitle: "Loss",
    title: "Watch information disappear",
    question: "What should the system do when some real-time messages never arrive?",
    goal: "See why sending a command or measurement does not guarantee delivery.",
    setup: { network: { ...healthyNetwork, rttMs: 100, jitterMs: 20, packetLossPercent: 15, bandwidthMbps: 5 }, mode: "direct", rejectStaleCommands: true },
    steps: ["Load the packet-loss setup.", "Send several short movement commands.", "Look for a stopped trace or dropped count."],
    watch: ["Dropped packet count", "Trace outcome", "State age"],
    whatHappened: "Some packets disappeared before reaching their destination. Later updates may still arrive and describe a newer machine state.",
    engineeringResponse: "Decide which messages must be reliable and which are more useful when fresh. Do not treat every message the same way.",
    takeaway: "In real-time systems, the next fresh update can be more useful than waiting for every old update.",
    deepExplanation: "Reliability means making sure data arrives. Freshness means the data still describes the current state. Real-time telemetry often values freshness more than old guaranteed updates.",
  },
  {
    id: "stale",
    shortTitle: "Old commands",
    title: "Reject stale intent",
    question: "Should the machine execute a command that arrives long after the operator sent it?",
    goal: "Use timestamps and sequence numbers to stop an old command from taking control.",
    setup: { network: { ...healthyNetwork, rttMs: 1000, jitterMs: 40 }, mode: "direct", rejectStaleCommands: true },
    steps: ["Load the stale-command setup.", "Send Left, then Right, then Stop.", "Watch the edge-check step reject commands that are 500 ms old."],
    watch: ["Command age", "Edge check", "Rejected as old"],
    whatHappened: "The packet may be valid data, but it represents old operator intent. Acting on it could undo a newer correction or stop.",
    engineeringResponse: "Attach creation times and sequence numbers, then enforce a maximum command age on the edge computer.",
    takeaway: "A command can arrive successfully and still be unsafe to use because it is stale.",
    deepExplanation: "A timestamp measures age. A sequence number records order. Together they let the receiver reject stale state and older intent.",
  },
  {
    id: "disconnect",
    shortTitle: "Disconnect",
    title: "Lose the remote controller",
    question: "Who stops the machine when Mission Control disappears?",
    goal: "See why immediate safety behavior cannot depend on a remote service.",
    setup: { network: healthyNetwork, mode: "direct", rejectStaleCommands: true },
    steps: ["Load the healthy starting setup.", "Start moving the machine.", "Press Disconnect network and watch the heartbeat timer."],
    watch: ["Heartbeat age", "Safety state", "Machine speed"],
    whatHappened: "Commands, heartbeats, and feedback stopped. When the heartbeat timeout passed, the edge computer stopped the machine locally.",
    engineeringResponse: "Keep heartbeat monitoring and immediate fallback behavior on the machine, where they still work without the network.",
    takeaway: "The machine cannot depend on the cloud for every safety decision.",
    deepExplanation: "A heartbeat is a small liveness signal. When it stops, the edge computer cannot know why the link failed, but it can still enter a defined local fallback state.",
  },
  {
    id: "local-control",
    shortTitle: "Local control",
    title: "Move the fast loop to the edge",
    question: "Why can a larger local task handle a poor network better than direct driving?",
    goal: "Compare continuous remote control with a target handled near the machine.",
    setup: { network: { ...healthyNetwork, rttMs: 600, jitterMs: 100, packetLossPercent: 10, bandwidthMbps: 2 }, mode: "supervised", rejectStaleCommands: true },
    steps: ["Load the poor-network supervised setup.", "Click a target in the construction site.", "Watch the excavator keep taking small steps locally."],
    watch: ["Control mode", "Local target", "Movement between network updates"],
    whatHappened: "Mission Control sent a larger goal. The edge computer handled the small movement steps without asking the network for each one.",
    engineeringResponse: "Use local assistance or supervised tasks when the network cannot support a tight remote feedback loop.",
    takeaway: "Local autonomy reduces how much fast back-and-forth communication the task requires.",
    deepExplanation: "Moving the fast control loop to the edge changes the network from continuous steering into occasional task updates. That reduces how often delay can interrupt motion.",
  },
];

export function isGuidedLabComplete(id: GuidedLabId, snapshot: SimulationSnapshot): boolean {
  if (id === "baseline") return snapshot.commands.some((command) => command.type !== "stop" && command.result === "applied") && snapshot.network.rttMs <= 80;
  if (id === "latency") return snapshot.network.rttMs >= 300 && snapshot.loopTiming?.commandType !== "stop" && snapshot.loopTiming?.feedbackAt !== undefined;
  if (id === "jitter") return snapshot.network.jitterMs >= 100 && snapshot.commands.filter((command) => command.receivedAt !== undefined).length >= 3;
  if (id === "loss") return snapshot.network.packetLossPercent >= 10 && snapshot.commands.some((command) => command.result === "lost");
  if (id === "stale") return snapshot.stats.staleCommands > 0;
  if (id === "disconnect") return snapshot.safety.state === "safe-stop";
  return snapshot.mode === "supervised" && snapshot.network.rttMs >= 300 && (snapshot.machine.target !== null || snapshot.machine.speed > 0);
}

export function getLiveLabObservation(id: GuidedLabId, snapshot: SimulationSnapshot): string {
  if (id === "baseline") {
    if (!snapshot.commands.length) return "No command yet. Send one to establish the healthy baseline.";
    return snapshot.loopTiming?.feedbackAt ? `Configured network RTT: ${snapshot.network.rttMs} ms. Measured command-to-view: ${Math.round(snapshot.loopTiming.feedbackAt - snapshot.loopTiming.sentAt)} ms.` : "The command is moving through the healthy loop now.";
  }
  if (id === "latency") {
    const total = snapshot.loopTiming?.feedbackAt ? Math.round(snapshot.loopTiming.feedbackAt - snapshot.loopTiming.sentAt) : null;
    return total ? `Outbound estimate: ${Math.round(snapshot.network.rttMs / 2)} ms. Measured command-to-view: ${total} ms.` : `The outbound trip alone is about ${Math.round(snapshot.network.rttMs / 2)} ms. Send a command to measure command-to-view time.`;
  }
  if (id === "jitter") {
    const ages = snapshot.commands.flatMap((command) => command.ageMs === undefined ? [] : [command.ageMs]);
    return ages.length >= 2 ? `Recent command ages range from ${Math.round(Math.min(...ages))} to ${Math.round(Math.max(...ages))} ms.` : "Send several commands so their different arrival times can be compared.";
  }
  if (id === "loss") return snapshot.stats.dropped ? `${snapshot.stats.dropped} packets have disappeared so far.` : "No packet has dropped yet. Send several commands to give loss a chance to appear.";
  if (id === "stale") return snapshot.stats.staleCommands ? `${snapshot.stats.staleCommands} old commands were rejected instead of executed.` : "No stale command has been rejected yet. Send several commands under the loaded delay.";
  if (id === "disconnect") return snapshot.network.connected ? `Heartbeat age is ${Math.round(snapshot.safety.heartbeatAgeMs)} ms. Disconnect while moving.` : `Heartbeat age: ${Math.round(snapshot.safety.heartbeatAgeMs)} ms. Safety state: ${snapshot.safety.state.replace("-", " ")}.`;
  return snapshot.machine.target ? "The edge computer is moving toward the target without a command for every small step." : "Click the construction site to give the edge computer a target.";
}
