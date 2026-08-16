import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  hint,
  icon,
  status,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  status?: { label: string; tone: "good" | "warn" | "bad" };
}) {
  return (
    <div className="metric-card">
      <div className="metric-label">{icon}{label}</div>
      <div className="metric-value-row">
        <div className="metric-value">{value}</div>
        {status && <span className={`metric-status metric-status-${status.tone}`}>{status.label}</span>}
      </div>
      {hint && <div className="metric-hint">{hint}</div>}
    </div>
  );
}
