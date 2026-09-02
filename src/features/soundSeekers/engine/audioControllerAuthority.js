import { createAudioDelivery, reduceAudioDelivery } from "./audioDelivery.js";

const REQUEST_KEYS = Object.freeze([
  "cueId", "audioKey", "visibleText", "spokenText", "kind", "requiresAudio"
]);
const completedReceiptMetadata = new WeakMap();
const activeOwnerByCueId = new Map();
const completedReceiptByCueId = new Map();
const cueIdsByController = new WeakMap();

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function canonicalRequest(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)
    || Object.keys(raw).length !== REQUEST_KEYS.length
    || !REQUEST_KEYS.every(key => Object.hasOwn(raw, key))) {
    throw new Error("audio request must use the exact canonical shape");
  }
  if (raw.kind !== "teach" || raw.requiresAudio !== true
    || !/^teach:s(?:[1-9]|[1-3][0-9]|40):(?:0|[1-9][0-9]*):[^:]+:(?:0|[1-9][0-9]*)$/u.test(raw.cueId)
    || typeof raw.audioKey !== "string"
    || !/^(?:\/audio\/|quest\/)[A-Za-z0-9/_-]+(?:\.mp3)?$/u.test(raw.audioKey)
    || typeof raw.visibleText !== "string" || !raw.visibleText.trim()
    || raw.spokenText !== raw.visibleText) {
    throw new Error("audio request is not canonical");
  }
  return deepFreeze(Object.fromEntries(REQUEST_KEYS.map(key => [key, raw[key]])));
}

export function validateCompletedAudioDeliveryReceipt(delivery, expectedRequest) {
  const metadata = completedReceiptMetadata.get(delivery);
  if (!metadata
    || completedReceiptByCueId.get(metadata.request.cueId) !== delivery
    || delivery.status !== "completed" || !Object.isFrozen(delivery)) return false;
  const expected = expectedRequest && typeof expectedRequest === "object" ? expectedRequest : {};
  return REQUEST_KEYS.every(key => Object.hasOwn(expected, key)
    && metadata.request[key] === expected[key]);
}

export function createSoundSeekersAudioController({ cuePlayer, music, clock } = {}) {
  if (!cuePlayer || typeof cuePlayer.playCueAudio !== "function"
    || typeof cuePlayer.stopCueAudio !== "function"
    || !music || typeof music.duck !== "function" || typeof music.restore !== "function"
    || typeof clock !== "function") {
    throw new Error("Sound Seekers audio controller requires canonical playback dependencies");
  }
  const controllerIdentity = Object.freeze({});
  const listeners = new Set();
  let activeRequest = null;
  let snapshot = deepFreeze({ request: null, delivery: null });
  let disposed = false;

  function publish(next) {
    snapshot = deepFreeze(next);
    for (const listener of listeners) listener(snapshot);
  }

  function stopActive({ stop = true, invalidateAll = false } = {}) {
    if (activeRequest) {
      if (stop) cuePlayer.stopCueAudio();
      music.restore();
      const owner = activeOwnerByCueId.get(activeRequest.cueId);
      if (owner?.controllerIdentity === controllerIdentity && owner.request === activeRequest) {
        activeOwnerByCueId.delete(activeRequest.cueId);
      }
    }
    if (invalidateAll) {
      for (const cueId of cueIdsByController.get(controllerIdentity) || []) {
        const owner = activeOwnerByCueId.get(cueId);
        if (owner?.controllerIdentity === controllerIdentity) activeOwnerByCueId.delete(cueId);
        const receipt = completedReceiptByCueId.get(cueId);
        if (completedReceiptMetadata.get(receipt)?.controllerIdentity === controllerIdentity) {
          completedReceiptByCueId.delete(cueId);
        }
      }
      cueIdsByController.delete(controllerIdentity);
    }
    activeRequest = null;
  }

  function begin(request) {
    if (disposed) throw new Error("audio controller is disposed");
    const canonical = canonicalRequest(request);
    stopActive();
    completedReceiptByCueId.delete(canonical.cueId);
    activeOwnerByCueId.set(canonical.cueId, { controllerIdentity, request: canonical });
    const cueIds = cueIdsByController.get(controllerIdentity) || new Set();
    cueIds.add(canonical.cueId);
    cueIdsByController.set(controllerIdentity, cueIds);
    activeRequest = canonical;
    let delivery = createAudioDelivery(canonical.cueId);
    publish({ request: canonical, delivery });
    music.duck();
    cuePlayer.playCueAudio(canonical.audioKey, {
      cueId: canonical.cueId,
      onDelivery(event) {
        if (activeRequest !== canonical) return;
        delivery = reduceAudioDelivery(delivery, event);
        if (delivery.status === "completed") {
          const owner = activeOwnerByCueId.get(canonical.cueId);
          if (owner?.controllerIdentity === controllerIdentity && owner.request === canonical) {
            completedReceiptMetadata.set(delivery, { controllerIdentity, request: canonical });
            completedReceiptByCueId.set(canonical.cueId, delivery);
            activeOwnerByCueId.delete(canonical.cueId);
          }
          publish({ request: canonical, delivery });
          music.restore();
          activeRequest = null;
          return;
        }
        if (["interrupted", "failed"].includes(delivery.status)) {
          publish({ request: canonical, delivery });
          music.restore();
          activeRequest = null;
          return;
        }
        publish({ request: canonical, delivery });
      }
    });
    return snapshot;
  }

  return Object.freeze({
    getSnapshot() { return snapshot; },
    subscribe(listener) {
      if (typeof listener !== "function" || disposed) throw new Error("audio subscription is invalid");
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    request(request) { return begin(request); },
    replay() {
      if (!snapshot.request) throw new Error("audio replay needs a prior request");
      return begin(snapshot.request);
    },
    cancel() {
      if (disposed) return snapshot;
      stopActive({ invalidateAll: true });
      return snapshot;
    },
    dispose() {
      if (disposed) return;
      stopActive({ invalidateAll: true });
      listeners.clear();
      disposed = true;
      void clock();
    }
  });
}
