import {getLiteracyMockAudioV11Path} from './literacyMockAudioV11.js';
import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
import { curatedChildWordImageOverrides } from './childWordImageOverrides.js';
import { isLiteracyMockWorkedTutorialTarget } from '../policy/literacyMockDemandV8.js';

const FILE='src/data/literacyMockPhonicsCapacityV11.js';
// Forty new lexical targets, not forty re-identifications of an old target.
// These explicit real-word contrasts share onsets, vowels or codas so a first
// letter, picture category or response length cannot identify the whole word.
const ROWS=[
 'bib big bin bit','bun bug bus but','bus bun bug but','cab cap can cat',
 'can cap cat cab','cob cub cab cop','dam dim dad den','den dog dig dam',
 'dug dig dog bug','fan fin fun van','fig fin fit fog','gum gun hum gem',
 'ham hat hem him','hen hem pen men','hop hip hot pop','hug hut hum bug',
 'hut hat hit hot','jam jet jug ham','lip lid lap lit','map mat mop man',
 'mat map met man','mop map top pop','mug mud bug rug','nap nip net map',
 'pad pan pat pod','pit pin pet pat','pop pup pot top','pup pop cup put',
 'rag rat rug rig','ram ran rim ham','rip rap rib lip','rub rug rib rob',
 'run ran rug bun','sat sit set sad','sit sat set sip','sun sum fun bun',
 'tag tap tan tug','tub tab tug cub','zip sip tip zap','yak yam yes yet',
].map(row=>row.split(' '));
// Audio is the evidence for these familiar actions, qualities and function
// words. A fabricated object illustration would misrepresent their meaning.
// Every target and foil is an authored real word; x=/k s/ words are excluded
// because three printed letters must not be labelled three spoken phonemes.
const AUDIO_ROWS=[
 'bad bed bid bud','big bag bug bin','dim dam dig did','fat fit fan bat',
 'fit fat fin hit','hot hat hit hop','mad mud mat sad','sad sat set mad',
 'did dig dad hid','had hid ham hat','has hat had his','get got met let',
 'got get hot not','let lit met net','met mat let pet','not net nut nod',
 'but bat bet bus','yes yet yam yak','yet yes yam yak','bet bat bit bed',
 'fed red bed fin','hid had hit did','jog jug job log','nod not net rod',
 'pat pet pit pan','set sat sit net','win wig wet bin','ran run ram rat',
 'hum ham him hut','led lid let red','lit let lip hit','rob rub rod job',
 'wag wig tag bag','sum sun hum gum','gas gap gum has',
].map(row=>row.split(' '));
const PHONEMES={
 bib:'B IH B',bun:'B AH N',bus:'B AH S',cab:'K AE B',can:'K AE N',cob:'K AA B',dam:'D AE M',den:'D EH N',
 dug:'D AH G',fan:'F AE N',fig:'F IH G',gum:'G AH M',ham:'HH AE M',hen:'HH EH N',hop:'HH AA P',hug:'HH AH G',
 hut:'HH AH T',jam:'JH AE M',lip:'L IH P',map:'M AE P',mat:'M AE T',mop:'M AA P',mug:'M AH G',nap:'N AE P',
 pad:'P AE D',pit:'P IH T',pop:'P AA P',pup:'P AH P',rag:'R AE G',ram:'R AE M',rip:'R IH P',rub:'R AH B',
 run:'R AH N',sat:'S AE T',sit:'S IH T',sun:'S AH N',tag:'T AE G',tub:'T AH B',zip:'Z IH P',yak:'Y AE K',
 bad:'B AE D',big:'B IH G',dim:'D IH M',fat:'F AE T',fit:'F IH T',hot:'HH AA T',mad:'M AE D',sad:'S AE D',
 did:'D IH D',had:'HH AE D',has:'HH AE Z',get:'G EH T',got:'G AA T',let:'L EH T',met:'M EH T',not:'N AA T',
 but:'B AH T',yes:'Y EH S',yet:'Y EH T',bet:'B EH T',fed:'F EH D',hid:'HH IH D',jog:'JH AA G',nod:'N AA D',
 pat:'P AE T',set:'S EH T',win:'W IH N',ran:'R AE N',hum:'HH AH M',led:'L EH D',lit:'L IH T',rob:'R AA B',
 wag:'W AE G',sum:'S AH M',gas:'G AE S',
};
const VOWELS={AE:'a',EH:'e',IH:'i',AA:'o',AH:'u'};
const EXACT_REVIEWED_PICTURES={run:{image:'/images/assessment/objective-words/run.webp',sourceId:'src/data/literacyMockFoundationV5.js',mediaDecision:{constructReview:'approved',answerNeutral:'approved',reviewType:'model_visual_review_2026_10_20',reason:'Inspected the existing whole-body running child with both feet clear of the ground; no printed word or competing action.'}},sit:{image:'/images/child-mode/short-i/sit.webp',sourceId:'src/data/literacyMockFoundationV5.js',
 mediaDecision:{constructReview:'approved',answerNeutral:'approved',reviewType:'model_visual_review_2026_10_20',reason:'Inspected the existing full-body child sitting on a chair; it clearly carries the sit action without printed words.'}}};
// Prefer exact canonical response art. Source stimuli are admitted only when
// their published target and meaningful accessible name agree exactly, and the
// source explicitly records its visual construct review. No scene inference.
function pictureFor(word,base){
 const source=base.find(q=>q.targetWord===word&&q.image&&q.imageAlt?.toLowerCase()===word&&q.mediaDecision?.constructReview==='approved');
 if(source)return {image:source.image,sourceId:source.id,mediaDecision:source.mediaDecision};
 const responseSource=base.find(q=>q.mediaDecision?.constructReview==='approved'&&q.choices?.some(c=>c.label===word&&c.image&&c.imageAlt?.toLowerCase().replace(/^picture (?:for|of) /,'')===word));
 if(responseSource){const card=responseSource.choices.find(c=>c.label===word&&c.image);return {image:card.image,sourceId:responseSource.id,mediaDecision:responseSource.mediaDecision};}
 if(EXACT_REVIEWED_PICTURES[word])return EXACT_REVIEWED_PICTURES[word];
 const image=curatedChildWordImageOverrides[word];
 if(image)return {image,sourceId:'src/data/childWordImageOverrides.js',mediaDecision:{constructReview:'approved',answerNeutral:'approved'}};
 throw Error(`Missing exact reviewed V11 CVC picture: ${word}`);
}

/** Add fresh complete-CVC decoding targets at the existing band-one operation.
 * Historical targets and cross-area word exposure retain the same lexical
 * family. The instruction and target are spoken; assessed print stays silent. */
export function buildLiteracyMockPhonicsCapacityV11(base,normalize){
 const used=new Set(base.filter(q=>q.adaptiveMixedEligible&&q.domainId==='phonics'&&q.adaptiveAreaBand===1)
  .flatMap(q=>[q.targetWord,q.canonicalPassageId]).filter(Boolean));
 const prompt='Listen. Choose the word you hear.';
 const instruction=getLedaInstructionAudioPath(prompt)||getLiteracyMockAudioV11Path(prompt,['assessment_prompt']);
 const output=[];
 for(const {row,pictured}of [...ROWS.map(row=>({row,pictured:true})),...AUDIO_ROWS.map(row=>({row,pictured:false}))]){
  const [word,...foils]=row;
  if(used.has(word))continue;
  if(isLiteracyMockWorkedTutorialTarget({targetWord:word}))throw Error(`Worked tutorial target cannot add scored capacity: ${word}`);
  const {image,sourceId,mediaDecision}=pictured?pictureFor(word,base):{image:'',sourceId:'src/data/ledaProductionAudio.js',mediaDecision:{}};
  const targetAudio=getLedaWordAudioPath(word);
  if(!targetAudio)throw Error(`Missing exact V11 CVC target recording: ${word}`);
  const sounds=PHONEMES[word].split(' '),vowel=VOWELS[sounds[1]];
  const choices=[word,...foils].map((label,index)=>({id:`c${index}`,label}));
  const id=`mock.v11.phonics.cvc-capacity.${word}`;
  const source={id,skillId:'cvc_short_vowels',domainId:'phonics',level:1,format:'choice',answerMode:'exact',
   prompt,passage:'',targetWord:word,renderTargetText:false,image,imageAlt:word,modality:'recognition',
   evidenceModality:pictured?'audio+image+print':'audio+print',hideWrittenLabels:false,choices,answer:'c0',
   constructClaim:`match_spoken_short_vowel_word:short_${vowel}`,
   stimulusKey:word,canonicalPassageId:word,exposureFamilyId:`mock-foundation-word:${word}`,
   requiredAudioCues:[{role:'instruction',text:prompt,path:instruction,required:true},{role:'target_word',text:word,path:targetAudio,required:true}],
   sourceProvenance:{kind:'original_literacy_guide_v11_capacity',file:FILE,sourceId:id,...(pictured?{pictureSourceId:sourceId}:{recordingSourceId:sourceId})},
   mediaDecision:{...mediaDecision,itemId:id,alt:pictured?word:'',role:pictured?'target':'audio-and-print',paths:image?[image]:[],constructReview:'approved',answerNeutral:'approved',
    reason:pictured?'Existing exact reviewed word/action picture and exact target recording support the response. All four printed CVC alternatives remain silent.'
     :'The exact spoken three-phoneme target is the complete evidence. This is a direct spoken-to-print word contrast; an object picture is neither necessary nor accurate for this word. All four assessed printed alternatives remain silent.'},
   distractorRationales:Object.fromEntries(foils.map((foil,index)=>[`c${index+1}`,`${foil} changes ${[...foil].map((letter,i)=>letter!==word[i]?['the first consonant','the short vowel','the final consonant'][i]:null).filter(Boolean).join(' and ')} of the complete target ${word}.`])),
   explanation:`${word} is the complete printed word that matches ${pictured?'the picture and recording':'the recording'}.`,
   difficultyEvidence:'Read a three-phoneme short-vowel word against three real CVC alternatives. Shared initial letters require more than an initial-letter match; changed vowels and final consonants require attention to the complete word.',
   taskDemand:{reviewed:true,operation:'decode_cvc',features:{phonemeCount:3,shortVowel:true,completeWordContrast:true,silentPrintedResponses:true},
    proof:{targetWord:word,targetPhonemes:sounds,targetImage:image,retained:word,rejected:foils}},
  };
  const item={...normalize(source),canonicalPassageId:word,lexicalExposureWords:[word],adaptiveAreaBand:1,adaptiveMixedEligible:true,
   adaptiveDemand:{operation:'decode_cvc',requires:'Discriminate a complete printed CVC word against other CVC words.'}};
  output.push({...item,itemSnapshot:{...item}});used.add(word);
 }
 return output;
}
