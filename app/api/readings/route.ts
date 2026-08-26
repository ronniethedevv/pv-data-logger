import { NextResponse } from "next/server";
import { fetchSheetReadings } from "@/lib/sheet";

/**
 * Live readings, proxied server-side from the Google Sheet.
 *
 * The client polls this every few seconds; each request re-reads the sheet so
 * the dashboard reflects new rows as the logger appends them. Kept dynamic and
 * uncached so we never serve a stale snapshot.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_POINTS = 1000; // cap payload; charts only need a trailing window

export async function GET() {
  try {
    const readings = (await fetchSheetReadings()).slice(-MAX_POINTS);
    return NextResponse.json(
      { readings },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    // Visible in Vercel function logs. A 404/302/403 from Google usually means
    // the data source env vars aren't set for this host (see lib/sheet.ts).
    console.error("[readings] failed to load sheet:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load sheet" },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
