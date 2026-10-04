import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTowerTumbleRounds, commitTowerTumbleStrike, newTowerTumbleEvidence, towerTumbleApproachX, towerTumbleGeometry, towerTumbleHammerAngle, towerTumbleStep, towerTumbleLoseLife, towerTumbleRetryRoute, TOWER_TUMBLE_LIVES, TOWER_TUMBLE_IMMUNITY_SECONDS, TOWER_TUMBLE_CONTACT_SECONDS, TOWER_TUMBLE_STRIKE_SECONDS } from '../../src/utils/towerTumbleRules.js';
import { physicalPalFrame } from '../../src/components/learn/games/shared/physicalPalArt.js';

test('all difficulties and all twelve journeys have nine image/audio encounters with reproducible shuffled choices',()=>{
  for(const difficulty of ['easy','medium','hard']){
    const signatures=[];
    for(let chapter=0;chapter<12;chapter++){
      const deck=buildTowerTumbleRounds(difficulty,9824,chapter);
      assert.equal(deck.length,9);assert.equal(new Set(deck.map(r=>r.word)).size,9);
      assert.deepEqual(deck,buildTowerTumbleRounds(difficulty,9824,chapter));
      signatures.push(deck.map(r=>r.word).join(','));
      for(const round of deck){assert.ok(round.image);assert.ok(round.audio);assert.equal(round.chunks.join(''),round.word);assert.ok(round.choices.length>=6);assert.ok(round.choices.length<=8);assert.equal(new Set(round.choices).size,round.choices.length);for(const unit of round.chunks)assert.ok(round.choices.includes(unit));}
    }
    assert.equal(new Set(signatures).size,12);
  }
});

test('compound graphemes are one sound slot, with plausible distractors and fresh choice positions',()=>{
  const deck=buildTowerTumbleRounds('medium',324);
  assert.ok(deck.some(round=>round.chunks.some(chunk=>chunk.length===2)));
  const ship=Array.from({length:12},(_,chapter)=>buildTowerTumbleRounds('medium',324,chapter)).flat().find(round=>round.word==='ship');
  assert.deepEqual(ship.chunks,['sh','i','p']);
  assert.ok(ship.choices.some(unit=>['ch','th'].includes(unit)));
  assert.notDeepEqual(buildTowerTumbleRounds('easy',324),buildTowerTumbleRounds('easy',325));
});

test('every deliberate assisted selection stops beside its face and strikes that same brick across all decks',()=>{
  for(const difficulty of ['easy','medium','hard'])for(let journey=0;journey<12;journey++)for(const seed of [0,42,9824]){
    for(const round of buildTowerTumbleRounds(difficulty,seed,journey))for(const target of round.bricks){
      const approach=towerTumbleApproachX(round.bricks,target);
      for(const settlingOffset of [-.14,0,.14]){
        const x=approach+settlingOffset;
        const nearest=round.bricks.filter(brick=>brick.y===target.y&&Math.abs(brick.x-x)<1.5).sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x))[0];
        assert.equal(nearest?.id,target.id,`${difficulty}/${journey}/${seed}/${target.chunk}`);
        assert.ok(Math.abs(x-target.x)>=.65,'actor must remain beside the readable face');
      }
    }
  }
});

test('the real held mallet reaches the selected brick during the canonical contact pose for all three heroes',()=>{
  const remaining=TOWER_TUMBLE_STRIKE_SECONDS-TOWER_TUMBLE_CONTACT_SECONDS,phase=1-remaining/TOWER_TUMBLE_STRIKE_SECONDS;
  for(const world of ['meadow','dino','moonwood'])for(const facing of [-1,1]){
    const pose=physicalPalFrame(world,0,false,{direction:facing<0?'left':'right',action:'smash',phase});
    assert.equal(pose.kind,'tools');assert.equal(pose.index,3);
    const angle=towerTumbleHammerAngle(remaining,facing),[gripX,gripY]=pose.rightHand;
    const headX=(gripX-Math.sin(angle)*.78)*.84,headY=(gripY+Math.cos(angle)*.78)*.84+.08;
    // Real actor is 0.8–1.1 units beside the block; the mallet head has radius
    // 0.24 at actor scale 0.84 and must overlap the 1.08-square masonry face.
    for(const standDistance of [.8,1.1])for(const settle of [-.14,0,.14]){
      const centreX=-facing*standDistance+settle+headX;
      assert.ok(Math.abs(centreX)<.54+.24*.84,`${world}/${facing} must contact the chosen face`);
      assert.ok(headY>.12-.24*.84&&headY<1.2+.24*.84);
    }
    assert.ok(Math.sign(towerTumbleHammerAngle(TOWER_TUMBLE_STRIKE_SECONDS,facing))===facing,'windup begins behind the selected face');
    assert.ok(Math.sign(angle)===-facing,'contact swings toward the selected face');
  }
});

test('physical motor events do not fabricate wrong literacy, mastery or additional completions',()=>{
  const round=buildTowerTumbleRounds('easy',42)[0],evidence=newTowerTumbleEvidence();
  evidence.motorEvents.falls=20;evidence.motorEvents.emptySwings=80;
  assert.equal(evidence.firstResponses.length,0);assert.equal(evidence.completions.length,0);
  assert.equal(commitTowerTumbleStrike(evidence,round,0,'not-a-choice'),null);
  const wrong=round.choices.find(chunk=>chunk!==round.chunks[0]);
  const rejected=commitTowerTumbleStrike(evidence,round,0,wrong,{delivery:'delivered',pictureDelivery:'delivered'});
  assert.equal(rejected.correct,false);assert.equal(rejected.evidence.firstResponses.length,1);assert.equal(rejected.evidence.completions.length,0);
  let state=rejected.evidence;
  for(let i=0;i<round.chunks.length;i++){
    const result=commitTowerTumbleStrike(state,round,i,round.chunks[i],{delivery:'delivered',pictureDelivery:'delivered',supportReasons:['contrast-after-wrong-response']});state=result.evidence;
    assert.equal(result.response.independentEncodingPractice,false);assert.equal(result.response.practiceOnly,true);
  }
  assert.deepEqual(state.completions,[round.roundId]);assert.equal(state.assistedRetries.length,1);
  const duplicate=commitTowerTumbleStrike(state,round,round.chunks.length-1,round.chunks.at(-1),{delivery:'delivered',pictureDelivery:'delivered'});
  assert.deepEqual(duplicate.evidence.completions,[round.roundId]);assert.equal(duplicate.response.independentEncodingPractice,false);
});

test('delivery is frozen at impact; a clip delivered later never upgrades earlier first responses',()=>{
  const round=buildTowerTumbleRounds('easy',42)[0];
  const pending=commitTowerTumbleStrike(newTowerTumbleEvidence(),round,0,round.chunks[0],{delivery:'pending',pictureDelivery:'delivered'});
  assert.equal(pending.response.independentEncodingPractice,false);assert.equal(pending.response.stimulusDelivered,false);
  const later=commitTowerTumbleStrike(pending.evidence,round,1,round.chunks[1],{delivery:'delivered',pictureDelivery:'delivered'});
  assert.equal(later.response.independentEncodingPractice,true);assert.equal(later.evidence.firstResponses[0].deliveryAtResponse,'pending');
});

test('long retry histories are bounded while one accepted response per sound remains available for recovery',()=>{
  const round=buildTowerTumbleRounds('easy',42)[0];
  const wrong=round.choices.find(chunk=>chunk!==round.chunks[0]);
  let evidence=commitTowerTumbleStrike(newTowerTumbleEvidence(),round,0,wrong,{delivery:'delivered',pictureDelivery:'delivered'}).evidence;
  evidence=commitTowerTumbleStrike(evidence,round,0,round.chunks[0],{delivery:'delivered',pictureDelivery:'delivered',supportReasons:['contrast-after-wrong-response']}).evidence;
  const secondWrong=round.choices.find(chunk=>chunk!==round.chunks[1]);
  for(let i=0;i<400;i++)evidence=commitTowerTumbleStrike(evidence,round,1,secondWrong,{delivery:'delivered',supportReasons:['contrast-after-wrong-response']}).evidence;
  assert.equal(evidence.assistedRetries.length,216);
  assert.equal(evidence.acceptedResponses.length,1);assert.equal(evidence.acceptedResponses[0].unitIndex,0);assert.equal(evidence.acceptedResponses[0].correct,true);assert.equal(evidence.acceptedResponses[0].independentEncodingPractice,false);
  assert.equal(evidence.firstResponses.length,2);assert.equal(evidence.completions.length,0);
});

test('ladders physically connect their ledges, jump arcs land, and rescue geometry varies independently of difficulty',()=>{
  const geometry=towerTumbleGeometry(0,0),ladder=geometry.ladders[0];
  let actor={x:ladder.x,y:0,vy:0,grounded:true,facing:1};
  for(let i=0;i<100;i++)actor=towerTumbleStep(actor,{up:true},geometry,.02);
  assert.equal(actor.y,3);assert.equal(actor.grounded,true);
  actor=towerTumbleStep(actor,{jump:true},geometry,.02);assert.ok(actor.y>3);assert.equal(actor.grounded,false);
  for(let i=0;i<80;i++)actor=towerTumbleStep(actor,{},geometry,.02);
  assert.equal(actor.y,3);assert.equal(actor.grounded,true);
  const falling=towerTumbleStep({x:8.1,y:-1.99,vy:-12,grounded:false,safe:{x:4,y:3}}, {},geometry,.03);
  assert.equal(falling.fell,true);assert.equal(falling.y,3);assert.equal(falling.x,4);
  assert.notDeepEqual(towerTumbleGeometry(0,0),towerTumbleGeometry(0,1));
});

test('each difficulty owns its full canonical world and three named tower structures without changing physical route fairness',()=>{
  const worlds=['meadow','dino','moonwood'],names=new Set();
  for(const [index,difficulty] of ['easy','medium','hard'].entries())for(let tower=0;tower<3;tower++){
    const geometry=towerTumbleGeometry(tower,7,difficulty),meadow=towerTumbleGeometry(tower,7,'easy');
    assert.equal(geometry.world,worlds[index]);names.add(geometry.name);
    assert.deepEqual(geometry.platforms,meadow.platforms);assert.deepEqual(geometry.ladders,meadow.ladders);
    assert.deepEqual(geometry.shortcuts,meadow.shortcuts);assert.deepEqual(geometry.movingPlatform,meadow.movingPlatform);
  }
  assert.equal(names.size,9);
});

test('overlapping gentle ladder approaches choose the connected route in the intended climbing direction',()=>{
  for(let variant=0;variant<3;variant++){
    const geometry=towerTumbleGeometry(0,variant);
    for(const ladder of geometry.ladders){
      let actor={x:ladder.x,y:ladder.bottom,vy:0,grounded:true,facing:1};
      for(let i=0;i<100&&actor.y<ladder.top;i++)actor=towerTumbleStep(actor,{up:true},geometry,.02);
      assert.equal(actor.y,ladder.top,`variant ${variant} must reach ${ladder.top}`);
      for(let i=0;i<100&&actor.y>ladder.bottom;i++)actor=towerTumbleStep(actor,{down:true},geometry,.02);
      assert.equal(actor.y,ladder.bottom,`variant ${variant} must return to ${ladder.bottom}`);
    }
  }
});


test('all nine words own changed physical maps with walkable brick floors and connected native ladder routes',()=>{
  for(const difficulty of ['easy','medium','hard'])for(let journey=0;journey<12;journey++){
    const rounds=buildTowerTumbleRounds(difficulty,724,journey),ids=[],routes=[];
    for(let i=0;i<rounds.length;i++){
      const round=rounds[i],map=towerTumbleGeometry(round.tower,journey,difficulty,i);ids.push(map.layoutId);routes.push(JSON.stringify([map.platforms,map.ladders,map.shortcuts,map.movingPlatform,map.collectibles]));
      assert.deepEqual(map,towerTumbleGeometry(round.tower,journey,difficulty,i));
      for(const brick of round.bricks)assert.ok(map.platforms.some(p=>p.y===brick.y&&Math.abs(brick.x-p.x)+.54<=p.width/2));
      for(const ladder of map.ladders){
        for(const y of [ladder.bottom,ladder.top])assert.ok(map.platforms.some(p=>p.y===y&&Math.abs(ladder.x-p.x)<p.width/2-.3));
        let actor={x:ladder.x,y:ladder.bottom,vy:0,grounded:true,safe:{x:ladder.x,y:ladder.bottom}};
        for(let step=0;step<50&&actor.y<ladder.top;step++)actor=towerTumbleStep(actor,{up:true},map,1/60,{assist:false});
        assert.equal(actor.y,ladder.top);assert.ok(actor.grounded);
      }
      for(const token of map.collectibles)assert.ok(map.platforms.some(p=>Math.abs(token.y-p.y-.55)<.01&&Math.abs(token.x-p.x)<p.width/2-.3));
    }
    assert.equal(new Set(ids).size,9);
    for(let tower=0;tower<3;tower++)assert.equal(new Set(routes.slice(tower*3,tower*3+3)).size,3);
  }
});

test('a barrel removes one motor life, immunity prevents repeated losses and retry never changes spelling history',()=>{
  const round=buildTowerTumbleRounds('medium',713)[0],map=towerTumbleGeometry(0),wrong=round.choices.find(c=>c!==round.chunks[0]);
  let evidence=commitTowerTumbleStrike(newTowerTumbleEvidence(),round,0,wrong,{delivery:'delivered',pictureDelivery:'delivered'}).evidence;
  evidence=commitTowerTumbleStrike(evidence,round,0,round.chunks[0],{delivery:'delivered',pictureDelivery:'delivered',supportReasons:['contrast-after-wrong-response']}).evidence;
  let state={phase:'playing',lives:TOWER_TUMBLE_LIVES,immunity:0,unitIndex:1,mistakes:1,hintUsed:true,supportReasons:['partial-spelling-hint'],score:0,actor:{x:5,y:3.7,vy:4,safe:{x:5,y:3}},evidence};
  const history=JSON.stringify([evidence.firstResponses,evidence.assistedRetries,evidence.acceptedResponses,evidence.completions]);
  for(let hit=0;hit<3;hit++){
    state={...state,immunity:0};state=towerTumbleLoseLife(state,map);assert.equal(state.lives,2-hit);assert.equal(state.immunity,TOWER_TUMBLE_IMMUNITY_SECONDS);assert.equal(state.actor.y,3);assert.equal(state.actor.vy,0);
    assert.equal(towerTumbleLoseLife(state,map),state);assert.equal(state.evidence.motorEvents.barrelHits,hit+1);
  }
  assert.equal(state.phase,'retry');state=towerTumbleRetryRoute(state);assert.equal(state.lives,3);assert.equal(state.phase,'playing');assert.equal(state.evidence.motorEvents.routeRetries,1);
  assert.equal(state.unitIndex,1);assert.equal(state.mistakes,1);assert.equal(state.hintUsed,true);assert.equal(state.score,0);assert.equal(JSON.stringify([state.evidence.firstResponses,state.evidence.assistedRetries,state.evidence.acceptedResponses,state.evidence.completions]),history);
});
