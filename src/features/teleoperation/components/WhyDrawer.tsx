import { X } from "lucide-react";
import { whyTopics } from "../learning/explanations";

export function WhyDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="why-drawer" onMouseDown={(event) => event.stopPropagation()} aria-modal="true" role="dialog" aria-labelledby="why-title">
        <div className="drawer-heading"><div><span className="eyebrow">PLAIN ANSWERS</span><h2 id="why-title">Why is the system built this way?</h2></div><button aria-label="Close Why panel" onClick={onClose}><X /></button></div>
        <div className="why-list">{whyTopics.map(([title, answer]) => <details key={title}><summary>{title}<span>+</span></summary><p>{answer}</p></details>)}</div>
        <p className="drawer-note">These are simplified examples for learning. Real systems set limits based on the machine, task, operator, network, and safety design.</p>
      </aside>
    </div>
  );
}
