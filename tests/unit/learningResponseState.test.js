import assert from 'node:assert/strict';
import test from 'node:test';
import { createLearningResponseEpisode, commitLearningResponse, advanceLearningResponseReceipt, recordLearningGuidedAction, selectFreshLearningTransfer, replaceLearningTransferMedia, learningResponseRecoveryIssue, learningStimulusSignature, learningResponseCompletionEvent, mergeLearningResponseCheckpoints, recordLearningGuidedStep, startLearningWithModel, learningResponseEpisodes, feedbackOnlyLearningReceipt } from '../../src/utils/learningResponseState.js';
import { assessmentAttemptsToSkillLedger } from '../../src/policy/skillStatusPolicy.js';
import { learningExpectedAnswer, usesLearningResponseEpisode } from '../../src/utils/learningResponseAdapters.js';
import { mergePracticeProgressRecords } from '../../src/utils/practiceCompletionRecords.js';
const question = { id: 'cat', mechanicId: 'letterMatch', construct: 'initial_sound', targetWord: 'cat', image: '/cat.webp', choices: ['c','t','d'], answer: 'c' };
const transfer = { ...question, id: 'pig', targetWord: 'pig', image: '/pig.webp', choices: ['p','b','r'], answer: 'p' };
const make = (instrument = 'skills_trail_practice') => createLearningResponseEpisode({ id: 'one', instrument, slotId: 0, question, expected: 'c', transfer: { question: transfer, expected: 'p' } });
test('wrong answer is immutable through extra taps, reload, teaching and transfer', () => {
 const original = make();
 const receipt = commitLearningResponse(original, { selected: 't', correct: false });
 for (const option of question.choices) assert.equal(commitLearningResponse(receipt, { selected: option, correct: true }), receipt);
 assert.equal(original.firstResponse, null);
 const teaching = advanceLearningResponseReceipt(JSON.parse(JSON.stringify(receipt)));
 assert.equal(teaching.phase, 'teaching');
 assert.equal(recordLearningGuidedAction(teaching, 'wrong'), teaching);
 const next = recordLearningGuidedAction(teaching, 'c');
 assert.equal(next.role, 'transfer'); assert.equal(next.question.id, 'pig');
 const transferReceipt = commitLearningResponse(next, { selected: 'p', correct: true, supported: true });
 assert.equal(transferReceipt.responses[1].isCorrect, null);
 assert.equal(transferReceipt.responses[1].evidenceUse, 'formative_transfer_after_teaching');
 const complete = advanceLearningResponseReceipt(transferReceipt);
 assert.equal(complete.firstResponse.selected, 't'); assert.equal(complete.firstResponse.isCorrect, false);
 assert.equal(complete.completion.supported, true); assert.equal(complete.completion.rewardId, 'one:completion');
 const event = learningResponseCompletionEvent(complete);
 assert.equal(mergePracticeProgressRecords({ completions: [event] }, { completions: [event] }).completions.length, 1);
});
test('second error has one bounded modeled finish and cannot restart transfer', () => {
 let state = recordLearningGuidedAction(advanceLearningResponseReceipt(commitLearningResponse(make(), { selected: 't', correct: false })), 'c');
 state = advanceLearningResponseReceipt(commitLearningResponse(state, { selected: 'r', correct: false }));
 assert.equal(state.phase, 'finish_teaching');
 state = recordLearningGuidedAction(state, 'p');
 assert.equal(state.phase, 'complete'); assert.equal(state.completion.unresolved, true);
 assert.equal(commitLearningResponse(state, { selected: 'p', correct: true }), state);
 assert.equal(state.responses.length, 2);
});
test('checking does not teach; explicit skip, unknown, exit and failed media remain distinct', () => {
 assert.equal(advanceLearningResponseReceipt(commitLearningResponse(make('adaptive_progress_test'), { selected: 't', correct: false })).phase, 'complete');
 for (const responseStatus of ['skipped', 'abandoned', 'media_failed']) {
  const state = advanceLearningResponseReceipt(commitLearningResponse(make(), { responseStatus, valid: responseStatus !== 'media_failed' }));
  assert.equal(state.phase, 'complete'); assert.equal(state.firstResponse.isCorrect, null); assert.equal(state.firstResponse.responseStatus, responseStatus);
 }
 assert.equal(advanceLearningResponseReceipt(commitLearningResponse(make(), { responseStatus: 'no_response' })).phase, 'teaching');
});
test('freshness rejects option-only, ID-only, reserved retention and wrong-construct variants', () => {
 const variants = [{ ...question,id:'new-id' },{ ...question,id:'new-options', choices:['c','a','b'] },{ ...transfer,id:'reserved',retentionOnly:true },{ ...transfer,id:'other',construct:'rhyming' }, transfer];
 assert.equal(selectFreshLearningTransfer(question, variants).id, 'pig');
 assert.equal(learningStimulusSignature({ ...question,id:'new-id' }),learningStimulusSignature(question));
 assert.equal(selectFreshLearningTransfer(question, variants.slice(0,-1)), null);
});
test('sorting objects and multi-target boards use child meaningful expected models; memory/tracing stay native', () => {
 assert.deepEqual(learningExpectedAnswer({ mechanicId:'pictureSearch',objects:[{id:'cat',word:'cat',matches:true},{id:'dog',word:'dog',matches:false}] }), ['cat']);
 assert.deepEqual(learningExpectedAnswer({ mechanicId:'letterGrid',cells:[{id:'cell1',letter:'A',matches:true},{id:'cell2',letter:'b'}],targetLetters:['a'] }), ['cell1']);
 assert.equal(usesLearningResponseEpisode({mechanicId:'wordMemory'}),false); assert.equal(usesLearningResponseEpisode({mechanicId:'letterTrace'}),false);
});
test('new practice/progress/unknown instruments cannot enter formal Skills mastery while legacy scores replay', () => {
 const record={ skillId:'initial-sounds',questionRecords:[{questionId:'q',itemKey:'c',isCorrect:true,responseStatus:'correct'}] };
 for(const assessmentType of ['adaptive_progress_test','cycle_practice_check','adventure_map','skills_trail_practice','new_future_test']) assert.deepEqual(assessmentAttemptsToSkillLedger([{...record,assessmentType}],'initial-sounds'),[]);
 assert.equal(assessmentAttemptsToSkillLedger([{...record,assessmentType:'skill_checkpoint'}],'initial-sounds').length,1);
 assert.deepEqual(assessmentAttemptsToSkillLedger([{...record,metadata:{instrumentId:'literacypath_progress'}}],'initial-sounds'),[]);
 assert.equal(assessmentAttemptsToSkillLedger([{...record,questionRecords:[{questionId:'legacy',itemKey:'c',responseStatus:'no_response',isCorrect:false}]}],'initial-sounds')[0].responseState,'incorrect');
});
test('checkpoint merge preserves a whole newer state and quarantines contradictory first responses', () => {
 const episode=commitLearningResponse(make(),{selected:'t',correct:false});
 const old={episode,roundIndex:0,updatedAt:'2026-10-02T01:00:00Z',revision:1};
 const newer={...old,episode:advanceLearningResponseReceipt(episode),revision:2};
 assert.equal(mergeLearningResponseCheckpoints(old,newer),newer); assert.equal(mergeLearningResponseCheckpoints(newer,old),newer);
 const tampered={...newer,episode:{...newer.episode,firstResponse:{...episode.firstResponse,selected:'c',isCorrect:true}},revision:3};
 assert.equal(mergeLearningResponseCheckpoints(old,tampered).responseConflict,true);
 assert.equal(mergeLearningResponseCheckpoints(old,tampered).episode.firstResponse.selected,'t');
});

test('modeled cursor saves genuine parts, preserves built prefix and fresh model-first has no fictional answer', () => {
 const build = { ...question, mechanicId:'wordBuild', answer:['c','a','t'] };
 let episode=createLearningResponseEpisode({id:'build',instrument:'cycle_practice',question:build,expected:build.answer});
 episode=advanceLearningResponseReceipt(commitLearningResponse(episode,{selected:['c','x'],correct:false}));
 assert.equal(episode.guidedCursor,1);
 episode=recordLearningGuidedStep(episode,1);
 assert.equal(JSON.parse(JSON.stringify(episode)).guidedCursor,2);
 assert.equal(episode.firstResponse.selected[0],'c');
 assert.equal(recordLearningGuidedStep(episode,1),episode);
 const easier=startLearningWithModel(make());
 assert.equal(easier.phase,'teaching'); assert.equal(easier.firstResponse,null); assert.equal(easier.responses.length,0);
 assert.equal(recordLearningGuidedAction(easier,'c').role,'transfer');
});
test('same named stimulus with revised image/options is rejected as transfer', () => {
 const revision={...question,id:'cat-new-picture',image:'/cat-new.webp',choices:['c','a','b']};
 assert.equal(selectFreshLearningTransfer(question,[revision]),null);
});


test('intrinsically supported correct work closes once while explicit help teaches', () => {
 const correct=advanceLearningResponseReceipt(commitLearningResponse(make(),{selected:'c',correct:true,supported:true,supportUsed:['printed_model']}));
 assert.equal(correct.phase,'complete'); assert.equal(correct.firstResponse.isCorrect,null); assert.equal(correct.completion.supported,true);
 const helped=advanceLearningResponseReceipt(commitLearningResponse(make(),{responseStatus:'supported',supported:true}));
 assert.equal(helped.phase,'teaching'); assert.equal(helped.firstResponse.observedCorrect,null);
 let modeled=recordLearningGuidedAction(startLearningWithModel(make()),'c');
 modeled=advanceLearningResponseReceipt(commitLearningResponse(modeled,{selected:'p',correct:true,supported:true}));
 assert.equal(modeled.firstResponse,null); assert.equal(modeled.responses[0].presentationRole,'transfer');
});
test('closed checkpoint tombstone prevents old cloud practice from reopening', () => {
 const stale={schemaVersion:1,episode:make(),updatedAt:'2026-10-02T01:00:00Z',revision:1};
 const closed={schemaVersion:1,closed:true,episode:null,updatedAt:'2026-10-02T01:05:00Z',revision:2};
 assert.equal(mergeLearningResponseCheckpoints(stale,closed),closed);
 assert.equal(mergeLearningResponseCheckpoints(closed,stale),closed);
});


test('PostgreSQL object-key order cannot cause false conflict; contradictory archive firsts are quarantined', () => {
 const original=commitLearningResponse(make(),{selected:'t',correct:false});
 const one={episode:original,updatedAt:'2026-10-02T01:00:00Z',revision:1};
 const reordered={...original,firstResponse:Object.fromEntries(Object.entries(original.firstResponse).reverse())};
 const two={...one,episode:reordered,revision:2};
 assert.equal(mergeLearningResponseCheckpoints(one,two),two);
 const event=learningResponseCompletionEvent(original);
 const corrupt={...event,id:'different-revision',learningEpisode:{...original,firstResponse:{...original.firstResponse,selected:'c',isCorrect:true},events:[...original.events,{type:'changed'}]}};
 assert.deepEqual(learningResponseEpisodes([event,corrupt]),[]);
});

test('a newer empty or model-first checkpoint cannot erase a committed first answer', () => {
 const initial=make(), committed=advanceLearningResponseReceipt(commitLearningResponse(initial,{selected:'t',correct:false}));
 const saved={episode:committed,updatedAt:'2026-10-02T01:00:00Z',revision:1};
 const missing={...initial};delete missing.firstResponse;
 for(const weaker of [initial,missing,startLearningWithModel(initial),{...committed,firstResponse:null,phase:'answer'}]) {
  const later={episode:weaker,updatedAt:'2026-10-02T02:00:00Z',revision:99};
  for(const [left,right] of [[saved,later],[later,saved]]) {
   const result=mergeLearningResponseCheckpoints(left,right);
   assert.equal(result,saved);assert.equal(result.episode.firstResponse.selected,'t');
   assert.equal(commitLearningResponse(result.episode,{selected:'c',correct:true}),committed);
  }
 }
 const laterEmpty={...initial,events:[{id:'empty-0'},{id:'empty-1'},{id:'empty-2'}]};
 for(const records of [[committed,laterEmpty],[laterEmpty,committed]]) {
  const result=learningResponseEpisodes(records.map(value=>learningResponseCompletionEvent(value)));
  assert.equal(result.length,1);assert.deepEqual(result[0],committed);assert.equal(result[0].firstResponse.isCorrect,false);
 }
});

test('whole episode prefixes preserve model cursor, fresh transfer and terminal completion regardless of clocks', () => {
 const states=[make()];
 states.push(commitLearningResponse(states.at(-1),{selected:'t',correct:false}));
 states.push(advanceLearningResponseReceipt(states.at(-1)));
 states.push(recordLearningGuidedStep(states.at(-1),0));
 states.push(recordLearningGuidedAction(states.at(-1),'c'));
 states.push(commitLearningResponse(states.at(-1),{selected:'r',correct:false}));
 states.push(advanceLearningResponseReceipt(states.at(-1)));
 states.push(recordLearningGuidedStep(states.at(-1),0));
 states.push(recordLearningGuidedAction(states.at(-1),'p'));
 for(let index=1;index<states.length;index++) for(const weaker of states.slice(0,index)) {
  const saved={episode:states[index],updatedAt:'2026-10-02T01:00:00Z',revision:1};
  const later={episode:weaker,updatedAt:'2026-10-02T02:00:00Z',revision:99};
  assert.equal(mergeLearningResponseCheckpoints(saved,later),saved);
  assert.equal(mergeLearningResponseCheckpoints(later,saved),saved);
 }
 for(const [savedEpisode,weaker] of [
  [states[3],{...states[3],guidedCursor:0}],
  [states[4],{...states[4],role:'first_probe',phase:'answer',question,expected:'c'}],
  [states[4],{...states[4],transfer:null}],
  [states.at(-1),{...states.at(-1),phase:'answer',completion:null}]
 ]) {
  const saved={episode:savedEpisode,updatedAt:'2026-10-02T01:00:00Z',revision:1};
  const later={episode:weaker,updatedAt:'2026-10-02T02:00:00Z',revision:99};
  assert.equal(mergeLearningResponseCheckpoints(saved,later),saved);
  assert.equal(mergeLearningResponseCheckpoints(later,saved),saved);
 }
 assert.deepEqual(learningResponseEpisodes(states.map(state=>learningResponseCompletionEvent(state)))[0],states.at(-1));
 assert.deepEqual(learningResponseEpisodes(states.toReversed().map(state=>learningResponseCompletionEvent(state)))[0],states.at(-1));
});

test('model-first null is legitimate, divergent prefixes quarantine and future snapshots stay opaque', () => {
 const model=startLearningWithModel(make()), placed=recordLearningGuidedStep(model,0);
 const transferReady=recordLearningGuidedAction(placed,'c');
 const complete=advanceLearningResponseReceipt(commitLearningResponse(transferReady,{selected:'p',correct:true,supported:true}));
 const snapshot=value=>({schemaVersion:1,episode:value,updatedAt:'2026-10-02T01:00:00Z',revision:1});
 for(const state of [model,placed,transferReady,complete]) {
  assert.equal(state.firstResponse,null);
  assert.equal(mergeLearningResponseCheckpoints(snapshot(state),{...snapshot(make()),revision:99}).episode,state);
 }
 assert.deepEqual(learningResponseEpisodes([model,placed,transferReady,complete].map(state=>learningResponseCompletionEvent(state)))[0],complete);
 const fork={...placed,events:[...placed.events.slice(0,-1),{...placed.events.at(-1),selected:'x'}]};
 assert.equal(mergeLearningResponseCheckpoints(snapshot(placed),{...snapshot(fork),revision:99}).responseConflict,true);
 assert.deepEqual(learningResponseEpisodes([placed,fork].map(state=>learningResponseCompletionEvent(state))),[]);
 const flagged={...snapshot(placed),responseConflict:true};
 assert.equal(mergeLearningResponseCheckpoints(flagged,{...snapshot(transferReady),revision:99}).responseConflict,true);
 const future={...snapshot({...complete,schemaVersion:2,opaque:{keep:true}}),revision:99};
 assert.equal(mergeLearningResponseCheckpoints(snapshot(model),future),future);
});

const replacementQuestion = (id, answer) => ({ ...transfer, id, targetWord:id, choices:[answer,'x','z'], answer });
const transferReady = () => recordLearningGuidedAction(advanceLearningResponseReceipt(commitLearningResponse(make(), { selected:'t', correct:false })), 'c');
test('media replacement retains frozen transfer and original error through reload, repeated failures and reporting', () => {
 const before=transferReady(), first=replacementQuestion('dog','d'), second=replacementQuestion('sun','s');
 const recovered=replaceLearningTransferMedia(before,first,'d','/pig.mp3');
 const again=replaceLearningTransferMedia(JSON.parse(JSON.stringify(recovered)),second,'s','/dog.mp3');
 const complete=advanceLearningResponseReceipt(commitLearningResponse(again,{selected:'s',correct:true,supported:true}));
 assert.deepEqual(recovered.transfer,before.transfer);
 assert.deepEqual(complete.firstQuestion,question);assert.deepEqual(complete.firstResponse,before.firstResponse);
 assert.equal(complete.responses[0].isCorrect,false);assert.equal(complete.responses[1].isCorrect,null);
 assert.deepEqual(complete.transferReplacements.map(entry=>entry.fromQuestion.id),['pig','dog']);
 assert.deepEqual(complete.transferReplacements.map(entry=>entry.question.id),['dog','sun']);
 assert.equal(learningResponseRecoveryIssue(complete),'');
 const snapshots=[make(),before,recovered,again,complete];
 for(const records of [snapshots,snapshots.toReversed()]) assert.deepEqual(learningResponseEpisodes(records.map(state=>learningResponseCompletionEvent(state))),[complete]);
 const saved={episode:complete,updatedAt:'2026-10-02T01:00:00Z'}, stale={episode:before,updatedAt:'2026-10-02T02:00:00Z'};
 assert.equal(mergeLearningResponseCheckpoints(saved,stale),saved);assert.equal(mergeLearningResponseCheckpoints(stale,saved),saved);
});
test('transfer media recovery rejects answered, repeated and wrong-construct replacements', () => {
 const before=transferReady(), first=replacementQuestion('dog','d');
 const recovered=replaceLearningTransferMedia(before,first,'d');
 for(const state of [make(),commitLearningResponse(before,{selected:'p',correct:true}),advanceLearningResponseReceipt(commitLearningResponse(before,{selected:'r',correct:false}))]) assert.equal(replaceLearningTransferMedia(state,first,'d'),state);
 for(const candidate of [question,transfer, {...first,construct:'rhyming'}, {...first,retentionOnly:true}]) assert.equal(replaceLearningTransferMedia(before,candidate,candidate.answer),before);
 assert.equal(replaceLearningTransferMedia(recovered,transfer,'p'),recovered);
});
test('replacement forks, edited history and forged current references stay quarantined', () => {
 const before=transferReady(), recovered=replaceLearningTransferMedia(before,replacementQuestion('dog','d'),'d');
 const fork=replaceLearningTransferMedia(before,replacementQuestion('sun','s'),'s');
 const one={episode:recovered,updatedAt:'2026-10-02T01:00:00Z'}, two={episode:fork,updatedAt:'2026-10-02T02:00:00Z'};
 assert.equal(mergeLearningResponseCheckpoints(one,two).responseConflict,true);
 assert.deepEqual(learningResponseEpisodes([recovered,fork].map(state=>learningResponseCompletionEvent(state))),[]);
 const invalids=[{...recovered,question:transfer}, {...recovered,expected:'wrong'}, {...recovered,transferReplacements:[]}, {...recovered,events:before.events},
  {...recovered,transferReplacements:[{...recovered.transferReplacements[0],fromExpected:'wrong'}]}];
 for(const invalid of invalids){
  assert.equal(learningResponseRecoveryIssue(invalid),'invalid_transfer_recovery');
  assert.deepEqual(learningResponseEpisodes([learningResponseCompletionEvent(invalid)]),[]);
  const poisoned={episode:invalid,updatedAt:'2026-10-02T03:00:00Z'};
  for(const args of [[one,poisoned],[poisoned,one]]) {
   const result=mergeLearningResponseCheckpoints(...args);assert.equal(result.episode,recovered);assert.equal(result.responseConflict,true);
  }
 }
});

test('MAP feedback-only receipts keep an incorrect first response and close without a teaching model', () => {
 const receipt=commitLearningResponse(make('literacy-practice'),{selected:'t',correct:false,feedbackOnly:true});
 assert.equal(receipt.phase,'receipt');assert.equal(receipt.pendingPhase,'complete');
 const complete=advanceLearningResponseReceipt(receipt);
 assert.equal(complete.phase,'complete');assert.equal(complete.firstResponse.isCorrect,false);assert.equal(complete.responses.length,1);
 assert.equal(complete.guidedActions.length,0);
 const old=advanceLearningResponseReceipt(commitLearningResponse(make('literacy-practice'),{selected:'t',correct:false}));
 const migrated=feedbackOnlyLearningReceipt(old);
 assert.equal(migrated.phase,'complete');assert.deepEqual(migrated.firstResponse,old.firstResponse);assert.deepEqual(migrated.responses,old.responses);
 assert.deepEqual(mergeLearningResponseCheckpoints(old,migrated).firstResponse,old.firstResponse);
});
