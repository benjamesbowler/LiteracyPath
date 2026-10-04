import { getChildWordAsset } from '../data/childAssets.js';
import { getLedaWordAudioPath } from '../data/ledaProductionAudio.js';
import { hasKnownBadWordAudio, isKnownBadAudioPath } from '../data/knownBadWordAudio.js';
import { replayShuffle } from './gameReplay.js';
import { TOWER_TUMBLE_CONTENT_VERSION } from '../data/arcadeContentVersions.js';
import { worldForDifficulty } from './palWorlds.js';

export const TOWER_TUMBLE_VERSION = TOWER_TUMBLE_CONTENT_VERSION;
export const TOWER_TUMBLE_ROUNDS = 9;
export const TOWER_TUMBLE_STRIKE_SECONDS = .4;
export const TOWER_TUMBLE_CONTACT_SECONDS = .26;
export const TOWER_TUMBLE_LIVES = 3;
export const TOWER_TUMBLE_IMMUNITY_SECONDS = 2.4;

export function towerTumbleHammerAngle(remaining, facing=1) {
  if(remaining<=0)return -.28*facing;
  const phase=Math.max(0,Math.min(1,1-remaining/TOWER_TUMBLE_STRIKE_SECONDS));
  const angle=phase<.45?1.05+phase/.45*.55:phase<.65?1.6-(phase-.45)/.20*3.08:-1.48+(phase-.65)/.35*1.20;
  return angle*facing;
}
// These are authored grapheme divisions, not inferred syllables or letters.
const BANKS = {
  easy: ['cat', 'dog', 'sun', 'hat', 'bat', 'bed', 'bus', 'cup', 'bug', 'fox', 'map', 'pig', 'pan', 'net', 'mug', 'pot', 'jam'],
  medium: ['sh|i|p', 'f|i|sh', 's|o|ck', 'd|u|ck', 'r|o|ck', 'sh|e|ll', 'r|i|ng', 'b|a|th', 'ch|i|n', 'ch|o|p', 's|i|ng', 'k|i|ng', 'm|o|th'],
  hard: ['f|r|o|g', 'd|r|u|m', 'f|l|a|g', 'h|a|n|d', 't|e|n|t', 'm|i|l|k', 'l|a|m|p', 'n|e|s|t', 'b|r|u|sh', 'c|l|o|ck', 'p|l|a|n|t', 'b|e|n|ch', 's|t|a|m|p'],
};
const CONFUSIONS = { a: ['e','o'], e: ['i','a'], i: ['e','u'], o: ['u','a'], u: ['o','i'], sh: ['ch','th'], ch: ['sh','th'], th: ['sh','ch'], ck: ['k','ch'], ng: ['n','m'], ll: ['l','ss'], b: ['d','p'], d: ['b','t'], p: ['b','t'], t: ['d','p'], m: ['n','r'], n: ['m','ng'], f: ['v','s'], s: ['f','sh'], r: ['l','w'], l: ['r','w'], g: ['c','k'], c: ['k','g'], k: ['c','g'], h: ['f','th'], j: ['g','ch'] };

export function buildTowerTumbleRounds(difficulty = 'easy', seed = 0, journeyIndex = 0) {
  const band = BANKS[difficulty] || BANKS.easy;
  const pool = band.map(entry => {
    const chunks = entry.includes('|') ? entry.split('|') : [...entry];
    const word = chunks.join(''), asset = getChildWordAsset(word);
    const audio = getLedaWordAudioPath(word);
    return { word, chunks, image: asset?.image || '', audio: hasKnownBadWordAudio(word) || isKnownBadAudioPath(audio) ? '' : audio };
  }).filter(item => item.image);
  const key = `tower:${difficulty}:${seed}:${journeyIndex}`;
  return replayShuffle(pool, `${key}:deck`).slice(0,TOWER_TUMBLE_ROUNDS).map((item,index) => {
    const distractors = replayShuffle([...new Set(item.chunks.flatMap(chunk => CONFUSIONS[chunk] || ['s','m']))].filter(chunk => !item.chunks.includes(chunk)), `${key}:distractors:${index}`);
    const choices = replayShuffle([...new Set(item.chunks), ...distractors.slice(0, Math.max(3,7-new Set(item.chunks).size))].slice(0,8), `${key}:choices:${index}`);
    return { ...item, roundId: `${TOWER_TUMBLE_VERSION}:${difficulty}:${seed}:${journeyIndex}:${index}`, tower: Math.floor(index/3), routeIndex:index, choices,
      bricks: choices.map((chunk,i) => ({ id: `brick-${i}`, chunk, x: [-6,-2,2,6,-4,0,4,6][i], y: Math.floor(i/4)*3 })),
    };
  });
}

export function newTowerTumbleEvidence() { return { firstResponses: [], assistedRetries: [], acceptedResponses: [], completions: [], motorEvents: { falls: 0, emptySwings: 0, shortcuts: 0, collectibles: 0, barrelHits:0, routeRetries:0 } }; }

export function towerTumbleLoseLife(state,geometry) {
  if(state.phase!=='playing'||state.immunity>0||state.lives<=0)return state;
  const safe=state.actor.safe||{x:-7,y:0},level=geometry.platforms.find(p=>p.y===safe.y)||geometry.platforms[0];
  const x=Math.max(level.x-level.width/2+.7,Math.min(level.x+level.width/2-.7,safe.x));
  const lives=state.lives-1;
  return {...state,lives,immunity:TOWER_TUMBLE_IMMUNITY_SECONDS,phase:lives?'playing':'retry',
    actor:{...state.actor,x,y:level.y,vy:0,grounded:true,climbing:false,safe:{x,y:level.y}},
    evidence:{...state.evidence,motorEvents:{...state.evidence.motorEvents,barrelHits:(state.evidence.motorEvents.barrelHits||0)+1}}};
}

export function towerTumbleRetryRoute(state) {
  if(state.phase!=='retry'||state.lives!==0)return state;
  return {...state,lives:TOWER_TUMBLE_LIVES,immunity:TOWER_TUMBLE_IMMUNITY_SECONDS,phase:'playing',
    evidence:{...state.evidence,motorEvents:{...state.evidence.motorEvents,routeRetries:(state.evidence.motorEvents.routeRetries||0)+1}}};
}

// Stop beside the selected masonry face, preserving its silhouette and keeping
// adjacent bricks outside the nearest-target strike. This only steers an
// explicitly selected response; it never selects a curriculum answer.
export function towerTumbleApproachX(bricks, target) {
  const gap=Math.min(...bricks.filter(brick=>brick.y===target.y&&brick.id!==target.id).map(brick=>Math.abs(brick.x-target.x)));
  return Math.max(-7.55,target.x-Math.min(1.1,gap*.4));
}

export function commitTowerTumbleStrike(evidence, round, unitIndex, chunk, context = {}) {
  if (!round.choices.includes(chunk) || unitIndex < 0 || unitIndex >= round.chunks.length) return null;
  const responseId = `${round.roundId}:${unitIndex}`;
  const first = !evidence.firstResponses.some(row => row.responseId === responseId);
  const correct = chunk === round.chunks[unitIndex];
  const supportReasons = [...new Set(context.supportReasons || [])];
  const response = { responseId, roundId: round.roundId, unitIndex, selected: chunk, expected: round.chunks[unitIndex], correct,
    wordVisible: false, pictureDelivery: context.pictureDelivery || 'pending', deliveryAtResponse: context.delivery || 'pending',
    stimulusDelivered: context.delivery === 'delivered', supportReasons, independentEncodingPractice: first && correct && context.delivery === 'delivered' && context.pictureDelivery === 'delivered' && !supportReasons.length,
    construct: 'heard-word-grapheme-encoding', practiceOnly: true };
  const finished = correct && unitIndex === round.chunks.length-1;
  return { correct, first, finished, response, evidence: { ...evidence,
    firstResponses: first ? [...evidence.firstResponses,response] : evidence.firstResponses,
    assistedRetries: first ? evidence.assistedRetries : [...evidence.assistedRetries,{...response,independentEncodingPractice:false}].slice(-TOWER_TUMBLE_ROUNDS*24),
    // Keep one real successful response per unit when the bounded retry log
    // ages out. A long retry must not erase proof of earlier accepted work.
    acceptedResponses: correct && !(evidence.acceptedResponses||[]).some(row=>row.responseId===responseId)
      ? [...(evidence.acceptedResponses||[]),response] : (evidence.acceptedResponses||[]),
    completions: finished && !evidence.completions.includes(round.roundId) ? [...evidence.completions,round.roundId] : evidence.completions,
  } };
}

// Staircase routes, alternate ladders and breakable scenery are separate from
// the spelling deck. Motor assistance changes movement, never these choices.
export function towerTumbleGeometry(tower = 0, journeyIndex = 0, difficulty = 'easy', routeIndex = tower*3) {
  const variant = (tower + journeyIndex) % 3;
  const slot=routeIndex%3,routeVariant=(variant+slot)%3,shift=slot===1?.45:slot===2?-.5:0;
  const world = worldForDifficulty(difficulty).id;
  const names = { meadow: ['Meadow Mill','Treetop Workshop','Cloud Crane'], dino: ['Fossil Scaffold','Jungle Lookout','Volcano Quarry'], moonwood: ['Lantern Mill','Mushroom Workshop','Star Crane'] };
  return { variant, world, layoutId:`${world}:${journeyIndex}:${tower}:${slot}`,routeIndex,routeShift:shift,name: names[world][tower % 3],
    platforms: [{ x:0,y:0,width:17 },{ x:slot===1?-.35:slot===2?.35:0,y:3,width:slot===1?16.6:slot===2?15.8:16 },{ x:-1+shift,y:6,width:slot===1?14.6:slot===2?14.4:14 },{ x:1-shift,y:9,width:slot===1?13.6:slot===2?13.2:13 }],
    ladders: [{x:(routeVariant===1?-5:6)+shift,bottom:0,top:3},{x:(routeVariant===2?5:-6)+shift,bottom:3,top:6},{x:(routeVariant===1?-4:5)+shift,bottom:6,top:9}],
    shortcuts: [{id:'wall-low',x:(routeVariant===1?-4:4)+shift,y:0},{id:'wall-high',x:(routeVariant===2?3:-3)+shift,y:3}],
    movingPlatform: { x: routeVariant===1?-8:8,y:1.5,bottom:0,top:6 },
    collectibles: [{id:'acorn-high',x:slot===1?3.3:-4+shift,y:6.55},{id:'acorn-top',x:slot===2?-3.8:4-shift,y:9.55}],
  };
}

export function towerTumbleStep(actor, input, geometry, dt, { assist = true } = {}) {
  const delta = Math.min(0.05,Math.max(0,dt)), next = { ...actor };
  const axis = (input.right?1:0)-(input.left?1:0), vertical=(input.up?1:0)-(input.down?1:0);
  if (axis) next.facing=axis;
  next.x=Math.max(-8.15,Math.min(8.15,next.x+axis*5.2*delta));
  const ladder=geometry.ladders.find(item => Math.abs(next.x-item.x)<(assist?1.15:.7) && next.y>=item.bottom-.3 && next.y<=item.top+.3
    && (vertical>0?next.y<item.top:vertical<0?next.y>item.bottom:true));
  if (vertical && ladder) {
    next.x=ladder.x; next.y=Math.max(ladder.bottom,Math.min(ladder.top,next.y+vertical*4.3*delta));
    next.vy=0; next.climbing=true; next.grounded=false;
    if (next.y===ladder.bottom || next.y===ladder.top) {next.grounded=true;next.climbing=false;next.safe={x:next.x,y:next.y};}
    return next;
  }
  if (next.climbing && !axis && !input.jump) return next;
  next.climbing=false;
  if (input.jump && next.grounded) {next.vy=9.6;next.grounded=false;}
  const before=next.y; next.vy=(next.vy||0)-24*delta; next.y+=next.vy*delta; next.grounded=false;
  for(const platform of geometry.platforms) {
    if(next.vy<=0 && before>=platform.y-.06 && next.y<=platform.y && Math.abs(next.x-platform.x)<=platform.width/2) {
      next.y=platform.y;next.vy=0;next.grounded=true;next.safe={x:next.x,y:next.y};break;
    }
  }
  if(next.y < -2) { next.x=next.safe?.x||-7;next.y=next.safe?.y||0;next.vy=0;next.grounded=true;next.fell=true; }
  else next.fell=false;
  return next;
}
