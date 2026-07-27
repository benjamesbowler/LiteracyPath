import { useMemo, useState } from "react";

import { countPhrase } from "../../copy/teacherCopy.js";

const PAGE_SIZE = 12;

function learnerAnswerCount(row = {}) {
  return Math.max(0, Number(
    row.answered
    ?? row.answerCount
    ?? row.totalAnswered
    ?? row.progress?.answered
    ?? 0
  ) || 0);
}

function learnerMasteredCount(row = {}) {
  if (Number.isFinite(Number(row.masteredCount))) return Number(row.masteredCount);
  if (Array.isArray(row.masteredSkills)) return row.masteredSkills.length;
  if (Array.isArray(row.mastered)) return row.mastered.length;
  return 0;
}

function learnerLastActive(row = {}) {
  const value = row.lastActive || row.last_active || row.updatedAt || row.updated_at;
  if (!value) return "No activity yet";
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? `Last active ${date.toLocaleDateString()}`
    : "Activity saved";
}

export function TeacherProgressOverview({
  className = "",
  classList = [],
  selectedClassId = "",
  onSelectClass,
  rows = [],
  selectedLearnerId = "",
  onSelectLearner,
  onClearLearner,
  onOpenReports,
  onOpenClassReport
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const filteredRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return [...rows]
      .filter(row => !query || String(row.name || "").toLocaleLowerCase().includes(query))
      .sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
  }, [rows, search]);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visibleRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  async function openReport(row) {
    await onSelectLearner?.(row.id, row.name);
    onOpenReports?.(row.id, row.name);
  }

  return (
    <div className="teacher-report-picker">
      <section className="teacher-report-picker-controls" aria-label="Choose report student">
        <label>
          <span>Class</span>
          <select
            value={selectedClassId || ""}
            onChange={event => {
              setPage(1);
              setSearch("");
              onSelectClass?.(event.target.value || null);
            }}
          >
            <option value="">Choose a class</option>
            {classList.map(row => (
              <option key={row.id} value={row.id}>{row.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Find a student</span>
          <input
            type="search"
            value={search}
            disabled={!selectedClassId}
            placeholder="Type a display name"
            onChange={event => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <p>
          {selectedClassId
            ? `${className || "Selected class"} · ${countPhrase(rows.length, "student", "students")}`
            : "Choose a class, then open one student's report."}
        </p>
        {onOpenClassReport && (
          <div className="teacher-report-picker-class-report">
            <button
              className="lp-button lp-button-secondary"
              type="button"
              disabled={classList.length === 0}
              onClick={onOpenClassReport}
            >
              Open class report
            </button>
            <small>
              Skill coverage for the whole class, who needs support, and a printable copy.
            </small>
          </div>
        )}
      </section>

      {!selectedClassId ? (
        <section className="teacher-report-picker-empty">
          <h2>Choose a class</h2>
          <p>Reports are always opened for one student at a time.</p>
        </section>
      ) : rows.length === 0 ? (
        <section className="teacher-report-picker-empty">
          <h2>No students in this class yet</h2>
          <p>Add students in the Students section before opening reports.</p>
        </section>
      ) : filteredRows.length === 0 ? (
        <section className="teacher-report-picker-empty">
          <h2>No matching student</h2>
          <p>Try a different display name.</p>
        </section>
      ) : (
        <>
          <section className="teacher-report-picker-list" aria-label="Students">
            {visibleRows.map(row => {
              const answers = learnerAnswerCount(row);
              const mastered = learnerMasteredCount(row);
              const selected = row.id === selectedLearnerId;
              return (
                <article className={selected ? "selected" : ""} key={row.id}>
                  <div className="teacher-report-picker-avatar" aria-hidden="true">
                    {String(row.name || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h2>{row.name}</h2>
                    <p>
                      {answers
                        ? `${countPhrase(answers, "saved answer")} · ${countPhrase(mastered, "mastered skill")}`
                        : "No saved answers yet"}
                    </p>
                    <small>{learnerLastActive(row)}</small>
                  </div>
                  <button
                    className="lp-button lp-button-primary"
                    type="button"
                    onClick={() => openReport(row)}
                  >
                    Open report
                  </button>
                </article>
              );
            })}
          </section>

          {pageCount > 1 && (
            <nav className="teacher-report-picker-pages" aria-label="Student pages">
              <button
                className="lp-button lp-button-secondary"
                type="button"
                disabled={safePage === 1}
                onClick={() => setPage(value => Math.max(1, value - 1))}
              >
                Previous
              </button>
              <span>Page {safePage} of {pageCount}</span>
              <button
                className="lp-button lp-button-secondary"
                type="button"
                disabled={safePage === pageCount}
                onClick={() => setPage(value => Math.min(pageCount, value + 1))}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}

      {selectedLearnerId && (
        <button className="text-button" type="button" onClick={onClearLearner}>
          Clear selected student
        </button>
      )}
    </div>
  );
}
