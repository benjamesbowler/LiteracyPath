import assert from "node:assert/strict";
import test from "node:test";
import {
  clearWorksheetCycleOverride,
  readWorksheetCycleContext,
  rememberWorksheetCycleOverride,
  worksheetCycleStorageKey
} from "../../src/utils/worksheets/worksheetCycleContext.js";

const cycleOptions = [3, 6, 9].map(number => ({ id: `cycle-${number}` }));
function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key)
  };
}
const context = { teacherId: "teacher-a", classId: "class-a", currentCycleId: "cycle-6", cycleOptions };

test("verified class cycle takes precedence over the legacy device-wide worksheet cycle", () => {
  const storage = memoryStorage({ "lp-worksheets-last-cycle": "cycle-3" });
  assert.deepEqual(readWorksheetCycleContext({ ...context, storage }), {
    cycleId: "cycle-6", currentCycleId: "cycle-6", source: "class"
  });
});

test("a deliberate worksheet override survives return without crossing class or teacher", () => {
  const storage = memoryStorage();
  assert.equal(rememberWorksheetCycleOverride({ ...context, cycleId: "cycle-9", storage }), true);
  assert.equal(readWorksheetCycleContext({ ...context, storage }).cycleId, "cycle-9");
  assert.equal(readWorksheetCycleContext({ ...context, classId: "class-b", currentCycleId: "cycle-3", storage }).cycleId, "cycle-3");
  assert.equal(readWorksheetCycleContext({ ...context, teacherId: "teacher-b", storage }).cycleId, "cycle-6");
  assert.notEqual(worksheetCycleStorageKey("teacher:a", "class"), worksheetCycleStorageKey("teacher", "a:class"));
  assert.equal(worksheetCycleStorageKey("", "class-a"), "");
  assert.equal(worksheetCycleStorageKey("teacher-a", ""), "");
});

test("reset removes only this class's deliberate override and follows its current cycle", () => {
  const storage = memoryStorage();
  rememberWorksheetCycleOverride({ ...context, cycleId: "cycle-9", storage });
  rememberWorksheetCycleOverride({ ...context, classId: "class-b", cycleId: "cycle-9", storage });
  assert.equal(clearWorksheetCycleOverride({ ...context, storage }), true);
  assert.equal(readWorksheetCycleContext({ ...context, currentCycleId: "cycle-3", storage }).cycleId, "cycle-3");
  assert.equal(readWorksheetCycleContext({ ...context, classId: "class-b", storage }).cycleId, "cycle-9");
});

test("unknown teaching context stays unresolved until a valid cycle is deliberately selected", () => {
  const storage = memoryStorage({
    "lp-worksheets-last-cycle": "cycle-3",
    [worksheetCycleStorageKey(context.teacherId, context.classId)]: "retired-cycle"
  });
  assert.deepEqual(readWorksheetCycleContext({ ...context, currentCycleId: "", storage }), {
    cycleId: "", currentCycleId: "", source: "unresolved"
  });
  assert.equal(rememberWorksheetCycleOverride({ ...context, cycleId: "retired-cycle", storage }), false);
  assert.equal(rememberWorksheetCycleOverride({ ...context, cycleId: "cycle-9", storage }), true);
  assert.deepEqual(readWorksheetCycleContext({ ...context, currentCycleId: "missing-cycle", storage }), {
    cycleId: "cycle-9", currentCycleId: "", source: "override"
  });
});

test("unavailable storage preserves the verified teaching context without throwing", () => {
  const storage = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); } };
  assert.equal(readWorksheetCycleContext({ ...context, storage }).cycleId, "cycle-6");
  assert.equal(rememberWorksheetCycleOverride({ ...context, cycleId: "cycle-9", storage }), false);
  assert.equal(clearWorksheetCycleOverride({ ...context, storage }), false);
});
