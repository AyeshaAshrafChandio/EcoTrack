import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const RegisterView: React.FC = () => {
  const { setActiveView } = useApp();

  const [orgName, setOrgName] = useState('Atmospheric Dynamics Lab');
  const [operatorName, setOperatorName] = useState('Dr. Sarah Chen');
  const [email, setEmail] = useState('sarah.chen@envirolab.org');
  const [tier, setTier] = useState('Academic Research Node (Free / Open Data)');
  const [region, setRegion] = useState('APAC-Tokyo-02 (Low Latency Mesh)');
  const [password, setPassword] = useState('••••••••••••');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${operatorName} (${orgName})`,
          email,
          password,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setStatusMsg(`Node Provisioned! ID: ${data.user.id}. Connecting to live telemetry mesh...`);
        setTimeout(() => {
          setActiveView('dashboard');
        }, 800);
      } else {
        const err = await res.json();
        setStatusMsg(`Provisioning notice: ${err.error || 'Identity already registered. Proceeding...'}`);
        setTimeout(() => {
          setActiveView('auth');
        }, 1200);
      }
    } catch (err) {
      setStatusMsg('Network or server error during node provisioning.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-surface flex items-center justify-center p-3 sm:p-6 lg:p-8 py-8 sm:py-12 overflow-hidden">
      <div className="relative w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch my-auto">
        {/* Left Column: Context / Intelligence Mesh Overview */}
        <div className="lg:col-span-6 flex flex-col justify-between p-4 sm:p-6 lg:p-8 bg-surface-container-low/90 backdrop-blur-xl rounded-2xl border border-surface-container shadow-xl space-y-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Terminal Status Tag */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-mono-sm text-[0.6875rem]">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="tracking-wider uppercase font-semibold">MESH NODE REGISTRATION • v3.4</span>
              </div>
              <span className="font-label-mono-sm text-[0.6875rem] text-on-surface-variant">REGION: EU-NORTH-01</span>
            </div>

            {/* Headline & Narrative */}
            <div className="space-y-2">
              <span className="font-label-mono-sm text-[0.6875rem] text-secondary uppercase tracking-widest block font-medium">
                Environmental Computing Nexus
              </span>
              <h1 className="font-headline-xl text-2xl sm:text-3xl font-extrabold text-on-surface leading-tight tracking-tight">
                Join the Planetary Environmental <span className="text-primary">Intelligence Mesh</span>
              </h1>
              <p className="font-body-md text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Equip your laboratory or research team with zero-latency sensor feeds, autonomous hyperspectral segmentation, and cryptographically verified atmospheric provenance.
              </p>
            </div>

            {/* High-Precision Metric Visual Card */}
            <div className="p-3 sm:p-4 rounded-xl bg-surface-container space-y-3">
              <div className="flex items-center justify-between text-on-surface font-label-mono-sm text-xs">
                <span className="font-label-ui text-label-ui uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-secondary">public</span>
                  Live Ingestion Constellation
                </span>
                <span className="text-primary font-bold">18,420 ACTIVE SENSORS</span>
              </div>

              {/* Vector Telemetry Chart / Sparkline */}
              <div className="h-16 sm:h-20 w-full flex items-end gap-1 pt-2">
                {[42, 58, 69, 84, 95, 61, 48, 52, 67, 79, 88, 64].map((val, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm transition-all ${
                      i === 4 ? 'bg-primary' : i === 3 || i === 9 ? 'bg-secondary' : 'bg-surface-container-high hover:bg-secondary/60'
                    }`}
                    style={{ height: `${val}%` }}
                    title={`Sensor Sector ${i + 1}: ${val} ppm`}
                  ></div>
                ))}
              </div>

              <div className="flex items-center justify-between font-label-mono-sm text-[0.625rem] sm:text-[0.6875rem] text-on-surface-variant pt-1">
                <span>Sentinel-5P Sync: 0.8s</span>
                <span className="text-secondary font-semibold">TROPOMI • NO2 / O3 / PM2.5</span>
              </div>
            </div>

            {/* Feature Capability Badges */}
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex items-start gap-3 p-2.5 sm:p-3 rounded-xl bg-surface-container border border-surface-variant/40">
                <div className="p-2 rounded-lg bg-surface-container-highest text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">sensors</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-label-ui text-xs sm:text-label-ui text-on-surface font-semibold truncate">
                    Ground Truth Telemetry Access (18,420 Nodes)
                  </h3>
                  <p className="font-body-sm text-[0.6875rem] sm:text-xs text-on-surface-variant line-clamp-2">
                    Calibrated high-density micro-station feeds alongside official EPA and Copernicus air quality observation stations.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 sm:p-3 rounded-xl bg-surface-container border border-surface-variant/40">
                <div className="p-2 rounded-lg bg-surface-container-highest text-secondary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">model_training</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-label-ui text-xs sm:text-label-ui text-on-surface font-semibold truncate">
                    Meta SAM 3.1 &amp; Vision AI Processing Sandbox
                  </h3>
                  <p className="font-body-sm text-[0.6875rem] sm:text-xs text-on-surface-variant line-clamp-2">
                    Zero-shot multispectral plume segmentation and emission perimeter contouring in browser WebGL shaders.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 sm:p-3 rounded-xl bg-surface-container border border-surface-variant/40">
                <div className="p-2 rounded-lg bg-surface-container-highest text-tertiary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">webhook</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-label-ui text-xs sm:text-label-ui text-on-surface font-semibold truncate">
                    Sub-minute Exceedance Webhooks &amp; Speciation
                  </h3>
                  <p className="font-body-sm text-[0.6875rem] sm:text-xs text-on-surface-variant line-clamp-2">
                    Dispatch programmatic triggers to alert systems when volatile organic compounds cross WHO threshold tiers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-on-surface-variant font-label-mono-sm text-[0.625rem] sm:text-[0.6875rem] border-t border-surface-container">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> TLS 1.3 / mTLS COMPLIANT
            </span>
            <span>FEDERATED IDENTITY V2</span>
          </div>
        </div>

        {/* Right Column: Registration Terminal Card */}
        <div className="lg:col-span-6 flex flex-col justify-between p-4 sm:p-6 lg:p-8 bg-surface-container-low/95 backdrop-blur-xl rounded-2xl border border-surface-container shadow-2xl space-y-4 sm:space-y-6">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-surface-container mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                </div>
                <div>
                  <h2 className="font-headline-md text-base sm:text-headline-md font-bold text-on-surface">
                    Node Provisioning Terminal
                  </h2>
                  <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">
                    INITIALIZE COMPLIANT TELEMETRY IDENTITY
                  </span>
                </div>
              </div>
              <span className="font-label-mono-sm text-[0.625rem] px-2 py-0.5 rounded bg-surface-container text-primary font-bold">
                STEP 1 OF 2
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-mono-sm text-[0.6875rem] text-on-surface-variant uppercase mb-1">
                    Organization / Institute
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    required
                    placeholder="e.g. Atmospheric Research"
                    className="w-full bg-surface-container px-3 py-2 sm:py-2.5 rounded-lg font-body-sm text-sm text-on-surface border border-surface-variant focus:outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block font-label-mono-sm text-[0.6875rem] text-on-surface-variant uppercase mb-1">
                    Operator Full Name
                  </label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={e => setOperatorName(e.target.value)}
                    required
                    placeholder="e.g. Dr. Alex Mercer"
                    className="w-full bg-surface-container px-3 py-2 sm:py-2.5 rounded-lg font-body-sm text-sm text-on-surface border border-surface-variant focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-mono-sm text-[0.6875rem] text-on-surface-variant uppercase mb-1">
                  Institutional Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="operator@laboratory.org"
                  className="w-full bg-surface-container px-3 py-2 sm:py-2.5 rounded-lg font-body-sm text-sm text-on-surface border border-surface-variant focus:outline-none focus:border-secondary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-mono-sm text-[0.6875rem] text-on-surface-variant uppercase mb-1">
                    Mesh Tier
                  </label>
                  <select
                    value={tier}
                    onChange={e => setTier(e.target.value)}
                    className="w-full bg-surface-container px-3 py-2 sm:py-2.5 rounded-lg font-body-sm text-xs sm:text-sm text-on-surface border border-surface-variant focus:outline-none focus:border-secondary truncate"
                  >
                    <option value="Academic Research Node (Free / Open Data)">Academic Research (Free)</option>
                    <option value="Enterprise Environmental Operations">Enterprise Operations</option>
                    <option value="Municipal Sensor Cluster">Municipal Sensor Cluster</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-mono-sm text-[0.6875rem] text-on-surface-variant uppercase mb-1">
                    Region Routing
                  </label>
                  <select
                    value={region}
                    onChange={e => setRegion(e.target.value)}
                    className="w-full bg-surface-container px-3 py-2 sm:py-2.5 rounded-lg font-body-sm text-xs sm:text-sm text-on-surface border border-surface-variant focus:outline-none focus:border-secondary truncate"
                  >
                    <option value="APAC-Tokyo-02 (Low Latency Mesh)">APAC (Tokyo)</option>
                    <option value="EU-North-01 (Copernicus Direct)">EU (Frankfurt)</option>
                    <option value="US-East-01 (NOAA Gateway)">US East (Virginia)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-label-mono-sm text-[0.6875rem] text-on-surface-variant uppercase mb-1">
                  Security Passphrase (SHA-256 Seed)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-surface-container px-3 py-2 sm:py-2.5 rounded-lg font-body-sm text-sm text-on-surface border border-surface-variant focus:outline-none focus:border-secondary"
                />
              </div>

              {statusMsg && (
                <div className="p-3 rounded-lg bg-surface-container font-label-mono-sm text-xs text-primary border border-primary/30">
                  {statusMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-secondary text-on-secondary font-label-ui text-sm font-bold shadow-md hover:bg-secondary-fixed transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>{loading ? 'PROVISIONING NODE...' : 'PROVISION PLANETARY NODE'}</span>
                <span className="material-symbols-outlined text-[18px]">bolt</span>
              </button>
            </form>
          </div>

          <div className="pt-3 border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left font-body-sm text-xs text-on-surface-variant">
            <span>Already hold active operator credentials?</span>
            <button
              onClick={() => setActiveView('auth')}
              className="text-primary font-semibold hover:underline cursor-pointer"
            >
              Portal Sign-In →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
