import assert from "node:assert/strict";
import test from "node:test";

import { buildParentReleaseSnapshot } from "../../src/data/parentReleaseSnapshot.js";
import { lintParentAreaPlainLanguage } from "../../src/data/parentAreaModel.js";

const workspace = {
  wholeChild: {
    reportKey: "whole_child",
    studentId: "11111111-1111-4111-8111-111111111111",
    evidence: [{ evidenceId: "private-evidence-id" }],
    concepts: [
      { domain: "alphabet_knowledge", status: { id: "secure" } },
      { domain: "decoding", status: { id: "developing" } },
      { domain: "comprehension", status: { id: "not_checked" } }
    ]
  }
};

test("family release snapshots contain plain-language summaries but no raw evidence", () => {
  const snapshot = buildParentReleaseSnapshot({
    workspace,
    studentId: "11111111-1111-4111-8111-111111111111",
    studentName: "Aarav",
    className: "Willow Class",
    schoolName: "Oakfield Primary",
    teacherName: "Ms Green",
    teacherEmail: "teacher@example.invalid",
    cycleNumber: 1
  });

  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.learner.name, "Aarav");
  assert.equal(snapshot.progress.length, 3);
  assert.equal(snapshot.atHome.activities.length, 5);
  assert.deepEqual(lintParentAreaPlainLanguage(snapshot), []);
  assert.doesNotMatch(JSON.stringify(snapshot), /private-evidence-id|whole_child|accuracy|raw score/i);
  assert.ok(Buffer.byteLength(JSON.stringify(snapshot)) < 65_536);
});

test("family release snapshots fall back to a valid teaching cycle", () => {
  const snapshot = buildParentReleaseSnapshot({
    workspace,
    studentId: "11111111-1111-4111-8111-111111111111",
    studentName: "Aarav",
    className: "Willow Class",
    schoolName: "Oakfield Primary",
    cycleNumber: 999
  });
  assert.equal(snapshot.atHome.activities.length, 5);
});
