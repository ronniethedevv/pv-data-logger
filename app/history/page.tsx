"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ChartCard } from "@/components/ChartCard";
import { RangeSelector } from "@/components/RangeSelector";
import { TimeSeriesChart, type ChartPoint } from "@/components/TimeSeriesChart";
import { SkeletonChart } from "@/components/SkeletonCard";
import { ErrorAlert } from "@/components/ui/alert";
import { useReadings } from "@/lib/readings";
import { downloadCsv } from "@/lib/csv";
import { DEFAULT_RANGE_MS, rangeLabel, windowByRange } from "@/lib/ranges";

const BLUE_600 = "#2563EB";
const BLUE_400 = "#60A5FA";

export default function HistoryPage() {
  const { history, status, lastSyncMs, loading, error } = useReadings();
  const [rangeMs, setRangeMs] = useState<number>(DEFAULT_RANGE_MS);

  const filtered = useMemo(() => windowByRange(history, rangeMs), [history, rangeMs]);

  const powerData = useMemo<ChartPoint[]>(
    () => filtered.map((r) => ({ t: r.timestamp, power: r.panel.power })),
    [filtered]
  );
  const viData = useMemo<ChartPoint[]>(
    () =>
      filtered.map((r) => ({
        t: r.timestamp,
        voltage: r.panel.voltage,
        current: r.panel.current,
      })),
    [filtered]
  );
  const tempData = useMemo<ChartPoint[]>(
    () =>
      filtered.map((r) => ({
        t: r.timestamp,
        panel: r.environment.panelTemp,
        ambient: r.environment.ambientTemp,
      })),
    [filtered]
  );

  return (
    <div className="min-h-screen bg-white">
      <PageHeader status={status} lastSyncMs={lastSyncMs} />

      <main className="mx-auto max-w-[1400px] px-4 py-4 md:px-8 md:py-6">
        {error ? (
          <div className="mb-6">
            <ErrorAlert message={error} />
          </div>
        ) : null}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-base font-semibold text-slate-900">Historical Performance</h1>
            <p className="mt-1 text-sm text-slate-500">
              {filtered.length} data points over the selected range
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <RangeSelector value={rangeMs} onChange={setRangeMs} />
            <button
              type="button"
              onClick={() => downloadCsv(filtered, `solar-readings-${rangeLabel(rangeMs)}.csv`)}
              disabled={filtered.length === 0}
              className="shrink-0 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-6">
            <SkeletonChart height={320} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SkeletonChart />
              <SkeletonChart />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <ChartCard title="Panel Power Output" slug="power-output" caption="Full resolution">
              <TimeSeriesChart
                data={powerData}
                series={[{ key: "power", name: "Panel power", color: BLUE_600 }]}
                variant="area"
                unit="W"
                precision={2}
                height={320}
                showDots
              />
            </ChartCard>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartCard
                title="Panel V/I Trend"
                slug="panel-vi-trend"
                legend={[
                  { name: "Voltage (V)", color: BLUE_600 },
                  { name: "Current (A)", color: BLUE_400 },
                ]}
              >
                <TimeSeriesChart
                  data={viData}
                  series={[
                    { key: "voltage", name: "Voltage", color: BLUE_600, axis: "left", unit: "V", precision: 2 },
                    { key: "current", name: "Current", color: BLUE_400, axis: "right", unit: "A", precision: 3 },
                  ]}
                  showDots
                />
              </ChartCard>

              <ChartCard
                title="Temperature Trend"
                slug="temperature-trend"
                legend={[
                  { name: "Panel", color: BLUE_600 },
                  { name: "Ambient", color: BLUE_400 },
                ]}
              >
                <TimeSeriesChart
                  data={tempData}
                  series={[
                    { key: "panel", name: "Panel", color: BLUE_600 },
                    { key: "ambient", name: "Ambient", color: BLUE_400 },
                  ]}
                  unit="°C"
                  precision={1}
                  showDots
                />
              </ChartCard>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
