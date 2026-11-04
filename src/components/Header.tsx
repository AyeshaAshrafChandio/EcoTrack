import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { AppView } from '../types';

export const Header: React.FC = () => {
  const {
    activeView,
    setActiveView,
    selectedLocation,
    selectCity,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    exceedanceEvents,
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAlertsMenu, setShowAlertsMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems: Array<{ id: AppView; label: string }> = [
    { id: 'home', label: 'Home' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'global-map', label: 'Global Map' },
    { id: 'ai-copilot', label: 'AI Copilot' },
    { id: 'compare', label: 'Compare' },
    { id: 'alerts', label: 'Alerts' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.45)]">
        <div className="h-16 w-full px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-space-md">
          {/* Logo and Live Sensor Indicator */}
          <div className="flex items-center gap-2 sm:gap-space-lg shrink-0">
            <div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => setActiveView('home')}
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[20px] sm:text-[22px]">eco</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1 sm:gap-space-xs">
                  <span className="font-headline-md text-base sm:text-headline-md font-bold tracking-tight text-on-surface truncate">
                    EcoTrack
                  </span>
                  <span className="px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded bg-surface-container-high font-label-mono-sm text-[0.625rem] sm:text-label-mono-sm uppercase text-secondary tracking-wider shrink-0">
                    v3.4-AI
                  </span>
                </div>
                <span className="hidden sm:inline font-label-mono-sm text-[0.625rem] tracking-wider text-on-surface-variant uppercase font-medium truncate">
                  Global AI Environmental Intelligence
                </span>
              </div>
            </div>

            <div className="hidden xl:flex items-center gap-space-xs px-2.5 py-1 rounded-full bg-surface-container-low shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface">
                18,420 Active Global Ground Sensors
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-space-xs">
            {navItems.map(item => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`px-2.5 xl:px-3 py-1.5 rounded transition-colors font-label-ui text-label-ui cursor-pointer ${
                    isActive
                      ? 'bg-surface-container-high text-primary font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Search, Notifications & User Actions */}
          <div className="flex items-center gap-1 sm:gap-space-sm shrink-0">
            {/* Global Search input (desktop & tablet) */}
            <div
              onClick={() => {
                setShowSearchModal(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              className="hidden md:flex items-center gap-space-xs bg-surface-container-low px-3 py-1.5 rounded-lg w-44 lg:w-52 xl:w-64 cursor-pointer hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
              <span className="font-body-sm text-body-sm text-outline-variant truncate w-full">
                {selectedLocation.name || 'Search city, coordinates...'}
              </span>
              <kbd className="font-label-mono-sm text-[0.625rem] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant shrink-0">
                Ctrl+K
              </kbd>
            </div>

            {/* Mobile Search Button (phone only) */}
            <button
              onClick={() => {
                setShowSearchModal(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              aria-label="Search environmental nodes"
              className="md:hidden w-9 h-9 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
            </button>

            {/* Standard Badge */}
            <button
              onClick={() => setActiveView('dashboard')}
              className="hidden sm:flex items-center gap-space-xs px-2.5 py-1.5 rounded bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors font-label-mono-sm text-[0.6875rem] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>STD: US-EPA ▾</span>
            </button>

            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowAlertsMenu(!showAlertsMenu);
                  setShowUserMenu(false);
                }}
                aria-label="View notifications and alerts"
                className="w-9 h-9 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors relative cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {exceedanceEvents.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary"></span>
                )}
              </button>

              {/* Exceedance Alerts Dropdown */}
              {showAlertsMenu && (
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-surface-container-high shadow-[0_12px_32px_-4px_rgba(0,0,0,0.65)] rounded-xl p-space-sm z-50 border border-surface-variant">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-surface-container">
                    <span className="font-label-ui text-label-ui text-on-surface font-semibold flex items-center gap-1.5 truncate">
                      <span className="material-symbols-outlined text-[16px] text-error shrink-0">crisis_alert</span>
                      Active Exceedances ({exceedanceEvents.length})
                    </span>
                    <button
                      onClick={() => {
                        setShowAlertsMenu(false);
                        setActiveView('alerts');
                      }}
                      className="font-label-mono-sm text-[0.625rem] text-secondary hover:underline cursor-pointer shrink-0 ml-2"
                    >
                      View All
                    </button>
                  </div>
                  <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
                    {exceedanceEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        onClick={() => {
                          setShowAlertsMenu(false);
                          setActiveView('alerts');
                        }}
                        className="p-2.5 rounded-lg bg-surface-container hover:bg-surface-bright transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-label-mono-sm text-[0.625rem] font-bold text-error uppercase">
                            {event.severity} • {event.pollutant}
                          </span>
                          <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant">
                            {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="font-body-sm text-[0.75rem] font-semibold text-on-surface truncate">
                          {event.locationName}
                        </div>
                        <div className="font-label-mono-sm text-[0.6875rem] text-on-surface-variant truncate">
                          Observed: <strong className="text-error">{event.observedValue} {event.unit}</strong> (Ceiling: {event.threshold} {event.unit})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar and Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowAlertsMenu(false);
                }}
                aria-label="User profile and authentication options"
                className="flex items-center gap-space-xs p-0.5 rounded-full hover:ring-2 hover:ring-surface-variant transition-all focus:outline-none cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-72 max-w-xs bg-surface-container-high shadow-[0_12px_32px_-4px_rgba(0,0,0,0.65)] rounded-xl p-space-sm z-50 border border-surface-variant">
                  <div className="px-3 py-2 bg-surface-container-lowest rounded-lg mb-space-xs">
                    <div className="font-label-ui text-label-ui text-on-surface font-semibold truncate">
                      Environmental Operations Lead
                    </div>
                    <div className="font-label-mono-sm text-label-mono-sm text-on-surface-variant truncate">
                      ops-telemetry@ecotrack.ai
                    </div>
                  </div>
                  <div className="py-1 space-y-0.5">
                    <div
                      onClick={() => {
                        setActiveView('dashboard');
                        setShowUserMenu(false);
                      }}
                      className="flex items-center justify-between px-3 py-2 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-body-sm text-body-sm transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[18px]">account_circle</span>
                        User Profile
                      </span>
                      <span className="font-label-mono-sm text-[0.625rem] text-secondary">OPS-1</span>
                    </div>
                    <div
                      onClick={() => {
                        setActiveView('dashboard');
                        setShowUserMenu(false);
                      }}
                      className="flex items-center justify-between px-3 py-2 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-body-sm text-body-sm transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[18px]">straighten</span>
                        Measurement Units
                      </span>
                      <span className="font-label-mono-sm text-[0.625rem] text-on-surface">°C / Metric</span>
                    </div>
                    <div
                      onClick={() => {
                        setActiveView('dashboard');
                        setShowUserMenu(false);
                      }}
                      className="flex items-center justify-between px-3 py-2 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-body-sm text-body-sm transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[18px]">fact_check</span>
                        AQI Standard
                      </span>
                      <span className="font-label-mono-sm text-[0.625rem] text-primary">US-EPA / WHO</span>
                    </div>
                    <div
                      onClick={() => {
                        setActiveView('alerts');
                        setShowUserMenu(false);
                      }}
                      className="flex items-center gap-space-xs px-3 py-2 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-body-sm text-body-sm transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                      Notification Preferences
                    </div>
                    {/* Screen 7: Sign in */}
                    <div
                      onClick={() => {
                        setActiveView('auth');
                        setShowUserMenu(false);
                      }}
                      className="flex items-center justify-between px-3 py-2 rounded text-primary hover:bg-surface-container font-body-sm text-body-sm transition-colors cursor-pointer font-semibold border-t border-surface-container mt-1 pt-2"
                    >
                      <span className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[18px]">lock_open</span>
                        Portal Sign-In
                      </span>
                      <span className="font-label-mono-sm text-[0.625rem] text-secondary">NODE-ENTRY</span>
                    </div>
                    {/* Screen 8: Provision node */}
                    <div
                      onClick={() => {
                        setActiveView('register');
                        setShowUserMenu(false);
                      }}
                      className="flex items-center justify-between px-3 py-2 rounded text-secondary hover:bg-surface-container font-body-sm text-body-sm transition-colors cursor-pointer font-semibold"
                    >
                      <span className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                        Node Provisioning
                      </span>
                      <span className="font-label-mono-sm text-[0.625rem] text-primary">REGISTER</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              aria-label="Toggle navigation menu"
              className="lg:hidden w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">
                {showMobileNav ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer Backdrop & Menu */}
        {showMobileNav && (
          <>
            <div
              onClick={() => setShowMobileNav(false)}
              className="fixed inset-0 top-16 bg-black/60 z-40 lg:hidden"
            />
            <div className="fixed top-16 left-0 right-0 max-h-[calc(100vh-4rem)] overflow-y-auto bg-surface-container-lowest border-b border-surface-container p-4 flex flex-col gap-1 z-50 shadow-2xl lg:hidden">
              <div className="font-label-mono-sm text-[0.625rem] text-outline uppercase px-3 py-1">
                Main Environmental Modules
              </div>
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    setShowMobileNav(false);
                  }}
                  className={`text-left px-3.5 py-2.5 rounded-lg font-label-ui text-sm transition-colors cursor-pointer flex items-center justify-between ${
                    activeView === item.id
                      ? 'bg-surface-container-high text-primary font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span>{item.label}</span>
                  {activeView === item.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  )}
                </button>
              ))}

              <div className="font-label-mono-sm text-[0.625rem] text-outline uppercase px-3 pt-3 pb-1 border-t border-surface-container mt-2">
                Operator Security &amp; Registry
              </div>
              <button
                onClick={() => {
                  setActiveView('auth');
                  setShowMobileNav(false);
                }}
                className={`text-left px-3.5 py-2.5 rounded-lg font-label-ui text-sm transition-colors cursor-pointer flex items-center gap-2 ${
                  activeView === 'auth'
                    ? 'bg-surface-container-high text-primary font-semibold'
                    : 'text-primary hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">lock</span>
                <span>Portal Sign-In</span>
              </button>
              <button
                onClick={() => {
                  setActiveView('register');
                  setShowMobileNav(false);
                }}
                className={`text-left px-3.5 py-2.5 rounded-lg font-label-ui text-sm transition-colors cursor-pointer flex items-center gap-2 ${
                  activeView === 'register'
                    ? 'bg-surface-container-high text-secondary font-semibold'
                    : 'text-secondary hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>Node Account Provisioning</span>
              </button>

              <div className="mt-2 pt-3 border-t border-surface-container flex items-center justify-between px-3 text-on-surface-variant font-label-mono-sm text-[0.6875rem]">
                <span>18,420 Active Sensors</span>
                <span className="text-primary font-semibold">WMO GAW Syncd</span>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Global Geospatial Search Modal (Ctrl+K or 1-tap on mobile) */}
      {showSearchModal && (
        <div
          onClick={() => setShowSearchModal(false)}
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-3 sm:px-4 bg-black/60 backdrop-blur-sm"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl bg-surface-container-high shadow-2xl border border-surface-variant overflow-hidden"
          >
            <div className="flex items-center gap-2 p-3 sm:p-space-md border-b border-surface-container bg-surface-container-lowest">
              <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">travel_explore</span>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Query any coordinates or city (e.g. Tokyo, London, 35.68, 139.69)..."
                className="w-full bg-transparent font-body-md text-sm sm:text-base text-on-surface placeholder:text-outline focus:outline-none"
              />
              {isSearching && (
                <span className="material-symbols-outlined text-primary text-[20px] animate-spin shrink-0">
                  progress_activity
                </span>
              )}
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1 rounded text-on-surface-variant hover:text-on-surface cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Search Results List */}
            <div className="p-2 sm:p-space-sm max-h-72 sm:max-h-80 overflow-y-auto">
              {searchResults.length > 0 ? (
                <div className="space-y-1">
                  <div className="font-label-mono-sm text-[0.625rem] text-outline uppercase px-2 py-1">
                    Verified Global Nodes ({searchResults.length})
                  </div>
                  {searchResults.map(res => (
                    <div
                      key={res.id}
                      onClick={() => {
                        selectCity(res.name, res.latitude, res.longitude);
                        setShowSearchModal(false);
                        setActiveView('dashboard');
                      }}
                      className="p-2.5 rounded-lg bg-surface-container hover:bg-surface-bright flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="material-symbols-outlined text-primary text-[20px] shrink-0">location_on</span>
                        <div className="min-w-0">
                          <div className="font-body-md text-sm text-on-surface font-semibold truncate">{res.name}</div>
                          <div className="font-label-mono-sm text-[0.6875rem] text-on-surface-variant truncate">
                            {res.admin1 ? `${res.admin1}, ` : ''}{res.country}
                          </div>
                        </div>
                      </div>
                      <span className="font-label-mono-sm text-[0.6875rem] text-secondary shrink-0">
                        {res.latitude.toFixed(2)}°, {res.longitude.toFixed(2)}°
                      </span>
                    </div>
                  ))}
                </div>
              ) : searchQuery.trim().length > 0 && !isSearching ? (
                <div className="p-4 text-center text-on-surface-variant font-body-sm text-xs sm:text-sm">
                  No matching environmental station found. Try city name or decimal coordinates.
                </div>
              ) : (
                <div className="space-y-2 p-1 sm:p-2">
                  <div className="font-label-mono-sm text-[0.625rem] text-outline uppercase">
                    Quick Planetary Telemetry Nodes
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                    {[
                      { name: 'Tokyo, Japan', lat: 35.6895, lon: 139.6917 },
                      { name: 'London, UK', lat: 51.5074, lon: -0.1278 },
                      { name: 'Delhi NCR, India', lat: 28.6139, lon: 77.209 },
                      { name: 'São Paulo, Brazil', lat: -23.6273, lon: -46.6566 },
                      { name: 'Los Angeles, USA', lat: 33.8247, lon: -118.1892 },
                      { name: 'Singapore Central', lat: 1.3521, lon: 103.8198 },
                    ].map(node => (
                      <button
                        key={node.name}
                        onClick={() => {
                          selectCity(node.name, node.lat, node.lon);
                          setShowSearchModal(false);
                          setActiveView('dashboard');
                        }}
                        className="p-2 rounded bg-surface-container hover:bg-surface-bright text-left font-body-sm text-xs sm:text-body-sm text-on-surface flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span className="truncate">{node.name}</span>
                        <span className="material-symbols-outlined text-[16px] text-primary shrink-0 ml-1">arrow_forward</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
