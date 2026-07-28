import assert from "node:assert/strict";
import test from "node:test";

import {
  REPORTING_EVIDENCE_KINDS,
  REPORTING_STATUS_IDS,
  createReportingConcept,
  createReportingEvidence,
  resolveWholeChildConcepts
} from "../../src/data/reportingEvidenceModel.js";
import {
  getReportingConceptForAssessmentQuestion
} from "../../src/data/studentReportingWorkspaceModel.js";
import {
  buildClassReportModel,
  buildStudentReportModel,
  normalizeItemMasteryRows
} from "../../src/data/reportingSystem.js";
import { getHfwRuntimeEligibilityIssues } from "../../src/data/hfwRuntimeEligibility.js";
import { enrichQuestionWithExistingMedia } from "../../src/data/questionMediaResolver.js";
import { grammarAssessmentQuestions } from "../../src/data/generated/grammarAssessmentQuestions.generated.js";

const NOW = new Date("2026-07-27T12:00:00.000Z");

function concept(key = "sh") {
  return createReportingConcept({
    domain: "phonics",
    construct: "grapheme_sound",
    key,
    label: `Sound for ${key}`
  });
}

function directEvidence({
  id,
  conceptValue = concept(),
  sourceArea = "skills_check",
  statusCandidate = REPORTING_STATUS_IDS.SECURE,
  observedAt = "2026-07-20T10:00:00.000Z",
  observations = 1,
  independentAttempts = 1,
  correct = statusCandidate === REPORTING_STATUS_IDS.SECURE ? observations : 0,
  accuracy = statusCandidate === REPORTING_STATUS_IDS.SECURE ? 100 : 0
}) {
  return createReportingEvidence({
    evidenceId: id,
    studentId: "student-1",
    sourceArea,
    sourceLabel: sourceArea,
    sourceRecordId: id,
    sourceRecordType: "direct_check",
    evidenceKind: REPORTING_EVIDENCE_KINDS.FORMAL,
    concept: conceptValue,
    statusCandidate,
    observedAt,
    details: { observations, independentAttempts, correct, accuracy }
  });
}

test("one correct answer and repeated questions in one sitting remain provisional", () => {
  const oneAnswer = resolveWholeChildConcepts({
    evidence: [directEvidence({ id: "one" })],
    now: NOW
  })[0];
  assert.equal(oneAnswer.status.id, REPORTING_STATUS_IDS.NOT_ENOUGH_EVIDENCE);
  assert.equal(oneAnswer.evidenceBasis.observations, 1);
  assert.equal(oneAnswer.evidenceBasis.independentAttempts, 1);
  assert.equal(oneAnswer.evidenceBasis.correct, 1);
  assert.equal(oneAnswer.evidenceBasis.accuracy, 100);

  const oneSitting = resolveWholeChildConcepts({
    evidence: [directEvidence({
      id: "one-sitting",
      observations: 5,
      independentAttempts: 1,
      correct: 5,
      accuracy: 100
    })],
    now: NOW
  })[0];
  assert.equal(oneSitting.status.id, REPORTING_STATUS_IDS.NOT_ENOUGH_EVIDENCE);
  assert.equal(oneSitting.evidenceBasis.observations, 5);
  assert.equal(oneSitting.evidenceBasis.independentAttempts, 1);
});

test("three current independent attempts can support an exact-item conclusion", () => {
  const resolved = resolveWholeChildConcepts({
    evidence: ["one", "two", "three"].map(id => directEvidence({ id })),
    now: NOW
  })[0];
  assert.equal(resolved.status.id, REPORTING_STATUS_IDS.SECURE);
  assert.equal(resolved.policyReady, true);
  assert.deepEqual(
    {
      observations: resolved.evidenceBasis.observations,
      independentAttempts: resolved.evidenceBasis.independentAttempts,
      correct: resolved.evidenceBasis.correct,
      accuracy: resolved.evidenceBasis.accuracy
    },
    { observations: 3, independentAttempts: 3, correct: 3, accuracy: 100 }
  );
});

test("qualitative labels never fabricate exact counts or accuracy", () => {
  const qualitative = createReportingEvidence({
    evidenceId: "qualitative-only",
    studentId: "student-1",
    sourceArea: "teacher_observation",
    sourceLabel: "Teacher observation",
    sourceRecordId: "observation-1",
    sourceRecordType: "teacher_observation",
    evidenceKind: REPORTING_EVIDENCE_KINDS.TEACHER_OBSERVATION,
    concept: concept(),
    statusCandidate: REPORTING_STATUS_IDS.SECURE,
    observedAt: "2026-07-20T10:00:00.000Z",
    details: {
      observations: 3,
      independentAttempts: 3
    }
  });
  const resolved = resolveWholeChildConcepts({
    evidence: [qualitative],
    now: NOW
  })[0];

  assert.equal(resolved.status.id, REPORTING_STATUS_IDS.NOT_ENOUGH_EVIDENCE);
  assert.equal(resolved.evidenceBasis.observations, 3);
  assert.equal(resolved.evidenceBasis.correct, null);
  assert.equal(resolved.evidenceBasis.accuracy, null);
});

test("current status and displayed counts use the same evidence window", () => {
  const current = ["one", "two", "three"].map(id => directEvidence({ id }));
  const stale = directEvidence({
    id: "stale-wrong",
    statusCandidate: REPORTING_STATUS_IDS.NEEDS_TEACHING,
    observedAt: "2025-01-01T10:00:00.000Z"
  });
  const resolved = resolveWholeChildConcepts({
    evidence: [...current, stale],
    now: NOW
  })[0];

  assert.equal(resolved.status.id, REPORTING_STATUS_IDS.SECURE);
  assert.equal(resolved.evidenceBasis.observations, 3);
  assert.equal(resolved.evidenceBasis.correct, 3);
  assert.equal(resolved.lifetimeEvidenceBasis.observations, 4);
  assert.equal(resolved.lifetimeEvidenceBasis.correct, 3);
});

test("current practice is not hidden by a stale formal check", () => {
  const staleFormal = directEvidence({
    id: "stale-formal",
    statusCandidate: REPORTING_STATUS_IDS.NEEDS_TEACHING,
    observedAt: "2025-01-01T10:00:00.000Z",
    observations: 3,
    independentAttempts: 3,
    correct: 0,
    accuracy: 0
  });
  const currentPractice = createReportingEvidence({
    evidenceId: "current-practice",
    studentId: "student-1",
    sourceArea: "practice",
    sourceLabel: "Practice",
    sourceRecordId: "practice-1",
    sourceRecordType: "practice",
    evidenceKind: REPORTING_EVIDENCE_KINDS.PRACTICE,
    concept: concept(),
    statusCandidate: REPORTING_STATUS_IDS.SECURE,
    observedAt: "2026-07-20T10:00:00.000Z",
    details: {
      observations: 3,
      independentAttempts: 3,
      correct: 3,
      accuracy: 100
    }
  });
  const resolved = resolveWholeChildConcepts({
    evidence: [staleFormal, currentPractice],
    now: NOW
  })[0];

  assert.equal(resolved.status.id, REPORTING_STATUS_IDS.DEVELOPING);
  assert.equal(resolved.practiceOnlyDecision, true);
  assert.equal(resolved.evidenceBasis.observations, 3);
  assert.equal(resolved.currentEvidenceBasis.observations, 3);
  assert.equal(resolved.lifetimeEvidenceBasis.observations, 6);
});

test("thin disagreement is provisional; Mixed requires policy-ready direct sources", () => {
  const sparse = resolveWholeChildConcepts({
    evidence: [
      directEvidence({ id: "sparse-secure", sourceArea: "formal" }),
      directEvidence({
        id: "sparse-needs",
        sourceArea: "teacher",
        statusCandidate: REPORTING_STATUS_IDS.NEEDS_TEACHING
      })
    ],
    now: NOW
  })[0];
  assert.equal(sparse.status.id, REPORTING_STATUS_IDS.NOT_ENOUGH_EVIDENCE);

  const enough = resolveWholeChildConcepts({
    evidence: [
      directEvidence({
        id: "formal-secure",
        sourceArea: "formal",
        observations: 3,
        independentAttempts: 3,
        correct: 3,
        accuracy: 100
      }),
      directEvidence({
        id: "teacher-needs",
        sourceArea: "teacher",
        statusCandidate: REPORTING_STATUS_IDS.NEEDS_TEACHING,
        observations: 3,
        independentAttempts: 3,
        correct: 0,
        accuracy: 0
      })
    ],
    now: NOW
  })[0];
  assert.equal(enough.status.id, REPORTING_STATUS_IDS.MIXED_EVIDENCE);
});

test("HFW sentence choice, spelling and isolated reading have different constructs", () => {
  const attempt = {
    assessmentType: "skill_checkpoint",
    skillId: "hfw_1_25"
  };
  const cloze = getReportingConceptForAssessmentQuestion({
    skillId: "hfw_1_25",
    itemType: "sight_word",
    targetWord: "the",
    formatType: "HFW_SENTENCE_CLOZE_L1P1_01"
  }, attempt);
  const spelling = getReportingConceptForAssessmentQuestion({
    skillId: "hfw_1_25",
    itemType: "sight_word",
    targetWord: "the",
    formatType: "HFW_SENTENCE_SPELL_L2P1_01"
  }, attempt);
  const isolated = getReportingConceptForAssessmentQuestion({
    skillId: "hfw_1_25",
    itemType: "sight_word",
    targetWord: "the",
    formatType: "legacy_direct"
  }, attempt);

  assert.equal(cloze.construct, "word_in_context");
  assert.equal(spelling.construct, "word_spelling");
  assert.equal(isolated.construct, "isolated_word_reading");
  assert.equal(new Set([cloze.conceptId, spelling.conceptId, isolated.conceptId]).size, 3);
});

function checkpointAttempt({
  attemptId,
  studentId,
  skillName = "Initial Sounds",
  correctCount = 8,
  completedAt = "2026-07-20T10:00:00.000Z",
  formatType = "INITIAL_SOUND"
}) {
  return {
    attemptId,
    studentId,
    classId: "class-1",
    assessmentType: "skill_checkpoint",
    skillId: skillName.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    skillName,
    administrationStatus: "completed",
    completedAt,
    totalQuestions: 8,
    correctCount,
    formVersion: "form-a",
    contentVersion: "content-a",
    scoringVersion: "score-a",
    questionRecords: Array.from({ length: 8 }, (_, index) => ({
      questionId: `${attemptId}-q-${index + 1}`,
      itemType: formatType.startsWith("HFW") ? "sight_word" : "initial_sound",
      itemKey: formatType.startsWith("HFW") ? "the" : "m",
      targetWord: formatType.startsWith("HFW") ? "the" : "moon",
      targetSound: "m",
      formatType,
      responseStatus: index < correctCount ? "correct" : "incorrect",
      timestamp: completedAt
    }))
  };
}

test("repeated variants in one sitting are not counted as independent attempts", () => {
  const history = checkpointAttempt({
    attemptId: "history",
    studentId: "student-1",
    correctCount: 3
  });
  history.totalQuestions = 3;
  history.questionRecords = history.questionRecords.slice(0, 3);
  const [row] = normalizeItemMasteryRows({
    duplicate: {
      itemType: "initial_sound",
      itemKey: "m",
      skillId: history.skillId,
      skillName: history.skillName,
      attempts: 3,
      correct: 3,
      mastered: true,
      lastAssessed: history.completedAt
    }
  }, [history]);

  assert.equal(row.attempts, 1);
  assert.equal(row.correct, 1);
  assert.equal(row.status, "not_enough_evidence");
});

test("three separate sittings can support exact-item mastery", () => {
  const history = ["one", "two", "three"].map((suffix, index) => {
    const attempt = checkpointAttempt({
      attemptId: `history-${suffix}`,
      studentId: "student-1",
      correctCount: 1,
      completedAt: `2026-07-${20 + index}T10:00:00.000Z`
    });
    attempt.totalQuestions = 1;
    attempt.questionRecords = attempt.questionRecords.slice(0, 1);
    return attempt;
  });
  const [row] = normalizeItemMasteryRows({}, history, { now: NOW });

  assert.equal(row.attempts, 3);
  assert.equal(row.correct, 3);
  assert.equal(row.status, "mastered");
});

test("legacy mastery flags cannot invent a missing score", () => {
  const [row] = normalizeItemMasteryRows({
    unscoredProjection: {
      itemType: "initial_sound",
      itemKey: "m",
      skillId: "initial_sounds",
      skillName: "Initial Sounds",
      attempts: 3,
      mastered: true,
      lastAssessed: "2026-07-20T10:00:00.000Z"
    }
  }, [], { now: NOW });

  assert.equal(row.attempts, 3);
  assert.equal(row.correct, null);
  assert.equal(row.accuracy, null);
  assert.equal(row.status, "not_enough_evidence");
});

test("one saved answer does not mark the student report as ready", () => {
  const sparseAttempt = checkpointAttempt({
    attemptId: "sparse",
    studentId: "student-1",
    correctCount: 1
  });
  sparseAttempt.totalQuestions = 1;
  sparseAttempt.questionRecords = sparseAttempt.questionRecords.slice(0, 1);
  const currentStage = { id: sparseAttempt.skillId, label: sparseAttempt.skillName };
  const report = buildStudentReportModel({
    studentName: "Sam",
    currentStage,
    skillTree: [currentStage],
    assessmentHistory: [sparseAttempt],
    now: NOW
  });

  assert.equal(report.snapshot.totalAnswered, 1);
  assert.equal(report.snapshot.currentEvidenceReady, false);
  assert.equal(report.snapshot.status.id, "not_enough_evidence");
});

test("class support skills combine current results across sittings", () => {
  const assessmentHistory = ["one", "two"].map((suffix, index) => {
    const attempt = checkpointAttempt({
      attemptId: `support-${suffix}`,
      studentId: "student-1",
      correctCount: 0,
      completedAt: `2026-07-${20 + index}T10:00:00.000Z`
    });
    attempt.totalQuestions = 4;
    attempt.questionRecords = attempt.questionRecords.slice(0, 4);
    return attempt;
  });
  const report = buildClassReportModel({
    students: [{ id: "student-1", name: "Sam", class_id: "class-1" }],
    classes: [{ id: "class-1", name: "Class One" }],
    classId: "class-1",
    assessmentHistory,
    now: NOW
  });

  assert.deepEqual(report.studentRows[0].supportSkills, ["Initial Sounds"]);
});

test("class conclusions are withheld until coverage and balance are policy-ready", () => {
  const students = ["one", "two", "three"].map(id => ({
    id,
    name: id,
    class_id: "class-1"
  }));
  const twoReady = buildClassReportModel({
    students,
    classes: [{ id: "class-1", name: "Class One" }],
    classId: "class-1",
    assessmentHistory: ["one", "two"].flatMap(studentId => [
      checkpointAttempt({ attemptId: `${studentId}-a`, studentId }),
      checkpointAttempt({
        attemptId: `${studentId}-b`,
        studentId,
        skillName: "Final Sounds",
        completedAt: "2026-07-21T10:00:00.000Z"
      })
    ]),
    now: NOW
  });
  assert.equal(twoReady.comparability.comparable, false);
  assert.equal(twoReady.snapshot.averageAccuracy, null);
  assert.equal(twoReady.heatmap[0].classAccuracy, null);
  assert.deepEqual(twoReady.masteryRows, []);
  assert.deepEqual(twoReady.focusRows, []);
  assert.deepEqual(twoReady.growthAreas, []);
  assert.deepEqual(twoReady.readingRows, []);

  const allReady = buildClassReportModel({
    students,
    classes: [{ id: "class-1", name: "Class One" }],
    classId: "class-1",
    assessmentHistory: students.flatMap(student => [
      checkpointAttempt({
        attemptId: `${student.id}-a`,
        studentId: student.id
      }),
      checkpointAttempt({
        attemptId: `${student.id}-b`,
        studentId: student.id,
        skillName: "Final Sounds",
        completedAt: "2026-07-21T10:00:00.000Z"
      })
    ]),
    now: NOW
  });
  assert.equal(allReady.comparability.comparable, true);
  assert.equal(allReady.snapshot.averageAccuracy, 100);
  assert.equal(allReady.masteryRows.length, 2);
});

test("one learner needing support does not become a whole-class focus", () => {
  const students = ["one", "two", "three", "four"].map(id => ({
    id,
    name: id,
    class_id: "class-1"
  }));
  const report = buildClassReportModel({
    students,
    classes: [{ id: "class-1", name: "Class One" }],
    classId: "class-1",
    assessmentHistory: students.flatMap((student, index) => [
      checkpointAttempt({
        attemptId: `${student.id}-a`,
        studentId: student.id,
        correctCount: index === 0 ? 0 : 8
      }),
      checkpointAttempt({
        attemptId: `${student.id}-b`,
        studentId: student.id,
        skillName: "Final Sounds",
        completedAt: "2026-07-21T10:00:00.000Z"
      })
    ]),
    now: NOW
  });

  assert.equal(report.comparability.comparable, true);
  assert.equal(report.heatmap[0].needsSupportCount, 1);
  assert.deepEqual(report.focusRows, []);
});

test("class report collapses skill-name aliases into one canonical row", () => {
  const students = ["one", "two", "three"].map(id => ({
    id,
    name: id,
    class_id: "class-1"
  }));
  const assessmentHistory = students.flatMap(student => [
    checkpointAttempt({
      attemptId: `${student.id}-singular`,
      studentId: student.id,
      skillName: "Initial Sound"
    }),
    checkpointAttempt({
      attemptId: `${student.id}-plural`,
      studentId: student.id,
      skillName: "Initial Sounds",
      completedAt: "2026-07-21T10:00:00.000Z"
    })
  ]);
  const report = buildClassReportModel({
    students,
    classes: [{ id: "class-1", name: "Class One" }],
    classId: "class-1",
    assessmentHistory,
    now: NOW
  });

  assert.equal(report.heatmap.length, 1);
  assert.equal(report.heatmap[0].canonicalSkillName, "Initial Sounds");
  assert.deepEqual(report.heatmap[0].rawSkillNames, ["Initial Sound", "Initial Sounds"]);
  assert.ok(report.heatmap[0].cells.every(cell => cell.scoredResponses === 16));
});

test("class report includes reconciled saved answers without inventing assessment sittings", () => {
  const answerHistory = Array.from({ length: 20 }, (_, index) => ({
    id: `answer-${index + 1}`,
    answerEventId: `answer-event-${index + 1}`,
    studentId: "student-1",
    skill: "initial_sounds",
    diagnosticTarget: "m",
    question: `Saved prompt ${index + 1}`,
    chosen: index < 6 ? "moon" : "sun",
    correct: "moon",
    isCorrect: index < 6,
    answeredAt: `2026-07-${String(1 + index).padStart(2, "0")}T10:00:00.000Z`
  }));
  const report = buildClassReportModel({
    students: [{ id: "student-1", name: "Sam", class_id: "class-1" }],
    classes: [{ id: "class-1", name: "Class One" }],
    classId: "class-1",
    assessmentHistory: [],
    answerHistory,
    now: NOW
  });

  assert.equal(report.studentRows[0].attempts, 0);
  assert.equal(report.studentRows[0].savedAnswers, 20);
  assert.equal(report.studentRows[0].totalQuestions, 20);
  assert.equal(report.studentRows[0].correctCount, 6);
  assert.equal(report.studentRows[0].accuracy, 30);
  assert.equal(report.studentRows[0].status.id, "not_enough_evidence");
  assert.equal(report.heatmap[0].cells[0].savedAnswers, 20);
  assert.equal(report.heatmap[0].cells[0].statusId, "not_enough_evidence");
  assert.equal(report.snapshot.assessedStudents, 1);
  assert.equal(report.snapshot.savedAnswers, 20);
});

test("class report separates verified status from additional saved-answer history", () => {
  const verifiedAttempt = checkpointAttempt({
    attemptId: "verified-check",
    studentId: "student-1",
    correctCount: 8
  });
  const answerHistory = Array.from({ length: 20 }, (_, index) => ({
    id: `mixed-answer-${index + 1}`,
    answerEventId: `mixed-event-${index + 1}`,
    studentId: "student-1",
    skill: "initial_sounds",
    diagnosticTarget: "s",
    question: `Additional saved prompt ${index + 1}`,
    chosen: index < 6 ? "sun" : "moon",
    correct: "sun",
    isCorrect: index < 6,
    answeredAt: `2026-07-${String(1 + index).padStart(2, "0")}T11:00:00.000Z`
  }));
  const report = buildClassReportModel({
    students: [{ id: "student-1", name: "Sam", class_id: "class-1" }],
    classes: [{ id: "class-1", name: "Class One" }],
    classId: "class-1",
    assessmentHistory: [verifiedAttempt],
    answerHistory,
    now: NOW
  });
  const student = report.studentRows[0];
  const cell = report.heatmap[0].cells[0];

  assert.equal(student.status.id, "not_enough_evidence");
  assert.equal(student.totalQuestions, 8);
  assert.equal(student.accuracy, 100);
  assert.equal(student.savedAnswers, 20);
  assert.equal(student.selectedPeriodTotalQuestions, 28);
  assert.equal(student.selectedPeriodCorrectCount, 14);
  assert.equal(student.selectedPeriodAccuracy, 50);
  assert.equal(cell.statusId, "mastered");
  assert.equal(cell.selectedPeriodScoredResponses, 28);
  assert.equal(cell.selectedPeriodCorrectResponses, 14);
  assert.deepEqual(student.supportSkills, []);
});

test("class report keeps older rows in an explicitly selected historical period", () => {
  const oldAttempt = checkpointAttempt({
    attemptId: "older-selected-period",
    studentId: "student-1",
    completedAt: "2025-09-10T10:00:00.000Z"
  });
  const report = buildClassReportModel({
    students: [{ id: "student-1", name: "Sam", class_id: "class-1" }],
    classes: [{ id: "class-1", name: "Class One" }],
    classId: "class-1",
    assessmentHistory: [oldAttempt],
    now: NOW
  });

  assert.equal(report.provenanceEvidence.length, 1);
  assert.equal(report.historicalEvidence.length, 1);
  assert.equal(report.snapshot.attempts, 1);
  assert.equal(report.studentRows[0].totalQuestions, 8);
  assert.equal(report.studentRows[0].status.id, "not_enough_evidence");
});

test("moving a student does not move class-owned assessment history", () => {
  const students = [{ id: "student-1", name: "Sam", class_id: "class-b" }];
  const classes = [
    { id: "class-a", name: "Class A" },
    { id: "class-b", name: "Class B" }
  ];
  const oldClassAttempt = checkpointAttempt({
    attemptId: "recorded-in-a",
    studentId: "student-1"
  });
  oldClassAttempt.classId = "class-a";
  const newClassAttempt = checkpointAttempt({
    attemptId: "recorded-in-b",
    studentId: "student-1",
    completedAt: "2026-07-21T10:00:00.000Z"
  });
  newClassAttempt.classId = "class-b";

  const classA = buildClassReportModel({
    students: [],
    classes,
    classId: "class-a",
    assessmentHistory: [oldClassAttempt, newClassAttempt],
    now: NOW
  });
  const classB = buildClassReportModel({
    students,
    classes,
    classId: "class-b",
    assessmentHistory: [oldClassAttempt, newClassAttempt],
    now: NOW
  });

  assert.deepEqual(
    classA.provenanceEvidence.map(row => row.attemptId),
    ["recorded-in-a"]
  );
  assert.deepEqual(
    classB.provenanceEvidence.map(row => row.attemptId),
    ["recorded-in-b"]
  );
  assert.equal(classB.provenance.legacyClassScopeFallbackCount, 0);
});

test("theme is not misrouted to a digraph activity", () => {
  const students = ["one", "two", "three"].map(id => ({
    id,
    name: id,
    class_id: "class-1"
  }));
  const report = buildClassReportModel({
    students,
    classes: [{ id: "class-1", name: "Class One" }],
    classId: "class-1",
    assessmentHistory: students.map(student => checkpointAttempt({
      attemptId: `${student.id}-theme`,
      studentId: student.id,
      skillName: "Theme and Higher Comprehension",
      correctCount: 0
    })),
    now: NOW
  });

  assert.equal(report.heatmap[0].displaySkillName, "Theme and Higher Comprehension");
  assert.doesNotMatch(report.focusRows[0].suggestedAction, /ch\/sh\/th/i);
});

test("HFW runtime rejects a word assigned to the wrong approved band", () => {
  const issues = getHfwRuntimeEligibilityIssues({
    id: "wrong-band",
    skillId: "hfw_1_25",
    itemType: "sight_word",
    targetWord: "all",
    correctAnswer: "all",
    formatType: "HFW_SENTENCE_CLOZE_L1P1_01",
    sentence: "A cup ___ tea.",
    answerOptions: ["all", "the", "to", "and"]
  }, "hfw_1_25");

  assert.ok(issues.some(issue => issue.includes('outside canonical hfw_1_25')));
});

test("no-audio HFW questions cannot regain target-word audio during media enrichment", () => {
  const enriched = enrichQuestionWithExistingMedia({
    id: "hfw-no-audio",
    skillId: "hfw_1_25",
    targetWord: "the",
    disableAudio: true,
    noAudio: true,
    audio: "/audio/legacy/the.mp3",
    audioUrl: "/audio/legacy/the.mp3",
    audioPath: "/audio/legacy/the.mp3",
    sentenceAudio: "The dog slept.",
    answerOptions: [{
      value: "the",
      audioPath: "/audio/legacy/the.mp3"
    }]
  });

  assert.equal(enriched.audio, undefined);
  assert.equal(enriched.audioUrl, undefined);
  assert.equal(enriched.audioPath, undefined);
  assert.equal(enriched.answerOptions[0].audioPath, undefined);
  assert.equal(enriched.sentenceAudio, "The dog slept.");
});

test("disabling standalone grammar audio does not remove required answer-tile audio", () => {
  const question = grammarAssessmentQuestions.find(
    row => row.id === "grammar_nouns_l2_001"
  );
  assert.ok(question);
  assert.equal(question.disableAudio, true);
  assert.equal(question.requireOptionAudio, true);

  const enriched = enrichQuestionWithExistingMedia(question);
  assert.ok(enriched.answerOptions.every(option => option.audioPath));
});
