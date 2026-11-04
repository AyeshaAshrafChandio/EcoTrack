# EcoTrack — API Keys & External Credentials Guide

This document details all external services utilized by the **EcoTrack Global Environmental Intelligence platform**, their authentication requirements, zero-cost tiers, and hackathon compliance posture for the **Meta Global AI Developer Hackathon 2026** ("Build for Your World" / Indie Developer Track).

---

## 1. Zero-Cost Public Environmental Data Providers (100% Free, No Key Required)

EcoTrack relies entirely on authoritative public scientific open data feeds that require **no registration, no credit card, and zero API keys**:

### Open-Meteo Air Quality API
- **Endpoint**: `https://air-quality-api.open-meteo.com/v1/air-quality`
- **Authentication**: **None required (Public Open Data)**
- **Coverage**: Global planetary coverage (0.1° resolution)
- **Model Provenance**: CAMS (Copernicus Atmosphere Monitoring Service) & ECMWF atmospheric dispersion modeling
- **Telemetry Ingested**:
  - `pm2_5`: Particulate matter ≤ 2.5 µm (µg/m³)
  - `pm10`: Particulate matter ≤ 10 µm (µg/m³)
  - `nitrogen_dioxide`: NO₂ (µg/m³)
  - `ozone`: Ground-level O₃ (µg/m³)
  - `sulphur_dioxide`: SO₂ (µg/m³)
  - `carbon_monoxide`: CO (µg/m³)
  - `dust`: Aeolian mineral dust (µg/m³)
  - `us_aqi`: Official EPA 40 CFR 58 Air Quality Index
  - `european_aqi`: European Air Quality Index
- **Update Frequency**: Hourly forward model assimilation

### Open-Meteo Physical Meteorology Forecast API
- **Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Authentication**: **None required (Public Open Data)**
- **Coverage**: Global (ECMWF & NOAA GFS high-resolution models)
- **Telemetry Ingested**:
  - `temperature_2m`: Ambient dry-bulb temperature (°C)
  - `relative_humidity_2m`: Ambient moisture (%) — critical for aerosol hygroscopic swelling
  - `wind_speed_10m` & `wind_direction_10m`: Horizontal ventilation vector (km/h & compass azimuth)
  - `surface_pressure`: Barometric atmospheric pressure (hPa)
  - `boundary_layer_height`: Planetary boundary layer depth (meters) — critical for thermal inversion cap diagnostics
  - `precipitation`: Real-time rain rate (mm/h) for atmospheric particulate wet scavenging

### Open-Meteo Geocoding API
- **Endpoint**: `https://geocoding-api.open-meteo.com/v1/search`
- **Authentication**: **None required**
- **Functionality**: Global city, territory, and station coordinate resolution with decimal coordinate matching.

### OpenStreetMap & CartoDB Dark Matter Tiles
- **Endpoint**: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
- **Authentication**: Free open-source map tile distribution with proper OpenStreetMap attribution.

---

## 2. Meta AI Model Inference (Cloudflare Workers AI Free Tier)

EcoTrack integrates Meta's open-weight model family strictly using **Cloudflare Workers AI Free Tier** or a **Local Ollama** instance.

### Primary Cloud Provider: Cloudflare Workers AI
- **Model ID**: `@cf/meta/llama-3.2-3b-instruct`
- **Meta Architecture**: Meta LLaMA 3.2 3B Instruct (Open-Weight Model)
- **Free Tier Allowance**: **10,000 Neurons per day free forever** (Zero credit card or billing activation required)
- **Required Environment Variables**:
  ```bash
  CLOUDFLARE_ACCOUNT_ID="your_cloudflare_account_id"
  CLOUDFLARE_API_TOKEN="your_workers_ai_api_token"
  ```
- **How to Obtain Cloudflare Free Credentials**:
  1. Sign up for a free Cloudflare account at [dash.cloudflare.com](https://dash.cloudflare.com) (no credit card required).
  2. Navigate to **Workers & Pages** → Copy your **Account ID** from the right sidebar.
  3. Go to **My Profile** → **API Tokens** → **Create Token** → Select **Workers AI Read** template.
  4. Paste your Account ID and API Token into your `.env` file.

### Local Development / Demo Fallback: Ollama
- **Model**: `llama3.2:3b`
- **Endpoint**: `http://localhost:11434/api/chat`
- **Authentication**: None (100% offline, local machine execution)
- **Setup**:
  ```bash
  curl -fsSL https://ollama.com/install.sh | sh
  ollama run llama3.2:3b
  ```
- If Cloudflare credentials are unset, EcoTrack automatically queries the local Ollama daemon or provides an exact step-by-step diagnostic explaining how to configure the free Cloudflare credentials.

---

## 3. Geographic Compliance & Meta Policy Disclosure

### Pakistan Deployment Policy Compliance
- **Direct Meta Model API**: Pakistan is designated as a Restricted Territory under Meta's Model API Model Designation and Geographic Use Policy. EcoTrack strictly adheres to this policy: **it does not use the direct Meta Model API from Pakistan and never uses VPNs, proxies, or location spoofing**.
- **Open-Weight Model Qualification**: EcoTrack operates Meta's open-weight model (`@cf/meta/llama-3.2-3b-instruct`) hosted independently on Cloudflare Workers AI Free Tier (and locally via Ollama). This model was created by Meta and released under the Meta Llama 3.2 Community License.
- **Hackathon Status**: This implementation is transparently disclosed for hackathon organizer evaluation.

---

## 4. Removed & Disallowed Providers

The following services have been **completely eliminated** from EcoTrack:
- ❌ **Together AI (`TOGETHER_API_KEY`)**: Removed (paid platform).
- ❌ **Direct Meta Model API (`META_API_KEY`)**: Removed (regional compliance in Pakistan).
- ❌ **OpenAQ (`OPENAQ_API_KEY`)**: Removed (rate limits & paid enterprise tiers).
- ❌ **Google Gemini API (`GEMINI_API_KEY`)**: Removed (non-Meta provider).
- ❌ **Groq (`GROQ_API_KEY`)**: Removed (replaced by Cloudflare Workers AI free tier).
- ❌ **Firebase Auth / Firestore (`firebase`, `firebase-admin`)**: Removed (replaced by lightweight, zero-dependency local operator sessions).
- ❌ **Fake SAM 3.1 Overlays**: Removed (replaced by honest visual inspection and scientific integrity disclosures).
