import React from 'react';
import { ColorGradeSettings, ColorGradePreset } from '../types/editor';
import { COLOR_PRESETS } from '../engine/presets';
import { Check, SlidersHorizontal, Sparkles } from 'lucide-react';

interface PresetsPanelProps {
  settings: ColorGradeSettings;
  onApplyPreset: (preset: ColorGradePreset) => void;
  presetBlend: number;
  onBlendChange: (blend: number) => void;
}

export const PresetsPanel: React.FC<PresetsPanelProps> = ({
  settings,
  onApplyPreset,
  presetBlend,
  onBlendChange,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Header with Blend Strength */}
      <div className="p-3.5 bg-[#13161e] border border-[#232733] rounded-xl flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-white">LUT Blend Strength</span>
          </div>
          <span className="font-mono text-xs text-indigo-400 font-semibold tabular-nums">
            {presetBlend}%
          </span>
        </div>
        <p className="text-[11px] text-[#71778c]">
          Mix the active cinematic color science with your original image.
        </p>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={presetBlend}
          onChange={(e) => onBlendChange(parseInt(e.target.value, 10))}
          className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-ew-resize accent-indigo-500"
        />
      </div>

      {/* Preset Cards List */}
      <div className="flex flex-col gap-2">
        {COLOR_PRESETS.map((preset) => {
          const isActive = settings.activePresetId === preset.id;

          return (
            <button
              key={preset.id}
              onClick={() => onApplyPreset(preset)}
              className={`p-3 rounded-xl text-left border transition-all flex flex-col gap-1 relative ${
                isActive
                  ? 'bg-[#1c2130] border-indigo-500/60 shadow-md'
                  : 'bg-[#13161e] border-[#232733] hover:bg-[#181c26] hover:border-[#2d3345]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white tracking-wide">
                  {preset.name}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#80869a] font-medium">
                    {preset.category}
                  </span>
                  {isActive && (
                    <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-[#787f97] leading-relaxed">
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
