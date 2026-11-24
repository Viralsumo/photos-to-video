import React from 'react';
import { 
  ZoomIn, 
  RotateCw, 
  Clock, 
  Sparkles, 
  Trash2, 
  Copy, 
  ChevronLeft, 
  ChevronRight, 
  Crop,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Slide, FitMode, TransitionType } from '../types';
import { MOTION_PRESETS, TRANSITION_OPTIONS } from '../constants/defaults';

interface SlideEditorProps {
  slide: Slide | null;
  slideIndex: number;
  totalSlides: number;
  onUpdateSlide: (slideId: string, updates: Partial<Slide>) => void;
  onDeleteSlide: (slideId: string) => void;
  onDuplicateSlide: (slideId: string) => void;
  onMoveSlide: (index: number, direction: 'prev' | 'next') => void;
}

export const SlideEditor: React.FC<SlideEditorProps> = ({
  slide,
  slideIndex,
  totalSlides,
  onUpdateSlide,
  onDeleteSlide,
  onDuplicateSlide,
  onMoveSlide,
}) => {
  if (!slide) {
    return (
      <aside className="w-full lg:w-80 xl:w-96 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/50 p-6 flex flex-col items-center justify-center text-center text-slate-500 max-h-[45vh] lg:max-h-none lg:h-full">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-3 text-slate-400">
          <Layers className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-300">No slide selected</p>
        <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
          Click on any photo in the timeline below to customize its crop, tilt, zoom, and motion.
        </p>
      </aside>
    );
  }

  const { crop, motion, transition } = slide;

  const handleCropChange = (cropUpdates: Partial<typeof crop>) => {
    onUpdateSlide(slide.id, {
      crop: { ...crop, ...cropUpdates }
    });
  };

  const handleMotionChange = (motionUpdates: Partial<typeof motion>) => {
    onUpdateSlide(slide.id, {
      motion: { ...motion, ...motionUpdates }
    });
  };

  const handleTransitionChange = (transitionUpdates: Partial<typeof transition>) => {
    onUpdateSlide(slide.id, {
      transition: { ...transition, ...transitionUpdates }
    });
  };

  return (
    <aside className="w-full lg:w-80 xl:w-96 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col h-1/2 max-h-[48vh] lg:max-h-none lg:h-full overflow-y-auto">
      {/* Slide Navigation & Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/90 z-10 backdrop-blur-md">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
            Slide {slideIndex + 1} of {totalSlides}
          </span>
          <h3 className="text-sm font-bold text-slate-200">Adjust & Animate</h3>
        </div>

        {/* Quick Nav & Duplicate/Delete */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={slideIndex === 0}
            onClick={() => onMoveSlide(slideIndex, 'prev')}
            title="Move left"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={slideIndex === totalSlides - 1}
            onClick={() => onMoveSlide(slideIndex, 'next')}
            title="Move right"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-800 mx-1" />
          <button
            type="button"
            onClick={() => onDuplicateSlide(slide.id)}
            title="Duplicate slide"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteSlide(slide.id)}
            title="Delete slide"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* Fit & Framing Mode */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Crop className="w-3.5 h-3.5 text-indigo-400" /> Framing Mode
            </span>
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
            {(
              [
                { id: 'cover', label: 'Fill & Crop', desc: 'No borders' },
                { id: 'blur-fill', label: 'Blur Glow', desc: 'Smart blur' },
                { id: 'contain', label: 'Fit Inside', desc: 'Black bars' },
              ] as { id: FitMode; label: string; desc: string }[]
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleCropChange({ fitMode: mode.id })}
                className={`py-2 px-1 text-center rounded-lg transition-all ${
                  crop.fitMode === mode.id
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="text-[11px] leading-none">{mode.label}</div>
                <div className="text-[9px] text-slate-400/90 mt-0.5">{mode.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Zoom & Tilt Controls */}
        <div className="space-y-3.5 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <ZoomIn className="w-3.5 h-3.5 text-indigo-400" /> Zoom & Focus
            </span>
            <button
              type="button"
              onClick={() => handleCropChange({ scale: 1.0, x: 0, y: 0, rotation: 0 })}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Reset
            </button>
          </div>

          {/* Scale Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Zoom Scale</span>
              <span className="font-mono text-slate-200">{crop.scale.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.05"
              value={crop.scale}
              onChange={(e) => handleCropChange({ scale: parseFloat(e.target.value) })}
              className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Tilt / Rotation */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <RotateCw className="w-3 h-3 text-slate-400" /> Tilt / Angle
              </span>
              <span className="font-mono text-slate-200">{crop.rotation}°</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="-45"
                max="45"
                step="1"
                value={crop.rotation}
                onChange={(e) => handleCropChange({ rotation: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <button
                type="button"
                onClick={() => handleCropChange({ rotation: (crop.rotation + 90) % 360 })}
                title="Rotate 90 degrees"
                className="p-1 px-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-[10px] font-semibold text-slate-200 shrink-0"
              >
                +90°
              </button>
            </div>
          </div>

          {/* Focus Offset X & Y */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-700/50">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Pan X</span>
                <span className="font-mono">{crop.x}%</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={crop.x}
                onChange={(e) => handleCropChange({ x: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Pan Y</span>
                <span className="font-mono">{crop.y}%</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={crop.y}
                onChange={(e) => handleCropChange({ y: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Ken Burns Animation Motion Preset */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Ken Burns Motion
            </span>
            <span className="text-[10px] text-slate-500">Camera move</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {MOTION_PRESETS.map((m) => {
              const active = motion.type === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleMotionChange({ type: m.id })}
                  className={`px-2.5 py-2 rounded-xl text-left border text-xs font-medium transition-all ${
                    active
                      ? 'bg-indigo-600/20 border-indigo-500/60 text-indigo-200 ring-1 ring-indigo-500/30'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <div className="truncate font-semibold">{m.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Transition to Next Slide */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" /> Next Transition
            </span>
          </label>
          <div className="space-y-1.5">
            <select
              value={transition.type}
              onChange={(e) => handleTransitionChange({ type: e.target.value as TransitionType })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {TRANSITION_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} - {t.description}
                </option>
              ))}
            </select>

            <div className="flex justify-between items-center text-[10px] text-slate-400 px-1 pt-1">
              <span>Transition Speed</span>
              <span className="font-mono text-slate-200">{transition.duration.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="1.5"
              step="0.1"
              value={transition.duration}
              onChange={(e) => handleTransitionChange({ duration: parseFloat(e.target.value) })}
              className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Slide Duration */}
        <div className="space-y-2 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> Slide Duration
            </span>
            <span className="font-mono text-indigo-400 font-bold">{slide.duration.toFixed(1)}s</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="8.0"
            step="0.5"
            value={slide.duration}
            onChange={(e) => onUpdateSlide(slide.id, { duration: parseFloat(e.target.value) })}
            className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between gap-1 pt-1">
            {[2, 3, 4, 5].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => onUpdateSlide(slide.id, { duration: sec })}
                className={`flex-1 py-1 text-[10px] font-semibold rounded-lg border transition ${
                  slide.duration === sec
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
