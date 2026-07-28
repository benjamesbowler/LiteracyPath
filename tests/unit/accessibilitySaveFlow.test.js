import assert from "node:assert/strict";
import test from "node:test";

import {
  ACCESSIBILITY_SAVE_ERROR,
  runAccessibilitySave
} from "../../src/components/teacher/accessibilitySaveFlow.js";

const request = {
  student: { id: "student-1", name: "Aaron" },
  draft: { reducedMotion: true }
};

test("accessibility save closes only after an explicit true result", async () => {
  const result = await runAccessibilitySave({
    ...request,
    onSave: async () => true
  });

  assert.deepEqual(result, { ok: true, error: "" });
});

test("false and undefined accessibility saves remain failed", async () => {
  for (const value of [false, undefined]) {
    const result = await runAccessibilitySave({
      ...request,
      onSave: async () => value
    });
    assert.deepEqual(result, { ok: false, error: ACCESSIBILITY_SAVE_ERROR });
  }
});

test("a rejected accessibility save becomes a safe inline failure", async () => {
  const result = await runAccessibilitySave({
    ...request,
    onSave: async () => {
      throw new Error("raw database error");
    }
  });

  assert.deepEqual(result, { ok: false, error: ACCESSIBILITY_SAVE_ERROR });
  assert.doesNotMatch(result.error, /database/i);
});
