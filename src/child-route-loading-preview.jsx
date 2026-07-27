import { lazy, Suspense } from "react";
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
import { RouteLoadingFallback } from "./components/RouteLoadingFallback.jsx";
import { localProgressStorageKey } from "./utils/progressKeys.js";

const params = new URLSearchParams(window.location.search);
const SURFACE_ID = params.get("surface") || "sound-seekers";
const DELAY_MS = Math.max(0, Number(params.get("delay")) || 1200);
const PREVIEW_SCOPE = "child-route-loading-preview";

window.localStorage.removeItem(localProgressStorageKey("phonics_quest", PREVIEW_SCOPE));

const SURFACES = Object.freeze({
  "sound-seekers": {
    label: "Loading Sound Seekers...",
    load: async () => {
      const module = await import("./components/quest/QuestRoot.jsx");
      return {
        default: () => (
          <module.default
            disableAdaptiveQuality
            isSoundEnabled={false}
            previewForce2d
            progressScopeKey={PREVIEW_SCOPE}
          />
        )
      };
    }
  },
  "story-quests": {
    label: "Loading Story Quest...",
    load: async () => {
      const module = await import("./components/LearnAreaPage.jsx");
      return { default: () => <module.LearnAreaPage progressScopeKey={PREVIEW_SCOPE} /> };
    }
  },
  "reading-library": {
    label: "Loading Reading Library...",
    load: async () => {
      const module = await import("./components/guided-reading/GuidedReadingPage.jsx");
      return {
        default: () => (
          <module.GuidedReadingPage
            guidedReadingRecords={{}}
            mode="student"
            saveGuidedReadingRecord={() => {}}
            speakText={() => {}}
            studentId={PREVIEW_SCOPE}
            studentName="Aaron"
          />
        )
      };
    }
  },
  "my-hollow": {
    label: "Loading your Hollow...",
    load: async () => {
      const module = await import("./components/HollowPage.jsx");
      return {
        default: () => (
          <module.HollowPage studentName="Aaron" progressScopeKey={PREVIEW_SCOPE} />
        )
      };
    }
  }
});

const route = SURFACES[SURFACE_ID] || SURFACES["sound-seekers"];
const DeferredSurface = lazy(async () => {
  await new Promise(resolve => window.setTimeout(resolve, DELAY_MS));
  return route.load();
});

export function ChildRouteLoadingPreview() {
  return (
    <div className="app student-mode-app no-sidebar lp-skin-sage">
      <Suspense fallback={<RouteLoadingFallback label={route.label} />}>
        <DeferredSurface />
      </Suspense>
    </div>
  );
}

const rootElement = document.getElementById("root");
const root = import.meta.hot?.data.root || createRoot(rootElement);
root.render(<ChildRouteLoadingPreview />);

if (import.meta.hot) {
  import.meta.hot.dispose(data => {
    data.root = root;
  });
}
