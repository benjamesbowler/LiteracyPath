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
      policyBasis: `Review policy met: below ${policy.attentionAccuracyBelow}% after at least ${policy.minimumResponsesForAttention} responses.`
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
          evidence: "No scored responses yet."
        };
      }

      const quietDays = inactivityDays(row.lastActive, now);
      if (quietDays !== null && quietDays >= policy.inactivityDueDays) {
        return {
          id: row.id,
          name: row.name,
          title: "Progress review due",
          evidence: `No recorded activity for ${plural(quietDays, "day")}.`
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
