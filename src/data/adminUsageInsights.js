import { REPORTING_BIBLE_POLICY } from "../policy/reportingBible.js";
import { learningEvidenceResponseKind } from "../utils/learningEvidenceInsights.js";
import { usageProgressObservations } from "./usageProgressObservations.js";

export const USAGE_INSIGHTS_SCHEMA_VERSION = 1;
export const USAGE_REVIEW_RULES = Object.freeze({ minimumResponses: REPORTING_BIBLE_POLICY.evidenceSufficiency.judgementMinimumScoredItems, minimumLearners: 3, lowerAccuracy: 0.4, higherAccuracy: 0.95 });
export const USAGE_FEATURE_MANIFEST = Object.freeze([
  { id: "home", label: "Home" }, { id: "sounds", label: "Sounds" }, { id: "words", label: "Words" },
  { id: "books", label: "Books" }, { id: "games", label: "Games" },
  { id: "hollow", label: "Hollow" }, { id: "skills_practice", label: "Skills trail" },
  { id: "skills_assessment", label: "Skills assessment" }, { id: "cycle_practice", label: "Cycle Practice" },
  { id: "adventure_map", label: "Adventure Map" }, { id: "sound_seekers", label: "Sound Seekers" },
  { id: "guided_reading", label: "Guided Reading" }, { id: "story_quests", label: "Story Quests" }
]);
const text = value => typeof value === "string" ? value : "";
const list = value => Array.isArray(value) ? value : [];
const nonnegative = value => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
const alias = value => ({ student_home: "home", phonics_letters: "sounds", cvc: "words", phonics_quest: "sound_seekers", el_quest: "adventure_map", studentHome: "home", studentSounds: "sounds", studentBooks: "books", studentLearnGames: "games", studentHollow: "hollow", skillsPractice: "skills_practice", assessment: "skills_assessment", cyclePractice: "cycle_practice", elQuest: "adventure_map", phonicsQuest: "sound_seekers", guidedReading: "guided_reading", storyQuests: "story_quests", learn_games: "games" }[value] || value);

export function usageInsightsErrorText(error) {
  const message = text(error?.message);
  const reportFunction = /admin_(?:create|read|release)_usage_snapshot|admin_purge_usage_snapshots/i.test(message);
  const missingFunction = ['PGRST202', '42883'].includes(error?.code)
    || /could not find (?:the )?function|function[^\n]*(?:does not exist|not found)/i.test(message);
  return reportFunction && missingFunction
    ? 'The usage-report database update has not been installed in this environment. No report has been generated.'
    : message || 'Report generation failed. No partial report is available.';
}

export function usageDateRange(from, through) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from || "") || !/^\d{4}-\d{2}-\d{2}$/.test(through || "")) throw new Error("Choose both dates.");
  // Calendar days in the operator's browser zone; explicit ISO UTC boundaries
  // and the IANA zone are saved in the download for reproducibility.
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${through}T00:00:00`);
  end.setDate(end.getDate() + 1);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) throw new Error("The last day must be on or after the first day.");
  return { from: start.toISOString(), to: end.toISOString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, calendarFrom: from, calendarThrough: through };
}

async function call(client, name, args) {
  if (!client?.call) throw new Error("An authenticated admin connection is required.");
  const result = await client.call(name, args);
  if (result?.error || result?.data?.ok === false || !result?.data) {
    const error = new Error(result?.error?.message || result?.data?.error || `${name} did not return a valid result.`);
    error.code = result?.error?.code || null;
    throw error;
  }
  return result.data;
}

export async function loadAdminUsageSnapshot({ client, from, to, schoolId = null, onProgress = () => {}, signal }) {
  let metadata;
  try {
    metadata = await call(client, "admin_create_usage_snapshot", { p_from: from, p_to: to, p_school_id: schoolId || null });
    if (!metadata.snapshotId || !Number.isSafeInteger(metadata.rowCount) || metadata.rowCount < 0 || !Array.isArray(metadata.sources)) throw new Error("Invalid usage snapshot metadata.");
    const evidence = [];
    let cursor = 0;
    while (true) {
      if (signal?.aborted) throw new Error("Report generation canceled.");
      const page = await call(client, "admin_read_usage_snapshot", { p_snapshot_id: metadata.snapshotId, p_after: cursor, p_limit: 500 });
      if (page.snapshotId !== metadata.snapshotId || page.rowCount !== metadata.rowCount || !Array.isArray(page.rows)) throw new Error("Snapshot changed or returned an incomplete page. Generate again.");
      for (const row of page.rows) {
        if (row.rowNumber !== cursor + 1 || !row.evidence?.source || !row.evidence?.learnerRef) throw new Error("Usage evidence has a gap or duplicate; no partial report is available.");
        evidence.push(row.evidence);
        cursor = row.rowNumber;
      }
      onProgress({ loaded: evidence.length, total: metadata.rowCount });
      if (page.complete) {
        if (evidence.length !== metadata.rowCount || page.nextAfter !== cursor) throw new Error("Incomplete usage report. No partial totals are being shown.");
        break;
      }
      if (!page.rows.length || page.nextAfter !== cursor) throw new Error("Usage paging made no progress. No partial report is available.");
    }
    const counts = evidence.reduce((totals, row) => ({ ...totals, [row.source]: (totals[row.source] || 0) + 1 }), {});
    for (const source of metadata.sources) if (source.available && (counts[source.source] || 0) !== source.rows) throw new Error(`Incomplete source ${source.source}. Generate again.`);
    return { metadata, evidence };
  } catch (error) {
    if (metadata?.snapshotId) await releaseAdminUsageSnapshot(client, metadata.snapshotId).catch(() => {});
    throw error;
  }
}
export function releaseAdminUsageSnapshot(client, snapshotId, downloadRequested = false) {
  return call(client, "admin_release_usage_snapshot", { p_snapshot_id: snapshotId, p_download_requested: downloadRequested });
}
export function purgeAdminUsageSnapshots(client) { return call(client, "admin_purge_usage_snapshots", {}); }

function questionRecords(data) {
  return list(data.payload?.questionRecords || data.payload?.question_records || data.raw_evidence?.result?.questionRecords || data.payload?.questions);
}
function responseKind(record, source, administrationStatus) {
  if (record.validity === "invalid" || record.valid === false || record.mediaFailure === true || record.mediaReady === false) return record.mediaFailure || record.mediaReady === false ? "mediaFailed" : "unscored";
  if (record.supportUsed === true || record.evidenceType === "supported" || record.attemptCount > 1) return "supported";
  const value = typeof record.firstResponseCorrect === "boolean" ? record.firstResponseCorrect : record.isCorrect ?? record.is_correct;
  // Skills trail's immutable record uses "answered" plus the first-response
  // Boolean. Pending optional narration is an observed delivery state, not a
  // failed image or a missing answer; explicit no_response still stays unscored.
  const responseStatus = record.responseStatus === "answered" && typeof value === "boolean" ? value ? "correct" : "incorrect" : record.responseStatus;
  return learningEvidenceResponseKind({ ...record, responseStatus, isCorrect: value, evidence: record.evidence || record.metadata?.evidence || {} }, source, administrationStatus);
}
function classifyResponse(row, record, area, source = "assessment") {
  const data = row.data || {};
  const id = text(record.questionId || record.question_id || record.id || record.itemId || data.item_id);
  if (!id) return null;
  const at = text(record.timestamp || record.recordedAt || record.at || row.observedAt);
  return {
    id, area: alias(area), learnerRef: row.learnerRef, at,
    receipt: text(record.answerEventId || record.answer_event_id || record.client_event_id || record.responseId),
    skillId: text(record.skillId || record.skill_id || data.skill_id),
    phase: record.phase ?? record.itemPhase ?? data.skill_phase ?? null,
    level: record.level ?? record.itemLevel ?? data.skill_level ?? null,
    contentVersion: record.contentVersion || data.content_version || data.payload?.contentVersion || null,
    format: text(record.templateType || record.formatType || record.responseFormat || record.mechanicId),
    prompt: text(record.question || record.prompt), target: text(record.targetWord || record.itemKey),
    kind: responseKind(record, source, data.administration_status),
    responseTimeMs: nonnegative(record.responseTimeMs ?? record.evidence?.responseTimeMs),
    repeatPressCount: nonnegative(record.repeatPressCount) ?? 0,
    ignoredPressCount: nonnegative(record.ignoredPressCount) ?? 0,
    collectionVersion: record.collectionVersion ?? null,
    responseTimeBoundary: record.responseTimeBoundary || record.timingBoundary || null,
    instructionDelivery: record.instructionDelivery || null,
    targetDelivery: record.targetDelivery || null,
    mode: record.mode || data.assessment_type || "not_recorded", source: row.source
  };
}
export function buildAdminUsageReport({ metadata, evidence, itemManifest = [], featureManifest = USAGE_FEATURE_MANIFEST, operatorRange = null, generatedAt = new Date().toISOString() }) {
  const responses = [];
  const seen = new Map();
  const add = value => {
    if (!value) return;
    const key = value.receipt || `${value.learnerRef}:${value.id}:${value.at}`;
    if (seen.has(key)) {
      const prior = seen.get(key);
      if (prior.responseTimeMs === null && value.responseTimeMs !== null) prior.responseTimeMs = value.responseTimeMs;
      if (prior.collectionVersion === null) prior.collectionVersion = value.collectionVersion;
      if (prior.mode === "not_recorded") prior.mode = value.mode;
      for (const field of ["responseTimeBoundary","instructionDelivery","targetDelivery"]) if (prior[field] === null) prior[field] = value[field];
      return;
    }
    seen.set(key,value); responses.push(value);
  };
  // Completed immutable attempts carry the richer validity/support boundary;
  // activity events and answer rows supplement them, never double their score.
  for (const row of evidence) if (["assessment_attempts", "student_focus_cycle_practice_attempts"].includes(row.source)) {
    for (const record of questionRecords(row.data || {})) add(classifyResponse(row, record, row.source === "assessment_attempts" ? "skills_assessment" : "cycle_practice"));
  }
  for (const row of evidence) if (row.source === "learn_activity" && ["answer", "response"].includes(row.data?.event)) add(classifyResponse(row, row.data.payload || {}, row.data.area, "assessment"));
  const legacyAnswerObservations = [];
  const representedItems = new Set(responses.map(response => `${response.learnerRef}:${response.id}`));
  for (const row of evidence) if (row.source === "answers") {
    const data = row.data || {};
    const receipt = text(data.client_event_id || data.answer_event_id);
    const matched = receipt ? seen.get(receipt) : null;
    const questionId = data.question_id || data.metadata?.questionId || matched?.id || "";
    const possibleDuplicate = !receipt && questionId && representedItems.has(`${row.learnerRef}:${questionId}`);
    if (!questionId || possibleDuplicate) {
      legacyAnswerObservations.push({ learnerRef: row.learnerRef, observedAt: row.observedAt, receipt: receipt || null,
        questionId: questionId || null, question: data.question || "", skill: data.skill || data.stage || "",
        reportedCorrect: typeof data.is_correct === "boolean" ? data.is_correct : null,
        reason: possibleDuplicate ? "receipt_missing_possible_duplicate" : "stable_item_id_not_recorded",
        source: "answers", validityAndSupport: "not_recorded" });
      continue;
    }
    add(classifyResponse(row, { ...data, ...(data.metadata || {}), questionId, isCorrect: data.is_correct }, "skills_assessment"));
  }
  const itemMap = new Map();
  const makeItem = (id, area) => ({ id, area, presented: 0, independentResponses: 0, correct: 0, incorrect: 0, supported: 0, mediaFailed: 0, unscored: 0, timingRecorded: 0, repeatPressCount: 0, ignoredPressCount: 0,
    usageEventCount:0, usageEventKinds:{}, eventLearners:new Set(), stateByLearner:new Map(),
    times: [], learners: new Set(), independentLearners: new Set(), observations: new Set(), modes: {}, levels: {}, versions: new Set(), cohorts: new Map() });
  for (const response of responses) {
    const key = `${response.area}:${response.id}`;
    if (!itemMap.has(key)) itemMap.set(key, makeItem(response.id,response.area));
    const item = itemMap.get(key);
    item.presented += 1; item[response.kind] += 1; item.learners.add(response.learnerRef);
    item.eventLearners.add(response.learnerRef);
    if (["correct", "incorrect"].includes(response.kind)) { item.independentResponses += 1; item.independentLearners.add(response.learnerRef); }
    if (response.responseTimeMs !== null) { item.timingRecorded += 1; item.times.push(response.responseTimeMs); }
    item.repeatPressCount += response.repeatPressCount; item.ignoredPressCount += response.ignoredPressCount;
    item.modes[response.mode] = (item.modes[response.mode] || 0) + 1;
    item.levels[`${response.level ?? "unknown"}:${response.phase ?? "unknown"}`] = (item.levels[`${response.level ?? "unknown"}:${response.phase ?? "unknown"}`] || 0) + 1;
    if (response.contentVersion) item.versions.add(response.contentVersion);
    const cohortKey = JSON.stringify([response.mode,response.level,response.phase,response.contentVersion,response.instructionDelivery,response.targetDelivery]);
    if (!item.cohorts.has(cohortKey)) item.cohorts.set(cohortKey,{ mode: response.mode, level: response.level, phase: response.phase,
      contentVersion: response.contentVersion, instructionDelivery: response.instructionDelivery, targetDelivery: response.targetDelivery,
      presented: 0, independentResponses: 0, correct: 0, supported: 0, mediaFailed: 0, unscored: 0, learners: new Set(), independentLearners: new Set() });
    const cohort = item.cohorts.get(cohortKey); cohort.presented += 1; cohort.learners.add(response.learnerRef);
    if (["correct","incorrect"].includes(response.kind)) { cohort.independentResponses += 1; cohort.independentLearners.add(response.learnerRef); }
    if (response.kind !== "incorrect") cohort[response.kind] += 1;
    item.skillId ||= response.skillId; item.format ||= response.format; item.prompt ||= response.prompt; item.target ||= response.target;
  }
  const makeFeature = item => ({ ...item, events: 0, visits: 0, activeDurationMs: 0, durationObservations: 0,
    elapsedDurationMs: 0, elapsedDurationObservations: 0, learners: new Set(), stateLearners:new Set(), opportunityLearners: new Set() });
  const features = new Map(featureManifest.map(item => [item.id, makeFeature(item)]));
  const learners = new Set();
  const cohortLearners = new Set();
  let additionalPresses = 0;
  const progressCoverage={sourceRows:0,recognizedRows:0,rowsWithUseEvidence:0,uninterpretedAreas:{}};
  for (const row of evidence) {
    if (row.source === "learner_context") { cohortLearners.add(row.learnerRef); continue; }
    learners.add(row.learnerRef);
    if (row.source === "student_progress") {
      progressCoverage.sourceRows += 1;
      const extracted=usageProgressObservations(row.data);
      if (extracted.recognized) progressCoverage.recognizedRows += 1;
      else progressCoverage.uninterpretedAreas[row.data?.area || "not_recorded"]=(progressCoverage.uninterpretedAreas[row.data?.area || "not_recorded"] || 0)+1;
      if (extracted.observations.length) progressCoverage.rowsWithUseEvidence += 1;
      for (const observation of extracted.observations) {
        const key=`${observation.area}:${observation.id}`;
        if (!itemMap.has(key)) itemMap.set(key,makeItem(observation.id,observation.area));
        const item=itemMap.get(key), previous=item.stateByLearner.get(row.learnerRef) || {};
        item.learners.add(row.learnerRef);
        item.stateByLearner.set(row.learnerRef,Object.fromEntries([...new Set([...Object.keys(previous),...Object.keys(observation.metrics)])]
          .map(field=>[field,Math.max(previous[field] || 0,observation.metrics[field] || 0)])));
        if (!features.has(observation.area)) features.set(observation.area,makeFeature({id:observation.area,label:observation.area}));
        features.get(observation.area).stateLearners.add(row.learnerRef);
      }
      continue;
    }
    if (row.source !== "learn_activity") continue;
    const data = row.data || {}, payload = data.payload || {};
    const area = alias(payload.area || data.area === "app" && data.item_id || data.area);
    if (!features.has(area)) features.set(area, makeFeature({ id: area, label: area }));
    const feature = features.get(area);
    feature.events += 1; feature.learners.add(row.learnerRef);
    const itemId=text(payload.questionId || data.item_id);
    if (itemId && data.area !== "app" && !["items_offered","media_delivery","runtime","reset_progress","area_enter","area_exit","press"].includes(data.event)) {
      const key=`${area}:${itemId}`;
      if (!itemMap.has(key)) itemMap.set(key,makeItem(itemId,area));
      const item=itemMap.get(key); item.usageEventCount+=1; item.eventLearners.add(row.learnerRef); item.learners.add(row.learnerRef);
      item.usageEventKinds[data.event]=(item.usageEventKinds[data.event] || 0)+1;
    }
    if (data.event === "area_enter") feature.visits += 1;
    if (data.event === "area_exit" && nonnegative(payload.activeDurationMs) !== null) { feature.activeDurationMs += payload.activeDurationMs; feature.durationObservations += 1; }
    if (data.event === "area_exit" && nonnegative(payload.elapsedDurationMs) !== null) { feature.elapsedDurationMs += payload.elapsedDurationMs; feature.elapsedDurationObservations += 1; }
    if (payload.collectionVersion >= 2 && Array.isArray(payload.availableAreas)) for (const available of payload.availableAreas) features.get(alias(available))?.opportunityLearners.add(row.learnerRef);
    if (data.event === "press") {
      const key = `${area}:${text(payload.questionId || data.item_id)}`;
      if (!itemMap.has(key)) itemMap.set(key, makeItem(text(payload.questionId || data.item_id),area));
      const item = itemMap.get(key);
      item.repeatPressCount += nonnegative(payload.repeatPressCount) ?? 0;
      item.ignoredPressCount += nonnegative(payload.ignoredPressCount) ?? 0;
      additionalPresses += nonnegative(payload.ignoredPressCount) ?? 0;
    }
    if (data.event === "items_offered" && payload.collectionVersion >= 2) for (const offeredId of list(payload.itemIds)) {
      const key = `${area}:${offeredId}`;
      if (!itemMap.has(key)) itemMap.set(key, makeItem(offeredId,area));
      itemMap.get(key).observations.add(row.learnerRef);
    }
  }
  for (const manifestItem of itemManifest) {
    const key = `${manifestItem.area}:${manifestItem.id}`;
    if (!itemMap.has(key)) itemMap.set(key, makeItem(manifestItem.id,manifestItem.area));
    Object.assign(itemMap.get(key), { catalog: manifestItem });
  }
  const items = [...itemMap.values()].map(item => {
    const { times, learners: itemLearners, observations, versions, independentLearners, cohorts: cohortMap, stateByLearner, eventLearners, ...rest } = item;
    times.sort((a,b) => a-b);
    const accuracy = item.independentResponses ? item.correct / item.independentResponses : null;
    const cohorts = [...cohortMap.values()].map(({learners: cohortLearners,independentLearners: independentCohort,...cohort}) => {
      const accuracy = cohort.independentResponses ? cohort.correct/cohort.independentResponses : null;
      const comparable = cohort.independentResponses >= USAGE_REVIEW_RULES.minimumResponses && independentCohort.size >= USAGE_REVIEW_RULES.minimumLearners;
      return {...cohort,uniqueLearners:cohortLearners.size,uniqueIndependentLearners:independentCohort.size,independentAccuracy:accuracy,
        reviewSignal: comparable && accuracy <= USAGE_REVIEW_RULES.lowerAccuracy ? "review_lower_accuracy"
          : comparable && accuracy >= USAGE_REVIEW_RULES.higherAccuracy ? "review_higher_accuracy" : "insufficient_or_middle_range"};
    });
    const lower = cohorts.some(cohort => cohort.reviewSignal === "review_lower_accuracy");
    const higher = cohorts.some(cohort => cohort.reviewSignal === "review_higher_accuracy");
    const reviewSignal = lower && higher ? "mixed_cohort_review" : lower ? "review_lower_accuracy" : higher ? "review_higher_accuracy" : "insufficient_or_middle_range";
    const storedCumulativeCounters={};
    for (const metrics of stateByLearner.values()) for (const [field,value] of Object.entries(metrics)) storedCumulativeCounters[field]=(storedCumulativeCounters[field] || 0)+value;
    return { ...rest, cohorts, uniqueLearners: itemLearners.size, datedEvidenceLearners:eventLearners.size, storedStateLearners:stateByLearner.size,
      storedCumulativeCounters, stateCounterSemantics:"Latest captured state; counters may include use before the selected interval, never added to dated events or answer scores.",
      uniqueIndependentLearners: independentLearners.size, explicitOfferLearners: observations.size, contentVersions: [...versions], independentAccuracy: accuracy,
      medianResponseTimeMs: times.length ? times[Math.floor(times.length/2)] : null,
      usageStatus: item.presented || item.usageEventCount || stateByLearner.size ? "observed_use" : observations.size ? "no_observed_use_when_offered" : "not_observed",
      reviewSignal,
      nextAction: item.mediaFailed ? "Check required media before interpreting learning outcomes." : lower ? "Review wording, target/choice contrast, instruction and item alignment; compare independent cohorts and formats." : higher ? "Review challenge and distractors in the intended level; confirm transfer using fresh items." : "Collect more independent evidence or inspect the raw observations." };
  });
  const featureRows = [...features.values()].map(({ learners: used, stateLearners, opportunityLearners: offered, ...rest }) => ({ ...rest,
    uniqueLearners:new Set([...used,...stateLearners]).size, datedEvidenceLearners:used.size, storedStateLearners:stateLearners.size, availableToObservedLearners: offered.size,
    usageStatus: rest.events || stateLearners.size ? "observed_use" : offered.size ? "no_observed_use_when_available" : "not_observed",
    useRateWhenAvailable: offered.size ? [...used].filter(id => offered.has(id)).length / offered.size : null })).sort((a,b) => b.uniqueLearners-a.uniqueLearners || b.events-a.events);
  const scored = responses.filter(r => ["correct","incorrect"].includes(r.kind));
  return { schemaVersion: USAGE_INSIGHTS_SCHEMA_VERSION, generatedAt, metadata: { ...metadata, operatorRange, complete: true },
    interpretation: { purpose: "Admin product improvement review, not learner placement or diagnosis.",
      reviewRules: USAGE_REVIEW_RULES, reviewRulesMeaning: "Exploratory item review thresholds only; not proficiency, progression or a claim that an item is intrinsically hard/easy.",
      limits: ["Timing starts at the recorded readiness boundary when instrumented: formal assessment images/last audio delivery; Cycle Practice instruction audio plus pictures; Skills trail required recorded audio and pictures with actual delivery states retained. Missing timing remains null.", "Repeated and ignored presses are observations only. They do not establish guessing, cheating or inattention.", "Self-chosen practice and teacher assessment remain separate in item modes; supported, media-failed and invalid responses never enter independent accuracy.", "Historic data cannot reveal taps or opportunities that were not collected. No-use labels require an explicit availability/offer denominator.", "Area-exit elapsed time includes inactivity and is not active learning time; missing exits are incomplete duration evidence. Progress, mastery, sync health and focus/reading presence are latest stored records, not a complete event history or duration measure.", "Deleted/archived legacy orphan records, anonymous previews and pending device queues are outside current linked cloud evidence.", "Export-specific pseudonyms reduce direct identification; the downloaded file is still sensitive. Delete it from devices/transfer locations when its review is done."] },
    summary: { currentCohortLearners: list(metadata.sources).some(source=>source.source==="learner_context" && source.available) ? cohortLearners.size : null,
      observedLearners: learners.size, rawRows: evidence.length, independentResponses: scored.length, independentCorrect: scored.filter(r => r.kind === "correct").length,
      supported: responses.filter(r => r.kind === "supported").length, mediaFailed: responses.filter(r => r.kind === "mediaFailed").length, unscored: responses.filter(r => r.kind === "unscored").length,
      responsesWithTiming: responses.filter(r => r.responseTimeMs !== null).length, responsesWithoutTiming: responses.filter(r => r.responseTimeMs === null).length,
      ignoredPresses: responses.reduce((n,r) => n+r.ignoredPressCount,0)+additionalPresses,
      answerRowsWithoutStableItemId: evidence.filter(row => row.source === "answers" && !row.data?.question_id && !row.data?.metadata?.questionId).length,
      legacyAnswerRowsExcludedFromItemAccuracy: legacyAnswerObservations.length },
    features: featureRows, items, popularity:items.filter(item=>item.usageStatus==="observed_use").sort((a,b)=>b.uniqueLearners-a.uniqueLearners || b.usageEventCount-a.usageEventCount), progressCoverage,
    manifests: { features: featureManifest, items: itemManifest, capturedAt: generatedAt, note: "Current runtime catalog; compare original stored content versions before changing history." },
    responses, legacyAnswerObservations, evidence };
}
