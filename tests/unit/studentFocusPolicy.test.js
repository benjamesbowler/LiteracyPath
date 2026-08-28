import assert from "node:assert/strict";
import test from "node:test";

import { APP_VIEWS } from "../../src/appState/appViews.js";
import { isStudentAllowedView } from "../../src/appState/appViewHelpers.js";
import {
  STUDENT_FOCUS_TARGETS,
  enforceStudentFocusView,
  isActiveStudentFocusSession,
  studentFocusTargetView
} from "../../src/policy/studentFocusTargets.js";

const activeSession = target => ({
  id: `session-${target}`,
  target,
  status: "active",
  expires_at: new Date(Date.now() + 60_000).toISOString()
});

test("each teacher focus target resolves to one student destination", () => {
  assert.equal(studentFocusTargetView(STUDENT_FOCUS_TARGETS.READING_LIBRARY), APP_VIEWS.GUIDED_READING);
  assert.equal(studentFocusTargetView(STUDENT_FOCUS_TARGETS.LETTERS_PRACTICE), APP_VIEWS.PHONICS_LEARN);
  assert.equal(studentFocusTargetView(STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT), APP_VIEWS.ASSESSMENT);
});

test("library and letters sessions force every navigation attempt back to the assigned area", () => {
  for (const [target, expected] of [
    [STUDENT_FOCUS_TARGETS.READING_LIBRARY, APP_VIEWS.GUIDED_READING],
    [STUDENT_FOCUS_TARGETS.LETTERS_PRACTICE, APP_VIEWS.PHONICS_LEARN]
  ]) {
    const session = activeSession(target);
    assert.equal(enforceStudentFocusView(APP_VIEWS.STUDENT_HOME, session), expected);
    assert.equal(enforceStudentFocusView(APP_VIEWS.LEARN, session), expected);
    assert.equal(enforceStudentFocusView(APP_VIEWS.STUDENT_REWARDS, session), expected);
  }
});

test("skills assessment allows only its assessment and completion views", () => {
  const session = activeSession(STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT);
  assert.equal(enforceStudentFocusView(APP_VIEWS.ASSESSMENT, session), APP_VIEWS.ASSESSMENT);
  assert.equal(enforceStudentFocusView(APP_VIEWS.CHECKPOINT, session), APP_VIEWS.CHECKPOINT);
  assert.equal(enforceStudentFocusView(APP_VIEWS.STUDENT_HOME, session), APP_VIEWS.ASSESSMENT);
  assert.equal(isStudentAllowedView(APP_VIEWS.ASSESSMENT, session), true);
  assert.equal(isStudentAllowedView(APP_VIEWS.CHECKPOINT, session), true);
  assert.equal(isStudentAllowedView(APP_VIEWS.ASSESSMENT), false);
});

test("expired and ended sessions stop controlling navigation", () => {
  const expired = {
    ...activeSession(STUDENT_FOCUS_TARGETS.READING_LIBRARY),
    expires_at: new Date(Date.now() - 1_000).toISOString()
  };
  const ended = { ...activeSession(STUDENT_FOCUS_TARGETS.READING_LIBRARY), status: "ended" };
  assert.equal(isActiveStudentFocusSession(expired), false);
  assert.equal(isActiveStudentFocusSession(ended), false);
  assert.equal(enforceStudentFocusView(APP_VIEWS.LEARN, expired), APP_VIEWS.LEARN);
  assert.equal(enforceStudentFocusView(APP_VIEWS.LEARN, ended), APP_VIEWS.LEARN);
});
