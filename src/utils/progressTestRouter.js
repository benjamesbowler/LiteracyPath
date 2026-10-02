import { progressPlan, PROGRESS_TEST_TYPE, PROGRESS_TEST_INSTRUMENT, PROGRESS_TEST_POLICY_VERSION, PROGRESS_TEST_TRACKS } from "../policy/progressTestPolicy.js";
import { LEARNING_EVIDENCE_POLICY } from "../policy/learningPolicy.js";

const clone = value => JSON.parse(JSON.stringify(value));
const hash = value => [...String(value)].reduce((n, c) => Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
const valid = row => ["correct", "incorrect"].includes(row.responseStatus);
const family = item => item.stimulusFamilyId || item.id;
const allSourcePaths = item => (item.media?.requiredSources || []).map(source => source.path).filter(Boolean);
const sourcePaths = item => (item.media?.requiredSources || []).filter(source => source.role === "passage").map(source => source.path).filter(Boolean);
const recencyDays = LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays;
export function progressTrackEvidence(run, trackId) {
  return run.responses.filter(row => row.trackId === trackId && valid(row));
}
function stopReason(run, trackId) {
  const rows = progressTrackEvidence(run, trackId);
  const state = run.tracks[trackId];
  if (state.unavailable) return "content_unavailable";
  if (rows.length >= run.plan.maximumPerTrack) return "item_cap";
  if (rows.length < run.plan.minimumPerTrack) return "";
  const count = (tier, correct) => new Set(rows.filter(row => row.difficultyTier === tier && row.isCorrect === correct).map(row => row.stimulusFamilyId)).size;
  const contradictory = rows.some(lower => !lower.isCorrect && rows.some(higher => higher.isCorrect && higher.difficultyTier > lower.difficultyTier));
  if (contradictory) return "";
  if (count(state.minimumTier, false) >= 2) return "floor_probed";
  if (count(state.maximumTier, true) >= 2) return "ceiling_probed";
  if (rows.length >= 6) for (let tier = state.minimumTier; tier < state.maximumTier; tier++) {
    if (count(tier, true) >= 2 && count(tier + 1, false) >= 2) return "adjacent_boundary_observed";
  }
  return "";
}
export function createProgressTestRun({ bank, studentId, studentName = "", classId = "", teacherId = "local", assignmentId = "", planKind, trackId, startingTier, startingReason = "", seed, attemptId, previousAttempts = [], knownExposures = [], at = new Date().toISOString() }) {
  if (!studentId || !bank?.items?.length) throw new Error("A learner and published progress questions are required.");
  const plan = progressPlan({ planKind, trackId });
  const runId = attemptId || `progress-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${hash(at + studentId)}`}`;
  const ownAttempts = previousAttempts.filter(record => record.studentId === studentId);
  const comparable = ownAttempts.filter(record => isComparableProgressAttempt(record, bank, studentId) && record.policyVersion === PROGRESS_TEST_POLICY_VERSION && Date.parse(at) - Date.parse(record.completedAt) >= 0 && Date.parse(at) - Date.parse(record.completedAt) <= recencyDays * 86400000).sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)));
  const exposureRows = [...ownAttempts.flatMap(record => record.questionRecords || []), ...knownExposures];
  const excludedFamilies = new Set(exposureRows.flatMap(row => [row.questionId, row.stimulusFamilyId, row.sourceStimulusFamilyId, row.itemSnapshot?.exposure?.publicStimulusFamilyId, row.itemSnapshot?.exposure?.sourceItemId]).filter(Boolean));
  const excludedSources = new Set(exposureRows.flatMap(row => [...sourcePaths(row.itemSnapshot || row), ...(row.sourcePaths || []), row.passageAudioPath, row.features?.passageAudioPath]).filter(Boolean));
  const pool = bank.items.filter(item => plan.trackIds.includes(item.trackId) && item.reservedPurpose === "progress_test" && !item.retentionOnly && !excludedFamilies.has(item.id) && !excludedFamilies.has(family(item)) && !(item.enemyItemGroups || []).some(enemy => excludedFamilies.has(enemy)) && !sourcePaths(item).some(path => excludedSources.has(path)));
  const startingPoints = {};
  const tracks = Object.fromEntries(plan.trackIds.map(id => {
    const tiers = [...new Set(pool.filter(item => item.trackId === id).map(item => item.difficultyTier))].sort((a, b) => a - b);
    if (!tiers.length) throw new Error(`Fresh questions unavailable for ${id}.`);
    const counts = tiers.map(tier => new Set(pool.filter(item => item.trackId === id && item.difficultyTier === tier).map(family)).size);
    if (tiers.length !== 3 || counts.some(count => count < plan.maximumPerTrack)) throw new Error(`Not enough fresh question families for ${id}. Choose another plan or replenish the bank.`);
    const previous = comparable.find(record => record.metadata?.result?.strands?.some(row => row.trackId === id && row.evidenceComplete));
    const prior = previous?.questionRecords?.filter(row => row.trackId === id && valid(row)).at(-1);
    const source = Number.isInteger(startingTier) ? "teacher_selected" : prior ? "recent_comparable_check" : "default_middle_tier";
    const requested = Number.isInteger(startingTier) ? startingTier : prior?.routeAfter ?? 1;
    const nextTier = Math.max(tiers[0], Math.min(tiers.at(-1), requested));
    startingPoints[id] = { tier: nextTier, source, sourceAttemptId: source === "recent_comparable_check" ? previous.attemptId : null, reason: startingReason, recencyDays };
    return [id, { minimumTier: tiers[0], maximumTier: tiers.at(-1), nextTier, unavailable: false }];
  }));
  return { schemaVersion: 1, attemptId: runId, studentId, studentName, classId, teacherId, assignmentId, contentVersion: bank.version, difficultyVersion: bank.difficultyVersion, policyVersion: PROGRESS_TEST_POLICY_VERSION, policySnapshot: { version: PROGRESS_TEST_POLICY_VERSION, plan: clone(plan), firstResponseOnly: true, recencyDays, contradictionStops: false }, startingPoints, exposureSnapshot: { families: [...excludedFamilies], sources: [...excludedSources], historyAttemptIds: ownAttempts.map(row => row.attemptId), familiarityUnknown: true }, plan, seed: seed || hash(runId), startedAt: at, completedAt: null, status: "warmup", pool: clone(pool), tracks, responses: [], routeDecisions: [], excludedFamilies: [...excludedFamilies], failedSources: [], currentItem: null, receipt: null, stopReasons: {}, pause: false, pauseEvents: [], foregroundMs: 0, warmupRecords: [], warmupIndex: 0 };
}
function isComparableProgressAttempt(record, bank, studentId) {
  return record.assessmentType === PROGRESS_TEST_TYPE && record.studentId === studentId && record.contentVersion === bank.version && record.metadata?.difficultyVersion === bank.difficultyVersion && record.administrationStatus === "completed";
}
export function beginProgressTest(run) { return nextProgressItem({ ...run, status: "running", warmupIndex: 2 }); }
export function nextProgressItem(original) {
  if (original.currentItem || original.pause || ["completed", "partial"].includes(original.status)) return original;
  const run = clone(original);
  run.receipt = null;
  const scoredCount = run.responses.filter(valid).length;
  const presentationCount = run.responses.length;
  for (const id of run.plan.trackIds) if (!run.stopReasons[id]) {
    const reason = stopReason(run, id);
    if (reason) run.stopReasons[id] = reason;
  }
  if (presentationCount >= run.plan.maximumPresentations || scoredCount >= run.plan.maximumValid || run.plan.trackIds.every(id => run.stopReasons[id])) {
    const evidenceComplete = run.plan.trackIds.every(id => progressTrackEvidence(run, id).length >= run.plan.minimumPerTrack && run.stopReasons[id] !== "content_unavailable");
    return finishProgressTest(run, evidenceComplete ? "completed" : "partial", presentationCount >= run.plan.maximumPresentations ? "presentation_cap" : scoredCount >= run.plan.maximumValid ? "item_cap" : "tracks_finished");
  }
  const remaining = run.plan.trackIds.filter(id => !run.stopReasons[id]).sort((a, b) => {
    const aCount = progressTrackEvidence(run, a).length, bCount = progressTrackEvidence(run, b).length;
    return Number(bCount < run.plan.minimumPerTrack) - Number(aCount < run.plan.minimumPerTrack) || aCount - bCount || hash(`${run.seed}:${a}`) - hash(`${run.seed}:${b}`);
  });
  for (const id of remaining) {
    const tier = run.tracks[id].nextTier;
    const candidates = run.pool.filter(item => item.trackId === id && item.difficultyTier === tier && !run.excludedFamilies.includes(family(item)) && !allSourcePaths(item).some(path => run.failedSources.includes(path))).sort((a, b) => hash(`${run.seed}:${a.id}`) - hash(`${run.seed}:${b.id}`));
    const item = candidates[0];
    if (!item) { run.tracks[id].unavailable = true; run.stopReasons[id] = "content_unavailable"; continue; }
    const prepared = clone(item);
    prepared.choices.sort((a, b) => hash(`${run.seed}:${item.id}:${a.id}`) - hash(`${run.seed}:${item.id}:${b.id}`));
    if (prepared.audio?.choices) prepared.audio.choices.sort((a, b) => prepared.choices.findIndex(choice => choice.id === a.choiceId) - prepared.choices.findIndex(choice => choice.id === b.choiceId));
    run.currentItem = prepared;
    run.currentAudioDelivery = {};
    run.currentMediaError = "";
    run.currentSupportUsed = false;
    run.currentItemForegroundMs = 0;
    run.status = "running";
    run.routeDecisions.push({ itemId: item.id, trackId: id, requestedTier: tier, selectedTier: tier, reason: "coverage_then_track_difficulty", ordinal: run.responses.length });
    return run;
  }
  return finishProgressTest(run, "partial", "content_unavailable");
}
export function commitProgressResponse(original, { itemId, selected = null, responseStatus = "answered", mediaReady = true, supportUsed = false, audioDelivery = {}, responseTimeMs = null, failedSource = "", at = new Date().toISOString() }) {
  const item = original.currentItem;
  if (!item || item.id !== itemId || original.pause || original.status !== "running") return original;
  if (responseStatus === "answered" && selected === null) return original;
  if (selected !== null && !item.choices.some(choice => choice.id === selected)) return original;
  const run = clone(original);
  const requiredRoles = Object.entries(item.audio || {}).flatMap(([role, cue]) => Array.isArray(cue) ? cue.flatMap((entry, index) => entry?.required ? [`${role}:${index}`] : []) : cue?.required ? [role] : []);
  const audioReady = requiredRoles.every(role => audioDelivery[role] === "completed");
  const status = responseStatus === "media_failed" || (responseStatus === "answered" && (!mediaReady || !audioReady)) ? "media_failed" : supportUsed && responseStatus === "answered" ? "supported" : responseStatus === "answered" ? (selected === item.answer ? "correct" : "incorrect") : responseStatus;
  if (!["correct", "incorrect", "supported", "skipped", "no_response", "media_failed"].includes(status)) return original;
  const isCorrect = valid({ responseStatus: status }) ? selected === item.answer : null;
  const before = run.tracks[item.trackId].nextTier;
  if (typeof isCorrect === "boolean") run.tracks[item.trackId].nextTier = Math.max(run.tracks[item.trackId].minimumTier, Math.min(run.tracks[item.trackId].maximumTier, item.difficultyTier + (isCorrect ? 1 : -1)));
  const row = { responseId: `${run.attemptId}:${run.responses.length}`, questionId: item.id, trackId: item.trackId, skillId: "", stimulusFamilyId: family(item), difficultyTier: item.difficultyTier, construct: item.construct, modality: item.modality, responseStatus: status, selected, isCorrect, firstResponse: selected, supported: supportUsed, mediaReady: status !== "media_failed", audioDelivery: clone(audioDelivery), responseTimeMs, timestamp: at, itemSnapshot: clone(item), routeBefore: before, routeAfter: run.tracks[item.trackId].nextTier, exposure: item.exposure || {} };
  run.responses.push(row);
  run.excludedFamilies.push(family(item));
  if (failedSource && !run.failedSources.includes(failedSource)) run.failedSources.push(failedSource);
  run.receipt = { item: clone(item), responseId: row.responseId };
  run.currentItem = null;
  return run;
}
export function finishProgressTest(original, status = "partial", reason = "stopped_by_user", at = new Date().toISOString()) {
  if (["completed", "partial"].includes(original.status)) return original;
  const run = clone(original);
  if (run.currentItem) {
    const item = run.currentItem;
    run.responses.push({ responseId: `${run.attemptId}:${run.responses.length}`, questionId: item.id, trackId: item.trackId, stimulusFamilyId: family(item), difficultyTier: item.difficultyTier, responseStatus: "no_response", selected: null, isCorrect: null, itemSnapshot: item, timestamp: at });
  }
  return { ...run, currentItem: null, receipt: null, status, completedAt: at, stopReason: reason, pause: false };
}
export function progressTestResult(run) {
  return {
    reportingMode: "descriptive", calibrated: false, planKind: run.plan.id, stopReason: run.stopReason || "",
    strands: run.plan.trackIds.map(id => {
      const rows = run.responses.filter(row => row.trackId === id), independent = rows.filter(valid);
      return { trackId: id, label: PROGRESS_TEST_TRACKS.find(track => track.id === id)?.label || id, independentCount: independent.length, correctCount: independent.filter(row => row.isCorrect).length, incorrectCount: independent.filter(row => !row.isCorrect).length, unscoredCount: rows.length - independent.length, responseStates: Object.fromEntries(["supported", "skipped", "no_response", "media_failed"].map(status => [status, rows.filter(row => row.responseStatus === status).length])), tiers: [...new Set(independent.map(row => row.difficultyTier))].sort().map(tier => ({ tier, correct: independent.filter(row => row.difficultyTier === tier && row.isCorrect).length, incorrect: independent.filter(row => row.difficultyTier === tier && !row.isCorrect).length })), stopReason: run.stopReasons[id] || run.stopReason || "unfinished", evidenceComplete: independent.length >= run.plan.minimumPerTrack, suggestion: PROGRESS_TEST_TRACKS.find(track => track.id === id)?.suggestion };
    })
  };
}
export function progressAttemptFromRun(run) {
  const result = progressTestResult(run);
  const scored = run.responses.filter(valid);
  return { attemptId: run.attemptId, studentId: run.studentId, studentName: run.studentName, classId: run.classId, teacherId: run.teacherId, assessmentType: PROGRESS_TEST_TYPE, skillId: "progress_check", skillName: "Progress check", skillLevel: 0, skillPhase: 0, assessmentVersion: "progress-check-v1", contentVersion: run.contentVersion, policyVersion: run.policyVersion, schemaVersion: 4, administrationStatus: run.status === "completed" ? "completed" : ["partial"].includes(run.status) ? "partial" : "in_progress", status: run.status, startedAt: run.startedAt, completedAt: run.completedAt, passed: false, accuracy: null, totalQuestions: scored.length, scoredCount: scored.length, correctCount: scored.filter(row => row.isCorrect).length, plannedQuestionCount: run.plan.maximumValid, administeredCount: run.responses.length, questionRecords: run.responses, metadata: { instrumentId: PROGRESS_TEST_INSTRUMENT, reportingMode: "descriptive", assignmentId: run.assignmentId, planKind: run.plan.id, blueprintVersion: "progress-tracks-v1", difficultyVersion: run.difficultyVersion, calibrationVersion: null, seed: run.seed, planSnapshot: run.plan, policySnapshot: { ...run.policySnapshot, progressDoesNotAffectPlacement: true }, startingPoints: run.startingPoints, exposureSnapshot: run.exposureSnapshot, warmupRecords: run.warmupRecords, pauseEvents: run.pauseEvents, foregroundMs: run.foregroundMs, routeDecisions: run.routeDecisions, stopReasons: run.stopReasons, result }, metrics: { progressProfile: result }, masteredItems: [], developingItems: [], needsSupportItems: [], completion: { planComplete: run.status === "completed", evidenceComplete: result.strands.every(row => row.evidenceComplete) } };
}
