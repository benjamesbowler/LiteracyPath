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
const dashboardSource = read("src/components/TeacherDashboardPage.jsx");
const intentSource = read("src/components/teacher/TeacherIntentPage.jsx");
const stylesSource = read("src/App.css");
const teacherTokensSource = read(
  "src/components/teacher/ui/teacherTokens.css"
);
const componentSource = read(
  "src/components/teacher/ui/TeacherSurfaceState.jsx"
);
const fixtureSource = read("tests/fixtures/teacher-state-matrix.jsx");

assert.equal(TEACHER_SURFACE_IDS.length, 5, "Expected five teacher surfaces.");
assert.equal(TEACHER_SURFACE_STATE_IDS.length, 8, "Expected eight state types.");
assert.equal(
  TEACHER_SURFACE_STATE_FIXTURES.length,
  40,
  "Expected all 40 surface-state fixtures."
);

for (const fixture of TEACHER_SURFACE_STATE_FIXTURES) {
  assert.ok(
    documentSource.includes(`\`${fixture.id}\``),
    `State-matrix document is missing ${fixture.id}.`
  );
}

for (const requiredHeading of [
  "Runtime signal contract",
  "Assistive-technology contract",
  "Fixture and release contract",
  "State transition rules"
]) {
  assert.ok(
    documentSource.includes(requiredHeading),
    `State-matrix document is missing ${requiredHeading}.`
  );
}

assert.ok(
  dashboardSource.includes('from "./teacher/ui/TeacherSurfaceState.jsx"'),
  "Today and Classes must adopt the shared teacher state primitive."
);
assert.ok(
  intentSource.includes('from "./ui/TeacherSurfaceState.jsx"'),
  "Assess, Progress, and Plan/Resources must adopt the shared teacher state primitive."
);
assert.ok(
  componentSource.includes("TeacherSurfaceStateFixtureSheet"),
  "The storybook-style fixture sheet must remain exported."
);
assert.ok(
  componentSource.includes("aria-busy={content.busy || undefined}"),
  "Loading states must expose aria-busy."
);
assert.ok(
  teacherTokensSource.includes("--teacher-ui-target-min: 44px"),
  "Teacher state recovery actions must retain a 44px minimum target token."
);
assert.ok(
  stylesSource.includes("min-height: var(--teacher-ui-target-min) !important"),
  "Teacher state recovery actions must retain a 44px minimum target."
);
assert.ok(
  fixtureSource.includes("TeacherSurfaceStateFixtureSheet"),
  "The browser-renderable fixture must use the production fixture sheet."
);

console.log(
  "Teacher state matrix: 5 surfaces × 8 states, 40 documented fixtures, both teacher page families adopted."
);
