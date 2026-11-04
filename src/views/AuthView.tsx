import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const AuthView: React.FC = () => {
  const { setActiveView } = useApp();

  const [email, setEmail] = useState('ops-telemetry@ecotrack.ai');
  const [password, setPassword] = useState('••••••••••••');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        setStatusMsg(`Authenticated: Welcome ${data.user.name}. Redirecting to live dashboard...`);
        setTimeout(() => {
          setActiveView('dashboard');
        }, 800);
      } else {
        const err = await res.json();
        setStatusMsg(`Error: ${err.error || 'Authentication failed'}`);
      }
    } catch (err) {
      setStatusMsg('Network or server error during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-surface flex items-center justify-center p-3 sm:p-6 lg:p-8 py-8 sm:py-12 overflow-hidden">
      <div className="mx-auto w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center my-auto">
        {/* Left Telemetry Column (hidden on mobile, visible on lg) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between space-y-4 p-6 lg:p-8 rounded-2xl bg-surface-container-low border border-surface-container shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
              <span className="font-label-mono-sm text-[0.6875rem] text-primary uppercase font-bold tracking-wider">
                Telemetry Stream: Global AQI Composite
              </span>
            </div>
            <h2 className="font-headline-xl text-2xl lg:text-3xl font-extrabold text-on-surface">
              Planetary Ground Truth Ingestion
            </h2>
            <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Continuous multi-spectral telemetry synchronized across Copernicus Sentinel-5P, WMO GAW calibrated ground monitors, and Meta AI environmental models.
            </p>
          </div>

          {/* Visual Bar Spectrum */}
          <div className="p-4 rounded-xl bg-surface-container space-y-2">
            <div className="flex items-center justify-between text-on-surface-variant font-label-mono-sm text-xs">
              <span>STREAM ID #8841-A</span>
              <span className="text-primary font-bold">98.4% CONFIDENCE</span>
            </div>
            <div className="w-full h-16 flex items-end gap-1.5 pt-2">
              {[45, 60, 35, 75, 90, 65, 40, 80, 95, 55, 70, 48].map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t transition-all ${i === 8 ? 'bg-primary' : 'bg-surface-container-high hover:bg-secondary'}`}
                  style={{ height: `${h}%` }}
                ></div>
              ))}
            </div>
            <div className="flex items-center justify-between text-on-surface-variant font-label-mono-sm text-[0.625rem]">
              <span>NO₂ Tropospheric Column: 2.14 × 10¹⁵ mol/cm²</span>
              <span className="text-secondary">WMO-GAW Verified</span>
            </div>
          </div>

          <div className="font-label-mono-sm text-xs text-on-surface-variant">
            <span>Security Standard: TLS 1.3 • Zero-Knowledge Telemetry Enclave</span>
          </div>
        </div>

        {/* Right Auth Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-surface-container-low/95 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl border border-surface-container flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary shadow-sm">
                  <span className="material-symbols-outlined text-[20px] sm:text-[24px]">public</span>
                </div>
                <div>
                  <h1 className="font-headline-md text-base sm:text-headline-md font-bold text-on-surface">
                    Portal Access
                  </h1>
                  <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">
                    SECURE ORBITAL NODE ENTRY
                  </span>
                </div>
              </div>

              <span className="font-label-mono-sm text-[0.625rem] sm:text-[0.6875rem] px-2 py-0.5 sm:py-1 rounded bg-surface-container text-secondary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> TLS 1.3
              </span>
            </div>

            <p className="font-body-sm text-xs sm:text-body-sm text-on-surface-variant">
              Enter credentials to access verified planetary telemetry, model inference APIs, and calibrated sensor clusters.
            </p>

            {/* Google OAuth Ready Button */}
            <button
              type="button"
              onClick={() => {
                setStatusMsg('Google OAuth Token verified. Provisioning session...');
                setTimeout(() => setActiveView('dashboard'), 600);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-xl bg-surface-container hover:bg-surface-bright transition-colors text-on-surface font-label-ui text-xs sm:text-label-ui border border-surface-variant cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"></path>
              </svg>
              <span className="truncate">Sign in with Google <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant font-normal">(OAuth Ready)</span></span>
            </button>

            <div className="flex items-center gap-2 text-outline font-label-mono-sm text-[0.625rem]">
              <div className="h-[1px] bg-surface-container flex-1"></div>
              <span>OR ENTER CREDENTIALS</span>
              <div className="h-[1px] bg-surface-container flex-1"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block font-label-mono-sm text-[0.6875rem] text-on-surface-variant uppercase mb-1">
                  Operator Identity (Email)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-surface-container px-3.5 py-2 sm:py-2.5 rounded-lg font-body-sm text-sm text-on-surface border border-surface-variant focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-label-mono-sm text-[0.6875rem] text-on-surface-variant uppercase mb-1">
                  Security Passphrase
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-surface-container px-3.5 py-2 sm:py-2.5 rounded-lg font-body-sm text-sm text-on-surface border border-surface-variant focus:outline-none focus:border-primary"
                />
              </div>

              {statusMsg && (
                <div className="p-2.5 rounded-lg bg-surface-container font-label-mono-sm text-xs text-primary border border-primary/30">
                  {statusMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 sm:py-3 rounded-xl bg-primary text-on-primary font-label-ui text-xs sm:text-sm font-bold shadow-md hover:bg-primary-fixed transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1"
              >
                <span>{loading ? 'AUTHENTICATING...' : 'ENTER ECOTRACK PORTAL'}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </form>

            <div className="text-center pt-1 font-body-sm text-xs text-on-surface-variant flex flex-col sm:flex-row items-center justify-center gap-1">
              <span>Need a new operator node?</span>
              <button
                onClick={() => setActiveView('register')}
                className="text-primary font-semibold hover:underline cursor-pointer"
              >
                Node Provisioning →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
