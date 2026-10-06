import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LITERACY_EXTENSION_SKILLS, loadLiteracyPracticeExtensions, listLiteracyPracticeAudioGaps,
  LITERACY_TEACHING_PROMPTS, listLiteracyPracticeTeachingAudioGaps,
} from '../../src/data/literacyPracticeExtensions.js';
import { normalizeAssessmentQuestion } from '../../src/appState/assessmentRuntime.js';
import { getAssessmentStimulusAudioText } from '../../src/utils/assessmentAudioPolicy.js';
import { getPreferredPhonemeAudioPath } from '../../src/data/phonemeAudioBank.js';
import { getLedaProductionAudioPath, getLedaWordAudioPath, normalizeLedaAudioText } from '../../src/data/ledaProductionAudio.js';
import { CYCLE_PRACTICE_INSTRUCTION_AUDIO } from '../../src/data/generated/cyclePracticeInstructionAudio.generated.js';
import { ADVENTURE_MAP_INSTRUCTION_AUDIO } from '../../src/data/generated/adventureMapInstructionAudio.generated.js';
import { isKnownBadAudioPath } from '../../src/data/knownBadWordAudio.js';
import { DRUM_TRAIL_WORDS } from '../../src/data/drumTrailContent.js';
import { SENTENCE_FIX } from '../../src/data/learnGamesData.js';
import { selectFreshLearningTransfer } from '../../src/utils/learningResponseState.js';
import { literacyPracticeTeachingCues } from '../../src/data/literacyPracticeBank.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const items = await loadLiteracyPracticeExtensions();
const byId = suffix => items.find(item => item.id.endsWith(`.${suffix}`));
const instructionPath = text => getLedaProductionAudioPath(text)
  || CYCLE_PRACTICE_INSTRUCTION_AUDIO[normalizeLedaAudioText(text)]
  || ADVENTURE_MAP_INSTRUCTION_AUDIO[normalizeLedaAudioText(text)] || '';

test('teaching speaks letter names, sound targets and numbers with their correct roles, without distractors', () => {
  const letter = byId('name-a');
  const cues = literacyPracticeTeachingCues(letter);
  assert.ok(cues.some(cue => cue.path === getLedaProductionAudioPath('a', ['letter_name'])));
  assert.ok(cues.some(cue => cue.text === letter.teachingPrompt));
  assert.equal(cues.some(cue => cue.role === 'choice'), false);
  const sound = literacyPracticeTeachingCues({ skillId:'initial_sounds', literacyDomainId:'sound_awareness', answer:'m', prompt:'Listen.' });
  assert.ok(sound.some(cue => cue.path === getPreferredPhonemeAudioPath('m')));
  const syllables = literacyPracticeTeachingCues(byId('helicopter'));
  assert.ok(syllables.some(cue => cue.text === 'four' && cue.path === getLedaWordAudioPath('four')));
  const print = literacyPracticeTeachingCues({ skillId:'print_concepts', itemKey:'first_letter', answer:'b', prompt:'Look.' });
  assert.ok(print.some(cue => cue.path === getLedaProductionAudioPath('b', ['letter_name'])));
});

test('supplemental practice covers the missing K–2 domains with distinct easier and harder work', () => {
  const expected = ['letter_knowledge','print_concepts','syllable_awareness','sound_manipulation','capitalization','punctuation',
    'informational_features','literary_craft','writing_purpose','writing_organization','writing_revision'];
  assert.deepEqual(LITERACY_EXTENSION_SKILLS.map(skill => skill.id), expected);
  for (const skill of LITERACY_EXTENSION_SKILLS) {
    const pool = items.filter(item => item.skillId === skill.id);
    assert.ok(skill.domainId && skill.domainLabel && skill.suggestion, skill.id);
    for (const level of [1,2]) assert.ok(pool.filter(item => item.level === level).length >= 6, `${skill.id} level ${level} needs a full focused sitting`);
  }
  assert.ok(items.some(item => item.constructClaim === 'return_sweep'));
  assert.ok(items.some(item => item.constructClaim === 'claim_evidence'));
  assert.ok(items.some(item => item.constructClaim === 'research'));
  assert.ok(items.some(item => item.constructClaim === 'topic_sentence'));
  assert.ok(items.some(item => item.constructClaim === 'personification'));
  assert.ok(items.some(item => item.constructClaim === 'substitute_final'));
});

test('normalization preserves literal keys, case and punctuation contrasts, evidence and rationales', () => {
  assert.equal(new Set(items.map(item => item.id)).size, items.length);
  for (const item of items) {
    const normalized = normalizeAssessmentQuestion(item, item.skillId);
    assert.equal(normalized.choices.length, 3, item.id);
    assert.equal(new Set(normalized.choices).size, 3, item.id);
    assert.equal(normalized.choices.filter(value => value === normalized.answer).length, 1, item.id);
    assert.equal(normalized.answer, item.answer, item.id);
    assert.equal(normalized.passage, item.passage, item.id);
    for (const choice of item.choices.filter(value => value !== item.answer)) {
      const reason = item.distractorRationales[choice];
      assert.ok(reason && reason.trim(), `${item.id}: missing misconception for ${choice}`);
      assert.doesNotMatch(reason, /wrong answer|conflicts with the stated evidence|silly/i);
    }
    assert.ok(item.explanation && item.sourceProvenance.file, item.id);
    assert.ok(fs.existsSync(path.join(root, item.sourceProvenance.file)), item.id);
    assert.deepEqual(item.assessmentMediaDecision.paths, []);
    assert.equal(item.assessmentMediaDecision.role, 'text-only');
    assert.equal(item.retentionOnly, undefined);
    assert.doesNotMatch(item.sourceProvenance.file, /progressBank|retention/);
  }
  const capital = items.find(item => item.constructClaim === 'sentence_capital' && item.choices.includes('The'));
  assert.ok(normalizeAssessmentQuestion(capital).choices.includes('the'));
  assert.equal(capital.answer, 'The');
  assert.deepEqual(new Set(byId('sentence-fix-easy-3').choices.map(choice => choice.at(-1))), new Set(['.','?','!']));
});

test('complete recordings must be exact approved sources with real files; missing audio stays unavailable', () => {
  for (const item of items) {
    assert.equal(item.audioRequirements[0].role, 'instruction', item.id);
    assert.equal(item.audioRequirements[0].text, item.spokenPrompt, item.id);
    assert.equal(item.instructionAudioPath, instructionPath(item.spokenPrompt), item.id);
    assert.equal(item.literacyAudioReady, item.audioRequirements.every(cue => Boolean(cue.path)), item.id);
    for (const cue of item.audioRequirements) {
      assert.equal(cue.required, true, item.id);
      assert.ok(cue.text, item.id);
      if (!cue.path) continue;
      assert.ok(fs.statSync(path.join(root, 'public', cue.path)).size > 100, `${item.id}: ${cue.path}`);
      assert.equal(isKnownBadAudioPath(cue.path), false, item.id);
      if (cue.role === 'phoneme') assert.equal(cue.path, getPreferredPhonemeAudioPath(cue.text));
      if (cue.role === 'choice') assert.equal(cue.path, getLedaWordAudioPath(cue.text));
      if (cue.audioKind === 'letter_name') assert.equal(cue.path, getLedaProductionAudioPath(cue.text, ['letter_name']));
    }
  }
});

test('reading passages and printed recognition choices cannot become narrated answer shortcuts', () => {
  for (const item of items.filter(item => item.literacyModality !== 'listening')) {
    assert.equal(item.suppressChoiceAudio, true, item.id);
    assert.equal(item.allowChoiceAudio, false, item.id);
    assert.equal(item.audioRequirements.some(cue => ['choice','passage'].includes(cue.role)), false, item.id);
    if (item.literacyModality === 'reading') {
      assert.ok(item.passage.trim(), `${item.id}: no actual reading evidence`);
      assert.equal(getAssessmentStimulusAudioText(item), '', item.id);
      assert.equal(item.passageAudioPath, undefined, item.id);
    }
  }
  assert.match(byId('book-title').passage, /A Rainy Walk\nWritten by Mina Fox\nPictures by Leo Sun/);
  assert.match(byId('contents-bees').passage, /Bees — page 5/);
  assert.match(byId('new-line').passage, /bird\nmade/);
});

test('sound operations preserve oral-only evidence and use isolated reviewed phonemes for blending', () => {
  const oral = items.filter(item => item.skillId === 'sound_manipulation');
  for (const item of oral) {
    assert.equal(item.evidenceModality, 'audio');
    assert.equal(item.hideWrittenLabels, true);
    assert.equal(item.passage, '');
    assert.equal(item.audioText, undefined);
    assert.equal(item.allowChoiceAudio, true);
    const choices = item.audioRequirements.filter(cue => cue.role === 'choice');
    assert.deepEqual(choices.map(cue => cue.value), item.choices);
    assert.ok(choices.every(cue => cue.path));
    assert.doesNotMatch(item.spokenPrompt, /\/[a-z]+\//i, 'Do not submit phoneme notation as TTS text.');
  }
  const blending = oral.filter(item => item.phonemeSequence.length);
  assert.equal(blending.length, 4);
  assert.deepEqual(byId('blend-fish').phonemeSequence, ['f','i','sh']);
  for (const item of blending) {
    assert.deepEqual(item.audioRequirements.map(cue => cue.role), ['instruction','phoneme','phoneme','phoneme','choice','choice','choice']);
    assert.equal(item.spokenPrompt, 'Listen to the sounds. Which word do they make?');
  }
});

test('syllable counts inherit the authored accent-safe inventory without showing target spelling', () => {
  const syllables = items.filter(item => item.skillId === 'syllable_awareness');
  assert.equal(syllables.length, DRUM_TRAIL_WORDS.length);
  for (const item of syllables) {
    const source = DRUM_TRAIL_WORDS.find(word => word.id === item.sourceProvenance.sourceId);
    assert.equal(item.answer, String(source.syllables));
    assert.equal(item.audioPath, source.audio);
    assert.equal(item.audioText, source.word);
    assert.equal(item.passage, '');
    assert.equal(item.prompt, 'Listen. Tap how many beats.');
    assert.ok(item.literacyAudioReady);
    assert.equal(item.level, source.syllables <= 2 ? 1 : 2);
    assert.ok(item.choices.every(choice => /^\d$/.test(choice)));
  }
  assert.equal(byId('helicopter').answer, '4');
  for (const word of ['fire','flower','squirrel','camera','chocolate','crayon']) assert.equal(syllables.some(item => item.audioText === word), false);
});

test('public Sentence Fix reuse preserves source keys while excluding ambiguous word-choice stock', () => {
  const borrowed = items.filter(item => item.sourceProvenance.file === 'src/data/learnGamesData.js');
  assert.equal(borrowed.length, Object.values(SENTENCE_FIX).flat().filter(row => ['capital','end'].includes(row.kind)).length);
  for (const item of borrowed) {
    const [,level,index] = item.sourceProvenance.sourceId.match(/^SENTENCE_FIX\.(\w+)\[(\d+)\]$/);
    const source = SENTENCE_FIX[level][Number(index)];
    assert.equal(item.answer, source.kind === 'end' ? source.display.replace('___', source.answer) : source.answer);
    assert.equal(item.passage, source.display);
    assert.deepEqual(new Set(item.choices), new Set(source.kind === 'end' ? source.options.map(mark => source.display.replace('___', mark)) : source.options));
    assert.equal(item.sourceProvenance.kind, 'approved_public_practice');
    assert.ok(item.sourceProvenance.familiarity);
    if (item.constructClaim === 'sentence_capital') assert.match(item.spokenPrompt, /capital letter/);
  }
  assert.equal(borrowed.some(item => item.passage.includes('wizard')), false);
});

test('every authored construct has a genuinely fresh transfer partner with new evidence and choices', () => {
  for (const item of items) {
    const partner = selectFreshLearningTransfer(item, items);
    assert.ok(partner, `${item.id}: no fresh transfer partner`);
    assert.equal(partner.constructClaim, item.constructClaim);
  }
});

test('the recording worklist deduplicates exact role/text while retaining every affected item', () => {
  const gaps = listLiteracyPracticeAudioGaps(items);
  const expected = items.flatMap(item => item.audioRequirements.filter(cue => !cue.path).map(cue => ({ id: item.id, ...cue })));
  assert.equal(gaps.length, new Set(expected.map(cue => `${cue.role}:${cue.text}`)).size);
  for (const cue of expected) assert.ok(gaps.find(gap => gap.role === cue.role && gap.text === cue.text)?.itemIds.includes(cue.id));
  assert.deepEqual(listLiteracyPracticeAudioGaps([{ id:'one', audioRequirements:[
    { role:'instruction', text:'A real instruction.', required:true, path:'' },
    { role:'instruction', text:'Already recorded.', required:true, path:'/real.mp3' },
    { role:'choice', text:'Optional.', required:false, path:'' },
  ] }, { id:'two', audioRequirements:[{ role:'instruction', text:'A real instruction.', required:true, path:'' }] }]), [
    { role:'instruction', text:'A real instruction.', itemIds:['one','two'] },
  ]);
});

test('worked teaching explains each construct with a separate exact cue and bounded recording worklist', () => {
  for (const item of items) {
    assert.equal(item.teachingPrompt, LITERACY_TEACHING_PROMPTS[item.teachingCueId], item.id);
    assert.equal(item.teachingAudioRequirements.length, 1, item.id);
    const cue = item.teachingAudioRequirements[0];
    assert.equal(cue.role, 'instruction');
    assert.equal(cue.required, true);
    assert.equal(cue.text, item.teachingPrompt, item.id);
    assert.equal(cue.path, instructionPath(cue.text), item.id);
    assert.equal(item.teachingAudioReady, Boolean(cue.path), item.id);
    assert.equal(item.audioRequirements.some(responseCue => responseCue.text === cue.text), false, item.id);
  }
  const allTexts = [...new Set(Object.values(LITERACY_TEACHING_PROMPTS))];
  assert.ok(allTexts.reduce((sum, text) => sum + text.length, 0) <= 4000);
  assert.notEqual(byId('name-a').teachingPrompt, byId('case-a').teachingPrompt);
  assert.notEqual(byId('blend-map').teachingPrompt, byId('delete-s-snow').teachingPrompt);
  assert.match(byId('list-comma').teachingPrompt, /list/);
  assert.match(byId('contraction-not').teachingPrompt, /missing letters/);
  const gaps = listLiteracyPracticeTeachingAudioGaps(items);
  for (const item of items.filter(item => !item.teachingAudioReady)) assert.ok(gaps.find(gap => gap.text === item.teachingPrompt)?.itemIds.includes(item.id));
});
