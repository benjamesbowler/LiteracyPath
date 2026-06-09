import { useEffect, useMemo, useRef, useState } from "react";

function formatLastActive(value) {
  if (!value || value === "No activity yet") return "No activity yet";
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
  message
}) {
  const [newStudentName, setNewStudentName] = useState("");
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
        lastActive: dashboardRow.lastActive || student.lastActive || student.updated_at || student.created_at || "No activity yet"
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
    </div>
  );
}
