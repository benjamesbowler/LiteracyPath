import { MANUAL_DIAGNOSTIC_COPY as COPY } from "../copy/manualDiagnosticCopy.js";
import { ASSESSMENT_RESPONSE_STATUSES } from "../data/assessmentHistoryStore.js";

export const MANUAL_DIAGNOSTIC_VERSION = "manual-diagnostic-v2";
export const MANUAL_DIAGNOSTIC_OUTCOMES = ["correct", "incorrect", "no_response", "not_scorable", "not_administered"];
export const MANUAL_DIAGNOSTIC_ERROR_TAGS = ["letter_confusion", "name_for_sound", "sound_for_name", "vowel", "consonant", "omission", "addition", "substitution", "blending", "word_guess"];

export function normalizeDiagnosticOutcome(value) {
  if (value === true) return ASSESSMENT_RESPONSE_STATUSES.CORRECT;
  if (value === false) return ASSESSMENT_RESPONSE_STATUSES.INCORRECT;
  return MANUAL_DIAGNOSTIC_OUTCOMES.includes(value) ? value : ASSESSMENT_RESPONSE_STATUSES.NOT_ADMINISTERED;
}

export function diagnosticOutcomeIsScored(value) {
  return ["correct", "incorrect", "no_response"].includes(normalizeDiagnosticOutcome(value));
}

export function cleanDiagnosticObservation(value = {}) {
  return {
    responseText: String(value.responseText || "").trim().slice(0, 600),
    selfCorrected: value.selfCorrected === true,
    errorTags: [...new Set((Array.isArray(value.errorTags) ? value.errorTags : []).filter(tag => MANUAL_DIAGNOSTIC_ERROR_TAGS.includes(tag)))],
    notes: String(value.notes || "").trim().slice(0, 1000),
    outcomeRecordedAt: String(value.outcomeRecordedAt || "")
  };
}

export function diagnosticResponseFields(entry = {}, task) {
  const observation = cleanDiagnosticObservation(entry.responseEvidence?.[task]);
  const kind = task === "name" || "letter" in entry || "knowsSound" in entry ? "letter" : "pattern";
  const responseStatus = normalizeDiagnosticOutcome(diagnosticDraft(entry, kind)[task]?.outcome);
  return {
    ...observation,
    responseStatus,
    selectedAnswer: observation.responseText,
    responseCaptureMode: observation.responseText ? "teacher_transcription" : "teacher_observation",
    responseDetailCaptured: Boolean(observation.responseText),
    isCorrect: responseStatus === "correct" ? true : diagnosticOutcomeIsScored(responseStatus) ? false : null,
    metadata: { responsePending: entry[task + "Outcome"] === "", diagnosticVersion: entry.diagnosticVersion || "legacy", formVersion: entry.formVersion || "legacy", formIndex: entry.formIndex ?? null, group: entry.group || entry.type || "" }
  };
}

export function upsertDiagnosticEntry(entries = [], index = 0, entry = {}) {
  const next = Array.isArray(entries) ? entries.slice() : [];
  const target = Math.max(0, Math.min(Number(index) || 0, next.length));
  next[target] = entry;
  return next;
}

export function isDiagnosticEntryComplete(entry = {}, kind = "letter") {
  if (entry.recorded === false) return false;
  return (kind === "letter" ? ["name", "sound"] : ["sound", "word"])
    .every(task => {
      const validOutcome = entry[`${task}Outcome`] !== undefined
        ? MANUAL_DIAGNOSTIC_OUTCOMES.includes(entry[`${task}Outcome`])
        : typeof entry[kind === "letter" ? task === "name" ? "knowsName" : "knowsSound" : `${task}Correct`] === "boolean";
      return validOutcome && (entry.diagnosticVersion !== MANUAL_DIAGNOSTIC_VERSION || !diagnosticObservationIssue(entry[`${task}Outcome`], entry.responseEvidence?.[task]));
    });
}

export function diagnosticAssessmentComplete(entries = [], items = [], kind = "letter") {
  return items.length > 0 && entries.length >= items.length && items.every((_, index) => isDiagnosticEntryComplete(entries[index], kind));
}

export function nextDiagnosticItemIndex(entries = [], items = [], kind = "letter", currentIndex = 0) {
  if (diagnosticAssessmentComplete(entries, items, kind)) return items.length;
  if (currentIndex + 1 < items.length) return currentIndex + 1;
  return items.findIndex((_, index) => !isDiagnosticEntryComplete(entries[index], kind));
}

export function diagnosticObservationIssue(outcome, observation = {}) {
  if (!outcome) return "Choose an outcome before continuing.";
  if (["no_response", "not_administered"].includes(outcome) && String(observation.responseText || "").trim()) return "A response is recorded. Choose Correct, Not yet or Not scorable.";
  if (outcome === "incorrect" && !String(observation.responseText || "").trim()) return "Record what the student said so this result can guide teaching.";
  if (outcome === "not_scorable" && !String(observation.notes || "").trim()) return "Record why this response could not be scored.";
  return "";
}

export function diagnosticDraft(entry = {}, kind = "letter") {
  const tasks = kind === "letter" ? ["name", "sound"] : ["sound", "word"];
  return Object.fromEntries(tasks.map(task => {
    const oldValue = kind === "letter" ? entry[task === "name" ? "knowsName" : "knowsSound"] : entry[`${task}Correct`];
    const explicit = entry[`${task}Outcome`];
    const outcome = explicit === "" ? "" : MANUAL_DIAGNOSTIC_OUTCOMES.includes(explicit) ? explicit : (typeof oldValue === "boolean" ? normalizeDiagnosticOutcome(oldValue) : "");
    return [task, { outcome, ...cleanDiagnosticObservation(entry.responseEvidence?.[task]) }];
  }));
}

export function summarizeDiagnostic(entries = [], items = [], kind = "letter") {
  const tasks = kind === "letter" ? ["name", "sound"] : ["sound", "word"];
  const totals = Object.fromEntries(tasks.map(task => [task, { correct: 0, incorrect: 0, no_response: 0, not_scorable: 0, not_administered: 0, scored: 0 }]));
  const groups = {};
  const review = [];
  items.forEach((item, index) => {
    const entry = entries[index];
    const group = kind === "letter" ? item.type : item.group || "Other patterns";
    groups[group] ||= Object.fromEntries(tasks.map(task => [task, { correct: 0, scored: 0, missing: 0 }]));
    for (const task of tasks) {
      const status = entry ? diagnosticDraft(entry, kind)[task].outcome || "not_administered" : "not_administered";
      totals[task][status] += 1;
      if (diagnosticOutcomeIsScored(status)) {
        totals[task].scored += 1;
        groups[group][task].scored += 1;
        if (status === "correct") groups[group][task].correct += 1;
      } else groups[group][task].missing += 1;
      if (["incorrect", "no_response"].includes(status)) review.push({ index, target: item.display || item.pattern, task, outcome: status, ...cleanDiagnosticObservation(entry.responseEvidence?.[task]) });
    }
  });
  return { version: MANUAL_DIAGNOSTIC_VERSION, totals, groups, review, recordedItems: entries.filter(entry => isDiagnosticEntryComplete(entry, kind)).length, plannedItems: items.length };
}

export function diagnosticOutcomeLabel(value) {
  return COPY.outcomes.find(option => option.value === value)?.label || COPY.pending;
}

export function manualDiagnosticEvidenceRows(entries = [], items = [], kind = "letter") {
  return items.flatMap((item, index) => {
    const entry = entries[index] || {};
    return Object.entries(diagnosticDraft(entry, kind)).map(([task, response]) => ({
      item: index + 1,
      target: item.display || item.pattern,
      task: task === "name" ? COPY.letterName : task === "word" ? COPY.patternWord : kind === "letter" ? COPY.letterSound : COPY.patternSound,
      stimulus: task === "word" ? entry.exampleWord || item.exampleWord : item.display || item.pattern,
      outcome: diagnosticOutcomeLabel(response.outcome),
      responseText: response.responseText,
      responseBasis: response.responseText ? "Teacher transcription" : response.outcome ? "Teacher observation; no transcript" : "Not recorded",
      selfCorrected: response.selfCorrected ? "Yes" : "",
      errorTags: response.errorTags.map(tag => COPY.errorLabels[tag]).join("; "),
      notes: response.notes,
      formVersion: entry.formVersion || item.formVersion || "legacy"
    }));
  });
}

export function addManualDiagnosticEvidenceSheet(workbook, entries, items, kind) {
  const sheet = workbook.addWorksheet("Response evidence");
  sheet.columns = [
    { header: "Item", key: "item", width: 8 }, { header: "Target", key: "target", width: 14 },
    { header: "Task", key: "task", width: 24 }, { header: "Stimulus", key: "stimulus", width: 18 },
    { header: "Outcome", key: "outcome", width: 18 }, { header: "Actual response", key: "responseText", width: 30 },
    { header: "Evidence basis", key: "responseBasis", width: 32 }, { header: "Self-corrected", key: "selfCorrected", width: 18 },
    { header: "Observed errors", key: "errorTags", width: 28 }, { header: "Observation / access note", key: "notes", width: 38 },
    { header: "Content version", key: "formVersion", width: 30 }
  ];
  sheet.addRows(manualDiagnosticEvidenceRows(entries, items, kind));
  sheet.getRow(1).font = { bold: true };
  sheet.eachRow(row => { row.alignment = { vertical: "top", wrapText: true }; });
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: "A1", to: "K1" };
  return sheet;
}
