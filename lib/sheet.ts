import type { LiveReading } from "@/types/readings";

/**
 * Google Sheets data source.
 *
 * The logger appends rows to a Google Sheet; this reads them and maps each row
 * onto a `LiveReading`. Runs server-side only (from the `/api/readings` route)
 * so the browser never hits Google directly and there is no CORS to fight.
 *
 * Source selection (first that applies wins):
 *   1. SHEETS_API_KEY  — Google Sheets API v4. Works from any IP (incl. Vercel)
 *      as long as the sheet is link-viewable; the key needs no access to the
 *      sheet and you don't have to own it. Best for deployed hosts.
 *   2. SHEET_CSV_URL   — a "Publish to web" CSV link (needs sheet ownership).
 *   3. gviz CSV        — built from SHEET_ID/SHEET_GID. Works locally but Google
 *      404s it from datacenter IPs, so it's really only for local dev.
 *
 * Sheet columns (order-independent — matched by header name):
 *   DATE, TIME, STATE, AMBIENT TEMP, HUMIDITY, PANEL TEMP,
 *   REF PANEL VOLT, REF CURRENT, IRRIDANCE, MAIN PV VOLT,
 *   MAIN PV CURRENT, MAIN PV POWER
 *
 * REF PANEL VOLT / REF CURRENT are the reference-cell (INA226 @ 0x40) readings
 * the logger already folds into IRRIDANCE, so we don't surface them separately.
 */

const SHEET_ID = process.env.SHEET_ID ?? "1k00TxA9Z1YWQsqbopmQAeSCsULbM4bc05_caFlNNxkM";
const SHEET_GID = process.env.SHEET_GID ?? "0";
const API_KEY = process.env.SHEETS_API_KEY?.trim();
// A1 range for the Sheets API. No tab name → the first sheet (gid 0). Set this
// (e.g. "Log!A:L") if the data lives on a differently-named tab.
const SHEET_RANGE = process.env.SHEET_RANGE?.trim() || "A:L";
const PANEL_AREA_M2 = 0.06; // 6 W panel — used to derive efficiency

// The sheet records DATE/TIME in the plant's local zone with no offset. On a UTC
// host (Vercel) that would parse an hour or more off, and Vercel reserves `TZ`,
// so set SHEET_TZ_OFFSET (e.g. "+01:00") to pin the zone. Empty = host-local.
const TZ_OFFSET = (() => {
  const raw = process.env.SHEET_TZ_OFFSET?.trim();
  return raw && /^([+-]\d{2}:\d{2}|Z)$/.test(raw) ? raw : "";
})();

/** CSV endpoint: the published link if given, else the gviz export. */
function csvUrl(): string {
  const published = process.env.SHEET_CSV_URL?.trim();
  if (published) return published;
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`;
}

/** Fetch the sheet as a grid of string cells, via whichever source is set. */
async function fetchRows(): Promise<string[][]> {
  if (API_KEY) {
    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}` +
      `/values/${encodeURIComponent(SHEET_RANGE)}?majorDimension=ROWS&key=${API_KEY}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Sheets API responded ${res.status}`);
    }
    const data = (await res.json()) as { values?: unknown[][] };
    return (data.values ?? []).map((row) => row.map((c) => (c == null ? "" : String(c))));
  }

  const url = csvUrl();
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Sheet responded ${res.status}`);
  }

  const text = await res.text();
  // A sheet's /edit URL returns the HTML editor with HTTP 200, which would
  // otherwise parse as gibberish CSV and silently yield zero readings.
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("text/html") || /^\s*<(!doctype|html)/i.test(text)) {
    throw new Error(
      "Data source returned a web page, not CSV — SHEET_CSV_URL must be the " +
        "File > Share > Publish to web CSV link (ending in output=csv), not the /edit URL"
    );
  }

  return parseCsv(text);
}

// Server-side cache. The sheet only changes every ~10 min, so we read Google at
// most once per window no matter how many viewers are polling — this decouples
// Google/quota usage from the number of open tabs and keeps it comfortably free.
const CACHE_MS = Number(process.env.SHEET_CACHE_MS ?? 60_000);
let cache: { at: number; readings: LiveReading[] } | null = null;

/** Fetch and map the sheet to chronologically-sorted readings (cached). */
export async function fetchSheetReadings(): Promise<LiveReading[]> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_MS) return cache.readings;

  try {
    const rows = await fetchRows();
    const readings = rowsToReadings(rows);

    // Rows came back but none parsed — almost always an unexpected DATE/TIME
    // format or renamed headers. Fail loudly rather than returning an empty
    // array, which the UI cannot distinguish from "still loading".
    if (readings.length === 0 && rows.length > 1) {
      const sample = [rows[1]?.[0], rows[1]?.[1]].filter(Boolean).join(" ");
      throw new Error(
        `Fetched ${rows.length} rows but parsed 0 readings — check DATE/TIME columns (sample: "${sample}")`
      );
    }

    cache = { at: now, readings };
    return readings;
  } catch (e) {
    // Ride out a transient blip on the last good data rather than flapping to an
    // error; a first-ever failure (no cache yet) still surfaces for diagnosis.
    if (cache) return cache.readings;
    throw e;
  }
}

/** Parse CSV text into rows of cells, honoring quoted fields. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function normalizeHeader(h: string): string {
  return h.trim().replace(/\s+/g, " ").toUpperCase();
}

function toNumber(cell: string | undefined): number {
  const v = parseFloat((cell ?? "").trim());
  return Number.isFinite(v) ? v : 0;
}

function round(v: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(v * f) / f;
}

/**
 * Turn a `DATE` + `TIME` pair into an epoch-ms timestamp, interpreting the naive
 * time in `SHEET_TZ_OFFSET` (or the host's local zone if unset). `date` may be
 * blank on some rows, in which case the caller's carried `fallbackDate` is used.
 * Returns null when neither yields a valid date.
 */
function parseTimestamp(date: string, time: string, fallbackDate: string): number | null {
  const d = (date || fallbackDate).trim();
  const t = time.trim();
  if (!d || !t) return null;

  const iso = toIsoDate(d);
  if (!iso) return null;

  const ms = new Date(`${iso}T${padTime(t)}${TZ_OFFSET}`).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Normalize a sheet date cell to `YYYY-MM-DD`.
 *
 * The CSV export gives ISO, but the Sheets API returns the cell's *display*
 * format, which is commonly `M/D/YYYY` (US locale) or `D/M/YYYY`. Slash dates
 * are read as month-first unless the first field is clearly a day (> 12).
 */
function toIsoDate(d: string): string | null {
  const isoMatch = d.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, day] = isoMatch;
    return `${y}-${m.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const slash = d.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slash) {
    const a = Number(slash[1]);
    const b = Number(slash[2]);
    const year = slash[3];
    const [month, day] = a > 12 ? [b, a] : [a, b];
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return null;
}

/** `H:MM` / `H:MM:SS` → zero-padded `HH:MM:SS`. */
function padTime(t: string): string {
  const m = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return t;
  return `${m[1].padStart(2, "0")}:${m[2]}:${m[3] ?? "00"}`;
}

/** Map a header row + data rows to chronologically-sorted readings. */
export function rowsToReadings(rows: string[][]): LiveReading[] {
  if (rows.length < 2) return [];

  const header = rows[0].map(normalizeHeader);
  const at = (name: string) => header.indexOf(name);
  const col = {
    date: at("DATE"),
    time: at("TIME"),
    state: at("STATE"),
    ambient: at("AMBIENT TEMP"),
    humidity: at("HUMIDITY"),
    panelTemp: at("PANEL TEMP"),
    irradiance: at("IRRIDANCE"),
    pvVolt: at("MAIN PV VOLT"),
    pvCurrent: at("MAIN PV CURRENT"),
    pvPower: at("MAIN PV POWER"),
  };

  const readings: LiveReading[] = [];
  let lastDate = "";

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const date = (r[col.date] ?? "").trim();
    const time = (r[col.time] ?? "").trim();
    if (date) lastDate = date;

    const ts = parseTimestamp(date, time, lastDate);
    if (ts === null) continue;

    const irradiance = toNumber(r[col.irradiance]);
    const power = toNumber(r[col.pvPower]);
    const theoretical = irradiance * PANEL_AREA_M2;
    const efficiency = theoretical > 0.05 ? Math.min(100, Math.max(0, (power / theoretical) * 100)) : 0;

    const state = (r[col.state] ?? "").trim();
    const healthy = !/fault|error|offline|disconnect/i.test(state);

    readings.push({
      timestamp: ts,
      panel: {
        voltage: toNumber(r[col.pvVolt]),
        current: toNumber(r[col.pvCurrent]),
        power,
      },
      environment: {
        panelTemp: toNumber(r[col.panelTemp]),
        ambientTemp: toNumber(r[col.ambient]),
        humidity: toNumber(r[col.humidity]),
        irradiance,
      },
      efficiency: round(efficiency, 1),
      system: {
        wifiConnected: healthy,
        sdCardActive: healthy,
        lastSyncMs: ts,
      },
    });
  }

  readings.sort((a, b) => a.timestamp - b.timestamp);
  return readings;
}
