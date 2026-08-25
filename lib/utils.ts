import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class lists, resolving conflicts (shadcn/ui convention). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format an epoch-ms timestamp as HH:mm:ss in local time. */
export function formatClock(ms: number | null | undefined): string {
  if (ms == null) return "--:--:--";
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** Format an epoch-ms timestamp as HH:mm (chart axis, sub-24h ranges). */
export function formatHm(ms: number): string {
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Format an epoch-ms timestamp as "MMM dd HH:mm" (multi-day ranges). */
export function formatMonthDayTime(ms: number): string {
  const d = new Date(ms);
  const month = d.toLocaleDateString([], { month: "short" });
  const day = String(d.getDate()).padStart(2, "0");
  return `${month} ${day} ${formatHm(ms)}`;
}
