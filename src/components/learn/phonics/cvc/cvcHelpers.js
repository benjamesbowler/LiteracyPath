import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getChildWordAsset } from "../../../../data/childAssets.js";
import { getCvcWordGraphemes, getGraphemeAudioPath } from "../../../../data/cvcWordFamilies.js";
import { playPhonicsAudio } from "../../../../hooks/usePhonicsAudio.js";

export const CVC_SOUND_DELAY = 720;
export const CVC_SOUND_GAP = 90;
export const CVC_PLAYBACK_TIMEOUT = 4000;
const CVC_VOWELS = new Set(["a", "e", "i", "o", "u"]);
const VOWEL_SOUND_FALLBACKS = {
  a: "ah",
  e: "eh",
  i: "ih",
  o: "oh",
  u: "uh"
};

export function makeCvcWordModel(word, family) {
  const asset = getChildWordAsset(word, { allowBlockedAssessmentImage: true }) || {};
  void family;
  const letters = getCvcWordGraphemes(word);

  return {
    word,
    image: asset.image || asset.fallbackImage || "",
    audio: asset.audio || "",
    alt: asset.alt || `Picture for ${word}`,
    letters
  };
}

export function makeCvcWordModels(words, family) {
  return words.map(word => makeCvcWordModel(word, family));
}

function hashMagicSeed(seed) {
  return [...String(seed)].reduce((hash, character) => (
    Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0
  ), 2166136261);
}

function shuffleMagicChoices(items, seed) {
  const copy = [...items];
  let state = hashMagicSeed(seed);
  for (let index = copy.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function getMagicTargetModel(wordModels, currentIndex) {
  const nextIndex = currentIndex + 1;
  if (wordModels[nextIndex]) return { model: wordModels[nextIndex], index: nextIndex, reverse: false };
  if (wordModels.length === 2 && currentIndex === 1) {
    return { model: wordModels[0], index: 0, reverse: true };
  }
  return { model: null, index: -1, reverse: false };
}

// Word Magic keeps the authored family data: the next word is the target,
// while the remaining family words are plausible alternatives. A two-word
// family gets one authored reverse round so it still ends with a deliberate
// grapheme choice. The stable round seed varies placement without making the
// answer's slot predictable.
// Never invent a grapheme or vocabulary item here; the family picker has
// already established that every model is taught and asset-backed.
export function getMagicChoiceModels(wordModels, currentIndex, roundSeed = 0) {
  const { model: target, index: targetIndex, reverse } = getMagicTargetModel(wordModels, currentIndex);
  if (!target) return [];
  const current = wordModels[currentIndex];
  if (!getMagicTransition(current, target)) return [];
  const alternatives = wordModels.filter((word, index) => (
    index !== currentIndex
    && index !== targetIndex
    && getMagicTransition(current, word)
  ));
  if (reverse) alternatives.push(current);
  return shuffleMagicChoices([
    target,
    ...alternatives
  ], `${roundSeed}:${currentIndex}`);
}

export function getMagicTransition(currentWord, targetWord) {
  if (!currentWord || !targetWord || !Array.isArray(currentWord.letters) || !Array.isArray(targetWord.letters)
    || currentWord.letters.length !== targetWord.letters.length) return null;
  const changedIndices = currentWord.letters.reduce((indices, letter, index) => (
    letter === targetWord.letters[index] ? indices : [...indices, index]
  ), []);
  if (changedIndices.length !== 1) return null;
  const index = changedIndices[0];
  const unitLabel = index === 0 ? "first sound" : index === currentWord.letters.length - 1 ? "last sound" : "middle sound";
  return { index, unitLabel, from: currentWord.letters[index], to: targetWord.letters[index] };
}

export async function resolveCvcPlayback(playback, timeout = CVC_PLAYBACK_TIMEOUT) {
  if (!playback || typeof playback.then !== "function") return "unavailable";
  let timeoutId;
  try {
    return await Promise.race([
      playback,
      new Promise(resolve => {
        timeoutId = setTimeout(() => {
          playback.cancel?.("unavailable");
          resolve("unavailable");
        }, timeout);
      })
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}

export function useCvcSoundCue() {
  const [isPlaying, setIsPlaying] = useState(false);
  const cueRequestRef = useRef(0);
  const playbackRef = useRef(null);

  const playCue = useCallback((src, fallbackText) => {
    void fallbackText;
    const request = cueRequestRef.current + 1;
    cueRequestRef.current = request;
    playbackRef.current = playPhonicsAudio(src || "", {
      onStart: () => {
        if (cueRequestRef.current === request) setIsPlaying(true);
      },
      onFinish: () => {
        if (cueRequestRef.current === request) setIsPlaying(false);
      }
    });
    return playbackRef.current;
  }, []);

  const stopCue = useCallback(() => {
    cueRequestRef.current += 1;
    playbackRef.current?.cancel?.();
    setIsPlaying(false);
  }, []);

  useEffect(() => () => { cueRequestRef.current += 1; playbackRef.current?.cancel?.(); }, []);
  return { playCue, stopCue, isPlaying };
}

export async function playCvcSoundSequence({
  wordModel,
  family,
  playCue,
  onLetter = () => {},
  isCurrent = () => true,
  wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)),
  playbackTimeout = CVC_PLAYBACK_TIMEOUT
}) {
  if (!wordModel || typeof playCue !== "function") return { audioDelivery: "unavailable" };
  for (const [index, letter] of wordModel.letters.entries()) {
    if (!isCurrent()) return { audioDelivery: "interrupted" };
    onLetter(index);
    const cue = getLetterSoundCue(letter, family);
    const playback = playCue(cue.src, cue.fallbackText);
    const status = await resolveCvcPlayback(playback, playbackTimeout);
    if (!isCurrent() || playback.isCurrent?.() === false) return { audioDelivery: "interrupted" };
    if (status !== "ended") return { audioDelivery: cvcAudioDelivery(status) };
    await wait(CVC_SOUND_GAP);
    if (playback.isCurrent?.() === false) return { audioDelivery: "interrupted" };
  }
  if (!isCurrent()) return { audioDelivery: "interrupted" };
  onLetter(-1);
  const wordStatus = await resolveCvcPlayback(playCue(wordModel.audio, wordModel.word), playbackTimeout);
  return { audioDelivery: isCurrent() ? cvcAudioDelivery(wordStatus) : "interrupted" };
}

export function useCvcWordModels(words, family) {
  return useMemo(() => makeCvcWordModels(words, family), [family, words]);
}

export function getLetterAudio(letter, family) {
  return getGraphemeAudioPath(letter, letter === family.vowel ? family.vowel : "");
}

export function getLetterSoundCue(letter, family) {
  const normalizedLetter = String(letter || "").toLowerCase();
  const targetVowel = normalizedLetter === family.vowel ? family.vowel : "";

  if (CVC_VOWELS.has(normalizedLetter) || targetVowel) {
    const vowel = targetVowel || normalizedLetter;
    // Pure /a/-style phoneme recording (same file the EL Skills Quest uses) so
    // sounding out "cat" is c-a-t, NOT the synthetic buzz and NOT the spoken
    // "short a" label. If the recording is missing, the control stays silent.
    return {
      src: getGraphemeAudioPath(vowel, vowel),
      fallbackText: VOWEL_SOUND_FALLBACKS[vowel] || vowel
    };
  }

  return {
    src: getGraphemeAudioPath(normalizedLetter, ""),
    fallbackText: normalizedLetter
  };
}

export function shuffleItems(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function cvcAudioDelivery(status) {
  return status === "ended" ? "delivered" : ["stopped", "superseded"].includes(status) ? "interrupted" : "unavailable";
}

export function cvcStepEvidence(step, records = []) {
  const deliveries = records.map(record => record.audioDelivery);
  const audioDelivery = deliveries.includes("unavailable") ? "unavailable"
    : deliveries.includes("interrupted") ? "interrupted"
      : deliveries.length && deliveries.every(value => value === "delivered") ? "delivered" : "pending";
  return {
    step, completionKind: step === "hear" && audioDelivery === "delivered" ? "exposure" : "supported",
    audioDelivery, firstResponse: records[0]?.firstResponse ?? null,
    attempts: records.reduce((sum, record) => sum + (record.attempts || 0), 0),
    supportUsed: [...new Set(records.flatMap(record => record.supportUsed || []))], independent: false
  };
}
