import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLiteracyMockBank, LITERACY_MOCK_VERSION } from '../../src/data/literacyMockBank.js';
import { auditLiteracyMockItem, currentLiteracyMockAuditItems } from '../../tools/lib/literacyMockContracts.mjs';

const bank=await loadLiteracyMockBank({includeUnavailable:true,contentVersion:LITERACY_MOCK_VERSION});
const admitted=currentLiteracyMockAuditItems(bank);
const copy=q=>structuredClone(q);
const codes=q=>auditLiteracyMockItem(q).map(issue=>issue.code);
const find=predicate=>{const q=admitted.find(predicate);assert.ok(q,'The current admitted bank must supply this real task.');return q;};

test('the audit scopes current admissions including unavailable media and excludes historic, quarantined and noneligible records',async()=>{
  const unavailable={...admitted[0],id:'synthetic-unavailable-admission',mediaReady:false};
  assert.deepEqual(currentLiteracyMockAuditItems([unavailable]),[unavailable],'Unavailable authored media must remain inside the gate.');
  assert.equal(new Set(admitted.map(q=>q.domainId)).size,8);
  const historic=(await loadLiteracyMockBank({includeUnavailable:true,contentVersion:'literacy-mock-v8'}))[0];
  assert.deepEqual(currentLiteracyMockAuditItems([historic,{...admitted[0],adaptiveMixedEligible:false},{...admitted[0],tutorialOnly:true}]),[]);
});

test('the normalized selected key and exact role-to-choice cue mapping are audited directly',()=>{
  const q=copy(find(q=>q.mediaReady&&q.format==='choice'&&q.requiredAudioCues.some(c=>c.role==='choice')));
  assert.deepEqual(codes(q),[]);
  q.answer='not-a-visible-response';
  assert.ok(codes(q).includes('Q-MOCK-KEY'));
  const cue=q.requiredAudioCues.find(c=>c.role==='choice');cue.choiceId='wrong-response-id';
  assert.ok(codes(q).includes('Q-MOCK-AUDIO-CHOICE'));
});

test('a listening stimulus leak and oral-to-letter substitution reproduce the audited defects',()=>{
  const listening=copy(find(q=>q.domainId==='listening'&&q.passage&&q.mediaReady));
  assert.deepEqual(codes(listening),[]);
  listening.displayPassageDuringResponse=true;
  assert.ok(codes(listening).includes('Q-MOCK-LISTENING-LEAK'));
  const sound=copy(find(q=>q.domainId==='sound_awareness'&&q.adaptiveDemand.operation==='compare_medial_vowels'));
  sound.choices=sound.choices.map((choice,index)=>({...choice,label:['a','e','i','o'][index]}));
  assert.ok(codes(sound).includes('Q-MOCK-ORAL-SOUND'));
});

test('capitalization alone cannot identify the key in a two-thought boundary item',()=>{
  const q=copy(find(q=>q.id==='mock.v9.writing.boundary-1'));
  assert.deepEqual(codes(q),[]);
  q.choices=q.choices.map(choice=>choice.id===q.answer?choice:{...choice,label:choice.label.replace(/\.\s+([A-Z])/g,(_,letter)=>`. ${letter.toLowerCase()}`)});
  assert.ok(codes(q).includes('Q-MOCK-BOUNDARY-CUE'));
});

test('scope evidence must retain exact reviewed source/key/foil proof rather than a keyword admission',()=>{
  const q=copy(find(q=>q.constructClaim==='preserve_explicit_scope'));
  assert.equal(codes(q).includes('Q-MOCK-SCOPE-PROOF'),false);
  delete q.taskDemand.proof;
  assert.ok(codes(q).includes('Q-MOCK-SCOPE-PROOF'));
  const wrong=copy(find(q=>q.constructClaim==='preserve_explicit_scope'));
  wrong.taskDemand.proof.retained='A paraphrase that is not the keyed response.';
  assert.ok(codes(wrong).includes('Q-MOCK-SCOPE-PROOF'));
});

test('phonics unit counts, silent e, literal spare foils and compound parts are enforced',()=>{
  for(const operation of ['construct_split_vowel','construct_five_phoneme_team','construct_extended_compound']){
    const q=copy(find(q=>q.adaptiveDemand.operation===operation));
    assert.equal(codes(q).some(code=>code.startsWith('Q-MOCK-PHONICS')),false,q.id);
    q.responseLength++;
    assert.ok(codes(q).includes('Q-MOCK-PHONICS-PROOF'),q.id);
  }
  const split=copy(find(q=>q.adaptiveDemand.operation==='construct_split_vowel'));
  split.taskDemand.proof.phonemes.push('silent e');split.taskDemand.features.phonemeCount++;
  assert.ok(codes(split).includes('Q-MOCK-PHONICS-UNITS'));
  const spares=copy(find(q=>q.adaptiveDemand.operation==='construct_five_phoneme_team'));
  spares.taskDemand.proof.spareTiles[0]=spares.taskDemand.proof.responseTiles[0];
  assert.ok(codes(spares).includes('Q-MOCK-PHONICS-PROOF'));
  const compound=copy(find(q=>q.adaptiveDemand.operation==='construct_extended_compound'));
  compound.taskDemand.proof.compoundParts=['unrelated','parts'];
  assert.ok(codes(compound).includes('Q-MOCK-PHONICS-UNITS'));
});

test('required media fails closed even when the item remains admitted, including pictures in normalized choices',()=>{
  const q=find(q=>q.mediaReady&&q.choices.some(c=>c.image));
  const image=q.choices.find(c=>c.image).image;
  assert.ok(auditLiteracyMockItem(q,{assetExists:file=>file!==image}).some(issue=>issue.code==='Q-MOCK-IMAGE'));
  const audio=copy(q);audio.requiredAudioCues[0].path=null;
  assert.ok(codes(audio).includes('Q-MOCK-AUDIO'));
});
