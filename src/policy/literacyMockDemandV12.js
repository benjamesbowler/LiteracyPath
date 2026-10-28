import { literacyMockDemandV11, LITERACY_MOCK_V11_LADDERS } from './literacyMockDemandV11.js';
import { LITERACY_MOCK_BEGINNER_READING_V12_SOURCE } from '../data/literacyMockBeginnerReadingV12.js';
import { LITERACY_MOCK_BEGINNER_WRITING_V12_SOURCE } from '../data/literacyMockBeginnerWritingV12.js';

export const LITERACY_MOCK_V12_LADDERS = LITERACY_MOCK_V11_LADDERS;

export function literacyMockDemandV12(q, options) {
  const file = q.sourceProvenance?.file;
  if (file === LITERACY_MOCK_BEGINNER_READING_V12_SOURCE) {
    const proof = q.taskDemand?.proof, features = q.taskDemand?.features;
    const labels = q.choices?.map(c => c.label) || [];
    const valid = q.domainId === 'reading' && q.skillId === 'picture_word_reading'
      && q.format === 'choice' && q.modality === 'reading' && q.evidenceModality === 'image+print'
      && q.taskDemand?.reviewed === true && q.taskDemand.operation === q.constructClaim
      && q.routeReservationArea === 'reading' && !q.renderTargetText && !q.hideWrittenLabels && !q.passage
      && q.image === proof?.targetImage && q.imageAlt === q.targetWord && proof?.targetWord === q.targetWord
      && proof.retained === q.targetWord && proof.targetPhonemes?.length === 3
      && features?.phonemeCount === 3 && features.silentPrintedResponses === true
      && labels.length === 4 && new Set(labels).size === 4 && labels.every(label => /^[a-z]{3}$/.test(label))
      && q.choices.find(c => c.id === q.answer)?.label === q.targetWord
      && q.choices.every(c => !c.image && !c.audioPath)
      && JSON.stringify(proof.rejected) === JSON.stringify(q.choices.filter(c => c.id !== q.answer).map(c => c.label))
      && q.requiredAudioCues.length === 1 && q.requiredAudioCues[0].role === 'instruction';
    if (!valid) return null;
    if (q.constructClaim === 'read_word_distinct_initials' && features.distinctInitials === true
      && new Set(labels.map(word => word[0])).size === 4) return 0;
    if (q.constructClaim === 'read_complete_cvc_word' && features.completeWordContrast === true
      && labels.filter(word => word[0] === q.targetWord[0]).length >= 2) return 1;
    return null;
  }
  if (file === LITERACY_MOCK_BEGINNER_WRITING_V12_SOURCE) {
    const proof = q.taskDemand?.proof, features = q.taskDemand?.features;
    const labels = q.choices?.map(c => c.label) || [];
    const sentenceCase = value => /^[A-Z][^A-Z]*[.?]$/.test(value);
    return q.domainId === 'writing' && q.skillId === 'capitalization' && q.format === 'choice'
      && q.constructClaim === 'sentence_capital' && q.taskDemand?.operation === 'capitalize_sentence'
      && q.taskDemand.reviewed === true && q.routeReservationArea === 'writing'
      && !q.passage && !q.image && !q.renderTargetText && !q.hideWrittenLabels
      && features?.silentPrintedResponses === true && features.responseCount === 4 && features.sameWording === true
      && labels.length === 4 && new Set(labels).size === 4 && new Set(labels.map(label => label.toLowerCase())).size === 1
      && labels.filter(sentenceCase).length === 1 && q.choices.find(c => c.id === q.answer)?.label === proof?.sentence
      && proof.retained === proof.sentence && sentenceCase(proof.sentence)
      && JSON.stringify(proof.rejected) === JSON.stringify(q.choices.filter(c => c.id !== q.answer).map(c => c.label))
      && q.choices.every(c => !c.image && !c.audioPath)
      && q.requiredAudioCues.length === 1 && q.requiredAudioCues[0].role === 'instruction' ? 1 : null;
  }
  return literacyMockDemandV11(q, options);
}
