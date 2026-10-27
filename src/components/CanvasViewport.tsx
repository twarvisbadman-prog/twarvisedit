import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ColorGradeSettings,
  RetouchToolType,
  BrushSettings,
  RetouchStroke,
  LoupeData,
  RetouchPoint,
} from '../types/editor';
import {
  applyColorGradeToImageData,
  applyRetouchStrokeToCanvas,
  rgbToHsl,
} from '../engine/colorEngine';
import { processAIRetouch, AIRetouchSettings } from '../engine/aiRetouchEngine';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Split,
  Eye,
} from 'lucide-react';

interface CanvasViewportProps {
  baseImage: HTMLImageElement | null;
  settings: ColorGradeSettings;
  activeTool: RetouchToolType;
  brush: BrushSettings;
  setBrush: React.Dispatch<React.SetStateAction<BrushSettings>>;
  retouchStrokes: RetouchStroke[];
  onAddStroke: (stroke: RetouchStroke) => void;
  splitMode: 'off' | 'wipe' | 'side-by-side';
  setSplitMode: (mode: 'off' | 'wipe' | 'side-by-side') => void;
  isComparing: boolean;
  onLoupeChange: (loupe: LoupeData | null) => void;
  onImageRendered?: (imageData: ImageData) => void;
  aiRetouchSettings: AIRetouchSettings;
  aiRetouchEnabled: boolean;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  baseImage,
  settings,
  activeTool,
  brush,
  setBrush,
  retouchStrokes,
  onAddStroke,
  splitMode,
  setSplitMode,
  isComparing,
  onLoupeChange,
  onImageRendered,
  aiRetouchSettings,
  aiRetouchEnabled,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Split Screen Wipe position (0 to 1 normalized)
  const [wipePos, setWipePos] = useState(0.5);
  const [isDraggingWipe, setIsDraggingWipe] = useState(false);

  // Brush stroke in progress
  const [currentStrokePoints, setCurrentStrokePoints] = useState<RetouchPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Fit image to screen on load
  const fitToScreen = useCallback(() => {
    if (!baseImage || !containerRef.current) return;
    const cw = containerRef.current.clientWidth - 48;
    const ch = containerRef.current.clientHeight - 48;
    const iw = baseImage.naturalWidth || baseImage.width;
    const ih = baseImage.naturalHeight || baseImage.height;

    const scale = Math.min(cw / iw, ch / ih, 1);
    setZoom(scale);
    setPan({ x: 0, y: 0 });
  }, [baseImage]);

  useEffect(() => {
    fitToScreen();
  }, [fitToScreen]);

  // Keyboard shortcut for brush resizing: [ to decrease, ] to increase
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '[') {
        setBrush((prev) => ({ ...prev, size: Math.max(4, prev.size - 5) }));
      } else if (e.key === ']') {
        setBrush((prev) => ({ ...prev, size: Math.min(250, prev.size + 5) }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setBrush]);

  // Offscreen rendering pipeline
  const renderPipeline = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImage) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const iw = baseImage.naturalWidth || baseImage.width;
    const ih = baseImage.naturalHeight || baseImage.height;

    if (canvas.width !== iw || canvas.height !== ih) {
      canvas.width = iw;
      canvas.height = ih;
    }

    // 1. Draw pristine original base image
    ctx.clearRect(0, 0, iw, ih);
    ctx.drawImage(baseImage, 0, 0, iw, ih);

    // If hold-to-compare is active, render only original
    if (isComparing) {
      return;
    }

    // 2. Apply AI Retouch features if enabled
    if (aiRetouchEnabled) {
      const origData = ctx.getImageData(0, 0, iw, ih);
      const aiData = ctx.createImageData(iw, ih);
      processAIRetouch(origData, aiData, aiRetouchSettings);
      ctx.putImageData(aiData, 0, 0);
    }

    // 3. Apply manual retouch strokes
    for (const stroke of retouchStrokes) {
      applyRetouchStrokeToCanvas(ctx, stroke, iw, ih);
    }

    // Apply live current stroke if currently drawing
    if (currentStrokePoints.length > 0 && activeTool !== 'navigate') {
      applyRetouchStrokeToCanvas(
        ctx,
        {
          id: 'temp',
          tool: activeTool,
          brush,
          points: currentStrokePoints,
          timestamp: Date.now(),
        },
        iw,
        ih
      );
    }

    // 4. Capture retouched buffer before color grade
    const retouchedData = ctx.getImageData(0, 0, iw, ih);

    // 5. Apply Color Grading Pipeline
    const gradedData = ctx.createImageData(iw, ih);
    applyColorGradeToImageData(retouchedData, gradedData, settings);

    // 6. Handle Split-Screen Wipe mode
    if (splitMode === 'wipe') {
      // Put graded data on canvas
      ctx.putImageData(gradedData, 0, 0);

      // Draw original on the left side of wipe divider
      const wipePixelX = Math.round(iw * wipePos);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, wipePixelX, ih);
      ctx.clip();
      ctx.drawImage(baseImage, 0, 0, iw, ih);

      // Draw dividing hairline
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wipePixelX, 0);
      ctx.lineTo(wipePixelX, ih);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.putImageData(gradedData, 0, 0);
    }

    // Broadcast image data for real-time scopes
    if (onImageRendered) {
      onImageRendered(gradedData);
    }
  }, [
    baseImage,
    isComparing,
    aiRetouchEnabled,
    aiRetouchSettings,
    retouchStrokes,
    currentStrokePoints,
    activeTool,
    brush,
    settings,
    splitMode,
    wipePos,
    onImageRendered,
  ]);

  useEffect(() => {
    renderPipeline();
  }, [renderPipeline]);

  // Pointer event coordinate helpers (canvas space vs viewport space)
  const getCanvasCoords = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    return {
      x: Math.round(Math.max(0, Math.min(canvas.width, x))),
      y: Math.round(Math.max(0, Math.min(canvas.height, y))),
    };
  };

  // Zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.88;
    setZoom((prev) => Math.max(0.1, Math.min(8.0, prev * factor)));
  };

  // Pointer Down (Painting or Panning)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only primary mouse button

    // Spacebar held or Navigate tool active: Pan viewport
    if (activeTool === 'navigate' || e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    // Check if clicked near wipe slider
    if (splitMode === 'wipe' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickNormX = (e.clientX - rect.left) / rect.width;
      if (Math.abs(clickNormX - wipePos) < 0.04) {
        setIsDraggingWipe(true);
        return;
      }
    }

    // Retouch drawing stroke
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setCurrentStrokePoints([coords]);
  };

  // Pointer Move (Drawing, Panning, or Loupe Sampling)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCursorPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    if (isDraggingWipe && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const normX = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
      setWipePos(normX);
      return;
    }

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (isDrawing) {
      const coords = getCanvasCoords(e);
      setCurrentStrokePoints((prev) => [...prev, coords]);
    }

    // Sample color under cursor for Loupe / Scopes
    if (canvasRef.current) {
      const coords = getCanvasCoords(e);
      const ctx = canvasRef.current.getContext('2d');
      if (ctx && coords.x >= 0 && coords.y >= 0 && coords.x < canvasRef.current.width && coords.y < canvasRef.current.height) {
        try {
          const pixel = ctx.getImageData(coords.x, coords.y, 1, 1).data;
          const r = pixel[0];
          const g = pixel[1];
          const b = pixel[2];
          const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
          const [h, s, l] = rgbToHsl(r, g, b);
          onLoupeChange({
            x: coords.x,
            y: coords.y,
            r,
            g,
            b,
            hex,
            hsl: { h: Math.round(h), s, l },
          });
        } catch {
          // ignore off-bounds
        }
      }
    }
  };

  // Pointer Up (Commit Stroke)
  const handlePointerUp = () => {
    if (isDraggingWipe) {
      setIsDraggingWipe(false);
      return;
    }

    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing) {
      setIsDrawing(false);
      if (currentStrokePoints.length > 0 && activeTool !== 'navigate') {
        const newStroke: RetouchStroke = {
          id: `stroke-${Date.now()}-${Math.random()}`,
          tool: activeTool,
          brush: { ...brush },
          points: [...currentStrokePoints],
          timestamp: Date.now(),
        };
        onAddStroke(newStroke);
      }
      setCurrentStrokePoints([]);
    }
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        handlePointerUp();
        setCursorPos(null);
        onLoupeChange(null);
      }}
      className={`relative w-full h-full bg-[#0a0b0e] overflow-hidden flex items-center justify-center select-none touch-none ${
        activeTool === 'navigate' ? 'cursor-grab' : 'cursor-crosshair'
      }`}
    >
      {/* Zoom / Pan Container */}
      <div
        className="transition-transform duration-75 ease-out origin-center"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <canvas
          ref={canvasRef}
          className="shadow-2xl rounded-sm block max-w-none pointer-events-auto"
        />
      </div>

      {/* Interactive Brush Cursor Circle on Canvas */}
      {cursorPos && activeTool !== 'navigate' && !isPanning && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 shadow-sm"
          style={{
            left: `${cursorPos.x}px`,
            top: `${cursorPos.y}px`,
            width: `${brush.size * zoom}px`,
            height: `${brush.size * zoom}px`,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.6)',
          }}
        >
          {/* Inner feather ring */}
          {brush.hardness < 95 && (
            <div
              className="absolute inset-0 m-auto rounded-full border border-dashed border-white/40"
              style={{
                width: `${Math.max(2, brush.size * zoom * (brush.hardness / 100))}px`,
                height: `${Math.max(2, brush.size * zoom * (brush.hardness / 100))}px`,
              }}
            />
          )}
        </div>
      )}

      {/* Split Mode Wipe Handle & Divider Line */}
      {splitMode === 'wipe' && (
        <div
          className="absolute top-0 bottom-0 z-20 pointer-events-none"
          style={{ left: `${wipePos * 100}%` }}
        >
          <div className="absolute top-0 bottom-0 -ml-[1px] w-[2px] bg-white shadow-[0_0_8px_rgba(0,0,0,0.8)]" />
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center pointer-events-auto cursor-ew-resize">
            <Split className="w-4 h-4 rotate-90" />
          </div>
          <div className="absolute top-4 -translate-x-1/2 bg-black/80 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap">
            Before ◂ ▸ After
          </div>
        </div>
      )}

      {/* Floating Bottom Viewport Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1 bg-[#12151d]/90 backdrop-blur-md border border-[#232733] rounded-xl shadow-xl z-30">
        <button
          onClick={() => setZoom((z) => Math.max(0.1, z * 0.85))}
          className="p-1.5 text-[#8b91a5] hover:text-white rounded-lg transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono text-white px-2 tabular-nums">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => setZoom((z) => Math.min(8.0, z * 1.15))}
          className="p-1.5 text-[#8b91a5] hover:text-white rounded-lg transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-[#232733] mx-1" />

        <button
          onClick={fitToScreen}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#c4cadb] hover:text-white bg-[#1a1d26] hover:bg-[#232733] rounded-md transition-colors"
          title="Fit image to screen"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Fit</span>
        </button>

        <button
          onClick={() => {
            setZoom(1.0);
            setPan({ x: 0, y: 0 });
          }}
          className="px-2 py-1 text-xs font-medium text-[#c4cadb] hover:text-white bg-[#1a1d26] hover:bg-[#232733] rounded-md transition-colors font-mono"
          title="100% 1:1 Pixel View"
        >
          1:1
        </button>

        {/* AI Retouch Indicator */}
        {aiRetouchEnabled && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 ml-1 bg-pink-500/15 border border-pink-500/30 rounded-md text-[10px] text-pink-300 font-medium">
            <span>AI Retouch Active</span>
          </div>
        )}
      </div>
    </div>
  );
};
