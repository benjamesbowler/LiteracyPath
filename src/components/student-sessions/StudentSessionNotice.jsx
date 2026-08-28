import { studentFocusLabel } from "../../policy/studentFocusTargets.js";

export function StudentSessionNotice({ session, connection = "connected" }) {
  if (!session) return null;
  return (
    <div className="student-session-notice" role="status" aria-live="polite">
      <span aria-hidden="true">●</span>
      <strong>{studentFocusLabel(session.target)}</strong>
      <small>{connection === "reconnecting" ? "Reconnecting… stay on this activity" : "Your teacher has chosen this activity"}</small>
    </div>
  );
}
