import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PROGRESS_AREAS,
  localProgressStorageKey,
  localProgressKeysForStudent,
  RESET_AREA,
  shouldApplyReset
} from "../../src/utils/progressKeys.js";

test("every progress area maps to a non-empty, student-scoped key", () => {
  const id = "stu-123";
  for (const area of PROGRESS_AREAS) {
    const key = localProgressStorageKey(area, id);
    assert.ok(key, `area ${area} produced no key`);
    assert.ok(key.includes(id) || key.includes(encodeURIComponent(id)), `area ${area} key not scoped to student`);
  }
});

test("localProgressKeysForStudent returns one key per area", () => {
  const keys = localProgressKeysForStudent("stu-123");
  assert.equal(keys.length, PROGRESS_AREAS.length);
  assert.equal(new Set(keys).size, keys.length, "keys should be unique");
});

test("keys for different students never collide (reset is isolated)", () => {
  const a = new Set(localProgressKeysForStudent("alice"));
  const b = localProgressKeysForStudent("bob");
  for (const key of b) assert.ok(!a.has(key), `key ${key} collides across students`);
});

test("unknown area yields an empty key (ignored by callers)", () => {
  assert.equal(localProgressStorageKey("not-an-area", "x"), "");
});

test("the reset sentinel area maps to no storage key (hydrate ignores it)", () => {
  assert.equal(localProgressStorageKey(RESET_AREA, "stu-1"), "");
});

test("shouldApplyReset: apply only a newer-than-applied cloud reset", () => {
  const t1 = "2026-06-14T10:00:00.000Z";
  const t2 = "2026-06-14T12:00:00.000Z";
  assert.equal(shouldApplyReset(t1, ""), true, "first time we see any reset -> apply");
  assert.equal(shouldApplyReset(t2, t1), true, "a newer reset -> apply");
  assert.equal(shouldApplyReset(t1, t1), false, "already applied -> skip");
  assert.equal(shouldApplyReset(t1, t2), false, "older than applied -> skip");
  assert.equal(shouldApplyReset("", t1), false, "no cloud reset -> nothing to do");
});
