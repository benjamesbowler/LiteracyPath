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
import { MathsTeacherDashboard } from "./maths/teacher/MathsTeacherDashboard.jsx";
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

setCompanion(STUDENT_ID, COMPANIONS[0].id);

function initialView() {
  const route = parseSubjectHomeHash(window.location.hash);
  if (route?.audience === audience) return route.appView;
  return subjectHomeView(SUBJECT_IDS.LITERACY, audience);
}

function Preview() {
  const [appView, setAppView] = useState(initialView);

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
            onOpenLiteracy={() => openSubject(SUBJECT_IDS.LITERACY)}
          />
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
        logOutTeacher={noop}
      />
      <div className="lg-content-area">
        <div className="app">
          {appView === APP_VIEWS.MATHS_TEACHER_DASHBOARD ? (
            <MathsTeacherDashboard className="Audit Class A" studentCount={25} />
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
