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

const RESPONSE_CAPTURE_MODES = Object.freeze({
  DIRECT_CHOICE: "direct_choice",
  EXACT_TRANSCRIPTION: "exact_transcription",
  QUICK_JUDGMENT: "quick_teacher_judgment"
});

const QUICK_ADMINISTRATION_VERSION = "2026.07.22-quick-v1";

const TERMINAL_SESSION_STATUSES = new Set(["completed", "discontinued"]);

function getTerminalSessionStatus(session = {}) {
  const administrationStatus = String(session.administrationStatus || "").trim();
  const status = String(session.status || "").trim();
  if (TERMINAL_SESSION_STATUSES.has(administrationStatus)) return administrationStatus;
  return TERMINAL_SESSION_STATUSES.has(status) ? status : "";
}

function preserveTerminalSessionStatus(session = {}, snapshot = {}) {
  const terminalStatus = getTerminalSessionStatus(session);
  if (!terminalStatus) return snapshot;
  return {
    ...snapshot,
    status: terminalStatus,
    administrationStatus: terminalStatus,
    ...(terminalStatus === "completed" && session.completedAt
      ? { completedAt: session.completedAt }
      : {}),
    ...(terminalStatus === "discontinued" && session.discontinuedAt
      ? { discontinuedAt: session.discontinuedAt }
      : {})
  };
}

const DISCONTINUE_REASONS = Object.freeze([
  { value: "frustration", label: "Child showed frustration" },
  { value: "independent_level_clear", label: "Independent level was clear" },
  { value: "instructional_level_clear", label: "Instructional level was clear" },
  { value: "letter_knowledge_needed", label: "Letter knowledge needs checking first" },
  { value: "unable_to_continue", label: "Child was unable to continue" },
  { value: "interrupted", label: "Session was interrupted" },
  { value: "other", label: "Other" }
]);

const NOT_SCORABLE_REASONS = Object.freeze([
  { value: "interrupted_or_noisy", label: "Interrupted or too noisy" },
  { value: "student_unwell_or_distressed", label: "Child unwell or distressed" },
  { value: "directions_or_material_issue", label: "Directions or material issue" },
  { value: "response_unreliable", label: "Answer could not be captured reliably" },
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
  { value: "no_response", label: "No answer" },
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

function teacherGuidanceText(value = "") {
  return String(value || "")
    .replace(/\bAdminister orally\b/gi, "Run this aloud")
    .replace(/\bnot administered\b/gi, "not done")
    .replace(/\bunadministered\b/gi, "not done")
    .replace(/\bassessments?\b/gi, match => match.toLowerCase().endsWith("s") ? "checks" : "check")
    .replace(/\bevidence\b/gi, "results")
    .replace(/\blearners?\b/gi, match => match.toLowerCase().endsWith("s") ? "children" : "child")
    .replace(/\bstudents?\b/gi, match => match.toLowerCase().endsWith("s") ? "children" : "child");
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

function hasQuickTeacherJudgment(response = {}) {
  return response.responseCaptureMode === RESPONSE_CAPTURE_MODES.QUICK_JUDGMENT &&
    typeof response.isCorrect === "boolean";
}

function hasAttemptEvidence(kind, response = {}) {
  return Boolean(getExactStudentResponse(kind, response)) || hasQuickTeacherJudgment(response);
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
  if (!hasAttemptEvidence(kind, response)) return false;

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

function placementRequiresRationale(
  kind,
  preview,
  selectedMicrophase,
  proposedMicrophase,
  defaultMicrophase = ""
) {
  const recommendedMicrophase = defaultMicrophase || proposedMicrophase;
  if (!recommendedMicrophase) return true;
  return selectedMicrophase !== recommendedMicrophase;
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
  return session.studentName || session.student?.name || "Selected child";
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
      error: error instanceof Error ? error : new Error("The check could not be loaded.")
    };
  }
}

function getPrompt(item = {}) {
  return item.teacherSay || item.prompt || item.question || item.directions || "Administer this item using the scoring guidance.";
}

function getStartingBandLabel(plan = {}, item = {}) {
  const band = item.microphase
    || item.bandId
    || plan.route?.selectedStartMicrophase
    || plan.route?.defaultStartMicrophase;
  return `${formatWindow(plan.window)} · starting band: ${humanize(band) || "Provisional"}`;
}

function getAdministrationRangeLabel(administrationRange = {}) {
  const start = humanize(administrationRange.startMicrophase);
  const end = humanize(administrationRange.endMicrophase);
  if (start && end && start !== end) return `${start} to ${end}`;
  return start || end || "Provisional range";
}

function getItemTaskHeading(kind, item = {}) {
  if (kind === ASSESSMENT_KINDS.ENCODING) return "Dictated spelling";
  if (kind === ASSESSMENT_KINDS.DECODING) return "Word reading";
  if (kind === ASSESSMENT_KINDS.FLUENCY) return "One-minute oral reading";

  const strand = String(item.strand || "");
  const task = String(item.task || "");
  if (strand === "rhyme" && task === "recognition") return "Rhyme — yes or no?";
  if (strand === "rhyme" && task === "production") return "Rhyme — say a matching word";
  if (strand === "syllable" && task === "blending") return "Blend syllables";
  if (strand === "syllable" && task === "segmentation") return "Segment syllables";
  if (strand === "onset_rime" && task === "blending") return "Blend onset and rime";
  if (strand === "phoneme_isolation") {
    return `Identify the ${task === "initial" ? "first" : task === "final" ? "last" : "middle"} sound`;
  }
  if (strand === "phoneme_blending") return "Blend phonemes";
  if (strand === "phoneme_segmentation") return "Segment phonemes";
  if (strand === "phoneme_manipulation") return "Change one sound";
  return humanize([strand, task].filter(Boolean).join(" ")) || "Oral sound task";
}

function getItemTeacherDirective(kind, item = {}) {
  const teacherSay = String(item.teacherSay || item.prompt || "").trim();
  if (kind === ASSESSMENT_KINDS.ENCODING) {
    const word = item.targetWord || item.word || "target word";
    return `Dictate aloud — word, sentence, word. The child writes only “${word}” on paper.`;
  }
  if (kind === ASSESSMENT_KINDS.DECODING) {
    return "Ask the child to read the word aloud. Do not name it, sound it out, or point to parts of it.";
  }
  if (kind === ASSESSMENT_KINDS.FLUENCY) {
    return "Place the reading copy in front of the child. Start timing on the first spoken word and mark the last word reached at 60 seconds.";
  }
  if (item.strand === "rhyme" && item.task === "recognition") {
    return `Say aloud: “${teacherSay}” Say both words naturally — never show this screen to the child.`;
  }
  return teacherSay
    ? `Say aloud: “${teacherSay}” Listen to the child's oral response.`
    : "Give the oral task exactly as written and listen to the child's answer.";
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

function QuickOutcomeButtons({ legend, options, value, onChoose }) {
  return (
    <fieldset className="el-benchmark-quick-fieldset">
      <legend>{legend}</legend>
      <div className={`el-benchmark-quick-grid choices-${Math.min(options.length, 3)}`}>
        {options.map(option => (
          <button
            aria-pressed={value === option.value}
            className={`el-benchmark-quick-button tone-${option.tone || "neutral"}`}
            key={option.value}
            onClick={() => onChoose(option.value)}
            type="button"
          >
            <span aria-hidden="true" className="el-benchmark-quick-symbol">{option.symbol || "•"}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function getRhymeRecognitionPair(item = {}) {
  const prompt = String(item.teacherSay || item.prompt || "").trim();
  const match = prompt.match(/^Do\s+(.+?)\s+and\s+(.+?)\s+rhyme\??$/i);
  return match ? [match[1].trim(), match[2].trim()] : [];
}

function OptionalDetail({ children, label = "Other or add detail", open = false }) {
  const [userOpen, setUserOpen] = useState(false);

  return (
    <details
      className="el-benchmark-optional-detail"
      onToggle={event => setUserOpen(event.currentTarget.open)}
      open={open || userOpen}
    >
      <summary>{label}</summary>
      <div>{children}</div>
    </details>
  );
}

function NotScorableReasonPanel({ response, onCancel, onClear, onConfirm }) {
  const [reason, setReason] = useState(response.notScorableReason || "");
  const [note, setNote] = useState(response.notScorableNote || "");
  const noteRequired = reason === "other";
  const ready = Boolean(reason) && (!noteRequired || note.trim());

  return (
    <section className="el-benchmark-not-scorable-reason" aria-label="Reason this item cannot be scored">
      <div>
        <strong>Why is this item not scorable?</strong>
        <p>Add a reason so this item is never treated as an incorrect answer.</p>
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

function ExactResponseField({ value = "", onChange, label = "Exact child answer", help = "Record what the child said, including an approximation or no answer." }) {
  return (
    <label className="el-benchmark-control">
      <span>{label}</span>
      <input
        autoComplete="off"
        onChange={event => onChange(event.target.value)}
        placeholder="Enter the answer exactly as heard"
        type="text"
        value={value}
      />
      <small>{help}</small>
    </label>
  );
}

function PhonologicalAwarenessPanel({ item, response, onResponseChange, onQuickScore }) {
  const [showNotScorableReason, setShowNotScorableReason] = useState(
    isNotScorable(response) && !hasNotScorableReason(response)
  );
  const [showOther, setShowOther] = useState(
    response.status === "no_response" || response.status === "not_scorable"
  );
  const [otherResponse, setOtherResponse] = useState(response.responseText || "");
  const expectedAnswers = toArray(item.expectedAnswers || item.acceptedAnswers);
  const normalizedExpected = expectedAnswers.map(normalizeEncodingEntry);
  const rhymePair = item.strand === "rhyme" && item.task === "recognition"
    ? getRhymeRecognitionPair(item)
    : [];
  const isRhymeRecognition = rhymePair.length === 2;
  const currentValue = response.status === "not_scorable"
    ? "other"
    : response.status === "no_response"
      ? "other"
      : isRhymeRecognition && ["yes", "no"].includes(normalizeEncodingEntry(response.responseText))
        ? normalizeEncodingEntry(response.responseText)
        : response.isCorrect === true
          ? "correct"
          : response.isCorrect === false ? "incorrect" : "";
  const auditReset = { notScorableReason: "", notScorableNote: "", teacherOverride: null };

  const recordRhymeChoice = choice => {
    const isCorrect = normalizedExpected.includes(choice);
    onQuickScore({
      ...auditReset,
      status: isCorrect ? "correct" : "incorrect",
      isCorrect,
      evaluation: isCorrect ? "correct" : "not_yet",
      responseText: choice,
      responseCaptureMode: RESPONSE_CAPTURE_MODES.DIRECT_CHOICE
    });
  };

  const recordJudgment = (isCorrect, responseText = "") => {
    const exactResponse = String(responseText || "").trim();
    onQuickScore({
      ...auditReset,
      status: isCorrect ? "correct" : "incorrect",
      isCorrect,
      evaluation: isCorrect ? "correct" : "not_yet",
      responseText: exactResponse,
      responseCaptureMode: exactResponse
        ? RESPONSE_CAPTURE_MODES.EXACT_TRANSCRIPTION
        : RESPONSE_CAPTURE_MODES.QUICK_JUDGMENT
    });
  };

  return (
    <div className="el-benchmark-response-stack el-benchmark-simple-response">
      {isRhymeRecognition && (
        <div className="el-benchmark-rhyme-pair" aria-label={`Teacher words: ${rhymePair.join(" and ")}`}>
          <span>{rhymePair[0]}</span>
          <small>and</small>
          <span>{rhymePair[1]}</span>
          <p>Teacher screen — say both words aloud. Do not show the print to the child.</p>
        </div>
      )}

      <QuickOutcomeButtons
        legend={isRhymeRecognition ? "What did the child answer?" : "Was the spoken answer correct?"}
        onChoose={value => {
          if (value === "other") {
            setShowOther(true);
            return;
          }
          if (isRhymeRecognition) recordRhymeChoice(value);
          else recordJudgment(value === "correct");
        }}
        options={isRhymeRecognition ? [
          { value: "yes", label: "Yes", symbol: "✓", tone: "positive" },
          { value: "no", label: "No", symbol: "×", tone: "negative" },
          { value: "other", label: "Other", symbol: "…", tone: "neutral" }
        ] : [
          { value: "correct", label: "Correct", symbol: "✓", tone: "positive" },
          { value: "incorrect", label: "Not yet", symbol: "×", tone: "negative" },
          { value: "other", label: "Other", symbol: "…", tone: "neutral" }
        ]}
        value={currentValue}
      />

      <OptionalDetail label="Other, no answer, or add what they said" open={showOther || showNotScorableReason}>
        <aside className="el-benchmark-scoring-reference" aria-label="Teacher scoring reference">
          <span>Teacher answer guide</span>
          <strong>{expectedAnswers.join(" or ") || "Use teacher judgment"}</strong>
        </aside>
        <ExactResponseField
          help="Optional. Add this only when the exact response will help instruction."
          onChange={value => {
            setOtherResponse(value);
            onResponseChange({
              responseText: value,
              responseCaptureMode: value.trim()
                ? RESPONSE_CAPTURE_MODES.EXACT_TRANSCRIPTION
                : RESPONSE_CAPTURE_MODES.QUICK_JUDGMENT
            });
          }}
          value={otherResponse}
        />
        <div className="el-benchmark-button-row">
          <button
            className="el-benchmark-button primary"
            disabled={!otherResponse.trim()}
            onClick={() => recordJudgment(true, otherResponse)}
            type="button"
          >
            Record as correct
          </button>
          <button
            className="el-benchmark-button secondary"
            onClick={() => recordJudgment(false, otherResponse)}
            type="button"
          >
            Record as not yet
          </button>
          <button
            className="el-benchmark-button secondary"
            onClick={() => onQuickScore({
              ...auditReset,
              status: "no_response",
              isCorrect: false,
              evaluation: "no_response",
              responseText: "",
              responseCaptureMode: RESPONSE_CAPTURE_MODES.DIRECT_CHOICE
            })}
            type="button"
          >
            No response
          </button>
          <button className="el-benchmark-button ghost" onClick={() => setShowNotScorableReason(true)} type="button">
            Couldn&apos;t score
          </button>
        </div>
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
              onQuickScore({
                status: "not_scorable",
                isCorrect: null,
                evaluation: "not_scorable",
                notScorableReason: reason,
                notScorableNote: note,
                responseText: "",
                responseCaptureMode: RESPONSE_CAPTURE_MODES.DIRECT_CHOICE
              });
            }}
            response={response}
          />
        )}
      </OptionalDetail>
    </div>
  );
}

function EncodingPanel({ item, response, onResponseChange, onQuickScore }) {
  const [showNotScorableReason, setShowNotScorableReason] = useState(
    isNotScorable(response) && !hasNotScorableReason(response)
  );
  const acceptedSpellings = toArray(item.acceptedSpellings || item.expectedAnswers || item.targetWord);
  const plausibleSpellings = toArray(item.plausibleSpellings);
  const errorTags = getErrorTagOptions(ASSESSMENT_KINDS.ENCODING, item);
  const selectedTags = new Set(toArray(response.errorTags));
  const evaluationIssue = getEncodingEvaluationIssue(item, response);
  const currentTranscription = response.transcription !== undefined
    ? response.transcription
    : response.responseText || "";
  const currentValue = ["exact", "plausible", "not_yet"].includes(response.evaluation)
    ? response.evaluation
    : "";
  const auditReset = { notScorableReason: "", notScorableNote: "", teacherOverride: null };

  const recordEvaluation = value => {
    const hasTranscription = Boolean(String(currentTranscription || "").trim());
    const common = {
      ...auditReset,
      responseCaptureMode: hasTranscription
        ? RESPONSE_CAPTURE_MODES.EXACT_TRANSCRIPTION
        : RESPONSE_CAPTURE_MODES.QUICK_JUDGMENT
    };
    if (value === "exact") {
      onQuickScore({ ...common, status: "correct", isCorrect: true, exact: true, plausible: true, evaluation: value, errorTags: [] });
    } else if (value === "plausible") {
      onQuickScore({ ...common, status: "incorrect", isCorrect: false, exact: false, plausible: true, evaluation: value });
    } else {
      onQuickScore({ ...common, status: "incorrect", isCorrect: false, exact: false, plausible: false, evaluation: "not_yet" });
    }
  };

  const toggleTag = tag => {
    const next = new Set(selectedTags);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    onResponseChange({ errorTags: Array.from(next) });
  };

  return (
    <div className="el-benchmark-response-stack el-benchmark-simple-response">
      <QuickOutcomeButtons
        legend="How close was the spelling?"
        onChoose={recordEvaluation}
        options={[
          { value: "exact", label: "Correct spelling", symbol: "✓", tone: "positive" },
          { value: "plausible", label: "Sounds right", symbol: "≈", tone: "warning" },
          { value: "not_yet", label: "Not yet", symbol: "×", tone: "negative" }
        ]}
        value={currentValue}
      />

      <OptionalDetail label="Other or add spelling detail" open={showNotScorableReason || response.status === "no_response"}>
        <div className="el-benchmark-answer-guide" aria-label="Teacher spelling guide">
          <div>
            <span>Correct spelling</span>
            <strong>{acceptedSpellings.join(" or ") || item.targetWord}</strong>
          </div>
          {plausibleSpellings.length > 0 && <p>Examples that may sound right: {plausibleSpellings.join(", ")}</p>}
        </div>

        <label className="el-benchmark-control">
          <span>Child&apos;s spelling (optional)</span>
          <input
            autoComplete="off"
            onChange={event => onResponseChange({
              transcription: event.target.value,
              responseText: event.target.value,
              responseCaptureMode: event.target.value.trim()
                ? RESPONSE_CAPTURE_MODES.EXACT_TRANSCRIPTION
                : RESPONSE_CAPTURE_MODES.QUICK_JUDGMENT,
              teacherOverride: null,
              ...(response.status === "no_response" && event.target.value.trim()
                ? { status: "not_administered", isCorrect: null, plausible: null, evaluation: "" }
                : {})
            })}
            placeholder="Type it only if it will help instruction"
            spellCheck="false"
            type="text"
            value={currentTranscription}
          />
          <small>Optional detail is kept in the report. If it conflicts with the score, correct one before moving on.</small>
        </label>

        {evaluationIssue === "exact_mismatch" && (
          <p className="el-benchmark-inline-note">The typed spelling does not match the correct spelling. Change the outcome or correct the transcription.</p>
        )}
        {evaluationIssue === "exact_match_marked_nonexact" && (
          <p className="el-benchmark-inline-note">The typed spelling matches the answer. Record Correct spelling.</p>
        )}
        {evaluationIssue === "exact_override_conflicts_with_evaluation" && (
          <p className="el-benchmark-inline-note">The restored spelling override conflicts with this outcome. Choose the outcome again to clear it.</p>
        )}

        <div className="el-benchmark-button-row">
          <button
            className="el-benchmark-button secondary"
            onClick={() => onQuickScore({
              ...auditReset,
              status: "no_response",
              isCorrect: false,
              exact: false,
              plausible: false,
              evaluation: "no_response",
              transcription: "",
              responseText: "",
              responseCaptureMode: RESPONSE_CAPTURE_MODES.DIRECT_CHOICE,
              errorTags: []
            })}
            type="button"
          >
            No response
          </button>
          <button className="el-benchmark-button ghost" onClick={() => setShowNotScorableReason(true)} type="button">
            Couldn&apos;t score
          </button>
        </div>

        {currentValue && currentValue !== "exact" && (
          <fieldset className="el-benchmark-fieldset">
            <legend>Error feature (optional)</legend>
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
              onQuickScore({
                status: "not_scorable",
                isCorrect: null,
                plausible: null,
                exact: null,
                evaluation: "not_scorable",
                notScorableReason: reason,
                notScorableNote: note,
                responseCaptureMode: RESPONSE_CAPTURE_MODES.DIRECT_CHOICE,
                errorTags: []
              });
            }}
            response={response}
          />
        )}
      </OptionalDetail>
    </div>
  );
}

function getDecodingEvaluationPatch(value, response = {}, notScorableEvidence = {}) {
  const auditReset = { notScorableReason: "", notScorableNote: "" };

  if (value === "automatic_accurate") {
    return {
      ...auditReset,
      status: "correct",
      isCorrect: true,
      automatic: true,
      selfCorrected: false,
      errorTags: [],
      evaluation: value
    };
  }

  if (value === "accurate_after_sounding") {
    return {
      ...auditReset,
      status: "correct",
      isCorrect: true,
      automatic: false,
      selfCorrected: false,
      errorTags: [],
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

function DecodingPanel({ item, response, onResponseChange, onQuickScore }) {
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
        : response.status === "self_corrected"
          ? "self_corrected"
          : response.status === "correct"
            ? response.automatic === true ? "automatic_accurate" : "accurate_after_sounding"
            : "");
  const evaluationIssue = getDecodingEvaluationIssue(item, response);
  const hasTranscription = Boolean(String(response.responseText || "").trim());

  const recordEvaluation = value => {
    const patch = value === "self_corrected"
      ? {
          ...getDecodingEvaluationPatch("accurate_after_sounding", response),
          status: "self_corrected",
          automatic: false,
          selfCorrected: true,
          errorTags: toArray(response.errorTags).filter(tag => tag !== "no_response"),
          evaluation: "self_corrected"
        }
      : getDecodingEvaluationPatch(value, response);
    onQuickScore({
      ...patch,
      responseCaptureMode: hasTranscription
        ? RESPONSE_CAPTURE_MODES.EXACT_TRANSCRIPTION
        : RESPONSE_CAPTURE_MODES.QUICK_JUDGMENT
    });
  };

  return (
    <div className="el-benchmark-response-stack el-benchmark-simple-response">
      <QuickOutcomeButtons
        legend="How did the child read the word?"
        onChoose={recordEvaluation}
        options={[
          { value: "automatic_accurate", label: "Straight away", symbol: "✓", tone: "positive" },
          { value: "accurate_after_sounding", label: "Worked it out", symbol: "≈", tone: "warning" },
          { value: "incorrect", label: "Not correct", symbol: "×", tone: "negative" }
        ]}
        value={evaluation}
      />

      <OptionalDetail label="Other or add reading detail" open={showNotScorableReason || ["self_corrected", "no_response", "not_scorable"].includes(evaluation)}>
        <div className="el-benchmark-button-row el-benchmark-other-outcomes">
          <button className="el-benchmark-button secondary" onClick={() => recordEvaluation("self_corrected")} type="button">
            Self-corrected
          </button>
          <button
            className="el-benchmark-button secondary"
            onClick={() => onQuickScore({
              ...getDecodingEvaluationPatch("no_response", response),
              responseCaptureMode: RESPONSE_CAPTURE_MODES.DIRECT_CHOICE
            })}
            type="button"
          >
            No response
          </button>
          <button className="el-benchmark-button ghost" onClick={() => setShowNotScorableReason(true)} type="button">
            Couldn&apos;t score
          </button>
        </div>

        <ExactResponseField
          help="Optional. Add the spoken answer only when it will help instruction."
          label="What the child said (optional)"
          onChange={responseText => onResponseChange({
            responseText,
            responseCaptureMode: responseText.trim()
              ? RESPONSE_CAPTURE_MODES.EXACT_TRANSCRIPTION
              : RESPONSE_CAPTURE_MODES.QUICK_JUDGMENT,
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

        {evaluationIssue === "accurate_response_mismatch" && (
          <p className="el-benchmark-inline-note">The typed response does not match the displayed word. Choose Not correct, or correct the optional detail.</p>
        )}
        {evaluationIssue === "incorrect_response_matches_target" && (
          <p className="el-benchmark-inline-note">The typed response matches the displayed word. Choose an accurate outcome, or correct the optional detail.</p>
        )}

        <label className="el-benchmark-control">
          <span>Error type (optional)</span>
          <select
            onChange={event => onResponseChange({
              errorTags: event.target.value && event.target.value !== "none" ? [event.target.value] : []
            })}
            value={toArray(response.errorTags)[0] || "none"}
          >
            {errorTypes.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

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
              onQuickScore({
                ...getDecodingEvaluationPatch("not_scorable", response, { reason, note }),
                responseCaptureMode: RESPONSE_CAPTURE_MODES.DIRECT_CHOICE
              });
            }}
            response={response}
          />
        )}
      </OptionalDetail>
    </div>
  );
}

function ProtectedEncodingPrompt({ item }) {
  return (
    <section className="el-benchmark-prompt-panel el-benchmark-protected-prompt" aria-label="Protected teacher prompt">
      <div className="el-benchmark-encoding-setup">
        <strong>Child setup</strong>
        <span>Give the child a pencil and lined paper. Keep this screen facing you.</span>
      </div>
      <div className="el-benchmark-protected-script">
        <span>Say exactly</span>
        <p>{item.teacherSay || item.sentence || "Ask the child to write the word they hear."}</p>
      </div>
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
    saveElapsed(elapsedSeconds, "running", {
      ...getFluencyTimerResetPatch(),
      errors: 0,
      selfCorrections: 0
    });
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
              Start 1-minute read
            </button>
          ) : response.timerInterrupted === true ? (
            <span className="el-benchmark-timer-complete-note">Interrupted timing cannot produce WCPM</span>
          ) : (
            <span className="el-benchmark-timer-complete-note">Full passage finish recorded</span>
          )
        ) : timerDisplayRunning ? (
          <>
            <button className="el-benchmark-button warning" onClick={stopTimer} type="button">
              Stop — something interrupted us
            </button>
            <button
              className="el-benchmark-button secondary"
              disabled={elapsedSeconds <= 0 || elapsedSeconds >= 60}
              onClick={finishPassageEarly}
              type="button"
            >
              Child finished the whole passage
            </button>
          </>
        ) : (
          <span className="el-benchmark-timer-complete-note">Full passage finish recorded</span>
        )}
        <button className="el-benchmark-button secondary" onClick={resetTimer} type="button">
          Reset
        </button>
      </div>
    </section>
  );
}

function FluencyCountStepper({ disabled, label, max, onChange, value }) {
  const numericValue = Number.isInteger(Number(value)) ? Number(value) : 0;
  const upperLimit = Math.max(0, Number(max) || 0);

  return (
    <div className="el-benchmark-count-stepper">
      <span>{label}</span>
      <div>
        <button
          aria-label={`Remove one ${label.toLowerCase()}`}
          disabled={disabled || numericValue <= 0}
          onClick={() => onChange(Math.max(0, numericValue - 1))}
          type="button"
        >
          −
        </button>
        <output aria-label={`${label}: ${numericValue}`}>{numericValue}</output>
        <button
          aria-label={`Add one ${label.toLowerCase()}`}
          disabled={disabled || numericValue >= upperLimit}
          onClick={() => onChange(Math.min(upperLimit, numericValue + 1))}
          type="button"
        >
          +
        </button>
      </div>
    </div>
  );
}

function FluencyPanel({ plan, item, response, onAccuracyDecision, onResponseChange }) {
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
  const wordsAttempted = Math.max(0, Number(response.wordsAttempted) || 0);
  const errorCount = Math.max(0, Number(response.errors) || 0);
  const selfCorrectionCount = Math.max(0, Number(response.selfCorrections) || 0);
  const timerActivelyRunning = response.timerStatus === "running" && response.timerInterrupted !== true;
  const countUpperLimit = timerActivelyRunning ? passageWordCount : wordsAttempted;
  const countControlsDisabled = zeroWordsReached || (
    !timerActivelyRunning && (!timingEvidenceReady || !countValidation.wordsAttemptedValid)
  );

  const setLastWord = token => {
    if (!standardTimingValid || response.timerInterrupted === true) return;
    onResponseChange({
      errors: Number.isInteger(Number(response.errors)) ? Number(response.errors) : 0,
      lastWordIndex: token.wordIndex,
      lastWord: token.text,
      selfCorrections: Number.isInteger(Number(response.selfCorrections)) ? Number(response.selfCorrections) : 0,
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
    onAccuracyDecision?.(accurate);
  };

  return (
    <div className="el-benchmark-fluency-layout">
      <section className="el-benchmark-passage-panel" aria-labelledby="el-benchmark-passage-title">
        <div className="el-benchmark-passage-header">
          <div>
            <span>Child reads this aloud</span>
            <h3 id="el-benchmark-passage-title">{passage.title || "Fluency passage"}</h3>
          </div>
          <strong>{passage.wordCount || wordTokens.length} words</strong>
        </div>

        <FluencyTimer
          onFinishEarly={actualElapsedSeconds => {
            const finalToken = wordTokens.at(-1);
            onResponseChange({
              elapsedSeconds: actualElapsedSeconds,
              errors: Number.isInteger(Number(response.errors)) ? Number(response.errors) : 0,
              finishedEarly: true,
              lastWord: finalToken?.text || "",
              lastWordIndex: finalToken?.wordIndex ?? passageWordCount - 1,
              passageWordCount,
              selfCorrections: Number.isInteger(Number(response.selfCorrections)) ? Number(response.selfCorrections) : 0,
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

        <div className="el-benchmark-tablet-counters" aria-label="Live reading counters">
          <FluencyCountStepper
            disabled={countControlsDisabled}
            label="Errors"
            max={Math.max(0, countUpperLimit - selfCorrectionCount)}
            onChange={errors => onResponseChange({ errors })}
            value={response.errors}
          />
          <FluencyCountStepper
            disabled={countControlsDisabled}
            label="Self-corrections"
            max={Math.max(0, countUpperLimit - errorCount)}
            onChange={selfCorrections => onResponseChange({ selfCorrections })}
            value={response.selfCorrections}
          />
        </div>

        <p className="el-benchmark-passage-help" id="el-benchmark-token-help">
          {standardTimingValid
            ? "Time is up. Tap the last word the child reached."
            : timingEvidenceReady
              ? "The full passage finish is recorded."
              : "Start the timer, then let the child read directly from this screen."}
        </p>
        <button
          aria-pressed={zeroWordsReached}
          className="el-benchmark-zero-words"
          disabled={!standardTimingValid || response.timerInterrupted === true}
          onClick={setZeroWordsReached}
          type="button"
        >
          <strong>No words reached (0)</strong>
          <small>Use only when the full minute ends before the child reads the first word.</small>
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
        <div className="el-benchmark-scoring-step el-benchmark-desktop-counters">
          <h3>1. Count anything that needs recording</h3>
          <div className="el-benchmark-number-grid">
            <FluencyCountStepper
              disabled={countControlsDisabled}
              label="Errors"
              max={Math.max(0, countUpperLimit - selfCorrectionCount)}
              onChange={errors => onResponseChange({ errors })}
              value={response.errors}
            />
            <FluencyCountStepper
              disabled={countControlsDisabled}
              label="Self-corrections"
              max={Math.max(0, countUpperLimit - errorCount)}
              onChange={selfCorrections => onResponseChange({ selfCorrections })}
              value={response.selfCorrections}
            />
          </div>
          <small>Leave both at 0 when there were none. Self-corrections are not errors.</small>
        </div>

        {response.status !== "not_scorable" &&
          timingEvidenceReady &&
          !zeroWordsReached &&
          countValidation.wordsAttemptedValid &&
          countValidation.errorsValid &&
          countValidation.selfCorrectionsValid &&
          countValidation.combinedCountsValid && (
          <div className="el-benchmark-scoring-step">
            <h3>2. Was this read accurate enough?</h3>
            <QuickOutcomeButtons
            legend="Choose one"
            onChoose={setAccuracyJudgment}
            options={[
              {
                value: "accurate",
                label: "Yes — continue",
                symbol: "✓",
                tone: "positive"
              },
              {
                value: "not_accurate",
                label: "Not yet — finish here",
                symbol: "×",
                tone: "negative"
              }
            ]}
            value={accuracyJudgment === true ? "accurate" : accuracyJudgment === false ? "not_accurate" : ""}
            />
          </div>
        )}

        {response.status !== "not_scorable" && zeroWordsReached && (
          <p className="el-benchmark-accuracy-na">
            <strong>Accuracy: N/A</strong>
            No words were read. The completed full-minute result is recorded as 0 WCPM.
          </p>
        )}

        {finishEarlyTimingValid && (
          <p className="el-benchmark-finish-early-note">
            Finished in {elapsedSeconds} seconds. The accuracy result is saved, but a per-minute score is not estimated.
          </p>
        )}

        <OptionalDetail label="Optional notes, printable copy, or couldn’t score" open={showNotScorableReason}>
          <details className="el-benchmark-clean-passage">
            <summary>Printable clean passage</summary>
            <div className="el-benchmark-clean-passage-actions">
              <span>Child-facing copy</span>
              <button
                className="el-benchmark-button secondary compact"
                disabled={response.timerStatus === "running"}
                onClick={() => window.print()}
                title={response.timerStatus === "running" ? "Finish or interrupt timing before printing." : undefined}
                type="button"
              >
                Print passage
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

          <fieldset className="el-benchmark-fieldset el-benchmark-prosody">
            <legend>Reading expression (optional)</legend>
            <p className="el-benchmark-field-help">Add these only when they will help instruction.</p>
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
            {response.status === "not_scorable" ? "Review why this couldn’t be scored" : "Couldn’t score this passage"}
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
        </OptionalDetail>

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

function ItemPanel({
  kind,
  plan,
  item,
  itemNumber,
  itemCount,
  response,
  onAccuracyDecision,
  onResponseChange,
  onQuickScore
}) {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [item.id]);

  const routeLabel = getStartingBandLabel(plan, item);
  const taskHeading = getItemTaskHeading(kind, item);
  const teacherDirective = getItemTeacherDirective(kind, item);
  const decodingWord = item.displayWord || item.targetWord || item.word || "";
  const isFluency = kind === ASSESSMENT_KINDS.FLUENCY;
  const isRhymeRecognition = kind === ASSESSMENT_KINDS.PHONOLOGICAL_AWARENESS &&
    item.strand === "rhyme" && item.task === "recognition";

  return (
    <article className="el-benchmark-item-card">
      <header className="el-benchmark-item-header">
        <div>
          <span>{routeLabel}</span>
          <h2 ref={headingRef} tabIndex="-1">
            {isFluency ? "Record the one-minute read" : `Item ${itemNumber} of ${itemCount}`}
          </h2>
        </div>
      </header>

      <section className="el-benchmark-item-instruction" aria-label="Teacher instruction">
        <strong>{taskHeading}</strong>
        <p>{teacherDirective}</p>
      </section>

      {!isFluency && kind !== ASSESSMENT_KINDS.ENCODING && !isRhymeRecognition && (
        <section className="el-benchmark-prompt-panel" aria-label="Teacher prompt">
          <span>{item.teacherSay ? "Say exactly" : "Teacher prompt"}</span>
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
          onQuickScore={onQuickScore}
          response={response}
        />
      )}
      {kind === ASSESSMENT_KINDS.ENCODING && (
        <EncodingPanel
          item={item}
          onResponseChange={onResponseChange}
          onQuickScore={onQuickScore}
          response={response}
        />
      )}
      {kind === ASSESSMENT_KINDS.DECODING && (
        <DecodingPanel
          item={item}
          onResponseChange={onResponseChange}
          onQuickScore={onQuickScore}
          response={response}
        />
      )}
      {kind === ASSESSMENT_KINDS.FLUENCY && (
        <FluencyPanel
          item={item}
          onAccuracyDecision={onAccuracyDecision}
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
        <span>Word set complete</span>
        <h3 id="el-benchmark-band-decision-title">What should happen next?</h3>
        <p>{band.label}</p>
        <details>
          <summary>See the result</summary>
          <strong>{automaticCount} of {denominator} read straight away</strong>
          <small>The check uses your observation of automatic reading, not a seconds-based cutoff.</small>
        </details>
      </div>

      {isConfirmedBand ? (
        <div className="el-benchmark-band-message stop-confirmed">
          <strong>Finished here</strong>
          <p>The remaining word sets will not count as incorrect.</p>
          <button className="el-benchmark-button secondary compact" onClick={onUndoStop} type="button">
            Undo and keep reading
          </button>
        </div>
      ) : hasContinueDecision ? (
        <div className="el-benchmark-band-message continue">
          <strong>Ready for the next word set</strong>
          <p>
            {continueEvidence.reason === "teacher_override_below_threshold"
              ? `You chose to keep going: ${continueEvidence.overrideReason}`
              : "This decision is saved."}
          </p>
          {nextBand && (
            <button className="el-benchmark-button primary compact" onClick={() => onContinue(nextBand.indexes[0])} type="button">
              Continue reading
            </button>
          )}
        </div>
      ) : notScorableCount > 0 ? (
        <div className="el-benchmark-band-message caution">
          <strong>Keep reading for a clearer result</strong>
          <p>{notScorableCount} word{notScorableCount === 1 ? " could" : "s could"} not be scored in this set.</p>
          {nextBand && (
            <button
              className="el-benchmark-button primary"
              onClick={() => onContinue(nextBand.indexes[0], {
                automaticCount,
                denominator,
                notScorableCount,
                reason: "not_scorable_in_band"
              })}
              type="button"
            >
              Continue reading
            </button>
          )}
        </div>
      ) : stopRuleMet ? (
        <div className="el-benchmark-band-message stopping">
          <strong>This is a good place to finish</strong>
          <p>The child has shown enough for the report to choose a useful next step.</p>
          {laterHasEvidence ? (
            <p className="el-benchmark-band-warning">Later answers are already saved. Keep reading to preserve them.</p>
          ) : nextBand ? (
            <button className="el-benchmark-button primary el-benchmark-decision-primary" onClick={() => onConfirmStop({ automaticCount, denominator })} type="button">
              Finish here
            </button>
          ) : (
            <p>All planned word sets are complete.</p>
          )}
          {nextBand && !showOverride && (
            <button className="el-benchmark-button ghost compact" onClick={() => setShowOverride(true)} type="button">
              Keep going instead
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
                <span>Why will another word set help?</span>
                <textarea
                  onChange={event => setOverrideReason(event.target.value)}
                  placeholder="For example: the child was distracted and needs another chance"
                  required
                  rows="2"
                  value={overrideReason}
                />
              </label>
              <div className="el-benchmark-button-row">
                <button className="el-benchmark-button primary compact" disabled={!overrideReason.trim()} type="submit">
                  Save reason and continue
                </button>
                <button className="el-benchmark-button ghost compact" onClick={() => setShowOverride(false)} type="button">
                  Cancel
                </button>
              </div>
            </form>
          )}
          <details className="el-benchmark-decision-detail">
            <summary>Why is finishing suggested?</summary>
            <p>{automaticCount} of {denominator} words were read straight away. The route suggests finishing at {threshold} or fewer.</p>
          </details>
        </div>
      ) : (
        <div className="el-benchmark-band-message continue">
          <strong>{nextBand ? "The child is ready for the next word set" : "All planned word sets are complete"}</strong>
          <p>{nextBand ? "Continue while the child is reading comfortably." : "No more word sets are needed."}</p>
          {nextBand && (
            <button
              className="el-benchmark-button primary el-benchmark-decision-primary"
              onClick={() => onContinue(nextBand.indexes[0], {
                automaticCount,
                denominator,
                notScorableCount,
                reason: "automatic_count_above_threshold"
              })}
              type="button"
            >
              Continue reading
            </button>
          )}
          <details className="el-benchmark-decision-detail">
            <summary>See the result</summary>
            <p>{automaticCount} of {denominator} words were read straight away.</p>
          </details>
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
  const passageLabel = item.microphaseLabel || humanize(item.microphase || item.bandId) || `Passage ${index + 1}`;
  const accuracyJudgment = getPassageAccuracyJudgment(response);
  const zeroWordsReached = response.zeroWordsReached === true;
  const isConfirmedStop = Boolean(stopEvidence?.confirmed && stopEvidence.passageId === itemId);
  const hasContinueDecision = continueEvidence?.action === "continue";
  const hasLaterEvidenceReview = continueEvidence?.action === "review_later_evidence";

  return (
    <section className="el-benchmark-band-decision el-benchmark-fluency-decision" aria-labelledby="el-benchmark-fluency-decision-title">
      <div className="el-benchmark-band-result">
        <span>Reading complete</span>
        <h3 id="el-benchmark-fluency-decision-title">What should happen next?</h3>
        <p>{passageLabel}</p>
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
          ? "No words were reached during the full minute."
          : response.finishedEarly
          ? "The accuracy result is saved; a per-minute score is not estimated."
          : "This result uses the teacher’s accuracy choice."}</small>
      </div>

      {isConfirmedStop ? (
        <div className="el-benchmark-band-message stop-confirmed">
          <strong>Finished here</strong>
          <p>{stopEvidence?.laterEvidencePreserved
            ? "Later reading stays saved as an extra result, but it will not change this stopping point or count toward the suggested start."
            : "Later passages will not count as incorrect."}</p>
          <button className="el-benchmark-button secondary compact" onClick={onUndoStop} type="button">
            {stopEvidence?.laterEvidencePreserved ? "Undo and review later reading" : "Undo and keep reading"}
          </button>
        </div>
      ) : accuracyJudgment === false || zeroWordsReached ? (
        <div className="el-benchmark-band-message stopping">
          <strong>This is a good place to finish</strong>
          <p>{zeroWordsReached
            ? "The full-minute 0-word result is saved."
            : "The child’s first not-yet-accurate passage gives a useful stopping point."}</p>
          {laterHasEvidence && (
            <>
              <p className="el-benchmark-band-warning">
                Later reading is already saved and has not been deleted. Review it, then return here if this answer needs changing.
              </p>
              {hasLaterEvidenceReview && nextItem && (
                <button className="el-benchmark-button secondary" onClick={() => onContinue(index + 1)} type="button">
                  Review next saved passage
                </button>
              )}
            </>
          )}
          <button
            className="el-benchmark-button primary el-benchmark-decision-primary"
            disabled={laterHasEvidence}
            onClick={onConfirmStop}
            type="button"
          >
            Finish here
          </button>
        </div>
      ) : hasContinueDecision ? (
        <div className="el-benchmark-band-message continue">
          <strong>Ready for the next passage</strong>
          <p>{continueEvidence.reason === "passage_not_scorable" ? "The passage that could not be scored was reviewed." : "This decision is saved."}</p>
          {nextItem && (
            <button className="el-benchmark-button primary compact" onClick={() => onContinue(index + 1)} type="button">
              Continue reading
            </button>
          )}
        </div>
      ) : nextItem ? (
        <div className={`el-benchmark-band-message ${response.status === "not_scorable" ? "caution" : "continue"}`}>
          <strong>{response.status === "not_scorable" ? "Try another passage for a clearer result" : "The child is ready for the next passage"}</strong>
          <p>{response.status === "not_scorable"
            ? "This passage did not provide an accuracy result."
            : "Continue while the child is reading comfortably."}</p>
          <button
            className="el-benchmark-button primary el-benchmark-decision-primary"
            onClick={() => onContinue(index + 1, response.status === "not_scorable" ? "passage_not_scorable" : "teacher_judgment_accurate")}
            type="button"
          >
            Continue reading
          </button>
        </div>
      ) : (
        <div className="el-benchmark-band-message continue">
          <strong>All planned passages are complete</strong>
          <p>No more reading passages are needed.</p>
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
    <aside className="el-benchmark-route-summary" aria-label="Check route and progress">
      <div className="el-benchmark-route-heading">
        <span>Check route</span>
        <strong>{getStartingBandLabel(plan)}</strong>
        <small>{formatGrade(session.grade)} | {formatWindow(session.window)}</small>
      </div>

      <dl className="el-benchmark-counts">
        <div>
          <dt>Done</dt>
          <dd>{administeredCount}</dd>
        </div>
        <div>
          <dt>Not scorable</dt>
          <dd>{notScorableCount}</dd>
        </div>
        <div>
          <dt>Not done</dt>
          <dd>{notAdministeredCount}</dd>
        </div>
      </dl>

      <div className="el-benchmark-item-navigator" aria-label="Check items">
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
              ? "not done"
              : isComplete
                ? "recorded"
                : hasResponseContent(response)
                  ? "partial"
                  : "not done yet";

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
          <summary>How to run this check</summary>
          {teacherInstructions.length > 0 && (
            <div>
              <strong>Teacher guidance</strong>
              <ul>{teacherInstructions.map((instruction, index) => <li key={`teacher-${index}-${instruction}`}>{teacherGuidanceText(instruction)}</li>)}</ul>
            </div>
          )}
          {scoringNotes.length > 0 && (
            <div>
              <strong>Scoring notes</strong>
              <ul>{scoringNotes.map((note, index) => <li key={`scoring-${index}-${note}`}>{teacherGuidanceText(note)}</li>)}</ul>
            </div>
          )}
        </details>
      )}

      <p className="el-benchmark-provisional-note">
        Literacy Guide EL-aligned content and routing are provisional. This is not an official EL Education form.
      </p>
    </aside>
  );
}

function PlacementConfirmationPanel({
  administrationRange,
  allowedMicrophases,
  assessmentKind,
  confirmedPlacement,
  defaultMicrophase,
  normalRangeMicrophases,
  onConfirm,
  panelRef,
  preview
}) {
  const proposedPlacement = preview?.candidatePlacement || {};
  const proposedMicrophase = getPlacementMicrophase(proposedPlacement);
  const confirmedMicrophase = getPlacementMicrophase(confirmedPlacement);
  const allowedSet = new Set(allowedMicrophases);
  const normalRangeSet = new Set(normalRangeMicrophases || allowedMicrophases);
  const confirmedMicrophaseAllowed = Boolean(confirmedMicrophase && allowedSet.has(confirmedMicrophase));
  const proposedMicrophaseAllowed = Boolean(proposedMicrophase && allowedSet.has(proposedMicrophase));
  const defaultMicrophaseAllowed = Boolean(defaultMicrophase && allowedSet.has(defaultMicrophase));
  const recommendedMicrophase = proposedMicrophaseAllowed
    ? proposedMicrophase
    : defaultMicrophaseAllowed
      ? defaultMicrophase
      : (normalRangeMicrophases || allowedMicrophases).find(microphase => allowedSet.has(microphase)) || "";
  const confirmedRationaleRequired = placementRequiresRationale(
    assessmentKind,
    preview,
    confirmedMicrophase,
    proposedMicrophase,
    recommendedMicrophase
  );
  const confirmedPlacementReady = confirmedMicrophaseAllowed && (
    !confirmedRationaleRequired || Boolean(String(confirmedPlacement?.overrideReason || "").trim())
  );
  const [selectedMicrophase, setSelectedMicrophase] = useState(
    confirmedMicrophaseAllowed ? confirmedMicrophase : recommendedMicrophase
  );
  const [reason, setReason] = useState(confirmedPlacement?.overrideReason || "");
  const [showEditor, setShowEditor] = useState(Boolean(confirmedMicrophase && !confirmedPlacementReady) || !recommendedMicrophase);

  const selectedOption = EL_DECODING_MICROPHASES.find(row => row.id === selectedMicrophase) || null;
  const recommendedOption = EL_DECODING_MICROPHASES.find(row => row.id === recommendedMicrophase) || null;
  const inRangeOptions = EL_DECODING_MICROPHASES.filter(option => normalRangeSet.has(option.id));
  const ceilingOptions = EL_DECODING_MICROPHASES.filter(option => allowedSet.has(option.id) && !normalRangeSet.has(option.id));
  const reasonRequired = placementRequiresRationale(
    assessmentKind,
    preview,
    selectedMicrophase,
    proposedMicrophase,
    recommendedMicrophase
  );
  const confirmationReady = Boolean(selectedOption && allowedSet.has(selectedOption.id)) && (!reasonRequired || reason.trim());
  const isEncoding = assessmentKind === ASSESSMENT_KINDS.ENCODING;
  const scoreStatus = humanize(preview?.scoreStatus || "unavailable");
  const scoredCount = Number(preview?.scoredCount || 0);

  return (
    <section
      aria-labelledby="el-benchmark-placement-title"
      className="el-benchmark-placement"
      ref={panelRef}
      tabIndex="-1"
    >
      <div className="el-benchmark-placement-heading">
        <span>Final step</span>
        <h2 id="el-benchmark-placement-title">Choose where to start next</h2>
        <p>Use the suggestion, or choose a different starting point if your classroom results say otherwise.</p>
      </div>

      {confirmedPlacementReady && !showEditor ? (
        <div className="el-benchmark-placement-confirmed" aria-live="polite">
          <span>Starting point saved</span>
          <strong>{EL_DECODING_MICROPHASES.find(row => row.id === confirmedMicrophase)?.label || humanize(confirmedMicrophase)}</strong>
          {confirmedPlacement?.overrideReason && <p>Reason: {confirmedPlacement.overrideReason}</p>}
          <button className="el-benchmark-button secondary compact" onClick={() => setShowEditor(true)} type="button">
            Change starting point
          </button>
        </div>
      ) : (
        <div className="el-benchmark-placement-choice">
          {recommendedOption && (
            <div className="el-benchmark-placement-evidence">
              <span>Suggested starting point</span>
              <strong>{recommendedOption.label}</strong>
              <p>{isEncoding
                ? "Based on the child’s grade and this time of year."
                : "Based on the word-reading results just recorded."}</p>
              <button
                className="el-benchmark-button primary el-benchmark-placement-accept"
                onClick={() => onConfirm({
                  selectedMicrophase: recommendedMicrophase,
                  proposedMicrophase,
                  reason: ""
                })}
                type="button"
              >
                Use this starting point
              </button>
              <details className="el-benchmark-placement-why">
                <summary>Why is this suggested?</summary>
                <p>{proposedPlacement.reason || (isEncoding
                  ? "Spelling does not use an automatic spelling-to-reading conversion. The grade and time of year provide a safe default that the teacher can change."
                  : "The suggestion uses the completed word-reading results and this check's route.")}</p>
                <small>Result status: {scoreStatus} · {scoredCount} scored item{scoredCount === 1 ? "" : "s"}</small>
                {administrationRange && <small>Expected range: {getAdministrationRangeLabel(administrationRange)}</small>}
              </details>
            </div>
          )}

          {!showEditor && (
            <button className="el-benchmark-button ghost" onClick={() => setShowEditor(true)} type="button">
              Choose a different starting point
            </button>
          )}

          {showEditor && (
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
                  The saved starting point is outside this check. Choose one of the available options.
                </p>
              )}
              <label className="el-benchmark-control">
                <span>Different starting point</span>
                <select onChange={event => setSelectedMicrophase(event.target.value)} value={selectedMicrophase}>
                  <option value="">Choose a starting point</option>
                  <optgroup label="Expected range">
                    {inRangeOptions.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.label}{Number.isInteger(option.anchorCycle) ? ` (Cycle ${option.anchorCycle})` : ""}
                      </option>
                    ))}
                  </optgroup>
                  {ceilingOptions.length > 0 && (
                    <optgroup label="Next supported level">
                      {ceilingOptions.map(option => (
                        <option key={option.id} value={option.id}>
                          {option.label}{Number.isInteger(option.anchorCycle) ? ` (Cycle ${option.anchorCycle})` : ""}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </label>

              {reasonRequired && (
                <label className="el-benchmark-control">
                  <span>Why are you choosing a different starting point?</span>
                  <textarea
                    onChange={event => setReason(event.target.value)}
                    placeholder="For example: recent classroom reading shows this is a better fit"
                    required
                    rows="2"
                    value={reason}
                  />
                </label>
              )}

              <div className="el-benchmark-button-row">
                <button className="el-benchmark-button primary" disabled={!confirmationReady} type="submit">
                  Save starting point
                </button>
                {recommendedOption && (
                  <button className="el-benchmark-button ghost" onClick={() => setShowEditor(false)} type="button">
                    Cancel change
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
}

function FinishConfirmationPanel({
  completionState,
  onCancel,
  onConfirm,
  panelRef,
  tally
}) {
  const saving = completionState.status === "saving";
  return (
    <section
      aria-labelledby="el-benchmark-finish-review-title"
      className="el-benchmark-finish-review"
      ref={panelRef}
      role="dialog"
      tabIndex="-1"
    >
      <span>Final review</span>
      <h2 id="el-benchmark-finish-review-title">Check the tally before finishing</h2>
      <p>This saves the completed check. Go back now if the final tap was not what you intended.</p>
      <dl aria-label="Check completion tally">
        <div><dt>Scored</dt><dd>{tally.scored}</dd></div>
        <div><dt>Skipped</dt><dd>{tally.skipped}</dd></div>
        <div><dt>Not scorable</dt><dd>{tally.notScorable}</dd></div>
      </dl>
      <strong>{tally.scored} scored · {tally.skipped} skipped</strong>
      {completionState.status === "error" && (
        <p className="el-benchmark-inline-alert" role="alert">{completionState.message}</p>
      )}
      <div className="el-benchmark-button-row">
        <button
          className="el-benchmark-button secondary"
          disabled={saving}
          onClick={onCancel}
          type="button"
        >
          Change final answer
        </button>
        <button
          aria-busy={saving ? "true" : undefined}
          className="el-benchmark-button primary"
          disabled={saving}
          onClick={onConfirm}
          type="button"
        >
          {saving ? "Finishing..." : completionState.status === "error" ? "Retry save" : "Confirm and finish"}
        </button>
      </div>
    </section>
  );
}

function getAssessmentFinishTally(items = [], responses = {}, kind = "") {
  return items.reduce((tally, item, index) => {
    const itemId = getItemId(item, index, kind);
    const response = responses[itemId] || {};
    if (response.status === "not_scorable") tally.notScorable += 1;
    else if (response.status === "not_administered") tally.skipped += 1;
    else if (isResponseComplete(kind, response, item)) tally.scored += 1;
    return tally;
  }, { scored: 0, skipped: 0, notScorable: 0 });
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
        <p>Only completed answers will be saved. Items not done will not count as incorrect.</p>
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
        <button className="el-benchmark-button secondary" onClick={onClose} type="button">Continue check</button>
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
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);
  const [completionState, setCompletionState] = useState({ status: "idle", message: "" });
  const completionLockRef = useRef(false);
  const finishConfirmationRef = useRef(null);
  const placementPanelRef = useRef(null);
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
  const fluencyStopIndex = kind === ASSESSMENT_KINDS.FLUENCY && fluencyStopEvidence?.confirmed
    ? items.findIndex((item, index) => (
        getItemId(item, index, ASSESSMENT_KINDS.FLUENCY) === fluencyStopEvidence.passageId
      ))
    : -1;
  const fluencyRouteReviewed = kind !== ASSESSMENT_KINDS.FLUENCY || items.every((item, index) => {
    if (fluencyStopIndex >= 0 && index > fluencyStopIndex) return true;
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
  const defaultPlacementMicrophase = [
    plan?.route?.expectedMicrophase,
    plan?.route?.defaultStartMicrophase,
    plan?.route?.selectedStartMicrophase,
    placementRangeMicrophases[0]
  ].find(microphase => placementRangeMicrophases.includes(microphase)) || placementRangeMicrophases[0] || "";
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
  const recommendedPlacementMicrophase = placementAllowedMicrophases.includes(proposedPlacementMicrophase)
    ? proposedPlacementMicrophase
    : defaultPlacementMicrophase;
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
    proposedPlacementMicrophase,
    recommendedPlacementMicrophase
  );
  const placementConfirmed = !requiresPlacementConfirmation || Boolean(
    confirmedPlacementMicrophase &&
    confirmedPlacementAllowed &&
    session.placementSource === "teacher_confirmation" &&
    !confirmedPlacementOutsideAllowedRange &&
    (!confirmedPlacementNeedsRationale || String(session.confirmedPlacement?.overrideReason || "").trim())
  );
  const canCompleteAssessment = allItemsComplete && placementConfirmed;
  const needsPlacementConfirmation = allItemsComplete && requiresPlacementConfirmation && !placementConfirmed;
  const completionIsSaving = completionState.status === "saving";
  const terminalSessionStatus = getTerminalSessionStatus(session);
  const routeNavigationLockMessage = kind === ASSESSMENT_KINDS.FLUENCY
    ? fluencyStopEvidence?.confirmed
      ? "locked after the confirmed fluency stop"
      : "locked until the current passage route is reviewed"
    : session.decodingStop?.confirmed
      ? "locked after the confirmed decoding stop"
      : "locked until the current decoding band is reviewed";

  const makeSessionSnapshot = useCallback((patch = {}) => preserveTerminalSessionStatus(session, {
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

  const updateCurrentResponse = useCallback((patch, options = {}) => {
    if (!currentItemId) return;
    setShowFinishConfirmation(false);
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
      ...(options.advance ? { outcomeRecordedAt: now } : {}),
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

    const nextIndex = options.advance &&
      isResponseComplete(kind, nextResponse, currentItem) &&
      kind !== ASSESSMENT_KINDS.FLUENCY &&
      currentIndex < items.length - 1 &&
      (
        kind !== ASSESSMENT_KINDS.DECODING ||
        currentBand?.indexes.includes(currentIndex + 1)
      )
      ? currentIndex + 1
      : currentIndex;

    emitSession(makeSessionSnapshot({
      status: ["completed", "discontinued"].includes(session.status) ? session.status : "in_progress",
      startedAt: session.startedAt || now,
      updatedAt: now,
      administrationVersion: session.administrationVersion || QUICK_ADMINISTRATION_VERSION,
      responseSchemaVersion: Math.max(2, Number(session.responseSchemaVersion) || 0),
      currentItemIndex: nextIndex,
      itemIndex: nextIndex,
      ...stopPatch,
      responses: {
        ...nextResponses,
        [currentItemId]: nextResponse
      }
    }));
  }, [currentBand, currentBandIndex, currentIndex, currentItem, currentItemId, decodingBandDecisions, decodingBands, emitSession, fluencyPassageDecisions, fluencyStopEvidence?.confirmed, items, kind, makeSessionSnapshot, plan, responses, session.administrationVersion, session.assessmentId, session.confirmedPlacement, session.decodingStop?.confirmed, session.responseSchemaVersion, session.startedAt, session.status]);

  const isItemNavigationAllowed = useCallback((targetIndex) => {
    if (kind === ASSESSMENT_KINDS.FLUENCY) {
      if (targetIndex <= currentIndex) return true;
      for (let passageIndex = currentIndex; passageIndex < targetIndex; passageIndex += 1) {
        const passageId = getItemId(items[passageIndex], passageIndex, ASSESSMENT_KINDS.FLUENCY);
        if (fluencyStopEvidence?.confirmed && fluencyStopEvidence.passageId === passageId) return false;
        if (!["continue", "review_later_evidence"].includes(fluencyPassageDecisions[passageId]?.action)) return false;
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
    if (timerIsRunning || completionIsSaving) return;
    const now = new Date().toISOString();
    const nextSession = emitSession(makeSessionSnapshot({
      status: "partial",
      administrationStatus: "partial",
      savedAt: now,
      updatedAt: now
    }));
    if (typeof onSaveAndExit === "function") onSaveAndExit(nextSession);
  };

  const discontinueAndExit = (reason, note) => {
    if (timerIsRunning || completionIsSaving || !isDiscontinueEvidenceComplete(reason, note)) return;
    const now = new Date().toISOString();
    const nextSession = emitSession(makeSessionSnapshot({
      status: "discontinued",
      administrationStatus: "discontinued",
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
      proposedMicrophase,
      recommendedPlacementMicrophase
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

  const focusPlacementStep = () => {
    const panel = placementPanelRef.current;
    if (!panel) return;
    panel.scrollIntoView?.({ block: "center" });
    panel.focus?.({ preventScroll: true });
  };

  const completeAssessment = async () => {
    if (
      timerIsRunning ||
      !canCompleteAssessment ||
      !showFinishConfirmation ||
      completionLockRef.current
    ) return null;
    completionLockRef.current = true;
    setCompletionState({ status: "saving", message: "Finishing and saving the check." });
    const now = new Date().toISOString();
    const nextSession = emitSession(makeSessionSnapshot({
      status: "completed",
      administrationStatus: "completed",
      completedAt: now,
      updatedAt: now
    }));
    try {
      const result = typeof onComplete === "function"
        ? await onComplete(nextSession)
        : null;
      if (result?.ok === true) return result;
      const message = result?.message || "The check could not be saved. Your completed answers are still on this screen.";
      setCompletionState({ status: "error", message });
      return { ok: false, message };
    } catch (error) {
      const message = error instanceof Error && error.message
        ? `The check could not be saved: ${error.message}`
        : "The check could not be saved. Your completed answers are still on this screen.";
      setCompletionState({ status: "error", message });
      return { ok: false, message };
    } finally {
      completionLockRef.current = false;
    }
  };

  const finishTally = useMemo(
    () => getAssessmentFinishTally(items, responses, kind),
    [items, kind, responses]
  );

  const openFinishConfirmation = () => {
    if (!canCompleteAssessment || completionIsSaving) return;
    setShowFinishConfirmation(true);
    window.requestAnimationFrame(() => {
      finishConfirmationRef.current?.scrollIntoView?.({ block: "center" });
      finishConfirmationRef.current?.focus?.({ preventScroll: true });
    });
  };

  const recordFluencyAccuracyAndRoute = (accurate) => {
    if (kind !== ASSESSMENT_KINDS.FLUENCY || typeof accurate !== "boolean" || timerIsRunning) return;

    const now = new Date().toISOString();
    const accuracyPatch = {
      accurate,
      passageAccurate: accurate,
      accuracyJudgmentSource: "teacher",
      accuracyJudgedAt: now
    };
    const nextResponse = {
      ...currentResponse,
      ...accuracyPatch,
      itemId: currentItemId,
      assessmentId: session.assessmentId || plan.assessmentId,
      administeredAt: currentResponse.administeredAt || now,
      outcomeRecordedAt: now,
      updatedAt: now
    };
    nextResponse.status = isResponseComplete(ASSESSMENT_KINDS.FLUENCY, nextResponse, currentItem)
      ? "recorded"
      : "not_administered";

    if (!isResponseComplete(ASSESSMENT_KINDS.FLUENCY, nextResponse, currentItem)) {
      updateCurrentResponse(accuracyPatch);
      return;
    }

    const retainedDecisions = Object.fromEntries(Object.entries(fluencyPassageDecisions).filter(([passageId]) => {
      const passageIndex = items.findIndex((item, index) => (
        getItemId(item, index, ASSESSMENT_KINDS.FLUENCY) === passageId
      ));
      return passageIndex >= 0 && passageIndex < currentIndex;
    }));
    const retainedResponses = Object.fromEntries(Object.entries(responses).filter(([, savedResponse]) => (
      savedResponse?.routeSkipReason !== "fluency_stop_teacher_judgment"
    )));
    const nextResponses = {
      ...retainedResponses,
      [currentItemId]: nextResponse
    };
    const commonSnapshot = {
      status: "in_progress",
      startedAt: session.startedAt || now,
      updatedAt: now,
      responses: nextResponses,
      fluencyPassageDecisions: retainedDecisions,
      fluencyStop: null,
      fluencyStopEvidence: null,
      fluencyStopReason: ""
    };

    if (accurate) {
      const nextItem = items[currentIndex + 1] || null;
      const evidence = nextItem ? {
        action: "continue",
        passageId: currentItemId,
        passageIndex: currentIndex,
        microphase: currentItem.microphase || currentItem.bandId || "",
        microphaseLabel: currentItem.microphaseLabel || "",
        accurate: true,
        passageAccurate: true,
        reason: "teacher_judgment_accurate",
        judgmentSource: "teacher",
        decidedAt: now
      } : null;

      emitSession(makeSessionSnapshot({
        ...commonSnapshot,
        ...(nextItem ? {
          currentItemIndex: currentIndex + 1,
          itemIndex: currentIndex + 1,
          fluencyPassageDecisions: {
            ...retainedDecisions,
            [currentItemId]: evidence
          }
        } : {})
      }));
      return;
    }

    const laterIndexes = items.slice(currentIndex + 1).map((_, offset) => currentIndex + offset + 1);
    const retainedLaterPassageIds = laterIndexes.map(index => (
      getItemId(items[index], index, ASSESSMENT_KINDS.FLUENCY)
    )).filter(itemId => (
      hasResponseContent(nextResponses[itemId]) &&
      nextResponses[itemId]?.routeSkipReason !== "fluency_stop_teacher_judgment"
    ));
    laterIndexes.forEach(index => {
      const itemId = getItemId(items[index], index, ASSESSMENT_KINDS.FLUENCY);
      if (retainedLaterPassageIds.includes(itemId)) return;
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
    const laterReviewEvidence = fluencyLaterHasEvidence ? {
      action: "review_later_evidence",
      passageId: currentItemId,
      passageIndex: currentIndex,
      microphase: currentItem.microphase || currentItem.bandId || "",
      microphaseLabel: currentItem.microphaseLabel || "",
      accurate: false,
      passageAccurate: false,
      reason: "later_administered_evidence_preserved_after_changed_judgment",
      judgmentSource: "teacher",
      decidedAt: now
    } : null;
    const stopEvidence = {
      confirmed: true,
      passageId: currentItemId,
      passageIndex: currentIndex,
      microphase: currentItem.microphase || currentItem.bandId || "",
      microphaseLabel: currentItem.microphaseLabel || "",
      anchorCycle: currentItem.anchorCycle ?? null,
      accurate: false,
      passageAccurate: false,
      zeroWordsReached: false,
      criterion: "explicit_false",
      metric: plan.administration?.stopRule?.metric || "teacher_accuracy_judgment",
      threshold: null,
      reason: "teacher_judgment_not_accurate",
      judgmentSource: "teacher",
      laterEvidencePreserved: fluencyLaterHasEvidence,
      retainedLaterPassageIds,
      confirmedAt: now
    };

    emitSession(makeSessionSnapshot({
      ...commonSnapshot,
      responses: nextResponses,
      fluencyPassageDecisions: fluencyLaterHasEvidence ? {
        ...fluencyPassageDecisions,
        [currentItemId]: laterReviewEvidence
      } : retainedDecisions,
      fluencyStop: stopEvidence,
      fluencyStopEvidence: stopEvidence,
      fluencyStopReason: "teacher_judgment_not_accurate"
    }));
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
          <h1 id="el-benchmark-error-title">Check unavailable</h1>
          <p>{planResult.error?.message || "This check could not be loaded."}</p>
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
          <p>The selected grade, time of year, and starting point did not return a check.</p>
          <div className="el-benchmark-button-row">
            <button className="el-benchmark-button secondary" onClick={() => onCancel?.()} type="button">Return</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      aria-busy={completionIsSaving ? "true" : undefined}
      aria-labelledby="el-benchmark-page-title"
      className="el-benchmark-shell"
    >
      <header className="el-benchmark-topbar">
        <div className="el-benchmark-title-block">
          <div>
            <h1 id="el-benchmark-page-title">{plan.title || "EL-aligned check"}</h1>
          </div>
          <p>{getStudentName(session)} · {formatGrade(session.grade)} · {formatWindow(session.window)}</p>
        </div>

        <div className="el-benchmark-header-progress">
          <div>
            <span>Progress</span>
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
            <span className="el-benchmark-autosave-note">Saved automatically</span>
          )}
          <div
            aria-live="polite"
            className={`el-benchmark-header-completion${completionState.status === "error" ? " error" : ""}`}
            id="el-benchmark-completion-status"
          >
            {completionState.status === "error" ? (
              <p role="alert"><strong>Could not finish.</strong> {completionState.message} Select Retry finish.</p>
            ) : (
              <p>
                {completionIsSaving
                  ? "Saving the completed check. Keep this page open."
                  : canCompleteAssessment
                    ? "Everything is ready to save."
                    : needsPlacementConfirmation
                      ? "One final step: choose the child’s next starting point."
                      : resolvedItems.length === items.length
                        ? "Review the suggested next step below."
                        : `${items.length - resolvedItems.length} item${items.length - resolvedItems.length === 1 ? "" : "s"} left.`}
              </p>
            )}
          </div>
          <button
            className="el-benchmark-button secondary"
            disabled={timerIsRunning || completionIsSaving || terminalSessionStatus === "completed"}
            onClick={savePartialAndExit}
            title={timerIsRunning
              ? "Stop the timer before saving"
              : terminalSessionStatus === "completed"
                ? "Use Retry finish below to save this completed check"
                : undefined}
            type="button"
          >
            Save &amp; exit
          </button>
          <button
            aria-busy={completionIsSaving ? "true" : undefined}
            aria-describedby="el-benchmark-completion-status"
            className="el-benchmark-button primary"
            disabled={timerIsRunning || completionIsSaving || (!canCompleteAssessment && !needsPlacementConfirmation)}
            onClick={() => {
              if (needsPlacementConfirmation) {
                focusPlacementStep();
                return;
              }
              openFinishConfirmation();
            }}
            type="button"
          >
            {completionIsSaving
              ? "Finishing..."
              : completionState.status === "error"
                ? "Retry finish"
                : needsPlacementConfirmation
                  ? "Choose starting point"
                  : "Finish check"}
          </button>
        </div>
      </header>

      <div className="el-benchmark-workspace">
        <details className="el-benchmark-review-drawer">
          <summary>Review answers or instructions</summary>
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
        </details>

        <section className="el-benchmark-work-area">
          <ItemPanel
            item={currentItem}
            itemCount={items.length}
            itemNumber={currentIndex + 1}
            key={currentItemId}
            kind={kind}
            onAccuracyDecision={recordFluencyAccuracyAndRoute}
            onResponseChange={updateCurrentResponse}
            onQuickScore={patch => updateCurrentResponse(patch, { advance: true })}
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
              ↶ Change previous answer
            </button>
            <p aria-live="polite">
              {isResponseComplete(kind, currentResponse, currentItem)
                ? "Answer saved."
                : hasResponseContent(currentResponse)
                  ? "More detail is needed here."
                  : kind === ASSESSMENT_KINDS.FLUENCY
                    ? "Complete the read above."
                    : "Choose one answer above — it saves and moves on."}
            </p>
          </nav>

          {requiresPlacementConfirmation && allItemsComplete && (
            <PlacementConfirmationPanel
              administrationRange={plan.route?.administrationRange}
              allowedMicrophases={placementAllowedMicrophases}
              assessmentKind={kind}
              confirmedPlacement={session.confirmedPlacement}
              defaultMicrophase={defaultPlacementMicrophase}
              key={`${kind}-${placementPreview?.candidatePlacement?.candidateMicrophase || "teacher-select"}-${confirmedPlacementMicrophase || "unconfirmed"}-${session.confirmedPlacement?.confirmedAt || "new"}`}
              onConfirm={confirmPlacement}
              normalRangeMicrophases={placementRangeMicrophases}
              panelRef={placementPanelRef}
              preview={placementPreview}
            />
          )}

          {showFinishConfirmation && canCompleteAssessment && (
            <FinishConfirmationPanel
              completionState={completionState}
              onCancel={() => {
                setShowFinishConfirmation(false);
                selectItem(items.length - 1);
              }}
              onConfirm={() => void completeAssessment()}
              panelRef={finishConfirmationRef}
              tally={finishTally}
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

      <footer className="el-benchmark-footer el-benchmark-footer-secondary">
        <details className="el-benchmark-footer-more">
          <summary>More options</summary>
          <button
            className="el-benchmark-button ghost danger-text"
            disabled={timerIsRunning}
            onClick={() => setShowDiscontinue(show => !show)}
            type="button"
          >
            {showDiscontinue ? "Close stop-early panel" : "Stop check early"}
          </button>
        </details>
      </footer>
    </main>
  );
}

ELBenchmarkAssessmentPage.getDecodingEvaluationPatch = getDecodingEvaluationPatch;
ELBenchmarkAssessmentPage.getAssessmentFinishTally = getAssessmentFinishTally;
ELBenchmarkAssessmentPage.getFluencyTimerInterruptionPatch = getFluencyTimerInterruptionPatch;
ELBenchmarkAssessmentPage.getFluencyTimerResetPatch = getFluencyTimerResetPatch;
ELBenchmarkAssessmentPage.isDiscontinueEvidenceComplete = isDiscontinueEvidenceComplete;
ELBenchmarkAssessmentPage.preserveTerminalSessionStatus = preserveTerminalSessionStatus;
