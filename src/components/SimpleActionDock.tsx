import React from 'react';
import { 
  Sparkles, 
  Upload, 
  Download, 
  Music, 
  SlidersHorizontal,
  X,
  Plus
} from 'lucide-react';
import { Slide, AudioTrack } from '../types';
import { MUSIC_LIBRARY } from '../constants/music';

interface SimpleActionDockProps {
  slides: Slide[];
  activeSlideIndex: number;
  onSelectSlide: (index: number) => void;
  onDeleteSlide: (id: string) => void;
  onOpenUpload: () => void;
  onMagicCreate: () => void;
  onExportClick: () => void;
  selectedTrack: AudioTrack | null;
  onSelectTrack: (track: AudioTrack) => void;
  onSwitchToAdvanced: () => void;
}

export const SimpleActionDock: React.FC<SimpleActionDockProps> = ({
  slides,
  activeSlideIndex,
  onSelectSlide,
  onDeleteSlide,
  onOpenUpload,
  onMagicCreate,
  onExportClick,
  selectedTrack,
  onSelectTrack,
  onSwitchToAdvanced,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-2 shrink-0 space-y-2">
      {/* 1. Visual Photo Strip (Shows all uploaded photos) */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 scrollbar-none">
        {slides.map((slide, idx) => {
          const isActive = idx === activeSlideIndex;
          return (
            <div
              key={slide.id}
              onClick={() => onSelectSlide(idx)}
              className={`relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-150 ${
                isActive
                  ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-105 shadow-md shadow-indigo-500/20'
                  : 'border-slate-800 opacity-75 hover:opacity-100 hover:border-slate-600'
              }`}
            >
              <img
                src={slide.imageUrl}
                alt={`Photo ${idx + 1}`}
                className="w-full h-full object-cover pointer-events-none"
              />
              <span className="absolute bottom-0.5 left-0.5 text-[9px] font-bold px-1 rounded bg-black/70 text-slate-300">
                #{idx + 1}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSlide(slide.id);
                }}
                title="Remove photo"
                className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/80 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          );
        })}

        {/* Add Photo Button in Filmstrip */}
        <button
          type="button"
          onClick={onOpenUpload}
          className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 flex flex-col items-center justify-center gap-0.5 transition"
          title="Add more photos"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[9px] font-bold">Add</span>
        </button>
      </div>

      {/* 2. Primary Action Bar */}
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-2.5 sm:p-3.5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-2.5">
        {/* Magic Button & Upload Photos */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onMagicCreate}
            disabled={slides.length === 0}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-orange-500/20 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Automatically apply professional camera zooms, pans & transitions"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Magic Auto-Style</span>
          </button>

          <button
            type="button"
            onClick={onOpenUpload}
            className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition active:scale-95 shrink-0"
          >
            <Upload className="w-4 h-4 text-indigo-400" />
            <span className="hidden xs:inline">Upload</span>
            <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px]">
              {slides.length}
            </span>
          </button>
        </div>

        {/* Music Mood Selector (Visible on both mobile & desktop) */}
        <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full">
          <span className="text-[10px] font-bold text-slate-400 px-1 flex items-center gap-1 shrink-0">
            <Music className="w-3 h-3 text-indigo-400" /> Mood:
          </span>
          {MUSIC_LIBRARY.slice(0, 4).map((track) => {
            const isSelected = selectedTrack?.id === track.id;
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => onSelectTrack(track)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {track.category}
              </button>
            );
          })}
        </div>

        {/* Advanced Settings & Big Download Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onSwitchToAdvanced}
            className="flex items-center gap-1 px-3 py-3 rounded-2xl bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-700/60 transition"
            title="Open advanced slide-by-slide controls, tilt, zoom and timeline"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Advanced</span>
          </button>

          <button
            type="button"
            onClick={onExportClick}
            disabled={slides.length === 0}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/30 ring-1 ring-white/20 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>Download Video</span>
          </button>
        </div>
      </div>
    </div>
  );
};
