import { literacyMockBoundaryState as literacyMockBoundaryStateV9 } from '../policy/literacyMockBoundaryPolicy.js';
import { LITERACY_MOCK_AREA_MAX, LITERACY_MOCK_BAND_NAMES } from '../policy/literacyMockAdaptivePolicy.js';
import { LITERACY_MOCK_V9_AREA_VERSION } from '../policy/literacyMockBoundaryV9.js';
import { LITERACY_DOMAINS } from '../policy/literacyPracticePolicy.js';
import { evaluateLearningConclusion, LEARNING_CONCLUSION_SCOPES, LEARNING_STATUS_IDS } from '../policy/learningPolicy.js';
import { literacyMockTaskKey } from './literacyMockConditions.js';

const levelName = level => level === 1 ? 'Foundation' : level === 2 ? 'Challenge' : `Task level ${level}`;
const accuracy = responses => {
  const correct=responses.filter(row=>row.isCorrect===true).length;
  return {correct,answered:responses.length,percent:responses.length ? Math.round(correct/responses.length*100) : null};
};

/** Question demand and observed accuracy are separate; neither is an age, grade or calibrated scale score. */
export function literacyMockWorkingSummary(pupil, { domains=null, now=Date.now() }={}) {
  const source=(pupil?.responses || []).filter(row=>!domains || domains.includes(row.domainId));
  const independent=source.filter(row=>row.classification==='independent');
  const recent=independent.filter(row=>row.recent===true);
  const boundaryAdaptive=pupil?.boundaryAdaptive===true || ['literacy-mock-v9','literacy-mock-v10','literacy-mock-v11','literacy-mock-v12'].includes(pupil?.contentVersion)
    || source.some(row=>row.itemSnapshot?.adaptiveAreaVersion===LITERACY_MOCK_V9_AREA_VERSION);
  const areaAdaptive=pupil?.areaAdaptive===true || boundaryAdaptive;
  const boundaryStates=boundaryAdaptive ? literacyMockBoundaryStateV9(source,{contentVersion:pupil?.contentVersion}) : null;
  const boundaryAreas=boundaryStates ? Object.entries(boundaryStates).filter(([id])=>!domains || domains.includes(id))
    .map(([id,state])=>boundaryObservation(id,state,independent.filter(row=>row.domainId===id))) : [];
  const levels=areaAdaptive ? areaDemandRows(independent,domains?.length!==1) : [...new Set(independent.map(row=>Number(row.level)))].filter(Number.isFinite).sort((a,b)=>a-b).map(level=>{
    const rows=independent.filter(row=>Number(row.level)===level), current=recent.filter(row=>Number(row.level)===level);
    const currentAccuracy=accuracy(current);
    const conclusion=evaluateLearningConclusion({scope:LEARNING_CONCLUSION_SCOPES.GENERAL,
      attempts:current.length,skillDiversity:new Set(current.map(row=>row.skillId)).size,
      accuracy:currentAccuracy.percent,observedAt:current.map(row=>row.serverReceivedAt).sort().at(-1),now:new Date(now)});
    return {level,label:levelName(level),...accuracy(rows),current:currentAccuracy,conclusion};
  });
  // Keep demand-specific evidence separate. A raw mixed-difficulty percentage cannot choose a level.
  const supportedLevels=levels.filter(row=>row.conclusion.ready && [LEARNING_STATUS_IDS.SECURE,LEARNING_STATUS_IDS.DEVELOPING].includes(row.conclusion.status.id));
  const working=supportedLevels.at(-1);
  const foundation=levels.find(row=>row.level===1 && row.conclusion.ready);
  const latest=independent.at(-1);
  const oneArea=domains?.length===1;
  const lastSample=areaAdaptive && latest ? sampledTask(latest,pupil) : null;
  const stage=areaAdaptive ? {label:oneArea && lastSample ? `Last sampled: ${lastSample.bandLabel}` : independent.length ? 'Area-by-area profile' : 'Not measured yet',
    detail:oneArea && lastSample ? `${lastSample.historical ? `Historical sample from ${sampleDate(lastSample.observedAt)}. ` : ''}This is the demand of the last independent question, not an established working level.${lastSample.historical ? ' Collect a new independent sample for a current observation.' : ''}` : 'Each area adapts separately. Review its sampled questions and next teaching step; this sitting does not establish an overall level.',ready:false} : working ? {label:`${working.label} tasks`,detail:`${working.current.correct} of ${working.current.answered} recent ${working.label.toLowerCase()} answers correct.`,ready:true}
    : foundation ? {label:'Foundation tasks — revisit',detail:'Start with the foundation skills flagged below, then check a fresh example.',ready:true}
    : recent.length && levels.length>1 ? {label:'Mixed — confirm level',detail:'Foundation and challenge questions were sampled. More independent answers at a comparable demand are needed to choose a working level.',ready:false}
    : independent.length ? {label:'More evidence needed',detail:recent.length ? 'Keep the observed result; collect more independent answers before choosing a working level.' : 'This is an older result. Collect a fresh sample for a current working level.',ready:false}
    : {label:'Not measured yet',detail:'No independent scored answers with no recorded prior exposure have been received.',ready:false};
  const errors=new Map();
  for(const row of recent.filter(row=>row.isCorrect===false)) errors.set(row.skillId,(errors.get(row.skillId)||0)+1);
  const nextSkills=[...errors].sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0])).slice(0,3)
    .map(([id,count])=>({id,count,label:pupil?.skills?.find(skill=>skill.id===id)?.label || id}));
  const successes=new Map();
  for(const row of recent.filter(row=>row.isCorrect===true)) successes.set(row.skillId,(successes.get(row.skillId)||0)+1);
  const observedSuccess=[...successes].sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0])).slice(0,1)
    .map(([id,count])=>({id,count,label:pupil?.skills?.find(skill=>skill.id===id)?.label || id}))[0] ?? null;
  const helped=source.filter(row=>row.classification==='supported');
  const familiar=source.filter(row=>row.classification==='familiar');
  return {accuracy:accuracy(independent),stage,levels,lastSample,sampledTasks:areaAdaptive ? sampledTaskRows(independent,pupil) : [],
    boundaryAdaptive,boundaryAreas,boundaryObservation:domains?.length===1 ? boundaryAreas[0] ?? null : null,
    priorExposureUnknown:independent.filter(row=>row.knownFamiliar==null).length,observedSuccess,nextSkills,helped:accuracy(helped),familiar:accuracy(familiar),
    unscored:source.filter(row=>!['independent','supported','familiar'].includes(row.classification)).length,
    nextStep:nextSkills.length ? `Recheck ${nextSkills.map(skill=>skill.label.toLowerCase()).join(', ')} with fresh examples.`
      : independent.length ? 'Try fresh questions in the areas with the least evidence.' : 'Collect a first independent sample.'};
}

function boundaryObservation(domainId,state,independent) {
  const highest=LITERACY_MOCK_AREA_MAX[domainId];
  const bandName=band=>LITERACY_MOCK_BAND_NAMES[band] || 'Demand not recorded';
  const observed=state.correctByBand.map((correct,band)=>({band,correct,incorrect:state.incorrectByBand[band]}));
  const unsampledBands=observed.filter(row=>row.correct+row.incorrect===0).map(row=>({band:row.band,label:bandName(row.band)}));
  const historical=independent.length>0 && independent.every(row=>row.recent!==true);
  let label,detail;
  switch(state.stopReason){
    case 'ceiling_confirmed':
      label=`Repeated observations: ${bandName(highest)}`;
      detail=`${state.correctByBand[highest]} independent correct answers at this area's highest authored demand. This is a repeated task observation; it does not establish a working level or describe higher demands.`;
      break;
    case 'floor_confirmed':
      label='Repeated first-step errors';
      detail=`${state.incorrectByBand[0]} independent incorrect answers at First steps. Recheck the task and access conditions together, then choose what to teach. This does not establish an ability floor.`;
      break;
    case 'adjacent_boundary':{
      const {lowerBand,upperBand}=state.boundary;
      label=`Boundary observed: ${bandName(lowerBand)} / ${bandName(upperBand)}`;
      detail=`${state.correctByBand[lowerBand]} independent correct answers at ${bandName(lowerBand)} and ${state.incorrectByBand[upperBand]} independent incorrect answers at ${bandName(upperBand)}. Recheck these tasks with different examples; this is not an established working level.`;
      break;
    }
    case 'letter_limit':
      label='Letter sample limit reached — uncertain';
      detail='Lower print tasks stopped to preserve different letter targets for later sittings. The repeated-observation stopping rule was not met. Collect another comparable sample.';
      break;
    case 'budget_limit':
      label='Question limit reached — uncertain';
      detail='The area used its question budget before a repeated stopping pattern was observed. Recheck the sampled tasks with different examples.';
      break;
    case 'independent_followup_needed':
      label='Independent follow-up needed';
      detail='Two consecutive responses at the same demand could not count as independent evidence. Helped, familiar, skipped or unscored work cannot confirm a boundary. Check the task and access conditions together, then collect a new independent sample.';
      break;
    default:
      label=independent.length ? 'More observations needed' : 'No independent sample yet';
      detail='The repeated-observation stopping rule has not been met. Helped, familiar and unscored responses cannot confirm a boundary.';
  }
  return {...state,domainId,label,detail,unsampledBands,historical};
}

const sampleDate=value=>Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}) : 'a date that was not recorded';

function sampledTask(response,pupil) {
  const snapshot=response.itemSnapshot || {};
  const band=snapshot.adaptiveAreaBand;
  return {band,bandLabel:LITERACY_MOCK_BAND_NAMES[band] || 'Demand not recorded',
    skillId:response.skillId,skillLabel:pupil?.skills?.find(skill=>skill.id===response.skillId)?.label || response.skillId || 'Skill not recorded',
    operation:snapshot.adaptiveDemand?.operation || null,
    operationLabel:snapshot.adaptiveDemand?.requires || snapshot.constructClaim?.replaceAll('_',' ') || 'Task operation not recorded',
    construct:snapshot.constructClaim || null,observedAt:response.serverReceivedAt,historical:response.recent!==true,isCorrect:response.isCorrect};
}

// These are observations of the saved tasks, not bands attained by the learner.
// Keep different constructs and recorded access/administration conditions apart.
function sampledTaskRows(responses,pupil) {
  const groups=new Map();
  for(const row of responses){
    const task=sampledTask(row,pupil);
    const key=JSON.stringify([literacyMockTaskKey(row),task.band,task.operation,row.sourceWindowMode ?? null,row.sourceDurationSeconds ?? null,row.sourceTimeExtensionCount ?? null]);
    if(!groups.has(key))groups.set(key,{...task,id:key,rows:[]});
    groups.get(key).rows.push(row);
  }
  return [...groups.values()].map(({rows,...task})=>({...task,...accuracy(rows),incorrect:rows.filter(row=>row.isCorrect===false).length,
    currentAnswered:rows.filter(row=>row.recent===true).length,lastObservedAt:rows.at(-1)?.serverReceivedAt}));
}

export function literacyMockAccuracyText(value) {
  return value.percent===null ? 'No scored answers yet' : `${value.percent}% · ${value.correct} of ${value.answered} correct`;
}

function areaDemandRows(responses,includeDomain) {
  const groups=new Map();
  for(const row of responses){
    const band=row.itemSnapshot?.adaptiveAreaBand;
    if(!Number.isInteger(band))continue;
    const key=`${row.domainId}:${band}`;
    if(!groups.has(key))groups.set(key,{domainId:row.domainId,level:band,label:`${includeDomain ? `${LITERACY_DOMAINS.find(area=>area.id===row.domainId)?.label}: ` : ''}${LITERACY_MOCK_BAND_NAMES[band]}`,rows:[]});
    groups.get(key).rows.push(row);
  }
  return [...groups.values()].sort((a,b)=>a.domainId.localeCompare(b.domainId)||a.level-b.level).map(({rows,...group})=>({...group,...accuracy(rows),current:accuracy(rows.filter(row=>row.recent)),conclusion:{ready:false}}));
}
