import { LETTER_LEAP_CONTENT_VERSION } from '../../../../data/arcadeContentVersions.js';
import { loadLearnGamesProgress, saveLearnGamesProgress } from '../../../../utils/learnGamesProgress.js';
import { validLetterLeapEvidence } from './letterLeapLearning.js';

const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const finite = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
const reasons = value => Array.isArray(value) && value.length <= 24 && value.every(reason => typeof reason === 'string' && reason.length <= 80);

export function validateLetterLeapSession(value, difficulty, seed, journeyIndex, rounds) {
  if (!value || value.version !== LETTER_LEAP_CONTENT_VERSION || value.difficulty !== difficulty || value.seed !== seed || value.journeyIndex !== journeyIndex
    || !['playing','word-result','stage-result','retry-stage','complete'].includes(value.phase)
    || !integer(value.stage,0,9) || !integer(value.leg,0,30) || !integer(value.index,0,30)
    || !integer(value.slot,0,40) || !integer(value.score,0,10000000) || !integer(value.wrongHits,0,100000)
    || !integer(value.coins,0,100000) || !integer(value.starTokens,0,1000) || !integer(value.hearts,0,5)
    || !value.queue || !integer(value.queue.startLevel,0,9) || !Array.isArray(value.queue.order) || !Array.isArray(value.queue.completed)
    || !value.world || !finite(value.world.layoutWidth,120,2560)
    || (value.world.decorativeClockMs !== undefined && !finite(value.world.decorativeClockMs,0,100000000))
    || !value.wrongCounts || !value.supportReasons || !validLetterLeapEvidence(value.evidence,rounds)) return null;
  const all = [...value.queue.order,...value.queue.completed];
  if (all.length !== 10-value.queue.startLevel || new Set(all).size !== all.length
    || all.some(stage => !integer(stage,value.queue.startLevel,9))) return null;
  const byId = new Map(rounds.map(round => [round.roundId,round]));
  const current = rounds.find(round => round.stage===value.stage && round.leg===value.leg && round.index===value.index);
  if (!current || value.slot>current.units.length
    || (['playing','word-result'].includes(value.phase) && value.hearts < 1)
    || Object.entries(value.wrongCounts).some(([id,count])=>!byId.has(id)||!integer(count,0,100000))
    || Object.entries(value.supportReasons).some(([id,support])=>!byId.has(id)||!reasons(support))
    || value.evidence.firstResponses.some(row=>byId.get(row.roundId).stage<value.queue.startLevel)
    || value.evidence.completions.some(id=>byId.get(id).stage<value.queue.startLevel)
    || Array.from({length:value.slot},(_,slot)=>`${current.roundId}:${slot}`).some(id=>!value.evidence.acceptedResponses.some(row=>row.responseId===id))
    || rounds.some(round=>round.stage===value.stage && (round.leg<value.leg || (round.leg===value.leg && round.index<value.index))
      && !value.evidence.completions.includes(round.roundId))) return null;
  if (value.queue.completed.some(stage=>rounds.some(round=>round.stage===stage&&!value.evidence.completions.includes(round.roundId)))) return null;
  if (['playing','word-result'].includes(value.phase) && value.queue.order[0]!==value.stage) return null;
  if (value.phase==='word-result' && (value.slot!==current.units.length || !value.evidence.completions.includes(current.roundId))) return null;
  if (value.phase==='stage-result' && !value.queue.completed.includes(value.stage)) return null;
  if (value.phase==='complete' && (value.queue.order.length || value.queue.completed.length!==10-value.queue.startLevel)) return null;
  return value;
}

export function wasLetterLeapPickupCollected(bubble, rounds, evidence) {
  const round=rounds.find(item=>item.index===bubble.decisionWord);
  return Boolean(bubble.word>=0 && round && evidence?.acceptedResponses.some(row=>row.correct
    && row.responseId===`${round.roundId}:${bubble.decisionOrder}` && row.selected===bubble.ch));
}

export function restoreLetterLeapWorld(template, saved, currentGround, rounds = [], evidence = null) {
  if (!saved || !finite(saved.groundY,30,1600) || !saved.level || saved.level.L!==template.L || saved.level.flag!==template.flag
    || !finite(saved.cam,0,template.L) || !finite(saved.camY,-2048,0) || !finite(saved.invuln,0,2)
    || !saved.player || !finite(saved.player.x,0,template.L) || !finite(saved.player.y-saved.groundY,-2048,512)
    || !finite(saved.player.vx,-6,6) || !finite(saved.player.vy,-24,20) || saved.player.h!==46 || saved.player.w!==32
    || ![-1,1].includes(saved.player.face) || typeof saved.player.onGround!=='boolean'
    || !finite(saved.player.spawnX,0,template.L) || !finite(saved.player.anim,0,1000000) || !finite(saved.player.squash,-1,1)
    || (saved.player.feedback !== undefined && !['hurt','correct','summit'].includes(saved.player.feedback))
    || (saved.player.feedbackTime !== undefined && !finite(saved.player.feedbackTime,0,2.4))) return null;
  const delta = currentGround-saved.groundY;
  const same = (a,b,keys) => keys.every(key=>key==='y'||key==='baseY' ? Math.abs(a[key]+delta-b[key])<.001 : JSON.stringify(a[key])===JSON.stringify(b[key]));
  const lists = ['bubbles','blocks','plats','coins','stars','springs'];
  if (lists.some(key=>!Array.isArray(saved.level[key])||saved.level[key].length!==template[key].length)
    || JSON.stringify(saved.level.pits)!==JSON.stringify(template.pits) || JSON.stringify(saved.level.sections)!==JSON.stringify(template.sections)
    || !Array.isArray(saved.level.pickups) || saved.level.pickups.length>template.pickups.length+template.blocks.length
    || !Array.isArray(saved.level.foes) || saved.level.foes.length>template.foes.length) return null;
  const level = structuredClone(template);
  let oldBankRetirementNormalized = 0;
  for (let i=0;i<level.bubbles.length;i++) {
    const a=saved.level.bubbles[i],b=level.bubbles[i];
    if (!same(a,b,['x','y','ch','word','order','decisionWord','decisionOrder','choiceId']) || typeof a.taken!=='boolean'
      || !finite(a.cooldown??0,0,1.5)) return null;
    const round = rounds.find(item=>item.index===b.decisionWord);
    if (a.taken && evidence && (!round || !evidence.acceptedResponses.some(row=>row.responseId===`${round.roundId}:${b.decisionOrder}`))) return null;
    // Earlier v2 saves retired both members of an answered bank. A genuine
    // accepted slot permits that old record, but only the selected target is
    // collected. Restoring its uncollected neighbour creates no response.
    b.taken=a.taken && (evidence ? wasLetterLeapPickupCollected(b,rounds,evidence) : true);
    if(a.taken && !b.taken)oldBankRetirementNormalized++;
    b.touching=false;b.cooldown=a.cooldown||0;
  }
  for (let i=0;i<level.blocks.length;i++) {
    const a=saved.level.blocks[i],b=level.blocks[i];
    if (!same(a,b,['x','y','w','h','type']) || typeof a.broken!=='boolean' || typeof a.used!=='boolean'
      || (a.broken&&a.type!=='brick') || (a.used&&a.type!=='prize')) return null;
    b.broken=a.broken;b.used=a.used;
  }
  for (const key of ['coins','stars']) for (let i=0;i<level[key].length;i++) {
    const a=saved.level[key][i],b=level[key][i];
    if (!same(a,b,['x','y'])||typeof a.taken!=='boolean')return null;
    b.taken=a.taken;
  }
  for (let i=0;i<level.plats.length;i++) {
    const a=saved.level.plats[i],b=level.plats[i];
    if (a.w!==b.w || Boolean(a.move)!==Boolean(b.move)) return null;
    if (b.move) {
      if (!same(a,b,['baseX','baseY']) || a.move.axis!==b.move.axis || a.move.range!==b.move.range || a.move.speed!==b.move.speed
        || !finite(a.move.t,0,100000) || !finite(a.x,b.baseX-b.move.range-1,b.baseX+b.move.range+1)
        || !finite(a.y+delta,b.baseY-b.move.range-1,b.baseY+b.move.range+1))return null;
      b.x=a.x;b.y=a.y+delta;b.prevX=a.x;b.prevY=b.y;b.move.t=a.move.t;
    } else if (!same(a,b,['x','y']))return null;
  }
  for (let i=0;i<level.springs.length;i++) {
    const a=saved.level.springs[i],b=level.springs[i];
    if (a.x!==b.x||!finite(a.press,0,.5))return null;
    b.press=a.press;
  }
  const pickups=[],pickupPositions=new Set();
  for (let i=0;i<saved.level.pickups.length;i++) {
    const a=saved.level.pickups[i],b=level.pickups[i];
    const position=`${a?.x}:${a?.y}`;
    if (!a||typeof a.taken!=='boolean'||pickupPositions.has(position))return null;
    if (b ? !same(a,b,['x','y']) : !level.blocks.some(block=>block.used&&a.x===block.x+block.w/2&&Math.abs(a.y+delta-(block.y-16))<.001))return null;
    pickups.push({x:a.x,y:a.y+delta,taken:a.taken});
    pickupPositions.add(position);
  }
  level.pickups=pickups;
  const seenFoes=new Set(),foes=[];
  for (const a of saved.level.foes) {
    const b=level.foes.find(foe=>foe.id===a.id);
    if (!b||seenFoes.has(a.id)||!same(a,b,['type','x0','x1','baseY'])||!finite(a.x,b.x0-100,b.x1+100)
      || !finite(a.y+delta,b.baseY-90,b.baseY+2)||!finite(a.t,0,100000)||![-1,1].includes(a.dir))return null;
    seenFoes.add(a.id);foes.push({...b,x:a.x,y:a.y+delta,t:a.t,dir:a.dir});
  }
  level.foes=foes;
  const player={...saved.player,y:saved.player.y+delta,stood:null};
  if (integer(saved.player.stoodIndex,0,level.plats.length-1))player.stood=level.plats[saved.player.stoodIndex];
  return {level,player,cam:saved.cam,camY:saved.camY,invuln:saved.invuln,oldBankRetirementNormalized};
}

export function loadLetterLeapSession(scope,difficulty,seed,journeyIndex,rounds) {
  return validateLetterLeapSession(loadLearnGamesProgress(scope).games['letter-leap']?.practiceSession?.[difficulty],difficulty,seed,journeyIndex,rounds);
}

export function saveLetterLeapSession(scope,difficulty,state) {
  const current=loadLearnGamesProgress(scope),previous=current.games['letter-leap']||{};
  const next={...current,games:{...current.games,'letter-leap':{...previous,practiceSession:{...(previous.practiceSession||{}),[difficulty]:{...state,version:LETTER_LEAP_CONTENT_VERSION,difficulty}}}}};
  try {saveLearnGamesProgress(scope,next);return {localSaved:true,syncPending:false};}
  catch(error){return {localSaved:Boolean(error.savedProgress),syncPending:Boolean(error.savedProgress)};}
}
