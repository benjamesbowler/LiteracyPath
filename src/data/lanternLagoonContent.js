// Reviewed literal messages. Each contrast changes meaning in the complete
// supplied sentence; recognising the animal alone cannot solve these scenes.
export { LANTERN_LAGOON_VERSION } from './arcadeContentVersions.js';
const animal = (species, relation, object, action = 'sitting') => ({ species, relation, object, action });
const scene = (id, sentence, band, choices, answer, extra = {}) => Object.freeze({
  id, sentence, band, choices: Object.freeze(choices.map(choice => Object.freeze(choice))), answer, ...extra,
});

export const LANTERN_READING_SCENES = Object.freeze([
  scene('cat-mat', 'The cat is on the mat.', 1, [animal('cat', 'on', 'mat'), animal('cat', 'beside', 'mat'), animal('cat', 'on', 'log')], 0),
  scene('dog-log', 'The dog is on the log.', 1, [animal('dog', 'on', 'log'), animal('dog', 'on', 'mat'), animal('dog', 'beside', 'log')], 0),
  scene('cat-log', 'The cat is on the log.', 1, [animal('cat', 'on', 'mat'), animal('cat', 'beside', 'log'), animal('cat', 'on', 'log')], 2),
  scene('dog-mat', 'The dog is on the mat.', 1, [animal('dog', 'beside', 'mat'), animal('dog', 'on', 'mat'), animal('dog', 'on', 'log')], 1),
  scene('pig-mat', 'The pig is on the mat.', 1, [animal('pig', 'on', 'mat'), animal('pig', 'on', 'log'), animal('pig', 'beside', 'mat')], 0),
  scene('pig-log', 'The pig is on the log.', 1, [animal('pig', 'on', 'mat'), animal('pig', 'on', 'log'), animal('pig', 'beside', 'log')], 1),
  scene('cat-box', 'The cat is in the box.', 2, [animal('cat', 'on', 'box'), animal('cat', 'beside', 'box'), animal('cat', 'in', 'box')], 2),
  scene('dog-box', 'The dog is in the box.', 2, [animal('dog', 'in', 'box'), animal('dog', 'on', 'box'), animal('dog', 'beside', 'box')], 0),
  scene('pig-box', 'The pig is in the box.', 2, [animal('pig', 'beside', 'box'), animal('pig', 'in', 'box'), animal('pig', 'on', 'box')], 1),
  scene('cat-box-on', 'The cat is on the box.', 2, [animal('cat', 'in', 'box'), animal('cat', 'on', 'box'), animal('cat', 'beside', 'box')], 1),
  scene('dog-box-on', 'The dog is on the box.', 2, [animal('dog', 'on', 'box'), animal('dog', 'in', 'box'), animal('dog', 'beside', 'box')], 0),
  scene('pig-box-on', 'The pig is on the box.', 2, [animal('pig', 'in', 'box'), animal('pig', 'beside', 'box'), animal('pig', 'on', 'box')], 2),
  scene('hen-pen', 'The hen is in the pen.', 2, [animal('hen', 'beside', 'pen'), animal('hen', 'in', 'pen'), animal('hen', 'on', 'mat')], 1),
  scene('pig-mud', 'The pig is in the mud.', 2, [animal('pig', 'beside', 'mud'), animal('pig', 'on', 'mat'), animal('pig', 'in', 'mud')], 2),
  scene('cat-bed', 'The cat is on the bed.', 2, [animal('cat', 'on', 'bed'), animal('cat', 'beside', 'bed'), animal('cat', 'on', 'mat')], 0),
  scene('dog-bed', 'The dog is on the bed.', 2, [animal('dog', 'on', 'mat'), animal('dog', 'on', 'bed'), animal('dog', 'beside', 'bed')], 1),
  scene('hen-mat', 'The hen is on the mat.', 2, [animal('hen', 'beside', 'mat'), animal('hen', 'on', 'log'), animal('hen', 'on', 'mat')], 2),
  scene('hen-log', 'The hen is on the log.', 2, [animal('hen', 'on', 'log'), animal('hen', 'on', 'mat'), animal('hen', 'beside', 'log')], 0),
  // Both noun and relation must match: each distractor preserves one feature.
  scene('who-cat-mat', 'The cat is on the mat.', 3, [animal('dog', 'on', 'mat'), animal('cat', 'on', 'mat'), animal('cat', 'beside', 'mat')], 1),
  scene('who-dog-log', 'The dog is on the log.', 3, [animal('dog', 'beside', 'log'), animal('cat', 'on', 'log'), animal('dog', 'on', 'log')], 2),
  scene('who-pig-box', 'The pig is in the box.', 3, [animal('pig', 'in', 'box'), animal('dog', 'in', 'box'), animal('pig', 'on', 'box')], 0),
  scene('who-cat-box', 'The cat is on the box.', 3, [animal('cat', 'in', 'box'), animal('cat', 'on', 'box'), animal('dog', 'on', 'box')], 1),
  scene('who-hen-bed', 'The hen is on the bed.', 3, [animal('hen', 'beside', 'bed'), animal('cat', 'on', 'bed'), animal('hen', 'on', 'bed')], 2),
  scene('who-dog-bed', 'The dog is on the bed.', 3, [animal('dog', 'on', 'bed'), animal('pig', 'on', 'bed'), animal('dog', 'beside', 'bed')], 0),
]);

export const LANTERN_SUPPORTED_SCENES = Object.freeze([
  scene('duck-under-bridge', 'The duck is under the bridge.', 2, [animal('duck', 'on', 'bridge'), animal('duck', 'under', 'bridge'), animal('duck', 'beside', 'bridge')], 1, { layout: 'bridge' }),
  scene('duck-on-bridge', 'The duck is on the bridge.', 2, [animal('duck', 'on', 'bridge'), animal('duck', 'under', 'bridge'), animal('duck', 'beside', 'bridge')], 0, { layout: 'bridge' }),
  scene('duck-beside-bridge', 'The duck is beside the bridge.', 2, [animal('duck', 'on', 'bridge'), animal('duck', 'under', 'bridge'), animal('duck', 'beside', 'bridge')], 2, { layout: 'bridge' }),
  scene('rabbit-eating', 'The rabbit is eating.', 1, [animal('rabbit', 'on', 'grass', 'sleeping'), animal('rabbit', 'on', 'grass', 'eating'), animal('rabbit', 'on', 'grass', 'jumping')], 1),
  scene('rabbit-sleeping', 'The rabbit is sleeping.', 1, [animal('rabbit', 'on', 'grass', 'jumping'), animal('rabbit', 'on', 'grass', 'sleeping'), animal('rabbit', 'on', 'grass', 'eating')], 1),
  scene('rabbit-jumping', 'The rabbit is jumping.', 1, [animal('rabbit', 'on', 'grass', 'eating'), animal('rabbit', 'on', 'grass', 'sleeping'), animal('rabbit', 'on', 'grass', 'jumping')], 2),
  scene('dog-beside-box', 'The dog is beside the box.', 2, [animal('dog', 'in', 'box'), animal('dog', 'on', 'box'), animal('dog', 'beside', 'box')], 2),
  scene('cat-beside-mat', 'The cat is beside the mat.', 2, [animal('cat', 'on', 'mat'), animal('cat', 'beside', 'mat'), animal('cat', 'on', 'log')], 1),
  scene('who-duck-under', 'The duck is under the bridge.', 3, [animal('dog', 'under', 'bridge'), animal('duck', 'on', 'bridge'), animal('duck', 'under', 'bridge')], 2, { layout: 'bridge' }),
  scene('who-rabbit-eating', 'The rabbit is eating on the mat.', 3, [animal('rabbit', 'on', 'mat', 'eating'), animal('rabbit', 'on', 'mat', 'sleeping'), animal('rabbit', 'on', 'grass', 'eating')], 0),
  scene('rabbit-two-clauses', 'The rabbit is eating, and it is on the mat.', 4, [animal('rabbit', 'on', 'grass', 'eating'), animal('rabbit', 'on', 'mat', 'eating'), animal('rabbit', 'on', 'mat', 'sleeping')], 1, { clauses: ['The rabbit is eating,', 'and it is on the mat.'] }),
  scene('duck-two-clauses', 'The duck is under the bridge, and the cat is on the mat.', 4, [
    { ...animal('duck', 'under', 'bridge'), companion: animal('cat', 'beside', 'mat') },
    { ...animal('duck', 'on', 'bridge'), companion: animal('cat', 'on', 'mat') },
    { ...animal('duck', 'under', 'bridge'), companion: animal('cat', 'on', 'mat') },
  ], 2, { clauses: ['The duck is under the bridge,', 'and the cat is on the mat.'] }),
]);

// Authored pronunciations, not a component-letter guess. Untaught ck, er,
// blends, silent-e and inflected action words are never independently unlocked.
export const LANTERN_WORD_CODE = Object.freeze(Object.fromEntries([
  ['cat', ['c', 'a', 't']], ['dog', ['d', 'o', 'g']], ['pig', ['p', 'i', 'g']],
  ['hen', ['h', 'e', 'n']], ['mat', ['m', 'a', 't']], ['log', ['l', 'o', 'g']],
  ['box', ['b', 'o', 'x']], ['bed', ['b', 'e', 'd']], ['pen', ['p', 'e', 'n']],
  ['mud', ['m', 'u', 'd']], ['on', ['o', 'n']], ['in', ['i', 'n']], ['it', ['i', 't']],
].map(([word, code]) => [word, Object.freeze(code)])));
