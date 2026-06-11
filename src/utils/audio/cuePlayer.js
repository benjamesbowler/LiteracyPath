// One voice at a time. Every cue stops whatever was playing first, so
// fast-moving children never hear clips stacked on top of each other.
let currentCue = null;

export function stopCueAudio() {
  if (currentCue) {
    try {
      currentCue.pause();
      currentCue.currentTime = 0;
    } catch {
      // Already stopped.
    }
    currentCue = null;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function playCueAudio(src, { volume = 0.95, onUnavailable } = {}) {
  stopCueAudio();
  if (!src) {
    onUnavailable?.();
    return;
  }
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    currentCue = audio;
    const result = audio.play();
    if (result?.catch) {
      result.catch(() => {
        if (currentCue === audio) currentCue = null;
        onUnavailable?.();
      });
    }
  } catch {
    currentCue = null;
    onUnavailable?.();
  }
}
