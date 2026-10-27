import React, { useState } from 'react';
import { ColorBalanceState, ColorBalanceChannel } from '../types/editor';
import { getDefaultColorBalance } from '../engine/colorEngine';
import { RotateCcw } from 'lucide-react';

interface ColorBalancePanelProps {
  colorBalance: ColorBalanceState;
  onChange: (cb: ColorBalanceState) => void;
}

type BalanceTone = 'shadows' | 'midtones' | 'highlights';

export const ColorBalancePanel: React.FC<ColorBalancePanelProps> = ({
  colorBalance,
  onChange,
}) => {
  const [activeTone, setActiveTone] = useState<BalanceTone>('midtones');
  const currentChannel = colorBalance[activeTone];

  const updateChannel = (key: keyof ColorBalanceChannel, value: number) => {
    onChange({
      ...colorBalance,
      [activeTone]: {
        ...currentChannel,
        [key]: value,
      },
    });
  };

  const resetCurrentTone = () => {
    onChange({
      ...colorBalance,
      [activeTone]: { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
    });
  };

  const isShadowsModified =
    colorBalance.shadows.cyanRed !== 0 ||
    colorBalance.shadows.magentaGreen !== 0 ||
    colorBalance.shadows.yellowBlue !== 0;

  const isMidtonesModified =
    colorBalance.midtones.cyanRed !== 0 ||
    colorBalance.midtones.magentaGreen !== 0 ||
    colorBalance.midtones.yellowBlue !== 0;

  const isHighlightsModified =
    colorBalance.highlights.cyanRed !== 0 ||
    colorBalance.highlights.magentaGreen !== 0 ||
    colorBalance.highlights.yellowBlue !== 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-white tracking-wide block">
            Color Balance
          </span>
          <span className="text-[10px] text-[#71778c]">
            Tonal Color Shifting
          </span>
        </div>
        <button
          onClick={() => onChange(getDefaultColorBalance())}
          className="flex items-center gap-1 text-[11px] text-[#71778c] hover:text-white px-2 py-0.5 rounded transition-colors"
          title="Reset Color Balance"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Tone Range Tabs (Shadows, Midtones, Highlights) */}
      <div className="flex items-center bg-[#13161e] p-1 rounded-lg border border-[#232733] gap-1">
        <button
          onClick={() => setActiveTone('shadows')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all relative ${
            activeTone === 'shadows'
              ? 'bg-[#252a3a] text-white shadow-sm'
              : 'text-[#8b91a5] hover:text-[#c4cadb]'
          }`}
        >
          Shadows
          {isShadowsModified && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block ml-1" />
          )}
        </button>

        <button
          onClick={() => setActiveTone('midtones')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all relative ${
            activeTone === 'midtones'
              ? 'bg-[#252a3a] text-white shadow-sm'
              : 'text-[#8b91a5] hover:text-[#c4cadb]'
          }`}
        >
          Midtones
          {isMidtonesModified && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block ml-1" />
          )}
        </button>

        <button
          onClick={() => setActiveTone('highlights')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all relative ${
            activeTone === 'highlights'
              ? 'bg-[#252a3a] text-white shadow-sm'
              : 'text-[#8b91a5] hover:text-[#c4cadb]'
          }`}
        >
          Highlights
          {isHighlightsModified && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block ml-1" />
          )}
        </button>
      </div>

      {/* Active Range Sliders Card */}
      <div className="p-3.5 bg-[#13161e] border border-[#232733] rounded-xl flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white capitalize">
            {activeTone} Color Shifts
          </span>
          <button
            onClick={resetCurrentTone}
            className="text-[11px] text-[#71778c] hover:text-white transition-colors"
          >
            Reset {activeTone}
          </button>
        </div>

        {/* 1. Cyan - Red Slider */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-cyan-400 font-medium">Cyan</span>
            <span className="font-mono text-white text-[11px] tabular-nums">
              {currentChannel.cyanRed > 0
                ? `+${currentChannel.cyanRed} Red`
                : currentChannel.cyanRed < 0
                ? `${Math.abs(currentChannel.cyanRed)} Cyan`
                : '0'}
            </span>
            <span className="text-red-400 font-medium">Red</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            step="1"
            value={currentChannel.cyanRed}
            onDoubleClick={() => updateChannel('cyanRed', 0)}
            onChange={(e) => updateChannel('cyanRed', parseInt(e.target.value, 10))}
            className="w-full h-2 rounded-lg appearance-none cursor-ew-resize"
            style={{
              background: 'linear-gradient(to right, #06b6d4, #262a38 50%, #ef4444)',
            }}
          />
        </div>

        {/* 2. Magenta - Green Slider */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-fuchsia-400 font-medium">Magenta</span>
            <span className="font-mono text-white text-[11px] tabular-nums">
              {currentChannel.magentaGreen > 0
                ? `+${currentChannel.magentaGreen} Green`
                : currentChannel.magentaGreen < 0
                ? `${Math.abs(currentChannel.magentaGreen)} Magenta`
                : '0'}
            </span>
            <span className="text-emerald-400 font-medium">Green</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            step="1"
            value={currentChannel.magentaGreen}
            onDoubleClick={() => updateChannel('magentaGreen', 0)}
            onChange={(e) => updateChannel('magentaGreen', parseInt(e.target.value, 10))}
            className="w-full h-2 rounded-lg appearance-none cursor-ew-resize"
            style={{
              background: 'linear-gradient(to right, #d946ef, #262a38 50%, #22c55e)',
            }}
          />
        </div>

        {/* 3. Yellow - Blue Slider */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-amber-400 font-medium">Yellow</span>
            <span className="font-mono text-white text-[11px] tabular-nums">
              {currentChannel.yellowBlue > 0
                ? `+${currentChannel.yellowBlue} Blue`
                : currentChannel.yellowBlue < 0
                ? `${Math.abs(currentChannel.yellowBlue)} Yellow`
                : '0'}
            </span>
            <span className="text-blue-400 font-medium">Blue</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            step="1"
            value={currentChannel.yellowBlue}
            onDoubleClick={() => updateChannel('yellowBlue', 0)}
            onChange={(e) => updateChannel('yellowBlue', parseInt(e.target.value, 10))}
            className="w-full h-2 rounded-lg appearance-none cursor-ew-resize"
            style={{
              background: 'linear-gradient(to right, #eab308, #262a38 50%, #3b82f6)',
            }}
          />
        </div>

        {/* Preserve Luminosity Toggle */}
        <div className="pt-2 border-t border-[#232733] flex items-center justify-between">
          <span className="text-xs text-[#9ea4b9]">Preserve Luminosity</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={colorBalance.preserveLuminosity}
              onChange={(e) =>
                onChange({ ...colorBalance, preserveLuminosity: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-[#232733] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600" />
          </label>
        </div>
      </div>
    </div>
  );
};
