import React, { useRef } from 'react';
import { Upload, X, Check, Image as ImageIcon } from 'lucide-react';

interface SamplePhoto {
  id: string;
  title: string;
  category: string;
  description: string;
  url: string;
}

export const SAMPLE_PHOTOS: SamplePhoto[] = [
  {
    id: 'studio-portrait',
    title: 'Studio Beauty Close-Up',
    category: 'Portrait & Skin Retouch',
    description: 'High-end editorial portrait with natural skin texture, freckles, and studio lighting.',
    url: '/src/assets/images/sample_studio_portrait_1793107335571.jpg',
  },
  {
    id: 'golden-hour',
    title: 'Golden Hour Portrait',
    category: 'Lifestyle & Color Grade',
    description: 'Natural rim sunlight, warm skin tones, and rich organic sunset bokeh.',
    url: '/src/assets/images/sample_golden_portrait_1793107353511.jpg',
  },
  {
    id: 'cinematic-street',
    title: 'Cinematic Rainy Twilight',
    category: 'Cinema Color Grade',
    description: 'Moody twilight cityscape with wet asphalt reflections and neon street lamps.',
    url: '/src/assets/images/sample_cinematic_street_1793107352944.jpg',
  },
];

interface SamplePhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePhotoUrl: string;
  onSelectPhoto: (url: string) => void;
  onUploadPhoto: (file: File) => void;
}

export const SamplePhotosModal: React.FC<SamplePhotosModalProps> = ({
  isOpen,
  onClose,
  activePhotoUrl,
  onSelectPhoto,
  onUploadPhoto,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadPhoto(e.target.files[0]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#12151d] border border-[#232733] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202430]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/15 border border-indigo-500/30 rounded-xl">
              <ImageIcon className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Select Photo or Upload
              </h3>
              <p className="text-xs text-[#71778c]">
                Choose a pro studio portrait sample or upload your own RAW/JPEG image
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
        <div className="p-6 flex flex-col gap-5">
          {/* Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-4 bg-[#161a24] hover:bg-[#1c2130] border-2 border-dashed border-[#2b3142] hover:border-indigo-500/50 rounded-xl flex items-center justify-center gap-3 transition-all group"
          >
            <div className="p-2 bg-[#202534] group-hover:bg-indigo-600/30 rounded-lg transition-colors">
              <Upload className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-left">
              <span className="text-xs font-semibold text-white block">
                Upload Your Own Photo
              </span>
              <span className="text-[11px] text-[#71778c]">
                Supports High-Res JPG, PNG, WebP (Retouch & Color Grade in real-time)
              </span>
            </div>
          </button>

          {/* Sample Photos Grid */}
          <div>
            <span className="text-xs font-semibold text-[#8b91a5] block mb-3">
              Curated Pro Studio Samples
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SAMPLE_PHOTOS.map((photo) => {
                const isActive = activePhotoUrl === photo.url;

                return (
                  <button
                    key={photo.id}
                    onClick={() => {
                      onSelectPhoto(photo.url);
                      onClose();
                    }}
                    className={`group text-left rounded-xl overflow-hidden border transition-all flex flex-col ${
                      isActive
                        ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-[#191d29]'
                        : 'border-[#232733] bg-[#141720] hover:border-[#353c50]'
                    }`}
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0c0d12]">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {isActive && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <span className="text-xs font-semibold text-white block">
                        {photo.title}
                      </span>
                      <span className="text-[10px] text-[#71778c] block mt-0.5">
                        {photo.category}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
