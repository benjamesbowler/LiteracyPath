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
