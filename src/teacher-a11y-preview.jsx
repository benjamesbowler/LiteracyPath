import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import "./styles/fonts.js";
import "./index.css";
import "./App.css";
import "./styles/ui-quality-pass.css";
import { APP_VIEWS } from "./appState/appViews.js";
import { readTeacherFunnelParams } from "./appState/appViewHelpers.js";
import { EL_BENCHMARK_IDS } from "./data/elBenchmarkAssessments.js";
import { Sidebar } from "./components/Sidebar.jsx";
import { TeacherStudentsPage } from "./components/TeacherStudentsPage.jsx";
import { TeacherTodayPage } from "./components/TeacherTodayPage.jsx";
import { TeacherIntentPage } from "./components/teacher/TeacherIntentPage.jsx";
import { teacherCycleOptions } from "./components/teacher/teacherCycleReference.js";
import { TeacherAssessmentsPage } from "./components/TeacherAssessmentsPage.jsx";
import { TeacherReportsHubPage } from "./components/TeacherReportsHubPage.jsx";
import { WorksheetGeneratorPage } from "./components/WorksheetGeneratorPage.jsx";
import { TeacherSettingsPage } from "./components/teacher/TeacherSettingsPage.jsx";
import { FinishedReportPage } from "./components/FinishedReportPage.jsx";
import { ELBenchmarkAssessmentPage } from "./components/assessment/ELBenchmarkAssessmentPage.jsx";
import { GuidedReadingPage } from "./components/guided-reading/GuidedReadingPage.jsx";
import { TrailRun } from "./components/quest/world/Encounters.jsx";
import {
  applyLearnerAccessibilityToDocument,
  learnerAccessibilityFromProfile
} from "./accessibility/learnerAccessibility.js";
import { saveStudentAccessibilitySettings } from "./data/studentRailSettings.js";
import { loadStudentProfile } from "./utils/studentProfile.js";
import { computeHydratedValue } from "./utils/progressMerge.js";

const params = new URLSearchParams(window.location.search);
const surface = params.get("surface") || "today";
const showLearnerDrawer = params.get("learner") === "1";
const previewStartsWithoutClass = params.get("class") === "none";
const previewNewTeacher = params.get("account") === "new";
const classId = "00000000-0000-4000-8000-0000000000a1";
const secondClassId = "00000000-0000-4000-8000-0000000000b2";
const teacherId = "00000000-0000-4000-8000-0000000000f1";
const studentId = "student-aarav";
const classList = [{
  id: classId,
  name: "Audit Class A",
  access_code: "READ42",
  leaderboard_scope: "class"
}];
const students = [
  {
    id: studentId,
    name: "Aarav",
    teacher_id: teacherId,
    class_id: classId,
    symbol_password: "123",
    lastActive: new Date().toISOString()
  },
  {
    id: "student-aisha",
    name: "Aisha",
    teacher_id: teacherId,
    class_id: classId,
    symbol_password: "234",
    lastActive: "2026-07-22T09:00:00.000Z"
  },
  {
    id: "student-camila",
    name: "Camila",
    teacher_id: teacherId,
    class_id: classId,
    symbol_password: "341",
    lastActive: "2026-07-21T09:00:00.000Z"
  }
];
const misconceptionPreviewAnswers = params.has("misconception") ? [
  ["2026-08-01T10:00:00Z", "pin", "pan"],
  ["2026-08-02T10:00:00Z", "pin", "pan"],
  ["2026-08-03T10:00:00Z", "pin", "pan"]
].map(([answered_at, chosen_answer, correct_answer]) => ({
  student_id: studentId,
  skill: "CVC Short Vowels",
  diagnostic_target: "cvc_short_vowels",
  chosen_answer,
  correct_answer,
  is_correct: false,
  answered_at
})) : null;
const progressRows = [
  {
    ...students[0],
    answered: 20,
    accuracy: 90,
    masteredCount: 3,
    currentSkill: "CVC Short Vowels",
    evidenceSkills: ["Initial Sounds", "Final Sounds", "CVC Short Vowels"],
    soundSeekers: {
      lastActiveAt: "2026-07-24T09:00:00.000Z",
      heat: [{
        id: "m",
        label: "m",
        stopName: "Moss Gate",
        bucket: "got-it",
        seen: 10,
        independentSeen: 10,
        accuracy: 90
      }]
    }
  },
  {
    ...students[1],
    answered: 20,
    accuracy: 30,
    masteredCount: 0,
    currentSkill: "Initial Sounds",
    evidenceSkills: ["Initial Sounds"],
    soundSeekers: {
      lastActiveAt: "2026-07-22T09:00:00.000Z",
      heat: [{
        id: "m",
        label: "m",
        stopName: "Moss Gate",
        bucket: "reteach",
        seen: 12,
        independentSeen: 12,
        accuracy: 33
      }]
    }
  },
  {
    ...students[2],
    answered: 12,
    accuracy: 75,
    masteredCount: 2,
    currentSkill: "Final Sounds",
    evidenceSkills: ["Initial Sounds", "Final Sounds"],
    soundSeekers: { heat: [] }
  }
];
const requestedStudentCount = Math.min(
  120,
  Math.max(students.length, Number(params.get("students")) || students.length)
);
const previewStudents = requestedStudentCount > students.length
  ? [
      students[0],
      ...Array.from({ length: requestedStudentCount - 1 }, (_unused, index) => {
        const number = index + 2;
        return {
          id: `student-scale-${String(number).padStart(3, "0")}`,
          name: `Learner ${String(number).padStart(3, "0")}`,
          teacher_id: teacherId,
          class_id: classId,
          symbol_password: number % 5 === 0 ? "" : "234",
          lastActive: `2026-07-${String(1 + (number % 24)).padStart(2, "0")}T09:00:00.000Z`
        };
      })
    ]
  : students;
const previewProgressRows = requestedStudentCount > progressRows.length
  ? previewStudents.map((student, index) => ({
      ...student,
      answered: 6 + (index % 18),
      accuracy: index % 4 === 0 ? 35 : 82,
      masteredCount: index % 5,
      currentSkill: index % 2 === 0 ? "Initial Sounds" : "Final Sounds",
      evidenceReadStatus: "complete",
      evidenceSkills: ["Initial Sounds"],
      soundSeekers: { heat: [] }
    }))
  : progressRows;
const requestedArchivedStudentCount = Math.min(
  120,
  Math.max(0, Number(params.get("archived")) || 0)
);
const previewArchivedStudents = Array.from(
  { length: requestedArchivedStudentCount },
  (_unused, index) => {
    const number = index + 1;
    return {
      id: `student-archived-${String(number).padStart(3, "0")}`,
      name: `Archived learner ${String(number).padStart(3, "0")}`,
      teacher_id: teacherId,
      class_id: classId,
      symbol_password: "234",
      archived_at: `2026-06-${String(1 + (index % 28)).padStart(2, "0")}T09:00:00.000Z`
    };
  }
);
const assessmentHistory = [
  {
    attemptId: "pa-audit-1",
    assessmentType: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
    skillId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
    skillName: "EL Phonological & Phonemic Awareness",
    studentId,
    studentName: "Aarav",
    classId,
    teacherId: "teacher-a",
    gradePath: "K",
    benchmarkWindow: "EOY",
    administrationStatus: "completed",
    startedAt: "2026-07-23T09:00:00.000Z",
    completedAt: "2026-07-23T09:10:00.000Z",
    questionRecords: [{
      questionId: "pa-one",
      responseStatus: "correct",
      isCorrect: true,
      metadata: { strand: "rhyme" }
    }]
  },
  {
    attemptId: "skill-audit-1",
    assessmentType: "skill_checkpoint",
    skillId: "initial_sounds",
    skillName: "Initial Sounds",
    studentId,
    studentName: "Aarav",
    classId,
    teacherId: "teacher-a",
    administrationStatus: "completed",
    startedAt: "2026-08-12T09:00:00.000Z",
    completedAt: "2026-08-12T09:05:00.000Z",
    totalQuestions: 1,
    correctCount: 1,
    questionRecords: [{
      questionId: "initial-m-one",
      itemType: "initial_sound",
      itemKey: "m",
      targetSound: "m",
      responseStatus: "correct",
      isCorrect: true,
      timestamp: "2026-08-12T09:02:00.000Z"
    }]
  },
  {
    attemptId: "letters-audit-1",
    assessmentType: "el_letter_assessment",
    skillId: "letter_names_and_sounds",
    skillName: "Letter Names and Sounds",
    studentId: "student-aisha",
    studentName: "Aisha",
    classId,
    teacherId: "teacher-a",
    administrationStatus: "completed",
    startedAt: "2026-08-15T08:00:00.000Z",
    completedAt: "2026-08-15T08:12:00.000Z",
    questionRecords: []
  },
  {
    attemptId: "decoding-audit-1",
    assessmentType: EL_BENCHMARK_IDS.DECODING,
    skillId: EL_BENCHMARK_IDS.DECODING,
    skillName: "EL Decoding",
    studentId: "student-camila",
    studentName: "Camila",
    classId,
    teacherId: "teacher-a",
    gradePath: "1",
    benchmarkWindow: "MOY",
    administrationStatus: "discontinued",
    startedAt: "2026-08-14T10:00:00.000Z",
    completedAt: "2026-08-14T10:06:00.000Z",
    questionRecords: []
  }
];
const noop = () => {};
const asyncNoop = async () => {};

function viewForSurface(value) {
  return {
    today: APP_VIEWS.TEACHER_DASHBOARD,
    classes: APP_VIEWS.TEACHER_CLASSES,
    assess: APP_VIEWS.ASSESSMENTS,
    progress: APP_VIEWS.REPORTS,
    resources: APP_VIEWS.TEACHER_RESOURCES,
    worksheets: APP_VIEWS.TEACHER_RESOURCES,
    settings: APP_VIEWS.TEACHER_SETTINGS,
    report: APP_VIEWS.FINISHED,
    assessment: APP_VIEWS.EL_BENCHMARK,
    "guided-reading": APP_VIEWS.GUIDED_READING,
    accessibility: APP_VIEWS.STUDENT_HOME
  }[value] || APP_VIEWS.TEACHER_DASHBOARD;
}

function Dashboard({ page }) {
  const [previewClassList, setPreviewClassList] = useState(
    () => previewNewTeacher ? [] : classList
  );
  const [selectedClassId, setSelectedClassId] = useState(
    previewStartsWithoutClass || previewNewTeacher ? "" : classId
  );
  const [selectedPreviewStudentId, setSelectedPreviewStudentId] = useState(
    showLearnerDrawer ? studentId : ""
  );
  const [archivedPreviewStudents, setArchivedPreviewStudents] = useState(
    () => previewArchivedStudents
  );
  const [newClassName, setNewClassName] = useState("");
  const [dashboardRows, setDashboardRows] = useState(() => previewProgressRows.map(row => ({
    ...row,
    accessibilitySettings: learnerAccessibilityFromProfile(loadStudentProfile(row.id))
  })));

  async function setAccessibilitySettings(rowStudentId, settings) {
    let writtenRow = null;
    const result = await saveStudentAccessibilitySettings({
      supabase: {
        table() {
          return {
            async upsert(row) {
              writtenRow = row;
              return { error: null };
            }
          };
        }
      },
      studentId: rowStudentId,
      settings,
      teacherId: "teacher-a",
      now: () => "2026-07-24T17:30:00.000Z"
    });
    if (!result.ok || !writtenRow) return false;
    const profile = computeHydratedValue(
      "profile",
      "__all__",
      loadStudentProfile(rowStudentId),
      writtenRow.payload
    );
    window.localStorage.setItem(`lp-student-profile:${rowStudentId}`, JSON.stringify(profile));
    window.__lpLastAccessibilityWrite = writtenRow;
    setDashboardRows(rows => rows.map(row => row.id === rowStudentId
      ? { ...row, accessibilitySettings: result.payload.accessibilitySettings }
      : row));
    window.dispatchEvent(new CustomEvent("lp-progress-hydrated", {
      detail: {
        studentId: rowStudentId,
        rows: [{ area: "profile", key: "__all__", payload: writtenRow.payload }]
      }
    }));
    return true;
  }

  if (page === "today") {
    async function createPreviewClass() {
      const cleanName = String(newClassName || "").trim().replace(/\s+/g, " ");
      if (!cleanName) return false;
      const createdClass = {
        id: "preview-first-class",
        name: cleanName,
        access_code: "FIRST1",
        leaderboard_scope: "class"
      };
      setPreviewClassList([createdClass]);
      setSelectedClassId(createdClass.id);
      setNewClassName("");
      return true;
    }

    return (
      <TeacherTodayPage
        classList={previewClassList}
        selectedClassId={selectedClassId}
        onSelectClass={setSelectedClassId}
        createClass={createPreviewClass}
        newClassName={newClassName}
        setNewClassName={setNewClassName}
        setStudentList={noop}
        studentList={previewStudents}
        loadStudents={asyncNoop}
        loadClassDashboard={asyncNoop}
        classDashboard={dashboardRows}
        onLoadStudent={asyncNoop}
        onStartCheck={asyncNoop}
        onOpenClasses={noop}
        onOpenProgress={noop}
        teacherId=""
        misconceptionAnswersSeed={misconceptionPreviewAnswers || []}
        misconceptionSeedState={params.has("misconception-error") ? "error" : "ready"}
        schoolName="Literacy Guide Audit School"
        hasSchool={true}
      />
    );
  }

  return (
    <TeacherStudentsPage
      classList={classList}
      studentList={previewStudents}
      selectedClassId={selectedClassId}
      setSelectedClassId={setSelectedClassId}
      setStudentList={noop}
      setArchivedStudentList={setArchivedPreviewStudents}
      studentList={previewStudents}
      archivedStudentList={archivedPreviewStudents}
      loadStudents={asyncNoop}
      assignQuestPractice={asyncNoop}
      clearQuestPractice={asyncNoop}
      setReducedChoiceMode={asyncNoop}
      setAccessibilitySettings={setAccessibilitySettings}
      onLoadStudent={rowStudentId => setSelectedPreviewStudentId(rowStudentId)}
      selectedStudentId={selectedPreviewStudentId}
      onClearStudent={() => setSelectedPreviewStudentId("")}
      selectedGroupId="all"
      onSelectGroup={noop}
      onStartCheck={asyncNoop}
      onOpenReport={noop}
      onOpenGuidedReading={noop}
      onOpenStoryQuests={noop}
      onOpenElFormalCheck={asyncNoop}
      onResetCheckData={asyncNoop}
      createClass={asyncNoop}
      regenerateClassCode={async () => ({ ok: true, accessCode: "READ43" })}
      newClassName={newClassName}
      setNewClassName={setNewClassName}
      createStudent={asyncNoop}
      teacherId={teacherId}
      classDashboard={dashboardRows}
      loadClassDashboard={asyncNoop}
      skillTree={[{ id: "initial_sounds", label: "Initial Sounds" }]}
      updateStudentSymbolPassword={asyncNoop}
      resetStudentSymbolPassword={asyncNoop}
      startStudentLogin={noop}
      schoolName="Literacy Guide Audit School"
      hasSchool={true}
      saveSchool={asyncNoop}
      activitySyncHealthSeedRows={[]}
      progressEvidenceClient={null}
    />
  );
}

function AccessibilityEffects() {
  const [settings] = useState(
    () => learnerAccessibilityFromProfile(loadStudentProfile(studentId))
  );
  const [records, setRecords] = useState({});

  useEffect(
    () => applyLearnerAccessibilityToDocument(settings),
    [settings]
  );

  return (
    <main
      className="student-mode-app lp-skin-sage learner-accessibility-preview"
      aria-label="Learner accessibility effects"
      data-accessibility-settings={JSON.stringify(settings)}
    >
      <h1>Aarav&apos;s learner view</h1>
      <div
        className="learner-accessibility-effect-sample"
        data-effect-sample
        style={{
          animation: "pulse 2s infinite",
          backgroundImage: "linear-gradient(135deg, rgb(46, 75, 62), rgb(130, 174, 152))"
        }}
      >
        Comfort preview
      </div>
      <section aria-label="Timed trail response">
        <TrailRun
          beat={{ target: "m", answer: "m", choices: ["m", "s", "a"], seconds: 3 }}
          extendedResponse={settings.extendedResponse}
          index={0}
          total={1}
          isSoundEnabled={false}
          onBeat={noop}
          onDone={noop}
        />
      </section>
      <GuidedReadingPage
        guidedReadingRecords={records}
        launchBookId="gr-a-26"
        mode="student"
        autoNarration={settings.narration}
        saveGuidedReadingRecord={(bookId, record) => {
          setRecords(current => ({ ...current, [bookId]: record }));
        }}
        speakText={noop}
        studentId={studentId}
        studentName="Aarav"
      />
    </main>
  );
}

function Intent({ intent }) {
  return (
    <TeacherIntentPage
      intent={intent}
      teacherId=""
      classList={classList}
      studentList={previewStudents}
      selectedClassId={classId}
      cycleId={teacherCycleOptions()[5]?.id || ""}
      onOpenGuidedReading={noop}
      onOpenWorksheets={noop}
      onOpenPresent={noop}
    />
  );
}

// The two funnels, on the a11y route ids they already had: teacher-checks and
// teacher-reports. Both used to render nothing useful here - "assess" fell
// through to Today because the intent behind it had been dead for months.
function Checks() {
  // The selected student is real state here, not a constant: the whole point of
  // the v2 Assessments screen is that changing it re-scopes the page in place
  // instead of navigating, and a frozen prop could not show that.
  const [selected, setSelected] = useState(() => ({ id: studentId, name: "Aarav" }));
  return (
    <TeacherAssessmentsPage
      classList={classList}
      selectedClassId={classId}
      className="Audit Class A"
      studentRows={previewProgressRows}
      studentList={previewStudents}
      selectedStudentId={selected.id}
      selectedStudentName={selected.name}
      onSelectStudent={(id, name) => setSelected({ id, name })}
      firstUnsecuredSkillIndex={3}
      assessmentHistory={assessmentHistory}
      assessmentHistoryReadState={{
        status: "complete",
        source: "preview",
        complete: true,
        truncated: false,
        error: null
      }}
      onStartSkillCheck={noop}
      onStartLetterCheck={noop}
      onStartPhonicsPatternCheck={noop}
      onStartBenchmark={noop}
    />
  );
}

function Reports() {
  const [selectedReportView, setSelectedReportView] = useState(
    () => readTeacherFunnelParams().get("report") || ""
  );
  return (
    <TeacherReportsHubPage
      classList={classList}
      selectedClassId={classId}
      className="Audit Class A"
      onSelectClass={asyncNoop}
      studentRows={previewProgressRows}
      studentList={previewStudents}
      selectedStudentId={studentId}
      selectedStudentName="Aarav"
      onSelectStudent={asyncNoop}
      onClearStudent={noop}
      reportView={selectedReportView}
      onSelectReportView={setSelectedReportView}
      renderStudentReport={view => (
        <section aria-label="Preview report result">
          <h3>{view}</h3>
        </section>
      )}
      renderClassReport={() => null}
    />
  );
}

function Report() {
  return (
    <FinishedReportPage
      startAssessment={noop}
      openChecks={noop}
      initialReportView="el-assessments"
      studentName="Aarav"
      className="Audit Class A"
      skillMasterySummary={[]}
      itemMastery={{}}
      assessmentHistory={assessmentHistory}
      evidenceReadState={{ status: "ready" }}
      exportStudentExcel={asyncNoop}
      exportReadingReport={asyncNoop}
      letterAssessment={[]}
      patternAssessment={[]}
      guidedReadingRecords={{}}
      storyQuestProgressScopeKey="teacher-a11y-preview"
      progressScopeKey={studentId}
      returnToTeacherDashboard={noop}
    />
  );
}

function Settings() {
  const [selectedClassId, setSelectedClassId] = useState(classId);
  const initialClassRead = params.get("settingsClassRead") || "complete";
  const initialStudentRead = params.get("settingsStudentRead") || "complete";
  const initialSchoolRead = params.get("settingsSchoolRead") || "complete";
  const [classReadStatus, setClassReadStatus] = useState(initialClassRead);
  const [studentReadStatus, setStudentReadStatus] = useState(initialStudentRead);
  const [schoolReadStatus, setSchoolReadStatus] = useState(initialSchoolRead);
  const [studentReadClassId, setStudentReadClassId] = useState(classId);
  const [studentReloadCount, setStudentReloadCount] = useState(0);
  const [settingsClasses, setSettingsClasses] = useState(() => [
    ...classList,
    {
      id: secondClassId,
      name: "Audit Class B",
      access_code: "BOOK27",
      leaderboard_scope: "class"
    }
  ]);
  const [settingsStudents] = useState(() => [
    ...students,
    {
      id: "student-diego",
      name: "Diego",
      teacher_id: teacherId,
      class_id: secondClassId,
      symbol_password: "456",
      lastActive: "2026-07-20T09:00:00.000Z"
    }
  ]);
  const heldExpiryResolverRef = useRef(null);
  const leaderboardScopeAttemptsRef = useRef(0);
  const privacySubjectRef = "a".repeat(64);
  const settingsClient = useMemo(() => ({
    call: async (operation, payload = {}) => {
      if (operation === "teacher_class_access_summary") {
        if (params.get("settingsAccessSummary") === "error") {
          return {
            data: null,
            error: new Error("Preview summary failure")
          };
        }
        return {
          data: {
            ok: true,
            allowed: 0,
            denied: 0,
            blocked: 0,
            anomaly: false
          },
          error: null
        };
      }
      if (operation === "teacher_class_access_log") {
        if (params.get("settingsAccessLog") === "success") {
          return {
            data: [{
              event_type: "login_succeeded",
              outcome: "allowed",
              occurred_at: "2026-07-27T12:00:00.000Z",
              device_label: "Classroom tablet"
            }],
            error: null
          };
        }
        return { data: [], error: null };
      }
      if (operation === "teacher_set_class_code_expiry") {
        const response = {
          data: {
            ok: true,
            access_code_expires_at: payload.p_expires_at
          },
          error: null
        };
        if (params.get("settingsMutation") !== "held") return response;
        return new Promise(resolve => {
          heldExpiryResolverRef.current = () => resolve(response);
        });
      }
      if (operation === "teacher_set_class_leaderboard_scope") {
        window.__teacherSettingsRpcCalls = [
          ...(window.__teacherSettingsRpcCalls || []),
          { operation, payload }
        ];
        leaderboardScopeAttemptsRef.current += 1;
        if (
          params.get("settingsLeaderboardScope") === "fail-once"
          && leaderboardScopeAttemptsRef.current === 1
        ) {
          return { data: null, error: new Error("Preview leaderboard scope failure") };
        }
        return {
          data: [{ leaderboard_scope: payload.p_scope }],
          error: null
        };
      }
      if (operation === "teacher_list_learner_data_rights") {
        return {
          data: {
            subjectRef: privacySubjectRef,
            requests: []
          },
          error: null
        };
      }
      if (operation === "teacher_prepare_learner_deletion") {
        return {
          data: {
            requestId: "preview-delete-request",
            subjectRef: privacySubjectRef,
            confirmationPhrase: "DELETE LEARNER DATA",
            status: "in_progress",
            dueAt: "2026-08-27T00:00:00.000Z"
          },
          error: null
        };
      }
      if (operation === "teacher_delete_learner_data_staged") {
        return {
          data: {
            requestId: "preview-delete-request",
            subjectRef: privacySubjectRef,
            status: "awaiting_local_cleanup",
            residualManagedRecords: 0
          },
          error: null
        };
      }
      if (operation === "teacher_complete_learner_deletion") {
        return {
          data: {
            requestId: "preview-delete-request",
            subjectRef: privacySubjectRef,
            status: "completed",
            residualManagedRecords: 0,
            completedAt: "2026-07-27T12:00:00.000Z"
          },
          error: null
        };
      }
      return { data: [], error: null };
    }
  }), [privacySubjectRef]);

  useEffect(() => {
    window.__teacherSettingsRpcCalls = [];
    window.__releaseSettingsMutation = () => {
      heldExpiryResolverRef.current?.();
      heldExpiryResolverRef.current = null;
    };
    return () => {
      delete window.__teacherSettingsRpcCalls;
      delete window.__releaseSettingsMutation;
    };
  }, []);

  async function reloadSettingsClasses() {
    setClassReadStatus("loading");
    await Promise.resolve();
    setClassReadStatus("complete");
    return settingsClasses;
  }

  async function reloadSettingsStudents(requestedClassId) {
    const nextAttempt = studentReloadCount + 1;
    setStudentReloadCount(nextAttempt);
    if (
      params.get("settingsStudentRefresh") === "fail-once"
      && nextAttempt === 1
    ) {
      return null;
    }
    setStudentReadClassId(requestedClassId);
    setStudentReadStatus("complete");
    return settingsStudents.filter(row => row.class_id === requestedClassId);
  }

  const classListReadState = {
    status: classReadStatus,
    teacherId,
    lastCompleteTeacherId: classReadStatus === "complete" ? teacherId : "",
    attempt: 1
  };
  const studentListReadState = {
    status: studentReadStatus,
    classId: studentReadClassId,
    lastCompleteClassId: studentReadStatus === "complete" ? studentReadClassId : "",
    reason: studentReadStatus === "truncated" ? "truncated" : "",
    attempt: 1
  };

  return (
    <TeacherSettingsPage
      client={settingsClient}
      classList={settingsClasses}
      classListReadState={classListReadState}
      loadingClasses={classReadStatus === "loading"}
      onRetryClasses={reloadSettingsClasses}
      teacherId={teacherId}
      selectedClassId={selectedClassId}
      onSelectClass={nextClassId => {
        setSelectedClassId(nextClassId);
        setStudentReadClassId(nextClassId || "");
        setStudentReadStatus(nextClassId ? "complete" : "idle");
      }}
      studentList={settingsStudents}
      studentListReadState={studentListReadState}
      loadingStudents={studentReadStatus === "loading"}
      archivedStudentList={[]}
      schoolName={schoolReadStatus === "complete"
        ? "Literacy Guide Audit School"
        : ""}
      schoolNameReadState={{
        status: schoolReadStatus,
        teacherId,
        schoolId: "preview-school",
        error: schoolReadStatus === "error"
          ? new Error("Preview school lookup failure")
          : null
      }}
      onSaveSchool={async () => true}
      onRetrySchoolName={async () => {
        setSchoolReadStatus("loading");
        await Promise.resolve();
        setSchoolReadStatus("complete");
      }}
      onRegenerateClassCode={async targetClassId => {
        const nextCode = targetClassId === classId ? "READ43" : "BOOK28";
        if (params.get("settingsCodeRefresh") === "fail") {
          setClassReadStatus("error");
          return {
            ok: true,
            accessCode: nextCode,
            refreshComplete: false
          };
        }
        setSettingsClasses(previous => previous.map(row => (
          row.id === targetClassId
            ? { ...row, access_code: nextCode }
            : row
        )));
        return {
          ok: true,
          accessCode: nextCode,
          refreshComplete: true
        };
      }}
      onReloadStudents={reloadSettingsStudents}
      onOpenStudents={noop}
      teacherEmail="audit-teacher-a@literacypath.invalid"
      profileLoaded={params.get("settingsProfile") !== "loading"}
      onSignOut={noop}
    />
  );
}

function Assessment() {
  const [session, setSession] = useState({
    assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
    formId: "form-a-v2",
    grade: "K",
    startMicrophase: "middle_partial",
    studentId,
    studentName: "Aarav",
    window: "EOY",
    responses: {}
  });
  return (
    <ELBenchmarkAssessmentPage
      session={session}
      onSessionChange={setSession}
      onComplete={asyncNoop}
      onSaveAndExit={asyncNoop}
      onCancel={noop}
    />
  );
}

function GuidedReading() {
  const [records, setRecords] = useState({});
  return (
    <GuidedReadingPage
      guidedReadingRecords={records}
      initialBookId="gr-a-26"
      mode="teacher"
      saveGuidedReadingRecord={(bookId, record) => {
        setRecords(current => ({ ...current, [bookId]: record }));
      }}
      speakText={noop}
      studentId={studentId}
      studentName="Aarav"
    />
  );
}

function Surface() {
  switch (surface) {
    case "classes":
      return <Dashboard page="classes" />;
    case "assess":
      return <Checks />;
    case "progress":
      return <Reports />;
    case "resources":
      return <Intent intent="resources" />;
    case "worksheets":
      return <WorksheetGeneratorPage className="Audit Class A" onBack={noop} />;
    case "settings":
      return <Settings />;
    case "report":
      return <Report />;
    case "assessment":
      return <Assessment />;
    case "guided-reading":
      return <GuidedReading />;
    case "accessibility":
      return <AccessibilityEffects />;
    case "today":
    default:
      return <Dashboard page="today" />;
  }
}

export function TeacherA11yPreview() {
  const appView = viewForSurface(surface);
  const classEntryPreview = surface === "today"
    && (previewStartsWithoutClass || previewNewTeacher);
  const focused = surface === "assessment"
    || surface === "accessibility"
    || classEntryPreview;
  return (
    <div
      className={`lg-app-shell${focused ? " no-sidebar assessment-fullscreen-shell" : ""}`}
      data-a11y-seed="teacher-a"
      data-preview-surface={surface}
      data-teacher-class-id={classId}
      data-teacher-learner-id={studentId}
    >
      {!focused && (
        <Sidebar
          appView={appView}
          nameSaved
          studentName="Aarav"
          className="Audit Class A"
          teacherEmail="audit-teacher-a@literacypath.invalid"
          goToTeacherDashboard={noop}
          goToTeacherClasses={noop}
          goToTeacherAssessments={noop}
          goToTeacherReports={noop}
          goToTeacherResources={noop}
          goToTeacherSettings={noop}
          logOutTeacher={noop}
        />
      )}
      <div className="lg-content-area">
        <div className={`app${
          classEntryPreview
            ? " teacher-class-entry-app no-sidebar"
            : focused ? " assessment-app no-sidebar el-benchmark-app" : ""
        }`}>
          <Surface />
        </div>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
const root = import.meta.hot?.data.root || createRoot(rootElement);
root.render(<TeacherA11yPreview />);

if (import.meta.hot) {
  import.meta.hot.dispose(data => {
    data.root = root;
  });
}
