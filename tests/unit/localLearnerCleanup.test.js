import { readAssessmentDraft, writeAssessmentDraft, learnerAssessmentDraftKeys, ASSESSMENT_DRAFT_OWNERS_KEY } from '../../src/utils/assessmentDraftStorage.js';
import { recordLiteracyExposures, readLiteracyExposures } from "../../src/utils/literacyEvidence.js";
import assert from "node:assert/strict";
import test from "node:test";

import {
  ENGAGEMENT_HEALTH_PREFIX,
  enqueueEngagementEvent,
  readEngagementQueue
} from "../../src/utils/engagementQueue.js";
import {
  clearAndVerifyLocalProgressForStudent,
  inspectLocalProgressForStudent,
  PRACTICE_RESET_RETAINED_AREAS
} from "../../src/utils/progressSync.js";
import {
  enqueueProgressQueueEntry,
  readProgressQueueRecords
} from "../../src/utils/progressQueue.js";
import {
  localProgressStorageKey,
  localStudentPreferenceStorageKey
} from "../../src/utils/progressKeys.js";

function memoryStorage() {
  const values = new Map();
  return {
    get length() {
      return values.size;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
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

test("verified learner cleanup removes progress, retry, engagement, and cloud caches", async t => {
  const storage = memoryStorage();
  const previousWindow = globalThis.window;
  globalThis.window = {
    localStorage: storage,
    clearTimeout,
    dispatchEvent() {},
    addEventListener() {},
    removeEventListener() {}
  };
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  });

  const studentId = "student-delete";
  recordLiteracyExposures(studentId, [{ id: "mock-q" }], storage);
  recordLiteracyExposures("student-keep", [{ id: "other-q" }], storage);
  storage.setItem(
    localProgressStorageKey("phonics_letters", studentId),
    JSON.stringify({ a: "complete" })
  );
  storage.setItem(
    localStudentPreferenceStorageKey("welcome_guide", studentId),
    JSON.stringify({ visitCount: 2 })
  );
  enqueueProgressQueueEntry(storage, {
    studentId,
    area: "phonics_letters",
    key: "letters",
    payload: { a: "complete" }
  });
  enqueueProgressQueueEntry(storage, {
    studentId: "student-keep",
    area: "phonics_letters",
    key: "letters",
    payload: { b: "complete" }
  });
  enqueueEngagementEvent(storage, {
    id: "engagement-delete",
    studentId,
    area: "phonics_letters"
  });
  storage.setItem(`${ENGAGEMENT_HEALTH_PREFIX}${studentId}`, JSON.stringify({
    attempted: 1
  }));
  storage.setItem("lp-cloud-progress-rows-v1", JSON.stringify({
    [studentId]: [{ area: "phonics_letters" }],
    "student-keep": [{ area: "phonics_letters" }]
  }));

  assert.ok(inspectLocalProgressForStudent(studentId, { storage }).residualCount >= 5);
  const result = await clearAndVerifyLocalProgressForStudent(studentId, { storage });

  assert.equal(result.storageAvailable, true);
  assert.equal(result.residualCount, 0);
  assert.deepEqual(readLiteracyExposures(studentId, storage), []);
  recordLiteracyExposures(studentId, [{ id: "late-poll" }], storage);
  assert.deepEqual(readLiteracyExposures(studentId, storage), [], "an in-flight mock poll cannot restore deleted learner data");
  assert.equal(readLiteracyExposures("student-keep", storage).length, 1);
  assert.equal(
    inspectLocalProgressForStudent("student-keep", { storage }).residualCount,
    3,
    "another learner's retry row, exposure record and cloud cache must survive"
  );
  assert.deepEqual(
    JSON.parse(storage.getItem("lp-cloud-progress-rows-v1")),
    { "student-keep": [{ area: "phonics_letters" }] }
  );
});

test("practice reset retains profile, Guided Reading, Story Quest, and unsynced engagement", async t => {
  const storage = memoryStorage();
  const previousWindow = globalThis.window;
  globalThis.window = {
    localStorage: storage,
    clearTimeout,
    dispatchEvent() {},
    addEventListener() {},
    removeEventListener() {}
  };
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  });

  const studentId = "student-reset";
  const profile = {
    reducedChoiceMode: true,
    accessibility: {
      fontScale: "large",
      highContrast: true
    }
  };
  storage.setItem(
    localProgressStorageKey("profile", studentId),
    JSON.stringify(profile)
  );
  storage.setItem(
    localProgressStorageKey("phonics_letters", studentId),
    JSON.stringify({ a: "complete" })
  );
  storage.setItem(
    localProgressStorageKey("guided_reading", studentId),
    JSON.stringify({ "book-1": { completedPages: 4 } })
  );
  storage.setItem(
    localProgressStorageKey("story_quests", studentId),
    JSON.stringify({ "story-1": { completed: true } })
  );
  storage.setItem(
    localStudentPreferenceStorageKey("welcome_guide", studentId),
    JSON.stringify({ visitCount: 3 })
  );
  enqueueProgressQueueEntry(storage, {
    studentId,
    area: "profile",
    key: "student",
    payload: profile
  });
  enqueueProgressQueueEntry(storage, {
    studentId,
    area: "phonics_letters",
    key: "letters",
    payload: { a: "complete" }
  });
  enqueueProgressQueueEntry(storage, {
    studentId,
    area: "guided_reading",
    key: "book-1",
    payload: { completedPages: 4 }
  });
  enqueueProgressQueueEntry(storage, {
    studentId,
    area: "story_quests",
    key: "story-1",
    payload: { completed: true }
  });
  enqueueEngagementEvent(storage, {
    id: "engagement-retained",
    studentId,
    area: "phonics_letters"
  });
  storage.setItem(`${ENGAGEMENT_HEALTH_PREFIX}${studentId}`, JSON.stringify({
    attempted: 1
  }));
  storage.setItem("lp-cloud-progress-rows-v1", JSON.stringify({
    [studentId]: [
      { area: "profile", key: "student", payload: profile },
      { area: "guided_reading", key: "book-1", payload: { completedPages: 4 } },
      { area: "story_quests", key: "story-1", payload: { completed: true } },
      { area: "phonics_letters", key: "letters", payload: { a: "complete" } }
    ]
  }));

  const result = await clearAndVerifyLocalProgressForStudent(studentId, {
    allowFutureWritesAfterCleanup: true,
    preserveEngagement: true,
    preserveProfile: true,
    preserveAreas: PRACTICE_RESET_RETAINED_AREAS,
    storage
  });

  assert.equal(result.residualCount, 0);
  assert.deepEqual(
    JSON.parse(storage.getItem(localProgressStorageKey("profile", studentId))),
    profile,
    "reset must retain teacher-owned accessibility and sign-in support settings"
  );
  assert.equal(
    storage.getItem(localProgressStorageKey("phonics_letters", studentId)),
    null
  );
  assert.deepEqual(
    JSON.parse(storage.getItem(localProgressStorageKey("guided_reading", studentId))),
    { "book-1": { completedPages: 4 } }
  );
  assert.deepEqual(
    JSON.parse(storage.getItem(localProgressStorageKey("story_quests", studentId))),
    { "story-1": { completed: true } }
  );
  assert.deepEqual(
    JSON.parse(storage.getItem(localStudentPreferenceStorageKey("welcome_guide", studentId))),
    { visitCount: 3 },
    "practice reset must retain device navigation and onboarding preferences"
  );
  assert.deepEqual(
    readProgressQueueRecords(storage).map(record => record.entry.area).sort(),
    ["guided_reading", "profile", "story_quests"],
    "unsynced retained-area updates must survive a practice reset"
  );
  assert.equal(readEngagementQueue(storage, studentId).length, 1);
  assert.notEqual(storage.getItem(`${ENGAGEMENT_HEALTH_PREFIX}${studentId}`), null);
  assert.deepEqual(
    JSON.parse(storage.getItem("lp-cloud-progress-rows-v1"))[studentId]
      .map(row => row.area),
    ["profile", "guided_reading", "story_quests"]
  );
  assert.ok(
    inspectLocalProgressForStudent(studentId, { storage }).residualCount > 0,
    "full privacy cleanup must still see the retained profile and engagement"
  );
});

test("privacy cleanup fails closed when browser storage cannot be verified", async t => {
  const storage = {
    get length() { throw new Error("storage blocked"); },
    key() { throw new Error("storage blocked"); },
    getItem() { throw new Error("storage blocked"); },
    setItem() { throw new Error("storage blocked"); },
    removeItem() { throw new Error("storage blocked"); }
  };
  const previousWindow = globalThis.window;
  globalThis.window = {
    localStorage: storage,
    clearTimeout,
    dispatchEvent() {},
    addEventListener() {},
    removeEventListener() {}
  };
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  });

  await assert.rejects(
    clearAndVerifyLocalProgressForStudent("student-delete", { storage }),
    error => error.code === "LP_LOCAL_CLEANUP_INCOMPLETE"
  );
});


test("learner deletion clears owned session drafts and pending retries without touching another learner", async t => {
  const storage = memoryStorage(), drafts = memoryStorage();
  const previousWindow = globalThis.window;
  globalThis.window = { localStorage: storage, sessionStorage: drafts, clearTimeout,
    dispatchEvent() {}, addEventListener() {}, removeEventListener() {} };
  t.after(() => { if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow; });
  const studentId = "draft-owner-delete", other = "draft-owner-keep";
  const keys = ["lp-assessment-draft:sitting:q:choice", "lp-map-draft:sitting:tile", "lp-mock-selection:seed:question"];
  for (const key of keys) assert.equal(writeAssessmentDraft(key, '["answer"]', studentId), true);
  const legacy = "lp-assessment-draft:legacy:item:choice";
  drafts.setItem(legacy, '"old selection"');
  assert.equal(readAssessmentDraft(legacy, studentId), '"old selection"');
  assert.equal(readAssessmentDraft(legacy, other), null);
  const otherKey = "lp-assessment-draft:other-sitting:q:choice";
  writeAssessmentDraft(otherKey, '"keep selection"', other);
  // These old pending request keys can be attributed even before a resume read.
  drafts.setItem(`lp-mock-pending:${studentId}:old-session`, '{"requestId":"pending"}');
  drafts.setItem(`lp-mock-pending:${other}:old-session`, '{"requestId":"keep"}');
  assert.equal(learnerAssessmentDraftKeys(studentId).length, 5);
  assert.ok(inspectLocalProgressForStudent(studentId, { storage }).residuals.some(value => value.startsWith("assessment_draft:")));
  const result = await clearAndVerifyLocalProgressForStudent(studentId, { storage });
  assert.equal(result.residualCount, 0);
  assert.deepEqual(learnerAssessmentDraftKeys(studentId), []);
  for (const key of [...keys, legacy, `lp-mock-pending:${studentId}:old-session`]) assert.equal(drafts.getItem(key), null, key);
  assert.equal(readAssessmentDraft(otherKey, other), '"keep selection"');
  assert.ok(drafts.getItem(`lp-mock-pending:${other}:old-session`));
  assert.equal(writeAssessmentDraft(keys[0], '"late effect"', studentId), false);
  assert.equal(writeAssessmentDraft(`lp-mock-pending:${studentId}:new-session`, '{}', studentId), false);
  assert.equal(drafts.getItem(keys[0]), null);
  assert.equal(JSON.stringify(JSON.parse(drafts.getItem(ASSESSMENT_DRAFT_OWNERS_KEY))).includes(studentId), false);
});

test("practice reset preserves owned unfinished drafts while full cleanup verifies session storage failures", async t => {
  const storage = memoryStorage(), drafts = memoryStorage();
  const previousWindow = globalThis.window;
  globalThis.window = { localStorage: storage, sessionStorage: drafts, clearTimeout,
    dispatchEvent() {}, addEventListener() {}, removeEventListener() {} };
  t.after(() => { if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow; });
  const studentId = "draft-owner-reset", key = "lp-map-draft:reset-sitting:q";
  writeAssessmentDraft(key, '["tile"]', studentId);
  await clearAndVerifyLocalProgressForStudent(studentId, { storage, preserveAreas: PRACTICE_RESET_RETAINED_AREAS, allowFutureWritesAfterCleanup: true });
  assert.equal(readAssessmentDraft(key, studentId), '["tile"]');
  assert.equal(writeAssessmentDraft(key, '["new-tile"]', studentId), true);
  const originalRemove = drafts.removeItem;
  drafts.removeItem = () => { throw new Error("Storage removal blocked"); };
  await assert.rejects(clearAndVerifyLocalProgressForStudent(studentId, { storage }), error => error.code === "LP_LOCAL_CLEANUP_INCOMPLETE");
  drafts.removeItem = originalRemove;
  await clearAndVerifyLocalProgressForStudent(studentId, { storage });
  assert.equal(drafts.getItem(key), null);
});
