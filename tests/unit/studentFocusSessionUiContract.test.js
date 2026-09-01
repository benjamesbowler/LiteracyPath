import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const appSurface = fs.readFileSync(
  new URL("../../src/components/AppSurface.jsx", import.meta.url),
  "utf8"
);
const assessment = fs.readFileSync(
  new URL("../../src/components/AppPages.jsx", import.meta.url),
  "utf8"
);
const library = fs.readFileSync(
  new URL("../../src/components/StudentBooksPage.jsx", import.meta.url),
  "utf8"
);
const letters = fs.readFileSync(
  new URL("../../src/components/learn/phonics/PhonicsLearnTab.jsx", import.meta.url),
  "utf8"
);
const phonicsPage = fs.readFileSync(
  new URL("../../src/components/PhonicsLearnPage.jsx", import.meta.url),
  "utf8"
);
const arcade = fs.readFileSync(
  new URL("../../src/components/learn/games/GameArcadeHub.jsx", import.meta.url),
  "utf8"
);
const assessmentController = fs.readFileSync(
  new URL("../../src/appState/assessmentRoundController.js", import.meta.url),
  "utf8"
);
const sessionSetup = fs.readFileSync(
  new URL("../../src/components/student-sessions/StudentSessionSetup.jsx", import.meta.url),
  "utf8"
);
const sessionBar = fs.readFileSync(
  new URL("../../src/components/student-sessions/StudentSessionBar.jsx", import.meta.url),
  "utf8"
);
const sessionNotice = fs.readFileSync(
  new URL("../../src/components/student-sessions/StudentSessionNotice.jsx", import.meta.url),
  "utf8"
);
const sessionStyles = fs.readFileSync(
  new URL("../../src/styles/student-sessions.css", import.meta.url),
  "utf8"
);

test("teacher pages expose the unified Student Sessions launcher and live controls", () => {
  assert.match(appSurface, /<StudentSessionSetup/);
  assert.match(appSurface, /assessmentHistoryReady=\{assessmentArchiveReady\}/);
  assert.match(appSurface, /<StudentSessionBar/);
  assert.match(appSurface, /onStartGuidedReading=\{\(\) => setReadingSetupOpen\(true\)\}/);
  assert.match(sessionSetup, /hasCompleteStudentFocusSkillsEvidence\(\{[\s\S]*assessmentHistoryReady/);
  assert.match(sessionBar, /session\.selection_scope \|\| session\.audience/);
  assert.match(sessionBar, /resolvedConfig\.book_title/);
});

test("Adventure Map setup offers current-space and exact-space modes from the canonical 27 cycles", () => {
  assert.match(sessionSetup, /const ADVENTURE_MAP_SPACE_COUNT = 27/);
  assert.match(sessionSetup, /import\("\.\.\/\.\.\/data\/elSkillsBlockCycles\.js"\)/);
  assert.match(sessionSetup, /mapModule\.WORLD_LANDMARKS_WIDE/);
  assert.match(sessionSetup, /trailModule\.ADVENTURE_MAP_PARTS/);
  assert.match(sessionSetup, /STUDENT_ADVENTURE_MAP_MODES\.EACH_CHILD_CURRENT/);
  assert.match(sessionSetup, /STUDENT_ADVENTURE_MAP_MODES\.ONE_SPACE_FOR_EVERYONE/);
  assert.match(sessionSetup, /<strong>Each child&apos;s current space<\/strong>/);
  assert.match(sessionSetup, /<strong>One space for everyone<\/strong>/);
  assert.match(sessionSetup, /id="student-session-map-space"/);
  assert.match(sessionSetup, /adventureMapMode,[\s\S]*selectedMapSpace/);
  assert.match(sessionSetup, /\{space\.spaceName\} · \{space\.cycleTitle\}/);
});

test("active Adventure Map controls show the mode and keep both end destinations distinct", () => {
  assert.match(sessionBar, /resolvedConfig\.map_mode === STUDENT_ADVENTURE_MAP_MODES\.EACH_CHILD_CURRENT/);
  assert.match(sessionBar, /Each child's current space/);
  assert.match(sessionBar, /One space for everyone · \$\{resolvedConfig\.space_name/);
  assert.match(sessionBar, /end\(STUDENT_FOCUS_END_ACTIONS\.RETURN_HOME\)/);
  assert.match(sessionBar, /end\(STUDENT_FOCUS_END_ACTIONS\.STUDENT_PICKER\)/);
  assert.match(sessionBar, /"End session"/);
  assert.match(sessionBar, /"End & switch students"/);
  assert.match(sessionStyles, /\.student-session-switch-button\s*\{[\s\S]*font-weight: 800/);
});

test("student focus mode removes escape navigation from the shared shell and library", () => {
  assert.match(appSurface, /tabs=\{isStudentFocusLocked \? \[\] : STUDENT_TAB_BAR\}/);
  assert.match(appSurface, /showGrownUps=\{!isStudentFocusLocked\}/);
  assert.match(library, /tabs=\{focusLocked \? \[\] : undefined\}/);
  assert.match(library, /\{!focusLocked && \([\s\S]*Story Quests/);
});

test("independent assessment saves neutral feedback without revealing correctness", () => {
  assert.match(assessment, /independentAssessment \? "Answer saved"/);
  assert.match(assessment, /!independentAssessment && <p>\{feedback\.explanation\}<\/p>/);
  assert.match(assessment, /!independentAssessment && onChangeSkillLevel/);
  assert.match(assessment, /!independentAssessment && \([\s\S]*End assessment/);
  assert.doesNotMatch(assessmentController, /saveAssessmentAttemptLocal/);
});

test("letters-only mode hides Words and rejects non-letter island changes", () => {
  assert.match(letters, /if \(lockedToLetters && island !== "letters"\) return/);
  assert.match(letters, /\{!lockedToLetters && \([\s\S]*aria-label=\{wordsUnlocked \? "Words"/);
});

test("exact book focus resolves through the published entitled catalogue and fails closed", () => {
  assert.match(appSurface, /resolved_config\?\.book_id/);
  assert.match(appSurface, /lockedBookId=\{assignedBookId\}/);
  assert.match(library, /filterPublishedGuidedReadingBooks\(runtimeBooks, quarantinedBookIds\)/);
  assert.match(library, /filterToEntitlement\(live, allowedBookIds/);
  assert.match(library, /entitled\.filter\(book => book\.id === normalizedLockedBookId\)/);
  assert.match(library, /exactBookLock \? normalizedLockedBookId : \(initialBookId \|\| ""\)/);
  assert.match(library, /data-assigned-content-unavailable=\{exactBookLock/);
});

test("exact game focus bypasses mission storage and exposes only a launchable entitled game", () => {
  assert.match(appSurface, /resolved_config\?\.game_id/);
  assert.match(appSurface, /lockedGameId=\{assignedGameId\}/);
  assert.match(phonicsPage, /exactGameLock \? "games"/);
  assert.match(letters, /exactGameLock \? "games" : initialIsland \|\| getInitialIsland\(\)/);
  assert.match(arcade, /if \(exactGameLock\) return lockedGame;[\s\S]*window\.localStorage\.getItem\("lp-open-game"\)/);
  assert.match(arcade, /filterSample\("games", GAME_LIST\)\.find/);
  assert.match(arcade, /!game\.hidden[\s\S]*Boolean\(LEARN_GAMES\[game\.id\]\)/);
  assert.match(arcade, /games: lockedGame \? \[lockedGame\] : \[\]/);
  assert.match(arcade, /data-assigned-content-unavailable="game"/);
  assert.match(arcade, /role=\{exactGameLock \? undefined : "tabpanel"\}/);
});

test("unavailable exact content is reported against the active focus session", () => {
  assert.match(appSurface, /reportStudentFocusContent\?\.\(\{[\s\S]*sessionId: activeStudentFocusId,[\s\S]*contentOk/);
  assert.match(library, /onLockedBookAvailabilityChange\?\.\(/);
  assert.match(arcade, /onLockedGameAvailabilityChange\?\.\(Boolean\(lockedGame\)\)/);
});

test("student session setup stays compact and opens at the top", () => {
  assert.match(sessionStyles, /\.student-session-setup\s*\{[\s\S]*font-size: 13px/);
  assert.match(sessionStyles, /input\[type="checkbox"\][\s\S]*width: 18px[\s\S]*height: 18px/);
  assert.match(sessionStyles, /\.student-session-student-list strong\s*\{[\s\S]*font-size: 14px/);
  assert.doesNotMatch(sessionSetup, /data-autofocus/);
});

test("focused child activities place their session notices in non-overlapping surface chrome", () => {
  assert.match(appSurface, /studentFocusNoticeInChildHeader/);
  assert.match(appSurface, /placement="header"/);
  assert.match(appSurface, /studentFocusNoticeInAssessment/);
  assert.match(appSurface, /placement="inline"/);
  assert.match(sessionNotice, /student-session-notice--\$\{placement\}/);
  assert.match(sessionStyles, /\.student-session-notice--header,[\s\S]*position: static/);
  assert.match(assessment, /\{sessionNotice\}[\s\S]*assessment-topbar-actions/);
});
