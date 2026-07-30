import { useState } from "react";
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
// The kids-side redesign layers, in the same order main.jsx loads them. The
// child home renders inside the glass shell now, so a preview without these
// is a preview of a different page.
import "./styles/kids-glass.css";
import "./styles/kids-home.css";
import "./styles/kids-trail.css";
import "./styles/ui-quality-pass.css";
import { ElSkillsQuest } from "./components/elQuest/ElSkillsQuest.jsx";
import { GuidedReadingPage } from "./components/guided-reading/GuidedReadingPage.jsx";
import { HollowPage } from "./components/HollowPage.jsx";
import { LearnAreaPage } from "./components/LearnAreaPage.jsx";
import { PhonicsLearnPage } from "./components/PhonicsLearnPage.jsx";
import QuestRoot from "./components/quest/QuestRoot.jsx";
import { StudentAdventureMapPage } from "./components/StudentAdventureMapPage.jsx";
import { StudentHomePage } from "./components/StudentHomePage.jsx";
import { StudentSoundTrailPage } from "./components/StudentSoundTrailPage.jsx";
import { StudentLoginFlow } from "./components/StudentLoginFlow.jsx";
import { localProgressStorageKey } from "./utils/progressKeys.js";
import { COMPANIONS, setCompanion } from "./utils/studentProfile.js";

const SURFACE_ID = new URLSearchParams(window.location.search).get("surface") || "student-home";
const PREVIEW_SCOPE = "child-surface-preview";

setCompanion(PREVIEW_SCOPE, COMPANIONS[0].id);
window.localStorage.removeItem(localProgressStorageKey("phonics_quest", PREVIEW_SCOPE));
window.localStorage.removeItem(localProgressStorageKey("phonics", PREVIEW_SCOPE));
window.localStorage.removeItem(localProgressStorageKey("cvc", PREVIEW_SCOPE));
window.localStorage.removeItem(localProgressStorageKey("learn_games", PREVIEW_SCOPE));
window.localStorage.removeItem(localProgressStorageKey("el_quest", PREVIEW_SCOPE));
window.localStorage.removeItem(localProgressStorageKey("story_quests", PREVIEW_SCOPE));

const loginClient = {
  async rpc() {
    return { data: { ok: false, error: "not_found" }, error: null };
  }
};

function markDestination(destination) {
  document.documentElement.dataset.studentDestination = destination;
}

function StudentHomeSurface() {
  return (
    <StudentHomePage
      studentName="Aaron"
      progressScopeKey={PREVIEW_SCOPE}
      onOpenPhonicsLearn={() => markDestination("phonics")}
      onOpenArcade={() => markDestination("arcade")}
      onOpenSkillsBlockQuest={() => markDestination("adventure-map")}
      onOpenSoundSeekers={() => markDestination("sound-seekers")}
      onOpenStoryQuests={() => markDestination("story-quests")}
      onOpenGuidedReading={() => markDestination("reading-library")}
      onOpenRewards={() => markDestination("my-hollow")}
      onLogout={() => markDestination("logout")}
    />
  );
}

function ReadingLibrarySurface() {
  const [records, setRecords] = useState({});

  return (
    <GuidedReadingPage
      guidedReadingRecords={records}
      mode="student"
      saveGuidedReadingRecord={(bookId, nextRecord) => {
        setRecords(current => ({ ...current, [bookId]: nextRecord }));
      }}
      speakText={() => {}}
      studentId={PREVIEW_SCOPE}
      studentName="Aaron"
    />
  );
}

function Surface() {
  switch (SURFACE_ID) {
    case "student-login":
      return (
        <StudentLoginFlow
          client={loginClient}
          onTeacherEntry={() => markDestination("teacher")}
          onSessionStart={() => markDestination("student-home")}
        />
      );
    case "phonics":
      return <PhonicsLearnPage initialIsland="letters" progressScopeKey={PREVIEW_SCOPE} />;
    case "arcade":
      return <PhonicsLearnPage initialIsland="games" progressScopeKey={PREVIEW_SCOPE} />;
    // Both of these are the phase-C front doors now, which is what a child
    // actually lands on; the mode each one launches is handed in exactly as the
    // router hands it in, so the preview and the app agree.
    case "adventure-map":
      return (
        <StudentAdventureMapPage
          studentName="Aaron"
          progressScopeKey={PREVIEW_SCOPE}
          renderQuest={({ cycleId }) => (
            <ElSkillsQuest
              studentName="Aaron"
              progressScopeKey={PREVIEW_SCOPE}
              initialCycleId={cycleId}
            />
          )}
        />
      );
    case "sound-seekers":
      return (
        <StudentSoundTrailPage
          studentName="Aaron"
          progressScopeKey={PREVIEW_SCOPE}
          renderQuest={({ onExit }) => (
            <QuestRoot
              disableAdaptiveQuality
              isSoundEnabled={false}
              onExit={onExit}
              previewForce2d
              progressScopeKey={PREVIEW_SCOPE}
            />
          )}
        />
      );
    case "story-quests":
      return <LearnAreaPage progressScopeKey={PREVIEW_SCOPE} />;
    case "reading-library":
      return <ReadingLibrarySurface />;
    case "my-hollow":
      return <HollowPage studentName="Aaron" progressScopeKey={PREVIEW_SCOPE} />;
    case "student-home":
    default:
      return <StudentHomeSurface />;
  }
}

export function ChildSurfacesPreview() {
  return (
    <div
      className="app student-mode-app no-sidebar lp-skin-sage"
      data-preview-surface={SURFACE_ID}
    >
      <Surface />
    </div>
  );
}

const rootElement = document.getElementById("root");
const root = import.meta.hot?.data.root || createRoot(rootElement);
root.render(<ChildSurfacesPreview />);

if (import.meta.hot) {
  import.meta.hot.dispose(data => {
    data.root = root;
  });
}
