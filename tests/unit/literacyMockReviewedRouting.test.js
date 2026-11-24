import test from 'node:test';
import assert from 'node:assert/strict';
import { LITERACY_MOCK_DEMAND_ANCHORS as anchors, reviewedLiteracyMockBand, reviewedLiteracyMockNextBand, reviewedLiteracyMockFuture } from '../../src/policy/literacyMockReviewedDemand.js';
import { createWholeClassMockSession, submitWholeClassMockAnswer } from '../../src/components/teacher/wholeClassPracticeModel.js';
import { LITERACY_MOCK_RUNTIME_V15 } from '../../src/data/generated/literacyMockRuntimeV15.generated.js';
import { adaptLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';
import { literacyMockBoundarySchedule } from '../../src/policy/literacyMockBoundaryPolicy.js';

const evidence=(domainId,adaptiveAreaBand,isCorrect,extra={})=>({
  questionId:'current',itemSnapshot:{domainId,adaptiveAreaBand}, isCorrect,
  responseStatus:'answered',evidenceType:'independent',...extra,
});

test('encoding three sounds leads to navigating a sentence, while a miss leads to locating one printed letter',()=>{
  const correct=evidence('phonics',2,true);
  assert.equal(reviewedLiteracyMockBand(correct,correct.itemSnapshot,'print'),3);
  const incorrect={...correct,isCorrect:false};
  assert.equal(reviewedLiteracyMockBand(incorrect,incorrect.itemSnapshot,'print'),2);
});

test('a reader at advanced inference gets another challenging area when print navigation would be a step backwards',()=>{
  const row=evidence('reading',6,true);
  assert.deepEqual(reviewedLiteracyMockFuture(['print','print','vocabulary','writing'],[row],new Map()),
    ['vocabulary','print','print','writing']);
  assert.equal(reviewedLiteracyMockBand(row,row.itemSnapshot,'vocabulary'),5);
  assert.deepEqual(reviewedLiteracyMockFuture(['print'],[row],new Map()),[]);
  const missed={...row,isCorrect:false};
  assert.deepEqual(reviewedLiteracyMockFuture(['print','language'],[missed],new Map()),['print','language']);
  assert.equal(reviewedLiteracyMockBand(missed,row.itemSnapshot,'print'),4);
});

test('eight starting areas retain all eight skills and sustained successes or errors never reverse actual task demand',()=>{
  for(let rotation=0;rotation<8;rotation++) for(const correct of [true,false]) {
    const rows=[], byId=new Map(), scores=[];
    for(let i=0;i<40;i++){
      const area=literacyMockBoundarySchedule(rows,{bank:byId,sessionId:String(rotation),contentVersion:'literacy-mock-v15'})[i];
      if(!area) break;
      const band=reviewedLiteracyMockNextBand(rows,byId,area);
      const row=evidence(area,band,correct,{questionId:'q'+i}); byId.set(row.questionId,row.itemSnapshot);
      scores.push(anchors[area][band]);rows.push(row);
    }
    assert.equal(new Set(rows.slice(0,15).map(r=>r.itemSnapshot.domainId)).size,8);
    assert.ok(scores.length>=15);
    for(let i=1;i<scores.length;i++) assert.ok(correct ? scores[i]>=scores[i-1] : scores[i]<=scores[i-1]);
  }
});

test('held responses retain the first actual demand through missing anchors, familiarity, skips and media repair',()=>{
  const rows=[],byId=new Map(),neutralAnchors=[];
  const outcomes=[true,true,true,true,false,false];
  for(let i=0;i<40;i++){
    const area=literacyMockBoundarySchedule(rows,{bank:byId,sessionId:'6',contentVersion:'literacy-mock-v15'})[i];
    if(!area)break;
    const band=reviewedLiteracyMockNextBand(rows,byId,area),anchor=anchors[area][band];
    if(i>=outcomes.length)neutralAnchors.push(anchor);
    const condition=i<outcomes.length?{}:[
      {supportUsed:true}, {responseStatus:'skipped',isCorrect:null}, {knownFamiliar:true},
      {classification:'supported'}, {helpPending:true},
    ][(i-outcomes.length)%5];
    const row=evidence(area,band,outcomes[i]??true,{questionId:'q'+i,...condition});
    byId.set(row.questionId,row.itemSnapshot);rows.push(row);
  }
  assert.ok(neutralAnchors.length>=12);
  assert.equal(neutralAnchors[0],3);
  assert.ok(neutralAnchors.every(anchor=>Math.abs(anchor-3)<=1),JSON.stringify(neutralAnchors));
  assert.ok(neutralAnchors.includes(4));
  const failed={responseStatus:'media_failed'};
  assert.equal(reviewedLiteracyMockNextBand([...rows,failed],byId,'sound_awareness'),3);
  assert.equal(reviewedLiteracyMockNextBand([failed],byId,'print'),1);
});

test('a fresh answer to a previously frozen task starts at that actual task and ends the neutral hold',()=>{
  const initial=evidence('sound_awareness',3,true,{supportUsed:true});
  const rounded=evidence('print',3,false,{knownFamiliar:true});
  const frozen=evidence('sound_awareness',4,true,{classification:'supported'});
  const history=[initial,rounded,frozen];
  assert.equal(reviewedLiteracyMockNextBand(history,new Map(),'writing'),2);
  assert.equal(reviewedLiteracyMockNextBand([...history,evidence('sound_awareness',4,true)],new Map(),'writing'),4);
  assert.equal(reviewedLiteracyMockNextBand([...history,evidence('sound_awareness',4,false)],new Map(),'writing'),3);
  // A high held target must not step back into print merely because the latest
  // frozen, reclassified display happened to be on a different anchor.
  const high=evidence('reading',6,true,{supportUsed:true});
  assert.deepEqual(reviewedLiteracyMockFuture(['print','language'],[high,frozen],new Map()),['language','print']);
  assert.deepEqual(reviewedLiteracyMockFuture(['print'],[high,frozen],new Map()),[]);
});

test('late assistance keeps a shown pupil item while an unseen item follows the revised history',()=>{
  const options={sessionId:'20000000-0000-4000-8000-000000000001',studentId:'whole-class',itemCount:15,routingPolicy:'continuous-v1'};
  let sitting=createWholeClassMockSession(LITERACY_MOCK_RUNTIME_V15,options);
  const first=sitting.rounds[0];
  sitting=submitWholeClassMockAnswer(sitting,first,{questionId:first.id,responseStatus:'answered',selected:first.answer});
  const next=sitting.rounds[1],reclassified=sitting.run.responses.map(row=>({...row,classification:'supported',supportUsed:true}));
  const prior=sitting.run.plan,byId=sitting.byId;
  const unseen=adaptLiteracyMockPlan(sitting.reserve,prior,reclassified,[],[],options);
  assert.equal(byId.get(unseen.itemIds[1]).adaptiveAreaBand,first.adaptiveAreaBand);
  assert.notEqual(unseen.itemIds[1],next.id);
  const shown=adaptLiteracyMockPlan(sitting.reserve,prior,reclassified,[],[{questionId:next.id}],options);
  assert.deepEqual(shown.itemIds.slice(0,2),[first.id,next.id]);
  const answered=[...reclassified,{...evidence(next.domainId,next.adaptiveAreaBand,true),questionId:next.id}];
  const revised=adaptLiteracyMockPlan(sitting.reserve,shown,answered,[],[{questionId:next.id}],options);
  const following=byId.get(revised.itemIds[2]);
  assert.ok(anchors[following.domainId][following.adaptiveAreaBand]>anchors[next.domainId][next.adaptiveAreaBand]);
});
