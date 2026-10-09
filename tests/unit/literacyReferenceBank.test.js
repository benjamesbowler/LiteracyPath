import test from 'node:test';
import assert from 'node:assert/strict';
import manifest from '../../src/content/literacy-reference/source-manifest.json' with { type: 'json' };
import authored from '../../src/content/literacy-reference/questions.json' with { type: 'json' };
import routing from '../../src/content/literacy-reference/routing.generated.json' with { type: 'json' };
import { loadLiteracyReferenceBank } from '../../src/data/literacyReferenceBank.js';
import { loadLiteracyInteractionBank } from '../../src/data/literacyInteractionBank.js';
import { loadLiteracyPracticeBank, literacyPracticeSavedSkillIds, presentLiteracyPracticeQuestion } from '../../src/data/literacyPracticeBank.js';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { normalizeAssessmentQuestion, getQuestionAnswer, normalizeMultiSelectAnswer } from '../../src/appState/assessmentRuntime.js';
import { auditLiteracyReferenceBank, auditLiteracyReferenceRouting } from '../../tools/lib/literacyReferenceContracts.mjs';
import { adaptLiteracyPracticePlan, literacyQuestionDemand, nextLiteracyPracticeSkills, selectLiteracyPracticeQuestions } from '../../src/utils/literacyPracticePlanner.js';
import { shuffleLearningQuestionChoices } from '../../src/utils/answerPositionShuffle.js';
import { getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';

const bank = loadLiteracyReferenceBank();
test('source coverage accounts for all 64 slides and both blank tasks', () => {
  assert.equal(manifest.coverage.length,64);
  assert.equal(bank.length,148);
  assert.equal(authored.filter(item => item.origin === 'supplied_adaptation').length,99);
  assert.equal(authored.filter(item => item.origin === 'original_partner').length,49);
  for (const row of manifest.coverage) {
    assert.ok(row.status === 'section_heading' || row.itemIds.length, `slide ${row.slide}`);
    for (const id of row.itemIds) assert.ok(authored.some(item => item.id === id));
  }
  for (const slide of [27,35]) assert.equal(manifest.coverage.find(row => row.slide === slide).status,'incomplete_source_completed');
  assert.ok(authored.some(item => item.id === 'compare-birds'));
  assert.ok(authored.some(item => item.id === 'compare-help'));
});
test('the small demand index exactly matches authoring and mixed preloading can reach harder phonics', () => {
  const expected = {};
  for (const item of bank) {
    const prior = expected[item.skillId];
    expected[item.skillId] = { minimum: Math.min(prior?.minimum ?? item.practiceDemand,item.practiceDemand), maximum: Math.max(prior?.maximum ?? item.practiceDemand,item.practiceDemand) };
  }
  assert.deepEqual(routing,expected);
  assert.deepEqual(auditLiteracyReferenceRouting(bank),[]);
  assert.ok(auditLiteracyReferenceRouting(bank,{...routing,blends:{minimum:4,maximum:3}}).some(issue=>issue.code==='Q-REFERENCE-ROUTING'));
  const plan = Array.from({length:40},(_,i)=>({id:`routing-${i}`,skillId:i%2?'main_idea':'listen_main_idea',literacyDomainId:i%2?'reading':'listening',level:1}));
  const session = {skillId:'all',index:7,adaptiveDemand:{tier:3,successes:1},responseEpisode:{firstQuestion:plan[7]}};
  assert.ok(nextLiteracyPracticeSkills({session,plan}).includes('blends'));
});
test('keys survive normalisation and shuffling as exact sets or complete builds', () => {
  for (const item of bank) {
    const normalized = normalizeAssessmentQuestion(item,item.skillId);
    if (item.correctAnswers) {
      assert.equal(normalizeMultiSelectAnswer(item.correctAnswers), normalizeMultiSelectAnswer(getQuestionAnswer(normalized)));
      assert.notEqual(normalizeMultiSelectAnswer(item.choices), normalizeMultiSelectAnswer(getQuestionAnswer(normalized)));
      for (const key of item.correctAnswers) assert.notEqual(normalizeMultiSelectAnswer(item.correctAnswers.filter(value=>value!==key)),normalizeMultiSelectAnswer(getQuestionAnswer(normalized)));
    } else assert.equal(getQuestionAnswer(normalized),item.answer);
    const prepared = shuffleLearningQuestionChoices(normalized,'reference-test');
    assert.equal(JSON.stringify(prepared.correctAnswers),JSON.stringify(item.correctAnswers));
    assert.deepEqual(new Set(prepared.answerOptions.map(option=>option.value)),new Set(item.choices));
  }
  for (const item of bank.filter(item=>item.questionType==='map_word_build')) {
    assert.ok([...item.answer].every(letter=>item.letterTiles.includes(letter)));
    assert.ok(!item.passage.includes(item.answer));
    assert.ok(!item.prompt.includes(item.answer));
  }
});
test('source repairs preserve literal picture labels, context, and local demand', () => {
  const find = id => bank.find(item=>item.sourceProvenance.sourceId===id);
  assert.equal(find('mouse-inside').answer,'mouse 1');
  assert.equal(find('mouse-front').answer,'mouse 3');
  assert.match(find('train-tunnel').prompt,/whole train/);
  assert.ok(find('swimming-story').imageCards.find(card=>card.word==='duck').image.includes('short-u/duck'));
  assert.ok(!find('swimming-story').imageCards.find(card=>card.word==='fish').image.includes('source-20'));
  assert.equal(find('classify-water').answer,'water');
  assert.equal(find('classify-water').practiceDemand,1);
  assert.ok(find('passage-silent').choices.includes('She did not make a sound.'));
  assert.match(find('passage-chameleons').passage,/signals/);
  assert.ok(!find('date-comma').passage.includes('Ghandi'));
  assert.equal(literacyQuestionDemand(find('spell-friends')),4);
  assert.equal(literacyQuestionDemand(find('spell-dock')),2);
  assert.equal(find('spell-dock').level,1);assert.equal(find('spell-duck').level,1);
  for (const item of bank.filter(item=>item.constructClaim==='affix_meaning')) {
    assert.equal(item.passageAudioRole,'word');
    assert.equal(item.passageAudioPath,getLedaWordAudioPath(item.passage));
    assert.equal(item.literacyAudioReady,true);
  }
  for (const item of bank) assert.ok(literacyPracticeSavedSkillIds({questionIds:[item.id]}).includes(item.skillId));
});
test('reading has complete printed evidence and optional narration remains reading support', () => {
  for (const item of bank.filter(item=>item.literacyModality==='reading')) {
    assert.ok(item.passage);
    assert.ok(item.audioRequirements.every(cue=>cue.role==='instruction'));
    assert.equal(item.allowChoiceAudio,false);
    const displayed=presentLiteracyPracticeQuestion(item);
    assert.equal(displayed.displayPassageDuringResponse,true);
    assert.equal(displayed.passage,item.passage);
  }
});
test('category and group-name responses report vocabulary meaning rather than synonym evidence', () => {
  const categories=bank.filter(item=>['category_selection','living_things','tool_category','group_name'].includes(item.constructClaim));
  assert.equal(categories.length,8);
  assert.ok(categories.every(item=>item.skillId==='context_clues'));
});
test('routing adds public reference stock without changing the canonical hosted mock', async () => {
  const base = await loadLiteracyPracticeBank({includeReference:false}),practice=await loadLiteracyPracticeBank();
  assert.equal(practice.length,base.length+bank.length+(await loadLiteracyInteractionBank()).length);
  for (const item of bank) assert.ok(practice.some(q=>q.id===item.id));
  const mock = await loadLiteracyMockBank({includeUnavailable:true});
  assert.equal(mock.length,3958);
  assert.ok(mock.every(item=>!item.id.includes('.reference-')));
  const starter=selectLiteracyPracticeQuestions(practice,{seed:'reference-stock'});
  assert.equal(starter.length,40);assert.equal(starter[0].skillId,'initial_sounds');
  assert.ok(starter.every(item=>literacyQuestionDemand(item)===0));
});
test('every authored question passes the permanent source, media, and exact audio contract', () => {
  assert.deepEqual([...auditLiteracyReferenceRouting(bank),...auditLiteracyReferenceBank(bank)],[]);
});
test('focused routing can reach a ready harder reference spelling then steps down on an error', async () => {
  const base=await loadLiteracyPracticeBank({skillIds:['blends'],includeReference:false});
  // Planner-only readiness fixture: this does not assert delivered audio.
  const references=bank.filter(item=>item.skillId==='blends').map(item=>({...item,literacyAudioReady:true}));
  const stock=[...base,...references],plan=selectLiteracyPracticeQuestions(stock,{seed:'focused-reference',focus:'blends'});
  const first={...plan[0],practiceOnly:true,practiceDemand:3};
  const session={id:'focused-reference',skillId:'blends',index:1,adaptiveDemand:{tier:3,successes:1}};
  const completed={firstQuestion:first,firstResponse:{evidenceUse:'independent_practice_response',isCorrect:true},responses:[{question:first}]};
  const higher=adaptLiteracyPracticePlan({completed,session,plan,bank:stock});
  assert.equal(higher.session.adaptiveDemand.tier,4);
  assert.equal(literacyQuestionDemand(higher.plan[1]),4);
  const lower=adaptLiteracyPracticePlan({completed:{firstQuestion:higher.plan[1],firstResponse:{isCorrect:false},responses:[{question:higher.plan[1]}]},session:{...higher.session,index:2},plan:higher.plan,bank:stock});
  assert.equal(lower.session.adaptiveDemand.tier,3);
  assert.ok(literacyQuestionDemand(lower.plan[2])<=3);
});
test('a lazy forty-turn sitting reaches source spelling and lowers demand immediately after an error', async () => {
  // Readiness is a planner fixture only. The permanent audio contract above
  // still requires actual canonical recordings before these items are usable.
  const readyReferences=bank.map(item=>({...item,literacyAudioReady:true}));
  let stock=await loadLiteracyPracticeBank({skillIds:['initial_sounds'],includeReference:false});
  let plan=selectLiteracyPracticeQuestions(stock,{seed:'reference-mixed'});
  let session={id:'reference-mixed',skillId:'all',index:0};
  const offered=[];
  for(let index=0;index<40;index++) {
    const question=plan[index];offered.push(question);
    session={...session,index,responseEpisode:{firstQuestion:question}};
    const skills=nextLiteracyPracticeSkills({session,plan});
    if(skills.length) {
      const additions=await loadLiteracyPracticeBank({skillIds:skills,includeReference:false});
      stock=[...new Map([...stock,...additions,...readyReferences.filter(item=>skills.includes(item.skillId))].map(item=>[item.id,item])).values()];
    }
    if(index===39) break;
    const correct=index!==17;
    const result=adaptLiteracyPracticePlan({completed:{firstQuestion:question,firstResponse:{evidenceUse:'independent_practice_response',isCorrect:correct},responses:[{question}]},session:{...session,index:index+1},plan,bank:stock});
    plan=result.plan;session=result.session;
    assert.equal(plan.length,40);
    if(!correct) { assert.equal(session.adaptiveDemand.tier,3);assert.ok(literacyQuestionDemand(plan[index+1])<=3); }
  }
  assert.equal(new Set(offered.map(item=>item.id)).size,40);
  assert.deepEqual(offered.slice(0,8).map(literacyQuestionDemand),[0,0,1,1,2,2,3,3]);
  assert.ok(offered.some(item=>item.id.includes('.reference-')&&item.questionType==='map_word_build'));
  assert.ok(literacyQuestionDemand(offered[18])<literacyQuestionDemand(offered[17]));
});
test('the permanent contract rejects lost keys, missing media/audio, and displayed spelling', () => {
  const item=bank.find(item=>item.questionType==='map_multi_select');
  assert.ok(auditLiteracyReferenceBank([{...item,correctAnswers:['not a choice','fish']}]).some(issue=>issue.code==='Q-REFERENCE-SET'));
  assert.ok(auditLiteracyReferenceBank([{...item,imageCards:[]}]).some(issue=>issue.code==='Q-REFERENCE-MEDIA'));
  assert.ok(auditLiteracyReferenceBank([{...item,audioRequirements:[{...item.audioRequirements[0],path:''}]}]).some(issue=>issue.code==='Q-REFERENCE-AUDIO'));
  const build=bank.find(item=>item.questionType==='map_word_build');
  assert.ok(auditLiteracyReferenceBank([{...build,passage:build.answer}]).some(issue=>issue.code==='Q-REFERENCE-BUILD'));
  assert.ok(auditLiteracyReferenceBank([{...item,passageAudioRole:'word',passage:'This is a whole sentence.'}]).some(issue=>issue.code==='Q-REFERENCE-AUDIO'));
});
