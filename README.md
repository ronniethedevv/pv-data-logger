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

- [`lib/sheet.ts`](lib/sheet.ts) reads the sheet's CSV export (the `gviz`
  endpoint) and maps each row onto a `LiveReading` (columns are matched by
  header name, so column order can change).
- [`app/api/readings/route.ts`](app/api/readings/route.ts) fetches that
  server-side and returns JSON — this keeps Google out of the browser (no CORS)
  and the source URL in one place.
- **`useReadings()` in [`lib/readings.ts`](lib/readings.ts)** polls that route
  every 5 seconds. Components never fetch directly, so pointing at a different
  backend is a one-file change (swap the route) with no component edits.

Set the sheet via env (copy `.env.example` to `.env.local`): `SHEET_ID` and
`SHEET_GID` (the tab's `gid`). The sheet must be shared as *Anyone with the link
can view*. Without these, it falls back to the project's default sheet.

## Data model

The canonical reading shape lives in
[`types/readings.ts`](types/readings.ts) (`LiveReading` / `HistoricalReading`)
and matches exactly what the logger firmware pushes — panel voltage / current
/ power, environment (panel + ambient temperature, humidity, irradiance),
derived efficiency, and system flags.

## Out of scope

Authentication, settings, alerts/notifications, and multi-device support are
intentionally not built.
