const MINIMUM_REPLAY_MS = 600;
const MAXIMUM_REPLAY_MS = 2400;
const DELAY_SCALE = 1.5;
const DROP_POINT = 0.55;

export function getPacketReplayDuration(actualDelayMs: number): number {
  return Math.min(MAXIMUM_REPLAY_MS, Math.max(MINIMUM_REPLAY_MS, MINIMUM_REPLAY_MS + actualDelayMs * DELAY_SCALE));
}

export function getPacketReplayProgress(actualDelayMs: number, elapsedMs: number): number {
  return Math.max(0, Math.min(1, elapsedMs / getPacketReplayDuration(actualDelayMs)));
}

export function getDroppedPacketProgress(replayProgress: number): number {
  return Math.min(replayProgress, DROP_POINT);
}

export function shouldShowDrop(replayProgress: number): boolean {
  return replayProgress >= DROP_POINT;
}
