export const EVIDENCE_DOMAINS = Object.freeze({
  PHONEME_TO_GRAPHEME: "phoneme_to_grapheme",
  GRAPHEME_TO_PHONEME: "grapheme_to_phoneme",
  WORD_DECODING: "word_decoding",
  WORD_SEGMENTATION_ENCODING: "word_segmentation_encoding",
  CONNECTED_TEXT_TRANSFER: "connected_text_transfer",
  HEART_WORD_MAPPING: "heart_word_mapping",
  NOVEL_DECODING: "novel_decoding"
});

export const EVIDENCE_DOMAIN_VALUES = Object.freeze(Object.values(EVIDENCE_DOMAINS));

export const EVIDENCE_TARGET_KINDS = Object.freeze({
  GPC: "gpc",
  WORD_POSITION: "word_position",
  HEART_WORD: "heart_word",
  CONNECTED_TEXT: "connected_text",
  BOSS_NOVEL: "boss_novel"
});

export const HEART_WORD_ACTIVITY_TYPES = Object.freeze([
  "recognition",
  "heart_part_mapping",
  "encoding",
  "sentence_use"
]);

const DOMAIN_SET = new Set(EVIDENCE_DOMAIN_VALUES);
const HEART_ACTIVITY_SET = new Set(HEART_WORD_ACTIVITY_TYPES);
const GPC_POSITIONS = new Set(["initial", "middle", "final"]);

const evidencePath = (domain, activityType = null) => Object.freeze({ domain, activityType });

export const EVIDENCE_PATH_CATALOG = Object.freeze({
  [EVIDENCE_TARGET_KINDS.GPC]: Object.freeze([
    evidencePath(EVIDENCE_DOMAINS.PHONEME_TO_GRAPHEME),
    evidencePath(EVIDENCE_DOMAINS.GRAPHEME_TO_PHONEME)
  ]),
  [EVIDENCE_TARGET_KINDS.WORD_POSITION]: Object.freeze([
    evidencePath(EVIDENCE_DOMAINS.WORD_SEGMENTATION_ENCODING),
    evidencePath(EVIDENCE_DOMAINS.WORD_DECODING)
  ]),
  [EVIDENCE_TARGET_KINDS.HEART_WORD]: Object.freeze(HEART_WORD_ACTIVITY_TYPES.map(activityType =>
    evidencePath(EVIDENCE_DOMAINS.HEART_WORD_MAPPING, activityType))),
  [EVIDENCE_TARGET_KINDS.CONNECTED_TEXT]: Object.freeze([
    evidencePath(EVIDENCE_DOMAINS.CONNECTED_TEXT_TRANSFER)
  ]),
  [EVIDENCE_TARGET_KINDS.BOSS_NOVEL]: Object.freeze([
    evidencePath(EVIDENCE_DOMAINS.NOVEL_DECODING)
  ])
});

function stringId(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizedWord(value) {
  return stringId(value)?.toLocaleLowerCase() || null;
}

function normalizedPosition(value) {
  if (value === null || value === undefined) return null;
  if (Number.isInteger(value) && value >= 0) return value;
  return stringId(value);
}

function targetParts(input) {
  const targetId = stringId(input?.targetId ?? input?.target);
  return {
    targetId,
    wordId: normalizedWord(input?.wordId ?? input?.word),
    position: normalizedPosition(input?.position),
    activityType: stringId(input?.activityType),
    connectedTextId: stringId(input?.connectedTextId),
    bossTransferId: stringId(input?.bossTransferId)
  };
}

function prefixedValue(targetId, prefix) {
  return targetId?.startsWith(prefix) ? targetId.slice(prefix.length).trim().toLocaleLowerCase() : null;
}

function validGpcPosition(position) {
  return position === null || (Number.isInteger(position) && position >= 0) || GPC_POSITIONS.has(position);
}

function validWordPosition(position) {
  return (Number.isInteger(position) && position >= 0) || position === "whole";
}

function classified(kind, parts, errors = []) {
  return Object.freeze({
    kind,
    ...parts,
    valid: errors.length === 0,
    errors: Object.freeze(errors)
  });
}

export function isEvidenceDomain(value) {
  return DOMAIN_SET.has(value);
}

export function classifyEvidenceTarget(input = {}) {
  const parts = targetParts(input);
  const { targetId, wordId, position, activityType, connectedTextId, bossTransferId } = parts;
  if (!targetId) return classified(null, parts, ["targetId is required"]);

  if (targetId.startsWith("hw:")) {
    const targetWord = prefixedValue(targetId, "hw:");
    const errors = [];
    if (!targetWord || !wordId || targetWord !== wordId) errors.push("heart-word target and wordId must match");
    if (!HEART_ACTIVITY_SET.has(activityType)) errors.push("heart-word activityType is invalid");
    if (connectedTextId || bossTransferId) errors.push("heart-word target has incompatible transfer identity");
    if (position !== null && !validWordPosition(position)) errors.push("heart-word position is invalid");
    return classified(EVIDENCE_TARGET_KINDS.HEART_WORD, parts, errors);
  }

  if (targetId.startsWith("word:")) {
    const targetWord = prefixedValue(targetId, "word:");
    const errors = [];
    if (!targetWord || !wordId || targetWord !== wordId) errors.push("word target and wordId must match");
    if (!validWordPosition(position)) errors.push("word target needs an exact position");
    if (activityType || connectedTextId || bossTransferId) errors.push("word target has incompatible subtype or transfer identity");
    return classified(EVIDENCE_TARGET_KINDS.WORD_POSITION, parts, errors);
  }

  if (targetId.startsWith("text:")) {
    const targetText = prefixedValue(targetId, "text:");
    const errors = [];
    if (!targetText || !connectedTextId || targetText !== connectedTextId.toLocaleLowerCase()) {
      errors.push("connected-text target and connectedTextId must match");
    }
    if (wordId || position !== null || activityType || bossTransferId) errors.push("connected-text target has incompatible construct identity");
    return classified(EVIDENCE_TARGET_KINDS.CONNECTED_TEXT, parts, errors);
  }

  if (targetId.startsWith("novel:")) {
    const targetWord = prefixedValue(targetId, "novel:");
    const errors = [];
    if (!targetWord || !wordId || targetWord !== wordId) errors.push("boss target and wordId must match");
    if (position !== "whole") errors.push("boss decoding needs the whole-word position");
    if (!bossTransferId) errors.push("boss decoding needs an authored bossTransferId");
    if (activityType || connectedTextId) errors.push("boss target has incompatible subtype or text identity");
    return classified(EVIDENCE_TARGET_KINDS.BOSS_NOVEL, parts, errors);
  }

  const errors = [];
  if (targetId.includes(":")) errors.push("target namespace is unknown");
  if (wordId || activityType || connectedTextId || bossTransferId) errors.push("GPC target has incompatible construct identity");
  if (!validGpcPosition(position)) errors.push("GPC position is invalid");
  return classified(EVIDENCE_TARGET_KINDS.GPC, parts, errors);
}

export function eligibleEvidencePaths(input = {}) {
  const target = classifyEvidenceTarget(input);
  return target.valid ? EVIDENCE_PATH_CATALOG[target.kind] : Object.freeze([]);
}

export function validateEvidencePath(input = {}) {
  const target = classifyEvidenceTarget(input);
  const errors = [...target.errors];
  const domain = input?.domain ?? input?.recordsDomain;
  const activityType = stringId(input?.activityType);
  if (!isEvidenceDomain(domain)) errors.push("evidence domain is not allowed");
  if (target.valid) {
    const eligible = EVIDENCE_PATH_CATALOG[target.kind].some(path =>
      path.domain === domain && path.activityType === (activityType || null));
    if (!eligible) errors.push("target is not eligible for this evidence path");
  }
  return Object.freeze({
    valid: errors.length === 0,
    kind: target.kind,
    errors: Object.freeze(errors)
  });
}

export function nextEligibleEvidencePath(input = {}, currentPath = {}) {
  if (!validateEvidencePath({ ...input, ...currentPath }).valid) return null;
  const paths = eligibleEvidencePaths(input);
  if (paths.length < 2) return null;
  const currentActivityType = stringId(currentPath?.activityType);
  const currentIndex = paths.findIndex(path =>
    path.domain === currentPath?.domain && path.activityType === (currentActivityType || null));
  if (currentIndex < 0) return null;
  const next = paths[(currentIndex + 1) % paths.length];
  return Object.freeze({ ...next });
}
