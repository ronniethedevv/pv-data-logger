import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: number | string;
  unit?: string;
  /** Delta vs the 5-minute trailing average. Omit to hide the trend row. */
  trend?: number | null;
  /** Decimal places for both value and trend (numeric values only). */
  precision?: number;
  variant?: "default" | "primary";
};

function format(value: number | string, precision: number): string {
  if (typeof value === "string") return value;
  return value.toFixed(precision);
}

export function MetricCard({
  label,
  value,
  unit,
  trend,
  precision = 1,
  variant = "default",
}: MetricCardProps) {
  const isPrimary = variant === "primary";
  const display = format(value, precision);
  const showTrend = trend != null && Number.isFinite(trend);
  const rising = (trend ?? 0) >= 0;

  return (
    <div
      className={cn(
        "rounded-lg border p-6",
        isPrimary ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"
      )}
    >
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>

      <div className="mt-3 flex items-baseline">
        {/* key on the value replays the fade animation on each update */}
        <span
          key={display}
          className={cn(
            "value-fade font-semibold tabular-nums text-slate-900",
            isPrimary ? "text-4xl sm:text-5xl" : "text-3xl"
          )}
        >
          {display}
        </span>
        {unit ? <span className="ml-1 text-sm text-slate-500">{unit}</span> : null}
      </div>

      {showTrend ? (
        <p
          className={cn(
            "mt-2 flex items-center gap-1 text-xs tabular-nums",
            rising ? "text-emerald-600" : "text-red-500"
          )}
        >
          <span aria-hidden>{rising ? "▲" : "▼"}</span>
          <span>
            {Math.abs(trend as number).toFixed(precision)}
            {unit ? ` ${unit}` : ""}
          </span>
          <span className="text-slate-400">vs 5-min avg</span>
        </p>
      ) : null}
    </div>
  );
}
