import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildRallyPalsRounds, consumeRallyPalsFrame, RALLY_PALS_SIMULATION_STEP, commitRallyPalsAim, newRallyPalsEvidence, rallyContactWindow, rallyShot, stepRallyShot, rallyLaneX, chooseOpponentReturn } from '../../src/utils/rallyPalsRules.js';
import { phonicsTargetHint } from '../../src/utils/phonicsTargetPresentation.js';

test('all 36 difficulty/journey outings have unambiguous image/audio contrasts',()=>{
  for(const difficulty of ['easy','medium','hard'])for(let chapter=0;chapter<12;chapter++){
    const rounds=buildRallyPalsRounds(difficulty,8745,chapter);
    assert.equal(rounds.length,6);assert.equal(new Set(rounds.map(row=>row.roundId)).size,6);
    for(const round of rounds){assert.equal(round.choices.length,3);assert.equal(new Set(round.choices).size,3);
      assert.equal(round.choices.filter(choice=>choice===round.expected).length,1);
      assert.ok(round.image,round.word);assert.ok(fs.existsSync(`public${round.image}`),round.image);
      assert.ok(round.audio,round.word);assert.ok(fs.existsSync(`public${round.audio}`),round.audio);
      assert.ok(!round.cue.includes(round.word));assert.ok(round.choices.every(choice=>choice!==round.word));}
  }
});
test('seed and journey preserve cue/choice order; fresh outings alter it',()=>{
  const deck=buildRallyPalsRounds('medium',98,3);
  assert.deepEqual(deck,buildRallyPalsRounds('medium',98,3));
  assert.notDeepEqual(deck,buildRallyPalsRounds('medium',99,3));
  assert.notDeepEqual(deck,buildRallyPalsRounds('medium',98,4));
  const distribution=new Set(Array.from({length:40},(_,seed)=>buildRallyPalsRounds('easy',seed)[0].choices.indexOf(buildRallyPalsRounds('easy',seed)[0].expected)));
  assert.equal(distribution.size,3);
});
test('swing intent is learning evidence independent of tennis precision',()=>{
  const round=buildRallyPalsRounds('medium',21)[0];
  const result=commitRallyPalsAim(newRallyPalsEvidence(),round,round.expected,{delivery:'delivered',pictureDelivery:'delivered',motorMiss:true});
  assert.equal(result.correct,true);assert.equal(result.awarded,10);assert.equal(result.response.independentPractice,true);
  assert.equal(result.evidence.completions.length,1);
  assert.equal(commitRallyPalsAim(result.evidence,round,round.expected).ignored,true);
});
test('wrong first aim retains evidence; repaired/hinted practice is not independent',()=>{
  const round=buildRallyPalsRounds('medium',21)[0],wrong=round.choices.find(choice=>choice!==round.expected);
  const first=commitRallyPalsAim(newRallyPalsEvidence(),round,wrong,{delivery:'delivered',pictureDelivery:'delivered'});
  const repaired=commitRallyPalsAim(first.evidence,round,round.expected,{delivery:'delivered',pictureDelivery:'delivered',supportReasons:['sound-contrast','partial-hint']});
  assert.equal(first.awarded,0);assert.equal(first.evidence.firstResponses[0].correct,false);
  assert.equal(repaired.evidence.firstResponses[0].correct,false);assert.equal(repaired.evidence.assistedRetries.length,1);
  assert.equal(repaired.response.independentPractice,false);
  assert.equal(phonicsTargetHint(round.word,1),'');assert.ok(phonicsTargetHint(round.word,2).includes('*'));
});
test('audio and visual support are frozen at response, never credited later',()=>{
  const round=buildRallyPalsRounds('easy',91)[0];
  for(const delivery of ['pending','unavailable']){
    const result=commitRallyPalsAim(newRallyPalsEvidence(),round,round.expected,{delivery,pictureDelivery:'delivered'});
    assert.equal(result.response.independentPractice,false);assert.equal(result.response.stimulusDelivered,false);
    assert.ok(result.response.supportReasons.length);assert.equal(result.response.deliveryAtResponse,delivery);
  }
  const silent=commitRallyPalsAim(newRallyPalsEvidence(),round,round.expected,{delivery:'unavailable',pictureDelivery:'delivered',visualModel:true});
  assert.equal(silent.response.construct,'supported-visual-grapheme-matching');assert.equal(silent.response.independentPractice,false);
});
test('ball arcs clear the real net and reach lane geometry; lobs add flight time',()=>{
  for(let lane=0;lane<3;lane++){
    const shot=rallyShot({x:0,z:7.4},{x:rallyLaneX(lane),z:-7.1});
    const middle=stepRallyShot(shot,shot.duration*.5),end=stepRallyShot(shot,50);
    assert.ok(middle.y>1.3);assert.equal(end.x,rallyLaneX(lane));assert.equal(end.z,-7.1);assert.equal(end.landed,true);
    const lob=rallyShot(shot.from,shot.to,{lob:true});assert.ok(lob.duration>shot.duration);assert.ok(lob.height>shot.height);
  }
});
test('a registered racket release retains its exact contact position and height without changing its landing target',()=>{
  const from={x:2.6,z:8.7},to={x:-3.15,z:-7.1};
  const contact=rallyShot(from,to,{lob:true,startHeight:4.1});
  assert.deepEqual({x:contact.x,y:contact.y,z:contact.z},{x:from.x,y:4.1,z:from.z});
  assert.equal(stepRallyShot(contact,0).y,4.1);
  const end=stepRallyShot(contact,20);assert.equal(end.x,to.x);assert.equal(end.z,to.z);assert.ok(Math.abs(end.y-.32)<1e-10);
  assert.equal(rallyShot(from,to).y,1.35);
});
test('contact mode changes motor tolerance without selecting a learning lane',()=>{
  const ball={x:2.1,z:7.2,y:1.4,direction:'near'},player={x:0,z:7.4};
  assert.equal(rallyContactWindow(ball,player,false),false);assert.equal(rallyContactWindow(ball,player,true),true);
  assert.equal(rallyContactWindow({...ball,direction:'far'},player,true),false);
  assert.deepEqual(chooseOpponentReturn(82,1,3),chooseOpponentReturn(82,1,3));
});
test('the same one-second rally follows identical fixed physics at 30, 60 and 120 render frames per second',()=>{
  const outcomes=[30,60,120].map(fps=>{
    let remainder=0,ball=rallyShot({x:-2,z:7.4},{x:3,z:-7.1}),steps=0;
    for(let frame=0;frame<fps;frame++){
      const consumed=consumeRallyPalsFrame(remainder,1/fps);remainder=consumed.remainder;
      for(let step=0;step<consumed.steps;step++){ball=stepRallyShot(ball,RALLY_PALS_SIMULATION_STEP);steps++;}
    }
    assert.equal(steps,60);assert.ok(remainder<1e-9);return ball;
  });
  assert.deepEqual(outcomes[0],outcomes[1]);assert.deepEqual(outcomes[1],outcomes[2]);
  const stalled=consumeRallyPalsFrame(.002,5);assert.equal(stalled.steps,12);
  assert.ok(stalled.remainder<RALLY_PALS_SIMULATION_STEP);
  assert.deepEqual(consumeRallyPalsFrame(.012,.2,{active:false}),{steps:0,remainder:0});
});
