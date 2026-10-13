import { useRef, useState } from "react";
import { TeacherDialog } from "../teacher/ui/TeacherDialog.jsx";
import "./readingSession.css";

export function ReadingSessionRecoveryDialog({ session, onResume, onEnd, pendingChanges = 0 }) {
  const [ending, setEnding] = useState(false);
  const [resuming, setResuming] = useState(false);
  const busyRef = useRef(false);
  const [message, setMessage] = useState("");
  if (!session) return null;
  return (
    <div className="reading-session-modal-backdrop">
      <TeacherDialog className="reading-session-end-dialog" label="Reading session still open">
        <h2>You have a reading session still open</h2>
        <p>Continue where the group stopped, or end it before starting another.</p>
        {pendingChanges > 0 && <p role="status">{pendingChanges} reading changes are waiting to save. Continue reading to send them before ending access.</p>}
        <div>
          <button
            className="lp-button lp-button-secondary"
            disabled={ending || resuming || pendingChanges > 0}
            onClick={async () => {
              if (busyRef.current) return;
              busyRef.current = true;
              setEnding(true);
              setMessage("");
              try {
                if (await onEnd?.() === false) throw new Error("not_ended");
              } catch {
                setMessage("The reading session is still open. Check the connection and try again.");
              } finally {
                busyRef.current = false;
                setEnding(false);
              }
            }}
            type="button"
          >
            {ending ? "Ending…" : "End it"}
          </button>
          <button className="lp-button lp-button-primary" disabled={ending || resuming} data-autofocus onClick={async () => {
            if (busyRef.current) return;
            busyRef.current = true;
            setResuming(true); setMessage("");
            try { if (await onResume?.() === false) throw new Error("not_resumed"); }
            catch { setMessage("The reading session could not reopen. Your session and pending changes are still here. Try continuing again."); }
            finally { busyRef.current = false; setResuming(false); }
          }} type="button">
            {resuming ? "Opening reading…" : "Continue reading"}
          </button>
        </div>
        {message && <p className="reading-session-message" role="alert">{message}</p>}
      </TeacherDialog>
    </div>
  );
}
