// Contracts for the teacher-facing Excel exports: generated timestamps,
// dedicated Story Quest/Engagement rows, strict EL workbook boundaries, and
// no stale terminology (coins only, "Literacy Guide" brand) in any label.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildEngagementRow,
  buildReportContextRows,
  buildStoryQuestRows,
  emptyEngagementCells,
  emptyStoryQuestCells,
  ENGAGEMENT_HEADERS,
  engagementRowToCells,
  formatExportDateTime,
  hasPreviousComparison,
  STORY_QUEST_HEADERS,
  storyQuestRowToCells
} from "../../src/utils/exportReportSections.js";
import {
  buildGuidedReadingCompletionWorkbookData,
  createGuidedReadingCompletionWorkbook,
  GUIDED_READING_COMPLETION_HEADERS,
  GUIDED_READING_COMPLETION_SHEETS
} from "../../src/utils/exportGuidedReadingCompletionExcel.js";
import {
  buildClassElAssessmentExportReport,
  buildStudentElAssessmentExportReport,
  createClassElAssessmentWorkbook,
  createStudentElAssessmentWorkbook,
  EL_ASSESSMENT_TYPE_IDS,
  EL_CLASS_REPORT_SHEETS,
  EL_EMPTY_STUDENT_REPORT_SHEETS,
  EL_STUDENT_REPORT_SHEETS,
  filterElAssessmentHistory
} from "../../src/utils/exportElAssessmentExcel.js";
import {
  buildClassElAssessmentReportData,
  buildStudentElAssessmentReportData
} from "../../src/data/elAssessmentReportStore.js";
import { earnedCoins } from "../../src/utils/hollowEconomy.js";

const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

const SAMPLE_QUEST_CATALOG = [
  {
    id: "quest-1",
    title: "Sam and Pam",
    level: "A",
    series: "Meadow Pals",
    targetWords: ["cat", "sat", "mat", "hat"]
  }
];

const SAMPLE_QUEST_PROGRESS = {
  "quest-1": {
    completed: true,
    completedAt: "2026-06-01T10:00:00.000Z",
    updatedAt: "2026-06-02T10:00:00.000Z",
    wordsFound: ["cat", "sat"],
    visitedPageCount: 5
  },
  "quest-2": {
    lastPageId: "page-2",
    updatedAt: "2026-06-03T09:00:00.000Z",
    wordsFound: [],
    visitedPageCount: 2
  },
  "quest-untouched": {}
};

const SAMPLE_AREAS = {
  mission: { streak: 4, lastCompletedDay: "2026-07-09" },
  games: { games: { rocketRun: { stars: 2, plays: 3, lastPlayedAt: "2026-07-08T10:00:00.000Z" } } },
  quest: { cycles: { "cycle-1": { stars: 3 } } },
  stories: { "quest-1": { completed: true, updatedAt: "2026-06-02T10:00:00.000Z" } },
  reading: { "book-1": { readCount: 1, lastReadAt: "2026-07-01T10:00:00.000Z" } },
  hollow: { chests: [{ id: "chest-2026-07-09", day: "2026-07-09" }], purchases: [{ id: "buy-1", item: "hollow-glow-jar", cost: 30 }] }
};

// ── Timestamps ───────────────────────────────────────────────────────────────

test("formatExportDateTime produces a date-and-time label and rejects junk", () => {
  assert.match(formatExportDateTime(new Date("2026-07-10T09:05:00")), /^2026-07-10 09:05$/);
  assert.match(formatExportDateTime(new Date()), DATE_TIME_PATTERN);
  assert.equal(formatExportDateTime("not a date"), "");
});

test("report context rows always include a well-formed Generated At entry", () => {
  const rows = buildReportContextRows({
    reportTitle: "Guided Reading Completion",
    generatedAt: new Date(),
    classNames: ["Class A"],
    studentCount: 12
  });
  const generatedAt = rows.find(row => row.field === "Generated At");
  assert.ok(generatedAt, "Generated At row exists");
  assert.match(String(generatedAt.value), DATE_TIME_PATTERN);
  assert.ok(rows.some(row => row.field === "Classes Covered" && row.value === "Class A"));
  assert.ok(rows.some(row => row.field === "Students Covered" && row.value === 12));
});

test("guided reading workbook data carries generatedAt and a report info header", () => {
  const data = buildGuidedReadingCompletionWorkbookData({
    students: [],
    classes: [],
    guidedReadingRecordsByStudent: []
  });
  assert.ok(!Number.isNaN(new Date(data.generatedAt).getTime()), "generatedAt is a valid ISO timestamp");
  const generatedAt = data.reportInfoRows.find(row => row.field === "Generated At");
  assert.ok(generatedAt, "report info includes Generated At");
  assert.match(String(generatedAt.value), DATE_TIME_PATTERN);
});

// ── Terminology ──────────────────────────────────────────────────────────────

test("no stale terminology in any export label, cell key, or exporter source", () => {
  const staleGems = /\bgems?\b/i;
  const staleBrand = /literacy[\s_-]?path/i;
  const labels = [
    ...STORY_QUEST_HEADERS,
    ...ENGAGEMENT_HEADERS,
    ...Object.values(GUIDED_READING_COMPLETION_HEADERS).flat(),
    ...EL_STUDENT_REPORT_SHEETS,
    ...EL_CLASS_REPORT_SHEETS,
    ...Object.keys(storyQuestRowToCells({})),
    ...Object.keys(engagementRowToCells({})),
    ...Object.values(emptyStoryQuestCells()).map(String),
    ...Object.values(emptyEngagementCells()).map(String)
  ];
  labels.forEach(label => {
    assert.ok(!staleGems.test(label), `label uses old currency wording: ${label}`);
    assert.ok(!staleBrand.test(label), `label uses old brand wording: ${label}`);
  });
  assert.ok(ENGAGEMENT_HEADERS.some(header => /coins/i.test(header)), "engagement sheet reports coins");

  [
    "../../src/utils/exportReportSections.js",
    "../../src/utils/exportElAssessmentExcel.js",
    "../../src/utils/exportGuidedReadingCompletionExcel.js"
  ].forEach(relativePath => {
    const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
    assert.ok(!staleGems.test(source), `${relativePath} mentions the old currency`);
    assert.ok(!/literacy path/i.test(source), `${relativePath} mentions the old brand`);
  });
});

// ── Comparison gating ────────────────────────────────────────────────────────

test("hasPreviousComparison is true only for a real previous snapshot", () => {
  assert.equal(hasPreviousComparison(), false);
  assert.equal(hasPreviousComparison(null), false);
  assert.equal(hasPreviousComparison({}), false);
  assert.equal(hasPreviousComparison({ previousGeneratedAt: "" }), false);
  assert.equal(hasPreviousComparison({ previousGeneratedAt: "2026-01-01T00:00:00.000Z" }), true);
  assert.equal(hasPreviousComparison({ previousReportId: "el_individual_x" }), true);
});

const UNRELATED_EL_EXPORT_SHEETS = [
  "Assessment Attempts",
  "Progress Over Time",
  "Skills Detail",
  "Item Mastery Detail",
  "Guided Reading",
  "Story Quests",
  "Engagement",
  "Next Session Plan",
  "Comparison",
  "Student Overview",
  "Skill Heatmap",
  "Weak Points & Groups",
  "Class Progress Over Time",
  "Per-Student Skill Detail",
  "Skill Summary",
  "Progress Comparison"
];

test("empty student EL workbook omits assessment filler sheets and unrelated saved legacy payload data", async () => {
  const report = buildStudentElAssessmentReportData({ assessmentHistory: [], students: [], classes: [] });
  const savedLegacyPayload = {
    ...report,
    comparison: { previousGeneratedAt: "2026-01-01T00:00:00.000Z" },
    guidedReading: { bookRows: [{ title: "Must not leak" }] },
    storyQuests: { rows: [{ title: "Must not leak" }] },
    engagement: { rows: [{ gamesPlayed: 99 }] },
    itemMasteryRows: [{ skillName: "Must not leak" }]
  };
  const workbook = await createStudentElAssessmentWorkbook(savedLegacyPayload);
  const sheetNames = workbook.worksheets.map(sheet => sheet.name);
  assert.deepEqual(sheetNames, EL_EMPTY_STUDENT_REPORT_SHEETS);
  UNRELATED_EL_EXPORT_SHEETS.forEach(name => assert.ok(!sheetNames.includes(name), `${name} must stay outside the student EL workbook`));
  assert.doesNotMatch(workbook.getWorksheet("Student Summary").getColumn(2).values.join(" "), /Must not leak/);
  assert.match(workbook.getWorksheet("Student Summary").getColumn(2).values.join(" "), /Nothing to report/);
});

test("class EL workbook contains only focused Assessment 1-6 matrices and details", async () => {
  const report = buildClassElAssessmentReportData({ assessmentHistory: [], students: [], classes: [] });
  const savedLegacyPayload = {
    ...report,
    comparison: { previousGeneratedAt: "2026-01-01T00:00:00.000Z" },
    storyQuests: { rows: [{ title: "Must not leak" }] },
    engagement: { rows: [{ gamesPlayed: 99 }] },
    heatmapRows: [{ studentName: "Must not leak", values: { "Arcade Skill": "Mastered" } }]
  };
  const workbook = await createClassElAssessmentWorkbook(savedLegacyPayload);
  const sheetNames = workbook.worksheets.map(sheet => sheet.name);
  assert.deepEqual(sheetNames, EL_CLASS_REPORT_SHEETS);
  UNRELATED_EL_EXPORT_SHEETS.forEach(name => assert.ok(!sheetNames.includes(name), `${name} must stay outside the class EL workbook`));
  assert.doesNotMatch(workbook.getWorksheet("Class Summary").getColumn(2).values.join(" "), /Must not leak/);
});

test("EL export report builders reject unrelated assessment history before summaries are built", () => {
  const student = { id: "student-1", name: "Maya", classId: "class-1" };
  const sixElRecords = EL_ASSESSMENT_TYPE_IDS.map((assessmentType, index) => ({
    attemptId: `el-${index + 1}`,
    assessmentType,
    skillId: assessmentType,
    skillName: `EL Assessment ${index + 1}`,
    studentId: student.id,
    classId: student.classId,
    completedAt: `2026-07-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`,
    questionRecords: []
  }));
  const unrelated = {
    attemptId: "story-quest-skill",
    assessmentType: "story_quest",
    skillId: "story_quest",
    skillName: "Story Quest Vocabulary",
    studentId: student.id,
    classId: student.classId,
    completedAt: "2026-07-20T10:00:00.000Z",
    totalQuestions: 100,
    correctCount: 100,
    accuracy: 100
  };
  const collidingSkillsCheck = {
    ...unrelated,
    attemptId: "skills-check-collision",
    assessmentType: "skill_checkpoint",
    skillId: "el_encoding",
    skillName: "Skills Check with a colliding secondary ID"
  };
  const mixedHistory = [...sixElRecords, unrelated, collidingSkillsCheck];
  assert.deepEqual(filterElAssessmentHistory(mixedHistory).map(row => row.attemptId), sixElRecords.map(row => row.attemptId));

  const shared = {
    assessmentHistory: mixedHistory,
    students: [student],
    classes: [{ id: "class-1", name: "Class One" }],
    classId: "class-1"
  };
  const studentReport = buildStudentElAssessmentExportReport({ ...shared, studentId: student.id });
  const classReport = buildClassElAssessmentExportReport(shared);
  assert.deepEqual(studentReport.sourceSnapshot.records.map(row => row.attemptId), sixElRecords.map(row => row.attemptId));
  assert.deepEqual(classReport.sourceSnapshot.records.map(row => row.attemptId), sixElRecords.map(row => row.attemptId));
  assert.ok(!studentReport.skillRows.some(row => row.skillName === unrelated.skillName));
  assert.ok(!classReport.skillRows.some(row => row.skillName === unrelated.skillName));
  assert.ok(!studentReport.sourceSnapshot.records.some(row => row.attemptId === collidingSkillsCheck.attemptId));
  assert.ok(!classReport.sourceSnapshot.records.some(row => row.attemptId === collidingSkillsCheck.attemptId));
});

// ── Story Quests ─────────────────────────────────────────────────────────────

test("story quest rows are built from a sample progress object", () => {
  const rows = buildStoryQuestRows({
    studentName: "Maya",
    studentId: "s1",
    progress: SAMPLE_QUEST_PROGRESS,
    quests: SAMPLE_QUEST_CATALOG
  });
  assert.equal(rows.length, 2, "untouched quests are excluded");
  assert.equal(rows[0].questId, "quest-2", "most recent activity sorts first");

  const completed = rows.find(row => row.questId === "quest-1");
  assert.equal(completed.title, "Sam and Pam", "title resolved from the quest catalog");
  assert.equal(completed.status, "Completed");
  assert.equal(completed.stars, null, "completed quests with no recorded stars export blank, never an invented 1");
  assert.equal(completed.wordCount, 2);
  assert.equal(completed.targetWordCount, 4, "target word count falls back to the catalog");

  const cells = storyQuestRowToCells(completed);
  assert.equal(cells["Words Found"], "cat, sat");
  assert.equal(cells["Completed Date"], "2026-06-01");
  assert.equal(cells["Last Activity Date"], "2026-06-02");
});

// ── Engagement ───────────────────────────────────────────────────────────────

test("engagement row derives streak, plays, stars and coins from progress areas", () => {
  const row = buildEngagementRow({
    studentName: "Maya",
    studentId: "s1",
    className: "Class A",
    areas: SAMPLE_AREAS
  });
  assert.equal(row.missionStreak, 4);
  assert.equal(row.lastMissionCompletedDay, "2026-07-09");
  assert.equal(row.gamesPlayed, 3);
  assert.equal(row.gameStars, 2);
  assert.equal(row.questStars, 3);
  assert.equal(row.storyQuestsCompleted, 1);
  assert.equal(row.booksRead, 1);
  assert.equal(
    row.coinsEarned,
    earnedCoins({ questStars: 3, gameStars: 2, storiesDone: 1, booksRead: 1 }, 1),
    "coins earned match the wallet maths the child sees"
  );
  assert.equal(row.coinsSpent, 30);
  assert.equal(row.coinsBalance, row.coinsEarned - 30);
  assert.equal(row.chestCount, 1);
  assert.equal(engagementRowToCells(row)["Last Active Date"], "2026-07-09");
});

test("engagement row stays sane with no recorded progress", () => {
  const row = buildEngagementRow({ studentName: "New Reader", areas: {} });
  assert.equal(row.missionStreak, 0);
  assert.equal(row.gamesPlayed, 0);
  assert.equal(row.coinsSpent, 0);
  assert.equal(row.coinsEarned, earnedCoins({}, 0), "an untouched wallet still shows the welcome gift");
  assert.equal(row.lastActiveAt, "");
});

// ── Guided reading workbook boundary ────────────────────────────────────────

test("guided reading workbook contains only guided reading sheets and ignores unrelated options", async () => {
  const options = {
    students: [{ id: "s1", name: "Maya", class_id: "c1" }],
    classes: [{ id: "c1", name: "Class A" }],
    guidedReadingRecordsByStudent: [{
      studentId: "s1",
      records: {
        "book-1": {
          title: "The Red Hen",
          level: "A",
          completed: true,
          firstReadAt: "2026-05-01T00:00:00.000Z",
          lastReadAt: "2026-05-02T00:00:00.000Z",
          readCount: 4,
          completedPages: 4,
          totalPages: 4,
          pages: {}
        }
      }
    }],
    engagementByStudent: { s1: SAMPLE_AREAS },
    storyQuestProgressByStudent: { s1: SAMPLE_QUEST_PROGRESS },
    storyQuestCatalog: SAMPLE_QUEST_CATALOG
  };
  const data = buildGuidedReadingCompletionWorkbookData(options);

  const summary = data.studentSummaryRows.find(row => row.studentName === "Maya");
  assert.ok(summary, "student summary row exists");
  assert.equal(summary.lastGuidedReadingDate, "2026-05-02");
  assert.equal(data.studentCompletionRows.length, 1);
  assert.equal(data.booksCompletedRows.length, 1);
  assert.equal(data.totals.totalCompletedBooks, 1);
  assert.equal(data.studentCompletionRows[0].completionDate, "", "firstReadAt must never be invented as a completion date");
  assert.equal(data.studentCompletionRows[0].readCount, 4);
  assert.equal(data.studentCompletionRows[0].rereadCount, 3);
  assert.equal(data.summaryRows[0].totalGuidedReadingSessions, 4);
  assert.equal(data.totals.totalGuidedReadingSessions, 4);
  assert.equal(data.booksCompletedRows[0].totalReads, 4);
  assert.equal(data.booksCompletedRows[0].totalRereads, 3);
  assert.equal(data.booksCompletedRows[0].lastCompletedDate, "");
  assert.equal(summary.totalReads, 4);
  assert.equal(summary.totalRereads, 3);
  assert.equal(Object.hasOwn(summary, "lastActiveDate"), false);
  assert.equal(Object.hasOwn(data, "engagementRows"), false);
  assert.equal(Object.hasOwn(data, "storyQuestRows"), false);
  assert.ok(!data.reportInfoRows.some(row => /story|engagement/i.test(row.field)));
  assert.ok(!GUIDED_READING_COMPLETION_HEADERS.studentSummary.includes("Last Active Date"));

  const { workbook } = await createGuidedReadingCompletionWorkbook(options);
  const sheetNames = workbook.worksheets.map(sheet => sheet.name);
  assert.deepEqual(sheetNames, Object.values(GUIDED_READING_COMPLETION_SHEETS));
  assert.ok(!sheetNames.includes("Story Quests"));
  assert.ok(!sheetNames.includes("Engagement"));
});
