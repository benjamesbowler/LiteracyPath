import { elSkillsBlockCycles } from "../data/elSkillsBlockCycles.js";

export const LETTER_PRACTICE_RECOMMENDATION_COPY = Object.freeze({
  teaching: "Practise a letter from class.",
  taught: "Practise a letter you have learned.",
  resume: "Carry on with this letter.",
  explore: "Try this letter, or choose another.",
  review: "Try this letter again."
});

function cycleLetters(cycle) {
  return [...(cycle?.focusLetters || []), ...(cycle?.reviewLetters || [])]
    .map(item => String(item.spelling || item.grapheme || "").toUpperCase())
    // A digraph is not two separately taught letter targets.
    .filter(letter => /^[A-Z]$/u.test(letter));
}

/** Supported practice suggestions never establish assessment placement. */
export function recommendLetterPractice({
  letters = [],
  availableLetters = [],
  progress = {},
  teachingCycleId = "",
  confirmedPlacement = null
} = {}) {
  const available = new Set(availableLetters);
  const candidates = letters.filter(letter => available.has(letter));
  const choose = pool => pool.find(letter => progress[letter] === "inprogress")
    || pool.find(letter => progress[letter] !== "completed")
    || pool[0];
  const teachingCycle = elSkillsBlockCycles.find(cycle => cycle.id === teachingCycleId);
  const focus = cycleLetters(teachingCycle).filter(letter => available.has(letter));
  if (focus.length) {
    return { letter: choose(focus), reason: LETTER_PRACTICE_RECOMMENDATION_COPY.teaching, source: "teaching-cycle" };
  }

  const anchor = Number(confirmedPlacement?.anchorCycle);
  const anchoredCycle = elSkillsBlockCycles.find(cycle => cycle.cycleNumber === anchor);
  if (Number.isInteger(anchor) && anchor > 0 && anchoredCycle) {
    const anchorLetters = cycleLetters(anchoredCycle).filter(letter => available.has(letter));
    const taught = [...new Set(elSkillsBlockCycles
      .filter(cycle => cycle.cycleNumber > 0 && cycle.cycleNumber <= anchor)
      .flatMap(cycleLetters))].filter(letter => available.has(letter));
    const letter = choose(anchorLetters.length ? anchorLetters : taught);
    if (letter) {
      return { letter, reason: LETTER_PRACTICE_RECOMMENDATION_COPY.taught, source: "confirmed-placement" };
    }
  }

  const resumed = candidates.find(letter => progress[letter] === "inprogress");
  if (resumed) {
    return { letter: resumed, reason: LETTER_PRACTICE_RECOMMENDATION_COPY.resume, source: "practice-resume" };
  }
  const letter = choose(candidates);
  return {
    letter,
    reason: progress[letter] === "completed"
      ? LETTER_PRACTICE_RECOMMENDATION_COPY.review
      : LETTER_PRACTICE_RECOMMENDATION_COPY.explore,
    source: "exploration"
  };
}
