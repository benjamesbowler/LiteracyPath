import { useId, useMemo } from "react";

import {
  getTeacherPageSlice,
  TEACHER_FUNNEL_STUDENT_PAGE_SIZE
} from "./teacherPagination.js";

function matchingStudents(rows = [], search = "") {
  const query = String(search || "").trim().toLocaleLowerCase();
  return [...rows]
    .filter(row => (
      row?.id
      && (!query || String(row.name || "").toLocaleLowerCase().includes(query))
    ))
    .sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
}

export function TeacherFunnelStudentPicker({
  onChoose,
  onPageChange,
  onSearchChange,
  page = 1,
  resetLabel = "Students in this class",
  rows = [],
  search = "",
  selectedStudentId = ""
}) {
  const statusId = useId();
  const filteredRows = useMemo(
    () => matchingStudents(rows, search),
    [rows, search]
  );
  const pageSlice = getTeacherPageSlice({
    page,
    pageSize: TEACHER_FUNNEL_STUDENT_PAGE_SIZE,
    rows: filteredRows
  });

  return (
    <div
      className="teacher-funnel-student-picker-panel"
      data-page-size={TEACHER_FUNNEL_STUDENT_PAGE_SIZE}
    >
      <label className="teacher-funnel-search">
        <span>Find a student</span>
        <input
          aria-describedby={statusId}
          type="search"
          value={search}
          onChange={event => onSearchChange?.(event.target.value)}
          placeholder="Type a name"
        />
      </label>

      {filteredRows.length ? (
        <>
          <p className="teacher-funnel-student-count" id={statusId} role="status">
            Showing {pageSlice.start + 1}–{pageSlice.start + pageSlice.rows.length} of{" "}
            {filteredRows.length} students
          </p>
          <ul className="teacher-funnel-options" aria-label={resetLabel}>
            {pageSlice.rows.map(row => (
              <li key={row.id}>
                <button
                  aria-pressed={row.id === selectedStudentId}
                  className="teacher-funnel-option"
                  onClick={() => onChoose?.(row)}
                  type="button"
                >
                  <strong>{row.name}</strong>
                </button>
              </li>
            ))}
          </ul>
          {pageSlice.pageCount > 1 && (
            <nav
              className="teacher-funnel-student-pages"
              aria-label="Student choice pages"
            >
              <button
                className="lp-button lp-button-secondary"
                disabled={pageSlice.page === 1}
                onClick={() => onPageChange?.(pageSlice.page - 1)}
                type="button"
              >
                Previous
              </button>
              <span>Page {pageSlice.page} of {pageSlice.pageCount}</span>
              <button
                className="lp-button lp-button-secondary"
                disabled={pageSlice.page === pageSlice.pageCount}
                onClick={() => onPageChange?.(pageSlice.page + 1)}
                type="button"
              >
                Next
              </button>
            </nav>
          )}
        </>
      ) : (
        <p className="teacher-funnel-step-help" id={statusId} role="status">
          No student matches “{search}”. Review the spelling or clear the search.
        </p>
      )}
    </div>
  );
}
