import { isIndependentOutcome } from "../../policy/outcomeIndependence.js";

// Pure run-state helpers for Cycle Quest and the mixed-mechanic Adventure Map
// rounds. A first attempt is committed before coaching is shown, so recovery
// can never turn an independent miss into an independent success.

function positiveInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}


function selectedValues(selected) {
  return Array.isArray(selected) ? selected.filter(value => value !== null && value !== undefined) : [selected];
}

function text(value) {
  return String(value ?? "").trim();
}

function valueLabel(value) {
  if (value && typeof value === "object") {
    if (text(value.grapheme)) {
      const position = positiveInteger(value.position);
      return position
        ? `${text(value.grapheme)} at position ${position}`
        : text(value.grapheme);
    }
    return text(value.word || value.title || value.label || value.text || value.cover || value.id);
  }
  return text(value);
}

function selectedLabel(outcome = {}) {
  const raw = outcome.selected ?? outcome.selectedItems ?? outcome.selectedWords;
  return selectedValues(raw).map(valueLabel).filter(Boolean).join(", ") || "that response";
}

function hasSelectedResponse(outcome = {}) {
  const raw = outcome.selected ?? outcome.selectedItems ?? outcome.selectedWords;
  return selectedValues(raw).map(valueLabel).some(Boolean);
}

function choiceWords(round = {}) {
  return [
    ...(Array.isArray(round.objects) ? round.objects.map(item => item?.word || item?.label || item?.id) : []),
    ...(Array.isArray(round.choices) ? round.choices : [])
  ].map(valueLabel).filter(Boolean);
}

function selectedWord(round, outcome) {
  const selected = selectedValues(outcome?.selected ?? outcome).map(valueLabel).filter(Boolean);
  const words = choiceWords(round);
  return selected
    .map(value => words.find(word => word === value) || words.find(word => word.startsWith(value)))
    .find(Boolean) || selected[0] || "the word you chose";
}

function targetWord(round = {}) {
  return text(round.answer || round.targetWord || round.afterWord || round.word || round.studyWord);
}

function targetGrapheme(round = {}) {
  return text(round.targetGrapheme || round.target || round.pattern || round.answer);
}

function coaching(attempt, first, isolated, modelled = "") {
  if (attempt <= 1) return first;
  if (attempt === 2) return isolated;
  return modelled || `Watch the correct model. ${isolated} Then make the same action yourself.`;
}

function matchingObjectWords(round = {}) {
  return (Array.isArray(round.objects) ? round.objects : [])
    .filter(item => item?.matches === true)
    .map(item => text(item?.word || item?.label))
    .filter(Boolean);
}

function sceneHuntDifferences(round = {}, outcome = {}) {
  const objects = Array.isArray(round.objects) ? round.objects : [];
  const selected = selectedValues(outcome.selected ?? outcome.selectedItems)
    .map(valueLabel)
    .filter(Boolean)
    .map(label => objects.find(item => text(item?.word) === label)
      || objects.find(item => text(item?.word).startsWith(label)))
    .filter(Boolean)
    .map(item => text(item.word));
  const selectedSet = new Set(selected);
  return {
    wrong: objects
      .filter(item => item?.matches !== true && selectedSet.has(text(item?.word)))
      .map(item => text(item.word)),
    missing: objects
      .filter(item => item?.matches === true && !selectedSet.has(text(item?.word)))
      .map(item => text(item.word)),
    selected
  };
}

function phraseBoundaryLabel(round = {}, selected) {
  const position = positiveInteger(selected);
  const choice = (Array.isArray(round.boundaryChoices) ? round.boundaryChoices : [])
    .find(item => positiveInteger(item?.position) === position);
  return text(choice?.afterWord || choice?.label)
    || (position ? `position ${position}` : selectedLabel({ selected }));
}

function selectedPatternWords(round, outcome) {
  const raw = outcome?.selectedItems ?? outcome?.selectedWords ?? outcome?.selected;
  const selected = selectedValues(raw).map(valueLabel).filter(Boolean);
  const words = Array.isArray(round.items)
    ? round.items.map(item => text(item?.word)).filter(Boolean)
    : [];
  if (round.transferWord) words.push(text(round.transferWord));
  return selected
    .map(value => words.find(word => word === value) || words.find(word => word.startsWith(value)))
    .filter(Boolean);
}

function selectedCover(round, outcome) {
  const covers = Array.isArray(round.covers) ? round.covers : [];
  const raw = outcome?.selectedCover ?? outcome?.selectedTitle ?? outcome?.selected;
  const labels = selectedValues(raw).map(valueLabel).filter(Boolean);
  return labels
    .map(label => covers.find(cover => (
      valueLabel(cover) === label
      || text(cover?.title) === label
      || text(cover?.character) === label
      || text(cover?.cover) === label
    )))
    .find(Boolean) || (labels[0] ? { title: labels[0] } : null);
}

/**
 * Resolve correction targets from the semantic round shape, rather than
 * guessing from a station title or falling back to a generic word/sound.
 * This stays pure so generated-round coverage can exercise it without React.
 */
function resolveFeedbackTarget(round = {}, outcome = {}) {
  const construct = text(round.construct || round.mechanicId || round.type).toLowerCase();
  const mechanic = text(round.mechanicId).toLowerCase();
  if (construct === "orthographic_pattern_sort" || construct === "patternsort" || mechanic === "patternsort") {
    const fitBin = round.bins?.find(bin => bin?.id === "fits") || round.bins?.[0];
    const notBin = round.bins?.find(bin => bin?.id === "not") || round.bins?.[1];
    const pattern = text(round.patternLabel || fitBin?.label || round.targetGrapheme || round.pattern);
    const selectedWords = selectedPatternWords(round, outcome);
    const selectedValuesForOutcome = selectedValues(outcome?.selected).map(valueLabel).filter(Boolean);
    const selectedWord = selectedWords[0] || selectedValuesForOutcome.find(value => (
      value !== fitBin?.id && value !== notBin?.id
    )) || selectedLabel(outcome);
    const selectedItem = round.items?.find(item => item?.word === selectedWord);
    const selectedFits = selectedItem
      ? Boolean(selectedItem.fits)
      : selectedWord === round.transferWord && typeof round.transferFits === "boolean"
        ? round.transferFits
        : null;
    return {
      construct,
      target: pattern,
      pattern,
      selected: selectedWord,
      selectedWords,
      selectedFits,
      fitLabel: text(fitBin?.label || pattern),
      notLabel: text(notBin?.label)
    };
  }

  if (construct === "supported_cover_title_association" || construct === "coverclue" || construct === "story") {
    const targetCover = round.targetCover || round.covers?.find(cover => cover?.matches);
    const stripText = text(round.strip?.text || targetCover?.title);
    const targetTitle = text(targetCover?.title || stripText);
    const chosenCover = selectedCover(round, outcome);
    return {
      construct,
      target: targetTitle,
      stripText,
      targetTitle,
      selected: text(chosenCover?.title || chosenCover?.character || selectedLabel(outcome)),
      selectedTitle: text(chosenCover?.title || chosenCover?.character || selectedLabel(outcome)),
      selectedCover: chosenCover
    };
  }

  if (construct === "letter_formation_practice"
    || construct === "grapheme_pattern_formation_practice"
    || construct === "lettertrace"
    || construct === "trace") {
    const letter = text(round.letter || round.targetGrapheme || round.target || round.answer || round.word);
    return {
      construct,
      target: letter,
      letter,
      selected: selectedLabel(outcome)
    };
  }

  const target = targetGrapheme(round) || targetWord(round) || text(round.patternLabel);
  return { construct, target, selected: selectedLabel(outcome) };
}

function correctionUnits(values) {
  return values.flatMap(value => Array.isArray(value) ? value : [value]).map(text).filter(Boolean);
}

/**
 * Build the exact, visible action model shown after a third miss. This is
 * deliberately separate from feedback copy: the child sees the correct
 * mapping, sequence, boundary, or destination before repeating the action.
 */
export function correctionModelForOutcome(round = {}, outcome = {}) {
  const construct = text(round.construct || round.mechanicId || round.type).toLowerCase();
  const mechanic = text(round.mechanicId).toLowerCase();
  const resolved = resolveFeedbackTarget(round, outcome);
  const target = targetGrapheme(round) || targetWord(round) || resolved.target;
  const word = targetWord(round) || target;
  const model = (instruction, units, extra = {}) => {
    const cleanedUnits = correctionUnits(units);
    return instruction && cleanedUnits.length
      ? { label: "Correct model", instruction, units: cleanedUnits, ...extra }
      : null;
  };

  if (construct === "visual_letter_identity" || mechanic === "letterpair") {
    return model(
      `Pair ${text(round.modelForm)} with ${text(round.partnerForm || round.answer)}.`,
      [round.modelForm, "→", round.partnerForm || round.answer]
    );
  }
  if (construct === "heard_phoneme_grapheme_mapping"
    || construct === "heard_ending_sound_family_mapping"
    || mechanic === "soundgate") {
    const accepted = Array.isArray(round.acceptedAnswers) && round.acceptedAnswers.length
      ? round.acceptedAnswers
      : [target];
    return model(`Put ${accepted.join(" or ")} in the sound gate.`, accepted);
  }
  if (construct === "initial_phoneme_discrimination"
    || construct === "ending_grapheme_pattern_discrimination"
    || mechanic === "scenehunt") {
    const matches = matchingObjectWords(round);
    const relation = construct === "ending_grapheme_pattern_discrimination"
      ? `ends with ${target}`
      : `starts with /${target}/`;
    return model(`Tag ${matches.join(" and ")}; each word ${relation}.`, matches);
  }
  if (construct === "high_frequency_word_recognition" || mechanic === "wordwindow") {
    return model(`Study the whole word ${text(round.studyWord || word)}.`, [round.studyWord || word]);
  }
  if (construct === "phoneme_grapheme_encoding" || mechanic === "soundboxes") {
    return model(`Build ${word} in this order.`, round.graphemes || [word]);
  }
  if (["onset_substitution", "onset_removal", "compound_word_joining"].includes(construct)
    || mechanic === "wordmachine") {
    const before = text(round.beforeWord);
    const after = text(round.afterWord || round.answer);
    return model(`Change ${before} to ${after}.`, [before, "→", after]);
  }
  if (construct === "connected_print_tracking" || mechanic === "poemspotlight") {
    const token = text(round.targetToken?.text || round.answer || word);
    const line = positiveInteger(Number(round.targetToken?.lineIndex) + 1);
    const position = positiveInteger(Number(round.targetToken?.tokenIndex) + 1);
    const location = line && position ? `word ${position} in line ${line}` : "the printed line";
    return model(`Track to ${token}: ${location}.`, [token]);
  }
  if (construct === "supported_cover_title_association" || mechanic === "coverclue") {
    const strip = text(round.strip?.text || resolved.stripText);
    const cover = text(round.targetCover?.title || resolved.targetTitle);
    return model(
      `The title ${strip} goes with this cover picture.`,
      [strip, "→"],
      {
        image: {
          src: text(round.targetCover?.cover),
          alt: `Cover for ${cover}`
        }
      }
    );
  }
  if (["letter_formation_practice", "grapheme_pattern_formation_practice"].includes(construct)
    || mechanic === "lettertrace") {
    const letter = text(round.letter || target);
    return model(
      `Watch each stroke of ${letter} in order, then trace it again.`,
      [letter],
      { mode: "native-formation" }
    );
  }
  if (construct === "visual_grapheme_identity"
    || construct === "orthographic_pattern_sort"
    || mechanic === "patternsort") {
    const patternResolved = (construct === "orthographic_pattern_sort")
      ? resolved
      : resolveFeedbackTarget({ ...round, construct: "patternsort" }, outcome);
    const selected = patternResolved.selected || selectedLabel(outcome);
    const destination = patternResolved.selectedFits === false
      ? patternResolved.notLabel
      : patternResolved.fitLabel;
    return model(`Put ${selected} in ${destination}.`, [selected, "→", destination]);
  }
  if (construct === "grapheme_substitution_chain" || mechanic === "wordchain") {
    return model(
      `Change ${text(round.fromWord)} to ${text(round.toWord || word)}.`,
      [round.fromWord, "→", round.toWord || word]
    );
  }
  if (construct === "supported_phrase_reading" || mechanic === "phraseflow") {
    const chunks = Array.isArray(round.phraseChunks) ? round.phraseChunks : [];
    return model("The first poetry line ends at this boundary.", [chunks[0], "|", chunks[1]]);
  }
  if (construct === "orthographic_memory" || mechanic === "heartword") {
    return model(`Spell ${word} in this order.`, round.graphemes || [word]);
  }
  return model(`Match the target ${target}.`, [target]);
}

/**
 * Make correction feedback from the round's literacy construct. The response
 * always identifies both the selected response and the target contrast.
 */
export function feedbackForOutcome(round = {}, outcome = {}, attempt = 1) {
  const resolved = resolveFeedbackTarget(round, outcome);
  const construct = resolved.construct;
  const selected = resolved.selected || selectedLabel(outcome);
  const target = resolved.target;
  const word = targetWord(round) || target;
  const chosenWord = selectedWord(round, outcome);
  const level = Math.max(1, positiveInteger(attempt) || 1);
  const patternShaped = ["orthographic_pattern_sort", "patternsort"].includes(construct)
    || (construct === "visual_grapheme_identity"
      && text(round.mechanicId).toLowerCase() === "patternsort");

  if (outcome.correct) {
    if (patternShaped) {
      if (resolved.selectedFits === false) {
        return `Yes — ${selected} does not fit “${resolved.pattern}” and belongs in “${resolved.notLabel}”.`;
      }
      if (resolved.selectedFits === true) {
        return `Yes — ${selected} fits “${resolved.pattern}” and belongs in “${resolved.fitLabel}”.`;
      }
      return `Yes — ${selected} belongs in the matching pattern bin.`;
    }
    if (construct === "supported_cover_title_association" || construct === "coverclue" || construct === "story") {
      return `Yes — the title strip “${resolved.stripText}” matches the “${resolved.targetTitle}” cover.`;
    }
    if (construct === "letter_formation_practice"
      || construct === "grapheme_pattern_formation_practice"
      || construct === "lettertrace"
      || construct === "trace") {
      return `Yes — your trace follows ${resolved.letter}.`;
    }
    return `Yes — ${selected} matches ${word}.`;
  }

  if (patternShaped) {
    if (resolved.selectedFits === true) {
      return coaching(
        level,
        `${resolved.selected || chosenWord} fits “${resolved.pattern || target}”. Put it in “${resolved.fitLabel || target}”.`,
        `Highlight “${resolved.pattern || target}” in ${resolved.selected || chosenWord}, then choose “${resolved.fitLabel || target}”.`,
        `Watch the model: ${resolved.selected || chosenWord} goes in “${resolved.fitLabel || target}”. Now place it there yourself.`
      );
    }
    if (resolved.selectedFits === false) {
      return coaching(
        level,
        `${resolved.selected || chosenWord} does not fit “${resolved.pattern || target}”. Put it in “${resolved.notLabel || "the other bin"}”.`,
        `Compare ${resolved.selected || chosenWord} with “${resolved.pattern || target}”; the pattern is missing, so choose “${resolved.notLabel || "the other bin"}”.`,
        `Watch the model: ${resolved.selected || chosenWord} goes in “${resolved.notLabel || "the other bin"}”. Now place it there yourself.`
      );
    }
    return coaching(
      level,
      `Compare ${resolved.selected || chosenWord} with “${resolved.pattern || target}”, then use the matching labelled bin.`,
      `Highlight the relevant letters in ${resolved.selected || chosenWord}, then compare them with “${resolved.pattern || target}”.`,
      `Watch the highlighted model for “${resolved.pattern || target}”, then place ${resolved.selected || chosenWord} in the same labelled bin yourself.`
    );
  }

  // Keep the generated construct IDs explicit. In particular, names such as
  // "phoneme_grapheme_encoding" and "grapheme_substitution_chain" must not
  // fall into the sound-choice template merely because they contain a shared
  // word. Mechanic aliases are retained only for future/hand-authored rounds.
  switch (construct) {
    case "visual_letter_identity":
      return coaching(
        level,
        `${selected} is not the matching letter form. Compare big and small ${target}.`,
        `Look at the letter shape and pair ${selected} with the ${target} form.`
      );
    case "visual_grapheme_identity":
      return coaching(
        level,
        `${selected} does not show the target grapheme ${target}. Look for ${target} inside the word.`,
        `Highlight the grapheme ${target} and compare it with your response ${selected}.`
      );
    case "heard_phoneme_grapheme_mapping":
    case "soundgate":
    case "sound":
      return coaching(
        level,
        `You chose ${selected}. The target sound is /${target}/, so choose ${target}.`,
        `Say the sound slowly, then match /${target}/ to the grapheme ${target}; you chose ${selected}.`
      );
    case "heard_ending_sound_family_mapping":
      return coaching(
        level,
        `You chose ${selected}. The ending sound is /${target}/, so choose ${target}.`,
        `Stretch the ending, then match /${target}/ to ${target}; you chose ${selected}.`
      );
    case "initial_phoneme_discrimination":
    case "scenehunt":
    case "hunt": {
      const { wrong, missing } = sceneHuntDifferences(round, outcome);
      const wrongMessage = wrong.length
        ? ` Remove ${wrong.join(" and ")}; ${wrong.length === 1 ? "it does" : "they do"} not start with /${target}/.`
        : "";
      const missingMessage = missing.length
        ? ` Tag ${missing.join(" and ")}; ${missing.length === 1 ? "it starts" : "they start"} with /${target}/.`
        : "";
      return coaching(
        level,
        `${hasSelectedResponse(outcome) ? "Check your tags." : "You tagged no pictures."}${wrongMessage}${missingMessage}`,
        `Say ${matchingObjectWords(round).join(" and ")}, isolate /${target}/ at the start, then tag only ${matchingObjectWords(round).length === 1 ? "that picture" : "those pictures"}.`
      );
    }
    case "ending_grapheme_pattern_discrimination": {
      const { wrong, missing } = sceneHuntDifferences(round, outcome);
      const wrongMessage = wrong.length
        ? ` Remove ${wrong.join(" and ")}; ${wrong.length === 1 ? "it does" : "they do"} not end with ${target}.`
        : "";
      const missingMessage = missing.length
        ? ` Tag ${missing.join(" and ")}; ${missing.length === 1 ? "it ends" : "they end"} with ${target}.`
        : "";
      return coaching(
        level,
        `${hasSelectedResponse(outcome) ? "Check your tags." : "You tagged no pictures."}${wrongMessage}${missingMessage}`,
        `Say ${matchingObjectWords(round).join(" and ")}, isolate ${target} at the end, then tag only ${matchingObjectWords(round).length === 1 ? "that picture" : "those pictures"}.`
      );
    }
    case "orthographic_pattern_sort":
    case "patternsort":
      break;
    case "high_frequency_word_recognition":
    case "wordwindow":
    case "quick":
      return coaching(
        level,
        `You chose ${selected}. Look at the whole word: ${word}.`,
        `Reveal the word one part at a time, then find ${word}; you chose ${selected}.`
      );
    case "phoneme_grapheme_encoding":
    case "soundboxes":
    case "build": {
      const expected = text(outcome.evidence?.expectedGrapheme);
      const boxIndex = Number(outcome.evidence?.boxIndex);
      if (expected && Number.isInteger(boxIndex) && boxIndex >= 0) {
        return coaching(
          level,
          `${selected} does not fit sound box ${boxIndex + 1}. Put ${expected} in that box.`,
          `Listen for ${expected} in sound box ${boxIndex + 1}, then place ${expected}; you chose ${selected}.`
        );
      }
      return coaching(
        level,
        `You built ${selected}. Listen again and build ${word}.`,
        `Say ${word}, stretch each sound, and place its graphemes in order; you chose ${selected}.`
      );
    }
    case "onset_substitution":
    case "wordmachine":
    case "play": {
      const after = text(round.afterWord || round.answer) || "the new word";
      return coaching(
        level,
        `You chose ${selected}. Start with ${text(round.beforeWord) || "the first word"}; the target change makes ${after}.`,
        `Watch the word parts: change or remove only the stated part to make ${after}; you chose ${selected}.`
      );
    }
    case "onset_removal": {
      const after = text(round.afterWord || round.answer) || "the new word";
      return coaching(
        level,
        `You chose ${selected}. Use the word parts: remove the first sound from ${text(round.beforeWord) || "the first word"} to make ${after}.`,
        `Watch the word parts and remove only the stated beginning sound to make ${after}; you chose ${selected}.`
      );
    }
    case "compound_word_joining": {
      const after = text(round.afterWord || round.answer) || "the new word";
      return coaching(
        level,
        `You chose ${selected}. Use the word parts and join them to make ${after}.`,
        `Say each word part, then join them to make ${after}; you chose ${selected}.`
      );
    }
    case "connected_print_tracking":
    case "poemspotlight":
    case "poem":
      return coaching(
        level,
        `You chose ${selected}. Find ${word} in the printed line.`,
        `Track the line from the beginning and stop on ${word}; you chose ${selected}.`
      );
    case "supported_cover_title_association":
    case "coverclue":
    case "story":
      return coaching(
        level,
        `You placed “${resolved.selectedTitle}”. Read the title strip “${resolved.stripText}” and match it to the “${resolved.targetTitle}” cover.`,
        `Compare “${resolved.selectedTitle}” with the title strip “${resolved.stripText}”, then place it on the “${resolved.targetTitle}” cover.`
      );
    case "letter_formation_practice":
    case "grapheme_pattern_formation_practice":
    case "lettertrace":
    case "trace": {
      const dimension = text(outcome.dimension || outcome.errorDimension || "start, order, direction, or coverage");
      return coaching(
        level,
        `Your trace “${selected}” needs a clearer ${dimension}. Watch the model, then trace ${resolved.letter}.`,
        `Start at the marked point and follow the direction through ${resolved.letter}; your trace was ${selected}.`
      );
    }
    case "grapheme_substitution_chain": {
      const responsePosition = positiveInteger(outcome.selected?.position);
      const responseGrapheme = text(outcome.selected?.grapheme) || selected;
      const targetPosition = positiveInteger(Number(round.changeIndex) + 1);
      const targetReplacement = text(round.toGraphemes?.[round.changeIndex] || round.answer);
      if (responsePosition && targetPosition && responsePosition !== targetPosition) {
        return coaching(
          level,
          `You chose ${responseGrapheme} at position ${responsePosition}. That position stays the same; position ${targetPosition} changes.`,
          `Compare ${text(round.fromWord)} with ${text(round.toWord || round.answer)}. Change position ${targetPosition}, not position ${responsePosition}.`
        );
      }
      return coaching(
        level,
        `You chose ${responseGrapheme} at position ${responsePosition || targetPosition}. Use ${targetReplacement} there to make ${text(round.toWord || round.answer) || word}.`,
        `At position ${targetPosition}, change ${text(round.fromGraphemes?.[round.changeIndex])} to ${targetReplacement}; you chose ${responseGrapheme}.`
      );
    }
    case "supported_phrase_reading":
      {
        const boundary = phraseBoundaryLabel(round, outcome.selected);
      return coaching(
        level,
        `You chose after “${boundary}”. Read the continuous word trail and choose where the first poetry line ends.`,
        `Start at the beginning of the continuous word trail and choose where the first poetry line ends; you chose after “${boundary}”.`
      );
      }
    case "orthographic_memory":
      return coaching(
        level,
        `You chose ${selected}. Study the whole heart word ${word}, then spell it from memory.`,
        `Reveal the first differing grapheme in ${word}, then repair it; you chose ${selected}.`
      );
    default:
      break;
  }

  return coaching(
    level,
    `You chose ${selected}. Compare it with ${target || "that target"}.`,
    `Look closely at ${target || "that target"} and compare it with your response ${selected}.`
  );
}

// The mechanic's own message describes its immediate local state. The shared
// controller owns correction escalation, so an ordinary non-empty mechanic
// message must never mask the first / isolate / model ladder on a miss.
export function feedbackForCommittedOutcome(round = {}, outcome = {}, attempt = 1) {
  if (!outcome.correct && positiveInteger(attempt) >= 3) {
    const correction = correctionModelForOutcome(round, outcome);
    if (correction) {
      return `Watch the correct model: ${correction.instruction} Then make the same action yourself.`;
    }
  }
  const semanticFeedback = feedbackForOutcome(round, outcome, attempt);
  return outcome.correct && text(outcome.feedback)
    ? text(outcome.feedback)
    : semanticFeedback;
}

export function createAdventureRun(total) {
  const count = positiveInteger(total);
  return {
    total: count,
    completed: 0,
    firstAttempts: Array(count).fill(null),
    completedRounds: Array(count).fill(false),
    attempts: Array(count).fill(0),
    recoveries: 0
  };
}

/** Record one committed response without mutating the previous run. */
export function recordAdventureOutcome(state = {}, outcome = {}) {
  const total = positiveInteger(state.total);
  const roundIndex = Number(outcome.roundIndex);
  if (!Number.isInteger(roundIndex) || roundIndex < 0 || roundIndex >= total) return state;

  const firstAttempts = Array.from({ length: total }, (_, index) => (
    typeof state.firstAttempts?.[index] === "boolean" ? state.firstAttempts[index] : null
  ));
  const completedRounds = Array.from({ length: total }, (_, index) => Boolean(state.completedRounds?.[index]) || firstAttempts[index] === true);
  const attempts = Array.from({ length: total }, (_, index) => positiveInteger(state.attempts?.[index]));
  const correct = Boolean(outcome.correct);
  const independentCorrect = correct && isIndependentOutcome(outcome);
  const wasFirst = firstAttempts[roundIndex] === null;
  const wasCompleted = completedRounds[roundIndex];

  attempts[roundIndex] += 1;
  if (wasFirst) firstAttempts[roundIndex] = independentCorrect;
  if (correct) completedRounds[roundIndex] = true;

  const previousCompleted = Math.max(0, Math.min(total, positiveInteger(state.completed)));
  const completed = Math.min(total, previousCompleted + (correct && !wasCompleted ? 1 : 0));
  const previousRecoveries = positiveInteger(state.recoveries);
  const recoveries = previousRecoveries + (correct && !wasFirst && !wasCompleted && firstAttempts[roundIndex] === false ? 1 : 0);

  return {
    ...state,
    total,
    completed,
    firstAttempts,
    completedRounds,
    attempts,
    recoveries
  };
}

export function cycleQuestResult(state = {}) {
  const total = positiveInteger(state.total);
  const firstAttempts = Array.isArray(state.firstAttempts) ? state.firstAttempts.slice(0, total) : [];
  const independent = firstAttempts.filter(attempt => attempt === true).length;
  const independentPercent = total ? Math.round((independent / total) * 100) : 0;
  const completed = positiveInteger(state.completed);
  const recoveries = positiveInteger(state.recoveries);
  const complete = total > 0 && completed >= total && firstAttempts.length === total
    && firstAttempts.every(attempt => typeof attempt === "boolean");

  let stars = 0;
  if (complete) {
    if (independent === total) stars = 3;
    else if (independent / total >= 0.7) stars = 2;
    else stars = 1;
  } else if (completed > 0 && recoveries > 0) {
    // A run with a supported recovery has earned the one-star practice
    // result even while the caller is still working through its blueprint.
    stars = 1;
  }
  return { stars, independentPercent };
}
