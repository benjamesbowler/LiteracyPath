/**
 * The EL assessment report a kindergarten teacher can actually read.
 *
 * WHY THIS EXISTS. The previous student EL download had ten sheets. Encoding
 * Detail was 27 columns wide with 25 of them repeating the identical sentence on
 * every row. Decoding Detail and Fluency Detail were 42 columns wide and
 * completely empty. Letter Names & Sounds used fifteen columns to answer one
 * question — which letters does this student know — and then added a column
 * restating all of it in prose. Teachers were shown "Code: route_ready; State:
 * ready", "syllable: not_assessed, onset_rime: not_assessed", and
 * "assessment_attempts: 13 row(s); item_mastery: 115 row(s)".
 *
 * That file was written to prove the data was all there. This one is written to
 * be read in thirty seconds, standing up, before a lesson.
 *
 * THE RULES IT FOLLOWS.
 *   One sheet. A second only for the letter grid, and only when there are
 *     letter results to show.
 *   Nothing that was not assessed gets a row, a column or a sheet. An empty
 *     42-column sheet is not thoroughness.
 *   No counts of attempts, no unscored tallies, no state codes, no version
 *     strings, no source-read tallies. If a teacher would not act on it, it is
 *     not here.
 *   Every status word comes from src/policy/reportingBible.js, so this report
 *     says "Not enough results" in exactly the sense the rest of the app does.
 *   Missing is shown as missing. It is never counted as zero and never lowers
 *     a student's standing (REPORTING_BIBLE STANDING_NOTICES.missingIsNotZero).
 *
 * The full detail has not been deleted — createStudentElAssessmentWorkbook still
 * exists and still backs the class report and the saved-report re-download. What
 * changed is what a teacher gets when they press the button.
 */
import {
  REPORT_STATUS_IDS,
  canonicalStatusId,
  reportStatusLabel
} from "../policy/reportingBible.js";
import {
  addKpiBand,
  addSectionHeading,
  addStatusMatrix,
  addTable,
  applyPrintSetup,
  addSheet,
  createReportWorkbook,
  downloadWorkbook,
  writeCell
} from "./excel/reportWorkbookKit.js";
import { WORKBOOK_COLORS, WORKBOOK_FONTS } from "./excel/reportWorkbookTheme.js";

/**
 * The six assessments, in the order a teacher meets them, with the plain name
 * each one goes by out loud. The formal titles ("Advanced Phoneme and Pattern
 * Recognition") are accurate and nobody says them.
 */
export const EL_PLAIN_ASSESSMENT_NAMES = Object.freeze({
  el_letter_assessment: "Letters and sounds",
  advanced_phonics_patterns: "Advanced sounds",
  el_phonological_awareness: "Hearing sounds in words",
  el_encoding: "Spelling",
  el_decoding: "Reading words",
  el_oral_reading_fluency: "Reading a passage"
});

/** Which real-world question each assessment answers. */
export const EL_PLAIN_ASSESSMENT_MEANING = Object.freeze({
  el_letter_assessment: "Can they name each letter and say the sound it makes?",
  advanced_phonics_patterns: "Do they know letter teams like sh, ai and silent e?",
  el_phonological_awareness: "Can they hear and play with sounds without seeing letters?",
  el_encoding: "Can they write the sounds they hear in a word?",
  el_decoding: "Can they sound out and read words?",
  el_oral_reading_fluency: "Can they read a passage smoothly and accurately?"
});

const DOMAIN_TO_ASSESSMENT = Object.freeze({
  phonologicalAwareness: "el_phonological_awareness",
  encoding: "el_encoding",
  decoding: "el_decoding",
  oralReadingFluency: "el_oral_reading_fluency"
});

function statusOf(cell) {
  return canonicalStatusId(cell?.status);
}

function isKnown(cell) {
  return statusOf(cell) === REPORT_STATUS_IDS.SECURE;
}

function wasAssessed(cell) {
  return statusOf(cell) !== REPORT_STATUS_IDS.NOT_CHECKED;
}

/**
 * A letter counts as known when every part of it that was assessed came back
 * right. A letter nobody has assessed is NOT counted as unknown — it is left
 * out of both totals, which is why the headline reads "21 of 24 assessed"
 * rather than "21 of 26".
 */
export function summariseLetters(letterRows = []) {
  const known = [];
  const working = [];
  const notAssessed = [];

  for (const row of letterRows) {
    const parts = [row?.uppercaseName, row?.uppercaseSound, row?.lowercaseName, row?.lowercaseSound];
    const assessed = parts.filter(wasAssessed);
    if (!assessed.length) {
      notAssessed.push(row);
      continue;
    }
    if (assessed.every(isKnown)) {
      known.push(row);
      continue;
    }
    // What specifically to reteach. A teacher who knows "the sound, not the
    // name" plans a different five minutes from one who only knows "R".
    const gaps = [];
    if (wasAssessed(row.uppercaseName) && !isKnown(row.uppercaseName)) gaps.push("capital name");
    if (wasAssessed(row.lowercaseName) && !isKnown(row.lowercaseName)) gaps.push("small name");
    if (wasAssessed(row.uppercaseSound) && !isKnown(row.uppercaseSound)) gaps.push("capital sound");
    if (wasAssessed(row.lowercaseSound) && !isKnown(row.lowercaseSound)) gaps.push("small sound");
    working.push({ ...row, gaps });
  }

  return { known, working, notAssessed, assessedCount: known.length + working.length };
}

export function summarisePatterns(patternRows = []) {
  const known = [];
  const working = [];
  for (const row of patternRows) {
    const status = canonicalStatusId(row?.status);
    if (status === REPORT_STATUS_IDS.NOT_CHECKED) continue;
    (status === REPORT_STATUS_IDS.SECURE ? known : working).push(row);
  }
  return { known, working };
}

/**
 * One line per assessment: the plain name, a status word, and a sentence a
 * teacher can act on. Deliberately no percentages — a percentage of six items
 * invites a confidence the six items do not support.
 */
export function buildAssessmentOverview(report = {}) {
  const formal = report.formalAssessments || {};
  const letters = summariseLetters(formal.individualLetterMatrix || []);
  const patterns = summarisePatterns(formal.individualAdvancedPhonicsMatrix || []);
  const profile = formal.individualBenchmarkProfile || [];

  const rows = [];

  rows.push({
    area: EL_PLAIN_ASSESSMENT_NAMES.el_letter_assessment,
    question: EL_PLAIN_ASSESSMENT_MEANING.el_letter_assessment,
    status: letters.assessedCount
      ? (letters.working.length ? REPORT_STATUS_IDS.DEVELOPING : REPORT_STATUS_IDS.SECURE)
      : REPORT_STATUS_IDS.NOT_CHECKED,
    result: letters.assessedCount
      ? `Knows ${letters.known.length} of the ${letters.assessedCount} letters assessed so far.`
      : "Not assessed yet."
  });

  rows.push({
    area: EL_PLAIN_ASSESSMENT_NAMES.advanced_phonics_patterns,
    question: EL_PLAIN_ASSESSMENT_MEANING.advanced_phonics_patterns,
    status: (patterns.known.length + patterns.working.length)
      ? (patterns.working.length ? REPORT_STATUS_IDS.DEVELOPING : REPORT_STATUS_IDS.SECURE)
      : REPORT_STATUS_IDS.NOT_CHECKED,
    result: (patterns.known.length + patterns.working.length)
      ? `Knows ${patterns.known.length} of the ${patterns.known.length + patterns.working.length} letter teams assessed.`
      : "Not assessed yet."
  });

  for (const domain of profile) {
    const assessmentId = DOMAIN_TO_ASSESSMENT[domain?.domainKey];
    if (!assessmentId) continue;
    rows.push({
      area: EL_PLAIN_ASSESSMENT_NAMES[assessmentId] || domain.domainLabel,
      question: EL_PLAIN_ASSESSMENT_MEANING[assessmentId] || "",
      status: domain?.hasSavedEvidence
        ? REPORT_STATUS_IDS.NOT_ENOUGH_EVIDENCE
        : REPORT_STATUS_IDS.NOT_CHECKED,
      // Every one of these is marked provisional by the report builder, and the
      // app deliberately applies no national cut score. Saying "started, not
      // enough to judge" is the honest version of that, and it is shorter than
      // the paragraph of caveats it replaces.
      result: domain?.hasSavedEvidence
        ? "Started. Not enough yet to say where they are."
        : "Not assessed yet."
    });
  }

  return rows;
}

/**
 * Turns a gap signature into an instruction. A teacher does not want to be told
 * which of four cells failed; they want to know whether to reteach the sound,
 * the name, or the lower-case form.
 */
function gapHeadline(gap) {
  const wantsSound = gap.includes("sound");
  const wantsName = gap.includes("name");
  const onlyCapital = gap.includes("capital") && !gap.includes("small");
  const onlySmall = gap.includes("small") && !gap.includes("capital");

  if (wantsSound && !wantsName) return "Teach the SOUND";
  if (wantsName && !wantsSound) return "Teach the NAME";
  if (onlyCapital) return "Teach the CAPITAL";
  if (onlySmall) return "Teach the small letter";
  return "Teach name and sound";
}

/** What the student already has, so the step is not read as a whole-letter gap. */
function gapReassurance(gap) {
  const wantsSound = gap.includes("sound");
  const wantsName = gap.includes("name");
  if (wantsSound && !wantsName) return "  (they know the names)";
  if (wantsName && !wantsSound) return "  (they know the sounds)";
  return "";
}

/**
 * The only part most teachers will read. Concrete, ordered, and capped — a list
 * of thirty things to teach next is a list of nothing to teach next.
 */
export function buildTeachNext(report = {}, studentName = "This student") {
  const formal = report.formalAssessments || {};
  const letters = summariseLetters(formal.individualLetterMatrix || []);
  const patterns = summarisePatterns(formal.individualAdvancedPhonicsMatrix || []);
  const profile = formal.individualBenchmarkProfile || [];
  const steps = [];

  if (letters.working.length) {
    // Grouped by what is actually missing, not listed letter by letter.
    // "D/d (capital sound, small sound); K/k (capital sound, small sound);
    // R/r (capital sound, small sound)" says one thing three times and buries
    // it. "Sounds, not names: D/d, K/k, R/r" is the same fact and a lesson
    // plan. Repeating a phrase per row was the whole complaint about the old
    // report; it does not get to come back in the new one.
    const byGap = new Map();
    for (const entry of letters.working) {
      const key = entry.gaps.join(" + ") || "not yet right";
      if (!byGap.has(key)) byGap.set(key, []);
      byGap.get(key).push(entry.letterPair);
    }
    for (const [gap, pairs] of byGap) {
      const listed = pairs.slice(0, 14).join(", ")
        + (pairs.length > 14 ? ` …and ${pairs.length - 14} more` : "");
      steps.push({ step: gapHeadline(gap), detail: `${listed}${gapReassurance(gap)}` });
    }
  }

  if (letters.notAssessed.length) {
    steps.push({
      step: "Finish the letter assessment",
      detail: `${letters.notAssessed.length} letters have not been assessed: `
        + letters.notAssessed.slice(0, 12).map(row => row.letterPair).join(", ")
        + (letters.notAssessed.length > 12 ? " …" : "")
    });
  }

  if (patterns.working.length) {
    steps.push({
      step: "Practise these letter teams",
      detail: patterns.working.slice(0, 10).map(row => row.pattern).join(", ")
        + (patterns.working.length > 10 ? " …" : "")
    });
  }

  const notStarted = profile
    .filter(domain => !domain?.hasSavedEvidence && DOMAIN_TO_ASSESSMENT[domain?.domainKey])
    .map(domain => EL_PLAIN_ASSESSMENT_NAMES[DOMAIN_TO_ASSESSMENT[domain.domainKey]]);
  if (notStarted.length) {
    steps.push({
      step: "Assessments still to do",
      detail: notStarted.join(", ")
    });
  }

  if (!steps.length) {
    steps.push({
      step: "Nothing outstanding",
      detail: `Everything assessed so far came back secure for ${studentName}.`
    });
  }

  return steps;
}

function letterMatrixRows(letterRows = []) {
  return letterRows
    .filter(row => [row?.uppercaseName, row?.uppercaseSound, row?.lowercaseName, row?.lowercaseSound]
      .some(wasAssessed))
    .map(row => ({
      label: row.letterPair || row.letter,
      cells: [
        statusOf(row.uppercaseName),
        statusOf(row.uppercaseSound),
        statusOf(row.lowercaseName),
        statusOf(row.lowercaseSound)
      ]
    }));
}

export async function createSimpleElAssessmentWorkbook(report = {}, {
  studentName = "Student",
  className = "",
  scopeLabel = "",
  generatedAt = new Date()
} = {}) {
  const workbook = await createReportWorkbook({
    title: `${studentName} — letters, sounds and reading`,
    subject: "EL assessment report",
    generatedAt
  });

  const formal = report.formalAssessments || {};
  const letters = summariseLetters(formal.individualLetterMatrix || []);
  const overview = buildAssessmentOverview(report);
  const teachNext = buildTeachNext(report, studentName);
  const assessedAreas = overview.filter(row => row.status !== REPORT_STATUS_IDS.NOT_CHECKED).length;

  const sheet = addSheet(workbook, "Report", { tabColor: WORKBOOK_COLORS.primary });

  writeCell(sheet, "B2", studentName, { font: WORKBOOK_FONTS.coverTitle });
  writeCell(sheet, "B3", [className, scopeLabel].filter(Boolean).join("  ·  "), {
    font: WORKBOOK_FONTS.coverSubtitle
  });
  writeCell(sheet, "B4", `Letters, sounds and reading  ·  ${generatedAt.toLocaleDateString()}`, {
    font: WORKBOOK_FONTS.bodyMuted
  });

  let row = addKpiBand(sheet, 6, [
    {
      label: "Assessments done",
      value: `${assessedAreas} of ${overview.length}`,
      note: "Areas with any saved result",
      tone: "brand"
    },
    {
      label: "Letters known",
      value: letters.assessedCount ? `${letters.known.length} of ${letters.assessedCount}` : null,
      note: letters.assessedCount ? "Of the letters assessed so far" : "No letters assessed yet",
      tone: letters.working.length ? REPORT_STATUS_IDS.DEVELOPING : REPORT_STATUS_IDS.SECURE
    },
    {
      label: "Still to reteach",
      value: String(letters.working.length),
      note: "Letters with something not yet right",
      tone: letters.working.length ? REPORT_STATUS_IDS.NEEDS_SUPPORT : REPORT_STATUS_IDS.SECURE
    }
  ]);

  row = addSectionHeading(
    sheet,
    row + 1,
    "Teach next",
    "The shortest useful list. Work down it."
  );
  const teachNextTable = addTable(sheet, row, [
    { key: "step", header: "Do this", width: 30 },
    { key: "detail", header: "Which ones", width: 50, wrap: true }
  ], teachNext, { autoFilter: false, freezeHeader: false });
  const teachNextFirstRow = teachNextTable.firstDataRow;
  row = teachNextTable.nextRow;

  row = addSectionHeading(
    sheet,
    row + 1,
    `Where ${studentName} is`,
    "One line per area. Anything not assessed is left blank rather than counted as zero."
  );
  const overviewTable = addTable(sheet, row, [
    { key: "area", header: "Area", width: 30 },
    { key: "question", header: "What it asks", width: 50, wrap: true },
    { key: "status", header: "Where they are", width: 22, type: "status" },
    { key: "result", header: "In plain terms", width: 46, wrap: true }
  ], overview, { autoFilter: false, freezeHeader: false });
  const overviewFirstRow = overviewTable.firstDataRow;

  // COLUMN WIDTHS ARE SET ONCE, HERE, AFTER EVERY TABLE.
  //
  // addTable sizes each column as it writes, so two tables sharing a sheet
  // fight and the last one wins — which is why the first draft rendered
  // "Reteach these letter" and clipped half the status words. Excel has one
  // width per column, not one per table, so the sheet needs a single grid that
  // both tables are designed to sit in.
  //
  // This is also why the letter matrix is on its own sheet below: a grid of
  // ✓ marks wants 13-wide columns and a prose table wants 50-wide ones, and no
  // single grid serves both.
  // Columns F and G carry the third KPI card only; without a width they render
  // at Excel's 8-character default and the card collapses beside the others.
  const REPORT_GRID = [null, 2, 30, 50, 22, 46, 34, 34];
  REPORT_GRID.forEach((width, index) => {
    if (width) sheet.getColumn(index).width = width;
  });

  // ExcelJS does not auto-fit row height, so wrapped text is simply clipped at
  // the default 18pt. Estimating from the longest wrapped cell is crude, but a
  // slightly tall row reads fine and a clipped one loses the sentence.
  const wrapped = [
    { rows: teachNext, keys: [["detail", 50]] },
    { rows: overview, keys: [["question", 50], ["result", 46]] }
  ];
  let cursor = 0;
  for (const group of wrapped) {
    cursor = group === wrapped[0] ? teachNextFirstRow : overviewFirstRow;
    group.rows.forEach((entry, index) => {
      const lines = group.keys.reduce((most, [key, width]) => Math.max(
        most,
        Math.ceil(String(entry?.[key] ?? "").length / width)
      ), 1);
      sheet.getRow(cursor + index).height = Math.max(20, Math.min(72, lines * 15 + 6));
    });
  }

  applyPrintSetup(sheet, {
    landscape: false,
    titleForFooter: `${studentName} — letters, sounds and reading`
  });

  const matrixRows = letterMatrixRows(formal.individualLetterMatrix || []);
  if (matrixRows.length) {
    const letterSheet = addSheet(workbook, "Letters", { tabColor: WORKBOOK_COLORS.teal });
    writeCell(letterSheet, "B2", `${studentName} — letter by letter`, {
      font: WORKBOOK_FONTS.coverTitle
    });
    const letterRow = addSectionHeading(
      letterSheet,
      4,
      "Which letters are secure",
      `${reportStatusLabel(REPORT_STATUS_IDS.SECURE)} = right when assessed. `
        + `${reportStatusLabel(REPORT_STATUS_IDS.NEEDS_SUPPORT)} = not right yet. `
        + "A blank means that part has not been assessed — it is not a wrong answer."
    );
    addStatusMatrix(letterSheet, letterRow, {
      rowHeader: "Letter",
      columnHeaders: ["Capital name", "Capital sound", "Small name", "Small sound"],
      rows: matrixRows,
      // Four columns, so headers stay horizontal. The default tips anything
      // over 12 characters onto the diagonal, which put "Capital sound"
      // sideways next to "Capital name" lying flat.
      rotateHeadersOver: 40,
      columnWidth: 15
    });
    letterSheet.getColumn(1).width = 2;
    applyPrintSetup(letterSheet, {
      repeatHeaderRow: letterRow,
      titleForFooter: `${studentName} — letter by letter`
    });
  }

  return workbook;
}

function fileNameFor(studentName, generatedAt) {
  const slug = String(studentName || "student")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "student";
  const date = generatedAt.toISOString().slice(0, 10);
  return `${slug}-letters-and-sounds-${date}.xlsx`;
}

export async function exportSimpleElAssessmentExcel(report = {}, options = {}) {
  const generatedAt = options.generatedAt || new Date();
  const workbook = await createSimpleElAssessmentWorkbook(report, { ...options, generatedAt });
  await downloadWorkbook(workbook, fileNameFor(options.studentName, generatedAt));
  return workbook;
}
