import assert from "node:assert/strict";
import test from "node:test";

import {
  STUDENT_FOCUS_END_ACTIONS,
  markStudentFocusExitHandled,
  shouldHandleStudentFocusExit
} from "../../src/policy/studentFocusExit.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); }
  };
}

test("student-picker exits are handled once per ended session on each iPad", () => {
  const storage = memoryStorage();
  const command = {
    endAction: STUDENT_FOCUS_END_ACTIONS.STUDENT_PICKER,
    endedSessionId: "focus-1"
  };

  assert.equal(shouldHandleStudentFocusExit(command, storage), true);
  markStudentFocusExitHandled(command.endedSessionId, storage);
  assert.equal(shouldHandleStudentFocusExit(command, storage), false);
  assert.equal(shouldHandleStudentFocusExit({
    endAction: STUDENT_FOCUS_END_ACTIONS.RETURN_HOME,
    endedSessionId: "focus-2"
  }, storage), false);
  assert.equal(shouldHandleStudentFocusExit({
    endAction: STUDENT_FOCUS_END_ACTIONS.STUDENT_PICKER,
    endedSessionId: ""
  }, storage), false);
});
