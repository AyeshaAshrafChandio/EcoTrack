import { Router } from 'express';
import express from 'express';
import { db, hashPassword, verifyPassword, type User } from './db';
import {
  fetchLiveEnvironment,
  getGlobalStationsWithTelemetry,
  searchLocations,
  fetchOpenAQData,
} from './services/environmental';
import { metaAIService } from './services/metaAI';
import {
  verifyFirebaseToken,
  extractOptionalUser,
  isFirebaseAdminInitialized,
  type AuthenticatedRequest,
} from './authMiddleware';

export const apiRouter = Router();

apiRouter.use(express.json({ limit: '10mb' }));

// Health and provider status
apiRouter.get('/status', async (_req, res) => {
  const stations = await getGlobalStationsWithTelemetry().catch(() => []);
  res.json({
    status: 'ONLINE',
    version: '3.4-AI',
    providers: {
      openMeteoAirQuality: 'OPERATIONAL',
      openMeteoWeather: 'OPERATIONAL',
      openMeteoGeocoding: 'OPERATIONAL',
      copernicusAtmosphere: 'OPERATIONAL',
      openaqV3: process.env.OPENAQ_API_KEY ? 'AUTHENTICATED' : 'PUBLIC_OPEN_ACCESS',
      metaAI: (process.env.META_API_KEY || process.env.GROQ_API_KEY) ? 'AUTHENTICATED' : 'BLOCKED_NO_API_KEY',
      firebaseAuth: isFirebaseAdminInitialized() ? 'ACTIVE' : 'READY_AWAITING_PROJECT_ID',
      database: 'LOCAL_JSON_PERSISTENCE (PostgreSQL not connected)',
    },
    verifiedStationNodes: stations.length,
    calibrationStandard: 'US-EPA 40 CFR 58 / WHO 2021',
    timestamp: new Date().toISOString(),
  });
});

// OpenAQ v3 live query endpoint
apiRouter.get('/environment/openaq', async (req, res) => {
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
  const lon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;
  const radius = req.query.radius ? parseFloat(req.query.radius as string) : 25;
  const result = await fetchOpenAQData(lat, lon, radius);
  res.json(result);
});

// Protected endpoint to verify Firebase ID tokens
apiRouter.get('/auth/verify-token', verifyFirebaseToken, (req: AuthenticatedRequest, res) => {
  res.json({
    authenticated: true,
    user: req.user,
    message: 'Firebase ID token successfully verified by backend.',
    timestamp: new Date().toISOString(),
  });
});

// Live environmental telemetry
apiRouter.get('/environment/live', async (req, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 35.6895;
    const lon = req.query.lon ? parseFloat(req.query.lon as string) : 139.6917;
    const city = req.query.city as string | undefined;

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Invalid coordinates provided.' });
    }

    const telemetry = await fetchLiveEnvironment(lat, lon, city);

    // Evaluate active alert rules against this live reading to auto-log any exceedances!
    try {
      const activeRules = db.getAlertRules().filter(r => r.active);
      for (const rule of activeRules) {
        if (Math.abs(rule.lat - lat) < 0.5 && Math.abs(rule.lon - lon) < 0.5) {
          let observed = 0;
          if (rule.pollutant === 'AQI') observed = telemetry.overallAqi;
          else if (telemetry.pollutants[rule.pollutant]) observed = telemetry.pollutants[rule.pollutant].value;

          const isExceeded =
            (rule.operator === '>' && observed > rule.threshold) ||
            (rule.operator === '>=' && observed >= rule.threshold);

          if (isExceeded) {
            // Check if recent event already recorded in last 30 minutes
            const existing = db.getExceedanceEvents().find(
              e => e.alertRuleId === rule.id && Date.now() - new Date(e.timestamp).getTime() < 30 * 60 * 1000
            );
            if (!existing) {
              db.recordExceedanceEvent({
                alertRuleId: rule.id,
                locationName: rule.locationName,
                stationId: telemetry.location.stationId || 'GROUND-NODE',
                pollutant: rule.pollutant,
                observedValue: observed,
                threshold: rule.threshold,
                unit: rule.unit,
                severity: rule.severity,
                status: 'Active Exceedance',
                details: `Automated sensor exceedance triggered. Observed ${observed} ${rule.unit} exceeds ceiling of ${rule.threshold} ${rule.unit}. Dominant vector: ${telemetry.dominantPollutant}.`,
              });
            }
          }
        }
      }
    } catch (ruleErr) {
      console.warn('Alert rule check warning:', ruleErr);
    }

    res.json(telemetry);
  } catch (err: any) {
    console.error('Error fetching live telemetry:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch environmental telemetry' });
  }
});

// Live global stations
apiRouter.get('/environment/stations', async (_req, res) => {
  try {
    const stations = await getGlobalStationsWithTelemetry();
    res.json({ stations, count: stations.length, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve global stations' });
  }
});

// Geocoding search
apiRouter.get('/environment/search', async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q) {
      return res.json([]);
    }
    const results = await searchLocations(q);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// Location comparison
apiRouter.get('/environment/compare', async (req, res) => {
  try {
    // locs query param format: lat,lon,name|lat,lon,name
    // or loc1_lat, loc1_lon, loc2_lat, loc2_lon
    const locationsToCompare: Array<{ lat: number; lon: number; name: string }> = [];

    if (req.query.locs) {
      const parts = (req.query.locs as string).split('|');
      for (const p of parts) {
        const [latStr, lonStr, name] = p.split(',');
        if (latStr && lonStr) {
          locationsToCompare.push({
            lat: parseFloat(latStr),
            lon: parseFloat(lonStr),
            name: name || 'Station',
          });
        }
      }
    } else {
      // Default to Tokyo, London, Delhi if nothing specified
      locationsToCompare.push(
        { lat: 35.6895, lon: 139.6917, name: 'Tokyo, Japan' },
        { lat: 51.5074, lon: -0.1278, name: 'London, United Kingdom' },
        { lat: 28.6139, lon: 77.209, name: 'Delhi NCR, India' }
      );
    }

    const telemetryList = await Promise.all(
      locationsToCompare.map(loc => fetchLiveEnvironment(loc.lat, loc.lon, loc.name))
    );

    // Compute differential analysis
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

// Meta AI Copilot Chat
apiRouter.post('/copilot/chat', async (req, res) => {
  try {
    const { prompt, context, conversationHistory, attachedImage } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await metaAIService.generateCopilotResponse({
      prompt,
      context,
      conversationHistory,
      attachedImage,
    });

    // Record in database session
    db.addChatMessage('session_default', {
      role: 'user',
      content: prompt,
    });
    db.addChatMessage('session_default', {
      role: 'assistant',
      content: result.reply,
      context: {
        location: context?.location,
        aqi: context?.telemetry?.overallAqi,
        pm25: context?.telemetry?.pollutants?.['PM2.5']?.value,
        modelUsed: result.modelUsed,
      },
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI Copilot inference failed' });
  }
});

// Meta SAM 3.1 Vision AI Segmentation
apiRouter.post('/vision/segment', async (req, res) => {
  try {
    const { imageBase64, imageUrl, promptCoords, environmentalContext } = req.body;
    const result = await metaAIService.segmentAtmosphericImage({
      imageBase64,
      imageUrl,
      promptCoords,
      environmentalContext,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Vision AI segmentation pipeline failed' });
  }
});

// Alert Rules: Public read of default system rules + user-specific rules if authenticated
apiRouter.get('/alerts', async (req, res) => {
  const user = await extractOptionalUser(req);
  res.json({
    rules: db.getAlertRules(user?.uid),
    events: db.getExceedanceEvents(),
  });
});

// Mutating alert rules requires strict Firebase ID token verification
apiRouter.post('/alerts', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { locationName, lat, lon, pollutant, operator, threshold, unit, severity, notificationChannel } = req.body;
    if (!locationName || lat === undefined || lon === undefined || !pollutant || threshold === undefined) {
      return res.status(400).json({ error: 'Missing required alert rule parameters' });
    }

    const newRule = db.addAlertRule({
      userId: user.uid,
      locationName,
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      pollutant,
      operator: operator || '>',
      threshold: parseFloat(threshold),
      unit: unit || 'µg/m³',
      severity: severity || 'Warning',
      notificationChannel: notificationChannel || 'Push & Email',
      active: true,
    });

    res.status(201).json(newRule);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create alert rule' });
  }
});

apiRouter.put('/alerts/:id', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { pollutant, operator, threshold, unit, severity, notificationChannel, active, locationName, lat, lon } = req.body;
    const updates: any = {};
    if (pollutant !== undefined) updates.pollutant = pollutant;
    if (operator !== undefined) updates.operator = operator;
    if (threshold !== undefined) updates.threshold = parseFloat(threshold);
    if (unit !== undefined) updates.unit = unit;
    if (severity !== undefined) updates.severity = severity;
    if (notificationChannel !== undefined) updates.notificationChannel = notificationChannel;
    if (active !== undefined) updates.active = Boolean(active);
    if (locationName !== undefined) updates.locationName = locationName;
    if (lat !== undefined) updates.lat = parseFloat(lat);
    if (lon !== undefined) updates.lon = parseFloat(lon);

    const updated = db.updateAlertRule(req.params.id, user.uid, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Alert rule not found or unauthorized' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update alert rule' });
  }
});

apiRouter.patch('/alerts/:id/toggle', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const updated = db.toggleAlertRule(req.params.id, user.uid);
  if (!updated) return res.status(404).json({ error: 'Alert rule not found or unauthorized' });
  res.json(updated);
});

apiRouter.delete('/alerts/:id', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const deleted = db.deleteAlertRule(req.params.id, user.uid);
  if (!deleted) return res.status(404).json({ error: 'Alert rule not found or unauthorized' });
  res.json({ success: true });
});

// Public exceedance events ledger
apiRouter.get('/alerts/events', (_req, res) => {
  res.json(db.getExceedanceEvents());
});

// Saved Locations: strictly authenticated per user
apiRouter.get('/saved-locations', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  res.json(db.getSavedLocations(req.user!.uid));
});

apiRouter.post('/saved-locations', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { name, lat, lon, country, stationId } = req.body;
    if (!name || lat === undefined || lon === undefined) {
      return res.status(400).json({ error: 'Missing location fields' });
    }
    const saved = db.addSavedLocation({
      userId: user.uid,
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

apiRouter.delete('/saved-locations/:id', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const deleted = db.deleteSavedLocation(req.params.id, user.uid);
  if (!deleted) return res.status(404).json({ error: 'Location not found or unauthorized' });
  res.json({ success: true });
});

// Comparisons: strictly authenticated per user
apiRouter.get('/comparisons', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  res.json(db.getComparisonSessions(req.user!.uid));
});

apiRouter.post('/comparisons', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { title, locations } = req.body;
    const session = db.saveComparisonSession({
      userId: user.uid,
      title: title || 'Comparison Session',
      locations: locations || [],
    });
    res.status(201).json(session);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save comparison session' });
  }
});

// Helper to strip sensitive fields before returning user
function toSafeUser(user: User) {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

// Authentication endpoints: strictly synchronized with Firebase Authentication
apiRouter.get('/auth/me', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  const user = db.upsertFirebaseUser({
    uid: req.user!.uid,
    email: req.user!.email,
    name: (req.user as any).name || (req.user as any).displayName,
  });
  res.json({ user: toSafeUser(user) });
});

apiRouter.post('/auth/logout', (_req, res) => {
  res.json({ success: true, message: 'Session terminated. Operator logged out.' });
});
