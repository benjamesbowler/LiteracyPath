const GRADE_LABELS = Object.freeze({
  K: "Kindergarten",
  1: "Grade 1",
  2: "Grade 2"
});

const WINDOW_LABELS = Object.freeze({
  BOY: "Beginning of year",
  MOY: "Middle of year",
  EOY: "End of year"
});

export const EL_EXPORT_GRADE_OPTIONS = Object.freeze(
  Object.entries(GRADE_LABELS).map(([value, label]) => Object.freeze({ value, label }))
);

export const EL_EXPORT_WINDOW_OPTIONS = Object.freeze(
  Object.entries(WINDOW_LABELS).map(([value, label]) => Object.freeze({ value, label }))
);

export function normalizeElExportScope(scope = {}) {
  const grade = String(scope.grade || "").toUpperCase();
  const benchmarkWindow = String(scope.benchmarkWindow || scope.window || "").toUpperCase();
  const complete = Boolean(GRADE_LABELS[grade] && WINDOW_LABELS[benchmarkWindow]);
  return {
    grade: GRADE_LABELS[grade] ? grade : "",
    benchmarkWindow: WINDOW_LABELS[benchmarkWindow] ? benchmarkWindow : "",
    label: complete
      ? `${GRADE_LABELS[grade]} · ${WINDOW_LABELS[benchmarkWindow]}`
      : "Choose grade and assessment window",
    isRouteScoped: complete,
    resolved: complete
  };
}

export function getStudentElExportEntryDecision({
  scope = {},
  savedElAssessmentCount = 0,
  reconciledEvidenceCount = 0,
  studentName = "this student"
} = {}) {
  const normalizedScope = normalizeElExportScope(scope);
  if (!normalizedScope.isRouteScoped) {
    return {
      action: "block",
      scope: normalizedScope,
      message: "Choose a grade and assessment window before exporting this EL report."
    };
  }
  if (Number(savedElAssessmentCount || 0) <= 0) {
    return {
      action: "warn",
      scope: normalizedScope,
      emptyReport: Number(reconciledEvidenceCount || 0) <= 0,
      message: `Nothing to report for ${studentName || "this student"} — no saved EL evidence. Run or save an assessment first.`
    };
  }
  return {
    action: "export",
    scope: normalizedScope,
    emptyReport: false,
    message: ""
  };
}
