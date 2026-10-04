// Authored examples describe the real action, never a live answer or result.
export const ARCADE_GUIDE_EXAMPLES = Object.freeze({
  'tower-tumble': { kind: 'jump', instruction: 'Pick letters in order to build each word.', target: 'Picture + audio', pieces: ['?', '?', '?'], steps: ['Look at the picture and hear the word.', 'Use the ladders and Jump to reach a brick.', 'Smash each needed sound part. A fall keeps your correct parts.'] },
  'rally-pals': { kind: 'aim', instruction: 'Follow the sound.', target: 'Picture + audio', pieces: ['?', '?', '?'], steps: ['Hear the cue before the untimed serve.', 'Choose a court zone and Swing; your aim makes the sound choice.', 'Move, return and Lob during the rally. A missed ball is a motor miss.'] },
  'burrow-builders': { kind: 'place', instruction: 'Pick letters in order to build each word.', target: 'Picture + audio', pieces: ['?', '?', '?'], steps: ['Look at the blueprint picture and hear its word.', 'Place the sound parts in spoken order; mistakes can be repaired.', 'Use ordinary blocks to extend, reshape and decorate your island.'] },
  'drum-trail': { kind: 'choose', frameMilliseconds: 1600, instruction: 'Listen to the word. Choose the crossing with that many syllables.', target: 'rabbit', pieces: ['1 drum', '2 drums', '3 drums'], matchedIndex: 1, steps: ['This example uses rabbit. Listen to the whole word.', 'Rabbit has two spoken parts: rab-bit.', 'Choose the crossing with two drums. Your own word may need a different count.'] },
  'lantern-lagoon': { kind: 'choose', frameMilliseconds: 2400, instruction: 'Read or listen to the sentence. Light the matching scene.', target: 'The cat is on the mat.', pieces: ['cat in a box', 'cat on a mat', 'cat by a log'], matchedIndex: 1, steps: ['This example says: The cat is on the mat.', 'Compare all three scenes with the sentence.', 'Light the cat on the mat. Your own sentence may describe another scene.'] },
  'rocket-run': { kind: 'steer', target: 's', pieces: ['sun', 'fish', 'cat'], steps: ['Look for the beginning sound: s.', 'Steer left or right toward sun.', 'Catch sun. It begins with s.'] },
  'letter-leap': { kind: 'jump', target: 'cat', pieces: ['c', 'a', 't'], steps: ['Hear the word: cat.', 'Move to c, then jump through it.', 'Jump through a, then t: cat.'] },
  'word-climb': { kind: 'climb', instruction: 'Climb up, then jump to a word that starts with the sound.', target: 's', pieces: ['cat', 'sun', 'fish'], steps: ['Hold up to climb to a word station.', 'Choose sun: it starts with s.', 'Tap sun, or choose it and press Space to jump.'] },
  'sound-racer': { kind: 'steer', target: 's', pieces: ['sun', 'fish', 'cat'], steps: ['Look for the beginning sound: s.', 'Steer toward the sun gate.', 'Drive through sun. It begins with s.'] },
  'word-bridge': { kind: 'place', target: 'cat', pieces: ['c', 'a', 't'], steps: ['Look at the model: cat.', 'Move to c and pick it up.', 'Place c, then a, then t on the bridge.'] },
  'sound-beat': { kind: 'beat', instruction: 'Tap each sound on the beat, then blend it into the word.', target: 'cat', pieces: ['c', 'a', 't'], steps: ['Watch the c note reach the line.', 'Tap as c, a, then t reach the line.', 'The finished sounds blend into cat.'] },
  'rhyme-pop': { kind: 'aim', target: 'cat', pieces: ['hat', 'sun', 'bat'], steps: ['Hear the rhyme word: cat.', 'Aim at hat: cat and hat rhyme.', 'Pop hat, then find another rhyme.'] },
  'sound-safari': { kind: 'catch', target: 'cat', pieces: ['c', 'a', 't'], steps: ['Hear the whole word: cat.', 'Move the net to c and catch it.', 'Catch a, then t in order.'] },
  'reel-read': { kind: 'catch', target: 'sun + ?', pieces: ['shine', 'fish', 'cat'], steps: ['Read the clue: make sunshine.', 'Steer the boat over shine.', 'Cast to catch shine: sunshine.'] },
  'star-gallery': { kind: 'catch', target: 'I ? a cat.', pieces: ['see', 'blue', 'on'], steps: ['Read the sentence: I ? a cat.', 'Drive to see: I see a cat.', 'Cut the matching tree.'] },
  'sentence-express': { kind: 'choose', target: 'The cat sat.', pieces: ['The', 'cat', 'sat.'], steps: ['Start the sentence with The.', 'Tap cat, then sat.', 'The finished sentence sends the train off.'] },
  'grammar-grind': { kind: 'steer', instruction: 'Skate through each sound part in order to build the word.', target: 'cat', pieces: ['c', 'a', 't'], steps: ['Hear the word: cat.', 'Steer through c, then a, then t.', 'Read cat, then skate through its matching gate.'] },
  'soundkeys': { kind: 'choose', instruction: 'Press the sound keys in order to build the word.', target: 'cat', pieces: ['c', 'a', 't'], steps: ['Hear the word: cat.', 'Press c, a, then t in order.', 'Read the word you built: cat.'] }
});

export function arcadeGuideForGame(game, { difficulty } = {}) {
  if (game?.id === 'burrow-builders' && difficulty === 'hard') return {
    kind: 'place', instruction: 'Read the plan and choose a place to build.',
    target: 'Read the plan', pieces: ['1', '2', '3'],
    steps: ['Read the building instruction.', 'Compare the three marked places and build where the plan says.', 'Use ordinary blocks to extend, reshape and decorate your island.']
  };
  const example = ARCADE_GUIDE_EXAMPLES[game?.id];
  return example ? { ...example, instruction: example.instruction || game.description } : null;
}
