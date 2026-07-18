// THE SHELL CONTRACT.
//
// Every mini-game in Sound Seekers takes exactly these props and nothing else.
// A shell owns NO progress state, saves NOTHING, and knows NOTHING about the
// map, the creature, or the save file. StopRunner owns all of that.
//
// Why so strict: shells are the thing we will write ten of. If each one reaches
// into progress on its own, a bug in the tenth silently corrupts a child's
// mastery record, and we won't find it for a month.
//
//   props in:
//     round            one round, from questRounds.js
//     isSoundEnabled   bool
//     onAnswer(correct, target)   fired EXACTLY ONCE per response
//     onNext()                    the shell asking for the next round
//
// onAnswer firing more than once per response is the bug that fakes mastery:
// double-count a correct answer and a child hits 8/8 in four questions.
// useAnswerOnce below makes that structurally impossible.

import { useCallback, useRef, useEffect } from "react";
import { playCueAudio, stopCueAudio } from "../../../utils/audio/cuePlayer.js";
import { graphemeSrc, wordSrc, letterNameSrc } from "../../../utils/questAudio.js";

// Guarantees onAnswer fires once and only once per round, no matter how many
// times a child taps, double-taps, or hammers the screen.
export function useAnswerOnce(round, onAnswer) {
  const spent = useRef(null);

  useEffect(() => {
    spent.current = null;
  }, [round]);

  return useCallback((correct, target) => {
    if (spent.current === round) return false;
    spent.current = round;
    onAnswer?.(correct, target ?? round?.target);
    return true;
  }, [round, onAnswer]);
}

// Speak a grapheme. Returns false when there is no recording — the caller must
// then HIDE its Listen button. Never a browser voice: a robot mouth teaching a
// child a phoneme is worse than silence (docs/IMPROVEMENT_LOOPS.md rule #3).
export function sayGrapheme(grapheme, enabled = true) {
  if (!enabled) return false;
  const src = graphemeSrc(grapheme);
  if (!src) return false;
  playCueAudio(src);
  return true;
}

export function sayWord(word, enabled = true) {
  if (!enabled) return false;
  const src = wordSrc(word);
  if (!src) return false;
  playCueAudio(src);
  return true;
}

export function sayLetterName(letter, enabled = true) {
  if (!enabled) return false;
  const src = letterNameSrc(letter);
  if (!src) return false;
  playCueAudio(src);
  return true;
}

export function hushCue() {
  stopCueAudio();
}

// How a grapheme is WRITTEN on a stone — the shared rule in questLabels.js:
// split digraphs read "a–e", morphs read "–s" (not "suffix–s"), and alt
// pronunciations keep their base letter ("y", not "y–ie"). Child shells and
// the teacher heat map now say the same thing.
export { graphemeLabel as displayGrapheme } from "../../../utils/questLabels.js";
