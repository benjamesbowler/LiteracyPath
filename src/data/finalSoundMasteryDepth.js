import { finalSoundLevelOneAllowedItemKeys } from "./coverageExpectations.js";

export const FINAL_SOUND_LEVEL_ONE_REQUIRED_CORRECT = 3;
export const FINAL_SOUND_LEVEL_ONE_REQUIRED_UNIQUE_WORDS = 3;
export const FINAL_SOUND_LEVEL_ONE_REQUIRED_SUCCESSFUL_ROUNDS = 2;
export const FINAL_SOUND_LEVEL_ONE_ROUND_LENGTH = 15;
export const FINAL_SOUND_LEVEL_ONE_PASS_SCORE = 12;

export const finalSoundLevelOneTargets = finalSoundLevelOneAllowedItemKeys;

const targetSet = new Set(finalSoundLevelOneTargets);

export function normalizeFinalSoundValue(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z]+/g, "")
    .trim();
}

export function getFinalSoundTargetFromEvidence(item = {}) {
  const target = normalizeFinalSoundValue(
    item.itemKey ||
    item.coverageTarget ||
    item.targetFinalSound ||
    item.targetSound ||
    item.phonicsPattern ||
    item.targetPattern ||
    item.correct ||
    item.correctAnswer ||
    item.answer ||
    ""
  );
  return targetSet.has(target) ? target : "";
}

export function getFinalSoundTargetWordFromEvidence(item = {}) {
  return normalizeFinalSoundValue(
    item.targetWord ||
    item.anchorWord ||
    item.audioText ||
    item.word ||
    item.diagnosticTarget ||
    ""
  );
}

export function isFinalSoundsEvidence(item = {}) {
  const skillId = String(item.skillId || item.skill_id || "").toLowerCase();
  const stage = String(item.stage || item.skill || item.skillName || item.targetSkill || item.target_skill || "").toLowerCase();
  return skillId === "final_sounds" || stage.includes("final sounds") || stage.includes("ending sounds");
}

export function isFinalSoundLevelOneEvidence(item = {}) {
  return isFinalSoundsEvidence(item) && Boolean(getFinalSoundTargetFromEvidence(item));
}

export function buildFinalSoundAvailableWordMap(questions = []) {
  const map = finalSoundLevelOneTargets.reduce((acc, target) => {
    acc[target] = new Set();
    return acc;
  }, {});

  questions.forEach(question => {
    const target = getFinalSoundTargetFromEvidence(question);
    const word = getFinalSoundTargetWordFromEvidence(question);
    if (target && word) map[target].add(word);
  });

  return map;
}

export function evaluateFinalSoundLevelOneMasteryDepth(records = [], {
  availableWordsBySound = {},
  roundLength = FINAL_SOUND_LEVEL_ONE_ROUND_LENGTH,
  passScore = FINAL_SOUND_LEVEL_ONE_PASS_SCORE
} = {}) {
  const levelOneRecords = records.filter(isFinalSoundLevelOneEvidence);
  const chunks = [];
  for (let index = 0; index < levelOneRecords.length; index += roundLength) {
    chunks.push(levelOneRecords.slice(index, index + roundLength));
  }

  const successfulRounds = chunks.filter(chunk =>
    chunk.length >= roundLength &&
    chunk.filter(record => record.isCorrect || record.lastResult).length >= passScore
  ).length;

  const bySound = finalSoundLevelOneTargets.reduce((acc, target) => {
    const available = availableWordsBySound[target] instanceof Set
      ? availableWordsBySound[target]
      : new Set(availableWordsBySound[target] || []);
    acc[target] = {
      target,
      attempts: 0,
      correctCount: 0,
      uniqueCorrectTargetWords: [],
      availableTargetWords: [...available],
      mastered: false,
      contentGap: available.size < FINAL_SOUND_LEVEL_ONE_REQUIRED_UNIQUE_WORDS
    };
    return acc;
  }, {});

  levelOneRecords.forEach(record => {
    const target = getFinalSoundTargetFromEvidence(record);
    if (!target || !bySound[target]) return;
    bySound[target].attempts += 1;
    if (!(record.isCorrect || record.lastResult)) return;
    bySound[target].correctCount += 1;
    const word = getFinalSoundTargetWordFromEvidence(record);
    if (word && !bySound[target].uniqueCorrectTargetWords.includes(word)) {
      bySound[target].uniqueCorrectTargetWords.push(word);
    }
  });

  Object.values(bySound).forEach(row => {
    row.mastered =
      row.correctCount >= FINAL_SOUND_LEVEL_ONE_REQUIRED_CORRECT &&
      row.uniqueCorrectTargetWords.length >= FINAL_SOUND_LEVEL_ONE_REQUIRED_UNIQUE_WORDS &&
      !row.contentGap;
  });

  const masteredTargets = Object.values(bySound).filter(row => row.mastered).map(row => row.target);
  const coveredTargets = Object.values(bySound).filter(row => row.correctCount > 0).map(row => row.target);
  const stillNeedsPractice = Object.values(bySound)
    .filter(row => !row.mastered)
    .map(row => row.target);
  const contentGaps = Object.values(bySound)
    .filter(row => row.contentGap)
    .map(row => ({
      target: row.target,
      availableWordCount: row.availableTargetWords.length,
      availableTargetWords: row.availableTargetWords
    }));
  const allSoundsCovered = coveredTargets.length === finalSoundLevelOneTargets.length;
  const allSoundsMastered = masteredTargets.length === finalSoundLevelOneTargets.length;
  const enoughSuccessfulRounds = successfulRounds >= FINAL_SOUND_LEVEL_ONE_REQUIRED_SUCCESSFUL_ROUNDS;

  return {
    bySound,
    coveredTargets,
    masteredTargets,
    stillNeedsPractice,
    contentGaps,
    successfulRounds,
    requiredSuccessfulRounds: FINAL_SOUND_LEVEL_ONE_REQUIRED_SUCCESSFUL_ROUNDS,
    allSoundsCovered,
    allSoundsMastered,
    enoughSuccessfulRounds,
    levelOneMastered: allSoundsMastered && enoughSuccessfulRounds
  };
}
