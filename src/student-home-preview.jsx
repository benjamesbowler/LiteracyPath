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
import {
  COMPANIONS,
  loadStudentProfile,
  saveStudentProfile,
  setCompanion
} from "./utils/studentProfile.js";
import { localProgressStorageKey } from "./utils/progressKeys.js";
import { markMissionDone } from "./utils/dailyMission.js";

const PREVIEW_SCOPE = "student-home-preview";
const PREVIEW_SCENARIO = new URLSearchParams(window.location.search).get("scenario");

setCompanion(PREVIEW_SCOPE, COMPANIONS[0].id);

if (PREVIEW_SCENARIO === "reduced-choice") {
  saveStudentProfile(PREVIEW_SCOPE, {
    ...loadStudentProfile(PREVIEW_SCOPE),
    reducedChoiceMode: true,
    reducedChoiceModeAt: "2026-07-24T13:30:00.000Z",
    reducedChoiceModeBy: "teacher-preview"
  });
}

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

if (PREVIEW_SCENARIO === "card-states") {
  window.localStorage.setItem(
    localProgressStorageKey("phonics_quest", PREVIEW_SCOPE),
    JSON.stringify({
      assignment: {
        targets: ["m", "s"],
        note: "Teacher practice"
      },
      trail: {
        stopsDone: Array.from({ length: 38 }, (_, index) => `s${index + 1}`)
      }
    })
  );
  window.localStorage.setItem(
    localProgressStorageKey("el_quest", PREVIEW_SCOPE),
    JSON.stringify({
      cycles: {
        cycle1: { stars: 3 },
        cycle2: { stations: { first: true } }
      }
    })
  );
  window.localStorage.setItem(
    localProgressStorageKey("guided_reading", PREVIEW_SCOPE),
    JSON.stringify({
      book1: { completed: true },
      book2: {
        completedPages: 3,
        lastReadAt: "2026-07-24T08:00:00.000Z",
        readCount: 1
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
