import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ColorGradeSettings,
  RetouchToolType,
  BrushSettings,
  RetouchStroke,
  LoupeData,
  ColorGradePreset,
} from './types/editor';
import {
  getDefaultColorSettings,
  getDefaultCurves,
  getDefaultHSL,
  getDefaultColorBalance,
} from './engine/colorEngine';
import {
  AIRetouchSettings,
  defaultAIRetouchSettings,
} from './engine/aiRetouchEngine';
import { TopBar } from './components/TopBar';
import { CanvasViewport } from './components/CanvasViewport';
import { ColorWheels } from './components/ColorWheels';
import { ColorBalancePanel } from './components/ColorBalancePanel';
import { CurvesEditor } from './components/CurvesEditor';
import { HSLColorMixer } from './components/HSLColorMixer';
import { ToneAdjustmentsPanel } from './components/ToneAdjustmentsPanel';
import { RetouchPanel } from './components/RetouchPanel';
import { PresetsPanel } from './components/PresetsPanel';
import { ScopesPanel } from './components/ScopesPanel';
import { AIRetouchModal } from './components/AIRetouchModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { ExportModal } from './components/ExportModal';
import { SamplePhotosModal, SAMPLE_PHOTOS } from './components/SamplePhotosModal';
import {
  Wand2,
  Sliders,
  Scale,
  Sun,
  Activity,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<'grade' | 'retouch' | 'curves' | 'presets'>('grade');
  const [gradeSubTab, setGradeSubTab] = useState<'wheels' | 'balance' | 'tone'>('wheels');
  const [curvesSubTab, setCurvesSubTab] = useState<'curves' | 'hsl'>('curves');

  // Active Photo URL & Base Image
  const [activePhotoUrl, setActivePhotoUrl] = useState<string>(SAMPLE_PHOTOS[0].url);
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);

  // Core Color Grade Settings
  const [settings, setSettings] = useState<ColorGradeSettings>(getDefaultColorSettings());

  // History stack for Color Grade (Undo / Redo)
  const [history, setHistory] = useState<ColorGradeSettings[]>([getDefaultColorSettings()]);
  const [historyIdx, setHistoryIdx] = useState(0);

  // Retouching Studio State
  const [activeTool, setActiveTool] = useState<RetouchToolType>('heal');
  const [brush, setBrush] = useState<BrushSettings>({
    size: 32,
    hardness: 20,
    strength: 75,
    flow: 100,
  });
  const [retouchStrokes, setRetouchStrokes] = useState<RetouchStroke[]>([]);

  // AI-Powered Retouching State
  const [aiRetouchSettings, setAiRetouchSettings] = useState<AIRetouchSettings>(defaultAIRetouchSettings);
  const [aiRetouchEnabled, setAiRetouchEnabled] = useState(false);
  const [isAIRetouchModalOpen, setIsAIRetouchModalOpen] = useState(false);

  // Comparison & Scopes
  const [splitMode, setSplitMode] = useState<'off' | 'wipe' | 'side-by-side'>('off');
  const [isComparing, setIsComparing] = useState(false);
  const [showScopes, setShowScopes] = useState(true);
  const [loupeData, setLoupeData] = useState<LoupeData | null>(null);
  const [renderedImageData, setRenderedImageData] = useState<ImageData | null>(null);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAIGradeOpen, setIsAIGradeOpen] = useState(false);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);

  // Load image when activePhotoUrl changes
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setBaseImage(img);
    };
    img.src = activePhotoUrl;
  }, [activePhotoUrl]);

  // Spacebar hold to compare original
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space' && !e.repeat && activeTool !== 'navigate') {
        e.preventDefault();
        setIsComparing(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsComparing(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeTool]);

  // Push new color settings with debounced history
  const handleSettingsChange = useCallback(
    (newSettings: ColorGradeSettings) => {
      setSettings(newSettings);
      // Append to history stack if distinct
      setHistory((prev) => {
        const next = prev.slice(0, historyIdx + 1);
        next.push(newSettings);
        if (next.length > 30) next.shift();
        return next;
      });
      setHistoryIdx((prev) => Math.min(prev + 1, 29));
    },
    [historyIdx]
  );

  // Undo / Redo
  const handleUndo = () => {
    if (historyIdx > 0) {
      const prevIdx = historyIdx - 1;
      setHistoryIdx(prevIdx);
      setSettings(history[prevIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const nextIdx = historyIdx + 1;
      setHistoryIdx(nextIdx);
      setSettings(history[nextIdx]);
    }
  };

  const handleResetAll = () => {
    const def = getDefaultColorSettings();
    setSettings(def);
    setRetouchStrokes([]);
    setAiRetouchEnabled(false);
    setHistory([def]);
    setHistoryIdx(0);
  };

  // Add Retouch Stroke
  const handleAddStroke = (stroke: RetouchStroke) => {
    setRetouchStrokes((prev) => [...prev, stroke]);
  };

  const handleUndoStroke = () => {
    setRetouchStrokes((prev) => prev.slice(0, -1));
  };

  const handleClearStrokes = () => {
    setRetouchStrokes([]);
  };

  // Apply Cinematic Preset
  const handleApplyPreset = (preset: ColorGradePreset) => {
    const base = getDefaultColorSettings();
    const merged: ColorGradeSettings = {
      ...base,
      ...preset.settings,
      colorWheels: {
        ...base.colorWheels,
        ...(preset.settings.colorWheels || {}),
      },
      curves: {
        ...base.curves,
        ...(preset.settings.curves || {}),
      },
      hsl: {
        ...base.hsl,
        ...(preset.settings.hsl || {}),
      },
      grain: {
        ...base.grain,
        ...(preset.settings.grain || {}),
      },
      vignette: {
        ...base.vignette,
        ...(preset.settings.vignette || {}),
      },
      activePresetId: preset.id,
      presetBlend: 100,
    };
    handleSettingsChange(merged);
  };

  // Upload Custom Photo
  const handleUploadPhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setActivePhotoUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Apply AI Grade payload from Gemini API
  const handleApplyAIGrade = (gradeData: any) => {
    const base = getDefaultColorSettings();
    const newSettings: ColorGradeSettings = {
      ...base,
      exposure: gradeData.exposure ?? base.exposure,
      contrast: gradeData.contrast ?? base.contrast,
      highlights: gradeData.highlights ?? base.highlights,
      shadows: gradeData.shadows ?? base.shadows,
      whites: gradeData.whites ?? base.whites,
      blacks: gradeData.blacks ?? base.blacks,
      temperature: gradeData.temperature ?? base.temperature,
      tint: gradeData.tint ?? base.tint,
      vibrance: gradeData.vibrance ?? base.vibrance,
      saturation: gradeData.saturation ?? base.saturation,
      clarity: gradeData.clarity ?? base.clarity,
      texture: gradeData.texture ?? base.texture,
      dehaze: gradeData.dehaze ?? base.dehaze,
      colorWheels: {
        lift: gradeData.colorWheels?.lift ?? base.colorWheels.lift,
        gamma: gradeData.colorWheels?.gamma ?? base.colorWheels.gamma,
        gain: gradeData.colorWheels?.gain ?? base.colorWheels.gain,
        offset: base.colorWheels.offset,
      },
      curves: {
        ...base.curves,
        master: gradeData.curves?.master ?? base.curves.master,
      },
      grain: {
        amount: gradeData.grain?.amount ?? base.grain.amount,
        size: gradeData.grain?.size ?? base.grain.size,
        roughness: 50,
      },
      vignette: {
        amount: gradeData.vignette?.amount ?? base.vignette.amount,
        midpoint: 50,
        feather: 50,
      },
      activePresetId: 'ai-smart-grade',
      presetBlend: 100,
    };
    handleSettingsChange(newSettings);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0b0c10] text-[#e0e2ec] overflow-hidden select-none">
      {/* Top Navigation Bar */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        canUndo={historyIdx > 0}
        canRedo={historyIdx < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onResetAll={handleResetAll}
        splitMode={splitMode}
        setSplitMode={setSplitMode}
        isComparing={isComparing}
        setIsComparing={setIsComparing}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenAI={() => setIsAIGradeOpen(true)}
        onOpenSampleModal={() => setIsSampleModalOpen(true)}
        showScopes={showScopes}
        setShowScopes={setShowScopes}
      />

      {/* Main Studio Body: Viewport + Precision Inspector Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Central Viewport */}
        <main className="flex-1 h-full relative overflow-hidden bg-[#090a0d]">
          <CanvasViewport
            baseImage={baseImage}
            settings={settings}
            activeTool={activeTool}
            brush={brush}
            setBrush={setBrush}
            retouchStrokes={retouchStrokes}
            onAddStroke={handleAddStroke}
            splitMode={splitMode}
            setSplitMode={setSplitMode}
            isComparing={isComparing}
            onLoupeChange={setLoupeData}
            onImageRendered={setRenderedImageData}
            aiRetouchSettings={aiRetouchSettings}
            aiRetouchEnabled={aiRetouchEnabled}
          />
        </main>

        {/* Right Precision Inspector & Control Palette */}
        <aside className="w-80 md:w-96 h-full bg-[#101217] border-l border-[#202430] flex flex-col shrink-0 z-20 shadow-2xl">
          {/* Sub-navigation tabs based on active primary tab */}
          {activeTab === 'grade' && (
            <div className="flex items-center bg-[#151821] p-1 mx-3 mt-3 rounded-lg border border-[#232733] shrink-0">
              <button
                onClick={() => setGradeSubTab('wheels')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                  gradeSubTab === 'wheels'
                    ? 'bg-[#252a3a] text-white shadow-sm'
                    : 'text-[#8b91a5] hover:text-[#c4cadb]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Color Wheels
              </button>

              <button
                onClick={() => setGradeSubTab('balance')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                  gradeSubTab === 'balance'
                    ? 'bg-[#252a3a] text-white shadow-sm'
                    : 'text-[#8b91a5] hover:text-[#c4cadb]'
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                Color Balance
              </button>

              <button
                onClick={() => setGradeSubTab('tone')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                  gradeSubTab === 'tone'
                    ? 'bg-[#252a3a] text-white shadow-sm'
                    : 'text-[#8b91a5] hover:text-[#c4cadb]'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                Tone & Light
              </button>
            </div>
          )}

          {activeTab === 'curves' && (
            <div className="flex items-center bg-[#151821] p-1 mx-3 mt-3 rounded-lg border border-[#232733] shrink-0">
              <button
                onClick={() => setCurvesSubTab('curves')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  curvesSubTab === 'curves'
                    ? 'bg-[#252a3a] text-white shadow-sm'
                    : 'text-[#8b91a5] hover:text-[#c4cadb]'
                }`}
              >
                Tone Curves (Spline)
              </button>

              <button
                onClick={() => setCurvesSubTab('hsl')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  curvesSubTab === 'hsl'
                    ? 'bg-[#252a3a] text-white shadow-sm'
                    : 'text-[#8b91a5] hover:text-[#c4cadb]'
                }`}
              >
                HSL Color Mixer (8 Bands)
              </button>
            </div>
          )}

          {/* AI Retouch Quick Launcher Banner in Retouch Tab */}
          {activeTab === 'retouch' && (
            <div className="p-3 mx-3 mt-3 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-pink-950/40 border border-indigo-500/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                  <Wand2 className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">
                    AI Auto Retouch
                  </span>
                  <span className="text-[10px] text-[#8b91a5] block">
                    {aiRetouchEnabled ? 'Active (Click to tweak)' : 'Skin smoothing & blemish removal'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsAIRetouchModalOpen(true)}
                className="px-2.5 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
              >
                {aiRetouchEnabled ? 'Adjust' : 'Open AI'}
              </button>
            </div>
          )}

          {/* Scrollable Tool Panel Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Tab: Grade & Tone */}
            {activeTab === 'grade' && (
              <>
                {gradeSubTab === 'wheels' && (
                  <ColorWheels
                    colorWheels={settings.colorWheels}
                    onChange={(colorWheels) =>
                      handleSettingsChange({ ...settings, colorWheels })
                    }
                  />
                )}

                {gradeSubTab === 'balance' && (
                  <ColorBalancePanel
                    colorBalance={settings.colorBalance}
                    onChange={(colorBalance) =>
                      handleSettingsChange({ ...settings, colorBalance })
                    }
                  />
                )}

                {gradeSubTab === 'tone' && (
                  <ToneAdjustmentsPanel
                    settings={settings}
                    onChange={handleSettingsChange}
                  />
                )}
              </>
            )}

            {/* Tab: Pro Retouch Studio */}
            {activeTab === 'retouch' && (
              <RetouchPanel
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                brush={brush}
                setBrush={setBrush}
                strokes={retouchStrokes}
                onUndoStroke={handleUndoStroke}
                onClearStrokes={handleClearStrokes}
              />
            )}

            {/* Tab: Curves & HSL */}
            {activeTab === 'curves' && (
              <>
                {curvesSubTab === 'curves' ? (
                  <CurvesEditor
                    curves={settings.curves}
                    onChange={(curves) => handleSettingsChange({ ...settings, curves })}
                    histogram={null}
                  />
                ) : (
                  <HSLColorMixer
                    hsl={settings.hsl}
                    onChange={(hsl) => handleSettingsChange({ ...settings, hsl })}
                  />
                )}
              </>
            )}

            {/* Tab: Cinematic Presets */}
            {activeTab === 'presets' && (
              <PresetsPanel
                settings={settings}
                onApplyPreset={handleApplyPreset}
                presetBlend={settings.presetBlend}
                onBlendChange={(presetBlend) =>
                  handleSettingsChange({ ...settings, presetBlend })
                }
              />
            )}
          </div>

          {/* Bottom Dock: Live Real-time Analysis Scopes */}
          {showScopes && (
            <div className="border-t border-[#202430] p-3 bg-[#0d0f14] shrink-0">
              <ScopesPanel
                imageData={renderedImageData}
                loupeData={loupeData}
              />
            </div>
          )}
        </aside>
      </div>

      {/* AI Retouching Modal */}
      <AIRetouchModal
        isOpen={isAIRetouchModalOpen}
        onClose={() => setIsAIRetouchModalOpen(false)}
        aiSettings={aiRetouchSettings}
        setAiSettings={setAiRetouchSettings}
        onApply={() => setAiRetouchEnabled(true)}
        onReset={() => {
          setAiRetouchSettings(defaultAIRetouchSettings);
          setAiRetouchEnabled(false);
        }}
        hasApplied={aiRetouchEnabled}
      />

      {/* AI Color Grading Prompt Modal */}
      <AIAssistantModal
        isOpen={isAIGradeOpen}
        onClose={() => setIsAIGradeOpen(false)}
        onApplyAIGrade={handleApplyAIGrade}
      />

      {/* Export Modal (JPEG, PNG, WebP, .CUBE LUT) */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        canvas={document.querySelector('canvas')}
        settings={settings}
      />

      {/* Sample Photos & Upload Modal */}
      <SamplePhotosModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        activePhotoUrl={activePhotoUrl}
        onSelectPhoto={setActivePhotoUrl}
        onUploadPhoto={handleUploadPhoto}
      />
    </div>
  );
}
