export type LiveReading = {
  timestamp: number; // Unix epoch ms, from DS3231
  panel: {
    voltage: number; // V — INA226 @ 0x40 (main panel)
    current: number; // A — INA226 @ 0x40
    power: number; // W — INA226 @ 0x40
  };
  environment: {
    panelTemp: number; // °C — DS18B20 on the panel
    ambientTemp: number; // °C — DHT22
    humidity: number; // % — DHT22
    irradiance: number; // W/m² — from reference-cell Isc (INA226 @ 0x41),
    // temperature-compensated by the firmware
  };
  efficiency: number; // % — panel power vs theoretical from irradiance
  system: {
    /**
     * Logger state for this row: "NORMAL", or "ISOLATED" when the firmware has
     * briefly disconnected the charge controller to measure the panel unloaded.
     */
    mode: string;
    lastSyncMs: number;
  };
};

export type HistoricalReading = LiveReading;
