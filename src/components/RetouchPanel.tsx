import React from 'react';
import {
  RetouchToolType,
  BrushSettings,
  RetouchStroke,
} from '../types/editor';
import {
  Sparkles,
  Smile,
  Sun,
  Moon,
  Eye,
  Crosshair,
  Move,
  RotateCcw,
  Trash2,
  Zap,
} from 'lucide-react';

interface RetouchPanelProps {
  activeTool: RetouchToolType;
  setActiveTool: (tool: RetouchToolType) => void;
  brush: BrushSettings;
  setBrush: React.Dispatch<React.SetStateAction<BrushSettings>>;
  strokes: RetouchStroke[];
  onUndoStroke: () => void;
  onClearStrokes: () => void;
}

const TOOLS_CONFIG: {
  id: RetouchToolType;
  title: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  description: string;
  recommended: { size: number; hardness: number; strength: number };
}[] = [
  {
    id: 'heal',
    title: 'Blemish Healer',
    category: 'Correction',
    icon: Sparkles,
    accentColor: 'text-amber-400',
    description: 'Context-aware patch algorithm removes spots, acne, and marks while borrowing surrounding skin texture.',
    recommended: { size: 28, hardness: 20, strength: 90 },
  },
  {
    id: 'skin_smooth',
    title: 'Frequency Separation',
    category: 'Skin Beauty',
    icon: Smile,
    accentColor: 'text-pink-400',
    description: 'Separates tone from texture to even out blotchy complexion while keeping real pores and sharpness 100% intact.',
    recommended: { size: 45, hardness: 15, strength: 55 },
  },
  {
    id: 'dodge',
    title: 'Dodge (Highlight)',
    category: 'Sculpting',
    icon: Sun,
    accentColor: 'text-yellow-400',
    description: 'Gently illuminates cheekbones, cupid’s bow, brow bones, and eye catchlights for three-dimensional pop.',
    recommended: { size: 36, hardness: 10, strength: 30 },
  },
  {
    id: 'burn',
    title: 'Burn (Contour)',
    category: 'Sculpting',
    icon: Moon,
    accentColor: 'text-indigo-400',
    description: 'Deepens jawlines, nose contours, eyelid creases, and hair shadows for rich studio depth.',
    recommended: { size: 40, hardness: 10, strength: 25 },
  },
  {
    id: 'teeth_whiten',
    title: 'Teeth & Sclera Whiten',
    category: 'Correction',
    icon: Sparkles,
    accentColor: 'text-cyan-400',
    description: 'Neutralizes warm yellow staining on teeth and clears the white of the eyes with natural luminosity.',
    recommended: { size: 24, hardness: 25, strength: 60 },
  },
  {
    id: 'eye_enhance',
    title: 'Iris Eye Enhancer',
    category: 'Skin Beauty',
    icon: Eye,
    accentColor: 'text-emerald-400',
    description: 'Accentuates iris coloration, micro-reflections, and iris border ring definition.',
    recommended: { size: 22, hardness: 30, strength: 65 },
  },
  {
    id: 'sharpen',
    title: 'Micro-Detail Sharpener',
    category: 'Detail',
    icon: Zap,
    accentColor: 'text-rose-400',
    description: 'Sharpens eyelashes, eyebrow hairs, lip contours, and jewelry with high-frequency micro-contrast.',
    recommended: { size: 18, hardness: 40, strength: 50 },
  },
  {
    id: 'clone_stamp',
    title: 'Clone Stamp',
    category: 'Correction',
    icon: Crosshair,
    accentColor: 'text-purple-400',
    description: 'Click anywhere to pick sample donor point, then paint over unwanted elements to clone clean texture.',
    recommended: { size: 32, hardness: 30, strength: 80 },
  },
  {
    id: 'navigate',
    title: 'Hand / Pan Tool',
    category: 'Navigation',
    icon: Move,
    accentColor: 'text-[#8b91a5]',
    description: 'Pan and inspect your high-resolution portrait freely across the canvas.',
    recommended: { size: 30, hardness: 0, strength: 0 },
  },
];

export const RetouchPanel: React.FC<RetouchPanelProps> = ({
  activeTool,
  setActiveTool,
  brush,
  setBrush,
  strokes,
  onUndoStroke,
  onClearStrokes,
}) => {
  const currentConfig = TOOLS_CONFIG.find((t) => t.id === activeTool) || TOOLS_CONFIG[0];

  const applyRecommended = (toolId: RetouchToolType) => {
    setActiveTool(toolId);
    const cfg = TOOLS_CONFIG.find((t) => t.id === toolId);
    if (cfg && toolId !== 'navigate') {
      setBrush((prev) => ({
        ...prev,
        ...cfg.recommended,
      }));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header with Stroke Status */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-white tracking-wide block">
            Pro Retouching Suite
          </span>
          <span className="text-[10px] text-[#71778c]">
            Non-Destructive Portrait Tools
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#787f97] font-mono">
            {strokes.length} {strokes.length === 1 ? 'stroke' : 'strokes'}
          </span>
          {strokes.length > 0 && (
            <>
              <button
                onClick={onUndoStroke}
                className="p-1 text-[#8b91a5] hover:text-white rounded transition-colors"
                title="Undo Last Retouch Stroke"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClearStrokes}
                className="p-1 text-[#8b91a5] hover:text-rose-400 rounded transition-colors"
                title="Clear All Retouch Strokes"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tool Selector Grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {TOOLS_CONFIG.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => applyRecommended(tool.id)}
              className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all border ${
                isActive
                  ? 'bg-[#1e2333] border-indigo-500/50 text-white shadow-sm'
                  : 'bg-[#13161e] border-[#222634] text-[#8b91a5] hover:bg-[#181c26] hover:text-white'
              }`}
            >
              <div
                className={`p-1.5 rounded-md ${
                  isActive ? 'bg-indigo-600/30' : 'bg-[#1b1e2a]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${tool.accentColor}`} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-medium block truncate">
                  {tool.title}
                </span>
                <span className="text-[10px] text-[#6b7285] block truncate">
                  {tool.category}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Tool Description Callout */}
      <div className="p-2.5 bg-[#10131a] border border-[#202534] rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <currentConfig.icon className={`w-3.5 h-3.5 ${currentConfig.accentColor}`} />
          <span className="text-xs font-semibold text-white">
            {currentConfig.title}
          </span>
        </div>
        <p className="text-[11px] text-[#80869a] leading-relaxed">
          {currentConfig.description}
        </p>
      </div>

      {/* Brush Settings (Hidden if navigate tool) */}
      {activeTool !== 'navigate' && (
        <div className="p-3 bg-[#13161e] border border-[#232733] rounded-xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Brush Dynamics</span>
            <div className="flex items-center gap-2">
              {/* Visual Brush Preview Circle */}
              <div className="w-6 h-6 rounded-full border border-[#31374a] flex items-center justify-center bg-[#0d0f15]">
                <div
                  className="rounded-full bg-indigo-400"
                  style={{
                    width: `${Math.max(3, Math.min(20, brush.size / 6))}px`,
                    height: `${Math.max(3, Math.min(20, brush.size / 6))}px`,
                    opacity: brush.strength / 100,
                  }}
                />
              </div>
              <span className="text-[10px] text-[#646b82] font-mono">
                [ / ] resize
              </span>
            </div>
          </div>

          {/* Size */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#9ea4b9]">Brush Size</span>
              <span className="font-mono text-white text-[11px] tabular-nums">
                {brush.size}px
              </span>
            </div>
            <input
              type="range"
              min="4"
              max="200"
              step="1"
              value={brush.size}
              onChange={(e) =>
                setBrush((prev) => ({ ...prev, size: parseInt(e.target.value, 10) }))
              }
              className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-ew-resize accent-indigo-500"
            />
          </div>

          {/* Strength / Opacity */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#9ea4b9]">Strength</span>
              <span className="font-mono text-white text-[11px] tabular-nums">
                {brush.strength}%
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={brush.strength}
              onChange={(e) =>
                setBrush((prev) => ({ ...prev, strength: parseInt(e.target.value, 10) }))
              }
              className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-ew-resize accent-indigo-500"
            />
          </div>

          {/* Hardness / Feather */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#9ea4b9]">Hardness (Feather)</span>
              <span className="font-mono text-white text-[11px] tabular-nums">
                {brush.hardness}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={brush.hardness}
              onChange={(e) =>
                setBrush((prev) => ({ ...prev, hardness: parseInt(e.target.value, 10) }))
              }
              className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-ew-resize accent-indigo-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
