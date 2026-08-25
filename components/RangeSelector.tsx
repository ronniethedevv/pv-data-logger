"use client";

import { cn } from "@/lib/utils";
import { RANGES } from "@/lib/ranges";

type RangeSelectorProps = {
  value: number;
  onChange: (ms: number) => void;
};

/** Segmented control for picking a chart time window (1h … 48h). */
export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Chart time range"
      className="inline-flex rounded-lg border border-slate-200 p-0.5"
    >
      {RANGES.map((r) => (
        <button
          key={r.label}
          type="button"
          onClick={() => onChange(r.ms)}
          aria-pressed={value === r.ms}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm tabular-nums transition-colors",
            value === r.ms
              ? "bg-slate-100 text-slate-900"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
