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

export const POLL_INTERVAL_MS = 5000; // re-read the sheet every 5 s

export type ConnectionStatus = "connected" | "offline";

export type ReadingsState = {
  live: LiveReading | null;
  history: HistoricalReading[];
  status: ConnectionStatus;
  lastSyncMs: number | null;
  loading: boolean;
  error: string | null;
};

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
        if (!res.ok) throw new Error(`Data source responded ${res.status}`);
        const { readings } = (await res.json()) as { readings: HistoricalReading[] };
        if (cancelled) return;

        const live = readings.length ? readings[readings.length - 1] : null;
        setState({
          live,
          history: readings,
          status: live?.system.wifiConnected ? "connected" : "offline",
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
