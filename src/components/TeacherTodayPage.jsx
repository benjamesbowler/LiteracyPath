import { useEffect, useMemo, useRef, useState } from "react";
import { printPracticePack } from "../utils/worksheets/practicePack.js";
import { classHeatSummary } from "../utils/questReport.js";
import { buildTeacherTodayBriefing } from "../utils/teacherTodayBriefing.js";
import { InterventionLoop } from "./teacher/InterventionLoop.jsx";
import { TeacherRecommendationExplanation } from "./recommendations/RecommendationExplanation.jsx";
import { ActionFeedback } from "./ActionFeedback.jsx";
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
import logoUrl from "../assets/logo.svg";

const TODAY_ZONE_PREVIEW = 4;

// A zone used to print its total and then show only the first four rows with no
// hint that the rest existed. The count and the list now always agree.
function TodayZoneList({ rows, children }) {
  const [expanded, setExpanded] = useState(false);
  const visibleRows = expanded ? rows : rows.slice(0, TODAY_ZONE_PREVIEW);
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
  onOpenClasses,
  onStartCheck,
  onOpenProgress
}) {
  const briefing = useMemo(() => buildTeacherTodayBriefing(rows), [rows]);
  const policy = briefing.policy;

  const attentionZone = (
    <>
      {briefing.attention.length ? (
        <TodayZoneList rows={briefing.attention}>
          {row => (
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
                  className="lp-button lp-button-primary teacher-start-check"
                  type="button"
                  onClick={() => onStartCheck?.(row)}
                >
                  Check
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
      <ClassHeatPanel rows={rows} />
    </>
  );

  // Day one, every student is due a first check. That is one sentence and one
  // button, not a scrolling list of every name in the class.
  const dueZone = briefing.allFirstCheckDue ? (
    <div className="teacher-today-first-day">
      <p>
        {countPhrase(briefing.due.length, "student is", "students are")} waiting on a
        first check. Nothing is saved yet, so there is nothing to review.
      </p>
      <button
        className="lp-button lp-button-primary teacher-start-check"
        type="button"
        onClick={() => onStartCheck?.(briefing.due[0])}
      >
        Do the first check
      </button>
    </div>
  ) : briefing.due.length ? (
    <TodayZoneList rows={briefing.due}>
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
              Check
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
      No student is due for a check after {policy.inactivityDueDays} days without activity.
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
      No new answers or mastered skills in the last {policy.changeWindowDays} days.
    </p>
  );

  // Zones with something in them come first; an empty zone should never push a
  // full one below the fold. Ties keep the original reading order.
  const zones = [
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
    },
    {
      id: "changed",
      title: "What changed",
      label: "What changed",
      count: briefing.changed.length,
      body: changedZone
    }
  ].sort((left, right) => right.count - left.count);

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
          Suggestions use saved answers, never guesses. A student appears after
          {` ${policy.minimumResponsesForAttention} answers when accuracy is below ${policy.attentionAccuracyBelow}%.`}
        </p>
      </header>

      <div className="teacher-today-grid">
        {zones.map(zone => (
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

        <section className="teacher-today-zone actions" aria-label="Direct actions">
          <div className="teacher-today-zone-head">
            <span>Direct actions</span>
          </div>
          <div className="teacher-today-direct-actions">
            <button
              className="lp-button lp-button-primary"
              type="button"
              onClick={() => onOpenClasses?.()}
            >
              Check a student
            </button>
            <button className="lp-button lp-button-secondary" type="button" onClick={onOpenProgress}>
              Review progress
            </button>
          </div>
          <p>Each action keeps the current class in context.</p>
        </section>
      </div>
    </section>
  );
}// THE CLASS SOUND MAP (REVIEW.md, Educator #7). One row of tiles for the
// whole class — coloured by how many students still need each sound — plus
// concrete grouping hints: "sh — Sam, Maya, Leo need re-teaching" with a
// one-click group practice sheet printed at the LOWEST member's curriculum
// stop, so every word on it is decodable for every student in the group.
function ClassHeatPanel({ rows }) {
  // Open by default: this panel moved from three disclosures deep inside
  // "Manage students" onto the Dashboard, where it is meant to be read, not
  // hunted for. Its heat, grouping and print logic are unchanged.
  const [open, setOpen] = useState(true);
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
            label={`Class sound map. ${summary.groups.length
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
  selectedClassId,
  setSelectedClassId,
  setStudentList,
  studentList = [],
  loadStudents,
  loadClassDashboard,
  classDashboard = [],
  onLoadStudent,
  onStartCheck,
  onOpenClasses,
  onOpenProgress,
  createDemoClass,
  teacherId,
  schoolName = "",
  hasSchool = false,
  message,
  surfaceState = "",
  surfaceStateDetail = "",
  onSurfaceStatePrimary,
  onSurfaceStateSecondary
}) {
  const [creatingDemo, setCreatingDemo] = useState(false);
  const [interventionRecommendation, setInterventionRecommendation] = useState(null);
  const loadStudentsRef = useRef(loadStudents);
  const loadClassDashboardRef = useRef(loadClassDashboard);

  const selectedClass = classList.find(row => row.id === selectedClassId) || null;
  const studentRows = useTeacherStudentRows({ studentList, classDashboard });
  const {
    hasSetupClass,
    setupSteps,
    showSetupChecklist,
    setupComplete,
    setupEverComplete,
    studentsMissingSignIn
  } = useTeacherSetupState({ selectedClass, selectedClassId, studentRows });
  const className = selectedClass?.name || "No class selected";

  useEffect(() => {
    loadStudentsRef.current = loadStudents;
    loadClassDashboardRef.current = loadClassDashboard;
  }, [loadStudents, loadClassDashboard]);

  useEffect(() => {
    if (!selectedClassId) return;
    loadStudentsRef.current?.(selectedClassId);
    loadClassDashboardRef.current?.(selectedClassId);
  }, [selectedClassId]);

  function handleClassChange(event) {
    const nextClassId = event.target.value || null;
    setSelectedClassId?.(nextClassId);
    setStudentList?.([]);
  }

  // Every step except the last is done on the Students page, so Continue takes
  // the teacher there AND says which control to open. The checklist stays on
  // both pages, so following it never makes the map disappear.
  async function handleSetupContinue(stepId) {
    if (stepId === "check") {
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
    try {
      const created = await createDemoClass?.();
      if (created) onOpenClasses?.();
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
        description={selectedClass
          ? TEACHER_COPY.today.descriptionWithClass(selectedClass.name)
          : TEACHER_COPY.today.descriptionWithoutClass}
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

      {surfaceState ? (
        <TeacherSurfaceState
          surface="today"
          state={surfaceState}
          detail={surfaceStateDetail}
          onPrimaryAction={onSurfaceStatePrimary}
          onSecondaryAction={onSurfaceStateSecondary}
        />
      ) : (
      <>
      {showSetupChecklist && (
        <TeacherSetupChecklist
          hasClass={hasSetupClass}
          steps={setupSteps}
          onContinue={handleSetupContinue}
          onCreateDemo={createDemoClass ? handleCreateDemo : null}
          creatingDemo={creatingDemo}
        />
      )}

      {selectedClass && (setupComplete || setupEverComplete) && studentsMissingSignIn.length > 0 && (
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
      </section>

      {selectedClass && (
        <TodayBriefing
          rows={studentRows}
          onLoadStudent={onLoadStudent}
          onStartCheck={onStartCheck}
          onPlanIntervention={row => setInterventionRecommendation({
            id: row.id,
            name: row.name,
            focus: row.focus
          })}
          onOpenClasses={onOpenClasses}
          onOpenProgress={onOpenProgress}
        />
      )}

      {selectedClass && (
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
      </>
      )}
    </TeacherPageShell>
  );
}
