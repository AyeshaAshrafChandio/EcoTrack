/**
 * EcoTrack Comprehensive Integration & Verification Test Suite
 * Executes automated end-to-end checks against all real endpoints.
 */

const BASE_URL = process.env.TEST_BASE_URL || (process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:3000');

interface TestResult {
  suite: string;
  name: string;
  status: 'PASS' | 'FAIL';
  details: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(suite: string, name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({
      suite,
      name,
      status: 'PASS',
      details: 'OK',
      durationMs: Date.now() - start,
    });
    console.log(`  [PASS] ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({
      suite,
      name,
      status: 'FAIL',
      details: err.message,
      durationMs: Date.now() - start,
    });
    console.error(`  [FAIL] ${name}: ${err.message} (${Date.now() - start}ms)`);
  }
}

async function runSuite() {
  console.log(`\n======================================================`);
  console.log(`EcoTrack Production Verification Suite — ${new Date().toISOString()}`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  // Suite 1: Health & Provenance
  await runTest('System Health', 'API Status & Provider Verification', async () => {
    const res = await fetch(`${BASE_URL}/api/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ONLINE') throw new Error(`Expected status ONLINE, got ${data.status}`);
    if (!data.providers?.openMeteoAirQuality) throw new Error('Missing openMeteoAirQuality provider');
  });

  // Suite 2: Environmental Telemetry
  await runTest('Environmental Telemetry', 'Open-Meteo Live Forecast Ingestion', async () => {
    const res = await fetch(`${BASE_URL}/api/environment/live?lat=24.8607&lon=67.0011&city=Karachi`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (typeof data.overallAqi !== 'number') throw new Error('Missing overallAqi');
    if (!data.pollutants?.['PM2.5']) throw new Error('Missing PM2.5 pollutant');
    if (!data.weather?.boundaryLayerHeight) throw new Error('Missing boundaryLayerHeight');
  });

  await runTest('Environmental Telemetry', 'Global Model Grid Nodes List', async () => {
    const res = await fetch(`${BASE_URL}/api/environment/stations`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.stations) || data.stations.length < 5) {
      throw new Error(`Expected at least 5 stations, got ${data.stations?.length}`);
    }
  });

  await runTest('Environmental Telemetry', 'OpenAQ v3 Ground Stations Real Query', async () => {
    const res = await fetch(`${BASE_URL}/api/environment/openaq?lat=24.8607&lon=67.0011&radius=25000`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.status) throw new Error('Missing OpenAQ status');
    if (!Array.isArray(data.stations)) throw new Error('Expected stations array');
  });

  await runTest('Environmental Telemetry', 'Open-Meteo Geocoding Search', async () => {
    const res = await fetch(`${BASE_URL}/api/environment/search?q=London`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error('No geocoding results');
    if (!data[0].latitude || !data[0].longitude) throw new Error('Missing coordinates');
  });

  await runTest('Environmental Telemetry', 'Cross-Continental Location Comparison', async () => {
    const res = await fetch(`${BASE_URL}/api/environment/compare?locs=24.8607,67.0011,Karachi|51.5074,-0.1278,London`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.locations) || data.locations.length !== 2) throw new Error('Expected 2 compared locations');
    if (typeof data.differential?.aqiVariance !== 'number') throw new Error('Missing differential variance');
  });

  // Suite 3: AI Copilot Inquiries
  await runTest('AI Copilot', 'English Telemetry Grounded Inquiry', async () => {
    const res = await fetch(`${BASE_URL}/api/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'State current AQI and dominant pollutant in Karachi.',
        context: { location: 'Karachi, Pakistan', lat: 24.8607, lon: 67.0011 },
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.reply || data.reply.length < 20) throw new Error('Reply too short or missing');
    if (!data.evidencePacket) throw new Error('Missing evidencePacket');
  });

  await runTest('AI Copilot', 'Urdu Telemetry Grounded Inquiry', async () => {
    const res = await fetch(`${BASE_URL}/api/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'کراچی میں ہوا کے معیار کا مختصر جائزہ پیش کریں۔',
        context: { location: 'Karachi, Pakistan', lat: 24.8607, lon: 67.0011 },
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.reply) throw new Error('Missing Urdu reply');
    const isUrdu = /[\u0600-\u06FF]/.test(data.reply);
    if (!isUrdu) throw new Error('Response did not contain Urdu script as required');
  });

  // Suite 4: Vision AI Context
  await runTest('Vision AI', 'Real Base64 Image Upload with Honest Disclosure', async () => {
    const base64Pixel = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    const res = await fetch(`${BASE_URL}/api/copilot/analyze-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64Pixel,
        locationName: 'Karachi, Pakistan',
        lat: 24.8607,
        lon: 67.0011,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.disclaimer) throw new Error('Missing non-quantitative disclaimer');
    if (data.status === 'UNAVAILABLE' && data.visibleHazeLevel !== 'Unavailable') {
      throw new Error('Expected hazeLevel to be marked Unavailable when vision provider is unavailable');
    }
  });

  // Suite 5: Webhook Dispatch
  await runTest('Hazard Alerts', 'Alert Webhook Loopback Delivery', async () => {
    const res = await fetch(`${BASE_URL}/api/alerts/test-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhookUrl: `${BASE_URL}/api/alerts/webhook-receiver`,
        locationName: 'Verification Node Alpha',
        pollutant: 'PM2.5',
        threshold: 120,
        severity: 'Warning',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.success || data.status !== 200) throw new Error(`Delivery unconfirmed: ${JSON.stringify(data)}`);
  });

  // Suite 6: Operator Authentication & Persistence
  let testToken = '';
  const testEmail = `test_operator_${Date.now()}@ecotrack.ai`;

  await runTest('Operator Security', 'Operator Account Provisioning', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'SecurePassphrase2026!',
        name: 'Automated Test Operator',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.token) throw new Error('Missing token');
    testToken = data.token;
  });

  await runTest('Operator Security', 'Operator Session Verification & Private Resource Mutation', async () => {
    if (!testToken) throw new Error('No active token from previous step');
    
    // Check /auth/me
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    if (!meRes.ok) throw new Error(`/auth/me returned HTTP ${meRes.status}`);

    // Create private saved location
    const saveRes = await fetch(`${BASE_URL}/api/saved-locations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Research Node Beta',
        lat: 34.0522,
        lon: -118.2437,
        country: 'United States',
      }),
    });
    if (!saveRes.ok) throw new Error(`Saved location creation failed: HTTP ${saveRes.status}`);
  });

  // Summary
  console.log(`\n======================================================`);
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`Test Execution Summary: ${passed} PASSED, ${failed} FAILED out of ${results.length} tests.`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Fatal suite failure:', err);
  process.exit(1);
});
