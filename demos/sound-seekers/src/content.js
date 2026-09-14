/** Authored, supported phonics practice for the Lantern Wood demo.
 * The basket asks about spoken onsets; the bridge asks for one initial letter;
 * the flowers build complete three-phoneme CVC words. These are separate skills.
 * Source paths and file hashes are recorded in source/audio-provenance.json.
 */
export const NARRATION = Object.freeze({
  intro: 'The lantern tree has gone dark! Follow the path. Help three forest friends bring back its light.',
  picnic: 'Help pack the sound basket. Listen to the sound. Tap a picture that starts with it.',
  brook: 'The bridge is missing its stones. Listen to the word. Tap the missing first letter.',
  lanterns: 'The lantern flowers are sleeping. Listen to the word. Tap the sound seeds in order.',
  finish: 'You did it! The lantern tree is glowing again. You helped every friend. Let\'s explore!',
  'picnic-complete': 'The sound basket is full! Follow the path to the brook.',
  'brook-complete': 'The bridge is ready! Cross over to the lantern flowers.',
  'lanterns-complete': 'All six flowers are glowing! Follow the lights back to the lantern tree.',
  'listen-sound': 'Listen to the sound. Tap a picture that starts with it.',
  'first-letter': 'Listen to the word. Tap its missing first letter.',
  'build-word': 'Listen to the word. Tap the sounds in order.',
  wrong: 'Try again. Listen closely.',
  'different-sound': 'That one starts with a different sound. Listen again.',
  'next-sound': 'Listen for the next sound.',
  'starts-with': 'starts with',
  'first-sound-is': 'The first sound is',
  'you-built': 'You built',
  correct: 'You found it!',
});

const PICTURE_EXTENSIONS = Object.freeze({ pig: 'png' });
const picture = word => `/assets/pictures/${word}.${PICTURE_EXTENSIONS[word] || 'webp'}`;
const wordChoice = word => Object.freeze({
  id: word, label: word, picture: picture(word), audio: `word:${word}`,
});
const letterChoice = letter => Object.freeze({
  id: letter, label: letter, audio: `phoneme:${letter}`,
});

const basketRound = (word, otherWords) => Object.freeze({
  id: `picnic-${word}`, word, picture: picture(word), target: word[0],
  answer: word,
  instruction: `Find a picture that starts with /${word[0]}/.`,
  choices: Object.freeze(otherWords.map(wordChoice)),
  // Naming every picture makes this accessible to pre-readers and English
  // learners. The UI must show those pictures before it plays this sequence.
  promptAudio: Object.freeze(['listen-sound', `phoneme:${word[0]}`]),
  choiceAudio: Object.freeze(otherWords.map(item => `word:${item}`)),
  hintAudio: Object.freeze([`word:${word}`, 'starts-with', `phoneme:${word[0]}`]),
  correctAudio: Object.freeze([`word:${word}`, 'starts-with', `phoneme:${word[0]}`]),
  correctText: `${word} starts with /${word[0]}/.`,
});

const bridgeRound = (word, letters) => Object.freeze({
  id: `brook-${word}`, word, picture: picture(word), target: word[0],
  answer: word[0], maskedWord: `_${word.slice(1)}`,
  phonemes: Object.freeze([...word]),
  instruction: 'Tap the missing first letter.',
  choices: Object.freeze(letters.map(letterChoice)),
  promptAudio: Object.freeze(['first-letter', `word:${word}`]),
  hintAudio: Object.freeze([`word:${word}`, 'first-sound-is', `phoneme:${word[0]}`]),
  correctAudio: Object.freeze([`phoneme:${word[0]}`, `word:${word}`]),
  correctText: `${word[0]} completes ${word}.`,
});

const flowerRound = (word, letters) => Object.freeze({
  id: `lanterns-${word}`, word, picture: picture(word), target: word,
  answer: word, phonemes: Object.freeze([...word]),
  instruction: 'Tap the sounds in order.',
  choices: Object.freeze(letters.map(letterChoice)),
  promptAudio: Object.freeze(['build-word', `word:${word}`]),
  hintAudio: Object.freeze([...word].map(letter => `phoneme:${letter}`)),
  correctAudio: Object.freeze(['you-built', `word:${word}`]),
  correctText: `You built ${word}!`,
});

export const MISSIONS = Object.freeze([
  Object.freeze({
    id: 'picnic', title: 'The Sound Basket',
    instruction: 'Tap a picture with the sound you hear.',
    intro: NARRATION.picnic, complete: NARRATION['picnic-complete'],
    introAudio: 'picnic', completeAudio: 'picnic-complete',
    construct: 'spoken-initial-phoneme-matching',
    rounds: Object.freeze([
      basketRound('map', ['map', 'cat', 'sun']),
      basketRound('sun', ['dog', 'sun', 'mug']),
      basketRound('mug', ['soap', 'pig', 'mug']),
      basketRound('sock', ['sock', 'bag', 'map']),
      basketRound('moon', ['pot', 'moon', 'dog']),
      basketRound('soap', ['cat', 'log', 'soap']),
    ]),
  }),
  Object.freeze({
    id: 'brook', title: 'The Word Bridge',
    instruction: 'Tap the missing first letter.',
    intro: NARRATION.brook, complete: NARRATION['brook-complete'],
    introAudio: 'brook', completeAudio: 'brook-complete',
    construct: 'initial-grapheme-from-spoken-cvc-word',
    rounds: Object.freeze([
      bridgeRound('cat', ['c', 'm', 's']),
      bridgeRound('bag', ['p', 'b', 'd']),
      bridgeRound('dog', ['b', 'm', 'd']),
      bridgeRound('pig', ['p', 'b', 'd']),
      bridgeRound('pot', ['c', 'p', 'm']),
      bridgeRound('log', ['d', 'n', 'l']),
    ]),
  }),
  Object.freeze({
    id: 'lanterns', title: 'The Lantern Garden',
    instruction: 'Tap the sound seeds to build the word.',
    intro: NARRATION.lanterns, complete: NARRATION['lanterns-complete'],
    introAudio: 'lanterns', completeAudio: 'lanterns-complete',
    construct: 'ordered-three-phoneme-cvc-spelling',
    rounds: Object.freeze([
      flowerRound('bed', ['d', 'b', 'e']),
      flowerRound('net', ['e', 't', 'n']),
      flowerRound('pen', ['n', 'p', 'e']),
      flowerRound('bug', ['u', 'g', 'b']),
      flowerRound('cup', ['p', 'u', 'c']),
      flowerRound('van', ['a', 'v', 'n']),
    ]),
  }),
]);

export const DEMO_WORDS = Object.freeze(MISSIONS.flatMap(mission => mission.rounds.map(round => round.word)));

/** Fresh spatial choices on replay; keep spoken words and phonemes ordered.
 * The caller owns/save-restores the resulting choice IDs for an unfinished run.
 */
export function shuffledChoices(round, random = Math.random) {
  const choices = [...round.choices];
  for (let i = choices.length - 1; i > 0; i -= 1) {
    const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1))));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

/** Specific, non-punitive feedback. A wrong seed never clears correct seeds. */
export function wrongFeedback(missionId, round, selectedId, nextIndex = 0) {
  if (missionId === 'picnic') {
    const selectedSound = selectedId[0] === 'c' ? 'k' : selectedId[0];
    return {
      text: `${selectedId} starts with /${selectedSound}/. Find /${round.target}/.`,
      audio: [`word:${selectedId}`, 'starts-with', `phoneme:${selectedId[0]}`, 'listen-sound', `phoneme:${round.target}`],
    };
  }
  const expected = missionId === 'lanterns' ? round.phonemes[nextIndex] : round.target;
  return {
    text: missionId === 'lanterns' ? 'That seed makes a different sound. Listen for the next one.' : `${selectedId} is a different first sound. Listen again.`,
    audio: [`phoneme:${selectedId}`, missionId === 'lanterns' ? 'next-sound' : 'first-sound-is', `phoneme:${expected}`],
  };
}
