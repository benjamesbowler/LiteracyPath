import { LITERACY_MOCK_BAND_NAMES } from '../policy/literacyMockAdaptivePolicy.js';
import { LITERACY_DOMAINS } from '../policy/literacyPracticePolicy.js';
import { evaluateLearningConclusion, LEARNING_CONCLUSION_SCOPES, LEARNING_STATUS_IDS } from '../policy/learningPolicy.js';

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
  const areaAdaptive=pupil?.areaAdaptive===true;
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
  const latest=recent.at(-1);
  const oneArea=domains?.length===1;
  const stage=areaAdaptive ? {label:oneArea && latest ? `Last sampled: ${LITERACY_MOCK_BAND_NAMES[latest.itemSnapshot?.adaptiveAreaBand]}` : independent.length ? 'Area-by-area profile' : 'Not measured yet',
    detail:oneArea ? 'This is the demand of the last independent question, not an established working level.' : 'Each area adapts separately. Review its sampled questions and next teaching step; this sitting does not establish an overall level.',ready:false} : working ? {label:`${working.label} tasks`,detail:`${working.current.correct} of ${working.current.answered} recent ${working.label.toLowerCase()} answers correct.`,ready:true}
    : foundation ? {label:'Foundation tasks — revisit',detail:'Start with the foundation skills flagged below, then check a fresh example.',ready:true}
    : recent.length && levels.length>1 ? {label:'Mixed — confirm level',detail:'Foundation and challenge questions were sampled. More independent answers at a comparable demand are needed to choose a working level.',ready:false}
    : independent.length ? {label:'More evidence needed',detail:recent.length ? 'Keep the observed result; collect more independent answers before choosing a working level.' : 'This is an older result. Collect a fresh sample for a current working level.',ready:false}
    : {label:'Not measured yet',detail:'No independent, fresh scored answers have been received.',ready:false};
  const errors=new Map();
  for(const row of recent.filter(row=>row.isCorrect===false)) errors.set(row.skillId,(errors.get(row.skillId)||0)+1);
  const nextSkills=[...errors].sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0])).slice(0,3)
    .map(([id,count])=>({id,count,label:pupil?.skills?.find(skill=>skill.id===id)?.label || id}));
  const helped=source.filter(row=>row.classification==='supported');
  const familiar=source.filter(row=>row.classification==='familiar');
  return {accuracy:accuracy(independent),stage,levels,nextSkills,helped:accuracy(helped),familiar:accuracy(familiar),
    unscored:source.filter(row=>!['independent','supported','familiar'].includes(row.classification)).length,
    nextStep:nextSkills.length ? `Recheck ${nextSkills.map(skill=>skill.label.toLowerCase()).join(', ')} with fresh examples.`
      : independent.length ? 'Try fresh questions in the areas with the least evidence.' : 'Collect a first independent sample.'};
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
