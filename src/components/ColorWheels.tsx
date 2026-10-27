import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ColorWheelVal } from '../types/editor';
import { RotateCcw } from 'lucide-react';

interface SingleWheelProps {
  label: string;
  sublabel: string;
  value: ColorWheelVal;
  onChange: (val: ColorWheelVal) => void;
  onReset: () => void;
}

const SingleWheel: React.FC<SingleWheelProps> = ({
  label,
  sublabel,
  value,
  onChange,
  onReset,
}) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Wheel dimensions
  const size = 130;
  const radius = size / 2;

  // Convert angle & saturation to local (x, y) coordinates relative to center
  const rad = (value.angle * Math.PI) / 180;
  const puckX = radius + Math.cos(rad) * (value.saturation * (radius - 8));
  const puckY = radius + Math.sin(rad) * (value.saturation * (radius - 8));

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateFromPointer(e.clientX, e.clientY);
  };

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!wheelRef.current) return;
      const rect = wheelRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.hypot(dx, dy);

      // Max radius constraint
      const maxR = radius - 8;
      const clampedDist = Math.min(dist, maxR);
      const sat = Math.max(0, Math.min(1, clampedDist / maxR));

      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (angle < 0) angle += 360;

      onChange({
        ...value,
        angle: Math.round(angle),
        saturation: Number(sat.toFixed(3)),
      });
    },
    [onChange, radius, value]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      updateFromPointer(e.clientX, e.clientY);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, updateFromPointer]);

  // Compute CSS tint color for indicator
  const radAngle = (value.angle * Math.PI) / 180;
  const rTint = Math.round(128 + Math.cos(radAngle) * 127 * value.saturation);
  const gTint = Math.round(
    128 + Math.cos(radAngle - (2 * Math.PI) / 3) * 127 * value.saturation
  );
  const bTint = Math.round(
    128 + Math.cos(radAngle - (4 * Math.PI) / 3) * 127 * value.saturation
  );
  const tintRgb = `rgb(${rTint}, ${gTint}, ${bTint})`;

  return (
    <div className="flex flex-col items-center p-3 bg-[#13161e] border border-[#232733] rounded-xl flex-1 min-w-[150px]">
      {/* Header with Title and Reset */}
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <span className="text-xs font-semibold text-white tracking-wide block">
            {label}
          </span>
          <span className="text-[10px] text-[#71778c] block">{sublabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full border border-white/20"
            style={{ backgroundColor: value.saturation > 0.01 ? tintRgb : '#333745' }}
            title={`Tint: ${value.angle}° / ${(value.saturation * 100).toFixed(0)}%`}
          />
          <button
            onClick={onReset}
            className="text-[#646b82] hover:text-white p-0.5 rounded transition-colors"
            title="Reset Wheel"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Interactive Color Circle */}
      <div
        ref={wheelRef}
        onPointerDown={handlePointerDown}
        onDoubleClick={onReset}
        className="relative cursor-crosshair rounded-full shadow-inner select-none touch-none my-1"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background: `
            radial-gradient(circle at center, #1b1e28 0%, transparent 65%),
            conic-gradient(
              from 0deg,
              #ff2d55,
              #ff9500,
              #ffcc00,
              #4cd964,
              #5ac8fa,
              #007aff,
              #5856d6,
              #ff2d55
            )
          `,
          boxShadow: 'inset 0 0 12px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        {/* Subtle crosshairs */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-full h-[1px] bg-white" />
          <div className="absolute h-full w-[1px] bg-white" />
        </div>

        {/* Center neutral target circle */}
        <div className="absolute inset-0 m-auto w-3 h-3 rounded-full border border-white/25 pointer-events-none" />

        {/* Draggable Puck */}
        <div
          className="absolute w-3.5 h-3.5 -ml-[7px] -mt-[7px] rounded-full border-2 border-white shadow-md pointer-events-none transition-transform duration-75"
          style={{
            left: `${puckX}px`,
            top: `${puckY}px`,
            backgroundColor: tintRgb,
            transform: isDragging ? 'scale(1.25)' : 'scale(1)',
          }}
        />
      </div>

      {/* Numeric values */}
      <div className="w-full flex items-center justify-between text-[10px] text-[#787f95] font-mono mt-2 px-1">
        <span>{value.angle}°</span>
        <span>{(value.saturation * 100).toFixed(0)}%</span>
        <span>{value.luminance > 0 ? `+${(value.luminance * 100).toFixed(0)}` : (value.luminance * 100).toFixed(0)}</span>
      </div>

      {/* Luminance Offset Bar */}
      <div className="w-full mt-2">
        <div className="flex items-center justify-between text-[10px] text-[#80869d] mb-1">
          <span>Luma</span>
          <span className="font-mono text-[#abb1c4]">
            {value.luminance > 0 ? `+${(value.luminance * 100).toFixed(0)}` : (value.luminance * 100).toFixed(0)}
          </span>
        </div>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={value.luminance}
          onDoubleClick={() => onChange({ ...value, luminance: 0 })}
          onChange={(e) =>
            onChange({ ...value, luminance: parseFloat(e.target.value) })
          }
          className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-ew-resize accent-indigo-500"
        />
      </div>
    </div>
  );
};

interface ColorWheelsProps {
  colorWheels: {
    lift: ColorWheelVal;
    gamma: ColorWheelVal;
    gain: ColorWheelVal;
    offset: ColorWheelVal;
  };
  onChange: (wheels: {
    lift: ColorWheelVal;
    gamma: ColorWheelVal;
    gain: ColorWheelVal;
    offset: ColorWheelVal;
  }) => void;
}

export const ColorWheels: React.FC<ColorWheelsProps> = ({
  colorWheels,
  onChange,
}) => {
  const [showOffset, setShowOffset] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white tracking-wide">
            3-Way Color Wheels
          </span>
          <span className="text-[10px] text-[#71778c]">Primary Color Science</span>
        </div>
        <button
          onClick={() => setShowOffset(!showOffset)}
          className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
            showOffset
              ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40'
              : 'bg-[#181b24] text-[#80869d] hover:text-white border-[#272b38]'
          }`}
        >
          {showOffset ? 'Hide Master Offset' : '+ Master Offset'}
        </button>
      </div>

      {/* Grid of Wheels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <SingleWheel
          label="LIFT"
          sublabel="Shadows"
          value={colorWheels.lift}
          onChange={(lift) => onChange({ ...colorWheels, lift })}
          onReset={() =>
            onChange({
              ...colorWheels,
              lift: { angle: 0, saturation: 0, luminance: 0 },
            })
          }
        />
        <SingleWheel
          label="GAMMA"
          sublabel="Midtones"
          value={colorWheels.gamma}
          onChange={(gamma) => onChange({ ...colorWheels, gamma })}
          onReset={() =>
            onChange({
              ...colorWheels,
              gamma: { angle: 0, saturation: 0, luminance: 0 },
            })
          }
        />
        <SingleWheel
          label="GAIN"
          sublabel="Highlights"
          value={colorWheels.gain}
          onChange={(gain) => onChange({ ...colorWheels, gain })}
          onReset={() =>
            onChange({
              ...colorWheels,
              gain: { angle: 0, saturation: 0, luminance: 0 },
            })
          }
        />
      </div>

      {showOffset && (
        <div className="mt-1">
          <SingleWheel
            label="MASTER OFFSET"
            sublabel="Global Tint & Exposure"
            value={colorWheels.offset}
            onChange={(offset) => onChange({ ...colorWheels, offset })}
            onReset={() =>
              onChange({
                ...colorWheels,
                offset: { angle: 0, saturation: 0, luminance: 0 },
              })
            }
          />
        </div>
      )}
    </div>
  );
};
