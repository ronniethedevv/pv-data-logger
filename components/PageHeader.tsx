"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, formatClock } from "@/lib/utils";
import type { ConnectionStatus } from "@/lib/readings";
import { StatusIndicator } from "@/components/StatusIndicator";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/history", label: "History" },
  { href: "/system", label: "System" },
];

type PageHeaderProps = {
  status: ConnectionStatus;
  lastSyncMs: number | null;
};

/** Sticky top bar: title, section nav, live connection status + last sync. */
export function PageHeader({ status, lastSyncMs }: PageHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 md:gap-x-8 md:px-8 md:py-4">
        <span className="text-base font-semibold text-slate-900">Solar PV Data Logger</span>

        {/* Wraps to its own full-width row on mobile; sits inline from md up. */}
        <nav className="order-last flex w-full items-center gap-1 md:order-none md:w-auto">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3 md:gap-4">
          <StatusIndicator status={status} />
          <span className="text-sm tabular-nums text-slate-400">
            <span className="hidden sm:inline">Last sync: </span>
            {formatClock(lastSyncMs)}
          </span>
        </div>
      </div>
    </header>
  );
}
