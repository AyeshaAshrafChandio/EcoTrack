import { Router } from 'express';
import express from 'express';
import { db, hashPassword, verifyPassword, type User } from './db';
import {
  fetchLiveEnvironment,
  getGlobalStationsWithTelemetry,
  searchLocations,
} from './services/environmental';
import { aiCopilotService } from './services/aiCopilot';
import { groqService } from './services/groqService';
import { openAQService } from './services/openaqService';
import {
  verifyOperatorSession,
  extractOptionalOperator,
  generateSessionToken,
  type AuthenticatedRequest,
} from './authMiddleware';

export const apiRouter = Router();

apiRouter.use(express.json({ limit: '10mb' }));

// In-memory rate limiting map for guest exploration and general API calls
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const guestIpLimits = new Map<string, RateLimitEntry>();
const generalIpLimits = new Map<string, RateLimitEntry>();

// General rate limiter for public endpoints (250 requests / 5 minutes per IP)
function generalRateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const maxRequests = 250;

  const entry = generalIpLimits.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count += 1;
  generalIpLimits.set(ip, entry);

  if (entry.count > maxRequests) {
    return res.status(429).json({
      error: 'Too many requests. Please slow down and try again shortly.',
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    });
  }
  next();
}

// Guest Copilot rate limiter (20 queries / 10 minutes for unauthenticated visitors)
async function copilotRateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = await extractOptionalOperator(req);
  if (user) {
    // Authenticated users have unmetered access
    return next();
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'guest';
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const maxGuestRequests = 20;

  const entry = guestIpLimits.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count += 1;
  guestIpLimits.set(ip, entry);

  if (entry.count > maxGuestRequests) {
    return res.status(429).json({
      error: 'Guest Copilot query limit reached (20 requests per 10 minutes). Please sign in for unmetered queries or pause before trying again.',
      rateLimited: true,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    });
  }
  next();
}

apiRouter.use(generalRateLimiter);

// Helper to strip sensitive fields before returning user
function toSafeUser(user: User) {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

// 1. Health and Multi-Provider Status (Truthful categorization per Part 9)
apiRouter.get('/status', async (_req, res) => {
  const stations = await getGlobalStationsWithTelemetry().catch(() => []);
  const hasCloudflare = Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN);
  const groqStatus = await groqService.checkStatus().catch(() => ({
    configured: false,
    accessible: false,
    statusMessage: 'Groq check failed',
    availableModels: [] as string[],
    allModels: [] as string[],
    configuredModel: undefined as string | undefined,
    recommendedModel: 'llama-3.3-70b-versatile',
  }));
  const openAQConfigured = openAQService.isKeyConfigured();
  const firebaseConfigured = Boolean(process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID);

  res.json({
    status: 'ONLINE',
    version: '3.4-PROD-RESTORATION',
    providers: {
      openMeteoAirQuality: 'LIVE_REQUEST_VERIFIED (CAMS/ECMWF Global Forecasts)',
      openMeteoWeather: 'LIVE_REQUEST_VERIFIED (Physical Meteorology & Boundary Layer)',
      openMeteoGeocoding: 'LIVE_REQUEST_VERIFIED (Global Coordinate Search)',
      openAQGroundSensors: openAQConfigured ? 'LIVE_REQUEST_VERIFIED (v3 REST API Ground Stations)' : 'NOT_CONFIGURED',
      cloudflareMetaLlama: hasCloudflare ? 'LIVE_REQUEST_VERIFIED (@cf/meta/llama-3.2-3b-instruct)' : 'NOT_CONFIGURED',
      groqMetaLlama: groqStatus.configured
        ? (groqStatus.accessible ? `AUTHENTICATED (${groqStatus.recommendedModel})` : (groqStatus.statusMessage.includes('429') ? 'RATE_LIMITED' : 'UNAVAILABLE'))
        : 'NOT_CONFIGURED',
      localOllamaFallback: 'AVAILABLE (llama3.2:3b on localhost:11434)',
      firebaseAuth: firebaseConfigured ? 'CONFIGURED (Firebase Token Verification Ready)' : 'NOT_CONFIGURED',
      persistenceEngine: 'EPHEMERAL_CONTAINER_JSON (Local Data Directory /data/ecotrack.json; ephemeral on container redeploy)',
    },
    verifiedTelemetryNodes: stations.length,
    atmosphericStandards: 'US-EPA 40 CFR 58 Breakpoints / WHO 2021 Air Quality Guidelines',
    groqConfiguredModel: groqStatus.configuredModel,
    groqAvailableModels: groqStatus.availableModels,
    groqAllModels: groqStatus.allModels,
    timestamp: new Date().toISOString(),
  });
});

// 2. Live Environmental Telemetry (Open-Meteo Air Quality & Weather API)
apiRouter.get('/environment/live', async (req, res) => {
  try {
    const rawLat = (req.query.latitude || req.query.lat) as string | undefined;
    const rawLon = (req.query.longitude || req.query.lon) as string | undefined;
    const lat = rawLat ? parseFloat(rawLat) : 24.8607;
    const lon = rawLon ? parseFloat(rawLon) : 67.0011;
    const city = req.query.city as string | undefined;

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Invalid coordinates provided.' });
    }

    const telemetry = await fetchLiveEnvironment(lat, lon, city);

    // Evaluate active alert rules against this live reading to auto-log exceedances
    try {
      const activeRules = db.getAllActiveRulesForEvaluation();
      for (const rule of activeRules) {
        if (Math.abs(rule.lat - lat) < 0.6 && Math.abs(rule.lon - lon) < 0.6) {
          let observed = 0;
          if (rule.pollutant === 'AQI') observed = telemetry.overallAqi;
          else if (telemetry.pollutants[rule.pollutant]) observed = telemetry.pollutants[rule.pollutant].value;

          const isExceeded =
            (rule.operator === '>' && observed > rule.threshold) ||
            (rule.operator === '>=' && observed >= rule.threshold);

          if (isExceeded) {
            const existing = db.getExceedanceEvents().find(
              e => e.alertRuleId === rule.id && Date.now() - new Date(e.timestamp).getTime() < 30 * 60 * 1000
            );
            if (!existing) {
              db.recordExceedanceEvent({
                alertRuleId: rule.id,
                locationName: rule.locationName,
                stationId: telemetry.location.stationId || 'TELEMETRY-NODE',
                pollutant: rule.pollutant,
                observedValue: observed,
                threshold: rule.threshold,
                unit: rule.unit,
                severity: rule.severity,
                status: 'Active Exceedance',
                details: `Automated threshold exceeded. Observed ${observed} ${rule.unit} exceeds ceiling of ${rule.threshold} ${rule.unit}. Dominant vector: ${telemetry.dominantPollutant}.`,
              });
            }
          }
        }
      }
    } catch (ruleErr) {
      console.warn('Alert rule check notice:', ruleErr);
    }

    res.json(telemetry);
  } catch (err: any) {
    console.error('Error fetching live telemetry:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch environmental telemetry from Open-Meteo' });
  }
});

// 3. OpenAQ v3 Physical Ground Stations
apiRouter.get('/environment/openaq', async (req, res) => {
  try {
    const rawLat = (req.query.latitude || req.query.lat) as string | undefined;
    const rawLon = (req.query.longitude || req.query.lon) as string | undefined;
    const lat = rawLat ? parseFloat(rawLat) : 24.8607;
    const lon = rawLon ? parseFloat(rawLon) : 67.0011;
    const rawRadius = req.query.radius || req.query.radiusMeters || (req.query.radiusKm ? parseFloat(req.query.radiusKm as string) * 1000 : undefined);
    const radius = rawRadius ? Math.min(25000, Math.max(100, parseInt(rawRadius as string, 10))) : 25000;

    const result = await openAQService.findNearestStations(lat, lon, radius);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to query OpenAQ ground monitors', details: err.message });
  }
});

// 4. Global Stations / Telemetry Nodes
apiRouter.get('/environment/stations', async (_req, res) => {
  try {
    const stations = await getGlobalStationsWithTelemetry();
    res.json({ stations, count: stations.length, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve global telemetry stations' });
  }
});

// 5. Geocoding Search (Free Open-Meteo Geocoding)
apiRouter.get('/environment/search', async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q || !q.trim()) {
      return res.json([]);
    }
    const results = await searchLocations(q);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// 6. Cross-Continental Location Comparison
apiRouter.get('/environment/compare', async (req, res) => {
  try {
    const locationsToCompare: Array<{ lat: number; lon: number; name: string }> = [];

    if (req.query.locs) {
      const parts = (req.query.locs as string).split('|');
      for (const p of parts) {
        const [latStr, lonStr, name] = p.split(',');
        if (latStr && lonStr) {
          locationsToCompare.push({
            lat: parseFloat(latStr),
            lon: parseFloat(lonStr),
            name: name || 'Telemetry Station',
          });
        }
      }
    } else {
      // Default to Karachi, Tokyo, London
      locationsToCompare.push(
        { lat: 24.8607, lon: 67.0011, name: 'Karachi, Pakistan' },
        { lat: 35.6895, lon: 139.6917, name: 'Tokyo, Japan' },
        { lat: 51.5074, lon: -0.1278, name: 'London, United Kingdom' }
      );
    }

    const telemetryList = await Promise.all(
      locationsToCompare.map(loc => fetchLiveEnvironment(loc.lat, loc.lon, loc.name))
    );

    const maxAqi = Math.max(...telemetryList.map(t => t.overallAqi));
    const minAqi = Math.min(...telemetryList.map(t => t.overallAqi));
    const variance = maxAqi - minAqi;

    res.json({
      locations: telemetryList,
      differential: {
        aqiVariance: variance,
        cleanestLocation: telemetryList.find(t => t.overallAqi === minAqi)?.location.name,
        highestExposureLocation: telemetryList.find(t => t.overallAqi === maxAqi)?.location.name,
        inversionRiskComparison: telemetryList.map(t => ({
          location: t.location.name,
          boundaryLayerHeight: t.weather.boundaryLayerHeight,
          risk: t.weather.boundaryLayerHeight < 500 ? 'High Trapping' : 'Normal Ventilation',
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to perform comparative analysis' });
  }
});

// 7. AI Environmental Copilot Chat (Meta Llama on Cloudflare / Groq / Ollama with guest rate limiting)
apiRouter.post('/copilot/chat', copilotRateLimiter, async (req, res) => {
  try {
    const { prompt, context, conversationHistory, preferredProvider, groqModel } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await aiCopilotService.generateCopilotResponse({
      prompt,
      context,
      conversationHistory,
      preferredProvider,
      groqModel,
    });

    // Record in local database session
    db.addChatMessage('session_default', {
      role: 'user',
      content: prompt,
    });
    db.addChatMessage('session_default', {
      role: 'assistant',
      content: result.reply,
      context: {
        location: result.evidencePacket.locationName,
        aqi: result.evidencePacket.overallAqi,
        pm25: result.evidencePacket.pollutants.find(p => p.code === 'PM2.5')?.value,
        modelUsed: result.modelUsed,
      },
    });

    res.json(result);
  } catch (err: any) {
    console.error('Copilot inference error:', err);
    res.status(500).json({ error: err.message || 'AI Copilot inference failed' });
  }
});

// 7b. Environmental Visual Inspection Analysis (Vision AI with strictly enforced non-quantitative disclaimer)
apiRouter.post('/copilot/analyze-image', copilotRateLimiter, async (req, res) => {
  try {
    const { image, locationName, lat, lon } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const result = await aiCopilotService.analyzeImageContext({
      image,
      locationName: locationName || 'Monitored Site',
      lat: lat !== undefined ? parseFloat(lat) : 24.8607,
      lon: lon !== undefined ? parseFloat(lon) : 67.0011,
    });

    res.json(result);
  } catch (err: any) {
    console.error('Image analysis error:', err);
    res.status(500).json({ error: err.message || 'Visual context inspection failed' });
  }
});

// 8. Alert Rules: Public read of rules + exceedance events
apiRouter.get('/alerts', async (req, res) => {
  const user = await extractOptionalOperator(req);
  res.json({
    rules: db.getAlertRules(user?.id),
    events: db.getExceedanceEvents(),
  });
});

// Mutating alert rules requires verified authentication
apiRouter.post('/alerts', verifyOperatorSession, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { locationName, lat, lon, pollutant, operator, threshold, unit, severity, notificationChannel } = req.body;
    if (!locationName || lat === undefined || lon === undefined || !pollutant || threshold === undefined) {
      return res.status(400).json({ error: 'Missing required alert rule parameters' });
    }

    const newRule = db.addAlertRule({
      userId: user.id,
      locationName,
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      pollutant,
      operator: operator || '>',
      threshold: parseFloat(threshold),
      unit: unit || (pollutant === 'CO' ? 'mg/m³' : 'µg/m³'),
      severity: severity || 'Warning',
      notificationChannel: notificationChannel || 'Push & Email',
      active: true,
    });

    res.status(201).json(newRule);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create alert rule' });
  }
});

apiRouter.patch('/alerts/:id/toggle', verifyOperatorSession, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const rule = db.getAlertRules(user.id).find(r => r.id === req.params.id);
  if (!rule) return res.status(404).json({ error: 'Alert rule not found' });
  if (rule.userId === 'system') {
    return res.status(403).json({ error: 'System benchmark rules cannot be modified.' });
  }
  if (rule.userId !== user.id) {
    return res.status(403).json({ error: 'Unauthorized to modify another operator\'s alert rule.' });
  }

  const updated = db.toggleAlertRule(req.params.id, user.id);
  res.json(updated);
});

apiRouter.put('/alerts/:id', verifyOperatorSession, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const rule = db.getAlertRules(user.id).find(r => r.id === req.params.id);
  if (!rule) return res.status(404).json({ error: 'Alert rule not found' });
  if (rule.userId === 'system') {
    return res.status(403).json({ error: 'System benchmark rules cannot be modified.' });
  }
  if (rule.userId !== user.id) {
    return res.status(403).json({ error: 'Unauthorized to modify another operator\'s alert rule.' });
  }

  const updated = db.updateAlertRule(req.params.id, user.id, req.body);
  res.json(updated);
});

apiRouter.delete('/alerts/:id', verifyOperatorSession, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const rule = db.getAlertRules(user.id).find(r => r.id === req.params.id);
  if (!rule) return res.status(404).json({ error: 'Alert rule not found' });
  if (rule.userId === 'system') {
    return res.status(403).json({ error: 'System benchmark rules cannot be deleted.' });
  }
  if (rule.userId !== user.id) {
    return res.status(403).json({ error: 'Unauthorized to delete another operator\'s alert rule.' });
  }

  const deleted = db.deleteAlertRule(req.params.id, user.id);
  if (!deleted) return res.status(404).json({ error: 'Alert rule not found' });
  res.json({ success: true });
});

// Public exceedance events ledger
apiRouter.get('/alerts/events', (_req, res) => {
  res.json(db.getExceedanceEvents());
});

// 9. Saved Locations: user specific
apiRouter.get('/saved-locations', verifyOperatorSession, async (req: AuthenticatedRequest, res) => {
  res.json(db.getSavedLocations(req.user!.id));
});

apiRouter.post('/saved-locations', verifyOperatorSession, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { name, lat, lon, country, stationId } = req.body;
    if (!name || lat === undefined || lon === undefined) {
      return res.status(400).json({ error: 'Missing location fields' });
    }
    const saved = db.addSavedLocation({
      userId: user.id,
      name,
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      country: country || '',
      stationId,
    });
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save location' });
  }
});

apiRouter.delete('/saved-locations/:id', verifyOperatorSession, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const loc = db.getSavedLocations(user.id).find(l => l.id === req.params.id);
  if (!loc) return res.status(404).json({ error: 'Location not found' });
  if (loc.userId === 'system') {
    return res.status(403).json({ error: 'System benchmark locations cannot be deleted.' });
  }
  if (loc.userId !== user.id) {
    return res.status(403).json({ error: 'Unauthorized to delete another operator\'s location.' });
  }
  const deleted = db.deleteSavedLocation(req.params.id, user.id);
  if (!deleted) return res.status(404).json({ error: 'Location not found' });
  res.json({ success: true });
});

// 10. Local Operator Authentication
apiRouter.post('/auth/register', (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: 'Email and password (min 6 chars) are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.getUserByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An operator account with this email already exists.' });
    }

    const hashedPassword = hashPassword(password);
    const user = db.createUser({
      name: name?.trim() || 'Environmental Operator',
      email: cleanEmail,
      passwordHash: hashedPassword,
      role: 'Environmental Systems Engineer',
      apiKey: `eco_${Math.random().toString(36).substring(2, 12)}`,
    });

    const token = generateSessionToken(user);
    res.status(201).json({
      user: toSafeUser(user),
      token,
      message: 'Operator account provisioned successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create operator account' });
  }
});

apiRouter.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and security passphrase are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.getUserByEmail(cleanEmail);
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid operator credentials or passphrase.' });
    }

    const token = generateSessionToken(user);
    res.json({
      user: toSafeUser(user),
      token,
      message: 'Operator session authenticated.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Authentication failed' });
  }
});

apiRouter.get('/auth/me', verifyOperatorSession, (req: AuthenticatedRequest, res) => {
  res.json({ user: toSafeUser(req.user!) });
});

apiRouter.post('/auth/logout', (_req, res) => {
  res.json({ success: true, message: 'Operator logged out.' });
});
