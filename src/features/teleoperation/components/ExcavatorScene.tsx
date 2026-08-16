import { Crosshair, Radio } from "lucide-react";
import type { ControlMode, MachineState, Telemetry } from "../types";

function Excavator({ x, y, heading, bucket, ghost = false }: { x: number; y: number; heading: number; bucket: number; ghost?: boolean }) {
  return (
    <div className={`excavator ${ghost ? "excavator-ghost" : ""}`} style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) rotate(${heading}deg)` }}>
      <div className="track track-top" /><div className="track track-bottom" />
      <div className="machine-body"><div className="cab" /><div className="engine" /></div>
      <div className="boom" style={{ transform: `rotate(${-18 + bucket * 0.12}deg)` }}><div className="bucket" /></div>
      <div className="heading-line" />
    </div>
  );
}

export function ExcavatorScene({ machine, operatorView, mode, quality, onTarget }: { machine: MachineState; operatorView: Telemetry; mode: ControlMode; quality: string; onTarget: (x: number, y: number) => void }) {
  const placeTarget = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onTarget(((event.clientX - rect.left) / rect.width) * 100, ((event.clientY - rect.top) / rect.height) * 100);
  };
  return (
    <section className="panel scene-panel" aria-labelledby="scene-title">
      <div className="panel-heading scene-heading">
        <div><span className="eyebrow">02 / ACT</span><h2 id="scene-title">Excavator site</h2></div>
        <span className={`feed-chip quality-${quality}`}><Radio size={13} /> visual feed · {quality}</span>
      </div>
      <div className={`site-view quality-${quality}`} onClick={placeTarget} role={mode === "supervised" ? "button" : undefined} tabIndex={mode === "supervised" ? 0 : undefined} aria-label={mode === "supervised" ? "Click to set a movement target" : "Construction site view"}>
        <div className="site-grid" /><div className="dirt-pile pile-one" /><div className="dirt-pile pile-two" />
        <div className="barrier barrier-one" /><div className="barrier barrier-two" />
        <span className="site-label label-a">ZONE A</span><span className="site-label label-b">DIG AREA</span>
        {machine.target && <div className="target-marker" style={{ left: `${machine.target.x}%`, top: `${machine.target.y}%` }}><Crosshair /><span>LOCAL TARGET</span></div>}
        <Excavator x={operatorView.x} y={operatorView.y} heading={operatorView.heading} bucket={operatorView.bucket} ghost />
        <Excavator x={machine.x} y={machine.y} heading={machine.heading} bucket={machine.bucket} />
        <div className="scene-legend"><span><i className="actual-key" /> Machine now</span><span><i className="feed-key" /> Operator's last view</span></div>
        {mode === "supervised" && <div className="target-help">Click the site to send a target. Movement happens locally.</div>}
      </div>
    </section>
  );
}
