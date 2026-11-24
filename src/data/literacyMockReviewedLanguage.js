import { getLiteracyMockAudioV11Path } from './literacyMockAudioV11.js';
import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';

// Each row records three distinct objects absent from the illustration, three actions
// the illustration rules out, and a description that leaves the verb for the pupil.
const actionScenes = {
  run: ['tent boat fork', 'crawl ride climb', 'A boy moves forward with his elbows bent and one foot high behind him.'],
  sit: ['kite slide pan', 'jump climb sleep', 'A child rests on a chair with both feet down.'],
  clap: ['bell scarf box', 'wave point shake', 'Two palms meet, with short lines around the hands.'],
  swim: ['boat net star', 'throw dance dig', 'A boy moves through a pool with his head above the water and an arm out.'],
  sleep: ['coat sheep clock', 'read write eat', 'A child lies under a quilt with closed eyes. It is dark outside.'],
  jump: ['ball hat boot', 'march sit crawl', 'A boy is in the air with bent knees and both arms raised.'],
  sing: ['drum bell book', 'whisper laugh sneeze', 'A girl holds a microphone. A music note floats beside her open mouth.'],
  drink: ['fork bowl star', 'peel wash pour', 'A child tips a glass to his lips.'],
  dig: ['broom sock fork', 'fold shake lift', 'A child presses a small shovel into a patch of earth.'],
  hop: ['net leaf cup', 'swim slide crawl', 'A frog is in the air with its long back legs behind it.'],
  write: ['brush box spoon', 'fold cut read', 'A girl forms lines of words on a sheet beside a stamped envelope.'],
  skip: ['bike swing mat', 'march climb kick', 'A girl swings a rope over her head and raises her feet over the rope.'],
  spin: ['drum fan ball', 'roll swing bounce', 'Curved lines circle a striped toy top balanced on its point.'],
  kick: ['hat bell map', 'catch throw carry', 'A child extends one foot toward a ball in the air.'],
  look: ['book map cup', 'shout drink sneeze', 'A child holds binoculars to his eyes facing distant birds.'],
  eat: ['key broom bed', 'cook peel bake', 'A child holds food at her mouth at the lunch table.'],
  walk: ['bike bus shoe', 'crawl ride dance', 'A child moves along a path, one foot ahead of the other.'],
  dance: ['ball drum kite', 'march stand skip', 'A girl in ballet clothes points one toe and extends her arms on a stage.'],
  read: ['pen brush lamp', 'draw fold clap', 'A girl follows a page in an open book in her lap.'],
  draw: ['fork cup net', 'cut fold chop', 'A boy makes a colourful picture on paper with a pencil.'],
  wash: ['towel comb coat', 'draw peel stir', 'A girl holds soapy hands under the running tap.'],
  wave: ['tiger clock watch', 'clap point pull', 'A child lifts one open hand above her head as a greeting.'],
  crawl: ['shoe chair blanket', 'stand roll hop', 'A baby moves on hands and knees.'],
  climb: ['tree slide tent', 'push carry bend', 'A child holds the sides of a ladder with one foot high on a rung.'],
  throw: ['net kite shoe', 'kick roll bounce', 'A ball has just left a child’s raised hand and is traveling away.'],
  catch: ['hat cup bench', 'kick peel pour', 'A child receives an orange ball with her hands while another child watches.'],
  push: ['belt box spoon', 'pull lift throw', 'A child moves a loaded wagon forward with both hands against it.'],
  pull: ['train goat boat', 'push fold carry', 'A boy leans back, gripping a stretched rope with both hands.'],
  laugh: ['book spoon scarf', 'whisper sing drink', 'A boy bends slightly with one hand near his mouth and a broad grin.'],
  smile: ['hat lamp brush', 'shout yawn cry', 'A girl stands facing forward, her eyes open and the corners of her mouth turned up.'],
  sneeze: ['cup hat towel', 'drink whisper sing', 'A boy covers his nose and mouth with his bent arm. Short lines show a sudden burst.'],
  point: ['boat key broom', 'clap pull lift', 'A teacher extends one finger toward a spot on the large world map.'],
  stretch: ['belt shoe bench', 'fold hug crawl', 'A child reaches both arms overhead beside the bed.'],
  hug: ['coat book hat', 'push wave carry', 'Two children put their arms around each other.'],
  build: ['whale ruler bell', 'fold draw cut', 'A child adds a coloured block to a tall tower of blocks.'],
  pour: ['pan sock lid', 'stir drink spill', 'A girl tips a bottle and a stream flows into the upright cup she holds.'],
  bake: ['moon mug scarf', 'peel stir wash', 'An adult slides a tray of cakes into an oven while a child watches.'],
  stir: ['hat pot bell', 'pour chop peel', 'A boy moves a spoon through the mixture in a bowl.'],
  drive: ['train bus bike', 'push pull march', 'A boy steers a small wheeled car, holding its steering wheel.'],
  peel: ['fork bread pear', 'chop fold pour', 'A girl pulls the yellow skin down from a banana.'],
  stand: ['chair bench bed', 'sit bend crawl', 'A child faces forward with his legs straight and both feet on the floor.'],
  cook: ['tree lid tent', 'wash cut eat', 'Two people in chef hats prepare food in a pot on the stove.'],
  ride: ['car bus boat', 'push dance march', 'A child holds the handlebars with one foot on a bicycle pedal.'],
  chop: ['spoon fork book', 'stir pour peel', 'A hand brings a knife down onto a carrot, leaving short pieces on the board.'],
  bend: ['shoe key chair', 'jump sit march', 'A child reaches toward the floor, folding forward at the waist with feet planted.'],
  lift: ['train bag bench', 'kick pour cut', 'A child raises a box with both hands while straightening his knees.'],
  yawn: ['pillow bed cup', 'smile whisper sneeze', 'A child at a desk opens his mouth wide with his eyes nearly closed.'],
  smell: ['apple pear star', 'point peel pour', 'A child brings her nose close to a yellow flower.'],
  carry: ['plate book bowl', 'push roll kick', 'A child holds a watering can with her hand as she moves it through the garden.'],
  march: ['drum bell bag', 'dance crawl swim', 'Children move in a line, raising their knees high and swinging their arms.'],
  feed: ['bowl spoon fish', 'catch carry wash', 'A child puts grains in front of chickens that peck at the food.'],
  bounce: ['net belt kite', 'kick roll spin', 'A boy presses a ball toward the ground. Lines mark where it springs up.'],
  fold: ['book towel bag', 'pull cut draw', 'A girl brings one side of a flat sheet over to the other side.'],
  whisper: ['book cup hat', 'shout clap sing', 'A girl cups one hand beside her mouth close to another child’s ear.'],
  shake: ['bell drum cup', 'roll spin kick', 'A baby moves a rattle back and forth. Music notes appear by the rattle.'],
  roll: ['net hat kite', 'lift throw catch', 'A child uses both hands to turn a large ball along the ground.'],
  shout: ['drum bell book', 'whisper smile drink', 'A girl cups both hands around her open mouth as if calling across a distance.'],
  spill: ['bottle mug spoon', 'stir peel wash', 'A fallen cup lies on its side with a puddle spreading across the table.'],
  wear: ['kite fish ring', 'wash fold peel', 'A child has a winter hat on her head and a coat over her shoulders.'],
  cut: ['net fork sock', 'fold draw pull', 'Scissors close through a piece of paper.'],
};

const nounContrasts = {
  vet:'kitten clinic basket', nurse:'bandage blanket clock', king:'crown castle horse',
  frog:'pond rock leaf', duck:'boat feather nest', lion:'cage grass rock',
  shop:'bag coin clerk', beach:'shell towel crab', school:'teacher ruler pencil',
  lamp:'clock chair mirror', belt:'scarf sock glove', clock:'mirror shelf bowl',
  pilot:'sailor farmer baker', sister:'desk clock chair', tiger:'whisker stripe tooth',
  turtle:'frog rabbit lizard', library:'bakery market station', pool:'park shop library',
  key:'coin ribbon spoon', book:'blanket towel tray', plumber:'pilot baker teacher',
  otter:'river pebble branch', cinema:'bakery library pool', scissors:'ruler crayon pencil',
};

const matchDecoys = {
  'same-everyday':'slow','same-common':'distant','same-precise':'noisy',
  'opposite-size':'warm','opposite-space':'beside','opposite-change':'bright','opposite-quality':'hollow',
  'same-sets-1':'finish','same-sets-2':'healthy','same-sets-3':'above','same-sets-4':'brave',
  'same-sets-5':'whisper','same-sets-8':'sell','same-sets-10':'modern','same-sets-11':'appear',
  'same-sets-12':'tiny','same-sets-13':'arrive','same-sets-14':'solid','same-sets-15':'serious','same-sets-16':'unfair',
  'opposite-sets-1':'tall','opposite-sets-2':'beside','opposite-sets-3':'afraid','opposite-sets-4':'hold',
  'opposite-sets-5':'rough','opposite-sets-6':'close','opposite-sets-7':'more','opposite-sets-8':'heavy',
  'opposite-sets-9':'quiet','opposite-sets-10':'receive','opposite-sets-11':'tired','opposite-sets-12':'jump',
  'opposite-sets-13':'yesterday','opposite-sets-14':'plain','opposite-sets-15':'heavy','opposite-sets-16':'familiar',
};

// Related familiar pictures were reviewed as complete sets, including the incidental details
// in each illustration. For example, the moon card also shows stars.
const starterPictureFoils = {
  pig: 'goat sheep horse', cow: 'pig horse rabbit', goat: 'sheep cow hen',
  sheep: 'goat pig duck', hen: 'duck rabbit goat', duck: 'penguin frog hen',
  ant: 'spider bee caterpillar', bee: 'butterfly ant snail', bed: 'sofa chair pillow',
  chair: 'sofa desk bench', desk: 'bed chair door', sofa: 'bench desk bed',
  fan: 'lamp clock brush', bell: 'drum clock phone', pan: 'pot plate spoon',
  pot: 'bowl bottle pan', log: 'tree rock shell', leaf: 'log rock shell',
  tree: 'leaf rock rain', bus: 'truck car bike', car: 'van train bus',
  boat: 'truck bike train', bike: 'car bus train', cake: 'bread rice soup',
  egg: 'cheese potato cake', sun: 'moon cloud rain', star: 'rain cloud snow',
  ball: 'kite swing slide', kite: 'bike swing ball', sock: 'shoe scarf hat',
  shoe: 'boot belt sock', coat: 'dress shoe hat', carrot: 'potato corn tomato',
  potato: 'corn carrot rice', tomato: 'carrot potato watermelon', toothbrush: 'comb brush towel',
  towel: 'pillow scarf toothbrush', shorts: 'skirt dress sock', skirt: 'dress shorts scarf',
  pillow: 'blanket towel sofa', blanket: 'pillow bed scarf', swing: 'slide kite bike',
  slide: 'swing ball tent', lion: 'tiger bear fox', tiger: 'lion monkey kangaroo',
  zebra: 'horse tiger bear', monkey: 'kangaroo bear lion', penguin: 'duck whale dolphin',
  whale: 'shark dolphin frog', shark: 'whale dolphin penguin', dolphin: 'whale shark duck',
  snake: 'snail frog caterpillar', snail: 'caterpillar spider bee', spider: 'ant caterpillar butterfly',
  butterfly: 'bee spider snail', hand: 'elbow leg foot', elbow: 'chin foot hand',
  hair: 'nose leg hand', leg: 'foot elbow chin', bread: 'rice cake egg',
  corn: 'carrot bread potato', rice: 'corn soup meat', window: 'door lamp desk',
  lamp: 'clock fan window', sink: 'bath desk chair', brush: 'comb broom toothbrush',
  broom: 'mop brush towel', watch: 'ring clock belt', phone: 'camera clock bell',
  camera: 'phone watch lamp', snow: 'rain leaf sun', rain: 'snow star moon',
  cloud: 'moon star leaf',
};

const starterPicturePaths = {
  ball: '/images/assessment/release-support/targets/ball-8bec04.webp',
  bee: '/images/assessment/literacy-mock/object-atlas-v1.webp#mock-cell=1',
  boot: '/images/assessment/literacy-mock/capacity/foundation-boot.webp',
  bus: '/images/assessment/literacy-mock/object-atlas-v1.webp#mock-cell=4',
  chin: '/images/assessment/literacy-mock/capacity/foundation-chin.webp',
  cow: '/images/assessment/release-support/targets/cow-8bbddb.webp',
  door: '/images/assessment/literacy-mock/capacity/foundation-door.webp',
  dress: '/images/assessment/literacy-mock/capacity/foundation-dress.webp',
  horse: '/images/assessment/literacy-mock/capacity/foundation-horse.webp',
  meat: '/images/assessment/release-media/meat-52e1a2a7.webp',
  pig: '/images/assessment/rhyming/variants/ig/pig-02.webp',
  ring: '/images/assessment/rhyming/variants/ing/ring-02.webp',
  skirt: '/images/assessment/literacy-mock/capacity/foundation-skirt.webp',
  snail: '/images/assessment/release-support/targets/snail-9054cc.webp',
  spider: '/images/assessment/literacy-mock/capacity/foundation-spider.webp',
  star: '/images/assessment/rhyming/variants/ar/star-02.webp',
  sun: '/images/assessment/rhyming/variants/sun/sun-02.webp',
  swing: '/images/assessment/rhyming/variants/ing/swing-02.webp',
};
for (const [folder, labels] of Object.entries({
  '/images/assessment/blends': 'belt broom desk drum frog',
  '/images/assessment/digraphs': 'bath dolphin phone rock shark sheep shell shoe sock truck whale',
  '/images/assessment/generated/initial-sounds-l2': 'camera penguin watermelon',
  '/images/assessment/literacy-classroom': 'log rain',
  '/images/assessment/long-vowels': 'goat moon snow tree',
  '/images/assessment/objective-words': 'ant bed bell bench bike bread brush butterfly cake caterpillar cheese clock corn duck egg elbow fan fox hen kangaroo lamp leg lion mop nose pan pot spoon tent tiger tomato train van watch window',
  '/images/child-mode/blends': 'cloud slide',
  '/images/child-mode/digraphs': 'chair',
  '/images/child-mode/initial-sounds': 'bear car hat kite leaf',
  '/images/child-mode/initial-sounds/reviewed': 'monkey',
  '/images/child-mode/vocabulary': 'foot potato rice soup',
  '/media/initial-sounds/images/c': 'carrot',
  '/media/initial-sounds/images/h': 'hand',
  '/media/initial-sounds/images/r': 'rabbit',
  '/media/initial-sounds/images/t': 'toothbrush',
  '/media/vocabulary/images': 'blanket bottle bowl comb pillow plate scarf shorts sofa towel',
})) {
  for (const label of labels.split(' ')) starterPicturePaths[label] = folder + '/' + label + '.webp';
}

const pictureSubstitutions = new Map([
  ['/images/assessment/long-vowels/rain.webp','/images/assessment/literacy-classroom/rain.webp'],
  ['/images/assessment/rhyming/variants/og/log-02.webp','/images/assessment/literacy-classroom/log.webp'],
]);

export function reviewLanguagePicturePaths(item) {
  if (!item.requiredImagePaths?.some(path => pictureSubstitutions.has(path))) return item;
  const replace = path => pictureSubstitutions.get(path) || path;
  const choices = item.choices.map(choice => pictureSubstitutions.has(choice.image) ? {...choice,image:replace(choice.image)} : choice);
  const mediaDecision = item.mediaDecision?.paths
    ? {...item.mediaDecision,paths:item.mediaDecision.paths.map(replace)} : item.mediaDecision;
  return {...item, image:replace(item.image), choices, mediaDecision, requiredImagePaths:[...new Set(item.requiredImagePaths.map(replace))]};
}

const words = text => text.split(' ');

function rewriteChoices(item, labels, reasons, changes = {}) {
  const choices = item.choices.map((choice,index) => {
    if (choice.label === labels[index]) return choice;
    const next = {...choice, label:labels[index]};
    if (choice.audioPath) {
      next.audioPath = getLedaWordAudioPath(next.label) || getLiteracyMockAudioV11Path(next.label, ['isolated_word']);
      if (!next.audioPath) throw Error('Missing reviewed word audio for ' + next.label + ' in ' + item.id);
    }
    return next;
  });
  const byId = new Map(choices.map(choice => [choice.id,choice]));
  const keys = new Set([item.answer].flat());
  const foils = choices.filter(choice => !keys.has(choice.id));
  const requiredAudioCues = item.requiredAudioCues.map(cue => {
    if(cue.role === 'instruction' && changes.prompt) return {...cue,text:changes.prompt,path:changes.instructionPath};
    if (cue.role !== 'choice') return cue;
    const choice = byId.get(cue.choiceId);
    return {...cue, text:choice.label, value:choice.label, path:choice.audioPath};
  });
  return {...item,choices,prompt:changes.prompt || item.prompt,requiredAudioCues,
    requiredAudioPaths:[...new Set(requiredAudioCues.map(cue=>cue.path))],
    ...reviewedFoilEvidence(item, foils),
    distractorRationales:Object.fromEntries(foils.map(choice=>[choice.id,reasons(choice.label)]))};
}

function reviewedFoilEvidence(item, foils) {
  if (!item.taskDemand?.proof?.rejected) return {};
  const proof = {...item.taskDemand.proof, rejected:foils.map(c => c.label)};
  return {taskDemand:{...item.taskDemand,proof}};
}

function reviewStarterPictures(item, words) {
  const foils = words.split(' ');
  const choices = item.choices.map(choice => {
    if (choice.id === item.answer) return choice;
    const label = foils.shift();
    return {id:choice.id, label, imageAlt:label, image:starterPicturePaths[label]};
  });
  const rejected = choices.filter(choice => choice.id !== item.answer);
  const requiredImagePaths = choices.map(c => c.image);
  return {...item, choices, requiredImagePaths,
    mediaDecision:{...item.mediaDecision,paths:requiredImagePaths},
    ...reviewedFoilEvidence(item, rejected),
    distractorRationales:Object.fromEntries(rejected.map(c => [c.id,
      'This picture shows '+c.label+'. The recording names '+item.targetWord+'.']))};
}

function replaceFoils(item, foils, reason) {
  const next = [...foils];
  return rewriteChoices(item,item.choices.map(choice=>choice.id===item.answer ? choice.label : next.shift()),reason);
}

const MATCH_MEANINGS = 'Match each use of the word to its meaning.';
const MUST_BE_TRUE = 'Which statement must be true?';
const matchedContextWords = new Set(words('bank bark spring glass wave seal cap nail letter chest patch coach rock'));

// These pairs were reviewed for the relation in the question. A synonym is
// a meaningful alternative to an antonym, and association alone satisfies neither.
const samePairs = ['happy — glad','begin — start','cold — chilly','quick — fast','ill — sick','shout — yell','little — small','scared — afraid','sad — unhappy','hard — firm'];
const oppositePairs = ['hot — cold','up — down','wet — dry','full — empty','wide — narrow','open — shut','clean — dirty','tall — short','fast — slow','awake — asleep'];
const relatedPairs = ['wet — cold','heavy — thick','smooth — flat','awake — happy','begin — wait','soft — warm','new — shiny','near — above','ill — hungry','empty — light','big — wide','strong — heavy','bright — quiet','push — hold','cross — tired','quick — early','shout — sing'];

function wordAudio(label) {
  return getLedaWordAudioPath(label) || getLiteracyMockAudioV11Path(label, ['isolated_word']);
}

function relationOptions(item) {
  const key = item.choices.find(choice => choice.id === item.answer).label;
  const [anchor] = key.split(' — ');
  const opposite = item.prompt === 'Which words mean the opposite?';
  const prompt = 'Choose a word that means the ' + (opposite ? 'opposite of ' : 'same as ') + anchor + '.';
  const instructionPath = getLedaInstructionAudioPath(prompt);
  const labels = item.choices.map(choice=>choice.label.split(' — ')[1]);
  if (instructionPath && labels.every(label=>label && wordAudio(label))) {
    return {labels,prompt,instructionPath};
  }
  const avoid = new Set(key.split(' — '));
  let hash = 0;
  for (const char of item.stimulusKey) hash = (Math.imul(hash,31)+char.charCodeAt(0)) >>> 0;
  function nextPair(pool,offset) {
    for (let i=0; i<pool.length; i++) {
      const pair = pool[(hash+offset+i)%pool.length];
      if (pair.split(' — ').some(word=>avoid.has(word)) || !wordAudio(pair)) continue;
      pair.split(' — ').forEach(word=>avoid.add(word));
      return pair;
    }
    throw Error('Missing a distinct recorded meaning contrast for '+item.id);
  }
  const distractors = [nextPair(opposite ? samePairs : oppositePairs,0),nextPair(relatedPairs,3),nextPair(relatedPairs,10)];
  return {labels:item.choices.map(choice=>choice.id===item.answer ? key : distractors.shift()),prompt:item.prompt};
}

const pluralContrasts = {
  'mock.plurals.animals':['cats','mouse','mice','goose'],
  'mock.plurals.classroom':['children','desk','pencils','class'],
  'mock.plurals.changes':['woman','women','child','people'],
  'mock.capacity.language.set-body':['feet','nose','teeth','chin'],
  'mock.capacity.language.set-clothes':['shirts','dress','skirts','scarf'],
  'mock.capacity.language.set-cooking':['pans','glass','cups','ladle'],
};

function contextMatch(item) {
  const proof = item.taskDemand.proof;
  const queried = item.choices.find(choice=>choice.id===item.answer);
  const other = item.choices.find(choice=>choice.label===proof.otherSense);
  if (queried?.label!==proof.queriedSense || !other || ![1,2].includes(proof.queriedOccurrence)) throw Error('Unverified contextual meanings: '+item.id);
  const ordered = proof.queriedOccurrence===1 ? [queried,other] : [other,queried];
  const matchTargets = ['First use','Second use'].map((name,i)=>({id:'use'+(i+1),label:name+' of “'+item.targetWord+'”'}));
  const instructionPath = getLedaInstructionAudioPath(MATCH_MEANINGS);
  const targetPath = wordAudio(item.targetWord);
  if (!targetPath) throw Error('No recorded contextual target: '+item.targetWord);
  const requiredAudioCues = item.requiredAudioCues.flatMap(cue=>cue.role==='instruction'
    ? [{...cue,text:MATCH_MEANINGS,path:instructionPath || null},{role:'target_word',text:item.targetWord,path:targetPath,required:true}]
    : [cue]);
  return {...item,format:'match',answerMode:'sequence',prompt:MATCH_MEANINGS,answer:ordered.map(c=>c.id),matchTargets,
    constructClaim:'match_competing_contextual_meanings',requiredAudioCues,
    requiredAudioPaths:[...new Set(requiredAudioCues.map(c=>c.path).filter(Boolean))],
    missingAudioCues:requiredAudioCues.filter(c=>!c.path), mediaReady:Boolean(instructionPath),
    difficultyEvidence:'Use both occurrences to match two distinct senses, with two unused meanings.',
    taskDemand:{...item.taskDemand,operation:'match_competing_contextual_meanings',
      higher:'Two occurrences must each be associated with its own contextual sense.',
      features:{targetOccurrences:2,requiredAssignments:2,spareMeanings:2},proof:{...proof,orderedSenses:ordered.map(c=>c.label)}},
    explanation:'The first use means '+ordered[0].label+'. The second use means '+ordered[1].label+'.',
    distractorRationales:Object.fromEntries(item.choices.filter(c=>!ordered.includes(c)).map(c=>[c.id,'The passage does not use '+item.targetWord+' to mean '+c.label+'.']))};
}

export function reviewLanguageItem(item) {
  if (!item.adaptiveMixedEligible || item.tutorialOnly) return item;
  if (item.domainId==='vocabulary' && item.skillId==='picture_vocabulary' && item.adaptiveAreaBand===1 && starterPictureFoils[item.targetWord]) {
    return reviewStarterPictures(item,starterPictureFoils[item.targetWord]);
  }
  if (item.domainId==='language' && item.skillId==='verbs' && item.adaptiveAreaBand<=1) {
    const scene = actionScenes[item.targetWord];
    if (!scene) throw Error('Unreviewed pictured action '+item.id);
    return {...replaceFoils(item,words(scene[item.adaptiveAreaBand]),label=>'The scene shows '+item.targetWord+' and does not depict '+label+'.'),
      imageAlt:scene[2]};
  }
  if (item.domainId==='language' && item.skillId==='nouns' && item.adaptiveAreaBand===2 && item.format==='choice') {
    const key = item.choices.find(c=>c.id===item.answer).label;
    return replaceFoils(item,words(nounContrasts[key]),label=>label+' names a different referent and does not answer “'+item.prompt+'”');
  }
  if (Object.hasOwn(pluralContrasts,item.id)) {
    return {...rewriteChoices(item, item.choices.map(c=>pluralContrasts[item.id][Number(c.id.slice(1))]),
      label=>label+' names one person or thing here.'),
      explanation:'The two selected words are plural nouns.'};
  }
  if (item.domainId==='vocabulary' && item.adaptiveAreaBand===2 && item.format==='match') {
    const suffix = item.id.split('.').at(-1), label=matchDecoys[suffix];
    if (!label || item.choices.some(c=>c.label===label || c.id==='spare')) throw Error('Unreviewed matching set '+item.id);
    return {...item,choices:[...item.choices,{id:'spare',label}],
      distractorRationales:{...item.distractorRationales,spare:label+' does not have the requested relationship to any of these three words.'}};
  }
  if (item.domainId==='vocabulary' && item.adaptiveAreaBand===2 && item.format==='choice') {
    const options = relationOptions(item);
    return {...rewriteChoices(item,options.labels,label=>label+' does not express the meaning relationship asked for.',options.instructionPath ? options : {}),
      lexicalExposureWords:[...new Set(item.choices.find(c=>c.id===item.answer).label.split(' — ').concat(options.labels.flatMap(label=>label.split(' — '))))],
      mediaDecision:{...item.mediaDecision,reason:'The instruction and four separately recorded options present the requested word relation.'}};
  }
  if (item.domainId==='vocabulary' && item.adaptiveAreaBand===5 && item.format==='choice' && matchedContextWords.has(item.targetWord)) return contextMatch(item);
  if (item.domainId==='language' && item.adaptiveAreaBand===5 && item.prompt==='Which sentence keeps the same meaning?') {
    const path = getLedaInstructionAudioPath(MUST_BE_TRUE);
    const requiredAudioCues=item.requiredAudioCues.map(c=>c.role==='instruction'?{...c,text:MUST_BE_TRUE,path}:c);
    return {...item,prompt:MUST_BE_TRUE,requiredAudioCues,requiredAudioPaths:[...new Set(requiredAudioCues.map(c=>c.path))]};
  }
  return item;
}

function sameSet(a,b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length!==b.length) return false;
  const right = [...b].sort();
  return [...a].sort().every((value,i)=>value===right[i]);
}

export function validReviewedLanguageAction(item) {
  const scene = actionScenes[item.targetWord];
  if (!scene || item.domainId!=='language' || item.skillId!=='verbs' || !item.image
    || item.format!=='choice' || ![0,1].includes(item.adaptiveAreaBand) || item.imageAlt!==scene[2]) return false;
  const key=item.choices.find(c=>c.id===item.answer);
  if (key?.label!==item.targetWord) return false;
  const foils=item.choices.filter(c=>c.id!==item.answer).map(c=>c.label);
  return sameSet(foils,words(scene[item.adaptiveAreaBand])) && item.choices.every(c=>c.audioPath
    && item.requiredAudioCues.some(cue=>cue.role==='choice' && cue.choiceId===c.id && cue.text===c.label && cue.path===c.audioPath));
}

export function reviewedLanguageBand(item, original) {
  if (!original || item.id!==original.id || !['vocabulary','language'].includes(item.domainId)) return null;
  const expected=reviewLanguageItem(reviewLanguagePicturePaths(original));
  if (expected===original || item.adaptiveAreaBand!==expected.adaptiveAreaBand || !item.mediaReady) return null;
  // The independent published source fixes the target, correct referents and family.
  // Choice order may vary during publication. Compare each response by its ID.
  const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const choices = list=>[...list].sort((a,b)=>a.id.localeCompare(b.id)).map(c=>[c.id,c.label,c.image,c.imageAlt,c.audioPath]);
  if (!equal(choices(item.choices),choices(expected.choices)) || !equal(item.answer,expected.answer)
    || item.prompt!==expected.prompt || item.passage!==expected.passage || item.targetWord!==expected.targetWord
    || item.domainId!==expected.domainId || item.skillId!==expected.skillId || item.format!==expected.format || item.answerMode!==expected.answerMode
    || item.image!==expected.image || item.imageAlt!==expected.imageAlt || item.constructClaim!==expected.constructClaim
    || item.exposureFamilyId!==original.exposureFamilyId || !equal(item.matchTargets,expected.matchTargets)
    || !equal(item.requiredAudioCues,expected.requiredAudioCues) || !sameSet(item.requiredAudioPaths,expected.requiredAudioPaths)
    || !sameSet(item.requiredImagePaths,expected.requiredImagePaths)) return null;
  const band = expected.adaptiveAreaBand;
  if (item.domainId==='language' && band<=1) return validReviewedLanguageAction(item) ? band : null;
  if (item.domainId==='vocabulary' && band===1 && starterPictureFoils[item.targetWord]) {
    const foils=item.choices.filter(c=>c.id!==item.answer);
    return sameSet(foils.map(c=>c.label),words(starterPictureFoils[item.targetWord])) &&
      item.choices.every(c=>c.image && c.imageAlt===c.label) && item.hideWrittenLabels && !item.renderTargetText &&
      item.requiredAudioCues.some(cue=>cue.role==='target_word' && cue.text===item.targetWord) ? 1 : null;
  }
  if (Object.hasOwn(pluralContrasts,item.id)) {
    const singular = new Set(['mouse','goose','desk','class','woman','child','chin','nose','dress','scarf','glass','ladle']);
    return item.choices.every(c=>item.answer.includes(c.id)!==singular.has(c.label)) ? 2 : null;
  }
  if (item.domainId==='language' && band===2) {
    const key=item.choices.find(c=>c.id===item.answer)?.label;
    return nounContrasts[key] && sameSet(item.choices.filter(c=>c.id!==item.answer).map(c=>c.label),words(nounContrasts[key])) ? 2 : null;
  }
  if (item.domainId==='vocabulary' && band===2 && item.format==='match') {
    return item.choices.length===4 && new Set(item.answer).size===3 && item.matchTargets.length===3
      && item.choices.filter(c=>!item.answer.includes(c.id)).length===1 ? 2 : null;
  }
  if (item.domainId==='vocabulary' && band===2 && item.format==='choice') {
    const key=item.choices.find(c=>c.id===item.answer)?.label;
    const pair=original.choices.find(c=>c.id===original.answer)?.label.split(' — ');
    if (item.prompt.startsWith('Choose a word that means the ')) return key===pair[1] && item.prompt.endsWith(' '+pair[0]+'.') ? 2 : null;
    return key===pair.join(' — ') && new Set(item.choices.map(c=>c.label.split(' — ')[0])).size===4 ? 2 : null;
  }
  if (item.domainId==='vocabulary' && band===5 && item.format==='match') {
    const {queriedSense,otherSense,queriedOccurrence}=original.taskDemand.proof;
    const senses=item.answer.map(id=>item.choices.find(c=>c.id===id)?.label);
    return senses.length===2 && senses[queriedOccurrence-1]===queriedSense && senses[2-queriedOccurrence]===otherSense
      && new Set(senses).size===2 && item.choices.length===4 && item.matchTargets.length===2 && item.passage.toLowerCase().split(new RegExp('\\b'+item.targetWord+'\\b','u')).length===3 ? 5 : null;
  }
  if (item.domainId==='language' && band===5) {
    const {source,retained,rejected}=original.taskDemand.proof;
    return item.prompt===MUST_BE_TRUE && item.passage===source && item.choices.find(c=>c.id===item.answer)?.label===retained
      && sameSet(item.choices.filter(c=>c.id!==item.answer).map(c=>c.label),rejected) ? 5 : null;
  }
  // Only an independently reviewed picture path was replaced in this row.
  return item.choices.every(c=>!c.image || c.imageAlt===c.label) ? band : null;
}
