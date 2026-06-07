import { useEffect, useMemo, useState } from "react";
import { skillTree } from "../../skillTree.js";
import {
  MEDIA_QA_REVIEW_STATUSES,
  applyMediaQaDecision,
  mergeMediaQaReviewItems,
  readMediaQaReviewOverrides
} from "../../data/mediaQaReviewStatus.js";

const REVIEW_BATCH_SIZE = 24;
const REVIEW_MODES = {
  individual: "individual",
  multiselect: "multiselect"
};

function statusLabel(status = "") {
  if (status === "approved") return "Approved";
  if (status === "quarantined") return "Quarantined";
  if (status === "pending") return "Pending";
  return String(status || "").replaceAll("_", " ");
}

function areaLabel(area = "") {
  if (area === "guided_reading") return "Guided Reading";
  if (area === "story_quests") return "Story Quests";
  return "Assessment";
}

function csvEscape(value = "") {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function downloadTextFile(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function reviewItemsToCsv(rows = []) {
  const headers = [
    "status",
    "area",
    "skill",
    "question_or_page",
    "target",
    "text",
    "answer_choices",
    "correct_answer",
    "image_path",
    "notes"
  ];
  return [
    headers.join(","),
    ...rows.map(row => [
      row.status,
      areaLabel(row.area),
      row.displaySkillName || row.skillId,
      row.questionId || row.pageId,
      row.targetWord,
      row.text,
      (row.answerChoices || []).join(" | "),
      row.correctAnswer,
      row.imagePath,
      row.notes
    ].map(csvEscape).join(","))
  ].join("\n");
}

function optionValue(item = {}) {
  if (item.area === "guided_reading") return "guided_reading";
  if (item.area === "story_quests") return "story_quests";
  return item.skillId || "assessment";
}

function buildAreaOptions(items = []) {
  const skillOptions = skillTree.map(skill => ({
    value: skill.id,
    label: skill.label,
    sort: `1-${skillTree.findIndex(row => row.id === skill.id)}`
  }));
  const extraOptions = [
    { value: "guided_reading", label: "Guided Reading", sort: "2-guided" },
    { value: "story_quests", label: "Story Quests", sort: "3-story" }
  ].filter(option => items.some(item => optionValue(item) === option.value));
  return [{ value: "all", label: "All areas / skills", sort: "0-all" }, ...skillOptions, ...extraOptions]
    .sort((a, b) => a.sort.localeCompare(b.sort));
}

function reviewQuestionText(row = {}) {
  return row.text || row.question || row.prompt || row.bookTitle || "No question text listed.";
}

function reviewAnswerText(row = {}) {
  if (row.correctAnswer) return row.correctAnswer;
  if (row.targetWord) return row.targetWord;
  if (row.answerChoices?.length > 0) return row.answerChoices.join(", ");
  return "No answer listed.";
}

function canApproveRow(row = {}) {
  return Boolean(row.imagePath) || row.area === "assessment";
}

function canQuarantineRow(row = {}) {
  return Boolean(row.imagePath);
}

export function MediaQaReviewPage({ onBack }) {
  const [baseItems, setBaseItems] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [overrides, setOverrides] = useState(() => readMediaQaReviewOverrides());
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [guidedBookFilter, setGuidedBookFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(REVIEW_BATCH_SIZE);
  const [reviewMode, setReviewMode] = useState(REVIEW_MODES.individual);
  const [selectedReviewIds, setSelectedReviewIds] = useState(() => new Set());
  const rows = useMemo(() => (
    baseItems ? mergeMediaQaReviewItems(baseItems, overrides) : []
  ), [baseItems, overrides]);
  const areaOptions = useMemo(() => buildAreaOptions(rows), [rows]);
  const guidedBookOptions = useMemo(() => Array.from(new Set(
    rows
      .filter(row => row.area === "guided_reading")
      .map(row => row.bookTitle)
      .filter(Boolean)
  )).sort(), [rows]);
  const counts = useMemo(() => rows.reduce((summary, row) => {
    summary.all += 1;
    summary[row.status] = (summary[row.status] || 0) + 1;
    return summary;
  }, { all: 0 }), [rows]);
  const visibleRows = useMemo(() => rows.filter(row => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || [
      row.displaySkillName,
      row.skillId,
      row.questionId,
      row.pageId,
      row.bookTitle,
      row.targetWord,
      row.text,
      row.imagePath
    ].some(value => String(value || "").toLowerCase().includes(q));
    const matchesArea = areaFilter === "all" || optionValue(row) === areaFilter;
    const matchesStatus = statusFilter === "all" || row.status === statusFilter;
    const matchesGuidedBook = areaFilter !== "guided_reading" || guidedBookFilter === "all" || row.bookTitle === guidedBookFilter;
    return matchesSearch && matchesArea && matchesStatus && matchesGuidedBook;
  }), [areaFilter, guidedBookFilter, rows, search, statusFilter]);
  const displayedRows = useMemo(() => visibleRows.slice(0, visibleLimit), [visibleLimit, visibleRows]);
  const selectedRows = useMemo(() => visibleRows.filter(row => selectedReviewIds.has(row.reviewId)), [selectedReviewIds, visibleRows]);
  const selectedApproveCount = selectedRows.filter(canApproveRow).length;
  const selectedQuarantineCount = selectedRows.filter(canQuarantineRow).length;
  const displayedSelectableRows = displayedRows.filter(row => canApproveRow(row) || canQuarantineRow(row));
  const displayedSelectableIds = displayedSelectableRows.map(row => row.reviewId);
  const selectedDisplayedCount = displayedSelectableIds.filter(reviewId => selectedReviewIds.has(reviewId)).length;
  const allDisplayedSelected =
    displayedSelectableIds.length > 0 &&
    selectedDisplayedCount === displayedSelectableIds.length;
  const isLoading = baseItems === null && !loadError;

  useEffect(() => {
    let cancelled = false;
    import("../../data/generated/mediaQaReviewItems.generated.js")
      .then(module => {
        if (!cancelled) setBaseItems(module.mediaQaReviewItems || []);
      })
      .catch(error => {
        if (!cancelled) setLoadError(error?.message || "Unable to load media QA review data.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setVisibleLimit(REVIEW_BATCH_SIZE);
    setSelectedReviewIds(new Set());
  }, [areaFilter, guidedBookFilter, search, statusFilter]);

  function decide(row, status) {
    const next = applyMediaQaDecision(row, status, row.notes || "");
    setOverrides(next);
    setSelectedReviewIds(previous => {
      if (!previous.has(row.reviewId)) return previous;
      const nextIds = new Set(previous);
      nextIds.delete(row.reviewId);
      return nextIds;
    });
  }

  function setMode(mode) {
    setReviewMode(mode);
    setSelectedReviewIds(new Set());
  }

  function toggleSelected(row) {
    setSelectedReviewIds(previous => {
      const next = new Set(previous);
      if (next.has(row.reviewId)) {
        next.delete(row.reviewId);
      } else {
        next.add(row.reviewId);
      }
      return next;
    });
  }

  function toggleDisplayedSelection() {
    setSelectedReviewIds(previous => {
      const next = new Set(previous);
      if (allDisplayedSelected) {
        displayedSelectableIds.forEach(reviewId => next.delete(reviewId));
      } else {
        displayedSelectableIds.forEach(reviewId => next.add(reviewId));
      }
      return next;
    });
  }

  function applyBulkDecision(status) {
    const actionFilter = status === "approved" ? canApproveRow : canQuarantineRow;
    const actionableRows = selectedRows.filter(actionFilter);
    if (!actionableRows.length) return;
    let nextOverrides = overrides;
    for (const row of actionableRows) {
      nextOverrides = applyMediaQaDecision(row, status, row.notes || "");
    }
    setOverrides(nextOverrides);
    setSelectedReviewIds(new Set());
  }

  function exportVisibleCsv() {
    downloadTextFile("literacypath-media-qa-review.csv", reviewItemsToCsv(visibleRows), "text/csv");
  }

  return (
    <main className="admin-dashboard page-stack media-qa-page">
      <section className="card page-stack">
        <div className="admin-header">
          <div>
            <h2>Media QA Review</h2>
            <p className="muted-text">
              Pick a skill, check the image against the exact question or page text, then choose YES or NO.
            </p>
          </div>
          <div className="button-row admin-controls">
            <button className="report-button" onClick={onBack} type="button">Admin Dashboard</button>
            <button className="report-button" disabled={isLoading || visibleRows.length === 0} onClick={exportVisibleCsv} type="button">Export visible CSV</button>
          </div>
        </div>
        <div className="media-qa-rules">
          <span>YES = exact pairing approved</span>
          <span>NO = quarantined from runtime</span>
          <span>No image currently used is OK for HFW</span>
          <span>No file deletion</span>
        </div>
      </section>

      <section className="report-panel page-stack">
        <div className="admin-content-filters">
          <label>
            Select area/skill
            <select value={areaFilter} onChange={event => setAreaFilter(event.target.value)}>
              {areaOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          {areaFilter === "guided_reading" && (
            <label>
              Guided book
              <select value={guidedBookFilter} onChange={event => setGuidedBookFilter(event.target.value)}>
                <option value="all">All guided books</option>
                {guidedBookOptions.map(book => <option key={book} value={book}>{book}</option>)}
              </select>
            </label>
          )}
          <label>
            Status
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
              {MEDIA_QA_REVIEW_STATUSES.map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}
              <option value="all">All</option>
            </select>
          </label>
          <label>
            Search
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="word, question, page, book, path" type="search" />
          </label>
        </div>
        <div className="media-qa-status-tabs" role="tablist" aria-label="Media QA status filters">
          {["pending", "approved", "quarantined", "all"].map(status => (
            <button
              className={statusFilter === status ? "active" : ""}
              key={status}
              onClick={() => setStatusFilter(status)}
              type="button"
            >
              {statusLabel(status)} <span>{counts[status] || 0}</span>
            </button>
          ))}
        </div>
        {isLoading ? (
          <p className="muted-text">Loading review items...</p>
        ) : loadError ? (
          <p className="message">Media QA review data could not load: {loadError}</p>
        ) : (
          <p className="muted-text">Showing {displayedRows.length} of {visibleRows.length} filtered review items.</p>
        )}
        <div className="media-qa-review-mode" role="group" aria-label="Media QA review mode">
          <button
            className={reviewMode === REVIEW_MODES.individual ? "active" : ""}
            onClick={() => setMode(REVIEW_MODES.individual)}
            type="button"
          >
            Individual
          </button>
          <button
            className={reviewMode === REVIEW_MODES.multiselect ? "active" : ""}
            onClick={() => setMode(REVIEW_MODES.multiselect)}
            type="button"
          >
            Multiselect
          </button>
        </div>
        {reviewMode === REVIEW_MODES.multiselect && (
          <div className="media-qa-bulk-review-bar">
            <button
              className="report-button"
              disabled={displayedSelectableIds.length === 0}
              onClick={toggleDisplayedSelection}
              type="button"
            >
              {allDisplayedSelected ? "Clear shown" : "Select shown"}
            </button>
            <span>{selectedRows.length} selected</span>
            <button
              disabled={selectedApproveCount === 0}
              onClick={() => applyBulkDecision("approved")}
              type="button"
            >
              YES selected ({selectedApproveCount})
            </button>
            <button
              disabled={selectedQuarantineCount === 0}
              onClick={() => applyBulkDecision("quarantined")}
              type="button"
            >
              NO selected ({selectedQuarantineCount})
            </button>
          </div>
        )}
      </section>

      <section className="media-qa-grid">
        {displayedRows.map(row => (
          <article
            className={[
              "media-qa-card",
              "media-qa-review-card",
              `status-${row.status}`,
              selectedReviewIds.has(row.reviewId) ? "selected" : ""
            ].filter(Boolean).join(" ")}
            key={row.reviewId}
          >
            {reviewMode === REVIEW_MODES.multiselect && (
              <label className="media-qa-card-select">
                <input
                  checked={selectedReviewIds.has(row.reviewId)}
                  disabled={!canApproveRow(row) && !canQuarantineRow(row)}
                  onChange={() => toggleSelected(row)}
                  type="checkbox"
                />
                <span>Select</span>
              </label>
            )}
            {row.imagePath ? (
              <img alt={row.targetWord || row.text || row.imagePath} src={row.imagePath} />
            ) : (
              <div className="teacher-chart-empty">No image currently used</div>
            )}
            <div className="media-qa-review-content">
              <p className="media-qa-review-line">
                <strong>Question</strong>
                <span>{reviewQuestionText(row)}</span>
              </p>
              <p className="media-qa-review-line">
                <strong>Answer</strong>
                <span>{reviewAnswerText(row)}</span>
              </p>
            </div>
            <div className="media-qa-card-actions">
              {reviewMode === REVIEW_MODES.individual ? (
                <>
                  <button disabled={!canApproveRow(row)} onClick={() => decide(row, "approved")} type="button">
                    YES
                  </button>
                  <button disabled={!canQuarantineRow(row)} onClick={() => decide(row, "quarantined")} type="button">
                    NO
                  </button>
                </>
              ) : (
                <button disabled={!canApproveRow(row) && !canQuarantineRow(row)} onClick={() => toggleSelected(row)} type="button">
                  {selectedReviewIds.has(row.reviewId) ? "Selected" : "Select"}
                </button>
              )}
            </div>
          </article>
        ))}
      </section>
      {!isLoading && !loadError && visibleRows.length > displayedRows.length && (
        <div className="button-row media-qa-load-more-row">
          <button
            className="report-button"
            onClick={() => setVisibleLimit(limit => limit + REVIEW_BATCH_SIZE)}
            type="button"
          >
            Show next {Math.min(REVIEW_BATCH_SIZE, visibleRows.length - displayedRows.length)}
          </button>
        </div>
      )}
    </main>
  );
}

export default MediaQaReviewPage;
