export type AppView = 'home' | 'dashboard' | 'global-map' | 'ai-copilot' | 'compare' | 'alerts' | 'auth' | 'register';

export interface PollutantMeasurement {
  code: string;
  name: string;
  value: number;
  unit: string;
  aqiSubIndex: number;
  whoBenchmark: number;
  whoPercentage: number;
  status: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  description: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  windDirectionCompass: string;
  surfacePressure: number;
  precipitation: number;
  boundaryLayerHeight: number;
  weatherCode: number;
  weatherDescription: string;
}

export interface EnvironmentalTelemetry {
  location: {
    name: string;
    latitude: number;
    longitude: number;
    country: string;
    admin1?: string;
    timezone?: string;
    elevation?: number;
    stationId?: string;
    sensorNetwork?: string;
  };
  overallAqi: number;
  aqiCategory: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  dominantPollutant: string;
  biometricAdvisory: {
    headline: string;
    description: string;
    riskLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  };
  pollutants: Record<string, PollutantMeasurement>;
  weather: WeatherData;
  hourlyForecast: Array<{
    time: string;
    aqi: number;
    pm2_5: number;
    pm10: number;
    no2: number;
    o3: number;
    so2: number;
    temperature: number;
    humidity: number;
    windSpeed: number;
  }>;
  telemetryMetadata: {
    sourceProvider: string;
    calibrationStandard: string;
    orbitalUplink: string;
    latencyMs: number;
    confidenceScore: number;
    timestamp: string;
  };
}

export interface GlobalStation {
  id: string;
  name: string;
  city: string;
  country: string;
  continent: string;
  lat: number;
  lon: number;
  sensorModel: string;
  sensorNetwork: string;
  currentAqi?: number;
  dominantPollutant?: string;
  pm2_5?: number;
  pm10?: number;
  no2?: number;
  o3?: number;
  so2?: number;
  co?: number;
  temperature?: number;
  status: 'Active Telemetry Node' | 'Active Ground Node' | 'Calibrating';
  lastUpdated?: string;
}

export interface AlertRule {
  id: string;
  userId: string;
  locationName: string;
  lat: number;
  lon: number;
  pollutant: 'AQI' | 'PM2.5' | 'PM10' | 'NO2' | 'O3' | 'SO2' | 'CO';
  operator: '>' | '>=' | '<';
  threshold: number;
  unit: string;
  severity: 'Critical' | 'Warning' | 'Advisory';
  notificationChannel: 'Push & Email' | 'SMS Direct' | 'Webhook' | 'Console';
  active: boolean;
  createdAt: string;
}

export interface ExceedanceEvent {
  id: string;
  alertRuleId?: string;
  locationName: string;
  stationId: string;
  pollutant: string;
  observedValue: number;
  threshold: number;
  unit: string;
  severity: 'Critical' | 'Warning' | 'Advisory';
  status: 'Active Exceedance' | 'Investigating' | 'Resolved';
  timestamp: string;
  details: string;
}

export interface SearchResult {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}
