import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { printPracticePack } from "../utils/worksheets/practicePack.js";
import { classHeatSummary } from "../utils/questReport.js";
import {
  allocateTeacherTodayUrgentPreviews,
  buildTeacherTodayBriefing
} from "../utils/teacherTodayBriefing.js";
import {
  PROGRESS_MIN_RESPONSES,
  buildClassAccuracySummary
} from "../utils/teacherProgressOverview.js";
import { LEARNING_EVIDENCE_POLICY } from "../policy/learningPolicy.js";
import { InterventionLoop } from "./teacher/InterventionLoop.jsx";
import { TeacherRecommendationExplanation } from "./recommendations/RecommendationExplanation.jsx";
import { ActionFeedback } from "./ActionFeedback.jsx";
import { MetricDefinition } from "./MetricDefinition.jsx";
import { TeacherSurfaceState } from "./teacher/ui/TeacherSurfaceState.jsx";
import {
  TeacherPageHeader,
  TeacherPageShell
} from "./teacher/ui/TeacherPrimitives.jsx";
import { TeacherSetupChecklist } from "./teacher/TeacherClassParts.jsx";
import {
  formatLastActive,
  latestMetricUpdate,
  useTeacherSetupState,
  useTeacherStudentRows
} from "./teacher/teacherClassModel.js";
import { supabase } from "../supabaseClient.js";
import { TEACHER_COPY, countPhrase, progressPhrase } from "../copy/teacherCopy.js";
import { getStudentRosterReadView } from "../appState/studentRosterReadState.js";
import { getClassListReadView } from "../appState/classListReadState.js";
import { getClassDashboardReadView } from "../appState/classDashboardReadState.js";

const TODAY_ZONE_PREVIEW = 3;

function verifiedClassStudentCount(classRow = {}) {
  const raw = classRow.studentCount ?? classRow.student_count;
  if (raw === null || raw === undefined || raw === "") return null;
  const count = Number(raw);
  return Number.isFinite(count) && count >= 0 ? count : null;
}

// "Today · Tuesday 28 July" — the header kicker names the day the briefing
// describes, in the reader's own timezone.
function todayKicker(now = new Date()) {
  return `Today · ${now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long"
  })}`;
}

// A zone used to print its total and then show only its preview rows with no
// hint that the rest existed. The count and the list now always agree.
function TodayZoneList({ rows, children, previewLimit = TODAY_ZONE_PREVIEW }) {
  const [expanded, setExpanded] = useState(false);
  const visibleRows = expanded ? rows : rows.slice(0, previewLimit);
  const hiddenCount = rows.length - visibleRows.length;
  return (
    <>
      <ul>{visibleRows.map(children)}</ul>
      {(hiddenCount > 0 || expanded) && (
        <button
          className="text-button teacher-today-show-all"
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(value => !value)}
        >
          {expanded ? TEACHER_COPY.common.showFewer : TEACHER_COPY.common.showAll(rows.length)}
        </button>
      )}
    </>
  );
}

function TodayMetric({ info = null, label, note = "", value }) {
  const valueText = String(value);
  return (
    <div className="teacher-today-metric">
      <span className="teacher-today-metric-label">
        {label}
        {info}
      </span>
      <strong
        className={`teacher-today-metric-value${valueText.length > 12 ? " is-text" : ""}`}
      >
        {value}
      </strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

// THE FIVE-METRIC STRIP (teacher-area redesign v2). The same figures, the same
// tooltip definitions and the same fairness rule as the Students-page class
// overview, computed from the exact rows that feed today's briefing.
// "Not enough results yet" is a first-class state — never 0%.
function TodayMetrics({ rows }) {
  const total = rows.length;
  const loginReadyCount = rows.filter(row => row.symbol_password).length;
  const startedCount = rows.filter(row => Number(row.answered) > 0).length;
  const activeTodayCount = rows.filter(
    row => formatLastActive(row.lastActive) === "Today"
  ).length;
  const missingSignInCount = total - loginReadyCount;
  const accuracySummary = useMemo(
    () => buildClassAccuracySummary(rows.map(row => ({
      ...row,
      answered: row.currentAnswered,
      correct: row.currentCorrect,
      accuracy: row.currentAccuracy,
      conclusion: row.learningConclusion
    }))),
    [rows]
  );
  const updatedAt = latestMetricUpdate(rows.map(row => row.currentLastActive));
  const classDenominator = `${countPhrase(total, "student", "students")} in this class.`;

  return (
    <section
      className="teacher-today-metrics"
      aria-label={TEACHER_COPY.metrics.summaryAriaLabel}
      data-teacher-priority="class-pulse"
    >
      <TodayMetric label={TEACHER_COPY.metrics.students} value={total} />
      <TodayMetric
        label={TEACHER_COPY.metrics.readyToSignIn}
        note={missingSignInCount > 0
          ? TEACHER_COPY.setup.signInGapTitle(missingSignInCount)
          : ""}
        value={progressPhrase(loginReadyCount, total)}
      />
      <TodayMetric
        info={(
          <MetricDefinition
            metricId="started"
            denominator={classDenominator}
            updatedAt={updatedAt}
          />
        )}
        label={TEACHER_COPY.metrics.havePlayed}
        value={progressPhrase(startedCount, total)}
      />
      <TodayMetric
        info={(
          <MetricDefinition
            metricId="active"
            denominator={classDenominator}
            updatedAt={updatedAt}
          />
        )}
        label={TEACHER_COPY.metrics.playedToday}
        value={progressPhrase(activeTodayCount, total)}
      />
      <TodayMetric
        info={(
          <MetricDefinition
            metricId="accuracy"
            denominator={`${countPhrase(accuracySummary.policyReadyLearnerCount, "student", "students")} with at least ${PROGRESS_MIN_RESPONSES} scored answers each.`}
            dateRange={`Scored answers from the last ${LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays} days.`}
            updatedAt={updatedAt}
          />
        )}
        label={TEACHER_COPY.metrics.classAccuracy}
        note={accuracySummary.headlineAccuracy === null
          ? ""
          : TEACHER_COPY.metrics.equalChildren}
        value={accuracySummary.headlineAccuracy === null
          ? TEACHER_COPY.metrics.notEnough
          : `${accuracySummary.headlineAccuracy}%`}
      />
    </section>
  );
}

function TodayBriefing({
  rows,
  onLoadStudent,
  onOpenClasses,
  onStartCheck,
  onOpenProgress
}) {
  const briefing = useMemo(() => buildTeacherTodayBriefing(rows), [rows]);
  const policy = briefing.policy;
  const urgentPreviews = allocateTeacherTodayUrgentPreviews({
    attentionCount: briefing.attention.length,
    dueCount: briefing.due.length,
    maximum: TODAY_ZONE_PREVIEW
  });

  const attentionZone = (
    <>
      {briefing.attention.length ? (
        <TodayZoneList
          previewLimit={urgentPreviews.attention}
          rows={briefing.attention}
        >
          {row => (
            <li key={row.id}>
              <div>
                <div className="teacher-today-row-title">
                  <strong>{row.name}</strong>
                  <span className="teacher-today-pill is-support">
                    {TEACHER_COPY.reports.needsTeachingTitle}
                  </span>
                </div>
                <span className="teacher-today-row-focus">{row.focus}</span>
                <small>{row.evidence}</small>
                <TeacherRecommendationExplanation
                  explanation={row.explanation}
                  surface="teacher-today"
                />
              </div>
              <div className="teacher-today-row-actions">
                <button
                  className="lp-button lp-button-primary teacher-start-check"
                  type="button"
                  aria-label={`Assess ${row.name}`}
                  onClick={() => onStartCheck?.(row)}
                >
                  Assess
                </button>
                <button
                  className="lp-button teacher-today-ghost"
                  type="button"
                  aria-label={`Open ${row.name}`}
                  onClick={() => onLoadStudent?.(row.id, row.name)}
                >
                  Open student
                </button>
              </div>
            </li>
          )}
        </TodayZoneList>
      ) : (
        <p className="teacher-today-empty">No student needs a review from the results saved so far.</p>
      )}
      {briefing.insufficientEvidenceCount > 0 && (
        <p className="teacher-today-evidence-note">
          {countPhrase(briefing.insufficientEvidenceCount, "student has", "students have")} too few answers for a fair suggestion yet.
        </p>
      )}
    </>
  );

  // Day one, every student is due a first check. That is one sentence and one
  // button, not a scrolling list of every name in the class.
  const dueZone = briefing.allFirstCheckDue ? (
    <div className="teacher-today-first-day">
      <p>
        {countPhrase(briefing.due.length, "student is", "students are")} waiting on a
        first assessment. Nothing is saved yet, so there is nothing to review.
      </p>
      <button
        className="lp-button lp-button-primary teacher-start-check"
        type="button"
        onClick={() => onStartCheck?.(briefing.due[0])}
      >
        Do the first assessment
      </button>
    </div>
  ) : briefing.due.length ? (
    <>
      <ul>
        {briefing.due.slice(0, urgentPreviews.due).map(row => (
          <li key={row.id}>
            <div>
              <div className="teacher-today-row-title">
                <strong>{row.name}</strong>
                <span className="teacher-today-pill">{row.title}</span>
              </div>
              <small>{row.evidence}</small>
              <TeacherRecommendationExplanation
                explanation={row.explanation}
                surface="teacher-today"
              />
            </div>
            <div className="teacher-today-row-actions">
              <button
                className="lp-button lp-button-secondary teacher-start-check"
                type="button"
                aria-label={`Assess ${row.name}`}
                onClick={() => onStartCheck?.(row)}
              >
                Assess
              </button>
              <button
                className="lp-button teacher-today-ghost"
                type="button"
                aria-label={`Open ${row.name}`}
                onClick={() => onLoadStudent?.(row.id, row.name)}
              >
                Open student
              </button>
            </div>
          </li>
        ))}
      </ul>
      {briefing.due.length > urgentPreviews.due && (
        <button
          className="teacher-today-zone-footer"
          type="button"
          onClick={() => onOpenClasses?.()}
        >
          {TEACHER_COPY.common.showAll(briefing.due.length)}
        </button>
      )}
    </>
  ) : (
    <p className="teacher-today-empty">
      No student is due for an assessment after {policy.inactivityDueDays} days without activity.
    </p>
  );

  const changedZone = briefing.changed.length ? (
    <TodayZoneList rows={briefing.changed}>
      {row => (
        <li key={row.id}>
          <div>
            <strong>{row.name}</strong>
            <span>{row.summary}</span>
            <small>{row.comparison}</small>
          </div>
        </li>
      )}
    </TodayZoneList>
  ) : (
    <p className="teacher-today-empty">
      No new answers or newly secured skills in the last {policy.changeWindowDays} days.
    </p>
  );

  // Urgency has a stable reading order. A teacher should never have to relearn
  // where the due list moved because a different card happened to have a
  // larger count today.
  const priorityZones = [
    {
      id: "attention",
      title: "Who needs attention",
      label: "Who needs attention",
      count: briefing.attention.length,
      info: (
        <MetricDefinition
          metricId="accuracy"
          label="Needs attention today"
          counts={`Students who have answered at least ${policy.minimumResponsesForAttention} times and are getting fewer than ${policy.attentionAccuracyBelow}% of those answers right.`}
          timeWindow={`Current results from the last ${policy.conclusionWindowDays} days.`}
          excludes="Students with fewer saved answers than that, and anything the app did not score."
        />
      ),
      body: attentionZone
    },
    {
      id: "due",
      title: "What’s due",
      label: "What's due",
      count: briefing.due.length,
      info: null,
      body: dueZone
    }
  ];

  return (
    <section
      className="teacher-today-briefing"
      aria-label="Today's class briefing"
      data-teacher-priority="today-actions"
    >
      <TodayMetrics rows={rows} />

      <div className="teacher-today-grid teacher-today-priority-grid">
        {priorityZones.map(zone => (
          <section
            className={`teacher-today-zone ${zone.id}`}
            aria-label={zone.label}
            key={zone.id}
          >
            <div className="teacher-today-zone-head">
              <span className="teacher-today-zone-title">
                {zone.title}
                {zone.info}
              </span>
              <strong>{zone.count}</strong>
            </div>
            {zone.body}
          </section>
        ))}
      </div>

      <ClassHeatPanel rows={rows} onOpenReports={onOpenProgress} />

      <details className="teacher-today-more">
        <summary>
          <span>Recent changes</span>
          <strong>{briefing.changed.length}</strong>
        </summary>
        <section className="teacher-today-zone changed" aria-label="What changed">
          {changedZone}
        </section>
      </details>
    </section>
  );
}

// THE CLASS SOUND MAP (teacher-area redesign v2). One heat tile per sound for
// the whole class — coloured by how many students still need it, with "not met
// yet" kept separate from a low score — plus concrete grouping hints:
// "sh — Sam, Maya, Leo need re-teaching" with a one-click group practice sheet
// printed at the LOWEST member's curriculum stop, so every word on it is
// decodable for every student in the group.
const SOUND_TILE_STATUS_WORDS = Object.freeze({
  "is-got-it": "got it",
  "is-almost": "almost there",
  "is-reteach": "needs re-teaching",
  "is-unseen": "not met yet"
});

function ClassHeatPanel({ rows, onOpenReports }) {
  const [note, setNote] = useState("");
  const summary = useMemo(
    () => classHeatSummary(rows
      .filter(row => row.soundSeekers)
      .map(row => ({ name: row.name, report: row.soundSeekers }))),
    [rows]
  );

  // One student is a heat map (their own panel on Students); a class view
  // needs two.
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
      console.error("Could not build the class group practice pack.", error);
      setNote("We couldn't build this group pack. Nothing was printed. Try again.");
    }
  }

  const groupSummary = summary.groups.length
    ? `${summary.groups.length} sound${summary.groups.length === 1 ? "" : "s"} could use a small group`
    : "no sound needs a group right now";

  // The tiles are a picture: colour alone must never carry a sound's status.
  // Every tile speaks its own status and counts through its accessible name,
  // the grid opens with a one-sentence overview naming every sound under its
  // status word, and the ⓘ beside the heading explains the statuses on tap.
  const soundStatusSentence = [
    ["is-reteach", "Needs re-teaching"],
    ["is-almost", "Almost there"],
    ["is-got-it", "Got it"],
    ["is-unseen", "Not met yet"]
  ]
    .map(([className, statusLabel]) => {
      const sounds = summary.tiles
        .filter(tile => severityClass(tile) === className)
        .map(tile => tile.label);
      return sounds.length ? `${statusLabel}: ${sounds.join(", ")}.` : "";
    })
    .filter(Boolean)
    .join(" ");

  const groupById = new Map(summary.groups.map(group => [group.id, group]));

  function tileNote(tile) {
    if (!tile.met) return "not met yet";
    const group = groupById.get(tile.id);
    if (group) {
      const shown = group.students.slice(0, 3);
      const extra = group.count - shown.length;
      return extra > 0 ? `${shown.join(", ")} +${extra}` : shown.join(", ");
    }
    return tile.reteach === 1 ? "needs re-teaching" : "need re-teaching";
  }

  return (
    <section className="teacher-sound-map" aria-label="Class sound map">
      <div className="teacher-sound-map-head">
        <div>
          <span className="teacher-sound-map-title">
            <strong>Class sound map and small groups</strong>
            <MetricDefinition
              metricId="accuracy"
              label="Sound status"
              counts="Each tile is one sound, with its status across the class: got it, almost there, needs re-teaching, or not met yet. Status comes from correct answers out of scored answers for that sound."
              timeWindow="All saved Sound Seekers play for this class."
              excludes="Sounds the class has not met yet — those show as not met, not as a low score."
            />
          </span>
          <p className="teacher-sound-map-summary">
            {countPhrase(summary.studentsWithEvidence, "student", "students")} with results · {groupSummary}
          </p>
        </div>
      </div>
      <div
        className="teacher-sound-map-grid"
        role="group"
        aria-label={`Class sound map. ${soundStatusSentence} ${summary.groups.length
          ? summary.groups.map(group => `${group.label}: ${countPhrase(group.count, "student", "students")} need re-teaching`).join(". ")
          : "No sound currently needs a re-teaching group."}`}
      >
        {summary.tiles.map(tile => {
          const severity = severityClass(tile);
          return (
            <button
              key={tile.id}
              type="button"
              className={`teacher-sound-tile ${severity}`}
              aria-label={`${tile.label} · ${SOUND_TILE_STATUS_WORDS[severity]} · ${tile.gotIt} got it · ${tile.almost} almost there · ${tile.reteach} need re-teaching · ${tile.unseen} not met yet. Opens class results.`}
              onClick={() => onOpenReports?.()}
            >
              <span aria-hidden="true" className="teacher-sound-tile-label">{tile.label}</span>
              <span aria-hidden="true" className="teacher-sound-tile-count">
                {tile.met ? tile.reteach : "—"}
              </span>
              <span aria-hidden="true" className="teacher-sound-tile-note">{tileNote(tile)}</span>
            </button>
          );
        })}
      </div>
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
    </section>
  );
}
// TODAY. One question: what should I do next with this class?
//
// The shared context bar above this page owns the class, school, teaching
// cycle and the global Present / Assess-a-student actions, so nothing here
// duplicates them. Changing class happens through that bar's Change link
// (Settings), which navigates away and remounts this page — no class-scoped
// state can survive into another class's view. Everything that manages the
// class — the roster, imports, sign-in cards, archiving — lives on the
// Students page. This page decides; that page does.
export function TeacherTodayPage({
  classList = [],
  classListReadState = null,
  loadingClasses = false,
  loadClasses,
  selectedClassId,
  onSelectClass,
  createClass,
  newClassName = "",
  setNewClassName,
  studentList = [],
  studentListReadState = null,
  loadingStudents = false,
  loadStudents,
  loadClassDashboard,
  classDashboard = [],
  classDashboardReadState = null,
  onLoadStudent,
  onStartCheck,
  onOpenClasses,
  onOpenProgress,
  createDemoClass,
  teacherId,
  message
}) {
  const [creatingDemo, setCreatingDemo] = useState(false);
  const [demoError, setDemoError] = useState("");
  const [creatingClass, setCreatingClass] = useState(false);
  const [createClassError, setCreateClassError] = useState("");
  const [supportFollowUpOpen, setSupportFollowUpOpen] = useState(false);
  const [supportQueueState, setSupportQueueState] = useState({
    count: 0,
    loading: true,
    unavailable: false
  });
  const supportPlannerHeadingRef = useRef(null);
  const loadStudentsRef = useRef(loadStudents);
  const loadClassDashboardRef = useRef(loadClassDashboard);
  const loadClassesRef = useRef(loadClasses);

  const classRead = getClassListReadView({
    readState: classListReadState,
    teacherId,
    legacyLoading: loadingClasses
  });
  const visibleClassList = classRead.rowsVerified ? classList : [];
  const knownSelectedClass = visibleClassList.find(row => row.id === selectedClassId) || null;
  const selectedClass = classRead.complete ? knownSelectedClass : null;
  const rosterRead = getStudentRosterReadView({
    readState: studentListReadState,
    classId: selectedClassId,
    legacyLoading: loadingStudents
  });
  const dashboardRead = getClassDashboardReadView({
    readState: classDashboardReadState,
    classId: selectedClassId
  });
  const dashboardRowsForClass = dashboardRead.rowsBelongToClass
    ? classDashboard.filter(row => (
      !classDashboardReadState?.status
      || String(row?.classId || "") === String(selectedClassId || "")
    ))
    : [];
  const studentRows = useTeacherStudentRows({
    studentList: rosterRead.rowsBelongToClass ? studentList : [],
    classDashboard: rosterRead.complete && dashboardRead.complete
      ? dashboardRowsForClass
      : []
  });
  const incompleteEvidenceRows = studentRows.filter(
    row => row.evidenceReadStatus !== "complete"
  );
  const hasIncompleteEvidence = incompleteEvidenceRows.length > 0;
  const {
    hasSetupClass,
    setupSteps,
    showSetupChecklist,
    setupComplete,
    setupEverComplete,
    studentsMissingSignIn
  } = useTeacherSetupState({
    selectedClass,
    selectedClassId,
    studentRows,
    classCount: classRead.complete ? visibleClassList.length : 0
  });

  useEffect(() => {
    loadStudentsRef.current = loadStudents;
    loadClassDashboardRef.current = loadClassDashboard;
    loadClassesRef.current = loadClasses;
  }, [loadStudents, loadClassDashboard, loadClasses]);

  useEffect(() => {
    if (!selectedClassId) return;
    if (classListReadState?.status && classListReadState.status !== "complete") return;
    loadStudentsRef.current?.(selectedClassId);
    loadClassDashboardRef.current?.(selectedClassId);
  }, [classListReadState?.status, selectedClassId]);

  const handleSupportQueueChange = useCallback(nextState => {
    const count = Number(nextState?.count || 0);
    setSupportQueueState({
      count,
      loading: Boolean(nextState?.loading),
      unavailable: Boolean(nextState?.unavailable)
    });
    if (count > 0) setSupportFollowUpOpen(true);
  }, []);

  // Every step except the last is done on the Students page, so Continue takes
  // the teacher there AND says which control to open. The checklist stays on
  // both pages, so following it never makes the map disappear.
  async function handleSetupContinue(stepId) {
    if (stepId === "assessment") {
      const learner = studentRows[0];
      if (!learner) return;
      await onStartCheck?.(learner);
      return;
    }
    onOpenClasses?.(stepId);
  }

  async function handleCreateDemo() {
    if (creatingDemo) return;
    setCreatingDemo(true);
    setDemoError("");
    try {
      const created = await createDemoClass?.();
      if (created) {
        onOpenClasses?.();
      } else {
        setDemoError("We couldn't create the sample class. Nothing was added. Try again.");
      }
    } catch {
      setDemoError("We couldn't create the sample class. Nothing was added. Try again.");
    } finally {
      setCreatingDemo(false);
    }
  }

  async function handleCreateFirstClass(event) {
    event.preventDefault();
    if (creatingClass) return;

    const cleanName = String(newClassName || "").trim().replace(/\s+/g, " ");
    if (!cleanName) {
      setCreateClassError("Enter a class name first.");
      return;
    }
    if (cleanName.length > 120) {
      setCreateClassError("Class names must be 120 characters or fewer.");
      return;
    }

    setCreatingClass(true);
    setCreateClassError("");
    try {
      const saved = await createClass?.();
      if (saved !== true) {
        setCreateClassError("We couldn't create that class. Nothing was added. Try again.");
      }
    } catch (error) {
      console.error("Could not create the first class.", error);
      setCreateClassError("We couldn't create that class. Nothing was added. Try again.");
    } finally {
      setCreatingClass(false);
    }
  }

  return (
    <TeacherPageShell
      className="teacher-dashboard-page teacher-today-page"
      product="class-dashboard"
    >
      {selectedClass && (
        <TeacherPageHeader
          className="teacher-dashboard-hero"
          eyebrow={todayKicker()}
          title={TEACHER_COPY.today.title}
          description={TEACHER_COPY.today.description}
        />
      )}

      <ActionFeedback className="teacher-dashboard-message" message={message} />
      <ActionFeedback
        className="teacher-dashboard-message"
        kind="error"
        message={demoError}
      />
      <ActionFeedback
        className="teacher-dashboard-message"
        kind="error"
        message={createClassError}
      />

      {classRead.complete && visibleClassList.length > 0 && !selectedClass && (
        <section className="teacher-class-gate" aria-labelledby="teacher-class-gate-title">
          <div className="teacher-class-gate-copy">
            <p>Start here</p>
            <h2 id="teacher-class-gate-title">Choose your class</h2>
            <span>Choose a class to see today’s dashboard, priorities and student results.</span>
          </div>
          <div className="teacher-class-gate-grid">
            {visibleClassList.map((classRow, index) => {
              const count = verifiedClassStudentCount(classRow);
              return (
                <button
                  key={classRow.id}
                  type="button"
                  className={index === 0 ? "is-first" : ""}
                  onClick={() => onSelectClass?.(classRow.id)}
                >
                  <strong>{classRow.name || "Untitled class"}</strong>
                  {count !== null && (
                    <span>{count} student{count === 1 ? "" : "s"}</span>
                  )}
                  <em>Open class →</em>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {classRead.complete && visibleClassList.length === 0 && !selectedClass && (
        <section
          className="teacher-class-gate teacher-first-class-gate"
          aria-labelledby="teacher-first-class-title"
        >
          <div className="teacher-class-gate-copy">
            <p>First setup</p>
            <h2 id="teacher-first-class-title">Create your first class</h2>
            <span>
              Name the class your students will join. You can add students and
              print their sign-in cards next.
            </span>
          </div>
          <form
            className="teacher-first-class-form"
            aria-busy={creatingClass}
            onSubmit={handleCreateFirstClass}
          >
            <label htmlFor="teacher-first-class-name">Class name</label>
            <input
              id="teacher-first-class-name"
              autoComplete="off"
              autoFocus
              disabled={creatingClass}
              maxLength={120}
              value={newClassName}
              placeholder="For example, Willow Class"
              onChange={event => {
                setNewClassName?.(event.target.value);
                setCreateClassError("");
              }}
            />
            <button
              className="lp-button lp-button-primary"
              disabled={creatingClass || !String(newClassName || "").trim()}
              type="submit"
            >
              {creatingClass ? "Creating class…" : "Create class"}
            </button>
            <small>
              This becomes your active class immediately. You can create more
              classes later from Students.
            </small>
          </form>
        </section>
      )}

      <>
      {selectedClass && classRead.complete
        && (!selectedClass || (rosterRead.complete && dashboardRead.complete))
        && showSetupChecklist && (
        <TeacherSetupChecklist
          hasClass={hasSetupClass}
          steps={setupSteps}
          onContinue={handleSetupContinue}
          onCreateDemo={createDemoClass ? handleCreateDemo : null}
          creatingDemo={creatingDemo}
        />
      )}

      {selectedClass && rosterRead.complete && (setupComplete || setupEverComplete) && studentsMissingSignIn.length > 0 && (
        <section className="teacher-setup-signin-gap" aria-label={TEACHER_COPY.setup.signInGapTitle(studentsMissingSignIn.length)}>
          <div>
            <strong>{TEACHER_COPY.setup.signInGapTitle(studentsMissingSignIn.length)}</strong>
            <p>{TEACHER_COPY.setup.signInGapBody}</p>
          </div>
          <button
            className="lp-button lp-button-primary"
            type="button"
            onClick={() => onOpenClasses?.("sign-in-all")}
          >
            {TEACHER_COPY.setup.signInGapAction}
          </button>
        </section>
      )}

      {classRead.loading && (
        <TeacherSurfaceState surface="today" state="loading" />
      )}

      {classRead.failed && (
        <TeacherSurfaceState
          surface="today"
          state="partial"
          detail={classRead.truncated
            ? "The full class list reached its safety limit. No missing class is being treated as absent."
            : "The class list could not be confirmed. No class or student is being treated as missing."}
          onPrimaryAction={() => loadClassesRef.current?.()}
        />
      )}

      {classRead.complete && selectedClass && rosterRead.loading && (
        <TeacherSurfaceState surface="today" state="loading" />
      )}

      {classRead.complete && selectedClass && rosterRead.incomplete && (
        <TeacherSurfaceState
          surface="today"
          state="partial"
          detail={rosterRead.reason === "truncated"
            ? "The student list was larger than the complete read could safely confirm. No missing student is being counted as absent."
            : "The student list could not be confirmed. No empty-class or teaching conclusion is being shown."}
          onPrimaryAction={() => {
            loadStudentsRef.current?.(selectedClassId);
            loadClassDashboardRef.current?.(selectedClassId);
          }}
        />
      )}

      {classRead.complete && selectedClass && rosterRead.complete && dashboardRead.loading && (
        <TeacherSurfaceState surface="today" state="loading" />
      )}

      {classRead.complete && selectedClass && rosterRead.complete && dashboardRead.failed && (
        <TeacherSurfaceState
          surface="today"
          state="partial"
          detail={dashboardRead.truncated
            ? "The full set of class results reached its safety limit. No missing result is being counted as zero."
            : "Class results could not be confirmed. No earlier class figure is being reused for today's suggestions."}
          onPrimaryAction={() => loadClassDashboardRef.current?.(selectedClassId)}
        />
      )}

      {selectedClass && rosterRead.complete && dashboardRead.complete && hasIncompleteEvidence && (
        <TeacherSurfaceState
          compact
          surface="today"
          state="partial"
          detail={`${countPhrase(incompleteEvidenceRows.length, "student has", "students have")} results that need loading again.`}
          onPrimaryAction={() => loadClassDashboardRef.current?.(selectedClassId)}
        />
      )}

      {selectedClass && rosterRead.complete && dashboardRead.complete && !hasIncompleteEvidence && (
        <TodayBriefing
          rows={studentRows}
          onLoadStudent={onLoadStudent}
          onStartCheck={onStartCheck}
          onOpenClasses={onOpenClasses}
          onOpenProgress={onOpenProgress}
        />
      )}

      {selectedClass && rosterRead.complete && dashboardRead.complete && (
        <details
          className="teacher-dashboard-secondary"
          open={supportFollowUpOpen || supportQueueState.loading}
          onToggle={event => {
            // Keep the section visible while its saved plans are being checked.
            // Otherwise a reload can briefly collapse the only place that tells
            // a teacher whether dated follow-up work has returned to Today.
            if (!supportQueueState.loading) {
              setSupportFollowUpOpen(event.currentTarget.open);
            }
          }}
        >
          <summary>
            Support follow-up
            {supportQueueState.loading
              ? " · checking"
              : supportQueueState.unavailable
                ? " · needs reloading"
                : supportQueueState.count > 0
                  ? ` · ${supportQueueState.count} to do`
                  : ""}
          </summary>
          <InterventionLoop
            key={`${teacherId || "teacher"}:${selectedClass.id}`}
            supabase={supabase}
            teacherId={teacherId}
            classId={selectedClass.id}
            className={selectedClass.name}
            rows={studentRows}
            onTodayQueueChange={handleSupportQueueChange}
            headingRef={supportPlannerHeadingRef}
          />
        </details>
      )}
      </>
    </TeacherPageShell>
  );
}
