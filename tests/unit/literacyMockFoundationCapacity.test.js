import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadLiteracyMockBank, normalizeLiteracyMockItem } from '../../src/data/literacyMockBank.js';
import { buildLiteracyMockFoundationCapacityItems, MOCK_SHORT_VOWEL_INVENTORY,
  MOCK_FOUNDATION_FINITE_INVENTORIES, literacyMockFoundationFinitePolicy } from '../../src/data/literacyMockFoundationCapacity.js';
import { MOCK_PATTERN_WORDS } from '../../src/data/literacyMockFoundationWords.js';
import { MOCK_FOUNDATION_PRONUNCIATIONS as cmu } from '../../tools/fixtures/literacyMockFoundationPronunciations.mjs';
import { sameLiteracyMockTask } from '../../src/utils/literacyMockConditions.js';

const bank = (await loadLiteracyMockBank({ includeUnavailable: true }))
  .filter(item => item.sourceProvenance.kind !== 'original_mock_foundation_capacity');
const additions = buildLiteracyMockFoundationCapacityItems(bank).map(item => normalizeLiteracyMockItem(item));
const lexicon = JSON.parse(fs.readFileSync(new URL('../../src/content/lexicon/approvedWords.json', import.meta.url)));

test('serve spelling probes use the verified complete word recording without narrating choices', async () => {
  const {createHash}=await import('node:crypto');
  const items=additions.filter(item=>item.targetWord==='serve');
  assert.equal(items.length,3);
  for(const item of items) {
    const cue=item.requiredAudioCues.find(value=>value.role==='target_word');
    assert.equal(cue.text,'serve');
    assert.equal(cue.path,'/audio/production/en-US/isolated_word/serve-70969b02b3.mp3');
    assert.equal(cue.recordingProvenance.recordedText,'Serve');
    assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../../public'+cue.path,import.meta.url))).digest('hex'),cue.recordingProvenance.sha256);
    assert.deepEqual(item.requiredAudioCues.map(value=>value.role),['instruction','target_word']);
    assert.ok(item.choices.every(choice=>!choice.audioPath));
    assert.ok(item.stimulusKey.includes('serve'));
  }
  assert.equal(additions.flatMap(item=>item.requiredAudioCues).filter(cue=>cue.recordingProvenance).length,3);
});

test('controlled short-vowel probes use reviewed mappings and preserve exact task conditions', () => {
  for (const [pattern, levels] of Object.entries(MOCK_SHORT_VOWEL_INVENTORY)) {
    for (const word of Object.values(levels).join(' ').split(' ')) {
      assert.ok(lexicon.words.includes(word), word);
      assert.ok(lexicon.phonics[pattern].includes(word), `${pattern}:${word}`);
    }
  }
  for (const item of additions) {
    const template = bank.find(row => row.id === item.sourceProvenance.taskTemplate);
    assert.ok(sameLiteracyMockTask({ ...template, level: item.sourceProvenance.taskTemplateLevel || template.level }, item, { includeLevel: true }), item.id);
    assert.equal(item.tutorialOnly, false);
    assert.equal(item.canonicalItemId, item.id);
    assert.equal(item.sourceItemId, item.id);
    assert.equal(item.itemSnapshot.stimulusKey, item.stimulusKey);
    assert.ok(item.difficultyEvidence);
    for (const image of item.requiredImagePaths) {
      if (image.startsWith('/images/assessment/literacy-mock/capacity/foundation-')
        && !fs.existsSync(new URL(`../../public${image}`, import.meta.url))) {
        assert.equal(item.mediaDecision.constructReview, 'pending');
      } else assert.ok(fs.existsSync(new URL(`../../public${image.split('#')[0]}`, import.meta.url)), image);
    }
  }
  assert.equal(new Set(additions.map(item => item.id)).size, additions.length);
});

test('vowel completions have a literal spelling key and protected printed alternatives', () => {
  for (const item of additions.filter(row => row.constructClaim.startsWith('complete_short_vowel_spelling:'))) {
    const answer = item.choices.find(choice => choice.id === item.answer).label;
    const masked = item.prompt.match(/completes (\w+)\?/)[1];
    assert.equal(masked.replace('_', answer), item.targetWord, item.id);
    assert.equal(item.requiredAudioCues.filter(cue => cue.role === 'target_word').length, 1);
    assert.equal(item.requiredAudioCues.find(cue => cue.role === 'target_word').text, item.targetWord);
    assert.equal(item.requiredAudioCues.some(cue => cue.role === 'choice'), false);
    assert.ok(item.choices.every(choice => !choice.audioPath));
    const template = bank.find(row => row.id === item.sourceProvenance.taskTemplate);
    assert.equal(Boolean(item.image), Boolean(template.image), item.id);
  }
});

test('new print questions score actual boundaries and never narrate their evidence', () => {
  const print = additions.filter(item => item.skillId === 'print_concepts');
  const passages = print.map(item => item.passage).filter(Boolean);
  assert.equal(new Set(passages).size, passages.length);
  for (const item of print) {
    assert.ok(item.requiredAudioCues.every(cue => cue.role === 'instruction' && cue.text === item.prompt));
    const answer = item.choices.find(choice => choice.id === item.answer);
    if (item.constructClaim === 'word_spaces') assert.equal(Number(answer.label), item.passage.trim().split(/\s+/).length);
    if (item.format === 'select_text') {
      const words = item.passage.split(/\s+/);
      assert.equal(answer.tokenIndex, item.constructClaim === 'first_word' ? 0 : words.length - 1);
      for (const choice of item.choices) assert.equal(choice.label, words[choice.tokenIndex]);
    }
    if (item.constructClaim === 'word_vs_letter') assert.equal(answer.label.split(/\s+/).length, item.level === 1 ? 1 : 2);
    if (item.sourceProvenance.sourceId.startsWith('tracking.')) {
      const words = item.passage.split(/\s+/).map(word => word.replace(/[.,!?]$/, ''));
      if (item.level === 2) assert.equal(answer.label, item.passage.split('\n')[1].split(' ')[0]);
      else assert.equal(answer.label, words[words.indexOf(item.prompt.match(/after (\w+)\?/)[1]) + 1]);
      assert.equal(new Set(item.choices.map(choice => choice.label)).size, item.choices.length);
    }
  }
});

test('new dictated builds preserve grapheme units and a single literal spelling', () => {
  for (const item of additions.filter(row => row.format === 'build_word')) {
    assert.equal(item.answer, item.targetWord);
    if(item.constructClaim==='construct_dictated_word')assert.equal(item.responseLength,3);
    else assert.ok(item.responseLength>=4,item.id);
    const paths = [];
    const visit = (text, chosen) => {
      if (chosen.length === item.responseLength) { if (text === item.answer) paths.push(chosen); return; }
      for (const choice of item.choices) if (!chosen.includes(choice.id) && item.answer.startsWith(text + choice.label)) visit(text + choice.label, [...chosen, choice.id]);
    };
    visit('', []);
    assert.equal(paths.length, 1, item.id);
    const parts = paths[0].map(id => item.choices.find(choice => choice.id === id).label);
    if(item.constructClaim==='construct_dictated_word')assert.equal(parts.filter(part => part.length > 1).length, item.skillId === 'cvc_short_vowels' ? 0 : item.level);
    else assert.equal(cmu[item.targetWord].arpabet.length,parts.length,item.id);
    assert.equal(item.requiredAudioCues.some(cue => cue.role === 'choice'), false);
    assert.equal(item.requiredAudioCues.find(cue => cue.role === 'target_word').text, item.answer);
    assert.equal(Boolean(item.image),Boolean(bank.find(row=>row.id===item.sourceProvenance.taskTemplate).image),item.id);
  }
});

test('sentence location and counting use different tasks and literal punctuation evidence', () => {
  const end = bank.find(item => item.id === 'literacy.print_concepts.sentence-end');
  const count = bank.find(item => item.id === 'literacy.print_concepts.two-sentences');
  assert.equal(sameLiteracyMockTask(end, count), false);
  for (const item of additions.filter(row => row.sourceProvenance.sourceId.startsWith('sentences.'))) {
    const answer = item.choices.find(choice => choice.id === item.answer).label;
    const sentences = item.passage.split(/[.!?]+/).map(text => text.trim()).filter(Boolean);
    if (item.constructClaim === 'sentence_count') assert.equal(Number(answer), sentences.length, item.id);
    else assert.equal(answer, sentences[0].split(/\s+/).at(-1), item.id);
    assert.equal(new Set(item.choices.map(choice => choice.label)).size, item.choices.length);
  }
});

test('case matching migrates from ungated triples to 26 explicit letter targets', () => {
  const sourceSets = bank.filter(item => item.id.startsWith('mock.letters.'));
  assert.equal(sourceSets.length, 7);
  assert.ok(sourceSets.every(item => item.tutorialOnly));
  const probes = additions.filter(item => item.constructClaim === 'letter_case_correspondence');
  for (const level of [1, 2]) {
    const rows = probes.filter(item => item.level === level);
    assert.equal(rows.length, 26);
    assert.equal(new Set(rows.map(item => item.stimulusKey)).size, 26);
    for (const item of rows) {
      assert.equal(item.matchTargets.length, 1);
      assert.equal(item.answer.length, 1);
      const letter = item.matchTargets[0].label.toLowerCase();
      assert.equal(item.choices.find(choice => choice.id === item.answer[0]).label, letter);
      assert.equal(item.stimulusKey, `letter-case:${letter}`);
      assert.equal(item.exposureFamilyId, `letter-case:${letter}`);
      assert.equal(item.finiteInventory.maximumIndependentTargets, 26);
      const sibling = probes.find(other => other.level !== level && other.stimulusKey === item.stimulusKey);
      assert.equal(sibling.exposureFamilyId, item.exposureFamilyId);
    }
  }
});

test('missing required recordings remain unavailable and finite e_e inventory is not padded', () => {
  const source = additions.find(item => item.skillId === 'cvc_short_vowels');
  const missing = normalizeLiteracyMockItem({ ...source,
    requiredAudioCues: source.requiredAudioCues.map(cue => ({ ...cue, path: '' })) });
  assert.equal(missing.mediaReady, false);
  assert.equal(additions.some(item => item.constructClaim === 'complete_split_vowel_spelling:e_e'), false);
  assert.equal(MOCK_FOUNDATION_FINITE_INVENTORIES[0].policy, 'exposure_only');
  assert.deepEqual(MOCK_FOUNDATION_FINITE_INVENTORIES[0].reviewedTargets,
    ['theme', 'scene', 'these', 'complete', 'concrete', 'athlete']);
});

test('only an explicitly supplied per-word target receives the closed lexical policy', () => {
  const supplied = bank.filter(item => item.skillId.startsWith('hfw_')
    && item.constructClaim === item.targetWord && item.requiredAudioCues.some(cue => cue.role === 'target_word' && cue.text === item.targetWord));
  assert.ok(supplied.some(item => item.format === 'choice'));
  assert.ok(supplied.some(item => item.format === 'build_word'));
  for (const item of supplied) {
    const policy = literacyMockFoundationFinitePolicy(item);
    assert.equal(policy.maximumIndependentTargets, 1, item.id);
    assert.deepEqual(policy.controlledTargets, [item.targetWord]);
    assert.equal(literacyMockFoundationFinitePolicy({ ...item,
      requiredAudioCues: item.requiredAudioCues.filter(cue => cue.role !== 'target_word') }), null, item.id);
    assert.equal(literacyMockFoundationFinitePolicy({ ...item,
      constructClaim: 'infer_word_from_sentence_context' }), null, item.id);
  }
  const broad = bank.filter(item => item.constructClaim === 'spoken_to_print_high_frequency_word_recognition');
  assert.ok(broad.length);
  assert.ok(broad.every(item => literacyMockFoundationFinitePolicy(item) === null));
  const choice = supplied.find(item => item.format === 'choice');
  const build = supplied.find(item => item.format === 'build_word' && item.targetWord === choice.targetWord);
  assert.ok(build);
  assert.equal(sameLiteracyMockTask(choice, build, { includeLevel: true }), false);
  assert.equal(choice.canonicalPassageId, build.canonicalPassageId);
});

test('all added vowel patterns use real reviewed words and the declared pronunciation', () => {
  const sounds = { long_a: 'EY', long_e: 'IY', long_i: 'AY', long_o: 'OW', moon: 'UW', cloud: 'AW', coin: 'OY', saw: 'AO' };
  for (const [claim, levels] of Object.entries(MOCK_PATTERN_WORDS)) {
    const [, pattern, sound] = claim.split(':');
    for (const word of Object.values(levels).join(' ').split(' ')) {
      assert.ok(lexicon.words.includes(word), word);
      assert.ok(cmu[word], word);
      if (sound) assert.ok(cmu[word].arpabet.includes(sounds[sound]), `${word}:${sound}`);
      if (pattern.includes('_')) assert.ok(lexicon.phonics[pattern].includes(word), `${word}:${pattern}`);
      else assert.equal(word.split(pattern).length - 1, 1, `${word} must hide its only ${pattern} occurrence`);
    }
  }
  for (const item of additions.filter(item => item.sourceProvenance.sourceId.startsWith('pattern.'))) {
    const pattern = item.choices.find(choice => choice.id === item.answer).label;
    const masked = item.prompt.match(/completes? (\w+)\?/)[1];
    const rebuilt = pattern.includes('_') ? masked.replace('_', pattern[0]).replace('_', 'e')
      : masked.replace('_'.repeat(pattern.length), pattern);
    assert.equal(rebuilt, item.targetWord, item.id);
    assert.equal(item.requiredAudioCues.some(cue => cue.role === 'choice'), false);
    if (item.level === 2 && ['er', 'ir', 'ur'].includes(pattern)) {
      assert.ok(['er', 'ir', 'ur'].every(value => item.choices.some(choice => choice.label === value)));
    }
  }
});

test('spoken operations and pictured comparisons agree with pinned independent pronunciations', () => {
  const phones = word => { assert.ok(cmu[word], word); return cmu[word].arpabet; };
  const soundItems = additions.filter(item => /^(oral\.|rhyme-pair\.|final\.)/.test(item.sourceProvenance.sourceId));
  for (const item of soundItems) {
    for (const choice of item.choices) assert.ok(lexicon.words.includes(choice.label), choice.label);
    const answerIds = Array.isArray(item.answer) ? item.answer : [item.answer];
    const answers = item.choices.filter(choice => answerIds.includes(choice.id)).map(choice => choice.label);
    const speech = item.requiredAudioCues.find(cue => cue.role === 'instruction').text;
    const op = item.constructClaim;
    let expected;
    if (op === 'substitute_initial' || op === 'substitute_final') {
      const match = speech.match(/^Say (\w+)\. Change its (first|last) sound to the (?:first|last) sound in (\w+)\.$/);
      assert.ok(match, item.id);
      expected = [...phones(match[1])];
      expected[match[2] === 'first' ? 0 : expected.length - 1] = phones(match[3])[match[2] === 'first' ? 0 : phones(match[3]).length - 1];
    } else if (op === 'delete_phoneme') {
      expected = phones(speech.match(/^Say (\w+)\./)[1]).slice(1);
    } else if (op === 'add_phoneme') {
      const [, word, anchor] = speech.match(/^Say (\w+)\. Add the first sound in (\w+) /);
      expected = [phones(anchor)[0], ...phones(word)];
    }
    if (expected) {
      assert.deepEqual(phones(answers[0]), expected, item.id);
      assert.equal(item.choices.filter(choice => JSON.stringify(phones(choice.label)) === JSON.stringify(expected)).length, 1, item.id);
    }
    if (item.sourceProvenance.sourceId.startsWith('final.')) {
      const final = phones(item.targetWord).at(-1);
      assert.equal(phones(answers[0]).at(-1), final, item.id);
      assert.equal(item.choices.filter(choice => phones(choice.label).at(-1) === final).length, 1, item.id);
    }
    if (item.sourceProvenance.sourceId.startsWith('rhyme-pair.')) {
      const rime = word => { const p = phones(word); const index = p.findLastIndex(sound => /^(AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)$/.test(sound)); return p.slice(index).join(' '); };
      assert.equal(rime(answers[0]), rime(answers[1]), item.id);
      const groups = new Map();
      for (const choice of item.choices) groups.set(rime(choice.label), (groups.get(rime(choice.label)) || 0) + 1);
      assert.deepEqual([...groups.values()].sort(), [1, 1, 2], item.id);
    }
    if (op === 'blend_phonemes') {
      assert.equal(item.requiredAudioCues.filter(cue => cue.role === 'phoneme').length, 4);
      assert.ok(item.requiredAudioCues.every(cue => cue.role !== 'target_word'));
      assert.equal(item.targetWord, '');
    }
  }
});

test('new printed vowel choices have one independent pronunciation key and no spoken answer', () => {
  const added = additions.filter(item => item.sourceProvenance.file === 'src/data/literacyMockFoundationReadingCapacity.js');
  assert.ok(added.length > 250);
  const vowelSet = new Set(['AA','AE','AH','AO','AW','AY','EH','ER','EY','IH','IY','OW','OY','UH','UW']);
  const vowels = word => {
    assert.ok(cmu[word]?.arpabet, `Missing independent pronunciation: ${word}`);
    return cmu[word].arpabet.filter(p => vowelSet.has(p));
  };
  const expected = { a:['AE'], e:['EH'], i:['IH'], o:['AA','AO'], u:['AH'],
    long_a:['EY'], long_e:['IY'], long_i:['AY'], long_o:['OW'], short_e:['EH'],
    moon:['UW'], cloud:['AW'], coin:['OY'], saw:['AO','AA'], ar:['AA'], or:['AO'], er:['ER'], ir:['ER'], ur:['ER'] };
  for (const item of added) {
    assert.equal(item.requiredAudioCues.some(c=>c.role==='choice'), false, item.id);
    assert.ok(item.choices.every(c=>!c.audioPath),item.id);
    if (item.constructClaim.startsWith('identify_heard_')) {
      const target=item.targetWord, pattern=item.constructClaim.split(':')[1];
      assert.ok(target.includes(pattern),item.id);
      assert.ok(vowels(target).some(v=>expected[pattern].includes(v)),item.id);
      continue;
    }
    const claim=item.constructClaim, parts=claim.split(':');
    const sounds=expected[claim.startsWith('identify_read_short_')?parts[1].at(-1):parts.at(-1)];
    assert.ok(sounds,item.id);
    const keys=item.choices.filter(c=> {
      const matches=vowels(c.label).some(v=>sounds.includes(v));
      return claim.startsWith('exclude_')?!matches:matches;
    });
    assert.deepEqual(keys.map(c=>c.id),[item.answer],item.id);
    for(const c of item.choices)assert.ok(lexicon.words.includes(c.label),c.label);
    if(item.targetWord) {
      assert.ok(vowels(item.targetWord).some(v=>sounds.includes(v)),item.id);
      assert.notEqual(item.choices.find(c=>c.id===item.answer).label,item.targetWord,item.id);
    }
  }
});

test('new spoken short-vowel choices retain both consonant sequences in real-word contrasts', () => {
  const rows=additions.filter(i=>i.sourceProvenance.file==='src/data/literacyMockFoundationWordContrastCapacity.js'&&!i.id.includes('medial-vowel')&&!i.id.includes('team-word'));
  assert.ok(rows.length>=140);
  const vowelSet=new Set(['AA','AE','AH','AO','AW','AY','EH','ER','EY','IH','IY','OW','OY','UH','UW']);
  const targetSounds={a:['AE'],e:['EH'],i:['IH'],o:['AA','AO'],u:['AH']};
  for(const item of rows) {
    const target=cmu[item.targetWord]?.arpabet;assert.ok(target,item.targetWord);
    assert.equal(target.filter(p=>vowelSet.has(p)).length,1,item.id);
    const vowel=item.constructClaim.at(-1);
    assert.ok(target.some(p=>targetSounds[vowel].includes(p)),item.id);
    const consonants=target.filter(p=>!vowelSet.has(p));
    for(const choice of item.choices) {
      assert.ok(lexicon.words.includes(choice.label),choice.label);
      const phones=cmu[choice.label]?.arpabet;assert.ok(phones,choice.label);
      assert.deepEqual(phones.filter(p=>!vowelSet.has(p)),consonants,`${item.id}:${choice.label}`);
      if(choice.id!==item.answer)assert.notDeepEqual(phones,target,`${item.id}:${choice.label}`);
    }
    assert.equal(item.requiredAudioCues.some(c=>c.role==='choice'),false,item.id);
    assert.equal(item.choices.find(c=>c.id===item.answer).label,item.targetWord);
    assert.equal(item.level===2?target.length>=4:target.length===3,true,item.id);
  }
});

test('silent-e reading has a unique long-vowel key and genuine short twins only at level two', () => {
  const rows=additions.filter(i=>i.sourceProvenance.file==='src/data/literacyMockFoundationSilentECapacity.js');
  const vowels=new Set(['AA','AE','AH','AO','AW','AY','EH','ER','EY','IH','IY','OW','OY','UH','UW']);
  const long={a:'EY',i:'AY',o:'OW',u:'UW'};
  const consonants=phones=>phones.filter((p,index)=>!vowels.has(p)&&!(p==='Y'&&phones[index+1]==='UW'));
  assert.ok(rows.length>50);
  for(const item of rows) {
    const sound=long[item.constructClaim.split(':')[1][0]];
    const key=item.choices.find(c=>c.id===item.answer);
    for(const c of item.choices)assert.ok(cmu[c.label]?.arpabet&&lexicon.words.includes(c.label),c.label);
    assert.deepEqual(item.choices.filter(c=>cmu[c.label].arpabet.includes(sound)).map(c=>c.id),[item.answer],item.id);
    const shortTwin=item.choices.find(c=>c.label===key.label.slice(0,-1));
    if(item.level===2) {
      assert.ok(shortTwin,item.id);
      assert.deepEqual(consonants(cmu[key.label].arpabet),consonants(cmu[shortTwin.label].arpabet),item.id);
    } else assert.equal(shortTwin,undefined,item.id);
    assert.equal(item.targetWord,'');
    assert.ok(item.requiredAudioCues.every(c=>c.role==='instruction'));
    assert.ok(item.choices.every(c=>!c.audioPath));
  }
});

test('pictured blend words have a unique whole-word pronunciation and preserve supplied-word access', () => {
  const rows=additions.filter(i=>i.sourceProvenance.file==='src/data/literacyMockFoundationBlendCapacity.js');
  assert.equal(rows.length,126);
  for(const item of rows) {
    assert.ok(item.image,item.id);
    const target=cmu[item.targetWord]?.arpabet;assert.ok(target,item.targetWord);
    assert.deepEqual(item.choices.filter(c=>JSON.stringify(cmu[c.label]?.arpabet)===JSON.stringify(target)).map(c=>c.id),[item.answer],item.id);
    assert.equal(item.requiredAudioCues.find(c=>c.role==='target_word')?.text,item.targetWord,item.id);
    assert.ok(item.choices.every(c=>!c.audioPath&&lexicon.words.includes(c.label)),item.id);
  }
});

test('advanced spoken comparisons require the whole rime or all three onset phonemes', () => {
  const vowel=p=>/^(AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)$/.test(p);
  const phones=word=>{assert.ok(cmu[word]?.arpabet,word);return cmu[word].arpabet};
  const rime=word=>{const p=phones(word);return p.slice(p.findLastIndex(vowel)).join(' ')};
  const onset=word=>{const p=phones(word);return p.slice(0,p.findIndex(vowel)).join(' ')};
  const rows=additions.filter(i=>i.sourceProvenance.sourceId.startsWith('spoken-comparison.'));
  assert.equal(rows.length,16);
  for(const item of rows) {
    const compare=item.skillId==='rhyming'?rime:onset;
    assert.deepEqual(item.choices.filter(c=>compare(c.label)===compare(item.targetWord)).map(c=>c.id),[item.answer],item.id);
    assert.equal(item.hideWrittenLabels,true,item.id);
    assert.equal(item.requiredAudioCues.filter(c=>c.role==='choice').length,item.choices.length,item.id);
    if(item.skillId==='blends')assert.equal(onset(item.targetWord).split(' ').length,3,item.id);
    else {
      const target=phones(item.targetWord),foils=item.choices.filter(c=>c.id!==item.answer);
      if(!vowel(target.at(-1)))assert.ok(foils.some(c=>phones(c.label).at(-1)===target.at(-1)),`${item.id}: same-final-consonant competitor`);
      assert.ok(foils.some(c=>phones(c.label).find(vowel)===target.find(vowel)),`${item.id}: same-vowel competitor`);
    }
  }
});

test('only exact independently reviewed foundation images clear the pending media decision', async () => {
  const {REVIEWED_MOCK_FOUNDATION_MEDIA:reviewed,applyLiteracyMockFoundationMediaReview:apply}=await import('../../src/data/literacyMockFoundationMedia.js');
  const {createHash}=await import('node:crypto');
  for(const [path,receipt]of Object.entries(reviewed)) {
    assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../../public'+path,import.meta.url))).digest('hex'),receipt.sha256,path);
    assert.deepEqual(receipt.sizes,[768,240]);
  }
  const approved=Object.keys(reviewed)[0];assert.ok(approved);
  const pending='/images/assessment/literacy-mock/capacity/foundation-not-reviewed.webp';
  assert.equal(apply({image:approved}).mediaDecision.constructReview,'approved');
  assert.equal(apply({image:pending,mediaDecision:{constructReview:'approved'}}).mediaDecision.constructReview,'pending');
  assert.equal(apply({choices:[{image:approved},{image:pending}]}).mediaDecision.constructReview,'pending');
  for(const item of additions.filter(i=>i.requiredImagePaths.some(p=>p.startsWith('/images/assessment/literacy-mock/capacity/foundation-')))) {
    const expected=item.requiredImagePaths.filter(p=>p.startsWith('/images/assessment/literacy-mock/capacity/foundation-')).every(p=>reviewed[p]);
    assert.equal(item.mediaDecision.constructReview,expected?'approved':'pending',item.id);
  }
});
