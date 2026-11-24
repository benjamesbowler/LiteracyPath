import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';

// Published V14 identities remain the exposure keys. These edits are applied
// only while authoring the new publication, before building its snapshots.
const companion = new Map([
  ['Birds sit in trees.', 'A robin watches from a branch.'],
  ['A frog now jumps.', 'It lands beside the pond.'],
  ['Please put your boots here.', 'The wet soles can dry by the door.'],
  ['Where is my coat?', 'I left it on a chair.'],
  ['Please leave your shoes here.', 'The floor is clean.'],
  ['Today the school gate opens early.', 'The caretaker has a key.'],
  ['The ducks swim in the pond.', 'One duck dives for food.'],
  ['Who has the green bag?', 'Finn carries it to class.'],
  ['After lunch, we visit the garden.', 'We look for ripe peas.'],
  ['We will finish the model tomorrow.', 'The glue needs time to dry.'],
  ['Little birds sing here.', 'We listen from the porch.'],
  ['We saw a rainbow.', 'It stretched over the hills.'],
  ['Rabbits hide underground here.', 'Their burrow has two doors.'],
  ['Morning light filled my room.', 'I opened the curtains.'],
  ['Watch that rolling ball!', 'It is headed for the gate.'],
  ['After lunch, we planted seeds.', 'Each seed went into soft soil.'],
  ['Our bus stopped beside the pond.', 'Two geese crossed the road.'],
  ['Two red kites touched the clouds.', 'Their long tails fluttered.'],
  ['Please pass the empty bowl.', 'The berries will fit inside.'],
  ['A moth flew past me.', 'It circled the lamp.'],
  ['Put the dry leaves here.', 'They make a soft bed for the rabbit.'],
  ['The youngest duck swam first.', 'The others followed in a line.'],
  ['Which box holds the string?', 'Look inside the small blue one.'],
  ['We heard thunder during breakfast.', 'Rain tapped on the window.'],
  ['This path ends at a bridge.', 'The bridge crosses a creek.'],
  ['My sandwich fell upside down.', 'Some cheese landed on my shoe.'],
  ['Under this stone lives a beetle.', 'It hides there in the shade.'],
  ['Every shelf holds three boxes.', 'One box is full of shells.'],
  ['Wind shook the tall grass.', 'A field mouse ran for cover.'],
  ['Some shells have tiny holes.', 'A thin string fits through them.'],
  ['Before bed, I feed my fish.', 'It swims up to the flakes.'],
  ['Nobody opened the blue gate.', 'The latch was stuck.'],
  ['Can your little dog jump?', 'It can clear that log.'],
  ['The paint is almost dry.', 'Leave the picture on the table.'],
  ['She folded the paper twice.', 'Each fold made a neat edge.'],
  ['One mitten was still missing.', 'We found it under a bench.'],
  ['A bell rang above us.', 'We looked up at the tower.'],
  ['Carry the bucket with both hands.', 'Water might spill on the steps.'],
  ['The puppy ran through the sprinkler.', 'Cold drops flew from its ears.'],
  ['I can see a distant island.', 'A boat is heading there.'],
]);

// Deliberate print lines. Sentence ends and line ends occupy different places.
// Counts include the whole passage and ignore abbreviations inside sentences.
const connectedPrint = new Map([
  ['The small bird\nmade a nest.', 'The small bird carried a|twig. It tucked the twig|under its nest.'],
  ['Rain fell. We ran home.', 'Cold rain hit our|coats. We ran the rest|of the way home.'],
  ['Can we go? Yes, the rain has stopped.', 'Can we go outside|now? Yes, the rain has|stopped. Take your boots!', 3],
  ['I saw a little\nfish by the rock.', 'I saw a little silver|fish. It swam behind|the flat rock.'],
  ['One tiny beetle\nclimbed the stem.', 'One tiny beetle climbed|the stem. At the top|it spread its wings.'],
  ['Before the bell rang\nwe packed our books.', 'Before the bell rang we|packed our books. Our bags|were ready by the door.'],
  ['A very tall giraffe\nbent toward a branch.', 'A very tall giraffe bent|toward a branch. Its tongue|pulled off the leaves.'],
  ['The fallen apple\nrolled down the hill.', 'The fallen apple rolled|down the hill. It came|to rest in a ditch.'],
  ['Please close the window\nbefore rain comes in.', 'Please close the window|before rain comes in. The|sill is already wet.'],
  ['After the clouds cleared\nsunlight warmed the sand.', 'After the clouds cleared|sunlight warmed the sand. We|took off our shoes.'],
  ['The empty flowerpot\nstood near the gate.', 'The empty flowerpot stood|near the gate. A small|toad slept inside.'],
  ['Under a pile of coats\nMum found the ticket.', 'Under a pile of coats|Mum found the ticket. Just|in time for the train!'],
  ['A snail moved slowly. Its shell shone.', 'A snail slid along a|wet leaf. Its brown shell|shone in the light.'],
  ['Where is my glove? Look beside the gate.', 'Where did you last|wear your glove? Look beside|the red gate.'],
  ['Watch that puddle! The path is wet.', 'Watch that puddle on|the path! Mud splashed over|my socks.'],
  ['Someone knocked twice. Dad opened the door.', 'Someone knocked on our|door twice. Dad put down|his book and opened it.'],
  ['Our new kite broke. We fixed its tail.', 'Our new kite tore in|the wind. We fixed its|tail with a ribbon.'],
  ['Who closed the window? It is warm here.', 'Who closed the kitchen|window? It feels very warm|in here now.'],
  ['The lights went out. We found a torch.', 'The lights went out at|dusk. We found a torch|in the desk.'],
  ['Please wait here. I will fetch the key.', 'Please wait by the|steps. I will fetch the|key from Dad.'],
  ['What a tall tower! It almost touches the ceiling.', 'What a tall tower of|blocks! It almost touches|the ceiling.'],
  ['Can you hear that? A bell is ringing.', 'Can you hear that|sound? Mr. Lee rings|the school bell.', 2],
  ['The lid was stuck. I pulled hard. At last it opened.', 'The lid was stuck|tight. I pulled hard. At|last it popped open.', 3],
  ['Stop! A duck is crossing the path.', 'Stop by the gate! A|duck is crossing the path|with six ducklings.', 2],
  ['A seed fell. Rain came. Roots grew. A leaf appeared.', 'A seed fell into soft|soil. Rain came. Roots grew|down. A leaf appeared.', 4],
  ['Where is the puppy? Is it under the bed? I can hear it breathing.', 'Where is the puppy? Is|it under the bed? I|can hear it breathing.', 3],
  ['The bus arrived. We climbed aboard. Dad waved. Away we went!', 'The bus arrived. We|climbed aboard. Mr. Fox waved|to us. Away we went!', 4],
  ['A red mitt fell. We picked it up.', 'A red mitt fell from|her bag. We picked it|up from the floor.'],
  ['We dug in the sand. The tide came in.', 'We dug a deep hole|in the sand. The tide|filled it with water.'],
  ['Can you reach the pears? I can get a stool.', 'Can you reach the ripe|pears? I can get you|a stool from inside.'],
  ['When does the bell ring? We are ready.', 'When does the bell|ring today? We are ready|to go outside.'],
  ['Please keep quiet. The baby is asleep.', 'Please keep quiet by|the door. The baby is|asleep in the next room.'],
  ['Who needs this rope? We can tie the boat.', 'Who needs this length|of rope? We can tie|the boat to the post.'],
].map(([source, lines, count]) => [source, {lines:lines.split('|'),count}]));

function hash(text) {
  let value = 2166136261;
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0),16777619);
  return value >>> 0;
}

const tokens = text => text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];
const END_SENTENCE = 'Which word ends the first sentence?';
const START_LINE = 'Which word starts the second line?';
const COUNT_SENTENCES = 'How many sentences are here?';

// The first punctuation mark is inside the sentence. A hotspot response must
// distinguish that mark from the end of the requested sentence.
const hotspotOpening = new Map([
  ['Please leave your shoes here.', 'At the door, please leave your shoes here.'],
  ['Today the school gate opens early.', 'This morning, the school gate opens early.'],
  ['The ducks swim in the pond.', 'After the rain, the ducks swim in the pond.'],
  ['Who has the green bag?', 'Finn, who has the green bag?'],
  ['After lunch, we visit the garden.', 'After lunch, we visit the garden.'],
  ['Some shells have tiny holes.', 'On this beach, some shells have tiny holes.'],
  ['Before bed, I feed my fish.', 'Before bed, I feed my fish.'],
  ['Can your little dog jump?', 'Mia, can your little dog jump?'],
  ['A bell rang above us.', 'As we walked, a bell rang above us.'],
  ['The puppy ran through the sprinkler.', 'Barking loudly, the puppy ran through the sprinkler.'],
]);
const connectedHotspots = new Map([
  ['A red mitt fell. We picked it up.', ['Dr. Tan found a red mitt beside the gate.', 'It had a blue stripe.']],
  ['We dug in the sand. The tide came in.', ['Ms. Lin helped us dig in the sand.', 'The tide filled our hole.']],
  ['Can you reach the pears? I can get a stool.', ['Did Mr. Fox put the pears on that shelf?', 'I can get a stool.']],
  ['When does the bell ring? We are ready.', ['At nine, Mrs. Moss rings the school bell.', 'The class comes inside.']],
  ['Please keep quiet. The baby is asleep.', ['Mrs. Cole closed the door very quietly.', 'The baby was asleep.']],
  ['Who needs this rope? We can tie the boat.', ["A long rope lay on Mr. Lee's boat.", 'We tied the boat to the post.']],
]);

function printBoundary(item) {
  const source = item.passage.trim();
  let prompt = END_SENTENCE, passage, key, near, operation, hotspotIndex;
  if (item.adaptiveAreaBand === 3) {
    const second = companion.get(source);
    if (!second) throw Error('Missing pair of print sentences: ' + source);
    const first = hotspotOpening.get(source) || (source==='The youngest duck swam first.' ? 'The youngest duck swam ahead.' : source);
    const firstWords = tokens(first), nextWords = tokens(second);
    passage = first + ' ' + second;
    if (hotspotOpening.has(source)) hotspotIndex=first.split(/\s+/).length-1;
    key = firstWords.at(-1);
    near = [nextWords.at(-1),nextWords[0],firstWords.at(-2),firstWords[0],...nextWords];
    operation = 'locate_named_sentence_boundary';
  } else {
    const entry = connectedPrint.get(source);
    if (!entry) throw Error('Missing connected print passage: ' + source);
    const {lines,count} = entry;
    passage = lines.join('\n');
    prompt = count ? COUNT_SENTENCES : item.prompt === START_LINE ? START_LINE : END_SENTENCE;
    operation = 'track_connected_print_across_lines';
    if (connectedHotspots.has(source)) {
      const [first,second] = connectedHotspots.get(source);
      passage = first+' '+second;
      hotspotIndex = first.split(/\s+/).length-1;
      key = tokens(first).at(-1);
      operation = 'distinguish_sentence_end_from_abbreviation';
    } else if (count) {
      key = String(count);
      near = [1,2,3,4,5].filter(n => Math.abs(n-count) <= 2).map(String);
    } else {
      const firstSentence = passage.split(/[.!?]/)[0];
      key = prompt === START_LINE ? tokens(lines[1])[0] : tokens(firstSentence).at(-1);
      const following = passage.slice(firstSentence.length + 1);
      near = [tokens(lines[0]).at(-1),tokens(lines[2])[0],tokens(following)[0],tokens(passage).at(-1),
        tokens(firstSentence).at(-2),tokens(passage)[0],...tokens(lines[1])];
    }
  }
  const hotspot = Number.isInteger(hotspotIndex);
  let choices, answer;
  if (hotspot) {
    choices = passage.split(/\s+/).map((label,tokenIndex)=>({id:'c'+tokenIndex,label,tokenIndex}));
    answer = choices[hotspotIndex].id;
  } else {
    const labels = [key,...new Set(near.filter(word => word && word !== key))].slice(0,4);
    if (labels.length !== 4) throw Error('Incomplete print contrast: ' + item.id);
    choices = labels.map((label,index) => ({id:'c'+index,label})).sort((a,b) => hash(item.id+a.label)-hash(item.id+b.label));
    answer = 'c0';
  }
  const cue = {role:'instruction',text:prompt,path:getLedaInstructionAudioPath(prompt),required:true};
  if (!cue.path) throw Error('Missing print instruction: ' + prompt);
  const requires = item.adaptiveAreaBand === 3
    ? 'Find the end of a specified sentence among words on both sides of its boundary.'
    : hotspot ? 'Distinguish a sentence ending from the period in an abbreviated title within connected print.'
      : 'Distinguish complete sentences from physical print lines while following a connected passage.';
  return {...item,prompt,passage,choices,answer,format:hotspot ? 'select_text':'choice',answerMode:'exact',displayPassageDuringResponse:true,
    adaptiveDemand:{operation,requires},constructClaim:operation,taskDemand:{reviewed:true,operation,proof:{passage,prompt,key}},
    requiredAudioCues:[cue],requiredAudioPaths:[cue.path],explanation:`The printed passage gives the answer “${key}”.`,
    distractorRationales:Object.fromEntries(choices.filter(c=>c.id!==answer).map(c=>[c.id,
      prompt===COUNT_SENTENCES ? 'This count does not match the complete sentences.' : 'This word is in the passage at another position.']))};
}

// Each group contains plausible shape confusions for the indicated case.
const smallConfusions = {
  a:'odqec',b:'dpqh',c:'eosau',d:'bpqa',e:'coags',f:'tjlr',g:'qjypa',h:'nbkr',
  i:'ljtf',j:'igyf',k:'hxtr',l:'itjf',m:'nwrhu',n:'mhru',o:'aceqd',p:'bqdg',
  q:'pdgob',r:'nvfh',s:'czeg',t:'flij',u:'vnwy',v:'uwyr',w:'vmnu',x:'kzyv',y:'vjug',z:'xsne',
};
function caseMatch(item) {
  const keyId = item.answer[0], correct = item.choices.find(c=>c.id===keyId).label;
  const lower = correct.toLowerCase();
  const alternatives = [...smallConfusions[lower]].sort((a,b)=>hash(item.id+a)-hash(item.id+b));
  const choices = item.choices.map(choice => {
    if (choice.id===keyId) return choice;
    const next = alternatives.shift();
    return {...choice,label:correct===lower ? next : next.toUpperCase()};
  });
  return {...item,choices,distractorRationales:Object.fromEntries(choices.filter(c=>c.id!==keyId)
    .map(c=>[c.id,`The shape of ${c.label} belongs to another letter.`]))};
}

const shortVowelWords = {
  a:'bag bat can cap cat fan gap ham jam lamp lap man map mat pan pat rag ram sat tap van',
  e:'bed bell den desk fed hen jet led leg men mess met neck net peg pen pet red ten vet web wet',
  i:'bib big bin bit dig dip fin fit gift grin hid hip hit kid kin kit lid lip pin pig rib rip sit tin tip wig win',
  o:'box cob cod cot dot fox hop hot job jog log lot mop nod pot rob rock rod rot sock sob top',
  u:'bud bug bun bus but cub cup cut dug fun gum hug hum hut jug lump mud mug nut plug pup rub rug run sub sum sun tub tug',
};
const medialPool = Object.entries(shortVowelWords).flatMap(([vowel,list]) => list.split(' ')
  .map(word=>({word,vowel,path:getLedaWordAudioPath(word)})).filter(option=>option.path));

function withSpokenChoices(item,choices) {
  const byId = new Map(choices.map(c=>[c.id,c]));
  const requiredAudioCues = item.requiredAudioCues.map(c=>{
    if (c.role !== 'choice') return c;
    const option = byId.get(c.choiceId);
    if (!option?.audioPath) throw Error('Missing recorded option in '+item.id);
    return {...c,text:option.label,value:option.label,path:option.audioPath};
  });
  const requiredImagePaths = [...new Set([item.image,...choices.map(c=>c.image)].filter(Boolean))];
  return {...item,choices,requiredAudioCues,requiredAudioPaths:[...new Set(requiredAudioCues.map(c=>c.path))],
    requiredImagePaths,mediaDecision:{...item.mediaDecision,paths:requiredImagePaths}};
}

function gateOnsets(item) {
  // The three old foils all started /k/, leaving glass as the odd one out
  // even when the recording of gate had not been heard.
  const labels = {cake:'mop',key:'hat'};
  const choices = item.choices.map(c=>{
    const label = labels[c.label];
    if (!label) return c;
    return {...c,label,image:'/images/assessment/objective-words/'+label+'.webp',imageAlt:label,
      audioPath:getLedaWordAudioPath(label)};
  });
  return {...withSpokenChoices(item,choices),
    distractorRationales:Object.fromEntries(choices.filter(c=>c.id!==item.answer).map(c=>
      [c.id,`The first sound of ${c.label} differs from the first sound in gate.`]))};
}

function medialContrast(item) {
  const correct = item.choices.find(c=>c.id===item.answer);
  const targetVowel = medialPool.find(c=>c.word===correct.label)?.vowel;
  if (!targetVowel) throw Error('Missing reviewed medial vowel: ' + correct.label);
  const used = new Set([targetVowel]);
  const reference = item.targetWord;
  const ranked = medialPool.filter(c=>c.word!==reference && c.vowel!==targetVowel)
    .sort((a,b)=>hash(item.id+a.word)-hash(item.id+b.word));
  const select = accepts => {
    const result = ranked.find(c=>!used.has(c.vowel) && accepts(c.word))
      || ranked.find(c=>!used.has(c.vowel));
    used.add(result.vowel);
    return result;
  };
  const foils = [select(word=>word[0]===reference[0]),select(word=>word.at(-1)===reference.at(-1)),select(()=>true)];
  const choices = item.choices.map(c=>{
    if(c.id===item.answer) return c;
    const next = foils.shift();
    return {...c,label:next.word,audioPath:next.path};
  });
  return {...withSpokenChoices(item,choices),
    distractorRationales:Object.fromEntries(choices.filter(c=>c.id!==item.answer)
      .map(c=>[c.id,`The middle vowel of ${c.label} differs from the middle vowel in ${reference}.`])),
    taskDemand:{...item.taskDemand,reviewed:true,operation:item.adaptiveDemand.operation,proof:{...item.taskDemand?.proof,
      targetWord:reference,key:correct.label,correctVowel:targetVowel,choiceWords:choices.map(c=>c.label)}}};
}

// Two ordinary spellings of the same sound require an audible meaning cue.
// Each sentence uses the existing matching production recording.
const spellingContexts = {
  sun:'The sun is hot.',plum:'A plum is purple. It is little.',plane:'The plane flew over the city.',
  plate:'Mia washed a plate, dried it, and put it on the shelf.',prize:'Auntie Meg won a prize for her huge pumpkin.',
  paste:'They are ground to paste.',close:'A ball rolled into the open doorway. It blocked the door. Mia could not close it.',
  sweets:'On sports day, Vic guards his bag of sweets so that nobody else gets a single one.',
};
const unavailableDictation = new Set('sum baste graze prose spade stile waste plains creeks beachball tripe truce'.split(' '));
function spelling(item) {
  if (unavailableDictation.has(item.answer) && !item.image) return {...item,adaptiveMixedEligible:false};
  const sentence = !item.image && spellingContexts[item.answer];
  const context = sentence && {role:'passage',text:sentence,path:getLedaInstructionAudioPath(sentence),required:true};
  if (context && !context.path) throw Error('Missing recorded spelling context: ' + sentence);
  const cues = context ? [...item.requiredAudioCues.filter(c=>c.role!=='target_word'),context,
    ...item.requiredAudioCues.filter(c=>c.role==='target_word')] : item.requiredAudioCues;
  const operation = item.adaptiveDemand.operation;
  const requires = ['','','Spell all three sounds of a dictated CVC word.',
    'Spell the complete dictated word while retaining both consonants in a blend.',
    'Spell a complete dictated word independently, including its split-vowel pattern.',
    'Spell five spoken phonemes independently, selecting the letters for the vowel team.',
    'Spell the complete extended word independently across its morpheme or compound boundary.'][item.adaptiveAreaBand];
  const proof = {...item.taskDemand?.proof};
  delete proof.responseTiles;
  delete proof.spareTiles;
  const features = {...item.taskDemand?.features};
  delete features.spareTiles;
  delete features.responseUnitCount;
  return {...item,alphabetSpelling:true,renderTargetText:false,passage:sentence||'',displayPassageDuringResponse:false,requiredAudioCues:cues,
    requiredAudioPaths:[...new Set(cues.map(c=>c.path))],adaptiveDemand:{operation,requires},
    taskDemand:{reviewed:true,operation,features:{...features,alphabetAvailable:true},
      proof:{...proof,dictatedWord:item.answer,context:sentence||null,responseAlphabet:'abcdefghijklmnopqrstuvwxyz'}},
    mediaDecision:{...item.mediaDecision,reason:'The spoken target is spelled using the complete alphabet. No letter count or preselected grapheme is shown.'},
    explanation:requires};
}

export function reviewFoundationItem(item) {
  if (!item.adaptiveMixedEligible || item.tutorialOnly) return item;
  if (item.domainId==='print') {
    if (item.adaptiveAreaBand>=3) return printBoundary(item);
    if (item.format==='match' && item.adaptiveAreaBand===1) return caseMatch(item);
  }
  if (item.domainId==='phonics' && item.format==='build_word') return spelling(item);
  if (item.id==='lp3.initial_sounds.l2.C.g.v3') return gateOnsets(item);
  if (item.domainId==='sound_awareness' && item.adaptiveAreaBand===3) return medialContrast(item);
  return item;
}

// Classify the revised response conditions from the available inputs and
// keyed answer. Historical banks continue to use their own classifiers.
export function reviewedFoundationBand(item) {
  if (item.domainId === 'phonics' && item.format === 'build_word' && item.alphabetSpelling) {
    const word = item.answer, proof = item.taskDemand?.proof, features = item.taskDemand?.features;
    if (typeof word !== 'string' || word!==item.targetWord || word!==proof?.dictatedWord
      || !features?.alphabetAvailable || proof.responseAlphabet!=='abcdefghijklmnopqrstuvwxyz'
      || item.renderTargetText || item.displayPassageDuringResponse || (item.passage||null)!==proof.context
      || item.passage && !item.requiredAudioCues.some(c=>c.role==='passage'&&c.text===item.passage&&c.path)
      || !item.requiredAudioCues.some(c=>c.role==='target_word'&&c.text===word&&c.path)
      || item.requiredAudioCues.some(c=>c.role==='choice') || item.choices.some(c=>c.audioPath)) return null;
    const vowelTeam = features.vowelTeam;
    if (proof.compoundParts?.join('')===word || proof.morphemeExtension?.stem + proof.morphemeExtension?.suffix === word) {
      return proof.phonemes?.length>=6 && vowelTeam && word.includes(vowelTeam) ? 6 : null;
    }
    if (vowelTeam) return proof.phonemes?.length===5 && word.includes(vowelTeam) ? 5 : null;
    if (features.splitVowel) {
      const [v,e] = proof.splitVowelPositions || [];
      return word.length===5 && e===4 && word[e]==='e' && /^[aeiou]$/.test(word[v])
        && proof.phonemes?.length===4 ? 4 : null;
    }
    if (/^(?:[bcdfghjklmnpqrstvwxyz]{2}[aeiou][bcdfghjklmnpqrstvwxyz]|[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz]{2})$/.test(word)) return 3;
    return /^[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz]$/.test(word) ? 2 : null;
  }
  if (item.domainId==='print' && [END_SENTENCE,START_LINE,COUNT_SENTENCES].includes(item.prompt)) {
    const passage = item.passage;
    if (typeof passage!=='string' || !item.displayPassageDuringResponse || item.requiredAudioCues.length!==1
      || item.requiredAudioCues[0].text!==item.prompt || item.requiredAudioCues[0].role!=='instruction') return null;
    const answer = item.choices.find(c=>c.id===item.answer);
    const withoutTitles = passage.replace(/\b(?:Dr|Mrs|Mr|Ms)\./g,word=>word.slice(0,-1));
    const sentences = withoutTitles.split(/[.!?]+/).map(s=>s.trim()).filter(Boolean);
    if (sentences.length<2 || !answer) return null;
    const lines = passage.split('\n');
    const key = item.prompt===COUNT_SENTENCES ? String(sentences.length) : item.prompt===START_LINE
      ? tokens(lines[1]||'')[0] : tokens(sentences[0]).at(-1);
    if (item.format==='select_text') {
      if (item.prompt!==END_SENTENCE || tokens(answer.label).at(-1)!==key || answer.tokenIndex!==sentences[0].split(/\s+/).length-1
        || item.choices.map(c=>c.label).join(' ')!==passage.replace(/\s+/g,' ')) return null;
      if (withoutTitles!==passage) return 4;
      return sentences[0].includes(',') ? 3 : null;
    }
    if (item.format!=='choice' || answer.label!==key || item.choices.length!==4 || new Set(item.choices.map(c=>c.label)).size!==4) return null;
    if (item.prompt!==COUNT_SENTENCES && item.choices.some(c=>!tokens(passage).includes(c.label))) return null;
    return lines.length===3 ? 4 : lines.length===1 && item.prompt===END_SENTENCE ? 3 : null;
  }
  if (item.domainId==='sound_awareness' && item.skillId==='short_vowel_discrimination') {
    const vowelOf = word => Object.entries(shortVowelWords).find(([,words])=>words.split(' ').includes(word))?.[0];
    const vowels = item.choices.map(c=>vowelOf(c.label));
    const anchor = item.targetWord.match(/[aeiou]/)?.[0];
    const correct = item.choices.find(c=>c.id===item.answer);
    return correct && item.hideWrittenLabels && !item.renderTargetText && new Set(vowels).size===4 && !vowels.includes(undefined)
      && vowelOf(correct.label)===anchor && item.choices.every(c=>item.requiredAudioCues.some(cue=>cue.role==='choice'
        && cue.choiceId===c.id && cue.text===c.label && cue.path===c.audioPath)) ? 3 : null;
  }
  if (item.domainId==='print' && item.format==='match' && item.skillId==='letter_knowledge') {
    const reference = item.matchTargets?.[0]?.label;
    const choice = item.choices.find(c=>c.id===item.answer?.[0]);
    if (!reference || !choice || reference===choice.label || reference.toLowerCase()!==choice.label.toLowerCase()) return null;
    return item.choices.filter(c=>c.id!==choice.id).every(c=>smallConfusions[reference.toLowerCase()]?.includes(c.label.toLowerCase())) ? 1 : null;
  }
  return null;
}
