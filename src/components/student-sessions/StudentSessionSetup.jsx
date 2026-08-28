import { useMemo, useState } from "react";

import { startStudentFocusSession } from "../../data/studentFocusSessionCore.js";
import {
  STUDENT_FOCUS_TARGET_OPTIONS,
  STUDENT_FOCUS_TARGETS
} from "../../policy/studentFocusTargets.js";
import {
  assessmentAttemptsToSkillLedger,
  computeSkillStatus
} from "../../policy/skillStatusPolicy.js";
import { TeacherDialog } from "../teacher/ui/TeacherDialog.jsx";

function sameText(left, right) {
  return String(left || "").trim().toLocaleLowerCase() === String(right || "").trim().toLocaleLowerCase();
}

function nextSkillAssignment(student, dashboardById, skillTree, assessmentHistory) {
  const currentSkill = dashboardById.get(student.id)?.currentSkill || "";
  const index = skillTree.findIndex(skill => sameText(skill.label, currentSkill));
  const resolvedIndex = index >= 0 ? index : 0;
  const skill = skillTree[resolvedIndex];
  const studentAttempts = assessmentHistory.filter(record => (
    String(record?.studentId || "") === String(student.id)
    && record?.skillId === skill?.id
  ));
  const status = skill
    ? computeSkillStatus(assessmentAttemptsToSkillLedger(studentAttempts, skill.id), skill.id)
    : null;
  const path = [
    { level: 1, phase: 1, passed: status?.level1?.phases?.[1]?.passed },
    { level: 1, phase: 2, passed: status?.level1?.phases?.[2]?.passed },
    { level: 2, phase: 1, passed: status?.level2?.phases?.[1]?.passed },
    { level: 2, phase: 2, passed: status?.level2?.phases?.[2]?.passed }
  ].find(step => !step.passed) || { level: 2, phase: 2 };
  return {
    skill_id: skill?.id || "",
    skill_label: skill?.label || "Skills Assessment",
    skill_index: resolvedIndex,
    level: path.level,
    phase: path.phase
  };
}

export function StudentSessionSetup({
  client,
  classId,
  className = "",
  students = [],
  classDashboard = [],
  assessmentHistory = [],
  skillTree = [],
  initialStudentIds = [],
  onClose,
  onStarted,
  onStartGuidedReading
}) {
  const availableStudents = useMemo(
    () => students.filter(student => student?.id && !student.archived_at),
    [students]
  );
  const [target, setTarget] = useState(STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT);
  const [studentIds, setStudentIds] = useState(() => {
    const requested = new Set(initialStudentIds.filter(Boolean));
    const selected = availableStudents.filter(student => requested.has(student.id)).map(student => student.id);
    return selected.length ? selected : availableStudents.map(student => student.id);
  });
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const dashboardById = useMemo(
    () => new Map(classDashboard.map(row => [row.id, row])),
    [classDashboard]
  );
  const skillsEvidenceReady = studentIds.every(studentId => (
    dashboardById.get(studentId)?.evidenceReadStatus === "complete"
  ));

  function toggleStudent(studentId) {
    setStudentIds(current => current.includes(studentId)
      ? current.filter(id => id !== studentId)
      : [...current, studentId]);
  }

  async function start() {
    if (!studentIds.length || busy) return;
    if (target === "guided_reading") {
      onClose?.();
      onStartGuidedReading?.();
      return;
    }
    if (target === STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT && !skillsEvidenceReady) {
      setMessage("The saved assessment evidence for every selected student must finish loading before this session can start.");
      return;
    }

    const selectedStudents = availableStudents.filter(student => studentIds.includes(student.id));
    const assignments = target === STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT
      ? Object.fromEntries(selectedStudents.map(student => [
          student.id,
          nextSkillAssignment(student, dashboardById, skillTree, assessmentHistory)
        ]))
      : {};

    setBusy(true);
    setMessage("");
    try {
      const data = await startStudentFocusSession({
        client,
        classId,
        target,
        studentIds,
        assignments,
        durationMinutes
      });
      if (data?.ok === false) {
        const busyStudent = availableStudents.find(student => student.id === data.student_id);
        setMessage(data.error === "student_busy"
          ? `${busyStudent?.name || "That student"} is already in another teacher-controlled session.`
          : "The student session could not start. Check the selected students and try again.");
        return;
      }
      onStarted?.(data.session);
    } catch {
      setMessage("The student session could not start. Check the connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="student-session-modal-backdrop">
      <TeacherDialog busy={busy} className="student-session-setup" label="Start student session" onClose={onClose}>
        <header className="student-session-setup-header">
          <div>
            <p className="panel-label">Student sessions</p>
            <h2>Control student iPads</h2>
            <p>{className ? `${className} · ` : ""}Choose one activity and who should use it.</p>
          </div>
          <button className="lp-button lp-button-secondary" onClick={onClose} type="button">Close</button>
        </header>

        <section className="student-session-section" aria-labelledby="student-session-activity-title">
          <h3 id="student-session-activity-title">1. Choose the activity</h3>
          <div className="student-session-targets">
            {STUDENT_FOCUS_TARGET_OPTIONS.map(option => (
              <button
                aria-pressed={target === option.id}
                className={target === option.id ? "selected" : ""}
                key={option.id}
                onClick={() => setTarget(option.id)}
                type="button"
              >
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
            <button
              aria-pressed={target === "guided_reading"}
              className={target === "guided_reading" ? "selected" : ""}
              onClick={() => setTarget("guided_reading")}
              type="button"
            >
              <strong>Guided Reading Together</strong>
              <span>Open the existing shared-book session for up to six students.</span>
            </button>
          </div>
        </section>

        <section className="student-session-section" aria-labelledby="student-session-students-title">
          <div className="student-session-section-heading">
            <h3 id="student-session-students-title">2. Choose the students</h3>
            <div>
              <button className="text-button" onClick={() => setStudentIds(availableStudents.map(student => student.id))} type="button">Whole class</button>
              <button className="text-button" onClick={() => setStudentIds([])} type="button">Clear</button>
            </div>
          </div>
          <div className="student-session-student-list">
            {availableStudents.map(student => {
              const dashboard = dashboardById.get(student.id);
              return (
                <label key={student.id}>
                  <input
                    checked={studentIds.includes(student.id)}
                    onChange={() => toggleStudent(student.id)}
                    type="checkbox"
                  />
                  <span>
                    <strong>{student.name}</strong>
                    <small>{target === STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT
                      ? dashboard?.evidenceReadStatus === "complete"
                        ? dashboard.currentSkill || "Initial skill"
                        : "Assessment evidence still loading"
                      : student.symbol_password ? "Ready to sign in" : "Sign-in pictures needed"}</small>
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        {target !== "guided_reading" && (
          <section className="student-session-section student-session-start" aria-labelledby="student-session-finish-title">
            <div>
              <h3 id="student-session-finish-title">3. Start the session</h3>
              <label>
                Safety expiry
                <select value={durationMinutes} onChange={event => setDurationMinutes(Number(event.target.value))}>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>2 hours</option>
                </select>
              </label>
            </div>
            <button
              className="lp-button lp-button-primary"
              data-autofocus
              disabled={!studentIds.length || busy || (target === STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT && !skillsEvidenceReady)}
              onClick={start}
              type="button"
            >
              {busy ? "Starting…" : `Start for ${studentIds.length} student${studentIds.length === 1 ? "" : "s"}`}
            </button>
          </section>
        )}

        {target === "guided_reading" && (
          <div className="student-session-guided-start">
            <button className="lp-button lp-button-primary" onClick={start} type="button">Choose book and reading group</button>
          </div>
        )}
        {message && <p className="student-session-message" role="alert">{message}</p>}
      </TeacherDialog>
    </div>
  );
}
