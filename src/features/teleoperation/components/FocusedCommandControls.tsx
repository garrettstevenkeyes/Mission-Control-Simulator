import { Octagon, RotateCcw, RotateCw, ArrowUp } from "lucide-react";
import type { CommandType, SafetyState } from "../types";
import { StatusBadge } from "../../../shared/components/StatusBadge";

export function FocusedCommandControls({
  activeCommand,
  safetyState,
  onCommand,
}: {
  activeCommand: CommandType;
  safetyState: SafetyState;
  onCommand: (command: CommandType) => void;
}) {
  const press = (command: CommandType) => ({
    onPointerDown: () => onCommand(command),
    onPointerUp: () => onCommand("stop"),
    onPointerLeave: () => onCommand("stop"),
  });

  return (
    <section className="panel focused-command-panel" aria-labelledby="focused-command-title">
      <div className="panel-heading">
        <div><span className="eyebrow">SEND A COMMAND</span><h2 id="focused-command-title">Drive controls</h2></div>
        <StatusBadge tone={safetyState === "normal" ? "good" : safetyState === "degraded" ? "warn" : "bad"}>{safetyState.replace("-", " ")}</StatusBadge>
      </div>
      <div className="focused-command-readout"><span>Requested</span><strong>{activeCommand.replace("-", " ")}</strong></div>
      <div className="focused-command-buttons" role="group" aria-label="Focused machine controls">
        <button {...press("forward")}><ArrowUp /> Forward</button>
        <button {...press("rotate-left")}><RotateCcw /> Left</button>
        <button {...press("rotate-right")}><RotateCw /> Right</button>
        <button className="focused-stop" onClick={() => onCommand("stop")}><Octagon /> Stop</button>
      </div>
      <p>Hold a movement button, then release it to send Stop.</p>
    </section>
  );
}
