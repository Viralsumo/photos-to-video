import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, X, AlertCircle } from 'lucide-react';
import { loadImageFromFile } from '../utils/exif';
import { Slide } from '../types';
import { DEFAULT_SETTINGS } from '../constants/defaults';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSlides: (newSlides: Slide[]) => void;
  onLoadSamples: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onAddSlides,
  onLoadSamples,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (fileArray.length === 0) {
      setErrorMsg('Please select valid image files (JPG, PNG, WebP, etc.)');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const newSlides: Slide[] = [];

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const { url, width, height } = await loadImageFromFile(file);

        // Auto-assign alternating Ken Burns motions for varied feel
        const motions: Slide['motion']['type'][] = [
          'zoom-in',
          'pan-right',
          'zoom-out',
          'pan-left',
        ];
        const assignedMotion = motions[i % motions.length];

        newSlides.push({
          id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          imageUrl: url,
          originalWidth: width,
          originalHeight: height,
          duration: DEFAULT_SETTINGS.defaultSlideDuration,
          crop: {
            scale: 1.0,
            x: 0,
            y: 0,
            rotation: 0,
            fitMode: 'cover',
          },
          motion: {
            type: assignedMotion,
            intensity: 1.2,
          },
          transition: {
            type: DEFAULT_SETTINGS.defaultTransition,
            duration: 0.8,
          },
        });
      }

      onAddSlides(newSlides);
      setIsLoading(false);
      onClose();
    } catch (err) {
      console.error('Error processing image files:', err);
      setErrorMsg('Failed to process some images. Please try again.');
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-400" />
            Add Photos to Storyboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Select photos from your phone gallery or computer. We'll automatically optimize and prepare them for video.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
              : 'border-slate-700 hover:border-slate-500 bg-slate-950/40 hover:bg-slate-950/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                processFiles(e.target.files);
              }
            }}
          />

          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition shadow-inner">
            <UploadCloud className="w-7 h-7" />
          </div>

          <p className="text-sm font-semibold text-slate-200">
            {isLoading ? 'Processing high-res photos...' : 'Click to select or drag & drop photos'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Supports JPG, PNG, WEBP, and camera roll formats
          </p>

          <button
            type="button"
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
          >
            Browse Files / Photos
          </button>
        </div>

        {/* Or Quick Load Sample Photos */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">Don't have photos handy?</span>
          <button
            type="button"
            onClick={() => {
              onLoadSamples();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load 4 Sample Photos</span>
          </button>
        </div>
      </div>
    </div>
  );
};
