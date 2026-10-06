import { CHECKING_INSTRUMENTS, LEARNING_RESPONSE_POLICY_VERSION, LEARNING_RESPONSE_SCHEMA_VERSION, learningResponseUse } from "../policy/learningResponsePolicy.js";

const copy = value => JSON.parse(JSON.stringify(value));
const snapshotSignature = value => Array.isArray(value) ? `[${value.map(snapshotSignature).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${snapshotSignature(value[key])}`).join(",")}}` : JSON.stringify(value);
const options = question => question.answerOptions || question.choices || question.imageCards || question.cells || question.objects || question.letterTiles || [];
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).sort().join(",")}]`
  : value && typeof value === "object" ? `{${Object.keys(value).filter(key => !["id", "audio", "audioPath"].includes(key)).sort().map(key => `${key}:${canonical(value[key])}`).join(",")}}` : JSON.stringify(value);
export function learningStimulusSignature(question = {}) {
  const semantic = { oralStimulus: question.oralStimulus, phonemeSequence: question.phonemeSequence, passage: question.passage || question.story, word: question.targetWord || question.word || question.audioText,
    model: question.modelForm || question.model, sentence: question.sentence || question.sentenceText || question.sentenceWithBlank || question.contextText,
    graphemes: question.graphemes, targetGrapheme: question.mechanicId === "soundSort" && (question.targetWord || question.word) ? undefined : question.targetGrapheme, targetLetters: question.targetLetters, display: question.display,
    sceneDescription: question.sceneDescription || question.imageDescription, parts: question.parts?.map(part => part.word || part.label || part) };
  const hasContent = Object.values(semantic).some(value => value !== undefined && value !== "" && value !== null);
  // A changed filename, option order or record ID is not a fresh named stimulus.
  return canonical({ ...semantic, ...(!hasContent ? { image: question.imagePath || question.image || question.targetImage,
    objects: question.objects?.map(item => ({ word: item.word, letter: item.letter, matches: item.matches })), cells: question.cells?.map(item => ({ letter: item.letter, matches: item.matches })) } : {}) });
}
export function learningChoiceSignature(question = {}) { return canonical(options(question)); }
export function selectFreshLearningTransfer(question, candidates = [], { excludedIds = [] } = {}) {
  const excluded = new Set([question.id, question.roundKey, ...excludedIds]);
  const construct = question.construct || question.constructClaim || question.formatType || question.mechanicId;
  const format = question.formatType || question.mechanicId || question.templateType;
  const target = question.unit || question.itemKey || question.targetGrapheme;
  const eligible = candidates.filter(candidate => candidate && !candidate.retentionOnly && !excluded.has(candidate.id || candidate.roundKey)
    && (!candidate.skillId || !question.skillId || candidate.skillId === question.skillId)
    && (candidate.construct || candidate.constructClaim || candidate.formatType || candidate.mechanicId) === construct
    && (candidate.formatType || candidate.mechanicId || candidate.templateType) === format
    && Number(candidate.level || 1) <= Number(question.level || 1)
    && learningStimulusSignature(candidate) !== learningStimulusSignature(question)
    && learningChoiceSignature(candidate) !== learningChoiceSignature(question));
  return eligible.sort((a, b) => Number((b.unit || b.itemKey || b.targetGrapheme) === target) - Number((a.unit || a.itemKey || a.targetGrapheme) === target))[0] || null;
}

export function createLearningResponseEpisode({ id, instrument, slotId, question, expected, transfer = null } = {}) {
  if (!id || !instrument || !question) throw new Error("A learning episode requires its owner and exact task.");
  return copy({ schemaVersion: LEARNING_RESPONSE_SCHEMA_VERSION, policyVersion: LEARNING_RESPONSE_POLICY_VERSION,
    id, instrument, slotId, phase: "answer", role: "first_probe", question, expected,
    firstQuestion: question, firstExpected: expected, transfer, firstResponse: null, responses: [], events: [], guidedActions: [], guidedCursor: null, completion: null });
}
function append(state, type, payload = {}) {
  return { ...state, events: [...state.events, { id: `${state.id}:event:${state.events.length}`, type, occurredAt: new Date().toISOString(), ...copy(payload) }] };
}
export function startLearningWithModel(state, reason = "previous_transfer_unresolved") {
  if (!state || state.phase !== "answer" || state.firstResponse) return state;
  return append({ ...state, phase: "teaching", guidedCursor: 0, modelFirst: true }, "model_first_started", { reason, evidenceUse: "supported_practice" });
}
export function commitLearningResponse(state, { selected = null, correct = null, responseStatus = "answered", valid = true, supported = false, supportUsed = [], responseTimeMs = null, media = {}, occurredAt = new Date().toISOString() } = {}) {
  if (!state || state.phase !== "answer") return state;
  const evidenceUse = learningResponseUse({ role: state.role, responseStatus, valid, supported });
  const response = copy({ id: `${state.id}:${state.role}`, episodeId: state.id, presentationRole: state.role, instrument: state.instrument,
    question: state.question, expected: state.expected, selected, observedCorrect: typeof correct === "boolean" ? correct : null,
    responseStatus, validity: valid ? "valid" : "invalid", evidenceUse, supportUsed,
    isCorrect: evidenceUse === "independent_practice_response" ? correct : null,
    responseTimeMs: Number.isFinite(responseTimeMs) ? Math.max(0, Math.round(responseTimeMs)) : null, media, occurredAt });
  const checking = CHECKING_INSTRUMENTS.has(state.instrument);
  const needsTeaching = responseStatus === "no_response" || responseStatus === "supported" || (supported && correct !== true) || (responseStatus === "answered" && correct === false);
  const pendingPhase = checking || !needsTeaching || ["skipped", "abandoned", "media_failed"].includes(responseStatus) ? "complete"
    : state.role === "transfer" ? "finish_teaching" : "teaching";
  return append({ ...state, phase: "receipt", pendingPhase, firstResponse: state.firstResponse || (state.role === "first_probe" ? response : null),
    responses: [...state.responses, response], completion: pendingPhase === "complete" ? {
      supported: state.role === "transfer" || supported || !valid, completed: responseStatus === "answered" && correct === true,
      unresolved: !(responseStatus === "answered" && correct === true), rewardId: `${state.id}:completion` } : null }, "response", { response });
}
export function advanceLearningResponseReceipt(state) {
  if (!state || state.phase !== "receipt") return state;
  let cursor = 0;
  if (state.question.mechanicId === "wordBuild" && Array.isArray(state.expected) && Array.isArray(state.responses.at(-1)?.selected)) {
    const selected = state.responses.at(-1).selected;
    const difference = state.expected.findIndex((value, index) => String(value) !== String(selected[index]));
    cursor = Math.max(0, difference);
  }
  return append({ ...state, phase: state.pendingPhase, guidedCursor: cursor }, state.pendingPhase === "complete" ? "closed" : "teaching_presented");
}
export function attachLearningTransfer(state, question, expected) {
  if (!state || state.transfer || !question) return state;
  return append({ ...state, transfer: copy({ question, expected }) }, "transfer_prepared", { questionId: question.id || question.roundKey });
}
/** Failed media can replace an unanswered transfer, never its frozen source or a response. */
export function replaceLearningTransferMedia(state, question, expected, failedSource = "") {
  if (!state || state.role !== "transfer" || state.phase !== "answer" || !state.transfer
    || state.responses.some(response => response.presentationRole === "transfer") || !validTransferReplacements(state)) return state;
  const used = [state.transfer.question, state.question, ...(state.transferReplacements || []).map(item => item.question)].map(item => item.id || item.roundKey);
  if (!selectFreshLearningTransfer(state.firstQuestion, [question], { excludedIds: used })) return state;
  const replacement = copy({ eventId: `${state.id}:event:${state.events.length}`, reason: "media_failed", failedSource,
    fromQuestion: state.question, fromExpected: state.expected, question, expected });
  return append({ ...state, question: copy(question), expected: copy(expected),
    transferReplacements: [...(state.transferReplacements || []), replacement] }, "transfer_media_replaced", { replacement });
}
export function recordLearningGuidedStep(state, index) {
  if (!state || !["teaching", "finish_teaching"].includes(state.phase) || index !== Number(state.guidedCursor || 0)) return state;
  const values = Array.isArray(state.expected) ? state.expected : [state.expected];
  if (index < 0 || index >= values.length) return state;
  return append({ ...state, guidedCursor: index + 1 }, "guided_part", { index, selected: values[index], evidenceUse: "supported_practice" });
}
export function recordLearningGuidedAction(state, selected, occurredAt = new Date().toISOString()) {
  if (!state || !["teaching", "finish_teaching"].includes(state.phase) || JSON.stringify(selected) !== JSON.stringify(state.expected)) return state;
  const action = copy({ id: `${state.id}:guided:${state.guidedActions.length}`, selected, expected: state.expected,
    question: state.question, evidenceUse: "supported_practice", occurredAt });
  const transferReady = state.phase === "teaching" && state.transfer;
  const next = { ...state, guidedActions: [...state.guidedActions, action],
    guidedCursor: null, phase: transferReady ? "answer" : "complete", role: transferReady ? "transfer" : state.role,
    ...(transferReady ? { question: state.transfer.question, expected: state.transfer.expected } : {
      completion: { completed: true, supported: true, unresolved: true, transferUnavailable: !state.transfer, rewardId: `${state.id}:completion` } }) };
  return append(next, "guided_action", { action });
}
export function learningResponseRecoveryIssue(value) {
  if (!value) return "";
  if (Number(value.schemaVersion) > LEARNING_RESPONSE_SCHEMA_VERSION) return "unsupported_version";
  if (value.schemaVersion !== LEARNING_RESPONSE_SCHEMA_VERSION || value.policyVersion !== LEARNING_RESPONSE_POLICY_VERSION
    || !value.id || !value.firstQuestion || !value.question || !["answer", "receipt", "teaching", "finish_teaching", "complete"].includes(value.phase)
    || !["first_probe", "transfer"].includes(value.role) || !Array.isArray(value.responses) || !Array.isArray(value.events) || !Array.isArray(value.guidedActions)) return "unsupported_version";
  if (!validTransferReplacements(value)) return "invalid_transfer_recovery";
  return "";
}
export function learningEpisodeIsCurrent(value, id) {
  return value?.schemaVersion === LEARNING_RESPONSE_SCHEMA_VERSION && value.id === id && value.firstQuestion && Array.isArray(value.responses) && Array.isArray(value.events);
}
export function learningResponseCompletionEvent(state, completedAt = state.events.at(-1)?.occurredAt || new Date().toISOString()) {
  return { id: `${state.id}:learning-response:${state.events.length}`, contentVersion: state.policyVersion, completedAt, practiceOnly: true,
    formalAssessment: false, masteryClaim: false, independent: false, sessionId: state.id,
    steps: state.responses.length ? state.responses.map(response => ({ questionId: response.question.id || response.question.roundKey, ...response }))
      : state.guidedActions.map(action => ({ ...action, questionId: action.question.id || action.question.roundKey, presentationRole: "guided", responseStatus: "supported", isCorrect: null })),
    learningEpisode: copy(state) };
}

const episodePhaseOrder = episode => episode.phase === "complete" ? 7 : episode.phase === "finish_teaching" ? 6
  : episode.role === "transfer" ? ({ answer: 4, receipt: 5, teaching: 5 }[episode.phase] ?? -1)
    : ({ answer: 0, receipt: 1, teaching: 2 }[episode.phase] ?? -1);
const sameSnapshot = (left, right) => snapshotSignature(left ?? null) === snapshotSignature(right ?? null);
const snapshotPrefix = (prefix, values) => prefix.length <= values.length && prefix.every((value, index) => sameSnapshot(value, values[index]));

function validTransferReplacements(episode) {
  const history = episode.transferReplacements;
  const events = episode.events.filter(event => event.type === "transfer_media_replaced");
  if (history === undefined) return events.length === 0;
  if (!Array.isArray(history) || history.length !== events.length) return false;
  if (!history.length) return true;
  if (episode.role !== "transfer" || !episode.transfer?.question) return false;
  let current = episode.transfer;
  const used = [current.question.id || current.question.roundKey];
  for (const [index, replacement] of history.entries()) {
    const event = events[index], eventIndex = episode.events.indexOf(event);
    if (replacement.reason !== "media_failed" || event.id !== `${episode.id}:event:${eventIndex}` || event.id !== replacement.eventId || !sameSnapshot(event.replacement, replacement)
      || !sameSnapshot(replacement.fromQuestion, current.question) || !sameSnapshot(replacement.fromExpected, current.expected)
      || episode.events.slice(0, eventIndex).some(value => value.type === "response" && value.response?.presentationRole === "transfer")
      || !selectFreshLearningTransfer(episode.firstQuestion, [replacement.question], { excludedIds: used })) return false;
    current = replacement;
    used.push(current.question.id || current.question.roundKey);
  }
  return sameSnapshot(episode.question, current.question) && sameSnapshot(episode.expected, current.expected)
    && episode.responses.filter(response => response.presentationRole === "transfer").every(response => sameSnapshot(response.question, current.question) && sameSnapshot(response.expected, current.expected));
}

/** An episode is append-only; select one whole descendant, never splice a saved answer into reopened input. */
function episodeExtends(candidate, prior) {
  if (["id", "instrument", "slotId", "firstQuestion", "firstExpected"].some(key => !sameSnapshot(candidate[key], prior[key]))) return false;
  if (prior.firstResponse && !sameSnapshot(candidate.firstResponse, prior.firstResponse)) return false;
  if (["responses", "events", "guidedActions"].some(key => !snapshotPrefix(prior[key], candidate[key]))) return false;
  if (!validTransferReplacements(candidate) || !validTransferReplacements(prior)
    || !snapshotPrefix(prior.transferReplacements || [], candidate.transferReplacements || [])) return false;
  if (prior.transfer && !sameSnapshot(candidate.transfer, prior.transfer)) return false;
  if (prior.modelFirst === true && candidate.modelFirst !== true) return false;
  if (prior.completion && !sameSnapshot(candidate.completion, prior.completion)) return false;
  if (prior.role === "transfer" && candidate.role !== "transfer") return false;
  if (episodePhaseOrder(candidate) < episodePhaseOrder(prior)) return false;
  if (candidate.role === prior.role && (!sameSnapshot(candidate.question, prior.question) || !sameSnapshot(candidate.expected, prior.expected))) {
    const recovered = candidate.role === "transfer" && prior.phase === "answer"
      && !prior.responses.some(response => response.presentationRole === "transfer")
      && (candidate.transferReplacements?.length || 0) > (prior.transferReplacements?.length || 0)
      && sameSnapshot(candidate.transferReplacements[prior.transferReplacements?.length || 0].fromQuestion, prior.question)
      && sameSnapshot(candidate.transferReplacements[prior.transferReplacements?.length || 0].fromExpected, prior.expected);
    if (!recovered) return false;
  }
  if (candidate.role === prior.role && candidate.phase === prior.phase && ["teaching", "finish_teaching"].includes(prior.phase)
    && Number(candidate.guidedCursor || 0) < Number(prior.guidedCursor || 0)) return false;
  return true;
}
function compareEpisodes(left, right) {
  if (left.firstResponse && right.firstResponse && !sameSnapshot(left.firstResponse, right.firstResponse)) return "conflict";
  // A missing first answer cannot replace an already committed presentation,
  // even when a stale model-first branch reports a newer timestamp or more events.
  if (Boolean(left.firstResponse) !== Boolean(right.firstResponse)) {
    if (left.firstResponse && !episodeExtends(right, left)) return "left";
    if (right.firstResponse && !episodeExtends(left, right)) return "right";
  }
  const rightExtends = episodeExtends(right, left), leftExtends = episodeExtends(left, right);
  return rightExtends && leftExtends ? "equal" : rightExtends ? "right" : leftExtends ? "left" : "conflict";
}

/** Choose a whole checkpoint; committed episode prefixes outrank wall-clock freshness. */
export function mergeLearningResponseCheckpoints(left, right) {
  if (!left) return right || null;
  if (!right) return left;
  const sameEpisode = Boolean(left.episode?.id) && left.episode.id === right.episode?.id;
  if (sameEpisode && left.episode.firstResponse && right.episode.firstResponse
    && !sameSnapshot(left.episode.firstResponse, right.episode.firstResponse)) return { ...left, responseConflict: true };
  if (sameEpisode) {
    const leftInvalid = learningResponseRecoveryIssue(left.episode) === "invalid_transfer_recovery";
    const rightInvalid = learningResponseRecoveryIssue(right.episode) === "invalid_transfer_recovery";
    if (leftInvalid || rightInvalid) return { ...(leftInvalid && !rightInvalid ? right : left), responseConflict: true };
  }
  const knownEpisodes = sameEpisode && !learningResponseRecoveryIssue(left.episode) && !learningResponseRecoveryIssue(right.episode);
  const comparison = knownEpisodes ? compareEpisodes(left.episode, right.episode) : "equal";
  if (comparison === "conflict") return { ...left, responseConflict: true };
  const leftTime = Date.parse(left.updatedAt || "") || 0;
  const rightTime = Date.parse(right.updatedAt || "") || 0;
  const selected = comparison === "right" ? right : comparison === "left" ? left
    : rightTime > leftTime || (rightTime === leftTime && Number(right.revision || 0) > Number(left.revision || 0)) ? right : left;
  return sameEpisode && (left.responseConflict || right.responseConflict) ? { ...selected, responseConflict: true } : selected;
}


/** Latest whole known episode per owner; contradictory first responses stay quarantined. */
export function learningResponseEpisodes(events = [], conflictIds = []) {
  const blocked = new Set(conflictIds), rejected = new Set(), latest = new Map();
  for (const event of events) {
    const episode = event.learningEpisode;
    if (!episode || learningResponseRecoveryIssue(episode)) continue;
    if (blocked.has(event.id)) { rejected.add(episode.id); continue; }
    const prior = latest.get(episode.id);
    const comparison = prior ? compareEpisodes(prior, episode) : "right";
    if (comparison === "conflict") rejected.add(episode.id);
    if (comparison === "right") latest.set(episode.id, episode);
  }
  return [...latest.values()].filter(episode => !rejected.has(episode.id));
}

export function learningGuidedModelIsPlaced(episode) {
  const count = Array.isArray(episode?.expected) ? episode.expected.length : 1;
  return Boolean(episode && ["teaching", "finish_teaching"].includes(episode.phase) && count > 0 && Number(episode.guidedCursor) >= count);
}
