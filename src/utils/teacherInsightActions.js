import { packStopIndex } from "./worksheets/practicePack.js";

const BUCKET_PRIORITY = Object.freeze({
  reteach: 0,
  almost: 1,
  "got-it": 2,
  unseen: 3
});

function uniqueLearners(learners = []) {
  const byId = new Map();
  for (const learner of learners) {
    const id = String(learner?.id || "").trim();
    if (!id || byId.has(id)) continue;
    byId.set(id, {
      id,
      name: String(learner?.name || "Student").trim() || "Student"
    });
  }
  return [...byId.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function optionalSnapshotObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  try {
    const serialized = JSON.stringify(value);
    if (!serialized || serialized.length > 4_000) return null;
    return JSON.parse(serialized);
  } catch {
    return null;
  }
}

export function normalizeTeacherInsight(insight) {
  const key = String(insight?.key || "").trim();
  const kind = String(insight?.kind || "").trim();
  const label = String(insight?.label || "").trim();
  const focus = String(insight?.focus || "").trim();
  const learners = uniqueLearners(insight?.learners);
  if (!key || !kind || !label || !focus || !learners.length) return null;
  const normalized = {
    schemaVersion: 1,
    key,
    kind,
    label,
    focus,
    learners
  };
  const reason = String(insight?.reason || "").trim();
  const criterion = optionalSnapshotObject(insight?.criterion);
  const evidence = optionalSnapshotObject(insight?.evidence);
  if (reason && reason.length <= 500) normalized.reason = reason;
  if (criterion) normalized.criterion = criterion;
  if (evidence) normalized.evidence = evidence;
  return normalized;
}

export function buildInsightPracticeTargets(insight, rows = []) {
  const normalized = normalizeTeacherInsight(insight);
  if (!normalized) return [];
  const memberIds = new Set(normalized.learners.map(learner => learner.id));
  const targetRows = new Map();

  for (const row of rows) {
    if (!memberIds.has(String(row?.id || ""))) continue;
    for (const item of row?.itemEvidence || []) {
      const id = String(item?.id || "").trim();
      if (!id) continue;
      const current = targetRows.get(id) || {
        id,
        label: String(item?.label || id),
        stopName: String(item?.stopName || "Curriculum sequence"),
        bucket: String(item?.bucket || "almost"),
        memberCount: 0,
        attempts: 0
      };
      current.memberCount += 1;
      current.attempts += Number(item?.independentSeen) || 0;
      if (
        (BUCKET_PRIORITY[item?.bucket] ?? 9)
        < (BUCKET_PRIORITY[current.bucket] ?? 9)
      ) {
        current.bucket = String(item.bucket);
      }
      targetRows.set(id, current);
    }
  }

  const exactTarget = normalized.key.startsWith("sound:")
    ? normalized.key.slice("sound:".length)
    : "";
  return [...targetRows.values()]
    .sort((left, right) => (
      Number(right.id === exactTarget) - Number(left.id === exactTarget)
      || (BUCKET_PRIORITY[left.bucket] ?? 9) - (BUCKET_PRIORITY[right.bucket] ?? 9)
      || right.memberCount - left.memberCount
      || left.label.localeCompare(right.label)
    ))
    .slice(0, 12);
}

export function defaultInsightPracticeTargetIds(insight, rows = []) {
  const targets = buildInsightPracticeTargets(insight, rows);
  const currentNeeds = targets
    .filter(target => target.bucket !== "got-it" && target.bucket !== "unseen")
    .slice(0, 6);
  return (currentNeeds.length
    ? currentNeeds
    : targets.filter(target => target.bucket !== "unseen").slice(0, 6))
    .map(target => target.id);
}

export function insightPracticeStopIndex(insight, rows = []) {
  const normalized = normalizeTeacherInsight(insight);
  if (!normalized) return null;
  const memberIds = new Set(normalized.learners.map(learner => learner.id));
  const stops = rows
    .filter(row => memberIds.has(String(row?.id || "")))
    .map(row => packStopIndex(row?.soundSeekers))
    .filter(value => Number.isFinite(Number(value)) && Number(value) > 0)
    .map(Number);
  return stops.length ? Math.min(...stops) : null;
}

export function insightResourceName(insight) {
  const normalized = normalizeTeacherInsight(insight);
  if (!normalized) return "";
  if (normalized.learners.length === 1) return normalized.learners[0].name;
  return `${normalized.label} group`;
}

export function buildInsightActionSnapshot(insight) {
  const normalized = normalizeTeacherInsight(insight);
  if (!normalized) return null;
  const snapshot = {
    schemaVersion: 1,
    key: normalized.key,
    kind: normalized.kind,
    label: normalized.label,
    focus: normalized.focus
  };
  if (normalized.reason) snapshot.reason = normalized.reason;
  if (normalized.criterion) snapshot.criterion = normalized.criterion;
  if (normalized.evidence) snapshot.evidence = normalized.evidence;
  return snapshot;
}
