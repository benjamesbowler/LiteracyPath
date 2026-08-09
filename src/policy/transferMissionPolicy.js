import { localProgressStorageKey } from "../utils/progressKeys.js";

const EMPTY_TRANSFER_PROGRESS = Object.freeze({
  schemaVersion: 1,
  completed: [],
  evidence: [],
  offers: [],
  active: null
});

export function normalizeTransferMissionProgress(value = {}) {
  return {
    schemaVersion: 1,
    completed: Array.isArray(value.completed) ? value.completed : [],
    evidence: Array.isArray(value.evidence) ? value.evidence : [],
    offers: Array.isArray(value.offers) ? value.offers : [],
    active: value.active && typeof value.active === "object" ? value.active : null
  };
}

export function readTransferMissionProgress(scopeKey) {
  if (typeof window === "undefined") return { ...EMPTY_TRANSFER_PROGRESS };
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(localProgressStorageKey("transfer_missions", scopeKey)) || "{}"
    );
    return normalizeTransferMissionProgress(parsed);
  } catch {
    return { ...EMPTY_TRANSFER_PROGRESS };
  }
}

export function beginTransferMission(progress, mission, at = new Date().toISOString()) {
  const current = normalizeTransferMissionProgress(progress);
  if (
    current.active?.missionId === mission.id
    && current.active?.contentVersion === mission.contentVersion
  ) return current;
  const alreadyOffered = current.offers.some(offer =>
    offer.missionId === mission.id && String(offer.offeredAt || "").slice(0, 10) === at.slice(0, 10)
  );
  return {
    ...current,
    offers: alreadyOffered ? current.offers : [
      ...current.offers,
      { missionId: mission.id, context: mission.context, offeredAt: at }
    ],
    active: {
      missionId: mission.id,
      contentVersion: mission.contentVersion,
      context: mission.context,
      rehearsed: false,
      itemResults: [],
      startedAt: at,
      updatedAt: at
    }
  };
}

export function saveTransferMissionStep(progress, mission, { rehearsed, itemResults }, at = new Date().toISOString()) {
  const started = beginTransferMission(progress, mission, at);
  return {
    ...started,
    active: {
      ...started.active,
      rehearsed: Boolean(rehearsed),
      itemResults: Array.isArray(itemResults) ? itemResults : [],
      updatedAt: at
    }
  };
}

export function appendTransferCompletion(progress,evidence,at=new Date().toISOString()) {
  if (Array.isArray(progress?.completed) && progress.completed.includes(evidence.missionId)) return progress;
  const current = normalizeTransferMissionProgress(progress);
  return {
    ...current,
    completed:[...current.completed,evidence.missionId],
    evidence:[...current.evidence,{...evidence,completedAt:at}],
    active:null
  };
}
