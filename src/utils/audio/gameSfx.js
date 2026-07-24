import { applyLearnerAudioIntensity } from "../../accessibility/learnerAccessibility.js";

let audioContext = null;
let activeMusic = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

function playTone(frequency, duration, type = "sine", startTime = 0, volume = 0.2) {
  const context = getAudioContext();
  if (!context) return;

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;
  gainNode.gain.setValueAtTime(applyLearnerAudioIntensity(volume), context.currentTime + startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + startTime + duration);

  oscillator.start(context.currentTime + startTime);
  oscillator.stop(context.currentTime + startTime + duration);
}

function createNoiseBuffer(context, duration = 0.08) {
  const length = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function pulseOscillator(context, output, { frequency, start, duration, type = "square", volume = 0.1, endFrequency = frequency }) {
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
  gain.gain.setValueAtTime(applyLearnerAudioIntensity(volume), start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain);
  gain.connect(output);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function pulseNoise(context, output, { start, duration = 0.06, volume = 0.08, filter = 7000 }) {
  const source = context.createBufferSource();
  const gain = context.createGain();
  const band = context.createBiquadFilter();
  source.buffer = createNoiseBuffer(context, duration);
  band.type = "highpass";
  band.frequency.setValueAtTime(filter, start);
  gain.gain.setValueAtTime(applyLearnerAudioIntensity(volume), start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  source.connect(band);
  band.connect(gain);
  gain.connect(output);
  source.start(start);
  source.stop(start + duration + 0.02);
}

export function startSoundBeatMusic({ bpm = 96, volume = 0.14 } = {}) {
  const context = getAudioContext();
  if (!context) return null;
  if (activeMusic) activeMusic.stop();

  const master = context.createGain();
  master.gain.setValueAtTime(0.001, context.currentTime);
  master.gain.exponentialRampToValueAtTime(
    Math.max(0.001, applyLearnerAudioIntensity(volume)),
    context.currentTime + 0.35
  );
  master.connect(context.destination);

  const stepSeconds = 60 / Math.max(70, Math.min(150, bpm)) / 2;
  const bass = [98, 98, 146.83, 98, 130.81, 98, 164.81, 146.83, 98, 98, 146.83, 196, 174.61, 146.83, 130.81, 98];
  const lead = [392, 0, 493.88, 0, 587.33, 0, 493.88, 0, 440, 0, 523.25, 0, 659.25, 587.33, 493.88, 0];
  let step = 0;
  let stopped = false;

  function scheduleStep() {
    if (stopped) return;
    const start = context.currentTime + 0.025;
    if (step % 4 === 0) {
      pulseOscillator(context, master, { frequency: 70, endFrequency: 36, start, duration: 0.16, type: "sine", volume: 0.28 });
    }
    if (step % 8 === 4) {
      pulseNoise(context, master, { start, duration: 0.12, volume: 0.13, filter: 1100 });
    }
    if (step % 2 === 1) {
      pulseNoise(context, master, { start, duration: 0.04, volume: 0.055, filter: 6500 });
    }
    pulseOscillator(context, master, {
      frequency: bass[step],
      endFrequency: bass[step] * 0.996,
      start,
      duration: 0.11,
      type: "sawtooth",
      volume: step % 4 === 0 ? 0.075 : 0.045
    });
    if (lead[step] && step % 2 === 0) {
      pulseOscillator(context, master, {
        frequency: lead[step],
        endFrequency: lead[step] * 1.01,
        start: start + 0.015,
        duration: 0.08,
        type: "triangle",
        volume: 0.036
      });
    }
    step = (step + 1) % 16;
  }

  scheduleStep();
  const timer = window.setInterval(scheduleStep, stepSeconds * 1000);
  activeMusic = {
    stop() {
      if (stopped) return;
      stopped = true;
      window.clearInterval(timer);
      const now = context.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(0.001, master.gain.value || 0.001), now);
      master.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      window.setTimeout(() => master.disconnect(), 240);
      if (activeMusic === this) activeMusic = null;
    }
  };
  return activeMusic;
}

// Recorded UI sounds (public/audio/ui). Each falls back to the original
// synth tones if the file is missing or playback is blocked.
const soundFileCache = {};

function playSoundFile(name, fallback, volume = 0.55) {
  if (typeof window === "undefined") return;
  try {
    let base = soundFileCache[name];
    if (!base) {
      base = new Audio(`/audio/ui/${name}.mp3`);
      base.preload = "auto";
      soundFileCache[name] = base;
    }
    const sound = base.cloneNode();
    sound.volume = applyLearnerAudioIntensity(volume);
    const result = sound.play();
    if (result?.catch) result.catch(() => fallback?.());
  } catch {
    fallback?.();
  }
}

export function playCorrectChime() {
  playSoundFile("correct", () => {
    playTone(523.25, 0.16, "sine", 0, 0.22);
    playTone(659.25, 0.16, "sine", 0.12, 0.2);
    playTone(783.99, 0.22, "sine", 0.24, 0.18);
  });
}

export function playSoftBuzz() {
  playSoundFile("incorrect", () => {
    playTone(180, 0.18, "sawtooth", 0, 0.12);
    playTone(150, 0.18, "sawtooth", 0.1, 0.1);
  }, 0.45);
}

export function playPopSound() {
  playSoundFile("pop", () => {
    playTone(880, 0.08, "triangle", 0, 0.18);
    playTone(1320, 0.08, "triangle", 0.04, 0.12);
  });
}

export function playCelebrationFanfare() {
  playSoundFile("complete", () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      playTone(frequency, 0.18, "sine", index * 0.12, 0.18);
    });
  }, 0.6);
}

export function playStarChime() {
  playSoundFile("star", () => {
    playTone(1046.5, 0.2, "sine", 0, 0.16);
  });
}

export function playTapSound() {
  playSoundFile("tap", null, 0.35);
}

export function playCardFlip() {
  playSoundFile("card-flip", null, 0.4);
}

export function playWhoosh() {
  playSoundFile("whoosh", null, 0.4);
}

export function playTrainWhistle() {
  playTone(392, 0.35, "sine", 0, 0.16);
  playTone(523.25, 0.45, "sine", 0.24, 0.14);
}

export function cancelGameSfx() {
  if (activeMusic) activeMusic.stop();
  if (audioContext?.state === "running") {
    audioContext.suspend().catch(() => {});
  }
}
