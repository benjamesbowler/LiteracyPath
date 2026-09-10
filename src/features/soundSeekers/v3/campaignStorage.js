import { campaignLiveKey, campaignBaseSignature, buildCampaignLiveJournal, applyCampaignLiveJournal } from '../../../utils/campaignLiveJournal.js';
import { applyCampaignPositions, campaignPositionKey } from '../../../utils/campaignPosition.js';
import { decodeCampaignTransport } from '../../../utils/campaignTransport.js';
import { encodeProgressStorage, decodeProgressStorage } from '../../../utils/progressStorageCodec.js';
// Same cloud row and explicit migration from both existing journey keys. A
// protected campaign key prevents older v3 clients overwriting its codec.
import { localProgressStorageKey, localProgressStorageKeyForRow } from '../../../utils/progressKeys.js';
import { CAMPAIGN_VERSION, CAMPAIGN_STAGES, CAMPAIGN_MISSIONS } from './content/campaign.js';
import { MECHANICS, publicBeat } from './engine/challenges.js';
import { normalizeCampaignProgress, mergeCampaignProgress, mergeCheckpoint, CAMPAIGN_PROGRESS_VERSION } from './engine/campaignProgress.js';

const catalog = { version: CAMPAIGN_VERSION, stages: CAMPAIGN_STAGES, missions: CAMPAIGN_MISSIONS };
const AREA = 'phonics_quest';
const ROW = 'sound_seekers_v3';
const frozen = new WeakSet();
const freeze = value => { if(value && typeof value === 'object' && !frozen.has(value)){Object.values(value).forEach(freeze);Object.freeze(value);frozen.add(value);}return value; };
const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
const baseKey = scope => localProgressStorageKey(AREA, scope);
export const campaignStorageKey = (scope = 'default') => localProgressStorageKeyForRow(AREA, ROW, scope);
const scopeOf = value => {
  if (typeof value !== 'string' || !value.trim()) throw new Error('A campaign learner scope is required');
  return value;
};
const failure = (code, progress = null) => ({ ok: false, status: code, progress: clone(progress), error: {
  code, message: ({ unreadable: 'Your saved adventure needs recovery. It has been kept safe.',
    conflict: 'Two saved adventures need to be reconciled. Both have been kept.',
    unavailable: 'This device could not save your adventure. Keep this page open and try again.',
    unsupported: 'This saved adventure needs a newer version of the game.',
    'sync-failed': 'Your adventure is saved on this device. Sync will need another try.',
    reset: 'This adventure was reset in another window. Reopen it to continue.' })[code] || 'Your adventure could not be saved.'
} });

const parseJournal = text => { try{return JSON.parse(text);}catch{throw new Error('unreadable');} };
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonempty = value => typeof value === 'string' && value.length > 0;
const strings = value => Array.isArray(value) && value.every(item => typeof item === 'string');
const natural = value => Number.isSafeInteger(value) && value >= 0;
const requireShape = valid => { if (!valid) throw new Error('unreadable'); };
const uniqueEntries = (entries, key = 'id') => Array.isArray(entries) && entries.length > 0
  && entries.every(item => record(item) && nonempty(item[key])) && new Set(entries.map(item => item[key])).size === entries.length;

function validateBeat(beat, missionId) {
  requireShape(record(beat) && nonempty(beat.id) && beat.missionId === missionId
    && [...Object.values(MECHANICS), 'sentence_build'].includes(beat.mechanic)
    && record(beat.view) && record(beat.prompt) && typeof beat.prompt.text === 'string'
    && Array.isArray(beat.prompt.cues) && beat.prompt.cues.every(cue => record(cue) && nonempty(cue.src))
    && strings(beat.targetIds));
  // Reject leaked answer metadata before the renderer receives a projection.
  // The private key stays on the controller checkpoint and is never projected.
  try { const visible = publicBeat(beat); requireShape(!Object.hasOwn(visible, 'key')); } catch { throw new Error('unreadable'); }
  const view = beat.view, key = beat.key;
  if (beat.mechanic === MECHANICS.SIGNPOST) {
    requireShape(key === null && uniqueEntries(view.cards, 'targetId') && view.cards.every(card => typeof card.grapheme === 'string'));
    return;
  }
  requireShape(record(key));
  if ([MECHANICS.WORD_FORGE, 'sentence_build'].includes(beat.mechanic)) {
    requireShape(uniqueEntries(view.tiles) && view.tiles.every(tile => typeof tile.grapheme === 'string')
      && Number.isSafeInteger(view.slots) && view.slots > 0 && strings(key.sequence)
      && key.sequence.length === view.slots && new Set(key.sequence).size === key.sequence.length
      && key.sequence.every(id => view.tiles.some(tile => tile.id === id)));
    if (view.workshop !== undefined) requireShape(record(view.workshop) && ['replace', 'assembly'].includes(view.workshop.mode));
    if (view.workshop?.mode === 'replace') requireShape(
      nonempty(view.workshop.baseWord) && strings(view.workshop.baseUnits) && view.workshop.baseUnits.length > 0
      && natural(view.workshop.slotIndex) && view.workshop.slotIndex < view.workshop.baseUnits.length && view.slots === 1);
  } else if (beat.mechanic === MECHANICS.SOUND_SORT) {
    requireShape(uniqueEntries(view.bins) && uniqueEntries(view.items) && record(key.bins)
      && record(key.binTargets) && view.bins.every(bin => nonempty(key.binTargets[bin.id]))
      && view.items.every(item => view.bins.some(bin => bin.id === key.bins[item.id])));
  } else {
    const choices = beat.mechanic === MECHANICS.STORY_BRIDGE ? view.choices : beat.mechanic === MECHANICS.GATE_RIDDLE ? view.keys : view.options;
    const expected = beat.mechanic === MECHANICS.STORY_BRIDGE ? key.choiceId : beat.mechanic === MECHANICS.GATE_RIDDLE ? key.keyId : key.optionId;
    requireShape(uniqueEntries(choices) && choices.some(choice => choice.id === expected));
    if ([MECHANICS.BLEND_BRIDGE, MECHANICS.HEART_LANTERN, MECHANICS.GATE_RIDDLE].includes(beat.mechanic)) {
      requireShape(record(key.optionWords) && choices.every(choice => typeof key.optionWords[choice.id] === 'string'));
    }
    if (beat.mechanic === MECHANICS.ECHO_HUNT) requireShape(record(view.target) && record(key.optionTargets));
    if (beat.mechanic === MECHANICS.BLEND_BRIDGE) requireShape(uniqueEntries(view.stones));
    if (beat.mechanic === MECHANICS.HEART_LANTERN) requireShape(Array.isArray(view.letters));
  }
}

/** Validate saved controller inputs before any canvas/authority consumes them.
 * Failure preserves the exact source bytes; it does not silently regenerate
 * a challenge, forget assistance, or substitute a fresh save.
 */
export function validateCampaignSavedProgress(progress, trusted = null) {
  if (progress.v !== 3 || !progress.campaign) return;
  const campaign = progress.campaign;
  requireShape(record(campaign) && record(campaign.checkpoints) && record(campaign.completedMissions)
    && record(campaign.repairs) && record(campaign.attemptIds) && strings(campaign.visitedStageIds)
    && record(progress.targets) && Array.isArray(progress.evidence));
  requireShape(campaign.activeMissionId === null || (nonempty(campaign.activeMissionId)
    && CAMPAIGN_MISSIONS.some(mission => mission.id === campaign.activeMissionId)
    && Object.hasOwn(campaign.checkpoints, campaign.activeMissionId)));
  for (const [missionId, checkpoint] of Object.entries(campaign.checkpoints)) {
    requireShape(record(checkpoint) && checkpoint.missionId === missionId && nonempty(checkpoint.attemptId)
      && uniqueEntries(checkpoint.challenges) && natural(checkpoint.beatIndex)
      && checkpoint.beatIndex <= checkpoint.challenges.length && typeof checkpoint.completed === 'boolean'
      && (checkpoint.beatIndex < checkpoint.challenges.length || checkpoint.completed)
      && record(checkpoint.beatState));
    if (checkpoint.playTime !== undefined) {
      const time = checkpoint.playTime;
      requireShape(record(time) && time.v === 1 && natural(time.estimatedActiveMs) && natural(time.estimatedHelpMs)
        && time.estimatedHelpMs <= time.estimatedActiveMs);
    }
    if(checkpoint.challenges!==trusted?.campaign?.checkpoints?.[missionId]?.challenges)for (const beat of checkpoint.challenges) validateBeat(beat, missionId);
    const beat = checkpoint.challenges[Math.min(checkpoint.beatIndex, checkpoint.challenges.length - 1)];
    const state = checkpoint.beatState;
    requireShape(state.beatId === beat.id && state.mechanic === beat.mechanic && natural(state.errors)
      && strings(state.supportUsed) && typeof state.done === 'boolean' && typeof state.modelShown === 'boolean');
    if (beat.mechanic === MECHANICS.SIGNPOST) requireShape(strings(state.cardsHeard)
      && state.cardsHeard.every(id => beat.view.cards.some(card => card.targetId === id)));
    if ([MECHANICS.WORD_FORGE, 'sentence_build'].includes(beat.mechanic)) requireShape(strings(state.placed)
      && natural(state.slotErrors) && new Set(state.placed).size === state.placed.length
      && state.placed.length <= beat.view.slots && state.placed.every(id => beat.view.tiles.some(tile => tile.id === id)));
    if (beat.view.workshop?.mode === 'replace') requireShape(strings(state.wordUnits)
      && state.wordUnits.length === beat.view.workshop.baseUnits.length);
    if (beat.mechanic === MECHANICS.SOUND_SORT) requireShape(natural(state.itemIndex)
      && state.itemIndex <= beat.view.items.length && record(state.placed) && record(state.itemErrors)
      && Object.values(state.itemErrors).every(natural) && Array.isArray(state.events));
    if (beat.mechanic === MECHANICS.BLEND_BRIDGE) requireShape(['stones', 'blend', 'meaning'].includes(state.phase)
      && strings(state.tapped) && state.tapped.every((id, index) => beat.view.stones[index]?.id === id));
    if (beat.mechanic === MECHANICS.HEART_LANTERN) requireShape(['learn', 'find', 'phrase', 'done'].includes(state.phase));
    if (checkpoint.position !== undefined && checkpoint.position !== null) {
      const p = checkpoint.position;
      requireShape(record(p) && p.v === 1 && ['x','y','vx','vy','facing','recoveries'].every(field => Number.isFinite(p[field]))
        && [-1,1].includes(p.facing) && natural(p.recoveries) && (p.lastCheckpointId === null || typeof p.lastCheckpointId === 'string'));
    }
  }
}

function decode(text) {
  let raw;
  try { raw = decodeCampaignTransport(decodeProgressStorage(text)); } catch { throw new Error('unreadable'); }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || ![1, 2, 3].includes(raw.v)) throw new Error(raw?.v > 3 ? 'unsupported' : 'unreadable');
  if (raw.campaign?.v && raw.campaign.v !== CAMPAIGN_PROGRESS_VERSION) throw new Error('unsupported');
  validateCampaignSavedProgress(raw);
  return normalizeCampaignProgress(raw, catalog);
}

function cloudCopy(progress) {
  const safe = { ...progress, campaign: { ...progress.campaign } };
  // Original migration snapshots are device recovery data. In particular, old
  // teacher assignments and telemetry must not slip through nested payloads.
  delete safe.assignment;
  delete safe.telemetry;
  if (safe.campaign) { delete safe.campaign.legacySave; delete safe.campaign.legacySaves; }
  return safe;
}

/** Dependencies make account switching, quota failure, browser events and
 * asynchronous queues testable without importing Supabase or contacting it.
 * API results are {ok,status,progress,error?}; subscribe receives that shape.
 */
export function createCampaignStorage({ storage, getStorage = () => storage,
  queueSave = () => false, eventTarget = null,
  schedule = (callback, delay) => setTimeout(callback, delay), cancel = handle => clearTimeout(handle),
  debounceMs = 800, positionSyncMs = 30_000, clockNow = () => Date.now() } = {}) {
  const scopes = new Map();
  let listening = false;
  const getEntry = scope => {
    if (!scopes.has(scope)) scopes.set(scope, { progress: null, subscribers: new Set(), timer: null,
      timerDueAt: null, lastQueuedAt: clockNow(), dirty: false, localSaved: false, blocked: false, disposed: false, revision: 0, inflight: null, recovery: [], last: null });
    return scopes.get(scope);
  };
  const emit = (entry, result) => {
    entry.last = result;
    if (!entry.disposed) for (const callback of entry.subscribers) { try { callback(freeze(result)); } catch { /* subscriber cannot break saving */ } }
    return result;
  };
  const merge = (scope, a, b) => !a ? b : !b ? a : mergeCampaignProgress({ scopeKey: scope, progress: a }, { scopeKey: scope, progress: b }, catalog).progress;
  function read(scope) {
    const store = getStorage();
    if (!store) throw new Error('unavailable');
    const primary = store.getItem(campaignStorageKey(scope));
    if (primary !== null) {
      const entry=getEntry(scope);
      const raw=entry.cachedBytes===primary?entry.cachedProgress:decode(primary);
      if(entry.cachedBytes!==primary)entry.baseSignature=campaignBaseSignature(primary);
      entry.cachedBytes=primary;entry.cachedProgress=raw;
      const liveBytes=store.getItem(campaignLiveKey(campaignStorageKey(scope)));
      const live=applyCampaignLiveJournal(raw,liveBytes===null?null:parseJournal(liveBytes),entry.baseSignature);
      validateCampaignSavedProgress(live,raw);
      entry.liveBytes=liveBytes;
      const side=store.getItem(campaignPositionKey(campaignStorageKey(scope)));
      return {progress:applyCampaignPositions(live,side===null?null:parseJournal(side)),migrated:false};
    }
    // Confirmed legacy formats: questStore uses this exact key for v1/v2.
    // Earlier v3 clients wrote :v3; v1/v2 and early cloud hydration used base.
    const legacy = store.getItem(`${baseKey(scope)}:v3`) ?? store.getItem(baseKey(scope));
    if (legacy !== null) return { progress: decode(legacy), migrated: true };
    return { progress: normalizeCampaignProgress(null, catalog), migrated: false };
  }
  const ensureListener = () => {
    if (!listening && eventTarget?.addEventListener) { eventTarget.addEventListener('storage', onStorage); eventTarget.addEventListener('lp-progress-hydrated', onHydrated); listening = true; }
  };
  function loadCampaignProgress(scopeKey = 'default') {
    const scope = scopeOf(scopeKey), entry = getEntry(scope);
    ensureListener();
    if (entry.blocked || entry.last?.ok === false) return freeze(entry.last);
    if (entry.progress) return { ok: true, status: entry.dirty ? 'pending' : 'loaded', progress: freeze(entry.progress) };
    try {
      const found = read(scope);
      entry.progress = found.progress;
      entry.localSaved = true;
      entry.blocked = false;
      // No write during lookup. Preserve the original legacy bytes until the
      // caller performs a real save to the canonical v3 key.
      entry.last = { ok: true, status: found.migrated ? 'migrated' : 'loaded', progress: freeze(found.progress) };
      return freeze(entry.last);
    } catch (error) {
      entry.blocked = true;
      entry.last = failure(['unreadable', 'unsupported'].includes(error.message) ? error.message : 'unavailable', entry.progress);
      return freeze(entry.last);
    }
  }
  function scheduleSave(scope, entry, delay = debounceMs) {
    const dueAt = Math.min(entry.timerDueAt ?? Infinity, clockNow() + delay);
    if (entry.timer !== null) cancel(entry.timer);
    entry.timerDueAt = dueAt;
    entry.timer = schedule(() => { entry.timer = null; entry.timerDueAt = null; void flushCampaignProgress(scope); }, Math.max(0, dueAt - clockNow()));
  }
  function saveCampaignProgress(scopeKey = 'default', progress, { positionOnly = false, forceSync = false } = {}) {
    const scope = scopeOf(scopeKey), entry = getEntry(scope);
    ensureListener();
    if (entry.blocked) return entry.last || failure('conflict', entry.progress);
    // A movement save contains only a small position/time overlay on an exact,
    // already validated immutable snapshot. Never serialize its challenge history.
    if(positionOnly && entry.progress && entry.localSaved) {
      const previous=entry.progress, old=previous.campaign, next=progress?.campaign;
      const sameTop=Object.keys(previous).every(k=>['campaign','updatedAt'].includes(k)||previous[k]===progress[k]);
      const sameCampaign=next&&Object.keys(old).every(k=>k==='checkpoints'||old[k]===next[k]);
      const changed=next?Object.keys(next.checkpoints).filter(id=>next.checkpoints[id]!==old.checkpoints[id]):[];
      const safe=changed.every(id=>{const a=old.checkpoints[id],b=next.checkpoints[id];return a&&Object.keys(a).every(k=>['position','playTime','updatedAt'].includes(k)||(k==='beatState'?JSON.stringify(a[k])===JSON.stringify(b[k]):a[k]===b[k]));});
      if(sameTop&&sameCampaign&&safe) {
        try {
          const store=getStorage(), key=campaignStorageKey(scope);
          if(store.getItem(key)!==entry.cachedBytes||store.getItem(campaignLiveKey(key))!==entry.liveBytes)throw new Error('changed');
          const sideKey=campaignPositionKey(key), raw=store.getItem(sideKey);
          const journal=raw===null?{v:1,positions:{}}:parseJournal(raw);
          const reconciled=applyCampaignPositions(progress,journal);
          for(const id of changed){const cp=reconciled.campaign.checkpoints[id];journal.positions[id]={attemptId:cp.attemptId,beatIndex:cp.beatIndex,position:cp.position,playTime:cp.playTime,updatedAt:cp.updatedAt};}
          const candidate=freeze(applyCampaignPositions(progress,journal));
          store.setItem(sideKey,JSON.stringify(journal));
          entry.progress=candidate;entry.revision++;entry.dirty=scope!=='default';
          if(scope!=='default') {if(forceSync)void flushCampaignProgress(scope);else scheduleSave(scope,entry,Math.max(0,positionSyncMs-(clockNow()-entry.lastQueuedAt)));}
          return emit(entry,{ok:true,status:scope==='default'?'local-only':'saved-local',progress:candidate});
        }catch(error){if(error.message==='unreadable'){entry.blocked=true;return emit(entry,failure('unreadable',entry.progress));}}
      }
    }
    // Same-mission authority updates share frozen history. Validate only the
    // changed controller state and write its exact bounded journal immediately.
    if(!positionOnly && entry.progress && entry.cachedProgress && entry.localSaved) {
      const old=entry.progress, next=progress, id=old.campaign.activeMissionId;
      const cp=next?.campaign?.checkpoints?.[id], previous=old.campaign.checkpoints[id];
      const unchangedOther=cp&&Object.keys(old.campaign.checkpoints).every(k=>k===id||old.campaign.checkpoints[k]===next.campaign.checkpoints[k]);
      const appendOnly=Array.isArray(next?.evidence)&&old.evidence.every((e,i)=>next.evidence[i]===e);
      if(id&&(next.campaign.activeMissionId===id||(next.campaign.activeMissionId===null&&cp.completed))&&cp.challenges===previous.challenges&&cp.attemptId===previous.attemptId&&unchangedOther&&appendOnly) {
        try {
          const store=getStorage(),key=campaignStorageKey(scope);
          if(store.getItem(key)!==entry.cachedBytes||store.getItem(campaignLiveKey(key))!==entry.liveBytes)throw new Error('changed');
          const positionBytes=store.getItem(campaignPositionKey(key));
          const withPosition=applyCampaignPositions(next,positionBytes===null?null:parseJournal(positionBytes));
          const candidate={...withPosition,campaign:{...withPosition.campaign,checkpoints:{...withPosition.campaign.checkpoints,[id]:mergeCheckpoint(previous,withPosition.campaign.checkpoints[id])}}};
          validateCampaignSavedProgress(candidate,old);
          const journal=buildCampaignLiveJournal(entry.cachedProgress,candidate,entry.baseSignature),bytes=JSON.stringify(journal);
          store.setItem(campaignLiveKey(key),bytes);entry.liveBytes=bytes;
          store.removeItem(campaignPositionKey(key));
          entry.progress=freeze(candidate);entry.revision++;entry.dirty=scope!=='default';
          if(scope!=='default'){if(forceSync)void flushCampaignProgress(scope);else scheduleSave(scope,entry);}
          return emit(entry,{ok:true,status:scope==='default'?'local-only':'saved-local',progress:entry.progress});
        }catch(error){if(error.message==='unreadable'){entry.blocked=true;return emit(entry,failure('unreadable',entry.progress));}}
      }
    }
    let candidate;
    try {
      candidate = decode(JSON.stringify(progress));
      candidate = merge(scope, entry.progress, candidate);
      const stored = read(scope);
      candidate = merge(scope, stored.progress, candidate);
    } catch (error) {
      entry.recovery.push(clone(progress));
      entry.blocked = true;
      return emit(entry, failure(['unsupported', 'unreadable', 'unavailable'].includes(error.message) ? error.message : 'conflict', entry.progress));
    }
    entry.progress = freeze(candidate);
    entry.revision += 1;
    entry.dirty = true;
    let result;
    try {
      const store = getStorage();
      if (!store) throw new Error('unavailable');
      const serialized = encodeProgressStorage(candidate);
      if (store.getItem(campaignStorageKey(scope)) !== serialized) store.setItem(campaignStorageKey(scope), serialized);
      entry.cachedBytes=serialized;entry.cachedProgress=candidate;entry.baseSignature=campaignBaseSignature(serialized);entry.liveBytes=null;
      if(store.getItem(campaignLiveKey(campaignStorageKey(scope)))!==null)store.removeItem(campaignLiveKey(campaignStorageKey(scope)));
      if(store.getItem(campaignPositionKey(campaignStorageKey(scope)))!==null)store.removeItem(campaignPositionKey(campaignStorageKey(scope)));
      entry.localSaved = true;
      result = { ok: true, status: scope === 'default' ? 'local-only' : 'saved-local', progress: freeze(candidate) };
    } catch { entry.localSaved = false; result = failure('unavailable', candidate); }
    if (scope !== 'default') {
      if (forceSync) void flushCampaignProgress(scope);
      else scheduleSave(scope, entry, positionOnly ? Math.max(0, positionSyncMs - (clockNow() - entry.lastQueuedAt)) : debounceMs);
    }
    else entry.dirty = false;
    return emit(entry, result);
  }
  async function flushCampaignProgress(scopeKey = 'default') {
    const scope = scopeOf(scopeKey);
    return flushEntry(scope, getEntry(scope));
  }
  async function flushEntry(scope, entry) {
    if (entry.timer !== null) { cancel(entry.timer); entry.timer = null; entry.timerDueAt = null; }
    if (entry.blocked) return entry.last || failure('conflict', entry.progress);
    if (!entry.dirty || !entry.progress || scope === 'default') return entry.last || { ok: true, status: 'local-only', progress: freeze(entry.progress) };
    if (entry.inflight) return entry.inflight;
    const revision = entry.revision;
    entry.inflightRevision = revision;
    const payload = cloudCopy(entry.progress);
    entry.inflight = (async () => {
      try {
        const queued = await Promise.resolve().then(() => entry.blocked ? false : queueSave(AREA, ROW, payload, { scopeKey: scope }));
        if (entry.blocked) return entry.last;
        if (queued !== true) return emit(entry, failure(entry.localSaved ? 'sync-failed' : 'unavailable', entry.progress));
        entry.lastQueuedAt = clockNow();
        if (entry.revision === revision) entry.dirty = false;
        return emit(entry, { ok: true, status: 'queued', progress: freeze(entry.progress) });
      } catch { return emit(entry, failure(entry.localSaved ? 'sync-failed' : 'unavailable', entry.progress)); }
      finally {
        entry.inflight = null;
        if (entry.dirty && entry.revision !== revision && !entry.disposed) scheduleSave(scope, entry);
      }
    })();
    return entry.inflight;
  }
  function onHydrated(event) {
    const scope = event.detail?.studentId;
    if (!scopes.has(scope)) return;
    if (event.detail?.resetApplied) { onStorage({ key: campaignStorageKey(scope), newValue: null }); return; }
    for (const row of event.detail?.rows || []) {
      if (row.area === AREA && row.key === ROW) onStorage({ key: campaignStorageKey(scope), newValue: JSON.stringify(row.payload) });
    }
  }
  function onStorage(event) {
    let store;
    try { store = getStorage(); } catch { return; }
    if (event.storageArea && event.storageArea !== store) return;
    for (const [scope, entry] of scopes) {
      if (entry.disposed) continue;
      if(event.key===campaignLiveKey(campaignStorageKey(scope))){
        if(event.newValue!==null&&!entry.blocked){try{const incoming=read(scope).progress;const combined=merge(scope,entry.progress,incoming);saveCampaignProgress(scope,combined);}catch{entry.blocked=true;emit(entry,failure('unreadable',entry.progress));}}
        continue;
      }
      if(event.key===campaignPositionKey(campaignStorageKey(scope))){
        if(event.newValue!==null&&!entry.blocked){try{saveCampaignProgress(scope,applyCampaignPositions(entry.progress,parseJournal(event.newValue)),{positionOnly:true});}catch{entry.blocked=true;emit(entry,failure('unreadable',entry.progress));}}
        continue;
      }
      if (event.key !== campaignStorageKey(scope) && event.key !== baseKey(scope) && event.key !== `${baseKey(scope)}:v3`) continue;
      if (event.newValue === null) {
        if (entry.timer !== null) cancel(entry.timer);
        entry.timer = null; entry.blocked = true; entry.dirty = false;
        emit(entry, failure('reset', entry.progress));
        continue;
      }
      if (entry.blocked) { entry.recovery.push(event.newValue); continue; }
      try {
        const incoming = decode(event.newValue);
        const combined = merge(scope, entry.progress, incoming);
        saveCampaignProgress(scope, combined);
      } catch {
        entry.recovery.push(event.newValue);
        entry.blocked = true;
        emit(entry, failure('conflict', entry.progress));
      }
    }
  }
  function subscribeCampaignProgress(scopeKey = 'default', callback) {
    const scope = scopeOf(scopeKey), entry = getEntry(scope);
    entry.subscribers.add(callback);
    ensureListener();
    return () => entry.subscribers.delete(callback);
  }
  async function disposeCampaignStorage(scopeKey = 'default') {
    const scope = scopeOf(scopeKey), entry = scopes.get(scope);
    if (!entry) return;
    entry.disposed = true;
    if (entry.timer !== null) cancel(entry.timer);
    entry.timer = null;
    entry.subscribers.clear();
    const previousRevision = entry.inflightRevision;
    const pending = flushEntry(scope, entry);
    scopes.delete(scope);
    if (!scopes.size && listening) { eventTarget?.removeEventListener?.('storage', onStorage); eventTarget?.removeEventListener?.('lp-progress-hydrated', onHydrated); listening = false; }
    // Awaiting is optional for callers; all owned listeners/timers are already
    // gone. Flush only enqueues through the existing account-aware sync layer.
    const result = await pending;
    if (entry.dirty && previousRevision !== undefined && entry.revision !== previousRevision && !entry.blocked) return flushEntry(scope, entry);
    return result;
  }
  return { loadCampaignProgress, saveCampaignProgress, flushCampaignProgress, disposeCampaignStorage, subscribeCampaignProgress };
}

let defaultAdapter;
function adapter() {
  defaultAdapter ||= createCampaignStorage({
    getStorage: () => typeof window === 'undefined' ? null : window.localStorage,
    eventTarget: typeof window === 'undefined' ? null : window,
    // Lazy import leaves pure tests independent of browser-only Supabase config.
    queueSave: (...args) => import('../../../utils/progressSync.js').then(module => module.queueProgressSave(...args))
  });
  return defaultAdapter;
}
export const loadCampaignProgress = (...args) => adapter().loadCampaignProgress(...args);
export const saveCampaignProgress = (...args) => adapter().saveCampaignProgress(...args);
export const flushCampaignProgress = (...args) => adapter().flushCampaignProgress(...args);
export const disposeCampaignStorage = (...args) => adapter().disposeCampaignStorage(...args);
export const subscribeCampaignProgress = (...args) => adapter().subscribeCampaignProgress(...args);
