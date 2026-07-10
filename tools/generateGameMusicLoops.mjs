import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SAMPLE_RATE = 32000;
const OUT_DIR = "public/audio/music";
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

function envelopeAt(t, duration, attack = 0.01, release = 0.08, curve = 1.6) {
  if (t < 0 || t > duration) return 0;
  const start = attack > 0 ? Math.min(1, t / attack) : 1;
  const end = release > 0 ? Math.min(1, (duration - t) / release) : 1;
  return Math.pow(Math.max(0, Math.min(start, end)), curve);
}

function wave(type, phase, t = 0) {
  if (type === "triangle") return (2 / Math.PI) * Math.asin(Math.sin(phase));
  if (type === "square-soft") return Math.tanh(Math.sin(phase) * 2.2);
  if (type === "saw-soft") {
    const p = phase / TWO_PI;
    return Math.tanh((2 * (p - Math.floor(p + 0.5))) * 1.8);
  }
  if (type === "marimba") {
    return Math.sin(phase) + Math.sin(phase * 2.01) * 0.33 * Math.exp(-t * 5.5);
  }
  if (type === "bell") {
    return Math.sin(phase) + Math.sin(phase * 2.42) * 0.34 + Math.sin(phase * 3.95) * 0.16;
  }
  if (type === "flute") {
    return Math.sin(phase) * 0.86 + Math.sin(phase * 2) * 0.11 + Math.sin(phase * 3) * 0.04;
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
    const phase = TWO_PI * freq * t;
    const env = envelopeAt(t, duration, attack, release) * (decay ? Math.exp(-t * decay) : 1);
    buffer[i] += wave(type, phase, t) * env * gain;
  }
}

function addChord(buffer, notes, options = {}) {
  notes.forEach((note, index) => {
    addNote(buffer, note, {
      ...options,
      gain: (options.gain || 0.08) / Math.sqrt(notes.length),
      detune: (options.detune || 0) + (index - (notes.length - 1) / 2) * 0.025
    });
  });
}

function addNoise(buffer, options = {}) {
  const {
    at,
    duration,
    gain = 0.05,
    attack = 0.002,
    release = 0.06,
    seed = 1,
    tone = 0.75
  } = options;
  const random = seededRandom(seed);
  const start = Math.max(0, Math.floor(at * SAMPLE_RATE));
  const end = Math.min(buffer.length, Math.ceil((at + duration) * SAMPLE_RATE));
  let last = 0;
  for (let i = start; i < end; i += 1) {
    const t = i / SAMPLE_RATE - at;
    const env = envelopeAt(t, duration, attack, release) * Math.exp(-t * 7);
    const raw = random() * 2 - 1;
    last = last * (1 - tone) + raw * tone;
    buffer[i] += (raw - last * 0.45) * env * gain;
  }
}

function addDrum(buffer, options = {}) {
  const { at, gain = 0.1, startFreq = 150, endFreq = 70, duration = 0.2, seed = 3 } = options;
  const random = seededRandom(seed);
  const start = Math.max(0, Math.floor(at * SAMPLE_RATE));
  const end = Math.min(buffer.length, Math.ceil((at + duration) * SAMPLE_RATE));
  for (let i = start; i < end; i += 1) {
    const t = i / SAMPLE_RATE - at;
    const env = Math.exp(-t * 15);
    const sweep = endFreq + (startFreq - endFreq) * Math.exp(-t * 16);
    const click = (random() * 2 - 1) * Math.exp(-t * 65) * 0.28;
    buffer[i] += (Math.sin(TWO_PI * sweep * t) + click) * env * gain;
  }
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

function createBuffer(durationSeconds) {
  return new Float32Array(Math.ceil(durationSeconds * SAMPLE_RATE));
}

function addMeadow(buffer, bpm, bars) {
  const beat = 60 / bpm;
  const bar = beat * 4;
  const roots = ["C3", "G2", "A2", "F2", "C3", "G2", "F2", "G2"];
  const chords = [
    ["C4", "E4", "G4"],
    ["G3", "B3", "D4"],
    ["A3", "C4", "E4"],
    ["F3", "A3", "C4"],
    ["C4", "E4", "G4"],
    ["G3", "B3", "D4"],
    ["F3", "A3", "C4"],
    ["G3", "B3", "D4"]
  ];
  const melody = ["E5", null, "G5", "A5", null, "G5", "E5", "D5", "C5", null, "D5", "E5", "G5", null, "E5", null];
  const flute = ["G5", null, null, "E5", null, "D5", null, null, "A5", null, "G5", null, "E5", null, null, null];

  for (let b = 0; b < bars; b += 1) {
    const phrase = b % roots.length;
    const t = b * bar;
    addNote(buffer, roots[phrase], { at: t, duration: bar * 0.92, gain: 0.075, type: "triangle", attack: 0.018, release: 0.18 });
    [0, 1, 2, 3].forEach(step => {
      addChord(buffer, chords[phrase], { at: t + step * beat, duration: beat * 0.45, gain: 0.055, type: "saw-soft", attack: 0.004, release: 0.08, decay: 1.8 });
    });
    for (let e = 0; e < 8; e += 1) {
      addNoise(buffer, { at: t + e * beat * 0.5, duration: 0.09, gain: e % 2 ? 0.018 : 0.028, seed: 1100 + b * 11 + e, tone: 0.88 });
    }
    if (b % 2 === 0) addNoise(buffer, { at: t + beat * 2.9, duration: 0.18, gain: 0.026, seed: 900 + b, tone: 0.7 });
    if (b % 4 === 3) addDrum(buffer, { at: t + beat * 3.55, duration: 0.14, gain: 0.038, startFreq: 125, endFreq: 82, seed: 700 + b });
  }

  const eighth = beat * 0.5;
  for (let step = 0; step < Math.floor(buffer.length / SAMPLE_RATE / eighth); step += 1) {
    const phraseStep = step % melody.length;
    const barIndex = Math.floor(step / 8);
    const note = melody[phraseStep];
    if (note && step % 2 === 0) {
      addNote(buffer, note, { at: step * eighth, duration: eighth * 0.86, gain: 0.058, type: "marimba", attack: 0.004, release: 0.06, decay: 2.4 });
    }
    const fluteNote = flute[phraseStep];
    if (fluteNote && barIndex % 2 === 1) {
      addNote(buffer, fluteNote, { at: step * eighth, duration: eighth * 1.75, gain: 0.034, type: "flute", attack: 0.035, release: 0.16, vibrato: 4.8 });
    }
  }
}

function addDino(buffer, bpm, bars) {
  const beat = 60 / bpm;
  const bar = beat * 4;
  const roots = ["D2", "A2", "B2", "G2"];
  const chords = [
    ["D4", "F#4", "A4"],
    ["A3", "C#4", "E4"],
    ["B3", "D4", "F#4"],
    ["G3", "B3", "D4"]
  ];
  const kalimba = ["D5", "F#5", null, "A5", "B5", null, "A5", "F#5", "E5", null, "D5", null, "A4", "D5", null, "E5"];
  const flute = [null, null, "A5", null, null, "B5", null, null, "F#5", null, "E5", null, null, null, "D5", null];

  for (let b = 0; b < bars; b += 1) {
    const phrase = b % roots.length;
    const t = b * bar;
    addNote(buffer, roots[phrase], { at: t, duration: bar * 0.96, gain: 0.082, type: "square-soft", attack: 0.015, release: 0.16 });
    addChord(buffer, chords[phrase], { at: t + beat * 0.03, duration: beat * 1.2, gain: 0.044, type: "marimba", attack: 0.008, release: 0.14, decay: 1.6 });
    addChord(buffer, chords[phrase], { at: t + beat * 2.05, duration: beat * 0.9, gain: 0.036, type: "saw-soft", attack: 0.012, release: 0.12, decay: 1.2 });
    addDrum(buffer, { at: t, duration: 0.22, gain: 0.085, startFreq: 110, endFreq: 62, seed: 200 + b });
    addDrum(buffer, { at: t + beat * 2, duration: 0.18, gain: 0.058, startFreq: 140, endFreq: 80, seed: 250 + b });
    [0.75, 1.5, 2.75, 3.5].forEach((offset, index) => {
      addNoise(buffer, { at: t + beat * offset, duration: 0.075, gain: 0.03, seed: 300 + b * 5 + index, tone: 0.82 });
    });
    if (b % 4 === 2) {
      addNote(buffer, "D3", { at: t + beat * 3.3, duration: beat * 0.34, gain: 0.06, type: "marimba", attack: 0.004, release: 0.04, decay: 3 });
      addNote(buffer, "A3", { at: t + beat * 3.55, duration: beat * 0.24, gain: 0.045, type: "marimba", attack: 0.004, release: 0.04, decay: 3 });
    }
  }

  const eighth = beat * 0.5;
  for (let step = 0; step < Math.floor(buffer.length / SAMPLE_RATE / eighth); step += 1) {
    const note = kalimba[step % kalimba.length];
    if (note && step % 2 === 1) {
      addNote(buffer, note, { at: step * eighth, duration: eighth * 0.72, gain: 0.052, type: "bell", attack: 0.005, release: 0.07, decay: 2.8 });
    }
    const fluteNote = flute[step % flute.length];
    if (fluteNote) {
      addNote(buffer, fluteNote, { at: step * eighth, duration: eighth * 1.8, gain: 0.032, type: "flute", attack: 0.04, release: 0.16, vibrato: 4.2 });
    }
  }
}

function addMoonwood(buffer, bpm, bars) {
  const beat = 60 / bpm;
  const bar = beat * 4;
  const roots = ["A2", "F2", "C3", "G2", "A2", "E2", "F2", "G2"];
  const chords = [
    ["A3", "C4", "E4"],
    ["F3", "A3", "C4"],
    ["C4", "E4", "G4"],
    ["G3", "B3", "D4"],
    ["A3", "C4", "E4"],
    ["E3", "G#3", "B3"],
    ["F3", "A3", "C4"],
    ["G3", "B3", "D4"]
  ];
  const celesta = ["E5", null, "A5", null, "G5", null, "E5", "D5", "C5", null, "E5", null, "G5", null, null, null];
  const bells = [null, "C6", null, null, "E6", null, null, null, null, "G5", null, null, "A5", null, null, null];

  for (let b = 0; b < bars; b += 1) {
    const phrase = b % roots.length;
    const t = b * bar;
    addNote(buffer, roots[phrase], { at: t, duration: bar * 0.98, gain: 0.07, type: "sine", attack: 0.08, release: 0.35 });
    addChord(buffer, chords[phrase], { at: t, duration: bar * 0.96, gain: 0.062, type: "triangle", attack: 0.18, release: 0.35 });
    [0, 1.5, 2.5, 3.5].forEach((offset, index) => {
      const harpNote = chords[phrase][index % chords[phrase].length];
      addNote(buffer, harpNote, { at: t + beat * offset, duration: beat * 0.9, gain: 0.034, type: "bell", attack: 0.006, release: 0.12, decay: 1.9 });
    });
    if (b % 2 === 0) addNoise(buffer, { at: t + beat * 3.35, duration: 0.28, gain: 0.016, seed: 500 + b, tone: 0.58 });
  }

  const eighth = beat * 0.5;
  for (let step = 0; step < Math.floor(buffer.length / SAMPLE_RATE / eighth); step += 1) {
    const note = celesta[step % celesta.length];
    if (note) {
      addNote(buffer, note, { at: step * eighth, duration: eighth * 0.95, gain: 0.048, type: "bell", attack: 0.012, release: 0.12, decay: 1.8 });
    }
    const bellNote = bells[step % bells.length];
    if (bellNote) {
      addNote(buffer, bellNote, { at: step * eighth, duration: eighth * 1.5, gain: 0.025, type: "bell", attack: 0.018, release: 0.22, decay: 0.9 });
    }
  }
}

function render({ filename, bpm, bars, arranger }) {
  const duration = (bars * 4 * 60) / bpm;
  const buffer = createBuffer(duration);
  arranger(buffer, bpm, bars);

  let peak = 0;
  for (let i = 0; i < buffer.length; i += 1) peak = Math.max(peak, Math.abs(buffer[i]));
  const targetPeak = 0.82;
  if (peak > 0) {
    const scale = targetPeak / peak;
    for (let i = 0; i < buffer.length; i += 1) buffer[i] *= scale;
  }

  const path = join(OUT_DIR, filename);
  writeWav(path, buffer);
  return { path, duration, peak: targetPeak };
}

mkdirSync(OUT_DIR, { recursive: true });

const tracks = [
  { filename: "meadow-loop.wav", bpm: 104, bars: 40, arranger: addMeadow },
  { filename: "dino-loop.wav", bpm: 110, bars: 44, arranger: addDino },
  { filename: "moonwood-loop.wav", bpm: 96, bars: 40, arranger: addMoonwood }
].map(render);

for (const track of tracks) {
  console.log(`${track.path} ${track.duration.toFixed(2)}s peak=${track.peak.toFixed(3)}`);
}
