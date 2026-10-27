import React from 'react';
import {
  Undo2,
  Redo2,
  Download,
  Sparkles,
  Sliders,
  Paintbrush,
  LineChart,
  Grid3X3,
  Image as ImageIcon,
  Columns,
  Eye,
  RotateCcw,
} from 'lucide-react';

interface TopBarProps {
  activeTab: 'grade' | 'retouch' | 'curves' | 'presets';
  setActiveTab: (tab: 'grade' | 'retouch' | 'curves' | 'presets') => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetAll: () => void;
  splitMode: 'off' | 'wipe' | 'side-by-side';
  setSplitMode: (mode: 'off' | 'wipe' | 'side-by-side') => void;
  isComparing: boolean;
  setIsComparing: (comparing: boolean) => void;
  onOpenExport: () => void;
  onOpenAI: () => void;
  onOpenSampleModal: () => void;
  showScopes: boolean;
  setShowScopes: (show: boolean) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResetAll,
  splitMode,
  setSplitMode,
  isComparing,
  setIsComparing,
  onOpenExport,
  onOpenAI,
  onOpenSampleModal,
  showScopes,
  setShowScopes,
}) => {
  return (
    <header className="h-14 bg-[#101217] border-b border-[#202430] flex items-center justify-between gap-8 px-5 select-none shrink-0 z-30">
      {/* Zone 1: Single text element Brand Zone */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
          AuraGrade Studio
        </span>
        <span className="text-xs text-[#80869a] font-mono whitespace-nowrap">
          Pro Retouch & Color Suite
        </span>
      </div>

      {/* Zone 2: Clean single-line text navigation links */}
      <nav className="flex items-center gap-1 bg-[#171a22] p-1 rounded-lg border border-[#232733]">
        <button
          onClick={() => setActiveTab('grade')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'grade'
              ? 'bg-[#262b3a] text-white shadow-sm'
              : 'text-[#8b91a5] hover:text-[#c4cadb]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          Color & Tone
        </button>

        <button
          onClick={() => setActiveTab('retouch')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'retouch'
              ? 'bg-[#262b3a] text-white shadow-sm'
              : 'text-[#8b91a5] hover:text-[#c4cadb]'
          }`}
        >
          <Paintbrush className="w-3.5 h-3.5 text-pink-400" />
          Pro Retouch
        </button>

        <button
          onClick={() => setActiveTab('curves')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'curves'
              ? 'bg-[#262b3a] text-white shadow-sm'
              : 'text-[#8b91a5] hover:text-[#c4cadb]'
          }`}
        >
          <LineChart className="w-3.5 h-3.5 text-emerald-400" />
          Curves & HSL
        </button>

        <button
          onClick={() => setActiveTab('presets')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'presets'
              ? 'bg-[#262b3a] text-white shadow-sm'
              : 'text-[#8b91a5] hover:text-[#c4cadb]'
          }`}
        >
          <Grid3X3 className="w-3.5 h-3.5 text-amber-400" />
          Cinematic LUTs
        </button>
      </nav>

      {/* Zone 3: Primary action & tool controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Sample photos picker */}
        <button
          onClick={onOpenSampleModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#c4cadb] bg-[#1a1d26] hover:bg-[#232733] border border-[#2b3040] rounded-md transition-colors whitespace-nowrap shrink-0"
          title="Switch photo or upload custom"
        >
          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span>Photos</span>
        </button>

        {/* Comparison toggle */}
        <div className="flex items-center bg-[#171a22] border border-[#232733] rounded-md p-0.5">
          <button
            onMouseDown={() => setIsComparing(true)}
            onMouseUp={() => setIsComparing(false)}
            onMouseLeave={() => setIsComparing(false)}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              isComparing
                ? 'bg-amber-500/20 text-amber-300'
                : 'text-[#8b91a5] hover:text-white'
            }`}
            title="Hold to see original unedited photo"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hold Original</span>
          </button>

          <button
            onClick={() =>
              setSplitMode(
                splitMode === 'off' ? 'wipe' : splitMode === 'wipe' ? 'side-by-side' : 'off'
              )
            }
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              splitMode !== 'off'
                ? 'bg-indigo-600/30 text-indigo-300'
                : 'text-[#8b91a5] hover:text-white'
            }`}
            title="Split screen before / after comparison"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {splitMode === 'wipe' ? 'Wipe' : splitMode === 'side-by-side' ? 'Dual' : 'Split'}
            </span>
          </button>
        </div>

        {/* Real-time scopes toggle */}
        <button
          onClick={() => setShowScopes(!showScopes)}
          className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
            showScopes
              ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
              : 'bg-[#1a1d26] text-[#8b91a5] hover:text-white border-[#2b3040]'
          }`}
          title="Toggle Waveform, Vectorscope & Histogram"
        >
          Scopes
        </button>

        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 text-[#8b91a5] hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 text-[#8b91a5] hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onResetAll}
            className="p-1.5 text-[#8b91a5] hover:text-amber-400 rounded transition-colors"
            title="Reset All Adjustments"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* AI Assistant */}
        <button
          onClick={onOpenAI}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-md transition-colors whitespace-nowrap shrink-0"
          title="AI Neural Color Grading & Retouch Assistant"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>AI Grade</span>
        </button>

        {/* Primary Action Button: Export */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors shadow-sm whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
