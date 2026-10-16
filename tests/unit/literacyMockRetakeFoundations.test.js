import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildLiteracyMockRetakeFoundations, listLiteracyMockRetakeFoundationAudioGaps,
  LITERACY_MOCK_V8_HFW_FLOOR_WORDS } from '../../src/data/literacyMockRetakeFoundations.js';
import { normalizeLiteracyMockItem } from '../../src/data/literacyMockBank.js';
import { skillBlueprints } from '../../src/content/blueprints/skillBlueprints.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';

const source = buildLiteracyMockRetakeFoundations();
const cvc = word => /^[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz]$/.test(word);
const lexicon = new Set(JSON.parse(fs.readFileSync(new URL('../../src/content/lexicon/approvedWords.json',import.meta.url),'utf8')).words);

test('new foundation material supplies complete evidence and real-word responses after normalization',()=>{
  assert.equal(new Set(source.map(q=>q.id)).size,source.length);
  for(const q of source){
    const item=normalizeLiteracyMockItem(q,{contentVersion:'literacy-mock-v8'});
    if(item.format==='build_word'){
      assert.equal(item.answer,item.targetWord,q.id);
      assert.deepEqual(item.phonemeTiles,[...item.targetWord],q.id);
      assert.equal(item.responseLength,3,q.id);
    }else{
      assert.equal(item.choices.filter(c=>c.id===item.answer).length,1,q.id);
      assert.equal(new Set(item.choices.map(c=>c.label)).size,item.choices.length,q.id);
      assert.ok(item.distractorRationales&&item.choices.slice(1).every(c=>item.distractorRationales[c.id]),q.id);
    }
    for(const path of item.requiredImagePaths)assert.ok(fs.existsSync(new URL(`../../public${path}`,import.meta.url)),`${q.id}: ${path}`);
    for(const path of item.requiredAudioPaths)assert.ok(fs.existsSync(new URL(`../../public${path}`,import.meta.url)),`${q.id}: ${path}`);
    if(['phonics','reading'].includes(q.domainId)&&q.format!=='build_word')for(const c of q.choices)assert.ok(lexicon.has(c.label.toLowerCase()),`${q.id}: ${c.label}`);
    if(q.evidenceModality.includes('image'))assert.ok(item.requiredImagePaths.length,q.id);
    assert.equal(item.mediaReady,q.requiredAudioCues.every(c=>Boolean(c.path)),q.id);
  }
});

test('dictated builds require every ordered CVC grapheme without speaking or picturing the tiles',()=>{
  const items=source.filter(q=>q.domainId==='phonics'&&q.format==='build_word');
  assert.ok(items.length>=20);
  const owned=new Set(source.filter(q=>['reading','listening'].includes(q.domainId)).map(q=>q.targetWord));
  for(const q of items){
    assert.ok(cvc(q.targetWord),q.id);
    assert.ok(lexicon.has(q.targetWord),q.id);
    assert.equal(owned.has(q.targetWord),false,q.id);
    assert.equal(q.image,undefined,q.id);
    assert.ok(q.requiredAudioCues.every(c=>['instruction','target_word'].includes(c.role)),q.id);
    assert.equal(q.choices.length,5,q.id);
  }
});

test('familiar floor words retain actual HFW membership and isolated recognition demand',()=>{
  const floor=source.filter(q=>q.domainId==='phonics'&&q.foundationBand===0);
  assert.ok(floor.length>=30);
  assert.deepEqual(new Set(floor.map(q=>q.targetWord)),new Set(LITERACY_MOCK_V8_HFW_FLOOR_WORDS));
  for(const q of floor){
    assert.ok(q.targetWord.length<=3,q.id);
    assert.ok(skillBlueprints[q.skillId].unitsByLevel[1].includes(q.targetWord),q.id);
    assert.equal(q.passage,'');
    assert.equal(q.requiredAudioCues.filter(c=>c.role==='target_word').length,1);
    assert.equal(q.requiredAudioCues.some(c=>c.role==='choice'),false);
    assert.equal(q.exposureFamilyId,`hfw-word:${q.targetWord}`);
  }
});

test('picture reading requires full CVC discrimination and never supplies the printed answer in audio',()=>{
  const reading=source.filter(q=>q.domainId==='reading');
  assert.ok(new Set(reading.map(q=>q.targetWord)).size>=21);
  for(const q of reading){
    assert.ok(cvc(q.targetWord),q.id);
    assert.ok(q.choices.every(c=>cvc(c.label)),q.id);
    assert.ok(q.requiredAudioCues.every(c=>c.role==='instruction'),q.id);
    if(q.foundationBand===0)assert.notEqual(q.choices[0].label[0],q.choices[1].label[0],q.id);
    else assert.ok(q.choices.slice(1).some(c=>c.label[0]===q.targetWord[0]),q.id);
  }
});

test('changed band, modality or response options cannot manufacture a fresh lexical target',()=>{
  for(const domain of ['reading','listening','language','vocabulary']){
    const items=source.filter(q=>q.domainId===domain),groups=Map.groupBy(items,q=>q.targetWord);
    for(const [word,rows]of groups){
      assert.equal(rows.length,2,`${domain}:${word}`);
      const index=buildLiteracyExposureIndex({exposures:[rows[0]]});
      assert.equal(getLiteracyExposure(rows[1],index).knownFamiliar,true,`${domain}:${word}`);
    }
  }
  const floor=source.find(q=>q.id==='mock.v8.phonics.familiar.can');
  const read=source.find(q=>q.id==='mock.v8.reading.1.can');
  assert.equal(getLiteracyExposure(read,buildLiteracyExposureIndex({exposures:[floor]})).knownFamiliar,true);
});

test('additional listening reserve uses unprimed object targets with complete word and sentence evidence',()=>{
  const added=new Set(['cookie','crayon','ruler','pizza','scissors','lantern']);
  const tutorialWords=new Set(['cat','cup','hat','dog','the','puppy','sleeps','clouds','cover','moon']);
  for(const word of added){
    assert.equal(tutorialWords.has(word),false);
    const rows=source.filter(q=>q.targetWord===word);
    assert.equal(rows.length,2,word);
    assert.ok(rows.every(q=>q.domainId==='listening'),word);
    const floor=rows.find(q=>q.foundationBand===0),starter=rows.find(q=>q.foundationBand===1);
    assert.ok(floor&&starter,word);
    assert.equal(floor.passage,'');
    assert.equal(floor.requiredAudioCues.find(c=>c.role==='target_word')?.text,word);
    assert.equal(starter.requiredAudioCues.find(c=>c.role==='passage')?.text,starter.passage);
    assert.ok(starter.passage.toLowerCase().split(/[^a-z]+/).includes(word),word);
    assert.ok(rows.every(q=>q.choices.every(c=>c.image&&c.imageAlt)),word);
    assert.equal(floor.choices[0].image,starter.choices[0].image);
    assert.equal(floor.exposureFamilyId,`mock-foundation-word:${word}`);
    assert.equal(starter.exposureFamilyId,floor.exposureFamilyId);
  }
});

test('pending exact audio is discoverable without substituting speech or marking media ready',()=>{
  const gaps=listLiteracyMockRetakeFoundationAudioGaps();
  const gapKeys=new Set(gaps.map(c=>`${c.role}:${c.text}`));
  for(const q of source)for(const cue of q.requiredAudioCues)if(!cue.path){
    const role=cue.role==='passage'?'assessment_passage':cue.role==='instruction'?'assessment_prompt':'isolated_word';
    assert.ok(gapKeys.has(`${role}:${cue.text}`),`${q.id}: ${cue.text}`);
  }
  assert.ok(gaps.every(c=>c.itemIds.length>0));
});
