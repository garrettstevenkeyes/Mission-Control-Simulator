import { useEffect, useState } from "react";
import { Camera, ChevronDown, Eye, Gauge, Play, RotateCcw, Send, ShieldCheck, Wifi } from "lucide-react";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { buildCommandTrace, getTraceLesson, type TraceStepStatus } from "../presentation/commandTrace";
import type { LoopTiming, NetworkPacket } from "../types";
import { PacketFlow } from "./PacketFlow";

const stepIcons = {
  created: Send,
  network: Wifi,
  edge: ShieldCheck,
  reaction: Gauge,
  measured: Camera,
  returned: Eye,
};

function statusTone(status: LoopTiming["result"]): "good" | "warn" | "bad" | "neutral" {
  if (status === "applied") return "good";
  if (status === "in-flight") return "neutral";
  if (status === "too-old" || status === "out-of-order") return "warn";
  return "bad";
}

function stepLabel(status: TraceStepStatus): string {
  if (status === "complete") return "done";
  if (status === "active") return "now";
  if (status === "error") return "stopped";
  return "next";
}

export function CommandTrace({
  timing,
  packets,
  now,
  connected,
}: {
  timing: LoopTiming | null;
  packets: NetworkPacket[];
  now: number;
  connected: boolean;
}) {
  const [replayStartedAt, setReplayStartedAt] = useState<number | null>(null);

  useEffect(() => setReplayStartedAt(null), [timing?.commandSequence]);

  if (!timing) {
    return (
      <section className="panel trace-panel" aria-labelledby="trace-title">
        <div className="trace-heading"><div><span className="eyebrow">TRACE ONE COMMAND</span><h2 id="trace-title">See cause and effect</h2></div></div>
        <div className="trace-empty"><Send /><strong>Send a movement command</strong><p>This view will follow that command to the machine and bring its feedback back.</p></div>
      </section>
    );
  }

  const replayNow = replayStartedAt === null ? now : timing.sentAt + (now - replayStartedAt) * 0.65;
  const traceEndAt = timing.feedbackAt ?? timing.receivedAt ?? timing.scheduledDeliveryAt;
  const viewNow = replayStartedAt === null ? now : Math.min(replayNow, traceEndAt + 450);
  const steps = buildCommandTrace(timing, viewNow);
  const replayFinished = replayStartedAt !== null && replayNow >= traceEndAt + 450;
  const displaySteps = replayFinished ? buildCommandTrace(timing, now) : steps;
  const resultVisibleAt = timing.receivedAt ?? timing.scheduledDeliveryAt;
  const displayedResult = viewNow >= resultVisibleAt ? timing.result : "in-flight";
  const terminal = timing.feedbackAt !== undefined || ["lost", "disconnected", "too-old", "out-of-order"].includes(timing.result);
  const canReplay = terminal && now >= traceEndAt;

  return (
    <section className="panel trace-panel" aria-labelledby="trace-title">
      <div className="trace-heading">
        <div><span className="eyebrow">TRACE ONE COMMAND</span><h2 id="trace-title">Follow command #{timing.commandSequence}</h2></div>
        <div className="trace-actions">
          <StatusBadge tone={statusTone(displayedResult)}>{displayedResult.replace("-", " ")}</StatusBadge>
          <button disabled={!canReplay} onClick={() => setReplayStartedAt(replayStartedAt === null ? now : null)}>
            {replayStartedAt === null ? <Play /> : <RotateCcw />}{replayStartedAt === null ? "Replay slowly" : "Return live"}
          </button>
        </div>
      </div>

      <div className="trace-command"><span>COMMAND</span><strong>{timing.commandType.replace("-", " ")}</strong><small>#{timing.commandSequence}</small></div>

      <div className="trace-steps">
        {displaySteps.map((step, index) => {
          const Icon = stepIcons[step.id];
          return (
            <article className={`trace-step trace-${step.status}`} key={step.id}>
              <div className="trace-step-marker"><span>0{index + 1}</span><i><Icon /></i></div>
              <div className="trace-step-copy"><small>{stepLabel(step.status)}</small><h3>{step.title}</h3><p>{step.description}</p><strong>{step.outcome}</strong></div>
            </article>
          );
        })}
      </div>

      <div className="trace-lesson"><span>WHAT THIS SHOWS</span><p>{getTraceLesson(timing, replayFinished ? now : viewNow)}</p></div>

      <details className="advanced-packets">
        <summary><span>Live packet stream <small>Advanced view</small></span><ChevronDown /></summary>
        <p>All packet types are shown together here. The visual replay is slowed; the simulator still uses the measured timing.</p>
        <PacketFlow packets={packets} now={now} connected={connected} />
      </details>
    </section>
  );
}
