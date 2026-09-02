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

function sameTokenOccurrence(selected, target) {
  return Number(selected?.lineIndex) === Number(target?.lineIndex)
    && Number(selected?.tokenIndex) === Number(target?.tokenIndex);
}

export function createPoemSpotlightOutcome(round = {}, selectedToken = {}, supportLevel = 0) {
  const targetToken = round.targetToken || {};
  const target = tokenValue(targetToken);
  const selected = tokenValue(selectedToken);
  const correct = Boolean(target) && sameTokenOccurrence(selectedToken, targetToken);
  const lineNumber = Number(targetToken.lineIndex) + 1;
  return {
    correct,
    selected,
    feedback: correct
      ? `You found ${target} in the poem.`
      : `You chose ${selected || "that token"}. Keep the poem in view and find ${target || "the target word"}${lineNumber > 0 ? ` in line ${lineNumber}` : ""}.`,
    evidence: {
      construct: cleanText(round.construct) || "connected_print_tracking",
      target,
      response: selected,
      supportLevel: supportLevelValue(supportLevel)
    }
  };
}

export function createCoverClueState() {
  return {
    stripSelected: false,
    titlesRevealed: false,
    titleRevealUsed: false
  };
}

function coverIdentity(cover = {}) {
  return cleanText(cover.cover || cover.id || cover.title);
}

function selectedCoverLabel(cover = {}) {
  return cleanText(cover.title || cover.character || cover.cover) || "that cover";
}

function coverClueOutcome(state, round, cover, supportLevel) {
  const targetCover = round.targetCover || round.covers?.find(candidate => candidate?.matches) || {};
  const stripText = cleanText(round.strip?.text || targetCover.title);
  const response = selectedCoverLabel(cover);
  const correct = Boolean(coverIdentity(targetCover))
    && coverIdentity(cover) === coverIdentity(targetCover);
  return {
    correct,
    selected: response,
    feedback: correct
      ? `The title strip “${stripText}” matches this cover.`
      : `You chose “${response}”. Compare it with the title strip “${stripText}” and try another cover.`,
    evidence: {
      construct: "supported_cover_title_association",
      target: stripText,
      response,
      supportLevel: Math.max(
        supportLevelValue(supportLevel),
        state.titleRevealUsed ? 1 : 0
      )
    }
  };
}

export function updateCoverClueState(
  state = createCoverClueState(),
  action = {},
  round = {},
  supportLevel = 0
) {
  switch (action.type) {
    case "selectStrip":
      return {
        state: { ...state, stripSelected: true },
        outcome: null
      };
    case "toggleTitles":
      return {
        state: {
          ...state,
          titlesRevealed: !state.titlesRevealed,
          titleRevealUsed: true
        },
        outcome: null
      };
    case "placeCover":
      if (!state.stripSelected) return { state, outcome: null };
      return {
        state,
        outcome: coverClueOutcome(state, round, action.cover, supportLevel)
      };
    default:
      return { state, outcome: null };
  }
}

export function createLetterTraceState() {
  return { phase: "guided" };
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
  if (action.type !== "score" || !action.result) return { state, outcome: null };
  if (action.result.pass && state.phase === "guided") {
    return {
      state: { ...state, phase: "faded" },
      outcome: null
    };
  }
  return {
    state,
    outcome: traceOutcome(round, action.result, state.phase, supportLevel)
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
