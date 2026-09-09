// Exact scripts shared by the player and the production-audio generator.
export const CYCLE_PRACTICE_INSTRUCTIONS = Object.freeze({
  firstSound: "Listen. Tap the picture that starts with this sound.",
  endingSound: "Listen. Tap the picture that ends with this sound.",
  endingPart: "Listen. Tap the picture with this ending.",
  letterSound: "Listen. Tap the letters that make this sound.",
  letterCase: "Tap the matching letter.",
  listenWord: "Listen. Tap the word.",
  endingLetterSound: "Listen. Tap the letters that make this sound.",
  letterEndingPart: "Listen. Tap the letters that make this ending.",
  rhymeMatch: "Listen. Tap the picture that rhymes with this word.",
  wordBuild: "Listen. Tap the letters to build the word.",
  wordChange: "Listen. Tap the letter to change. Then tap the new letter.",
  copyWord: "Tap the letters. Make the same word.",
  sortFirstSound: "Listen. Put each picture with its first sound.",
  sortEndingSound: "Listen. Put each picture with its ending sound.",
  sortEndingPart: "Listen. Put each picture with its ending.",
  syllableSort: "Listen. Tap how many beats.",
  letterTrace: "Follow the letter path with your finger."
});

export const CYCLE_PRACTICE_FEEDBACK = Object.freeze({
  correct: "That's right!",
  notQuite: "Not quite. Let's try the next one.",
  retry: "Try again. Listen carefully.",
  traceRetry: "Keep going. Follow the path.",
  complete: "You did it! Great practice!",
  start: "Let's play!",
  resume: "Let's keep going!",
  saved: "All done! Your work is saved.",
  saveRetry: "Let's try saving again.",
  soundUnavailable: "Tap the speaker. Let's listen again.",
  readyForCheck: "Let's try a few by yourself."
});

export const CYCLE_PRACTICE_AUDIO_TEXTS = Object.freeze([...new Set([
  ...Object.values(CYCLE_PRACTICE_INSTRUCTIONS),
  ...Object.values(CYCLE_PRACTICE_FEEDBACK)
])]);
