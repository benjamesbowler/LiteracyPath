import {
  SHEET_NAMES,
  addCoverSheet,
  addDataSheet,
  addHowToReadSheet,
  addKpiBand,
  addProvenanceSheet,
  addSectionHeading,
  addSheet,
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
  HFW_BUCKETS,
  REPORTING_BIBLE_POLICY,
  ROPE_STRANDS,
  SVR_COMPONENT_LABELS,
  STANDING_NOTICES,
  canonicalStatusId,
  evaluateEvidenceSufficiency,
  reportStatusLabel,
  resolveSvrProfile
} from "../policy/reportingBible.js";
import { buildSimpleHfwRows, buildSimpleOverview, buildSimpleSkillsRows } from "../data/simpleStudentReports.js";
import { TEACHER_COPY } from "../copy/teacherCopy.js";

/**
 * The student workbook.
 *
 * Replaces six separate single-purpose CSVs — one per report view, each a flat
 * row dump with export-only vocabulary ("Growing", "Not started yet") that
 * contradicted the screen. A teacher who wanted the whole picture had to
 * download five files and join them by hand.
 *
 * This is one file with the same sections as the screen, in the same order, in
 * the same words. Plus the two things the screen cannot easily give a teacher on
 * paper: a Simple-View-of-Reading profile that names what kind of reader this
 * child currently is, and a Teach next sheet that says what to do on Monday.
 */

const STUDENT_SHEETS = Object.freeze({
  TEACH_NEXT: SHEET_NAMES.TEACH_NEXT,
  PROFILE: "Reading profile",
  KNOWLEDGE: "What they know",
  SKILLS: "Skills",
  WORDS: "Common words",
  READING: "Guided reading",
  PRACTICE: "Practice"
});

const SHEET_ORDER = [
  SHEET_NAMES.COVER,
  SHEET_NAMES.SUMMARY,
  STUDENT_SHEETS.TEACH_NEXT,
  STUDENT_SHEETS.PROFILE,
  STUDENT_SHEETS.KNOWLEDGE,
  STUDENT_SHEETS.SKILLS,
  STUDENT_SHEETS.WORDS,
  STUDENT_SHEETS.READING,
  STUDENT_SHEETS.PRACTICE,
  SHEET_NAMES.HOW_TO_READ,
  SHEET_NAMES.DATA,
  SHEET_NAMES.PROVENANCE
];

function percentOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/**
 * Fold the concept spine into the two Simple View components.
 *
 * Word recognition and language comprehension multiply — a zero in either
 * produces zero comprehension — which is why an overall figure never tells a
 * teacher where to teach. Naming the profile does.
 */
export function buildSvrProfile(workspace = {}) {
  const concepts = workspace?.wholeChild?.concepts || [];
  const strandByDomain = new Map();
  ROPE_STRANDS.forEach(strand => strandByDomain.set(strand.id, strand));

  const domainToStrand = {
    phonological_awareness: "phonological_awareness",
    alphabet_knowledge: "decoding",
    phonics: "decoding",
    decoding: "decoding",
    encoding: "decoding",
    fluency: "sight_recognition",
    connected_text_reading: "sight_recognition",
    vocabulary: "vocabulary",
    comprehension: "verbal_reasoning",
    literacy_skill: "literacy_knowledge"
  };

  const totals = new Map();
  concepts.forEach(concept => {
    const strandId = domainToStrand[concept.domain];
    if (!strandId) return;
    const basis = concept.currentEvidenceBasis || concept.evidenceBasis || {};
    const scored = Number(basis.observations ?? basis.total ?? 0);
    if (!scored) return;
    const entry = totals.get(strandId) || { scored: 0, correct: 0, secure: 0, concepts: 0 };
    entry.scored += scored;
    entry.correct += Number(basis.correct || 0);
    entry.concepts += 1;
    if (canonicalStatusId(concept.status?.id) === "secure") entry.secure += 1;
    totals.set(strandId, entry);
  });

  const strands = ROPE_STRANDS.map(strand => {
    const entry = totals.get(strand.id) || { scored: 0, correct: 0, secure: 0, concepts: 0 };
    const sufficiency = evaluateEvidenceSufficiency(entry.scored);
    const accuracy = entry.scored ? Math.round((entry.correct / entry.scored) * 100) : null;
    return {
      ...strand,
      svrLabel: SVR_COMPONENT_LABELS[strand.svr],
      scoredItems: entry.scored,
      correct: entry.correct,
      conceptsChecked: entry.concepts,
      conceptsSecure: entry.secure,
      accuracy: sufficiency.ready ? accuracy : null,
      sufficiency
    };
  });

  const componentScore = component => {
    const relevant = strands.filter(strand => strand.svr === component && strand.sufficiency.ready);
    if (!relevant.length) return { ready: false, accuracy: null, scoredItems: strands.filter(s => s.svr === component).reduce((t, s) => t + s.scoredItems, 0) };
    const scored = relevant.reduce((total, strand) => total + strand.scoredItems, 0);
    const correct = relevant.reduce((total, strand) => total + strand.correct, 0);
    return { ready: true, accuracy: Math.round((correct / scored) * 100), scoredItems: scored };
  };

  const wordRecognition = componentScore("word_recognition");
  const languageComprehension = componentScore("language_comprehension");
  const secureBar = REPORTING_BIBLE_POLICY.mastery.accuracyPercentMinimum;

  const profile =
    wordRecognition.ready && languageComprehension.ready
      ? resolveSvrProfile({
          wordRecognitionSecure: wordRecognition.accuracy >= secureBar,
          languageComprehensionSecure: languageComprehension.accuracy >= secureBar
        })
      : null;

  return {
    strands,
    wordRecognition: { ...wordRecognition, label: SVR_COMPONENT_LABELS.word_recognition },
    languageComprehension: { ...languageComprehension, label: SVR_COMPONENT_LABELS.language_comprehension },
    profile,
    ready: Boolean(profile),
    note: profile
      ? profile.move
      : "There is not yet enough evidence in both halves of reading to name a profile. Reading the words and understanding language need separate assessment — an overall figure cannot tell you which one to teach."
  };
}

export async function createStudentReportWorkbook({
  workspace = {},
  studentName = "Student",
  className = "",
  overview = null,
  generatedAt = new Date(),
  generatedBy = "",
  periodLabel = "",
  provenanceRows = []
} = {}) {
  const taken = new Set();
  const stamp = generatedAt instanceof Date ? generatedAt : new Date(generatedAt);
  const simpleOverview = overview || buildSimpleOverview(workspace, studentName);
  const svr = buildSvrProfile(workspace);
  const wholeChild = workspace.wholeChild || {};
  const summaryCounts = wholeChild.summary || {};

  const workbook = await createReportWorkbook({
    title: `${studentName} — student report`,
    subject: "Literacy Guide student report",
    generatedAt: stamp
  });

  /* -------- Cover -------- */
  addCoverSheet(workbook, {
    eyebrow: "Literacy Guide · Student report",
    title: studentName,
    subtitle: [className, periodLabel].filter(Boolean).join(" · "),
    headline: buildStudentHeadline({ studentName, simpleOverview, svr, summaryCounts }),
    facts: [
      ["Class", className || "Not recorded"],
      ["Items with saved answers", `${simpleOverview.checkedCount} of ${simpleOverview.totalCount}`],
      ["Secure", simpleOverview.mastered.length],
      ["Developing", simpleOverview.practising.length],
      ["Needs support", simpleOverview.needsTeaching.length],
      ["Most recent result", summaryCounts.latestAt ? String(summaryCounts.latestAt).slice(0, 10) : "None recorded"],
      ["Report generated", stamp.toISOString().slice(0, 10)],
      generatedBy ? ["Generated by", generatedBy] : null
    ],
    notices: [STANDING_NOTICES.missingIsNotZero, STANDING_NOTICES.accuracyIsNotMastery, STANDING_NOTICES.screeningIsNotDiagnosis],
    taken
  });

  /* -------- Summary -------- */
  const summary = addSheet(workbook, SHEET_NAMES.SUMMARY, { tabColor: WORKBOOK_COLORS.teal, taken });
  summary.columns = [{ width: 2 }, ...Array.from({ length: 12 }, () => ({ width: 12 })), { width: 2 }];

  let row = addSectionHeading(summary, 2, "Learning overview", TEACHER_COPY.reports.overviewReconcile(simpleOverview.checkedCount, simpleOverview.totalCount), { span: 12 });
  row = addStatusSplit(
    summary,
    row,
    {
      needs_support: simpleOverview.needsTeaching.length,
      developing: simpleOverview.practising.length,
      secure: simpleOverview.mastered.length,
      not_enough_evidence: simpleOverview.notEnoughYet.length,
      not_checked: simpleOverview.yetToLearn.length
    },
    { reconcileLine: "Every item appears in exactly one group. Nothing is double-counted, and nothing missing is counted as wrong." }
  );

  row = addSectionHeading(summary, row, "Reading profile", svr.note, { span: 12 });
  addKpiBand(summary, row, [
    {
      label: SVR_COMPONENT_LABELS.word_recognition,
      value: svr.wordRecognition.ready ? svr.wordRecognition.accuracy / 100 : null,
      note: svr.wordRecognition.ready
        ? `${svr.wordRecognition.scoredItems} scored items`
        : `${svr.wordRecognition.scoredItems} scored items — needs ${REPORTING_BIBLE_POLICY.evidenceSufficiency.judgementMinimumScoredItems}`,
      tone: "brand",
      numFmt: "0%"
    },
    {
      label: SVR_COMPONENT_LABELS.language_comprehension,
      value: svr.languageComprehension.ready ? svr.languageComprehension.accuracy / 100 : null,
      note: svr.languageComprehension.ready
        ? `${svr.languageComprehension.scoredItems} scored items`
        : `${svr.languageComprehension.scoredItems} scored items — needs ${REPORTING_BIBLE_POLICY.evidenceSufficiency.judgementMinimumScoredItems}`,
      tone: "brand",
      numFmt: "0%"
    },
    {
      label: "Profile",
      value: svr.profile?.label || null,
      note: svr.profile ? "" : "Not enough evidence in both halves yet",
      tone: "neutral"
    }
  ], { columnsPerCard: 4 });

  applyPrintSetup(summary, { landscape: true, titleForFooter: `${studentName} — summary` });

  /* -------- Teach next -------- */
  const teachNext = addSheet(workbook, STUDENT_SHEETS.TEACH_NEXT, { tabColor: WORKBOOK_COLORS.amber, taken });
  teachNext.columns = [{ width: 2 }, { width: 30 }, { width: 16 }, { width: 14 }, { width: 56 }, { width: 2 }];
  row = addSectionHeading(
    teachNext,
    2,
    "Teach next",
    "Everything currently in Needs support, most evidence first. Start at the top.",
    { span: 4 }
  );
  const teachRows = simpleOverview.needsTeaching
    .slice()
    .sort((a, b) => (b.attempts || 0) - (a.attempts || 0))
    .map(item => ({
      item: item.displayLabel || item.label,
      accuracy: percentOrNull(item.accuracy),
      attempts: item.attempts || 0,
      why: item.whyNotSecure || item.sentence || ""
    }));
  const teachTable = addTable(
    teachNext,
    row,
    [
      { key: "item", header: "What to teach", width: 30, wrap: true },
      { key: "accuracy", header: "Accuracy", type: "percent", width: 12 },
      { key: "attempts", header: "Tries", type: "number", width: 13 },
      { key: "why", header: "Why it is not secure", width: 56, wrap: true }
    ],
    teachRows,
    { emptyMessage: "Nothing is currently in Needs support." }
  );
  row = teachTable.nextRow;

  row = addSectionHeading(
    teachNext,
    row,
    "Nearly there",
    "Developing items — these are the quickest wins.",
    { span: 4 }
  );
  const nearlyRows = simpleOverview.practising.map(item => ({
    item: item.displayLabel || item.label,
    accuracy: percentOrNull(item.accuracy),
    attempts: item.attempts || 0,
    why: item.whyNotSecure || item.sentence || ""
  }));
  const nearlyTable = addTable(
    teachNext,
    row,
    [
      { key: "item", header: "Almost secure", width: 30, wrap: true },
      { key: "accuracy", header: "Accuracy", type: "percent", width: 12 },
      { key: "attempts", header: "Tries", type: "number", width: 13 },
      { key: "why", header: "What is missing", width: 56, wrap: true }
    ],
    nearlyRows,
    { emptyMessage: "Nothing is in Developing right now." }
  );
  row = nearlyTable.nextRow;

  row = addSectionHeading(
    teachNext,
    row,
    "Assess next",
    "Items with some answers but not enough to judge. A short assessment here turns guesses into evidence.",
    { span: 4 }
  );
  addTable(
    teachNext,
    row,
    [
      { key: "item", header: "Needs more evidence", width: 30, wrap: true },
      { key: "attempts", header: "Tries so far", type: "number", width: 13 },
      { key: "needed", header: "Needs", type: "number", width: 13 },
      { key: "why", header: "Why", width: 56, wrap: true }
    ],
    simpleOverview.notEnoughYet.map(item => {
      const sufficiency = evaluateEvidenceSufficiency(item.attempts || 0);
      return {
        item: item.displayLabel || item.label,
        attempts: item.attempts || 0,
        needed: Math.max(0, REPORTING_BIBLE_POLICY.evidenceSufficiency.judgementMinimumScoredItems - (item.attempts || 0)),
        why: sufficiency.reason
      };
    }),
    { emptyMessage: "Nothing is waiting on more evidence." }
  );
  applyPrintSetup(teachNext, { landscape: true, titleForFooter: `${studentName} — teach next` });

  /* -------- Reading profile -------- */
  const profileSheet = addSheet(workbook, STUDENT_SHEETS.PROFILE, { tabColor: WORKBOOK_COLORS.blue, taken });
  profileSheet.columns = [{ width: 2 }];
  row = addSectionHeading(
    profileSheet,
    2,
    "Reading profile",
    "Reading has two halves and they multiply. A child can read every word and understand none of it, or understand everything and read none of it. These need separate teaching, so they get separate rows.",
    { span: 8 }
  );
  if (svr.profile) {
    profileSheet.mergeCells(`B${row}:H${row + 1}`);
    writeCell(profileSheet, `B${row}`, `${svr.profile.label} — ${svr.profile.move}`, {
      font: { ...WORKBOOK_FONTS.body, bold: true, size: 12 },
      fill: WORKBOOK_COLORS.primarySoft,
      alignment: { vertical: "middle", wrapText: true }
    });
    profileSheet.getRow(row).height = 24;
    row += 3;
  }
  addTable(
    profileSheet,
    row,
    [
      { key: "svrLabel", header: "Half of reading", width: 22 },
      { key: "label", header: "Strand", width: 26, wrap: true },
      { key: "accuracy", header: "Accuracy", type: "percent", width: 12 },
      { key: "scoredItems", header: "Scored items", type: "number", width: 13 },
      { key: "conceptsChecked", header: "Items checked", type: "number", width: 14 },
      { key: "conceptsSecure", header: "Secure", type: "number", width: 13 },
      { key: "evidence", header: "Evidence", width: 18 },
      { key: "ccss", header: "Standard", width: 12 },
      { key: "evidenceTier", header: "Research base", width: 16 }
    ],
    svr.strands.map(strand => ({
      ...strand,
      evidence: strand.sufficiency.label,
      evidenceTier: strand.evidence === "strong" ? "Strong" : strand.evidence === "moderate" ? "Moderate" : "Minimal"
    })),
    { emptyMessage: "No results yet." }
  );
  applyPrintSetup(profileSheet, { landscape: true, titleForFooter: `${studentName} — reading profile` });

  /* -------- What they know -------- */
  const knowledge = addSheet(workbook, STUDENT_SHEETS.KNOWLEDGE, { tabColor: WORKBOOK_COLORS.teal, taken });
  knowledge.columns = [{ width: 2 }];
  row = addSectionHeading(
    knowledge,
    2,
    "What this student knows",
    "Every item, in one table. Filter the status column to work through one group at a time.",
    { span: 9 }
  );
  const allItems = [
    ...simpleOverview.needsTeaching,
    ...simpleOverview.practising,
    ...simpleOverview.mastered,
    ...simpleOverview.notEnoughYet,
    ...simpleOverview.yetToLearn
  ].map(item => {
    const sufficiency = evaluateEvidenceSufficiency(item.attempts || 0);
    return {
      item: item.displayLabel || item.label,
      domain: item.domain || "",
      status: canonicalStatusId(item.statusId),
      accuracy: percentOrNull(item.accuracy),
      correct: item.correct ?? "",
      attempts: item.attempts || 0,
      evidence: sufficiency.label,
      why: item.whyNotSecure || "",
      history: item.historySentence || ""
    };
  });
  addTable(
    knowledge,
    row,
    [
      { key: "item", header: "Item", width: 28, wrap: true },
      { key: "domain", header: "Area", width: 22 },
      { key: "status", header: "Learning status", type: "status", width: 20 },
      { key: "accuracy", header: "Accuracy", type: "percent", width: 12 },
      { key: "correct", header: "Correct", type: "number", width: 13 },
      { key: "attempts", header: "Tries", type: "number", width: 12 },
      { key: "evidence", header: "Evidence", width: 18 },
      { key: "why", header: "Why not secure", width: 44, wrap: true },
      { key: "history", header: "History", width: 34, wrap: true }
    ],
    allItems,
    { freezeFirstColumn: true, emptyMessage: "Complete an assessment to begin this report." }
  );
  applyPrintSetup(knowledge, { landscape: true, repeatHeaderRow: row, titleForFooter: `${studentName} — what they know` });

  /* -------- Skills -------- */
  const skillsSheet = addSheet(workbook, STUDENT_SHEETS.SKILLS, { tabColor: WORKBOOK_COLORS.purple, taken });
  skillsSheet.columns = [{ width: 2 }];
  row = addSectionHeading(skillsSheet, 2, TEACHER_COPY.reportShell.productLabel + " — skills", TEACHER_COPY.reports.accuracyFooter, { span: 8 });
  const skillRows = buildSimpleSkillsRows(workspace, studentName).map(skill => {
    const sufficiency = evaluateEvidenceSufficiency(skill.attempts || 0);
    return {
      skill: skill.displayLabel || skill.label,
      status: canonicalStatusId(skill.statusId),
      accuracy: sufficiency.ready ? percentOrNull(skill.accuracy) : null,
      correct: skill.correct ?? "",
      attempts: skill.attempts || 0,
      evidence: sufficiency.label,
      lifetimeAccuracy: percentOrNull(skill.lifetimeAccuracy),
      why: skill.whyNotSecure || ""
    };
  });
  addTable(
    skillsSheet,
    row,
    [
      { key: "skill", header: "Skill", width: 28, wrap: true },
      { key: "status", header: "Learning status", type: "status", width: 20 },
      { key: "accuracy", header: "Accuracy now", type: "percent", width: 13 },
      { key: "lifetimeAccuracy", header: "Accuracy all time", type: "percent", width: 15 },
      { key: "correct", header: "Correct", type: "number", width: 13 },
      { key: "attempts", header: "Tries", type: "number", width: 12 },
      { key: "evidence", header: "Evidence", width: 18 },
      { key: "why", header: "Why not secure", width: 46, wrap: true }
    ],
    skillRows,
    { freezeFirstColumn: true, emptyMessage: "Complete a skills assessment to add skill results." }
  );
  applyPrintSetup(skillsSheet, { landscape: true, repeatHeaderRow: row, titleForFooter: `${studentName} — skills` });

  /* -------- Common words -------- */
  const words = addSheet(workbook, STUDENT_SHEETS.WORDS, { tabColor: WORKBOOK_COLORS.blue, taken });
  words.columns = [{ width: 2 }];
  row = addSectionHeading(
    words,
    2,
    "Common words",
    "Grouped by what kind of word it is, not as a single score out of a hundred. Trouble with a Flash Word is a phonics gap; trouble with a Heart Word is a memory gap. The teaching is different.",
    { span: 8 }
  );
  const hfwRows = buildSimpleHfwRows(workspace, studentName).map(word => {
    const sufficiency = evaluateEvidenceSufficiency(word.attempts || 0);
    return {
      word: word.key || word.label,
      task: word.construct || "",
      status: canonicalStatusId(word.statusId),
      accuracy: sufficiency.ready ? percentOrNull(word.accuracy) : null,
      correct: word.correct ?? "",
      attempts: word.attempts || 0,
      evidence: sufficiency.label
    };
  });
  const wordTable = addTable(
    words,
    row,
    [
      { key: "word", header: "Word", width: 14 },
      { key: "task", header: "Task", width: 24 },
      { key: "status", header: "Learning status", type: "status", width: 20 },
      { key: "accuracy", header: "Accuracy", type: "percent", width: 12 },
      { key: "correct", header: "Correct", type: "number", width: 13 },
      { key: "attempts", header: "Tries", type: "number", width: 12 },
      { key: "evidence", header: "Evidence", width: 18 }
    ],
    hfwRows,
    { freezeFirstColumn: true, emptyMessage: "No high-frequency word results saved yet." }
  );
  row = wordTable.nextRow;
  row = addSectionHeading(words, row, "How to read a word result", "", { span: 4 });
  addTable(
    words,
    row,
    [
      { key: "label", header: "Kind of word", width: 20 },
      { key: "description", header: "What it is", width: 44, wrap: true },
      { key: "teachingNote", header: "What to do about it", width: 54, wrap: true }
    ],
    HFW_BUCKETS,
    { freezeHeader: false, autoFilter: false }
  );
  applyPrintSetup(words, { landscape: true, titleForFooter: `${studentName} — common words` });

  /* -------- Guided reading -------- */
  const guided = workspace.guidedReading || {};
  const reading = addSheet(workbook, STUDENT_SHEETS.READING, { tabColor: WORKBOOK_COLORS.amber, taken });
  reading.columns = [{ width: 2 }];
  row = addSectionHeading(
    reading,
    2,
    "Guided reading",
    "Words read correctly in a book were read in connected text. That is not the same as knowing them on their own, and this report does not relabel them as learned.",
    { span: 8 }
  );
  row = addKpiBand(reading, row, [
    { label: "Books completed", value: guided.summary?.booksCompleted ?? 0, note: "Finished with a saved record", tone: "brand" },
    { label: "Rereads", value: guided.summary?.rereads ?? 0, note: "Repeat readings", tone: "neutral" },
    { label: "Support words", value: guided.summary?.wordsNeedingSupportInText ?? 0, note: "Needed help during reading", tone: "developing" }
  ], { columnsPerCard: 3 });

  const bookRows = (guided.books || []).map(book => ({
    title: book.title || "Untitled book",
    level: book.level ?? "Level not recorded",
    completed: book.completed ? "Completed" : "In progress",
    reads: book.readCount ?? book.reads ?? 1,
    lastRead: book.lastReadAt || book.observedAt || "",
    correct: (book.wordsReadCorrectly || []).length,
    support: (book.wordsNeedingSupport || []).length,
    notes: (book.notes || []).map(note => note.text || note).join(" · ")
  }));
  const bookTable = addTable(
    reading,
    row,
    [
      { key: "title", header: "Book", width: 30, wrap: true },
      { key: "level", header: "Level", width: 12 },
      { key: "completed", header: "Status", width: 14 },
      { key: "reads", header: "Reads", type: "number", width: 12 },
      { key: "lastRead", header: "Last read", type: "date", width: 13 },
      { key: "correct", header: "Read correctly", type: "number", width: 14 },
      { key: "support", header: "Needed support", type: "number", width: 15 },
      { key: "notes", header: "Teacher notes", width: 50, wrap: true }
    ],
    bookRows,
    { emptyMessage: "No guided reading records yet." }
  );
  row = bookTable.nextRow;

  const supportWords = (guided.wordRows || []).filter(word => canonicalStatusId(word.statusLabel) !== "secure");
  row = addSectionHeading(reading, row, "Words that needed support", "In the books read so far.", { span: 6 });
  addTable(
    reading,
    row,
    [
      { key: "word", header: "Word", width: 16 },
      { key: "title", header: "Book", width: 30, wrap: true },
      { key: "level", header: "Level", width: 12 },
      { key: "observedAt", header: "When", type: "date", width: 13 }
    ],
    supportWords,
    { emptyMessage: "No support words have been recorded." }
  );
  applyPrintSetup(reading, { landscape: true, titleForFooter: `${studentName} — guided reading` });

  /* -------- Practice -------- */
  const other = workspace.otherLearning || {};
  const practice = addSheet(workbook, STUDENT_SHEETS.PRACTICE, { tabColor: WORKBOOK_COLORS.slate, taken });
  practice.columns = [{ width: 2 }];
  row = addSectionHeading(
    practice,
    2,
    "Practice",
    "Practice results support teacher judgement but are not formal assessment results, and practice alone can never make something Secure.",
    { span: 6 }
  );
  const practiceRows = [
    ...(other.soundSeekers?.sounds || []).map(sound => ({
      area: "Sound Seekers",
      item: sound.label || sound.key || "",
      result: sound.statusLabel || sound.bucket || "",
      detail: sound.note || ""
    })),
    ...(other.arcade?.games || []).map(game => ({
      area: "Arcade",
      item: game.label || game.name || "",
      result: game.summary || `${game.plays ?? 0} plays`,
      detail: game.note || ""
    })),
    ...(other.storyQuests?.stories || []).map(story => ({
      area: "Story Quests",
      item: story.title || story.label || "",
      result: story.completed ? "Completed" : "In progress",
      detail: (story.vocabulary || []).join(", ")
    }))
  ];
  addTable(
    practice,
    row,
    [
      { key: "area", header: "Where", width: 18 },
      { key: "item", header: "What", width: 30, wrap: true },
      { key: "result", header: "Result", width: 22 },
      { key: "detail", header: "Detail", width: 50, wrap: true }
    ],
    practiceRows,
    { emptyMessage: "No practice results recorded yet." }
  );
  applyPrintSetup(practice, { landscape: true, titleForFooter: `${studentName} — practice` });

  /* -------- How to read -------- */
  addHowToReadSheet(workbook, {
    metricRows: [
      { label: "Answer accuracy", definition: "The share of scored answers that were correct. Shown separately from learning status on purpose." },
      { label: "Learning status", definition: "Whether learning is secure. Needs enough recent, scored, independent evidence — not just a high percentage." },
      { label: "Tries", definition: "How many scored answers back the judgement. This is the denominator." },
      { label: "Reading profile", definition: "Where this child sits on the two halves of reading: reading the words, and understanding language. They multiply, so both need teaching." },
      { label: "Flash Word / Heart Word", definition: "A Flash Word is regularly spelled and should be decodable. A Heart Word has a part that must be learned by heart. Different problems, different teaching." },
      { label: "Practice", definition: "Games, quests and independent activity. Supports a teacher's judgement, never replaces it, and cannot on its own make anything Secure." }
    ],
    extraNotes: [
      "This workbook uses the same words and colours as the app. If a status here disagrees with the screen, that is a bug — please report it.",
      REPORTING_BIBLE_POLICY.exportPrivacy.confidentialityBanner
    ],
    taken
  });

  /* -------- Data -------- */
  addDataSheet(
    workbook,
    [
      { key: "student_name", header: "student_name", width: 20 },
      { key: "class_name", header: "class_name", width: 18 },
      { key: "period", header: "period", width: 14 },
      { key: "item_code", header: "item_code", width: 28 },
      { key: "item_name", header: "item_name", width: 28 },
      { key: "domain", header: "domain", width: 22 },
      { key: "items_scored", header: "items_scored", type: "number", width: 13 },
      { key: "items_correct", header: "items_correct", type: "number", width: 13 },
      { key: "accuracy_percent", header: "accuracy_percent", type: "number", width: 16 },
      { key: "status_id", header: "status_id", width: 20 },
      { key: "status_label", header: "status_label", width: 20 },
      { key: "evidence_sufficiency", header: "evidence_sufficiency", width: 20 },
      { key: "observed_at", header: "observed_at", width: 14 }
    ],
    (wholeChild.concepts || []).map(concept => {
      const basis = concept.currentEvidenceBasis || concept.evidenceBasis || {};
      const scored = Number(basis.observations ?? basis.total ?? 0);
      const sufficiency = evaluateEvidenceSufficiency(scored);
      return {
        student_name: studentName,
        class_name: className,
        period: periodLabel,
        item_code: concept.conceptId,
        item_name: concept.label,
        domain: concept.domainLabel || concept.domain,
        items_scored: scored,
        items_correct: Number(basis.correct || 0),
        accuracy_percent: sufficiency.ready ? percentOrNull(basis.accuracy) : "",
        status_id: sufficiency.ready ? canonicalStatusId(concept.status?.id) : "not_enough_evidence",
        status_label: sufficiency.ready ? reportStatusLabel(concept.status?.id) : reportStatusLabel("not_enough_evidence"),
        evidence_sufficiency: sufficiency.id,
        observed_at: concept.latestAt ? String(concept.latestAt).slice(0, 10) : ""
      };
    }),
    { taken }
  );

  /* -------- Provenance -------- */
  addProvenanceSheet(
    workbook,
    provenanceRows.length
      ? provenanceRows
      : [
          { field: "Report", value: `${studentName} student report` },
          { field: "Class", value: className },
          { field: "Assessment period", value: periodLabel },
          { field: "Generated", value: stamp.toISOString() },
          { field: "Generated by", value: generatedBy || "Not recorded" },
          { field: "Sources read", value: (workspace.provenance?.sourceReads || []).map(source => `${source.store}: ${source.recordCount} rows`).join("; ") || "Not recorded" }
        ],
    { taken, extraNotes: [REPORTING_BIBLE_POLICY.exportPrivacy.releaseNotice] }
  );

  orderSheets(workbook, SHEET_ORDER);
  return workbook;
}

function buildStudentHeadline({ studentName, simpleOverview, svr, summaryCounts }) {
  const parts = [];
  parts.push(
    `${simpleOverview.checkedCount} of ${simpleOverview.totalCount} items have saved answers for ${studentName}.`
  );
  if (simpleOverview.needsTeaching.length) {
    parts.push(
      `${simpleOverview.needsTeaching.length} ${simpleOverview.needsTeaching.length === 1 ? "item needs" : "items need"} support — they are listed on the Teach next sheet, most evidence first.`
    );
  } else if (simpleOverview.checkedCount) {
    parts.push("Nothing is currently in Needs support.");
  }
  if (svr.profile) {
    parts.push(`Reading profile: ${svr.profile.label}. ${svr.profile.move}`);
  } else {
    parts.push("There is not yet enough evidence in both halves of reading to name a profile.");
  }
  if (summaryCounts.latestAt) {
    parts.push(`Most recent result: ${String(summaryCounts.latestAt).slice(0, 10)}.`);
  }
  return parts.join(" ");
}

export async function exportStudentReportWorkbook(options = {}) {
  const workbook = await createStudentReportWorkbook(options);
  const date = (options.generatedAt instanceof Date ? options.generatedAt : new Date()).toISOString().slice(0, 10);
  const fileName = options.fileName || `${slug(options.studentName || "student")}-report-${date}.xlsx`;
  return downloadWorkbook(workbook, fileName);
}

function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "student";
}

export const STUDENT_WORKBOOK_SHEETS = STUDENT_SHEETS;
