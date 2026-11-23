import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import { storyQuests } from "../../src/data/storyQuests.js";
import { storyQuestSpokenItems } from "../../src/data/storyQuestReaderCopy.js";
import { getStoryQuestPageAudioUrl } from "../../src/data/storyQuestLedaAudio.js";
import { STUDENT_RAIL_DESTINATIONS, selectActiveStudentTab } from "../../src/policy/studentRailPolicy.js";
import { computeHydratedValue } from "../../src/utils/progressMerge.js";
import { configureProgressSync, hydrateCloudProgress } from "../../src/utils/progressSync.js";
import { readProgressQueueRecords } from "../../src/utils/progressQueue.js";
import { buildQuestCard } from "../../src/policy/childLibraryPolicy.js";
import { encodeStoryQuestCheckpoint, readStoryQuestCheckpoint, storyQuestEndingIds, storyQuestReplayFork } from "../../src/utils/storyQuestRoutes.js";
import {
  buildStoryQuestResumeHistory,
  isStoryQuestTeacherPreviewScope,
  readStoryQuestProgress,
  resolveStoryQuestResume,
  saveStoryQuestProgress,
  storyQuestProgressStorageKey,
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

test("page narration keeps missing and held recordings unavailable", () => {
  const text = ["A deliberately unrecorded fixture."];
  assert.equal(getStoryQuestPageAudioUrl({ text }), "");
  assert.equal(getStoryQuestPageAudioUrl({ text, audioUrl: "/audio/held.mp3", narrationNeedsRebuild: true }), "");
  assert.ok(getStoryQuestPageAudioUrl(storyQuests[0].pages[0]));
});

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

test("small-screen Story Quest reading preserves type through named panes", () => {
  assert.match(playerStyles, /font-size: clamp\(24px,/);
  assert.match(playerStyles, /max-height: none/);
  assert.match(playerStyles, /container: quest-reader \/ size/);
  assert.match(playerSource, /aria-label="This scene"/);
  assert.doesNotMatch(playerSource, /scrollIntoView|scrollTo\(/);
});

test("teacher Story Quest preview is named before launch and never persists preview activity", () => {
  assert.match(teacherStudentsSource, />\s*Preview Story Quests\s*</);
  assert.equal(isStoryQuestTeacherPreviewScope("teacher-preview:t-1:s-1"), true);
  assert.equal(isStoryQuestTeacherPreviewScope("s-1"), false);
  assert.deepEqual(readStoryQuestProgress("teacher-preview:t-1:s-1"), { status: "preview", progress: {} });
  assert.match(learnAreaSource, /if \(read.status === "preview"\) \{[\s\S]*?return;\s*}/);
  assert.match(learnAreaSource, /This is a clean practice preview\./);
  assert.match(playerSource, /Read-only preview/);
  assert.match(
    appRootSource,
    /!studentPreview[\s\S]*?STUDENT_PREVIEW_VIEWS\.has\(appView\)[\s\S]*?configureProgressSync\(\{\s*mode: "teacher"[\s\S]*?setStudentPreview\(null\)/,
    "using the teacher sidebar must end the hidden preview sync session without changing the chosen destination"
  );
  assert.match(
    playerStyles,
    /\.app\.teacher-child-preview:has\(> \.student-surface-story\)[\s\S]*?height:\s*100dvh;[\s\S]*?overflow:\s*clip;/,
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
      exploredPageIds: ["page-1", "old-branch", "new-branch"],
      wordsFound: ["cat", "map", "sun"],
      wordsFoundCount: 3,
      opened: true,
      updatedAt: "2026-07-28T00:00:00.000Z"
    }
  );
  assert.match(playerSource, /initialProgress\?\.wordsFound/);
});

test("Story Quest hydration preserves unreadable bytes, scopes its cached fallback and queues one changed row", async () => {
  const bytes = new Map();
  const storage = {
    get length() { return bytes.size; },
    key: index => [...bytes.keys()][index],
    getItem: key => bytes.get(key) ?? null,
    setItem: (key, value) => bytes.set(key, value),
    removeItem: key => bytes.delete(key)
  };
  globalThis.window = Object.assign(new EventTarget(), {
    localStorage: storage, setTimeout: () => 1, clearTimeout: () => {}
  });
  const a = storyQuestProgressStorageKey("pupil-a"), b = storyQuestProgressStorageKey("pupil-b");
  const saved = { opened: true, endingPageIds: ["ending-1"], lastPageId: "ending-1" };
  const active = { mode: "teacher", studentId: "pupil-a" };
  try {
    assert.equal(readStoryQuestProgress("pupil-a").status, "missing");
    configureProgressSync(active);
    for (const raw of ["{not readable", "null", "[]", '{"story":{"v":2}}', '{"story":[]}']) {
      storage.setItem(a, raw);
      assert.equal(saveStoryQuestProgress("pupil-a", "quest-2", { opened: true }), false);
      assert.equal(storage.getItem(a), raw);
    }
    await hydrateCloudProgress({
      mode: "student", token: "fixture", studentId: "pupil-a",
      client: { call: async () => ({ data: [{ area: "story_quests", key: "quest-1", payload: saved }], error: null }) }
    });
    assert.equal(storage.getItem(a), '{"story":[]}');
    assert.deepEqual(readStoryQuestProgress("pupil-a"), { status: "cached", progress: { "quest-1": saved } });
    assert.equal(readStoryQuestProgress("pupil-b").status, "missing");
    assert.deepEqual(readProgressQueueRecords(storage), []);

    storage.setItem(a, JSON.stringify({ "quest-1": saved }));
    assert.equal(saveStoryQuestProgress("pupil-a", "quest-2", { lastPageId: "page-2" }), true);
    assert.deepEqual(readStoryQuestProgress("pupil-a").progress["quest-1"], saved);
    assert.deepEqual(readProgressQueueRecords(storage).map(({ entry }) => entry.key), ["quest-2"]);
    assert.equal(storage.getItem(b), null);

    const preview = "teacher-preview:teacher:pupil-a";
    assert.equal(saveStoryQuestProgress(preview, "quest-2", { lastPageId: "page-2" }), false);
    assert.equal(storage.getItem(storyQuestProgressStorageKey(preview)), null);
  } finally {
    configureProgressSync(null);
    delete globalThis.window;
  }
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

test("a synced replay resumes the new branch and preserves endings found on both devices", () => {
  const quest = storyQuests.find(quest => quest.id === "mp_ra_a_02_shy_cuddly_quiet_adventure");
  const prefix = ["p01_start", "p04_call_shy", "p02_cuddly", "p06_go_to_tree", "p07_tree_under"];
  const finished = [...prefix, "p08_tree_hug"];
  const replay = [...prefix, "p08_tree_purr"];
  const checkpoint = (visitedPageIds, routeFinished) => encodeStoryQuestCheckpoint({
    contentRevision: quest.contentRevision, visitedPageIds, routeFinished
  });
  const old = { completed: true, routeFinished: true, visitedPageIds: finished,
    updatedAt: "2026-11-22T01:00:00Z",
    endingPageIds: ["p08_tree_hug"], routeCheckpoint: checkpoint(finished, true) };
  const recent = { completed: true, routeFinished: false, visitedPageIds: replay,
    updatedAt: "2026-11-22T02:00:00Z",
    endingPageIds: ["p08_tree_purr"], routeCheckpoint: checkpoint(replay, false) };
  const row = computeHydratedValue("story_quests", quest.id, { [quest.id]: old }, recent)[quest.id];
  const resume = readStoryQuestCheckpoint(row);
  assert.equal(resume.routeFinished, false);
  assert.deepEqual(resume.visitedPageIds, replay);
  assert.deepEqual(resolveStoryQuestResume(quest, row, resume.lastPageId), {
    pageId: "p08_tree_purr", history: prefix
  });
  assert.deepEqual(storyQuestEndingIds(row), ["p08_tree_hug", "p08_tree_purr"]);
  const hydratedWithStaleCloud = computeHydratedValue("story_quests", quest.id, { [quest.id]: recent }, old)[quest.id];
  assert.deepEqual(readStoryQuestCheckpoint(hydratedWithStaleCloud), resume);
  assert.deepEqual(storyQuestEndingIds(hydratedWithStaleCloud), ["p08_tree_hug", "p08_tree_purr"]);
  assert.equal(buildQuestCard({ quest, row: { ...row, opened: true } }).badge, "Continue");
  assert.equal(buildQuestCard({ quest: { ...quest, contentRevision: "incompatible" }, row: { ...row, opened: true } }).badge, "Read again");
});

test("replay prioritises a new ending, then a different scene on a path to a known ending", () => {
  const pages = new Map(Object.entries({
    start: { id: "start", choices: [{ nextPageId: "fork" }, { nextPageId: "other-ending" }] },
    fork: { id: "fork", choices: [{ nextPageId: "ending" }, { nextPageId: "detour" }] },
    detour: { id: "detour", choices: [{ nextPageId: "ending" }] },
    ending: { id: "ending", choices: [{ nextPageId: "end" }] },
    "other-ending": { id: "other-ending", choices: [{ nextPageId: "end" }] }
  }));
  const route = ["start", "fork", "ending"];
  assert.equal(storyQuestReplayFork(route, ["ending"], [], pages), 0);
  assert.equal(storyQuestReplayFork(route, ["ending", "other-ending"], ["other-ending"], pages), 1);
  assert.equal(storyQuestReplayFork(route, ["ending", "other-ending"], ["other-ending", "detour"], pages), -1);
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
