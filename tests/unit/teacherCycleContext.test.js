import assert from "node:assert/strict";
import test from "node:test";
import { teacherCycleOptions } from "../../src/components/teacher/teacherCycleReference.js";
import {
  confirmTeacherCycle,
  LEGACY_TEACHER_CYCLE_KEY,
  readTeacherCycleState,
  resolveTeacherCycleContext,
  TEACHER_CYCLE_MIGRATION_KEY,
  TEACHER_CYCLE_STORAGE_KEY
} from "../../src/utils/teacherCycleContext.js";

const cycleOptions = teacherCycleOptions();
function fixture(entries = []) {
  const values = new Map(entries);
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}
const scope = { teacherId: "teacher-a", classId: "class-a", cycleOptions };
const resolve = (state, overrides = {}) => resolveTeacherCycleContext({ ...scope, state, ...overrides });

test("legacy device-wide teaching cycle is a visible suggestion until a class is confirmed", () => {
  const storage = fixture([[LEGACY_TEACHER_CYCLE_KEY, "cycle-6"]]);
  const state = readTeacherCycleState({ cycleOptions, storage });
  assert.deepEqual(resolve(state), { cycleId: "", suggestedCycleId: "cycle-6" });
  assert.deepEqual(resolve(state, { classId: "class-b" }), { cycleId: "", suggestedCycleId: "cycle-6" });
  assert.equal(storage.getItem(TEACHER_CYCLE_STORAGE_KEY), null);
  assert.deepEqual(resolve(state, { classId: "" }), { cycleId: "", suggestedCycleId: "" });
  assert.deepEqual(resolve(state, { teacherId: "" }), { cycleId: "", suggestedCycleId: "" });
});

test("confirming a class consumes the legacy suggestion once without assigning another class or teacher", () => {
  const storage = fixture([[LEGACY_TEACHER_CYCLE_KEY, "cycle-6"]]);
  const initial = readTeacherCycleState({ cycleOptions, storage });
  confirmTeacherCycle({ ...scope, state: initial, cycleId: "cycle-6", storage });
  const state = readTeacherCycleState({ cycleOptions, storage });
  assert.deepEqual(resolve(state), { cycleId: "cycle-6", suggestedCycleId: "" });
  assert.deepEqual(resolve(state, { classId: "class-b" }), { cycleId: "", suggestedCycleId: "" });
  assert.deepEqual(resolve(state, { teacherId: "teacher-b" }), { cycleId: "", suggestedCycleId: "" });
  assert.equal(storage.getItem(TEACHER_CYCLE_MIGRATION_KEY), "confirmed");
  assert.equal(storage.getItem(LEGACY_TEACHER_CYCLE_KEY), "cycle-6");
});

test("a deliberate different cycle resolves only its class and retains other scoped choices", () => {
  const storage = fixture([
    [LEGACY_TEACHER_CYCLE_KEY, "cycle-6"],
    [TEACHER_CYCLE_STORAGE_KEY, JSON.stringify({ "teacher-a:class-b": "cycle-3", "teacher-b:class-a": "cycle-9" })]
  ]);
  const state = confirmTeacherCycle({ ...scope, state: readTeacherCycleState({ cycleOptions, storage }), cycleId: "cycle-2", storage });
  assert.equal(resolve(state).cycleId, "cycle-2");
  assert.equal(resolve(state, { classId: "class-b" }).cycleId, "cycle-3");
  assert.equal(resolve(state, { teacherId: "teacher-b" }).cycleId, "cycle-9");
  assert.equal(state.legacyConfirmed, true);
});

test("catalogue validation rejects syntactically valid retired cycles and unknown context stays empty", () => {
  assert.equal(cycleOptions.some(option => option.id === "cycle-80"), false);
  const storage = fixture([
    [LEGACY_TEACHER_CYCLE_KEY, "cycle-80"],
    [TEACHER_CYCLE_STORAGE_KEY, JSON.stringify({ "teacher-a:class-a": "cycle-80", "teacher-a:class-b": "cycle-3" })]
  ]);
  const state = readTeacherCycleState({ cycleOptions, storage });
  assert.deepEqual(resolve(state), { cycleId: "", suggestedCycleId: "" });
  assert.equal(resolve(state, { classId: "class-b" }).cycleId, "cycle-3");
  assert.equal(confirmTeacherCycle({ ...scope, state, cycleId: "cycle-80", storage }), state);
  assert.equal(confirmTeacherCycle({ ...scope, state, teacherId: "", cycleId: "cycle-3", storage }), state);
});

test("blocked or malformed storage preserves unknown state and an explicit in-session choice", () => {
  for (const storage of [fixture([[TEACHER_CYCLE_STORAGE_KEY, "{"]]), { getItem() { throw new Error("Blocked"); }, setItem() { throw new Error("Blocked"); } }]) {
    const state = readTeacherCycleState({ cycleOptions, storage });
    assert.deepEqual(resolve(state), { cycleId: "", suggestedCycleId: "" });
    const next = confirmTeacherCycle({ ...scope, state, cycleId: "cycle-6", storage });
    assert.equal(resolve(next).cycleId, "cycle-6");
  }
});

test("confirming from an older tab preserves choices saved for other class scopes meanwhile", () => {
  const storage = fixture();
  const older = readTeacherCycleState({ cycleOptions, storage });
  const newer = confirmTeacherCycle({ ...scope, state: older, classId: "class-b", cycleId: "cycle-9", storage });
  assert.equal(resolve(newer, { classId: "class-b" }).cycleId, "cycle-9");
  const state = confirmTeacherCycle({ ...scope, state: older, cycleId: "cycle-6", storage });
  assert.equal(resolve(state).cycleId, "cycle-6");
  assert.equal(resolve(state, { classId: "class-b" }).cycleId, "cycle-9");
});
