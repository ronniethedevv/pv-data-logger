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
      <div className="mx-auto flex max-w-[1400px] items-center gap-8 px-8 py-4">
        <span className="text-base font-semibold text-slate-900">Solar PV Data Logger</span>

        <nav className="flex items-center gap-1">
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

        <div className="ml-auto flex items-center gap-4">
          <StatusIndicator status={status} />
          <span className="text-sm tabular-nums text-slate-400">
            Last sync: {formatClock(lastSyncMs)}
          </span>
        </div>
      </div>
    </header>
  );
}
