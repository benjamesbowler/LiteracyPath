import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  TEACHER_SURFACE_IDS,
  TEACHER_SURFACE_STATE_FIXTURES,
  TEACHER_SURFACE_STATE_IDS
} from "../src/components/teacher/ui/teacherSurfaceStates.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relativePath =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const documentSource = read("docs/teacher/STATE_MATRIX.md");
const todaySource = read("src/components/TeacherTodayPage.jsx");
const classesSource = read("src/components/TeacherStudentsPage.jsx");
const assessmentsSource = read("src/components/TeacherAssessmentsPage.jsx");
const reportsSource = read("src/components/TeacherReportsHubPage.jsx");
const resourcesSource = read("src/components/teacher/TeacherIntentPage.jsx");
const appSurfaceSource = read("src/components/AppSurface.jsx");
const stylesSource = read("src/App.css");
const teacherTokensSource = read(
  "src/components/teacher/ui/teacherTokens.css"
);
const componentSource = read(
  "src/components/teacher/ui/TeacherSurfaceState.jsx"
);
const fixtureSource = read("tests/fixtures/teacher-state-matrix.jsx");

assert.deepEqual(
  TEACHER_SURFACE_IDS,
  ["today", "classes", "assess", "progress", "resources"]
);
assert.deepEqual(TEACHER_SURFACE_STATE_IDS, ["loading", "empty", "partial"]);
assert.equal(
  TEACHER_SURFACE_STATE_FIXTURES.length,
  12,
  "Only the twelve production-reachable combinations should be claimed."
);

for (const fixture of TEACHER_SURFACE_STATE_FIXTURES) {
  assert.ok(
    documentSource.includes(`\`${fixture.id}\``),
    `Runtime-state document is missing ${fixture.id}.`
  );
}

for (const requiredHeading of [
  "Runtime signals actually wired",
  "States not claimed",
  "Assistive-technology contract",
  "Production evidence contract"
]) {
  assert.ok(
    documentSource.includes(requiredHeading),
    `Runtime-state document is missing ${requiredHeading}.`
  );
}

for (const source of [
  todaySource,
  classesSource,
  assessmentsSource,
  reportsSource,
  resourcesSource
]) {
  assert.ok(
    source.includes("TeacherSurfaceState"),
    "Every catalogued teacher page must use the shared state component."
  );
  assert.ok(
    !source.includes("surfaceState ="),
    "Production pages must not expose a test-only state-injection prop."
  );
}

assert.ok(todaySource.includes('surface="today"'));
assert.ok(todaySource.includes('state="loading"'));
assert.ok(todaySource.includes('state="partial"'));
assert.ok(classesSource.includes('surface="classes"'));
assert.ok(classesSource.includes('state="empty"'));
assert.ok(assessmentsSource.includes('surface="assess"'));
assert.ok(assessmentsSource.includes('state="loading"'));
assert.ok(assessmentsSource.includes('state="empty"'));
assert.ok(assessmentsSource.includes('state="partial"'));
assert.ok(reportsSource.includes('surface="progress"'));
assert.ok(reportsSource.includes('state="partial"'));
assert.ok(resourcesSource.includes('surface={intent}'));
assert.ok(resourcesSource.includes('state="loading"'));
assert.ok(resourcesSource.includes('state="partial"'));
assert.ok(
  appSurfaceSource.includes('intent="resources"'),
  "The catalogued Resources intent must be mounted by the product."
);
assert.ok(
  componentSource.includes("TeacherSurfaceStateFixtureSheet"),
  "The visual fixture sheet must remain exported."
);
assert.ok(
  componentSource.includes("aria-busy={content.busy || undefined}"),
  "Loading states must expose aria-busy."
);
assert.ok(
  teacherTokensSource.includes("--teacher-ui-target-min: 44px"),
  "Recovery actions must retain a 44px minimum target token."
);
assert.ok(
  stylesSource.includes("min-height: var(--teacher-ui-target-min) !important"),
  "Recovery actions must retain a 44px minimum target."
);
assert.ok(
  fixtureSource.includes("TeacherSurfaceStateFixtureSheet"),
  "The browser fixture must use the production component."
);

console.log(
  "Teacher runtime states: twelve production-reachable combinations documented and wired; invented fixture-only states rejected."
);
