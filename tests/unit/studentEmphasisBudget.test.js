import test from "node:test";
import assert from "node:assert/strict";

import { CHILD_SURFACE_ROUTES } from "../../src/policy/childSurfaceRules.js";
import {
  STUDENT_EMPHASIS_BUDGET_VERSION,
  STUDENT_EMPHASIS_ROUTES,
  STUDENT_EMPHASIS_VIEWPORTS,
  validateStudentEmphasisBudgetRegistry
} from "../../src/policy/studentEmphasisBudget.js";

test("A3.9 emphasis budget has an explicit review entry for every child route", () => {
  assert.match(STUDENT_EMPHASIS_BUDGET_VERSION, /^\d{4}\.\d{2}\.\d{2}$/);
  assert.deepEqual(
    STUDENT_EMPHASIS_ROUTES.map(route => route.id),
    CHILD_SURFACE_ROUTES.map(route => route.id)
  );
  assert.deepEqual(validateStudentEmphasisBudgetRegistry(), {
    pass: true,
    missing: [],
    unexpected: [],
    duplicates: [],
    incomplete: []
  });
});

test("A3.9 screenshot review covers desktop and small-phone layouts", () => {
  assert.deepEqual(STUDENT_EMPHASIS_VIEWPORTS, [
    { id: "desktop", width: 1280, height: 900 },
    { id: "phone", width: 390, height: 844 }
  ]);
});

test("A3.9 registry validation rejects missing, duplicate, and incomplete review rows", () => {
  const invalid = [
    ...STUDENT_EMPHASIS_ROUTES.slice(0, -1),
    { ...STUDENT_EMPHASIS_ROUTES[0] },
    { id: "my-hollow", primaryCue: "", treatment: "" }
  ];
  const verdict = validateStudentEmphasisBudgetRegistry(invalid);
  assert.equal(verdict.pass, false);
  assert.deepEqual(verdict.duplicates, ["student-login"]);
  assert.deepEqual(verdict.incomplete, ["my-hollow"]);
});
