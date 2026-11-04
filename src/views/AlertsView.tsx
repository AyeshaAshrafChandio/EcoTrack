import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { AlertRule } from '../types';

export const AlertsView: React.FC = () => {
  const {
    alertRules,
    exceedanceEvents,
    toggleAlertRule,
    createAlertRule,
    updateAlertRule,
    deleteAlertRule,
    stations,
  } = useApp();

  const [filterSeverity, setFilterSeverity] = useState<'All' | 'Critical' | 'Warning' | 'Advisory'>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Rule Form State
  const [newLocation, setNewLocation] = useState('Tokyo, Japan');
  const [newPollutant, setNewPollutant] = useState<'AQI' | 'PM2.5' | 'PM10' | 'NO2' | 'O3' | 'SO2' | 'CO'>('PM2.5');
  const [newThreshold, setNewThreshold] = useState('35');
  const [newSeverity, setNewSeverity] = useState<'Critical' | 'Warning' | 'Advisory'>('Warning');
  const [newChannel, setNewChannel] = useState<'Push & Email' | 'SMS Direct' | 'Webhook' | 'Console'>('Push & Email');
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Rule Form State
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [editPollutant, setEditPollutant] = useState<'AQI' | 'PM2.5' | 'PM10' | 'NO2' | 'O3' | 'SO2' | 'CO'>('PM2.5');
  const [editOperator, setEditOperator] = useState<'>' | '>=' | '<'>('>');
  const [editThreshold, setEditThreshold] = useState('35');
  const [editSeverity, setEditSeverity] = useState<'Critical' | 'Warning' | 'Advisory'>('Warning');
  const [editChannel, setEditChannel] = useState<'Push & Email' | 'SMS Direct' | 'Webhook' | 'Console'>('Push & Email');
  const [editError, setEditError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredEvents = exceedanceEvents.filter(e => {
    if (filterSeverity === 'All') return true;
    return e.severity === filterSeverity;
  });

  const criticalCount = exceedanceEvents.filter(e => e.severity === 'Critical').length;
  const warningCount = exceedanceEvents.filter(e => e.severity === 'Warning').length;
  const advisoryCount = exceedanceEvents.filter(e => e.severity === 'Advisory').length;

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const parsedThreshold = parseFloat(newThreshold);
    if (isNaN(parsedThreshold) || parsedThreshold <= 0) {
      setCreateError('Please specify a positive numerical threshold ceiling.');
      return;
    }

    const matched = stations.find(s => `${s.city}, ${s.country}` === newLocation) || stations[0];
    const lat = matched ? matched.lat : 35.6895;
    const lon = matched ? matched.lon : 139.6917;

    await createAlertRule({
      locationName: newLocation,
      lat,
      lon,
      pollutant: newPollutant,
      operator: '>',
      threshold: parsedThreshold,
      unit: newPollutant === 'AQI' ? 'AQI' : newPollutant === 'CO' ? 'mg/m³' : 'µg/m³',
      severity: newSeverity,
      notificationChannel: newChannel,
    });

    setShowCreateModal(false);
    showToast(`Alert rule created for ${newLocation} (${newPollutant} > ${parsedThreshold})`);
  };

  const handleUpdateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    setEditError(null);
    const parsedThreshold = parseFloat(editThreshold);
    if (isNaN(parsedThreshold) || parsedThreshold <= 0) {
      setEditError('Please specify a positive numerical threshold ceiling.');
      return;
    }

    await updateAlertRule(editingRule.id, {
      pollutant: editPollutant,
      operator: editOperator,
      threshold: parsedThreshold,
      unit: editPollutant === 'AQI' ? 'AQI' : editPollutant === 'CO' ? 'mg/m³' : 'µg/m³',
      severity: editSeverity,
      notificationChannel: editChannel,
    });

    setEditingRule(null);
    showToast(`Alert rule for ${editingRule.locationName} updated successfully.`);
  };

  return (
    <div className="w-full bg-surface pb-space-xl sm:pb-space-2xl pt-space-xs sm:pt-space-md min-h-full">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-space-lg">
        {/* Top Header & Telemetry Status Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low p-3.5 sm:p-5 rounded-2xl border border-surface-container shadow-md">
          <div>
            <div className="flex items-center gap-1.5 font-label-mono-sm text-[0.625rem] sm:text-[0.6875rem] text-error font-semibold">
              <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
              <span>REAL-TIME THRESHOLD EXCEEDANCE SURVEILLANCE</span>
            </div>
            <h1 className="font-headline-xl text-xl sm:text-2xl md:text-headline-xl font-extrabold text-on-surface">
              Environmental Alerts &amp; Incident Ledger
            </h1>
            <p className="font-body-sm text-xs sm:text-body-sm text-on-surface-variant max-w-2xl">
              Automated exceedance detection triggering when physical monitoring stations breach US-EPA NAAQS or WHO 2021 air quality ceilings.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 sm:py-2.5 rounded-xl bg-primary text-on-primary font-label-ui text-xs sm:text-sm font-semibold shadow-md hover:bg-primary-fixed transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">add_alert</span>
            <span>Create Alert Rule</span>
          </button>
        </div>

        {/* Severity Filter Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-surface-container-low/70 p-2.5 sm:p-3 rounded-xl border border-surface-container">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            <button
              onClick={() => setFilterSeverity('All')}
              className={`px-3 py-1.5 rounded-full font-label-ui text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                filterSeverity === 'All'
                  ? 'bg-surface-container-high text-on-surface font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>All Incidents</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-on-surface font-label-mono-sm text-[0.625rem]">
                {exceedanceEvents.length}
              </span>
            </button>

            <button
              onClick={() => setFilterSeverity('Critical')}
              className={`px-3 py-1.5 rounded-full font-label-ui text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                filterSeverity === 'Critical'
                  ? 'bg-error-container text-on-error-container font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
              <span>Critical</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-error font-label-mono-sm text-[0.625rem]">
                {criticalCount}
              </span>
            </button>

            <button
              onClick={() => setFilterSeverity('Warning')}
              className={`px-3 py-1.5 rounded-full font-label-ui text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                filterSeverity === 'Warning'
                  ? 'bg-secondary text-on-secondary font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span>Warning</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-secondary font-label-mono-sm text-[0.625rem]">
                {warningCount}
              </span>
            </button>

            <button
              onClick={() => setFilterSeverity('Advisory')}
              className={`px-3 py-1.5 rounded-full font-label-ui text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                filterSeverity === 'Advisory'
                  ? 'bg-tertiary text-on-tertiary font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
              <span>Advisory</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-tertiary font-label-mono-sm text-[0.625rem]">
                {advisoryCount}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 font-label-mono-sm text-[0.625rem] sm:text-xs text-on-surface-variant self-start sm:self-auto">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-primary">sync</span>
              Stream: 3.2s
            </span>
          </div>
        </div>

        {/* Active Sensor Triggers & Incident Cards (3-Column Bento) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-space-lg">
          {filteredEvents.map(event => {
            const severityColor =
              event.severity === 'Critical'
                ? { spine: 'bg-error', badge: 'bg-error-container text-on-error-container', text: 'text-error' }
                : event.severity === 'Warning'
                ? { spine: 'bg-secondary', badge: 'bg-secondary text-on-secondary', text: 'text-secondary' }
                : { spine: 'bg-tertiary', badge: 'bg-tertiary text-on-tertiary', text: 'text-tertiary' };

            return (
              <div
                key={event.id}
                className="relative bg-surface-container-low/90 rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden group hover:shadow-2xl transition-all border border-surface-container"
              >
                {/* Accent spine */}
                <div className={`h-1.5 w-full ${severityColor.spine}`}></div>

                <div className="p-4 sm:p-5 flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full font-label-mono-sm text-[0.55rem] sm:text-[0.625rem] uppercase tracking-wider font-bold ${severityColor.badge}`}>
                          {event.severity}
                        </span>
                        <span className={`font-label-mono-sm text-[0.625rem] font-medium ${severityColor.text}`}>
                          {event.id.toUpperCase()}
                        </span>
                      </div>
                      <h2 className="font-headline-md text-base sm:text-headline-md font-semibold text-on-surface leading-tight truncate">
                        {event.locationName}
                      </h2>
                      <p className="font-label-mono-sm text-[0.625rem] sm:text-[0.6875rem] text-on-surface-variant flex items-center gap-1 truncate">
                        <span className="material-symbols-outlined text-[13px]">location_on</span>
                        Station: {event.stationId}
                      </p>
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                      <span className={`material-symbols-outlined text-[20px] ${severityColor.text}`}>
                        crisis_alert
                      </span>
                    </div>
                  </div>

                  {/* Value comparison metrics block */}
                  <div className="bg-surface-container rounded-xl p-3 space-y-1">
                    <div className="flex items-baseline justify-between font-label-mono-sm text-xs">
                      <span className="text-on-surface-variant">Observed {event.pollutant}</span>
                      <span className={`font-semibold ${severityColor.text}`}>
                        +{Math.round(((event.observedValue - event.threshold) / event.threshold) * 100)}% over
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="font-data-metric-lg text-2xl font-bold text-on-surface">
                          {event.observedValue}
                        </span>
                        <span className="font-label-mono-sm text-xs text-on-surface-variant">{event.unit}</span>
                      </div>
                      <div className="font-label-mono-sm text-xs text-on-surface-variant">
                        Ceiling: {event.threshold} {event.unit}
                      </div>
                    </div>
                  </div>

                  {/* Incident details explanation */}
                  <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                    {event.details}
                  </p>
                </div>

                <div className="p-3 sm:p-4 border-t border-surface-container bg-surface-container-lowest flex items-center justify-between font-label-mono-sm text-[0.625rem] sm:text-xs text-on-surface-variant">
                  <span>Logged: {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className={`font-semibold ${severityColor.text}`}>
                    {event.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Threshold Surveillance Rules */}
        <div className="rounded-2xl bg-surface-container-low border border-surface-container shadow-xl p-4 sm:p-5 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline-md text-base sm:text-headline-md font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px] sm:text-[22px]">tune</span>
                Active Surveillance Rules ({alertRules.length})
              </h2>
              <p className="font-body-sm text-xs sm:text-body-sm text-on-surface-variant">
                Autonomous background rules continuously evaluated against incoming telemetry.
              </p>
            </div>
          </div>

          <div className="divide-y divide-surface-container">
            {alertRules.map(rule => (
              <div key={rule.id} className="py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="font-body-md text-sm text-on-surface font-semibold truncate">{rule.locationName}</span>
                    <span className="px-2 py-0.5 rounded font-label-mono-sm text-[0.625rem] bg-surface-container text-secondary">
                      {rule.pollutant} {rule.operator} {rule.threshold} {rule.unit}
                    </span>
                    <span className="px-2 py-0.5 rounded font-label-mono-sm text-[0.625rem] bg-surface-container text-on-surface-variant">
                      {rule.notificationChannel}
                    </span>
                  </div>
                  <div className="font-label-mono-sm text-[0.625rem] sm:text-[0.6875rem] text-on-surface-variant">
                    Coordinates: {rule.lat.toFixed(3)}°, {rule.lon.toFixed(3)}° • Tier: {rule.severity}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => toggleAlertRule(rule.id)}
                    className={`px-3 py-1 rounded font-label-mono-sm text-xs font-semibold transition-colors cursor-pointer ${
                      rule.active
                        ? 'bg-primary/20 text-primary border border-primary/40'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {rule.active ? 'ACTIVE' : 'PAUSED'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingRule(rule);
                      setEditPollutant(rule.pollutant);
                      setEditOperator(rule.operator);
                      setEditThreshold(String(rule.threshold));
                      setEditSeverity(rule.severity);
                      setEditChannel(rule.notificationChannel);
                      setEditError(null);
                    }}
                    aria-label="Edit rule"
                    title="Edit rule"
                    className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    onClick={() => deleteAlertRule(rule.id)}
                    aria-label="Delete rule"
                    title="Delete rule"
                    className="p-1 rounded text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Status Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-container-high border border-primary/40 text-on-surface px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 font-label-ui text-xs animate-bounce">
          <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Modal: Create Threshold Rule */}
      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-surface-container-high rounded-2xl shadow-2xl border border-surface-variant p-4 sm:p-5 space-y-3 sm:space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-surface-container pb-2.5">
              <h3 className="font-headline-md text-base sm:text-headline-md font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px] sm:text-[20px]">add_alert</span>
                New Threshold Rule
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {createError && (
              <div className="p-2.5 rounded-lg bg-error-container/40 text-on-error-container border border-error/30 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateRule} className="space-y-3 font-body-sm">
              <div>
                <label className="block font-label-mono-sm text-[0.6875rem] text-on-surface-variant uppercase mb-1">
                  Target Station / Location
                </label>
                <select
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-surface-container font-body-sm text-sm text-on-surface border border-surface-variant focus:outline-none"
                >
                  {stations.map(st => (
                    <option key={st.id} value={`${st.city}, ${st.country}`}>
                      {st.city}, {st.country}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="block font-label-mono-sm text-[0.6875rem] text-on-surface-variant uppercase mb-1">
                    Pollutant Vector
                  </label>
                  <select
                    value={newPollutant}
                    onChange={e => setNewPollutant(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg bg-surface-container font-body-sm text-sm text-on-surface border border-surface-variant focus:outline-none"
                  >
                    <option value="AQI">Overall AQI</option>
                    <option value="PM2.5">PM2.5 (Fine)</option>
                    <option value="PM10">PM10 (Coarse)</option>
                    <option value="NO2">NO2 (Nitrogen)</option>
                    <option value="O3">O3 (Ozone)</option>
                    <option value="SO2">SO2 (Sulphur)</option>
                    <option value="CO">CO (Carbon Monoxide)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-label-mono-sm text-[0.6875rem] text-on-surface-variant uppercase mb-1">
                    Ceiling
                  </label>
                  <input
                    type="number"
                    value={newThreshold}
                    onChange={e => setNewThreshold(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-surface-container font-body-sm text-sm text-on-surface border border-surface-variant focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="block font-label-mono-sm text-[0.6875rem] text-on-surface-variant uppercase mb-1">
                    Severity Tier
                  </label>
                  <select
                    value={newSeverity}
                    onChange={e => setNewSeverity(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg bg-surface-container font-body-sm text-sm text-on-surface border border-surface-variant focus:outline-none"
                  >
                    <option value="Critical">Critical</option>
                    <option value="Warning">Warning</option>
                    <option value="Advisory">Advisory</option>
                  </select>
                </div>

                <div>
                  <label className="block font-label-mono-sm text-[0.6875rem] text-on-surface-variant uppercase mb-1">
                    Channel
                  </label>
                  <select
                    value={newChannel}
                    onChange={e => setNewChannel(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg bg-surface-container font-body-sm text-sm text-on-surface border border-surface-variant focus:outline-none"
                  >
                    <option value="Push & Email">Push & Email</option>
                    <option value="SMS Direct">SMS Direct</option>
                    <option value="Webhook">Webhook</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-bright cursor-pointer text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold hover:bg-primary-fixed cursor-pointer text-xs sm:text-sm"
                >
                  Save Alert Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Threshold Rule */}
      {editingRule && (
        <div
          onClick={() => setEditingRule(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-surface-container-high rounded-2xl shadow-2xl border border-surface-variant p-4 sm:p-5 space-y-3 sm:space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-surface-container pb-2.5">
              <h3 className="font-headline-md text-base sm:text-headline-md font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px] sm:text-[20px]">edit</span>
                <span>Edit Alert Rule: {editingRule.locationName}</span>
              </h3>
              <button
                onClick={() => setEditingRule(null)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {editError && (
              <div className="p-2.5 rounded-lg bg-error-container/40 text-on-error-container border border-error/30 text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateRule} className="space-y-3 font-body-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <label className="block font-label-mono-sm text-[0.6875rem] text-on-surface-variant uppercase mb-1">
                    Pollutant
                  </label>
                  <select
                    value={editPollutant}
                    onChange={e => setEditPollutant(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg bg-surface-container font-body-sm text-sm text-on-surface border border-surface-variant focus:outline-none"
                  >
                    <option value="AQI">Overall AQI</option>
                    <option value="PM2.5">PM2.5</option>
                    <option value="PM10">PM10</option>
                    <option value="NO2">NO2</option>
                    <option value="O3">O3</option>
                    <option value="SO2">SO2</option>
                    <option value="CO">CO</option>
                  </select>
                </div>

                <div>
                  <label className="block font-label-mono-sm text-[0.6875rem] text-on-surface-variant uppercase mb-1">
                    Operator
                  </label>
                  <select
                    value={editOperator}
                    onChange={e => setEditOperator(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg bg-surface-container font-body-sm text-sm text-on-surface border border-surface-variant focus:outline-none"
                  >
                    <option value=">">&gt; (Exceeds)</option>
                    <option value=">=">&gt;= (Greater or Equal)</option>
                    <option value="<">&lt; (Below)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-label-mono-sm text-[0.6875rem] text-on-surface-variant uppercase mb-1">
                    Ceiling
                  </label>
                  <input
                    type="number"
                    value={editThreshold}
                    onChange={e => setEditThreshold(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-surface-container font-body-sm text-sm text-on-surface border border-surface-variant focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="block font-label-mono-sm text-[0.6875rem] text-on-surface-variant uppercase mb-1">
                    Severity Tier
                  </label>
                  <select
                    value={editSeverity}
                    onChange={e => setEditSeverity(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg bg-surface-container font-body-sm text-sm text-on-surface border border-surface-variant focus:outline-none"
                  >
                    <option value="Critical">Critical</option>
                    <option value="Warning">Warning</option>
                    <option value="Advisory">Advisory</option>
                  </select>
                </div>

                <div>
                  <label className="block font-label-mono-sm text-[0.6875rem] text-on-surface-variant uppercase mb-1">
                    Channel
                  </label>
                  <select
                    value={editChannel}
                    onChange={e => setEditChannel(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg bg-surface-container font-body-sm text-sm text-on-surface border border-surface-variant focus:outline-none"
                  >
                    <option value="Push & Email">Push & Email</option>
                    <option value="SMS Direct">SMS Direct</option>
                    <option value="Webhook">Webhook</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-3.5 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-bright cursor-pointer text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold hover:bg-primary-fixed cursor-pointer text-xs sm:text-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
