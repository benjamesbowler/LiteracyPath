import assert from "node:assert/strict";
import test from "node:test";

import {
  getGuidedReadingStorageKey,
  migrateGuidedReadingStorage
} from "../../src/appState/studentSessionHelpers.js";

function memoryStorage(entries = {}) {
  const values = new Map(Object.entries(entries));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key)
  };
}

test("Guided Reading uses the same student-scoped key as cloud hydration", () => {
  assert.equal(
    getGuidedReadingStorageKey({ teacherId: "teacher", studentId: "child one" }),
    "literacyPath.guidedReadingRecords.child%20one"
  );
});

test("the first read migrates legacy teacher-scoped records without overwriting hydrated books", () => {
  const legacyKey = "guidedReadingAssessment:teacher-1:child-1";
  const canonicalKey = "literacyPath.guidedReadingRecords.child-1";
  const storage = memoryStorage({
    [legacyKey]: JSON.stringify({ legacyBook: { completed: true }, sharedBook: { local: true } }),
    [canonicalKey]: JSON.stringify({ cloudBook: { completed: true }, sharedBook: { cloud: true } })
  });
  assert.equal(migrateGuidedReadingStorage({
    teacherId: "teacher-1", studentId: "child-1", storage
  }), true);
  assert.deepEqual(JSON.parse(storage.getItem(canonicalKey)), {
    legacyBook: { completed: true },
    sharedBook: { cloud: true },
    cloudBook: { completed: true }
  });
  assert.equal(storage.getItem(legacyKey), null);
});
