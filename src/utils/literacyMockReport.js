import { hasLiteracySupport, isKnownLiteracyFamiliar, isEligibleLiteracyResponse, canonicalLiteracyIdentity, buildLiteracyExposureIndex, getLiteracyExposure, literacyEvidenceConditions } from "./literacyEvidence.js";
import { evaluateLearningConclusion, LEARNING_CONCLUSION_SCOPES, LEARNING_STATUS_IDS } from "../policy/learningPolicy.js";
import { LITERACY_DOMAINS, LITERACY_CORE_SKILLS } from "../policy/literacyPracticePolicy.js";
import { LITERACY_EXTENSION_SKILLS } from "../data/literacyPracticeExtensions.js";
import { evaluateEvidenceSufficiency, REPORTING_BIBLE_POLICY } from "../policy/reportingBible.js";
import { literacyMockFocus, literacyMockTaskKey } from './literacyMockConditions.js';
import { literacyItemQualityIssue } from '../policy/literacyItemEligibility.js';

export const LITERACY_MOCK_REPORT_AREAS = Object.freeze([
  { id: "foundations", label: "Foundational skills", domains: ["sound_awareness", "phonics", "print"] },
  { id: "language_writing", label: "Language and writing", domains: ["language", "writing"] },
  { id: "comprehension", label: "Literature and informational text", domains: ["reading", "listening"] },
  { id: "vocabulary", label: "Vocabulary", domains: ["vocabulary"] }
]);
export const LITERACY_MOCK_REPORT_SKILLS = Object.freeze([...LITERACY_CORE_SKILLS, ...LITERACY_EXTENSION_SKILLS]);
import { LITERACY_MOCK_FOUNDATION_SKILLS, LITERACY_MOCK_AREA_ORDER, LITERACY_MOCK_AREA_MAX, LITERACY_MOCK_AREA_VERSION } from '../policy/literacyMockAdaptivePolicy.js';
const AREA_REPORTS = LITERACY_MOCK_AREA_ORDER.map(id => ({id,label:LITERACY_DOMAINS.find(area=>area.id===id).label,domains:[id]}));
const DAY_MS = 86400000;
const counts = () => ({ independent: 0, correct: 0, incorrect: 0, supported: 0, familiar: 0, unscored: 0 });
const text = value => typeof value === "string" ? value.trim() : "";
export const literacyMockStudentName = student => text(student?.name) || [text(student?.first_name), text(student?.last_name)].filter(Boolean).join(" ") || "Student name unavailable";

const windowMode = value => ['timed_sample', 'pause_at_window_end','untimed'].includes(value) ? value : null;
const durationSeconds = value => Number.isFinite(value) && value > 0 ? value : null;
const extensionCount = value => Number.isInteger(value) && value >= 0 ? value : null;
const administrationKey = response => JSON.stringify([
  response.administration || response.itemSnapshot?.administration || null,
  windowMode(response.sourceWindowMode), durationSeconds(response.sourceDurationSeconds), extensionCount(response.sourceTimeExtensionCount),
]);
const comparableKey = response => JSON.stringify([literacyMockTaskKey(response), Number(response.level), response.itemSnapshot?.adaptiveAreaBand ?? null, administrationKey(response)]);

export function literacyMockReportConditions(response) {
  const conditions = literacyEvidenceConditions(response);
  const mode = windowMode(response.sourceWindowMode);
  const seconds = durationSeconds(response.sourceDurationSeconds);
  const extensions = extensionCount(response.sourceTimeExtensionCount);
  const duration = seconds ? `${seconds / 60}-minute initial ${mode === 'timed_sample' ? 'limit' : 'break window'}` : 'initial duration not recorded';
  const extensionLabel = extensions === null ? 'Time extensions not recorded'
    : extensions === 0 ? 'No time extensions' : `${extensions} time ${extensions === 1 ? 'extension' : 'extensions'} recorded`;
  return { ...conditions, administration: mode === 'timed_sample' ? `Timed sample · ${duration} · ${extensionLabel}`
    : mode === 'untimed' ? 'Teacher-led assessment · No time limit' : mode === 'pause_at_window_end' ? `Teacher-resumable rehearsal · ${duration} · ${extensionLabel}` : `${conditions.administration} · Window behavior not recorded` };
}

// Use the latest sufficient sample, not an average that keeps earlier errors
// in a current instructional suggestion. The existing shared minimum determines
// the sample boundary; equal-time observations stay together. All dated evidence
// remains available separately, with no new proficiency or growth claim.
function currentEvidenceSample(responses, nowMs) {
  const sorted = [...responses].sort((a, b) => Date.parse(b.serverReceivedAt) - Date.parse(a.serverReceivedAt));
  const minimum = REPORTING_BIBLE_POLICY.evidenceSufficiency.judgementMinimumScoredItems;
  const cutoff = sorted.length >= minimum ? Date.parse(sorted[minimum - 1].serverReceivedAt) : -Infinity;
  const latest = sorted.filter(response => Date.parse(response.serverReceivedAt) >= cutoff).reverse();
  const correct = latest.filter(response => response.isCorrect).length;
  const dates = latest.map(response => response.serverReceivedAt).sort();
  const conclusion = evaluateLearningConclusion({ scope: LEARNING_CONCLUSION_SCOPES.SKILL,
    attempts: latest.length, accuracy: latest.length ? correct / latest.length * 100 : null,
    skillDiversity: 1, observedAt: dates.at(-1), now: new Date(nowMs) });
  return { responses: latest, correct, incorrect: latest.length - correct, firstObservedAt: dates[0],
    lastObservedAt: dates.at(-1), conclusion };
}

export function literacyMockAnswerText(value) {
  if (value === null || value === undefined || value === "") return "Not recorded";
  if (Array.isArray(value)) return value.map(literacyMockAnswerText).join(", ");
  if (typeof value === "object") return literacyMockAnswerText(value.label ?? value.text ?? value.word ?? value.id);
  return String(value);
}

export function literacyMockResponseText(value, snapshot = {}) {
  const choices = new Map((snapshot.choices || []).map(choice => [choice.id, choice.label]));
  const resolve = answer => literacyMockAnswerText(choices.get(answer) ?? answer);
  if (Array.isArray(value)) {
    if (snapshot.format === "match") return value.map((answer, index) => `${literacyMockAnswerText(snapshot.matchTargets?.[index]?.label)} → ${resolve(answer)}`).join("; ");
    return value.map(resolve).join(snapshot.format === "order" ? " → " : ", ");
  }
  return resolve(value);
}

function classification(response, repeated) {
  if (literacyItemQualityIssue(response)) return "content_invalid";
  if (response.responseStatus === "skipped") return "skipped";
  if (response.responseStatus !== "answered" || typeof response.isCorrect !== "boolean"
      || !text(response.questionId) || !response.itemSnapshot || !Number.isFinite(Date.parse(response.serverReceivedAt))) return "incomplete";
  if (hasLiteracySupport(response)) return "supported";
  if (response.evidenceType !== "independent") return "unscored";
  if (repeated || isKnownLiteracyFamiliar(response)) return "familiar";
  return isEligibleLiteracyResponse(response) ? "independent" : "unscored";
}

function add(row, response) {
  if (response.classification === "independent") {
    row.independent++;
    row[response.isCorrect ? "correct" : "incorrect"]++;
  } else if (["supported", "familiar"].includes(response.classification)) row[response.classification]++;
  else row.unscored++;
}

/** Describes one server-authorized session. Never estimates proficiency or compares pupils. */
export function buildLiteracyMockReport(payload, { students = [], skills = null, now = Date.now(), includeHistory = true } = {}) {
  const nowMs = now instanceof Date ? now.getTime() : typeof now === "number" ? now : Date.parse(now);
  if (!Number.isFinite(nowMs)) throw new TypeError("A valid report time is required.");
  const recentStart = nowMs - REPORTING_BIBLE_POLICY.recency.conclusionWindowDays * DAY_MS;
  const roster = new Map(students.map(student => [String(student.id), student]));
  const session = payload?.session || null;
  const areaAdaptive = ['literacy-mock-v5','literacy-mock-v6','literacy-mock-v7'].includes(session?.content_version || session?.mock?.content_version);
  const version=session?.content_version || session?.mock?.content_version;
  const demandV6=['literacy-mock-v6','literacy-mock-v7'].includes(version);
  skills ??= areaAdaptive ? [...LITERACY_MOCK_REPORT_SKILLS,...LITERACY_MOCK_FOUNDATION_SKILLS] : LITERACY_MOCK_REPORT_SKILLS;
  const reportAreas=areaAdaptive ? AREA_REPORTS : LITERACY_MOCK_REPORT_AREAS;
  const itemCount = Number.isInteger(session?.mock?.item_count) ? session.mock.item_count : null;
  const pupils = (Array.isArray(payload?.members) ? payload.members : []).map(member => {
    const studentId = String(member.student_id);
    const run = member.run;
    const bySkill = new Map(skills.map(skill => [skill.id, { ...skill, ...counts(), responses: [], levels: [], recordedOffers: 0, mediaFailureCount: 0, unansweredPresentationCount: 0 }]));
    const rawResponses = Array.isArray(run?.responses) ? run.responses : [];
    const presentedById = new Map();
    for (const presentation of Array.isArray(run?.presentations) ? run.presentations : []) {
      if (text(presentation.questionId) && presentation.itemSnapshot && Number.isFinite(Date.parse(presentation.serverReceivedAt))
        && !presentedById.has(presentation.questionId)) presentedById.set(presentation.questionId, presentation);
    }
    const presentations = [...presentedById.values()];
    const recordedOffers = new Map();
    function recordOffer(value) {
      if (!bySkill.has(value.skillId)) return;
      if (!recordedOffers.has(value.skillId)) recordedOffers.set(value.skillId, new Set());
      recordedOffers.get(value.skillId).add(value.questionId);
    }
    presentations.forEach(recordOffer);
    const mediaFailures = [...(Array.isArray(run?.mediaFailures) ? run.mediaFailures : []),
      ...rawResponses.filter(response => response.responseStatus === "media_failed")]
      .map((failure, index) => ({ ...failure, index, responseStatus: "media_failed", classification: "media_failed", isCorrect: null, evidenceType: "unscored" }));
    for (const failure of mediaFailures) {
      const skill = bySkill.get(failure.skillId);
      if (skill) { recordOffer(failure); skill.mediaFailureCount++; }
    }
    const seen = new Set();
    const exposures = buildLiteracyExposureIndex();
    const responses = rawResponses.filter(response => response.responseStatus !== "media_failed").map((response, index) => {
      const repeated = seen.has(response.questionId);
      if (response.questionId) seen.add(response.questionId);
      const exposure = getLiteracyExposure(response, exposures);
      const identity = canonicalLiteracyIdentity(response);
      if (identity.itemId) exposures.items.add(identity.itemId);
      if (identity.passageKey) exposures.passages.add(identity.passageKey);
      if (identity.familyId) exposures.families.add(identity.familyId);
      const enriched = { ...response, knownFamiliar: isKnownLiteracyFamiliar(response) || exposure.knownFamiliar === true ? true : response.knownFamiliar ?? null,
        familiarityReasons: [...new Set([...(response.familiarityReasons || []), ...exposure.familiarityReasons])] };
      const receivedAt = Date.parse(response.serverReceivedAt);
      const sourceConditions = { ...enriched,
        sourceWindowMode: windowMode(Object.hasOwn(response, 'sourceWindowMode') ? response.sourceWindowMode : run?.windowMode ?? session?.mock?.window_mode),
        sourceDurationSeconds: durationSeconds(Object.hasOwn(response, 'sourceDurationSeconds') ? response.sourceDurationSeconds : run?.durationSeconds ?? session?.mock?.duration_seconds),
        sourceTimeExtensionCount: extensionCount(Object.hasOwn(response, 'sourceTimeExtensionCount') ? response.sourceTimeExtensionCount : run?.timeExtensionCount) };
      const row = { ...sourceConditions, sourceSessionId: response.sourceSessionId || session?.id, conditions: literacyMockReportConditions(sourceConditions), index, classification: classification(enriched, repeated),
        recent: Number.isFinite(receivedAt) && receivedAt <= nowMs && receivedAt >= recentStart };
      const contentIssue = literacyItemQualityIssue(response);
      // Interpret invalid content separately without rewriting the saved first
      // answer, original key or immutable published snapshot.
      if (contentIssue) Object.assign(row, { contentIssue, originalIsCorrect: Object.hasOwn(response, 'originalIsCorrect') ? response.originalIsCorrect : response.isCorrect,
        isCorrect: null, evidenceType: 'unscored', validity: 'invalid' });
      // Unknown metadata remains visible, but cannot create a skill or group claim.
      if (!bySkill.has(row.skillId) || !Number.isFinite(Number(row.level)) || Number(row.level) < 1) row.classification = "incomplete";
      const demand=row.itemSnapshot?.adaptiveAreaBand;
      if(areaAdaptive && (row.itemSnapshot?.adaptiveAreaVersion!==(version==='literacy-mock-v7'?'areas-v3':demandV6?'areas-v2':LITERACY_MOCK_AREA_VERSION) || !Number.isInteger(demand) || demand<0 || demand>LITERACY_MOCK_AREA_MAX[row.domainId]
        || (demandV6&&!row.itemSnapshot?.adaptiveDemand?.operation))) row.classification='incomplete';
      const skill = bySkill.get(row.skillId);
      if (skill) { recordOffer(row); skill.responses.push(row); add(skill, row); }
      return row;
    });
    const recordedResponseIds = new Set(rawResponses.map(response => response.questionId));
    const failedIds = new Set(mediaFailures.map(failure => failure.questionId));
    const unansweredPresentations = presentations.filter(value => !recordedResponseIds.has(value.questionId) && !failedIds.has(value.questionId))
      .map(value => {
        const source = { ...value, sourceSessionId: session?.id,
          sourceWindowMode: windowMode(run?.windowMode ?? session?.mock?.window_mode),
          sourceDurationSeconds: durationSeconds(run?.durationSeconds ?? session?.mock?.duration_seconds),
          sourceTimeExtensionCount: extensionCount(run?.timeExtensionCount) };
        const contentIssue = literacyItemQualityIssue(value);
        return { ...source, conditions: literacyMockReportConditions(source), contentIssue,
          classification: contentIssue ? 'content_invalid' : 'unanswered', responseStatus: 'unanswered', isCorrect: null, evidenceType: 'unscored' };
      });
    for (const value of unansweredPresentations) if (bySkill.has(value.skillId)) bySkill.get(value.skillId).unansweredPresentationCount++;
    for (const [id, offers] of recordedOffers) bySkill.get(id).recordedOffers = offers.size;
    const totals = counts();
    responses.forEach(response => add(totals, response));
    const skillRows = [...bySkill.values()].map(skill => {
      const levels = new Map();
      for (const response of skill.responses) {
        const level = Number(response.level);
        const row = levels.get(level) || { level, ...counts() };
        add(row, response); levels.set(level, row);
      }
      return { ...skill, offered: skill.recordedOffers > 0, offeredWithoutIndependentResponse: skill.recordedOffers > 0 && skill.independent === 0, sampled: skill.independent + skill.supported + skill.familiar > 0, evidenceSufficiency: evaluateEvidenceSufficiency(skill.responses.filter(response => response.recent && response.classification === "independent").length),
        levels: [...levels.values()].sort((a, b) => a.level - b.level),
        recentErrors: skill.responses.filter(response => response.recent && response.classification === "independent" && !response.isCorrect) };
    });
    const areas = reportAreas.map(area => {
      const areaSkills = skillRows.filter(skill => area.domains.includes(skill.domainId));
      const total = counts();
      areaSkills.forEach(skill => Object.keys(total).forEach(key => { total[key] += skill[key]; }));
      return { ...area, ...total, totalSkills: areaSkills.length, sampledSkills: areaSkills.filter(skill => skill.sampled).length, offeredSkills: areaSkills.filter(skill => skill.offered).length, independentSkills: areaSkills.filter(skill => skill.independent > 0).length, offeredWithoutIndependentResponse: areaSkills.filter(skill => skill.offeredWithoutIndependentResponse).length };
    });
    const planned = Array.isArray(run?.plan?.itemIds) ? run.plan.itemIds.length : itemCount;
    const unsampledItems = planned === null ? null : Math.max(0, planned - responses.length);
    const presentationTracking = run?.presentationTracking === true;
    const notReachedItems = presentationTracking && Array.isArray(run?.plan?.itemIds)
      ? run.plan.itemIds.filter(id => !presentedById.has(id) && !recordedResponseIds.has(id) && !failedIds.has(id)).length : null;
    const helpRequests = Array.isArray(run?.helpRequests) ? run.helpRequests : [];
    const patternMap = new Map();
    for (const response of responses.filter(value => value.recent && value.classification === 'independent')) {
      const key = comparableKey(response);
      if (!patternMap.has(key)) patternMap.set(key, { id: key, skillId: response.skillId,
        label: bySkill.get(response.skillId)?.label, adaptiveAreaBand:response.itemSnapshot?.adaptiveAreaBand, level: Number(response.level), conditions: response.conditions, responses: [] });
      patternMap.get(key).responses.push(response);
    }
    const patterns = [...patternMap.values()].map(pattern => {
      const correct = pattern.responses.filter(response => response.isCorrect).length;
      const dates = pattern.responses.map(response => response.serverReceivedAt).sort();
      const currentSample = currentEvidenceSample(pattern.responses, nowMs);
      const { conclusion } = currentSample;
      return { ...pattern, correct, incorrect: pattern.responses.length - correct, firstObservedAt: dates[0],
        lastObservedAt: dates.at(-1), sessionCount: new Set(pattern.responses.map(response => response.sourceSessionId)).size,
        currentSample, conclusion, teachingReviewEligible: conclusion.ready && conclusion.status.id === LEARNING_STATUS_IDS.NEEDS_SUPPORT };
    });
    return { areaAdaptive, studentId, name: literacyMockStudentName(roster.get(studentId)), member, run, responses, mediaFailures, mediaFailureCount: mediaFailures.length, skills: skillRows, areas, totals,
      withdrawnQuestionCount: new Set([...responses, ...unansweredPresentations].filter(value => value.contentIssue).map(value => value.questionId)).size,
      patterns, presentations, presentationTracking, unansweredPresentations, presentedUnansweredItems: presentationTracking ? unansweredPresentations.length : null,
      unansweredItems: unsampledItems, notReachedItems, helpRequests, pendingHelpRequests: helpRequests.filter(request => request.pending === true),
      planned, answered: responses.filter(response => response.responseStatus === "answered").length,
      processed: responses.length, unsampledItems, notOfferedSkills: skillRows.filter(skill => !skill.offered).length, offeredWithoutIndependentResponse: skillRows.filter(skill => skill.offeredWithoutIndependentResponse).length, unsampledSkills: skillRows.filter(skill => !skill.sampled).length,
      strengths: skillRows.filter(skill => skill.correct > 0), revisit: skillRows.filter(skill => skill.incorrect > 0),
      noIndependentEvidence: totals.independent === 0 };
  }).sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }) || a.studentId.localeCompare(b.studentId));
  const reviewMap = new Map();
  for (const pupil of pupils) for (const skill of pupil.skills) for (const error of skill.recentErrors) {
    // Conditions matter: text-and-audio and printed reading are not interchangeable.
    const key = comparableKey(error);
    if (!reviewMap.has(key)) reviewMap.set(key, { id: key, skillId: skill.id, level: Number(error.level), label: skill.label,
      domainId: skill.domainId, adaptiveAreaBand:error.itemSnapshot?.adaptiveAreaBand, conditions: error.conditions, focus: literacyMockFocus(error), sourceQuestionId: error.questionId,
      suggestion: `Review the response, then check a different ${skill.label.toLowerCase()} example without help at the same level and access conditions.`, members: [] });
    const group = reviewMap.get(key);
    if (group.members.some(member => member.studentId === pupil.studentId)) continue;
    const comparable = skill.responses.filter(response => response.recent && response.classification === "independent"
      && comparableKey(response) === comparableKey(error));
    const examples = comparable.filter(response => !response.isCorrect);
    const currentSample = currentEvidenceSample(comparable, nowMs);
    const { conclusion } = currentSample;
    group.members.push({ studentId: pupil.studentId, name: pupil.name, independentCount: comparable.length,
      incorrectCount: examples.length, examples, currentSample, conclusion, selected: false, sourceSessionId: examples.at(-1)?.sourceSessionId });
  }
  let reviewCandidates = [...reviewMap.values()];
  let groups = reviewCandidates.map(group => ({ ...group, members: group.members.filter(member => member.conclusion.ready
    && member.conclusion.status.id === LEARNING_STATUS_IDS.NEEDS_SUPPORT) })).filter(group => group.members.length > 0);
  if (includeHistory) {
    const historical = buildLiteracyMockReport({ session, members: pupils.map(pupil => {
      const version = pupil.run?.contentVersion || session?.content_version || session?.mock?.content_version;
      const priorRuns = (Array.isArray(pupil.member.priorRuns) ? pupil.member.priorRuns : [])
        .filter(run => run.assignmentId && run.assignmentId !== session?.id && (!version || run.contentVersion === version)
          && (!run.studentId || String(run.studentId) === pupil.studentId));
      const rows = [...priorRuns, { ...pupil.run, assignmentId: session?.id,
        windowMode: pupil.run?.windowMode ?? session?.mock?.window_mode,
        durationSeconds: pupil.run?.durationSeconds ?? session?.mock?.duration_seconds }].flatMap(run =>
        (run.responses || []).map(response => ({ ...response, sourceSessionId: run.assignmentId,
          sourceWindowMode: windowMode(run.windowMode), sourceDurationSeconds: durationSeconds(run.durationSeconds),
          sourceTimeExtensionCount: extensionCount(run.timeExtensionCount) })))
        .sort((a, b) => Date.parse(a.serverReceivedAt) - Date.parse(b.serverReceivedAt));
      return { student_id: pupil.studentId, run: { responses: rows }, priorRuns: [] };
    }) }, { students, skills, now: nowMs, includeHistory: false });
    for (const pupil of pupils) {
      const combined = historical.pupils.find(value => value.studentId === pupil.studentId);
      pupil.longitudinal = { patterns: combined.patterns, responses: combined.responses,
        otherResponses: combined.responses.filter(response => response.sourceSessionId !== session?.id && (!response.recent || response.classification !== 'independent')),
        available: Array.isArray(pupil.member.priorRuns), historyCoverage: pupil.member.historyCoverage || null,
        windowDays: REPORTING_BIBLE_POLICY.recency.conclusionWindowDays };
    }
    reviewCandidates = historical.reviewCandidates;
    groups = historical.groups;
  }
  return { session, pupils, groups, reviewCandidates, areaAdaptive, areas: reportAreas, totalSkills: skills.length,
    needsSample: pupils.filter(pupil => pupil.noIndependentEvidence),
    partialSamples: pupils.filter(pupil => !pupil.noIndependentEvidence && pupil.unsampledSkills > 0),
    generatedAt: new Date(nowMs).toISOString(),
    note: "Session counts describe this sitting; the dated evidence view also includes the earlier sessions shown. These observations are not MAP scores or proficiency judgments. Different questions and difficulty levels cannot be compared as an overall accuracy score. Listening and independent reading remain separate skills." };
}

export function literacyMockControlError(error) {
  const code = typeof error === "string" ? error : error?.code;
  return ({ stale_revision: "This session changed elsewhere. The latest state is loading; check it before trying again.",
    invalid_transition: "That action is no longer available. Refresh the session and check its current state.",
    assessment_finished: "This assessment has already finished. Saved answers remain available below.",
    device_data_required_for_answer_assistance: "Collect the iPad answers first, then record this answer help. Requested student help can still be resolved immediately; access-only help remains available.",
    collection_in_progress: "Answers are being collected. Keep started iPads open and connected until every receipt arrives.",
    offline_collection_required: "Open the Adaptive Literacy Test and collect device answers before ending this session or starting another activity.",
    student_busy: "One or more selected students already have an active session. Close their existing session first.",
    active_assignment_conflict: "You already have an active classroom assignment. No sessions were changed. Finish that assignment, then start this prepared check.",
    entry_items_unavailable: "No fresh entry examples are available for this skill. No session was created.",
    skill_already_observed: "This skill already has a recorded offer. Use that question to prepare a fresh check under the same conditions.",
    session_not_found: "This session is no longer available to your account.",
    class_not_found: "This class is no longer available to your account." })[code]
    || "The service could not confirm this action. Check your connection and retry; saved answers are preserved.";
}
