const DAY_MS = 24 * 60 * 60 * 1000;

export const TEACHER_TODAY_POLICY = Object.freeze({
  minimumResponsesForAttention: 8,
  attentionAccuracyBelow: 70,
  inactivityDueDays: 7,
  changeWindowDays: 7
});

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

export function buildTeacherTodayBriefing(
  rows = [],
  {
    now = new Date(),
    policy = TEACHER_TODAY_POLICY
  } = {}
) {
  const attention = rows
    .filter(row =>
      Number(row.answered) >= policy.minimumResponsesForAttention
      && Number.isFinite(Number(row.accuracy))
      && Number(row.accuracy) < policy.attentionAccuracyBelow
    )
    .sort((a, b) => Number(a.accuracy) - Number(b.accuracy))
    .map(row => ({
      id: row.id,
      name: row.name,
      accuracy: Number(row.accuracy),
      answered: Number(row.answered),
      focus: row.currentSkill || "Current focus",
      evidence: `${plural(Number(row.answered), "response")} · ${Number(row.accuracy)}% accuracy`,
      policyBasis: `Review policy met: below ${policy.attentionAccuracyBelow}% after at least ${policy.minimumResponsesForAttention} responses.`,
      explanation: {
        evidence: `${plural(Number(row.answered), "scored response")} at ${Number(row.accuracy)}% accuracy on the current evidence.`,
        dependency: `${row.currentSkill || "The current focus"} is the recorded focus to review before advancing dependent practice.`,
        confidence: `Threshold met: at least ${policy.minimumResponsesForAttention} responses and accuracy below ${policy.attentionAccuracyBelow}%.`,
        unlock: "Reviewing the learner evidence can confirm a focused support plan and define the next check."
      }
    }));

  const insufficientEvidence = rows.filter(row =>
    Number(row.answered) > 0
    && Number(row.answered) < policy.minimumResponsesForAttention
    && Number.isFinite(Number(row.accuracy))
    && Number(row.accuracy) < policy.attentionAccuracyBelow
  );

  const due = rows
    .map(row => {
      if (Number(row.answered) === 0) {
        return {
          id: row.id,
          name: row.name,
          title: "First checkpoint due",
          evidence: "No scored responses yet.",
          explanation: {
            evidence: "No scored responses have been recorded for this learner.",
            dependency: "A first checkpoint is required before an attainment conclusion or targeted next skill can be chosen.",
            confidence: "High confidence in the evidence gap; no attainment level is inferred.",
            unlock: "The first scored checkpoint establishes a baseline for later teaching and progress decisions."
          }
        };
      }

      const quietDays = inactivityDays(row.lastActive, now);
      if (quietDays !== null && quietDays >= policy.inactivityDueDays) {
        return {
          id: row.id,
          name: row.name,
          title: "Progress review due",
          evidence: `No recorded activity for ${plural(quietDays, "day")}.`,
          explanation: {
            evidence: `The latest recorded activity is ${plural(quietDays, "day")} old.`,
            dependency: `A current review is required after the ${policy.inactivityDueDays}-day inactivity window.`,
            confidence: "High confidence in the activity date; no learning regression is inferred.",
            unlock: "A review restores current context and identifies whether practice, assessment, or no change is appropriate."
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
          plural(recentAnswers, "new response"),
          plural(recentMastered, "newly secured skill")
        ].join(" · "),
        comparison: `Prior ${policy.changeWindowDays} days: ${plural(previousAnswers, "response")} and ${plural(previousMastered, "secured skill")}.`
      };
    });

  return {
    attention,
    due,
    changed,
    insufficientEvidenceCount: insufficientEvidence.length,
    policy
  };
}
