import test from "node:test";
import assert from "node:assert/strict";
import {
  worksheetCycleOptions,
  availableWorksheetTypes,
  getWorksheetCycle,
  buildWorksheetDocument
} from "../../src/utils/worksheets/worksheetBuilder.js";

const cycle10 = getWorksheetCycle("cycle-10");
const cycle26 = getWorksheetCycle("cycle-26");

test("cycle options are the numbered cycles", () => {
  const opts = worksheetCycleOptions();
  assert.ok(opts.length >= 27);
  assert.ok(opts.every(o => o.id && o.cycleNumber && o.title));
});

test("available types match the cycle's content", () => {
  const t10 = availableWorksheetTypes(cycle10);
  assert.ok(t10.includes("letterFormation"));
  assert.ok(t10.includes("wordBuilding"));
  assert.ok(t10.includes("sightWords"));
  assert.ok(!t10.includes("patternFluency"));

  const t26 = availableWorksheetTypes(cycle26);
  assert.ok(t26.includes("patternFluency"));
  assert.ok(t26.includes("sightWords"));
  assert.ok(!t26.includes("letterFormation"), "fluency cycles have no letter formation");
});

test("buildWorksheetDocument is deterministic (same recipe = same bytes)", () => {
  const recipe = { cycleId: "cycle-10", type: "wordBuilding", pages: 3 };
  const a = buildWorksheetDocument(recipe);
  const b = buildWorksheetDocument(recipe);
  assert.equal(a.html, b.html);
  assert.equal(a.title, b.title);
});

test("each available type builds a valid multi-page document", () => {
  for (const cycle of [cycle10, cycle26]) {
    for (const type of availableWorksheetTypes(cycle)) {
      const { html, title } = buildWorksheetDocument({ cycleId: cycle.id, type, pages: 2 });
      assert.ok(html.startsWith("<!doctype html>"), `${type} should be a full doc`);
      assert.equal((html.match(/class="page"/g) || []).length, 2, `${type} should have 2 pages`);
      assert.ok(html.includes(`Cycle ${cycle.cycleNumber}`), `${type} should name the cycle`);
      assert.ok(title.includes(`Cycle ${cycle.cycleNumber}`));
    }
  }
});

test("requesting a type a cycle does not support throws", () => {
  assert.throws(() => buildWorksheetDocument({ cycleId: "cycle-26", type: "letterFormation", pages: 1 }));
});

test("page count is clamped to a sensible range", () => {
  const big = buildWorksheetDocument({ cycleId: "cycle-10", type: "sightWords", pages: 99 });
  assert.ok((big.html.match(/class="page"/g) || []).length <= 8);
  const zero = buildWorksheetDocument({ cycleId: "cycle-10", type: "sightWords", pages: 0 });
  assert.equal((zero.html.match(/class="page"/g) || []).length, 1);
});
