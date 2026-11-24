import React, { useState, useRef } from 'react';
import { 
  Music, 
  Play, 
  Pause, 
  Volume2, 
  Upload, 
  Check, 
  X, 
  Disc3
} from 'lucide-react';
import { AudioTrack } from '../types';
import { MUSIC_LIBRARY } from '../constants/music';
import { globalAudioEngine } from '../utils/audioEngine';

interface MusicModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTrack: AudioTrack | null;
  onSelectTrack: (track: AudioTrack | null) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  autoFade: boolean;
  onToggleAutoFade: (val: boolean) => void;
  onCustomAudioUpload: (file: File) => void;
}

export const MusicModal: React.FC<MusicModalProps> = ({
  isOpen,
  onClose,
  selectedTrack,
  onSelectTrack,
  volume,
  onVolumeChange,
  autoFade,
  onToggleAutoFade,
  onCustomAudioUpload,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const categories = ['All', 'Cinematic', 'Lo-Fi', 'Acoustic', 'Upbeat', 'Ambient'];

  const filteredTracks = activeCategory === 'All' 
    ? MUSIC_LIBRARY 
    : MUSIC_LIBRARY.filter((t) => t.category === activeCategory);

  const handleTogglePreview = (track: AudioTrack) => {
    if (previewingTrackId === track.id) {
      globalAudioEngine.pause();
      setPreviewingTrackId(null);
    } else {
      globalAudioEngine.play(track.url, 0, volume, false);
      setPreviewingTrackId(track.id);
    }
  };

  const handleSelect = (track: AudioTrack | null) => {
    globalAudioEngine.pause();
    setPreviewingTrackId(null);
    onSelectTrack(track);
  };

  const handleCustomFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onCustomAudioUpload(file);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Royalty-Free Soundtrack Library</h2>
              <p className="text-xs text-slate-400">Choose free background music or upload your own audio</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              globalAudioEngine.pause();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills & Custom Upload Button */}
        <div className="py-3 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Upload File</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleCustomFile}
          />
        </div>

        {/* Tracks List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 py-2">
          {/* Option: No Audio / Mute */}
          <div
            onClick={() => handleSelect(null)}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedTrack === null
                ? 'bg-indigo-600/10 border-indigo-500/50 ring-1 ring-indigo-500/30'
                : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500">
                <Disc3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-300">No Background Music</h4>
                <p className="text-[10px] text-slate-500">Export video with silent audio track</p>
              </div>
            </div>
            {selectedTrack === null && (
              <span className="p-1 rounded-full bg-indigo-600 text-white">
                <Check className="w-3 h-3" />
              </span>
            )}
          </div>

          {filteredTracks.map((track) => {
            const isSelected = selectedTrack?.id === track.id;
            const isPreviewing = previewingTrackId === track.id;

            return (
              <div
                key={track.id}
                onClick={() => handleSelect(track)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-indigo-600/15 border-indigo-500/60 ring-1 ring-indigo-500/30 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Play / Preview Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePreview(track);
                    }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition shrink-0 ${
                      isPreviewing
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white'
                    }`}
                    title={isPreviewing ? 'Pause Preview' : 'Listen Preview'}
                  >
                    {isPreviewing ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white truncate">{track.title}</h4>
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-slate-800 text-indigo-400 border border-slate-700">
                        {track.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isSelected && (
                    <span className="p-1 rounded-full bg-indigo-600 text-white">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Audio Mix Controls Footer */}
        <div className="pt-4 mt-2 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5 font-semibold">
              <Volume2 className="w-4 h-4 text-indigo-400" /> Soundtrack Volume
            </span>
            <span className="font-mono text-indigo-400 font-bold">{Math.round(volume * 100)}%</span>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={autoFade}
                onChange={(e) => onToggleAutoFade(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-0"
              />
              <span>Auto Fade-In & Fade-Out at start/finish</span>
            </label>

            <button
              type="button"
              onClick={() => {
                globalAudioEngine.pause();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
