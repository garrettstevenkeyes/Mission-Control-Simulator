import type { NetworkPacket } from "../types";

const labels = { command: "CMD", telemetry: "TEL", feedback: "VIEW", heartbeat: "BEAT" };

function Packet({ packet, now }: { packet: NetworkPacket; now: number }) {
  const duration = Math.max(1, packet.scheduledDeliveryAt - packet.createdAt);
  const progress = Math.max(0, Math.min(1, (now - packet.createdAt) / duration));
  const position = packet.direction === "outbound" ? progress : 1 - progress;
  const finished = now >= packet.scheduledDeliveryAt;
  return (
    <div className={`packet packet-${packet.kind} ${packet.dropped && finished ? "packet-dropped" : ""}`} style={{ left: `${8 + position * 84}%` }} title={`${packet.kind} · ${Math.round(duration)} ms`}>
      <span>{packet.dropped && finished ? "×" : labels[packet.kind]}</span>
    </div>
  );
}

export function PacketFlow({ packets, now, connected }: { packets: NetworkPacket[]; now: number; connected: boolean }) {
  return (
    <section className="panel packet-panel" aria-labelledby="packet-title">
      <div className="packet-header"><div><span className="eyebrow">LIVE PACKET FLOW</span><h2 id="packet-title">Watch the round trip</h2></div><p>Commands go out. Telemetry and the visual feed come back.</p></div>
      <div className={`packet-track ${connected ? "" : "track-offline"}`}>
        <div className="network-line" />
        <div className="flow-node operator-node"><span>OP</span><strong>Mission control</strong></div>
        <div className="flow-node cloud-node"><span>NET</span><strong>Network</strong></div>
        <div className="flow-node edge-node"><span>EDGE</span><strong>Edge + machine</strong></div>
        {packets.map((packet) => <Packet key={packet.id} packet={packet} now={now} />)}
        {!connected && <div className="offline-marker">LINK OFFLINE</div>}
      </div>
      <div className="packet-legend">
        {Object.entries(labels).map(([kind, label]) => <span key={kind}><i className={`legend-${kind}`} />{label} {kind}</span>)}
        <span><i className="legend-dropped" />× dropped</span>
      </div>
    </section>
  );
}
