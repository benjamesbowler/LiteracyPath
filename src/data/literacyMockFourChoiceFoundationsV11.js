import { curatedChildWordImageOverrides } from './childWordImageOverrides.js';
import { getLiteracyMockAudioV11Path } from './literacyMockAudioV11.js';
import { getLedaWordAudioPath } from './ledaProductionAudio.js';

export const LITERACY_MOCK_PLAIN_INSTRUCTIONS_V11=Object.freeze({
 'Names need a capital. Choose the right one.':'Choose the name with one capital at the start.',
 'Which printed word matches this recording?':'Listen. Choose the word you hear.',
 'Which printed word matches the recording?':'Listen. Choose the word you hear.',
 'Which word has the same final sound?':'Which word has the same last sound?',
});
export function listFoundationInstructionsV11AudioGaps(){
 return [...new Set(Object.values(LITERACY_MOCK_PLAIN_INSTRUCTIONS_V11))].filter(text=>!getLiteracyMockAudioV11Path(text,['assessment_prompt']))
  .map(text=>({role:'assessment_prompt',text,itemIds:[]}));
}
const SOURCE = 'src/data/literacyMockFourChoiceFoundationsV11.js';
// These are authored semantic sets, not a runtime search through unrelated bank
// answers. Each set contains familiar concrete alternatives of the same kind.
const PICTURE_SETS = [
  'cat dog fox rat', 'pig cow goat sheep', 'hen duck fish frog', 'ant bee fish frog',
  'cup pan pot bowl', 'hat coat sock shoe', 'bag box book basket', 'bed chair desk sofa',
  'pen pencil crayon ruler', 'net mop fan bell', 'map book pen clock', 'log tree leaf rock',
  'bus car bike boat', 'apple banana orange pear', 'cake egg cheese cookie',
  'spoon fork plate bowl', 'key clock bell comb', 'tent bed chair umbrella',
  'sun moon star cloud', 'ball kite swing slide', 'toothbrush towel comb scarf',
  'shorts skirt belt dress scarf', 'pillow blanket bed towel', 'lemon peach carrot potato tomato',
  'bottle glass cup bowl', 'bear elephant horse rabbit', 'door ladder bench chair',
  'drum bell fan clock', 'face foot nose hand', 'grapes milk pizza cheese',
  'mouse rabbit cat dog', 'shirt boot shoe coat', 'train truck bus car',
  'beach tree leaf log', 'ladle spoon fork bowl', 'scissors ruler pencil crayon',
  'lantern lamp clock bell', 'bird fish frog cat', 'sheep goat cow pig',
].map(row => row.split(' '));
// Broad starter contrasts remain concrete and visually unrelated. Four answers
// must not turn the entry task into four closely related unfamiliar nouns.
const STARTER_SETS = [
  'cat bus apple shoe', 'pig bed banana ball', 'cow pen sun book',
  'hen bag cake kite', 'fox car egg sock', 'rat cup moon chair',
  'duck map tree coat', 'goat fan leaf box', 'sheep pot star key',
  'fish hat spoon tent', 'frog mop clock desk', 'ant log bike bell',
  'bee net boat pan',
].map(row => row.split(' '));
const ACTION_FOILS = {
  run:'sit sleep drink', sit:'run swim sing', clap:'sleep drink dig', swim:'write sit clap',
  sleep:'jump kick write', jump:'sleep drink sing', sing:'dig sleep swim', drink:'clap jump sleep',
  dig:'sing swim sleep', hop:'sit write drink', write:'swim hop sleep', skip:'sit drink write',
  spin:'sleep write drink', kick:'sleep sit clap', look:'jump sleep sing',
  eat:'write jump sleep', walk:'sit swim sleep', dance:'write sit drink', read:'swim hop dig',
  draw:'swim sleep jump', wash:'hop sing sleep', wave:'sleep kick dig', crawl:'sing sleep drink',
  climb:'read sit drink', throw:'sleep write swim', catch:'sleep sit sing', push:'sleep drink sing',
  pull:'sleep clap swim', laugh:'sleep dig swim', cry:'sleep dig jump', smile:'sleep write swim',
  sneeze:'sleep dig clap', point:'sleep sing swim', stretch:'write sleep drink', hug:'dig sleep swim',
  build:'sing sleep swim', pour:'jump sleep clap', bake:'swim jump sleep', stir:'sing jump sleep',
  drive:'sleep swim sing', peel:'sleep jump sing', stand:'sleep swim write', cook:'sleep swim jump',
  ride:'sleep write drink', chop:'sleep swim sing', bend:'sleep sing swim', lift:'sleep write swim',
  yawn:'dig swim jump', smell:'sleep write swim', carry:'sleep swim write', march:'sleep drink write', feed:'swim sleep write',
};
// Explicit CVC neighbourhoods: every alternative is a real short word. A foil
// changes a vowel or consonant, so the child must attend to the complete word.
const CVC_SETS = [
  'cat cap can cab cot cut', 'dog dig dot dug fog log', 'pig pin pit peg wig fig',
  'hen hem pen ten men net', 'fox box fix fog log dog', 'rat rag ran rot rut rug',
  'cup cut cap cub cop cot', 'hat hot ham hit hut', 'bag bat big beg bug',
  'bed red bad bid bud', 'pen pet pan pin pot', 'net pet nut wet vet',
  'fan fin pan fun van', 'map mat mop man mug', 'pan pin pat pen',
  'pot pat pet pit put', 'mop map top pop', 'log leg lot dog',
  'bus bug bun but', 'sun sum fun bun', 'run ran rug bun', 'lid lip lad leg', 'jam jet ham jug',
  'top tap tin tip tub', 'bat bit bag bet but', 'den ten pen din', 'ham hat hem hum',
  'mat map man met', 'ram ran rag rim', 'tag tap tan tug', 'pup pop pet cup',
  'bun bin ban bug', 'gum hum sum gem', 'hut hat hot hit', 'nap net nip map',
  'dam dim ham jam', 'can cap cat con', 'bib big bit bob', 'lip lid lap sip',
  'zip sip tip zap', 'pit pin pat pot', 'rag rat rug rig', 'pad pan pat pod',
  'fig fin fog fit', 'rub rug rib rob', 'tap tip top tan', 'cap cat cup cop',
  'bin ban bun fin', 'nut net not hut', 'wig wag win fig', 'van vat vet fan',
  'web wet bed cub', 'cub cab cob cup', 'fog fig fin dog', 'fin fan fun fit',
  'yak yam van cat', 'cab cap cat cob', 'cob cab cub cot', 'beg big bag bug',
  'pet pit pat pot', 'ten tan tin ton', 'jet jot jut pet', 'peg pug pig pet',
  'red rod rid fed', 'wet vet net wit', 'kit cut cat cot', 'bit bat bet but',
  'dig dug dog fig', 'tin tan ton ten', 'hit hot hat hut', 'sip sap sat sit',
  'cot cat cut cop', 'rod rid red rot', 'dot dog dig dat', 'mud mad mid mug',
  'rug rag rig rub', 'cut cat cot cup', 'jug jog jig jam', 'fun fan fin sun',
  'man men mat map', 'lab lap lad lob', 'lot log lit let', 'tip top tap tin',
  'big bag bug bin', 'hip hit hop hip', 'mum mug hum sum', 'mug mud mag meg',
  'rot rat rut rod', 'sap sip sat map', 'sob sub job sun', 'ship shop shin sip',
  'duck dock deck luck', 'fish fin fit dish',
].map(row => row.split(' '));
const LETTER_FOILS = {
  a:'H V M',b:'D P R',c:'G O Q',d:'B P O',e:'F L T',f:'E T P',g:'C O Q',h:'A N M',i:'J L T',
  j:'I L U',k:'R X H',l:'I T F',m:'N W H',n:'M H Z',o:'Q C G',p:'B D R',q:'O G C',
  r:'P B K',s:'Z C G',t:'I F L',u:'V Y J',v:'U W Y',w:'M V N',x:'K Y Z',y:'V X T',z:'S N X',
};
const RHYME_FOILS = {coat:'dog',train:'dog',light:'sun',spoon:'cat',crow:'cat',sheep:'cat',bell:'dog',star:'pig',chair:'dog',house:'pig'};
const MEDIAL_VOWEL = {a:'cat',e:'pen',i:'pig',o:'dog',u:'cup'};
const INITIAL_FOILS = ['cat','dog','pig','sun'];
const FINAL_FOILS = { t:'dog',d:'cap',p:'dog',k:'cap',n:'dog',m:'cap',f:'dog',v:'cap',s:'dog',z:'cap' };
const HFW_SETS = ['and you the but can not for was his she her him out see day now', 'as up no in on at is it we he be do go my by if so an of or me us'].map(row=>row.split(' '));
const textKey = value => String(value).trim().toLowerCase();
const picturesByBank = new WeakMap();
const EXACT_EXTRA_PICTURES = {cloud:'/images/child-mode/blends/cloud.webp'};
function pictures(bank) {
  if (picturesByBank.has(bank)) return picturesByBank.get(bank);
  const result = new Map(Object.entries({...curatedChildWordImageOverrides,...EXACT_EXTRA_PICTURES}).map(([word,image])=>[word,{image,imageAlt:word}]));
  for (const item of bank) {
    // Only an existing exact-word response card or curated registry establishes
    // its meaning. A stimulus image might show a scene around targetWord; it
    // must never be inferred to be an isolated-object answer picture.
    for (const c of item.choices || []) if (c.image && textKey(c.imageAlt || '').replace(/^picture (?:for|of) /,'')===textKey(c.label))
      result.set(textKey(c.label), {image:c.image,imageAlt:c.imageAlt || c.label});
  }
  picturesByBank.set(bank,result); return result;
}
function authoredSet(word, sets) { return sets.find(row=>row.includes(textKey(word))) || []; }
function candidates(item, key) {
  const claim=item.constructClaim;
  if (['familiar_word_across_categories','identify_spoken_word'].includes(claim)) {
    const broad=authoredSet(key,STARTER_SETS);
    return broad.length ? broad : ['cat','bus','apple','shoe'];
  }
  if (claim==='familiar_word_within_category') return key==='bird'?['fish','frog','cat']:authoredSet(key,PICTURE_SETS);
  if (claim==='identify_spoken_sentence_referent') return ['cat','bus','apple','shoe','dog','bed'];
  if (claim==='action_word_against_object_word') return ['cat','bed','sun','cup'];
  if (claim==='distinguish_action_word_meaning') return (ACTION_FOILS[key]||'').split(' ');
  if (claim==='read_word_distinct_initials') return ['cat','pig','hen','sun','dog','map'];
  if (claim==='read_complete_cvc_word'||claim?.startsWith('match_spoken_short_vowel_word:')||claim==='blend_phonemes') return authoredSet(key,CVC_SETS);
  if (claim==='letter_name'||claim==='letter_case') return (LETTER_FOILS[textKey(key)]||'').split(' ');
  if (claim==='initial_sound_discrimination') return INITIAL_FOILS.filter(word=>word[0]!==textKey(item.targetWord)[0]);
  if (claim==='spoken_final_phoneme_comparison') return [FINAL_FOILS[item.taskDemand?.proof?.targetFinalPhoneme]];
  if (claim==='spoken_rhyme_discrimination') return [RHYME_FOILS[item.targetWord]];
  if (claim==='spoken_medial_vowel_discrimination') {
    const vowel=String(item.targetWord).match(/[aeiou]/)?.[0];
    return Object.entries(MEDIAL_VOWEL).filter(([v])=>v!==vowel).map(([,word])=>word);
  }
  if (claim?.startsWith('spoken_to_print_')) return authoredSet(key,HFW_SETS).concat(key.length>2?HFW_SETS[0]:HFW_SETS[1]);
  return [];
}
function caseFoils(key) {
  const chars=[...key]; const upper=key.toUpperCase();
  return [upper, chars.map((c,i)=>i===0?c.toLowerCase():i===chars.length-1?c.toUpperCase():c).join(''),
    chars.map((c,i)=>i===0?c.toUpperCase():i===1?c.toUpperCase():c).join(''),
    `${key[0].toLowerCase()}${key.slice(1).toUpperCase()}`];
}
// Complete familiar print stimuli give three genuine position confusions;
// the task remains locating a boundary letter, never sounding out the word.
const FOUR_LETTER_STIMULI = {
  sun:'sand',map:'mask',pet:'pond',van:'vest',fox:'farm',jug:'jump',kit:'king',bed:'bark',
  bus:'bats',hen:'rain',red:'bird',wax:'flex',zip:'jump',tag:'flag',jam:'swim',wet:'boat',
};
function printCandidates(item) {
  if (item.constructClaim==='sentence_count') return ['1','2','3','4','5'];
  const tokens = item.passage.match(/[a-z]+/gi)||[];
  if (['first_letter','last_letter'].includes(item.constructClaim)) {
    const letters=[...new Set(item.passage.toLowerCase().replace(/[^a-z]/g,''))];
    return letters;
  }
  return tokens;
}

/** Publish replacements only; the caller retains historical V1–V10 snapshots.
 * Every added card keeps the item's access contract. Identity used to prevent
 * content exposure is inherited, even when the visible stimulus is repaired. */
export function upgradeFoundationChoicesV11(item, bank) {
  const inScope=['sound_awareness','phonics','print'].includes(item.domainId) || (Number.isInteger(item.adaptiveAreaBand)&&item.adaptiveAreaBand<2);
  if (!item.adaptiveMixedEligible || !inScope || item.format!=='choice' || item.answerMode!=='exact' || item.choices.length===4 && !LITERACY_MOCK_PLAIN_INSTRUCTIONS_V11[item.prompt]) return item;
  if (item.choices.length>4) throw Error(`Unexpected foundation option count: ${item.id}`);
  const key=item.choices.find(c=>c.id===item.answer)?.label;
  if (!key) throw Error(`Missing foundation key: ${item.id}`);
  const next={...item,id:`${item.id}.v11`,choices:item.choices.map(c=>({...c})),requiredAudioCues:(item.requiredAudioCues||[]).map(c=>({...c})),distractorRationales:{...item.distractorRationales},sourceProvenance:{kind:'original_literacy_guide_v11_correction',file:SOURCE,sourceId:item.id}};
  delete next.itemSnapshot;
  const plain=LITERACY_MOCK_PLAIN_INSTRUCTIONS_V11[item.prompt];
  if(plain){
    next.prompt=plain;
    next.requiredAudioCues=next.requiredAudioCues.map(cue=>cue.role==='instruction'
      ? {...cue,text:plain,path:getLiteracyMockAudioV11Path(plain,['assessment_prompt'])||null}:cue);
  }
  // A duck and a hen are both birds. Their images cannot be wrong answers to
  // the spoken category word "bird", even when one card is labelled bird.
  if (item.constructClaim==='familiar_word_within_category' && key==='bird') {
    next.choices=next.choices.filter(c=>c.id===item.answer);
    next.distractorRationales={};
  }
  // Three-word sentences have only two genuine position confusions. Give the
  // child a complete four-word sentence instead of an invented event or noun.
  if (item.constructClaim==='first_word' && (item.passage.match(/[a-z]+/gi)||[]).length===3)
    next.passage=item.passage.replace(/([.!?])$/, ' here$1');
  if (item.constructClaim==='last_word' && (item.passage.match(/[a-z]+/gi)||[]).length===3)
    next.passage=item.passage.replace(/\b(jumps)([.!?])$/, 'now $1$2');
  if (['first_letter','last_letter'].includes(item.constructClaim) && FOUR_LETTER_STIMULI[item.passage]) {
    next.passage=FOUR_LETTER_STIMULI[item.passage];
    const labels=[...new Set(next.passage)].filter(letter=>letter!==key);
    next.choices=[{...item.choices.find(c=>c.id===item.answer)},...labels.slice(0,2).map((label,index)=>({id:['c0','c1','c2','c3'].filter(id=>id!==item.answer)[index],label}))];
    next.distractorRationales=Object.fromEntries(next.choices.filter(c=>c.id!==item.answer).map(c=>[c.id,'Selects an internal letter or the opposite boundary instead of the requested boundary letter.']));
    next.explanation=`${key.toUpperCase()} is the ${item.constructClaim==='first_letter'?'first':'last'} letter in ${next.passage}.`;
  }
  let options;
  if (item.domainId==='print'&&item.skillId==='print_concepts') options=printCandidates(next);
  else if (['recognize_name_capital_form','sentence_capital'].includes(item.constructClaim)) options=caseFoils(key);
  else options=candidates(item,textKey(key));
  const seen=new Set(next.choices.map(c=>c.label));
  const useImages=item.choices.every(c=>c.image);
  const useAudio=item.requiredAudioCues?.some(c=>c.role==='choice');
  for (let label of options) {
    if (!label || next.choices.length>=4) continue;
    if (item.domainId==='print'&&item.skillId==='print_concepts'&&item.choices.every(c=>c.label===c.label.toLowerCase())) label=label.toLowerCase();
    if (seen.has(label) || next.choices.some(c=>textKey(c.label)===textKey(label))&&!['recognize_name_capital_form','sentence_capital','letter_name','letter_case'].includes(item.constructClaim)) continue;
    if (item.constructClaim==='read_word_distinct_initials'&&label[0]===key[0]) continue;
    if (item.constructClaim==='identify_spoken_sentence_referent'&&new RegExp(`\\b${label}\\b`,'i').test(item.passage)) continue;
    const image=useImages?pictures(bank).get(textKey(label)):null;
    if (useImages&&!image) throw Error(`Missing exact fourth-option picture: ${item.id}: ${label}`);
    const path=useAudio?getLedaWordAudioPath(label):'';
    if (useAudio&&!path) throw Error(`Missing exact fourth-option recording: ${item.id}: ${label}`);
    const id = ['c0','c1','c2','c3'].find(value=>!next.choices.some(c=>c.id===value));
    const choice={id,label,...(image||{}),...(useAudio?{audioPath:path}:{})};
    next.choices.push(choice);seen.add(label);
    if(useAudio) next.requiredAudioCues.push({role:'choice',text:label,path,required:true,choiceId:choice.id,value:label});
    const rationale=item.domainId==='print'?'Confuses the requested printed unit or its position with another visible unit.':
      ['recognize_name_capital_form','sentence_capital'].includes(item.constructClaim)?'Uses an incorrect capitalization pattern instead of the conventional initial capital.':
      item.constructClaim==='initial_sound_discrimination'?'Has a different initial phoneme from the spoken target.':
      item.constructClaim==='spoken_final_phoneme_comparison'?'Has a different final phoneme from the spoken target.':
      item.constructClaim==='spoken_medial_vowel_discrimination'?'Has a different short vowel from the spoken target.':
      item.constructClaim==='spoken_rhyme_discrimination'?'Does not share the spoken target\'s final stressed vowel and following sounds.':
      item.constructClaim==='distinguish_action_word_meaning'?'Names a different action from the action shown.':
      item.constructClaim==='blend_phonemes'?'Changes at least one sound from the supplied phoneme sequence.':
      useImages?'Names a different concrete object from the spoken referent.':'Changes a printed sound unit or word rather than matching the complete supplied target.';
    next.distractorRationales[choice.id]=rationale;
    next.distractorRationales[label]=rationale;
    if(item.taskDemand?.proof?.choiceFinalPhonemes) next.taskDemand={...item.taskDemand,proof:{...item.taskDemand.proof,choiceFinalPhonemes:{...item.taskDemand.proof.choiceFinalPhonemes,[choice.id]:label==='dog'?'g':'p'}}};
  }
  if(next.choices.length!==4) throw Error(`No authored fourth-option set: ${item.id}: ${key}: ${options.join(',')}`);
  if (next.taskDemand?.proof?.rejected) {
    next.taskDemand={...next.taskDemand,proof:{...next.taskDemand.proof,rejected:next.choices.filter(c=>c.id!==next.answer).map(c=>c.label)}};
    if (Object.hasOwn(next.taskDemand.features||{}, 'sameInitialAlternatives')) next.taskDemand.features={...next.taskDemand.features,sameInitialAlternatives:next.choices.filter(c=>textKey(c.label)[0]===textKey(key)[0]).length};
  }
  next.requiredAudioPaths=[...new Set(next.requiredAudioCues.map(c=>c.path).filter(Boolean))];
  next.missingAudioCues=next.requiredAudioCues.filter(c=>c.required!==false&&!c.path);
  next.mediaReady=item.mediaReady && next.missingAudioCues.length===0;
  next.requiredImagePaths=[...new Set([next.image,...next.choices.map(c=>c.image)].filter(Boolean))];
  return next;
}
