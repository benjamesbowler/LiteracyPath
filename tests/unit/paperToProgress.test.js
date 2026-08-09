import test from "node:test";
import assert from "node:assert/strict";
import { WORKSHEET_TYPES, availableWorksheetTypes, buildTrackedWorksheetDocument, getWorksheetCycle, worksheetCycleOptions } from "../../src/utils/worksheets/worksheetBuilder.js";
import { buildWorksheetInstanceRecipe, worksheetObservableTargets } from "../../src/utils/worksheets/buildWorksheetInstance.js";
import { buildWorksheetQrPayload } from "../../src/utils/worksheets/buildWorksheetQrPayload.js";
import { createBlankWorksheetMarks, validateWorksheetMarks } from "../../src/utils/worksheets/worksheetMarks.js";

test("every current worksheet task is explicitly tracked or explicitly untracked", () => {
  const kinds = new Set();
  for (const option of worksheetCycleOptions()) {
    const cycle = getWorksheetCycle(option.id);
    for (const type of availableWorksheetTypes(cycle)) worksheetObservableTargets({ cycleId: option.id, type, pages: 6 }).tasks.forEach(task => kinds.add(task.taskKind));
  }
  assert.ok(kinds.size > 20);
  for (const kind of kinds) assert.notEqual(kind, "unknown");
  for (const type of WORKSHEET_TYPES) {
    const option = worksheetCycleOptions().find(item => availableWorksheetTypes(getWorksheetCycle(item.id)).includes(type.id));
    const instance = buildWorksheetInstanceRecipe({ cycleId: option.id, type: type.id, pages: 2 });
    assert.ok(instance.targets.length > 0, `${type.id} needs an observable target`);
  }
});

test("blank marking grids are honestly not checked and validation is practice-only", () => {
  const blank = createBlankWorksheetMarks(["a", "b"], ["x", "y"]);
  assert.equal(blank.length, 4);
  assert.ok(blank.every(mark => mark.state === "not_checked"));
  const valid = validateWorksheetMarks({ marks: blank, allowedLearnerIds: ["a", "b"], allowedTargetKeys: ["x", "y"] });
  assert.ok(valid.every(mark => mark.purpose === "practice"));
  assert.throws(() => validateWorksheetMarks({ marks: [{ ...blank[0], learnerId: "other" }], allowedLearnerIds: ["a"], allowedTargetKeys: ["x"] }), /outside the frozen batch/);
});

test("QR payload contains only a high-entropy lookup token", () => {
  const token = "A".repeat(48);
  const url = buildWorksheetQrPayload({ origin: "https://literacy.guide", lookupToken: token });
  assert.equal(url, `https://literacy.guide/#teacher/resources/worksheets?worksheet=${token}`);
  assert.doesNotMatch(url, /learner|student|class=/i);
  assert.throws(() => buildWorksheetQrPayload({ origin: "https://literacy.guide", lookupToken: "short" }), /secure worksheet lookup token/);
});

test("every printed page carries the same anonymous marking locator", () => {
  const recipe = { cycleId: "cycle-1", type: "letterFormation", pages: 2 };
  const qrDataUrl = "data:image/png;base64,cHJpdmF0ZS1sb2NhdG9y";
  const { html } = buildTrackedWorksheetDocument(recipe, { qrDataUrl, shortCode: "BCDF2345" });
  assert.equal((html.match(/aria-label="Tracked worksheet"/g) || []).length, 2);
  assert.equal((html.match(/Code BCDF2345/g) || []).length, 2);
  assert.equal(html.includes("learner name"), true);
  assert.equal(html.includes("student_id"), false);
  assert.equal(html.includes("class_id"), false);
});
