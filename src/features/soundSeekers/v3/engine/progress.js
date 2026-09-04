// Sound Seekers v3 — journey progress (pure). Storage adapters are injected by
// the React layer so this module stays Node-testable.
//
// Shape:
// {
//   v: 3, hero, journeyStep, currentStopId,
//   completed: { [stopId]: { at, tokens, replayOrdinal } },
//   checkpoint: { stopId, beatIndex, replayOrdinal, beatState } | null,
//   targets: { [targetId]: { taught, independent, supported, missed, lastSeenStep, confusions:{} } },
//   evidence: [ ...events ]   (capped)
// }

import { TRAIL, nextStopId } from "../content/trail.js";

export const PROGRESS_VERSION = 3;
const EVIDENCE_CAP = 600;

export function createProgress({ hero = "speedy" } = {}) {
  return {
    v: PROGRESS_VERSION,
    hero,
    heroChosen: false,
    journeyStep: 0,
    currentStopId: TRAIL[0].id,
    completed: {},
    checkpoint: null,
    targets: {},
    evidence: [],
    updatedAt: 0
  };
}

export function normalizeProgress(raw, fallbackHero = "speedy") {
  if (!raw || typeof raw !== "object" || raw.v !== PROGRESS_VERSION) return createProgress({ hero: raw?.hero || fallbackHero });
  const p = createProgress({ hero: raw.hero || fallbackHero });
  return {
    ...p,
    heroChosen: Boolean(raw.heroChosen),
    journeyStep: Number.isFinite(raw.journeyStep) ? raw.journeyStep : 0,
    currentStopId: TRAIL.some(s => s.id === raw.currentStopId) ? raw.currentStopId : TRAIL[0].id,
    completed: raw.completed && typeof raw.completed === "object" ? raw.completed : {},
    checkpoint: raw.checkpoint && TRAIL.some(s => s.id === raw.checkpoint.stopId) ? raw.checkpoint : null,
    targets: raw.targets && typeof raw.targets === "object" ? raw.targets : {},
    evidence: Array.isArray(raw.evidence) ? raw.evidence.slice(-EVIDENCE_CAP) : [],
    updatedAt: raw.updatedAt || 0
  };
}

export function isStopUnlocked(progress, stopId) {
  const i = TRAIL.findIndex(s => s.id === stopId);
  if (i <= 0) return true;
  return Boolean(progress.completed[TRAIL[i - 1].id]);
}

export function isStopCompleted(progress, stopId) {
  return Boolean(progress.completed[stopId]);
}

function bump(targets, id, patch) {
  const t = targets[id] || { taught: false, independent: 0, supported: 0, missed: 0, lastSeenStep: null, confusions: {} };
  return { ...targets, [id]: { ...t, ...patch(t) } };
}

export function recordTaught(progress, targetIds, now = Date.now()) {
  let targets = progress.targets;
  for (const id of targetIds) targets = bump(targets, id, () => ({ taught: true }));
  return { ...progress, targets, updatedAt: now };
}

// One evidence event → the target ledger + the log. Nothing else moves.
export function recordEvidence(progress, event, now = Date.now()) {
  if (!event) return progress;
  let targets = progress.targets;
  const step = progress.journeyStep;
  for (const id of event.targetIds || []) {
    targets = bump(targets, id, t => {
      const confusions = { ...t.confusions };
      if (!event.independent && event.confusedWith) confusions[event.confusedWith] = (confusions[event.confusedWith] || 0) + 1;
      return {
        independent: t.independent + (event.independent ? 1 : 0),
        supported: t.supported + (!event.independent ? 1 : 0),
        missed: t.missed + ((event.errors || 0) > 0 ? 1 : 0),
        lastSeenStep: step,
        confusions
      };
    });
  }
  const entry = { ...event, journeyStep: step, at: now };
  return { ...progress, targets, evidence: [...progress.evidence, entry].slice(-EVIDENCE_CAP), updatedAt: now };
}

export function setCheckpoint(progress, checkpoint, now = Date.now()) {
  return { ...progress, checkpoint, updatedAt: now };
}

export function completeStop(progress, stopId, { replayOrdinal = 0, token = null } = {}, now = Date.now()) {
  const already = progress.completed[stopId];
  const completed = {
    ...progress.completed,
    [stopId]: { at: already?.at || now, tokens: [...new Set([...(already?.tokens || []), token].filter(Boolean))], replayOrdinal, plays: (already?.plays || 0) + 1 }
  };
  const next = nextStopId(stopId);
  const currentStopId = already ? progress.currentStopId : (next || stopId);
  return { ...progress, completed, currentStopId, checkpoint: null, journeyStep: progress.journeyStep + 1, updatedAt: now };
}

export function setHero(progress, hero, now = Date.now()) {
  return { ...progress, hero, updatedAt: now };
}

// Teacher-facing summary: construct-level counts, no vanity numbers.
export function summarizeProgress(progress) {
  const targets = Object.entries(progress.targets).map(([id, t]) => ({ id, ...t }));
  return {
    hero: progress.hero,
    stopsCompleted: Object.keys(progress.completed).length,
    currentStopId: progress.currentStopId,
    targets: targets.sort((a, b) => a.id.localeCompare(b.id)),
    evidenceCount: progress.evidence.length
  };
}
