import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Sparkles,
} from 'lucide-react';
import { Slide, ProjectSettings } from '../types';
import { ASPECT_RATIOS } from '../constants/defaults';

interface PreviewPlayerProps {
  slides: Slide[];
  currentSlideIndex: number;
  settings: ProjectSettings;
  onSelectSlide: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackProgress: number; // 0.0 to 1.0 of current slide
  currentTime: number;
  totalDuration: number;
}

export const PreviewPlayer: React.FC<PreviewPlayerProps> = ({
  slides,
  currentSlideIndex,
  settings,
  onSelectSlide,
  isPlaying,
  onTogglePlay,
  playbackProgress,
  currentTime,
  totalDuration,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const safeIndex = Math.min(Math.max(0, currentSlideIndex), Math.max(0, slides.length - 1));
  const currentSlide = slides[safeIndex] || slides[0] || null;
  const nextSlide = slides[(safeIndex + 1) % slides.length] || currentSlide;
  const aspectConfig = ASPECT_RATIOS[settings.aspectRatio] || ASPECT_RATIOS['9:16'];

  // Measure container dimensions with ResizeObserver to ensure video box never collapses to 0x0
  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Compute exact box width and height to fit inside viewport while preserving aspect ratio
  const targetRatio = aspectConfig.width / aspectConfig.height;
  const availW = Math.max(140, (containerSize.width > 0 ? containerSize.width : 360) - 24);
  const availH = Math.max(140, (containerSize.height > 0 ? containerSize.height : 480) - 24);

  let boxW = availW;
  let boxH = availW / targetRatio;

  if (boxH > availH) {
    boxH = availH;
    boxW = availH * targetRatio;
  }

  // Calculate motion transform based on current playback progress
  const getMotionTransform = (slide?: Slide, progress: number = 0) => {
    if (!slide) return { scale: 1, translateX: 0, translateY: 0, rotate: 0 };
    
    const baseScale = slide.crop.scale;
    const baseRot = slide.crop.rotation;
    const baseX = slide.crop.x;
    const baseY = slide.crop.y;

    let dynamicScale = baseScale;
    let dynamicX = baseX;
    let dynamicY = baseY;

    const intensity = slide.motion.intensity || 1.15;
    const motionDelta = (intensity - 1.0) * progress;

    switch (slide.motion.type) {
      case 'zoom-in':
        dynamicScale = baseScale * (1.0 + motionDelta);
        break;
      case 'zoom-out':
        dynamicScale = baseScale * (intensity - motionDelta);
        break;
      case 'pan-left':
        dynamicX = baseX - progress * 10;
        break;
      case 'pan-right':
        dynamicX = baseX + progress * 10;
        break;
      case 'pan-up':
        dynamicY = baseY - progress * 10;
        break;
      case 'pan-down':
        dynamicY = baseY + progress * 10;
        break;
      case 'none':
      default:
        break;
    }

    return {
      scale: dynamicScale,
      translateX: dynamicX,
      translateY: dynamicY,
      rotate: baseRot,
    };
  };

  const transformA = getMotionTransform(currentSlide, isPlaying ? playbackProgress : 0);
  const transformB = getMotionTransform(nextSlide, 0);

  // Transition calculation during playback
  const slideDuration = currentSlide?.duration || 3.0;
  const transDuration = Math.min(currentSlide?.transition.duration || 0.8, slideDuration * 0.45);
  const transStartProgress = (slideDuration - transDuration) / slideDuration;

  const isTransitioning = isPlaying && playbackProgress >= transStartProgress && slides.length > 1;
  const transProgress = isTransitioning 
    ? Math.min(1.0, (playbackProgress - transStartProgress) / (1.0 - transStartProgress))
    : 0;

  // Compute CSS transition styles
  const getTransitionStyles = () => {
    if (!isTransitioning || !currentSlide) {
      return {
        slideA: {},
        slideB: { display: 'none' },
      };
    }

    const tType = currentSlide.transition.type;
    const p = transProgress;

    switch (tType) {
      case 'slide-left':
        return {
          slideA: { transform: `translate3d(${-p * 100}%, 0, 0)` },
          slideB: { transform: `translate3d(${(1 - p) * 100}%, 0, 0)` },
        };
      case 'slide-right':
        return {
          slideA: { transform: `translate3d(${p * 100}%, 0, 0)` },
          slideB: { transform: `translate3d(${-(1 - p) * 100}%, 0, 0)` },
        };
      case 'slide-up':
        return {
          slideA: { transform: `translate3d(0, ${-p * 100}%, 0)` },
          slideB: { transform: `translate3d(0, ${(1 - p) * 100}%, 0)` },
        };
      case 'zoom-in':
        return {
          slideA: { transform: `scale(${1 + p * 0.4})`, opacity: 1 - p },
          slideB: { transform: `scale(${0.8 + p * 0.2})`, opacity: p },
        };
      case 'zoom-out':
        return {
          slideA: { transform: `scale(${1 - p * 0.3})`, opacity: 1 - p },
          slideB: { transform: `scale(${1.2 - p * 0.2})`, opacity: p },
        };
      case 'wipe-left':
        return {
          slideA: {},
          slideB: { clipPath: `inset(0 0 0 ${(1 - p) * 100}%)` },
        };
      case 'circle-open':
        return {
          slideA: {},
          slideB: { clipPath: `circle(${p * 75}% at 50% 50%)` },
        };
      case 'fade':
      case 'dissolve':
      default:
        return {
          slideA: { opacity: 1 - p },
          slideB: { opacity: p },
        };
    }
  };

  const transitionStyles = getTransitionStyles();

  return (
    <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#080B11] overflow-hidden relative">
      {/* Viewport Area with Cinema Ambient Glow */}
      <div 
        ref={containerRef}
        className="flex-1 min-h-0 flex items-center justify-center p-3 sm:p-6 relative overflow-hidden select-none bg-[#090D15]"
      >
        {/* Soft Ambient Backdrop Glow matching the active photo */}
        {currentSlide && (
          <div 
            className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 pointer-events-none transition-all duration-700 scale-125"
            style={{ backgroundImage: `url(${currentSlide.imageUrl})` }}
          />
        )}

        {slides.length === 0 ? (
          <div className="text-center p-8 max-w-md z-10">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Your Stage is Empty</h3>
            <p className="text-sm text-slate-400">
              Upload your photos from your phone or laptop to create a video instantly.
            </p>
          </div>
        ) : (
          /* Aspect Ratio Box with exact calculated dimensions */
          <div 
            className="relative shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black flex items-center justify-center transition-all duration-150 shrink-0 z-10"
            style={{
              width: `${Math.round(boxW)}px`,
              height: `${Math.round(boxH)}px`,
            }}
          >
            {/* Current Slide A */}
            {currentSlide && (
              <div 
                className="absolute inset-0 flex items-center justify-center overflow-hidden transition-all duration-75"
                style={transitionStyles.slideA}
              >
                {/* Background Blur Fill Layer */}
                {currentSlide.crop.fitMode === 'blur-fill' && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center filter blur-xl scale-125 opacity-60 pointer-events-none"
                    style={{ backgroundImage: `url(${currentSlide.imageUrl})` }}
                  />
                )}

                {/* Primary Subject Image */}
                <img
                  src={currentSlide.imageUrl}
                  alt={currentSlide.id}
                  className={`select-none pointer-events-none transition-transform duration-75 ${
                    currentSlide.crop.fitMode === 'cover' 
                      ? 'w-full h-full object-cover' 
                      : currentSlide.crop.fitMode === 'contain'
                      ? 'max-w-full max-h-full object-contain'
                      : 'max-w-full max-h-full object-contain z-10 drop-shadow-2xl'
                  }`}
                  style={{
                    transform: `
                      translate(${transformA.translateX}%, ${transformA.translateY}%) 
                      scale(${transformA.scale}) 
                      rotate(${transformA.rotate}deg)
                    `,
                    transformOrigin: 'center center',
                  }}
                />
              </div>
            )}

            {/* Next Slide B (during transition) */}
            {isTransitioning && nextSlide && (
              <div 
                className="absolute inset-0 flex items-center justify-center overflow-hidden z-20"
                style={transitionStyles.slideB}
              >
                {/* Background Blur Fill Layer */}
                {nextSlide.crop.fitMode === 'blur-fill' && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center filter blur-xl scale-125 opacity-60 pointer-events-none"
                    style={{ backgroundImage: `url(${nextSlide.imageUrl})` }}
                  />
                )}

                <img
                  src={nextSlide.imageUrl}
                  alt={nextSlide.id}
                  className={`select-none pointer-events-none ${
                    nextSlide.crop.fitMode === 'cover' 
                      ? 'w-full h-full object-cover' 
                      : nextSlide.crop.fitMode === 'contain'
                      ? 'max-w-full max-h-full object-contain'
                      : 'max-w-full max-h-full object-contain z-10 drop-shadow-2xl'
                  }`}
                  style={{
                    transform: `
                      translate(${transformB.translateX}%, ${transformB.translateY}%) 
                      scale(${transformB.scale}) 
                      rotate(${transformB.rotate}deg)
                    `,
                    transformOrigin: 'center center',
                  }}
                />
              </div>
            )}

            {/* Overlay Badge for Current Motion */}
            {currentSlide && currentSlide.motion.type !== 'none' && (
              <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-slate-200 flex items-center gap-1 z-30">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>
                  {isTransitioning 
                    ? `transition: ${currentSlide.transition.type}` 
                    : currentSlide.motion.type.replace('-', ' ')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Playback Control Bar */}
      <div className="h-14 sm:h-16 border-t border-slate-800/80 bg-slate-900/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-3 z-20 shrink-0">
        {/* Scrubber & Current Slide info */}
        <div className="flex items-center gap-1.5 sm:gap-3 text-xs font-mono text-slate-400 min-w-[65px]">
          <span className="text-slate-200 font-semibold">{currentTime.toFixed(1)}s</span>
          <span className="text-slate-600">/</span>
          <span>{totalDuration.toFixed(1)}s</span>
        </div>

        {/* Center Transport Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            disabled={slides.length === 0 || currentSlideIndex === 0}
            onClick={() => onSelectSlide(Math.max(0, currentSlideIndex - 1))}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Previous Slide"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={slides.length === 0}
            onClick={onTogglePlay}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition shadow-lg ${
              isPlaying 
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            } disabled:opacity-30 disabled:hover:bg-indigo-600`}
            title={isPlaying ? "Pause" : "Play Preview"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            ) : (
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            disabled={slides.length === 0 || currentSlideIndex === slides.length - 1}
            onClick={() => onSelectSlide(Math.min(slides.length - 1, currentSlideIndex + 1))}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Next Slide"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Slide Progress Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-400">
            {slides.length > 0 ? `Photo ${currentSlideIndex + 1} of ${slides.length}` : '0 Photos'}
          </span>
        </div>
      </div>
    </div>
  );
};
