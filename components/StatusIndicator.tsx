import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/lib/readings";

/** Filled dot + label. The only place color carries meaning in the UI. */
export function StatusIndicator({ status }: { status: ConnectionStatus }) {
  const connected = status === "connected";
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          connected ? "bg-emerald-500" : "bg-red-500"
        )}
        aria-hidden
      />
      <span className="text-sm text-slate-600">{connected ? "Connected" : "Offline"}</span>
    </span>
  );
}
