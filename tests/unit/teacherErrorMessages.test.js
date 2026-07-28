import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  teacherAuthErrorMessage,
  teacherMutationErrorMessage
} from "../../src/appState/teacherErrorMessages.js";

test("teacher authentication errors are useful without quoting backend details", () => {
  const invalid = teacherAuthErrorMessage({
    message: "Invalid login credentials"
  }, "login");
  assert.match(invalid, /email or password was not recognised/i);
  assert.doesNotMatch(invalid, /invalid login credentials/i);

  const offline = teacherAuthErrorMessage(
    new TypeError("Failed to fetch"),
    "password_reset_email"
  );
  assert.match(offline, /check your internet/i);
  assert.doesNotMatch(offline, /failed to fetch/i);

  const limited = teacherAuthErrorMessage({
    status: 429,
    message: "over_email_send_rate_limit"
  }, "signup");
  assert.match(limited, /wait a few minutes/i);
  assert.doesNotMatch(limited, /over_email_send_rate_limit/i);

  const unknown = teacherAuthErrorMessage({
    message: "relation auth.identities does not exist"
  }, "password_update");
  assert.match(unknown, /nothing changed/i);
  assert.doesNotMatch(unknown, /relation|identities/i);
});

test("teacher save errors keep migration and database language out of the interface", () => {
  const school = teacherMutationErrorMessage({
    code: "PGRST202",
    message: "Could not find public.teacher_set_school in the schema cache"
  }, "save_school");
  assert.match(school, /site needs an update/i);
  assert.match(school, /nothing changed/i);
  assert.doesNotMatch(school, /PGRST|teacher_set_school|schema|migration/i);

  const duplicate = teacherMutationErrorMessage({
    code: "23505",
    message: "duplicate key value violates unique constraint"
  }, "create_student", "Aaron");
  assert.equal(duplicate, 'A student named "Aaron" already exists in this class.');

  const unknown = teacherMutationErrorMessage({
    code: "XX000",
    message: "deadlock detected"
  }, "create_student", "Aaron");
  assert.match(unknown, /couldn't add the student/i);
  assert.match(unknown, /nothing changed/i);
  assert.doesNotMatch(unknown, /deadlock|XX000/i);
});

test("controller never sends raw authentication or student-create errors to teacher-facing state", async () => {
  const source = await readFile(
    new URL("../../src/appState/useAppSessionController.js", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /setAuthMessage\(error\.message\)/);
  assert.doesNotMatch(source, /Could not create student:\s*\$\{error\.message\}/);
  assert.doesNotMatch(source, /Apply the teacher_set_school migration/);
  assert.doesNotMatch(source, /setAuthMessage\("Logged out\."\)/);
  assert.match(source, /setAuthMessage\("Signed out\."\)/);
  assert.match(source, /teacherAuthErrorMessage\(error, "login"\)/);
  assert.match(source, /teacherMutationErrorMessage\(error, "create_student", clean\)/);
});
