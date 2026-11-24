/**
 * 100% Offline Multi-Genre Procedural Soundtrack Generator using Web Audio API
 * Generates dramatically distinct, recognizable genres:
 * 1. Cinematic: Epic deep orchestral drones, atmospheric strings, sub-bass pulse
 * 2. Lo-Fi: Distinct boom-bap hip-hop drum beat, wobbly vintage Rhodes chords, mellow bass
 * 3. Acoustic: Fast fingerpicked folk guitar arpeggios & warm acoustic bass
 * 4. Upbeat: Energetic 4-on-the-floor dance beat, bouncy synth bass & bright pop stabs
 * 5. Ambient: Pure ethereal singing bowl chimes & floating cosmic drone (zero drums)
 */

export interface SynthTrackDef {
  id: string;
  title: string;
  artist: string;
  category: 'Cinematic' | 'Lo-Fi' | 'Acoustic' | 'Upbeat' | 'Ambient';
  duration: number;
}

export const BUILTIN_TRACKS: SynthTrackDef[] = [
  {
    id: 'synth-cinematic',
    title: 'Aura of Wonder',
    artist: 'Cinematic Studio',
    category: 'Cinematic',
    duration: 32,
  },
  {
    id: 'synth-lofi',
    title: 'Warm Coffee Beats',
    artist: 'Lo-Fi Chill Collective',
    category: 'Lo-Fi',
    duration: 28,
  },
  {
    id: 'synth-acoustic',
    title: 'Sunlit Mountain Trail',
    artist: 'Acoustic Harmonies',
    category: 'Acoustic',
    duration: 30,
  },
  {
    id: 'synth-upbeat',
    title: 'Summer Coastline Groove',
    artist: 'Tropical Glow',
    category: 'Upbeat',
    duration: 24,
  },
  {
    id: 'synth-ambient',
    title: 'Infinite Aurora',
    artist: 'Deep Soundscapes',
    category: 'Ambient',
    duration: 36,
  },
];

export async function generateSyntheticTrackBuffer(
  trackId: string,
  totalDurationSeconds: number,
  sampleRate: number = 44100
): Promise<AudioBuffer> {
  const totalSamples = Math.ceil(totalDurationSeconds * sampleRate);
  const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.8, 0);

  // Master reverb / delay
  const delay = offlineCtx.createDelay();
  delay.delayTime.setValueAtTime(0.22, 0);
  const feedback = offlineCtx.createGain();
  feedback.gain.setValueAtTime(0.28, 0);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(masterGain);

  if (trackId === 'synth-lofi') {
    // -------------------------------------------------------------
    // GENRE 1: LO-FI HIP-HOP (Mellow Rhodes chords + Boom-Bap Drums)
    // -------------------------------------------------------------
    const tempo = 82;
    const beatSec = 60 / tempo;
    const totalBeats = Math.ceil(totalDurationSeconds / beatSec);

    // Lo-Fi Jazz Chord frequencies (Eb Maj7 -> Cm9 -> Fm7 -> Bb7)
    const chords = [
      [155.56, 196.0, 233.08, 293.66], // Eb Maj7
      [130.81, 155.56, 196.0, 261.63], // Cm9
      [174.61, 207.65, 261.63, 311.13], // Fm7
      [116.54, 146.83, 174.61, 233.08], // Bb7
    ];

    // Chords (warm electric piano with vibrato)
    const chordDuration = beatSec * 4;
    const measures = Math.ceil(totalDurationSeconds / chordDuration);

    for (let m = 0; m < measures; m++) {
      const chord = chords[m % chords.length];
      const start = m * chordDuration;
      if (start >= totalDurationSeconds) break;

      chord.forEach((freq) => {
        const osc = offlineCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        // Vinyl pitch wobble (wow & flutter)
        const lfo = offlineCtx.createOscillator();
        lfo.frequency.setValueAtTime(3.5, start);
        const lfoGain = offlineCtx.createGain();
        lfoGain.gain.setValueAtTime(2.5, start);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(start);
        lfo.stop(start + chordDuration);

        const filter = offlineCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, start); // Warm muffled lo-fi tone

        const gain = offlineCtx.createGain();
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.09, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.03, start + chordDuration * 0.8);
        gain.gain.linearRampToValueAtTime(0.001, start + chordDuration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        gain.connect(delay);

        osc.start(start);
        osc.stop(Math.min(totalDurationSeconds, start + chordDuration));
      });
    }

    // Drums: Distinct Boom-Bap Beat (Kick on 1 & 3, Snare/Clap on 2 & 4)
    for (let b = 0; b < totalBeats; b++) {
      const t = b * beatSec;
      if (t >= totalDurationSeconds) break;
      const beatInBar = b % 4;

      if (beatInBar === 0 || beatInBar === 2) {
        // Muffled Lo-Fi Kick
        const kickOsc = offlineCtx.createOscillator();
        kickOsc.frequency.setValueAtTime(95, t);
        kickOsc.frequency.exponentialRampToValueAtTime(38, t + 0.14);

        const kickGain = offlineCtx.createGain();
        kickGain.gain.setValueAtTime(0.24, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

        kickOsc.connect(kickGain);
        kickGain.connect(masterGain);
        kickOsc.start(t);
        kickOsc.stop(t + 0.18);
      } else {
        // Soft Vintage Snare / Rimshot
        const snareNoise = offlineCtx.createBufferSource();
        const noiseBuffer = offlineCtx.createBuffer(1, Math.floor(sampleRate * 0.1), sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
        snareNoise.buffer = noiseBuffer;

        const snareFilter = offlineCtx.createBiquadFilter();
        snareFilter.type = 'bandpass';
        snareFilter.frequency.setValueAtTime(1400, t);

        const snareGain = offlineCtx.createGain();
        snareGain.gain.setValueAtTime(0.12, t);
        snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        snareNoise.connect(snareFilter);
        snareFilter.connect(snareGain);
        snareGain.connect(masterGain);
        snareNoise.start(t);
      }
    }
  } else if (trackId === 'synth-upbeat') {
    // -------------------------------------------------------------
    // GENRE 2: UPBEAT DANCE POP (4-on-the-floor kick, bouncy synth bass)
    // -------------------------------------------------------------
    const tempo = 120; // 120 BPM energetic
    const beatSec = 60 / tempo;
    const totalBeats = Math.ceil(totalDurationSeconds / beatSec);

    // Bouncy energetic bass notes (A -> F -> C -> G)
    const bassNotes = [110, 87.31, 130.81, 98.0];

    for (let b = 0; b < totalBeats; b++) {
      const t = b * beatSec;
      if (t >= totalDurationSeconds) break;

      // 4-on-the-floor punchy Club Kick on EVERY beat!
      const kickOsc = offlineCtx.createOscillator();
      kickOsc.frequency.setValueAtTime(140, t);
      kickOsc.frequency.exponentialRampToValueAtTime(45, t + 0.08);

      const kickGain = offlineCtx.createGain();
      kickGain.gain.setValueAtTime(0.32, t);
      kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      kickOsc.connect(kickGain);
      kickGain.connect(masterGain);
      kickOsc.start(t);
      kickOsc.stop(t + 0.13);

      // Off-beat crisp Hi-Hat
      const hatTime = t + beatSec * 0.5;
      if (hatTime < totalDurationSeconds) {
        const hatBuffer = offlineCtx.createBuffer(1, Math.floor(sampleRate * 0.04), sampleRate);
        const data = hatBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
        const hat = offlineCtx.createBufferSource();
        hat.buffer = hatBuffer;

        const hatFilter = offlineCtx.createBiquadFilter();
        hatFilter.type = 'highpass';
        hatFilter.frequency.setValueAtTime(6000, hatTime);

        const hatGain = offlineCtx.createGain();
        hatGain.gain.setValueAtTime(0.08, hatTime);
        hatGain.gain.exponentialRampToValueAtTime(0.001, hatTime + 0.04);

        hat.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(masterGain);
        hat.start(hatTime);
      }

      // Bouncy Electro Bass Synth (off-beat stabs)
      const bassFreq = bassNotes[Math.floor(b / 4) % bassNotes.length];
      const bassOsc = offlineCtx.createOscillator();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassFreq, t + beatSec * 0.5);

      const bassFilter = offlineCtx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(1200, t + beatSec * 0.5);
      bassFilter.frequency.exponentialRampToValueAtTime(250, t + beatSec * 0.95);

      const bassGain = offlineCtx.createGain();
      bassGain.gain.setValueAtTime(0.18, t + beatSec * 0.5);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + beatSec * 0.95);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(masterGain);
      bassOsc.start(t + beatSec * 0.5);
      bassOsc.stop(t + beatSec);
    }
  } else if (trackId === 'synth-acoustic') {
    // -------------------------------------------------------------
    // GENRE 3: ACOUSTIC FOLK (Bright fingerpicked guitar arpeggio, NO drums)
    // -------------------------------------------------------------
    const tempo = 100;
    const beatSec = 60 / tempo;
    const subBeat = beatSec / 4; // 16th note fingerpicking speed
    const totalSubBeats = Math.ceil(totalDurationSeconds / subBeat);

    // Warm Folk Guitar Strings (G -> D -> Em -> C arpeggio pattern)
    const guitarPatterns = [
      [196.0, 246.94, 293.66, 392.0, 493.88, 392.0, 293.66, 246.94], // G
      [146.83, 220.0, 293.66, 369.99, 440.0, 369.99, 293.66, 220.0], // D
      [164.81, 246.94, 329.63, 392.0, 493.88, 392.0, 329.63, 246.94], // Em
      [130.81, 196.0, 261.63, 329.63, 392.0, 329.63, 261.63, 196.0],  // C
    ];

    for (let s = 0; s < totalSubBeats; s++) {
      const t = s * subBeat;
      if (t >= totalDurationSeconds) break;

      const chordIdx = Math.floor(s / 16) % guitarPatterns.length;
      const pattern = guitarPatterns[chordIdx];
      const freq = pattern[s % pattern.length];

      // Plucked string oscillator with realistic harmonic decay
      const osc = offlineCtx.createOscillator();
      osc.type = s % 8 === 0 ? 'triangle' : 'sine'; // Bass note on downbeats
      osc.frequency.setValueAtTime(freq, t);

      const gain = offlineCtx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + subBeat * 2.5);

      osc.connect(gain);
      gain.connect(masterGain);
      gain.connect(delay);

      osc.start(t);
      osc.stop(Math.min(totalDurationSeconds, t + subBeat * 2.8));
    }
  } else if (trackId === 'synth-ambient') {
    // -------------------------------------------------------------
    // GENRE 4: AMBIENT MEDITATION (Singing bowl crystal chimes, slow drone)
    // -------------------------------------------------------------
    const bowlFrequencies = [220.0, 277.18, 329.63, 440.0, 554.37, 659.25]; // A major crystal bowl
    const droneDuration = 8.0;
    const totalDrones = Math.ceil(totalDurationSeconds / droneDuration);

    for (let d = 0; d < totalDrones; d++) {
      const t = d * droneDuration;
      if (t >= totalDurationSeconds) break;

      bowlFrequencies.forEach((freq, i) => {
        const osc = offlineCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.detune.setValueAtTime((i - 2.5) * 4, t);

        const gain = offlineCtx.createGain();
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.05, t + 2.5);
        gain.gain.exponentialRampToValueAtTime(0.001, t + droneDuration);

        osc.connect(gain);
        gain.connect(masterGain);
        gain.connect(delay);

        osc.start(t);
        osc.stop(Math.min(totalDurationSeconds, t + droneDuration));
      });
    }
  } else {
    // -------------------------------------------------------------
    // GENRE 5: CINEMATIC ODYSSEY (Epic brass, deep string pads & sub-bass pulse)
    // -------------------------------------------------------------
    const tempo = 65; // Slow epic 65 BPM
    const beatSec = 60 / tempo;
    const chordDuration = beatSec * 4;
    const measures = Math.ceil(totalDurationSeconds / chordDuration);

    // D minor cinematic progression (Dm -> Bb -> F -> C)
    const chords = [
      [73.42, 146.83, 174.61, 220.0, 293.66], // Low Dm
      [58.27, 116.54, 174.61, 233.08, 293.66], // Low Bb
      [87.31, 130.81, 174.61, 220.0, 261.63], // Low F
      [65.41, 130.81, 164.81, 196.0, 261.63], // Low C
    ];

    for (let m = 0; m < measures; m++) {
      const chord = chords[m % chords.length];
      const start = m * chordDuration;
      if (start >= totalDurationSeconds) break;

      // Heavy cinematic orchestral strings & brass
      chord.forEach((freq, idx) => {
        const osc = offlineCtx.createOscillator();
        osc.type = idx === 0 ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(freq, start);

        const filter = offlineCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(idx === 0 ? 300 : 1200, start);

        const gain = offlineCtx.createGain();
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(idx === 0 ? 0.16 : 0.08, start + 0.8);
        gain.gain.setValueAtTime(idx === 0 ? 0.14 : 0.07, start + chordDuration - 0.6);
        gain.gain.linearRampToValueAtTime(0.001, start + chordDuration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        gain.connect(delay);

        osc.start(start);
        osc.stop(Math.min(totalDurationSeconds, start + chordDuration));
      });

      // Cinematic Sub-Boom Impact on Measure Start
      const boom = offlineCtx.createOscillator();
      boom.frequency.setValueAtTime(110, start);
      boom.frequency.exponentialRampToValueAtTime(30, start + 0.8);

      const boomGain = offlineCtx.createGain();
      boomGain.gain.setValueAtTime(0.28, start);
      boomGain.gain.exponentialRampToValueAtTime(0.001, start + 0.85);

      boom.connect(boomGain);
      boomGain.connect(masterGain);
      boom.start(start);
      boom.stop(start + 0.9);
    }
  }

  masterGain.connect(offlineCtx.destination);
  return await offlineCtx.startRendering();
}
