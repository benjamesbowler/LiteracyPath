import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLiteracyMockBoundaryComprehensionV9, listLiteracyMockBoundaryComprehensionV9AudioGaps, LITERACY_MOCK_V9_BOUNDARY_THEME_ROWS } from '../../src/data/literacyMockBoundaryComprehensionV9.js';
import { literacyMockDemandV9 } from '../../src/policy/literacyMockDemandV9.js';
import { canonicalLiteracyIdentity, buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';

const bank=buildLiteracyMockBoundaryComprehensionV9();
const normalize=value=>value.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();

test('twenty-eight original families add paired one-episode and two-episode stock in both access modes',()=>{
  assert.equal(LITERACY_MOCK_V9_BOUNDARY_THEME_ROWS.length,28);
  assert.equal(new Set(LITERACY_MOCK_V9_BOUNDARY_THEME_ROWS.map(row=>row.id)).size,28);
  assert.equal(bank.length,112);
  assert.equal(new Set(bank.map(q=>q.id)).size,112);
  for(const domain of ['reading','listening'])for(const band of [5,6])assert.equal(bank.filter(q=>q.domainId===domain&&literacyMockDemandV9(q)===band).length,28);
});

test('adding an episode or changing reading/listening access cannot manufacture freshness',()=>{
  for(const members of Map.groupBy(bank,q=>q.exposureFamilyId).values()){
    assert.equal(members.length,4);
    const exposure=buildLiteracyExposureIndex({exposures:[members[0]]});
    for(const sibling of members.slice(1))assert.equal(getLiteracyExposure(sibling,exposure).knownFamiliar,true,sibling.id);
    for(const band of [5,6]){
      const pair=members.filter(q=>literacyMockDemandV9(q)===band);
      assert.equal(pair[0].passage,pair[1].passage);
      assert.deepEqual(pair[0].choices,pair[1].choices);
      assert.deepEqual(canonicalLiteracyIdentity(pair[0]),canonicalLiteracyIdentity(pair[1]));
    }
  }
});

test('two episodes supply separate mistake/repair evidence and true one-episode partial lessons',()=>{
  for(const q of bank){
    const band=literacyMockDemandV9(q),proof=q.taskDemand.proof;
    assert.equal(proof.evidence.length,band===5?1:2);
    assert.equal(proof.evidence.join(' '),q.passage);
    assert.equal(proof.mistakeRepairPairs.length,proof.evidence.length);
    assert.equal(q.taskDemand.features.episodesToIntegrate,proof.evidence.length);
    assert.ok(q.passage.split(/\s+/).length<=110,q.id);
    assert.ok(!normalize(q.passage).includes(normalize(q.choices[0].label)),q.id);
    assert.doesNotMatch(q.passage,/\b(the lesson|this shows|they learned|both learned|the moral)\b/i,q.id);
    if(band===6){
      assert.notEqual(normalize(proof.evidence[0]),normalize(proof.evidence[1]));
      assert.equal(q.taskDemand.features.plausiblePartialLessons,2);
      assert.deepEqual(proof.partialLessons,q.choices.slice(1).map(c=>c.label));
      for(let index=0;index<2;index++){
        assert.ok(proof.foils[index].includes(proof.partialLessons[index]));
        assert.match(proof.foils[index],new RegExp(`episode ${index+1}`));
      }
    }
  }
});

test('response wording has distinct literal keys with mixed answer lengths, not a systematic longest-key shortcut',()=>{
  const readings=bank.filter(q=>q.domainId==='reading');
  let longest=0,shortest=0,tied=0;
  for(const q of readings){
    assert.equal(q.answer,'c0');
    assert.equal(new Set(q.choices.map(c=>normalize(c.label))).size,3);
    assert.ok(q.distractorRationales.c1.length>40&&q.distractorRationales.c2.length>40);
    const lengths=q.choices.map(c=>c.label.split(/\s+/).length);
    if(lengths[0]>Math.max(...lengths.slice(1)))longest++;
    else if(lengths[0]<Math.min(...lengths.slice(1)))shortest++;
    else tied++;
  }
  assert.ok(longest>0&&shortest>0&&tied>0);
  assert.ok(longest<readings.length/3);
  assert.ok(shortest<readings.length/3);
});

test('each original passage belongs to one family and preserves exact protected reading/listening cues',()=>{
  const passages=new Map();
  for(const q of bank){
    const passage=normalize(q.passage);
    if(passages.has(passage))assert.equal(passages.get(passage),q.exposureFamilyId,q.id);
    else passages.set(passage,q.exposureFamilyId);
    assert.equal(q.sourceProvenance.file,'src/data/literacyMockBoundaryComprehensionV9.js');
    assert.equal(q.requiredImagePaths.length,0);
    assert.equal(q.requiredAudioCues.filter(c=>c.role==='instruction').length,1);
    if(q.domainId==='reading'){
      assert.equal(q.displayPassageDuringResponse,true);
      assert.equal(q.requiredAudioCues.length,1);
    }else{
      assert.equal(q.displayPassageDuringResponse,false);
      assert.equal(q.requiredAudioCues.length,5);
      assert.equal(q.requiredAudioCues.find(c=>c.role==='passage').text,q.passage);
      for(const choice of q.choices)assert.equal(q.requiredAudioCues.find(c=>c.choiceId===choice.id).text,choice.label);
    }
    assert.equal(q.mediaReady,q.requiredAudioCues.every(c=>Boolean(c.path)));
  }
});

test('the Leda gap request list deduplicates exact texts and retains every affected item identity',()=>{
  const gaps=listLiteracyMockBoundaryComprehensionV9AudioGaps();
  assert.equal(new Set(gaps.map(gap=>`${gap.role}:${gap.text}`)).size,gaps.length);
  for(const q of bank)for(const cue of q.requiredAudioCues.filter(c=>!c.path)){
    const gap=gaps.find(gap=>gap.text===cue.text);
    assert.ok(gap?.itemIds.includes(q.id),`${q.id}: ${cue.text}`);
  }
});
