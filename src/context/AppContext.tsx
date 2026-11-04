import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AppView, EnvironmentalTelemetry, GlobalStation, AlertRule, ExceedanceEvent, SearchResult } from '../types';

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
  toggleAlertRule: (id: string) => Promise<void>;
  createAlertRule: (rule: Omit<AlertRule, 'id' | 'userId' | 'createdAt' | 'active'>) => Promise<void>;
  deleteAlertRule: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<AppView>('home');
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
      const res = await fetch('/api/alerts');
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

  const toggleAlertRule = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}/toggle`, { method: 'PATCH' });
      if (res.ok) {
        await fetchAlerts();
      }
    } catch (err) {
      console.error('Error toggling alert rule:', err);
    }
  };

  const createAlertRule = async (rule: Omit<AlertRule, 'id' | 'userId' | 'createdAt' | 'active'>) => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      if (res.ok) {
        await fetchAlerts();
      }
    } catch (err) {
      console.error('Error creating alert rule:', err);
    }
  };

  const deleteAlertRule = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchAlerts();
      }
    } catch (err) {
      console.error('Error deleting alert rule:', err);
    }
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
        deleteAlertRule,
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
