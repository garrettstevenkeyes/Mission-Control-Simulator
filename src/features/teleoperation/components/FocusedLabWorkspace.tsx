import { Activity, Clock3, Gauge, HeartPulse, Radio, ShieldCheck, Timer, Waves, Wifi, WifiOff } from "lucide-react";
import { MetricCard } from "../../../shared/components/MetricCard";
import { SliderControl } from "../../../shared/components/SliderControl";
import { useReadableAge } from "../../../shared/hooks/useReadableAge";
import { getLabWorkspace } from "../learning/labWorkspace";
import { formatReportedSpeed } from "../presentation/telemetryFormatters";
import type { GuidedLabDefinition } from "../learning/guidedLabs";
import type { CommandType, ControlMode, NetworkCondition, SafetyConfig, SimulationSnapshot } from "../types";
import { CommandTimeline } from "./CommandTimeline";
import { CommandTrace } from "./CommandTrace";
import { ExcavatorScene } from "./ExcavatorScene";
import { FocusedCommandControls } from "./FocusedCommandControls";
import { SafetyPanel } from "./SafetyPanel";

interface FocusedLabWorkspaceProps {
  lab: GuidedLabDefinition;
  snapshot: SimulationSnapshot;
  safetyConfig: SafetyConfig;
  rejectStale: boolean;
  onCommand: (command: CommandType) => void;
  onNetworkChange: (change: Partial<NetworkCondition>) => void;
  onMode: (mode: ControlMode) => void;
  onRejectStale: (enabled: boolean) => void;
  onTarget: (x: number, y: number) => void;
}

function formatLoopTime(snapshot: SimulationSnapshot): string {
  const timing = snapshot.loopTiming;
  return timing?.feedbackAt === undefined ? "—" : `${Math.round(timing.feedbackAt - timing.sentAt)} ms`;
}

function commandAgeRange(snapshot: SimulationSnapshot): string {
  const ages = snapshot.commands.flatMap((item) => item.ageMs === undefined ? [] : [item.ageMs]);
  if (ages.length < 2) return "Send 3+";
  return `${Math.round(Math.min(...ages))}–${Math.round(Math.max(...ages))} ms`;
}

function latestCommandAge(snapshot: SimulationSnapshot): string {
  const age = snapshot.commands.find((item) => item.ageMs !== undefined)?.ageMs;
  return age === undefined ? "—" : `${Math.round(age)} ms`;
}

function FocusMetrics({ lab, snapshot, safetyConfig }: { lab: GuidedLabDefinition; snapshot: SimulationSnapshot; safetyConfig: SafetyConfig }) {
  const telemetryAge = useReadableAge(snapshot.now, snapshot.telemetry.measuredAt);
  const dropRate = snapshot.stats.sent ? (snapshot.stats.dropped / snapshot.stats.sent) * 100 : 0;

  if (lab.id === "baseline") {
    return <><MetricCard label="Configured network RTT" value={`${snapshot.network.rttMs} ms`} hint="network travel only" icon={<Timer />} /><MetricCard label="Measured command-to-view" value={formatLoopTime(snapshot)} hint="complete feedback loop" icon={<Activity />} /></>;
  }
  if (lab.id === "latency") {
    return <><MetricCard label="Command trip" value={`~${Math.round(snapshot.network.rttMs / 2)} ms`} hint="outbound estimate" icon={<Radio />} /><MetricCard label="Measured command-to-view" value={formatLoopTime(snapshot)} hint="complete feedback loop" icon={<Timer />} /><MetricCard label="View age" value={`${telemetryAge.ageMs} ms`} status={telemetryAge.status} hint="operator's last measurement" icon={<Activity />} /></>;
  }
  if (lab.id === "jitter") {
    return <><MetricCard label="Jitter setting" value={`${snapshot.network.jitterMs} ms`} hint="delay can vary by this much" icon={<Waves />} /><MetricCard label="Command age range" value={commandAgeRange(snapshot)} hint="compare uneven arrivals" icon={<Clock3 />} /></>;
  }
  if (lab.id === "loss") {
    return <><MetricCard label="Dropped packets" value={snapshot.stats.dropped} hint="never arrived" icon={<WifiOff />} /><MetricCard label="Observed drop rate" value={`${dropRate.toFixed(1)}%`} hint="all packet types" icon={<Wifi />} /><MetricCard label="State age" value={`${telemetryAge.ageMs} ms`} status={telemetryAge.status} hint="fresh updates may still arrive" icon={<Activity />} /></>;
  }
  if (lab.id === "stale") {
    return <><MetricCard label="Latest command age" value={latestCommandAge(snapshot)} hint="age at the edge" icon={<Clock3 />} /><MetricCard label="Maximum age" value={`${safetyConfig.maxCommandAgeMs} ms`} hint="educational rule" icon={<Timer />} /><MetricCard label="Rejected as old" value={snapshot.stats.staleCommands} hint="not executed" icon={<ShieldCheck />} /></>;
  }
  if (lab.id === "disconnect") {
    return <><MetricCard label="Connection" value={snapshot.network.connected ? "Online" : "Offline"} status={{ label: snapshot.network.connected ? "Live" : "Lost", tone: snapshot.network.connected ? "good" : "bad" }} hint="remote link" icon={snapshot.network.connected ? <Wifi /> : <WifiOff />} /><MetricCard label="Heartbeat age" value={`${Math.round(snapshot.safety.heartbeatAgeMs)} ms`} hint={`timeout at ${safetyConfig.heartbeatTimeoutMs} ms`} icon={<HeartPulse />} /><MetricCard label="Machine speed" value={formatReportedSpeed(snapshot.machine.speed)} hint={snapshot.safety.reason} icon={<Gauge />} /></>;
  }
  return <><MetricCard label="Control mode" value={snapshot.mode === "supervised" ? "Local task" : "Direct"} hint="where small steps happen" icon={<ShieldCheck />} /><MetricCard label="Configured network RTT" value={`${snapshot.network.rttMs} ms`} hint="network travel only" icon={<Timer />} /><MetricCard label="Visual updates" value={`${snapshot.feedbackRateFps} fps`} hint="remote feedback only" icon={<Activity />} /></>;
}

function FocusControls({
  lab,
  snapshot,
  rejectStale,
  onNetworkChange,
  onMode,
  onRejectStale,
}: Pick<FocusedLabWorkspaceProps, "lab" | "snapshot" | "rejectStale" | "onNetworkChange" | "onMode" | "onRejectStale">) {
  if (lab.id === "baseline") return <p className="fixed-setup-note"><span>Fixed setup</span> Healthy network · 50 ms RTT · 5 ms jitter · no loss</p>;

  if (lab.id === "disconnect") {
    return <button className={`focus-disconnect ${snapshot.network.connected ? "" : "reconnect"}`} onClick={() => onNetworkChange({ connected: !snapshot.network.connected })}>{snapshot.network.connected ? <><WifiOff /> Disconnect network</> : <><Wifi /> Reconnect network</>}</button>;
  }

  return (
    <div className="focus-control-grid">
      {(lab.id === "latency" || lab.id === "stale" || lab.id === "local-control") && <SliderControl label="Round-trip latency" value={snapshot.network.rttMs} min={20} max={1000} step={10} unit=" ms" onChange={(rttMs) => onNetworkChange({ rttMs })} />}
      {lab.id === "jitter" && <SliderControl label="Jitter" value={snapshot.network.jitterMs} min={0} max={300} step={5} unit=" ms" onChange={(jitterMs) => onNetworkChange({ jitterMs })} />}
      {lab.id === "loss" && <SliderControl label="Packet loss" value={snapshot.network.packetLossPercent} min={0} max={30} unit="%" onChange={(packetLossPercent) => onNetworkChange({ packetLossPercent })} />}
      {lab.id === "stale" && <label className="focus-toggle"><span><strong>Reject stale commands</strong><small>Ignore commands older than 500 ms.</small></span><input type="checkbox" checked={rejectStale} onChange={(event) => onRejectStale(event.target.checked)} /></label>}
      {lab.id === "local-control" && <div className="focus-mode-control"><span>Compare where control runs</span><div><button className={snapshot.mode === "direct" ? "active" : ""} onClick={() => onMode("direct")}>Direct control</button><button className={snapshot.mode === "supervised" ? "active" : ""} onClick={() => onMode("supervised")}>Local task</button></div></div>}
    </div>
  );
}

export function FocusedLabWorkspace(props: FocusedLabWorkspaceProps) {
  const { lab, snapshot, safetyConfig, onCommand, onMode, onTarget } = props;
  const workspace = getLabWorkspace(lab.id);
  const has = (module: (typeof workspace.modules)[number]) => workspace.modules.includes(module);
  const primaryViewCount = workspace.modules.filter((module) => module !== "trace").length;

  return (
    <section className="focused-workspace" aria-labelledby="focused-workspace-title">
      <div className="focus-heading">
        <div><span className="eyebrow">LAB WORKSPACE · {lab.shortTitle.toUpperCase()}</span><h2 id="focused-workspace-title">Only watch what matters here</h2><p>{workspace.focus}</p></div>
        <span className="focus-scope">{workspace.modules.length} learning {workspace.modules.length === 1 ? "view" : "views"}</span>
      </div>

      <div className="focus-controls"><FocusControls {...props} /></div>
      <div className="focus-metrics"><FocusMetrics lab={lab} snapshot={snapshot} safetyConfig={safetyConfig} /></div>

      <div className={`focus-module-grid focus-modules-${primaryViewCount}`}>
        {has("commands") && <FocusedCommandControls activeCommand={snapshot.requestedCommand} safetyState={snapshot.safety.state} onCommand={onCommand} />}
        {has("scene") && <ExcavatorScene machine={snapshot.machine} operatorView={snapshot.operatorView} mode={snapshot.mode} quality={snapshot.feedbackQuality} onTarget={onTarget} />}
        {has("timeline") && <CommandTimeline commands={snapshot.commands} />}
        {has("safety") && <SafetyPanel safety={snapshot.safety} config={safetyConfig} />}
      </div>

      {has("trace") && <CommandTrace timing={snapshot.loopTiming} packets={snapshot.packets} now={snapshot.now} connected={snapshot.network.connected} />}
      {lab.id === "local-control" && snapshot.mode === "direct" && <p className="direct-mode-note">Direct mode needs repeated commands from Mission Control. Switch to Local task, then click a target in the site.</p>}
    </section>
  );
}
