import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { Slide, ProjectSettings, AudioTrack } from '../types';
import { drawSlideFrame } from './canvasRenderer';
import { WebGLTransitionRenderer } from './transitionRenderer';
import { globalAudioEngine } from './audioEngine';
import { preloadImage } from './exif';

export interface ExportProgress {
  phase: 'preparing' | 'rendering' | 'encoding-audio' | 'muxing' | 'completed' | 'error';
  progress: number; // 0 to 100
  message: string;
}

export async function exportSlideshowToMp4(
  slides: Slide[],
  settings: ProjectSettings,
  audioTrack: AudioTrack | null,
  audioVolume: number,
  autoFadeAudio: boolean,
  onProgress: (progress: ExportProgress) => void
): Promise<Blob> {
  if (slides.length === 0) {
    throw new Error('No slides to export');
  }

  onProgress({
    phase: 'preparing',
    progress: 5,
    message: 'Preloading high-resolution images...',
  });

  // 1. Preload all slide images
  const loadedImages: HTMLImageElement[] = [];
  for (let i = 0; i < slides.length; i++) {
    const img = await preloadImage(slides[i].imageUrl);
    loadedImages.push(img);
    onProgress({
      phase: 'preparing',
      progress: 5 + Math.round(((i + 1) / slides.length) * 15),
      message: `Loaded image ${i + 1} of ${slides.length}...`,
    });
  }

  const { width, height } = settings.resolution;
  const fps = settings.fps || 30;
  const totalDuration = slides.reduce((acc, s) => acc + s.duration, 0);
  const totalFrames = Math.ceil(totalDuration * fps);
  const frameDurationMicros = Math.round((1 / fps) * 1_000_000);

  // 2. Prepare Audio Mixdown if track is selected
  let audioBuffer: AudioBuffer | null = null;
  if (audioTrack) {
    onProgress({
      phase: 'encoding-audio',
      progress: 22,
      message: 'Mixing background soundtrack and applying fade...',
    });
    try {
      audioBuffer = await globalAudioEngine.createMixdownBuffer(
        audioTrack.url,
        totalDuration,
        audioVolume,
        autoFadeAudio,
        44100
      );
    } catch (err) {
      console.warn('Audio mixdown failed, exporting video without audio:', err);
    }
  }

  // 3. Setup Canvases
  const canvasA = document.createElement('canvas');
  canvasA.width = width;
  canvasA.height = height;
  const ctxA = canvasA.getContext('2d', { willReadFrequently: false })!;

  const canvasB = document.createElement('canvas');
  canvasB.width = width;
  canvasB.height = height;
  const ctxB = canvasB.getContext('2d', { willReadFrequently: false })!;

  const renderCanvas = document.createElement('canvas');
  renderCanvas.width = width;
  renderCanvas.height = height;
  const transitionRenderer = new WebGLTransitionRenderer(renderCanvas);

  // Master output 2D canvas that VideoFrame safely sources from
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const outputCtx = outputCanvas.getContext('2d', { willReadFrequently: false })!;

  // 4. Check WebCodecs availability
  const hasWebCodecs = typeof window.VideoEncoder !== 'undefined';

  if (!hasWebCodecs) {
    throw new Error('Your browser does not support hardware WebCodecs video encoding. Please use modern Chrome, Safari, or Edge.');
  }

  // 5. Initialize MP4 Muxer
  const muxerTarget = new ArrayBufferTarget();
  const muxer = new Muxer({
    target: muxerTarget,
    video: {
      codec: 'avc',
      width,
      height,
    },
    audio: audioBuffer ? {
      codec: 'aac',
      numberOfChannels: audioBuffer.numberOfChannels,
      sampleRate: audioBuffer.sampleRate,
    } : undefined,
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });

  // Check supported H.264 profile
  let selectedCodec = 'avc1.4d002a';
  try {
    const configCheck = await VideoEncoder.isConfigSupported({
      codec: 'avc1.4d002a',
      width,
      height,
      bitrate: 4_500_000,
      framerate: fps,
    });
    if (!configCheck.supported) {
      selectedCodec = 'avc1.42001f'; // Baseline profile fallback for mobile webviews
    }
  } catch {
    selectedCodec = 'avc1.42001f';
  }

  // 6. Setup VideoEncoder
  let videoEncoderError: Error | null = null;
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => {
      console.error('VideoEncoder error:', e);
      videoEncoderError = e;
    },
  });

  videoEncoder.configure({
    codec: selectedCodec,
    width,
    height,
    bitrate: Math.min(6_000_000, Math.max(2_500_000, width * height * 2)),
    framerate: fps,
  });

  // 7. Render Video Frames
  onProgress({
    phase: 'rendering',
    progress: 25,
    message: 'Rendering cinematic video frames with hardware acceleration...',
  });

  // Pre-calculate slide start and end times
  const slideTimings = slides.map((slide, idx) => {
    let start = 0;
    for (let i = 0; i < idx; i++) start += slides[i].duration;
    return {
      index: idx,
      slide,
      image: loadedImages[idx],
      start,
      end: start + slide.duration,
      duration: slide.duration,
      transitionDuration: Math.min(slide.transition.duration, slide.duration * 0.4),
    };
  });

  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    if (videoEncoderError) throw videoEncoderError;

    const currentTime = frameIndex / fps;
    const timestampMicros = Math.round(frameIndex * frameDurationMicros);

    // Find current active slide
    let currentTiming = slideTimings.find(
      (t) => currentTime >= t.start && currentTime < t.end
    );
    if (!currentTiming) {
      currentTiming = slideTimings[slideTimings.length - 1];
    }

    const elapsedInSlide = currentTime - currentTiming.start;
    const slideProgress = Math.min(1.0, elapsedInSlide / currentTiming.duration);

    // Check if within transition to next slide
    const isTransitioning = 
      currentTiming.index < slideTimings.length - 1 &&
      elapsedInSlide >= currentTiming.duration - currentTiming.transitionDuration;

    if (isTransitioning) {
      const nextTiming = slideTimings[currentTiming.index + 1];
      const transElapsed = elapsedInSlide - (currentTiming.duration - currentTiming.transitionDuration);
      const transProgress = Math.min(1.0, transElapsed / currentTiming.transitionDuration);

      // Draw current slide to Canvas A
      drawSlideFrame(ctxA, currentTiming.image, currentTiming.slide, slideProgress, width, height);

      // Draw next slide to Canvas B at start
      const nextSlideProgress = (transElapsed / nextTiming.duration);
      drawSlideFrame(ctxB, nextTiming.image, nextTiming.slide, nextSlideProgress, width, height);

      let webglSucceeded = false;
      if (transitionRenderer.isReady()) {
        try {
          transitionRenderer.render(
            canvasA,
            canvasB,
            currentTiming.slide.transition.type,
            transProgress,
            width,
            height
          );
          outputCtx.clearRect(0, 0, width, height);
          outputCtx.drawImage(renderCanvas, 0, 0);
          webglSucceeded = true;
        } catch (glErr) {
          console.warn('WebGL transition render failed, using 2D canvas blend:', glErr);
        }
      }

      // High-performance 2D canvas blend fallback if WebGL was unavailable or lost
      if (!webglSucceeded) {
        outputCtx.clearRect(0, 0, width, height);
        outputCtx.globalAlpha = 1.0;
        outputCtx.drawImage(canvasA, 0, 0);
        outputCtx.globalAlpha = transProgress;
        outputCtx.drawImage(canvasB, 0, 0);
        outputCtx.globalAlpha = 1.0;
      }
    } else {
      // Draw single slide directly onto master output canvas
      outputCtx.clearRect(0, 0, width, height);
      drawSlideFrame(outputCtx, currentTiming.image, currentTiming.slide, slideProgress, width, height);
    }

    // Hardware encoder backpressure control: ensure queue stays <= 4 frames on mobile chips
    while (videoEncoder.encodeQueueSize > 4) {
      await new Promise<void>((resolve) => {
        const handler = () => {
          videoEncoder.removeEventListener('dequeue', handler);
          resolve();
        };
        videoEncoder.addEventListener('dequeue', handler);
        setTimeout(handler, 8);
      });
    }

    // Construct VideoFrame safely with ImageBitmap fallback for mobile compatibility
    let videoFrame: VideoFrame;
    try {
      videoFrame = new VideoFrame(outputCanvas, {
        timestamp: timestampMicros,
        duration: frameDurationMicros,
      });
    } catch {
      // Mobile fallback: Snapshot to an immutable ImageBitmap if direct canvas source is rejected
      const snapshot = await createImageBitmap(outputCanvas);
      videoFrame = new VideoFrame(snapshot, {
        timestamp: timestampMicros,
        duration: frameDurationMicros,
      });
      snapshot.close();
    }

    try {
      const isKeyFrame = frameIndex % (fps * 2) === 0;
      videoEncoder.encode(videoFrame, { keyFrame: isKeyFrame });
    } finally {
      videoFrame.close();
    }

    // Periodic UI loop yield & progress notification
    if (frameIndex % 10 === 0 || frameIndex === totalFrames - 1) {
      const pct = 25 + Math.round((frameIndex / totalFrames) * 60);
      onProgress({
        phase: 'rendering',
        progress: pct,
        message: `Encoded frame ${frameIndex + 1} of ${totalFrames} (${Math.round((frameIndex / totalFrames) * 100)}%)...`,
      });
      // Yield to allow garbage collection and prevent UI freeze on mobile
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  // 8. Encode Audio if present
  if (audioBuffer && typeof window.AudioEncoder !== 'undefined') {
    onProgress({
      phase: 'encoding-audio',
      progress: 88,
      message: 'Encoding synchronized AAC soundtrack...',
    });

    try {
      const audioEncoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: (e) => console.error('AudioEncoder error:', e),
      });

      audioEncoder.configure({
        codec: 'mp4a.40.2',
        numberOfChannels: audioBuffer.numberOfChannels,
        sampleRate: audioBuffer.sampleRate,
        bitrate: 128_000,
      });

      // Split audioBuffer into discrete AudioData chunks
      const sampleRate = audioBuffer.sampleRate;
      const numChannels = audioBuffer.numberOfChannels;
      const chunkSize = 2048; // Standard AAC frame sample count
      const totalSamples = audioBuffer.length;

      for (let offset = 0; offset < totalSamples; offset += chunkSize) {
        const frameLength = Math.min(chunkSize, totalSamples - offset);
        const planarData = new Float32Array(numChannels * frameLength);

        for (let ch = 0; ch < numChannels; ch++) {
          const channelData = audioBuffer.getChannelData(ch);
          planarData.set(channelData.subarray(offset, offset + frameLength), ch * frameLength);
        }

        const timestampMicros = Math.round((offset / sampleRate) * 1_000_000);
        const audioData = new AudioData({
          format: 'f32-planar',
          sampleRate,
          numberOfFrames: frameLength,
          numberOfChannels: numChannels,
          timestamp: timestampMicros,
          data: planarData,
        });

        audioEncoder.encode(audioData);
        audioData.close();
      }

      await audioEncoder.flush();
      audioEncoder.close();
    } catch (err) {
      console.warn('AudioEncoder failed, skipping audio track in MP4:', err);
    }
  }

  // 9. Finalize Muxing
  onProgress({
    phase: 'muxing',
    progress: 95,
    message: 'Muxing MP4 video container and preparing download...',
  });

  await videoEncoder.flush();
  videoEncoder.close();
  muxer.finalize();

  const mp4Blob = new Blob([muxerTarget.buffer], { type: 'video/mp4' });

  onProgress({
    phase: 'completed',
    progress: 100,
    message: 'Video export completed successfully!',
  });

  return mp4Blob;
}
