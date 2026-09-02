import {
  getContentDeckActionBindings,
  getContentDeckOwnerBinding,
  validateBoundContentDecisionSource
} from "../content/contentDeckBindings.js";
import {
  getContentDeckCatalog,
  getContentDeckCatalogRecord
} from "../content/contentDeckCatalogs.js";
import { createContentDeckState } from "./contentDeckState.js";

const NORMALIZED_DECK_CACHE = new WeakMap();
const HEART_USE_CACHE = new WeakMap();

function normalizedDeckState(value) {
  if (!value || typeof value !== "object") return createContentDeckState();
  const cached = NORMALIZED_DECK_CACHE.get(value);
  if (cached) return cached;
  const normalized = createContentDeckState(value);
  NORMALIZED_DECK_CACHE.set(value, normalized);
  NORMALIZED_DECK_CACHE.set(normalized, normalized);
  return normalized;
}

function validVisits(state, category) {
  const claims = new Map();
  for (const visit of Object.values(state[category]?.visits || {})) {
    if (visit.kind !== "visit") continue;
    const claim = `${visit.category}\u0000${visit.contentInstanceId}\u0000${visit.journeyStep}`;
    const list = claims.get(claim) || [];
    list.push(visit);
    claims.set(claim, list);
  }
  return [...claims.values()].filter(list => list.length === 1).flat();
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalJson(value[key])]));
}

function sameValue(left, right) {
  return JSON.stringify(canonicalJson(left)) === JSON.stringify(canonicalJson(right));
}

function stopNumber(stopId) {
  const match = /^s([1-9]|[1-3][0-9]|40)$/u.exec(String(stopId || ""));
  return match ? Number(match[1]) : null;
}

function registeredBindingStopId(binding) {
  const match = /^(s(?:[1-9]|[1-3][0-9]|40))-/u.exec(String(binding?.visitOwnerId || ""));
  return match?.[1] || null;
}

function heartRecordSupportsAllBindings(record, bindings) {
  const required = [...new Set(bindings.map(item => item.requiredActivityType))].sort();
  const eligible = [...record.eligibleActivityTypes].sort();
  const answerKeys = Object.keys(record.answerTokensByActivity).sort();
  return required.every(activity => eligible.includes(activity)
      && typeof record.answerTokensByActivity[activity] === "string"
      && record.answerTokensByActivity[activity].length > 0)
    && eligible.length === answerKeys.length
    && eligible.every((activity, index) => activity === answerKeys[index]);
}

function stableHash(text) {
  let hash = 2166136261;
  for (const character of text) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function canonicalOwnerBinding(binding) {
  if (!binding || binding.isVisitOwner !== true) {
    throw new Error("content deck serve requires the registered visit owner binding");
  }
  const canonical = getContentDeckOwnerBinding(binding.category, binding.slotId);
  if (!canonical || !sameValue(canonical, binding)) {
    throw new Error("content deck binding does not match the registered owner");
  }
  return canonical;
}

function structurallyValidHeartUses(contentDecks) {
  const state = normalizedDeckState(contentDecks);
  const cached = HEART_USE_CACHE.get(state);
  if (cached) return cached;
  const claims = new Map();
  for (const visit of Object.values(state.heartWords.visits)) {
    if (visit.kind !== "visit") continue;
    const claim = `${visit.contentInstanceId}\u0000${visit.journeyStep}`;
    const list = claims.get(claim) || [];
    list.push(visit);
    claims.set(claim, list);
  }
  const visits = new Map([...claims.values()].filter(list => list.length === 1)
    .map(([visit]) => [visit.visitId, visit]));
  const uses = Object.values(state.heartWords.uses).filter(use => {
    if (use.kind !== "use") return false;
    const visit = visits.get(use.visitId);
    if (!visit
      || use.category !== visit.category
      || use.contentInstanceId !== visit.contentInstanceId
      || use.visitOwnerId !== visit.visitOwnerId
      || use.slotId !== visit.slotId
      || use.recordId !== visit.recordId
      || use.journeyStep !== visit.journeyStep) return false;
    if (use.actionUseId === visit.ownerActionUseId) return true;
    return Boolean(state.heartWords.uses[`${visit.visitId}:${visit.ownerActionUseId}`]?.kind === "use");
  });
  HEART_USE_CACHE.set(state, uses);
  return uses;
}

export function rankContentDeckCandidates(records, contentDecks, context = {}) {
  const category = String(context.category || "").trim();
  const slotId = String(context.slotId || "").trim();
  const journeyStep = Number(context.journeyStep);
  const seed = String(context.seed ?? "");
  const requiredActivityTypes = Object.freeze([...new Set(
    Array.isArray(context.requiredActivityTypes) ? context.requiredActivityTypes : []
  )].sort());
  const uses = category === "heartWords" ? structurallyValidHeartUses(contentDecks) : [];
  const stats = new Map();
  for (const use of uses) {
    const key = `${use.recordId}\u0000${use.activityType}`;
    const previous = stats.get(key) || { count: 0, last: Number.NEGATIVE_INFINITY };
    stats.set(key, {
      count: previous.count + 1,
      last: Math.max(previous.last, use.journeyStep)
    });
  }
  const ranked = (Array.isArray(records) ? records : []).map(record => {
    const activity = requiredActivityTypes.map(activityType => ({
      activityType,
      ...(stats.get(`${record.recordId}\u0000${activityType}`)
        || { count: 0, last: Number.NEGATIVE_INFINITY })
    })).sort((left, right) => left.count - right.count
      || left.last - right.last
      || left.activityType.localeCompare(right.activityType));
    const aggregateCount = activity.reduce((sum, item) => sum + item.count, 0);
    const worst = activity[0] || { count: uses.filter(use => use.recordId === record.recordId).length,
      last: Number.NEGATIVE_INFINITY };
    const introductionPriority = record.introductionSlotId === slotId
      && uses.every(use => use.recordId !== record.recordId)
      ? 0
      : 1;
    const tie = stableHash(JSON.stringify([
      record.recordId,
      slotId,
      journeyStep,
      category,
      seed,
      requiredActivityTypes
    ]));
    return { record, tuple: [introductionPriority, aggregateCount, worst.count, worst.last, tie] };
  });
  ranked.sort((left, right) => {
    for (let index = 0; index < left.tuple.length; index += 1) {
      if (left.tuple[index] !== right.tuple[index]) return left.tuple[index] - right.tuple[index];
    }
    return left.record.recordId.localeCompare(right.record.recordId);
  });
  return Object.freeze(ranked.map(item => item.record));
}

function exactVisitForRecord(binding, input, record) {
  const base = {
    kind: "visit",
    visitId: input.visitId,
    contentInstanceId: binding.contentInstanceId,
    visitOwnerId: binding.visitOwnerId,
    ownerActionUseId: binding.actionUseId,
    category: binding.category,
    slotId: binding.slotId,
    recordId: record.recordId,
    contentId: record.contentId,
    targetId: record.targetId,
    wordId: record.wordId,
    stopId: input.stopId,
    journeyStep: input.journeyStep
  };
  if (binding.category === "heartWords") base.ownerActivityType = binding.requiredActivityType;
  return deepFreeze(base);
}

function servedFromVisit(contentDecks, visit, binding, record) {
  const common = {
    category: visit.category,
    slotId: visit.slotId,
    contentInstanceId: visit.contentInstanceId,
    visitId: visit.visitId,
    visitOwnerId: visit.visitOwnerId,
    ownerActionUseId: visit.ownerActionUseId,
    stopId: visit.stopId,
    journeyStep: visit.journeyStep,
    recordId: visit.recordId,
    contentId: visit.contentId,
    targetId: visit.targetId,
    wordId: visit.wordId
  };
  if (visit.category === "heartWords") {
    common.eligibleActivityTypes = record.eligibleActivityTypes;
    common.answerTokensByActivity = record.answerTokensByActivity;
    common.ownerActivityType = binding.requiredActivityType;
  }
  common.nextState = contentDecks;
  return deepFreeze(common);
}

function candidateRecords(contentDecks, binding, { stopId }) {
  const catalog = getContentDeckCatalog(binding.category);
  if (binding.category !== "heartWords") {
    return catalog.filter(record => record.slotIds.includes(binding.slotId));
  }
  const stopIndex = stopNumber(stopId);
  if (!stopIndex) return [];
  const requiredActivityTypes = [...new Set(getContentDeckActionBindings(
    "heartWords",
    binding.contentInstanceId
  ).map(item => item.requiredActivityType))].sort();
  return catalog.filter(record => stopNumber(record.introductionStopId) <= stopIndex
    && requiredActivityTypes.every(activity => record.eligibleActivityTypes.includes(activity)));
}

export function serveContentDeck(contentDecks, input = {}) {
  const state = normalizedDeckState(contentDecks);
  const binding = canonicalOwnerBinding(input.binding);
  const visitId = typeof input.visitId === "string" && input.visitId.trim() ? input.visitId.trim() : null;
  const stopId = typeof input.stopId === "string" && input.stopId.trim() ? input.stopId.trim() : null;
  const journeyStep = Number.isInteger(input.journeyStep) && input.journeyStep > 0
    ? input.journeyStep
    : null;
  if (!visitId || !stopId || journeyStep === null) throw new Error("content deck serve identity is invalid");
  if (registeredBindingStopId(binding) !== stopId) {
    throw new Error("content deck serve stop does not match its registered binding");
  }

  const existing = state[binding.category].visits[visitId];
  if (existing) {
    const rehydrated = rehydrateServedContentInstance(state, { category: binding.category, visitId });
    if (!rehydrated || existing.stopId !== stopId || existing.journeyStep !== journeyStep) {
      throw new Error("existing content deck visit is divergent");
    }
    return rehydrated;
  }
  const duplicateClaim = validVisits(state, binding.category).find(visit =>
    visit.contentInstanceId === binding.contentInstanceId && visit.journeyStep === journeyStep);
  if (duplicateClaim) throw new Error("content instance already has a visit at this journey step");

  const candidates = candidateRecords(state, binding, { stopId });
  if (!candidates.length) return null;
  const requiredActivityTypes = binding.category === "heartWords"
    ? [...new Set(getContentDeckActionBindings(
      "heartWords",
      binding.contentInstanceId
    ).map(item => item.requiredActivityType))].sort()
    : [];
  const record = rankContentDeckCandidates(candidates, state, {
    category: binding.category,
    slotId: binding.slotId,
    journeyStep,
    requiredActivityTypes,
    seed: input.seed
  })[0];
  if (!record) return null;
  const visit = exactVisitForRecord(binding, { visitId, stopId, journeyStep }, record);
  const nextState = createContentDeckState({
    ...state,
    [binding.category]: {
      ...state[binding.category],
      visits: { ...state[binding.category].visits, [visitId]: visit }
    }
  });
  return servedFromVisit(nextState, nextState[binding.category].visits[visitId], binding, record);
}

export function rehydrateServedContentInstance(contentDecks, { category, visitId } = {}) {
  const state = normalizedDeckState(contentDecks);
  const visit = validVisits(state, category).find(item => item.visitId === visitId);
  if (!visit) return null;
  const binding = getContentDeckOwnerBinding(category, visit.slotId);
  const record = getContentDeckCatalogRecord(category, visit.recordId);
  const actionBindings = binding
    ? getContentDeckActionBindings(category, binding.contentInstanceId)
    : [];
  if (!binding || !record
    || visit.contentInstanceId !== binding.contentInstanceId
    || visit.visitOwnerId !== binding.visitOwnerId
    || visit.ownerActionUseId !== binding.actionUseId
    || visit.contentId !== record.contentId
    || visit.targetId !== record.targetId
    || visit.wordId !== record.wordId
    || visit.stopId !== registeredBindingStopId(binding)
    || (category !== "heartWords" && !record.slotIds.includes(visit.slotId))
    || (category === "heartWords" && (
      visit.ownerActivityType !== binding.requiredActivityType
      || !record.eligibleActivityTypes.includes(binding.requiredActivityType)
      || !heartRecordSupportsAllBindings(record, actionBindings)
      || stopNumber(record.introductionStopId) > stopNumber(visit.stopId)
    ))) return null;
  return servedFromVisit(state, visit, binding, record);
}

export function projectBoundContentResolverInputs(served) {
  if (!served || served.category !== "heartWords") {
    throw new Error("bound content resolver requires a rehydrated heart-word instance");
  }
  const catalogRecord = getContentDeckCatalogRecord(served.category, served.recordId);
  const source = { servedInstance: served, catalogRecord };
  validateBoundContentDecisionSource(source);
  return Object.freeze(source);
}

export function recordContentDeckUse(contentDecks, served, binding) {
  const state = normalizedDeckState(contentDecks);
  if (!served?.visitId || binding?.category !== "heartWords") {
    throw new Error("story transfer transaction owns every non-heart use");
  }
  const canonicalBindings = getContentDeckActionBindings(binding.category, binding.contentInstanceId);
  const canonicalBinding = canonicalBindings.find(item => sameValue(item, binding));
  if (!canonicalBinding) throw new Error("content use binding is not registered");
  const current = rehydrateServedContentInstance(state, {
    category: binding.category,
    visitId: served.visitId
  });
  if (!current) throw new Error("content use cannot rehydrate its canonical visit");
  const canonicalOwner = getContentDeckOwnerBinding(binding.category, binding.slotId);
  if (binding.isVisitOwner !== true) {
    const ownerUseId = `${current.visitId}:${canonicalOwner.actionUseId}`;
    if (state.heartWords.uses[ownerUseId]?.kind !== "use") {
      throw new Error("shared heart-word use requires the owner use first");
    }
  }
  const useId = `${current.visitId}:${binding.actionUseId}`;
  const use = deepFreeze({
    kind: "use",
    useId,
    visitId: current.visitId,
    contentInstanceId: current.contentInstanceId,
    visitOwnerId: current.visitOwnerId,
    actionUseId: binding.actionUseId,
    category: "heartWords",
    slotId: current.slotId,
    recordId: current.recordId,
    journeyStep: current.journeyStep,
    activityType: binding.requiredActivityType
  });
  const existing = state.heartWords.uses[useId];
  if (existing) {
    if (!sameValue(existing, use)) throw new Error("immutable heart-word use is divergent");
    return state;
  }
  return createContentDeckState({
    ...state,
    heartWords: {
      ...state.heartWords,
      uses: { ...state.heartWords.uses, [useId]: use }
    }
  });
}
