import {
  LEARNING_CONCLUSION_SCOPES,
  LEARNING_EVIDENCE_POLICY,
  LEARNING_STATUS_IDS,
  evaluateLearningConclusion
} from "../policy/learningPolicy.js";

const DAY_MS = 24 * 60 * 60 * 1000;

// Derived, never re-typed. These two numbers used to be literals here, a second
// copy of the policy that happened to agree with src/policy/learningPolicy.js
// and had nothing keeping it in agreement — and the threshold guard did not
// scan this file, so a drift would have been silent.
export const TEACHER_TODAY_POLICY = Object.freeze({
  minimumResponsesForAttention: LEARNING_EVIDENCE_POLICY.minimumEvidence.learnerScoredResponses,
  attentionAccuracyBelow: LEARNING_EVIDENCE_POLICY.accuracyPercent.developingMinimum,
  conclusionWindowDays: LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays,
  inactivityDueDays: 7,
  changeWindowDays: 7
});

export function allocateTeacherTodayUrgentPreviews({
  attentionCount = 0,
  dueCount = 0,
  maximum = 3
} = {}) {
  const budget = Math.max(0, Number(maximum) || 0);
  const attention = Math.min(
    Math.max(0, Number(attentionCount) || 0),
    budget
  );
  const due = Math.min(
    Math.max(0, Number(dueCount) || 0),
    Math.max(0, budget - attention)
  );
  return { attention, due, total: attention + due };
}

function plural(value, singular, pluralForm = `${singular}s`) {
  return `${value} ${value === 1 ? singular : pluralForm}`;
}

function validDate(value) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date : null;
}

function inactivityDays(value, now) {
  const date = validDate(value);
  if (!date) return null;
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / DAY_MS));
}

function normalizedSkill(value) {
  return String(value || "").trim().toLocaleLowerCase();
}

function sourceConclusion(source, now) {
  return evaluateLearningConclusion({
    scope: LEARNING_CONCLUSION_SCOPES.SKILL,
    accuracy: source?.accuracy,
    attempts: source?.answered,
    skillDiversity: Number(source?.skillDiversity) || 1,
    observedAt: source?.lastActive,
    now
  });
}

function overallConclusion(row, now) {
  if (row?.learningConclusion) return row.learningConclusion;
  return evaluateLearningConclusion({
    accuracy: row?.accuracy,
    attempts: row?.answered,
    skillDiversity: Array.isArray(row?.evidenceSkills)
      ? row.evidenceSkills.length
      : 1,
    observedAt: row?.lastActive,
    now
  });
}

function attentionEvidence(row, now) {
  if ((row?.evidenceReadStatus || "complete") !== "complete") return null;
  const currentSkill = normalizedSkill(row?.currentSkill);
  const focusEvidence = row?.focusEvidence;
  const focusSkill = normalizedSkill(
    focusEvidence?.skill || focusEvidence?.skillName || focusEvidence?.currentSkill
  );
  const focusAligned = Boolean(
    focusEvidence
    && currentSkill
    && focusSkill
    && focusSkill === currentSkill
  );

  if (focusAligned) {
    const conclusion = sourceConclusion(focusEvidence, now);
    if (!conclusion.ready || conclusion.status.id !== LEARNING_STATUS_IDS.NEEDS_SUPPORT) {
      return null;
    }
    return {
      accuracy: conclusion.accuracy,
      answered: conclusion.attempts,
      focus: row.currentSkill,
      evidence: `${plural(conclusion.attempts, "answer")} on ${row.currentSkill} · ${conclusion.accuracy}% accuracy`,
      dependency: `Review ${row.currentSkill} before moving to the next skill.`,
      confidence: conclusion.confidence.detail
    };
  }

  // Older or mixed evidence can still justify a teacher review, but it cannot
  // truthfully be attributed to the student's current focus.
  const conclusion = overallConclusion(row, now);
  if (!conclusion.ready || conclusion.status.id !== LEARNING_STATUS_IDS.NEEDS_SUPPORT) {
    return null;
  }
  return {
    accuracy: conclusion.accuracy,
    answered: conclusion.attempts,
    focus: "Review recent results",
    evidence: `${plural(conclusion.attempts, "answer")} across saved results · ${conclusion.accuracy}% accuracy`,
    dependency: "The lower results span more than one skill, so review them before choosing a teaching focus.",
    confidence: conclusion.confidence.detail
  };
}

export function buildTeacherTodayBriefing(
  rows = [],
  {
    now = new Date(),
    policy = TEACHER_TODAY_POLICY
  } = {}
) {
  const attention = rows
    .map(row => ({ row, attention: attentionEvidence(row, now) }))
    .filter(item => item.attention)
    .sort((a, b) => a.attention.accuracy - b.attention.accuracy)
    .map(({ row, attention: item }) => ({
        id: row.id,
        name: row.name,
        accuracy: item.accuracy,
        answered: item.answered,
        focus: item.focus,
        evidence: item.evidence,
        policyBasis: `Shown after ${policy.minimumResponsesForAttention} current answers below ${policy.attentionAccuracyBelow}%.`,
        explanation: {
          evidence: item.evidence,
          dependency: item.dependency,
          confidence: item.confidence,
          unlock: "A quick review helps you choose focused practice and the next assessment."
        }
      }));

  const insufficientEvidence = rows.filter(row => {
    if ((row?.evidenceReadStatus || "complete") !== "complete") return false;
    const focusEvidence = row?.focusEvidence;
    const focusAligned = focusEvidence
      && normalizedSkill(focusEvidence.skill || focusEvidence.skillName || focusEvidence.currentSkill)
        === normalizedSkill(row.currentSkill);
    const conclusion = focusAligned
      ? sourceConclusion(focusEvidence, now)
      : overallConclusion(row, now);
    return conclusion.attempts > 0
      && !conclusion.confidence.sufficient
      && Number.isFinite(conclusion.accuracy)
      && conclusion.accuracy < policy.attentionAccuracyBelow;
  });

  const due = rows
    .map(row => {
      if ((row?.evidenceReadStatus || "complete") !== "complete") return null;
      if (Number(row.answered) === 0) {
        return {
          id: row.id,
          name: row.name,
          title: "First assessment due",
          evidence: "No scored answers yet.",
          explanation: {
          evidence: "No scored answers have been saved for this student.",
            dependency: "A first assessment helps you choose the right starting skill.",
            confidence: "No learning level is guessed before the first result.",
            unlock: "The first saved assessment gives you a starting point for later progress."
          }
        };
      }

      const quietDays = inactivityDays(row.lastActive, now);
      if (quietDays !== null && quietDays >= policy.inactivityDueDays) {
        return {
          id: row.id,
          name: row.name,
          title: "Progress review due",
          evidence: `No saved activity for ${plural(quietDays, "day")}.`,
          explanation: {
            evidence: `The latest saved activity is ${plural(quietDays, "day")} old.`,
            dependency: `Review after ${policy.inactivityDueDays} days without activity.`,
            confidence: "This uses the activity date only and does not guess that learning has gone backwards.",
            unlock: "A review shows whether practice, an assessment, or no change is right."
          }
        };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  const changed = rows
    .filter(row => Number(row.recentAnswers) > 0 || Number(row.recentMastered) > 0)
    .sort((a, b) =>
      (Number(b.recentAnswers) + Number(b.recentMastered))
      - (Number(a.recentAnswers) + Number(a.recentMastered))
    )
    .map(row => {
      const recentAnswers = Number(row.recentAnswers) || 0;
      const previousAnswers = Number(row.previousAnswers) || 0;
      const recentMastered = Number(row.recentMastered) || 0;
      const previousMastered = Number(row.previousMastered) || 0;
      return {
        id: row.id,
        name: row.name,
        summary: [
          plural(recentAnswers, "new answer"),
          plural(recentMastered, "newly secured skill")
        ].join(" · "),
        comparison: `Previous ${policy.changeWindowDays} days: ${plural(previousAnswers, "answer")} and ${plural(previousMastered, "secure skill")}.`
      };
    });

  // Day one: nobody has answered anything, so "25 students due a first check"
  // is one fact, not 25 rows. The UI collapses to a single line and one button.
  const allFirstCheckDue = rows.length > 0
    && due.length === rows.length
    && due.every(row => row.title === "First assessment due");

  return {
    attention,
    due,
    changed,
    allFirstCheckDue,
    insufficientEvidenceCount: insufficientEvidence.length,
    policy
  };
}
