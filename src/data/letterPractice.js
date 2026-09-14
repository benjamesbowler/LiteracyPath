import { getAllLetters, getLessonByLetter } from "./phonicsLessons.js";
import { strokesForChar } from "./letterStrokes.js";
import { LETTER_PRACTICE_ROUNDS, letterPracticeQuestionCount } from "../policy/letterPractice.js";
import { CYCLE_PRACTICE_INSTRUCTION_AUDIO } from "./generated/cyclePracticeInstructionAudio.generated.js";
import { ADVENTURE_MAP_INSTRUCTION_AUDIO } from "./generated/adventureMapInstructionAudio.generated.js";
import { getLedaProductionAudioPath } from "./ledaProductionAudio.js";

function randomSource(seed) {
  let state = [...String(seed)].reduce((n, char) => Math.imul(n ^ char.charCodeAt(0), 16777619), 2166136261) >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}
function shuffled(items, random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}
export function getLetterPracticeTraceLesson(lesson, round) {
  if (round === 1) return lesson;
  const character = LETTER_PRACTICE_ROUNDS[round - 1].traceCase === "lower" ? lesson.letter.toLowerCase() : lesson.letter;
  const paths = strokesForChar(character);
  return { ...lesson, letter: character, traceSVG: paths.map(path => {
    let index = 0;
    return path.replace(/-?\d+(?:\.\d+)?/g, value => String(Number(value) * 2.4 + (index++ % 2 ? 24 : 80)));
  }).join(" ") };
}

// C and K share the taught /k/ sound; they can never oppose one another in
// a heard-sound question. Printed-letter matching has a different contract.
export const letterPracticeSoundKey = letter => ["C", "K"].includes(letter.toUpperCase()) ? "k" : letter.toLowerCase();

export function buildLetterPracticeQuestions({ letter, round, step, seed, reviewLetters = [] }) {
  const lesson = getLessonByLetter(letter);
  const activity = LETTER_PRACTICE_ROUNDS[round - 1]?.activities[step - 2];
  if (!lesson || !activity || ["listen", "match"].includes(activity)) return [];
  const random = randomSource(`${seed}:${lesson.letter}:${round}:${step}`);
  const allLetters = getAllLetters();
  const review = shuffled([...new Set(reviewLetters.map(value => value.toUpperCase()))]
    .filter(value => value !== lesson.letter && allLetters.includes(value)), random);
  const words = shuffled(lesson.words, random);
  const modes = ["picture-word", "letter-pair", "letter-sound", "word-letter"];
  const questions = Array.from({ length: letterPracticeQuestionCount(round) }, (_, index) => {
    const mode = activity === "mixed" ? modes[index % modes.length] : activity;
    const isReview = mode !== "picture-word" && review.length && index % 2 === 1;
    const targetLesson = isReview ? getLessonByLetter(review[Math.floor(index / 2) % review.length]) : lesson;
    const targetLetter = targetLesson.letter;
    const targetWord = targetLesson === lesson ? words[index % words.length] : targetLesson.words[index % targetLesson.words.length];
    const upper = (index + step) % 2 === 0;
    const displayLetter = upper ? targetLetter : targetLetter.toLowerCase();
    const letterDistractors = shuffled(allLetters.filter(value => value !== targetLetter
      && (mode !== "letter-sound" || letterPracticeSoundKey(value) !== letterPracticeSoundKey(targetLetter))), random).slice(0, 2);
    const wordDistractors = shuffled([...targetLesson.words, ...targetLesson.distractors].filter(word => word.word !== targetWord.word), random).slice(0, 2);
    const pictureChoices = mode === "picture-word";
    const answer = pictureChoices ? targetWord.word : displayLetter;
    const options = pictureChoices
      ? [targetWord, ...wordDistractors].map(word => ({ id: word.word, label: word.word, image: word.image, audio: word.audio }))
      : [targetLetter, ...letterDistractors].map(value => ({ id: upper ? value : value.toLowerCase(), label: upper ? value : value.toLowerCase() }));
    const ending = targetLesson.matchPosition === "end";
    return {
      id: `${lesson.letter}:${round}:${step}:${index}`, mode, answer, targetLetter, targetWord,
      targetDisplay: mode === "letter-pair" ? (upper ? targetLetter.toLowerCase() : targetLetter) : displayLetter,
      prompt: mode === "picture-word" ? "Listen. Find the picture." : mode === "letter-sound" ? "Listen. Find the letter."
        : mode === "letter-pair" ? "Match the big and little letters." : `Find the ${ending ? "last" : "first"} letter.`,
      construct: mode === "picture-word" ? "spoken_word_picture_matching" : mode === "letter-sound" ? "heard_sound_letter_matching"
        : mode === "letter-pair" ? "letter_case_matching" : ending ? "printed_ending_matching" : "printed_onset_matching",
      audio: mode === "picture-word" || mode === "word-letter" ? targetWord.audio
        : mode === "letter-sound" ? targetLesson.phonicAudio : getLedaProductionAudioPath(targetLetter, ["letter_name"]),
      instructionAudio: mode === "picture-word" ? CYCLE_PRACTICE_INSTRUCTION_AUDIO["listen. tap the picture"]
        : mode === "letter-pair" ? CYCLE_PRACTICE_INSTRUCTION_AUDIO["tap the matching letter"]
          : mode === "letter-sound" ? ADVENTURE_MAP_INSTRUCTION_AUDIO["listen. choose the letter for this sound"]
            : ADVENTURE_MAP_INSTRUCTION_AUDIO[`choose the ${ending ? "last" : "first"} letter`],
      options: shuffled(options, random)
    };
  });
  return questions;
}
