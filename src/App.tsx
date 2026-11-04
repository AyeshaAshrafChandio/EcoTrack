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
  const { activeView } = useApp();

  return (
    <main className="w-full pt-16 bg-surface min-h-screen overflow-x-hidden">
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

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-surface font-body-md text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-container">
        <Header />
        <MainContent />
      </div>
    </AppProvider>
  );
}
