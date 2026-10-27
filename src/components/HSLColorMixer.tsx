import React, { useState } from 'react';
import { HSLState, HSLColorName } from '../types/editor';
import { getDefaultHSL } from '../engine/colorEngine';
import { RotateCcw } from 'lucide-react';

interface HSLColorMixerProps {
  hsl: HSLState;
  onChange: (hsl: HSLState) => void;
}

const CHANNELS: { name: HSLColorName; label: string; dotColor: string }[] = [
  { name: 'red', label: 'Reds', dotColor: '#ef4444' },
  { name: 'orange', label: 'Oranges', dotColor: '#f97316' },
  { name: 'yellow', label: 'Yellows', dotColor: '#eab308' },
  { name: 'green', label: 'Greens', dotColor: '#22c55e' },
  { name: 'cyan', label: 'Cyans', dotColor: '#06b6d4' },
  { name: 'blue', label: 'Blues', dotColor: '#3b82f6' },
  { name: 'purple', label: 'Purples', dotColor: '#a855f7' },
  { name: 'magenta', label: 'Magentas', dotColor: '#ec4899' },
];

export const HSLColorMixer: React.FC<HSLColorMixerProps> = ({ hsl, onChange }) => {
  const [selectedChannel, setSelectedChannel] = useState<HSLColorName>('orange');
  const activeAdj = hsl[selectedChannel];

  const updateChannel = (key: 'hue' | 'saturation' | 'luminance', val: number) => {
    onChange({
      ...hsl,
      [selectedChannel]: {
        ...activeAdj,
        [key]: val,
      },
    });
  };

  const resetCurrentChannel = () => {
    onChange({
      ...hsl,
      [selectedChannel]: { hue: 0, saturation: 0, luminance: 0 },
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white tracking-wide">
            HSL Color Mixer
          </span>
          <span className="text-[10px] text-[#71778c]">Secondary Hue Qualifier</span>
        </div>
        <button
          onClick={() => onChange(getDefaultHSL())}
          className="flex items-center gap-1 text-[11px] text-[#71778c] hover:text-white px-2 py-0.5 rounded transition-colors"
          title="Reset All HSL Channels"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset All</span>
        </button>
      </div>

      {/* 8-Channel Tab Row */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 p-1 bg-[#13161e] border border-[#232733] rounded-lg">
        {CHANNELS.map((ch) => {
          const isModified =
            hsl[ch.name].hue !== 0 ||
            hsl[ch.name].saturation !== 0 ||
            hsl[ch.name].luminance !== 0;

          return (
            <button
              key={ch.name}
              onClick={() => setSelectedChannel(ch.name)}
              className={`flex flex-col items-center py-1.5 px-1 rounded-md transition-all relative ${
                selectedChannel === ch.name
                  ? 'bg-[#232838] text-white shadow-sm'
                  : 'text-[#858ca1] hover:text-[#c4cadb]'
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full mb-1 shadow-sm"
                style={{ backgroundColor: ch.dotColor }}
              />
              <span className="text-[10px] font-medium leading-tight truncate w-full text-center">
                {ch.label}
              </span>
              {isModified && (
                <div className="w-1 h-1 rounded-full bg-indigo-400 absolute bottom-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Channel Sliders Card */}
      <div className="p-3 bg-[#13161e] border border-[#232733] rounded-xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor:
                  CHANNELS.find((c) => c.name === selectedChannel)?.dotColor || '#fff',
              }}
            />
            <span className="text-xs font-semibold text-white capitalize">
              {selectedChannel} Channel Fine-Tune
            </span>
          </div>
          <button
            onClick={resetCurrentChannel}
            className="text-[11px] text-[#71778c] hover:text-white transition-colors"
          >
            Reset {selectedChannel}
          </button>
        </div>

        {/* 1. Hue Shift Slider */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#9ea4b9]">Hue Shift</span>
            <span className="font-mono text-white text-[11px] tabular-nums">
              {activeAdj.hue > 0 ? `+${activeAdj.hue}°` : `${activeAdj.hue}°`}
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            step="1"
            value={activeAdj.hue}
            onDoubleClick={() => updateChannel('hue', 0)}
            onChange={(e) => updateChannel('hue', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-ew-resize accent-indigo-500"
          />
        </div>

        {/* 2. Saturation Slider */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#9ea4b9]">Saturation</span>
            <span className="font-mono text-white text-[11px] tabular-nums">
              {activeAdj.saturation > 0
                ? `+${activeAdj.saturation}%`
                : `${activeAdj.saturation}%`}
            </span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            step="1"
            value={activeAdj.saturation}
            onDoubleClick={() => updateChannel('saturation', 0)}
            onChange={(e) => updateChannel('saturation', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-ew-resize accent-indigo-500"
          />
        </div>

        {/* 3. Luminance Slider */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#9ea4b9]">Luminance</span>
            <span className="font-mono text-white text-[11px] tabular-nums">
              {activeAdj.luminance > 0
                ? `+${activeAdj.luminance}%`
                : `${activeAdj.luminance}%`}
            </span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            step="1"
            value={activeAdj.luminance}
            onDoubleClick={() => updateChannel('luminance', 0)}
            onChange={(e) => updateChannel('luminance', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-ew-resize accent-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
