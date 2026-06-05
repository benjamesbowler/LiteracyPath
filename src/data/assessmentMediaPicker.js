import {
  findAssessmentMediaCandidates,
  getAssessmentMediaByPath,
  isAssessmentMediaApproved,
  isEarlyAssessmentMediaSkill,
  normalizeAssessmentMediaWord,
  normalizeAssessmentSkillId
} from "./assessmentMediaRegistry.js";
import { isGraphemeChoiceQuestion } from "../utils/assessmentChoiceIntent.js";

function answerValue(value) {
  if (Array.isArray(value)) return value[0] || "";
  if (value && typeof value === "object") return value.word || value.value || value.label || value.text || value.answer || "";
  return value || "";
}

function normalizePath(value = "") {
  return String(value || "").trim();
}

function ensureSet(value) {
  if (value instanceof Set) return value;
  if (Array.isArray(value)) return new Set(value);
  return new Set();
}

export function createAssessmentSessionMediaUsage(seed = {}) {
  return {
    imagePaths: ensureSet(seed.imagePaths),
    audioPaths: ensureSet(seed.audioPaths),
    targetWords: ensureSet(seed.targetWords),
    contentKeys: ensureSet(seed.contentKeys),
    templateKeys: ensureSet(seed.templateKeys),
    promptKeys: ensureSet(seed.promptKeys),
    correctQuestionIds: ensureSet(seed.correctQuestionIds)
  };
}

function getQuestionTemplateKey(question = {}) {
  return String(question.runtimeTemplateKey || question.templateKey || question.templateType || question.formatType || question.questionType || "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .trim();
}

function getQuestionPromptKey(question = {}) {
  const promptText = String(question.prompt || question.question || question.sentence || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  const mediaContext = [
    question.spokenPrompt,
    question.audioText,
    currentImagePath(question)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return [promptText, mediaContext].filter(Boolean).join(" :: ");
}

export function getQuestionMediaContentKey(question = {}) {
  const skillId = normalizeAssessmentSkillId(question.skillId || question.skill || question.skillName || "");
  const prompt = String(question.prompt || question.question || question.spokenPrompt || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  const target = inferAssessmentQuestionTargetWord(question);
  const answer = normalizeAssessmentMediaWord(answerValue(question.correctAnswer || question.answer || question.correctAnswers));
  const template = String(question.templateType || question.formatType || question.questionType || "")
    .toLowerCase()
    .replace(/\s+/g, "_");
  return [skillId, template, target, prompt, answer].filter(Boolean).join("::");
}

export function inferAssessmentQuestionTargetWord(question = {}) {
  const skillId = normalizeAssessmentSkillId(question.skillId || question.skill || question.skillName || "");
  const canUseAnswer = isEarlyAssessmentMediaSkill(skillId) && !isGraphemeChoiceQuestion(question);
  return normalizeAssessmentMediaWord(
    question.targetWord ||
    question.word ||
    question.audioText ||
    question.spokenWord ||
    question.anchorWord ||
    question.representedWord ||
    question.depthTargetWord ||
    (canUseAnswer ? answerValue(question.correctAnswer || question.answer) : "")
  );
}

function roleForQuestion(question = {}, skillId = "") {
  const normalizedSkillId = normalizeAssessmentSkillId(skillId || question.skillId || question.skill || question.skillName || "");
  if (normalizedSkillId.startsWith("hfw_")) return "hfw_scene";
  if (normalizedSkillId === "rhyming") return "rhyming_target";
  return "target_object";
}

function requiresWholeWordAudio(question = {}, skillId = "") {
  const normalizedSkillId = normalizeAssessmentSkillId(skillId || question.skillId || question.skill || question.skillName || "");
  if (normalizedSkillId.startsWith("hfw_")) return false;
  if (isGraphemeChoiceQuestion(question)) return false;
  const text = String([question.templateType, question.formatType, question.questionType, question.prompt, question.question].join(" ")).toLowerCase();
  return /listen|find the word|matches the picture|pick the word|heard word/.test(text) || [
    "cvc_short_vowels",
    "short_vowel_discrimination"
  ].includes(normalizedSkillId);
}

function getStudentUsageScore(path = "", studentUsage = null, mediaType = "image") {
  if (!studentUsage) return 0;
  const key = normalizePath(path);
  const bucket = mediaType === "audio" ? studentUsage.audioPaths : studentUsage.imagePaths;
  if (bucket instanceof Map) return Number(bucket.get(key) || 0);
  if (bucket && typeof bucket === "object") return Number(bucket[key] || 0);
  return 0;
}

function roleScore(record, role = "") {
  if (!role) return 0;
  if (record.imageRole === role) return 100;
  if (["generic_word", "target_object"].includes(record.imageRole)) return 20;
  return 0;
}

export function getApprovedMediaForTarget({ word = "", skillId = "", mediaType = "image", role = "", audioType = "", level = null, phase = null } = {}) {
  return findAssessmentMediaCandidates({ word, skillId, mediaType, role, audioType, level, phase });
}

export function pickLeastRecentlyUsedMedia({ candidates = [], sessionUsage = null, studentUsage = null, mediaType = "image", role = "" } = {}) {
  if (!candidates.length) return null;
  const usage = sessionUsage || createAssessmentSessionMediaUsage();
  const sessionSet = mediaType === "audio" ? usage.audioPaths : usage.imagePaths;
  return candidates
    .slice()
    .sort((a, b) => {
      const aUsed = sessionSet.has(a.path) ? 1 : 0;
      const bUsed = sessionSet.has(b.path) ? 1 : 0;
      if (aUsed !== bUsed) return aUsed - bUsed;
      const studentDelta = getStudentUsageScore(a.path, studentUsage, mediaType) - getStudentUsageScore(b.path, studentUsage, mediaType);
      if (studentDelta !== 0) return studentDelta;
      const specificityDelta = roleScore(b, role) - roleScore(a, role);
      if (specificityDelta !== 0) return specificityDelta;
      return (a.variantNumber || 9999) - (b.variantNumber || 9999) || a.path.localeCompare(b.path);
    })[0] || null;
}

function currentImagePath(question = {}) {
  return normalizePath(question.imagePath || question.imageUrl || question.image || question.targetImagePath || question.targetImageUrl || question.targetImage || "");
}

function currentAudioPath(question = {}) {
  return normalizePath(question.audioPath || question.audioUrl || question.audio || "");
}

function markUsed(usage, question = {}, resolved = {}) {
  if (!usage) return;
  const image = resolved.image?.path || currentImagePath(question);
  const audio = resolved.audio?.path || currentAudioPath(question);
  const target = inferAssessmentQuestionTargetWord(question);
  const key = getQuestionMediaContentKey(question);
  const template = getQuestionTemplateKey(question);
  const prompt = getQuestionPromptKey(question);
  if (image) usage.imagePaths.add(image);
  if (audio) usage.audioPaths.add(audio);
  if (target) usage.targetWords.add(target);
  if (key) usage.contentKeys.add(key);
  if (template) usage.templateKeys.add(template);
  if (prompt) usage.promptKeys.add(prompt);
}

export function resolveQuestionMediaDynamically(question = {}, context = {}) {
  const skillId = normalizeAssessmentSkillId(context.skillId || question.skillId || question.skill || question.skillName || "");
  if (!isEarlyAssessmentMediaSkill(skillId)) return question;

  const targetWord = inferAssessmentQuestionTargetWord(question);
  if (!targetWord) return question;

  const sessionUsage = context.sessionUsage || null;
  const studentUsage = context.studentUsage || null;
  const level = context.level ?? question.level ?? question.difficulty ?? null;
  const phase = context.phase ?? question.phase ?? question.assessmentPhase ?? null;
  const imageRole = roleForQuestion(question, skillId);
  const resolvedMedia = { image: null, audio: null, warnings: [] };
  const out = { ...question, skillId: question.skillId || skillId, targetWord: question.targetWord || targetWord };

  const imageCandidates = getApprovedMediaForTarget({
    word: targetWord,
    skillId,
    mediaType: "image",
    role: imageRole,
    level,
    phase
  });
  const existingImage = currentImagePath(question);
  const existingImageRecord = existingImage ? getAssessmentMediaByPath(existingImage, "image") : null;
  const existingImageUsable = Boolean(existingImageRecord?.available && existingImageRecord.normalizedWord === targetWord);
  const existingImageUsed = Boolean(sessionUsage?.imagePaths?.has(existingImage));
  const chosenImage = imageCandidates.length
    ? pickLeastRecentlyUsedMedia({ candidates: imageCandidates, sessionUsage, studentUsage, mediaType: "image", role: imageRole })
    : null;

  if (chosenImage && (!existingImageUsable || existingImageUsed || roleScore(chosenImage, imageRole) > roleScore(existingImageRecord || {}, imageRole))) {
    out.image = chosenImage.path;
    out.imageUrl = chosenImage.path;
    out.imagePath = chosenImage.path;
    if (question.targetImage || question.targetImageUrl || question.targetImagePath || skillId === "rhyming") {
      out.targetImage = chosenImage.path;
      out.targetImageUrl = chosenImage.path;
      out.targetImagePath = chosenImage.path;
    }
    resolvedMedia.image = chosenImage;
  } else if (existingImageUsable) {
    resolvedMedia.image = existingImageRecord;
  } else if (existingImage && !isAssessmentMediaApproved(existingImage, "image")) {
    resolvedMedia.warnings.push(`image_not_registry_approved:${existingImage}`);
  }

  const audioType = requiresWholeWordAudio(question, skillId) ? "whole_word" : "";
  const audioCandidates = audioType
    ? getApprovedMediaForTarget({ word: targetWord, skillId, mediaType: "audio", audioType })
    : [];
  const existingAudio = currentAudioPath(question);
  const existingAudioRecord = existingAudio ? getAssessmentMediaByPath(existingAudio, "audio") : null;
  const existingAudioUsable = Boolean(existingAudioRecord?.available && existingAudioRecord.normalizedWord === targetWord && (!audioType || existingAudioRecord.audioType === audioType));
  const existingAudioUsed = Boolean(sessionUsage?.audioPaths?.has(existingAudio));
  const chosenAudio = audioCandidates.length
    ? pickLeastRecentlyUsedMedia({ candidates: audioCandidates, sessionUsage, studentUsage, mediaType: "audio" })
    : null;

  if (chosenAudio && (!existingAudioUsable || existingAudioUsed)) {
    out.audio = chosenAudio.path;
    out.audioUrl = chosenAudio.path;
    out.audioPath = chosenAudio.path;
    resolvedMedia.audio = chosenAudio;
  } else if (existingAudioUsable) {
    resolvedMedia.audio = existingAudioRecord;
  } else if (existingAudio && audioType) {
    resolvedMedia.warnings.push(`whole_word_audio_not_registry_approved:${existingAudio}`);
  }

  markUsed(sessionUsage, out, resolvedMedia);

  return {
    ...out,
    assessmentMediaResolved: true,
    assessmentMediaResolution: {
      targetWord,
      skillId,
      imageRole,
      requiredAudioType: audioType,
      imagePath: resolvedMedia.image?.path || currentImagePath(out),
      audioPath: resolvedMedia.audio?.path || currentAudioPath(out),
      imageAssetId: resolvedMedia.image?.id || "",
      audioAssetId: resolvedMedia.audio?.id || "",
      warnings: resolvedMedia.warnings
    }
  };
}

export function validateResolvedQuestionMedia(question = {}, resolvedMedia = question.assessmentMediaResolution || {}) {
  const issues = [];
  const skillId = normalizeAssessmentSkillId(resolvedMedia.skillId || question.skillId || question.skill || question.skillName || "");
  if (!isEarlyAssessmentMediaSkill(skillId)) return issues;
  const targetWord = inferAssessmentQuestionTargetWord(question);
  const imagePath = resolvedMedia.imagePath || currentImagePath(question);
  const audioPath = resolvedMedia.audioPath || currentAudioPath(question);
  const imageRecord = imagePath ? getAssessmentMediaByPath(imagePath, "image") : null;
  const audioRecord = audioPath ? getAssessmentMediaByPath(audioPath, "audio") : null;
  if (imagePath && (!imageRecord?.available || imageRecord.normalizedWord !== targetWord)) {
    issues.push(`image does not resolve approved exact-target media: ${imagePath}`);
  }
  if (requiresWholeWordAudio(question, skillId) && audioPath && (!audioRecord?.available || audioRecord.audioType !== "whole_word" || audioRecord.normalizedWord !== targetWord)) {
    issues.push(`audio does not resolve approved whole-word exact-target media: ${audioPath}`);
  }
  return issues;
}

export function markQuestionMediaUsage(sessionUsage, question = {}) {
  markUsed(sessionUsage, question, question.assessmentMediaResolution || {});
  if (question.id && question.wasCorrect) sessionUsage?.correctQuestionIds?.add(question.id);
}
