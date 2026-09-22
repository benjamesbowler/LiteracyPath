// Selection history is not achievement evidence. Keep only the last planned
// form per skill/phase so abandoning a check cannot erase repeat protection.
const PREFIX = "lpAssessmentSelection:v1";
const key = ({ teacherId, studentId }) => `${PREFIX}:${encodeURIComponent(teacherId || "local")}:${encodeURIComponent(studentId || "")}`;
const slot = plan => `${plan.skillId}:${plan.mode === "retention" ? "retention" : `${plan.level}:${plan.phase}`}`;

export function loadAssessmentSelectionHistory(scope, storage) {
  try {
    storage ??= globalThis.localStorage;
    const value = JSON.parse(storage?.getItem(key(scope)) || "{}");
    return Object.values(value).filter(plan => plan.studentId === scope.studentId && Array.isArray(plan.questionIds));
  } catch { return []; }
}

export function saveAssessmentSelectionHistory(plan, scope, storage) {
  try {
    storage ??= globalThis.localStorage;
    if (!storage || !scope.studentId || plan.studentId !== scope.studentId) return false;
    const history = Object.fromEntries(loadAssessmentSelectionHistory(scope, storage).map(row => [slot(row), row]));
    history[slot(plan)] = {
      studentId: plan.studentId, skillId: plan.skillId, mode: plan.mode,
      level: plan.level, phase: plan.phase, startedAt: plan.startedAt,
      questionIds: [...plan.questionIds, ...(plan.failedQuestionIds || [])].filter(Boolean)
    };
    storage.setItem(key(scope), JSON.stringify(history));
    return true;
  } catch { return false; }
}
