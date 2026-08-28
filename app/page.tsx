"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { EnvironmentCard } from "@/components/EnvironmentCard";
import { ChartCard } from "@/components/ChartCard";
import { RangeSelector } from "@/components/RangeSelector";
import { TimeSeriesChart, type ChartPoint } from "@/components/TimeSeriesChart";
import { SkeletonCard, SkeletonChart } from "@/components/SkeletonCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorAlert } from "@/components/ui/alert";
import { useReadings, trendVsAverage } from "@/lib/readings";
import { DEFAULT_RANGE_MS, rangeLabel, windowByRange } from "@/lib/ranges";

const BLUE_600 = "#2563EB";
const BLUE_400 = "#60A5FA";

export default function DashboardPage() {
  const { live, history, status, lastSyncMs, loading, error } = useReadings();
  const [rangeMs, setRangeMs] = useState<number>(DEFAULT_RANGE_MS);

  // Metric cards always read the latest sample; only the charts are windowed.
  const windowed = useMemo(() => windowByRange(history, rangeMs), [history, rangeMs]);
  const caption = `Last ${rangeLabel(rangeMs)} · ${windowed.length} points`;

  const powerData = useMemo<ChartPoint[]>(
    () => windowed.map((r) => ({ t: r.timestamp, power: r.panel.power })),
    [windowed]
  );
  const irradianceData = useMemo<ChartPoint[]>(
    () => windowed.map((r) => ({ t: r.timestamp, irradiance: r.environment.irradiance })),
    [windowed]
  );
  const viData = useMemo<ChartPoint[]>(
    () =>
      windowed.map((r) => ({
        t: r.timestamp,
        voltage: r.panel.voltage,
        current: r.panel.current,
      })),
    [windowed]
  );
  const tempData = useMemo<ChartPoint[]>(
    () =>
      windowed.map((r) => ({
        t: r.timestamp,
        panel: r.environment.panelTemp,
        ambient: r.environment.ambientTemp,
      })),
    [windowed]
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

        {loading ? (
          <LoadingState />
        ) : !live ? (
          <EmptyState
            title="No readings available"
            detail="The data source returned no rows. Check that the logger is writing to the sheet and that the data source is configured for this host."
          />
        ) : (
          <div className="flex flex-col gap-6">
            {/* Row 1 — Electrical metrics. Two-up on mobile to cut scrolling;
                the Panel Power hero still reads as primary via its fill/size. */}
            <section className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              <MetricCard
                label="Panel Voltage"
                value={live.panel.voltage}
                unit="V"
                precision={2}
                trend={trendVsAverage(history, live.panel.voltage, (r) => r.panel.voltage)}
              />
              <MetricCard
                label="Panel Current"
                value={live.panel.current}
                unit="A"
                precision={3}
                trend={trendVsAverage(history, live.panel.current, (r) => r.panel.current)}
              />
              <MetricCard
                label="Panel Power"
                value={live.panel.power}
                unit="W"
                precision={2}
                variant="primary"
                trend={trendVsAverage(history, live.panel.power, (r) => r.panel.power)}
              />
              <MetricCard
                label="Efficiency"
                value={live.efficiency}
                unit="%"
                precision={1}
                trend={trendVsAverage(history, live.efficiency, (r) => r.efficiency)}
              />
            </section>

            {/* Row 2 — Environment. Ambient holds two values side by side, so on
                mobile it takes a full row below the two single-value cards. */}
            <section className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
              <MetricCard
                label="Panel Temperature"
                value={live.environment.panelTemp}
                unit="°C"
                precision={1}
                trend={trendVsAverage(
                  history,
                  live.environment.panelTemp,
                  (r) => r.environment.panelTemp
                )}
              />
              <div className="order-last col-span-2 lg:order-none lg:col-span-1">
                <EnvironmentCard
                  label="Ambient"
                  primary={{ value: live.environment.ambientTemp, unit: "°C", caption: "Temperature" }}
                  secondary={{ value: live.environment.humidity, unit: "%", caption: "Humidity" }}
                />
              </div>
              <MetricCard
                label="Irradiance"
                value={live.environment.irradiance}
                unit="W/m²"
                precision={0}
                trend={trendVsAverage(
                  history,
                  live.environment.irradiance,
                  (r) => r.environment.irradiance
                )}
              />
            </section>

            {/* Chart range control (applies to all charts below) */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Trends</h2>
              <RangeSelector value={rangeMs} onChange={setRangeMs} />
            </div>

            {/* Row 3 — Power output */}
            <ChartCard title="Panel Power Output" slug="power-output" caption={caption}>
              <TimeSeriesChart
                data={powerData}
                series={[{ key: "power", name: "Panel power", color: BLUE_600 }]}
                variant="area"
                unit="W"
                precision={2}
                height={300}
                showDots
              />
            </ChartCard>

            {/* Row 4 — Irradiance */}
            <ChartCard title="Irradiance" slug="irradiance" caption={caption}>
              <TimeSeriesChart
                data={irradianceData}
                series={[{ key: "irradiance", name: "Irradiance", color: BLUE_600 }]}
                variant="line"
                unit="W/m²"
                precision={0}
                height={300}
                showDots
              />
            </ChartCard>

            {/* Row 5 — Sub-charts */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartCard
                title="Panel V/I Trend"
                slug="panel-vi-trend"
                caption={caption}
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
                caption={caption}
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
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </section>
      <section className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </section>
      <SkeletonChart height={300} />
      <SkeletonChart height={300} />
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SkeletonChart />
        <SkeletonChart />
      </section>
    </div>
  );
}
