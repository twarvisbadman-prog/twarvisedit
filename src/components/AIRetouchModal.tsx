import React, { useState } from 'react';
import { AIRetouchSettings } from '../engine/aiRetouchEngine';
import {
  Sparkles,
  Smile,
  X,
  Check,
  RotateCcw,
  Eye,
  Sliders,
  Wand2,
} from 'lucide-react';

interface AIRetouchModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiSettings: AIRetouchSettings;
  setAiSettings: React.Dispatch<React.SetStateAction<AIRetouchSettings>>;
  onApply: () => void;
  onReset: () => void;
  hasApplied: boolean;
}

const PRESET_STYLES = [
  {
    name: 'Subtle Natural',
    desc: 'Gentle pore-preserving touch for everyday portraits',
    values: {
      skinSmoothing: 40,
      blemishRemoval: 55,
      teethWhitening: 45,
      eyeSparkle: 35,
      toneBalancing: 25,
    },
  },
  {
    name: 'Editorial Beauty',
    desc: 'High-fashion runway look with radiant skin & crisp eyes',
    values: {
      skinSmoothing: 75,
      blemishRemoval: 85,
      teethWhitening: 70,
      eyeSparkle: 65,
      toneBalancing: 50,
    },
  },
  {
    name: 'Studio Commercial',
    desc: 'Balanced corporate & commercial headshot finish',
    values: {
      skinSmoothing: 60,
      blemishRemoval: 70,
      teethWhitening: 60,
      eyeSparkle: 50,
      toneBalancing: 35,
    },
  },
];

export const AIRetouchModal: React.FC<AIRetouchModalProps> = ({
  isOpen,
  onClose,
  aiSettings,
  setAiSettings,
  onApply,
  onReset,
  hasApplied,
}) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'presets'>('controls');

  if (!isOpen) return null;

  const updateSetting = (key: keyof AIRetouchSettings, val: number) => {
    setAiSettings((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#12151d] border border-[#232733] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202430]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-pink-500/20 border border-indigo-500/30 rounded-xl">
              <Wand2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                AI Neural Retouching Suite
              </h3>
              <p className="text-xs text-[#71778c]">
                Automatic skin smoothing, blemish removal & teeth whitening
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8b91a5] hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Style Preset Selector Row */}
        <div className="px-6 pt-4 flex gap-2">
          {PRESET_STYLES.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setAiSettings(preset.values)}
              className="flex-1 p-2.5 bg-[#171a24] hover:bg-[#1e2330] border border-[#252936] rounded-xl text-left transition-all"
            >
              <span className="text-xs font-semibold text-white block">
                {preset.name}
              </span>
              <span className="text-[10px] text-[#71778c] block line-clamp-1 mt-0.5">
                {preset.desc}
              </span>
            </button>
          ))}
        </div>

        {/* Sliders Container */}
        <div className="p-6 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          {/* 1. Automatic Skin Smoothing */}
          <div className="p-3.5 bg-[#171a24] border border-[#232733] rounded-xl">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4 text-pink-400" />
                <span className="text-xs font-semibold text-white">
                  Automatic Skin Smoothing
                </span>
              </div>
              <span className="text-xs font-mono text-indigo-400 font-semibold tabular-nums">
                {aiSettings.skinSmoothing}%
              </span>
            </div>
            <p className="text-[11px] text-[#71778c] mb-2.5">
              Frequency separation algorithm softens blotchy complexion while retaining 100% authentic skin pores.
            </p>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={aiSettings.skinSmoothing}
              onChange={(e) => updateSetting('skinSmoothing', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#252a38] rounded-lg appearance-none cursor-ew-resize accent-indigo-500"
            />
          </div>

          {/* 2. Intelligent Blemish Detection & Removal */}
          <div className="p-3.5 bg-[#171a24] border border-[#232733] rounded-xl">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-white">
                  Intelligent Blemish Detection & Removal
                </span>
              </div>
              <span className="text-xs font-mono text-amber-400 font-semibold tabular-nums">
                {aiSettings.blemishRemoval}%
              </span>
            </div>
            <p className="text-[11px] text-[#71778c] mb-2.5">
              Computer vision scans skin region for acne, redness spots, and dark blemishes, seamlessly inpainting donor texture.
            </p>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={aiSettings.blemishRemoval}
              onChange={(e) => updateSetting('blemishRemoval', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#252a38] rounded-lg appearance-none cursor-ew-resize accent-amber-500"
            />
          </div>

          {/* 3. Automatic Teeth Whitening */}
          <div className="p-3.5 bg-[#171a24] border border-[#232733] rounded-xl">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-white">
                  Automatic Teeth Whitening
                </span>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-semibold tabular-nums">
                {aiSettings.teethWhitening}%
              </span>
            </div>
            <p className="text-[11px] text-[#71778c] mb-2.5">
              Detects dental smile area, eliminates warm yellow discolorations, and lifts enamel brightness naturally.
            </p>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={aiSettings.teethWhitening}
              onChange={(e) => updateSetting('teethWhitening', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#252a38] rounded-lg appearance-none cursor-ew-resize accent-cyan-500"
            />
          </div>

          {/* 4. Eye Sparkle & Sclera Clearing */}
          <div className="p-3.5 bg-[#171a24] border border-[#232733] rounded-xl">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white">
                  Iris Sparkle & Sclera Clarity
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold tabular-nums">
                {aiSettings.eyeSparkle}%
              </span>
            </div>
            <p className="text-[11px] text-[#71778c] mb-2.5">
              Accentuates iris saturation, catchlight reflections, and clears white eye sclera.
            </p>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={aiSettings.eyeSparkle}
              onChange={(e) => updateSetting('eyeSparkle', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#252a38] rounded-lg appearance-none cursor-ew-resize accent-emerald-500"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#0e1017] border-t border-[#202430] flex items-center justify-between">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-medium text-[#71778c] hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset AI Retouch</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#8b91a5] hover:text-white bg-[#1a1d26] hover:bg-[#232733] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onApply();
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply AI Retouch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
