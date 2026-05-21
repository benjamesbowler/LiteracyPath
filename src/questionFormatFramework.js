const FORMAT_TYPES = new Set([
  "VPM",
  "PTD",
  "CPS",
  "MPD",
  "DECODING",
  "LISTENING",
  "COMPREHENSION",
  "FIX_SENTENCE",
  "UNKNOWN"
]);

const PHONICS_POSITIONS = new Set([
  "initial",
  "medial",
  "final",
  "mixed",
  "unknown"
]);

function normalizeText(value) {
  return String(value || "").toLowerCase().trim();
}

function normalizePattern(value) {
  return normalizeText(value).replace(/^\//, "").replace(/\/$/, "");
}

function normalizeFormatType(value) {
  const type = String(value || "").trim().toUpperCase();
  return FORMAT_TYPES.has(type) ? type : "UNKNOWN";
}

function getQuestionText(question) {
  return String(question?.question || question?.prompt || "");
}

function getSkillText(question) {
  return normalizeText(question?.skill || question?.masteryStage || "");
}

export function hasPatternTrap(question) {
  if (!question) return false;
  if (question.hadPTD === true || question.formatType === "PTD") return true;
  if (question.targetPattern && Array.isArray(question.choices)) {
    const target = normalizePattern(question.targetPattern);
    const distractorsWithTarget = question.choices.filter(choice =>
      normalizePattern(choice).includes(target)
    );
    return distractorsWithTarget.length > 1;
  }
  return Boolean(question.crossPatternGroup && question.formatType === "PTD");
}

export function isCrossPatternQuestion(question) {
  return Boolean(question?.crossPatternGroup || normalizeFormatType(question?.formatType) === "CPS");
}

export function isVisualRecognitionOnly(question) {
  return normalizeFormatType(question?.formatType) === "VPM";
}

export function requiresAudioSupport(question) {
  if (!question) return false;
  if (question.audioText || question.spokenPrompt) return true;

  const formatType = normalizeFormatType(question.formatType);
  if (["LISTENING", "PTD", "MPD"].includes(formatType)) return true;

  const text = normalizeText(getQuestionText(question));
  return text.includes("listen") || text.includes("sound") || text.includes("starts like") || text.includes("middle sound");
}

export function inferTargetPattern(question) {
  if (!question) return "";
  if (question.targetPattern) return normalizePattern(question.targetPattern);
  if (question.itemType === "phonics_pattern" && question.itemKey) return normalizePattern(question.itemKey);

  const diagnostic = normalizePattern(question.diagnosticTarget || "");
  const diagnosticMatch = diagnostic.match(/\b(ai|ay|ee|ea|oa|ow|igh|ie|oo|ue|ew|oi|oy|ou|aw|ar|er|ir|or|ur|sh|ch|th|wh|ph|bl|cl|fl|gl|pl|sl|br|cr|dr|fr|gr|pr|tr|sc|sk|sm|sn|sp|st|sw)\b/);
  if (diagnosticMatch) return diagnosticMatch[1];

  const text = normalizePattern([
    question.question,
    question.prompt,
    question.spokenPrompt,
    question.audioText,
    question.answer
  ].filter(Boolean).join(" "));
  const textMatch = text.match(/\b(ai|ay|ee|ea|oa|ow|igh|ie|oo|ue|ew|oi|oy|ou|aw|ar|er|ir|or|ur|sh|ch|th|wh|ph|bl|cl|fl|gl|pl|sl|br|cr|dr|fr|gr|pr|tr|sc|sk|sm|sn|sp|st|sw)\b/);
  return textMatch?.[1] || "";
}

export function inferPhonicsPosition(question) {
  const explicit = normalizeText(question?.phonicsPosition || "");
  if (PHONICS_POSITIONS.has(explicit)) return explicit;

  const text = normalizeText([
    question?.question,
    question?.prompt,
    question?.spokenPrompt,
    question?.audioText,
    question?.diagnosticTarget
  ].filter(Boolean).join(" "));

  if (text.includes("ending") || text.includes("final") || text.includes("last sound")) return "final";
  if (text.includes("middle") || text.includes("medial")) return "medial";
  if (text.includes("starts") || text.includes("first sound") || text.includes("initial")) return "initial";
  if (text.includes("mixed") || text.includes("anywhere")) return "mixed";
  return "unknown";
}

export function inferFormatType(question) {
  const explicit = normalizeFormatType(question?.formatType);
  if (explicit !== "UNKNOWN") return explicit;

  if (question?.questionType === "fix_sentence") return "FIX_SENTENCE";
  if (question?.passage) return "COMPREHENSION";
  if (hasPatternTrap(question)) return "PTD";
  if (isCrossPatternQuestion(question)) return "CPS";

  const text = normalizeText(getQuestionText(question));
  const skill = getSkillText(question);

  if (text.includes("listen")) return "LISTENING";
  if (question?.imagePath && (skill.includes("initial") || skill.includes("picture") || skill.includes("vocabulary"))) return "VPM";
  if (skill.includes("blend") || skill.includes("digraph")) return inferPhonicsPosition(question) === "mixed" ? "MPD" : "DECODING";
  if (skill.includes("phonics") || skill.includes("vowel") || skill.includes("cvc")) return "DECODING";

  return "UNKNOWN";
}

export function getQuestionFormatMetadata(question = {}) {
  const formatType = inferFormatType(question);
  const targetPattern = inferTargetPattern(question);

  return {
    formatType,
    masteryStage: question.masteryStage || question.skill || "",
    targetPattern,
    anchorWord: question.anchorWord || "",
    hadPTD: Boolean(question.hadPTD || formatType === "PTD"),
    phonicsPosition: inferPhonicsPosition(question),
    crossPatternGroup: question.crossPatternGroup || ""
  };
}

export function isMasteryEligible(evidence = {}, itemType = "", itemKey = "") {
  const formatTypes = new Set(evidence.formatTypes || []);
  const positions = new Set(evidence.phonicsPositions || []);
  const blockers = [];
  const normalizedItemType = normalizeText(itemType);
  const normalizedItemKey = normalizePattern(itemKey);

  if (formatTypes.size === 0) blockers.push("No question format evidence yet.");
  if (formatTypes.size === 1 && formatTypes.has("VPM")) blockers.push("Visual recognition only cannot establish mastery.");
  if (formatTypes.size < 2) blockers.push("Needs evidence from at least 2 question formats.");

  if (normalizedItemType === "phonics_pattern") {
    if (/[aeiou]_e$/.test(normalizedItemKey) && !formatTypes.has("CPS")) {
      blockers.push("Long vowel patterns need cross-pattern sorting exposure.");
    }

    if (/^(ai|ay|ee|ea|oa|ow|igh|ie|oo|ue|ew|oi|oy|ou|aw)$/.test(normalizedItemKey) && !evidence.hadPTDExposure) {
      blockers.push("Vowel teams need pattern-trap discrimination exposure.");
    }

    if (/^(sh|ch|th|wh|ph)$/.test(normalizedItemKey) && !positions.has("final")) {
      blockers.push("Digraphs need final-position exposure.");
    }

    if (/^(bl|cl|fl|gl|pl|sl|br|cr|dr|fr|gr|pr|tr|sc|sk|sm|sn|sp|st|sw)$/.test(normalizedItemKey) &&
      !formatTypes.has("MPD") && !formatTypes.has("CPS")) {
      blockers.push("Blends need mixed-position decoding or cross-pattern sorting exposure.");
    }
  }

  return {
    eligible: blockers.length === 0,
    blockers
  };
}

export function applyQuestionFormatMetadata(question) {
  const metadata = getQuestionFormatMetadata(question);

  // TODO(question-migration): Replace inferred fields with explicit tags in each runtime bank.
  return {
    ...question,
    formatType: question.formatType || metadata.formatType,
    masteryStage: question.masteryStage || metadata.masteryStage,
    targetPattern: question.targetPattern || metadata.targetPattern,
    anchorWord: question.anchorWord || metadata.anchorWord,
    hadPTD: question.hadPTD ?? metadata.hadPTD,
    phonicsPosition: question.phonicsPosition || metadata.phonicsPosition,
    crossPatternGroup: question.crossPatternGroup || metadata.crossPatternGroup
  };
}

export function getAllowedQuestionFormatValues() {
  return {
    formatTypes: [...FORMAT_TYPES],
    phonicsPositions: [...PHONICS_POSITIONS]
  };
}
