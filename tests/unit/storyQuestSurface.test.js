import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

const playerSource = readFileSync("src/components/StoryQuestPlayer.jsx", "utf8");
const playerStyles = readFileSync("src/components/StoryQuestPlayer.css", "utf8");
const learnAreaSource = readFileSync("src/components/LearnAreaPage.jsx", "utf8");
const studentHomeSource = readFileSync("src/components/StudentHomePage.jsx", "utf8");
const studentRailSource = readFileSync("src/components/StudentRail.jsx", "utf8");
const appSource = readFileSync("src/App.jsx", "utf8");
const sageFormStyles = readFileSync("src/styles/sage-form.css", "utf8");

function channel(hex) {
  const value = Number.parseInt(hex, 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const normalized = hex.replace("#", "");
  return (
    0.2126 * channel(normalized.slice(0, 2))
    + 0.7152 * channel(normalized.slice(2, 4))
    + 0.0722 * channel(normalized.slice(4, 6))
  );
}

function contrastRatio(foreground, background) {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

test("Story Quest choices keep a WCAG AA text colour on every gradient stop", () => {
  assert.match(
    playerStyles,
    /\.story-quest-choice-button\s*\{[\s\S]*?background:\s*linear-gradient\(180deg, var\(--lp-color-surface\) 0%, var\(--lp-color-primary-soft\) 100%\);[\s\S]*?color:\s*#172033;/,
    "the pale choice-button background must explicitly reset the inherited white text"
  );

  for (const background of ["#ffffff", "#e3f4f2"]) {
    assert.ok(
      contrastRatio("#172033", background) >= 4.5,
      `#172033 must have at least 4.5:1 contrast on ${background}`
    );
  }
});

test("Story Quest prompt and choices are one direct decision region", () => {
  const decision = playerSource.match(/<div className="story-quest-decision"[\s\S]*?<\/div>\n\s*<\/div>\n\s*<\/section>/);
  assert.ok(decision, "the player must keep prompt and choice grid inside one decision wrapper");
  assert.match(decision[0], /story-quest-choice-prompt/);
  assert.match(decision[0], /story-quest-choice-grid/);
  assert.match(learnAreaSource, /story-quest-learn-page story-quest-active-page/);
});

test("Story Quest progress follows the chosen route and replay starts a fresh run", () => {
  assert.match(playerSource, /const currentSceneNumber = history\.length \+ 1;/);
  assert.match(playerSource, /Scene \{currentSceneNumber\}/);
  assert.doesNotMatch(playerSource, /Page \{currentPageNumber\} of \{totalPages\}/);
  assert.match(
    playerSource,
    /const isReplayChoice[\s\S]*?if \(isReplayChoice\) \{[\s\S]*?restart\(\);[\s\S]*?return;/,
    "an ending's Read again choice must clear route history instead of extending the previous run"
  );
});

test("Story Quest reader reserves one viewport without nested story-text scrolling", () => {
  assert.match(
    playerStyles,
    /\.story-quest-active-page \.story-quest-reader,[\s\S]*?grid-template-rows:\s*auto auto minmax\(0, 1fr\) auto auto auto;[\s\S]*?height:\s*100%;[\s\S]*?overflow:\s*hidden;/,
    "the active reader must have six explicit rows inside its viewport"
  );
  assert.match(
    playerStyles,
    /\.story-quest-reader\.fullscreen \.story-quest-text,[\s\S]*?\.story-quest-reader:fullscreen \.story-quest-text\s*\{[\s\S]*?max-height:\s*none;[\s\S]*?overflow:\s*visible;/,
    "fullscreen must not hide story text in an internal scroll box"
  );
  assert.match(
    playerStyles,
    /@media \(orientation: landscape\) and \(max-height: 680px\)[\s\S]*?grid-template-rows:\s*auto auto minmax\(0, 1fr\) auto auto;/,
    "short landscape screens must remove the hidden word row from the explicit grid"
  );
  assert.match(
    playerStyles,
    /\.story-quest-active-page \.story-quest-header-actions \.lp-button,[\s\S]*?\.story-quest-reader:fullscreen \.story-quest-audio-button\s*\{[\s\S]*?min-height:\s*44px !important;/,
    "reader controls must retain a 44px touch target in compact and fullscreen layouts"
  );
  assert.match(
    playerStyles,
    /\.story-quest-active-page,[\s\S]*?\.story-quest-active-page \*::after\s*\{[\s\S]*?box-sizing:\s*border-box;/,
    "reader padding and borders must stay inside the rail content viewport"
  );
});

test("Story Quests appears in both child navigation sources with a real story icon", () => {
  const homeNav = studentHomeSource.match(/const sageNav = \[[\s\S]*?\n\s*\]\.filter/);
  const sharedNav = appSource.match(/const railNav = \[[\s\S]*?\n\s*\];/);
  assert.ok(homeNav, "could not locate Student Home sageNav");
  assert.ok(sharedNav, "could not locate App railNav");
  assert.match(homeNav[0], /id: "stories", label: "Story Quests", icon: "story", go: onOpenStoryQuests/);
  assert.match(sharedNav[0], /id: "stories", label: "Story Quests", icon: "story"[\s\S]*?setAppView\(APP_VIEWS\.LEARN\)/);
  assert.match(studentRailSource, /story:\s*"[^"\n]+"/);
  assert.match(appSource, /withStudentRail\("stories"/);
});

test("the shared rail leaves a real content viewport on phones and tablets", () => {
  assert.match(
    sageFormStyles,
    /@media \(max-width: 880px\) \{[\s\S]*?\.lp-rail-shell \.hs-side\s*\{[\s\S]*?position:\s*static;[\s\S]*?height:\s*auto;[\s\S]*?\.lp-rail-shell \.lp-rail-main\s*\{[\s\S]*?flex:\s*1 1 0;[\s\S]*?min-height:\s*0;[\s\S]*?height:\s*0;/,
    "the later sage-form layer must not restore a 100vh sidebar after home-sage switches the rail to a top strip"
  );
  assert.match(
    playerStyles,
    /\.student-mode-app \.lp-rail-shell \.learn-fullscreen-frame\.student-surface-frame\.student-surface-story\s*\{[\s\S]*?height:\s*100%;[\s\S]*?\.student-mode-app \.lp-rail-shell \.student-surface-story \.story-quest-learn-page\.story-quest-active-page\.learn-area-page\s*\{[\s\S]*?height:\s*100%;/,
    "the real rail-wrapped story surface must resolve against the remaining pane rather than 100dvh"
  );
});
