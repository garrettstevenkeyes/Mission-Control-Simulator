import { Check, Clock3 } from "lucide-react";
import type { LoopTiming } from "../types";

export function FeedbackLoop({ timing }: { timing: LoopTiming | null }) {
  const base = timing?.sentAt ?? 0;
  const steps = timing ? [
    ["Command sent", 0],
    ["Machine received", timing.receivedAt ? timing.receivedAt - base : null],
    ["Machine reacted", timing.reactedAt ? timing.reactedAt - base : null],
    ["Feedback arrived", timing.feedbackAt ? timing.feedbackAt - base : null],
  ] as const : [];
  return (
    <section className="panel loop-panel" aria-labelledby="loop-title">
      <div className="panel-heading"><div><span className="eyebrow">FEEDBACK LOOP</span><h2 id="loop-title">The operator waits for the round trip</h2></div>{timing?.feedbackAt && <strong className="loop-total">{Math.round(timing.feedbackAt - timing.sentAt)} ms total</strong>}</div>
      {!timing ? <p className="empty-state">Send a command to trace its full trip.</p> : (
        <div className="loop-steps">
          {steps.map(([label, offset], index) => (
            <div className={`loop-step ${offset === null ? "pending" : ""}`} key={label}>
              <span>{offset === null ? <Clock3 /> : <Check />}</span><div><small>0{index + 1}</small><strong>{label}</strong></div><b>{offset === null ? "waiting" : `+${Math.round(offset)} ms`}</b>
            </div>
          ))}
        </div>
      )}
      <p className="lesson-line">The operator reacts to the full loop, not only the command trip.</p>
    </section>
  );
}
