import { ArrowRight, Lightbulb } from "lucide-react";
import { currentExplanation } from "../learning/explanations";
import type { SimulationSnapshot } from "../types";

export function ExplanationPanel({ snapshot, deep }: { snapshot: SimulationSnapshot; deep: boolean }) {
  const explanation = currentExplanation(snapshot, deep);
  return (
    <section className="explanation-panel" aria-live="polite">
      <span className="explanation-icon"><Lightbulb /></span>
      <div><span className="eyebrow">WHAT CHANGED?</span><h2>{explanation.title}</h2><p>{explanation.text}</p><small><ArrowRight /> {explanation.action}</small></div>
    </section>
  );
}
