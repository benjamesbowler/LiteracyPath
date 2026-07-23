import { normalizeActionFeedback } from "../utils/actionFeedback.js";

export function ActionFeedback({
  className = "",
  feedback,
  kind = "info",
  message = "",
  onAction,
  actionLabel = ""
}) {
  const normalized = normalizeActionFeedback(
    feedback || { kind, message, onAction, actionLabel },
    kind
  );
  if (!normalized) return null;

  const resolvedAction = normalized.onAction || onAction;
  const resolvedActionLabel = normalized.actionLabel || actionLabel;
  const isError = normalized.kind === "error";
  const classes = [
    "lp-action-feedback",
    `is-${normalized.kind}`,
    className
  ].filter(Boolean).join(" ");

  return (
    <section
      aria-atomic="true"
      aria-busy={normalized.kind === "pending" ? "true" : undefined}
      aria-live={isError ? "assertive" : "polite"}
      className={classes}
      data-action-feedback=""
      data-feedback-kind={normalized.kind}
      role={isError ? "alert" : "status"}
    >
      <span className="lp-action-feedback-mark" aria-hidden="true"></span>
      <p>{normalized.message}</p>
      {resolvedAction && resolvedActionLabel && (
        <button className="text-button" onClick={resolvedAction} type="button">
          {resolvedActionLabel}
        </button>
      )}
    </section>
  );
}
