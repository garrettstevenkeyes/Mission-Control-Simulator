import { useState } from "react";
import type { EventCategory, SimulationEvent } from "../types";

const filters: Array<"all" | EventCategory> = ["all", "command", "telemetry", "heartbeat", "safety", "dropped"];

export function EventLog({ events }: { events: SimulationEvent[] }) {
  const [filter, setFilter] = useState<"all" | EventCategory>("all");
  const visible = filter === "all" ? events : events.filter((event) => event.category === filter);
  return (
    <section className="panel event-panel" aria-labelledby="event-title">
      <div className="panel-heading"><div><span className="eyebrow">SIMULATION HISTORY</span><h2 id="event-title">Event log</h2></div><span className="count-chip">{events.length} events</span></div>
      <div className="log-filters">{filters.map((item) => <button className={filter === item ? "active" : ""} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div>
      <div className="event-list">
        {visible.slice(0, 18).map((event) => <div key={event.id}><time>{new Date(event.at).toLocaleTimeString([], { hour12: false, minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3 })}</time><i className={`event-${event.category}`} /><span>{event.message}</span></div>)}
        {!visible.length && <p className="empty-state">No matching events yet.</p>}
      </div>
    </section>
  );
}
