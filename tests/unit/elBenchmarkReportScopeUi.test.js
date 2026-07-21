import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

function finishedReportProps(assessmentHistory = []) {
  return {
    accuracy: 0,
    assessmentHistory,
    className: "Class One",
    coverageSnapshot: {},
    currentSkillIndex: 0,
    currentStage: { label: "Initial Sounds" },
    currentStageQuestions: [],
    exportStudentExcel: async () => {},
    guidedReadingRecords: {},
    itemMastery: {},
    letterAssessment: [],
    mastery: {},
    patternAssessment: [],
    progressScopeKey: "student-1",
    skillMasterySummary: [],
    skillTree: [],
    startAssessment: () => {},
    storyQuestProgressScopeKey: "student-1",
    studentName: "Ada",
    totalAnswered: 0
  };
}

test("finished report renders a visible saved-route selector with the newest route selected", async t => {
  const vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  t.after(() => vite.close());
  const { FinishedReportPage } = await vite.ssrLoadModule("/src/components/FinishedReportPage.jsx");
  const common = {
    studentId: "student-1",
    studentName: "Ada",
    classId: "class-1",
    teacherId: "teacher-1",
    gradePath: "1",
    framework: "LiteracyPath provisional",
    startedAt: "2026-07-21T01:00:00.000Z",
    administrationStatus: "completed"
  };
  const assessmentHistory = [
    {
      ...common,
      attemptId: "pa-moy",
      assessmentType: "el_phonological_awareness",
      skillId: "el_phonological_awareness",
      skillName: "EL Phonological & Phonemic Awareness",
      benchmarkWindow: "MOY",
      completedAt: "2026-07-21T01:05:00.000Z",
      questionRecords: [{
        questionId: "pa-one",
        responseStatus: "correct",
        isCorrect: true,
        metadata: { strand: "rhyme" }
      }]
    },
    {
      ...common,
      attemptId: "encoding-eoy",
      assessmentType: "el_encoding",
      skillId: "el_encoding",
      skillName: "EL Encoding",
      benchmarkWindow: "EOY",
      completedAt: "2026-07-21T02:05:00.000Z",
      questionRecords: [{
        questionId: "encoding-one",
        targetWord: "ship",
        responseStatus: "correct",
        responseText: "ship",
        isCorrect: true,
        scoringCode: "exact"
      }]
    }
  ];

  const html = renderToStaticMarkup(React.createElement(FinishedReportPage, finishedReportProps(assessmentHistory)));

  assert.match(html, /Benchmark scope:\s*<strong>Grade 1 · EOY<\/strong>/);
  assert.match(html, /aria-label="Benchmark grade and assessment window"/);
  assert.match(html, /Grade 1 · EOY \(1 attempt\) - most recent/);
  assert.match(html, /Grade 1 · MOY \(1 attempt\)/);
  assert.match(html, />Export This Route<\/button>/);
});

test("finished report exposes expandable semantic per-item evidence for every benchmark domain", async t => {
  const vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  t.after(() => vite.close());
  const { FinishedReportPage } = await vite.ssrLoadModule("/src/components/FinishedReportPage.jsx");
  const common = {
    studentId: "student-1",
    studentName: "Ada",
    classId: "class-1",
    teacherId: "teacher-1",
    gradePath: "1",
    framework: "LiteracyPath provisional",
    startedAt: "2026-07-21T03:00:00.000Z",
    completedAt: "2026-07-21T03:10:00.000Z",
    administrationStatus: "completed",
    benchmarkWindow: "EOY",
    formVersion: "benchmark-form-v1",
    contentVersion: "benchmark-content-v1",
    scoringVersion: "benchmark-scoring-v1",
    scoringRuleVersion: "benchmark-rule-v1"
  };
  const assessmentHistory = [
    {
      ...common,
      attemptId: "pa-eoy",
      assessmentType: "el_phonological_awareness",
      questionRecords: [
        {
          questionId: "pa-rhyme-1",
          prompt: "Say a word that rhymes with top.",
          responseText: "mop",
          responseStatus: "correct",
          isCorrect: true,
          metadata: { strand: "rhyme" }
        },
        {
          questionId: "pa-segment-1",
          prompt: "Segment ship into sounds.",
          responseStatus: "not_scorable",
          notScorableReason: "student_unwell",
          notScorableNote: "The student reported a headache.",
          metadata: { strand: "phoneme_segmentation" }
        }
      ]
    },
    {
      ...common,
      attemptId: "encoding-eoy",
      assessmentType: "el_encoding",
      prerequisiteReview: {
        state: "override",
        source: "letter_sound_benchmark",
        code: "external_encoding_evidence",
        evidenceAttemptId: "letter-sound-3",
        teacherConfirmed: true,
        overrideReason: "Recent classroom spelling evidence supports this route."
      },
      questionRecords: [{
        questionId: "encoding-ship",
        targetWord: "ship",
        responseText: "shp",
        responseStatus: "incorrect",
        isCorrect: false,
        scoringCode: "not_yet",
        errorTags: ["vowel_omission"],
        validationIssues: ["response_transcription_required"]
      }]
    },
    {
      ...common,
      attemptId: "decoding-eoy",
      assessmentType: "el_decoding",
      recommendations: ["Administer the Letter Identification assessment before planning the next route."],
      observations: ["Teacher-confirmed route override retained for review."],
      validationIssues: ["route_confirmation_required"],
      questionRecords: [{
        questionId: "decoding-rain",
        targetWord: "rain",
        responseText: "ran, then rain",
        responseStatus: "self_corrected",
        isCorrect: true,
        automatic: false,
        selfCorrected: true,
        errorTags: ["vowel_team_confusion"],
        metadata: { bandId: "microphase-4", microphase: 4 }
      }]
    },
    {
      ...common,
      attemptId: "fluency-eoy",
      assessmentType: "el_oral_reading_fluency",
      questionRecords: [{
        questionId: "fluency-fox",
        responseStatus: "recorded",
        responseText: "The fox ran home.",
        metadata: {
          passageId: "fox-passage",
          passageTitle: "The Fox",
          passageAccurate: true,
          wordsAttempted: 42,
          correctWords: 39,
          errors: 3,
          selfCorrections: 2,
          elapsedSeconds: 60,
          wcpm: 39,
          accuracy: 93
        }
      }]
    }
  ];

  const html = renderToStaticMarkup(React.createElement(FinishedReportPage, finishedReportProps(assessmentHistory)));

  assert.equal((html.match(/class="student-report-benchmark-evidence-table"/g) || []).length, 4);
  assert.match(html, /<summary>View item evidence \(2\)<\/summary>/);
  assert.match(html, /<caption>Phonological and Phonemic Awareness per-item evidence \(2 items\)<\/caption>/);
  assert.match(html, /<caption>Encoding and Spelling per-item evidence \(1 item\)<\/caption>/);
  assert.match(html, /<caption>Decoding and Automaticity per-item evidence \(1 item\)<\/caption>/);
  assert.match(html, /<caption>Oral Reading Fluency per-item evidence \(1 item\)<\/caption>/);
  assert.match(html, /<th scope="col">Exact response or transcription<\/th>/);
  assert.match(html, /<th scope="col">Validation issues<\/th>/);
  assert.match(html, /<th scope="col">Not-scorable reason<\/th>/);
  assert.match(html, /<th scope="col">Not-scorable note<\/th>/);
  assert.match(html, /<th data-label="Item" scope="row">/);
  assert.match(html, /aria-label="Decoding and Automaticity item evidence table"/);
  assert.match(html, />mop<\/td>/);
  assert.match(html, />shp<\/td>/);
  assert.match(html, />ran, then rain<\/td>/);
  assert.match(html, />The fox ran home\.<\/td>/);
  assert.match(html, /<strong>Automaticity:<\/strong> Not automatic/);
  assert.match(html, /<strong>Self-correction:<\/strong> Yes/);
  assert.match(html, /<strong>Self-corrections:<\/strong> 2/);
  assert.match(html, /data-label="Error tags">Vowel Team Confusion<\/td>/);
  assert.match(html, /data-label="Validation issues">Response Transcription Required<\/td>/);
  assert.match(html, /data-label="Not-scorable reason">Student Unwell<\/td>/);
  assert.match(html, /data-label="Not-scorable note">The student reported a headache\.<\/td>/);
  assert.match(html, /<h4>Prerequisite review<\/h4>/);
  assert.match(html, /<dt>Review state<\/dt><dd>Override<\/dd>/);
  assert.match(html, /<dt>Review source<\/dt><dd>Letter Sound Benchmark<\/dd>/);
  assert.match(html, /<dt>Rule or code<\/dt><dd>External Encoding Evidence<\/dd>/);
  assert.match(html, /<dt>Evidence attempt<\/dt><dd>letter-sound-3<\/dd>/);
  assert.match(html, /<dt>Teacher confirmed<\/dt><dd>Yes<\/dd>/);
  assert.match(html, /<dt>Override applied<\/dt><dd>Yes<\/dd>/);
  assert.match(html, /<dt>Override rationale<\/dt><dd>Recent classroom spelling evidence supports this route\.<\/dd>/);
  assert.match(html, /<h4>Recommended follow-up<\/h4>/);
  assert.match(html, /Administer the Letter Identification assessment before planning the next route\./);
  assert.match(html, /<h4>Recorded observations<\/h4>/);
  assert.match(html, /Teacher-confirmed route override retained for review\./);
  assert.match(html, /<h4>Assessment notices<\/h4>/);
  assert.match(html, /Route Confirmation Required/);
  assert.match(html, /aria-label="Benchmark version provenance"/);
  assert.match(html, /<strong>Form:<\/strong> benchmark-form-v1/);
  assert.match(html, /<strong>Content:<\/strong> benchmark-content-v1/);
  assert.match(html, /<strong>Scoring:<\/strong> benchmark-scoring-v1/);
  assert.match(html, /<strong>Scoring rule:<\/strong> benchmark-rule-v1/);
  assert.match(html, /<dt>Oral-task accuracy<\/dt>/, "aggregate benchmark metrics must remain visible");
});

test("finished report never coerces missing fluency evidence to zero", async t => {
  const vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  t.after(() => vite.close());
  const { FinishedReportPage } = await vite.ssrLoadModule("/src/components/FinishedReportPage.jsx");
  const assessmentHistory = [{
    studentId: "student-1",
    studentName: "Ada",
    classId: "class-1",
    teacherId: "teacher-1",
    gradePath: "1",
    benchmarkWindow: "EOY",
    attemptId: "fluency-unscored",
    assessmentType: "el_oral_reading_fluency",
    skillName: "EL Oral Reading Fluency",
    startedAt: "2026-07-21T05:00:00.000Z",
    completedAt: "2026-07-21T05:05:00.000Z",
    administrationStatus: "not_scorable",
    questionRecords: [{
      questionId: "fluency-unscored-item",
      responseStatus: "not_scorable",
      notScorableReason: "response_unreliable",
      metadata: { passageTitle: "Interrupted Passage" }
    }]
  }];

  const html = renderToStaticMarkup(React.createElement(FinishedReportPage, finishedReportProps(assessmentHistory)));
  assert.match(html, /<dt>Correct words\/min<\/dt><dd>Not scored<\/dd>/);
  assert.match(html, /<dt>Word accuracy<\/dt><dd>Not scored<\/dd>/);
  assert.match(html, /<dt>Prosody \(optional\)<\/dt><dd>Not scored<\/dd>/);
  assert.match(html, /<strong>Performance metrics:<\/strong> Not scored for this administration/);
  assert.doesNotMatch(html, /<strong>Errors:<\/strong>/, "globally unscored fluency must not expose performance counts");
  assert.doesNotMatch(html, /<strong>Accuracy:<\/strong>/, "globally unscored fluency must not expose a performance rate");
});

test("finished report item evidence source keeps native disclosure and table semantics", async () => {
  const [source, styles] = await Promise.all([
    readFile(new URL("../../src/components/FinishedReportPage.jsx", import.meta.url), "utf8"),
    readFile(new URL("../../src/App.css", import.meta.url), "utf8")
  ]);
  assert.match(source, /<details className="student-report-benchmark-details">/);
  assert.match(source, /<caption>/);
  assert.match(source, /<th scope="col">Exact response or transcription<\/th>/);
  assert.match(source, /<th scope="col">Validation issues<\/th>/);
  assert.match(source, /<th scope="col">Not-scorable reason<\/th>/);
  assert.match(source, /<th scope="col">Not-scorable note<\/th>/);
  assert.match(source, /<th data-label="Item" scope="row">/);
  assert.match(source, /<BenchmarkDetail detail=\{detail\} \/>/, "aggregate detail must remain alongside item evidence");
  assert.match(source, /<BenchmarkPrerequisiteReview detail=\{detail\} \/>/);
  assert.match(source, /<BenchmarkTeacherGuidance detail=\{detail\} \/>/);
  assert.match(source, /<BenchmarkProvenance domain=\{domain\} \/>/);
  assert.match(styles, /\.student-report-benchmark-card summary:focus-visible/);
  assert.match(styles, /\.student-report-benchmark-exact-response[\s\S]*white-space: pre-wrap/);
  assert.match(styles, /content: attr\(data-label\)/, "mobile rows must retain visible column labels");
});
