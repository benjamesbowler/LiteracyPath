import { TeacherModal } from "./ui/TeacherDialog.jsx";

export function TeacherWorkflowHelp({ onClose, onOpen }) {
  return <TeacherModal labelledBy="teacher-help-title" onClose={onClose}>
    <div className="symbol-password-modal-card page-stack">
      <h2 id="teacher-help-title">Help with teaching tasks</h2>
      <p>Choose the task you want to do. Your class stays selected.</p>
      <dl>
        <dt>Teach</dt><dd>Open a lesson, send supported practice, browse books, read together or print. Review students before sending work.</dd>
        <dt>Assessments</dt><dd>Choose an independent assessment or an assessment with you. Practice is separate from assessment results.</dd>
        <dt>Reports</dt><dd>Read the summary, find a saved activity, review full results or prepare a family update.</dd>
        <dt>Students</dt><dd>Manage groups, sign-in pictures, learning support and student records. A viewed student is separate from a group selected with checkboxes.</dd>
      </dl>
      <div className="teacher-learner-drawer-actions">
        <button type="button" className="lp-button" onClick={() => onOpen("teach")}>Open Teach</button>
        <button type="button" className="lp-button" onClick={() => onOpen("reports")}>Find saved results</button>
        <button type="button" className="lp-button" onClick={() => onOpen("sign-in")}>Manage sign-in</button>
        <button type="button" className="lp-button" onClick={() => onOpen("support")}>Learning support</button>
      </div>
      <p>Not checked means there is no result. Not enough results means more answers are needed. Mixed results need review. A pending save is not a confirmed result.</p>
      <button type="button" className="lp-button lp-button-primary" onClick={onClose}>Close Help</button>
    </div>
  </TeacherModal>;
}
