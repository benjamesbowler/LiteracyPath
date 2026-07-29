import {
  findAssessmentMediaCandidates,
  getAssessmentMediaByPath,
  isAssessmentMediaApproved,
  isAssessmentMediaVariationSkill,
  isEarlyAssessmentMediaSkill,
  normalizeAssessmentMediaWord,
  normalizeAssessmentSkillId
} from "./assessmentMediaRegistry.js";
import {
  isHfwClozeFormat,
  isHfwSentenceSpellFormat
} from "./hfwAssessmentFormatConfig.js";
import {
  isHfwQuestionImagePairApproved,
  stripHfwQuestionImageFields
} from "./hfwQuestionImageReview.js";
import {
  isMediaPairingApproved,
  isMediaPairingQuarantined
} from "./mediaQaReviewStatus.js";
import { isGraphemeChoiceQuestion } from "../utils/assessmentChoiceIntent.js";
import { getAssessmentQuestionContentKey } from "./assessmentRoundSelector.js";

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
  return getAssessmentQuestionContentKey(question);
}

export function inferAssessmentQuestionTargetWord(question = {}) {
  const skillId = normalizeAssessmentSkillId(question.skillId || question.skill || question.skillName || "");
  const canUseAnswer = isEarlyAssessmentMediaSkill(skillId) && !isGraphemeChoiceQuestion(question);
  const pairTarget = isPairSelectionMediaQuestion(question)
    ? question.anchorWord || question.correctWords?.[0] || question.correctAnswers?.[0] || ""
    : "";
  return normalizeAssessmentMediaWord(
    pairTarget ||
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
  if (normalizedSkillId === "nouns") return "noun_image";
  if (normalizedSkillId === "verbs") return "verb_action";
  if (normalizedSkillId === "adjectives") return "adjective_visual";
  if (normalizedSkillId === "prepositions") return "preposition_scene";
  if (normalizedSkillId === "plurals") return "plural_pair";
  if (normalizedSkillId === "antonyms_synonyms") return "antonym_synonym_scene";
  if (normalizedSkillId === "homophones_homonyms") return "homophone_context";
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

function isPairSelectionMediaQuestion(question = {}) {
  const format = String(question.formatType || question.templateType || question.questionType || "").toUpperCase();
  return /(?:INITIAL|FINAL|RHYME)_SOUND_PAIR_SELECT/.test(format) ||
    ["initial_sound_pair", "final_sound_pair", "rhyme_pair"].includes(String(question.questionType || "").toLowerCase());
}

function isVisualCardMediaQuestion(question = {}) {
  const format = String(question.formatType || question.templateType || question.questionType || "").toUpperCase();
  return Array.isArray(question.imageCards) &&
    question.imageCards.length > 0 &&
    (
      String(question.questionType || "").toLowerCase() === "visual_card_choice" ||
      format === "RHYMING_PICTURE"
    );
}

function mediaOptionWord(option = {}) {
  return normalizeAssessmentMediaWord(
    option.word ||
    option.targetWord ||
    option.representedWord ||
    option.value ||
    option.label ||
    option.text ||
    option.answer
  );
}

function mediaOptionPath(option = {}, mediaType = "image") {
  if (mediaType === "audio") {
    return normalizePath(option.audioPath || option.audioUrl || option.audio || "");
  }
  return normalizePath(option.imagePath || option.imageUrl || option.image || "");
}

function validateExactOptionMedia(option = {}, { requireImage = false, requireAudio = false } = {}) {
  const issues = [];
  const word = mediaOptionWord(option);
  const imagePath = mediaOptionPath(option, "image");
  const audioPath = mediaOptionPath(option, "audio");
  const label = word || "(missing word)";
  if (!word) issues.push("media option is missing its represented word");
  if (requireImage && !imagePath) issues.push(`media option "${label}" is missing image media`);
  if (requireAudio && !audioPath) issues.push(`media option "${label}" is missing audio media`);
  if (word && imagePath) {
    const imageRecord = getAssessmentMediaByPath(imagePath, "image");
    if (!imageRecord?.available || imageRecord.normalizedWord !== word) {
      issues.push(`media option "${label}" image is not approved exact-target media: ${imagePath}`);
    }
  }
  if (word && audioPath) {
    const audioRecord = getAssessmentMediaByPath(audioPath, "audio");
    if (!audioRecord?.available || audioRecord.audioType !== "whole_word" || audioRecord.normalizedWord !== word) {
      issues.push(`media option "${label}" audio is not approved whole-word exact-target media: ${audioPath}`);
    }
  }
  return issues;
}

function isHfwSentenceQuestion(question = {}, skillId = "") {
  const normalizedSkillId = normalizeAssessmentSkillId(skillId || question.skillId || question.skill || question.skillName || "");
  const format = String(question.formatType || question.templateType || question.questionType || "").toUpperCase();
  return normalizedSkillId.startsWith("hfw_") && (isHfwClozeFormat(format) || isHfwSentenceSpellFormat(format));
}

function markUsed(usage, question = {}, resolved = {}) {
  if (!usage) return;
  const image = resolved.image?.path || currentImagePath(question);
  const optionImages = (question.imageCards || [])
    .map(option => mediaOptionPath(option, "image"))
    .filter(Boolean);
  const audio = resolved.audio?.path || currentAudioPath(question);
  const target = inferAssessmentQuestionTargetWord(question);
  const key = getQuestionMediaContentKey(question);
  const template = getQuestionTemplateKey(question);
  const prompt = getQuestionPromptKey(question);
  if (image) usage.imagePaths.add(image);
  optionImages.forEach(optionImage => usage.imagePaths.add(optionImage));
  if (audio) usage.audioPaths.add(audio);
  if (target) usage.targetWords.add(target);
  if (key) usage.contentKeys.add(key);
  if (template) usage.templateKeys.add(template);
  if (prompt) usage.promptKeys.add(prompt);
}

function resolveVisualCardOptionImages(question = {}, {
  imageRole = "target_object",
  level = null,
  phase = null,
  sessionUsage = null,
  skillId = "",
  studentUsage = null
} = {}) {
  if (!isVisualCardMediaQuestion(question)) return question;

  const questionId = question.approvedQuestionId || question.questionId || question.id || "";
  const imageCards = (question.imageCards || []).map(option => {
    const word = mediaOptionWord(option);
    if (!word) return option;

    const existingImage = mediaOptionPath(option, "image");
    const existingRecord = existingImage
      ? getAssessmentMediaByPath(existingImage, "image")
      : null;
    const existingImageQuarantined = Boolean(existingImage && isMediaPairingQuarantined({
      area: "assessment",
      skillId,
      questionId,
      imagePath: existingImage
    }));
    const existingImageUsable = Boolean(
      !existingImageQuarantined &&
      existingRecord?.available &&
      existingRecord.normalizedWord === word
    );
    const existingImageUsed = Boolean(sessionUsage?.imagePaths?.has(existingImage));
    const imageCandidates = getApprovedMediaForTarget({
      word,
      skillId,
      mediaType: "image",
      role: imageRole,
      level,
      phase
    }).filter(record => !isMediaPairingQuarantined({
      area: "assessment",
      skillId,
      questionId,
      imagePath: record.path
    }));
    const chosenImage = imageCandidates.length
      ? pickLeastRecentlyUsedMedia({
        candidates: imageCandidates,
        sessionUsage,
        studentUsage,
        mediaType: "image",
        role: imageRole
      })
      : null;
    const shouldUseChosenImage = Boolean(chosenImage && (
      !existingImageUsable ||
      existingImageUsed ||
      roleScore(chosenImage, imageRole) > roleScore(existingRecord || {}, imageRole)
    ));
    const image = shouldUseChosenImage
      ? chosenImage.path
      : existingImageUsable
        ? existingImage
        : "";

    if (!image) return option;
    return {
      ...option,
      image,
      imageUrl: image,
      imagePath: image
    };
  });

  const answerOptions = Array.isArray(question.answerOptions)
    ? question.answerOptions.map(option => {
      const matchingCard = imageCards.find(card =>
        mediaOptionWord(card) === mediaOptionWord(option)
      );
      const image = mediaOptionPath(matchingCard, "image");
      return image && option && typeof option === "object"
        ? { ...option, image, imageUrl: image, imagePath: image }
        : option;
    })
    : question.answerOptions;

  return {
    ...question,
    answerOptions,
    imageCards
  };
}

export function resolveQuestionMediaDynamically(question = {}, context = {}) {
  const skillId = normalizeAssessmentSkillId(context.skillId || question.skillId || question.skill || question.skillName || "");
  if (!isAssessmentMediaVariationSkill(skillId)) return question;

  const targetWord = inferAssessmentQuestionTargetWord(question);
  if (!targetWord) return question;

  const sessionUsage = context.sessionUsage || null;
  const studentUsage = context.studentUsage || null;
  const level = context.level ?? question.level ?? question.difficulty ?? null;
  const phase = context.phase ?? question.phase ?? question.assessmentPhase ?? null;
  const imageRole = roleForQuestion(question, skillId);
  const resolvedMedia = { image: null, audio: null, warnings: [] };
  const out = resolveVisualCardOptionImages(
    { ...question, skillId: question.skillId || skillId, targetWord: question.targetWord || targetWord },
    {
      imageRole,
      level,
      phase,
      sessionUsage,
      skillId,
      studentUsage
    }
  );
  const questionId = out.approvedQuestionId || out.questionId || out.id || "";

  if (isPairSelectionMediaQuestion(out)) {
    const instructionAudioPath = currentAudioPath(out);
    const instructionAudioRecord = instructionAudioPath
      ? getAssessmentMediaByPath(instructionAudioPath, "audio")
      : null;
    markUsed(sessionUsage, out, resolvedMedia);
    return {
      ...out,
      assessmentMediaResolved: true,
      assessmentMediaResolution: {
        targetWord,
        skillId,
        imageRole: "option_card",
        requiredAudioType: "instruction",
        imagePath: "",
        audioPath: instructionAudioPath,
        imageAssetId: "",
        audioAssetId: instructionAudioRecord?.id || "",
        warnings: instructionAudioPath && !instructionAudioRecord?.available
          ? [`instruction_audio_not_registry_approved:${instructionAudioPath}`]
          : []
      }
    };
  }

  if (isHfwSentenceQuestion(out, skillId)) {
    const existingImage = currentImagePath(out);
    const existingImageRecord = existingImage ? getAssessmentMediaByPath(existingImage, "image") : null;
    const policy = String(out.imagePolicy || out.hfwImagePolicy || "no_image").trim() || "no_image";
    const pairing = { area: "assessment", skillId, questionId, imagePath: existingImage };
    const approvedExactPair = Boolean(existingImage && (isHfwQuestionImagePairApproved(out, existingImage) || isMediaPairingApproved(pairing)));
    const quarantinedExactPair = Boolean(existingImage && isMediaPairingQuarantined(pairing));
    const allowedPolicy = ["verified_cartoon_target_scene", "verified_cartoon_sentence_scene"].includes(policy);
    const allowedRole = ["verified_cartoon_target_scene", "verified_cartoon_sentence_scene", "verified_target_scene", "verified_sentence_scene"].includes(existingImageRecord?.imageRole);
    const allowedQa = existingImageRecord?.available && !["review_needed", "blocked", "rejected", "deprecated"].includes(existingImageRecord?.qaStatus);
    const allowedStyle = existingImageRecord?.styleType !== "photorealistic";
    if (!quarantinedExactPair && approvedExactPair && allowedPolicy && allowedRole && allowedQa && allowedStyle) {
      resolvedMedia.image = existingImageRecord;
      markUsed(sessionUsage, out, resolvedMedia);
      return {
        ...out,
        imageRequired: false,
        hfwImageQaStatus: "approved",
        assessmentMediaResolved: true,
        assessmentMediaResolution: {
          targetWord,
          skillId,
          imageRole: existingImageRecord?.imageRole || imageRole,
          requiredAudioType: "",
          imagePath: existingImage,
          audioPath: "",
          imageAssetId: existingImageRecord?.id || "",
          audioAssetId: "",
          warnings: []
        }
      };
    }

    const stripped = stripHfwQuestionImageFields({
      ...out,
      imageRequired: false,
      imagePolicy: "no_image",
      hfwImagePolicy: "none",
      hfwImageQaStatus: existingImage ? "not_approved_exact_pair" : "no_image_required"
    });
    markUsed(sessionUsage, stripped, resolvedMedia);
    return {
      ...stripped,
      assessmentMediaResolved: true,
      assessmentMediaResolution: {
        targetWord,
        skillId,
        imageRole: "",
        requiredAudioType: "",
        imagePath: "",
        audioPath: "",
        imageAssetId: "",
        audioAssetId: "",
        warnings: []
      }
    };
  }

  const imageCandidates = getApprovedMediaForTarget({
    word: targetWord,
    skillId,
    mediaType: "image",
    role: imageRole,
    level,
    phase
  }).filter(record => !isMediaPairingQuarantined({
    area: "assessment",
    skillId,
    questionId,
    imagePath: record.path
  }));
  const existingImage = currentImagePath(question);
  const existingImageRecord = existingImage ? getAssessmentMediaByPath(existingImage, "image") : null;
  const existingImageQuarantined = Boolean(existingImage && isMediaPairingQuarantined({
    area: "assessment",
    skillId,
    questionId,
    imagePath: existingImage
  }));
  const existingImageUsable = Boolean(!existingImageQuarantined && existingImageRecord?.available && existingImageRecord.normalizedWord === targetWord);
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
  } else if (existingImageQuarantined) {
    Object.assign(out, stripHfwQuestionImageFields(out));
    resolvedMedia.warnings.push(`image_pairing_quarantined:${existingImage}`);
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
  if (isPairSelectionMediaQuestion(question)) {
    const instructionAudioRecord = audioPath ? getAssessmentMediaByPath(audioPath, "audio") : null;
    if (audioPath && !instructionAudioRecord?.available) {
      issues.push(`instruction audio is not approved media: ${audioPath}`);
    }
    for (const option of question.imageCards || []) {
      issues.push(...validateExactOptionMedia(option, { requireImage: true, requireAudio: true }));
    }
    return issues;
  }
  if (isVisualCardMediaQuestion(question)) {
    for (const option of question.imageCards || []) {
      issues.push(...validateExactOptionMedia(option, { requireImage: true }));
    }
  }
  if (isHfwSentenceQuestion(question, skillId)) {
    const policy = String(question.imagePolicy || question.hfwImagePolicy || "").trim();
    if (imagePath && !isHfwQuestionImagePairApproved(question, imagePath)) {
      issues.push(`HFW sentence image lacks exact question-image QA approval: ${imagePath}`);
    }
    if (imagePath && !policy) issues.push("HFW sentence image is present but imagePolicy is missing");
    if (["no_image", "none", ""].includes(policy) && imagePath) issues.push("HFW sentence imagePolicy is no_image but image media is present");
    if (imagePath && !["verified_cartoon_target_scene", "verified_cartoon_sentence_scene"].includes(policy)) {
      issues.push(`HFW sentence image policy is not verified: ${policy || "(missing)"}`);
    }
    if (imagePath && imageRecord?.imageRole && !["verified_cartoon_target_scene", "verified_cartoon_sentence_scene", "verified_target_scene", "verified_sentence_scene"].includes(imageRecord.imageRole)) {
      issues.push(`HFW sentence image role is not verified: ${imageRecord.imageRole}`);
    }
    if (imagePath && imageRecord?.styleType === "photorealistic") {
      issues.push(`HFW sentence image is photorealistic: ${imagePath}`);
    }
    if (imagePath && ["review_needed", "blocked", "rejected", "deprecated"].includes(imageRecord?.qaStatus)) {
      issues.push(`HFW sentence image QA status is not approved: ${imageRecord?.qaStatus || "unknown"}`);
    }
  }
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
