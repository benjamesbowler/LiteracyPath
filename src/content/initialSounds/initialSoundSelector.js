import {
  INITIAL_SOUND_LETTERS,
  INITIAL_SOUND_ROUND_LENGTH,
  initialSoundWordBank
} from "./initialSoundWordBank.js";
import { hasImportedInitialSoundMedia } from "./initialSoundMediaManifest.js";
import { buildAdaptiveRound, createSeededRandom, shuffleItems } from "../../utils/adaptiveRoundBuilder.js";

const normalizeSet = value => new Set(Array.isArray(value) ? value.map(String) : []);
const levelKey = level => `level${Number(level) === 2 ? 2 : 1}`;
const emptyLevelProgress = () => ({
  coveredLetters: [],
  masteredLetters: [],
  usedTargetWordsByLetter: {},
  incorrectLetters: [],
  recentlySeenWords: []
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
      recentlySeenWords: Array.isArray(source.recentlySeenWords) ? source.recentlySeenWords.map(String) : []
    };

    return progress;
  }, {});
}

export function buildInitialSoundsProgressFromAnswerHistory(answerHistory = []) {
  const progress = {
    level1: emptyLevelProgress(),
    level2: emptyLevelProgress()
  };

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
      if (!INITIAL_SOUND_LETTERS.includes(letter)) return;

      const levelProgress = progress[key];
      if (!levelProgress.coveredLetters.includes(letter)) levelProgress.coveredLetters.push(letter);
      if (record.isCorrect && !levelProgress.masteredLetters.includes(letter)) levelProgress.masteredLetters.push(letter);
      if (!record.isCorrect && !levelProgress.incorrectLetters.includes(letter)) levelProgress.incorrectLetters.push(letter);
      if (word) {
        levelProgress.usedTargetWordsByLetter[letter] = [
          ...(levelProgress.usedTargetWordsByLetter[letter] || []),
          word
        ].filter((item, index, list) => list.indexOf(item) === index);
        levelProgress.recentlySeenWords = [...levelProgress.recentlySeenWords, word].slice(-45);
      }
    });

  return progress;
}

function getMediaCompleteLetters(level) {
  return INITIAL_SOUND_LETTERS.filter(letter =>
    initialSoundWordBank.some(item => item.letter === letter && item.level === level && item.active !== false && hasImportedInitialSoundMedia(item))
  );
}

function itemsForLetter({ letter, level, includeInactive, requireImportedMedia }) {
  return initialSoundWordBank.filter(item =>
    item.letter === letter &&
    item.level === level &&
    (includeInactive || item.active !== false) &&
    (!requireImportedMedia || hasImportedInitialSoundMedia(item))
  );
}

function pickItemForLetter({ letter, level, progress, includeInactive, requireImportedMedia, random }) {
  const items = itemsForLetter({ letter, level, includeInactive, requireImportedMedia });
  const usedWords = new Set((progress.usedTargetWordsByLetter?.[letter] || []).map(word => String(word).toLowerCase()));
  const unused = items.filter(item => !usedWords.has(String(item.targetWord).toLowerCase()));
  const pool = unused.length ? unused : items;
  if (!pool.length) return null;
  return shuffleItems(pool, random)
    .sort((a, b) => {
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
  return shuffleItems(letters, random).sort((a, b) => {
    const ai = INITIAL_SOUND_LETTERS.indexOf(a);
    const bi = INITIAL_SOUND_LETTERS.indexOf(b);
    return ai - bi;
  });
}

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
  roundNumber = null,
  seed = Date.now(),
  includeInactive = false,
  requireImportedMedia = true
} = {}) {
  const safeLevel = Number(level) === 2 ? 2 : 1;
  const random = createSeededRandom(seed);
  return getInitialSoundRoundPlan({
    studentProgress,
    level: safeLevel,
    roundNumber,
    seed,
    includeInactive,
    requireImportedMedia
  }).items.map(item => randomizeAnswerOptions(item, random));
}

export function getInitialSoundRoundPlan({
  studentProgress = {},
  level = 1,
  roundNumber = null,
  seed = Date.now(),
  includeInactive = false,
  requireImportedMedia = true
} = {}) {
  const safeLevel = Number(level) === 2 ? 2 : 1;
  const random = createSeededRandom(seed);
  const progress = normalizeInitialSoundsProgress(studentProgress)[levelKey(safeLevel)] || emptyLevelProgress();
  const availableLetters = getMediaCompleteLetters(safeLevel);
  const blockedLetters = INITIAL_SOUND_LETTERS.filter(letter => !availableLetters.includes(letter));
  const phase = inferRoundPhase({ level: safeLevel, progress, roundNumber, availableLetters });
  const covered = new Set(progress.coveredLetters || []);
  const mastered = new Set(progress.masteredLetters || []);
  const incorrect = new Set(progress.incorrectLetters || []);
  const prioritizedLetters = stableShuffleLetters(availableLetters, random);
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
    selectedLetters = [...remaining, ...reviewSelected];
  } else {
    const weak = weakLetters.slice(0, INITIAL_SOUND_ROUND_LENGTH);
    const unusedReview = prioritizedLetters
      .filter(letter => !weak.includes(letter))
      .filter(letter => {
        const items = itemsForLetter({ letter, level: safeLevel, includeInactive, requireImportedMedia });
        const used = new Set((progress.usedTargetWordsByLetter?.[letter] || []).map(word => String(word).toLowerCase()));
        return items.some(item => !used.has(String(item.targetWord).toLowerCase()));
      });
    const filler = prioritizedLetters.filter(letter => !weak.includes(letter) && !unusedReview.includes(letter));
    selectedLetters = [...weak, ...unusedReview, ...filler].slice(0, INITIAL_SOUND_ROUND_LENGTH);
    reviewSelected = selectedLetters.filter(letter => covered.has(letter));
  }

  if (selectedLetters.length < INITIAL_SOUND_ROUND_LENGTH) {
    const fallback = prioritizedLetters.filter(letter => !selectedLetters.includes(letter));
    selectedLetters = [...selectedLetters, ...fallback].slice(0, INITIAL_SOUND_ROUND_LENGTH);
  }

  const selected = selectedLetters
    .map(letter => {
      const item = pickItemForLetter({
        letter,
        level: safeLevel,
        progress,
        includeInactive,
        requireImportedMedia,
        random
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
        reason: "no complete imported image+audio pair"
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
