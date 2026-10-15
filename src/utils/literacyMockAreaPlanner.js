import { allocateIndependentItems, shuffleLiteracyMock } from './literacyMockPlanner.js';
import { buildLiteracyExposureIndex, getLiteracyExposure, isEligibleLiteracyResponse, canonicalLiteracyIdentity } from './literacyEvidence.js';
import { isLiteracyItemEligible } from '../policy/literacyItemEligibility.js';
import { literacyMockAreaSchedule,LITERACY_MOCK_AREA_MAX,LITERACY_MOCK_AREA_COUNTS,isLiteracyMockAreaRouteItem } from '../policy/literacyMockAdaptivePolicy.js';
import { sameLiteracyMockTask } from './literacyMockConditions.js';

const capacityError=message=>Object.assign(new Error(message),{code:'mock_fresh_capacity'});
const band=q=>q?.adaptiveAreaBand??q?.itemSnapshot?.adaptiveAreaBand;
const mediaPaths=q=>[...(q.requiredAudioPaths||[]),...(q.requiredImagePaths||[])].map(p=>p.split('#')[0]);
const known=(items,exposures)=>{
  const history=buildLiteracyExposureIndex({exposures});
  const stimuli=new Set(exposures.map(q=>q.stimulusKey||q.itemSnapshot?.stimulusKey).filter(Boolean));
  return items.filter(q=>!stimuli.has(q.stimulusKey)&&!getLiteracyExposure(q,history).knownFamiliar);
};
const blocked=failures=>{
  const ids=new Set(failures.map(q=>q.questionId));const paths=new Set(failures.flatMap(q=>q.failedMediaPaths||[]).map(p=>p.split('#')[0]));
  return q=>ids.has(q.id)||mediaPaths(q).some(p=>paths.has(p));
};
function usable(bank,failures=[]) {
  const tutorials=new Set(bank.filter(q=>q.tutorialOnly).map(q=>q.stimulusKey));const failed=blocked(failures);
  return bank.filter(q=>['literacy-mock-v5','literacy-mock-v6'].includes(q.contentVersion)&&q.mediaReady!==false&&!q.tutorialOnly&&!tutorials.has(q.stimulusKey)
    &&isLiteracyItemEligible(q)&&isLiteracyMockAreaRouteItem(q)&&Number.isInteger(band(q))&&!failed(q));
}

export function literacyMockAreaState(bank,responses=[]) {
  const byId=new Map(bank.map(q=>[q.id,q]));
  const states=Object.fromEntries(Object.keys(LITERACY_MOCK_AREA_MAX).map(id=>[id,1]));
  for(const response of responses) {
    const q=byId.get(response.questionId);
    if(!q||!isEligibleLiteracyResponse(response)||!Number.isInteger(band(q)))continue;
    states[q.domainId]=Math.max(0,Math.min(LITERACY_MOCK_AREA_MAX[q.domainId],band(q)+(response.isCorrect?1:-1)));
  }
  return states;
}

// Entry words are reserved by area. Hearing a pictured word in vocabulary
// cannot quietly make its later reading/listening copy "fresh" evidence.
function entryOwnership(items) {
  const listening=new Set(items.filter(q=>q.skillId==='listen_words_phrases'&&band(q)===1).map(q=>q.targetWord));
  const reading=new Set(items.filter(q=>q.skillId==='picture_word_reading'&&!listening.has(q.targetWord)).map(q=>q.targetWord));
  const vocabulary=new Set(items.filter(q=>q.skillId==='picture_vocabulary'&&!listening.has(q.targetWord)&&!reading.has(q.targetWord)).map(q=>q.targetWord));
  const language=new Set(items.filter(q=>q.domainId==='language'&&q.foundationBand!==undefined).map(q=>q.targetWord));
  const owners=new Map([...listening].map(word=>[word,'listening']).concat([...reading].map(word=>[word,'reading']),[...vocabulary].map(word=>[word,'vocabulary']),[...language].map(word=>[word,'language'])));
  return items.filter(q=>{
    const family=canonicalLiteracyIdentity(q).familyId;
    const word=family?.startsWith('mock-foundation-word:')?family.slice('mock-foundation-word:'.length):null;
    return !owners.has(word)||owners.get(word)===q.domainId;
  });
}

function offlinePool(candidates,plan,byId) {
  const reserved=plan.itemIds.map(id=>byId.get(id));
  const assets=new Set(reserved.flatMap(mediaPaths));
  // Reserves must be independent across bands and areas as well as within
  // each band. A later reading task cannot consume the listening reserve.
  for(const [domain,maximum]of Object.entries(LITERACY_MOCK_AREA_MAX))for(let stage=0;stage<=maximum;stage++) {
    const total=LITERACY_MOCK_AREA_COUNTS[domain]-Math.max(0,stage-1)+1;
    const existing=reserved.filter(q=>q.domainId===domain&&band(q)===stage).length;
    const needed=Math.max(0,total-existing);
    if(!needed)continue;
    const fresh=known(candidates,reserved).filter(q=>q.domainId===domain&&band(q)===stage);
    const pool=shuffleLiteracyMock(fresh,`${plan.seed}:${domain}:${stage}:offline`);
    pool.sort((a,b)=>mediaPaths(a).filter(p=>!assets.has(p)).length-mediaPaths(b).filter(p=>!assets.has(p)).length);
    const selected=allocateIndependentItems(Array.from({length:needed},()=>pool));
    if(!selected)throw capacityError(`Not enough fresh ${domain} questions at demand ${stage}.`);
    for(const q of selected){reserved.push(q);for(const p of mediaPaths(q))assets.add(p);}
  }
  return reserved.map(q=>q.id);
}

export function selectLiteracyMockAreaPlan(bank,{sessionId,studentId,itemCount=43,seed,exposures=[],onOfflineItems}={}) {
  if(!sessionId||!studentId)throw Error('An adaptive area plan needs a session and learner.');
  const schedule=literacyMockAreaSchedule(itemCount),planSeed=seed||`${sessionId}:${studentId}:${bank.some(q=>q.contentVersion==='literacy-mock-v6')?'areas-v2':'areas-v1'}`;
  const candidates=known(entryOwnership(usable(bank)),exposures);
  const options=schedule.map((domain,index)=>shuffleLiteracyMock(candidates.filter(q=>q.domainId===domain&&band(q)===1),`${planSeed}:${index}:entry`));
  const selected=allocateIndependentItems(options,schedule);
  if(!selected)throw capacityError('Not enough fresh starter questions for a complete test.');
  const plan={itemIds:selected.map(q=>q.id),seed:planSeed};
  if(onOfflineItems)onOfflineItems(offlinePool(candidates,plan,new Map(bank.map(q=>[q.id,q]))));
  return plan;
}

/** Rechoose unseen tasks within each area's actual demand, preserving every
 * saved answer and shown question. A failure never changes another area's state. */
export function adaptLiteracyMockAreaPlan(bank,plan,responses=[],failures=[],presentations=[],{exposures=[]}={}) {
  const byId=new Map(bank.map(q=>[q.id,q])),schedule=literacyMockAreaSchedule(plan.itemIds.length);
  if(responses.length>plan.itemIds.length||responses.some((q,i)=>q.questionId!==plan.itemIds[i])||plan.itemIds.some(id=>!byId.has(id)))throw Error('Invalid adaptive history.');
  const shown=new Set(presentations.map(q=>q.questionId)),failed=blocked(failures),states=literacyMockAreaState(bank,responses);
  const editable=plan.itemIds.flatMap((id,i)=>i>=responses.length&&!shown.has(id)&&!failed(byId.get(id))?[i]:[]);
  const editableSet=new Set(editable),frozen=plan.itemIds.filter((_,i)=>!editableSet.has(i)).map(id=>byId.get(id));
  const available=known(entryOwnership(usable(bank,failures)),[...exposures,...frozen]);
  const nextByArea=new Map();
  for(let index=responses.length;index<plan.itemIds.length;index++)if(!nextByArea.has(schedule[index]))nextByArea.set(schedule[index],index);
  const counts=new Map();for(const r of responses)if(isEligibleLiteracyResponse(r))counts.set(r.skillId,(counts.get(r.skillId)||0)+1);
  const options=editable.map(index=>{
    const original=byId.get(plan.itemIds[index]),domain=schedule[index];
    // Route the next observation, rather than scheduling every remaining
    // question at the demand justified by one answer. Later placeholders keep
    // their band until they become that area's next observation.
    const demand=nextByArea.get(domain)===index?states[domain]:band(original);
    const pool=shuffleLiteracyMock(available.filter(q=>q.domainId===domain&&band(q)===demand),`${plan.seed}:${index}:${responses.length}:${demand}`);
    pool.sort((a,b)=>(counts.get(a.skillId)||0)-(counts.get(b.skillId)||0)||Number(b.id===original.id)-Number(a.id===original.id));
    return pool;
  });
  const selected=allocateIndependentItems(options,editable.map(i=>schedule[i]));
  if(!selected)throw capacityError('A fresh question at the appropriate demand is unavailable. Saved answers are safe.');
  const itemIds=[...plan.itemIds];editable.forEach((index,i)=>{itemIds[index]=selected[i].id;});return{...plan,itemIds};
}

/** Media/content repair keeps the already planned task, access and demand. */
export function repairLiteracyMockAreaPlan(bank,plan,responses=[],failures=[],_presentations=[],{exposures=[],content=false}={}) {
  void _presentations; // Keep the shared repair signature; every unaffected question is frozen below.
  const byId=new Map(bank.map(q=>[q.id,q])),failed=blocked(failures);
  const affected=plan.itemIds.flatMap((id,i)=>i>=responses.length&&(content?!isLiteracyItemEligible(byId.get(id)):failed(byId.get(id)))?[i]:[]);
  if(!affected.length)return{plan,unavailable:false};
  const slots=new Set(affected),frozen=plan.itemIds.filter((_,i)=>!slots.has(i)).map(id=>byId.get(id));
  const available=known(entryOwnership(usable(bank,failures)),[...exposures,...frozen]);
  const options=affected.map(index=>{const old=byId.get(plan.itemIds[index]);return shuffleLiteracyMock(available.filter(q=>band(q)===band(old)&&sameLiteracyMockTask(q,old,{includeLevel:true})),`${plan.seed}:${index}:repair`);});
  const selected=allocateIndependentItems(options);
  if(!selected)return{plan,unavailable:true};
  const itemIds=[...plan.itemIds];affected.forEach((index,i)=>{itemIds[index]=selected[i].id;});return{plan:{...plan,itemIds},unavailable:false};
}
