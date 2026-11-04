/**
 * EcoTrack — Global AI Environmental Intelligence
 * Production Full-Stack Application Entry Point
 *
 * Preserves all 8 screens and connects to real-world APIs:
 * 1. Home
 * 2. Environmental Dashboard
 * 3. Global Pollution Map
 * 4. AI Environmental Copilot & Vision AI
 * 5. Compare Locations
 * 6. Environmental Alerts & Exceedances
 * 7. Portal Authentication & Sign In
 * 8. Node Provisioning & Account Creation
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { HomeView } from './views/HomeView';
import { DashboardView } from './views/DashboardView';
import { GlobalMapView } from './views/GlobalMapView';
import { CopilotView } from './views/CopilotView';
import { CompareView } from './views/CompareView';
import { AlertsView } from './views/AlertsView';
import { AuthView } from './views/AuthView';
import { RegisterView } from './views/RegisterView';

const MainContent: React.FC = () => {
  const { activeView, authLoading } = useApp();

  if (authLoading) {
    return (
      <main className="w-full pt-16 bg-surface flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-3xl animate-spin text-primary">progress_activity</span>
          <span className="font-label-mono-sm text-xs text-on-surface-variant">Initializing EcoTrack Telemetry Mesh...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full pt-16 bg-surface flex-1">
      {activeView === 'home' && <HomeView />}
      {activeView === 'dashboard' && <DashboardView />}
      {activeView === 'global-map' && <GlobalMapView />}
      {activeView === 'ai-copilot' && <CopilotView />}
      {activeView === 'compare' && <CompareView />}
      {activeView === 'alerts' && <AlertsView />}
      {activeView === 'auth' && <AuthView />}
      {activeView === 'register' && <RegisterView />}
    </main>
  );
};

const AuthPromptModal: React.FC = () => {
  const { authPrompt, closeAuthPrompt, setActiveView } = useApp();
  if (!authPrompt?.isOpen) return null;

  return (
    <div
      onClick={closeAuthPrompt}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-surface-container-high rounded-2xl p-6 sm:p-7 border border-surface-variant shadow-2xl space-y-4 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-primary/20 text-primary mx-auto flex items-center justify-center">
          <span className="material-symbols-outlined text-[28px]">lock</span>
        </div>

        <div>
          <span className="font-label-mono-sm text-[0.625rem] text-secondary uppercase font-bold tracking-wider">
            Operator Authentication
          </span>
          <h3 className="font-headline-md text-lg font-bold text-on-surface mt-1">
            {authPrompt.title}
          </h3>
          <p className="font-body-sm text-xs text-on-surface-variant mt-2 leading-relaxed">
            {authPrompt.message}
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => {
              const returnTarget = authPrompt.returnTo;
              closeAuthPrompt();
              setActiveView('auth', returnTarget);
            }}
            className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-fixed text-on-primary font-label-ui text-xs sm:text-sm font-semibold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            <span>Sign In to Account</span>
          </button>

          <button
            onClick={() => {
              const returnTarget = authPrompt.returnTo;
              closeAuthPrompt();
              setActiveView('register', returnTarget);
            }}
            className="w-full py-2.5 rounded-xl bg-surface-container hover:bg-surface-bright border border-surface-variant text-on-surface font-label-ui text-xs sm:text-sm font-semibold transition-all cursor-pointer"
          >
            <span>Create Free Account</span>
          </button>

          <button
            onClick={closeAuthPrompt}
            className="w-full py-2 rounded-xl text-on-surface-variant hover:text-on-surface font-label-ui text-xs cursor-pointer transition-colors"
          >
            Continue as Guest (Keep Browsing)
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen w-full flex flex-col bg-surface font-body-md text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-container">
        <Header />
        <MainContent />
        <AuthPromptModal />
      </div>
    </AppProvider>
  );
}
