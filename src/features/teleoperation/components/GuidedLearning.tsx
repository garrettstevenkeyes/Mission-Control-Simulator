import { useEffect, useState } from "react";
import { ArrowRight, Check, Circle, Eye, FlaskConical, Lightbulb, Play, Target, Wrench } from "lucide-react";
import {
  getLiveLabObservation,
  guidedLabs,
  isGuidedLabComplete,
  type GuidedLabDefinition,
} from "../learning/guidedLabs";
import type { SimulationSnapshot } from "../types";

export function GuidedLearning({
  snapshot,
  activeLabIndex,
  onChangeLab,
  onLoadSetup,
}: {
  snapshot: SimulationSnapshot;
  activeLabIndex: number;
  onChangeLab: (index: number) => void;
  onLoadSetup: (lab: GuidedLabDefinition) => void;
}) {
  const [completedLabs, setCompletedLabs] = useState<Set<string>>(() => new Set());
  const lab = guidedLabs[activeLabIndex];
  const currentComplete = isGuidedLabComplete(lab.id, snapshot);
  const explanationRevealed = currentComplete || completedLabs.has(lab.id);

  useEffect(() => {
    if (!currentComplete) return;
    setCompletedLabs((completed) => completed.has(lab.id) ? completed : new Set([...completed, lab.id]));
  }, [currentComplete, lab.id]);

  const completedCount = completedLabs.size;

  return (
    <section className="panel guided-learning" aria-labelledby="guided-learning-title">
      <div className="guided-header">
        <div><span className="eyebrow">GUIDED LEARNING PATH</span><h2 id="guided-learning-title">Learn by changing one thing at a time</h2><p>Each lab gives you a question, an experiment, and a clear engineering takeaway.</p></div>
        <div className="lab-progress"><strong>{completedCount} / {guidedLabs.length}</strong><span>labs completed</span><i><b style={{ width: `${(completedCount / guidedLabs.length) * 100}%` }} /></i></div>
      </div>

      <nav className="lab-nav" aria-label="Network learning labs">
        {guidedLabs.map((item, index) => {
          const complete = completedLabs.has(item.id);
          return <button className={index === activeLabIndex ? "active" : ""} onClick={() => onChangeLab(index)} key={item.id}><span>{complete ? <Check /> : String(index + 1).padStart(2, "0")}</span><strong>{item.shortTitle}</strong></button>;
        })}
      </nav>

      <div className="guided-body">
        <div className="lab-experiment">
          <div className="lab-number"><span>LAB {String(activeLabIndex + 1).padStart(2, "0")}</span>{completedLabs.has(lab.id) && <b><Check /> completed</b>}</div>
          <h3>{lab.title}</h3>
          <p className="lab-question">{lab.question}</p>
          <div className="lab-goal"><Target /><div><span>GOAL</span><p>{lab.goal}</p></div></div>
          <button className="load-lab-button" onClick={() => onLoadSetup(lab)}><Play /> Load this lab's setup</button>

          <div className="try-this"><span className="lesson-label"><FlaskConical /> TRY THIS</span><ol>{lab.steps.map((step) => <li key={step}><span>{step}</span></li>)}</ol></div>
        </div>

        <div className="lab-teaching">
          <div className="watch-card">
            <span className="lesson-label"><Eye /> WATCH THESE</span>
            <div>{lab.watch.map((item) => <span key={item}><Circle />{item}</span>)}</div>
          </div>

          <div className={`live-observation ${currentComplete ? "observation-complete" : ""}`} aria-live="polite">
            <span>{currentComplete ? <Check /> : <Eye />}</span><div><small>LIVE OBSERVATION</small><p>{getLiveLabObservation(lab.id, snapshot)}</p></div>
          </div>

          {explanationRevealed ? (
            <div className="lesson-reveal">
              <div className="lesson-explanation">
                <div><span className="lesson-label"><Lightbulb /> WHAT HAPPENED</span><p>{lab.whatHappened}</p></div>
                <div><span className="lesson-label"><Wrench /> WHAT AN ENGINEER CAN DO</span><p>{lab.engineeringResponse}</p></div>
              </div>
              <div className="lab-takeaway"><span>TAKEAWAY</span><p>{lab.takeaway}</p></div>
              <button className="next-lab-button" disabled={activeLabIndex === guidedLabs.length - 1} onClick={() => onChangeLab(Math.min(guidedLabs.length - 1, activeLabIndex + 1))}>
                Next lab <ArrowRight />
              </button>
            </div>
          ) : (
            <div className="lesson-locked"><Lightbulb /><div><strong>Explanation hidden for now</strong><p>Run the experiment first. The result and engineering takeaway will appear here.</p></div></div>
          )}
        </div>
      </div>
    </section>
  );
}
