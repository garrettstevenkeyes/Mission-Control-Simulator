export class SeededRandom {
  private state: number;

  constructor(seed = 2026) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 4294967296;
  }

  between(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}
