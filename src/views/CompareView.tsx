import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { EnvironmentalTelemetry } from '../types';

export const CompareView: React.FC = () => {
  const { stations, setActiveView, selectCity } = useApp();

  const [compareLocations, setCompareLocations] = useState<Array<{ name: string; lat: number; lon: number }>>([
    { name: 'Tokyo, Japan', lat: 35.6895, lon: 139.6917 },
    { name: 'London, United Kingdom', lat: 51.5074, lon: -0.1278 },
    { name: 'Delhi NCR, India', lat: 28.6139, lon: 77.209 },
  ]);

  const [telemetryList, setTelemetryList] = useState<EnvironmentalTelemetry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchComparisonData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      // Fetch each location independently with error handling so a single failed endpoint does not abort all results
      const results = await Promise.all(
        compareLocations.map(async loc => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);
            const res = await fetch(
              `/api/environment/live?lat=${loc.lat}&lon=${loc.lon}&city=${encodeURIComponent(loc.name)}`,
              { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            if (!res.ok) {
              const errJson = await res.json().catch(() => ({}));
              throw new Error(errJson.error || `HTTP ${res.status}`);
            }
            return (await res.json()) as EnvironmentalTelemetry;
          } catch (err: any) {
            console.warn(`Error fetching live telemetry for ${loc.name}:`, err);
            // Return null for this location so other locations still load
            return null;
          }
        })
      );

      const validResults = results.filter((r): r is EnvironmentalTelemetry => r !== null);
      if (validResults.length === 0) {
        throw new Error('Telemetry feeds currently unavailable for the selected locations. Please check connection and retry.');
      }
      setTelemetryList(validResults);
    } catch (err: any) {
      console.error('Error fetching comparison:', err);
      setFetchError(err.message || 'Failed to retrieve comparative telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisonData();
  }, [compareLocations]);

  const maxAqi = telemetryList.length > 0 ? Math.max(...telemetryList.map(t => t.overallAqi)) : 0;
  const minAqi = telemetryList.length > 0 ? Math.min(...telemetryList.map(t => t.overallAqi)) : 0;
  const aqiVariance = maxAqi - minAqi;

  const handleSelectCityForIndex = (index: number, newCityName: string) => {
    const found = stations.find(s => `${s.city}, ${s.country}` === newCityName);
    if (!found) return;

    setCompareLocations(prev => {
      const copy = [...prev];
      copy[index] = { name: `${found.city}, ${found.country}`, lat: found.lat, lon: found.lon };
      return copy;
    });
  };

  return (
    <div className="w-full bg-surface pb-space-xl sm:pb-space-2xl pt-space-xs sm:pt-space-md min-h-full">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-space-lg">
        {/* Header & Continental Variance Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low p-3 sm:p-5 rounded-2xl border border-surface-container shadow-md">
          <div>
            <div className="flex items-center gap-1.5 font-label-mono-sm text-[0.625rem] sm:text-[0.6875rem] text-primary">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span>TRI-CONTINENTAL METEOROLOGICAL DISPERSION MATRIX</span>
            </div>
            <h1 className="font-headline-xl text-xl sm:text-2xl md:text-headline-xl font-extrabold text-on-surface">
              Cross-Continental Location Comparison
            </h1>
            <p className="font-body-sm text-xs sm:text-body-sm text-on-surface-variant max-w-2xl">
              Simultaneous multispectral observation across major world urban basins, contrasting atmospheric boundary layer trapping against regional dispersion.
            </p>
          </div>

          <button
            onClick={() => fetchComparisonData()}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-bright font-label-mono-sm text-xs text-on-surface transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">sync</span>
            <span>RE-SYNC MATRIX</span>
          </button>
        </div>

        {/* Global Variance Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 rounded-xl bg-surface-container-low/70 p-3 sm:p-4 border border-surface-container">
          <div className="flex flex-col gap-0.5 p-2 sm:p-2.5">
            <span className="font-label-mono-sm text-[0.625rem] sm:text-label-mono-sm text-on-surface-variant uppercase tracking-wider">
              Maximum AQI Variance
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-data-metric-lg text-xl sm:text-2xl font-bold text-secondary">
                {aqiVariance}
              </span>
              <span className="font-label-mono-sm text-xs text-secondary">AQI spread</span>
            </div>
            <span className="font-body-sm text-[0.6875rem] text-on-surface-variant">
              Differential across monitored continental air basins
            </span>
          </div>

          <div className="flex flex-col gap-0.5 p-2 sm:p-2.5">
            <span className="font-label-mono-sm text-[0.625rem] sm:text-label-mono-sm text-on-surface-variant uppercase tracking-wider">
              Stagnation / Inversion Risk
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-data-metric-lg text-xl sm:text-2xl font-bold text-error">
                {telemetryList.some(t => t.weather.boundaryLayerHeight < 500) ? 'ACTIVE' : 'LOW'}
              </span>
              <span className="font-label-mono-sm text-xs text-error truncate">
                {telemetryList.find(t => t.weather.boundaryLayerHeight < 500)?.location.name || 'Normal Trapping'}
              </span>
            </div>
            <span className="font-body-sm text-[0.6875rem] text-on-surface-variant">
              Severe planetary boundary layer compression
            </span>
          </div>

          <div className="flex flex-col gap-0.5 p-2 sm:p-2.5">
            <span className="font-label-mono-sm text-[0.625rem] sm:text-label-mono-sm text-on-surface-variant uppercase tracking-wider">
              Atmospheric Ceiling Variance
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-data-metric-lg text-xl sm:text-2xl font-bold text-primary">
                {telemetryList.length > 0 ? `${Math.min(...telemetryList.map(t => t.weather.boundaryLayerHeight))}m - ${Math.max(...telemetryList.map(t => t.weather.boundaryLayerHeight))}m` : 'N/A'}
              </span>
            </div>
            <span className="font-body-sm text-[0.6875rem] text-on-surface-variant">
              Copernicus CAMS &amp; ECMWF planetary boundary range
            </span>
          </div>
        </div>

        {/* 3-City Comparative Grid */}
        {loading ? (
          <div className="p-8 sm:p-12 text-center text-on-surface-variant font-body-md flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-primary animate-spin">
              progress_activity
            </span>
            <span>Fetching cross-continental telemetry...</span>
          </div>
        ) : fetchError && telemetryList.length === 0 ? (
          <div className="p-6 sm:p-8 rounded-2xl bg-surface-container-low border border-error/30 text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-error/10 text-error">
              <span className="material-symbols-outlined text-[28px]">signal_cellular_connected_no_internet_4_bar</span>
            </div>
            <div className="font-headline-md text-base sm:text-lg font-bold text-on-surface">
              Telemetry Synchronization Notice
            </div>
            <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto">
              {fetchError}
            </p>
            <button
              onClick={() => fetchComparisonData()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-ui text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Retry Telemetry Uplink</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {telemetryList.map((tel, idx) => {
              const aqi = tel.overallAqi;
              const aqiColor =
                aqi <= 50
                  ? 'text-primary bg-primary/15'
                  : aqi <= 100
                  ? 'text-secondary bg-secondary/15'
                  : 'text-error bg-error/20';

              return (
                <div
                  key={idx}
                  className="flex flex-col rounded-2xl bg-surface-container-low shadow-md overflow-hidden border border-surface-container justify-between"
                >
                  <div className="p-4 sm:p-5 flex flex-col gap-3 sm:gap-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col min-w-0 flex-1">
                        <select
                          value={`${tel.location.name}`}
                          onChange={e => handleSelectCityForIndex(idx, e.target.value)}
                          className="bg-transparent font-headline-md text-base sm:text-lg font-bold text-on-surface focus:outline-none cursor-pointer border-b border-surface-variant pb-1 w-full truncate"
                        >
                          <option value={tel.location.name}>{tel.location.name}</option>
                          {stations.map(st => (
                            <option key={st.id} value={`${st.city}, ${st.country}`} className="bg-surface-container text-on-surface">
                              {st.city}, {st.country}
                            </option>
                          ))}
                        </select>
                        <span className="font-label-mono-sm text-[0.625rem] text-secondary uppercase mt-1 truncate">
                          STATION: {tel.location.stationId || 'GROUND-NODE'}
                        </span>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full font-label-mono-sm text-xs font-bold shadow-sm ${aqiColor}`}>
                          {aqi} AQI
                        </span>
                        <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase mt-1">
                          {tel.aqiCategory}
                        </span>
                      </div>
                    </div>

                    {/* Meteorological Bar */}
                    <div className="p-2 sm:p-2.5 rounded-xl bg-surface-container grid grid-cols-3 gap-1.5 text-center font-label-mono-sm text-[0.625rem] sm:text-xs">
                      <div>
                        <div className="text-on-surface-variant">TEMP</div>
                        <div className="font-bold text-on-surface">{tel.weather.temperature.toFixed(1)}°C</div>
                      </div>
                      <div>
                        <div className="text-on-surface-variant">INVERSION</div>
                        <div className={`font-bold ${tel.weather.boundaryLayerHeight < 500 ? 'text-error' : 'text-primary'}`}>
                          {tel.weather.boundaryLayerHeight}m
                        </div>
                      </div>
                      <div>
                        <div className="text-on-surface-variant">WIND</div>
                        <div className="font-bold text-on-surface">{tel.weather.windSpeed.toFixed(1)} m/s</div>
                      </div>
                    </div>

                    {/* Speciation Bars */}
                    <div className="space-y-1.5">
                      <div className="font-label-mono-sm text-[0.625rem] text-outline uppercase font-semibold">
                        Pollutant Speciation vs WHO 2021 Benchmark
                      </div>
                      {(['PM2.5', 'PM10', 'NO2', 'O3'] as const).map(pCode => {
                        const p = tel.pollutants[pCode];
                        if (!p) return null;
                        return (
                          <div key={pCode} className="space-y-0.5">
                            <div className="flex justify-between font-label-mono-sm text-xs">
                              <span className="text-on-surface">{pCode}</span>
                              <span className="text-on-surface-variant text-[0.6875rem]">
                                <strong>{p.value}</strong> {p.unit} ({p.whoPercentage}%)
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                              <div
                                className={`h-full ${p.whoPercentage > 100 ? 'bg-error' : 'bg-primary'}`}
                                style={{ width: `${Math.min(100, p.whoPercentage)}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Biometric Health Advisory */}
                    <div className="p-2.5 sm:p-3 rounded-lg bg-surface-container text-left space-y-0.5">
                      <div className="font-label-ui text-xs font-semibold text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] shrink-0">health_and_safety</span>
                        <span className="truncate">{tel.biometricAdvisory.headline}</span>
                      </div>
                      <div className="font-body-sm text-[0.6875rem] text-on-surface-variant line-clamp-2">
                        {tel.biometricAdvisory.description}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 border-t border-surface-container bg-surface-container-lowest">
                    <button
                      onClick={() => {
                        selectCity(tel.location.name, tel.location.latitude, tel.location.longitude);
                        setActiveView('dashboard');
                      }}
                      className="w-full py-2 rounded-lg bg-surface-container hover:bg-surface-bright font-label-ui text-xs font-semibold text-primary transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      <span>Inspect Telemetry Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Side-by-side Comparative Matrix Table */}
        {telemetryList.length > 0 && (
          <div className="rounded-2xl bg-surface-container-low border border-surface-container shadow-xl p-3 sm:p-5 overflow-hidden">
            <h3 className="font-headline-md text-base sm:text-headline-md font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">table_chart</span>
              Harmonized Analytical Parameter Matrix
            </h3>
            <div className="overflow-x-auto w-full scrollbar-none pb-1">
              <table className="w-full text-left font-body-sm border-collapse min-w-[550px]">
              <thead>
                <tr className="border-b border-surface-container font-label-mono-sm text-[0.625rem] sm:text-[0.6875rem] text-outline uppercase">
                  <th className="py-2 px-2.5">Atmospheric Metric</th>
                  {telemetryList.map((tel, idx) => (
                    <th key={idx} className="py-2 px-2.5 truncate max-w-[150px]">{tel.location.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container font-label-mono-sm text-xs">
                <tr>
                  <td className="py-2 px-2.5 text-on-surface-variant">US-EPA AQI</td>
                  {telemetryList.map((t, idx) => (
                    <td key={idx} className="py-2 px-2.5 font-bold text-on-surface">
                      {t.overallAqi} ({t.aqiCategory})
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-2.5 text-on-surface-variant">Primary Vector</td>
                  {telemetryList.map((t, idx) => (
                    <td key={idx} className="py-2 px-2.5 font-semibold text-primary">{t.dominantPollutant}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-2.5 text-on-surface-variant">PM2.5 (Fine)</td>
                  {telemetryList.map((t, idx) => (
                    <td key={idx} className="py-2 px-2.5">{t.pollutants['PM2.5']?.value} µg/m³</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-2.5 text-on-surface-variant">PM10 (Coarse)</td>
                  {telemetryList.map((t, idx) => (
                    <td key={idx} className="py-2 px-2.5">{t.pollutants['PM10']?.value} µg/m³</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-2.5 text-on-surface-variant">NO2 (Nitrogen)</td>
                  {telemetryList.map((t, idx) => (
                    <td key={idx} className="py-2 px-2.5">{t.pollutants['NO2']?.value} µg/m³</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-2.5 text-on-surface-variant">O3 (Ozone)</td>
                  {telemetryList.map((t, idx) => (
                    <td key={idx} className="py-2 px-2.5">{t.pollutants['O3']?.value} µg/m³</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-2.5 text-on-surface-variant">Boundary Layer Depth</td>
                  {telemetryList.map((t, idx) => (
                    <td key={idx} className="py-2 px-2.5 font-semibold text-secondary">
                      {t.weather.boundaryLayerHeight} m
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-2.5 text-on-surface-variant">Wind Vector</td>
                  {telemetryList.map((t, idx) => (
                    <td key={idx} className="py-2 px-2.5">
                      {t.weather.windSpeed.toFixed(1)} m/s ({t.weather.windDirectionCompass})
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cross-Continental Scientific Coverage Disclosure */}
          <div className="p-3.5 rounded-xl bg-surface-container/60 border border-surface-container flex items-start gap-2.5 text-on-surface-variant font-body-sm text-xs">
            <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">info</span>
            <div>
              <span className="text-on-surface font-semibold">Cross-Continental Telemetry Coverage Disclosure: </span>
              Atmospheric readings represent continuous numerical forecast model assimilation from the Copernicus Atmosphere Monitoring Service (CAMS 0.1° global grid) and ECMWF Integrated Forecasting System. Regional topographical complexities, local valley inversions, and ground-level industrial microclimates may exhibit microscale variances between grid-cell averages and physical in-situ sensors.
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
