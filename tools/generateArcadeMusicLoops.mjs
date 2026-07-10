import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SAMPLE_RATE = 22050;
const OUT_DIR = "public/audio/music/arcade";
const TWO_PI = Math.PI * 2;

const NOTE_OFFSETS = {
  C: -9,
  "C#": -8,
  Db: -8,
  D: -7,
  "D#": -6,
  Eb: -6,
  E: -5,
  F: -4,
  "F#": -3,
  Gb: -3,
  G: -2,
  "G#": -1,
  Ab: -1,
  A: 0,
  "A#": 1,
  Bb: 1,
  B: 2
};

function frequency(note) {
  const match = /^([A-G](?:#|b)?)(-?\d)$/.exec(note);
  if (!match) throw new Error(`Bad note: ${note}`);
  const [, pitch, octaveText] = match;
  const octave = Number(octaveText);
  const semitone = NOTE_OFFSETS[pitch] + (octave - 4) * 12;
  return 440 * 2 ** (semitone / 12);
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function clampSample(value) {
  return Math.max(-0.98, Math.min(0.98, value));
}

function envelopeAt(t, duration, attack = 0.01, release = 0.08, curve = 1.5) {
  if (t < 0 || t > duration) return 0;
  const start = attack > 0 ? Math.min(1, t / attack) : 1;
  const end = release > 0 ? Math.min(1, (duration - t) / release) : 1;
  return Math.pow(Math.max(0, Math.min(start, end)), curve);
}

function wave(type, phase, t = 0) {
  if (type === "triangle") return (2 / Math.PI) * Math.asin(Math.sin(phase));
  if (type === "square-soft") return Math.tanh(Math.sin(phase) * 2.15);
  if (type === "saw-soft") {
    const p = phase / TWO_PI;
    return Math.tanh((2 * (p - Math.floor(p + 0.5))) * 1.75);
  }
  if (type === "pluck") {
    return Math.sin(phase) + Math.sin(phase * 2.01) * 0.38 * Math.exp(-t * 5.8);
  }
  if (type === "bell") {
    return Math.sin(phase) + Math.sin(phase * 2.42) * 0.35 + Math.sin(phase * 3.96) * 0.15;
  }
  if (type === "flute") {
    return Math.sin(phase) * 0.86 + Math.sin(phase * 2) * 0.12 + Math.sin(phase * 3) * 0.05;
  }
  return Math.sin(phase);
}

function addNote(buffer, note, options = {}) {
  const {
    at,
    duration,
    gain = 0.1,
    type = "sine",
    attack = 0.008,
    release = 0.08,
    decay = 0,
    detune = 0,
    vibrato = 0,
    vibratoDepth = 0.003
  } = options;
  const start = Math.max(0, Math.floor(at * SAMPLE_RATE));
  const end = Math.min(buffer.length, Math.ceil((at + duration) * SAMPLE_RATE));
  const base = typeof note === "number" ? note : frequency(note);
  for (let i = start; i < end; i += 1) {
    const t = i / SAMPLE_RATE - at;
    const lfo = vibrato ? Math.sin(TWO_PI * vibrato * t) * vibratoDepth : 0;
    const freq = base * 2 ** ((detune + lfo) / 12);
    const env = envelopeAt(t, duration, attack, release) * (decay ? Math.exp(-t * decay) : 1);
    buffer[i] += wave(type, TWO_PI * freq * t, t) * env * gain;
  }
}

function addChord(buffer, notes, options = {}) {
  notes.forEach((note, index) => {
    addNote(buffer, note, {
      ...options,
      gain: (options.gain || 0.08) / Math.sqrt(notes.length),
      detune: (options.detune || 0) + (index - (notes.length - 1) / 2) * 0.03
    });
  });
}

function addNoise(buffer, options = {}) {
  const {
    at,
    duration,
    gain = 0.05,
    attack = 0.002,
    release = 0.05,
    seed = 1,
    tone = 0.72
  } = options;
  const random = seededRandom(seed);
  const start = Math.max(0, Math.floor(at * SAMPLE_RATE));
  const end = Math.min(buffer.length, Math.ceil((at + duration) * SAMPLE_RATE));
  let last = 0;
  for (let i = start; i < end; i += 1) {
    const t = i / SAMPLE_RATE - at;
    const env = envelopeAt(t, duration, attack, release) * Math.exp(-t * 7.5);
    const raw = random() * 2 - 1;
    last = last * (1 - tone) + raw * tone;
    buffer[i] += (raw - last * 0.42) * env * gain;
  }
}

function addKick(buffer, options = {}) {
  const { at, gain = 0.1, startFreq = 145, endFreq = 52, duration = 0.18, seed = 3 } = options;
  const random = seededRandom(seed);
  const start = Math.max(0, Math.floor(at * SAMPLE_RATE));
  const end = Math.min(buffer.length, Math.ceil((at + duration) * SAMPLE_RATE));
  for (let i = start; i < end; i += 1) {
    const t = i / SAMPLE_RATE - at;
    const env = Math.exp(-t * 16);
    const sweep = endFreq + (startFreq - endFreq) * Math.exp(-t * 15);
    const click = (random() * 2 - 1) * Math.exp(-t * 72) * 0.25;
    buffer[i] += (Math.sin(TWO_PI * sweep * t) + click) * env * gain;
  }
}

function addDrums(buffer, beat, bar, bars, seed, profile = "arcade") {
  for (let b = 0; b < bars; b += 1) {
    const t = b * bar;
    addKick(buffer, { at: t, gain: profile === "soft" ? 0.05 : 0.08, seed: seed + b });
    if (profile !== "soft") addKick(buffer, { at: t + beat * 2, gain: 0.05, startFreq: 120, endFreq: 64, duration: 0.14, seed: seed + b + 50 });
    for (let e = 0; e < 8; e += 1) {
      addNoise(buffer, {
        at: t + e * beat * 0.5,
        duration: profile === "bubble" ? 0.045 : 0.055,
        gain: e % 2 ? 0.012 : profile === "soft" ? 0.012 : 0.024,
        seed: seed + b * 11 + e,
        tone: profile === "bubble" ? 0.9 : 0.78
      });
    }
  }
}

function addArp(buffer, notes, beat, bars, options = {}) {
  const eighth = beat * 0.5;
  const totalSteps = bars * 8;
  for (let step = 0; step < totalSteps; step += 1) {
    const note = notes[step % notes.length];
    if (!note) continue;
    addNote(buffer, note, {
      at: step * eighth,
      duration: eighth * (options.length ?? 0.72),
      gain: options.gain ?? 0.04,
      type: options.type ?? "pluck",
      attack: options.attack ?? 0.004,
      release: options.release ?? 0.06,
      decay: options.decay ?? 2.4,
      vibrato: options.vibrato ?? 0
    });
  }
}

function addProgression(buffer, bpm, bars, roots, chords, options = {}) {
  const beat = 60 / bpm;
  const bar = beat * 4;
  for (let b = 0; b < bars; b += 1) {
    const phrase = b % roots.length;
    const t = b * bar;
    addNote(buffer, roots[phrase], {
      at: t,
      duration: bar * 0.92,
      gain: options.bassGain ?? 0.065,
      type: options.bassType ?? "triangle",
      attack: options.bassAttack ?? 0.018,
      release: options.bassRelease ?? 0.18
    });
    for (let step = 0; step < 4; step += 1) {
      addChord(buffer, chords[phrase], {
        at: t + step * beat,
        duration: beat * (options.chordLength ?? 0.48),
        gain: options.chordGain ?? 0.045,
        type: options.chordType ?? "saw-soft",
        attack: options.chordAttack ?? 0.006,
        release: options.chordRelease ?? 0.09,
        decay: options.chordDecay ?? 1.6
      });
    }
  }
}

function arrangeRocketRun(buffer, bpm, bars) {
  const beat = 60 / bpm;
  addProgression(buffer, bpm, bars, ["F2", "C3", "D3", "Bb2"], [
    ["F3", "A3", "C4"], ["C4", "E4", "G4"], ["D4", "F4", "A4"], ["Bb3", "D4", "F4"]
  ], { bassType: "square-soft", bassGain: 0.085, chordGain: 0.04, chordType: "saw-soft" });
  addDrums(buffer, beat, beat * 4, bars, 100);
  addArp(buffer, ["C5", null, "F5", "G5", "A5", null, "G5", "F5", "D5", null, "F5", "G5", "C6", "A5", null, "G5"], beat, bars, { gain: 0.052, type: "triangle" });
}

function arrangeLetterLeap(buffer, bpm, bars) {
  const beat = 60 / bpm;
  addProgression(buffer, bpm, bars, ["C3", "G2", "A2", "F2"], [
    ["C4", "E4", "G4"], ["G3", "B3", "D4"], ["A3", "C4", "E4"], ["F3", "A3", "C4"]
  ], { bassGain: 0.06, chordGain: 0.048, chordType: "pluck", chordLength: 0.4 });
  addDrums(buffer, beat, beat * 4, bars, 200, "soft");
  addArp(buffer, ["E5", "G5", null, "C6", "B5", null, "G5", "E5", "D5", null, "E5", "G5", "A5", null, "G5", null], beat, bars, { gain: 0.05, type: "bell" });
}

function arrangeSoundRacer(buffer, bpm, bars) {
  const beat = 60 / bpm;
  addProgression(buffer, bpm, bars, ["A2", "E2", "G2", "D3"], [
    ["A3", "C4", "E4"], ["E3", "G#3", "B3"], ["G3", "B3", "D4"], ["D4", "F4", "A4"]
  ], { bassType: "saw-soft", bassGain: 0.09, chordGain: 0.036, chordType: "square-soft" });
  addDrums(buffer, beat, beat * 4, bars, 300);
  addArp(buffer, ["A4", null, "C5", "E5", "G5", null, "E5", "C5", "D5", null, "F5", "A5", "C6", null, "A5", "G5"], beat, bars, { gain: 0.044, type: "saw-soft", length: 0.54 });
}

function arrangeWordBridge(buffer, bpm, bars) {
  const beat = 60 / bpm;
  addProgression(buffer, bpm, bars, ["D2", "A2", "B2", "G2"], [
    ["D4", "F#4", "A4"], ["A3", "C#4", "E4"], ["B3", "D4", "F#4"], ["G3", "B3", "D4"]
  ], { bassType: "triangle", bassGain: 0.072, chordGain: 0.04, chordType: "bell", chordLength: 0.7 });
  addDrums(buffer, beat, beat * 4, bars, 400, "soft");
  addArp(buffer, ["F#5", null, "A5", null, "B5", "A5", null, "F#5", "E5", null, "D5", null, "A4", "D5", null, "E5"], beat, bars, { gain: 0.045, type: "pluck" });
}

function arrangeSoundBeat(buffer, bpm, bars) {
  const beat = 60 / bpm;
  addProgression(buffer, bpm, bars, ["G2", "Bb2", "C3", "F2"], [
    ["G3", "Bb3", "D4"], ["Bb3", "D4", "F4"], ["C4", "Eb4", "G4"], ["F3", "A3", "C4"]
  ], { bassType: "square-soft", bassGain: 0.09, chordGain: 0.034, chordType: "saw-soft", chordLength: 0.32 });
  addDrums(buffer, beat, beat * 4, bars, 500);
  addArp(buffer, ["G4", "Bb4", "D5", null, "F5", "D5", "Bb4", null, "C5", "Eb5", "G5", null, "A5", "G5", "F5", null], beat, bars, { gain: 0.052, type: "triangle", length: 0.46 });
}

function arrangeRhymePop(buffer, bpm, bars) {
  const beat = 60 / bpm;
  addProgression(buffer, bpm, bars, ["E3", "B2", "C#3", "A2"], [
    ["E4", "G#4", "B4"], ["B3", "D#4", "F#4"], ["C#4", "E4", "G#4"], ["A3", "C#4", "E4"]
  ], { bassType: "triangle", bassGain: 0.062, chordGain: 0.045, chordType: "bell", chordLength: 0.5 });
  addDrums(buffer, beat, beat * 4, bars, 600, "bubble");
  addArp(buffer, ["E5", null, "G#5", "B5", null, "C#6", "B5", null, "A5", null, "G#5", "E5", "F#5", null, "E5", null], beat, bars, { gain: 0.048, type: "bell" });
  for (let b = 0; b < bars; b += 1) addNoise(buffer, { at: b * beat * 4 + beat * 3.5, duration: 0.11, gain: 0.025, seed: 900 + b, tone: 0.94 });
}

function arrangeSoundSafari(buffer, bpm, bars) {
  const beat = 60 / bpm;
  addProgression(buffer, bpm, bars, ["D3", "A2", "G2", "A2"], [
    ["D4", "F#4", "A4"], ["A3", "C#4", "E4"], ["G3", "B3", "D4"], ["A3", "C#4", "E4"]
  ], { bassType: "pluck", bassGain: 0.066, chordGain: 0.036, chordType: "flute", chordLength: 0.68 });
  addDrums(buffer, beat, beat * 4, bars, 700, "soft");
  addArp(buffer, ["A5", null, "F#5", null, "D5", "E5", null, "F#5", "B5", null, "A5", null, "F#5", null, "E5", null], beat, bars, { gain: 0.04, type: "flute", attack: 0.035, release: 0.16, vibrato: 4.4 });
}

function arrangeSentenceGrove(buffer, bpm, bars) {
  const beat = 60 / bpm;
  addProgression(buffer, bpm, bars, ["A2", "F2", "C3", "G2"], [
    ["A3", "C4", "E4"], ["F3", "A3", "C4"], ["C4", "E4", "G4"], ["G3", "B3", "D4"]
  ], { bassType: "sine", bassGain: 0.06, bassAttack: 0.06, bassRelease: 0.28, chordGain: 0.052, chordType: "triangle", chordAttack: 0.08, chordRelease: 0.24, chordLength: 0.9 });
  addDrums(buffer, beat, beat * 4, bars, 800, "soft");
  addArp(buffer, ["E5", null, "A5", null, "G5", null, "E5", "D5", "C5", null, "E5", null, "G5", null, "A5", null], beat, bars, { gain: 0.044, type: "bell", length: 0.9, release: 0.12 });
}

function writeWav(path, samples) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * bytesPerSample, 28);
  header.writeUInt16LE(bytesPerSample, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  const body = Buffer.alloc(dataSize);
  for (let i = 0; i < samples.length; i += 1) {
    body.writeInt16LE(Math.round(clampSample(samples[i]) * 32767), i * 2);
  }
  writeFileSync(path, Buffer.concat([header, body]));
}

function render({ filename, bpm, bars, arranger }) {
  const duration = (bars * 4 * 60) / bpm;
  const buffer = new Float32Array(Math.ceil(duration * SAMPLE_RATE));
  arranger(buffer, bpm, bars);

  const edgeSamples = Math.min(buffer.length, Math.floor(SAMPLE_RATE * 0.018));
  for (let i = 0; i < edgeSamples; i += 1) {
    const fade = i / edgeSamples;
    buffer[i] *= fade;
    buffer[buffer.length - 1 - i] *= fade;
  }

  let peak = 0;
  let sumSquares = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    peak = Math.max(peak, Math.abs(buffer[i]));
    sumSquares += buffer[i] * buffer[i];
  }
  const targetPeak = 0.82;
  if (peak > 0) {
    const scale = targetPeak / peak;
    for (let i = 0; i < buffer.length; i += 1) buffer[i] *= scale;
  }
  const rms = Math.sqrt(sumSquares / Math.max(1, buffer.length));
  const path = join(OUT_DIR, filename);
  writeWav(path, buffer);
  return { path, duration, peak: targetPeak, rms };
}

mkdirSync(OUT_DIR, { recursive: true });

const tracks = [
  { filename: "rocket-run-loop.wav", bpm: 132, bars: 8, arranger: arrangeRocketRun },
  { filename: "letter-leap-loop.wav", bpm: 116, bars: 8, arranger: arrangeLetterLeap },
  { filename: "sound-racer-loop.wav", bpm: 138, bars: 8, arranger: arrangeSoundRacer },
  { filename: "word-bridge-loop.wav", bpm: 106, bars: 8, arranger: arrangeWordBridge },
  { filename: "sound-beat-loop.wav", bpm: 124, bars: 8, arranger: arrangeSoundBeat },
  { filename: "rhyme-pop-loop.wav", bpm: 118, bars: 8, arranger: arrangeRhymePop },
  { filename: "sound-safari-loop.wav", bpm: 108, bars: 8, arranger: arrangeSoundSafari },
  { filename: "star-gallery-loop.wav", bpm: 96, bars: 8, arranger: arrangeSentenceGrove }
].map(render);

for (const track of tracks) {
  console.log(`${track.path} ${track.duration.toFixed(2)}s peak=${track.peak.toFixed(3)} rms=${track.rms.toFixed(3)}`);
}
