import { EventStore } from "../events/eventStore";
import { MachineModel } from "../machine/machineModel";
import { NetworkEngine } from "../network/networkEngine";
import { commandShouldBeRejected, DEFAULT_SAFETY_CONFIG, evaluateSafety } from "../safety/safetyController";
import type {
  Command,
  CommandRecord,
  CommandType,
  ControlMode,
  Heartbeat,
  LoopTiming,
  NetworkCondition,
  NetworkPacket,
  PacketStats,
  SafetyConfig,
  SimulationSnapshot,
  Telemetry,
} from "../types";

const DEFAULT_NETWORK: NetworkCondition = {
  rttMs: 50,
  jitterMs: 5,
  packetLossPercent: 0,
  bandwidthMbps: 12,
  connected: true,
};

export class TeleoperationSimulation {
  private now: number;
  private lastTickAt: number;
  private network: NetworkCondition = { ...DEFAULT_NETWORK };
  private safetyConfig: SafetyConfig = { ...DEFAULT_SAFETY_CONFIG };
  private mode: ControlMode = "direct";
  private requestedCommand: CommandType = "stop";
  private machine = new MachineModel();
  private networkEngine: NetworkEngine;
  private events = new EventStore();
  private commands: CommandRecord[] = [];
  private commandSequence = 0;
  private telemetrySequence = 0;
  private heartbeatSequence = 0;
  private packetSequence = 0;
  private lastHeartbeatSentAt: number;
  private lastHeartbeatAt: number;
  private lastTelemetrySentAt: number;
  private lastFeedbackSentAt: number;
  private lastTelemetryAt: number;
  private operatorView: Telemetry;
  private latestTelemetry: Telemetry;
  private loopTiming: LoopTiming | null = null;
  private stats: PacketStats = { sent: 0, delivered: 0, dropped: 0, staleCommands: 0 };
  private emergencyStop = false;
  private lastSafetyState = "normal";

  constructor(startAt = Date.now(), networkEngine = new NetworkEngine()) {
    this.now = startAt;
    this.lastTickAt = startAt;
    this.lastHeartbeatSentAt = startAt - 250;
    this.lastHeartbeatAt = startAt;
    this.lastTelemetrySentAt = startAt - 250;
    this.lastFeedbackSentAt = startAt - 100;
    this.lastTelemetryAt = startAt;
    this.networkEngine = networkEngine;
    const initialTelemetry = this.makeTelemetry();
    this.operatorView = { ...initialTelemetry };
    this.latestTelemetry = { ...initialTelemetry };
  }

  tick(now: number): SimulationSnapshot {
    this.now = now;
    const delta = Math.max(0, now - this.lastTickAt);
    this.lastTickAt = now;

    this.sendScheduledPackets();
    const traffic = this.networkEngine.tick(now);
    for (const packet of traffic.delivered) this.deliver(packet);
    for (const packet of traffic.dropped) this.recordDrop(packet);

    const safety = this.currentSafety();
    if (safety.state !== this.lastSafetyState) {
      this.events.add(now, "safety", safety.reason);
      this.lastSafetyState = safety.state;
    }
    this.machine.update(delta, this.mode, safety.speedLimit, safety.speedLimit === 0);
    return this.snapshot();
  }

  issueCommand(type: CommandType): CommandRecord {
    this.requestedCommand = type;
    const command: Command = {
      id: `command-${++this.commandSequence}`,
      sequence: this.commandSequence,
      createdAt: this.now,
      type,
    };
    const record: CommandRecord = { ...command, result: "in-flight" };
    this.commands.unshift(record);
    this.commands = this.commands.slice(0, 30);
    this.events.add(this.now, "command", `Command #${command.sequence} ${type.replace("-", " ")} sent`);
    const packet = this.sendPacket("command", "outbound", command);
    if (packet.dropped) record.result = packet.dropReason === "disconnect" ? "disconnected" : "lost";
    return record;
  }

  setNetwork(change: Partial<NetworkCondition>): void {
    const wasConnected = this.network.connected;
    this.network = { ...this.network, ...change };
    if (wasConnected && !this.network.connected) this.events.add(this.now, "safety", "Network disconnected");
    if (!wasConnected && this.network.connected) {
      this.events.add(this.now, "safety", "Network reconnected");
      this.lastHeartbeatSentAt = this.now - 250;
    }
  }

  setMode(mode: ControlMode): void {
    this.mode = mode;
    this.issueCommand("stop");
    this.events.add(this.now, "safety", `${mode === "supervised" ? "Supervised task" : mode} mode selected`);
  }

  setTarget(x: number, y: number): void {
    if (this.mode !== "supervised") return;
    this.machine.setTarget(x, y);
    this.events.add(this.now, "command", "Local move-to-target task started");
  }

  setRejectStaleCommands(enabled: boolean): void {
    this.safetyConfig.rejectStaleCommands = enabled;
  }

  setEmergencyStop(active: boolean): void {
    this.emergencyStop = active;
    this.events.add(this.now, "safety", active ? "Emergency stop pressed" : "Emergency stop released");
  }

  getSnapshot(): SimulationSnapshot {
    return this.snapshot();
  }

  getSafetyConfig(): SafetyConfig {
    return { ...this.safetyConfig };
  }

  private sendScheduledPackets(): void {
    if (!this.network.connected) return;
    if (this.now - this.lastHeartbeatSentAt >= 250) {
      this.lastHeartbeatSentAt = this.now;
      const heartbeat: Heartbeat = { sequence: ++this.heartbeatSequence };
      this.sendPacket("heartbeat", "outbound", heartbeat);
    }
    if (this.now - this.lastTelemetrySentAt >= 250) {
      this.lastTelemetrySentAt = this.now;
      const telemetry = this.makeTelemetry();
      this.sendPacket("telemetry", "return", telemetry);
      this.events.add(this.now, "telemetry", `Telemetry #${telemetry.sequence} sent`);
    }
    const feedbackInterval = this.feedbackInterval();
    if (this.now - this.lastFeedbackSentAt >= feedbackInterval) {
      this.lastFeedbackSentAt = this.now;
      this.sendPacket("feedback", "return", this.makeTelemetry());
    }
  }

  private sendPacket<T>(kind: NetworkPacket["kind"], direction: NetworkPacket["direction"], payload: T): NetworkPacket<T> {
    const packet = this.networkEngine.send(
      { id: `packet-${++this.packetSequence}`, kind, direction, payload, createdAt: this.now },
      this.network,
    );
    this.stats.sent += 1;
    return packet;
  }

  private deliver(packet: NetworkPacket): void {
    this.stats.delivered += 1;
    if (packet.kind === "heartbeat") {
      this.lastHeartbeatAt = this.now;
      if ((packet.payload as Heartbeat).sequence % 4 === 0) {
        this.events.add(this.now, "heartbeat", `Heartbeat received (${Math.round(this.now - packet.createdAt)} ms)`);
      }
      return;
    }
    if (packet.kind === "command") {
      const command = packet.payload as Command;
      const age = this.now - command.createdAt;
      const reason = commandShouldBeRejected(age, command.sequence, this.machine.snapshot().lastAppliedSequence, this.safetyConfig);
      const record = this.commands.find((item) => item.id === command.id);
      if (record) {
        record.receivedAt = this.now;
        record.ageMs = age;
        record.result = reason ?? "applied";
      }
      if (reason) {
        if (reason === "too-old") this.stats.staleCommands += 1;
        this.events.add(this.now, "safety", `Command #${command.sequence} ignored: ${reason === "too-old" ? "too old" : "newer command already applied"}`);
        return;
      }
      this.machine.applyCommand(command);
      this.loopTiming = { commandSequence: command.sequence, sentAt: command.createdAt, receivedAt: this.now, reactedAt: this.now + 30 };
      this.events.add(this.now, "command", `Command #${command.sequence} received`);
      return;
    }
    const telemetry = packet.payload as Telemetry;
    if (packet.kind === "telemetry") {
      this.lastTelemetryAt = this.now;
      this.latestTelemetry = telemetry;
      return;
    }
    this.operatorView = telemetry;
    const record = this.commands.find((item) => item.sequence === telemetry.appliedCommandSequence);
    if (record && !record.feedbackAt) record.feedbackAt = this.now;
    if (this.loopTiming && telemetry.appliedCommandSequence === this.loopTiming.commandSequence && !this.loopTiming.feedbackAt) {
      this.loopTiming.feedbackAt = this.now;
    }
  }

  private recordDrop(packet: NetworkPacket): void {
    this.stats.dropped += 1;
    const label = `${packet.kind[0].toUpperCase()}${packet.kind.slice(1)} packet dropped`;
    this.events.add(this.now, "dropped", label);
  }

  private makeTelemetry(): Telemetry {
    const machine = this.machine.snapshot();
    return {
      sequence: ++this.telemetrySequence,
      measuredAt: this.now,
      x: machine.x,
      y: machine.y,
      heading: machine.heading,
      speed: machine.speed,
      bucket: machine.bucket,
      engineOn: machine.engineOn,
      appliedCommandSequence: machine.lastAppliedSequence,
    };
  }

  private currentSafety() {
    return evaluateSafety(this.now, this.lastHeartbeatAt, this.network, this.safetyConfig, this.emergencyStop);
  }

  private feedbackInterval(): number {
    if (this.network.bandwidthMbps >= 10) return 100;
    if (this.network.bandwidthMbps >= 3) return 200;
    if (this.network.bandwidthMbps >= 1) return 400;
    return 800;
  }

  private feedbackQuality(): string {
    if (this.network.bandwidthMbps >= 10) return "clear";
    if (this.network.bandwidthMbps >= 3) return "good";
    if (this.network.bandwidthMbps >= 1) return "soft";
    return "blocky";
  }

  private snapshot(): SimulationSnapshot {
    const interval = this.feedbackInterval();
    return {
      now: this.now,
      network: { ...this.network },
      mode: this.mode,
      requestedCommand: this.requestedCommand,
      machine: this.machine.snapshot(),
      operatorView: { ...this.operatorView },
      telemetry: { ...this.latestTelemetry },
      safety: this.currentSafety(),
      packets: this.networkEngine.visiblePackets(),
      commands: this.commands.map((command) => ({ ...command })),
      events: this.events.snapshot(),
      loopTiming: this.loopTiming ? { ...this.loopTiming } : null,
      stats: { ...this.stats },
      lastTelemetryAt: this.lastTelemetryAt,
      feedbackRateFps: 1000 / interval,
      feedbackQuality: this.feedbackQuality(),
    };
  }
}
