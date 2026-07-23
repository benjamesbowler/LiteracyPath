import assert from "node:assert/strict";
import test from "node:test";

import {
  buildClassElFormalAssessmentReport,
  buildIndividualElFormalAssessmentReport,
  EL_BENCHMARK_ASSESSMENT_IDS
} from "../../src/data/elFormalAssessmentReportBuilder.js";
import {
  compactAssessmentAttemptForStorage,
  normalizeAssessmentAttempt
} from "../../src/data/assessmentHistoryStore.js";
import {
  buildClassElAssessmentReportData,
  buildStudentElAssessmentReportData,
  compactElAssessmentReportForStorage,
  compareElAssessmentReports,
  EL_REPORT_SCHEMA_VERSION
} from "../../src/data/elAssessmentReportStore.js";
import {
  buildClassElAssessmentExportReport,
  buildStudentElAssessmentExportReport,
  createClassElAssessmentWorkbook,
  createStudentElAssessmentWorkbook,
  EL_CLASS_BENCHMARK_SHEETS,
  EL_STUDENT_BENCHMARK_SHEETS
} from "../../src/utils/exportElAssessmentExcel.js";
import {
  buildElBenchmarkAttempt,
  EL_BENCHMARK_IDS,
  getElBenchmarkPlan
} from "../../src/data/elBenchmarkAssessments.js";

const student = { id: "student-1", name: "Ada", classId: "class-1" };
const classmate = { id: "student-2", name: "Leo", classId: "class-1" };
const common = {
  studentId: "student-1",
  studentName: "Ada",
  classId: "class-1",
  teacherId: "teacher-1",
  gradePath: "1",
  benchmarkWindow: "MOY",
  formVersion: "form-a-v2",
  contentVersion: "content-a-v1",
  scoringVersion: "scoring-a-v1",
  scoringRuleVersion: "scoring-rule-a-v1",
  framework: "LiteracyPath provisional",
  startedAt: "2026-07-21T01:00:00.000Z",
  completedAt: "2026-07-21T01:10:00.000Z"
};

const assessmentHistory = [
  {
    ...common,
    attemptId: "pa-ada",
    assessmentType: EL_BENCHMARK_ASSESSMENT_IDS.PHONOLOGICAL_AWARENESS,
    skillId: EL_BENCHMARK_ASSESSMENT_IDS.PHONOLOGICAL_AWARENESS,
    skillName: "EL Phonological & Phonemic Awareness",
    administrationStatus: "completed",
    candidatePlacement: {
      status: "not_available",
      candidateMicrophase: null,
      label: "Placement not available",
      reason: "Phonological awareness is reported descriptively and does not produce a placement."
    },
    questionRecords: [
      {
        questionId: "pa-rhyme-1",
        itemKey: "rhyme-recognition",
        itemType: "phonological_awareness",
        responseStatus: "correct",
        responseText: "yes",
        isCorrect: true,
        metadata: { strand: "rhyme", task: "recognition" }
      },
      {
        questionId: "pa-blend-1",
        itemKey: "phoneme-blending",
        itemType: "phonological_awareness",
        responseStatus: "incorrect",
        responseText: "mapt",
        isCorrect: false,
        errorType: "blending",
        metadata: { strand: "phoneme_blending", task: "three_phoneme" }
      },
      {
        questionId: "pa-segment-1",
        itemKey: "phoneme-segmentation",
        itemType: "phonological_awareness",
        responseStatus: "not_scorable",
        responseText: "",
        notScorableReason: "student_unwell",
        notScorableNote: "Stopped after the student reported a headache.",
        metadata: { strand: "phoneme_segmentation", task: "three_phoneme" }
      }
    ]
  },
  {
    ...common,
    attemptId: "encoding-ada",
    assessmentType: EL_BENCHMARK_ASSESSMENT_IDS.ENCODING,
    skillId: EL_BENCHMARK_ASSESSMENT_IDS.ENCODING,
    skillName: "EL Encoding",
    administrationStatus: "partial",
    candidatePlacement: {
      status: "not_available",
      candidateMicrophase: null,
      reason: "Encoding evidence informs the decoding start review but is not itself a placement."
    },
    questionRecords: [
      {
        questionId: "enc-ship",
        itemKey: "ship",
        itemType: "encoding_feature",
        targetWord: "ship",
        responseStatus: "correct",
        responseText: "ship",
        isCorrect: true,
        scoringCode: "exact",
        features: { plausible: false, featureTags: ["digraph", "short_i"] }
      },
      {
        questionId: "enc-rain",
        itemKey: "rain",
        itemType: "encoding_feature",
        targetWord: "rain",
        responseStatus: "incorrect",
        responseText: "rane",
        isCorrect: false,
        scoringCode: "plausible",
        errorType: "vowel_pattern",
        features: { plausible: true, featureTags: ["vowel_team"] }
      },
      {
        questionId: "enc-farm",
        itemKey: "farm",
        itemType: "encoding_feature",
        targetWord: "farm",
        responseStatus: "incorrect",
        responseText: "fam",
        isCorrect: false,
        scoringCode: "not_yet",
        errorType: "omission"
      },
      {
        questionId: "enc-turn",
        itemKey: "turn",
        itemType: "encoding_feature",
        targetWord: "turn",
        responseStatus: "not_administered"
      }
    ]
  },
  {
    ...common,
    attemptId: "decoding-ada",
    assessmentType: EL_BENCHMARK_ASSESSMENT_IDS.DECODING,
    skillId: EL_BENCHMARK_ASSESSMENT_IDS.DECODING,
    // Deliberately misleading: the explicit benchmark id must win and this
    // record must never leak into the legacy Advanced Phonics inference.
    skillName: "Advanced Phonics Patterns",
    administrationStatus: "discontinued",
    discontinued: true,
    discontinueReason: "automatic_count_stop_rule",
    stopCycle: "microphase-4",
    candidatePlacement: { microphase: 4, confidence: "provisional" },
    confirmedPlacement: { microphase: 3, source: "teacher" },
    placementSource: "teacher_confirmation",
    routeSource: "teacher_selected",
    sourceAttemptId: "encoding-ada",
    prerequisiteReview: {
      state: "override",
      code: "teacher_changed_confirmed_encoding_start",
      evidenceAttemptId: "encoding-ada",
      teacherConfirmed: true,
      overrideReason: "Additional classroom evidence supports this starting band."
    },
    recommendations: ["Confirm the route with Letter Identification evidence."],
    observations: ["Teacher route override retained for review."],
    validationIssues: ["route_confirmation_required"],
    questionRecords: [
      {
        questionId: "dec-rain",
        itemKey: "rain",
        itemType: "decoding_pattern",
        targetPattern: "ai",
        targetWord: "rain",
        responseStatus: "correct",
        responseText: "rain",
        isCorrect: true,
        automaticity: "automatic",
        metadata: { bandId: "microphase-4", microphase: 4, evaluation: "automatic_accurate" }
      },
      {
        questionId: "dec-boat",
        itemKey: "boat",
        itemType: "decoding_pattern",
        targetPattern: "oa",
        targetWord: "boat",
        responseStatus: "correct",
        responseText: "boat",
        isCorrect: true,
        automaticity: true,
        selfCorrected: true,
        metadata: { bandId: "microphase-4", microphase: 4, evaluation: "accurate_after_sounding" }
      },
      {
        questionId: "dec-seed",
        itemKey: "seed",
        itemType: "decoding_pattern",
        targetWord: "seed",
        responseStatus: "incorrect",
        responseText: "said",
        isCorrect: false,
        automaticity: false,
        errorType: "vowel_pattern",
        metadata: { bandId: "microphase-4", microphase: 4, evaluation: "incorrect" }
      },
      {
        questionId: "dec-home",
        itemKey: "home",
        itemType: "decoding_pattern",
        targetWord: "home",
        responseStatus: "not_administered",
        metadata: { bandId: "microphase-4", microphase: 4 }
      }
    ]
  },
  {
    ...common,
    attemptId: "fluency-ada",
    assessmentType: EL_BENCHMARK_ASSESSMENT_IDS.ORAL_READING_FLUENCY,
    skillId: EL_BENCHMARK_ASSESSMENT_IDS.ORAL_READING_FLUENCY,
    skillName: "EL Oral Reading Fluency",
    administrationStatus: "completed",
    candidatePlacement: {
      status: "descriptive",
      candidateMicrophase: null,
      reason: "Fluency is reported as passage evidence without a placement label."
    },
    metrics: {
      passageId: "orf-1-moy-a-v1",
      passageTitle: "Rain for the Garden",
      elapsedSeconds: 60,
      wordsAttempted: 45,
      errors: 3,
      selfCorrections: 2,
      wcpm: 42,
      accuracyRate: 93,
      prosody: { expression: 3, phrasing: 2, smoothness: 3, pace: 3 },
      prosodyAverage: 2.75
    },
    questionRecords: [{
      questionId: "orf-1-moy-a-v1",
      itemKey: "orf-1-moy-a-v1",
      itemType: "fluency_passage",
      responseStatus: "recorded",
      metadata: { passageTitle: "Rain for the Garden" }
    }]
  },
  {
    ...common,
    attemptId: "advanced-legacy",
    assessmentType: "advanced_phonics_patterns",
    skillId: "advanced_phonics_patterns",
    skillName: "Advanced Phonics Patterns",
    questionRecords: [{
      questionId: "advanced-ai",
      itemKey: "ai",
      itemType: "phonics_pattern",
      targetPattern: "ai",
      targetWord: "rain",
      responseStatus: "correct",
      isCorrect: true
    }]
  },
  {
    ...common,
    attemptId: "pa-leo",
    studentId: "student-2",
    studentName: "Leo",
    assessmentType: EL_BENCHMARK_ASSESSMENT_IDS.PHONOLOGICAL_AWARENESS,
    skillId: EL_BENCHMARK_ASSESSMENT_IDS.PHONOLOGICAL_AWARENESS,
    skillName: "EL Phonological & Phonemic Awareness",
    administrationStatus: "completed",
    questionRecords: [{
      questionId: "pa-leo-rhyme",
      itemKey: "rhyme-recognition",
      itemType: "phonological_awareness",
      responseStatus: "correct",
      responseText: "yes",
      isCorrect: true,
      metadata: { strand: "rhyme", task: "recognition" }
    }]
  }
];

function worksheetRows(sheet) {
  const headers = sheet.getRow(1).values.slice(1).map(String);
  const rows = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    rows.push(Object.fromEntries(headers.map((header, index) => [header, row.getCell(index + 1).value])));
  }
  return rows;
}

function workbookText(workbook, sheetNames) {
  return sheetNames.flatMap(name => {
    const sheet = workbook.getWorksheet(name);
    return sheet ? worksheetRows(sheet).flatMap(row => Object.values(row)) : [];
  }).map(String).join("\n");
}

async function serializeAndReload(workbook) {
  const module = await import("exceljs");
  const ExcelJS = module.default || module["module.exports"] || module;
  const buffer = await workbook.xlsx.writeBuffer();
  const reloaded = new ExcelJS.Workbook();
  await reloaded.xlsx.load(buffer);
  return reloaded;
}

test("individual benchmark reporting preserves domain-specific evidence without mastery labels", () => {
  const report = buildIndividualElFormalAssessmentReport({ student, assessmentHistory });
  assert.equal(report.individualBenchmarkProfile.length, 4);
  assert.equal(report.individualBenchmarkDetails.length, 4);

  const pa = report.individualBenchmarkDetails.find(row => row.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.PHONOLOGICAL_AWARENESS);
  assert.equal(pa.accuracyRate, 50);
  assert.equal(pa.strandRows.find(row => row.strand === "rhyme").items[0].exactResponse, "yes");
  assert.equal(pa.strandRows.find(row => row.strand === "phoneme_segmentation").notScorableCount, 1);
  const notScorablePaItem = pa.strandRows
    .find(row => row.strand === "phoneme_segmentation")
    .items.find(item => item.questionId === "pa-segment-1");
  assert.equal(notScorablePaItem.notScorableReason, "student_unwell");
  assert.equal(notScorablePaItem.notScorableNote, "Stopped after the student reported a headache.");
  assert.equal(
    report.individualBenchmarkProfile.find(row => row.domainKey === "phonologicalAwareness").interpretation,
    "Phonological awareness is reported descriptively and does not produce a placement."
  );

  const encoding = report.individualBenchmarkDetails.find(row => row.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.ENCODING);
  assert.equal(encoding.administrationStatus, "partial");
  assert.equal(encoding.exactSpellingCount, 1);
  assert.equal(encoding.plausibleSpellingCount, 1);
  assert.equal(encoding.notYetCount, 1);
  assert.equal(encoding.exactSpellingRate, 33);
  assert.equal(encoding.phonologicallyRepresentedRate, 67);
  assert.equal(encoding.itemDetails.find(row => row.targetSpelling === "rain").studentSpelling, "rane");

  const decoding = report.individualBenchmarkDetails.find(row => row.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.DECODING);
  assert.equal(decoding.administrationStatus, "discontinued");
  assert.equal(decoding.accurateCount, 2);
  assert.equal(decoding.automaticCount, 1);
  assert.equal(decoding.accuracyRate, 67);
  assert.equal(decoding.automaticityRate, 33);
  assert.equal(decoding.stopEvidence.triggered, true);
  assert.equal(decoding.stopEvidence.reason, "automatic_count_stop_rule");
  assert.deepEqual(decoding.candidatePlacement, { microphase: 4, confidence: "provisional" });
  assert.deepEqual(decoding.confirmedPlacement, { microphase: 3, source: "teacher" });
  assert.equal(decoding.routeSource, "teacher_selected");
  assert.equal(decoding.sourceAttemptId, "encoding-ada");
  assert.equal(decoding.prerequisiteReview.code, "teacher_changed_confirmed_encoding_start");
  assert.equal(decoding.prerequisiteReview.teacherConfirmed, true);

  const fluency = report.individualBenchmarkDetails.find(row => row.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.ORAL_READING_FLUENCY);
  assert.equal(fluency.wcpm, 42);
  assert.equal(fluency.accuracyRate, 93);
  assert.equal(fluency.prosodyAverage, 2.75);
  assert.deepEqual(fluency.prosody, { expression: 3, phrasing: 2, smoothness: 3, pace: 3 });

  const advancedAi = report.individualAdvancedPhonicsMatrix.find(row => row.pattern === "ai");
  assert.equal(advancedAi.attempts, 1, "explicit decoding id must not be swallowed by Advanced Phonics inference");
  assert.doesNotMatch(JSON.stringify({
    profile: report.individualBenchmarkProfile,
    details: report.individualBenchmarkDetails
  }), /Mastered|Developing|Needs Support/);
});

test("A1 and A2 retain provenance while unscored evidence never becomes failure", async () => {
  const provenance = {
    studentId: student.id,
    studentName: student.name,
    classId: student.classId,
    teacherId: "teacher-1",
    startedAt: "2026-07-22T01:00:00.000Z",
    completedAt: "2026-07-22T01:10:00.000Z",
    formVersion: "a12-form-v3",
    contentVersion: "a12-content-v4",
    scoringVersion: "a12-scoring-v2",
    scoringRuleVersion: "a12-rule-v5",
    administrationVersion: "a12-interface-v6",
    responseSchemaVersion: 7
  };
  const history = [
    {
      ...provenance,
      attemptId: "letter-provenance-attempt",
      assessmentType: "el_letter_assessment",
      skillId: "el_letter_assessment",
      skillName: "Letter Names and Sounds",
      questionRecords: [
        { questionId: "letter-a-name", itemKey: "a", itemType: "letter_name", targetLetter: "A", responseStatus: "correct", isCorrect: true },
        { questionId: "letter-a-sound-unrecorded", itemKey: "a", itemType: "letter_sound", targetLetter: "A" },
        { questionId: "letter-a-lower-name-na", itemKey: "a", itemType: "letter_name", targetLetter: "a", responseStatus: "not_administered", isCorrect: false },
        { questionId: "letter-a-lower-sound-ns", itemKey: "a", itemType: "letter_sound", targetLetter: "a", responseStatus: "not_scorable", isCorrect: false }
      ]
    },
    {
      ...provenance,
      attemptId: "advanced-provenance-attempt",
      assessmentType: "advanced_phonics_patterns",
      skillId: "advanced_phonics_patterns",
      skillName: "Advanced Phonics Patterns",
      questionRecords: [
        { questionId: "advanced-ai-scored", itemKey: "ai", itemType: "phonics_pattern", targetPattern: "ai", targetWord: "rain", responseStatus: "correct", isCorrect: true },
        { questionId: "advanced-sh-unrecorded", itemKey: "sh", itemType: "phonics_pattern", targetPattern: "sh", targetWord: "ship" },
        { questionId: "advanced-ch-recorded", itemKey: "ch", itemType: "phonics_pattern", targetPattern: "ch", targetWord: "chip", responseStatus: "recorded", isCorrect: false },
        { questionId: "advanced-th-not-scorable", itemKey: "th", itemType: "phonics_pattern", targetPattern: "th", targetWord: "thin", responseStatus: "not_scorable", isCorrect: false }
      ]
    }
  ];

  const individual = buildIndividualElFormalAssessmentReport({ student, assessmentHistory: history });
  const letterA = individual.individualLetterMatrix.find(row => row.letter === "a");
  assert.equal(letterA.uppercaseName.statusLabel, "Mastered");
  assert.equal(letterA.uppercaseSound.statusLabel, "Unscored evidence");
  assert.equal(letterA.uppercaseSound.attempts, 0);
  assert.equal(letterA.uppercaseSound.incorrect, 0);
  assert.equal(letterA.uppercaseSound.accuracy, null);
  assert.equal(letterA.uppercaseSound.details[0].isCorrect, null);
  assert.equal(letterA.lowercaseName.statusLabel, "Unscored evidence");
  assert.equal(letterA.lowercaseSound.statusLabel, "Unscored evidence");
  assert.equal(letterA.uppercaseSound.details[0].attemptId, "letter-provenance-attempt");
  assert.equal(letterA.uppercaseSound.details[0].formVersion, provenance.formVersion);
  assert.equal(letterA.uppercaseSound.details[0].responseSchemaVersion, 7);

  ["sh", "ch", "th"].forEach(pattern => {
    const row = individual.individualAdvancedPhonicsMatrix.find(item => item.pattern === pattern);
    assert.equal(row.statusLabel, "Unscored evidence");
    assert.equal(row.attempts, 0);
    assert.equal(row.incorrect, 0);
    assert.equal(row.accuracy, null);
    assert.equal(row.details[0].isCorrect, null);
  });

  const classFormal = buildClassElFormalAssessmentReport({
    students: [student],
    assessmentHistory: history,
    classId: student.classId
  });
  const classLetterA = classFormal.classLetterMatrix.find(row => row.letter === "a");
  assert.equal(classLetterA.uppercaseSound.unscored_evidence, 1);
  assert.equal(classLetterA.uppercaseSound.needs_support, 0);
  const classSh = classFormal.classAdvancedPhonicsMatrix.find(row => row.pattern === "sh");
  assert.equal(classSh.unscoredEvidenceStudents, 1);
  assert.equal(classSh.needsSupportStudents, 0);
  assert.equal(classSh.masteryPercentage, null);

  const studentReport = buildStudentElAssessmentExportReport({
    assessmentHistory: history,
    students: [student],
    classes: [{ id: student.classId, name: "Class One" }],
    studentId: student.id,
    classId: student.classId
  });
  const studentWorkbook = await createStudentElAssessmentWorkbook(studentReport);
  const letterRows = worksheetRows(studentWorkbook.getWorksheet("Letter Names & Sounds"));
  const exportedA = letterRows.find(row => row["Letter pair"] === "A/a");
  assert.equal(exportedA["Uppercase sound result"], "Unscored evidence");
  assert.equal(exportedA["Uppercase sound attempts"], 0);
  assert.match(exportedA["Uppercase sound evidence provenance"], /letter-provenance-attempt/);
  assert.match(exportedA["Uppercase sound evidence provenance"], /a12-form-v3/);
  assert.match(exportedA["Uppercase sound evidence provenance"], /Schema: 7/);
  assert.match(exportedA["Uppercase sound evidence provenance"], /Result: Not scored/);

  const advancedRows = worksheetRows(studentWorkbook.getWorksheet("Advanced Phonics Patterns"));
  const exportedSh = advancedRows.find(row => row.Pattern === "sh");
  assert.equal(exportedSh.Status, "Unscored evidence");
  assert.equal(exportedSh.Accuracy, "");
  assert.match(exportedSh["Evidence provenance"], /advanced-provenance-attempt/);
  assert.match(exportedSh["Evidence provenance"], /Result: Not scored/);

  const classReport = buildClassElAssessmentExportReport({
    assessmentHistory: history,
    students: [student],
    classes: [{ id: student.classId, name: "Class One" }],
    classId: student.classId
  });
  const classWorkbook = await createClassElAssessmentWorkbook(classReport);
  const classLetterRows = worksheetRows(classWorkbook.getWorksheet("Letter Sound Class Matrix"));
  const exportedClassA = classLetterRows.find(row => row["Letter pair"] === "A/a");
  assert.match(exportedClassA["UC sound counts"], /U:1/);
  assert.match(exportedClassA["UC sound evidence provenance"], /letter-provenance-attempt/);
  const classAdvancedRows = worksheetRows(classWorkbook.getWorksheet("Advanced Phonics Class Matrix"));
  const exportedClassSh = classAdvancedRows.find(row => row.Pattern === "sh");
  assert.equal(exportedClassSh["Unscored evidence students"], 1);
  assert.equal(exportedClassSh["Needs support students"], 0);
  assert.equal(exportedClassSh["Mastery percentage"], "");
  const patternDetails = worksheetRows(classWorkbook.getWorksheet("Pattern Detail"));
  const exportedShDetail = patternDetails.find(row => row["Item ID"] === "advanced-sh-unrecorded");
  assert.equal(exportedShDetail.Result, "Not scored");
  assert.equal(exportedShDetail["Response status"], "Unrecorded");
  assert.equal(exportedShDetail["Form version"], provenance.formVersion);
  assert.equal(exportedShDetail["Content version"], provenance.contentVersion);
  assert.equal(exportedShDetail["Scoring version"], provenance.scoringVersion);
  assert.equal(exportedShDetail["Scoring rule version"], provenance.scoringRuleVersion);
  assert.equal(exportedShDetail["Response schema"], 7);
});

test("quick scores stay explicitly untranscribed through persistence, reporting, and export", async () => {
  const outcomeRecordedAt = "2026-07-22T03:04:05.000Z";
  const encodingPlan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "1",
    window: "BOY"
  });
  const rawAttempt = buildElBenchmarkAttempt({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "1",
    window: "BOY",
    administrationStatus: "completed",
    administrationVersion: "2026.07.22-quick-v1",
    responseSchemaVersion: 2,
    startedAt: "2026-07-22T03:00:00.000Z",
    completedAt: "2026-07-22T03:10:00.000Z",
    responses: Object.fromEntries(encodingPlan.items.map((item, index) => [item.id, {
      status: index === 0 ? "correct" : "incorrect",
      isCorrect: index === 0,
      exact: index === 0,
      plausible: index < 2,
      evaluation: index === 0 ? "exact" : index === 1 ? "plausible" : "implausible",
      responseCaptureMode: "quick_teacher_judgment",
      outcomeRecordedAt
    }]))
  }, {
    studentId: student.id,
    studentName: student.name,
    classId: student.classId,
    teacherId: "teacher-1"
  });
  const attempt = normalizeAssessmentAttempt(
    JSON.parse(JSON.stringify(compactAssessmentAttemptForStorage(rawAttempt)))
  );

  assert.equal(attempt.administrationVersion, "2026.07.22-quick-v1");
  assert.equal(attempt.responseSchemaVersion, 2);
  assert.ok(attempt.questionRecords.every(item => item.responseText === ""));
  assert.ok(attempt.questionRecords.every(item => item.transcription === ""));
  assert.ok(attempt.questionRecords.every(item => item.responseCaptureMode === "quick_teacher_judgment"));
  assert.ok(attempt.questionRecords.every(item => item.responseDetailCaptured === false));
  assert.ok(attempt.questionRecords.every(item => item.outcomeRecordedAt === outcomeRecordedAt));

  const formal = buildIndividualElFormalAssessmentReport({
    student,
    assessmentHistory: [attempt],
    benchmarkScope: { grade: "1", benchmarkWindow: "BOY" }
  });
  const encoding = formal.individualBenchmarkDetails.find(detail => detail.domainKey === "encoding");
  const firstItem = encoding.itemDetails.find(item => item.questionId === encodingPlan.items[0].id);
  assert.equal(encoding.administrationStatus, "completed");
  assert.equal(encoding.administrationVersion, "2026.07.22-quick-v1");
  assert.equal(encoding.responseSchemaVersion, 2);
  assert.equal(encoding.exactSpellingCount, 1);
  assert.equal(firstItem.exactResponse, "", "the report must not replace an omitted transcription with the target word");
  assert.equal(firstItem.studentSpelling, "");
  assert.equal(firstItem.responseCaptureMode, "quick_teacher_judgment");
  assert.equal(firstItem.responseDetailCaptured, false);
  assert.equal(firstItem.outcomeRecordedAt, outcomeRecordedAt);

  const report = buildStudentElAssessmentReportData({
    assessmentHistory: [attempt],
    students: [student],
    classes: [{ id: student.classId, name: "Class One" }],
    studentId: student.id,
    classId: student.classId,
    teacherId: "teacher-1",
    benchmarkScope: { grade: "1", benchmarkWindow: "BOY" }
  });
  const workbook = await createStudentElAssessmentWorkbook(report);
  const rows = worksheetRows(workbook.getWorksheet("Encoding Detail"));
  const exportedItem = rows.find(row => row["Item ID"] === encodingPlan.items[0].id);
  assert.ok(exportedItem);
  assert.equal(exportedItem["Student spelling"], "");
  assert.equal(exportedItem["Response capture"], "Quick score - not transcribed");
  assert.equal(exportedItem["Administration interface"], "2026.07.22-quick-v1");
  assert.equal(exportedItem["Response schema"], 2);

  const classReport = buildClassElAssessmentReportData({
    assessmentHistory: [attempt],
    students: [student],
    classes: [{ id: student.classId, name: "Class One" }],
    classId: student.classId,
    teacherId: "teacher-1",
    benchmarkScope: { grade: "1", benchmarkWindow: "BOY" }
  });
  const classWorkbook = await createClassElAssessmentWorkbook(classReport);
  const classRows = worksheetRows(classWorkbook.getWorksheet("Benchmark Evidence Detail"));
  const classItem = classRows.find(row => row["Item ID"] === encodingPlan.items[0].id);
  assert.ok(classItem);
  assert.equal(classItem["Student response"], "");
  assert.equal(classItem["Response capture"], "Quick score - not transcribed");
  assert.equal(classItem["Administration interface"], "2026.07.22-quick-v1");
  assert.equal(classItem["Response schema"], 2);
});

test("class benchmark matrix and domain summaries remain descriptive", () => {
  const report = buildClassElFormalAssessmentReport({
    students: [student, classmate],
    assessmentHistory,
    classId: "class-1"
  });

  assert.equal(report.classBenchmarkMatrix.length, 2);
  const ada = report.classBenchmarkMatrix.find(row => row.studentId === "student-1");
  assert.equal(ada.encoding.administrationStatus, "partial");
  assert.equal(ada.decoding.metrics.automaticityRate, 33);
  assert.equal(ada.oralReadingFluency.metrics.wcpm, 42);

  const pa = report.classBenchmarkDomainSummaries.find(row => row.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.PHONOLOGICAL_AWARENESS);
  const encoding = report.classBenchmarkDomainSummaries.find(row => row.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.ENCODING);
  const decoding = report.classBenchmarkDomainSummaries.find(row => row.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.DECODING);
  const fluency = report.classBenchmarkDomainSummaries.find(row => row.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.ORAL_READING_FLUENCY);
  assert.equal(pa.candidatePlacements.length, 0, "descriptive PA evidence must never become a placement");
  assert.equal(encoding.candidatePlacements.length, 0);
  assert.equal(fluency.candidatePlacements.length, 0);
  assert.equal(decoding.candidatePlacements.length, 1);
  assert.equal(pa.studentsWithSavedEvidence, 2);
  assert.equal(pa.metrics.strandSummaries.find(row => row.strand === "rhyme").studentsObserved, 2);
  assert.equal(encoding.administrationCounts.partial, 1);
  assert.equal(encoding.metrics.averageExactSpellingRate, 33);
  assert.equal(decoding.metrics.averageAccuracyRate, 67);
  assert.deepEqual(decoding.metrics.stoppedOrDiscontinuedStudents, ["Ada"]);
  assert.equal(fluency.metrics.averageWcpm, 42);
  assert.equal(fluency.studentsWithoutSavedEvidence, 1);
  assert.doesNotMatch(JSON.stringify(report.classBenchmarkDomainSummaries), /Mastered|Developing|Needs Support/);
});

test("unscored benchmark attempts stay null and export as Not scored", async () => {
  const route = {
    ...common,
    benchmarkWindow: "EOY",
    administrationStatus: "not_scorable"
  };
  const unscoredHistory = [
    {
      ...route,
      attemptId: "pa-unscored",
      assessmentType: EL_BENCHMARK_ASSESSMENT_IDS.PHONOLOGICAL_AWARENESS,
      skillName: "EL Phonological & Phonemic Awareness",
      candidatePlacement: {
        status: "not_available",
        candidateMicrophase: null,
        reason: "This domain supplies descriptive evidence only."
      },
      questionRecords: [{
        questionId: "pa-unscored-item",
        responseStatus: "not_scorable",
        notScorableReason: "response_unreliable",
        validationIssues: ["teacher_judgment_required"],
        metadata: { strand: "rhyme" }
      }]
    },
    {
      ...route,
      attemptId: "encoding-not-administered",
      assessmentType: EL_BENCHMARK_ASSESSMENT_IDS.ENCODING,
      skillName: "EL Encoding",
      administrationStatus: "not_administered",
      questionRecords: [{
        questionId: "encoding-unscored-item",
        targetWord: "ship",
        responseStatus: "not_administered"
      }]
    },
    {
      ...route,
      attemptId: "fluency-unscored",
      assessmentType: EL_BENCHMARK_ASSESSMENT_IDS.ORAL_READING_FLUENCY,
      skillName: "EL Oral Reading Fluency",
      questionRecords: [{
        questionId: "fluency-unscored-item",
        responseStatus: "not_scorable",
        metadata: { passageTitle: "No Valid Timing" }
      }]
    }
  ];
  const formal = buildIndividualElFormalAssessmentReport({
    student,
    assessmentHistory: unscoredHistory,
    benchmarkScope: { grade: "1", benchmarkWindow: "EOY" }
  });
  const paProfile = formal.individualBenchmarkProfile.find(row => row.domainKey === "phonologicalAwareness");
  const paDetail = formal.individualBenchmarkDetails.find(row => row.domainKey === "phonologicalAwareness");
  const fluencyDetail = formal.individualBenchmarkDetails.find(row => row.domainKey === "oralReadingFluency");
  assert.equal(paProfile.metrics.accuracyRate, null);
  assert.equal(paProfile.metrics.strandsObserved, 0);
  assert.equal(paDetail.itemDetails[0].validationIssues[0], "teacher_judgment_required");
  assert.equal(fluencyDetail.passageRows[0].errors, null);
  assert.equal(fluencyDetail.passageRows[0].selfCorrections, null);
  assert.equal(fluencyDetail.errors, null);
  assert.equal(fluencyDetail.selfCorrections, null);

  const report = buildStudentElAssessmentReportData({
    assessmentHistory: unscoredHistory,
    students: [student],
    classes: [{ id: "class-1", name: "Class One" }],
    studentId: student.id,
    classId: "class-1",
    teacherId: "teacher-1",
    benchmarkScope: { grade: "1", benchmarkWindow: "EOY" }
  });
  assert.equal(report.skillRows.find(row => row.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.PHONOLOGICAL_AWARENESS).accuracy, null);
  assert.equal(report.skillRows.find(row => row.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.ENCODING).accuracy, null);
  assert.equal(report.attemptRows.find(row => row.attemptId === "pa-unscored").accuracy, null);
  assert.equal(report.progressRows.find(row => row.skill === "EL Encoding").accuracy, null);

  const workbook = await createStudentElAssessmentWorkbook(report);
  const profile = worksheetRows(workbook.getWorksheet("Benchmark Profile"));
  const exportedPa = profile.find(row => row.Domain === "Phonological and Phonemic Awareness");
  const exportedEncoding = profile.find(row => row["Assessment ID"] === EL_BENCHMARK_ASSESSMENT_IDS.ENCODING);
  const exportedFluency = profile.find(row => row["Assessment ID"] === EL_BENCHMARK_ASSESSMENT_IDS.ORAL_READING_FLUENCY);
  assert.equal(exportedPa["PA accuracy"], "");
  assert.equal(exportedEncoding["Encoding exact spelling"], "");
  assert.equal(exportedFluency["Fluency WCPM"], "");
  assert.equal(exportedPa["Candidate placement"], "");
  assert.equal(exportedPa.Interpretation, "This domain supplies descriptive evidence only.");
});

test("partial PA counts only strands with scored evidence", () => {
  const history = [{
    ...common,
    attemptId: "pa-partial-strands",
    assessmentType: EL_BENCHMARK_ASSESSMENT_IDS.PHONOLOGICAL_AWARENESS,
    administrationStatus: "partial",
    questionRecords: [
      {
        questionId: "pa-rhyme-scored",
        responseStatus: "correct",
        responseText: "mop",
        isCorrect: true,
        metadata: { strand: "rhyme" }
      },
      {
        questionId: "pa-segmentation-unscored",
        responseStatus: "not_scorable",
        metadata: { strand: "phoneme_segmentation" }
      }
    ]
  }];
  const report = buildIndividualElFormalAssessmentReport({ student, assessmentHistory: history });
  const profile = report.individualBenchmarkProfile.find(row => row.domainKey === "phonologicalAwareness");
  assert.equal(profile.metrics.accuracyRate, 100);
  assert.equal(profile.metrics.strandsObserved, 1);
});

test("class benchmark averages ignore nulls and count exact-minute zero WCPM as scored evidence", async () => {
  const zeroFluency = {
    ...common,
    attemptId: "fluency-zero",
    assessmentType: EL_BENCHMARK_ASSESSMENT_IDS.ORAL_READING_FLUENCY,
    skillName: "EL Oral Reading Fluency",
    administrationStatus: "completed",
    questionRecords: [{
      questionId: "zero-passage",
      responseStatus: "recorded",
      responseText: "",
      metadata: {
        passageTitle: "Zero Word Passage",
        wordsAttempted: 0,
        correctWords: 0,
        errors: 0,
        selfCorrections: 0,
        elapsedSeconds: 60,
        wcpm: 0,
        accuracy: 0,
        passageAccurate: false
      }
    }]
  };
  const nullPa = {
    ...common,
    attemptId: "pa-null-ada",
    assessmentType: EL_BENCHMARK_ASSESSMENT_IDS.PHONOLOGICAL_AWARENESS,
    skillName: "EL Phonological & Phonemic Awareness",
    administrationStatus: "not_scorable",
    questionRecords: [{ questionId: "pa-null", responseStatus: "not_scorable", metadata: { strand: "rhyme" } }]
  };
  const scoredPa = {
    ...common,
    attemptId: "pa-scored-leo",
    studentId: classmate.id,
    studentName: classmate.name,
    assessmentType: EL_BENCHMARK_ASSESSMENT_IDS.PHONOLOGICAL_AWARENESS,
    skillName: "EL Phonological & Phonemic Awareness",
    administrationStatus: "completed",
    questionRecords: [{
      questionId: "pa-scored",
      responseStatus: "correct",
      responseText: "mop",
      isCorrect: true,
      metadata: { strand: "rhyme" }
    }]
  };
  const report = buildClassElAssessmentReportData({
    assessmentHistory: [zeroFluency, nullPa, scoredPa],
    students: [student, classmate],
    classes: [{ id: "class-1", name: "Class One" }],
    classId: "class-1",
    teacherId: "teacher-1",
    benchmarkScope: { grade: "1", benchmarkWindow: "MOY" }
  });
  const paSkill = report.skillRows.find(row => row.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.PHONOLOGICAL_AWARENESS);
  const fluencySummary = report.benchmarkDomainSummaries.find(row => row.domainKey === "oralReadingFluency");
  assert.equal(paSkill.classAverageAccuracy, 100, "null PA evidence must not be averaged as zero");
  assert.equal(fluencySummary.studentsWithScoredEvidence, 1);
  assert.equal(fluencySummary.metrics.averageWcpm, 0);
  assert.equal(fluencySummary.metrics.averageAccuracyRate, 0);
  const fluencyDetail = report.benchmarkDetails.find(row => row.attemptId === "fluency-zero");
  assert.equal(fluencyDetail.errors, 0, "explicit zero errors must be preserved");
  assert.equal(fluencyDetail.selfCorrections, 0, "explicit zero self-corrections must be preserved");

  const workbook = await createClassElAssessmentWorkbook(report);
  const domainRows = worksheetRows(workbook.getWorksheet("Benchmark Domain Summary"));
  const unscoredEncoding = domainRows.find(row => row["Assessment ID"] === EL_BENCHMARK_ASSESSMENT_IDS.ENCODING);
  assert.equal(unscoredEncoding["Encoding average exact spelling"], "");
});

test("generic report comparisons exclude provisional benchmark changes", () => {
  const previous = {
    reportId: "previous",
    generatedAt: "2026-07-20T00:00:00.000Z",
    summary: { averageAccuracy: 60, masteredSkillCount: 0, focusSkills: ["Initial Sounds"] },
    skillRows: [
      { skillName: "Initial Sounds", accuracy: 50, masteryStatus: "Needs Support" },
      { skillName: "EL Decoding", accuracy: 20, isProvisionalBenchmark: true, masteryStatus: "Evidence Recorded" }
    ]
  };
  const current = {
    summary: { averageAccuracy: 70, masteredSkillCount: 0, focusSkills: ["Initial Sounds"] },
    skillRows: [
      { skillName: "Initial Sounds", accuracy: 70, masteryStatus: "Developing" },
      { skillName: "EL Decoding", accuracy: 90, isProvisionalBenchmark: true, masteryStatus: "Evidence Recorded" },
      { skillName: "EL Encoding", accuracy: 10, isProvisionalBenchmark: true, masteryStatus: "Partial Evidence" }
    ]
  };
  const comparison = compareElAssessmentReports(current, previous);
  assert.deepEqual(comparison.improvedSkills, ["Initial Sounds"]);
  assert.deepEqual(comparison.declinedSkills, []);
  assert.equal(comparison.improvedSkills.includes("EL Decoding"), false);
});

test("benchmark reporting resolves one grade/window route instead of taking latest domains across mixed forms", () => {
  const eoyEncoding = {
    ...common,
    attemptId: "encoding-ada-eoy",
    benchmarkWindow: "EOY",
    completedAt: "2026-07-21T03:00:00.000Z",
    assessmentType: EL_BENCHMARK_ASSESSMENT_IDS.ENCODING,
    skillId: EL_BENCHMARK_ASSESSMENT_IDS.ENCODING,
    skillName: "EL Encoding",
    administrationStatus: "completed",
    questionRecords: [{
      questionId: "enc-eoy-ship",
      itemKey: "ship",
      itemType: "encoding_feature",
      targetWord: "ship",
      responseStatus: "incorrect",
      responseText: "sip",
      isCorrect: false,
      scoringCode: "not_yet"
    }]
  };
  const mixedHistory = [...assessmentHistory, eoyEncoding];

  const latestRouteReport = buildIndividualElFormalAssessmentReport({
    student,
    assessmentHistory: mixedHistory
  });
  assert.equal(latestRouteReport.benchmarkScope.source, "latest_benchmark_attempt");
  assert.equal(latestRouteReport.benchmarkScope.label, "Grade 1 · EOY");
  assert.equal(latestRouteReport.benchmarkScope.matchingAttemptCount, 1);
  assert.deepEqual(
    latestRouteReport.individualBenchmarkDetails.map(row => row.attemptId),
    ["encoding-ada-eoy"]
  );
  const latestPa = latestRouteReport.individualBenchmarkProfile.find(row => (
    row.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.PHONOLOGICAL_AWARENESS
  ));
  assert.equal(latestPa.hasSavedEvidence, false);
  assert.equal(latestPa.grade, "1");
  assert.equal(latestPa.benchmarkWindow, "EOY");

  const moyReport = buildIndividualElFormalAssessmentReport({
    student,
    assessmentHistory: mixedHistory,
    benchmarkGrade: "Grade 1",
    benchmarkWindow: "moy"
  });
  assert.equal(moyReport.benchmarkScope.source, "explicit");
  assert.equal(moyReport.benchmarkScope.label, "Grade 1 · MOY");
  assert.equal(moyReport.individualBenchmarkDetails.length, 4);
  assert.ok(moyReport.individualBenchmarkDetails.every(row => row.benchmarkWindow === "MOY"));
  assert.equal(
    moyReport.individualBenchmarkProfile.find(row => row.domainKey === "encoding").latestAttemptId,
    "encoding-ada"
  );

  const unscopedLegacyAttempt = {
    ...eoyEncoding,
    attemptId: "encoding-legacy-unscoped",
    gradePath: "",
    grade: "",
    benchmarkWindow: "MOY",
    completedAt: "2026-07-21T04:00:00.000Z"
  };
  const legacyRouteReport = buildIndividualElFormalAssessmentReport({
    student,
    assessmentHistory: [...assessmentHistory, unscopedLegacyAttempt]
  });
  assert.equal(legacyRouteReport.benchmarkScope.isRouteScoped, false);
  assert.equal(legacyRouteReport.benchmarkScope.matchingAttemptCount, 1);
  assert.deepEqual(
    legacyRouteReport.individualBenchmarkDetails.map(row => row.attemptId),
    ["encoding-legacy-unscoped"],
    "incomplete legacy route metadata must not absorb Grade 1 records from the same window"
  );
});

test("class report store and workbook keep mixed-window evidence out of scoped averages", async () => {
  const eoyAttempts = [
    {
      ...common,
      attemptId: "encoding-ada-eoy",
      benchmarkWindow: "EOY",
      completedAt: "2026-07-21T03:00:00.000Z",
      assessmentType: EL_BENCHMARK_ASSESSMENT_IDS.ENCODING,
      skillId: EL_BENCHMARK_ASSESSMENT_IDS.ENCODING,
      skillName: "EL Encoding",
      administrationStatus: "completed",
      questionRecords: [{
        questionId: "enc-eoy-ada",
        targetWord: "ship",
        responseStatus: "incorrect",
        responseText: "sip",
        isCorrect: false,
        scoringCode: "not_yet"
      }]
    },
    {
      ...common,
      attemptId: "encoding-leo-eoy",
      studentId: "student-2",
      studentName: "Leo",
      benchmarkWindow: "EOY",
      completedAt: "2026-07-21T03:01:00.000Z",
      assessmentType: EL_BENCHMARK_ASSESSMENT_IDS.ENCODING,
      skillId: EL_BENCHMARK_ASSESSMENT_IDS.ENCODING,
      skillName: "EL Encoding",
      administrationStatus: "completed",
      questionRecords: [{
        questionId: "enc-eoy-leo",
        targetWord: "ship",
        responseStatus: "correct",
        responseText: "ship",
        isCorrect: true,
        scoringCode: "exact"
      }]
    }
  ];
  const mixedHistory = [...assessmentHistory, ...eoyAttempts];
  const report = buildClassElAssessmentReportData({
    assessmentHistory: mixedHistory,
    students: [student, classmate],
    classes: [{ id: "class-1", name: "Class One" }],
    classId: "class-1",
    teacherId: "teacher-1",
    benchmarkScope: { grade: "1", benchmarkWindow: "EOY" }
  });

  assert.equal(report.benchmarkScope.label, "Grade 1 · EOY");
  assert.equal(report.benchmarkScope.matchingAttemptCount, 2);
  assert.deepEqual(report.benchmarkDetails.map(row => row.attemptId).sort(), [
    "encoding-ada-eoy",
    "encoding-leo-eoy"
  ]);
  assert.equal(report.sourceAttemptIds.includes("encoding-ada"), false);
  assert.equal(report.sourceAttemptIds.includes("advanced-legacy"), true, "scope must not hide non-benchmark history");
  const encodingSummary = report.benchmarkDomainSummaries.find(row => (
    row.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.ENCODING
  ));
  assert.equal(encodingSummary.grade, "1");
  assert.equal(encodingSummary.benchmarkWindow, "EOY");
  assert.equal(encodingSummary.metrics.averageExactSpellingRate, 50);
  const encodingSkill = report.skillRows.find(row => (
    row.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.ENCODING
  ));
  assert.equal(encodingSkill.classAverageAccuracy, 50);

  const workbook = await serializeAndReload(await createClassElAssessmentWorkbook(report));
  const summaryRows = worksheetRows(workbook.getWorksheet("Class Summary"));
  assert.equal(summaryRows.find(row => row.Field === "EL Benchmark Scope").Value, "Grade 1 · EOY");
  const domainRows = worksheetRows(workbook.getWorksheet("Benchmark Domain Summary"));
  const exportedEncoding = domainRows.find(row => row["Assessment ID"] === EL_BENCHMARK_ASSESSMENT_IDS.ENCODING);
  assert.equal(exportedEncoding.Grade, "1");
  assert.equal(exportedEncoding["Benchmark window"], "EOY");
});

test("saved-report comparison only uses a previous report from the same benchmark route", () => {
  const eoyEncoding = {
    ...common,
    attemptId: "encoding-ada-eoy-comparison",
    benchmarkWindow: "EOY",
    completedAt: "2026-07-21T03:00:00.000Z",
    assessmentType: EL_BENCHMARK_ASSESSMENT_IDS.ENCODING,
    skillId: EL_BENCHMARK_ASSESSMENT_IDS.ENCODING,
    skillName: "EL Encoding",
    questionRecords: [{
      questionId: "encoding-eoy-comparison",
      targetWord: "ship",
      responseStatus: "correct",
      responseText: "ship",
      isCorrect: true,
      scoringCode: "exact"
    }]
  };
  const previousReports = [
    {
      reportId: "previous-moy",
      reportType: "individual",
      classId: "class-1",
      studentId: "student-1",
      generatedAt: "2026-07-19T00:00:00.000Z",
      benchmarkScope: { grade: "1", benchmarkWindow: "MOY" },
      summary: { averageAccuracy: 10 },
      skillRows: []
    },
    {
      reportId: "previous-eoy",
      reportType: "individual",
      classId: "class-1",
      studentId: "student-1",
      generatedAt: "2026-07-18T00:00:00.000Z",
      benchmarkScope: { grade: "1", benchmarkWindow: "EOY" },
      summary: { averageAccuracy: 20 },
      skillRows: []
    }
  ];
  const report = buildStudentElAssessmentReportData({
    assessmentHistory: [...assessmentHistory, eoyEncoding],
    students: [student],
    classes: [{ id: "class-1", name: "Class One" }],
    studentId: "student-1",
    classId: "class-1",
    benchmarkScope: { grade: "1", benchmarkWindow: "EOY" },
    previousReports
  });

  assert.equal(report.comparison.previousReportId, "previous-eoy");
  assert.notEqual(report.comparison.previousReportId, "previous-moy");
});

test("saved report data exposes benchmark evidence without routing it through generic thresholds", () => {
  const studentReport = buildStudentElAssessmentReportData({
    assessmentHistory,
    students: [student, classmate],
    classes: [{ id: "class-1", name: "Class One" }],
    studentId: "student-1",
    classId: "class-1",
    teacherId: "teacher-1"
  });
  assert.equal(studentReport.schemaVersion, EL_REPORT_SCHEMA_VERSION);
  assert.equal(studentReport.benchmarkProfile.length, 4);
  assert.equal(studentReport.benchmarkDetails.length, 4);
  assert.equal(studentReport.advancedPhonics.attempts, 1);
  const decodingSkill = studentReport.skillRows.find(row => row.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.DECODING);
  assert.equal(decodingSkill.statusModel, "descriptive_benchmark_evidence");
  assert.equal(decodingSkill.masteryStatus, "Discontinued");
  assert.deepEqual(decodingSkill.itemsMastered, []);
  const decodingAttempt = studentReport.attemptRows.find(row => row.attemptId === "decoding-ada");
  assert.equal(decodingAttempt.passed, false);
  assert.equal(decodingAttempt.status, "Discontinued");

  const classReport = buildClassElAssessmentReportData({
    assessmentHistory,
    students: [student, classmate],
    classes: [{ id: "class-1", name: "Class One" }],
    classId: "class-1",
    teacherId: "teacher-1"
  });
  assert.equal(classReport.benchmarkMatrix.length, 2);
  assert.equal(classReport.benchmarkDomainSummaries.length, 4);
  const encodingSkill = classReport.skillRows.find(row => row.assessmentId === EL_BENCHMARK_ASSESSMENT_IDS.ENCODING);
  assert.equal(encodingSkill.statusModel, "descriptive_benchmark_evidence");
  assert.equal(encodingSkill.studentsWithEvidence, 1);
  assert.equal(encodingSkill.studentsMastered, 0);
  assert.equal(encodingSkill.studentsDeveloping, 0);
  assert.equal(encodingSkill.studentsNeedingSupport, 0);
  assert.equal(classReport.smallGroups.some(group => group.skill === "EL Encoding"), false);
});

test("student Excel export preserves all four benchmark domains as descriptive evidence", async () => {
  const report = buildStudentElAssessmentReportData({
    assessmentHistory,
    students: [student, classmate],
    classes: [{ id: "class-1", name: "Class One" }],
    studentId: "student-1",
    classId: "class-1",
    teacherId: "teacher-1"
  });
  const workbook = await serializeAndReload(await createStudentElAssessmentWorkbook(report));
  const sheetNames = workbook.worksheets.map(sheet => sheet.name);
  EL_STUDENT_BENCHMARK_SHEETS.forEach(name => assert.ok(sheetNames.includes(name), `missing ${name}`));
  assert.ok(sheetNames.includes("Letter Names & Sounds"), "legacy formal-assessment sheet is preserved");
  assert.ok(sheetNames.includes("Advanced Phonics Patterns"), "legacy advanced-phonics sheet is preserved");

  const profileSheet = workbook.getWorksheet("Benchmark Profile");
  const profile = worksheetRows(profileSheet);
  assert.equal(profile.length, 4);
  const paProfile = profile.find(row => row["Assessment ID"] === EL_BENCHMARK_ASSESSMENT_IDS.PHONOLOGICAL_AWARENESS);
  const encodingProfile = profile.find(row => row["Assessment ID"] === EL_BENCHMARK_ASSESSMENT_IDS.ENCODING);
  const decodingProfile = profile.find(row => row["Assessment ID"] === EL_BENCHMARK_ASSESSMENT_IDS.DECODING);
  const fluencyProfile = profile.find(row => row["Assessment ID"] === EL_BENCHMARK_ASSESSMENT_IDS.ORAL_READING_FLUENCY);
  assert.equal(paProfile["PA accuracy"], 0.5);
  assert.equal(encodingProfile["Encoding exact spelling"], 0.33);
  assert.equal(encodingProfile["Encoding phonologically represented"], 0.67);
  assert.equal(decodingProfile["Decoding accuracy"], 0.67);
  assert.equal(decodingProfile["Decoding automaticity"], 0.33);
  assert.match(decodingProfile["Candidate placement"], /Microphase: 4/);
  assert.match(decodingProfile["Confirmed placement"], /Microphase: 3/);
  assert.equal(fluencyProfile["Fluency WCPM"], 42);
  assert.equal(fluencyProfile["Fluency accuracy"], 0.93);
  assert.equal(fluencyProfile["Fluency prosody average"], 2.75);

  const paRows = worksheetRows(workbook.getWorksheet("PA Strand Detail"));
  const rhyme = paRows.find(row => row["Item ID"] === "pa-rhyme-1");
  const notScorable = paRows.find(row => row["Item ID"] === "pa-segment-1");
  assert.equal(rhyme["Student response"], "yes");
  assert.equal(rhyme["Correct evidence"], "Yes");
  assert.equal(notScorable["Strand not scorable"], 1);
  assert.equal(notScorable["Not-scorable reason"], "student_unwell");
  assert.equal(notScorable["Not-scorable note"], "Stopped after the student reported a headache.");

  const encodingRows = worksheetRows(workbook.getWorksheet("Encoding Detail"));
  const rainSpelling = encodingRows.find(row => row["Target spelling"] === "rain");
  assert.equal(rainSpelling["Student spelling"], "rane");
  assert.equal(rainSpelling["Exact spelling"], "No");
  assert.equal(rainSpelling["Plausible spelling"], "Yes");

  const decodingRows = worksheetRows(workbook.getWorksheet("Decoding Detail"));
  const rainReading = decodingRows.find(row => row["Target word"] === "rain");
  assert.equal(rainReading["Accurate"], "Yes");
  assert.equal(rainReading["Automatic"], "Yes");
  assert.equal(rainReading["Stop triggered"], "Yes");
  assert.equal(rainReading["Stop reason"], "automatic_count_stop_rule");
  assert.match(decodingRows[0]["Prerequisite review"], /teacher_changed_confirmed_encoding_start/);
  assert.match(decodingRows[0]["Prerequisite review"], /Additional classroom evidence/);
  assert.match(decodingRows[0]["Recommendations"], /Letter Identification/);
  assert.match(decodingRows[0]["Observations"], /route override retained/i);
  assert.equal(decodingRows[0]["Assessment validation issues"], "route_confirmation_required");

  const fluencyRows = worksheetRows(workbook.getWorksheet("Fluency Detail"));
  assert.equal(fluencyRows[0]["WCPM"], 42);
  assert.equal(fluencyRows[0]["Accuracy"], 0.93);
  assert.equal(fluencyRows[0]["Prosody phrasing"], 2);
  assert.equal(fluencyRows[0]["Prosody average"], 2.75);

  assert.doesNotMatch(workbookText(workbook, EL_STUDENT_BENCHMARK_SHEETS), /Mastered|Developing|Needs Support/);
  const paAccuracyColumn = profileSheet.getRow(1).values.indexOf("PA accuracy");
  assert.equal(profileSheet.getRow(2).getCell(paAccuracyColumn).numFmt, "0%");
  assert.notEqual(profileSheet.getRow(2).getCell(paAccuracyColumn).fill?.pattern, "solid", "descriptive rates do not receive threshold colours");
});

test("class Excel export includes the benchmark matrix, domain summaries, and item evidence", async () => {
  const report = buildClassElAssessmentReportData({
    assessmentHistory,
    students: [student, classmate],
    classes: [{ id: "class-1", name: "Class One" }],
    classId: "class-1",
    teacherId: "teacher-1"
  });
  const workbook = await serializeAndReload(await createClassElAssessmentWorkbook(report));
  const sheetNames = workbook.worksheets.map(sheet => sheet.name);
  EL_CLASS_BENCHMARK_SHEETS.forEach(name => assert.ok(sheetNames.includes(name), `missing ${name}`));
  assert.ok(sheetNames.includes("Letter Sound Class Matrix"), "legacy letter matrix is preserved");
  assert.ok(sheetNames.includes("Advanced Phonics Class Matrix"), "legacy advanced-phonics matrix is preserved");

  const matrix = worksheetRows(workbook.getWorksheet("Benchmark Class Matrix"));
  const ada = matrix.find(row => row.Student === "Ada");
  const leo = matrix.find(row => row.Student === "Leo");
  assert.equal(ada["Encoding exact spelling"], 0.33);
  assert.equal(ada["Decoding automaticity"], 0.33);
  assert.equal(ada["Decoding stopped"], "Yes");
  assert.equal(ada["Fluency WCPM"], 42);
  assert.equal(leo["PA evidence"], "Yes");
  assert.equal(leo["Encoding evidence"], "No");

  const summaries = worksheetRows(workbook.getWorksheet("Benchmark Domain Summary"));
  const pa = summaries.find(row => row["Assessment ID"] === EL_BENCHMARK_ASSESSMENT_IDS.PHONOLOGICAL_AWARENESS);
  const encoding = summaries.find(row => row["Assessment ID"] === EL_BENCHMARK_ASSESSMENT_IDS.ENCODING);
  const decoding = summaries.find(row => row["Assessment ID"] === EL_BENCHMARK_ASSESSMENT_IDS.DECODING);
  const fluency = summaries.find(row => row["Assessment ID"] === EL_BENCHMARK_ASSESSMENT_IDS.ORAL_READING_FLUENCY);
  assert.match(pa["PA strand summaries"], /rhyme: 100%/i);
  assert.equal(encoding["Encoding average exact spelling"], 0.33);
  assert.equal(encoding["Encoding plausible count"], 1);
  assert.equal(decoding["Decoding average accuracy"], 0.67);
  assert.equal(decoding["Stopped / discontinued students"], "Ada");
  assert.equal(fluency["Fluency average WCPM"], 42);
  assert.equal(fluency["Fluency average prosody"], 2.75);

  const evidenceRows = worksheetRows(workbook.getWorksheet("Benchmark Evidence Detail"));
  const classEncoding = evidenceRows.find(row => row.Student === "Ada" && row["Target / prompt"] === "rain" && row.Domain === "Encoding and Spelling");
  const classDecoding = evidenceRows.find(row => row.Student === "Ada" && row["Target / prompt"] === "rain" && row.Domain === "Decoding and Automaticity");
  const classFluency = evidenceRows.find(row => row.Student === "Ada" && row.Domain === "Oral Reading Fluency");
  assert.equal(classEncoding["Student response"], "rane");
  assert.equal(classEncoding["Plausible spelling"], "Yes");
  assert.equal(classDecoding["Automatic decoding"], "Yes");
  assert.equal(classDecoding["Stop triggered"], "Yes");
  assert.match(classDecoding["Recommendations"], /Letter Identification/);
  assert.match(classDecoding["Observations"], /route override retained/i);
  assert.equal(classDecoding["Assessment validation issues"], "route_confirmation_required");
  assert.equal(classDecoding["Content version"], "content-a-v1");
  assert.equal(classDecoding["Scoring version"], "scoring-a-v1");
  assert.equal(classDecoding["Scoring rule version"], "scoring-rule-a-v1");
  assert.equal(classFluency["Fluency elapsed seconds"], 60);
  assert.equal(classFluency["Fluency words attempted"], 45);
  assert.equal(classFluency["Fluency words correct"], 42);
  assert.equal(classFluency["Fluency errors"], 3);
  assert.equal(classFluency["Fluency self-corrections"], 2);
  assert.equal(classFluency["Fluency WCPM"], 42);
  assert.match(classFluency["Prosody ratings"], /Phrasing: 2/);
  assert.doesNotMatch(workbookText(workbook, EL_CLASS_BENCHMARK_SHEETS), /Mastered|Developing|Needs Support/);
});

test("real scorer output survives normalization into exact, stop, and sequential fluency reports", () => {
  const encodingPlan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "1",
    window: "MOY"
  });
  const encodingAttempt = buildElBenchmarkAttempt({
    attemptId: "encoding-e2e",
    studentId: "student-1",
    studentName: "Ada",
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "1",
    window: "MOY",
    administrationStatus: "completed",
    startedAt: "2026-07-21T02:00:00.000Z",
    completedAt: "2026-07-21T02:05:00.000Z",
    responses: Object.fromEntries(encodingPlan.items.map(item => [item.id, {
      status: "correct",
      transcription: item.targetWord,
      exact: true,
      plausible: true
    }]))
  });

  const decodingPlan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "1",
    window: "MOY"
  });
  const decodingAttempt = buildElBenchmarkAttempt({
    attemptId: "decoding-e2e",
    studentId: "student-1",
    studentName: "Ada",
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "1",
    window: "MOY",
    administrationStatus: "completed",
    startedAt: "2026-07-21T02:10:00.000Z",
    completedAt: "2026-07-21T02:15:00.000Z",
    responses: Object.fromEntries(decodingPlan.items.map((item, index) => [item.id, {
      status: "correct",
      isCorrect: true,
      transcription: item.targetWord,
      automatic: index < 5
    }]))
  });

  const fluencyPlan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "2",
    window: "EOY",
    startMicrophase: "early_full"
  });
  const [firstPassage, secondPassage] = fluencyPlan.passages;
  const fluencyAttempt = buildElBenchmarkAttempt({
    attemptId: "fluency-e2e",
    studentId: "student-1",
    studentName: "Ada",
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "2",
    window: "EOY",
    startMicrophase: "early_full",
    administrationStatus: "completed",
    startedAt: "2026-07-21T02:20:00.000Z",
    completedAt: "2026-07-21T02:25:00.000Z",
    responses: {
      [firstPassage.id]: {
        status: "recorded",
        timerStatus: "complete",
        elapsedSeconds: 60,
        wordsAttempted: 60,
        errors: 2,
        selfCorrections: 1,
        passageAccurate: true,
        prosody: { expression: 3, phrasing: 3, smoothness: 3, pace: 3 }
      },
      [secondPassage.id]: {
        status: "recorded",
        timerStatus: "complete",
        elapsedSeconds: 60,
        wordsAttempted: 50,
        errors: 5,
        selfCorrections: 1,
        passageAccurate: false,
        prosody: { expression: 2, phrasing: 3, smoothness: 2, pace: 3 }
      }
    }
  });

  const gradeOneReport = buildIndividualElFormalAssessmentReport({
    student,
    assessmentHistory: [encodingAttempt, decodingAttempt, fluencyAttempt],
    benchmarkScope: { grade: "1", benchmarkWindow: "MOY" }
  });
  const gradeTwoReport = buildIndividualElFormalAssessmentReport({
    student,
    assessmentHistory: [encodingAttempt, decodingAttempt, fluencyAttempt],
    benchmarkScope: { grade: "2", benchmarkWindow: "EOY" }
  });
  const encoding = gradeOneReport.individualBenchmarkDetails.find(row => row.assessmentId === EL_BENCHMARK_IDS.ENCODING);
  const decoding = gradeOneReport.individualBenchmarkDetails.find(row => row.assessmentId === EL_BENCHMARK_IDS.DECODING);
  const fluency = gradeTwoReport.individualBenchmarkDetails.find(row => row.assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY);

  assert.equal(encoding.exactSpellingCount, 8);
  assert.equal(encoding.plausibleSpellingCount, 0);
  assert.equal(encoding.itemDetails[0].studentSpelling, encodingPlan.items[0].targetWord);
  assert.equal(decoding.stopEvidence.triggered, true);
  assert.equal(decoding.stopEvidence.stopBand, decodingPlan.items[0].bandId);
  assert.equal(decoding.stopEvidence.reason, "automatic_count_lte_5_of_8");
  assert.equal(fluency.passageRows.filter(row => !["not_administered", "not_scorable", "discontinued"].includes(row.responseStatus)).length, 2);
  assert.equal(fluency.passageRows[0].passageTitle, firstPassage.title);
  assert.equal(fluency.passageRows[1].passageTitle, secondPassage.title);
  assert.equal(fluency.passageRows[1].prosodyAverage, 2.5);
  assert.equal(fluency.stopEvidence.passageId, secondPassage.id);
  assert.equal(fluency.stopEvidence.reason, "teacher_judged_not_accurate_after_60_seconds");
});

test("an interrupted ORF attempt stays unscored through persistence, reporting, and export", async () => {
  const fluencyPlan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "1",
    window: "BOY"
  });
  const passage = fluencyPlan.items[0];
  const attempt = buildElBenchmarkAttempt({
    attemptId: "fluency-interrupted-roundtrip",
    studentId: student.id,
    studentName: student.name,
    classId: student.classId,
    teacherId: "teacher-1",
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "1",
    window: "BOY",
    administrationStatus: "completed",
    startedAt: "2026-07-21T07:00:00.000Z",
    completedAt: "2026-07-21T07:02:00.000Z",
    responses: {
      [passage.id]: {
        status: "recorded",
        wordsAttempted: 20,
        errors: 2,
        selfCorrections: 0,
        elapsedSeconds: 60,
        passageAccurate: true,
        timerStatus: "interrupted",
        timerInterrupted: true,
        interruptionReason: "timer_session_restored_while_running"
      }
    }
  });

  assert.equal(attempt.metrics.wcpm, null);
  assert.equal(attempt.questionRecords[0].routeJudgmentUsable, false);
  assert.equal(attempt.questionRecords[0].timerInterrupted, true);
  assert.equal(attempt.questionRecords[0].responseCaptureMode, "timed_reading_observation");

  const restored = normalizeAssessmentAttempt(JSON.parse(JSON.stringify(attempt)));
  assert.equal(restored.questionRecords[0].timerInterrupted, true);
  assert.equal(restored.questionRecords[0].interruptionReason, "timer_session_restored_while_running");
  assert.deepEqual(restored.questionRecords[0].informationalNotes, ["interrupted_timing_not_scorable"]);

  const formal = buildIndividualElFormalAssessmentReport({
    student,
    assessmentHistory: [restored],
    benchmarkScope: { grade: "1", benchmarkWindow: "BOY" }
  });
  const detail = formal.individualBenchmarkDetails[0];
  const row = detail.passageRows[0];
  assert.equal(row.timerInterrupted, true);
  assert.equal(row.interruptionReason, "timer_session_restored_while_running");
  assert.equal(row.routeJudgmentUsable, false);
  assert.equal(row.wordsCorrect, null);
  assert.equal(row.wcpm, null);
  assert.equal(detail.wcpm, null);

  const report = buildStudentElAssessmentReportData({
    assessmentHistory: [restored],
    students: [student],
    classes: [{ id: student.classId, name: "Class One" }],
    studentId: student.id,
    classId: student.classId,
    teacherId: "teacher-1",
    benchmarkScope: { grade: "1", benchmarkWindow: "BOY" }
  });
  const compactReport = compactElAssessmentReportForStorage(report);
  const compactRow = compactReport.formalAssessments.individualBenchmarkDetails[0].passageRows[0];
  assert.equal(compactRow.timerInterrupted, true);
  assert.equal(compactRow.interruptionReason, "timer_session_restored_while_running");
  assert.equal(compactRow.wcpm, null);
  const workbook = await createStudentElAssessmentWorkbook(compactReport);
  const exported = worksheetRows(workbook.getWorksheet("Fluency Detail"))[0];
  assert.equal(exported["Timer interrupted"], "Yes");
  assert.equal(exported["Interruption reason"], "timer_session_restored_while_running");
  assert.equal(exported["Response capture"], "Timed reading observation");
  assert.equal(exported.WCPM, "");
});

test("real scorer Early Partial guidance survives formal reporting and Excel export", async () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "K",
    window: "EOY"
  });
  const attempt = buildElBenchmarkAttempt({
    attemptId: "encoding-early-partial-guidance",
    studentId: "student-1",
    studentName: "Ada",
    classId: "class-1",
    teacherId: "teacher-1",
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "K",
    window: "EOY",
    administrationStatus: "completed",
    startedAt: "2026-07-21T06:00:00.000Z",
    completedAt: "2026-07-21T06:10:00.000Z",
    confirmedPlacement: {
      microphase: "early_partial",
      label: "Early Partial",
      confirmedAt: "2026-07-21T05:55:00.000Z"
    },
    placementSource: "teacher_confirmation",
    responses: Object.fromEntries(plan.items.map((item, index) => [item.id, {
      status: "correct",
      transcription: index === 0 ? `${item.targetWord}x` : item.targetWord,
      exact: true,
      plausible: true,
      ...(index === 0 ? {
        teacherOverride: {
          field: "exact",
          to: true,
          reason: "Dialect-informed spelling accepted."
        }
      } : {})
    }]))
  });

  assert.equal(attempt.skillLevel, 0, "Kindergarten must be stored as level zero");
  const compactAttempt = compactAssessmentAttemptForStorage(attempt);
  assert.equal(compactAttempt.formVersion, attempt.formVersion);
  assert.equal(compactAttempt.contentVersion, attempt.contentVersion);
  assert.equal(compactAttempt.scoringVersion, attempt.scoringVersion);
  assert.equal(compactAttempt.scoringRuleVersion, attempt.scoringRuleVersion);
  assert.equal(compactAttempt.metadata?.contentVersion, undefined, "duplicate metadata provenance should be compacted");
  const restoredAttempt = normalizeAssessmentAttempt(JSON.parse(JSON.stringify(compactAttempt)));
  assert.equal(restoredAttempt.skillLevel, 0, "normalization must not coerce Kindergarten to level one");

  const formal = buildIndividualElFormalAssessmentReport({
    student,
    assessmentHistory: [restoredAttempt],
    benchmarkScope: { grade: "K", benchmarkWindow: "EOY" }
  });
  const detail = formal.individualBenchmarkDetails[0];
  assert.ok(detail.recommendations.some(note => /administer the Letter Identification assessment/i.test(note)));
  assert.ok(detail.observations.some(note => /teacher override retained/i.test(note)));
  assert.equal(detail.formVersion, attempt.formVersion);
  assert.equal(detail.contentVersion, attempt.contentVersion);
  assert.equal(detail.scoringVersion, attempt.scoringVersion);
  assert.equal(detail.scoringRuleVersion, attempt.scoringRuleVersion);

  const report = buildStudentElAssessmentReportData({
    assessmentHistory: [restoredAttempt],
    students: [student],
    classes: [{ id: "class-1", name: "Class One" }],
    studentId: student.id,
    classId: "class-1",
    teacherId: "teacher-1",
    benchmarkScope: { grade: "K", benchmarkWindow: "EOY" }
  });
  assert.equal(report.attemptRows[0].level, 0, "formal report rows must retain Kindergarten level zero");
  const compactReport = compactElAssessmentReportForStorage(report);
  assert.equal(compactReport.attemptRows[0].level, 0, "saved reports must retain Kindergarten level zero");
  assert.ok(compactReport.formalAssessments.individualBenchmarkDetails[0].recommendations
    .some(note => /administer the Letter Identification assessment/i.test(note)));
  const workbook = await createStudentElAssessmentWorkbook(compactReport);
  const profile = worksheetRows(workbook.getWorksheet("Benchmark Profile"));
  const encodingProfile = profile.find(row => row["Assessment ID"] === EL_BENCHMARK_IDS.ENCODING);
  assert.match(encodingProfile.Recommendations, /administer the Letter Identification assessment/i);
  assert.match(encodingProfile.Observations, /teacher override retained/i);
  assert.equal(encodingProfile["Form version"], attempt.formVersion);
  assert.equal(encodingProfile["Content version"], attempt.contentVersion);
  assert.equal(encodingProfile["Scoring version"], attempt.scoringVersion);
  assert.equal(encodingProfile["Scoring rule version"], attempt.scoringRuleVersion);
  const encodingRows = worksheetRows(workbook.getWorksheet("Encoding Detail"));
  assert.match(encodingRows[0].Recommendations, /administer the Letter Identification assessment/i);
  assert.match(encodingRows[0].Observations, /teacher override retained/i);
  assert.equal(encodingRows[0]["Content version"], attempt.contentVersion);
  assert.equal(encodingRows[0]["Scoring version"], attempt.scoringVersion);
  assert.equal(encodingProfile.Grade, "K", "Excel must retain the Kindergarten route");
});

test("globally unscored real benchmark attempts retain audit observations but suppress every performance metric", async () => {
  const grade = "1";
  const window = "BOY";
  const paPlan = getElBenchmarkPlan({ assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, grade, window });
  const encodingPlan = getElBenchmarkPlan({ assessmentId: EL_BENCHMARK_IDS.ENCODING, grade, window });
  const decodingPlan = getElBenchmarkPlan({ assessmentId: EL_BENCHMARK_IDS.DECODING, grade, window });
  const fluencyPlan = getElBenchmarkPlan({ assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, grade, window });
  const fluencyPassage = fluencyPlan.passages[0];
  const sessions = [
    {
      attemptId: "pa-global-not-scorable",
      assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
      responses: {
        [paPlan.items[0].id]: {
          status: "correct",
          responseText: "practice oral response",
          transcription: "practice oral response",
          isCorrect: true
        }
      }
    },
    {
      attemptId: "encoding-global-not-scorable",
      assessmentId: EL_BENCHMARK_IDS.ENCODING,
      responses: {
        [encodingPlan.items[0].id]: {
          status: "correct",
          transcription: encodingPlan.items[0].targetWord,
          exact: true,
          plausible: true
        }
      }
    },
    {
      attemptId: "decoding-global-not-scorable",
      assessmentId: EL_BENCHMARK_IDS.DECODING,
      responses: {
        [decodingPlan.items[0].id]: {
          status: "correct",
          responseText: decodingPlan.items[0].targetWord,
          transcription: decodingPlan.items[0].targetWord,
          isCorrect: true,
          automatic: true
        }
      }
    },
    {
      attemptId: "fluency-global-not-scorable",
      assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
      responses: {
        [fluencyPassage.id]: {
          status: "recorded",
          responseText: "Practice passage transcription retained for audit.",
          transcription: "Practice passage transcription retained for audit.",
          elapsedSeconds: 60,
          timerInterrupted: true,
          interruptionReason: "teacher_paused_for_environmental_noise",
          wordsAttempted: 50,
          errors: 5,
          selfCorrections: 1,
          passageAccurate: true,
          prosody: { expression: 3, phrasing: 3, smoothness: 3, pace: 3 }
        }
      }
    }
  ];
  const attempts = sessions.map((session, index) => {
    const attempt = buildElBenchmarkAttempt({
      ...session,
      studentId: student.id,
      studentName: student.name,
      classId: student.classId,
      teacherId: "teacher-1",
      grade,
      window,
      administrationStatus: "not_scorable",
      startedAt: `2026-07-21T0${index + 1}:00:00.000Z`,
      completedAt: `2026-07-21T0${index + 1}:05:00.000Z`
    });
    return normalizeAssessmentAttempt(JSON.parse(JSON.stringify(compactAssessmentAttemptForStorage(attempt))));
  });
  assert.ok(attempts.every(attempt => attempt.accuracy === null), "normalization must preserve unscored null accuracy");

  const formal = buildIndividualElFormalAssessmentReport({
    student,
    assessmentHistory: attempts,
    benchmarkScope: { grade, benchmarkWindow: window }
  });
  assert.equal(formal.individualBenchmarkDetails.length, 4);
  formal.individualBenchmarkDetails.forEach(detail => assert.equal(detail.performanceSuppressed, true));
  const pa = formal.individualBenchmarkDetails.find(detail => detail.domainKey === "phonologicalAwareness");
  const encoding = formal.individualBenchmarkDetails.find(detail => detail.domainKey === "encoding");
  const decoding = formal.individualBenchmarkDetails.find(detail => detail.domainKey === "decoding");
  const fluency = formal.individualBenchmarkDetails.find(detail => detail.domainKey === "oralReadingFluency");
  assert.equal(pa.administeredCount, 0);
  assert.equal(pa.accuracyRate, null);
  assert.equal(encoding.administeredCount, 0);
  assert.equal(encoding.exactSpellingCount, 0);
  assert.equal(encoding.exactSpellingRate, null);
  assert.equal(decoding.administeredCount, 0);
  assert.equal(decoding.accurateCount, 0);
  assert.equal(decoding.accuracyRate, null);
  assert.equal(fluency.wordsAttempted, null);
  assert.equal(fluency.wcpm, null);
  assert.equal(fluency.accuracyRate, null);
  assert.match(fluency.itemDetails[0].exactResponse, /Practice passage transcription/);

  const classFormal = buildClassElFormalAssessmentReport({
    students: [student],
    assessmentHistory: attempts,
    classId: student.classId,
    benchmarkScope: { grade, benchmarkWindow: window }
  });
  classFormal.classBenchmarkDomainSummaries.forEach(summary => {
    assert.equal(summary.studentsWithScoredEvidence, 0);
  });
  assert.equal(classFormal.classBenchmarkDomainSummaries.find(row => row.domainKey === "phonologicalAwareness").metrics.averageAccuracyRate, null);
  assert.equal(classFormal.classBenchmarkDomainSummaries.find(row => row.domainKey === "encoding").metrics.averageExactSpellingRate, null);
  assert.equal(classFormal.classBenchmarkDomainSummaries.find(row => row.domainKey === "decoding").metrics.averageAccuracyRate, null);
  assert.equal(classFormal.classBenchmarkDomainSummaries.find(row => row.domainKey === "oralReadingFluency").metrics.averageWcpm, null);

  const report = buildStudentElAssessmentReportData({
    assessmentHistory: attempts,
    students: [student],
    classes: [{ id: student.classId, name: "Class One" }],
    studentId: student.id,
    classId: student.classId,
    teacherId: "teacher-1",
    benchmarkScope: { grade, benchmarkWindow: window }
  });
  const workbook = await createStudentElAssessmentWorkbook(compactElAssessmentReportForStorage(report));
  const paRows = worksheetRows(workbook.getWorksheet("PA Strand Detail"));
  const encodingRows = worksheetRows(workbook.getWorksheet("Encoding Detail"));
  const decodingRows = worksheetRows(workbook.getWorksheet("Decoding Detail"));
  const fluencyRows = worksheetRows(workbook.getWorksheet("Fluency Detail"));
  assert.equal(paRows.find(row => row["Student response"] === "practice oral response")["Correct evidence"], "Not scored");
  assert.equal(encodingRows.find(row => row["Student spelling"] === encodingPlan.items[0].targetWord)["Exact spelling"], "Not scored");
  assert.equal(decodingRows.find(row => row["Student response"] === decodingPlan.items[0].targetWord).Accurate, "Not scored");
  const observedFluency = fluencyRows.find(row => /Practice passage transcription/.test(String(row["Student transcription"])));
  assert.equal(observedFluency["Words attempted"], "");
  assert.equal(observedFluency.WCPM, "");
  assert.equal(observedFluency.Accuracy, "");
  assert.equal(observedFluency["Passage judgment"], "Not scored");

  const classReport = buildClassElAssessmentReportData({
    assessmentHistory: attempts,
    students: [student],
    classes: [{ id: student.classId, name: "Class One" }],
    classId: student.classId,
    teacherId: "teacher-1",
    benchmarkScope: { grade, benchmarkWindow: window }
  });
  const classWorkbook = await createClassElAssessmentWorkbook(compactElAssessmentReportForStorage(classReport));
  const classEvidenceRows = worksheetRows(classWorkbook.getWorksheet("Benchmark Evidence Detail"));
  const classFluency = classEvidenceRows.find(row => /Practice passage transcription/.test(String(row["Student response"])));
  assert.equal(classFluency["Fluency timer interrupted"], "Yes", "administration audit evidence must survive performance suppression");
  assert.equal(classFluency["Fluency interruption reason"], "teacher_paused_for_environmental_noise");
  assert.equal(classFluency["Fluency passage judgment"], "");
});

test("Encoding keeps No response separate from attempted Not yet evidence", async () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "1",
    window: "BOY"
  });
  const attempt = normalizeAssessmentAttempt(buildElBenchmarkAttempt({
    attemptId: "encoding-no-response-distinction",
    studentId: student.id,
    studentName: student.name,
    classId: student.classId,
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "1",
    window: "BOY",
    administrationStatus: "completed",
    responses: {
      [plan.items[0].id]: { status: "no_response" },
      [plan.items[1].id]: {
        status: "incorrect",
        transcription: "x",
        exact: false,
        plausible: false
      }
    }
  }));
  const formal = buildIndividualElFormalAssessmentReport({
    student,
    assessmentHistory: [attempt],
    benchmarkScope: { grade: "1", benchmarkWindow: "BOY" }
  });
  const detail = formal.individualBenchmarkDetails[0];
  assert.equal(detail.noResponseCount, 1);
  assert.equal(detail.notYetCount, 1);
  assert.equal(detail.itemDetails.find(item => item.responseStatus === "no_response").notYet, false);
  assert.equal(detail.itemDetails.find(item => item.responseStatus === "incorrect").notYet, true);

  const report = buildStudentElAssessmentReportData({
    assessmentHistory: [attempt],
    students: [student],
    classes: [{ id: student.classId, name: "Class One" }],
    studentId: student.id,
    classId: student.classId,
    benchmarkScope: { grade: "1", benchmarkWindow: "BOY" }
  });
  const workbook = await createStudentElAssessmentWorkbook(report);
  const rows = worksheetRows(workbook.getWorksheet("Encoding Detail"));
  assert.equal(rows[0]["No-response count"], 1);
  assert.equal(rows[0]["Not-yet count"], 1);
  assert.equal(rows.find(row => String(row["Response status"]).toLowerCase() === "no response")["Not yet represented"], "No");
});

test("Decoding aggregate categories keep self-corrections separate from accurate-after-sounding", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "1",
    window: "BOY"
  });
  const firstBand = plan.items.filter(item => item.bandId === plan.items[0].bandId);
  const attempt = normalizeAssessmentAttempt(buildElBenchmarkAttempt({
    attemptId: "decoding-category-partition",
    studentId: student.id,
    studentName: student.name,
    classId: student.classId,
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "1",
    window: "BOY",
    administrationStatus: "completed",
    responses: Object.fromEntries(firstBand.map((item, index) => [item.id, {
      status: index >= 2 && index < 4 ? "self_corrected" : "correct",
      responseText: item.targetWord,
      transcription: item.targetWord,
      isCorrect: true,
      automatic: index < 2,
      selfCorrected: index >= 2 && index < 4
    }]))
  }));
  const formal = buildIndividualElFormalAssessmentReport({
    student,
    assessmentHistory: [attempt],
    benchmarkScope: { grade: "1", benchmarkWindow: "BOY" }
  });
  const detail = formal.individualBenchmarkDetails[0];
  assert.equal(detail.accurateCount, firstBand.length);
  assert.equal(detail.automaticCount, 2);
  assert.equal(detail.selfCorrectedCount, 2);
  assert.equal(detail.accurateAfterSoundingCount, firstBand.length - 4);
  assert.equal(
    detail.automaticCount + detail.accurateAfterSoundingCount + detail.selfCorrectedCount,
    detail.accurateCount
  );
});
