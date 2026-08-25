import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder matching MetricCard dimensions. */
export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-9 w-28" />
    </div>
  );
}

/** Loading placeholder for a chart panel. */
export function SkeletonChart({ height = 280 }: { height?: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-4 w-full" style={{ height }} />
    </div>
  );
}
