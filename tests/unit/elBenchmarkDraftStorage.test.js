import test from "node:test";
import assert from "node:assert/strict";

import {
  deleteElBenchmarkDraft,
  getElBenchmarkDraftStorageKey,
  loadElBenchmarkDraft,
  resolveElBenchmarkSessionOwnership,
  saveElBenchmarkDraft
} from "../../src/appState/studentSessionHelpers.js";

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

test("EL benchmark drafts use a distinct teacher-and-student key", () => {
  assert.equal(
    getElBenchmarkDraftStorageKey({ teacherId: "teacher-1", studentId: "student-a" }),
    "elBenchmarkDraft:v1:teacher-1:student-a"
  );
  assert.notEqual(
    getElBenchmarkDraftStorageKey({ teacherId: "teacher-1", studentId: "student-a" }),
    getElBenchmarkDraftStorageKey({ teacherId: "teacher-1", studentId: "student-b" })
  );
});

test("draft A survives switching to B and can be resumed exactly after reload", () => {
  const storage = createMemoryStorage();
  const draftA = {
    sessionId: "session-a",
    studentId: "student-a",
    assessmentId: "el_decoding",
    currentItemIndex: 7,
    responses: { word_1: { accurate: true, automatic: false } }
  };
  const draftB = {
    sessionId: "session-b",
    studentId: "student-b",
    assessmentId: "el_encoding",
    currentItemIndex: 2,
    responses: { word_1: { responseText: "ship" } }
  };

  assert.equal(saveElBenchmarkDraft({ teacherId: "teacher-1", studentId: "student-a", session: draftA, storage }), true);
  assert.equal(saveElBenchmarkDraft({ teacherId: "teacher-1", studentId: "student-b", session: draftB, storage }), true);

  assert.deepEqual(loadElBenchmarkDraft({ teacherId: "teacher-1", studentId: "student-a", storage }), draftA);
  assert.deepEqual(loadElBenchmarkDraft({ teacherId: "teacher-1", studentId: "student-b", storage }), draftB);

  assert.equal(deleteElBenchmarkDraft({ teacherId: "teacher-1", studentId: "student-b", storage }), true);
  assert.deepEqual(loadElBenchmarkDraft({ teacherId: "teacher-1", studentId: "student-a", storage }), draftA);
  assert.equal(loadElBenchmarkDraft({ teacherId: "teacher-1", studentId: "student-b", storage }), null);
});

test("a draft cannot be written under another student's key", () => {
  const storage = createMemoryStorage();
  assert.equal(saveElBenchmarkDraft({
    teacherId: "teacher-1",
    studentId: "student-b",
    session: { sessionId: "session-a", studentId: "student-a" },
    storage
  }), false);
  assert.equal(loadElBenchmarkDraft({ teacherId: "teacher-1", studentId: "student-b", storage }), null);
});

test("Class A EL ownership cannot be resumed or finished after the teacher switches to Class B", () => {
  const classASession = {
    sessionId: "session-a",
    studentId: "student-a",
    classId: "class-a",
    teacherId: "teacher-1"
  };

  const switchedContext = resolveElBenchmarkSessionOwnership({
    session: classASession,
    activeSession: classASession,
    currentTeacherId: "teacher-1",
    currentStudentId: "student-b",
    selectedClassId: "class-b"
  });
  assert.equal(switchedContext.ok, false);
  assert.equal(switchedContext.reason, "different_teacher_context");
  assert.equal(switchedContext.classId, "class-a");

  const forgedClassBCompletion = resolveElBenchmarkSessionOwnership({
    session: { ...classASession, classId: "class-b", administrationStatus: "completed" },
    activeSession: classASession,
    currentTeacherId: "teacher-1",
    currentStudentId: "student-a",
    selectedClassId: "class-a"
  });
  assert.equal(forgedClassBCompletion.ok, false);
  assert.equal(forgedClassBCompletion.reason, "session_ownership_changed");
  assert.equal(forgedClassBCompletion.classId, "class-a");

  const originalContext = resolveElBenchmarkSessionOwnership({
    session: { ...classASession, administrationStatus: "completed" },
    activeSession: classASession,
    currentTeacherId: "teacher-1",
    currentStudentId: "student-a",
    selectedClassId: "class-a"
  });
  assert.equal(originalContext.ok, true);
  assert.equal(originalContext.classId, "class-a");
});

test("legacy EL drafts without immutable class ownership fail closed", () => {
  const legacyDraft = {
    sessionId: "legacy-session",
    studentId: "student-a",
    teacherId: "teacher-1"
  };
  const result = resolveElBenchmarkSessionOwnership({
    session: legacyDraft,
    activeSession: legacyDraft,
    currentTeacherId: "teacher-1",
    currentStudentId: "student-a",
    selectedClassId: "class-a"
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "missing_session_ownership");
});
