import { HeartPulse, ShieldCheck, ShieldAlert } from "lucide-react";
import type { SafetyConfig, SafetyStatus } from "../types";
import { StatusBadge } from "../../../shared/components/StatusBadge";

export function SafetyPanel({ safety, config }: { safety: SafetyStatus; config: SafetyConfig }) {
  const progress = Math.min(100, (safety.heartbeatAgeMs / config.heartbeatTimeoutMs) * 100);
  return (
    <section className="panel safety-panel" aria-labelledby="safety-title">
      <div className="panel-heading"><div><span className="eyebrow">LOCAL DECISION</span><h2 id="safety-title">Edge safety controller</h2></div>{safety.state === "normal" ? <ShieldCheck /> : <ShieldAlert />}</div>
      <StatusBadge tone={safety.state === "normal" ? "good" : safety.state === "degraded" ? "warn" : "bad"}>{safety.reason}</StatusBadge>
      <div className="heartbeat-readout"><span><HeartPulse size={16} /> Latest heartbeat age</span><strong>{Math.round(safety.heartbeatAgeMs)} ms</strong></div>
      <div className="heartbeat-bar"><i style={{ width: `${progress}%` }} /></div>
      <div className="thresholds">
        <span>Heartbeat timeout <b>{config.heartbeatTimeoutMs} ms</b></span>
        <span>Max command age <b>{config.maxCommandAgeMs} ms</b></span>
        <span>High latency speed limit <b>{config.highLatencyRttMs} ms RTT</b></span>
        <span>High loss degraded mode <b>{config.highLossPercent}%</b></span>
      </div>
      <p className="limits-note">Educational rules only. These are not real equipment safety standards.</p>
    </section>
  );
}
