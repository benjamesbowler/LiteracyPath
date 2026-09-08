// One voice at a time. Every cue stops whatever was playing first, so
// fast-moving children never hear clips stacked on top of each other.
import { duckGameMusic, restoreGameMusic } from "./gameMusic.js";
import { setQuestActionSfxInstructionActive } from "../questActionAudio.js";
import { applyLearnerAudioIntensity } from "../../accessibility/learnerAccessibility.js";

let currentCue = null;
let currentCueFinish = null;
let currentCueDelivery = null;
let currentCueSession = 0;
let currentCueId = null;
let cueSuspended = false;
let cueResumeAfterSuspend = false;
let sharedCueElement = null;
let cueListeners = [];
let cueListenerElement = null;
let cueSequenceVersion = 0;
let cueSequenceTimer = null;
let cueSequenceSession = 0;
let activeCueSequence = null;
const warmedCueCache = new Map();
// A retention bound, not a claim about physical-device memory or latency.
// Explicit current/next windows and the active voice/sequence are additional.
export const MAX_IDLE_WARMED_CUES = 32;
const retainedCueSources = new Map();
let sequenceCueSources = new Set();

function isCueProtected(src, entry) {
  return entry.audio === currentCue || retainedCueSources.has(src) || sequenceCueSources.has(src);
}

function releaseWarmedEntry(src, entry) {
  if (warmedCueCache.get(src) !== entry) return;
  warmedCueCache.delete(src);
  entry.cancel?.();
  try {
    entry.audio.pause();
    entry.audio.removeAttribute?.("src");
    if (!entry.audio.removeAttribute) entry.audio.src = "";
    entry.audio.load?.();
  } catch {
    // A failed element must not prevent the rest of the window releasing.
  }
}

function trimWarmedCues() {
  const idle = [];
  for (const [src, entry] of warmedCueCache) {
    if (isCueProtected(src, entry)) continue;
    if (entry.failed || entry.released) releaseWarmedEntry(src, entry);
    else idle.push([src, entry]);
  }
  idle.slice(0, Math.max(0, idle.length - MAX_IDLE_WARMED_CUES))
    .forEach(([src, entry]) => releaseWarmedEntry(src, entry));
}

/** Retain one consumer's exact current/next window; release never stops speech. */
export function retainCueAudioSources(srcs = []) {
  const sources = new Set(srcs.map(normalizeCueSource).filter(Boolean));
  sources.forEach(src => {
    retainedCueSources.set(src, (retainedCueSources.get(src) || 0) + 1);
    const entry = warmedCueCache.get(src);
    if (entry) entry.released = false;
  });
  let released = false;
  return () => {
    if (released) return;
    released = true;
    sources.forEach(src => {
      const count = retainedCueSources.get(src) || 0;
      if (count > 1) retainedCueSources.set(src, count - 1);
      else {
        retainedCueSources.delete(src);
        const entry = warmedCueCache.get(src);
        if (entry) entry.released = true;
      }
    });
    trimWarmedCues();
  };
}

function getSharedCueElement() {
  if (!sharedCueElement) {
    sharedCueElement = new Audio();
    sharedCueElement.preload = "auto";
  }
  return sharedCueElement;
}

function clearCueListeners() {
  if (!cueListenerElement) return;
  cueListeners.forEach(([type, listener]) => cueListenerElement.removeEventListener?.(type, listener));
  cueListeners = [];
  cueListenerElement = null;
}

function listenForCue(type, listener, options) {
  const audio = currentCue || getSharedCueElement();
  audio.addEventListener(type, listener, options);
  cueListeners.push([type, listener]);
  cueListenerElement = audio;
}

function normalizeCueSource(src) {
  return typeof src === "string" ? src.trim() : "";
}

/**
 * Keep the media element that warmed a cue so playback can reuse its loaded
 * media pipeline. Reassigning a single shared element and calling load() for
 * every tap was visible as a cold-start pause on iPad Safari, even when the
 * browser HTTP cache already contained the MP3.
 */
export function preloadCueAudio(src) {
  const normalized = normalizeCueSource(src);
  if (!normalized || typeof Audio === "undefined") return Promise.resolve(false);

  const existing = warmedCueCache.get(normalized);
  if (existing && !existing.failed) {
    warmedCueCache.delete(normalized);
    warmedCueCache.set(normalized, existing);
    return existing.promise;
  }
  // A failed active element finishes through its existing playback owner.
  if (existing?.audio === currentCue) return existing.promise;
  if (existing) releaseWarmedEntry(normalized, existing);

  let audio;
  try {
    audio = new Audio();
    audio.preload = "auto";
  } catch {
    return Promise.resolve(false);
  }

  const entry = { audio, failed: false, ready: false, promise: null };
  warmedCueCache.set(normalized, entry);
  entry.promise = new Promise(resolve => {
    let settled = false;
    let timeoutId = null;
    const finish = ok => {
      if (settled) return;
      settled = true;
      if (timeoutId && typeof window !== "undefined") window.clearTimeout?.(timeoutId);
      audio.removeEventListener?.("canplay", onReady);
      audio.removeEventListener?.("error", onError);
      entry.ready = ok;
      entry.failed = !ok;
      resolve(ok);
      if (!ok && currentCue !== audio) releaseWarmedEntry(normalized, entry);
    };
    entry.cancel = () => finish(false);
    const onReady = () => finish(true);
    const onError = () => finish(false);
    audio.addEventListener?.("canplay", onReady, { once: true });
    audio.addEventListener?.("error", onError, { once: true });
    if (typeof window !== "undefined" && typeof window.setTimeout === "function") {
      timeoutId = window.setTimeout(() => finish(false), 8000);
    }
    try {
      audio.src = normalized;
      audio.load?.();
      if (audio.readyState >= 3) finish(true);
    } catch {
      finish(false);
    }
  });
  trimWarmedCues();
  return entry.promise;
}

function getWarmedCueEntry(src) {
  const normalized = normalizeCueSource(src);
  const entry = warmedCueCache.get(normalized);
  if (!entry || entry.failed) return null;
  warmedCueCache.delete(normalized);
  warmedCueCache.set(normalized, entry);
  return entry;
}

function getWarmedCueElement(src) {
  const entry = getWarmedCueEntry(src);
  return entry?.ready ? entry.audio : null;
}

function reportSequenceDelivery(sequence, type) {
  sequence?.onDelivery?.({
    id: sequence.cueId,
    session: sequence.session,
    type,
    at: Date.now()
  });
}

function finishCueSequence(sequence, type) {
  if (!sequence || sequence.finished || activeCueSequence !== sequence) return;
  sequence.finished = true;
  reportSequenceDelivery(sequence, type);
  activeCueSequence = null;
}

function cancelCueSequence({ interrupt = true } = {}) {
  cueSequenceVersion += 1;
  sequenceCueSources = new Set();
  if (cueSequenceTimer !== null && typeof window !== "undefined") {
    window.clearTimeout?.(cueSequenceTimer);
  }
  cueSequenceTimer = null;
  if (interrupt) finishCueSequence(activeCueSequence, "interrupted");
}

function reportCueDelivery(type, { id = currentCueId, session = currentCueSession, delivery = currentCueDelivery } = {}) {
  delivery?.({ id, session, type, at: Date.now() });
}

function stopCuePlayback({ preserveSequence = false } = {}) {
  if (!preserveSequence) cancelCueSequence();
  clearCueListeners();
  if (currentCueId !== null) reportCueDelivery("interrupted");
  if (currentCue) {
    try {
      currentCue.pause();
      currentCue.currentTime = 0;
    } catch {
      // Already stopped.
    }
    currentCue = null;
  }
  currentCueSession += 1;
  currentCueFinish = null;
  currentCueDelivery = null;
  currentCueId = null;
  cueResumeAfterSuspend = false;
  trimWarmedCues();
  setQuestActionSfxInstructionActive(false);
  restoreGameMusic();
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function stopCueAudio() {
  stopCuePlayback();
}

function playCueAudioInternal(src, {
  volume = 0.95,
  onUnavailable,
  onDelivery,
  onEnded,
  onInterrupted,
  onError,
  cueId = src,
  playImmediately = false
} = {}, preserveSequence = false) {
  stopCuePlayback({ preserveSequence });
  if (!src) {
    onDelivery?.({ id: String(cueId || ""), session: currentCueSession + 1, type: "unavailable", at: Date.now() });
    onUnavailable?.();
    return;
  }

  const session = currentCueSession + 1;
  currentCueSession = session;
  const deliveryId = String(cueId || src);
  currentCueId = deliveryId;
  const deliver = event => {
    onDelivery?.(event);
    if (event.type === "completed") onEnded?.(event);
    if (event.type === "interrupted") onInterrupted?.(event);
    if (event.type === "failed") {
      onError?.(event);
      // A failed resume is also an interruption from the child's point of
      // view. Keep the legacy callback truthful for model-replay consumers.
      onInterrupted?.(event);
    }
  };
  currentCueDelivery = deliver;
  const ownsSession = () => currentCueSession === session && currentCueId === deliveryId;
  let ownedAudio = null;
  const ownsCue = () => ownsSession() && currentCue === ownedAudio;
  const finish = (type = "completed") => {
    if (!ownsSession()) return;
    if (type !== "completed" && currentCue) {
      try {
        currentCue.pause();
      } catch {
        // A failed media element may reject cleanup too.
      }
    }
    clearCueListeners();
    currentCue = null;
    currentCueFinish = null;
    currentCueDelivery = null;
    currentCueId = null;
    cueResumeAfterSuspend = false;
    trimWarmedCues();
    setQuestActionSfxInstructionActive(false);
    restoreGameMusic();
    reportCueDelivery(type, { id: deliveryId, session, delivery: deliver });
  };
  let unavailableNotified = false;
  const unavailable = () => {
    if (!ownsSession() || unavailableNotified) return;
    unavailableNotified = true;
    finish("failed");
    onUnavailable?.();
  };
  currentCueFinish = finish;
  reportCueDelivery("loading", { id: deliveryId, session, delivery: deliver });

  try {
    const warmedEntry = getWarmedCueEntry(src);
    const warmedAudio = getWarmedCueElement(src);
    const audio = warmedAudio || warmedEntry?.audio || getSharedCueElement();
    const usesWarmedAudio = Boolean(warmedEntry);
    if (!ownsSession()) return;
    ownedAudio = audio;
    currentCue = audio;
    audio.pause();
    if (!ownsCue()) return;
    audio.currentTime = 0;
    if (!ownsCue()) return;
    if (!usesWarmedAudio) {
      audio.src = src;
      if (!ownsCue()) return;
      audio.load?.();
      if (!ownsCue()) return;
    }
    audio.volume = applyLearnerAudioIntensity(volume);
    if (!ownsCue()) return;
    setQuestActionSfxInstructionActive(true);
    if (!ownsCue()) return;
    listenForCue("ended", () => finish("completed"), { once: true });
    if (!ownsCue()) return;
    listenForCue("error", unavailable, { once: true });
    if (!ownsCue()) return;
    const startPlayback = () => {
      if (!ownsCue()) return;
      if (cueSuspended) {
        cueResumeAfterSuspend = true;
        return;
      }
      duckGameMusic();
      const result = audio.play();
      if (result?.catch) {
        result.then(() => {
          if (ownsCue()) reportCueDelivery("started", { id: deliveryId, session, delivery: deliver });
        }).catch(unavailable);
      } else {
        if (ownsCue()) reportCueDelivery("started", { id: deliveryId, session, delivery: deliver });
      }
    };
    if (warmedEntry && !warmedEntry.ready && !playImmediately) {
      warmedEntry.promise.then(ready => {
        if (!ownsCue()) return;
        if (!ready) {
          unavailable();
          return;
        }
        startPlayback();
      }).catch(unavailable);
      return;
    }
    startPlayback();
  } catch {
    unavailable();
  }
}

export function playCueAudio(src, options = {}) {
  playCueAudioInternal(src, options);
}

// Play clips back to back with a small breath between — the blend fallback
// ("st" = /s/ then /t/, said quickly) and any future phoneme-then-name
// sequence. One-voice rule holds: if anything else grabs the voice mid-chain,
// the chain stops instead of talking over it.
export function playCueSequence(srcs = [], {
  volume = 0.95,
  gapMs = 150,
  onDelivery,
  onItemDelivery: onItemDiagnostic,
  onStarted,
  onUnavailable,
  cueId = "cue-sequence",
  playImmediately = false
} = {}) {
  const queue = (srcs || []).filter(Boolean);
  if (!queue.length) return;
  cancelCueSequence();
  sequenceCueSources = new Set(queue.map(normalizeCueSource));
  const sequenceVersion = cueSequenceVersion;
  const sequence = {
    cueId: String(cueId),
    session: cueSequenceSession + 1,
    onDelivery,
    onStarted,
    onUnavailable,
    finished: false,
    started: false
  };
  cueSequenceSession = sequence.session;
  activeCueSequence = sequence;
  reportSequenceDelivery(sequence, "loading");
  let index = 0;
  const playNext = () => {
    if (sequenceVersion !== cueSequenceVersion) return;
    if (index >= queue.length) {
      sequenceCueSources = new Set();
      trimWarmedCues();
      if (activeCueSequence === sequence) finishCueSequence(sequence, "completed");
      return;
    }
    const src = queue[index];
    index += 1;
    const itemCueId = `${cueId}:${index}`;
    const handleItemDelivery = event => {
      onItemDiagnostic?.(event);
      if (sequenceVersion !== cueSequenceVersion) return;
      if (index >= queue.length && ["completed", "failed", "interrupted"].includes(event.type)) {
        sequenceCueSources = new Set();
        trimWarmedCues();
      }
      const ownsAggregate = activeCueSequence === sequence && !sequence.finished;
      if (event.type === "started" && ownsAggregate && !sequence.started) {
        sequence.started = true;
        reportSequenceDelivery(sequence, "started");
        sequence.onStarted?.({
          id: sequence.cueId,
          session: sequence.session,
          type: "started",
          at: Date.now()
        });
      }
      if (event.type === "failed" || event.type === "interrupted") {
        if (ownsAggregate) {
          finishCueSequence(sequence, event.type);
          if (event.type === "failed") {
            sequence.onUnavailable?.({
              id: sequence.cueId,
              session: sequence.session,
              type: "failed",
              at: Date.now()
            });
          }
        }
        // Older callers rely on a failed recording trying the next source. It
        // remains diagnostic-only once the aggregate has truthfully failed.
        if (event.type === "failed" && index < queue.length) {
          cueSequenceTimer = window.setTimeout(() => {
            cueSequenceTimer = null;
            playNext();
          }, gapMs);
        }
        return;
      }
      if (event.type !== "completed") return;
      if (index >= queue.length) {
        if (ownsAggregate) finishCueSequence(sequence, "completed");
        return;
      }
      cueSequenceTimer = window.setTimeout(() => {
        cueSequenceTimer = null;
        playNext();
      }, gapMs);
    };
    playCueAudioInternal(src, {
      volume,
      cueId: itemCueId,
      onDelivery: handleItemDelivery,
      playImmediately
    }, true);
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
  const session = currentCueSession;
  const cueId = currentCueId;
  const delivery = currentCueDelivery;
  const ownsCue = () => currentCue === audio && currentCueSession === session && currentCueId === cueId;
  cueResumeAfterSuspend = false;
  duckGameMusic();
  try {
    const result = audio.play();
    if (result?.catch) result.then(() => {
      if (ownsCue()) reportCueDelivery("started", { id: cueId, session, delivery });
    }).catch(() => {
      if (ownsCue()) finish?.("failed");
    });
    else if (ownsCue()) reportCueDelivery("started", { id: cueId, session, delivery });
  } catch {
    if (ownsCue()) finish?.("failed");
  }
  return cueSuspended;
}
