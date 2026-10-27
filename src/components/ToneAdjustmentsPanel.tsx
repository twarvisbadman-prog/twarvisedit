import React from 'react';
import { ColorGradeSettings } from '../types/editor';
import { RotateCcw } from 'lucide-react';

interface ToneAdjustmentsPanelProps {
  settings: ColorGradeSettings;
  onChange: (settings: ColorGradeSettings) => void;
}

export const ToneAdjustmentsPanel: React.FC<ToneAdjustmentsPanelProps> = ({
  settings,
  onChange,
}) => {
  const updateSetting = <K extends keyof ColorGradeSettings>(
    key: K,
    val: ColorGradeSettings[K]
  ) => {
    onChange({
      ...settings,
      [key]: val,
    });
  };

  const updateNested = (
    category: 'grain' | 'vignette' | 'bloom',
    field: string,
    val: number
  ) => {
    onChange({
      ...settings,
      [category]: {
        ...(settings[category] as any),
        [field]: val,
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Basic Light & Exposure */}
      <div className="p-3.5 bg-[#13161e] border border-[#232733] rounded-xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white tracking-wide">
            Tone & Light
          </span>
          <button
            onClick={() =>
              onChange({
                ...settings,
                exposure: 0,
                contrast: 0,
                highlights: 0,
                shadows: 0,
                whites: 0,
                blacks: 0,
              })
            }
            className="text-[11px] text-[#71778c] hover:text-white transition-colors"
          >
            Reset Tone
          </button>
        </div>

        {/* Exposure */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#9ea4b9]">Exposure</span>
            <span className="font-mono text-white text-[11px] tabular-nums">
              {settings.exposure > 0
                ? `+${settings.exposure.toFixed(2)} EV`
                : `${settings.exposure.toFixed(2)} EV`}
            </span>
          </div>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.05"
            value={settings.exposure}
            onDoubleClick={() => updateSetting('exposure', 0)}
            onChange={(e) => updateSetting('exposure', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-ew-resize accent-indigo-500"
          />
        </div>

        {/* Contrast */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#9ea4b9]">Contrast</span>
            <span className="font-mono text-white text-[11px] tabular-nums">
              {settings.contrast > 0 ? `+${settings.contrast}` : settings.contrast}
            </span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            step="1"
            value={settings.contrast}
            onDoubleClick={() => updateSetting('contrast', 0)}
            onChange={(e) => updateSetting('contrast', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-ew-resize accent-indigo-500"
          />
        </div>

        {/* Highlights & Shadows 2-column */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#9ea4b9]">Highlights</span>
              <span className="font-mono text-white text-[11px] tabular-nums">
                {settings.highlights > 0 ? `+${settings.highlights}` : settings.highlights}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              value={settings.highlights}
              onDoubleClick={() => updateSetting('highlights', 0)}
              onChange={(e) => updateSetting('highlights', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-ew-resize accent-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#9ea4b9]">Shadows</span>
              <span className="font-mono text-white text-[11px] tabular-nums">
                {settings.shadows > 0 ? `+${settings.shadows}` : settings.shadows}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              value={settings.shadows}
              onDoubleClick={() => updateSetting('shadows', 0)}
              onChange={(e) => updateSetting('shadows', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-ew-resize accent-indigo-500"
            />
          </div>
        </div>

        {/* Whites & Blacks 2-column */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#9ea4b9]">Whites</span>
              <span className="font-mono text-white text-[11px] tabular-nums">
                {settings.whites > 0 ? `+${settings.whites}` : settings.whites}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              value={settings.whites}
              onDoubleClick={() => updateSetting('whites', 0)}
              onChange={(e) => updateSetting('whites', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-ew-resize accent-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#9ea4b9]">Blacks</span>
              <span className="font-mono text-white text-[11px] tabular-nums">
                {settings.blacks > 0 ? `+${settings.blacks}` : settings.blacks}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              value={settings.blacks}
              onDoubleClick={() => updateSetting('blacks', 0)}
              onChange={(e) => updateSetting('blacks', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-ew-resize accent-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 2. White Balance & Saturation */}
      <div className="p-3.5 bg-[#13161e] border border-[#232733] rounded-xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white tracking-wide">
            White Balance & Color
          </span>
          <button
            onClick={() =>
              onChange({
                ...settings,
                temperature: 0,
                tint: 0,
                vibrance: 0,
                saturation: 0,
              })
            }
            className="text-[11px] text-[#71778c] hover:text-white transition-colors"
          >
            Reset WB
          </button>
        </div>

        {/* Temperature */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-blue-400">Cool</span>
            <span className="font-mono text-white text-[11px] tabular-nums">
              {settings.temperature > 0
                ? `+${settings.temperature} Warm`
                : settings.temperature < 0
                ? `${Math.abs(settings.temperature)} Cool`
                : '0'}
            </span>
            <span className="text-amber-400">Warm</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            step="1"
            value={settings.temperature}
            onDoubleClick={() => updateSetting('temperature', 0)}
            onChange={(e) => updateSetting('temperature', parseInt(e.target.value, 10))}
            className="w-full h-2 rounded-lg appearance-none cursor-ew-resize"
            style={{
              background: 'linear-gradient(to right, #38bdf8, #232733 50%, #f59e0b)',
            }}
          />
        </div>

        {/* Tint */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-emerald-400">Green</span>
            <span className="font-mono text-white text-[11px] tabular-nums">
              {settings.tint > 0
                ? `+${settings.tint} Magenta`
                : settings.tint < 0
                ? `${Math.abs(settings.tint)} Green`
                : '0'}
            </span>
            <span className="text-pink-400">Magenta</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            step="1"
            value={settings.tint}
            onDoubleClick={() => updateSetting('tint', 0)}
            onChange={(e) => updateSetting('tint', parseInt(e.target.value, 10))}
            className="w-full h-2 rounded-lg appearance-none cursor-ew-resize"
            style={{
              background: 'linear-gradient(to right, #10b981, #232733 50%, #ec4899)',
            }}
          />
        </div>

        {/* Vibrance & Saturation */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#9ea4b9]">Vibrance</span>
              <span className="font-mono text-white text-[11px] tabular-nums">
                {settings.vibrance > 0 ? `+${settings.vibrance}` : settings.vibrance}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              value={settings.vibrance}
              onDoubleClick={() => updateSetting('vibrance', 0)}
              onChange={(e) => updateSetting('vibrance', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-ew-resize accent-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#9ea4b9]">Saturation</span>
              <span className="font-mono text-white text-[11px] tabular-nums">
                {settings.saturation > 0 ? `+${settings.saturation}` : settings.saturation}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              value={settings.saturation}
              onDoubleClick={() => updateSetting('saturation', 0)}
              onChange={(e) => updateSetting('saturation', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-ew-resize accent-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 3. Presence: Texture, Clarity, Dehaze */}
      <div className="p-3.5 bg-[#13161e] border border-[#232733] rounded-xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white tracking-wide">
            Presence & Texture
          </span>
          <button
            onClick={() =>
              onChange({
                ...settings,
                texture: 0,
                clarity: 0,
                dehaze: 0,
              })
            }
            className="text-[11px] text-[#71778c] hover:text-white transition-colors"
          >
            Reset
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#9ea4b9]">Skin Texture</span>
            <span className="font-mono text-white text-[11px] tabular-nums">
              {settings.texture > 0 ? `+${settings.texture}` : settings.texture}
            </span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            step="1"
            value={settings.texture}
            onDoubleClick={() => updateSetting('texture', 0)}
            onChange={(e) => updateSetting('texture', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-ew-resize accent-indigo-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#9ea4b9]">Clarity</span>
            <span className="font-mono text-white text-[11px] tabular-nums">
              {settings.clarity > 0 ? `+${settings.clarity}` : settings.clarity}
            </span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            step="1"
            value={settings.clarity}
            onDoubleClick={() => updateSetting('clarity', 0)}
            onChange={(e) => updateSetting('clarity', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-ew-resize accent-indigo-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#9ea4b9]">Dehaze</span>
            <span className="font-mono text-white text-[11px] tabular-nums">
              {settings.dehaze > 0 ? `+${settings.dehaze}` : settings.dehaze}
            </span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            step="1"
            value={settings.dehaze}
            onDoubleClick={() => updateSetting('dehaze', 0)}
            onChange={(e) => updateSetting('dehaze', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-ew-resize accent-indigo-500"
          />
        </div>
      </div>

      {/* 4. Film Grain & Vignette Finishing */}
      <div className="p-3.5 bg-[#13161e] border border-[#232733] rounded-xl flex flex-col gap-3">
        <span className="text-xs font-semibold text-white tracking-wide">
          Analog Grain & Vignette
        </span>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#9ea4b9]">Film Grain</span>
            <span className="font-mono text-white text-[11px] tabular-nums">
              {settings.grain.amount}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={settings.grain.amount}
            onDoubleClick={() => updateNested('grain', 'amount', 0)}
            onChange={(e) => updateNested('grain', 'amount', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-ew-resize accent-indigo-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#9ea4b9]">Lens Vignette</span>
            <span className="font-mono text-white text-[11px] tabular-nums">
              {settings.vignette.amount > 0 ? `+${settings.vignette.amount}` : settings.vignette.amount}
            </span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            step="1"
            value={settings.vignette.amount}
            onDoubleClick={() => updateNested('vignette', 'amount', 0)}
            onChange={(e) => updateNested('vignette', 'amount', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-ew-resize accent-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
