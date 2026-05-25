import {
  getManagedSkillIds,
  getSkillBankItems,
  managedSkillDefinitions,
  runtimeQuestionSignature,
  validateExplicitRhymeItem
} from "./skillAssetRegistry.js";

export function normalizeSkillAssetPath(assetPath = "") {
  return String(assetPath || "").replace(/^\//, "");
}

export function isPathPresent(assetPath, assetExists = () => true) {
  if (!assetPath) return false;
  return assetExists(assetPath);
}

export function hasMediaForItem(item, assetExists = () => true) {
  const required = managedSkillDefinitions[item.skillId]?.requiredMedia || [];
  const hasImage = item.mediaComplete === true ||
    (item.imagePaths || []).some(path => isPathPresent(path, assetExists)) ||
    Boolean(item.imageUrl && isPathPresent(item.imageUrl, assetExists));
  const hasAudio = item.mediaComplete === true ||
    (item.audioPaths || []).some(path => isPathPresent(path, assetExists)) ||
    Boolean(item.audioUrl && isPathPresent(item.audioUrl, assetExists));

  return {
    image: !required.includes("image") || hasImage,
    audio: !required.includes("audio") || hasAudio,
    complete: (!required.includes("image") || hasImage) && (!required.includes("audio") || hasAudio),
    missingImage: required.includes("image") && !hasImage,
    missingAudio: required.includes("audio") && !hasAudio
  };
}

export function getDuplicateValues(values = []) {
  return [...new Set(values.filter((value, index) => value && values.indexOf(value) !== index))];
}

export function summarizeSkillBankItems({ assetExists = () => true, items = getSkillBankItems() } = {}) {
  const summaries = {};

  getManagedSkillIds().forEach(skillId => {
    const definition = managedSkillDefinitions[skillId];
    const skillItems = items.filter(item => item.skillId === skillId);
    const activeItems = skillItems.filter(item => item.active !== false);
    const validMediaItems = activeItems.filter(item => hasMediaForItem(item, assetExists).complete);
    const targets = [...new Set(activeItems.map(item => item.target).filter(Boolean))].sort();
    const validTargets = [...new Set(validMediaItems.map(item => item.target).filter(Boolean))].sort();
    const blockedTargets = (definition.expectedTargets || targets)
      .filter(target => !validMediaItems.some(item => item.target === target));
    const duplicateIds = getDuplicateValues(activeItems.map(item => item.id));
    const duplicateSignatures = getDuplicateValues(activeItems.map(item => item.signature));
    const duplicateTargetWords = getDuplicateValues(activeItems.map(item => `${item.skillId}|${item.level}|${item.targetWord}`));
    const byLevel = {};
    const byTarget = {};
    const missingImages = [];
    const missingAudio = [];
    const rhymeIssues = [];

    activeItems.forEach(item => {
      const media = hasMediaForItem(item, assetExists);
      byLevel[item.level] = (byLevel[item.level] || 0) + 1;
      if (item.target) byTarget[item.target] = (byTarget[item.target] || 0) + 1;
      if (media.missingImage) missingImages.push(item);
      if (media.missingAudio) missingAudio.push(item);
      validateExplicitRhymeItem(item).forEach(issue => rhymeIssues.push({ item, issue }));
    });

    summaries[skillId] = {
      skillId,
      label: definition.label,
      totalItems: skillItems.length,
      activeItems: activeItems.length,
      validMediaItems: validMediaItems.length,
      uniqueTargets: targets.length,
      validTargets: validTargets.length,
      expectedTargets: definition.expectedTargets || [],
      blockedTargets,
      byLevel,
      byTarget,
      duplicateIds,
      duplicateSignatures,
      duplicateTargetWords,
      missingImages,
      missingAudio,
      rhymeIssues,
      belowMinimum: validMediaItems.length < (definition.minimumValidItems || 0)
    };
  });

  return summaries;
}

export function makeSkillItemSignature(item = {}) {
  return item.signature || runtimeQuestionSignature(item.raw || item);
}
