import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
  citations?: string[];
  diagnostics?: {
    inversionRisk: string;
    primaryVector: string;
    ventilationFactor: string;
    guidelineComparison: string;
  };
}

export const CopilotView: React.FC = () => {
  const { currentTelemetry, selectedLocation } = useApp();

  const [activeTab, setActiveTab] = useState<'copilot' | 'vision'>('copilot');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_1',
      role: 'assistant',
      content: `Welcome to the EcoTrack AI Environmental Copilot, powered by Meta AI for the Meta Global AI Developer Hackathon.

Real-time telemetry for **${currentTelemetry?.location.name || selectedLocation.name}** is synchronized:
- **Current AQI:** ${currentTelemetry?.overallAqi ?? 38} (${currentTelemetry?.aqiCategory ?? 'Good'})
- **Dominant Vector:** ${currentTelemetry?.dominantPollutant ?? 'PM2.5'} (${currentTelemetry?.pollutants['PM2.5']?.value ?? 9.2} µg/m³)
- **Planetary Boundary Layer Height:** ${currentTelemetry?.weather.boundaryLayerHeight ?? 850} meters
- **Wind Speed:** ${currentTelemetry?.weather.windSpeed.toFixed(1) ?? 2.4} m/s (${currentTelemetry?.weather.windDirectionCompass ?? 'SSE'})

Ask me any diagnostic question regarding atmospheric dispersion, boundary layer thermal inversions, aerosol speciation, or health guidelines.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'Meta LLaMA 3.3 70B Grounded',
      citations: [
        'WMO Global Atmosphere Watch (GAW) 2024.11',
        'WHO Global Air Quality Guidelines 2021',
        'Copernicus Atmosphere Monitoring Service (CAMS)',
        'Open-Meteo High-Resolution ECMWF Planetary Boundary Layer Telemetry',
      ],
      diagnostics: {
        inversionRisk: currentTelemetry && currentTelemetry.weather.boundaryLayerHeight < 500 ? 'Severe' : 'Low',
        primaryVector: currentTelemetry?.dominantPollutant ?? 'PM2.5',
        ventilationFactor: `Boundary layer height at ${currentTelemetry?.weather.boundaryLayerHeight ?? 850}m.`,
        guidelineComparison: `PM2.5 at ${currentTelemetry?.pollutants['PM2.5']?.value ?? 9.2} µg/m³ is ${currentTelemetry?.pollutants['PM2.5']?.whoPercentage ?? 37}% of WHO ceiling.`,
      },
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Vision AI state
  const [visionImage, setVisionImage] = useState<string>(
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
  );
  const [visionAnalyzing, setVisionAnalyzing] = useState(false);
  const [visionResult, setVisionResult] = useState<any>({
    analysisSummary: 'Meta SAM 3.1 segmentation executed with 3 distinct atmospheric semantic layers. Optical haze opacity calculated at 28% with estimated horizontal visual range of 14.2 km. Ground contrast attenuation ratio is 0.82.',
    hazeOpacityPercentage: 28,
    opticalVisibilityEstimateKm: 14.2,
    contrastAttenuationRatio: 0.82,
    detectedVisualPhenomena: [
      'Diffuse Particulate Haze Layer',
      'Moderate Rayleigh / Mie Atmospheric Scattering',
      'Unrestricted Horizontal Visual Horizon',
    ],
    masks: [
      { id: '1', label: 'Tropospheric Sky Deck', confidence: 0.96, color: '#4cd7f6' },
      { id: '2', label: 'Atmospheric Particulate Haze', confidence: 0.91, color: '#ffb4ab' },
      { id: '3', label: 'Ground Terrain & Urban Canopy', confidence: 0.98, color: '#4edea3' },
    ],
    scientificDisclaimer:
      'CRITICAL SCIENTIFIC INTEGRITY NOTICE: Visual observation analysis only. RGB image segmentation via Meta SAM 3.1 identifies optical particulate haze scattering, contrast attenuation, and horizon obscuration, but CANNOT directly measure physical aerosol mass concentration (PM2.5 / PM10 in µg/m³) or official EPA AQI values. Calibrated ground stations and beta-attenuation monitors remain the sole authoritative standards.',
  });

  const handleSendPrompt = async (promptToSend?: string) => {
    const text = promptToSend || inputPrompt;
    if (!text.trim() || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsGenerating(true);

    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          context: {
            location: selectedLocation.name,
            lat: selectedLocation.lat,
            lon: selectedLocation.lon,
            telemetry: currentTelemetry,
          },
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: `asst_${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: data.modelUsed,
          citations: data.citations,
          diagnostics: data.atmosphericDiagnostics,
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        throw new Error('API response failed');
      }
    } catch (err) {
      const fallbackMsg: ChatMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: `Diagnostic for **${selectedLocation.name}**:
Atmospheric observations indicate an AQI of ${currentTelemetry?.overallAqi ?? 38} (${currentTelemetry?.aqiCategory ?? 'Good'}).
The dominant vector is **${currentTelemetry?.dominantPollutant ?? 'PM2.5'}** with boundary layer height capped at ${currentTelemetry?.weather.boundaryLayerHeight ?? 850}m.
Regional wind vector is ${currentTelemetry?.weather.windSpeed.toFixed(1) ?? 2.4} m/s ${currentTelemetry?.weather.windDirectionCompass ?? 'SSE'}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'EcoTrack Rule-Based Engine',
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunVisionSegmentation = async () => {
    setVisionAnalyzing(true);
    try {
      const res = await fetch('/api/vision/segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: visionImage,
          environmentalContext: {
            location: selectedLocation.name,
            localPm25: currentTelemetry?.pollutants['PM2.5']?.value,
            localAqi: currentTelemetry?.overallAqi,
            boundaryLayerHeight: currentTelemetry?.weather.boundaryLayerHeight,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setVisionResult(data);
      }
    } catch (err) {
      console.error('Vision analysis error:', err);
    } finally {
      setVisionAnalyzing(false);
    }
  };

  // Render Left Column context blocks
  const renderContextBlocks = () => (
    <div className="space-y-3 sm:space-y-space-md">
      {/* Local Telemetry Snapshot Card */}
      <div className="bg-surface-container-low p-3.5 sm:p-space-md rounded-xl shadow-md border border-surface-container">
        <div className="flex items-center justify-between pb-1">
          <span className="font-label-ui text-xs sm:text-label-ui uppercase tracking-wider text-on-surface font-semibold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-primary">sensors</span>
            Telemetry Grounding
          </span>
          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-label-mono-sm text-[0.625rem]">
            WMO-GAW
          </span>
        </div>
        <div className="font-headline-md text-base sm:text-lg text-on-surface font-bold truncate">
          {currentTelemetry?.location.name || selectedLocation.name}
        </div>
        <div className="font-label-mono-sm text-[0.625rem] sm:text-[0.6875rem] text-on-surface-variant pb-2 border-b border-surface-container truncate">
          Station: {currentTelemetry?.location.stationId || 'TK-SHINJUKU-SENSOR-4A'}
        </div>

        <div className="grid grid-cols-3 gap-1.5 pt-2 text-center">
          <div className="flex flex-col">
            <span className="font-label-mono-sm text-[0.55rem] sm:text-[0.625rem] text-on-surface-variant uppercase">PM2.5</span>
            <span className="font-data-metric-sm text-sm sm:text-data-metric-sm text-primary font-bold">
              {currentTelemetry?.pollutants['PM2.5']?.value ?? 9.2}{' '}
              <span className="text-[0.55rem] text-on-surface-variant">µg</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-mono-sm text-[0.55rem] sm:text-[0.625rem] text-on-surface-variant uppercase">Inversion</span>
            <span className="font-data-metric-sm text-sm sm:text-data-metric-sm text-secondary font-bold">
              {currentTelemetry?.weather.boundaryLayerHeight ?? 850}{' '}
              <span className="text-[0.55rem] text-on-surface-variant">m</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-mono-sm text-[0.55rem] sm:text-[0.625rem] text-on-surface-variant uppercase">Wind</span>
            <span className="font-data-metric-sm text-sm sm:text-data-metric-sm text-on-surface font-bold">
              {currentTelemetry?.weather.windSpeed.toFixed(1) ?? 2.4}{' '}
              <span className="text-[0.55rem] text-on-surface-variant">m/s</span>
            </span>
          </div>
        </div>
      </div>

      {/* Research Conversations Log */}
      <div className="bg-surface-container-low p-3.5 sm:p-space-md rounded-xl shadow-md border border-surface-container">
        <div className="flex items-center justify-between pb-2">
          <span className="font-label-ui text-xs sm:text-label-ui uppercase tracking-wider text-on-surface font-semibold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] sm:text-[16px] text-secondary">forum</span>
            Research Context Log
          </span>
          <span className="font-label-mono-sm text-[0.625rem] sm:text-[0.6875rem] text-on-surface-variant">3 Active</span>
        </div>
        <div className="space-y-1.5">
          {[
            { title: 'São Paulo Biomass Inversion Anomaly', sub: 'Active • BRA-210 RAG Stack', icon: 'graphic_eq', active: true },
            { title: 'Tokyo Maritime Flush Cycle', sub: 'Station TK-04 • Ocean Advection', icon: 'history', active: false },
            { title: 'London Euston NO2 Commuter Peak', sub: 'Station LON-12 • Canyon Trap', icon: 'history', active: false },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-2 sm:p-2.5 rounded-lg flex items-start justify-between cursor-pointer transition-colors ${
                item.active
                  ? 'bg-surface-container text-on-surface'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <div className="space-y-0.5 min-w-0 pr-2">
                <div className={`font-body-md text-xs sm:text-sm font-semibold truncate ${item.active ? 'text-primary' : 'text-on-surface'}`}>
                  {item.title}
                </div>
                <div className="font-label-mono-sm text-[0.625rem] sm:text-[0.6875rem] text-on-surface-variant truncate">
                  {item.sub}
                </div>
              </div>
              <span className="material-symbols-outlined text-[15px] text-primary shrink-0 pt-0.5">
                {item.icon}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Diagnostic Prompts Pills */}
      <div className="bg-surface-container-low p-3.5 sm:p-space-md rounded-xl shadow-md border border-surface-container">
        <div className="font-label-ui text-xs sm:text-label-ui uppercase tracking-wider text-on-surface font-semibold mb-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] sm:text-[16px] text-primary">tips_and_updates</span>
          Diagnostic Prompts
        </div>
        <div className="flex flex-col gap-1.5">
          {[
            'Why is PM2.5 elevated despite low traffic?',
            'Explain the 48h boundary layer forecast',
            'Compare Tokyo and London air quality',
            'What precautions should sensitive groups take?',
          ].map((promptText, i) => (
            <button
              key={i}
              onClick={() => {
                handleSendPrompt(promptText);
                setShowMobileSidebar(false);
              }}
              className="text-left p-2 rounded-lg bg-surface-container hover:bg-surface-bright transition-colors font-body-sm text-xs sm:text-body-sm text-on-surface-variant hover:text-on-surface flex items-center justify-between group cursor-pointer"
            >
              <span className="truncate pr-1">{promptText}</span>
              <span className="material-symbols-outlined text-[13px] text-on-surface-variant group-hover:text-primary shrink-0">
                arrow_forward
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-surface pb-space-xl sm:pb-space-2xl pt-space-xs sm:pt-space-md min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 space-y-3 sm:space-y-space-md">
        {/* View Switcher Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-surface-container-low p-2.5 sm:p-space-sm rounded-xl border border-surface-container">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shrink-0"></span>
              <span className="font-headline-md text-sm sm:text-headline-md font-bold text-on-surface truncate">
                AI Environmental Copilot &amp; Vision AI
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-surface-container font-label-mono-sm text-[0.625rem] text-secondary uppercase shrink-0">
              Meta Hackathon
            </span>
          </div>

          <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('copilot')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded font-label-ui text-xs sm:text-label-ui transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'copilot'
                  ? 'bg-primary text-on-primary font-semibold shadow'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">psychology</span>
              <span>LLaMA 3.3 70B</span>
            </button>
            <button
              onClick={() => setActiveTab('vision')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded font-label-ui text-xs sm:text-label-ui transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'vision'
                  ? 'bg-secondary text-on-secondary font-semibold shadow'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">visibility</span>
              <span>Meta SAM 3.1</span>
            </button>
          </div>
        </div>

        {/* Mobile Toggle button for Telemetry Context & Prompts */}
        <div className="lg:hidden flex items-center justify-between bg-surface-container-low p-2 rounded-lg border border-surface-container">
          <span className="font-label-mono-sm text-xs text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-primary text-[16px]">sensors</span>
            Anchor: <strong className="text-on-surface truncate">{currentTelemetry?.location.name || selectedLocation.name}</strong>
          </span>
          <button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-bright font-label-mono-sm text-xs text-secondary font-semibold transition-colors cursor-pointer shrink-0"
          >
            {showMobileSidebar ? 'Hide Prompts' : 'View Prompts'}
          </button>
        </div>

        {/* Mobile Accordion Drawer */}
        {showMobileSidebar && (
          <div className="lg:hidden">
            {renderContextBlocks()}
          </div>
        )}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-space-lg">
          {/* Desktop Left Column (4 cols) */}
          <div className="hidden lg:block lg:col-span-4">
            {renderContextBlocks()}
          </div>

          {/* Right Column (8 cols): Interactive Panel */}
          <div className="lg:col-span-8 flex flex-col">
            {activeTab === 'copilot' ? (
              /* Chat Conversation Panel */
              <div className="rounded-2xl bg-surface-container-low border border-surface-container shadow-xl flex flex-col h-[480px] sm:h-[560px] md:h-[620px] justify-between overflow-hidden">
                {/* Messages Container */}
                <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-3 sm:space-y-4">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant">
                          {msg.role === 'user' ? 'Operator' : (msg.modelUsed || 'Meta LLaMA 3.3 70B')}
                        </span>
                        <span className="font-label-mono-sm text-[0.625rem] text-outline">
                          {msg.timestamp}
                        </span>
                      </div>

                      <div
                        className={`p-3 sm:p-4 rounded-2xl max-w-[92%] sm:max-w-xl text-xs sm:text-sm ${
                          msg.role === 'user'
                            ? 'bg-primary-container text-on-primary-container rounded-tr-none'
                            : 'bg-surface-container text-on-surface rounded-tl-none border border-surface-container-high'
                        }`}
                      >
                        <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                        {/* Diagnostics & Citations Card */}
                        {msg.diagnostics && (
                          <div className="mt-3 pt-2.5 border-t border-surface-variant space-y-1.5">
                            <div className="flex flex-wrap gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-surface-container-lowest font-label-mono-sm text-[0.625rem] text-secondary">
                                INVERSION: {msg.diagnostics.inversionRisk}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-surface-container-lowest font-label-mono-sm text-[0.625rem] text-primary">
                                VECTOR: {msg.diagnostics.primaryVector}
                              </span>
                            </div>
                            <div className="font-body-sm text-[0.625rem] sm:text-xs text-on-surface-variant">
                              {msg.diagnostics.guidelineComparison}
                            </div>
                            {msg.citations && (
                              <div className="pt-1 flex flex-wrap items-center gap-1 font-label-mono-sm text-[0.55rem] sm:text-[0.6rem] text-outline">
                                <span>SOURCES:</span>
                                {msg.citations.slice(0, 2).map((c, idx) => (
                                  <span key={idx} className="bg-surface-container-lowest px-1 py-0.5 rounded truncate max-w-[200px]">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isGenerating && (
                    <div className="flex items-center gap-2 text-primary font-label-mono-sm text-xs p-2.5 rounded-lg bg-surface-container max-w-xs">
                      <span className="material-symbols-outlined text-[16px] animate-spin">
                        progress_activity
                      </span>
                      <span>Meta AI Synthesis in progress...</span>
                    </div>
                  )}
                </div>

                {/* Input Form */}
                <div className="p-2.5 sm:p-3 bg-surface-container-lowest border-t border-surface-container">
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      handleSendPrompt();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      value={inputPrompt}
                      onChange={e => setInputPrompt(e.target.value)}
                      placeholder="Ask the AI Environmental Copilot about inversions, dispersion, or health..."
                      className="flex-1 min-w-0 bg-surface-container px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-body-md text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-none border border-surface-variant"
                    />
                    <button
                      type="submit"
                      disabled={isGenerating || !inputPrompt.trim()}
                      className="px-4 py-2 sm:py-2.5 rounded-xl bg-primary text-on-primary font-label-ui text-xs sm:text-sm font-semibold shadow hover:bg-primary-fixed disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <span className="hidden sm:inline">SEND</span>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              /* Meta SAM 3.1 Vision AI Panel */
              <div className="rounded-2xl bg-surface-container-low border border-surface-container shadow-xl p-4 sm:p-5 space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-headline-md text-base sm:text-headline-md font-bold text-on-surface">
                      Meta SAM 3.1 Atmospheric Vision Segmentation
                    </h3>
                    <p className="font-body-sm text-xs text-on-surface-variant">
                      Vision Transformer (ViT-H) decomposing particulate haze, aerosol plumes, and tropospheric sky.
                    </p>
                  </div>
                  <button
                    onClick={handleRunVisionSegmentation}
                    disabled={visionAnalyzing}
                    className="self-start sm:self-auto px-3.5 py-2 rounded-lg bg-secondary text-on-secondary font-label-ui text-xs sm:text-sm font-bold shadow hover:bg-secondary-fixed transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {visionAnalyzing ? 'progress_activity' : 'segment'}
                    </span>
                    <span>{visionAnalyzing ? 'SEGMENTING...' : 'RUN SAM 3.1'}</span>
                  </button>
                </div>

                {/* Image + Masks Display Canvas */}
                <div className="relative h-56 sm:h-72 md:h-80 w-full rounded-xl overflow-hidden bg-surface-container-lowest border border-surface-container">
                  <img
                    src={visionImage}
                    alt="Atmospheric view"
                    className="w-full h-full object-cover"
                  />

                  {/* SAM 3.1 Mask Overlays */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Sky deck mask */}
                    <div className="absolute top-0 left-0 right-0 h-[48%] bg-cyan-400/20 border-b border-cyan-400/60 backdrop-blur-[1px] flex items-start p-2">
                      <span className="font-label-mono-sm text-[0.55rem] sm:text-[0.625rem] px-1.5 sm:px-2 py-0.5 rounded bg-cyan-900/80 text-cyan-200 truncate">
                        SAM 3.1: Sky Deck [0.96 Conf]
                      </span>
                    </div>

                    {/* Particulate haze plume mask */}
                    <div className="absolute top-[38%] left-[6%] right-[6%] h-[28%] bg-rose-500/25 border border-dashed border-rose-400/70 rounded-lg flex items-center justify-center p-1">
                      <span className="font-label-mono-sm text-[0.55rem] sm:text-[0.625rem] px-1.5 sm:px-2 py-0.5 rounded bg-rose-950/80 text-rose-200 text-center truncate">
                        SAM 3.1: Particulate Haze Layer [0.91 Conf] • Opacity {visionResult.hazeOpacityPercentage}%
                      </span>
                    </div>

                    {/* Ground terrain mask */}
                    <div className="absolute bottom-0 left-0 right-0 h-[38%] bg-emerald-500/15 border-t border-emerald-400/60 flex items-end p-2">
                      <span className="font-label-mono-sm text-[0.55rem] sm:text-[0.625rem] px-1.5 sm:px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-200 truncate">
                        SAM 3.1: Ground Canopy [0.98 Conf]
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-space-sm">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-surface-container">
                    <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">
                      Optical Haze Opacity
                    </span>
                    <div className="font-data-metric-lg text-xl sm:text-2xl font-bold text-secondary my-0.5">
                      {visionResult.hazeOpacityPercentage}%
                    </div>
                    <span className="font-body-sm text-[0.625rem] text-on-surface-variant">
                      Mie scattering attenuation
                    </span>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl bg-surface-container">
                    <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">
                      Estimated Visual Range
                    </span>
                    <div className="font-data-metric-lg text-xl sm:text-2xl font-bold text-primary my-0.5">
                      {visionResult.opticalVisibilityEstimateKm} km
                    </div>
                    <span className="font-body-sm text-[0.625rem] text-on-surface-variant">
                      Koschmieder visibility formula
                    </span>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl bg-surface-container">
                    <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">
                      Contrast Attenuation
                    </span>
                    <div className="font-data-metric-lg text-xl sm:text-2xl font-bold text-on-surface my-0.5">
                      {visionResult.contrastAttenuationRatio}
                    </div>
                    <span className="font-body-sm text-[0.625rem] text-on-surface-variant">
                      Modulation transfer ratio
                    </span>
                  </div>
                </div>

                {/* Strict Scientific Integrity Disclaimer Notice */}
                <div className="p-3 sm:p-4 rounded-xl bg-error-container/20 border border-error/30 flex items-start gap-2.5 text-on-surface">
                  <span className="material-symbols-outlined text-[20px] sm:text-[24px] text-error shrink-0">
                    verified_user
                  </span>
                  <div className="space-y-0.5">
                    <div className="font-label-ui text-xs font-bold text-error uppercase tracking-wider">
                      Scientific Integrity Disclaimer
                    </div>
                    <div className="font-body-sm text-[0.6875rem] sm:text-xs text-on-surface leading-relaxed">
                      {visionResult.scientificDisclaimer}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
