import assert from "node:assert/strict";
import { after, test } from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

let viteServer;

async function loadTextMechanics() {
  viteServer ||= await createServer({
    root: process.cwd(),
    logLevel: "silent",
    appType: "custom",
    server: { middlewareMode: true }
  });
  return viteServer.ssrLoadModule("/src/components/elQuest/mechanics/TextMechanics.jsx");
}

async function loadTextState() {
  await loadTextMechanics();
  return viteServer.ssrLoadModule("/src/components/elQuest/mechanics/textMechanicState.js");
}

after(async () => {
  await viteServer?.close();
});

const poemRound = {
  mechanicId: "poemSpotlight",
  construct: "connected_print_tracking",
  lines: ["Rain, rain—go away!", "Rain, come again?"],
  tokens: [
    [
      { text: "Rain,", normalized: "rain", lineIndex: 0, tokenIndex: 0 },
      { text: "rain—go", normalized: "raingo", lineIndex: 0, tokenIndex: 1 },
      { text: "away!", normalized: "away", lineIndex: 0, tokenIndex: 2 }
    ],
    [
      { text: "Rain,", normalized: "rain", lineIndex: 1, tokenIndex: 0 },
      { text: "come", normalized: "come", lineIndex: 1, tokenIndex: 1 },
      { text: "again?", normalized: "again", lineIndex: 1, tokenIndex: 2 }
    ]
  ],
  targetToken: { text: "Rain,", normalized: "rain", lineIndex: 1, tokenIndex: 0 },
  choices: ["rain", "away", "come", "decoy"]
};

test("Poem Spotlight renders native token buttons inside each original punctuated line", async () => {
  const { PoemSpotlightMechanic } = await loadTextMechanics();
  const markup = renderToStaticMarkup(React.createElement(PoemSpotlightMechanic, {
    round: poemRound,
    disabled: false,
    supportLevel: 0,
    onCommit() {},
    onRequestReplay() {},
    reducedMotion: false
  }));

  assert.match(markup, /data-mechanic-stage="poem-spotlight"/);
  assert.match(markup, /data-poem-line="0"/);
  assert.match(markup, /data-poem-line="1"/);
  assert.match(markup, /role="group" aria-label="Poem"/);
  assert.match(markup, /Line 1:/);
  assert.match(markup, /Line 2:/);
  assert.match(markup, />Rain,</);
  assert.match(markup, />rain—go</);
  assert.match(markup, />away!</);
  assert.doesNotMatch(markup, /decoy/);
  assert.equal((markup.match(/data-poem-token=/g) || []).length, 6);
  assert.equal((markup.match(/class="sbq-poem-token sbq-ghost-button"/g) || []).length, 6);
});

test("Poem Spotlight scores the exact occurrence and names a wrong selected token", async () => {
  const { createPoemSpotlightOutcome } = await loadTextState();
  const repeatedButWrongOccurrence = createPoemSpotlightOutcome(
    poemRound,
    poemRound.tokens[0][0],
    0
  );
  const exactOccurrence = createPoemSpotlightOutcome(
    poemRound,
    poemRound.tokens[1][0],
    2
  );
  const wrongWord = createPoemSpotlightOutcome(poemRound, poemRound.tokens[1][1], 1);

  assert.equal(repeatedButWrongOccurrence.correct, false);
  assert.equal(exactOccurrence.correct, true);
  assert.deepEqual(exactOccurrence.evidence, {
    construct: "connected_print_tracking",
    target: "rain",
    response: "rain",
    supportLevel: 2
  });
  assert.equal(wrongWord.selected, "come");
  assert.match(wrongWord.feedback, /come/);
  assert.match(wrongWord.feedback, /rain/);
});

test("Poem Spotlight accepts one successful completion and suppresses repeat commits", async () => {
  const {
    createPoemSpotlightState,
    updatePoemSpotlightState
  } = await loadTextState();
  let state = createPoemSpotlightState();

  const wrong = updatePoemSpotlightState(
    state,
    poemRound,
    poemRound.tokens[0][0],
    0
  );
  state = wrong.state;
  assert.equal(wrong.outcome.correct, false);

  const recovered = updatePoemSpotlightState(
    state,
    poemRound,
    poemRound.tokens[1][0],
    1
  );
  state = recovered.state;
  assert.equal(recovered.outcome.correct, true);
  assert.equal(recovered.outcome.evidence.supportLevel, 1);

  const repeated = updatePoemSpotlightState(
    state,
    poemRound,
    poemRound.tokens[1][0],
    1
  );
  assert.equal(repeated.outcome, null);
});

test("Letter Trace advances from guided to faded before committing a successful trace", async () => {
  const { createLetterTraceState, updateLetterTraceState } = await loadTextState();
  const round = {
    mechanicId: "letterTrace",
    construct: "letter_formation_practice",
    letter: "A"
  };
  const passingScore = {
    pass: true,
    coverage: 0.94,
    precision: 0.91,
    strokeCoverage: 1,
    endpointCoverage: 1,
    directionScore: 1,
    orderScore: 1,
    unmatchedStrokeRatio: 0
  };

  let transition = updateLetterTraceState(
    createLetterTraceState(),
    { type: "score", result: passingScore },
    round,
    0
  );
  assert.equal(transition.state.phase, "faded");
  assert.equal(transition.outcome, null);

  transition = updateLetterTraceState(
    transition.state,
    { type: "score", result: passingScore },
    round,
    0
  );
  assert.equal(transition.outcome.correct, true);
  assert.equal(transition.outcome.selected, "A");
  assert.equal(transition.outcome.scorer, passingScore);
  assert.equal(transition.outcome.evidence.phase, "faded");
});

test("third-miss Letter Trace exposes the native ordered model in motion and reduced-motion modes", async () => {
  const { LetterTraceMechanic } = await loadTextMechanics();
  const round = {
    mechanicId: "letterTrace",
    construct: "letter_formation_practice",
    letter: "A"
  };
  const correctionModel = {
    label: "Correct model",
    instruction: "Watch each stroke of A in order, then trace it again.",
    units: ["A"],
    mode: "native-formation",
    replayKey: "0:3"
  };
  const render = reducedMotion => renderToStaticMarkup(React.createElement(LetterTraceMechanic, {
    round,
    disabled: false,
    supportLevel: 3,
    correctionModel,
    onCommit() {},
    onRequestReplay() {},
    reducedMotion
  }));

  const animated = render(false);
  assert.match(animated, /data-correction-model="true"/);
  assert.match(animated, /data-correction-model-state="playing"/);
  assert.match(animated, /Correct stroke model/);
  assert.match(animated, /class="letter-writer/);
  assert.match(animated, /data-stroke=""/);
  assert.match(animated, /aria-label="Trace the letter A" aria-disabled="true"/);

  const staticModel = render(true);
  assert.match(staticModel, /data-correction-model-state="playing"/);
  assert.match(staticModel, /data-static-ordered-model="true"/);
  assert.match(staticModel, /data-stroke-order="1"/);
  assert.match(staticModel, /sbq-trace-direction-arrow/);
  assert.match(staticModel, /I followed the numbered model/);
});

test("replaying the trace model marks faded success as supported and completion is single-shot", async () => {
  const { createLetterTraceState, updateLetterTraceState } = await loadTextState();
  const round = {
    mechanicId: "letterTrace",
    construct: "letter_formation_practice",
    letter: "A"
  };
  const passingScore = {
    pass: true,
    coverage: 0.94,
    precision: 0.91,
    strokeCoverage: 1,
    endpointCoverage: 1,
    directionScore: 1,
    orderScore: 1,
    unmatchedStrokeRatio: 0
  };
  let state = createLetterTraceState();
  state = updateLetterTraceState(state, { type: "replayModel" }, round, 0).state;
  state = updateLetterTraceState(
    state,
    { type: "score", result: passingScore },
    round,
    0
  ).state;

  let transition = updateLetterTraceState(
    state,
    { type: "score", result: passingScore },
    round,
    0
  );
  state = transition.state;
  assert.equal(transition.outcome.correct, true);
  assert.equal(transition.outcome.evidence.supportLevel, 1);

  transition = updateLetterTraceState(
    state,
    { type: "score", result: passingScore },
    round,
    0
  );
  assert.equal(transition.outcome, null);
});

test("Letter Trace forwards every scorer diagnostic and a specific failed dimension", async () => {
  const { createLetterTraceState, updateLetterTraceState } = await loadTextState();
  const round = {
    mechanicId: "letterTrace",
    construct: "letter_formation_practice",
    letter: "A"
  };
  const directionFailure = {
    pass: false,
    coverage: 0.93,
    precision: 0.9,
    strokeCoverage: 1,
    endpointCoverage: 1,
    directionScore: 0,
    orderScore: 1,
    unmatchedStrokeRatio: 0
  };
  const transition = updateLetterTraceState(
    createLetterTraceState(),
    { type: "score", result: directionFailure },
    round,
    0
  );

  assert.equal(transition.outcome.correct, false);
  assert.equal(transition.outcome.errorDimension, "direction");
  assert.equal(transition.outcome.scorer, directionFailure);
  assert.match(transition.outcome.feedback, /direction/);
});

test("the non-drawing route records supported formation practice only", async () => {
  const { createSupportedFormationOutcome } = await loadTextState();
  const outcome = createSupportedFormationOutcome({
    mechanicId: "letterTrace",
    construct: "letter_formation_practice",
    letter: "A"
  }, 0);

  assert.equal(outcome.correct, true);
  assert.equal(outcome.selected, "model steps completed");
  assert.deepEqual(outcome.evidence, {
    construct: "supported_formation_practice",
    target: "A",
    response: "model_steps_completed",
    supportLevel: 1
  });
  assert.doesNotMatch(JSON.stringify(outcome), /handwriting|independent/i);
});

test("supported formation finish commits once even when activation repeats", async () => {
  const { createLetterTraceState, updateLetterTraceState } = await loadTextState();
  const round = {
    mechanicId: "letterTrace",
    construct: "letter_formation_practice",
    letter: "A"
  };
  let state = createLetterTraceState();
  let transition = updateLetterTraceState(
    state,
    { type: "finishSupportedPractice" },
    round,
    0
  );
  state = transition.state;
  assert.equal(transition.outcome.correct, true);
  assert.equal(transition.outcome.evidence.supportLevel, 1);

  transition = updateLetterTraceState(
    state,
    { type: "finishSupportedPractice" },
    round,
    0
  );
  assert.equal(transition.outcome, null);
});
