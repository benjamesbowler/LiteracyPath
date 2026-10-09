import assert from 'node:assert/strict';
import test from 'node:test';
import { literacyStartingLevel, selectLiteracyPracticeQuestions, adaptLiteracyPracticePlan } from '../../src/utils/literacyPracticePlanner.js';
import { LITERACY_PRACTICE_SKILLS, loadLiteracyPracticeBank, presentLiteracyPracticeQuestion, literacyPracticeAudioCues, literacyPracticeRequiredAudioCues } from '../../src/data/literacyPracticeBank.js';
import { learningStimulusSignature, selectFreshLearningTransfer } from '../../src/utils/learningResponseState.js';
const event = (id, correct, offset = 0, step = {}) => ({ id, gameId: 'literacy-practice', contentVersion: 'literacy-practice-v1', completedAt: new Date(Date.now() - 10000 + offset).toISOString(), steps: [{ questionId: id, skillId: 'key_details', level: 1, presentationRole: 'first_probe', responseStatus: 'answered', evidenceType: 'independent', validity: 'valid', isCorrect: correct, ...step }] });
test('scoped banks preserve every focused skill, both levels and fresh transfer stock without unrelated items', async () => {
  const full = await loadLiteracyPracticeBank();
  for (const descriptor of LITERACY_PRACTICE_SKILLS) {
    const bank = await loadLiteracyPracticeBank({ focus: descriptor.id });
    assert.deepEqual(bank, full.filter(item => item.skillId === descriptor.id), descriptor.id);
    const plan = selectLiteracyPracticeQuestions(bank, { focus: descriptor.id, seed: 'scoped' });
    assert.equal(plan.length, 6, descriptor.id);
    assert.ok(plan.every(item => selectFreshLearningTransfer(item, bank, { excludedIds: plan.map(row => row.id) })), descriptor.id);
  }
  for (const focus of [...new Set(LITERACY_PRACTICE_SKILLS.map(skill => skill.domainId))]) {
    const bank = await loadLiteracyPracticeBank({ focus });
    assert.deepEqual(bank, full.filter(item => item.literacyDomainId === focus), focus);
  }
  await assert.rejects(loadLiteracyPracticeBank({ focus: 'missing' }), /available literacy area/);
});
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
test('every new mixed adventure opens with simple pictured phonics and concrete vocabulary, even after harder prior success', async () => {
  const bank = await loadLiteracyPracticeBank();
  const record = { completions: ['initial_sounds', 'cvc_short_vowels', 'antonyms_synonyms'].flatMap(skillId => [0,1].map(i => event(`${skillId}-${i}`, true, i, {skillId}))) };
  for (let i = 0; i < 20; i++) {
    const plan = selectLiteracyPracticeQuestions(bank, { seed: `entry-${i}`, record, previousIds: bank.slice(0,8).map(q => q.id) });
    assert.deepEqual(plan.slice(0,3).map(q => [q.skillId, q.level]), [['initial_sounds',1],['cvc_short_vowels',1],['antonyms_synonyms',1]]);
    assert.equal(plan[0].formatType, 'FIRST_SOUND');
    assert.equal(plan[1].formatType, 'PICTURE_TO_PRINT_MATCH');
    assert.ok(plan[0].imagePath && plan[1].imagePath);
    assert.equal(new Set(plan.slice(0,8).map(q => q.literacyDomainId)).size, 8);
    for (const first of plan.slice(0,3)) assert.ok(plan.slice(8).some(q => q.skillId === first.skillId), first.skillId);
  }
});
test('a fresh correct response raises a later sample and an error lowers it without rewriting answered questions', () => {
  const q = (id,level) => ({id,skillId:'key_details',level,passage:id,choices:[id,'foil'],formatType:'choice'});
  const first=q('first',1), future=q('future',1);
  const result=adaptLiteracyPracticePlan({completed:{firstQuestion:first,firstResponse:{evidenceUse:'independent_practice_response',isCorrect:true},responses:[]},session:{id:'up',index:1,questionIds:['first','future']},plan:[first,future],bank:[q('hard',2),q('hard-partner',2)]});
  assert.equal(result.plan[0],first);
  assert.equal(result.plan[1].level,2);
  const down=adaptLiteracyPracticePlan({completed:{firstQuestion:result.plan[1],firstResponse:{evidenceUse:'independent_practice_response',isCorrect:false},responses:[]},session:{...result.session,index:2,questionIds:[...result.session.questionIds,'later'],usedQuestionIds:['taught']},plan:[...result.plan,q('later',2)],bank:[q('easy',1),q('easy-partner',1),q('taught',1)]});
  assert.deepEqual(down.plan.slice(0,2),result.plan);
  assert.equal(down.plan[2].level,1);
  assert.notEqual(down.plan[2].id,'taught');
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
