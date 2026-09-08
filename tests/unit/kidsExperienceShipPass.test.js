import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(path, "utf8");
const stripComments = source => source
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

const app = stripComments(read("src/components/AppSurface.jsx"));
const map = stripComments(read("src/components/StudentAdventureMapPage.jsx"));
const quest = stripComments(read("src/components/elQuest/ElSkillsQuest.jsx"));
const home = stripComments(read("src/components/StudentHomePage.jsx"));
const hollow = stripComments(read("src/components/HollowPage.jsx"));
const library = stripComments(read("src/components/guided-reading/GuidedReadingPage.jsx"));
const teacherToday = stripComments(read("src/components/TeacherTodayPage.jsx"));
const teacherController = stripComments(read("src/appState/useAppSessionController.js"));
const kidsCss = stripComments(read("src/styles/kids-glass.css"));
const hollowCss = stripComments(read("src/styles/hollow.css"));
const cvcBuild = stripComments(read("src/components/learn/phonics/cvc/StepBuildWord.jsx"));

test("child hubs use the fluid one-screen shell instead of page scrolling", () => {
  assert.match(app, /contentScrolls = false/);
  assert.match(app, /<StudentGlassShell[\s\S]*?contentScrolls=\{contentScrolls\}/);
  assert.match(kidsCss, /\.kg-stage \.kg-main\s*\{[^}]*overflow:\s*hidden/);
  assert.match(kidsCss, /\.kg-stage \.student-surface-arcade,[\s\S]*?overflow:\s*hidden/);
  assert.match(hollowCss, /\.hollow-page\s*\{[^}]*overflow:\s*hidden/);
  assert.match(hollowCss, /\.kg-stage \.hollow-page\s*\{[^}]*height:\s*100%/);
});

test("the map is a single forward journey with only the next stop playable", () => {
  assert.match(map, /const isNext = stop\.state === "next";[\s\S]*?const Tag = isNext \? "button" : "article"/);
  assert.doesNotMatch(map, /onClick=\{[^}]*stop\.state === "done"/);

  assert.match(quest, /const activeWorldId = homeWorldId/);
  assert.match(quest, /const Tag = isRecommended \? "button" : "span"/);
  assert.match(quest, /Back to your path/);
  assert.doesNotMatch(quest, /setMapWorldId/);
});

test("Guide selection is persistent, book-led and only changed in My Hollow", () => {
  assert.match(home, /lp-progress-hydrated/);
  assert.match(home, /Choose your Little Literacy Guide/);
  assert.match(home, /My Little Literacy Guide/);
  assert.doesNotMatch(home, /Skip for now/);

  assert.match(hollow, /label: "My Guide"/);
  assert.match(hollow, /changeLittleLiteracyGuide/);
  assert.match(hollow, /LITTLE_LITERACY_GUIDE_CHANGE_COST/);
  assert.match(hollow, /label: "Guide gear"/);
});

test("hatched beasties have a visible home in the main Hollow room", () => {
  assert.match(hollow, /className="hollow-beastie-nook"/);
  assert.match(hollow, /hollow\.beasties\.slice\(0, 8\)/);
  assert.match(hollow, /onClick=\{\(\) => setTab\("beasties"\)\}/);
  assert.match(hollowCss, /\.hollow-beastie-nook/);
});

test("Hollow touch targets keep their map position and do not lift on sticky hover", () => {
  assert.match(
    hollowCss,
    /main\.hollow-page button\.hollow-spot:is\(:hover, :focus, :focus-visible, :active\):not\(:disabled\)\s*\{[^}]*transform:\s*translate\(-50%, -50%\)/
  );
  assert.match(
    hollowCss,
    /main\.hollow-page button\.hollow-room-arrow:is\(:hover, :focus, :focus-visible, :active\):not\(:disabled\)\s*\{[^}]*transform:\s*translateY\(-50%\)/
  );
  assert.doesNotMatch(
    hollowCss,
    /\.hollow-(?:tab|pick|buy|gear|ware):hover[^{}]*\{[^}]*transform:/
  );
});

test("completed CVC builds always provide an explicit way forward", () => {
  assert.match(cvcBuild, /const wordComplete =/);
  assert.match(cvcBuild, /if \(hasAdvancedRef\.current\) return;/);
  assert.match(cvcBuild, /\{isLastWord \? "Continue" : "Next Word"\}/);
  assert.doesNotMatch(cvcBuild, /const nextTimer = setTimeout/);
  assert.match(
    kidsCss,
    /\.cvc-build-step\.kg-child-flow__content\s*\{[^}]*grid-template-rows:\s*minmax\(80px, 1fr\) auto auto auto/
  );
  assert.match(cvcBuild, /disabled=\{!completionReady\}/);
  assert.match(cvcBuild, /resolveCvcPlayback\(cuePlayback\)/);
  assert.match(cvcBuild, /The sound did not finish\. Your word is still built\./);
});

test("the child library is category then series then book, with read ticks", () => {
  assert.match(library, /getGuidedReadingSeries\(type\)/);
  assert.match(library, /Choose fiction or non-fiction\./);
  assert.match(library, /Choose a series\./);
  assert.match(library, /className="guided-series-grid"/);
  assert.match(library, /className="guided-child-book-grid"/);
  assert.match(library, /guided-child-read-tick/);
  assert.match(library, /Already read/);
});

test("teacher Today blocks on a prominent class choice before dashboard content", () => {
  const gateIndex = teacherToday.indexOf('className="teacher-class-gate"');
  const dashboardIndex = teacherToday.indexOf('className="teacher-today-dashboard"');
  assert.ok(gateIndex >= 0, "teacher class gate is missing");
  assert.ok(dashboardIndex < 0 || gateIndex < dashboardIndex, "dashboard appears before class choice");
  assert.match(teacherToday, /visibleClassList\.length > 0 && !selectedClass/);
  assert.match(teacherToday, /Choose your class/);
  assert.match(teacherToday, /onClick=\{\(\) => onSelectClass\?\.\(classRow\.id\)\}/);
  assert.match(app, /onSelectClass=\{selectTeacherClass\}/);
  assert.match(app, /const isTeacherClassEntry = !isStudentMode[\s\S]*?&& !isAdmin[\s\S]*?!selectedClassId/);
  assert.match(app, /isTeacherClassEntry \? "teacher-class-entry-app no-sidebar"/);
});

test("teacher login has separate existing-class and first-class entry paths", () => {
  assert.match(teacherToday, /visibleClassList\.length === 0 && !selectedClass/);
  assert.match(teacherToday, /Create your first class/);
  assert.match(teacherToday, /onSubmit=\{handleCreateFirstClass\}/);
  assert.match(teacherToday, /Explore with a sample class/);
  assert.match(app, /createClass=\{createClass\}/);
  assert.match(app, /newClassName=\{newClassName\}/);
  assert.match(app, /setNewClassName=\{setNewClassName\}/);

  const classLoadIndex = teacherController.indexOf("const classLoadPromise = loadClasses();");
  const routeRuntimeIndex = teacherController.indexOf("const { parse } = await loadTeacherRouteRuntime();");
  assert.ok(classLoadIndex >= 0, "approved teacher restoration must always start the class read");
  assert.ok(
    classLoadIndex < routeRuntimeIndex,
    "class loading must begin before the lazy route module so route restoration cannot strand the class list"
  );
  assert.match(
    teacherController,
    /if \(teacherRoute && !isFreshLoginRestore\) \{[\s\S]*?hydrateTeacherRouteContext\(teacherRoute, classLoadPromise\)/
  );
  assert.match(
    teacherController,
    /classRowsPromise \? \(\) => classRowsPromise : loadClasses/
  );
  assert.match(
    teacherController,
    /teacherIntentHash\(\{ appView: APP_VIEWS\.SELECT \}\)/
  );
});
