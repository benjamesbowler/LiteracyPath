import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import { storyQuests } from "../../src/data/storyQuests.js";
import { storyQuestSpokenItems } from "../../src/data/storyQuestReaderCopy.js";
import { STUDENT_RAIL_DESTINATIONS, selectActiveStudentTab } from "../../src/policy/studentRailPolicy.js";
import {
  buildStoryQuestResumeHistory,
  isStoryQuestTeacherPreviewScope,
  resolveStoryQuestResume,
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

test("all fourteen shelf synopses stay short without changing recorded invitations or story narration", () => {
  assert.equal(storyQuests.length, 14);
  for (const quest of storyQuests) {
    assert.ok(quest.childSynopsis, `${quest.id} needs a child shelf synopsis`);
    assert.ok(quest.childSynopsis.split(/\s+/).length <= 8, `${quest.id}: ${quest.childSynopsis}`);
    assert.doesNotMatch(quest.childSynopsis, /\b(?:assessments?|evidence|learners?|students?|checkpoints?|wrong|failed|incorrect)\b/i);
  }
  const withoutVisualSynopses = storyQuests.map(quest => {
    const original = { ...quest };
    delete original.childSynopsis;
    return original;
  });
  assert.deepEqual(storyQuestSpokenItems(storyQuests), storyQuestSpokenItems(withoutVisualSynopses));
  const shelfSource = readFileSync("src/components/StudentStoryQuestsPage.jsx", "utf8");
  assert.match(shelfSource, /card\.state === "carry-on" \? card\.note[\s\S]*?\.childSynopsis/);
  assert.match(shelfSource, /narration\.play\(storyQuestInvitation\(/);
});

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

test("Story Quest choices keep AA text contrast", () => {
  for (const background of ["#ffffff", "#e9f4e4"]) assert.ok(contrastRatio("#172033", background) >= 4.5);
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

test("Story Quest word help names whole words and letter spelling separately", () => {
  assert.match(playerSource, /Hear the word/);
  assert.match(playerSource, /Hear the letters/);
  assert.match(playerSource, /spellingAudioPaths/);
  assert.doesNotMatch(playerSource, /Tap again to spell|wordSupportStageRef/);
});

test("Story Quest progress reports route position without a word-count completion bar", () => {
  assert.match(playerSource, /const currentSceneNumber = history.length \+ 1/);
  assert.doesNotMatch(playerSource, /wordProgressPercent|story-quest-progress-bar|story-quest-word-panel/);
});

test("Story Quests appears in both child navigation sources with a real story icon", () => {
  assert.deepEqual(STUDENT_RAIL_DESTINATIONS.find(item => item.id === "stories"), {
    id: "stories", label: "Story Quests", icon: "story", tab: "books"
  });
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

  // 2026-07-29 phase D: the shelf a child lands on is StudentStoryQuestsPage.
  // LearnAreaPage is still what plays a story, mounted with the story already
  // chosen, so the player and its progress store keep one owner.
  assert.match(
    appSource,
    /<StudentStoryQuestsPage[\s\S]*?renderQuest=\{[\s\S]*?launchQuestId=\{questId\}/,
    "the LEARN route must open the redesigned shelf and hand the player the chosen story"
  );
});

test("small-screen Story Quest reading preserves type through whole-reader scrolling", () => {
  assert.match(playerStyles, /font-size: 24px/);
  assert.match(playerStyles, /max-height: none/);
  assert.match(playerStyles, /overflow: auto/);
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
  assert.match(playerSource, /resolveStoryQuestResume/);
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

test("Story Quest exposure is saved for adults without a child mastery claim", () => {
  assert.match(playerSource, /wordsFoundCount: foundWords.length/);
  assert.doesNotMatch(playerSource, /Great reading!|All story words seen|more story words|mastered/);
  assert.match(playerSource, /currentPage.imageUrl/);
  assert.match(playerSource, /currentPage.replayPrompt/);
  assert.match(playerSource, /More story controls/);
});

test("rewritten or invalid routes restart instead of dropping readers beyond required clues", () => {
  const quest = { startPageId: "start", contentRevision: "new", pages: [
    { id: "start", choices: [{ nextPageId: "clue" }] },
    { id: "clue", choices: [{ nextPageId: "door" }] },
    { id: "door", choices: [{ nextPageId: "end" }] }
  ] };
  assert.deepEqual(resolveStoryQuestResume(quest, { contentRevision: "old", visitedPageIds: ["start", "clue", "door"] }, "door"), { pageId: "start", history: [] });
  assert.deepEqual(resolveStoryQuestResume(quest, { contentRevision: "new", visitedPageIds: ["start", "door"] }, "door"), { pageId: "start", history: [] });
  assert.deepEqual(resolveStoryQuestResume(quest, { contentRevision: "new", visitedPageIds: ["start", "clue", "door"] }, "door"), { pageId: "door", history: ["start", "clue"] });
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
