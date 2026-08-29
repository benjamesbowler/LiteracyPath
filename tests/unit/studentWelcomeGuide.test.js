import assert from "node:assert/strict";
import test from "node:test";

import {
  STUDENT_WELCOME_GUIDE_AUTO_VISITS,
  beginStudentWelcomeVisit,
  dismissStudentWelcomePrompt,
  studentWelcomeGuideStorageKey
} from "../../src/utils/studentWelcomeGuide.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(String(key), String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

function begin(storage, scopeKey, loginKey, enabled = true) {
  return beginStudentWelcomeVisit({ enabled, loginKey, scopeKey, storage });
}

test("the first login gets the tour, the next two get reminders, and later logins stay quiet", () => {
  const storage = memoryStorage();
  const scopeKey = "student-1";

  assert.deepEqual(begin(storage, scopeKey, "login-1"), { kind: "tour", visitCount: 1 });
  assert.deepEqual(
    begin(storage, scopeKey, "login-1"),
    { kind: "tour", visitCount: 1 },
    "StrictMode and route remounts must not count as new logins"
  );
  assert.deepEqual(begin(storage, scopeKey, "login-2"), { kind: "reminder", visitCount: 2 });
  assert.deepEqual(begin(storage, scopeKey, "login-3"), { kind: "reminder", visitCount: 3 });
  assert.deepEqual(begin(storage, scopeKey, "login-4"), { kind: "none", visitCount: 4 });
  assert.deepEqual(begin(storage, scopeKey, "login-5"), { kind: "none", visitCount: 4 });
  assert.equal(STUDENT_WELCOME_GUIDE_AUTO_VISITS, 3);
});

test("a dismissed prompt stays dismissed for the rest of that login", () => {
  const storage = memoryStorage();
  const scopeKey = "student-2";
  begin(storage, scopeKey, "login-1");

  assert.equal(dismissStudentWelcomePrompt({ storage, scopeKey, loginKey: "login-1" }), true);
  assert.deepEqual(begin(storage, scopeKey, "login-1"), { kind: "none", visitCount: 1 });
  assert.deepEqual(begin(storage, scopeKey, "login-2"), { kind: "reminder", visitCount: 2 });
});

test("learners are isolated and disabled previews do not write a guide record", () => {
  const storage = memoryStorage();
  assert.deepEqual(begin(storage, "student-a", "login-a"), { kind: "tour", visitCount: 1 });
  assert.deepEqual(begin(storage, "student-b", "login-b"), { kind: "tour", visitCount: 1 });
  assert.notEqual(
    studentWelcomeGuideStorageKey("student-a"),
    studentWelcomeGuideStorageKey("student-b")
  );

  assert.deepEqual(begin(storage, "teacher-preview", "preview", false), {
    kind: "none",
    visitCount: 0
  });
  assert.equal(storage.getItem(studentWelcomeGuideStorageKey("teacher-preview")), null);
});

test("a damaged guide preference recovers as a first visit", () => {
  const storage = memoryStorage();
  storage.setItem(studentWelcomeGuideStorageKey("student-3"), "not-json");
  assert.deepEqual(begin(storage, "student-3", "login-1"), { kind: "tour", visitCount: 1 });
});
