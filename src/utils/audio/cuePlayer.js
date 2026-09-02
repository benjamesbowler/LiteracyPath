// One voice at a time. Every cue stops whatever was playing first, so
// fast-moving children never hear clips stacked on top of each other.
import { duckGameMusic, restoreGameMusic } from "./gameMusic.js";
import { setQuestActionSfxInstructionActive } from "../questActionAudio.js";
import { applyLearnerAudioIntensity } from "../../accessibility/learnerAccessibility.js";

let currentCue = null;
let currentCueInterrupted = null;
let cueSuspended = false;
let cueResumeAfterSuspend = false;
let sharedCueElement = null;
let cueListeners = [];
let cueSequenceVersion = 0;
let cueSequenceTimer = null;

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

function cancelCueSequence() {
  cueSequenceVersion += 1;
  if (cueSequenceTimer !== null && typeof window !== "undefined") {
    window.clearTimeout?.(cueSequenceTimer);
  }
  cueSequenceTimer = null;
}

function stopCuePlayback({ preserveSequence = false } = {}) {
  if (!preserveSequence) cancelCueSequence();
  const interrupted = currentCueInterrupted;
  currentCueInterrupted = null;
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
  cueResumeAfterSuspend = false;
  setQuestActionSfxInstructionActive(false);
  restoreGameMusic();
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  interrupted?.();
}

export function stopCueAudio() {
  stopCuePlayback();
}

function playCueAudioInternal(
  src,
  { volume = 0.95, onUnavailable, onEnded, onInterrupted } = {},
  preserveSequence = false
) {
  stopCuePlayback({ preserveSequence });
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
    currentCueInterrupted = onInterrupted || null;
    setQuestActionSfxInstructionActive(true);
    const finish = () => {
      if (currentCue !== audio) return;
      currentCue = null;
      currentCueInterrupted = null;
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
    const ended = () => {
      finish();
      onEnded?.();
    };
    listenForCue("ended", ended, { once: true });
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
    currentCueInterrupted = null;
    cueResumeAfterSuspend = false;
    setQuestActionSfxInstructionActive(false);
    restoreGameMusic();
    onUnavailable?.();
  }
}

export function playCueAudio(src, options = {}) {
  playCueAudioInternal(src, options);
}

// Play clips back to back with a small breath between — the blend fallback
// ("st" = /s/ then /t/, said quickly) and any future phoneme-then-name
// sequence. One-voice rule holds: if anything else grabs the voice mid-chain,
// the chain stops instead of talking over it.
export function playCueSequence(srcs = [], { volume = 0.95, gapMs = 150 } = {}) {
  const queue = (srcs || []).filter(Boolean);
  if (!queue.length) return;
  cancelCueSequence();
  const sequenceVersion = cueSequenceVersion;
  let index = 0;
  const playNext = () => {
    if (sequenceVersion !== cueSequenceVersion) return;
    if (index >= queue.length) return;
    const src = queue[index];
    index += 1;
    let advanced = false;
    const advance = () => {
      if (advanced || index >= queue.length) return;
      advanced = true;
      cueSequenceTimer = window.setTimeout(() => {
        cueSequenceTimer = null;
        if (sequenceVersion === cueSequenceVersion && currentCue === null) playNext();
      }, gapMs);
    };
    playCueAudioInternal(src, { volume, onUnavailable: advance }, true);
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
  cueResumeAfterSuspend = false;
  duckGameMusic();
  try {
    const result = audio.play();
    if (result?.catch) result.catch(() => {
      if (currentCue === audio) stopCuePlayback();
    });
  } catch {
    if (currentCue === audio) stopCuePlayback();
  }
  return cueSuspended;
}
