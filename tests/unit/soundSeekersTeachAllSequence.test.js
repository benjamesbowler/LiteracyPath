import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

import { QUEST_STOPS } from "../../src/data/questSequence.js";
import { createTeachSequence } from "../../src/features/soundSeekers/engine/teachSequence.js";

let TeachAllSequence;
let createTeachAudioRequests;
let vite;

test.before(async () => {
  vite = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  ({ TeachAllSequence } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/ui/TeachAllSequence.jsx"
  ));
  ({ createTeachAudioRequests } = await import(
    "../../src/features/soundSeekers/runtime/teachAllAudio.js"
  ));
});

test.after(async () => vite?.close());

const binding = Object.freeze({
  scopeKey: "learner-1",
  missionId: "mission:1:s7:0:7",
  phaseId: "s7-teach",
  attemptId: "mission:1:s7:0:7:s7-teach:attempt:0"
});

function audioDouble() {
  return Object.freeze({
    request() {},
    invalidate() {},
    subscribe() { return () => {}; },
    getSnapshot() { return Object.freeze({ request: null, delivery: null }); }
  });
}

test("teach-all renders the complete canonical teaching item without reconstructing it", () => {
  const stop = QUEST_STOPS.find(item => item.id === "s7");
  const item = createTeachSequence(stop).currentItem;
  assert.equal(Reflect.ownKeys(item).length, 19);
  const html = renderToStaticMarkup(React.createElement(TeachAllSequence, {
    item,
    binding,
    audioController: audioDouble(),
    onComplete() {}
  }));
  for (const value of [
    item.childText,
    item.childLabel,
    item.graphemeDisplay,
    item.mouthCue,
    item.morphologyCue,
    item.anchorWord,
    item.workedExample
  ]) assert.ok(html.includes(value), value);
  assert.match(html, /data-scored="false"/u);
  assert.match(html, /Hear the whole lesson/u);
  assert.match(html, /I heard every part/u);
  assert.match(html, /disabled=""/u);
});

test("teach-all requests every required canonical cue once in reducer order", () => {
  const stop = QUEST_STOPS.find(item => item.id === "s7");
  for (const item of createTeachSequence(stop).items) {
    const requests = createTeachAudioRequests(item);
    const expectedKeys = [...new Set([
      item.childAudio,
      item.targetAudio,
      ...item.targetAudioSequence,
      ...item.targetAudioAlternates.map(alternate => alternate.targetAudio)
    ].filter(Boolean))];
    assert.deepEqual(requests.map(request => request.audioKey), expectedKeys);
    requests.forEach((request, ordinal) => assert.deepEqual(request, {
      cueId: `teach:${item.stopId}:${item.teachIndex}:${item.targetId}:${ordinal}`,
      audioKey: expectedKeys[ordinal],
      visibleText: item.childText,
      spokenText: item.childText,
      kind: "teach",
      requiresAudio: true
    }));
  }
});
