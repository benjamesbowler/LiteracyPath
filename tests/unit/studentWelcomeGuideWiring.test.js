import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync("src/components/AppSurface.jsx", "utf8");
const home = readFileSync("src/components/StudentHomePage.jsx", "utf8");
const shell = readFileSync("src/components/StudentGlassShell.jsx", "utf8");

test("Help is available throughout unlocked student navigation and returns to the tour", () => {
  assert.match(shell, /data-student-help-button=""/);
  assert.match(app, /const openStudentGuide = \(\) => \{[\s\S]*?setAppView\(APP_VIEWS\.STUDENT_HOME\)/);
  assert.match(app, /onHelp=\{isStudentFocusLocked \? undefined : openStudentGuide\}/);
  assert.match(home, /onHelp=\{studentGuideEnabled \? openWelcomeGuide : undefined\}/);
});

test("automatic onboarding waits for focus-session verification and stays out of locked sessions", () => {
  assert.match(
    app,
    /studentGuideAutoEnabled=\{isStudentMode && !isStudentFocusLocked && !trySession && Boolean\(studentSession\?\.token\) && studentFocusCheckedForCurrentLogin\}/
  );
  assert.match(app, /Date\.parse\(studentFocus\?\.lastContactAt \|\| ""\) >= studentSessionStartedAt/);
  assert.match(home, /if \(!studentGuideAutoEnabled \|\| studentGuideRequested\) return undefined/);
});

test("try mode can replay Help without receiving automatic onboarding", () => {
  assert.match(app, /studentGuideEnabled=\{isStudentMode && !isStudentFocusLocked\}/);
  assert.match(app, /studentGuideAutoEnabled=\{[^}]*!trySession/);
});
