import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadLiteracyMockBank, normalizeLiteracyMockItem } from '../../src/data/literacyMockBank.js';
import { correctLiteracyMockPhonicsV4, buildLiteracyMockPhonicsLaddersV4 } from '../../src/data/literacyMockPhonicsLaddersV4.js';
import { MOCK_FOUNDATION_PRONUNCIATIONS as cmu } from '../../tools/fixtures/literacyMockFoundationPronunciations.mjs';
import { literacyMockTaskKey, literacyMockFocus, sameLiteracyMockTask } from '../../src/utils/literacyMockConditions.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';
import { selectLiteracyMockFreshCheck, hasIndependentLiteracyMockLadder } from '../../src/utils/literacyMockPlanner.js';

const baseline = await loadLiteracyMockBank({ contentVersion:'literacy-mock-v3', includeUnavailable:true });
const frozenBaseline=JSON.stringify(baseline);
const corrected=baseline.map(correctLiteracyMockPhonicsV4);
const sources=buildLiteracyMockPhonicsLaddersV4(corrected);
const additions=sources.map(normalizeLiteracyMockItem);
const bank=[...corrected,...additions].map(item=>normalizeLiteracyMockItem({...item,contentVersion:'literacy-mock-v4'}));
const key=item=>item.choices.find(choice=>choice.id===item.answer)?.label;
const target=item=>item.targetWord||key(item);
const groups=Map.groupBy(bank.filter(item=>item.mediaReady&&!item.tutorialOnly),literacyMockTaskKey);
const independent=rows=>new Set(rows.map(item=>item.exposureFamilyId||item.stimulusKey)).size;
// Exercise the private v4 planner with the same independently certified marker
// that the version assembler supplies, rather than treating raw sources as an
// already assembled bank. A fixed response task cannot pass this gate.
for(const rows of groups.values()){
  const complete=hasIndependentLiteracyMockLadder(...[1,2].map(level=>rows.filter(item=>item.level===level&&item.demandCeiling!==1)));
  for(const item of rows){
    item.adaptiveMixedEligible=complete&&item.demandCeiling!==1;
    item.itemSnapshot={...item.itemSnapshot,adaptiveMixedEligible:item.adaptiveMixedEligible};
  }
}

// These literal pronunciations are independent of source level lists and
// declared difficulty. The existing reviewed CMU fixture supplies the rest.
const extraPhones={
  hog:'HH AA G',hunt:'HH AH N T',dead:'D EH D',squeak:'S K W IY K',approach:'AH P R OW CH',spotlight:'S P AA T L AY T',
  glass:'G L AE S',zebra:'Z IY B R AH',feather:'F EH DH ER',weather:'W EH DH ER',
  headband:'HH EH D B AE N D',headlight:'HH EH D L AY T',headset:'HH EH D S EH T',headlamp:'HH EH D L AE M P',
  breadbox:'B R EH D B AA K S',breadstick:'B R EH D S T IH K',breadcrumb:'B R EH D K R AH M',
  seaside:'S IY S AY D',seafood:'S IY F UW D',seaweed:'S IY W IY D',
  rake:'R EY K',dad:'D AE D',dam:'D AE M',dab:'D AE B',leak:'L IY K',lean:'L IY N',leap:'L IY P',
  nice:'N AY S',knife:'N AY F',ninth:'N AY N TH',sheet:'SH IY T',sheen:'SH IY N',teen:'T IY N',tear:'T EH R',teach:'T IY CH',
  lime:'L AY M',lice:'L AY S',chain:'CH EY N',chase:'CH EY S',chalk:'CH AO K',tram:'T R AE M',
  greet:'G R IY T',greed:'G R IY D',greek:'G R IY K',streak:'S T R IY K',bride:'B R AY D',brine:'B R AY N',said:'S EH D',had:'HH AE D',
  face:'F EY S',fall:'F AO L',soup:'S UW P',
  candle:'K AE N D AH L',monkey:'M AH NG K IY',lemon:'L EH M AH N',basket:'B AE S K AH T',after:'AE F T ER',salty:'S AO L T IY',
};
const phones=word=>{
  const result=cmu[word]?.arpabet||extraPhones[word]?.split(' ');
  assert.ok(result,`Independent pronunciation missing: ${word}`);return result;
};
const isVowel=phone=>/^(AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)$/.test(phone);
const onset=word=>{const p=phones(word);return p.slice(0,p.findIndex(isVowel));};
const rime=word=>{const p=phones(word);return p.slice(p.findLastIndex(isVowel));};
const coda=word=>rime(word).slice(1);

test('v4 correction and additions preserve v3 authoring and replace stale task snapshots',()=>{
  assert.equal(JSON.stringify(baseline),frozenBaseline);
  assert.equal(new Set(sources.map(item=>item.id)).size,sources.length);
  const old=baseline.find(item=>item.skillId==='final_sounds'&&item.constructClaim==='final_sound_grapheme_mapping');
  const revised=correctLiteracyMockPhonicsV4(old);
  assert.equal(revised.constructClaim,'complete_spoken_word_ending_spelling');
  assert.equal(revised.itemSnapshot,undefined);
  assert.notEqual(literacyMockTaskKey(old),literacyMockTaskKey(revised));
  assert.deepEqual(revised.requiredAudioCues,old.requiredAudioCues);
  assert.equal(old.constructClaim,'final_sound_grapheme_mapping');
  assert.equal(JSON.stringify(baseline),frozenBaseline);
  for(const item of additions){
    assert.equal(item.itemSnapshot.id,item.id);
    assert.equal(item.renderTargetText,false,item.id);
    assert.ok(item.difficultyEvidence,item.id);
    assert.ok(item.mediaDecision.reason,item.id);
  }
});

test('every new required existing asset is exact and ready',()=>{
  const unavailable=additions.filter(item=>!item.mediaReady);
  assert.deepEqual(unavailable,[]);
  for(const item of additions.filter(item=>item.mediaReady)){
    for(const path of [...item.requiredAudioPaths,...item.requiredImagePaths]){
      assert.ok(fs.existsSync(new URL(`../../public${path.split('#')[0]}`,import.meta.url)),`${item.id}: ${path}`);
    }
    const cue=item.requiredAudioCues.find(c=>c.role==='target_word');
    if(cue)assert.equal(cue.text,item.targetWord,item.id);
    if(!item.hideWrittenLabels&&item.format!=='multi_select'&&item.constructClaim!=='compare_spoken_final_phoneme_with_print_support'){
      assert.equal(item.requiredAudioCues.some(c=>c.role==='choice'),false,item.id);
      assert.ok(item.choices.every(c=>!c.audioPath),item.id);
    }
    if(item.format==='choice'){
      assert.equal(new Set(item.choices.map(c=>c.label)).size,item.choices.length,item.id);
      assert.ok(key(item),item.id);
      for(const c of item.choices.filter(c=>c.id!==item.answer))assert.ok(item.distractorRationales[c.id],`${item.id}:${c.label}`);
    }
  }
  const serve=additions.find(item=>item.targetWord==='serve');
  assert.ok(serve.mediaReady);
  assert.ok(serve.requiredAudioCues.find(c=>c.role==='target_word').recordingProvenance);
});

test('CVC reading tiers contrast literal vowel sounds, while construction tiers count spoken phonemes',()=>{
  const sound={a:['AE'],e:['EH'],i:['IH'],o:['AA','AO'],u:['AH']};
  const rows=additions.filter(item=>/^(identify_read_short_vowel_sound|construct_short_vowel_phoneme_sequence):short_[aeiou]$/.test(item.constructClaim));
  assert.ok(rows.length>90);
  for(const item of rows){
    const p=phones(target(item));
    assert.equal(p.filter(isVowel).length,1,item.id);
    assert.ok(p.some(phone=>sound[item.constructClaim.at(-1)].includes(phone)),item.id);
    assert.ok(item.level===1?p.length===3:p.length>=4,item.id);
    if(item.format==='build_word'){
      assert.equal(item.responseLength,p.length,item.id);
      assert.equal(item.choices.map(c=>c.label).join(''),item.answer,item.id);
    }else{
      assert.deepEqual(item.choices.filter(c=>phones(c.label).some(phone=>sound[item.constructClaim.at(-1)].includes(phone))).map(c=>c.id),[item.answer],item.id);
      assert.ok(item.requiredAudioCues.every(c=>c.role==='instruction'),item.id);
      const template=corrected.find(i=>i.id===item.sourceProvenance.taskTemplate);
      assert.deepEqual(item.requiredAudioCues,template.requiredAudioCues,item.id);
      if(item.level===2)assert.ok(item.choices.every(c=>c.label.includes(item.constructClaim.at(-1))),item.id);
    }
  }
  for(const word of ['ship','fish','sock']){
    assert.equal(phones(word).length,3);
    for(const item of bank.filter(i=>i.targetWord===word&&i.constructClaim?.startsWith('construct_short_vowel_phoneme_sequence:')))assert.equal(item.level,1,item.id);
  }
  assert.equal(additions.some(item=>item.targetWord==='fox'&&item.constructClaim.startsWith('construct_short_vowel_phoneme_sequence:')),false);
});

test('vowel-team adaptation requires exact whole-word matching after eliminating an onset shortcut',()=>{
  const rows=additions.filter(item=>item.constructClaim==='spoken_to_real_word_vowel_team_recognition'&&item.level===2);
  assert.equal(rows.length,20);
  for(const item of rows){
    const entry=bank.find(i=>i.constructClaim===item.constructClaim&&i.level===1&&i.targetWord===item.targetWord);
    assert.ok(entry,item.id);assert.ok(sameLiteracyMockTask(entry,item),item.id);
    assert.equal(key(item),item.targetWord,item.id);
    assert.ok(item.choices.every(c=>phones(c.label)[0]===phones(item.targetWord)[0]),item.id);
    assert.deepEqual(item.choices.filter(c=>phones(c.label).join(' ')===phones(item.targetWord).join(' ')).map(c=>c.id),[item.answer],item.id);
    assert.ok(entry.choices.some(c=>phones(c.label)[0]!==phones(item.targetWord)[0]),item.id);
    assert.equal(item.requiredAudioCues.some(c=>c.role==='choice'),false,item.id);
    assert.equal(getLiteracyExposure(item,buildLiteracyExposureIndex({exposures:[entry]})).knownFamiliar,true,item.id);
  }
  for(const item of bank.filter(i=>/^complete_vowel_team_spelling:|^identify_read_vowel_sound:/.test(i.constructClaim))){
    assert.equal(item.level,1,item.id);assert.equal(item.demandCeiling,1,item.id);
  }
});

test('blend matching keeps an exact spoken/pictured key and raises full-word discrimination at both levels',()=>{
  const retained=(word,pattern)=>['nt','mp','nk','lt','ft'].includes(pattern)?word.endsWith(pattern):word.startsWith(pattern);
  const pools=[...groups.values()].filter(rows=>rows[0].constructClaim.startsWith('match_spoken_blend_word:'));
  assert.equal(pools.length,14);
  for(const pool of pools){
    assert.equal(independent(pool.filter(i=>i.level===1)),10);
    assert.equal(independent(pool.filter(i=>i.level===2)),10);
    for(const hard of pool.filter(i=>i.level===2)){
      const entry=pool.find(i=>i.level===1&&i.targetWord===hard.targetWord),pattern=hard.constructClaim.split(':')[1];
      assert.ok(entry,hard.id);assert.ok(sameLiteracyMockTask(entry,hard));
      assert.equal(hard.prompt,'Which word names the picture?');assert.equal(entry.prompt,hard.prompt);
      assert.equal(key(entry),entry.targetWord);assert.equal(key(hard),hard.targetWord);
      assert.equal(hard.image,entry.image);assert.equal(hard.choices.length,entry.choices.length);
      assert.ok(entry.choices.filter(c=>c.id!==entry.answer&&retained(c.label,pattern)).length<=1,entry.id);
      assert.ok(hard.choices.every(c=>retained(c.label,pattern)),hard.id);
      const p=cmu[hard.targetWord]?.arpabet;
      if(p)assert.deepEqual(hard.choices.filter(c=>JSON.stringify(cmu[c.label]?.arpabet)===JSON.stringify(p)).map(c=>c.id),[hard.answer],hard.id);
      assert.equal(getLiteracyExposure(hard,buildLiteracyExposureIndex({exposures:[entry]})).knownFamiliar,true,hard.id);
      const prior=baseline.find(i=>i.skillId==='blends'&&i.targetWord===hard.targetWord&&i.constructClaim===pattern);
      assert.equal(getLiteracyExposure(hard,buildLiteracyExposureIndex({exposures:[prior]})).knownFamiliar,true,hard.id);
    }
  }
});

test('the ten shared blend families support reserved three, entry two, harder two and confirmation three without recycling',()=>{
  const pools=[...groups.values()].filter(rows=>rows[0].constructClaim.startsWith('match_spoken_blend_word:'));
  for(const pool of pools){
    const blocked=pool.filter(i=>i.level===1).slice(0,3),chosen=[];
    for(const[level,count]of[[1,2],[2,2],[2,3]]){
      const result=selectLiteracyMockFreshCheck(bank,{sessionId:'phonics-v4',studentId:'learner',focus:literacyMockFocus(pool.find(i=>i.level===level)),
        exposures:[...blocked,...chosen],itemCount:count,seed:`${pool[0].constructClaim}-${level}-${chosen.length}`});
      assert.equal(result.unavailable,false,pool[0].constructClaim);
      chosen.push(...result.plan.itemIds.map(id=>bank.find(i=>i.id===id)));
    }
    assert.equal(new Set([...blocked,...chosen].map(i=>i.exposureFamilyId)).size,10,pool[0].constructClaim);
  }
});

test('spoken rhyme L2 adds coda phonemes and rejects incomplete or changed rimes; spelling is hidden',()=>{
  const singles=additions.filter(item=>item.skillId==='rhyming'&&item.evidenceModality==='audio');
  assert.equal(singles.filter(i=>i.level===2).length,10);
  for(const item of singles){
    assert.equal(item.hideWrittenLabels,true,item.id);
    assert.ok(item.choices.every(c=>!c.image),item.id);
    assert.deepEqual(item.choices.filter(c=>rime(c.label).join(' ')===rime(item.targetWord).join(' ')).map(c=>c.id),[item.answer],item.id);
    assert.ok(item.level===1?coda(item.targetWord).length===1:coda(item.targetWord).length>=2,item.id);
    assert.equal(item.requiredAudioCues.filter(c=>c.role==='choice').length,item.choices.length,item.id);
    if(item.level===2)assert.ok(item.choices.some(c=>c.id!==item.answer&&phones(c.label).some(p=>rime(item.targetWord).includes(p))),item.id);
  }
  for(const item of additions.filter(i=>i.constructClaim==='spoken_rhyme_pair')){
    const correct=item.answer.map(id=>item.choices.find(c=>c.id===id).label);
    assert.deepEqual(rime(correct[0]),rime(correct[1]),item.id);
    assert.ok(correct.every(word=>coda(word).length>=2),item.id);
    assert.ok(item.choices.every(c=>c.image),item.id);
    for(const foil of item.choices.filter(c=>!item.answer.includes(c.id)))assert.notDeepEqual(rime(foil.label),rime(correct[0]),item.id);
  }
  for(const item of bank.filter(i=>i.skillId==='rhyming'&&['bee','bell','sing'].includes(i.targetWord)))assert.equal(item.level,1,item.id);
});

test('initial and ending operations name the requested phonological unit honestly',()=>{
  const mapping=additions.filter(i=>i.skillId==='initial_sounds'&&i.constructClaim==='initial_sound_grapheme_mapping');
  const letter={f:'F',c:'K',b:'B',d:'D',s:'S',l:'L',r:'R',t:'T',n:'N',p:'P',w:'W',g:'G',v:'V',z:'Z',k:'K',m:'M',o:'OW'};
  for(const item of mapping){
    const p=onset(item.targetWord);assert.ok(p.length>=2,item.id);
    assert.equal(letter[key(item)],p[0],item.id);
    assert.ok(item.choices.some(c=>c.id!==item.answer&&letter[c.label]===p[1]),item.id);
    assert.equal(item.prompt,'Listen to the word. What is the first sound?');
  }
  for(const item of bank.filter(i=>i.skillId==='initial_sounds'&&['apple','astronaut','zero'].includes(i.targetWord)))assert.equal(item.level,1,item.id);
  for(const item of bank.filter(i=>i.constructClaim==='complete_spoken_word_ending_spelling')){
    const answer=key(item),masked=item.prompt.match(/([a-z]+)(_+)/i)?.[0];
    assert.ok(masked,item.id);assert.equal(masked.replace(/_+/,answer).toLowerCase(),item.targetWord.toLowerCase(),item.id);
    if(item.level===2)assert.ok(['nd','nt','nk','st','sk','ft','lt','mp'].includes(answer),item.id);
    if(item.level===2)assert.ok(item.choices.some(c=>c.id!==item.answer&&c.label.endsWith(answer.at(-1))),item.id);
  }
  for(const item of bank.filter(i=>i.constructClaim==='final_sound_discrimination'&&i.level===2)){
    assert.ok(coda(item.targetWord).length>=2,item.id);
    assert.deepEqual(item.choices.filter(c=>phones(c.label).at(-1)===phones(item.targetWord).at(-1)).map(c=>c.id),[item.answer],item.id);
  }
  for(const item of bank.filter(i=>i.constructClaim==='compare_spoken_final_phoneme_with_print_support'&&i.level===2)){
    assert.ok(coda(item.targetWord).length>=2,item.id);
    assert.deepEqual(item.choices.filter(c=>phones(c.label).at(-1)===phones(item.targetWord).at(-1)).map(c=>c.id),[item.answer],item.id);
    assert.equal(item.hideWrittenLabels,false,item.id);
  }
});

test('retained silent-e real-twin contrasts, fixed construction ceilings and e_e finite stock stay honest',()=>{
  const native=baseline.filter(i=>i.constructClaim?.startsWith('identify_read_split_vowel_sound:')&&i.level===2&&i.finiteInventory);
  assert.ok(native.length>=3);
  for(const item of native)assert.equal(correctLiteracyMockPhonicsV4(item).level,2,item.id);
  const e=bank.filter(i=>i.constructClaim==='complete_split_vowel_spelling:e_e');
  assert.equal(independent(e.filter(i=>i.level===1)),3);assert.equal(independent(e.filter(i=>i.level===2)),3);
  for(const item of e)assert.ok(item.finiteInventory,item.id);
  const fixed=bank.filter(i=>i.skillId==='cvc_short_vowels'&&i.constructClaim==='construct_dictated_word');
  for(const item of fixed)assert.equal(item.demandCeiling,1,item.id);
  const source=baseline.find(i=>i.skillId==='digraphs'&&i.targetWord==='chess'&&i.constructClaim==='construct_dictated_word');
  assert.equal(correctLiteracyMockPhonicsV4(source).level,1);
  for(const item of additions.filter(i=>i.skillId==='digraphs'&&i.format==='build_word')){
    assert.ok(phones(item.targetWord).length>=4,item.id);assert.equal(item.responseLength,phones(item.targetWord).length,item.id);
  }
});

test('r-vowel conventional spelling raises same-sound ambiguity with a constant choice count and exact key',()=>{
  for(const item of bank.filter(i=>/^complete_r_controlled_spelling:(er|ir|ur)$/.test(i.constructClaim))){
    const pattern=item.constructClaim.split(':')[1];
    assert.equal(item.choices.length,3,item.id);assert.equal(key(item),pattern,item.id);
    const mask=item.prompt.match(/[a-z]*__+[a-z]*/i)?.[0];
    assert.ok(mask,item.id);assert.equal(mask.replace(/_+/,pattern).toLowerCase(),item.targetWord.toLowerCase(),item.id);
    assert.deepEqual(item.choices.map(c=>c.label).sort(),(item.level===2?['er','ir','ur']:[pattern,'ar','or']).sort(),item.id);
  }
  for(const item of additions.filter(i=>i.level===2))assert.equal(correctLiteracyMockPhonicsV4(item).level,2,item.id);
});

test('every formerly missing CVC read and blend ladder, and each covered sound/phonics skill, has complete fresh capacity',()=>{
  for(const vowel of 'aeiou'){
    const pool=[...groups.values()].find(rows=>rows[0].constructClaim===`identify_read_short_vowel_sound:short_${vowel}`);
    for(const level of [1,2])assert.ok(independent(pool.filter(i=>i.level===level))>=10,`${vowel}: ${level}`);
  }
  const team=[...groups.values()].find(rows=>rows[0].constructClaim==='spoken_to_real_word_vowel_team_recognition');
  for(const level of [1,2])assert.ok(independent(team.filter(i=>i.level===level))>=20,`vowel-team exact word matching: ${level}`);
  for(const skill of ['initial_sounds','final_sounds','rhyming','cvc_short_vowels','blends','digraphs','long_vowels','vowel_teams','r_controlled']){
    assert.ok([...groups.values()].some(rows=>rows[0].skillId===skill&&[1,2].every(level=>independent(rows.filter(i=>i.level===level&&i.demandCeiling!==1))>=3)),skill);
  }
});
