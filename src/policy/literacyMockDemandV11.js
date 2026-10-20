import {literacyMockDemandV10,LITERACY_MOCK_V10_LADDERS} from './literacyMockDemandV10.js';
export const LITERACY_MOCK_V11_LADDERS=LITERACY_MOCK_V10_LADDERS;

/** V11 keeps the reviewed operations, with new complete choice sets. Resolve
 * a corrected source against the retained original, never its numeric band
 * alone. The content gate separately validates every current key and cue. */
export function literacyMockDemandV11(q,{sourceItems}={}){
 if(q.tutorialOnly)return null;
 if(q.sourceProvenance?.file==='src/data/literacyMockActionCapacityV11.js'){
  const proof=q.taskDemand?.proof,features=q.taskDemand?.features,choices=q.choices||[],key=choices.find(c=>c.id===q.answer);
  const valid=q.domainId==='language' && q.skillId==='verbs' && q.format==='choice' && q.routeReservationArea==='language'
   && q.taskDemand?.reviewed===true && q.taskDemand.operation===q.constructClaim && features?.recordedResponses===true && features.responseCount===4
   && proof?.picturedAction===q.targetWord && proof.retained===q.targetWord && proof.image===q.image && q.imageAlt===q.targetWord
   && choices.length===4 && new Set(choices.map(c=>c.label)).size===4 && key?.label===q.targetWord && !q.passage && !q.renderTargetText
   && choices.every(c=>!c.image && c.audioPath && q.requiredAudioCues.some(a=>a.role==='choice'&&a.choiceId===c.id&&a.text===c.label&&a.path===c.audioPath))
   && JSON.stringify(proof.rejected)===JSON.stringify(choices.filter(c=>c.id!==q.answer).map(c=>c.label));
  if(!valid)return null;
  const foils=choices.filter(c=>c.id!==q.answer).map(c=>c.label);
  if(q.constructClaim==='action_word_against_object_word' && features.distinctActionFoils===false
   && foils.every(word=>['cat','cup','moon','sun','fish','bus','bed','book'].includes(word)))return 0;
  if(q.constructClaim==='distinguish_action_word_meaning' && features.distinctActionFoils===true
   && foils.every(word=>['sleep','swim','write','kick','sing','dig'].includes(word)))return 1;
  return null;
 }
 if(q.sourceProvenance?.file==='src/data/literacyMockWritingCapacityV11.js'){
  const proof=q.taskDemand?.proof,features=q.taskDemand?.features,choices=q.choices||[],key=choices.find(c=>c.id===q.answer);
  return q.domainId==='writing' && q.skillId==='capitalization' && q.format==='choice' && q.constructClaim==='recognize_name_capital_form'
   && q.taskDemand?.reviewed===true && q.taskDemand.operation==='capitalize_name' && features?.initialCapitalRequired===true
   && features.silentPrintedChoices===true && features.responseCount===4 && proof?.targetName===q.targetWord && proof.retained===q.targetWord
   && /^[A-Z][a-z]+$/.test(q.targetWord) && choices.length===4 && new Set(choices.map(c=>c.label)).size===4
   && choices.every(c=>c.label.toLowerCase()===q.targetWord.toLowerCase() && proof.nameCaseForms?.[c.id]===c.label && !c.audioPath && !c.image)
   && choices.filter(c=>/^[A-Z][a-z]+$/.test(c.label)).length===1 && key?.label===q.targetWord
   && JSON.stringify(proof.rejected)===JSON.stringify(choices.filter(c=>c.id!==q.answer).map(c=>c.label))
   && q.requiredAudioCues.length===1 && q.requiredAudioCues[0].role==='instruction' && !q.renderTargetText && !q.image ? 0:null;
 }
 if(q.sourceProvenance?.file==='src/data/literacyMockEverydayCapacityV11.js' && q.skillId==='picture_word_reading'){
  const proof=q.taskDemand?.proof,features=q.taskDemand?.features,labels=q.choices?.map(c=>c.label)||[];
  const valid=q.domainId==='reading' && q.format==='choice' && q.modality==='reading' && q.evidenceModality==='image+print'
   && q.taskDemand?.reviewed===true && q.taskDemand.operation===q.constructClaim && q.routeReservationArea==='reading'
   && !q.renderTargetText && !q.hideWrittenLabels && !q.passage && q.image===proof?.targetImage && q.imageAlt===q.targetWord
   && proof?.targetWord===q.targetWord && proof.retained===q.targetWord && proof.targetPhonemes?.length===3
   && features?.phonemeCount===3 && features.silentPrintedResponses===true
   && labels.length===4 && new Set(labels).size===4 && labels.every(label=>/^[a-z]{3}$/.test(label))
   && q.choices.find(c=>c.id===q.answer)?.label===q.targetWord && q.choices.every(c=>!c.image&&!c.audioPath)
   && JSON.stringify(proof.rejected)===JSON.stringify(q.choices.filter(c=>c.id!==q.answer).map(c=>c.label))
   && q.requiredAudioCues.length===1 && q.requiredAudioCues[0].role==='instruction';
  if(!valid)return null;
  if(q.constructClaim==='read_word_distinct_initials' && features.distinctInitials===true && new Set(labels.map(word=>word[0])).size===4)return 0;
  if(q.constructClaim==='read_complete_cvc_word' && features.completeWordContrast===true && labels.filter(word=>word[0]===q.targetWord[0]).length>=2)return 1;
  return null;
 }
 if(q.sourceProvenance?.file==='src/data/literacyMockEverydayCapacityV11.js' && q.skillId!=='picture_word_reading'){
  const proof=q.taskDemand?.proof,features=q.taskDemand?.features;
  const labels=q.choices?.map(c=>c.label)||[];
  const common=q.format==='choice' && q.taskDemand?.reviewed===true && q.taskDemand.operation===q.constructClaim
   && ['picture_vocabulary','listen_words_phrases'].includes(q.skillId)
   && q.modality==='listening' && q.hideWrittenLabels===true && q.displayPassageDuringResponse===false
   && q.renderTargetText===false && features?.oralFirst===true && features.hiddenPrintedLabels===true
   && features.distinctConcreteReferents===true && features.responseCount===4
   && labels.length===4 && new Set(labels).size===4 && q.choices.every(c=>c.image && c.imageAlt===c.label && !c.audioPath)
   && proof?.targetWord===q.targetWord && proof.retained===q.targetWord
   && q.choices.find(c=>c.id===q.answer)?.label===q.targetWord
   && JSON.stringify(proof.rejected)===JSON.stringify(q.choices.filter(c=>c.id!==q.answer).map(c=>c.label))
   && !q.requiredAudioCues.some(c=>c.role==='choice');
  if(!common)return null;
  if(q.domainId==='vocabulary' && q.skillId==='picture_vocabulary' && !q.passage
   && q.requiredAudioCues.some(c=>c.role==='target_word' && c.text===q.targetWord)){
   return q.constructClaim==='familiar_word_across_categories'?0:q.constructClaim==='familiar_word_within_category'?1:null;
  }
  if(q.domainId==='listening' && q.skillId==='listen_words_phrases'){
   if(q.constructClaim==='identify_spoken_word' && !q.passage && q.requiredAudioCues.some(c=>c.role==='target_word' && c.text===q.targetWord))return 0;
   const words=q.passage?.toLowerCase().replace(/[^a-z ]/g,'').split(/\s+/)||[];
   if(q.constructClaim==='identify_spoken_sentence_referent' && proof.sentence===q.passage && proof.explicitNamedReferent===q.targetWord
    && words.includes(q.targetWord) && !proof.rejected.some(word=>words.includes(word)) && words.length<=10
    && q.requiredAudioCues.some(c=>c.role==='passage' && c.text===q.passage))return 1;
  }
  return null;
 }
 if(q.sourceProvenance?.file==='src/data/literacyMockPhonicsCapacityV11.js'){
  const proof=q.taskDemand?.proof,features=q.taskDemand?.features;
  return q.domainId==='phonics' && q.format==='choice' && q.taskDemand?.reviewed===true
   && q.taskDemand.operation==='decode_cvc' && features?.phonemeCount===3 && features.shortVowel===true
   && proof?.targetWord===q.targetWord && proof.targetPhonemes?.length===3
   && q.choices.length===4 && q.choices.every(c=>/^[a-z]{3}$/.test(c.label))
   && q.choices.find(c=>c.id===q.answer)?.label===q.targetWord
   && q.requiredAudioCues.some(c=>c.role==='target_word'&&c.text===q.targetWord)
   && !q.choices.some(c=>c.audioPath) ? 1 : null;
 }
 const originalId=q.sourceProvenance?.v11MeaningChoices?.originalId
  || (q.sourceProvenance?.file==='src/data/literacyMockFourChoiceFoundationsV11.js' ? q.sourceProvenance.sourceId : null);
 if(originalId){
  const source=sourceItems?.get(originalId);
  if(!source || q.format!=='choice' || q.choices.length!==4 || q.domainId!==source.domainId || q.skillId!==source.skillId || q.constructClaim!==source.constructClaim)return null;
  return literacyMockDemandV10(source);
 }
 return literacyMockDemandV10(q);
}
