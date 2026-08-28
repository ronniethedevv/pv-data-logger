import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class lists, resolving conflicts (shadcn/ui convention). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Display timezone.
 *
 * The sheet records wall-clock time at the plant. Formatting in the *viewer's*
 * zone would show a different time to each viewer (and differ between the SSR
 * pass and the browser). Pinning display to the same fixed offset the server
 * parses with guarantees the UI always reads back exactly what's in the sheet.
 *
 * Unset (local dev) falls back to the viewer's own zone, which is correct when
 * that machine is already in the plant's timezone.
 */
const OFFSET_MINUTES = parseOffsetMinutes(process.env.NEXT_PUBLIC_SHEET_TZ_OFFSET);

function parseOffsetMinutes(raw: string | undefined): number | null {
  const o = raw?.trim();
  if (!o) return null;
  if (o === "Z") return 0;
  const m = o.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!m) return null;
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Calendar/clock fields for an instant, in the pinned zone (or viewer-local). */
function fields(ms: number) {
  if (OFFSET_MINUTES === null) {
    const d = new Date(ms);
    return {
      hour: d.getHours(),
      minute: d.getMinutes(),
      second: d.getSeconds(),
      day: d.getDate(),
      month: d.getMonth(),
    };
  }
  // Shift the instant, then read UTC fields to render the fixed offset.
  const d = new Date(ms + OFFSET_MINUTES * 60_000);
  return {
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    day: d.getUTCDate(),
    month: d.getUTCMonth(),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Format an epoch-ms timestamp as HH:mm:ss. */
export function formatClock(ms: number | null | undefined): string {
  if (ms == null) return "--:--:--";
  const f = fields(ms);
  return `${pad(f.hour)}:${pad(f.minute)}:${pad(f.second)}`;
}

/** Format an epoch-ms timestamp as HH:mm (chart axis, sub-24h ranges). */
export function formatHm(ms: number): string {
  const f = fields(ms);
  return `${pad(f.hour)}:${pad(f.minute)}`;
}

/** Format an epoch-ms timestamp as "MMM dd HH:mm" (multi-day ranges). */
export function formatMonthDayTime(ms: number): string {
  const f = fields(ms);
  return `${MONTHS[f.month]} ${pad(f.day)} ${pad(f.hour)}:${pad(f.minute)}`;
}

/** True when both instants fall on the same calendar day in the display zone. */
export function isSameDay(a: number, b: number): boolean {
  const x = fields(a);
  const y = fields(b);
  return x.day === y.day && x.month === y.month && yearOf(a) === yearOf(b);
}

function yearOf(ms: number): number {
  if (OFFSET_MINUTES === null) return new Date(ms).getFullYear();
  return new Date(ms + OFFSET_MINUTES * 60_000).getUTCFullYear();
}

/** Epoch ms of midnight for the day containing `ms`, in the display zone. */
export function startOfDay(ms: number = Date.now()): number {
  if (OFFSET_MINUTES === null) {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  const shifted = ms + OFFSET_MINUTES * 60_000;
  const midnightUtc = Math.floor(shifted / 86_400_000) * 86_400_000;
  return midnightUtc - OFFSET_MINUTES * 60_000;
}

/**
 * Clock time, prefixed with the date whenever the instant is not today.
 *
 * Without this a reading logged days ago reads as a plain time, which looks
 * like it just arrived — the exact confusion when the rig has been powered off.
 */
export function formatClockWithDate(
  ms: number | null | undefined,
  now: number = Date.now()
): string {
  if (ms == null) return "--:--:--";
  const clock = formatClock(ms);
  if (isSameDay(ms, now)) return clock;
  const f = fields(ms);
  return `${MONTHS[f.month]} ${pad(f.day)} ${clock}`;
}
