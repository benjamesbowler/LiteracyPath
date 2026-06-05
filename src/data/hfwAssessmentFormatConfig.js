function numberedFormats(prefix, count = 24) {
  return Array.from({ length: count }, (_, index) => `${prefix}_${String(index + 1).padStart(2, "0")}`);
}

export const HFW_SENTENCE_CLOZE_L1P1_FORMATS = numberedFormats("HFW_SENTENCE_CLOZE_L1P1");

export const HFW_SENTENCE_CLOZE_L1P2_FORMATS = numberedFormats("HFW_SENTENCE_CLOZE_L1P2");

export const HFW_SENTENCE_SPELL_L2P1_FORMATS = numberedFormats("HFW_SENTENCE_SPELL_L2P1");

export const HFW_SENTENCE_SPELL_L2P2_FORMATS = numberedFormats("HFW_SENTENCE_SPELL_L2P2");

export const HFW_FORMATS_BY_PHASE = {
  L1P1: HFW_SENTENCE_CLOZE_L1P1_FORMATS,
  L1P2: HFW_SENTENCE_CLOZE_L1P2_FORMATS,
  L2P1: HFW_SENTENCE_SPELL_L2P1_FORMATS,
  L2P2: HFW_SENTENCE_SPELL_L2P2_FORMATS
};

export const HFW_DIRECT_RECOGNITION_FORMATS = [];

export const HFW_CLOZE_FORMATS = [
  ...HFW_SENTENCE_CLOZE_L1P1_FORMATS,
  ...HFW_SENTENCE_CLOZE_L1P2_FORMATS
];

export const HFW_SENTENCE_SPELL_FORMATS = [
  ...HFW_SENTENCE_SPELL_L2P1_FORMATS,
  ...HFW_SENTENCE_SPELL_L2P2_FORMATS
];

export const HFW_ALLOWED_FORMATS = [
  ...HFW_CLOZE_FORMATS,
  ...HFW_SENTENCE_SPELL_FORMATS
];

const DIRECT_HFW_PROMPT_PATTERNS = [
  /\b(find|tap|spot|point to)\s+(?:the\s+)?(?:printed\s+)?word\b/i,
  /\b(?:choose|select|pick)\s+(?:the\s+)?(?:printed\s+)?word\s*["“”'][a-z]+["“”']/i,
  /\bwhich\s+(?:word|print)\s+(?:says|shows|is)\s*["“”']?[a-z]+/i,
  /\bmatch\s+the\s+printed\s+word\b/i,
  /\b(?:recognize|read)\s+(?:and\s+choose\s+)?["“”'][a-z]+["“”']/i,
  /\bword\s+hunt\s+for\s*["“”']?[a-z]+/i,
  /\btarget\s+word\b/i
];

function normalizeToken(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function visiblePromptText(question = {}) {
  return [
    question.prompt,
    question.question,
    question.visiblePrompt,
    question.visibleSentenceWithBlank,
    question.sentence
  ].filter(Boolean).join(" ");
}

function targetWord(question = {}) {
  return normalizeToken(question.targetWord || question.answer || question.correctAnswer || question.itemKey || "");
}

export function hfwPhaseKey(level, phase) {
  return `L${Number(level) >= 2 ? 2 : 1}P${Number(phase) === 2 ? 2 : 1}`;
}

export function getHfwAllowedFormatsForPhase(level, phase) {
  return HFW_FORMATS_BY_PHASE[hfwPhaseKey(level, phase)] || [];
}

export function isHfwDirectRecognitionFormat(format = "") {
  return HFW_DIRECT_RECOGNITION_FORMATS.includes(String(format || "").toUpperCase());
}

export function isHfwClozeFormat(format = "") {
  return HFW_CLOZE_FORMATS.includes(String(format || "").toUpperCase());
}

export function isHfwSentenceSpellFormat(format = "") {
  return HFW_SENTENCE_SPELL_FORMATS.includes(String(format || "").toUpperCase());
}

export function getHfwDirectAnswerLeakageIssues(question = {}) {
  const target = targetWord(question);
  const text = visiblePromptText(question);
  const normalizedText = normalizeToken(text);
  const issues = [];

  if (DIRECT_HFW_PROMPT_PATTERNS.some(pattern => pattern.test(text))) {
    issues.push("direct HFW recognition prompt");
  }
  if (target && new RegExp(`["“”']${escapeRegex(target)}["“”']`, "i").test(text)) {
    issues.push("target word appears in quoted visible prompt");
  }
  if (target && normalizedText === target) {
    issues.push("visible prompt is only the answer");
  }

  return [...new Set(issues)];
}
