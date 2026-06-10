/**
 * @typedef {Object} PhonicsWord
 * @property {string} word
 * @property {string} image
 * @property {string} audio
 * @property {string} phonemeBreakdown
 */

/**
 * @typedef {Object} LetterLesson
 * @property {string} letter
 * @property {string} phonicSound
 * @property {string} phonicAudio
 * @property {string} letterNameAudio
 * @property {PhonicsWord[]} words
 * @property {PhonicsWord[]} distractors
 * @property {string} traceSVG
 */

export const letterA = {
  letter: "A",
  phonicSound: "a-a-a",
  phonicAudio: "/audio/a-sound.mp3",
  letterNameAudio: "/audio/a-name.mp3",
  traceSVG: "M 120 320 L 200 80 L 280 320 M 145 220 L 255 220",
  // TODO: Add these image/audio assets to public. Audio currently falls back to Web Speech.
  words: [
    {
      word: "apple",
      image: "/word-apple.png",
      audio: "/audio/apple.mp3",
      phonemeBreakdown: "a-a-apple"
    },
    {
      word: "ant",
      image: "/word-ant.png",
      audio: "/audio/ant.mp3",
      phonemeBreakdown: "a-a-ant"
    },
    {
      word: "alligator",
      image: "/word-alligator.png",
      audio: "/audio/alligator.mp3",
      phonemeBreakdown: "a-a-alligator"
    },
    {
      word: "astronaut",
      image: "/word-astronaut.png",
      audio: "/audio/astronaut.mp3",
      phonemeBreakdown: "a-a-astronaut"
    }
  ],
  distractors: [
    {
      word: "ball",
      image: "/word-ball.png",
      audio: "/audio/ball.mp3",
      phonemeBreakdown: "b-b-ball"
    },
    {
      word: "cat",
      image: "/word-cat.png",
      audio: "/audio/cat.mp3",
      phonemeBreakdown: "c-c-cat"
    },
    {
      word: "dog",
      image: "/word-dog.png",
      audio: "/audio/dog.mp3",
      phonemeBreakdown: "d-d-dog"
    },
    {
      word: "elephant",
      image: "/word-elephant.png",
      audio: "/audio/elephant.mp3",
      phonemeBreakdown: "e-e-elephant"
    }
  ]
};

export const lessons = [
  {
    level: 1,
    levelName: "Initial Sounds",
    levelColor: "#4D96FF",
    letters: [letterA]
  }
];

export function getLessonByLetter(letter) {
  if (!letter) return undefined;

  for (const lesson of lessons) {
    const found = lesson.letters.find(item => item.letter.toLowerCase() === String(letter).toLowerCase());
    if (found) return found;
  }

  return undefined;
}

export function getAllLetters() {
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
}

export function getAvailableLetters() {
  return lessons.flatMap(lesson => lesson.letters.map(item => item.letter));
}
