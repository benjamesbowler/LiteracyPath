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

function seedNumber(seed) {
  if (Number.isFinite(Number(seed))) return Math.abs(Math.floor(Number(seed)));
  let value = 0;
  for (const char of String(seed ?? "")) value = ((value * 31) + char.charCodeAt(0)) >>> 0;
  return value;
}

function seededOrder(ids, seed) {
  return [...ids].sort((left, right) => {
    const leftHash = seedNumber(`${seed}:${left}`);
    const rightHash = seedNumber(`${seed}:${right}`);
    return leftHash - rightHash || left.localeCompare(right);
  });
}

function taughtSet(context) {
  return new Set(normalizedIds(context?.taught || context?.teachHistory));
}

function confusionCount(context, targetId, candidateId) {
  const confusions = context?.confusions && typeof context.confusions === "object" ? context.confusions : {};
  return Math.max(0, Number(confusions[`${targetId}:${candidateId}`] ?? confusions[candidateId]) || 0);
}

function evidenceFor(context, targetId) {
  return (Array.isArray(context?.evidence) ? context.evidence : [])
    .filter(event => event?.target === targetId || event?.targetId === targetId);
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
  if (Number.isFinite(supplied)) return supplied;
  return (Array.isArray(context?.evidence) ? context.evidence : []).reduce(
    (latest, event) => Math.max(latest, Number(event?.journeyStep) || 0),
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

  const recentWindow = Math.max(1, Number(context?.recentWindow) || 24);
  const now = currentJourneyStep(context);
  const recent = evidence.filter(event => now - (Number(event?.journeyStep) || now) <= recentWindow);
  const scored = recent.length ? recent : evidence;
  const correct = scored.filter(event => event?.correct === true).length;
  const accuracy = correct / scored.length;
  const lastSeen = lastSeenFor(context, targetId, evidence);
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
export function selectNextChallenge(context = {}) {
  const taught = taughtSet(context);
  const requestedTargetId = stringId(context.targetId);
  const candidates = requestedTargetId ? [requestedTargetId] : challengeCandidates(context);
  const eligible = candidates.filter(id => taught.has(id));
  if (!eligible.length) return null;

  const ranked = eligible.map(targetId => ({ targetId, ...priorityFor(context, targetId) }));
  ranked.sort((left, right) => left.rank - right.rank
    || seededOrder([left.targetId, right.targetId], context.seed)[0].localeCompare(left.targetId));
  const chosen = ranked[0];
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

// Returns reducer-owned option metadata. Renderers receive only the selected
// challenge view, never this answer-bearing audit record.
export function buildAuditedDistractors(context = {}) {
  const targetId = stringId(context.targetId);
  const taught = taughtSet(context);
  const targetFamily = targetId ? comparisonFamilyFor(context, targetId) : null;
  if (!targetId || !taught.has(targetId) || !targetFamily
    || !isAuditedPronunciation(recordFor(context.pronunciations || context.targets, targetId))) return null;

  const requestedCount = Math.floor(Number(context.optionCount) || 3);
  const optionCount = Math.max(2, requestedCount);
  const candidateIds = normalizedIds(context.candidates || context.taught || context.teachHistory)
    .filter(id => id !== targetId && taught.has(id))
    .filter(id => comparisonFamilyFor(context, id) === targetFamily)
    .filter(id => isAuditedPronunciation(recordFor(context.pronunciations || context.targets, id)));
  const distractorIds = seededOrder(candidateIds, context.seed).slice(0, optionCount - 1);
  if (distractorIds.length !== optionCount - 1) return null;

  const correctIndex = seedNumber(context.seed) % optionCount;
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
import { dueAtJourneyStep } from "./journeyClock.js";
