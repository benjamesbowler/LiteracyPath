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

export function playCorrectChime() {
  playTone(523.25, 0.16, "sine", 0, 0.22);
  playTone(659.25, 0.16, "sine", 0.12, 0.2);
  playTone(783.99, 0.22, "sine", 0.24, 0.18);
}

export function playSoftBuzz() {
  playTone(180, 0.18, "sawtooth", 0, 0.12);
  playTone(150, 0.18, "sawtooth", 0.1, 0.1);
}

export function playPopSound() {
  playTone(880, 0.08, "triangle", 0, 0.18);
  playTone(1320, 0.08, "triangle", 0.04, 0.12);
}

export function playCelebrationFanfare() {
  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
    playTone(frequency, 0.18, "sine", index * 0.12, 0.18);
  });
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
