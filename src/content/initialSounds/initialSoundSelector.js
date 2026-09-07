/* eslint-disable no-unused-vars -- LEGACY-LINT: pre-strict-rules file; new code must not add violations. */
import {
  INITIAL_SOUND_LETTERS,
  INITIAL_SOUND_ROUND_LENGTH,
  initialSoundWordBank
} from "./initialSoundWordBank.js";
import { hasImportedInitialSoundImage } from "./initialSoundMediaManifest.js";
import { isInitialSoundRuntimeEligible } from "./initialSoundMediaEligibility.js";
import { buildAdaptiveRound, createSeededRandom, shuffleItems } from "../../utils/adaptiveRoundBuilder.js";

const normalizeSet = value => new Set(Array.isArray(value) ? value.map(String) : []);
const levelKey = level => `level${Number(level) === 2 ? 2 : 1}`;
const emptyLevelProgress = () => ({
  coveredLetters: [],
  masteredLetters: [],
  usedTargetWordsByLetter: {},
  incorrectLetters: [],
  recentlySeenWords: [],
  recentlySeenItemIds: [],
  answeredCorrectWords: [],
  answeredCorrectItemIds: [],
  repeatedMistakes: {},
  incorrectDistractorPatterns: {}
});

function normalizeUsedWords(value = {}) {
  return Object.fromEntries(
    Object.entries(value || {}).map(([letter, words]) => [
      String(letter),
      Array.isArray(words) ? words.map(String) : []
    ])
  );
}

export function normalizeInitialSoundsProgress(studentProgress = {}) {
  const provided = studentProgress.initialSoundsProgress || {};
  const legacyCovered = studentProgress.assessedLetters || studentProgress.seenItemKeys || [];
  const legacyMastered = studentProgress.masteredLetters || studentProgress.masteredItemKeys || [];
  const legacyIncorrect = studentProgress.incorrectLetters || studentProgress.unmasteredLetters || [];

  return [1, 2].reduce((progress, level) => {
    const key = levelKey(level);
    const source = provided[key] || {};
    const shouldUseLegacy = level === 1 && Object.keys(provided).length === 0;

    progress[key] = {
      coveredLetters: [...normalizeSet(source.coveredLetters || (shouldUseLegacy ? legacyCovered : []))],
      masteredLetters: [...normalizeSet(source.masteredLetters || (shouldUseLegacy ? legacyMastered : []))],
      usedTargetWordsByLetter: normalizeUsedWords(source.usedTargetWordsByLetter || {}),
      incorrectLetters: [...normalizeSet(source.incorrectLetters || (shouldUseLegacy ? legacyIncorrect : []))],
      recentlySeenWords: Array.isArray(source.recentlySeenWords) ? source.recentlySeenWords.map(String) : [],
      recentlySeenItemIds: [...normalizeSet(source.recentlySeenItemIds || (shouldUseLegacy ? studentProgress.recentlySeenItemIds : []))],
      answeredCorrectWords: [...normalizeSet(source.answeredCorrectWords || (shouldUseLegacy ? studentProgress.answeredCorrectWords : []))],
      answeredCorrectItemIds: [...normalizeSet(source.answeredCorrectItemIds || (shouldUseLegacy ? studentProgress.answeredCorrectItemIds : []))],
      repeatedMistakes: { ...(source.repeatedMistakes || (shouldUseLegacy ? studentProgress.repeatedMistakes : {}) || {}) },
      incorrectDistractorPatterns: { ...(source.incorrectDistractorPatterns || (shouldUseLegacy ? studentProgress.incorrectDistractorPatterns : {}) || {}) }
    };

    return progress;
  }, {});
}

export function buildInitialSoundsProgressFromAnswerHistory(answerHistory = []) {
  const progress = {
    level1: emptyLevelProgress(),
    level2: emptyLevelProgress()
  };

  const outcomes = { level1: {}, level2: {} };

  (answerHistory || [])
    .filter(record =>
      (record.skillId === "initial_sounds" || record.stage === "Initial Sounds" || record.skill === "Initial Sounds" || record.skill === "initial sounds") &&
      record.itemKey
    )
    .forEach(record => {
      const level = Number(record.itemLevel || record.level) === 2 ? 2 : 1;
      const key = levelKey(level);
      const letter = String(record.itemKey || "").toLowerCase();
      const word = String(record.targetWord || record.diagnosticTarget || "").toLowerCase();
      const itemId = String(record.questionId || record.itemId || record.id || "");
      if (!INITIAL_SOUND_LETTERS.includes(letter)) return;

      const levelProgress = progress[key];
      if (!levelProgress.coveredLetters.includes(letter)) levelProgress.coveredLetters.push(letter);
      outcomes[key][letter] = [...(outcomes[key][letter] || []), Boolean(record.isCorrect)];
      if (itemId) levelProgress.recentlySeenItemIds = [...levelProgress.recentlySeenItemIds, itemId].slice(-45);
      if (record.isCorrect) {
        if (word && !levelProgress.answeredCorrectWords.includes(word)) levelProgress.answeredCorrectWords.push(word);
        if (itemId && !levelProgress.answeredCorrectItemIds.includes(itemId)) levelProgress.answeredCorrectItemIds.push(itemId);
      } else {
        levelProgress.repeatedMistakes[letter] = (Number(levelProgress.repeatedMistakes[letter]) || 0) + 1;
        levelProgress.incorrectDistractorPatterns[letter] = (Number(levelProgress.incorrectDistractorPatterns[letter]) || 0) + 1;
      }
      if (word) {
        levelProgress.usedTargetWordsByLetter[letter] = [
          ...(levelProgress.usedTargetWordsByLetter[letter] || []),
          word
        ].filter((item, index, list) => list.indexOf(item) === index);
        levelProgress.recentlySeenWords = [...levelProgress.recentlySeenWords, word].slice(-45);
      }
    });

  for (const key of ["level1", "level2"]) {
    const levelProgress = progress[key];
    for (const [letter, letterOutcomes] of Object.entries(outcomes[key])) {
      const lastTwo = letterOutcomes.slice(-2);
      if (lastTwo.length === 2 && lastTwo.every(Boolean)) levelProgress.masteredLetters.push(letter);
      if (letterOutcomes.at(-1) === false) levelProgress.incorrectLetters.push(letter);
    }
  }

  return progress;
}

function getInitialSoundItemLetter(item = {}) {
  return String(item.letter || item.itemKey || "").toLowerCase();
}

function getMediaCompleteLetters(level, {
  includeInactive = false,
  requireImportedMedia = true,
  itemBank = initialSoundWordBank,
  itemEligibility = isInitialSoundRuntimeEligible,
  itemFilter = null
} = {}) {
  return INITIAL_SOUND_LETTERS.filter(letter =>
    itemBank.some(item =>
      getInitialSoundItemLetter(item) === letter &&
      item.level === level &&
      (includeInactive || item.active !== false) &&
      (!requireImportedMedia || hasImportedInitialSoundImage(item)) &&
      itemEligibility(item) &&
      (!itemFilter || itemFilter(item))
    )
  );
}

function itemsForLetter({
  letter,
  level,
  includeInactive,
  requireImportedMedia,
  itemBank,
  itemEligibility,
  itemFilter = null
}) {
  return itemBank.filter(item =>
    getInitialSoundItemLetter(item) === letter &&
    item.level === level &&
    (includeInactive || item.active !== false) &&
    (!requireImportedMedia || hasImportedInitialSoundImage(item)) &&
    itemEligibility(item) &&
    (!itemFilter || itemFilter(item))
  );
}

function pickItemForLetter({
  letter,
  level,
  progress,
  includeInactive,
  requireImportedMedia,
  itemBank,
  itemEligibility,
  itemFilter,
  random,
  sets,
  context
}) {
  const items = itemsForLetter({
    letter,
    level,
    includeInactive,
    requireImportedMedia,
    itemBank,
    itemEligibility,
    itemFilter
  });
  const usedWords = new Set((progress.usedTargetWordsByLetter?.[letter] || []).map(word => String(word).toLowerCase()));
  const unused = items.filter(item => !usedWords.has(String(item.targetWord).toLowerCase()));
  const pool = unused.length ? unused : items;
  if (!pool.length) return null;
  return shuffleItems(pool, random)
    .sort((a, b) => {
      const scoreDelta = scoreItem(b, sets, context) - scoreItem(a, sets, context);
      if (scoreDelta) return scoreDelta;
      const bandRank = band => String(band || "").includes("core") ? 0 : 1;
      const bandDelta = bandRank(a.progressionBand) - bandRank(b.progressionBand);
      if (bandDelta) return bandDelta;
      return Number(a.roundPriority || 999) - Number(b.roundPriority || 999);
    })[0];
}

function inferRoundPhase({ level, progress, roundNumber, availableLetters }) {
  if (Number.isFinite(Number(roundNumber)) && Number(roundNumber) > 0) {
    const numericRound = Number(roundNumber);
    if (Number(level) === 2 && numericRound >= 3 && numericRound <= 4) return numericRound - 2;
    if (numericRound <= 2) return numericRound;
    return 3;
  }

  const coveredAvailableCount = availableLetters.filter(letter => progress.coveredLetters.includes(letter)).length;
  if (coveredAvailableCount < INITIAL_SOUND_ROUND_LENGTH) return 1;
  if (coveredAvailableCount < availableLetters.length) return 2;
  return 3;
}

function stableShuffleLetters(letters, random) {
  return shuffleItems(letters, random);
}

function getProgressSets(studentProgress = {}) {
  return {
    masteredLetters: normalizeSet(studentProgress.masteredLetters || studentProgress.masteredItemKeys),
    assessedLetters: normalizeSet(studentProgress.assessedLetters || studentProgress.coveredLetters || studentProgress.seenItemKeys),
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
  const letter = getInitialSoundItemLetter(item);
  const isMastered = sets.masteredLetters.has(letter);
  const wasAssessed = sets.assessedLetters.has(letter);
  const wasIncorrect = sets.incorrectLetters.has(letter);

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
  const letter = getInitialSoundItemLetter(item);
  const mistakeBoost = Number(sets.repeatedMistakes[letter] || 0) * 3;
  const distractorBoost = Number(sets.incorrectDistractorPatterns[letter] || 0);
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
  if (!Array.isArray(item.answerOptions) || item.answerOptions.some(option => option && typeof option === "object")) {
    return item;
  }
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
  roundNumber = null,
  seed = Date.now(),
  includeInactive = false,
  requireImportedMedia = true,
  itemBank = initialSoundWordBank,
  itemEligibility = isInitialSoundRuntimeEligible,
  itemFilter = null
} = {}) {
  const safeLevel = Number(level) === 2 ? 2 : 1;
  const random = createSeededRandom(seed);
  return getInitialSoundRoundPlan({
    studentProgress,
    level: safeLevel,
    roundNumber,
    seed,
    includeInactive,
    requireImportedMedia,
    itemBank,
    itemEligibility,
    itemFilter
  }).items.map(item => randomizeAnswerOptions(item, random));
}

export function getInitialSoundRoundPlan({
  studentProgress = {},
  level = 1,
  roundNumber = null,
  seed = Date.now(),
  includeInactive = false,
  requireImportedMedia = true,
  itemBank = initialSoundWordBank,
  itemEligibility = isInitialSoundRuntimeEligible,
  itemFilter = null,
  // Letters already asked earlier in the current assessment round. On a
  // mid-round plan rebuild (the queue emptied before the round did) these are
  // excluded while there are enough other letters to fill the round. If the
  // available pool is smaller than the fixed round length, the selector falls
  // back to the strongest available letters so the learner gets a complete
  // round instead of an empty queue.
  excludeLetters = []
} = {}) {
  const safeLevel = Number(level) === 2 ? 2 : 1;
  const random = createSeededRandom(seed);
  const progress = normalizeInitialSoundsProgress(studentProgress)[levelKey(safeLevel)] || emptyLevelProgress();
  const sets = getProgressSets(progress);
  const availableLetters = getMediaCompleteLetters(safeLevel, {
    includeInactive,
    requireImportedMedia,
    itemBank,
    itemEligibility,
    itemFilter
  });
  const blockedLetters = INITIAL_SOUND_LETTERS.filter(letter => !availableLetters.includes(letter));
  const phase = inferRoundPhase({ level: safeLevel, progress, roundNumber, availableLetters });
  const covered = new Set(progress.coveredLetters || []);
  const mastered = new Set(progress.masteredLetters || []);
  const incorrect = new Set(progress.incorrectLetters || []);
  // availableLetters (and therefore phase/meta) stays complete; only the
  // selectable pool drops the already-asked letters.
  const excludeSet = new Set((excludeLetters || []).map(letter => String(letter)));
  const selectableLetters = availableLetters.filter(letter => !excludeSet.has(letter));
  const context = { level: safeLevel, roundNumber: Number(roundNumber) || phase };
  const prioritizedAvailableLetters = stableShuffleLetters(availableLetters, random)
    .sort((a, b) => {
      const bestScore = letter => {
        const items = itemsForLetter({
          letter,
          level: safeLevel,
          includeInactive,
          requireImportedMedia,
          itemBank,
          itemEligibility,
          itemFilter
        });
        return items.length ? Math.max(...items.map(item => scoreItem(item, sets, context))) : Number.NEGATIVE_INFINITY;
      };
      return bestScore(b) - bestScore(a);
    });
  const prioritizedLetters = prioritizedAvailableLetters.filter(letter => selectableLetters.includes(letter));
  const uncoveredLetters = prioritizedLetters.filter(letter => !covered.has(letter));
  const reviewLetters = prioritizedLetters.filter(letter => covered.has(letter));
  const weakLetters = prioritizedLetters.filter(letter => incorrect.has(letter) || (covered.has(letter) && !mastered.has(letter)));

  let selectedLetters = [];
  let reviewSelected = [];

  if (phase === 1) {
    selectedLetters = uncoveredLetters.slice(0, INITIAL_SOUND_ROUND_LENGTH);
  } else if (phase === 2) {
    const remaining = uncoveredLetters;
    const reviewNeeded = Math.max(0, INITIAL_SOUND_ROUND_LENGTH - remaining.length);
    reviewSelected = reviewLetters.slice(0, reviewNeeded);
    selectedLetters = [...remaining, ...reviewSelected].slice(0, INITIAL_SOUND_ROUND_LENGTH);
  } else {
    const weak = weakLetters.slice(0, INITIAL_SOUND_ROUND_LENGTH);
    const unusedReview = prioritizedLetters
      .filter(letter => !weak.includes(letter))
      .filter(letter => {
        const items = itemsForLetter({
          letter,
          level: safeLevel,
          includeInactive,
          requireImportedMedia,
          itemBank,
          itemEligibility,
          itemFilter
        });
        const used = new Set((progress.usedTargetWordsByLetter?.[letter] || []).map(word => String(word).toLowerCase()));
        return items.some(item => !used.has(String(item.targetWord).toLowerCase()));
      });
    const filler = prioritizedLetters.filter(letter => !weak.includes(letter) && !unusedReview.includes(letter));
    selectedLetters = [...weak, ...unusedReview, ...filler].slice(0, INITIAL_SOUND_ROUND_LENGTH);
    reviewSelected = selectedLetters.filter(letter => covered.has(letter));
  }

  if (selectedLetters.length < INITIAL_SOUND_ROUND_LENGTH) {
    const fallback = prioritizedAvailableLetters.filter(letter => !selectedLetters.includes(letter));
    selectedLetters = [...selectedLetters, ...fallback].slice(0, INITIAL_SOUND_ROUND_LENGTH);

    // A media failure or a deliberately small bank can leave fewer than 15
    // distinct letters. Reuse the filtered, runtime-ready pool only after all
    // distinct letters have been used; pickItemForLetter still rotates through
    // unused target words before it repeats one.
    if (selectedLetters.length < INITIAL_SOUND_ROUND_LENGTH && prioritizedAvailableLetters.length) {
      let fallbackIndex = 0;
      while (selectedLetters.length < INITIAL_SOUND_ROUND_LENGTH) {
        selectedLetters.push(prioritizedAvailableLetters[fallbackIndex % prioritizedAvailableLetters.length]);
        fallbackIndex += 1;
      }
    }
  }

  const selected = selectedLetters
    .map(letter => {
      const item = pickItemForLetter({
        letter,
        level: safeLevel,
        progress,
        includeInactive,
        requireImportedMedia,
        itemBank,
        itemEligibility,
        itemFilter,
        random,
        sets,
        context
      });
      if (!item) return null;
      const wasCovered = covered.has(letter);
      const reason =
        !wasCovered
          ? "new"
          : phase <= 2
            ? "review"
            : weakLetters.includes(letter)
              ? "unmastered"
              : "spaced-review";
      return {
        ...item,
        letter,
        selectionReason: reason,
        initialSoundLevel: safeLevel,
        initialSoundRoundPhase: phase
      };
    })
    .filter(Boolean);

  return {
    items: selected.map(item => randomizeAnswerOptions(item, random)),
    meta: {
      level: safeLevel,
      phase,
      availableLetters,
      blockedLetters,
      coveredLetters: progress.coveredLetters || [],
      masteredLetters: progress.masteredLetters || [],
      uncoveredLetters,
      reviewLetters: reviewSelected,
      selectedLetters: selected.map(item => item.letter),
      selectedTargetWords: selected.map(item => item.targetWord),
      selectedReasons: selected.map(item => ({
        id: item.id,
        letter: item.letter,
        targetWord: item.targetWord,
        reason: item.selectionReason
      })),
      mediaGaps: blockedLetters.map(letter => ({
        letter,
        level: safeLevel,
        reason: "no selectable imported image-backed item"
      }))
    }
  };
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
