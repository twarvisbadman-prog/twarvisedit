import React, { useState } from 'react';
import { ColorGradeSettings } from '../types/editor';
import { Sparkles, X, Wand2, ArrowRight, Loader2, Film } from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyAIGrade: (gradeData: any) => void;
}

const CREATIVE_PROMPTS = [
  {
    title: 'Warm Kodak Portra 400',
    prompt: 'Warm Kodak Portra 35mm film look with creamy skin tones, lifted soft shadows, and golden amber highlights.',
  },
  {
    title: 'Blockbuster Teal & Orange',
    prompt: 'Hollywood action blockbuster color grade with deep rich cyan shadows and luminous warm peach skin tones.',
  },
  {
    title: 'Nordic Noir & Emerald Haze',
    prompt: 'Moody Nordic cinema style with deep cool emerald/cyan shadows, desaturated foliage, and striking facial contrast.',
  },
  {
    title: 'High-Fashion Editorial Beauty',
    prompt: 'High-end Vogue beauty editorial with porcelain skin tone preservation, crisp contrast, and neutral highlights.',
  },
  {
    title: 'Vintage Silver Gelatin B&W',
    prompt: 'Classic Ansel Adams fine art monochrome with deep velvety blacks, luminous skin silver tones, and authentic grain.',
  },
];

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyAIGrade,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) return;

    setIsLoading(true);
    setStatusMsg('Analyzing tonal range and synthesizing color wheels...');

    try {
      const res = await fetch('/api/ai-grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt }),
      });

      const data = await res.json();
      if (data.success && data.grade) {
        onApplyAIGrade(data.grade);
        onClose();
      } else {
        setStatusMsg('Could not synthesize grade. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setStatusMsg('AI processing error. Falling back to analog preset.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#12151d] border border-[#232733] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202430]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/15 border border-amber-500/30 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                AI Neural Color Grading
              </h3>
              <p className="text-xs text-[#71778c]">
                Describe your desired cinema mood or aesthetic look
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
          {/* Prompt Textarea */}
          <div>
            <label className="text-xs font-semibold text-[#8b91a5] block mb-2">
              Creative Look Description
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 1970s warm summer California film with soft glowing highlights, muted greens, and radiant skin tones..."
              className="w-full bg-[#171a24] border border-[#252a38] focus:border-indigo-500 rounded-xl p-3 text-xs text-white placeholder-[#585f76] focus:outline-none transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Quick Style Inspiration Chips */}
          <div>
            <span className="text-[11px] font-medium text-[#71778c] block mb-2">
              Or pick an instant cinema aesthetic:
            </span>
            <div className="flex flex-col gap-1.5">
              {CREATIVE_PROMPTS.map((item) => (
                <button
                  key={item.title}
                  onClick={() => {
                    setPrompt(item.prompt);
                    handleGenerate(item.prompt);
                  }}
                  className="p-2.5 bg-[#161922] hover:bg-[#1e2330] border border-[#232733] rounded-xl text-left transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs font-semibold text-white block group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-[#71778c] block line-clamp-1">
                      {item.prompt}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#585f76] group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>

          {statusMsg && (
            <p className="text-xs text-amber-300/80 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
              {statusMsg}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0e1017] border-t border-[#202430] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#8b91a5] hover:text-white bg-[#1a1d26] hover:bg-[#232733] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleGenerate()}
            disabled={isLoading || !prompt.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-sm transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing Look...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                <span>Apply AI Grade</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
