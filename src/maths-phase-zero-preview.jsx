/* eslint-disable react-refresh/only-export-components -- standalone preview entry */
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./App.css";
import "./styles/home-sage.css";
import "./styles/sage-subpages.css";
import "./styles/sage-soft.generated.css";
import "./styles/sage-form.css";
import "./styles/kids-glass.css";
import "./styles/kids-home.css";
import "./styles/ui-quality-pass.css";
import { APP_VIEWS } from "./appState/appViews.js";
import { Sidebar } from "./components/Sidebar.jsx";
import { StudentHomePage } from "./components/StudentHomePage.jsx";
import { MathsHome } from "./maths/learn/MathsHome.jsx";
import { MathsArcade, MathsAssessmentPlayer, MathsLessonPlayer, MathsStoryLibrary } from "./maths/learn/MathsStudentArea.jsx";
import { MathsTeacherWorkspace } from "./maths/teacher/MathsTeacherWorkspace.jsx";
import {
  SUBJECT_IDS,
  parseSubjectHomeHash,
  subjectHomeHash,
  subjectHomeView
} from "./subjects/subjectRegistry.js";
import { COMPANIONS, setCompanion } from "./utils/studentProfile.js";

const params = new URLSearchParams(window.location.search);
const audience = params.get("audience") === "student" ? "student" : "teacher";
const CLASS_ID = "00000000-0000-4000-8000-0000000000a1";
const STUDENT_ID = "maths-phase-zero-child";
const noop = () => {};
const STUDENTS = Array.from({ length: 12 }, (_, index) => ({ id: `00000000-0000-4000-9000-${String(index + 1).padStart(12, "0")}`, name: ["Aaron", "Bella", "Chen", "Dani", "Eli", "Fatima", "Grace", "Hugo", "Ivy", "Jin", "Kai", "Lina"][index] }));
const PREVIEW_ASSIGNMENT = Object.freeze({ id: "00000000-0000-4000-8000-00000000a551", skillId: "F-N-PART-10", activityType: "lesson", activityId: "F-N-PART-10-retrieve-1", title: "Make parts of ten", dueAt: null, completedAt: null });
const PREVIEW_EVIDENCE = STUDENTS.slice(0, 7).flatMap((student, studentIndex) => Array.from({ length: 3 }, (_, index) => ({ id: `${student.id}-${index}`, studentId: student.id, skillId: "F-N-PART-10", eventType: "skills_check_response", occurredAt: new Date(Date.now() - index * 86400000).toISOString(), evidence: { schemaVersion: 1, source: "maths_skills_check", representation: index % 2 ? "part_whole" : "two_colour_frame", correct: studentIndex < 4 || index === 0, classification: studentIndex < 4 || index === 0 ? "correct" : "missing_part_mismatch", observedSignals: studentIndex < 4 || index === 0 ? [] : ["missing_part_mismatch"] } })));
const mockClient = {
  call(name) {
    if (["teacher_read_maths_evidence", "teacher_read_maths_evidence_page", "teacher_read_maths_evidence_filtered_page"].includes(name)) return Promise.resolve({ data: { ok: true, events: PREVIEW_EVIDENCE, hasMore: false }, error: null });
    if (name === "teacher_read_maths_sync_health") return Promise.resolve({ data: { ok: true, learners: [{ studentId: STUDENTS[0].id, delivered: 8, pending: 0, rejected: 0, reportedAt: new Date().toISOString() }] }, error: null });
    if (name === "teacher_list_maths_assignments") return Promise.resolve({ data: { ok: true, assignments: [{ ...PREVIEW_ASSIGNMENT, assignedCount: 12, completedCount: 5, createdAt: new Date().toISOString() }] }, error: null });
    if (name === "student_list_maths_assignments") return Promise.resolve({ data: { ok: true, assignments: [PREVIEW_ASSIGNMENT] }, error: null });
    if (name === "teacher_create_maths_assignment") return Promise.resolve({ data: { ok: true, assignedCount: 12 }, error: null });
    if (name === "student_complete_maths_assignment") return Promise.resolve({ data: { ok: true }, error: null });
    return Promise.resolve({ data: { ok: true }, error: null });
  }
};

setCompanion(STUDENT_ID, COMPANIONS[0].id);

function initialView() {
  const route = parseSubjectHomeHash(window.location.hash);
  if (route?.audience === audience) return route.appView;
  return subjectHomeView(SUBJECT_IDS.LITERACY, audience);
}

function Preview() {
  const [appView, setAppView] = useState(initialView);
  const [activeAssignment, setActiveAssignment] = useState(null);

  useEffect(() => {
    const restore = () => {
      const route = parseSubjectHomeHash(window.location.hash);
      if (route?.audience === audience) setAppView(route.appView);
    };
    window.addEventListener("hashchange", restore);
    return () => window.removeEventListener("hashchange", restore);
  }, []);

  const openSubject = subjectId => {
    const nextHash = subjectHomeHash({
      subjectId,
      audience,
      classId: CLASS_ID,
      learnerId: audience === "student" ? STUDENT_ID : ""
    });
    window.history.pushState(window.history.state, "", nextHash);
    setAppView(subjectHomeView(subjectId, audience));
  };

  if (audience === "student") {
    return (
      <div className="app student-mode-app no-sidebar lp-skin-sage" data-maths-preview="student">
        {appView === APP_VIEWS.MATHS_STUDENT_HOME ? (
          <MathsHome
            studentName="Aaron"
            progressScopeKey={STUDENT_ID}
            client={mockClient}
            token="preview-token"
            onOpenLiteracy={() => openSubject(SUBJECT_IDS.LITERACY)}
            onOpenLearn={assignment => { setActiveAssignment(assignment || null); setAppView(APP_VIEWS.MATHS_LEARN); }}
            onOpenAssessment={assignment => { setActiveAssignment(assignment || null); setAppView(APP_VIEWS.MATHS_ASSESSMENT); }}
            onOpenStories={assignment => { setActiveAssignment(assignment || null); setAppView(APP_VIEWS.MATHS_STORIES); }}
            onOpenArcade={assignment => { setActiveAssignment(assignment || null); setAppView(APP_VIEWS.MATHS_ARCADE); }}
          />
        ) : appView === APP_VIEWS.MATHS_LEARN ? (
          <MathsLessonPlayer assignment={activeAssignment} client={mockClient} onHome={() => { setActiveAssignment(null); setAppView(APP_VIEWS.MATHS_STUDENT_HOME); }} progressScopeKey={STUDENT_ID} studentId={STUDENT_ID} studentName="Aaron" token="preview-token" />
        ) : appView === APP_VIEWS.MATHS_ASSESSMENT ? (
          <MathsAssessmentPlayer assignment={activeAssignment} client={mockClient} onHome={() => { setActiveAssignment(null); setAppView(APP_VIEWS.MATHS_STUDENT_HOME); }} progressScopeKey={STUDENT_ID} studentId={STUDENT_ID} studentName="Aaron" token="preview-token" />
        ) : appView === APP_VIEWS.MATHS_STORIES ? (
          <MathsStoryLibrary assignment={activeAssignment} client={mockClient} onHome={() => { setActiveAssignment(null); setAppView(APP_VIEWS.MATHS_STUDENT_HOME); }} progressScopeKey={STUDENT_ID} studentId={STUDENT_ID} studentName="Aaron" token="preview-token" />
        ) : appView === APP_VIEWS.MATHS_ARCADE ? (
          <MathsArcade assignment={activeAssignment} client={mockClient} onHome={() => { setActiveAssignment(null); setAppView(APP_VIEWS.MATHS_STUDENT_HOME); }} progressScopeKey={STUDENT_ID} studentId={STUDENT_ID} studentName="Aaron" token="preview-token" />
        ) : (
          <StudentHomePage
            studentName="Aaron"
            progressScopeKey={STUDENT_ID}
            approvedBookIds={[]}
            taughtTargetKeys={[]}
            onOpenPhonicsLearn={noop}
            onOpenArcade={noop}
            onOpenSkillsBlockQuest={noop}
            onOpenSoundSeekers={noop}
            onOpenStoryQuests={noop}
            onOpenGuidedReading={noop}
            onOpenRewards={noop}
            onOpenMaths={() => openSubject(SUBJECT_IDS.MATHS)}
            onLogout={noop}
          />
        )}
      </div>
    );
  }

  return (
    <div className="lg-app-shell" data-maths-preview="teacher">
      <Sidebar
        appView={appView}
        nameSaved={false}
        className="Audit Class A"
        teacherEmail="teacher@example.invalid"
        goToTeacherDashboard={() => openSubject(SUBJECT_IDS.LITERACY)}
        goToTeacherClasses={noop}
        goToTeacherAssessments={noop}
        goToTeacherReports={noop}
        goToTeacherResources={noop}
        goToTeacherSettings={noop}
        goToLiteracyHome={() => openSubject(SUBJECT_IDS.LITERACY)}
        goToMathsHome={() => openSubject(SUBJECT_IDS.MATHS)}
        goToMathsAssessments={() => setAppView(APP_VIEWS.MATHS_TEACHER_ASSESSMENTS)}
        goToMathsReports={() => setAppView(APP_VIEWS.MATHS_TEACHER_REPORTS)}
        goToMathsResources={() => setAppView(APP_VIEWS.MATHS_TEACHER_RESOURCES)}
        goToMathsPresent={() => setAppView(APP_VIEWS.MATHS_PRESENT)}
        goToMathsWorksheets={() => setAppView(APP_VIEWS.MATHS_WORKSHEETS)}
        goToMathsGroups={() => setAppView(APP_VIEWS.MATHS_SMALL_GROUPS)}
        logOutTeacher={noop}
      />
      <div className="lg-content-area">
        <div className="app">
          {[
            APP_VIEWS.MATHS_TEACHER_DASHBOARD,
            APP_VIEWS.MATHS_TEACHER_ASSESSMENTS,
            APP_VIEWS.MATHS_TEACHER_REPORTS,
            APP_VIEWS.MATHS_TEACHER_RESOURCES,
            APP_VIEWS.MATHS_PRESENT,
            APP_VIEWS.MATHS_WORKSHEETS,
            APP_VIEWS.MATHS_SMALL_GROUPS
          ].includes(appView) ? (
            <MathsTeacherWorkspace
              classId={CLASS_ID}
              className="Audit Class A"
              client={mockClient}
              mode={{
                [APP_VIEWS.MATHS_TEACHER_DASHBOARD]: "overview",
                [APP_VIEWS.MATHS_TEACHER_ASSESSMENTS]: "assessments",
                [APP_VIEWS.MATHS_TEACHER_REPORTS]: "reports",
                [APP_VIEWS.MATHS_TEACHER_RESOURCES]: "resources",
                [APP_VIEWS.MATHS_PRESENT]: "present",
                [APP_VIEWS.MATHS_WORKSHEETS]: "worksheets",
                [APP_VIEWS.MATHS_SMALL_GROUPS]: "groups"
              }[appView]}
              onNavigate={mode => setAppView({ overview: APP_VIEWS.MATHS_TEACHER_DASHBOARD, assessments: APP_VIEWS.MATHS_TEACHER_ASSESSMENTS, reports: APP_VIEWS.MATHS_TEACHER_REPORTS, resources: APP_VIEWS.MATHS_TEACHER_RESOURCES, present: APP_VIEWS.MATHS_PRESENT, worksheets: APP_VIEWS.MATHS_WORKSHEETS, groups: APP_VIEWS.MATHS_SMALL_GROUPS }[mode] || APP_VIEWS.MATHS_TEACHER_DASHBOARD)}
              studentCount={STUDENTS.length}
              students={STUDENTS}
              teacherId="00000000-0000-4000-8000-0000000000f1"
            />
          ) : (
            <main className="maths-preview-literacy" data-preview-literacy-home="true">
              <p className="maths-kicker">Literacy</p>
              <h1>Literacy teacher home</h1>
              <p>The existing Literacy destination remains unchanged.</p>
            </main>
          )}
        </div>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
const root = import.meta.hot?.data.root || createRoot(rootElement);
root.render(<Preview />);

if (import.meta.hot) {
  import.meta.hot.dispose(data => {
    data.root = root;
  });
}
