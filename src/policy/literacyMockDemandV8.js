import { literacyMockDemandV7, LITERACY_MOCK_V7_LADDERS } from './literacyMockDemandV7.js';
import { LITERACY_MOCK_V8_HFW_FLOOR_WORDS } from '../data/literacyMockRetakeFoundations.js';

export const LITERACY_MOCK_V8_LADDERS = LITERACY_MOCK_V7_LADDERS;
const familiarShortWords = new Set(LITERACY_MOCK_V8_HFW_FLOOR_WORDS);
// Worked examples speak/show these whole words before scoring starts. Reserve
// their lexical targets across formats and areas in this publication.
const workedTutorialWords = new Set(['cat', 'cup', 'hat', 'dog', 'the', 'puppy', 'sleeps', 'clouds', 'cover', 'moon']);

/** New stock supplies more independent targets at the same operation. A list
 * position or a new item id never raises an item's demand. */
export function literacyMockDemandV8(q) {
  if (q.tutorialOnly || workedTutorialWords.has(q.targetWord?.toLowerCase())
    || workedTutorialWords.has(q.passage?.trim().toLowerCase())) return null;
  if (q.domainId === 'phonics' && familiarShortWords.has(q.targetWord?.toLowerCase())
    && q.skillId.startsWith('hfw_') && q.format === 'choice' && !q.passage
    && ['spoken_to_print_high_frequency_word_recognition', 'spoken_to_print_hfw_orthographic_discrimination'].includes(q.constructClaim)) return 0;
  if (q.domainId === 'vocabulary' && q.constructClaim === 'apply_affix_meaning_in_context'
    && q.sourceProvenance?.file === 'src/data/literacyMockRetakeVocabulary.js'
    && q.taskDemand?.reviewed === true && q.taskDemand.features?.sameRootAlternatives === 3
    && q.taskDemand.features?.contextualContrast === true && q.taskDemand.proof?.forms?.length === 3) return 4;
  // These old upper-rung stories state the keyed moral in their endings.
  // Keep the immutable records, but do not deliver them in the new route.
  if (['reading', 'listening'].includes(q.domainId)
    && q.constructClaim?.replace(/^listening_/, '') === 'lesson_mistake_fixed'
    && q.taskDemand?.features?.episodesToIntegrate === 2
    && /Both used another person’s response to improve their work\.|Their notes preserved information they had previously lost\./.test(q.passage)) return null;
  return literacyMockDemandV7(q);
}
