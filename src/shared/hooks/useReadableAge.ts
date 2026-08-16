import { useEffect, useRef, useState } from "react";

const SAMPLE_INTERVAL_MS = 250;
const PEAK_WINDOW_MS = 5000;
const ROUND_TO_MS = 25;

export type AgeStatus = { label: "Fresh" | "Delayed" | "Stale"; tone: "good" | "warn" | "bad" };

export function getAgeStatus(ageMs: number): AgeStatus {
  if (ageMs <= 150) return { label: "Fresh", tone: "good" };
  if (ageMs <= 400) return { label: "Delayed", tone: "warn" };
  return { label: "Stale", tone: "bad" };
}

export function roundAge(ageMs: number): number {
  return Math.max(0, Math.round(ageMs / ROUND_TO_MS) * ROUND_TO_MS);
}

export function useReadableAge(now: number, measuredAt: number) {
  const initialAge = roundAge(now - measuredAt);
  const [display, setDisplay] = useState({ ageMs: initialAge, peakMs: initialAge });
  const lastSampleAt = useRef(now - SAMPLE_INTERVAL_MS);
  const samples = useRef<Array<{ at: number; ageMs: number }>>([]);

  useEffect(() => {
    if (now - lastSampleAt.current < SAMPLE_INTERVAL_MS) return;
    lastSampleAt.current = now;

    const ageMs = Math.max(0, now - measuredAt);
    samples.current = [...samples.current.filter((sample) => now - sample.at <= PEAK_WINDOW_MS), { at: now, ageMs }];
    setDisplay({
      ageMs: roundAge(ageMs),
      peakMs: roundAge(Math.max(...samples.current.map((sample) => sample.ageMs))),
    });
  }, [measuredAt, now]);

  return { ...display, status: getAgeStatus(display.ageMs) };
}
