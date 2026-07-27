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

  // Class map: the picture's description names each sound under its status, and
  // the same ⓘ carries the explanation.
  assert.match(today, /const soundStatusSentence = \[/);
  assert.match(today, /label=\{`Class sound map\. \$\{soundStatusSentence\}/);
  assert.match(today, /<MetricDefinition\s+metricId="accuracy"\s+label="Sound status"/);
});

test("the sign-in pictures dialog says one thing to everyone, without design rationale", async () => {
  const students = await source("src/components/TeacherStudentsPage.jsx");

  assert.match(students, /label=\{`Change sign-in pictures for \$\{editingStudent\.name\}`\}/);
  assert.match(students, /<h3>Change sign-in pictures for \{editingStudent\.name\}<\/h3>/);
  assert.doesNotMatch(students, /Change password for/);
  assert.doesNotMatch(students, /teacher-visible by design/);
});

test("every roster row button names the child it acts on", async () => {
  const students = await source("src/components/TeacherStudentsPage.jsx");

  assert.match(students, /aria-label=\{`Reset sign-in pictures for \$\{row\.name\}`\}/);
  assert.match(students, /aria-label=\{`\$\{loginReady \? "Change" : "Set"\} sign-in pictures for \$\{row\.name\}`\}/);
  assert.match(students, /aria-label=\{`\$\{visiblePasswords\[row\.id\] \? "Hide" : "Show"\} \$\{row\.name\}'s sign-in pictures`\}/);
  assert.match(students, /aria-label=\{`\$\{heatOpenId === row\.id \? "Hide" : "Show"\} \$\{row\.name\}'s sound map`\}/);
  assert.match(students, /aria-label=\{`Open \$\{row\.name\}`\}/);
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
  assert.match(students, /have done enough checks so far/);
  assert.match(students, /has answered far more often than the others/);
  assert.match(students, /missing the number of answers for at least one student/);
  assert.match(
    students,
    /classAverageHeldBackNote\(classAccuracySummary\.comparability\)/
  );
});
