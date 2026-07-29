// KIDS SHELL — THE PREVIEW HARNESS. Dev only; never bundled into the app
// (vite.config.js only adds preview/ inputs behind the quest-preview flag).
//
// Same reason preview/home.jsx exists: the child shell lives behind a student
// login, and chrome nobody can look at is chrome whose geometry gets written by
// guesswork. This mounts the REAL StudentGlassShell with the REAL stylesheets
// against a synthetic scope, so the 1194 x 834 stage, the 78px header and the
// 92px tab bar can be measured and screenshotted next to the prototype.
//
//   /preview/kids-shell.html                 the shell, Home lit
//   /preview/kids-shell.html?active=stories  Story Quests -> the Books tab
//   /preview/kids-shell.html?active=map      Adventure Map -> the Sounds tab
//   /preview/kids-shell.html?scroll=1        a legacy-height screen inside it
//   /preview/kids-shell.html?page=books      the real Reading Library in the shell
//   /preview/kids-shell.html?page=stories    the real Story Quests in the shell

import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

// The same global layers the real app loads, in the same order.
import "../src/index.css";
import "../src/App.css";
import "../src/styles/student-vibrant.css";
import "../src/styles/comic-theme.css";
import "../src/styles/hollow.css";
import "../src/styles/home-sage.css";
import "../src/styles/sage-subpages.css";
import "../src/styles/sage-soft.generated.css";
import "../src/styles/sage-form.css";
import "../src/styles/kids-glass.css";

import StudentGlassShell from "../src/components/StudentGlassShell.jsx";
import { GuidedReadingPage } from "../src/components/guided-reading/GuidedReadingPage.jsx";
import { LearnAreaPage } from "../src/components/LearnAreaPage.jsx";
import { setCompanion } from "../src/utils/studentProfile.js";

const params = new URLSearchParams(window.location.search);
const SCOPE = "preview-kids-shell";
setCompanion(SCOPE, "chips");

// Stand-in content only. Phases B–F replace this with the real screens; the
// point of the harness is the chrome around it, so the filler names the three
// glass tiers rather than pretending to be a design.
export function ShellContent() {
  return (
    <div className="kg-screen" style={{ display: "grid", gap: 13, gridTemplateRows: "232px minmax(0, 1fr)" }}>
      <div className="kg-glass kg-scrim kg-scrim--hero" style={{ borderRadius: "var(--kg-radius-hero)", padding: "18px 22px" }}>
        <div className="kg-on-art">
          <span className="kg-eyebrow" style={{ color: "#fff" }}>Carry on where you stopped</span>
          <h1 className="kg-hero-title">The Sound Trail</h1>
          <p className="kg-body" style={{ color: "rgba(255,255,255,.86)" }}>Stop twelve, the Windy Bridge</p>
          <span style={{ display: "inline-flex", gap: 11, marginTop: 14 }}>
            <button type="button" className="kg-button kg-button--lg kg-glass-accent">Play</button>
            <button type="button" className="kg-speaker kg-speaker--lg kg-glass-dark" aria-label="Hear this">
              <svg className="kg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4zM16 9a4 4 0 0 1 0 6" /></svg>
            </button>
          </span>
        </div>
      </div>
      <div className="kg-glass" style={{ borderRadius: "var(--kg-radius-panel)", padding: "13px 22px 15px" }}>
        <h2 className="kg-section-title">Today&rsquo;s three stops</h2>
        <p className="kg-body">Tier two glass. This is the workhorse panel later phases build on.</p>
        <span style={{ display: "inline-flex", gap: 11, marginTop: 11 }}>
          <span className="kg-chip kg-glass-accent">sh</span>
          <span className="kg-chip kg-glass--quiet">ch</span>
          <span className="kg-pill kg-glass-dark">Windy Bridge</span>
        </span>
      </div>
    </div>
  );
}

// A deliberately over-tall block, to prove a legacy screen scrolls inside the
// content area rather than being clipped by the fixed canvas.
export function TallContent() {
  return (
    <div style={{ minHeight: 1600, padding: 24, background: "rgba(255,255,255,.35)" }}>
      <h2 className="kg-section-title">A tall legacy screen</h2>
      <p className="kg-body">1600px of content inside a 664px content area.</p>
      <p className="kg-body" style={{ marginTop: 1500 }}>The bottom of it is still reachable.</p>
    </div>
  );
}

// A REAL existing child screen inside the new shell. Phase A's promise is that
// the seven screens keep working while their own phases are still to come, and
// a promise nobody rendered is a guess.
export function RealPage({ which }) {
  // Story Quests sizes itself with height:100% inside the frame AppSurface
  // gives it — the shape that collapses to zero behind an extra wrapper — so
  // the harness reproduces that frame exactly rather than a simplified one.
  if (which === "stories") {
    return (
      <div className="learn-fullscreen-frame student-surface-frame student-surface-story">
        <LearnAreaPage progressScopeKey={SCOPE} />
      </div>
    );
  }
  return (
    <GuidedReadingPage
      mode="student"
      initialBookId=""
      studentId={SCOPE}
      studentName="Aaron"
      guidedReadingRecords={{}}
      saveGuidedReadingRecord={() => {}}
      speakText={() => {}}
    />
  );
}

export function Harness() {
  const [active, setActive] = useState(params.get("active") || "home");
  const scroll = params.get("scroll") === "1";
  const real = params.get("page");
  return (
    <StudentGlassShell
      studentName="Aaron"
      scopeKey={SCOPE}
      active={active}
      onNavigate={setActive}
      onHome={() => setActive("home")}
      onGrownUps={() => setActive("home")}
      contentScrolls={scroll || real}
    >
      {real ? <RealPage which={real} /> : scroll ? <TallContent /> : <ShellContent />}
    </StudentGlassShell>
  );
}

// The real app wraps every child screen in `app student-mode-app no-sidebar
// lp-skin-sage` (AppSurface's appShellClassName), and sage-subpages.css /
// sage-form.css hang the whole sage palette off that chain. Leaving it out is
// exactly how preview/home.jsx once looked perfect while the deployed page was
// letterboxed — so the harness mirrors it.
const shell = document.createElement("div");
shell.className = "app student-mode-app no-sidebar lp-skin-sage";
document.getElementById("root").appendChild(shell);

createRoot(shell).render(
  <StrictMode>
    <Harness />
  </StrictMode>
);
