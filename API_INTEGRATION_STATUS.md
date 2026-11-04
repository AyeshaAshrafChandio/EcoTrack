# EcoTrack — API Integration Status Report

| Service / Provider | Integration Type | Authentication | Status | Fallback Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Open-Meteo Air Quality** | Real-time REST API | No Key Required | **LIVE & OPERATIONAL** | 3-minute in-memory LRU cache |
| **Open-Meteo Weather Forecast** | Physical Meteorology REST | No Key Required | **LIVE & OPERATIONAL** | 3-minute in-memory LRU cache |
| **Open-Meteo Geocoding** | Geospatial Search API | No Key Required | **LIVE & OPERATIONAL** | Direct coordinate parser fallback |
| **Meta LLaMA 3.3 70B** | Meta AI Inference / RAG | `META_API_KEY` | **ARCHITECTED & GROUNDED** | Server-side Gemini 2.5 Flash Grounded Engine |
| **Meta SAM 3.1 Vision AI** | Atmospheric Segmentation | ViT-H Model Pipeline | **OPERATIONAL & COMPLIANT** | Qualitative optical opacity analysis |
| **OpenAQ v3 Ground Sensors** | Reference Stations | `OPENAQ_API_KEY` (Opt) | **OPERATIONAL** | Open-Meteo CAMS/ECMWF node mesh |
| **Leaflet / CartoDB Dark Matter**| Map Canvas & Tiles | Open Source / Free CDN | **LIVE & OPERATIONAL** | OpenStreetMap dark tiles |
| **EcoTrack Persistence Engine**| Atomic Database (JSON) | Internal Server Storage | **ACTIVE & PERSISTED** | In-memory with atomic write-sync |

---

## Data Freshness & Epistemic Standards

1. **Zero Mock Policy**:
   - Random or simulated AQI / pollutant numbers have been eradicated from the application.
   - All values shown on the Dashboard, Map, Compare, and Home views originate from live external data feeds or official reference stations.

2. **Standard Harmonization**:
   - US-EPA standard AQI sub-indices calculated using strict 40 CFR Part 58 linear breakpoint tables for PM2.5, PM10, NO2, O3, SO2, and CO.
   - WHO 2021 air quality guideline targets clearly contrasted with percentage ceilings.

3. **Atmospheric Physics Grounding**:
   - AI Copilot responses are contextualized with planetary boundary layer height (inversion caps), relative humidity aerosol swelling, and wind advection vectors.
