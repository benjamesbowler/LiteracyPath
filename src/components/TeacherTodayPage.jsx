import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { printPracticePack } from "../utils/worksheets/practicePack.js";
import { classHeatSummary } from "../utils/questReport.js";
import {
  allocateTeacherTodayUrgentPreviews,
  buildTeacherTodayBriefing
} from "../utils/teacherTodayBriefing.js";
import { InterventionLoop } from "./teacher/InterventionLoop.jsx";
import { TeacherRecommendationExplanation } from "./recommendations/RecommendationExplanation.jsx";
import { ActionFeedback } from "./ActionFeedback.jsx";
import { MetricDefinition } from "./MetricDefinition.jsx";
import { TeacherSurfaceState } from "./teacher/ui/TeacherSurfaceState.jsx";
import {
  TeacherChart,
  TeacherPageHeader,
  TeacherPageShell
} from "./teacher/ui/TeacherPrimitives.jsx";
import { TeacherSetupChecklist } from "./teacher/TeacherClassParts.jsx";
import {
  useTeacherSetupState,
  useTeacherStudentRows
} from "./teacher/teacherClassModel.js";
import { supabase } from "../supabaseClient.js";
import { TEACHER_COPY, countPhrase } from "../copy/teacherCopy.js";
import { getStudentRosterReadView } from "../appState/studentRosterReadState.js";
import { getClassListReadView } from "../appState/classListReadState.js";
import { getClassDashboardReadView } from "../appState/classDashboardReadState.js";
import logoUrl from "../assets/logo.svg";

const TODAY_ZONE_PREVIEW = 3;

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
}function TodayBriefing({
  rows,
  onLoadStudent,
  onPlanIntervention,
  onOpenAssessments,
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
                <strong>{row.name}</strong>
                <span>{row.focus}</span>
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
                  onClick={() => onStartCheck?.(row)}
                >
                  Assess
                </button>
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
    <TodayZoneList previewLimit={urgentPreviews.due} rows={briefing.due}>
      {row => (
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
          <div className="teacher-today-row-actions">
            <button
              className="lp-button lp-button-primary teacher-start-check"
              type="button"
              onClick={() => onStartCheck?.(row)}
            >
              Assess
            </button>
            <button
              className="text-button"
              type="button"
              onClick={() => onLoadStudent?.(row.id, row.name)}
            >
              Open {row.name}
            </button>
          </div>
        </li>
      )}
    </TodayZoneList>
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
      body: attentionZone
    },
    {
      id: "due",
      title: "What\u2019s due",
      label: "What's due",
      count: briefing.due.length,
      body: dueZone
    }
  ];

  return (
    <section
      className="teacher-today-briefing"
      aria-label="Today's class briefing"
      data-teacher-priority="today-actions"
    >
      <header className="teacher-today-briefing-head">
        <div>
          <p className="panel-label">Today&apos;s briefing</p>
          <div className="teacher-today-heading-row">
            <h3>Start with these students</h3>
            <MetricDefinition
              metricId="accuracy"
              label="Needs attention today"
              counts={`Students who have answered at least ${policy.minimumResponsesForAttention} times and are getting fewer than ${policy.attentionAccuracyBelow}% of those answers right.`}
              timeWindow={`Current results from the last ${policy.conclusionWindowDays} days.`}
              excludes="Students with fewer saved answers than that, and anything the app did not score."
            />
          </div>
          <p>Up to three urgent actions are shown first. Open a section only when you need more.</p>
        </div>
        <div className="teacher-today-direct-actions" aria-label="Today shortcuts">
          <button
            className="lp-button lp-button-primary"
            type="button"
            onClick={() => onOpenAssessments?.()}
          >
            Assess a student
          </button>
          <button className="lp-button lp-button-secondary" type="button" onClick={onOpenProgress}>
            Open reports
          </button>
        </div>
      </header>

      <div className="teacher-today-grid teacher-today-priority-grid">
        {priorityZones.map(zone => (
          <section
            className={`teacher-today-zone ${zone.id}`}
            aria-label={zone.label}
            key={zone.id}
          >
            <div className="teacher-today-zone-head">
              <span>{zone.title}</span>
              <strong>{zone.count}</strong>
            </div>
            {zone.body}
          </section>
        ))}
      </div>

      <details className="teacher-today-more">
        <summary>
          <span>Recent changes</span>
          <strong>{briefing.changed.length}</strong>
        </summary>
        <section className="teacher-today-zone changed" aria-label="What changed">
          {changedZone}
        </section>
      </details>

      <ClassHeatPanel rows={rows} />
    </section>
  );
}// THE CLASS SOUND MAP (REVIEW.md, Educator #7). One row of tiles for the
// whole class — coloured by how many students still need each sound — plus
// concrete grouping hints: "sh — Sam, Maya, Leo need re-teaching" with a
// one-click group practice sheet printed at the LOWEST member's curriculum
// stop, so every word on it is decodable for every student in the group.
function ClassHeatPanel({ rows }) {
  // This is useful planning detail, but it is not a daily urgent action. Keep
  // it one tap away so the briefing remains readable without removing the
  // grouping and print tools.
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const summary = useMemo(
    () => classHeatSummary(rows
      .filter(row => row.soundSeekers)
      .map(row => ({ name: row.name, report: row.soundSeekers }))),
    [rows]
  );

  // One student is a heat map (their own panel below); a class view needs two.
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

  // The tiles are a picture: colour was the only thing carrying each sound's
  // status, and the counts behind it sat in a `title` a tablet never shows. The
  // picture's description now names every sound under its status word, and the ⓘ
  // beside the heading explains the statuses on tap.
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

  return (
    <div className="quest-heat-panel class-heat-panel">
      <div className="quest-heat-head">
        <strong>Class sound map and small groups</strong>
        <MetricDefinition
          metricId="accuracy"
          label="Sound status"
          counts="Each tile is one sound, with its status across the class: got it, almost there, needs re-teaching, or not met yet. Status comes from correct answers out of scored answers for that sound."
          timeWindow="All saved Sound Seekers play for this class."
          excludes="Sounds the class has not met yet — those show as not met, not as a low score."
        />
        <span className="muted-text">
          {countPhrase(summary.studentsWithEvidence, "student", "students")} with results · {groupSummary}
        </span>
        <button className="text-button" type="button" aria-expanded={open} onClick={() => setOpen(value => !value)}>
          {open ? "Hide" : "Show"}
        </button>
      </div>
      {open && (
        <>
          <TeacherChart
            className="quest-heat-grid"
            label={`Class sound map. ${soundStatusSentence} ${summary.groups.length
              ? summary.groups.map(group => `${group.label}: ${countPhrase(group.count, "student", "students")} need re-teaching`).join(". ")
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
// TODAY. One question: what should I do next with this class?
//
// Everything that manages the class - the roster, imports, sign-in cards,
// archiving - lives on the Students page. This page decides; that page does.
export function TeacherTodayPage({
  classList = [],
  classListReadState = null,
  loadingClasses = false,
  loadClasses,
  selectedClassId,
  setSelectedClassId,
  setStudentList,
  studentList = [],
  studentListReadState = null,
  loadingStudents = false,
  loadStudents,
  loadClassDashboard,
  classDashboard = [],
  classDashboardReadState = null,
  onLoadStudent,
  onStartCheck,
  onOpenAssessments,
  onOpenClasses,
  onOpenProgress,
  createDemoClass,
  teacherId,
  schoolName = "",
  hasSchool = false,
  message
}) {
  const [creatingDemo, setCreatingDemo] = useState(false);
  const [demoError, setDemoError] = useState("");
  const [interventionRecommendation, setInterventionRecommendation] = useState(null);
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
  const className = knownSelectedClass?.name || "No class selected";

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

  // Changing class empties the student list on the spot and the refetch lands a
  // moment later. Everything the briefing says in that gap - "no student needs a
  // review", every zone count - would be a confident zero for a class we have
  // not read yet, so the briefing waits behind the loading state instead.
  function handleClassChange(event) {
    const nextClassId = event.target.value || null;
    if (nextClassId === selectedClassId) return;
    setInterventionRecommendation(null);
    setSupportFollowUpOpen(false);
    setSupportQueueState({ count: 0, loading: true, unavailable: false });
    setSelectedClassId?.(nextClassId);
    setStudentList?.([]);
  }

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

  return (
    <TeacherPageShell
      className="teacher-dashboard-page teacher-today-page"
      product="class-dashboard"
    >
      <TeacherPageHeader
        className="teacher-dashboard-hero"
        brand={(
          <div className="teacher-page-brand">
            <img src={logoUrl} alt="" />
            <p className="panel-label">{TEACHER_COPY.today.label}</p>
          </div>
        )}
        title={TEACHER_COPY.today.title}
        description={knownSelectedClass
          ? TEACHER_COPY.today.descriptionWithClass(knownSelectedClass.name)
          : TEACHER_COPY.today.descriptionWithoutClass}
      >
        <div
          className="teacher-dashboard-context"
          aria-label={TEACHER_COPY.classes.contextLabel}
        >
          <span>School</span>
          <strong>{hasSchool ? schoolName : "Not set"}</strong>
          <small>
            {knownSelectedClass
              ? !classRead.complete
                ? "Class list needs reloading"
                : rosterRead.complete && dashboardRead.complete
                ? TEACHER_COPY.classes.childCount(studentRows.length)
                : rosterRead.incomplete
                  ? "Student list needs reloading"
                  : dashboardRead.failed
                    ? "Class progress needs reloading"
                    : "Loading class…"
              : className}
          </small>
        </div>
      </TeacherPageHeader>

      <ActionFeedback className="teacher-dashboard-message" message={message} />
      <ActionFeedback
        className="teacher-dashboard-message"
        kind="error"
        message={demoError}
      />

      <>
      {classRead.complete
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

      <section
        className="teacher-dashboard-controls teacher-today-class-control"
        aria-label="Today class"
      >
        <div className="teacher-dashboard-control-group">
          <label className="teacher-dashboard-control">
            <span>Current class</span>
            <select
              value={selectedClassId || ""}
              disabled={!classRead.complete}
              onChange={handleClassChange}
            >
              <option value="">Choose class</option>
              {visibleClassList.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

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
          onPlanIntervention={row => {
            setInterventionRecommendation({
              id: row.id,
              name: row.name,
              focus: row.focus
            });
            setSupportFollowUpOpen(true);
            window.requestAnimationFrame(() => {
              supportPlannerHeadingRef.current?.scrollIntoView?.({
                behavior: "smooth",
                block: "start"
              });
              supportPlannerHeadingRef.current?.focus?.();
            });
          }}
          onOpenAssessments={onOpenAssessments}
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
            recommendation={interventionRecommendation}
            onRecommendationConsumed={() => setInterventionRecommendation(null)}
            onTodayQueueChange={handleSupportQueueChange}
            headingRef={supportPlannerHeadingRef}
          />
        </details>
      )}
      </>
    </TeacherPageShell>
  );
}
