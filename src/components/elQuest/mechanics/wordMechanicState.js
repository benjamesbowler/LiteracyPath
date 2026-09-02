function clean(value) {
  return String(value ?? "").trim();
}

function support(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

function list(value) {
  return Array.isArray(value) ? value.map(clean).filter(Boolean) : [];
}

function sameGraphemes(left, right) {
  const a = list(left);
  const b = list(right);
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

function semanticEvidence(round, response, supportLevel, extra = {}) {
  return {
    construct: clean(round?.construct || round?.mechanicId),
    target: clean(round?.afterWord || round?.answer || round?.word || round?.studyWord)
      || list(round?.afterGraphemes).join(""),
    response,
    supportLevel: support(supportLevel),
    independent: support(supportLevel) === 0,
    ...extra
  };
}

export function createWordWindowState(round = {}, supportLevel = 0) {
  return {
    phase: "study",
    selected: null,
    supportLevel: support(supportLevel),
    status: clean(round.studyWord)
      ? `Study the whole word ${clean(round.studyWord)}.`
      : "Study the whole word."
  };
}

export function reduceWordWindow(state, action = {}, round = {}) {
  if (!state || action.type === "RESET") {
    return createWordWindowState(round, action.supportLevel);
  }
  switch (action.type) {
    case "CLOSE":
      if (state.phase !== "study") return state;
      return {
        ...state,
        phase: "choose",
        selected: null,
        status: "The study window is closed. Choose the whole word."
      };
    case "SELECT": {
      const value = clean(action.value);
      if (
        state.phase !== "choose"
        || !list(round.choices).includes(value)
      ) return state;
      return {
        ...state,
        phase: "committed",
        selected: value,
        status: `${value} is locked in. Reveal the study word to compare.`
      };
    }
    case "REVEAL":
      if (state.phase !== "committed") return state;
      return {
        ...state,
        phase: "revealed",
        status: `The study word is ${clean(round.studyWord || round.answer)}.`
      };
    case "REOPEN":
      if (state.phase !== "choose") return state;
      return {
        ...state,
        phase: "study",
        selected: null,
        supportLevel: state.supportLevel + 1,
        status: `The study window is open again. Study ${clean(round.studyWord)}.`
      };
    case "REQUEST_REPLAY":
      return {
        ...state,
        supportLevel: state.supportLevel + 1,
        status: "The word was replayed. This try now includes support."
      };
    default:
      return state;
  }
}

export function buildWordWindowOutcome(round = {}, state) {
  if (!state || !["committed", "revealed"].includes(state.phase) || !state.selected) return null;
  const target = clean(round.studyWord || round.answer);
  const correct = state.selected === target;
  return {
    correct,
    selected: state.selected,
    feedback: correct
      ? `You remembered the whole word ${target}.`
      : `You chose ${state.selected}. Reveal ${target} and compare the whole word.`,
    evidence: semanticEvidence(
      { ...round, studyWord: target },
      state.selected,
      state.supportLevel
    )
  };
}

function graphemeTiles(graphemes) {
  const occurrences = new Map();
  return graphemes.map(grapheme => {
    const occurrence = (occurrences.get(grapheme) || 0) + 1;
    occurrences.set(grapheme, occurrence);
    return {
      id: `grapheme-${encodeURIComponent(grapheme)}-${occurrence}`,
      grapheme
    };
  }).reverse();
}

export function createSoundBoxesState(round = {}, supportLevel = 0) {
  const graphemes = list(round.graphemes);
  return {
    slots: graphemes.map(() => null),
    tiles: graphemeTiles(graphemes),
    usedTileIds: [],
    supportLevel: support(supportLevel),
    committed: false,
    status: graphemes.length
      ? `Fill ${graphemes.length} sound boxes, then blend and check.`
      : "No graphemes are available for this word."
  };
}

export function reduceSoundBoxes(state, action = {}, round = {}) {
  if (!state || action.type === "RESET") {
    return createSoundBoxesState(round, action.supportLevel);
  }
  if (state.committed && action.type !== "RESET") return state;
  const target = list(round.graphemes);
  switch (action.type) {
    case "PLACE_TILE": {
      const tile = state.tiles.find(item => item.id === action.tileId);
      const slotIndex = state.slots.findIndex(slot => slot === null);
      if (!tile || slotIndex < 0 || state.usedTileIds.includes(tile.id)) return state;
      const expected = target[slotIndex];
      if (tile.grapheme !== expected) {
        return {
          ...state,
          supportLevel: state.supportLevel + 1,
          status: `${tile.grapheme} does not fit sound box ${slotIndex + 1}. Listen for ${expected}; your correct boxes stay in place.`
        };
      }
      const slots = [...state.slots];
      slots[slotIndex] = { tileId: tile.id, grapheme: tile.grapheme };
      return {
        ...state,
        slots,
        usedTileIds: [...state.usedTileIds, tile.id],
        status: `${tile.grapheme} is in sound box ${slotIndex + 1}.`
      };
    }
    case "REMOVE_SLOT": {
      const slotIndex = Number(action.slotIndex);
      const placed = state.slots[slotIndex];
      if (!Number.isInteger(slotIndex) || !placed) return state;
      const slots = [...state.slots];
      slots[slotIndex] = null;
      return {
        ...state,
        slots,
        usedTileIds: state.usedTileIds.filter(id => id !== placed.tileId),
        status: `${placed.grapheme} returned to the tile bank.`
      };
    }
    case "REQUEST_REPLAY":
      return {
        ...state,
        supportLevel: state.supportLevel + 1,
        status: "The word was replayed. This build now includes support."
      };
    case "CHECK":
      if (!state.slots.length || state.slots.some(slot => !slot)) {
        return {
          ...state,
          status: "Fill every sound box before blending and checking."
        };
      }
      return {
        ...state,
        committed: true,
        status: `Blend ${state.slots.map(slot => slot.grapheme).join(", ")}.`
      };
    default:
      return state;
  }
}

export function buildSoundBoxesOutcome(round = {}, state) {
  if (!state?.committed) return null;
  const response = state.slots.map(slot => clean(slot?.grapheme)).filter(Boolean);
  const target = list(round.graphemes);
  const correct = sameGraphemes(response, target);
  return {
    correct,
    selected: response,
    feedback: correct
      ? `Blend ${response.join(", ")}. You built ${clean(round.word)}.`
      : `You built ${response.join("")}. Listen again and compare each sound box with ${clean(round.word)}.`,
    evidence: semanticEvidence(round, response, state.supportLevel)
  };
}

function pieceId(action, graphemes, occurrence = 1) {
  return `machine-${action}-${graphemes.map(encodeURIComponent).join("-")}-${occurrence}`;
}

export function machinePiecesForRound(round = {}) {
  const before = list(round.beforeGraphemes);
  const after = list(round.afterGraphemes);
  if (round.operation === "substituteOnset") {
    const candidateOnsets = Array.isArray(round.choiceGraphemes)
      ? round.choiceGraphemes.map(choice => list(choice?.graphemes)[0]).filter(Boolean)
      : [before[0], after[0]].filter(Boolean);
    const uniqueOnsets = [...new Set([...candidateOnsets, after[0]].filter(Boolean))];
    return uniqueOnsets.map((grapheme, index) => ({
      id: pieceId("swap", [grapheme], index + 1),
      action: "swap",
      label: grapheme,
      graphemes: [grapheme]
    }));
  }
  if (round.operation === "removeOnset") {
    return before[0] ? [{
      id: pieceId("remove", [before[0]]),
      action: "remove",
      label: before[0],
      graphemes: [before[0]]
    }] : [];
  }
  if (round.operation === "joinCompound") {
    const joinAt = before.indexOf("+");
    if (joinAt < 1 || joinAt >= before.length - 1) return [];
    const chunks = [before.slice(0, joinAt), before.slice(joinAt + 1)];
    return chunks.map((graphemes, index) => ({
      id: `machine-join-${index === 0 ? "left" : "right"}`,
      action: "join",
      label: graphemes.join(""),
      graphemes
    }));
  }
  return [];
}

function machineInstruction(operation) {
  if (operation === "substituteOnset") return "Choose an onset piece to swap into the word.";
  if (operation === "removeOnset") return "Choose the onset piece to remove.";
  if (operation === "joinCompound") return "Choose both word pieces in the order they should join.";
  return "This word operation is not available.";
}

export function createWordMachineState(round = {}, supportLevel = 0) {
  return {
    selectedPieceIds: [],
    committed: false,
    resultGraphemes: null,
    supportLevel: support(supportLevel),
    status: machineInstruction(round.operation)
  };
}

function machineReady(operation, selectedPieceIds, pieceCount) {
  if (operation === "joinCompound") return pieceCount > 0 && selectedPieceIds.length === pieceCount;
  return selectedPieceIds.length === 1;
}

function resultForMachine(round, selectedPieceIds, pieces) {
  const before = list(round.beforeGraphemes);
  if (round.operation === "substituteOnset") {
    const selected = pieces.find(piece => piece.id === selectedPieceIds[0]);
    return selected ? [...selected.graphemes, ...before.slice(1)] : null;
  }
  if (round.operation === "removeOnset") {
    return selectedPieceIds[0] === pieces[0]?.id ? before.slice(1) : null;
  }
  if (round.operation === "joinCompound") {
    const selected = selectedPieceIds
      .map(id => pieces.find(piece => piece.id === id))
      .filter(Boolean);
    return selected.length === pieces.length
      ? selected.flatMap(piece => piece.graphemes)
      : null;
  }
  return null;
}

export function reduceWordMachine(state, action = {}, round = {}) {
  if (!state || action.type === "RESET") {
    return createWordMachineState(round, action.supportLevel);
  }
  if (state.committed && action.type !== "RESET") return state;
  const pieces = machinePiecesForRound(round);
  switch (action.type) {
    case "SELECT_PIECE": {
      const piece = pieces.find(item => item.id === action.pieceId);
      if (!piece) return state;
      let selectedPieceIds;
      if (round.operation === "joinCompound") {
        selectedPieceIds = state.selectedPieceIds.includes(piece.id)
          ? state.selectedPieceIds.filter(id => id !== piece.id)
          : [...state.selectedPieceIds, piece.id];
      } else {
        selectedPieceIds = [piece.id];
      }
      return {
        ...state,
        selectedPieceIds,
        status: round.operation === "joinCompound"
          ? `${selectedPieceIds.length} of ${pieces.length} word pieces selected.`
          : `${piece.label} is ready for the ${piece.action}.`
      };
    }
    case "REQUEST_REPLAY":
      return {
        ...state,
        supportLevel: state.supportLevel + 1,
        status: "The word operation was replayed. This try now includes support."
      };
    case "COMMIT": {
      if (!machineReady(round.operation, state.selectedPieceIds, pieces.length)) {
        return {
          ...state,
          status: machineInstruction(round.operation)
        };
      }
      const resultGraphemes = resultForMachine(round, state.selectedPieceIds, pieces);
      if (!resultGraphemes) return state;
      return {
        ...state,
        committed: true,
        resultGraphemes,
        status: `The machine made ${resultGraphemes.join("")}.`
      };
    }
    default:
      return state;
  }
}

function machineFeedback(round, response, correct) {
  const before = list(round.beforeGraphemes);
  const target = clean(round.afterWord) || list(round.afterGraphemes).join("");
  const made = response.join("");
  if (round.operation === "substituteOnset") {
    return correct
      ? `You swapped ${before[0]} for ${response[0]} and made ${target}.`
      : `You made ${made}. Swap only the first grapheme to make ${target}.`;
  }
  if (round.operation === "removeOnset") {
    return correct
      ? `You removed ${before[0]} and made ${target}.`
      : `You made ${made}. Remove only the first grapheme from ${clean(round.beforeWord)}.`;
  }
  if (round.operation === "joinCompound") {
    const pieces = machinePiecesForRound(round).map(piece => piece.label);
    return correct
      ? `You joined ${pieces[0]} and ${pieces[1]} to make ${target}.`
      : `You made ${made}. Put ${pieces[0]} before ${pieces[1]} and join them.`;
  }
  return "This word operation is not available.";
}

export function buildWordMachineOutcome(round = {}, state) {
  if (!state?.committed || !Array.isArray(state.resultGraphemes)) return null;
  const response = list(state.resultGraphemes);
  const correct = sameGraphemes(response, round.afterGraphemes);
  return {
    correct,
    selected: response,
    feedback: machineFeedback(round, response, correct),
    evidence: semanticEvidence(round, response, state.supportLevel, {
      operation: clean(round.operation)
    })
  };
}
