import fs from 'node:fs';
import path from 'node:path';
import { auditQuestionAgainstPolicy, questionVisualPaths } from '../../src/policy/questionDesignPolicy.js';
import { LITERACY_CORE_SKILLS, LITERACY_DOMAINS } from '../../src/policy/literacyPracticePolicy.js';
import { getLedaProductionAudioPath, getLedaWordAudioPath, normalizeLedaAudioText } from '../../src/data/ledaProductionAudio.js';
import { CYCLE_PRACTICE_INSTRUCTION_AUDIO } from '../../src/data/generated/cyclePracticeInstructionAudio.generated.js';
import { ADVENTURE_MAP_INSTRUCTION_AUDIO } from '../../src/data/generated/adventureMapInstructionAudio.generated.js';
import { getPreferredPhonemeAudioPath } from '../../src/data/phonemeAudioBank.js';
import { isKnownBadAudioPath } from '../../src/data/knownBadWordAudio.js';
import { DRUM_TRAIL_WORDS } from '../../src/data/drumTrailContent.js';
import { LITERACY_TEACHING_PROMPTS, literacyTeachingCueId } from '../../src/data/literacyPracticeExtensions.js';
import { learningChoiceSignature, learningStimulusSignature, selectFreshLearningTransfer } from '../../src/utils/learningResponseState.js';
import { mediaDecisionContractIssues, ROOT } from '../assessmentRebuild/lib.mjs';

const expectedSkills = ['letter_knowledge', 'print_concepts', 'syllable_awareness', 'sound_manipulation', 'capitalization', 'punctuation',
  'informational_features', 'literary_craft', 'writing_purpose', 'writing_organization', 'writing_revision'];
const roles = new Set(['instruction', 'phoneme', 'target_word', 'choice']);
const text = value => typeof value === 'string' && Boolean(value.trim());
const publicFileExists = value => Boolean(value) && fs.existsSync(path.join(ROOT, 'public', value.replace(/^\//, '')));

export function canonicalLiteracyCuePath(cue = {}) {
  if (cue.role === 'instruction') return getLedaProductionAudioPath(cue.text)
    || CYCLE_PRACTICE_INSTRUCTION_AUDIO[normalizeLedaAudioText(cue.text)]
    || ADVENTURE_MAP_INSTRUCTION_AUDIO[normalizeLedaAudioText(cue.text)] || '';
  if (cue.role === 'phoneme') return getPreferredPhonemeAudioPath(cue.text);
  if (cue.audioKind === 'letter_name') return getLedaProductionAudioPath(cue.text, ['letter_name']);
  if (cue.role === 'target_word') return DRUM_TRAIL_WORDS.find(word => word.word === cue.text)?.audio || getLedaWordAudioPath(cue.text);
  return cue.role === 'choice' ? getLedaWordAudioPath(cue.text) : '';
}

export function literacyPracticeRequiredAudioCues(items = []) {
  return items.flatMap(item => [
    ...(item.audioRequirements || []).filter(cue => cue.required).map(cue => ({ ...cue, itemId: item.id, scope: 'response' })),
    ...(item.teachingAudioRequirements || []).filter(cue => cue.required).map(cue => ({ ...cue, itemId: item.id, scope: 'teaching' })),
  ]);
}

// This audits the full authored source, including unavailable items. Filtering
// the runtime to audio-ready questions must never turn an incomplete bank green.
export function auditLiteracyPracticeItem(item, { assetExists = publicFileExists } = {}) {
  const issues = auditQuestionAgainstPolicy(item, {
    ageBand: item.level === 1 ? 'A' : 'B', requireId: true, requireSpoken: true,
    requireDistractorRationales: true, allowNegativeStem: false,
    caseSensitiveOptions: ['capitalization', 'letter_knowledge'].includes(item.skillId),
    orthographySensitiveOptions: item.skillId === 'punctuation',
  });
  const add = (code, message) => issues.push({ code, message });
  if (![1, 2].includes(item.level) || !text(item.constructClaim) || !text(item.evidenceUnit)) add('Q-LITERACY-CONSTRUCT', 'An explicit construct, evidence unit and level 1 or 2 are required.');
  if (!text(item.explanation) || !text(item.sourceProvenance?.kind) || !text(item.sourceProvenance?.sourceId)
    || !text(item.sourceProvenance?.file) || !fs.existsSync(path.join(ROOT, item.sourceProvenance.file))) add('Q-LITERACY-PROVENANCE', 'An explanation and resolvable authored source provenance are required.');
  for (const choice of (item.choices || []).filter(value => value !== item.answer)) {
    if (!text(item.distractorRationales?.[choice])) add('Q-LITERACY-RATIONALE', `Distractor has no substantive rationale: ${choice}`);
  }
  for (const message of mediaDecisionContractIssues(item, item.assessmentMediaDecision, questionVisualPaths(item))) add('Q-LITERACY-MEDIA', message);
  if (!text(item.assessmentMediaDecision?.reason) || item.assessmentMediaDecision?.construct !== item.constructClaim) add('Q-LITERACY-MEDIA', 'The media decision must explain its relationship to this construct.');
  const cues = item.audioRequirements || [];
  const teaching = item.teachingAudioRequirements || [];
  if (!text(item.teachingPrompt) || item.teachingCueId !== literacyTeachingCueId(item) || item.teachingPrompt !== LITERACY_TEACHING_PROMPTS[item.teachingCueId]
    || teaching.length !== 1 || teaching[0]?.role !== 'instruction' || teaching[0]?.text !== item.teachingPrompt) add('Q-LITERACY-TEACHING', 'Worked teaching needs the exact constructive explanation for this item.');
  if (item.teachingAudioReady !== (teaching.length > 0 && teaching.every(cue => Boolean(cue.path)))) add('Q-LITERACY-TEACHING', 'Teaching availability must describe its entire required sequence.');
  if (!cues.length || cues[0]?.role !== 'instruction' || cues[0]?.text !== item.spokenPrompt
    || item.instructionAudioPath !== cues[0]?.path) add('Q-LITERACY-AUDIO-CONTRACT', 'The first required cue must exactly match the spoken instruction and its declared path.');
  for (const cue of [...cues, ...teaching]) {
    if (!roles.has(cue.role) || !text(cue.text) || cue.required !== true) add('Q-LITERACY-AUDIO-CONTRACT', 'Every declared learner cue needs a supported role, exact text and required flag.');
    if (!cue.path) add('Q-LITERACY-AUDIO-MISSING', `Missing exact ${cue.role} recording: ${cue.text}`);
    else if (cue.path !== canonicalLiteracyCuePath(cue) || isKnownBadAudioPath(cue.path) || !assetExists(cue.path)) add('Q-LITERACY-AUDIO-SOURCE', `Recording is not the available canonical source for ${cue.role}: ${cue.text}`);
    if (cue.role !== 'phoneme' && /\/[a-z]+\//i.test(cue.text || '')) add('Q-LITERACY-AUDIO-CONTRACT', 'Raw phoneme notation must use isolated phoneme clips, never synthesized notation.');
  }
  if (item.literacyAudioReady !== (cues.length > 0 && cues.every(cue => Boolean(cue.path)))) add('Q-LITERACY-AUDIO-CONTRACT', 'Audio availability must describe the entire required sequence.');
  if (!['reading', 'listening', 'recognition'].includes(item.literacyModality)) add('Q-LITERACY-MODALITY', 'The actual response evidence modality is required.');
  if (item.literacyModality === 'reading' && (!text(item.passage) || !item.suppressStimulusAudio || item.passageAudioPath || item.evidenceModality !== 'text')) add('Q-LITERACY-READING-LEAK', 'Independent reading needs a real printed stimulus and no stimulus narration.');
  if (item.literacyModality !== 'listening' && (!item.suppressChoiceAudio || item.allowChoiceAudio || cues.some(cue => cue.role === 'choice'))) add('Q-LITERACY-CHOICE-LEAK', 'Printed recognition and reading choices must remain silent.');
  if (item.literacyModality === 'listening' && (item.evidenceModality !== 'audio' || text(item.passage))) add('Q-LITERACY-MODALITY', 'Oral evidence must not silently become a printed passage task.');
  if (item.skillId === 'sound_manipulation') {
    const choices = cues.filter(cue => cue.role === 'choice');
    if (!item.hideWrittenLabels || !item.allowChoiceAudio || item.suppressChoiceAudio || !text(item.oralStimulus)
      || choices.length !== item.choices.length || item.choices.some(value => !choices.some(cue => cue.value === value && cue.text === value))) add('Q-LITERACY-ORAL', 'Sound manipulation needs hidden spelling and complete, correctly mapped oral choices.');
    const phonemes = cues.filter(cue => cue.role === 'phoneme').map(cue => cue.text);
    if (JSON.stringify(phonemes) !== JSON.stringify(item.phonemeSequence)) add('Q-LITERACY-ORAL', 'Blending sequence must match the actual isolated phoneme cues in order.');
  }
  if (item.retentionOnly || /progressBank|retention/i.test(item.sourceProvenance?.file || '')) add('Q-LITERACY-RESERVED', 'Reserved assessment or retention items cannot be repurposed as public practice.');
  return issues;
}

export function auditLiteracyPracticeBank(items = [], skills = []) {
  const issues = [];
  const add = (id, code, message) => issues.push({ id, code, message });
  const allSkills = [...LITERACY_CORE_SKILLS, ...skills];
  if (skills.length !== expectedSkills.length || expectedSkills.some(id => !skills.some(skill => skill.id === id))
    || new Set(allSkills.map(skill => skill.id)).size !== 47 || new Set(allSkills.map(skill => skill.domainId)).size !== 8) add('registry', 'Q-LITERACY-COVERAGE', 'Expected 47 distinct skills across eight areas, including all eleven supplemental skills.');
  const ids = new Set();
  const seen = new Map();
  for (const item of items) {
    if (ids.has(item.id)) add(item.id, 'Q-LITERACY-DUPLICATE', 'Item ID is not unique.');
    ids.add(item.id);
    const skill = skills.find(candidate => candidate.id === item.skillId);
    if (!skill || skill.domainId !== item.literacyDomainId) add(item.id, 'Q-LITERACY-COVERAGE', 'Item skill and reporting domain disagree.');
    for (const issue of auditLiteracyPracticeItem(item)) issues.push({ id: item.id, ...issue });
    const fingerprint = `${item.skillId}:${item.constructClaim}:${learningStimulusSignature(item)}:${learningChoiceSignature(item)}`;
    if (seen.has(fingerprint)) add(item.id, 'Q-LITERACY-DUPLICATE', `Clones evidence and choice set from ${seen.get(fingerprint)}.`);
    else seen.set(fingerprint, item.id);
    if (!selectFreshLearningTransfer(item, items)) add(item.id, 'Q-LITERACY-TRANSFER', 'No unused lower-or-same-level partner has the same construct, a fresh stimulus and fresh choices.');
  }
  for (const skill of skills) {
    if (!text(skill.label) || !text(skill.suggestion) || !LITERACY_DOMAINS.some(domain => domain.id === skill.domainId && domain.label === skill.domainLabel)) add(skill.id, 'Q-LITERACY-COVERAGE', 'Skill must have a label, teaching suggestion and canonical reporting area.');
    for (const level of [1, 2]) if (items.filter(item => item.skillId === skill.id && item.level === level).length < 6) add(skill.id, 'Q-LITERACY-STOCK', `Level ${level} lacks a six-question focused sitting.`);
  }
  return issues;
}
