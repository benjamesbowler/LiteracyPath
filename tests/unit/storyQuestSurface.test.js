import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import { storyQuests } from "../../src/data/storyQuests.js";
import { selectActiveStudentTab } from "../../src/policy/studentRailPolicy.js";
import {
  buildStoryQuestResumeHistory,
  isStoryQuestTeacherPreviewScope,
  mergeStoryQuestProgressRow
} from "../../src/utils/storyQuestProgress.js";

const playerSource = readFileSync("src/components/StoryQuestPlayer.jsx", "utf8");
const playerStyles = readFileSync("src/components/StoryQuestPlayer.css", "utf8");
const learnAreaSource = readFileSync("src/components/LearnAreaPage.jsx", "utf8");
const studentHomeSource = readFileSync("src/components/StudentHomePage.jsx", "utf8");
const studentRailSource = readFileSync("src/components/StudentRail.jsx", "utf8");
const studentRailPolicySource = readFileSync("src/policy/studentRailPolicy.js", "utf8");
const appSource = readFileSync("src/components/AppSurface.jsx", "utf8");
const appRootSource = readFileSync("src/App.jsx", "utf8");
const teacherStudentsSource = readFileSync("src/components/TeacherStudentsPage.jsx", "utf8");
const comicThemeStyles = readFileSync("src/styles/comic-theme.css", "utf8");
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

test("Story Quest status badges carry their real state and keep AA contrast in the sage skin", () => {
  assert.match(
    learnAreaSource,
    /const statusClass = progress\.completed[\s\S]*?\? "completed"[\s\S]*?: progress\.opened[\s\S]*?\? "in-progress"[\s\S]*?: "not-started";/,
    "untouched, opened, and completed quests must not share one success-coloured status class"
  );
  assert.match(learnAreaSource, /className=\{`story-quest-status \$\{statusClass\}`\}/);
  assert.match(
    comicThemeStyles,
    /\.student-mode-app\.lp-skin-sage \.story-quest-status:not\(\.not-started\) \{ color: #fff !important; \}/
  );

  assert.ok(
    contrastRatio("#1E2B25", "#5CA091") >= 4.5,
    "the sage not-started badge must keep at least 4.5:1 contrast"
  );
  assert.ok(
    contrastRatio("#FFFFFF", "#3B6D11") >= 4.5,
    "the sage in-progress/completed badge must keep at least 4.5:1 contrast"
  );
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
  assert.match(studentRailPolicySource, /id: "stories", label: "Story Quests", icon: "story"/);
  assert.match(studentHomeSource, /stories:\s*onOpenStoryQuests/);
  assert.match(studentRailPolicySource, /story:\s*"[^"\n]+"/);
  assert.match(studentRailSource, /<StudentRailNav/);
  assert.match(appSource, /withStudentRail\("stories"/);

  // 2026-07-29, the kids-side redesign: the left rail became a five-tab bottom
  // bar, so Story Quests no longer has a nav entry of its own — the spec puts
  // it behind Books ("reached from Books or the Home doorway; the Books tab
  // stays lit"). The two things that must still be true are that it is
  // REACHABLE and that entering it does not leave the bar with nothing lit.
  assert.match(
    appSource,
    /onOpenStoryQuests=\{\(\)\s*=>\s*\{[\s\S]*?setAppView\(APP_VIEWS\.LEARN\)/,
    "the Home doorway must still open Story Quests"
  );
  assert.equal(
    selectActiveStudentTab("stories"),
    "books",
    "Story Quests must light the Books tab — a sub-screen may never leave the bottom bar dark"
  );
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

test("teacher Story Quest preview is named before launch and never persists preview activity", () => {
  assert.match(teacherStudentsSource, />\s*Preview Story Quests\s*</);
  assert.equal(isStoryQuestTeacherPreviewScope("teacher-preview:t-1:s-1"), true);
  assert.equal(isStoryQuestTeacherPreviewScope("s-1"), false);
  assert.match(
    learnAreaSource,
    /teacherPreview \? \{\} : loadStoryQuestProgress\(progressScopeKey\)/,
    "preview must start clean instead of presenting old teacher clicks as student progress"
  );
  assert.match(
    learnAreaSource,
    /useEffect\(\(\) => \{\s*if \(teacherPreview\) return;\s*saveStoryQuestProgress/,
    "preview activity must not enter local or cloud persistence"
  );
  assert.match(learnAreaSource, /This is a clean practice preview\./);
  assert.match(playerSource, /Student progress is not saved/);
  assert.match(
    appRootSource,
    /!studentPreview[\s\S]*?STUDENT_PREVIEW_VIEWS\.has\(appView\)[\s\S]*?configureProgressSync\(\{\s*mode: "teacher"[\s\S]*?setStudentPreview\(null\)/,
    "using the teacher sidebar must end the hidden preview sync session without changing the chosen destination"
  );
  assert.match(
    playerStyles,
    /\.app\.teacher-child-preview:has\(\.student-surface-story\)[\s\S]*?height:\s*100dvh;[\s\S]*?overflow:\s*hidden;/,
    "the protection banner and reader must share one viewport"
  );
});

test("a resumed Story Quest keeps its real route history without resetting after every saved scene", () => {
  assert.deepEqual(
    buildStoryQuestResumeHistory({
      currentPageId: "page-3",
      progress: {
        visitedPageIds: ["page-1", "missing", "page-2", "page-2", "page-3"]
      },
      validPageIds: ["page-1", "page-2", "page-3"]
    }),
    ["page-1", "page-2"]
  );
  assert.match(playerSource, /const \[history, setHistory\] = useState\(getInitialHistory\);/);
  assert.doesNotMatch(
    playerSource,
    /useEffect\(\(\) => \{[\s\S]{0,240}setHistory\(getInitialHistory\(\)\)/,
    "progress callbacks change the parent payload; they must not reset the reader to scene one"
  );
  assert.match(learnAreaSource, /<StoryQuestPlayer\s+key=\{activeQuest\.id\}/);
});

test("Story Quest exposure stays cumulative while the current route remains resumable", () => {
  assert.deepEqual(
    mergeStoryQuestProgressRow({
      completed: true,
      completedAt: "2026-07-20T00:00:00.000Z",
      visitedPageCount: 4,
      visitedPageIds: ["page-1", "old-branch"],
      wordsFound: ["Cat", "map"],
      wordsFoundCount: 2
    }, {
      completed: false,
      visitedPageCount: 2,
      visitedPageIds: ["page-1", "new-branch"],
      wordsFound: ["cat", "sun"],
      wordsFoundCount: 2
    }, "2026-07-28T00:00:00.000Z"),
    {
      completed: true,
      completedAt: "2026-07-20T00:00:00.000Z",
      visitedPageCount: 4,
      visitedPageIds: ["page-1", "new-branch"],
      wordsFound: ["cat", "map", "sun"],
      wordsFoundCount: 3,
      opened: true,
      updatedAt: "2026-07-28T00:00:00.000Z"
    }
  );
  assert.match(learnAreaSource, /mergeStoryQuestProgressRow\(previous\[questId\], patch\)/);
  assert.match(playerSource, /initialProgress\?\.wordsFound/);
});

test("Story Quest teacher-preview copy reports exposure, not mastery or future promises", () => {
  assert.doesNotMatch(playerSource, />Audio Coming Soon</);
  assert.match(playerSource, /Audio unavailable/);
  assert.match(playerSource, /No audio for this scene/);
  assert.doesNotMatch(playerSource, /story words found/);
  assert.doesNotMatch(learnAreaSource, /words found/);
  assert.match(playerSource, /story words seen/);
  assert.match(learnAreaSource, /story words seen/);
  assert.match(playerSource, /<h1>\{quest\.title\}<\/h1>/);
  assert.match(learnAreaSource, /<h2>\{level\.heading\}<\/h2>/);
  assert.match(learnAreaSource, /<button[\s\S]*?aria-label=\{`\$\{teacherPreview \? "Preview"/);
});

test("every declared Story Quest target word can be encountered on at least one page", () => {
  for (const quest of storyQuests) {
    const pageTags = new Set(
      (quest.pages || [])
        .flatMap(page => page.skillTags || [])
        .map(tag => String(tag).toLowerCase())
    );
    for (const word of quest.targetWords || []) {
      assert.ok(
        pageTags.has(String(word).toLowerCase()),
        `${quest.id} declares "${word}" as a target word but no page can record it`
      );
    }
  }
});
