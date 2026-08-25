export type LiveReading = {
  timestamp: number; // Unix epoch ms, from DS3231
  panel: {
    voltage: number; // V — INA226 @ 0x44 (main panel SC2)
    current: number; // A — INA226 @ 0x44
    power: number; // W — INA226 @ 0x44
  };
  environment: {
    panelTemp: number; // °C — MAX6675 K-type thermocouple
    ambientTemp: number; // °C — DHT22
    humidity: number; // % — DHT22
    irradiance: number; // W/m² — derived from DuraVolt reference cell Isc
  };
  efficiency: number; // % — panel power vs theoretical from irradiance
  system: {
    wifiConnected: boolean;
    sdCardActive: boolean;
    lastSyncMs: number;
  };
};

export type HistoricalReading = LiveReading;
