import assert from "node:assert/strict";
import test from "node:test";

import {
  ASSESSMENT_ADMINISTRATION_STATUSES,
  ASSESSMENT_RESPONSE_STATUSES,
  compactAssessmentAttemptForStorage,
  deleteAssessmentAttemptsForStudent,
  extractMasteryFromAssessmentAttempt,
  hydrateAssessmentAttempts,
  loadAssessmentAttempts,
  mergeAssessmentAttemptRecords,
  normalizeAssessmentAttempt,
  saveAssessmentAttempt,
  saveAssessmentAttemptLocal,
  summarizeAssessmentHistory
} from "../../src/data/assessmentHistoryStore.js";

function makeStorage() {
  const values = new Map();
  return {
    clear() {
      values.clear();
    },
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, String(value));
    }
  };
}

function baseAttempt(overrides = {}) {
  return {
    attemptId: "attempt-rich-1",
    studentId: "student-1",
    studentName: "Ada",
    classId: "class-1",
    teacherId: "teacher-1",
    assessmentType: "el_encoding",
    skillId: "el_encoding",
    skillName: "EL Encoding",
    skillLevel: 2,
    skillPhase: 1,
    startedAt: "2026-07-21T01:00:00.000Z",
    completedAt: "2026-07-21T01:05:00.000Z",
    updatedAt: "2026-07-21T01:06:00.000Z",
    ...overrides
  };
}

test("legacy binary attempts retain their historical scoring semantics", () => {
  const normalized = normalizeAssessmentAttempt(baseAttempt({
    assessmentType: "skill_checkpoint",
    questionRecords: [
      { questionId: "q1", itemKey: "m", itemType: "initial_sound", isCorrect: true },
      { questionId: "q2", itemKey: "s", itemType: "initial_sound", isCorrect: false }
    ]
  }));

  assert.equal(normalized.schemaVersion, 1);
  assert.equal(normalized.totalQuestions, 2);
  assert.equal(normalized.correctCount, 1);
  assert.equal(normalized.incorrectCount, 1);
  assert.equal(normalized.accuracy, 50);
  assert.deepEqual(
    normalized.questionRecords.map(item => item.responseStatus),
    [ASSESSMENT_RESPONSE_STATUSES.CORRECT, ASSESSMENT_RESPONSE_STATUSES.INCORRECT]
  );
  assert.deepEqual(normalized.questionRecords.map(item => item.isCorrect), [true, false]);
});

test("rich attempts round-trip exact evidence and distinguish every administration state", () => {
  const normalized = normalizeAssessmentAttempt(baseAttempt({
    framework: "el_skills_block",
    formVersion: "2026.1",
    scoringRuleVersion: "pilot-no-norms-1",
    gradePath: ["K", "1"],
    benchmarkWindow: "beginning_of_year",
    routeReason: "letter-sound follow-up",
    startMicrophase: "microphase-2",
    startCycle: "cycle-3",
    cyclesAdministered: [3, 4],
    stopCycle: "cycle-4",
    accommodations: ["repeat directions"],
    candidatePlacement: { cycle: 4, confidence: "review" },
    confirmedPlacement: { cycle: 3, source: "teacher" },
    placementSource: "teacher_override",
    teacherOverrideReason: "classroom evidence",
    subtestScores: { words: { pointsEarned: 2, pointsPossible: 5 } },
    metrics: { wcpm: 37, accuracyRate: 91 },
    observations: [{ code: "slow_automaticity" }],
    metadata: { source: "formal_el_suite" },
    durationMs: 300000,
    questionRecords: [
      {
        questionId: "q-correct",
        subtestId: "words",
        subtestName: "Word encoding",
        prompt: "Write ship.",
        stimulus: { word: "ship" },
        itemKey: "ship",
        itemType: "encoding_feature",
        correctAnswer: "ship",
        selectedAnswer: "ship",
        responseText: "ship",
        responseCode: "exact",
        scoringCode: "full_credit",
        responseStatus: "correct",
        pointsEarned: 2,
        pointsPossible: 2,
        durationMs: 5100,
        latencyMs: 900,
        automaticity: "automatic",
        selfCorrected: false,
        promptLevel: "standard",
        prompted: false,
        independent: true,
        features: { initial: true, medial: true, final: true },
        metadata: { formItem: 1 }
      },
      {
        questionId: "q-incorrect",
        itemKey: "chop",
        itemType: "encoding_feature",
        responseText: "shop",
        responseStatus: "incorrect",
        pointsEarned: 0,
        pointsPossible: 2,
        errorType: "grapheme_substitution",
        errors: [{ expected: "ch", actual: "sh" }],
        notes: "Confused two digraphs"
      },
      {
        questionId: "q-skipped",
        itemKey: "scrap",
        itemType: "encoding_feature",
        responseStatus: "skipped",
        pointsEarned: 0,
        pointsPossible: 1
      },
      {
        questionId: "q-not-administered",
        itemKey: "sprint",
        itemType: "encoding_feature",
        responseStatus: "not-administered"
      },
      {
        questionId: "q-discontinued",
        itemKey: "thrush",
        itemType: "encoding_feature",
        responseStatus: "discontinued"
      },
      {
        questionId: "q-not-scorable",
        itemKey: "stamp",
        itemType: "encoding_feature",
        responseStatus: "not_scorable",
        notScorableReason: "audio interruption"
      }
    ]
  }));

  assert.equal(normalized.schemaVersion, 2);
  assert.equal(normalized.totalQuestions, 3);
  assert.equal(normalized.plannedQuestionCount, 6);
  assert.equal(normalized.correctCount, 1);
  assert.equal(normalized.incorrectCount, 2);
  assert.equal(normalized.skippedCount, 1);
  assert.equal(normalized.notAdministeredCount, 1);
  assert.equal(normalized.discontinuedItemCount, 1);
  assert.equal(normalized.notScorableCount, 1);
  assert.equal(normalized.pointsEarned, 2);
  assert.equal(normalized.pointsPossible, 5);
  assert.equal(normalized.accuracy, 40);
  assert.equal(normalized.administrationStatus, ASSESSMENT_ADMINISTRATION_STATUSES.DISCONTINUED);
  assert.equal(normalized.discontinued, true);
  assert.equal(normalized.questionRecords[0].responseText, "ship");
  assert.equal(normalized.questionRecords[0].durationMs, 5100);
  assert.deepEqual(normalized.questionRecords[1].errors, [{ expected: "ch", actual: "sh" }]);
  assert.deepEqual(
    normalized.questionRecords.map(item => item.isCorrect),
    [true, false, false, null, null, null]
  );
  assert.deepEqual(normalizeAssessmentAttempt(normalized), normalized);
});

test("quick-score provenance survives normalization and compact storage without inventing a transcription", () => {
  const outcomeRecordedAt = "2026-07-22T03:04:05.000Z";
  const normalized = normalizeAssessmentAttempt(baseAttempt({
    administrationVersion: "2026.07.22-quick-v1",
    responseSchemaVersion: 2,
    questionRecords: [{
      questionId: "encoding-quick-1",
      itemKey: "ship",
      itemType: "encoding_feature",
      targetWord: "ship",
      responseStatus: "correct",
      isCorrect: true,
      exact: true,
      plausible: true,
      responseText: "",
      transcription: "",
      responseCaptureMode: "quick_teacher_judgment",
      responseDetailCaptured: false,
      outcomeRecordedAt
    }]
  }));
  const question = normalized.questionRecords[0];

  assert.equal(normalized.administrationVersion, "2026.07.22-quick-v1");
  assert.equal(normalized.responseSchemaVersion, 2);
  assert.equal(question.responseCaptureMode, "quick_teacher_judgment");
  assert.equal(question.responseDetailCaptured, false);
  assert.equal(question.outcomeRecordedAt, outcomeRecordedAt);
  assert.equal(question.responseText, "");
  assert.equal(question.transcription, "");
  assert.equal(question.metadata.responseCaptureMode, "quick_teacher_judgment");
  assert.equal(question.metadata.responseDetailCaptured, false);
  assert.equal(question.metadata.outcomeRecordedAt, outcomeRecordedAt);

  const compact = compactAssessmentAttemptForStorage(normalized);
  const rehydrated = normalizeAssessmentAttempt(JSON.parse(JSON.stringify(compact)));
  assert.equal(rehydrated.administrationVersion, "2026.07.22-quick-v1");
  assert.equal(rehydrated.responseSchemaVersion, 2);
  assert.equal(rehydrated.questionRecords[0].responseCaptureMode, "quick_teacher_judgment");
  assert.equal(rehydrated.questionRecords[0].responseDetailCaptured, false);
  assert.equal(rehydrated.questionRecords[0].outcomeRecordedAt, outcomeRecordedAt);
  assert.equal(rehydrated.questionRecords[0].responseText, "");
  assert.equal(rehydrated.questionRecords[0].transcription, "");

  const legacyBlank = normalizeAssessmentAttempt(baseAttempt({
    attemptId: "legacy-blank-response",
    questionRecords: [{
      questionId: "encoding-legacy-blank",
      responseStatus: "correct",
      responseText: ""
    }]
  })).questionRecords[0];
  assert.equal(legacyBlank.responseCaptureMode, "legacy_unspecified");
  assert.equal(legacyBlank.responseDetailCaptured, false);
  assert.equal(legacyBlank.responseText, "");
});

test("interrupted ORF timing audit survives normalization and rehydration", () => {
  const normalized = normalizeAssessmentAttempt(baseAttempt({
    assessmentType: "el_oral_reading_fluency",
    skillId: "el_oral_reading_fluency",
    skillName: "EL Oral Reading Fluency",
    administrationStatus: "partial",
    scoreStatus: "partial",
    questionRecords: [{
      questionId: "orf-interrupted-1",
      passageId: "passage-early-full",
      passageTitle: "A Rainy Walk",
      responseStatus: "recorded",
      wordsAttempted: 20,
      errors: 2,
      selfCorrections: 0,
      elapsedSeconds: 60,
      timerStatus: "interrupted",
      timerInterrupted: true,
      interruptionReason: "timer_session_restored_while_running",
      zeroWordsReached: false,
      passageAccurate: true,
      accuracyJudgmentSource: "teacher",
      accuracyJudgedAt: "2026-07-21T01:04:00.000Z",
      routeJudgmentUsable: false,
      routeDecision: null,
      informationalNotes: ["interrupted_timing_not_scorable"],
      validationIssues: ["continuous_timing_interrupted"]
    }]
  }));

  const question = normalized.questionRecords[0];
  assert.equal(question.timerInterrupted, true);
  assert.equal(question.interruptionReason, "timer_session_restored_while_running");
  assert.equal(question.zeroWordsReached, false);
  assert.equal(question.accuracyJudgmentSource, "teacher");
  assert.equal(question.accuracyJudgedAt, "2026-07-21T01:04:00.000Z");
  assert.equal(question.routeJudgmentUsable, false);
  assert.deepEqual(question.informationalNotes, ["interrupted_timing_not_scorable"]);
  assert.equal(question.metadata.timerInterrupted, true);
  assert.equal(question.metadata.interruptionReason, "timer_session_restored_while_running");
  assert.deepEqual(normalizeAssessmentAttempt(normalized), normalized);
  assert.deepEqual(normalizeAssessmentAttempt(JSON.parse(JSON.stringify(normalized))), normalized);
});

test("mastery ignores unadministered states but keeps a skipped item as an observed miss", () => {
  const mastery = extractMasteryFromAssessmentAttempt(baseAttempt({
    skillId: "el_decoding",
    skillName: "EL Decoding",
    questionRecords: [
      { questionId: "q1", itemKey: "short_a", itemType: "decoding_pattern", responseStatus: "correct" },
      { questionId: "q2", itemKey: "short_a", itemType: "decoding_pattern", responseStatus: "correct" },
      { questionId: "q3", itemKey: "short_a", itemType: "decoding_pattern", responseStatus: "not_administered" },
      { questionId: "q4", itemKey: "short_a", itemType: "decoding_pattern", responseStatus: "discontinued" },
      { questionId: "q5", itemKey: "short_i", itemType: "decoding_pattern", responseStatus: "skipped" }
    ]
  }));

  const shortA = mastery.rows.find(row => row.itemKey === "short_a");
  const shortI = mastery.rows.find(row => row.itemKey === "short_i");
  assert.deepEqual({ attempts: shortA.attempts, correct: shortA.correct, accuracy: shortA.accuracy }, {
    attempts: 2,
    correct: 2,
    accuracy: 100
  });
  assert.deepEqual({ attempts: shortI.attempts, correct: shortI.correct, accuracy: shortI.accuracy }, {
    attempts: 1,
    correct: 0,
    accuracy: 0
  });
});

test("an attempt marked not administered never turns planned items into failures", () => {
  const normalized = normalizeAssessmentAttempt(baseAttempt({
    administrationStatus: "not_administered",
    totalQuestions: 12,
    correctCount: 0,
    pointsPossible: 12,
    pointsEarned: 0,
    questionRecords: [{ questionId: "planned-1", itemKey: "blend", itemType: "phonological_awareness" }]
  }));

  assert.equal(normalized.administrationStatus, ASSESSMENT_ADMINISTRATION_STATUSES.NOT_ADMINISTERED);
  assert.equal(normalized.status, "not_administered");
  assert.equal(normalized.plannedQuestionCount, 12);
  assert.equal(normalized.totalQuestions, 0);
  assert.equal(normalized.scoredCount, 0);
  assert.equal(normalized.incorrectCount, 0);
  assert.equal(normalized.pointsPossible, 0);
  assert.equal(normalized.questionRecords[0].responseStatus, ASSESSMENT_RESPONSE_STATUSES.NOT_ADMINISTERED);
  assert.equal(normalized.passed, false);
  assert.equal(extractMasteryFromAssessmentAttempt(normalized).rows.length, 0);
});

test("item administration states are preserved even without responseStatus", () => {
  const normalized = normalizeAssessmentAttempt(baseAttempt({
    administrationStatus: "partial",
    questionRecords: [
      { questionId: "not-presented", administrationStatus: "not_administered" },
      { questionId: "stopped", administrationStatus: "discontinued" },
      { questionId: "invalid", administrationStatus: "not_scorable" }
    ]
  }));

  assert.deepEqual(
    normalized.questionRecords.map(item => item.responseStatus),
    ["not_administered", "discontinued", "not_scorable"]
  );
  assert.equal(normalized.totalQuestions, 0);
  assert.equal(normalized.incorrectCount, 0);
});

test("descriptive EL benchmarks never create generic mastery or support labels", () => {
  const benchmark = baseAttempt({
    assessmentType: "el_encoding",
    skillId: "el_encoding",
    skillName: "Encoding",
    totalQuestions: 8,
    correctCount: 0,
    passed: false,
    questionRecords: Array.from({ length: 8 }, (_, index) => ({
      questionId: `encoding-${index + 1}`,
      responseStatus: "incorrect"
    }))
  });
  const summary = summarizeAssessmentHistory([benchmark]);

  assert.equal(summary.attempts, 1);
  assert.equal(summary.descriptiveBenchmarkAttempts, 1);
  assert.equal(summary.totalQuestions, 0);
  assert.equal(summary.studentsNeedingSupport.length, 0);
  assert.equal(summary.studentsReadyToLevelUp.length, 0);
  assert.equal(summary.strongestSkills.length, 0);
  assert.equal(summary.weakestSkills.length, 0);
  assert.equal(summary.skills[0].status, "evidence recorded");
  assert.deepEqual(summary.students[0].supportSkills, []);
});

test("globally unscored descriptive attempts preserve null accuracy and zero performance totals", () => {
  for (const administrationStatus of ["not_scorable", "not_administered"]) {
    const normalized = normalizeAssessmentAttempt(baseAttempt({
      accuracy: null,
      administrationStatus,
      assessmentType: "el_encoding",
      correctCount: 0,
      scoreStatus: administrationStatus,
      totalQuestions: 0,
      questionRecords: [{
        questionId: `raw-observation-${administrationStatus}`,
        responseStatus: "correct",
        responseText: "raw retained observation",
        isCorrect: true
      }]
    }));

    assert.equal(normalized.accuracy, null, administrationStatus);
    assert.equal(normalized.totalQuestions, 0, administrationStatus);
    assert.equal(normalized.correctCount, 0, administrationStatus);
    assert.equal(normalized.incorrectCount, 0, administrationStatus);
    assert.equal(normalized.administeredCount, 0, administrationStatus);
    assert.equal(normalized.scoredCount, 0, administrationStatus);
    assert.equal(normalized.questionRecords.length, 1, administrationStatus);
  }
});

test("Kindergarten benchmark level zero survives normalization", () => {
  const normalized = normalizeAssessmentAttempt(baseAttempt({
    assessmentType: "el_phonological_awareness",
    gradePath: "K",
    skillLevel: 0,
    questionRecords: [{ questionId: "k-pa-1", level: 0, responseStatus: "correct", isCorrect: true }]
  }));
  assert.equal(normalized.skillLevel, 0);
  assert.equal(normalized.questionRecords[0].level, 0);
});

test("local persistence retains rich assessment evidence", () => {
  globalThis.localStorage = makeStorage();
  const rich = baseAttempt({
    metrics: { wcpm: 42 },
    questionRecords: [{
      questionId: "q1",
      itemKey: "passage-1",
      itemType: "fluency_passage",
      responseStatus: "incorrect",
      responseText: "exact teacher transcription",
      errorType: ["substitution", "omission"],
      durationMs: 60000
    }]
  });

  saveAssessmentAttemptLocal(rich, { teacherId: "teacher-1" });
  const loaded = loadAssessmentAttempts({ teacherId: "teacher-1", studentId: "student-1" });
  assert.equal(loaded.length, 1);
  assert.deepEqual(loaded[0].metrics, { wcpm: 42 });
  assert.equal(loaded[0].questionRecords[0].responseText, "exact teacher transcription");
  assert.deepEqual(loaded[0].questionRecords[0].errorType, ["substitution", "omission"]);
  assert.equal(loaded[0].questionRecords[0].durationMs, 60000);
});

test("student attempt deletion uses stable IDs and only falls back to names for legacy ID-less evidence", () => {
  globalThis.localStorage = makeStorage();
  saveAssessmentAttemptLocal(baseAttempt({
    attemptId: "target-ada",
    studentId: "student-target",
    studentName: "Ada"
  }), { teacherId: "teacher-1" });
  saveAssessmentAttemptLocal(baseAttempt({
    attemptId: "different-ada",
    studentId: "student-other",
    studentName: "Ada"
  }), { teacherId: "teacher-1" });
  saveAssessmentAttemptLocal(baseAttempt({
    attemptId: "legacy-ada",
    studentId: "",
    studentName: "Ada"
  }), { teacherId: "teacher-1" });

  const remaining = deleteAssessmentAttemptsForStudent({
    teacherId: "teacher-1",
    studentId: "student-target",
    studentName: "Ada"
  });
  assert.deepEqual(remaining.map(record => record.attemptId), ["different-ada"]);
  assert.equal(remaining[0].studentId, "student-other");
});

test("local persistence retains more than one class benchmark cycle", () => {
  globalThis.localStorage = makeStorage();
  for (let index = 0; index < 75; index += 1) {
    saveAssessmentAttemptLocal(baseAttempt({
      attemptId: `benchmark-cache-${index + 1}`,
      studentId: `student-${(index % 25) + 1}`,
      completedAt: new Date(Date.UTC(2026, 6, 21, 0, index)).toISOString(),
      updatedAt: new Date(Date.UTC(2026, 6, 21, 0, index)).toISOString(),
      questionRecords: [{
        questionId: `encoding-${index + 1}`,
        responseStatus: "correct",
        responseText: "ship",
        exact: true,
        plausible: true
      }]
    }), { teacherId: "teacher-1" });
  }

  const loaded = loadAssessmentAttempts({ teacherId: "teacher-1" });
  assert.equal(loaded.length, 75);
  assert.ok(loaded.some(record => record.attemptId === "benchmark-cache-1"));
  assert.ok(loaded.some(record => record.attemptId === "benchmark-cache-75"));
});

test("cloud hydration merges, de-duplicates, and preserves unrelated local history", async () => {
  globalThis.localStorage = makeStorage();
  saveAssessmentAttemptLocal(baseAttempt({
    attemptId: "shared-local-newer",
    updatedAt: "2026-07-21T03:00:00.000Z",
    metrics: { source: "newer-local", wcpm: 44 },
    questionRecords: [{ questionId: "q1", responseStatus: "correct" }]
  }), { teacherId: "teacher-1" });
  saveAssessmentAttemptLocal(baseAttempt({
    attemptId: "shared-cloud-newer",
    updatedAt: "2026-07-21T01:00:00.000Z",
    metrics: { source: "older-local" },
    questionRecords: [{ questionId: "q2", responseStatus: "incorrect" }]
  }), { teacherId: "teacher-1" });
  saveAssessmentAttemptLocal(baseAttempt({
    attemptId: "unrelated-local",
    studentId: "student-2",
    updatedAt: "2026-07-21T02:00:00.000Z",
    questionRecords: [{ questionId: "q3", responseStatus: "correct" }]
  }), { teacherId: "teacher-1" });

  const cloudRows = [
    {
      attempt_id: "shared-local-newer",
      student_id: "student-1",
      class_id: "class-1",
      teacher_id: "teacher-1",
      completed_at: "2026-07-21T01:05:00.000Z",
      updated_at: "2026-07-21T02:00:00.000Z",
      payload: baseAttempt({
        attemptId: "shared-local-newer",
        updatedAt: "2026-07-21T02:00:00.000Z",
        metrics: { source: "older-cloud" },
        questionRecords: [{ questionId: "q1", responseStatus: "incorrect" }]
      })
    },
    {
      attempt_id: "shared-cloud-newer",
      student_id: "student-1",
      class_id: "class-1",
      teacher_id: "teacher-1",
      completed_at: "2026-07-21T01:05:00.000Z",
      updated_at: "2026-07-21T04:00:00.000Z",
      payload: baseAttempt({
        attemptId: "shared-cloud-newer",
        updatedAt: "2026-07-21T04:00:00.000Z",
        metrics: { source: "newer-cloud" },
        questionRecords: [{ questionId: "q2", responseStatus: "correct" }]
      })
    },
    {
      attempt_id: "cloud-only",
      student_id: "student-1",
      class_id: "class-1",
      teacher_id: "teacher-1",
      assessment_type: "el_phonological_awareness",
      skill_id: "el_phonological_awareness",
      skill_name: "EL Phonological & Phonemic Awareness",
      completed_at: "2026-07-21T05:00:00.000Z",
      updated_at: "2026-07-21T05:01:00.000Z",
      payload: {
        studentName: "Ada",
        questionRecords: [{ questionId: "q4", itemKey: "blend", responseStatus: "correct" }],
        metrics: { source: "cloud-only" }
      }
    }
  ];
  const filters = [];
  const query = {
    eq(column, value) {
      filters.push([column, value]);
      return this;
    },
    order() {
      const data = cloudRows.filter(row => filters.every(([column, value]) => row[column] === value));
      return Promise.resolve({ data, error: null });
    },
    select() {
      return this;
    }
  };
  const supabase = {
    from(table) {
      assert.equal(table, "assessment_attempts");
      return query;
    }
  };

  const hydrated = await hydrateAssessmentAttempts({
    teacherId: "teacher-1",
    studentId: "student-1",
    supabase
  });
  assert.equal(hydrated.length, 3);
  assert.equal(hydrated.find(row => row.attemptId === "shared-local-newer").metrics.source, "newer-local");
  assert.equal(hydrated.find(row => row.attemptId === "shared-cloud-newer").metrics.source, "newer-cloud");
  assert.equal(hydrated.find(row => row.attemptId === "cloud-only").metrics.source, "cloud-only");
  assert.deepEqual(filters, [["teacher_id", "teacher-1"], ["student_id", "student-1"]]);

  const allLocal = loadAssessmentAttempts({ teacherId: "teacher-1" });
  assert.equal(allLocal.length, 4);
  assert.ok(allLocal.some(row => row.attemptId === "unrelated-local"));
  assert.equal(mergeAssessmentAttemptRecords(allLocal, hydrated).length, 4);
});

test("cloud saves include the searchable columns and full versioned payload", async () => {
  globalThis.localStorage = makeStorage();
  let upserted = null;
  let upsertOptions = null;
  const supabase = {
    from(table) {
      assert.equal(table, "assessment_attempts");
      return {
        upsert(payload, options) {
          upserted = payload;
          upsertOptions = options;
          return Promise.resolve({ error: null });
        }
      };
    }
  };

  const saveResult = await saveAssessmentAttempt(baseAttempt({
    administrationStatus: "partial",
    metrics: { wcpm: 39 },
    questionRecords: [{ questionId: "q1", responseStatus: "correct" }]
  }), { teacherId: "teacher-1", supabase });

  assert.equal(upsertOptions.onConflict, "attempt_id");
  assert.equal(upserted.assessment_type, "el_encoding");
  assert.equal(upserted.administration_status, "partial");
  assert.equal(upserted.schema_version, 2);
  assert.equal(upserted.payload.metrics.wcpm, 39);
  assert.equal(upserted.payload.questionRecords[0].responseStatus, "correct");
  assert.ok(upserted.updated_at);
  assert.equal(saveResult.localSaved, true);
  assert.equal(saveResult.cloudSaved, true);
  assert.equal(saveResult.durable, true);
});

test("cloud hydration paginates beyond 5,000 attempts without a hidden ceiling", async () => {
  globalThis.localStorage = makeStorage();
  const cloudRows = Array.from({ length: 5205 }, (_, index) => ({
    attempt_id: `cloud-page-${index}`,
    student_id: "student-many",
    teacher_id: "teacher-many",
    assessment_type: "el_decoding",
    skill_id: "el_decoding",
    skill_name: "EL Decoding",
    completed_at: new Date(Date.UTC(2026, 6, 21, 0, 0, index)).toISOString(),
    updated_at: new Date(Date.UTC(2026, 6, 21, 0, 0, index)).toISOString(),
    payload: { studentName: "Many", administrationStatus: "completed" }
  }));
  const requestedRanges = [];
  const supabase = {
    from(table) {
      assert.equal(table, "assessment_attempts");
      const filters = [];
      const builder = {
        select() { return this; },
        eq(column, value) { filters.push([column, value]); return this; },
        order() { return this; },
        range(from, to) {
          requestedRanges.push([from, to]);
          const filtered = cloudRows.filter(row => filters.every(([column, value]) => row[column] === value));
          return Promise.resolve({ data: filtered.slice(from, to + 1), error: null });
        }
      };
      return builder;
    }
  };

  const hydrated = await hydrateAssessmentAttempts({
    teacherId: "teacher-many",
    studentId: "student-many",
    supabase
  });

  assert.equal(hydrated.length, 5205);
  assert.equal(requestedRanges.length, 11);
  assert.deepEqual(requestedRanges[0], [0, 499]);
  assert.deepEqual(requestedRanges.at(-1), [5000, 5499]);

  const boundedSave = await saveAssessmentAttempt(baseAttempt({
    attemptId: "after-large-hydration",
    studentId: "student-many",
    teacherId: "teacher-many",
    completedAt: "2026-07-22T00:00:00.000Z",
    updatedAt: "2026-07-22T00:00:00.000Z"
  }), { teacherId: "teacher-many" });
  assert.equal(boundedSave.durable, true);
  assert.ok(boundedSave.records.length <= 400);
  const liveHistory = mergeAssessmentAttemptRecords(hydrated, boundedSave.records);
  assert.equal(liveHistory.length, 5206);
  assert.ok(liveHistory.some(row => row.attemptId === "after-large-hydration"));
});

test("attempt hydration stops when a range adapter repeats a non-advancing full page", async () => {
  globalThis.localStorage = makeStorage();
  const repeatedPage = Array.from({ length: 500 }, (_, index) => ({
    attempt_id: `repeated-${index}`,
    student_id: "student-repeat",
    teacher_id: "teacher-repeat",
    assessment_type: "el_decoding",
    skill_id: "el_decoding",
    skill_name: "EL Decoding",
    completed_at: new Date(Date.UTC(2026, 6, 21, 0, 0, index)).toISOString(),
    payload: { studentName: "Repeat", administrationStatus: "completed" }
  }));
  const requestedRanges = [];
  const supabase = {
    from() {
      const builder = {
        select() { return this; },
        eq() { return this; },
        order() { return this; },
        range(from, to) {
          requestedRanges.push([from, to]);
          return Promise.resolve({ data: repeatedPage, error: null });
        }
      };
      return builder;
    }
  };

  const hydrated = await hydrateAssessmentAttempts({ teacherId: "teacher-repeat", supabase });
  assert.equal(hydrated.length, 500);
  assert.deepEqual(requestedRanges, [[0, 499], [500, 999]]);
});

test("attempt saves explicitly report when neither local nor cloud persistence succeeds", async () => {
  globalThis.localStorage = {
    getItem() { return null; },
    setItem() { throw new Error("quota"); }
  };
  const rejected = await saveAssessmentAttempt(baseAttempt({ attemptId: "save-both-fail" }), {
    teacherId: "teacher-1",
    supabase: {
      from() {
        return { upsert: async () => ({ error: new Error("RLS rejected") }) };
      }
    }
  });
  assert.equal(rejected.localSaved, false);
  assert.equal(rejected.cloudSaved, false);
  assert.equal(rejected.durable, false);

  const cloudOnly = await saveAssessmentAttempt(baseAttempt({ attemptId: "save-cloud-only" }), {
    teacherId: "teacher-1",
    supabase: {
      from() {
        return { upsert: async () => ({ error: null }) };
      }
    }
  });
  assert.equal(cloudOnly.localSaved, false);
  assert.equal(cloudOnly.cloudSaved, true);
  assert.equal(cloudOnly.durable, true);
});
