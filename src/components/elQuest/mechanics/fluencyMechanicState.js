function unchanged(state) {
  return { state, outcome: null };
}

function outcome(round, correct, selected, feedback, supportLevel, target, response, extraEvidence = {}) {
  return {
    correct,
    selected,
    feedback,
    evidence: {
      construct: round.construct,
      target,
      response,
      supportLevel,
      ...extraEvidence
    }
  };
}

export function createPatternSortState() {
  return {
    stage: "sort",
    activeIndex: 0,
    tileSelected: false,
    placements: [],
    feedback: "Pick up the word tile, then choose its pattern bin."
  };
}

export function selectPatternTile(state, round) {
  if (state.stage !== "sort" || state.activeIndex >= round.items.length) return unchanged(state);
  return {
    state: {
      ...state,
      tileSelected: true,
      feedback: "Now put " + round.items[state.activeIndex].word + " in a labelled bin."
    },
    outcome: null
  };
}

export function placePatternTile(state, round, binId, supportLevel = 0) {
  if (
    state.stage !== "sort"
    || !state.tileSelected
    || state.activeIndex >= round.items.length
  ) return unchanged(state);

  const item = round.items[state.activeIndex];
  const expectedBinId = item.fits ? "fits" : "not";
  if (binId !== expectedBinId) {
    const selectedBin = round.bins.find(bin => bin.id === binId);
    const feedback = item.word + " does not belong in " + (selectedBin?.label || "that bin") + ". Check the pattern and try again.";
    return {
      state: { ...state, feedback },
      outcome: outcome(
        round,
        false,
        [item.word, binId],
        feedback,
        supportLevel,
        round.patternLabel,
        [item.word, binId]
      )
    };
  }

  const placements = [...state.placements, { word: item.word, binId }];
  const activeIndex = state.activeIndex + 1;
  const finishedSort = activeIndex === round.items.length;
  return {
    state: {
      ...state,
      stage: finishedSort ? "transfer" : "sort",
      activeIndex,
      tileSelected: false,
      placements,
      feedback: finishedSort
        ? "Every tile is sorted. Choose the new word that follows the pattern."
        : item.word + " is sorted. Pick up the next word."
    },
    outcome: null
  };
}

export function choosePatternTransfer(state, round, binId, supportLevel = 0) {
  if (state.stage !== "transfer") return unchanged(state);
  const correct = binId === "fits";
  const selectedBin = round.bins.find(bin => bin.id === binId);
  const response = [round.transferWord, binId];
  const feedback = correct
    ? round.transferWord + " follows the " + round.patternLabel + " pattern."
    : round.transferWord + " does not belong in " + (selectedBin?.label || "that bin") + ". Look across the filled bins and try again.";
  return {
    state: {
      ...state,
      stage: correct ? "complete" : "transfer",
      feedback
    },
    outcome: outcome(
      round,
      correct,
      response,
      feedback,
      supportLevel,
      round.patternLabel,
      response
    )
  };
}

export function createWordChainState(round) {
  return {
    stage: "position",
    selectedIndex: null,
    currentGraphemes: [...round.fromGraphemes],
    chain: [round.fromWord],
    feedback: "Listen, then choose the one grapheme position that changes."
  };
}

export function selectChainPosition(state, round, index, supportLevel = 0) {
  if (state.stage !== "position") return unchanged(state);
  const correct = index === round.changeIndex;
  if (!correct) {
    const feedback = "That grapheme stays the same. Compare the sounds and choose the changing position.";
    return {
      state: { ...state, feedback },
      outcome: outcome(
        round,
        false,
        index,
        feedback,
        supportLevel,
        round.fromWord,
        index
      )
    };
  }
  return {
    state: {
      ...state,
      stage: "replacement",
      selectedIndex: index,
      feedback: "You found the changing position. Choose its replacement grapheme."
    },
    outcome: null
  };
}

export function replaceChainGrapheme(state, round, grapheme, supportLevel = 0) {
  if (state.stage !== "replacement") return unchanged(state);
  const expected = round.toGraphemes[round.changeIndex];
  const correct = grapheme === expected;
  if (!correct) {
    const feedback = grapheme + " does not make the word you heard. The chain stays in place; try another grapheme.";
    return {
      state: { ...state, feedback },
      outcome: outcome(
        round,
        false,
        [state.selectedIndex, grapheme],
        feedback,
        supportLevel,
        round.fromWord,
        grapheme
      )
    };
  }

  const currentGraphemes = [...state.currentGraphemes];
  currentGraphemes[state.selectedIndex] = grapheme;
  const feedback = round.fromWord + " changes to " + round.toWord + ". The chain grows!";
  return {
    state: {
      ...state,
      stage: "complete",
      currentGraphemes,
      chain: [...state.chain, round.toWord],
      feedback
    },
    outcome: outcome(
      round,
      true,
      [state.selectedIndex, grapheme],
      feedback,
      supportLevel,
      round.toWord,
      currentGraphemes
    )
  };
}

export function createPhraseFlowState(round) {
  const revealedCount = Math.min(1, round.phraseChunks.length);
  return {
    stage: revealedCount === round.phraseChunks.length ? "boundary" : "reveal",
    revealedCount,
    chosenBoundary: null,
    modelCompleted: false,
    feedback: "Reveal each phrase chunk when you are ready."
  };
}

export function revealNextPhraseChunk(state, round) {
  if (state.stage !== "reveal") return unchanged(state);
  const revealedCount = Math.min(round.phraseChunks.length, state.revealedCount + 1);
  return {
    state: {
      ...state,
      stage: revealedCount === round.phraseChunks.length ? "boundary" : "reveal",
      revealedCount,
      feedback: revealedCount === round.phraseChunks.length
        ? "The whole phrase is ready. Choose its natural pause."
        : "Follow the trail, then reveal the next chunk."
    },
    outcome: null
  };
}

export function choosePhraseBoundary(state, round, boundary, supportLevel = 0) {
  if (state.stage !== "boundary") return unchanged(state);
  const correct = boundary === round.correctBoundary;
  if (!correct) {
    const feedback = "That pause breaks the phrase in an awkward place. Read the meaning and try another boundary.";
    return {
      state: { ...state, chosenBoundary: boundary, feedback },
      outcome: outcome(
        round,
        false,
        boundary,
        feedback,
        supportLevel,
        round.phraseChunks.join(" "),
        boundary
      )
    };
  }
  return {
    state: {
      ...state,
      stage: "model",
      chosenBoundary: boundary,
      feedback: "That boundary keeps the meaningful phrase together. Follow the model next."
    },
    outcome: null
  };
}

export function completePhraseModel(state) {
  if (state.stage !== "model") return unchanged(state);
  return {
    state: {
      ...state,
      stage: "echo",
      modelCompleted: true,
      feedback: "Now echo-read the phrase in your own voice."
    },
    outcome: null
  };
}

export function completePhraseEcho(state, round, supportLevel = 0) {
  if (state.stage !== "echo" || !state.modelCompleted) return unchanged(state);
  const target = round.phraseChunks.join(" ");
  const feedback = "Phrase practice complete. The model and echo support are recorded.";
  return {
    state: { ...state, stage: "complete", feedback },
    outcome: outcome(
      round,
      true,
      "model_echo_completed",
      feedback,
      supportLevel,
      target,
      "model_echo_completed",
      {
        supportUsed: ["model", "echo"],
        measure: "support_only"
      }
    )
  };
}

export function createHeartWordState() {
  return {
    phase: "study",
    modelVisible: true,
    attempt: [],
    differingIndex: null,
    revealedDifference: null,
    feedback: "Study every grapheme in the heart word."
  };
}

export function hideHeartWord(state) {
  if (state.phase !== "study") return unchanged(state);
  return {
    state: {
      ...state,
      phase: "spell",
      modelVisible: false,
      attempt: [],
      feedback: "The model is hidden. Build the word from memory."
    },
    outcome: null
  };
}

export function addHeartGrapheme(state, round, grapheme) {
  if (state.phase !== "spell" || state.attempt.length >= round.graphemes.length) {
    return unchanged(state);
  }
  return {
    state: {
      ...state,
      attempt: [...state.attempt, grapheme],
      feedback: "Keep spelling from memory."
    },
    outcome: null
  };
}

export function removeHeartGrapheme(state) {
  if (state.phase !== "spell" || state.attempt.length === 0) return unchanged(state);
  return {
    state: {
      ...state,
      attempt: state.attempt.slice(0, -1),
      feedback: "The last grapheme is back in the bank."
    },
    outcome: null
  };
}

export function revealHeartAttempt(state, round, supportLevel = 0) {
  if (state.phase !== "spell" || state.attempt.length !== round.graphemes.length) {
    return unchanged(state);
  }
  const differingIndex = state.attempt.findIndex(
    (grapheme, index) => grapheme !== round.graphemes[index]
  );
  if (differingIndex === -1) {
    const response = state.attempt.join("");
    const feedback = response + " is stored in your heart-word studio.";
    return {
      state: { ...state, phase: "complete", feedback },
      outcome: outcome(
        round,
        true,
        [...state.attempt],
        feedback,
        supportLevel,
        round.word,
        response
      )
    };
  }

  const attempted = [...state.attempt];
  const revealedDifference = {
    expected: round.graphemes[differingIndex],
    actual: attempted[differingIndex]
  };
  const feedback = "The first change is at grapheme " + (differingIndex + 1) + ". Keep the correct beginning and repair this spot.";
  return {
    state: {
      ...state,
      phase: "repair",
      modelVisible: false,
      attempt: round.graphemes.slice(0, differingIndex),
      differingIndex,
      revealedDifference,
      feedback
    },
    outcome: outcome(
      round,
      false,
      attempted,
      feedback,
      supportLevel,
      round.word,
      attempted.join(""),
      { differingIndex }
    )
  };
}

export function repairHeartWord(state, round, grapheme, supportLevel = 0) {
  if (state.phase !== "repair") return unchanged(state);
  const expected = round.graphemes[state.differingIndex];
  if (grapheme !== expected) {
    const feedback = grapheme + " does not repair this position. Use the revealed grapheme and try again.";
    return {
      state: { ...state, feedback },
      outcome: outcome(
        round,
        false,
        grapheme,
        feedback,
        supportLevel,
        round.word,
        grapheme,
        { differingIndex: state.differingIndex }
      )
    };
  }

  const attempt = [...state.attempt, grapheme];
  const complete = attempt.length === round.graphemes.length;
  const feedback = complete
    ? round.word + " is repaired and stored."
    : "That position is repaired. Finish the word from memory.";
  return {
    state: {
      ...state,
      phase: complete ? "complete" : "spell",
      attempt,
      differingIndex: null,
      revealedDifference: null,
      feedback
    },
    outcome: complete
      ? outcome(
          round,
          true,
          attempt,
          feedback,
          supportLevel,
          round.word,
          attempt.join(""),
          { repaired: true }
        )
      : null
  };
}
