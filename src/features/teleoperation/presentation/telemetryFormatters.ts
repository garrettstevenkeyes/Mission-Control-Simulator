const FULL_ROTATION_DEGREES = 360;

export function formatReportedSpeed(speed: number): string {
  return `${Math.abs(speed).toFixed(1)} km/h`;
}

export function normalizeHeading(degrees: number): number {
  return ((degrees % FULL_ROTATION_DEGREES) + FULL_ROTATION_DEGREES) % FULL_ROTATION_DEGREES;
}

export function formatHeading(degrees: number): string {
  return `${Math.round(normalizeHeading(degrees))}°`;
}

export function formatBucketPosition(position: number): string {
  const boundedPosition = Math.min(100, Math.max(0, position));
  return `${Math.round(boundedPosition)}%`;
}
