function cleanText(value) {
  return String(value ?? "").trim();
}

function supportLevelValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 0;
}

function tokenValue(token) {
  return cleanText(token?.normalized || token?.text).toLowerCase();
}

export function createPoemSpotlightOutcome(round = {}, selectedToken = {}, supportLevel = 0) {
  const targetToken = round.targetToken || {};
  const target = tokenValue(targetToken);
  const selected = tokenValue(selectedToken);
  // The task is now "find the word", so any occurrence of the authored word
  // is valid. Coordinates are only a later support cue, never the scoring key.
  const correct = Boolean(target) && selected === target;
  return {
    correct,
    selected,
    feedback: correct
      ? `You found “${target}”.`
      : `You chose “${selected || "that word"}”. Find “${target || "the target word"}” in the poem.`,
    evidence: {
      construct: cleanText(round.construct) || "connected_print_tracking",
      target,
      response: selected,
      supportLevel: supportLevelValue(supportLevel)
    }
  };
}

export function createPoemSpotlightState() {
  return {
    completed: false,
    coordinatesVisible: false
  };
}

export function updatePoemSpotlightState(
  state = createPoemSpotlightState(),
  round = {},
  selectedToken = {},
  supportLevel = 0
) {
  if (state.completed) return { state, outcome: null };
  const outcome = createPoemSpotlightOutcome(round, selectedToken, supportLevel);
  return {
    state: outcome.correct
      ? { ...state, completed: true }
      : { ...state, coordinatesVisible: true },
    outcome
  };
}

export function createLetterTraceState() {
  return {
    phase: "guided",
    modelReplayUsed: false,
    completed: false
  };
}

export function traceFailureDimension(result = {}) {
  if (Number(result.precision) < 0.62 || Number(result.unmatchedStrokeRatio) > 0.12) {
    return "path";
  }
  if (Number(result.directionScore) < 1) return "direction";
  if (Number(result.orderScore) < 1) return "order";
  if (Number(result.coverage) < 0.72 || Number(result.strokeCoverage) < 1) return "coverage";
  if (Number(result.endpointCoverage) < 0.78) return "start";
  return "coverage";
}

const TRACE_FEEDBACK = Object.freeze({
  path: "Stay close to the letter path.",
  direction: "Follow each stroke in the shown direction.",
  order: "Make the letter strokes in the shown order.",
  coverage: "Cover the whole letter path.",
  start: "Start and finish at the marked points."
});

function traceOutcome(round, result, phase, supportLevel) {
  const target = cleanText(round.letter || round.targetGrapheme || round.target);
  if (result.pass) {
    return {
      correct: true,
      selected: target,
      feedback: "That looks like the letter!",
      scorer: result,
      evidence: {
        construct: cleanText(round.construct) || "letter_formation_practice",
        target,
        response: target,
        supportLevel: supportLevelValue(supportLevel),
        phase
      }
    };
  }
  const errorDimension = traceFailureDimension(result);
  return {
    correct: false,
    selected: target,
    feedback: TRACE_FEEDBACK[errorDimension],
    errorDimension,
    scorer: result,
    evidence: {
      construct: cleanText(round.construct) || "letter_formation_practice",
      target,
      response: target,
      supportLevel: supportLevelValue(supportLevel),
      phase
    }
  };
}

export function updateLetterTraceState(
  state = createLetterTraceState(),
  action = {},
  round = {},
  supportLevel = 0
) {
  if (state.completed) return { state, outcome: null };
  if (action.type === "replayModel") {
    return {
      state: { ...state, modelReplayUsed: true },
      outcome: null
    };
  }
  if (action.type === "finishSupportedPractice") {
    return {
      state: { ...state, completed: true },
      outcome: createSupportedFormationOutcome(round, supportLevel)
    };
  }
  if (action.type !== "score" || !action.result) return { state, outcome: null };
  if (action.result.pass && state.phase === "guided") {
    return {
      state: { ...state, phase: "faded" },
      outcome: null
    };
  }
  const effectiveSupportLevel = Math.max(
    supportLevelValue(supportLevel),
    state.modelReplayUsed ? 1 : 0
  );
  const outcome = traceOutcome(round, action.result, state.phase, effectiveSupportLevel);
  return {
    state: outcome.correct ? { ...state, completed: true } : state,
    outcome
  };
}

export function createSupportedFormationOutcome(round = {}, supportLevel = 0) {
  const target = cleanText(round.letter || round.targetGrapheme || round.target);
  return {
    correct: true,
    selected: "model steps completed",
    feedback: `You followed the formation steps for ${target}.`,
    evidence: {
      construct: "supported_formation_practice",
      target,
      response: "model_steps_completed",
      supportLevel: Math.max(1, supportLevelValue(supportLevel))
    }
  };
}
