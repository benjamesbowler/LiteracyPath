import { skillTree } from '../skillTree.js';

export const LITERACY_PRACTICE_ID = 'literacy-practice';
export const LITERACY_PRACTICE_VERSION = 'literacy-practice-v1';
export const LITERACY_PRACTICE_TURNS = 40;
export const LITERACY_PRACTICE_LEGACY_TURNS = 12;
export const LITERACY_FOCUSED_TURNS = 6;
export const LITERACY_DOMAINS = Object.freeze([
  { id: 'sound_awareness', label: 'Sounds in words', childLabel: 'Listen to sounds', image: '/images/navigation/ui/sounds-icon.webp', suggestion: 'Say words slowly, compare their sounds, and try a new spoken example.' },
  { id: 'phonics', label: 'Phonics and word recognition', childLabel: 'Read words', image: '/images/navigation/ui/words-icon.webp', suggestion: 'Blend the sounds in a fresh word, then check the word in a sentence.' },
  { id: 'vocabulary', label: 'Vocabulary and word structure', childLabel: 'Explore meanings', image: '/images/navigation/ui/words-icon.webp', suggestion: 'Explain the word in context and use it in a different sentence.' },
  { id: 'listening', label: 'Listening comprehension', childLabel: 'Listen and think', image: '/images/navigation/ui/story-icon.webp', suggestion: 'Listen to a short passage, retell it, and explain the clue for an answer.' },
  { id: 'reading', label: 'Reading comprehension', childLabel: 'Read and think', image: '/images/navigation/ui/books-icon.webp', suggestion: 'Read a fresh passage and point to evidence for the answer.' },
  { id: 'language', label: 'Grammar and language', childLabel: 'Build sentences', image: '/images/navigation/ui/story-icon.webp', suggestion: 'Compare the complete sentences and explain how the changed word affects meaning.' },
  { id: 'print', label: 'Print and book knowledge', childLabel: 'Explore books', image: '/images/navigation/ui/books-icon.webp', suggestion: 'Use a real book to find its title, author, words, and reading direction.' },
  { id: 'writing', label: 'Writing and conventions', childLabel: 'Be a writer', image: '/images/navigation/ui/map-icon.webp', suggestion: 'Revise a short message for its reader, then explain the spelling or punctuation choice.' }
]);
const groups = {
  sound_awareness: ['initial_sounds', 'final_sounds', 'rhyming', 'short_vowel_discrimination'],
  phonics: ['cvc_short_vowels', 'blends', 'digraphs', 'long_vowels', 'vowel_teams', 'r_controlled', 'hfw_1_25', 'hfw_26_50', 'hfw_51_75', 'hfw_76_100'],
  vocabulary: ['prefix_suffix', 'antonyms_synonyms', 'homophones', 'context_clues'],
  language: ['nouns', 'verbs', 'adjectives', 'prepositions', 'plurals', 'sentence_comprehension'],
  reading: ['key_details', 'sequencing', 'main_idea', 'inference', 'cause_effect', 'theme']
};
export const LITERACY_LISTENING_SKILLS = ['key_details', 'sequencing', 'main_idea', 'inference', 'cause_effect', 'theme'];
export function literacySkill(id, label, domainId, suggestion) {
  const domain = LITERACY_DOMAINS.find(value => value.id === domainId);
  return Object.freeze({ id, label, domainId, domainLabel: domain.label, suggestion: suggestion || domain.suggestion });
}
export const LITERACY_CORE_SKILLS = Object.freeze([
  ...skillTree.map(skill => literacySkill(skill.id, skill.label, Object.keys(groups).find(key => groups[key].includes(skill.id)))),
  ...LITERACY_LISTENING_SKILLS.map(id => literacySkill(`listen_${id}`, `Listening: ${skillTree.find(skill => skill.id === id).label}`, 'listening'))
]);
