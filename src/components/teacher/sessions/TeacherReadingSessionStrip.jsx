import { TeacherSessionFrame } from "./TeacherSessionFrame.jsx";

export function TeacherReadingSessionStrip({ host, onOpen, onOpenResults, teacherId, onReturn, returnLabel = "Back to Teach" }) {
  const active = host?.session;
  const completed = host?.lastCompleted;
  const session = active || completed?.session;
  if (!session || (teacherId && session.teacher_id !== teacherId)) return null;
  return <aside className="student-session-bar" aria-label={active ? "Active reading session" : "Reading session results"}>
    <TeacherSessionFrame phase={active ? "live" : "results"} protocol="reading" compact>
      <strong>{active ? "Reading together" : "Reading ended"} · {session.book?.title || "Shared book"}</strong>
      <p>{session.student_ids?.length || 0} selected students · {active ? "Teacher turns the pages" : "Reading changes were confirmed before ending"}</p>
      {host.pendingWrites > 0 && <p role="status">{host.pendingWrites} changes waiting to save. Keep this session open.</p>}
      {active && <button type="button" className="lp-button lp-button-primary" onClick={onOpen}>Return to reading</button>}
      {!active && onOpenResults && <button type="button" className="lp-button lp-button-primary" onClick={() => onOpenResults(session)}>View saved reading results</button>}
      {!active && <button type="button" className="lp-button" onClick={async () => { if (await onReturn?.(session) === false) return; host.dismissCompleted(); }}>{onReturn ? returnLabel : "Continue teaching"}</button>}
    </TeacherSessionFrame>
  </aside>;
}

export function TeacherFocusCompletion({ completed, onOpenResults, onDismiss, onReturn, returnLabel = "Back to Teach" }) {
  if (!completed) return null;
  return <aside className="student-session-bar" aria-label="Student session results">
    <TeacherSessionFrame phase="results" protocol="focus" compact>
      <strong>Student access has ended</strong>
      <p>{completed.awaitingResults ? "The end was confirmed. Open results to check which answers have reached the server." : `${completed.members.filter(member => member.status === "completed").length} students have confirmed completion. Unfinished work stays separate from received results.`}</p>
      {onOpenResults && <button type="button" className="lp-button lp-button-primary" onClick={() => onOpenResults(completed.session)}>View saved results</button>}
      <button type="button" className="lp-button" onClick={async () => { if (await onReturn?.(completed.session) === false) return; onDismiss?.(); }}>{onReturn ? returnLabel : "Continue teaching"}</button>
    </TeacherSessionFrame>
  </aside>;
}
