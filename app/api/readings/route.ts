import { NextResponse } from "next/server";
import { sheetCsvUrl, parseSheet } from "@/lib/sheet";

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
  const url = sheetCsvUrl();
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      // Visible in Vercel function logs. A 404/302 here from a datacenter IP
      // usually means SHEET_CSV_URL (Publish-to-web link) is not set.
      console.error(`[readings] sheet fetch failed: ${res.status} ${res.statusText} — ${url}`);
      return NextResponse.json(
        { error: `Sheet responded ${res.status}` },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }
    const csv = await res.text();
    const readings = parseSheet(csv).slice(-MAX_POINTS);
    return NextResponse.json(
      { readings },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error(`[readings] sheet fetch threw for ${url}:`, e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load sheet" },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
