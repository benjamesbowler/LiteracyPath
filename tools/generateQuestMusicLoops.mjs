import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SAMPLE_RATE = 22050;
const OUT_DIR = "public/audio/music/quest";
const TWO_PI = Math.PI * 2;

const PITCHES = {
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
  if (!match) throw new Error(`Unknown note ${note}`);
  const [, pitch, octaveText] = match;
  return 440 * 2 ** ((PITCHES[pitch] + (Number(octaveText) - 4) * 12) / 12);
}

function randomFrom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function envelope(t, duration, attack, release, decay = 0) {
  if (t < 0 || t >= duration) return 0;
  const rise = attack > 0 ? Math.min(1, t / attack) : 1;
  const fall = release > 0 ? Math.min(1, (duration - t) / release) : 1;
  return Math.sin(Math.min(rise, fall) * Math.PI * 0.5) ** 2 * Math.exp(-decay * t);
}

function voice(type, phase, t, randomValue = 0) {
  const fundamental = Math.sin(phase);
  if (type === "felt") {
    return fundamental * 0.78
      + Math.sin(phase * 2.002) * 0.16 * Math.exp(-t * 1.8)
      + Math.sin(phase * 3.997) * 0.07 * Math.exp(-t * 3.4);
  }
  if (type === "marimba") {
    return fundamental * 0.72
      + Math.sin(phase * 3.96) * 0.22
      + Math.sin(phase * 9.1) * 0.08;
  }
  if (type === "kalimba") {
    return fundamental * 0.69
      + Math.sin(phase * 2.03) * 0.24
      + Math.sin(phase * 5.91) * 0.1;
  }
  if (type === "celesta") {
    return fundamental * 0.62
      + Math.sin(phase * 2.52) * 0.24
      + Math.sin(phase * 4.03) * 0.13;
  }
  if (type === "flute") {
    return fundamental * 0.88 + Math.sin(phase * 2) * 0.09 + Math.sin(phase * 3) * 0.03;
  }
  if (type === "reed") {
    return Math.tanh((fundamental + Math.sin(phase * 2) * 0.27 + Math.sin(phase * 3) * 0.12) * 1.08);
  }
  if (type === "pad") {
    return fundamental * 0.72
      + Math.sin(phase * 0.499) * 0.17
      + Math.sin(phase * 1.006 + Math.sin(t * 0.7) * 0.4) * 0.12;
  }
  if (type === "bass") return fundamental * 0.82 + Math.sin(phase * 2) * 0.13;
  if (type === "air") return randomValue * 0.72 + fundamental * 0.28;
  return fundamental;
}

function addNote(buffer, note, options) {
  const {
    at,
    duration,
    gain = 0.08,
    type = "felt",
    attack = 0.012,
    release = 0.12,
    decay = 0,
    vibrato = 0,
    vibratoDepth = 0.002,
    seed = 1
  } = options;
  const start = Math.max(0, Math.floor(at * SAMPLE_RATE));
  const end = Math.min(buffer.length, Math.ceil((at + duration) * SAMPLE_RATE));
  const base = typeof note === "number" ? note : frequency(note);
  const random = randomFrom(seed);
  let filteredNoise = 0;

  for (let index = start; index < end; index += 1) {
    const t = index / SAMPLE_RATE - at;
    const wobble = vibrato ? Math.sin(TWO_PI * vibrato * t) * vibratoDepth : 0;
    const phase = TWO_PI * base * (1 + wobble) * t;
    const rawNoise = random() * 2 - 1;
    filteredNoise += (rawNoise - filteredNoise) * 0.045;
    buffer[index] += voice(type, phase, t, filteredNoise) * envelope(t, duration, attack, release, decay) * gain;
  }
}

function addChord(buffer, notes, options) {
  const voiceGain = (options.gain || 0.08) / Math.sqrt(notes.length);
  notes.forEach((note, index) => addNote(buffer, note, {
    ...options,
    gain: voiceGain,
    seed: (options.seed || 1) + index * 17
  }));
}

function addNoiseHit(buffer, { at, duration = 0.08, gain = 0.02, seed = 1, dark = false }) {
  const start = Math.max(0, Math.floor(at * SAMPLE_RATE));
  const end = Math.min(buffer.length, Math.ceil((at + duration) * SAMPLE_RATE));
  const random = randomFrom(seed);
  let smooth = 0;
  for (let index = start; index < end; index += 1) {
    const t = index / SAMPLE_RATE - at;
    const raw = random() * 2 - 1;
    smooth += (raw - smooth) * (dark ? 0.08 : 0.48);
    const sound = dark ? smooth : raw - smooth * 0.48;
    buffer[index] += sound * Math.exp(-t * (dark ? 10 : 28)) * gain;
  }
}

function addDrum(buffer, { at, gain = 0.08, pitch = 72, duration = 0.22, seed = 1 }) {
  const start = Math.max(0, Math.floor(at * SAMPLE_RATE));
  const end = Math.min(buffer.length, Math.ceil((at + duration) * SAMPLE_RATE));
  const random = randomFrom(seed);
  for (let index = start; index < end; index += 1) {
    const t = index / SAMPLE_RATE - at;
    const body = Math.sin(TWO_PI * (pitch + 72 * Math.exp(-t * 17)) * t);
    const tap = (random() * 2 - 1) * Math.exp(-t * 65) * 0.2;
    buffer[index] += (body + tap) * Math.exp(-t * 13) * gain;
  }
}

function addWoodblock(buffer, { at, gain = 0.035, pitch = 780 }) {
  addNote(buffer, pitch, {
    at,
    duration: 0.075,
    gain,
    type: "marimba",
    attack: 0.001,
    release: 0.055,
    decay: 22
  });
}

function addProgression(buffer, track) {
  const beat = 60 / track.bpm;
  const bar = beat * 4;
  for (let barIndex = 0; barIndex < track.bars; barIndex += 1) {
    const harmony = track.progression[barIndex % track.progression.length];
    const at = barIndex * bar;
    addChord(buffer, harmony.chord, {
      at,
      duration: bar * 0.94,
      gain: track.padGain,
      type: "pad",
      attack: 0.22,
      release: 0.42,
      seed: track.seed + barIndex
    });
    addNote(buffer, harmony.bass, {
      at,
      duration: bar * 0.82,
      gain: track.bassGain,
      type: "bass",
      attack: 0.025,
      release: 0.22
    });
    if (barIndex >= 4) {
      addNote(buffer, harmony.bass, {
        at: at + beat * 2.5,
        duration: beat * 1.15,
        gain: track.bassGain * 0.52,
        type: "felt",
        attack: 0.014,
        release: 0.16,
        decay: 0.9
      });
    }
  }
}

function addMelody(buffer, track) {
  const beat = 60 / track.bpm;
  const step = beat * 0.5;
  const phraseSteps = track.melody.length;
  const totalSteps = track.bars * 8;
  for (let index = 0; index < totalSteps; index += 1) {
    const note = track.melody[index % phraseSteps];
    if (!note) continue;
    const phrase = Math.floor(index / phraseSteps);
    const variation = phrase % 4 === 3 && track.lift?.[index % phraseSteps]
      ? track.lift[index % phraseSteps]
      : note;
    addNote(buffer, variation, {
      at: index * step,
      duration: step * (track.melodyLength || 0.78),
      gain: track.melodyGain * (index < 16 ? 0.76 : 1),
      type: track.lead,
      attack: track.lead === "flute" ? 0.055 : 0.004,
      release: track.lead === "flute" ? 0.16 : 0.1,
      decay: track.leadDecay,
      vibrato: track.lead === "flute" ? 4.2 : 0,
      seed: track.seed + index
    });
  }
}

function addRhythm(buffer, track) {
  const beat = 60 / track.bpm;
  const bar = beat * 4;
  for (let barIndex = 0; barIndex < track.bars; barIndex += 1) {
    const at = barIndex * bar;
    if (track.rhythm === "meadow") {
      addDrum(buffer, { at, gain: 0.035, pitch: 82, seed: 1000 + barIndex });
      addWoodblock(buffer, { at: at + beat * 1.5, gain: 0.025, pitch: 920 });
      addWoodblock(buffer, { at: at + beat * 3.5, gain: 0.021, pitch: 1080 });
      for (let eighth = 0; eighth < 8; eighth += 1) {
        addNoiseHit(buffer, { at: at + eighth * beat * 0.5, gain: eighth % 2 ? 0.006 : 0.009, seed: 1200 + barIndex * 8 + eighth });
      }
    } else if (track.rhythm === "dino") {
      addDrum(buffer, { at, gain: 0.064, pitch: 57, duration: 0.28, seed: 2000 + barIndex });
      addDrum(buffer, { at: at + beat * 2, gain: 0.044, pitch: 74, duration: 0.2, seed: 2100 + barIndex });
      addWoodblock(buffer, { at: at + beat, gain: 0.018, pitch: 620 });
      addWoodblock(buffer, { at: at + beat * 3, gain: 0.023, pitch: 510 });
      addNoiseHit(buffer, { at: at + beat * 3.5, duration: 0.16, gain: 0.012, dark: true, seed: 2200 + barIndex });
    } else {
      addNoiseHit(buffer, { at, duration: beat * 1.8, gain: 0.008, dark: true, seed: 3000 + barIndex });
      addWoodblock(buffer, { at: at + beat * 2, gain: 0.012, pitch: 1260 });
      if (barIndex % 2 === 1) addWoodblock(buffer, { at: at + beat * 3.25, gain: 0.009, pitch: 1640 });
    }
  }
}

function addWorldAccents(buffer, track) {
  const beat = 60 / track.bpm;
  const bar = beat * 4;
  if (track.id === "meadow") {
    for (let barIndex = 2; barIndex < track.bars; barIndex += 4) {
      addNote(buffer, barIndex % 8 === 2 ? "D6" : "A5", {
        at: barIndex * bar + beat * 2.75,
        duration: beat * 0.7,
        gain: 0.027,
        type: "flute",
        attack: 0.04,
        release: 0.15,
        vibrato: 4.8
      });
    }
  } else if (track.id === "dino") {
    for (let barIndex = 3; barIndex < track.bars; barIndex += 4) {
      ["D3", "A3", "D4"].forEach((note, index) => addNote(buffer, note, {
        at: barIndex * bar + index * beat * 0.5,
        duration: beat * 0.42,
        gain: 0.034 - index * 0.004,
        type: "marimba",
        attack: 0.002,
        release: 0.12,
        decay: 3.2
      }));
    }
  } else {
    for (let barIndex = 1; barIndex < track.bars; barIndex += 4) {
      ["E6", "B5", "F#6"].forEach((note, index) => addNote(buffer, note, {
        at: barIndex * bar + beat * (1.5 + index * 0.75),
        duration: beat * 1.6,
        gain: 0.024 - index * 0.003,
        type: "celesta",
        attack: 0.003,
        release: 0.46,
        decay: 1.3
      }));
    }
  }
}

function circularEcho(buffer, seconds, gain) {
  const dry = buffer.slice();
  const delay = Math.max(1, Math.round(seconds * SAMPLE_RATE));
  for (let index = 0; index < buffer.length; index += 1) {
    const source = (index - delay + buffer.length) % buffer.length;
    buffer[index] += dry[source] * gain;
  }
}

function master(buffer, track) {
  circularEcho(buffer, (60 / track.bpm) * 0.75, track.id === "moonwood" ? 0.19 : 0.11);
  circularEcho(buffer, (60 / track.bpm) * 1.5, track.id === "moonwood" ? 0.1 : 0.055);

  let mean = 0;
  for (const sample of buffer) mean += sample;
  mean /= buffer.length;

  let peak = 0;
  let sumSquares = 0;
  for (let index = 0; index < buffer.length; index += 1) {
    const cleaned = Math.tanh((buffer[index] - mean) * 1.08);
    buffer[index] = cleaned;
    peak = Math.max(peak, Math.abs(cleaned));
    sumSquares += cleaned * cleaned;
  }

  const targetPeak = 0.82;
  const scale = peak > 0 ? targetPeak / peak : 1;
  for (let index = 0; index < buffer.length; index += 1) buffer[index] *= scale;
  return {
    peak: targetPeak,
    rms: Math.sqrt(sumSquares / buffer.length) * scale
  };
}

function writeWav(path, samples) {
  const bytesPerSample = 2;
  const body = Buffer.alloc(samples.length * bytesPerSample);
  for (let index = 0; index < samples.length; index += 1) {
    const value = Math.max(-0.98, Math.min(0.98, samples[index]));
    body.writeInt16LE(Math.round(value * 32767), index * bytesPerSample);
  }

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + body.length, 4);
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
  header.writeUInt32LE(body.length, 40);
  writeFileSync(path, Buffer.concat([header, body]));
}

const TRACKS = [
  {
    id: "meadow",
    filename: "meadow-morning-loop.mp3",
    bpm: 96,
    bars: 16,
    seed: 1041,
    lead: "kalimba",
    leadDecay: 2.1,
    melodyLength: 0.74,
    melodyGain: 0.047,
    padGain: 0.058,
    bassGain: 0.058,
    rhythm: "meadow",
    progression: [
      { bass: "G2", chord: ["G3", "B3", "D4", "A4"] },
      { bass: "D3", chord: ["D4", "F#4", "A4", "E5"] },
      { bass: "E3", chord: ["E4", "G4", "B4", "D5"] },
      { bass: "C3", chord: ["C4", "E4", "G4", "D5"] },
      { bass: "G2", chord: ["G3", "B3", "D4", "A4"] },
      { bass: "B2", chord: ["B3", "D4", "G4", "A4"] },
      { bass: "C3", chord: ["C4", "E4", "G4", "B4"] },
      { bass: "D3", chord: ["D4", "F#4", "A4", "C5"] }
    ],
    melody: ["G5", null, "B5", "A5", null, "G5", "D5", null, "E5", "G5", null, "A5", "B5", null, "A5", null, "D5", null, "G5", "A5", null, "B5", "D6", null, "C6", "B5", null, "G5", "E5", null, "D5", null],
    lift: ["B5", null, "D6", "C6", null, "B5", "G5", null, "G5", "B5", null, "C6", "D6", null, "C6", null, "F#5", null, "B5", "C6", null, "D6", "G6", null, "E6", "D6", null, "B5", "G5", null, "F#5", null]
  },
  {
    id: "dino",
    filename: "fossil-footsteps-loop.mp3",
    bpm: 84,
    bars: 16,
    seed: 2087,
    lead: "marimba",
    leadDecay: 2.8,
    melodyLength: 0.68,
    melodyGain: 0.052,
    padGain: 0.05,
    bassGain: 0.075,
    rhythm: "dino",
    progression: [
      { bass: "D2", chord: ["D3", "A3", "C4", "F4"] },
      { bass: "C2", chord: ["C3", "G3", "Bb3", "E4"] },
      { bass: "G2", chord: ["G3", "D4", "F4", "A4"] },
      { bass: "D2", chord: ["D3", "A3", "C4", "F4"] },
      { bass: "Bb1", chord: ["Bb2", "F3", "A3", "D4"] },
      { bass: "C2", chord: ["C3", "G3", "Bb3", "E4"] },
      { bass: "D2", chord: ["D3", "A3", "C4", "F4"] },
      { bass: "A1", chord: ["A2", "E3", "G3", "C4"] }
    ],
    melody: ["D4", null, "A4", "D5", null, "C5", "A4", null, "F4", "G4", null, "A4", "C5", null, "A4", null, "G4", null, "D5", "C5", null, "A4", "F4", null, "E4", "G4", "A4", null, "D4", null, "A3", null],
    lift: ["F4", null, "C5", "F5", null, "E5", "C5", null, "A4", "Bb4", null, "C5", "E5", null, "C5", null, "Bb4", null, "F5", "E5", null, "C5", "A4", null, "G4", "Bb4", "C5", null, "F4", null, "C4", null]
  },
  {
    id: "moonwood",
    filename: "moonwood-lanterns-loop.mp3",
    bpm: 72,
    bars: 16,
    seed: 3019,
    lead: "celesta",
    leadDecay: 1.45,
    melodyLength: 1.35,
    melodyGain: 0.038,
    padGain: 0.066,
    bassGain: 0.052,
    rhythm: "moonwood",
    progression: [
      { bass: "E2", chord: ["E3", "B3", "D4", "G4"] },
      { bass: "C2", chord: ["C3", "G3", "B3", "E4"] },
      { bass: "G2", chord: ["G3", "D4", "F#4", "B4"] },
      { bass: "D2", chord: ["D3", "A3", "C4", "F#4"] },
      { bass: "E2", chord: ["E3", "B3", "D4", "G4"] },
      { bass: "A1", chord: ["A2", "E3", "G3", "C4"] },
      { bass: "C2", chord: ["C3", "G3", "B3", "E4"] },
      { bass: "B1", chord: ["B2", "F#3", "A3", "D#4"] }
    ],
    melody: ["B5", null, null, "E6", null, "D6", null, null, "G5", null, "B5", null, "A5", null, "F#5", null, "E5", null, "G5", null, "B5", null, "D6", null, "C6", null, "B5", null, "F#5", null, null, null],
    lift: ["D6", null, null, "G6", null, "F#6", null, null, "B5", null, "D6", null, "C6", null, "A5", null, "G5", null, "B5", null, "D6", null, "F#6", null, "E6", null, "D6", null, "A5", null, null, null]
  }
];

/* We synthesise 16-bit PCM, then ship mono MP3: a WAV world theme is ~2MB and these
   loops are the first thing a child downloads when a world opens. ffmpeg is only
   needed to REGENERATE the music - the committed .mp3 files and the check:quest-music
   gate both run without it. */
function encodeMp3(wavPath, mp3Path) {
  try {
    execFileSync(
      "ffmpeg",
      ["-v", "error", "-y", "-i", wavPath, "-codec:a", "libmp3lame", "-b:a", "96k", "-ac", "1", "-ar", String(SAMPLE_RATE), mp3Path],
      { stdio: ["ignore", "ignore", "pipe"] }
    );
  } catch (error) {
    throw new Error(
      `ffmpeg is required to regenerate the quest music (brew install ffmpeg). Underlying error: ${error.message}`
    );
  }
}

function assertMusicLevels(filename, levels) {
  if (levels.peak < 0.72 || levels.peak > 0.9) {
    throw new Error(`${filename} peak ${levels.peak.toFixed(3)} is outside the music target`);
  }
  if (levels.rms < 0.025 || levels.rms > 0.22) {
    throw new Error(`${filename} RMS ${levels.rms.toFixed(3)} is outside the music target`);
  }
}

mkdirSync(OUT_DIR, { recursive: true });

for (const track of TRACKS) {
  const duration = (track.bars * 4 * 60) / track.bpm;
  const buffer = new Float32Array(Math.ceil(duration * SAMPLE_RATE));
  addProgression(buffer, track);
  addMelody(buffer, track);
  addRhythm(buffer, track);
  addWorldAccents(buffer, track);
  const levels = master(buffer, track);
  assertMusicLevels(track.filename, levels);

  const mp3Path = join(OUT_DIR, track.filename);
  const wavPath = `${mp3Path}.tmp.wav`;
  writeWav(wavPath, buffer);
  encodeMp3(wavPath, mp3Path);
  rmSync(wavPath, { force: true });

  console.log(`${mp3Path} ${duration.toFixed(2)}s peak=${levels.peak.toFixed(3)} rms=${levels.rms.toFixed(3)}`);
}
