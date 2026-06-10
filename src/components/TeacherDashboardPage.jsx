import { useEffect, useMemo, useRef, useState } from "react";
import { SymbolPasswordPad, SymbolSequence } from "./SymbolPasswordPad.jsx";

function formatLastActive(value) {
  if (!value) return "No activity yet";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return String(value);

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday - startOfDate) / 86400000);

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export function TeacherDashboardPage({
  classList = [],
  selectedClassId,
  setSelectedClassId,
  setStudentList,
  studentList = [],
  loadingStudents = false,
  loadStudents,
  onLoadStudent,
  createClass,
  newClassName,
  setNewClassName,
  createStudent,
  classDashboard = [],
  loadClassDashboard,
  skillTree = [],
  updateStudentSymbolPassword,
  resetStudentSymbolPassword,
  startStudentLogin,
  schoolName = "",
  hasSchool = false,
  saveSchool,
  message
}) {
  const [newStudentName, setNewStudentName] = useState("");
  const [editingSchool, setEditingSchool] = useState(false);
  const [schoolDraft, setSchoolDraft] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingSequence, setEditingSequence] = useState("");
  const loadStudentsRef = useRef(loadStudents);
  const loadClassDashboardRef = useRef(loadClassDashboard);
  const selectedClass = classList.find(row => row.id === selectedClassId) || null;
  const dashboardById = useMemo(
    () => new Map(classDashboard.map(row => [row.id, row])),
    [classDashboard]
  );
  const studentRows = useMemo(
    () => studentList.map(student => {
      const dashboardRow = dashboardById.get(student.id) || {};
      return {
        ...student,
        answered: dashboardRow.answered ?? 0,
        accuracy: dashboardRow.accuracy ?? null,
        masteredCount: dashboardRow.masteredCount ?? 0,
        currentSkill: dashboardRow.currentSkill || "Not started",
        lastActive: dashboardRow.lastActive || student.lastActive || student.updated_at || student.created_at || null
      };
    }),
    [dashboardById, studentList]
  );

  useEffect(() => {
    loadStudentsRef.current = loadStudents;
    loadClassDashboardRef.current = loadClassDashboard;
  }, [loadStudents, loadClassDashboard]);

  useEffect(() => {
    if (!selectedClassId) return;
    loadStudentsRef.current?.(selectedClassId);
    loadClassDashboardRef.current?.(selectedClassId);
  }, [selectedClassId]);

  function handleClassChange(event) {
    const nextClassId = event.target.value || null;
    setSelectedClassId?.(nextClassId);
    setStudentList?.([]);
  }

  async function handleCreateStudent() {
    const clean = newStudentName.trim();
    if (!clean) return;
    await createStudent?.(clean);
    setNewStudentName("");
  }

  function printLoginCards() {
    const printableRows = studentRows
      .map(row => {
        const password = row.symbol_password
          ? row.symbol_password.split("").map(digit => `picture ${digit}`).join(" - ")
          : "Not set yet";
        return `${selectedClass?.name || "Class"} | ${row.name} | ${password}`;
      })
      .join("\n");
    const win = window.open("", "student-login-cards", "width=900,height=700");
    if (!win) return;
    win.document.write(`
      <html><head><title>Login Cards</title><style>
        body{font-family:Arial,sans-serif;padding:24px}
        pre{white-space:pre-wrap;font-size:18px;line-height:1.7}
      </style></head><body>
      <h1>${selectedClass?.name || "Class"} Login Cards</h1>
      <pre>${printableRows}</pre>
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  return (
    <div className="teacher-product-page teacher-dashboard-page">
      <section className="teacher-page-header">
        <div>
          <p className="panel-label">Dashboard</p>
          <h2>Class Roster</h2>
          <p>Select a class to see students, current skill level, and recent activity.</p>
        </div>
      </section>

      {message && <p className="message teacher-dashboard-message">{message}</p>}

      <section className="teacher-dashboard-controls" aria-label="Class controls">
        <label className="teacher-dashboard-control">
          <span>Class</span>
          <select value={selectedClassId || ""} onChange={handleClassChange}>
            <option value="">Choose class</option>
            {classList.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </label>

        <div className="teacher-dashboard-create">
          <label className="teacher-dashboard-control">
            <span>New class</span>
            <input
              autoComplete="off"
              value={newClassName}
              placeholder="Enter class name"
              onChange={event => setNewClassName?.(event.target.value)}
              onKeyDown={event => {
                if (event.key === "Enter") createClass?.();
              }}
            />
          </label>
          <button className="lp-button lp-button-primary" onClick={createClass} type="button">
            Create Class
          </button>
        </div>

        {saveSchool && (
          <div className="teacher-dashboard-school">
            {!editingSchool ? (
              <p className={hasSchool ? "teacher-school-summary" : "teacher-school-summary teacher-school-missing"}>
                {hasSchool
                  ? <>School: <strong>{schoolName || "..."}</strong></>
                  : "No school set yet - students need a school to use child login."}
                <button
                  className="text-button"
                  onClick={() => {
                    setSchoolDraft(schoolName || "");
                    setEditingSchool(true);
                  }}
                  type="button"
                >
                  {hasSchool ? "Change" : "Set school"}
                </button>
              </p>
            ) : (
              <div className="teacher-dashboard-create teacher-school-edit">
                <label className="teacher-dashboard-control">
                  <span>School</span>
                  <input
                    autoComplete="organization"
                    value={schoolDraft}
                    placeholder="Enter school name"
                    onChange={event => setSchoolDraft(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === "Enter" && schoolDraft.trim()) {
                        saveSchool(schoolDraft);
                        setEditingSchool(false);
                      }
                    }}
                  />
                </label>
                <button
                  className="lp-button lp-button-primary"
                  disabled={!schoolDraft.trim()}
                  onClick={() => {
                    saveSchool(schoolDraft);
                    setEditingSchool(false);
                  }}
                  type="button"
                >
                  Save School
                </button>
                <button className="lp-button lp-button-secondary" onClick={() => setEditingSchool(false)} type="button">
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="teacher-dashboard-roster" aria-label="Students">
        <div className="teacher-panel-header">
          <div>
            <h3>Students{selectedClass ? ` - ${selectedClass.name}` : ""}</h3>
            <p>
              {selectedClass
                ? `${studentRows.length} student${studentRows.length === 1 ? "" : "s"} in this class.`
                : "Choose a class to load students."}
            </p>
          </div>
        </div>

        {selectedClass && (
          <div className="teacher-dashboard-create student-create">
            <label className="teacher-dashboard-control">
              <span>New student</span>
              <input
                autoComplete="off"
                value={newStudentName}
                placeholder="Enter student name"
                onChange={event => setNewStudentName(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Enter") handleCreateStudent();
                }}
              />
            </label>
            <button className="lp-button lp-button-secondary" onClick={handleCreateStudent} type="button">
              Create Student
            </button>
            <button className="lp-button lp-button-secondary" onClick={printLoginCards} type="button">
              Print login cards
            </button>
            <button className="lp-button lp-button-primary" onClick={startStudentLogin} type="button">
              Student login
            </button>
          </div>
        )}

        {!selectedClass ? (
          <div className="report-empty-state">
            <strong>No class selected.</strong>
            <p>Select or create a class to see the student roster.</p>
          </div>
        ) : loadingStudents ? (
          <p className="muted-text">Loading students...</p>
        ) : studentRows.length === 0 ? (
          <div className="report-empty-state">
            <strong>No students yet.</strong>
            <p>Create the first student for this class.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="dashboard-table teacher-roster-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Current Skill</th>
                  <th>Progress</th>
                  <th>Login</th>
                  <th>Last Active</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {studentRows.map(row => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.currentSkill}</td>
                    <td>
                      {row.answered
                        ? `${row.masteredCount}/${skillTree.length} mastered - ${row.accuracy}% accuracy`
                        : "Not started"}
                    </td>
                    <td>
                      <div className="teacher-login-cell">
                        <SymbolSequence sequence={row.symbol_password || ""} hidden={!visiblePasswords[row.id]} size={20} />
                        <div className="teacher-login-actions">
                          <button className="text-button" onClick={() => setVisiblePasswords(previous => ({ ...previous, [row.id]: !previous[row.id] }))} type="button">
                            {visiblePasswords[row.id] ? "Hide" : "Show"}
                          </button>
                          <button className="text-button" onClick={() => {
                            setEditingStudent(row);
                            setEditingSequence("");
                          }} type="button">
                            Change
                          </button>
                          <button className="text-button" onClick={() => resetStudentSymbolPassword?.(row.id, row.name)} type="button">
                            Reset
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>{formatLastActive(row.lastActive)}</td>
                    <td>
                      <button className="lp-button lp-button-secondary" onClick={() => onLoadStudent?.(row.id, row.name)} type="button">
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {editingStudent && (
        <div className="symbol-password-modal" role="dialog" aria-modal="true" aria-label={`Change password for ${editingStudent.name}`}>
          <div className="symbol-password-modal-card">
            <h3>Change {editingStudent.name}'s pictures</h3>
            <p className="muted-text">This child gate is teacher-visible by design; real data protection remains in the signed-in teacher account.</p>
            <SymbolPasswordPad
              value={editingSequence}
              onChange={setEditingSequence}
              onComplete={async sequence => {
                await updateStudentSymbolPassword?.(editingStudent.id, sequence, editingStudent.name);
                setEditingStudent(null);
                setEditingSequence("");
              }}
            />
            <button className="report-button" onClick={() => setEditingStudent(null)} type="button">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
