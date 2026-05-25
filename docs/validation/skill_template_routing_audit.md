# Skill Template Routing Audit

Generated: 2026-05-25

This audit documents the new runtime routing gate. Wrong-template questions are blocked from active runtime selection rather than patched visually.

| Skill | Current source template distribution | Blocked by routing gate |
| --- | --- | --- |
| CVC and Short Vowels | UNKNOWN:26, HEARD_WORD_TO_PRINT_MINIMAL_PAIR:27, PICTURE_TO_PRINT_MATCH:67, LISTEN_CHOOSE_VOWEL:40, MISSING_VOWEL_CVC:15, PUT_SOUNDS_IN_ORDER:30, COMPLETE_WORD:15, SHORT_VOWEL_WORD:30, MULTIPLE_CHOICE:73 | 99 |
| Initial Sounds | UNKNOWN:40, INITIAL_SOUND_PAIR_SELECT:50, FIRST_SOUND:30, MULTIPLE_CHOICE:20 | 60 |
| Final Sounds | UNKNOWN:22, FINAL_SOUND_PAIR_SELECT:76, ENDING_SOUND:89, MULTIPLE_CHOICE:22 | 44 |
| Rhyming | UNKNOWN:15, RHYME_PAIR_SELECT:37, LISTEN_FIND_RHYME:13, READ_FIND_RHYME:13, RHYMING_PICTURE:30, MULTIPLE_CHOICE:28 | 43 |
| Blends | PICTURE_AUDIO_TO_PATTERN:22, IMAGE_WORD_PATTERN_MATCH:19, HEARD_WORD_TO_PRINT_MINIMAL_PAIR:11, BLEND_SOUNDS:30, MULTIPLE_CHOICE:35, UNKNOWN:5 | 40 |
| Digraphs | PICTURE_AUDIO_TO_PATTERN:15, IMAGE_WORD_PATTERN_MATCH:21, HEARD_WORD_TO_PRINT_MINIMAL_PAIR:18, MULTIPLE_CHOICE:53, UNKNOWN:4 | 57 |
| Plurals | PLURAL_IMAGE_SPELLING:7, PLURAL_SPELLING_CONTEXT:18, MULTIPLE_CHOICE:8, UNKNOWN:76 | 0 |
| High-Frequency Words 1-25 | LISTEN_FIND_WORD:9, READ_FIND_WORD:12, CLOZE_CHOICE:40 | 0 |
| High-Frequency Words 26-50 | LISTEN_FIND_WORD:11, READ_FIND_WORD:12, CLOZE_CHOICE:40 | 0 |
| Prefixes and Suffixes | MORPHEME_MEANING_CONTEXT:52, MULTIPLE_CHOICE:38 | 0 |
| Sentence Comprehension | COMPREHENSION:1, SENTENCE_MATCHES_PICTURE:30, UNKNOWN:100, FIX_SENTENCE:10 | 0 |
| Inference | COMPREHENSION:7, UNKNOWN:79, MULTIPLE_CHOICE:20 | 0 |
| Context Clues | COMPREHENSION:7, MULTIPLE_CHOICE:59 | 0 |
| Nouns | VOCABULARY_CATEGORY:30, MULTIPLE_CHOICE:39 | 0 |
| Verbs | GRAMMAR_BASICS:36, MULTIPLE_CHOICE:39 | 0 |
| Long Vowels and Silent E | DECODING:26, MULTIPLE_CHOICE:43 | 0 |
| Vowel Teams | DECODING:33, MULTIPLE_CHOICE:43 | 0 |
| R-Controlled Vowels | DECODING:11, MULTIPLE_CHOICE:45 | 0 |
| Homophones and Homonyms | HOMOPHONE_MEANING:38, MULTIPLE_CHOICE:14 | 0 |
| Prepositions of Place | IMAGE_CHOICE:37, GRAMMAR_BASICS:32 | 0 |
| Adjectives | MULTIPLE_CHOICE:39, GRAMMAR_BASICS:22 | 0 |
| Key Details | MULTIPLE_CHOICE:59 | 0 |
| Sequencing | MULTIPLE_CHOICE:59 | 0 |
| Main Idea | MULTIPLE_CHOICE:59, COMPREHENSION:6 | 0 |
| Cause and Effect | MULTIPLE_CHOICE:59, COMPREHENSION:6 | 0 |
| Theme and Higher Comprehension | MULTIPLE_CHOICE:59, COMPREHENSION:6 | 0 |
| High-Frequency Words 51-100 | CLOZE_CHOICE:30, MULTIPLE_CHOICE:40 | 0 |
| Antonyms and Synonyms | MULTIPLE_CHOICE:4, UNKNOWN:61 | 0 |

## Allowed Templates

- Initial Sounds: FIRST_SOUND, INITIAL_SOUND_PAIR_SELECT
- Ending Sounds: ENDING_SOUND, FINAL_SOUND_PAIR_SELECT
- CVC / Short Vowels: HEARD_WORD_TO_PRINT_MINIMAL_PAIR, PICTURE_TO_PRINT_MATCH, MISSING_VOWEL_CVC, PUT_SOUNDS_IN_ORDER, COMPLETE_WORD, SHORT_VOWEL_WORD, LISTEN_CHOOSE_VOWEL
- High-Frequency Words: LISTEN_FIND_WORD, READ_FIND_WORD, CLOZE_CHOICE, MULTIPLE_CHOICE with approved sight-word answer only
- Blends: PICTURE_AUDIO_TO_PATTERN, IMAGE_WORD_PATTERN_MATCH, HEARD_WORD_TO_PRINT_MINIMAL_PAIR, BLEND_SOUNDS
- Digraphs: PICTURE_AUDIO_TO_PATTERN, IMAGE_WORD_PATTERN_MATCH, HEARD_WORD_TO_PRINT_MINIMAL_PAIR

## Blocked Examples

| Skill | Question ID | Format | Reason |
| --- | --- | --- | --- |
| CVC and Short Vowels | core_cvc_001 | UNKNOWN | UNKNOWN is not allowed for cvc_short_vowels |
| CVC and Short Vowels | core_cvc_002 | UNKNOWN | UNKNOWN is not allowed for cvc_short_vowels |
| CVC and Short Vowels | core_cvc_003 | UNKNOWN | UNKNOWN is not allowed for cvc_short_vowels |
| CVC and Short Vowels | core_cvc_004 | UNKNOWN | UNKNOWN is not allowed for cvc_short_vowels |
| CVC and Short Vowels | core_cvc_005 | UNKNOWN | UNKNOWN is not allowed for cvc_short_vowels |
| CVC and Short Vowels | core_cvc_006 | UNKNOWN | UNKNOWN is not allowed for cvc_short_vowels |
| Initial Sounds | extra_initial_1 | UNKNOWN | UNKNOWN is not allowed for initial_sounds |
| Initial Sounds | extra_initial_2 | UNKNOWN | UNKNOWN is not allowed for initial_sounds |
| Initial Sounds | extra_initial_3 | UNKNOWN | UNKNOWN is not allowed for initial_sounds |
| Initial Sounds | extra_initial_4 | UNKNOWN | UNKNOWN is not allowed for initial_sounds |
| Initial Sounds | extra_initial_5 | UNKNOWN | UNKNOWN is not allowed for initial_sounds |
| Initial Sounds | extra_initial_6 | UNKNOWN | UNKNOWN is not allowed for initial_sounds |
| Initial Sounds | extra_initial_7 | UNKNOWN | UNKNOWN is not allowed for initial_sounds |
| Initial Sounds | extra_initial_8 | UNKNOWN | UNKNOWN is not allowed for initial_sounds |
| Initial Sounds | extra_initial_9 | UNKNOWN | UNKNOWN is not allowed for initial_sounds |
| Initial Sounds | extra_initial_10 | UNKNOWN | UNKNOWN is not allowed for initial_sounds |
| Initial Sounds | extra_initial_11 | UNKNOWN | UNKNOWN is not allowed for initial_sounds |
| Initial Sounds | extra_initial_12 | UNKNOWN | UNKNOWN is not allowed for initial_sounds |
| Initial Sounds | extra_initial_13 | UNKNOWN | UNKNOWN is not allowed for initial_sounds |
| Initial Sounds | extra_initial_14 | UNKNOWN | UNKNOWN is not allowed for initial_sounds |
| Initial Sounds | extra_initial_15 | UNKNOWN | UNKNOWN is not allowed for initial_sounds |
| Final Sounds | extra_final_1 | UNKNOWN | UNKNOWN is not allowed for final_sounds |
| Final Sounds | extra_final_2 | UNKNOWN | UNKNOWN is not allowed for final_sounds |
| Final Sounds | extra_final_3 | UNKNOWN | UNKNOWN is not allowed for final_sounds |
| Final Sounds | extra_final_4 | UNKNOWN | UNKNOWN is not allowed for final_sounds |
| Final Sounds | extra_final_5 | UNKNOWN | UNKNOWN is not allowed for final_sounds |
| Final Sounds | extra_final_6 | UNKNOWN | UNKNOWN is not allowed for final_sounds |
| Final Sounds | extra_final_7 | UNKNOWN | UNKNOWN is not allowed for final_sounds |
| Final Sounds | extra_final_8 | UNKNOWN | UNKNOWN is not allowed for final_sounds |
| Final Sounds | extra_final_9 | UNKNOWN | UNKNOWN is not allowed for final_sounds |
| Final Sounds | extra_final_10 | UNKNOWN | UNKNOWN is not allowed for final_sounds |
| Rhyming | extra_rhyme_1 | UNKNOWN | UNKNOWN is not allowed for rhyming |
| Rhyming | extra_rhyme_2 | UNKNOWN | UNKNOWN is not allowed for rhyming |
| Rhyming | extra_rhyme_3 | UNKNOWN | UNKNOWN is not allowed for rhyming |
| Rhyming | extra_rhyme_4 | UNKNOWN | UNKNOWN is not allowed for rhyming |
| Rhyming | extra_rhyme_5 | UNKNOWN | UNKNOWN is not allowed for rhyming |
| Rhyming | extra_rhyme_6 | UNKNOWN | UNKNOWN is not allowed for rhyming |
| Rhyming | extra_rhyme_7 | UNKNOWN | UNKNOWN is not allowed for rhyming |
| Rhyming | extra_rhyme_8 | UNKNOWN | UNKNOWN is not allowed for rhyming |
| Rhyming | extra_rhyme_9 | UNKNOWN | UNKNOWN is not allowed for rhyming |
| Rhyming | extra_rhyme_10 | UNKNOWN | UNKNOWN is not allowed for rhyming |
| Rhyming | extra_rhyme_11 | UNKNOWN | UNKNOWN is not allowed for rhyming |
| Rhyming | extra_rhyme_12 | UNKNOWN | UNKNOWN is not allowed for rhyming |
| Rhyming | extra_rhyme_13 | UNKNOWN | UNKNOWN is not allowed for rhyming |
| Rhyming | extra_rhyme_14 | UNKNOWN | UNKNOWN is not allowed for rhyming |
| Rhyming | extra_rhyme_15 | UNKNOWN | UNKNOWN is not allowed for rhyming |
| CVC and Short Vowels | extra_short_vowel_1 | UNKNOWN | UNKNOWN is not allowed for cvc_short_vowels |
| CVC and Short Vowels | extra_short_vowel_2 | UNKNOWN | UNKNOWN is not allowed for cvc_short_vowels |
| CVC and Short Vowels | extra_short_vowel_3 | UNKNOWN | UNKNOWN is not allowed for cvc_short_vowels |
| CVC and Short Vowels | extra_short_vowel_4 | UNKNOWN | UNKNOWN is not allowed for cvc_short_vowels |
| CVC and Short Vowels | extra_short_vowel_5 | UNKNOWN | UNKNOWN is not allowed for cvc_short_vowels |
| CVC and Short Vowels | extra_short_vowel_6 | UNKNOWN | UNKNOWN is not allowed for cvc_short_vowels |
| CVC and Short Vowels | extra_short_vowel_7 | UNKNOWN | UNKNOWN is not allowed for cvc_short_vowels |
| CVC and Short Vowels | extra_short_vowel_8 | UNKNOWN | UNKNOWN is not allowed for cvc_short_vowels |
| CVC and Short Vowels | extra_short_vowel_9 | UNKNOWN | UNKNOWN is not allowed for cvc_short_vowels |
| CVC and Short Vowels | extra_short_vowel_10 | UNKNOWN | UNKNOWN is not allowed for cvc_short_vowels |
| Initial Sounds | template_initial_1 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for initial_sounds |
| Initial Sounds | template_initial_2 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for initial_sounds |
| Initial Sounds | template_initial_3 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for initial_sounds |
| Initial Sounds | template_initial_4 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for initial_sounds |
| Initial Sounds | template_initial_5 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for initial_sounds |
| Final Sounds | template_final_1 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for final_sounds |
| Final Sounds | template_final_2 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for final_sounds |
| Final Sounds | template_final_3 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for final_sounds |
| Final Sounds | template_final_4 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for final_sounds |
| Blends | template_blend_1 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for blends |
| Blends | template_blend_2 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for blends |
| Blends | template_blend_3 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for blends |
| Blends | template_blend_4 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for blends |
| Blends | template_blend_5 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for blends |
| Blends | template_blend_6 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for blends |
| Blends | template_blend_7 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for blends |
| Blends | template_blend_8 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for blends |
| Blends | template_blend_9 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for blends |
| Blends | template_blend_10 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for blends |
| Digraphs | template_digraph_1 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for digraphs |
| Digraphs | template_digraph_2 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for digraphs |
| Digraphs | template_digraph_3 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for digraphs |
| Digraphs | template_digraph_4 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for digraphs |
| Digraphs | template_digraph_5 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for digraphs |
| Digraphs | template_digraph_6 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for digraphs |
| Digraphs | template_digraph_7 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for digraphs |
| Rhyming | exp2_rhyme_1 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for rhyming |
| Rhyming | exp2_rhyme_2 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for rhyming |
| Rhyming | exp2_rhyme_3 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for rhyming |
| Rhyming | exp2_rhyme_4 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for rhyming |
| Rhyming | exp2_rhyme_5 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for rhyming |
| Rhyming | exp2_rhyme_6 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for rhyming |
| Rhyming | exp2_rhyme_7 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for rhyming |
| Rhyming | exp2_rhyme_8 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for rhyming |
| Rhyming | exp2_rhyme_9 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for rhyming |
| Rhyming | exp2_rhyme_10 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for rhyming |
| CVC and Short Vowels | exp2_short_vowel_1 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for cvc_short_vowels |
| CVC and Short Vowels | exp2_short_vowel_2 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for cvc_short_vowels |
| CVC and Short Vowels | exp2_short_vowel_3 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for cvc_short_vowels |
| CVC and Short Vowels | exp2_short_vowel_4 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for cvc_short_vowels |
| CVC and Short Vowels | exp2_short_vowel_5 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for cvc_short_vowels |
| CVC and Short Vowels | exp2_short_vowel_6 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for cvc_short_vowels |
| CVC and Short Vowels | exp2_short_vowel_7 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for cvc_short_vowels |
| CVC and Short Vowels | exp2_short_vowel_8 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for cvc_short_vowels |
| CVC and Short Vowels | exp2_short_vowel_9 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for cvc_short_vowels |
| CVC and Short Vowels | exp2_short_vowel_10 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for cvc_short_vowels |
| Digraphs | exp2_digraph_1 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for digraphs |
| Digraphs | exp2_digraph_2 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for digraphs |
| Digraphs | exp2_digraph_3 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for digraphs |
| Digraphs | exp2_digraph_4 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for digraphs |
| Digraphs | exp2_digraph_5 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for digraphs |
| Digraphs | exp2_digraph_6 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for digraphs |
| Digraphs | exp2_digraph_7 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for digraphs |
| Digraphs | exp2_digraph_8 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for digraphs |
| Digraphs | exp2_digraph_9 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for digraphs |
| Digraphs | exp2_digraph_10 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for digraphs |
| CVC and Short Vowels | exp4_short_vowel_1 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for cvc_short_vowels |
| CVC and Short Vowels | exp4_short_vowel_2 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for cvc_short_vowels |
| CVC and Short Vowels | exp4_short_vowel_3 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for cvc_short_vowels |
| CVC and Short Vowels | exp4_short_vowel_4 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for cvc_short_vowels |
| CVC and Short Vowels | exp4_short_vowel_5 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for cvc_short_vowels |
| CVC and Short Vowels | exp4_short_vowel_6 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for cvc_short_vowels |
| CVC and Short Vowels | exp4_short_vowel_7 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for cvc_short_vowels |
| CVC and Short Vowels | exp4_short_vowel_8 | MULTIPLE_CHOICE | MULTIPLE_CHOICE is not allowed for cvc_short_vowels |
