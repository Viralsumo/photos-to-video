import React from 'react';
import { 
  Film, 
  Smartphone, 
  Monitor, 
  Square, 
  Layers, 
  Sparkles, 
  Upload, 
  Download, 
  Clock,
  Music,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { AspectRatio, ProjectSettings, AudioTrack } from '../types';
import { ASPECT_RATIOS } from '../constants/defaults';

interface HeaderProps {
  settings: ProjectSettings;
  onUpdateSettings: (settings: Partial<ProjectSettings>) => void;
  totalDuration: number;
  slideCount: number;
  onOpenUpload: () => void;
  onLoadSamples: () => void;
  onExportClick?: () => void;
  selectedTrack: AudioTrack | null;
  onOpenMusic: () => void;
  uiMode: 'simple' | 'advanced';
  onToggleMode: (mode: 'simple' | 'advanced') => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  totalDuration,
  slideCount,
  onOpenUpload,
  onLoadSamples,
  onExportClick,
  selectedTrack,
  onOpenMusic,
  uiMode,
  onToggleMode,
}) => {
  const aspectOptions: { key: AspectRatio; icon: React.ReactNode; label: string }[] = [
    { key: '9:16', icon: <Smartphone className="w-3.5 h-3.5" />, label: '9:16 Reel' },
    { key: '16:9', icon: <Monitor className="w-3.5 h-3.5" />, label: '16:9 Wide' },
    { key: '1:1', icon: <Square className="w-3.5 h-3.5" />, label: '1:1 Square' },
    { key: '4:5', icon: <Layers className="w-3.5 h-3.5" />, label: '4:5 Portrait' },
  ];

  return (
    <header className="h-14 sm:h-16 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-1.5 sm:gap-4 z-30 sticky top-0 w-full max-w-full overflow-hidden">
      {/* 1. Left: Brand & Title */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
          <Film className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="hidden xs:block">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              PhotoMotion
            </span>
            <span className="hidden md:inline-flex text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              Studio
            </span>
          </div>
          <p className="hidden lg:block text-[11px] text-slate-400 -mt-0.5">Cinematic Photo to Video</p>
        </div>
      </div>

      {/* 2. Center: Aspect Ratio & Mode Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Desktop: Segmented 4-way Aspect Ratio Control */}
        <div className="hidden md:flex items-center p-1 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-inner">
          {aspectOptions.map(({ key, icon }) => {
            const active = settings.aspectRatio === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onUpdateSettings({ 
                  aspectRatio: key,
                  resolution: {
                    width: ASPECT_RATIOS[key].width,
                    height: ASPECT_RATIOS[key].height
                  }
                })}
                title={ASPECT_RATIOS[key].label}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  active 
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-white/20' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
                }`}
              >
                {icon}
                <span className="hidden xl:inline">{key}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile: Compact Aspect Ratio Selector Dropdown */}
        <div className="md:hidden relative flex items-center">
          <select
            value={settings.aspectRatio}
            onChange={(e) => {
              const val = e.target.value as AspectRatio;
              onUpdateSettings({
                aspectRatio: val,
                resolution: {
                  width: ASPECT_RATIOS[val].width,
                  height: ASPECT_RATIOS[val].height,
                },
              });
            }}
            className="appearance-none bg-slate-800/90 text-slate-200 text-[11px] font-bold pl-2.5 pr-6 py-1.5 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {aspectOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
        </div>

        {/* Mode Switcher: Simple vs Advanced */}
        <div className="flex items-center p-0.5 sm:p-1 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-inner">
          <button
            type="button"
            onClick={() => onToggleMode('simple')}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition ${
              uiMode === 'simple'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
            }`}
            title="Simple 1-click video creation mode"
          >
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden xs:inline">Simple</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleMode('advanced')}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition ${
              uiMode === 'advanced'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
            }`}
            title="Advanced studio editor (timeline, crop, zoom & tilt)"
          >
            <SlidersHorizontal className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden xs:inline">Advanced</span>
          </button>
        </div>

        {/* Runtime info pill (visible on tablet & desktop) */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/60 border border-slate-700/50 text-[11px] font-medium text-slate-300">
          <Clock className="w-3 h-3 text-indigo-400" />
          <span>{totalDuration.toFixed(1)}s</span>
        </div>
      </div>

      {/* 3. Right: Music Library & Export Video Actions (Always fully visible!) */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Sample photos button when empty (desktop only) */}
        {slideCount === 0 && (
          <button
            type="button"
            onClick={onLoadSamples}
            className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Samples</span>
          </button>
        )}

        {/* Soundtrack Library Button */}
        <button
          type="button"
          onClick={onOpenMusic}
          className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold border transition ${
            selectedTrack
              ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/20'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
          }`}
          title="Open Royalty-Free Soundtrack Library"
        >
          <Music className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="hidden md:inline max-w-[100px] xl:max-w-[130px] truncate">
            {selectedTrack ? selectedTrack.title : 'Music'}
          </span>
          <span className="md:hidden">Music</span>
        </button>

        {/* Add Photos Button (visible on tablet & desktop; on mobile it's right in the main dock) */}
        <button
          type="button"
          onClick={onOpenUpload}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 transition shadow-sm"
        >
          <Upload className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Add Photos</span>
        </button>

        {/* Export Video Button */}
        <button
          type="button"
          onClick={onExportClick}
          disabled={slideCount === 0}
          className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold transition shadow-lg ${
            slideCount > 0
              ? 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white shadow-indigo-500/30 ring-1 ring-white/20 active:scale-95'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
          }`}
          title="Export and Download MP4 Video"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Export Video</span>
          <span className="sm:hidden">Export</span>
        </button>
      </div>
    </header>
  );
};
