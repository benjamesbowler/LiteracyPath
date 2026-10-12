import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { loadLiteracyMockBank, scoreLiteracyMockResponse } from '../../src/data/literacyMockBank.js';
import { literacyMockTaskKey } from '../../src/utils/literacyMockConditions.js';
import { buildLiteracyExposureIndex, getLiteracyExposure, canonicalLiteracyIdentity } from '../../src/utils/literacyEvidence.js';
import { PHASE_PASS_RULE } from '../../src/content/blueprints/skillBlueprints.js';

const bank=await loadLiteracyMockBank({includeUnavailable:true,contentVersion:'literacy-mock-v3'});
const added=bank.filter(item=>item.sourceProvenance.kind==='original_mock_capacity'
  && ['reading','listening'].includes(item.domainId));

test('complete reading capacity preserves the exact inherited task and requires literal distinct choices',()=>{
  assert.equal(added.length,548);
  assert.equal(new Set(added.map(item=>item.id)).size,548);
  for(const item of added) {
    const template=bank.find(row=>row.id===item.sourceProvenance.taskTemplate);
    assert.ok(template,item.id);
    const expected=item.modality==='listening'?bank.find(row=>row.skillId===`listen_${template.skillId}`
      && row.constructClaim===`listening_${template.constructClaim}`&&row.level===template.level):template;
    assert.equal(literacyMockTaskKey(item),literacyMockTaskKey(expected),item.id);
    assert.equal(item.level,expected.level,item.id);
    assert.equal(item.format,expected.format,item.id);
    assert.equal(item.answerMode,expected.answerMode,item.id);
    assert.ok(item.passage.trim().length>20,item.id);
    assert.equal(new Set(item.choices.map(choice=>choice.label.normalize('NFKC').toLowerCase())).size,item.choices.length,item.id);
    const answers=Array.isArray(item.answer)?item.answer:[item.answer];
    assert.ok(answers.every(answer=>item.choices.some(choice=>choice.id===answer)),item.id);
    assert.ok(scoreLiteracyMockResponse(item,item.answer),item.id);
    assert.deepEqual(Object.keys(item.distractorRationales).sort(),item.choices.filter(choice=>!answers.includes(choice.id)).map(choice=>choice.id).sort(),item.id);
    assert.ok(Object.values(item.distractorRationales).every(reason=>reason.length>15),item.id);
    assert.ok(item.explanation.length>20,item.id);
  }
});

test('reading stays silent while listening has exact passage and every choice cue',()=>{
  for(const item of added) {
    const cues=item.requiredAudioCues;
    assert.equal(cues.filter(cue=>cue.role==='instruction'&&cue.text===item.prompt).length,1,item.id);
    if(item.modality==='reading') {
      assert.deepEqual(cues.map(cue=>cue.role),['instruction'],item.id);
      assert.equal(item.displayPassageDuringResponse,true,item.id);
      assert.ok(item.choices.every(choice=>!choice.audioPath),item.id);
    } else {
      assert.equal(cues.filter(cue=>cue.role==='passage'&&cue.text===item.passage).length,1,item.id);
      for(const choice of item.choices) assert.equal(cues.filter(cue=>cue.role==='choice'&&cue.choiceId===choice.id&&cue.text===choice.label).length,1,item.id);
      assert.equal(cues.length,item.choices.length+2,item.id);
    }
    assert.equal(item.mediaReady,cues.length>0&&cues.every(cue=>Boolean(cue.path)),item.id);
    assert.equal(item.itemSnapshot.mediaReady,item.mediaReady,item.id);
    assert.equal(item.image,'',item.id);
  }
});

test('Finn uses a complete verified homophone recording only in its listening choice',()=>{
  const pair=added.filter(item=>item.sourceProvenance.sourceId==='entry-picnic-bread');
  assert.equal(pair.length,2);
  const listening=pair.find(item=>item.modality==='listening');
  const reading=pair.find(item=>item.modality==='reading');
  const cue=listening.requiredAudioCues.find(value=>value.role==='choice'&&value.text==='Finn');
  assert.equal(cue.path,'/audio/production/en-US/isolated_word/fin-f8c9abfd8c.mp3');
  assert.equal(cue.recordingProvenance.recordedText,'Fin.');
  assert.equal(cue.recordingProvenance.ipa,'fɪn');
  assert.equal(createHash('sha256').update(readFileSync(new URL(`../../public${cue.path}`,import.meta.url))).digest('hex'),cue.recordingProvenance.sha256);
  assert.equal(listening.choices.find(choice=>choice.label==='Finn').audioPath,cue.path);
  assert.equal(listening.requiredAudioCues.filter(value=>value.recordingProvenance).length,1);
  assert.ok(listening.requiredAudioCues.filter(value=>value.role==='choice'&&value.text!=='Finn').every(value=>value.path!==cue.path));
  assert.deepEqual(reading.requiredAudioCues.map(value=>value.role),['instruction']);
  assert.ok(reading.choices.every(choice=>!choice.audioPath));
  assert.equal(added.flatMap(item=>item.requiredAudioCues).filter(value=>value.recordingProvenance).length,1);
});

test('paired views share actual exposure and cannot supply an independent retest',()=>{
  const families=Map.groupBy(added,item=>item.sourceProvenance.sourceId);
  assert.equal(families.size,414);
  assert.equal([...families.values()].filter(rows=>rows.length===2).length,134);
  assert.equal(new Set([...families.values()].map(rows=>rows[0].stimulusKey)).size,414);
  for(const rows of families.values()) {
    if(rows.length===1) continue;
    assert.deepEqual(new Set(rows.map(row=>row.modality)),new Set(['reading','listening']));
    const [first,second]=rows;
    assert.equal(first.passage,second.passage,first.id);
    assert.deepEqual(first.choices.map(choice=>choice.label),second.choices.map(choice=>choice.label),first.id);
    assert.deepEqual(first.answer,second.answer,first.id);
    assert.deepEqual(canonicalLiteracyIdentity(first),canonicalLiteracyIdentity(second),first.id);
    assert.equal(getLiteracyExposure(second,buildLiteracyExposureIndex({exposures:[first]})).knownFamiliar,true,first.id);
  }
});

test('all current reading and listening task-level-access pools have ten mutually fresh witnesses',()=>{
  const pools=Map.groupBy(bank.filter(item=>!item.tutorialOnly&&['reading','listening'].includes(item.domainId)),item=>JSON.stringify([literacyMockTaskKey(item),item.level]));
  assert.equal(pools.size,139);
  for(const [key,items] of pools) {
    const accepted=[];
    for(const item of items) {
      if(getLiteracyExposure(item,buildLiteracyExposureIndex({exposures:accepted})).knownFamiliar) continue;
      // Stimulus identity is an additional planner conflict, beyond report identity.
      if(accepted.some(row=>row.stimulusKey===item.stimulusKey)) continue;
      accepted.push(item);
    }
    assert.ok(accepted.length>=10,`${key}: ${accepted.length}`);
  }
});

test('two-evidence questions require both supported details and reject a lone or irrelevant detail',()=>{
  const items=added.filter(item=>item.format==='multi_select');
  assert.equal(items.length,6);
  for(const item of items) {
    assert.equal(item.selectCount,2,item.id);
    assert.equal(scoreLiteracyMockResponse(item,['c2','c0']),true,item.id);
    for(const response of [['c0'],['c2'],['c0','c1'],['c0','c2','c3'],['c0','c0']]) assert.equal(scoreLiteracyMockResponse(item,response),false,item.id);
    assert.deepEqual(Object.keys(item.distractorRationales),['c1','c3'],item.id);
  }
});

test('rendered reference features contain the complete table or glossary evidence, including context',()=>{
  for(const item of added.filter(row=>row.textFeature)) {
    const feature=item.textFeature;
    assert.ok(item.passage.includes(feature.title),item.id);
    if(feature.context) assert.ok(item.passage.includes(feature.context),item.id);
    for(const entry of feature.entries) {
      if(feature.kind==='contents') assert.ok(item.passage.includes(`${entry.label} — page ${entry.page}`),item.id);
      else assert.ok(item.passage.includes(`${entry.term}: ${entry.definition}`),item.id);
    }
    if(item.level===2&&feature.kind==='glossary') assert.ok(feature.context,item.id);
  }
});

test('option length alone cannot pass expanded or corrected reading or listening choice pools',()=>{
  const expanded=new Set(added.map(item=>JSON.stringify([literacyMockTaskKey(item),item.level])));
  for(const item of bank.filter(row=>row.level===1&&['where_am_i','listening_where_am_i'].includes(row.constructClaim))) expanded.add(JSON.stringify([literacyMockTaskKey(item),item.level]));
  const pools=Map.groupBy(bank.filter(item=>!item.tutorialOnly&&item.format==='choice'
    &&expanded.has(JSON.stringify([literacyMockTaskKey(item),item.level]))),item=>JSON.stringify([literacyMockTaskKey(item),item.level]));
  for(const [key,items]of pools) for(const measure of [text=>text.length,text=>text.split(/\s+/).length]) for(const rank of [0,1,2,'longest']) {
    const hits=items.reduce((sum,item)=>{
      const lengths=item.choices.map(choice=>measure(choice.label)).sort((a,b)=>a-b);
      const target=rank==='longest'?lengths.at(-1):lengths[rank];
      const ties=item.choices.filter(choice=>measure(choice.label)===target);
      return sum+(ties.some(choice=>choice.id===item.answer)?1/ties.length:0);
    },0);
    assert.ok(hits/items.length<PHASE_PASS_RULE.accuracyMin,`${key}: length rank ${rank} predicts ${hits}/${items.length}`);
  }
});

test('inherited location labels retain exact reading/listening parity without changing the frozen catalogues',async()=>{
  const corrections=[['lp3.inference.l1.C.where_am_i.v3','a library','a lending library'],
    ['lp3.inference.l1.A.where_am_i.v4','a stable','a horse stable']];
  for(const [id,previous,label]of corrections) {
    const reading=bank.find(item=>item.id===id);
    const listening=bank.find(item=>item.id===`listen:${id}`);
    assert.equal(reading.choices.find(choice=>choice.id===reading.answer).label,label);
    assert.deepEqual(reading.choices.map(choice=>choice.label),listening.choices.map(choice=>choice.label));
    assert.equal(reading.passage,listening.passage);
    assert.deepEqual(reading.requiredAudioCues.map(cue=>cue.role),['instruction']);
    assert.equal(listening.requiredAudioCues.find(cue=>cue.choiceId===listening.answer).text,label);
    assert.ok(!listening.requiredAudioCues.some(cue=>cue.text===previous));
    for(const contentVersion of ['literacy-mock-v1','literacy-mock-v2']) {
      const frozen=(await loadLiteracyMockBank({includeUnavailable:true,contentVersion})).find(item=>item.id===id);
      assert.equal(frozen.choices.find(choice=>choice.id===frozen.answer).label,previous);
    }
  }
});
