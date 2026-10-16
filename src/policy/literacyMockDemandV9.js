import { literacyMockDemandV8, LITERACY_MOCK_V8_LADDERS, isLiteracyMockWorkedTutorialTarget } from './literacyMockDemandV8.js';

const rung = (operation, requires) => Object.freeze({ operation, requires });
export const LITERACY_MOCK_V9_LADDERS = Object.freeze({
  ...LITERACY_MOCK_V8_LADDERS,
  sound_awareness: LITERACY_MOCK_V8_LADDERS.sound_awareness.map((entry, band) => band === 1
    ? rung('compare_final_phonemes', 'Compare the final phoneme of recorded words; no letters, print or letter names are required.') : entry),
  phonics: LITERACY_MOCK_V8_LADDERS.phonics.map((entry, band) => band === 4
    ? rung('construct_split_vowel', 'Retain four spoken phonemes while placing five letters around a split vowel and rejecting two spare letters.')
    : band === 5 ? rung('construct_five_phoneme_team', 'Construct five spoken phonemes, preserving a vowel team and rejecting two spare graphemes.')
      : band === 6 ? rung('construct_extended_compound', 'Construct at least six spoken phonemes across meaningful compound parts or a morpheme extension, preserving vowel teams and rejecting spare graphemes.') : entry),
  writing: LITERACY_MOCK_V8_LADDERS.writing.map((entry, band) => band === 5
    ? rung('edit_clause_or_paragraph', 'Retain or identify a dependent clause with its main clause, or reject a true but irrelevant paragraph detail.') : entry),
});

const FILE = 'src/data/literacyMockCorrectionsV9.js';
const authored = q => q.sourceProvenance?.file === FILE && q.taskDemand?.reviewed === true;
const exact = q => q.taskDemand?.proof || {};
const features = q => q.taskDemand?.features || {};
const allRecordings = q => q.requiredAudioCues || [];
const pureOral = q => q.hideWrittenLabels === true && !q.renderTargetText && !q.passage
  && q.evidenceModality === 'audio' && allRecordings(q).some(c => c.role === 'target_word' && c.text === q.targetWord)
  && q.choices.every(c => allRecordings(q).some(a => a.role === 'choice' && a.choiceId === c.id && a.text === c.label));
const sameTiles = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const hasTeam = tiles => tiles.some(tile => /^(ai|ay|ee|ea|oa|oo|ow|ou|oi|ue|igh)$/.test(tile));
const construction = q => {
  const p = exact(q), f = features(q);
  if (!authored(q) || q.format !== 'build_word' || q.modality !== 'dictation' || q.evidenceModality !== 'audio+print'
    || q.image || q.choices.some(c => c.image || c.audioPath)
    || allRecordings(q).some(c => c.role === 'choice')
    || !allRecordings(q).some(c => c.role === 'target_word' && c.text === q.targetWord)
    || !Array.isArray(p.responseTiles) || !Array.isArray(p.phonemes) || !Array.isArray(p.spareTiles)
    || p.responseTiles.join('') !== q.targetWord || q.answer !== q.targetWord || p.targetWord !== q.targetWord
    || p.phonemes.some(phone => typeof phone !== 'string' || !phone || /silent/i.test(phone))
    || p.phonemes.length !== f.phonemeCount || p.responseTiles.length !== f.responseUnitCount
    || q.responseLength !== p.responseTiles.length || p.spareTiles.length !== 2 || f.spareTiles !== 2
    || p.spareTiles.some(tile => p.responseTiles.includes(tile))
    || !sameTiles(q.choices.map(c => c.label), [...p.responseTiles, ...p.spareTiles])) return false;
  return true;
};

/** Admit literal operations, not source levels or isolated keyword matches.
 * Media readiness is a separate fail-closed delivery filter. */
export function literacyMockDemandV9(q) {
  if (q.tutorialOnly || isLiteracyMockWorkedTutorialTarget(q)) return null;
  const task = q.constructClaim || '', p = exact(q), f = features(q);
  if (/^mock\.capacity\.writing\.boundary-[1-8]$/.test(q.id)
    || ['mock.v8.sounds.medial.dot', 'mock.v8.sounds.medial.fog',
      'mock.v8.listening.0.table', 'mock.v8.listening.1.table',
      'lp3.sentence_comprehension.l2.B.best_restatement.v8',
      'lp3.sentence_comprehension.l2.A.best_restatement.v7',
      'mock.capacity.writing.complete-hard-while', 'mock.capacity.writing.complete-hard-until'].includes(q.id)) return null;
  if (q.domainId === 'sound_awareness') {
    if (task === 'initial_sound_grapheme_mapping') return null;
    if (task === 'spoken_final_phoneme_comparison') {
      if (!authored(q) || !pureOral(q) || f.requiresLetters !== false || f.position !== 'final'
        || q.choices.some(c => c.label.toLowerCase() === q.targetWord.toLowerCase())
        || !p.targetFinalPhoneme || p.targetWord !== q.targetWord
        || p.choiceFinalPhonemes?.[q.answer] !== p.targetFinalPhoneme
        || Object.values(p.choiceFinalPhonemes || {}).filter(phone => phone === p.targetFinalPhoneme).length !== 1
        || q.choices.some(c => !p.choiceFinalPhonemes[c.id])) return null;
      return 1;
    }
    if (task === 'spoken_medial_vowel_discrimination') return pureOral(q) ? 3 : null;
    if (task === 'blend_phonemes') {
      const phones = allRecordings(q).filter(c => c.role === 'phoneme');
      if (!q.hideWrittenLabels || q.renderTargetText || q.passage || q.image || q.evidenceModality !== 'audio'
        || phones.length !== 3 || allRecordings(q).some(c => c.role === 'target_word' || c.role === 'passage')
        || q.choices.some(c => c.image || !allRecordings(q).some(a => a.role === 'choice' && a.choiceId === c.id && a.text === c.label))) return null;
      if (authored(q) && (f.phonemeCount !== 3 || f.requiresLetters !== false || p.targetWord !== q.targetWord
        || JSON.stringify(p.phonemeCueKeys) !== JSON.stringify(phones.map(c => c.text))
        || p.retained !== q.choices.find(c => c.id === q.answer)?.label
        || p.rejected?.length !== 2 || q.choices.filter(c => c.id !== q.answer).some(c => !p.rejected.includes(c.label)))) return null;
      return 4;
    }
    return literacyMockDemandV8(q);
  }
  if (q.domainId === 'phonics') {
    if (task === 'construct_split_vowel_word_with_spares') {
      if (!construction(q) || f.phonemeCount !== 4 || f.responseUnitCount !== 5 || !f.splitVowel
        || !/^(?:[bcdfghjklmnpqrstvwxyz]{2}[aiou][bcdfghjklmnpqrstvwxyz]e|[bcdfghjklmnpqrstvwxyz]a[bcdfghjklmnpqrstvwxyz]{2}e)$/.test(q.targetWord)
        || !sameTiles(p.responseTiles, [...q.targetWord]) || p.splitVowelPositions?.length !== 2
        || p.splitVowelPositions[1] !== 4 || p.responseTiles[4] !== 'e') return null;
      return 4;
    }
    if (task === 'construct_five_phoneme_team_word') return construction(q) && f.phonemeCount === 5
      && f.responseUnitCount >= 5 && hasTeam(p.responseTiles) && f.vowelTeam ? 5 : null;
    if (task === 'construct_extended_compound_word') return construction(q) && f.phonemeCount >= 6
      && f.responseUnitCount >= 6 && hasTeam(p.responseTiles) && f.vowelTeam
      && (p.compoundParts?.length >= 2 && p.compoundParts.join('') === q.targetWord || p.morphemeExtension && p.morphemeExtension.stem + p.morphemeExtension.suffix === q.targetWord) ? 6 : null;
    const previous = literacyMockDemandV8(q);
    if (previous >= 4) return null;
    if (previous === 3) {
      // Four letters encode four phonemes only in these reviewed regular
      // CCVC/CVCC forms. x, digraphs, doubles and five-phoneme CCVCC do not qualify.
      const word = q.targetWord || q.answer;
      return /^[bcdfghjklmnpqrstvwz]{2}[aeiou][bcdfghjklmnpqrstvwz]$|^[bcdfghjklmnpqrstvwz][aeiou][bcdfghjklmnpqrstvwz]{2}$/.test(word)
        && !/(sh|ch|th|ck|ng|ph|qu|ss|ll|ff|zz)/.test(word) ? 3 : null;
    }
    if (previous === 2 && /x/.test(q.targetWord || q.answer)) return null;
    return previous;
  }
  if (q.domainId === 'language' && task === 'best_restatement') return null;
  if (q.domainId === 'language' && task === 'preserve_explicit_scope') {
    return authored(q) && f.parallelScopeContrasts === 2 && typeof f.scope === 'string'
      && p.source === q.passage && p.retained === q.choices.find(c => c.id === q.answer)?.label
      && p.rejected?.length === 2 && q.choices.filter(c => c.id !== q.answer).every(c => p.rejected.includes(c.label)) ? 5 : null;
  }
  if (q.domainId === 'writing') {
    if (task === 'distinguish_complete_dependent_clause_sentence') return authored(q)
      && f.dependentClause === true && f.mainClauseRequired === true && f.competingFragments === 2
      && p.dependentClause && p.mainClause && p.key === q.choices.find(c => c.id === q.answer)?.label ? 5 : null;
    if (task === 'complete_sentence' && q.choices.some(c => /^(after|before|although|because|when|if|unless|while|until|since)\b/i.test(c.label))) return null;
  }
  return literacyMockDemandV8(q);
}
