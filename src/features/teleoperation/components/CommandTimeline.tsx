import type { CommandRecord } from "../types";

const time = (value?: number) => value === undefined ? "—" : new Date(value).toLocaleTimeString([], { hour12: false, minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3 });

export function CommandTimeline({ commands }: { commands: CommandRecord[] }) {
  return (
    <section className="panel timeline-panel" aria-labelledby="timeline-title">
      <div className="panel-heading"><div><span className="eyebrow">ORDER + AGE</span><h2 id="timeline-title">Command timeline</h2></div><span className="count-chip">latest {Math.min(commands.length, 6)}</span></div>
      <div className="command-table" role="table">
        <div className="command-row command-head" role="row"><span># / COMMAND</span><span>CREATED</span><span>RECEIVED</span><span>AGE</span><span>RESULT</span></div>
        {commands.slice(0, 6).map((command) => (
          <div className="command-row" role="row" key={command.id}>
            <strong>#{command.sequence} {command.type.replace("-", " ")}</strong>
            <span>{time(command.createdAt)}</span><span>{time(command.receivedAt)}</span><span>{command.ageMs === undefined ? "—" : `${Math.round(command.ageMs)} ms`}</span>
            <em className={`result-${command.result}`}>{command.result.replace("-", " ")}</em>
          </div>
        ))}
        {!commands.length && <p className="empty-state">No commands yet. Try the controls above.</p>}
      </div>
    </section>
  );
}
