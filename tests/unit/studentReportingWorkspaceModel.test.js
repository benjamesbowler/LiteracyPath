import assert from "node:assert/strict";
import test from "node:test";

import {
  buildElAssessmentReportModel,
  buildGuidedReadingReportModel,
  buildOtherLearningReportModel,
  buildSkillsCheckReportModel,
  buildStudentReportingWorkspaceModel,
  buildWholeChildKnowledgeModel,
  getCanonicalStudentAssessmentAttempts
} from "../../src/data/studentReportingWorkspaceModel.js";
import {
  createReportingConcept,
  createReportingEvidence,
  REPORTING_EVIDENCE_KINDS,
  REPORTING_STATUS_IDS
} from "../../src/data/reportingEvidenceModel.js";

const student = { id: "student-1", name: "Ada", classId: "class-1" };

function attempt(overrides = {}) {
  return {
    attemptId: "attempt-1",
    studentId: student.id,
    studentName: student.name,
    classId: student.classId,
    teacherId: "teacher-1",
    assessmentType: "skill_checkpoint",
    skillId: "initial_sounds",
    skillName: "Initial Sounds",
    startedAt: "2026-07-20T10:00:00.000Z",
    completedAt: "2026-07-20T10:05:00.000Z",
    updatedAt: "2026-07-20T10:05:00.000Z",
    totalQuestions: 1,
    correctCount: 1,
    questionRecords: [{
      questionId: "question-1",
      itemType: "initial_sound",
      itemKey: "m",
      targetSound: "m",
      responseStatus: "correct",
      isCorrect: true,
      timestamp: "2026-07-20T10:01:00.000Z"
    }],
    ...overrides
  };
}

test("canonical attempts dedupe local/cloud copies and require a student selection", () => {
  const local = attempt({ updatedAt: "2026-07-20T10:05:00.000Z" });
  const cloud = attempt({
    updatedAt: "2026-07-20T10:06:00.000Z",
    note: "Richer cloud copy",
    questionRecords: [
      ...local.questionRecords,
      {
        questionId: "question-2",
        itemType: "initial_sound",
        itemKey: "m",
        targetSound: "m",
        responseStatus: "correct",
        isCorrect: true,
        timestamp: "2026-07-20T10:02:00.000Z"
      }
    ]
  });
  const otherStudent = attempt({ attemptId: "other", studentId: "student-2" });

  const rows = getCanonicalStudentAssessmentAttempts({
    student,
    localAssessmentHistory: [local, otherStudent],
    cloudAssessmentHistory: [cloud]
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].note, "Richer cloud copy");
  assert.equal(rows[0].questionRecords.length, 2);
  assert.deepEqual(getCanonicalStudentAssessmentAttempts({ assessmentHistory: [local] }), []);
});

test("Skills Check uses canonical questions and suppresses their itemMastery projection", () => {
  const local = attempt({ updatedAt: "2026-07-20T10:05:00.000Z" });
  const cloud = attempt({
    updatedAt: "2026-07-20T10:06:00.000Z",
    totalQuestions: 2,
    correctCount: 2,
    questionRecords: [
      local.questionRecords[0],
      { ...local.questionRecords[0], prompt: "Richer duplicate copy of the same question" },
      {
        ...local.questionRecords[0],
        questionId: "question-2",
        timestamp: "2026-07-20T10:02:00.000Z"
      }
    ]
  });
  const model = buildSkillsCheckReportModel({
    student,
    localAssessmentHistory: [local],
    cloudAssessmentHistory: [cloud],
    itemMastery: {
      "initial_sound::m": {
        itemType: "initial_sound",
        itemKey: "m",
        skillId: "initial_sounds",
        attempts: 2,
        correct: 2,
        accuracy: 100,
        mastered: true,
        lastAssessed: "2026-07-20T10:02:00.000Z"
      },
      "initial_sound::s": {
        itemType: "initial_sound",
        itemKey: "s",
        skillId: "initial_sounds",
        attempts: 1,
        correct: 0,
        accuracy: 0,
        status: "needs_support",
        lastAssessed: "2026-06-01T10:00:00.000Z"
      }
    }
  });

  assert.equal(model.summary.attempts, 1);
  assert.equal(model.evidence.filter(row => row.sourceRecordType === "skill_checkpoint").length, 2);
  assert.equal(model.provenance.suppressedItemMasteryConceptCount, 1);
  assert.equal(model.summary.legacyFallbackItems, 1);
  assert.equal(model.items.find(row => row.concept.key === "m").statusCandidate, REPORTING_STATUS_IDS.SECURE);
  assert.equal(model.items.find(row => row.concept.key === "s").statusCandidate, REPORTING_STATUS_IDS.NEEDS_TEACHING);
});

test("EL Assessments 1 and 2 prefer completed history and only use legacy state as fallback", () => {
  const letterHistory = attempt({
    attemptId: "letter-history",
    assessmentType: "el_letter_assessment",
    skillId: "el_letter_assessment",
    skillName: "EL Letter Name and Sound",
    passed: false,
    totalQuestions: 2,
    correctCount: 1,
    questionRecords: [
      {
        questionId: "letter-m-name",
        targetLetter: "M",
        itemKey: "m",
        itemType: "letter_name",
        templateType: "letter_name",
        responseStatus: "correct",
        isCorrect: true,
        timestamp: "2026-07-20T10:01:00.000Z"
      },
      {
        questionId: "letter-m-sound",
        targetLetter: "M",
        itemKey: "m",
        itemType: "letter_sound",
        templateType: "letter_sound",
        responseStatus: "incorrect",
        isCorrect: false,
        timestamp: "2026-07-20T10:02:00.000Z"
      }
    ]
  });
  const descriptive = attempt({
    attemptId: "pa-history",
    assessmentType: "el_phonological_awareness",
    skillId: "el_phonological_awareness",
    skillName: "EL Phonological Awareness",
    gradePath: "1",
    benchmarkWindow: "BOY",
    passed: true,
    totalQuestions: 1,
    correctCount: 1,
    questionRecords: [{
      questionId: "rhyme-1",
      itemKey: "rhyme_recognition",
      itemType: "phonological_awareness",
      responseStatus: "correct",
      isCorrect: true,
      metadata: { strand: "rhyme", task: "recognition" }
    }]
  });
  const model = buildElAssessmentReportModel({
    student,
    assessmentHistory: [letterHistory, descriptive],
    letterAssessment: [{ letter: "M", type: "uppercase", knowsName: false, knowsSound: true }],
    patternAssessment: [{ pattern: "sh", exampleWord: "ship", soundCorrect: true, wordCorrect: false }]
  });

  assert.equal(model.assessments.length, 6);
  assert.equal(model.assessments[0].source, "completed_history");
  assert.equal(model.assessments[0].evidence.find(row => row.concept.construct === "letter_name").statusCandidate, REPORTING_STATUS_IDS.SECURE);
  assert.equal(model.assessments[0].evidence.find(row => row.concept.construct === "letter_sound").statusCandidate, REPORTING_STATUS_IDS.NEEDS_TEACHING);
  assert.equal(model.assessments[1].source, "legacy_fallback");
  assert.equal(model.assessments[2].descriptive, true);
  assert.equal(model.assessments[2].wholeChildStatus, null);
  assert.equal(model.assessments[2].resultLabel, "Completed");
  assert.equal(model.descriptiveEvidence.length, 1);
  assert.equal(model.descriptiveEvidence[0].knowledgeEligible, false);
  assert.equal(model.knowledgeEvidence.some(row => row.sourceRecordType === "el_phonological_awareness"), false);
  assert.equal(model.assessments[5].resultLabel, "Not checked");
  assert.equal(model.letterMatrix.find(row => row.letter === "m").uppercaseName.status, "mastered");
  assert.equal(Array.isArray(model.advancedPhonicsMatrix), true);
  assert.equal(model.provenance.completedHistoryIsCanonical, true);
});

test("Guided Reading keeps connected-text word marks distinct from learned words", () => {
  const model = buildGuidedReadingReportModel({
    student,
    guidedReadingRecords: {
      "book-1": {
        bookId: "book-1",
        title: "The Red Hen",
        level: "A",
        completed: true,
        completedAt: "2026-07-18T10:00:00.000Z",
        lastReadAt: "2026-07-20T10:00:00.000Z",
        readCount: 2,
        completedPages: 1,
        totalPages: 1,
        quizScore: 5,
        quizTotal: 5,
        quizAt: "2026-07-20T10:02:00.000Z",
        wholeBookNote: "Good expression.",
        pages: {
          0: {
            wordTexts: ["cat", "dog"],
            wordMarks: { 0: "correct", 1: "support" },
            note: "Pause at full stops.",
            updatedAt: "2026-07-20T10:01:00.000Z"
          }
        }
      }
    }
  });

  assert.equal(model.summary.booksCompleted, 1);
  assert.equal(model.summary.rereads, 1);
  assert.equal(model.summary.teacherNotes, 2);
  assert.equal(model.books[0].attempted, 2);
  assert.equal(model.books[0].latestAccuracy, 50);
  assert.equal(model.wordRows.find(row => row.word === "cat").statusLabel, "Read correctly in this book");
  const cat = model.knowledgeEvidence.find(row => row.concept.key === "cat");
  assert.equal(cat.concept.construct, "connected_text_word_reading");
  assert.equal(cat.statusCandidate, REPORTING_STATUS_IDS.SECURE);
  assert.equal(cat.concept.label.includes("learned"), false);
  const quiz = model.knowledgeEvidence.find(row => row.sourceRecordType === "book_quiz");
  assert.equal(quiz.evidenceKind, REPORTING_EVIDENCE_KINDS.PRACTICE);
  assert.equal(quiz.statusCandidate, REPORTING_STATUS_IDS.DEVELOPING);
  assert.equal(model.provenance.connectedTextWordsAreNotRelabelledAsLearned, true);
});

test("Guided Reading fills missing catalogue metadata without replacing raw marks or notes", () => {
  const model = buildGuidedReadingReportModel({
    student,
    guidedReadingRecords: {
      "book-legacy": {
        completedPages: 1,
        lastReadAt: "2026-07-20T10:00:00.000Z",
        wholeBookNote: "Raw teacher note",
        pages: {
          0: {
            wordTexts: ["map"],
            wordMarks: { 0: "correct" },
            updatedAt: "2026-07-20T10:00:00.000Z"
          }
        }
      }
    },
    guidedReadingRows: [{
      bookId: "book-legacy",
      title: "What Is a Map?",
      type: "nonfiction",
      level: "B",
      totalPages: 6,
      correctWords: [],
      supportWords: ["map"],
      notes: ["Prepared note must not replace raw note"]
    }],
    guidedReadingWordRows: [{
      bookId: "book-legacy",
      title: "What Is a Map?",
      level: "B",
      page: 1,
      word: "map",
      status: "Needs Support"
    }]
  });

  assert.equal(model.books[0].title, "What Is a Map?");
  assert.equal(model.books[0].level, "B");
  assert.equal(model.books[0].type, "nonfiction");
  assert.equal(model.books[0].totalPages, 6);
  assert.deepEqual(model.books[0].correctWords, ["map"]);
  assert.deepEqual(model.books[0].supportWords, []);
  assert.equal(model.notes[0].note, "Raw teacher note");
  assert.equal(model.wordRows[0].title, "What Is a Map?");
  assert.equal(model.wordRows[0].statusLabel, "Read correctly in this book");
  assert.equal(model.books[0].provenance.preparedMetadata.title, "What Is a Map?");
});

test("Other Learning caps Sound Seekers at Developing and keeps Story Quest words as exposure", () => {
  const model = buildOtherLearningReportModel({
    student,
    soundSeekersReport: {
      lastActiveAt: "2026-07-20T09:00:00.000Z",
      heat: [
        { id: "sh", label: "sh", bucket: "got-it", seen: 8, independentSeen: 6, accuracy: 100 },
        { id: "ch", label: "ch", bucket: "reteach", seen: 5, independentSeen: 4, accuracy: 25 },
        { id: "th", label: "th", bucket: "unseen", seen: 0 }
      ]
    },
    storyQuestSummary: {
      rows: [{
        questId: "quest-1",
        title: "Forest Friends",
        completed: true,
        completedAt: "2026-07-19T10:00:00.000Z",
        words: ["owl", "nest"]
      }]
    },
    arcade: {
      games: {
        "rocket-run": { plays: 3, stars: 2, highScore: 40, lastPlayedAt: "2026-07-18T10:00:00.000Z" }
      },
      gameCatalog: [{ id: "rocket-run", title: "Rocket Run", skill: "Beginning sounds" }]
    }
  });

  assert.equal(model.soundSeekers.sounds.find(row => row.id === "sh").wholeChildStatus.id, REPORTING_STATUS_IDS.DEVELOPING);
  assert.equal(model.soundSeekers.sounds.find(row => row.id === "ch").wholeChildStatus.id, REPORTING_STATUS_IDS.NEEDS_TEACHING);
  assert.equal(model.soundSeekers.sounds.find(row => row.id === "th").wholeChildStatus.id, REPORTING_STATUS_IDS.NOT_CHECKED);
  assert.equal(model.knowledgeEvidence.some(row => row.statusCandidate === REPORTING_STATUS_IDS.SECURE), false);
  assert.deepEqual(model.storyQuests.stories[0].vocabularyEncountered, ["owl", "nest"]);
  assert.deepEqual(model.storyQuests.stories[0].wordsEncountered, ["owl", "nest"]);
  assert.equal(model.arcade.games[0].skill, "Beginning sounds");
  assert.equal(model.storyQuests.vocabularyLabel, "Vocabulary encountered");
  const storyEvidence = model.evidence.find(row => row.sourceArea === "story_quests");
  assert.equal(storyEvidence.outcome, "encountered");
  assert.equal(storyEvidence.knowledgeEligible, false);
  assert.equal(model.evidence.find(row => row.sourceArea === "arcade").knowledgeEligible, false);
  assert.equal(model.provenance.practiceCannotCreateSecure, true);
});

test("Skills Check exposes legacy skill summary rows when canonical attempts are unavailable", () => {
  const model = buildSkillsCheckReportModel({
    student,
    skillMasterySummary: {
      rhyming: {
        label: "Rhyming",
        attempts: 2,
        mastered: true,
        score: 9,
        total: 10,
        updatedAt: "2026-06-10T10:00:00.000Z"
      }
    }
  });

  assert.equal(model.summary.attempts, 0);
  assert.equal(model.summary.skillsChecked, 1);
  assert.equal(model.skills.length, 1);
  assert.equal(model.skills[0].skillId, "rhyming");
  assert.equal(model.skills[0].source, "legacy_projection");
  assert.equal(model.skills[0].currentStatus.id, REPORTING_STATUS_IDS.SECURE);
  assert.equal(model.skills[0].statusLabel, "Secure");
  assert.equal(model.skills[0].latestAttempt, null);
  assert.equal(model.summary.legacyFallbackItems, 1);
});

test("source models enforce strict assessment boundaries", () => {
  const skill = attempt({ attemptId: "skill-only" });
  const diagnostic = attempt({ attemptId: "diagnostic", assessmentType: "diagnostic" });
  const letter = attempt({
    attemptId: "letter-only",
    assessmentType: "el_letter_assessment",
    skillId: "el_letter_assessment",
    skillName: "EL Letter Name and Sound",
    questionRecords: [{
      questionId: "letter-a-name",
      targetLetter: "A",
      itemKey: "a",
      itemType: "letter_name",
      responseStatus: "correct",
      isCorrect: true
    }]
  });
  const records = [skill, diagnostic, letter];
  const skills = buildSkillsCheckReportModel({ student, assessmentHistory: records });
  const el = buildElAssessmentReportModel({ student, assessmentHistory: records });

  assert.deepEqual(skills.provenance.canonicalAttemptIds, ["skill-only"]);
  assert.deepEqual(el.provenance.canonicalAttemptIds, ["letter-only"]);
  assert.equal(skills.evidence.some(row => row.sourceRecordType === "diagnostic"), false);
  assert.equal(el.evidence.some(row => row.sourceRecordType === "skill_checkpoint"), false);
});

test("Whole Child uses strength precedence, reports direct conflicts, and treats missing as Not checked", () => {
  const concept = createReportingConcept({
    domain: "phonics",
    construct: "grapheme_sound",
    key: "sh",
    label: "Sound for sh"
  });
  const formalSecure = createReportingEvidence({
    evidenceId: "formal-secure",
    studentId: student.id,
    sourceArea: "el_assessments",
    sourceLabel: "EL Assessments",
    sourceRecordId: "el-1",
    sourceRecordType: "advanced_phonics_patterns",
    evidenceKind: REPORTING_EVIDENCE_KINDS.FORMAL,
    concept,
    statusCandidate: REPORTING_STATUS_IDS.SECURE,
    outcome: "correct",
    observedAt: "2026-07-20T10:00:00.000Z"
  });
  const practiceNeeds = createReportingEvidence({
    evidenceId: "practice-needs",
    studentId: student.id,
    sourceArea: "sound_seekers",
    sourceLabel: "Sound Seekers",
    sourceRecordId: "sh",
    sourceRecordType: "sound_mastery_state",
    evidenceKind: REPORTING_EVIDENCE_KINDS.PRACTICE,
    concept,
    statusCandidate: REPORTING_STATUS_IDS.NEEDS_TEACHING,
    outcome: "reteach",
    observedAt: "2026-07-21T10:00:00.000Z"
  });
  const formalWins = buildWholeChildKnowledgeModel({
    student,
    evidence: [formalSecure, practiceNeeds]
  });
  assert.equal(formalWins.concepts[0].status.id, REPORTING_STATUS_IDS.SECURE);

  const teacherNeeds = createReportingEvidence({
    evidenceId: "teacher-needs",
    studentId: student.id,
    sourceArea: "teacher_check",
    sourceLabel: "Teacher check",
    sourceRecordId: "teacher-1",
    sourceRecordType: "direct_observation",
    evidenceKind: REPORTING_EVIDENCE_KINDS.TEACHER_OBSERVATION,
    concept,
    statusCandidate: REPORTING_STATUS_IDS.NEEDS_TEACHING,
    outcome: "incorrect",
    observedAt: "2026-07-21T10:00:00.000Z"
  });
  const missingConcept = createReportingConcept({
    domain: "phonics",
    construct: "grapheme_sound",
    key: "th",
    label: "Sound for th"
  });
  const mixed = buildWholeChildKnowledgeModel({
    student,
    evidence: [formalSecure, teacherNeeds],
    expectedConcepts: [missingConcept]
  });

  assert.equal(mixed.concepts.find(row => row.key === "sh").status.id, REPORTING_STATUS_IDS.MIXED_EVIDENCE);
  assert.equal(mixed.concepts.find(row => row.key === "th").status.id, REPORTING_STATUS_IDS.NOT_CHECKED);
  assert.equal(mixed.groups.mixedEvidence.length, 1);
  assert.equal(mixed.groups.notChecked.length, 1);
  assert.equal(mixed.byDomain[0].id, "phonics");
  assert.equal(mixed.byDomain[0].label, "Phonics");
  assert.equal(mixed.byDomain[0].items.length, 2);
  assert.equal(mixed.provenance.conflictsAreNotAveraged, true);
});

test("Whole Child does not keep an obsolete direct conflict forever", () => {
  const concept = createReportingConcept({
    domain: "phonics",
    construct: "grapheme_sound",
    key: "ee",
    label: "Sound for ee"
  });
  const oldSecure = createReportingEvidence({
    evidenceId: "old-secure",
    studentId: student.id,
    sourceArea: "el_assessments",
    sourceLabel: "EL Assessments",
    sourceRecordId: "old-el",
    sourceRecordType: "advanced_phonics_patterns",
    evidenceKind: REPORTING_EVIDENCE_KINDS.FORMAL,
    concept,
    statusCandidate: REPORTING_STATUS_IDS.SECURE,
    observedAt: "2025-01-01T00:00:00.000Z"
  });
  const currentNeeds = createReportingEvidence({
    evidenceId: "current-needs",
    studentId: student.id,
    sourceArea: "teacher_check",
    sourceLabel: "Teacher check",
    sourceRecordId: "current-teacher",
    sourceRecordType: "direct_observation",
    evidenceKind: REPORTING_EVIDENCE_KINDS.TEACHER_OBSERVATION,
    concept,
    statusCandidate: REPORTING_STATUS_IDS.NEEDS_TEACHING,
    observedAt: "2026-07-21T00:00:00.000Z"
  });
  const model = buildWholeChildKnowledgeModel({ student, evidence: [oldSecure, currentNeeds] });

  assert.equal(model.concepts[0].status.id, REPORTING_STATUS_IDS.NEEDS_TEACHING);
  assert.equal(model.provenance.conflictWindowDays, 90);
  assert.equal(model.concepts[0].evidence.length, 2);
});

test("practice-only success can never create Secure", () => {
  const practice = createReportingEvidence({
    evidenceId: "practice-secure-request",
    studentId: student.id,
    sourceArea: "practice",
    sourceLabel: "Practice",
    sourceRecordId: "p1",
    sourceRecordType: "game",
    evidenceKind: REPORTING_EVIDENCE_KINDS.PRACTICE,
    concept: { domain: "phonics", construct: "grapheme_sound", key: "ai", label: "Sound for ai" },
    statusCandidate: REPORTING_STATUS_IDS.SECURE,
    outcome: "mastered_in_game"
  });
  const model = buildWholeChildKnowledgeModel({ student, evidence: [practice] });

  assert.equal(practice.statusCandidate, REPORTING_STATUS_IDS.DEVELOPING);
  assert.equal(model.concepts[0].status.id, REPORTING_STATUS_IDS.DEVELOPING);
});

test("workspace builder returns five independent reports and a calm empty state", () => {
  const model = buildStudentReportingWorkspaceModel({ student });

  assert.deepEqual(Object.keys(model).filter(key => [
    "wholeChild",
    "elAssessments",
    "guidedReading",
    "skillsCheck",
    "otherLearning"
  ].includes(key)).sort(), [
    "elAssessments",
    "guidedReading",
    "otherLearning",
    "skillsCheck",
    "wholeChild"
  ]);
  assert.equal(model.elAssessments.assessments.length, 6);
  assert.equal(model.wholeChild.overallStatus.id, REPORTING_STATUS_IDS.NOT_CHECKED);
  assert.equal(model.provenance.canonicalAssessmentAttemptCount, 0);
});

test("an explicit student id remains authoritative across every workspace report", () => {
  const selectedAttempt = attempt({
    attemptId: "selected-student-attempt",
    studentId: "student-2",
    studentName: "Bea",
    classId: "class-2"
  });
  const model = buildStudentReportingWorkspaceModel({
    student: { id: "student-1", name: "Conflicting object", classId: "class-1" },
    studentId: "student-2",
    assessmentHistory: [attempt(), selectedAttempt]
  });

  assert.equal(model.student.id, "student-2");
  assert.equal(model.student.name, "Bea");
  assert.equal(model.student.classId, "class-2");
  assert.equal(model.wholeChild.studentId, "student-2");
  assert.equal(model.elAssessments.studentId, "student-2");
  assert.equal(model.guidedReading.studentId, "student-2");
  assert.equal(model.skillsCheck.studentId, "student-2");
  assert.equal(model.otherLearning.studentId, "student-2");
  assert.deepEqual(model.skillsCheck.provenance.canonicalAttemptIds, ["selected-student-attempt"]);
});

test("prebuilt raw practice evidence cannot bypass normalization or create Secure", () => {
  const concept = createReportingConcept({
    domain: "phonics",
    construct: "grapheme_sound",
    key: "oa",
    label: "Sound for oa"
  });
  const model = buildWholeChildKnowledgeModel({
    student,
    evidence: [{
      evidenceId: "untrusted-prebuilt-practice",
      studentId: student.id,
      sourceArea: "game",
      sourceLabel: "Game",
      sourceRecordId: "game-1",
      sourceRecordType: "practice_result",
      evidenceKind: REPORTING_EVIDENCE_KINDS.PRACTICE,
      concept,
      statusCandidate: REPORTING_STATUS_IDS.SECURE,
      status: { id: REPORTING_STATUS_IDS.SECURE, label: "Secure" },
      outcome: "mastered",
      strength: 99,
      practiceOnly: false,
      scorable: true,
      knowledgeEligible: true
    }]
  });

  assert.equal(model.concepts[0].status.id, REPORTING_STATUS_IDS.DEVELOPING);
  assert.equal(model.evidence[0].statusCandidate, REPORTING_STATUS_IDS.DEVELOPING);
  assert.equal(model.evidence[0].strength, 1);
  assert.equal(model.evidence[0].practiceOnly, true);
});

test("empty terminal EL 1 and 2 records are Not checked rather than failed zero-percent assessments", () => {
  const emptyLetter = attempt({
    attemptId: "empty-letter",
    assessmentType: "el_letter_assessment",
    skillId: "el_letter_assessment",
    skillName: "Letter Name and Sound Recognition",
    administrationStatus: "completed",
    totalQuestions: 0,
    correctCount: 0,
    passed: false,
    questionRecords: []
  });
  const unknownAdvanced = attempt({
    attemptId: "unknown-advanced",
    assessmentType: "advanced_phonics_patterns",
    skillId: "advanced_phonics_patterns",
    skillName: "Advanced Phonics Patterns",
    administrationStatus: "completed",
    totalQuestions: 0,
    correctCount: 0,
    passed: false,
    questionRecords: [{
      questionId: "unknown-sh",
      itemType: "phonics_pattern",
      itemKey: "sh",
      targetPattern: "sh",
      responseStatus: "recorded"
    }]
  });
  const model = buildElAssessmentReportModel({
    student,
    assessmentHistory: [emptyLetter, unknownAdvanced]
  });
  const letter = model.assessments[0];
  const advanced = model.assessments[1];

  assert.equal(letter.latestAttempt.attemptId, "empty-letter");
  assert.equal(letter.checked, false);
  assert.equal(letter.scorable, false);
  assert.equal(letter.resultLabel, "Not checked");
  assert.equal(letter.wholeChildStatus.id, REPORTING_STATUS_IDS.NOT_CHECKED);
  assert.equal(advanced.latestAttempt.attemptId, "unknown-advanced");
  assert.equal(advanced.checked, false);
  assert.equal(advanced.scorable, false);
  assert.equal(advanced.resultLabel, "Not checked");
  assert.equal(advanced.wholeChildStatus.id, REPORTING_STATUS_IDS.NOT_CHECKED);
  assert.equal(model.summary.assessmentsChecked, 0);
  assert.equal(model.knowledgeEvidence.length, 0);
});

test("EL 1 and 2 keep the latest terminal result current when a newer attempt is unfinished", () => {
  const completedLetter = attempt({
    attemptId: "completed-letter",
    assessmentType: "el_letter_assessment",
    skillId: "el_letter_assessment",
    skillName: "Letter Name and Sound Recognition",
    administrationStatus: "completed",
    completedAt: "2026-07-20T10:05:00.000Z",
    updatedAt: "2026-07-20T10:05:00.000Z",
    passed: true,
    totalQuestions: 1,
    correctCount: 1,
    questionRecords: [{
      questionId: "completed-letter-m",
      targetLetter: "M",
      itemKey: "m",
      itemType: "letter_sound",
      templateType: "letter_sound",
      responseStatus: "correct",
      isCorrect: true,
      timestamp: "2026-07-20T10:04:00.000Z"
    }]
  });
  const partialLetter = attempt({
    ...completedLetter,
    attemptId: "partial-letter",
    administrationStatus: "partial",
    completedAt: "2026-07-21T10:05:00.000Z",
    updatedAt: "2026-07-21T10:05:00.000Z",
    passed: false,
    correctCount: 0,
    questionRecords: [{
      ...completedLetter.questionRecords[0],
      questionId: "partial-letter-m",
      responseStatus: "incorrect",
      isCorrect: false,
      timestamp: "2026-07-21T10:04:00.000Z"
    }]
  });
  const model = buildStudentReportingWorkspaceModel({
    student,
    assessmentHistory: [completedLetter, partialLetter]
  });
  const letter = model.elAssessments.assessments[0];

  assert.equal(letter.latestAttempt.attemptId, "completed-letter");
  assert.equal(letter.resultLabel, "Secure");
  assert.deepEqual(letter.attempts.map(row => row.attemptId), ["partial-letter", "completed-letter"]);
  assert.equal(model.elAssessments.knowledgeEvidence[0].sourceRecordId, "completed-letter");
  assert.equal(model.wholeChild.concepts.find(row => row.key === "m").status.id, REPORTING_STATUS_IDS.SECURE);
});

test("EL 3 to 6 cards and evidence obey the selected benchmark grade and window", () => {
  const olderMoy = attempt({
    attemptId: "pa-grade-1-moy",
    assessmentType: "el_phonological_awareness",
    skillId: "el_phonological_awareness",
    skillName: "Phonological Awareness",
    gradePath: "1",
    benchmarkWindow: "MOY",
    completedAt: "2026-02-01T10:05:00.000Z",
    updatedAt: "2026-02-01T10:05:00.000Z",
    questionRecords: [{
      questionId: "moy-rhyme",
      itemType: "phonological_awareness",
      itemKey: "rhyme_recognition",
      responseStatus: "correct",
      isCorrect: true,
      timestamp: "2026-02-01T10:04:00.000Z",
      metadata: { strand: "rhyme", task: "recognition" }
    }]
  });
  const newerEoy = attempt({
    ...olderMoy,
    attemptId: "pa-grade-1-eoy",
    benchmarkWindow: "EOY",
    completedAt: "2026-06-01T10:05:00.000Z",
    updatedAt: "2026-06-01T10:05:00.000Z",
    questionRecords: [{
      ...olderMoy.questionRecords[0],
      questionId: "eoy-rhyme",
      responseStatus: "incorrect",
      isCorrect: false,
      timestamp: "2026-06-01T10:04:00.000Z"
    }]
  });
  const model = buildElAssessmentReportModel({
    student,
    assessmentHistory: [olderMoy, newerEoy],
    benchmarkScope: { grade: "1", benchmarkWindow: "MOY" }
  });
  const phonologicalAwareness = model.assessments[2];

  assert.equal(model.benchmarkScope.benchmarkWindow, "MOY");
  assert.equal(phonologicalAwareness.latestAttempt.attemptId, "pa-grade-1-moy");
  assert.equal(phonologicalAwareness.attemptCount, 1);
  assert.deepEqual(phonologicalAwareness.attempts.map(row => row.attemptId), ["pa-grade-1-moy"]);
  assert.equal(phonologicalAwareness.profile.latestAttemptId, "pa-grade-1-moy");
  assert.equal(phonologicalAwareness.detail.attemptId, "pa-grade-1-moy");
  assert.deepEqual(phonologicalAwareness.evidence.map(row => row.sourceRecordId), ["pa-grade-1-moy"]);
  assert.deepEqual(model.descriptiveEvidence.map(row => row.sourceRecordId), ["pa-grade-1-moy"]);
});

test("Skills Check current status, score and item judgment come from the newest terminal attempt", () => {
  const makeCheckpoint = ({ attemptId, completedAt, responseStatus, passed }) => attempt({
    attemptId,
    completedAt,
    updatedAt: completedAt,
    passed,
    correctCount: passed ? 1 : 0,
    questionRecords: [{
      ...attempt().questionRecords[0],
      questionId: `${attemptId}-m`,
      responseStatus,
      isCorrect: passed,
      timestamp: completedAt
    }]
  });
  const oldPass = makeCheckpoint({
    attemptId: "old-pass",
    completedAt: "2026-06-01T10:00:00.000Z",
    responseStatus: "correct",
    passed: true
  });
  const latestFail = makeCheckpoint({
    attemptId: "latest-fail",
    completedAt: "2026-07-01T10:00:00.000Z",
    responseStatus: "incorrect",
    passed: false
  });
  const failedLatest = buildStudentReportingWorkspaceModel({
    student,
    assessmentHistory: [oldPass, latestFail]
  });
  const failedSkill = failedLatest.skillsCheck.skills[0];
  const failedItem = failedLatest.skillsCheck.items.find(row => row.concept.key === "m");

  assert.equal(failedSkill.latestAttempt.attemptId, "latest-fail");
  assert.equal(failedSkill.currentStatus.id, REPORTING_STATUS_IDS.NEEDS_TEACHING);
  assert.equal(failedSkill.latestCorrectCount, 0);
  assert.equal(failedSkill.latestTotalQuestions, 1);
  assert.equal(failedSkill.latestAccuracy, 0);
  assert.equal(failedSkill.latestPassed, false);
  assert.equal(failedSkill.lifetimeAccuracy, 50);
  assert.equal(failedSkill.history.length, 2);
  assert.equal(failedItem.statusCandidate, REPORTING_STATUS_IDS.NEEDS_TEACHING);
  assert.equal(failedItem.provenance.currentAttemptId, "latest-fail");
  assert.equal(failedLatest.wholeChild.concepts.find(row => row.key === "m").status.id, REPORTING_STATUS_IDS.NEEDS_TEACHING);

  const latestPass = makeCheckpoint({
    attemptId: "latest-pass",
    completedAt: "2026-08-01T10:00:00.000Z",
    responseStatus: "correct",
    passed: true
  });
  const passedLatest = buildStudentReportingWorkspaceModel({
    student,
    assessmentHistory: [latestFail, latestPass]
  });
  assert.equal(passedLatest.skillsCheck.skills[0].currentStatus.id, REPORTING_STATUS_IDS.SECURE);
  assert.equal(passedLatest.skillsCheck.items[0].statusCandidate, REPORTING_STATUS_IDS.SECURE);
  assert.equal(passedLatest.wholeChild.concepts.find(row => row.key === "m").status.id, REPORTING_STATUS_IDS.SECURE);
});

test("Whole Child exposes checked EL 3 to 6 summaries without adding mastery concepts", () => {
  const pa = attempt({
    attemptId: "pa-descriptive-summary",
    assessmentType: "el_phonological_awareness",
    skillId: "el_phonological_awareness",
    skillName: "Phonological Awareness",
    gradePath: "1",
    benchmarkWindow: "BOY",
    formVersion: "A",
    contentVersion: "pa-v1",
    questionRecords: [{
      questionId: "pa-summary-item",
      itemType: "phonological_awareness",
      itemKey: "rhyme_recognition",
      responseStatus: "correct",
      isCorrect: true,
      metadata: { strand: "rhyme", task: "recognition" }
    }]
  });
  const model = buildStudentReportingWorkspaceModel({ student, assessmentHistory: [pa] });

  assert.equal(model.wholeChild.descriptiveAssessments.length, 1);
  assert.equal(model.wholeChild.descriptiveAssessments[0].assessmentId, "el_phonological_awareness");
  assert.equal(model.wholeChild.descriptiveAssessments[0].title, "Phonological and Phonemic Awareness");
  assert.equal(model.wholeChild.descriptiveAssessments[0].benchmarkWindow, "BOY");
  assert.equal(model.wholeChild.descriptiveAssessments[0].formVersion, "A");
  assert.equal(model.wholeChild.summary.descriptiveAssessmentsChecked, 1);
  assert.equal(model.wholeChild.summary.descriptiveAssessmentsTotal, 4);
  assert.equal(model.wholeChild.summary.concepts, 0);
  assert.equal(model.wholeChild.overallStatus.id, REPORTING_STATUS_IDS.NOT_CHECKED);
});

test("unknown prepared Guided Reading marks are not treated as correct", () => {
  const model = buildGuidedReadingReportModel({
    student,
    guidedReadingRows: [{ bookId: "book-1", title: "A Book", readCount: 1 }],
    guidedReadingWordRows: [{
      bookId: "book-1",
      title: "A Book",
      page: 1,
      word: "cat",
      status: "Teacher has not marked this"
    }]
  });

  assert.equal(model.wordRows.length, 0);
  assert.equal(model.knowledgeEvidence.length, 0);
  assert.equal(model.summary.wordsReadCorrectlyInText, 0);
});

test("Guided Reading keeps note dates and resolves each word to the latest mark with support winning ties", () => {
  const model = buildGuidedReadingReportModel({
    student,
    guidedReadingRecords: {
      older: {
        bookId: "older",
        title: "Older Book",
        lastReadAt: "2026-07-01T10:00:00.000Z",
        wholeBookNote: "Whole-book note",
        wholeBookNoteUpdatedAt: "2026-07-03T10:00:00.000Z",
        pages: {
          0: {
            wordTexts: ["cat"],
            wordMarks: { 0: "correct" },
            note: "Older page note",
            updatedAt: "2026-07-02T10:00:00.000Z"
          }
        }
      },
      newer: {
        bookId: "newer",
        title: "Newer Book",
        lastReadAt: "2026-07-04T10:00:00.000Z",
        pages: {
          0: {
            wordTexts: ["cat"],
            wordMarks: { 0: "support" },
            note: "Newest page note",
            updatedAt: "2026-07-04T10:00:00.000Z"
          }
        }
      },
      tied: {
        bookId: "tied",
        title: "Tie Book",
        lastReadAt: "2026-07-05T10:00:00.000Z",
        pages: {
          0: {
            wordTexts: ["dog", "dog"],
            wordMarks: { 0: "correct", 1: "support" },
            updatedAt: "2026-07-05T10:00:00.000Z"
          }
        }
      }
    }
  });

  assert.equal(model.wordRows.find(row => row.word === "cat").statusLabel, "Needs support in this book");
  assert.equal(model.wordRows.find(row => row.word === "dog").statusLabel, "Needs support in this book");
  assert.deepEqual(model.notes.map(row => row.note), [
    "Newest page note",
    "Whole-book note",
    "Older page note"
  ]);
  assert.deepEqual(model.notes.map(row => row.date), [
    "2026-07-04T10:00:00.000Z",
    "2026-07-03T10:00:00.000Z",
    "2026-07-02T10:00:00.000Z"
  ]);
});

test("Guided Reading never invents a note date from the book reading date", () => {
  const model = buildGuidedReadingReportModel({
    student,
    guidedReadingRecords: {
      "undated-note": {
        bookId: "undated-note",
        title: "The Pond",
        lastReadAt: "2026-02-01T10:00:00.000Z",
        wholeBookNote: "Needs confidence."
      }
    }
  });

  assert.equal(model.notes.length, 1);
  assert.equal(model.notes[0].note, "Needs confidence.");
  assert.equal(model.notes[0].date, "");
});

test("Whole Child priorities are deterministic and ordered by need, evidence strength and recency", () => {
  const evidenceFor = ({ id, key, status, kind, observedAt }) => createReportingEvidence({
    evidenceId: id,
    studentId: student.id,
    sourceArea: id,
    sourceLabel: id,
    sourceRecordId: id,
    sourceRecordType: "check",
    evidenceKind: kind,
    concept: { domain: "phonics", construct: "grapheme_sound", key, label: `Sound for ${key}` },
    statusCandidate: status,
    observedAt
  });
  const model = buildWholeChildKnowledgeModel({
    student,
    evidence: [
      evidenceFor({
        id: "needs-practice",
        key: "ai",
        status: REPORTING_STATUS_IDS.NEEDS_TEACHING,
        kind: REPORTING_EVIDENCE_KINDS.PRACTICE,
        observedAt: "2026-07-05T00:00:00.000Z"
      }),
      evidenceFor({
        id: "needs-direct",
        key: "ee",
        status: REPORTING_STATUS_IDS.NEEDS_TEACHING,
        kind: REPORTING_EVIDENCE_KINDS.FORMAL,
        observedAt: "2026-07-04T00:00:00.000Z"
      }),
      evidenceFor({
        id: "mixed-secure",
        key: "sh",
        status: REPORTING_STATUS_IDS.SECURE,
        kind: REPORTING_EVIDENCE_KINDS.FORMAL,
        observedAt: "2026-07-03T00:00:00.000Z"
      }),
      evidenceFor({
        id: "mixed-needs",
        key: "sh",
        status: REPORTING_STATUS_IDS.NEEDS_TEACHING,
        kind: REPORTING_EVIDENCE_KINDS.TEACHER_OBSERVATION,
        observedAt: "2026-07-04T00:00:00.000Z"
      }),
      evidenceFor({
        id: "developing-direct",
        key: "oa",
        status: REPORTING_STATUS_IDS.DEVELOPING,
        kind: REPORTING_EVIDENCE_KINDS.FORMAL,
        observedAt: "2026-07-06T00:00:00.000Z"
      })
    ]
  });

  assert.deepEqual(model.nextSteps.map(row => row.label), [
    "Sound for ee",
    "Sound for ai",
    "Sound for sh",
    "Sound for oa"
  ]);
  assert.deepEqual(model.nextSteps.map(row => row.statusLabel), [
    "Needs teaching",
    "Needs teaching",
    "Mixed evidence",
    "Developing"
  ]);
});
