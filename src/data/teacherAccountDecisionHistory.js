export const TEACHER_ACCOUNT_DECISION_HISTORY_PAGE_SIZE = 500;
export const TEACHER_ACCOUNT_DECISION_HISTORY_MAX_ROWS = 10_000;

const HISTORY_COLUMNS = [
  "id",
  "account_id",
  "teacher_user_id",
  "previous_status",
  "decision_status",
  "reason",
  "school_id",
  "school_name",
  "decided_by",
  "decided_at",
  "created_at"
].join(", ");

export async function loadTeacherAccountDecisionHistory({
  client,
  pageSize = TEACHER_ACCOUNT_DECISION_HISTORY_PAGE_SIZE,
  maxRows = TEACHER_ACCOUNT_DECISION_HISTORY_MAX_ROWS
} = {}) {
  if (!client) {
    return {
      complete: false,
      error: new Error("Decision history requires an authenticated Admin connection."),
      rows: [],
      status: "unavailable"
    };
  }

  const boundedPageSize = Math.max(1, Math.min(1_000, Number(pageSize) || 1));
  const boundedMaxRows = Math.max(
    boundedPageSize,
    Number(maxRows) || boundedPageSize
  );
  const rows = [];

  while (rows.length < boundedMaxRows) {
    const from = rows.length;
    const to = Math.min(from + boundedPageSize, boundedMaxRows) - 1;
    const { data, error } = await client
      .table("teacher_account_decision_events")
      .select(HISTORY_COLUMNS)
      .order("decided_at", { ascending: false })
      .range(from, to);

    if (error) {
      return {
        complete: false,
        error,
        rows: [],
        status: "error"
      };
    }

    const page = Array.isArray(data) ? data : [];
    rows.push(...page);
    if (page.length < (to - from + 1)) {
      return {
        complete: true,
        error: null,
        rows,
        status: "complete"
      };
    }
  }

  return {
    complete: false,
    error: new Error(
      `Decision history exceeded the verified ${boundedMaxRows}-row read limit.`
    ),
    rows: [],
    status: "error",
    truncated: true
  };
}
