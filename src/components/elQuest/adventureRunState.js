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
    return text(value.word || value.title || value.label || value.text || value.cover || value.id);
  }
  return text(value);
}

function selectedLabel(outcome = {}) {
  const raw = outcome.selected ?? outcome.selectedItems ?? outcome.selectedWords;
  return selectedValues(raw).map(valueLabel).filter(Boolean).join(", ") || "that response";
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

function onset(word) {
  const clean = text(word).toLowerCase();
  return /^(sh|ch|th|wh)/u.exec(clean)?.[1] || clean.slice(0, 1);
}

function ending(word) {
  const clean = text(word).toLowerCase();
  return /(ng|nk|ck|ff|ss|zz|ll|[a-z])$/u.exec(clean)?.[1] || "the ending";
}

function coaching(attempt, first, later) {
  return attempt <= 1 ? first : later;
}

function selectedPatternWords(round, outcome) {
  const raw = outcome?.selectedItems ?? outcome?.selectedWords ?? outcome?.selected;
  const selected = selectedValues(raw).map(valueLabel).filter(Boolean);
  const words = Array.isArray(round.items)
    ? round.items.map(item => text(item?.word)).filter(Boolean)
    : [];
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
  if (construct === "orthographic_pattern_sort" || construct === "patternsort") {
    const fitBin = round.bins?.find(bin => bin?.id === "fits") || round.bins?.[0];
    const notBin = round.bins?.find(bin => bin?.id === "not") || round.bins?.[1];
    const pattern = text(round.patternLabel || fitBin?.label || round.targetGrapheme || round.pattern);
    const selectedWords = selectedPatternWords(round, outcome);
    return {
      construct,
      target: pattern,
      pattern,
      selected: selectedWords.join(", ") || selectedLabel(outcome),
      selectedWords,
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

  if (outcome.correct) {
    if (construct === "orthographic_pattern_sort" || construct === "patternsort") {
      return `Yes — ${selected} fits the pattern “${resolved.pattern}”.`;
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
      const chosenOnset = text(outcome.selectedGrapheme) || onset(chosenWord) || selected;
      return coaching(
        level,
        `${chosenOnset} starts ${chosenWord}. Listen for /${target}/ at the start of ${word}.`,
        `Say ${chosenWord}, then isolate its first sound. The target starts /${target}/, as in ${word}.`
      );
    }
    case "ending_grapheme_pattern_discrimination": {
      const chosenPattern = text(outcome.selectedPattern) || ending(chosenWord);
      return coaching(
        level,
        `${chosenWord} shows the ending pattern ${chosenPattern}. Listen for /${target}/ at the end of ${word}.`,
        `Look at the ending of ${chosenWord}, then compare it with /${target}/ at the end of ${word}.`
      );
    }
    case "orthographic_pattern_sort":
    case "patternsort": {
      const chosenPattern = text(outcome.selectedPattern) || ending(chosenWord);
      return coaching(
        level,
        `${resolved.selected || chosenWord} does not fit “${resolved.pattern || target}”. Sort it into “${resolved.fitLabel || target}” or “${resolved.notLabel || "the other bin"}”.`,
        `Compare ${resolved.selected || chosenWord} with the pattern “${resolved.pattern || target}”; look for “${chosenPattern}” only where the bin label says it belongs.`
      );
    }
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
    case "build":
      return coaching(
        level,
        `${selected} is not the word you heard. Listen again and build ${word}.`,
        `Say ${word}, stretch each sound, and place its graphemes in order; you chose ${selected}.`
      );
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
    case "grapheme_substitution_chain":
      return coaching(
        level,
        `You chose ${selected}. Change one grapheme in ${text(round.fromWord) || "the first word"} to make ${text(round.toWord || round.answer) || word}.`,
        `Compare the grapheme at the changed position, then make ${text(round.toWord || round.answer) || word}; you chose ${selected}.`
      );
    case "supported_phrase_reading":
      return coaching(
        level,
        `You chose ${selected}. Follow the phrase line and pause at the boundary in ${word}.`,
        `Read each phrase chunk, then pause where the line changes; you chose ${selected}.`
      );
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
  const wasFirst = firstAttempts[roundIndex] === null;
  const wasCompleted = completedRounds[roundIndex];

  attempts[roundIndex] += 1;
  if (wasFirst) firstAttempts[roundIndex] = correct;
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
