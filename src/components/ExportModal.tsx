import React, { useState } from 'react';
import { ColorGradeSettings } from '../types/editor';
import { generateCubeLUT } from '../engine/colorEngine';
import {
  Download,
  X,
  FileCode,
  Copy,
  Check,
  Image as ImageIcon,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvas: HTMLCanvasElement | null;
  settings: ColorGradeSettings;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  canvas,
  settings,
}) => {
  const [format, setFormat] = useState<'jpeg' | 'png' | 'webp' | 'cube'>('jpeg');
  const [quality, setQuality] = useState(95);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!canvas) return;

    if (format === 'cube') {
      // Export 3D LUT
      const cubeStr = generateCubeLUT(settings, 17);
      const blob = new Blob([cubeStr], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'AuraGrade_ColorGrade.cube';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      onClose();
      return;
    }

    // Export Image
    const mimeType =
      format === 'jpeg' ? 'image/jpeg' : format === 'png' ? 'image/png' : 'image/webp';
    const ext = format === 'jpeg' ? 'jpg' : format;

    const dataUrl = canvas.toDataURL(mimeType, quality / 100);
    const link = document.createElement('a');
    link.download = `AuraGrade_Export_${Date.now()}.${ext}`;
    link.href = dataUrl;
    link.click();
    onClose();
  };

  const handleCopyToClipboard = async () => {
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }, 'image/png');
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#12151d] border border-[#232733] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202430]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/15 border border-indigo-500/30 rounded-xl">
              <Download className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Export Photo or 3D LUT
              </h3>
              <p className="text-xs text-[#71778c]">
                Full resolution master export with color profile
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

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          {/* Format selection */}
          <div>
            <span className="text-xs font-semibold text-[#8b91a5] block mb-2">
              Export Format
            </span>
            <div className="grid grid-cols-4 gap-1.5 bg-[#171a24] p-1 rounded-xl border border-[#252936]">
              {(['jpeg', 'png', 'webp', 'cube'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`py-2 text-xs font-semibold rounded-lg uppercase transition-all ${
                    format === fmt
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-[#8b91a5] hover:text-white'
                  }`}
                >
                  {fmt === 'cube' ? '.CUBE LUT' : fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="p-3 bg-[#171a24] border border-[#232733] rounded-xl text-xs text-[#80869a]">
            {format === 'jpeg' &&
              'High-fidelity JPEG output with configurable compression quality.'}
            {format === 'png' &&
              'Lossless PNG format with pristine color accuracy and alpha preservation.'}
            {format === 'webp' &&
              'Modern web format with advanced compression and sharp rendering.'}
            {format === 'cube' &&
              'Industry-standard 3D LUT (.cube) compatible with DaVinci Resolve, Adobe Premiere Pro, Final Cut Pro, and Photoshop.'}
          </div>

          {/* JPEG Quality Slider */}
          {format === 'jpeg' && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[#9ea4b9]">Export Quality</span>
                <span className="font-mono text-white text-[11px] tabular-nums">
                  {quality}%
                </span>
              </div>
              <input
                type="range"
                min="70"
                max="100"
                step="1"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-[#252a38] rounded-lg appearance-none cursor-ew-resize accent-indigo-500"
              />
            </div>
          )}

          {/* Resolution Info */}
          {canvas && format !== 'cube' && (
            <div className="flex items-center justify-between text-[11px] font-mono text-[#71778c] px-1">
              <span>Resolution:</span>
              <span className="text-white">
                {canvas.width} × {canvas.height} px
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0e1017] border-t border-[#202430] flex items-center justify-between">
          {format !== 'cube' ? (
            <button
              onClick={handleCopyToClipboard}
              className="flex items-center gap-1.5 text-xs font-medium text-[#8b91a5] hover:text-white transition-colors"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Image</span>
                </>
              )}
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#8b91a5] hover:text-white bg-[#1a1d26] hover:bg-[#232733] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {format === 'cube' ? '.CUBE' : 'Image'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
