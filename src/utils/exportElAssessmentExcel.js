import {
  buildClassElAssessmentReportData,
  buildStudentElAssessmentReportData,
  getSavedElAssessmentReports,
  saveElAssessmentReport
} from "../data/elAssessmentReportStore.js";

export const EL_STUDENT_REPORT_SHEETS = [
  "Student Summary",
  "Skill Detail",
  "Letter Names & Sounds",
  "Advanced Phonics Patterns",
  "Pattern Detail",
  "Assessment Attempts",
  "Progress Over Time",
  "Comparison"
];

export const EL_CLASS_REPORT_SHEETS = [
  "Class Summary",
  "Student Overview",
  "Letter Sound Class Matrix",
  "Advanced Phonics Class Matrix",
  "Advanced Phonics Patterns",
  "Pattern Detail",
  "Skill Heatmap",
  "Skill Summary",
  "Small Groups",
  "Progress Comparison"
];

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function list(value) {
  return Array.isArray(value) ? value.join(", ") : String(value || "");
}

function yesNo(value) {
  return value ? "Yes" : "No";
}

function latestSkillSummary(report = {}, skillName = "") {
  const normalized = String(skillName || "").toLowerCase();
  const row = (report.skillRows || []).find(item =>
    String(item.skillName || "").toLowerCase() === normalized ||
    String(item.skillName || "").toLowerCase().includes(normalized)
  );
  return row || null;
}

function addRowsOrEmpty(sheet, rows, mapper) {
  if (!rows.length) {
    sheet.addRow(mapper(null));
    return;
  }
  rows.forEach(row => sheet.addRow(mapper(row)));
}

function cellSummary(cell = {}) {
  return `${cell.statusLabel || "Not assessed"}${cell.attempts ? ` (${cell.correct}/${cell.attempts})` : ""}`;
}

function cellCountSummary(group = {}) {
  return `M:${group.mastered || 0} D:${group.developing || 0} S:${group.needs_support || 0} NA:${group.not_assessed || 0}`;
}

function styleWorksheet(sheet) {
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEAF7EE" }
  };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.eachRow(row => {
    row.alignment = { vertical: "top", wrapText: true };
  });
}

function setColumns(sheet, headers, wideHeaders = []) {
  sheet.columns = headers.map(header => ({
    header,
    key: header,
    width: wideHeaders.includes(header) ? 38 : Math.max(16, Math.min(30, header.length + 8))
  }));
}

async function createWorkbook() {
  const module = await import("exceljs");
  const ExcelJS = module.default || module["module.exports"] || module;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "LiteracyPath";
  workbook.created = new Date();
  return workbook;
}

async function downloadWorkbook(workbook, fileName) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function createStudentElAssessmentWorkbook(report) {
  const workbook = await createWorkbook();

  const summarySheet = workbook.addWorksheet("Student Summary");
  setColumns(summarySheet, ["Field", "Value"], ["Value"]);
  [
    ["Student Name", report.studentName || "Unknown Student"],
    ["Class Name", report.className || "Unknown Class"],
    ["Report Date", formatDate(report.generatedAt)],
    ["Date Range", `${formatDate(report.dateRange?.start) || "No records"} to ${formatDate(report.dateRange?.end) || "No records"}`],
    ["Total Assessments", report.summary?.totalAssessments || 0],
    ["Average Accuracy", `${report.summary?.averageAccuracy || 0}%`],
    ["Skills Mastered", report.summary?.masteredSkillCount || 0],
    ["Skills Developing", report.summary?.developingSkillCount || 0],
    ["Skills Needing Support", report.summary?.needsSupportSkillCount || 0],
    ["Latest Letter Assessment", latestSkillSummary(report, "EL Letter Name and Sound")
      ? `${latestSkillSummary(report, "EL Letter Name and Sound").accuracy || 0}% on ${formatDate(latestSkillSummary(report, "EL Letter Name and Sound").lastAssessed)}`
      : "No letter assessment saved yet"],
    ["Latest Advanced Phonics Patterns", report.advancedPhonics?.attempts
      ? `${report.advancedPhonics.latestAccuracy || 0}% on ${formatDate(report.advancedPhonics.latestDate)}`
      : "No advanced phonics assessment saved yet"],
    ["Current Recommended Focus", list(report.summary?.focusSkills) || "No records yet"]
  ].forEach(row => summarySheet.addRow({ Field: row[0], Value: row[1] }));

  const skillSheet = workbook.addWorksheet("Skill Detail");
  setColumns(skillSheet, [
    "Skill Area",
    "Skill Name",
    "Current Level",
    "Attempts",
    "Accuracy",
    "Mastery Status",
    "Items Mastered",
    "Items Missed",
    "Last Assessed",
    "Recommended Next Step"
  ], ["Items Mastered", "Items Missed", "Recommended Next Step"]);
  addRowsOrEmpty(skillSheet, report.skillRows || [], row => row ? {
    "Skill Area": row.skillArea,
    "Skill Name": row.skillName,
    "Current Level": row.currentLevel,
    "Attempts": row.attempts,
    "Accuracy": `${row.accuracy || 0}%`,
    "Mastery Status": row.masteryStatus,
    "Items Mastered": list(row.itemsMastered),
    "Items Missed": list(row.itemsMissed),
    "Last Assessed": formatDate(row.lastAssessed),
    "Recommended Next Step": row.recommendedNextStep
  } : {
    "Skill Area": "No records yet",
    "Skill Name": "",
    "Current Level": "",
    "Attempts": 0,
    "Accuracy": "0%",
    "Mastery Status": "Not Assessed",
    "Items Mastered": "",
    "Items Missed": "",
    "Last Assessed": "",
    "Recommended Next Step": "Complete an assessment to gather evidence."
	  });

  const letterSheet = workbook.addWorksheet("Letter Names & Sounds");
  setColumns(letterSheet, [
    "Letter pair",
    "Uppercase name result",
    "Uppercase sound result",
    "Lowercase name result",
    "Lowercase sound result",
    "Uppercase name attempts",
    "Uppercase sound attempts",
    "Lowercase name attempts",
    "Lowercase sound attempts",
    "Last assessed",
    "Details / notes"
  ], ["Details / notes"]);
  addRowsOrEmpty(letterSheet, report.formalAssessments?.individualLetterMatrix || [], row => row ? {
    "Letter pair": row.letterPair,
    "Uppercase name result": row.uppercaseName.statusLabel,
    "Uppercase sound result": row.uppercaseSound.statusLabel,
    "Lowercase name result": row.lowercaseName.statusLabel,
    "Lowercase sound result": row.lowercaseSound.statusLabel,
    "Uppercase name attempts": row.uppercaseName.attempts,
    "Uppercase sound attempts": row.uppercaseSound.attempts,
    "Lowercase name attempts": row.lowercaseName.attempts,
    "Lowercase sound attempts": row.lowercaseSound.attempts,
    "Last assessed": formatDate(row.lastAssessed),
    "Details / notes": [
      `UC Name ${cellSummary(row.uppercaseName)}`,
      `UC Sound ${cellSummary(row.uppercaseSound)}`,
      `LC Name ${cellSummary(row.lowercaseName)}`,
      `LC Sound ${cellSummary(row.lowercaseSound)}`
    ].join("; ")
  } : {
    "Letter pair": "No Letter Name/Sound records yet",
    "Uppercase name result": "Not assessed",
    "Uppercase sound result": "Not assessed",
    "Lowercase name result": "Not assessed",
    "Lowercase sound result": "Not assessed",
    "Uppercase name attempts": 0,
    "Uppercase sound attempts": 0,
    "Lowercase name attempts": 0,
    "Lowercase sound attempts": 0,
    "Last assessed": "",
    "Details / notes": ""
  });

  const advancedSheet = workbook.addWorksheet("Advanced Phonics Patterns");
  setColumns(advancedSheet, [
    "Pattern",
    "Reading / recognition result",
    "Sound result",
    "Attempts",
    "Correct",
    "Incorrect",
    "Accuracy",
    "Status",
    "Example words",
    "Last assessed"
  ], ["Example words"]);
  addRowsOrEmpty(advancedSheet, report.formalAssessments?.individualAdvancedPhonicsMatrix || [], row => row ? {
    "Pattern": row.pattern,
    "Reading / recognition result": row.readingResult.statusLabel,
    "Sound result": row.soundResult.statusLabel,
    "Attempts": row.attempts,
    "Correct": row.correct,
    "Incorrect": row.incorrect,
    "Accuracy": `${row.accuracy || 0}%`,
    "Status": row.statusLabel,
    "Example words": list(row.exampleWords),
    "Last assessed": formatDate(row.lastAssessed)
  } : {
    "Pattern": "No Advanced Phonics Patterns records yet",
    "Reading / recognition result": "Not assessed",
    "Sound result": "Not assessed",
    "Attempts": 0,
    "Correct": 0,
    "Incorrect": 0,
    "Accuracy": "0%",
    "Status": "Not assessed",
    "Example words": "",
    "Last assessed": ""
  });

  const patternSheet = workbook.addWorksheet("Pattern Detail");
  setColumns(patternSheet, [
    "Pattern",
    "Attempts",
    "Correct",
    "Incorrect",
    "Accuracy",
    "Status",
    "Example Words",
    "Latest Date"
  ], ["Example Words"]);
  addRowsOrEmpty(patternSheet, report.patternDetailRows || [], row => row ? {
    "Pattern": row.pattern,
    "Attempts": row.attempts,
    "Correct": row.correct,
    "Incorrect": row.incorrect,
    "Accuracy": `${row.accuracy || 0}%`,
    "Status": row.status,
    "Example Words": list(row.examples),
    "Latest Date": formatDate(row.latestDate)
  } : {
    "Pattern": "No Advanced Phonics Patterns records yet",
    "Attempts": 0,
    "Correct": 0,
    "Incorrect": 0,
    "Accuracy": "0%",
    "Status": "Not Assessed",
    "Example Words": "",
    "Latest Date": ""
  });

  const attemptsSheet = workbook.addWorksheet("Assessment Attempts");
  setColumns(attemptsSheet, [
    "Date",
    "Skill",
    "Level",
    "Questions",
    "Correct",
    "Accuracy",
    "Passed / Needs Retry / Mastered",
    "Items Covered",
    "Missed Items"
  ], ["Items Covered", "Missed Items"]);
  addRowsOrEmpty(attemptsSheet, report.attemptRows || [], row => row ? {
    "Date": formatDate(row.date),
    "Skill": row.skill,
    "Level": row.level,
    "Questions": row.questions,
    "Correct": row.correct,
    "Accuracy": `${row.accuracy || 0}%`,
    "Passed / Needs Retry / Mastered": row.status,
    "Items Covered": list(row.itemsCovered),
    "Missed Items": list(row.missedItems)
  } : {
    "Date": "No records yet",
    "Skill": "",
    "Level": "",
    "Questions": 0,
    "Correct": 0,
    "Accuracy": "0%",
    "Passed / Needs Retry / Mastered": "",
    "Items Covered": "",
    "Missed Items": ""
  });

  const progressSheet = workbook.addWorksheet("Progress Over Time");
  setColumns(progressSheet, ["Date", "Skill", "Accuracy", "Mastered Skill Count", "Level", "Notes"], ["Notes"]);
  addRowsOrEmpty(progressSheet, report.progressRows || [], row => row ? {
    "Date": formatDate(row.date),
    "Skill": row.skill,
    "Accuracy": `${row.accuracy || 0}%`,
    "Mastered Skill Count": row.masteredSkillCount,
    "Level": row.level,
    "Notes": row.notes
  } : {
    "Date": "No records yet",
    "Skill": "",
    "Accuracy": "0%",
    "Mastered Skill Count": 0,
    "Level": "",
    "Notes": "No assessment progress data yet."
  });

  const comparisonSheet = workbook.addWorksheet("Comparison");
  setColumns(comparisonSheet, [
    "Previous Report Date",
    "Current Report Date",
    "Accuracy Change",
    "Newly Mastered Skills",
    "Skills Still Needing Support",
    "Suggested Teacher Action"
  ], ["Newly Mastered Skills", "Skills Still Needing Support", "Suggested Teacher Action"]);
  const comparison = report.comparison || {};
  comparisonSheet.addRow({
    "Previous Report Date": formatDate(comparison.previousGeneratedAt) || "No previous report available yet.",
    "Current Report Date": formatDate(report.generatedAt),
    "Accuracy Change": `${comparison.accuracyChange || 0}%`,
    "Newly Mastered Skills": list(comparison.newlyMasteredSkills),
    "Skills Still Needing Support": list(comparison.persistentFocusSkills || report.summary?.focusSkills),
    "Suggested Teacher Action": comparison.note || "Review focus skills and update small-group practice."
  });

  workbook.worksheets.forEach(styleWorksheet);
  return workbook;
}

export async function createClassElAssessmentWorkbook(report) {
  const workbook = await createWorkbook();

  const summarySheet = workbook.addWorksheet("Class Summary");
  setColumns(summarySheet, ["Field", "Value"], ["Value"]);
  [
    ["Class Name", report.className || "Unknown Class"],
    ["Report Date", formatDate(report.generatedAt)],
    ["Date Range", `${formatDate(report.dateRange?.start) || "No records"} to ${formatDate(report.dateRange?.end) || "No records"}`],
    ["Total Students", report.summary?.totalStudents || report.studentRows?.length || 0],
    ["Total Assessments", report.summary?.totalAssessments || 0],
    ["Class Average Accuracy", `${report.summary?.averageAccuracy || 0}%`],
    ["Advanced Phonics Attempts", report.advancedPhonics?.attempts || 0],
    ["Latest Advanced Phonics Accuracy", report.advancedPhonics?.attempts ? `${report.advancedPhonics.latestAccuracy || 0}%` : "No records yet"],
    ["Strongest Skills", list(report.summary?.strongestSkills) || "No records yet"],
    ["Weakest Skills", list(report.summary?.focusSkills) || "No records yet"],
    ["Students Needing Support", list(report.summary?.studentsNeedingSupport) || "No records yet"],
    ["Students Ready for Challenge", list(report.summary?.studentsReadyForChallenge) || "No records yet"]
  ].forEach(row => summarySheet.addRow({ Field: row[0], Value: row[1] }));

  const studentSheet = workbook.addWorksheet("Student Overview");
  setColumns(studentSheet, [
    "Student Name",
    "Assessments Completed",
    "Average Accuracy",
    "Skills Mastered",
    "Skills Developing",
    "Skills Needing Support",
    "Current Level / Stage",
    "Last Assessment Date",
    "Recommended Focus"
  ], ["Recommended Focus"]);
  addRowsOrEmpty(studentSheet, report.studentRows || [], row => row ? {
    "Student Name": row.studentName,
    "Assessments Completed": row.assessmentsCompleted,
    "Average Accuracy": `${row.averageAccuracy || 0}%`,
    "Skills Mastered": row.skillsMastered,
    "Skills Developing": row.skillsDeveloping,
    "Skills Needing Support": row.skillsNeedingSupport,
    "Current Level / Stage": row.currentLevel,
    "Last Assessment Date": formatDate(row.lastAssessmentDate),
    "Recommended Focus": row.recommendedFocus
  } : {
    "Student Name": "No records yet",
    "Assessments Completed": 0,
    "Average Accuracy": "0%",
    "Skills Mastered": 0,
    "Skills Developing": 0,
    "Skills Needing Support": 0,
    "Current Level / Stage": "",
    "Last Assessment Date": "",
    "Recommended Focus": "Complete assessments to populate this report."
	  });

  const classLetterSheet = workbook.addWorksheet("Letter Sound Class Matrix");
  setColumns(classLetterSheet, [
    "Letter pair",
    "UC name counts",
    "UC sound counts",
    "LC name counts",
    "LC sound counts",
    "UC name support students",
    "UC sound support students",
    "LC name support students",
    "LC sound support students"
  ], [
    "UC name support students",
    "UC sound support students",
    "LC name support students",
    "LC sound support students"
  ]);
  addRowsOrEmpty(classLetterSheet, report.formalAssessments?.classLetterMatrix || [], row => row ? {
    "Letter pair": row.letterPair,
    "UC name counts": cellCountSummary(row.uppercaseName),
    "UC sound counts": cellCountSummary(row.uppercaseSound),
    "LC name counts": cellCountSummary(row.lowercaseName),
    "LC sound counts": cellCountSummary(row.lowercaseSound),
    "UC name support students": list(row.uppercaseName.supportStudents),
    "UC sound support students": list(row.uppercaseSound.supportStudents),
    "LC name support students": list(row.lowercaseName.supportStudents),
    "LC sound support students": list(row.lowercaseSound.supportStudents)
  } : {
    "Letter pair": "No Letter Name/Sound records yet",
    "UC name counts": "M:0 D:0 S:0 NA:0",
    "UC sound counts": "M:0 D:0 S:0 NA:0",
    "LC name counts": "M:0 D:0 S:0 NA:0",
    "LC sound counts": "M:0 D:0 S:0 NA:0",
    "UC name support students": "",
    "UC sound support students": "",
    "LC name support students": "",
    "LC sound support students": ""
  });

  const classAdvancedMatrixSheet = workbook.addWorksheet("Advanced Phonics Class Matrix");
  setColumns(classAdvancedMatrixSheet, [
    "Pattern",
    "Attempted students",
    "Mastered students",
    "Developing students",
    "Needs support students",
    "Not assessed students",
    "Mastery percentage",
    "Students needing support"
  ], ["Students needing support"]);
  addRowsOrEmpty(classAdvancedMatrixSheet, report.formalAssessments?.classAdvancedPhonicsMatrix || [], row => row ? {
    "Pattern": row.pattern,
    "Attempted students": row.attemptedStudents,
    "Mastered students": row.masteredStudents,
    "Developing students": row.developingStudents,
    "Needs support students": row.needsSupportStudents,
    "Not assessed students": row.notAssessedStudents,
    "Mastery percentage": `${row.masteryPercentage || 0}%`,
    "Students needing support": list(row.studentsNeedingSupport)
  } : {
    "Pattern": "No Advanced Phonics Patterns records yet",
    "Attempted students": 0,
    "Mastered students": 0,
    "Developing students": 0,
    "Needs support students": 0,
    "Not assessed students": 0,
    "Mastery percentage": "0%",
    "Students needing support": ""
  });

  const advancedSheet = workbook.addWorksheet("Advanced Phonics Patterns");
  setColumns(advancedSheet, ["Field", "Value"], ["Value"]);
  [
    ["Class Name", report.className || "Unknown Class"],
    ["Attempts", report.advancedPhonics?.attempts || 0],
    ["Latest Attempt Date", formatDate(report.advancedPhonics?.latestDate) || "No records yet"],
    ["Latest Accuracy", `${report.advancedPhonics?.latestAccuracy || 0}%`],
    ["Mastered Patterns", list(report.advancedPhonics?.masteredPatterns)],
    ["Developing Patterns", list(report.advancedPhonics?.developingPatterns)],
    ["Needs Support Patterns", list(report.advancedPhonics?.needsSupportPatterns)]
  ].forEach(row => advancedSheet.addRow({ Field: row[0], Value: row[1] || "None yet" }));

  const patternSheet = workbook.addWorksheet("Pattern Detail");
  setColumns(patternSheet, [
    "Student",
    "Class",
    "Pattern",
    "Attempts",
    "Correct",
    "Incorrect",
    "Accuracy",
    "Status",
    "Example Words",
    "Latest Date"
  ], ["Example Words"]);
  addRowsOrEmpty(patternSheet, report.patternDetailRows || [], row => row ? {
    "Student": row.studentName,
    "Class": row.className,
    "Pattern": row.pattern,
    "Attempts": row.attempts,
    "Correct": row.correct,
    "Incorrect": row.incorrect,
    "Accuracy": `${row.accuracy || 0}%`,
    "Status": row.status,
    "Example Words": list(row.examples),
    "Latest Date": formatDate(row.latestDate)
  } : {
    "Student": "No Advanced Phonics Patterns records yet",
    "Class": "",
    "Pattern": "",
    "Attempts": 0,
    "Correct": 0,
    "Incorrect": 0,
    "Accuracy": "0%",
    "Status": "Not Assessed",
    "Example Words": "",
    "Latest Date": ""
  });

  const heatmapSheet = workbook.addWorksheet("Skill Heatmap");
  const skillNames = Object.keys(report.heatmapRows?.[0]?.values || {});
  setColumns(heatmapSheet, ["Student", ...skillNames], skillNames);
  addRowsOrEmpty(heatmapSheet, report.heatmapRows || [], row => row ? {
    Student: row.studentName,
    ...row.values
  } : {
    Student: "No records yet"
  });

  const skillSheet = workbook.addWorksheet("Skill Summary");
  setColumns(skillSheet, [
    "Skill Area",
    "Skill Name",
    "Students Mastered",
    "Students Developing",
    "Students Needing Support",
    "Not Assessed",
    "Class Average Accuracy",
    "Suggested Small Group"
  ], ["Suggested Small Group"]);
  addRowsOrEmpty(skillSheet, report.skillRows || [], row => row ? {
    "Skill Area": row.skillArea,
    "Skill Name": row.skillName,
    "Students Mastered": row.studentsMastered,
    "Students Developing": row.studentsDeveloping,
    "Students Needing Support": row.studentsNeedingSupport,
    "Not Assessed": row.notAssessed,
    "Class Average Accuracy": `${row.classAverageAccuracy || 0}%`,
    "Suggested Small Group": row.suggestedSmallGroup
  } : {
    "Skill Area": "No records yet",
    "Skill Name": "",
    "Students Mastered": 0,
    "Students Developing": 0,
    "Students Needing Support": 0,
    "Not Assessed": 0,
    "Class Average Accuracy": "0%",
    "Suggested Small Group": ""
  });

  const groupsSheet = workbook.addWorksheet("Small Groups");
  setColumns(groupsSheet, ["Group Name / Focus", "Skill", "Students", "Reason", "Suggested Activity / Next Step"], ["Students", "Reason", "Suggested Activity / Next Step"]);
  addRowsOrEmpty(groupsSheet, report.smallGroups || [], row => row ? {
    "Group Name / Focus": row.groupName,
    "Skill": row.skill,
    "Students": list(row.students),
    "Reason": row.reason,
    "Suggested Activity / Next Step": row.suggestedActivity
  } : {
    "Group Name / Focus": "No groups yet",
    "Skill": "",
    "Students": "",
    "Reason": "No assessment records yet.",
    "Suggested Activity / Next Step": "Complete assessments to create small groups."
  });

  const comparisonSheet = workbook.addWorksheet("Progress Comparison");
  setColumns(comparisonSheet, [
    "Previous Report Date",
    "Current Report Date",
    "Class Accuracy Change",
    "Mastered Count Change",
    "New Class Strengths",
    "Persistent Class Gaps",
    "Students With Strong Growth",
    "Students Needing Follow-up"
  ], ["New Class Strengths", "Persistent Class Gaps", "Students With Strong Growth", "Students Needing Follow-up"]);
  const comparison = report.comparison || {};
  comparisonSheet.addRow({
    "Previous Report Date": formatDate(comparison.previousGeneratedAt) || "No previous report available yet.",
    "Current Report Date": formatDate(report.generatedAt),
    "Class Accuracy Change": `${comparison.accuracyChange || 0}%`,
    "Mastered Count Change": comparison.masteredSkillChange || 0,
    "New Class Strengths": list(comparison.newlyMasteredSkills || report.summary?.strongestSkills),
    "Persistent Class Gaps": list(comparison.persistentFocusSkills || report.summary?.focusSkills),
    "Students With Strong Growth": "",
    "Students Needing Follow-up": list(report.summary?.studentsNeedingSupport)
  });

  workbook.worksheets.forEach(styleWorksheet);
  return workbook;
}

export async function exportStudentElAssessmentExcel(options = {}) {
  const previousReports = getSavedElAssessmentReports({
    teacherId: options.teacherId || "local",
    reportType: "individual",
    classId: options.classId || "",
    studentId: options.studentId || ""
  });
  const report = buildStudentElAssessmentReportData({ ...options, previousReports });
  const workbook = await createStudentElAssessmentWorkbook(report);
  await downloadWorkbook(workbook, report.fileName);
  await saveElAssessmentReport(report, options);
  return report;
}

export async function exportClassElAssessmentExcel(options = {}) {
  const previousReports = getSavedElAssessmentReports({
    teacherId: options.teacherId || "local",
    reportType: "whole_class",
    classId: options.classId || ""
  });
  const report = buildClassElAssessmentReportData({ ...options, previousReports });
  const workbook = await createClassElAssessmentWorkbook(report);
  await downloadWorkbook(workbook, report.fileName);
  await saveElAssessmentReport(report, options);
  return report;
}

export async function downloadElAssessmentReport(report = {}) {
  const workbook = report.reportType === "individual"
    ? await createStudentElAssessmentWorkbook(report)
    : await createClassElAssessmentWorkbook(report);
  await downloadWorkbook(workbook, report.fileName || `el-assessment-report-${formatDate(new Date())}.xlsx`);
  return report;
}
