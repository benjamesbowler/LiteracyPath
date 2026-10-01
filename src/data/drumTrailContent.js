import { getChildWordAsset } from './childAssets.js';
import { getLedaWordAudioPath } from './ledaProductionAudio.js';
import { hasKnownBadWordAudio, isKnownBadAudioPath } from './knownBadWordAudio.js';
import { DRUM_TRAIL_CONTENT_VERSION } from './arcadeContentVersions.js';
export { DRUM_TRAIL_CONTENT_VERSION } from './arcadeContentVersions.js';

// Authored oral syllables, never inferred from spelling. Common accent-sensitive
// counts (fire, flower, squirrel, camera, chocolate, crayon) are excluded.
// Chunks are a supported MODEL only; listening questions never print them.
const authored = [
  ['cat','cat'], ['dog','dog'], ['bus','bus'], ['cup','cup'], ['hat','hat'],
  ['pig','pig'], ['net','net'], ['map','map'], ['bed','bed'], ['mug','mug'],
  ['sun','sun'], ['fish','fish'], ['duck','duck'], ['sheep','sheep','/media/vocabulary/images/sheep.webp'],
  ['leaf','leaf'], ['snail','snail','/media/vocabulary/images/snail.webp'],
  ['goat','goat'], ['boat','boat'], ['book','book'], ['frog','frog'], ['cake','cake'], ['ball','ball'],
  ['rabbit','rab|bit','/media/initial-sounds/images/r/rabbit.webp'], ['tiger','ti|ger'], ['apple','ap|ple'],
  ['lemon','lem|on','/media/initial-sounds/images/l/lemon.webp'], ['monkey','mon|key'],
  ['kitten','kit|ten','/media/initial-sounds/images/k/kitten.webp'], ['puppy','pup|py'],
  ['carrot','car|rot','/media/initial-sounds/images/c/carrot.webp'], ['pencil','pen|cil','/media/initial-sounds/images/p/pencil.webp'],
  ['rocket','rock|et','/media/initial-sounds/images/r/rocket.webp'], ['basket','bas|ket','/media/initial-sounds/images/b/basket.webp'],
  ['ladder','lad|der','/media/initial-sounds/images/l/ladder.webp'], ['turtle','tur|tle','/media/initial-sounds/images/t/turtle.webp'],
  ['camel','cam|el','/media/vocabulary/images/camel.webp'], ['spider','spi|der','/media/vocabulary/images/spider.webp'],
  ['beetle','bee|tle','/media/vocabulary/images/beetle.webp'], ['baby','ba|by'], ['window','win|dow'],
  ['table','ta|ble','/media/initial-sounds/images/t/table.webp'], ['cherry','cher|ry','/media/vocabulary/images/cherry.webp'],
  ['mitten','mit|ten','/media/initial-sounds/images/m/mitten.webp'], ['magnet','mag|net','/media/initial-sounds/images/m/magnet.webp'],
  ['carpet','car|pet'], ['picnic','pic|nic'], ['sunset','sun|set'],
  ['pumpkin','pump|kin','/media/initial-sounds/images/p/pumpkin.webp'], ['napkin','nap|kin','/media/initial-sounds/images/n/napkin.webp'],
  ['ribbon','rib|bon','/media/vocabulary/images/ribbon.webp'], ['acorn','a|corn','/media/initial-sounds/images/a/acorn.webp'],
  ['hedgehog','hedge|hog','/media/initial-sounds/images/h/hedgehog.webp'], ['otter','ot|ter','/media/initial-sounds/images/o/otter.webp'],
  ['dolphin','dol|phin','/media/initial-sounds/images/d/dolphin.webp'], ['hippo','hip|po','/media/vocabulary/images/hippo.webp'], ['mountain','moun|tain'],
  ['umbrella','um|brel|la'], ['elephant','el|e|phant'], ['banana','ba|na|na','/media/initial-sounds/images/b/banana.webp'],
  ['tomato','to|ma|to','/media/initial-sounds/images/t/tomato.webp'], ['potato','po|ta|to'], ['octopus','oc|to|pus'],
  ['dinosaur','di|no|saur','/media/initial-sounds/images/d/dinosaur.webp'], ['kangaroo','kan|ga|roo','/media/initial-sounds/images/k/kangaroo.webp'],
  ['butterfly','but|ter|fly','/media/initial-sounds/images/b/butterfly.webp'], ['pineapple','pine|ap|ple','/media/initial-sounds/images/p/pineapple.webp'],
  ['volcano','vol|ca|no','/media/initial-sounds/images/v/volcano.webp'],
  ['helicopter','hel|i|cop|ter','/media/initial-sounds/images/h/helicopter.webp'], ['alligator','al|li|ga|tor'],
  ['caterpillar','cat|er|pil|lar','/media/initial-sounds/images/c/caterpillar.webp'], ['watermelon','wa|ter|mel|on','/media/initial-sounds/images/w/watermelon.webp'],
  ['macaroni','mac|a|ro|ni','/media/vocabulary/images/macaroni.webp'],
];

export const DRUM_TRAIL_WORDS = Object.freeze(authored.map(([word, segmentation, fallback]) => {
  const audio = getLedaWordAudioPath(word);
  const parts = Object.freeze(segmentation.split('|'));
  return Object.freeze({ id: `drum-${word}`, word, parts, syllables: parts.length,
    image: getChildWordAsset(word)?.image || fallback || '',
    audio: !hasKnownBadWordAudio(word) && !isKnownBadAudioPath(audio) ? audio : '',
    contentVersion: DRUM_TRAIL_CONTENT_VERSION,
    construct: 'oral-whole-word-syllable-count', accentPolicy: 'stable-common-English-count' });
}));
