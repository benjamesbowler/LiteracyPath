import { useEffect, useMemo, useState } from "react";
import {
  deleteQuestionReport,
  loadQuestionReports,
  readLegacyDeviceOnlyQuestionReportCount,
  recordQuestionReportDecision
} from "../../data/questionFlagStore.js";
import {
  buildQuestionReviewNotes,
  questionReportDecisionLabel,
  questionReportTypeLabel
} from "../../data/questionReviewNotes.js";

const REPORTS_PER_PAGE = 12;

function downloadTextFile(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function FlaggedQuestionPreview({ flag }) {
  return (
    <div className="flagged-question-preview">
      <div className="question-line assessment-prompt">
        <h2>{flag.prompt || flag.questionText || "Question text was not recorded"}</h2>
      </div>
      {flag.sentence && <p className="flagged-question-sentence">{flag.sentence}</p>}
      {flag.images?.length > 0 && (
        <div className="flagged-question-images">
          {flag.images.map(image => (
            <figure key={`${flag.id}-${image.path}`}>
              <img src={image.path} alt={image.label || "Reported assessment image"} />
              <figcaption>{image.label}</figcaption>
            </figure>
          ))}
        </div>
      )}
      {flag.answerChoices?.length > 0 && (
        <div className="flagged-question-choices">
          {flag.answerChoices.map(choice => (
            <article
              className={choice.value === flag.correctAnswer || choice.label === flag.correctAnswer ? "correct" : ""}
              key={`${flag.id}-${choice.value || choice.label}`}
            >
              {choice.image && <img src={choice.image} alt={choice.label || choice.value} />}
              <strong>{choice.label || choice.value}</strong>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function QuestionFlagReviewPage({ onBack, supabase = null }) {
  const [flags, setFlags] = useState([]);
  const [filter, setFilter] = useState("open");
  const [search, setSearch] = useState("");
  const [reportPage, setReportPage] = useState(1);
  const [loadState, setLoadState] = useState({ status: "loading", message: "" });
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState({ message: "", tone: "success" });
  const [pendingDeleteId, setPendingDeleteId] = useState("");
  const [legacyDeviceOnlyCount] = useState(readLegacyDeviceOnlyQuestionReportCount);

  async function loadReports() {
    setLoadState({ status: "loading", message: "" });
    try {
      const reports = await loadQuestionReports({ supabase });
      setFlags(reports);
      setLoadState({ status: "complete", message: "" });
    } catch (error) {
      setLoadState({
        status: "error",
        message: error?.message || "Reported questions could not be loaded. Nothing has been treated as missing."
      });
    }
  }

  useEffect(() => {
    let active = true;
    loadQuestionReports({ supabase })
      .then(reports => {
        if (!active) return;
        setFlags(reports);
        setLoadState({ status: "complete", message: "" });
      })
      .catch(error => {
        if (!active) return;
        setLoadState({
          status: "error",
          message: error?.message || "Reported questions could not be loaded. Nothing has been treated as missing."
        });
      });
    return () => {
      active = false;
    };
  }, [supabase]);

  const visibleFlags = useMemo(() => {
    const searchTerm = search.trim().toLocaleLowerCase();
    return flags.filter(flag => {
      const filterMatches = filter === "all"
        || (filter === "image" && flag.flagType === "image")
        || (filter === "question" && flag.flagType === "question")
        || (filter === "open" && flag.status === "open");
      if (!filterMatches) return false;
      if (!searchTerm) return true;
      return [
        flag.prompt,
        flag.questionText,
        flag.questionId,
        flag.skillName,
        flag.skillId,
        flag.targetWord
      ].some(value => String(value || "").toLocaleLowerCase().includes(searchTerm));
    });
  }, [filter, flags, search]);

  const pageCount = Math.max(1, Math.ceil(visibleFlags.length / REPORTS_PER_PAGE));
  const currentPage = Math.min(reportPage, pageCount);
  const pagedFlags = visibleFlags.slice(
    (currentPage - 1) * REPORTS_PER_PAGE,
    currentPage * REPORTS_PER_PAGE
  );

  async function mark(flag, decision) {
    setBusyId(flag.id);
    setNotice({ message: "", tone: "success" });
    try {
      const updated = await recordQuestionReportDecision({
        supabase,
        reportId: flag.id,
        decision,
        notes: questionReportDecisionLabel(decision)
      });
      setFlags(current => current.map(item => item.id === flag.id ? updated : item));
      setNotice({
        message: `Review saved: ${questionReportDecisionLabel(decision)}.`,
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message: error?.message || "The review decision was not saved. The report is still open.",
        tone: "error"
      });
    } finally {
      setBusyId("");
    }
  }

  async function remove(flag) {
    setBusyId(flag.id);
    setNotice({ message: "", tone: "success" });
    try {
      await deleteQuestionReport({ supabase, reportId: flag.id });
      setFlags(current => current.filter(item => item.id !== flag.id));
      setPendingDeleteId("");
      setNotice({
        message: "The report was deleted. The assessment question and image were not changed.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message: error?.message || "The report was not deleted.",
        tone: "error"
      });
    } finally {
      setBusyId("");
    }
  }

  function exportNotes() {
    downloadTextFile(
      "literacy-guide-reported-question-review.md",
      buildQuestionReviewNotes(flags),
      "text/markdown"
    );
  }

  const emptyMessage = flags.length === 0
    ? "No question reports have been sent yet."
    : search.trim()
      ? "No reports match that search."
      : filter === "open"
        ? "There are no open reports."
        : "No reports match this filter.";

  return (
    <main className="admin-dashboard page-stack question-flag-review-page">
      <section className="card page-stack">
        <div className="admin-header">
          <div>
            <h2>Reported questions</h2>
            <p className="muted-text">
              Review reports sent during an assessment and record what needs checking.
              This page does not remove or replace live questions or images.
            </p>
          </div>
          <div className="button-row admin-controls">
            <button className="report-button" onClick={onBack} type="button">Back to admin</button>
            <button
              className="report-button"
              disabled={!flags.some(flag => flag.decision)}
              onClick={exportNotes}
              type="button"
            >
              Download review notes
            </button>
          </div>
        </div>
        {legacyDeviceOnlyCount > 0 && (
          <p className="teacher-surface-warning" role="status">
            {legacyDeviceOnlyCount} older {legacyDeviceOnlyCount === 1 ? "report is" : "reports are"} saved only
            on this device. They were not sent to the school database and are not included below.
          </p>
        )}
        {notice.message && (
          <p
            className={notice.tone === "error" ? "teacher-surface-warning" : "message"}
            role={notice.tone === "error" ? "alert" : "status"}
          >
            {notice.message}
          </p>
        )}
      </section>

      <section className="report-panel page-stack" aria-busy={loadState.status === "loading"}>
        <div
          className="media-qa-status-tabs"
          role="group"
          aria-label="Filter reported questions"
        >
          {[
            ["open", "Open"],
            ["image", "Image reports"],
            ["question", "Question reports"],
            ["all", "All"]
          ].map(([value, label]) => (
            <button
              aria-pressed={filter === value}
              className={filter === value ? "active" : ""}
              key={value}
              onClick={() => {
                setFilter(value);
                setReportPage(1);
              }}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <label className="question-report-search">
          <span>Search reports</span>
          <input
            onChange={event => {
              setSearch(event.target.value);
              setReportPage(1);
            }}
            placeholder="Question, skill or word"
            type="search"
            value={search}
          />
        </label>
        {loadState.status === "loading" ? (
          <p className="muted-text" role="status">Loading reported questions…</p>
        ) : loadState.status === "error" ? (
          <div className="teacher-surface-warning" role="alert">
            <p>{loadState.message}</p>
            <button className="report-button" onClick={loadReports} type="button">Try again</button>
          </div>
        ) : (
          <p className="muted-text">
            Found {visibleFlags.length} of {flags.length} {flags.length === 1 ? "report" : "reports"}.
            {visibleFlags.length > 0 ? ` Showing ${pagedFlags.length} on this page.` : ""}
          </p>
        )}
      </section>

      {loadState.status === "complete" && (
        <section className="question-flag-review-list" aria-label="Reported assessment questions">
          {visibleFlags.length === 0 ? (
            <div className="teacher-chart-empty">{emptyMessage}</div>
          ) : pagedFlags.map(flag => {
            const rowBusy = busyId === flag.id;
            const confirmingDelete = pendingDeleteId === flag.id;
            return (
              <article
                className="question-flag-review-card"
                data-question-report-id={flag.id}
                key={flag.id}
              >
                <header>
                  <span>{questionReportTypeLabel(flag.flagType)}</span>
                  <strong>{flag.skillName || flag.skillId || "Skill not recorded"}</strong>
                  <small>
                    {flag.questionId || "Question reference not recorded"}
                    {flag.createdAt ? ` · ${new Date(flag.createdAt).toLocaleString()}` : ""}
                  </small>
                </header>
                <FlaggedQuestionPreview flag={flag} />
                <p className="message">
                  Review: {questionReportDecisionLabel(flag.decision)}
                </p>
                <div className="button-row">
                  <button
                    className="report-button"
                    disabled={rowBusy}
                    onClick={() => mark(flag, "image_needs_checking")}
                    type="button"
                  >
                    Record image problem
                  </button>
                  <button
                    className="report-button"
                    disabled={rowBusy}
                    onClick={() => mark(flag, "question_needs_checking")}
                    type="button"
                  >
                    Record question problem
                  </button>
                  <button
                    className="report-button"
                    disabled={rowBusy}
                    onClick={() => mark(flag, "no_change_needed")}
                    type="button"
                  >
                    Record no change needed
                  </button>
                </div>
                {confirmingDelete ? (
                  <div className="teacher-surface-warning question-report-delete-confirmation">
                    <p>Delete this report? The assessment question and image will stay unchanged.</p>
                    <div className="button-row">
                      <button
                        className="report-button danger"
                        disabled={rowBusy}
                        onClick={() => remove(flag)}
                        type="button"
                      >
                        Confirm delete report
                      </button>
                      <button
                        className="report-button"
                        disabled={rowBusy}
                        onClick={() => setPendingDeleteId("")}
                        type="button"
                      >
                        Keep report
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="text-button"
                    disabled={rowBusy}
                    onClick={() => setPendingDeleteId(flag.id)}
                    type="button"
                  >
                    Delete report
                  </button>
                )}
              </article>
            );
          })}
          {visibleFlags.length > REPORTS_PER_PAGE && (
            <nav className="question-report-pagination" aria-label="Reported question pages">
              <button
                className="report-button"
                disabled={currentPage === 1}
                onClick={() => setReportPage(page => Math.max(1, page - 1))}
                type="button"
              >
                Previous
              </button>
              <span>Page {currentPage} of {pageCount}</span>
              <button
                className="report-button"
                disabled={currentPage === pageCount}
                onClick={() => setReportPage(page => Math.min(pageCount, page + 1))}
                type="button"
              >
                Next
              </button>
            </nav>
          )}
        </section>
      )}
    </main>
  );
}

export default QuestionFlagReviewPage;
