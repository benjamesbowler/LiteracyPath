import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SAMPLE_RATE = 44100;
const CHANNELS = 2;
const ROOT = "public/game-assets/quest-pixel/seedwake/audio";
const TWO_PI = Math.PI * 2;

function randomFrom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 0xffffffff;
  };
}

function createBuffer(duration) {
  return new Float64Array(Math.ceil(duration * SAMPLE_RATE));
}

function envelope(t, duration, attack = 0.004, release = 0.08, decay = 0) {
  if (t < 0 || t >= duration) return 0;
  const rise = Math.min(1, t / Math.max(0.0001, attack));
  const fall = Math.min(1, (duration - t) / Math.max(0.0001, release));
  return Math.sin(Math.min(rise, fall) * Math.PI * 0.5) ** 2 * Math.exp(-decay * t);
}

function addTone(buffer, {
  at = 0,
  duration = 0.2,
  from = 440,
  to = from,
  gain = 0.2,
  harmonics = [1],
  attack = 0.004,
  release = 0.08,
  decay = 0
}) {
  const start = Math.max(0, Math.floor(at * SAMPLE_RATE));
  const end = Math.min(buffer.length, Math.ceil((at + duration) * SAMPLE_RATE));
  let phase = 0;
  for (let index = start; index < end; index += 1) {
    const t = index / SAMPLE_RATE - at;
    const progress = t / duration;
    const frequency = from * (to / from) ** progress;
    phase += TWO_PI * frequency / SAMPLE_RATE;
    const body = harmonics.reduce((sum, harmonic, harmonicIndex) => (
      sum + Math.sin(phase * harmonic) / (harmonicIndex + 1)
    ), 0) / Math.max(1, harmonics.length * 0.64);
    buffer[index] += body * envelope(t, duration, attack, release, decay) * gain;
  }
}

function addNoise(buffer, {
  at = 0,
  duration = 0.1,
  gain = 0.08,
  seed = 1,
  colour = 0.2,
  decay = 18
}) {
  const start = Math.max(0, Math.floor(at * SAMPLE_RATE));
  const end = Math.min(buffer.length, Math.ceil((at + duration) * SAMPLE_RATE));
  const random = randomFrom(seed);
  let smooth = 0;
  for (let index = start; index < end; index += 1) {
    const t = index / SAMPLE_RATE - at;
    const raw = random() * 2 - 1;
    smooth += (raw - smooth) * colour;
    buffer[index] += smooth * Math.exp(-t * decay) * gain;
  }
}

function normalise(buffer, ceiling = 0.72) {
  let peak = 0;
  for (const sample of buffer) peak = Math.max(peak, Math.abs(sample));
  const scale = peak > ceiling ? ceiling / peak : 1;
  for (let index = 0; index < buffer.length; index += 1) buffer[index] *= scale;
  return buffer;
}

function wavBytes(samples) {
  const dataBytes = samples.length * CHANNELS * 2;
  const bytes = Buffer.alloc(44 + dataBytes);
  bytes.write("RIFF", 0);
  bytes.writeUInt32LE(36 + dataBytes, 4);
  bytes.write("WAVE", 8);
  bytes.write("fmt ", 12);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(CHANNELS, 22);
  bytes.writeUInt32LE(SAMPLE_RATE, 24);
  bytes.writeUInt32LE(SAMPLE_RATE * CHANNELS * 2, 28);
  bytes.writeUInt16LE(CHANNELS * 2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(dataBytes, 40);
  let offset = 44;
  samples.forEach((sample, index) => {
    const pan = Math.sin(index / SAMPLE_RATE * TWO_PI * 2.1) * 0.035;
    const value = Math.max(-1, Math.min(1, sample));
    bytes.writeInt16LE(Math.round(value * (1 - pan) * 32767), offset);
    bytes.writeInt16LE(Math.round(value * (1 + pan) * 32767), offset + 2);
    offset += 4;
  });
  return bytes;
}

const designs = {
  discover() {
    const sound = createBuffer(0.38);
    addNoise(sound, { duration: 0.18, gain: 0.24, colour: 0.07, decay: 14, seed: 1107 });
    addTone(sound, { at: 0.075, duration: 0.28, from: 620, to: 790, gain: 0.25, harmonics: [1, 2.01, 3.96], decay: 4.2 });
    addTone(sound, { at: 0.14, duration: 0.21, from: 930, to: 1010, gain: 0.12, harmonics: [1, 2.5], decay: 5 });
    return sound;
  },
  hop() {
    const sound = createBuffer(0.34);
    addTone(sound, { duration: 0.2, from: 245, to: 520, gain: 0.32, harmonics: [1, 2], attack: 0.002, release: 0.07, decay: 3.2 });
    addTone(sound, { at: 0.2, duration: 0.12, from: 145, to: 82, gain: 0.25, harmonics: [1, 2.03], release: 0.05, decay: 8 });
    addNoise(sound, { at: 0.205, duration: 0.1, gain: 0.18, colour: 0.11, decay: 24, seed: 2209 });
    return sound;
  },
  interact() {
    const sound = createBuffer(0.2);
    addTone(sound, { duration: 0.16, from: 410, to: 560, gain: 0.3, harmonics: [1, 2.02, 4.1], release: 0.07, decay: 7 });
    addNoise(sound, { duration: 0.075, gain: 0.13, colour: 0.32, decay: 34, seed: 3301 });
    return sound;
  },
  lift() {
    const sound = createBuffer(0.36);
    addNoise(sound, { duration: 0.31, gain: 0.2, colour: 0.055, decay: 5.5, seed: 4411 });
    addTone(sound, { at: 0.04, duration: 0.27, from: 125, to: 245, gain: 0.29, harmonics: [1, 2.01], attack: 0.02, release: 0.1, decay: 2.3 });
    addTone(sound, { at: 0.19, duration: 0.13, from: 520, to: 620, gain: 0.1, harmonics: [1, 2.5], decay: 7 });
    return sound;
  },
  place() {
    const sound = createBuffer(0.3);
    addTone(sound, { duration: 0.22, from: 115, to: 76, gain: 0.35, harmonics: [1, 2.02, 3.08], release: 0.1, decay: 8 });
    addNoise(sound, { duration: 0.14, gain: 0.25, colour: 0.16, decay: 28, seed: 5519 });
    addTone(sound, { at: 0.115, duration: 0.15, from: 480, to: 520, gain: 0.1, harmonics: [1, 2], decay: 8 });
    return sound;
  },
  build() {
    const sound = createBuffer(0.39);
    for (const [at, pitch, gain] of [[0, 760, 0.28], [0.13, 620, 0.31]]) {
      addTone(sound, { at, duration: 0.16, from: pitch, to: pitch * 0.94, gain, harmonics: [1, 3.97, 8.1], release: 0.08, decay: 12 });
      addNoise(sound, { at, duration: 0.07, gain: 0.15, colour: 0.18, decay: 30, seed: 6607 + Math.round(at * 100) });
    }
    addTone(sound, { at: 0.24, duration: 0.13, from: 740, to: 980, gain: 0.11, harmonics: [1, 2], decay: 7 });
    return sound;
  },
  pulse() {
    const sound = createBuffer(0.48);
    addTone(sound, { duration: 0.45, from: 523.25, to: 522, gain: 0.3, harmonics: [1, 2.01, 3.98, 6.12], attack: 0.002, release: 0.18, decay: 3.6 });
    addTone(sound, { at: 0.035, duration: 0.36, from: 783.99, to: 784, gain: 0.16, harmonics: [1, 2.51], release: 0.16, decay: 4.5 });
    return sound;
  },
  wait() {
    const sound = createBuffer(0.22);
    addTone(sound, { duration: 0.075, from: 820, to: 760, gain: 0.22, harmonics: [1, 3.96], release: 0.04, decay: 15 });
    addTone(sound, { at: 0.11, duration: 0.075, from: 920, to: 850, gain: 0.16, harmonics: [1, 3.96], release: 0.04, decay: 15 });
    return sound;
  }
};

const materialDesigns = {
  meadow() {
    const sound = createBuffer(0.32);
    addNoise(sound, { duration: 0.3, gain: 0.25, colour: 0.035, decay: 7, seed: 8101 });
    addTone(sound, { at: 0.11, duration: 0.18, from: 980, to: 1120, gain: 0.1, harmonics: [1, 2.02], decay: 6 });
    return sound;
  },
  river() {
    const sound = createBuffer(0.44);
    addNoise(sound, { duration: 0.4, gain: 0.32, colour: 0.025, decay: 5, seed: 8209 });
    addTone(sound, { at: 0.04, duration: 0.32, from: 175, to: 92, gain: 0.18, harmonics: [1, 2.07], attack: 0.03, decay: 4 });
    return sound;
  },
  fossil() {
    const sound = createBuffer(0.28);
    addNoise(sound, { duration: 0.24, gain: 0.34, colour: 0.12, decay: 16, seed: 8317 });
    addTone(sound, { duration: 0.2, from: 132, to: 72, gain: 0.22, harmonics: [1, 2.95], release: 0.09, decay: 8 });
    return sound;
  },
  forge() {
    const sound = createBuffer(0.4);
    addTone(sound, { duration: 0.38, from: 640, to: 625, gain: 0.27, harmonics: [1, 2.76, 5.38, 8.12], release: 0.18, decay: 4.5 });
    addTone(sound, { at: 0.02, duration: 0.2, from: 1180, to: 1090, gain: 0.1, harmonics: [1, 3.1], decay: 7 });
    return sound;
  },
  glass() {
    const sound = createBuffer(0.46);
    addTone(sound, { duration: 0.44, from: 880, to: 878, gain: 0.23, harmonics: [1, 2.51, 4.13, 6.72], release: 0.2, decay: 3.8 });
    addTone(sound, { at: 0.08, duration: 0.34, from: 1320, to: 1315, gain: 0.12, harmonics: [1, 2.97], decay: 4.5 });
    return sound;
  },
  storm() {
    const sound = createBuffer(0.5);
    addNoise(sound, { duration: 0.48, gain: 0.28, colour: 0.018, decay: 3.8, seed: 8623 });
    addTone(sound, { duration: 0.42, from: 96, to: 64, gain: 0.16, harmonics: [1, 2.03], attack: 0.05, decay: 3 });
    return sound;
  },
  forest() {
    const sound = createBuffer(0.42);
    addTone(sound, { duration: 0.22, from: 510, to: 470, gain: 0.25, harmonics: [1, 3.98, 7.92], release: 0.11, decay: 7 });
    addNoise(sound, { at: 0.08, duration: 0.3, gain: 0.19, colour: 0.04, decay: 8, seed: 8719 });
    return sound;
  },
  star() {
    const sound = createBuffer(0.52);
    addTone(sound, { duration: 0.5, from: 740, to: 760, gain: 0.2, harmonics: [1, 2.03, 4.09], attack: 0.02, release: 0.22, decay: 2.8 });
    addTone(sound, { at: 0.09, duration: 0.4, from: 1110, to: 1140, gain: 0.13, harmonics: [1, 2.52], release: 0.19, decay: 3.4 });
    return sound;
  }
};

mkdirSync(ROOT, { recursive: true });
for (const [name, design] of Object.entries(designs)) {
  const path = join(ROOT, `action-${name}.wav`);
  const bytes = wavBytes(normalise(design()));
  writeFileSync(path, bytes);
  console.log(`${path}: ${(bytes.length / 1024).toFixed(1)}KB`);
}
for (const [name, design] of Object.entries(materialDesigns)) {
  const path = join(ROOT, `material-${name}.wav`);
  const bytes = wavBytes(normalise(design(), 0.62));
  writeFileSync(path, bytes);
  console.log(`${path}: ${(bytes.length / 1024).toFixed(1)}KB`);
}
