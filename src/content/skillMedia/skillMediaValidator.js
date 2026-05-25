import { hasMediaForItem } from "./skillCoverageUtils.js";
import { managedSkillDefinitions, validateExplicitRhymeItem } from "./skillAssetRegistry.js";
import { getAnswerOptionLabel } from "../../utils/answerOptions.js";

function correctAnswerTokens(item = {}) {
  const rawTokens = [
    ...(Array.isArray(item.raw?.correctWords) ? item.raw.correctWords : []),
    ...(Array.isArray(item.raw?.correctAnswers) ? item.raw.correctAnswers : []),
    item.correctAnswer
  ];

  return rawTokens
    .flatMap(token => String(token || "").split("|"))
    .map(token => token.trim().toLowerCase())
    .filter(Boolean);
}

const LEVEL_ONE_FINAL_SOUND_BLOCKLIST = new Set([
  "nd",
  "sk",
  "st",
  "mp",
  "nk",
  "ng",
  "sh",
  "ch",
  "th",
  "ll",
  "ss",
  "ff",
  "ck"
]);

function promptText(item = {}) {
  return String([
    item.raw?.prompt,
    item.raw?.question,
    item.raw?.spokenPrompt
  ].filter(Boolean).join(" ")).toLowerCase();
}

function finalSoundLevelIssues(item = {}) {
  if (item.skillId !== "ending_sounds") return [];

  const issues = [];
  const level = Number(item.level || item.raw?.level || item.raw?.difficulty || 1) >= 2 ? 2 : 1;
  const finalSound = String(
    item.targetFinalSound ||
    item.raw?.targetFinalSound ||
    item.raw?.targetSound ||
    item.raw?.itemKey ||
    item.target ||
    ""
  ).toLowerCase().trim();
  const finalSoundType = String(item.finalSoundType || item.raw?.finalSoundType || "").toLowerCase().trim();
  const text = promptText(item);

  if (/\b(start|starts|starting|first|beginning|initial)\b/.test(text)) {
    issues.push("Final Sounds item uses an initial/start-sound prompt");
  }
  if (!/\b(end|ending|final)\b/.test(text)) {
    issues.push("Final Sounds item is missing an ending/final-sound prompt");
  }
  if (level === 1) {
    if (finalSound.length !== 1 || LEVEL_ONE_FINAL_SOUND_BLOCKLIST.has(finalSound)) {
      issues.push(`Level 1 Final Sounds may only use one-letter final sounds, found "${finalSound || "(missing)"}"`);
    }
    if (finalSoundType && finalSoundType !== "single_letter") {
      issues.push(`Level 1 Final Sounds finalSoundType must be single_letter, found "${finalSoundType}"`);
    }
  }

  return issues;
}

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
    const options = item.answerOptions.map(getAnswerOptionLabel);
    const normalizedOptions = options.map(option => option.toLowerCase());
    const missingLabels = item.answerOptions.filter(option => !getAnswerOptionLabel(option));
    if (missingLabels.length) issues.push("answer option missing visible label");
    if (new Set(normalizedOptions).size !== normalizedOptions.length) issues.push("duplicate answer options");
    const correctTokens = [...new Set(correctAnswerTokens(item))];
    if (correctTokens.length) {
      correctTokens.forEach(token => {
        const correctCount = normalizedOptions.filter(option => option === token).length;
        if (correctCount !== 1) issues.push(`correct answer label "${token}" must appear exactly once, found ${correctCount}`);
      });
    }
  }
  issues.push(...validateExplicitRhymeItem(item));
  issues.push(...finalSoundLevelIssues(item));

  return issues;
}

export function buildMissingMediaRequestRows(summaries) {
  return Object.values(summaries).flatMap(summary => {
    const requestableMissingImages = summary.skillId === "initial_sounds"
      ? summary.missingImages.filter(item => item.source === "initial_sound_word_bank")
      : summary.missingImages;
    const requestableMissingAudio = summary.skillId === "initial_sounds"
      ? summary.missingAudio.filter(item => item.source === "initial_sound_word_bank")
      : summary.missingAudio;
    const missing = [
      ...requestableMissingImages.map(item => ({ item, mediaType: "image", path: item.imageUrl })),
      ...requestableMissingAudio.map(item => ({ item, mediaType: "audio", path: item.audioUrl }))
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
        ? `Create a clean, child-safe, imageable illustration for "${item.targetWord || item.target}" with no embedded text. Use natural object colors; do not make ordinary objects rainbow-colored or visually chaotic unless the target word is "rainbow".`
        : `Record clean American English word audio for "${item.targetWord || item.target}". Speak the word naturally, no spelling, no music, no sound effects.`,
      reason: `Required for ${summary.label} ${item.level ? `Level ${item.level}` : ""} media-backed practice.`
    }));
  });
}
