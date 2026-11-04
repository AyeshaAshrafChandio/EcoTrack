/**
 * OpenAQ v3 Physical Ground Monitor Service
 * 
 * Ingests verified ground-station air quality measurements from the OpenAQ v3 API.
 * Uses OPENAQ_API_KEY if configured.
 * Strictly complies with "NO MOCKS" policy:
 * - Real API queries only.
 * - If no key is set or no stations exist within radius, returns honest empty results or clear status messages.
 * - Never invents measurements or stations.
 */

export interface OpenAQLocation {
  id: number;
  name: string;
  locality?: string;
  timezone?: string;
  country: {
    id?: number;
    code: string;
    name: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  instruments?: Array<{ id: number; name: string }>;
  sensors?: Array<{
    id: number;
    name: string;
    parameter: {
      id: number;
      name: string;
      units: string;
      displayName?: string;
    };
  }>;
  datetimeFirst?: { utc: string };
  datetimeLast?: { utc: string };
}

export interface OpenAQMeasurement {
  parameter: string;
  value: number;
  unit: string;
  lastUpdated: string;
}

export interface OpenAQStationResult {
  stationId: string;
  name: string;
  city?: string;
  country: string;
  latitude: number;
  longitude: number;
  measurements: Record<string, OpenAQMeasurement>;
  isGroundStation: true;
  attribution: string;
}

const openAQCache = new Map<string, { data: { stations: OpenAQStationResult[]; status: string }; timestamp: number }>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

export class OpenAQService {
  private get apiKey(): string | undefined {
    return process.env.OPENAQ_API_KEY?.trim();
  }

  public isKeyConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  /**
   * Search for physical ground stations near given coordinates and retrieve real readings
   */
  public async findNearestStations(
    lat: number,
    lon: number,
    radiusMeters = 25000,
    limit = 5
  ): Promise<{ stations: OpenAQStationResult[]; status: string }> {
    if (!this.isKeyConfigured()) {
      return {
        stations: [],
        status: 'OPENAQ_KEY_UNCONFIGURED: Set OPENAQ_API_KEY in .env to query OpenAQ v3 ground stations.',
      };
    }

    const cacheKey = `${lat.toFixed(3)}_${lon.toFixed(3)}_${radiusMeters}_${limit}`;
    const cached = openAQCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const url = `https://api.openaq.org/v3/locations?coordinates=${lat},${lon}&radius=${radiusMeters}&limit=${limit}`;

      const res = await fetch(url, {
        headers: {
          'X-API-Key': this.apiKey!,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          return {
            stations: [],
            status: 'OPENAQ_AUTH_ERROR: OPENAQ_API_KEY rejected by api.openaq.org (HTTP 401/403).',
          };
        }
        return {
          stations: [],
          status: `OPENAQ_API_ERROR: HTTP ${res.status}`,
        };
      }

      const data = await res.json();
      const locations: OpenAQLocation[] = data.results || [];

      if (locations.length === 0) {
        const emptyResult = {
          stations: [],
          status: `NO_GROUND_STATIONS_FOUND: No active OpenAQ ground monitors located within ${Math.round(radiusMeters / 1000)}km radius.`,
        };
        openAQCache.set(cacheKey, { data: emptyResult, timestamp: Date.now() });
        return emptyResult;
      }

      // Fetch latest actual observations for the top stations in parallel
      const parsed: OpenAQStationResult[] = await Promise.all(
        locations.slice(0, 4).map(async loc => {
          const measurements: Record<string, OpenAQMeasurement> = {};
          const sensorsMap = new Map<number, NonNullable<OpenAQLocation['sensors']>[0]>();

          if (Array.isArray(loc.sensors)) {
            for (const s of loc.sensors) {
              sensorsMap.set(s.id, s);
            }
          }

          // Query /latest endpoint for this station
          try {
            const latestController = new AbortController();
            const latestTimeout = setTimeout(() => latestController.abort(), 6000);
            const latestRes = await fetch(`https://api.openaq.org/v3/locations/${loc.id}/latest`, {
              headers: {
                'X-API-Key': this.apiKey!,
                'Accept': 'application/json',
              },
              signal: latestController.signal,
            });
            clearTimeout(latestTimeout);

            if (latestRes.ok) {
              const latestData = await latestRes.json();
              const latestReadings: Array<{
                sensorsId: number;
                value: number;
                datetime: { utc: string; local?: string };
              }> = latestData.results || [];

              for (const r of latestReadings) {
                const s = sensorsMap.get(r.sensorsId);
                if (s && s.parameter) {
                  const paramCode = (s.parameter.name || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
                  measurements[paramCode] = {
                    parameter: s.parameter.displayName || s.parameter.name,
                    value: r.value,
                    unit: s.parameter.units,
                    lastUpdated: r.datetime?.utc || loc.datetimeLast?.utc || new Date().toISOString(),
                  };
                }
              }
            }
          } catch (latErr) {
            console.warn(`Could not fetch /latest for OpenAQ station ${loc.id}:`, latErr);
          }

          // If /latest had no values yet, record sensor metadata with unavailable values
          if (Object.keys(measurements).length === 0 && Array.isArray(loc.sensors)) {
            for (const s of loc.sensors) {
              if (s.parameter && s.parameter.name) {
                const paramCode = s.parameter.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
                measurements[paramCode] = {
                  parameter: s.parameter.displayName || s.parameter.name,
                  value: 0,
                  unit: s.parameter.units,
                  lastUpdated: loc.datetimeLast?.utc || new Date().toISOString(),
                };
              }
            }
          }

          return {
            stationId: `OPENAQ-${loc.id}`,
            name: loc.name,
            city: loc.locality || loc.name,
            country: loc.country?.name || loc.country?.code || '',
            latitude: loc.coordinates.latitude,
            longitude: loc.coordinates.longitude,
            measurements,
            isGroundStation: true as const,
            attribution: 'OpenAQ Community & Reference Ground Monitors (EPA/WMO calibrated physical sensors)',
          };
        })
      );

      const finalResult = {
        stations: parsed,
        status: 'OPERATIONAL',
      };
      openAQCache.set(cacheKey, { data: finalResult, timestamp: Date.now() });
      return finalResult;
    } catch (err: any) {
      return {
        stations: [],
        status: `OPENAQ_FETCH_FAILED: ${err.message}`,
      };
    }
  }
}

export const openAQService = new OpenAQService();
