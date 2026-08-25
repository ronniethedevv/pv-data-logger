"use client";

import { useState } from "react";

/** Dismissible inline error banner. Sits above content; never blocks layout. */
export function ErrorAlert({ message }: { message: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" aria-hidden />
      <p className="flex-1 text-sm text-red-700">{message}</p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-sm text-red-400 transition-colors hover:text-red-600"
        aria-label="Dismiss"
      >
        Dismiss
      </button>
    </div>
  );
}
