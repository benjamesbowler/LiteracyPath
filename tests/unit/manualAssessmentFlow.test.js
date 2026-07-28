import assert from "node:assert/strict";
import test from "node:test";

import {
  chooseNewestManualAssessmentEntries,
  createManualAssessmentAttemptSession,
  getManualAssessmentDraftStorageKey,
  loadManualAssessmentDrafts,
  manualAssessmentAdministrationStatus,
  manualAssessmentEntryOwnership,
  replaceManualAssessmentEntry,
  restoreManualAssessmentAttemptSession,
  restoreManualAssessmentDraftsFromHistory,
  saveManualAssessmentDrafts,
  runSingleFlight
} from "../../src/appState/manualAssessmentFlow.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key)
  };
}

test("manual assessment ownership survives a profile reload and retry", () => {
  const session = createManualAssessmentAttemptSession({
    assessmentType: "el_letter_assessment",
    studentId: "student-1",
    startedAt: "2026-07-27T09:00:00.000Z",
    nonce: "stable"
  });
  const savedEntries = [{
    letter: "A",
    ...manualAssessmentEntryOwnership(session)
  }];
  const restored = restoreManualAssessmentAttemptSession({
    assessmentType: "el_letter_assessment",
    studentId: "student-1",
    savedEntries
  });

  assert.equal(restored.attemptId, session.attemptId);
  assert.equal(restored.startedAt, session.startedAt);
  assert.equal(
    restoreManualAssessmentAttemptSession({
      assessmentType: "el_letter_assessment",
      studentId: "student-2",
      savedEntries
    }),
    null
  );
});

test("retry replaces the current item rather than appending duplicate evidence", () => {
  const original = [
    { letter: "A", nameOutcome: "correct" },
    { letter: "B", nameOutcome: "incorrect" }
  ];
  const retried = replaceManualAssessmentEntry(original, 1, {
    letter: "B",
    nameOutcome: "correct"
  });

  assert.equal(retried.length, 2);
  assert.deepEqual(retried.map(row => row.letter), ["A", "B"]);
  assert.equal(retried[1].nameOutcome, "correct");
});

test("unfinished manual assessments are stored per teacher and student", () => {
  const storage = memoryStorage();
  const studentOne = createManualAssessmentAttemptSession({
    assessmentType: "el_letter_assessment",
    studentId: "student-1",
    startedAt: "2026-07-27T09:00:00.000Z",
    nonce: "one"
  });
  const studentTwo = createManualAssessmentAttemptSession({
    assessmentType: "el_letter_assessment",
    studentId: "student-2",
    startedAt: "2026-07-27T09:05:00.000Z",
    nonce: "two"
  });

  assert.equal(saveManualAssessmentDrafts({
    teacherId: "teacher-1",
    studentId: "student-1",
    letterIndex: 8,
    letterAssessment: [{
      letter: "A",
      ...manualAssessmentEntryOwnership(studentOne)
    }],
    storage
  }), true);
  assert.equal(saveManualAssessmentDrafts({
    teacherId: "teacher-1",
    studentId: "student-2",
    letterIndex: 1,
    letterAssessment: [{
      letter: "B",
      ...manualAssessmentEntryOwnership(studentTwo)
    }],
    storage
  }), true);

  const first = loadManualAssessmentDrafts({
    teacherId: "teacher-1",
    studentId: "student-1",
    storage
  });
  const second = loadManualAssessmentDrafts({
    teacherId: "teacher-1",
    studentId: "student-2",
    storage
  });

  assert.notEqual(
    getManualAssessmentDraftStorageKey({ teacherId: "teacher-1", studentId: "student-1" }),
    getManualAssessmentDraftStorageKey({ teacherId: "teacher-1", studentId: "student-2" })
  );
  assert.equal(first.found, true);
  assert.equal(first.letterAssessment[0].letter, "A");
  assert.equal(first.letterIndex, 1, "the resume index cannot run past saved entries");
  assert.equal(second.letterAssessment[0].letter, "B");
  assert.equal(second.letterAssessment[0].assessmentStudentId, "student-2");
});

test("a corrupt or cross-student draft never leaks into another student's assessment", () => {
  const storage = memoryStorage();
  const key = getManualAssessmentDraftStorageKey({
    teacherId: "teacher-1",
    studentId: "student-2"
  });
  storage.setItem(key, JSON.stringify({
    version: 1,
    letterIndex: 1,
    letterAssessment: [{
      letter: "A",
      assessmentStudentId: "student-1"
    }]
  }));

  const restored = loadManualAssessmentDrafts({
    teacherId: "teacher-1",
    studentId: "student-2",
    storage
  });
  assert.equal(restored.found, true);
  assert.deepEqual(restored.letterAssessment, []);
  assert.equal(restored.letterIndex, 0);

  storage.setItem(key, "{not json");
  assert.equal(loadManualAssessmentDrafts({
    teacherId: "teacher-1",
    studentId: "student-2",
    storage
  }).found, false);
});

test("a saved partial archive rebuilds a resumable manual assessment on another device", () => {
  const rebuilt = restoreManualAssessmentDraftsFromHistory({
    studentId: "student-1",
    assessmentHistory: [{
      attemptId: "letter-partial",
      studentId: "student-1",
      assessmentType: "el_letter_assessment",
      administrationStatus: "partial",
      startedAt: "2026-07-27T09:00:00.000Z",
      completedAt: "2026-07-27T09:05:00.000Z",
      questionRecords: [
        {
          targetLetter: "A",
          itemType: "letter_name",
          responseStatus: "correct"
        },
        {
          targetLetter: "A",
          itemType: "letter_sound",
          responseStatus: "incorrect"
        }
      ]
    }, {
      attemptId: "pattern-partial",
      studentId: "student-1",
      assessmentType: "advanced_phonics_patterns",
      administrationStatus: "partial",
      startedAt: "2026-07-27T09:10:00.000Z",
      completedAt: "2026-07-27T09:15:00.000Z",
      questionRecords: [
        {
          targetPattern: "ai",
          targetWord: "rain",
          responseStatus: "correct"
        },
        {
          targetPattern: "ai",
          targetWord: "rain",
          responseStatus: "not_administered"
        }
      ]
    }]
  });

  assert.equal(rebuilt.found, true);
  assert.equal(rebuilt.letterIndex, 1);
  assert.deepEqual(
    rebuilt.letterAssessment[0],
    {
      letter: "A",
      type: "uppercase",
      nameOutcome: "correct",
      soundOutcome: "incorrect",
      knowsName: true,
      knowsSound: false,
      assessmentAttemptId: "letter-partial",
      assessmentStartedAt: "2026-07-27T09:00:00.000Z",
      assessmentStudentId: "student-1"
    }
  );
  assert.equal(rebuilt.patternAssessment[0].pattern, "ai");
  assert.equal(rebuilt.patternAssessment[0].wordOutcome, "not_administered");
});

test("a newer completed manual assessment prevents an older partial record from reopening", () => {
  const base = {
    studentId: "student-1",
    assessmentType: "el_letter_assessment",
    questionRecords: [
      { targetLetter: "A", responseStatus: "correct" },
      { targetLetter: "A", responseStatus: "correct" }
    ]
  };
  const rebuilt = restoreManualAssessmentDraftsFromHistory({
    studentId: "student-1",
    assessmentHistory: [{
      ...base,
      attemptId: "older-partial",
      administrationStatus: "partial",
      completedAt: "2026-07-27T09:05:00.000Z"
    }, {
      ...base,
      attemptId: "newer-completed",
      administrationStatus: "completed",
      completedAt: "2026-07-27T09:10:00.000Z"
    }]
  });

  assert.equal(rebuilt.found, false);
  assert.deepEqual(rebuilt.letterAssessment, []);
  assert.deepEqual(chooseNewestManualAssessmentEntries(
    [{
      letter: "A",
      assessmentStartedAt: "2026-07-27T09:00:00.000Z"
    }],
    rebuilt.letterAssessment,
    {
      archivedStatus: rebuilt.letterLatestStatus,
      archivedAt: rebuilt.letterLatestAt
    }
  ), []);
});

test("administration completion is separate from whether every response was scored", () => {
  assert.equal(manualAssessmentAdministrationStatus(52, 52), "completed");
  assert.equal(manualAssessmentAdministrationStatus(51, 52), "partial");
});

test("rapid duplicate submissions share one operation and release the lock for retry", async () => {
  const saveRef = { current: null };
  let operations = 0;
  let release;
  const blocked = new Promise(resolve => {
    release = resolve;
  });
  const operation = async () => {
    operations += 1;
    await blocked;
    return { durable: true };
  };

  const first = runSingleFlight(saveRef, operation);
  const second = runSingleFlight(saveRef, operation);
  release();

  assert.deepEqual(await first, { durable: true });
  assert.deepEqual(await second, { durable: true });
  assert.equal(operations, 1);
  assert.equal(saveRef.current, null);

  await assert.rejects(
    runSingleFlight(saveRef, async () => {
      throw new Error("save refused");
    }),
    /save refused/
  );
  assert.equal(saveRef.current, null);
  assert.deepEqual(
    await runSingleFlight(saveRef, async () => ({ durable: true })),
    { durable: true }
  );
});
