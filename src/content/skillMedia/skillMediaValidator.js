import { hasMediaForItem } from "./skillCoverageUtils.js";
import { managedSkillDefinitions, validateExplicitRhymeItem } from "./skillAssetRegistry.js";

export function validateSkillBankItem(item, { assetExists = () => true } = {}) {
  const issues = [];
  const definition = managedSkillDefinitions[item.skillId];
  const media = hasMediaForItem(item, assetExists);

  if (!definition) issues.push(`unknown managed skill: ${item.skillId || "(missing)"}`);
  if (!item.id) issues.push("missing id");
  if (!item.target) issues.push("missing target");
  if (!item.correctAnswer && item.source !== "initial_sound_word_bank") issues.push("missing correctAnswer");
  if (media.missingImage) issues.push("missing required image");
  if (media.missingAudio) issues.push("missing required audio");
  if (item.answerOptions?.length) {
    const options = item.answerOptions.map(option => String(option || "").toLowerCase());
    if (new Set(options).size !== options.length) issues.push("duplicate answer options");
  }
  issues.push(...validateExplicitRhymeItem(item));

  return issues;
}

export function buildMissingMediaRequestRows(summaries) {
  return Object.values(summaries).flatMap(summary => {
    const missing = [
      ...summary.missingImages.map(item => ({ item, mediaType: "image", path: item.imageUrl })),
      ...summary.missingAudio.map(item => ({ item, mediaType: "audio", path: item.audioUrl }))
    ];

    return missing.map(({ item, mediaType, path }) => ({
      skillId: summary.skillId,
      skill: summary.label,
      target: item.target,
      targetWord: item.targetWord,
      level: item.level,
      mediaType,
      expectedPath: path || "(missing path)",
      prompt: mediaType === "image"
        ? `Create a clean, child-safe, imageable illustration for "${item.targetWord || item.target}" with no embedded text.`
        : `Record clean American English word audio for "${item.targetWord || item.target}". Speak the word naturally, no spelling, no music, no sound effects.`,
      reason: `Required for ${summary.label} ${item.level ? `Level ${item.level}` : ""} media-backed practice.`
    }));
  });
}
