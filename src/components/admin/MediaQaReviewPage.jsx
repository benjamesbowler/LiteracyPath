import { useMemo, useState } from "react";
import { skillTree } from "../../skillTree.js";
import { mediaQaReviewItems } from "../../data/generated/mediaQaReviewItems.generated.js";
import {
  MEDIA_QA_REVIEW_STATUSES,
  applyMediaQaDecision,
  mergeMediaQaReviewItems,
  readMediaQaReviewOverrides
} from "../../data/mediaQaReviewStatus.js";
import { summarizeMediaQaWorkload } from "../../utils/mediaQaWorkload.js";

function statusLabel(status = "") {
  if (["accepted", "approved", "pending"].includes(status)) return "Accepted / ongoing review";
  if (status === "quarantined") return "Quarantined";
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

export function MediaQaReviewPage({ onBack }) {
  const [overrides, setOverrides] = useState(() => readMediaQaReviewOverrides());
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("accepted");
  const [guidedBookFilter, setGuidedBookFilter] = useState("all");
  const [search, setSearch] = useState("");
  const rows = useMemo(() => mergeMediaQaReviewItems(mediaQaReviewItems, overrides), [overrides]);
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
  const visibleRows = rows.filter(row => {
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
  });
  const visibleWorkload = summarizeMediaQaWorkload(visibleRows);

  function decide(row, status) {
    const next = applyMediaQaDecision(row, status, row.notes || "");
    setOverrides(next);
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
              Content is accepted while human checking continues. Keep accepted items available, or report a defect to quarantine it from runtime immediately.
            </p>
          </div>
          <div className="button-row admin-controls">
            <button className="report-button" onClick={onBack} type="button">Admin Dashboard</button>
            <button className="report-button" onClick={exportVisibleCsv} type="button">Export visible CSV</button>
          </div>
        </div>
        <div className="media-qa-rules">
          <span>KEEP = accepted and available</span>
          <span>REPORT ISSUE = quarantined from runtime</span>
          <span>Human checking is continuous and pass-by-exception</span>
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
          {["accepted", "quarantined", "all"].map(status => (
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
        <p className="muted-text">
          Showing {visibleRows.length} of {rows.length} pairings across {visibleWorkload.uniqueImages} unique images
          {visibleWorkload.textOnlyPairings > 0
            ? `, plus ${visibleWorkload.textOnlyPairings} text-only pairings.`
            : "."}
        </p>
      </section>

      <section className="media-qa-grid">
        {visibleRows.map(row => (
          <article className={`media-qa-card status-${row.status}`} key={row.reviewId}>
            {row.imagePath ? (
              <img alt={row.targetWord || row.text || row.imagePath} src={row.imagePath} />
            ) : (
              <div className="teacher-chart-empty">No image currently used</div>
            )}
            <div>
              <h3>{row.displaySkillName || areaLabel(row.area)}</h3>
              <p>{areaLabel(row.area)}{row.level ? ` · Level ${row.level}` : ""}{row.phase ? ` · Phase ${row.phase}` : ""}</p>
              <span>{statusLabel(row.status)}</span>
              {row.bookTitle && <small><strong>Book:</strong> {row.bookTitle}{row.pageNumber ? ` · Page ${row.pageNumber}` : ""}</small>}
              {(row.questionId || row.pageId) && <small><strong>{row.questionId ? "Question" : "Page"}:</strong> {row.questionId || row.pageId}</small>}
              {row.targetWord && <small><strong>Target:</strong> {row.targetWord}</small>}
              {row.text && <small><strong>Text:</strong> {row.text}</small>}
              {row.answerChoices?.length > 0 && <small><strong>Choices:</strong> {row.answerChoices.join(", ")}</small>}
              {row.correctAnswer && <small><strong>Correct:</strong> {row.correctAnswer}</small>}
              <small><strong>Image path:</strong> {row.imagePath || "none"}</small>
            </div>
            <div className="media-qa-card-actions">
              <button onClick={() => decide(row, "accepted")} type="button">
                KEEP
              </button>
              <button onClick={() => decide(row, "quarantined")} type="button">
                REPORT ISSUE
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default MediaQaReviewPage;
