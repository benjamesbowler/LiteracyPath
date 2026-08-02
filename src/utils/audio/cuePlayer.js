// One voice at a time. Every cue stops whatever was playing first, so
// fast-moving children never hear clips stacked on top of each other.
import { duckGameMusic, restoreGameMusic } from "./gameMusic.js";
import { setQuestActionSfxInstructionActive } from "../questActionAudio.js";
import { applyLearnerAudioIntensity } from "../../accessibility/learnerAccessibility.js";

let currentCue = null;
let currentCueFinish = null;
let cueSuspended = false;
let cueResumeAfterSuspend = false;
let sharedCueElement = null;
let cueListeners = [];

function getSharedCueElement() {
  if (!sharedCueElement) {
    sharedCueElement = new Audio();
    sharedCueElement.preload = "auto";
  }
  return sharedCueElement;
}

function clearCueListeners() {
  if (!sharedCueElement) return;
  cueListeners.forEach(([type, listener]) => sharedCueElement.removeEventListener?.(type, listener));
  cueListeners = [];
}

function listenForCue(type, listener, options) {
  const audio = getSharedCueElement();
  audio.addEventListener(type, listener, options);
  cueListeners.push([type, listener]);
}

export function stopCueAudio() {
  clearCueListeners();
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
    const audio = getSharedCueElement();
    audio.pause();
    audio.currentTime = 0;
    audio.src = src;
    audio.load?.();
    audio.volume = applyLearnerAudioIntensity(volume);
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
    let unavailableNotified = false;
    const unavailable = () => {
      if (currentCue !== audio || unavailableNotified) return;
      unavailableNotified = true;
      finish();
      onUnavailable?.();
    };
    currentCueFinish = finish;
    listenForCue("ended", finish, { once: true });
    listenForCue("error", unavailable, { once: true });
    if (cueSuspended) {
      cueResumeAfterSuspend = true;
      return;
    }
    duckGameMusic();
    const result = audio.play();
    if (result?.catch) {
      result.catch(unavailable);
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

// Play clips back to back with a small breath between — the blend fallback
// ("st" = /s/ then /t/, said quickly) and any future phoneme-then-name
// sequence. One-voice rule holds: if anything else grabs the voice mid-chain,
// the chain stops instead of talking over it.
export function playCueSequence(srcs = [], { volume = 0.95, gapMs = 150 } = {}) {
  const queue = (srcs || []).filter(Boolean);
  if (!queue.length) return;
  let index = 0;
  const playNext = () => {
    if (index >= queue.length) return;
    const src = queue[index];
    index += 1;
    let advanced = false;
    const advance = () => {
      if (advanced || index >= queue.length) return;
      advanced = true;
      window.setTimeout(() => {
        if (currentCue === null) playNext();
      }, gapMs);
    };
    playCueAudio(src, { volume, onUnavailable: advance });
    const audio = currentCue;
    if (!audio) {
      advance();
      return;
    }
    listenForCue("ended", advance, { once: true });
    listenForCue("error", advance, { once: true });
  };
  playNext();
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
