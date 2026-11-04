import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatFirebaseAuthError } from '../firebase';

export const RegisterView: React.FC = () => {
  const {
    setActiveView,
    returnToView,
    registerWithEmail,
    loginWithGoogle,
    currentUser,
    logout,
    firebaseConfigured,
  } = useApp();

  const [orgName, setOrgName] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!operatorName.trim()) {
      setStatusMsg({ text: 'Please enter the operator or researcher name.', type: 'error' });
      return;
    }
    if (!email.trim()) {
      setStatusMsg({ text: 'Please enter a valid institutional email address.', type: 'error' });
      return;
    }
    if (password.length < 6) {
      setStatusMsg({ text: 'Security passphrase must be at least 6 characters.', type: 'error' });
      return;
    }
    if (password !== confirmPassword) {
      setStatusMsg({ text: 'Passphrases do not match. Please verify your password entry.', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const displayName = orgName.trim() ? `${operatorName.trim()} (${orgName.trim()})` : operatorName.trim();
      await registerWithEmail(email.trim(), password, displayName);
    } catch (err: any) {
      setStatusMsg({ text: formatFirebaseAuthError(err), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setStatusMsg(null);
    try {
      await loginWithGoogle();
      const destName = returnToView === 'alerts' ? 'alerts ledger' : returnToView === 'ai-copilot' ? 'AI copilot' : 'environmental dashboard';
      setStatusMsg({ text: `Google account verified! Entering ${destName}...`, type: 'success' });
    } catch (err: any) {
      setStatusMsg({ text: formatFirebaseAuthError(err), type: 'error' });
    } finally {
      setGoogleLoading(false);
    }
  };

  // If already authenticated
  if (currentUser) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] bg-surface flex items-center justify-center p-3 sm:p-6 lg:p-8 py-8 sm:py-12">
        <div className="w-full max-w-md bg-surface-container-low border border-surface-container rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-secondary/20 text-secondary mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">how_to_reg</span>
          </div>
          <div>
            <span className="font-label-mono-sm text-[0.625rem] text-secondary uppercase font-bold tracking-wider">
              Node Already Registered
            </span>
            <h2 className="font-headline-md text-xl font-bold text-on-surface mt-1">
              {currentUser.name || 'Authenticated Operator'}
            </h2>
            <p className="font-label-mono-sm text-xs text-on-surface-variant mt-0.5">
              {currentUser.email}
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => setActiveView('dashboard')}
              className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-label-ui text-xs font-semibold cursor-pointer hover:bg-primary-fixed transition-colors"
            >
              Open Environmental Dashboard
            </button>
            <button
              onClick={async () => {
                await logout();
              }}
              className="w-full py-2 rounded-lg bg-surface-container hover:bg-surface-bright text-error font-label-ui text-xs font-semibold cursor-pointer transition-colors"
            >
              Switch Account / Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-surface flex items-center justify-center p-3 sm:p-6 lg:p-8 py-8 sm:py-12">
      <div className="relative w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch my-auto">
        {/* Left Column: Context / Intelligence Mesh Overview */}
        <div className="lg:col-span-6 flex flex-col justify-between p-4 sm:p-6 lg:p-8 bg-surface-container-low/90 backdrop-blur-xl rounded-2xl border border-surface-container shadow-xl space-y-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Terminal Status Tag */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-mono-sm text-[0.6875rem]">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                <span>GLOBAL TELEMETRY GRID</span>
              </div>
              <span className="font-label-mono-sm text-[0.625rem] text-secondary uppercase font-semibold">
                FIREBASE AUTHENTICATION
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="font-headline-xl text-2xl sm:text-3xl font-extrabold text-on-surface">
                Node Account Provisioning
              </h1>
              <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Connect your environmental monitoring laboratory, academic department, or regional sensor array to EcoTrack&apos;s live multi-spectral intelligence platform.
              </p>
            </div>

            {/* Feature Matrix */}
            <div className="space-y-3 pt-2">
              {[
                { title: 'Zero-Speculation Physical Telemetry', desc: 'Direct ingestion from verified WMO GAW calibrated ground stations and Copernicus Sentinel satellites.' },
                { title: 'Meta AI & Vision Transformer Copilot', desc: 'Reasoning against planetary boundary layer inversions, particulate speciation, and optical haze attenuation.' },
                { title: 'Automated Threshold Exceedance Alarms', desc: 'Real-time alert dispatching across WHO 2021 air quality targets and EPA 40 CFR 58 standards.' },
              ].map((feat, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-surface-container/70 border border-surface-container">
                  <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-label-ui text-xs font-semibold text-on-surface">{feat.title}</div>
                    <div className="font-body-sm text-[0.6875rem] text-on-surface-variant leading-normal">{feat.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-surface-container flex items-center justify-between font-label-mono-sm text-[0.6875rem] text-on-surface-variant">
            <span>Standard: <strong className="text-on-surface">EPA &amp; WHO 2021</strong></span>
            <span>Security: <strong className="text-secondary">Firebase Auth</strong></span>
          </div>
        </div>

        {/* Right Column: Node Provisioning Form (Screen 8) */}
        <div className="lg:col-span-6 w-full max-w-xl mx-auto p-5 sm:p-8 bg-surface-container-low rounded-2xl border border-surface-container shadow-2xl space-y-5">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-label-mono-sm text-[0.6875rem] text-secondary uppercase font-bold tracking-wider">
                Screen 8 • New Operator Account
              </span>
              <span className="px-2 py-0.5 rounded bg-surface-container font-label-mono-sm text-[0.625rem] text-primary">
                SIGNUP
              </span>
            </div>
            <h2 className="font-headline-md text-xl sm:text-2xl font-bold text-on-surface">
              Create Operator Node
            </h2>
            <p className="font-body-sm text-xs text-on-surface-variant">
              Register via Google or create an account with email and security passphrase.
            </p>
          </div>

          {/* Firebase Configuration Notice if environment variables are missing */}
          {!firebaseConfigured && (
            <div className="p-3.5 rounded-xl bg-surface-container border border-surface-variant/80 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-label-ui text-secondary font-semibold">
                <span className="material-symbols-outlined text-[16px]">settings_alert</span>
                <span>Firebase Authentication Configuration Notice</span>
              </div>
              <p className="font-body-sm text-[0.6875rem] text-on-surface-variant leading-relaxed">
                Connect your real Firebase project by setting <code className="text-primary font-mono">VITE_FIREBASE_API_KEY</code> and <code className="text-primary font-mono">VITE_FIREBASE_PROJECT_ID</code> in <code className="text-primary font-mono">.env</code>.
              </p>
            </div>
          )}

          {/* Feedback status message */}
          {statusMsg && (
            <div
              className={`p-3 rounded-lg font-body-sm text-xs flex items-start gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-error-container/40 text-on-error-container border border-error/30'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">
                {statusMsg.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Google Sign-Up Button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            className="w-full py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-bright border border-surface-variant text-on-surface font-label-ui text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {googleLoading ? (
              <span className="material-symbols-outlined text-[18px] animate-spin text-primary">
                progress_activity
              </span>
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Sign Up with Google</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-surface-container"></div>
            <span className="flex-shrink mx-3 font-label-mono-sm text-[0.625rem] text-outline uppercase">
              Or with email registration
            </span>
            <div className="flex-grow border-t border-surface-container"></div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-label-ui text-xs font-semibold text-on-surface">
                  Operator Name *
                </label>
                <input
                  type="text"
                  required
                  value={operatorName}
                  onChange={e => setOperatorName(e.target.value)}
                  placeholder="e.g. Dr. Alex Mercer"
                  className="w-full bg-surface-container px-3 py-2 rounded-lg border border-surface-variant font-body-sm text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-ui text-xs font-semibold text-on-surface">
                  Institution / Laboratory
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="e.g. Atmospheric Research Inst."
                  className="w-full bg-surface-container px-3 py-2 rounded-lg border border-surface-variant font-body-sm text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-label-ui text-xs font-semibold text-on-surface">
                Institutional Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="operator@environmental-lab.org"
                className="w-full bg-surface-container px-3 py-2 rounded-lg border border-surface-variant font-body-sm text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-label-ui text-xs font-semibold text-on-surface">
                  Security Passphrase *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-surface-container px-3 py-2 rounded-lg border border-surface-variant font-body-sm text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-ui text-xs font-semibold text-on-surface">
                  Confirm Passphrase *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat passphrase"
                  className="w-full bg-surface-container px-3 py-2 rounded-lg border border-surface-variant font-body-sm text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-fixed text-on-primary font-label-ui text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow disabled:opacity-50"
            >
              {loading ? (
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">person_add</span>
              )}
              <span>{loading ? 'Registering with Firebase...' : 'Provision Operator Account'}</span>
            </button>
          </form>

          {/* Switch to Login (Screen 7) or Guest */}
          <div className="pt-2 border-t border-surface-container text-center space-y-2">
            <p className="font-body-sm text-xs text-on-surface-variant">
              Already have an operator account?{' '}
              <button
                type="button"
                onClick={() => setActiveView('auth', returnToView || undefined)}
                className="text-primary hover:underline font-semibold cursor-pointer"
              >
                Sign in here (Screen 7)
              </button>
            </p>
            <div>
              <button
                type="button"
                onClick={() => setActiveView('dashboard')}
                className="text-on-surface-variant hover:text-on-surface font-label-ui text-xs underline cursor-pointer transition-colors"
              >
                Skip registration and explore as guest →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
