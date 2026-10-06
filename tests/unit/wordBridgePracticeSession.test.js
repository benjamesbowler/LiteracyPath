import test from 'node:test';
import assert from 'node:assert/strict';
import {buildWordBridgeRounds,commitWordBridgePlacement,newWordBridgeEvidence} from '../../src/components/learn/games/games/wordBridgeLearning.js';
import {validateWordBridgePracticeSession} from '../../src/components/learn/games/games/wordBridgePracticeSession.js';
import {WORD_BRIDGE_CONTENT_VERSION,WORD_BRIDGE_LEGACY_CONTENT_VERSION} from '../../src/data/arcadeContentVersions.js';
import {releaseWordBridgePhysicalPiece} from '../../src/components/learn/games/games/wordBridgePieceOwnership.js';

const level={target:'COOK',units:['C','O','O','K'],mode:'word',pals:2,tiles:[
  {glyph:'C',correct:true,order:0},{glyph:'O',correct:true,order:1},{glyph:'O',correct:true,order:2},{glyph:'K',correct:true,order:3},{glyph:'X',correct:false,order:-1}
]};
const rounds=buildWordBridgeRounds(Array.from({length:10},()=>level),'easy',5,0);
function snapshot(evidence=newWordBridgeEvidence(),carryingId=null){
  const accepted=evidence.acceptedResponses.filter(row=>row.stage===0);
  return {version:WORD_BRIDGE_CONTENT_VERSION,difficulty:'easy',seed:5,journeyIndex:0,originStage:0,stage:0,phase:'PLAYING',score:20,wordsDone:0,levelMistakes:0,stageStars:[],phaseTimer:0,patienceLeft:30,sceneTime:8,supportReasons:{},evidence,
    world:{width:1600,ground:700,camera:280,builder:{x:710,facing:-1,anim:3,carryingId},
      tiles:rounds[0].tiles.map(tile=>({physicalId:tile.id,glyph:tile.glyph,x:140+tile.id*90,y:650,placed:accepted.some(row=>row.tileId===tile.id)||tile.id===carryingId,lost:false,returnT:0,localReturn:false})),
      slots:rounds[0].units.map((_,slot)=>{const row=accepted.find(row=>row.slot===slot);return{filled:Boolean(row),placedGlyph:row?.selected||'',snap:0};}),
      pals:[{x:30,state:'waiting',t:0,speed:220},{x:70,state:'waiting',t:1,speed:230}]}};
}
const validate=s=>validateWordBridgePracticeSession(s,'easy',5,0,rounds);

test('partial repeated pieces and a carried piece resume without merging their physical identities',()=>{
  let evidence=commitWordBridgePlacement(newWordBridgeEvidence(),rounds[0],2,1,{delivery:'unavailable',responseAt:10}).evidence;
  evidence=commitWordBridgePlacement(evidence,rounds[0],1,2,{delivery:'unavailable',responseAt:20}).evidence;
  const original=snapshot(evidence,3),restored=validate(original);assert.ok(restored);
  assert.equal(restored.world.builder.carryingId,3);assert.deepEqual(restored.world.slots.map(s=>s.filled),[false,true,true,false]);
  restored.world.tiles[0].x=999;restored.evidence.firstResponses[0].selected='X';assert.equal(original.world.tiles[0].x,140);assert.equal(original.evidence.firstResponses[0].selected,'O');
});

test('save validation rejects fabricated bridge slots, duplicate pieces and an accepted piece held again',()=>{
  const original=snapshot();original.world.slots[0]={filled:true,placedGlyph:'C',snap:0};assert.equal(validate(original),null);
  const duplicate=snapshot();duplicate.world.tiles[1].physicalId=0;assert.equal(validate(duplicate),null);
  const earned=commitWordBridgePlacement(newWordBridgeEvidence(),rounds[0],0,0,{delivery:'unavailable',responseAt:10}).evidence;
  assert.equal(validate(snapshot(earned,0)),null);
  const missingPal=snapshot();missingPal.world.pals.pop();assert.equal(validate(missingPal),null);
});

test('crossing recovery is an earned full bridge and cannot fabricate earlier courses or alter the selected seed',()=>{
  let evidence=newWordBridgeEvidence();for(let i=0;i<4;i++)evidence=commitWordBridgePlacement(evidence,rounds[0],i,i,{delivery:'unavailable',responseAt:10+i}).evidence;
  const crossing=snapshot(evidence);crossing.phase='PALS_CROSSING';crossing.world.pals[0].state='walking';crossing.world.pals[0].x=900;assert.ok(validate(crossing));
  const complete=structuredClone(crossing);complete.phase='LEVEL_COMPLETE';complete.stageStars=[2];complete.wordsDone=1;assert.ok(validate(complete));
  const fake=structuredClone(complete);fake.wordsDone=2;assert.equal(validate(fake),null);
  assert.equal(validateWordBridgePracticeSession(complete,'easy',6,0,rounds),null);
});

test('Bridge v3 saves use canonical uint32 seeds while original v2 keeps its already-valid legacy seed range',()=>{
  for(const version of [WORD_BRIDGE_CONTENT_VERSION,WORD_BRIDGE_LEGACY_CONTENT_VERSION])for(const seed of [0,0x80000000,0xffffffff,Number.MAX_SAFE_INTEGER]){
    const value=snapshot();value.seed=seed;value.version=version;
    const actualRounds=buildWordBridgeRounds(Array.from({length:10},()=>level),'easy',seed,0,version);
    const valid=validateWordBridgePracticeSession(value,'easy',seed,0,actualRounds,version);
    assert.equal(Boolean(valid),version===WORD_BRIDGE_LEGACY_CONTENT_VERSION||seed<=0xffffffff);
  }
  for(const seed of [-1,.5,Infinity,Number.MAX_SAFE_INTEGER+1]){
    const value=snapshot();value.seed=seed;
    assert.equal(validateWordBridgePracticeSession(value,'easy',seed,0,rounds),null);
  }
  for(const journeyIndex of [-1,.5,12]){
    const value=snapshot();value.journeyIndex=journeyIndex;
    assert.equal(validateWordBridgePracticeSession(value,'easy',5,journeyIndex,rounds),null);
  }
});

test('a genuine placement followed by a loose drop keeps the strict original save version and earned response on reload',()=>{
  const evidence=commitWordBridgePlacement(newWordBridgeEvidence(),rounds[0],0,0,{delivery:'unavailable',responseAt:10}).evidence;
  const carriedSave=snapshot(evidence,4),before=structuredClone(carriedSave);
  assert.ok(validate(carriedSave),'the same original version admits a real carried piece');
  const live=carriedSave.world.tiles.map(tile=>({...rounds[0].tiles.find(source=>source.id===tile.physicalId),...tile}));
  const released=releaseWordBridgePhysicalPiece(live,{...live.find(tile=>tile.physicalId===4),sourceIndex:4},{x:710,y:671,localReturn:true});
  assert.ok(released);
  carriedSave.world.tiles=released.tiles.map(({physicalId,glyph,x,y,placed,lost,returnT,localReturn})=>
    ({physicalId,glyph,x,y,placed,lost,returnT,localReturn}));
  carriedSave.world.builder.carryingId=null;
  const restored=validate(carriedSave);
  assert.ok(restored,'the actual single-owner drop passes the unchanged strict session validator');
  assert.equal(restored.version,before.version);
  assert.equal(restored.world.tiles.length,rounds[0].tiles.length);
  assert.deepEqual(restored.world.tiles.find(tile=>tile.physicalId===4),{physicalId:4,glyph:'X',x:710,y:671,placed:false,lost:false,returnT:0,localReturn:true});
  assert.deepEqual(restored.evidence,before.evidence,'motor-only release preserves every immutable language prefix');
  assert.equal(restored.world.slots[0].filled,true);
  assert.equal(before.world.builder.carryingId,4,'the prior carried snapshot remains immutable');
  const invalid=structuredClone(carriedSave);invalid.world.tiles.push({...invalid.world.tiles[4]});
  assert.equal(validate(invalid),null,'duplicate old/corrupt records are never silently admitted');
});

test('matching revision retains every old v2 physical owner and immutable prefix; v3, mixed rows and unknown versions cannot reinterpret it',()=>{
  const oldRounds=buildWordBridgeRounds(Array.from({length:10},()=>level),'easy',5,0,WORD_BRIDGE_LEGACY_CONTENT_VERSION);
  const evidence=commitWordBridgePlacement(newWordBridgeEvidence(),oldRounds[0],0,0,{responseAt:10,delivery:'unavailable'}).evidence;
  const held=snapshot();held.version=WORD_BRIDGE_LEGACY_CONTENT_VERSION;held.evidence=evidence;
  held.world.tiles[0].placed=true;held.world.slots[0]={filled:true,placedGlyph:'C',snap:0};
  held.world.builder.carryingId=2;held.world.tiles[2].placed=true;held.world.tiles[4].localReturn=true;held.world.tiles[4].x=711;held.world.tiles[4].y=671;
  const original=structuredClone(held);
  assert.deepEqual(validateWordBridgePracticeSession(held,'easy',5,0,oldRounds,WORD_BRIDGE_LEGACY_CONTENT_VERSION),original);
  assert.equal(validateWordBridgePracticeSession(held,'easy',5,0,rounds),null);
  const changed=structuredClone(held);changed.version=WORD_BRIDGE_CONTENT_VERSION;
  assert.equal(validateWordBridgePracticeSession(changed,'easy',5,0,rounds),null,'old evidence round IDs cannot acquire new target semantics');
  const unknown=structuredClone(held);unknown.version='word-bridge-v4';
  assert.equal(validateWordBridgePracticeSession(unknown,'easy',5,0,oldRounds,'word-bridge-v4'),null);
  const mismatched=buildWordBridgeRounds(Array.from({length:10},()=>level),'easy',6,0,WORD_BRIDGE_LEGACY_CONTENT_VERSION);
  assert.equal(validateWordBridgePracticeSession(held,'easy',5,0,mismatched,WORD_BRIDGE_LEGACY_CONTENT_VERSION),null);
});
