"use client";

/**
 * Single source of truth for reading data.
 *
 * Every component pulls live + historical readings through `useReadings()`.
 * It polls `/api/readings`, which reads the logger's Google Sheet server-side
 * (see `lib/sheet.ts`). To point at a different backend, change that route —
 * no component needs to touch this hook or its `ReadingsState` shape.
 */
import { useEffect, useState } from "react";
import type { HistoricalReading, LiveReading } from "@/types/readings";

// The firmware logs every 60 s (LOG_INTERVAL in the sketch), so poll well inside
// that to catch each new row promptly. The server caches for 20 s, so this costs
// no extra Google reads — it only decides how fast a cached row reaches the UI.
export const POLL_INTERVAL_MS = 20_000;

/** The firmware's logging cadence — used to judge whether data is still live. */
export const LOG_INTERVAL_MS = 60_000;

/**
 * How stale the newest row may be before the logger is considered offline.
 * Three missed writes, plus slack for the sheet's own propagation delay.
 */
export const STALE_AFTER_MS = 5 * LOG_INTERVAL_MS;

export type ConnectionStatus = "connected" | "offline";

export type ReadingsState = {
  live: LiveReading | null;
  history: HistoricalReading[];
  status: ConnectionStatus;
  lastSyncMs: number | null;
  loading: boolean;
  error: string | null;
};

/** True when the reading is recent enough that the logger is still reporting. */
export function isFresh(
  reading: Pick<LiveReading, "timestamp"> | null,
  now: number = Date.now()
): boolean {
  return reading != null && now - reading.timestamp <= STALE_AFTER_MS;
}

export function useReadings(): ReadingsState {
  const [state, setState] = useState<ReadingsState>({
    live: null,
    history: [],
    status: "offline",
    lastSyncMs: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/readings", { cache: "no-store" });
        const body = (await res.json().catch(() => null)) as
          | { readings?: HistoricalReading[]; error?: string }
          | null;
        if (!res.ok) {
          throw new Error(body?.error || `Data source responded ${res.status}`);
        }
        const readings = body?.readings ?? [];
        if (cancelled) return;

        const live = readings.length ? readings[readings.length - 1] : null;
        setState({
          live,
          history: readings,
          // The firmware never publishes a link state, and rows only reach the
          // sheet over WiFi — so freshness of the newest row is the honest
          // signal. A logger that stopped writing yesterday reads as offline
          // instead of forever claiming "Connected".
          status: isFresh(live) ? "connected" : "offline",
          lastSyncMs: live?.system.lastSyncMs ?? null,
          loading: false,
          error: null,
        });
      } catch (e) {
        if (cancelled) return;
        // Keep the last good data on screen; just flag the connection.
        setState((s) => ({
          ...s,
          status: "offline",
          loading: false,
          error: e instanceof Error ? e.message : "Failed to load readings",
        }));
      }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return state;
}

/** Mean of `selector` over readings within the last `windowMs`. */
export function trailingAverage(
  history: HistoricalReading[],
  selector: (r: HistoricalReading) => number,
  windowMs: number,
  now: number = Date.now()
): number | null {
  const cutoff = now - windowMs;
  const inWindow = history.filter((r) => r.timestamp >= cutoff);
  if (inWindow.length === 0) return null;
  const sum = inWindow.reduce((acc, r) => acc + selector(r), 0);
  return sum / inWindow.length;
}

/** Delta of the current value vs its 5-minute trailing average. */
export function trendVsAverage(
  history: HistoricalReading[],
  current: number,
  selector: (r: HistoricalReading) => number,
  now: number = Date.now()
): number | null {
  const avg = trailingAverage(history, selector, 5 * 60 * 1000, now);
  if (avg === null) return null;
  return current - avg;
}
