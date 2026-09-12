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

test("only the ten current Adventure activities resolve to supported components", () => {
  assert.deepEqual([...ADVENTURE_MECHANIC_IDS].sort(), [
    "compoundPicture", "letterGrid", "letterPair", "missingLetter", "pictureSearch",
    "rhymeOdd", "rhymePair", "sceneHunt", "soundChoice", "wordMemory"
  ].sort());
  assert.deepEqual(
    Object.keys(registry.ADVENTURE_MECHANICS).sort(),
    [...ADVENTURE_MECHANIC_IDS].sort()
  );
  for (const id of ADVENTURE_MECHANIC_IDS) {
    assert.equal(typeof registry.ADVENTURE_MECHANICS[id], "function", id);
  }
});

test("unknown and retired mechanics fail closed", () => {
  for (const mechanicId of ["missing-mechanic", "soundGate", "wordWindow", "wordMachine", "soundBoxes", "poemSpotlight", "letterTrace", "patternSort", "phraseFlow", "heartWord", "wordChain"]) {
    const html = renderToStaticMarkup(React.createElement(AdventureMechanicRenderer, {
      round: { mechanicId }
    }));
    assert.match(html, /role="alert"/, mechanicId);
    assert.match(html, /activity is not available/i, mechanicId);
    assert.doesNotMatch(html, /answer-grid|round\.choices/, mechanicId);
  }
});

test("the shared frame owns presentation but receives the live mechanic as children", () => {
  const html = renderToStaticMarkup(React.createElement(AdventureRoundFrame, {
    stationTitle: "Sound Match",
    roundNumber: 2,
    roundTotal: 5,
    mechanicId: "soundChoice",
    instructionText: "Listen. Tap the letter for this sound.",
    detailText: "You can tap while the instruction plays.",
    feedback: "Listen carefully.",
    feedbackTone: "ready",
    onReplayInstruction: () => {},
    onStop: () => {}
  }, React.createElement("div", { "data-test-stage": "true" }, "Mechanic")));

  assert.match(html, /data-adventure-round-frame="soundChoice"/);
  assert.match(html, /<header/);
  assert.match(html, /2 of 5/);
  assert.match(html, /aria-label="Hear instructions again"/);
  assert.match(html, /role="status"/);
  assert.match(html, /data-feedback-tone="ready"/);
  assert.match(html, /data-test-stage="true"/);
  assert.match(html, />Stop</);
});
