const GENERIC_IMAGE_NAMES = new Set([
  "assessment image",
  "image",
  "picture",
  "question image",
  "question picture",
  "question visual",
  "visual"
]);

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanSource(value = "") {
  const source = cleanText(value);
  return source === "null" || source === "undefined" ? "" : source;
}

function getQuestionId(question = {}) {
  return cleanText(question.id || question.questionId);
}

function getMediaSource(value = {}) {
  if (typeof value === "string") return cleanSource(value);
  return cleanSource(value.src || value.image || value.imageUrl || value.imagePath);
}

function addEvidenceImage(images, seen, descriptor) {
  const src = getMediaSource(descriptor);
  if (!src || seen.has(src)) return;
  seen.add(src);
  images.push({
    src,
    role: cleanText(descriptor.role) || "evidence",
    label: cleanText(descriptor.label),
    alt: cleanText(descriptor.alt)
  });
}

export function getAssessmentMainImageLabel(question = {}) {
  return cleanText(
    question.targetWord ||
    question.representedWord ||
    question.anchorWord ||
    question.audioText ||
    question.spokenWord ||
    question.word ||
    question.imageLabel ||
    question.imageAlt ||
    question.alt ||
    question.correctAnswer ||
    question.answer
  );
}

export function getAssessmentEvidenceAccessibleName({
  alt = "",
  label = "",
  role = "evidence"
} = {}) {
  const suppliedAlt = cleanText(alt);
  if (suppliedAlt && !GENERIC_IMAGE_NAMES.has(suppliedAlt.toLowerCase())) {
    return suppliedAlt;
  }

  const suppliedLabel = cleanText(label);
  if (suppliedLabel) return `Picture of ${suppliedLabel}`;

  throw new Error(`Assessment ${cleanText(role) || "evidence"} image is missing a meaningful accessible name.`);
}

export function getAssessmentDecorativeMediaProps() {
  return {
    "aria-hidden": "true",
    "data-assessment-media-kind": "decorative"
  };
}

export function collectAssessmentEvidenceImages(question = {}) {
  const images = [];
  const seen = new Set();
  const mainLabel = getAssessmentMainImageLabel(question);

  for (const src of [
    question.image,
    question.imageUrl,
    question.imagePath,
    question.targetImage,
    question.targetImageUrl,
    question.targetImagePath
  ]) {
    addEvidenceImage(images, seen, {
      src,
      role: "stimulus",
      label: mainLabel,
      alt: question.imageAlt || question.alt
    });
  }

  for (const card of question.promptImageCards || []) {
    addEvidenceImage(images, seen, {
      ...card,
      role: "prompt",
      label: card.label || card.word || card.value
    });
  }

  for (const card of question.imageCards || []) {
    addEvidenceImage(images, seen, {
      ...card,
      role: "choice",
      label: card.label || card.word || card.value
    });
  }

  for (const option of question.answerOptions || []) {
    if (!option || typeof option !== "object") continue;
    addEvidenceImage(images, seen, {
      ...option,
      role: "choice",
      label: option.label || option.word || option.value
    });
  }

  for (const [label, media] of Object.entries(question.choiceImages || {})) {
    addEvidenceImage(images, seen, {
      ...(typeof media === "object" ? media : { image: media }),
      role: "choice",
      label
    });
  }

  return images;
}

export function questionUsesFailedAssessmentMedia(
  question = {},
  {
    failedQuestionIds = [],
    failedSources = []
  } = {}
) {
  const failedIds = failedQuestionIds instanceof Set
    ? failedQuestionIds
    : new Set(failedQuestionIds);
  const failedMedia = failedSources instanceof Set
    ? failedSources
    : new Set(failedSources);
  const questionId = getQuestionId(question);

  return Boolean(
    (questionId && failedIds.has(questionId)) ||
    collectAssessmentEvidenceImages(question).some(image => failedMedia.has(image.src))
  );
}

export function excludeFailedAssessmentMediaQuestions(questions = [], failureState = {}) {
  return questions.filter(question => !questionUsesFailedAssessmentMedia(question, failureState));
}

export function refillAssessmentRoundAfterMediaFailure({
  round = [],
  failedQuestionId = "",
  failedSource = "",
  candidates = [],
  targetLength = round.length
} = {}) {
  const failedQuestionIds = new Set([cleanText(failedQuestionId)].filter(Boolean));
  const failedSources = new Set([cleanSource(failedSource)].filter(Boolean));
  const retained = excludeFailedAssessmentMediaQuestions(round, {
    failedQuestionIds,
    failedSources
  });
  const selectedIds = new Set(retained.map(getQuestionId).filter(Boolean));
  const replacements = excludeFailedAssessmentMediaQuestions(candidates, {
    failedQuestionIds,
    failedSources
  });

  for (const candidate of replacements) {
    if (retained.length >= targetLength) break;
    const candidateId = getQuestionId(candidate);
    if (candidateId && selectedIds.has(candidateId)) continue;
    retained.push(candidate);
    if (candidateId) selectedIds.add(candidateId);
  }

  return retained;
}
