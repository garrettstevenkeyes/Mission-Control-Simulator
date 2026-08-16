import type { NetworkCondition, NetworkPacket, PacketDirection, PacketKind } from "../types";
import { SeededRandom } from "../simulation/seededRandom";

export interface RandomSource {
  next(): number;
  between(min: number, max: number): number;
}

export interface SendPacketInput<T> {
  id: string;
  kind: PacketKind;
  direction: PacketDirection;
  payload: T;
  createdAt: number;
}

export class NetworkEngine {
  private packets: NetworkPacket[] = [];
  private handled = new Set<string>();

  constructor(private readonly random: RandomSource = new SeededRandom()) {}

  send<T>(input: SendPacketInput<T>, condition: NetworkCondition): NetworkPacket<T> {
    const jitter = this.random.between(-condition.jitterMs, condition.jitterMs);
    const bandwidthDelay = input.kind === "feedback" ? this.feedbackDelay(condition.bandwidthMbps) : 0;
    const delay = Math.max(5, condition.rttMs / 2 + jitter + bandwidthDelay);
    const disconnected = !condition.connected;
    const lost = !disconnected && this.random.next() * 100 < condition.packetLossPercent;

    const packet: NetworkPacket<T> = {
      ...input,
      scheduledDeliveryAt: input.createdAt + delay,
      dropped: disconnected || lost,
      dropReason: disconnected ? "disconnect" : lost ? "loss" : undefined,
    };

    this.packets.push(packet);
    return packet;
  }

  tick(now: number): { delivered: NetworkPacket[]; dropped: NetworkPacket[] } {
    const delivered: NetworkPacket[] = [];
    const dropped: NetworkPacket[] = [];

    for (const packet of this.packets) {
      if (this.handled.has(packet.id) || packet.scheduledDeliveryAt > now) continue;
      this.handled.add(packet.id);
      if (packet.dropped) dropped.push(packet);
      else delivered.push(packet);
    }

    this.packets = this.packets.filter((packet) => {
      const keep = !this.handled.has(packet.id) || now - packet.scheduledDeliveryAt < 1600;
      if (!keep) this.handled.delete(packet.id);
      return keep;
    });

    return { delivered, dropped };
  }

  visiblePackets(): NetworkPacket[] {
    return [...this.packets];
  }

  clear(): void {
    this.packets = [];
    this.handled.clear();
  }

  private feedbackDelay(bandwidthMbps: number): number {
    if (bandwidthMbps >= 10) return 0;
    if (bandwidthMbps >= 3) return 35;
    if (bandwidthMbps >= 1) return 110;
    return 260;
  }
}
