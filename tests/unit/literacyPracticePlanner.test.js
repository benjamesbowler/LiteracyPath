import assert from 'node:assert/strict';
import test from 'node:test';
import { selectLiteracyPracticeQuestions, adaptLiteracyPracticePlan, nextLiteracyPracticeSkills, literacyQuestionDemand } from '../../src/utils/literacyPracticePlanner.js';
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
async function runResponses(pattern, { progressive = false } = {}) {
  let bank = await loadLiteracyPracticeBank(progressive ? { skillIds: ['initial_sounds'] } : {});
  let plan = selectLiteracyPracticeQuestions(bank, { seed: 'adaptive-proof' });
  let session = { id: 'adaptive-proof', skillId: 'all', index: 0, questionIds: plan.map(q => q.id), previousQuestionIds: [] };
  const offered = [];
  for (const correct of pattern) {
    const question = plan[session.index]; offered.push(question);
    session.responseEpisode = { firstQuestion: question };
    if (progressive) {
      const additions = await Promise.all(nextLiteracyPracticeSkills({ session, plan }).map(focus => loadLiteracyPracticeBank({ focus })));
      bank = [...new Map([...bank, ...additions.flat()].map(q => [q.id, q])).values()];
    }
    const frozen = JSON.stringify(plan.slice(0, session.index + 1));
    const completed = { firstQuestion: question, firstResponse: { evidenceUse: 'independent_practice_response', isCorrect: correct, observedCorrect: correct, responseStatus: 'answered' }, responses: [{question}] };
    ({ session, plan } = adaptLiteracyPracticePlan({ completed, session: {...session, index: session.index + 1}, plan, bank }));
    assert.equal(JSON.stringify(plan.slice(0, session.index)), frozen, 'answered prefix is immutable');
  }
  return { session, plan, offered };
}
test('mixed practice starts with a pictured sound and stays at entry demand after forty wrong responses', async () => {
  const { offered, session, plan } = await runResponses(Array(40).fill(false), { progressive: true });
  assert.equal(plan.length,40); assert.equal(offered.length,40);
  assert.equal(offered[0].skillId, 'initial_sounds'); assert.equal(offered[0].formatType, 'FIRST_SOUND'); assert.ok(offered[0].imagePath);
  assert.ok(offered.every(q => literacyQuestionDemand(q) === 0 && !q.passage));
  assert.equal(new Set(offered.map(learningStimulusSignature)).size, 40);
  assert.equal(session.adaptiveDemand.tier, 0);
});
test('two consecutive fresh successes raise demand; an error lowers the very next question across skills', async () => {
  const { offered } = await runResponses([true,true,true,true,false,false,true,false,true,true,true,true], { progressive: true });
  assert.deepEqual(offered.slice(0,7).map(literacyQuestionDemand), [0,0,1,1,2,1,0]);
  assert.ok(offered.every(q => !q.retentionOnly && q.literacyAudioReady !== false));
});
test('strong responses reach passage/extension tasks and broad coverage without forcing them on a struggling child', async () => {
  const { offered, session } = await runResponses(Array(40).fill(true), { progressive: true });
  assert.deepEqual(offered.slice(0,12).map(literacyQuestionDemand), [0,0,1,1,2,2,3,3,4,4,4,4]);
  assert.equal(offered.length,40); assert.ok(offered.slice(12).every(q=>literacyQuestionDemand(q)===4));
  assert.equal(new Set(offered.map(learningStimulusSignature)).size,40);
  assert.equal(new Set(offered.map(q => q.literacyDomainId)).size, 8);
  assert.equal(session.adaptiveDemand.tier, 4);
});
test('alternating answers never create a success streak or advance to passages', async () => {
  const { offered } = await runResponses(Array.from({length:40}, (_,i) => i%2===0), { progressive: true });
  assert.ok(offered.every(q => literacyQuestionDemand(q) === 0 && !q.passage));
});
test('practice presentation gives passages text and replay while canonical mock modalities are unchanged', async () => {
  const bank=await loadLiteracyPracticeBank();
  for (const source of bank.filter(q=>q.passage && ['reading','listening'].includes(q.literacyModality))) {
    const before=JSON.stringify(source), shown=presentLiteracyPracticeQuestion(source);
    assert.equal(shown.displayPassageDuringResponse,true);
    if (source.literacyModality==='listening') {
      assert.equal(shown.allowPassageAudio,true);
      assert.equal(shown.passageAccess,'text_and_audio');
      assert.equal(source.displayPassageDuringResponse,false);
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
  const question=plan[0], base={id:'support',skillId:'all',index:1,questionIds:plan.map(q=>q.id),adaptiveDemand:{tier:0,successes:1}};
  for (const response of [{evidenceUse:'supported_practice',isCorrect:null,observedCorrect:true}, {evidenceUse:'unscored',isCorrect:null,observedCorrect:null,responseStatus:'media_failed'}]) {
    const result=adaptLiteracyPracticePlan({completed:{firstQuestion:question,firstResponse:response,responses:[]},session:base,plan,bank});
    assert.equal(result.session.adaptiveDemand.tier,0); assert.equal(result.session.adaptiveDemand.successes,0);
  }
  const familiar=adaptLiteracyPracticePlan({completed:{firstQuestion:question,firstResponse:{evidenceUse:'independent_practice_response',isCorrect:true},responses:[]},session:{...base,previousQuestionIds:[question.id],adaptiveDemand:{tier:0,successes:1}},plan,bank});
  assert.equal(familiar.session.adaptiveDemand.tier,0);
  assert.equal(familiar.session.adaptiveDemand.successes,0,'familiar or supported work breaks the independent success streak');
  const skipped=adaptLiteracyPracticePlan({completed:{firstQuestion:{...question,level:2},firstResponse:{evidenceUse:'unscored',responseStatus:'no_response'},responses:[]},session:{...base,adaptiveDemand:{tier:1,successes:1}},plan,bank});
  assert.equal(skipped.session.adaptiveDemand.tier,0);
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
