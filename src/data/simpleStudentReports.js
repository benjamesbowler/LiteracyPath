import {
  ASSESSED_HFW_WORDS,
  ASSESSED_HFW_WORD_SET
} from "./highFrequencyWordBands.js";
import { LEARNING_EVIDENCE_POLICY } from "../policy/learningPolicy.js";

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

// 2026-07-26: the tile colour is now driven by the student's status, not by raw accuracy.
//
// It used to be a bare accuracy cut — green at >=50%. That produced the contradiction a
// teacher reported: a tile rendered GREEN at 100% accuracy while the same tile's footer
// read "Developing" and the summary above it read "0 mastered". Worse, 50% on a
// three-option item is near chance, and an item at 55% went green while its policy status
// was Needs support (below the 70% developing floor in learningPolicy.js).
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

// Explain the displayed policy result without inventing a day-diversity rule or
// comparing independent sittings with individual question observations. The
// latter once produced "Right every time" for a 6/9 result because 6 correct
// observations were compared with only 3 independent attempts.
export function whyNotSecure({
  observations = 0,
  accuracy = null,
  statusId = "",
  policyReason = ""
} = {}) {
  const seen = Math.max(0, finiteNumber(observations) || 0);
  if (statusId === "secure" || !seen) return "";

  if (statusId === "not_enough_evidence") {
    return String(policyReason || "").trim()
      || "There are not enough current results to make a learning judgement yet.";
  }

  const measuredAccuracy = finiteNumber(accuracy);
  if (measuredAccuracy !== null) {
    return `${measuredAccuracy}% accuracy is below the Secure range of `
      + `${LEARNING_EVIDENCE_POLICY.accuracyPercent.secureMinimum}% or more.`;
  }

  return "The current results are not in the Secure range yet.";
}

function conceptCounts(concept = {}, { currentDecisionOnly = false } = {}) {
  const lifetimeBasis = concept.lifetimeEvidenceBasis || {};
  const basis = !currentDecisionOnly && Number(lifetimeBasis.observations || 0) > 0
    ? lifetimeBasis
    : concept.evidenceBasis || {};
  const attempts = Math.max(0, finiteNumber(
    basis.observations ?? basis.total
  ) || 0);
  const rawCorrect = finiteNumber(basis.correct);
  const correct = rawCorrect !== null && Number.isInteger(rawCorrect) ? rawCorrect : null;
  const accuracy = finiteNumber(basis.accuracy) ?? (
    attempts > 0 && correct !== null
      ? Number(((correct / attempts) * 100).toFixed(1))
      : null
  );
  const independentAttempts = Math.max(
    0,
    finiteNumber(
      basis.independentAttempts
      ?? basis.attemptCount
      ?? basis.observations
      ?? basis.total
    ) || 0
  );
  return { attempts, independentAttempts, correct, accuracy };
}

function plainConceptLabel(concept = {}) {
  if (concept.construct === "initial_sound") return `initial sound “${concept.key}”`;
  if (concept.construct === "final_sound") return `final sound “${concept.key}”`;
  if (concept.construct === "isolated_word_reading" && ASSESSED_HFW_WORD_SET.has(concept.key)) {
    return `reading high-frequency word “${concept.key}” on its own`;
  }
  if (concept.construct === "word_in_context" && ASSESSED_HFW_WORD_SET.has(concept.key)) {
    return `high-frequency word “${concept.key}” in a sentence`;
  }
  if (concept.construct === "word_spelling" && ASSESSED_HFW_WORD_SET.has(concept.key)) {
    return `spelling high-frequency word “${concept.key}” in a sentence`;
  }
  return String(concept.label || concept.key || "this item")
    .replace(/^Read “(.+)” in isolation$/i, "word “$1”")
    .replace(/^Initial sound \/(.+)\/$/i, "initial sound “$1”")
    .replace(/^Final sound \/(.+)\/$/i, "final sound “$1”");
}

function compactConceptLabel(concept = {}) {
  if (concept.construct === "initial_sound") return `Initial sound “${concept.key}”`;
  if (concept.construct === "final_sound") return `Final sound “${concept.key}”`;
  if (concept.construct === "isolated_word_reading" && ASSESSED_HFW_WORD_SET.has(concept.key)) {
    return `“${concept.key}” · Read alone`;
  }
  if (concept.construct === "word_in_context" && ASSESSED_HFW_WORD_SET.has(concept.key)) {
    return `“${concept.key}” · In a sentence`;
  }
  if (concept.construct === "word_spelling" && ASSESSED_HFW_WORD_SET.has(concept.key)) {
    return `“${concept.key}” · Spelling`;
  }
  if (concept.construct === "grapheme_sound") return `Sound “${concept.key}”`;
  return String(concept.label || plainConceptLabel(concept));
}

function countedTimes(count) {
  return `${count} ${count === 1 ? "time" : "times"}`;
}

export function simpleConceptRow(concept = {}, studentName = "This student") {
  const lifetimeCounts = conceptCounts(concept);
  const counts = conceptCounts(concept, { currentDecisionOnly: true });
  const statusId = concept.status?.id || "not_checked";
  const band = simpleAccuracyBand({ ...counts, statusId });
  const hasAnyResults = counts.attempts > 0 || lifetimeCounts.attempts > 0;
  const hasAdditionalHistory = lifetimeCounts.attempts > counts.attempts
    || lifetimeCounts.correct !== counts.correct
    || lifetimeCounts.accuracy !== counts.accuracy;
  const statusLabel = !hasAnyResults
    ? "Not checked"
    : !counts.attempts
      ? "Not enough results"
    : statusId === "secure"
      ? "Secure"
      : statusId === "needs_teaching"
        ? "Needs support"
        : statusId === "developing"
          ? "Developing"
          : "Not enough results";
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
    hasAnyResults,
    lifetimeAttempts: lifetimeCounts.attempts,
    lifetimeCorrect: lifetimeCounts.correct,
    lifetimeAccuracy: lifetimeCounts.accuracy,
    band,
    whyNotSecure: whyNotSecure({
      observations: counts.attempts,
      accuracy: counts.accuracy,
      statusId,
      policyReason: concept.policyConclusion?.reason
    }),
    // Plain teacher language. "Has been exposed to X 4 times" was research
    // register that told a teacher nothing they could act on.
    sentence: counts.attempts > 0
      ? `${studentName} answered ${plainConceptLabel(concept)} ${countedTimes(counts.attempts)}${counts.correct === null ? "." : `, with ${counts.correct} correct ${counts.correct === 1 ? "answer" : "answers"}.`}`
      : lifetimeCounts.attempts > 0
        ? `${studentName} has older saved answers for ${plainConceptLabel(concept)}, but no current results in the learning window.`
        : `${studentName} has not been checked on ${plainConceptLabel(concept)} yet.`,
    historySentence: hasAdditionalHistory
      ? `All saved history: ${countedTimes(lifetimeCounts.attempts)}${lifetimeCounts.correct === null ? "." : `, ${lifetimeCounts.correct} correct${lifetimeCounts.accuracy === null ? "." : ` (${lifetimeCounts.accuracy}% accuracy).`}`}`
      : ""
  };
}

function isHfwConcept(concept = {}) {
  return ["isolated_word_reading", "word_in_context", "word_spelling"].includes(concept.construct)
    && ASSESSED_HFW_WORD_SET.has(String(concept.key || "").toLowerCase());
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
  const hfwConcepts = (workspace.wholeChild?.concepts || []).filter(isHfwConcept);
  const constructs = [...new Set(hfwConcepts.map(concept => concept.construct))];
  // HFW Level 1 uses sentence cloze, so it is the truthful baseline when no
  // HFW evidence has been recorded. Spelling and direct reading are added as
  // separate rows only when that construct exists; they are never merged into
  // a single "word known" percentage.
  if (!constructs.length) constructs.push("word_in_context");
  const concepts = new Map(hfwConcepts.map(concept => [
    `${concept.construct}::${String(concept.key || "").toLowerCase()}`,
    concept
  ]));
  const defaults = {
    isolated_word_reading: {
      domain: "decoding",
      label: word => `Read “${word}” on its own`
    },
    word_in_context: {
      domain: "literacy_skill",
      label: word => `Choose “${word}” in a sentence`
    },
    word_spelling: {
      domain: "encoding",
      label: word => `Spell “${word}” in a sentence`
    }
  };
  return constructs.flatMap(construct => ASSESSED_HFW_WORDS.map(word => {
    const definition = defaults[construct] || defaults.word_in_context;
    const concept = concepts.get(`${construct}::${word}`) || {
      conceptId: `hfw::${construct}::${word}`,
      domain: definition.domain,
      construct,
      key: word,
      label: definition.label(word),
      status: { id: "not_checked", label: "Not checked" },
      evidenceBasis: {
        observations: 0,
        independentAttempts: 0,
        correct: null,
        accuracy: null
      }
    };
    return simpleConceptRow(concept, studentName);
  }));
}

export function countSimpleRowsWithSavedResults(rows = []) {
  return rows.filter(row => row?.hasAnyResults).length;
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
    ...buildSimpleHfwRows(workspace, studentName).filter(row => row.hasAnyResults)
  ];
  const seen = rows.filter(row => row.hasAnyResults);
  const sorted = list => [...list].sort(bySeverityWithinDomain);

  const needsTeaching = sorted(seen.filter(row => row.statusId === "needs_teaching"));
  const practising = sorted(seen.filter(row => row.statusId === "developing"));
  const mastered = sorted(seen.filter(row => row.statusId === "secure"));
  const notEnoughYet = sorted(seen.filter(row => !["needs_teaching", "developing", "secure"]
    .includes(row.statusId)));
  const yetToLearn = sorted(rows.filter(row => !row.hasAnyResults));

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
