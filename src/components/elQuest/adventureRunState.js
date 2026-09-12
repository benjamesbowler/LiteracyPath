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
      return model(`These pictures start with /${target}/.`, matchingWords(round));
    case "wordMemory":
      return model("Find two cards with the same word.", round.words);
    case "letterGrid":
      return model("Find these big and small letters.", round.targetLetters.flatMap(letter => [letter.toUpperCase(), letter]));
    case "missingLetter":
      return model(`Choose ${round.missingGrapheme} to ${round.missingPosition === "start" ? "start" : "finish"} ${round.word}.`, round.graphemes);
    case "rhymePair":
      return model(`${rhymePair(round).join(" and ")} rhyme.`, rhymePair(round));
    case "rhymeOdd":
      return model(`${round.answer} does not rhyme with ${rhymePair(round).join(" and ")}.`, [round.answer]);
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
    case "pictureSearch":
      return correct ? `You found the pictures that start with /${target}/.`
        : `${selected} does not start with /${target}/. ${furtherHelp ? `Try ${matchingWords(round)[0]}.` : "Listen to its first sound."}`;
    case "wordMemory":
      return correct ? "You found the matching words."
        : `${selected} are different words. ${furtherHelp ? "Look at all the letters in each word." : "Turn over two matching words."}`;
    case "letterGrid":
      return correct ? `You found big and small ${round.targetLetters.join(" and ")}.`
        : `${selected} is a different letter. Find big and small ${round.targetLetters.join(" and ")}.`;
    case "missingLetter": {
      const position = round.missingPosition === "start" ? "first" : "last";
      return correct ? `${round.missingGrapheme} is the ${position} letter in ${round.word}.`
        : `${selected} does not ${round.missingPosition === "start" ? "start" : "finish"} ${round.word}. ${furtherHelp ? `Choose ${round.missingGrapheme}.` : `Listen for the ${position} sound.`}`;
    }
    case "rhymePair":
      return correct ? `${rhymePair(round).join(" and ")} rhyme.`
        : `${selected} do not rhyme. ${furtherHelp ? `Listen to ${rhymePair(round).join(" and ")}.` : "Listen to the ends of the words."}`;
    case "rhymeOdd":
      return correct ? `${round.answer} does not rhyme with ${rhymePair(round).join(" and ")}.`
        : `${selected} belongs to the rhyming pair. ${furtherHelp ? `Listen to ${round.answer}.` : "Find the word with a different ending sound."}`;
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
    recoveries: 0
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
