import React, { useRef, useEffect, useState } from 'react';
import { LoupeData } from '../types/editor';
import { Eye, Activity, BarChart2, Disc } from 'lucide-react';

interface ScopesPanelProps {
  imageData: ImageData | null;
  loupeData: LoupeData | null;
}

type ScopeType = 'histogram' | 'waveform' | 'vectorscope';

export const ScopesPanel: React.FC<ScopesPanelProps> = ({
  imageData,
  loupeData,
}) => {
  const [activeScope, setActiveScope] = useState<ScopeType>('histogram');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const d = imageData.data;
    const len = d.length;

    if (activeScope === 'histogram') {
      // 1. Histogram (RGB & Luma)
      const rH = new Uint32Array(256);
      const gH = new Uint32Array(256);
      const bH = new Uint32Array(256);
      const step = Math.max(4, Math.floor(len / (4 * 30000)) * 4);

      for (let i = 0; i < len; i += step) {
        rH[d[i]]++;
        gH[d[i + 1]]++;
        bH[d[i + 2]]++;
      }

      let maxC = 1;
      for (let i = 0; i < 256; i++) {
        if (rH[i] > maxC) maxC = rH[i];
        if (gH[i] > maxC) maxC = gH[i];
        if (bH[i] > maxC) maxC = bH[i];
      }

      // Draw background grid
      ctx.strokeStyle = '#1a1d27';
      ctx.lineWidth = 1;
      for (let p = 0.25; p < 1; p += 0.25) {
        ctx.beginPath();
        ctx.moveTo(w * p, 0);
        ctx.lineTo(w * p, h);
        ctx.stroke();
      }

      // Channel curves
      const drawChannel = (hist: Uint32Array, color: string, fill: string) => {
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let i = 0; i < 256; i++) {
          const x = (i / 255) * w;
          const y = h - (hist[i] / maxC) * (h * 0.85);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      };

      ctx.globalCompositeOperation = 'screen';
      drawChannel(rH, 'rgba(239, 68, 68, 0.8)', 'rgba(239, 68, 68, 0.15)');
      drawChannel(gH, 'rgba(34, 197, 94, 0.8)', 'rgba(34, 197, 94, 0.15)');
      drawChannel(bH, 'rgba(59, 130, 246, 0.8)', 'rgba(59, 130, 246, 0.15)');
      ctx.globalCompositeOperation = 'source-over';
    } else if (activeScope === 'waveform') {
      // 2. Waveform Monitor (0 to 100 IRE)
      ctx.fillStyle = '#0a0b10';
      ctx.fillRect(0, 0, w, h);

      // Draw IRE lines
      ctx.strokeStyle = '#1e2332';
      ctx.lineWidth = 1;
      [0.1, 0.25, 0.5, 0.75, 0.9].forEach((p) => {
        ctx.beginPath();
        ctx.moveTo(0, h * p);
        ctx.lineTo(w, h * p);
        ctx.stroke();
      });

      const imgW = imageData.width;
      const imgH = imageData.height;
      const sampleStepX = Math.max(1, Math.floor(imgW / w));
      const sampleStepY = Math.max(1, Math.floor(imgH / 120));

      ctx.fillStyle = 'rgba(129, 140, 248, 0.15)';

      for (let x = 0; x < imgW; x += sampleStepX) {
        const destX = (x / imgW) * w;
        for (let y = 0; y < imgH; y += sampleStepY) {
          const idx = (y * imgW + x) * 4;
          const r = d[idx];
          const g = d[idx + 1];
          const b = d[idx + 2];
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;
          const destY = h - (luma / 255) * h;
          ctx.fillRect(destX, destY, 1, 1);
        }
      }
    } else if (activeScope === 'vectorscope') {
      // 3. Vectorscope (Chrominance circle with 137° skin tone line)
      ctx.fillStyle = '#0a0b10';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(cx, cy) - 10;

      // Draw circular boundary and reticles
      ctx.strokeStyle = '#1e2332';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.arc(cx, cy, maxR * 0.75, 0, Math.PI * 2);
      ctx.arc(cx, cy, maxR * 0.5, 0, Math.PI * 2);
      ctx.stroke();

      // Universal Skin Tone Line (at 137 degrees in standard Cb/Cr vectorscope)
      const skinAngle = (137 * Math.PI) / 180;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(skinAngle) * maxR, cy - Math.sin(skinAngle) * maxR);
      ctx.stroke();

      // Sample pixels
      const step = Math.max(4, Math.floor(len / (4 * 10000)) * 4);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';

      for (let i = 0; i < len; i += step) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];

        // Chrominance U and V
        const u = -0.168736 * r - 0.331264 * g + 0.5 * b;
        const v = 0.5 * r - 0.418688 * g - 0.081312 * b;

        const plotX = cx + (u / 128) * (maxR * 0.85);
        const plotY = cy - (v / 128) * (maxR * 0.85);

        ctx.fillRect(plotX, plotY, 1.2, 1.2);
      }
    }
  }, [imageData, activeScope]);

  return (
    <div className="flex flex-col gap-2 p-3 bg-[#13161e] border border-[#232733] rounded-xl">
      {/* Scope Mode Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveScope('histogram')}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition-all ${
              activeScope === 'histogram'
                ? 'bg-[#252a3a] text-white shadow-sm'
                : 'text-[#8b91a5] hover:text-[#c4cadb]'
            }`}
          >
            <BarChart2 className="w-3 h-3 text-indigo-400" />
            Histogram
          </button>

          <button
            onClick={() => setActiveScope('waveform')}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition-all ${
              activeScope === 'waveform'
                ? 'bg-[#252a3a] text-white shadow-sm'
                : 'text-[#8b91a5] hover:text-[#c4cadb]'
            }`}
          >
            <Activity className="w-3 h-3 text-emerald-400" />
            Waveform
          </button>

          <button
            onClick={() => setActiveScope('vectorscope')}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition-all ${
              activeScope === 'vectorscope'
                ? 'bg-[#252a3a] text-white shadow-sm'
                : 'text-[#8b91a5] hover:text-[#c4cadb]'
            }`}
          >
            <Disc className="w-3 h-3 text-amber-400" />
            Vectorscope
          </button>
        </div>

        {activeScope === 'vectorscope' && (
          <span className="text-[10px] text-amber-400/80 font-mono">
            137° Skin Line
          </span>
        )}
      </div>

      {/* Scope Canvas */}
      <div className="relative bg-[#0c0d12] border border-[#202430] rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={280}
          height={110}
          className="w-full h-[110px] block"
        />
      </div>

      {/* Color Loupe Readout */}
      {loupeData && (
        <div className="flex items-center justify-between px-2 py-1 bg-[#181b24] border border-[#252a38] rounded-md text-[11px]">
          <div className="flex items-center gap-2">
            <div
              className="w-3.5 h-3.5 rounded border border-white/20 shadow-sm"
              style={{ backgroundColor: loupeData.hex }}
            />
            <span className="font-mono text-white text-[10px]">
              {loupeData.hex.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-[#8b91a5]">
            <span>
              RGB: {loupeData.r}, {loupeData.g}, {loupeData.b}
            </span>
            <span>·</span>
            <span>
              HSL: {loupeData.hsl.h}°, {(loupeData.hsl.s * 100).toFixed(0)}%,{' '}
              {(loupeData.hsl.l * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
