import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

const app = source("src/App.jsx");
const controller = source("src/appState/useAppSessionController.js");
const follower = source("src/hooks/useStudentFocusSession.js");
const host = source("src/hooks/useStudentFocusSessionHost.js");

test("student polling carries the server end command into App before normal end handling", () => {
  assert.match(follower, /endAction: data\?\.end_action \|\| ""/);
  assert.match(follower, /endedSessionId: data\?\.ended_session_id \|\| ""/);
  assert.ok(
    app.indexOf("shouldHandleStudentFocusExit(exitCommand") < app.indexOf("if (!session)"),
    "the student-picker command must be consumed before the ordinary return-home path"
  );
  assert.match(app, /markStudentFocusExitHandled\(exitCommand\.endedSessionId/);
  assert.match(app, /const returnToStudentSelectionEvent = useEffectEvent\(returnToStudentSelection\)/);
  assert.match(app, /returnToStudentSelectionEvent\(\)/);
});

test("forced student switching keeps class context but clears the learner token and progress session", () => {
  const start = controller.indexOf("function returnToStudentSelection()");
  const end = controller.indexOf("\n  useEffect", start);
  const implementation = controller.slice(start, end);

  assert.match(implementation, /localStorage\.removeItem\(STUDENT_SESSION_STORAGE_KEY\)/);
  assert.match(implementation, /clearProgressSyncSession\(\)/);
  assert.match(implementation, /setStudentSession\(null\)/);
  assert.match(implementation, /setNameSaved\(false\)/);
  assert.match(implementation, /setSessionMode\("student"\)/);
  assert.match(implementation, /setEntryMode\("student"\)/);
  assert.match(implementation, /setAppView\(APP_VIEWS\.STUDENT_LOGIN\)/);
  assert.doesNotMatch(implementation, /CLASS_CONTEXT_STORAGE_KEY/);
});

test("the teacher host forwards the selected end destination", () => {
  assert.match(host, /const end = useCallback\(async endAction =>/);
  assert.match(host, /endStudentFocusSession\(\{[\s\S]*sessionId: sessionRef\.current\.id,[\s\S]*endAction/);
});
