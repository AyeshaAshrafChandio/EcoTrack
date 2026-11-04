import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatFirebaseAuthError } from '../firebase';

export const AuthView: React.FC = () => {
  const {
    setActiveView,
    returnToView,
    loginWithEmail,
    loginWithGoogle,
    resetPassword,
    currentUser,
    firebaseUser,
    logout,
    firebaseConfigured,
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Password reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setStatusMsg({ text: 'Please enter both your email address and password.', type: 'error' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      await loginWithEmail(email.trim(), password);
      const destName = returnToView === 'alerts' ? 'alerts ledger' : returnToView === 'copilot' || returnToView === 'ai-copilot' ? 'AI copilot' : 'environmental dashboard';
      setStatusMsg({ text: `Authentication successful! Returning to ${destName}...`, type: 'success' });
    } catch (err: any) {
      setStatusMsg({ text: formatFirebaseAuthError(err), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setStatusMsg(null);
    try {
      await loginWithGoogle();
      const destName = returnToView === 'alerts' ? 'alerts ledger' : returnToView === 'copilot' || returnToView === 'ai-copilot' ? 'AI copilot' : 'environmental dashboard';
      setStatusMsg({ text: `Google authentication successful! Returning to ${destName}...`, type: 'success' });
    } catch (err: any) {
      setStatusMsg({ text: formatFirebaseAuthError(err), type: 'error' });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetStatus('Please enter your email address to receive reset instructions.');
      return;
    }
    setResetLoading(true);
    setResetStatus(null);
    try {
      await resetPassword(resetEmail.trim());
      setResetStatus('Password reset link sent! Check your inbox.');
      setTimeout(() => {
        setShowResetModal(false);
        setResetStatus(null);
      }, 2500);
    } catch (err: any) {
      setResetStatus(formatFirebaseAuthError(err));
    } finally {
      setResetLoading(false);
    }
  };

  // If already authenticated, show authenticated state
  if (currentUser) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] bg-surface flex items-center justify-center p-3 sm:p-6 lg:p-8 py-8 sm:py-12">
        <div className="w-full max-w-md bg-surface-container-low border border-surface-container rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 text-primary mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">verified_user</span>
          </div>
          <div>
            <span className="font-label-mono-sm text-[0.625rem] text-secondary uppercase font-bold tracking-wider">
              {firebaseUser ? 'Firebase Session Active' : 'Operator Session Active'}
            </span>
            <h2 className="font-headline-md text-xl font-bold text-on-surface mt-1">
              {currentUser.name || 'Authenticated Operator'}
            </h2>
            <p className="font-label-mono-sm text-xs text-on-surface-variant mt-0.5">
              {currentUser.email}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-surface-container font-label-mono-sm text-[0.6875rem] text-on-surface-variant text-left space-y-1">
            <div>UID: <span className="text-on-surface font-semibold">{currentUser.id}</span></div>
            <div>Provider: <span className="text-primary font-semibold">{currentUser.provider || (firebaseUser ? 'firebase.auth' : 'local.pbkdf2')}</span></div>
            <div>Role: <span className="text-secondary font-semibold">{currentUser.role || 'Environmental Analyst'}</span></div>
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
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-surface flex items-center justify-center p-3 sm:p-6 lg:p-8 py-8 sm:py-12">
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

          {/* Environmental Telemetry Metrics Widget */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-surface-container">
            <div className="space-y-0.5">
              <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">
                Active Ingestion Nodes
              </span>
              <div className="font-data-metric-sm text-lg font-bold text-primary">Verified Ground Mesh</div>
            </div>
            <div className="space-y-0.5">
              <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">
                Atmospheric Speciation
              </span>
              <div className="font-data-metric-sm text-lg font-bold text-secondary">PM2.5, NO2, O3</div>
            </div>
            <div className="space-y-0.5">
              <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">
                Calibration Standard
              </span>
              <div className="font-data-metric-sm text-xs font-semibold text-on-surface">US-EPA 40 CFR 58</div>
            </div>
            <div className="space-y-0.5">
              <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">
                Reasoning Backbone
              </span>
              <div className="font-data-metric-sm text-xs font-semibold text-secondary">Meta LLaMA 3.3 70B</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-on-surface-variant font-label-mono-sm text-[0.6875rem] pt-2 border-t border-surface-container">
            <span>Authentication Engine:</span>
            <span className="text-primary font-semibold">Firebase Authentication</span>
          </div>
        </div>

        {/* Right Column: Portal Authentication Card (Screen 7) */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto p-6 sm:p-8 bg-surface-container-low rounded-2xl border border-surface-container shadow-2xl space-y-5">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-label-mono-sm text-[0.6875rem] text-secondary font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]">lock</span>
                <span>Screen 7 • Operator Sign-In</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-surface-container font-label-mono-sm text-[0.625rem] text-primary">
                FIREBASE AUTH
              </span>
            </div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl font-extrabold text-on-surface">
              Portal Authentication
            </h1>
            <p className="font-body-sm text-xs text-on-surface-variant">
              Authenticate your identity to manage threshold alerts, comparison matrices, and copilot reasoning.
            </p>
          </div>

          {/* Guest Exploration Option - No Account Required */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="material-symbols-outlined text-primary text-[22px] shrink-0">public</span>
              <div className="min-w-0">
                <div className="font-label-ui text-xs font-bold text-on-surface">Public Guest Access</div>
                <div className="font-body-sm text-[0.6875rem] text-on-surface-variant truncate">
                  Explore global forecasts, maps, and copilot with zero registration
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('dashboard')}
              className="px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-fixed font-label-ui text-xs font-bold transition-all cursor-pointer shrink-0 shadow-sm flex items-center gap-1"
            >
              <span>Explore</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          </div>

          {/* Firebase Configuration Notice if environment variables are missing */}
          {!firebaseConfigured && (
            <div className="p-3.5 rounded-xl bg-surface-container border border-surface-variant/80 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-label-ui text-secondary font-semibold">
                <span className="material-symbols-outlined text-[16px]">settings_alert</span>
                <span>Firebase Credentials Setup Notice</span>
              </div>
              <p className="font-body-sm text-[0.6875rem] text-on-surface-variant leading-relaxed">
                To connect your real Firebase project, configure the following variables in <code className="text-primary font-mono">.env</code>:
              </p>
              <div className="font-mono text-[0.625rem] bg-surface-container-lowest p-2 rounded text-outline space-y-0.5 overflow-x-auto">
                <div>VITE_FIREBASE_API_KEY=your_api_key</div>
                <div>VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com</div>
                <div>VITE_FIREBASE_PROJECT_ID=your_project_id</div>
              </div>
              <p className="font-body-sm text-[0.625rem] text-on-surface-variant">
                Enable <strong>Email/Password</strong> and <strong>Google</strong> under Firebase Console → Authentication → Sign-in method.
              </p>
            </div>
          )}

          {/* Feedback status message */}
          {statusMsg && (
            <div
              className={`p-3 rounded-lg font-body-sm text-xs flex items-start gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : statusMsg.type === 'error'
                  ? 'bg-error-container/40 text-on-error-container border border-error/30'
                  : 'bg-surface-container text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">
                {statusMsg.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
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
            <span>Sign in with Google</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-surface-container"></div>
            <span className="flex-shrink mx-3 font-label-mono-sm text-[0.625rem] text-outline uppercase">
              Or with email passphrase
            </span>
            <div className="flex-grow border-t border-surface-container"></div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="font-label-ui text-xs font-semibold text-on-surface">
                Institutional Email Address
              </label>
              <div className="flex items-center gap-2 bg-surface-container px-3 py-2 rounded-lg border border-surface-variant focus-within:border-primary transition-colors">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">mail</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="operator@environmental-agency.gov"
                  className="w-full bg-transparent font-body-sm text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-label-ui text-xs font-semibold text-on-surface">
                  Security Passphrase
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setShowResetModal(true);
                  }}
                  className="font-label-mono-sm text-[0.625rem] text-secondary hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="flex items-center gap-2 bg-surface-container px-3 py-2 rounded-lg border border-surface-variant focus-within:border-primary transition-colors">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">key</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter security passphrase..."
                  className="w-full bg-transparent font-body-sm text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-none"
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
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
              )}
              <span>{loading ? 'Authenticating with Firebase...' : 'Sign In to Node'}</span>
            </button>
          </form>

          {/* Switch to Signup (Screen 8) or Continue as Guest */}
          <div className="pt-2 border-t border-surface-container text-center space-y-2">
            <p className="font-body-sm text-xs text-on-surface-variant">
              Need to provision a new research node?{' '}
              <button
                type="button"
                onClick={() => setActiveView('register')}
                className="text-primary hover:underline font-semibold cursor-pointer"
              >
                Sign up here (Screen 8)
              </button>
            </p>
            <div>
              <button
                type="button"
                onClick={() => setActiveView('dashboard')}
                className="text-on-surface-variant hover:text-on-surface font-label-ui text-xs underline cursor-pointer transition-colors"
              >
                Skip sign-in and explore as guest →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div
          onClick={() => setShowResetModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-surface-container-high rounded-2xl p-6 border border-surface-variant shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2 font-headline-md text-base font-bold text-on-surface">
                <span className="material-symbols-outlined text-secondary text-[20px]">password</span>
                <span>Reset Security Passphrase</span>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <p className="font-body-sm text-xs text-on-surface-variant">
              Enter your registered institutional email to receive an official Firebase password reset link.
            </p>

            {resetStatus && (
              <div className="p-2.5 rounded bg-surface-container font-body-sm text-xs text-secondary border border-secondary/30">
                {resetStatus}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div className="space-y-1">
                <label className="font-label-ui text-xs font-semibold text-on-surface">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="operator@environmental-agency.gov"
                  className="w-full bg-surface-container px-3 py-2 rounded-lg border border-surface-variant font-body-sm text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-2 rounded-lg bg-surface-container hover:bg-surface-bright font-label-ui text-xs text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 py-2 rounded-lg bg-primary hover:bg-primary-fixed font-label-ui text-xs text-on-primary font-semibold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {resetLoading && (
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  )}
                  <span>Send Reset Link</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
