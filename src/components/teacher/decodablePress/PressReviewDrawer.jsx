import { useState } from "react";
import { BookPreview } from "../../decodablePress/BookPreview.jsx";
import { reviewPressRevision } from "../../../data/decodablePress/decodablePress.js";
import { printPressBooklet } from "../../../utils/decodablePress/printPressBook.js";
import { TeacherDialog } from "../ui/TeacherDialog.jsx";

export function PressReviewDrawer({ client, book, project, onClose, onReviewed }) {
  const [feedback, setFeedback] = useState("");
  const [challenges, setChallenges] = useState(() => (book.validation?.pages || []).flatMap(page => page.needsReview || []).filter((word, index, list) => list.indexOf(word) === index));
  const [allowClass, setAllowClass] = useState(Boolean(project?.allow_class_library));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function decide(decision) {
    setBusy(true); setMessage("");
    try { await reviewPressRevision(client, { bookId: book.id, revisionId: book.current_revision_id, decision, review: { childFeedback: feedback, approvedChallenges: challenges, allowClassLibrary: allowClass } }); await onReviewed(); onClose(); }
    catch { setMessage("The review could not be saved. Your notes are still here; try again."); }
    finally { setBusy(false); }
  }
  return <TeacherDialog className="press-review-drawer" labelledBy="press-review-title" onClose={onClose} busy={busy}>
    <header><div><p>Exact revision {book.revision}</p><h2 id="press-review-title">Review {book.student_name}’s book</h2></div><button type="button" onClick={onClose}>Close</button></header>
    <BookPreview book={book.content} authorName={book.student_name} />
    <section><h3>Visible validation findings</h3>{challenges.length ? <p>Requested challenge words: {challenges.join(", ")}</p> : <p>No words are waiting for teacher help.</p>}
      <label>Approved challenge words<input value={challenges.join(", ")} onChange={event => setChallenges(event.target.value.split(",").map(word => word.trim().toLowerCase()).filter(Boolean))} /></label>
      <label>Child-safe note<textarea maxLength="1000" value={feedback} onChange={event => setFeedback(event.target.value)} placeholder="Say exactly what to change, or celebrate a specific choice." /></label>
      {project?.allow_class_library && <label className="press-class-library-check"><input type="checkbox" checked={allowClass} onChange={event => setAllowClass(event.target.checked)} /> Approve this exact revision for the class-only library</label>}
      <p className="press-privacy-note">The teacher review keeps the learner’s name private. Classmates see “A reader in your class” rather than the roster name.</p>
      <button type="button" onClick={() => printPressBooklet({ book: book.content, authorName: book.student_name, revisionId: book.current_revision_id })}>Print this exact revision</button>
      <div className="press-review-actions"><button type="button" disabled={busy} onClick={() => decide("approved")}>Approve exact revision</button><button type="button" disabled={busy || !feedback.trim()} onClick={() => decide("changes_requested")}>Request changes</button><button type="button" disabled={busy} onClick={() => decide("archived")}>Archive privately</button></div>{message && <p role="alert">{message}</p>}
    </section>
  </TeacherDialog>;
}
