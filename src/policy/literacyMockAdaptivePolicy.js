import { literacySkill } from './literacyPracticePolicy.js';

export const LITERACY_MOCK_AREA_VERSION = 'areas-v1';
export const LITERACY_MOCK_FOUNDATION_SKILLS = Object.freeze([
  literacySkill('picture_vocabulary', 'Everyday picture vocabulary', 'vocabulary', 'Say a familiar word and ask the child to point to its picture. Recheck with a different example.'),
  literacySkill('picture_word_reading', 'Reading first words', 'reading', 'Build and read a short word together, then check a fresh pictured word without saying the target.'),
  literacySkill('listen_words_phrases', 'Listening to words and short phrases', 'listening', 'Listen to a familiar word or short phrase and choose its picture. Try a fresh short sentence when ready.'),
]);
export const LITERACY_MOCK_AREA_ORDER = Object.freeze(['sound_awareness','phonics','print','vocabulary','listening','language','reading','writing']);
export const LITERACY_MOCK_AREA_COUNTS = Object.freeze({sound_awareness:5,phonics:6,print:5,vocabulary:5,listening:6,language:5,reading:6,writing:5});
export const LITERACY_MOCK_AREA_MAX = Object.freeze({sound_awareness:5,phonics:6,print:4,vocabulary:5,listening:6,language:5,reading:6,writing:5});
export const LITERACY_MOCK_BAND_NAMES = Object.freeze(['First steps','Starter','Early','Building','Developing','Extending','Further challenge']);

// Published bands and saved answers stay immutable. New phonics selection must
// also satisfy the task ladder: frequency-list position is not word difficulty.
export function isLiteracyMockAreaRouteItem(item) {
  if(item.contentVersion==='literacy-mock-v6')return item.adaptiveMixedEligible===true&&Boolean(item.adaptiveDemand);
  if (item.domainId !== 'phonics') return true;
  if (item.adaptiveAreaBand === 0) return item.format === 'choice' && !item.passage
    && ['spoken_to_print_high_frequency_word_recognition', 'spoken_to_print_hfw_orthographic_discrimination'].includes(item.constructClaim);
  if (item.skillId.startsWith('hfw_')) return false;
  const cvc = word => /^[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz]$/i.test(word || '');
  if (item.adaptiveAreaBand === 1) return cvc(item.targetWord) && item.choices.every(choice => cvc(choice.label));
  if (item.adaptiveAreaBand === 2) return item.format === 'build_word' && cvc(item.targetWord || item.answer);
  return true;
}

// An authored curricular route, not a calibrated scale. Each rule describes
// the actual task/access conditions; source Level 1 is never treated as a
// universal beginner band. The publisher emits these same rules into SQL.
export const LITERACY_MOCK_AREA_RULES = Object.freeze([
  {skill:'initial_sounds',task:'^initial_sound_discrimination$',level:1,band:0},
  {skill:'initial_sounds',task:'^initial_sound_grapheme_mapping$',level:1,band:1,evidence:'audio+image+print'},
  {skill:'hfw_1_25',level:1,band:0,target:'^(a|i|in|on|it|is|at|up|to|my|me|we)$'},
  {skill:'cvc_short_vowels',task:'^match_spoken_short_vowel_word:',level:1,band:1},
  {skill:'letter_knowledge',task:'^letter_name$',level:1,band:0},
  {skill:'letter_knowledge',task:'^letter_case_correspondence$',level:1,band:1},
  {skill:'print_concepts',task:'^(first_letter|last_letter|word_vs_letter|word_spaces|reading_direction)$',level:1,band:2},
  {skill:'print_concepts',task:'^(title|author|illustrator|first_word|last_word)$',level:1,band:3},
  {skill:'print_concepts',level:2,band:4},
  {skill:'letter_knowledge',level:2,band:3},
  {skill:'syllable_awareness',level:1,band:2},
  {skill:'rhyming',task:'^spoken_rhyme_discrimination$',level:1,evidence:'audio+image',band:2},
  {skill:'final_sounds',task:'^final_sound_discrimination$',level:1,band:3},
  {skill:'short_vowel_discrimination',level:1,band:3},
  {skill:'sound_manipulation',task:'^blend_phonemes$',level:1,band:4},
  {skill:'syllable_awareness',level:2,band:4},
  {skill:'rhyming',task:'^spoken_rhyme_pair$',level:2,band:4},
  {skill:'initial_sounds|final_sounds|short_vowel_discrimination|sound_manipulation',level:2,band:5},
  {skill:'cvc_short_vowels',task:'^construct_short_vowel_phoneme_sequence:',level:1,band:2},
  {skill:'hfw_1_25',level:1,band:2},
  {skill:'blends|digraphs|hfw_26_50',level:1,band:3},
  {skill:'long_vowels|r_controlled|hfw_51_75',level:1,band:4},
  {skill:'vowel_teams|hfw_76_100',level:1,band:5},
  {skill:'blends|digraphs|hfw_1_25|hfw_26_50',level:2,band:5},
  {skill:'cvc_short_vowels|long_vowels|vowel_teams|r_controlled|hfw_51_75|hfw_76_100',level:2,band:6},
  {skill:'antonyms_synonyms',level:1,band:2},
  {skill:'context_clues',level:1,band:3},
  {skill:'prefix_suffix',level:1,band:4},
  {skill:'homophones',level:1,band:5},
  {skill:'prefix_suffix|antonyms_synonyms|homophones|context_clues',level:2,band:5},
  {skill:'listen_key_details|key_details',level:1,maxWords:10,band:2},
  {skill:'listen_sequencing|listen_cause_effect|sequencing|cause_effect',level:1,band:3},
  {skill:'listen_main_idea|listen_inference|main_idea|inference',level:1,band:4},
  {skill:'listen_theme|theme|informational_features|literary_craft',level:1,band:5},
  {skill:'listen_key_details|key_details',level:2,band:5},
  {skill:'listen_sequencing|listen_main_idea|listen_inference|listen_cause_effect|listen_theme|sequencing|main_idea|inference|cause_effect|theme|informational_features|literary_craft',level:2,band:6},
  {skill:'nouns|verbs',level:1,band:2},
  {skill:'prepositions',task:'^(in|on|under|behind|next_to|above|below)$',level:1,band:2},
  {skill:'adjectives|plurals|sentence_comprehension',level:1,band:3},
  {skill:'nouns|verbs|adjectives|prepositions',level:2,band:4},
  {skill:'plurals|sentence_comprehension',level:2,band:5},
  {skill:'capitalization',task:'^sentence_capital$',level:1,band:1},
  {skill:'writing_organization',task:'^sentence_word_order$',level:1,band:2},
  {skill:'writing_revision',task:'^complete_sentence$',level:1,band:2},
  {skill:'punctuation|writing_purpose',level:1,band:3},
  {skill:'writing_organization|writing_revision',level:1,band:4},
  {skill:'capitalization|punctuation|writing_purpose|writing_organization|writing_revision',level:2,band:5},
]);

export function literacyMockAuthoredBand(item) {
  if (Number.isInteger(item.foundationBand)) return item.foundationBand;
  const skill=item.skillId,task=item.constructClaim||'',words=String(item.passage||'').trim().split(/\s+/).filter(Boolean).length;
  return LITERACY_MOCK_AREA_RULES.find(rule=>new RegExp(`^(?:${rule.skill})$`).test(skill)
    && item.level===rule.level && (!rule.task||new RegExp(rule.task).test(task))
    && (!rule.evidence||item.evidenceModality===rule.evidence)
    && (!rule.target||new RegExp(rule.target,'i').test(item.targetWord||''))
    && (rule.maxWords===undefined||words<=rule.maxWords))?.band ?? null;
}

export function literacyMockAreaSchedule(count=43) {
  if(count!==43)throw new Error('The adaptive area test has 43 questions.');
  const left={...LITERACY_MOCK_AREA_COUNTS},result=[];
  while(result.length<count)for(const domain of LITERACY_MOCK_AREA_ORDER) {
    const take=Math.min(2,left[domain]);for(let i=0;i<take;i++)result.push(domain);left[domain]-=take;
  }
  return result;
}
