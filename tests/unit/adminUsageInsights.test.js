import test from "node:test";
import assert from "node:assert/strict";
import { buildAdminUsageReport, loadAdminUsageSnapshot, usageDateRange, usageInsightsErrorText } from "../../src/data/adminUsageInsights.js";
import { versionUsagePayload } from "../../src/utils/usageObservation.js";
const metadata={snapshotId:'snapshot',capturedAt:'2026-10-01T08:00:00Z',sources:[],rowCount:0};
const event=(id,payload={},learner='learner-a',area='skills_practice',kind='answer')=>({source:'learn_activity',learnerRef:learner,observedAt:'2026-09-28T08:00:00Z',data:{item_id:id,area,event:kind,payload:{questionId:id,...payload}}});

test('report errors distinguish a missing RPC from permission, source and cache failures', async () => {
  const missing = usageInsightsErrorText({ code: 'PGRST202', message: 'Could not find the function public.admin_create_usage_snapshot(p_from, p_to) in the schema cache' });
  assert.match(missing, /database update has not been installed/);
  for (const message of ['permission denied for function admin_create_usage_snapshot', 'admin_create_usage_snapshot: Required usage source unavailable: answers', 'Invalid schema cache for another source']) {
    assert.equal(usageInsightsErrorText({ code: '42501', message }), message);
  }
  const client = { call: async () => ({ error: { code: '42883', message: 'function public.admin_create_usage_snapshot does not exist' } }) };
  await assert.rejects(loadAdminUsageSnapshot({ client }), error => {
    assert.equal(error.code, '42883');
    assert.match(usageInsightsErrorText(error), /database update has not been installed/);
    return true;
  });
});

test("validity, supported retries and media failures cannot enter independent item accuracy",()=>{
  const evidence=[event('q',{firstResponseCorrect:true,responseTimeMs:800,collectionVersion:2}),
    event('q',{firstResponseCorrect:false,mediaFailure:true},'learner-b'),
    event('q',{firstResponseCorrect:true,supportUsed:true},'learner-c'),
    event('q',{firstResponseCorrect:false,validity:'invalid'},'learner-d'),
    event('q',{firstResponseCorrect:true,attemptCount:2},'learner-e')];
  const report=buildAdminUsageReport({metadata,evidence});
  const item=report.items.find(i=>i.id==='q');
  assert.equal(item.independentResponses,1);assert.equal(item.independentAccuracy,1);
  assert.equal(item.supported,2);assert.equal(item.mediaFailed,1);assert.equal(item.unscored,1);
  assert.equal(item.medianResponseTimeMs,800);assert.equal(item.timingRecorded,1);
  assert.equal(item.reviewSignal,'insufficient_or_middle_range');
  assert.equal(report.summary.responsesWithoutTiming,4);
});

test("uncollected feature/item opportunities remain missing; zero use requires an explicit denominator",()=>{
  const evidence=[event('home',{collectionVersion:2,area:'student_home',availableAreas:['student_home','hollow']},'a','app','area_enter'),
    event('q',{collectionVersion:2,itemIds:['never-used']},'a','skills_practice','items_offered')];
  const report=buildAdminUsageReport({metadata,evidence,itemManifest:[{area:'skills_practice',id:'never-used'},{area:'skills_practice',id:'unobserved'}]});
  const hollow=report.features.find(f=>f.id==='hollow'),books=report.features.find(f=>f.id==='books');
  assert.equal(hollow.usageStatus,'no_observed_use_when_available');assert.equal(hollow.availableToObservedLearners,1);
  assert.equal(books.usageStatus,'not_observed');assert.equal(books.useRateWhenAvailable,null);
  assert.equal(report.items.find(i=>i.id==='never-used').usageStatus,'no_observed_use_when_offered');
  assert.equal(report.items.find(i=>i.id==='unobserved').usageStatus,'not_observed');
  assert.equal(buildAdminUsageReport({metadata:{...metadata,sources:[{source:'learner_context',available:true,rows:0}]},evidence:[]}).summary.currentCohortLearners,0);
});

test("immutable attempt receipts suppress duplicate telemetry while extra presses remain observations",()=>{
  const record={questionId:'formal',answerEventId:'receipt-a',isCorrect:true,timestamp:'2026-09-28T08:00:00Z'};
  const evidence=[{source:'assessment_attempts',learnerRef:'a',observedAt:'2026-09-28T08:00:00Z',data:{payload:{questionRecords:[record]}}},
    event('formal',{...record,responseTimeMs:100},'a','skills_assessment'),
    event('formal',{ignoredPressCount:3,repeatPressCount:2},'a','skills_assessment','press')];
  const report=buildAdminUsageReport({metadata,evidence});
  assert.equal(report.summary.independentResponses,1);assert.equal(report.items[0].ignoredPressCount,3);
  assert.equal(report.summary.ignoredPresses,3);assert.equal(report.items[0].repeatPressCount,2);
  assert.ok(report.interpretation.limits.some(l=>l.includes('do not establish guessing')));
});

test("item review thresholds require multiple independent learners and do not judge children",()=>{
  const evidence=Array.from({length:12},(_,i)=>event('hard',{firstResponseCorrect:false,answerEventId:`event-${i}`},`learner-${i%3}`));
  evidence.push(...Array.from({length:12},(_,i)=>event('easy',{firstResponseCorrect:true,answerEventId:`other-${i}`},'single-learner')));
  const report=buildAdminUsageReport({metadata,evidence});
  assert.equal(report.items.find(i=>i.id==='hard').reviewSignal,'review_lower_accuracy');
  assert.equal(report.items.find(i=>i.id==='easy').reviewSignal,'insufficient_or_middle_range');
  assert.equal(Object.hasOwn(report,'learnerRankings'),false);
});

test("complete snapshot client fetches every immutable page and validates all source counts",async()=>{
  const rows=Array.from({length:1005},(_,i)=>({rowNumber:i+1,evidence:{source:'learn_activity',learnerRef:'a',data:{}}}));
  const calls=[];
  const client={call:async(name,args)=>{calls.push([name,args]);return{error:null,data:name==='admin_create_usage_snapshot'?{...metadata,ok:true,rowCount:rows.length,sources:[{source:'learn_activity',available:true,rows:rows.length}]}:
    {ok:true,snapshotId:'snapshot',rowCount:rows.length,rows:rows.slice(args.p_after,args.p_after+500),nextAfter:Math.min(args.p_after+500,rows.length),complete:args.p_after+500>=rows.length}};}};
  const result=await loadAdminUsageSnapshot({client,from:'2026-09-01',to:'2026-10-01'});
  assert.equal(result.evidence.length,1005);assert.equal(calls.filter(([n])=>n==='admin_read_usage_snapshot').length,3);
});

test("a paging gap or source mismatch fails closed and releases the cache",async()=>{
  const calls=[];
  const client={call:async(name)=>{calls.push(name);return{error:null,data:name==='admin_create_usage_snapshot'?{...metadata,ok:true,rowCount:2,sources:[{source:'answers',available:true,rows:2}]}:
    name==='admin_release_usage_snapshot'?{ok:true}:{ok:true,snapshotId:'snapshot',rowCount:2,rows:[{rowNumber:2,evidence:{source:'answers',learnerRef:'a'}}],nextAfter:2,complete:true}};}};
  await assert.rejects(loadAdminUsageSnapshot({client}),/gap or duplicate/);
  assert.ok(calls.includes('admin_release_usage_snapshot'));
});

test("date boundaries preserve inclusive last calendar day and payload versioning preserves primitives",()=>{
  const range=usageDateRange('2026-09-01','2026-09-01');assert.ok(new Date(range.to)>new Date(range.from));
  assert.throws(()=>usageDateRange('2026-09-02','2026-09-01'),/last day/);
  assert.deepEqual(versionUsagePayload({correct:true}),{correct:true,collectionVersion:2});
  assert.equal(versionUsagePayload({reason:'answer_locked'}).interactionReason,'answer_locked');
  assert.equal(Object.hasOwn(versionUsagePayload({reason:'Private staff note'}),'interactionReason'),false);
  assert.equal(versionUsagePayload('legacy'),'legacy');assert.equal(versionUsagePayload(null),null);
});


test("actual legacy answer schema uses projected receipt to avoid doubling stored attempt/activity evidence",()=>{
  const record={questionId:'q',answerEventId:'ref-receipt',isCorrect:true,timestamp:'2026-09-28T08:00:00.125Z',question:'Find a cat.'};
  const evidence=[{source:'assessment_attempts',learnerRef:'a',observedAt:'2026-09-28T08:01:00Z',data:{payload:{questionRecords:[record]}}},
    event('q',{...record},'a','skills_assessment'),
    {source:'answers',learnerRef:'a',observedAt:'2026-09-28T08:00:00.895Z',data:{client_event_id:'ref-receipt',question:'Find a cat.',is_correct:true}},
    {source:'answers',learnerRef:'b',observedAt:'2026-09-28T08:00:00.895Z',data:{question:'Find a cat.',is_correct:false}}];
  const report=buildAdminUsageReport({metadata,evidence});
  assert.equal(report.summary.independentResponses,1);
  assert.equal(report.legacyAnswerObservations.length,1);
  assert.equal(report.summary.legacyAnswerRowsExcludedFromItemAccuracy,1);
  assert.equal(report.evidence.length,4);
});


test("review cohorts keep practice/check and levels apart and require independently responding learners",()=>{
  const evidence=Array.from({length:12},(_,i)=>event('q',{firstResponseCorrect:false,answerEventId:`ind-${i}`,mode:i<6?'practice':'assessment',level:1},`learner-${i%3}`));
  let report=buildAdminUsageReport({metadata,evidence});
  assert.equal(report.items[0].reviewSignal,'insufficient_or_middle_range');
  const one=Array.from({length:12},(_,i)=>event('q',{firstResponseCorrect:false,answerEventId:`one-${i}`,mode:'practice'},'a'));
  one.push(event('q',{firstResponseCorrect:true,supportUsed:true},'b'),event('q',{firstResponseCorrect:true,supportUsed:true},'c'));
  report=buildAdminUsageReport({metadata,evidence:one});
  assert.equal(report.items[0].reviewSignal,'insufficient_or_middle_range');
  assert.equal(report.items[0].uniqueIndependentLearners,1);
});

test("skills trail answered/no-response payloads retain delivery boundaries and elapsed area time",()=>{
  const evidence=[event('q',{responseId:'practice-response',responseStatus:'answered',firstResponseCorrect:true,validity:'valid',mode:'practice',
    responseTimeMs:null,responseTimeBoundary:'recorded_required_audio_and_images',instructionDelivery:'pending',targetDelivery:'not_required'}),
    event('q',{responseId:'required-target',responseStatus:'answered',firstResponseCorrect:null,answerMatch:true,validity:'invalid',evidenceType:'unscored',
      responseTimeMs:null,mode:'practice',instructionDelivery:'delivered',targetDelivery:'interrupted'},'b'),
    event('q',{responseId:'left',responseStatus:'no_response',firstResponseCorrect:null,validity:'invalid',mode:'practice'},'c'),
    event('q',{elapsedDurationMs:2500,collectionVersion:2},'a','skills_practice','area_exit')];
  const report=buildAdminUsageReport({metadata,evidence});
  assert.equal(report.summary.independentResponses,1);assert.equal(report.items[0].unscored,2);assert.equal(report.items[0].mediaFailed,0);
  assert.equal(report.responses[0].receipt,'practice-response');assert.equal(report.responses[0].instructionDelivery,'pending');
  assert.equal(report.responses[0].responseTimeMs,null);assert.equal(report.items[0].cohorts.length,3);
  const feature=report.features.find(row=>row.id==='skills_practice');
  assert.equal(feature.elapsedDurationMs,2500);assert.equal(feature.elapsedDurationObservations,1);assert.equal(feature.durationObservations,0);
});

test("books, games, stories, letters and maps retain real use separately from interval events and scores",()=>{
  const state=(area,key,payload,learner='a')=>({source:'student_progress',learnerRef:learner,observedAt:'2026-09-28T08:00:00Z',data:{area,key,payload}});
  const evidence=[state('learn_games','__all__',{games:{game:{plays:4,practiceRecord:{completions:[{id:'practice',steps:[{isCorrect:true}]}]}}}}),
    state('learn_games','__all__',{games:{game:{plays:3}}}),state('learn_games','__all__',{games:{game:{plays:2}}},'b'),
    state('guided_reading','book',{completedPages:5,readCount:2,pageStats:{1:{openedCount:3},2:{openedCount:2}}}),
    state('story_quests','story',{opened:true,visitedPageIds:['start','end'],completed:true}),
    state('phonics_letters','m',{v:3,status:'completed',completions:[{id:'letter-record',steps:[{isCorrect:true}]}]}),
    state('cvc','at','inprogress'),state('el_quest','__all__',{cycles:{'cycle-1':{stations:{rhyme:true}}}}),
    state('phonics_quest','__all__',{campaign:{visitedStageIds:['stage-a'],completedMissions:{mission:{done:true}}}}),
    state('profile','__all__',{guide:'dog'}),event('game',{},'a','learn_games','start')];
  const manifest=[{area:'games',id:'game'},{area:'guided_reading',id:'book'},{area:'story_quests',id:'story'},{area:'games',id:'untouched'}];
  const report=buildAdminUsageReport({metadata,evidence,itemManifest:manifest});
  for(const id of ['game','book','story','m','at','cycle-1','stage-a','mission']) assert.equal(report.items.find(item=>item.id===id).usageStatus,'observed_use',id);
  const game=report.items.find(item=>item.id==='game');
  assert.equal(game.storedCumulativeCounters.plays,6);assert.equal(game.storedStateLearners,2);assert.equal(game.usageEventCount,1);
  assert.equal(game.independentResponses,0);assert.equal(report.summary.independentResponses,0);
  assert.equal(report.items.find(item=>item.id==='book').storedCumulativeCounters.pageVisits,5);
  assert.equal(report.items.find(item=>item.id==='untouched').usageStatus,'not_observed');
  assert.equal(report.features.find(feature=>feature.id==='games').uniqueLearners,2);
  assert.equal(report.features.find(feature=>feature.id==='guided_reading').storedStateLearners,1);
  assert.equal(report.features.find(feature=>feature.id==='guided_reading').datedEvidenceLearners,0);
  assert.equal(report.popularity[0].id,'game');assert.equal(report.progressCoverage.uninterpretedAreas.profile,1);
});
