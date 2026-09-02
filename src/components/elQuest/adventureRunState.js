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

function selectedLabel(outcome = {}) {
  return selectedValues(outcome.selected).map(text).filter(Boolean).join(", ") || "that response";
}

function choiceWords(round = {}) {
  return [
    ...(Array.isArray(round.objects) ? round.objects.map(item => item?.word || item?.label || item?.id) : []),
    ...(Array.isArray(round.choices) ? round.choices : [])
  ].map(text).filter(Boolean);
}

function selectedWord(round, outcome) {
  const selected = selectedValues(outcome?.selected ?? outcome).map(text).filter(Boolean);
  const words = choiceWords(round);
  return selected
    .map(value => words.find(word => word === value) || words.find(word => word.startsWith(value)))
    .find(Boolean) || selected[0] || "the word you chose";
}

function targetWord(round = {}) {
  return text(round.answer || round.targetWord || round.afterWord || round.word) || "the target word";
}

function targetGrapheme(round = {}) {
  return text(round.targetGrapheme || round.target || round.pattern || round.answer) || "target sound";
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

/**
 * Make correction feedback from the round's literacy construct. The response
 * always identifies both the selected response and the target contrast.
 */
export function feedbackForOutcome(round = {}, outcome = {}, attempt = 1) {
  const construct = text(round.construct || round.mechanicId || round.type).toLowerCase();
  const selected = selectedLabel(outcome);
  const target = targetGrapheme(round);
  const word = targetWord(round);
  const chosenWord = selectedWord(round, outcome);
  const level = Math.max(1, positiveInteger(attempt) || 1);

  if (outcome.correct) {
    return `Yes — ${selected} matches ${word}.`;
  }

  if (construct.includes("initial") || construct === "scenehunt" || construct === "hunt") {
    const chosenOnset = text(outcome.selectedGrapheme) || onset(chosenWord) || selected;
    return coaching(
      level,
      `${chosenOnset} starts ${chosenWord}. Listen for /${target}/ at the start of ${word}.`,
      `Say ${chosenWord}, then isolate its first sound. The target starts /${target}/, as in ${word}.`
    );
  }

  if (construct.includes("ending") || construct.includes("pattern") || construct === "patternsort") {
    const chosenPattern = text(outcome.selectedPattern) || ending(chosenWord);
    return coaching(
      level,
      `${chosenWord} ends with ${chosenPattern}. Listen for /${target}/ at the end of ${word}.`,
      `Look at the ending of ${chosenWord}, then compare it with /${target}/ at the end of ${word}.`
    );
  }

  if (construct.includes("phoneme") || construct.includes("grapheme") || construct === "soundgate" || construct === "sound") {
    return coaching(
      level,
      `You chose ${selected}. Listen for /${target}/ and choose ${target}.`,
      `Say the sound slowly, then match /${target}/ to the grapheme ${target}; you chose ${selected}.`
    );
  }

  if (construct.includes("high_frequency") || construct.includes("recognition") || construct === "wordwindow" || construct === "quick") {
    return coaching(
      level,
      `You chose ${selected}. Look at the whole word: ${word}.`,
      `Reveal the word one part at a time, then find ${word}; you chose ${selected}.`
    );
  }

  if (construct.includes("encoding") || construct === "soundboxes" || construct === "build") {
    return coaching(
      level,
      `${selected} is not the word you heard. Listen again and build ${word}.`,
      `Say ${word}, stretch each sound, and place its graphemes in order; you chose ${selected}.`
    );
  }

  if (construct.includes("substitution") || construct.includes("removal") || construct.includes("compound") || construct === "wordmachine" || construct === "play") {
    const after = text(round.afterWord || round.answer) || "the new word";
    return coaching(
      level,
      `You chose ${selected}. Start with ${text(round.beforeWord) || "the first word"}; the target change makes ${after}.`,
      `Watch the word parts: change or remove only the stated part to make ${after}; you chose ${selected}.`
    );
  }

  if (construct.includes("connected_print") || construct === "poemspotlight" || construct === "poem") {
    return coaching(
      level,
      `You chose ${selected}. Find ${word} in the printed line.`,
      `Track the line from the beginning and stop on ${word}; you chose ${selected}.`
    );
  }

  if (construct.includes("cover") || construct === "coverclue" || construct === "story") {
    return coaching(
      level,
      `You placed ${selected}. Match the title strip to the ${word} cover.`,
      `Read the title strip, then place it on ${word}; you chose ${selected}.`
    );
  }

  if (construct.includes("formation") || construct === "lettertrace" || construct === "trace") {
    const dimension = text(outcome.dimension || outcome.errorDimension || "start, order, direction, or coverage");
    return coaching(
      level,
      `Your trace of ${selected} needs a clearer ${dimension}. Watch the model, then trace ${word}.`,
      `Start at the marked point and follow the direction through ${word}; your trace was ${selected}.`
    );
  }

  return coaching(
    level,
    `You chose ${selected}. Compare it with the target ${word} (${target}).`,
    `Look closely at ${word} and compare it with your response ${selected}; the target is ${target}.`
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
  const complete = total > 0 && completed >= total && firstAttempts.length === total
    && firstAttempts.every(attempt => typeof attempt === "boolean");

  let stars = 0;
  if (complete) {
    if (independent === total) stars = 3;
    else if (independent / total >= 0.7) stars = 2;
    else stars = 1;
  } else if (completed > 0 && firstAttempts.some(attempt => attempt === false)) {
    // A run with a supported recovery has earned the one-star practice
    // result even while the caller is still working through its blueprint.
    stars = 1;
  }
  return { stars, independentPercent };
}
