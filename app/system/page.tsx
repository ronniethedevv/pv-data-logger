"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { MetricCard } from "@/components/MetricCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorAlert } from "@/components/ui/alert";
import { formatClock } from "@/lib/utils";
import { useReadings, POLL_INTERVAL_MS } from "@/lib/readings";

export default function SystemPage() {
  const { live, history, status, lastSyncMs, loading, error } = useReadings();

  const pointsToday = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return history.filter((r) => r.timestamp >= startOfDay.getTime()).length;
  }, [history]);

  // Sensor list reflects the documented hardware. "Health" is inferred from the
  // live reading (real firmware would publish per-sensor status flags).
  const sensors = live
    ? [
        { name: "Panel power monitor", detail: "INA226 @ 0x44", ok: true },
        { name: "Panel thermocouple", detail: "MAX6675 K-type", ok: live.environment.panelTemp > -50 },
        { name: "Ambient temp / humidity", detail: "DHT22", ok: live.environment.humidity > 0 },
        { name: "Irradiance reference", detail: "DuraVolt cell — INA226 @ 0x40", ok: true },
        { name: "Real-time clock", detail: "DS3231", ok: live.timestamp > 0 },
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
                label="Refresh Interval"
                value={POLL_INTERVAL_MS / 1000}
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
              <h2 className="text-sm font-semibold text-slate-900">Connectivity</h2>
              <dl className="mt-4 divide-y divide-slate-100">
                <Row label="Wi-Fi">
                  <StatusBadge tone={live.system.wifiConnected ? "ok" : "error"}>
                    {live.system.wifiConnected ? "Connected" : "Disconnected"}
                  </StatusBadge>
                </Row>
                <Row label="SD Card">
                  <StatusBadge tone={live.system.sdCardActive ? "ok" : "error"}>
                    {live.system.sdCardActive ? "Active" : "Inactive"}
                  </StatusBadge>
                </Row>
                <Row label="Last Sync">
                  <span className="text-sm tabular-nums text-slate-600">
                    {formatClock(live.system.lastSyncMs)}
                  </span>
                </Row>
              </dl>
            </section>

            {/* Sensor health */}
            <section className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-slate-900">Sensor Health</h2>
              <dl className="mt-4 divide-y divide-slate-100">
                {sensors.map((s) => (
                  <Row key={s.name} label={s.name} detail={s.detail}>
                    <StatusBadge tone={s.ok ? "ok" : "error"}>
                      {s.ok ? "Online" : "Fault"}
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
