import { Activity, Gauge, Radio, RotateCw, Timer, Wifi } from "lucide-react";
import { MetricCard } from "../../../shared/components/MetricCard";
import { useReadableAge } from "../../../shared/hooks/useReadableAge";
import {
  formatBucketPosition,
  formatHeading,
  formatReportedSpeed,
} from "../presentation/telemetryFormatters";
import type { SimulationSnapshot } from "../types";

export function TelemetryBar({ snapshot }: { snapshot: SimulationSnapshot }) {
  const telemetryAge = useReadableAge(snapshot.now, snapshot.telemetry.measuredAt);
  const dropRate = snapshot.stats.sent ? (snapshot.stats.dropped / snapshot.stats.sent) * 100 : 0;
  return (
    <section className="telemetry-grid" aria-label="Live telemetry and network metrics">
      <MetricCard label="Round trip" value={`${snapshot.network.rttMs} ms`} hint="command + return path" icon={<Timer />} />
      <MetricCard label="Command trip" value={`~${Math.round(snapshot.network.rttMs / 2)} ms`} hint="outbound estimate" icon={<Radio />} />
      <MetricCard
        label="Telemetry age"
        value={`${telemetryAge.ageMs} ms`}
        status={telemetryAge.status}
        hint={`worst in 5 sec: ${telemetryAge.peakMs} ms`}
        icon={<Activity />}
      />
      <MetricCard label="Speed" value={formatReportedSpeed(snapshot.telemetry.speed)} hint="last reported" icon={<Gauge />} />
      <MetricCard label="Heading" value={formatHeading(snapshot.telemetry.heading)} hint={`bucket ${formatBucketPosition(snapshot.telemetry.bucket)}`} icon={<RotateCw />} />
      <MetricCard label="Packet health" value={`${snapshot.stats.dropped} dropped`} hint={`${dropRate.toFixed(1)}% observed`} icon={<Wifi />} />
    </section>
  );
}
