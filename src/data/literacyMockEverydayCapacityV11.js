import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
import { curatedChildWordImageOverrides } from './childWordImageOverrides.js';
import { getLiteracyMockAudioV11Path } from './literacyMockAudioV11.js';
const FILE='src/data/literacyMockEverydayCapacityV11.js';
const EVERYDAY_SKILLS=new Set(['picture_vocabulary','picture_word_reading','listen_words_phrases']);
// Forty familiar spoken meanings, each with one exact existing illustration.
// No plural form or recycled word is counted as a fresh lexical family.
const ROWS=[
 ['lion','The lion is asleep.','tiger zebra monkey'],
 ['tiger','The tiger can run.','lion zebra monkey'],
 ['zebra','I can see a zebra.','lion tiger monkey'],
 ['monkey','The monkey is in a tree.','lion tiger zebra'],
 ['penguin','The penguin can swim.','whale shark dolphin'],
 ['snake','The snake is on a rock.','snail spider butterfly'],
 ['snail','The snail is on a leaf.','snake spider butterfly'],
 ['spider','The spider has long legs.','snail snake butterfly'],
 ['whale','The whale is in the sea.','penguin shark dolphin'],
 ['shark','The shark is in the water.','penguin whale dolphin'],
 ['dolphin','The dolphin can jump.','penguin whale shark'],
 ['butterfly','The butterfly can fly.','snail snake spider'],
 ['caterpillar','The caterpillar is on a leaf.','snail spider butterfly'],
 ['kangaroo','The kangaroo can hop.','lion zebra monkey'],
 ['chin','This is my chin.','hand hair leg'],
 ['tooth','I have a loose tooth.','hand hair leg'],
 ['hand','I can wave my hand.','elbow hair leg'],
 ['elbow','I can bend my elbow.','hand hair leg'],
 ['hair','I can brush my hair.','hand elbow leg'],
 ['mouth','I can open my mouth.','hand elbow leg'],
 ['leg','I can bend my leg.','hand elbow hair'],
 ['bread','I can eat some bread.','corn rice watermelon'],
 ['corn','The corn is yellow.','bread rice watermelon'],
 ['rice','I can eat some rice.','bread corn watermelon'],
 ['meat','I can eat some meat.','bread corn watermelon'],
 ['soup','The soup is hot.','bread corn watermelon'],
 ['watermelon','I can eat some watermelon.','apple banana orange'],
 ['ring','The king wears a gold ring.','watch belt scarf'],
 ['window','I can open the window.','chair lamp sink'],
 ['lamp','I can turn on the lamp.','chair window sink'],
 ['sink','I can wash at the sink.','chair window lamp'],
 ['bath','The bath is full of water.','sink chair lamp'],
 ['brush','I can hold the brush.','broom watch phone'],
 ['broom','I can sweep with the broom.','brush watch phone'],
 ['watch','I can wear my watch.','brush camera phone'],
 ['phone','I can talk on the phone.','brush watch camera'],
 ['camera','I can take a photo with the camera.','brush watch phone'],
 ['snow','The snow is cold.','rain rock leaf'],
 ['rain','I can hear the rain.','snow leaf rock'],
 ['cloud','I can see a cloud.','leaf rock shell'],
];
// This partition is authored and remains stable when media is unavailable or
// an earlier target is excluded. It cannot drift with a filtered bank order.
const VOCABULARY_RESERVED_WORDS=new Set(ROWS.slice(0,20).map(([word])=>word));
const READING_ROWS=[
 ['gem','gum get gap','/media/vocabulary/images/gem.webp','JH EH M'],
 ['yam','yak yes yet','/media/initial-sounds/images/y/yam.webp','Y AE M'],
 ['cop','cup cot cut','/media/vocabulary/images/cop.webp','K AA P'],
 ['pin','pan pen pit','/images/assessment/rhyming/variants/in/pin-02.webp','P IH N'],
 ['jet','jug jam net','/images/assessment/objective-words/jet.webp','JH EH T'],
 ['cot','cat cut cop','/images/child-mode/initial-sounds/cot.webp','K AA T'],
 ['bug','bag big bun','/images/assessment/rhyming/variants/bug/bug-02.webp','B AH G'],
 ['peg','pig pet pen','/images/assessment/rhyming/variants/eg/peg-02.webp','P EH G'],
 ['leg','log led let','/images/assessment/objective-words/leg.webp','L EH G'],
];
const EXACT_PICTURES={
 lion:'/images/assessment/objective-words/lion.webp',tiger:'/images/assessment/objective-words/tiger.webp',zebra:'/images/assessment/objective-words/zebra.webp',
 monkey:'/images/child-mode/initial-sounds/reviewed/monkey.webp',penguin:'/images/assessment/generated/initial-sounds-l2/penguin.webp',
 snake:'/images/assessment/objective-words/snake.webp',snail:'/images/assessment/release-support/targets/snail-9054cc.webp',
 spider:'/images/assessment/literacy-mock/capacity/foundation-spider.webp',whale:'/images/assessment/digraphs/whale.webp',shark:'/images/assessment/digraphs/shark.webp',
 dolphin:'/images/assessment/digraphs/dolphin.webp',butterfly:'/images/assessment/objective-words/butterfly.webp',caterpillar:'/images/assessment/objective-words/caterpillar.webp',
 kangaroo:'/images/assessment/objective-words/kangaroo.webp',chin:'/images/assessment/literacy-mock/capacity/foundation-chin.webp',
 tooth:'/images/assessment/objective-words/tooth.webp',hand:'/media/initial-sounds/images/h/hand.webp',elbow:'/images/assessment/objective-words/elbow.webp',
 hair:'/images/child-mode/vocabulary/hair.webp',mouth:'/images/child-mode/vocabulary/mouth.webp',leg:'/images/assessment/objective-words/leg.webp',
 bread:'/images/assessment/objective-words/bread.webp',corn:'/images/assessment/objective-words/corn.webp',rice:'/images/child-mode/vocabulary/rice.webp',
 meat:'/images/assessment/release-media/meat-52e1a2a7.webp',soup:'/images/child-mode/vocabulary/soup.webp',watermelon:'/images/assessment/generated/initial-sounds-l2/watermelon.webp',
 ring:'/images/assessment/rhyming/variants/ing/ring-02.webp',chair:'/images/child-mode/digraphs/chair.webp',belt:'/images/assessment/blends/belt.webp',scarf:'/media/vocabulary/images/scarf.webp',window:'/images/assessment/objective-words/window.webp',lamp:'/images/assessment/objective-words/lamp.webp',
 sink:'/images/child-mode/vocabulary/sink.webp',bath:'/images/assessment/digraphs/bath.webp',brush:'/images/assessment/objective-words/brush.webp',
 broom:'/images/assessment/blends/broom.webp',watch:'/images/assessment/objective-words/watch.webp',phone:'/images/assessment/digraphs/phone.webp',
 camera:'/images/assessment/generated/initial-sounds-l2/camera.webp',snow:'/images/assessment/long-vowels/snow.webp',rain:'/images/assessment/long-vowels/rain.webp',
 leaf:'/images/child-mode/initial-sounds/leaf.webp',cloud:'/images/child-mode/blends/cloud.webp',rock:'/images/assessment/digraphs/rock.webp',shell:'/images/assessment/digraphs/shell.webp',
 apple:'/images/assessment/objective-words/apple.webp',banana:'/images/assessment/objective-words/banana.webp',orange:'/images/assessment/objective-words/orange.webp',
 cat:'/images/assessment/objective-words/cat.webp',bus:'/images/child-mode/initial-sounds/bus.webp',shoe:'/images/assessment/digraphs/shoe.webp',
};
const cue=(role,text,path)=>({role,text,path:path||null,required:true});
const image=word=>EXACT_PICTURES[word]||curatedChildWordImageOverrides[word];
const broadFor=word=>{
 const fixed=['cat','bus','apple','shoe'];
 return fixed.filter(other=>other!==word).slice(0,3);
};

/** Genuine new vocabulary/listening targets. The four variants share one global
 * word family, so no area, version or altered foil bank invents fresh evidence.
 * Upper listening supplies one natural recorded sentence and no printed clue. */
export function buildLiteracyMockEverydayCapacityV11(base,normalize){
 const used=new Set(base.filter(q=>q.adaptiveMixedEligible&&EVERYDAY_SKILLS.has(q.skillId)).map(q=>q.targetWord).filter(Boolean));
 const prompt='Listen and find.',instruction=getLedaInstructionAudioPath(prompt);
 if(!instruction)throw Error('Missing exact everyday instruction recording.');
 const output=[];
 for(const [word,sentence,near]of ROWS){
  if(used.has(word))continue;
  const targetAudio=getLedaWordAudioPath(word);
  if(!targetAudio||!image(word))throw Error(`Missing exact everyday word evidence: ${word}`);
  for(const domain of ['vocabulary','listening'])for(const band of [0,1]){
   const labels=[word,...(domain==='vocabulary'&&band===1?near.split(' '):broadFor(word))];
   const choices=labels.map((label,index)=>{
    const path=image(label);if(!path)throw Error(`Missing exact everyday option image: ${word}: ${label}`);
    return{id:`c${index}`,label,image:path,imageAlt:label};
   });
   const phrase=domain==='listening'&&band===1;
   const claim=domain==='vocabulary'?(band===0?'familiar_word_across_categories':'familiar_word_within_category')
    :phrase?'identify_spoken_sentence_referent':'identify_spoken_word';
   const id=`mock.v11.everyday.${domain}.${band}.${word}`;
   const audio=phrase?cue('passage',sentence,getLedaInstructionAudioPath(sentence)||getLiteracyMockAudioV11Path(sentence,['assessment_passage'])):cue('target_word',word,targetAudio);
   const source={id,skillId:domain==='vocabulary'?'picture_vocabulary':'listen_words_phrases',domainId:domain,level:band+1,
    format:'choice',answerMode:'exact',prompt,passage:phrase?sentence:'',targetWord:word,modality:'listening',evidenceModality:'audio+image',
    hideWrittenLabels:true,displayPassageDuringResponse:false,renderTargetText:false,choices,answer:'c0',constructClaim:claim,
    exposureFamilyId:`mock-foundation-word:${word}`,canonicalPassageId:word,stimulusKey:phrase?sentence.toLowerCase():`${domain}-word:${word}`,
    requiredAudioCues:phrase?[audio,cue('instruction',prompt,instruction)]:[cue('instruction',prompt,instruction),audio],
    sourceProvenance:{kind:'original_literacy_guide_v11_everyday_capacity',file:FILE,sourceId:id},
    mediaDecision:{role:'evidence',paths:choices.map(c=>c.image),constructReview:'approved',answerNeutral:'approved',
     reason:'Each pictured response uses existing exact-word assessment or canonical child vocabulary art. The spoken word/sentence is the evidence; hidden print and unspoken image choices do not create a reading demand.'},
    distractorRationales:Object.fromEntries(choices.slice(1).map(c=>[c.id,`${c.label} names a different familiar ${domain==='vocabulary'&&band===1?'object or animal in the same broad meaning group':'object'} from the spoken referent ${word}.`])),
    taskDemand:{reviewed:true,operation:claim,features:{oralFirst:true,hiddenPrintedLabels:true,distinctConcreteReferents:true,responseCount:4},
     proof:{targetWord:word,retained:word,rejected:labels.slice(1),...(phrase?{sentence,explicitNamedReferent:word}:{})}},
    explanation:`The ${phrase?'sentence names':'spoken word names'} ${word}.`,
   };
   const item={...normalize(source),routeReservationArea:word==='leg'?'reading':VOCABULARY_RESERVED_WORDS.has(word)?'vocabulary':'listening',foundationBand:band,canonicalPassageId:word,lexicalExposureWords:[word],adaptiveAreaBand:band,adaptiveMixedEligible:true,
    adaptiveDemand:{operation:domain==='vocabulary'?(band===0?'recognize_familiar_word':'discriminate_familiar_words'):phrase?'follow_short_spoken_phrase':'recognize_spoken_word',
     requires:phrase?'Identify the named concrete referent in one short spoken sentence.':'Identify one familiar spoken word using complete pictured alternatives.'}};
   output.push({...item,itemSnapshot:{...item}});
  }
  used.add(word);
 }
 const priorReadingWords=new Set(base.filter(q=>q.adaptiveMixedEligible&&q.skillId==='picture_word_reading').map(q=>q.targetWord));
 const readingPrompt='Which word matches the picture?',readingInstruction=getLedaInstructionAudioPath(readingPrompt);
 if(!readingInstruction)throw Error('Missing existing reading instruction recording.');
 for(const[word,close,path,phonemes]of READING_ROWS){
  if(priorReadingWords.has(word))continue;
  for(const band of [0,1]){
   const foils=band===0?['cat','pig','hen','sun'].filter(label=>label[0]!==word[0]).slice(0,3):close.split(' ');
   const choices=[word,...foils].map((label,index)=>({id:`c${index}`,label}));
   const id=`mock.v11.everyday.reading.${band}.${word}`,claim=band===0?'read_word_distinct_initials':'read_complete_cvc_word';
   const source={id,skillId:'picture_word_reading',domainId:'reading',level:band+1,format:'choice',answerMode:'exact',
    prompt:readingPrompt,passage:'',targetWord:word,image:path,imageAlt:word,modality:'reading',evidenceModality:'image+print',
    renderTargetText:false,hideWrittenLabels:false,choices,answer:'c0',constructClaim:claim,
    exposureFamilyId:`mock-foundation-word:${word}`,canonicalPassageId:word,stimulusKey:`read-picture-word:${word}`,
    requiredAudioCues:[cue('instruction',readingPrompt,readingInstruction)],
    sourceProvenance:{kind:'original_literacy_guide_v11_everyday_capacity',file:FILE,sourceId:id},
    mediaDecision:{role:'evidence',paths:[path],constructReview:'approved',answerNeutral:'approved',reviewType:'model_visual_review_2026_10_20',
     reason:'The existing exact target illustration was directly inspected. Only the instruction is narrated. No printed answer is pronounced or reproduced in the image. The cop alternatives exclude cap because the officer wears a cap; vet was excluded because its existing image showed only a stethoscope.'},
    distractorRationales:Object.fromEntries(choices.slice(1).map(c=>[c.id,`${c.label} is a different complete word from the pictured ${word}.`])),
    taskDemand:{reviewed:true,operation:claim,features:{phonemeCount:3,silentPrintedResponses:true,distinctInitials:band===0,completeWordContrast:band===1},
     proof:{targetWord:word,targetPhonemes:phonemes.split(' '),retained:word,rejected:foils,targetImage:path}},
    explanation:`${word} is the complete printed word naming the pictured target.`,
   };
   const item={...normalize(source),routeReservationArea:'reading',foundationBand:band,canonicalPassageId:word,lexicalExposureWords:[word],adaptiveAreaBand:band,adaptiveMixedEligible:true,
    adaptiveDemand:{operation:band===0?'read_word_distinct_initials':'read_complete_cvc_word',requires:band===0?'Recognize a familiar pictured word among different initial letters.':'Read the complete pictured CVC word against close printed alternatives.'}};
   output.push({...item,itemSnapshot:{...item}});
  }
  priorReadingWords.add(word);
 }
 return output;
}

export function listLiteracyMockEverydayCapacityV11AudioGaps(base,normalize){
 const gaps=new Map();
 for(const item of buildLiteracyMockEverydayCapacityV11(base,normalize))for(const c of item.requiredAudioCues.filter(c=>!c.path)){
  const key=`${c.role}:${c.text}`,record=gaps.get(key)||{role:c.role==='passage'?'assessment_passage':'assessment_prompt',text:c.text,itemIds:[]};
  record.itemIds.push(item.id);gaps.set(key,record);
 }
 return[...gaps.values()];
}
