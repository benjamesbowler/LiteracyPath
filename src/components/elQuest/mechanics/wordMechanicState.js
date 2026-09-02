import { constrainedIndexOrder, seededIndexOrder } from "../adventureRoundModel.js";

function clean(value) {
  return String(value ?? "").trim();
}

function support(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

function roundKey(round) {
  return clean(round?.roundKey);
}

function belongsToRound(state, round) {
  const key = roundKey(round);
  return !key || state?.roundKey === key;
}

function retainHighestSupport(state, supportLevel) {
  const nextSupport = Math.max(support(state?.supportLevel), support(supportLevel));
  return nextSupport === state?.supportLevel
    ? state
    : { ...state, supportLevel: nextSupport };
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

function differenceBetween(selected, target) {
  const left = clean(selected);
  const right = clean(target);
  let prefixLength = 0;
  while (
    prefixLength < left.length
    && prefixLength < right.length
    && left[prefixLength] === right[prefixLength]
  ) prefixLength += 1;

  let suffixLength = 0;
  while (
    suffixLength < left.length - prefixLength
    && suffixLength < right.length - prefixLength
    && left[left.length - 1 - suffixLength] === right[right.length - 1 - suffixLength]
  ) suffixLength += 1;

  return {
    prefix: right.slice(0, prefixLength),
    selectedDifference: left.slice(prefixLength, left.length - suffixLength || undefined),
    targetDifference: right.slice(prefixLength, right.length - suffixLength || undefined),
    suffix: suffixLength ? right.slice(-suffixLength) : ""
  };
}

export function createWordWindowState(round = {}, supportLevel = 0) {
  return {
    roundKey: roundKey(round),
    phase: "study",
    selected: null,
    difference: null,
    supportLevel: support(supportLevel),
    status: clean(round.studyWord)
      ? `Study the whole word ${clean(round.studyWord)}.`
      : "Study the whole word."
  };
}

export function wordWindowStateForRound(state, round = {}, supportLevel = 0) {
  return state && belongsToRound(state, round)
    ? retainHighestSupport(state, supportLevel)
    : createWordWindowState(round, supportLevel);
}

export function reduceWordWindow(state, action = {}, round = {}) {
  if (action.type === "RESET") {
    return createWordWindowState(round, action.supportLevel);
  }
  state = wordWindowStateForRound(state, round, action.supportLevel);
  switch (action.type) {
    case "CLOSE":
      if (state.phase !== "study") return state;
      return {
        ...state,
        phase: "choose",
        selected: null,
        difference: null,
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
        difference: null,
        status: `${value} is locked in. Reveal the study word to compare.`
      };
    }
    case "REVEAL":
      if (state.phase !== "committed") return state;
      return {
        ...state,
        phase: "revealed",
        difference: differenceBetween(state.selected, round.studyWord || round.answer),
        status: `The study word is ${clean(round.studyWord || round.answer)}.`
      };
    case "RETRY":
      if (
        state.phase !== "revealed"
        || state.selected === clean(round.studyWord || round.answer)
      ) return state;
      return {
        ...state,
        phase: "choose",
        selected: null,
        difference: null,
        supportLevel: state.supportLevel + 1,
        status: "Try the whole-word choice again with the comparison support."
      };
    case "REOPEN":
      if (state.phase !== "choose") return state;
      return {
        ...state,
        phase: "study",
        selected: null,
        difference: null,
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
  if (!state || state.phase !== "revealed" || !state.selected) return null;
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
      state.supportLevel,
      { independent: correct && state.supportLevel === 0 }
    )
  };
}

function graphemeTiles(graphemes, round = {}) {
  const declaredBank = list(round.bankGraphemes);
  const hasValidDeclaredBank = declaredBank.length >= graphemes.length
    && graphemes.every((grapheme, index) => declaredBank[index] === grapheme);
  const bankGraphemes = hasValidDeclaredBank ? declaredBank : graphemes;
  const occurrences = new Map();
  const tiles = bankGraphemes.map((grapheme, index) => {
    const occurrence = (occurrences.get(grapheme) || 0) + 1;
    occurrences.set(grapheme, occurrence);
    return {
      id: `grapheme-${encodeURIComponent(grapheme)}-${occurrence}`,
      grapheme,
      isDistractor: index >= graphemes.length
    };
  });
  const proposedOrder = Array.isArray(round.tileOrder)
    ? round.tileOrder
    : seededIndexOrder(
        bankGraphemes.length,
        round.roundKey || `${round.word}:${bankGraphemes.join("|")}`
      );
  const exactProposedOrder = proposedOrder.length === bankGraphemes.length
    && new Set(proposedOrder).size === bankGraphemes.length
    && proposedOrder.every(index => (
      Number.isInteger(index) && index >= 0 && index < bankGraphemes.length
    ));
  const tileOrder = round.tileBankPolicy === "cycle-one-target-only-permutation"
    && exactProposedOrder
    ? proposedOrder
    : constrainedIndexOrder(bankGraphemes, proposedOrder, { avoidReverse: true });
  return tileOrder.map(index => tiles[index]);
}

export function createSoundBoxesState(round = {}, supportLevel = 0) {
  const graphemes = list(round.graphemes);
  return {
    roundKey: roundKey(round),
    slots: graphemes.map(() => null),
    tiles: graphemeTiles(graphemes, round),
    usedTileIds: [],
    supportLevel: support(supportLevel),
    committed: false,
    lastAttempt: null,
    status: graphemes.length
      ? `Fill ${graphemes.length} sound boxes, then blend and check.`
      : "No graphemes are available for this word."
  };
}

export function soundBoxesStateForRound(state, round = {}, supportLevel = 0) {
  return state && belongsToRound(state, round)
    ? retainHighestSupport(state, supportLevel)
    : createSoundBoxesState(round, supportLevel);
}

export function reduceSoundBoxes(state, action = {}, round = {}) {
  if (action.type === "RESET") {
    return createSoundBoxesState(round, action.supportLevel);
  }
  state = soundBoxesStateForRound(state, round, action.supportLevel);
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
          lastAttempt: {
            correct: false,
            selected: tile.grapheme,
            expectedGrapheme: expected,
            boxIndex: slotIndex
          },
          status: `${tile.grapheme} does not fit sound box ${slotIndex + 1}. Listen for ${expected}; your correct boxes stay in place.`
        };
      }
      const slots = [...state.slots];
      slots[slotIndex] = { tileId: tile.id, grapheme: tile.grapheme };
      return {
        ...state,
        slots,
        usedTileIds: [...state.usedTileIds, tile.id],
        lastAttempt: null,
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
        lastAttempt: null,
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
        lastAttempt: { correct: true },
        status: `Blend ${state.slots.map(slot => slot.grapheme).join(", ")}.`
      };
    default:
      return state;
  }
}

export function buildSoundBoxesOutcome(round = {}, state) {
  if (!state) return null;
  if (!state.committed && state.lastAttempt?.correct === false) {
    return {
      correct: false,
      selected: state.lastAttempt.selected,
      feedback: state.status,
      evidence: semanticEvidence(round, state.lastAttempt.selected, state.supportLevel, {
        independent: false,
        boxIndex: state.lastAttempt.boxIndex,
        expectedGrapheme: state.lastAttempt.expectedGrapheme
      })
    };
  }
  if (!state.committed) return null;
  const response = state.slots.map(slot => clean(slot?.grapheme)).filter(Boolean);
  const target = list(round.graphemes);
  const correct = sameGraphemes(response, target);
  return {
    correct,
    selected: response,
    feedback: correct
      ? `Blend ${response.join(", ")}. You built ${clean(round.word)}.`
      : `You built ${response.join("")}. Listen again and compare each sound box with ${clean(round.word)}.`,
    evidence: semanticEvidence(round, response, state.supportLevel, {
      independent: correct && state.supportLevel === 0
    })
  };
}

export function commitSoundBoxPlacement(state, tileId, round, onCommit = () => {}) {
  const next = reduceSoundBoxes(state, { type: "PLACE_TILE", tileId }, round);
  if (next === state) return state;
  const outcome = buildSoundBoxesOutcome(round, next);
  if (outcome?.correct === false) onCommit(outcome);
  return next;
}

function pieceId(action, graphemes, occurrence = 1) {
  return `machine-${action}-${graphemes.map(encodeURIComponent).join("-")}-${occurrence}`;
}

export function machinePiecesForRound(round = {}) {
  const before = list(round.beforeGraphemes);
  const after = list(round.afterGraphemes);
  if (round.operation === "substituteOnset") {
    if (Array.isArray(round.onsetPieces) && round.onsetPieces.length) {
      return round.onsetPieces.map((piece, index) => ({
        id: pieceId("swap", [piece.grapheme], index + 1),
        action: "swap",
        label: clean(piece.grapheme),
        graphemes: [clean(piece.grapheme)],
        projectedWord: clean(piece.projectedWord),
        matches: Boolean(piece.matches)
      }));
    }
    const candidateOnsets = Array.isArray(round.choiceGraphemes)
      ? round.choiceGraphemes.map(choice => list(choice?.graphemes)[0]).filter(Boolean)
      : [before[0], after[0]].filter(Boolean);
    return [...new Set([...candidateOnsets, after[0]].filter(Boolean))].map((grapheme, index) => {
      const projectedWord = [grapheme, ...before.slice(1)].join("");
      return {
        id: pieceId("swap", [grapheme], index + 1),
        action: "swap",
        label: grapheme,
        graphemes: [grapheme],
        projectedWord,
        matches: projectedWord === after.join("")
      };
    });
  }
  if (round.operation === "removeOnset") {
    const projectedWords = new Set();
    const pieces = before.flatMap((grapheme, index) => {
      const projectedWord = before
        .filter((_, graphemeIndex) => graphemeIndex !== index)
        .join("");
      if (projectedWords.has(projectedWord)) return [];
      projectedWords.add(projectedWord);
      return [{
        id: pieceId("remove", [grapheme], index + 1),
        action: "remove",
        label: grapheme,
        graphemes: [grapheme],
        position: index,
        projectedWord,
        matches: index === 0
      }];
    });
    const bySourcePosition = new Map(pieces.map(piece => [piece.position, piece]));
    const declaredOrder = Array.isArray(round.pieceOrder) ? round.pieceOrder : [];
    const hasExactDeclaredOrder = declaredOrder.length === pieces.length
      && new Set(declaredOrder).size === pieces.length
      && declaredOrder.every(position => bySourcePosition.has(position));
    if (hasExactDeclaredOrder) {
      return declaredOrder.map(position => bySourcePosition.get(position));
    }
    return seededIndexOrder(
      pieces.length,
      round.roundKey || `${round.beforeWord}:${round.afterWord}`
    ).map(index => pieces[index]);
  }
  if (round.operation === "joinCompound") {
    const joinAt = before.indexOf("+");
    if (joinAt < 1 || joinAt >= before.length - 1) return [];
    const chunks = [before.slice(0, joinAt), before.slice(joinAt + 1)];
    const declaredPieces = Array.isArray(round.compoundPieces)
      ? round.compoundPieces.map((piece, index) => ({
          id: `machine-join-${clean(piece?.id) || index + 1}`,
          action: "join",
          label: clean(piece?.label || piece?.word),
          graphemes: list(piece?.graphemes),
          semanticIndex: Number.isInteger(piece?.semanticIndex) ? piece.semanticIndex : null
        })).filter(piece => piece.label && piece.graphemes.length)
      : [];
    const declaredTargetIndexes = new Set(
      declaredPieces
        .filter(piece => Number.isInteger(piece.semanticIndex))
        .map(piece => piece.semanticIndex)
    );
    const pieces = declaredPieces.length >= 3
      && declaredTargetIndexes.size === 2
      && declaredTargetIndexes.has(0)
      && declaredTargetIndexes.has(1)
      ? declaredPieces
      : chunks.map((graphemes, index) => ({
          id: `machine-join-${index === 0 ? "left" : "right"}`,
          action: "join",
          label: graphemes.join(""),
          graphemes,
          semanticIndex: index
        }));
    const proposedOrder = Array.isArray(round.pieceOrder)
      ? round.pieceOrder
      : seededIndexOrder(pieces.length, round.roundKey || pieces.map(piece => piece.label).join("|"));
    return constrainedIndexOrder(
      pieces.map(piece => piece.label),
      proposedOrder
    ).map(index => pieces[index]);
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
    roundKey: roundKey(round),
    selectedPieceIds: [],
    committed: false,
    correct: null,
    resultGraphemes: null,
    supportLevel: support(supportLevel),
    status: machineInstruction(round.operation)
  };
}

export function wordMachineStateForRound(state, round = {}, supportLevel = 0) {
  return state && belongsToRound(state, round)
    ? retainHighestSupport(state, supportLevel)
    : createWordMachineState(round, supportLevel);
}

function compoundTargetCount(pieces) {
  return pieces.filter(piece => Number.isInteger(piece.semanticIndex)).length;
}

function machineReady(operation, selectedPieceIds, pieces) {
  if (operation === "joinCompound") {
    const targetCount = compoundTargetCount(pieces);
    return targetCount > 0 && selectedPieceIds.length === targetCount;
  }
  return selectedPieceIds.length === 1;
}

function resultForMachine(round, selectedPieceIds, pieces) {
  const before = list(round.beforeGraphemes);
  if (round.operation === "substituteOnset") {
    const selected = pieces.find(piece => piece.id === selectedPieceIds[0]);
    return selected ? [...selected.graphemes, ...before.slice(1)] : null;
  }
  if (round.operation === "removeOnset") {
    const selected = pieces.find(piece => piece.id === selectedPieceIds[0]);
    return Number.isInteger(selected?.position)
      ? before.filter((_, index) => index !== selected.position)
      : null;
  }
  if (round.operation === "joinCompound") {
    const selected = selectedPieceIds
      .map(id => pieces.find(piece => piece.id === id))
      .filter(Boolean);
    return selected.length === compoundTargetCount(pieces)
      ? selected.flatMap(piece => piece.graphemes)
      : null;
  }
  return null;
}

export function reduceWordMachine(state, action = {}, round = {}) {
  if (action.type === "RESET") {
    return createWordMachineState(round, action.supportLevel);
  }
  state = wordMachineStateForRound(state, round, action.supportLevel);
  const pieces = machinePiecesForRound(round);
  if (action.type === "RETRY") {
    if (!state.committed || state.correct !== false) return state;
    return {
      ...state,
      selectedPieceIds: [],
      committed: false,
      correct: null,
      resultGraphemes: null,
      supportLevel: state.supportLevel + 1,
      status: "Try the word operation again with the correction support."
    };
  }
  if (state.committed && action.type !== "RESET") return state;
  switch (action.type) {
    case "SELECT_PIECE": {
      const piece = pieces.find(item => item.id === action.pieceId);
      if (!piece) return state;
      let selectedPieceIds;
      if (round.operation === "joinCompound") {
        const selected = state.selectedPieceIds.includes(piece.id);
        const targetCount = compoundTargetCount(pieces);
        selectedPieceIds = selected
          ? state.selectedPieceIds.filter(id => id !== piece.id)
          : state.selectedPieceIds.length < targetCount
            ? [...state.selectedPieceIds, piece.id]
            : state.selectedPieceIds;
      } else {
        selectedPieceIds = [piece.id];
      }
      return {
        ...state,
        selectedPieceIds,
        status: round.operation === "joinCompound"
          ? `${selectedPieceIds.length} of ${compoundTargetCount(pieces)} word pieces selected.`
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
      if (!machineReady(round.operation, state.selectedPieceIds, pieces)) {
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
        correct: sameGraphemes(resultGraphemes, round.afterGraphemes),
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
    const pieces = [...machinePiecesForRound(round)]
      .filter(piece => Number.isInteger(piece.semanticIndex))
      .sort((left, right) => left.semanticIndex - right.semanticIndex)
      .map(piece => piece.label);
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
      independent: correct && state.supportLevel === 0,
      operation: clean(round.operation)
    })
  };
}
