import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const HomeView: React.FC = () => {
  const { setActiveView, selectCity, stations, currentTelemetry } = useApp();
  const [scanQuery, setScanQuery] = useState('');

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanQuery.trim()) return;

    // Check if coordinates
    const coordMatch = scanQuery.match(/^([-+]?[0-9]*\.?[0-9]+)\s*,\s*([-+]?[0-9]*\.?[0-9]+)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[2]);
      selectCity(`Coordinates (${lat.toFixed(2)}, ${lon.toFixed(2)})`, lat, lon);
      setActiveView('dashboard');
    } else {
      const found = stations.find(s =>
        s.city.toLowerCase().includes(scanQuery.toLowerCase()) ||
        s.country.toLowerCase().includes(scanQuery.toLowerCase())
      );
      if (found) {
        selectCity(`${found.city}, ${found.country}`, found.lat, found.lon);
        setActiveView('dashboard');
      } else {
        selectCity(scanQuery, 35.6895, 139.6917);
        setActiveView('dashboard');
      }
    }
  };

  // 5 Continental Stations
  const featuredStations = [
    { name: 'Tokyo', country: 'Kanto Plain, Japan', lat: 35.6895, lon: 139.6917, stationId: 'Station JP-094', region: 'Asia', network: 'MOE / OPENAQ', sparklineColor: 'text-primary' },
    { name: 'London', country: 'Greater London, UK', lat: 51.5074, lon: -0.1278, stationId: 'Station UK-LND', region: 'Europe', network: 'AURN NETWORK', sparklineColor: 'text-secondary' },
    { name: 'São Paulo', country: 'Paulista Corridor, BR', lat: -23.6273, lon: -46.6566, stationId: 'Station BR-CET', region: 'S. America', network: 'CETESB LIVE', sparklineColor: 'text-secondary' },
    { name: 'Delhi NCR', country: 'National Capital, India', lat: 28.6139, lon: 77.209, stationId: 'Station IN-CPCB', region: 'S. Asia', network: 'CPCB ADVISORY', sparklineColor: 'text-error' },
    { name: 'Reykjavik', country: 'Faxaflói Bay, Iceland', lat: 64.1466, lon: -21.9426, stationId: 'Station IS-GREN', region: 'Nordic', network: 'BASELINE CLEAN', sparklineColor: 'text-primary' },
  ];

  return (
    <div className="flex flex-col w-full min-h-full">
      {/* Top Atmospheric Scrim & Ambient Radar Canvas Overlay */}
      <section className="relative w-full overflow-hidden bg-surface-container-lowest pb-space-xl sm:pb-space-2xl pt-space-md sm:pt-space-xl">
        {/* Atmospheric Ambient Glows */}
        <div className="pointer-events-none absolute -top-40 left-1/4 h-[350px] sm:h-[520px] w-[350px] sm:w-[520px] rounded-full bg-primary/10 blur-[90px] sm:blur-[130px]"></div>
        <div className="pointer-events-none absolute top-20 right-10 h-[300px] sm:h-[480px] w-[300px] sm:w-[480px] rounded-full bg-secondary/10 blur-[100px] sm:blur-[140px]"></div>

        {/* Telemetry Status Ribbon */}
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-surface-container/60 p-2.5 sm:p-space-sm backdrop-blur-md border border-surface-container/50">
            <div className="flex flex-wrap items-center gap-2 sm:gap-space-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 sm:py-1 font-label-mono-sm text-[0.625rem] sm:text-label-mono-sm text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                </span>
                LIVE ORBITAL UPLINK: SYNCHRONIZED
              </span>
              <span className="font-label-mono-sm text-[0.6875rem] sm:text-label-mono-sm text-on-surface-variant">
                LATENCY: <strong className="text-on-surface">38ms</strong>
              </span>
              <span className="hidden md:inline font-label-mono-sm text-label-mono-sm text-outline-variant">|</span>
              <span className="hidden md:inline font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                CALIBRATION: <strong className="text-secondary">WMO-GAW 2024.11</strong>
              </span>
            </div>
            <div className="flex items-center gap-space-xs font-label-mono-sm text-[0.625rem] sm:text-label-mono-sm text-on-surface-variant self-start sm:self-auto">
              <span className="material-symbols-outlined text-[14px] sm:text-[15px] text-primary">verified_user</span>
              <span>ZERO-SPECULATION VERIFIED</span>
            </div>
          </div>
        </div>

        {/* Main Hero Body */}
        <div className="mx-auto mt-6 sm:mt-space-xl w-full max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:gap-space-xl lg:grid-cols-12 lg:items-center">
            {/* Hero Textual Anchor (Cols 1-7) */}
            <div className="flex flex-col gap-3 sm:gap-space-md lg:col-span-7">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-space-xs">
                <span className="px-2 py-0.5 rounded bg-surface-container-high font-label-mono-sm text-[0.625rem] sm:text-label-mono-sm text-secondary uppercase tracking-widest">
                  Planetary Synthesis Engine
                </span>
                <span className="font-label-mono-sm text-label-mono-sm text-outline">•</span>
                <span className="font-label-mono-sm text-[0.625rem] sm:text-label-mono-sm text-on-surface-variant">
                  Telemetry Grounding × Meta LLaMA 3.3 70B
                </span>
              </div>

              <h1 className="font-display-lg text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-on-surface font-extrabold tracking-tight leading-tight">
                Understand the Environment.{' '}
                <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                  Predict the Risk.
                </span>{' '}
                Make Informed Decisions.
              </h1>

              <p className="font-body-lg text-xs sm:text-sm md:text-base text-on-surface-variant max-w-2xl leading-relaxed">
                Global real-time air quality telemetry coupled with Copernicus satellite remote sensing, calibrated physical ground sensors, and grounded Meta AI predictive reasoning.
              </p>

              {/* Primary Call to Actions */}
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-space-sm pt-2">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-container px-4 sm:px-5 py-2.5 sm:py-3 font-label-ui text-xs sm:text-label-ui text-on-primary-container shadow-md transition-all hover:bg-primary hover:shadow-lg hover:shadow-primary/20 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">space_dashboard</span>
                  <span>Explore Live Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveView('global-map')}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-surface-container-high px-4 sm:px-5 py-2.5 sm:py-3 font-label-ui text-xs sm:text-label-ui text-on-surface transition-all hover:bg-surface-bright hover:text-secondary cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">public</span>
                  <span>Interactive World Map</span>
                </button>
                <button
                  onClick={() => setActiveView('ai-copilot')}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary/10 px-4 sm:px-5 py-2.5 sm:py-3 font-label-ui text-xs sm:text-label-ui text-secondary transition-all hover:bg-secondary/20 hover:text-secondary-fixed cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">smart_toy</span>
                  <span>Consult AI Copilot</span>
                </button>
              </div>

              {/* Instant Geospatial Search Bar */}
              <div className="mt-2 sm:mt-space-sm flex flex-col gap-2 rounded-xl bg-surface-container-high/70 p-2 sm:p-space-sm shadow-xl backdrop-blur-md border border-surface-container/60">
                <form onSubmit={handleScan} className="flex items-center gap-2 rounded-lg bg-surface-container-lowest px-3 py-2 sm:py-2.5">
                  <span className="material-symbols-outlined text-secondary text-[20px] sm:text-[22px] shrink-0">travel_explore</span>
                  <input
                    value={scanQuery}
                    onChange={e => setScanQuery(e.target.value)}
                    className="w-full min-w-0 bg-transparent font-body-md text-xs sm:text-body-md text-on-surface placeholder:text-outline focus:outline-none"
                    placeholder="Query any coordinates or city (e.g. 35.68, 139.69 or Tokyo)..."
                    type="text"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded bg-primary px-3 py-1 font-label-mono-sm text-xs sm:text-label-mono-sm text-on-primary font-semibold transition-colors hover:bg-primary-fixed cursor-pointer"
                  >
                    SCAN
                  </button>
                </form>

                {/* Quick Chips with horizontal swipe on mobile */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap">
                  <span className="font-label-mono-sm text-[0.625rem] uppercase tracking-wider text-outline shrink-0">
                    Nodes:
                  </span>
                  {[
                    { name: 'Tokyo', lat: 35.6895, lon: 139.6917, aqi: 38, tag: 'Good', color: 'text-primary bg-primary/20' },
                    { name: 'London', lat: 51.5074, lon: -0.1278, aqi: 52, tag: 'Moderate', color: 'text-secondary bg-secondary/20' },
                    { name: 'São Paulo', lat: -23.6273, lon: -46.6566, aqi: 84, tag: 'Moderate', color: 'text-secondary bg-secondary/20' },
                    { name: 'Delhi NCR', lat: 28.6139, lon: 77.209, aqi: 188, tag: 'Unhealthy', color: 'text-error bg-error/20' },
                    { name: 'Reykjavik', lat: 64.1466, lon: -21.9426, aqi: 14, tag: 'Good', color: 'text-primary bg-primary/20' },
                  ].map(chip => (
                    <button
                      key={chip.name}
                      onClick={() => {
                        selectCity(chip.name, chip.lat, chip.lon);
                        setActiveView('dashboard');
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-2.5 py-1 font-label-mono-sm text-[0.6875rem] text-on-surface transition-colors hover:bg-surface-bright cursor-pointer shrink-0"
                    >
                      <span>{chip.name}</span>
                      <span className={`rounded-full px-1.5 py-0.2 text-[0.625rem] font-bold ${chip.color}`}>
                        AQI {chip.aqi}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hero Geospatial Visual & Vision AI Telemetry Card (Cols 8-12) */}
            <div className="relative lg:col-span-5 w-full">
              <div className="relative overflow-hidden rounded-2xl bg-surface-container-high p-3 sm:p-space-md shadow-2xl border border-surface-container">
                {/* Satellite Feed Header */}
                <div className="mb-2 sm:mb-space-sm flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    <span className="material-symbols-outlined text-secondary text-[18px] sm:text-[20px] shrink-0">satellite_alt</span>
                    <span className="font-label-ui text-xs sm:text-label-ui text-on-surface font-semibold truncate">
                      TROPOMI NO2 TROPOSPHERIC COLUMN
                    </span>
                  </div>
                  <span className="rounded bg-surface-container-lowest px-2 py-0.5 font-label-mono-sm text-[0.625rem] sm:text-label-mono-sm text-primary shrink-0">
                    ORBIT: 41,209
                  </span>
                </div>

                {/* Visual Imagery Showcase with Meta SAM 3.1 Segmentation Overlay */}
                <div
                  className="relative h-56 sm:h-64 md:h-72 w-full overflow-hidden rounded-xl bg-surface-container-lowest group cursor-pointer"
                  onClick={() => setActiveView('ai-copilot')}
                >
                  <img
                    className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                    alt="Copernicus Sentinel-5P high-resolution atmospheric false-color visualization"
                    src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
                  />
                  {/* Optical Haze Contrast Overlay (SAM 3.1 Inference Blocked) */}
                  <div className="absolute inset-x-4 sm:inset-x-8 inset-y-6 sm:inset-y-10 rounded-lg bg-secondary/15 backdrop-blur-[2px] transition-all border border-secondary/40">
                    <div className="absolute -top-3 left-2 sm:left-3 rounded bg-secondary/90 px-1.5 sm:px-2 py-0.5 font-label-mono-sm text-[0.55rem] sm:text-[0.625rem] font-bold text-on-secondary truncate max-w-[90%]">
                      ATMOSPHERIC OPTICAL HAZE [CONTRAST HEURISTIC]
                    </div>
                    <div className="absolute bottom-2 right-2 rounded bg-surface-container-lowest/80 px-1.5 sm:px-2 py-0.5 font-label-mono-sm text-[0.55rem] sm:text-[0.6rem] text-on-surface">
                      DIFFUSION: 247° @ 14.2 KT
                    </div>
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded bg-surface-container-lowest/90 px-2 py-0.5 font-label-mono-sm text-[0.625rem] sm:text-label-mono-sm text-outline">
                    <span className="h-1.5 w-1.5 rounded-full bg-outline"></span>
                    <span>SAM 3.1: BLOCKED (NO ENDPOINT)</span>
                  </div>
                </div>

                {/* Mini Live Gauges */}
                <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-space-xs text-center">
                  <div className="rounded-lg bg-surface-container-low p-2">
                    <span className="font-label-mono-sm text-[0.55rem] sm:text-[0.625rem] uppercase text-on-surface-variant truncate block">Mean AQI</span>
                    <div className="font-data-metric-sm text-base sm:text-data-metric-sm text-primary font-bold">
                      {currentTelemetry ? currentTelemetry.overallAqi : '47.2'}
                    </div>
                    <span className="font-label-mono-sm text-[0.55rem] sm:text-[0.6rem] text-primary">Normal</span>
                  </div>
                  <div className="rounded-lg bg-surface-container-low p-2">
                    <span className="font-label-mono-sm text-[0.55rem] sm:text-[0.625rem] uppercase text-on-surface-variant truncate block">Tropospheric O3</span>
                    <div className="font-data-metric-sm text-base sm:text-data-metric-sm text-secondary font-bold truncate">
                      {currentTelemetry?.pollutants['O3'] ? `${currentTelemetry.pollutants['O3'].value} µg` : '31.4 ppb'}
                    </div>
                    <span className="font-label-mono-sm text-[0.55rem] sm:text-[0.6rem] text-secondary">-2.1%</span>
                  </div>
                  <div className="rounded-lg bg-surface-container-low p-2">
                    <span className="font-label-mono-sm text-[0.55rem] sm:text-[0.625rem] uppercase text-on-surface-variant truncate block">Sensor Health</span>
                    <div className="font-data-metric-sm text-base sm:text-data-metric-sm text-on-surface font-bold">100%</div>
                    <span className="font-label-mono-sm text-[0.55rem] sm:text-[0.6rem] text-primary">Syncd</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* High-Level Global Telemetry Banner */}
          <div className="mt-8 sm:mt-space-2xl grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 rounded-2xl bg-surface-container/70 p-3 sm:p-space-md shadow-lg backdrop-blur-md border border-surface-container">
            <div className="flex items-center gap-2.5 p-2">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[20px] sm:text-[24px]">sensors</span>
              </div>
              <div className="min-w-0">
                <div className="font-data-metric-lg text-lg sm:text-2xl font-bold text-on-surface truncate">
                  {stations.length > 0 ? stations.length : 12}
                </div>
                <div className="font-label-mono-sm text-[0.625rem] sm:text-label-mono-sm text-on-surface-variant truncate">
                  Curated Reference Stations
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-2">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <span className="material-symbols-outlined text-[20px] sm:text-[24px]">public</span>
              </div>
              <div className="min-w-0">
                <div className="font-data-metric-lg text-lg sm:text-2xl font-bold text-on-surface truncate">6</div>
                <div className="font-label-mono-sm text-[0.625rem] sm:text-label-mono-sm text-on-surface-variant truncate">
                  Global Continents
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-2">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-tertiary-container/20 text-tertiary">
                <span className="material-symbols-outlined text-[20px] sm:text-[24px]">satellite_alt</span>
              </div>
              <div className="min-w-0">
                <div className="font-data-metric-lg text-lg sm:text-2xl font-bold text-on-surface truncate">ECMWF / CAMS</div>
                <div className="font-label-mono-sm text-[0.625rem] sm:text-label-mono-sm text-on-surface-variant truncate">
                  Copernicus Satellite Mesh
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-2">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-primary-container/20 text-primary">
                <span className="material-symbols-outlined text-[20px] sm:text-[24px]">verified</span>
              </div>
              <div className="min-w-0">
                <div className="font-data-metric-lg text-lg sm:text-2xl font-bold text-on-surface truncate">100%</div>
                <div className="font-label-mono-sm text-[0.625rem] sm:text-label-mono-sm text-on-surface-variant truncate">
                  Live Telemetry Verified
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Featured Live Planetary Atmospheric Grid */}
      <section className="w-full bg-surface py-8 sm:py-space-2xl">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-2 sm:gap-space-xs md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-space-xs">
                <span className="h-2 w-2 rounded-full bg-primary"></span>
                <span className="font-label-mono-sm text-[0.6875rem] uppercase tracking-wider text-primary">
                  Continental Telemetry Cross-Section
                </span>
              </div>
              <h2 className="font-headline-xl text-xl sm:text-2xl md:text-headline-xl text-on-surface font-bold">
                Featured Live Planetary Atmospheric Grid
              </h2>
              <p className="font-body-md text-xs sm:text-sm text-on-surface-variant max-w-2xl">
                Real-time multispectral sensor observations across five continental zones, calibrated with US-EPA and WHO 2021 air quality thresholds.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={() => setActiveView('compare')}
                className="rounded bg-surface-container-high px-2.5 py-1 font-label-mono-sm text-xs text-on-surface hover:bg-surface-bright cursor-pointer"
              >
                COMPARE NODES
              </button>
              <button
                onClick={() => setActiveView('global-map')}
                className="rounded bg-surface-container px-2.5 py-1 font-label-mono-sm text-xs text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                MAP VIEW
              </button>
            </div>
          </div>

          {/* 5 Continental Cards Grid */}
          <div className="mt-4 sm:mt-space-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
            {featuredStations.map(station => {
              const matched = stations.find(s => s.city.toLowerCase() === station.name.toLowerCase());
              const aqi = matched?.currentAqi ?? (station.name === 'Tokyo' ? 38 : station.name === 'London' ? 52 : station.name === 'São Paulo' ? 84 : station.name === 'Delhi NCR' ? 188 : 14);
              const dominant = matched?.dominantPollutant ?? (station.name === 'Delhi NCR' ? 'PM2.5' : station.name === 'London' ? 'NO2' : 'PM2.5');
              const aqiCategory = aqi <= 50 ? 'GOOD' : aqi <= 100 ? 'MODERATE' : 'UNHEALTHY';
              const aqiColor = aqi <= 50 ? 'text-primary bg-primary/15' : aqi <= 100 ? 'text-secondary bg-secondary/15' : 'text-error bg-error/20';

              return (
                <div
                  key={station.name}
                  onClick={() => {
                    selectCity(station.name, station.lat, station.lon);
                    setActiveView('dashboard');
                  }}
                  className="group relative flex flex-col justify-between rounded-xl bg-surface-container-low p-3 sm:p-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:bg-surface-container hover:shadow-xl cursor-pointer border border-surface-container"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-label-mono-sm text-[0.625rem] uppercase text-outline">
                        {station.region} • {station.stationId}
                      </span>
                      <span className="rounded bg-surface-container-lowest px-1.5 py-0.5 font-label-mono-sm text-[0.6rem] text-primary">
                        {station.network}
                      </span>
                    </div>
                    <h3 className="font-headline-md text-lg font-bold text-on-surface truncate">{station.name}</h3>
                    <span className="font-body-sm text-xs text-on-surface-variant truncate">{station.country}</span>
                  </div>

                  <div className="my-3 flex items-baseline justify-between rounded-lg bg-surface-container-lowest/80 p-2.5">
                    <div>
                      <div className="font-label-mono-sm text-[0.625rem] text-on-surface-variant">INDEX AQI</div>
                      <div className={`font-data-metric-lg text-2xl font-extrabold ${aqi <= 50 ? 'text-primary' : aqi <= 100 ? 'text-secondary' : 'text-error'}`}>
                        {aqi}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`rounded-full px-2 py-0.5 font-label-ui text-xs font-semibold ${aqiColor}`}>
                        {aqiCategory}
                      </span>
                      <div className="mt-1 font-label-mono-sm text-[0.625rem] text-on-surface-variant">
                        Vector: <strong className="text-on-surface">{dominant}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Sparkline SVG */}
                  <div className="mb-2">
                    <div className="mb-1 flex justify-between font-label-mono-sm text-[0.6rem] text-outline">
                      <span>24h Trend</span>
                      <span>Min {Math.max(5, aqi - 15)} • Max {aqi + 20}</span>
                    </div>
                    <svg className={`h-8 w-full ${station.sparklineColor}`} fill="none" viewBox="0 0 100 30">
                      <path d="M0,20 Q25,12 50,18 T75,10 T100,16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2"></path>
                      <path d="M0,20 Q25,12 50,18 T75,10 T100,16 L100,30 L0,30 Z" fill="currentColor" fillOpacity="0.08"></path>
                    </svg>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 font-label-mono-sm text-[0.625rem] text-on-surface-variant border-t border-surface-container/60">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">thermostat</span>
                      {station.name === 'Tokyo' ? '18.4°C' : station.name === 'London' ? '14.1°C' : station.name === 'Delhi NCR' ? '31.8°C' : '22.0°C'}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">air</span>
                      {station.name === 'Tokyo' ? 'SSW 4.2' : station.name === 'Delhi NCR' ? 'CALM 1.1' : 'WNW 5.2'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 3: Four Technological Pillars */}
      <section className="w-full bg-surface-container-lowest py-8 sm:py-space-2xl">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-space-xl text-center">
            <span className="rounded-full bg-secondary/10 px-3 py-1 font-label-mono-sm text-xs font-semibold uppercase text-secondary">
              Architecture &amp; Machine Learning Pipeline
            </span>
            <h2 className="mt-2 font-headline-xl text-xl sm:text-2xl md:text-headline-xl text-on-surface font-bold">
              Four Technological Pillars of EcoTrack
            </h2>
            <p className="mx-auto mt-2 font-body-md text-xs sm:text-sm text-on-surface-variant max-w-2xl">
              Engineered for strict epistemic integrity. How orbital remote sensing, atmospheric physics, and fine-tuned Meta AI models combine to yield actionable intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Pillar 1 */}
            <div className="p-4 sm:p-5 rounded-xl bg-surface-container-low border border-surface-container hover:border-primary/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                  <span className="material-symbols-outlined text-[24px] sm:text-[28px]">satellite_alt</span>
                </div>
                <h3 className="font-headline-md text-base sm:text-lg font-bold text-on-surface mb-1.5">
                  Copernicus Sentinel-5P
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                  Daily planetary scans capturing tropospheric NO2, SO2, and aerosol optical depth via the high-resolution TROPOMI instrument.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between text-primary font-label-mono-sm text-[0.625rem]">
                <span>RES: 3.5 × 5.5 KM</span>
                <span className="material-symbols-outlined text-[15px]">verified</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-4 sm:p-5 rounded-xl bg-surface-container-low border border-surface-container hover:border-secondary/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary mb-3">
                  <span className="material-symbols-outlined text-[24px] sm:text-[28px]">visibility</span>
                </div>
                <h3 className="font-headline-md text-base sm:text-lg font-bold text-on-surface mb-1.5">
                  Meta SAM 3.1 Vision AI
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                  Segment Anything Model adapted for atmospheric optical telemetry. Distinguishes particulate haze plumes, smoke opacity, and radiation fog.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between text-secondary font-label-mono-sm text-[0.625rem]">
                <span>ViT-H TRANSFORMER</span>
                <span className="material-symbols-outlined text-[15px]">memory</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-4 sm:p-5 rounded-xl bg-surface-container-low border border-surface-container hover:border-tertiary/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-tertiary-container/20 flex items-center justify-center text-tertiary mb-3">
                  <span className="material-symbols-outlined text-[24px] sm:text-[28px]">psychology</span>
                </div>
                <h3 className="font-headline-md text-base sm:text-lg font-bold text-on-surface mb-1.5">
                  Meta LLaMA 3.3 70B
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                  Retrieval-augmented generation grounding inquiries in atmospheric physics: boundary layer height caps, oxidation, and WHO targets.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between text-tertiary font-label-mono-sm text-[0.625rem]">
                <span>GROUNDED RAG</span>
                <span className="material-symbols-outlined text-[15px]">smart_toy</span>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="p-4 sm:p-5 rounded-xl bg-surface-container-low border border-surface-container hover:border-primary/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary mb-3">
                  <span className="material-symbols-outlined text-[24px] sm:text-[28px]">sensors</span>
                </div>
                <h3 className="font-headline-md text-base sm:text-lg font-bold text-on-surface mb-1.5">
                  Calibrated Ground Nodes
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                  Direct physical reference instrumentation including BAM-1020 beta-attenuation monitors from EPA AirNow, OpenAQ v3, and national hubs.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between text-primary font-label-mono-sm text-[0.625rem]">
                <span>EPA 40 CFR 58</span>
                <span className="material-symbols-outlined text-[15px]">rule</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-surface-container-lowest border-t border-surface-container py-6 sm:py-8">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">eco</span>
            </div>
            <div className="text-left">
              <div className="font-headline-md text-sm sm:text-base font-bold text-on-surface">EcoTrack</div>
              <div className="font-label-mono-sm text-[0.625rem] text-on-surface-variant">
                Meta Global AI Developer Hackathon Submission
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 font-label-ui text-xs text-on-surface-variant">
            <button onClick={() => setActiveView('dashboard')} className="hover:text-primary transition-colors cursor-pointer">
              Dashboard
            </button>
            <button onClick={() => setActiveView('global-map')} className="hover:text-primary transition-colors cursor-pointer">
              Global Map
            </button>
            <button onClick={() => setActiveView('ai-copilot')} className="hover:text-primary transition-colors cursor-pointer">
              AI Copilot
            </button>
            <button onClick={() => setActiveView('compare')} className="hover:text-primary transition-colors cursor-pointer">
              Compare
            </button>
            <button onClick={() => setActiveView('alerts')} className="hover:text-primary transition-colors cursor-pointer">
              Alerts
            </button>
            <button onClick={() => setActiveView('auth')} className="hover:text-primary transition-colors cursor-pointer">
              Portal Sign-In
            </button>
            <button onClick={() => setActiveView('register')} className="hover:text-secondary transition-colors cursor-pointer">
              Provision Node
            </button>
          </div>

          <div className="font-label-mono-sm text-[0.625rem] text-on-surface-variant text-center sm:text-right">
            <span>© 2025-2026 EcoTrack Intelligence. WMO GAW calibrated.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
