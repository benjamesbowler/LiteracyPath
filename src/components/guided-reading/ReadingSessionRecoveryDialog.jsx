import { useState } from "react";
import { TeacherDialog } from "../teacher/ui/TeacherDialog.jsx";
import "./readingSession.css";

export function ReadingSessionRecoveryDialog({ session, onResume, onEnd }) {
  const [ending, setEnding] = useState(false);
  const [message, setMessage] = useState("");
  if (!session) return null;
  return (
    <div className="reading-session-modal-backdrop">
      <TeacherDialog className="reading-session-end-dialog" label="Reading session still open">
        <h2>You have a reading session still open</h2>
        <p>Continue where the group stopped, or end it before starting another.</p>
        <div>
          <button
            className="lp-button lp-button-secondary"
            disabled={ending}
            onClick={async () => {
              setEnding(true);
              setMessage("");
              try {
                await onEnd?.();
              } catch {
                setMessage("The reading session is still open. Check the connection and try again.");
              } finally {
                setEnding(false);
              }
            }}
            type="button"
          >
            {ending ? "Ending…" : "End it"}
          </button>
          <button className="lp-button lp-button-primary" data-autofocus onClick={onResume} type="button">
            Continue reading
          </button>
        </div>
        {message && <p className="reading-session-message" role="alert">{message}</p>}
      </TeacherDialog>
    </div>
  );
}
