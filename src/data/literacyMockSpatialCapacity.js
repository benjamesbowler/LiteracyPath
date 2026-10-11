import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
import { normalizeSpokenCloze } from '../utils/assessmentSpokenText.js';

const roots = { g: '/images/assessment/grammar-scenes/', c: '/images/child-mode/sentence-scenes/',
  l: '/images/assessment/literacy-classroom/', v: '/images/assessment/language/variants/prepositions/',
  n: '/images/assessment/literacy-mock/capacity/', r: '/images/assessment/release-media/' };
const reviewedNewScenes = new Set(['puppy-behind-water-can', 'tractor-behind-hedge', 'duck-behind-reeds',
  'bowl-between-bottles', 'bench-between-flowerpots', 'sailboat-between-buoys', 'child-behind-armchair',
  'rabbit-behind-rock', 'wagon-in-front-of-shed', 'child-in-front-of-easel',
  'bicycle-in-front-of-wall', 'fox-in-front-of-den', 'ribbon-through-bead',
  'child-through-play-tunnel', 'stream-through-culvert', 'benches-opposite-path',
  'shops-opposite-street', 'gates-opposite-lane', 'players-opposite-board',
  'beds-opposite-room', 'goats-opposite-stream', 'rabbit-among-toys', 'red-leaf-among-green',
  'ribbon-around-jar', 'stones-around-pond', 'children-around-sandpit',
  'orange-among-lemons', 'ivy-around-pole']);
const scenes = [];
const add = (construct, level, rows) => rows.forEach(row => scenes.push({ construct, level, row }));
// A relation is read from each complete scene. Reusing a scene across tasks
// deliberately retains the same stimulus/family; it is never a fresh picture.
add('in', 1, [
 ['g:kitten-in-basket','kitten','basket'], ['g:child-inside-bus','child','bus'],
 ['l:mouse-inside','mouse','log'], ['v:in-01','apple','basket'],
 ['g:apple-inside-lunchbox','apple','lunchbox'], ['g:kitten-inside-tent','kitten','tent'],
]);
add('on', 1, [
 ['g:hat-on-stool','hat','stool'], ['g:scarf-on-chair','scarf','chair'],
 ['l:mouse-on','mouse','log'], ['c:cup','cup','table'], ['c:books','books','table'], ['c:bag','bag','bed'],
]);
add('under', 1, [
 ['g:football-under-table','football','table'], ['l:mouse-under','mouse','log'],
 ['l:boat-under-bridge','boat','bridge'], ['l:train-cutaway','train','ground'],
 ['g:fish-below-boat','fish','boat'], ['g:ball-below-shelf','ball','shelf'],
]);
add('behind', 1, [
 ['l:hide-and-seek','child peeking over the bin','bin'],
 ['n:puppy-behind-water-can','puppy','watering can'], ['n:child-behind-armchair','child','armchair'],
 ['n:rabbit-behind-rock','rabbit','rock'], ['n:tractor-behind-hedge','tractor','hedge'], ['n:duck-behind-reeds','duck','reeds'],
]);
add('next_to', 1, [
 ['g:bicycle-next-to-lamppost','bicycle','lamppost'], ['v:next-to-01','cup','jug'],
 ['g:kettle-near-sink','kettle','sink'], ['g:wheelbarrow-near-gate','wheelbarrow','gate'],
 ['c:cups','cup on the left','other cup'], ['g:two-benches','bench on the left','other bench'],
]);
add('between', 1, [
 ['g:apple-between-cups','apple','cups'], ['g:balloon-between-kites','balloon','kites'],
 ['c:cats','boy','cats'], ['n:bowl-between-bottles','bowl','bottles'],
 ['n:bench-between-flowerpots','bench','flowerpots'], ['n:sailboat-between-buoys','sailboat','buoys'],
]);
add('in_front_of', 1, [
 ['l:mouse-in-front','mouse','log'], ['v:in-front-of-01','cat','chair'],
 ['n:wagon-in-front-of-shed','wagon','shed'], ['n:child-in-front-of-easel','child','easel'],
 ['n:bicycle-in-front-of-wall','bicycle','wall'], ['n:fox-in-front-of-den','fox','den'],
]);
add('above', 1, [
 ['g:clock-above-picture','clock','picture'], ['g:eagle-over-mountain','eagle','mountain'],
 ['g:kite-over-pond','kite','pond'], ['g:bridge-over-stream','bridge','stream'],
 ['l:train-outdoors','rainbow','mountain'], ['l:train-on-bridge','train','waterfall'],
]);
add('below', 1, [
 ['l:mouse-under','mouse','log'], ['g:football-under-table','football','table'],
 ['l:boat-under-bridge','boat','bridge'], ['l:train-cutaway','train','ground'],
 ['g:ball-under-bench','ball','bench'], ['g:shoe-under-stool','shoe','stool'],
]);
add('over', 2, [
 ['g:eagle-over-mountain','eagle','mountain'], ['l:train-outdoors','rainbow','mountain'],
 ['r:bird-above-tree-b27b365f','bird','tree'], ['g:balloon-above-child','balloon','child'],
 ['g:light-above-table','light','table'], ['g:clock-above-picture','clock','picture'],
]);
add('through', 2, [
 ['g:mouse-through-wall','mouse','hole in the wall'], ['l:train-cutaway','train','underground tunnel'],
 ['l:train-tunnel-entrance','train','mountain tunnel'], ['n:ribbon-through-bead','ribbon','bead'],
 ['n:child-through-play-tunnel','child','play tunnel'], ['n:stream-through-culvert','stream','stone culvert'],
]);
add('near', 2, [
 ['g:kettle-near-sink','kettle','sink'], ['g:wheelbarrow-near-gate','wheelbarrow','gate'],
 ['v:next-to-01','cup','jug'], ['g:lamp-next-to-bed','lamp','bed'],
 ['g:dog-next-to-bench','dog','bench'], ['g:bicycle-next-to-lamppost','bicycle','lamppost'],
]);
add('opposite', 2, [
 ['n:benches-opposite-path','bench on the left','other bench'], ['n:shops-opposite-street','fruit shop','flower shop'],
 ['n:players-opposite-board','child on the left','other child'], ['n:gates-opposite-lane','red gate','blue gate'],
 ['n:beds-opposite-room','bed on the left','other bed'], ['n:goats-opposite-stream','brown goat','white goat'],
]);
add('among', 2, [
 ['g:pear-among-apples','pear','apples'], ['g:duck-among-geese','duck','geese'],
 ['n:orange-among-lemons','orange','lemons'], ['n:rabbit-among-toys','toy rabbit','other toys'],
 ['n:red-leaf-among-green','red leaf','green leaves'],
]);
add('around', 2, [
 ['g:track-around-castle','track','castle'], ['n:ribbon-around-jar','ribbon','jar'],
 ['n:stones-around-pond','stones','pond'], ['n:children-around-sandpit','children','sandpit'], ['n:ivy-around-pole','ivy','pole'],
]);
add('inside_outside', 2, [
 ['g:child-inside-bus','child','bus','inside'], ['l:mouse-inside','mouse','log','inside'],
 ['g:kitten-in-basket','kitten','basket','inside'], ['r:cat-in-box-b44d5222','cat','box','inside'],
]);
add('inverse_spatial_relation', 1, [
 ['g:ball-under-bench','bench','ball','above'], ['r:bird-above-tree-b27b365f','tree','bird','below'],
 ['r:bear-behind-tree-b145e7e0','tree','bear','in front of'], ['g:flower-in-front-of-fence','fence','flower','behind'],
]);
add('inverse_spatial_relation', 2, [
 ['g:path-around-tree','tree','path','inside'], ['g:ribbon-around-gift','gift','ribbon','inside'],
 ['g:red-ball-among-blue-balls','blue balls','red ball','around'], ['g:pear-among-apples','apples','pear','around'],
 ['g:duck-among-geese','geese','duck','around'], ['g:track-around-castle','castle','track','inside'],
 ['g:road-around-lake','lake','road','inside'], ['g:pencil-among-crayons','crayons','pencil','around'],
]);
const relationFoils = {
 in: ['on','under'], on: ['under','behind'], under: ['on','in front of'], behind: ['in front of','on'],
 next_to: ['inside','under'], between: ['behind','above'], in_front_of: ['behind','on'],
 above: ['below','beside'], below: ['above','beside'], over: ['under','through'], through: ['over','beside'],
 near: ['inside','under'], opposite: ['behind','under'], among: ['above','under'], around: ['under','above'],
 inside: ['outside','above'],
};
const pluralSubjects = new Set(['books','stones','children','blue balls','apples','geese','crayons']);
function scenePath(key) { const [root, file] = key.split(':'); return `${roots[root]}${file}.webp`; }
function cues(prompt, choices) {
 const instruction = normalizeSpokenCloze(prompt);
 return [{ role: 'instruction', text: instruction, path: getLedaInstructionAudioPath(instruction) }, ...choices.map(choice => ({
  role: 'choice', choiceId: choice.id, text: choice.label, value: choice.label,
  path: getLedaWordAudioPath(choice.label) || getLedaInstructionAudioPath(choice.label),
 }))];
}
export function buildLiteracyMockSpatialCapacityItems(bank) {
 const byTask = (construct, level) => bank.find(item => item.skillId === 'prepositions' && item.constructClaim === construct && item.level === level);
 const result = scenes.map(({ construct, level, row: [key, subject, reference, inverse] }) => {
  const template = byTask(construct, level);
  if (!template) throw new Error(`Missing spatial template: ${construct}/${level}`);
  const relation = inverse || construct.replaceAll('_',' ');
  const image = scenePath(key);
  const id = `mock.capacity.language.spatial.${construct}.${level}.${key.split(':')[1]}`;
  const linkingVerb = construct === 'through' ? (subject === 'stream' ? 'flows' : 'goes')
   : pluralSubjects.has(subject) ? 'are' : 'is';
  const prompt = level === 1 ? `Where ${linkingVerb} the ${subject}?`
   : `Which phrase fits the picture? The ${subject} ${linkingVerb} ___.`;
  const foilKey = relation.replaceAll(' ','_');
  const foils = relationFoils[foilKey] || relationFoils[relation];
  if (!foils) throw new Error(`Missing spatial foils: ${relation}`);
  const choices = [relation, ...foils].map((word, index) => ({ id: `c${index}`, label: `${word} the ${reference}` }));
  return { ...template, id, sourceItemId: id, canonicalItemId: id,
   prompt, passage: '', targetWord: '', image, imageAlt: `A picture showing the ${subject} and the ${reference}.`,
   choices, answer: 'c0', stimulusKey: `scene:${image}`, exposureFamilyId: `scene:${image}`,
   requiredAudioCues: cues(prompt, choices),
   explanation: `The visible positions show the ${subject} ${relation} the ${reference}; the alternatives describe positions absent from the scene.`,
   distractorRationales: Object.fromEntries(choices.slice(1).map(choice => [choice.id, 'This spatial relationship does not match the depicted positions.'])),
   difficultyEvidence: level === 1 ? 'Identify the single visible spatial relationship using one image and spoken choices.' : 'Fit the exact depicted spatial relationship to the complete sentence.',
   sourceProvenance: { kind: 'original_mock_capacity', file: 'src/data/literacyMockSpatialCapacity.js', sourceId: key, taskTemplate: template.id },
   mediaDecision: { role: 'target-or-scene', paths: [image], constructReview: key.startsWith('n:') && !reviewedNewScenes.has(key.slice(2)) ? 'pending' : 'approved', answerNeutral: 'approved', reason: 'The scene supplies essential spatial evidence; its image identity is shared across all question uses.' },
  };
 });
 const template = bank.find(item => item.id === 'lp3.sentence_comprehension.l1.A.picture_match.v1');
 for (const [key, labels] of [
  ['c:bed',['The cat is sleeping on the bed.','The cat is hiding under the bed.','The cat is sitting beside the bed.']],
  ['c:sock',['A wet sock hangs from the line.','A dry sock lies on the ground.','A sock is folded on a shelf.']],
 ]) {
  const id = `mock.capacity.language.picture-sentence.${key.split(':')[1]}`;
  const image = scenePath(key);
  const choices = labels.map((label, index) => ({ id: `c${index}`, label }));
  result.push({ ...template, id, sourceItemId: id, canonicalItemId: id, choices, answer: 'c0', image,
   imageAlt: key === 'c:bed' ? 'A cat and a bed.' : 'A sock and a washing line.',
   stimulusKey: `scene:${image}`, exposureFamilyId: `scene:${image}`, requiredAudioCues: cues(template.prompt, choices),
   explanation: labels[0], distractorRationales: { c1: 'The action or position does not match the picture.', c2: 'The action or position does not match the picture.' },
   sourceProvenance: { kind: 'original_mock_capacity', file: 'src/data/literacyMockSpatialCapacity.js', sourceId: key, taskTemplate: template.id },
   mediaDecision: { role: 'target-or-scene', paths: [image], constructReview: 'approved', answerNeutral: 'approved', reason: 'The full scene is required to select the matching sentence.' },
  });
 }
 return result;
}
