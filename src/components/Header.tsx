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
    currentUser,
    logout,
    firebaseConfigured,
  } = useApp();

  const [showNavigateMenu, setShowNavigateMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAlertsMenu, setShowAlertsMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigateMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navigateMenuRef.current && !navigateMenuRef.current.contains(e.target as Node)) {
        setShowNavigateMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // All 8 screens properly cataloged and numbered
  const allScreens: Array<{ id: AppView; label: string; icon: string; num: number; desc: string }> = [
    { id: 'home', label: 'Home', icon: 'home', num: 1, desc: 'Global Environmental Intelligence Portal' },
    { id: 'dashboard', label: 'Environmental Dashboard', icon: 'space_dashboard', num: 2, desc: 'Real-time telemetry & atmospheric forecast' },
    { id: 'global-map', label: 'Global Pollution Map', icon: 'public', num: 3, desc: 'Planetary sensor grid & aerosol dispersion' },
    { id: 'ai-copilot', label: 'AI Environmental Copilot', icon: 'psychology', num: 4, desc: 'Meta LLaMA 3.3 70B & Vision AI analysis' },
    { id: 'compare', label: 'Compare Locations', icon: 'compare_arrows', num: 5, desc: 'Cross-continental dispersion matrix' },
    { id: 'alerts', label: 'Environmental Alerts', icon: 'crisis_alert', num: 6, desc: 'Exceedances ledger & threshold rules' },
    { id: 'auth', label: 'Login', icon: 'login', num: 7, desc: 'Portal authentication & operator sign-in' },
    { id: 'register', label: 'Signup', icon: 'person_add', num: 8, desc: 'Node provisioning & registry' },
  ];

  const primaryNavItems = allScreens.slice(0, 6);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.45)] border-b border-surface-container">
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

          {/* Desktop Navigation Links + Dedicated Navigate Button */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {/* Prominent Dedicated Navigate Button */}
            <div className="relative" ref={navigateMenuRef}>
              <button
                onClick={() => {
                  setShowNavigateMenu(!showNavigateMenu);
                  setShowUserMenu(false);
                  setShowAlertsMenu(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-ui text-xs font-semibold transition-all cursor-pointer border ${
                  showNavigateMenu
                    ? 'bg-secondary text-on-secondary border-secondary shadow-md'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container border-surface-variant'
                }`}
                aria-label="Open Navigate Menu with all 8 screens"
              >
                <span className="material-symbols-outlined text-[17px]">navigation</span>
                <span>Navigate</span>
                <span className="material-symbols-outlined text-[14px]">
                  {showNavigateMenu ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* All 8 Screens Dropdown Menu */}
              {showNavigateMenu && (
                <div className="absolute left-0 top-full mt-2 w-80 bg-surface-container-high shadow-[0_12px_32px_-4px_rgba(0,0,0,0.7)] rounded-xl p-2 z-50 border border-surface-variant">
                  <div className="px-3 py-1.5 border-b border-surface-container flex items-center justify-between">
                    <span className="font-label-mono-sm text-[0.6875rem] text-outline uppercase font-bold">
                      All 8 System Modules
                    </span>
                    <span className="font-label-mono-sm text-[0.625rem] text-primary">
                      Active: Screen {allScreens.find(s => s.id === activeView)?.num}
                    </span>
                  </div>
                  <div className="py-1 space-y-1">
                    {allScreens.map(screen => {
                      const isActive = activeView === screen.id;
                      return (
                        <button
                          key={screen.id}
                          onClick={() => {
                            setActiveView(screen.id);
                            setShowNavigateMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-start gap-2.5 transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-surface-container text-primary font-semibold border-l-2 border-primary'
                              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded flex items-center justify-center font-label-mono-sm text-[0.6875rem] font-bold shrink-0 mt-0.5 ${
                            isActive ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant'
                          }`}>
                            {screen.num}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="font-label-ui text-xs text-on-surface font-medium truncate flex items-center justify-between">
                              <span>{screen.label}</span>
                              {isActive && <span className="text-[0.625rem] text-primary font-bold">CURRENT</span>}
                            </div>
                            <div className="font-body-sm text-[0.6875rem] text-on-surface-variant truncate">
                              {screen.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Primary Module Links */}
            <nav className="flex items-center gap-0.5 xl:gap-1">
              {primaryNavItems.map(item => {
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`px-2.5 xl:px-3 py-1.5 rounded-lg transition-colors font-label-ui text-xs xl:text-label-ui cursor-pointer ${
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
          </div>

          {/* Search, Notifications & User / Auth Actions */}
          <div className="flex items-center gap-1.5 sm:gap-space-sm shrink-0">
            {/* Global Search input (desktop & tablet) */}
            <div
              onClick={() => {
                setShowSearchModal(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              className="hidden md:flex items-center gap-space-xs bg-surface-container-low px-3 py-1.5 rounded-lg w-40 lg:w-48 xl:w-60 cursor-pointer hover:bg-surface-container transition-colors border border-surface-variant/50"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
              <span className="font-body-sm text-xs sm:text-body-sm text-outline-variant truncate w-full">
                {selectedLocation.name || 'Search city...'}
              </span>
              <kbd className="font-label-mono-sm text-[0.625rem] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant shrink-0">
                Ctrl+K
              </kbd>
            </div>

            {/* Mobile Search Button */}
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

            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowAlertsMenu(!showAlertsMenu);
                  setShowUserMenu(false);
                  setShowNavigateMenu(false);
                }}
                aria-label="View notifications and alerts"
                className="w-9 h-9 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors relative cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {exceedanceEvents.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error"></span>
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

            {/* Quick Auth Buttons (Desktop) if not logged in */}
            {!currentUser && (
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  onClick={() => setActiveView('auth')}
                  className={`px-3 py-1.5 rounded-lg font-label-ui text-xs font-semibold transition-colors cursor-pointer ${
                    activeView === 'auth'
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setActiveView('register')}
                  className={`px-3 py-1.5 rounded-lg font-label-ui text-xs font-semibold transition-colors cursor-pointer ${
                    activeView === 'register'
                      ? 'bg-secondary text-on-secondary'
                      : 'bg-primary-container text-on-primary-container hover:bg-primary'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* User Profile Avatar / Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowAlertsMenu(false);
                  setShowNavigateMenu(false);
                }}
                aria-label="User profile and authentication options"
                className="flex items-center gap-space-xs p-0.5 rounded-full hover:ring-2 hover:ring-surface-variant transition-all focus:outline-none cursor-pointer"
              >
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User Avatar'}
                    className="w-8 h-8 rounded-full object-cover border border-primary/50"
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentUser ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
                  }`}>
                    <span className="material-symbols-outlined text-[18px]">
                      {currentUser ? 'person' : 'person_outline'}
                    </span>
                  </div>
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-72 max-w-xs bg-surface-container-high shadow-[0_12px_32px_-4px_rgba(0,0,0,0.65)] rounded-xl p-space-sm z-50 border border-surface-variant">
                  {currentUser ? (
                    <div className="px-3 py-2 bg-surface-container-lowest rounded-lg mb-space-xs">
                      <div className="font-label-ui text-xs text-on-surface font-semibold truncate flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
                        <span className="truncate">{currentUser.displayName || 'Authenticated Operator'}</span>
                      </div>
                      <div className="font-label-mono-sm text-[0.6875rem] text-on-surface-variant truncate">
                        {currentUser.email}
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-label-mono-sm text-[0.625rem]">
                          Firebase Auth Verified
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-surface-container-lowest rounded-lg mb-space-xs">
                      <div className="font-label-ui text-xs text-on-surface font-semibold truncate">
                        Guest Operator
                      </div>
                      <div className="font-label-mono-sm text-[0.6875rem] text-on-surface-variant">
                        {firebaseConfigured ? 'Sign in with Firebase account' : 'Awaiting Firebase credentials'}
                      </div>
                    </div>
                  )}

                  <div className="py-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setActiveView('dashboard');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left flex items-center justify-between px-3 py-2 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-body-sm text-xs transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
                        Live Dashboard
                      </span>
                      <span className="font-label-mono-sm text-[0.625rem] text-secondary">ACTIVE</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveView('alerts');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left flex items-center justify-between px-3 py-2 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-body-sm text-xs transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                        Alert Rules
                      </span>
                      <span className="font-label-mono-sm text-[0.625rem] text-primary">MANAGE</span>
                    </button>

                    {currentUser ? (
                      <button
                        onClick={async () => {
                          await logout();
                          setShowUserMenu(false);
                          setActiveView('home');
                        }}
                        className="w-full text-left flex items-center justify-between px-3 py-2 rounded text-error hover:bg-surface-container font-body-sm text-xs transition-colors cursor-pointer font-semibold border-t border-surface-container mt-1 pt-2"
                      >
                        <span className="flex items-center gap-space-xs">
                          <span className="material-symbols-outlined text-[18px]">logout</span>
                          Sign Out
                        </span>
                        <span className="font-label-mono-sm text-[0.625rem] text-error">END SESSION</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setActiveView('auth');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left flex items-center justify-between px-3 py-2 rounded text-primary hover:bg-surface-container font-body-sm text-xs transition-colors cursor-pointer font-semibold border-t border-surface-container mt-1 pt-2"
                        >
                          <span className="flex items-center gap-space-xs">
                            <span className="material-symbols-outlined text-[18px]">lock_open</span>
                            Sign In (Screen 7)
                          </span>
                          <span className="font-label-mono-sm text-[0.625rem] text-secondary">LOGIN</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveView('register');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left flex items-center justify-between px-3 py-2 rounded text-secondary hover:bg-surface-container font-body-sm text-xs transition-colors cursor-pointer font-semibold"
                        >
                          <span className="flex items-center gap-space-xs">
                            <span className="material-symbols-outlined text-[18px]">person_add</span>
                            Sign Up (Screen 8)
                          </span>
                          <span className="font-label-mono-sm text-[0.625rem] text-primary">REGISTER</span>
                        </button>
                      </>
                    )}
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

        {/* Mobile Navigation Drawer Backdrop & Menu (All 8 Screens) */}
        {showMobileNav && (
          <>
            <div
              onClick={() => setShowMobileNav(false)}
              className="fixed inset-0 top-16 bg-black/60 z-40 lg:hidden"
            />
            <div className="fixed top-16 left-0 right-0 max-h-[calc(100vh-4rem)] overflow-y-auto bg-surface-container-lowest border-b border-surface-container p-4 flex flex-col gap-1 z-50 shadow-2xl lg:hidden">
              <div className="font-label-mono-sm text-[0.625rem] text-outline uppercase px-3 py-1 flex items-center justify-between">
                <span>Navigation Menu (All 8 Screens)</span>
                <span className="text-secondary font-bold">1-TAP JUMP</span>
              </div>

              {allScreens.map(screen => {
                const isActive = activeView === screen.id;
                return (
                  <button
                    key={screen.id}
                    onClick={() => {
                      setActiveView(screen.id);
                      setShowMobileNav(false);
                    }}
                    className={`text-left px-3.5 py-2.5 rounded-lg font-label-ui text-sm transition-colors cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'bg-surface-container-high text-primary font-semibold'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded flex items-center justify-center font-label-mono-sm text-xs font-bold ${
                        isActive ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
                      }`}>
                        {screen.num}
                      </span>
                      <span className="material-symbols-outlined text-[18px]">{screen.icon}</span>
                      <span>{screen.label}</span>
                    </div>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-primary"></span>
                    )}
                  </button>
                );
              })}

              {currentUser && (
                <div className="mt-2 pt-3 border-t border-surface-container">
                  <div className="px-3 py-1 font-label-mono-sm text-[0.625rem] text-on-surface-variant truncate">
                    Logged in as: <strong className="text-primary">{currentUser.email}</strong>
                  </div>
                  <button
                    onClick={async () => {
                      await logout();
                      setShowMobileNav(false);
                      setActiveView('home');
                    }}
                    className="w-full mt-2 text-left px-3.5 py-2 rounded-lg font-label-ui text-xs text-error hover:bg-surface-container cursor-pointer flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
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
