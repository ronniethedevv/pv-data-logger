/**
 * Chart time-range windows.
 *
 * The logger samples every ~10 minutes, so these are the useful spans for
 * seeing individual data points without the line collapsing into a blur.
 * Windows are measured back from the latest reading (not wall-clock now), so
 * they behave correctly even when the sheet holds historical data.
 */
export type Range = { label: string; ms: number };

const HOUR = 60 * 60 * 1000;

export const RANGES: Range[] = [
  { label: "1h", ms: 1 * HOUR },
  { label: "2h", ms: 2 * HOUR },
  { label: "6h", ms: 6 * HOUR },
  { label: "12h", ms: 12 * HOUR },
  { label: "24h", ms: 24 * HOUR },
  { label: "48h", ms: 48 * HOUR },
];

export const DEFAULT_RANGE_MS = RANGES[2].ms; // 6h

export function rangeLabel(ms: number): string {
  return RANGES.find((r) => r.ms === ms)?.label ?? `${Math.round(ms / HOUR)}h`;
}

/** Keep readings within `rangeMs` of the most recent reading. */
export function windowByRange<T extends { timestamp: number }>(readings: T[], rangeMs: number): T[] {
  if (readings.length === 0) return readings;
  const end = readings[readings.length - 1].timestamp;
  const start = end - rangeMs;
  return readings.filter((r) => r.timestamp >= start);
}
