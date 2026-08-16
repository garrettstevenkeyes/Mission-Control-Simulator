import type { Command, CommandType, ControlMode, MachineState } from "../types";

const INITIAL_STATE: MachineState = {
  x: 44,
  y: 58,
  heading: -25,
  speed: 0,
  bucket: 48,
  engineOn: true,
  activeCommand: "stop",
  target: null,
  lastAppliedSequence: 0,
};

export class MachineModel {
  private state: MachineState = { ...INITIAL_STATE };

  applyCommand(command: Command): void {
    this.state.activeCommand = command.type;
    this.state.lastAppliedSequence = command.sequence;
    if (command.type === "stop") this.state.speed = 0;
  }

  setTarget(x: number, y: number): void {
    this.state.target = { x: Math.max(8, Math.min(92, x)), y: Math.max(12, Math.min(88, y)) };
  }

  update(deltaMs: number, mode: ControlMode, speedLimit: number, forcedStop: boolean): void {
    const dt = Math.min(deltaMs, 100) / 1000;
    if (forcedStop) {
      this.state.speed = Math.max(0, this.state.speed - dt * 18);
      this.state.activeCommand = "stop";
      return;
    }

    if (mode === "supervised" && this.state.target) {
      this.followTarget(dt, speedLimit);
      return;
    }

    const command = this.state.activeCommand;
    const targetSpeed = command === "forward" ? 10 * speedLimit : command === "backward" ? -7 * speedLimit : 0;
    const response = mode === "assisted" ? 13 : 30;
    this.state.speed += Math.max(-response * dt, Math.min(response * dt, targetSpeed - this.state.speed));

    if (command === "rotate-left") this.state.heading -= 62 * dt * speedLimit;
    if (command === "rotate-right") this.state.heading += 62 * dt * speedLimit;
    if (command === "bucket-up") this.state.bucket = Math.min(100, this.state.bucket + 35 * dt);
    if (command === "bucket-down") this.state.bucket = Math.max(0, this.state.bucket - 35 * dt);
    this.move(dt);
  }

  snapshot(): MachineState {
    return { ...this.state, target: this.state.target ? { ...this.state.target } : null };
  }

  reset(): void {
    this.state = { ...INITIAL_STATE };
  }

  private followTarget(dt: number, speedLimit: number): void {
    const target = this.state.target!;
    const dx = target.x - this.state.x;
    const dy = target.y - this.state.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1.5) {
      this.state.speed = 0;
      this.state.target = null;
      this.state.activeCommand = "stop";
      return;
    }
    const desired = (Math.atan2(dy, dx) * 180) / Math.PI;
    const turn = ((((desired - this.state.heading) % 360) + 540) % 360) - 180;
    this.state.heading += Math.max(-55 * dt, Math.min(55 * dt, turn));
    this.state.speed = Math.min(7 * speedLimit, distance * 0.9);
    this.move(dt);
  }

  private move(dt: number): void {
    const radians = (this.state.heading * Math.PI) / 180;
    this.state.x = Math.max(5, Math.min(95, this.state.x + Math.cos(radians) * this.state.speed * dt));
    this.state.y = Math.max(7, Math.min(93, this.state.y + Math.sin(radians) * this.state.speed * dt));
  }
}

export const commandLabel = (command: CommandType): string => command.replace("-", " ");
