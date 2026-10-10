/** Original classroom sampling policy; these are not NWEA domain weights. */
export const LITERACY_MOCK_BLUEPRINT_VERSION = 'content-interleaved-v1';
export const LITERACY_MOCK_OPENING_DOMAINS = Object.freeze([
  'sound_awareness', 'phonics', 'print', 'vocabulary', 'listening', 'language', 'reading', 'writing',
]);
export const LITERACY_MOCK_ADDITIONAL_DOMAINS = Object.freeze({
  24: Object.freeze(['phonics', 'sound_awareness', 'vocabulary', 'reading']),
  43: Object.freeze(['phonics', 'sound_awareness', 'reading', 'listening', 'language', 'writing',
    'phonics', 'vocabulary', 'reading', 'listening', 'writing', 'language', 'phonics', 'sound_awareness']),
});
export const LITERACY_MOCK_ENTRY_SKILLS = Object.freeze({
  sound_awareness: Object.freeze(['initial_sounds', 'final_sounds', 'rhyming', 'syllable_awareness']),
  phonics: Object.freeze(['cvc_short_vowels', 'hfw_1_25']),
});
