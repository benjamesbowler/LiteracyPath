import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { SymbolPasswordPad, SymbolSequence } from "./SymbolPasswordPad.jsx";
import { symbolIconByDigit } from "../data/symbolPasswordIcons.js";
import { printPracticePack, packStopIndex, packTargetLabel } from "../utils/worksheets/practicePack.js";
import { classHeatSummary } from "../utils/questReport.js";
import { QUESTION_TYPE_GUIDE } from "../data/questionTypeGuide.js";
import { buildTeacherTodayBriefing } from "../utils/teacherTodayBriefing.js";
import {
  PROGRESS_MIN_RESPONSES,
  buildClassAccuracySummary
} from "../utils/teacherProgressOverview.js";
import {
  LEARNING_EVIDENCE_POLICY,
  LEARNING_STATUS_IDS,
  evaluateLearningConclusion
} from "../policy/learningPolicy.js";
import {
  insertRosterStudents,
  setRosterStudentArchived,
  transferRosterStudent
} from "../data/teacherRosterOperations.js";
import { InterventionLoop } from "./teacher/InterventionLoop.jsx";
import { TeacherActivitySyncHealth } from "./teacher/TeacherActivitySyncHealth.jsx";
import { LearnerDataRightsDialog } from "./teacher/LearnerDataRightsDialog.jsx";
import { TeacherRecommendationExplanation } from "./recommendations/RecommendationExplanation.jsx";
import { ActionFeedback } from "./ActionFeedback.jsx";
import {
  MetricFigure
} from "./MetricDefinition.jsx";
import { TeacherSurfaceState } from "./teacher/ui/TeacherSurfaceState.jsx";
import {
  TeacherChart,
  TeacherDataTable,
  TeacherFilterBar,
  TeacherPageHeader,
  TeacherPageShell
} from "./teacher/ui/TeacherPrimitives.jsx";
import {
  TeacherDrawer,
  TeacherModal
} from "./teacher/ui/TeacherDialog.jsx";
import { metricDefinitionText } from "../utils/metricDefinitions.js";
import {
  LEARNER_ACCESSIBILITY_FIELDS,
  normalizeLearnerAccessibilitySettings
} from "../accessibility/learnerAccessibility.js";
import { supabase } from "../supabaseClient.js";
import { clearLocalElAssessmentDataForStudent } from "../utils/elAssessmentReset.js";
import { clearLocalProgressForStudent } from "../utils/progressSync.js";
import {
  TEACHER_COPY,
  countPhrase,
  progressPhrase
} from "../copy/teacherCopy.js";
import logoUrl from "../assets/logo.svg";

function formatLastActive(value) {
  if (!value) return "No activity yet";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return String(value);

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday - startOfDate) / 86400000);

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function accuracyConclusion(row) {
  if (!row?.learningConclusion) return "Not checked";
  if (!row.learningConclusion.ready) return row.learningConclusion.status.label;
  return `${row.learningConclusion.accuracy}%`;
}

function needsSupportConclusion(row) {
  return row?.learningConclusion?.ready
    && row.learningConclusion.status.id === LEARNING_STATUS_IDS.NEEDS_SUPPORT;
}

function latestMetricUpdate(values = []) {
  return values
    .filter(Boolean)
    .map(value => ({ value, timestamp: new Date(value).getTime() }))
    .filter(row => Number.isFinite(row.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp)
    .at(-1)?.value || "";
}

function getProgressPercent(row, skillTotal) {
  if (!skillTotal) return 0;
  return Math.max(0, Math.min(100, Math.round((row.masteredCount / skillTotal) * 100)));
}

const ROSTER_COLUMN_OPTIONS = [
  { id: "focus", label: "Focus" },
  { id: "progress", label: "Progress" },
  { id: "sound-seekers", label: "Sound Seekers" },
  { id: "login", label: "Sign-in" },
  { id: "last-active", label: "Last active" }
];
const DEFAULT_ROSTER_COLUMNS = ["focus", "progress", "last-active"];

function loadVisibleRosterColumns(teacherId) {
  if (!teacherId || typeof localStorage === "undefined") return DEFAULT_ROSTER_COLUMNS;
  try {
    const saved = JSON.parse(localStorage.getItem(`teacherRosterColumns:${teacherId}`) || "null");
    return Array.isArray(saved)
      ? saved.filter(column => ROSTER_COLUMN_OPTIONS.some(option => option.id === column))
      : DEFAULT_ROSTER_COLUMNS;
  } catch {
    return DEFAULT_ROSTER_COLUMNS;
  }
}

function formatLoginCardPassword(sequence) {
  if (!sequence) return "Not set yet";
  return sequence
    .split("")
    .map(digit => symbolIconByDigit[digit]?.label || `Picture ${digit}`)
    .join(" - ");
}

function parseCsvNames(text = "") {
  const rows = [];
  let cell = "";
  let row = [];
  let quoted = false;
  const source = String(text || "").replace(/^\uFEFF/, "");
  for (let index = 0; index <= source.length; index += 1) {
    const character = source[index] ?? "\n";
    if (character === "\"") {
      if (quoted && source[index + 1] === "\"") {
        cell += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  const names = rows.map(columns => columns[0]).filter(Boolean);
  if (/^(name|display name|learner|student)$/i.test(names[0] || "")) names.shift();
  return names;
}

function LoginCardPrintRoute({
  rows,
  schoolName,
  className,
  classCode,
  onClose
}) {
  const [printFeedback, setPrintFeedback] = useState({
    kind: "success",
    message: `Print preview ready with ${countPhrase(rows.length, "sign-in card")}.`
  });
  const pages = Array.from(
    { length: Math.ceil(rows.length / 4) },
    (_unused, pageIndex) => rows.slice(pageIndex * 4, pageIndex * 4 + 4)
  );

  function printCards() {
    setPrintFeedback({ kind: "pending", message: "Opening the print dialog..." });
    window.requestAnimationFrame(() => {
      try {
        window.print();
        setPrintFeedback({
          kind: "success",
          message: "Print dialog opened. Choose a printer or save as PDF."
        });
      } catch {
        setPrintFeedback({
          kind: "error",
          message: "The print dialog could not be opened. Try again."
        });
      }
    });
  }

  return (
    <section
      className="teacher-login-card-route"
      data-teacher-route="login-cards"
      aria-labelledby="teacher-login-card-route-title"
    >
      <header className="teacher-login-card-route-toolbar">
        <div>
          <p className="panel-label">Print preview</p>
          <h2 id="teacher-login-card-route-title">Sign-in cards</h2>
          <p>
            {schoolName || "School"} · {className || "Class"} · {rows.length} card{rows.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="teacher-login-card-route-actions">
          <button className="lp-button lp-button-secondary" type="button" onClick={onClose}>
            Return to roster
          </button>
          <button className="lp-button lp-button-primary" type="button" onClick={printCards}>
            Print cards
          </button>
        </div>
      </header>
      <ActionFeedback className="teacher-login-card-feedback" feedback={printFeedback} />
      <div className="teacher-login-card-pages" aria-label="Page-sized sign-in card preview">
        {pages.map((pageRows, pageIndex) => (
          <section
            className="teacher-login-card-page"
            aria-label={`Sign-in cards page ${pageIndex + 1} of ${pages.length}`}
            key={`page-${pageRows[0]?.id || pageIndex}`}
          >
            <header className="teacher-login-card-page-header">
              <img src={logoUrl} alt="" />
              <div>
                <p>{schoolName || "School"}</p>
                <h3>{className || "Class"} sign-in cards</h3>
                <span>Class code {classCode || "—"}</span>
              </div>
              <small>Page {pageIndex + 1} of {pages.length}</small>
            </header>
            <div className="teacher-login-card-sheet">
              {pageRows.map(row => (
                <article
                  className="teacher-print-login-card"
                  aria-label={`${row.name} sign-in card`}
                  key={row.id}
                >
                  <img src={logoUrl} alt="" />
                  <p>{schoolName || "School"}</p>
                  <h4>{row.name}</h4>
                  <span>{className || "Class"} · Code {classCode || "—"}</span>
                  <SymbolSequence sequence={row.symbol_password || ""} size={34} />
                  <small>{formatLoginCardPassword(row.symbol_password)}</small>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function RosterMetric({
  definitionId = "",
  definitionOptions = {},
  label,
  value,
  tone = ""
}) {
  return (
    <div className={["teacher-roster-metric", tone].filter(Boolean).join(" ")}>
      <span>{label}</span>
      <strong>
        {definitionId
          ? <MetricFigure metricId={definitionId} {...definitionOptions}>{value}</MetricFigure>
          : value}
      </strong>
    </div>
  );
}

function StudentInitial({ name }) {
  return (
    <span className="teacher-student-initial" aria-hidden="true">
      {String(name || "S").slice(0, 1).toUpperCase()}
    </span>
  );
}

function QuestionTypeGuideDialog({ query, onQueryChange, onClose }) {
  const normalizedQuery = query.trim().toLowerCase();
  const rows = QUESTION_TYPE_GUIDE.filter(row => (
    !normalizedQuery
    || [row.name, row.what, row.skill, row.onMiss]
      .some(value => value.toLowerCase().includes(normalizedQuery))
  ));

  return (
    <TeacherModal
      className="teacher-question-guide-modal"
      label={TEACHER_COPY.help.checkGuide}
      onClose={onClose}
    >
      <section className="symbol-password-modal-card teacher-question-guide-dialog">
        <header>
          <div>
            <p className="panel-label">{TEACHER_COPY.help.checkGuideLabel}</p>
            <h2>{TEACHER_COPY.help.checkGuide}</h2>
            <p>{TEACHER_COPY.help.checkGuideBody}</p>
          </div>
          <button className="text-button" type="button" onClick={onClose}>
            {TEACHER_COPY.help.checkGuideClose}
          </button>
        </header>
        <label className="teacher-question-guide-search">
          <span>Search checks, skills, or teaching guidance</span>
          <input
            data-autofocus
            type="search"
            value={query}
            onChange={event => onQueryChange(event.target.value)}
            placeholder="Try digraphs, blending, or sight words"
          />
        </label>
        <p className="teacher-question-guide-count" role="status">
          {progressPhrase(rows.length, QUESTION_TYPE_GUIDE.length)} checks shown
        </p>
        {rows.length ? (
          <ul
            className="teacher-question-guide-results"
            aria-label="Check explanations"
            tabIndex={0}
          >
            {rows.map(row => (
              <li key={row.id}>
                <article aria-labelledby={`question-guide-${row.id}`}>
                  <header>
                    <h3 id={`question-guide-${row.id}`}>{row.name}</h3>
                    <span>{row.skill}</span>
                  </header>
                  <dl>
                    <div>
                      <dt>What the child does</dt>
                      <dd>{row.what}</dd>
                    </div>
                    <div>
                      <dt>If they miss it</dt>
                      <dd>{row.onMiss}</dd>
                    </div>
                  </dl>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <div className="report-empty-state">
            <strong>No matching check.</strong>
            <p>Try a skill such as rhyme, blending, digraphs, grammar, or sight words.</p>
          </div>
        )}
      </section>
    </TeacherModal>
  );
}

function LearnerAccessibilityDialog({ student, saving = false, onSave, onClose }) {
  const [draft, setDraft] = useState(
    () => normalizeLearnerAccessibilitySettings(student?.accessibilitySettings)
  );

  async function save() {
    const saved = await onSave?.(student, draft);
    if (saved !== false) onClose?.();
  }

  return (
    <TeacherModal
      className="teacher-accessibility-settings-modal"
      label={`Accessibility settings for ${student.name}`}
      onClose={() => {
        if (!saving) onClose?.();
      }}
    >
      <section className="symbol-password-modal-card teacher-accessibility-settings-card">
        <header>
          <div>
            <p className="panel-label">Child access</p>
            <h2>{student.name}&apos;s accessibility settings</h2>
            <p>These choices follow this child across signed-in devices.</p>
          </div>
          <button className="text-button" type="button" disabled={saving} onClick={onClose}>
            Close settings
          </button>
        </header>
        <fieldset className="teacher-accessibility-setting-list">
          <legend>Comfort and response supports</legend>
          {LEARNER_ACCESSIBILITY_FIELDS.map(field => (
            <label key={field.id}>
              <input
                type="checkbox"
                checked={draft[field.id]}
                disabled={saving}
                onChange={event => setDraft(current => ({
                  ...current,
                  [field.id]: event.target.checked
                }))}
              />
              <span>
                <strong>{field.label}</strong>
                <small>{field.description}</small>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="teacher-roster-operation-actions">
          <button
            className="lp-button lp-button-primary"
            type="button"
            disabled={saving}
            onClick={save}
          >
            {saving ? "Saving settings..." : "Save accessibility settings"}
          </button>
          <button
            className="lp-button lp-button-secondary"
            type="button"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </section>
    </TeacherModal>
  );
}

function TeacherSetupChecklist({
  hasClass,
  hasLearners,
  loginsReady,
  firstCheckComplete,
  onContinue,
  onCreateDemo,
  creatingDemo = false
}) {
  const completionById = {
    class: hasClass,
    children: hasLearners,
    "sign-in": loginsReady,
    check: firstCheckComplete
  };
  const steps = TEACHER_COPY.setup.steps.map(step => ({
    ...step,
    complete: completionById[step.id]
  }));
  const completedCount = steps.filter(step => step.complete).length;
  const nextStep = steps.find(step => !step.complete) || null;

  return (
    <section
      className={`teacher-setup-checklist${nextStep ? "" : " is-complete"}`}
      aria-label={TEACHER_COPY.setup.ariaLabel}
      data-setup-complete={nextStep ? "false" : "true"}
      data-teacher-priority="setup-blockers"
    >
      <header>
        <div>
          <p className="panel-label">
            {nextStep ? TEACHER_COPY.setup.firstLabel : TEACHER_COPY.setup.completeLabel}
          </p>
          <h3>
            {nextStep ? TEACHER_COPY.setup.firstTitle : TEACHER_COPY.setup.completeTitle}
          </h3>
          <p>
            {nextStep
              ? TEACHER_COPY.setup.firstBody
              : TEACHER_COPY.setup.completeBody}
          </p>
        </div>
        <div
          className="teacher-setup-progress"
          aria-label={TEACHER_COPY.setup.progressLabel(completedCount, steps.length)}
        >
          <strong>{TEACHER_COPY.setup.progressValue(completedCount, steps.length)}</strong>
          <span>complete</span>
        </div>
      </header>

      <ol>
        {steps.map((step, index) => {
          const current = nextStep?.id === step.id;
          return (
            <li
              className={step.complete ? "is-complete" : current ? "is-current" : ""}
              key={step.id}
              aria-current={current ? "step" : undefined}
            >
              <span className="teacher-setup-step-mark" aria-hidden="true">
                {step.complete ? "✓" : index + 1}
              </span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.description}</p>
              </div>
              <span className="teacher-setup-step-state">
                {step.complete
                  ? TEACHER_COPY.setup.completeState
                  : current
                    ? TEACHER_COPY.setup.nextState
                    : TEACHER_COPY.setup.laterState}
              </span>
            </li>
          );
        })}
      </ol>

      {nextStep && (
        <footer>
          <button className="lp-button lp-button-primary" type="button" onClick={() => onContinue?.(nextStep.id)}>
            Continue: {nextStep.title}
          </button>
          {!hasClass && onCreateDemo && (
            <button
              className="lp-button lp-button-secondary"
              type="button"
              disabled={creatingDemo}
              onClick={onCreateDemo}
            >
              {creatingDemo ? "Creating sample..." : "Explore with a sample class"}
            </button>
          )}
          {!hasClass && (
            <p>
              Sample data is clearly labelled, uses fictional nicknames, and contains no saved check results.
            </p>
          )}
        </footer>
      )}
    </section>
  );
}

function TodayBriefing({
  rows,
  onLoadStudent,
  onPlanIntervention,
  onOpenClasses,
  onOpenAssess,
  onOpenProgress
}) {
  const briefing = useMemo(() => buildTeacherTodayBriefing(rows), [rows]);
  const policy = briefing.policy;

  return (
    <section
      className="teacher-today-briefing"
      aria-label="Today's class briefing"
      data-teacher-priority="today-actions"
    >
      <header className="teacher-today-briefing-head">
        <div>
          <p className="panel-label">Today&apos;s results</p>
          <h3>What needs your attention today</h3>
        </div>
        <p>
          Suggestions use saved answers, never guesses. A child appears after
          {` ${policy.minimumResponsesForAttention} answers when accuracy is below ${policy.attentionAccuracyBelow}%.`}
        </p>
      </header>

      <div className="teacher-today-grid">
        <section className="teacher-today-zone attention" aria-label="Who needs attention">
          <div className="teacher-today-zone-head">
            <span>Who needs attention</span>
            <strong>{briefing.attention.length}</strong>
          </div>
          {briefing.attention.length ? (
            <ul>
              {briefing.attention.slice(0, 4).map(row => (
                <li key={row.id}>
                  <div>
                    <strong>{row.name}</strong>
                    <span>{row.focus}</span>
                    <small>{row.evidence}</small>
                    <small>{row.policyBasis}</small>
                    <TeacherRecommendationExplanation
                      explanation={row.explanation}
                      surface="teacher-today"
                    />
                  </div>
                  <div className="teacher-today-row-actions">
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => onLoadStudent?.(row.id, row.name)}
                    >
                      Review
                    </button>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => onPlanIntervention?.(row)}
                    >
                      Plan support
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="teacher-today-empty">No child needs a review from the results saved so far.</p>
          )}
          {briefing.insufficientEvidenceCount > 0 && (
            <p className="teacher-today-evidence-note">
              {countPhrase(briefing.insufficientEvidenceCount, "child has", "children have")} too few answers for a fair suggestion yet.
            </p>
          )}
        </section>

        <section className="teacher-today-zone due" aria-label="What's due">
          <div className="teacher-today-zone-head">
            <span>What&rsquo;s due</span>
            <strong>{briefing.due.length}</strong>
          </div>
          {briefing.due.length ? (
            <ul>
              {briefing.due.slice(0, 4).map(row => (
                <li key={row.id}>
                  <div>
                    <strong>{row.name}</strong>
                    <span>{row.title}</span>
                    <small>{row.evidence}</small>
                    <TeacherRecommendationExplanation
                      explanation={row.explanation}
                      surface="teacher-today"
                    />
                  </div>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => onLoadStudent?.(row.id, row.name)}
                  >
                    Open {row.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="teacher-today-empty">
              No child is due for a check after {policy.inactivityDueDays} days without activity.
            </p>
          )}
        </section>

        <section className="teacher-today-zone changed" aria-label="What changed">
          <div className="teacher-today-zone-head">
            <span>What changed</span>
            <strong>{briefing.changed.length}</strong>
          </div>
          {briefing.changed.length ? (
            <ul>
              {briefing.changed.slice(0, 4).map(row => (
                <li key={row.id}>
                  <div>
                    <strong>{row.name}</strong>
                    <span>{row.summary}</span>
                    <small>{row.comparison}</small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="teacher-today-empty">
              No new answers or mastered skills in the last {policy.changeWindowDays} days.
            </p>
          )}
        </section>

        <section className="teacher-today-zone actions" aria-label="Direct actions">
          <div className="teacher-today-zone-head">
            <span>Direct actions</span>
          </div>
          <div className="teacher-today-direct-actions">
            <button className="lp-button lp-button-primary" type="button" onClick={onOpenAssess}>
              Start a check
            </button>
            <button className="lp-button lp-button-secondary" type="button" onClick={onOpenProgress}>
              Review progress
            </button>
            <button className="lp-button lp-button-secondary" type="button" onClick={onOpenClasses}>
              Manage this class
            </button>
          </div>
          <p>Each action keeps the current class in context.</p>
        </section>
      </div>
    </section>
  );
}

// THE SOUND HEAT MAP + PRACTICE-ASSIGN.
//
// One tile per grapheme, in the order the trail teaches them, coloured by the
// honest buckets (got it / almost there / needs re-teaching / not met yet) —
// and tappable: pick up to six sounds, press Assign, and that child's Free
// Roam serves exactly those sounds next session (questReviewMode reads the
// assignment out of the phonics_quest payload). This pair of features is the
// mode's whole commercial argument made visible: evidence in, action out.
function QuestHeatPanel({ report, studentName, onAssign, onClear }) {
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [packNote, setPackNote] = useState("");
  const tiles = report?.heat || [];
  const assignment = report?.assignment || null;

  function toggle(id) {
    setSelected(current => current.includes(id)
      ? current.filter(t => t !== id)
      : current.length >= 6 ? current : [...current, id]);
  }

  async function assign() {
    if (!selected.length || busy) return;
    setBusy(true);
    const saved = await onAssign?.(selected);
    setBusy(false);
    if (saved) setSelected([]);
  }

  async function clear() {
    if (busy) return;
    setBusy(true);
    await onClear?.();
    setBusy(false);
  }

  // Print the home practice pack straight from this child's evidence: the
  // sounds the teacher tapped, or the weakest five when nothing is tapped,
  // with every word decodable at the furthest stop the child has reached.
  function printPack() {
    const targets = selected.length ? selected : (report?.weakest || []).map(row => row.target);
    const stop = packStopIndex(report);
    if (!targets.length || !stop) {
      setPackNote("Nothing needs extra practice right now — tap sounds to build a custom pack.");
      return;
    }
    try {
      const result = printPracticePack({ name: studentName, targets, stopIndex: stop });
      if (!result) {
        setPackNote("Please allow pop-ups for this site so the pack can open.");
        return;
      }
      setPackNote(result.skipped.length
        ? `Skipped (too few decodable words yet): ${result.skipped.map(packTargetLabel).join(", ")}`
        : "");
    } catch (error) {
      setPackNote(error.message || "Could not build that pack.");
    }
  }

  if (!tiles.length) return <p className="muted-text">No sound map yet — the trail builds one from the first session.</p>;

  const counts = report?.buckets || {};
  return (
    <div className="quest-heat-panel">
      <div className="quest-heat-head">
        <strong>{studentName}&rsquo;s sounds</strong>
        <span className="quest-heat-legend" aria-hidden="true">
          <em className="is-got-it">Got it {counts.gotIt ?? 0}</em>
          <em className="is-almost">Almost there {counts.almostThere ?? 0}</em>
          <em className="is-reteach">Needs re-teaching {counts.needsReteaching ?? 0}</em>
          <em className="is-unseen">Not met yet</em>
        </span>
      </div>
      <div className="quest-heat-grid" role="group" aria-label={`Sound mastery for ${studentName}. Tap sounds to build a practice assignment.`}>
        {tiles.map(tile => (
          <button
            key={tile.id}
            type="button"
            className={`quest-heat-tile is-${tile.bucket}${selected.includes(tile.id) ? " is-selected" : ""}`}
            title={tile.bucket === "unseen"
              ? `${tile.label} · ${tile.stopName} · not met yet`
              : metricDefinitionText("accuracy", {
                  label: `${tile.label} · ${tile.stopName} accuracy`,
                  denominator: `${tile.seen} scored Sound Seekers response${tile.seen === 1 ? "" : "s"} for this sound.`,
                  dateRange: "All saved Sound Seekers play for this child.",
                  minimumEvidence: "At least one scored answer for this sound.",
                  updatedAt: tile.lastActiveAt || report?.lastActiveAt
                })}
            aria-pressed={selected.includes(tile.id)}
            onClick={() => toggle(tile.id)}
          >
            {tile.label}
          </button>
        ))}
      </div>
      <div className="quest-heat-actions">
        {assignment ? (
          <span className="quest-heat-assigned">
            Assigned: <strong>{assignment.targets.join(", ")}</strong>
            <button className="text-button" type="button" disabled={busy} onClick={clear}>Clear</button>
          </span>
        ) : <span className="muted-text">Tap sounds, then assign them as this child&rsquo;s next practice.</span>}
        <button
          className="lp-button lp-button-secondary"
          type="button"
          disabled={!selected.length || busy}
          onClick={assign}
        >
          {busy ? "Saving..." : selected.length ? `Assign ${selected.length} sound${selected.length === 1 ? "" : "s"}` : "Assign practice"}
        </button>
        <button className="lp-button lp-button-secondary" type="button" onClick={printPack}>
          {selected.length ? `Print pack (${selected.length} sound${selected.length === 1 ? "" : "s"})` : "Print practice pack"}
        </button>
      </div>
      {packNote && <p className="muted-text quest-heat-note" role="status">{packNote}</p>}
    </div>
  );
}

// THE CLASS SOUND MAP (REVIEW.md, Educator #7). One row of tiles for the
// whole class — coloured by how many children still need each sound — plus
// concrete grouping hints: "sh — Sam, Maya, Leo need re-teaching" with a
// one-click group practice sheet printed at the LOWEST member's curriculum
// stop, so every word on it is decodable for every child in the group.
function ClassHeatPanel({ rows }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const summary = useMemo(
    () => classHeatSummary(rows
      .filter(row => row.soundSeekers)
      .map(row => ({ name: row.name, report: row.soundSeekers }))),
    [rows]
  );

  // One child is a heat map (their own panel below); a class view needs two.
  if (summary.studentsWithEvidence < 2) return null;

  function severityClass(tile) {
    if (!tile.met) return "is-unseen";
    if (tile.reteachShare >= 0.5) return "is-reteach";
    if (tile.reteachShare >= 0.25 || tile.almost > tile.gotIt) return "is-almost";
    return "is-got-it";
  }

  function printGroupPack(group) {
    try {
      const result = printPracticePack({
        name: `The ${group.label} group`,
        targets: [group.id],
        stopIndex: group.stopIndex
      });
      setNote(result ? "" : "Please allow pop-ups for this site so the pack can open.");
    } catch (error) {
      setNote(error.message || "Could not build that group pack.");
    }
  }

  const groupSummary = summary.groups.length
    ? `${summary.groups.length} sound${summary.groups.length === 1 ? "" : "s"} could use a small group`
    : "no sound needs a group right now";

  return (
    <div className="quest-heat-panel class-heat-panel">
      <div className="quest-heat-head">
        <strong>Class sound map</strong>
        <span className="muted-text">
          {countPhrase(summary.studentsWithEvidence, "child", "children")} with results · {groupSummary}
        </span>
        <button className="text-button" type="button" aria-expanded={open} onClick={() => setOpen(value => !value)}>
          {open ? "Hide" : "Show"}
        </button>
      </div>
      {open && (
        <>
          <TeacherChart
            className="quest-heat-grid"
            label={`Class sound map. ${summary.groups.length
              ? summary.groups.map(group => `${group.label}: ${countPhrase(group.count, "child", "children")} need re-teaching`).join(". ")
              : "No sound currently needs a re-teaching group."}`}
          >
            {summary.tiles.map(tile => (
              <span
                key={tile.id}
                aria-hidden="true"
                className={`quest-heat-tile ${severityClass(tile)}`}
                title={`${tile.label} · ${tile.stopName} · ${tile.gotIt} got it · ${tile.almost} almost · ${tile.reteach} need re-teaching · ${tile.unseen} not met yet`}
              >
                {tile.label}
              </span>
            ))}
          </TeacherChart>
          {summary.groups.length > 0 && (
            <ul className="class-heat-groups">
              {summary.groups.map(group => (
                <li key={group.id}>
                  <strong>{group.label}</strong> — {group.students.join(", ")}
                  <button className="text-button" type="button" onClick={() => printGroupPack(group)}>
                    Print group pack
                  </button>
                </li>
              ))}
            </ul>
          )}
          {note && <p className="muted-text quest-heat-note" role="status">{note}</p>}
        </>
      )}
    </div>
  );
}

export function TeacherDashboardPage({
  pageIntent = "today",
  classList = [],
  selectedClassId,
  setSelectedClassId,
  setStudentList,
  studentList = [],
  archivedStudentList = [],
  loadingStudents = false,
  loadStudents,
  assignQuestPractice,
  clearQuestPractice,
  setReducedChoiceMode,
  setAccessibilitySettings,
  onLoadStudent,
  selectedStudentId,
  onClearStudent,
  selectedGroupId = "all",
  onSelectGroup,
  onOpenClasses,
  onOpenAssess,
  onOpenProgress,
  createClass,
  createDemoClass,
  newClassName,
  setNewClassName,
  createStudent,
  teacherId,
  classDashboard = [],
  loadClassDashboard,
  skillTree = [],
  updateStudentName,
  updateStudentSymbolPassword,
  resetStudentSymbolPassword,
  startStudentLogin,
  schoolName = "",
  hasSchool = false,
  message,
  surfaceState = "",
  surfaceStateDetail = "",
  onSurfaceStatePrimary,
  onSurfaceStateSecondary,
  activitySyncHealthSeedRows = null
}) {
  const [newStudentName, setNewStudentName] = useState("");
  const [showRosterImport, setShowRosterImport] = useState(false);
  const [rosterImportText, setRosterImportText] = useState("");
  const [rosterImportPreview, setRosterImportPreview] = useState(null);
  const [importingRoster, setImportingRoster] = useState(false);
  const [creatingDemo, setCreatingDemo] = useState(false);
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterSort, setRosterSort] = useState("name");
  const [rosterStatusFilter, setRosterStatusFilter] = useState("all");
  const [visibleRosterColumns, setVisibleRosterColumns] = useState(
    () => loadVisibleRosterColumns(teacherId)
  );
  const [selectedRosterIds, setSelectedRosterIds] = useState([]);
  const [loginCardRows, setLoginCardRows] = useState([]);
  const [rosterOperation, setRosterOperation] = useState(null);
  const [operationTargetClassId, setOperationTargetClassId] = useState("");
  const [operationBusy, setOperationBusy] = useState(false);
  const [rosterOperationStatus, setRosterOperationStatus] = useState("");
  const [rosterFilterIds, setRosterFilterIds] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [actionsStudent, setActionsStudent] = useState(null);
  const [editingStudentProfile, setEditingStudentProfile] = useState(null);
  const [studentNameDraft, setStudentNameDraft] = useState("");
  const [studentProfileError, setStudentProfileError] = useState("");
  const [savingStudentProfile, setSavingStudentProfile] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingSequence, setEditingSequence] = useState("");
  const [heatOpenId, setHeatOpenId] = useState(null);
  const [interventionRecommendation, setInterventionRecommendation] = useState(null);
  const [showQuestionGuide, setShowQuestionGuide] = useState(false);
  const [questionGuideSearch, setQuestionGuideSearch] = useState("");
  const [rosterAdminOpen, setRosterAdminOpen] = useState(() => pageIntent === "classes");
  const [savingChoiceModeIds, setSavingChoiceModeIds] = useState([]);
  const [savingAccessibilityIds, setSavingAccessibilityIds] = useState([]);
  const [accessibilityStudent, setAccessibilityStudent] = useState(null);
  const [dataRightsStudent, setDataRightsStudent] = useState(null);
  const loadStudentsRef = useRef(loadStudents);
  const loadClassDashboardRef = useRef(loadClassDashboard);
  const newClassInputRef = useRef(null);
  const newStudentInputRef = useRef(null);
  function focusNewClassInput() {
    newClassInputRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    newClassInputRef.current?.focus?.();
  }
  function focusNewStudentInput() {
    newStudentInputRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    newStudentInputRef.current?.focus?.();
  }
  function openStudentProfile(student) {
    setActionsStudent(null);
    setEditingStudentProfile(student);
    setStudentNameDraft(student?.name || "");
    setStudentProfileError("");
  }
  async function saveStudentProfile(event) {
    event.preventDefault();
    const cleanName = String(studentNameDraft || "").trim().replace(/\s+/g, " ");
    if (!cleanName) {
      setStudentProfileError("Enter a display name.");
      return;
    }
    if (cleanName.length > 80) {
      setStudentProfileError("Display names must be 80 characters or fewer.");
      return;
    }
    setSavingStudentProfile(true);
    setStudentProfileError("");
    const saved = await updateStudentName?.(editingStudentProfile.id, cleanName);
    setSavingStudentProfile(false);
    if (!saved) {
      setStudentProfileError("We couldn't save this change. Check the message above and try again.");
      return;
    }
    setEditingStudentProfile(null);
    setStudentNameDraft("");
  }
  function openQuestionGuide() {
    setQuestionGuideSearch("");
    setShowQuestionGuide(true);
  }
  async function handleDataRightsDeletion(learner) {
    clearLocalProgressForStudent(learner.id);
    await clearLocalElAssessmentDataForStudent({
      teacherId: learner.teacher_id || teacherId,
      studentId: learner.id,
      studentName: learner.name
    });
    setStudentList?.(previous => previous.filter(row => row.id !== learner.id));
    if (selectedStudentId === learner.id) onClearStudent?.();
    setDataRightsStudent(null);
    setRosterOperationStatus(
      `${learner.name}'s data was deleted. The privacy-safe request reference remains in the audit log.`
    );
    if (selectedClassId) {
      await loadStudentsRef.current?.(selectedClassId);
      await loadClassDashboardRef.current?.(selectedClassId);
    }
  }
  const selectedClass = classList.find(row => row.id === selectedClassId) || null;
  const dashboardById = useMemo(
    () => new Map(classDashboard.map(row => [row.id, row])),
    [classDashboard]
  );
  const studentRows = useMemo(
    () => studentList.map(student => {
      const dashboardRow = dashboardById.get(student.id) || {};
      const normalized = {
        ...student,
        answered: dashboardRow.answered ?? 0,
        correct: dashboardRow.correct ?? null,
        accuracy: dashboardRow.accuracy ?? null,
        masteredCount: dashboardRow.masteredCount ?? 0,
        currentSkill: dashboardRow.currentSkill || "Not started",
        soundSeekers: dashboardRow.soundSeekers || null,
        lastActive: dashboardRow.lastActive || student.lastActive || student.updated_at || student.created_at || null,
        recentAnswers: dashboardRow.recentAnswers ?? 0,
        previousAnswers: dashboardRow.previousAnswers ?? 0,
        recentMastered: dashboardRow.recentMastered ?? 0,
        previousMastered: dashboardRow.previousMastered ?? 0,
        reducedChoiceMode: Boolean(dashboardRow.reducedChoiceMode),
        accessibilitySettings: normalizeLearnerAccessibilitySettings(
          dashboardRow.accessibilitySettings
        )
      };
      normalized.learningConclusion = evaluateLearningConclusion({
        accuracy: normalized.accuracy,
        attempts: normalized.answered,
        skillDiversity: Array.isArray(dashboardRow.evidenceSkills)
          ? dashboardRow.evidenceSkills.length
          : normalized.currentSkill && normalized.currentSkill !== "Not started"
            ? 1
            : 0,
        observedAt: normalized.lastActive
      });
      return normalized;
    }),
    [dashboardById, studentList]
  );
  const rosterGroups = useMemo(() => [
    {
      id: "all",
      label: TEACHER_COPY.groups.everyone,
      studentIds: studentRows.map(row => row.id)
    },
    {
      id: "attention",
      label: TEACHER_COPY.groups.needsHelp,
      studentIds: studentRows
        .filter(needsSupportConclusion)
        .map(row => row.id)
    },
    {
      id: "not-started",
      label: TEACHER_COPY.groups.notStarted,
      studentIds: studentRows.filter(row => row.answered === 0).map(row => row.id)
    },
    {
      id: "active-today",
      label: TEACHER_COPY.groups.playedToday,
      studentIds: studentRows
        .filter(row => formatLastActive(row.lastActive) === "Today")
        .map(row => row.id)
    }
  ], [studentRows]);
  const selectedRosterGroup = rosterGroups.find(group => group.id === selectedGroupId) || rosterGroups[0];
  const selectedStudentRow = studentRows.find(row => row.id === selectedStudentId) || null;
  // ── Action cards: turn roster data into one-click next steps ──────────────
  const actionCards = useMemo(() => {
    const cards = [];

    // Reteach: 2+ students stuck on the same skill with low accuracy.
    const struggling = studentRows.filter(row =>
      needsSupportConclusion(row)
      && row.currentSkill
      && row.currentSkill !== "Not started"
    );
    const bySkill = new Map();
    struggling.forEach(row => {
      bySkill.set(row.currentSkill, [...(bySkill.get(row.currentSkill) || []), row]);
    });
    const reteach = [...bySkill.entries()].filter(([, rows]) => rows.length >= 2).sort((a, b) => b[1].length - a[1].length)[0];
    if (reteach) {
      const reteachNames = `${reteach[1].map(row => row.name).slice(0, 4).join(", ")}${reteach[1].length > 4 ? ` +${reteach[1].length - 4}` : ""}`;
      cards.push({
        id: "reteach",
        tone: "warn",
        title: `Reteach ${reteach[0]}`,
        detail: `${reteachNames} need more practice with ${reteach[0]}.`,
        explanation: {
          evidence: `${reteachNames} have enough saved results to compare, with accuracy below ${LEARNING_EVIDENCE_POLICY.accuracyPercent.developingMinimum}% on ${reteach[0]}.`,
          dependency: `${reteach[0]} is their current recorded focus and should be secured before dependent practice advances.`,
          confidence: `${countPhrase(reteach[1].length, "child", "children")} meet the minimum-results and recency rules; individual results remain available for review.`,
          unlock: "A focused re-teach creates a shared practice target and a clear point for the next check."
        },
        action: "Show group",
        studentIds: reteach[1].map(row => row.id)
      });
    }

    // Nudge: students who haven't started or have gone quiet.
    const inactive = studentRows.filter(row => row.answered === 0 || !row.lastActive || formatLastActive(row.lastActive).includes("days ago"));
    if (inactive.length >= 1 && studentRows.length > 1) {
      const inactiveNames = `${inactive.map(row => row.name).slice(0, 4).join(", ")}${inactive.length > 4 ? ` +${inactive.length - 4}` : ""}`;
      const notStartedCount = inactive.filter(row => row.answered === 0).length;
      cards.push({
        id: "nudge",
        tone: "info",
        title: inactive.some(row => row.answered === 0) ? "Get everyone started" : "Re-engage quiet readers",
        detail: `${inactiveNames} ${inactive.length === 1 ? "has" : "have"} little or no recent practice.`,
        explanation: {
          evidence: `${inactiveNames}: ${notStartedCount} ${notStartedCount === 1 ? "child has" : "children have"} no scored answers; the rest have no recent saved activity.`,
          dependency: "Current practice results are needed before the app can suggest a next teaching step.",
          confidence: "This is an activity-coverage signal only; it does not infer low attainment.",
          unlock: "New answers create enough current results to support a next-skill decision."
        },
        action: "Show children",
        studentIds: inactive.map(row => row.id)
      });
    }

    // Celebrate: the strongest mastery in the class.
    const star = [...studentRows].filter(row => row.masteredCount > 0).sort((a, b) => b.masteredCount - a.masteredCount)[0];
    if (star) {
      cards.push({
        id: "celebrate",
        tone: "good",
        title: `Celebrate ${star.name}`,
        detail: `${star.masteredCount} skill${star.masteredCount === 1 ? "" : "s"} mastered - worth a shout-out today.`,
        explanation: {
          evidence: `${star.name} has ${star.masteredCount} recorded mastered skill${star.masteredCount === 1 ? "" : "s"}, the highest current total in this class.`,
          dependency: "Recognition follows a saved milestone; the private comparison never labels or ranks children publicly.",
          confidence: star.learningConclusion?.ready
            ? `${star.learningConclusion.confidence.label}: ${star.learningConclusion.confidence.detail}.`
            : "The recommendation relies on the mastery record only; no current accuracy conclusion is inferred.",
          unlock: "A private or class-appropriate celebration reinforces secured learning and opens a positive check-in."
        },
        action: "Open profile",
        onClick: () => onLoadStudent?.(star.id, star.name)
      });
    }

    return cards.slice(0, 3);
  }, [studentRows, onLoadStudent]);

  const groupFilterIds = selectedRosterGroup.id === "all" ? null : selectedRosterGroup.studentIds;
  const effectiveRosterFilterIds = rosterFilterIds || groupFilterIds;
  const groupedStudentRows = effectiveRosterFilterIds
    ? studentRows.filter(row => effectiveRosterFilterIds.includes(row.id))
    : studentRows;
  const normalizedRosterSearch = rosterSearch.trim().toLowerCase();
  const visibleStudentRows = groupedStudentRows
    .filter(row => !normalizedRosterSearch || row.name.toLowerCase().includes(normalizedRosterSearch))
    .filter(row => {
      if (rosterStatusFilter === "login-missing") return !row.symbol_password;
      if (rosterStatusFilter === "not-started") return row.answered === 0;
      if (rosterStatusFilter === "needs-attention") {
        return needsSupportConclusion(row);
      }
      return true;
    })
    .sort((left, right) => {
      if (rosterSort === "progress") {
        return right.masteredCount - left.masteredCount || left.name.localeCompare(right.name);
      }
      if (rosterSort === "last-active") {
        return String(right.lastActive || "").localeCompare(String(left.lastActive || ""))
          || left.name.localeCompare(right.name);
      }
      if (rosterSort === "focus") {
        return left.currentSkill.localeCompare(right.currentSkill) || left.name.localeCompare(right.name);
      }
      return left.name.localeCompare(right.name);
    });
  const selectedVisibleCount = visibleStudentRows.filter(row => selectedRosterIds.includes(row.id)).length;
  const enabledRosterColumns = new Set(visibleRosterColumns);
  const rosterColumnCount = 3 + visibleRosterColumns.length;

  const skillTotal = skillTree.length;
  const startedCount = studentRows.filter(row => row.answered > 0).length;
  const loginReadyCount = studentRows.filter(row => row.symbol_password).length;
  const activeTodayCount = studentRows.filter(row => formatLastActive(row.lastActive) === "Today").length;
  const classAccuracySummary = useMemo(
    () => buildClassAccuracySummary(studentRows.map(row => ({
      ...row,
      conclusion: row.learningConclusion
    }))),
    [studentRows]
  );
  const classMetricUpdatedAt = latestMetricUpdate(studentRows.map(row => row.lastActive));
  const className = selectedClass?.name || "No class selected";
  const isClassesPage = pageIntent === "classes";
  const hasSetupClass = Boolean(selectedClass);
  const hasSetupLearners = studentRows.length > 0;
  const setupLoginsReady = hasSetupLearners && studentRows.every(row => Boolean(row.symbol_password));
  const firstCheckComplete = studentRows.some(row => row.answered > 0);
  const setupComplete = hasSetupClass
    && hasSetupLearners
    && setupLoginsReady
    && firstCheckComplete;

  useEffect(() => {
    loadStudentsRef.current = loadStudents;
    loadClassDashboardRef.current = loadClassDashboard;
  }, [loadStudents, loadClassDashboard]);

  useEffect(() => {
    if (!selectedClassId) return;
    loadStudentsRef.current?.(selectedClassId);
    loadClassDashboardRef.current?.(selectedClassId);
  }, [selectedClassId]);

  function saveVisibleRosterColumns(nextColumns) {
    setVisibleRosterColumns(nextColumns);
    if (!teacherId) return;
    try {
      localStorage.setItem(`teacherRosterColumns:${teacherId}`, JSON.stringify(nextColumns));
    } catch {
      // The current view still updates when browser storage is unavailable.
    }
  }

  function toggleRosterColumn(columnId) {
    const nextColumns = enabledRosterColumns.has(columnId)
      ? visibleRosterColumns.filter(column => column !== columnId)
      : ROSTER_COLUMN_OPTIONS
        .map(option => option.id)
        .filter(column => column === columnId || enabledRosterColumns.has(column));
    saveVisibleRosterColumns(nextColumns);
  }

  function handleClassChange(event) {
    const nextClassId = event.target.value || null;
    setSelectedClassId?.(nextClassId);
    setStudentList?.([]);
  }

  async function handleCreateStudent() {
    const clean = newStudentName.trim();
    if (!clean) return;
    await createStudent?.(clean);
    setNewStudentName("");
  }

  async function handleReducedChoiceMode(row) {
    if (!setReducedChoiceMode || savingChoiceModeIds.includes(row.id)) return;
    setSavingChoiceModeIds(ids => [...ids, row.id]);
    try {
      await setReducedChoiceMode(row.id, !row.reducedChoiceMode);
    } finally {
      setSavingChoiceModeIds(ids => ids.filter(id => id !== row.id));
    }
  }

  async function handleAccessibilitySettings(row, settings) {
    if (!setAccessibilitySettings || savingAccessibilityIds.includes(row.id)) return false;
    setSavingAccessibilityIds(ids => [...ids, row.id]);
    try {
      return await setAccessibilitySettings(row.id, settings);
    } finally {
      setSavingAccessibilityIds(ids => ids.filter(id => id !== row.id));
    }
  }

  async function handleCreateClass() {
    setRosterAdminOpen(true);
    await createClass?.();
  }

  function reviewRosterImport(names) {
    const existingNames = new Set(studentRows.map(row => row.name.trim().toLowerCase()));
    const seenNames = new Set();
    const accepted = [];
    const duplicates = [];
    for (const rawName of names) {
      const name = String(rawName || "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (existingNames.has(key)) {
        duplicates.push({ name, reason: "Already in this class" });
      } else if (seenNames.has(key)) {
        duplicates.push({ name, reason: "Repeated in this import" });
      } else {
        seenNames.add(key);
        accepted.push(name);
      }
    }
    setRosterImportPreview({ total: accepted.length + duplicates.length, accepted, duplicates });
  }

  async function handleCsvFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const names = parseCsvNames(await file.text());
    setRosterImportText(names.join("\n"));
    reviewRosterImport(names);
    event.target.value = "";
  }

  async function handleImportStudents() {
    const names = rosterImportPreview?.accepted || [];
    if (!names.length || importingRoster) return;
    if (names.length > 40 || !teacherId || !selectedClassId) {
      setRosterOperationStatus("Import up to 40 children into a selected class.");
      return;
    }
    setImportingRoster(true);
    try {
      const { error } = await insertRosterStudents({
        supabase,
        names,
        classId: selectedClassId,
        teacherId
      });
      if (error) {
        console.error("Roster import error:", error);
        setRosterOperationStatus("We couldn't import that class list. No children were added.");
        return;
      }
      await loadStudents?.(selectedClassId);
      await loadClassDashboard?.(selectedClassId);
      setRosterOperationStatus(`${countPhrase(names.length, "child", "children")} imported. Set sign-in pictures next.`);
      setRosterImportText("");
      setRosterImportPreview(null);
      setShowRosterImport(false);
    } finally {
      setImportingRoster(false);
    }
  }

  async function handleSetupContinue(stepId) {
    if (stepId === "class") {
      if (!isClassesPage) onOpenClasses?.();
      else focusNewClassInput();
      return;
    }
    if (stepId === "children") {
      setRosterAdminOpen(true);
      if (!isClassesPage) {
        onOpenClasses?.();
        window.requestAnimationFrame(focusNewStudentInput);
      } else {
        focusNewStudentInput();
      }
      return;
    }
    if (stepId === "sign-in") {
      const learner = studentRows.find(row => !row.symbol_password);
      if (!learner) return;
      setEditingStudent(learner);
      setEditingSequence("");
      if (!isClassesPage) onOpenClasses?.();
      return;
    }
    if (stepId === "check") {
      const learner = selectedStudentRow || studentRows[0];
      if (!learner) return;
      await onLoadStudent?.(learner.id, learner.name);
      onOpenAssess?.();
    }
  }

  async function handleCreateDemo() {
    if (creatingDemo) return;
    setCreatingDemo(true);
    setRosterAdminOpen(true);
    try {
      const created = await createDemoClass?.();
      if (created && !isClassesPage) onOpenClasses?.();
    } finally {
      setCreatingDemo(false);
    }
  }

  function openLoginCardPreview(rows) {
    setLoginCardRows(rows.filter(row => row.symbol_password));
  }

  async function confirmRosterOperation() {
    if (!rosterOperation || operationBusy) return;
    setOperationBusy(true);
    try {
      let saved = false;
      if (rosterOperation.kind === "archive") {
        const { data, error } = await setRosterStudentArchived({
          supabase,
          studentId: rosterOperation.student.id,
          classId: selectedClassId,
          archived: true
        });
        saved = !error && Boolean(data?.length);
        if (saved) {
          const archivedStudent = rosterOperation.student;
          setRosterOperationStatus({
            kind: "undo",
            message: `${archivedStudent.name} archived. Their saved results remain.`,
            actionLabel: `Undo archive for ${archivedStudent.name}`,
            onAction: () => handleRestoreStudent(archivedStudent)
          });
        }
      } else if (rosterOperation.kind === "transfer") {
        const targetClass = classList.find(row => row.id === operationTargetClassId);
        const { data, error } = await transferRosterStudent({
          supabase,
          studentId: rosterOperation.student.id,
          sourceClassId: selectedClassId,
          targetClassId: operationTargetClassId
        });
        saved = !error && Boolean(data?.length);
        if (saved) {
          setRosterOperationStatus(
            `${rosterOperation.student.name} transferred to ${targetClass?.name || "the selected class"}. Their saved results moved too.`
          );
        }
      }
      if (saved) {
        if (selectedStudentId === rosterOperation.student.id) onClearStudent?.();
        await loadStudents?.(selectedClassId);
        await loadClassDashboard?.(selectedClassId);
        setSelectedRosterIds(previous => previous.filter(id => id !== rosterOperation.student.id));
        setRosterOperation(null);
        setOperationTargetClassId("");
      } else {
        setRosterOperationStatus(`We couldn't ${rosterOperation.kind} that child. Try again.`);
      }
    } finally {
      setOperationBusy(false);
    }
  }

  async function handleRestoreStudent(row) {
    const { data, error } = await setRosterStudentArchived({
      supabase,
      studentId: row.id,
      classId: selectedClassId,
      archived: false
    });
    if (error || !data?.length) {
      setRosterOperationStatus(`Could not restore ${row.name}.`);
      return;
    }
    await loadStudents?.(selectedClassId);
    await loadClassDashboard?.(selectedClassId);
    setRosterOperationStatus(`${row.name} restored to the active roster.`);
  }

  if (loginCardRows.length > 0) {
    return (
      <LoginCardPrintRoute
        rows={loginCardRows}
        schoolName={schoolName}
        className={selectedClass?.name}
        classCode={selectedClass?.access_code}
        onClose={() => setLoginCardRows([])}
      />
    );
  }

  return (
    <TeacherPageShell
      className="teacher-dashboard-page"
      product="class-dashboard"
    >
      <TeacherPageHeader
        className="teacher-dashboard-hero"
        brand={(
          <div className="teacher-page-brand">
            <img src={logoUrl} alt="" />
            <p className="panel-label">
              {isClassesPage ? TEACHER_COPY.classes.label : TEACHER_COPY.today.label}
            </p>
          </div>
        )}
        title={isClassesPage ? TEACHER_COPY.classes.title : TEACHER_COPY.today.title}
        description={isClassesPage
          ? (selectedClass
            ? TEACHER_COPY.classes.descriptionWithClass(selectedClass.name)
            : TEACHER_COPY.classes.descriptionWithoutClass)
          : (selectedClass
            ? TEACHER_COPY.today.descriptionWithClass(selectedClass.name)
            : TEACHER_COPY.today.descriptionWithoutClass)}
      >
        <div
          className="teacher-dashboard-context"
          aria-label={TEACHER_COPY.classes.contextLabel}
        >
          <span>School</span>
          <strong>{hasSchool ? schoolName : "Not set"}</strong>
          <small>
            {selectedClass
              ? TEACHER_COPY.classes.childCount(studentRows.length)
              : className}
          </small>
        </div>
      </TeacherPageHeader>

      <ActionFeedback className="teacher-dashboard-message" message={message} />
      <ActionFeedback className="teacher-dashboard-message" feedback={rosterOperationStatus} />

      {surfaceState ? (
        <TeacherSurfaceState
          surface={isClassesPage ? "classes" : "today"}
          state={surfaceState}
          detail={surfaceStateDetail}
          onPrimaryAction={onSurfaceStatePrimary}
          onSecondaryAction={onSurfaceStateSecondary}
        />
      ) : (
      <>
      {!isClassesPage && !setupComplete && (
        <TeacherSetupChecklist
          hasClass={hasSetupClass}
          hasLearners={hasSetupLearners}
          loginsReady={setupLoginsReady}
          firstCheckComplete={firstCheckComplete}
          onContinue={handleSetupContinue}
          onCreateDemo={createDemoClass ? handleCreateDemo : null}
          creatingDemo={creatingDemo}
        />
      )}

      <section
        className={`teacher-dashboard-controls${isClassesPage ? "" : " teacher-today-class-control"}`}
        aria-label={isClassesPage ? "Class controls" : "Today class"}
      >
        <div className="teacher-dashboard-control-group">
          <label className="teacher-dashboard-control">
            <span>Current class</span>
            <select value={selectedClassId || ""} onChange={handleClassChange}>
              <option value="">Choose class</option>
              {classList.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {isClassesPage && <div className="teacher-dashboard-create teacher-dashboard-control-group">
          <label className="teacher-dashboard-control">
            <span>New class</span>
            <input
              ref={newClassInputRef}
              autoComplete="off"
              value={newClassName}
              placeholder="Enter class name"
              onChange={event => setNewClassName?.(event.target.value)}
              onKeyDown={event => {
                if (event.key === "Enter") handleCreateClass();
              }}
            />
          </label>
          <button className="lp-button lp-button-primary" onClick={handleCreateClass} type="button">
            Create class
          </button>
        </div>}

      </section>

      {!isClassesPage && selectedClass && (
        <TodayBriefing
          rows={studentRows}
          onLoadStudent={onLoadStudent}
          onPlanIntervention={row => setInterventionRecommendation({
            id: row.id,
            name: row.name,
            focus: row.focus
          })}
          onOpenClasses={onOpenClasses}
          onOpenAssess={onOpenAssess}
          onOpenProgress={onOpenProgress}
        />
      )}

      {!isClassesPage && selectedClass && (
        <details className="teacher-dashboard-secondary">
          <summary>Intervention follow-up</summary>
          <InterventionLoop
            key={`${teacherId || "teacher"}:${selectedClass.id}`}
            supabase={supabase}
            teacherId={teacherId}
            classId={selectedClass.id}
            className={selectedClass.name}
            rows={studentRows}
            recommendation={interventionRecommendation}
            onRecommendationConsumed={() => setInterventionRecommendation(null)}
          />
        </details>
      )}

      {isClassesPage && selectedClass && (
        <details className="teacher-dashboard-secondary">
          <summary>{TEACHER_COPY.sync.label}</summary>
          <TeacherActivitySyncHealth
            supabase={supabase}
            classId={selectedClass.id}
            className={selectedClass.name}
            seedRows={activitySyncHealthSeedRows}
          />
        </details>
      )}

      {isClassesPage && selectedClass && (
        <section
          className="teacher-roster-metrics"
          aria-label={TEACHER_COPY.metrics.summaryAriaLabel}
          data-teacher-priority="class-pulse"
        >
          <RosterMetric label={TEACHER_COPY.metrics.children} value={studentRows.length} />
          <RosterMetric
            label={TEACHER_COPY.metrics.readyToSignIn}
            value={progressPhrase(loginReadyCount, studentRows.length || 0)}
            tone={loginReadyCount === studentRows.length && studentRows.length ? "good" : ""}
          />
          <RosterMetric
            definitionId="started"
            definitionOptions={{
              denominator: `${countPhrase(studentRows.length, "child", "children")} in this class.`,
              updatedAt: classMetricUpdatedAt
            }}
            label={TEACHER_COPY.metrics.havePlayed}
            value={progressPhrase(startedCount, studentRows.length || 0)}
          />
          <div className="teacher-roster-metric teacher-roster-metric-accuracy">
            <span>{TEACHER_COPY.metrics.classAccuracy}</span>
            <strong>
              {classAccuracySummary.comparability.comparable
                ? `${classAccuracySummary.learnerWeightedAccuracy}%`
                : TEACHER_COPY.metrics.notEnough}
            </strong>
            <details>
              <summary>See both averages</summary>
              <dl>
                <div>
                  <dt>{TEACHER_COPY.metrics.equalChildren}</dt>
                  <dd>
                    <MetricFigure
                      metricId="accuracy"
                      denominator={`${countPhrase(classAccuracySummary.policyReadyLearnerCount, "child", "children")} with at least ${PROGRESS_MIN_RESPONSES} scored answers each.`}
                      dateRange="All saved scored answers for this class."
                      updatedAt={classMetricUpdatedAt}
                    >
                      {classAccuracySummary.learnerWeightedAccuracy === null
                        ? TEACHER_COPY.metrics.notEnough
                        : `${classAccuracySummary.learnerWeightedAccuracy}%`}
                    </MetricFigure>
                  </dd>
                </div>
                <div>
                  <dt>{TEACHER_COPY.metrics.equalAnswers}</dt>
                  <dd>
                    <MetricFigure
                      metricId="accuracy"
                      denominator={`${countPhrase(classAccuracySummary.responseCount, "scored answer")} from ${countPhrase(classAccuracySummary.policyReadyLearnerCount, "child", "children")}.`}
                      dateRange="All saved scored answers for this class."
                      updatedAt={classMetricUpdatedAt}
                    >
                      {classAccuracySummary.responseWeightedAccuracy === null
                        ? TEACHER_COPY.metrics.notEnough
                        : `${classAccuracySummary.responseWeightedAccuracy}%`}
                    </MetricFigure>
                  </dd>
                </div>
              </dl>
            </details>
          </div>
          <RosterMetric
            definitionId="active"
            definitionOptions={{
              denominator: `${countPhrase(studentRows.length, "child", "children")} in this class.`,
              updatedAt: classMetricUpdatedAt
            }}
            label={TEACHER_COPY.metrics.playedToday}
            value={progressPhrase(activeTodayCount, studentRows.length || 0)}
          />
          <p
            className="teacher-roster-metric-note"
            role="status"
            data-class-average-suppressed={!classAccuracySummary.comparability.comparable}
          >
            {classAccuracySummary.comparability.comparable
              ? TEACHER_COPY.metrics.comparable
              : TEACHER_COPY.metrics.fairAverage(2)}
          </p>
        </section>
      )}

      {isClassesPage && selectedClass && (
        <section className="teacher-roster-groups" aria-label={TEACHER_COPY.groups.ariaLabel}>
          <div>
            <p className="panel-label">{TEACHER_COPY.groups.label}</p>
            <strong>{TEACHER_COPY.groups.description}</strong>
          </div>
          <div className="teacher-roster-group-buttons">
            {rosterGroups.map(group => (
              <button
                key={group.id}
                className={group.id === selectedRosterGroup.id ? "is-active" : ""}
                type="button"
                aria-pressed={group.id === selectedRosterGroup.id}
                onClick={() => {
                  setRosterFilterIds(null);
                  onSelectGroup?.(group.id);
                }}
              >
                <span>{group.label}</span>
                <strong>{group.studentIds.length}</strong>
              </button>
            ))}
          </div>
          <button
            className="lp-button lp-button-secondary teacher-question-guide-button"
            type="button"
            onClick={openQuestionGuide}
          >
            {TEACHER_COPY.help.checkGuide}
          </button>
        </section>
      )}

      {isClassesPage && selectedClass && selectedStudentRow && (
        <TeacherDrawer
          label={`Child details: ${selectedStudentRow.name}`}
          onClose={onClearStudent}
        >
          <aside
            className="teacher-learner-drawer"
            role="region"
            aria-label={`Child details: ${selectedStudentRow.name}`}
            data-teacher-learner-id={selectedStudentRow.id}
          >
            <header>
              <div>
                <p className="teacher-context-trail">
                  Classes <span aria-hidden="true">/</span> {selectedClass.name}
                  <span aria-hidden="true">/</span> {selectedRosterGroup.label}
                  <span aria-hidden="true">/</span> {selectedStudentRow.name}
                </p>
                <h3>{selectedStudentRow.name}</h3>
                <p>
                  <MetricFigure
                    metricId="current-skill"
                    updatedAt={selectedStudentRow.lastActive}
                  >
                    {selectedStudentRow.currentSkill}
                  </MetricFigure>
                </p>
              </div>
              <button className="text-button" data-autofocus type="button" onClick={onClearStudent}>
                Close child details
              </button>
            </header>
            <div className="teacher-learner-drawer-metrics" aria-label={`${selectedStudentRow.name} results summary`}>
              <RosterMetric label="Answers" value={selectedStudentRow.answered} />
              <RosterMetric
                definitionId="accuracy"
                definitionOptions={{
                  denominator: `${countPhrase(selectedStudentRow.answered, "scored answer")} for this child.`,
                  updatedAt: selectedStudentRow.lastActive
                }}
                label="Accuracy"
                value={accuracyConclusion(selectedStudentRow)}
              />
              <RosterMetric
                definitionId="mastered"
                definitionOptions={{
                  denominator: `${skillTotal} curriculum skills.`,
                  updatedAt: selectedStudentRow.lastActive
                }}
                label="Skills secured"
                value={progressPhrase(selectedStudentRow.masteredCount, skillTotal)}
              />
              <RosterMetric
                definitionId="active"
                definitionOptions={{
                  denominator: "This child's saved answers and Sound Seekers play.",
                  dateRange: "Most recent saved activity across all time.",
                  updatedAt: selectedStudentRow.lastActive
                }}
                label="Last active"
                value={formatLastActive(selectedStudentRow.lastActive)}
              />
            </div>
            <dl className="teacher-learner-drawer-details">
              <div>
                <dt>Sign-in</dt>
                <dd>{selectedStudentRow.symbol_password ? "Pictures ready" : "Pictures need setting"}</dd>
              </div>
              <div>
                <dt>Sound Seekers</dt>
                <dd>
                  {selectedStudentRow.soundSeekers?.sessions || selectedStudentRow.soundSeekers?.stopsCompleted > 0
                    ? (
                      <MetricFigure
                        metricId="trails"
                        updatedAt={selectedStudentRow.soundSeekers.syncedAt || selectedStudentRow.lastActive}
                      >
                        {progressPhrase(selectedStudentRow.soundSeekers.stopsCompleted, 40)} trails · {selectedStudentRow.soundSeekers.stonesLit} sounds lit
                      </MetricFigure>
                    )
                    : "Not started"}
                </dd>
              </div>
            </dl>
            <div className="teacher-learner-drawer-actions">
              <button className="lp-button lp-button-primary" type="button" onClick={onOpenAssess}>
                Check {selectedStudentRow.name}
              </button>
              <button className="lp-button lp-button-secondary" type="button" onClick={onOpenProgress}>
                Review {selectedStudentRow.name}&rsquo;s progress
              </button>
              <button
                className="lp-button lp-button-secondary"
                type="button"
                onClick={openQuestionGuide}
              >
                {TEACHER_COPY.help.checkGuide}
              </button>
              <button
                className="lp-button lp-button-secondary"
                type="button"
                onClick={() => setDataRightsStudent(selectedStudentRow)}
              >
                Export or delete child data
              </button>
            </div>
          </aside>
        </TeacherDrawer>
      )}

      {isClassesPage && selectedClass && actionCards.length > 0 && (
        <section className="teacher-action-cards" aria-label="Suggested next steps">
          {actionCards.map(card => (
            <article
              key={card.id}
              className={`teacher-action-card ${card.tone}`}
              data-teacher-recommendation={card.id}
            >
              <div className="teacher-action-card-copy">
                <strong>{card.title}</strong>
                <p>{card.detail}</p>
                <TeacherRecommendationExplanation
                  explanation={card.explanation}
                  surface="teacher-dashboard-next-steps"
                />
              </div>
              <button
                className="lp-button lp-button-secondary"
                type="button"
                onClick={() => {
                  if (card.onClick) card.onClick();
                  else if (card.studentIds) setRosterFilterIds(card.studentIds);
                }}
              >
                {card.action}
              </button>
            </article>
          ))}
        </section>
      )}

      {isClassesPage && effectiveRosterFilterIds && (
        <div className="teacher-roster-filter-chip">
          <span>
            {rosterFilterIds ? "Suggested group" : selectedRosterGroup.label}: showing {visibleStudentRows.length} of {studentRows.length} children
          </span>
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setRosterFilterIds(null);
              onSelectGroup?.("all");
            }}
          >
            Show all
          </button>
        </div>
      )}

      {isClassesPage && (
        <details
          className="teacher-roster-admin"
          data-teacher-priority="roster-admin"
          open={rosterAdminOpen}
          onToggle={event => setRosterAdminOpen(event.currentTarget.open)}
        >
          <summary>
            <span>
              <strong>{TEACHER_COPY.roster.manageTitle}</strong>
              <small>{TEACHER_COPY.roster.manageBody}</small>
            </span>
            <span>{TEACHER_COPY.roster.activeCount(studentRows.length)}</span>
          </summary>
          <div className="teacher-roster-admin-content">
      <section className="teacher-dashboard-roster" aria-label={TEACHER_COPY.roster.panelLabel}>
        <div className="teacher-panel-header">
          <div>
            <p className="panel-label">{TEACHER_COPY.roster.panelLabel}</p>
            <h3>{TEACHER_COPY.roster.panelTitle(selectedClass?.name)}</h3>
            <p>
              {selectedClass
                ? TEACHER_COPY.roster.inClass(studentRows.length)
                : TEACHER_COPY.roster.chooseClass}
            </p>
            {selectedClass && (
              <small className="muted-text">{TEACHER_COPY.roster.privacy}</small>
            )}
          </div>
        </div>

        {selectedClass && (
          <div className="teacher-roster-actionbar">
            <div className="teacher-roster-add">
              <label className="teacher-dashboard-control">
                <span>{TEACHER_COPY.roster.displayName}</span>
                <input
                  ref={newStudentInputRef}
                  autoComplete="off"
                  value={newStudentName}
                  placeholder={TEACHER_COPY.roster.displayNamePlaceholder}
                  onChange={event => setNewStudentName(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === "Enter") handleCreateStudent();
                  }}
                />
              </label>
              <button className="lp-button lp-button-primary" disabled={!newStudentName.trim()} onClick={handleCreateStudent} type="button">
                {TEACHER_COPY.roster.add}
              </button>
            </div>
            <div className="teacher-roster-actions">
              <button
                className="lp-button lp-button-secondary"
                onClick={() => {
                  setShowRosterImport(current => !current);
                  setRosterImportPreview(null);
                }}
                type="button"
                aria-expanded={showRosterImport}
              >
                {showRosterImport ? "Close import" : "Import class list"}
              </button>
              <details className="teacher-roster-more-tools">
                <summary>More tools</summary>
                <div>
                  <button
                    className="lp-button lp-button-secondary"
                    disabled={!selectedRosterIds.length}
                    onClick={() => openLoginCardPreview(studentRows.filter(row => selectedRosterIds.includes(row.id)))}
                    type="button"
                  >
                    Preview selected cards ({selectedRosterIds.length})
                  </button>
                  <button
                    className="lp-button lp-button-secondary"
                    disabled={!studentRows.some(row => row.symbol_password)}
                    onClick={() => openLoginCardPreview(studentRows)}
                    type="button"
                  >
                    Preview all cards
                  </button>
                  <button className="lp-button lp-button-secondary" onClick={startStudentLogin} type="button">
                    {TEACHER_COPY.roster.childPreview}
                  </button>
                </div>
              </details>
            </div>
          </div>
        )}

        {selectedClass && showRosterImport && (
          <section className="teacher-roster-import" aria-label="Import children&apos;s names">
            <div>
              <strong>{TEACHER_COPY.roster.importTitle}</strong>
              <p>{TEACHER_COPY.roster.importBody}</p>
              <label className="lp-button lp-button-secondary teacher-csv-file-button">
                <span>Choose CSV file</span>
                <input accept=".csv,text/csv" onChange={handleCsvFile} type="file" />
              </label>
            </div>
            <label>
              <span>{TEACHER_COPY.roster.namesLabel}</span>
              <textarea
                value={rosterImportText}
                onChange={event => {
                  setRosterImportText(event.target.value);
                  setRosterImportPreview(null);
                }}
                placeholder={"Ava\nBen\nChen"}
                rows={5}
              />
            </label>
            <div className="teacher-roster-import-actions">
              {!rosterImportPreview ? (
                <button
                  className="lp-button lp-button-primary"
                  type="button"
                  disabled={!rosterImportText.trim()}
                  onClick={() => reviewRosterImport(parseCsvNames(rosterImportText))}
                >
                  Review import
                </button>
              ) : (
                <>
                  <p role="status">
                    <strong>{rosterImportPreview.accepted.length} ready</strong>
                    {" · "}
                    {rosterImportPreview.duplicates.length} duplicate
                    {rosterImportPreview.duplicates.length === 1 ? "" : "s"} skipped
                  </p>
                  {rosterImportPreview.duplicates.length > 0 && (
                    <ul aria-label="Duplicate children&apos;s names">
                      {rosterImportPreview.duplicates.map((row, index) => (
                        <li key={`${row.name}-${index}`}>{row.name}: {row.reason}</li>
                      ))}
                    </ul>
                  )}
                  <button
                    className="lp-button lp-button-primary"
                    type="button"
                    disabled={!rosterImportPreview.accepted.length || importingRoster}
                    onClick={handleImportStudents}
                  >
                    {importingRoster
                      ? "Importing..."
                      : `Import ${countPhrase(rosterImportPreview.accepted.length, "child", "children")}`}
                  </button>
                </>
              )}
            </div>
          </section>
        )}

        {selectedClass && studentRows.length > 0 && (
          <>
            <TeacherFilterBar
              className="teacher-roster-tools"
              label="Search, sort, and filter children"
            >
              <label>
                <span>Search children</span>
                <input
                  type="search"
                  value={rosterSearch}
                  onChange={event => setRosterSearch(event.target.value)}
                  placeholder="Search display names"
                />
              </label>
              <label>
                <span>Filter</span>
                <select value={rosterStatusFilter} onChange={event => setRosterStatusFilter(event.target.value)}>
                  <option value="all">{TEACHER_COPY.roster.activeFilter}</option>
                  <option value="login-missing">{TEACHER_COPY.roster.signInMissingFilter}</option>
                  <option value="not-started">Not started</option>
                  <option value="needs-attention">Needs attention</option>
                </select>
              </label>
              <label>
                <span>Sort</span>
                <select value={rosterSort} onChange={event => setRosterSort(event.target.value)}>
                  <option value="name">Display name</option>
                  <option value="last-active">Last active</option>
                  <option value="focus">Current focus</option>
                  <option value="progress">Progress</option>
                </select>
              </label>
              <p role="status">
                {TEACHER_COPY.roster.showing(visibleStudentRows.length, studentRows.length)}
              </p>
            </TeacherFilterBar>
            <details className="teacher-roster-column-picker">
              <summary>Choose columns · {visibleRosterColumns.length + 2} shown</summary>
              <fieldset>
                <legend>Optional columns</legend>
                {ROSTER_COLUMN_OPTIONS.map(option => (
                  <label key={option.id}>
                    <input
                      type="checkbox"
                      checked={enabledRosterColumns.has(option.id)}
                      onChange={() => toggleRosterColumn(option.id)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </fieldset>
              <p>Display name and Actions always stay visible. Column choices are saved on this device.</p>
              <button
                className="text-button"
                type="button"
                onClick={() => saveVisibleRosterColumns(DEFAULT_ROSTER_COLUMNS)}
              >
                Restore scannable defaults
              </button>
            </details>
          </>
        )}

        {selectedClass && !loadingStudents && studentRows.length > 0 && (
          <ClassHeatPanel rows={studentRows} />
        )}

        {!selectedClass && isClassesPage ? (
          <TeacherSurfaceState
            compact
            surface="classes"
            state="empty"
            onPrimaryAction={focusNewClassInput}
          />
        ) : !selectedClass ? (
          <div className="report-empty-state teacher-onboard-empty">
            <strong>Your children will appear here.</strong>
            <p>Create a class above or continue from the setup checklist.</p>
            <button className="lp-button lp-button-primary" type="button" onClick={focusNewClassInput}>
              Create your first class
            </button>
          </div>
        ) : loadingStudents ? (
          <TeacherSurfaceState
            compact
            surface={isClassesPage ? "classes" : "today"}
            state="loading"
          />
        ) : studentRows.length === 0 ? (
          <div className="report-empty-state teacher-onboard-empty">
            <strong>{TEACHER_COPY.roster.firstTitle(selectedClass.name)}</strong>
            <p>{TEACHER_COPY.roster.firstBody}</p>
            <button className="lp-button lp-button-primary" type="button" onClick={focusNewStudentInput}>
              {TEACHER_COPY.roster.firstAction}
            </button>
          </div>
        ) : (
          <TeacherDataTable
            className="dashboard-table teacher-roster-table"
            label={`${selectedClass.name} children`}
          >
              <thead>
                <tr>
                  <th scope="col" aria-label="Select children">
                    <input
                      aria-label="Select all visible children"
                      type="checkbox"
                      checked={visibleStudentRows.length > 0 && selectedVisibleCount === visibleStudentRows.length}
                      onChange={event => {
                        const visibleIds = visibleStudentRows.map(row => row.id);
                        setSelectedRosterIds(previous => event.target.checked
                          ? [...new Set([...previous, ...visibleIds])]
                          : previous.filter(id => !visibleIds.includes(id)));
                      }}
                    />
                  </th>
                  <th scope="col">Display name</th>
                  {enabledRosterColumns.has("focus") && <th scope="col">Focus</th>}
                  {enabledRosterColumns.has("progress") && <th scope="col">Progress</th>}
                  {enabledRosterColumns.has("sound-seekers") && <th scope="col">Sound Seekers</th>}
                  {enabledRosterColumns.has("login") && <th scope="col">Sign-in</th>}
                  {enabledRosterColumns.has("last-active") && <th scope="col">Last active</th>}
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleStudentRows.map(row => {
                  const progressPercent = getProgressPercent(row, skillTotal);
                  const loginReady = Boolean(row.symbol_password);
                  return (
                  <Fragment key={row.id}>
                  <tr className={loginReady ? "login-ready" : "login-missing"}>
                    <td data-label="Select">
                      <input
                        aria-label={`Select ${row.name}`}
                        type="checkbox"
                        checked={selectedRosterIds.includes(row.id)}
                        onChange={event => setSelectedRosterIds(previous => event.target.checked
                          ? [...new Set([...previous, row.id])]
                          : previous.filter(id => id !== row.id))}
                      />
                    </td>
                    <td data-label="Display name">
                      <div className="teacher-student-cell">
                        <StudentInitial name={row.name} />
                        <div>
                          <strong>{row.name}</strong>
                          <span>{row.answered ? `${row.answered} answer${row.answered === 1 ? "" : "s"}` : "No practice yet"}</span>
                        </div>
                      </div>
                    </td>
                    {enabledRosterColumns.has("focus") && <td data-label="Focus">
                      <span className="teacher-focus-pill">
                        <MetricFigure metricId="current-skill" updatedAt={row.lastActive}>
                          {row.currentSkill}
                        </MetricFigure>
                      </span>
                    </td>}
                    {enabledRosterColumns.has("progress") && <td data-label="Progress">
                      <div className="teacher-progress-cell">
                        <div className="teacher-progress-line">
                          <strong>
                            <MetricFigure
                              denominator={`${skillTotal} curriculum skills.`}
                              metricId="mastered"
                              updatedAt={row.lastActive}
                            >
                              {row.answered
                                ? `${progressPhrase(row.masteredCount, skillTotal)} mastered`
                                : "Not started"}
                            </MetricFigure>
                          </strong>
                          {row.answered ? (
                            <MetricFigure
                              denominator={`${countPhrase(row.answered, "scored answer")} for this child.`}
                              metricId="accuracy"
                              updatedAt={row.lastActive}
                            >
                              {accuracyConclusion(row)}
                            </MetricFigure>
                          ) : null}
                        </div>
                        <div className="teacher-progress-track" aria-hidden="true">
                          <span style={{ width: `${progressPercent}%` }} />
                        </div>
                      </div>
                    </td>}
                    {enabledRosterColumns.has("sound-seekers") && <td data-label="Sound Seekers">
                      {row.soundSeekers?.sessions || row.soundSeekers?.stopsCompleted > 0 ? (
                        <div className="teacher-quest-cell">
                          <strong>
                            <MetricFigure
                              metricId="trails"
                              updatedAt={row.soundSeekers.syncedAt || row.lastActive}
                            >
                              {progressPhrase(row.soundSeekers.stopsCompleted, 40)} trails
                            </MetricFigure>
                          </strong>
                          <span>{row.soundSeekers.stonesLit} sounds lit · {row.soundSeekers.timeOnTask}</span>
                          <small>{row.soundSeekers.currentFocus?.length ? `Needs re-teaching: ${row.soundSeekers.currentFocus.slice(0, 3).join(", ")}` : "Building first sound profile"}</small>
                          <button
                            className="text-button"
                            type="button"
                            aria-expanded={heatOpenId === row.id}
                            onClick={() => setHeatOpenId(current => (current === row.id ? null : row.id))}
                          >
                            {heatOpenId === row.id ? "Hide sound map" : row.soundSeekers.assignment ? "Sound map · practice assigned" : "Sound map"}
                          </button>
                        </div>
                      ) : <span className="muted-text">Not started</span>}
                    </td>}
                    {enabledRosterColumns.has("login") && <td data-label="Sign-in">
                      <div className="teacher-login-cell">
                        <span className={loginReady ? "teacher-login-status ready" : "teacher-login-status missing"}>
                          {loginReady ? "Ready" : "Needs pictures"}
                        </span>
                        <SymbolSequence sequence={row.symbol_password || ""} hidden={!visiblePasswords[row.id]} size={20} />
                        <div className="teacher-login-actions">
                          <button className="text-button" onClick={() => setVisiblePasswords(previous => ({ ...previous, [row.id]: !previous[row.id] }))} type="button">
                            {visiblePasswords[row.id] ? "Hide" : "Show"}
                          </button>
                          <button className="text-button" onClick={() => {
                            setEditingStudent(row);
                            setEditingSequence("");
                          }} type="button">
                            {loginReady ? "Change" : "Set pictures"}
                          </button>
                          {loginReady && (
                            <button className="text-button" onClick={() => resetStudentSymbolPassword?.(row.id, row.name)} type="button">
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </td>}
                    {enabledRosterColumns.has("last-active") && (
                      <td data-label="Last active">{formatLastActive(row.lastActive)}</td>
                    )}
                    <td data-label="Actions">
                      <div className="teacher-row-actions">
                        <button className="lp-button lp-button-secondary teacher-open-student" onClick={() => onLoadStudent?.(row.id, row.name)} type="button">
                          Open child
                        </button>
                        <button
                          className="lp-button lp-button-secondary"
                          type="button"
                          aria-haspopup="dialog"
                          aria-label={`More options for ${row.name}`}
                          onClick={() => setActionsStudent(row)}
                        >
                          More
                        </button>
                      </div>
                    </td>
                  </tr>
                  {heatOpenId === row.id && row.soundSeekers && (
                    <tr className="teacher-heat-row">
                      <td colSpan={rosterColumnCount}>
                        <QuestHeatPanel
                          report={row.soundSeekers}
                          studentName={row.name}
                          onAssign={targets => assignQuestPractice?.(row.id, targets)}
                          onClear={() => clearQuestPractice?.(row.id)}
                        />
                      </td>
                    </tr>
                  )}
                  </Fragment>
                  );
                })}
              </tbody>
          </TeacherDataTable>
        )}
      </section>

      {selectedClass && archivedStudentList.length > 0 && (
        <section className="teacher-archived-roster" aria-label="Archived children">
          <details>
            <summary>Archived children ({archivedStudentList.length})</summary>
            <p>Archived children cannot sign in, but their saved results remain. Restore a child to return them to this class.</p>
            <ul>
              {archivedStudentList.map(row => (
                <li key={row.id}>
                  <span>
                    <strong>{row.name}</strong>
                    <small>Archived {formatLastActive(row.archived_at)}</small>
                  </span>
                  <button
                    className="lp-button lp-button-secondary"
                    type="button"
                    onClick={() => handleRestoreStudent(row)}
                  >
                    Restore {row.name}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}
          </div>
        </details>
      )}

      {showQuestionGuide && (
        <QuestionTypeGuideDialog
          query={questionGuideSearch}
          onQueryChange={setQuestionGuideSearch}
          onClose={() => setShowQuestionGuide(false)}
        />
      )}

      {accessibilityStudent && (
        <LearnerAccessibilityDialog
          key={accessibilityStudent.id}
          student={accessibilityStudent}
          saving={savingAccessibilityIds.includes(accessibilityStudent.id)}
          onSave={handleAccessibilitySettings}
          onClose={() => setAccessibilityStudent(null)}
        />
      )}

      {actionsStudent && (
        <TeacherModal
          className="teacher-child-actions-modal"
          label={`Options for ${actionsStudent.name}`}
          onClose={() => setActionsStudent(null)}
        >
          <div className="symbol-password-modal-card page-stack">
            <header>
              <p className="panel-label">Child information</p>
              <h3>{actionsStudent.name}</h3>
              <p>Choose one task. Each task opens in its own focused window.</p>
            </header>
            <div className="teacher-child-action-list">
              <button
                className="lp-button lp-button-secondary"
                type="button"
                onClick={() => openStudentProfile(actionsStudent)}
              >
                Edit child information
              </button>
              <button
                className="lp-button lp-button-secondary"
                type="button"
                onClick={() => {
                  setEditingStudent(actionsStudent);
                  setEditingSequence("");
                  setActionsStudent(null);
                }}
              >
                {actionsStudent.symbol_password ? "Change sign-in pictures" : "Set sign-in pictures"}
              </button>
              {actionsStudent.symbol_password && (
                <button
                  className="lp-button lp-button-secondary"
                  type="button"
                  onClick={async () => {
                    const student = actionsStudent;
                    setActionsStudent(null);
                    await resetStudentSymbolPassword?.(student.id, student.name);
                  }}
                >
                  Reset sign-in pictures
                </button>
              )}
              <button
                className="lp-button lp-button-secondary teacher-choice-mode-toggle"
                type="button"
                aria-pressed={actionsStudent.reducedChoiceMode}
                disabled={savingChoiceModeIds.includes(actionsStudent.id)}
                onClick={async () => {
                  const student = actionsStudent;
                  await handleReducedChoiceMode(student);
                  setActionsStudent(null);
                }}
              >
                {actionsStudent.reducedChoiceMode ? "Use all child choices" : "Reduce child choices"}
              </button>
              <button
                className="lp-button lp-button-secondary"
                type="button"
                onClick={() => {
                  setAccessibilityStudent(actionsStudent);
                  setActionsStudent(null);
                }}
              >
                Accessibility settings
              </button>
              <button
                className="lp-button lp-button-secondary"
                type="button"
                onClick={() => {
                  setDataRightsStudent(actionsStudent);
                  setActionsStudent(null);
                }}
              >
                Privacy and data rights
              </button>
              {classList.length > 1 && (
                <button
                  className="lp-button lp-button-secondary"
                  type="button"
                  onClick={() => {
                    setRosterOperation({ kind: "transfer", student: actionsStudent });
                    setOperationTargetClassId("");
                    setActionsStudent(null);
                  }}
                >
                  Move to another class
                </button>
              )}
              <button
                className="lp-button lp-button-danger-outline"
                type="button"
                onClick={() => {
                  setRosterOperation({ kind: "archive", student: actionsStudent });
                  setActionsStudent(null);
                }}
              >
                Archive child
              </button>
            </div>
            <footer className="teacher-dialog-footer">
              <button
                className="lp-button lp-button-secondary"
                type="button"
                onClick={() => setActionsStudent(null)}
              >
                Close
              </button>
            </footer>
          </div>
        </TeacherModal>
      )}

      <LearnerDataRightsDialog
        key={dataRightsStudent?.id || "closed-data-rights"}
        client={supabase}
        learner={dataRightsStudent}
        open={Boolean(dataRightsStudent)}
        onClose={() => setDataRightsStudent(null)}
        onDeleted={handleDataRightsDeletion}
      />

      {editingStudentProfile && (
        <TeacherModal
          className="teacher-child-profile-modal"
          label={`Edit ${editingStudentProfile.name}`}
          onClose={savingStudentProfile ? undefined : () => setEditingStudentProfile(null)}
        >
          <form className="page-stack" onSubmit={saveStudentProfile}>
            <header>
              <p className="panel-label">Child information</p>
              <h3>Edit display name</h3>
              <p>Use the classroom name the child and staff already recognise. Do not add a surname unless your school requires it.</p>
            </header>
            <label>
              <span>Display name</span>
              <input
                autoFocus
                maxLength={80}
                value={studentNameDraft}
                disabled={savingStudentProfile}
                onChange={event => {
                  setStudentNameDraft(event.target.value);
                  setStudentProfileError("");
                }}
              />
            </label>
            {studentProfileError && (
              <p className="teacher-inline-error" role="alert">{studentProfileError}</p>
            )}
            <footer className="teacher-dialog-footer">
              <button
                className="lp-button lp-button-primary"
                type="submit"
                disabled={savingStudentProfile}
              >
                {savingStudentProfile ? "Saving…" : "Save child information"}
              </button>
              <button
                className="lp-button lp-button-secondary"
                type="button"
                disabled={savingStudentProfile}
                onClick={() => setEditingStudentProfile(null)}
              >
                Cancel
              </button>
            </footer>
          </form>
        </TeacherModal>
      )}

      {rosterOperation && (
        <TeacherModal
          className="teacher-roster-operation-modal"
          label={`${rosterOperation.kind === "archive" ? "Archive" : "Transfer"} ${rosterOperation.student.name}`}
          onClose={() => {
            if (operationBusy) return;
            setRosterOperation(null);
            setOperationTargetClassId("");
          }}
        >
          <div className="symbol-password-modal-card">
            <h3>
              {rosterOperation.kind === "archive"
                ? `Archive ${rosterOperation.student.name}?`
                : `Transfer ${rosterOperation.student.name}?`}
            </h3>
            {rosterOperation.kind === "archive" ? (
              <p>
                This removes the child from sign-in and class groups. Their saved results stay attached and can be restored.
              </p>
            ) : (
              <>
                <p>
                  The child and their saved results move together. Nothing is copied or deleted.
                </p>
                <label className="teacher-dashboard-control">
                  <span>Destination class</span>
                  <select
                    value={operationTargetClassId}
                    onChange={event => setOperationTargetClassId(event.target.value)}
                  >
                    <option value="">Choose another class</option>
                    {classList.filter(row => row.id !== selectedClassId).map(row => (
                      <option key={row.id} value={row.id}>{row.name}</option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <div className="teacher-roster-operation-actions">
              <button
                className={rosterOperation.kind === "archive" ? "lp-button lp-button-danger-outline" : "lp-button lp-button-primary"}
                type="button"
                disabled={operationBusy || (rosterOperation.kind === "transfer" && !operationTargetClassId)}
                onClick={confirmRosterOperation}
              >
                {operationBusy
                  ? "Saving..."
                  : rosterOperation.kind === "archive"
                    ? "Archive child"
                    : "Transfer child"}
              </button>
              <button
                className="lp-button lp-button-secondary"
                type="button"
                disabled={operationBusy}
                onClick={() => {
                  setRosterOperation(null);
                  setOperationTargetClassId("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </TeacherModal>
      )}

      {editingStudent && (
        <TeacherModal
          label={`Change password for ${editingStudent.name}`}
          onClose={() => {
            setEditingStudent(null);
            setEditingSequence("");
          }}
        >
          <div className="symbol-password-modal-card">
            <h3>Change {editingStudent.name}'s pictures</h3>
            <p className="muted-text">This child gate is teacher-visible by design; real data protection remains in the signed-in teacher account.</p>
            <SymbolPasswordPad
              value={editingSequence}
              onChange={setEditingSequence}
              onComplete={async sequence => {
                await updateStudentSymbolPassword?.(editingStudent.id, sequence, editingStudent.name);
                setEditingStudent(null);
                setEditingSequence("");
              }}
            />
            <button className="report-button" onClick={() => setEditingStudent(null)} type="button">
              Cancel
            </button>
          </div>
        </TeacherModal>
      )}
      </>
      )}
    </TeacherPageShell>
  );
}
