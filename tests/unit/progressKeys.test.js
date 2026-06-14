import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PROGRESS_AREAS,
  localProgressStorageKey,
  localProgressKeysForStudent
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
