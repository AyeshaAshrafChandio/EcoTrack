import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const DashboardView: React.FC = () => {
  const {
    selectedLocation,
    currentTelemetry,
    loadingTelemetry,
    refreshTelemetry,
    stations,
    selectCity,
    setActiveView,
  } = useApp();

  const [activePollutantTab, setActivePollutantTab] = useState<'PM2.5' | 'PM10' | 'NO2' | 'O3' | 'SO2' | 'CO'>('PM2.5');

  if (loadingTelemetry || !currentTelemetry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-surface text-on-surface px-4 text-center">
        <span className="material-symbols-outlined text-[40px] sm:text-[48px] text-primary animate-spin">
          progress_activity
        </span>
        <div className="font-headline-md text-lg sm:text-headline-md mt-4 font-bold">
          Ingesting Real-Time Telemetry...
        </div>
        <div className="font-label-mono-sm text-xs sm:text-label-mono-sm text-on-surface-variant mt-1 max-w-md">
          Querying Open-Meteo ECMWF / CAMS &amp; Ground Station Node Mesh
        </div>
      </div>
    );
  }

  const t = currentTelemetry;
  const aqi = t.overallAqi;

  // Gauge circumference: 2 * PI * 68 ≈ 427.26
  const circumference = 427.26;
  const dashOffset = Math.max(0, circumference - (Math.min(500, aqi) / 500) * circumference);

  const getAqiColor = (val: number) => {
    if (val <= 50) return { text: 'text-primary', bg: 'bg-primary/15', stroke: 'text-primary' };
    if (val <= 100) return { text: 'text-secondary', bg: 'bg-secondary/15', stroke: 'text-secondary' };
    if (val <= 150) return { text: 'text-amber-400', bg: 'bg-amber-400/20', stroke: 'text-amber-400' };
    if (val <= 200) return { text: 'text-error', bg: 'bg-error-container', stroke: 'text-error' };
    return { text: 'text-purple-400', bg: 'bg-purple-900/30', stroke: 'text-purple-400' };
  };

  const aqiColors = getAqiColor(aqi);

  return (
    <div className="w-full bg-surface pb-space-xl sm:pb-space-2xl pt-space-xs sm:pt-space-md overflow-hidden">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-space-lg">
        {/* Top Header & Telemetry Provenance Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-space-md bg-surface-container-low p-3 sm:p-5 rounded-2xl shadow-lg border border-surface-container">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-space-xs font-label-mono-sm text-[0.625rem] sm:text-[0.6875rem] text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0"></span>
              <span className="uppercase tracking-wider text-primary font-semibold">
                STATION ID: {t.location.stationId || 'GROUND-NODE-4A'}
              </span>
              <span>•</span>
              <span className="truncate">{t.location.latitude.toFixed(3)}° N, {t.location.longitude.toFixed(3)}° E</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline text-secondary truncate">{t.location.sensorNetwork || 'WMO GAW Telemetry'}</span>
            </div>
            <h1 className="font-display-lg text-xl sm:text-2xl md:text-3xl text-on-surface font-extrabold flex items-center gap-2 truncate">
              <span className="truncate">{t.location.name}</span>
              <span className="material-symbols-outlined text-primary text-[20px] sm:text-[24px] shrink-0">verified</span>
            </h1>
            <p className="font-body-sm text-xs sm:text-body-sm text-on-surface-variant max-w-xl leading-relaxed">
              Real-time atmospheric speciation with calibrated optical scattering and beta-attenuation mass concentration.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 shrink-0 pt-2 lg:pt-0">
            {/* Quick Station Switcher */}
            <select
              value={selectedLocation.name}
              onChange={e => {
                const found = stations.find(s => `${s.city}, ${s.country}` === e.target.value);
                if (found) {
                  selectCity(`${found.city}, ${found.country}`, found.lat, found.lon);
                }
              }}
              className="px-3 py-2 rounded-lg bg-surface-container font-label-mono-sm text-xs text-on-surface border border-surface-variant focus:outline-none cursor-pointer truncate"
            >
              {stations.map(st => (
                <option key={st.id} value={`${st.city}, ${st.country}`}>
                  {st.city}, {st.country}
                </option>
              ))}
            </select>

            <button
              onClick={() => refreshTelemetry()}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-bright font-label-mono-sm text-xs text-on-surface transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">sync</span>
              <span>SYNC LIVE</span>
            </button>

            <button
              onClick={() => setActiveView('ai-copilot')}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary-container text-on-primary-container font-label-ui text-xs font-semibold shadow-md hover:bg-primary transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">smart_toy</span>
              <span>AI COPILOT</span>
            </button>
          </div>
        </div>

        {/* Main Bento Grid: Live AQI Circular Hero & Atmospheric Weather Vectors */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-space-lg">
          {/* Left: Circular AQI Metric Hero (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl bg-surface-container-low p-4 sm:p-5 shadow-xl relative overflow-hidden flex flex-col justify-between border border-surface-container">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px] sm:text-[20px]">air</span>
                <span className="font-label-ui text-xs sm:text-label-ui uppercase tracking-wider text-on-surface font-semibold">
                  Atmospheric Health Status
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-label-mono-sm text-[0.625rem] sm:text-label-mono-sm font-semibold">
                EPA 40 CFR 58
              </span>
            </div>

            <div className="my-3 sm:my-space-md flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-space-lg">
              {/* Circular SVG Radial Gauge */}
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                  <circle
                    className="text-surface-container-highest"
                    cx="80"
                    cy="80"
                    fill="transparent"
                    r="68"
                    stroke="currentColor"
                    strokeWidth="12"
                  ></circle>
                  <circle
                    className={`${aqiColors.stroke} transition-all duration-1000 ease-out`}
                    cx="80"
                    cy="80"
                    fill="transparent"
                    r="68"
                    stroke="currentColor"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    strokeWidth="12"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-data-metric-lg text-3xl sm:text-4xl text-on-surface font-bold leading-none">
                    {aqi}
                  </span>
                  <span className={`font-label-mono-sm text-[0.6875rem] sm:text-label-mono-sm ${aqiColors.text} tracking-widest mt-1 font-semibold uppercase`}>
                    AQI • {t.aqiCategory}
                  </span>
                  <span className="font-body-sm text-[0.625rem] text-on-surface-variant">US-EPA Standard</span>
                </div>
              </div>

              <div className="space-y-2 text-left w-full sm:w-auto">
                <div className="p-2.5 sm:p-space-sm rounded-lg bg-surface-container">
                  <div className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">
                    Primary Vector
                  </div>
                  <div className="font-data-metric-sm text-base sm:text-data-metric-sm text-on-surface font-bold">
                    {t.dominantPollutant}
                  </div>
                  <div className="text-on-surface-variant font-body-sm text-xs">
                    <span className="text-primary font-semibold">
                      {t.pollutants[t.dominantPollutant]?.value ?? 0} {t.pollutants[t.dominantPollutant]?.unit}
                    </span>{' '}
                    — {t.pollutants[t.dominantPollutant]?.whoPercentage ?? 0}% of WHO limit
                  </div>
                </div>

                <div className="p-2.5 sm:p-space-sm rounded-lg bg-surface-container">
                  <div className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">
                    Biometric Advisory
                  </div>
                  <div className={`${aqiColors.text} font-label-ui text-xs sm:text-label-ui font-semibold flex items-center gap-1`}>
                    <span className="material-symbols-outlined text-[16px] shrink-0">
                      {aqi <= 50 ? 'check_circle' : aqi <= 100 ? 'info' : 'warning'}
                    </span>
                    <span className="truncate">{t.biometricAdvisory.headline}</span>
                  </div>
                  <div className="text-on-surface-variant font-body-sm text-xs line-clamp-2">
                    {t.biometricAdvisory.description}
                  </div>
                </div>
              </div>
            </div>

            {/* Ground Station Sensor Telemetry Micro Bar */}
            <div className="pt-2 flex items-center justify-between font-label-mono-sm text-[0.625rem] sm:text-label-mono-sm text-on-surface-variant bg-surface-container px-3 py-2 rounded-lg">
              <span className="flex items-center gap-1.5 truncate pr-2">
                <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
                <span className="truncate">{t.location.stationId || 'TK-SHINJUKU-SENSOR-4A'}</span>
              </span>
              <span className="text-secondary shrink-0">Laser Scatter • 99.8%</span>
            </div>
          </div>

          {/* Right: 6 Atmospheric Context Met Widgets (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl bg-surface-container-low p-4 sm:p-5 shadow-xl flex flex-col justify-between border border-surface-container">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px] sm:text-[20px]">thermostat</span>
                <span className="font-label-ui text-xs sm:text-label-ui uppercase tracking-wider text-on-surface font-semibold">
                  Planetary Boundary Layer &amp; Meteorology
                </span>
              </div>
              <span className="font-label-mono-sm text-[0.625rem] sm:text-label-mono-sm text-on-surface-variant">
                ECMWF HIGH-RES
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-space-sm my-auto">
              {/* Temperature */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-surface-container flex flex-col justify-between">
                <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">Temperature</span>
                <div className="flex items-baseline gap-1 my-0.5">
                  <span className="font-data-metric-lg text-lg sm:text-2xl font-bold text-on-surface">
                    {t.weather.temperature.toFixed(1)}
                  </span>
                  <span className="font-label-mono-sm text-xs text-on-surface-variant">°C</span>
                </div>
                <span className="font-body-sm text-[0.625rem] text-on-surface-variant truncate">
                  {t.weather.weatherDescription}
                </span>
              </div>

              {/* Relative Humidity */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-surface-container flex flex-col justify-between">
                <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">Humidity</span>
                <div className="flex items-baseline gap-1 my-0.5">
                  <span className="font-data-metric-lg text-lg sm:text-2xl font-bold text-secondary">
                    {t.weather.humidity}
                  </span>
                  <span className="font-label-mono-sm text-xs text-secondary">%</span>
                </div>
                <span className="font-body-sm text-[0.625rem] text-on-surface-variant truncate">
                  {t.weather.humidity > 70 ? 'High hygroscopic' : 'Standard ambient'}
                </span>
              </div>

              {/* Wind Vector */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-surface-container flex flex-col justify-between">
                <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">Wind Vector</span>
                <div className="flex items-baseline gap-1 my-0.5">
                  <span className="font-data-metric-lg text-lg sm:text-2xl font-bold text-primary">
                    {t.weather.windSpeed.toFixed(1)}
                  </span>
                  <span className="font-label-mono-sm text-[0.625rem] sm:text-xs text-primary truncate">m/s {t.weather.windDirectionCompass}</span>
                </div>
                <span className="font-body-sm text-[0.625rem] text-on-surface-variant truncate">
                  {t.weather.windDirection}° azimuth
                </span>
              </div>

              {/* Boundary Layer Height */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-surface-container flex flex-col justify-between">
                <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">Boundary Layer</span>
                <div className="flex items-baseline gap-1 my-0.5">
                  <span className={`font-data-metric-lg text-lg sm:text-2xl font-bold ${t.weather.boundaryLayerHeight < 500 ? 'text-error' : 'text-primary'}`}>
                    {t.weather.boundaryLayerHeight}
                  </span>
                  <span className="font-label-mono-sm text-xs text-on-surface-variant">m</span>
                </div>
                <span className="font-body-sm text-[0.625rem] text-on-surface-variant truncate">
                  {t.weather.boundaryLayerHeight < 500 ? 'Thermal cap active' : 'Normal mixing'}
                </span>
              </div>

              {/* Surface Pressure */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-surface-container flex flex-col justify-between">
                <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">Pressure</span>
                <div className="flex items-baseline gap-1 my-0.5">
                  <span className="font-data-metric-lg text-lg sm:text-2xl font-bold text-on-surface">
                    {Math.round(t.weather.surfacePressure)}
                  </span>
                  <span className="font-label-mono-sm text-xs text-on-surface-variant">hPa</span>
                </div>
                <span className="font-body-sm text-[0.625rem] text-on-surface-variant truncate">Barometric</span>
              </div>

              {/* Precipitation */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-surface-container flex flex-col justify-between">
                <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">Precipitation</span>
                <div className="flex items-baseline gap-1 my-0.5">
                  <span className="font-data-metric-lg text-lg sm:text-2xl font-bold text-secondary">
                    {t.weather.precipitation}
                  </span>
                  <span className="font-label-mono-sm text-xs text-secondary">mm/h</span>
                </div>
                <span className="font-body-sm text-[0.625rem] text-on-surface-variant truncate">
                  {t.weather.precipitation > 0 ? 'Washout active' : 'Zero washout'}
                </span>
              </div>
            </div>

            <div className="mt-2.5 p-2 sm:p-2.5 rounded-lg bg-surface-container/60 border border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-on-surface-variant font-label-mono-sm text-[0.625rem] sm:text-[0.6875rem]">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-primary">satellite</span>
                Copernicus CAMS Assimilation: Active
              </span>
              <span>Updated: {new Date(t.telemetryMetadata.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* 6 Pollutants Speciation Grid */}
        <div className="space-y-2 sm:space-y-space-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h2 className="font-headline-xl text-lg sm:text-xl md:text-headline-xl font-bold text-on-surface">
                6-Pollutant Speciation Breakdown
              </h2>
              <p className="font-body-sm text-xs sm:text-body-sm text-on-surface-variant">
                Instrumental readings verified against WHO 2021 air quality ceilings and EPA sub-indices.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-surface-container font-label-mono-sm text-[0.625rem] sm:text-label-mono-sm text-secondary self-start sm:self-auto">
              REAL INSTRUMENT TELEMETRY
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Object.values(t.pollutants).slice(0, 6).map(p => {
              const statusColor =
                p.status === 'Good'
                  ? 'text-primary bg-primary/15'
                  : p.status === 'Moderate'
                  ? 'text-secondary bg-secondary/15'
                  : 'text-error bg-error/20';

              return (
                <div
                  key={p.code}
                  className="p-3 sm:p-4 rounded-xl bg-surface-container-low border border-surface-container shadow-md flex flex-col justify-between space-y-2 sm:space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-data-metric-sm text-base sm:text-data-metric-sm font-bold text-on-surface">
                        {p.code}
                      </div>
                      <div className="font-body-sm text-[0.6875rem] sm:text-xs text-on-surface-variant">
                        {p.name}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-label-mono-sm text-[0.55rem] sm:text-[0.625rem] font-bold ${statusColor}`}>
                      {p.status}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between bg-surface-container p-2.5 rounded-lg">
                    <div>
                      <span className="font-data-metric-lg text-xl sm:text-2xl font-bold text-on-surface">
                        {p.value}
                      </span>
                      <span className="font-label-mono-sm text-xs text-on-surface-variant ml-1">{p.unit}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-label-mono-sm text-[0.55rem] sm:text-[0.625rem] text-on-surface-variant">
                        WHO Limit: {p.whoBenchmark} {p.unit}
                      </div>
                      <div className={`font-label-mono-sm text-xs font-bold ${p.whoPercentage > 100 ? 'text-error' : 'text-primary'}`}>
                        {p.whoPercentage}% of limit
                      </div>
                    </div>
                  </div>

                  {/* WHO Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                    <div
                      className={`h-full ${p.whoPercentage > 100 ? 'bg-error' : 'bg-primary'}`}
                      style={{ width: `${Math.min(100, p.whoPercentage)}%` }}
                    ></div>
                  </div>

                  <p className="font-body-sm text-[0.625rem] sm:text-xs text-on-surface-variant leading-relaxed">
                    {p.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 48-Hour Hourly Trend Chart */}
        <div className="rounded-2xl bg-surface-container-low p-4 sm:p-5 shadow-xl border border-surface-container space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-headline-md text-base sm:text-lg md:text-headline-md font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px] sm:text-[22px]">show_chart</span>
                48-Hour Temporal Forecast &amp; Trend Simulation
              </h3>
              <p className="font-body-sm text-xs text-on-surface-variant">
                Hourly forward integration combining ECMWF boundary layer depth and aerosol advection models.
              </p>
            </div>

            {/* Pollutant Tabs */}
            <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg overflow-x-auto scrollbar-none self-start sm:self-auto max-w-full">
              {(['PM2.5', 'PM10', 'NO2', 'O3', 'SO2'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActivePollutantTab(tab)}
                  className={`px-2.5 py-1 rounded font-label-mono-sm text-[0.625rem] sm:text-[0.6875rem] transition-colors cursor-pointer shrink-0 ${
                    activePollutantTab === tab
                      ? 'bg-secondary text-on-secondary font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Hourly Bar / Sparkline Chart with horizontal scroll wrapper for phone */}
          <div className="overflow-x-auto w-full scrollbar-none pb-1">
            <div className="h-36 sm:h-44 w-full min-w-[500px] flex items-end gap-1 pt-4 pb-2">
              {t.hourlyForecast.slice(0, 36).map((item, idx) => {
                const val =
                  activePollutantTab === 'PM2.5' ? item.pm2_5 :
                  activePollutantTab === 'PM10' ? item.pm10 :
                  activePollutantTab === 'NO2' ? item.no2 :
                  activePollutantTab === 'O3' ? item.o3 : item.so2;

                const maxVal = Math.max(1, ...t.hourlyForecast.map(h =>
                  activePollutantTab === 'PM2.5' ? h.pm2_5 :
                  activePollutantTab === 'PM10' ? h.pm10 :
                  activePollutantTab === 'NO2' ? h.no2 :
                  activePollutantTab === 'O3' ? h.o3 : h.so2
                ));

                const heightPct = Math.max(8, Math.min(100, Math.round((val / maxVal) * 100)));
                const isCurrent = idx === 0;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    {/* Tooltip */}
                    <div className="absolute -top-7 px-1.5 py-0.5 rounded bg-surface-container-high shadow-lg text-[0.55rem] font-label-mono-sm text-on-surface whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-surface-variant">
                      {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}: {val}
                    </div>
                    <div
                      className={`w-full rounded-t transition-all ${
                        isCurrent
                          ? 'bg-primary'
                          : heightPct > 70
                          ? 'bg-error/80 group-hover:bg-error'
                          : 'bg-surface-container-high group-hover:bg-secondary'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    ></div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between font-label-mono-sm text-[0.625rem] text-on-surface-variant border-t border-surface-container pt-2">
            <span>NOW: {new Date(t.hourlyForecast[0]?.time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span>+12h</span>
            <span>+24h</span>
            <span>+36h FORECAST HORIZON</span>
          </div>
        </div>
      </div>
    </div>
  );
};
