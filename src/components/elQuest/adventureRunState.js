import { isIndependentOutcome } from "../../policy/outcomeIndependence.js";

// First attempts remain immutable during supported retry. These helpers name
// the direct learning action; retired gate/assembly instructions cannot return
// through the correction path after a child makes a mistake.
function positiveInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}
const text = value => String(value ?? "").trim();
const values = value => Array.isArray(value) ? value : [value];
function selectedLabel(round, outcome) {
  return values(outcome.selected).map(value => {
    if (value && typeof value === "object") return text(value.word || value.letter || value.label || value.grapheme);
    const item = [...(round.cells || []), ...(round.objects || [])].find(item => text(item.id) === text(value));
    return text(item?.letter || item?.word || value);
  }).filter(Boolean).join(" and ") || "that one";
}
function matchingWords(round) {
  return (round.objects || []).filter(item => item.matches).map(item => item.word);
}
function rhymePair(round) { return round.rhymingWords || round.correctPairs?.[0] || []; }
function model(instruction, units) {
  const cleaned = values(units).flat().map(text).filter(Boolean);
  return instruction && cleaned.length ? { label: "Try this", instruction, units: cleaned } : null;
}
export function correctionModelForOutcome(round = {}) {
  const target = text(round.targetGrapheme);
  switch (round.mechanicId) {
    case "letterPair":
      return model(`Find ${round.partnerForm}.`, [round.modelForm, "→", round.partnerForm]);
    case "soundChoice":
      return model(`Choose ${round.acceptedAnswers.join(" or ")}.`, round.acceptedAnswers);
    case "sceneHunt":
    case "pictureSearch":
      return round.variant === 'wordMeaning' ? model(`Find the ${round.targetWord}.`, matchingWords(round))
        : round.endingUnit === 'chunk' ? model(`Find pictures with the ${target} ending.`, matchingWords(round))
        : model(`These pictures ${round.soundPosition === 'ending' ? 'end' : 'start'} with /${target}/.`, matchingWords(round));
    case "wordMemory":
      return model("Find two cards with the same word.", round.words);
    case "sightWordChoice":
      return model(`Find ${round.answer}.`, round.answer);
    case "letterGrid":
      return model("Find these big and small letters.", round.targetLetters.flatMap(letter => [letter.toUpperCase(), letter]));
    case "missingLetter":
      return model(`Choose ${round.missingGrapheme} for the ${round.missingPosition === 'start' ? 'first' : round.missingPosition === 'middle' ? 'middle' : 'last'} letter in ${round.word}.`, round.graphemes);
    case "rhymePair":
      return model(`${rhymePair(round).join(" and ")} rhyme.`, rhymePair(round));
    case "compoundPicture":
      return model(`${round.parts.map(part => part.word).join(" and ")} make ${round.answer}.`, [...round.parts.map(part => part.word), "→", round.answer]);
    default:
      return null;
  }
}
export function feedbackForOutcome(round = {}, outcome = {}, attempt = 1) {
  const selected = selectedLabel(round, outcome);
  const target = text(round.targetGrapheme);
  const furtherHelp = positiveInteger(attempt) > 1;
  const correct = Boolean(outcome.correct);
  switch (round.mechanicId) {
    case "letterPair":
      return correct ? `${round.modelForm} and ${round.partnerForm} are the same letter.`
        : `${selected} is a different letter. Find the ${round.partnerForm === round.partnerForm.toUpperCase() ? "big" : "small"} ${furtherHelp ? round.partnerForm : target}.`;
    case "soundChoice":
      return correct ? `${selected} matches the ${round.soundPosition === "end" ? "ending" : "sound"} you heard.`
        : `${selected} has a different sound. ${furtherHelp ? `Choose ${target}.` : "Listen again."}`;
    case "sceneHunt":
    case "pictureSearch": {
      if (round.variant === 'wordMeaning') return correct ? `You found the ${round.targetWord}.`
        : `${selected} is a different picture. ${furtherHelp ? `Find the ${round.targetWord}.` : 'Listen again.'}`;
      if (round.endingUnit === 'chunk') return correct ? `You found the ${target} ending.`
        : `${selected} has a different ending. ${furtherHelp ? `Try ${matchingWords(round)[0]}.` : 'Listen to the ending again.'}`;
      const ending = round.soundPosition === 'ending';
      return correct ? `You found the pictures that ${ending ? 'end' : 'start'} with /${target}/.`
        : `${selected} does not ${ending ? 'end' : 'start'} with /${target}/. ${furtherHelp ? `Try ${matchingWords(round)[0]}.` : `Listen to its ${ending ? 'last' : 'first'} sound.`}`;
    }
    case "wordMemory":
      return correct ? "You found the matching words."
        : `${selected} are different words. ${furtherHelp ? "Look at all the letters in each word." : "Turn over two matching words."}`;
    case "sightWordChoice":
      return correct ? `You found ${round.answer}.`
        : `${selected} is a different word. ${furtherHelp ? `Find ${round.answer}.` : "Listen again."}`;
    case "letterGrid":
      return correct ? `You found big and small ${round.targetLetters.join(" and ")}.`
        : `${selected} is a different letter. Find big and small ${round.targetLetters.join(" and ")}.`;
    case "missingLetter": {
      const position = round.missingPosition === "start" ? "first" : round.missingPosition === 'middle' ? 'middle' : "last";
      return correct ? `${round.missingGrapheme} is the ${position} letter in ${round.word}.`
        : `${selected} is not the ${position} letter in ${round.word}. ${furtherHelp ? `Choose ${round.missingGrapheme}.` : `Listen for the ${position} sound.`}`;
    }
    case "rhymePair":
      return correct ? `${rhymePair(round).join(" and ")} rhyme.`
        : `${selected} do not rhyme. ${furtherHelp ? `Listen to ${rhymePair(round).join(" and ")}.` : "Listen to the ends of the words."}`;
    case "compoundPicture":
      return correct ? `${round.parts.map(part => part.word).join(" and ")} make ${round.answer}.`
        : `${selected} is a different word. ${furtherHelp ? `Together the pictures make ${round.answer}.` : `Say ${round.parts.map(part => part.word).join(" and ")} together.`}`;
    default:
      return correct ? "You found it." : "Try another one.";
  }
}
export function feedbackForCommittedOutcome(round = {}, outcome = {}, attempt = 1) {
  if (!outcome.correct && positiveInteger(attempt) >= 3) {
    const correction = correctionModelForOutcome(round);
    if (correction) return correction.instruction;
  }
  return outcome.correct && text(outcome.feedback) ? text(outcome.feedback) : feedbackForOutcome(round, outcome, attempt);
}

export function createAdventureRun(total) {
  const count = positiveInteger(total);
  return {
    total: count,
    completed: 0,
    firstAttempts: Array(count).fill(null),
    completedRounds: Array(count).fill(false),
    attempts: Array(count).fill(0),
    questionRecords: Array(count).fill(null),
    recoveries: 0
  };
}

/** Capture the administered task, never reconstruct evidence from a later bank. */
export function adventureQuestionEvidence(round = {}, outcome = {}) {
  const label = value => values(value).flat().map(entry => {
    if (entry && typeof entry === "object") return text(entry.word || entry.label || entry.value || entry.letter);
    const match = [...(round.cells || []), ...(round.objects || []), ...(round.choices || [])]
      .find(item => item && typeof item === "object" && text(item.id || item.value) === text(entry));
    return text(match?.word || match?.label || match?.letter || entry);
  }).filter(Boolean).join(" / ");
  const audioRequired = outcome.evidence?.audioRequired === true;
  const audioDelivered = outcome.evidence?.audioDelivered === true;
  const independent = isIndependentOutcome(outcome) && (!audioRequired || audioDelivered);
  const selected = outcome.selected ?? outcome.selectedAnswer;
  const expected = round.mechanicId === "missingLetter" ? round.missingGrapheme
    : round.answer ?? round.acceptedAnswers ?? round.correctSequence ?? round.correctPairs;
  return {
    questionId: round.roundKey || round.id || "",
    semanticKey: round.semanticKey || round.roundKey || round.id || "",
    itemKey: round.targetGrapheme || round.targetWord || round.word || label(round.targetLetters) || "",
    targetWord: round.targetWord || round.word || "",
    targetSound: round.targetGrapheme || "",
    mechanicId: round.mechanicId || "",
    construct: round.construct || "",
    evidenceConstruct: round.construct || "",
    responseFormat: round.responseFormat || round.mechanicId || "",
    targetKind: round.targetKind || "",
    contrast: round.contrast || "",
    selectedAnswer: selected == null ? "" : label(selected),
    correctAnswer: expected == null ? "" : label(expected),
    audioRequired,
    audioDelivery: audioRequired ? (audioDelivered ? "delivered" : "failed") : "not_required",
    responseStatus: audioRequired && !audioDelivered ? "media_failed"
      : independent ? (outcome.correct ? "correct" : "incorrect") : "supported",
    isCorrect: independent ? Boolean(outcome.correct) : null,
    evidence: { ...(outcome.evidence || {}), independent }
  };
}

export function adventureCheckSnapshot(state = {}, completedAt = "") {
  const total = positiveInteger(state.total);
  const records = state.questionRecords;
  if (!total || state.completed !== total || !completedAt || !Array.isArray(records)
    || records.length !== total || records.some(record => !record?.questionId)) return null;
  return {
    version: 1,
    source: "adventure_map",
    completedAt,
    questionRecords: records.map((record, index) => ({
      ...record,
      attempts: positiveInteger(state.attempts?.[index]),
      completedAfterSupport: state.completedRounds?.[index] === true && state.firstAttempts?.[index] === false
    }))
  };
}

/** Record one committed response without mutating the previous run. */
export function recordAdventureOutcome(state = {}, outcome = {}) {
  const total = positiveInteger(state.total);
  const roundIndex = Number(outcome.roundIndex);
  if (!Number.isInteger(roundIndex) || roundIndex < 0 || roundIndex >= total) return state;
  if (outcome.partial === true || state.completedRounds?.[roundIndex]) return state;

  const firstAttempts = Array.from({ length: total }, (_, index) => (
    typeof state.firstAttempts?.[index] === "boolean" ? state.firstAttempts[index] : null
  ));
  const completedRounds = Array.from({ length: total }, (_, index) => Boolean(state.completedRounds?.[index]) || firstAttempts[index] === true);
  const attempts = Array.from({ length: total }, (_, index) => positiveInteger(state.attempts?.[index]));
  const questionRecords = Array.from({ length: total }, (_, index) => state.questionRecords?.[index] || null);
  const correct = Boolean(outcome.correct);
  const independentCorrect = correct && isIndependentOutcome(outcome);
  const wasFirst = firstAttempts[roundIndex] === null;
  const wasCompleted = completedRounds[roundIndex];

  attempts[roundIndex] += 1;
  if (wasFirst) firstAttempts[roundIndex] = independentCorrect;
  if (wasFirst && outcome.questionRecord) questionRecords[roundIndex] = outcome.questionRecord;
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
    questionRecords,
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
