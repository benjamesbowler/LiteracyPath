import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  anticipatedJourneyState,
  finishJourneyLayer,
  markJourneyLayerReady,
  prepareJourneyLayer
} from "../../src/utils/questJourney.js";

const active = () => [{ stopId: "s8", status: "active", ready: true, anticipatedFrom: null }];

test("the next scene can become ready before the child crosses the gate", () => {
  const prepared = prepareJourneyLayer(active(), "s8", "s9");
  const ready = markJourneyLayerReady(prepared, "s9");
  assert.equal(ready.find(layer => layer.stopId === "s8").status, "active");
  assert.equal(ready.find(layer => layer.stopId === "s9").status, "preloading");

  const crossed = finishJourneyLayer(ready, "s8", "s9");
  assert.equal(crossed.find(layer => layer.stopId === "s8").status, "departing");
  assert.equal(crossed.find(layer => layer.stopId === "s9").status, "arriving");
});

test("the outgoing canvas waits when the child crosses before the next scene is ready", () => {
  const prepared = prepareJourneyLayer(active(), "s8", "s9");
  const crossed = finishJourneyLayer(prepared, "s8", "s9");
  assert.equal(crossed.find(layer => layer.stopId === "s8").status, "holding");
  assert.equal(crossed.find(layer => layer.stopId === "s9").status, "preloading");

  const ready = markJourneyLayerReady(crossed, "s9");
  assert.equal(ready.find(layer => layer.stopId === "s8").status, "departing");
  assert.equal(ready.find(layer => layer.stopId === "s9").status, "arriving");
});

test("preloading anticipates the completed trail without mutating real progress", () => {
  const state = { trail: { stopsDone: ["s7"], stars: {} } };
  const anticipated = anticipatedJourneyState(state, "s8");
  assert.deepEqual(state.trail.stopsDone, ["s7"]);
  assert.deepEqual(anticipated.trail.stopsDone, ["s7", "s8"]);
  assert.equal(prepareJourneyLayer(active(), "s8", "s9").length, 2);
  assert.equal(prepareJourneyLayer(active(), "s8", "s8").length, 1);
});

test("the live QuestRoot wires the tested journey handoff into world completion", () => {
  const source = fs.readFileSync(new URL("../../src/components/quest/QuestRoot.jsx", import.meta.url), "utf8");
  for (const helper of [
    "anticipatedJourneyState",
    "prepareJourneyLayer",
    "markJourneyLayerReady",
    "finishJourneyLayer"
  ]) {
    assert.match(source, new RegExp(`\\b${helper}\\(`), `${helper} must be called by the live root`);
  }
  assert.match(source, /onPrepareNext=\{interactive \? prepareNextLayer/);
  assert.match(source, /status === "arriving"/);
});
