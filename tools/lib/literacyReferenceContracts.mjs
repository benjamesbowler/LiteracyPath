import fs from 'node:fs';
import path from 'node:path';
import { auditQuestionAgainstPolicy, questionVisualPaths } from '../../src/policy/questionDesignPolicy.js';
import { mediaDecisionContractIssues, ROOT } from '../assessmentRebuild/lib.mjs';
import { getLedaInstructionAudioPath, getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';
import routing from '../../src/content/literacy-reference/routing.generated.json' with { type: 'json' };

export function auditLiteracyReferenceRouting(bank, index = routing) {
  const expected = {};
  for (const item of bank) {
    const prior = expected[item.skillId];
    expected[item.skillId] = { minimum: Math.min(prior?.minimum ?? item.practiceDemand, item.practiceDemand), maximum: Math.max(prior?.maximum ?? item.practiceDemand, item.practiceDemand) };
  }
  return [...new Set([...Object.keys(expected), ...Object.keys(index)])].flatMap(skillId => {
    const actual = index[skillId], authored = expected[skillId];
    return actual && authored && actual.minimum === authored.minimum && actual.maximum === authored.maximum ? []
      : [{ id: `reference-routing.${skillId}`, code: 'Q-REFERENCE-ROUTING', message: 'The lightweight preload index must exactly match the complete authored demand range. Regenerate tools/generateLiteracyReferenceRouting.mjs --write.' }];
  });
}

export function auditLiteracyReferenceBank(bank) {
  const issues = [], ids = new Set();
  const add = (id, code, message) => issues.push({ id, code, message });
  for (const item of bank) {
    const multi = item.questionType === 'map_multi_select', build = item.questionType === 'map_word_build';
    const keys = multi ? item.correctAnswers : [item.answer];
    const audited = multi ? { ...item, answer: keys[0], choices: item.choices.filter(value => !keys.slice(1).includes(value)) } : item;
    // A set is one constructed response; the checks below validate its complete
    // literal key/choice bank rather than treating it as a single-answer MCQ.
    for (const issue of auditQuestionAgainstPolicy(audited, { ageBand: item.level === 1 ? 'A' : 'B', requireId: true,
      requireSpoken: true, requireDistractorRationales: !build, constructedResponse: build || multi,
      orthographySensitiveOptions: item.skillId === 'punctuation' })) add(item.id, issue.code, issue.message);
    if (ids.has(item.id)) add(item.id, 'Q-REFERENCE-ID', 'Duplicate stable identity.');
    ids.add(item.id);
    if (!item.practiceOnly || ![1,2].includes(item.level) || !Number.isInteger(item.practiceDemand) || item.practiceDemand < 0 || item.practiceDemand > 4) add(item.id, 'Q-REFERENCE-DEMAND', 'Public practice requires an explicit local demand band and level.');
    const range = routing[item.skillId];
    if (!range || item.practiceDemand < range.minimum || item.practiceDemand > range.maximum) add(item.id, 'Q-REFERENCE-ROUTING', 'The lightweight routing index does not cover this authored demand.');
    if (!item.explanation || !item.sourceProvenance?.sourceSlides?.length || !item.sourceProvenance?.sourceSha256 || !fs.existsSync(path.join(ROOT, item.sourceProvenance.file || 'missing'))) add(item.id, 'Q-REFERENCE-SOURCE', 'Missing explanation or traceable classroom source/partner.');
    if (multi && (keys.length < 2 || keys.length >= item.choices.length || new Set(keys).size !== keys.length || keys.some(key => !item.choices.includes(key)))) add(item.id, 'Q-REFERENCE-SET', 'The literal exact set must be a unique proper subset of the choices.');
    if (!build && (new Set(item.choices).size !== item.choices.length || item.choices.length < 2 || item.choices.length > (multi ? 6 : 4))) add(item.id, 'Q-REFERENCE-CHOICES', 'The complete choice bank must be unique and within its authored response format.');
    if (build) {
      const letters = [...item.letterTiles];
      for (const letter of item.answer) { const index = letters.indexOf(letter); if (index < 0) add(item.id, 'Q-REFERENCE-BUILD', 'Spelling target cannot be built from the supplied tiles.'); else letters.splice(index,1); }
      if (item.passage.includes(item.answer) || item.prompt.toLowerCase().includes(item.answer.toLowerCase()) || item.choices.length) add(item.id, 'Q-REFERENCE-BUILD', 'A spelling task must not display its target or render word choices.');
    }
    for (const message of mediaDecisionContractIssues(item, item.assessmentMediaDecision, questionVisualPaths(item))) add(item.id, 'Q-REFERENCE-MEDIA', message);
    for (const image of questionVisualPaths(item)) if (!fs.existsSync(path.join(ROOT,'public',image))) add(item.id, 'Q-REFERENCE-MEDIA', `Missing exact evidence image: ${image}`);
    if (item.passageAudioRole === 'word' && (item.constructClaim !== 'affix_meaning' || !/^[a-z]+$/i.test(item.passage))) add(item.id, 'Q-REFERENCE-AUDIO', 'Word narration is reserved for explicitly authored single-word affix stimuli.');
    const cues = [...item.audioRequirements, ...(item.passage ? [{ role: item.passageAudioRole === 'word' ? 'word' : 'passage', text: item.passage, path: item.passageAudioPath }] : [])];
    for (const cue of cues) {
      const canonical = ['target_word','choice','word'].includes(cue.role) ? getLedaWordAudioPath(cue.text) : getLedaInstructionAudioPath(cue.text);
      if (!cue.path || cue.path !== canonical || !fs.existsSync(path.join(ROOT,'public',cue.path))) add(item.id, 'Q-REFERENCE-AUDIO', `Missing exact ${cue.role} recording: ${cue.text}`);
    }
    if (item.hideWrittenLabels && item.questionType !== 'choice' && item.id.includes('long-') && item.audioRequirements.filter(cue => cue.role === 'choice').length !== item.choices.length) add(item.id, 'Q-REFERENCE-ORAL', 'Every hidden-word vowel picture requires its exact spoken choice.');
    if (item.literacyAudioReady !== (item.audioRequirements.every(cue => Boolean(cue.path)) && (!item.passage || Boolean(item.passageAudioPath)))) add(item.id, 'Q-REFERENCE-AUDIO', 'Availability differs from the required cues and passage access.');
  }
  return issues;
}
