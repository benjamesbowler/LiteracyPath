import { useCallback, useMemo, useRef, useState } from "react";
import { getChildWordAsset } from "../../../../data/childAssets";
import { getCvcWordParts, getGraphemeAudioPath } from "../../../../data/cvcWordFamilies";
import { playPhonicsAudio, stopPhonicsAudio } from "../../../../hooks/usePhonicsAudio";

export const CVC_SOUND_DELAY = 720;
export const CVC_SOUND_GAP = 90;
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
  const { onset, rimeLetters } = getCvcWordParts(word, family.rime);
  const letters = [...onset.split(""), ...rimeLetters].filter(Boolean);

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

export function useCvcSoundCue() {
  const [isPlaying, setIsPlaying] = useState(false);
  const cueRequestRef = useRef(0);

  const playCue = useCallback((src, fallbackText) => {
    void fallbackText;
    const request = cueRequestRef.current + 1;
    cueRequestRef.current = request;
    return playPhonicsAudio(src || "", {
      onStart: () => {
        if (cueRequestRef.current === request) setIsPlaying(true);
      },
      onFinish: () => {
        if (cueRequestRef.current === request) setIsPlaying(false);
      }
    });
  }, []);

  const stopCue = useCallback(() => {
    cueRequestRef.current += 1;
    stopPhonicsAudio();
    setIsPlaying(false);
  }, []);

  return { playCue, stopCue, isPlaying };
}

export async function playCvcSoundSequence({
  wordModel,
  family,
  playCue,
  onLetter = () => {},
  isCurrent = () => true,
  wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))
}) {
  if (!wordModel || typeof playCue !== "function") return false;
  for (const [index, letter] of wordModel.letters.entries()) {
    if (!isCurrent()) return false;
    onLetter(index);
    const cue = getLetterSoundCue(letter, family);
    const status = await playCue(cue.src, cue.fallbackText);
    if (!isCurrent() || status !== "ended") return false;
    await wait(CVC_SOUND_GAP);
  }
  if (!isCurrent()) return false;
  onLetter(-1);
  const wordStatus = await playCue(wordModel.audio, wordModel.word);
  return isCurrent() && wordStatus === "ended";
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
