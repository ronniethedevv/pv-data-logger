"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { MetricCard } from "@/components/MetricCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorAlert } from "@/components/ui/alert";
import { formatClockWithDate, startOfDay } from "@/lib/utils";
import { useReadings, isFresh, LOG_INTERVAL_MS, STALE_AFTER_MS } from "@/lib/readings";

export default function SystemPage() {
  const { live, history, status, lastSyncMs, loading, error } = useReadings();
  const fresh = isFresh(live);

  // Counted from midnight in the plant's zone, matching the displayed times.
  const pointsToday = useMemo(() => {
    const midnight = startOfDay();
    return history.filter((r) => r.timestamp >= midnight).length;
  }, [history]);

  /**
   * Sensors as wired in the firmware. The logger publishes only readings — no
   * per-sensor status flags — so "Reporting" means the latest row carried a
   * plausible value for that sensor. The firmware substitutes 0 for a failed
   * DHT22 read and the DS18B20 returns -127 when it is not found, so those are
   * the values that indicate a fault.
   */
  const sensors = live
    ? [
        {
          name: "Main PV monitor",
          detail: "INA226 @ 0x40",
          ok: Number.isFinite(live.panel.voltage),
        },
        {
          name: "Reference cell monitor",
          detail: "INA226 @ 0x41 — feeds irradiance",
          ok: Number.isFinite(live.environment.irradiance),
        },
        {
          name: "Panel temperature",
          detail: "DS18B20 (OneWire)",
          ok: live.environment.panelTemp > -50,
        },
        {
          name: "Ambient temp / humidity",
          detail: "DHT22",
          ok: live.environment.humidity > 0 && live.environment.ambientTemp > 0,
        },
        { name: "Real-time clock", detail: "DS3231 (NTP-synced)", ok: live.timestamp > 0 },
      ]
    : [];

  return (
    <div className="min-h-screen bg-white">
      <PageHeader status={status} lastSyncMs={lastSyncMs} />

      <main className="mx-auto max-w-[1400px] px-4 py-4 md:px-8 md:py-6">
        {error ? (
          <div className="mb-6">
            <ErrorAlert message={error} />
          </div>
        ) : null}

        <div className="mb-6">
          <h1 className="text-base font-semibold text-slate-900">System Status</h1>
          <p className="mt-1 text-sm text-slate-500">
            Connection, sensor health, and logging activity
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : !live ? (
          <EmptyState
            title="No readings available"
            detail="The data source returned no rows, so sensor status cannot be determined."
          />
        ) : (
          <div className="flex flex-col gap-6">
            {/* Logging summary */}
            <section className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
              <MetricCard label="Data Points Today" value={pointsToday} unit="logged" precision={0} />
              <MetricCard
                label="Logging Interval"
                value={LOG_INTERVAL_MS / 1000}
                unit="s"
                precision={0}
              />
              <MetricCard
                label="History Buffer"
                value={history.length}
                unit="points"
                precision={0}
              />
            </section>

            {/* Connectivity */}
            <section className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-slate-900">Logger</h2>
              <dl className="mt-4 divide-y divide-slate-100">
                <Row
                  label="Uplink"
                  detail={
                    fresh
                      ? "Rows arriving on schedule"
                      : `No new row for over ${Math.round(STALE_AFTER_MS / 60000)} min`
                  }
                >
                  <StatusBadge tone={fresh ? "ok" : "error"}>
                    {fresh ? "Reporting" : "Stale"}
                  </StatusBadge>
                </Row>
                <Row
                  label="Mode"
                  detail={
                    live.system.mode === "ISOLATED"
                      ? "Charge controller briefly disconnected for an unloaded reading"
                      : "Charge controller connected"
                  }
                >
                  <StatusBadge tone="neutral">{live.system.mode}</StatusBadge>
                </Row>
                <Row label="Last Reading">
                  <span className="text-sm tabular-nums text-slate-600">
                    {formatClockWithDate(live.system.lastSyncMs)}
                  </span>
                </Row>
              </dl>
            </section>

            {/* Sensor health */}
            <section className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-slate-900">Sensors</h2>
              <p className="mt-1 text-xs text-slate-400">
                Inferred from the latest reading — the logger does not publish
                per-sensor status
              </p>
              <dl className="mt-4 divide-y divide-slate-100">
                {sensors.map((s) => (
                  <Row key={s.name} label={s.name} detail={s.detail}>
                    <StatusBadge tone={s.ok ? "ok" : "error"}>
                      {s.ok ? "Reporting" : "Fault"}
                    </StatusBadge>
                  </Row>
                ))}
              </dl>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function Row({
  label,
  detail,
  children,
}: {
  label: string;
  detail?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div>
        <dt className="text-sm text-slate-700">{label}</dt>
        {detail ? <dd className="text-xs text-slate-400">{detail}</dd> : null}
      </div>
      {children}
    </div>
  );
}
