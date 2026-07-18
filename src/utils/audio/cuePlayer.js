// One voice at a time. Every cue stops whatever was playing first, so
// fast-moving children never hear clips stacked on top of each other.
import { duckGameMusic, restoreGameMusic } from "./gameMusic.js";
import { setQuestActionSfxInstructionActive } from "../questActionAudio.js";

let currentCue = null;
let currentCueFinish = null;
let cueSuspended = false;
let cueResumeAfterSuspend = false;

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
  currentCueFinish = null;
  cueResumeAfterSuspend = false;
  setQuestActionSfxInstructionActive(false);
  restoreGameMusic();
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
    setQuestActionSfxInstructionActive(true);
    const finish = () => {
      if (currentCue !== audio) return;
      currentCue = null;
      currentCueFinish = null;
      cueResumeAfterSuspend = false;
      setQuestActionSfxInstructionActive(false);
      restoreGameMusic();
    };
    currentCueFinish = finish;
    audio.addEventListener("ended", finish, { once: true });
    audio.addEventListener("error", finish, { once: true });
    if (cueSuspended) {
      cueResumeAfterSuspend = true;
      return;
    }
    duckGameMusic();
    const result = audio.play();
    if (result?.catch) {
      result.catch(() => {
        finish();
        onUnavailable?.();
      });
    }
  } catch {
    currentCue = null;
    currentCueFinish = null;
    cueResumeAfterSuspend = false;
    setQuestActionSfxInstructionActive(false);
    restoreGameMusic();
    onUnavailable?.();
  }
}

export function setCueAudioSuspended(suspended = true) {
  const next = Boolean(suspended);
  if (cueSuspended === next) return cueSuspended;
  cueSuspended = next;
  if (cueSuspended) {
    if (currentCue) {
      cueResumeAfterSuspend = true;
      currentCue.pause();
    }
    return cueSuspended;
  }

  if (!currentCue || !cueResumeAfterSuspend) return cueSuspended;
  const audio = currentCue;
  const finish = currentCueFinish;
  cueResumeAfterSuspend = false;
  duckGameMusic();
  try {
    const result = audio.play();
    if (result?.catch) result.catch(() => {
      if (currentCue === audio) finish?.();
    });
  } catch {
    if (currentCue === audio) finish?.();
  }
  return cueSuspended;
}
