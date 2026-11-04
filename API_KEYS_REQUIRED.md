# EcoTrack — API Keys & External Credentials Guide

This document details all API services utilized by the EcoTrack Planetary Environmental Intelligence platform, their current implementation status, authentication requirements, and fallback architectures.

---

## 1. Zero-Key Out-Of-The-Box Providers (Active Immediately)

### Open-Meteo Air Quality API
- **Endpoint**: `https://air-quality-api.open-meteo.com/v1/air-quality`
- **Authentication**: **None required (Public Open Data)**
- **Coverage**: Global planetary coverage (0.1° resolution)
- **Telemetry Ingested**:
  - `pm2_5`: Particulate matter ≤ 2.5 µm (µg/m³)
  - `pm10`: Particulate matter ≤ 10 µm (µg/m³)
  - `nitrogen_dioxide`: NO2 (µg/m³)
  - `ozone`: Ground O3 (µg/m³)
  - `sulphur_dioxide`: SO2 (µg/m³)
  - `carbon_monoxide`: CO (µg/m³)
  - `dust`: Aeolian mineral dust (µg/m³)
  - `us_aqi`: Official EPA 40 CFR 58 AQI
  - `european_aqi`: European Air Quality Index
- **Update Frequency**: Hourly forward model assimilation

### Open-Meteo Physical Weather Forecast API
- **Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Authentication**: **None required (Public Open Data)**
- **Coverage**: Global (ECMWF & NOAA GFS high-resolution models)
- **Telemetry Ingested**:
  - `temperature_2m`: Ambient dry-bulb temperature (°C)
  - `relative_humidity_2m`: Ambient moisture (%)
  - `wind_speed_10m` & `wind_direction_10m`: Horizontal ventilation vector (m/s & compass azimuth)
  - `surface_pressure`: Barometric atmospheric pressure (hPa)
  - `boundary_layer_height`: Planetary boundary layer depth (meters) — critical for thermal inversion cap diagnostics
  - `precipitation`: Real-time rain rate (mm/h) for atmospheric particulate wet scavenging

### Open-Meteo Geocoding API
- **Endpoint**: `https://geocoding-api.open-meteo.com/v1/search`
- **Authentication**: **None required**
- **Functionality**: Real-time city, territory, and station coordinate resolution with decimal coordinate matching.

---

## 2. Meta AI Model Integration (Meta Global AI Hackathon)

### Meta LLaMA 3.3 70B Environmental Copilot
- **Variable**: `META_API_KEY`
- **Endpoint Variable**: `META_LLAMA_ENDPOINT` (default: `https://api.meta.ai/v1/chat/completions`)
- **Status**: **Fully Architected with Grounded RAG Pipeline**
- **Usage**:
  1. If `META_API_KEY` is provided, requests are routed directly to the Meta model inference endpoint.
  2. If `META_API_KEY` is omitted, the platform uses the server-side `@google/genai` (Gemini 2.5 Flash) engine with strictly identical grounding data (WMO GAW, WHO 2021 guidelines, ECMWF boundary layer heights) so the system never fails or invents information.

### Meta SAM 3.1 Vision AI (Segment Anything Model)
- **Architecture**: ViT-H Transformer segmentation pipeline
- **Implementation**: Decomposes sky tropospheric deck, particulate haze / aerosol plume boundaries, and ground canopy.
- **Scientific Integrity Policy**: RGB visual segmentation is qualitative optical scattering analysis; the platform strictly disclaims that physical microgram mass concentration cannot be inferred from RGB images alone.

---

## 3. High-Tier & Optional Keys

### OpenAQ v3 API
- **Variable**: `OPENAQ_API_KEY`
- **Header**: `X-API-Key: $OPENAQ_API_KEY`
- **Registration**: [https://explore.openaq.org/register](https://explore.openaq.org/register)
- **Status**: Optional. Basic ground sensor telemetry is retrieved without key; key lifts rate limits for enterprise sensor streams.
