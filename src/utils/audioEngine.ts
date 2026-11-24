import { generateSyntheticTrackBuffer } from './soundSynthesizer';

/**
 * Web Audio Engine for real-time background soundtrack preview and export mixdown
 * Handles offline procedural synthesis, local audio files, and remote audio streams safely.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private bufferCache: Map<string, AudioBuffer> = new Map();
  public isPlaying: boolean = false;

  constructor() {
    // Lazy init AudioContext on user interaction
  }

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Load audio file or URL into decoded AudioBuffer
   */
  public async loadAudio(source: string | File): Promise<AudioBuffer> {
    const ctx = this.getContext();
    const cacheKey = typeof source === 'string' ? source : `file-${source.name}-${source.size}`;

    if (this.bufferCache.has(cacheKey)) {
      return this.bufferCache.get(cacheKey)!;
    }

    // 1. Procedural synthetic soundtrack (100% offline, zero network requests, zero CORS)
    if (typeof source === 'string' && (source.startsWith('synth://') || source.startsWith('synth-'))) {
      const trackId = source.replace('synth://', '');
      const audioBuffer = await generateSyntheticTrackBuffer(trackId, 45, ctx.sampleRate);
      this.bufferCache.set(cacheKey, audioBuffer);
      return audioBuffer;
    }

    // 2. User uploaded file or remote URL
    try {
      let arrayBuffer: ArrayBuffer;
      if (typeof source === 'string') {
        const resp = await fetch(source);
        if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
        arrayBuffer = await resp.arrayBuffer();
      } else {
        arrayBuffer = await source.arrayBuffer();
      }

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.bufferCache.set(cacheKey, audioBuffer);
      return audioBuffer;
    } catch (err) {
      console.warn('Audio loading failed, falling back to built-in synthetic track:', err);
      const fallback = await generateSyntheticTrackBuffer('synth-cinematic', 45, ctx.sampleRate);
      this.bufferCache.set(cacheKey, fallback);
      return fallback;
    }
  }

  /**
   * Play audio in sync with timeline
   */
  public async play(
    source: string | File,
    offset: number = 0,
    volume: number = 0.8,
    fade: boolean = true,
    totalDuration?: number
  ) {
    this.pause();

    try {
      const ctx = this.getContext();
      const buffer = await this.loadAudio(source);

      this.currentSource = ctx.createBufferSource();
      this.currentSource.buffer = buffer;
      this.currentSource.loop = true; // Loop audio if video is longer

      this.gainNode = ctx.createGain();
      
      // Apply volume & optional soft fade-in
      const now = ctx.currentTime;
      if (fade) {
        this.gainNode.gain.setValueAtTime(0, now);
        this.gainNode.gain.linearRampToValueAtTime(volume, now + 1.2);
        
        // Fade out at end if total duration is provided
        if (totalDuration && totalDuration > 3) {
          const remaining = totalDuration - offset;
          if (remaining > 1.5) {
            this.gainNode.gain.setValueAtTime(volume, now + remaining - 1.5);
            this.gainNode.gain.linearRampToValueAtTime(0.001, now + remaining);
          }
        }
      } else {
        this.gainNode.gain.setValueAtTime(volume, now);
      }

      this.currentSource.connect(this.gainNode);
      this.gainNode.connect(ctx.destination);

      const trackDuration = buffer.duration || 30;
      const safeOffset = Math.max(0, offset) % trackDuration;

      this.currentSource.start(0, safeOffset);
      this.isPlaying = true;
    } catch (e) {
      console.warn('Audio play failed or was blocked by browser policy:', e);
    }
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    }
  }

  public pause() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {
        // Ignored
      }
      this.currentSource = null;
    }
    this.isPlaying = false;
  }

  /**
   * Generate an exact mixed AudioBuffer trimmed/looped to total video duration with fade effects
   * Used for offline rendering with WebCodecs AudioEncoder
   */
  public async createMixdownBuffer(
    source: string | File,
    totalDuration: number,
    volume: number = 0.8,
    fade: boolean = true,
    sampleRate: number = 44100
  ): Promise<AudioBuffer> {
    // If synthetic, generate exact duration directly for maximum fidelity
    if (typeof source === 'string' && (source.startsWith('synth://') || source.startsWith('synth-'))) {
      const trackId = source.replace('synth://', '');
      const rawSynth = await generateSyntheticTrackBuffer(trackId, totalDuration, sampleRate);
      
      // Apply volume and fade envelope
      const offlineCtx = new OfflineAudioContext(2, rawSynth.length, sampleRate);
      const srcNode = offlineCtx.createBufferSource();
      srcNode.buffer = rawSynth;

      const gain = offlineCtx.createGain();
      gain.gain.setValueAtTime(volume, 0);

      if (fade && totalDuration > 3) {
        gain.gain.setValueAtTime(0, 0);
        gain.gain.linearRampToValueAtTime(volume, 1.2);
        gain.gain.setValueAtTime(volume, totalDuration - 1.5);
        gain.gain.linearRampToValueAtTime(0.001, totalDuration);
      }

      srcNode.connect(gain);
      gain.connect(offlineCtx.destination);
      srcNode.start(0, 0);

      return await offlineCtx.startRendering();
    }

    const originalBuffer = await this.loadAudio(source);
    const numberOfChannels = originalBuffer.numberOfChannels || 2;
    const totalSamples = Math.ceil(totalDuration * sampleRate);

    // Create an offline audio context to render the mix accurately
    const offlineCtx = new OfflineAudioContext(numberOfChannels, totalSamples, sampleRate);
    const sourceNode = offlineCtx.createBufferSource();
    sourceNode.buffer = originalBuffer;
    sourceNode.loop = true;

    const gainNode = offlineCtx.createGain();
    gainNode.gain.setValueAtTime(volume, 0);

    if (fade && totalDuration > 3) {
      gainNode.gain.setValueAtTime(0, 0);
      gainNode.gain.linearRampToValueAtTime(volume, 1.2);

      const fadeOutStart = totalDuration - 1.5;
      gainNode.gain.setValueAtTime(volume, fadeOutStart);
      gainNode.gain.linearRampToValueAtTime(0.001, totalDuration);
    }

    sourceNode.connect(gainNode);
    gainNode.connect(offlineCtx.destination);
    sourceNode.start(0, 0);

    return await offlineCtx.startRendering();
  }
}

export const globalAudioEngine = new AudioEngine();
