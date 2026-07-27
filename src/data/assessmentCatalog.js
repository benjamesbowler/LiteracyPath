/**
 * ONE LIST OF EVERY CHECK A TEACHER CAN START.
 *
 * Before this file there were three separate places that described a startable
 * check: `skillTree.js` (30 skill checkpoints), `EL_BENCHMARK_CATALOG` (four EL
 * domains) and two hand-written cards in the old EL hub page that had no data
 * behind them at all. The picker on the Checks funnel needs one list, so this
 * module composes the existing sources rather than restating them - the skill
 * labels and the EL titles still have exactly one home.
 *
 * Each entry says four things the funnel needs:
 *   - what it is, in teacher English (`label`, `description`);
 *   - what it costs to give (`estimatedMinutes`, `administration`);
 *   - what step 4 must ask for before Begin can be pressed (`startPoint`);
 *   - which starter function runs it (`starter`, plus `benchmarkId` when the
 *     starter needs to know which EL domain).
 *
 * This file lives under src/data/ and is never rendered directly, so the copy
 * gate does not scan it. Everything here is nonetheless written as the teacher
 * will read it, because the funnel prints these strings verbatim.
 */
import { skillTree } from "../skillTree.js";
import {
  EL_BENCHMARK_CATALOG,
  EL_BENCHMARK_IDS,
  EL_DECODING_MICROPHASES,
  listElBenchmarkRoutes
} from "./elBenchmarkAssessments.js";

/** How a chosen check is actually launched. */
export const ASSESSMENT_STARTERS = Object.freeze({
  SKILL_CHECK: "skillCheck",
  LETTER_CHECK: "letterCheck",
  PHONICS_PATTERN_CHECK: "phonicsPatternCheck",
  EL_BENCHMARK: "elBenchmark"
});

/** What the funnel has to ask for at step 4 before Begin means anything. */
export const ASSESSMENT_START_POINT_KINDS = Object.freeze({
  NONE: "none",
  SKILL: "skill",
  GRADE_AND_TIME: "gradeAndTime",
  GRADE_TIME_AND_BAND: "gradeTimeAndBand"
});

export const ASSESSMENT_GRADE_OPTIONS = Object.freeze([
  Object.freeze({ value: "K", label: "Kindergarten" }),
  Object.freeze({ value: "1", label: "Grade 1" }),
  Object.freeze({ value: "2", label: "Grade 2" })
]);

export const ASSESSMENT_TIME_OF_YEAR_OPTIONS = Object.freeze([
  Object.freeze({ value: "BOY", label: "Beginning of year" }),
  Object.freeze({ value: "MOY", label: "Middle of year" }),
  Object.freeze({ value: "EOY", label: "End of year" })
]);

const BENCHMARK_LABELS = Object.freeze({
  [EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS]: "Sound awareness",
  [EL_BENCHMARK_IDS.ENCODING]: "Spelling",
  [EL_BENCHMARK_IDS.DECODING]: "Word reading",
  [EL_BENCHMARK_IDS.ORAL_READING_FLUENCY]: "Reading fluency"
});

const BENCHMARK_DESCRIPTIONS = Object.freeze({
  [EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS]:
    "Tells you how well the student hears and plays with the sounds inside spoken words.",
  [EL_BENCHMARK_IDS.ENCODING]:
    "Tells you which letter patterns the student can already write down from a spoken word.",
  [EL_BENCHMARK_IDS.DECODING]:
    "Tells you which word patterns the student reads accurately, and which ones they read without stopping to work them out.",
  [EL_BENCHMARK_IDS.ORAL_READING_FLUENCY]:
    "Tells you how smoothly and accurately the student reads a short passage aloud."
});

const BENCHMARK_ADMINISTRATION = Object.freeze({
  [EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS]:
    "You say each task aloud and tap what the student answers. Nothing is shown to the student.",
  [EL_BENCHMARK_IDS.ENCODING]:
    "You read each word out, the student writes it on paper, and you tap the closest result.",
  [EL_BENCHMARK_IDS.DECODING]:
    "The student reads words from the screen and you tap how each one was read.",
  [EL_BENCHMARK_IDS.ORAL_READING_FLUENCY]:
    "The student reads a passage on screen while the built-in one-minute timer runs."
});

// Only these two EL domains start part-way through a word-pattern band, so only
// these two need the third start-point question.
const BENCHMARKS_WITH_A_BAND = Object.freeze([
  EL_BENCHMARK_IDS.DECODING,
  EL_BENCHMARK_IDS.ORAL_READING_FLUENCY
]);

function benchmarkEntry(source) {
  const needsBand = BENCHMARKS_WITH_A_BAND.includes(source.id);
  return Object.freeze({
    id: source.id,
    benchmarkId: source.id,
    label: BENCHMARK_LABELS[source.id] || source.shortTitle || source.title,
    formalTitle: source.title,
    description: BENCHMARK_DESCRIPTIONS[source.id] || source.description,
    estimatedMinutes: source.estimatedMinutes,
    administration: BENCHMARK_ADMINISTRATION[source.id] || "Teacher paced.",
    administrationMode: source.administrationMode,
    supportedGrades: source.supportedGrades,
    supportedWindows: source.supportedWindows,
    starter: ASSESSMENT_STARTERS.EL_BENCHMARK,
    startPoint: Object.freeze({
      kind: needsBand
        ? ASSESSMENT_START_POINT_KINDS.GRADE_TIME_AND_BAND
        : ASSESSMENT_START_POINT_KINDS.GRADE_AND_TIME,
      fields: Object.freeze(needsBand ? ["grade", "timeOfYear", "band"] : ["grade", "timeOfYear"]),
      label: needsBand ? "Where should this assessment start?" : "Which grade and time of year?",
      help: needsBand
        ? "The suggested band comes from this student's last saved result. Change it only when you can say why."
        : "The grade and time of year decide which words and tasks are used."
    })
  });
}

export const ASSESSMENT_CATALOG = Object.freeze([
  Object.freeze({
    id: "skills-check",
    label: "Skills check",
    description: "Tells you which reading skill the student has secured and which one to teach next.",
    estimatedMinutes: 5,
    administration: "The student answers on screen. You can sit alongside or let them work on their own.",
    starter: ASSESSMENT_STARTERS.SKILL_CHECK,
    startPoint: Object.freeze({
      kind: ASSESSMENT_START_POINT_KINDS.SKILL,
      fields: Object.freeze(["skillIndex"]),
      label: "Which skill should this assessment start on?",
      help: "The student's first skill that is not yet secure is chosen for you. Change it if you want to look somewhere else."
    })
  }),
  Object.freeze({
    id: "letter-names-and-sounds",
    label: "Letter names and sounds",
    description: "Tells you which capital and small letters the student can name and sound out.",
    estimatedMinutes: 10,
    administration: "You show each letter and tap whether the name and the sound were right.",
    starter: ASSESSMENT_STARTERS.LETTER_CHECK,
    startPoint: Object.freeze({
      kind: ASSESSMENT_START_POINT_KINDS.NONE,
      fields: Object.freeze([]),
      label: "Nothing to choose",
      help: "This one always runs through the full set of letters, so there is no starting point to pick."
    })
  }),
  Object.freeze({
    id: "phonics-patterns",
    label: "Phonics patterns",
    description: "Tells you which of the harder letter patterns the student already reads and spells.",
    estimatedMinutes: 10,
    administration: "You show each pattern with an example word and tap what the student did. It adds detail; it does not replace the other checks.",
    starter: ASSESSMENT_STARTERS.PHONICS_PATTERN_CHECK,
    startPoint: Object.freeze({
      kind: ASSESSMENT_START_POINT_KINDS.NONE,
      fields: Object.freeze([]),
      label: "Nothing to choose",
      help: "This one always runs through the full set of patterns, so there is no starting point to pick."
    })
  }),
  ...EL_BENCHMARK_CATALOG.map(benchmarkEntry)
]);

const CATALOG_BY_ID = Object.freeze(Object.fromEntries(
  ASSESSMENT_CATALOG.map(entry => [entry.id, entry])
));

export function listAssessmentCatalog() {
  return ASSESSMENT_CATALOG;
}

export function getAssessmentCatalogEntry(assessmentId = "") {
  return CATALOG_BY_ID[assessmentId] || null;
}

export function isAssessmentCatalogId(assessmentId = "") {
  return Object.hasOwn(CATALOG_BY_ID, assessmentId);
}

/** The 30 skill checkpoints, as start-point options for the skills check. */
export function listSkillStartPoints() {
  return skillTree.map((skill, index) => ({
    value: String(index),
    label: skill.label,
    skillId: skill.id
  }));
}

/**
 * The word-pattern bands the chosen grade and time of year allow. Returns [] if
 * the pair is unknown, which is what makes an unsatisfiable start point visible
 * rather than silent.
 */
export function listBandStartPoints({ grade = "", timeOfYear = "" } = {}) {
  const route = listElBenchmarkRoutes()
    .find(row => row.grade === grade && row.window === timeOfYear);
  if (!route) return [];
  const startIndex = EL_DECODING_MICROPHASES.findIndex(row => row.id === route.rangeStart);
  const endIndex = EL_DECODING_MICROPHASES.findIndex(row => row.id === route.rangeEnd);
  if (startIndex < 0 || endIndex < startIndex) return [];
  return EL_DECODING_MICROPHASES.slice(startIndex, endIndex + 1).map(band => ({
    value: band.id,
    label: band.label,
    expected: band.id === route.expectedMicrophase
  }));
}

/**
 * The selection the funnel opens step 4 with. `firstUnsecuredSkillIndex` is the
 * number `loadStudentProgress` hands back, so the skills check opens on exactly
 * the skill the student is working on.
 */
export function defaultStartPointSelection(entry, {
  firstUnsecuredSkillIndex = 0,
  grade = "K",
  timeOfYear = "BOY",
  suggestedBand = ""
} = {}) {
  if (!entry) return {};
  switch (entry.startPoint.kind) {
    case ASSESSMENT_START_POINT_KINDS.SKILL: {
      const options = listSkillStartPoints();
      const clamped = Math.min(Math.max(0, Number(firstUnsecuredSkillIndex) || 0), options.length - 1);
      return { skillIndex: clamped };
    }
    case ASSESSMENT_START_POINT_KINDS.GRADE_AND_TIME:
      return { grade, timeOfYear };
    case ASSESSMENT_START_POINT_KINDS.GRADE_TIME_AND_BAND: {
      const bands = listBandStartPoints({ grade, timeOfYear });
      const allowed = bands.some(band => band.value === suggestedBand) ? suggestedBand : "";
      const expected = bands.find(band => band.expected)?.value || bands[0]?.value || "";
      return { grade, timeOfYear, band: allowed || expected };
    }
    default:
      return {};
  }
}

/**
 * True when the teacher has answered everything this check's start point asks
 * for. The funnel keeps Begin disabled until this returns true, and the unit
 * test holds every catalog entry against it.
 */
export function isStartPointSatisfied(entry, selection = {}) {
  if (!entry) return false;
  const grades = entry.supportedGrades || ASSESSMENT_GRADE_OPTIONS.map(row => row.value);
  const windows = entry.supportedWindows || ASSESSMENT_TIME_OF_YEAR_OPTIONS.map(row => row.value);
  switch (entry.startPoint.kind) {
    case ASSESSMENT_START_POINT_KINDS.NONE:
      return true;
    case ASSESSMENT_START_POINT_KINDS.SKILL:
      return Number.isInteger(selection.skillIndex)
        && selection.skillIndex >= 0
        && selection.skillIndex < skillTree.length;
    case ASSESSMENT_START_POINT_KINDS.GRADE_AND_TIME:
      return grades.includes(selection.grade) && windows.includes(selection.timeOfYear);
    case ASSESSMENT_START_POINT_KINDS.GRADE_TIME_AND_BAND:
      return grades.includes(selection.grade)
        && windows.includes(selection.timeOfYear)
        && listBandStartPoints({ grade: selection.grade, timeOfYear: selection.timeOfYear })
          .some(band => band.value === selection.band);
    default:
      return false;
  }
}

/** One line the funnel shows back to the teacher once step 4 is answered. */
export function describeStartPointSelection(entry, selection = {}) {
  if (!entry) return "";
  switch (entry.startPoint.kind) {
    case ASSESSMENT_START_POINT_KINDS.SKILL:
      return listSkillStartPoints()[selection.skillIndex]?.label || "";
    case ASSESSMENT_START_POINT_KINDS.GRADE_AND_TIME:
    case ASSESSMENT_START_POINT_KINDS.GRADE_TIME_AND_BAND: {
      const grade = ASSESSMENT_GRADE_OPTIONS.find(row => row.value === selection.grade)?.label || "";
      const time = ASSESSMENT_TIME_OF_YEAR_OPTIONS
        .find(row => row.value === selection.timeOfYear)?.label || "";
      const band = listBandStartPoints({ grade: selection.grade, timeOfYear: selection.timeOfYear })
        .find(row => row.value === selection.band)?.label || "";
      return [grade, time, band].filter(Boolean).join(" · ");
    }
    default:
      return "Starts at the beginning";
  }
}

/** "About 5 min", "5-10 min", or an honest "Teacher paced". */
export function formatEstimatedMinutes(entry) {
  const value = entry?.estimatedMinutes;
  if (Number.isFinite(Number(value))) return `About ${Number(value)} min`;
  const minimum = Number(value?.minimum);
  const maximum = Number(value?.maximum);
  if (Number.isFinite(minimum) && Number.isFinite(maximum)) {
    return minimum === maximum ? `About ${minimum} min` : `${minimum}-${maximum} min`;
  }
  return "Teacher paced";
}
