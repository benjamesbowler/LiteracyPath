import { Suspense } from "react";
import { lazyWithRetry } from "../../utils/lazyWithRetry.js";
import { TeacherDialog } from "../teacher/ui/TeacherDialog.jsx";

const StudentSessionSetup = lazyWithRetry(() =>
  import("./StudentSessionSetup.jsx").then(module => ({ default: module.StudentSessionSetup }))
);

export function StudentSessionSetupDialog({ onClose, ...props }) {
  return (
    <Suspense fallback={(
      <div className="student-session-modal-backdrop">
        <TeacherDialog className="student-session-setup" label="Start student session" onClose={onClose}>
          <h2>Control student iPads</h2>
          <p role="status">Loading session options…</p>
          <button className="lp-button lp-button-secondary" onClick={onClose} type="button">Cancel</button>
        </TeacherDialog>
      </div>
    )}>
      <StudentSessionSetup {...props} onClose={onClose} />
    </Suspense>
  );
}
