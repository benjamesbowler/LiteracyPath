import {
  buildClassElAssessmentReportData,
  buildStudentElAssessmentReportData,
  getSavedElAssessmentReports,
  saveElAssessmentReport
} from "../data/elAssessmentReportStore.js";
import {
  buildRecommendations,
  buildWeeklyAccuracy,
  formatItemLabel,
  getSkillArea,
  normalizeItemMasteryRows
} from "../data/reportingSystem.js";

export const EL_STUDENT_REPORT_SHEETS = [
  "Student Summary",
  "Assessment Attempts",
  "Progress Over Time",
  "Skills Detail",
  "Item Mastery Detail",
  "Letter Names & Sounds",
  "Guided Reading",
  "Next Session Plan",
  "Advanced Phonics Patterns",
  "Pattern Detail",
  "Comparison"
];

export const EL_CLASS_REPORT_SHEETS = [
  "Class Summary",
  "Student Overview",
  "Skill Heatmap",
  "Weak Points & Groups",
  "Class Progress Over Time",
  "Per-Student Skill Detail",
  "Letter Sound Class Matrix",
  "Advanced Phonics Class Matrix",
  "Advanced Phonics Patterns",
  "Pattern Detail",
  "Skill Summary"
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

const EXPORT_COLORS = {
  navy: "FF1F3A5F",
  teal: "FF0F766E",
  blue: "FF2563EB",
  amber: "FFF59E0B",
  purple: "FF7C3AED",
  greenSoft: "FFD9FBE8",
  amberSoft: "FFFFF1C2",
  redSoft: "FFFFDADA",
  blueSoft: "FFDCEBFF",
  greySoft: "FFE5E7EB",
  white: "FFFFFFFF"
};

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

function getReportStudentName(student = {}) {
  return student.name || student.studentName || "Unknown Student";
}

function buildClassWeakPointRows(report = {}) {
  const records = report.sourceSnapshot?.records || [];
  const students = report.sourceSnapshot?.students || [];
  const studentIds = students.map(student => student.id).filter(Boolean);
  const studentNameById = new Map(students.map(student => [student.id, getReportStudentName(student)]));
  const denominator = Math.max(studentIds.length, 1);
  const rowsByKey = new Map();

  studentIds.forEach(studentId => {
    const studentRecords = records.filter(record => record.studentId === studentId);
    normalizeItemMasteryRows({}, studentRecords)
      .filter(row => row.attempts > 0 && row.accuracy < 70)
      .forEach(row => {
        const key = `${row.itemType}::${row.itemKey}`;
        const existing = rowsByKey.get(key) || {
          skillArea: getSkillArea({ skillId: row.skillId, skillName: row.skillName }).label,
          skillName: row.skillName,
          itemType: row.itemType,
          itemKey: row.itemKey,
          itemLabel: formatItemLabel(row.itemType, row.itemKey),
          attempts: 0,
          correct: 0,
          studentNames: new Set()
        };
        existing.attempts += row.attempts;
        existing.correct += row.correct;
        existing.studentNames.add(studentNameById.get(studentId) || studentId);
        rowsByKey.set(key, existing);
      });
  });

  return Array.from(rowsByKey.values())
    .map(row => ({
      ...row,
      accuracy: row.attempts ? Math.round((row.correct / row.attempts) * 100) : 0,
      supportStudentCount: row.studentNames.size,
      supportShare: Math.round((row.studentNames.size / denominator) * 100),
      studentNames: Array.from(row.studentNames).sort()
    }))
    .filter(row => row.supportShare >= 30 || row.accuracy < 70)
    .sort((a, b) =>
      b.supportShare - a.supportShare ||
      a.accuracy - b.accuracy ||
      a.itemLabel.localeCompare(b.itemLabel)
    )
    .slice(0, 12);
}

function cellCountSummary(group = {}) {
  return `M:${group.mastered || 0} D:${group.developing || 0} S:${group.needs_support || 0} NA:${group.not_assessed || 0}`;
}

function parsePercent(value) {
  const match = String(value ?? "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function fillForAccuracy(value) {
  const percent = parsePercent(value);
  if (percent === null) return null;
  if (percent >= 80) return EXPORT_COLORS.greenSoft;
  if (percent >= 60) return EXPORT_COLORS.amberSoft;
  return EXPORT_COLORS.redSoft;
}

function fillForStatus(value) {
  const normalized = String(value || "").toLowerCase();
  if (/pass|master|on track|yes|correct/.test(normalized)) return EXPORT_COLORS.greenSoft;
  if (/develop|current|progress|attempt|retry/.test(normalized)) return EXPORT_COLORS.amberSoft;
  if (/support|miss|incorrect|no|risk/.test(normalized)) return EXPORT_COLORS.redSoft;
  if (/not|unseen|reached/.test(normalized)) return EXPORT_COLORS.greySoft;
  return null;
}

function applyFill(cell, color) {
  if (!color) return;
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: color }
  };
}

function styleWorksheet(sheet) {
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: EXPORT_COLORS.white } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: EXPORT_COLORS.navy }
  };
  headerRow.alignment = { vertical: "middle", wrapText: true };
  headerRow.height = 24;
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  if (sheet.columnCount > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet.columnCount }
    };
  }
  sheet.properties.defaultRowHeight = 20;
  sheet.getColumn(1).font = { bold: true };
  sheet.eachRow((row, rowNumber) => {
    row.alignment = { vertical: "top", wrapText: true };
    if (rowNumber === 1) return;
    row.eachCell((cell, columnNumber) => {
      const header = String(sheet.getRow(1).getCell(columnNumber).value || "").toLowerCase();
      if (header.includes("accuracy")) applyFill(cell, fillForAccuracy(cell.value));
      if (header.includes("status") || header.includes("passed") || header.includes("result")) applyFill(cell, fillForStatus(cell.value));
    });
  });
}

function styleSummarySheet(sheet, accent = EXPORT_COLORS.teal) {
  sheet.getColumn(1).width = 30;
  sheet.getColumn(2).width = 56;
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: accent }
  };
  sheet.views = [{ state: "frozen", ySplit: 1, showGridLines: false }];
}

function stylePrintPlanSheet(sheet) {
  sheet.views = [{ showGridLines: false }];
  sheet.getColumn(1).width = 24;
  sheet.getColumn(2).width = 82;
  sheet.eachRow((row, rowNumber) => {
    row.height = rowNumber === 1 ? 28 : 42;
    row.alignment = { vertical: "top", wrapText: true };
  });
}

function orderWorksheets(workbook, preferredOrder = []) {
  if (!Array.isArray(workbook._worksheets)) return;
  const order = new Map(preferredOrder.map((name, index) => [name, index]));
  const sheets = workbook.worksheets.slice().sort((a, b) => {
    const aOrder = order.has(a.name) ? order.get(a.name) : 1000;
    const bOrder = order.has(b.name) ? order.get(b.name) : 1000;
    return aOrder - bOrder || a.name.localeCompare(b.name);
  });
  sheets.forEach((sheet, index) => {
    sheet.orderNo = index + 1;
  });
  workbook._worksheets = [undefined, ...sheets];
}

function applyWorkbookPresentation(workbook, preferredOrder = []) {
  const tabColors = {
    "Student Summary": EXPORT_COLORS.teal,
    "Class Summary": EXPORT_COLORS.teal,
    "Assessment Attempts": EXPORT_COLORS.blue,
    "Progress Over Time": EXPORT_COLORS.blue,
    "Class Progress Over Time": EXPORT_COLORS.blue,
    "Skills Detail": EXPORT_COLORS.purple,
    "Skill Heatmap": EXPORT_COLORS.purple,
    "Item Mastery Detail": EXPORT_COLORS.amber,
    "Weak Points & Groups": "FFDC2626",
    "Guided Reading": "FF16A34A",
    "Next Session Plan": EXPORT_COLORS.navy
  };
  workbook.worksheets.forEach(sheet => {
    styleWorksheet(sheet);
    if (tabColors[sheet.name]) {
      sheet.properties.tabColor = { argb: tabColors[sheet.name] };
    }
    if (sheet.name.includes("Summary")) styleSummarySheet(sheet, tabColors[sheet.name] || EXPORT_COLORS.teal);
    if (sheet.name === "Next Session Plan") stylePrintPlanSheet(sheet);
  });
  orderWorksheets(workbook, preferredOrder);
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
  workbook.creator = "Literacy Guide";
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

  const skillSheet = workbook.addWorksheet("Skills Detail");
  setColumns(skillSheet, [
    "Skill #",
    "Skill Name",
    "Skill Area",
    "Status",
    "Last Checkpoint Score",
    "Checkpoint Accuracy%",
    "Coverage",
    "Items Mastered",
    "Items Developing",
    "Items Needing Support",
    "Last Assessed Date"
  ], ["Items Mastered", "Items Developing", "Items Needing Support"]);
  addRowsOrEmpty(skillSheet, (report.skillRows || []).map((row, index) => ({ ...row, index: index + 1 })), row => row ? {
    "Skill #": row.index,
    "Skill Name": row.skillName,
    "Skill Area": row.skillArea,
    "Status": row.masteryStatus,
    "Last Checkpoint Score": row.totalQuestions ? `${row.correctCount}/${row.totalQuestions}` : "",
    "Checkpoint Accuracy%": `${row.accuracy || 0}%`,
    "Coverage": `${(row.itemsMastered || []).length}/${Math.max((row.itemsMastered || []).length + (row.itemsMissed || []).length, row.totalQuestions || 0)} items`,
    "Items Mastered": list(row.itemsMastered),
    "Items Developing": row.masteryStatus === "Developing" ? list(row.itemsMissed) : "",
    "Items Needing Support": row.masteryStatus === "Needs Support" ? list(row.itemsMissed) : "",
    "Last Assessed Date": formatDate(row.lastAssessed)
  } : {
    "Skill #": "",
    "Skill Name": "",
    "Skill Area": "No records yet",
    "Status": "Not Assessed",
    "Last Checkpoint Score": "",
    "Checkpoint Accuracy%": "0%",
    "Coverage": "",
    "Items Mastered": "",
    "Items Developing": "",
    "Items Needing Support": "",
    "Last Assessed Date": ""
	  });

  const itemRows = normalizeItemMasteryRows({}, report.sourceSnapshot?.records || []);
  const itemSheet = workbook.addWorksheet("Item Mastery Detail");
  setColumns(itemSheet, [
    "Skill Area",
    "Skill",
    "Item Type",
    "Item Key",
    "Item",
    "Status",
    "Attempts",
    "Correct",
    "Accuracy",
    "Examples",
    "Needs Support Examples",
    "Last Assessed"
  ], ["Examples", "Needs Support Examples"]);
  addRowsOrEmpty(itemSheet, itemRows, row => row ? {
    "Skill Area": getSkillArea({ skillId: row.skillId, skillName: row.skillName }).label,
    "Skill": row.skillName,
    "Item Type": row.itemTypeLabel,
    "Item Key": row.itemKey,
    "Item": formatItemLabel(row.itemType, row.itemKey),
    "Status": row.statusLabel,
    "Attempts": row.attempts,
    "Correct": row.correct,
    "Accuracy": `${row.accuracy || 0}%`,
    "Examples": list(row.examples),
    "Needs Support Examples": list(row.missedExamples),
    "Last Assessed": formatDate(row.lastAssessed)
  } : {
    "Skill Area": "No item mastery records yet",
    "Skill": "No item mastery records yet",
    "Item Type": "",
    "Item Key": "",
    "Item": "",
    "Status": "Not assessed",
    "Attempts": 0,
    "Correct": 0,
    "Accuracy": "0%",
    "Examples": "",
    "Needs Support Examples": "",
    "Last Assessed": ""
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
    "Phase",
    "Questions",
    "Correct",
    "Accuracy%",
    "Passed",
    "Items Mastered",
    "Items Missed",
    "Notes"
  ], ["Items Mastered", "Items Missed", "Notes"]);
  addRowsOrEmpty(attemptsSheet, report.attemptRows || [], row => row ? {
    "Date": formatDate(row.date),
    "Skill": row.skill,
    "Level": row.level,
    "Phase": row.phase,
    "Questions": row.questions,
    "Correct": row.correct,
    "Accuracy%": `${row.accuracy || 0}%`,
    "Passed": yesNo(row.passed),
    "Items Mastered": list(row.itemsMastered || row.itemsCovered),
    "Items Missed": list(row.missedItems),
    "Notes": row.notes
  } : {
    "Date": "No records yet",
    "Skill": "",
    "Level": "",
    "Phase": "",
    "Questions": 0,
    "Correct": 0,
    "Accuracy%": "0%",
    "Passed": "No",
    "Items Mastered": "",
    "Items Missed": "",
    "Notes": ""
  });

  const progressSheet = workbook.addWorksheet("Progress Over Time");
  setColumns(progressSheet, ["Date", "Skill", "Accuracy%", "5-session rolling average", "Skills Passed", "Checkpoint Passed"], []);
  progressSheet.addRow({
    Date: "Select columns A-E and insert a line chart for a visual trend",
    Skill: "",
    "Accuracy%": "",
    "5-session rolling average": "",
    "Skills Passed": "",
    "Checkpoint Passed": ""
  });
  addRowsOrEmpty(progressSheet, report.progressRows || [], row => row ? {
    "Date": formatDate(row.date),
    "Skill": row.skill,
    "Accuracy%": `${row.accuracy || 0}%`,
    "5-session rolling average": `${row.rollingAverage || row.accuracy || 0}%`,
    "Skills Passed": row.masteredSkillCount,
    "Checkpoint Passed": yesNo(row.checkpointPassed)
  } : {
    "Date": "No records yet",
    "Skill": "",
    "Accuracy%": "0%",
    "5-session rolling average": "0%",
    "Skills Passed": 0,
    "Checkpoint Passed": "No"
  });
  const firstProgress = report.progressRows?.[0];
  const latestProgress = report.progressRows?.at(-1);
  progressSheet.addRow({
    Date: "Summary",
    Skill: `${formatDate(firstProgress?.date) || "No records"} to ${formatDate(latestProgress?.date) || "No records"}`,
    "Accuracy%": latestProgress && firstProgress ? `${Number(latestProgress.accuracy || 0) - Number(firstProgress.accuracy || 0)}% change` : "0% change",
    "5-session rolling average": "",
    "Skills Passed": latestProgress?.masteredSkillCount || 0,
    "Checkpoint Passed": ""
  });

  const guidedReadingSheet = workbook.addWorksheet("Guided Reading");
  setColumns(guidedReadingSheet, [
    "Book Title",
    "Level",
    "Type",
    "Read Count",
    "Latest Accuracy",
    "Correct Words",
    "Support Words",
    "Notes",
    "Last Read"
  ], ["Book Title", "Correct Words", "Support Words", "Notes"]);
  addRowsOrEmpty(guidedReadingSheet, report.guidedReading?.bookRows || [], row => row ? {
    "Book Title": row.title,
    "Level": row.level,
    "Type": row.type,
    "Read Count": row.readCount || row.rereadCount + 1 || 0,
    "Latest Accuracy": `${row.latestAccuracy || row.accuracy || 0}%`,
    "Correct Words": list(row.correctWords),
    "Support Words": list(row.supportWords),
    "Notes": list(row.notes),
    "Last Read": formatDate(row.lastReadAt || row.completionDate)
  } : {
    "Book Title": "No guided reading records yet",
    "Level": "",
    "Type": "",
    "Read Count": 0,
    "Latest Accuracy": "0%",
    "Correct Words": "",
    "Support Words": "",
    "Notes": "",
    "Last Read": ""
  });

  const recommendation = buildRecommendations({
    itemRows,
    currentStage: {
      id: report.skillRows?.find(row => row.masteryStatus === "Needs Support")?.skillId || report.skillRows?.[0]?.skillId || "",
      label: report.summary?.focusSkills?.[0] || report.skillRows?.find(row => row.masteryStatus === "Needs Support")?.skillName || report.skillRows?.[0]?.skillName || ""
    },
    assessmentHistory: report.sourceSnapshot?.records || []
  });
  const nextPlanSheet = workbook.addWorksheet("Next Session Plan");
  setColumns(nextPlanSheet, ["Section", "Detail"], ["Detail"]);
  [
    ["Student", report.studentName || "Unknown Student"],
    ["Date", formatDate(report.generatedAt)],
    ["Recommended Skill", recommendation.recommendedSkill],
    ["Reason", recommendation.reason],
    ["Teaching Note", recommendation.teachingNote],
    ["Focus Items", recommendation.focusItems.map(row => `${row.label}: ${row.teachingNote}`).join("\n") || "Start with a short checkpoint to gather evidence."],
    ["Quick Wins", list(recommendation.quickWins) || "No quick-win items yet"],
    ["Caution Flags", list(recommendation.cautionFlags) || "No caution flags at this time"]
  ].forEach(row => nextPlanSheet.addRow({ Section: row[0], Detail: row[1] }));

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

  applyWorkbookPresentation(workbook, EL_STUDENT_REPORT_SHEETS);
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
  const supportCount = report.studentRows?.filter(row => row.skillsNeedingSupport > 0 || row.averageAccuracy < 65).length || 0;
  const developingCount = report.studentRows?.filter(row => row.averageAccuracy >= 65 && row.averageAccuracy < 80).length || 0;
  const onTrackCount = Math.max(0, (report.studentRows?.length || 0) - supportCount - developingCount);
  summarySheet.addRow({ Field: "Status Distribution", Value: "" });
  [
    ["On Track", onTrackCount],
    ["Developing", developingCount],
    ["Needs Support", supportCount]
  ].forEach(([label, count]) => summarySheet.addRow({
    Field: label,
    Value: `${count} (${report.studentRows?.length ? Math.round((count / report.studentRows.length) * 100) : 0}%)`
  }));

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
  const heatmapSkillNames = Object.keys(report.heatmapRows?.[0]?.values || {});
  const heatmapStudentNames = (report.heatmapRows || []).map(row => row.studentName);
  setColumns(heatmapSheet, ["Skill", ...heatmapStudentNames, "Students Passed"], heatmapStudentNames);
  if (heatmapSkillNames.length) {
    heatmapSkillNames.forEach(skillName => {
      const values = Object.fromEntries((report.heatmapRows || []).map(studentRow => [
        studentRow.studentName,
        studentRow.values?.[skillName] === "Mastered"
          ? "✓ Passed"
          : studentRow.values?.[skillName] && studentRow.values[skillName] !== "Not Assessed"
            ? studentRow.values[skillName]
            : "–"
      ]));
      heatmapSheet.addRow({
        Skill: skillName,
        ...values,
        "Students Passed": Object.values(values).filter(value => String(value).includes("Passed")).length
      });
    });
    heatmapSheet.addRow({
      Skill: "Column totals",
      ...Object.fromEntries((report.heatmapRows || []).map(studentRow => [
        studentRow.studentName,
        Object.values(studentRow.values || {}).filter(value => value === "Mastered").length
      ])),
      "Students Passed": ""
    });
  } else {
    heatmapSheet.addRow({ Skill: "No records yet" });
  }

  const classProgressSheet = workbook.addWorksheet("Class Progress Over Time");
  setColumns(classProgressSheet, ["Week Start Date", "Class Average Accuracy%", "Checkpoints Passed", "New Skills Started", "Note"], ["Note"]);
  classProgressSheet.addRow({
    "Week Start Date": "Chart note",
    "Class Average Accuracy%": "Use columns A-C for a weekly class progress line chart.",
    "Checkpoints Passed": "",
    "New Skills Started": "",
    "Note": ""
  });
  const weeklyRows = buildWeeklyAccuracy(report.sourceSnapshot?.records || []);
  addRowsOrEmpty(classProgressSheet, weeklyRows, row => row ? {
    "Week Start Date": row.weekStart,
    "Class Average Accuracy%": `${row.accuracy || 0}%`,
    "Checkpoints Passed": (report.sourceSnapshot?.records || []).filter(record => {
      const date = new Date(record.completedAt);
      if (!record.passed || !Number.isFinite(date.getTime())) return false;
      const weekStart = new Date(row.weekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return date >= weekStart && date < weekEnd;
    }).length,
    "New Skills Started": new Set((report.sourceSnapshot?.records || []).filter(record => {
      const date = new Date(record.completedAt);
      if (!Number.isFinite(date.getTime())) return false;
      const weekStart = new Date(row.weekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return date >= weekStart && date < weekEnd;
    }).map(record => record.skillName)).size,
    "Note": `${row.attempts} assessment attempt(s)`
  } : {
    "Week Start Date": "No records yet",
    "Class Average Accuracy%": "0%",
    "Checkpoints Passed": 0,
    "New Skills Started": 0,
    "Note": "Complete class assessments to populate this sheet."
  });

  const perStudentSkillSheet = workbook.addWorksheet("Per-Student Skill Detail");
  setColumns(perStudentSkillSheet, ["Student", "Skill", "Status"], ["Skill"]);
  if (report.heatmapRows?.length) {
    report.heatmapRows.forEach(studentRow => {
      perStudentSkillSheet.addRow({ Student: studentRow.studentName, Skill: "", Status: "" });
      Object.entries(studentRow.values || {}).forEach(([skill, status]) => {
        perStudentSkillSheet.addRow({ Student: "", Skill: skill, Status: status });
      });
      perStudentSkillSheet.addRow({ Student: "", Skill: "", Status: "" });
    });
  } else {
    perStudentSkillSheet.addRow({ Student: "No records yet", Skill: "", Status: "" });
  }

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

  const groupsSheet = workbook.addWorksheet("Weak Points & Groups");
  setColumns(groupsSheet, ["Group Name / Focus", "Skill", "Students", "Reason", "Suggested Activity / Next Step"], ["Students", "Reason", "Suggested Activity / Next Step"]);
  const weakPointRows = buildClassWeakPointRows(report);
  groupsSheet.addRow({
    "Group Name / Focus": "Weak Points",
    "Skill": "",
    "Students": "",
    "Reason": "",
    "Suggested Activity / Next Step": ""
  });
  if (weakPointRows.length) {
    weakPointRows.forEach(row => groupsSheet.addRow({
      "Group Name / Focus": row.itemLabel,
      "Skill": row.skillName || row.skillArea,
      "Students": list(row.studentNames),
      "Reason": `${row.supportShare}% of assessed students below 70%; class item accuracy ${row.accuracy}%`,
      "Suggested Activity / Next Step": `Reteach ${row.itemLabel} in ${row.skillName || row.skillArea}, then reassess in a short mixed set.`
    }));
  } else {
    groupsSheet.addRow({
      "Group Name / Focus": "No weak item pattern yet",
      "Skill": "",
      "Students": "",
      "Reason": "No item has 30% or more of assessed students below 70%.",
      "Suggested Activity / Next Step": "Continue collecting item-level assessment evidence."
    });
  }
  groupsSheet.addRow({
    "Group Name / Focus": "Suggested Small Groups",
    "Skill": "",
    "Students": "",
    "Reason": "",
    "Suggested Activity / Next Step": ""
  });
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

  applyWorkbookPresentation(workbook, EL_CLASS_REPORT_SHEETS);
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
