import { useState } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./App.css";
import { APP_VIEWS } from "./appState/appViews.js";
import { EL_BENCHMARK_IDS } from "./data/elBenchmarkAssessments.js";
import { Sidebar } from "./components/Sidebar.jsx";
import { TeacherDashboardPage } from "./components/TeacherDashboardPage.jsx";
import { TeacherIntentPage } from "./components/teacher/TeacherIntentPage.jsx";
import { FinishedReportPage } from "./components/FinishedReportPage.jsx";
import { ELBenchmarkAssessmentPage } from "./components/assessment/ELBenchmarkAssessmentPage.jsx";
import { GuidedReadingPage } from "./components/guided-reading/GuidedReadingPage.jsx";

const params = new URLSearchParams(window.location.search);
const surface = params.get("surface") || "today";
const showLearnerDrawer = params.get("learner") === "1";
const classId = "class-a";
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
    assess: APP_VIEWS.TEACHER_ASSESS,
    progress: APP_VIEWS.TEACHER_PROGRESS,
    resources: APP_VIEWS.TEACHER_RESOURCES,
    report: APP_VIEWS.FINISHED,
    assessment: APP_VIEWS.EL_BENCHMARK,
    "guided-reading": APP_VIEWS.GUIDED_READING
  }[value] || APP_VIEWS.TEACHER_DASHBOARD;
}

function Dashboard({ pageIntent }) {
  const [selectedClassId, setSelectedClassId] = useState(classId);
  const [newClassName, setNewClassName] = useState("");
  return (
    <TeacherDashboardPage
      pageIntent={pageIntent}
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
      onLoadStudent={asyncNoop}
      selectedStudentId={showLearnerDrawer ? studentId : ""}
      onClearStudent={noop}
      selectedGroupId="all"
      onSelectGroup={noop}
      onOpenClasses={noop}
      onOpenAssess={noop}
      onOpenProgress={noop}
      createClass={asyncNoop}
      regenerateClassCode={async () => ({ ok: true, accessCode: "READ43" })}
      newClassName={newClassName}
      setNewClassName={setNewClassName}
      createStudent={asyncNoop}
      teacherId=""
      classDashboard={progressRows}
      loadClassDashboard={asyncNoop}
      skillTree={[{ id: "initial_sounds", label: "Initial Sounds" }]}
      updateStudentSymbolPassword={asyncNoop}
      resetStudentSymbolPassword={asyncNoop}
      startStudentLogin={noop}
      schoolName="LiteracyPath Audit School"
      hasSchool={true}
      saveSchool={asyncNoop}
    />
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
      onOpenAssessment={noop}
      onOpenView={noop}
      onOpenReports={noop}
      onOpenGuidedReading={noop}
      onOpenStoryQuests={noop}
      onOpenWorksheets={noop}
      onOpenPresent={noop}
    />
  );
}

function Report() {
  return (
    <FinishedReportPage
      startAssessment={noop}
      openElAssessments={noop}
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
      initialBookId="level-c-nonfiction-01-bees"
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
      return <Dashboard pageIntent="classes" />;
    case "assess":
      return <Intent intent="assess" />;
    case "progress":
      return <Intent intent="progress" />;
    case "resources":
      return <Intent intent="resources" />;
    case "report":
      return <Report />;
    case "assessment":
      return <Assessment />;
    case "guided-reading":
      return <GuidedReading />;
    case "today":
    default:
      return <Dashboard pageIntent="today" />;
  }
}

export function TeacherA11yPreview() {
  const appView = viewForSurface(surface);
  const focused = surface === "assessment";
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
          goToStudentHome={noop}
          goToGuidedReading={noop}
          goToLearn={noop}
          goToReports={noop}
          goToWorksheets={noop}
          goToPresent={noop}
          goToTeacherDashboard={noop}
          goToTeacherClasses={noop}
          goToTeacherAssess={noop}
          goToTeacherProgress={noop}
          goToTeacherResources={noop}
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
