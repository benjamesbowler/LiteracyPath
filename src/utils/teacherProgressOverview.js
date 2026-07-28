import {
  LEARNING_CONCLUSION_SCOPES,
  LEARNING_EVIDENCE_POLICY,
  LEARNING_POLICY_VERSION,
  LEARNING_STATUS_IDS,
  evaluateClassComparability,
  evaluateLearningConclusion,
  learningConfidence
} from "../policy/learningPolicy.js";

export const PROGRESS_MIN_RESPONSES =
  LEARNING_EVIDENCE_POLICY.minimumEvidence.learnerScoredResponses;
export const PROGRESS_ITEM_MIN_ATTEMPTS =
  LEARNING_EVIDENCE_POLICY.minimumEvidence.exactItemIndependentAttempts;

const DISTRIBUTION_BANDS = Object.freeze([
  {
    id: "secure",
    label: `${LEARNING_EVIDENCE_POLICY.accuracyPercent.secureMinimum}–100%`,
    description: "Current results are consistently accurate.",
    statusId: LEARNING_STATUS_IDS.SECURE
  },
  {
    id: "developing",
    label: `${LEARNING_EVIDENCE_POLICY.accuracyPercent.developingMinimum}–${LEARNING_EVIDENCE_POLICY.accuracyPercent.secureMinimum - 1}%`,
    description: "Current results are developing.",
    statusId: LEARNING_STATUS_IDS.DEVELOPING
  },
  {
    id: "needs-support",
    label: `Below ${LEARNING_EVIDENCE_POLICY.accuracyPercent.developingMinimum}%`,
    description: "Current results suggest targeted follow-up.",
    statusId: LEARNING_STATUS_IDS.NEEDS_SUPPORT
  }
]);

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
function normalizedHeat(row) {
  return Array.isArray(row?.soundSeekers?.heat)
    ? row.soundSeekers.heat.filter(item => item?.id)
    : [];
}

function evidenceReady(row) {
  return Boolean(row?.conclusion?.ready);
}

function roundedAccuracy(value) {
  return Math.round(value * 10) / 10;
}

export function buildClassAccuracySummary(rows = []) {
  const policyReadyRows = rows
    .filter(evidenceReady)
    .map(row => ({
      ...row,
      answered: Math.max(0, finiteNumber(row.answered)),
      accuracy: finiteNumber(row.accuracy)
    }));
  const responseCount = policyReadyRows.reduce((sum, row) => sum + row.answered, 0);
  const weightedCorrect = policyReadyRows.reduce((sum, row) => {
    const hasExactCorrect = row.correct !== null
      && row.correct !== undefined
      && row.correct !== "";
    const exactCorrect = Number(row.correct);
    if (hasExactCorrect && Number.isFinite(exactCorrect)) {
      return sum + Math.max(0, Math.min(row.answered, exactCorrect));
    }
    return sum + ((row.accuracy / 100) * row.answered);
  }, 0);
  const learnerWeightedAccuracy = policyReadyRows.length
    ? roundedAccuracy(
      policyReadyRows.reduce((sum, row) => sum + row.accuracy, 0)
      / policyReadyRows.length
    )
    : null;
  const responseWeightedAccuracy = responseCount
    ? roundedAccuracy((weightedCorrect / responseCount) * 100)
    : null;
  const comparability = evaluateClassComparability({
    totalLearners: rows.length,
    policyReadyLearners: policyReadyRows.length,
    responseCounts: policyReadyRows.map(row => row.answered)
  });

  return {
    policyVersion: LEARNING_POLICY_VERSION,
    learnerWeightedAccuracy,
    responseWeightedAccuracy,
    headlineAccuracy: comparability.comparable ? learnerWeightedAccuracy : null,
    policyReadyLearnerCount: policyReadyRows.length,
    totalLearnerCount: rows.length,
    responseCount,
    comparability
  };
}

function evidenceSkillsFor(row) {
  return [...new Set(
    (Array.isArray(row?.evidenceSkills) ? row.evidenceSkills : [])
      .map(value => String(value || "").trim())
      .filter(Boolean)
  )];
}

function latestEvidenceTime(values) {
  return values
    .filter(Boolean)
    .map(value => new Date(value))
    .filter(value => Number.isFinite(value.getTime()))
    .sort((left, right) => right.getTime() - left.getTime())[0]
    ?.toISOString() || "";
}

export function formatEvidenceRecency(value) {
  if (!value) return "No saved result time";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "No saved result time";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function supportSummary(itemEvidence) {
  const recorded = itemEvidence.reduce((sum, item) => sum + item.seen, 0);
  const independent = itemEvidence.reduce(
    (sum, item) => sum + Math.min(item.seen, item.independentSeen),
    0
  );
  return {
    recorded,
    independent,
    supported: Math.max(0, recorded - independent)
  };
}

function evidenceBasisFor({
  attempts,
  skills,
  recency,
  itemEvidence,
  minimum = PROGRESS_MIN_RESPONSES,
  minimumSkillDiversity = LEARNING_EVIDENCE_POLICY.minimumEvidence.learnerSkillDiversity,
  confidenceOverride = null
}) {
  const diversity = skills.length;
  const support = supportSummary(itemEvidence);
  const confidence = confidenceOverride || learningConfidence({
    attempts,
    skillDiversity: diversity,
    minimumAttempts: minimum,
    minimumSkillDiversity
  });
  return {
    policyVersion: LEARNING_POLICY_VERSION,
    attempts,
    diversity,
    recency,
    confidence,
    support,
    attemptsLabel: `${attempts} scored response${attempts === 1 ? "" : "s"}`,
    diversityLabel: `${diversity} assessed skill${diversity === 1 ? "" : "s"}`,
    recencyLabel: formatEvidenceRecency(recency),
    confidenceLabel: `${confidence.label} · ${confidence.detail}`,
    supportUseLabel: support.recorded
      ? `${support.supported} supported of ${support.recorded} recorded Sound Seekers encounters`
      : "Not captured in scored assessments",
    ready: attempts >= minimum
  };
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function itemEvidenceFor(row, now) {
  return normalizedHeat(row)
    .filter(item => finiteNumber(item.seen) > 0)
    .map(item => {
      const evidence = {
        id: String(item.id),
        label: String(item.label || item.id),
        stopName: String(item.stopName || "Curriculum sequence"),
        bucket: String(item.bucket || "almost"),
        seen: finiteNumber(item.seen),
        independentSeen: finiteNumber(item.independentSeen),
        accuracy: Number.isFinite(Number(item.accuracy)) ? Number(item.accuracy) : null,
        updatedAt: row?.soundSeekers?.lastActiveAt || row?.soundSeekers?.syncedAt || row?.lastActive || ""
      };
      evidence.evidence = evidenceBasisFor({
        attempts: evidence.independentSeen,
        skills: [evidence.label],
        recency: evidence.updatedAt,
        itemEvidence: [evidence],
        minimum: PROGRESS_ITEM_MIN_ATTEMPTS,
        minimumSkillDiversity: 1
      });
      evidence.conclusion = evaluateLearningConclusion({
        scope: LEARNING_CONCLUSION_SCOPES.ITEM,
        accuracy: evidence.accuracy,
        attempts: evidence.independentSeen,
        skillDiversity: 1,
        observedAt: evidence.updatedAt,
        now,
        minimumAttempts: PROGRESS_ITEM_MIN_ATTEMPTS,
        minimumSkillDiversity: 1
      });
      evidence.evidence.ready = evidence.conclusion.ready;
      evidence.policyReady = evidence.conclusion.ready;
      evidence.policyVersion = LEARNING_POLICY_VERSION;
      return evidence;
    });
}

function buildGroups(rows) {
  const focusGroups = new Map();
  const soundGroups = new Map();

  for (const row of rows) {
    const focus = String(row.currentSkill || "").trim();
    if (focus && focus !== "Not started" && row.evidence.ready) {
      const key = focus.toLowerCase();
      const group = focusGroups.get(key) || {
        id: `focus:${key}`,
        label: focus,
        basis: "Shared current curriculum focus",
        learners: []
      };
      group.learners.push({
        id: row.id,
        name: row.name,
        evidence: row.evidence,
        evidenceSkills: row.evidenceSkills,
        itemEvidence: row.itemEvidence
      });
      focusGroups.set(key, group);
    }

    for (const item of row.itemEvidence) {
      if (
        item.bucket !== "reteach"
        || !item.policyReady
        || item.conclusion.status.id !== LEARNING_STATUS_IDS.NEEDS_SUPPORT
      ) continue;
      const group = soundGroups.get(item.id) || {
        id: `sound:${item.id}`,
        label: `${item.label || item.id} re-teaching`,
        basis: "Shared Sound Seekers re-teaching results",
        learners: []
      };
      group.learners.push({
        id: row.id,
        name: row.name,
        evidence: row.evidence,
        evidenceSkills: row.evidenceSkills,
        itemEvidence: row.itemEvidence
      });
      soundGroups.set(item.id, group);
    }
  }

  return [...soundGroups.values(), ...focusGroups.values()]
    .filter(group => group.learners.length >= 2)
    .map(group => {
      const skills = [...new Set(group.learners.flatMap(learner => learner.evidenceSkills))];
      const itemEvidence = group.learners.flatMap(learner => learner.itemEvidence);
      const attempts = group.learners.reduce((sum, learner) => sum + learner.evidence.attempts, 0);
      const recency = latestEvidenceTime(group.learners.map(learner => learner.evidence.recency));
      return {
        ...group,
        learners: group.learners.map(({ id, name }) => ({ id, name })),
        evidence: evidenceBasisFor({
          attempts,
          skills,
          recency,
          itemEvidence,
          confidenceOverride: {
            id: "policy-ready-group",
            label: "Ready to compare",
            detail: `${group.learners.length} students have enough results`,
            policyVersion: LEARNING_POLICY_VERSION
          }
        })
      };
    })
    .sort((left, right) =>
      right.learners.length - left.learners.length
      || left.label.localeCompare(right.label)
    )
    .slice(0, 6);
}

export function buildTeacherProgressOverview(sourceRows = [], { now = new Date() } = {}) {
  const rows = sourceRows
    .filter(row => row?.id)
    .map(row => {
      const normalized = {
        ...row,
        id: String(row.id),
        name: String(row.name || "Student"),
        answered: Math.max(0, finiteNumber(row.answered)),
        correct: row.correct !== null
          && row.correct !== undefined
          && row.correct !== ""
          && Number.isFinite(Number(row.correct))
          ? Math.max(0, finiteNumber(row.correct))
          : null,
        masteredCount: Math.max(0, finiteNumber(row.masteredCount)),
        accuracy: Number.isFinite(Number(row.accuracy)) ? Number(row.accuracy) : null,
        evidenceSkills: evidenceSkillsFor(row),
        itemEvidence: itemEvidenceFor(row, now)
      };
      normalized.evidence = evidenceBasisFor({
        attempts: normalized.answered,
        skills: normalized.evidenceSkills,
        recency: latestEvidenceTime([
          normalized.lastActive,
          ...normalized.itemEvidence.map(item => item.updatedAt)
        ]),
        itemEvidence: normalized.itemEvidence
      });
      normalized.conclusion = evaluateLearningConclusion({
        accuracy: normalized.accuracy,
        attempts: normalized.answered,
        skillDiversity: normalized.evidenceSkills.length,
        observedAt: normalized.evidence.recency,
        now
      });
      normalized.evidence.ready = normalized.conclusion.ready;
      normalized.evidence.policyVersion = normalized.conclusion.policyVersion;
      return normalized;
    });

  const readyRows = rows.filter(evidenceReady);
  const insufficientRows = rows.filter(row => !evidenceReady(row));
  const classAccuracy = buildClassAccuracySummary(rows);
  const classMedian = median(readyRows.map(row => row.accuracy));
  const distribution = DISTRIBUTION_BANDS.map(band => ({
    id: band.id,
    label: band.label,
    description: band.description,
    policyVersion: LEARNING_POLICY_VERSION,
    count: readyRows.filter(row => row.conclusion.status.id === band.statusId).length,
    learners: readyRows
      .filter(row => row.conclusion.status.id === band.statusId)
      .map(row => ({ id: row.id, name: row.name }))
  }));
  distribution.push({
    id: LEARNING_STATUS_IDS.NOT_ENOUGH_EVIDENCE,
    label: `Fewer than ${PROGRESS_MIN_RESPONSES}`,
    description: "More results are needed before placing these students in an accuracy band.",
    policyVersion: LEARNING_POLICY_VERSION,
    count: insufficientRows.length,
    learners: insufficientRows.map(row => ({ id: row.id, name: row.name }))
  });

  const learnersWithAnyEvidence = rows.filter(row =>
    row.answered > 0 || row.itemEvidence.length > 0
  ).length;
  const configuredItemTargetCount = rows.reduce(
    (maximum, row) => Math.max(maximum, normalizedHeat(row).length),
    0
  );
  const seenItemIds = new Set(rows.flatMap(row => row.itemEvidence.map(item => item.id)));
  const itemTargetCount = Math.max(configuredItemTargetCount, seenItemIds.size);
  const coverage = {
    totalLearners: rows.length,
    learnersWithAnyEvidence,
    learnersPolicyReady: readyRows.length,
    learnerPercent: rows.length
      ? Math.round((learnersWithAnyEvidence / rows.length) * 100)
      : 0,
    policyReadyPercent: rows.length
      ? Math.round((readyRows.length / rows.length) * 100)
      : 0,
    responseCount: rows.reduce((sum, row) => sum + row.answered, 0),
    itemTargetsSeen: seenItemIds.size,
    itemTargetCount,
    itemPercent: itemTargetCount
      ? Math.round((seenItemIds.size / itemTargetCount) * 100)
      : 0,
    evidence: evidenceBasisFor({
      attempts: rows.reduce((sum, row) => sum + row.answered, 0),
      skills: [...new Set(rows.flatMap(row => row.evidenceSkills))],
      recency: latestEvidenceTime(rows.map(row => row.evidence.recency)),
      itemEvidence: rows.flatMap(row => row.itemEvidence),
      confidenceOverride: {
        id: "coverage-only",
        label: "Results coverage",
        detail: `${readyRows.length} of ${rows.length} students have enough results`,
        policyVersion: LEARNING_POLICY_VERSION
      }
    })
  };

  const classEvidence = evidenceBasisFor({
    attempts: readyRows.reduce((sum, row) => sum + row.answered, 0),
    skills: [...new Set(readyRows.flatMap(row => row.evidenceSkills))],
    recency: latestEvidenceTime(readyRows.map(row => row.evidence.recency)),
    itemEvidence: readyRows.flatMap(row => row.itemEvidence),
    confidenceOverride: readyRows.length
      ? {
          id: "policy-ready-class",
          label: "Ready to compare",
          detail: `${readyRows.length} students have enough results`,
          policyVersion: LEARNING_POLICY_VERSION
        }
      : {
          id: "not-enough-evidence",
          label: "Not enough results",
          detail: `No student has ${PROGRESS_MIN_RESPONSES} scored answers`,
          policyVersion: LEARNING_POLICY_VERSION
        }
  });

  const outliers = classMedian === null
    ? []
    : readyRows
      .map(row => ({
        id: row.id,
        name: row.name,
        accuracy: row.accuracy,
        answered: row.answered,
        difference: row.accuracy - classMedian,
        direction: row.accuracy >= classMedian ? "above" : "below",
        itemEvidence: row.itemEvidence,
        evidence: row.evidence
      }))
      .filter(row => (
        Math.abs(row.difference)
        >= LEARNING_EVIDENCE_POLICY.comparison.classOutlierPercentagePoints
      ))
      .sort((left, right) =>
        Math.abs(right.difference) - Math.abs(left.difference)
        || left.name.localeCompare(right.name)
      );

  return {
    rows,
    distribution,
    coverage,
    groups: buildGroups(rows),
    outliers,
    classAccuracy,
    classMedian,
    classEvidence,
    policyVersion: LEARNING_POLICY_VERSION,
    policy: {
      minimumResponses: PROGRESS_MIN_RESPONSES,
      itemMinimumAttempts: PROGRESS_ITEM_MIN_ATTEMPTS,
      recencyWindowDays: LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays,
      outlierDistance: LEARNING_EVIDENCE_POLICY.comparison.classOutlierPercentagePoints,
      minimumComparableLearners:
        LEARNING_EVIDENCE_POLICY.comparison.minimumPolicyReadyLearners,
      minimumComparableProportion:
        LEARNING_EVIDENCE_POLICY.comparison.minimumPolicyReadyProportion,
      maximumResponseImbalance:
        LEARNING_EVIDENCE_POLICY.comparison.maximumResponseImbalanceRatio,
      version: LEARNING_POLICY_VERSION
    }
  };
}
