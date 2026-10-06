import assert from 'node:assert/strict';
import test from 'node:test';
import { literacyStartingLevel, selectLiteracyPracticeQuestions, adaptLiteracyPracticePlan } from '../../src/utils/literacyPracticePlanner.js';
import { loadLiteracyPracticeBank } from '../../src/data/literacyPracticeBank.js';
import { learningStimulusSignature, selectFreshLearningTransfer } from '../../src/utils/learningResponseState.js';
const event = (id, correct, offset = 0, step = {}) => ({ id, gameId: 'literacy-practice', contentVersion: 'literacy-practice-v1', completedAt: new Date(Date.now() - 10000 + offset).toISOString(), steps: [{ questionId: id, skillId: 'key_details', level: 1, presentationRole: 'first_probe', responseStatus: 'answered', evidenceType: 'independent', validity: 'valid', isCorrect: correct, ...step }] });
test('starting levels use recent independent evidence in time order, not sync insertion order', () => {
  const rows = [event('a', true), event('b', true, 100), event('c', false, 200)];
  assert.equal(literacyStartingLevel('key_details', { completions: rows.slice(0, 2) }), 2);
  assert.equal(literacyStartingLevel('key_details', { completions: [...rows].reverse() }), 1);
  assert.equal(literacyStartingLevel('key_details', { completions: rows.slice(0, 2), completionConflictIds: ['a', 'b'] }), 1);
  assert.equal(literacyStartingLevel('key_details', { completions: [event('a', true, 0, {priorPracticeExposure:true}), event('b', true, 1, {presentationRole:'transfer'})] }), 1);
  assert.equal(literacyStartingLevel('key_details', { completions: [event('a', true, -86400000 * 365), event('b', true, -86400000 * 364)] }), 1);
});
test('mixed adventures sample all eight domains and preserve an available fresh transfer', async () => {
  const bank = await loadLiteracyPracticeBank();
  for (const seed of ['a', 'b', 'c']) {
    const plan = selectLiteracyPracticeQuestions(bank, { seed });
    assert.equal(plan.length, 12);
    assert.equal(new Set(plan.map(q => q.literacyDomainId)).size, 8);
    assert.equal(new Set(plan.map(learningStimulusSignature)).size, 12);
    assert.ok(plan.every(q => !q.retentionOnly && q.literacyAudioReady !== false));
    for (const item of plan) assert.ok(selectFreshLearningTransfer(item, bank.filter(q => q.literacyAudioReady !== false), {excludedIds:plan.map(q => q.id)}), item.id);
  }
});
test('adaptive replacement never inserts unavailable media or a reserved stimulus', () => {
  const q = (id, level, ready = true) => ({ id, skillId:'key_details', level, literacyAudioReady:ready, passage:id, choices:[id,'foil'], formatType:'choice' });
  const first=q('first',2), future=q('future',2), unavailable=q('unavailable',1,false), available=q('available',1);
  const session={ id:'session', index:1, questionIds:['first','future'] };
  const completed={firstQuestion:first,firstResponse:{evidenceUse:'independent_practice_response',isCorrect:false},responses:[]};
  const result=adaptLiteracyPracticePlan({completed,session,plan:[first,future],bank:[unavailable,available,q('partner',1)]});
  assert.ok(['available','partner'].includes(result.plan[1].id));
  assert.equal(result.session.adaptiveSkills.key_details.level,1);
  const supported=adaptLiteracyPracticePlan({completed:{...completed,firstResponse:{evidenceUse:'supported_practice',isCorrect:true}},session,plan:[first,future],bank:[available]});
  assert.equal(supported.session,session);
});
test('oral stimuli carry semantic identity independently of answer order', () => {
  const a={id:'a',oralStimulus:'Say boat. Take away the first sound.',choices:['oat','bat']};
  assert.notEqual(learningStimulusSignature(a),learningStimulusSignature({...a,id:'b',oralStimulus:'Say sun. Take away the first sound.'}));
  assert.equal(learningStimulusSignature(a),learningStimulusSignature({...a,id:'b',choices:['bat','oat']}));
});
test('adaptive first probes reserve separate fresh partners instead of consuming each other', () => {
  const q=(id,level)=>({id,skillId:'key_details',level,passage:id,choices:[id,'foil'],formatType:'choice'});
  const plan=[q('first',2),q('future1',2),q('future2',2),q('future3',2)];
  const bank=['A','B','C','D'].map(id=>q(id,1));
  const result=adaptLiteracyPracticePlan({completed:{firstQuestion:plan[0],firstResponse:{evidenceUse:'independent_practice_response',isCorrect:false},responses:[]},session:{id:'a',index:1,questionIds:plan.map(q=>q.id)},plan,bank});
  const changed=result.plan.filter(q=>q.level===1);
  assert.equal(changed.length,2,'four available questions support two probes plus two transfers');
  const reserved=result.plan.map(q=>q.id);
  for(const question of changed) {
    const transfer=selectFreshLearningTransfer(question,bank,{excludedIds:reserved});
    assert.ok(transfer,question.id);reserved.push(transfer.id);
  }
});
