export const TEACHER_ACCOUNT_DECISION_STATUSES = Object.freeze([
  "approved",
  "rejected",
  "disabled"
]);

export function resolveTeacherAccountSchool(account = {}, schools = []) {
  return schools.find(school => school.id === account.school_id) || null;
}
export function validateTeacherAccountDecision({
  account = {},
  schools = [],
  status = "",
  reason = ""
} = {}) {
  if (!account.id || !TEACHER_ACCOUNT_DECISION_STATUSES.includes(status)) {
    return {
      ok: false,
      errorMessage: "Choose a valid teacher account decision."
    };
  }

  const school = resolveTeacherAccountSchool(account, schools);
  if (status === "approved" && !school) {
    return {
      ok: false,
      errorMessage: "Choose or resolve this teacher's school before approving access."
    };
  }

  const normalizedReason = String(reason || "").trim();
  if (status !== "approved" && normalizedReason.length < 5) {
    return {
      ok: false,
      errorMessage: "Enter a short reason of at least 5 characters for the teacher and review record."
    };
  }
  if (normalizedReason.length > 500) {
    return {
      ok: false,
      errorMessage: "Keep the review reason to 500 characters or fewer."
    };
  }

  return {
    ok: true,
    reason: status === "approved" ? "" : normalizedReason,
    school
  };
}
