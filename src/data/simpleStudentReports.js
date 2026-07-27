import { ALL_HFW_WORDS, ALL_HFW_WORD_SET } from "./highFrequencyWordBands.js";

export const SIMPLE_ACCURACY_BANDS = Object.freeze({
  UNSEEN: "unseen",
  RED: "red",
  ORANGE: "orange",
  GREEN: "green"
});

function finiteNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

// 2026-07-26: the tile colour is now driven by the child's STATUS, not by raw accuracy.
//
// It used to be a bare accuracy cut — green at >=50%. That produced the contradiction a
// teacher reported: a tile rendered GREEN at 100% accuracy while the same tile's footer
// read "Developing" and the summary above it read "0 mastered". Worse, 50% on a
// three-option item is near chance, and an item at 55% went green while its policy status
// was Needs teaching (below the 70% developing floor in learningPolicy.js).
//
// The five-state ladder in reportingEvidenceModel.js is the single source of truth. Thin
// evidence is deliberately NEUTRAL, never red — "we haven't seen enough yet" is not a
// failure and must not look like one.
export function simpleAccuracyBand({ attempts = 0, statusId = "" } = {}) {
  const seen = Math.max(0, finiteNumber(attempts) || 0);
  if (!seen) return SIMPLE_ACCURACY_BANDS.UNSEEN;
  switch (statusId) {
    case "secure":
      return SIMPLE_ACCURACY_BANDS.GREEN;
    case "needs_teaching":
      return SIMPLE_ACCURACY_BANDS.RED;
    case "developing":
      return SIMPLE_ACCURACY_BANDS.ORANGE;
    // not_enough_evidence / not_checked / anything unrecognised: stay neutral.
    default:
      return SIMPLE_ACCURACY_BANDS.UNSEEN;
  }
}

// Why an accurate item is not yet Secure. Mastery needs evidence across more than one
// sitting and more than one question type — being right three times in one go is a good
// start, not proof. Returns "" when the item is already secure or has no evidence.
export function whyNotSecure({ attempts = 0, correct = 0, statusId = "" } = {}) {
  if (statusId === "secure" || !attempts) return "";
  if (attempts < 3) return "Needs a few more goes before we can say.";
  if (correct >= attempts) return "Right every time so far — needs to show it again on another day.";
  return "Getting there — needs to be right more often, across more than one day.";
}

function conceptCounts(concept = {}) {
  const basis = concept.evidenceBasis || {};
  const attempts = Math.max(0, finiteNumber(
    basis.observations ?? basis.total
  ) || 0);
  const correct = finiteNumber(basis.correct);
  const accuracy = finiteNumber(basis.accuracy) ?? (
    attempts > 0 && correct !== null
      ? Number(((correct / attempts) * 100).toFixed(1))
      : null
  );
  return { attempts, correct, accuracy };
}

function plainConceptLabel(concept = {}) {
  if (concept.construct === "initial_sound") return `initial sound “${concept.key}”`;
  if (concept.construct === "final_sound") return `final sound “${concept.key}”`;
  if (concept.construct === "isolated_word_reading" && ALL_HFW_WORD_SET.has(concept.key)) {
    return `high-frequency word “${concept.key}”`;
  }
  return String(concept.label || concept.key || "this item")
    .replace(/^Read “(.+)” in isolation$/i, "word “$1”")
    .replace(/^Initial sound \/(.+)\/$/i, "initial sound “$1”")
    .replace(/^Final sound \/(.+)\/$/i, "final sound “$1”");
}

function compactConceptLabel(concept = {}) {
  if (concept.construct === "initial_sound") return `Initial sound “${concept.key}”`;
  if (concept.construct === "final_sound") return `Final sound “${concept.key}”`;
  if (concept.construct === "isolated_word_reading" && ALL_HFW_WORD_SET.has(concept.key)) {
    return `“${concept.key}”`;
  }
  if (concept.construct === "grapheme_sound") return `Sound “${concept.key}”`;
  return String(concept.label || plainConceptLabel(concept));
}

function countedTimes(count) {
  return `${count} ${count === 1 ? "time" : "times"}`;
}

export function simpleConceptRow(concept = {}, studentName = "This student") {
  const counts = conceptCounts(concept);
  const statusId = concept.status?.id || "not_checked";
  const band = simpleAccuracyBand({ ...counts, statusId });
  const statusLabel = !counts.attempts
    ? "Yet to learn"
    : statusId === "secure"
      ? "Secure"
      : statusId === "needs_teaching"
        ? "Needs teaching"
        : statusId === "developing"
          ? "Practising"
          : "Not enough yet";
  return {
    id: concept.conceptId || `${concept.construct || "item"}::${concept.key || concept.label}`,
    key: concept.key || "",
    label: plainConceptLabel(concept),
    displayLabel: compactConceptLabel(concept),
    domain: concept.domain || "",
    construct: concept.construct || "",
    statusId,
    statusLabel,
    ...counts,
    band,
    whyNotSecure: whyNotSecure({ ...counts, statusId }),
    // Plain teacher language. "Has been exposed to X 4 times" was research
    // register that told a teacher nothing they could act on.
    sentence: counts.attempts > 0
      ? `${studentName} answered ${plainConceptLabel(concept)} ${countedTimes(counts.attempts)}${counts.correct === null ? "." : `, right ${countedTimes(counts.correct)}.`}`
      : `${studentName} has not tried ${plainConceptLabel(concept)} yet.`
  };
}

function isHfwConcept(concept = {}) {
  return concept.construct === "isolated_word_reading"
    && ALL_HFW_WORD_SET.has(String(concept.key || "").toLowerCase());
}

export function buildSimpleSkillsRows(workspace = {}, studentName = "This student") {
  return (workspace.wholeChild?.concepts || [])
    .filter(concept => !isHfwConcept(concept))
    .map(concept => simpleConceptRow(concept, studentName))
    .sort((left, right) => (
      left.domain.localeCompare(right.domain)
      || left.displayLabel.localeCompare(right.displayLabel)
    ));
}

export function buildSimpleHfwRows(workspace = {}, studentName = "This student") {
  const concepts = new Map(
    (workspace.wholeChild?.concepts || [])
      .filter(isHfwConcept)
      .map(concept => [String(concept.key || "").toLowerCase(), concept])
  );
  return ALL_HFW_WORDS.map(word => {
    const concept = concepts.get(word) || {
      conceptId: `hfw::${word}`,
      domain: "decoding",
      construct: "isolated_word_reading",
      key: word,
      label: `Read “${word}” in isolation`,
      status: { id: "not_checked", label: "Not seen yet" },
      evidenceBasis: { observations: 0, correct: null, accuracy: null }
    };
    return simpleConceptRow(concept, studentName);
  });
}

// Worst first inside each domain, so the item a teacher should open first is at
// the top of the list rather than wherever the alphabet happened to put it.
// Unknown accuracy sorts last: it is not a low score, it is no score.
function bySeverityWithinDomain(left, right) {
  const domain = String(left.domain).localeCompare(String(right.domain));
  if (domain !== 0) return domain;
  const leftAccuracy = left.accuracy === null ? Number.POSITIVE_INFINITY : left.accuracy;
  const rightAccuracy = right.accuracy === null ? Number.POSITIVE_INFINITY : right.accuracy;
  if (leftAccuracy !== rightAccuracy) return leftAccuracy - rightAccuracy;
  return String(left.displayLabel).localeCompare(String(right.displayLabel));
}

// Five groups, and every row lands in exactly one of them. "needs_teaching"
// used to be folded into "developing", which hid the only group a teacher acts
// on; "notEnoughYet" was computed and never rendered, so the headline counts
// did not add up to the number of items checked.
export function buildSimpleOverview(workspace = {}, studentName = "This student") {
  const rows = [
    ...buildSimpleSkillsRows(workspace, studentName),
    ...buildSimpleHfwRows(workspace, studentName).filter(row => row.attempts > 0)
  ];
  const seen = rows.filter(row => row.attempts > 0);
  const sorted = list => [...list].sort(bySeverityWithinDomain);

  const needsTeaching = sorted(seen.filter(row => row.statusId === "needs_teaching"));
  const practising = sorted(seen.filter(row => row.statusId === "developing"));
  const mastered = sorted(seen.filter(row => row.statusId === "secure"));
  const notEnoughYet = sorted(seen.filter(row => !["needs_teaching", "developing", "secure"]
    .includes(row.statusId)));
  const yetToLearn = sorted(rows.filter(row => row.attempts === 0));

  return {
    needsTeaching,
    practising,
    mastered,
    notEnoughYet,
    yetToLearn,
    checkedCount: seen.length,
    totalCount: rows.length
  };
}
