import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFamilyReportSections,
  buildParentAreaModel,
  lintParentAreaPlainLanguage,
  parentStatusCopy
} from "../../src/data/parentAreaModel.js";
import {
  familyReportPrintableHtml,
  familyReportModelForRelease
} from "../../src/data/familyReportDocument.js";

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
    "Secure",
    "Developing",
    "Not checked"
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
  assert.equal(parentStatusCopy("unexpected-status").label, "Not checked");
});

test("released family dialog and print keep the Reporting Bible's six sections when lists are empty", () => {
  const model = buildParentAreaModel({ learner });
  const sections = buildFamilyReportSections(model);
  const printed = familyReportPrintableHtml({ title: "Aarav's reading update", model });
  const titles = [
    "Summary highlight",
    "What your child can do",
    "What we're working on next",
    "What this means",
    "What you can do at home",
    "Who to talk to"
  ];

  assert.deepEqual(sections.map(section => section.title), titles);
  sections.forEach(section => assert.ok(section.description));
  let previousIndex = -1;
  titles.forEach(title => {
    const index = printed.indexOf(title);
    assert.ok(index > previousIndex, `${title} stays in the canonical print order`);
    previousIndex = index;
  });
});

test("printing a released report uses its immutable snapshot rather than the current portal model", () => {
  const currentModel = buildParentAreaModel({
    learner,
    highlight: "The latest portal update.",
    canDo: ["Latest strength"],
    nextFocus: ["Latest focus"]
  });
  const report = {
    id: "spring-report",
    title: "Spring reading update",
    snapshot: {
      learner,
      highlight: "The released spring update.",
      canDo: ["Released strength"],
      nextFocus: ["Released focus"]
    }
  };

  const printed = familyReportPrintableHtml({
    title: report.title,
    model: familyReportModelForRelease(report, currentModel)
  });
  assert.match(printed, /Released strength/);
  assert.match(printed, /Released focus/);
  assert.doesNotMatch(printed, /Latest strength|Latest focus/);
});
