/**
 * Everyday progress — the other half of the split.
 *
 * WHY THIS EXISTS. The student progress workbook had twelve sheets: Cover,
 * Summary, Teach next, Reading profile, What they know, Skills, Common words,
 * Guided reading, Practice, How to read this, Data, About this report. Each one
 * was defensible on its own and the total was unusable — a teacher opening it
 * meets twelve tabs and has to work out which of them answers their question.
 *
 * This is the same information at the level the EL report now uses: one sheet
 * that answers "how is this student doing and what do I teach next", and one
 * lookup sheet for the skill-by-skill detail a teacher plans from.
 *
 * WHAT IT DELIBERATELY DOES NOT CONTAIN. Practice and game activity is not
 * reported as learning. Sound Seekers, the Arcade and Story Quests record that
 * a student did something, not that they know something — the workspace model
 * says so explicitly (practiceCannotCreateSecure, storyQuestExposureIsNotMastery,
 * arcadeHasNoItemAccuracyLedger). They appear here as one line of context and
 * never as a status.
 *
 * The full twelve-sheet builder (exportStudentReportWorkbook.js) is unchanged
 * and still available; this is what the teacher-facing button produces.
 */
import {
  REPORT_STATUS_IDS,
  canonicalStatusId,
  reportStatusLabel
} from "../policy/reportingBible.js";
import { REPORTING_DOMAIN_LABELS } from "../data/reportingEvidenceModel.js";
import { buildSimpleOverview } from "../data/simpleStudentReports.js";
import {
  addKpiBand,
  addSectionHeading,
  addSheet,
  addTable,
  applyPrintSetup,
  createReportWorkbook,
  downloadWorkbook,
  writeCell
} from "./excel/reportWorkbookKit.js";
import { WORKBOOK_COLORS, WORKBOOK_FONTS } from "./excel/reportWorkbookTheme.js";

/** The most a teacher can act on in one week. A longer list is a shorter one nobody reads. */
const TEACH_NEXT_LIMIT = 8;

function domainLabel(domain) {
  return REPORTING_DOMAIN_LABELS[domain] || domain || "Other";
}

/**
 * Worst first, capped. `whyNotSecure` already carries the reason in teacher
 * language, so nothing here needs to explain a policy.
 */
export function buildProgressTeachNext(overview = {}) {
  const rows = [...(overview.needsTeaching || []), ...(overview.practising || [])]
    .slice(0, TEACH_NEXT_LIMIT);
  if (!rows.length) {
    return [{
      skill: "Nothing outstanding",
      area: "",
      why: "Everything with saved results came back secure."
    }];
  }
  return rows.map(row => ({
    skill: row.displayLabel,
    area: domainLabel(row.domain),
    why: row.whyNotSecure || reportStatusLabel(canonicalStatusId(row.statusId))
  }));
}

/**
 * One line per area of literacy rather than one per skill — the shape of a
 * conversation with a parent or a coach, not a data table.
 */
export function buildProgressByArea(overview = {}) {
  const buckets = [
    ["mastered", REPORT_STATUS_IDS.SECURE],
    ["practising", REPORT_STATUS_IDS.DEVELOPING],
    ["needsTeaching", REPORT_STATUS_IDS.NEEDS_SUPPORT],
    ["notEnoughYet", REPORT_STATUS_IDS.NOT_ENOUGH_EVIDENCE],
    ["yetToLearn", REPORT_STATUS_IDS.NOT_CHECKED]
  ];
  const byArea = new Map();
  for (const [bucket, status] of buckets) {
    for (const row of overview[bucket] || []) {
      const area = domainLabel(row.domain);
      if (!byArea.has(area)) {
        byArea.set(area, { area, secure: 0, developing: 0, needs: 0, thin: 0, unchecked: 0 });
      }
      const entry = byArea.get(area);
      if (status === REPORT_STATUS_IDS.SECURE) entry.secure += 1;
      else if (status === REPORT_STATUS_IDS.DEVELOPING) entry.developing += 1;
      else if (status === REPORT_STATUS_IDS.NEEDS_SUPPORT) entry.needs += 1;
      else if (status === REPORT_STATUS_IDS.NOT_ENOUGH_EVIDENCE) entry.thin += 1;
      else entry.unchecked += 1;
    }
  }

  return [...byArea.values()]
    .map(entry => {
      const checked = entry.secure + entry.developing + entry.needs + entry.thin;
      // The headline status for an area is the WORST thing in it that is a real
      // judgement. Averaging would let three secure skills hide one that needs
      // teaching, which is the one the teacher opened the report for.
      const status = entry.needs ? REPORT_STATUS_IDS.NEEDS_SUPPORT
        : entry.developing ? REPORT_STATUS_IDS.DEVELOPING
        : entry.secure ? REPORT_STATUS_IDS.SECURE
        : entry.thin ? REPORT_STATUS_IDS.NOT_ENOUGH_EVIDENCE
        : REPORT_STATUS_IDS.NOT_CHECKED;
      return {
        area: entry.area,
        status,
        summary: checked
          ? `${entry.secure} secure, ${entry.developing} developing, ${entry.needs} need support`
            + (entry.thin ? `, ${entry.thin} with too few results to judge` : "")
          : "Nothing assessed in this area yet",
        unchecked: entry.unchecked || ""
      };
    })
    .sort((left, right) => left.area.localeCompare(right.area));
}

/** Context lines. Never a status — practice records activity, not learning. */
export function buildActivityLines(workspace = {}) {
  const other = workspace.otherLearning?.summary || {};
  const books = workspace.guidedReading?.books || [];
  const finished = books.filter(book => book?.completed || book?.finishedAt).length;
  const lines = [];

  if (books.length) {
    lines.push({
      what: "Guided reading",
      detail: `${finished} of ${books.length} books finished`
    });
  }
  if (other.soundSeekersSoundsSeen) {
    lines.push({
      what: "Sound Seekers",
      detail: `${other.soundSeekersSoundsGotIt || 0} of ${other.soundSeekersSoundsSeen} sounds got it`
    });
  }
  if (other.arcadeGamesPlayed) {
    lines.push({ what: "Games", detail: `${other.arcadeGamesPlayed} played` });
  }
  if (other.storyQuestsCompleted) {
    lines.push({ what: "Story Quests", detail: `${other.storyQuestsCompleted} finished` });
  }
  return lines;
}

export async function createSimpleStudentProgressWorkbook(workspace = {}, {
  studentName = "Student",
  className = "",
  periodLabel = "",
  generatedAt = new Date()
} = {}) {
  const workbook = await createReportWorkbook({
    title: `${studentName} — progress`,
    subject: "Student progress report",
    generatedAt
  });

  const overview = buildSimpleOverview(workspace, studentName);
  const teachNext = buildProgressTeachNext(overview);
  const byArea = buildProgressByArea(overview);
  const activity = buildActivityLines(workspace);

  const sheet = addSheet(workbook, "Report", { tabColor: WORKBOOK_COLORS.primary });

  writeCell(sheet, "B2", studentName, { font: WORKBOOK_FONTS.coverTitle });
  writeCell(sheet, "B3", [className, periodLabel].filter(Boolean).join("  ·  "), {
    font: WORKBOOK_FONTS.coverSubtitle
  });
  writeCell(sheet, "B4", `Everyday progress  ·  ${generatedAt.toLocaleDateString()}`, {
    font: WORKBOOK_FONTS.bodyMuted
  });

  let row = addKpiBand(sheet, 6, [
    {
      label: "Secure",
      value: `${overview.mastered?.length || 0} of ${overview.checkedCount || 0}`,
      note: "Of the skills with saved results",
      tone: REPORT_STATUS_IDS.SECURE
    },
    {
      label: "Need support",
      value: String(overview.needsTeaching?.length || 0),
      note: "Start here",
      tone: (overview.needsTeaching?.length || 0)
        ? REPORT_STATUS_IDS.NEEDS_SUPPORT
        : REPORT_STATUS_IDS.SECURE
    },
    {
      label: "Not assessed yet",
      value: String(overview.yetToLearn?.length || 0),
      note: "No results either way — not a low score",
      tone: "neutral"
    }
  ]);

  row = addSectionHeading(sheet, row + 1, "Teach next", "Worst first. Work down it.");
  const teachTable = addTable(sheet, row, [
    { key: "skill", header: "Skill", width: 30 },
    { key: "area", header: "Area", width: 22 },
    { key: "why", header: "Why it is not secure yet", width: 60, wrap: true }
  ], teachNext, { autoFilter: false, freezeHeader: false });
  const teachFirstRow = teachTable.firstDataRow;
  row = teachTable.nextRow;

  row = addSectionHeading(
    sheet,
    row + 1,
    "How each area is going",
    "The status of an area is the weakest real judgement in it, never an average."
  );
  const areaTable = addTable(sheet, row, [
    { key: "area", header: "Area", width: 30 },
    { key: "status", header: "Where they are", width: 22, type: "status" },
    { key: "summary", header: "In plain terms", width: 60, wrap: true },
    { key: "unchecked", header: "Not assessed", width: 14, type: "number" }
  ], byArea, { autoFilter: false, freezeHeader: false });
  const areaFirstRow = areaTable.firstDataRow;
  row = areaTable.nextRow;

  if (activity.length) {
    row = addSectionHeading(
      sheet,
      row + 1,
      "What they have been doing",
      "Activity, not attainment. Practice and games are never counted as learning a skill."
    );
    addTable(sheet, row, [
      { key: "what", header: "Activity", width: 30 },
      { key: "detail", header: "So far", width: 60 }
    ], activity, { autoFilter: false, freezeHeader: false });
  }

  // One grid for the whole sheet — see the note in exportElAssessmentSimple.js.
  // addTable sizes columns as it writes, so tables sharing a sheet overwrite
  // each other's widths and the last one wins.
  [null, 2, 30, 22, 60, 16].forEach((width, index) => {
    if (width) sheet.getColumn(index).width = width;
  });

  // ExcelJS does not auto-fit height, so wrapped text is clipped at the default.
  [[teachFirstRow, teachNext, "why", 60], [areaFirstRow, byArea, "summary", 60]]
    .forEach(([first, rows, key, width]) => {
      rows.forEach((entry, index) => {
        const lines = Math.ceil(String(entry?.[key] ?? "").length / width) || 1;
        sheet.getRow(first + index).height = Math.max(20, Math.min(72, lines * 15 + 6));
      });
    });

  applyPrintSetup(sheet, { titleForFooter: `${studentName} — progress` });

  // The lookup sheet. Its own sheet because a skill-by-skill table wants
  // different column widths from a prose summary.
  const allRows = [
    ...(overview.needsTeaching || []),
    ...(overview.practising || []),
    ...(overview.notEnoughYet || []),
    ...(overview.mastered || []),
    ...(overview.yetToLearn || [])
  ];
  if (allRows.length) {
    const skillSheet = addSheet(workbook, "Skills", { tabColor: WORKBOOK_COLORS.teal });
    writeCell(skillSheet, "B2", `${studentName} — skill by skill`, {
      font: WORKBOOK_FONTS.coverTitle
    });
    const skillRow = addSectionHeading(
      skillSheet,
      4,
      "Every skill, worst first",
      "A skill with no results is listed as not assessed. That is not a low score."
    );
    const table = addTable(skillSheet, skillRow, [
      { key: "displayLabel", header: "Skill", width: 40 },
      { key: "areaLabel", header: "Area", width: 24 },
      { key: "status", header: "Where they are", width: 22, type: "status" },
      { key: "whyNotSecure", header: "Why", width: 56, wrap: true }
    ], allRows.map(entry => ({
      ...entry,
      areaLabel: domainLabel(entry.domain),
      status: canonicalStatusId(entry.statusId),
      whyNotSecure: entry.hasAnyResults ? (entry.whyNotSecure || "") : "Not assessed yet."
    })), { freezeHeader: true });
    skillSheet.getColumn(1).width = 2;
    applyPrintSetup(skillSheet, {
      repeatHeaderRow: table.headerRow,
      titleForFooter: `${studentName} — skill by skill`
    });
  }

  return workbook;
}

function fileNameFor(studentName, generatedAt) {
  const slug = String(studentName || "student")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "student";
  return `${slug}-progress-${generatedAt.toISOString().slice(0, 10)}.xlsx`;
}

export async function exportSimpleStudentProgressExcel(workspace = {}, options = {}) {
  const generatedAt = options.generatedAt || new Date();
  const workbook = await createSimpleStudentProgressWorkbook(workspace, { ...options, generatedAt });
  await downloadWorkbook(workbook, fileNameFor(options.studentName, generatedAt));
  return workbook;
}
