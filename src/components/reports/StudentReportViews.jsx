import { ReportSkeleton, ReportState } from "./StudentReportShell.jsx";
import { reportStatusLabel } from "./studentReportUiUtils.js";
import { MetricFigure } from "../MetricDefinition.jsx";
import { progressPhrase } from "../../copy/teacherCopy.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function cleanStatus(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function statusClass(value = "") {
  return reportStatusLabel(value).toLowerCase().replace(/\s+/g, "-");
}

export function ReportStatus({ value }) {
  const label = reportStatusLabel(value);
  return <span className={`lg-report-status ${statusClass(value)}`}>{label}</span>;
}

export function ReportMetricStrip({ metrics = [] }) {
  const rows = asArray(metrics).filter(metric => metric && metric.label).slice(0, 3);
  if (!rows.length) return null;
  return (
    <section className="lg-report-metrics" aria-label="Report summary">
      {rows.map(metric => (
        <article key={metric.label}>
          <span>{metric.label}</span>
          <strong>
            {metric.definitionId
              ? (
                <MetricFigure
                  metricId={metric.definitionId}
                  {...(metric.definitionOptions || {})}
                >
                  {metric.value ?? "Not checked"}
                </MetricFigure>
              )
              : metric.value ?? "Not checked"}
          </strong>
          {metric.detail && <small>{metric.detail}</small>}
        </article>
      ))}
    </section>
  );
}

export function ReportSection({ children, description, title }) {
  return (
    <section className="lg-report-section">
      <header>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </header>
      {children}
    </section>
  );
}

function formatEvidenceDate(value = "") {
  if (!value) return "Date not recorded";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Date not recorded";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function guidedBooks(report = {}) {
  return asArray(report.books || report.rows || report.bookRows);
}

export function GuidedReadingReportView({ error = "", loading = false, onRetry, report = {} }) {
  if (loading) return <ReportSkeleton rows={5} />;
  if (error) {
    return (
      <ReportState kind="error" onAction={onRetry} title="Guided Reading could not be loaded">
        <p>{error}</p>
      </ReportState>
    );
  }

  const books = guidedBooks(report);
  const completed = books.filter(book => book.completed).length;
  const rereads = books.reduce((sum, book) => sum + Math.max(0, Number(book.readCount || 0) - (book.completed ? 1 : 0)), 0);
  const decodingSupports = books.reduce((sum, book) => sum + asArray(book.supportUseEvents).length, 0);
  const correctWords = asArray(report.correctWords || report.wordsReadCorrectly).slice();
  const supportWords = asArray(report.supportWords || report.wordsNeedingSupport).slice();
  const notes = asArray(report.notes || report.teacherNotes).slice().sort((a, b) => {
    const aTime = new Date(a?.date || a?.occurredAt || 0).getTime() || 0;
    const bTime = new Date(b?.date || b?.occurredAt || 0).getTime() || 0;
    return bTime - aTime;
  });
  if (!correctWords.length && Array.isArray(report.wordRows)) {
    correctWords.push(...report.wordRows.filter(row => /read correctly/i.test(row.statusLabel || "")));
  }
  if (!supportWords.length && Array.isArray(report.wordRows)) {
    supportWords.push(...report.wordRows.filter(row => /needs support/i.test(row.statusLabel || "")));
  }

  const wordKey = row => String(row?.word || row?.label || row || "").trim().toLowerCase();
  const uniqueSupportWords = Array.from(new Map(
    supportWords.filter(wordKey).map(row => [wordKey(row), row])
  ).values());
  const supportWordKeys = new Set(uniqueSupportWords.map(wordKey));
  const uniqueCorrectWords = Array.from(new Map(
    correctWords
      .filter(row => wordKey(row) && !supportWordKeys.has(wordKey(row)))
      .map(row => [wordKey(row), row])
  ).values());

  if (!books.length && !uniqueCorrectWords.length && !uniqueSupportWords.length && !notes.length) {
    return (
      <ReportState title="No Guided Reading records yet">
        <p>Open Guided Reading and save the first book record to begin this report.</p>
      </ReportState>
    );
  }

  return (
    <div className="lg-report-view-stack">
      <ReportMetricStrip metrics={[
        { label: "Books completed", value: completed },
        { label: "Rereads", value: rereads },
        { label: "Decoding supports", value: decodingSupports }
      ]} />

      <ReportSection description="Every saved book is included. Open a book for words, quiz results, and notes." title="Books">
        <div className="lg-report-book-list">
          {books.map((book, index) => (
            <details key={book.bookId || book.id || `${book.title}-${index}`}>
              <summary>
                <span>
                  <strong>{book.title || "Untitled book"}</strong>
                  <small>{book.level ? `Level ${book.level}` : "Level not recorded"}</small>
                </span>
                <span>
                  {book.completed ? "Completed" : "In progress"}
                  {book.readCount > 1 ? `, ${book.readCount} reads` : ""}
                </span>
              </summary>
              <div className="lg-report-book-detail">
                <dl>
                  <div><dt>Last read</dt><dd>{formatEvidenceDate(book.lastReadAt || book.completedAt)}</dd></div>
                  <div><dt>Pages</dt><dd>{book.pagesRead ?? book.completedPages ?? "Not recorded"}</dd></div>
                  <div>
                    <dt>Reading observation</dt>
                    <dd>
                      {book.attempted ? (
                        <MetricFigure
                          dateRange="This saved reading observation."
                          denominator={`${book.attempted} marked word${book.attempted === 1 ? "" : "s"} in this book observation.`}
                          metricId="accuracy"
                          minimumEvidence="At least one word marked read correctly or needing support."
                          updatedAt={book.lastReadAt || book.completedAt}
                        >
                          {book.latestAccuracy ?? book.accuracy ?? 0}% across {book.attempted} marked words
                        </MetricFigure>
                      ) : "No marked words"}
                    </dd>
                  </div>
                  <div><dt>Comprehension check</dt><dd>{book.quizTotal ? progressPhrase(book.quizScore, book.quizTotal) : "Not recorded"}</dd></div>
                </dl>
                {asArray(book.correctWords).length > 0 && (
                  <div><h4>Read correctly in this book</h4><p>{book.correctWords.join(", ")}</p></div>
                )}
                {asArray(book.supportWords).length > 0 && (
                  <div><h4>Needed support in this book</h4><p>{book.supportWords.join(", ")}</p></div>
                )}
                {asArray(book.supportUseEvents).length > 0 && (
                  <div>
                    <h4>Decoding support used</h4>
                    <ul className="lg-report-decoding-support-list">
                      {book.supportUseEvents.map((event, eventIndex) => (
                        <li key={event.eventId || `${event.stage}-${event.word}-${eventIndex}`}>
                          <strong>{event.word}</strong>
                          <span>{event.stageLabel || "Decoding support"}</span>
                          <small>Page {event.pageNumber} · {formatEvidenceDate(event.occurredAt)}</small>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {asArray(book.notes).length > 0 && (
                  <div>
                    <h4>Teacher notes</h4>
                    <ul>{book.notes.map((note, noteIndex) => <li key={`${note.label || "note"}-${noteIndex}`}><strong>{note.label || "Note"}:</strong> {note.note || note.text || String(note)}</li>)}</ul>
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      </ReportSection>

      <div className="lg-report-two-column">
        <ReportSection description="These words were read correctly in connected text. This does not automatically mean mastered in isolation." title="Words read correctly">
          {uniqueCorrectWords.length ? (
            <div className="lg-report-word-list">
              {uniqueCorrectWords.map((row, index) => (
                <span key={row.id || `${row.word || row.label || row}-${index}`}>{row.word || row.label || String(row)}</span>
              ))}
            </div>
          ) : <p className="lg-report-muted">No words have been marked correct yet.</p>}
        </ReportSection>
        <ReportSection description="These words needed teacher support during reading." title="Words needing support">
          {uniqueSupportWords.length ? (
            <div className="lg-report-word-list support">
              {uniqueSupportWords.map((row, index) => (
                <span key={row.id || `${row.word || row.label || row}-${index}`}>{row.word || row.label || String(row)}</span>
              ))}
            </div>
          ) : <p className="lg-report-muted">No support words have been recorded.</p>}
        </ReportSection>
      </div>

      {notes.length > 0 && (
        <ReportSection description="All saved conference notes, newest first." title="Teacher feedback notes">
          <div className="lg-report-note-list">
            {notes.map((note, index) => (
              <article key={note.id || `${note.bookId || "book"}-${index}`}>
                <div><strong>{note.title || note.bookTitle || "Guided Reading"}</strong><span>{formatEvidenceDate(note.date || note.occurredAt)}</span></div>
                <p>{note.note || note.text || String(note)}</p>
              </article>
            ))}
          </div>
        </ReportSection>
      )}
    </div>
  );
}

export function OtherLearningReportView({ report = {} }) {
  const sound = report.soundSeekers || report.sound_seekers || {};
  const arcade = report.arcade || {};
  const stories = report.storyQuests || report.story_quests || {};
  const soundRows = asArray(sound.items || sound.sounds || sound.heat);
  const soundInteractionEvidence = asArray(sound.interactionEvidence);
  const gameRows = asArray(arcade.games || arcade.items);
  const questRows = asArray(stories.quests || stories.stories || stories.items || report.storyQuestRows);
  const soundBucket = row => row.bucket || row.raw?.bucket || row.sourceResult || row.wholeChildStatus;
  const hasEvidence = soundRows.some(row => !["unseen", "not checked"].includes(cleanStatus(soundBucket(row))))
    || soundInteractionEvidence.some(row => !/^no /i.test(String(row.value || "")))
    || gameRows.length
    || questRows.length
    || Number(arcade.gamesPlayed || 0) > 0;

  if (!hasEvidence) {
    return (
      <ReportState title="No practice results yet">
        <p>Sound Seekers, Arcade, and Story Quest activity will appear here after the student begins practising.</p>
      </ReportState>
    );
  }

  const soundGroups = [
    ["Got it", soundRows.filter(row => /got it|got_it|mastered/.test(cleanStatus(soundBucket(row))))],
    ["Almost there", soundRows.filter(row => /almost|developing/.test(cleanStatus(soundBucket(row))))],
    ["Needs reteaching", soundRows.filter(row => /reteach|re teaching|needs teaching|needs support/.test(cleanStatus(soundBucket(row))))]
  ];

  return (
    <div className="lg-report-view-stack">
      <p className="lg-report-practice-note">Practice results support teacher judgment but are not formal check results.</p>

      <ReportSection description="Independent sound results collected during the trail." title="Sound Seekers">
        {soundGroups.some(([, rows]) => rows.length) ? (
          <div className="lg-report-practice-groups">
            {soundGroups.map(([label, rows]) => (
              <section key={label}>
                <h3>{label}</h3>
                {rows.length ? <div className="lg-report-word-list">{rows.map(row => <span key={row.id || row.label}>{row.label || row.id}</span>)}</div> : <p>None recorded.</p>}
              </section>
            ))}
          </div>
        ) : <p className="lg-report-muted">No independent sound results have been recorded.</p>}
        {soundInteractionEvidence.some(row => !/^no /i.test(String(row.value || ""))) && (
          <dl className="lg-report-practice-list">
            {soundInteractionEvidence
              .filter(row => !/^no /i.test(String(row.value || "")))
              .map(row => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
          </dl>
        )}
      </ReportSection>

      <div className="lg-report-two-column">
        <ReportSection description="Games and broad skills practised. Scores and stars do not prove mastery." title="Arcade">
          {gameRows.length ? (
            <div className="lg-report-practice-list">
              {gameRows.map((game, index) => (
                <article key={game.id || game.gameId || index}>
                  <strong>{game.title || game.label || game.name || game.gameId || game.id}</strong>
                  <span>{game.skill || game.detail || `${game.plays || 0} play${Number(game.plays || 0) === 1 ? "" : "s"}`}</span>
                </article>
              ))}
            </div>
          ) : <p className="lg-report-muted">{arcade.gamesPlayed ? `${arcade.gamesPlayed} games played. Detailed skill labels were not recorded.` : "No Arcade practice recorded."}</p>}
        </ReportSection>

        <ReportSection description="Completed quests and vocabulary encountered. Encountered words are not automatically learned." title="Story Quests">
          {questRows.length ? (
            <div className="lg-report-practice-list">
              {questRows.map((quest, index) => (
                <article key={quest.id || quest.questId || index}>
                  <strong>{quest.title || quest.label || quest.questId || "Story Quest"}</strong>
                  <span>{quest.completed || quest.status === "Completed" ? "Completed" : "In progress"}</span>
                  {asArray(quest.words || quest.wordsEncountered).length > 0 && <small>Words encountered: {asArray(quest.words || quest.wordsEncountered).join(", ")}</small>}
                </article>
              ))}
            </div>
          ) : <p className="lg-report-muted">No Story Quest activity recorded.</p>}
        </ReportSection>
      </div>
    </div>
  );
}
