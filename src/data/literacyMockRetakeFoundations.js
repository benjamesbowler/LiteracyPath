import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';

const SOURCE = 'src/data/literacyMockRetakeFoundations.js';
// Every selected raster was visually inspected at approximately 240px in the
// task's ignored review sheets. Rejected close/open/reach/nod/vet candidates
// are not admitted merely because a plausible filename exists.
const PICTURES = Object.freeze({
  "bear": "/images/child-mode/initial-sounds/bear.webp",
  "basket": "/media/initial-sounds/images/b/basket.webp",
  "bench": "/images/assessment/objective-words/bench.webp",
  "boot": "/images/assessment/literacy-mock/capacity/foundation-boot.webp",
  "cheese": "/images/assessment/objective-words/cheese.webp",
  "door": "/images/assessment/literacy-mock/capacity/foundation-door.webp",
  "drum": "/images/assessment/blends/drum.webp",
  "elephant": "/images/assessment/digraphs/elephant.webp",
  "face": "/images/child-mode/vocabulary/face.webp",
  "foot": "/images/child-mode/vocabulary/foot.webp",
  "glass": "/images/assessment/objective-words/glass.webp",
  "grapes": "/images/assessment/blends/grapes.webp",
  "horse": "/images/assessment/literacy-mock/capacity/foundation-horse.webp",
  "milk": "/images/assessment/literacy-mock/capacity/foundation-milk.webp",
  "mouse": "/images/assessment/literacy-mock/capacity/foundation-mouse.webp",
  "nose": "/images/assessment/objective-words/nose.webp",
  "pencil": "/media/initial-sounds/images/p/pencil.webp",
  "rabbit": "/media/initial-sounds/images/r/rabbit.webp",
  "shirt": "/images/assessment/digraphs/shirt.webp",
  "train": "/images/assessment/objective-words/train.webp",
  "truck": "/images/assessment/digraphs/truck.webp",
  "ladder": "/media/initial-sounds/images/l/ladder.webp",
  "beach": "/media/vocabulary/images/beach.webp",
  "table": "/media/initial-sounds/images/t/table.webp",
  "ladle": "/media/vocabulary/images/ladle.webp",
  "cookie": "/media/vocabulary/images/cookie.webp",
  "crayon": "/media/vocabulary/images/crayon.webp",
  "ruler": "/media/initial-sounds/images/r/ruler.webp",
  "pizza": "/media/initial-sounds/images/p/pizza.webp",
  "scissors": "/media/vocabulary/images/scissors.webp",
  "lantern": "/media/initial-sounds/images/l/lantern.webp",
  "orange": "/images/assessment/objective-words/orange.webp",
  "pear": "/media/vocabulary/images/pear.webp",
  "lemon": "/images/assessment/generated/initial-sounds-l2/lemon.webp",
  "peach": "/media/vocabulary/images/peach.webp",
  "carrot": "/media/initial-sounds/images/c/carrot.webp",
  "potato": "/images/child-mode/vocabulary/potato.webp",
  "tomato": "/images/assessment/objective-words/tomato.webp",
  "fork": "/images/child-mode/initial-sounds/fork.webp",
  "plate": "/media/vocabulary/images/plate.webp",
  "bowl": "/media/vocabulary/images/bowl.webp",
  "bottle": "/media/vocabulary/images/bottle.webp",
  "toothbrush": "/media/initial-sounds/images/t/toothbrush.webp",
  "towel": "/media/vocabulary/images/towel.webp",
  "umbrella": "/images/assessment/release-media/umbrella-e1f6f2a3.webp",
  "shorts": "/media/vocabulary/images/shorts.webp",
  "skirt": "/images/assessment/literacy-mock/capacity/foundation-skirt.webp",
  "belt": "/images/assessment/blends/belt.webp",
  "dress": "/images/assessment/literacy-mock/capacity/foundation-dress.webp",
  "sofa": "/media/vocabulary/images/sofa.webp",
  "pillow": "/media/vocabulary/images/pillow.webp",
  "blanket": "/media/vocabulary/images/blanket.webp",
  "swing": "/images/assessment/rhyming/variants/ing/swing-02.webp",
  "slide": "/images/child-mode/blends/slide.webp",
  "comb": "/media/vocabulary/images/comb.webp",
  "scarf": "/media/vocabulary/images/scarf.webp",
  "eat": "/media/vocabulary/images/eat.webp",
  "walk": "/media/vocabulary/images/walk.webp",
  "dance": "/images/assessment/generated/concepts/dancer.webp",
  "read": "/media/vocabulary/images/read.webp",
  "draw": "/media/vocabulary/images/draw.webp",
  "wash": "/media/vocabulary/images/wash.webp",
  "wave": "/media/vocabulary/images/wave.webp",
  "crawl": "/media/vocabulary/images/crawl.webp",
  "climb": "/media/vocabulary/images/climb.webp",
  "throw": "/media/vocabulary/images/throw.webp",
  "catch": "/media/vocabulary/images/catch.webp",
  "push": "/media/vocabulary/images/push.webp",
  "pull": "/media/vocabulary/images/pull.webp",
  "laugh": "/media/vocabulary/images/laugh.webp",
  "cry": "/media/vocabulary/images/cry.webp",
  "smile": "/media/vocabulary/images/smile.webp",
  "sneeze": "/images/assessment/literacy-mock/capacity/foundation-sneeze.webp",
  "point": "/media/vocabulary/images/point.webp",
  "stretch": "/images/assessment/language/variants/verbs/stretch-01.webp",
  "den": "/media/vocabulary/images/den.webp",
  "ham": "/images/assessment/objective-words/ham.webp",
  "mat": "/images/assessment/objective-words/mat.webp",
  "ram": "/images/child-mode/short-a/ram.webp",
  "tag": "/media/rhyming/images/tag.webp",
  "pup": "/media/vocabulary/images/pup.webp",
  "bun": "/images/assessment/generated/phonics-quality/bun.webp",
  "gum": "/images/child-mode/vocabulary/gum.webp",
  "hut": "/images/child-mode/initial-sounds/hut.webp",
  "nap": "/images/child-mode/cvc/nap.webp",
  "dam": "/media/vocabulary/images/dam.webp",
  "can": "/media/vocabulary/images/can.webp",
  "bib": "/media/vocabulary/images/bib.webp",
  "lip": "/media/vocabulary/images/lip.webp",
  "zip": "/images/child-mode/short-i/zip.webp",
  "pit": "/media/vocabulary/images/pit.webp",
  "rag": "/media/vocabulary/images/rag.webp",
  "pad": "/media/vocabulary/images/pad.webp",
  "fig": "/media/vocabulary/images/fig.webp",
  "rub": "/media/vocabulary/images/rub.webp",
  "dog": "/images/assessment/objective-words/dog.webp",
  "pig": "/images/assessment/rhyming/variants/ig/pig-02.webp",
  "cat": "/images/assessment/objective-words/cat.webp",
  "cup": "/images/assessment/objective-words/cup.webp",
  "apple": "/images/assessment/objective-words/apple.webp",
  "bus": "/images/child-mode/initial-sounds/bus.webp",
  "fish": "/images/assessment/digraphs/fish.webp",
  "bed": "/images/assessment/objective-words/bed.webp",
  "net": "/images/assessment/objective-words/net.webp",
  "map": "/images/assessment/objective-words/map.webp",
  "goat": "/images/assessment/long-vowels/goat.webp",
  "coat": "/images/child-mode/initial-sounds/coat.webp",
  "hug": "/images/assessment/literacy-mock/capacity/foundation-hug.webp",
  "hat": "/images/child-mode/initial-sounds/hat.webp",
  "jam": "/images/assessment/objective-words/jam.webp",
  "tent": "/images/assessment/objective-words/tent.webp",
  "web": "/images/assessment/objective-words/web.webp",
  "van": "/images/assessment/objective-words/van.webp",
  "zoo": "/images/child-mode/initial-sounds/zoo.webp",
  "bike": "/images/assessment/objective-words/bike.webp",
  "chair": "/images/child-mode/digraphs/chair.webp",
  "tap": "/images/child-mode/initial-sounds/tap.webp"
});


const words = text => text.split(' ');
const HFW_GROUPS = Object.freeze({
  hfw_1_25: 'and are as be for he his of the was you',
  hfw_26_50: 'all an but by can do had how if not one or she use we',
  hfw_51_75: 'go has her him out see so two up',
  hfw_76_100: 'day did get may my no now way who',
});
// Curated short familiar recognition targets. Membership in a later frequency
// list does not increase demand. None requires a sentence blank or spelling.
export const LITERACY_MOCK_V8_HFW_FLOOR_WORDS = Object.freeze(Object.values(HFW_GROUPS).flatMap(words));
const hfwTargets = new Set(LITERACY_MOCK_V8_HFW_FLOOR_WORDS);
const oldHfwTargets = new Set(words('a i at in is it on to'));
const lexicalFamily = word => `${hfwTargets.has(word) || oldHfwTargets.has(word) ? 'hfw-word' : 'mock-foundation-word'}:${word}`;
const picture = word => PICTURES[word] || null;
const instruction = text => ({ role:'instruction', text, path:getLedaInstructionAudioPath(text) || null, required:true });
const spoken = (role,text,extra={}) => ({ role,text,path:getLedaWordAudioPath(text) || null,required:true,...extra });
const choices = labels => labels.map((label,index)=>({id:`c${index}`,label}));
const pictureChoices = labels => choices(labels).map(c=>({...c,image:picture(c.label),imageAlt:c.label}));
const choiceAudio = labels => labels.map((label,index)=>spoken('choice',label,{choiceId:`c${index}`,value:label}));
const firstSound = {b:'b',c:'k',d:'d',f:'f',g:'g',h:'h',j:'j',k:'k',l:'l',m:'m',n:'n',p:'p',t:'t',v:'v',w:'w',z:'z'};
const initialPartner = {b:'bus',c:'cat',d:'dog',f:'fish',g:'goat',h:'hat',j:'jam',k:'cup',l:'log',m:'map',n:'net',p:'pig',t:'tent',v:'van',w:'web',z:'zoo'};
const INITIAL_TARGETS = words('butterfly corn camera dinosaur dolphin feather guitar gorilla house jacket kangaroo kettle penguin pumpkin tiger window zipper zebra mountain microphone necklace newspaper volcano vulture watermelon');
const MEDIAL = [
 ['red','leg','cat','pig'],['wet','pen','cup','dog'],['hit','pin','cat','net'],['sip','fin','dog','cup'],
 ['dot','log','bed','pig'],['fog','pot','sun','net'],['tub','cup','cat','pig'],['fun','rug','dog','bed'],
 ['man','cat','pig','cup'],['pet','hen','sun','dog'],
 ['back','cat','pig','cup'],['bell','bed','sun','dog'],['best','hen','cat','pig'],['belt','pen','dog','cup'],
 ['bank','pan','hen','pig'],['desk','net','sun','dog'],['gift','pin','cat','cup'],['hand','hat','bed','pig'],
 ['lamp','cat','dog','sun'],['list','pig','bed','cup'],
];
const CVC_STARTERS = words('red wet hit sip dot fog wig pet man van web fun');
const CVC_BUILDS = words('bet big bud dad dip fed gas hip hot hum jab lab lot pat rib rob sad sat sum tip');
// Real CVC neighbours keep the complete printed word necessary.
const CVC_FOILS = {red:['rod','rid'],wet:['wit','win'],hit:['hot','hat'],sip:['sap','sit'],dot:['dog','dig'],
 fog:['fig','fin'],wig:['wag','win'],pet:['pat','pit'],man:['men','mat'],van:['vat','vet'],web:['wet','red'],fun:['fan','fin']};
const LISTENING = [
 ['bear','A bear sleeps through winter.'],['basket','Please carry this basket.'],['bench','We rest on the bench.'],
 ['boot','One boot has a hole.'],['cheese','The cheese tastes salty.'],['door','Please shut the door.'],
 ['drum','I beat the drum loudly.'],['elephant','An elephant has a long trunk.'],['face','There is mud on your face.'],
 ['foot','My left foot hurts.'],['glass','She filled the glass with water.'],['grapes','These grapes grow in a bunch.'],
 ['horse','The horse eats hay.'],['milk','Keep the milk cold.'],['mouse','A mouse nibbles a seed.'],
 ['nose','He rubbed his nose.'],['pencil','Sharpen the pencil before writing.'],['rabbit','The rabbit twitches its ears.'],
 ['shirt','Your shirt needs a button.'],['train','The train stopped at the station.'],['truck','A truck carries the heavy boxes.'],
 ['ladder','Hold the ladder steady.'],['beach','We made sandcastles on the beach.'],['table','Set lunch on the table.'],
 ['ladle','Use the ladle to serve soup.'],
 ['cookie','The cookie has chocolate chips.'],['crayon','This crayon made a purple line.'],
 ['ruler','Use the ruler to draw a straight line.'],['pizza','We cut the pizza into slices.'],
 ['scissors','The scissors cut through the paper.'],['lantern','A lantern lit the dark path.'],
];
const VOCABULARY = [
 ['orange','pear','apple'],['pear','apple','peach'],['lemon','orange','pear'],['peach','pear','apple'],
 ['carrot','potato','tomato'],['potato','carrot','tomato'],['tomato','carrot','potato'],
 ['fork','cup','bowl'],['plate','bowl','cup'],['bowl','plate','cup'],['bottle','cup','bowl'],
 ['toothbrush','comb','towel'],['towel','comb','toothbrush'],['umbrella','coat','hat'],
 ['shorts','skirt','dress'],['skirt','shorts','dress'],['belt','scarf','coat'],['dress','skirt','coat'],
 ['sofa','bed','chair'],['pillow','blanket','bed'],['blanket','pillow','bed'],
 ['swing','slide','bike'],['slide','swing','bike'],['comb','toothbrush','towel'],['scarf','coat','belt'],
];
const ACTIONS = words('eat walk dance read draw wash wave crawl climb throw catch push pull laugh cry smile sneeze point stretch hug');
const ACTION_FORMS = {eat:'eating',walk:'walking',dance:'dancing',read:'reading',draw:'drawing',wash:'washing',wave:'waving',crawl:'crawling',climb:'climbing',throw:'throwing',catch:'catching',push:'pushing',pull:'pulling',laugh:'laughing',cry:'crying',smile:'smiling',sneeze:'sneezing',point:'pointing',stretch:'stretching',hug:'hugging'};
const READING = [
 ['den','dad','hen'],['ham','hat','hem'],['mat','map','met'],['ram','rat','rim'],['tag','tap','tug'],
 ['pup','pop','cup'],['bun','bin','bus'],['gum','gem','sum'],['hut','hat','hot'],['nap','nip','net'],
 ['dam','dim','dad'],['can','cat','cap'],['bib','big','bin'],['lip','lap','lit'],['zip','zap','tip'],
 ['pit','pin','pet'],['rag','rig','rug'],['pad','pan','pat'],['fig','fin','fog'],['rub','rib','rob'],['tap','tip','top'],
];
const PRINT_WORDS = words('ribbon button pocket flower carpet bucket turtle tunnel market candle puzzle sandwich helicopter mitten dolphin feather pumpkin jacket garden window');
const NAMES = words('Arlo Esme Hugo Luca Maeve Nico Otis Pippa Rory Zara Cora Theo');
const SENTENCE_CAPITALS = [
 'Fireflies glow beside the pond.','A mitten fell behind the bench.','Clouds hid the full moon.',
 'Our puppy chewed the soft slipper.','The kettle began to whistle.','A snail left a silver trail.',
 'Wind rattled the loose gate.','We shared the last peach.','The yellow bus turned slowly.',
 'Grandpa fixed my broken kite.','Raindrops tapped against the window.','One candle lit the room.',
];

/** New sources only. The caller normalizes and publishes a new version.
 * Missing exact audio remains null so the approved gap tool can discover it. */
export function buildLiteracyMockRetakeFoundations(base=[]) {
  void base;
  const output=[];
  const add=(q,band)=>{
    const target=(q.targetWord||'').toLowerCase();
    const paths=[...new Set([q.image,...(q.choices||[]).map(c=>c.image)].filter(Boolean))];
    const item={format:'choice',answer:'c0',answerMode:'exact',level:band===0?1:2,
      modality:'recognition',passage:'',foundationBand:band,
      stimulusKey:target,canonicalPassageId:target,exposureFamilyId:lexicalFamily(target),
      sourceProvenance:{kind:'original_literacy_guide',file:SOURCE,sourceId:q.id},
      mediaDecision:{role:paths.length?'evidence':'audio-and-print',paths,constructReview:'approved',answerNeutral:'approved',
        reason:paths.length?'Exact represented word/action raster was inspected at child-card size.':'Audio and printed response units are the declared evidence; a picture would add no required information.'},
      ...q};
    item.distractorRationales ||= Object.fromEntries(item.choices.slice(1).map(c=>[c.id,`${c.label} does not match the supplied ${item.constructClaim} evidence.`]));
    output.push(item);
  };
  for(const word of INITIAL_TARGETS) {
    const key=initialPartner[word[0]],sound=firstSound[word[0]];
    const foils=['dog','fish','pig','cup','net','web','van'].filter(w=>firstSound[w[0]]!==sound).slice(0,2);
    const labels=[key,...foils],prompt='Which word has the same starting sound?';
    add({id:`mock.v8.sounds.initial.${word}`,skillId:'initial_sounds',domainId:'sound_awareness',targetWord:word,
      prompt,choices:pictureChoices(labels),hideWrittenLabels:true,evidenceModality:'audio+image',
      constructClaim:'initial_sound_discrimination',requiredAudioCues:[instruction(prompt),spoken('target_word',word),...choiceAudio(labels)],
      explanation:`${word} and ${key} start with the same spoken sound.`,
      distractorRationales:Object.fromEntries(labels.slice(1).map((label,i)=>[`c${i+1}`,`${label} begins with a different phoneme from ${word}.`])),
      difficultyEvidence:'Compare familiar recorded initial phonemes; no letter mapping, blend or manipulation is required.'},0);
  }
  for(const [word,key,...foils]of MEDIAL) {
    const labels=[key,...foils],prompt='Which word has the same middle vowel sound?';
    add({id:`mock.v8.sounds.medial.${word}`,skillId:'short_vowel_discrimination',domainId:'sound_awareness',targetWord:word,
      prompt,choices:choices(labels),hideWrittenLabels:true,evidenceModality:'audio',
      constructClaim:'spoken_medial_vowel_discrimination',requiredAudioCues:[instruction(prompt),spoken('target_word',word),...choiceAudio(labels)],
      explanation:`Ignore the outside consonants: ${word} and ${key} share the internal vowel.`,
      difficultyEvidence:'Compare internal spoken vowels while ignoring different initial and final consonants.'},3);
  }
  for(const [skillId,list]of Object.entries(HFW_GROUPS))for(const word of words(list)) {
    const pool=word.length===2?words('up no we my be go'):words('and you the was his can see for');
    const labels=[word,...pool.filter(w=>w!==word&&w[0]!==word[0]).slice(0,2)];
    const prompt='Which printed word matches this recording?';
    add({id:`mock.v8.phonics.familiar.${word}`,skillId,domainId:'phonics',targetWord:word,
      prompt,choices:choices(labels),evidenceModality:'audio+print',constructClaim:'spoken_to_print_high_frequency_word_recognition',
      requiredAudioCues:[instruction(prompt),spoken('target_word',word)],
      explanation:`The printed word ${word} matches the exact spoken word.`,
      difficultyEvidence:'Recognize one familiar word of at most three letters; no context inference, spelling or frequency-rank promotion.'},0);
  }
  for(const word of CVC_STARTERS) {
    const prompt='Which printed word matches this recording?';
    add({id:`mock.v8.phonics.cvc.${word}`,skillId:'cvc_short_vowels',domainId:'phonics',targetWord:word,
      prompt,choices:choices([word,...CVC_FOILS[word]]),evidenceModality:'audio+print',
      constructClaim:`match_spoken_short_vowel_word:short_${word[1]}`,
      requiredAudioCues:[instruction(prompt),spoken('target_word',word)],explanation:`Read all three letters to match ${word}.`,
      difficultyEvidence:'Discriminate a complete CVC word against real CVC neighbours; the printed initial alone does not distinguish the key.'},1);
  }
  for(const word of CVC_BUILDS) {
    const prompt='Build the word you hear.',tiles=[...word];
    const spareVowels=[...'aeiou'].filter(v=>v!==word[1]).slice(0,2);
    add({id:`mock.v8.phonics.build.${word}`,skillId:'cvc_short_vowels',domainId:'phonics',targetWord:word,
      format:'build_word',answer:word,prompt,choices:choices([...tiles,...spareVowels]),responseLength:3,phonemeTiles:tiles,
      evidenceModality:'audio+print',modality:'dictation',constructClaim:`construct_short_vowel_phoneme_sequence:short_${word[1]}`,
      requiredAudioCues:[instruction(prompt),spoken('target_word',word)],explanation:`${tiles.join(' + ')} spells the complete dictated word ${word}.`,
      distractorRationales:Object.fromEntries(spareVowels.map((v,i)=>[`c${tiles.length+i}`,`${v} changes the short vowel in ${word}.`])),
      difficultyEvidence:'Construct all three ordered graphemes of one dictated CVC word; spare vowel tiles do not supply another valid target.'},2);
  }
  for(const [word,sentence]of LISTENING)for(const band of [0,1]) {
    const labels=band===0?[word,'apple']:[word,'apple','cat'];
    const prompt='Listen and find.';
    add({id:`mock.v8.listening.${band}.${word}`,skillId:'listen_words_phrases',domainId:'listening',targetWord:word,
      prompt,passage:band===1?sentence:'',modality:'listening',choices:pictureChoices(labels),hideWrittenLabels:true,evidenceModality:'audio+image',
      constructClaim:band===0?'identify_spoken_word':'identify_spoken_sentence_referent',
      requiredAudioCues:[instruction(prompt),band===0?spoken('target_word',word):{role:'passage',text:sentence,path:getLedaInstructionAudioPath(sentence)||null,required:true}],
      explanation:band===0?`The recording names ${word}.`:`The recorded sentence names ${word}; neither other pictured referent is mentioned.`,
      difficultyEvidence:band===0?'Identify one recorded familiar noun.':'Identify one pictured referent in a short recorded sentence.'},band);
  }
  for(const [word,...near]of VOCABULARY)for(const band of [0,1]) {
    const isFood=['orange','pear','lemon','peach','carrot','potato','tomato'].includes(word);
    const labels=band===0?[word,isFood?'cup':'apple']:[word,...near],prompt='Listen and find.';
    add({id:`mock.v8.vocabulary.${band}.${word}`,skillId:'picture_vocabulary',domainId:'vocabulary',targetWord:word,
      prompt,choices:pictureChoices(labels),hideWrittenLabels:true,evidenceModality:'audio+image',modality:'listening',
      constructClaim:band===0?'familiar_word_across_categories':'familiar_word_within_category',
      requiredAudioCues:[instruction(prompt),spoken('target_word',word)],explanation:`The recording names the ${word}.`,
      difficultyEvidence:band===0?'Distinguish a familiar object from a different broad category.':'Distinguish a familiar object from closely related concrete pictures.'},band);
  }
  for(const word of ACTIONS)for(const band of [0,1]) {
    const labels=band===0?[word,'cup']:[word,'sleep','clap'];
    const prompt='Which word matches the picture?';
    add({id:`mock.v8.language.action.${band}.${word}`,skillId:'verbs',domainId:'language',targetWord:word,
      prompt,image:picture(word),imageAlt:word,choices:choices(labels).map((c)=>({...c,audioPath:getLedaWordAudioPath(c.label)||null})),
      evidenceModality:'audio+image+print',constructClaim:band===0?'action_word_against_object_word':'distinguish_action_word_meaning',
      requiredAudioCues:[instruction(prompt),...choiceAudio(labels)],explanation:`The picture shows someone ${ACTION_FORMS[word]}.`,
      difficultyEvidence:band===0?'Recognize a pictured action against an object word.':'Discriminate a pictured action against other distinct actions; recordings remove incidental decoding.'},band);
  }
  for(const [word,...near]of READING)for(const band of [0,1]) {
    const distinct=words('dog sun pig bed cup').find(w=>w[0]!==word[0]);
    const labels=band===0?[word,distinct]:[word,...near],prompt='Which word matches the picture?';
    add({id:`mock.v8.reading.${band}.${word}`,skillId:'picture_word_reading',domainId:'reading',targetWord:word,
      prompt,image:picture(word),imageAlt:word,choices:choices(labels),modality:'reading',evidenceModality:'image+print',
      constructClaim:band===0?'read_word_distinct_initials':'read_complete_cvc_word',requiredAudioCues:[instruction(prompt)],
      explanation:`The printed word ${word} names the pictured evidence.`,
      difficultyEvidence:band===0?'Match a pictured CVC word against a word with a different initial.':'Read the complete CVC word against close real CVC neighbours; no target or choice recording is supplied.'},band);
  }
  for(const [index,word]of PRINT_WORDS.entries()) {
    const first=index%2===0,key=first?word[0]:word.at(-1);
    const alternatives=[...new Set([...word].filter(c=>c!==key))].slice(0,2),prompt=first?'Choose the first letter.':'Choose the last letter.';
    add({id:`mock.v8.print.position.${word}`,skillId:'print_concepts',domainId:'print',targetWord:word,passage:word,
      prompt,choices:choices([key,...alternatives]),evidenceModality:'text',constructClaim:first?'first_letter':'last_letter',
      requiredAudioCues:[instruction(prompt)],explanation:`${key} is the ${first?'first':'last'} printed letter in ${word}.`,
      difficultyEvidence:'Locate a letter at a boundary within one complete word; reading or sounding out that word is unnecessary.'},2);
  }
  for(const name of NAMES) {
    const prompt='Choose the name written correctly.';
    add({id:`mock.v8.writing.name.${name.toLowerCase()}`,skillId:'capitalization',domainId:'writing',targetWord:name,
      prompt,choices:choices([name,name.toLowerCase(),name.toLowerCase().slice(0,-1)+name.at(-1).toUpperCase()]),
      stimulusKey:`name-capital:${name.toLowerCase()}`,canonicalPassageId:`name-capital:${name.toLowerCase()}`,exposureFamilyId:`name-capital:${name.toLowerCase()}`,
      evidenceModality:'audio+print',constructClaim:'recognize_name_capital_form',requiredAudioCues:[instruction(prompt),spoken('target_word',name)],
      explanation:`A person's name starts with a capital: ${name}.`,difficultyEvidence:'Recognize the conventional capitalized form of one supplied name.'},0);
  }
  for(const [index,sentence]of SENTENCE_CAPITALS.entries()) {
    const prompt='Which sentence starts with a capital letter?',lower=sentence.toLowerCase();
    const misplaced=lower.replace(/\b([a-z]+)([.!?])$/,(_,word,mark)=>word[0].toUpperCase()+word.slice(1)+mark);
    const identity=`sentence-capital:${lower}`;
    add({id:`mock.v8.writing.sentence-capital.${index+1}`,skillId:'capitalization',domainId:'writing',targetWord:'',
      prompt,choices:choices([sentence,lower,misplaced]),stimulusKey:identity,canonicalPassageId:identity,exposureFamilyId:identity,
      evidenceModality:'text',constructClaim:'sentence_capital',requiredAudioCues:[instruction(prompt)],
      explanation:'A complete sentence starts with a capital letter; a capital later in the sentence cannot replace it.',
      difficultyEvidence:'Recognize sentence-initial capitalisation in one complete simple thought; no sentence repair or paragraph judgment is required.'},1);
  }
  return output;
}

export function listLiteracyMockRetakeFoundationAudioGaps(base=[]) {
  const gaps=new Map();
  for(const item of buildLiteracyMockRetakeFoundations(base))for(const cue of item.requiredAudioCues)if(!cue.path) {
    const role=cue.role==='passage'?'assessment_passage':cue.role==='instruction'?'assessment_prompt':'isolated_word';
    const key=`${role}:${cue.text}`,record=gaps.get(key)||{role,text:cue.text,itemIds:[]};
    record.itemIds.push(item.id);gaps.set(key,record);
  }
  return [...gaps.values()];
}
