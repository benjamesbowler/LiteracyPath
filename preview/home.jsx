// STUDENT HOME — THE PREVIEW HARNESS. Dev only; never bundled into the app.
//
// Same reason preview/quest.jsx exists: the home page lives behind a student
// login, and a screen nobody can look at is a screen whose layout gets written
// by guesswork. This mounts the REAL StudentHomePage with the REAL stylesheets
// against a synthetic scope — no login, no Supabase, no App.jsx — so the home
// page can be eyeballed and screenshotted by tools/shootQuest.mjs.
//
//   /preview/home.html                 the student home (sage — the only look)
//   /preview/home.html?name=Ava
//   /preview/home.html?view=tracer     recorded tracer-instruction QA

import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

// The same global layers the real app loads, in the same order. App.css is
// NOT optional here: leaving it out is exactly how the deployed build got a
// letterboxed home and centred card titles while this harness looked perfect
// — App.css's generic .app/button rules are part of the environment the page
// really lives in.
import "../src/styles/fonts.js";
import "../src/index.css";
import "../src/App.css";
import "../src/styles/student-vibrant.css";
import "../src/styles/comic-theme.css";
import "../src/styles/hollow.css";
import "../src/styles/home-sage.css";
import "../src/styles/sage-subpages.css";
import "../src/styles/sage-soft.generated.css";
import "../src/styles/phonics.css";
import "../src/styles/sage-form.css";
import "../src/styles/kids-glass.css";
import "../src/styles/kids-home.css";
import "../src/styles/kids-trail.css";
import "../src/styles/kids-library.css";
import "../src/styles/ui-quality-pass.css";

import { StudentHomePage } from "../src/components/StudentHomePage.jsx";
import StepTracer from "../src/components/learn/phonics/components/learning/StepTracer.jsx";
import { ConfettiCelebration } from "../src/components/learn/games/shared/ConfettiCelebration.jsx";
import { getLessonByLetter } from "../src/data/phonicsLessons.js";
import { setCompanion } from "../src/utils/studentProfile.js";

const params = new URLSearchParams(window.location.search);
const name = params.get("name") || "Sam";
const tracerLesson = params.get("view") === "tracer"
  ? getLessonByLetter(params.get("letter") || "a")
  : null;
const SCOPE = "preview-home";

// A companion so the picker dialog doesn't cover the page in screenshots.
setCompanion(SCOPE, "chips");

const noop = () => {};

export function ConfettiPreview() {
  const [mounted, setMounted] = useState(true);
  return (
    <div data-preview="confetti">
      <button type="button" onClick={() => setMounted(false)}>Unmount confetti</button>
      {mounted && <ConfettiCelebration show />}
    </div>
  );
}

export function TracerPreview({ lesson }) {
  const [advanced, setAdvanced] = useState(false);
  return (
    <div className="phonics-tab-shell" data-preview="tracer">
      {advanced
        ? <p role="status">Trace step complete</p>
        : <StepTracer lesson={lesson} onComplete={() => setAdvanced(true)} />}
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Mirror the REAL shell chain (lg-app-shell > lg-content-area > .app...).
        The .app wrapper is a shrink-to-fit flex item in production; without
        this chain the harness showed a full-width page while the deployed app
        letterboxed — the harness must fail the same way the app fails. */}
    <div className="lg-app-shell no-sidebar" data-pal-world="meadow">
      <div className="lg-content-area">
        <div className="app student-mode-app no-sidebar lp-skin-sage">
          {params.get("view") === "confetti" ? (
            <ConfettiPreview />
          ) : tracerLesson ? (
            <TracerPreview lesson={tracerLesson} />
          ) : (
            <StudentHomePage
              studentName={name}
              progressScopeKey={SCOPE}
              onOpenPhonicsLearn={noop}
              onOpenArcade={noop}
              onOpenSkillsBlockQuest={noop}
              onOpenSoundSeekers={noop}
              onOpenStoryQuests={noop}
              onOpenGuidedReading={noop}
              onOpenRewards={noop}
              onLogout={noop}
            />
          )}
        </div>
      </div>
    </div>
  </StrictMode>
);
