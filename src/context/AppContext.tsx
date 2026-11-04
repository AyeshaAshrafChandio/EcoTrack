import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AppView, EnvironmentalTelemetry, GlobalStation, AlertRule, ExceedanceEvent, SearchResult } from '../types';
import {
  auth,
  isFirebaseConfigured,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type FirebaseUser,
} from '../firebase';

export interface OperatorUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  apiKey?: string;
  provider?: string;
}

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

export interface SavedLocationItem {
  id: string;
  name: string;
  lat: number;
  lon: number;
  country?: string;
  createdAt?: string;
}

interface AppContextType {
  activeView: AppView;
  setActiveView: (view: AppView, returnTo?: AppView) => void;
  returnToView: AppView | null;
  selectedLocation: { name: string; lat: number; lon: number };
  setSelectedLocation: (loc: { name: string; lat: number; lon: number }) => void;
  currentTelemetry: EnvironmentalTelemetry | null;
  loadingTelemetry: boolean;
  stations: GlobalStation[];
  loadingStations: boolean;
  alertRules: AlertRule[];
  exceedanceEvents: ExceedanceEvent[];
  savedLocations: SavedLocationItem[];
  loadingSavedLocations: boolean;
  refreshTelemetry: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  refreshSavedLocations: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: SearchResult[];
  isSearching: boolean;
  selectCity: (name: string, lat: number, lon: number) => void;
  toggleAlertRule: (id: string) => Promise<{ success: boolean; error?: string }>;
  createAlertRule: (rule: Omit<AlertRule, 'id' | 'userId' | 'createdAt' | 'active'>) => Promise<{ success: boolean; error?: string }>;
  updateAlertRule: (id: string, updates: Partial<Omit<AlertRule, 'id' | 'userId' | 'createdAt'>>) => Promise<{ success: boolean; error?: string }>;
  deleteAlertRule: (id: string) => Promise<{ success: boolean; error?: string }>;
  saveLocation: (name: string, lat: number, lon: number, country?: string) => Promise<{ success: boolean; error?: string }>;
  deleteSavedLocation: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Authentication & Guest Flow
  currentUser: OperatorUser | null;
  firebaseUser: FirebaseUser | null;
  authLoading: boolean;
  firebaseConfigured: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;

  // Non-intrusive Guest Sign-In Prompt Modal
  authPrompt: { isOpen: boolean; title: string; message: string; returnTo?: AppView } | null;
  promptSignIn: (options: { title: string; message: string; returnTo?: AppView }) => void;
  closeAuthPrompt: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

function parseViewAndReturnFromUrl(): { view: AppView; returnTo: AppView | null } {
  try {
    let raw = '';
    if (window.location.hash) {
      raw = window.location.hash.replace(/^#\/?/, '').trim();
    } else if (window.location.pathname) {
      raw = window.location.pathname.replace(/^\//, '').trim();
    }

    const [pathPart, queryPart] = raw.split('?');
    const path = pathPart.toLowerCase();

    let returnTo: AppView | null = null;
    const searchParams = new URLSearchParams(queryPart || window.location.search);
    const rt = searchParams.get('returnTo')?.toLowerCase();
    if (rt && VALID_VIEWS.includes(rt as AppView)) {
      returnTo = rt as AppView;
    }

    let view: AppView = 'home';
    if (path === 'login' || path === 'auth') view = 'auth';
    else if (path === 'signup' || path === 'register') view = 'register';
    else if (path === 'map' || path === 'global-map') view = 'global-map';
    else if (path === 'copilot' || path === 'ai-copilot') view = 'ai-copilot';
    else if (VALID_VIEWS.includes(path as AppView)) {
      view = path as AppView;
    }

    return { view, returnTo };
  } catch {
    return { view: 'home', returnTo: null };
  }
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialNav = parseViewAndReturnFromUrl();
  const [activeView, setActiveViewState] = useState<AppView>(initialNav.view);
  const [returnToView, setReturnToView] = useState<AppView | null>(initialNav.returnTo);
  const [authPrompt, setAuthPrompt] = useState<{ isOpen: boolean; title: string; message: string; returnTo?: AppView } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ name: string; lat: number; lon: number }>({
    name: 'Karachi, Pakistan',
    lat: 24.8607,
    lon: 67.0011,
  });
  const [currentTelemetry, setCurrentTelemetry] = useState<EnvironmentalTelemetry | null>(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState<boolean>(true);
  const [stations, setStations] = useState<GlobalStation[]>([]);
  const [loadingStations, setLoadingStations] = useState<boolean>(true);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [exceedanceEvents, setExceedanceEvents] = useState<ExceedanceEvent[]>([]);
  const [savedLocations, setSavedLocations] = useState<SavedLocationItem[]>([]);
  const [loadingSavedLocations, setLoadingSavedLocations] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Authentication State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<OperatorUser | null>(() => {
    try {
      const saved = localStorage.getItem('eco_operator_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null;
  });
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Non-intrusive prompt helper (falls back to direct auth redirection)
  const promptSignIn = (options: { title: string; message: string; returnTo?: AppView }) => {
    setActiveView('auth', options.returnTo || activeView);
  };

  const closeAuthPrompt = () => {
    setAuthPrompt(null);
  };

  // Synchronize browser history and hash routing across all screens
  const setActiveView = (view: AppView, returnTo?: AppView) => {
    setActiveViewState(view);
    if (returnTo !== undefined) {
      setReturnToView(returnTo);
    }
    const targetHash = returnTo && (view === 'auth' || view === 'register')
      ? `#/${view}?returnTo=${returnTo}`
      : `#/${view}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState({ view, returnTo }, '', targetHash);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseViewAndReturnFromUrl();
      setActiveViewState(parsed.view);
      if (parsed.returnTo) {
        setReturnToView(parsed.returnTo);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    const initial = parseViewAndReturnFromUrl();
    const initialHash = initial.returnTo && (initial.view === 'auth' || initial.view === 'register')
      ? `#/${initial.view}?returnTo=${initial.returnTo}`
      : `#/${initial.view}`;
    if (window.location.hash !== initialHash) {
      window.history.replaceState({ view: initial.view, returnTo: initial.returnTo }, '', initialHash);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Auth state listener & token verification on load / refresh
  useEffect(() => {
    async function initAuth() {
      if (isFirebaseConfigured && auth) {
        // Handle redirect result if user returned from Google redirect flow
        try {
          const redirectResult = await getRedirectResult(auth);
          if (redirectResult?.user) {
            const fbUser = redirectResult.user;
            const token = await fbUser.getIdToken().catch(() => null);
            if (token) localStorage.setItem('eco_operator_token', token);
            const mapped: OperatorUser = {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google Operator',
              email: fbUser.email || '',
              role: 'Verified Institutional Operator',
              provider: 'google.com',
            };
            setCurrentUser(mapped);
            setFirebaseUser(fbUser);
            localStorage.setItem('eco_operator_user', JSON.stringify(mapped));
            
            // Sync with backend
            if (token) {
              fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
            }

            const savedDest = sessionStorage.getItem('eco_redirect_dest') as AppView | null;
            if (savedDest) {
              sessionStorage.removeItem('eco_redirect_dest');
              setActiveView(savedDest);
            }
          }
        } catch (redirErr) {
          console.warn('Redirect result check notice:', redirErr);
        }

        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          setFirebaseUser(fbUser);
          if (fbUser) {
            const token = await fbUser.getIdToken().catch(() => null);
            if (token) localStorage.setItem('eco_operator_token', token);
            const mapped: OperatorUser = {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Firebase Operator',
              email: fbUser.email || '',
              role: 'Verified Institutional Operator',
              provider: fbUser.providerData?.[0]?.providerId || 'firebase',
            };
            setCurrentUser(mapped);
            localStorage.setItem('eco_operator_user', JSON.stringify(mapped));

            // Sync with backend session
            if (token) {
              fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
            }
          } else {
            await verifyStoredLocalSession();
          }
          setAuthLoading(false);
        });
        return () => unsubscribe();
      } else {
        await verifyStoredLocalSession();
        setAuthLoading(false);
      }
    }

    async function verifyStoredLocalSession() {
      const token = localStorage.getItem('eco_operator_token');
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setCurrentUser(data.user);
            localStorage.setItem('eco_operator_user', JSON.stringify(data.user));
            return;
          }
        } catch (e) {
          console.warn('Network issue verifying session:', e);
          const savedUser = localStorage.getItem('eco_operator_user');
          if (savedUser) {
            try {
              setCurrentUser(JSON.parse(savedUser));
              return;
            } catch {}
          }
        }
        // If token was rejected by backend
        localStorage.removeItem('eco_operator_token');
        localStorage.removeItem('eco_operator_user');
        setCurrentUser(null);
      } else {
        setCurrentUser(null);
      }
    }

    initAuth();
  }, []);

  const getIdToken = async (): Promise<string | null> => {
    if (auth?.currentUser) {
      try {
        return await auth.currentUser.getIdToken();
      } catch (err) {
        console.warn('Failed to retrieve Firebase ID token:', err);
      }
    }
    return localStorage.getItem('eco_operator_token');
  };

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
      const token = await getIdToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
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
    fetchAlerts();
  }, []);

  // Search debounce with real Open-Meteo Geocoding
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

  // Alert Rules mutations
  const toggleAlertRule = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = await getIdToken();
      if (!token) {
        return { success: false, error: 'Authentication required to toggle alert rules.' };
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
      return { success: false, error: err.message || 'Network error toggling alert rule' };
    }
  };

  const createAlertRule = async (
    rule: Omit<AlertRule, 'id' | 'userId' | 'createdAt' | 'active'>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = await getIdToken();
      if (!token) {
        return { success: false, error: 'Authentication required. Please sign in to create alert rules.' };
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
      return { success: false, error: err.message || 'Network error creating alert rule' };
    }
  };

  const updateAlertRule = async (
    id: string,
    updates: Partial<Omit<AlertRule, 'id' | 'userId' | 'createdAt'>>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = await getIdToken();
      if (!token) {
        return { success: false, error: 'Authentication required to modify alert rules.' };
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
      return { success: false, error: err.message || 'Network error updating alert rule' };
    }
  };

  const deleteAlertRule = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = await getIdToken();
      if (!token) {
        return { success: false, error: 'Authentication required to delete alert rules.' };
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
      return { success: false, error: err.message || 'Network error deleting alert rule' };
    }
  };

  // Fetch saved locations for current user
  const fetchSavedLocations = async () => {
    try {
      const token = await getIdToken();
      if (!token) {
        setSavedLocations([]);
        return;
      }
      setLoadingSavedLocations(true);
      const res = await fetch('/api/saved-locations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSavedLocations(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Error fetching saved locations:', err);
    } finally {
      setLoadingSavedLocations(false);
    }
  };

  const saveLocation = async (
    name: string,
    lat: number,
    lon: number,
    country?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const token = await getIdToken();
    if (!token) {
      setActiveView('auth', activeView);
      return { success: false, error: 'Authentication required. Please sign in to save personal locations.' };
    }

    try {
      const res = await fetch('/api/saved-locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, lat, lon, country }),
      });
      if (res.ok) {
        await fetchSavedLocations();
        return { success: true };
      }
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || 'Failed to save location' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error saving location' };
    }
  };

  const deleteSavedLocation = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const token = await getIdToken();
    if (!token) {
      setActiveView('auth', activeView);
      return { success: false, error: 'Authentication required to remove saved locations.' };
    }

    try {
      const res = await fetch(`/api/saved-locations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchSavedLocations();
        return { success: true };
      }
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || 'Failed to delete saved location' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error deleting saved location' };
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchSavedLocations();
    } else {
      setSavedLocations([]);
    }
  }, [currentUser]);

  // Authentication Handlers
  const loginWithEmail = async (email: string, pass: string): Promise<void> => {
    setAuthLoading(true);
    const destView = returnToView || 'dashboard';
    try {
      if (isFirebaseConfigured && auth) {
        await signInWithEmailAndPassword(auth, email, pass);
        setReturnToView(null);
        setActiveView(destView);
        return;
      }

      // Backend PBKDF2 local authentication
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      localStorage.setItem('eco_operator_token', data.token);
      localStorage.setItem('eco_operator_user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      setReturnToView(null);
      setActiveView(destView);
    } finally {
      setAuthLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string, displayName?: string): Promise<void> => {
    setAuthLoading(true);
    const destView = returnToView || 'dashboard';
    try {
      if (isFirebaseConfigured && auth) {
        await createUserWithEmailAndPassword(auth, email, pass);
        setReturnToView(null);
        setActiveView(destView);
        return;
      }

      // Backend PBKDF2 registration
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, name: displayName }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      localStorage.setItem('eco_operator_token', data.token);
      localStorage.setItem('eco_operator_user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      setReturnToView(null);
      setActiveView(destView);
    } finally {
      setAuthLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    setAuthLoading(true);
    const destView = returnToView || 'dashboard';
    try {
      if (isFirebaseConfigured && auth) {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account',
        });

        try {
          const result = await signInWithPopup(auth, provider);
          if (result?.user) {
            const fbUser = result.user;
            const token = await fbUser.getIdToken();
            if (token) localStorage.setItem('eco_operator_token', token);
            const mapped: OperatorUser = {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google Operator',
              email: fbUser.email || '',
              role: 'Verified Institutional Operator',
              provider: 'google.com',
            };
            setCurrentUser(mapped);
            setFirebaseUser(fbUser);
            localStorage.setItem('eco_operator_user', JSON.stringify(mapped));

            // Sync with backend session to persist operator profile
            try {
              if (token) {
                await fetch('/api/auth/me', {
                  headers: { Authorization: `Bearer ${token}` },
                });
              }
            } catch (syncErr) {
              console.warn('Backend session sync notice:', syncErr);
            }

            setReturnToView(null);
            setActiveView(destView);
            return;
          }
        } catch (popupErr: any) {
          // If popup is blocked by browser within iframe, fallback to redirect flow
          if (popupErr?.code === 'auth/popup-blocked' || popupErr?.code === 'auth/cancelled-popup-request') {
            console.warn('Popup blocked in iframe, triggering redirect flow:', popupErr);
            sessionStorage.setItem('eco_redirect_dest', destView);
            await signInWithRedirect(auth, provider);
            return;
          }
          throw popupErr;
        }
        return;
      }

      throw new Error('Google Sign-In requires Firebase Authentication to be configured. Please register or sign in with your institutional email passphrase.');
    } finally {
      setAuthLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, email);
      return;
    }
    throw new Error('Firebase Auth is not yet bound to an active project. Use email passphrase login or register a new account.');
  };

  const logout = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('eco_operator_token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    } catch {}

    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth).catch(() => {});
    }
    localStorage.removeItem('eco_operator_token');
    localStorage.removeItem('eco_operator_user');
    sessionStorage.removeItem('eco_redirect_dest');
    setCurrentUser(null);
    setFirebaseUser(null);
    setSavedLocations([]);
    setActiveView('home');
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        returnToView,
        selectedLocation,
        setSelectedLocation,
        currentTelemetry,
        loadingTelemetry,
        stations,
        loadingStations,
        alertRules,
        exceedanceEvents,
        savedLocations,
        loadingSavedLocations,
        refreshTelemetry: () => fetchTelemetry(selectedLocation.lat, selectedLocation.lon, selectedLocation.name),
        refreshAlerts: fetchAlerts,
        refreshSavedLocations: fetchSavedLocations,
        searchQuery,
        setSearchQuery,
        searchResults,
        isSearching,
        selectCity,
        toggleAlertRule,
        createAlertRule,
        updateAlertRule,
        deleteAlertRule,
        saveLocation,
        deleteSavedLocation,
        currentUser,
        firebaseUser,
        authLoading,
        firebaseConfigured: isFirebaseConfigured,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        resetPassword,
        logout,
        getIdToken,
        authPrompt,
        promptSignIn,
        closeAuthPrompt,
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
