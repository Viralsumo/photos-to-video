export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5';

export type FitMode = 'cover' | 'contain' | 'blur-fill';

export type MotionType = 
  | 'none'
  | 'zoom-in'
  | 'zoom-out'
  | 'pan-left'
  | 'pan-right'
  | 'pan-up'
  | 'pan-down';

export type TransitionType = 
  | 'fade'
  | 'dissolve'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'zoom-in'
  | 'zoom-out'
  | 'wipe-left'
  | 'circle-open';

export interface SlideCrop {
  scale: number;       // 0.5 to 3.0 (default 1.0)
  x: number;           // offset percentage (-100 to 100)
  y: number;           // offset percentage (-100 to 100)
  rotation: number;    // degrees (-180 to 180, default 0)
  fitMode: FitMode;    // 'cover', 'contain', or 'blur-fill'
}

export interface SlideMotion {
  type: MotionType;
  intensity: number;   // 1.1 to 1.4 (default 1.2)
}

export interface SlideTransition {
  type: TransitionType;
  duration: number;    // in seconds (0.3 to 1.5, default 0.8)
}

export interface Slide {
  id: string;
  file?: File;
  imageUrl: string;
  originalWidth: number;
  originalHeight: number;
  duration: number;    // in seconds (e.g., 3.0)
  crop: SlideCrop;
  motion: SlideMotion;
  transition: SlideTransition;
}

export interface ProjectSettings {
  aspectRatio: AspectRatio;
  resolution: { width: number; height: number };
  defaultSlideDuration: number;
  defaultTransition: TransitionType;
  fps: number;
}

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  category: 'Cinematic' | 'Upbeat' | 'Lo-Fi' | 'Ambient' | 'Acoustic';
  duration: number;
  url: string;
}
