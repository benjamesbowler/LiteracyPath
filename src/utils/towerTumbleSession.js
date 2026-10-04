import { loadLearnGamesProgress, saveLearnGamesProgress } from './learnGamesProgress.js';
import { TOWER_TUMBLE_VERSION, TOWER_TUMBLE_LIVES, TOWER_TUMBLE_IMMUNITY_SECONDS, towerTumbleGeometry } from './towerTumbleRules.js';

export function saveTowerTumbleSession(scope, difficulty, state) {
  const current=loadLearnGamesProgress(scope), previous=current.games['tower-tumble'] || {};
  const next={...current,games:{...current.games,'tower-tumble':{...previous,practiceSession:{...(previous.practiceSession||{}),[difficulty]:{...state,version:TOWER_TUMBLE_VERSION,checkpointSemantics:'active-question-index'}}}}};
  try {saveLearnGamesProgress(scope,next);return {localSaved:true};}
  catch(error) {return {localSaved:Boolean(error.savedProgress)};}
}

export function loadTowerTumbleSession(scope,difficulty,seed,cursor,rounds,journeyIndex=0) {
  const value=loadLearnGamesProgress(scope).games['tower-tumble']?.practiceSession?.[difficulty];
  const lives=value?.lives===undefined?TOWER_TUMBLE_LIVES:value.lives,immunity=value?.immunity===undefined?0:value.immunity;
  if(!value || value.version!==TOWER_TUMBLE_VERSION || value.seed!==seed || value.journeyIndex!==journeyIndex || value.index!==cursor || !Number.isInteger(cursor) || !rounds[cursor]
    || value.roundId!==rounds[cursor].roundId || !['playing','rescue','retry'].includes(value.phase) || !Number.isInteger(value.unitIndex) || value.unitIndex<0 || value.unitIndex>rounds[cursor].chunks.length
    || !Number.isInteger(lives)||lives<0||lives>TOWER_TUMBLE_LIVES||!Number.isFinite(immunity)||immunity<0||immunity>TOWER_TUMBLE_IMMUNITY_SECONDS
    || (value.phase==='retry'&&lives!==0)||(value.phase!=='retry'&&lives===0)
    || !Array.isArray(value.supportReasons) || !Number.isInteger(value.mistakes) || value.mistakes<0 || value.mistakes>9999
    || !['pending','delivered','unavailable'].includes(value.delivery) || !Number.isFinite(value.score)
    || !Array.isArray(value.evidence?.firstResponses) || !Array.isArray(value.evidence?.assistedRetries) || !Array.isArray(value.evidence?.acceptedResponses) || !Array.isArray(value.evidence?.completions)
    || value.evidence.firstResponses.length>rounds.length*6 || value.evidence.assistedRetries.length>rounds.length*24
    || !value.actor || !Number.isFinite(value.actor.x) || !Number.isFinite(value.actor.y) || !Number.isFinite(value.actor.vy)
    || Math.abs(value.actor.x)>8.2 || value.actor.y < -2 || value.actor.y>12
    || !Number.isFinite(value.actor.safe?.x) || !Number.isFinite(value.actor.safe?.y)
    || Math.abs(value.actor.safe.x)>8.2 || value.actor.safe.y<0 || value.actor.safe.y>9.2
    || !Array.isArray(value.broken) || value.broken.length>2 || !Array.isArray(value.collected) || value.collected.length>2) return null;
  const byId=new Map(rounds.map((round,index)=>[round.roundId,{round,index}]));
  const valid=row=>{ const item=byId.get(row?.roundId);return item && item.index<=cursor && Number.isInteger(row.unitIndex) && row.unitIndex>=0 && row.unitIndex<item.round.chunks.length
    && row.responseId===`${row.roundId}:${row.unitIndex}` && row.expected===item.round.chunks[row.unitIndex] && item.round.choices.includes(row.selected)
    && row.correct===(row.selected===row.expected) && row.wordVisible===false && row.practiceOnly===true && Array.isArray(row.supportReasons)
    && (!row.independentEncodingPractice || (row.correct && row.deliveryAtResponse==='delivered' && row.pictureDelivery==='delivered' && !row.supportReasons.length));};
  if(!value.evidence.firstResponses.every(valid) || !value.evidence.assistedRetries.every(row=>valid(row)&&!row.independentEncodingPractice)
    || value.evidence.acceptedResponses.length>rounds.length*6 || !value.evidence.acceptedResponses.every(row=>valid(row)&&row.correct)
    || new Set(value.evidence.acceptedResponses.map(row=>row.responseId)).size!==value.evidence.acceptedResponses.length
    || new Set(value.evidence.firstResponses.map(row=>row.responseId)).size!==value.evidence.firstResponses.length
    || new Set(value.evidence.completions).size!==value.evidence.completions.length
    || value.evidence.completions.some(id=>!byId.has(id)||byId.get(id).index>cursor)
    || value.score!==value.evidence.completions.length*30
    || (value.phase==='rescue' && (value.unitIndex!==rounds[cursor].chunks.length||!value.evidence.completions.includes(value.roundId)))) return null;
  // Accepted units must be backed by genuine successful response records.
  const rows=[...value.evidence.firstResponses,...value.evidence.assistedRetries,...value.evidence.acceptedResponses];
  if(Array.from({length:value.unitIndex},(_,i)=>i).some(i=>!rows.some(row=>row.roundId===value.roundId&&row.unitIndex===i&&row.correct))) return null;
  if(value.evidence.completions.some(id=>byId.get(id).round.chunks.some((_,i)=>!rows.some(row=>row.roundId===id&&row.unitIndex===i&&row.correct)))) return null;
  const geometry=towerTumbleGeometry(rounds[cursor].tower,journeyIndex,difficulty,cursor);
  if(value.mapLayoutId!==undefined&&value.mapLayoutId!==geometry.layoutId)return null;
  for(const key of['falls','emptySwings','shortcuts','collectibles','barrelHits','routeRetries']){
    const count=value.evidence.motorEvents?.[key]??0;if(!Number.isInteger(count)||count<0||count>9999)return null;
  }
  return {...value,lives,immunity,mapLayoutId:geometry.layoutId};
}
