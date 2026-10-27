import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CurvesState, CurvePoint } from '../types/editor';
import { buildCurveLUT } from '../engine/colorEngine';
import { RotateCcw } from 'lucide-react';

interface CurvesEditorProps {
  curves: CurvesState;
  onChange: (curves: CurvesState) => void;
  histogram?: { rHist: Uint32Array; gHist: Uint32Array; bHist: Uint32Array; lumaHist: Uint32Array; maxCount: number } | null;
}

type CurveChannel = 'master' | 'red' | 'green' | 'blue';

export const CurvesEditor: React.FC<CurvesEditorProps> = ({
  curves,
  onChange,
  histogram,
}) => {
  const [activeChannel, setActiveChannel] = useState<CurveChannel>('master');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activePointIdx, setActivePointIdx] = useState<number | null>(null);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);

  const points = curves[activeChannel];

  // Helper to update current channel points
  const updatePoints = useCallback((newPoints: CurvePoint[]) => {
    // Keep points sorted by x
    const sorted = [...newPoints].sort((a, b) => a.x - b.x);
    onChange({
      ...curves,
      [activeChannel]: sorted,
    });
  }, [activeChannel, curves, onChange]);

  // Color styling
  const channelColors = {
    master: { stroke: '#ffffff', fill: 'rgba(255,255,255,0.06)', point: '#ffffff' },
    red: { stroke: '#ef4444', fill: 'rgba(239,68,68,0.1)', point: '#ef4444' },
    green: { stroke: '#22c55e', fill: 'rgba(34,197,94,0.1)', point: '#22c55e' },
    blue: { stroke: '#3b82f6', fill: 'rgba(59,130,246,0.1)', point: '#3b82f6' },
  };

  // Render curve & histogram on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Background Grid & Diagonal Linear Reference
    ctx.strokeStyle = '#1e222d';
    ctx.lineWidth = 1;

    // Grid lines (25%, 50%, 75%)
    for (let p = 0.25; p < 1; p += 0.25) {
      // Horizontal
      ctx.beginPath();
      ctx.moveTo(0, h * p);
      ctx.lineTo(w, h * p);
      ctx.stroke();

      // Vertical
      ctx.beginPath();
      ctx.moveTo(w * p, 0);
      ctx.lineTo(w * p, h);
      ctx.stroke();
    }

    // 45 degree neutral diagonal reference line
    ctx.strokeStyle = '#282e3d';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w, 0);
    ctx.stroke();

    // 2. Background Histogram Silhouette
    if (histogram && histogram.maxCount > 0) {
      ctx.save();
      ctx.fillStyle =
        activeChannel === 'red'
          ? 'rgba(239, 68, 68, 0.15)'
          : activeChannel === 'green'
          ? 'rgba(34, 197, 94, 0.15)'
          : activeChannel === 'blue'
          ? 'rgba(59, 130, 246, 0.15)'
          : 'rgba(255, 255, 255, 0.08)';

      const histArray =
        activeChannel === 'red'
          ? histogram.rHist
          : activeChannel === 'green'
          ? histogram.gHist
          : activeChannel === 'blue'
          ? histogram.bHist
          : histogram.lumaHist;

      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < 256; i++) {
        const xPos = (i / 255) * w;
        const normH = (histArray[i] / histogram.maxCount) * (h * 0.7);
        ctx.lineTo(xPos, h - normH);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 3. Interpolated Spline Curve
    const lut = buildCurveLUT(points);
    const color = channelColors[activeChannel];

    ctx.beginPath();
    ctx.strokeStyle = color.stroke;
    ctx.lineWidth = 2.5;

    for (let x = 0; x < 256; x++) {
      const cx = (x / 255) * w;
      const cy = h - (lut[x] / 255) * h;
      if (x === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // 4. Draw Control Points
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const cx = (pt.x / 255) * w;
      const cy = h - (pt.y / 255) * h;

      ctx.beginPath();
      ctx.arc(cx, cy, i === activePointIdx ? 6 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = i === activePointIdx ? '#ffffff' : color.point;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#0e1017';
      ctx.stroke();
    }
  }, [points, activeChannel, activePointIdx, histogram]);

  // Pointer event handlers for drag / point addition
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 255;
    const clickY = (1 - (e.clientY - rect.top) / rect.height) * 255;

    // Check if clicked close to an existing point (within 12 canvas units)
    let foundIdx = -1;
    let minDist = 14;

    for (let i = 0; i < points.length; i++) {
      const dist = Math.hypot(points[i].x - clickX, points[i].y - clickY);
      if (dist < minDist) {
        minDist = dist;
        foundIdx = i;
      }
    }

    if (foundIdx !== -1) {
      setActivePointIdx(foundIdx);
    } else {
      // Add new point on the curve
      const newPt: CurvePoint = {
        x: Math.round(Math.max(0, Math.min(255, clickX))),
        y: Math.round(Math.max(0, Math.min(255, clickY))),
      };
      const updated = [...points, newPt].sort((a, b) => a.x - b.x);
      updatePoints(updated);
      setActivePointIdx(updated.findIndex((p) => p.x === newPt.x));
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const currX = Math.round(Math.max(0, Math.min(255, ((e.clientX - rect.left) / rect.width) * 255)));
    const currY = Math.round(Math.max(0, Math.min(255, (1 - (e.clientY - rect.top) / rect.height) * 255)));

    setHoverCoord({ x: currX, y: currY });

    if (activePointIdx === null) return;

    const updated = [...points];
    const isEndpoint = activePointIdx === 0 || activePointIdx === points.length - 1;

    if (isEndpoint) {
      // Endpoint X is locked at 0 or 255; Y is free
      updated[activePointIdx] = {
        x: updated[activePointIdx].x,
        y: currY,
      };
    } else {
      // Internal point: keep within neighbor X boundaries
      const minX = points[activePointIdx - 1]?.x + 2 || 0;
      const maxX = points[activePointIdx + 1]?.x - 2 || 255;
      updated[activePointIdx] = {
        x: Math.max(minX, Math.min(maxX, currX)),
        y: currY,
      };
    }

    updatePoints(updated);
  };

  const handlePointerUp = () => {
    setActivePointIdx(null);
  };

  const handleDoubleClick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 255;
    const clickY = (1 - (e.clientY - rect.top) / rect.height) * 255;

    // Check if double clicked an internal point to delete it
    for (let i = 1; i < points.length - 1; i++) {
      const dist = Math.hypot(points[i].x - clickX, points[i].y - clickY);
      if (dist < 15) {
        const updated = points.filter((_, idx) => idx !== i);
        updatePoints(updated);
        setActivePointIdx(null);
        break;
      }
    }
  };

  // Preset curves
  const applyCurvePreset = (presetType: 'linear' | 'scurve' | 'matte' | 'highlights') => {
    let newPts: CurvePoint[] = [];
    switch (presetType) {
      case 'linear':
        newPts = [
          { x: 0, y: 0 },
          { x: 255, y: 255 },
        ];
        break;
      case 'scurve':
        newPts = [
          { x: 0, y: 0 },
          { x: 64, y: 50 },
          { x: 192, y: 206 },
          { x: 255, y: 255 },
        ];
        break;
      case 'matte':
        newPts = [
          { x: 0, y: 24 },
          { x: 64, y: 68 },
          { x: 192, y: 196 },
          { x: 255, y: 240 },
        ];
        break;
      case 'highlights':
        newPts = [
          { x: 0, y: 0 },
          { x: 128, y: 128 },
          { x: 200, y: 220 },
          { x: 255, y: 245 },
        ];
        break;
    }
    updatePoints(newPts);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Channel Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-[#151821] p-1 rounded-lg border border-[#232733]">
          {(['master', 'red', 'green', 'blue'] as CurveChannel[]).map((ch) => (
            <button
              key={ch}
              onClick={() => {
                setActiveChannel(ch);
                setActivePointIdx(null);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded capitalize transition-all ${
                activeChannel === ch
                  ? ch === 'master'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : ch === 'red'
                    ? 'bg-red-500 text-white shadow-sm'
                    : ch === 'green'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-blue-500 text-white shadow-sm'
                  : 'text-[#8b91a5] hover:text-white'
              }`}
            >
              {ch === 'master' ? 'RGB Master' : ch}
            </button>
          ))}
        </div>

        <button
          onClick={() => applyCurvePreset('linear')}
          className="flex items-center gap-1 text-[11px] text-[#71778c] hover:text-white px-2 py-1 rounded transition-colors"
          title="Reset to Linear"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Curve Canvas */}
      <div className="relative bg-[#0d0f14] border border-[#232733] rounded-xl overflow-hidden p-2">
        <canvas
          ref={canvasRef}
          width={256}
          height={256}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onDoubleClick={handleDoubleClick}
          className="w-full h-auto aspect-square cursor-crosshair block rounded-lg select-none touch-none"
        />

        {/* Hover Coordinate Tag */}
        {hoverCoord && (
          <div className="absolute top-3 right-3 text-[10px] font-mono text-[#8b91a5] bg-[#171a22]/80 backdrop-blur-sm px-1.5 py-0.5 rounded border border-[#262a38] pointer-events-none">
            In: {hoverCoord.x} / Out: {hoverCoord.y}
          </div>
        )}
      </div>

      {/* Curve Presets & Tips */}
      <div className="flex items-center justify-between text-[11px] text-[#71778c]">
        <div className="flex items-center gap-1.5">
          <span className="text-[#888ea1]">Presets:</span>
          <button
            onClick={() => applyCurvePreset('scurve')}
            className="hover:text-indigo-400 underline underline-offset-2 transition-colors"
          >
            S-Curve
          </button>
          <span>·</span>
          <button
            onClick={() => applyCurvePreset('matte')}
            className="hover:text-indigo-400 underline underline-offset-2 transition-colors"
          >
            Matte Film
          </button>
          <span>·</span>
          <button
            onClick={() => applyCurvePreset('highlights')}
            className="hover:text-indigo-400 underline underline-offset-2 transition-colors"
          >
            Soft Roll-off
          </button>
        </div>
        <span className="text-[10px] text-[#555b70]">Double-click to remove point</span>
      </div>
    </div>
  );
};
