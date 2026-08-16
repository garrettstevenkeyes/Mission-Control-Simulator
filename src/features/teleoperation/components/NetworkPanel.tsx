import { Link2, Link2Off, RotateCcw } from "lucide-react";
import { SliderControl } from "../../../shared/components/SliderControl";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import type { ControlMode, NetworkCondition } from "../types";

const presets = [
  { name: "Healthy", values: { rttMs: 50, jitterMs: 5, packetLossPercent: 0, bandwidthMbps: 12, connected: true } },
  { name: "High latency", values: { rttMs: 400, jitterMs: 10, packetLossPercent: 0, bandwidthMbps: 8, connected: true } },
  { name: "High jitter", values: { rttMs: 120, jitterMs: 220, packetLossPercent: 1, bandwidthMbps: 8, connected: true } },
  { name: "Packet loss", values: { rttMs: 100, jitterMs: 20, packetLossPercent: 15, bandwidthMbps: 5, connected: true } },
];

export function NetworkPanel({ network, rejectStale, onChange, onRejectStale, onMode }: { network: NetworkCondition; rejectStale: boolean; onChange: (change: Partial<NetworkCondition>) => void; onRejectStale: (enabled: boolean) => void; onMode: (mode: ControlMode) => void }) {
  return (
    <section className="panel network-panel" aria-labelledby="network-title">
      <div className="panel-heading">
        <div><span className="eyebrow">03 / CHANGE</span><h2 id="network-title">Network lab</h2></div>
        <StatusBadge tone={network.connected ? "good" : "bad"}>{network.connected ? "connected" : "offline"}</StatusBadge>
      </div>
      <div className="preset-grid">
        {presets.map((preset) => <button key={preset.name} onClick={() => onChange(preset.values)}>{preset.name}</button>)}
        <button onClick={() => onChange({ connected: false })}>Disconnect</button>
        <button onClick={() => { onChange({ rttMs: 600, jitterMs: 100, packetLossPercent: 10, bandwidthMbps: 2, connected: true }); onMode("supervised"); }}>Local control</button>
      </div>
      <div className="sliders">
        <SliderControl label="Round-trip latency" value={network.rttMs} min={20} max={1000} step={10} unit=" ms" onChange={(rttMs) => onChange({ rttMs })} />
        <SliderControl label="Jitter" value={network.jitterMs} min={0} max={300} step={5} unit=" ms" onChange={(jitterMs) => onChange({ jitterMs })} />
        <SliderControl label="Packet loss" value={network.packetLossPercent} min={0} max={30} step={1} unit="%" onChange={(packetLossPercent) => onChange({ packetLossPercent })} />
        <SliderControl label="Bandwidth" value={network.bandwidthMbps} min={0.5} max={12} step={0.5} unit=" Mbps" onChange={(bandwidthMbps) => onChange({ bandwidthMbps })} />
      </div>
      <label className="toggle-row">
        <span><strong>Reject stale commands</strong><small>Ignore commands that arrive too late.</small></span>
        <input type="checkbox" checked={rejectStale} onChange={(event) => onRejectStale(event.target.checked)} />
      </label>
      <button className={`disconnect-button ${network.connected ? "" : "reconnect"}`} onClick={() => onChange({ connected: !network.connected })}>
        {network.connected ? <Link2Off size={17} /> : <Link2 size={17} />}
        {network.connected ? "Disconnect network" : "Reconnect network"}
      </button>
      <p className="limits-note"><RotateCcw size={13} /> These ranges teach behavior. They are not machinery safety limits.</p>
    </section>
  );
}
