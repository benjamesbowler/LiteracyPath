import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { QUEST_CHAPTERS } from "../../src/data/questChapters.js";
import { QUEST_STOPS } from "../../src/data/questSequence.js";
import { CONNECTED_TEXT_RECORDS } from "../../src/features/soundSeekers/content/connectedTextRecords.js";
import { SOUND_SEEKERS_INSTRUCTIONS } from "../../src/features/soundSeekers/content/instructionContracts.js";
import { MEANING_SUPPORT_RECORDS } from "../../src/features/soundSeekers/content/meaningSupportRecords.js";
import { createTeachSequence } from "../../src/features/soundSeekers/engine/teachSequence.js";
import {
  consumeCompletedAudioDeliveryReceipt,
  createSoundSeekersAudioController,
  createSoundSeekersCorrectionAudioRequest,
  validateCompletedAudioDeliveryReceipt
} from "../../src/features/soundSeekers/runtime/soundSeekersAudioController.js";
import * as audioControllerModule from "../../src/features/soundSeekers/runtime/soundSeekersAudioController.js";
import * as audioAuthorityModule from "../../src/features/soundSeekers/engine/audioControllerAuthority.js";
import * as audioDeliveryModule from "../../src/features/soundSeekers/engine/audioDelivery.js";
import { playCueAudio, stopCueAudio } from "../../src/utils/audio/cuePlayer.js";
import { questChapterMaterialSfxEntry } from "../../src/utils/questActionAudio.js";

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

function installProductionAudioDouble() {
  const previousAudio = globalThis.Audio;
  const instances = [];
  class ProductionAudioDouble {
    constructor() {
      this.listeners = new Map();
      this.currentTime = 0;
      this.volume = 1;
      this.src = "";
      instances.push(this);
    }

    addEventListener(type, listener) {
      const listeners = this.listeners.get(type) || [];
      listeners.push(listener);
      this.listeners.set(type, listeners);
    }

    removeEventListener(type, listener) {
      this.listeners.set(type, (this.listeners.get(type) || [])
        .filter(candidate => candidate !== listener));
    }

    load() {}
    pause() {}
    play() {
      const audio = this;
      return {
        catch() { return this; },
        then(onStarted) {
          onStarted();
          for (const listener of [...(audio.listeners.get("ended") || [])]) listener();
          return { catch() {} };
        }
      };
    }
  }
  globalThis.Audio = ProductionAudioDouble;
  return {
    instances,
    restore() {
      if (previousAudio === undefined) delete globalThis.Audio;
      else globalThis.Audio = previousAudio;
    }
  };
}

test("an injected player reports lifecycle but cannot mint teach authority", () => {
  const item = createTeachSequence(QUEST_STOPS.find(stop => stop.id === "s1")).currentItem;
  const audioKey = item.childAudio;
  const dependencies = controlledDependencies();
  const controller = createSoundSeekersAudioController({
    cuePlayer: dependencies.cuePlayer,
    clock: () => 0
  });
  assert.deepEqual(Object.keys(controller).sort(), [
    "cancel", "dispose", "getSnapshot", "invalidate", "replay", "request", "subscribe"
  ]);
  const snapshots = [];
  const unsubscribe = controller.subscribe(snapshot => snapshots.push(snapshot));
  controller.request(requestFor(item, audioKey));
  dependencies.complete();
  assert.deepEqual(snapshots.map(snapshot => snapshot.delivery.status), [
    "unavailable", "loading", "started", "completed"
  ]);
  assert.equal(controller.getSnapshot().delivery.status, "completed");
  assert.equal(validateCompletedAudioDeliveryReceipt(
    controller.getSnapshot().delivery,
    requestFor(item, audioKey)
  ), false);
  assert.deepEqual(dependencies.music, []);
  unsubscribe();
  controller.dispose();
});

test("only the production-owned cue player can issue an exact completed teach delivery", () => {
  const item = createTeachSequence(QUEST_STOPS.find(stop => stop.id === "s1")).currentItem;
  const audio = installProductionAudioDouble();
  const controller = createSoundSeekersAudioController({ clock: () => 0 });
  const request = requestFor(item, item.childAudio);
  try {
    controller.request(request);
    const first = controller.getSnapshot().delivery;
    assert.equal(first.status, "completed");
    assert.equal(validateCompletedAudioDeliveryReceipt(first, request), true);
    assert.equal(audio.instances[0].src, "/audio/quest-v2/instructions/single-sound-teach.mp3");
    controller.replay();
    const second = controller.getSnapshot().delivery;
    assert.notStrictEqual(second, first);
    assert.equal(second.status, "completed");
    assert.equal(validateCompletedAudioDeliveryReceipt(first, request), false);
    assert.equal(validateCompletedAudioDeliveryReceipt(second, request), true);
    assert.equal(validateCompletedAudioDeliveryReceipt(Object.freeze({ ...second }), request), false);
    assert.equal(validateCompletedAudioDeliveryReceipt(structuredClone(second), request), false);
    assert.equal(validateCompletedAudioDeliveryReceipt(second, {
      ...request, cueId: `${request.cueId}:stale`
    }), false);
  } finally {
    controller.dispose();
    audio.restore();
  }
});

test("copied production methods cannot be mutated into a receipt mint", () => {
  const item = createTeachSequence(QUEST_STOPS.find(stop => stop.id === "s1")).currentItem;
  const request = requestFor(item, item.childAudio);
  const copiedPlayer = { playCueAudio, stopCueAudio };
  const controller = createSoundSeekersAudioController({ cuePlayer: copiedPlayer, clock: () => 0 });
  copiedPlayer.playCueAudio = (_path, options) => {
    options.onDelivery({ id: options.cueId, session: 1, type: "loading", at: 1 });
    options.onDelivery({ id: options.cueId, session: 1, type: "started", at: 2 });
    options.onDelivery({ id: options.cueId, session: 1, type: "completed", at: 3 });
  };
  copiedPlayer.stopCueAudio = () => {};
  controller.request(request);
  assert.equal(controller.getSnapshot().delivery.status, "completed");
  assert.equal(validateCompletedAudioDeliveryReceipt(
    controller.getSnapshot().delivery,
    request
  ), false);
  controller.dispose();
});

test("a completed listener cannot clear the replacement request it starts", () => {
  const item = createTeachSequence(QUEST_STOPS.find(stop => stop.id === "s1")).currentItem;
  const dependencies = controlledDependencies();
  const controller = createSoundSeekersAudioController({
    cuePlayer: dependencies.cuePlayer,
    clock: () => 0
  });
  const first = requestFor(item, item.childAudio);
  const second = requestFor(item, item.targetAudio, 1);
  let replaced = false;
  const unsubscribe = controller.subscribe(snapshot => {
    if (!replaced && snapshot.request?.cueId === first.cueId
      && snapshot.delivery?.status === "completed") {
      replaced = true;
      controller.request(second);
    }
  });
  controller.request(first);
  dependencies.complete();
  assert.equal(controller.getSnapshot().request.cueId, second.cueId);
  assert.equal(controller.getSnapshot().delivery.status, "started");
  dependencies.complete();
  assert.equal(controller.getSnapshot().delivery.status, "completed");
  unsubscribe();
  controller.dispose();
});

test("an initial snapshot listener cannot let a superseded request start", () => {
  const item = createTeachSequence(QUEST_STOPS.find(stop => stop.id === "s1")).currentItem;
  const dependencies = controlledDependencies();
  const controller = createSoundSeekersAudioController({
    cuePlayer: dependencies.cuePlayer,
    clock: () => 0
  });
  const first = requestFor(item, item.childAudio);
  const second = requestFor(item, item.targetAudio, 1);
  let replaced = false;
  const unsubscribe = controller.subscribe(snapshot => {
    if (!replaced && snapshot.request?.cueId === first.cueId
      && snapshot.delivery?.status === "unavailable") {
      replaced = true;
      controller.request(second);
    }
  });
  controller.request(first);
  assert.equal(controller.getSnapshot().request.cueId, second.cueId);
  assert.equal(controller.getSnapshot().delivery.status, "started");
  dependencies.complete();
  assert.equal(controller.getSnapshot().delivery.status, "completed");
  unsubscribe();
  controller.dispose();
});

test("a cross-controller reentrant request keeps the exact current scope owner", () => {
  const item = createTeachSequence(QUEST_STOPS.find(stop => stop.id === "s1")).currentItem;
  const request = requestFor(item, item.childAudio);
  const binding = {
    scopeKey: "reentrant-scope-owner",
    missionId: "mission",
    phaseId: "phase",
    attemptId: "attempt"
  };
  const firstDependencies = controlledDependencies();
  const secondDependencies = controlledDependencies();
  const first = createSoundSeekersAudioController({
    cuePlayer: firstDependencies.cuePlayer,
    scopeKey: binding.scopeKey,
    clock: () => 0
  });
  const second = createSoundSeekersAudioController({
    cuePlayer: secondDependencies.cuePlayer,
    scopeKey: binding.scopeKey,
    clock: () => 0
  });
  let replaced = false;
  const unsubscribe = second.subscribe(snapshot => {
    if (!replaced && snapshot.delivery?.status === "unavailable") {
      replaced = true;
      first.request(request, binding);
    }
  });
  second.request(request, binding);
  assert.equal(first.getSnapshot().delivery.status, "started");
  assert.equal(second.getSnapshot().delivery.status, "unavailable");
  unsubscribe();
  first.dispose();
  second.dispose();
});

test("dispose completes even when an interrupted-delivery listener is hostile", () => {
  const item = createTeachSequence(QUEST_STOPS.find(stop => stop.id === "s1")).currentItem;
  const dependencies = controlledDependencies();
  const controller = createSoundSeekersAudioController({
    cuePlayer: dependencies.cuePlayer,
    clock: () => 0
  });
  controller.request(requestFor(item, item.childAudio));
  controller.subscribe(snapshot => {
    if (snapshot.delivery?.status === "interrupted") throw new Error("hostile listener");
  });
  assert.doesNotThrow(() => controller.dispose());
  assert.throws(() => controller.request(requestFor(item, item.childAudio)), /disposed/u);
});

test("scored receipts are exact-bound, current, and single-use", () => {
  const item = createTeachSequence(QUEST_STOPS.find(stop => stop.id === "s1")).currentItem;
  const request = requestFor(item, item.childAudio);
  const binding = {
    scopeKey: "learner-a",
    missionId: "mission-a",
    phaseId: "teach-a",
    attemptId: "attempt-0"
  };
  const audio = installProductionAudioDouble();
  const controller = createSoundSeekersAudioController({ scopeKey: binding.scopeKey, clock: () => 0 });
  try {
    controller.request(request, binding);
    const delivery = controller.getSnapshot().delivery;
    assert.equal(validateCompletedAudioDeliveryReceipt(delivery, request), false);
    assert.equal(validateCompletedAudioDeliveryReceipt(delivery, request, binding), true);
    for (const key of ["scopeKey", "missionId", "phaseId", "attemptId"]) {
      assert.equal(validateCompletedAudioDeliveryReceipt(delivery, request, {
        ...binding,
        [key]: `${binding[key]}:stale`
      }), false, key);
    }
    assert.equal(consumeCompletedAudioDeliveryReceipt(delivery, request, binding), true);
    assert.equal(consumeCompletedAudioDeliveryReceipt(delivery, request, binding), false);
    assert.equal(validateCompletedAudioDeliveryReceipt(delivery, request, binding), false);
  } finally {
    controller.dispose();
    audio.restore();
  }
});

test("scope ownership, binding changes, invalidation, cancel, and dispose revoke receipts", () => {
  const item = createTeachSequence(QUEST_STOPS.find(stop => stop.id === "s1")).currentItem;
  const request = requestFor(item, item.childAudio);
  const audio = installProductionAudioDouble();
  const first = createSoundSeekersAudioController({ scopeKey: "same", clock: () => 0 });
  const second = createSoundSeekersAudioController({ scopeKey: "same", clock: () => 0 });
  const other = createSoundSeekersAudioController({ scopeKey: "other", clock: () => 0 });
  const bound = scopeKey => ({
    scopeKey,
    missionId: "mission",
    phaseId: "phase",
    attemptId: "attempt-0"
  });
  try {
    first.request(request, bound("same"));
    const superseded = first.getSnapshot().delivery;
    other.request(request, bound("other"));
    const independent = other.getSnapshot().delivery;
    assert.equal(validateCompletedAudioDeliveryReceipt(superseded, request, bound("same")), true);
    assert.equal(validateCompletedAudioDeliveryReceipt(independent, request, bound("other")), true);
    second.request(request, bound("same"));
    assert.equal(validateCompletedAudioDeliveryReceipt(superseded, request, bound("same")), false);
    const changed = second.getSnapshot().delivery;
    second.request(request, { ...bound("same"), phaseId: "next-phase" });
    assert.equal(validateCompletedAudioDeliveryReceipt(changed, request, bound("same")), false);
    const invalidated = second.getSnapshot().delivery;
    second.invalidate({ ...bound("same"), phaseId: "next-phase" });
    assert.equal(validateCompletedAudioDeliveryReceipt(
      invalidated, request, { ...bound("same"), phaseId: "next-phase" }
    ), false);
    second.request(request, bound("same"));
    const cancelled = second.getSnapshot().delivery;
    second.cancel();
    assert.equal(validateCompletedAudioDeliveryReceipt(cancelled, request, bound("same")), false);
    other.dispose();
    assert.equal(validateCompletedAudioDeliveryReceipt(independent, request, bound("other")), false);
  } finally {
    first.dispose();
    second.dispose();
    other.dispose();
    audio.restore();
  }
});

test("accessor and Proxy players cannot acquire production authority", () => {
  const accessorPlayer = {};
  Object.defineProperties(accessorPlayer, {
    playCueAudio: { enumerable: true, get: () => playCueAudio },
    stopCueAudio: { enumerable: true, get: () => stopCueAudio }
  });
  assert.throws(() => createSoundSeekersAudioController({ cuePlayer: accessorPlayer }),
    /canonical playback dependencies/u);
  const hostile = new Proxy({}, {
    getPrototypeOf() { throw new Error("trap"); }
  });
  assert.throws(() => createSoundSeekersAudioController({ cuePlayer: hostile }),
    /canonical playback dependencies/u);
});

test("each correction rung has one exact visible, spoken, and recorded source contract", () => {
  assert.deepEqual(
    ["retry", "narrow", "teach"].map(mode => createSoundSeekersCorrectionAudioRequest(mode)),
    [
      {
        cueId: "correction:retry",
        audioKey: "/audio/production/en-US/instruction/try-again-35cc5d8011.mp3",
        visibleText: "Try again",
        spokenText: "Try again",
        kind: "correction",
        requiresAudio: true
      },
      {
        cueId: "correction:narrow",
        audioKey: "/audio/production/en-US/instruction/listen-carefully-dc6aad4c1c.mp3",
        visibleText: "Listen carefully",
        spokenText: "Listen carefully",
        kind: "correction",
        requiresAudio: true
      },
      {
        cueId: "correction:teach",
        audioKey: "/audio/production/en-US/supplemental/watch-me-first-bd61e23b42.mp3",
        visibleText: "Watch me first",
        spokenText: "Watch me first",
        kind: "correction",
        requiresAudio: true
      }
    ]
  );
  assert.throws(() => createSoundSeekersCorrectionAudioRequest("generic"), /canonical/u);
});

test("all 103 authored teaching presentations resolve every required audio key", () => {
  const items = QUEST_STOPS.flatMap(stop => createTeachSequence(stop).items);
  assert.equal(items.length, 103);
  const dependencies = controlledDependencies();
  const paths = [];
  const controller = createSoundSeekersAudioController({
    cuePlayer: {
      playCueAudio(path, options) {
        paths.push(path);
        dependencies.cuePlayer.playCueAudio(path, options);
      },
      stopCueAudio: dependencies.cuePlayer.stopCueAudio
    },
    clock: () => 0
  });
  let expectedCount = 0;
  for (const item of items) {
    const required = [...new Set([
      item.childAudio,
      item.targetAudio,
      ...item.targetAudioSequence,
      ...item.targetAudioAlternates.map(alternate => alternate.targetAudio)
    ].filter(Boolean))];
    required.forEach((audioKey, ordinal) => {
      controller.request(requestFor(item, audioKey, ordinal));
      dependencies.complete();
      assert.equal(controller.getSnapshot().delivery.status, "completed");
      expectedCount += 1;
    });
  }
  assert.equal(paths.length, expectedCount);
  assert.ok(paths.every(path => path.startsWith("/audio/")));
  controller.dispose();
});

test("every authored instruction, scene, meaning, correction, and material resolves checked-in audio", () => {
  const requests = [
    ...Object.values(SOUND_SEEKERS_INSTRUCTIONS).map(contract => ({
      cueId: `instruction:${contract.instructionId}`,
      audioKey: contract.childAudio,
      visibleText: contract.childText,
      spokenText: contract.childText,
      kind: "instruction",
      requiresAudio: true
    })),
    ...CONNECTED_TEXT_RECORDS.flatMap(scene => [
      {
        cueId: `${scene.id}:text`,
        audioKey: scene.textAudioKey,
        visibleText: scene.text,
        spokenText: scene.text,
        kind: "scene_text",
        requiresAudio: true
      },
      {
        cueId: `${scene.id}:prompt`,
        audioKey: scene.prompt.audioKey,
        visibleText: scene.prompt.text,
        spokenText: scene.prompt.text,
        kind: "scene_prompt",
        requiresAudio: true
      }
    ]),
    ...MEANING_SUPPORT_RECORDS.map(meaning => {
      const text = `${meaning.childDefinition} ${meaning.ellSupport.oralBridge} ${meaning.actionPrompt}`;
      return {
        cueId: `meaning:${meaning.wordId}`,
        audioKey: meaning.audioKey,
        visibleText: text,
        spokenText: text,
        kind: "meaning_support",
        requiresAudio: true
      };
    }),
    ...["retry", "narrow", "teach"].map(createSoundSeekersCorrectionAudioRequest),
    ...QUEST_CHAPTERS.map(chapter => ({
      cueId: `material:${chapter.id}`,
      audioKey: questChapterMaterialSfxEntry(chapter.id).src,
      visibleText: `The ${chapter.title} repair settles into place.`,
      spokenText: `The ${chapter.title} repair settles into place.`,
      kind: "material_effect",
      requiresAudio: false
    }))
  ];
  const paths = [];
  const dependency = controlledDependencies();
  const controller = createSoundSeekersAudioController({
    cuePlayer: {
      playCueAudio(path, options) {
        paths.push(path);
        dependency.cuePlayer.playCueAudio(path, options);
      },
      stopCueAudio: dependency.cuePlayer.stopCueAudio
    },
    clock: () => 10
  });
  for (const request of requests) {
    controller.request(request);
    dependency.complete();
  }
  assert.equal(paths.length, requests.length);
  for (const path of paths) {
    assert.equal(fs.existsSync(new URL(`../../public${path}`, import.meta.url)), true, path);
  }
  for (const request of requests) {
    assert.throws(() => controller.request({ ...request, spokenText: `${request.spokenText} drift` }),
      /canonical|request|source/u);
  }
  controller.dispose();
});

test("cancel, replacement, mute, and failure never become completed required audio", () => {
  const item = createTeachSequence(QUEST_STOPS.find(stop => stop.id === "s1")).currentItem;
  const request = requestFor(item, item.childAudio);
  const dependencies = controlledDependencies();
  const controller = createSoundSeekersAudioController({
    cuePlayer: dependencies.cuePlayer,
    clock: () => 42
  });
  controller.request(request);
  const interrupted = controller.cancel();
  assert.equal(interrupted.delivery.status, "interrupted");
  assert.equal(validateCompletedAudioDeliveryReceipt(interrupted.delivery, request), false);
  controller.request(request);
  controller.request(request);
  assert.equal(dependencies.stops.length >= 2, true);
  controller.dispose();

  const muted = createSoundSeekersAudioController({ enabled: false, clock: () => 0 });
  assert.equal(muted.request(request).delivery.status, "unavailable");
  muted.dispose();
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
  assert.deepEqual(Object.keys(audioControllerModule).sort(), [
    "consumeCompletedAudioDeliveryReceipt", "createSoundSeekersAudioController",
    "createSoundSeekersCorrectionAudioRequest", "validateCompletedAudioDeliveryReceipt"
  ]);
  assert.deepEqual(Object.keys(audioAuthorityModule).sort(), [
    "consumeCompletedAudioDeliveryReceipt", "createSoundSeekersAudioController",
    "createSoundSeekersCorrectionAudioRequest", "validateCompletedAudioDeliveryReceipt"
  ]);
  assert.deepEqual(Object.keys(audioDeliveryModule).sort(), [
    "CUE_DELIVERY_STATUSES", "createAudioDelivery", "reduceAudioDelivery"
  ]);
  const hookSource = fs.readFileSync(new URL(
    "../../src/features/soundSeekers/runtime/useSoundSeekersAudioController.js",
    import.meta.url
  ), "utf8");
  assert.match(hookSource,
    /createSoundSeekersAudioController\(\{ enabled, scopeKey: progressScopeKey \}\)/u);
  assert.match(hookSource, /controller\.dispose\(\)/u);
  assert.doesNotMatch(hookSource, /cuePlayer|playCueAudio|stopCueAudio|music/u);
});
