# Solar PV Data Logger — Dashboard

A read-only web dashboard for a real-time solar photovoltaic data logger. The
hardware (an ESP32 logging panel power and environmental telemetry)
appends readings to a Google Sheet; this frontend lets engineers
and the project supervisor monitor the system live and review historical
performance.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and
**Recharts**. Live data is read straight from the logger's Google Sheet — the
dashboard refreshes as new rows land.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

- **`/`** — Live dashboard: electrical + environment metric cards, power output
  area chart, irradiance chart, and panel V/I + temperature trends. Updates
  every 5 seconds. Each chart can be exported as a PNG.
- **`/history`** — Range-filterable full-resolution charts with a CSV export.
- **`/system`** — Connection status, per-sensor health, and points logged today.

## Data source (Google Sheet)

The logger appends rows to a Google Sheet, which is the live database. The flow:

- [`lib/sheet.ts`](lib/sheet.ts) reads the sheet and maps each row onto a
  `LiveReading` (columns are matched by header name, so column order can change).
- [`app/api/readings/route.ts`](app/api/readings/route.ts) fetches that
  server-side and returns JSON — this keeps Google out of the browser (no CORS)
  and the source in one place.
- **`useReadings()` in [`lib/readings.ts`](lib/readings.ts)** polls that route
  every 5 seconds. Components never fetch directly, so pointing at a different
  backend is a one-file change (swap the route) with no component edits.

Copy `.env.example` to `.env.local`. For local dev, the default `SHEET_ID` /
`SHEET_GID` gviz export just works (the sheet is *Anyone with the link can
view*).

### Deploying (Vercel etc.)

Google serves the `gviz` link fine from a laptop but returns **404 to requests
from datacenter IPs**, so a deployed host fails with `Sheet responded 404`. Pick
whichever fix fits:

- **`SHEETS_API_KEY` (recommended, no sheet ownership needed).** Reads the sheet
  through the Google Sheets API, which works from any IP. Create a free key at
  [console.cloud.google.com](https://console.cloud.google.com): new project →
  **APIs & Services → Enable APIs → Google Sheets API** → **Credentials → Create
  credentials → API key** (optionally restrict it to the Sheets API). The key
  needs no access to the sheet — link-view is enough. Set `SHEETS_API_KEY`; set
  `SHEET_RANGE` (default `A:L`) only if the data is on a non-first tab.
- **`SHEET_CSV_URL` (sheet owners only).** Publish the sheet
  (**File → Share → Publish to web → pick the tab → CSV**) and set the link.
  Google serves it anonymously from anywhere. Note it can lag the live sheet by
  a few minutes — fine for a 10-minute logging cadence.

Also set **`SHEET_TZ_OFFSET`** (e.g. `+01:00`) so the sheet's local `DATE`/`TIME`
parse correctly on a UTC host. (Vercel reserves `TZ`, so this app-level offset is
used instead.)

## Data model

The canonical reading shape lives in
[`types/readings.ts`](types/readings.ts) (`LiveReading` / `HistoricalReading`)
and matches exactly what the logger firmware pushes — panel voltage / current
/ power, environment (panel + ambient temperature, humidity, irradiance),
derived efficiency, and system flags.

## Out of scope

Authentication, settings, alerts/notifications, and multi-device support are
intentionally not built.
