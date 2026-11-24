import { AudioTrack } from '../types';
import { BUILTIN_TRACKS } from '../utils/soundSynthesizer';

export const MUSIC_LIBRARY: AudioTrack[] = BUILTIN_TRACKS.map((t) => ({
  id: t.id,
  title: t.title,
  artist: t.artist,
  category: t.category,
  duration: t.duration,
  url: `synth://${t.id}`,
}));
