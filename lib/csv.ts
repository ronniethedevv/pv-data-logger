import type { HistoricalReading } from "@/types/readings";

const COLUMNS = [
  "timestamp_iso",
  "panel_voltage_V",
  "panel_current_A",
  "panel_power_W",
  "panel_temp_C",
  "ambient_temp_C",
  "humidity_pct",
  "irradiance_Wm2",
  "efficiency_pct",
] as const;

function toRow(r: HistoricalReading): (string | number)[] {
  return [
    new Date(r.timestamp).toISOString(),
    r.panel.voltage,
    r.panel.current,
    r.panel.power,
    r.environment.panelTemp,
    r.environment.ambientTemp,
    r.environment.humidity,
    r.environment.irradiance,
    r.efficiency,
  ];
}

/** Serialize readings to a CSV string with a header row. */
export function readingsToCsv(readings: HistoricalReading[]): string {
  const lines = [COLUMNS.join(",")];
  for (const r of readings) {
    lines.push(toRow(r).join(","));
  }
  return lines.join("\n");
}

/** Trigger a browser download of the readings as a CSV file. */
export function downloadCsv(readings: HistoricalReading[], filename = "solar-readings.csv"): void {
  const blob = new Blob([readingsToCsv(readings)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
