import { useMemo, useState } from "react";
import {
  clearQuestionFlags,
  deleteQuestionFlag,
  readQuestionFlags,
  updateQuestionFlagAction
} from "../../data/questionFlagStore.js";

function downloadTextFile(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function flagTypeLabel(flagType = "") {
  return flagType === "question" ? "Question flagged" : "Image flagged";
}

function buildReplacementReport(flags = []) {
  const rows = flags.filter(flag => flag.action);
  return [
    "# Question Flag Replacement Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    rows.length ? rows.map(flag => [
      `## ${flag.action === "delete_question_replace" ? "Question replacement" : "Image replacement"}: ${flag.questionId || flag.id}`,
      "",
      `- Skill: ${flag.skillName || flag.skillId || "Unknown"}`,
      `- Flag type: ${flag.flagType}`,
      `- Prompt: ${flag.prompt || flag.questionText || ""}`,
      `- Sentence/context: ${flag.sentence || ""}`,
      `- Target: ${flag.targetWord || ""}`,
      `- Correct answer: ${flag.correctAnswer || ""}`,
      `- Choices: ${(flag.answerChoices || []).map(choice => choice.label || choice.value).filter(Boolean).join(", ") || "none"}`,
      `- Images: ${(flag.images || []).map(image => `${image.label}: ${image.path}`).join(" | ") || "none"}`,
      `- Requested action: ${flag.action}`,
      `- Notes: ${flag.actionNotes || ""}`,
      ""
    ].join("\n")).join("\n") : "No replacement actions have been marked yet.",
    ""
  ].join("\n");
}

function FlaggedQuestionPreview({ flag }) {
  return (
    <div className="flagged-question-preview">
      <div className="question-line assessment-prompt">
        <h2>{flag.prompt || flag.questionText || "Question text missing"}</h2>
      </div>
      {flag.sentence && <p className="flagged-question-sentence">{flag.sentence}</p>}
      {flag.images?.length > 0 && (
        <div className="flagged-question-images">
          {flag.images.map(image => (
            <figure key={`${flag.id}-${image.path}`}>
              <img src={image.path} alt={image.label || "Flagged image"} />
              <figcaption>{image.label}</figcaption>
            </figure>
          ))}
        </div>
      )}
      {flag.answerChoices?.length > 0 && (
        <div className="flagged-question-choices">
          {flag.answerChoices.map(choice => (
            <article className={choice.value === flag.correctAnswer || choice.label === flag.correctAnswer ? "correct" : ""} key={`${flag.id}-${choice.value || choice.label}`}>
              {choice.image && <img src={choice.image} alt={choice.label || choice.value} />}
              <strong>{choice.label || choice.value}</strong>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function QuestionFlagReviewPage({ onBack }) {
  const [flags, setFlags] = useState(() => readQuestionFlags());
  const [filter, setFilter] = useState("open");
  const visibleFlags = useMemo(() => flags.filter(flag => {
    if (filter === "all") return true;
    if (filter === "image") return flag.flagType === "image";
    if (filter === "question") return flag.flagType === "question";
    return !flag.action;
  }), [filter, flags]);

  function mark(flag, action) {
    const notes = action === "delete_question_replace"
      ? "Delete this question from runtime and create a replacement."
      : "Delete this image from runtime and create a replacement.";
    setFlags(updateQuestionFlagAction(flag.id, action, notes));
  }

  function remove(flag) {
    setFlags(deleteQuestionFlag(flag.id));
  }

  function clearAll() {
    setFlags(clearQuestionFlags());
  }

  function exportReport() {
    downloadTextFile("literacypath-question-flag-replacement-report.md", buildReplacementReport(flags), "text/markdown");
  }

  return (
    <main className="admin-dashboard page-stack question-flag-review-page">
      <section className="card page-stack">
        <div className="admin-header">
          <div>
            <h2>Question Flags Review</h2>
            <p className="muted-text">
              Review the exact question context users flagged, then mark image or question replacements for the report.
            </p>
          </div>
          <div className="button-row admin-controls">
            <button className="report-button" onClick={onBack} type="button">Admin Dashboard</button>
            <button className="report-button" disabled={!flags.some(flag => flag.action)} onClick={exportReport} type="button">Export replacement report</button>
            <button className="report-button danger" disabled={flags.length === 0} onClick={clearAll} type="button">Clear all flags</button>
          </div>
        </div>
      </section>

      <section className="report-panel page-stack">
        <div className="media-qa-status-tabs" role="tablist" aria-label="Question flag filters">
          {[
            ["open", "Open"],
            ["image", "Image"],
            ["question", "Question"],
            ["all", "All"]
          ].map(([value, label]) => (
            <button className={filter === value ? "active" : ""} key={value} onClick={() => setFilter(value)} type="button">
              {label}
            </button>
          ))}
        </div>
        <p className="muted-text">Showing {visibleFlags.length} of {flags.length} flagged items.</p>
      </section>

      <section className="question-flag-review-list">
        {visibleFlags.length === 0 ? (
          <div className="teacher-chart-empty">No flagged questions yet.</div>
        ) : visibleFlags.map(flag => (
          <article className="question-flag-review-card" key={flag.id}>
            <header>
              <span>{flagTypeLabel(flag.flagType)}</span>
              <strong>{flag.skillName || flag.skillId || "Unknown skill"}</strong>
              <small>{flag.questionId || "No question ID"} · {flag.createdAt ? new Date(flag.createdAt).toLocaleString() : ""}</small>
            </header>
            <FlaggedQuestionPreview flag={flag} />
            {flag.action && <p className="message">Marked: {flag.action}</p>}
            <div className="button-row">
              <button className="report-button danger" onClick={() => mark(flag, "delete_image_replace")} type="button">
                Delete image + replace
              </button>
              <button className="report-button danger" onClick={() => mark(flag, "delete_question_replace")} type="button">
                Delete question + replace
              </button>
              <button className="report-button" onClick={() => remove(flag)} type="button">
                Remove from review
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default QuestionFlagReviewPage;
