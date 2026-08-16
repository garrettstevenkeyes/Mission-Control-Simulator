import { Activity, Gauge, Radio, RotateCw, Timer, Wifi } from "lucide-react";
import { MetricCard } from "../../../shared/components/MetricCard";
import type { SimulationSnapshot } from "../types";

export function TelemetryBar({ snapshot }: { snapshot: SimulationSnapshot }) {
  const telemetryAge = Math.max(0, snapshot.now - snapshot.operatorView.measuredAt);
  const dropRate = snapshot.stats.sent ? (snapshot.stats.dropped / snapshot.stats.sent) * 100 : 0;
  return (
    <section className="telemetry-grid" aria-label="Live telemetry and network metrics">
      <MetricCard label="Round trip" value={`${snapshot.network.rttMs} ms`} hint="command + return path" icon={<Timer />} />
      <MetricCard label="Command trip" value={`~${Math.round(snapshot.network.rttMs / 2)} ms`} hint="outbound estimate" icon={<Radio />} />
      <MetricCard label="Telemetry age" value={`${Math.round(telemetryAge)} ms`} hint="when this state was measured" icon={<Activity />} />
      <MetricCard label="Speed" value={`${Math.abs(snapshot.operatorView.speed).toFixed(1)} km/h`} hint="last reported" icon={<Gauge />} />
      <MetricCard label="Heading" value={`${Math.round((snapshot.operatorView.heading + 360) % 360)}°`} hint={`bucket ${Math.round(snapshot.operatorView.bucket)}%`} icon={<RotateCw />} />
      <MetricCard label="Packet health" value={`${snapshot.stats.dropped} dropped`} hint={`${dropRate.toFixed(1)}% observed`} icon={<Wifi />} />
    </section>
  );
}
