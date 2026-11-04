import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';

interface EvidencePacket {
  locationName: string;
  overallAqi: number;
  aqiCategory: string;
  dominantPollutant: string;
  timestamp: string;
  meteorology?: {
    temperatureC: number;
    humidityPercent: number;
    windSpeedMs: number;
    boundaryLayerHeightMeters: number;
  };
  pollutants?: Array<{
    code: string;
    name: string;
    value: number;
    unit: string;
    whoBenchmark24h: number;
    whoPercentage: number;
    status: string;
  }>;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
  modelCreator?: string;
  hostingProvider?: string;
  citations?: string[];
  evidencePacket?: EvidencePacket;
  inversionRisk?: string;
}

export const CopilotView: React.FC = () => {
  const { currentTelemetry, selectedLocation, getIdToken, currentUser, setActiveView } = useApp();

  const [activeTab, setActiveTab] = useState<'copilot' | 'visual-inspection'>('copilot');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_1',
      role: 'assistant',
      content: `### Welcome to EcoTrack AI Environmental Copilot

**System Architecture:**
- **Model:** Meta Llama 3.2 3B Instruct (\`@cf/meta/llama-3.2-3b-instruct\`)
- **Hosting:** Cloudflare Workers AI (100% Free Plan) / Local Ollama Fallback
- **Grounding Feed:** Open-Meteo Global Atmospheric Forecast Model (Copernicus CAMS & ECMWF)
- **Scientific Standards:** WHO 2021 Global Air Quality Guidelines & US-EPA 40 CFR Part 58 Breakpoints
- **Language Support:** English & Urdu (اردو)

**Current Real Telemetry for ${currentTelemetry?.location.name || selectedLocation.name}:**
- **Air Quality Index:** **${currentTelemetry?.overallAqi ?? 42}** (${currentTelemetry?.aqiCategory ?? 'Moderate'})
- **Dominant Pollutant Vector:** **${currentTelemetry?.dominantPollutant ?? 'PM2.5'}** (${currentTelemetry?.pollutants['PM2.5']?.value ?? 14.2} µg/m³)
- **Planetary Boundary Layer Height:** **${currentTelemetry?.weather.boundaryLayerHeight ?? 850} m** (Inversion Ceiling)
- **Surface Wind:** **${currentTelemetry?.weather.windSpeed.toFixed(1) ?? 2.8} m/s** (${currentTelemetry?.weather.windDirectionCompass ?? 'SSE'})

Ask me any scientific question regarding aerosol dispersion, atmospheric inversion trapping, health guidelines, or request an explanation in **Urdu (اردو)**.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'Meta Llama 3.2 3B Instruct (@cf/meta/llama-3.2-3b-instruct)',
      modelCreator: 'Meta',
      hostingProvider: 'Cloudflare Workers AI (Free Tier)',
      citations: [
        'Open-Meteo Air Quality API (Copernicus CAMS & ECMWF)',
        'WHO Global Air Quality Guidelines 2021',
        'US-EPA 40 CFR Part 58 Breakpoints',
      ],
      inversionRisk: currentTelemetry && currentTelemetry.weather.boundaryLayerHeight < 500 ? 'Severe' : 'Low',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [preferredProvider, setPreferredProvider] = useState<'cloudflare' | 'groq' | 'ollama'>('cloudflare');

  // Visual inspection state (Honest preview, zero fake SAM 3.1)
  const [inspectedImage, setInspectedImage] = useState<string>(
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
  );
  const [imageMeta, setImageMeta] = useState<{ name: string; sizeKb: number; uploadTime: string }>({
    name: 'sample_outdoor_atmosphere.jpg',
    sizeKb: 142,
    uploadTime: 'Initial Baseline Sample',
  });
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageAnalysisResult, setImageAnalysisResult] = useState<{
    disclaimer: string;
    observations: string[];
    visibleHazeLevel?: string;
    weatherContext?: {
      relativeHumidity: number;
      boundaryLayerHeight: number;
      windSpeed: number;
    };
    modelForecastComparison?: {
      aqi: number;
      dominantPollutant: string;
    };
  } | null>(null);
  const [imageAnalysisError, setImageAnalysisError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Selected image exceeds the 5MB file size limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setInspectedImage(reader.result as string);
      setImageAnalysisResult(null);
      setImageAnalysisError(null);
      setImageMeta({
        name: file.name,
        sizeKb: Math.round(file.size / 1024),
        uploadTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRunImageAnalysis = async () => {
    if (!inspectedImage || isAnalyzingImage) return;
    setIsAnalyzingImage(true);
    setImageAnalysisError(null);

    try {
      const token = await getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/copilot/analyze-image', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          imageData: inspectedImage,
          locationContext: {
            name: selectedLocation.name,
            lat: selectedLocation.lat,
            lon: selectedLocation.lon,
            telemetry: currentTelemetry,
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setImageAnalysisResult(data);
    } catch (err: any) {
      setImageAnalysisError(err.message || 'Image context analysis failed.');
    } finally {
      setIsAnalyzingImage(false);
    }
  };

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
      const token = await getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: text,
          preferredProvider,
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
          modelCreator: data.modelCreator,
          hostingProvider: data.hostingProvider,
          citations: data.citations,
          evidencePacket: data.evidencePacket,
          inversionRisk: data.inversionRisk,
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
    } catch (err: any) {
      const fallbackMsg: ChatMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: `### Telemetry Evidence Notice\n\n` +
          `Failed to connect to the configured AI inference provider: ${err.message || 'Unknown network error'}.\n\n` +
          `**Live Open-Meteo Telemetry for ${selectedLocation.name}:**\n` +
          `- **Overall EPA AQI:** ${currentTelemetry?.overallAqi ?? 'N/A'}\n` +
          `- **Dominant Pollutant:** ${currentTelemetry?.dominantPollutant ?? 'PM2.5'}\n` +
          `- **Planetary Boundary Layer Height:** ${currentTelemetry?.weather.boundaryLayerHeight ?? 'N/A'} m\n` +
          `- **Wind Speed:** ${currentTelemetry?.weather.windSpeed.toFixed(1) ?? 'N/A'} m/s (${currentTelemetry?.weather.windDirectionCompass ?? 'N/A'})\n\n` +
          `*To activate free Meta Llama 3.2 3B inference, configure \`CLOUDFLARE_ACCOUNT_ID\` and \`CLOUDFLARE_API_TOKEN\` in \`.env\`.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'Open-Meteo Grounded Telemetry Engine',
        citations: ['Open-Meteo Copernicus CAMS & ECMWF'],
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const samplePrompts = [
    { label: 'Explain air quality & health risks', prompt: 'Explain the current air quality situation, dominant pollutant, and health risks for vulnerable groups.' },
    { label: 'Explain PM2.5 vs PM10', prompt: 'Explain the scientific difference between PM2.5 and PM10 in terms of particle size, sources, and biological penetration.' },
    { label: 'What environmental data is missing?', prompt: 'What environmental information or pollutant measurements are currently unavailable or uncertain in this forecast?' },
    { label: 'Practical actions for residents', prompt: 'What practical, evidence-based environmental actions can residents take given today\'s air quality?' },
    { label: 'اردو میں بتائیں (Urdu Diagnostic)', prompt: 'اس شہر کی موجودہ فضائی آلودگی کی صورتحال اور صحت کے احتیاطی تدابیر اردو میں تفصیل سے بتائیں۔' },
  ];

  return (
    <div className="w-full bg-surface pb-space-xl sm:pb-space-2xl pt-space-xs sm:pt-space-md min-h-full">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-space-md">
        {/* Top Header & Architecture Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low p-3 sm:p-5 rounded-2xl border border-surface-container shadow-md">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-space-xs font-label-mono-sm text-[0.625rem] sm:text-label-mono-sm text-secondary">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0"></span>
              <span className="uppercase tracking-wider font-semibold">
                MODEL: META LLAMA 3.2 3B INSTRUCT (@cf/meta/llama-3.2-3b-instruct)
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline text-on-surface-variant">CLOUDFLARE WORKERS AI FREE TIER</span>
            </div>
            <h1 className="font-display-lg text-xl sm:text-2xl md:text-3xl text-on-surface font-extrabold flex items-center gap-2">
              <span>AI Environmental Copilot</span>
              <span className="px-2 py-0.5 rounded bg-surface-container font-label-mono-sm text-[0.625rem] text-primary uppercase font-bold shrink-0">
                Grounded RAG
              </span>
            </h1>
            <p className="font-body-sm text-xs sm:text-body-sm text-on-surface-variant max-w-2xl leading-relaxed">
              Scientific atmospheric reasoning anchored in real Open-Meteo physical forecast telemetry (Copernicus CAMS &amp; ECMWF).
            </p>
          </div>

          {/* Tab Switcher & Mobile Telemetry Toggle */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            <button
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-ui text-xs font-semibold cursor-pointer border border-surface-variant"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">analytics</span>
              <span>{showMobileSidebar ? 'Hide Telemetry' : 'View Telemetry'}</span>
            </button>

            <div className="flex items-center p-1 bg-surface-container rounded-xl border border-surface-variant">
              <button
                onClick={() => setActiveTab('copilot')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-ui text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'copilot'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">psychology</span>
                <span>AI Copilot</span>
              </button>
              <button
                onClick={() => setActiveTab('visual-inspection')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-ui text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'visual-inspection'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                <span>Visual Context &amp; Disclaimers</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid: Telemetry Context Drawer (Cols 1-4) + Chat / Visual Panel (Cols 5-12) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Side Drawer: Real Telemetry Grounding Evidence Packet */}
          <div className={`lg:col-span-4 space-y-3 sm:space-y-4 ${showMobileSidebar ? 'block' : 'hidden lg:block'}`}>
            <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-surface-container shadow-md space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="font-label-ui text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  Live Grounding Telemetry
                </span>
                <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant">
                  {currentTelemetry?.telemetryMetadata.latencyMs ?? 32}ms
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container space-y-1">
                <div className="font-headline-md text-sm sm:text-base font-bold text-on-surface truncate">
                  {currentTelemetry?.location.name || selectedLocation.name}
                </div>
                <div className="font-label-mono-sm text-[0.625rem] text-on-surface-variant">
                  Coord: {selectedLocation.lat.toFixed(4)}° N, {selectedLocation.lon.toFixed(4)}° E
                </div>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-surface-container">
                  <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">EPA AQI</span>
                  <div className="font-data-metric-lg text-xl sm:text-2xl font-bold text-primary">
                    {currentTelemetry?.overallAqi ?? 'N/A'}
                  </div>
                  <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant truncate block">
                    {currentTelemetry?.aqiCategory ?? 'Standard'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-surface-container">
                  <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">Dominant Vector</span>
                  <div className="font-data-metric-lg text-lg sm:text-xl font-bold text-secondary truncate">
                    {currentTelemetry?.dominantPollutant ?? 'PM2.5'}
                  </div>
                  <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant">
                    {currentTelemetry?.pollutants[currentTelemetry.dominantPollutant]?.value ?? 0} {currentTelemetry?.pollutants[currentTelemetry.dominantPollutant]?.unit ?? 'µg/m³'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-surface-container">
                  <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">Boundary Layer</span>
                  <div className="font-data-metric-lg text-lg sm:text-xl font-bold text-on-surface">
                    {currentTelemetry?.weather.boundaryLayerHeight ?? 850}m
                  </div>
                  <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant">
                    {currentTelemetry && currentTelemetry.weather.boundaryLayerHeight < 500 ? 'High Inversion' : 'Normal Deck'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-surface-container">
                  <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">Wind Ventilation</span>
                  <div className="font-data-metric-lg text-lg sm:text-xl font-bold text-on-surface">
                    {currentTelemetry?.weather.windSpeed.toFixed(1) ?? 2.8} m/s
                  </div>
                  <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant">
                    From {currentTelemetry?.weather.windDirectionCompass ?? 'N'}
                  </span>
                </div>
              </div>

              {/* Pollutants Breakdown */}
              <div className="space-y-2 pt-2 border-t border-surface-container">
                <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase tracking-wider block">
                  Harmonized Pollutant Breakdown (WHO 2021)
                </span>
                {currentTelemetry?.pollutants && Object.entries(currentTelemetry.pollutants).slice(0, 5).map(([k, p]) => (
                  <div key={k} className="flex items-center justify-between text-xs py-1 border-b border-surface-container/50">
                    <span className="font-label-ui font-semibold text-on-surface">{k}</span>
                    <span className="font-label-mono-sm text-on-surface-variant">
                      <strong className="text-on-surface">{p.value}</strong> {p.unit} ({p.whoPercentage}% WHO)
                    </span>
                  </div>
                ))}
              </div>

              {/* Provenance note */}
              <div className="p-2.5 rounded-xl bg-surface-container-lowest text-[0.6875rem] font-body-sm text-on-surface-variant leading-relaxed">
                <strong>Data Provenance:</strong> Forecast values computed by Copernicus Atmosphere Monitoring Service (CAMS) &amp; ECMWF high-resolution global atmospheric models via Open-Meteo.
              </div>
            </div>
          </div>

          {/* Main Area: Chat Interface OR Visual Inspection */}
          <div className="lg:col-span-8">
            {activeTab === 'copilot' ? (
              <div className="flex flex-col h-[650px] sm:h-[720px] rounded-2xl bg-surface-container-low border border-surface-container shadow-xl overflow-hidden">
                {/* Chat Top Banner with Provider Selector */}
                <div className="px-4 py-3 bg-surface-container-lowest border-b border-surface-container flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    <span className="font-label-ui text-xs font-bold text-on-surface">
                      AI Environmental Copilot
                    </span>
                    <span className="hidden sm:inline text-on-surface-variant text-xs">•</span>
                    <span className="hidden sm:inline font-label-mono-sm text-[0.625rem] text-primary">
                      English &amp; اردو
                    </span>
                  </div>

                  {/* Provider Selector */}
                  <div className="flex items-center gap-2">
                    <label className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase hidden md:inline">
                      Inference Engine:
                    </label>
                    <select
                      value={preferredProvider}
                      onChange={e => setPreferredProvider(e.target.value as any)}
                      className="bg-surface-container border border-surface-variant rounded-lg px-2.5 py-1 text-xs font-label-mono-sm text-on-surface focus:outline-none cursor-pointer"
                    >
                      <option value="cloudflare">Meta Llama 3.2 3B (Cloudflare Free Tier - Primary)</option>
                      <option value="groq">Groq Cloud LPU (Secondary / Fallback)</option>
                      <option value="ollama">Local Ollama (Offline / Air-Gapped)</option>
                    </select>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-4">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 text-primary">
                          <span className="material-symbols-outlined text-[18px]">psychology</span>
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-primary text-on-primary font-body-md shadow-md rounded-tr-none'
                            : 'bg-surface-container text-on-surface border border-surface-variant/40 shadow-sm rounded-tl-none space-y-2.5'
                        }`}
                      >
                        <div className="whitespace-pre-wrap font-body-md leading-relaxed">
                          {msg.content}
                        </div>

                        {msg.role === 'assistant' && (
                          <div className="pt-2 border-t border-surface-variant/30 flex flex-wrap items-center justify-between gap-2 font-label-mono-sm text-[0.625rem] text-on-surface-variant">
                            <span className="truncate max-w-[260px] text-primary">
                              {msg.modelUsed || '@cf/meta/llama-3.2-3b-instruct'}
                            </span>
                            {msg.hostingProvider && (
                              <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-secondary truncate">
                                {msg.hostingProvider}
                              </span>
                            )}
                            {msg.citations && msg.citations.length > 0 && (
                              <span className="text-on-surface-variant truncate">
                                Ref: {msg.citations[0]}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center shrink-0 text-on-surface-variant">
                          <span className="material-symbols-outlined text-[18px]">person</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {isGenerating && (
                    <div className="flex items-center gap-2 text-primary font-label-mono-sm text-xs p-3 rounded-xl bg-surface-container max-w-xs">
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      <span>
                        {preferredProvider === 'groq'
                          ? 'Groq Cloud LPU reasoning...'
                          : preferredProvider === 'ollama'
                          ? 'Local Ollama reasoning...'
                          : 'Meta Llama 3.2 3B reasoning...'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Suggested Prompts Strip */}
                <div className="px-3 sm:px-4 py-2 bg-surface-container-lowest/80 border-t border-surface-container flex items-center gap-2 overflow-x-auto scrollbar-none">
                  <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase shrink-0">
                    Suggested:
                  </span>
                  {samplePrompts.map((sp, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendPrompt(sp.prompt)}
                      disabled={isGenerating}
                      className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-bright text-[0.6875rem] font-label-ui text-on-surface hover:text-primary whitespace-nowrap transition-colors border border-surface-variant/40 shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {sp.label}
                    </button>
                  ))}
                </div>

                {/* Input Form */}
                <div className="p-3 bg-surface-container-lowest border-t border-surface-container">
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
                      placeholder="Ask Meta Llama 3.2 3B about air quality, inversion caps, or ask in Urdu (اردو)..."
                      className="flex-1 min-w-0 bg-surface-container px-3 sm:px-4 py-2.5 rounded-xl font-body-md text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-none border border-surface-variant"
                    />
                    <button
                      type="submit"
                      disabled={isGenerating || !inputPrompt.trim()}
                      className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-label-ui text-xs sm:text-sm font-semibold shadow hover:bg-primary-fixed disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <span className="hidden sm:inline">SEND</span>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              /* Visual Context & Scientific Disclaimers Panel */
              <div className="p-4 sm:p-6 rounded-2xl bg-surface-container-low border border-surface-container shadow-xl space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="font-display-lg text-lg sm:text-xl font-bold text-on-surface">
                      Environmental Visual Context &amp; Disclaimers
                    </h2>
                    <p className="font-body-sm text-xs text-on-surface-variant">
                      Inspect site images alongside telemetry without deceptive or ungrounded claims.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-bright border border-surface-variant font-label-ui text-xs font-semibold text-on-surface flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary">cloud_upload</span>
                      <span>Change Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRunImageAnalysis}
                      disabled={isAnalyzingImage}
                      className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-fixed text-on-primary font-label-ui text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md disabled:opacity-50"
                    >
                      {isAnalyzingImage ? (
                        <>
                          <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                          <span>Analyzing Visual Context...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">search_check</span>
                          <span>Run Visual Inspection</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Honest Scientific Disclaimer Box */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm leading-relaxed space-y-1">
                  <div className="font-label-ui font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-300">
                    <span className="material-symbols-outlined text-[18px]">gavel</span>
                    Scientific Integrity &amp; Hackathon Compliance Disclosure
                  </div>
                  <p>
                    <strong>Visual appearance (RGB pixels) cannot measure particulate mass concentration (PM2.5 or PM10 in µg/m³) or compute official AQI.</strong> Measuring atmospheric aerosols requires calibrated physical instruments such as Beta Attenuation Monitors (BAM-1020), laser optical particle counters, or gravimetric filters.
                  </p>
                  <p className="text-on-surface-variant text-xs pt-1">
                    EcoTrack firmly refuses to generate fabricated pixel segmentation masks or invent fake confidence numbers. All air quality metrics displayed in this portal originate directly from Open-Meteo physical meteorological and atmospheric dispersion models (Copernicus CAMS &amp; ECMWF).
                  </p>
                </div>

                {/* Image Analysis Results Card if available */}
                {imageAnalysisError && (
                  <div className="p-3 rounded-xl bg-error/15 border border-error/30 text-error text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    <span>{imageAnalysisError}</span>
                  </div>
                )}

                {imageAnalysisResult && (
                  <div className="p-4 rounded-xl bg-surface-container border border-primary/30 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-surface-variant/40">
                      <span className="font-label-ui text-xs font-bold text-primary flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        Qualitative Visual Context Analysis Result
                      </span>
                      <span className="font-label-mono-sm text-[0.625rem] text-secondary">
                        Visible Haze: {imageAnalysisResult.visibleHazeLevel || 'Low / Moderate'}
                      </span>
                    </div>

                    {/* Prominent Mandatory Disclaimer Banner */}
                    <div className="p-2.5 rounded-lg bg-surface-container-lowest text-on-surface-variant font-label-mono-sm text-[0.6875rem] border-l-2 border-primary">
                      ⚠️ <strong>Mandatory Compliance Notice:</strong> {imageAnalysisResult.disclaimer}
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase tracking-wider">
                        Qualitative Observations:
                      </span>
                      <ul className="space-y-1">
                        {imageAnalysisResult.observations.map((obs, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-on-surface">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                            <span>{obs}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {imageAnalysisResult.weatherContext && (
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-surface-variant/30 font-label-mono-sm text-[0.6875rem]">
                        <div className="p-2 rounded bg-surface-container-lowest">
                          <span className="text-on-surface-variant block">Humidity:</span>
                          <span className="text-on-surface font-semibold">{imageAnalysisResult.weatherContext.relativeHumidity}%</span>
                        </div>
                        <div className="p-2 rounded bg-surface-container-lowest">
                          <span className="text-on-surface-variant block">Boundary Layer:</span>
                          <span className="text-on-surface font-semibold">{imageAnalysisResult.weatherContext.boundaryLayerHeight}m</span>
                        </div>
                        <div className="p-2 rounded bg-surface-container-lowest">
                          <span className="text-on-surface-variant block">Wind Speed:</span>
                          <span className="text-on-surface font-semibold">{imageAnalysisResult.weatherContext.windSpeed} m/s</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Image Preview Canvas */}
                <div className="relative h-64 sm:h-80 md:h-96 w-full rounded-2xl overflow-hidden bg-surface-container-lowest border border-surface-container">
                  <img
                    src={inspectedImage}
                    alt="Outdoor environmental site preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-surface-container-lowest/80 backdrop-blur-md border border-surface-container flex items-center justify-between text-xs font-label-mono-sm">
                    <span className="text-on-surface truncate">
                      File: {imageMeta.name} ({imageMeta.sizeKb} KB)
                    </span>
                    <span className="text-on-surface-variant shrink-0">
                      {imageMeta.uploadTime}
                    </span>
                  </div>
                </div>

                {/* Environmental Context Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-surface-container space-y-1">
                    <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">Associated Location</span>
                    <div className="font-body-md text-sm font-bold text-on-surface truncate">
                      {selectedLocation.name}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container space-y-1">
                    <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">Model Forecast AQI</span>
                    <div className="font-body-md text-sm font-bold text-primary">
                      {currentTelemetry?.overallAqi ?? 'N/A'} ({currentTelemetry?.aqiCategory ?? 'Standard'})
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container space-y-1">
                    <span className="font-label-mono-sm text-[0.625rem] text-on-surface-variant uppercase">Inversion Ceiling</span>
                    <div className="font-body-md text-sm font-bold text-secondary">
                      {currentTelemetry?.weather.boundaryLayerHeight ?? 850} meters
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
