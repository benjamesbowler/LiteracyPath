import { useEffect, useMemo, useRef, useState } from "react";

import {
  ASSESSMENT_GRADE_OPTIONS,
  ASSESSMENT_STARTERS,
  ASSESSMENT_START_POINT_KINDS,
  ASSESSMENT_TIME_OF_YEAR_OPTIONS,
  defaultStartPointSelection,
  describeStartPointSelection,
  formatEstimatedMinutes,
  getAssessmentCatalogEntry,
  isStartPointSatisfied,
  listAssessmentCatalog,
  listSkillStartPoints
} from "../data/assessmentCatalog.js";
import {
  readTeacherFunnelParams,
  writeTeacherFunnelParams
} from "../appState/appViewHelpers.js";
import { useElBenchmarkStartPoint } from "./assessment/elBenchmarkStartPoint.js";
import { ElPrerequisiteReview } from "./assessment/ELAssessmentsPage.jsx";
import { TeacherFunnelStep } from "./TeacherFunnelStep.jsx";
import { TeacherSurfaceState } from "./teacher/ui/TeacherSurfaceState.jsx";

// ── ONE PAGE, ONE PATH ──────────────────────────────────────────────────────
//
// Class, student, check, starting point, Begin. Every answer stays on screen
// and stays changeable; changing an earlier one clears the ones below it,
// because a starting point chosen for one student means nothing for the next.
//
// Every answer also lives in the URL. That is the single biggest fix for
// "convoluted": the old hub had no address at all, so a reload half-way through
// dropped the teacher back on the student list with nothing chosen.

const CATALOG = listAssessmentCatalog();
const SKILL_START_POINTS = listSkillStartPoints();

function studentDisplayRows(rows = [], fallback = []) {
  const source = rows.length ? rows : fallback;
  return [...source]
    .filter(row => row?.id)
    .sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
}

export function TeacherAssessmentsPage({
  classList = [],
  selectedClassId = "",
  className = "",
  onSelectClass,
  studentRows = [],
  studentList = [],
  loadingStudents = false,
  selectedStudentId = "",
  selectedStudentName = "",
  onSelectStudent,
  onClearStudent,
  firstUnsecuredSkillIndex = 0,
  assessmentHistory = [],
  elBenchmarkDraft = null,
  onResumeDraft,
  onDiscardDraft,
  onStartSkillCheck,
  onStartLetterCheck,
  onStartPhonicsPatternCheck,
  onStartBenchmark,
  // The hash this funnel was opened with. Left undefined the page reads the
  // live URL; tests and previews pass one in so a mid-funnel state can be set
  // up the same way a reload would produce it.
  routeHash = undefined
}) {
  const params = readTeacherFunnelParams(routeHash);
  const [checkId, setCheckId] = useState(() => (
    getAssessmentCatalogEntry(params.get("check") || "") ? params.get("check") : ""
  ));
  const [grade, setGrade] = useState(() => params.get("grade") || elBenchmarkDraft?.grade || "K");
  const [timeOfYear, setTimeOfYear] = useState(() => params.get("time") || elBenchmarkDraft?.window || "BOY");
  const [band, setBand] = useState(() => params.get("band") || "");
  const [bandChosenByTeacher, setBandChosenByTeacher] = useState(() => Boolean(params.get("band")));
  // null means "not answered yet", which is not the same as skill 0. Reading a
  // missing parameter as a number gives 0, and that silently started every
  // skills check on Initial Sounds instead of on the student's next skill.
  const [skillIndex, setSkillIndex] = useState(() => {
    if (!params.has("skill")) return null;
    const fromUrl = Number(params.get("skill"));
    return Number.isInteger(fromUrl) && fromUrl >= 0 && fromUrl < SKILL_START_POINTS.length
      ? fromUrl
      : null;
  });
  const [awaitingReason, setAwaitingReason] = useState(false);
  const [editingStep, setEditingStep] = useState(0);

  const classHeadingRef = useRef(null);
  const studentHeadingRef = useRef(null);
  const checkHeadingRef = useRef(null);
  const startPointHeadingRef = useRef(null);
  const unlockedStepRef = useRef(0);

  const rows = useMemo(
    () => studentDisplayRows(studentRows, studentList),
    [studentRows, studentList]
  );
  const entry = getAssessmentCatalogEntry(checkId);
  const hasClass = Boolean(selectedClassId);
  const hasStudent = Boolean(selectedStudentId);

  const elStartPoint = useElBenchmarkStartPoint({
    assessmentHistory,
    studentId: selectedStudentId,
    assessmentId: entry?.starter === ASSESSMENT_STARTERS.EL_BENCHMARK ? entry.benchmarkId : "",
    grade,
    timeOfYear,
    band,
    bandChosenByTeacher
  });

  // The skills check opens on the skill this student is actually working on. That
  // number arrives with the student, so it cannot be read until step 2 is done.
  const effectiveSkillIndex = skillIndex ?? Math.min(
    Math.max(0, Number(firstUnsecuredSkillIndex) || 0),
    SKILL_START_POINTS.length - 1
  );
  const needsBand = entry?.startPoint.kind === ASSESSMENT_START_POINT_KINDS.GRADE_TIME_AND_BAND;
  const effectiveBand = needsBand ? (band || elStartPoint.suggestedBand) : "";
  const selection = entry
    ? {
      ...defaultStartPointSelection(entry, {
        firstUnsecuredSkillIndex: effectiveSkillIndex,
        grade,
        timeOfYear,
        suggestedBand: effectiveBand
      }),
      ...(entry.startPoint.kind === ASSESSMENT_START_POINT_KINDS.SKILL
        ? { skillIndex: effectiveSkillIndex }
        : {}),
      ...(needsBand ? { band: effectiveBand } : {})
    }
    : {};
  const startPointReady = entry ? isStartPointSatisfied(entry, selection) : false;
  const draftBlocksStart = Boolean(elBenchmarkDraft)
    && entry?.starter === ASSESSMENT_STARTERS.EL_BENCHMARK;

  // Keep the URL honest on every answer, so a refresh lands exactly here.
  useEffect(() => {
    writeTeacherFunnelParams({
      check: checkId,
      skill: entry?.startPoint.kind === ASSESSMENT_START_POINT_KINDS.SKILL && skillIndex !== null
        ? String(skillIndex)
        : "",
      grade: entry && entry.startPoint.fields.includes("grade") ? grade : "",
      time: entry && entry.startPoint.fields.includes("timeOfYear") ? timeOfYear : "",
      band: needsBand && bandChosenByTeacher ? band : ""
    });
  }, [band, bandChosenByTeacher, checkId, entry, grade, needsBand, skillIndex, timeOfYear]);

  const openStep = editingStep || (!hasClass ? 1 : !hasStudent ? 2 : !entry ? 3 : 4);

  // Focus the heading of a step as it unlocks. Without this a teacher using a
  // keyboard answers step 2 and is left at the bottom of a list with no idea
  // that a new question appeared above the fold.
  useEffect(() => {
    if (unlockedStepRef.current === openStep) return;
    const previous = unlockedStepRef.current;
    unlockedStepRef.current = openStep;
    if (!previous) return;
    const target = [null, classHeadingRef, studentHeadingRef, checkHeadingRef, startPointHeadingRef][openStep];
    target?.current?.focus({ preventScroll: true });
  }, [openStep]);

  function chooseClass(nextClassId) {
    setCheckId("");
    setSkillIndex(null);
    setBand("");
    setBandChosenByTeacher(false);
    setAwaitingReason(false);
    setEditingStep(0);
    onSelectClass?.(nextClassId || null);
  }

  function chooseStudent(row) {
    setCheckId("");
    setSkillIndex(null);
    setBand("");
    setBandChosenByTeacher(false);
    setAwaitingReason(false);
    setEditingStep(0);
    onSelectStudent?.(row.id, row.name);
  }

  function chooseCheck(nextCheckId) {
    setCheckId(nextCheckId);
    setSkillIndex(null);
    setBand("");
    setBandChosenByTeacher(false);
    setAwaitingReason(false);
    setEditingStep(0);
  }

  function begin(reasonText = "") {
    if (!entry || !startPointReady) return;
    setAwaitingReason(false);
    switch (entry.starter) {
      case ASSESSMENT_STARTERS.SKILL_CHECK:
        onStartSkillCheck?.(selection.skillIndex);
        return;
      case ASSESSMENT_STARTERS.LETTER_CHECK:
        onStartLetterCheck?.();
        return;
      case ASSESSMENT_STARTERS.PHONICS_PATTERN_CHECK:
        onStartPhonicsPatternCheck?.();
        return;
      case ASSESSMENT_STARTERS.EL_BENCHMARK:
        onStartBenchmark?.(entry.benchmarkId, elStartPoint.buildStartOptions(reasonText));
        return;
      default:
    }
  }

  function requestBegin() {
    if (entry?.starter === ASSESSMENT_STARTERS.EL_BENCHMARK && elStartPoint.needsRecordedReason) {
      setAwaitingReason(true);
      return;
    }
    begin();
  }

  const classAnswer = hasClass ? (className || "Class chosen") : "";
  const studentAnswer = hasStudent ? selectedStudentName : "";
  const checkAnswer = entry ? entry.label : "";
  const startPointAnswer = entry && startPointReady
    ? describeStartPointSelection(entry, selection)
    : "";

  return (
    <div className="teacher-product-page teacher-funnel-page" data-teacher-funnel="checks">
      <section className="teacher-page-header">
        <div>
          <p className="panel-label">Assessments</p>
          <h2>Start an assessment</h2>
          <p>
            Four questions, top to bottom. Every answer stays on screen and can be changed;
            changing one clears the answers below it.
          </p>
        </div>
      </section>

      {classList.length === 0 && selectedClassId ? (
        <TeacherSurfaceState surface="assess" state="loading" />
      ) : classList.length === 0 ? (
        <TeacherSurfaceState surface="assess" state="empty" detail="Make a class and add your students, then come back to start an assessment." />
      ) : (
        <div className="teacher-funnel">
          <TeacherFunnelStep
            answer={classAnswer}
            help="An assessment is saved against one class at a time."
            number={1}
            onChange={() => setEditingStep(1)}
            open={openStep === 1}
            ref={classHeadingRef}
            title="Choose a class"
          >
            <label className="teacher-funnel-field">
              <span>Class</span>
              <select
                onChange={event => chooseClass(event.target.value)}
                value={selectedClassId || ""}
              >
                <option value="">Choose a class</option>
                {classList.map(row => (
                  <option key={row.id} value={row.id}>{row.name}</option>
                ))}
              </select>
            </label>
          </TeacherFunnelStep>

          <TeacherFunnelStep
            answer={studentAnswer}
            help="One student at a time. The assessment opens where their saved results say to start."
            lockedReason={hasClass ? "" : "Choose a class first."}
            number={2}
            onChange={() => {
              setEditingStep(2);
              onClearStudent?.();
            }}
            open={openStep === 2}
            ref={studentHeadingRef}
            title="Choose a student"
          >
            {loadingStudents ? (
              <p className="teacher-funnel-step-help">Getting the class list…</p>
            ) : rows.length === 0 ? (
              <p className="teacher-funnel-step-help">
                No students in this class yet. Add them under Students, then come back.
              </p>
            ) : (
              <ul className="teacher-funnel-options" aria-label="Students in this class">
                {rows.map(row => (
                  <li key={row.id}>
                    <button
                      aria-pressed={row.id === selectedStudentId}
                      className="teacher-funnel-option"
                      onClick={() => chooseStudent(row)}
                      type="button"
                    >
                      <strong>{row.name}</strong>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </TeacherFunnelStep>

          <TeacherFunnelStep
            answer={checkAnswer}
            help="Pick by what you want to find out."
            lockedReason={hasStudent ? "" : "Choose a student first."}
            number={3}
            onChange={() => setEditingStep(3)}
            open={openStep === 3}
            ref={checkHeadingRef}
            title="Choose an assessment"
          >
            {elBenchmarkDraft && (
              <div className="teacher-funnel-draft" role="status">
                <div>
                  <strong>{selectedStudentName} has an unfinished assessment saved on this device.</strong>
                  <small>Finish or clear it before starting one of the four spoken-sound, spelling, word reading or reading fluency checks.</small>
                </div>
                <div className="teacher-action-list">
                  <button className="lp-button lp-button-primary" onClick={onResumeDraft} type="button">
                    Carry on with it
                  </button>
                  <button className="lp-button lp-button-secondary" onClick={onDiscardDraft} type="button">
                    Clear it
                  </button>
                </div>
              </div>
            )}
            <ul className="teacher-funnel-options teacher-funnel-cards" aria-label="Assessments you can start">
              {CATALOG.map(row => (
                <li key={row.id}>
                  <button
                    aria-pressed={row.id === checkId}
                    className="teacher-funnel-option"
                    onClick={() => chooseCheck(row.id)}
                    type="button"
                  >
                    <strong>{row.label}</strong>
                    <span>{row.description}</span>
                    <small>{formatEstimatedMinutes(row)} · {row.administration}</small>
                  </button>
                </li>
              ))}
            </ul>
          </TeacherFunnelStep>

          <TeacherFunnelStep
            help={entry?.startPoint.help || ""}
            lockedReason={entry ? "" : "Choose an assessment first."}
            number={4}
            open={openStep === 4}
            ref={startPointHeadingRef}
            title={entry?.startPoint.label || "Choose a starting point"}
          >
            {entry?.startPoint.kind === ASSESSMENT_START_POINT_KINDS.NONE && (
              <p className="teacher-funnel-step-help">
                This one always runs through the whole set, so there is nothing to choose.
              </p>
            )}

            {entry?.startPoint.kind === ASSESSMENT_START_POINT_KINDS.SKILL && (
              <label className="teacher-funnel-field">
                <span>Skill this assessment starts on</span>
                <select
                  onChange={event => setSkillIndex(Number(event.target.value))}
                  value={String(effectiveSkillIndex)}
                >
                  {SKILL_START_POINTS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            )}

            {entry?.startPoint.fields.includes("grade") && (
              <div className="teacher-funnel-field-row">
                <label className="teacher-funnel-field">
                  <span>Grade</span>
                  <select onChange={event => setGrade(event.target.value)} value={grade}>
                    {ASSESSMENT_GRADE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="teacher-funnel-field">
                  <span>Time of year</span>
                  <select onChange={event => setTimeOfYear(event.target.value)} value={timeOfYear}>
                    {ASSESSMENT_TIME_OF_YEAR_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                {needsBand && (
                  <label className="teacher-funnel-field">
                    <span>Word group it starts on</span>
                    <select
                      onChange={event => {
                        setBand(event.target.value);
                        setBandChosenByTeacher(true);
                      }}
                      value={effectiveBand}
                    >
                      {elStartPoint.bandOptions.map(option => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                      ))}
                    </select>
                    <small>{elStartPoint.bandNote}</small>
                  </label>
                )}
              </div>
            )}

            {entry?.starter === ASSESSMENT_STARTERS.EL_BENCHMARK && (
              <p className="teacher-funnel-step-help">
                Results are descriptive. No unpublished cut score is assumed.
              </p>
            )}

            {awaitingReason ? (
              <ElPrerequisiteReview
                message={elStartPoint.prerequisite.message}
                onCancel={() => setAwaitingReason(false)}
                onConfirm={begin}
                startLabel={`Begin ${entry?.label || "the assessment"}`}
              />
            ) : (
              <div className="teacher-funnel-begin">
                {startPointAnswer && (
                  <p className="teacher-funnel-step-answer">Starting at: {startPointAnswer}</p>
                )}
                {draftBlocksStart && (
                  <p className="teacher-funnel-step-locked">
                    Finish or clear the saved unfinished assessment in step 3 first.
                  </p>
                )}
                {elStartPoint.needsRecordedReason && !draftBlocksStart && (
                  <p className="teacher-funnel-step-locked">
                    This start is not the one this student&apos;s saved results point at, so you will be
                    asked to say why.
                  </p>
                )}
                <button
                  className="lp-button lp-button-primary"
                  disabled={!startPointReady || draftBlocksStart}
                  onClick={requestBegin}
                  type="button"
                >
                  Begin {entry?.label || "the assessment"}
                </button>
              </div>
            )}
          </TeacherFunnelStep>

          <p className="el-assessment-validity-note">
            The four spoken-sound, spelling, word reading and reading fluency checks are original
            Literacy Guide checks written against the supplied EL Skills Block overview. They are
            not official EL Education forms, nationally normed scores, or diagnostic tests for a
            disability.
          </p>
        </div>
      )}
    </div>
  );
}
