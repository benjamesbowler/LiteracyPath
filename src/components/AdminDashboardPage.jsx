export function AdminDashboardPage({
  flags,
  teachers,
  classes,
  students,
  statusFilter,
  setStatusFilter,
  loading,
  refreshDashboard,
  resolveFlag,
  reopenFlag,
  deleteClass,
  deleteStudent,
  message
}) {
  return (
    <main className="admin-dashboard page-stack">
      <section className="card page-stack">
        <div className="admin-header">
          <div>
            <h2>Admin Dashboard</h2>
            <p className="muted-text">Review flagged questions and manage app data.</p>
          </div>

          <div className="button-row admin-controls">
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
              <option value="open">Open flags</option>
              <option value="resolved">Resolved flags</option>
              <option value="all">All flags</option>
            </select>
            <button className="report-button" onClick={refreshDashboard} disabled={loading} type="button">
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {message && <p className="message">{message}</p>}
      </section>

      <section className="report-panel page-stack admin-section">
        <h3>Flagged Questions</h3>

        {flags.length === 0 ? (
          <p>No flagged questions for this filter.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="dashboard-table admin-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Teacher</th>
                  <th>Class</th>
                  <th>Student</th>
                  <th>Skill</th>
                  <th>Question</th>
                  <th>Choices</th>
                  <th>Correct</th>
                  <th>Issue</th>
                  <th>Note</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {flags.map(flag => (
                  <tr key={flag.id}>
                    <td>{flag.status}</td>
                    <td>{flag.created_at ? new Date(flag.created_at).toLocaleString() : ""}</td>
                    <td>{flag.teacher_email || flag.teacher_id}</td>
                    <td>{flag.class_name}</td>
                    <td>{flag.student_name}</td>
                    <td>
                      <strong>{flag.skill}</strong>
                      <div className="muted-text">{flag.diagnostic_target}</div>
                    </td>
                    <td className="admin-question-cell">{flag.question_text}</td>
                    <td>{Array.isArray(flag.choices) ? flag.choices.join(", ") : ""}</td>
                    <td>{flag.correct_answer}</td>
                    <td>{flag.issue_type}</td>
                    <td>{flag.note}</td>
                    <td>
                      {flag.status === "resolved" ? (
                        <button className="report-button" onClick={() => reopenFlag(flag.id)} type="button">
                          Reopen
                        </button>
                      ) : (
                        <button className="report-button" onClick={() => resolveFlag(flag.id)} type="button">
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card page-stack admin-section">
        <h3>Teachers</h3>
        {teachers.length === 0 ? (
          <p>No teacher data loaded.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="dashboard-table admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>User ID</th>
                  <th>Classes</th>
                  <th>Students</th>
                  <th>Answers</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map(teacher => (
                  <tr key={teacher.id}>
                    <td>{teacher.email}</td>
                    <td>{teacher.id}</td>
                    <td>{teacher.classes}</td>
                    <td>{teacher.students}</td>
                    <td>{teacher.answers}</td>
                    <td>{teacher.flags}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="report-panel page-stack admin-section">
        <h3>Classes</h3>
        <div className="admin-table-wrap">
          <table className="dashboard-table admin-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Teacher</th>
                <th>Students</th>
                <th>Created</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(row => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.teacher_id}</td>
                  <td>{row.studentCount}</td>
                  <td>{row.created_at ? new Date(row.created_at).toLocaleDateString() : ""}</td>
                  <td>
                    <button className="reset-button" onClick={() => deleteClass(row.id, row.name)} type="button">
                      Delete Class
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="report-panel page-stack admin-section">
        <h3>Students</h3>
        <div className="admin-table-wrap">
          <table className="dashboard-table admin-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Teacher</th>
                <th>Created</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {students.map(row => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.className}</td>
                  <td>{row.teacher_id}</td>
                  <td>{row.created_at ? new Date(row.created_at).toLocaleDateString() : ""}</td>
                  <td>
                    <button className="reset-button" onClick={() => deleteStudent(row.id, row.name)} type="button">
                      Delete Student
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
