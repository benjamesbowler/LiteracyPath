import { getApprovedAudioPath } from "./audioPreferenceManifest.js";

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function fieldValue(question, field) {
  if (field === "answerOptions") return question.answerOptions || question.options || question.imageCards || question.choices;
  if (field === "targetImage") return question.imagePath || question.imageUrl || question.image;
  if (field === "approvedAudio") return approvedTargetAudio(question);
  if (field === "visibleTargetText") return hasVisibleTargetText(question);
  return question[field];
}

function compactTemplateType(question = {}) {
  const formatType = String(question.templateType || question.formatType || "").toUpperCase();
  const questionType = String(question.questionType || "").toLowerCase();

  if (questionType === "listen_and_find_word") return "LISTEN_FIND_WORD";
  if (["initial_sound_pair", "final_sound_pair", "rhyme_pair"].includes(questionType)) return "PAIR_SELECT";
  if (formatType === "READ_FIND_WORD") return "FIND_WORD";
  if (formatType) return formatType;
  if (normalize([question.question, question.prompt].join(" ")).includes("matches the picture")) return "PICTURE_TO_PRINT";
  return questionType ? questionType.toUpperCase() : "LEGACY";
}

function choices(question = {}) {
  return Array.isArray(question.choices) ? question.choices.filter(Boolean) : [];
}

function optionCount(question = {}) {
  const options = question.answerOptions || question.options || question.imageCards || question.choices || [];
  return Array.isArray(options) ? options.length : 0;
}

function targetWord(question = {}) {
  return normalize(question.targetWord || question.audioText || question.answer || question.correctAnswer || question.itemKey);
}

function approvedTargetAudio(question = {}) {
  const key = question.audioText || question.targetWord || question.answer || question.correctAnswer;
  return getApprovedAudioPath(key, question.audioPath || question.audioUrl || "");
}

function cardWord(card) {
  return normalize(card?.word || card?.value || card?.id || card);
}

function cardAudioPath(card) {
  return getApprovedAudioPath(card?.word || card?.value || card?.id, card?.audio || card?.audioPath || "");
}

function hasVisibleTargetText(question = {}) {
  const target = targetWord(question);
  if (!target) return false;
  const promptText = normalize([question.question, question.prompt].join(" "));
  if (!promptText) return false;
  if (promptText === "find the word" || promptText === "find word") return false;
  return promptText.split(" ").includes(target);
}

function hasRequiredImages(question = {}) {
  const cards = question.imageCards || question.answerOptions || question.options || [];
  if (!Array.isArray(cards) || cards.length === 0) return false;
  return cards.every(card => card?.image || card?.imagePath || card?.imageUrl);
}

function hasRequiredCardAudio(question = {}) {
  const cards = question.imageCards || question.answerOptions || question.options || [];
  if (!Array.isArray(cards) || cards.length === 0) return false;
  return cards.every(card => Boolean(cardAudioPath(card)));
}

function correctAnswerCount(question = {}) {
  if (Array.isArray(question.correctAnswers)) return question.correctAnswers.length;
  if (Array.isArray(question.correctWords)) return question.correctWords.length;
  const answer = String(question.answer || question.correctAnswer || "");
  if (answer.includes("|")) return answer.split("|").filter(Boolean).length;
  return answer ? 1 : 0;
}

function hasDuplicateChoices(question = {}) {
  const normalized = choices(question).map(normalize).filter(Boolean);
  return normalized.length > 0 && new Set(normalized).size !== normalized.length;
}

function answerInChoices(question = {}) {
  if (compactTemplateType(question) === "PAIR_SELECT") return true;
  const answer = normalize(question.answer || question.correctAnswer);
  return Boolean(answer && choices(question).map(normalize).includes(answer));
}

export const templateValidationRules = {
  FIND_WORD: {
    requiredFields: ["targetWord", "visibleTargetText", "answerOptions"],
    optionalFields: ["explanation", "hint"],
    requiredMedia: [],
    allowedRenderModes: ["text_choice"]
  },
  LISTEN_FIND_WORD: {
    requiredFields: ["targetWord", "approvedAudio", "answerOptions"],
    optionalFields: ["imagePath", "explanation", "hint"],
    requiredMedia: ["approvedAudio"],
    allowedRenderModes: ["audio_text_choice", "audio_visual_choice"]
  },
  PICTURE_TO_PRINT: {
    requiredFields: ["targetImage", "answerOptions"],
    optionalFields: ["approvedAudio", "explanation", "hint"],
    requiredMedia: ["targetImage"],
    allowedRenderModes: ["main_image_text_choice"]
  },
  PAIR_SELECT: {
    requiredFields: ["answerOptions"],
    optionalFields: ["approvedAudio", "explanation", "hint"],
    requiredMedia: ["cardImages", "cardAudio"],
    allowedRenderModes: ["image_audio_pair_select"]
  },
  FIRST_SOUND: {
    requiredFields: ["targetWord", "answerOptions"],
    optionalFields: ["targetImage", "approvedAudio"],
    requiredMedia: [],
    allowedRenderModes: ["main_image_audio_choice", "text_choice"]
  },
  ENDING_SOUND: {
    requiredFields: ["targetWord", "answerOptions"],
    optionalFields: ["targetImage", "approvedAudio"],
    requiredMedia: [],
    allowedRenderModes: ["main_image_audio_choice", "text_choice"]
  },
  BLEND_SOUNDS: {
    requiredFields: ["targetWord", "answerOptions"],
    optionalFields: ["approvedAudio", "targetImage"],
    requiredMedia: [],
    allowedRenderModes: ["audio_visual_choice"]
  },
  PUT_SOUNDS_IN_ORDER: {
    requiredFields: ["targetWord", "soundTiles"],
    optionalFields: ["targetImage", "approvedAudio"],
    requiredMedia: [],
    allowedRenderModes: ["tile_order"]
  },
  RHYMING_PICTURE: {
    requiredFields: ["targetWord", "answerOptions"],
    optionalFields: ["approvedAudio"],
    requiredMedia: [],
    allowedRenderModes: ["visual_choice"]
  },
  SHORT_VOWEL_WORD: {
    requiredFields: ["targetWord", "answerOptions"],
    optionalFields: ["approvedAudio", "targetImage"],
    requiredMedia: [],
    allowedRenderModes: ["visual_choice"]
  },
  COMPLETE_WORD: {
    requiredFields: ["targetWord", "partialWord", "answerOptions"],
    optionalFields: ["targetImage", "approvedAudio"],
    requiredMedia: [],
    allowedRenderModes: ["partial_word_choice"]
  },
  SENTENCE_MATCHES_PICTURE: {
    requiredFields: ["targetImage", "answerOptions"],
    optionalFields: ["explanation", "hint"],
    requiredMedia: ["targetImage"],
    allowedRenderModes: ["main_image_sentence_choice"]
  },
  VOCABULARY_CATEGORY: {
    requiredFields: ["answerOptions"],
    optionalFields: ["targetImage", "explanation", "hint"],
    requiredMedia: [],
    allowedRenderModes: ["visual_choice", "text_choice"]
  },
  GRAMMAR_BASICS: {
    requiredFields: ["answerOptions"],
    optionalFields: ["sentence", "passage", "explanation", "hint"],
    requiredMedia: [],
    allowedRenderModes: ["sentence_choice"]
  }
};

export function getTemplateValidationRule(question = {}) {
  const templateType = compactTemplateType(question);
  return templateValidationRules[templateType] || null;
}

export function validateQuestionTemplate(question = {}, options = {}) {
  const templateType = compactTemplateType(question);
  const rule = templateValidationRules[templateType];
  const issues = [];
  const promptText = normalize([question.question, question.prompt].join(" "));

  if (!rule) return issues;

  for (const field of rule.requiredFields) {
    const value = fieldValue(question, field);
    if (Array.isArray(value) ? value.length === 0 : !value) {
      issues.push(`template ${templateType} missing required field: ${field}`);
    }
  }

  if (templateType !== "PUT_SOUNDS_IN_ORDER" && optionCount(question) < 2) {
    issues.push(`template ${templateType} needs at least 2 answer options`);
  }
  if (templateType === "PAIR_SELECT" && optionCount(question) < 3) issues.push("PAIR_SELECT needs at least 3 cards");
  if (templateType === "PAIR_SELECT" && correctAnswerCount(question) !== 2) issues.push(`PAIR_SELECT needs exactly 2 correct answers, found ${correctAnswerCount(question)}`);
  if (templateType === "PAIR_SELECT" && !hasRequiredImages(question)) issues.push("PAIR_SELECT missing required card images");
  if (templateType === "PAIR_SELECT" && !hasRequiredCardAudio(question)) issues.push("PAIR_SELECT missing approved card audio");
  if (templateType === "PICTURE_TO_PRINT" && ((question.imageCards || []).length > 0 || Object.keys(question.choiceImages || {}).length > 0)) {
    issues.push("PICTURE_TO_PRINT answer choices must be text-only, not image cards");
  }
  if (hasDuplicateChoices(question) && templateType !== "GRAMMAR_BASICS") issues.push("duplicate or visually identical answer choices");
  if (choices(question).length > 0 && !answerInChoices(question)) issues.push("correct answer is missing from answer choices");

  if (/\blisten\b/.test(promptText)) {
    const hasPromptAudio = Boolean(approvedTargetAudio(question));
    const hasUniformCardAudio = hasRequiredCardAudio(question);
    if (!hasPromptAudio && !hasUniformCardAudio) {
      issues.push("prompt says listen but no approved prompt or card audio exists");
    }
  }

  if (/\bfind the word\b/.test(promptText) && !hasVisibleTargetText(question) && !approvedTargetAudio(question)) {
    issues.push("find-the-word prompt has no visible target word or approved audio");
  }

  if (question.audioPath && !approvedTargetAudio(question)) {
    issues.push("audio path is present but not approved for active assessment");
  }

  if (options.assetExists) {
    const paths = [
      question.imagePath,
      question.imageUrl,
      question.audioPath,
      question.audioUrl,
      ...(question.imageCards || []).flatMap(card => [card.image, card.imagePath, card.audio, card.audioPath]),
      ...(question.answerOptions || []).flatMap(option => [option.image, option.imagePath, option.audio, option.audioPath])
    ].filter(Boolean);

    for (const assetPath of paths) {
      if (String(assetPath).startsWith("/") && !options.assetExists(assetPath)) {
        issues.push(`asset file does not exist: ${assetPath}`);
      }
    }
  }

  return issues;
}
