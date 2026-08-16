import type { NetworkPacket } from "../types";
import {
  getDroppedPacketProgress,
  getPacketReplayProgress,
  shouldShowDrop,
} from "../presentation/packetAnimation";

const labels = { command: "CMD", telemetry: "TEL", feedback: "VIEW", heartbeat: "BEAT" };

function Packet({ packet, now }: { packet: NetworkPacket; now: number }) {
  const actualDelay = Math.max(1, packet.scheduledDeliveryAt - packet.createdAt);
  const replayProgress = getPacketReplayProgress(actualDelay, now - packet.createdAt);
  const dropped = packet.dropped && shouldShowDrop(replayProgress);
  const travelProgress = packet.dropped ? getDroppedPacketProgress(replayProgress) : replayProgress;
  const position = packet.direction === "outbound" ? travelProgress : 1 - travelProgress;
  return (
    <div
      className={`packet packet-${packet.kind} ${dropped ? "packet-dropped" : ""} ${replayProgress >= 1 ? "packet-complete" : ""}`}
      style={{ left: `${8 + position * 84}%` }}
      title={`${packet.kind} · actual delay ${Math.round(actualDelay)} ms`}
      aria-hidden="true"
    >
      <span>{dropped ? "×" : labels[packet.kind]}</span>
    </div>
  );
}

export function PacketFlow({ packets, now, connected }: { packets: NetworkPacket[]; now: number; connected: boolean }) {
  return (
    <div className="packet-stream" aria-label="Live packet stream">
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
    </div>
  );
}
