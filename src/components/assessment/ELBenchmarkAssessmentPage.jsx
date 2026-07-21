import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EL_BENCHMARK_ERROR_TAGS,
  EL_DECODING_MICROPHASES,
  getElBenchmarkPlan,
  scoreElBenchmarkSession
} from "../../data/elBenchmarkAssessments.js";
import "./el-benchmark-assessment.css";

const ASSESSMENT_KINDS = Object.freeze({
  PHONOLOGICAL_AWARENESS: "phonological_awareness",
  ENCODING: "encoding",
  DECODING: "decoding",
  FLUENCY: "fluency"
});

const DISCONTINUE_REASONS = Object.freeze([
  { value: "frustration", label: "Student showed frustration" },
  { value: "independent_level_clear", label: "Independent level was clear" },
  { value: "instructional_level_clear", label: "Instructional level was clear" },
  { value: "letter_knowledge_needed", label: "Letter knowledge needs checking first" },
  { value: "unable_to_continue", label: "Student was unable to continue" },
  { value: "interrupted", label: "Session was interrupted" },
  { value: "other", label: "Other" }
]);

const NOT_SCORABLE_REASONS = Object.freeze([
  { value: "interrupted_or_noisy", label: "Interrupted or too noisy" },
  { value: "student_unwell_or_distressed", label: "Student unwell or distressed" },
  { value: "directions_or_material_issue", label: "Directions or material issue" },
  { value: "response_unreliable", label: "Response could not be captured reliably" },
  { value: "other", label: "Other" }
]);

const ENCODING_FALLBACK_ERROR_TAGS = Object.freeze([
  { value: "initial_phoneme", label: "Initial phoneme" },
  { value: "medial_phoneme", label: "Medial phoneme" },
  { value: "final_phoneme", label: "Final phoneme" },
  { value: "consonant_pattern", label: "Consonant pattern" },
  { value: "vowel_pattern", label: "Vowel pattern" },
  { value: "morphology", label: "Morphology or ending" },
  { value: "omission", label: "Omission" },
  { value: "insertion", label: "Insertion" },
  { value: "reversal", label: "Reversal" },
  { value: "other", label: "Other" }
]);

const DECODING_FALLBACK_ERROR_TAGS = Object.freeze([
  { value: "none", label: "No error type recorded" },
  { value: "no_response", label: "No response" },
  { value: "substitution", label: "Substitution" },
  { value: "omission", label: "Omission" },
  { value: "insertion", label: "Insertion" },
  { value: "vowel_pattern", label: "Vowel pattern" },
  { value: "consonant_pattern", label: "Consonant pattern" },
  { value: "whole_word_substitution", label: "Whole-word substitution" },
  { value: "other", label: "Other" }
]);

const PROSODY_DIMENSIONS = Object.freeze([
  { key: "expression", label: "Expression" },
  { key: "phrasing", label: "Phrasing" },
  { key: "smoothness", label: "Smoothness" },
  { key: "pace", label: "Pace" }
]);

const PROSODY_LABELS = Object.freeze({
  1: "Limited",
  2: "Emerging",
  3: "Mostly secure",
  4: "Secure"
});

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function normalizeKey(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function humanize(value = "") {
  const normalized = String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized
    ? normalized.replace(/\b\w/g, character => character.toUpperCase())
    : "";
}

function formatGrade(grade = "") {
  const normalized = String(grade || "").trim().toUpperCase();
  if (normalized === "K" || normalized === "KG" || normalized === "KINDERGARTEN") {
    return "Kindergarten";
  }
  return normalized ? `Grade ${normalized}` : "Grade not set";
}

function formatWindow(windowName = "") {
  const normalized = String(windowName || "").trim().toUpperCase();
  const labels = {
    BOY: "Beginning of year",
    MOY: "Middle of year",
    EOY: "End of year"
  };
  return labels[normalized] || humanize(windowName) || "Window not set";
}

function getAssessmentKind(assessmentId = "", plan = {}) {
  const combined = [assessmentId, plan.assessmentId, plan.title, plan.shortTitle]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (combined.includes("fluency")) return ASSESSMENT_KINDS.FLUENCY;
  if (combined.includes("encoding")) return ASSESSMENT_KINDS.ENCODING;
  if (combined.includes("decoding")) return ASSESSMENT_KINDS.DECODING;
  if (combined.includes("phonological") || combined.includes("phonemic") || combined.includes("awareness")) {
    return ASSESSMENT_KINDS.PHONOLOGICAL_AWARENESS;
  }
  return "unknown";
}

function getPlanItems(plan = {}) {
  if (Array.isArray(plan.items)) return plan.items;

  const groups = [
    ...toArray(plan.blocks),
    ...toArray(plan.sections),
    ...toArray(plan.bands)
  ];

  return groups.flatMap(group => toArray(group?.items).map(item => ({
    ...item,
    bandId: item.bandId || group.id || group.bandId || "",
    microphase: item.microphase || group.microphase || ""
  })));
}

function getItemId(item = {}, index = 0, kind = "item") {
  return String(item.id || item.questionId || item.passageId || `${kind}_${index + 1}`);
}

function normalizeResponses(responses) {
  if (Array.isArray(responses)) {
    return Object.fromEntries(responses
      .map((response, index) => [String(response?.itemId || response?.id || index), response])
      .filter(([, response]) => Boolean(response)));
  }
  return responses && typeof responses === "object" ? responses : {};
}

function hasResponseContent(response = {}) {
  if (!response || typeof response !== "object") return false;
  return Object.keys(response).some(key => ![
    "itemId",
    "assessmentId",
    "updatedAt"
  ].includes(key));
}

function isNotScorable(response = {}) {
  return response.status === "not_scorable";
}

function hasNotScorableReason(response = {}) {
  const reason = String(response.notScorableReason || "").trim();
  if (!reason) return false;
  return reason !== "other" || Boolean(String(response.notScorableNote || "").trim());
}

function getExactStudentResponse(kind, response = {}) {
  if (kind === ASSESSMENT_KINDS.ENCODING && response.transcription !== undefined) {
    return String(response.transcription || "").trim();
  }
  return String(response.responseText || "").trim();
}

function normalizeEncodingEntry(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function getEncodingEvaluationIssue(item = {}, response = {}) {
  const transcription = normalizeEncodingEntry(response.transcription ?? response.responseText);
  if (!transcription) return "";
  const accepted = toArray(item.acceptedSpellings || item.expectedAnswers || item.targetWord)
    .map(normalizeEncodingEntry);
  const computedExact = accepted.includes(transcription);
  const evaluation = response.evaluation || (response.status === "correct" ? "exact" : "");
  const explicitExact = typeof response.exact === "boolean"
    ? response.exact
    : evaluation === "exact"
      ? true
      : ["plausible", "not_yet"].includes(evaluation)
        ? false
        : typeof response.isCorrect === "boolean" ? response.isCorrect : null;
  const override = response.teacherOverride && typeof response.teacherOverride === "object"
    ? response.teacherOverride
    : null;
  const targetsExact = ["exact", "exact_spelling"].includes(
    String(override?.field || "").trim().toLowerCase()
  );
  if (targetsExact && typeof override?.to === "boolean" && typeof explicitExact === "boolean" && override.to !== explicitExact) {
    return "exact_override_conflicts_with_evaluation";
  }
  const auditedExactOverride = targetsExact &&
    typeof override?.to === "boolean" &&
    override.to === explicitExact &&
    explicitExact !== computedExact &&
    Boolean(String(override?.reason || "").trim());
  if (auditedExactOverride) return "";
  if (evaluation === "exact" && !computedExact) return "exact_mismatch";
  if (["plausible", "not_yet"].includes(evaluation) && computedExact) return "exact_match_marked_nonexact";
  return "";
}

function normalizeDecodingEntry(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function getDecodingEvaluationIssue(item = {}, response = {}) {
  const transcription = normalizeDecodingEntry(response.responseText ?? response.transcription);
  const accepted = toArray(
    item.acceptedResponses || item.acceptedReadings || item.targetWord || item.displayWord || item.word
  ).map(normalizeDecodingEntry).filter(Boolean);
  const matchesTarget = Boolean(transcription && accepted.includes(transcription));
  const status = String(response.status || "");
  const accurateEvaluation = ["correct", "self_corrected"].includes(status) ||
    ["automatic_accurate", "accurate_after_sounding"].includes(response.evaluation);
  if (status === "no_response" && transcription) return "no_response_has_transcription";
  if (accurateEvaluation && transcription && !matchesTarget) return "accurate_response_mismatch";
  if (status === "incorrect" && matchesTarget) return "incorrect_response_matches_target";
  return "";
}

function isDecodingResponseStateValid(response = {}, item = {}) {
  const hasNoResponseTag = toArray(response.errorTags).includes("no_response");
  if (getDecodingEvaluationIssue(item, response)) return false;
  if (response.status === "no_response") {
    return response.isCorrect === false &&
      response.automatic !== true &&
      response.selfCorrected !== true &&
      hasNoResponseTag;
  }

  if (response.status === "incorrect") {
    return response.isCorrect === false &&
      response.automatic === false &&
      response.selfCorrected !== true &&
      !hasNoResponseTag;
  }

  if (!["correct", "self_corrected"].includes(response.status) || response.isCorrect !== true) {
    return false;
  }

  if (response.selfCorrected === true) {
    return response.status === "self_corrected" && response.automatic === false && !hasNoResponseTag;
  }

  return response.status === "correct" && typeof response.automatic === "boolean" && !hasNoResponseTag;
}

function getPassageAccuracyJudgment(response = {}) {
  if (typeof response.passageAccurate === "boolean") return response.passageAccurate;
  if (typeof response.accurate === "boolean") return response.accurate;
  return null;
}

function getFluencyCountValidation(response = {}, item = {}) {
  const passageWordCount = Number(item.wordCount || response.passageWordCount);
  const wordsAttempted = Number(response.wordsAttempted);
  const errors = Number(response.errors);
  const selfCorrections = Number(response.selfCorrections);
  const errorsProvided = ![undefined, null, ""].includes(response.errors);
  const selfCorrectionsProvided = ![undefined, null, ""].includes(response.selfCorrections);
  const zeroWordsReached = response.zeroWordsReached === true;
  const positiveWordsAttemptedValid = !zeroWordsReached && Number.isInteger(wordsAttempted) && wordsAttempted > 0;
  const zeroWordsAttemptedValid = zeroWordsReached && wordsAttempted === 0;
  const wordsAttemptedValid = (positiveWordsAttemptedValid || zeroWordsAttemptedValid) &&
    Number.isInteger(passageWordCount) &&
    passageWordCount > 0 &&
    wordsAttempted <= passageWordCount;
  const errorsValid = errorsProvided &&
    Number.isInteger(errors) &&
    errors >= 0 &&
    wordsAttemptedValid &&
    errors <= wordsAttempted;
  const selfCorrectionsValid = selfCorrectionsProvided &&
    Number.isInteger(selfCorrections) &&
    selfCorrections >= 0 &&
    wordsAttemptedValid &&
    selfCorrections <= wordsAttempted;
  const combinedCountsValid = errorsValid &&
    selfCorrectionsValid &&
    errors + selfCorrections <= wordsAttempted;

  return {
    combinedCountsValid,
    errorsValid,
    passageWordCount,
    zeroWordsReached,
    zeroWordsAttemptedValid,
    selfCorrectionsValid,
    wordsAttempted,
    wordsAttemptedValid
  };
}

function isResponseComplete(kind, response = {}, item = {}) {
  if (!hasResponseContent(response)) return false;
  if (isNotScorable(response)) return hasNotScorableReason(response);

  if (kind === ASSESSMENT_KINDS.FLUENCY) {
    if (response.timerInterrupted === true) return false;
    const elapsedSeconds = Number(response.elapsedSeconds);
    const countValidation = getFluencyCountValidation(response, item);
    const standardTimingValid = response.finishedEarly !== true &&
      response.timerStatus === "complete" &&
      elapsedSeconds === 60;
    const finishEarlyTimingValid = response.finishedEarly === true &&
      response.timerStatus === "finished_early" &&
      elapsedSeconds > 0 &&
      elapsedSeconds < 60 &&
      countValidation.wordsAttempted === countValidation.passageWordCount;
    const accuracyEvidenceValid = countValidation.zeroWordsReached
      ? getPassageAccuracyJudgment(response) === null
      : typeof getPassageAccuracyJudgment(response) === "boolean";
    return (standardTimingValid || finishEarlyTimingValid) &&
      countValidation.wordsAttemptedValid &&
      countValidation.errorsValid &&
      countValidation.selfCorrectionsValid &&
      countValidation.combinedCountsValid &&
      accuracyEvidenceValid;
  }

  if (response.status === "no_response") {
    return kind !== ASSESSMENT_KINDS.DECODING || isDecodingResponseStateValid(response, item);
  }

  if (!["correct", "incorrect", "self_corrected"].includes(response.status)) return false;
  if (!getExactStudentResponse(kind, response)) return false;

  if (kind === ASSESSMENT_KINDS.DECODING) {
    return isDecodingResponseStateValid(response, item);
  }

  if (kind === ASSESSMENT_KINDS.ENCODING && getEncodingEvaluationIssue(item, response)) {
    return false;
  }

  return true;
}

function isItemResolved(kind, response = {}, item = {}) {
  return isResponseComplete(kind, response, item) || (
    response.status === "not_administered" &&
    ["decoding_stop_rule", "fluency_stop_teacher_judgment"].includes(response.routeSkipReason)
  );
}

function getDecodingBands(items = []) {
  const bands = new Map();

  items.forEach((item, index) => {
    const bandId = String(item.bandId || item.microphase || "decoding-band");
    if (!bands.has(bandId)) {
      bands.set(bandId, {
        id: bandId,
        label: item.microphaseLabel || humanize(bandId),
        microphase: item.microphase ?? "",
        indexes: []
      });
    }
    bands.get(bandId).indexes.push(index);
  });

  return Array.from(bands.values());
}

function getDecodingBandMetrics(band, items, responses, stopRule = {}) {
  const bandRows = band.indexes.map(index => {
    const itemId = getItemId(items[index], index, ASSESSMENT_KINDS.DECODING);
    return { item: items[index], response: responses[itemId] || {} };
  });
  const automaticCount = bandRows.filter(({ item, response }) => (
    isResponseComplete(ASSESSMENT_KINDS.DECODING, response, item) &&
    response.isCorrect === true && response.automatic === true && response.selfCorrected !== true
  )).length;
  const notScorableCount = bandRows.filter(({ response }) => isNotScorable(response)).length;
  const threshold = Number(stopRule?.threshold ?? 5);
  const denominator = Number(stopRule?.denominator ?? band.indexes.length);
  const bandComplete = bandRows.every(({ item, response }) => (
    isResponseComplete(ASSESSMENT_KINDS.DECODING, response, item)
  ));

  return {
    automaticCount,
    bandComplete,
    denominator,
    notScorableCount,
    stopRuleMet: bandComplete && notScorableCount === 0 && automaticCount <= threshold,
    threshold
  };
}

function normalizeDecodingBandDecisions(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function getPlacementMicrophase(placement = {}) {
  if (!placement || typeof placement !== "object") return "";
  return placement.microphase || placement.candidateMicrophase || placement.id || "";
}

function getAdministrationRangeMicrophases(route = {}) {
  const explicit = toArray(route.candidateMicrophases).map(value => (
    typeof value === "string" ? value : value?.id
  )).filter(Boolean);
  if (explicit.length) return explicit;

  const range = route.administrationRange || {};
  const startId = range.startMicrophase || route.rangeStart || "";
  const endId = range.endMicrophase || route.rangeEnd || "";
  const startIndex = EL_DECODING_MICROPHASES.findIndex(row => row.id === startId);
  const endIndex = EL_DECODING_MICROPHASES.findIndex(row => row.id === endId);
  if (startIndex < 0 || endIndex < startIndex) return [];
  return EL_DECODING_MICROPHASES.slice(startIndex, endIndex + 1).map(row => row.id);
}

function getAdjacentCeilingMicrophase(route = {}) {
  const rangeMicrophases = getAdministrationRangeMicrophases(route);
  const ceilingId = rangeMicrophases.at(-1) || route.administrationRange?.endMicrophase || "";
  const ceilingIndex = EL_DECODING_MICROPHASES.findIndex(row => row.id === ceilingId);
  return ceilingIndex >= 0 ? EL_DECODING_MICROPHASES[ceilingIndex + 1]?.id || "" : "";
}

function isExactAdjacentCeilingProposal(kind, route, proposedMicrophase, selectedMicrophase = proposedMicrophase) {
  return kind === ASSESSMENT_KINDS.DECODING &&
    Boolean(proposedMicrophase) &&
    selectedMicrophase === proposedMicrophase &&
    proposedMicrophase === getAdjacentCeilingMicrophase(route);
}

function placementRequiresRationale(kind, preview, selectedMicrophase, proposedMicrophase) {
  if (kind === ASSESSMENT_KINDS.ENCODING) return true;
  if (!proposedMicrophase) return true;
  if (preview?.scoreStatus !== "scored" || Number(preview?.scoredCount || 0) <= 0) return true;
  return selectedMicrophase !== proposedMicrophase;
}

function getErrorTagOptions(kind, item = {}) {
  const configured = EL_BENCHMARK_ERROR_TAGS;
  const fallback = kind === ASSESSMENT_KINDS.ENCODING
    ? ENCODING_FALLBACK_ERROR_TAGS
    : DECODING_FALLBACK_ERROR_TAGS;
  let source = [];

  if (Array.isArray(configured)) {
    source = configured;
  } else if (configured && typeof configured === "object") {
    const keys = kind === ASSESSMENT_KINDS.ENCODING
      ? ["encoding", "el_encoding"]
      : ["decoding", "el_decoding"];
    source = keys.flatMap(key => toArray(configured[key]));
    if (!source.length) {
      const relevantValues = new Set(fallback.map(option => option.value));
      source = Object.values(configured).filter(value => relevantValues.has(normalizeKey(value)));
    }
  }

  const itemTags = toArray(item.errorTags || item.availableErrorTags);
  const candidates = [...itemTags, ...source, ...fallback];
  const seen = new Set();

  return candidates.map(option => {
    if (typeof option === "string") {
      return { value: normalizeKey(option), label: humanize(option) };
    }
    return {
      value: normalizeKey(option?.value || option?.id || option?.key || option?.label),
      label: option?.label || humanize(option?.value || option?.id || option?.key)
    };
  }).filter(option => {
    if (!option.value || seen.has(option.value)) return false;
    seen.add(option.value);
    return true;
  });
}

function getStudentName(session = {}) {
  return session.studentName || session.student?.name || "Selected student";
}

function getPlanResult(session = {}) {
  try {
    const plan = getElBenchmarkPlan({
      assessmentId: session.assessmentId,
      grade: session.grade,
      window: session.window,
      startMicrophase: session.startMicrophase,
      formId: session.formId
    });
    return { plan, error: null };
  } catch (error) {
    return {
      plan: null,
      error: error instanceof Error ? error : new Error("The assessment plan could not be loaded.")
    };
  }
}

function getPrompt(item = {}) {
  return item.teacherSay || item.prompt || item.question || item.directions || "Administer this item using the scoring guidance.";
}

function getMicrophaseLabel(plan = {}, item = {}) {
  return item.microphase ||
    plan.route?.microphaseLabel ||
    plan.route?.selectedStartMicrophase ||
    "Provisional route";
}

function getPassage(plan = {}, item = {}) {
  if (item && Object.keys(item).length > 0) {
    if (item.passage && typeof item.passage === "object") return { ...item, ...item.passage };
    if (typeof item.passage === "string") return { ...item, text: item.passage };
    return item;
  }
  return plan.passage || {};
}

function tokenizePassage(passage = {}) {
  const provided = toArray(passage.tokens || passage.words);
  const rawTokens = provided.length
    ? provided
    : String(passage.text || passage.passage || "").match(/\S+/g) || [];
  let wordIndex = -1;

  return rawTokens.map((token, tokenIndex) => {
    const text = typeof token === "string"
      ? token
      : String(token?.text || token?.word || token?.token || "");
    const isWord = typeof token === "object" && token !== null && token.isWord !== undefined
      ? Boolean(token.isWord)
      : /[A-Za-z0-9]/.test(text);

    if (isWord) wordIndex += 1;
    return {
      id: `${String(token?.id || "passage_token")}_${tokenIndex + 1}`,
      text,
      isWord,
      wordIndex: isWord ? wordIndex : null
    };
  });
}

function AssessmentStatusButtons({ legend, options, value, onChange }) {
  return (
    <fieldset className="el-benchmark-fieldset">
      <legend>{legend}</legend>
      <div className="el-benchmark-status-grid">
        {options.map(option => (
          <button
            aria-pressed={value === option.value}
            className={`el-benchmark-status-button tone-${option.tone || "neutral"}`}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            <span>{option.label}</span>
            {option.help && <small>{option.help}</small>}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function NotScorableReasonPanel({ response, onCancel, onClear, onConfirm }) {
  const [reason, setReason] = useState(response.notScorableReason || "");
  const [note, setNote] = useState(response.notScorableNote || "");
  const noteRequired = reason === "other";
  const ready = Boolean(reason) && (!noteRequired || note.trim());

  return (
    <section className="el-benchmark-not-scorable-reason" aria-label="Not-scorable evidence">
      <div>
        <strong>Why is this item not scorable?</strong>
        <p>A reason is required so this outcome is auditable and is never treated as an incorrect response.</p>
      </div>
      <label className="el-benchmark-control">
        <span>Reason</span>
        <select onChange={event => setReason(event.target.value)} value={reason}>
          <option value="">Choose a reason</option>
          {NOT_SCORABLE_REASONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <label className="el-benchmark-control">
        <span>Note {noteRequired ? "(required)" : "(optional)"}</span>
        <textarea
          onChange={event => setNote(event.target.value)}
          placeholder="Add concise administration context"
          required={noteRequired}
          rows="2"
          value={note}
        />
      </label>
      <div className="el-benchmark-button-row">
        <button
          className="el-benchmark-button primary compact"
          disabled={!ready}
          onClick={() => onConfirm(reason, note.trim())}
          type="button"
        >
          Save not-scorable reason
        </button>
        <button className="el-benchmark-button ghost compact" onClick={onCancel} type="button">Cancel</button>
        {response.status === "not_scorable" && (
          <button className="el-benchmark-button secondary compact" onClick={onClear} type="button">Clear not-scorable status</button>
        )}
      </div>
    </section>
  );
}

function NotScorableSummary({ response }) {
  if (response.status !== "not_scorable" || !hasNotScorableReason(response)) return null;
  const label = NOT_SCORABLE_REASONS.find(option => option.value === response.notScorableReason)?.label || humanize(response.notScorableReason);
  return (
    <p className="el-benchmark-not-scorable-summary">
      <strong>Not scorable:</strong> {label}{response.notScorableNote ? ` | ${response.notScorableNote}` : ""}
    </p>
  );
}

function ExactResponseField({ value = "", onChange, label = "Exact student response", help = "Record what the student said, including an approximation or no response." }) {
  return (
    <label className="el-benchmark-control">
      <span>{label}</span>
      <input
        autoComplete="off"
        onChange={event => onChange(event.target.value)}
        placeholder="Enter the response exactly as heard"
        type="text"
        value={value}
      />
      <small>{help}</small>
    </label>
  );
}

function PhonologicalAwarenessPanel({ item, response, onResponseChange }) {
  const [revealedAnswerItemId, setRevealedAnswerItemId] = useState("");
  const [showNotScorableReason, setShowNotScorableReason] = useState(
    isNotScorable(response) && !hasNotScorableReason(response)
  );
  const expectedAnswers = toArray(item.expectedAnswers || item.acceptedAnswers);
  const attemptedResponseSelected = ["correct", "not_yet"].includes(
    response.evaluation || (response.status === "correct" ? "correct" : response.status === "incorrect" ? "not_yet" : "")
  );
  const answerVisible = revealedAnswerItemId === item.id;

  const setEvaluation = value => {
    if (value === "not_scorable") {
      setShowNotScorableReason(true);
      return;
    }

    setShowNotScorableReason(false);
    const auditReset = { notScorableReason: "", notScorableNote: "", teacherOverride: null };
    if (value === "correct") {
      onResponseChange({ ...auditReset, status: "correct", isCorrect: true, evaluation: value });
    } else if (value === "no_response") {
      onResponseChange({ ...auditReset, status: "no_response", isCorrect: false, evaluation: value, responseText: "" });
    } else {
      onResponseChange({ ...auditReset, status: "incorrect", isCorrect: false, evaluation: "not_yet" });
    }
  };

  return (
    <div className="el-benchmark-response-stack">
      {expectedAnswers.length > 0 && (
        <aside className="el-benchmark-scoring-reference" aria-label="Scoring reference">
          <span>Expected response</span>
          <strong>{answerVisible ? expectedAnswers.join(" or ") : "Answer hidden"}</strong>
          <button
            aria-expanded={answerVisible}
            className="el-benchmark-button secondary compact"
            onClick={() => setRevealedAnswerItemId(answerVisible ? "" : item.id)}
            type="button"
          >
            {answerVisible ? "Hide scoring reference" : "Reveal scoring reference"}
          </button>
        </aside>
      )}

      <ExactResponseField
        onChange={responseText => onResponseChange({
          responseText,
          ...(response.status === "no_response" && responseText.trim()
            ? { status: "not_administered", isCorrect: null, evaluation: "" }
            : {})
        })}
        value={response.responseText || ""}
      />

      <AssessmentStatusButtons
        legend="Score this oral response"
        onChange={setEvaluation}
        options={[
          { value: "correct", label: "Correct", help: "Independent correct response", tone: "positive" },
          { value: "not_yet", label: "Not yet", help: "An attempted response was incorrect", tone: "warning" },
          { value: "no_response", label: "No response", help: "Student gave no oral response", tone: "neutral" },
          { value: "not_scorable", label: "Not scorable", help: "Do not count in the score", tone: "neutral" }
        ]}
        value={response.evaluation || (response.status === "not_scorable"
          ? "not_scorable"
          : response.status === "no_response"
            ? "no_response"
            : "")}
      />

      {attemptedResponseSelected && !getExactStudentResponse(ASSESSMENT_KINDS.PHONOLOGICAL_AWARENESS, response) && (
        <p className="el-benchmark-inline-note">Enter the exact oral response before this item can be recorded.</p>
      )}

      <NotScorableSummary response={response} />
      {showNotScorableReason && (
        <NotScorableReasonPanel
          onCancel={() => setShowNotScorableReason(false)}
          onClear={() => {
            setShowNotScorableReason(false);
            onResponseChange({
              status: "not_administered",
              isCorrect: null,
              evaluation: "",
              notScorableReason: "",
              notScorableNote: ""
            });
          }}
          onConfirm={(reason, note) => {
            setShowNotScorableReason(false);
            onResponseChange({
              status: "not_scorable",
              isCorrect: null,
              evaluation: "not_scorable",
              notScorableReason: reason,
              notScorableNote: note
            });
          }}
          response={response}
        />
      )}
    </div>
  );
}

function EncodingPanel({ item, response, onResponseChange }) {
  const [answerVisible, setAnswerVisible] = useState(false);
  const [showNotScorableReason, setShowNotScorableReason] = useState(
    isNotScorable(response) && !hasNotScorableReason(response)
  );
  const acceptedSpellings = toArray(item.acceptedSpellings || item.expectedAnswers || item.targetWord);
  const plausibleSpellings = toArray(item.plausibleSpellings);
  const errorTags = getErrorTagOptions(ASSESSMENT_KINDS.ENCODING, item);
  const selectedTags = new Set(toArray(response.errorTags));
  const attemptedResponseSelected = ["exact", "plausible", "not_yet"].includes(response.evaluation);
  const evaluationIssue = getEncodingEvaluationIssue(item, response);

  const setEvaluation = value => {
    if (value === "not_scorable") {
      setShowNotScorableReason(true);
      return;
    }

    setShowNotScorableReason(false);
    const auditReset = { notScorableReason: "", notScorableNote: "" };
    if (value === "exact") {
      onResponseChange({ ...auditReset, status: "correct", isCorrect: true, plausible: false, evaluation: value, errorTags: [] });
    } else if (value === "plausible") {
      onResponseChange({ ...auditReset, status: "incorrect", isCorrect: false, plausible: true, evaluation: value });
    } else if (value === "no_response") {
      onResponseChange({
        ...auditReset,
        status: "no_response",
        isCorrect: false,
        plausible: false,
        evaluation: value,
        transcription: "",
        responseText: "",
        errorTags: []
      });
    } else {
      onResponseChange({ ...auditReset, status: "incorrect", isCorrect: false, plausible: false, evaluation: "not_yet" });
    }
  };

  const toggleTag = tag => {
    const next = new Set(selectedTags);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    onResponseChange({ errorTags: Array.from(next) });
  };

  return (
    <div className="el-benchmark-response-stack">
      <section className="el-benchmark-answer-guide" aria-label="Encoding scoring guide">
        <div>
          <span>Scoring answer</span>
          {answerVisible ? (
            <strong>{acceptedSpellings.join(" or ") || "No answer supplied"}</strong>
          ) : (
            <strong aria-label="Answer hidden">Answer hidden</strong>
          )}
        </div>
        <button
          aria-expanded={answerVisible}
          className="el-benchmark-button secondary compact"
          onClick={() => setAnswerVisible(visible => !visible)}
          type="button"
        >
          {answerVisible ? "Hide answer" : "Reveal answer"}
        </button>
        {answerVisible && plausibleSpellings.length > 0 && (
          <p>Plausible forms in this provisional bank: {plausibleSpellings.join(", ")}</p>
        )}
      </section>

      <label className="el-benchmark-control">
        <span>Student&apos;s written response</span>
        <input
          autoComplete="off"
          onChange={event => onResponseChange({
            transcription: event.target.value,
            responseText: event.target.value,
            teacherOverride: null,
            ...(response.status === "no_response" && event.target.value.trim()
              ? { status: "not_administered", isCorrect: null, plausible: null, evaluation: "" }
              : {})
          })}
          placeholder="Transcribe the spelling exactly"
          spellCheck="false"
          type="text"
          value={response.transcription !== undefined ? response.transcription : response.responseText || ""}
        />
        <small>Preserve omissions, additions, and reversals in the transcription.</small>
      </label>

      <AssessmentStatusButtons
        legend="Evaluate the spelling"
        onChange={setEvaluation}
        options={[
          { value: "exact", label: "Exact", help: "Matches an accepted spelling", tone: "positive" },
          { value: "plausible", label: "Plausible", help: "Represents sounds but is not exact", tone: "info" },
          { value: "not_yet", label: "Not yet", help: "Does not yet represent the target", tone: "warning" },
          { value: "no_response", label: "No response", help: "Student wrote nothing", tone: "neutral" },
          { value: "not_scorable", label: "Not scorable", help: "Do not count in the score", tone: "neutral" }
        ]}
        value={response.evaluation || (response.status === "not_scorable"
          ? "not_scorable"
          : response.status === "no_response"
            ? "no_response"
            : "")}
      />

      {attemptedResponseSelected && !getExactStudentResponse(ASSESSMENT_KINDS.ENCODING, response) && (
        <p className="el-benchmark-inline-note">Transcribe the student&apos;s written response before this item can be recorded.</p>
      )}
      {evaluationIssue === "exact_mismatch" && (
        <p className="el-benchmark-inline-note">This transcription does not match an accepted exact spelling. Reveal the answer and correct the evaluation.</p>
      )}
      {evaluationIssue === "exact_match_marked_nonexact" && (
        <p className="el-benchmark-inline-note">This transcription matches an accepted spelling. Record it as Exact.</p>
      )}
      {evaluationIssue === "exact_override_conflicts_with_evaluation" && (
        <p className="el-benchmark-inline-note">The restored exact-spelling override conflicts with the selected evaluation. Re-enter the evaluation to clear the stale override.</p>
      )}

      <NotScorableSummary response={response} />
      {showNotScorableReason && (
        <NotScorableReasonPanel
          onCancel={() => setShowNotScorableReason(false)}
          onClear={() => {
            setShowNotScorableReason(false);
            onResponseChange({
              status: "not_administered",
              isCorrect: null,
              plausible: null,
              evaluation: "",
              notScorableReason: "",
              notScorableNote: "",
              errorTags: []
            });
          }}
          onConfirm={(reason, note) => {
            setShowNotScorableReason(false);
            onResponseChange({
              status: "not_scorable",
              isCorrect: null,
              plausible: null,
              evaluation: "not_scorable",
              notScorableReason: reason,
              notScorableNote: note,
              errorTags: []
            });
          }}
          response={response}
        />
      )}

      <fieldset className="el-benchmark-fieldset">
        <legend>Error features observed</legend>
        <p className="el-benchmark-field-help">Optional. Select every feature that will help plan instruction.</p>
        <div className="el-benchmark-tag-grid">
          {errorTags.map(tag => (
            <button
              aria-pressed={selectedTags.has(tag.value)}
              key={tag.value}
              onClick={() => toggleTag(tag.value)}
              type="button"
            >
              {tag.label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function getDecodingEvaluationPatch(value, response = {}, notScorableEvidence = {}) {
  const auditReset = { notScorableReason: "", notScorableNote: "" };
  const priorEvaluationWasAccurate = ["automatic_accurate", "accurate_after_sounding"].includes(response.evaluation);
  const selfCorrected = priorEvaluationWasAccurate && response.selfCorrected === true;

  if (value === "automatic_accurate") {
    return {
      ...auditReset,
      status: selfCorrected ? "self_corrected" : "correct",
      isCorrect: true,
      automatic: !selfCorrected,
      selfCorrected,
      errorTags: selfCorrected ? toArray(response.errorTags).filter(tag => tag !== "no_response") : [],
      evaluation: value
    };
  }

  if (value === "accurate_after_sounding") {
    return {
      ...auditReset,
      status: selfCorrected ? "self_corrected" : "correct",
      isCorrect: true,
      automatic: false,
      selfCorrected,
      errorTags: selfCorrected ? toArray(response.errorTags).filter(tag => tag !== "no_response") : [],
      evaluation: value
    };
  }

  if (value === "no_response") {
    return {
      ...auditReset,
      status: "no_response",
      isCorrect: false,
      automatic: false,
      selfCorrected: false,
      responseText: "",
      errorTags: ["no_response"],
      evaluation: value
    };
  }

  if (value === "not_scorable") {
    return {
      status: "not_scorable",
      isCorrect: null,
      automatic: null,
      selfCorrected: false,
      errorTags: [],
      evaluation: value,
      notScorableReason: String(notScorableEvidence.reason || "").trim(),
      notScorableNote: String(notScorableEvidence.note || "").trim()
    };
  }

  return {
    ...auditReset,
    status: "incorrect",
    isCorrect: false,
    automatic: false,
    selfCorrected: false,
    errorTags: toArray(response.errorTags).filter(tag => tag !== "no_response"),
    evaluation: "incorrect"
  };
}

function DecodingPanel({ item, response, onResponseChange }) {
  const [showNotScorableReason, setShowNotScorableReason] = useState(
    isNotScorable(response) && !hasNotScorableReason(response)
  );
  const errorTypes = getErrorTagOptions(ASSESSMENT_KINDS.DECODING, item);
  const evaluation = response.evaluation || (response.status === "not_scorable"
    ? "not_scorable"
    : response.status === "no_response"
      ? "no_response"
      : response.status === "incorrect"
        ? "incorrect"
        : response.status === "self_corrected" || response.status === "correct"
          ? response.automatic === true ? "automatic_accurate" : "accurate_after_sounding"
      : "");
  const accurateEvaluation = ["automatic_accurate", "accurate_after_sounding"].includes(evaluation);
  const attemptedResponseSelected = accurateEvaluation || evaluation === "incorrect";
  const errorTypeEnabled = evaluation === "incorrect" || (accurateEvaluation && response.selfCorrected === true);
  const evaluationIssue = getDecodingEvaluationIssue(item, response);

  const setEvaluation = value => {
    if (value === "not_scorable") {
      setShowNotScorableReason(true);
      return;
    }
    setShowNotScorableReason(false);
    onResponseChange(getDecodingEvaluationPatch(value, response));
  };

  const setSelfCorrected = selfCorrected => {
    if (!accurateEvaluation) return;
    onResponseChange({
      selfCorrected,
      automatic: !selfCorrected && evaluation === "automatic_accurate",
      status: selfCorrected
        ? "self_corrected"
        : "correct",
      errorTags: selfCorrected ? toArray(response.errorTags).filter(tag => tag !== "no_response") : []
    });
  };

  return (
    <div className="el-benchmark-response-stack">
      <ExactResponseField
        help="Record the spoken word exactly. Leave this blank only when no response was given."
        onChange={responseText => onResponseChange({
          responseText,
          ...(response.status === "no_response" && responseText.trim()
            ? {
                status: "not_administered",
                isCorrect: null,
                automatic: null,
                selfCorrected: false,
                errorTags: [],
                evaluation: ""
              }
            : {})
        })}
        value={response.responseText || ""}
      />

      <AssessmentStatusButtons
        legend="Evaluate the word reading"
        onChange={setEvaluation}
        options={[
          { value: "automatic_accurate", label: "Automatic + accurate", help: "Read correctly without sounding out", tone: "positive" },
          { value: "accurate_after_sounding", label: "Accurate after sounding", help: "Correct, but not automatic", tone: "info" },
          { value: "incorrect", label: "Incorrect", help: "An attempted word was incorrect", tone: "warning" },
          { value: "no_response", label: "No response", help: "Student gave no spoken response", tone: "neutral" },
          { value: "not_scorable", label: "Not scorable", help: "Do not count in the score", tone: "neutral" }
        ]}
        value={evaluation}
      />

      {attemptedResponseSelected && !getExactStudentResponse(ASSESSMENT_KINDS.DECODING, response) && (
        <p className="el-benchmark-inline-note">Enter the exact spoken response before this item can be recorded.</p>
      )}
      {evaluationIssue === "accurate_response_mismatch" && (
        <p className="el-benchmark-inline-note">This transcription does not match the displayed word. Mark the response Incorrect, or correct the transcription.</p>
      )}
      {evaluationIssue === "incorrect_response_matches_target" && (
        <p className="el-benchmark-inline-note">This transcription matches the displayed word. Choose an accurate outcome, or correct the transcription.</p>
      )}

      <NotScorableSummary response={response} />
      {showNotScorableReason && (
        <NotScorableReasonPanel
          onCancel={() => setShowNotScorableReason(false)}
          onClear={() => {
            setShowNotScorableReason(false);
            onResponseChange({
              status: "not_administered",
              isCorrect: null,
              automatic: null,
              selfCorrected: false,
              errorTags: [],
              evaluation: "",
              notScorableReason: "",
              notScorableNote: ""
            });
          }}
          onConfirm={(reason, note) => {
            setShowNotScorableReason(false);
            onResponseChange(getDecodingEvaluationPatch("not_scorable", response, { reason, note }));
          }}
          response={response}
        />
      )}

      <div className="el-benchmark-detail-grid">
        <label className="el-benchmark-check-control">
          <input
            checked={accurateEvaluation && Boolean(response.selfCorrected)}
            disabled={!accurateEvaluation}
            onChange={event => setSelfCorrected(event.target.checked)}
            type="checkbox"
          />
          <span>
            Self-corrected
            <small>Student changed the response without a teacher prompt.</small>
          </span>
        </label>

        <label className="el-benchmark-control">
          <span>Error type</span>
          <select
            disabled={!errorTypeEnabled}
            onChange={event => onResponseChange({
              errorTags: event.target.value && event.target.value !== "none" ? [event.target.value] : []
            })}
            value={toArray(response.errorTags)[0] || "none"}
          >
            {errorTypes.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <small>Choose the most useful instructional description.</small>
        </label>
      </div>
    </div>
  );
}

function ProtectedEncodingPrompt({ item }) {
  const [scriptVisible, setScriptVisible] = useState(false);

  return (
    <section className="el-benchmark-prompt-panel el-benchmark-protected-prompt" aria-label="Protected teacher prompt">
      <div>
        <span>Teacher-only dictation script</span>
        <strong>Keep this part of the screen out of the student&apos;s sight.</strong>
      </div>
      <p>{item.prompt || "Ask the student to write the word they hear."}</p>
      <button
        aria-expanded={scriptVisible}
        className="el-benchmark-button secondary compact"
        onClick={() => setScriptVisible(visible => !visible)}
        type="button"
      >
        {scriptVisible ? "Hide teacher script" : "Reveal teacher script"}
      </button>
      {scriptVisible && (
        <div className="el-benchmark-protected-script">
          <span>Say exactly</span>
          <p>{item.teacherSay || item.sentence || "No dictation script supplied."}</p>
        </div>
      )}
    </section>
  );
}

function getFluencyTimerResetPatch() {
  return {
    accurate: null,
    accurateInOneMinute: null,
    accuracy: null,
    accuracyJudgedAt: "",
    accuracyJudgmentSource: "",
    correctWords: null,
    errors: null,
    finishedEarly: false,
    interruptionReason: "",
    lastWord: "",
    lastWordIndex: null,
    isCorrect: null,
    notScorableNote: "",
    notScorableReason: "",
    passageAccurate: null,
    prosody: {},
    prosodyRating: null,
    selfCorrections: null,
    status: "not_administered",
    teacherAccuracyJudgment: null,
    timerInterrupted: false,
    informationalNotes: [],
    validationIssues: [],
    wcpm: null,
    wordsAttempted: null,
    zeroWordsReached: false
  };
}

function getFluencyTimerInterruptionPatch(reason) {
  return {
    accurate: null,
    accurateInOneMinute: null,
    accuracyJudgedAt: "",
    accuracyJudgmentSource: "",
    interruptionReason: reason,
    passageAccurate: null,
    teacherAccuracyJudgment: null,
    timerInterrupted: true
  };
}

function FluencyTimer({ response, onFinishEarly, onResponseChange }) {
  const recordedElapsed = Number(response.elapsedSeconds) || 0;
  const initialElapsed = Math.min(60, Math.max(0, recordedElapsed));
  const [elapsedSeconds, setElapsedSeconds] = useState(initialElapsed);
  const [running, setRunning] = useState(false);
  const startedAtRef = useRef(null);
  const baseElapsedRef = useRef(initialElapsed);
  const lastSavedElapsedRef = useRef(initialElapsed);
  const lastTimerTickAtRef = useRef(null);
  const startedLocallyRef = useRef(false);
  const interruptionHandledRef = useRef(false);

  const saveElapsed = useCallback((elapsed, status, extra = {}) => {
    onResponseChange({
      elapsedSeconds: elapsed,
      timerStatus: status,
      ...extra
    });
  }, [onResponseChange]);

  useEffect(() => {
    if (
      response.timerStatus !== "running" ||
      response.timerInterrupted === true ||
      startedLocallyRef.current ||
      running
    ) return;
    // A page reload or restored draft cannot prove that reading remained
    // continuous while the timer component was absent. Preserve the elapsed
    // observation, but require a clean reset before deriving WCPM.
    saveElapsed(
      initialElapsed,
      "interrupted",
      getFluencyTimerInterruptionPatch("timer_session_restored_while_running")
    );
  }, [initialElapsed, response.timerInterrupted, response.timerStatus, running, saveElapsed]);

  const interruptTimer = useCallback((reason) => {
    if (!running || interruptionHandledRef.current) return;
    interruptionHandledRef.current = true;
    const elapsedSinceStart = startedAtRef.current
      ? Math.floor((Date.now() - startedAtRef.current) / 1000)
      : 0;
    const nextElapsed = Math.min(59, Math.max(0, baseElapsedRef.current + elapsedSinceStart));
    setElapsedSeconds(nextElapsed);
    setRunning(false);
    baseElapsedRef.current = nextElapsed;
    lastSavedElapsedRef.current = nextElapsed;
    lastTimerTickAtRef.current = null;
    startedAtRef.current = null;
    startedLocallyRef.current = false;
    saveElapsed(nextElapsed, "interrupted", getFluencyTimerInterruptionPatch(reason));
  }, [running, saveElapsed]);

  useEffect(() => {
    if (!running) return undefined;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") interruptTimer("page_hidden_during_timing");
    };
    const handlePageHide = () => interruptTimer("page_hidden_during_timing");
    const handleBeforePrint = () => interruptTimer("print_started_during_timing");
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeprint", handleBeforePrint);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeprint", handleBeforePrint);
    };
  }, [interruptTimer, running]);

  useEffect(() => {
    if (!running) return undefined;
    if (!startedAtRef.current) startedAtRef.current = Date.now();
    if (!lastTimerTickAtRef.current) lastTimerTickAtRef.current = Date.now();

    const intervalId = window.setInterval(() => {
      const tickAt = Date.now();
      // A throttled/backgrounded page, device sleep, blocking dialog, or large
      // main-thread stall breaks continuous observation. Never turn that clock
      // jump into a valid 60-second score.
      if (tickAt - lastTimerTickAtRef.current > 1500) {
        interruptTimer("timer_tick_gap_during_timing");
        return;
      }
      lastTimerTickAtRef.current = tickAt;
      const startedAt = startedAtRef.current;
      const elapsedSinceStart = Math.max(0, Math.floor((tickAt - startedAt) / 1000));
      const nextElapsed = Math.min(60, Math.max(0, baseElapsedRef.current + elapsedSinceStart));
      if (nextElapsed !== lastSavedElapsedRef.current) {
        lastSavedElapsedRef.current = nextElapsed;
        setElapsedSeconds(nextElapsed);
        saveElapsed(nextElapsed, nextElapsed >= 60 ? "complete" : "running");
      }

      if (nextElapsed >= 60) {
        interruptionHandledRef.current = true;
        lastTimerTickAtRef.current = null;
        startedAtRef.current = null;
        startedLocallyRef.current = false;
        setRunning(false);
      }
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [interruptTimer, running, saveElapsed]);

  const startTimer = () => {
    if (
      elapsedSeconds !== 0 ||
      response.finishedEarly === true ||
      response.timerInterrupted === true
    ) return;
    startedLocallyRef.current = true;
    interruptionHandledRef.current = false;
    baseElapsedRef.current = elapsedSeconds;
    startedAtRef.current = Date.now();
    lastTimerTickAtRef.current = startedAtRef.current;
    setRunning(true);
    saveElapsed(elapsedSeconds, "running", getFluencyTimerResetPatch());
  };

  const stopTimer = () => {
    if (
      lastTimerTickAtRef.current &&
      Date.now() - lastTimerTickAtRef.current > 1500
    ) {
      interruptTimer("timer_tick_gap_during_timing");
      return;
    }
    const elapsedSinceStart = startedAtRef.current
      ? Math.floor((Date.now() - startedAtRef.current) / 1000)
      : 0;
    const nextElapsed = Math.min(60, baseElapsedRef.current + elapsedSinceStart);
    setElapsedSeconds(nextElapsed);
    setRunning(false);
    baseElapsedRef.current = nextElapsed;
    lastSavedElapsedRef.current = nextElapsed;
    lastTimerTickAtRef.current = null;
    startedAtRef.current = null;
    startedLocallyRef.current = false;
    interruptionHandledRef.current = true;
    saveElapsed(nextElapsed, nextElapsed >= 60 ? "complete" : "interrupted", {
      interruptionReason: nextElapsed >= 60 ? "" : "teacher_stopped_before_full_minute",
      timerInterrupted: nextElapsed < 60
    });
  };

  const finishPassageEarly = () => {
    if (
      lastTimerTickAtRef.current &&
      Date.now() - lastTimerTickAtRef.current > 1500
    ) {
      interruptTimer("timer_tick_gap_during_timing");
      return;
    }
    const elapsedSinceStart = startedAtRef.current
      ? Math.floor((Date.now() - startedAtRef.current) / 1000)
      : 0;
    const nextElapsed = Math.min(60, baseElapsedRef.current + elapsedSinceStart);
    if (nextElapsed <= 0 || nextElapsed >= 60) return;
    setElapsedSeconds(nextElapsed);
    setRunning(false);
    baseElapsedRef.current = nextElapsed;
    lastSavedElapsedRef.current = nextElapsed;
    lastTimerTickAtRef.current = null;
    startedAtRef.current = null;
    startedLocallyRef.current = false;
    interruptionHandledRef.current = true;
    onFinishEarly(nextElapsed);
  };

  const resetTimer = () => {
    setRunning(false);
    setElapsedSeconds(0);
    baseElapsedRef.current = 0;
    lastSavedElapsedRef.current = 0;
    lastTimerTickAtRef.current = null;
    startedAtRef.current = null;
    startedLocallyRef.current = false;
    interruptionHandledRef.current = false;
    saveElapsed(0, "not_started", getFluencyTimerResetPatch());
  };

  const remainingSeconds = Math.max(0, 60 - elapsedSeconds);
  const timerLabel = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;
  const timerDisplayRunning = running || (
    response.timerStatus === "running" && response.timerInterrupted !== true
  );

  return (
    <section className="el-benchmark-timer" aria-label="Sixty second reading timer">
      <div>
        <span>Time remaining</span>
        <strong aria-label={`${remainingSeconds} seconds remaining`} role="timer">{timerLabel}</strong>
        <small>{timerDisplayRunning
          ? "Timer running"
          : recordedElapsed > 60 || recordedElapsed < 0
            ? "Recorded time needs correction"
            : response.finishedEarly
            ? `Finished early at ${elapsedSeconds} seconds`
            : elapsedSeconds >= 60
              ? "Full minute recorded"
              : response.timerInterrupted
                ? "Timer interrupted — reset before reading again"
                : "Ready to begin"}</small>
      </div>
      <div className="el-benchmark-timer-actions">
        {!timerDisplayRunning && response.finishedEarly !== true ? (
          elapsedSeconds === 0 && response.timerInterrupted !== true ? (
            <button
              className="el-benchmark-button primary"
              onClick={startTimer}
              type="button"
            >
              Start timer
            </button>
          ) : response.timerInterrupted === true ? (
            <span className="el-benchmark-timer-complete-note">Interrupted timing cannot produce WCPM</span>
          ) : (
            <span className="el-benchmark-timer-complete-note">Full passage finish recorded</span>
          )
        ) : timerDisplayRunning ? (
          <>
            <button className="el-benchmark-button warning" onClick={stopTimer} type="button">
              Stop due to interruption
            </button>
            <button
              className="el-benchmark-button secondary"
              disabled={elapsedSeconds <= 0 || elapsedSeconds >= 60}
              onClick={finishPassageEarly}
              type="button"
            >
              Finished passage before 60 seconds
            </button>
          </>
        ) : (
          <span className="el-benchmark-timer-complete-note">Full passage finish recorded</span>
        )}
        <button className="el-benchmark-button secondary" onClick={resetTimer} type="button">
          Reset timer
        </button>
      </div>
    </section>
  );
}

function FluencyPanel({ plan, item, response, onResponseChange }) {
  const [showNotScorableReason, setShowNotScorableReason] = useState(
    isNotScorable(response) && !hasNotScorableReason(response)
  );
  const passage = getPassage(plan, item);
  const tokens = tokenizePassage(passage);
  const wordTokens = tokens.filter(token => token.isWord);
  const passageWordCount = Number(passage.wordCount || wordTokens.length);
  const lastWordIndex = ![undefined, null, ""].includes(response.lastWordIndex) && Number.isInteger(Number(response.lastWordIndex))
    ? Number(response.lastWordIndex)
    : -1;
  const prosody = response.prosody || {};
  const accuracyJudgment = getPassageAccuracyJudgment(response);
  const zeroWordsReached = response.zeroWordsReached === true;
  const elapsedSeconds = Number(response.elapsedSeconds);
  const finishEarlyTimingValid = response.finishedEarly === true &&
    response.timerStatus === "finished_early" &&
    elapsedSeconds > 0 &&
    elapsedSeconds < 60 &&
    Number(response.wordsAttempted) === passageWordCount;
  const standardTimingValid = response.finishedEarly !== true &&
    response.timerStatus === "complete" &&
    elapsedSeconds === 60;
  const timingEvidenceReady = response.timerInterrupted !== true && (
    finishEarlyTimingValid || standardTimingValid
  );
  const countValidation = getFluencyCountValidation(response, passage);

  const setLastWord = token => {
    if (!standardTimingValid || response.timerInterrupted === true) return;
    onResponseChange({
      lastWordIndex: token.wordIndex,
      lastWord: token.text,
      wordsAttempted: token.wordIndex + 1,
      zeroWordsReached: false
    });
  };

  const setZeroWordsReached = () => {
    if (!standardTimingValid || response.timerInterrupted === true) return;
    onResponseChange({
      accurate: null,
      accuracyJudgedAt: "",
      accuracyJudgmentSource: "not_applicable_zero_words",
      errors: 0,
      lastWord: "",
      lastWordIndex: -1,
      passageAccurate: null,
      selfCorrections: 0,
      wordsAttempted: 0,
      zeroWordsReached: true
    });
  };

  const updateProsody = (dimension, rating) => {
    if (!timingEvidenceReady) return;
    const nextProsody = {
      ...prosody,
      [dimension]: Number(rating)
    };
    const ratings = PROSODY_DIMENSIONS
      .map(row => Number(nextProsody[row.key]))
      .filter(value => value >= 1 && value <= 4);
    onResponseChange({
      prosody: nextProsody,
      prosodyRating: ratings.length === PROSODY_DIMENSIONS.length
        ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(2))
        : null
    });
  };

  const setAccuracyJudgment = value => {
    if (!timingEvidenceReady || zeroWordsReached) return;
    const accurate = value === "accurate";
    onResponseChange({
      accurate,
      passageAccurate: accurate,
      accuracyJudgmentSource: "teacher",
      accuracyJudgedAt: new Date().toISOString()
    });
  };

  return (
    <div className="el-benchmark-fluency-layout">
      <section className="el-benchmark-passage-panel" aria-labelledby="el-benchmark-passage-title">
        <div className="el-benchmark-passage-header">
          <div>
            <span>Connected-text reading</span>
            <h3 id="el-benchmark-passage-title">{passage.title || "Fluency passage"}</h3>
          </div>
          <strong>{passage.wordCount || wordTokens.length} words</strong>
        </div>

        <details className="el-benchmark-clean-passage">
          <summary>Open clean student passage</summary>
          <div className="el-benchmark-clean-passage-actions">
            <span>Student-facing copy</span>
            <button
              className="el-benchmark-button secondary compact"
              disabled={response.timerStatus === "running"}
              onClick={() => window.print()}
              title={response.timerStatus === "running" ? "Finish or interrupt timing before printing." : undefined}
              type="button"
            >
              Print clean passage
            </button>
          </div>
          <article className="el-benchmark-clean-passage-sheet">
            <h1>{passage.title || "Fluency passage"}</h1>
            <p>{passage.text || passage.passage || ""}</p>
            <footer className="el-benchmark-clean-passage-disclaimer">
              Teacher note — not part of the timed passage. LiteracyPath EL-aligned provisional form · not an official EL Education benchmark.
            </footer>
          </article>
        </details>

        <FluencyTimer
          onFinishEarly={actualElapsedSeconds => {
            const finalToken = wordTokens.at(-1);
            onResponseChange({
              elapsedSeconds: actualElapsedSeconds,
              finishedEarly: true,
              lastWord: finalToken?.text || "",
              lastWordIndex: finalToken?.wordIndex ?? passageWordCount - 1,
              passageWordCount,
              timerStatus: "finished_early",
              timerInterrupted: false,
              interruptionReason: "",
              wordsAttempted: passageWordCount,
              zeroWordsReached: false
            });
          }}
          onResponseChange={onResponseChange}
          response={response}
        />

        <p className="el-benchmark-passage-help" id="el-benchmark-token-help">
          Select the last word reached when the timer ends. Words through that point will be marked as attempted.
        </p>
        <button
          aria-pressed={zeroWordsReached}
          className="el-benchmark-zero-words"
          disabled={!standardTimingValid || response.timerInterrupted === true}
          onClick={setZeroWordsReached}
          type="button"
        >
          <strong>No words reached (0)</strong>
          <small>Use only when the full minute ends before the student reads the first word.</small>
        </button>
        <div className="el-benchmark-tokenized-passage" aria-describedby="el-benchmark-token-help">
          {tokens.map(token => token.isWord ? (
            <button
              aria-label={`Mark ${token.text} as the last word reached, word ${token.wordIndex + 1}`}
              aria-pressed={lastWordIndex === token.wordIndex}
              className={token.wordIndex <= lastWordIndex ? "reached" : ""}
              disabled={!standardTimingValid || response.timerInterrupted === true}
              key={token.id}
              onClick={() => setLastWord(token)}
              type="button"
            >
              {token.text}
            </button>
          ) : (
            <span aria-hidden="true" key={token.id}>{token.text}</span>
          ))}
        </div>

        <div className="el-benchmark-last-word" aria-live="polite">
          {zeroWordsReached
            ? "No words reached recorded (0 words attempted)"
            : lastWordIndex >= 0
            ? `Last word: ${response.lastWord || wordTokens[lastWordIndex]?.text || "recorded"} (${lastWordIndex + 1} words attempted)`
            : "No last word selected yet"}
        </div>
      </section>

      <section className="el-benchmark-fluency-scoring" aria-label="Fluency scoring">
        <div className="el-benchmark-number-grid">
          <label className="el-benchmark-control">
            <span>Uncorrected errors</span>
            <input
              inputMode="numeric"
              max={response.wordsAttempted || passageWordCount}
              min="0"
              disabled={!timingEvidenceReady || zeroWordsReached}
              onChange={event => onResponseChange({
                errors: event.target.value === "" ? null : Math.max(0, Number(event.target.value))
              })}
              type="number"
              step="1"
              value={response.errors ?? ""}
            />
            <small>Do not count self-corrections here.</small>
          </label>
          <label className="el-benchmark-control">
            <span>Self-corrections</span>
            <input
              inputMode="numeric"
              max={response.wordsAttempted || passageWordCount}
              min="0"
              disabled={!timingEvidenceReady || zeroWordsReached}
              onChange={event => onResponseChange({
                selfCorrections: event.target.value === "" ? null : Math.max(0, Number(event.target.value))
              })}
              type="number"
              step="1"
              value={response.selfCorrections ?? ""}
            />
          </label>
        </div>

        {response.status !== "not_scorable" && timingEvidenceReady && !zeroWordsReached && (
          <AssessmentStatusButtons
            legend="Teacher accuracy judgment"
            onChange={setAccuracyJudgment}
            options={[
              {
                value: "accurate",
                label: "Accurate for this route",
                help: "Continue when the timed read gives adequate evidence",
                tone: "positive"
              },
              {
                value: "not_accurate",
                label: "Not accurate yet",
                help: "Stop after this passage when the timed read is not yet adequate",
                tone: "warning"
              }
            ]}
            value={accuracyJudgment === true ? "accurate" : accuracyJudgment === false ? "not_accurate" : ""}
          />
        )}

        {response.status !== "not_scorable" && zeroWordsReached && (
          <p className="el-benchmark-accuracy-na">
            <strong>Accuracy: N/A</strong>
            No words were read. The completed full-minute result is recorded as 0 WCPM.
          </p>
        )}

        <p className="el-benchmark-judgment-note">
          {timingEvidenceReady
            ? "Use teacher judgment from this one-minute read. LiteracyPath does not apply an invented accuracy percentage threshold."
            : "Accuracy choices unlock only after a continuous full minute or a recorded full-passage early finish."}
        </p>

        {finishEarlyTimingValid && (
          <p className="el-benchmark-finish-early-note">
            Full passage finished in {elapsedSeconds} seconds. Accuracy evidence is retained, but WCPM is withheld and never extrapolated.
          </p>
        )}

        <fieldset className="el-benchmark-fieldset el-benchmark-prosody">
          <legend>Prosody ratings (optional)</legend>
          <p className="el-benchmark-field-help">Supplement the timed score with any useful 1-4 observations.</p>
          <div className="el-benchmark-prosody-grid">
            {PROSODY_DIMENSIONS.map(dimension => (
              <label className="el-benchmark-control" key={dimension.key}>
                <span>{dimension.label}</span>
                <select
                  disabled={!timingEvidenceReady}
                  onChange={event => updateProsody(dimension.key, event.target.value)}
                  value={prosody[dimension.key] || ""}
                >
                  <option value="">Choose 1-4</option>
                  {[1, 2, 3, 4].map(rating => (
                    <option key={rating} value={rating}>{rating} - {PROSODY_LABELS[rating]}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </fieldset>

        <button
          aria-pressed={response.status === "not_scorable"}
          className="el-benchmark-not-scorable-toggle"
          disabled={response.timerStatus === "running"}
          onClick={() => setShowNotScorableReason(true)}
          type="button"
        >
          {response.status === "not_scorable" ? "Review not-scorable reason" : "Mark passage not scorable"}
        </button>

        <NotScorableSummary response={response} />
        {showNotScorableReason && (
          <NotScorableReasonPanel
            onCancel={() => setShowNotScorableReason(false)}
            onClear={() => {
              setShowNotScorableReason(false);
              onResponseChange({
                status: "not_administered",
                isCorrect: null,
                accurate: null,
                passageAccurate: null,
                notScorableReason: "",
                notScorableNote: ""
              });
            }}
            onConfirm={(reason, note) => {
              setShowNotScorableReason(false);
              onResponseChange({
                status: "not_scorable",
                isCorrect: null,
                accurate: null,
                passageAccurate: null,
                notScorableReason: reason,
                notScorableNote: note
              });
            }}
            response={response}
          />
        )}

        {response.status !== "not_scorable" && !timingEvidenceReady && (
          <p className="el-benchmark-inline-note">
            Record exactly 60 seconds, or use the explicit early-finish action when the full passage is completed sooner.
          </p>
        )}
        {response.status !== "not_scorable" && timingEvidenceReady && !countValidation.wordsAttemptedValid && (
          <p className="el-benchmark-inline-note">Choose a last word reached, or explicitly record No words reached (0).</p>
        )}
        {response.status !== "not_scorable" && timingEvidenceReady && countValidation.wordsAttemptedValid && (!countValidation.errorsValid || !countValidation.selfCorrectionsValid) && (
          <p className="el-benchmark-inline-note">{zeroWordsReached
            ? "For No words reached (0), errors and self-corrections must both be 0."
            : "Errors and self-corrections must be whole numbers from zero through words attempted."}</p>
        )}
        {response.status !== "not_scorable" && timingEvidenceReady && countValidation.errorsValid && countValidation.selfCorrectionsValid && !countValidation.combinedCountsValid && (
          <p className="el-benchmark-inline-note">Errors plus self-corrections cannot exceed the number of words attempted.</p>
        )}
        {response.status !== "not_scorable" && timingEvidenceReady && !zeroWordsReached && typeof accuracyJudgment !== "boolean" && (
          <p className="el-benchmark-inline-note">Record the teacher accuracy judgment before reviewing the passage route.</p>
        )}
        {response.status !== "not_scorable" && timingEvidenceReady && zeroWordsReached && accuracyJudgment !== null && (
          <p className="el-benchmark-inline-note">Accuracy must remain N/A when no words were reached.</p>
        )}
      </section>
    </div>
  );
}

function ItemPanel({ kind, plan, item, itemNumber, itemCount, response, onResponseChange }) {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [item.id]);

  const label = item.strand || item.task || item.bandId || getMicrophaseLabel(plan, item);
  const decodingWord = item.displayWord || item.targetWord || item.word || "";
  const isFluency = kind === ASSESSMENT_KINDS.FLUENCY;

  return (
    <article className="el-benchmark-item-card">
      <header className="el-benchmark-item-header">
        <div>
          <span>{label || `Item ${itemNumber}`}</span>
          <h2 ref={headingRef} tabIndex="-1">
            {isFluency ? "Record the one-minute read" : `Item ${itemNumber} of ${itemCount}`}
          </h2>
        </div>
        <span className="el-benchmark-route-label">{getMicrophaseLabel(plan, item)}</span>
      </header>

      {!isFluency && kind !== ASSESSMENT_KINDS.ENCODING && (
        <section className="el-benchmark-prompt-panel" aria-label="Teacher prompt">
          <span>Teacher prompt</span>
          <p>{getPrompt(item)}</p>
          {item.sentence && <small>Context sentence: {item.sentence}</small>}
        </section>
      )}

      {kind === ASSESSMENT_KINDS.ENCODING && <ProtectedEncodingPrompt item={item} />}

      {kind === ASSESSMENT_KINDS.DECODING && (
        <div className="el-benchmark-word-display" aria-label={`Word to read: ${decodingWord}`}>
          {decodingWord}
        </div>
      )}

      {kind === ASSESSMENT_KINDS.PHONOLOGICAL_AWARENESS && (
        <PhonologicalAwarenessPanel
          item={item}
          onResponseChange={onResponseChange}
          response={response}
        />
      )}
      {kind === ASSESSMENT_KINDS.ENCODING && (
        <EncodingPanel
          item={item}
          onResponseChange={onResponseChange}
          response={response}
        />
      )}
      {kind === ASSESSMENT_KINDS.DECODING && (
        <DecodingPanel
          item={item}
          onResponseChange={onResponseChange}
          response={response}
        />
      )}
      {kind === ASSESSMENT_KINDS.FLUENCY && (
        <FluencyPanel
          item={item}
          onResponseChange={onResponseChange}
          plan={plan}
          response={response}
        />
      )}
    </article>
  );
}

function DecodingBandDecision({
  band,
  bandIndex,
  bands,
  continueEvidence,
  items,
  responses,
  stopRule,
  stopEvidence,
  onConfirmStop,
  onContinue,
  onUndoStop
}) {
  const [showOverride, setShowOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  if (!band) return null;

  const {
    automaticCount,
    bandComplete,
    denominator,
    notScorableCount,
    stopRuleMet,
    threshold
  } = getDecodingBandMetrics(band, items, responses, stopRule);
  const nextBand = bands[bandIndex + 1] || null;
  const isConfirmedBand = Boolean(stopEvidence?.confirmed && stopEvidence.bandId === band.id);
  const hasContinueDecision = continueEvidence?.action === "continue";
  const laterIndexes = bands.slice(bandIndex + 1).flatMap(row => row.indexes);
  const laterHasEvidence = laterIndexes.some(index => {
    const itemId = getItemId(items[index], index, ASSESSMENT_KINDS.DECODING);
    const response = responses[itemId] || {};
    return hasResponseContent(response) && response.routeSkipReason !== "decoding_stop_rule";
  });

  if (!bandComplete && !isConfirmedBand) return null;

  return (
    <section className="el-benchmark-band-decision" aria-labelledby="el-benchmark-band-decision-title">
      <div className="el-benchmark-band-result">
        <span>Completed decoding band</span>
        <h3 id="el-benchmark-band-decision-title">{band.label}</h3>
        <strong>{automaticCount} of {denominator} automatic</strong>
        <small>Automaticity is a teacher observation. No seconds-based cutoff is applied.</small>
      </div>

      {isConfirmedBand ? (
        <div className="el-benchmark-band-message stop-confirmed">
          <strong>Stopping evidence saved</strong>
          <p>Later planned words are marked not administered and are not counted as incorrect.</p>
          <button className="el-benchmark-button secondary compact" onClick={onUndoStop} type="button">
            Undo stop and continue
          </button>
        </div>
      ) : hasContinueDecision ? (
        <div className="el-benchmark-band-message continue">
          <strong>Continue decision saved</strong>
          <p>
            {continueEvidence.reason === "teacher_override_below_threshold"
              ? `Teacher override: ${continueEvidence.overrideReason}`
              : "The completed band has been reviewed and the route may continue."}
          </p>
          {nextBand && (
            <button className="el-benchmark-button primary compact" onClick={() => onContinue(nextBand.indexes[0])} type="button">
              Start {nextBand.label}
            </button>
          )}
        </div>
      ) : notScorableCount > 0 ? (
        <div className="el-benchmark-band-message caution">
          <strong>Stopping rule cannot be confirmed</strong>
          <p>{notScorableCount} word{notScorableCount === 1 ? " is" : "s are"} not scorable, so this is not a complete eight-word automaticity result.</p>
          {nextBand && (
            <button
              className="el-benchmark-button primary compact"
              onClick={() => onContinue(nextBand.indexes[0], {
                automaticCount,
                denominator,
                notScorableCount,
                reason: "not_scorable_in_band"
              })}
              type="button"
            >
              Continue to next band
            </button>
          )}
        </div>
      ) : stopRuleMet ? (
        <div className="el-benchmark-band-message stopping">
          <strong>Stopping threshold reached</strong>
          <p>{threshold} or fewer automatic words is stopping evidence for this completed band.</p>
          {laterHasEvidence ? (
            <p className="el-benchmark-band-warning">Later items already contain evidence, so confirming a stop would risk erasing real responses. Record an override to retain that evidence and continue.</p>
          ) : nextBand ? (
            <button className="el-benchmark-button warning compact" onClick={() => onConfirmStop({ automaticCount, denominator })} type="button">
              Confirm stop after this band
            </button>
          ) : (
            <p>This is the final planned band. No later items need to be marked unadministered.</p>
          )}
          {nextBand && !showOverride && (
            <button className="el-benchmark-button secondary compact" onClick={() => setShowOverride(true)} type="button">
              Continue with teacher override
            </button>
          )}
          {nextBand && showOverride && (
            <form
              className="el-benchmark-override-form"
              onSubmit={event => {
                event.preventDefault();
                const reason = overrideReason.trim();
                if (!reason) return;
                onContinue(nextBand.indexes[0], {
                  automaticCount,
                  denominator,
                  notScorableCount,
                  overrideReason: reason,
                  reason: "teacher_override_below_threshold"
                });
              }}
            >
              <label className="el-benchmark-control">
                <span>Reason for continuing</span>
                <textarea
                  onChange={event => setOverrideReason(event.target.value)}
                  placeholder="Record why more diagnostic evidence is needed"
                  required
                  rows="2"
                  value={overrideReason}
                />
              </label>
              <div className="el-benchmark-button-row">
                <button className="el-benchmark-button primary compact" disabled={!overrideReason.trim()} type="submit">
                  Save override and continue
                </button>
                <button className="el-benchmark-button ghost compact" onClick={() => setShowOverride(false)} type="button">
                  Cancel override
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="el-benchmark-band-message continue">
          <strong>{nextBand ? "Continue to the next band" : "Highest planned band complete"}</strong>
          <p>{automaticCount} automatic words is above the stopping threshold for this band.</p>
          {nextBand && (
            <button
              className="el-benchmark-button primary compact"
              onClick={() => onContinue(nextBand.indexes[0], {
                automaticCount,
                denominator,
                notScorableCount,
                reason: "automatic_count_above_threshold"
              })}
              type="button"
            >
              Start {nextBand.label}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function FluencyPassageDecision({
  continueEvidence,
  index,
  item,
  items,
  laterHasEvidence,
  onConfirmStop,
  onContinue,
  onUndoStop,
  response,
  stopEvidence
}) {
  if (!isResponseComplete(ASSESSMENT_KINDS.FLUENCY, response, item)) return null;

  const itemId = getItemId(item, index, ASSESSMENT_KINDS.FLUENCY);
  const nextItem = items[index + 1] || null;
  const nextLabel = nextItem?.microphaseLabel || humanize(nextItem?.microphase || nextItem?.bandId) || "next passage";
  const passageLabel = item.microphaseLabel || humanize(item.microphase || item.bandId) || `Passage ${index + 1}`;
  const accuracyJudgment = getPassageAccuracyJudgment(response);
  const zeroWordsReached = response.zeroWordsReached === true;
  const isConfirmedStop = Boolean(stopEvidence?.confirmed && stopEvidence.passageId === itemId);
  const hasContinueDecision = continueEvidence?.action === "continue";

  return (
    <section className="el-benchmark-band-decision el-benchmark-fluency-decision" aria-labelledby="el-benchmark-fluency-decision-title">
      <div className="el-benchmark-band-result">
        <span>{response.finishedEarly ? "Completed passage before 60 seconds" : "Completed passage"}</span>
        <h3 id="el-benchmark-fluency-decision-title">{passageLabel}</h3>
        <strong>
          {response.status === "not_scorable"
            ? "Not scorable"
            : zeroWordsReached
              ? "0 WCPM · Accuracy N/A"
            : accuracyJudgment
              ? "Accurate"
              : "Not accurate yet"}
        </strong>
        <small>{zeroWordsReached
          ? "No words were reached during the completed full minute."
          : response.finishedEarly
          ? "Full-text accuracy evidence is retained, but WCPM is unavailable for this early finish."
          : "Route decisions use explicit teacher judgment, not an accuracy percentage cutoff."}</small>
      </div>

      {isConfirmedStop ? (
        <div className="el-benchmark-band-message stop-confirmed">
          <strong>Fluency stop evidence saved</strong>
          <p>Later passages are marked not administered and are not counted as incorrect.</p>
          <button className="el-benchmark-button secondary compact" onClick={onUndoStop} type="button">
            Undo fluency stop
          </button>
        </div>
      ) : accuracyJudgment === false || zeroWordsReached ? (
        <div className="el-benchmark-band-message stopping">
          <strong>{zeroWordsReached ? "No words reached indicates a route stop" : "Teacher judgment indicates a route stop"}</strong>
          <p>{zeroWordsReached
            ? "Confirm the audited 0-word full-minute result as the stopping point. Accuracy remains N/A."
            : "Confirm this first not-accurate passage as the stopping point."}</p>
          {laterHasEvidence && (
            <p className="el-benchmark-band-warning">Later passages already contain administered evidence. Review that evidence before changing this earlier route decision.</p>
          )}
          <button
            className="el-benchmark-button warning compact"
            disabled={laterHasEvidence}
            onClick={onConfirmStop}
            type="button"
          >
            {zeroWordsReached ? "Confirm no-words route stop" : "Confirm teacher-judgment stop"}
          </button>
        </div>
      ) : hasContinueDecision ? (
        <div className="el-benchmark-band-message continue">
          <strong>Continue decision saved</strong>
          <p>{continueEvidence.reason === "passage_not_scorable" ? "The not-scorable passage was reviewed." : "The accurate passage was reviewed."}</p>
          {nextItem && (
            <button className="el-benchmark-button primary compact" onClick={() => onContinue(index + 1)} type="button">
              Start {nextLabel}
            </button>
          )}
        </div>
      ) : nextItem ? (
        <div className={`el-benchmark-band-message ${response.status === "not_scorable" ? "caution" : "continue"}`}>
          <strong>{response.status === "not_scorable" ? "Review before continuing" : "Accurate passage recorded"}</strong>
          <p>{response.status === "not_scorable"
            ? "This passage does not provide an accuracy judgment. Continue only when another passage is appropriate."
            : "Explicitly continue to administer the next planned microphase passage."}</p>
          <button
            className="el-benchmark-button primary compact"
            onClick={() => onContinue(index + 1, response.status === "not_scorable" ? "passage_not_scorable" : "teacher_judgment_accurate")}
            type="button"
          >
            Continue to {nextLabel}
          </button>
        </div>
      ) : (
        <div className="el-benchmark-band-message continue">
          <strong>Highest planned passage complete</strong>
          <p>The final passage in this provisional route has been reviewed.</p>
        </div>
      )}
    </section>
  );
}

function RouteSummary({
  plan,
  session,
  items,
  responses,
  kind,
  currentIndex,
  navigationLocked,
  isItemNavigationAllowed = () => true,
  navigationLockMessage = "Review the completed decoding band before moving ahead",
  onSelectItem
}) {
  const administeredCount = items.filter((item, index) => {
    const itemId = getItemId(item, index, kind);
    const response = responses[itemId] || {};
    return isResponseComplete(kind, response, item) && !isNotScorable(response);
  }).length;
  const notScorableCount = items.filter((item, index) => {
    const itemId = getItemId(item, index, kind);
    return isNotScorable(responses[itemId]);
  }).length;
  const notAdministeredCount = items.filter((item, index) => {
    const itemId = getItemId(item, index, kind);
    return responses[itemId]?.status === "not_administered";
  }).length;
  const teacherInstructions = toArray(plan.instructions?.teacher);
  const scoringNotes = toArray(plan.instructions?.scoringNotes);

  return (
    <aside className="el-benchmark-route-summary" aria-label="Assessment route and progress">
      <div className="el-benchmark-route-heading">
        <span>Assessment route</span>
        <strong>{plan.route?.microphaseLabel || humanize(plan.route?.selectedStartMicrophase) || "Provisional starting point"}</strong>
        <small>{formatGrade(session.grade)} | {formatWindow(session.window)}</small>
      </div>

      <dl className="el-benchmark-counts">
        <div>
          <dt>Administered</dt>
          <dd>{administeredCount}</dd>
        </div>
        <div>
          <dt>Not scorable</dt>
          <dd>{notScorableCount}</dd>
        </div>
        <div>
          <dt>Unadministered</dt>
          <dd>{notAdministeredCount}</dd>
        </div>
      </dl>

      <div className="el-benchmark-item-navigator" aria-label="Assessment items">
        {items.map((item, index) => {
          const itemId = getItemId(item, index, kind);
          const response = responses[itemId] || {};
          const isComplete = isResponseComplete(kind, response, item);
          const routeLocked = !isItemNavigationAllowed(index);
          const classNames = [
            index === currentIndex ? "current" : "",
            isComplete ? "complete" : "",
            isNotScorable(response) ? "not-scorable" : "",
            response.status === "not_administered" ? "not-administered" : "",
            !isComplete && response.status !== "not_administered" && hasResponseContent(response) ? "partial" : ""
          ].filter(Boolean).join(" ");
          const state = isNotScorable(response)
            ? "not scorable"
            : response.status === "not_administered"
              ? "not administered"
              : isComplete
                ? "recorded"
                : hasResponseContent(response)
                  ? "partial"
                  : "unadministered";

          return (
            <button
              aria-current={index === currentIndex ? "step" : undefined}
              aria-label={`Item ${index + 1}, ${state}${routeLocked ? `, ${navigationLockMessage}` : ""}`}
              className={classNames}
              disabled={(navigationLocked && index !== currentIndex) || routeLocked}
              key={`${itemId}-${index}`}
              onClick={() => onSelectItem(index)}
              title={routeLocked ? navigationLockMessage : undefined}
              type="button"
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      {(teacherInstructions.length > 0 || scoringNotes.length > 0) && (
        <details className="el-benchmark-guidance">
          <summary>Administration guidance</summary>
          {teacherInstructions.length > 0 && (
            <div>
              <strong>Teacher guidance</strong>
              <ul>{teacherInstructions.map((instruction, index) => <li key={`teacher-${index}-${instruction}`}>{instruction}</li>)}</ul>
            </div>
          )}
          {scoringNotes.length > 0 && (
            <div>
              <strong>Scoring notes</strong>
              <ul>{scoringNotes.map((note, index) => <li key={`scoring-${index}-${note}`}>{note}</li>)}</ul>
            </div>
          )}
        </details>
      )}

      <p className="el-benchmark-provisional-note">
        LiteracyPath EL-aligned content and routing are provisional. This is not an official EL Education benchmark form.
      </p>
    </aside>
  );
}

function PlacementConfirmationPanel({
  administrationRange,
  allowedMicrophases,
  assessmentKind,
  confirmedPlacement,
  normalRangeMicrophases,
  onConfirm,
  preview
}) {
  const proposedPlacement = preview?.candidatePlacement || {};
  const proposedMicrophase = getPlacementMicrophase(proposedPlacement);
  const confirmedMicrophase = getPlacementMicrophase(confirmedPlacement);
  const allowedSet = new Set(allowedMicrophases);
  const normalRangeSet = new Set(normalRangeMicrophases || allowedMicrophases);
  const confirmedMicrophaseAllowed = Boolean(confirmedMicrophase && allowedSet.has(confirmedMicrophase));
  const proposedMicrophaseAllowed = Boolean(proposedMicrophase && allowedSet.has(proposedMicrophase));
  const confirmedRationaleRequired = placementRequiresRationale(
    assessmentKind,
    preview,
    confirmedMicrophase,
    proposedMicrophase
  );
  const confirmedPlacementReady = confirmedMicrophaseAllowed && (
    !confirmedRationaleRequired || Boolean(String(confirmedPlacement?.overrideReason || "").trim())
  );
  const [selectedMicrophase, setSelectedMicrophase] = useState(
    confirmedMicrophaseAllowed ? confirmedMicrophase : proposedMicrophaseAllowed ? proposedMicrophase : ""
  );
  const [reason, setReason] = useState(confirmedPlacement?.overrideReason || "");
  const [showEditor, setShowEditor] = useState(!confirmedPlacementReady);

  const selectedOption = EL_DECODING_MICROPHASES.find(row => row.id === selectedMicrophase) || null;
  const proposedOption = EL_DECODING_MICROPHASES.find(row => row.id === proposedMicrophase) || null;
  const inRangeOptions = EL_DECODING_MICROPHASES.filter(option => normalRangeSet.has(option.id));
  const ceilingOptions = EL_DECODING_MICROPHASES.filter(option => allowedSet.has(option.id) && !normalRangeSet.has(option.id));
  const reasonRequired = placementRequiresRationale(assessmentKind, preview, selectedMicrophase, proposedMicrophase);
  const confirmationReady = Boolean(selectedOption && allowedSet.has(selectedOption.id)) && (!reasonRequired || reason.trim());
  const isEncoding = assessmentKind === ASSESSMENT_KINDS.ENCODING;
  const scoreStatus = humanize(preview?.scoreStatus || "unavailable");
  const scoredCount = Number(preview?.scoredCount || 0);
  const reasonLabel = isEncoding
    ? "Teacher rationale for this Encoding-to-Decoding route"
    : !proposedMicrophase
      ? "Reason for selecting a route without a scorer candidate"
      : preview?.scoreStatus !== "scored" || scoredCount <= 0
        ? "Reason for routing from incomplete or unscored evidence"
        : "Reason for changing the scorer proposal";

  return (
    <section className="el-benchmark-placement" aria-labelledby="el-benchmark-placement-title">
      <div className="el-benchmark-placement-heading">
        <span>Required route review</span>
        <h2 id="el-benchmark-placement-title">Confirm the Decoding start band</h2>
        <p>
          This is teacher-confirmed LiteracyPath provisional routing. It is not an official EL Education score or a nationally normed placement.
        </p>
      </div>

      <div className="el-benchmark-placement-evidence">
        <span>{isEncoding ? "Scoring limitation" : "Scorer proposal"}</span>
        <strong>{isEncoding
          ? "No automatic Encoding conversion"
          : proposedOption?.label || "No candidate available"}</strong>
        <p>{isEncoding
          ? "The overview supplies no validated spelling-to-microphase conversion table, so the teacher must select the next Decoding start."
          : proposedPlacement.reason || "Review the recorded decoding evidence and choose the most defensible named band."}</p>
        <small>Preview score status: {scoreStatus} · {scoredCount} scorable item{scoredCount === 1 ? "" : "s"}</small>
        {administrationRange?.label && <small>Normal range: {administrationRange.label}</small>}
      </div>

      {confirmedPlacementReady && !showEditor ? (
        <div className="el-benchmark-placement-confirmed" aria-live="polite">
          <span>Teacher confirmation saved</span>
          <strong>{EL_DECODING_MICROPHASES.find(row => row.id === confirmedMicrophase)?.label || humanize(confirmedMicrophase)}</strong>
          {confirmedPlacement?.overrideReason && <p>Teacher rationale: {confirmedPlacement.overrideReason}</p>}
          <button className="el-benchmark-button secondary compact" onClick={() => setShowEditor(true)} type="button">
            Review or change confirmation
          </button>
        </div>
      ) : (
        <form
          className="el-benchmark-placement-form"
          onSubmit={event => {
            event.preventDefault();
            if (!confirmationReady) return;
            onConfirm({
              selectedMicrophase,
              proposedMicrophase,
              reason: reasonRequired ? reason.trim() : ""
            });
          }}
        >
          {confirmedMicrophase && !confirmedMicrophaseAllowed && (
            <p className="el-benchmark-band-warning">
              The previously saved band is outside this grade and window route. Choose a band from the supported range before completing.
            </p>
          )}
          {confirmedMicrophaseAllowed && confirmedRationaleRequired && !String(confirmedPlacement?.overrideReason || "").trim() && (
            <p className="el-benchmark-band-warning">
              This saved route needs a teacher rationale before the assessment can be completed.
            </p>
          )}
          <label className="el-benchmark-control">
            <span>Teacher-confirmed start band</span>
            <select onChange={event => setSelectedMicrophase(event.target.value)} value={selectedMicrophase}>
              <option value="">Choose a named microphase</option>
              <optgroup label="Grade and window administration range">
                {inRangeOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.label}{Number.isInteger(option.anchorCycle) ? ` (Cycle ${option.anchorCycle} anchor)` : ""}
                  </option>
                ))}
              </optgroup>
              {ceilingOptions.length > 0 && (
                <optgroup label="Exact adjacent scorer ceiling proposal">
                  {ceilingOptions.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.label}{Number.isInteger(option.anchorCycle) ? ` (Cycle ${option.anchorCycle} anchor)` : ""}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>

          {ceilingOptions.length > 0 && (
            <p className="el-benchmark-inline-note">
              The scorer&apos;s exact adjacent ceiling proposal is available because every planned band exceeded the automaticity threshold. No other out-of-range band can be confirmed.
            </p>
          )}

          {reasonRequired && (
            <label className="el-benchmark-control">
              <span>{reasonLabel}</span>
              <textarea
                onChange={event => setReason(event.target.value)}
                placeholder="Record the evidence supporting this alternative"
                required
                rows="2"
                value={reason}
              />
            </label>
          )}

          <div className="el-benchmark-button-row">
            <button className="el-benchmark-button primary" disabled={!confirmationReady} type="submit">
              Confirm provisional route
            </button>
            {confirmedPlacementReady && (
              <button className="el-benchmark-button ghost" onClick={() => setShowEditor(false)} type="button">
                Keep saved confirmation
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}

function isDiscontinueEvidenceComplete(reason, note = "") {
  const normalizedReason = String(reason || "").trim();
  return Boolean(normalizedReason) && (
    normalizedReason !== "other" || Boolean(String(note || "").trim())
  );
}

function DiscontinuePanel({ onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  return (
    <section className="el-benchmark-discontinue" aria-labelledby="el-benchmark-discontinue-title">
      <div>
        <h2 id="el-benchmark-discontinue-title">Discontinue and save</h2>
        <p>Only administered responses will be retained. Unadministered items will not be marked incorrect.</p>
      </div>
      <label className="el-benchmark-control">
        <span>Reason</span>
        <select onChange={event => setReason(event.target.value)} value={reason}>
          <option value="">Choose a reason</option>
          {DISCONTINUE_REASONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <label className="el-benchmark-control">
        <span>Teacher note{reason === "other" ? " (required for Other)" : " (optional)"}</span>
        <textarea
          onChange={event => setNote(event.target.value)}
          placeholder="Add context for the report"
          rows="2"
          value={note}
        />
      </label>
      <div className="el-benchmark-button-row">
        <button className="el-benchmark-button secondary" onClick={onClose} type="button">Continue assessment</button>
        <button
          className="el-benchmark-button danger"
          disabled={!isDiscontinueEvidenceComplete(reason, note)}
          onClick={() => onConfirm(reason, note)}
          type="button"
        >
          Save as discontinued
        </button>
      </div>
    </section>
  );
}

export function ELBenchmarkAssessmentPage({
  session = {},
  draftSaveFailed = false,
  onSessionChange,
  onComplete,
  onSaveAndExit,
  onCancel
}) {
  const [showDiscontinue, setShowDiscontinue] = useState(false);
  const planResult = useMemo(() => getPlanResult({
    assessmentId: session.assessmentId,
    formId: session.formId,
    grade: session.grade,
    startMicrophase: session.startMicrophase,
    window: session.window
  }), [
    session.assessmentId,
    session.formId,
    session.grade,
    session.startMicrophase,
    session.window
  ]);
  const plan = planResult.plan;
  const items = useMemo(() => getPlanItems(plan || {}), [plan]);
  const kind = getAssessmentKind(session.assessmentId, plan || {});
  const responses = useMemo(() => normalizeResponses(session.responses), [session.responses]);
  const requestedIndex = Number(session.currentItemIndex ?? session.itemIndex ?? 0);
  const currentIndex = items.length
    ? Math.min(items.length - 1, Math.max(0, Number.isFinite(requestedIndex) ? requestedIndex : 0))
    : 0;
  const currentItem = items[currentIndex];
  const currentItemId = currentItem ? getItemId(currentItem, currentIndex, kind) : "";
  const currentResponse = currentItemId ? responses[currentItemId] || {} : {};
  const fluencyLaterHasEvidence = kind === ASSESSMENT_KINDS.FLUENCY && items
    .slice(currentIndex + 1)
    .some((item, offset) => {
      const index = currentIndex + offset + 1;
      const itemId = getItemId(item, index, ASSESSMENT_KINDS.FLUENCY);
      const response = responses[itemId] || {};
      return hasResponseContent(response) && response.routeSkipReason !== "fluency_stop_teacher_judgment";
    });
  const timerIsRunning = kind === ASSESSMENT_KINDS.FLUENCY && currentResponse.timerStatus === "running";
  const decodingBands = useMemo(() => (
    kind === ASSESSMENT_KINDS.DECODING ? getDecodingBands(items) : []
  ), [items, kind]);
  const decodingBandDecisions = useMemo(() => (
    normalizeDecodingBandDecisions(session.decodingBandDecisions)
  ), [session.decodingBandDecisions]);
  const fluencyPassageDecisions = useMemo(() => (
    normalizeDecodingBandDecisions(session.fluencyPassageDecisions)
  ), [session.fluencyPassageDecisions]);
  const fluencyStopEvidence = session.fluencyStop || session.fluencyStopEvidence || null;
  const currentBandIndex = decodingBands.findIndex(band => band.indexes.includes(currentIndex));
  const currentBand = currentBandIndex >= 0 ? decodingBands[currentBandIndex] : null;
  const resolvedItems = items.filter((item, index) => {
    const itemId = getItemId(item, index, kind);
    return isItemResolved(kind, responses[itemId], item);
  });
  const fluencyRouteReviewed = kind !== ASSESSMENT_KINDS.FLUENCY || items.every((item, index) => {
    const itemId = getItemId(item, index, ASSESSMENT_KINDS.FLUENCY);
    const response = responses[itemId] || {};
    if (response.status === "not_administered" && response.routeSkipReason === "fluency_stop_teacher_judgment") {
      return true;
    }
    if (!isResponseComplete(ASSESSMENT_KINDS.FLUENCY, response, item)) return false;
    const isLastPassage = index === items.length - 1;
    if (response.zeroWordsReached === true) {
      return Boolean(fluencyStopEvidence?.confirmed && fluencyStopEvidence.passageId === itemId);
    }
    if (getPassageAccuracyJudgment(response) === false) {
      return Boolean(fluencyStopEvidence?.confirmed && fluencyStopEvidence.passageId === itemId);
    }
    return isLastPassage || fluencyPassageDecisions[itemId]?.action === "continue";
  });
  const allItemsComplete = items.length > 0 && resolvedItems.length === items.length && fluencyRouteReviewed;
  const progressPercent = items.length ? Math.round((resolvedItems.length / items.length) * 100) : 0;
  const requiresPlacementConfirmation = [
    ASSESSMENT_KINDS.ENCODING,
    ASSESSMENT_KINDS.DECODING
  ].includes(kind);
  const placementPreview = useMemo(() => {
    if (!requiresPlacementConfirmation || !allItemsComplete) return null;
    try {
      return scoreElBenchmarkSession({
        ...session,
        responses,
        status: "completed",
        administrationStatus: "completed"
      });
    } catch {
      return null;
    }
  }, [allItemsComplete, requiresPlacementConfirmation, responses, session]);
  const confirmedPlacementMicrophase = getPlacementMicrophase(session.confirmedPlacement);
  const proposedPlacementMicrophase = getPlacementMicrophase(placementPreview?.candidatePlacement);
  const placementRangeMicrophases = getAdministrationRangeMicrophases(plan?.route || {});
  const adjacentCeilingProposalAvailable = placementPreview?.scoreStatus === "scored" &&
    Number(placementPreview?.scoredCount || 0) > 0 &&
    isExactAdjacentCeilingProposal(
      kind,
      plan?.route || {},
      proposedPlacementMicrophase
    );
  const placementAllowedMicrophases = adjacentCeilingProposalAvailable
    ? Array.from(new Set([...placementRangeMicrophases, proposedPlacementMicrophase]))
    : placementRangeMicrophases;
  const confirmedPlacementAllowed = Boolean(
    confirmedPlacementMicrophase && placementAllowedMicrophases.includes(confirmedPlacementMicrophase)
  );
  const confirmedPlacementOutsideAllowedRange = Boolean(
    confirmedPlacementMicrophase && !confirmedPlacementAllowed
  );
  const confirmedPlacementNeedsRationale = placementRequiresRationale(
    kind,
    placementPreview,
    confirmedPlacementMicrophase,
    proposedPlacementMicrophase
  );
  const placementConfirmed = !requiresPlacementConfirmation || Boolean(
    confirmedPlacementMicrophase &&
    confirmedPlacementAllowed &&
    session.placementSource === "teacher_confirmation" &&
    !confirmedPlacementOutsideAllowedRange &&
    (!confirmedPlacementNeedsRationale || String(session.confirmedPlacement?.overrideReason || "").trim())
  );
  const canCompleteAssessment = allItemsComplete && placementConfirmed;
  const routeNavigationLockMessage = kind === ASSESSMENT_KINDS.FLUENCY
    ? fluencyStopEvidence?.confirmed
      ? "locked after the confirmed fluency stop"
      : "locked until the current passage route is reviewed"
    : session.decodingStop?.confirmed
      ? "locked after the confirmed decoding stop"
      : "locked until the current decoding band is reviewed";

  const makeSessionSnapshot = useCallback((patch = {}) => ({
    ...session,
    planId: session.planId || plan?.planId || "",
    contentVersion: session.contentVersion || plan?.contentVersion || "",
    formId: session.formId || plan?.formId || "",
    responses,
    ...patch
  }), [plan, responses, session]);

  const emitSession = useCallback((nextSession) => {
    if (typeof onSessionChange === "function") onSessionChange(nextSession);
    return nextSession;
  }, [onSessionChange]);

  const updateCurrentResponse = useCallback((patch) => {
    if (!currentItemId) return;
    const now = new Date().toISOString();
    const rawPrevious = responses[currentItemId] || {};
    const previous = kind === ASSESSMENT_KINDS.DECODING
      ? Object.fromEntries(Object.entries(rawPrevious).filter(([key]) => ![
          "routeSkipReason",
          "stopBandId"
        ].includes(key)))
      : rawPrevious;
    let nextResponses = { ...responses };
    let stopPatch = {};

    if (kind === ASSESSMENT_KINDS.DECODING && currentBandIndex >= 0) {
      const retainedDecisions = Object.fromEntries(Object.entries(decodingBandDecisions).filter(([bandId]) => {
        const bandIndex = decodingBands.findIndex(band => band.id === bandId);
        return bandIndex >= 0 && bandIndex < currentBandIndex;
      }));
      stopPatch.decodingBandDecisions = retainedDecisions;
    }

    if (kind === ASSESSMENT_KINDS.DECODING && session.decodingStop?.confirmed) {
      nextResponses = Object.fromEntries(Object.entries(nextResponses).filter(([, response]) => (
        response?.routeSkipReason !== "decoding_stop_rule"
      )));
      stopPatch = {
        ...stopPatch,
        decodingStop: null,
        stopBandId: "",
        stopReason: "",
        stopEvidence: null
      };
    }

    if (kind === ASSESSMENT_KINDS.FLUENCY) {
      const retainedDecisions = Object.fromEntries(Object.entries(fluencyPassageDecisions).filter(([passageId]) => {
        const passageIndex = items.findIndex((item, index) => (
          getItemId(item, index, ASSESSMENT_KINDS.FLUENCY) === passageId
        ));
        return passageIndex >= 0 && passageIndex < currentIndex;
      }));
      stopPatch.fluencyPassageDecisions = retainedDecisions;

      if (fluencyStopEvidence?.confirmed) {
        nextResponses = Object.fromEntries(Object.entries(nextResponses).filter(([, response]) => (
          response?.routeSkipReason !== "fluency_stop_teacher_judgment"
        )));
        stopPatch.fluencyStop = null;
        stopPatch.fluencyStopEvidence = null;
        stopPatch.fluencyStopReason = "";
      }
    }

    if (
      [ASSESSMENT_KINDS.ENCODING, ASSESSMENT_KINDS.DECODING].includes(kind) &&
      session.confirmedPlacement
    ) {
      stopPatch.confirmedPlacement = null;
      stopPatch.placementSource = "";
      stopPatch.placementConfirmedAt = "";
    }

    let nextResponse = {
      ...previous,
      itemId: currentItemId,
      assessmentId: session.assessmentId || plan?.assessmentId || "",
      administeredAt: previous.administeredAt || now,
      ...patch,
      updatedAt: now
    };

    if (kind === ASSESSMENT_KINDS.FLUENCY && nextResponse.status !== "not_scorable") {
      nextResponse = {
        ...nextResponse,
        status: isResponseComplete(ASSESSMENT_KINDS.FLUENCY, nextResponse, currentItem)
          ? "recorded"
          : "not_administered"
      };
    }

    emitSession(makeSessionSnapshot({
      status: ["completed", "discontinued"].includes(session.status) ? session.status : "in_progress",
      startedAt: session.startedAt || now,
      updatedAt: now,
      ...stopPatch,
      responses: {
        ...nextResponses,
        [currentItemId]: nextResponse
      }
    }));
  }, [currentBandIndex, currentIndex, currentItem, currentItemId, decodingBandDecisions, decodingBands, emitSession, fluencyPassageDecisions, fluencyStopEvidence?.confirmed, items, kind, makeSessionSnapshot, plan, responses, session.assessmentId, session.confirmedPlacement, session.decodingStop?.confirmed, session.startedAt, session.status]);

  const isItemNavigationAllowed = useCallback((targetIndex) => {
    if (kind === ASSESSMENT_KINDS.FLUENCY) {
      if (targetIndex <= currentIndex) return true;
      for (let passageIndex = currentIndex; passageIndex < targetIndex; passageIndex += 1) {
        const passageId = getItemId(items[passageIndex], passageIndex, ASSESSMENT_KINDS.FLUENCY);
        if (fluencyStopEvidence?.confirmed && fluencyStopEvidence.passageId === passageId) return false;
        if (fluencyPassageDecisions[passageId]?.action !== "continue") return false;
      }
      return true;
    }

    if (kind !== ASSESSMENT_KINDS.DECODING || currentBandIndex < 0) return true;

    const targetBandIndex = decodingBands.findIndex(band => band.indexes.includes(targetIndex));
    if (targetBandIndex < 0 || targetBandIndex <= currentBandIndex) return true;

    for (let bandIndex = currentBandIndex; bandIndex < targetBandIndex; bandIndex += 1) {
      const band = decodingBands[bandIndex];
      if (session.decodingStop?.confirmed && session.decodingStop.bandId === band.id) return false;
      if (decodingBandDecisions[band.id]?.action !== "continue") return false;
    }

    return true;
  }, [currentBandIndex, currentIndex, decodingBandDecisions, decodingBands, fluencyPassageDecisions, fluencyStopEvidence, items, kind, session.decodingStop]);

  const selectItem = useCallback((index) => {
    if (!items.length || timerIsRunning || !isItemNavigationAllowed(index)) return;
    const safeIndex = Math.min(items.length - 1, Math.max(0, index));
    emitSession(makeSessionSnapshot({
      currentItemIndex: safeIndex,
      itemIndex: safeIndex,
      updatedAt: new Date().toISOString()
    }));
  }, [emitSession, isItemNavigationAllowed, items.length, makeSessionSnapshot, timerIsRunning]);

  const savePartialAndExit = () => {
    if (timerIsRunning) return;
    const now = new Date().toISOString();
    const nextSession = emitSession(makeSessionSnapshot({
      status: "partial",
      savedAt: now,
      updatedAt: now
    }));
    if (typeof onSaveAndExit === "function") onSaveAndExit(nextSession);
  };

  const discontinueAndExit = (reason, note) => {
    if (timerIsRunning || !isDiscontinueEvidenceComplete(reason, note)) return;
    const now = new Date().toISOString();
    const nextSession = emitSession(makeSessionSnapshot({
      status: "discontinued",
      discontinuedAt: now,
      discontinueReason: reason,
      discontinueNote: note.trim(),
      updatedAt: now
    }));
    if (typeof onSaveAndExit === "function") onSaveAndExit(nextSession);
  };

  const confirmPlacement = ({ selectedMicrophase, proposedMicrophase, reason }) => {
    const selected = EL_DECODING_MICROPHASES.find(row => row.id === selectedMicrophase);
    if (!selected) return;
    if (!placementAllowedMicrophases.includes(selectedMicrophase)) return;
    const changesProposal = Boolean(proposedMicrophase && proposedMicrophase !== selectedMicrophase);
    const outsideAdministrationRange = Boolean(
      placementRangeMicrophases.length && !placementRangeMicrophases.includes(selectedMicrophase)
    );
    const adjacentCeilingProposal = placementPreview?.scoreStatus === "scored" &&
      Number(placementPreview?.scoredCount || 0) > 0 &&
      isExactAdjacentCeilingProposal(
        kind,
        plan.route || {},
        proposedMicrophase,
        selectedMicrophase
      );
    if (outsideAdministrationRange && !adjacentCeilingProposal) return;
    const reasonRequired = placementRequiresRationale(
      kind,
      placementPreview,
      selectedMicrophase,
      proposedMicrophase
    );
    const overrideReason = reasonRequired ? String(reason || "").trim() : "";
    if (reasonRequired && !overrideReason) return;

    const now = new Date().toISOString();
    const confirmedPlacement = {
      framework: "LiteracyPath provisional",
      isProvisional: true,
      microphase: selected.id,
      candidateMicrophase: selected.id,
      label: selected.label,
      anchorCycle: selected.anchorCycle ?? null,
      scorerProposedMicrophase: proposedMicrophase || null,
      changedFromScorerProposal: changesProposal,
      outsideAdministrationRange,
      adjacentCeilingProposal,
      administrationRange: plan.route?.administrationRange || null,
      overrideReason,
      previewScoreStatus: placementPreview?.scoreStatus || "",
      previewScoredCount: Number(placementPreview?.scoredCount || 0),
      reason: overrideReason || (
        proposedMicrophase
          ? "teacher_confirmed_scorer_candidate"
          : "teacher_selected_route_without_conversion_table"
      ),
      sourceAssessmentId: session.assessmentId || plan.assessmentId,
      confirmedAt: now
    };

    emitSession(makeSessionSnapshot({
      status: "in_progress",
      updatedAt: now,
      confirmedPlacement,
      placementSource: "teacher_confirmation",
      placementConfirmedAt: now
    }));
  };

  const completeAssessment = () => {
    if (timerIsRunning || !canCompleteAssessment) return;
    const now = new Date().toISOString();
    const nextSession = emitSession(makeSessionSnapshot({
      status: "completed",
      completedAt: now,
      updatedAt: now
    }));
    if (typeof onComplete === "function") onComplete(nextSession);
  };

  const continueFluency = (targetIndex, reason = null) => {
    if (kind !== ASSESSMENT_KINDS.FLUENCY || !Number.isInteger(targetIndex)) return;
    if (!reason) {
      selectItem(targetIndex);
      return;
    }
    if (!isResponseComplete(ASSESSMENT_KINDS.FLUENCY, currentResponse, currentItem)) return;

    const now = new Date().toISOString();
    const evidence = {
      action: "continue",
      passageId: currentItemId,
      passageIndex: currentIndex,
      microphase: currentItem.microphase || currentItem.bandId || "",
      microphaseLabel: currentItem.microphaseLabel || "",
      accurate: getPassageAccuracyJudgment(currentResponse),
      passageAccurate: getPassageAccuracyJudgment(currentResponse),
      reason,
      judgmentSource: "teacher",
      decidedAt: now
    };

    emitSession(makeSessionSnapshot({
      status: "in_progress",
      startedAt: session.startedAt || now,
      updatedAt: now,
      currentItemIndex: targetIndex,
      itemIndex: targetIndex,
      fluencyPassageDecisions: {
        ...fluencyPassageDecisions,
        [currentItemId]: evidence
      }
    }));
  };

  const confirmFluencyStop = () => {
    const zeroWordsStop = currentResponse.zeroWordsReached === true;
    if (
      kind !== ASSESSMENT_KINDS.FLUENCY ||
      !isResponseComplete(ASSESSMENT_KINDS.FLUENCY, currentResponse, currentItem) ||
      (getPassageAccuracyJudgment(currentResponse) !== false && !zeroWordsStop)
    ) return;

    const laterIndexes = items.slice(currentIndex + 1).map((_, offset) => currentIndex + offset + 1);
    const laterHasEvidence = laterIndexes.some(index => {
      const itemId = getItemId(items[index], index, ASSESSMENT_KINDS.FLUENCY);
      const response = responses[itemId] || {};
      return hasResponseContent(response) && response.routeSkipReason !== "fluency_stop_teacher_judgment";
    });
    if (laterHasEvidence) return;

    const now = new Date().toISOString();
    const nextResponses = { ...responses };
    laterIndexes.forEach(index => {
      const itemId = getItemId(items[index], index, ASSESSMENT_KINDS.FLUENCY);
      nextResponses[itemId] = {
        itemId,
        assessmentId: session.assessmentId || plan.assessmentId,
        status: "not_administered",
        isCorrect: null,
        accurate: null,
        passageAccurate: null,
        routeSkipReason: "fluency_stop_teacher_judgment",
        stopPassageId: currentItemId,
        updatedAt: now
      };
    });

    const evidence = {
      confirmed: true,
      passageId: currentItemId,
      passageIndex: currentIndex,
      microphase: currentItem.microphase || currentItem.bandId || "",
      microphaseLabel: currentItem.microphaseLabel || "",
      anchorCycle: currentItem.anchorCycle ?? null,
      accurate: zeroWordsStop ? null : false,
      passageAccurate: zeroWordsStop ? null : false,
      zeroWordsReached: zeroWordsStop,
      criterion: zeroWordsStop ? "zero_words_reached" : "explicit_false",
      metric: zeroWordsStop ? "words_attempted" : plan.administration?.stopRule?.metric || "teacher_accuracy_judgment",
      threshold: null,
      reason: zeroWordsStop ? "zero_words_full_minute" : "teacher_judgment_not_accurate",
      judgmentSource: zeroWordsStop ? "audited_zero_words" : "teacher",
      confirmedAt: now
    };

    emitSession(makeSessionSnapshot({
      status: "in_progress",
      updatedAt: now,
      responses: nextResponses,
      fluencyStop: evidence,
      fluencyStopEvidence: evidence,
      fluencyStopReason: zeroWordsStop ? "zero_words_full_minute" : "teacher_judgment_not_accurate"
    }));
  };

  const undoFluencyStop = () => {
    const now = new Date().toISOString();
    const nextResponses = Object.fromEntries(Object.entries(responses).filter(([, response]) => (
      response?.routeSkipReason !== "fluency_stop_teacher_judgment"
    )));
    emitSession(makeSessionSnapshot({
      status: "in_progress",
      updatedAt: now,
      responses: nextResponses,
      fluencyStop: null,
      fluencyStopEvidence: null,
      fluencyStopReason: ""
    }));
  };

  const continueDecoding = (targetIndex, details = null) => {
    if (!currentBand || !Number.isInteger(targetIndex)) return;
    if (!details) {
      selectItem(targetIndex);
      return;
    }

    const overrideReason = String(details.overrideReason || "").trim();
    if (details.reason === "teacher_override_below_threshold" && !overrideReason) return;

    const now = new Date().toISOString();
    const evidence = {
      action: "continue",
      bandId: currentBand.id,
      bandLabel: currentBand.label,
      microphase: currentBand.microphase,
      automaticCount: Number(details.automaticCount ?? 0),
      denominator: Number(details.denominator ?? currentBand.indexes.length),
      notScorableCount: Number(details.notScorableCount ?? 0),
      operator: plan.administration?.stopRule?.operator || "less_than_or_equal",
      threshold: Number(plan.administration?.stopRule?.threshold ?? 5),
      reason: details.reason,
      overrideReason,
      decidedAt: now
    };

    emitSession(makeSessionSnapshot({
      status: "in_progress",
      startedAt: session.startedAt || now,
      updatedAt: now,
      currentItemIndex: targetIndex,
      itemIndex: targetIndex,
      decodingBandDecisions: {
        ...decodingBandDecisions,
        [currentBand.id]: evidence
      }
    }));
  };

  const confirmDecodingStop = ({ automaticCount, denominator }) => {
    if (!currentBand) return;
    const now = new Date().toISOString();
    const laterIndexes = decodingBands.slice(currentBandIndex + 1).flatMap(band => band.indexes);
    const laterHasEvidence = laterIndexes.some(index => {
      const itemId = getItemId(items[index], index, ASSESSMENT_KINDS.DECODING);
      const response = responses[itemId] || {};
      return hasResponseContent(response) && response.routeSkipReason !== "decoding_stop_rule";
    });
    if (laterHasEvidence) return;

    const nextResponses = { ...responses };
    laterIndexes.forEach(index => {
      const itemId = getItemId(items[index], index, ASSESSMENT_KINDS.DECODING);
      nextResponses[itemId] = {
        itemId,
        assessmentId: session.assessmentId || plan.assessmentId,
        status: "not_administered",
        isCorrect: null,
        automatic: null,
        routeSkipReason: "decoding_stop_rule",
        stopBandId: currentBand.id,
        updatedAt: now
      };
    });

    const evidence = {
      confirmed: true,
      bandId: currentBand.id,
      bandLabel: currentBand.label,
      microphase: currentBand.microphase,
      automaticCount,
      denominator,
      operator: plan.administration?.stopRule?.operator || "less_than_or_equal",
      threshold: Number(plan.administration?.stopRule?.threshold ?? 5),
      reason: "automatic_count_at_or_below_threshold",
      confirmedAt: now
    };

    emitSession(makeSessionSnapshot({
      status: "in_progress",
      updatedAt: now,
      responses: nextResponses,
      decodingStop: evidence,
      stopBandId: currentBand.id,
      stopReason: "automatic_count_at_or_below_threshold",
      stopEvidence: evidence
    }));
  };

  const undoDecodingStop = () => {
    const now = new Date().toISOString();
    const nextResponses = Object.fromEntries(Object.entries(responses).filter(([, response]) => (
      response?.routeSkipReason !== "decoding_stop_rule"
    )));
    emitSession(makeSessionSnapshot({
      status: "in_progress",
      updatedAt: now,
      responses: nextResponses,
      decodingStop: null,
      stopBandId: "",
      stopReason: "",
      stopEvidence: null
    }));
  };

  if (planResult.error || !plan) {
    return (
      <main className="el-benchmark-shell el-benchmark-empty-state" aria-labelledby="el-benchmark-error-title">
        <section>
          <span className="el-benchmark-framework-label">LiteracyPath EL-aligned</span>
          <h1 id="el-benchmark-error-title">Assessment plan unavailable</h1>
          <p>{planResult.error?.message || "This provisional assessment plan could not be loaded."}</p>
          <div className="el-benchmark-button-row">
            <button className="el-benchmark-button secondary" onClick={() => onCancel?.()} type="button">Return</button>
          </div>
        </section>
      </main>
    );
  }

  if (!items.length || !currentItem) {
    return (
      <main className="el-benchmark-shell el-benchmark-empty-state" aria-labelledby="el-benchmark-empty-title">
        <section>
          <span className="el-benchmark-framework-label">LiteracyPath EL-aligned</span>
          <h1 id="el-benchmark-empty-title">No items in this plan</h1>
          <p>The selected grade, window, and starting microphase did not return an assessment form.</p>
          <div className="el-benchmark-button-row">
            <button className="el-benchmark-button secondary" onClick={() => onCancel?.()} type="button">Return</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="el-benchmark-shell" aria-labelledby="el-benchmark-page-title">
      <header className="el-benchmark-topbar">
        <div className="el-benchmark-title-block">
          <span className="el-benchmark-framework-label">LiteracyPath EL-aligned</span>
          <div>
            <h1 id="el-benchmark-page-title">{plan.title || "EL-aligned benchmark"}</h1>
            <span className="el-benchmark-provisional-badge">Provisional content and routing</span>
          </div>
          <p>{getStudentName(session)} | {formatGrade(session.grade)} | {formatWindow(session.window)}</p>
        </div>

        <div className="el-benchmark-header-progress">
          <div>
            <span>Resolved</span>
            <strong>{resolvedItems.length} of {items.length}</strong>
          </div>
          <progress aria-label={`${resolvedItems.length} of ${items.length} items resolved`} max="100" value={progressPercent} />
        </div>

        <div className="el-benchmark-header-actions">
          {draftSaveFailed ? (
            <span className="el-benchmark-draft-save-alert" role="alert">
              Draft could not be saved on this device. Keep this page open and free storage before leaving.
            </span>
          ) : (
            <span className="el-benchmark-autosave-note">Changes save to this draft automatically.</span>
          )}
          <button
            className="el-benchmark-button secondary"
            disabled={timerIsRunning}
            onClick={savePartialAndExit}
            title={timerIsRunning ? "Stop the timer before saving" : undefined}
            type="button"
          >
            Save partial &amp; exit
          </button>
          <button
            className="el-benchmark-button ghost"
            disabled={timerIsRunning || draftSaveFailed}
            onClick={() => onCancel?.()}
            title={timerIsRunning
              ? "Stop the timer before returning"
              : draftSaveFailed
                ? "Free storage or use Save partial & exit before leaving"
                : "Return while keeping this auto-saved draft"}
            type="button"
          >
            Return to assessments
          </button>
        </div>
      </header>

      <div className="el-benchmark-workspace">
        <RouteSummary
          currentIndex={currentIndex}
          isItemNavigationAllowed={isItemNavigationAllowed}
          items={items}
          kind={kind}
          navigationLocked={timerIsRunning}
          navigationLockMessage={routeNavigationLockMessage}
          onSelectItem={selectItem}
          plan={plan}
          responses={responses}
          session={session}
        />

        <section className="el-benchmark-work-area">
          <ItemPanel
            item={currentItem}
            itemCount={items.length}
            itemNumber={currentIndex + 1}
            key={currentItemId}
            kind={kind}
            onResponseChange={updateCurrentResponse}
            plan={plan}
            response={currentResponse}
          />

          {kind === ASSESSMENT_KINDS.DECODING && currentBand && (
            <DecodingBandDecision
              band={currentBand}
              bandIndex={currentBandIndex}
              bands={decodingBands}
              continueEvidence={decodingBandDecisions[currentBand.id]}
              items={items}
              key={currentBand.id}
              onConfirmStop={confirmDecodingStop}
              onContinue={continueDecoding}
              onUndoStop={undoDecodingStop}
              responses={responses}
              stopEvidence={session.decodingStop || session.stopEvidence}
              stopRule={plan.administration?.stopRule}
            />
          )}

          {kind === ASSESSMENT_KINDS.FLUENCY && (
            <FluencyPassageDecision
              continueEvidence={fluencyPassageDecisions[currentItemId]}
              index={currentIndex}
              item={currentItem}
              items={items}
              laterHasEvidence={fluencyLaterHasEvidence}
              onConfirmStop={confirmFluencyStop}
              onContinue={continueFluency}
              onUndoStop={undoFluencyStop}
              response={currentResponse}
              stopEvidence={fluencyStopEvidence}
            />
          )}

          <nav className="el-benchmark-item-actions" aria-label="Item navigation">
            <button
              className="el-benchmark-button secondary"
              disabled={currentIndex === 0 || timerIsRunning}
              onClick={() => selectItem(currentIndex - 1)}
              type="button"
            >
              Previous item
            </button>
            <p aria-live="polite">
              {isResponseComplete(kind, currentResponse, currentItem)
                ? "This item is recorded."
                : hasResponseContent(currentResponse)
                  ? "This item is partially recorded."
                  : "This item is unadministered."}
            </p>
            <button
              className="el-benchmark-button primary"
              disabled={timerIsRunning || currentIndex === items.length - 1 || !isResponseComplete(kind, currentResponse, currentItem) || !isItemNavigationAllowed(currentIndex + 1)}
              onClick={() => selectItem(currentIndex + 1)}
              title={!isItemNavigationAllowed(currentIndex + 1) ? routeNavigationLockMessage : undefined}
              type="button"
            >
              Next item
            </button>
          </nav>

          {requiresPlacementConfirmation && allItemsComplete && (
            <PlacementConfirmationPanel
              administrationRange={plan.route?.administrationRange}
              allowedMicrophases={placementAllowedMicrophases}
              assessmentKind={kind}
              confirmedPlacement={session.confirmedPlacement}
              key={`${kind}-${placementPreview?.candidatePlacement?.candidateMicrophase || "teacher-select"}-${confirmedPlacementMicrophase || "unconfirmed"}-${session.confirmedPlacement?.confirmedAt || "new"}`}
              onConfirm={confirmPlacement}
              normalRangeMicrophases={placementRangeMicrophases}
              preview={placementPreview}
            />
          )}
        </section>
      </div>

      {showDiscontinue && (
        <DiscontinuePanel
          onClose={() => setShowDiscontinue(false)}
          onConfirm={discontinueAndExit}
        />
      )}

      <footer className="el-benchmark-footer">
        <button
          className="el-benchmark-button ghost danger-text"
          disabled={timerIsRunning}
          onClick={() => setShowDiscontinue(show => !show)}
          type="button"
        >
          {showDiscontinue ? "Close discontinue panel" : "Discontinue assessment"}
        </button>
        <p>
          {canCompleteAssessment
            ? "Every planned item is resolved. Review recorded, not-scorable, and stop-rule outcomes before completing."
            : allItemsComplete && requiresPlacementConfirmation
              ? "Assessment evidence is complete. Confirm the provisional Decoding start band before finishing."
            : resolvedItems.length === items.length
              ? "Every item is recorded. Complete the required route or placement review before finishing."
              : `${items.length - resolvedItems.length} item${items.length - resolvedItems.length === 1 ? "" : "s"} remain unadministered or partial.`}
        </p>
        <button
          className="el-benchmark-button primary"
          disabled={timerIsRunning || !canCompleteAssessment}
          onClick={completeAssessment}
          type="button"
        >
          Complete assessment
        </button>
      </footer>
    </main>
  );
}

ELBenchmarkAssessmentPage.getDecodingEvaluationPatch = getDecodingEvaluationPatch;
ELBenchmarkAssessmentPage.getFluencyTimerInterruptionPatch = getFluencyTimerInterruptionPatch;
ELBenchmarkAssessmentPage.getFluencyTimerResetPatch = getFluencyTimerResetPatch;
ELBenchmarkAssessmentPage.isDiscontinueEvidenceComplete = isDiscontinueEvidenceComplete;
