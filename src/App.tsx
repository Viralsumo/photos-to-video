import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { PreviewPlayer } from './components/PreviewPlayer';
import { SlideEditor } from './components/SlideEditor';
import { Timeline } from './components/Timeline';
import { SimpleActionDock } from './components/SimpleActionDock';
import { UploadModal } from './components/UploadModal';
import { MusicModal } from './components/MusicModal';
import { ExportModal } from './components/ExportModal';
import { Slide, ProjectSettings, TransitionType, MotionType, AudioTrack } from './types';
import { DEFAULT_SETTINGS, SAMPLE_PHOTOS, TRANSITION_OPTIONS } from './constants/defaults';
import { MUSIC_LIBRARY } from './constants/music';
import { globalAudioEngine } from './utils/audioEngine';

export function App() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ProjectSettings>(DEFAULT_SETTINGS);
  
  // UI Mode: 'simple' for 1-click magic preview & export, 'advanced' for deep editing
  const [uiMode, setUiMode] = useState<'simple' | 'advanced'>('simple');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isMusicOpen, setIsMusicOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Audio track state (default to first synthetic track)
  const [audioTrack, setAudioTrack] = useState<AudioTrack | null>(MUSIC_LIBRARY[0]);
  const [audioVolume, setAudioVolume] = useState<number>(0.8);
  const [autoFadeAudio, setAutoFadeAudio] = useState<boolean>(true);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [slideProgress, setSlideProgress] = useState<number>(0); // 0.0 to 1.0
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Animation frame reference
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const slideElapsedRef = useRef<number>(0);

  // Calculate total project duration
  const totalDuration = slides.reduce((acc, slide) => acc + slide.duration, 0);

  // Selected slide object and index
  const selectedIndex = slides.findIndex((s) => s.id === selectedSlideId);
  const activeSlideIndex = selectedIndex >= 0 ? selectedIndex : currentSlideIndex;
  const currentSlide = slides[activeSlideIndex] || null;

  // Sync Audio playback with slideshow state (ONLY triggers on play/pause or track switch, NEVER per-frame!)
  useEffect(() => {
    if (isPlaying && audioTrack) {
      globalAudioEngine.play(
        audioTrack.url,
        currentTime,
        audioVolume,
        autoFadeAudio,
        totalDuration
      );
    } else {
      globalAudioEngine.pause();
    }
    return () => {
      globalAudioEngine.pause();
    };
  }, [isPlaying, audioTrack]);

  const handleVolumeChange = (vol: number) => {
    setAudioVolume(vol);
    globalAudioEngine.setVolume(vol);
  };

  const handleSelectTrack = (track: AudioTrack | null) => {
    setAudioTrack(track);
    if (track) {
      // Play 4-second instant audio preview snippet so the user immediately hears the distinct track!
      globalAudioEngine.play(track.url, 0, audioVolume, false, totalDuration);
      if (!isPlaying) {
        setTimeout(() => {
          // If still paused after 4s preview snippet, pause the audio
          globalAudioEngine.pause();
        }, 4000);
      }
    } else {
      globalAudioEngine.pause();
    }
  };

  const handleCustomAudioUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    const customTrack: AudioTrack = {
      id: `custom-audio-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'Custom Upload',
      category: 'Acoustic',
      duration: 180,
      url: url,
    };
    setAudioTrack(customTrack);
  };

  // Sync selected slide index to preview index when not playing
  const handleSelectSlideById = (id: string) => {
    setSelectedSlideId(id);
    const idx = slides.findIndex((s) => s.id === id);
    if (idx !== -1) {
      setCurrentSlideIndex(idx);
      setSlideProgress(0);
      slideElapsedRef.current = 0;
      updateCurrentTimeFromSlide(idx, 0);
      if (isPlaying && audioTrack) {
        let sum = 0;
        for (let i = 0; i < idx; i++) sum += slides[i].duration;
        globalAudioEngine.play(audioTrack.url, sum, audioVolume, autoFadeAudio, totalDuration);
      }
    }
  };

  const handleSelectSlideByIndex = (index: number) => {
    if (index >= 0 && index < slides.length) {
      setSelectedSlideId(slides[index].id);
      setCurrentSlideIndex(index);
      setSlideProgress(0);
      slideElapsedRef.current = 0;
      updateCurrentTimeFromSlide(index, 0);
      if (isPlaying && audioTrack) {
        let sum = 0;
        for (let i = 0; i < index; i++) sum += slides[i].duration;
        globalAudioEngine.play(audioTrack.url, sum, audioVolume, autoFadeAudio, totalDuration);
      }
    }
  };

  const updateCurrentTimeFromSlide = (targetIndex: number, elapsedInSlide: number) => {
    let sum = 0;
    for (let i = 0; i < targetIndex; i++) {
      sum += slides[i].duration;
    }
    setCurrentTime(sum + elapsedInSlide);
  };

  // Playback loop
  useEffect(() => {
    if (!isPlaying || slides.length === 0) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastTimeRef.current = null;
      return;
    }

    const tick = (now: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
      }

      const delta = (now - lastTimeRef.current) / 1000; // in seconds
      lastTimeRef.current = now;

      slideElapsedRef.current += delta;
      const thisSlide = slides[currentSlideIndex];
      const duration = thisSlide ? thisSlide.duration : 3.0;

      if (slideElapsedRef.current >= duration) {
        // Move to next slide or loop
        slideElapsedRef.current = 0;
        const nextIndex = (currentSlideIndex + 1) % slides.length;
        setCurrentSlideIndex(nextIndex);
        setSelectedSlideId(slides[nextIndex].id);
        setSlideProgress(0);
        updateCurrentTimeFromSlide(nextIndex, 0);
      } else {
        const prog = Math.min(1.0, slideElapsedRef.current / duration);
        setSlideProgress(prog);
        updateCurrentTimeFromSlide(currentSlideIndex, slideElapsedRef.current);
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, currentSlideIndex, slides]);

  const togglePlay = () => {
    if (slides.length === 0) return;
    setIsPlaying((prev) => !prev);
  };

  // Load sample photos
  const handleLoadSamples = useCallback(() => {
    const motions: MotionType[] = ['zoom-in', 'pan-right', 'zoom-out', 'pan-left'];
    const sampleSlides: Slide[] = SAMPLE_PHOTOS.map((sample, idx) => ({
      id: `sample-${idx}-${Date.now()}`,
      imageUrl: sample.url,
      originalWidth: sample.width,
      originalHeight: sample.height,
      duration: DEFAULT_SETTINGS.defaultSlideDuration,
      crop: {
        scale: 1.0,
        x: 0,
        y: 0,
        rotation: 0,
        fitMode: 'cover',
      },
      motion: {
        type: motions[idx % motions.length],
        intensity: 1.2,
      },
      transition: {
        type: TRANSITION_OPTIONS[idx % TRANSITION_OPTIONS.length].id,
        duration: 0.8,
      },
    }));

    setSlides(sampleSlides);
    setSelectedSlideId(sampleSlides[0].id);
    setCurrentSlideIndex(0);
    setSlideProgress(0);
    slideElapsedRef.current = 0;
  }, []);

  // Auto-load sample photos on initial boot if empty
  useEffect(() => {
    if (slides.length === 0) {
      handleLoadSamples();
    }
  }, [handleLoadSamples]);

  // Slide CRUD handlers (Smart photo replacement for non-tech users)
  const handleAddSlides = (newSlides: Slide[]) => {
    if (newSlides.length === 0) return;

    setSlides((prev) => {
      // If currently holding only the default sample photos, replace them with user photos
      const isOnlySamplePhotos = prev.length > 0 && prev.every((s) => s.id.startsWith('sample-'));
      if (isOnlySamplePhotos) {
        return newSlides;
      }
      return [...prev, ...newSlides];
    });

    setSelectedSlideId(newSlides[0].id);
    setCurrentSlideIndex(0);
    setSlideProgress(0);
    slideElapsedRef.current = 0;
    setCurrentTime(0);

    // Auto start playing preview with newly uploaded photos
    setIsPlaying(true);
  };

  const handleUpdateSlide = (slideId: string, updates: Partial<Slide>) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === slideId ? { ...s, ...updates } : s))
    );
  };

  const handleDeleteSlide = (slideId: string) => {
    setSlides((prev) => {
      const idx = prev.findIndex((s) => s.id === slideId);
      const filtered = prev.filter((s) => s.id !== slideId);
      if (filtered.length > 0) {
        const newIdx = Math.min(idx, filtered.length - 1);
        setSelectedSlideId(filtered[newIdx].id);
        setCurrentSlideIndex(newIdx);
      } else {
        setSelectedSlideId(null);
        setCurrentSlideIndex(0);
        setIsPlaying(false);
      }
      return filtered;
    });
  };

  const handleDuplicateSlide = (slideId: string) => {
    const idx = slides.findIndex((s) => s.id === slideId);
    if (idx === -1) return;
    const target = slides[idx];
    const cloned: Slide = {
      ...target,
      id: `slide-copy-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      crop: { ...target.crop },
      motion: { ...target.motion },
      transition: { ...target.transition },
    };
    const nextList = [...slides];
    nextList.splice(idx + 1, 0, cloned);
    setSlides(nextList);
    setSelectedSlideId(cloned.id);
    setCurrentSlideIndex(idx + 1);
  };

  const handleMoveSlide = (fromIndex: number, direction: 'prev' | 'next') => {
    const toIndex = direction === 'prev' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= slides.length) return;
    handleReorderSlides(fromIndex, toIndex);
  };

  const handleReorderSlides = (oldIndex: number, newIndex: number) => {
    setSlides((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(oldIndex, 1);
      copy.splice(newIndex, 0, moved);
      return copy;
    });
    setCurrentSlideIndex(newIndex);
  };

  const handleUpdateTransition = (slideId: string, transitionType: TransitionType) => {
    handleUpdateSlide(slideId, {
      transition: {
        type: transitionType,
        duration: 0.8,
      },
    });
  };

  // Magic Cinematic Auto-Motion
  const handleRandomizeMotions = () => {
    if (slides.length === 0) return;
    const motionPool: MotionType[] = ['zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'pan-up', 'pan-down'];
    const transitionPool: TransitionType[] = ['fade', 'dissolve', 'slide-left', 'slide-right', 'zoom-in', 'circle-open'];
    
    setSlides((prev) =>
      prev.map((s, idx) => ({
        ...s,
        motion: {
          type: motionPool[idx % motionPool.length],
          intensity: 1.25,
        },
        transition: {
          type: transitionPool[idx % transitionPool.length],
          duration: 0.8,
        },
      }))
    );

    // Restart preview from beginning with new motions
    setCurrentSlideIndex(0);
    if (slides.length > 0) {
      setSelectedSlideId(slides[0].id);
    }
    setSlideProgress(0);
    slideElapsedRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(true);
    if (audioTrack) {
      globalAudioEngine.play(audioTrack.url, 0, audioVolume, autoFadeAudio, totalDuration);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full min-h-[100dvh] bg-[#0B0F17] text-slate-100 overflow-hidden overflow-x-hidden font-sans select-none">
      {/* Top Navigation & Project Bar */}
      <Header
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings((s) => ({ ...s, ...newSettings }))}
        totalDuration={totalDuration}
        slideCount={slides.length}
        onOpenUpload={() => setIsUploadOpen(true)}
        onLoadSamples={handleLoadSamples}
        onExportClick={() => setIsExportOpen(true)}
        selectedTrack={audioTrack}
        onOpenMusic={() => setIsMusicOpen(true)}
        uiMode={uiMode}
        onToggleMode={setUiMode}
      />

      {/* Main Workspace */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Real-time Visual Preview Canvas with guaranteed visible height */}
        <div className="flex-1 min-h-[280px] lg:min-h-0 flex flex-col overflow-hidden relative">
          <PreviewPlayer
            slides={slides}
            currentSlideIndex={activeSlideIndex}
            settings={settings}
            onSelectSlide={handleSelectSlideByIndex}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            playbackProgress={slideProgress}
            currentTime={currentTime}
            totalDuration={totalDuration}
          />
        </div>

        {/* Slide Inspector (Only visible in Advanced Mode) */}
        {uiMode === 'advanced' && (
          <SlideEditor
            slide={currentSlide}
            slideIndex={activeSlideIndex}
            totalSlides={slides.length}
            onUpdateSlide={handleUpdateSlide}
            onDeleteSlide={handleDeleteSlide}
            onDuplicateSlide={handleDuplicateSlide}
            onMoveSlide={handleMoveSlide}
          />
        )}
      </div>

      {/* Mode-Specific Bottom Controls */}
      {uiMode === 'simple' ? (
        /* Simple Non-Tech User Action Dock with Visual Photo Strip */
        <SimpleActionDock
          slides={slides}
          activeSlideIndex={activeSlideIndex}
          onSelectSlide={handleSelectSlideByIndex}
          onDeleteSlide={handleDeleteSlide}
          onOpenUpload={() => setIsUploadOpen(true)}
          onMagicCreate={handleRandomizeMotions}
          onExportClick={() => setIsExportOpen(true)}
          selectedTrack={audioTrack}
          onSelectTrack={handleSelectTrack}
          onSwitchToAdvanced={() => setUiMode('advanced')}
        />
      ) : (
        /* Full Storyboard Timeline with Drag & Drop Reordering */
        <Timeline
          slides={slides}
          selectedSlideId={selectedSlideId}
          onSelectSlide={handleSelectSlideById}
          onReorderSlides={handleReorderSlides}
          onDeleteSlide={handleDeleteSlide}
          onOpenUpload={() => setIsUploadOpen(true)}
          onUpdateTransition={handleUpdateTransition}
          onRandomizeMotions={handleRandomizeMotions}
        />
      )}

      {/* Modal: Photo Upload Dialog */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAddSlides={handleAddSlides}
        onLoadSamples={handleLoadSamples}
      />

      {/* Modal: Music Library & Audio Mixer */}
      <MusicModal
        isOpen={isMusicOpen}
        onClose={() => setIsMusicOpen(false)}
        selectedTrack={audioTrack}
        onSelectTrack={handleSelectTrack}
        volume={audioVolume}
        onVolumeChange={handleVolumeChange}
        autoFade={autoFadeAudio}
        onToggleAutoFade={setAutoFadeAudio}
        onCustomAudioUpload={handleCustomAudioUpload}
      />

      {/* Modal: Hardware Accelerated MP4 Export */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        slides={slides}
        settings={settings}
        audioTrack={audioTrack}
        audioVolume={audioVolume}
        autoFadeAudio={autoFadeAudio}
        onOpenMusicModal={() => {
          setIsExportOpen(false);
          setIsMusicOpen(true);
        }}
      />
    </div>
  );
}

export default App;
