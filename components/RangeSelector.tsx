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
      // Full-width even columns on mobile so every option stays tappable;
      // collapses to a compact inline pill from sm up.
      className="grid w-full grid-cols-6 rounded-lg border border-slate-200 p-0.5 sm:inline-flex sm:w-auto"
    >
      {RANGES.map((r) => (
        <button
          key={r.label}
          type="button"
          onClick={() => onChange(r.ms)}
          aria-pressed={value === r.ms}
          className={cn(
            "rounded-md px-2 py-1.5 text-sm tabular-nums transition-colors sm:px-3",
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
