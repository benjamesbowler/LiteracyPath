import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

import { ADVENTURE_MECHANIC_IDS } from "../../src/components/elQuest/adventureRoundModel.js";

let registry;
let AdventureMechanicRenderer;
let AdventureRoundFrame;
let vite;

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  registry = await vite.ssrLoadModule(
    "/src/components/elQuest/mechanics/adventureMechanics.jsx"
  );
  ({ AdventureMechanicRenderer } = await vite.ssrLoadModule(
    "/src/components/elQuest/mechanics/AdventureMechanicRenderer.jsx"
  ));
  ({ AdventureRoundFrame } = await vite.ssrLoadModule(
    "/src/components/elQuest/AdventureRoundFrame.jsx"
  ));
});

test.after(async () => {
  await vite?.close();
});

test("every declared Adventure mechanic resolves to its own component", () => {
  assert.deepEqual(
    Object.keys(registry.ADVENTURE_MECHANICS).sort(),
    [...ADVENTURE_MECHANIC_IDS].sort()
  );
  for (const id of ADVENTURE_MECHANIC_IDS) {
    assert.equal(typeof registry.ADVENTURE_MECHANICS[id], "function", id);
  }
  assert.equal(new Set(Object.values(registry.ADVENTURE_MECHANICS)).size, 13);
});

test("unknown mechanics fail closed instead of rendering a generic answer grid", () => {
  const html = renderToStaticMarkup(React.createElement(AdventureMechanicRenderer, {
    round: { mechanicId: "missing-mechanic" }
  }));
  assert.match(html, /role="alert"/);
  assert.match(html, /activity is not available/i);
  assert.doesNotMatch(html, /answer-grid|round\.choices/);
});

test("the shared frame owns presentation but receives the live mechanic as children", () => {
  const html = renderToStaticMarkup(React.createElement(AdventureRoundFrame, {
    stationTitle: "Sound Gate",
    roundNumber: 2,
    roundTotal: 5,
    mechanicId: "soundGate",
    instructionText: "Hear the sound. Load its grapheme into the gate.",
    detailText: "The gate only opens for the sound you heard.",
    feedback: "Listen carefully.",
    feedbackTone: "ready",
    onReplayInstruction: () => {},
    onStop: () => {}
  }, React.createElement("div", { "data-test-stage": "true" }, "Mechanic")));

  assert.match(html, /data-adventure-round-frame="soundGate"/);
  assert.match(html, /<header/);
  assert.match(html, /2 of 5/);
  assert.match(html, /Hear what to do/);
  assert.match(html, /role="status"/);
  assert.match(html, /data-feedback-tone="ready"/);
  assert.match(html, /data-test-stage="true"/);
  assert.match(html, />Stop</);
});
