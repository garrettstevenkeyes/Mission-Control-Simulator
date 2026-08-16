import type { LoopTiming } from "../types";

export type TraceStepStatus = "complete" | "active" | "waiting" | "error";

export interface TraceStep {
  id: "created" | "network" | "edge" | "reaction" | "measured" | "returned";
  title: string;
  description: string;
  at?: number;
  status: TraceStepStatus;
  outcome: string;
}

function hasHappened(at: number | undefined, viewNow: number): boolean {
  return at !== undefined && at <= viewNow;
}

export function buildCommandTrace(timing: LoopTiming, viewNow: number): TraceStep[] {
  const networkFinishedAt = timing.receivedAt ?? timing.scheduledDeliveryAt;
  const networkFinished = hasHappened(networkFinishedAt, viewNow);
  const rejected = timing.result === "too-old" || timing.result === "out-of-order";
  const lost = timing.result === "lost" || timing.result === "disconnected";
  const received = hasHappened(timing.receivedAt, viewNow);
  const reacted = hasHappened(timing.reactedAt, viewNow);
  const measured = hasHappened(timing.feedbackMeasuredAt, viewNow);
  const returned = hasHappened(timing.feedbackAt, viewNow);

  return [
    {
      id: "created",
      title: "Command created",
      description: `Mission Control stamped command #${timing.commandSequence} with its time and sequence number.`,
      at: timing.sentAt,
      status: "complete",
      outcome: "+0 ms",
    },
    {
      id: "network",
      title: "Command crosses the network",
      description: lost && networkFinished ? "The packet did not reach the edge computer." : "The outbound link adds delay and may lose the packet.",
      at: networkFinished ? networkFinishedAt : undefined,
      status: !networkFinished ? "active" : lost ? "error" : "complete",
      outcome: !networkFinished ? "traveling" : lost ? (timing.result === "disconnected" ? "link offline" : "dropped") : `${Math.round(networkFinishedAt - timing.sentAt)} ms`,
    },
    {
      id: "edge",
      title: "Edge checks the command",
      description: rejected && received ? "The edge computer used age and order checks to stop this command." : "The edge computer checks command age and order before using it.",
      at: received ? timing.receivedAt : undefined,
      status: lost && networkFinished ? "waiting" : !received ? "waiting" : rejected ? "error" : "complete",
      outcome: lost && networkFinished ? "never arrived" : !received ? "waiting" : rejected ? (timing.result === "too-old" ? "rejected: too old" : "rejected: old order") : "accepted",
    },
    {
      id: "reaction",
      title: "Machine reacts",
      description: "The local controller turns an accepted command into machine movement.",
      at: reacted ? timing.reactedAt : undefined,
      status: reacted ? "complete" : "waiting",
      outcome: reacted ? `${Math.round(timing.reactedAt! - timing.sentAt)} ms` : rejected ? "blocked by edge" : lost && networkFinished ? "no command" : "waiting",
    },
    {
      id: "measured",
      title: "Feedback is measured",
      description: "A camera or sensor captures the machine after it starts reacting.",
      at: measured ? timing.feedbackMeasuredAt : undefined,
      status: measured ? "complete" : "waiting",
      outcome: measured ? `${Math.round(timing.feedbackMeasuredAt! - timing.sentAt)} ms` : reacted ? "waiting for sample" : "waiting",
    },
    {
      id: "returned",
      title: "Operator sees the result",
      description: "The feedback crosses the return path and updates the operator's view.",
      at: returned ? timing.feedbackAt : undefined,
      status: returned ? "complete" : "waiting",
      outcome: returned ? `${Math.round(timing.feedbackAt! - timing.sentAt)} ms total` : measured ? "returning" : "waiting",
    },
  ];
}

export function getTraceLesson(timing: LoopTiming, viewNow: number): string {
  const networkFinished = viewNow >= (timing.receivedAt ?? timing.scheduledDeliveryAt);
  if (networkFinished && timing.result === "lost") return "This command disappeared in the network. The machine cannot react to a command it never received.";
  if (networkFinished && timing.result === "disconnected") return "The link was offline. Local safety must handle the machine because Mission Control cannot reach it.";
  if (timing.result === "too-old" && timing.receivedAt && viewNow >= timing.receivedAt) return "The command arrived, but it was too old. The edge computer ignored it instead of acting on stale intent.";
  if (timing.result === "out-of-order" && timing.receivedAt && viewNow >= timing.receivedAt) return "A newer command had already arrived. The sequence check stopped this older command from taking control.";
  if (timing.feedbackAt && viewNow >= timing.feedbackAt) {
    const outbound = Math.round((timing.receivedAt ?? timing.sentAt) - timing.sentAt);
    const total = Math.round(timing.feedbackAt - timing.sentAt);
    return `The command trip took ${outbound} ms, but the operator waited ${total} ms for the full feedback loop.`;
  }
  return "Follow the highlighted step. Each part of the loop adds time before the operator can react again.";
}
