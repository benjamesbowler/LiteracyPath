import { INITIAL_SOUND_ROUND_LENGTH } from "../initialSounds/initialSoundWordBank.js";
import { buildAdaptiveSkillRound } from "../../utils/adaptiveSkillRoundBuilder.js";
import { managedSkillDefinitions } from "./skillAssetRegistry.js";

export function emptySkillProgress() {
  return {
    levels: {}
  };
}

export function normalizeSkillLevelProgress(progress = {}, level = 1) {
  const key = `level${level}`;
  const source = progress.levels?.[key] || progress[key] || {};

  return {
    coveredTargets: Array.isArray(source.coveredTargets) ? source.coveredTargets : [],
    masteredTargets: Array.isArray(source.masteredTargets) ? source.masteredTargets : [],
    usedTargetWordsByTarget: source.usedTargetWordsByTarget || {},
    weakTargets: Array.isArray(source.weakTargets) ? source.weakTargets : []
  };
}

export function buildSkillProgressFromHistory(records = [], skillId) {
  const progress = emptySkillProgress();

  records
    .filter(record => record.skillId === skillId || record.skill === managedSkillDefinitions[skillId]?.label || record.stage === managedSkillDefinitions[skillId]?.label)
    .forEach(record => {
      const level = Number(record.itemLevel || record.level || 1) || 1;
      const key = `level${level}`;
      const target = String(record.itemKey || record.target || "").toLowerCase();
      const word = String(record.targetWord || record.diagnosticTarget || "").toLowerCase();
      if (!target) return;

      if (!progress.levels[key]) {
        progress.levels[key] = {
          coveredTargets: [],
          masteredTargets: [],
          weakTargets: [],
          usedTargetWordsByTarget: {}
        };
      }

      const levelProgress = progress.levels[key];
      if (!levelProgress.coveredTargets.includes(target)) levelProgress.coveredTargets.push(target);
      if (record.isCorrect && !levelProgress.masteredTargets.includes(target)) levelProgress.masteredTargets.push(target);
      if (!record.isCorrect && !levelProgress.weakTargets.includes(target)) levelProgress.weakTargets.push(target);
      if (word) {
        levelProgress.usedTargetWordsByTarget[target] = [
          ...(levelProgress.usedTargetWordsByTarget[target] || []),
          word
        ].filter((item, index, list) => list.indexOf(item) === index);
      }
    });

  return progress;
}

export function getRoundPhaseForTargets({ levelProgress, availableTargets, roundLength = INITIAL_SOUND_ROUND_LENGTH }) {
  const covered = new Set(levelProgress.coveredTargets || []);
  const coveredCount = availableTargets.filter(target => covered.has(target)).length;
  const firstPassTargetCount = Math.min(roundLength, availableTargets.length);
  if (coveredCount < firstPassTargetCount) return 1;
  if (coveredCount < availableTargets.length) return 2;
  return 3;
}

export function buildSkillRoundPlan({
  skillId,
  items,
  progress = emptySkillProgress(),
  level = 1,
  roundLength = INITIAL_SOUND_ROUND_LENGTH,
  seed = Date.now()
}) {
  const levelProgress = normalizeSkillLevelProgress(progress, level);
  const levelItems = items.filter(item => item.skillId === skillId && item.level === level && item.active !== false);
  const availableTargets = [...new Set(levelItems.map(item => item.target).filter(Boolean))].sort();
  const phase = getRoundPhaseForTargets({ levelProgress, availableTargets, roundLength });
  const covered = new Set(levelProgress.coveredTargets || []);
  const weak = new Set(levelProgress.weakTargets || []);
  const uncoveredTargets = availableTargets.filter(target => !covered.has(target));
  const reviewTargets = availableTargets.filter(target => covered.has(target));
  const orderedTargets =
    phase === 1
      ? uncoveredTargets
      : phase === 2
        ? [...uncoveredTargets, ...reviewTargets]
        : [
          ...availableTargets.filter(target => weak.has(target)),
          ...availableTargets.filter(target => !weak.has(target))
        ];

  const round = buildAdaptiveSkillRound({
    candidates: levelItems,
    targetOrder: orderedTargets,
    usedTargetWordsByTarget: levelProgress.usedTargetWordsByTarget,
    roundLength,
    seed
  });

  return {
    items: round.items,
    meta: {
      skillId,
      level,
      phase,
      availableTargets,
      uncoveredTargets,
      reviewTargets: round.items.filter(item => covered.has(item.target)).map(item => item.target),
      selectedTargets: round.items.map(item => item.target),
      selectedTargetWords: round.items.map(item => item.targetWord),
      blockedTargets: (managedSkillDefinitions[skillId]?.expectedTargets || []).filter(target => !availableTargets.includes(target))
    }
  };
}
