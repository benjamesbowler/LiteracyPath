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
import { localProgressStorageKey } from "./utils/progressKeys.js";
import { markMissionDone } from "./utils/dailyMission.js";

const PREVIEW_SCOPE = "student-home-preview";
const PREVIEW_SCENARIO = new URLSearchParams(window.location.search).get("scenario");

setCompanion(PREVIEW_SCOPE, COMPANIONS[0].id);

if (PREVIEW_SCENARIO === "continuation") {
  const now = new Date();
  const day = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
  window.localStorage.setItem(
    localProgressStorageKey("daily_mission", PREVIEW_SCOPE),
    JSON.stringify({
      day,
      done: { quest: true, book: true, game: true },
      streak: 1,
      lastCompletedDay: day,
      shieldWeek: "",
      celebratedDay: day,
      celebratedSteps: ["quest", "book", "game"]
    })
  );
  window.localStorage.setItem(
    localProgressStorageKey("phonics_quest", PREVIEW_SCOPE),
    JSON.stringify({
      trail: {
        stopsDone: Array.from({ length: 38 }, (_, index) => `s${index + 1}`)
      }
    })
  );
}

window.__completeStudentHomeMissionStep = kind => {
  markMissionDone(PREVIEW_SCOPE, kind);
};

export function StudentHomePreview() {
  function openDestination(destination) {
    document.documentElement.dataset.studentDestination = destination;
    if (destination === "my-hollow") {
      document.documentElement.dataset.hollowOpened = "true";
    }
  }

  return (
    <div className="app student-mode-app lp-skin-sage">
      <StudentHomePage
        studentName="Aaron"
        progressScopeKey={PREVIEW_SCOPE}
        onOpenPhonicsLearn={() => openDestination("phonics-learning")}
        onOpenArcade={() => openDestination("arcade")}
        onOpenSkillsBlockQuest={() => openDestination("adventure-map")}
        onOpenSoundSeekers={() => openDestination("sound-seekers")}
        onOpenStoryQuests={() => openDestination("story-quests")}
        onOpenGuidedReading={() => openDestination("reading-library")}
        onOpenRewards={() => openDestination("my-hollow")}
        onLogout={() => openDestination("logout")}
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
