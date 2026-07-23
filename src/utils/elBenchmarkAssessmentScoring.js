import {
  EL_ADMINISTRATION_STATUSES,
  EL_BENCHMARK_IDS,
  EL_BENCHMARK_SCHEMA_VERSION,
  EL_DECODING_MICROPHASES,
  EL_ITEM_RESPONSE_STATUSES,
  getElBenchmarkPlan
} from "../data/elBenchmarkAssessmentCatalog.js";

export const EL_BENCHMARK_SCORING_VERSION = "2026.07.22-v2";
export const EL_BENCHMARK_ATTEMPT_SCHEMA_VERSION = 3;

const ADMINISTRATION_STATUS_SET = new Set(Object.values(EL_ADMINISTRATION_STATUSES));
const ITEM_STATUS_SET = new Set(Object.values(EL_ITEM_RESPONSE_STATUSES));
const PROSODY_DIMENSIONS = Object.freeze(["expression", "phrasing", "smoothness", "pace"]);

function toArray(value) {
  if (Array.isArray(value)) return value;
  return value === undefined || value === null ? [] : [value];
}

function round(value, places = 0) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function percent(numerator, denominator) {
  return denominator > 0 ? round((numerator / denominator) * 100) : null;
}

function normalizeOral(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/\//g, "")
    .replace(/[^a-z0-9' -]+/g, "")
    .replace(/[-\s]+/g, " ")
    .trim();
}

function normalizeSpelling(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ");
}

function asFiniteNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function responseFor(responses, itemId) {
  const response = responses && typeof responses === "object" ? responses[itemId] : null;
  return response && typeof response === "object" ? response : null;
}

function responseStatus(response) {
  if (!response) return EL_ITEM_RESPONSE_STATUSES.NOT_ADMINISTERED;
  if (ITEM_STATUS_SET.has(response.status)) return response.status;
  if (typeof response.isCorrect === "boolean" || typeof response.correct === "boolean") {
    return (response.isCorrect ?? response.correct)
      ? EL_ITEM_RESPONSE_STATUSES.CORRECT
      : EL_ITEM_RESPONSE_STATUSES.INCORRECT;
  }
  if (
    response.responseText !== undefined ||
    response.transcription !== undefined ||
    response.wordsAttempted !== undefined
  ) {
    return EL_ITEM_RESPONSE_STATUSES.RECORDED;
  }
  return EL_ITEM_RESPONSE_STATUSES.NOT_ADMINISTERED;
}

function normalizeAdministrationStatus(session = {}) {
  const value = session.administrationStatus || session.status || EL_ADMINISTRATION_STATUSES.IN_PROGRESS;
  if (!ADMINISTRATION_STATUS_SET.has(value)) {
    throw new RangeError(`Unsupported EL benchmark administration status: ${value}`);
  }
  return value;
}

function isExplicitlyCorrect(response, status) {
  if (typeof response?.isCorrect === "boolean") return response.isCorrect;
  if (typeof response?.correct === "boolean") return response.correct;
  if (status === EL_ITEM_RESPONSE_STATUSES.CORRECT || status === EL_ITEM_RESPONSE_STATUSES.SELF_CORRECTED) return true;
  if (status === EL_ITEM_RESPONSE_STATUSES.INCORRECT || status === EL_ITEM_RESPONSE_STATUSES.NO_RESPONSE) return false;
  return null;
}

function compareExpected(item, response) {
  // Open productions have many valid answers.  The authored examples are
  // prompts for the assessor, never an exhaustive machine-scored whitelist.
  if (item.teacherJudgmentRequired) return null;
  const given = normalizeOral(response?.responseText ?? response?.selectedAnswer ?? "");
  if (!given) return null;
  const expected = (item.expectedAnswers || []).map(normalizeOral);
  return expected.includes(given);
}

function errorTags(response) {
  return Array.isArray(response?.errorTags)
    ? Array.from(new Set(response.errorTags.map(tag => String(tag || "").trim()).filter(Boolean)))
    : [];
}

function hasRecordedResponseText(response) {
  return String(
    response?.responseText ?? response?.transcription ?? response?.selectedAnswer ?? ""
  ).trim().length > 0;
}

function hasQuickTeacherJudgment(response = {}) {
  return response?.responseCaptureMode === "quick_teacher_judgment" &&
    typeof (response.isCorrect ?? response.correct) === "boolean";
}

function requiresRecordedResponseText(status, response = {}) {
  return !hasQuickTeacherJudgment(response) && ![
    EL_ITEM_RESPONSE_STATUSES.NO_RESPONSE,
    EL_ITEM_RESPONSE_STATUSES.NOT_ADMINISTERED,
    EL_ITEM_RESPONSE_STATUSES.NOT_SCORABLE
  ].includes(status);
}

function responseStateValidationIssues(response, status) {
  if (!response || typeof response !== "object") return [];
  const explicitCorrect = typeof response.isCorrect === "boolean"
    ? response.isCorrect
    : typeof response.correct === "boolean" ? response.correct : null;
  const statusMeansCorrect = [
    EL_ITEM_RESPONSE_STATUSES.CORRECT,
    EL_ITEM_RESPONSE_STATUSES.SELF_CORRECTED
  ].includes(status);
  const statusMeansIncorrect = [
    EL_ITEM_RESPONSE_STATUSES.INCORRECT,
    EL_ITEM_RESPONSE_STATUSES.NO_RESPONSE
  ].includes(status);
  return (
    (statusMeansCorrect && explicitCorrect === false) ||
    (statusMeansIncorrect && explicitCorrect === true)
  ) ? ["response_status_conflicts_with_correctness"] : [];
}

function normalizeDecodingEntry(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function decodingResponseStateValidationIssues(response, status, item = {}) {
  const issues = responseStateValidationIssues(response, status);
  if (!response || typeof response !== "object") return issues;
  const selfCorrected = response.selfCorrected === true;
  const transcription = normalizeDecodingEntry(
    response.responseText ?? response.transcription ?? response.selectedAnswer
  );
  const accepted = toArray(
    item.acceptedResponses || item.acceptedReadings || item.targetWord || item.displayWord || item.word
  ).map(normalizeDecodingEntry).filter(Boolean);
  const matchesTarget = Boolean(transcription && accepted.includes(transcription));
  if (status === EL_ITEM_RESPONSE_STATUSES.NO_RESPONSE) {
    if (response.automatic === true || selfCorrected) issues.push("decoding_no_response_state_conflict");
    if (transcription) issues.push("decoding_no_response_has_transcription");
  } else if (status === EL_ITEM_RESPONSE_STATUSES.INCORRECT) {
    if (response.automatic === true || selfCorrected) issues.push("decoding_incorrect_state_conflict");
    if (matchesTarget) issues.push("decoding_incorrect_response_matches_target");
  } else if (status === EL_ITEM_RESPONSE_STATUSES.SELF_CORRECTED) {
    if (response.automatic === true) issues.push("decoding_self_correction_cannot_be_automatic");
    if (transcription && !matchesTarget) issues.push("decoding_accurate_response_mismatch");
  } else if (status === EL_ITEM_RESPONSE_STATUSES.CORRECT && selfCorrected) {
    issues.push("decoding_correct_status_conflicts_with_self_correction");
  } else if (status === EL_ITEM_RESPONSE_STATUSES.CORRECT && transcription && !matchesTarget) {
    issues.push("decoding_accurate_response_mismatch");
  }
  if (response.automatic === true && (response.isCorrect === false || response.correct === false)) {
    issues.push("decoding_incorrect_response_cannot_be_automatic");
  }
  return Array.from(new Set(issues));
}

function auditTrail(response, computed = {}) {
  const teacherOverride = response?.teacherOverride && typeof response.teacherOverride === "object"
    ? { ...response.teacherOverride }
    : null;
  const explicitCorrect = typeof response?.isCorrect === "boolean" || typeof response?.correct === "boolean";
  return {
    evaluationSource: teacherOverride
      ? "teacher_override"
      : response?.responseCaptureMode === "quick_teacher_judgment"
        ? "quick_teacher_judgment"
      : explicitCorrect
        ? "teacher_judgment"
        : computed.evaluationSource || "scoring_rule",
    teacherOverride,
    overrideReason: teacherOverride?.reason || response?.overrideReason || ""
  };
}

function baseQuestionRecord(item, response, result = {}) {
  const status = result.status || responseStatus(response);
  const notScorableReason = String(response?.notScorableReason || result.notScorableReason || "").trim();
  const notScorableNote = String(response?.notScorableNote || "").trim();
  const validationIssues = Array.isArray(result.validationIssues) ? [...result.validationIssues] : [];
  if (status === EL_ITEM_RESPONSE_STATUSES.NOT_SCORABLE) {
    if (!notScorableReason) validationIssues.push("not_scorable_reason_required");
    if (notScorableReason.toLowerCase() === "other" && !notScorableNote) {
      validationIssues.push("not_scorable_note_required");
    }
  }
  return {
    questionId: item.id,
    prompt: item.prompt || item.teacherSay || "",
    targetWord: item.targetWord || "",
    targetPattern: item.strand || item.microphase || "",
    itemKey: item.targetWord || item.strand || item.bandId || item.id,
    itemType: item.kind,
    correctAnswer: item.expectedAnswers || item.acceptedSpellings || item.targetWord || "",
    selectedAnswer: response?.responseText ?? response?.transcription ?? response?.selectedAnswer ?? "",
    isCorrect: result.isCorrect ?? null,
    responseStatus: status,
    administrationStatus: status === EL_ITEM_RESPONSE_STATUSES.NOT_ADMINISTERED
      ? "not_administered"
      : status === EL_ITEM_RESPONSE_STATUSES.NOT_SCORABLE
        ? "not_scorable"
        : "administered",
    notAdministeredReason: result.notAdministeredReason || "",
    notScorableReason,
    notScorableNote,
    errorTags: errorTags(response),
    featureTags: item.featureTags || [],
    strand: item.strand || "",
    microphase: item.microphase || "",
    bandId: item.bandId || "",
    anchorCycle: item.anchorCycle ?? null,
    responseTimeMs: asFiniteNumber(response?.elapsedMs),
    responseCaptureMode: String(response?.responseCaptureMode || (
      item.kind === "fluency_passage" ? "timed_reading_observation" : "legacy_unspecified"
    )),
    responseDetailCaptured: hasRecordedResponseText(response),
    outcomeRecordedAt: response?.outcomeRecordedAt || "",
    automatic: result.automatic ?? null,
    selfCorrected: Boolean(response?.selfCorrected || status === EL_ITEM_RESPONSE_STATUSES.SELF_CORRECTED),
    notes: response?.notes || "",
    validationIssues: Array.from(new Set(validationIssues)),
    ...auditTrail(response, result)
  };
}

function validationIssuesFromRecords(records = []) {
  return records.flatMap(record => (
    Array.isArray(record.validationIssues)
      ? record.validationIssues.map(issue => `${record.questionId}:${issue}`)
      : []
  ));
}

function completionFromRecords(records, plannedQuestionCount = records.length) {
  const administeredCount = records.filter(record => record.administrationStatus === "administered").length;
  const scoredCount = records.filter(record => typeof record.isCorrect === "boolean").length;
  return {
    plannedQuestionCount,
    administeredCount,
    scoredCount,
    notScorableCount: records.filter(record => record.administrationStatus === "not_scorable").length,
    notAdministeredCount: records.filter(record => record.administrationStatus === "not_administered").length,
    completionPercent: percent(administeredCount, plannedQuestionCount)
  };
}

function provisionalPlacement({ label = "", status = "provisional", evidence = {}, reason = "" } = {}) {
  return {
    framework: "LiteracyPath provisional",
    isProvisional: true,
    status,
    label: label || "LiteracyPath provisional — placement not available",
    evidence,
    reason,
    disclaimer: "This is a LiteracyPath instructional indication, not an official EL Education result or a nationally normed placement."
  };
}

function scoreStatusFor(administrationStatus, completion, hasScore = true) {
  if (administrationStatus === EL_ADMINISTRATION_STATUSES.NOT_ADMINISTERED) return "not_administered";
  if (administrationStatus === EL_ADMINISTRATION_STATUSES.NOT_SCORABLE) return "not_scorable";
  if (administrationStatus === EL_ADMINISTRATION_STATUSES.DISCONTINUED) return "discontinued";
  if (administrationStatus === EL_ADMINISTRATION_STATUSES.PARTIAL) return "partial";
  if (!hasScore) return "not_scorable";
  if (administrationStatus !== EL_ADMINISTRATION_STATUSES.COMPLETED) return administrationStatus;
  return completion.administeredCount < completion.plannedQuestionCount ||
    completion.scoredCount < completion.administeredCount
    ? "partial"
    : "scored";
}

function scorePhonologicalAwareness(plan, responses, administrationStatus) {
  const records = plan.items.map(item => {
    const response = responseFor(responses, item.id);
    const status = responseStatus(response);
    let isCorrect = isExplicitlyCorrect(response, status);
    let evaluationSource = "teacher_judgment";
    const responseTextMissing = requiresRecordedResponseText(status, response) && !hasRecordedResponseText(response);
    const stateIssues = responseStateValidationIssues(response, status);
    if (isCorrect === null && status === EL_ITEM_RESPONSE_STATUSES.RECORDED) {
      isCorrect = compareExpected(item, response);
      evaluationSource = "authored_answer_key";
    }
    if (status === EL_ITEM_RESPONSE_STATUSES.NOT_SCORABLE || status === EL_ITEM_RESPONSE_STATUSES.NOT_ADMINISTERED) {
      isCorrect = null;
    }
    if (responseTextMissing) isCorrect = null;
    if (stateIssues.length) isCorrect = null;
    return baseQuestionRecord(item, response, {
      status,
      isCorrect,
      evaluationSource,
      validationIssues: [
        ...(responseTextMissing ? ["response_transcription_required"] : []),
        ...stateIssues
      ]
    });
  });
  const strands = Array.from(new Set(plan.items.map(item => item.strand))).map(strand => {
    const strandRecords = records.filter(record => record.strand === strand);
    const scorable = strandRecords.filter(record => typeof record.isCorrect === "boolean");
    const correct = scorable.filter(record => record.isCorrect).length;
    const accuracy = percent(correct, scorable.length);
    return {
      strand,
      plannedCount: strandRecords.length,
      administeredCount: strandRecords.filter(record => record.administrationStatus === "administered").length,
      scoredCount: scorable.length,
      correctCount: correct,
      incorrectCount: scorable.length - correct,
      accuracy,
      evidenceStatus: scorable.length === 0
        ? "not_assessed"
        : scorable.length < strandRecords.length
          ? "partial"
          : "complete"
    };
  });
  const scorable = records.filter(record => typeof record.isCorrect === "boolean");
  const correctCount = scorable.filter(record => record.isCorrect).length;
  const accuracy = percent(correctCount, scorable.length);
  const completion = completionFromRecords(records);
  const validationIssues = validationIssuesFromRecords(records);
  const scoreStatus = validationIssues.length
    ? "partial"
    : scoreStatusFor(administrationStatus, completion, scorable.length > 0);
  const placement = scoreStatus === "scored"
    ? provisionalPlacement({
        status: "descriptive_evidence",
        label: "LiteracyPath provisional — descriptive sound-awareness evidence",
        evidence: {
          accuracy,
          strands: strands.map(row => ({
            strand: row.strand,
            scoredCount: row.scoredCount,
            correctCount: row.correctCount,
            incorrectCount: row.incorrectCount,
            accuracy: row.accuracy,
            evidenceStatus: row.evidenceStatus
          }))
        },
        reason: "The source overview supplies no numerical cut score for this original form; review the raw strand evidence with oral-language and classroom observations."
      })
    : provisionalPlacement({ status: "not_available", reason: `Placement withheld because scoring status is ${scoreStatus}.` });
  const strandsWithObservedErrors = strands.filter(row => row.incorrectCount > 0).map(row => row.strand);

  return {
    questionRecords: records,
    completion,
    scoreStatus,
    totalQuestions: scorable.length,
    scoredCount: scorable.length,
    correctCount,
    incorrectCount: scorable.length - correctCount,
    accuracy,
    subtestScores: { strands },
    metrics: { strandProfile: strands },
    validationIssues,
    candidatePlacement: placement,
    stopBand: "",
    stopCycle: null,
    stopReason: "",
    recommendations: strandsWithObservedErrors.length
      ? [`Review the raw correct/incorrect evidence in these strands: ${strandsWithObservedErrors.join(", ")}; no unsourced cut score was applied.`]
      : ["Review the raw strand profile with classroom observation; do not convert it to a normed label."],
    observations: strands.filter(row => row.evidenceStatus !== "complete").map(row => `${row.strand}: ${row.evidenceStatus}`)
  };
}

function scoreEncoding(plan, responses, administrationStatus, session) {
  const itemResults = plan.items.map(item => {
    const response = responseFor(responses, item.id);
    const status = responseStatus(response);
    const transcription = normalizeSpelling(response?.transcription ?? response?.responseText ?? "");
    const responseTextMissing = requiresRecordedResponseText(status, response) && !transcription;
    const accepted = (item.acceptedSpellings || []).map(normalizeSpelling);
    const authoredPlausible = (item.plausibleSpellings || []).map(normalizeSpelling);
    const stateIssues = responseStateValidationIssues(response, status);
    const computedExact = Boolean(transcription) && accepted.includes(transcription);
    const explicitExact = typeof response?.exact === "boolean"
      ? response.exact
      : isExplicitlyCorrect(response, status);
    const quickJudgment = hasQuickTeacherJudgment(response);
    const exactContradiction = Boolean(transcription) &&
      typeof explicitExact === "boolean" &&
      explicitExact !== computedExact;
    const exactOverride = response?.teacherOverride && typeof response.teacherOverride === "object"
      ? response.teacherOverride
      : null;
    const exactOverrideField = String(exactOverride?.field || "").trim().toLowerCase();
    const exactOverrideValid = exactContradiction &&
      ["exact", "exact_spelling"].includes(exactOverrideField) &&
      typeof exactOverride?.to === "boolean" &&
      exactOverride.to === explicitExact &&
      Boolean(String(exactOverride?.reason || "").trim());
    const validationIssues = [
      ...(responseTextMissing ? ["response_transcription_required"] : []),
      ...stateIssues
    ];
    if (exactContradiction && !exactOverrideValid) {
      validationIssues.push("encoding_exact_judgment_conflicts_with_transcription");
      if (["exact", "exact_spelling"].includes(exactOverrideField) && !String(exactOverride?.reason || "").trim()) {
        validationIssues.push("encoding_exact_override_reason_required");
      }
    }

    let exact = transcription
      ? computedExact
      : quickJudgment && typeof explicitExact === "boolean"
        ? explicitExact
        : null;
    if (exactOverrideValid) exact = explicitExact;
    if (status === EL_ITEM_RESPONSE_STATUSES.NO_RESPONSE) exact = false;
    if (status === EL_ITEM_RESPONSE_STATUSES.NOT_SCORABLE || status === EL_ITEM_RESPONSE_STATUSES.NOT_ADMINISTERED) exact = null;
    if (responseTextMissing) exact = null;
    if (stateIssues.length) exact = null;

    let plausible = null;
    let plausibilitySource = "not_judged";
    if (exact === true) {
      plausible = true;
      plausibilitySource = "exact_spelling";
    } else if (typeof response?.plausible === "boolean") {
      plausible = response.plausible;
      plausibilitySource = response.teacherOverride ? "teacher_override" : "teacher_judgment";
    } else if (response?.evaluation === "plausible") {
      plausible = true;
      plausibilitySource = "teacher_judgment";
    } else if (response?.evaluation === "implausible") {
      plausible = false;
      plausibilitySource = "teacher_judgment";
    } else if (transcription && authoredPlausible.includes(transcription)) {
      plausible = true;
      plausibilitySource = "authored_example";
    } else if (status === EL_ITEM_RESPONSE_STATUSES.NO_RESPONSE) {
      plausible = false;
      plausibilitySource = "no_response";
    }
    if (responseTextMissing) {
      plausible = null;
      plausibilitySource = "not_judged";
    }
    if (stateIssues.length) {
      plausible = null;
      plausibilitySource = "not_judged";
    }

    const record = baseQuestionRecord(item, response, {
      status,
      isCorrect: exact,
      validationIssues,
      evaluationSource: exactOverrideValid
        ? "teacher_override"
        : quickJudgment
          ? "quick_teacher_judgment"
          : "exact_spelling_rule"
    });
    return {
      ...record,
      transcription,
      exact,
      exactOverrideApplied: exactOverrideValid,
      plausible,
      plausibleOnly: plausible === true && exact === false,
      plausibilitySource,
      computedExact,
      authoredPlausibleMatch: Boolean(transcription) && authoredPlausible.includes(transcription)
    };
  });
  const exactScored = itemResults.filter(row => typeof row.exact === "boolean");
  const exactCount = exactScored.filter(row => row.exact).length;
  const plausibleJudged = itemResults.filter(row => typeof row.plausible === "boolean");
  const plausibleCount = plausibleJudged.filter(row => row.plausible).length;
  const featureTags = Array.from(new Set(plan.items.flatMap(item => item.featureTags || [])));
  const featureProfile = featureTags.map(feature => {
    const rows = itemResults.filter((row, index) => plan.items[index].featureTags?.includes(feature));
    const exactRows = rows.filter(row => typeof row.exact === "boolean");
    const plausibleRows = rows.filter(row => typeof row.plausible === "boolean");
    return {
      feature,
      plannedCount: rows.length,
      exactScoredCount: exactRows.length,
      exactCount: exactRows.filter(row => row.exact).length,
      exactAccuracy: percent(exactRows.filter(row => row.exact).length, exactRows.length),
      plausibilityJudgedCount: plausibleRows.length,
      plausibleCount: plausibleRows.filter(row => row.plausible).length,
      plausibleAccuracy: percent(plausibleRows.filter(row => row.plausible).length, plausibleRows.length)
    };
  });
  const exactAccuracy = percent(exactCount, exactScored.length);
  const plausibleAccuracy = percent(plausibleCount, plausibleJudged.length);
  const completion = completionFromRecords(itemResults);
  const validationIssues = validationIssuesFromRecords(itemResults);
  const scoreStatus = validationIssues.length
    ? "partial"
    : scoreStatusFor(administrationStatus, completion, exactScored.length > 0);
  const placement = scoreStatus === "scored"
    ? {
        ...provisionalPlacement({
        status: "descriptive_evidence",
        label: "LiteracyPath provisional — descriptive encoding evidence",
        evidence: {
          exactAccuracy,
          plausibleAccuracy,
          plausibilityJudgedCount: plausibleJudged.length,
          expectedMicrophase: plan.route.expectedMicrophase,
          expectedCycle: plan.route.expectedCycle,
          administrationRange: plan.route.administrationRange
        },
        reason: "The overview uses Encoding to choose the Decoding start, but supplies no cut score for this original form. Raw exact/plausible evidence is retained and teacher confirmation is required."
      }),
        candidateMicrophase: null,
        candidateCycle: null,
        requiresTeacherConfirmation: true,
        expectedMicrophase: plan.route.expectedMicrophase,
        expectedCycle: plan.route.expectedCycle,
        availableRange: plan.route.administrationRange
      }
    : {
        ...provisionalPlacement({ status: "not_available", reason: `Placement withheld because scoring status is ${scoreStatus}.` }),
        candidateMicrophase: null,
        candidateCycle: null,
        requiresTeacherConfirmation: true,
        expectedMicrophase: plan.route.expectedMicrophase,
        expectedCycle: plan.route.expectedCycle,
        availableRange: plan.route.administrationRange
      };
  const unjudgedPlausibility = itemResults.filter(row => row.exact === false && row.plausible === null).length;

  return {
    questionRecords: itemResults,
    completion,
    scoreStatus,
    totalQuestions: exactScored.length,
    scoredCount: exactScored.length,
    correctCount: exactCount,
    incorrectCount: exactScored.length - exactCount,
    accuracy: exactAccuracy,
    subtestScores: {
      exact: { scoredCount: exactScored.length, correctCount: exactCount, accuracy: exactAccuracy },
      plausible: { judgedCount: plausibleJudged.length, plausibleCount, accuracy: plausibleAccuracy },
      features: featureProfile
    },
    metrics: {
      exactCount,
      exactAccuracy,
      plausibleCount,
      plausibleAccuracy,
      plausibleOnlyCount: itemResults.filter(row => row.plausibleOnly).length,
      plausibilityJudgedCount: plausibleJudged.length,
      plausibilityUnjudgedCount: unjudgedPlausibility,
      featureProfile
    },
    validationIssues,
    candidatePlacement: placement,
    stopBand: "",
    stopCycle: null,
    stopReason: "",
    recommendations: [
      ...(unjudgedPlausibility
        ? [`Review phonological plausibility for ${unjudgedPlausibility} non-exact response${unjudgedPlausibility === 1 ? "" : "s"}; the scorer did not guess.`, "Confirm the named decoding start band; no unvalidated spelling-to-microphase rule was applied."]
        : ["Use exact and plausible profiles together when planning spelling instruction.", "Confirm the named decoding start band; no unvalidated spelling-to-microphase rule was applied."]),
      ...letterKnowledgeFollowUp(session),
      ...earlyPartialFollowUp(session)
    ],
    observations: itemResults
      .filter(row => row.teacherOverride)
      .map(row => `${row.questionId}: teacher override retained${row.overrideReason ? ` (${row.overrideReason})` : ""}.`)
  };
}

function microphaseForId(id) {
  return EL_DECODING_MICROPHASES.find(row => row.id === id) || null;
}

function nextMicrophase(id) {
  const index = EL_DECODING_MICROPHASES.findIndex(row => row.id === id);
  return index >= 0 && index < EL_DECODING_MICROPHASES.length - 1
    ? EL_DECODING_MICROPHASES[index + 1]
    : null;
}

function stopRuleOverrideFor(session, bandId) {
  const raw = session?.stopRuleOverrides?.[bandId] ||
    session?.bandOverrides?.[bandId] ||
    session?.decodingBandDecisions?.[bandId] ||
    null;
  if (!raw || typeof raw !== "object") return null;
  const continueAdministration = raw.continueAdministration === true ||
    raw.ignoreStop === true ||
    raw.action === "continue";
  if (!continueAdministration) return null;
  return {
    continueAdministration: true,
    reason: String(raw.overrideReason || raw.reason || ""),
    decisionReason: String(raw.reason || ""),
    teacherId: String(raw.teacherId || raw.by || ""),
    recordedAt: String(raw.recordedAt || raw.decidedAt || raw.at || ""),
    source: session?.decodingBandDecisions?.[bandId] === raw ? "decodingBandDecisions" : "legacy_override"
  };
}

function discontinueReasonFor(session) {
  return String(session?.discontinueReason || session?.discontinuationReason || "");
}

function routingProvenanceFor(session = {}) {
  const nested = session.routingProvenance && typeof session.routingProvenance === "object"
    ? session.routingProvenance
    : session.routing && typeof session.routing === "object"
      ? session.routing
      : {};
  const confirmedPlacement = session.confirmedPlacement ?? nested.confirmedPlacement ?? null;
  return {
    confirmedPlacement: confirmedPlacement && typeof confirmedPlacement === "object"
      ? { ...confirmedPlacement }
      : confirmedPlacement || null,
    placementSource: String(session.placementSource || nested.placementSource || ""),
    routeSource: String(session.routeSource || nested.routeSource || ""),
    sourceAttemptId: String(session.sourceAttemptId || nested.sourceAttemptId || "")
  };
}

function confirmedMicrophaseFor(session = {}) {
  const { confirmedPlacement } = routingProvenanceFor(session);
  const raw = confirmedPlacement && typeof confirmedPlacement === "object"
    ? confirmedPlacement.microphase || confirmedPlacement.candidateMicrophase || confirmedPlacement.id || ""
    : confirmedPlacement || "";
  return String(raw).trim().toLowerCase().replace(/[ -]+/g, "_");
}

function earlyPartialFollowUp(session = {}) {
  return confirmedMicrophaseFor(session) === "early_partial"
    ? ["Teacher-confirmed Early Partial placement: administer the Letter Identification assessment to check letter-name and letter-sound instruction needs, as directed in the overview."]
    : [];
}

function letterKnowledgeFollowUp(session = {}) {
  return discontinueReasonFor(session) === "letter_knowledge_needed"
    ? ["Pause further benchmark sequencing and administer Assessment 1: Letter Name and Sound Recognition before resuming Encoding or Decoding."]
    : [];
}

function scoreDecoding(plan, responses, administrationStatus, session) {
  let records = plan.items.map(item => {
    const response = responseFor(responses, item.id);
    const status = responseStatus(response);
    let isCorrect = isExplicitlyCorrect(response, status);
    const responseTextMissing = requiresRecordedResponseText(status, response) && !hasRecordedResponseText(response);
    const stateIssues = decodingResponseStateValidationIssues(response, status, item);
    if (status === EL_ITEM_RESPONSE_STATUSES.NOT_SCORABLE || status === EL_ITEM_RESPONSE_STATUSES.NOT_ADMINISTERED) {
      isCorrect = null;
    }
    if (responseTextMissing) isCorrect = null;
    if (stateIssues.length) isCorrect = null;
    const selfCorrected = Boolean(response?.selfCorrected || status === EL_ITEM_RESPONSE_STATUSES.SELF_CORRECTED);
    // An accurate, non-self-corrected word still needs an explicit automaticity
    // judgement. Incorrect and self-corrected readings are defensibly
    // non-automatic; an omitted judgement on an otherwise accurate word stays
    // null and cannot complete a band or trigger the stopping rule.
    let automatic = null;
    if (isCorrect === false || selfCorrected) automatic = false;
    else if (isCorrect === true && typeof response?.automatic === "boolean") automatic = response.automatic;
    return baseQuestionRecord(item, response, {
      status,
      isCorrect,
      automatic,
      validationIssues: [
        ...(responseTextMissing ? ["response_transcription_required"] : []),
        ...stateIssues
      ],
      evaluationSource: "teacher_judgment"
    });
  });

  const bandIds = Array.from(new Set(plan.items.map(item => item.bandId)));
  const buildBands = () => bandIds.map(bandId => {
    const bandRecords = records.filter(record => record.bandId === bandId);
    const scorable = bandRecords.filter(record => typeof record.isCorrect === "boolean");
    const automaticityJudged = bandRecords.filter(record => typeof record.automatic === "boolean");
    const accurateCount = scorable.filter(record => record.isCorrect).length;
    const automaticCount = bandRecords.filter(record => record.automatic === true).length;
    const completeForStopRule = scorable.length === 8 && automaticityJudged.length === 8;
    const microphase = microphaseForId(bandId);
    const rawCriterionMet = completeForStopRule ? automaticCount <= 5 : null;
    const stopRuleOverride = rawCriterionMet ? stopRuleOverrideFor(session, bandId) : null;
    return {
      bandId,
      microphase: bandId,
      label: microphase?.label || bandId,
      anchorCycle: microphase?.anchorCycle ?? null,
      plannedCount: 8,
      administeredCount: bandRecords.filter(record => record.administrationStatus === "administered").length,
      scoredCount: scorable.length,
      accurateCount,
      inaccurateCount: scorable.length - accurateCount,
      accuracy: percent(accurateCount, scorable.length),
      automaticityJudgedCount: automaticityJudged.length,
      automaticityMissingCount: 8 - automaticityJudged.length,
      automaticCount,
      automaticity: percent(automaticCount, automaticityJudged.length),
      selfCorrectionCount: bandRecords.filter(record => record.selfCorrected).length,
      stopEvidence: {
        rule: "automatic_count_lte_5_of_8",
        threshold: 5,
        denominator: 8,
        evidenceStatus: completeForStopRule
          ? "complete"
          : scorable.length || automaticityJudged.length
            ? "partial"
            : "not_available",
        criterionMet: rawCriterionMet,
        effectiveStop: rawCriterionMet === true && !stopRuleOverride,
        observedAutomaticCount: automaticCount,
        automaticityJudgedCount: automaticityJudged.length,
        missingAutomaticityJudgments: 8 - automaticityJudged.length,
        teacherOverride: stopRuleOverride
      }
    };
  });

  let bands = buildBands();
  const automaticStop = bands.find(band => band.stopEvidence.effectiveStop === true) || null;
  const manualStopId = session.stopBand || session.discontinuedAtBand || "";
  const stopBand = automaticStop?.bandId || manualStopId;
  const stopIndex = bandIds.indexOf(stopBand);
  if (stopIndex >= 0) {
    const stoppedAfter = new Set(bandIds.slice(stopIndex + 1));
    records = records.map(record => {
      if (!stoppedAfter.has(record.bandId) || record.administrationStatus === "administered") return record;
      return {
        ...record,
        responseStatus: EL_ITEM_RESPONSE_STATUSES.NOT_ADMINISTERED,
        administrationStatus: "not_administered",
        notAdministeredReason: `stopped_after_${stopBand}`,
        isCorrect: null,
        automatic: null
      };
    });
    bands = buildBands();
  } else if (administrationStatus === EL_ADMINISTRATION_STATUSES.DISCONTINUED) {
    records = records.map(record => record.administrationStatus === "not_administered"
      ? {
          ...record,
          notAdministeredReason: discontinueReasonFor(session) || "session_discontinued"
        }
      : record);
    bands = buildBands();
  }

  const scorable = records.filter(record => typeof record.isCorrect === "boolean");
  const correctCount = scorable.filter(record => record.isCorrect).length;
  const automaticCount = records.filter(record => record.automatic === true).length;
  const completion = completionFromRecords(records);
  const requiredQuestionCount = automaticStop && stopIndex >= 0 ? (stopIndex + 1) * 8 : records.length;
  const requiredRecords = records.slice(0, requiredQuestionCount);
  const requiredScoredCount = requiredRecords.filter(record => typeof record.isCorrect === "boolean").length;
  const requiredAutomaticityCount = requiredRecords.filter(record => typeof record.automatic === "boolean").length;
  completion.requiredQuestionCount = requiredQuestionCount;
  completion.requiredScoredCount = requiredScoredCount;
  completion.requiredAutomaticityCount = requiredAutomaticityCount;
  completion.completedByStopRule = Boolean(
    automaticStop &&
    requiredScoredCount === requiredQuestionCount &&
    requiredAutomaticityCount === requiredQuestionCount
  );
  const validationIssues = validationIssuesFromRecords(records);
  let scoreStatus;
  if (validationIssues.length) scoreStatus = "partial";
  else if (administrationStatus === EL_ADMINISTRATION_STATUSES.NOT_ADMINISTERED) scoreStatus = "not_administered";
  else if (administrationStatus === EL_ADMINISTRATION_STATUSES.NOT_SCORABLE) scoreStatus = "not_scorable";
  else if (administrationStatus === EL_ADMINISTRATION_STATUSES.DISCONTINUED) scoreStatus = "discontinued";
  else if (administrationStatus === EL_ADMINISTRATION_STATUSES.PARTIAL || administrationStatus === EL_ADMINISTRATION_STATUSES.IN_PROGRESS) scoreStatus = "partial";
  else if (administrationStatus === EL_ADMINISTRATION_STATUSES.NOT_STARTED) scoreStatus = "not_started";
  else if (
    requiredScoredCount === requiredQuestionCount &&
    requiredAutomaticityCount === requiredQuestionCount &&
    requiredQuestionCount > 0
  ) scoreStatus = "scored";
  else scoreStatus = "partial";
  // Responses entered after an earlier stop remain in the audit trail, but
  // they cannot influence routing, placement, or the Fluency handoff.
  const routeBands = stopIndex >= 0 ? bands.slice(0, stopIndex + 1) : bands;
  const completeBands = routeBands.filter(band => band.stopEvidence.evidenceStatus === "complete");
  const fluencyBand = completeBands.filter(band => band.automaticCount > 5).at(-1) || null;
  const fluencyMicrophase = fluencyBand ? microphaseForId(fluencyBand.bandId) : null;
  const fluencyStartMicrophase = fluencyMicrophase
    ? {
        microphase: fluencyMicrophase.id,
        cycle: fluencyMicrophase.anchorCycle,
        label: fluencyMicrophase.label,
        evidence: {
          automaticCount: fluencyBand.automaticCount,
          denominator: 8,
          accurateCount: fluencyBand.accurateCount,
          rule: "last_completed_band_with_more_than_5_automatic"
        }
      }
    : null;
  let candidate = null;
  let candidateAtCeiling = false;
  if (automaticStop) {
    candidate = microphaseForId(automaticStop.bandId);
  } else if (completeBands.length) {
    candidate = nextMicrophase(completeBands.at(-1).bandId);
    if (!candidate && completeBands.at(-1).bandId === EL_DECODING_MICROPHASES.at(-1)?.id) {
      candidate = microphaseForId(completeBands.at(-1).bandId);
      candidateAtCeiling = true;
    }
  }
  const placement = candidate
    ? {
        ...provisionalPlacement({
          label: `LiteracyPath provisional — candidate ${candidate.label}${candidate.anchorCycle ? ` (Cycle ${candidate.anchorCycle} anchor)` : ""}`,
          evidence: {
            candidateMicrophase: candidate.id,
            candidateCycle: candidate.anchorCycle,
            expectedMicrophase: plan.route.expectedMicrophase,
            expectedCycle: plan.route.expectedCycle,
            completedBands: completeBands.map(band => band.bandId)
          },
          reason: automaticStop
            ? `${automaticStop.automaticCount} of 8 words were automatic in ${automaticStop.label}.`
            : candidateAtCeiling
              ? "All eight words in the highest named microphase were judged automatic; no higher named band exists, so the candidate is capped at the documented ceiling."
              : "All completed bands had more than five automatic words; the next named band is the candidate."
        }),
        candidateMicrophase: candidate.id,
        candidateCycle: candidate.anchorCycle,
        candidateAtCeiling,
        requiresTeacherConfirmation: true,
        expectedMicrophase: plan.route.expectedMicrophase,
        expectedCycle: plan.route.expectedCycle
      }
    : {
        ...provisionalPlacement({ status: "not_available", reason: "No complete eight-item band was available for placement evidence." }),
        candidateMicrophase: null,
        candidateCycle: null,
        requiresTeacherConfirmation: true,
        expectedMicrophase: plan.route.expectedMicrophase,
        expectedCycle: plan.route.expectedCycle
      };
  const stopMeta = microphaseForId(stopBand);
  const responsesAfterStop = stopIndex >= 0
    ? records.filter(record => bandIds.indexOf(record.bandId) > stopIndex && record.administrationStatus === "administered")
    : [];

  return {
    questionRecords: records,
    completion,
    scoreStatus,
    totalQuestions: scorable.length,
    scoredCount: scorable.length,
    correctCount,
    incorrectCount: scorable.length - correctCount,
    accuracy: percent(correctCount, scorable.length),
    subtestScores: { bands },
    metrics: {
      accurateCount: correctCount,
      accuracy: percent(correctCount, scorable.length),
      automaticCount,
      automaticityJudgedCount: records.filter(record => typeof record.automatic === "boolean").length,
      automaticityMissingCount: records.filter(record => typeof record.isCorrect === "boolean" && record.automatic === null).length,
      automaticity: percent(automaticCount, records.filter(record => typeof record.automatic === "boolean").length),
      bandProfile: bands,
      expectedMicrophase: plan.route.expectedMicrophase,
      expectedCycle: plan.route.expectedCycle,
      selectedStartMicrophase: plan.route.selectedStartMicrophase,
      fluencyStartMicrophase
    },
    validationIssues,
    candidatePlacement: placement,
    fluencyStartMicrophase,
    stopBand: stopBand || "",
    stopCycle: stopMeta?.anchorCycle ?? null,
    stopCycleAnchor: stopMeta?.anchorCycle ?? null,
    stopCycleAnchorLabel: Number.isInteger(stopMeta?.anchorCycle)
      ? `Cycle ${stopMeta.anchorCycle} anchor`
      : "No single cycle anchor supplied",
    stopReason: automaticStop
      ? "automatic_count_lte_5_of_8"
      : stopBand
        ? discontinueReasonFor(session) || "teacher_discontinued"
        : "",
    recommendations: [
      ...(candidate
        ? [`Use ${candidate.label} as a LiteracyPath provisional candidate and confirm it with encoding and classroom reading evidence.`]
        : ["Complete one full eight-item band before making a decoding placement indication."]),
      ...earlyPartialFollowUp(session)
    ],
    observations: [
      ...bands.filter(band => band.stopEvidence.evidenceStatus === "partial").map(band => `${band.label}: stopping evidence is partial, not a completed ≤5-of-8 decision.`),
      ...bands.filter(band => band.stopEvidence.teacherOverride).map(band => `${band.label}: ≤5-of-8 stopping evidence was overridden to continue${band.stopEvidence.teacherOverride.reason ? ` (${band.stopEvidence.teacherOverride.reason})` : "; no reason was recorded"}.`),
      ...(responsesAfterStop.length ? [`${responsesAfterStop.length} response${responsesAfterStop.length === 1 ? " was" : "s were"} recorded after the stop band and retained.`] : []),
      ...records.filter(record => record.teacherOverride).map(record => `${record.questionId}: teacher override retained${record.overrideReason ? ` (${record.overrideReason})` : ""}.`)
    ]
  };
}

function explicitFluencyAccuracyJudgment(response) {
  for (const value of [
    response?.accurate,
    response?.passageAccurate,
    response?.teacherAccuracyJudgment,
    response?.accurateInOneMinute
  ]) {
    if (typeof value === "boolean") return value;
  }
  return null;
}

function scoreFluency(plan, responses, administrationStatus, session) {
  const passages = plan.passages?.length ? plan.passages : plan.items;
  const globallySuppressed = [
    EL_ADMINISTRATION_STATUSES.NOT_SCORABLE,
    EL_ADMINISTRATION_STATUSES.NOT_ADMINISTERED
  ].includes(administrationStatus);
  const rawRecords = passages.map(passage => {
    const response = responseFor(responses, passage.id);
    const status = responseStatus(response);
    const issues = [];
    const wordsAttempted = asFiniteNumber(response?.wordsAttempted);
    const errors = asFiniteNumber(response?.errors);
    const selfCorrections = asFiniteNumber(response?.selfCorrections);
    const elapsedSeconds = asFiniteNumber(response?.elapsedSeconds);
    const finishedEarly = response?.finishedEarly === true;
    const timerStatus = String(response?.timerStatus || "");
    const timerInterrupted = response?.timerInterrupted === true;
    const zeroWordsReached = response?.zeroWordsReached === true;
    const recordedAccuracyJudgment = explicitFluencyAccuracyJudgment(response);
    const teacherAccuracyJudgment = zeroWordsReached ? null : recordedAccuracyJudgment;
    const wordsAttemptedValid = wordsAttempted !== null &&
      Number.isInteger(wordsAttempted) &&
      wordsAttempted >= 0 &&
      wordsAttempted <= passage.wordCount;
    const errorsValid = errors !== null &&
      Number.isInteger(errors) &&
      errors >= 0 &&
      wordsAttemptedValid &&
      errors <= wordsAttempted;
    const selfCorrectionsRangeValid = selfCorrections !== null &&
      Number.isInteger(selfCorrections) &&
      selfCorrections >= 0 &&
      wordsAttemptedValid &&
      selfCorrections <= wordsAttempted;
    const disjointErrorCountsValid = errorsValid &&
      selfCorrectionsRangeValid &&
      errors + selfCorrections <= wordsAttempted;
    const selfCorrectionsInputValid = selfCorrectionsRangeValid && disjointErrorCountsValid;
    const finishEarlyTimingValid = elapsedSeconds !== null && elapsedSeconds > 0 && elapsedSeconds < passage.timingSeconds;
    const validFinishedEarly = finishedEarly &&
      finishEarlyTimingValid &&
      wordsAttempted === passage.wordCount &&
      errorsValid &&
      selfCorrectionsInputValid;
    const exactMinute = !finishedEarly && elapsedSeconds === passage.timingSeconds;
    const timingSessionValid = timerInterrupted !== true && (
      (exactMinute && timerStatus === "complete") ||
      (validFinishedEarly && timerStatus === "finished_early")
    );
    const shouldValidate = ![
      EL_ITEM_RESPONSE_STATUSES.NOT_ADMINISTERED,
      EL_ITEM_RESPONSE_STATUSES.NOT_SCORABLE
    ].includes(status);
    if (shouldValidate) {
      if (timerInterrupted) issues.push("continuous_timing_interrupted");
      if (!wordsAttemptedValid) issues.push("words_attempted_invalid");
      if (!errorsValid) issues.push("errors_invalid");
      if (!selfCorrectionsRangeValid) issues.push("self_corrections_invalid");
      if (errorsValid && selfCorrectionsRangeValid && !disjointErrorCountsValid) {
        issues.push("errors_plus_self_corrections_exceed_words_attempted");
      }
      if (wordsAttempted === 0 && !zeroWordsReached) {
        issues.push("zero_words_reached_confirmation_required");
      }
      if (zeroWordsReached && !(wordsAttempted === 0 && errors === 0 && selfCorrections === 0)) {
        issues.push("zero_words_reached_counts_must_be_zero");
      }
      if (finishedEarly) {
        if (!finishEarlyTimingValid) issues.push("finished_early_timing_invalid");
        if (wordsAttempted !== passage.wordCount) issues.push("finished_early_requires_full_passage");
      } else if (!exactMinute) {
        issues.push("elapsed_seconds_must_equal_60");
      }
      if ((exactMinute || validFinishedEarly) && !timingSessionValid) {
        issues.push("timer_completion_state_invalid");
      }
      if (!zeroWordsReached && typeof teacherAccuracyJudgment !== "boolean") {
        issues.push("teacher_accuracy_judgment_missing");
      }
    }

    const prosodyValues = {};
    for (const dimension of PROSODY_DIMENSIONS) {
      const value = asFiniteNumber(response?.prosody?.[dimension]);
      if (value === null) continue;
      if (!Number.isInteger(value) || value < 1 || value > 4) issues.push(`${dimension}_invalid`);
      else prosodyValues[dimension] = value;
    }
    const prosodyScores = Object.values(prosodyValues);
    const prosody = {
      dimensions: prosodyValues,
      scoredDimensions: prosodyScores.length,
      average: prosodyScores.length
        ? round(prosodyScores.reduce((sum, value) => sum + value, 0) / prosodyScores.length, 1)
        : null,
      status: prosodyScores.length === 0
        ? "not_scored"
        : prosodyScores.length === PROSODY_DIMENSIONS.length
          ? "complete"
          : "partial"
    };
    const countInputsValid = !issues.includes("words_attempted_invalid") && !issues.includes("errors_invalid");
    const selfCorrectionsValid = !issues.includes("self_corrections_invalid") &&
      !issues.includes("errors_plus_self_corrections_exceed_words_attempted");
    const zeroWordEvidenceValid = !issues.includes("zero_words_reached_confirmation_required") &&
      !issues.includes("zero_words_reached_counts_must_be_zero");
    const itemSuppressed = globallySuppressed || [
      EL_ITEM_RESPONSE_STATUSES.NOT_SCORABLE,
      EL_ITEM_RESPONSE_STATUSES.NOT_ADMINISTERED
    ].includes(status);
    // Words attempted and errors are sufficient to preserve the raw rate and
    // accuracy observation. Missing/impossible self-correction evidence keeps
    // the route partial, but must not erase otherwise valid reading evidence.
    const metricsScorable = !itemSuppressed && countInputsValid && zeroWordEvidenceValid && !timerInterrupted;
    const wcpmScorable = metricsScorable && exactMinute && timingSessionValid;
    const correctWords = countInputsValid ? wordsAttempted - errors : null;
    const accuracy = countInputsValid && wordsAttempted > 0 ? percent(correctWords, wordsAttempted) : null;
    const routeJudgmentUsable = metricsScorable &&
      selfCorrectionsValid &&
      zeroWordEvidenceValid &&
      (zeroWordsReached || typeof teacherAccuracyJudgment === "boolean") &&
      timingSessionValid &&
      (exactMinute || validFinishedEarly);
    const evidenceStatus = itemSuppressed
      ? status === EL_ITEM_RESPONSE_STATUSES.NOT_SCORABLE ? "not_scorable" : "not_administered"
      : routeJudgmentUsable && exactMinute
        ? "complete"
        : routeJudgmentUsable && validFinishedEarly
          ? "finish_early_observation"
          : "partial";

    const baseRecord = baseQuestionRecord(passage, response, {
        status,
        isCorrect: null,
        evaluationSource: "explicit_teacher_judgment"
      });
    return {
      ...baseRecord,
      passageId: passage.id,
      passageTitle: passage.title,
      passageWordCount: passage.wordCount,
      wordsAttempted,
      errors,
      selfCorrections,
      selfCorrectionsValid,
      elapsedSeconds,
      timingRequiredSeconds: passage.timingSeconds,
      timerStatus,
      timerInterrupted,
      timingSessionValid,
      interruptionReason: String(response?.interruptionReason || ""),
      exactMinute,
      finishedEarly,
      validFinishedEarly,
      zeroWordsReached,
      correctWords: metricsScorable ? correctWords : null,
      wcpm: wcpmScorable ? correctWords : null,
      accuracy: metricsScorable ? accuracy : null,
      accurate: teacherAccuracyJudgment,
      passageAccurate: teacherAccuracyJudgment,
      teacherAccuracyJudgment,
      judgmentSource: zeroWordsReached
        ? "explicit_zero_words_reached"
        : typeof teacherAccuracyJudgment === "boolean" ? "teacher" : "not_recorded",
      accuracyJudgmentSource: String(
        response?.accuracyJudgmentSource ||
        (zeroWordsReached ? "explicit_zero_words_reached" : typeof teacherAccuracyJudgment === "boolean" ? "teacher" : "")
      ),
      accuracyJudgedAt: String(response?.accuracyJudgedAt || ""),
      routeDecision: session?.fluencyPassageDecisions?.[passage.id] && typeof session.fluencyPassageDecisions[passage.id] === "object"
        ? { ...session.fluencyPassageDecisions[passage.id] }
        : null,
      routeJudgmentUsable,
      evidenceStatus,
      prosody,
      informationalNotes: [
        ...(validFinishedEarly ? ["finished_early_wcpm_not_reported"] : []),
        ...(timerInterrupted ? ["interrupted_timing_not_scorable"] : [])
      ],
      validationIssues: Array.from(new Set([...baseRecord.validationIssues, ...issues]))
    };
  });

  let stopIndex = -1;
  let routePrefixLength = 0;
  const isReviewedNotScorableContinue = record => (
    record.responseStatus === EL_ITEM_RESPONSE_STATUSES.NOT_SCORABLE &&
    record.routeDecision?.action === "continue" &&
    record.routeDecision?.reason === "passage_not_scorable"
  );
  for (let index = 0; index < rawRecords.length; index += 1) {
    const record = rawRecords[index];
    if (isReviewedNotScorableContinue(record)) {
      routePrefixLength = index + 1;
      continue;
    }
    if (!record.routeJudgmentUsable) break;
    if (record.zeroWordsReached || record.teacherAccuracyJudgment === false) {
      stopIndex = index;
      routePrefixLength = index + 1;
      break;
    }
    routePrefixLength = index + 1;
  }

  const stopPassage = stopIndex >= 0 ? passages[stopIndex] : null;
  const retainedAfterStop = stopIndex >= 0
    ? rawRecords.slice(stopIndex + 1).filter(record => record.administrationStatus === "administered")
    : [];
  const records = rawRecords.map((record, index) => {
    if (stopIndex < 0 || index <= stopIndex) return record;
    const retainedObservation = record.administrationStatus === "administered"
      ? {
          responseStatus: record.responseStatus,
          wordsAttempted: record.wordsAttempted,
          errors: record.errors,
          selfCorrections: record.selfCorrections,
          elapsedSeconds: record.elapsedSeconds,
          teacherAccuracyJudgment: record.teacherAccuracyJudgment,
          notes: record.notes
        }
      : null;
    return {
      ...record,
      responseStatus: EL_ITEM_RESPONSE_STATUSES.NOT_ADMINISTERED,
      administrationStatus: "not_administered",
      notAdministeredReason: `stopped_after_${stopPassage.microphase}`,
      routeSkipReason: "fluency_stop_teacher_judgment",
      retainedObservationAfterStop: retainedObservation,
      wordsAttempted: null,
      errors: null,
      selfCorrections: null,
      elapsedSeconds: null,
      exactMinute: false,
      correctWords: null,
      wcpm: null,
      accuracy: null,
      accurate: null,
      passageAccurate: null,
      teacherAccuracyJudgment: null,
      routeJudgmentUsable: false,
      evidenceStatus: "not_administered",
      prosody: { dimensions: {}, scoredDimensions: 0, average: null, status: "not_scored" },
      validationIssues: ["not_administered_after_fluency_stop"]
    };
  });

  const metricRecords = records.filter(record => record.administrationStatus === "administered" && record.correctWords !== null);
  const wcpmRecords = metricRecords.filter(record => record.wcpm !== null);
  const totalWordsAttempted = metricRecords.reduce((sum, record) => sum + record.wordsAttempted, 0);
  const totalErrors = metricRecords.reduce((sum, record) => sum + record.errors, 0);
  const selfCorrectionRecords = metricRecords.filter(record => record.selfCorrectionsValid);
  const totalSelfCorrections = selfCorrectionRecords.length === metricRecords.length
    ? selfCorrectionRecords.reduce((sum, record) => sum + record.selfCorrections, 0)
    : null;
  const totalCorrectWords = metricRecords.reduce((sum, record) => sum + record.correctWords, 0);
  const aggregateAccuracy = totalWordsAttempted > 0 ? percent(totalCorrectWords, totalWordsAttempted) : null;
  const terminalRecord = metricRecords.at(-1) || null;
  const terminalWcpmRecord = wcpmRecords.at(-1) || null;
  const isResolvedRouteEvidence = record => (
    ["complete", "finish_early_observation"].includes(record.evidenceStatus) ||
    isReviewedNotScorableContinue(record)
  );
  const completedTop = stopIndex < 0 &&
    routePrefixLength === passages.length &&
    rawRecords.every(isResolvedRouteEvidence);
  const completedByStop = stopIndex >= 0 && rawRecords.slice(0, stopIndex + 1).every(isResolvedRouteEvidence);
  const routeComplete = completedTop || completedByStop;
  const resolvedPassageCount = stopIndex >= 0 ? passages.length : routePrefixLength;
  const plannedQuestionCount = passages.reduce((sum, passage) => sum + passage.wordCount, 0);
  const completion = {
    plannedQuestionCount,
    plannedPassageCount: passages.length,
    administeredCount: records.filter(record => record.administrationStatus === "administered").length,
    administeredPassageCount: records.filter(record => record.administrationStatus === "administered").length,
    scoredCount: totalWordsAttempted,
    scoredPassageCount: wcpmRecords.length,
    notScorableCount: records.filter(record => record.administrationStatus === "not_scorable").length,
    notAdministeredCount: records.filter(record => record.administrationStatus === "not_administered").length,
    routeResolvedPassageCount: resolvedPassageCount,
    completedByStopRule: completedByStop,
    completionPercent: percent(resolvedPassageCount, passages.length)
  };
  const hasUnresolvedValidation = rawRecords.some(record => record.validationIssues.length > 0);
  let scoreStatus;
  if (hasUnresolvedValidation) scoreStatus = "partial";
  else if (administrationStatus === EL_ADMINISTRATION_STATUSES.NOT_ADMINISTERED) scoreStatus = "not_administered";
  else if (administrationStatus === EL_ADMINISTRATION_STATUSES.NOT_SCORABLE) scoreStatus = "not_scorable";
  else if (administrationStatus === EL_ADMINISTRATION_STATUSES.DISCONTINUED) scoreStatus = "discontinued";
  else if (administrationStatus === EL_ADMINISTRATION_STATUSES.PARTIAL || administrationStatus === EL_ADMINISTRATION_STATUSES.IN_PROGRESS) scoreStatus = "partial";
  else if (administrationStatus === EL_ADMINISTRATION_STATUSES.NOT_STARTED) scoreStatus = "not_started";
  else scoreStatus = routeComplete ? "scored" : "partial";

  const start = passages[0];
  const highestAccurateRecord = rawRecords
    .slice(0, stopIndex >= 0 ? stopIndex : routePrefixLength)
    .filter(record => record.routeJudgmentUsable && record.teacherAccuracyJudgment === true)
    .at(-1) || null;
  const sessionStop = session?.fluencyStop || session?.fluencyStopEvidence || null;
  const routingProvenance = routingProvenanceFor(session);
  const stopRecord = stopIndex >= 0 ? rawRecords[stopIndex] : null;
  const stopReason = stopRecord?.zeroWordsReached
    ? "zero_words_reached_after_60_seconds"
    : stopRecord?.validFinishedEarly
    ? "teacher_judged_not_accurate_after_finished_passage"
    : stopPassage
      ? "teacher_judged_not_accurate_after_60_seconds"
      : "";
  const fluencyStartMicrophase = {
    microphase: start.microphase,
    cycle: start.anchorCycle,
    label: start.microphaseLabel,
    source: routingProvenance.routeSource || plan.route.selectedStartSource,
    sourceAttemptId: routingProvenance.sourceAttemptId,
    rule: "decoding_handoff_microphase"
  };
  const fluencySequence = {
    rule: "start_at_decoding_handoff_then_stop_at_first_explicit_not_accurate_after_60_seconds_or_completed_text",
    accuracyPercentageCutoff: null,
    requiredTimingSeconds: 60,
    routeSource: routingProvenance.routeSource,
    sourceAttemptId: routingProvenance.sourceAttemptId,
    startMicrophase: start.microphase,
    startCycle: start.anchorCycle,
    plannedPassages: passages.map(passage => ({
      passageId: passage.id,
      microphase: passage.microphase,
      label: passage.microphaseLabel,
      cycle: passage.anchorCycle,
      wordCount: passage.wordCount,
      featureTags: passage.featureTags,
      wordAudit: passage.wordAudit
    })),
    administeredMicrophases: records
      .filter(record => record.administrationStatus === "administered")
      .map(record => record.microphase),
    wcpmScoredMicrophases: records.filter(record => record.wcpm !== null).map(record => record.microphase),
    accurateMicrophases: rawRecords
      .slice(0, routePrefixLength)
      .filter(record => record.teacherAccuracyJudgment === true)
      .map(record => record.microphase),
    reviewedNotScorableMicrophases: rawRecords
      .slice(0, routePrefixLength)
      .filter(isReviewedNotScorableContinue)
      .map(record => record.microphase),
    highestAccurateMicrophase: highestAccurateRecord
      ? {
          microphase: highestAccurateRecord.microphase,
          cycle: highestAccurateRecord.anchorCycle,
          label: passages.find(passage => passage.id === highestAccurateRecord.passageId)?.microphaseLabel || highestAccurateRecord.microphase
        }
      : null,
    stop: stopPassage
      ? {
          passageId: stopPassage.id,
          microphase: stopPassage.microphase,
          label: stopPassage.microphaseLabel,
          cycle: stopPassage.anchorCycle,
          teacherAccuracyJudgment: stopRecord.teacherAccuracyJudgment,
          elapsedSeconds: stopRecord.elapsedSeconds,
          timingContext: stopRecord.validFinishedEarly ? "finished_full_passage_early" : "exact_60_seconds",
          wcpm: stopRecord.wcpm,
          zeroWordsReached: stopRecord.zeroWordsReached,
          reason: stopReason,
          confirmedInRunner: Boolean(sessionStop?.confirmed && sessionStop?.passageId === stopPassage.id),
          runnerEvidence: sessionStop && typeof sessionStop === "object" ? { ...sessionStop } : null
        }
      : null,
    notAdministeredAfterStop: stopIndex >= 0
      ? records.slice(stopIndex + 1).map(record => record.microphase)
      : [],
    routeStatus: completedByStop ? "stopped" : completedTop ? "highest_planned_passage_accurate" : "partial"
  };
  const placement = metricRecords.length
    ? provisionalPlacement({
        status: "descriptive_evidence",
        label: "LiteracyPath provisional — descriptive fluency evidence only",
        evidence: {
          startMicrophase: start.microphase,
          highestAccurateMicrophase: fluencySequence.highestAccurateMicrophase,
          stopMicrophase: stopPassage?.microphase || null,
          passageProfile: records.map(record => ({
            passageId: record.passageId,
            microphase: record.microphase,
            wcpm: record.wcpm,
            accuracy: record.accuracy,
            teacherAccuracyJudgment: record.teacherAccuracyJudgment,
            evidenceStatus: record.evidenceStatus
          }))
        },
        reason: "No grade-level or nationally normed fluency placement is inferred; the explicit teacher route judgment and raw passage evidence are retained."
      })
    : provisionalPlacement({ status: "not_available", reason: `Fluency metrics are ${scoreStatus}.` });
  const validationIssues = rawRecords.flatMap(record => record.validationIssues.map(issue => `${record.passageId}:${issue}`));
  const hasFinishEarly = rawRecords.some(record => record.validFinishedEarly);

  return {
    questionRecords: records,
    completion,
    scoreStatus,
    totalQuestions: totalWordsAttempted,
    scoredCount: totalWordsAttempted,
    correctCount: totalCorrectWords,
    incorrectCount: totalErrors,
    accuracy: aggregateAccuracy,
    subtestScores: {
      prosody: terminalRecord?.prosody || { dimensions: {}, scoredDimensions: 0, average: null, status: "not_scored" },
      passages: records.map(record => ({
        passageId: record.passageId,
        microphase: record.microphase,
        evidenceStatus: record.evidenceStatus,
        wordsAttempted: record.wordsAttempted,
        correctWords: record.correctWords,
        errors: record.errors,
        selfCorrections: record.selfCorrections,
        wcpm: record.wcpm,
        accuracy: record.accuracy,
        teacherAccuracyJudgment: record.teacherAccuracyJudgment,
        prosody: record.prosody
      }))
    },
    metrics: {
      passageId: terminalRecord?.passageId || start.id,
      passageWordCount: terminalRecord?.passageWordCount || start.wordCount,
      wordsAttempted: terminalRecord?.wordsAttempted ?? null,
      errors: terminalRecord?.errors ?? null,
      selfCorrections: terminalRecord?.selfCorrections ?? null,
      correctWords: terminalRecord?.correctWords ?? null,
      elapsedSeconds: terminalRecord?.elapsedSeconds ?? null,
      wcpm: terminalWcpmRecord?.wcpm ?? null,
      accuracy: terminalRecord?.accuracy ?? null,
      aggregateWordsAttempted: totalWordsAttempted,
      aggregateCorrectWords: totalCorrectWords,
      aggregateErrors: totalErrors,
      aggregateSelfCorrections: totalSelfCorrections,
      selfCorrectionsMissingOrInvalidCount: metricRecords.length - selfCorrectionRecords.length,
      aggregateAccuracy,
      prosody: terminalRecord?.prosody || null,
      passageProfile: records.map(record => ({
        passageId: record.passageId,
        passageTitle: record.passageTitle,
        microphase: record.microphase,
        evidenceStatus: record.evidenceStatus,
        wordsAttempted: record.wordsAttempted,
        correctWords: record.correctWords,
        errors: record.errors,
        selfCorrections: record.selfCorrections,
        elapsedSeconds: record.elapsedSeconds,
        wcpm: record.wcpm,
        accuracy: record.accuracy,
        teacherAccuracyJudgment: record.teacherAccuracyJudgment,
        prosodyAverage: record.prosody?.average ?? null
      })),
      fluencySequence,
      validationIssues
    },
    candidatePlacement: placement,
    fluencyStartMicrophase,
    fluencySequence,
    stopBand: stopPassage?.microphase || "",
    stopCycle: stopPassage?.anchorCycle ?? null,
    stopReason,
    validationIssues,
    recommendations: [
      ...(validationIssues.length
        ? ["Correct incomplete passage evidence before using the route; WCPM is reported only for an exact 60-second administration."]
        : ["Use each passage's rate, raw accuracy, self-corrections, prosody, and explicit teacher judgment together; do not invent a percentage cutoff."]),
      ...(hasFinishEarly
        ? ["A passage was finished early: retain the completed-text observation, report no WCPM or extrapolated rate, and use teacher judgement before continuing."]
        : [])
    ],
    observations: [
      ...(plan.grade === "K" ? ["Kindergarten oral reading fluency is optional, not a routine benchmark in the supplied overview."] : []),
      ...validationIssues.map(issue => `Validation: ${issue}.`),
      ...(retainedAfterStop.length
        ? [`${retainedAfterStop.length} later passage response${retainedAfterStop.length === 1 ? " was" : "s were"} retained as an after-stop observation but excluded from scoring.`]
        : []),
      ...rawRecords.filter(isReviewedNotScorableContinue).map(record => (
        `${record.microphase}: not-scorable passage was explicitly reviewed before continuing.`
      ))
    ]
  };
}

function buildPlan(session) {
  return getElBenchmarkPlan({
    assessmentId: session.assessmentId,
    grade: session.grade,
    window: session.window,
    startMicrophase: session.startMicrophase,
    formId: session.formId
  });
}

/**
 * Pure benchmark scorer.  The input is never mutated and all response data is
 * read from `session.responses[itemId]`.
 */
export function scoreElBenchmarkSession(session = {}) {
  const plan = buildPlan(session);
  const administrationStatus = normalizeAdministrationStatus(session);
  const responses = session.responses && typeof session.responses === "object" ? session.responses : {};
  let domain;
  if (plan.assessmentId === EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS) {
    domain = scorePhonologicalAwareness(plan, responses, administrationStatus);
  } else if (plan.assessmentId === EL_BENCHMARK_IDS.ENCODING) {
    domain = scoreEncoding(plan, responses, administrationStatus, session);
  } else if (plan.assessmentId === EL_BENCHMARK_IDS.DECODING) {
    domain = scoreDecoding(plan, responses, administrationStatus, session);
  } else {
    domain = scoreFluency(plan, responses, administrationStatus, session);
  }
  const normalizedDiscontinueReason = discontinueReasonFor(session).trim().toLowerCase();
  const discontinueValidationIssues = administrationStatus !== EL_ADMINISTRATION_STATUSES.DISCONTINUED
    ? []
    : !normalizedDiscontinueReason
      ? ["discontinue_reason_required"]
      : normalizedDiscontinueReason === "other" && !String(session.discontinueNote || "").trim()
        ? ["discontinue_note_required"]
        : [];
  const validationIssues = [
    ...(Array.isArray(domain.validationIssues) ? domain.validationIssues : []),
    ...discontinueValidationIssues
  ];
  const scoringSuppressed = [
    EL_ADMINISTRATION_STATUSES.NOT_ADMINISTERED,
    EL_ADMINISTRATION_STATUSES.NOT_SCORABLE
  ].includes(administrationStatus);
  const suppressedPlacement = provisionalPlacement({
    status: "not_available",
    reason: `Placement withheld because administration status is ${administrationStatus}.`
  });

  const routingProvenance = routingProvenanceFor(session);
  return {
    schemaVersion: EL_BENCHMARK_SCHEMA_VERSION,
    contentVersion: plan.contentVersion,
    scoringVersion: EL_BENCHMARK_SCORING_VERSION,
    scoringRuleVersion: EL_BENCHMARK_SCORING_VERSION,
    administrationVersion: session.administrationVersion || "legacy_unspecified",
    responseSchemaVersion: Math.max(1, Number(session.responseSchemaVersion) || 1),
    assessmentId: plan.assessmentId,
    skillId: plan.assessmentId,
    skillName: plan.title,
    planId: plan.planId,
    formId: plan.formId,
    formVersion: plan.formId,
    grade: plan.grade,
    gradePath: plan.grade,
    window: plan.window,
    benchmarkWindow: plan.window,
    framework: plan.framework,
    administrationStatus,
    scoreStatus: validationIssues.length ? "partial" : domain.scoreStatus,
    expectedAnchor: plan.route.expectedAnchor,
    administrationRange: plan.route.administrationRange,
    startMicrophase: plan.route.selectedStartMicrophase,
    startCycle: plan.route.selectedStartCycle,
    cyclesAdministered: Array.from(new Set(domain.questionRecords
      .filter(record => record.administrationStatus === "administered" && Number.isInteger(record.anchorCycle))
      .map(record => record.anchorCycle))),
    plannedQuestionCount: domain.completion.plannedQuestionCount,
    totalQuestions: scoringSuppressed ? 0 : domain.totalQuestions,
    scoredCount: scoringSuppressed ? 0 : domain.scoredCount,
    correctCount: scoringSuppressed ? 0 : domain.correctCount,
    incorrectCount: scoringSuppressed ? 0 : domain.incorrectCount,
    accuracy: scoringSuppressed ? null : domain.accuracy,
    questionRecords: domain.questionRecords,
    subtestScores: domain.subtestScores,
    metrics: { ...domain.metrics, scoringSuppressed },
    validationIssues,
    candidatePlacement: scoringSuppressed ? suppressedPlacement : domain.candidatePlacement,
    confirmedPlacement: routingProvenance.confirmedPlacement,
    placementSource: routingProvenance.placementSource,
    routeSource: routingProvenance.routeSource,
    sourceAttemptId: routingProvenance.sourceAttemptId,
    fluencyStartMicrophase: scoringSuppressed ? null : domain.fluencyStartMicrophase || null,
    fluencySequence: scoringSuppressed ? null : domain.fluencySequence || null,
    stopBand: domain.stopBand,
    // `stopCycle` remains as a compatibility field. This original bank has one
    // band per named microphase, so it can report only the overview's grade-
    // window cycle anchor, never an assessed exact cycle placement.
    stopCycle: domain.stopCycle,
    stopCycleAnchor: domain.stopCycleAnchor ?? domain.stopCycle ?? null,
    stopCycleAnchorLabel: domain.stopCycleAnchorLabel || "",
    stopCycleInterpretation: domain.stopCycleAnchor ?? domain.stopCycle ?? null
      ? "comparison_anchor_not_assessed_exact_cycle"
      : "not_available",
    reason: domain.stopReason,
    discontinueReason: discontinueReasonFor(session),
    discontinueNote: String(session.discontinueNote || ""),
    note: session.note || session.notes || "",
    recommendations: domain.recommendations,
    observations: domain.observations,
    completion: domain.completion
  };
}

function stableAttemptId(score, session, ownership) {
  if (session.attemptId || ownership.attemptId) return session.attemptId || ownership.attemptId;
  const raw = [
    ownership.studentId || session.studentId || "student",
    score.planId,
    session.completedAt || ownership.completedAt || session.sessionId || "undated"
  ].join(":");
  return `el_benchmark_${raw.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`;
}

/**
 * Build a persistence-ready record without adding generic passed/mastered
 * thresholds.  Timestamps and ownership are supplied by the caller so this
 * helper remains deterministic.
 */
export function buildElBenchmarkAttempt(session = {}, ownership = {}) {
  const score = scoreElBenchmarkSession(session);
  const startedAt = session.startedAt || ownership.startedAt || "";
  const completedAt = session.completedAt || ownership.completedAt || "";
  const formPurpose = session.formPurpose || session.formSelection?.purpose || "legacy_unspecified";
  const formSelectionReason = session.formSelectionReason ||
    session.formSelection?.selectionReason || "legacy_unspecified";
  const formExposure = session.formExposure || session.formSelection?.exposure || null;
  const formParallelSetId = session.formParallelSetId || "legacy_unspecified";
  const formEquatingStatus = session.formEquatingStatus || "legacy_unspecified";
  return {
    attemptId: stableAttemptId(score, session, ownership),
    studentId: ownership.studentId || session.studentId || "",
    studentName: ownership.studentName || session.studentName || "Student",
    classId: ownership.classId || session.classId || "",
    teacherId: ownership.teacherId || session.teacherId || "",
    assessmentType: score.assessmentId,
    skillId: score.skillId,
    skillName: score.skillName,
    skillLevel: score.grade === "K" ? 0 : Number(score.grade),
    skillPhase: { BOY: 1, MOY: 2, EOY: 3 }[score.window],
    startedAt,
    completedAt,
    totalQuestions: score.totalQuestions,
    correctCount: score.correctCount,
    incorrectCount: score.incorrectCount,
    accuracy: score.accuracy,
    status: score.administrationStatus,
    administrationStatus: score.administrationStatus,
    scoreStatus: score.scoreStatus,
    plannedQuestionCount: score.plannedQuestionCount,
    scoredCount: score.scoredCount,
    framework: score.framework,
    formId: score.formId,
    formVersion: score.formVersion,
    formPurpose,
    formSelectionReason,
    formExposure,
    formParallelSetId,
    formEquatingStatus,
    scoringRuleVersion: score.scoringRuleVersion,
    administrationVersion: score.administrationVersion,
    responseSchemaVersion: score.responseSchemaVersion,
    gradePath: score.gradePath,
    grade: score.grade,
    benchmarkWindow: score.benchmarkWindow,
    startMicrophase: score.startMicrophase,
    startCycle: score.startCycle,
    cyclesAdministered: score.cyclesAdministered,
    stopBand: score.stopBand,
    stopCycle: score.stopCycle,
    stopCycleAnchor: score.stopCycleAnchor,
    stopCycleAnchorLabel: score.stopCycleAnchorLabel,
    stopCycleInterpretation: score.stopCycleInterpretation,
    reason: score.reason,
    discontinueReason: discontinueReasonFor(session),
    discontinueNote: String(session.discontinueNote || ""),
    note: session.note || session.notes || ownership.note || ownership.notes || "",
    candidatePlacement: score.candidatePlacement,
    confirmedPlacement: score.confirmedPlacement,
    placementSource: score.placementSource,
    routeSource: score.routeSource,
    sourceAttemptId: score.sourceAttemptId,
    prerequisiteReview: session.prerequisiteReview && typeof session.prerequisiteReview === "object"
      ? { ...session.prerequisiteReview }
      : null,
    fluencyStartMicrophase: score.fluencyStartMicrophase,
    fluencySequence: score.fluencySequence,
    subtestScores: score.subtestScores,
    metrics: score.metrics,
    validationIssues: Array.isArray(score.validationIssues) ? [...score.validationIssues] : [],
    recommendations: score.recommendations,
    observations: score.observations,
    questionRecords: score.questionRecords,
    contentCoverage: {
      assessmentId: score.assessmentId,
      formId: score.formId,
      formPurpose,
      formSelectionReason,
      formParallelSetId,
      formEquatingStatus,
      grade: score.grade,
      window: score.window,
      expectedAnchor: score.expectedAnchor,
      administrationRange: score.administrationRange,
      stopCycleAnchor: score.stopCycleAnchor,
      stopCycleInterpretation: score.stopCycleInterpretation,
      plannedQuestionCount: score.plannedQuestionCount,
      scoredCount: score.scoredCount,
      routeSource: score.routeSource,
      sourceAttemptId: score.sourceAttemptId
    },
    // Keep a compact scoring-contract marker. The complete score already lives
    // in the top-level fields, subtestScores, metrics, and questionRecords;
    // embedding it again made every local/cloud payload tens of KB larger.
    benchmark: {
      schemaVersion: score.schemaVersion,
      contentVersion: score.contentVersion,
      scoringVersion: score.scoringVersion,
      assessmentId: score.assessmentId,
      planId: score.planId,
      formId: score.formId,
      formPurpose,
      formSelectionReason,
      formParallelSetId,
      formEquatingStatus,
      parallelFormsExhausted: formExposure?.parallelFormsExhausted === true,
      grade: score.grade,
      window: score.window,
      administrationStatus: score.administrationStatus,
      scoreStatus: score.scoreStatus
    },
    appVersion: ownership.appVersion || session.appVersion || "local",
    schemaVersion: EL_BENCHMARK_ATTEMPT_SCHEMA_VERSION,
    contentVersion: score.contentVersion,
    scoringVersion: EL_BENCHMARK_SCORING_VERSION,
    metadata: {
      attemptSchemaVersion: EL_BENCHMARK_ATTEMPT_SCHEMA_VERSION,
      benchmarkSchemaVersion: EL_BENCHMARK_SCHEMA_VERSION,
      formId: score.formId,
      formVersion: score.formVersion,
      formPurpose,
      formSelectionReason,
      formExposure,
      formParallelSetId,
      formEquatingStatus,
      contentVersion: score.contentVersion,
      scoringVersion: score.scoringVersion,
      scoringRuleVersion: score.scoringRuleVersion,
      administrationVersion: score.administrationVersion,
      responseSchemaVersion: score.responseSchemaVersion,
      grade: score.grade,
      window: score.window,
      framework: score.framework.label,
      confirmedPlacement: score.confirmedPlacement,
      placementSource: score.placementSource,
      routeSource: score.routeSource,
      sourceAttemptId: score.sourceAttemptId,
      stopCycleAnchor: score.stopCycleAnchor,
      stopCycleAnchorLabel: score.stopCycleAnchorLabel,
      stopCycleInterpretation: score.stopCycleInterpretation,
      prerequisiteReview: session.prerequisiteReview && typeof session.prerequisiteReview === "object"
        ? { ...session.prerequisiteReview }
        : null,
      discontinueNote: String(session.discontinueNote || "")
    }
  };
}
