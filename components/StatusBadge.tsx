import { cn } from "@/lib/utils";

type Tone = "ok" | "error" | "neutral";

/** Small pill conveying a binary/health state (sensor online, SD active, …). */
export function StatusBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tone === "ok" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "error" && "border-red-200 bg-red-50 text-red-600",
        tone === "neutral" && "border-slate-200 bg-slate-50 text-slate-600"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "ok" && "bg-emerald-500",
          tone === "error" && "bg-red-500",
          tone === "neutral" && "bg-slate-400"
        )}
        aria-hidden
      />
      {children}
    </span>
  );
}
