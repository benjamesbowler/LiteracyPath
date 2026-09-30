import assert from "node:assert/strict";
import test from "node:test";
import {
  currentTeachingDay,
  readPresentWorkspaceState,
  rememberPresentWorkspaceState
} from "../../src/utils/present/presentWorkspaceState.js";

const cycleOptions = [{ id: "cycle-1", cycleNumber: 1 }, { id: "cycle-6", cycleNumber: 6 }];
function fixture() {
  const values = new Map();
  return { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
}
const wednesday = new Date(2026, 8, 30, 12);

test("Present remembers day, format, cycle and slide for the current class only", () => {
  const storage = fixture();
  const workspace = { cycleId: "cycle-6", day: "thursday", format: "extended", preview: 14 };
  assert.equal(rememberPresentWorkspaceState("class-a", workspace, storage), true);
  assert.deepEqual(readPresentWorkspaceState({ classId: "class-a", cycleOptions, storage, now: wednesday }), workspace);
  assert.deepEqual(readPresentWorkspaceState({ classId: "class-b", currentCycleId: "cycle-1", cycleOptions, storage, now: wednesday }), {
    cycleId: "cycle-1", day: "wednesday", format: "core", preview: 0
  });
});

test("corrupt, unavailable or retired workspace memory falls back to a usable current lesson", () => {
  const defaults = { cycleId: "cycle-6", day: "wednesday", format: "core", preview: 0 };
  for (const storage of [
    { getItem() { throw new Error("Unavailable"); } },
    { getItem: () => "invalid" },
    { getItem: () => JSON.stringify({ version: 1, cycleId: "retired", preview: 4 }) }
  ]) {
    assert.deepEqual(readPresentWorkspaceState({ classId: "class-a", currentCycleId: "cycle-6", cycleOptions, storage, now: wednesday }), defaults);
  }
  assert.equal(rememberPresentWorkspaceState("class-a", defaults, { setItem() { throw new Error("Unavailable"); } }), false);
});

test("unscoped presentations do not inherit another class and weekends preserve manual teaching days", () => {
  const storage = fixture();
  assert.equal(rememberPresentWorkspaceState("", { cycleId: "cycle-6" }, storage), false);
  assert.equal(currentTeachingDay(wednesday), "wednesday");
  assert.equal(currentTeachingDay(new Date(2026, 9, 3, 12)), null);
  assert.equal(readPresentWorkspaceState({ cycleOptions, now: new Date(2026, 9, 3, 12) }).day, "monday");
});
