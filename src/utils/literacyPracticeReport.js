import { REPORTING_BIBLE_POLICY, REPORT_STATUS_IDS, reportStatusLabel, evaluateEvidenceSufficiency } from "../policy/reportingBible.js";
import { mergePracticeProgressRecords, normalizePracticeCompletionEvent } from "./practiceCompletionRecords.js";
import { LITERACY_PRACTICE_ID, LITERACY_PRACTICE_VERSION, LITERACY_DOMAINS } from "../policy/literacyPracticePolicy.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const COUNT_KEYS = ["presentations", "independentCount", "independentCorrect", "independentIncorrect", "recentIndependentCount", "recentCorrect", "recentIncorrect", "historicalIndependentCount", "supported", "supportedTransfers", "transfers", "transferCorrect", "repeats", "knownFamiliar", "unknownFamiliarity", "skipped", "noResponse", "mediaFailed", "audioNotDelivered", "unscored", "conflicts", "incomplete", "unknownRecency"];
const emptyCounts = () => Object.fromEntries(COUNT_KEYS.map(key => [key, 0]));
const text = value => typeof value === "string" ? value.trim() : "";
const validLevel = value => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) && Number(value) > 0;
const timeOf = value => typeof value === "string" && value.trim() ? Date.parse(value) : NaN;
const familiar = response => response.priorPracticeExposure === true || response.knownPracticeFamiliarity === true || ["known_familiar", "familiar", "previously_practiced"].includes(response.familiarity);
const knownFresh = response => response.familiarity === "known_fresh" || (response.familiarityKnown !== false && (response.priorPracticeExposure === false || response.knownPracticeFamiliarity === false));

function skillRow(skill) {
  const skillId = text(skill.id || skill.skillId) || "unidentified";
  const domainId = text(skill.domainId) || "other";
  return {
    ...emptyCounts(), skillId, id: skillId, label: text(skill.label || skill.skillName) || (skillId === "unidentified" ? "Unidentified skill" : skillId),
    domainId, domainLabel: text(skill.domainLabel) || LITERACY_DOMAINS.find(domain => domain.id === domainId)?.label || "Other literacy practice",
    suggestion: text(skill.suggestion), responses: [], levels: [], lastPracticedAt: null
  };
}

function classify(response) {
  if (response.conflicted) return "conflict";
  if (response.responseStatus === "media_failed" || response.mediaReady === false) return "media_failed";
  if (response.responseStatus === "no_response") return "no_response";
  if (response.responseStatus === "skipped") return "skipped";
  if (response.audioRequired === true && ((typeof response.audioDelivery === "string" && response.audioDelivery !== "delivered")
    || !(response.targetDelivered === true || response.audioDelivery === "delivered" || response.targetDelivery === "completed"))) return "audio_not_delivered";
  if (response.validity === "invalid") return "invalid";
  if (response.presentationRole === "transfer") return "supported_transfer";
  if (response.responseStatus === "supported" || response.supportUsed === true || response.evidenceType === "supported") return "supported";
  if (!text(response.skillId) || !text(response.questionId) || !validLevel(response.level)
    || response.presentationRole !== "first_probe" || response.responseStatus !== "answered"
    || response.evidenceType !== "independent" || typeof response.isCorrect !== "boolean") return "incomplete";
  if (response.recency === "unknown" || response.recency === "future") return "unknown_recency";
  if (response.repeated) return "repeat";
  if (response.knownFamiliar) return "known_familiar";
  return "independent_first_probe";
}

function countResponse(row, response) {
  row.presentations++;
  if (response.repeated) row.repeats++;
  if (response.knownFamiliar) row.knownFamiliar++;
  if (response.familiarityStatus === "unknown") row.unknownFamiliarity++;
  if (["unknown", "future"].includes(response.recency)) row.unknownRecency++;
  if (response.presentationRole === "transfer") row.transfers++;
  if (response.classification === "independent_first_probe") {
    row.independentCount++;
    row[response.isCorrect ? "independentCorrect" : "independentIncorrect"]++;
    if (response.recency === "recent") {
      row.recentIndependentCount++;
      row[response.isCorrect ? "recentCorrect" : "recentIncorrect"]++;
    } else row.historicalIndependentCount++;
  } else if (response.classification === "supported_transfer") {
    row.supportedTransfers++;
    if (response.isCorrect === true || response.answerMatch === true || response.firstResponseCorrect === true) row.transferCorrect++;
  } else if (response.classification === "supported") row.supported++;
  else {
    row.unscored++;
    const counter = { conflict: "conflicts", skipped: "skipped", no_response: "noResponse", media_failed: "mediaFailed", audio_not_delivered: "audioNotDelivered", incomplete: "incomplete" }[response.classification];
    if (counter) row[counter]++;
  }
}

function finalizeSkill(row) {
  const levels = new Map();
  for (const response of row.responses) {
    const key = validLevel(response.level) ? Number(response.level) : null;
    const level = levels.get(key) || { level: key, ...emptyCounts() };
    countResponse(level, response);
    levels.set(key, level);
  }
  row.levels = [...levels.values()].sort((a, b) => (a.level ?? Infinity) - (b.level ?? Infinity)).map(level => ({
    ...level, evidenceSufficiency: evaluateEvidenceSufficiency(level.recentIndependentCount)
  }));
  row.statusId = row.presentations ? REPORT_STATUS_IDS.NOT_ENOUGH_EVIDENCE : REPORT_STATUS_IDS.NOT_CHECKED;
  row.statusLabel = reportStatusLabel(row.statusId);
  row.coverage = !row.presentations ? "not_yet_sampled" : row.recentIndependentCount ? "recent_sample" : row.historicalIndependentCount ? "historical_only" : "no_independent_sample";
  row.coverageLabel = { not_yet_sampled: "Not yet sampled", recent_sample: "Recent sample", historical_only: "Historical sample only", no_independent_sample: "No independent sample" }[row.coverage];
  row.evidenceNote = row.recentIndependentCount
    ? "Counts describe the questions practiced at each level. They do not establish proficiency."
    : row.historicalIndependentCount ? "Older responses are retained as history. Try new questions for a current picture."
      : row.presentations ? "Collect independent first responses to new questions before drawing conclusions." : "No practice sample has been recorded. This is not a weakness.";
  return row;
}

/**
 * Teacher-only descriptive practice evidence. No percentage, proficiency,
 * placement or growth estimate is calculated across adaptive difficulty levels.
 * A question's first recorded exposure is consumed even when support was used,
 * so a later familiar answer can never become a fresh independent result.
 */
export function buildLiteracyPracticeReport({ practiceRecord } = {}, { skills = [], now = new Date() } = {}) {
  const nowMs = now instanceof Date ? now.getTime() : typeof now === "number" ? now : Date.parse(now);
  if (!Number.isFinite(nowMs)) throw new TypeError("A valid report date is required.");
  const windowDays = REPORTING_BIBLE_POLICY.recency.conclusionWindowDays;
  const windowStartMs = nowMs - windowDays * DAY_MS;
  const record = mergePracticeProgressRecords(undefined, practiceRecord);
  const conflictIds = new Set(record.completionConflictIds || []);
  const events = record.completions.filter(event => event.gameId === LITERACY_PRACTICE_ID && event.contentVersion === LITERACY_PRACTICE_VERSION);
  const responses = events.flatMap(event => event.steps.map((step, stepIndex) => {
    const occurredAt = step.occurredAt ?? event.completedAt;
    const timestamp = timeOf(occurredAt);
    const recency = !Number.isFinite(timestamp) ? "unknown" : timestamp > nowMs ? "future" : timestamp < windowStartMs ? "historical" : "recent";
    return {
      ...step, responseId: event.id, stepIndex, sessionId: text(event.sessionId), contentVersion: event.contentVersion,
      occurredAt, timestamp, recency, conflicted: conflictIds.has(event.id),
      knownFamiliar: familiar(step), familiarityStatus: familiar(step) ? "known_familiar" : knownFresh(step) ? "known_fresh" : "unknown"
    };
  })).sort((a, b) => (Number.isFinite(a.timestamp) ? a.timestamp : -Infinity) - (Number.isFinite(b.timestamp) ? b.timestamp : -Infinity)
    || a.responseId.localeCompare(b.responseId) || a.stepIndex - b.stepIndex);

  // Conflicting question identities also cannot support a skill-level claim.
  const identities = new Map();
  const simultaneousResponses = new Map();
  const questionConflicts = new Set();
  for (const response of responses) {
    const questionId = text(response.questionId);
    if (!questionId) continue;
    const identity = JSON.stringify([text(response.skillId), validLevel(response.level) ? Number(response.level) : null]);
    if (identities.has(questionId) && identities.get(questionId) !== identity) questionConflicts.add(questionId);
    else identities.set(questionId, identity);
    // A timestamp tie must not be broken alphabetically into an invented first
    // answer when the records disagree about the response or its independence.
    const moment = JSON.stringify([questionId, response.occurredAt]);
    const answerIdentity = JSON.stringify([response.isCorrect, response.evidenceType, response.presentationRole, response.responseStatus, response.supportUsed]);
    if (simultaneousResponses.has(moment) && simultaneousResponses.get(moment) !== answerIdentity) questionConflicts.add(questionId);
    else simultaneousResponses.set(moment, answerIdentity);
  }
  const seenQuestions = new Set();
  const skillMap = new Map();
  for (const skill of Array.isArray(skills) ? skills : []) {
    if (skill && text(skill.id || skill.skillId)) {
      const row = skillRow(skill);
      if (!skillMap.has(row.skillId)) skillMap.set(row.skillId, row);
    }
  }
  for (const response of responses) {
    const questionId = text(response.questionId);
    response.conflicted ||= questionConflicts.has(questionId);
    response.repeated = Boolean(questionId && seenQuestions.has(questionId));
    if (questionId) seenQuestions.add(questionId);
    if (response.repeated) { response.knownFamiliar = true; response.familiarityStatus = "known_familiar"; }
    response.classification = classify(response);
    response.countedIndependent = response.classification === "independent_first_probe";
    const id = text(response.skillId) || "unidentified";
    const row = skillMap.get(id) || skillRow({ ...response, id, label: response.skillName, domainId: response.domainId || response.itemSnapshot?.domainId || response.itemSnapshot?.literacyDomainId, domainLabel: response.domainLabel || response.itemSnapshot?.domainLabel });
    row.responses.push(response);
    if (Number.isFinite(response.timestamp) && response.timestamp <= nowMs && (!row.lastPracticedAt || timeOf(row.lastPracticedAt) < response.timestamp)) row.lastPracticedAt = new Date(response.timestamp).toISOString();
    countResponse(row, response);
    skillMap.set(id, row);
  }
  const rows = [...skillMap.values()].map(finalizeSkill);
  const totals = emptyCounts();
  const domainMap = new Map();
  for (const row of rows) {
    const domain = domainMap.get(row.domainId) || { id: row.domainId, domainId: row.domainId, label: row.domainLabel, ...emptyCounts(), skills: [], skillsSampled: 0, skillsWithRecentSamples: 0 };
    for (const key of COUNT_KEYS) { totals[key] += row[key]; domain[key] += row[key]; }
    domain.skills.push(row);
    if (row.independentCount) domain.skillsSampled++;
    if (row.recentIndependentCount) domain.skillsWithRecentSamples++;
    domain.totalSkills = domain.skills.length;
    domainMap.set(row.domainId, domain);
  }
  totals.sessions = new Set(events.map(event => text(event.sessionId)).filter(Boolean)).size;
  totals.totalSkills = rows.length;
  totals.skillsSampled = rows.filter(row => row.independentCount > 0).length;
  totals.skillsWithRecentSamples = rows.filter(row => row.recentIndependentCount > 0).length;
  totals.notYetSampled = rows.filter(row => row.presentations === 0).length;
  totals.conflictingEventIds = events.filter(event => conflictIds.has(event.id)).length;
  totals.conflictingQuestionIds = questionConflicts.size;
  totals.invalidRecords = (Array.isArray(practiceRecord?.completions) ? practiceRecord.completions : []).filter(event => event?.gameId === LITERACY_PRACTICE_ID && event?.contentVersion === LITERACY_PRACTICE_VERSION && !normalizePracticeCompletionEvent(event)).length;

  const strengths = rows.filter(row => row.recentCorrect > 0).map(row => ({
    skillId: row.skillId, label: row.label, count: row.recentCorrect,
    description: `${row.recentCorrect} correct ${row.recentCorrect === 1 ? "answer" : "answers"} on first recorded independent attempts. ${row.recentIncorrect ? `${row.recentIncorrect} other ${row.recentIncorrect === 1 ? "answer needs" : "answers need"} another look.` : "Try different questions to see whether this carries over."}`
  }));
  const suggestedSteps = rows.filter(row => row.skillId !== "unidentified").map(row => {
    const recentSupport = row.responses.some(response => response.recency === "recent" && ["supported", "supported_transfer"].includes(response.classification));
    const teaching = row.recentIncorrect > 0 || recentSupport;
    const type = teaching ? "teach_and_retry" : row.recentIndependentCount ? "extend_sample" : row.historicalIndependentCount ? "refresh_sample" : "collect_sample";
    const reason = row.recentIncorrect > 0 ? `${row.recentIncorrect} recent independent ${row.recentIncorrect === 1 ? "answer needs" : "answers need"} another look.`
      : recentSupport ? "Recent practice included teaching or a supported transfer."
        : row.recentIndependentCount ? "Build on the observed successes with varied questions."
          : row.historicalIndependentCount ? "The independent sample is older than the current evidence window."
            : row.presentations ? "An independent sample is still needed." : "Not yet sampled; no strength or weakness is inferred.";
    return {
      skillId: row.skillId, label: row.label, domainId: row.domainId, type, reason,
      suggestion: teaching ? `${row.suggestion || `Model one example of ${row.label.toLowerCase()} and talk through the reasoning.`} Then offer a different question without help.`
        : type === "extend_sample" ? `Try varied ${row.label.toLowerCase()} questions at the same practice level before increasing the challenge.`
          : `Offer new ${row.label.toLowerCase()} questions and record the first response before giving help.`,
      priority: teaching ? 0 : type === "refresh_sample" ? 1 : type === "collect_sample" ? 2 : 3
    };
  });
  const nextSteps = suggestedSteps.filter(step => step.priority === 0);
  // Catalog order begins with phonics. Round-robin the remaining sampling
  // suggestions so a short visible list exposes the breadth still to explore.
  // Observed teaching needs always stay ahead of missing-sample suggestions.
  for (const priority of [...new Set(suggestedSteps.map(step => step.priority))].filter(value => value > 0).sort((a, b) => a - b)) {
    const byDomain = new Map();
    for (const step of suggestedSteps.filter(value => value.priority === priority)) {
      if (!byDomain.has(step.domainId)) byDomain.set(step.domainId, []);
      byDomain.get(step.domainId).push(step);
    }
    const domainOrder = [...byDomain.keys()].sort((a, b) => (domainMap.get(a)?.recentIndependentCount || 0) - (domainMap.get(b)?.recentIndependentCount || 0)
      || LITERACY_DOMAINS.findIndex(domain => domain.id === a) - LITERACY_DOMAINS.findIndex(domain => domain.id === b));
    while (domainOrder.some(domain => byDomain.get(domain).length)) {
      for (const domain of domainOrder) {
        const step = byDomain.get(domain).shift();
        if (step) nextSteps.push(step);
      }
    }
  }
  return {
    generatedAt: new Date(nowMs).toISOString(), contentVersion: LITERACY_PRACTICE_VERSION, practiceOnly: true,
    evidenceWindow: { days: windowDays, from: new Date(windowStartMs).toISOString(), to: new Date(nowMs).toISOString() },
    domains: [...domainMap.values()], skills: rows, nextSteps, strengths, totals, responses,
    legacyEvidenceUnknown: Boolean(record.legacyEvidenceUnknown),
    note: "Practice observations help plan teaching. They are not an NWEA MAP score, a proficiency judgment, a diagnosis or a prediction. Difficulty levels are reported separately. Repeated questions, known familiar questions, help and transfer answers do not add independent first-probe evidence. Familiarity outside recorded practice may be unknown."
  };
}
