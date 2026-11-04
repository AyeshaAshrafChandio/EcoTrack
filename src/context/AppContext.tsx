import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AppView, EnvironmentalTelemetry, GlobalStation, AlertRule, ExceedanceEvent, SearchResult } from '../types';
import {
  auth,
  onAuthStateChanged,
  loginWithEmail as fbLoginEmail,
  registerWithEmail as fbRegisterEmail,
  loginWithGoogle as fbLoginGoogle,
  resetUserPassword as fbResetPassword,
  logoutUser as fbLogout,
  isFirebaseConfigured,
  getFirebaseIdToken,
  type User as FirebaseUser,
} from '../firebase';

const VALID_VIEWS: AppView[] = [
  'home',
  'dashboard',
  'global-map',
  'ai-copilot',
  'compare',
  'alerts',
  'auth',
  'register',
];

interface AppContextType {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  selectedLocation: { name: string; lat: number; lon: number };
  setSelectedLocation: (loc: { name: string; lat: number; lon: number }) => void;
  currentTelemetry: EnvironmentalTelemetry | null;
  loadingTelemetry: boolean;
  stations: GlobalStation[];
  loadingStations: boolean;
  alertRules: AlertRule[];
  exceedanceEvents: ExceedanceEvent[];
  refreshTelemetry: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: SearchResult[];
  isSearching: boolean;
  selectCity: (name: string, lat: number, lon: number) => void;
  toggleAlertRule: (id: string) => Promise<{ success: boolean; error?: string }>;
  createAlertRule: (rule: Omit<AlertRule, 'id' | 'userId' | 'createdAt' | 'active'>) => Promise<{ success: boolean; error?: string }>;
  updateAlertRule: (id: string, updates: Partial<Omit<AlertRule, 'id' | 'userId' | 'createdAt'>>) => Promise<{ success: boolean; error?: string }>;
  deleteAlertRule: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Firebase Authentication
  currentUser: FirebaseUser | null;
  authLoading: boolean;
  firebaseConfigured: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AppContext = createContext<AppContextType | null>(null);

function parseViewFromUrl(): AppView {
  try {
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
    if (hash === 'login' || hash === 'auth') return 'auth';
    if (hash === 'signup' || hash === 'register') return 'register';
    if (VALID_VIEWS.includes(hash as AppView)) {
      return hash as AppView;
    }
  } catch (e) {
    // ignore
  }
  return 'home';
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeView, setActiveViewState] = useState<AppView>(parseViewFromUrl);
  const [selectedLocation, setSelectedLocation] = useState<{ name: string; lat: number; lon: number }>({
    name: 'Tokyo, Japan',
    lat: 35.6895,
    lon: 139.6917,
  });
  const [currentTelemetry, setCurrentTelemetry] = useState<EnvironmentalTelemetry | null>(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState<boolean>(true);
  const [stations, setStations] = useState<GlobalStation[]>([]);
  const [loadingStations, setLoadingStations] = useState<boolean>(true);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [exceedanceEvents, setExceedanceEvents] = useState<ExceedanceEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Synchronize browser history and hash routing seamlessly across all 8 screens
  const setActiveView = (view: AppView) => {
    setActiveViewState(view);
    const targetHash = `#/${view}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState({ view }, '', targetHash);
    }
    // Scroll to top on navigation change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseViewFromUrl();
      setActiveViewState(parsed);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    // Initial sync
    const initialView = parseViewFromUrl();
    if (window.location.hash !== `#/${initialView}`) {
      window.history.replaceState({ view: initialView }, '', `#/${initialView}`);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        // User logged in: if on auth or register screen, navigate to dashboard
        setActiveViewState(prev => {
          if (prev === 'auth' || prev === 'register') {
            window.history.pushState({ view: 'dashboard' }, '', '#/dashboard');
            return 'dashboard';
          }
          return prev;
        });
      } else {
        // User logged out: if on protected screen, navigate to auth
        setActiveViewState(prev => {
          if (prev !== 'auth' && prev !== 'register') {
            window.history.pushState({ view: 'auth' }, '', '#/auth');
            return 'auth';
          }
          return prev;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch telemetry whenever selected location changes
  const fetchTelemetry = async (lat: number, lon: number, name: string) => {
    setLoadingTelemetry(true);
    try {
      const res = await fetch(`/api/environment/live?lat=${lat}&lon=${lon}&city=${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentTelemetry(data);
      }
    } catch (err) {
      console.error('Error fetching live telemetry:', err);
    } finally {
      setLoadingTelemetry(false);
    }
  };

  // Fetch stations
  const fetchStations = async () => {
    setLoadingStations(true);
    try {
      const res = await fetch('/api/environment/stations');
      if (res.ok) {
        const data = await res.json();
        setStations(data.stations || []);
      }
    } catch (err) {
      console.error('Error fetching stations:', err);
    } finally {
      setLoadingStations(false);
    }
  };

  // Fetch alerts & events
  const fetchAlerts = async () => {
    try {
      const headers: Record<string, string> = {};
      const token = await getFirebaseIdToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/alerts', { headers });
      if (res.ok) {
        const data = await res.json();
        setAlertRules(data.rules || []);
        setExceedanceEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  useEffect(() => {
    fetchTelemetry(selectedLocation.lat, selectedLocation.lon, selectedLocation.name);
  }, [selectedLocation.lat, selectedLocation.lon]);

  useEffect(() => {
    fetchStations();
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [currentUser]);

  // Search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/environment/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const results = await res.json();
          setSearchResults(results);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectCity = (name: string, lat: number, lon: number) => {
    setSelectedLocation({ name, lat, lon });
    setSearchQuery('');
    setSearchResults([]);
  };

  const toggleAlertRule = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = await getFirebaseIdToken();
      if (!token) {
        return { success: false, error: 'Authentication required: Sign in to toggle alert rules.' };
      }
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      const res = await fetch(`/api/alerts/${id}/toggle`, { method: 'PATCH', headers });
      if (res.ok) {
        await fetchAlerts();
        return { success: true };
      }
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || 'Failed to toggle alert rule' };
    } catch (err: any) {
      console.error('Error toggling alert rule:', err);
      return { success: false, error: err.message || 'Network error toggling alert rule' };
    }
  };

  const createAlertRule = async (
    rule: Omit<AlertRule, 'id' | 'userId' | 'createdAt' | 'active'>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = await getFirebaseIdToken();
      if (!token) {
        return { success: false, error: 'Authentication required: Sign in to create personalized alert rules.' };
      }
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers,
        body: JSON.stringify(rule),
      });
      if (res.ok) {
        await fetchAlerts();
        return { success: true };
      }
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || 'Failed to create alert rule' };
    } catch (err: any) {
      console.error('Error creating alert rule:', err);
      return { success: false, error: err.message || 'Network error creating alert rule' };
    }
  };

  const updateAlertRule = async (
    id: string,
    updates: Partial<Omit<AlertRule, 'id' | 'userId' | 'createdAt'>>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = await getFirebaseIdToken();
      if (!token) {
        return { success: false, error: 'Authentication required: Sign in to edit alert rules.' };
      }
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await fetchAlerts();
        return { success: true };
      }
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || 'Failed to update alert rule' };
    } catch (err: any) {
      console.error('Error updating alert rule:', err);
      return { success: false, error: err.message || 'Network error updating alert rule' };
    }
  };

  const deleteAlertRule = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = await getFirebaseIdToken();
      if (!token) {
        return { success: false, error: 'Authentication required: Sign in to delete alert rules.' };
      }
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      const res = await fetch(`/api/alerts/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        await fetchAlerts();
        return { success: true };
      }
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || 'Failed to delete alert rule' };
    } catch (err: any) {
      console.error('Error deleting alert rule:', err);
      return { success: false, error: err.message || 'Network error deleting alert rule' };
    }
  };

  // Auth helper methods
  const loginWithEmailHandler = async (email: string, pass: string) => {
    await fbLoginEmail(email, pass);
  };

  const registerWithEmailHandler = async (email: string, pass: string, displayName?: string) => {
    await fbRegisterEmail(email, pass, displayName);
  };

  const loginWithGoogleHandler = async () => {
    await fbLoginGoogle();
  };

  const resetPasswordHandler = async (email: string) => {
    await fbResetPassword(email);
  };

  const logoutHandler = async () => {
    await fbLogout();
    setCurrentUser(null);
    setActiveView('auth');
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        selectedLocation,
        setSelectedLocation,
        currentTelemetry,
        loadingTelemetry,
        stations,
        loadingStations,
        alertRules,
        exceedanceEvents,
        refreshTelemetry: () => fetchTelemetry(selectedLocation.lat, selectedLocation.lon, selectedLocation.name),
        refreshAlerts: fetchAlerts,
        searchQuery,
        setSearchQuery,
        searchResults,
        isSearching,
        selectCity,
        toggleAlertRule,
        createAlertRule,
        updateAlertRule,
        deleteAlertRule,
        currentUser,
        authLoading,
        firebaseConfigured: isFirebaseConfigured,
        loginWithEmail: loginWithEmailHandler,
        registerWithEmail: registerWithEmailHandler,
        loginWithGoogle: loginWithGoogleHandler,
        resetPassword: resetPasswordHandler,
        logout: logoutHandler,
        getIdToken: getFirebaseIdToken,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
