// STUDENT HOME — THE PREVIEW HARNESS. Dev only; never bundled into the app.
//
// Same reason preview/quest.jsx exists: the home page lives behind a student
// login, and a screen nobody can look at is a screen whose layout gets written
// by guesswork. This mounts the REAL StudentHomePage with the REAL stylesheets
// against a synthetic scope — no login, no Supabase, no App.jsx — so both home
// skins can be eyeballed and screenshotted by tools/shootQuest.mjs.
//
//   /preview/home.html                 comic skin (the default)
//   /preview/home.html?skin=sage       the flag-gated sage skin
//   /preview/home.html?skin=sage&name=Ava
//
// The skin flows through the same query parameter the app itself reads
// (?homeSkin=...), so the harness exercises the real flag path.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// The same global layers the real app loads, in the same order. App.css is
// NOT optional here: leaving it out is exactly how the deployed build got a
// letterboxed home and centred card titles while this harness looked perfect
// — App.css's generic .app/button rules are part of the environment the page
// really lives in.
import "../src/index.css";
import "../src/App.css";
import "../src/styles/student-vibrant.css";
import "../src/styles/comic-theme.css";
import "../src/styles/hollow.css";
import "../src/styles/home-sage.css";
import "../src/styles/sage-subpages.css";
import "../src/styles/sage-soft.generated.css";

import { StudentHomePage } from "../src/components/StudentHomePage.jsx";
import { setCompanion } from "../src/utils/studentProfile.js";

const params = new URLSearchParams(window.location.search);
const skin = params.get("skin") === "comic" ? "comic" : "sage"; // sage is the default, as in the app
const name = params.get("name") || "Sam";
const SCOPE = "preview-home";

// StudentHomePage reads the skin from ?homeSkin= — mirror the harness param
// into the URL the component actually inspects, without reloading.
if (params.get("homeSkin") !== skin) {
  params.set("homeSkin", skin);
  window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
}

// A companion so the picker dialog doesn't cover the page in screenshots.
setCompanion(SCOPE, "chips");

const noop = () => {};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Mirror the REAL shell chain (lg-app-shell > lg-content-area > .app...).
        The .app wrapper is a shrink-to-fit flex item in production; without
        this chain the harness showed a full-width page while the deployed app
        letterboxed — the harness must fail the same way the app fails. */}
    <div className="lg-app-shell no-sidebar" data-pal-world="meadow">
      <div className="lg-content-area">
        <div className={`app student-mode-app no-sidebar${skin === "sage" ? " lp-skin-sage" : ""}`}>
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
        </div>
      </div>
    </div>
  </StrictMode>
);
