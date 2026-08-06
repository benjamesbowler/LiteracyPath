import {
  SHEET_NAMES,
  addCoverSheet,
  addDataSheet,
  addHowToReadSheet,
  addKpiBand,
  addProvenanceSheet,
  addSectionHeading,
  addSheet,
  addStatusMatrix,
  addStatusSplit,
  addTable,
  applyPrintSetup,
  createReportWorkbook,
  downloadWorkbook,
  orderSheets,
  writeCell
} from "./excel/reportWorkbookKit.js";
import { WORKBOOK_COLORS, WORKBOOK_FONTS } from "./excel/reportWorkbookTheme.js";
import {
  REPORTING_BIBLE_POLICY,
  STANDING_NOTICES,
  canonicalStatusId,
  evaluateEvidenceSufficiency,
  reportStatusLabel
} from "../policy/reportingBible.js";
import { TEACHER_COPY } from "../copy/teacherCopy.js";

/**
 * The class workbook.
 *
 * Replaces `class-report.csv`, which was a provenance preamble stapled to a flat
 * dump of every saved assessment attempt. That file answered "what rows are in
 * the database"; it did not answer "who do I see on Monday", which is the only
 * question a class report exists to answer.
 *
 * Sheet order is fixed by the bible: Cover, Summary, **Teach next**, then detail.
 * Teach next goes third, before any detail sheet, because the 2025 K-3 educator
 * survey found 76% of teachers can interpret screening data and only 38% can act
 * on it. A report that stops at data leaves that gap where it found it.
 */

const CLASS_SHEETS = Object.freeze({
  TEACH_NEXT: SHEET_NAMES.TEACH_NEXT,
  STUDENTS: "Students",
  SKILLS: "Skills",
  MATRIX: "Skill matrix",
  ITEMS: "Tricky items"
});

const SHEET_ORDER = [
  SHEET_NAMES.COVER,
  SHEET_NAMES.SUMMARY,
  CLASS_SHEETS.TEACH_NEXT,
  CLASS_SHEETS.STUDENTS,
  CLASS_SHEETS.SKILLS,
  CLASS_SHEETS.MATRIX,
  CLASS_SHEETS.ITEMS,
  SHEET_NAMES.HOW_TO_READ,
  SHEET_NAMES.DATA,
  SHEET_NAMES.PROVENANCE
];

function percentOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export async function createClassReportWorkbook({
  model = {},
  periodLabel = "",
  teacherName = "",
  generatedAt = new Date(),
  provenanceRows = []
} = {}) {
  const taken = new Set();
  const snapshot = model.snapshot || {};
  const className = model.className || "Class";
  const stamp = generatedAt instanceof Date ? generatedAt : new Date(generatedAt);

  const workbook = await createReportWorkbook({
    title: `${className} — class report`,
    subject: "Literacy Guide class report",
    generatedAt: stamp
  });

  const assessed = Number(snapshot.assessedStudents || 0);
  const total = Number(snapshot.totalStudents || 0);
  const classAccuracy = snapshot.averageAccuracyReady ? percentOrNull(snapshot.averageAccuracy) : null;

  /* -------- Cover -------- */
  addCoverSheet(workbook, {
    eyebrow: "Literacy Guide · Class report",
    title: className,
    subtitle: [teacherName, periodLabel].filter(Boolean).join(" · "),
    headline: buildClassHeadline({ className, snapshot, model, classAccuracy, assessed, total }),
    facts: [
      ["Students on the class list", total],
      ["Students with saved answers", assessed],
      ["Assessment period", periodLabel || "All time"],
      ["Most recent result", snapshot.latestAssessmentDate || "None recorded"],
      ["Class accuracy", classAccuracy === null ? "Not enough results" : `${Math.round(classAccuracy)}%`],
      ["Skills at class mastery", snapshot.skillsAtClassMastery ?? 0],
      ["Report generated", stamp.toISOString().slice(0, 10)],
      teacherName ? ["Teacher", teacherName] : null
    ],
    notices: [
      STANDING_NOTICES.missingIsNotZero,
      STANDING_NOTICES.accuracyIsNotMastery,
      "Students are listed alphabetically. This report does not rank children by score."
    ],
    taken
  });

  /* -------- Summary -------- */
  const summary = addSheet(workbook, SHEET_NAMES.SUMMARY, { tabColor: WORKBOOK_COLORS.teal, taken });
  summary.columns = [{ width: 2 }, ...Array.from({ length: 12 }, () => ({ width: 12 })), { width: 2 }];

  let row = addSectionHeading(summary, 2, "The class right now", "", { span: 12 });
  row = addKpiBand(summary, row, [
    { label: TEACHER_COPY.metrics.students, value: total, note: "On the class list", tone: "brand" },
    { label: "With saved answers", value: assessed, note: TEACHER_COPY.reports.classSkillsAssessed(assessed, total), tone: "neutral" },
    {
      label: TEACHER_COPY.metrics.classAccuracy,
      value: classAccuracy === null ? null : classAccuracy / 100,
      note: classAccuracy === null ? TEACHER_COPY.metrics.notEnough : TEACHER_COPY.reports.accuracySeparateNote,
      tone: "neutral",
      numFmt: "0%"
    },
    {
      label: "Needs support",
      value: Number(snapshot.needsSupport || 0),
      note: TEACHER_COPY.reports.classStatusNotes?.needs_support || "Review these first.",
      tone: "needs_support"
    }
  ], { columnsPerCard: 3 });

  row = addSectionHeading(
    summary,
    row,
    "Where every student sits",
    TEACHER_COPY.reports.classSplitReconcile(assessed, total),
    { span: 12 }
  );
  row = addStatusSplit(
    summary,
    row,
    {
      needs_support: snapshot.needsSupport || 0,
      developing: snapshot.developing || 0,
      on_track: snapshot.onTrack || 0,
      not_enough_evidence: countStatus(model.studentRows, "not_enough_evidence"),
      not_checked: Math.max(0, total - assessed)
    },
    { reconcileLine: "Every student appears in exactly one group. Students with no saved answers are counted as not checked, never as zero." }
  );

  if (model.comparability && model.comparability.comparable === false) {
    summary.mergeCells(`B${row}:M${row + 1}`);
    writeCell(
      summary,
      `B${row}`,
      `Comparability warning: ${model.comparability.reason || "students in this class have very different amounts of saved evidence, so class-level comparisons are not reliable yet."}`,
      {
        font: { ...WORKBOOK_FONTS.body, bold: true, color: { argb: WORKBOOK_COLORS.developingText } },
        fill: WORKBOOK_COLORS.developingFill,
        alignment: { vertical: "top", wrapText: true }
      }
    );
    summary.getRow(row).height = 22;
  }

  applyPrintSetup(summary, { landscape: true, titleForFooter: `${className} — summary` });

  /* -------- Teach next -------- */
  const teachNext = addSheet(workbook, CLASS_SHEETS.TEACH_NEXT, { tabColor: WORKBOOK_COLORS.amber, taken });
  teachNext.columns = [{ width: 2 }, { width: 26 }, { width: 34 }, { width: 40 }, { width: 46 }, { width: 2 }];
  row = addSectionHeading(
    teachNext,
    2,
    "Teach next",
    "The point of this workbook. Sort or filter it, and it is your grouping plan.",
    { span: 4 }
  );

  const groupRows = (model.groups || []).map(group => ({
    group: group.groupName || group.focus || "Group",
    focus: group.focus || "",
    students: (group.students || []).map(student => student.studentName || student.name || student).join(", ") || "No students listed",
    activity: group.suggestedActivity || group.reason || ""
  }));
  const groupTable = addTable(
    teachNext,
    row,
    [
      { key: "group", header: "Group", width: 20 },
      { key: "focus", header: "Focus skill", width: 30, wrap: true },
      { key: "students", header: "Students", width: 44, wrap: true },
      { key: "activity", header: "Suggested next move", width: 46, wrap: true }
    ],
    groupRows,
    {
      emptyMessage:
        "No group is suggested yet. More results are needed before a class-wide grouping can be justified — use the individual student reports for now."
    }
  );
  row = groupTable.nextRow;

  row = addSectionHeading(
    teachNext,
    row,
    "Class priorities",
    "Skills where the class as a whole needs work, most urgent first.",
    { span: 4 }
  );
  const focusRows = (model.focusRows || []).map(focus => ({
    skill: focus.skillName || focus.skill || "",
    accuracy: percentOrNull(focus.accuracy),
    students: focus.studentCount ?? focus.learnerCount ?? "",
    action: focus.suggestedAction || ""
  }));
  const focusTable = addTable(
    teachNext,
    row,
    [
      { key: "skill", header: "Skill", width: 28, wrap: true },
      { key: "accuracy", header: "Class accuracy", type: "percent", width: 14 },
      { key: "students", header: "Students", type: "number", width: 14 },
      { key: "action", header: "Suggested next move", width: 60, wrap: true }
    ],
    focusRows,
    { emptyMessage: "No shared class priority is ready. More results are needed before making a class-wide judgement." }
  );
  row = focusTable.nextRow;

  const needsSupportStudents = (model.studentRows || [])
    .filter(student => canonicalStatusId(student.status?.id || student.status) === "needs_support")
    .map(student => ({
      student: student.studentName,
      accuracy: percentOrNull(student.accuracy),
      answers: student.totalQuestions ?? student.savedAnswers ?? 0,
      focus: (student.supportSkills || []).join(", ") || "No specific skill isolated yet",
      lastSeen: student.latestDate || ""
    }));
  row = addSectionHeading(
    teachNext,
    row,
    "See these students first",
    "Everyone currently in Needs support, with what to work on.",
    { span: 4 }
  );
  const urgentTable = addTable(
    teachNext,
    row,
    [
      { key: "student", header: "Student", width: 22 },
      { key: "accuracy", header: "Accuracy", type: "percent", width: 12 },
      { key: "answers", header: "Answers", type: "number", width: 14 },
      { key: "focus", header: "Work on", width: 50, wrap: true },
      { key: "lastSeen", header: "Last result", type: "date", width: 14 }
    ],
    needsSupportStudents,
    { emptyMessage: "Nobody is currently in Needs support." }
  );
  row = urgentTable.nextRow;

  const notChecked = (model.studentRows || [])
    .filter(student => canonicalStatusId(student.status?.id || student.status) === "not_checked")
    .map(student => ({ student: student.studentName, note: "No saved answers yet." }));
  if (notChecked.length) {
    row = addSectionHeading(
      teachNext,
      row,
      "Not assessed yet",
      "These students have nothing saved. That is a coverage gap, not a result — they are not counted as low.",
      { span: 4 }
    );
    addTable(
      teachNext,
      row,
      [
        { key: "student", header: "Student", width: 22 },
        { key: "note", header: "Why they are here", width: 50, wrap: true }
      ],
      notChecked,
      { freezeHeader: false, autoFilter: false }
    );
  }
  applyPrintSetup(teachNext, { landscape: true, titleForFooter: `${className} — teach next` });

  /* -------- Students -------- */
  const studentsSheet = addSheet(workbook, CLASS_SHEETS.STUDENTS, { tabColor: WORKBOOK_COLORS.blue, taken });
  studentsSheet.columns = [{ width: 2 }];
  row = addSectionHeading(
    studentsSheet,
    2,
    "Students",
    "Alphabetical. Accuracy and learning status are separate columns because a high percentage alone does not prove learning is secure.",
    { span: 10 }
  );
  const studentRows = (model.studentRows || [])
    .slice()
    .sort((a, b) => String(a.studentName).localeCompare(String(b.studentName)))
    .map(student => {
      const scored = Number(student.totalQuestions ?? student.savedAnswers ?? 0);
      const sufficiency = evaluateEvidenceSufficiency(scored);
      return {
        student: student.studentName,
        status: canonicalStatusId(student.status?.id || student.status),
        accuracy: sufficiency.ready ? percentOrNull(student.accuracy) : null,
        scored,
        attempts: Number(student.attempts || 0),
        evidence: sufficiency.label,
        evidenceNote: sufficiency.reason,
        focus: (student.supportSkills || []).join(", "),
        level: student.currentLevel || "",
        lastSeen: student.latestDate || ""
      };
    });
  addTable(
    studentsSheet,
    row,
    [
      { key: "student", header: "Student", width: 22 },
      { key: "status", header: "Learning status", type: "status", width: 20 },
      { key: "accuracy", header: "Answer accuracy", type: "percent", width: 15 },
      { key: "scored", header: "Scored answers", type: "number", width: 14 },
      { key: "attempts", header: "Assessments", type: "number", width: 12 },
      { key: "evidence", header: "Evidence", width: 18 },
      { key: "evidenceNote", header: "Why", width: 46, wrap: true },
      { key: "focus", header: "Work on", width: 34, wrap: true },
      { key: "level", header: "Current level", width: 14 },
      { key: "lastSeen", header: "Last result", type: "date", width: 13 }
    ],
    studentRows,
    { freezeFirstColumn: true, emptyMessage: "No students on this class list yet." }
  );
  applyPrintSetup(studentsSheet, { landscape: true, repeatHeaderRow: row, titleForFooter: `${className} — students` });

  /* -------- Skills -------- */
  const skillsSheet = addSheet(workbook, CLASS_SHEETS.SKILLS, { tabColor: WORKBOOK_COLORS.purple, taken });
  skillsSheet.columns = [{ width: 2 }];
  row = addSectionHeading(
    skillsSheet,
    2,
    TEACHER_COPY.reports.skillsWithResults,
    TEACHER_COPY.reports.accuracySeparateNote,
    { span: 10 }
  );
  const skillRows = (model.heatmap || []).map(skill => {
    const scored = Number(skill.totalScoredResponses ?? skill.scoredResponses ?? 0);
    const sufficiency = evaluateEvidenceSufficiency(scored);
    return {
      skill: skill.displaySkillName || skill.skillName || "",
      area: skill.skillArea?.label || skill.skillArea || "",
      students: Number(skill.attemptedLearnerCount ?? 0),
      scored,
      accuracy: sufficiency.ready ? percentOrNull(skill.classAccuracy) : null,
      status: canonicalStatusId(skill.classStatusId),
      evidence: sufficiency.label,
      secure: Number(skill.masteredCount || 0),
      developing: Number(skill.developingCount || 0),
      needsSupport: Number(skill.needsSupportCount || 0),
      notEnough: Number(skill.notEnoughEvidenceCount || 0),
      notChecked: Number(skill.notAssessedCount || 0)
    };
  });
  addTable(
    skillsSheet,
    row,
    [
      { key: "skill", header: "Skill", width: 28, wrap: true },
      { key: "area", header: "Area", width: 22, wrap: true },
      { key: "students", header: "Students assessed", type: "number", width: 15 },
      { key: "scored", header: "Scored answers", type: "number", width: 14 },
      { key: "accuracy", header: "Accuracy", type: "percent", width: 12 },
      { key: "status", header: "Class status", type: "status", width: 20 },
      { key: "evidence", header: "Evidence", width: 18 },
      { key: "secure", header: "Secure", type: "number", width: 13 },
      { key: "developing", header: "Developing", type: "number", width: 12 },
      { key: "needsSupport", header: "Needs support", type: "number", width: 14 },
      { key: "notEnough", header: "Not enough", type: "number", width: 12 },
      { key: "notChecked", header: "Not checked", type: "number", width: 12 }
    ],
    skillRows,
    { freezeFirstColumn: true, emptyMessage: "No saved results yet. Complete an assessment to fill this table." }
  );
  applyPrintSetup(skillsSheet, { landscape: true, repeatHeaderRow: row, titleForFooter: `${className} — skills` });

  /* -------- Matrix -------- */
  const matrixSheet = addSheet(workbook, CLASS_SHEETS.MATRIX, { tabColor: WORKBOOK_COLORS.blue, taken });
  matrixSheet.columns = [{ width: 2 }];
  row = addSectionHeading(
    matrixSheet,
    2,
    "Skill matrix",
    "Every student against every skill. Hover a cell for the detail. Colour comes from learning status, not from the percentage — a high percentage on thin evidence is still neutral.",
    { span: 12 }
  );
  const skillNames = (model.heatmap || []).map(skill => skill.displaySkillName || skill.skillName || "");
  const studentNames = Array.from(
    new Map(
      (model.heatmap || [])
        .flatMap(skill => skill.cells || [])
        .map(cell => [cell.studentId, cell.studentName])
    ).entries()
  ).sort((a, b) => String(a[1]).localeCompare(String(b[1])));

  const matrixRows = studentNames.map(([studentId, studentName]) => ({
    label: studentName,
    cells: (model.heatmap || []).map(skill => {
      const cell = (skill.cells || []).find(entry => entry.studentId === studentId);
      if (!cell) return { status: "not_checked", note: "No saved answers for this skill." };
      const scored = Number(cell.scoredResponses ?? 0);
      const sufficiency = evaluateEvidenceSufficiency(scored);
      return {
        status: sufficiency.ready ? canonicalStatusId(cell.statusId) : "not_enough_evidence",
        note: `${sufficiency.reason}${cell.accuracy != null && sufficiency.ready ? ` ${Math.round(cell.accuracy)}% correct.` : ""}`
      };
    })
  }));
  addStatusMatrix(matrixSheet, row, {
    rowHeader: "Student",
    columnHeaders: skillNames,
    rows: matrixRows,
    emptyMessage: "No saved results yet."
  });
  applyPrintSetup(matrixSheet, { landscape: true, repeatHeaderRow: row, titleForFooter: `${className} — skill matrix` });

  /* -------- Tricky items -------- */
  const itemsSheet = addSheet(workbook, CLASS_SHEETS.ITEMS, { tabColor: WORKBOOK_COLORS.amber, taken });
  itemsSheet.columns = [{ width: 2 }];
  row = addSectionHeading(
    itemsSheet,
    2,
    "Tricky items",
    "The specific sounds, words and patterns this class is missing most. This is what a mini-lesson is made of.",
    { span: 8 }
  );
  const itemRows = (model.weakItems || model.weakPoints || []).map(item => ({
    item: item.label || item.itemKey || "",
    type: item.itemTypeLabel || item.itemType || "",
    skill: item.skillName || "",
    students: Number(item.studentCount ?? item.learnerCount ?? 0),
    attempts: Number(item.attempts || 0),
    accuracy: percentOrNull(item.accuracy),
    examples: Array.isArray(item.missedExamples) ? item.missedExamples.slice(0, 6).join(", ") : ""
  }));
  addTable(
    itemsSheet,
    row,
    [
      { key: "item", header: "Item", width: 22 },
      { key: "type", header: "Type", width: 18 },
      { key: "skill", header: "Skill", width: 24, wrap: true },
      { key: "students", header: "Students", type: "number", width: 14 },
      { key: "attempts", header: "Attempts", type: "number", width: 14 },
      { key: "accuracy", header: "Accuracy", type: "percent", width: 12 },
      { key: "examples", header: "Missed on", width: 44, wrap: true }
    ],
    itemRows,
    { emptyMessage: "No item-level pattern has enough results yet." }
  );
  applyPrintSetup(itemsSheet, { landscape: true, repeatHeaderRow: row, titleForFooter: `${className} — tricky items` });

  /* -------- How to read -------- */
  addHowToReadSheet(workbook, {
    metricRows: [
      { label: "Answer accuracy", definition: "The share of scored answers that were correct, in the selected period. It is not the same thing as learning status." },
      { label: "Learning status", definition: "A judgement about whether learning is secure. It needs enough recent, scored, independent evidence — accuracy alone is not enough." },
      { label: "Scored answers", definition: "How many answers the status is based on. This is the denominator, and it is on every row for a reason." },
      { label: "Evidence", definition: `Whether there is enough to judge. Under ${REPORTING_BIBLE_POLICY.evidenceSufficiency.judgementMinimumScoredItems} scored items, no status is given at all.` },
      { label: "Class status", definition: "The class-level status for a skill. It is not an average of the children — it is a judgement about the class as a group." },
      { label: "Not checked", definition: "No saved answers. A coverage gap, not a result, and never counted as low." }
    ],
    extraNotes: [
      "This workbook shows the same words and the same colours as the app. If a status here disagrees with the screen, that is a bug — please report it.",
      REPORTING_BIBLE_POLICY.exportPrivacy.confidentialityBanner
    ],
    taken
  });

  /* -------- Data -------- */
  const dataRows = (model.heatmap || []).flatMap(skill =>
    (skill.cells || []).map(cell => {
      const scored = Number(cell.scoredResponses ?? 0);
      const sufficiency = evaluateEvidenceSufficiency(scored);
      return {
        class_name: className,
        period: periodLabel,
        student_id: cell.studentId,
        student_name: cell.studentName,
        skill_code: skill.canonicalSkillName || skill.skillName || "",
        skill_name: skill.displaySkillName || skill.skillName || "",
        skill_area: skill.skillArea?.label || skill.skillArea || "",
        attempts: Number(cell.attempts || 0),
        items_scored: scored,
        items_correct: Number(cell.correctResponses || 0),
        accuracy_percent: sufficiency.ready ? percentOrNull(cell.accuracy) : "",
        status_id: sufficiency.ready ? canonicalStatusId(cell.statusId) : "not_enough_evidence",
        status_label: sufficiency.ready ? reportStatusLabel(cell.statusId) : reportStatusLabel("not_enough_evidence"),
        evidence_sufficiency: sufficiency.id,
        policy_ready: cell.policyReady ? "yes" : "no",
        policy_version: cell.policyVersion || ""
      };
    })
  );
  addDataSheet(
    workbook,
    [
      { key: "class_name", header: "class_name", width: 20 },
      { key: "period", header: "period", width: 16 },
      { key: "student_id", header: "student_id", width: 22 },
      { key: "student_name", header: "student_name", width: 20 },
      { key: "skill_code", header: "skill_code", width: 24 },
      { key: "skill_name", header: "skill_name", width: 24 },
      { key: "skill_area", header: "skill_area", width: 20 },
      { key: "attempts", header: "attempts", type: "number", width: 10 },
      { key: "items_scored", header: "items_scored", type: "number", width: 13 },
      { key: "items_correct", header: "items_correct", type: "number", width: 13 },
      { key: "accuracy_percent", header: "accuracy_percent", type: "number", width: 16 },
      { key: "status_id", header: "status_id", width: 20 },
      { key: "status_label", header: "status_label", width: 20 },
      { key: "evidence_sufficiency", header: "evidence_sufficiency", width: 20 },
      { key: "policy_ready", header: "policy_ready", width: 12 },
      { key: "policy_version", header: "policy_version", width: 20 }
    ],
    dataRows,
    { taken }
  );

  /* -------- Provenance -------- */
  addProvenanceSheet(
    workbook,
    provenanceRows.length
      ? provenanceRows
      : [
          { field: "Report", value: `${className} class report` },
          { field: "Assessment period", value: periodLabel },
          { field: "Generated", value: stamp.toISOString() },
          { field: "Students", value: total }
        ],
    { taken, extraNotes: [REPORTING_BIBLE_POLICY.exportPrivacy.releaseNotice] }
  );

  orderSheets(workbook, SHEET_ORDER);
  return workbook;
}

function countStatus(rows = [], statusId) {
  return (rows || []).filter(row => canonicalStatusId(row.status?.id || row.status) === statusId).length;
}

function buildClassHeadline({ className, snapshot, model, classAccuracy, assessed, total }) {
  const parts = [];
  parts.push(
    `${assessed} of ${total} ${total === 1 ? "student" : "students"} in ${className} have saved answers in this period.`
  );
  if (classAccuracy !== null) {
    parts.push(`Class accuracy is ${Math.round(classAccuracy)}%.`);
  } else {
    parts.push("There are not yet enough results for a class accuracy figure.");
  }
  const urgent = snapshot.mostUrgentFocus || model.focusRows?.[0]?.skillName;
  if (urgent) parts.push(`The clearest shared priority is ${urgent}.`);
  const needsSupport = Number(snapshot.needsSupport || 0);
  if (needsSupport) {
    parts.push(`${needsSupport} ${needsSupport === 1 ? "student needs" : "students need"} support first — they are named on the Teach next sheet.`);
  }
  return parts.join(" ");
}

export async function exportClassReportWorkbook(options = {}) {
  const workbook = await createClassReportWorkbook(options);
  const className = options.model?.className || "class";
  const date = (options.generatedAt instanceof Date ? options.generatedAt : new Date()).toISOString().slice(0, 10);
  const fileName = options.fileName || `${slug(className)}-class-report-${date}.xlsx`;
  return downloadWorkbook(workbook, fileName);
}

function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "class";
}

export const CLASS_WORKBOOK_SHEETS = CLASS_SHEETS;
