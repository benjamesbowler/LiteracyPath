let audioContext = null;

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
  gainNode.gain.setValueAtTime(volume, context.currentTime + startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + startTime + duration);

  oscillator.start(context.currentTime + startTime);
  oscillator.stop(context.currentTime + startTime + duration);
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
    sound.volume = volume;
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
  if (audioContext?.state === "running") {
    audioContext.suspend().catch(() => {});
  }
}
