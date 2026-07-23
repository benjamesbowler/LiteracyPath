import { createRoot } from "react-dom/client";

import "./index.css";
import "./App.css";
import "./styles/student-vibrant.css";
import "./styles/comic-theme.css";
import "./styles/hollow.css";
import "./styles/home-sage.css";
import "./styles/sage-subpages.css";
import "./styles/sage-soft.generated.css";
import "./styles/sage-form.css";
import { StudentHomePage } from "./components/StudentHomePage.jsx";
import { COMPANIONS, setCompanion } from "./utils/studentProfile.js";

const PREVIEW_SCOPE = "student-home-preview";
const noOp = () => {};

setCompanion(PREVIEW_SCOPE, COMPANIONS[0].id);

export function StudentHomePreview() {
  function openHollow() {
    document.documentElement.dataset.hollowOpened = "true";
  }

  return (
    <div className="app student-mode-app lp-skin-sage">
      <StudentHomePage
        studentName="Aaron"
        progressScopeKey={PREVIEW_SCOPE}
        onOpenPhonicsLearn={noOp}
        onOpenArcade={noOp}
        onOpenSkillsBlockQuest={noOp}
        onOpenSoundSeekers={noOp}
        onOpenStoryQuests={noOp}
        onOpenGuidedReading={noOp}
        onOpenRewards={openHollow}
        onLogout={noOp}
      />
    </div>
  );
}

const rootElement = document.getElementById("root");
const root = import.meta.hot?.data.root || createRoot(rootElement);
root.render(<StudentHomePreview />);

if (import.meta.hot) {
  import.meta.hot.dispose(data => {
    data.root = root;
  });
}
