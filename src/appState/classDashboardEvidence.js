import {
  LEARNING_EVIDENCE_POLICY,
  isLearningEvidenceRecent
} from "../policy/learningPolicy.js";

function normalizedKey(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * Learning conclusions describe current evidence only. Keep the lifetime rows
 * for activity/history displays, but never let an answer outside the canonical
 * conclusion window affect a current status or next-step suggestion.
 */
export function currentAnswerEvidence(
  rows = [],
  { now = new Date() } = {}
) {
  const currentRows = rows.filter(row =>
    isLearningEvidenceRecent(row?.answered_at, {
      now,
      maximumAgeDays: LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays
    })
  );
  const correct = currentRows.filter(row => row?.is_correct).length;
  const evidenceSkills = [...new Set(
    currentRows.map(row => String(row?.skill || "").trim()).filter(Boolean)
  )];
  const lastActive = currentRows
    .map(row => row?.answered_at)
    .filter(value => timestampOf(value) !== null)
    .sort((left, right) => timestampOf(left) - timestampOf(right))
    .at(-1) || null;

  return {
    rows: currentRows,
    answered: currentRows.length,
    correct,
    accuracy: currentRows.length > 0
      ? Math.round((correct / currentRows.length) * 100)
      : null,
    evidenceSkills,
    lastActive
  };
}

function timestampOf(value) {
  if (value === null || value === undefined || value === "") return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

/**
 * A dashboard figure is usable only when every source behind it was read in
 * full. An error and a paging ceiling are equally incomplete: neither may be
 * converted into zero results.
 */
export function incompleteClassDashboardSources(sources = {}) {
  return Object.entries(sources)
    .filter(([, result]) => Boolean(result?.error || result?.truncated))
    .map(([source]) => source);
}

/**
 * Keep the last complete figures visible while making their status explicit.
 * A newly discovered student receives identity only; missing evidence is never
 * invented as zero or "not started".
 */
export function buildIncompleteClassDashboardRows(
  students = [],
  previousRows = [],
  missingSources = []
) {
  const previousById = new Map(
    previousRows.map(row => [row?.id, row]).filter(([id]) => Boolean(id))
  );

  return students.map(student => {
    const previous = previousById.get(student.id) || {};
    const classId = student.class_id || previous.classId || "";
    return {
      ...previous,
      id: student.id,
      name: student.name,
      ...(classId ? { classId } : {}),
      evidenceReadStatus: "incomplete",
      evidenceMissingSources: [...missingSources]
    };
  });
}

/**
 * The first mastered=true record is the secure transition. Later successful
 * rounds for the same skill are useful practice evidence, but are not another
 * newly secured skill.
 */
export function firstSecureTransitionsBySkill(rows = []) {
  const transitions = new Map();

  rows.forEach(row => {
    if (!row?.mastered || !row?.skill_id) return;
    const timestamp = timestampOf(row.updated_at);
    if (timestamp === null) return;
    const existing = transitions.get(row.skill_id);
    if (existing === undefined || timestamp < existing) {
      transitions.set(row.skill_id, timestamp);
    }
  });

  return transitions;
}

export function countFirstSecureTransitions(rows = [], start, end) {
  const windowStart = Number(start);
  const windowEnd = Number(end);
  if (!Number.isFinite(windowStart) || !Number.isFinite(windowEnd)) return 0;

  return [...firstSecureTransitionsBySkill(rows).values()]
    .filter(timestamp => timestamp >= windowStart && timestamp < windowEnd)
    .length;
}

/**
 * A legacy `mastery=true` row is a projection, not proof of separate
 * assessment sittings. Only immutable, completed attempt rows can establish
 * the session diversity behind a class/roster Secure count.
 */
export function verifiedSecureSkillIds(
  masteryRows = [],
  assessmentAttempts = [],
  studentId = "",
  { now = new Date() } = {}
) {
  const secureCandidates = new Set(
    masteryRows
      .filter(row => row?.mastered && row?.skill_id)
      .map(row => String(row.skill_id))
  );
  if (!secureCandidates.size) return new Set();

  const bySkill = new Map();
  assessmentAttempts.forEach(row => {
    if (
      String(row?.student_id || "") !== String(studentId || "")
      || !row?.attempt_id
      || !row?.skill_id
      || !secureCandidates.has(String(row.skill_id))
      || !["completed", "partial"].includes(String(row.administration_status || "completed"))
      || !isLearningEvidenceRecent(row.completed_at, {
        now,
        maximumAgeDays: LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays,
        allowUndated: false
      })
    ) return;
    const skillId = String(row.skill_id);
    const attempts = bySkill.get(skillId) || new Map();
    attempts.set(String(row.attempt_id), row);
    bySkill.set(skillId, attempts);
  });

  return new Set([...bySkill.entries()].flatMap(([skillId, attempts]) => {
    const rows = [...attempts.values()];
    const independentSittings = rows.length;
    const total = rows.reduce(
      (sum, row) => sum + Math.max(0, Number(row.total_questions) || 0),
      0
    );
    const correct = rows.reduce(
      (sum, row) => sum + Math.max(0, Number(row.correct_count) || 0),
      0
    );
    const accuracy = total > 0 ? (correct / total) * 100 : null;
    const ready = independentSittings
        >= LEARNING_EVIDENCE_POLICY.minimumEvidence.exactItemIndependentAttempts
      && total >= LEARNING_EVIDENCE_POLICY.minimumEvidence.learnerScoredResponses
      && accuracy !== null
      && accuracy >= LEARNING_EVIDENCE_POLICY.accuracyPercent.secureMinimum;
    return ready ? [skillId] : [];
  }));
}

/**
 * Dashboard answers store the authored skill label, while mastery stores the
 * curriculum id. Match either representation so the Today page never labels
 * mixed all-time accuracy as evidence for the current skill.
 */
export function buildCurrentSkillEvidence(
  studentAnswers = [],
  stage = null,
  { now = new Date() } = {}
) {
  if (!stage) return null;

  const stageKeys = new Set(
    [stage.id, stage.label].map(normalizedKey).filter(Boolean)
  );
  const matching = currentAnswerEvidence(studentAnswers, { now }).rows.filter(row =>
    stageKeys.has(normalizedKey(row?.skill))
  );
  const correct = matching.filter(row => row?.is_correct).length;
  const lastActive = matching
    .map(row => row?.answered_at)
    .filter(value => timestampOf(value) !== null)
    .sort((left, right) => timestampOf(left) - timestampOf(right))
    .at(-1) || null;

  return {
    skill: stage.label || stage.id || "",
    answered: matching.length,
    correct,
    accuracy: matching.length > 0
      ? Math.round((correct / matching.length) * 100)
      : null,
    lastActive
  };
}
