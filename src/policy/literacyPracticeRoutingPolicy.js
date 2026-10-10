// Authored local task-demand labels; these are not calibrated ability scores.
const ENTRY_SKILLS = new Set(['initial_sounds', 'letter_knowledge']);
const WORD_SKILLS = new Set(['cvc_short_vowels', 'antonyms_synonyms', 'final_sounds', 'rhyming', 'short_vowel_discrimination', 'syllable_awareness']);
export function literacyQuestionDemand(question) {
  if (question.practiceOnly && Number.isInteger(question.practiceDemand) && question.practiceDemand >= 0 && question.practiceDemand <= 4) return question.practiceDemand;
  const domain = question.literacyDomainId || question.domainId;
  const basicSound = (question.skillId || question.id) !== 'initial_sounds' || !question.formatType || question.formatType === 'FIRST_SOUND';
  const base = ENTRY_SKILLS.has(question.skillId || question.id) ? (basicSound ? 0 : 1) : WORD_SKILLS.has(question.skillId || question.id) ? 1
    : ['reading', 'listening'].includes(domain) ? 3 : 2;
  return base + (Number(question.level || 1) === 2 ? 1 : 0);
}
