import { useEffect, useRef } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Octagon, RotateCcw, RotateCw } from "lucide-react";
import type { CommandType, ControlMode, SafetyState } from "../types";
import { StatusBadge } from "../../../shared/components/StatusBadge";

const keys: Record<string, CommandType> = {
  w: "forward", ArrowUp: "forward", s: "backward", ArrowDown: "backward",
  a: "rotate-left", ArrowLeft: "rotate-left", d: "rotate-right", ArrowRight: "rotate-right",
};

export function OperatorStation({
  activeCommand,
  mode,
  safetyState,
  onCommand,
  onMode,
  onEmergencyStop,
}: {
  activeCommand: CommandType;
  mode: ControlMode;
  safetyState: SafetyState;
  onCommand: (command: CommandType) => void;
  onMode: (mode: ControlMode) => void;
  onEmergencyStop: (active: boolean) => void;
}) {
  const held = useRef(new Set<string>());

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.matches("input, select, button")) return;
      const command = keys[event.key];
      if (!command || held.current.has(event.key)) return;
      event.preventDefault();
      held.current.add(event.key);
      onCommand(command);
    };
    const up = (event: KeyboardEvent) => {
      if (!keys[event.key]) return;
      held.current.delete(event.key);
      onCommand("stop");
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [onCommand]);

  const press = (command: CommandType) => ({
    onPointerDown: () => onCommand(command),
    onPointerUp: () => onCommand("stop"),
    onPointerLeave: () => onCommand("stop"),
  });

  return (
    <section className="panel operator-panel" aria-labelledby="operator-title">
      <div className="panel-heading">
        <div><span className="eyebrow">01 / SEND</span><h2 id="operator-title">Operator station</h2></div>
        <StatusBadge tone={safetyState === "normal" ? "good" : safetyState === "degraded" ? "warn" : "bad"}>{safetyState.replace("-", " ")}</StatusBadge>
      </div>

      <div className="mode-tabs" role="group" aria-label="Control mode">
        {(["direct", "assisted", "supervised"] as ControlMode[]).map((item) => (
          <button key={item} className={mode === item ? "active" : ""} onClick={() => onMode(item)}>
            {item === "supervised" ? "Supervised" : item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      <div className="command-readout">
        <span>Requested command</span><strong>{activeCommand.replace("-", " ")}</strong>
      </div>

      <div className="control-pad" aria-label="Machine controls">
        <button className="control-button forward" aria-label="Move forward" {...press("forward")}><ArrowUp /></button>
        <button className="control-button left" aria-label="Rotate left" {...press("rotate-left")}><RotateCcw /></button>
        <button className="control-button stop" aria-label="Stop" onClick={() => onCommand("stop")}><Octagon /></button>
        <button className="control-button right" aria-label="Rotate right" {...press("rotate-right")}><RotateCw /></button>
        <button className="control-button backward" aria-label="Move backward" {...press("backward")}><ArrowDown /></button>
      </div>

      <div className="bucket-controls">
        <button {...press("bucket-up")}><ArrowUp size={15} /> Bucket up</button>
        <button {...press("bucket-down")}><ArrowDown size={15} /> Bucket down</button>
      </div>
      <p className="keyboard-hint"><kbd>WASD</kbd> or arrow keys also work.</p>
      <button className="emergency-button" onPointerDown={() => onEmergencyStop(true)} onClick={() => onEmergencyStop(safetyState === "emergency-stop" ? false : true)}>
        <Octagon size={18} /> {safetyState === "emergency-stop" ? "Release emergency stop" : "Emergency stop"}
      </button>
    </section>
  );
}
