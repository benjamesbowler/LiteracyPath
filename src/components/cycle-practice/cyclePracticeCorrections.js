import { CYCLE_PRACTICE_CORRECTIONS, CYCLE_PRACTICE_INSTRUCTIONS } from './cyclePracticeAudioScripts.js';
import { getCyclePracticeFeedbackAudio, getCyclePracticeInstructionAudio, getCyclePracticeWordAudio } from './cyclePracticeAudio.js';
import { CYCLE_SOUND_WORDS, cycleSoundMatches } from '../../data/cycleSoundWords.js';
import { getPreferredPhonemeAudioPath } from '../../data/phonemeAudioBank.js';

const soundName = value => `/${value}/`;
const wordName = value => String(value || '').replace(/^./, letter => letter.toUpperCase());
const phrase = key => getCyclePracticeInstructionAudio(CYCLE_PRACTICE_CORRECTIONS[key]);

function soundForWord(word, position) {
  return Object.keys(CYCLE_SOUND_WORDS).sort((a, b) => b.length - a.length)
    .find(grapheme => cycleSoundMatches(word, grapheme, position) && getPreferredPhonemeAudioPath(grapheme));
}

/** The incorrect choice and actual target remain distinct in a supported retry. */
export function cyclePracticeCorrection(round = {}, outcome = {}, mode = 'practice') {
  if (mode === 'assessment') return { text: 'Not quite', sequence: [getCyclePracticeFeedbackAudio('notQuite')] };
  const selected = round.choices?.find(choice => String(choice.value) === String(outcome.selected));
  const word = round.targetWord || '';
  const target = round.mechanicId === 'soundSort' ? round.answer : round.targetGrapheme || round.answer;
  const wordAudio = round.audio || getCyclePracticeWordAudio(word);
  const targetAudio = round.mechanicId === 'soundSort' ? getPreferredPhonemeAudioPath(target) : round.soundAudio || getPreferredPhonemeAudioPath(target);
  let text;
  let sequence;
  if (round.mechanicId === 'letterMatch' && round.variant === 'letterCase') {
    text = `${selected?.label || outcome.selected} is a different letter. Match ${round.model}.`;
    sequence = [getCyclePracticeInstructionAudio(CYCLE_PRACTICE_INSTRUCTIONS.letterCase), round.audio];
  } else if ((round.mechanicId === 'letterMatch' && round.variant === 'wordListen') || round.variant === 'wordMeaning') {
    text = `${wordName(selected?.label || outcome.selected)} is a different word. Find ${word}.`;
    sequence = [selected?.audio, phrase('differentWord'), phrase('targetWord'), wordAudio];
  } else if (round.mechanicId === 'rhymeMatch') {
    const match = round.choices?.find(choice => String(choice.value) === String(round.answer));
    text = `${wordName(selected?.label || outcome.selected)} and ${word} have different endings. Listen to ${match?.label || round.answer} and ${word}.`;
    sequence = [selected?.audio, wordAudio, phrase('rhyme'), match?.audio, wordAudio];
  } else if (round.mechanicId === 'soundSort' && round.variant === 'syllableSort') {
    text = `Listen to ${word}. Tap once for each beat.`;
    sequence = [phrase('beats'), wordAudio];
  } else if (['pictureSound', 'letterMatch', 'soundSort'].includes(round.mechanicId)) {
    const ending = round.soundPosition === 'ending';
    const sound = ending ? 'ends' : 'starts';
    if (round.mechanicId === 'pictureSound') {
      const chosenWord = selected?.value || outcome.selected;
      const chosenSound = soundForWord(chosenWord, ending ? 'ending' : 'first');
      text = chosenSound
        ? `${wordName(chosenWord)} ${sound} with ${soundName(chosenSound)}. Find ${soundName(target)}.`
        : `Listen to ${chosenWord}. Find the ${ending ? 'ending' : 'first'} sound ${soundName(target)}.`;
      sequence = [selected?.audio, phrase(ending ? 'endingSound' : 'firstSound'), getPreferredPhonemeAudioPath(chosenSound), phrase('targetSound'), targetAudio];
    } else {
      text = `${wordName(word)} ${sound} with ${soundName(target)}. ${round.mechanicId === 'soundSort' ? 'Put it with' : 'Find'} ${soundName(target)}.`;
      sequence = [selected?.audio, phrase('differentSound'), wordAudio, phrase(ending ? 'endingSound' : 'firstSound'), targetAudio];
    }
  } else {
    const expected = Array.isArray(round.answer) ? round.answer : round.letters || round.graphemes || [...String(round.answer || word)];
    const selectedLetters = Array.isArray(outcome.selected) ? outcome.selected : [];
    const index = round.variant === 'wordComplete' ? round.missingIndex : round.variant === 'wordChange' ? round.changeIndex
      : Math.max(0, selectedLetters.findIndex((letter, i) => String(letter) !== String(expected[i])));
    const copying = Boolean(round.modelWord || round.variant === 'highFrequency');
    text = copying ? `Look at ${round.modelWord || word}. Match its next letter.` : `In ${word}, listen for ${soundName(expected[index])} next.`;
    sequence = copying
      ? [getCyclePracticeInstructionAudio(CYCLE_PRACTICE_INSTRUCTIONS.copyWord), wordAudio]
      : [phrase('wordBuild'), wordAudio, getPreferredPhonemeAudioPath(expected[index])];
  }
  return { text, sequence: sequence.filter(Boolean) };
}
