import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { GlobalStation } from '../types';
import L from 'leaflet';

export const GlobalMapView: React.FC = () => {
  const { stations, selectedLocation, selectCity, setActiveView, currentTelemetry } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  const [activePollutant, setActivePollutant] = useState<'AQI' | 'PM2.5' | 'PM10' | 'NO2' | 'O3' | 'SO2' | 'CO'>('AQI');
  const [selectedStation, setSelectedStation] = useState<GlobalStation | null>(null);
  const [selectedOpenaqStation, setSelectedOpenaqStation] = useState<{
    id: number;
    name: string;
    locality?: string;
    country?: string;
    lat: number;
    lon: number;
    distanceKm?: number;
    measurements: Record<string, { value: number; unit: string; lastUpdated: string }>;
  } | null>(null);
  const [showModelLayer, setShowModelLayer] = useState<boolean>(true);
  const [showOpenaqLayer, setShowOpenaqLayer] = useState<boolean>(true);
  const [openaqStations, setOpenaqStations] = useState<Array<{
    id: number;
    name: string;
    locality?: string;
    country?: string;
    lat: number;
    lon: number;
    distanceKm?: number;
    measurements: Record<string, { value: number; unit: string; lastUpdated: string }>;
  }>>([]);
  const [temporalOffset, setTemporalOffset] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showMobileInspector, setShowMobileInspector] = useState<boolean>(false);

  // Fetch OpenAQ physical stations near selectedLocation
  useEffect(() => {
    let isCancelled = false;
    const fetchOpenaq = async () => {
      const qLat = typeof selectedLocation?.lat === 'number' && !isNaN(selectedLocation.lat) ? selectedLocation.lat : 24.8607;
      const qLon = typeof selectedLocation?.lon === 'number' && !isNaN(selectedLocation.lon) ? selectedLocation.lon : 67.0011;
      try {
        const res = await fetch(`/api/environment/openaq?lat=${qLat}&lon=${qLon}&radius=25000`);
        if (!res.ok) return;
        const data = await res.json();
        if (!isCancelled && Array.isArray(data.stations)) {
          const normalized = data.stations
            .map((st: any) => {
              const lat = typeof st.lat === 'number' && !isNaN(st.lat) ? st.lat : typeof st.latitude === 'number' && !isNaN(st.latitude) ? st.latitude : undefined;
              const lon = typeof st.lon === 'number' && !isNaN(st.lon) ? st.lon : typeof st.longitude === 'number' && !isNaN(st.longitude) ? st.longitude : undefined;
              return { ...st, lat, lon };
            })
            .filter((st: any) => typeof st.lat === 'number' && !isNaN(st.lat) && typeof st.lon === 'number' && !isNaN(st.lon));
          setOpenaqStations(normalized);
        }
      } catch {
        // Safe fallback
      }
    };
    fetchOpenaq();
    return () => {
      isCancelled = true;
    };
  }, [selectedLocation?.lat, selectedLocation?.lon]);

  // Auto-play temporal slider effect
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTemporalOffset(prev => (prev >= 36 ? -12 : prev + 3));
    }, 1500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Helper to extract value, unit, and color for any of the 7 pollutants
  const getPollutantMetric = (st: GlobalStation, pol: 'AQI' | 'PM2.5' | 'PM10' | 'NO2' | 'O3' | 'SO2' | 'CO') => {
    let val: number | string = 'N/A';
    let unit = 'µg/m³';
    let color = '#4edea3'; // good (emerald)

    switch (pol) {
      case 'AQI':
        unit = 'AQI';
        if (st.currentAqi !== undefined) {
          val = st.currentAqi;
          if (val > 150) color = '#ffb4ab';
          else if (val > 100) color = '#f59e0b';
          else if (val > 50) color = '#4cd7f6';
        } else {
          color = '#86948a';
        }
        break;
      case 'PM2.5':
        unit = 'µg/m³';
        if (st.pm2_5 !== undefined) {
          val = st.pm2_5;
          if (val > 55.4) color = '#ffb4ab';
          else if (val > 35.4) color = '#f59e0b';
          else if (val > 12.0) color = '#4cd7f6';
        } else {
          color = '#86948a';
        }
        break;
      case 'PM10':
        unit = 'µg/m³';
        if (st.pm10 !== undefined) {
          val = st.pm10;
          if (val > 254) color = '#ffb4ab';
          else if (val > 154) color = '#f59e0b';
          else if (val > 54) color = '#4cd7f6';
        } else {
          color = '#86948a';
        }
        break;
      case 'NO2':
        unit = 'µg/m³';
        if (st.no2 !== undefined) {
          val = st.no2;
          if (val > 100) color = '#ffb4ab';
          else if (val > 50) color = '#f59e0b';
          else if (val > 25) color = '#4cd7f6';
        } else {
          color = '#86948a';
        }
        break;
      case 'O3':
        unit = 'µg/m³';
        if (st.o3 !== undefined) {
          val = st.o3;
          if (val > 140) color = '#ffb4ab';
          else if (val > 100) color = '#f59e0b';
          else if (val > 60) color = '#4cd7f6';
        } else {
          color = '#86948a';
        }
        break;
      case 'SO2':
        unit = 'µg/m³';
        if (st.so2 !== undefined) {
          val = st.so2;
          if (val > 75) color = '#ffb4ab';
          else if (val > 35) color = '#f59e0b';
          else if (val > 15) color = '#4cd7f6';
        } else {
          color = '#86948a';
        }
        break;
      case 'CO':
        unit = 'mg/m³';
        if (st.co !== undefined) {
          val = st.co;
          if (val > 9.0) color = '#ffb4ab';
          else if (val > 4.0) color = '#f59e0b';
          else if (val > 2.0) color = '#4cd7f6';
        } else {
          color = '#86948a';
        }
        break;
    }

    return { val, unit, color };
  };

  // Initialize station
  useEffect(() => {
    if (stations.length > 0 && !selectedStation) {
      const match = stations.find(s => s.city.toLowerCase().includes('tokyo')) || stations[0];
      setSelectedStation(match);
    }
  }, [stations]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initLat = typeof selectedLocation?.lat === 'number' && !isNaN(selectedLocation.lat) ? selectedLocation.lat : 30;
      const initLon = typeof selectedLocation?.lon === 'number' && !isNaN(selectedLocation.lon) ? selectedLocation.lon : 10;
      const map = L.map(mapContainerRef.current, {
        center: [initLat, initLon],
        zoom: 3,
        minZoom: 2,
        maxZoom: 18,
        zoomControl: false,
      });

      // CartoDB Dark Matter tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Add Zoom control to bottom left
      L.control.zoom({ position: 'bottomleft' }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers dynamically when stations, openaqStations, layers, activePollutant, or temporalOffset changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // 1. Render Atmospheric Model Forecast Nodes (Open-Meteo CAMS)
    if (showModelLayer && Array.isArray(stations)) {
      stations.forEach(st => {
        const lat = typeof st.lat === 'number' && !isNaN(st.lat) ? st.lat : typeof (st as any).latitude === 'number' && !isNaN((st as any).latitude) ? (st as any).latitude : null;
        const lon = typeof st.lon === 'number' && !isNaN(st.lon) ? st.lon : typeof (st as any).longitude === 'number' && !isNaN((st as any).longitude) ? (st as any).longitude : null;
        if (lat === null || lon === null) return;

        const { val, unit, color } = getPollutantMetric(st, activePollutant);

        const circle = L.circleMarker([lat, lon], {
          radius: 9,
          fillColor: color,
          color: '#0f131d',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        }).addTo(map);

        circle.bindTooltip(
          `<div style="font-family: 'Inter', sans-serif; font-size: 11px; padding: 2px;">
            <div style="font-size: 9px; color: #38bdf8; font-weight: bold;">[MODEL FORECAST — CAMS]</div>
            <strong>${st.name}</strong><br/>
            ${activePollutant}: <span style="color: ${color}; font-weight: bold;">${val} ${unit}</span><br/>
            <span style="color: #94a3b8; font-size: 9px;">Network: ${st.sensorNetwork}</span>
          </div>`,
          { direction: 'top', className: 'dark-tooltip' }
        );

        circle.on('click', () => {
          setSelectedOpenaqStation(null);
          setSelectedStation(st);
          selectCity(`${st.city}, ${st.country}`, lat, lon);
          setShowMobileInspector(true);
          map.setView([lat, lon], 6, { animate: true });
        });

        markersRef.current.push(circle);
      });
    }

    // 2. Render Physical Ground Sensors (OpenAQ v3)
    if (showOpenaqLayer && Array.isArray(openaqStations)) {
      openaqStations.forEach(st => {
        const lat = typeof st.lat === 'number' && !isNaN(st.lat) ? st.lat : typeof (st as any).latitude === 'number' && !isNaN((st as any).latitude) ? (st as any).latitude : null;
        const lon = typeof st.lon === 'number' && !isNaN(st.lon) ? st.lon : typeof (st as any).longitude === 'number' && !isNaN((st as any).longitude) ? (st as any).longitude : null;
        if (lat === null || lon === null) return;

        // Cyan square/diamond marker with distinct pulse border
        const marker = L.circleMarker([lat, lon], {
          radius: 10,
          fillColor: '#0284c7', // sky-600
          color: '#38bdf8', // sky-400 cyan
          weight: 2.5,
          opacity: 1,
          fillOpacity: 0.95,
        }).addTo(map);

        const sensorSummary = Object.entries(st.measurements || {})
          .slice(0, 3)
          .map(([k, v]) => `${k}: ${v.value} ${v.unit}`)
          .join(', ') || 'Online telemetry';

        marker.bindTooltip(
          `<div style="font-family: 'Inter', sans-serif; font-size: 11px; padding: 3px;">
            <div style="font-size: 9px; color: #4ade80; font-weight: bold;">[PHYSICAL GROUND SENSOR — OpenAQ v3]</div>
            <strong>${st.name}</strong><br/>
            <span style="color: #cbd5e1; font-size: 10px;">${sensorSummary}</span><br/>
            <span style="color: #94a3b8; font-size: 9px;">Dist: ${st.distanceKm?.toFixed(1) ?? 'N/A'} km</span>
          </div>`,
          { direction: 'top', className: 'dark-tooltip' }
        );

        marker.on('click', () => {
          setSelectedStation(null);
          setSelectedOpenaqStation(st);
          setShowMobileInspector(true);
          map.setView([lat, lon], 8, { animate: true });
        });

        markersRef.current.push(marker);
      });
    }
  }, [stations, openaqStations, showModelLayer, showOpenaqLayer, activePollutant, temporalOffset]);

  // Center on selected location if changed
  useEffect(() => {
    if (
      mapInstanceRef.current &&
      typeof selectedLocation?.lat === 'number' &&
      !isNaN(selectedLocation.lat) &&
      typeof selectedLocation?.lon === 'number' &&
      !isNaN(selectedLocation.lon)
    ) {
      mapInstanceRef.current.setView([selectedLocation.lat, selectedLocation.lon], 5, { animate: true });
    }
  }, [selectedLocation?.lat, selectedLocation?.lon]);

  // Compute actual CAMS forecast point at the temporal offset
  const forecastAtOffset = useMemo(() => {
    if (!currentTelemetry?.hourlyForecast?.length || temporalOffset === 0) return null;
    const targetMs = Date.now() + temporalOffset * 3600 * 1000;
    let closest = currentTelemetry.hourlyForecast[0];
    let minDiff = Math.abs(new Date(closest.time).getTime() - targetMs);
    for (const h of currentTelemetry.hourlyForecast) {
      const diff = Math.abs(new Date(h.time).getTime() - targetMs);
      if (diff < minDiff) {
        minDiff = diff;
        closest = h;
      }
    }
    return closest;
  }, [currentTelemetry?.hourlyForecast, temporalOffset]);

  const rawAqi = selectedStation?.currentAqi !== undefined
    ? selectedStation.currentAqi
    : (currentTelemetry?.overallAqi ?? null);

  const displayAqi = forecastAtOffset ? forecastAtOffset.aqi : rawAqi;

  // Inspector Content shared between desktop sidebar and mobile drawer
  const renderInspectorContent = (isMobileDrawer = false) => {
    // 1. If OpenAQ Physical Ground Station is selected
    if (selectedOpenaqStation) {
      const st = selectedOpenaqStation;
      const measurementEntries = Object.entries(st.measurements || {});

      return (
        <div className="flex flex-col h-full justify-between p-3.5 sm:p-4 overflow-y-auto space-y-3">
          <div>
            <div className="flex items-center justify-between pb-1">
              <span className="font-label-mono-sm text-[0.625rem] uppercase text-primary font-bold truncate pr-2">
                OpenAQ Physical Station #{st.id}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 font-label-mono-sm text-[0.625rem] font-bold border border-sky-500/30">
                  GROUND OBSERVATION
                </span>
                {isMobileDrawer && (
                  <button
                    onClick={() => setShowMobileInspector(false)}
                    className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>
            </div>
            <h2 className="font-headline-md text-base sm:text-lg font-bold text-on-surface truncate">
              {st.name}
            </h2>
            <p className="font-label-mono-sm text-[0.6875rem] text-on-surface-variant truncate">
              {st.locality ? `${st.locality}, ` : ''}{st.country || 'Global'} • {st.lat.toFixed(3)}° N, {st.lon.toFixed(3)}° E
            </p>
            {st.distanceKm !== undefined && (
              <span className="text-[0.625rem] font-label-mono-sm text-secondary">
                Approx {st.distanceKm.toFixed(1)} km from query center
              </span>
            )}
          </div>

          {/* Physical Instrument Provenance Callout */}
          <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-700/40 text-sky-200 text-xs space-y-1">
            <div className="font-label-ui font-bold text-[0.6875rem] uppercase tracking-wider text-sky-300 flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">sensors</span>
              Calibrated Physical Telemetry (OpenAQ v3)
            </div>
            <p className="text-[0.6875rem] leading-relaxed text-sky-100">
              Direct physical measurements recorded by ground-based regulatory or research monitoring instruments.
            </p>
          </div>

          {/* Live Sensor Measurements Grid */}
          <div className="space-y-1.5">
            <div className="font-label-mono-sm text-[0.625rem] text-outline uppercase font-semibold">
              Reported Ground Readings ({measurementEntries.length})
            </div>
            {measurementEntries.length > 0 ? (
              <div className="grid grid-cols-2 gap-1.5 font-label-mono-sm text-xs">
                {measurementEntries.map(([param, m]) => (
                  <div key={param} className="p-2 rounded bg-surface-container flex flex-col justify-between">
                    <span className="text-on-surface-variant uppercase text-[0.625rem]">{param}</span>
                    <span className="text-primary font-bold text-sm">
                      {m.value} <span className="text-[0.625rem] font-normal text-on-surface-variant">{m.unit}</span>
                    </span>
                    <span className="text-[0.55rem] text-outline truncate">{new Date(m.lastUpdated).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-surface-container text-xs text-on-surface-variant text-center">
                Station registered on OpenAQ v3 network; real-time measurement channel initializing or pending update.
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2 border-t border-surface-container">
            <button
              onClick={() => {
                selectCity(st.name, st.lat, st.lon);
                setActiveView('dashboard');
              }}
              className="w-full py-2.5 rounded-lg bg-primary-container hover:bg-primary font-label-ui text-xs sm:text-sm font-semibold text-on-primary-container transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">space_dashboard</span>
              <span>Open Location Dashboard</span>
            </button>
            <button
              onClick={() => {
                selectCity(st.name, st.lat, st.lon);
                setActiveView('ai-copilot');
              }}
              className="w-full py-2 rounded-lg bg-surface-container hover:bg-surface-bright font-label-ui text-xs sm:text-sm text-secondary transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">smart_toy</span>
              <span>Copilot Scientific Analysis</span>
            </button>
          </div>
        </div>
      );
    }

    // 2. If Atmospheric Model Forecast Station is selected
    if (!selectedStation) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-[32px] text-outline mb-2">public</span>
          <div className="font-headline-md text-base text-on-surface">Select a Forecast Node or Ground Sensor</div>
          <p className="font-body-sm text-xs mt-1">
            Tap any active forecast node or physical sensor on the global canvas to inspect live telemetry.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full justify-between p-3.5 sm:p-4 overflow-y-auto space-y-3">
        {/* Header info */}
        <div>
          <div className="flex items-center justify-between pb-1">
            <span className="font-label-mono-sm text-[0.625rem] uppercase text-secondary font-bold truncate pr-2">
              {selectedStation.continent} • {selectedStation.id}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-label-mono-sm text-[0.625rem] font-semibold">
                MODEL FORECAST
              </span>
              {isMobileDrawer && (
                <button
                  onClick={() => setShowMobileInspector(false)}
                  className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>
          <h2 className="font-headline-md text-base sm:text-lg font-bold text-on-surface truncate">
            {selectedStation.name}
          </h2>
          <p className="font-label-mono-sm text-[0.6875rem] text-on-surface-variant truncate">
            {selectedStation.lat.toFixed(3)}° N, {selectedStation.lon.toFixed(3)}° E • {selectedStation.country}
          </p>
        </div>

        {/* AQI Metric Card */}
        <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between">
          <div>
            <div className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase flex items-center gap-1">
              <span>Forecast AQI (EPA)</span>
              {temporalOffset !== 0 && (
                <span className="text-primary font-bold">
                  ({temporalOffset > 0 ? `+${temporalOffset}h` : `${temporalOffset}h`})
                </span>
              )}
            </div>
            <div className={`font-data-metric-lg text-2xl sm:text-3xl font-extrabold ${displayAqi !== null ? (displayAqi <= 50 ? 'text-primary' : displayAqi <= 100 ? 'text-secondary' : 'text-error') : 'text-on-surface-variant'}`}>
              {displayAqi !== null ? displayAqi : 'Unavailable'}
            </div>
          </div>
          <div className="text-right">
            <span className={`px-2 py-0.5 rounded-full font-label-ui text-xs font-semibold ${displayAqi !== null ? (displayAqi <= 50 ? 'bg-primary/15 text-primary' : displayAqi <= 100 ? 'bg-secondary/15 text-secondary' : 'bg-error/20 text-error') : 'bg-surface-container text-on-surface-variant'}`}>
              {displayAqi !== null ? (displayAqi <= 50 ? 'GOOD' : displayAqi <= 100 ? 'MODERATE' : 'UNHEALTHY') : 'PENDING'}
            </span>
            <div className="font-label-mono-sm text-[0.6875rem] text-on-surface-variant mt-1">
              Primary: <strong className="text-on-surface">{selectedStation.dominantPollutant || 'PM2.5'}</strong>
            </div>
          </div>
        </div>

        {/* Sensor & Network Info */}
        <div className="p-2 sm:p-2.5 rounded-lg bg-surface-container space-y-0.5 font-label-mono-sm text-[0.6875rem]">
          <div className="text-on-surface-variant truncate">
            Model: <strong className="text-on-surface">{selectedStation.sensorModel}</strong>
          </div>
          <div className="text-on-surface-variant truncate">
            Provenance: <strong className="text-secondary">{selectedStation.sensorNetwork}</strong>
          </div>
        </div>

        {/* Speciation Snapshot */}
        <div className="space-y-1">
          <div className="font-label-mono-sm text-[0.625rem] text-outline uppercase font-semibold">
            Forecast Speciation Snapshot
          </div>
          <div className="grid grid-cols-2 gap-1.5 font-label-mono-sm text-xs">
            <div className="p-2 rounded bg-surface-container flex justify-between">
              <span className="text-on-surface-variant">PM2.5:</span>
              <span className="text-on-surface font-semibold">
                {forecastAtOffset?.pm2_5 !== undefined
                  ? `${forecastAtOffset.pm2_5} µg`
                  : selectedStation.pm2_5 !== undefined
                  ? `${selectedStation.pm2_5} µg`
                  : 'Unavailable'}
              </span>
            </div>
            <div className="p-2 rounded bg-surface-container flex justify-between">
              <span className="text-on-surface-variant">PM10:</span>
              <span className="text-on-surface font-semibold">
                {forecastAtOffset?.pm10 !== undefined
                  ? `${forecastAtOffset.pm10} µg`
                  : selectedStation.pm10 !== undefined
                  ? `${selectedStation.pm10} µg`
                  : 'Unavailable'}
              </span>
            </div>
            <div className="p-2 rounded bg-surface-container flex justify-between">
              <span className="text-on-surface-variant">NO2:</span>
              <span className="text-on-surface font-semibold">
                {forecastAtOffset?.no2 !== undefined
                  ? `${forecastAtOffset.no2} µg`
                  : selectedStation.no2 !== undefined
                  ? `${selectedStation.no2} µg`
                  : 'Unavailable'}
              </span>
            </div>
            <div className="p-2 rounded bg-surface-container flex justify-between">
              <span className="text-on-surface-variant">Temp:</span>
              <span className="text-on-surface font-semibold">
                {forecastAtOffset?.temperature !== undefined
                  ? `${forecastAtOffset.temperature}°C`
                  : selectedStation.temperature !== undefined
                  ? `${selectedStation.temperature}°C`
                  : 'Unavailable'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2 border-t border-surface-container">
          <button
            onClick={() => {
              selectCity(`${selectedStation.city}, ${selectedStation.country}`, selectedStation.lat, selectedStation.lon);
              setActiveView('dashboard');
            }}
            className="w-full py-2.5 rounded-lg bg-primary-container hover:bg-primary font-label-ui text-xs sm:text-sm font-semibold text-on-primary-container transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">space_dashboard</span>
            <span>Open Forecast Dashboard</span>
          </button>
          <button
            onClick={() => {
              selectCity(`${selectedStation.city}, ${selectedStation.country}`, selectedStation.lat, selectedStation.lon);
              setActiveView('ai-copilot');
            }}
            className="w-full py-2 rounded-lg bg-surface-container hover:bg-surface-bright font-label-ui text-xs sm:text-sm text-secondary transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">smart_toy</span>
            <span>Copilot Analysis</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-surface overflow-hidden flex flex-col">
      {/* MAP CANVAS CONTAINER */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* FLOATING TOP CONTROLS & TELEMETRY TOOLBAR */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 lg:right-[410px] z-30 flex flex-col gap-2 pointer-events-none">
        {/* Upper Strip: Search & Ingestion Modes */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Coordinates / Station Locator */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-surface-container-high/90 backdrop-blur-xl px-2.5 sm:px-3 py-1.5 rounded-lg shadow-2xl flex-1 max-w-md border border-surface-variant min-w-0">
            <span className="material-symbols-outlined text-secondary text-[18px] sm:text-[20px] shrink-0">explore</span>
            <span className="font-body-sm text-xs sm:text-body-sm text-on-surface truncate w-full">
              {selectedOpenaqStation
                ? `[OpenAQ Ground] ${selectedOpenaqStation.name}`
                : selectedStation
                ? `[CAMS Forecast] ${selectedStation.name}`
                : 'Select node or sensor on map...'}
            </span>
          </div>

          {/* Interactive Layer Ingestion Multi-Select Controls */}
          <div className="flex items-center gap-1 bg-surface-container-high/90 backdrop-blur-xl p-1 rounded-lg shadow-2xl border border-surface-variant shrink-0">
            <button
              onClick={() => setShowModelLayer(!showModelLayer)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-label-mono-sm text-[0.625rem] sm:text-label-mono-sm transition-all cursor-pointer ${
                showModelLayer
                  ? 'bg-primary text-on-primary font-bold shadow'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>CAMS FORECAST</span>
            </button>
            <button
              onClick={() => setShowOpenaqLayer(!showOpenaqLayer)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-label-mono-sm text-[0.625rem] sm:text-label-mono-sm transition-all cursor-pointer ${
                showOpenaqLayer
                  ? 'bg-sky-500 text-white font-bold shadow'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[13px] sm:text-[14px]">sensors</span>
              <span>OPENAQ GROUND ({openaqStations.length})</span>
            </button>
          </div>
        </div>

        {/* Lower Strip: Pollutant Parameter Pills */}
        <div className="flex items-center justify-between gap-2 pointer-events-auto">
          <div className="flex items-center gap-1 bg-surface-container-high/90 backdrop-blur-xl p-1 rounded-lg shadow-2xl overflow-x-auto scrollbar-none max-w-full border border-surface-variant shrink-0">
            {(['AQI', 'PM2.5', 'PM10', 'NO2', 'O3', 'SO2', 'CO'] as const).map(param => (
              <button
                key={param}
                onClick={() => setActivePollutant(param)}
                className={`px-2.5 sm:px-3 py-1 rounded font-label-ui text-xs sm:text-label-ui transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                  activePollutant === param
                    ? 'bg-secondary text-on-secondary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span>{param === 'AQI' ? 'AQI' : param === 'O3' ? 'Ozone' : param}</span>
                {activePollutant === param && (
                  <span className="w-1.5 h-1.5 rounded-full bg-on-secondary"></span>
                )}
              </button>
            ))}
          </div>

          {/* Mobile Inspector Toggle Pill */}
          <button
            onClick={() => setShowMobileInspector(!showMobileInspector)}
            className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container-high/95 backdrop-blur-xl border border-surface-variant text-on-surface font-label-mono-sm text-xs shadow-xl cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-primary text-[16px]">sensors</span>
            <span>{showMobileInspector ? 'Hide' : 'Inspect'}</span>
          </button>
        </div>
      </div>

      {/* BOTTOM TEMPORAL SCRUBBER */}
      <div className={`absolute left-2 sm:left-4 right-2 sm:right-4 lg:right-[410px] z-30 pointer-events-auto transition-all ${
        showMobileInspector ? 'bottom-56 sm:bottom-64' : 'bottom-3 sm:bottom-4'
      }`}>
        <div className="bg-surface-container-high/90 backdrop-blur-xl p-2.5 sm:p-space-sm rounded-xl shadow-2xl border border-surface-variant flex flex-col gap-1.5">
          <div className="flex items-center justify-between font-label-mono-sm text-[0.625rem] sm:text-[0.6875rem] text-on-surface-variant">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-surface-container hover:bg-surface-bright flex items-center justify-center text-primary cursor-pointer transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[15px] sm:text-[16px]">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <span className="uppercase text-on-surface font-semibold truncate">
                Atmospheric Dispersion Scrubber
              </span>
            </div>
            <span className="shrink-0 text-[0.625rem]">
              {temporalOffset === 0 ? 'NOW' : `${temporalOffset > 0 ? '+' : ''}${temporalOffset}h`}
            </span>
          </div>
          <input
            type="range"
            min="-12"
            max="36"
            step="3"
            value={temporalOffset}
            onChange={e => setTemporalOffset(parseInt(e.target.value))}
            className="w-full accent-primary cursor-pointer h-1.5"
          />
          <div className="flex justify-between font-label-mono-sm text-[0.55rem] sm:text-[0.625rem] text-outline">
            <span>-12h</span>
            <span className="text-primary font-bold">NOW</span>
            <span>+12h</span>
            <span>+24h</span>
            <span>+36h</span>
          </div>
        </div>
      </div>

      {/* DESKTOP RIGHT-HAND TELEMETRY INSPECTOR (lg and above) */}
      <div className="absolute top-4 right-4 bottom-4 w-96 z-30 hidden lg:flex flex-col bg-surface-container-low/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-surface-variant overflow-hidden">
        {renderInspectorContent(false)}
      </div>

      {/* MOBILE & TABLET SLIDE-UP DRAWER (below lg) */}
      {showMobileInspector && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 max-h-[60vh] bg-surface-container-low/98 backdrop-blur-2xl rounded-t-2xl border-t border-surface-container shadow-2xl overflow-y-auto">
          {renderInspectorContent(true)}
        </div>
      )}
    </div>
  );
};
