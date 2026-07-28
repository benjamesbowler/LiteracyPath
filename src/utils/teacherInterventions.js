function asDateKey(value) {
  const text = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

export function localDateKey(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date);
  if (!Number.isFinite(value.getTime())) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildInterventionTodayQueue(interventions = [], today = localDateKey()) {
  const dateKey = asDateKey(today);
  return interventions
    .flatMap(intervention => {
      if (!intervention?.id || intervention.status === "cancelled") return [];
      if (
        intervention.status === "reviewed"
        && intervention.follow_up_required
        && ["partial", "ineffective"].includes(intervention.outcome)
      ) {
        return [{
          ...intervention,
          queueReason: "follow-up",
          queueLabel: intervention.outcome === "ineffective"
            ? "Support did not help yet — plan a follow-up"
            : "Support helped a little — plan a follow-up"
        }];
      }
      if (intervention.status === "delivered") {
        return [{
          ...intervention,
          queueReason: "record-outcome",
          queueLabel: "Support was taught — add what happened"
        }];
      }
      if (intervention.status === "recorded") {
        return [{
          ...intervention,
          queueReason: "review",
          queueLabel: "Observation saved — review the support"
        }];
      }
      const dueDate = asDateKey(intervention.planned_for);
      if (intervention.status === "planned" && dateKey && dueDate && dueDate <= dateKey) {
        return [{
          ...intervention,
          queueReason: dueDate === dateKey ? "due-today" : "overdue",
          queueLabel: dueDate === dateKey
            ? "Teaching action is due today"
            : "Teaching action is overdue"
        }];
      }
      return [];
    })
    .sort((left, right) => (
      ({
        "follow-up": 0,
        "record-outcome": 1,
        review: 2,
        overdue: 3,
        "due-today": 4
      }[left.queueReason] ?? 9) - ({
        "follow-up": 0,
        "record-outcome": 1,
        review: 2,
        overdue: 3,
        "due-today": 4
      }[right.queueReason] ?? 9)
      || String(left.planned_for || "").localeCompare(String(right.planned_for || ""))
      || String(left.created_at || "").localeCompare(String(right.created_at || ""))
    ));
}

export function interventionStatusLabel(intervention) {
  if (intervention?.status === "cancelled") return "Cancelled";
  if (intervention?.status === "delivered") return "Taught · add what happened";
  if (intervention?.status === "recorded") return "Observation saved · review next";
  if (intervention?.status === "reviewed") {
    if (intervention.follow_up_required) return "Reviewed · follow-up needed";
    if (intervention.outcome === "effective") return "Reviewed · worked as planned";
    if (intervention.outcome === "partial") return "Reviewed · helped a little";
    if (intervention.outcome === "ineffective") return "Reviewed · did not help yet";
    return "Reviewed";
  }
  return "Planned · teach next";
}
