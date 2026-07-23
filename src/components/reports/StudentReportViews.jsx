import { useState } from "react";
import { ReportSkeleton, ReportState } from "./StudentReportShell.jsx";
import { reportStatusLabel } from "./studentReportUiUtils.js";
import { MetricFigure } from "../MetricDefinition.jsx";

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

function evidenceSourceLabel(row = {}) {
  return row.sourceLabel || row.source || row.sourceArea || row.area || row.assessmentName || "Saved evidence";
}

function EvidenceDisclosure({ evidence = [], itemLabel = "item" }) {
  const rows = asArray(evidence);
  if (!rows.length) return null;
  return (
    <details className="lg-report-evidence-disclosure">
      <summary>View evidence ({rows.length})</summary>
      <div className="lg-report-evidence-list">
        {rows.map((row, index) => (
          <article key={row.evidenceId || row.id || `${evidenceSourceLabel(row)}-${index}`}>
            <div>
              <strong>{evidenceSourceLabel(row)}</strong>
              <span>{formatEvidenceDate(row.observedAt || row.occurredAt || row.date || row.completedAt)}</span>
            </div>
            <p>{row.detail || row.interpretation || row.outcomeLabel || row.details?.sourceResult || String(row.outcome || "").replace(/_/g, " ") || `Evidence recorded for ${itemLabel}.`}</p>
          </article>
        ))}
      </div>
    </details>
  );
}

function normalizeDomains(report = {}) {
  if (Array.isArray(report.byDomain)) {
    return report.byDomain.map(domain => ({ ...domain, items: domain.items || domain.concepts || [] }));
  }
  if (Array.isArray(report.domains)) return report.domains;
  if (report.domains && typeof report.domains === "object") {
    return Object.entries(report.domains).map(([id, value]) => ({ id, ...(value || {}) }));
  }
  if (Array.isArray(report.items)) {
    const grouped = new Map();
    report.items.forEach(item => {
      const key = item.domain || item.domainLabel || "Literacy evidence";
      const row = grouped.get(key) || { id: key, label: key, items: [] };
      row.items.push(item);
      grouped.set(key, row);
    });
    return [...grouped.values()];
  }
  return [];
}

export function WholeChildReportView({ report = {} }) {
  const domains = normalizeDomains(report).filter(domain => asArray(domain.items || domain.rows).length);
  const descriptiveAssessments = asArray(report.descriptiveAssessments);
  const statusCounts = report.statusCounts || report.summary?.statusCounts || report.summary || {};
  const totalEvidence = descriptiveAssessments.length + domains.reduce((sum, domain) => sum + asArray(domain.items || domain.rows).length, 0);
  const metrics = report.metrics || [
    { label: "Secure knowledge", value: statusCounts.secure ?? report.secureCount ?? 0 },
    { label: "Developing", value: statusCounts.developing ?? report.developingCount ?? 0 },
    { label: "Needs teaching", value: statusCounts.needsTeaching ?? statusCounts.needs_teaching ?? report.needsTeachingCount ?? 0 }
  ];
  const nextSteps = asArray(report.nextSteps || report.priorities || report.recommendations);
  if (!nextSteps.length) {
    nextSteps.push(
      ...asArray(report.groups?.needsTeaching).map(item => ({
        id: item.conceptId,
        label: item.label,
        detail: item.explanation
      })),
      ...asArray(report.groups?.mixedEvidence).map(item => ({
        id: item.conceptId,
        label: item.label,
        detail: item.explanation
      })),
      ...asArray(report.groups?.developing).map(item => ({
        id: item.conceptId,
        label: item.label,
        detail: item.explanation
      }))
    );
  }

  if (!totalEvidence) {
    return (
      <ReportState title="No learning evidence yet">
        <p>Complete an assessment, Skills Check or Guided Reading record to begin this report.</p>
      </ReportState>
    );
  }

  return (
    <div className="lg-report-view-stack">
      <ReportMetricStrip metrics={metrics} />

      {nextSteps.length > 0 && (
        <ReportSection
          description="The clearest teaching priorities from the latest direct evidence."
          title="Next teaching priorities"
        >
          <ol className="lg-report-priority-list">
            {nextSteps.slice(0, 3).map((step, index) => (
              <li key={step.id || step.label || String(step)}>
                <span>{index + 1}</span>
                <div>
                  <strong>{step.label || step.title || String(step)}</strong>
                  {(step.detail || step.reason || step.teachingNote) && <p>{step.detail || step.reason || step.teachingNote}</p>}
                </div>
              </li>
            ))}
          </ol>
        </ReportSection>
      )}

      {descriptiveAssessments.length > 0 && (
        <ReportSection
          description="Formal evidence from EL Assessments 3-6 is shown here without inventing a mastery cut score. These results are not included in the Secure, Developing or Needs teaching totals above."
          title="Descriptive EL assessment evidence"
        >
          <div className="lg-report-assessment-grid">
            {descriptiveAssessments.map(assessment => (
              <article className="lg-report-assessment-card" key={assessment.assessmentId}>
                <div>
                  <span>Formal descriptive assessment</span>
                  <h3>{assessment.title || assessment.label}</h3>
                </div>
                <strong>{assessment.resultLabel || "Evidence recorded"}</strong>
                <p>{assessment.interpretation || "Descriptive evidence is available in the EL Assessments report."}</p>
                {assessment.latestAt && <small>Latest: {formatEvidenceDate(assessment.latestAt)}</small>}
              </article>
            ))}
          </div>
        </ReportSection>
      )}

      <ReportSection
        description="Each item appears once. Open the evidence trail to see where the judgment came from."
        title="Knowledge by literacy area"
      >
        <div className="lg-report-domain-stack">
          {domains.map((domain, domainIndex) => {
            const items = asArray(domain.items || domain.rows);
            const domainLabel = domain.domainLabel || domain.label || domain.title || domain.domain || domain.id || "Literacy evidence";
            return (
              <section className="lg-report-domain" key={domain.id || domain.domain || domainLabel || domainIndex}>
                <div className="lg-report-domain-heading">
                  <h3>{domainLabel}</h3>
                  <span>{items.length} item{items.length === 1 ? "" : "s"}</span>
                </div>
                <div className="lg-report-knowledge-list">
                  {items.map((item, index) => (
                    <article key={`${item.itemId || item.id || item.conceptId || item.key || "concept"}-${index}`}>
                      <div className="lg-report-knowledge-summary">
                        <div>
                          <strong>{item.label || item.itemLabel || item.name || item.key}</strong>
                          {(item.detail || item.interpretation || item.explanation) && <p>{item.detail || item.interpretation || item.explanation}</p>}
                        </div>
                        <ReportStatus value={item.statusLabel || item.status} />
                      </div>
                      <EvidenceDisclosure evidence={item.evidence || item.decisiveEvidence || item.provenance} itemLabel={item.label} />
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </ReportSection>
    </div>
  );
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
  const inProgress = books.filter(book => !book.completed && (book.pagesRead || book.completedPages || book.readCount)).length;
  const rereads = books.reduce((sum, book) => sum + Math.max(0, Number(book.readCount || 0) - (book.completed ? 1 : 0)), 0);
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
        { label: "Books in progress", value: inProgress },
        { label: "Rereads", value: rereads }
      ]} />

      <ReportSection description="Every saved book is included. Open a book for words, quiz evidence and notes." title="Books">
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
                  <div><dt>Comprehension check</dt><dd>{book.quizTotal ? `${book.quizScore}/${book.quizTotal}` : "Not recorded"}</dd></div>
                </dl>
                {asArray(book.correctWords).length > 0 && (
                  <div><h4>Read correctly in this book</h4><p>{book.correctWords.join(", ")}</p></div>
                )}
                {asArray(book.supportWords).length > 0 && (
                  <div><h4>Needed support in this book</h4><p>{book.supportWords.join(", ")}</p></div>
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

function normalizeSkills(report = {}) {
  return asArray(report.skills || report.rows || report.skillRows);
}

export function SkillsCheckReportView({ report = {} }) {
  const skills = normalizeSkills(report);
  const [requestedId, setRequestedId] = useState("");
  const selectedId = skills.some(skill => (skill.skillId || skill.id) === requestedId)
    ? requestedId
    : skills[0]?.skillId || skills[0]?.id || "";

  const selected = skills.find(skill => (skill.skillId || skill.id) === selectedId) || skills[0];
  const assessed = skills.filter(skill => Number(skill.attemptCount ?? asArray(skill.attempts).length) > 0);
  const secure = skills.filter(skill => reportStatusLabel(skill.statusLabel || skill.status) === "Secure");
  const support = skills.filter(skill => reportStatusLabel(skill.statusLabel || skill.status) === "Needs teaching");

  if (!skills.length) {
    return (
      <ReportState title="No Skills Check results yet">
        <p>Complete a Skills Check checkpoint to begin this report.</p>
      </ReportState>
    );
  }

  const history = asArray(selected?.history || selected?.checkpointHistory || selected?.attemptsHistory || selected?.attempts);
  const latestCorrect = selected?.latestCorrectCount ?? selected?.correctCount;
  const latestTotal = selected?.latestTotalQuestions ?? selected?.totalQuestions;
  const latestAccuracy = selected?.latestAccuracy ?? selected?.currentAccuracy ?? selected?.accuracy;
  const itemGroups = selected?.itemGroups || {};
  const selectedAttemptIds = new Set(history.map(row => row.attemptId).filter(Boolean));
  const items = [
    ...asArray(itemGroups.mastered).map(item => ({ ...item, displayStatus: "Secure" })),
    ...asArray(itemGroups.developing).map(item => ({ ...item, displayStatus: "Developing" })),
    ...asArray(itemGroups.needsSupport || itemGroups.needs_support).map(item => ({ ...item, displayStatus: "Needs teaching" })),
    ...asArray(selected?.items),
    ...asArray(report.items).filter(item => {
      const ids = asArray(item.provenance?.attemptIds || item.provenance?.sourceRecordIds);
      return ids.some(id => selectedAttemptIds.has(id)) || selectedAttemptIds.has(item.sourceRecordId);
    })
  ];

  return (
    <div className="lg-report-view-stack">
      <ReportMetricStrip metrics={[
        { label: "Skills checked", value: assessed.length },
        { label: "Secure", value: secure.length },
        { label: "Needs teaching", value: support.length }
      ]} />

      <div className="lg-report-skill-layout">
        <ReportSection description="Choose one checkpoint to see its latest result and history." title="Skills">
          <div className="lg-report-skill-list">
            {skills.map(skill => {
              const id = skill.skillId || skill.id;
              return (
                <button
                  aria-pressed={id === (selected?.skillId || selected?.id)}
                  key={id || skill.label}
                  onClick={() => setRequestedId(id)}
                  type="button"
                >
                  <span><strong>{skill.label || skill.skillName || "Skill"}</strong><small>{skill.latestDate ? formatEvidenceDate(skill.latestDate) : "Not checked"}</small></span>
                  <ReportStatus value={skill.currentStatus || skill.statusLabel || skill.status} />
                </button>
              );
            })}
          </div>
        </ReportSection>

        <ReportSection description="Latest checkpoint result, followed by earlier attempts and item evidence." title={selected?.label || selected?.skillName || "Selected skill"}>
          <div className="lg-report-selected-skill">
            <div className="lg-report-selected-skill-summary">
              <ReportStatus value={selected?.currentStatus || selected?.statusLabel || selected?.status} />
              <strong>{latestTotal != null && Number(latestTotal) > 0 ? `${latestCorrect ?? 0}/${latestTotal}` : "No scored checkpoint"}</strong>
              {latestAccuracy != null && Number.isFinite(Number(latestAccuracy)) && (
                <MetricFigure
                  dateRange="The latest completed checkpoint administration for this skill."
                  denominator={`${latestTotal || 0} administered scored question${Number(latestTotal) === 1 ? "" : "s"} in the latest checkpoint.`}
                  metricId="accuracy"
                  minimumEvidence="At least one administered scored checkpoint question."
                  updatedAt={selected?.latestAt || selected?.latestDate || history[0]?.completedAt || history[0]?.date}
                >
                  {Math.round(Number(latestAccuracy))}% accuracy
                </MetricFigure>
              )}
            </div>
            {history.length > 0 && (
              <details>
                <summary>Attempt history ({history.length})</summary>
                <div className="lg-report-history-list">
                  {history.map((row, index) => (
                    <article key={row.attemptId || `${row.date}-${index}`}>
                      <span>{formatEvidenceDate(row.date || row.completedAt)}</span>
                      <strong>{row.score || (Number(row.totalQuestions || 0) > 0 ? `${row.correctCount || 0}/${row.totalQuestions}` : "Not scored")}</strong>
                      <span>{row.passed === true ? "Passed" : row.passed === false ? "Not passed" : "Not scored"}</span>
                    </article>
                  ))}
                </div>
              </details>
            )}
            {items.length > 0 && (
              <details>
                <summary>Question and item evidence ({items.length})</summary>
                <div className="lg-report-item-list">
                  {items.map((item, index) => (
                    <article key={item.itemId || `${item.itemType}-${item.itemKey}-${index}`}>
                      <strong>{item.label || item.itemLabel || item.itemKey || "Item"}</strong>
                      <ReportStatus value={item.displayStatus || item.statusLabel || item.status} />
                      {(item.correct !== undefined || item.attempts !== undefined) && <span>{item.correct || 0}/{item.attempts || 0} correct</span>}
                    </article>
                  ))}
                </div>
              </details>
            )}
          </div>
        </ReportSection>
      </div>
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
      <ReportState title="No practice evidence yet">
        <p>Sound Seekers, Arcade and Story Quest activity will appear here after the student begins practising.</p>
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
      <p className="lg-report-practice-note">Practice evidence supports teacher judgment but is not a formal assessment result.</p>

      <ReportSection description="Independent sound evidence collected during the trail." title="Sound Seekers">
        {soundGroups.some(([, rows]) => rows.length) ? (
          <div className="lg-report-practice-groups">
            {soundGroups.map(([label, rows]) => (
              <section key={label}>
                <h3>{label}</h3>
                {rows.length ? <div className="lg-report-word-list">{rows.map(row => <span key={row.id || row.label}>{row.label || row.id}</span>)}</div> : <p>None recorded.</p>}
              </section>
            ))}
          </div>
        ) : <p className="lg-report-muted">No independent sound evidence has been recorded.</p>}
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
        <ReportSection description="Games and broad skills practised. Scores and stars are not mastery evidence." title="Arcade">
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
