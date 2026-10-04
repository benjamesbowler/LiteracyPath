import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLetterLeapRounds, commitLetterLeapChoice, newLetterLeapEvidence } from '../../src/components/learn/games/games/letterLeapLearning.js';
import { loadLetterLeapSession, saveLetterLeapSession, validateLetterLeapSession, restoreLetterLeapWorld } from '../../src/components/learn/games/games/letterLeapSession.js';
import { LETTER_LEAP_CONTENT_VERSION } from '../../src/data/arcadeContentVersions.js';
const rounds=buildLetterLeapRounds(Array.from({length:10},()=>({mode:'letters',targets:['cat']})),'easy',41,2);
function template() {
  return {L:1500,flag:1400,pits:[[700,800]],sections:[{kind:1,left:500}],
    bubbles:[{x:250,y:274,ch:'C',word:0,order:0,decisionWord:0,decisionOrder:0,choiceId:'0:0',taken:false,cooldown:0},
      {x:420,y:274,ch:'A',word:-1,order:-1,decisionWord:0,decisionOrder:0,choiceId:'0:0',taken:false,cooldown:0}],
    blocks:[{x:600,y:182,w:44,h:40,type:'prize',used:false,broken:false}],
    plats:[{x:350,y:220,w:120},{x:600,y:240,w:100,baseX:600,baseY:240,move:{axis:'x',range:30,speed:1.2,t:0}}],
    coins:[{x:300,y:290,taken:false}],stars:[{x:650,y:200,taken:false}],springs:[{x:600,press:0}],
    pickups:[{x:800,y:172,taken:false}],foes:[{id:0,type:'walker',x:950,x0:900,x1:1000,y:300,baseY:300,dir:1,t:0}]};
}
function sample() {
  const round=rounds[0],evidence=commitLetterLeapChoice(newLetterLeapEvidence(),round,0,'C',['C','A'],{delivery:'unavailable',pictureDelivery:'unavailable'}).evidence;
  const level=template();level.bubbles.forEach(b=>{b.taken=true;});level.blocks[0].used=true;level.pickups.push({x:622,y:166,taken:false});
  level.plats[1].x=612;level.plats[1].move.t=.4;level.coins[0].taken=true;level.foes[0].x=961;level.foes[0].t=.2;
  return {version:LETTER_LEAP_CONTENT_VERSION,difficulty:'easy',seed:41,journeyIndex:2,phase:'playing',stage:0,leg:0,index:0,slot:1,
    score:10,wrongHits:0,coins:1,starTokens:0,hearts:3,queue:{startLevel:0,order:Array.from({length:10},(_,i)=>i),completed:[]},
    wrongCounts:{},supportReasons:{[round.roundId]:['mission-help']},evidence,
    world:{layoutWidth:600,groundY:320,level,cam:200,camY:0,invuln:.5,
      player:{x:620,y:217,w:32,h:46,vx:2,vy:0,onGround:true,face:1,anim:2,spawnX:500,squash:0,stoodIndex:1}}};
}

test('held first course, chosen prefix, support and arbitrary valid route state use the existing learner practiceSession',()=>{
  const prior=globalThis.window,map=new Map();globalThis.window={localStorage:{getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value)}};
  try {
    const value=sample();assert.equal(saveLetterLeapSession('leap-a','easy',value).localSaved,true);
    assert.deepEqual(loadLetterLeapSession('leap-a','easy',41,2,rounds),value);
    for(const [scope,difficulty,seed,journey] of [['leap-b','easy',41,2],['leap-a','medium',41,2],['leap-a','easy',42,2],['leap-a','easy',41,3]]) {
      assert.equal(loadLetterLeapSession(scope,difficulty,seed,journey,rounds),null);
    }
    assert.deepEqual([...map.keys()],['literacy-guide-learn-games:leap-a']);
  } finally {globalThis.window=prior;}
});

test('real viewport rebase retains bank positions, moving rider, prize result and patrol state',()=>{
  const value=sample(),evidence=structuredClone(value.evidence),base=template();
  for(const list of ['bubbles','blocks','plats','coins','stars','pickups','foes'])for(const item of base[list]){
    item.y+=180;if(item.baseY!==undefined)item.baseY+=180;
  }
  const restored=restoreLetterLeapWorld(base,value.world,500,rounds.filter(r=>r.stage===0),value.evidence);
  assert.ok(restored);assert.equal(restored.player.y,397);assert.equal(restored.player.stood,restored.level.plats[1]);
  assert.equal(restored.level.plats[1].x,612);assert.equal(restored.level.plats[1].y,420);
  assert.equal(restored.level.pickups[1].y,346);assert.equal(restored.level.blocks[0].used,true);
  assert.equal(restored.level.bubbles[0].taken,true);assert.equal(restored.level.bubbles[1].taken,false);assert.equal(restored.oldBankRetirementNormalized,1);
  assert.deepEqual(value.evidence,evidence);assert.equal(restored.level.coins[0].taken,true);assert.equal(restored.level.foes[0].x,961);
});

test('single-pickup saves preserve uncollected objects and prior credit does not collect a fresh catch-up object',()=>{
  const value=sample();value.world.level.bubbles[1].taken=false;
  const evidence=structuredClone(value.evidence),world=structuredClone(value.world);
  const restored=restoreLetterLeapWorld(template(),value.world,320,rounds.filter(r=>r.stage===0),value.evidence);
  assert.ok(restored);assert.equal(restored.oldBankRetirementNormalized,0);
  assert.deepEqual(restored.level.bubbles,value.world.level.bubbles.map(b=>({...b,touching:false})));
  assert.deepEqual(value.evidence,evidence);assert.deepEqual(value.world,world);
  value.world.level.bubbles[0].taken=false;
  const catchUp=restoreLetterLeapWorld(template(),value.world,320,rounds.filter(r=>r.stage===0),value.evidence);
  assert.ok(catchUp);assert.equal(catchUp.level.bubbles[0].taken,false,'historical learning is not proof that this physical object was collected in the resumed replay');
  assert.equal(catchUp.level.bubbles[1].taken,false);assert.deepEqual(value.evidence,evidence);
});

test('corrupt/stale credit, hidden prefix, world geometry and patrol paths fail closed',()=>{
  assert.ok(validateLetterLeapSession(sample(),'easy',41,2,rounds));
  for(const mutate of [s=>{s.seed=42;},s=>{s.version='old';},s=>{s.slot=2;},s=>{s.queue.completed=[0];},
    s=>{s.queue.order.push(0);},s=>{s.world.layoutWidth=Infinity;},s=>{s.evidence.firstResponses[0].independentEncodingPractice=true;}]) {
    const value=sample();mutate(value);assert.equal(validateLetterLeapSession(value,'easy',41,2,rounds),null);
  }
  for(const mutate of [s=>{s.level.bubbles[0].ch='X';},s=>{s.level.plats[1].x=20000;},s=>{s.level.foes[0].id=999;},
    s=>{s.player.x=NaN;},s=>{s.level.pickups[1].x=200;},s=>{s.level.blocks[0].type='other';}]) {
    const value=sample();mutate(value.world);assert.equal(restoreLetterLeapWorld(template(),value.world,320),null);
  }
  const value=sample();assert.equal(restoreLetterLeapWorld(template(),value.world,320,rounds.filter(r=>r.stage===0),newLetterLeapEvidence()),null,
    'a taken bank needs a genuine accepted learning response');
});

test('quota failure has no local receipt and preserves other scoped game/settings records on retry',()=>{
  const prior=globalThis.window,map=new Map();let blocked=true;
  const current={difficulty:'medium',soundEnabled:false,games:{other:{score:77},'letter-leap':{stars:2,checkpoints:{easy:{level:0}}}}};
  map.set('literacy-guide-learn-games:leap-a',JSON.stringify(current));
  globalThis.window={localStorage:{getItem:key=>map.get(key)||null,setItem:(key,value)=>{if(blocked)throw new Error('QuotaExceededError');map.set(key,value);}}};
  try {
    const held=sample(),before=structuredClone(held);assert.equal(saveLetterLeapSession('leap-a','easy',held).localSaved,false);
    assert.deepEqual(held,before);assert.deepEqual(JSON.parse(map.get('literacy-guide-learn-games:leap-a')),current);
    blocked=false;assert.equal(saveLetterLeapSession('leap-a','easy',held).localSaved,true);
    const saved=JSON.parse(map.get('literacy-guide-learn-games:leap-a'));
    assert.equal(saved.games.other.score,77);assert.equal(saved.games['letter-leap'].stars,2);assert.equal(saved.soundEnabled,false);
    assert.deepEqual(saved.games['letter-leap'].practiceSession.easy,held);
  }finally{globalThis.window=prior;}
});
