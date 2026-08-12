import assert from "node:assert/strict";
import test from "node:test";

import {
  A11Y_KEY_MODAL_STATES,
  A11Y_PRIMARY_ROUTES,
  A11Y_VIEWPORTS,
  validateA11yInventory
} from "../../src/accessibility/primaryRouteInventory.js";

test("A3.3 inventory covers every primary child and authenticated teacher route", () => {
  assert.equal(validateA11yInventory(), true);
  assert.deepEqual(
    A11Y_PRIMARY_ROUTES.filter(row => row.audience === "student").map(row => row.id),
    [
      "student-login",
      "student-home",
      "maths-home",
      "maths-lesson",
      "maths-check",
      "maths-stories",
      "maths-arcade",
      "phonics",
      "arcade",
      "adventure-map",
      "sound-seekers",
      "story-quests",
      "reading-library",
      "my-hollow"
    ]
  );
  assert.deepEqual(
    A11Y_PRIMARY_ROUTES.filter(row => row.audience === "teacher").map(row => row.id),
    [
      "teacher-dashboard",
      "maths-teacher-dashboard",
      "teacher-children",
      "teacher-checks",
      "teacher-reports",
      "teacher-resources",
      "teacher-settings",
      "teacher-report",
      "teacher-assessment",
      "teacher-guided-reading"
    ]
  );
});

test("A3.3 inventory fixes two viewports and seven key modal states", () => {
  assert.deepEqual(A11Y_VIEWPORTS.map(row => row.id), ["desktop", "mobile"]);
  assert.equal(A11Y_KEY_MODAL_STATES.length, 7);
  assert.ok(A11Y_KEY_MODAL_STATES.every(row => row.dialogName));
});
