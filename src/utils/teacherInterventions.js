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
      if (!intervention?.id) return [];
      if (
        intervention.status === "reviewed"
        && intervention.follow_up_required
        && ["partial", "ineffective"].includes(intervention.outcome)
      ) {
        return [{
          ...intervention,
          queueReason: "follow-up",
          queueLabel: intervention.outcome === "ineffective"
            ? "Ineffective — follow-up needed"
            : "Partial response — follow-up needed"
        }];
      }
      const dueDate = asDateKey(
        intervention.status === "planned"
          ? intervention.planned_for
          : intervention.next_review_on
      );
      if (dateKey && dueDate && dueDate < dateKey && intervention.status !== "reviewed") {
        return [{
          ...intervention,
          queueReason: "overdue",
          queueLabel: intervention.status === "planned"
            ? "Delivery overdue"
            : "Outcome review overdue"
        }];
      }
      return [];
    })
    .sort((left, right) => (
      Number(left.queueReason !== "follow-up") - Number(right.queueReason !== "follow-up")
      || String(left.planned_for || "").localeCompare(String(right.planned_for || ""))
      || String(left.created_at || "").localeCompare(String(right.created_at || ""))
    ));
}

export function interventionStatusLabel(intervention) {
  if (intervention?.status === "delivered") return "Delivered · outcome needed";
  if (intervention?.status === "recorded") return "Outcome recorded · review needed";
  if (intervention?.status === "reviewed") {
    if (intervention.follow_up_required) return "Reviewed · follow-up needed";
    if (intervention.outcome === "effective") return "Reviewed · effective";
    if (intervention.outcome === "partial") return "Reviewed · partial response";
    if (intervention.outcome === "ineffective") return "Reviewed · ineffective response";
    return "Reviewed";
  }
  return "Planned · delivery needed";
}
