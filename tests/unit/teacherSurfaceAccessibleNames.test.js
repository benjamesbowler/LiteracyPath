import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// These surfaces are read by a busy teacher on a tablet, often through a screen
// reader. Four of the guards below pin things a hover-only affordance cannot
// carry (a tile's status, a row button's target), and one pins the sentence that
// tells a teacher WHY a class average is missing. Rendering these components
// needs the vite pipeline, which cannot load its native binding in every
// sandbox, so these read the source the way studentLoginPolicy.test.js does.

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

async function source(relativePath) {
  return readFile(resolve(ROOT, relativePath), "utf8");
}

test("sound map status is spoken, not only coloured, and its definition opens on tap", async () => {
  const [students, today] = await Promise.all([
    source("src/components/TeacherStudentsPage.jsx"),
    source("src/components/TeacherTodayPage.jsx")
  ]);

  // Student panel: every tile names its bucket in its accessible name.
  assert.match(students, /SOUND_STATUS_WORDS = Object\.freeze\(\{/);
  for (const word of ["got it", "almost there", "needs re-teaching", "not met yet"]) {
    assert.ok(students.includes(`"${word}"`), `sound status word missing: ${word}`);
  }
  assert.match(students, /aria-label=\{tile\.bucket === "unseen"/);
  assert.match(students, /SOUND_STATUS_WORDS\[tile\.bucket\]/);

  // ...and the whole metric definition no longer hides in a native title.
  assert.doesNotMatch(students, /metricDefinitionText/);
  assert.match(students, /<MetricDefinition\s+metricId="accuracy"\s+label="Sound status"/);

  // Class map (v2 Dashboard): every heat tile is a button that speaks its own
  // status and counts, the grid opens with a one-sentence overview naming each
  // sound under its status word, and the same ⓘ carries the explanation.
  assert.match(today, /const soundStatusSentence = \[/);
  assert.match(today, /label=\{`Class sound map\. \$\{soundStatusSentence\}/);
  assert.match(
    today,
    /aria-label=\{`\$\{tile\.label\} · \$\{SOUND_TILE_STATUS_WORDS\[severity\]\} · \$\{tile\.gotIt\} got it/
  );
  assert.match(today, /SOUND_TILE_STATUS_WORDS = Object\.freeze\(\{/);
  assert.match(today, /<MetricDefinition\s+metricId="accuracy"\s+label="Sound status"/);
});

test("the sign-in pictures dialog says one thing to everyone, without design rationale", async () => {
  const students = await source("src/components/TeacherStudentsPage.jsx");

  assert.match(students, /label=\{`Change sign-in pictures for \$\{editingStudent\.name\}`\}/);
  assert.match(students, /<h3>Change sign-in pictures for \{editingStudent\.name\}<\/h3>/);
  assert.doesNotMatch(students, /Change password for/);
  assert.doesNotMatch(students, /teacher-visible by design/);
});

test("the compact roster controls name the student they act on", async () => {
  const students = await source("src/components/TeacherStudentsPage.jsx");

  // v2 Students: a roster row is the selector, so the controls that used to sit
  // in every row now name the ONE student the panel is showing.
  assert.match(students, /aria-label=\{`\$\{selectedStudentRow\.symbol_password \? "Change" : "Set"\} sign-in pictures for \$\{selectedStudentRow\.name\}`\}/);
  assert.match(students, /aria-label=\{`\$\{heatOpenId === selectedStudentRow\.id \? "Hide" : "Show"\} \$\{selectedStudentRow\.name\}'s sound map`\}/);
  assert.match(students, /aria-label=\{`Assess \$\{selectedStudentRow\.name\}`\}/);
  assert.match(students, /aria-label=\{`Select \$\{row\.name\}`\}/);
  // The row button is not given an aria-label: its own contents (name, sign-in
  // state) are the accessible name, so nothing in the row is hidden from a
  // screen reader by a shorter label.
  assert.doesNotMatch(students, /aria-label=\{`Open \$\{row\.name\}`\}/);
  // Reset and reveal controls moved into the named student panel/settings
  // instead of widening every roster row.
  assert.match(students, /label=\{`Options for \$\{actionsStudent\.name\}`\}/);
  assert.match(students, /Reset sign-in pictures/);
});

test("attention thresholds live in the tooltip, never on the today surface", async () => {
  const today = await source("src/components/TeacherTodayPage.jsx");

  assert.doesNotMatch(today, /answers when accuracy is below/);
  assert.doesNotMatch(today, /policyBasis/);
  assert.match(
    today,
    /counts=\{`Students who have answered at least \$\{policy\.minimumResponsesForAttention\} times and are getting fewer than \$\{policy\.attentionAccuracyBelow\}% of those answers right\.`\}/
  );
});

test("a missing class average gives the reason that actually applies", async () => {
  const students = await source("src/components/TeacherStudentsPage.jsx");

  assert.match(students, /function classAverageHeldBackNote\(comparability = \{\}\)/);
  assert.doesNotMatch(students, /fairAverage\(2\)/);
  assert.match(students, /rule\.minimumPolicyReadyLearners/);
  assert.match(students, /rule\.minimumPolicyReadyProportion/);
  assert.match(students, /rule\.maximumResponseImbalanceRatio/);
  assert.match(students, /have done enough assessments so far/);
  assert.match(students, /has answered far more often than the others/);
  assert.match(students, /missing the number of answers for at least one student/);
  assert.match(
    students,
    /classAverageHeldBackNote\(classAccuracySummary\.comparability\)/
  );
});

test("retry focus follows loading to either the restored page or another recovery action", async () => {
  const [surface, recovery, css, stateMatrix] = await Promise.all([
    source("src/components/teacher/ui/TeacherSurfaceState.jsx"),
    source("src/components/teacher/ui/teacherSurfaceRecoveryFocus.js"),
    source("src/App.css"),
    source("docs/teacher/STATE_MATRIX.md")
  ]);

  assert.match(surface, /beginTeacherSurfaceRecoveryFocus\(\{/);
  assert.match(surface, /sourceControl: event\.currentTarget/);
  assert.match(surface, /data-teacher-state=\{state\}[\s\S]*?tabIndex="-1"/);
  assert.match(recovery, /if \(state === "loading"\)/);
  assert.match(recovery, /teacher-surface-state-actions button:not\(:disabled\)/);
  assert.match(recovery, /pageHeading\(documentRef, sourceRoot\)/);
  assert.match(recovery, /observer\.disconnect\(\)/);
  assert.match(css, /\.teacher-surface-state:focus\s*\{[\s\S]*?outline:\s*3px/);
  assert.match(stateMatrix, /focus returns to its recovery action/);
  assert.match(stateMatrix, /focus[\s\S]*?moves to the restored page heading/);
  assert.doesNotMatch(stateMatrix, /Retry leaves focus on the control/);
});
