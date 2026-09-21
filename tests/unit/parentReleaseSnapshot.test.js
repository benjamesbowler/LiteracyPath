import assert from "node:assert/strict";
import test from "node:test";

import { buildParentReleaseSnapshot } from "../../src/data/parentReleaseSnapshot.js";
import { buildWholeChildAudienceTemplates, WHOLE_CHILD_REPORT_AUDIENCES } from "../../src/data/reportAudienceTemplates.js";
import { lintParentAreaPlainLanguage } from "../../src/data/parentAreaModel.js";

const workspace = {
  wholeChild: {
    reportKey: "whole_child",
    studentId: "11111111-1111-4111-8111-111111111111",
    evidence: [{ evidenceId: "private-evidence-id" }],
    concepts: [
      { domain: "alphabet_knowledge", status: { id: "secure" } },
      { domain: "decoding", status: { id: "developing" } },
      { domain: "encoding", status: { id: "needs_teaching" } },
      { domain: "fluency", status: { id: "mixed_evidence" } },
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
  assert.equal(snapshot.progress.length, 5);
  assert.ok(snapshot.atHome.activities.length > 0);
  assert.ok(snapshot.atHome.activities.length <= 3);
  for (const activity of snapshot.atHome.activities) {
    for (const field of ["moment", "title", "direction"]) assert.equal(typeof activity[field], "string");
  }
  assert.deepEqual(lintParentAreaPlainLanguage(snapshot), []);
  assert.doesNotMatch(JSON.stringify(snapshot), /private-evidence-id|whole_child|accuracy|raw score/i);
  assert.ok(Buffer.byteLength(JSON.stringify(snapshot)) < 65_536);
});

test("family release snapshots retain canonical report sections and progress statuses", () => {
  const snapshot = buildParentReleaseSnapshot({
    workspace,
    studentId: "11111111-1111-4111-8111-111111111111",
    studentName: "Aarav",
    className: "Willow Class",
    schoolName: "Oakfield Primary"
  });

  assert.ok(snapshot.canDo.length > 0);
  assert.ok(snapshot.nextFocus.length > 0);
  assert.equal(snapshot.progress.find(row => row.id === "spelling_words").status, "needs_support");
  assert.equal(snapshot.progress.find(row => row.id === "reading_aloud").status, "mixed_evidence");
});

test("family domain summaries never hide mixed evidence behind another status", () => {
  const collisionWorkspace = {
    wholeChild: {
      reportKey: "whole_child",
      studentId: "11111111-1111-4111-8111-111111111111",
      concepts: [
        { domain: "fluency", status: { id: "secure" } },
        { domain: "fluency", status: { id: "mixed_evidence" } },
        { domain: "decoding", status: { id: "developing" } },
        { domain: "decoding", status: { id: "mixed_evidence" } },
        { domain: "encoding", status: { id: "needs_support" } },
        { domain: "encoding", status: { id: "mixed_evidence" } }
      ]
    }
  };
  const snapshot = buildParentReleaseSnapshot({
    workspace: collisionWorkspace,
    studentId: "11111111-1111-4111-8111-111111111111",
    studentName: "Aarav",
    className: "Willow Class",
    schoolName: "Oakfield Primary"
  });

  assert.equal(snapshot.progress.find(row => row.id === "reading_aloud").status, "mixed_evidence");
  assert.equal(snapshot.progress.find(row => row.id === "reading_words").status, "mixed_evidence");
  assert.equal(snapshot.progress.find(row => row.id === "spelling_words").status, "mixed_evidence");
});

test("family release snapshots use report home support without a cycle-generated plan", () => {
  const snapshot = buildParentReleaseSnapshot({
    workspace,
    studentId: "11111111-1111-4111-8111-111111111111",
    studentName: "Aarav",
    className: "Willow Class",
    schoolName: "Oakfield Primary",
    cycleNumber: 999
  });
  const report = buildWholeChildAudienceTemplates({ report: workspace.wholeChild, studentName: "Aarav", className: "Willow Class" })[WHOLE_CHILD_REPORT_AUDIENCES.FAMILY];
  const homeSupport = report.sections.find(section => section.id === "what_you_can_do_at_home");
  assert.deepEqual(snapshot.atHome.activities.map(activity => activity.direction), homeSupport.items);
  assert.equal(snapshot.atHome.title, homeSupport.title);
});
