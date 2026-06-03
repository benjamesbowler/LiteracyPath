import { useEffect, useState } from "react";
import { storyQuests } from "../data/storyQuests.js";
import {
  formatStoryQuestDate,
  loadStoryQuestProgress,
  summarizeStoryQuestProgress
} from "../utils/storyQuestProgress.js";

function formatGuidedReadingDate(value) {
  if (!value) return "Not yet";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not yet";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function getGuidedReadingNoteRows(summary = {}) {
  return [
    summary.wholeBookNote ? { label: "Book", note: summary.wholeBookNote } : null,
    ...(summary.pageNotes || []).map(item => ({
      label: `Page ${item.page}`,
      note: item.note
    }))
  ].filter(item => item?.note?.trim());
}

function buildGuidedReadingReportRows(records = {}, module = {}) {
  const summariesByBook = new Map(
    (module.summarizeGuidedReadingRecords?.(records) || []).map(summary => [summary.bookId, summary])
  );
  const books = module.guidedReadingBooks || [];

  return Object.entries(records || {})
    .map(([bookId, record = {}]) => {
      const book = books.find(item => item.id === bookId) || {};
      const progress = module.getGuidedReadingProgress?.(book, { ...record, bookId }) || {};
      const summary = summariesByBook.get(bookId) || module.summarizeGuidedReadingRecord?.(record) || {};
      const readCount = Math.max(Number(progress.readCount || record.readCount || 0), progress.completed ? 1 : 0);
      const notes = getGuidedReadingNoteRows(summary);
      const latestAccuracy = Number(summary.accuracy || 0);

      return {
        bookId,
        title: book.title || record.title || bookId,
        level: book.level || record.level || progress.level || "",
        type: module.formatGuidedReadingType?.(book.type || record.type || progress.type || "") || book.type || record.type || "",
        lastReadAt: progress.lastReadAt || record.lastReadAt || record.completedAt || record.updatedAt || "",
        readCount,
        rereadCount: Math.max(0, readCount - 1),
        latestAccuracy,
        correctCount: Number(summary.correct || 0),
        supportCount: Number(summary.support || 0),
        attempted: Number(summary.attempted || 0),
        correctWords: summary.correctWords || [],
        supportWords: summary.supportWords || [],
        notes,
        pagesRead: Number(progress.completedPages || record.completedPages || 0),
        totalPages: Number(progress.totalPages || record.totalPages || book.pages?.length || 0),
        trendText: readCount > 1
          ? `${readCount} reads recorded · latest ${latestAccuracy}%`
          : readCount === 1
            ? "First read"
            : "Opened, not completed"
      };
    })
    .filter(row =>
      row.pagesRead > 0 ||
      row.readCount > 0 ||
      row.attempted > 0 ||
      row.correctWords.length > 0 ||
      row.supportWords.length > 0 ||
      row.notes.length > 0
    )
    .sort((a, b) =>
      String(b.lastReadAt).localeCompare(String(a.lastReadAt)) ||
      a.title.localeCompare(b.title)
    );
}

export function FinishedReportPage({
  startAssessment,
  keepPracticingSkill,
  goToOverview,
  studentName,
  totalAnswered,
  accuracy,
  currentStage,
  currentSkillIndex,
  setCurrentSkillIndex,
  setRoundAnswers,
  setCurrentQuestion,
  setFeedback,
  setMessage,
  skillTree,
  currentStageQuestions,
  mastery,
  coverageSnapshot,
  skillMasterySummary = [],
  allowPassageAudio,
  setAllowPassageAudio,
  exportData,
  exportCSVData,
  letterAssessment = [],
  patternAssessment = [],
  exportLetterAssessment,
  exportPatternAssessment,
  guidedReadingRecords = {},
  openGuidedReading,
  storyQuestProgressScopeKey = "default",
  returnToTeacherDashboard
}) {
  const [guidedReadingReportRows, setGuidedReadingReportRows] = useState([]);
  const [storyQuestSummary, setStoryQuestSummary] = useState(() =>
    summarizeStoryQuestProgress(loadStoryQuestProgress(storyQuestProgressScopeKey), storyQuests)
  );

  useEffect(() => {
    if (!Object.keys(guidedReadingRecords || {}).length) {
      setGuidedReadingReportRows([]);
      return undefined;
    }

    let cancelled = false;
    import("../data/guidedReadingBooks").then(module => {
      if (!cancelled) {
        setGuidedReadingReportRows(buildGuidedReadingReportRows(guidedReadingRecords, module));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [guidedReadingRecords]);

  useEffect(() => {
    setStoryQuestSummary(summarizeStoryQuestProgress(
      loadStoryQuestProgress(storyQuestProgressScopeKey),
      storyQuests
    ));
  }, [storyQuestProgressScopeKey]);

  const latestCheckpointIndex = Math.max(
    -1,
    currentSkillIndex - 1,
    ...skillTree
      .map((stage, index) => mastery[stage.id]?.mastered ? index : -1)
      .filter(index => index !== -1)
  );
  const latestCheckpointStage = skillTree[latestCheckpointIndex];
  const latestCheckpointCoverage = latestCheckpointStage
    ? coverageSnapshot?.[latestCheckpointStage.id]
    : null;
  const latestCheckpointIncomplete =
    latestCheckpointCoverage &&
    latestCheckpointCoverage.mastered < latestCheckpointCoverage.total;
  const hasAssessmentData =
    totalAnswered > 0 ||
    skillMasterySummary.some(summary => summary.masteredCount > 0) ||
    Object.values(mastery || {}).some(value => value?.lastTotal || value?.mastered);
  const hasGuidedReadingRecords = Object.keys(guidedReadingRecords || {}).length > 0;

  return (
    <div className="report-panel page-stack">
      <h2>Finished Report</h2>

      <div className="button-row">
        <button className="main-button" onClick={startAssessment}>
          Enter Full Screen Assessment
        </button>

        {returnToTeacherDashboard && (
          <button className="report-button" onClick={returnToTeacherDashboard} type="button">
            Return to Teacher Dashboard
          </button>
        )}

        <button className="report-button" onClick={goToOverview}>
          Student Overview
        </button>
      </div>

      <p><strong>Student:</strong> {studentName || "Unnamed student"}</p>
      <p><strong>Total answered:</strong> {totalAnswered}</p>
      <p><strong>Accuracy:</strong> {accuracy}%</p>
      <p><strong>Current focus:</strong> {currentStage.label}</p>

      {!hasAssessmentData && (
        <section className="report-empty-state">
          <strong>No assessment data yet.</strong>
          <p>Start the first assessment to populate checkpoints, accuracy, and mastered items.</p>
          <button className="main-button" onClick={startAssessment} type="button">
            Start First Assessment
          </button>
        </section>
      )}

      {guidedReadingReportRows.length > 0 && (
        <section className="guided-reading-detail-report">
          <div className="guided-reading-detail-header">
            <div>
              <h3>Guided Reading</h3>
              <p>Locally saved book progress, rereads, word markings, and teacher notes for this student.</p>
            </div>
            <span>{guidedReadingReportRows.length} book{guidedReadingReportRows.length === 1 ? "" : "s"}</span>
          </div>

          <div className="guided-reading-detail-list">
            {guidedReadingReportRows.map(item => (
              <article key={item.bookId}>
                <div className="guided-reading-detail-title">
                  <strong>{item.title}</strong>
                  <span>{[item.level ? `Level ${item.level}` : "", item.type].filter(Boolean).join(" · ") || "Guided Reading"}</span>
                </div>

                <div className="guided-reading-detail-grid">
                  <span>Last read: {formatGuidedReadingDate(item.lastReadAt)}</span>
                  <span>Reads: {item.readCount}</span>
                  <span>Rereads: {item.rereadCount}</span>
                  <span>Latest accuracy: {item.latestAccuracy}%</span>
                  <span>Read correctly: {item.correctCount}</span>
                  <span>Needs support: {item.supportCount}</span>
                  <span>Notes: {item.notes.length}</span>
                  {item.totalPages > 0 && <span>Pages: {item.pagesRead}/{item.totalPages}</span>}
                </div>

                <p className="guided-reading-trend-text">
                  Reread trend: {item.trendText}
                </p>

                {(item.correctWords.length > 0 || item.supportWords.length > 0) && (
                  <div className="guided-reading-word-summary">
                    <span>{item.correctWords.length ? `Read correctly: ${item.correctWords.slice(0, 10).join(", ")}` : "No green words marked"}</span>
                    <span>{item.supportWords.length ? `Support: ${item.supportWords.slice(0, 10).join(", ")}` : "No support words marked"}</span>
                  </div>
                )}

                {item.notes.length > 0 && (
                  <details className="guided-reading-notes-detail">
                    <summary>{item.notes.length} teacher note{item.notes.length === 1 ? "" : "s"}</summary>
                    <div>
                      {item.notes.map(note => (
                        <p key={`${item.bookId}-${note.label}-${note.note}`}>
                          <strong>{note.label}:</strong> {note.note}
                        </p>
                      ))}
                    </div>
                  </details>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {!hasGuidedReadingRecords && openGuidedReading && (
        <section className="report-empty-state">
          <strong>No guided reading records yet.</strong>
          <p>Open Guided Reading to begin saving book progress and conference notes.</p>
          <button className="report-button" onClick={openGuidedReading} type="button">
            Open Guided Reading
          </button>
        </section>
      )}

      <section className="story-quest-report-section">
        <div className="story-quest-report-header">
          <div>
            <h3>Story Quest Adventures</h3>
            <p>Local reading-adventure progress for this student.</p>
          </div>
          <span>Most recent: {formatStoryQuestDate(storyQuestSummary.mostRecentActivityAt)}</span>
        </div>

        {storyQuestSummary.rows.length > 0 ? (
          <>
            <div className="story-quest-report-metrics" aria-label="Story Quest summary">
              <span><strong>{storyQuestSummary.completedCount}</strong> completed</span>
              <span><strong>{storyQuestSummary.inProgressCount}</strong> in progress</span>
              <span><strong>{storyQuestSummary.totalWordsFound}</strong> words found</span>
            </div>
            <div className="story-quest-report-list">
              {storyQuestSummary.rows.map(row => (
                <article key={row.questId}>
                  <div className="story-quest-report-title">
                    <strong>{row.title}</strong>
                    <span>{[row.levelLabel, row.series].filter(Boolean).join(" · ") || "Story Quest"}</span>
                  </div>
                  <div className="story-quest-report-detail">
                    <span>{row.status}</span>
                    <span>Last activity: {formatStoryQuestDate(row.lastActivityAt)}</span>
                    <span>Completed: {formatStoryQuestDate(row.completedAt)}</span>
                    <span>Words: {row.wordCount}/{row.targetWordCount || row.wordCount}</span>
                    {row.visitedPageCount > 0 && <span>Pages visited: {row.visitedPageCount}</span>}
                  </div>
                  {row.words.length > 0 && (
                    <p className="story-quest-report-words">
                      Words found: {row.words.slice(0, 10).join(", ")}
                      {row.words.length > 10 ? "..." : ""}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="report-empty-state compact">
            <strong>No Story Quest progress yet.</strong>
            <p>Open Story Quest Adventures and start a story to build reading-adventure progress.</p>
          </div>
        )}
      </section>

      <label>
        <strong>Set start skill: </strong>
        <select
          value={currentSkillIndex}
          onChange={e => {
            setCurrentSkillIndex(Number(e.target.value));
            setRoundAnswers([]);
            setCurrentQuestion(null);
            setFeedback(null);
            setMessage("Start skill changed.");
          }}
        >
          {skillTree.map((stage, index) => (
            <option key={stage.id} value={index}>
              {index + 1}. {stage.label}
            </option>
          ))}
        </select>
      </label>
      <p><strong>Available questions in this skill:</strong> {currentStageQuestions.length}</p>
      <p><strong>Checkpoint rule:</strong> 9/10 correct to unlock the next skill.</p>

      {latestCheckpointStage && mastery[latestCheckpointStage.id]?.mastered && (
        <section className="checkpoint-complete-panel">
          <div>
            <h3>Checkpoint Passed</h3>
            <p>
              {latestCheckpointIncomplete
                ? "Checkpoint passed. Student may move forward, but this skill is not fully covered yet."
                : "Checkpoint passed and item coverage is complete for the tracked items in this skill."}
            </p>
            {latestCheckpointCoverage && (
              <div className="coverage-card compact">
                <div className="coverage-card-header">
                  <strong>{latestCheckpointStage.label} Coverage</strong>
                  <span>{latestCheckpointCoverage.mastered}/{latestCheckpointCoverage.total} {latestCheckpointCoverage.unit} mastered</span>
                </div>
                <div className="coverage-bar secondary" aria-label={`${latestCheckpointStage.label} coverage progress`}>
                  <span style={{ width: `${latestCheckpointCoverage.total ? Math.round((latestCheckpointCoverage.mastered / latestCheckpointCoverage.total) * 100) : 0}%` }}></span>
                </div>
              </div>
            )}
          </div>

          <div className="button-row">
            <button className="main-button" onClick={() => startAssessment(currentSkillIndex)} type="button">
              Move to Next Skill
            </button>
            <button
              className="report-button"
              onClick={() => keepPracticingSkill(latestCheckpointIndex)}
              type="button"
            >
              Keep Practicing This Skill
            </button>
          </div>
        </section>
      )}

      <h3>Skill Checkpoints and Coverage</h3>

      {skillTree.map((stage, index) => {
        const data = mastery[stage.id];
        const coverage = coverageSnapshot?.[stage.id] || {
          mastered: 0,
          total: 0,
          unit: "items"
        };
        const checkpointPercent = data?.lastTotal
          ? Math.round((data.lastScore / data.lastTotal) * 100)
          : 0;
        const coveragePercent = coverage.total
          ? Math.round((coverage.mastered / coverage.total) * 100)
          : 0;

        return (
          <div className="skill-row" key={stage.id}>
            <span>{index + 1}. {stage.label}</span>
            <span>{data?.mastered ? "Checkpoint Passed" : index === currentSkillIndex ? "Current Checkpoint" : "Locked"}</span>
            <span className="skill-row-progress">
              <span>Checkpoint: {data ? `${data.lastScore}/${data.lastTotal}` : "-"}</span>
              <span className="mini-progress-bar"><span style={{ width: `${checkpointPercent}%` }}></span></span>
            </span>
            <span className="skill-row-progress">
              <span>Coverage: {coverage.mastered}/{coverage.total} {coverage.unit} mastered</span>
              <span className="mini-progress-bar secondary"><span style={{ width: `${coveragePercent}%` }}></span></span>
            </span>
          </div>
        );
      })}

      <section className="mastery-detail-panel">
        <h3>Mastered Words and Items</h3>
        <div className="mastery-detail-list">
          {skillMasterySummary
            .filter(summary => summary.masteredCount > 0)
            .map(summary => (
              <article key={summary.skillId}>
                <strong>{summary.skillName}</strong>
                <span>{summary.displayText}</span>
              </article>
            ))}
          {skillMasterySummary.every(summary => summary.masteredCount === 0) && (
            <p>Item-level word lists will build from new correct answers.</p>
          )}
        </div>
      </section>

      <label className="teacher-toggle">
        <input
          type="checkbox"
          checked={allowPassageAudio}
          onChange={() => setAllowPassageAudio(!allowPassageAudio)}
        />
        Allow passage audio
      </label>

      <div className="button-row export-actions">
        <button className="report-button" onClick={exportData}>
          Export Text Report
        </button>

        <button className="report-button" onClick={exportCSVData}>
          Export Excel CSV
        </button>

        {letterAssessment.length > 0 && (
          <button className="report-button" onClick={exportLetterAssessment} type="button">
            Export Letter Excel
          </button>
        )}

        {patternAssessment.length > 0 && (
          <button className="report-button" onClick={exportPatternAssessment} type="button">
            Export Pattern Excel
          </button>
        )}

        {returnToTeacherDashboard && (
          <button className="report-button" onClick={returnToTeacherDashboard} type="button">
            Return to Teacher Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
