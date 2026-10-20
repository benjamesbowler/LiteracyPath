import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
const FILE='src/data/literacyMockActionCapacityV11.js';
// Directly inspected existing action illustrations. The two authored foil sets
// avoid both objects visible in the scene and simultaneous subsidiary actions.
// In particular, spill is not contrasted with its pictured cup, roll with push,
// wear with sit, or shout with sing. Existing QA quarantine remains authoritative.
const ROWS=[
 ['bounce','/images/assessment/language/variants/verbs/bounce-01.webp','cat cup moon','sleep swim write'],
 ['fold','/images/assessment/language/variants/verbs/fold-01.webp','cat sun fish','swim kick sing'],
 ['whisper','/images/assessment/language/variants/verbs/whisper-01.webp','cup bus moon','swim sleep dig'],
 ['shake','/media/vocabulary/images/verb-shake.webp','cat bed moon','sleep swim write'],
 ['roll','/media/vocabulary/images/roll.webp','cup moon book','sleep swim write'],
 ['shout','/images/assessment/generated/concepts/shout.webp','cat bed moon','sleep swim write'],
 ['spill','/images/assessment/literacy-mock/capacity/foundation-spill.webp','cat sun fish','sleep swim write'],
 ['wear','/media/vocabulary/images/wear.webp','cup bus fish','sleep swim dig'],
 ['cut','/images/assessment/literacy-mock/capacity/foundation-cut.webp','moon cat bus','sleep swim sing'],
];

/** Fresh familiar actions at the established two entry operations. All variants
 * retain one global lexical family and a stable language reservation. */
export function buildLiteracyMockActionCapacityV11(base,normalize){
 const used=new Set(base.filter(q=>q.adaptiveMixedEligible&&q.domainId==='language'&&q.adaptiveAreaBand<2).map(q=>q.targetWord));
 const prompt='Which word matches the picture?',instruction=getLedaInstructionAudioPath(prompt);
 if(!instruction)throw Error('Missing exact action instruction recording.');
 const output=[];
 for(const[word,image,objects,actions]of ROWS){
  if(used.has(word))continue;
  for(const band of [0,1]){
   const labels=[word,...(band===0?objects:actions).split(' ')];
   const choices=labels.map((label,index)=>{
    const path=getLedaWordAudioPath(label);if(!path)throw Error(`Missing exact V11 action response recording: ${label}`);
    return{id:`c${index}`,label,audioPath:path};
   });
   const claim=band===0?'action_word_against_object_word':'distinguish_action_word_meaning';
   const id=`mock.v11.language.action-capacity.${band}.${word}`;
   const source={id,skillId:'verbs',domainId:'language',level:band+1,format:'choice',answerMode:'exact',prompt,passage:'',targetWord:word,
    image,imageAlt:word,modality:'recognition',evidenceModality:'audio+image+print',renderTargetText:false,hideWrittenLabels:false,
    choices,answer:'c0',constructClaim:claim,exposureFamilyId:`mock-foundation-word:${word}`,canonicalPassageId:word,stimulusKey:`action-meaning:${word}`,
    requiredAudioCues:[{role:'instruction',text:prompt,path:instruction,required:true},...choices.map(c=>({role:'choice',text:c.label,value:c.label,choiceId:c.id,path:c.audioPath,required:true}))],
    sourceProvenance:{kind:'original_literacy_guide_v11_action_capacity',file:FILE,sourceId:id},
    mediaDecision:{role:'evidence',paths:[image],constructReview:'approved',answerNeutral:'approved',reviewType:'model_visual_review_2026_10_20',
     reason:'Directly inspected the existing exact action raster at answer-card size. The foreground action is literal and every distractor names an absent action or object. No new image was generated and no QA quarantine was overridden.'},
    distractorRationales:Object.fromEntries(choices.slice(1).map(c=>[c.id,band===0?`${c.label} names an object absent from this action scene.`:`The foreground action is ${word}, not ${c.label}; this alternative action is absent from the scene.`])),
    taskDemand:{reviewed:true,operation:claim,features:{recordedResponses:true,distinctActionFoils:band===1,responseCount:4},
     proof:{picturedAction:word,retained:word,rejected:labels.slice(1),image}},
    explanation:`The pictured action is ${word}.`,
   };
   const item={...normalize(source),foundationBand:band,routeReservationArea:'language',canonicalPassageId:word,lexicalExposureWords:[word],adaptiveAreaBand:band,adaptiveMixedEligible:true,
    adaptiveDemand:{operation:band===0?'recognize_action':'discriminate_actions',requires:band===0?'Distinguish a pictured action word from object words using recorded alternatives.':'Distinguish a pictured familiar action from other recorded action words.'}};
   output.push({...item,itemSnapshot:{...item}});
  }
  used.add(word);
 }
 return output;
}
