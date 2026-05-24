import {
  INITIAL_SOUND_LETTERS,
  INITIAL_SOUND_ROUND_LENGTH,
  initialSoundWordBank
} from "./initialSoundWordBank.js";
import { hasImportedInitialSoundMedia } from "./initialSoundMediaManifest.js";
import { buildAdaptiveRound, createSeededRandom, shuffleItems } from "../../utils/adaptiveRoundBuilder.js";

const normalizeSet = value => new Set(Array.isArray(value) ? value.map(String) : []);

function getProgressSets(studentProgress = {}) {
  return {
    masteredLetters: normalizeSet(studentProgress.masteredLetters || studentProgress.masteredItemKeys),
    assessedLetters: normalizeSet(studentProgress.assessedLetters || studentProgress.seenItemKeys),
    incorrectLetters: normalizeSet(studentProgress.incorrectLetters || studentProgress.unmasteredLetters),
    answeredCorrectItemIds: normalizeSet(studentProgress.answeredCorrectItemIds || studentProgress.correctQuestionIds),
    answeredCorrectWords: normalizeSet(studentProgress.answeredCorrectWords || studentProgress.correctTargetWords),
    recentlySeenItemIds: normalizeSet(studentProgress.recentlySeenItemIds || studentProgress.recentQuestionIds),
    recentlySeenWords: normalizeSet(studentProgress.recentlySeenWords || studentProgress.recentTargetWords),
    repeatedMistakes: studentProgress.repeatedMistakes || {},
    incorrectDistractorPatterns: studentProgress.incorrectDistractorPatterns || {}
  };
}

function selectionReasonFor(item, sets, { level, roundNumber }) {
  const isMastered = sets.masteredLetters.has(item.letter);
  const wasAssessed = sets.assessedLetters.has(item.letter);
  const wasIncorrect = sets.incorrectLetters.has(item.letter);

  if (item.level > level && wasAssessed && roundNumber > 1) {
    return "level-up-review";
  }
  if (level > 1 && wasAssessed && item.level === level && !sets.answeredCorrectWords.has(item.targetWord)) {
    return "level-up-review";
  }
  if (!wasAssessed) return "new";
  if (wasIncorrect || !isMastered) return "unmastered";
  if (roundNumber > 1) return "review";
  return "new";
}

function scoreItem(item, sets, context) {
  const reason = selectionReasonFor(item, sets, context);
  const mistakeBoost = Number(sets.repeatedMistakes[item.letter] || 0) * 3;
  const distractorBoost = Number(sets.incorrectDistractorPatterns[item.letter] || 0);
  const reasonScore = {
    new: 100,
    unmastered: 90,
    "level-up-review": 72,
    review: 35
  }[reason] || 10;
  const recentPenalty =
    sets.recentlySeenItemIds.has(item.id) || sets.recentlySeenWords.has(item.targetWord) ? 28 : 0;
  const correctPenalty =
    sets.answeredCorrectItemIds.has(item.id) || sets.answeredCorrectWords.has(item.targetWord) ? 40 : 0;

  return reasonScore + mistakeBoost + distractorBoost - recentPenalty - correctPenalty;
}

function randomizeAnswerOptions(item, random) {
  const shuffled = shuffleItems(item.answerOptions, random);
  return {
    ...item,
    answerOptions: shuffled,
    choices: shuffled
  };
}

export function getInitialSoundRound({
  studentProgress = {},
  level = 1,
  roundNumber = 1,
  seed = Date.now(),
  includeInactive = false,
  requireImportedMedia = true
} = {}) {
  const safeLevel = Number(level) === 2 ? 2 : 1;
  const sets = getProgressSets(studentProgress);
  const random = createSeededRandom(seed);
  const baseItems = initialSoundWordBank.filter(item => {
    const isCurrentLevel = item.level === safeLevel;
    const isHarderReview =
      safeLevel === 1 &&
      roundNumber > 1 &&
      item.level === 2 &&
      sets.assessedLetters.has(item.letter);
    return (isCurrentLevel || isHarderReview) &&
      (includeInactive || item.active !== false) &&
      (!requireImportedMedia || hasImportedInitialSoundMedia(item)) &&
      INITIAL_SOUND_LETTERS.includes(item.letter);
  });

  const remainingUnmasteredLetters = INITIAL_SOUND_LETTERS.filter(letter => !sets.masteredLetters.has(letter));
  const unseenLetters = remainingUnmasteredLetters.filter(letter => !sets.assessedLetters.has(letter));
  const reviewLetters = INITIAL_SOUND_LETTERS.filter(letter => sets.assessedLetters.has(letter));
  const roundTwoReviewLetters = roundNumber === 2 ? reviewLetters.slice(0, 5) : [];
  const preferredLetters = new Set(roundNumber === 1
    ? unseenLetters.slice(0, INITIAL_SOUND_ROUND_LENGTH)
    : [...unseenLetters, ...roundTwoReviewLetters]
  );

  const scored = baseItems
    .map(item => ({
      ...item,
      selectionReason: selectionReasonFor(item, sets, { level: safeLevel, roundNumber }),
      selectionScore:
        scoreItem(item, sets, { level: safeLevel, roundNumber }) +
        (preferredLetters.has(item.letter) ? 22 : 0) +
        (item.level > safeLevel ? 45 : 0) +
        random() * 0.01
    }))
    .sort((a, b) => b.selectionScore - a.selectionScore || a.letter.localeCompare(b.letter));

  const selected = buildAdaptiveRound({
    candidates: scored,
    roundLength: INITIAL_SOUND_ROUND_LENGTH,
    random,
    itemKey: item => item.letter,
    targetKey: item => item.targetWord,
    canRepeatItemKey: false,
    preserveCandidateOrder: true
  });

  return selected.map(item => randomizeAnswerOptions(item, random));
}

export function summarizeInitialSoundProgress(studentProgress = {}) {
  const sets = getProgressSets(studentProgress);
  const masteredLetters = INITIAL_SOUND_LETTERS.filter(letter => sets.masteredLetters.has(letter));
  const unmasteredLetters = INITIAL_SOUND_LETTERS.filter(letter => !sets.masteredLetters.has(letter));
  return {
    expectedLetters: INITIAL_SOUND_LETTERS,
    masteredLetters,
    unmasteredLetters,
    masteredCount: masteredLetters.length,
    totalLetters: INITIAL_SOUND_LETTERS.length,
    percentMastered: Math.round((masteredLetters.length / INITIAL_SOUND_LETTERS.length) * 100)
  };
}
