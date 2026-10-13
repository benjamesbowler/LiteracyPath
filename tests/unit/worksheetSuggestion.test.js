import assert from "node:assert/strict";
import test from "node:test";
import { worksheetCycleOptions, getWorksheetCycle, availableWorksheetTypes, buildWorksheetDocument } from "../../src/utils/worksheets/worksheetBuilder.js";
import { suggestWorksheetActivity, readWorksheetPackLength, rememberWorksheetPackLength } from "../../src/utils/worksheets/worksheetSuggestion.js";

test("every teaching cycle has a usable content-based practice suggestion", () => {
  for (const { id } of worksheetCycleOptions()) {
    const cycle = getWorksheetCycle(id);
    const suggestion = suggestWorksheetActivity({ cycle });
    assert.ok(availableWorksheetTypes(cycle).includes(suggestion.type), id);
    assert.notEqual(suggestion.type, "characterColouring", id);
    assert.ok(suggestion.reason.length > 20, id);
    const recipe = { cycleId: id, type: suggestion.type, pages: 2 };
    const pack = buildWorksheetDocument(recipe);
    assert.ok(pack.html.includes("<html"), id);
    assert.equal(pack.html, buildWorksheetDocument(recipe).html, id);
  }
});

test("focus hints select eligible recipes without forcing untaught activities", () => {
  const early = getWorksheetCycle("cycle-1");
  assert.equal(suggestWorksheetActivity({ cycle: early, focusId: "spelling" }).type, "letterFormation");
  const cycle = getWorksheetCycle("cycle-10");
  assert.equal(suggestWorksheetActivity({ cycle, focusId: "high_frequency_words" }).type, "sightWords");
  assert.equal(suggestWorksheetActivity({ cycle, focusId: "handwriting" }).type, "letterFormation");
  assert.equal(suggestWorksheetActivity({ cycle, focusId: "blending" }).type, "wordBuilding");
  assert.equal(suggestWorksheetActivity({ cycle: getWorksheetCycle("cycle-26") }).type, "patternFluency");
  assert.equal(suggestWorksheetActivity(), null);
});

test("pack length is deliberate, bounded, scoped to the teacher and safe when storage fails", () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  assert.equal(readWorksheetPackLength("teacher-a", storage), 2);
  assert.equal(rememberWorksheetPackLength("teacher-a", 4, storage), true);
  assert.equal(readWorksheetPackLength("teacher-a", storage), 4);
  assert.equal(readWorksheetPackLength("teacher-b", storage), 2);
  assert.equal(rememberWorksheetPackLength("", 4, storage), false);
  for (const invalid of [0, 7, 1.5, "4", NaN]) assert.equal(rememberWorksheetPackLength("teacher-a", invalid, storage), false);
  const blocked = { getItem() { throw Error("blocked"); }, setItem() { throw Error("blocked"); } };
  assert.equal(readWorksheetPackLength("teacher-a", blocked), 2);
  assert.equal(rememberWorksheetPackLength("teacher-a", 4, blocked), false);
});
