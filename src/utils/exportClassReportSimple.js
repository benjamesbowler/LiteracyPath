/**
 * The class report a teacher can read before a lesson.
 *
 * WHY THIS EXISTS. The class workbook had ten sheets — Cover, Summary, Teach
 * next, Students, Skills, Skill matrix, Tricky items, How to read this, Data,
 * About this report. Same disease as the two student reports: every sheet
 * defensible alone, the total unusable. A teacher opens it and has to work out
 * which of ten tabs answers the question they came with.
 *
 * A class report answers two questions and no others: WHO needs me first, and
 * WHAT do I teach the group. Everything here serves one of those.
 *
 * THE ORDER IS THE POINT. Students are listed worst first, not alphabetically.
 * A register-ordered list of thirty children buries the three who need
 * something, and those three are the entire reason the report was opened.
 *
 * The ten-sheet builder (exportClassReportWorkbook.js) is unchanged and still
 * available. What changed is what the button produces.
 */
import {
  REPORT_STATUS_IDS,
  REPORT_STATUS_ORDER,
  canonicalStatusId,
  evaluateEvidenceSufficiency,
  reportStatusLabel
} from "../policy/reportingBible.js";
import {
  addKpiBand,
  addSectionHeading,
  addSheet,
  addStatusMatrix,
  addTable,
  applyPrintSetup,
  createReportWorkbook,
  downloadWorkbook,
  writeCell
} from "./excel/reportWorkbookKit.js";
import { WORKBOOK_COLORS, WORKBOOK_FONTS } from "./excel/reportWorkbookTheme.js";

/** More than this in one list and a teacher plans nothing from it. */
const TEACH_NEXT_LIMIT = 6;

/**
 * Worst first. `REPORT_STATUS_ORDER` already ranks needs_support ahead of
 * developing ahead of secure, so the ordering comes from the bible rather than
 * from a second opinion invented here. Within a status, lower accuracy first;
 * unknown accuracy sorts last because it is no score, not a low one.
 */
function bySeverity(left, right) {
  const rank = REPORT_STATUS_ORDER.indexOf(left.status) - REPORT_STATUS_ORDER.indexOf(right.status);
  if (rank !== 0) return rank;
  const leftAccuracy = left.accuracy === null || left.accuracy === undefined
    ? Number.POSITIVE_INFINITY : left.accuracy;
  const rightAccuracy = right.accuracy === null || right.accuracy === undefined
    ? Number.POSITIVE_INFINITY : right.accuracy;
  if (leftAccuracy !== rightAccuracy) return leftAccuracy - rightAccuracy;
  return String(left.student).localeCompare(String(right.student));
}

/**
 * WHO needs you first. Only students with a real judgement against them appear
 * — a student nobody has assessed is not struggling, and putting them in this
 * list would send a teacher to the wrong child.
 */
export function buildWhoNeedsYou(model = {}) {
  return (model.studentRows || [])
    .map(student => {
      const scored = Number(student.totalQuestions ?? student.savedAnswers ?? 0);
      const sufficiency = evaluateEvidenceSufficiency(scored);
      return {
        student: student.studentName || "Unnamed",
        status: canonicalStatusId(student.status?.id || student.status),
        // Passed through as 0-100. The kit's `type: "percent"` column divides by
        // 100 itself, so dividing here too rendered 34% as 0%.
        //
        // An accuracy computed from four answers is a number, not a finding, so
        // it is suppressed entirely rather than shown with a caveat nobody reads.
        accuracy: sufficiency.ready && Number.isFinite(Number(student.accuracy))
          ? Number(student.accuracy)
          : null,
        focus: (student.supportSkills || []).slice(0, 3).join(", "),
        note: sufficiency.ready ? "" : sufficiency.label
      };
    })
    .filter(row => row.status === REPORT_STATUS_IDS.NEEDS_SUPPORT
      || row.status === REPORT_STATUS_IDS.DEVELOPING)
    .sort(bySeverity);
}

/**
 * WHAT to teach the group. A skill only earns a place if enough of the class
 * has actually been assessed on it — otherwise the "class priority" is an
 * artefact of who happened to be absent.
 */
export function buildClassTeachNext(model = {}) {
  const rows = (model.heatmap || [])
    .map(skill => {
      const scored = Number(skill.totalScoredResponses ?? skill.scoredResponses ?? 0);
      const sufficiency = evaluateEvidenceSufficiency(scored);
      return {
        skill: skill.displaySkillName || skill.skillName || "",
        area: skill.skillArea?.label || skill.skillArea || "",
        status: canonicalStatusId(skill.classStatusId),
        needing: Number(skill.needsSupportCount || 0) + Number(skill.developingCount || 0),
        secure: Number(skill.masteredCount || 0),
        ready: sufficiency.ready
      };
    })
    .filter(row => row.skill && row.ready && row.needing > 0)
    .sort((left, right) => right.needing - left.needing
      || String(left.skill).localeCompare(String(right.skill)))
    .slice(0, TEACH_NEXT_LIMIT);

  if (!rows.length) {
    return [{
      skill: "Nothing stands out yet",
      area: "",
      status: REPORT_STATUS_IDS.NOT_ENOUGH_EVIDENCE,
      whoFor: "Not enough of the class has been assessed to name a shared priority."
    }];
  }

  return rows.map(row => ({
    skill: row.skill,
    area: row.area,
    status: row.status,
    whoFor: `${row.needing} ${row.needing === 1 ? "student needs" : "students need"} this`
      + (row.secure ? `, ${row.secure} already secure` : "")
  }));
}

function classGridRows(model = {}) {
  const skills = (model.heatmap || []).map(skill => skill.displaySkillName || skill.skillName || "");
  const rows = (model.studentRows || [])
    .map(student => ({
      label: student.studentName || "Unnamed",
      status: canonicalStatusId(student.status?.id || student.status),
      accuracy: Number.isFinite(Number(student.accuracy)) ? Number(student.accuracy) : null,
      student: student.studentName || "",
      cells: (model.heatmap || []).map(skill => {
        const cell = (skill.learners || skill.students || [])
          .find(entry => (entry.studentId || entry.id) === (student.studentId || student.id));
        return canonicalStatusId(cell?.statusId || cell?.status);
      })
    }))
    .sort(bySeverity);
  return { skills, rows };
}

export async function createSimpleClassReportWorkbook({
  model = {},
  periodLabel = "",
  generatedAt = new Date()
} = {}) {
  const className = model.className || "Class";
  const snapshot = model.snapshot || {};
  const workbook = await createReportWorkbook({
    title: `${className} — class report`,
    subject: "Class report",
    generatedAt
  });

  const whoNeedsYou = buildWhoNeedsYou(model);
  const teachNext = buildClassTeachNext(model);

  const sheet = addSheet(workbook, "Report", { tabColor: WORKBOOK_COLORS.primary });
  writeCell(sheet, "B2", className, { font: WORKBOOK_FONTS.coverTitle });
  writeCell(sheet, "B3", periodLabel, { font: WORKBOOK_FONTS.coverSubtitle });
  writeCell(sheet, "B4", `Class report  ·  ${generatedAt.toLocaleDateString()}`, {
    font: WORKBOOK_FONTS.bodyMuted
  });

  let row = addKpiBand(sheet, 6, [
    {
      label: "Need support",
      value: String(Number(snapshot.needsSupport || 0)),
      note: "Start with these",
      tone: Number(snapshot.needsSupport || 0)
        ? REPORT_STATUS_IDS.NEEDS_SUPPORT
        : REPORT_STATUS_IDS.SECURE
    },
    {
      label: "Secure",
      value: `${Number(snapshot.onTrack || 0)} of ${Number(snapshot.assessedStudents || 0)}`,
      note: "Of the students assessed",
      tone: REPORT_STATUS_IDS.SECURE
    },
    {
      label: "Not assessed yet",
      value: String(Math.max(0,
        Number(snapshot.totalStudents || 0) - Number(snapshot.assessedStudents || 0))),
      note: "No results either way",
      tone: "neutral"
    }
  ]);

  row = addSectionHeading(
    sheet,
    row + 1,
    "Who needs you first",
    "Worst first, not the register. Students with no results are not listed — nothing is known about them yet."
  );
  const whoTable = addTable(sheet, row, [
    { key: "student", header: "Student", width: 26 },
    { key: "status", header: "Where they are", width: 22, type: "status" },
    { key: "accuracy", header: "Accuracy", width: 14, type: "percent" },
    { key: "focus", header: "What to work on", width: 52, wrap: true }
  ], whoNeedsYou, {
    autoFilter: false,
    freezeHeader: false,
    emptyMessage: "No student currently needs support. Anyone not yet assessed is on the class grid."
  });
  row = whoTable.nextRow;

  row = addSectionHeading(
    sheet,
    row + 1,
    "What to teach the group",
    "Skills the most students need. A skill too few have been assessed on is left out rather than ranked."
  );
  const teachTable = addTable(sheet, row, [
    { key: "skill", header: "Skill", width: 26 },
    { key: "area", header: "Area", width: 22 },
    { key: "status", header: "Class status", width: 22, type: "status" },
    { key: "whoFor", header: "Who it is for", width: 52, wrap: true }
  ], teachNext, { autoFilter: false, freezeHeader: false });

  [null, 2, 26, 22, 22, 52].forEach((width, index) => {
    if (width) sheet.getColumn(index).width = width;
  });
  [[whoTable.firstDataRow, whoNeedsYou, "focus"], [teachTable.firstDataRow, teachNext, "whoFor"]]
    .forEach(([first, rows, key]) => {
      rows.forEach((entry, index) => {
        const lines = Math.ceil(String(entry?.[key] ?? "").length / 52) || 1;
        sheet.getRow(first + index).height = Math.max(20, Math.min(60, lines * 15 + 6));
      });
    });
  applyPrintSetup(sheet, { titleForFooter: `${className} — class report` });

  // The grid, on its own sheet: a matrix of marks wants narrow columns and the
  // summary above wants wide ones, and Excel has one width per column.
  const { skills, rows } = classGridRows(model);
  if (rows.length && skills.length) {
    const gridSheet = addSheet(workbook, "Class grid", { tabColor: WORKBOOK_COLORS.teal });
    writeCell(gridSheet, "B2", `${className} — every student, every skill`, {
      font: WORKBOOK_FONTS.coverTitle
    });
    const gridRow = addSectionHeading(
      gridSheet,
      4,
      "Class grid",
      `${reportStatusLabel(REPORT_STATUS_IDS.NEEDS_SUPPORT)} first, down and across. `
        + "A dash means that student has not been assessed on that skill — not that they got it wrong."
    );
    addStatusMatrix(gridSheet, gridRow, {
      rowHeader: "Student",
      columnHeaders: skills,
      rows
    });
    gridSheet.getColumn(1).width = 2;
    applyPrintSetup(gridSheet, {
      landscape: true,
      repeatHeaderRow: gridRow,
      titleForFooter: `${className} — class grid`
    });
  }

  return workbook;
}

export async function exportSimpleClassReportExcel(options = {}) {
  const generatedAt = options.generatedAt || new Date();
  const workbook = await createSimpleClassReportWorkbook({ ...options, generatedAt });
  const slug = String(options.model?.className || "class")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "class";
  return downloadWorkbook(workbook, `${slug}-class-report-${generatedAt.toISOString().slice(0, 10)}.xlsx`);
}
