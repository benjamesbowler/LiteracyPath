import fs from 'node:fs';
import path from 'node:path';
import { auditQuestionAgainstPolicy, questionVisualPaths } from '../../src/policy/questionDesignPolicy.js';
import { mediaDecisionContractIssues, ROOT } from '../assessmentRebuild/lib.mjs';
import { getLedaInstructionAudioPath, getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';

// Audit the authored public stock, including items unavailable at runtime.
export function auditLiteracyInteractionBank(bank) {
  const issues = [], ids = new Set();
  const add = (id, message) => issues.push({ id, code: 'Q-MAP-INTERACTION', message });
  const exists = file => Boolean(file) && fs.existsSync(path.join(ROOT, 'public', file));
  for (const q of bank) {
    const options = q.answerOptions || [], values = options.map(option => option.value);
    const construction = ['order', 'match', 'build_word'].includes(q.mapInteraction);
    for (const issue of auditQuestionAgainstPolicy(q, { ageBand: q.level === 1 ? 'A' : 'B', requireId: true,
      requireSpoken: true, constructedResponse: construction || q.mapInteraction === 'select_text',
      requireDistractorRationales: q.mapInteraction === 'picture_choice' })) issues.push({ id: q.id, ...issue });
    if (ids.has(q.id)) add(q.id, 'Duplicate stable identity.');
    ids.add(q.id);
    if (!q.practiceOnly || ![1, 2].includes(q.level) || !Number.isInteger(q.practiceDemand) || q.practiceDemand < 0 || q.practiceDemand > 4
      || !q.constructClaim || !q.explanation || !fs.existsSync(path.join(ROOT, q.sourceProvenance?.file || 'missing'))) add(q.id, 'Missing public demand, construct, explanation or authored provenance.');
    if (!['order', 'match', 'build_word', 'select_text', 'picture_choice'].includes(q.mapInteraction)
      || values.length < 2 || new Set(values).size !== values.length || options.some(option => !option.value || !option.label)) add(q.id, 'Response tiles need distinct identities and literal labels.');
    if (['order', 'match'].includes(q.mapInteraction)) {
      let key;
      try { key = JSON.parse(q.answer); } catch { /* Report the incomplete key. */ }
      if (!Array.isArray(key) || key.length !== q.mapSlots || new Set(key).size !== key.length || key.some(id => !values.includes(id))) add(q.id, 'Ordered construction requires a complete buildable exact sequence key.');
      if (q.correctAnswers) add(q.id, 'An ordered response cannot use unordered set scoring.');
      if (q.mapInteraction === 'match' && (q.mapTargets?.length !== q.mapSlots || q.mapTargets.some(target => !target.label))) add(q.id, 'Every matching space needs its visible target.');
    } else if (q.mapInteraction === 'build_word') {
      let remainder = String(q.answer || '');
      for (const option of options.slice(0, -1)) remainder = remainder.startsWith(option.label) ? remainder.slice(option.label.length) : '!';
      if (remainder || q.mapSlots !== options.length - 1 || q.targetWord !== q.answer || q.passage || q.prompt.toLowerCase().includes(q.answer.toLowerCase())) add(q.id, 'Dictated spelling needs buildable tiles and a hidden target.');
    } else {
      if (!values.includes(q.answer)) add(q.id, 'The selected key is missing from the visible choices.');
      if (q.mapInteraction === 'select_text' && [...options].sort((a, b) => a.tokenIndex - b.tokenIndex).map(option => option.label).join(' ') !== q.passage) add(q.id, 'Selectable words must retain the entire literal passage in sentence order.');
    }
    for (const message of mediaDecisionContractIssues(q, q.assessmentMediaDecision, questionVisualPaths(q))) add(q.id, message);
    for (const file of questionVisualPaths(q)) if (!exists(file)) add(q.id, 'Missing required evidence image: ' + file);
    if (options.some(option => option.image && !option.alt)) add(q.id, 'Required pictures need meaningful scene alternatives.');
    const cues = [...(q.audioRequirements || []), ...(q.passage ? [{ role: 'passage', text: q.passage, path: q.passageAudioPath }] : [])];
    if (!q.audioRequirements?.length || q.audioRequirements[0].text !== q.spokenPrompt) add(q.id, 'The first required cue must match the visible instruction.');
    for (const cue of cues) {
      const canonical = cue.role === 'target_word' ? getLedaWordAudioPath(cue.text) : getLedaInstructionAudioPath(cue.text);
      if (!exists(cue.path) || cue.path !== canonical) add(q.id, 'Missing exact ' + cue.role + ' audio: ' + cue.text);
    }
    if (q.literacyAudioReady !== (q.audioRequirements.every(cue => Boolean(cue.path)) && (!q.passage || Boolean(q.passageAudioPath)))) add(q.id, 'Audio availability must describe the complete required sequence and optional passage recording.');
  }
  return issues;
}
