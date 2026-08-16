export type CommandType =
  | "forward"
  | "backward"
  | "rotate-left"
  | "rotate-right"
  | "bucket-up"
  | "bucket-down"
  | "stop";

export type ControlMode = "direct" | "assisted" | "supervised";
export type PacketKind = "command" | "telemetry" | "feedback" | "heartbeat";
export type PacketDirection = "outbound" | "return";
export type SafetyState = "normal" | "degraded" | "safe-stop" | "emergency-stop";
export type ConnectionQuality = "excellent" | "good" | "limited" | "poor";

export interface NetworkCondition {
  rttMs: number;
  jitterMs: number;
  packetLossPercent: number;
  bandwidthMbps: number;
  connected: boolean;
}

export interface Command {
  id: string;
  sequence: number;
  createdAt: number;
  type: CommandType;
}

export interface Telemetry {
  sequence: number;
  measuredAt: number;
  x: number;
  y: number;
  heading: number;
  speed: number;
  bucket: number;
  engineOn: boolean;
  appliedCommandSequence: number;
}

export interface Heartbeat {
  sequence: number;
}

export interface NetworkPacket<T = unknown> {
  id: string;
  kind: PacketKind;
  direction: PacketDirection;
  payload: T;
  createdAt: number;
  scheduledDeliveryAt: number;
  dropped: boolean;
  dropReason?: "loss" | "disconnect";
}

export type CommandResult = "in-flight" | "applied" | "too-old" | "out-of-order" | "lost" | "disconnected";

export interface CommandRecord extends Command {
  receivedAt?: number;
  ageMs?: number;
  feedbackAt?: number;
  result: CommandResult;
}

export type EventCategory = "command" | "telemetry" | "heartbeat" | "safety" | "dropped";

export interface SimulationEvent {
  id: string;
  at: number;
  category: EventCategory;
  message: string;
}

export interface MachineState {
  x: number;
  y: number;
  heading: number;
  speed: number;
  bucket: number;
  engineOn: boolean;
  activeCommand: CommandType;
  target: { x: number; y: number } | null;
  lastAppliedSequence: number;
}

export interface LoopTiming {
  commandSequence: number;
  sentAt: number;
  receivedAt: number;
  reactedAt: number;
  feedbackAt?: number;
}

export interface SafetyConfig {
  heartbeatTimeoutMs: number;
  maxCommandAgeMs: number;
  highLatencyRttMs: number;
  highLossPercent: number;
  rejectStaleCommands: boolean;
}

export interface SafetyStatus {
  state: SafetyState;
  reason: string;
  speedLimit: number;
  heartbeatAgeMs: number;
}

export interface PacketStats {
  sent: number;
  delivered: number;
  dropped: number;
  staleCommands: number;
}

export interface SimulationSnapshot {
  now: number;
  network: NetworkCondition;
  mode: ControlMode;
  requestedCommand: CommandType;
  machine: MachineState;
  operatorView: Telemetry;
  safety: SafetyStatus;
  packets: NetworkPacket[];
  commands: CommandRecord[];
  events: SimulationEvent[];
  loopTiming: LoopTiming | null;
  stats: PacketStats;
  lastTelemetryAt: number;
  feedbackRateFps: number;
  feedbackQuality: string;
}
