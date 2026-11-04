# EcoTrack — Planetary Environmental Intelligence Platform

> **Meta Global AI Developer Hackathon 2026**  
> **Track**: Indie Developer  
> **Primary Theme**: Build for Your World  
> **Repository**: [AyeshaAshrafChandio/EcoTrack](https://github.com/AyeshaAshrafChandio/EcoTrack)  
> **License**: MIT  

EcoTrack is a production-grade environmental intelligence platform unifying real-time global atmospheric dispersion modeling, physical meteorology, and **Meta's open-weight Llama 3.2 3B** AI model to deliver hyper-local environmental reasoning, cross-continental comparative matrices, and automated exceedance alerting across 8 comprehensive operational screens.

---

## 🌟 Executive Summary & Hackathon Vision

Industrialization, agricultural burning, and geographic thermal inversions subject billions across the Global South and vulnerable ecosystems to hazardous particulate pollution. Existing consumer tools either display lagged single-number index aggregates or hide critical atmospheric speciation behind paid commercial paywalls.

**EcoTrack solves this by**:
1. **Unifying 100% Free Public Environmental Data**: Ingesting real-time atmospheric speciation (PM2.5, PM10, NO₂, Ground O₃, SO₂, CO, and Aeolian Dust) and physical meteorological parameters (Planetary Boundary Layer inversion heights, wet scavenging precipitation, and ventilation advection vectors) from Open-Meteo's CAMS/ECMWF global models — **with zero API keys or costs**.
2. **Evidence-Grounded Meta AI Reasoning**: Deploying Meta's open-weight **Llama 3.2 3B Instruct** model via the **Cloudflare Workers AI Free Tier** (10,000 Neurons/day free forever) and a local zero-key **Ollama** engine. Telemetry is verified, structured into a formal evidence packet, and piped into the model, enforcing zero hallucinations and transparent scientific reasoning in both **English and Urdu (اردو)**.
3. **Scientific Integrity**: Eliminating fake AI overlays and misleading computer-vision claims (disclosing that physical microgram mass concentrations cannot be calculated from RGB pixels) and clearly distinguishing dispersion forecasts from physical ground monitors.
4. **Complete Independence**: 100% free operation with no credit cards, no billing traps, no paid cloud subscriptions, and zero external database vendors.

---

## 🏛️ Architecture & Eight Core Modules

EcoTrack provides 8 complete, responsive screens designed with a dark command-center aesthetic:

1. **Screen 1: Global AI Environmental Intelligence Home (`/home`)**  
   Interactive planetary hero, real-time live search with Open-Meteo Geocoding, verified station grid (including Karachi, Lahore, Tokyo, New York, Delhi, London, etc.), and atmospheric speciation metrics.

2. **Screen 2: Environmental Telemetry Dashboard & Forecast (`/dashboard`)**  
   24-hour hourly forward forecasts, multi-pollutant breakdown with EPA 40 CFR 58 calculations, WHO 2021 guideline ceilings, barometric pressure, boundary layer height, and thermal inversion risk detection.

3. **Screen 3: Global Pollution Map (`/map`)**  
   Full-screen interactive Leaflet map using CartoDB Dark Matter tiles, heat-mapped station pins, live location searching, and interactive telemetry drawer.

4. **Screen 4: AI Environmental Copilot & Scientific Inspection (`/copilot`)**  
   Meta Llama 3.2 3B environmental reasoning engine with one-click prompt chips, bilingual support (English + Urdu), structured telemetry evidence drawer, and honest visual inspection tool with scientific disclaimer.

5. **Screen 5: Cross-Continental Location Comparison (`/compare`)**  
   Side-by-side multi-pollutant delta analysis between any two global cities, comparing AQI differential, particulate ratios, and meteorological ventilation.

6. **Screen 6: Environmental Alerts & Exceedances (`/alerts`)**  
   Custom threshold alert builder for PM2.5, PM10, NO₂, O₃, and AQI with live simulated evaluation against current atmospheric readings.

7. **Screen 7: Portal Authentication & Operator Sign-In (`/auth`)**  
   Clean institutional operator sign-in with instant demo mode for judges and reviewers.

8. **Screen 8: Node Provisioning & Account Creation (`/register`)**  
   Institutional research node onboarding with secure local PBKDF2 credential generation and atomic JSON persistence.

---

## 🤖 Meta AI Model Integration & Hackathon Compliance

### Model Details
- **Model**: `Meta Llama 3.2 3B Instruct` (`@cf/meta/llama-3.2-3b-instruct` on Cloudflare / `llama3.2:3b` on Ollama)
- **Role in EcoTrack**:
  - Ingests structured environmental evidence packets containing real-time PM2.5, PM10, NO₂, O₃, AQI, Planetary Boundary Layer height, and wind speeds.
  - Generates actionable human health mitigation recommendations, vulnerable population warnings (asthma, COPD, pediatric), and atmospheric physics assessments (e.g., thermal inversion traps).
  - Communicates natively in English and Urdu (`اردو`).

### Pakistan Geographic Policy Compliance & Transparency
- **Geographic Use Policy**: Under Meta's Model API Model Designation and Geographic Use Policy, direct access to the Meta Model API is restricted in Pakistan. EcoTrack strictly adheres to this policy and **does not use VPNs, proxies, or alternate location spoofing to bypass regional controls**.
- **Open-Weight Model Qualification**: EcoTrack operates Meta's open-weight model (`@cf/meta/llama-3.2-3b-instruct`) hosted independently on Cloudflare Workers AI Free Tier (or via local Ollama). This model was created by Meta and released under the Meta Llama 3.2 Community License.
- **Hackathon Transparency**: We explicitly disclose this hosting architecture for the hackathon organizers' review.

---

## 🔑 Environment Variables & Setup

Create a `.env` file in the project root:

```bash
# Cloudflare Workers AI (10,000 Neurons/day free forever, no credit card required)
CLOUDFLARE_ACCOUNT_ID="your_cloudflare_account_id"
CLOUDFLARE_API_TOKEN="your_workers_ai_api_token"

# Optional: Local Ollama URL (default: http://localhost:11434)
OLLAMA_BASE_URL="http://localhost:11434"
```

### How to Get Free Cloudflare Credentials in 2 Minutes:
1. Create a free account at [dash.cloudflare.com](https://dash.cloudflare.com) (no billing info required).
2. Click **Workers & Pages** in the left sidebar and copy your **Account ID** from the right column.
3. Click **My Profile** (top right) → **API Tokens** → **Create Token** → Select **Workers AI (Read)** template.
4. Save the token and paste it into `.env`.

*Note: If credentials are not yet configured, the Copilot interface displays an actionable diagnostic explaining how to set them or how to run Ollama locally for offline demos.*

---

## 🚀 Quickstart & Verification

```bash
# 1. Install dependencies
npm install

# 2. Run the full-stack development server
npm run dev

# 3. Build for production
npm run build
```

EcoTrack runs locally on `http://localhost:3000`.

---

## 🧪 Scientific Integrity & Decommissioned Services

In accordance with strict scientific and engineering rigor:
- ❌ **Removed Together AI & Groq**: Avoided paid dependencies or non-Meta LLMs.
- ❌ **Removed Direct Meta Model API**: Ensured full regional policy compliance in Pakistan.
- ❌ **Removed OpenAQ**: Eliminated API key bottlenecks and unstable sensor rate limits.
- ❌ **Removed Firebase**: Replaced with clean local operator session management.
- ❌ **Eliminated Fake SAM 3.1 & Image AQI**: Removed misleading visual bounding boxes claiming to compute particulate micrograms from RGB pixels.
- ✅ **Added Open-Meteo Provenance Disclosure**: Clearly indicated all forecasts originate from CAMS and ECMWF atmospheric dispersion models.
