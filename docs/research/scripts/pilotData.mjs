const DIRECT_IDENTIFIER_KEYS = new Set([
  "name",
  "firstname",
  "lastname",
  "fullname",
  "email",
  "phone",
  "telephone",
  "address",
  "postcode",
  "postalcode",
  "dateofbirth",
  "dob",
  "studentname",
  "teachername",
  "parentname",
  "guardianname"
]);

export const PILOT_PHASES = Object.freeze([
  "familiarisation",
  "pre",
  "practice",
  "post",
  "retention",
  "transfer",
  "usability_first",
  "usability_familiar",
  "teacher_workflow"
]);

export const ITEM_PHASES = Object.freeze([
  "pre",
  "practice",
  "post",
  "retention",
  "transfer"
]);

export const RESPONSE_STATUSES = Object.freeze([
  "correct",
  "incorrect",
  "no_response",
  "not_administered",
  "discontinued"
]);

export const SUPPORT_STAGES = Object.freeze([
  "whole_word_audio",
  "segmented_phonemes",
  "reread_prompt",
  "instruction_repeated",
  "accessibility_adjustment"
]);

const SESSION_STATUSES = new Set(["completed", "discontinued", "not_administered"]);
const TASK_STATES = new Set(["independent", "completed_with_prompt", "not_completed", "stopped"]);
const DEVICE_CLASSES = new Set(["chromebook", "tablet", "desktop", "phone", "other"]);
const AFFECT_VALUES = new Set(["comfortable", "neutral", "frustrated", "distressed", "not_observed"]);
const SUPPORT_INITIATORS = new Set(["child", "adult", "none"]);
const DEVIATION_SEVERITIES = new Set(["critical", "major", "minor"]);
const DEVIATION_DISPOSITIONS = new Set([
  "include",
  "exclude_from_metric",
  "exclude_session",
  "pending_review"
]);
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const PARTICIPANT_CODE = /^P-[A-Z0-9][A-Z0-9-]*$/i;
const EMAIL_LIKE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_LIKE = /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)|\d{2,4})[\s.-]\d{3,4}[\s.-]\d{3,4}/;
const DECODING_LADDER_ORDER = new Map([
  ["whole_word_audio", 1],
  ["segmented_phonemes", 2],
  ["reread_prompt", 3]
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validIso(value) {
  return nonEmptyString(value) && ISO_UTC.test(value) && Number.isFinite(Date.parse(value));
}

function timestamp(value) {
  return validIso(value) ? Date.parse(value) : 0;
}

function normalizedKey(key) {
  return String(key).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function inspectForIdentifiers(value, path = "$", errors = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectForIdentifiers(item, `${path}[${index}]`, errors));
    return errors;
  }
  if (!value || typeof value !== "object") return errors;

  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (DIRECT_IDENTIFIER_KEYS.has(normalizedKey(key))) {
      errors.push(`${childPath}: direct identifier keys are forbidden`);
    }
    if (
      typeof child === "string" &&
      (EMAIL_LIKE.test(child) || PHONE_LIKE.test(child))
    ) {
      errors.push(`${childPath}: text appears to contain an email address or phone number`);
    }
    inspectForIdentifiers(child, childPath, errors);
  }
  return errors;
}

function requireString(record, field, path, errors) {
  if (!nonEmptyString(record?.[field])) {
    errors.push(`${path}.${field}: non-empty string required`);
  }
}

function requireIso(record, field, path, errors, { nullable = false } = {}) {
  const value = record?.[field];
  if (nullable && (value === null || value === undefined || value === "")) return;
  if (!validIso(value)) errors.push(`${path}.${field}: UTC ISO timestamp required`);
}

function requireNonNegativeInteger(record, field, path, errors, { nullable = false } = {}) {
  const value = record?.[field];
  if (nullable && (value === null || value === undefined)) return;
  if (!Number.isInteger(value) || value < 0) {
    errors.push(`${path}.${field}: non-negative integer required`);
  }
}

function uniqueMap(rows, field, path, errors) {
  const map = new Map();
  rows.forEach((row, index) => {
    const value = row?.[field];
    if (!nonEmptyString(value)) {
      errors.push(`${path}[${index}].${field}: non-empty unique string required`);
      return;
    }
    if (map.has(value)) {
      errors.push(`${path}[${index}].${field}: duplicate value ${value}`);
      return;
    }
    map.set(value, row);
  });
  return map;
}

function ensureStringArray(value, path, errors) {
  if (!Array.isArray(value) || value.some(item => !nonEmptyString(item))) {
    errors.push(`${path}: string array required`);
  }
}

export function validatePilotDataset(dataset = {}) {
  const errors = inspectForIdentifiers(dataset);
  if (dataset?.schemaVersion !== 1) {
    errors.push("$.schemaVersion: expected 1");
  }

  const study = dataset?.study || {};
  for (const field of [
    "studyId",
    "protocolVersion",
    "packCommit",
    "appReleaseId",
    "curriculumVersion"
  ]) {
    requireString(study, field, "$.study", errors);
  }
  requireIso(study, "exportedAt", "$.study", errors);

  const participants = asArray(dataset?.participants);
  const sessions = asArray(dataset?.sessions);
  const itemEvents = asArray(dataset?.itemEvents);
  const usabilityObservations = asArray(dataset?.usabilityObservations);
  const teacherFeedback = asArray(dataset?.teacherFeedback);
  const deviations = asArray(dataset?.deviations);
  for (const [field, value] of Object.entries({
    participants: dataset?.participants,
    sessions: dataset?.sessions,
    itemEvents: dataset?.itemEvents,
    usabilityObservations: dataset?.usabilityObservations,
    teacherFeedback: dataset?.teacherFeedback,
    deviations: dataset?.deviations
  })) {
    if (!Array.isArray(value)) errors.push(`$.${field}: array required`);
  }

  const participantMap = uniqueMap(participants, "participantCode", "$.participants", errors);
  participants.forEach((participant, index) => {
    const path = `$.participants[${index}]`;
    if (!PARTICIPANT_CODE.test(participant?.participantCode || "")) {
      errors.push(`${path}.participantCode: use a de-identified P- code`);
    }
    if (!["child", "teacher"].includes(participant?.participantType)) {
      errors.push(`${path}.participantType: child or teacher required`);
    }
    for (const field of ["ageBand", "gradeBand", "cohortCode", "deviceClass", "schoolApprovalRef"]) {
      requireString(participant, field, path, errors);
    }
    if (!DEVICE_CLASSES.has(participant?.deviceClass)) {
      errors.push(`${path}.deviceClass: unsupported value`);
    }
    for (const field of ["multilingualLearner", "additionalSupport"]) {
      if (![true, false, null].includes(participant?.[field])) {
        errors.push(`${path}.${field}: boolean or null required`);
      }
    }
    requireIso(participant, "withdrawnAt", path, errors, { nullable: true });
    if (participant?.participantType === "child") {
      requireIso(participant, "guardianConsentAt", path, errors);
      requireIso(participant, "childAssentAt", path, errors);
      if (participant?.teacherConsentAt) {
        errors.push(`${path}.teacherConsentAt: must be null for a child participant`);
      }
    } else {
      requireIso(participant, "teacherConsentAt", path, errors);
      if (participant?.guardianConsentAt || participant?.childAssentAt) {
        errors.push(`${path}: child consent fields must be null for a teacher participant`);
      }
    }
  });

  const sessionMap = uniqueMap(sessions, "sessionId", "$.sessions", errors);
  sessions.forEach((session, index) => {
    const path = `$.sessions[${index}]`;
    const participant = participantMap.get(session?.participantCode);
    if (!participant) errors.push(`${path}.participantCode: unknown participant`);
    if (!PILOT_PHASES.includes(session?.phase)) errors.push(`${path}.phase: unsupported phase`);
    for (const field of ["facilitatorCode", "appReleaseId", "curriculumVersion", "deviceClass"]) {
      requireString(session, field, path, errors);
    }
    if (!DEVICE_CLASSES.has(session?.deviceClass)) {
      errors.push(`${path}.deviceClass: unsupported value`);
    }
    requireIso(session, "startedAt", path, errors);
    requireIso(session, "completedAt", path, errors);
    if (timestamp(session?.completedAt) < timestamp(session?.startedAt)) {
      errors.push(`${path}: completedAt precedes startedAt`);
    }
    if (!SESSION_STATUSES.has(session?.sessionStatus)) {
      errors.push(`${path}.sessionStatus: unsupported value`);
    }
    if (
      session?.appReleaseId !== study.appReleaseId ||
      session?.curriculumVersion !== study.curriculumVersion
    ) {
      errors.push(`${path}: release and curriculum versions must match the frozen study versions`);
    }
    ensureStringArray(session?.accessibilityAdjustments, `${path}.accessibilityAdjustments`, errors);
    if (participant?.participantType === "child") {
      if (session?.phase === "teacher_workflow") {
        errors.push(`${path}.phase: a child cannot have a teacher workflow session`);
      }
      requireIso(session, "assentConfirmedAt", path, errors);
      if (timestamp(session?.assentConfirmedAt) > timestamp(session?.startedAt)) {
        errors.push(`${path}.assentConfirmedAt: assent must be confirmed before the session starts`);
      }
      if (timestamp(participant?.guardianConsentAt) > timestamp(session?.startedAt)) {
        errors.push(`${path}: guardian consent occurs after the session starts`);
      }
      if (timestamp(participant?.withdrawnAt) && timestamp(session?.startedAt) > timestamp(participant.withdrawnAt)) {
        errors.push(`${path}: session occurs after withdrawal`);
      }
    }
    if (
      participant?.participantType === "teacher" &&
      timestamp(participant?.teacherConsentAt) > timestamp(session?.startedAt)
    ) {
      errors.push(`${path}: teacher consent occurs after the session starts`);
    }
    if (participant?.participantType === "teacher" && session?.phase !== "teacher_workflow") {
      errors.push(`${path}.phase: teacher participants may only have teacher workflow sessions`);
    }
  });

  const eventMap = uniqueMap(itemEvents, "eventId", "$.itemEvents", errors);
  void eventMap;
  const nonTransferExposure = new Set();
  itemEvents.forEach((event, index) => {
    const path = `$.itemEvents[${index}]`;
    const session = sessionMap.get(event?.sessionId);
    if (!session) errors.push(`${path}.sessionId: unknown session`);
    if (!participantMap.has(event?.participantCode)) {
      errors.push(`${path}.participantCode: unknown participant`);
    }
    if (session && session.participantCode !== event?.participantCode) {
      errors.push(`${path}.participantCode: does not match session participant`);
    }
    if (!ITEM_PHASES.includes(event?.phase)) errors.push(`${path}.phase: unsupported item phase`);
    if (session && session.phase !== event?.phase) {
      errors.push(`${path}.phase: does not match session phase`);
    }
    for (const field of ["skillId", "itemKey", "formId"]) requireString(event, field, path, errors);
    if (!RESPONSE_STATUSES.includes(event?.responseStatus)) {
      errors.push(`${path}.responseStatus: unsupported value`);
    }
    requireIso(event, "observedAt", path, errors);
    if (
      session &&
      (
        timestamp(event?.observedAt) < timestamp(session.startedAt) ||
        timestamp(event?.observedAt) > timestamp(session.completedAt)
      )
    ) {
      errors.push(`${path}.observedAt: item evidence must occur inside the session`);
    }
    if (event?.latencyMs !== null && event?.latencyMs !== undefined) {
      if (!Number.isInteger(event.latencyMs) || event.latencyMs <= 0 || event.latencyMs > 600000) {
        errors.push(`${path}.latencyMs: integer from 1 to 600000 or null required`);
      }
    }
    if (!Array.isArray(event?.supportStages)) {
      errors.push(`${path}.supportStages: array required`);
    } else {
      const uniqueStages = new Set(event.supportStages);
      if (uniqueStages.size !== event.supportStages.length) {
        errors.push(`${path}.supportStages: duplicate stages are not allowed`);
      }
      event.supportStages.forEach(stage => {
        if (!SUPPORT_STAGES.includes(stage)) {
          errors.push(`${path}.supportStages: unsupported stage ${stage}`);
        }
      });
      const ladderPositions = event.supportStages
        .filter(stage => DECODING_LADDER_ORDER.has(stage))
        .map(stage => DECODING_LADDER_ORDER.get(stage));
      if (ladderPositions.some((position, stageIndex) => (
        stageIndex > 0 && position < ladderPositions[stageIndex - 1]
      ))) {
        errors.push(`${path}.supportStages: decoding ladder stages are out of order`);
      }
    }
    if (!SUPPORT_INITIATORS.has(event?.supportInitiator)) {
      errors.push(`${path}.supportInitiator: child, adult or none required`);
    }
    if (asArray(event?.supportStages).length === 0 && event?.supportInitiator !== "none") {
      errors.push(`${path}.supportInitiator: must be none when supportStages is empty`);
    }
    if (asArray(event?.supportStages).length > 0 && event?.supportInitiator === "none") {
      errors.push(`${path}.supportInitiator: cannot be none when support was used`);
    }
    if (typeof event?.selfCorrected !== "boolean" || typeof event?.isUnseenTransfer !== "boolean") {
      errors.push(`${path}: selfCorrected and isUnseenTransfer must be boolean`);
    }
    if (event?.phase === "transfer" && event?.isUnseenTransfer !== true) {
      errors.push(`${path}.isUnseenTransfer: transfer events must be unseen`);
    }
    if (event?.phase !== "transfer" && event?.isUnseenTransfer !== false) {
      errors.push(`${path}.isUnseenTransfer: only transfer events may be unseen transfer`);
    }
    const exposureKey = `${event?.participantCode}:${event?.itemKey}`;
    if (event?.phase !== "transfer") nonTransferExposure.add(exposureKey);
  });
  itemEvents.forEach((event, index) => {
    if (
      event?.phase === "transfer" &&
      nonTransferExposure.has(`${event?.participantCode}:${event?.itemKey}`)
    ) {
      errors.push(`$.itemEvents[${index}].itemKey: transfer item was previously exposed to this participant`);
    }
  });
  const formPhases = new Map();
  itemEvents.filter(event => event?.phase !== "practice").forEach(event => {
    const key = `${event.participantCode}:${event.formId}`;
    const phases = formPhases.get(key) || new Set();
    phases.add(event.phase);
    formPhases.set(key, phases);
  });
  for (const [key, phases] of formPhases.entries()) {
    if (phases.size > 1) {
      errors.push(`$.itemEvents: parallel form ${key} is reused across phases ${[...phases].join(", ")}`);
    }
  }

  participants.filter(participant => participant.participantType === "child").forEach(participant => {
    const postTimes = sessions
      .filter(session => session.participantCode === participant.participantCode && session.phase === "post")
      .map(session => timestamp(session.completedAt))
      .filter(Boolean);
    sessions
      .filter(session => session.participantCode === participant.participantCode && session.phase === "retention")
      .forEach(session => {
        const latestPost = Math.max(0, ...postTimes.filter(value => value <= timestamp(session.startedAt)));
        if (!latestPost) {
          errors.push(`$.sessions: retention session ${session.sessionId} has no earlier post session`);
          return;
        }
        const elapsedDays = (timestamp(session.startedAt) - latestPost) / 86400000;
        if (elapsedDays < 7 || elapsedDays > 21) {
          errors.push(`$.sessions: retention session ${session.sessionId} is outside the 7–21 day window`);
        }
      });
  });

  const observationMap = uniqueMap(
    usabilityObservations,
    "observationId",
    "$.usabilityObservations",
    errors
  );
  void observationMap;
  usabilityObservations.forEach((observation, index) => {
    const path = `$.usabilityObservations[${index}]`;
    const session = sessionMap.get(observation?.sessionId);
    if (!session) errors.push(`${path}.sessionId: unknown session`);
    if (!participantMap.has(observation?.participantCode)) {
      errors.push(`${path}.participantCode: unknown participant`);
    }
    if (participantMap.get(observation?.participantCode)?.participantType !== "child") {
      errors.push(`${path}.participantCode: child participant required`);
    }
    if (session && session.participantCode !== observation?.participantCode) {
      errors.push(`${path}.participantCode: does not match session participant`);
    }
    requireString(observation, "taskId", path, errors);
    if (!TASK_STATES.has(observation?.taskState)) errors.push(`${path}.taskState: unsupported value`);
    requireNonNegativeInteger(observation, "durationSeconds", path, errors, { nullable: true });
    requireNonNegativeInteger(observation, "navigationErrors", path, errors);
    requireNonNegativeInteger(observation, "adultPrompts", path, errors);
    ensureStringArray(observation?.confusionCodes, `${path}.confusionCodes`, errors);
    ensureStringArray(observation?.accessibilityBarrierCodes, `${path}.accessibilityBarrierCodes`, errors);
    if (![true, false, null].includes(observation?.recoverySucceeded)) {
      errors.push(`${path}.recoverySucceeded: boolean or null required`);
    }
    if (!AFFECT_VALUES.has(observation?.affect)) errors.push(`${path}.affect: unsupported value`);
    requireIso(observation, "observedAt", path, errors);
    if (
      session &&
      (
        timestamp(observation?.observedAt) < timestamp(session.startedAt) ||
        timestamp(observation?.observedAt) > timestamp(session.completedAt)
      )
    ) {
      errors.push(`${path}.observedAt: usability evidence must occur inside the session`);
    }
  });

  const feedbackMap = uniqueMap(teacherFeedback, "feedbackId", "$.teacherFeedback", errors);
  void feedbackMap;
  teacherFeedback.forEach((feedback, index) => {
    const path = `$.teacherFeedback[${index}]`;
    const session = sessionMap.get(feedback?.sessionId);
    const participant = participantMap.get(feedback?.participantCode);
    if (!session) errors.push(`${path}.sessionId: unknown session`);
    if (participant?.participantType !== "teacher") {
      errors.push(`${path}.participantCode: teacher participant required`);
    }
    if (session && session.participantCode !== feedback?.participantCode) {
      errors.push(`${path}.participantCode: does not match session participant`);
    }
    requireString(feedback, "taskId", path, errors);
    if (!TASK_STATES.has(feedback?.taskState)) errors.push(`${path}.taskState: unsupported value`);
    for (const field of ["durationSeconds", "errors", "helpRequests"]) {
      requireNonNegativeInteger(feedback, field, path, errors, { nullable: field === "durationSeconds" });
    }
    for (const field of ["confidenceRating", "workloadRating"]) {
      if (!Number.isInteger(feedback?.[field]) || feedback[field] < 1 || feedback[field] > 5) {
        errors.push(`${path}.${field}: integer from 1 to 5 required`);
      }
    }
    ensureStringArray(feedback?.issueCodes, `${path}.issueCodes`, errors);
    requireIso(feedback, "observedAt", path, errors);
    if (
      session &&
      (
        timestamp(feedback?.observedAt) < timestamp(session.startedAt) ||
        timestamp(feedback?.observedAt) > timestamp(session.completedAt)
      )
    ) {
      errors.push(`${path}.observedAt: teacher evidence must occur inside the session`);
    }
  });

  const deviationMap = uniqueMap(deviations, "deviationId", "$.deviations", errors);
  void deviationMap;
  deviations.forEach((deviation, index) => {
    const path = `$.deviations[${index}]`;
    if (deviation?.sessionId && !sessionMap.has(deviation.sessionId)) {
      errors.push(`${path}.sessionId: unknown session`);
    }
    if (deviation?.participantCode && !participantMap.has(deviation.participantCode)) {
      errors.push(`${path}.participantCode: unknown participant`);
    }
    if (!DEVIATION_SEVERITIES.has(deviation?.severity)) {
      errors.push(`${path}.severity: unsupported value`);
    }
    for (const field of [
      "plannedProcedure",
      "actualProcedureCode",
      "reasonCode",
      "analysisDisposition",
      "ownerCode"
    ]) {
      requireString(deviation, field, path, errors);
    }
    if (!DEVIATION_DISPOSITIONS.has(deviation?.analysisDisposition)) {
      errors.push(`${path}.analysisDisposition: unsupported value`);
    }
    ensureStringArray(deviation?.affectedMetricIds, `${path}.affectedMetricIds`, errors);
    requireIso(deviation, "occurredAt", path, errors);
    requireIso(deviation, "reviewedAt", path, errors, { nullable: true });
  });

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)].sort(),
    counts: {
      participants: participants.length,
      sessions: sessions.length,
      itemEvents: itemEvents.length,
      usabilityObservations: usabilityObservations.length,
      teacherFeedback: teacherFeedback.length,
      deviations: deviations.length
    }
  };
}

function csvCell(value) {
  const normalized = Array.isArray(value)
    ? value.join("|")
    : value === null || value === undefined
      ? ""
      : typeof value === "boolean"
        ? value ? "true" : "false"
        : String(value);
  return `"${normalized.replaceAll("\"", "\"\"")}"`;
}

function csvFromRows(rows, columns) {
  const header = columns.map(csvCell).join(",");
  const body = rows.map(row => columns.map(column => csvCell(row[column])).join(","));
  return `${[header, ...body].join("\n")}\n`;
}

export function createPilotCsvExports(dataset) {
  const validation = validatePilotDataset(dataset);
  if (!validation.valid) {
    throw new Error(`Pilot dataset validation failed:\n${validation.errors.join("\n")}`);
  }

  const participants = dataset.participants.map(participant => ({
    participantCode: participant.participantCode,
    participantType: participant.participantType,
    ageBand: participant.ageBand,
    gradeBand: participant.gradeBand,
    multilingualLearner: participant.multilingualLearner,
    additionalSupport: participant.additionalSupport,
    cohortCode: participant.cohortCode,
    deviceClass: participant.deviceClass,
    schoolApprovalRef: participant.schoolApprovalRef,
    guardianConsentVerified: Boolean(participant.guardianConsentAt),
    childAssentVerified: Boolean(participant.childAssentAt),
    teacherConsentVerified: Boolean(participant.teacherConsentAt),
    withdrawnAt: participant.withdrawnAt
  }));

  const tableDefinitions = {
    "participants.csv": {
      rows: participants,
      columns: [
        "participantCode",
        "participantType",
        "ageBand",
        "gradeBand",
        "multilingualLearner",
        "additionalSupport",
        "cohortCode",
        "deviceClass",
        "schoolApprovalRef",
        "guardianConsentVerified",
        "childAssentVerified",
        "teacherConsentVerified",
        "withdrawnAt"
      ]
    },
    "sessions.csv": {
      rows: dataset.sessions,
      columns: [
        "sessionId",
        "participantCode",
        "phase",
        "startedAt",
        "completedAt",
        "facilitatorCode",
        "appReleaseId",
        "curriculumVersion",
        "deviceClass",
        "accessibilityAdjustments",
        "sessionStatus",
        "assentConfirmedAt"
      ]
    },
    "item_events.csv": {
      rows: dataset.itemEvents,
      columns: [
        "eventId",
        "sessionId",
        "participantCode",
        "phase",
        "skillId",
        "itemKey",
        "formId",
        "responseStatus",
        "latencyMs",
        "supportStages",
        "supportInitiator",
        "isUnseenTransfer",
        "selfCorrected",
        "observedAt"
      ]
    },
    "usability_observations.csv": {
      rows: dataset.usabilityObservations,
      columns: [
        "observationId",
        "sessionId",
        "participantCode",
        "taskId",
        "taskState",
        "durationSeconds",
        "navigationErrors",
        "adultPrompts",
        "confusionCodes",
        "accessibilityBarrierCodes",
        "recoverySucceeded",
        "affect",
        "quoteRedacted",
        "observedAt"
      ]
    },
    "teacher_feedback.csv": {
      rows: dataset.teacherFeedback,
      columns: [
        "feedbackId",
        "sessionId",
        "participantCode",
        "taskId",
        "taskState",
        "durationSeconds",
        "errors",
        "helpRequests",
        "confidenceRating",
        "workloadRating",
        "issueCodes",
        "commentRedacted",
        "observedAt"
      ]
    },
    "deviations.csv": {
      rows: dataset.deviations,
      columns: [
        "deviationId",
        "sessionId",
        "participantCode",
        "severity",
        "plannedProcedure",
        "actualProcedureCode",
        "reasonCode",
        "affectedMetricIds",
        "analysisDisposition",
        "ownerCode",
        "occurredAt",
        "reviewedAt"
      ]
    }
  };

  return Object.fromEntries(Object.entries(tableDefinitions).map(([fileName, table]) => [
    fileName,
    {
      rowCount: table.rows.length,
      content: csvFromRows(table.rows, table.columns)
    }
  ]));
}

function percentile(sortedValues, fraction) {
  if (!sortedValues.length) return null;
  const position = (sortedValues.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sortedValues[lower];
  return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * (position - lower);
}

function round(value, places = 3) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function metricsForEvents(events) {
  const accuracyEligible = events.filter(event =>
    event.responseStatus === "correct" || event.responseStatus === "incorrect"
  );
  const administered = events.filter(event =>
    ["correct", "incorrect", "no_response"].includes(event.responseStatus)
  );
  const correct = accuracyEligible.filter(event => event.responseStatus === "correct");
  const independentCorrectLatencies = correct
    .filter(event => asArray(event.supportStages).length === 0 && Number.isFinite(event.latencyMs))
    .map(event => event.latencyMs)
    .sort((a, b) => a - b);
  const supportEvents = administered.filter(event => asArray(event.supportStages).length > 0);

  return {
    participants: new Set(events.map(event => event.participantCode)).size,
    itemEvents: events.length,
    administered: administered.length,
    accuracyNumerator: correct.length,
    accuracyDenominator: accuracyEligible.length,
    accuracy: accuracyEligible.length ? round(correct.length / accuracyEligible.length) : null,
    noResponse: events.filter(event => event.responseStatus === "no_response").length,
    notAdministered: events.filter(event => event.responseStatus === "not_administered").length,
    discontinued: events.filter(event => event.responseStatus === "discontinued").length,
    independentCorrectLatencyCount: independentCorrectLatencies.length,
    medianIndependentCorrectLatencyMs: round(percentile(independentCorrectLatencies, 0.5), 1),
    independentCorrectLatencyIqrMs: independentCorrectLatencies.length
      ? [
          round(percentile(independentCorrectLatencies, 0.25), 1),
          round(percentile(independentCorrectLatencies, 0.75), 1)
        ]
      : null,
    supportedAdministeredItems: supportEvents.length,
    supportRate: administered.length ? round(supportEvents.length / administered.length) : null,
    supportStageUses: Object.fromEntries(SUPPORT_STAGES.map(stage => [
      stage,
      events.filter(event => asArray(event.supportStages).includes(stage)).length
    ]))
  };
}

function participantPhaseRows(dataset) {
  const rows = [];
  const childCodes = dataset.participants
    .filter(participant => participant.participantType === "child")
    .map(participant => participant.participantCode);
  for (const participantCode of childCodes) {
    for (const phase of ITEM_PHASES.filter(value => value !== "practice")) {
      const events = dataset.itemEvents.filter(event =>
        event.participantCode === participantCode && event.phase === phase
      );
      if (!events.length) continue;
      rows.push({
        participantCode,
        phase,
        ...metricsForEvents(events)
      });
    }
  }
  return rows;
}

function subgroupLabel(value) {
  if (value === null || value === undefined || value === "") return "not_recorded";
  if (typeof value === "boolean") return value ? "yes" : "no";
  return String(value);
}

function subgroupSummaries(dataset, minimumSubgroupSize) {
  const dimensions = [
    "ageBand",
    "gradeBand",
    "multilingualLearner",
    "additionalSupport",
    "cohortCode",
    "deviceClass"
  ];
  const childParticipants = dataset.participants.filter(participant => participant.participantType === "child");
  const output = {};

  for (const dimension of dimensions) {
    const groups = new Map();
    childParticipants.forEach(participant => {
      const label = subgroupLabel(participant[dimension]);
      const group = groups.get(label) || [];
      group.push(participant.participantCode);
      groups.set(label, group);
    });
    output[dimension] = Object.fromEntries([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(
      ([label, participantCodes]) => {
        if (participantCodes.length < minimumSubgroupSize) {
          return [label, {
            participants: participantCodes.length,
            suppressed: true,
            minimumSubgroupSize
          }];
        }
        const codeSet = new Set(participantCodes);
        const phaseMetrics = Object.fromEntries(
          ITEM_PHASES.filter(value => value !== "practice").map(phase => [
            phase,
            metricsForEvents(dataset.itemEvents.filter(event =>
              codeSet.has(event.participantCode) && event.phase === phase
            ))
          ])
        );
        return [label, {
          participants: participantCodes.length,
          suppressed: false,
          phaseMetrics
        }];
      }
    ));
  }
  return output;
}

export function summarizePilotDataset(dataset, { minimumSubgroupSize = 5 } = {}) {
  const validation = validatePilotDataset(dataset);
  if (!validation.valid) {
    throw new Error(`Pilot dataset validation failed:\n${validation.errors.join("\n")}`);
  }
  if (!Number.isInteger(minimumSubgroupSize) || minimumSubgroupSize < 5) {
    throw new Error("minimumSubgroupSize must be an integer of at least 5");
  }

  const phaseMetrics = Object.fromEntries(
    ITEM_PHASES.map(phase => [
      phase,
      metricsForEvents(dataset.itemEvents.filter(event => event.phase === phase))
    ])
  );
  const usabilityTaskCounts = Object.fromEntries(
    [...new Set(dataset.usabilityObservations.map(row => row.taskId))].sort().map(taskId => [
      taskId,
      Object.fromEntries([...TASK_STATES].map(state => [
        state,
        dataset.usabilityObservations.filter(row => row.taskId === taskId && row.taskState === state).length
      ]))
    ])
  );
  const teacherTaskCounts = Object.fromEntries(
    [...new Set(dataset.teacherFeedback.map(row => row.taskId))].sort().map(taskId => [
      taskId,
      Object.fromEntries([...TASK_STATES].map(state => [
        state,
        dataset.teacherFeedback.filter(row => row.taskId === taskId && row.taskState === state).length
      ]))
    ])
  );

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    descriptiveOnly: true,
    causalClaim: false,
    imputationPerformed: false,
    automaticReleaseDecision: false,
    provenance: {
      study: dataset.study,
      minimumSubgroupSize
    },
    flow: {
      participants: dataset.participants.length,
      childParticipants: dataset.participants.filter(row => row.participantType === "child").length,
      teacherParticipants: dataset.participants.filter(row => row.participantType === "teacher").length,
      withdrawnParticipants: dataset.participants.filter(row => Boolean(row.withdrawnAt)).length,
      sessionsByPhase: Object.fromEntries(PILOT_PHASES.map(phase => [
        phase,
        dataset.sessions.filter(session => session.phase === phase).length
      ]))
    },
    phaseMetrics,
    participantPhaseMetrics: participantPhaseRows(dataset),
    subgroupOutcomes: subgroupSummaries(dataset, minimumSubgroupSize),
    usabilityTaskCounts,
    teacherTaskCounts,
    missingness: {
      itemEventsWithoutLatency: dataset.itemEvents.filter(row => row.latencyMs === null).length,
      noResponse: dataset.itemEvents.filter(row => row.responseStatus === "no_response").length,
      notAdministered: dataset.itemEvents.filter(row => row.responseStatus === "not_administered").length,
      discontinued: dataset.itemEvents.filter(row => row.responseStatus === "discontinued").length
    },
    deviations: {
      total: dataset.deviations.length,
      bySeverity: Object.fromEntries([...DEVIATION_SEVERITIES].map(severity => [
        severity,
        dataset.deviations.filter(row => row.severity === severity).length
      ])),
      pendingReview: dataset.deviations.filter(row => row.analysisDisposition === "pending_review").length
    }
  };
}
