import type { EventCategory, SimulationEvent } from "../types";

export class EventStore {
  private events: SimulationEvent[] = [];
  private nextId = 1;

  add(at: number, category: EventCategory, message: string): void {
    this.events.unshift({ id: `event-${this.nextId++}`, at, category, message });
    this.events = this.events.slice(0, 140);
  }

  snapshot(): SimulationEvent[] {
    return [...this.events];
  }
}
