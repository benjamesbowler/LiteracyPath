import { evidenceIsIndependent } from "./evidence.js";
import { validateEvidencePath } from "./evidenceEligibility.js";
import { dueAtJourneyStep } from "./journeyClock.js";

function stringId(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizedIds(values) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map(value => typeof value === "string" ? value : value?.id || value?.targetId)
    .map(stringId)
    .filter(Boolean))];
}

function recordFor(records, id) {
  if (Array.isArray(records)) return records.find(record => record?.id === id || record?.targetId === id) || null;
  return records && typeof records === "object" ? records[id] || null : null;
}

function comparisonFamilyFor(context, id) {
  const family = context?.comparisonFamilies?.[id];
  if (typeof family === "string" && family) return family;
  if (family && typeof family === "object") return stringId(family.id || family.family || family.comparisonFamily);
  const record = recordFor(context?.pronunciations || context?.targets, id);
  return stringId(record?.comparisonFamily || record?.comparisonFamilyId || record?.family);
}

function seedToken(seed) {
  if (Number.isFinite(Number(seed))) return String(Math.abs(Math.floor(Number(seed))));
  return String(seed ?? "");
}

function hashSeed(value) {
  let hash = 1779033703 ^ value.length;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
  hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
  return (hash ^ (hash >>> 16)) >>> 0;
}

function seededRandom(key) {
  let state = hashSeed(key);
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function seedKey(context, stream, targetId = "") {
  return [stream, seedToken(context?.seed), currentJourneyStep(context), targetId].join("\u0000");
}

function seededOrder(ids, context, stream, targetId = "") {
  const ordered = [...ids].sort((left, right) => left.localeCompare(right));
  const random = seededRandom(seedKey(context, stream, targetId));
  for (let index = ordered.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [ordered[index], ordered[swapIndex]] = [ordered[swapIndex], ordered[index]];
  }
  return ordered;
}

function seededIndex(length, context, stream, targetId = "") {
  if (!Number.isInteger(length) || length <= 0) return 0;
  return Math.floor(seededRandom(seedKey(context, stream, targetId))() * length);
}

function taughtSet(context) {
  return new Set(normalizedIds(context?.taught || context?.teachHistory));
}

function validJourneyStep(value) {
  return Number.isInteger(value) && value >= 0;
}

function isV2PracticeEvent(event) {
  return Boolean(
    event
    && event.evidenceKind === "practice"
    && validateEvidencePath({
      targetId: event.target,
      domain: event.domain,
      wordId: event.word,
      position: event.position,
      activityType: event.activityType,
      connectedTextId: event.connectedTextId,
      bossTransferId: event.bossTransferId
    }).valid
    && typeof event.id === "string" && event.id
    && typeof event.target === "string" && event.target
    && typeof event.correct === "boolean"
    && validJourneyStep(event.journeyStep)
  );
}

function confusionWindow(context) {
  const requested = Number(context?.confusionWindow ?? context?.recentWindow);
  return Number.isInteger(requested) && requested > 0 ? requested : 24;
}

function confusionCount(context, targetId, candidateId) {
  const now = currentJourneyStep(context);
  const window = confusionWindow(context);
  return evidenceFor(context, targetId)
    .filter(event => event.correct === false && String(event.confusion) === candidateId)
    .filter(event => now - event.journeyStep >= 0 && now - event.journeyStep <= window)
    .length;
}

function evidenceFor(context, targetId) {
  return (Array.isArray(context?.evidence) ? context.evidence : [])
    .filter(isV2PracticeEvent)
    .filter(event => event.target === targetId);
}

function lastSeenFor(context, targetId, evidence) {
  const stored = recordFor(context?.lastSeenByTarget || context?.reviewHistory, targetId);
  if (stored && Number.isFinite(Number(stored.journeyStep))) return stored;
  const journeyStep = Math.max(...evidence.map(event => Number(event?.journeyStep) || -1), -1);
  return journeyStep >= 0 ? { journeyStep } : null;
}

function isMarkedDecayed(context, targetId) {
  if (normalizedIds(context?.decayedTargets).includes(targetId)) return true;
  const accuracy = recordFor(context?.accuracyByTarget, targetId);
  return accuracy?.decayed === true;
}

function currentJourneyStep(context) {
  const supplied = Number(context?.journeyStep ?? context?.currentJourneyStep);
  if (Number.isInteger(supplied) && supplied >= 0) return supplied;
  return (Array.isArray(context?.evidence) ? context.evidence : []).reduce(
    (latest, event) => isV2PracticeEvent(event) ? Math.max(latest, event.journeyStep) : latest,
    0
  );
}

function challengeCandidates(context) {
  const taught = taughtSet(context);
  const candidates = normalizedIds(context?.eligibleTargets);
  const source = candidates.length ? candidates : normalizedIds(context?.taught || context?.teachHistory);
  return source.filter(id => taught.has(id));
}

function priorityFor(context, targetId) {
  const evidence = evidenceFor(context, targetId);
  if (!evidence.length) return { rank: 0, reason: "never_served" };

  const independentEvidence = evidence.filter(evidenceIsIndependent);
  if (!independentEvidence.length) return { rank: 1, reason: "support_needed" };

  const recentWindow = Math.max(1, Number(context?.recentWindow) || 24);
  const now = currentJourneyStep(context);
  const recent = independentEvidence.filter(event => now - (Number(event?.journeyStep) || now) <= recentWindow);
  const scored = recent.length ? recent : independentEvidence;
  const correct = scored.filter(event => event?.correct === true).length;
  const accuracy = correct / scored.length;
  const lastSeen = lastSeenFor(context, targetId, independentEvidence);
  const reviewGap = Math.max(1, Number(context?.reviewGap) || 12);
  if (accuracy < 0.75 || isMarkedDecayed(context, targetId)) return { rank: 1, reason: "low_or_decayed_accuracy" };

  const biggestConfusion = normalizedIds(context?.taught || context?.teachHistory)
    .filter(candidateId => candidateId !== targetId)
    .reduce((largest, candidateId) => Math.max(largest, confusionCount(context, targetId, candidateId)), 0);
  if (biggestConfusion > 0) return { rank: 2, reason: "recent_confusion" };
  if (dueAtJourneyStep(targetId, lastSeen, reviewGap, now)) return { rank: 3, reason: "due_review" };
  return { rank: 4, reason: "stable_practice" };
}

function bestConfusionContrast(context, targetId) {
  const taught = taughtSet(context);
  const family = comparisonFamilyFor(context, targetId);
  return normalizedIds(context?.taught || context?.teachHistory)
    .filter(candidateId => candidateId !== targetId && taught.has(candidateId))
    .filter(candidateId => !family || comparisonFamilyFor(context, candidateId) === family)
    .map(candidateId => ({ candidateId, count: confusionCount(context, targetId, candidateId) }))
    .filter(entry => entry.count > 0)
    .sort((left, right) => right.count - left.count || left.candidateId.localeCompare(right.candidateId))[0]?.candidateId || null;
}

// Selection is intentionally a pure function of instructional history. It
// never consumes travel, response-time, collision, or device-performance data.
// `stateV2.confusions` is a numeric lifetime reporting context, not an adaptive
// signal: recent confusions are derived from validated windowed evidence only.
export function selectNextChallenge(context = {}) {
  const taught = taughtSet(context);
  const requestedTargetId = stringId(context.targetId);
  const candidates = requestedTargetId ? [requestedTargetId] : challengeCandidates(context);
  const eligible = candidates.filter(id => taught.has(id));
  if (!eligible.length) return null;

  const ranked = eligible.map(targetId => ({ targetId, ...priorityFor(context, targetId) }));
  const bestRank = Math.min(...ranked.map(entry => entry.rank));
  const chosenTargetId = seededOrder(
    ranked.filter(entry => entry.rank === bestRank).map(entry => entry.targetId),
    context,
    "challenge-target"
  )[0];
  const chosen = ranked.find(entry => entry.targetId === chosenTargetId);
  const contrastTargetId = bestConfusionContrast(context, chosen.targetId);
  const reason = contrastTargetId && (requestedTargetId || chosen.reason === "recent_confusion")
    ? "recent_confusion"
    : chosen.reason;

  return Object.freeze({
    targetId: chosen.targetId,
    contrastTargetId,
    reason,
    supportLevel: Math.max(0, Number(context.supportLevel) || 0),
    journeyStep: currentJourneyStep(context)
  });
}

function isAuditedPronunciation(record) {
  return Boolean(record && typeof record === "object" && String(record.pronunciation || record.soundKey || "").trim()
    && record.ambiguous !== true && record.unambiguous !== false);
}

function authoredSoundValues(record) {
  return new Set([record?.pronunciation, record?.soundKey]
    .filter(value => typeof value === "string" && value.trim())
    .map(value => value.trim().toLocaleLowerCase().replace(/\s+/g, "")));
}

function hasSameAuthoredSound(targetRecord, candidateRecord) {
  const targetValues = authoredSoundValues(targetRecord);
  return [...authoredSoundValues(candidateRecord)].some(value => targetValues.has(value));
}

// Returns reducer-owned option metadata. Renderers receive only the selected
// challenge view, never this answer-bearing audit record.
export function buildAuditedDistractors(context = {}) {
  const targetId = stringId(context.targetId);
  const taught = taughtSet(context);
  const targetFamily = targetId ? comparisonFamilyFor(context, targetId) : null;
  const targetRecord = recordFor(context.pronunciations || context.targets, targetId);
  if (!targetId || !taught.has(targetId) || !targetFamily
    || !isAuditedPronunciation(targetRecord)) return null;

  const requestedCount = Math.floor(Number(context.optionCount) || 3);
  const optionCount = Math.max(2, requestedCount);
  const candidateIds = normalizedIds(context.candidates || context.taught || context.teachHistory)
    .filter(id => id !== targetId && taught.has(id))
    .filter(id => comparisonFamilyFor(context, id) === targetFamily)
    .filter(id => {
      const candidateRecord = recordFor(context.pronunciations || context.targets, id);
      return isAuditedPronunciation(candidateRecord) && !hasSameAuthoredSound(targetRecord, candidateRecord);
    });
  const distractorIds = seededOrder(candidateIds, context, "distractor-subset", targetId).slice(0, optionCount - 1);
  if (distractorIds.length !== optionCount - 1) return null;

  const correctIndex = seededIndex(optionCount, context, "answer-position", targetId);
  const optionTargetIds = [...distractorIds];
  optionTargetIds.splice(correctIndex, 0, targetId);
  const audit = Object.freeze(distractorIds.map(id => Object.freeze({
    targetId: id,
    comparisonFamily: targetFamily,
    rationale: `taught ${targetFamily} contrast with a distinct authored pronunciation`
  })));

  return Object.freeze({
    targetId,
    comparisonFamily: targetFamily,
    distractorIds: Object.freeze(distractorIds),
    optionTargetIds: Object.freeze(optionTargetIds),
    correctIndex,
    audit
  });
}
