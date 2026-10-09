import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { loadLiteracyInteractionBank, listLiteracyInteractionAudioGaps } from '../../src/data/literacyInteractionBank.js';
import { loadLiteracyPracticeBank } from '../../src/data/literacyPracticeBank.js';
import { placeMapTile, mapPracticeResponse, mapPracticeAnswerLabel } from '../../src/utils/mapPracticeResponse.js';
import { collectAssessmentEvidenceImages } from '../../src/policy/assessmentMediaEvidence.js';
import { selectLiteracyPracticeQuestions, adaptLiteracyPracticePlan, literacyQuestionDemand } from '../../src/utils/literacyPracticePlanner.js';
import { learningStimulusSignature } from '../../src/utils/learningResponseState.js';
import { auditLiteracyInteractionBank } from '../../tools/lib/literacyInteractionContracts.mjs';
import art from '../../src/content/literacy-interactions/artwork.json' with { type: 'json' };
const bank = await loadLiteracyInteractionBank();
test('public stock has all applicable literacy interactions, complete media and exact keys', async () => {
  assert.deepEqual(auditLiteracyInteractionBank(bank), []);
  assert.equal(bank.length, 67);
  assert.equal(new Set(bank.map(q => q.id)).size, 67);
  assert.deepEqual(new Set(bank.map(q => q.mapInteraction)), new Set(['order','match','build_word','select_text','picture_choice']));
  assert.deepEqual(await listLiteracyInteractionAudioGaps(), []);
  for (const q of bank) {
    assert.ok(q.practiceOnly && q.literacyAudioReady, q.id);
    assert.ok(q.explanation && q.constructClaim && q.sourceProvenance.file, q.id);
    for (const cue of q.audioRequirements) assert.ok(fs.existsSync('public' + cue.path), q.id);
    if (q.passage) assert.ok(fs.existsSync('public' + q.passageAudioPath), q.id);
    const ordered = ['order','match'].includes(q.mapInteraction);
    if (ordered) {
      const key = JSON.parse(q.answer);
      assert.equal(key.length, q.mapSlots);
      assert.equal(new Set(key).size, key.length);
      assert.equal(mapPracticeResponse(q, key), q.answer);
      assert.notEqual(mapPracticeResponse(q, [...key].reverse()), q.answer);
    }
    if (q.mapInteraction === 'build_word') {
      const tiles = q.answerOptions.slice(0, -1).map(option => option.value);
      assert.equal(mapPracticeResponse(q, tiles), q.answer);
    }
    if (q.constructClaim.startsWith('pictured_') || q.mapInteraction === 'picture_choice') {
      assert.equal(collectAssessmentEvidenceImages(q).length, 3);
      assert.ok(q.answerOptions.every(option => option.image && option.alt));
    }
  }
  for (const asset of art) for (const card of asset.cards) {
    assert.equal(createHash('sha256').update(fs.readFileSync('public' + card.path)).digest('hex'), card.sha256);
    assert.ok(card.bytes < 100000);
  }
});
test('permanent interaction contract rejects set keys, lost text and displayed spelling', () => {
  const order = bank.find(q => q.mapInteraction === 'order');
  const text = bank.find(q => q.mapInteraction === 'select_text');
  const spell = bank.find(q => q.mapInteraction === 'build_word');
  assert.ok(auditLiteracyInteractionBank([{ ...order, correctAnswers: JSON.parse(order.answer) }]).length);
  assert.ok(auditLiteracyInteractionBank([{ ...text, passage: 'Missing printed words.' }]).length);
  assert.ok(auditLiteracyInteractionBank([{ ...spell, passage: spell.answer }]).length);
});
test('moving a tile preserves unique instances, swaps placed tiles and replaces bank tiles', () => {
  assert.deepEqual(placeMapTile(['a','','b'], 'b', 0, 3), ['b','','a']);
  assert.deepEqual(placeMapTile(['a','','b'], 'c', 0, 3), ['c','','b']);
  assert.deepEqual(placeMapTile(['a','','b'], 'a', 1, 3), ['','a','b']);
  assert.deepEqual(placeMapTile(['a','','b'], 'c', -1, 3), ['a','','b']);
  const q = { mapInteraction:'build_word', answerOptions:[{value:'m1',label:'m'},{value:'m2',label:'m'}] };
  assert.equal(mapPracticeResponse(q, ['m1','m2']), 'mm');
  const snapshot={mapInteraction:'order',choices:[{value:'a',label:'Mia waters the soil'},{value:'b',label:'Mia sees a shoot'}]};
  assert.equal(mapPracticeAnswerLabel('["a","b"]',snapshot),'Mia waters the soil → Mia sees a shoot');
  assert.equal(mapPracticeAnswerLabel('a',{...snapshot,mapInteraction:'picture_choice'}),'Mia waters the soil');
});
test('public loader includes interactions while the published mock source excludes them', async () => {
  const publicBank = await loadLiteracyPracticeBank();
  const canonical = await loadLiteracyPracticeBank({includeReference:false});
  assert.equal(publicBank.length, 4113);
  assert.equal(canonical.length,3898);
  assert.ok(bank.every(q => publicBank.some(row=>row.id===q.id)));
  assert.ok(canonical.every(q=>!q.mapInteraction));
});
test('40-question routing samples new forms at eligible demand and errors immediately step down', async () => {
  const full = await loadLiteracyPracticeBank();
  const formats = new Set();
  for (let run = 0; run < 4; run++) {
    let plan = selectLiteracyPracticeQuestions(full, {seed:'formats-'+run});
    let session = {id:'formats-'+run,skillId:'all',index:0,adaptiveDemand:{tier:0,successes:0},previousQuestionIds:[]};
    for (let i=0;i<40;i++) {
      const q=plan[i]; if(q.mapInteraction) formats.add(q.mapInteraction);
      assert.ok(literacyQuestionDemand(q)<=session.adaptiveDemand.tier);
      session={...session,index:i+1};
      const holding = session.adaptiveDemand.tier >= 1 + run % 4;
      ({session,plan}=adaptLiteracyPracticePlan({session,plan,bank:full,completed:{firstQuestion:q,firstResponse:{isCorrect:true,evidenceUse:holding?'supported_practice_response':'independent_practice_response'},responses:[{question:q}]}}));
      assert.equal(plan.length,40);
    }
  }
  for (const format of ['order','match','select_text','build_word','picture_choice']) assert.ok(formats.has(format), format);
  const wordOrders=bank.filter(q=>q.constructClaim==='sentence_word_order');
  assert.equal(new Set(wordOrders.map(learningStimulusSignature)).size,wordOrders.length);
  const plan = selectLiteracyPracticeQuestions(full,{seed:'wrong'});
  const q = bank.find(q=>q.constructClaim==='pictured_story_event_order'&&q.practiceDemand===4);
  plan[0]=q;
  const next=adaptLiteracyPracticePlan({session:{id:'wrong',skillId:'all',index:1,adaptiveDemand:{tier:4,successes:0}},plan,bank:full,
    completed:{firstQuestion:q,firstResponse:{isCorrect:false,observedCorrect:false},responses:[{question:q}]}});
  assert.equal(next.session.adaptiveDemand.tier,3);
  assert.ok(literacyQuestionDemand(next.plan[1])<=3);
});
