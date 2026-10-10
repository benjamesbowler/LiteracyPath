import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { selectLiteracyPracticeQuestions, adaptLiteracyPracticePlan, prepareLiteracyPracticeBank, literacyQuestionDemand, literacyAccessibleEntry, LITERACY_PREPARATION_BANK_LIMIT } from '../../src/utils/literacyPracticePlanner.js';
import { LITERACY_PRACTICE_SKILLS, loadLiteracyPracticeBank, presentLiteracyPracticeQuestion, literacyPracticeAudioCues, literacyPracticeRequiredAudioCues, literacyPracticeSavedSkillIds } from '../../src/data/literacyPracticeBank.js';
import { learningStimulusSignature, selectFreshLearningTransfer } from '../../src/utils/learningResponseState.js';
test('scoped banks preserve every focused skill and both levels without unrelated items', async () => {
  const full = await loadLiteracyPracticeBank();
  for (const descriptor of LITERACY_PRACTICE_SKILLS) {
    const bank = await loadLiteracyPracticeBank({ focus: descriptor.id });
    assert.deepEqual(bank, full.filter(item => item.skillId === descriptor.id), descriptor.id);
    const plan = selectLiteracyPracticeQuestions(bank, { focus: descriptor.id, seed: 'scoped' });
    assert.equal(plan.length, 6, descriptor.id);
    assert.ok(plan.every(item => item.skillId === descriptor.id && item.level === 1), descriptor.id);
  }
  for (const focus of [...new Set(LITERACY_PRACTICE_SKILLS.map(skill => skill.domainId))]) {
    const bank = await loadLiteracyPracticeBank({ focus });
    assert.deepEqual(bank, full.filter(item => item.literacyDomainId === focus), focus);
  }
  await assert.rejects(loadLiteracyPracticeBank({ focus: 'missing' }), /available literacy area/);
});
test('saved canonical identities recover only their required banks, including listening and legacy plans', async () => {
  const bank=await loadLiteracyPracticeBank();
  for(const question of bank) assert.ok(literacyPracticeSavedSkillIds({questionIds:[question.id]}).includes(question.skillId),question.id);
  assert.deepEqual(literacyPracticeSavedSkillIds(null),['initial_sounds']);
  assert.equal(literacyPracticeSavedSkillIds({questionIds:['unknown']}),null);
});
async function runResponses(pattern, { progressive = false, previousIds = [], priorQuestions = [], seed = 'adaptive-proof', focus = 'all' } = {}) {
  let bank = await loadLiteracyPracticeBank(progressive && focus === 'all' ? { skillIds: ['initial_sounds'] } : { focus });
  let plan = selectLiteracyPracticeQuestions(bank, { seed, focus, previousIds });
  let session = { id: seed, skillId: focus, index: 0, questionIds: plan.map(q => q.id), previousQuestionIds: previousIds };
  const offered = [], loads = [], history = [];
  for (let i = 0; i < pattern.length; i++) {
    const question = plan[session.index]; offered.push(question);
    session.responseEpisode = { firstQuestion: question };
    if (progressive) {
      let loaded = 0;
      bank = await prepareLiteracyPracticeBank({ session, plan, bank, loadSkill: async focus => { loaded++; loads.push(focus); return loadLiteracyPracticeBank({ focus }); } });
      assert.ok(loaded <= LITERACY_PREPARATION_BANK_LIMIT, 'bounded lazy loading');
    }
    const passages = new Set(priorQuestions.map(q => q.passage).filter(Boolean));
    session.previousQuestionIds = [...new Set([...previousIds, ...bank.filter(q => q.passage && passages.has(q.passage)).map(q => q.id)])];
    const frozen = JSON.stringify(plan.slice(0, session.index + 1));
    const correct = typeof pattern[i] === 'function' ? pattern[i](question, i) : pattern[i];
    const completed = { firstQuestion: question, firstResponse: { evidenceUse: 'independent_practice_response', isCorrect: correct, observedCorrect: correct, responseStatus: 'answered' }, responses: [{question}] };
    ({ session, plan } = adaptLiteracyPracticePlan({ completed, session: {...session, index: session.index + 1}, plan, bank }));
    history.push(JSON.parse(JSON.stringify(session.adaptiveStrands)));
    assert.equal(JSON.stringify(plan.slice(0, session.index)), frozen, 'answered prefix is immutable');
  }
  return { session, plan, offered, loads, history };
}
test('mixed practice keeps a comfortable opening and accessible breadth after forty errors', async () => {
  const { offered, session, plan, loads } = await runResponses(Array(40).fill(false), { progressive: true });
  assert.equal(plan.length,40); assert.equal(offered.length,40);
  assert.equal(offered[0].skillId, 'initial_sounds'); assert.equal(offered[0].formatType, 'FIRST_SOUND'); assert.ok(offered[0].imagePath);
  assert.equal(new Set(offered.map(q => q.literacyDomainId)).size, 8);
  assert.equal(new Set(offered.map(learningStimulusSignature)).size, 40);
  for (const q of offered) {
    const state = session.adaptiveStrands[q.literacyDomainId];
    assert.equal(literacyQuestionDemand(q), state.minimum);
    assert.ok(literacyAccessibleEntry(q, 'all', state), q.id);
  }
  assert.ok(offered.filter(q => q.literacyDomainId === 'reading').every(q => q.passage.split(/\s+/).length <= 12));
  assert.ok(offered.filter(q => q.literacyDomainId === 'listening').every(q => q.passage.split(/\s+/).length <= 40));
  assert.ok(loads.length < 20, 'entry does not import every skill');
});
test('an uneven profile routes each strand from its own responses', async () => {
  const correct = q => ['listening','vocabulary'].includes(q.literacyDomainId);
  const { offered, session, history } = await runResponses(Array(40).fill(correct), { progressive: true });
  assert.equal(session.adaptiveStrands.sound_awareness.tier, 0);
  assert.equal(session.adaptiveStrands.print.tier, 0);
  assert.ok(session.adaptiveStrands.listening.tier > session.adaptiveStrands.listening.minimum);
  assert.ok(session.adaptiveStrands.vocabulary.tier > session.adaptiveStrands.vocabulary.minimum);
  for (let i=1; i<history.length; i++) {
    for (const domain of Object.keys(history[i])) if (domain !== offered[i].literacyDomainId) assert.deepEqual([history[i][domain].tier,history[i][domain].successes,history[i][domain].canProbe], [history[i-1][domain].tier,history[i-1][domain].successes,history[i-1][domain].canProbe]);
  }
});
test('all-correct first and repeated real-loader sittings retain breadth and reach fresh challenges', async () => {
  const first = await runResponses(Array(40).fill(true), { progressive: true, seed: 'exact-repeat-sitting-0' });
  const second = await runResponses(Array(40).fill(true), { progressive: true, seed: 'exact-repeat-sitting-1', previousIds: first.offered.map(q => q.id), priorQuestions: first.offered });
  for (const result of [first, second]) {
    assert.equal(result.offered.length,40);
    assert.equal(new Set(result.offered.map(learningStimulusSignature)).size,40);
    assert.equal(new Set(result.offered.map(q=>q.literacyDomainId)).size, 8);
    assert.ok(new Set(result.offered.map(q=>q.skillId)).size >= 16);
    assert.ok(Math.max(...Object.values(result.offered.reduce((r,q)=>(r[q.skillId]=(r[q.skillId]||0)+1,r),{}))) <= 5);
    assert.ok(result.offered.some(q=>literacyQuestionDemand(q)>result.session.adaptiveStrands[q.literacyDomainId].minimum));
  }
  assert.ok(second.offered.filter(q=>['key_details','listen_key_details'].includes(q.skillId)).length < 12, 'regression: 34 detail items must not recur');
});
test('fully familiar entry stock offers fresh adjacent probes without promoting familiar evidence', async () => {
  const bank = await loadLiteracyPracticeBank();
  const previousIds = bank.filter(q=>literacyQuestionDemand(q)===0).map(q=>q.id);
  const result = await runResponses(Array(40).fill(true), { progressive: true, previousIds });
  assert.equal(result.history[0].sound_awareness.tier,0);
  assert.equal(result.history[0].sound_awareness.successes,0);
  assert.ok(result.offered.some(q=>q.literacyRouting.reason==='fresh_stock_probe' && !previousIds.includes(q.id)));
  assert.ok(result.offered.some(q=>q.literacyDomainId==='sound_awareness' && literacyQuestionDemand(q)>0));
  assert.equal(new Set(result.offered.map(q=>q.literacyDomainId)).size,8);
});
test('exhausted fresh stock after errors stays accessible and explicitly records familiar review', async () => {
  const bank = await loadLiteracyPracticeBank();
  const result = await runResponses(Array(40).fill(false), { progressive:true, previousIds:bank.map(q=>q.id), seed:'known-bank-errors' });
  assert.equal(result.offered.length,40);
  assert.equal(new Set(result.offered.map(learningStimulusSignature)).size,40);
  assert.equal(new Set(result.offered.map(q=>q.literacyDomainId)).size,8);
  for (const item of result.offered) {
    assert.equal(item.literacyRouting.familiar,true);
    assert.ok(item.literacyRouting.itemDemand <= item.literacyRouting.strandDemand);
    assert.equal(item.literacyRouting.freshEligibleCount,0);
    assert.ok(literacyAccessibleEntry(item,'all',result.session.adaptiveStrands[item.literacyDomainId]));
  }
  assert.ok(result.offered.slice(1).every(q=>q.literacyRouting.reason==='familiar_review'));
});
test('a failed speculative import falls through to another suitable bank within the loading bound', async () => {
  const bank = await loadLiteracyPracticeBank({ focus:'initial_sounds' });
  const plan = selectLiteracyPracticeQuestions(bank, { seed:'import-failure' });
  const session = { id:'import-failure', skillId:'all', index:0, responseEpisode:{ firstQuestion:plan[0] } };
  const attempts = [];
  const prepared = await prepareLiteracyPracticeBank({ session, plan, bank, loadSkill:async focus => {
    attempts.push(focus);
    if (attempts.length === 1) throw new Error('transient chunk failure');
    return loadLiteracyPracticeBank({ focus });
  } });
  assert.equal(attempts.length, LITERACY_PREPARATION_BANK_LIMIT);
  assert.equal(new Set(attempts).size, attempts.length, 'do not retry the same failed bank in this preparation call');
  assert.ok(prepared.some(item => item.skillId === attempts[1]));
  assert.ok(bank.every(item => prepared.includes(item)), 'keep the already playable bank');
});
test('six-question area and skill focus remain confined and complete', async () => {
  for (const focus of ['reading','listening','phonics','writing','initial_sounds']) {
    const result = await runResponses(Array(6).fill(false), { progressive:true, focus });
    assert.equal(result.offered.length,6);
    assert.ok(result.offered.every(q=>q.skillId===focus || q.literacyDomainId===focus));
  }
});
test('practice presentation gives passages text and replay while canonical mock modalities are unchanged', async () => {
  const bank=await loadLiteracyPracticeBank();
  for (const source of bank.filter(q=>q.passage && ['reading','listening'].includes(q.literacyModality))) {
    const before=JSON.stringify(source), shown=presentLiteracyPracticeQuestion(source);
    // Selectable words are the complete printed passage inside their response
    // panel; a second passive copy would duplicate that stimulus.
    assert.equal(shown.displayPassageDuringResponse,source.mapInteraction!=='select_text');
    if (source.literacyModality==='listening') {
      assert.equal(shown.allowPassageAudio,true);
      assert.equal(shown.passageAccess,'text_and_audio');
      if (!source.practiceOnly) assert.equal(source.displayPassageDuringResponse,false);
    }
    assert.equal(JSON.stringify(source),before);
  }
  const listening=bank.find(q=>q.literacyModality==='listening');
  assert.ok(literacyPracticeAudioCues(listening).some(cue=>cue.role==='choice'));
  assert.ok(literacyPracticeRequiredAudioCues(listening).some(cue=>cue.role==='passage'));
  assert.ok(literacyPracticeRequiredAudioCues(listening).every(cue=>cue.role!=='choice'));
  const oral=bank.find(q=>q.hideWrittenLabels && q.audioRequirements?.some(cue=>cue.role==='choice'));
  assert.deepEqual(literacyPracticeRequiredAudioCues(oral),literacyPracticeAudioCues(oral));
});
test('vocabulary prompts name their stimulus even when no separate target field is supplied', async () => {
  const bank=await loadLiteracyPracticeBank();
  const questions=bank.filter(q=>q.skillId==='antonyms_synonyms'&&q.level===1&&q.formatType==='LANGUAGE_PAIR_TEXT_CHOICE');
  assert.equal(new Set(questions.map(learningStimulusSignature)).size,questions.length);
  for(const question of questions) assert.ok(selectFreshLearningTransfer(question,questions),question.id);
});
test('supported/familiar correct answers cannot raise demand; no response can lower it', async () => {
  const bank = await loadLiteracyPracticeBank();
  const plan = selectLiteracyPracticeQuestions(bank, { seed:'support' });
  const question=plan[0], base={id:'support',skillId:'all',index:1,questionIds:plan.map(q=>q.id),adaptiveStrands:{sound_awareness:{tier:0,successes:1}}};
  for (const response of [{evidenceUse:'supported_practice',isCorrect:null,observedCorrect:true}, {evidenceUse:'unscored',isCorrect:null,observedCorrect:null,responseStatus:'media_failed'}]) {
    const result=adaptLiteracyPracticePlan({completed:{firstQuestion:question,firstResponse:response,responses:[]},session:base,plan,bank});
    assert.equal(result.session.adaptiveDemand.tier,0); assert.equal(result.session.adaptiveDemand.successes,0);
  }
  const familiar=adaptLiteracyPracticePlan({completed:{firstQuestion:question,firstResponse:{evidenceUse:'independent_practice_response',isCorrect:true},responses:[]},session:{...base,previousQuestionIds:[question.id],adaptiveStrands:{sound_awareness:{tier:0,successes:1}}},plan,bank});
  assert.equal(familiar.session.adaptiveDemand.tier,0);
  assert.equal(familiar.session.adaptiveDemand.successes,0,'familiar or supported work breaks the independent success streak');
  const skipped=adaptLiteracyPracticePlan({completed:{firstQuestion:{...question,level:2},firstResponse:{evidenceUse:'unscored',responseStatus:'no_response'},responses:[]},session:{...base,adaptiveStrands:{sound_awareness:{tier:1,successes:1}}},plan,bank});
  assert.equal(skipped.session.adaptiveDemand.tier,0);
  for (const invalid of [{mediaReady:false}, {validity:'invalid'}, {conflicted:true}, {responseStatus:'media_failed'}]) {
    const result=adaptLiteracyPracticePlan({completed:{firstQuestion:{...question,level:2},firstResponse:{evidenceUse:'independent_practice_response',isCorrect:false,...invalid},responses:[]},session:{...base,adaptiveStrands:{sound_awareness:{tier:1,successes:1}}},plan,bank});
    assert.equal(result.session.adaptiveStrands.sound_awareness.tier,1,'invalid evidence must not move the strand');
    assert.equal(result.session.adaptiveStrands.sound_awareness.canProbe,false);
  }
  const familyQuestion={...question,priorFamilyExposure:true};
  const family=adaptLiteracyPracticePlan({completed:{firstQuestion:familyQuestion,firstResponse:{evidenceUse:'independent_practice_response',isCorrect:true,priorFamilyExposure:true},responses:[]},session:base,plan,bank});
  assert.equal(family.session.adaptiveStrands.sound_awareness.tier,0);
  assert.equal(family.session.adaptiveStrands.sound_awareness.successes,0);
  assert.equal(family.session.adaptiveStrands.sound_awareness.canProbe,true,'valid familiar correctness permits a fresh probe, not promotion');
  const undelivered=adaptLiteracyPracticePlan({completed:{firstQuestion:familyQuestion,firstResponse:{evidenceUse:'independent_practice_response',isCorrect:true,priorFamilyExposure:true,audioRequired:true,audioDelivery:'blocked'},responses:[]},session:base,plan,bank});
  assert.equal(undelivered.session.adaptiveStrands.sound_awareness.canProbe,false);
});
test('legacy global checkpoints seed only the active strand and retired stock cannot re-enter routing', async () => {
  const bank=await loadLiteracyPracticeBank({includeRetired:true});
  const plan=selectLiteracyPracticeQuestions(bank,{seed:'legacy'}), question=plan[0];
  const result=adaptLiteracyPracticePlan({completed:{firstQuestion:question,firstResponse:{evidenceUse:'independent_practice_response',isCorrect:true},responses:[]},session:{id:'legacy',skillId:'all',index:1,adaptiveDemand:{tier:1,successes:0},responseEpisode:null},plan,bank});
  assert.equal(result.session.adaptiveStrands.sound_awareness.tier,1);
  for (const [domain,state] of Object.entries(result.session.adaptiveStrands)) if (domain!=='sound_awareness') assert.equal(state.tier,state.minimum);
  assert.ok(bank.some(item=>item.retiredFromNewPractice),'fixture retains old saved items');
  assert.ok(result.plan.every(item=>!item.retiredFromNewPractice));
});
test('oral stimuli carry semantic identity independently of answer order', () => {
  const a={id:'a',oralStimulus:'Say boat. Take away the first sound.',choices:['oat','bat']};
  assert.notEqual(learningStimulusSignature(a),learningStimulusSignature({...a,id:'b',oralStimulus:'Say sun. Take away the first sound.'}));
  assert.equal(learningStimulusSignature(a),learningStimulusSignature({...a,id:'b',choices:['bat','oat']}));
});
test('adaptive replacement excludes failed media, answered stimuli and taught examples', async () => {
  const bank = await loadLiteracyPracticeBank();
  const plan=selectLiteracyPracticeQuestions(bank,{seed:'failed'}), question=plan[0];
  const forbidden=plan[1];
  const result=adaptLiteracyPracticePlan({completed:{firstQuestion:question,firstResponse:{evidenceUse:'independent_practice_response',isCorrect:false},responses:[{question}]},session:{id:'failed',skillId:'all',index:1,questionIds:plan.map(q=>q.id),failedQuestionIds:[forbidden.id],taughtStimuli:[learningStimulusSignature(plan[2])]},plan,bank});
  assert.ok(result.plan.slice(1).every(q => q.id!==forbidden.id && learningStimulusSignature(q)!==learningStimulusSignature(plan[2])));
  assert.equal(result.plan[0],question);
});

test('the bounded routing inventory stays aligned with all active authored stock', () => {
  assert.match(execFileSync(process.execPath, ['tools/generateLiteracyPracticeRouting.mjs'], {encoding:'utf8'}), /47 skills/);
});
