"use client";

import { useRef } from "react";
import { downloadChart } from "@/lib/exportChart";

type ChartCardProps = {
  title: string;
  /** Filename stem for the exported PNG, e.g. "power-output". */
  slug: string;
  caption?: string;
  legend?: { name: string; color: string }[];
  children: React.ReactNode;
};

/**
 * Bordered card wrapping a chart, with a title, optional legend, and a PNG
 * download button. The whole card (title + chart) is captured on export.
 */
export function ChartCard({ title, slug, caption, legend, children }: ChartCardProps) {
  const cardRef = useRef<HTMLElement>(null);

  const handleDownload = () => {
    if (cardRef.current) downloadChart(cardRef.current, slug);
  };

  return (
    <section ref={cardRef} className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
          {caption ? <p className="mt-0.5 text-xs text-slate-400">{caption}</p> : null}
        </div>
        <div className="flex items-center gap-4">
          {legend ? (
            <ul className="flex items-center gap-4">
              {legend.map((item) => (
                <li key={item.name} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                    aria-hidden
                  />
                  {item.name}
                </li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            onClick={handleDownload}
            data-export-ignore="true"
            aria-label={`Download ${title} as PNG`}
            title="Download as PNG"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-slate-600"
          >
            <DownloadIcon />
          </button>
        </div>
      </div>
      {children}
    </section>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
