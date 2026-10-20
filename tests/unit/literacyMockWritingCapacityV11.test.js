import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { loadLiteracyMockBank, normalizeLiteracyMockItem, scoreLiteracyMockResponse } from '../../src/data/literacyMockBank.js';
import { buildLiteracyMockWritingCapacityV11 } from '../../src/data/literacyMockWritingCapacityV11.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';

const base = await loadLiteracyMockBank({ contentVersion:'literacy-mock-v10', includeUnavailable:true });
const normalize = source => normalizeLiteracyMockItem(source,{contentVersion:'literacy-mock-v11'});
const additions = buildLiteracyMockWritingCapacityV11(base,normalize);
const printed = item => [item.prompt,item.passage,item.targetWord,item.canonicalPassageId,item.stimulusKey,item.exposureFamilyId,
  item.taskDemand?.proof?.targetName,...item.choices.map(c=>c.label)].filter(Boolean).join(' ').toLowerCase().match(/[a-z]+/g) || [];

test('twenty short new names add genuine writing-floor capacity beyond every active capitalization stimulus',()=>{
  assert.equal(base.filter(q=>q.adaptiveMixedEligible&&q.domainId==='writing'&&q.adaptiveAreaBand===0).length,32);
  assert.equal(additions.length,20);
  const prior = new Set(base.filter(q=>q.adaptiveMixedEligible&&q.skillId==='capitalization').flatMap(printed));
  assert.equal(new Set(additions.map(q=>q.targetWord.toLowerCase())).size,20);
  for(const q of additions) {
    assert.ok(q.targetWord.length<=3);
    assert.equal(prior.has(q.targetWord.toLowerCase()),false,q.targetWord);
    assert.equal(q.domainId,'writing');assert.equal(q.adaptiveAreaBand,0);
    assert.equal(q.constructClaim,'recognize_name_capital_form');assert.equal(q.taskDemand.operation,'capitalize_name');
    assert.equal(q.taskDemand.reviewed,true);assert.equal(q.taskDemand.proof.targetName,q.targetWord);
    assert.equal(q.exposureFamilyId,`name-capital:${q.targetWord.toLowerCase()}`);
    assert.equal(q.canonicalPassageId,q.exposureFamilyId);assert.equal(q.stimulusKey,q.exposureFamilyId);
    assert.equal(q.sourceProvenance.file,'src/data/literacyMockWritingCapacityV11.js');
  }
});

test('each name has exactly one conventional title case and three diagnostic case errors, with silent print',()=>{
  for(const q of additions) {
    assert.equal(q.choices.length,4);assert.equal(new Set(q.choices.map(c=>c.label)).size,4);
    assert.deepEqual(new Set(q.choices.map(c=>c.label.toLowerCase())),new Set([q.targetWord.toLowerCase()]));
    assert.equal(q.choices.filter(c=>/^[A-Z][a-z]+$/.test(c.label)).length,1);
    for(const c of q.choices) {
      assert.equal(scoreLiteracyMockResponse(q,c.id),c.id===q.answer);
      assert.equal(q.taskDemand.proof.nameCaseForms[c.id],c.label);
      if(c.id!==q.answer)assert.ok(q.distractorRationales[c.id].length>30);
      assert.equal(c.audioPath,undefined);assert.equal(c.image,undefined);
    }
    assert.equal(q.prompt,'Choose the name with one capital at the start.');
    assert.equal(q.requiredAudioCues.length,1);assert.equal(q.requiredAudioCues[0].role,'instruction');
    assert.equal(q.requiredAudioCues[0].text,q.prompt);assert.ok(q.requiredAudioCues[0].path);
    assert.ok(existsSync(new URL(`../../public${q.requiredAudioCues[0].path}`,import.meta.url)));
    assert.equal(q.requiredImagePaths.length,0);assert.equal(q.mediaReady,true);
  }
});

test('all-band capitalization uses or canonical names exclude a target without manufacturing replacement identities',()=>{
  const name=additions[0].targetWord;
  const variant={...base.find(q=>q.adaptiveMixedEligible&&q.skillId==='capitalization'),id:'different-name-case-use',adaptiveAreaBand:1,
    passage:`A parcel arrived for ${name.toUpperCase()}.`,choices:[],targetWord:'',stimulusKey:'other-stimulus',canonicalPassageId:'other-passage'};
  const result=buildLiteracyMockWritingCapacityV11([...base,variant],normalize);
  assert.equal(result.length,19);assert.ok(result.every(q=>q.targetWord!==name));
  const canonical={...variant,passage:'',canonicalPassageId:`name-capital:${name.toLowerCase()}`};
  assert.equal(buildLiteracyMockWritingCapacityV11([...base,canonical],normalize).length,19);
  const seen=buildLiteracyExposureIndex({exposures:[{...additions[0],id:'another-version-or-case-foil-set'}]});
  assert.equal(getLiteracyExposure(additions[0],seen).knownFamiliar,true);
});

test('authoring leaves the complete published input bank unchanged',()=>{
  const before=JSON.stringify(base);
  buildLiteracyMockWritingCapacityV11(base,normalize);
  assert.equal(JSON.stringify(base),before);
});
