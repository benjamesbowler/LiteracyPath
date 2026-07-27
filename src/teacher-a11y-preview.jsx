import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./App.css";
import { APP_VIEWS } from "./appState/appViews.js";
import { EL_BENCHMARK_IDS } from "./data/elBenchmarkAssessments.js";
import { Sidebar } from "./components/Sidebar.jsx";
import { TeacherStudentsPage } from "./components/TeacherStudentsPage.jsx";
import { TeacherTodayPage } from "./components/TeacherTodayPage.jsx";
import { TeacherIntentPage } from "./components/teacher/TeacherIntentPage.jsx";
import { TeacherAssessmentsPage } from "./components/TeacherAssessmentsPage.jsx";
import { TeacherReportsHubPage } from "./components/TeacherReportsHubPage.jsx";
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
const previewClient = {
  call: async () => ({ data: [], error: null })
};
const classId = "00000000-0000-4000-8000-0000000000a1";
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
    symbol_password: "1234",
    lastActive: new Date().toISOString()
  },
  {
    id: "student-aisha",
    name: "Aisha",
    symbol_password: "2341",
    lastActive: "2026-07-22T09:00:00.000Z"
  },
  {
    id: "student-camila",
    name: "Camila",
    symbol_password: "3412",
    lastActive: "2026-07-21T09:00:00.000Z"
  }
];
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
const assessmentHistory = [{
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
}];
const noop = () => {};
const asyncNoop = async () => {};

function viewForSurface(value) {
  return {
    today: APP_VIEWS.TEACHER_DASHBOARD,
    classes: APP_VIEWS.TEACHER_CLASSES,
    assess: APP_VIEWS.ASSESSMENTS,
    progress: APP_VIEWS.REPORTS,
    resources: APP_VIEWS.TEACHER_RESOURCES,
    settings: APP_VIEWS.TEACHER_SETTINGS,
    report: APP_VIEWS.FINISHED,
    assessment: APP_VIEWS.EL_BENCHMARK,
    "guided-reading": APP_VIEWS.GUIDED_READING,
    accessibility: APP_VIEWS.STUDENT_HOME
  }[value] || APP_VIEWS.TEACHER_DASHBOARD;
}

function Dashboard({ page }) {
  const [selectedClassId, setSelectedClassId] = useState(classId);
  const [newClassName, setNewClassName] = useState("");
  const [dashboardRows, setDashboardRows] = useState(() => progressRows.map(row => ({
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
    return (
      <TeacherTodayPage
        classList={classList}
        selectedClassId={selectedClassId}
        setSelectedClassId={setSelectedClassId}
        setStudentList={noop}
        studentList={students}
        loadStudents={asyncNoop}
        loadClassDashboard={asyncNoop}
        classDashboard={dashboardRows}
        onLoadStudent={asyncNoop}
        onStartCheck={asyncNoop}
        onOpenClasses={noop}
        onOpenProgress={noop}
        teacherId=""
        schoolName="LiteracyPath Audit School"
        hasSchool={true}
      />
    );
  }

  return (
    <TeacherStudentsPage
      classList={classList}
      selectedClassId={selectedClassId}
      setSelectedClassId={setSelectedClassId}
      setStudentList={noop}
      studentList={students}
      archivedStudentList={[]}
      loadStudents={asyncNoop}
      assignQuestPractice={asyncNoop}
      clearQuestPractice={asyncNoop}
      setReducedChoiceMode={asyncNoop}
      setAccessibilitySettings={setAccessibilitySettings}
      onLoadStudent={asyncNoop}
      selectedStudentId={showLearnerDrawer ? studentId : ""}
      onClearStudent={noop}
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
      teacherId=""
      classDashboard={dashboardRows}
      loadClassDashboard={asyncNoop}
      skillTree={[{ id: "initial_sounds", label: "Initial Sounds" }]}
      updateStudentSymbolPassword={asyncNoop}
      resetStudentSymbolPassword={asyncNoop}
      startStudentLogin={noop}
      schoolName="LiteracyPath Audit School"
      hasSchool={true}
      saveSchool={asyncNoop}
      activitySyncHealthSeedRows={[]}
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
      className="Audit Class A"
      classList={classList}
      selectedClassId={classId}
      onSelectClass={asyncNoop}
      progressRows={progressRows}
      selectedLearnerId={studentId}
      studentName="Aarav"
      onSelectLearner={noop}
      onClearLearner={noop}
      onOpenView={noop}
      onOpenGuidedReading={noop}
      onOpenStoryQuests={noop}
      onOpenWorksheets={noop}
      onOpenPresent={noop}
    />
  );
}

// The two funnels, on the a11y route ids they already had: teacher-checks and
// teacher-reports. Both used to render nothing useful here - "assess" fell
// through to Today because the intent behind it had been dead for months.
function Checks() {
  return (
    <TeacherAssessmentsPage
      classList={classList}
      selectedClassId={classId}
      className="Audit Class A"
      onSelectClass={asyncNoop}
      studentRows={progressRows}
      studentList={students}
      selectedStudentId={studentId}
      selectedStudentName="Aarav"
      onSelectStudent={asyncNoop}
      onClearStudent={noop}
      firstUnsecuredSkillIndex={3}
      assessmentHistory={assessmentHistory}
      onStartSkillCheck={noop}
      onStartLetterCheck={noop}
      onStartPhonicsPatternCheck={noop}
      onStartBenchmark={noop}
    />
  );
}

function Reports() {
  return (
    <TeacherReportsHubPage
      classList={classList}
      selectedClassId={classId}
      className="Audit Class A"
      onSelectClass={asyncNoop}
      studentRows={progressRows}
      studentList={students}
      selectedStudentId={studentId}
      selectedStudentName="Aarav"
      onSelectStudent={asyncNoop}
      onClearStudent={noop}
      reportView=""
      onSelectReportView={noop}
      renderStudentReport={() => null}
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
  return (
    <TeacherSettingsPage
      client={previewClient}
      classList={classList}
      selectedClassId={selectedClassId}
      onSelectClass={setSelectedClassId}
      studentList={students}
      archivedStudentList={[]}
      schoolName="LiteracyPath Audit School"
      onSaveSchool={async () => true}
      onRegenerateClassCode={async () => ({ ok: true, accessCode: "READ43" })}
      onReloadStudents={asyncNoop}
      teacherEmail="audit-teacher-a@literacypath.invalid"
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
  const focused = surface === "assessment" || surface === "accessibility";
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
        <div className={`app${focused ? " assessment-app no-sidebar el-benchmark-app" : ""}`}>
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
