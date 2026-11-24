import { AspectRatio, ProjectSettings, TransitionType, MotionType } from '../types';

export const ASPECT_RATIOS: Record<AspectRatio, { label: string; ratio: number; width: number; height: number; icon: string }> = {
  '9:16': { label: '9:16 (Story/Reel)', ratio: 9 / 16, width: 1080, height: 1920, icon: 'smartphone' },
  '16:9': { label: '16:9 (Landscape)', ratio: 16 / 9, width: 1920, height: 1080, icon: 'monitor' },
  '1:1': { label: '1:1 (Square)', ratio: 1, width: 1080, height: 1080, icon: 'square' },
  '4:5': { label: '4:5 (Portrait)', ratio: 4 / 5, width: 1080, height: 1350, icon: 'tablet' },
};

export const DEFAULT_SETTINGS: ProjectSettings = {
  aspectRatio: '9:16',
  resolution: { width: 1080, height: 1920 },
  defaultSlideDuration: 3.5,
  defaultTransition: 'fade',
  fps: 30,
};

export const TRANSITION_OPTIONS: { id: TransitionType; label: string; description: string }[] = [
  { id: 'fade', label: 'Cross Fade', description: 'Smooth cinematic blend between photos' },
  { id: 'dissolve', label: 'Film Dissolve', description: 'Soft subtle color dissolve' },
  { id: 'slide-left', label: 'Slide Left', description: 'Modern clean horizontal push' },
  { id: 'slide-right', label: 'Slide Right', description: 'Horizontal push to right' },
  { id: 'slide-up', label: 'Slide Up', description: 'Vertical reveal upwards' },
  { id: 'zoom-in', label: 'Zoom Punch', description: 'Dynamic zoom into the next frame' },
  { id: 'zoom-out', label: 'Zoom Out', description: 'Camera pulling back into next frame' },
  { id: 'wipe-left', label: 'Wipe Cut', description: 'Crisp linear directional wipe' },
  { id: 'circle-open', label: 'Circle Reveal', description: 'Iris circle expanding from center' },
];

export const MOTION_PRESETS: { id: MotionType; label: string; icon: string }[] = [
  { id: 'none', label: 'Static', icon: 'Pause' },
  { id: 'zoom-in', label: 'Slow Zoom In', icon: 'ZoomIn' },
  { id: 'zoom-out', label: 'Slow Zoom Out', icon: 'ZoomOut' },
  { id: 'pan-left', label: 'Pan Left', icon: 'ArrowLeft' },
  { id: 'pan-right', label: 'Pan Right', icon: 'ArrowRight' },
  { id: 'pan-up', label: 'Pan Up', icon: 'ArrowUp' },
  { id: 'pan-down', label: 'Pan Down', icon: 'ArrowDown' },
];

// High quality royalty-free sample photos from Unsplash for instant testing
export const SAMPLE_PHOTOS = [
  {
    title: 'Misty Alpine Mountains',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    width: 1200,
    height: 800,
  },
  {
    title: 'Golden Sunset Coast',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    width: 1200,
    height: 800,
  },
  {
    title: 'Emerald Forest Road',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
    width: 1200,
    height: 800,
  },
  {
    title: 'Neon Tokyo Streets',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    width: 1200,
    height: 800,
  },
];
