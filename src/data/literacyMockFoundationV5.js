import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
import { curatedChildWordImageOverrides } from './childWordImageOverrides.js';

const SOURCE='src/data/literacyMockFoundationV5.js';
const groups=[
  'cat dog pig hen fox rat cow duck goat sheep fish bird frog ant bee',
  'cup hat bag bed pen net fan map pan pot mop log bus car boat bike bell',
  'apple banana cake egg spoon key tent clock sun moon star ball book chair desk sock shoe coat kite leaf tree box',
].map(text=>text.split(' '));
// Close semantic alternatives at Starter; First steps contrasts a broad category.
const vocabularyFoils=Object.fromEntries(Object.entries({
  cat:'dog fox',dog:'cat fox',pig:'cow goat',hen:'duck bird',fox:'dog cat',rat:'cat pig',cow:'goat sheep',duck:'hen bird',goat:'cow sheep',sheep:'goat cow',fish:'frog duck',bird:'duck hen',frog:'fish bird',ant:'bee bird',bee:'ant bird',
  cup:'pan pot',hat:'coat shoe',bag:'box book',bed:'chair desk',pen:'book map',net:'mop fan',fan:'clock bell',map:'book pen',pan:'pot cup',pot:'pan cup',mop:'net pen',log:'tree leaf',bus:'car bike',car:'bus bike',boat:'car bus',bike:'car bus',bell:'clock fan',
  apple:'banana cake',banana:'apple egg',cake:'apple egg',egg:'apple cake',spoon:'cup pan',key:'clock bell',tent:'bed chair',clock:'bell fan',sun:'moon star',moon:'sun star',star:'sun moon',ball:'kite bike',book:'map pen',chair:'bed desk',desk:'chair bed',sock:'shoe coat',shoe:'sock hat',coat:'hat shoe',kite:'ball bike',leaf:'tree log',tree:'leaf log',box:'bag cup',
}).map(([word,foils])=>[word,foils.split(' ')]));
const readRows=[['cat','cap','can'],['dog','dig','dot'],['pig','pin','pit'],['hen','hem','pen'],['fox','box','fix'],['rat','rag','ran'],
  ['cup','cut','cap'],['hat','hot','ham'],['bag','bat','big'],['bed','red','bad'],['pen','pet','pan'],['net','pet','nut'],
  ['fan','fin','pan'],['map','mat','mop'],['pan','pin','pat'],['pot','pat','pet'],['mop','map','top'],['log','leg','lot'],
  ['bus','bug','bun'],['sun','sum','fun'],['lid','lip','lad'],['jam','jet','ham'],['top','tap','tin'],['bat','bit','bag']];
const actions='run sit clap swim sleep jump sing drink dig hop write skip spin kick look'.split(' ');
const utterances=[
  ['cat','The cat is asleep.'],['dog','The dog drank water.'],['ball','I have a red ball.'],['apple','The apple is red.'],
  ['sun','The sun came out.'],['moon','The moon shines at night.'],['bird','The bird can fly high.'],['fish','The fish swims in water.'],
  ['book','I want that book.'],['bus','The bus will come soon.'],['cup','The cup is not full.'],['clock','The clock tells time.'],
  ['banana','A banana is a fruit.'],['box','The box is not heavy.'],['key','Dad found a lost key.'],
];
const cue=(role,text,path)=>({role,text,path,required:true});

/** Original entry items reuse the canonical reviewed picture and exact-recording
 * resolvers. Every target and foil is authored here; no drawing or TTS fallback. */
export function buildLiteracyMockFoundationV5(base,normalize) {
  const pictures=new Map();
  const accept=(word,path)=>{if(word&&path?.startsWith('/images/')&&!pictures.has(word.toLowerCase()))pictures.set(word.toLowerCase(),path);};
  for(const q of base){accept(q.targetWord,q.image);for(const c of q.choices||[])accept(c.label,c.image);}
  for(const [word,path]of Object.entries(curatedChildWordImageOverrides))accept(word,path);
  const extra={book:'/images/child-mode/cvc/book.webp',bird:'/images/child-mode/initial-sounds/bird.webp',
    run:'/images/assessment/objective-words/run.webp',sit:'/images/child-mode/short-i/sit.webp',sleep:'/images/assessment/rhyming/variants/eep/sleep-02.webp',
    jump:'/images/assessment/generated/concepts/jump.webp',sing:'/images/assessment/generated/concepts/sing.webp',
    write:'/images/assessment/generated/concepts/write.webp',kick:'/images/assessment/rhyming/variants/ick/kick-02.webp',look:'/images/assessment/hfw/look.webp'};
  for(const [word,path]of Object.entries(extra))accept(word,path);
  // A chair must not show a competing desk; the verb needs a visible action.
  pictures.set('chair','/images/child-mode/digraphs/chair.webp');
  pictures.set('drink','/images/assessment/generated/sequencing/child-drinks-water.webp');
  const missingPictures=[...new Set([...groups.flat(),...readRows.map(row=>row[0]),...actions])].filter(word=>!pictures.has(word));
  if(missingPictures.length)throw Error(`Missing foundation pictures: ${missingPictures.join(', ')}`);
  const image=word=>{const found=pictures.get(word);if(!found)throw Error(`Missing foundation picture: ${word}`);return found;};
  const audio=word=>{const found=getLedaWordAudioPath(word);if(!found)throw Error(`Missing foundation recording: ${word}`);return found;};
  const instruction=text=>{const path=getLedaInstructionAudioPath(text);if(!path)throw Error(`Missing foundation instruction: ${text}`);return cue('instruction',text,path);};
  const originals=[];
  const add=(q,band)=>{
    const item=normalize({...q,sourceProvenance:{kind:'original_literacy_guide',source:SOURCE},mediaDecision:{type:'meaningful_existing_raster',reason:'Canonical target and foil pictures carry the response evidence.'}});
    return {...item,foundationBand:band,itemSnapshot:{...item.itemSnapshot,foundationBand:band}};
  };
  const pictureChoice=(word,i)=>({id:`c${i}`,label:word,image:image(word),imageAlt:word});
  for(const [groupIndex,words]of groups.entries())for(const [index,word]of words.entries())for(const band of [0,1]) {
    const foils=band===0?[groups[(groupIndex+1)%groups.length][index%groups[(groupIndex+1)%groups.length].length]]
      :vocabularyFoils[word];
    originals.push(add({id:`mock.v5.vocabulary.${band}.${word}`,skillId:'picture_vocabulary',domainId:'vocabulary',level:band+1,
      format:'choice',answer:'c0',answerMode:'exact',prompt:'Listen and find.',targetWord:word,modality:'listening',evidenceModality:'audio+image',
      hideWrittenLabels:true,choices:[word,...foils].map(pictureChoice),constructClaim:band===0?'familiar_word_across_categories':'familiar_word_within_category',
      exposureFamilyId:`mock-foundation-word:${word}`,stimulusKey:`heard-picture-word:${word}`,
      requiredAudioCues:[instruction('Listen and find.'),cue('target_word',word,audio(word))]},band));
  }
  for(const [index,[word,...near]]of readRows.entries())for(const band of [0,1]) {
    const labels=band===0?[word,readRows[(index+7)%readRows.length][0]]:[word,...near];
    originals.push(add({id:`mock.v5.reading.${band}.${word}`,skillId:'picture_word_reading',domainId:'reading',level:band+1,
      format:'choice',answer:'c0',answerMode:'exact',prompt:'Which word matches the picture?',image:image(word),imageAlt:word,
      targetWord:word,modality:'reading',evidenceModality:'image+print',choices:labels.map((label,i)=>({id:`c${i}`,label})),
      constructClaim:band===0?'read_word_distinct_initials':'read_complete_cvc_word',exposureFamilyId:`mock-foundation-word:${word}`,
      stimulusKey:`read-picture-word:${word}`,requiredAudioCues:[instruction('Which word matches the picture?')]},band));
  }
  const nouns=groups.flat();
  for(const [index,word]of nouns.entries())originals.push(add({id:`mock.v5.listening.word.${word}`,skillId:'listen_words_phrases',domainId:'listening',level:1,
    format:'choice',answer:'c0',answerMode:'exact',prompt:'Listen and find.',targetWord:word,modality:'listening',evidenceModality:'audio+image',hideWrittenLabels:true,
    choices:[word,nouns[(index+19)%nouns.length]].map(pictureChoice),constructClaim:'identify_spoken_word',
    exposureFamilyId:`mock-foundation-word:${word}`,stimulusKey:`listen-word:${word}`,requiredAudioCues:[instruction('Listen and find.'),cue('target_word',word,audio(word))]},0));
  for(const [index,[word,sentence]]of utterances.entries()) {
    const path=getLedaInstructionAudioPath(sentence);
    if(!path)throw Error(`Missing exact foundation utterance: ${sentence}`);
    const foils=nouns.filter(other=>other!==word&&!new RegExp(`\\b${other}\\b`,'i').test(sentence));
    originals.push(add({id:`mock.v5.listening.phrase.${word}`,skillId:'listen_words_phrases',domainId:'listening',level:2,
      format:'choice',answer:'c0',answerMode:'exact',prompt:'Listen and find.',passage:sentence,targetWord:word,modality:'listening',evidenceModality:'audio+image',
      hideWrittenLabels:true,choices:[word,foils[index%foils.length],foils[(index+8)%foils.length]].map(pictureChoice),constructClaim:'identify_spoken_sentence_referent',
      exposureFamilyId:`mock-foundation-word:${word}`,stimulusKey:sentence.toLowerCase(),requiredAudioCues:[cue('passage',sentence,path),instruction('Listen and find.')]},1));
  }
  for(const [index,word]of actions.entries())for(const band of [0,1]) {
    // A pictured action with recorded word choices establishes access to doing
    // words without requiring a definition of the grammatical term "verb".
    const labels=band===0?[word,nouns[index%nouns.length]]:[word,actions[(index+1)%actions.length],actions[(index+2)%actions.length]];
    originals.push(add({id:`mock.v5.language.action.${band}.${word}`,skillId:'verbs',domainId:'language',level:band+1,
      format:'choice',answer:'c0',answerMode:'exact',prompt:'Which word matches the picture?',image:image(word),imageAlt:word,
      targetWord:word,modality:'recognition',evidenceModality:'audio+image+print',choices:labels.map((label,i)=>({id:`c${i}`,label,audioPath:audio(label)})),
      constructClaim:band===0?'action_word_against_object_word':'distinguish_action_word_meaning',exposureFamilyId:`mock-foundation-word:${word}`,
      stimulusKey:`action-meaning:${word}`,requiredAudioCues:[instruction('Which word matches the picture?'),...labels.map((label,i)=>({...cue('choice',label,audio(label)),choiceId:`c${i}`,value:label}))]},band));
  }
  for(const q of base.filter(q=>q.skillId==='capitalization'&&q.constructClaim==='supply_proper_name_capital_form'&&q.level===1)) {
    const item=add({...q,id:`mock.v5.writing.name.${q.id}`,passage:'',constructClaim:'recognize_name_capital_form',
      stimulusKey:`name-capital:${q.choices.find(c=>c.id===q.answer)?.label}`,sourceItemId:q.id},0);
    originals.push(item);
  }
  return originals;
}
