import { EL_DECODING_MICROPHASES } from "../data/elBenchmarkAssessmentCatalog.js";
import { elSkillsBlockCycles } from "../data/elSkillsBlockCycles.js";
import { enrichGuidedReadingBook } from "../utils/guidedReading/phonicsPageAnalyzer.js";

// One instructional contract for the three child experiences. These are not
// three competing curricula: EL teaches the code, games rehearse it, and books
// and stories build the language and knowledge needed to understand text.
export const LITERACY_EXPERIENCE_LANES = Object.freeze({
  TEACH: "el_teaching",
  PRACTISE: "practice_and_play",
  MEANING: "language_and_meaning"
});

export const READING_PURPOSES = Object.freeze({
  INDEPENDENT: "independent",
  SUPPORTED: "supported"
});

const EL_PLACEMENT_ASSESSMENTS = new Set(["el_decoding", "el_encoding"]);

function recordStudentId(record = {}) {
  return String(
    record.studentId
    || record.student_id
    || record.student?.id
    || record.metadata?.studentId
    || record.metadata?.student_id
    || ""
  );
}

function recordTime(record = {}) {
  const parsed = Date.parse(
    record.completedAt
    || record.completed_at
    || record.updatedAt
    || record.updated_at
    || record.createdAt
    || record.created_at
    || record.timestamp
    || ""
  );
  return Number.isFinite(parsed) ? parsed : 0;
}

function assessmentId(record = {}) {
  return String(
    record.assessmentId
    || record.assessment_id
    || record.metadata?.assessmentId
    || record.benchmark?.assessmentId
    || ""
  );
}

function completedRecord(record = {}) {
  const status = String(record.administrationStatus || record.status || "completed").toLowerCase();
  return status === "completed";
}

function normalizePlacement(placement = {}, record = {}) {
  const microphase = String(
    placement.microphase || placement.candidateMicrophase || placement.id || ""
  ).trim();
  if (!microphase) return null;
  const definition = EL_DECODING_MICROPHASES.find(row => row.id === microphase) || null;
  const explicitAnchor = Number(placement.anchorCycle);
  const anchorCycle = Number.isInteger(explicitAnchor) && explicitAnchor > 0
    ? explicitAnchor
    : Number.isInteger(definition?.anchorCycle)
      ? definition.anchorCycle
      : null;
  return {
    microphase,
    label: placement.label || definition?.label || microphase,
    anchorCycle,
    confirmedAt: placement.confirmedAt || record.completedAt || record.updatedAt || "",
    sourceAssessmentId: assessmentId(record),
    sourceAttemptId: record.attemptId || record.id || ""
  };
}

/**
 * The latest teacher-confirmed EL placement for one child.
 *
 * Candidate/provisional placements are deliberately ignored: the benchmark UI
 * already owns confirmation, and downstream experiences must not silently turn
 * an unconfirmed indication into a teaching decision.
 */
export function resolveConfirmedElPlacement({ assessmentHistory = [], studentId = "" } = {}) {
  const expectedStudentId = String(studentId || "");
  const records = (Array.isArray(assessmentHistory) ? assessmentHistory : [])
    .filter(record => EL_PLACEMENT_ASSESSMENTS.has(assessmentId(record)))
    .filter(completedRecord)
    .filter(record => !expectedStudentId || recordStudentId(record) === expectedStudentId)
    .map(record => ({
      record,
      placement: normalizePlacement(record.confirmedPlacement, record)
    }))
    .filter(row => row.placement)
    .sort((left, right) => (
      recordTime(right.record) - recordTime(left.record)
      || Number(assessmentId(right.record) === "el_decoding")
        - Number(assessmentId(left.record) === "el_decoding")
    ));
  return records[0]?.placement || null;
}

function splitSpellings(value = "") {
  return String(value || "")
    .toLowerCase()
    .split(/[\s/,+]+/u)
    .map(item => item.replace(/[^a-z]/gu, ""))
    .filter(item => item && item !== "pattern");
}

export function elCodeThroughCycle(cycleNumber = null) {
  if (!Number.isInteger(Number(cycleNumber)) || Number(cycleNumber) <= 0) {
    return { graphemes: new Set(), highFrequencyWords: new Set() };
  }
  const graphemes = new Set();
  const highFrequencyWords = new Set();
  for (const cycle of elSkillsBlockCycles) {
    if (!cycle.cycleNumber || cycle.cycleNumber > Number(cycleNumber)) continue;
    for (const item of cycle.focusLetters || []) {
      splitSpellings(item.spelling || item.grapheme).forEach(spelling => graphemes.add(spelling));
    }
    for (const word of cycle.highFrequencyWords || []) {
      highFrequencyWords.add(String(word || "").toLowerCase());
    }
  }
  return { graphemes, highFrequencyWords };
}

function canSegmentWithGraphemes(word = "", graphemes = new Set()) {
  const clean = String(word || "").toLowerCase().replace(/[^a-z]/gu, "");
  if (!clean) return false;
  const spellings = [...graphemes].filter(Boolean).sort((a, b) => b.length - a.length);
  const reachable = new Set([0]);
  for (let index = 0; index < clean.length; index += 1) {
    if (!reachable.has(index)) continue;
    for (const spelling of spellings) {
      if (clean.startsWith(spelling, index)) reachable.add(index + spelling.length);
    }
  }
  return reachable.has(clean.length);
}

function advancedPatternsAreTaught(detail = {}, graphemes = new Set()) {
  const patterns = detail.phonicsPatterns || [];
  for (const pattern of patterns) {
    const match = String(pattern).match(/^(?:digraph|vowel-team|r-controlled)-(.+)$/u);
    if (match && !graphemes.has(match[1])) return false;
    // Knowing the component letters is not the same as having been taught a
    // consonant blend or silent-e pattern.
    if (/^(?:initial-blend|final-blend)-/u.test(pattern)) return false;
    if (pattern === "silent-e") return false;
  }
  return true;
}

function placementFromProgress(studentProgress = {}) {
  const placement = studentProgress.elPlacement || studentProgress.confirmedElPlacement || {};
  const anchor = Number(
    placement.anchorCycle
    ?? studentProgress.elAnchorCycle
    ?? studentProgress.anchorCycle
  );
  return {
    ...placement,
    anchorCycle: Number.isInteger(anchor) && anchor > 0 ? anchor : null
  };
}

/**
 * Classify a book without restricting access to it.
 *
 * "Independent" is intentionally literal: every running word must either be a
 * taught HFW or use a taught code pattern. Anything else remains available as
 * supported meaning-building, with narration and decoding help.
 */
export function classifyBookReadingPurpose(book = {}, studentProgress = {}) {
  const placement = placementFromProgress(studentProgress);
  if (!placement.anchorCycle) {
    return {
      id: READING_PURPOSES.SUPPORTED,
      label: "Read with help",
      shortLabel: "Reading help",
      reason: "Reading help keeps the story and ideas open while the teaching point is confirmed.",
      anchorCycle: null,
      notYetIndependentWords: []
    };
  }

  const alreadyEnriched = Number.isInteger(book.wordCount)
    && Array.isArray(book.pages)
    && book.pages.every(page => page?.analysis);
  const enriched = alreadyEnriched ? book : enrichGuidedReadingBook(book);
  const { graphemes, highFrequencyWords } = elCodeThroughCycle(placement.anchorCycle);
  const details = new Map(
    enriched.pages.flatMap(page => page.analysis?.wordDetails || []).map(detail => [detail.word, detail])
  );
  const notYetIndependentWords = [];
  for (const word of enriched.pages.flatMap(page => page.analysis?.words || [])) {
    const clean = String(word || "").toLowerCase();
    if (highFrequencyWords.has(clean)) continue;
    const detail = details.get(clean);
    const readable = Boolean(
      detail?.decodable
      && canSegmentWithGraphemes(clean, graphemes)
      && advancedPatternsAreTaught(detail, graphemes)
    );
    if (!readable && !notYetIndependentWords.includes(clean)) notYetIndependentWords.push(clean);
  }

  if (notYetIndependentWords.length === 0 && enriched.wordCount > 0) {
    return {
      id: READING_PURPOSES.INDEPENDENT,
      label: "Read it yourself",
      shortLabel: "Read it",
      reason: `The print uses the code taught by Cycle ${placement.anchorCycle}.`,
      anchorCycle: placement.anchorCycle,
      notYetIndependentWords: []
    };
  }

  return {
    id: READING_PURPOSES.SUPPORTED,
    label: "Read with help",
    shortLabel: "Reading help",
    reason: "Use narration and word help; this book builds language and ideas beyond independent decoding.",
    anchorCycle: placement.anchorCycle,
    notYetIndependentWords: notYetIndependentWords.slice(0, 8)
  };
}

export function practiceCanAffectFormalPlacement() {
  return false;
}
