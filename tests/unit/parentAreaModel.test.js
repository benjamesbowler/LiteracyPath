import assert from "node:assert/strict";
import test from "node:test";
import {
  buildParentAreaModel,
  lintParentAreaPlainLanguage,
  parentStatusCopy
} from "../../src/data/parentAreaModel.js";

const learner = {
  id: "learner-one",
  name: "Aarav",
  classLabel: "Willow Class",
  schoolName: "Oakfield Primary"
};

test("parent area keeps no more than six plain-language progress strands", () => {
  const model = buildParentAreaModel({
    learner,
    progress: Array.from({ length: 8 }, (_unused, index) => ({
      id: `area-${index}`,
      label: `Reading area ${index + 1}`,
      status: index === 0 ? "doing well" : index === 1 ? "growing" : "not checked"
    }))
  });

  assert.equal(model.progress.length, 6);
  assert.deepEqual(model.progress.slice(0, 3).map(item => item.statusLabel), [
    "Doing well",
    "Growing",
    "Not checked yet"
  ]);
  assert.deepEqual(lintParentAreaPlainLanguage(model), []);
});

test("parent area exposes released reports only and sorts newest first", () => {
  const model = buildParentAreaModel({
    learner,
    reports: [
      { id: "older", title: "Older update", publishedAt: "2026-01-10", releaseState: "released" },
      { id: "draft", title: "Internal draft", publishedAt: "2026-08-20", releaseState: "draft" },
      { id: "newer", title: "Newer update", publishedAt: "2026-08-18", releaseState: "released" }
    ]
  });

  assert.deepEqual(model.reports.map(report => report.id), ["newer", "older"]);
  assert.doesNotMatch(JSON.stringify(model), /Internal draft/);
});

test("parent area rejects an unlinked learner shape and uses honest missing wording", () => {
  assert.throws(() => buildParentAreaModel({ learner: { id: "missing-name" } }), /id and name/);
  assert.equal(parentStatusCopy("unexpected-status").label, "Not checked yet");
});
