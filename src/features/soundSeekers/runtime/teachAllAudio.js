const TEACH_ITEM_KEYS = Object.freeze([
  "stopId", "targetId", "teachIndex", "scored", "instructionId", "childText",
  "childAudio", "targetAudio", "targetAudioSequence", "targetAudioAlternates",
  "graphemeDisplay", "childLabel", "mouthCue", "morphologyCue", "anchorWord",
  "anchorEvidence", "anchorImage", "workedExample", "alternateExamples"
]);
const BINDING_KEYS = Object.freeze(["scopeKey", "missionId", "phaseId", "attemptId"]);

function exactRecord(value, keys) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    && Object.isFrozen(value)
    && Reflect.ownKeys(value).length === keys.length
    && keys.every(key => Object.hasOwn(value, key));
}

export function canonicalTeachItem(item) {
  if (!exactRecord(item, TEACH_ITEM_KEYS)
    || typeof item.stopId !== "string" || typeof item.targetId !== "string"
    || !Number.isSafeInteger(item.teachIndex) || item.teachIndex < 0
    || item.scored !== false || typeof item.childText !== "string"
    || !item.childText.trim() || !Array.isArray(item.targetAudioSequence)
    || !Array.isArray(item.targetAudioAlternates) || !Array.isArray(item.alternateExamples)) {
    throw new TypeError("Teach-all needs the exact canonical 19-field teaching item");
  }
  return item;
}

export function canonicalTeachAudioBinding(binding) {
  if (!binding || typeof binding !== "object" || Array.isArray(binding)
    || Reflect.ownKeys(binding).length !== BINDING_KEYS.length
    || BINDING_KEYS.some(key => typeof binding[key] !== "string" || !binding[key].trim())) {
    throw new TypeError("Teach-all needs the exact current audio binding");
  }
  return Object.freeze(Object.fromEntries(BINDING_KEYS.map(key => [key, binding[key]])));
}

export function createTeachAudioRequests(rawItem) {
  const item = canonicalTeachItem(rawItem);
  const keys = [...new Set([
    item.childAudio,
    item.targetAudio,
    ...item.targetAudioSequence,
    ...item.targetAudioAlternates.map(alternate => alternate.targetAudio)
  ].filter(Boolean))];
  return Object.freeze(keys.map((audioKey, ordinal) => Object.freeze({
    cueId: `teach:${item.stopId}:${item.teachIndex}:${item.targetId}:${ordinal}`,
    audioKey,
    visibleText: item.childText,
    spokenText: item.childText,
    kind: "teach",
    requiresAudio: true
  })));
}
