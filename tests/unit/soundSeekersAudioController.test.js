import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { QUEST_STOPS } from "../../src/data/questSequence.js";
import { createTeachSequence } from "../../src/features/soundSeekers/engine/teachSequence.js";
import {
  createSoundSeekersAudioController,
  validateCompletedAudioDeliveryReceipt
} from "../../src/features/soundSeekers/runtime/soundSeekersAudioController.js";
import * as audioControllerModule from "../../src/features/soundSeekers/runtime/soundSeekersAudioController.js";
import * as audioAuthorityModule from "../../src/features/soundSeekers/engine/audioControllerAuthority.js";
import * as audioDeliveryModule from "../../src/features/soundSeekers/engine/audioDelivery.js";

function requestFor(item, audioKey, ordinal = 0) {
  return {
    cueId: `teach:${item.stopId}:${item.teachIndex}:${item.targetId}:${ordinal}`,
    audioKey,
    visibleText: item.childText,
    spokenText: item.childText,
    kind: "teach",
    requiresAudio: true
  };
}

function controlledDependencies() {
  let active = null;
  const stops = [];
  const music = [];
  return {
    stops,
    music,
    cuePlayer: {
      playCueAudio(audioKey, options) {
        active = { audioKey, options };
        options.onDelivery({ id: options.cueId, session: 1, type: "loading", at: 1 });
        options.onDelivery({ id: options.cueId, session: 1, type: "started", at: 2 });
      },
      stopCueAudio() {
        stops.push(active?.options?.cueId || null);
        active = null;
      }
    },
    musicOwner: {
      duck() { music.push("duck"); },
      restore() { music.push("restore"); }
    },
    complete(at = 3) {
      active.options.onDelivery({ id: active.options.cueId, session: 1, type: "completed", at });
    }
  };
}

test("the sole audio controller issues an exact completed teach delivery", () => {
  const item = createTeachSequence(QUEST_STOPS.find(stop => stop.id === "s1")).currentItem;
  const audioKey = item.childAudio;
  const dependencies = controlledDependencies();
  const controller = createSoundSeekersAudioController({
    cuePlayer: dependencies.cuePlayer,
    music: dependencies.musicOwner,
    clock: () => 0
  });
  assert.deepEqual(Object.keys(controller).sort(), [
    "cancel", "dispose", "getSnapshot", "replay", "request", "subscribe"
  ]);
  const snapshots = [];
  const unsubscribe = controller.subscribe(snapshot => snapshots.push(snapshot));
  controller.request(requestFor(item, audioKey));
  dependencies.complete();
  assert.deepEqual(snapshots.map(snapshot => snapshot.delivery.status), [
    "unavailable", "loading", "started", "completed"
  ]);
  assert.equal(controller.getSnapshot().delivery.status, "completed");
  assert.equal(dependencies.music.filter(value => value === "duck").length, 1);
  assert.equal(dependencies.music.filter(value => value === "restore").length, 1);
  unsubscribe();
  controller.dispose();
});

test("delivery identity is stale across replay, controllers, clones, and literal snapshots", () => {
  const item = createTeachSequence(QUEST_STOPS.find(stop => stop.id === "s1")).currentItem;
  const dependencies = controlledDependencies();
  const controller = createSoundSeekersAudioController({
    cuePlayer: dependencies.cuePlayer,
    music: dependencies.musicOwner,
    clock: () => 0
  });
  const request = requestFor(item, item.childAudio);
  controller.request(request);
  dependencies.complete();
  const first = controller.getSnapshot().delivery;
  controller.replay();
  assert.notStrictEqual(controller.getSnapshot().delivery, first);
  assert.equal(controller.getSnapshot().delivery.status, "started");
  dependencies.complete(4);
  const second = controller.getSnapshot().delivery;
  assert.notStrictEqual(second, first);
  assert.notDeepEqual(second, first);
  assert.notStrictEqual(structuredClone(second), second);
  assert.equal(validateCompletedAudioDeliveryReceipt(Object.freeze({ ...second }), request), false);
  assert.equal(validateCompletedAudioDeliveryReceipt(structuredClone(second), request), false);
  assert.equal(validateCompletedAudioDeliveryReceipt(second, { ...request, cueId: `${request.cueId}:stale` }), false);
  const otherDependencies = controlledDependencies();
  const otherController = createSoundSeekersAudioController({
    cuePlayer: otherDependencies.cuePlayer,
    music: otherDependencies.musicOwner,
    clock: () => 0
  });
  otherController.request(request);
  assert.equal(validateCompletedAudioDeliveryReceipt(second, request), false,
    "the same cue requested by another controller invalidates the old session");
  otherDependencies.complete(5);
  const otherReceipt = otherController.getSnapshot().delivery;
  assert.equal(validateCompletedAudioDeliveryReceipt(otherReceipt, request), true);
  otherController.cancel();
  assert.equal(validateCompletedAudioDeliveryReceipt(otherReceipt, request), false);
  assert.deepEqual(Object.keys(audioControllerModule).sort(), [
    "createSoundSeekersAudioController", "validateCompletedAudioDeliveryReceipt"
  ]);
  assert.deepEqual(Object.keys(audioAuthorityModule).sort(), [
    "createSoundSeekersAudioController", "validateCompletedAudioDeliveryReceipt"
  ]);
  assert.deepEqual(Object.keys(audioDeliveryModule).sort(), [
    "CUE_DELIVERY_STATUSES", "createAudioDelivery", "reduceAudioDelivery"
  ]);
  assert.throws(() => controller.request({ ...request, spokenText: "different" }), /canonical|request/u);
  controller.dispose();
  otherController.dispose();
});

test("no reducer or leaf can import a raw audio receipt mint or finalizer", () => {
  const engineRoot = new URL("../../src/features/soundSeekers/engine/", import.meta.url);
  const sources = fs.readdirSync(engineRoot, { recursive: true })
    .filter(name => name.endsWith(".js"))
    .map(name => [name, fs.readFileSync(new URL(name, engineRoot), "utf8")]);
  assert.deepEqual(sources
    .filter(([, source]) => source.includes("createSoundSeekersAudioController"))
    .map(([name]) => name), ["audioControllerAuthority.js"]);
  assert.deepEqual(sources
    .filter(([, source]) => source.includes("validateCompletedAudioDeliveryReceipt"))
    .map(([name]) => name).sort(), ["audioControllerAuthority.js", "teachSequence.js"]);
  for (const forbidden of ["issueAudioDeliveryReceipt", "finalizeAudioDeliveryReceipt",
    "createAudioDeliveryReceiptIssuer", "markAudioDeliveryCompleted"]) {
    assert.equal(Object.hasOwn(audioAuthorityModule, forbidden), false, forbidden);
    assert.equal(Object.hasOwn(audioControllerModule, forbidden), false, forbidden);
  }
});
