import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLiteracyMockBank, normalizeLiteracyMockItem } from '../../src/data/literacyMockBank.js';
import { buildLiteracyMockPrintCapacityItems } from '../../src/data/literacyMockPrintCapacity.js';
import { literacyMockTaskKey, sameLiteracyMockTask } from '../../src/utils/literacyMockConditions.js';
import { canonicalLiteracyIdentity } from '../../src/utils/literacyEvidence.js';

const bank = (await loadLiteracyMockBank({includeUnavailable:true})).filter(item=>!item.id.startsWith('mock.capacity.print.'));
const additions = buildLiteracyMockPrintCapacityItems(bank).map(source=>normalizeLiteracyMockItem(source));

test('print capacity preserves exact reading task and level with complete unnarrated print evidence', () => {
 assert.equal(additions.length,57);
 assert.equal(new Set(additions.map(item=>item.id)).size,57);
 for (const item of additions) {
  const template=bank.find(source=>source.id===item.sourceProvenance.taskTemplate);
  assert.ok(sameLiteracyMockTask(item,template,{includeLevel:true}),item.id);
  for(const field of ['format','answerMode','modality','evidenceModality','displayPassageDuringResponse','hideWrittenLabels']) assert.equal(item[field],template[field],`${item.id}:${field}`);
  assert.ok(item.passage && item.passage!==template.passage,item.id);
  assert.equal(item.choices.length,3,item.id);
  assert.equal(item.choices.filter(choice=>choice.id===item.answer).length,1,item.id);
  assert.equal(new Set(item.choices.map(choice=>choice.label)).size,3,item.id);
  assert.equal(item.requiredAudioCues.length,1,item.id);
  assert.equal(item.requiredAudioCues[0].role,'instruction',item.id);
  assert.equal(item.requiredAudioCues[0].text,item.prompt,item.id);
  assert.deepEqual(item.requiredImagePaths,[],item.id);
  if(item.textFeature) {
   const feature=item.textFeature;
   assert.equal(item.passage,[feature.title,feature.subtitle,...feature.credits.map(credit=>`${credit.label} ${credit.name}`),feature.context].filter(Boolean).join('\n'),item.id);
   for(const choice of item.choices) assert.ok(item.passage.includes(choice.label),`${item.id}:${choice.label}`);
  }
 }
});

test('print additions complete the seven independent task pools without duplicated cover layouts inside a pool', () => {
 const groups=Map.groupBy(additions,item=>`${literacyMockTaskKey(item)}:${item.level}`);
 assert.equal(groups.size,7);
 for(const [key,rows] of groups) {
  const old=bank.filter(item=>sameLiteracyMockTask(item,rows[0],{includeLevel:true})&&!item.tutorialOnly);
  for(const dimension of ['itemId','passageKey','familyId']) assert.ok(new Set([...old,...rows].map(canonicalLiteracyIdentity).map(value=>value[dimension])).size>=10,`${key}:${dimension}`);
  assert.equal(new Set(rows.map(item=>item.stimulusKey)).size,rows.length,key);
  const layouts=rows.filter(item=>item.textFeature).map(item=>JSON.stringify({labels:item.textFeature.credits.map(credit=>credit.label),
   paired:item.textFeature.credits.map(credit=>credit.name.includes(' and ')),subtitle:Boolean(item.textFeature.subtitle),context:Boolean(item.textFeature.context)}));
  assert.equal(new Set(layouts).size,layouts.length,`${key}: renamed cover layout`);
 }
});
