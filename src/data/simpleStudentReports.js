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

export function simpleAccuracyBand({ attempts = 0, accuracy = null } = {}) {
  const seen = Math.max(0, finiteNumber(attempts) || 0);
  const score = finiteNumber(accuracy);
  if (!seen || score === null) return SIMPLE_ACCURACY_BANDS.UNSEEN;
  if (score < 20) return SIMPLE_ACCURACY_BANDS.RED;
  if (score < 50) return SIMPLE_ACCURACY_BANDS.ORANGE;
  return SIMPLE_ACCURACY_BANDS.GREEN;
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

export function simpleConceptRow(concept = {}, studentName = "This child") {
  const counts = conceptCounts(concept);
  const band = simpleAccuracyBand(counts);
  const statusId = concept.status?.id || "not_checked";
  const statusLabel = !counts.attempts
    ? "Yet to learn"
    : statusId === "secure"
      ? "Mastered"
      : "Developing";
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
    sentence: counts.attempts > 0
      ? `${studentName} has been exposed to ${plainConceptLabel(concept)} ${counts.attempts} ${counts.attempts === 1 ? "time" : "times"}${counts.correct === null ? "." : `, with ${counts.correct} correct ${counts.correct === 1 ? "answer" : "answers"}.`}`
      : `${studentName} has not been exposed to ${plainConceptLabel(concept)} yet.`
  };
}

function isHfwConcept(concept = {}) {
  return concept.construct === "isolated_word_reading"
    && ALL_HFW_WORD_SET.has(String(concept.key || "").toLowerCase());
}

export function buildSimpleSkillsRows(workspace = {}, studentName = "This child") {
  return (workspace.wholeChild?.concepts || [])
    .filter(concept => !isHfwConcept(concept))
    .map(concept => simpleConceptRow(concept, studentName))
    .sort((left, right) => (
      left.domain.localeCompare(right.domain)
      || left.displayLabel.localeCompare(right.displayLabel)
    ));
}

export function buildSimpleHfwRows(workspace = {}, studentName = "This child") {
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

export function buildSimpleOverview(workspace = {}, studentName = "This child") {
  const rows = [
    ...buildSimpleSkillsRows(workspace, studentName),
    ...buildSimpleHfwRows(workspace, studentName).filter(row => row.attempts > 0)
  ];
  return {
    mastered: rows.filter(row => row.statusId === "secure"),
    developing: rows.filter(row => row.attempts > 0 && row.statusId !== "secure"),
    yetToLearn: rows.filter(row => row.attempts === 0)
  };
}
