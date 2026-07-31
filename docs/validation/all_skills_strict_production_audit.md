# LiteracyPath Strict Production Assessment Audit

Generated: 2026-07-31T09:33:54.125Z

## Strict Standard

The audit imports `src/content/releaseStandard.js` version 2026.07.24-a1.4. Each managed skill requires 92 total strict-usable questions (46 at both Level 1 and Level 2), 15 questions per phase, at least 20 unique targets per level, complete required media, zero accessibility content issues, and no target above 20% of a level.

## Top-Level Summary

| Metric | Value |
| --- | --- |
| Total skills audited | 30 |
| Skills fully production-ready | 29 |
| Skills with enough quantity but weak balance | 0 |
| Skills missing Level 1 depth | 0 |
| Skills missing Level 2 depth | 1 |
| Skills missing images | 0 |
| Skills missing audio | 0 |
| Skills with stale media warnings | 0 |
| Skills needing new Kimi image generation | 0 |
| Skills needing new Kimi audio generation | 0 |
| Skills needing Claude-written question content | 0 |
| Skills needing only path/wiring fixes | 0 |
| Total exact missing images | 0 |
| Total exact missing audio | 0 |
| Total exact missing questions | 32 |
| Total weak but passing warnings | 0 |

## Status Labels

- PRODUCTION READY
- QUANTITY READY BUT WEAK
- NEEDS QUESTIONS
- NEEDS LEVEL 2 DESIGN
- NEEDS IMAGES
- NEEDS AUDIO
- NEEDS MEDIA WIRING
- BLOCKED

## Per-Skill Strict Table

| # | Skill | Skill ID | Category | Order | Status | Raw | Runtime-safe | Strict usable | L1 raw | L1 runtime | L1 strict | L2 raw | L2 runtime | L2 strict | L1 missing | L2 missing | Total missing | L1 unique | L2 unique | Overused targets | Repeated templates | Req images | Valid images | Missing images | Req audio | Valid audio | Missing audio | Text-only OK | Text-only problem | Exact next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Initial Sounds | initial_sounds | Phonics | 1 | PRODUCTION READY | 152 | 133 | 92 | 70 | 51 | 46 | 82 | 82 | 46 | 0 | 0 | 0 | 20 | 25 | - | FIRST_SOUND:28, INITIAL_SOUND_PAIR_SELECT:18, INITIAL_SOUND_PAIR_SELECT:28, FIRST_SOUND:18 | 152 | 152 | 0 | 152 | 152 | 0 | 0 | 0 | No immediate content action. |
| 2 | Final Sounds | final_sounds | Phonics | 2 | PRODUCTION READY | 530 | 458 | 366 | 249 | 189 | 189 | 281 | 269 | 177 | 0 | 0 | 0 | 121 | 141 | - | ENDING_SOUND:189, ENDING_SOUND:103, FINAL_SOUND_PAIR_SELECT:74 | 517 | 517 | 0 | 530 | 530 | 0 | 0 | 0 | No immediate content action. |
| 3 | Rhyming | rhyming | Phonological Awareness | 3 | PRODUCTION READY | 803 | 656 | 656 | 602 | 476 | 476 | 201 | 180 | 180 | 0 | 0 | 0 | 82 | 64 | - | RHYMING_PICTURE:476, RHYMING_PICTURE:180 | 798 | 798 | 0 | 799 | 799 | 0 | 3 | 0 | No immediate content action. |
| 4 | CVC Short Vowels | cvc_short_vowels | Phonics | 4 | PRODUCTION READY | 467 | 412 | 412 | 299 | 266 | 266 | 168 | 146 | 146 | 0 | 0 | 0 | 72 | 50 | - | MISSING_VOWEL_CVC:66, HEARD_WORD_TO_PRINT_MINIMAL_PAIR:54, PICTURE_TO_PRINT_MATCH:52, SHORT_VOWEL_WORD:50, PUT_SOUNDS_IN_ORDER:29, COMPLETE_WORD:15 | 466 | 466 | 0 | 466 | 466 | 0 | 1 | 0 | No immediate content action. |
| 5 | Short Vowel Discrimination | short_vowel_discrimination | Phonics | 5 | PRODUCTION READY | 527 | 299 | 299 | 166 | 103 | 103 | 361 | 196 | 196 | 0 | 0 | 0 | 59 | 95 | - | PICTURE_TO_PRINT_MATCH:73, LISTEN_CHOOSE_VOWEL:30, LISTEN_CHOOSE_VOWEL:98, PICTURE_TO_PRINT_MATCH:98 | 511 | 511 | 0 | 516 | 516 | 0 | 10 | 0 | No immediate content action. |
| 6 | High-Frequency Words 1-25 | hfw_1_25 | High-Frequency Words | 6 | PRODUCTION READY | 150 | 147 | 147 | 75 | 72 | 72 | 75 | 75 | 75 | 0 | 0 | 0 | 25 | 25 | - | HFW_SENTENCE_CLOZE_L1P2_02:25, HFW_SENTENCE_CLOZE_L1P2_03:24, HFW_SENTENCE_CLOZE_L1P1_01:23, HFW_SENTENCE_SPELL_L2P1_04:25, HFW_SENTENCE_SPELL_L2P2_05:25, HFW_SENTENCE_SPELL_L2P2_06:25 | 0 | 0 | 0 | 0 | 0 | 0 | 150 | 0 | No immediate content action. |
| 7 | High-Frequency Words 26-50 | hfw_26_50 | High-Frequency Words | 7 | PRODUCTION READY | 150 | 149 | 149 | 75 | 74 | 74 | 75 | 75 | 75 | 0 | 0 | 0 | 25 | 25 | - | HFW_SENTENCE_CLOZE_L1P1_01:25, HFW_SENTENCE_CLOZE_L1P2_03:25, HFW_SENTENCE_CLOZE_L1P2_02:24, HFW_SENTENCE_SPELL_L2P1_04:25, HFW_SENTENCE_SPELL_L2P2_05:25, HFW_SENTENCE_SPELL_L2P2_06:25 | 0 | 0 | 0 | 0 | 0 | 0 | 150 | 0 | No immediate content action. |
| 8 | High-Frequency Words 51-75 | hfw_51_75 | High-Frequency Words | 8 | PRODUCTION READY | 150 | 148 | 148 | 75 | 73 | 73 | 75 | 75 | 75 | 0 | 0 | 0 | 25 | 25 | - | HFW_SENTENCE_CLOZE_L1P2_02:25, HFW_SENTENCE_CLOZE_L1P2_03:25, HFW_SENTENCE_CLOZE_L1P1_01:23, HFW_SENTENCE_SPELL_L2P1_04:25, HFW_SENTENCE_SPELL_L2P2_05:25, HFW_SENTENCE_SPELL_L2P2_06:25 | 0 | 0 | 0 | 0 | 0 | 0 | 150 | 0 | No immediate content action. |
| 9 | High-Frequency Words 76-100 | hfw_76_100 | High-Frequency Words | 9 | PRODUCTION READY | 148 | 144 | 144 | 73 | 70 | 70 | 75 | 74 | 74 | 0 | 0 | 0 | 25 | 25 | - | HFW_SENTENCE_CLOZE_L1P1_01:24, HFW_SENTENCE_CLOZE_L1P2_02:23, HFW_SENTENCE_CLOZE_L1P2_03:23, HFW_SENTENCE_SPELL_L2P2_05:25, HFW_SENTENCE_SPELL_L2P2_06:25, HFW_SENTENCE_SPELL_L2P1_04:24 | 0 | 0 | 0 | 0 | 0 | 0 | 148 | 0 | No immediate content action. |
| 10 | Blends | blends | Phonics | 10 | PRODUCTION READY | 253 | 97 | 97 | 143 | 47 | 47 | 110 | 50 | 50 | 0 | 0 | 0 | 47 | 50 | - | BLEND_IMAGE_CHOICE:47, BLEND_COMPLETE_WORD:50 | 232 | 232 | 0 | 142 | 142 | 0 | 13 | 0 | No immediate content action. |
| 11 | Digraphs | digraphs | Phonics | 11 | PRODUCTION READY | 252 | 120 | 120 | 129 | 60 | 60 | 123 | 60 | 60 | 0 | 0 | 0 | 60 | 60 | - | DIGRAPH_IMAGE_CHOICE:60, DIGRAPH_COMPLETE_WORD:60 | 232 | 232 | 0 | 183 | 183 | 0 | 9 | 0 | No immediate content action. |
| 12 | Long Vowels and Silent E | long_vowels_silent_e | Phonics | 12 | PRODUCTION READY | 226 | 104 | 104 | 80 | 50 | 50 | 146 | 54 | 54 | 0 | 0 | 0 | 44 | 51 | - | LONG_VOWEL_SILENT_E_PATTERN:50, LONG_VOWEL_TEAM_COMPLETE:54 | 205 | 205 | 0 | 219 | 219 | 0 | 5 | 0 | No immediate content action. |
| 13 | Vowel Teams | vowel_teams | Phonics | 13 | PRODUCTION READY | 141 | 141 | 141 | 56 | 56 | 56 | 85 | 85 | 85 | 0 | 0 | 0 | 32 | 76 | - | PICTURE_AUDIO_TO_PATTERN:39, LONG_VOWEL_TEAM_COMPLETE:17, LONG_VOWEL_TEAM_COMPLETE:85 | 141 | 141 | 0 | 141 | 141 | 0 | 0 | 0 | No immediate content action. |
| 14 | R-Controlled Vowels | r_controlled_vowels | Phonics | 14 | PRODUCTION READY | 128 | 128 | 128 | 47 | 47 | 47 | 81 | 81 | 81 | 0 | 0 | 0 | 25 | 40 | - | PICTURE_AUDIO_TO_PATTERN:33, MULTIPLE_CHOICE:14, MULTIPLE_CHOICE:70, DECODING:11 | 118 | 118 | 0 | 128 | 128 | 0 | 0 | 0 | No immediate content action. |
| 15 | Nouns | nouns | Grammar | 15 | PRODUCTION READY | 398 | 146 | 146 | 199 | 70 | 70 | 199 | 76 | 76 | 0 | 0 | 0 | 70 | 59 | - | GRAMMAR_IMAGE_CHOICE:70, GRAMMAR_SENTENCE_FIT:76 | 0 | 0 | 0 | 233 | 233 | 0 | 95 | 0 | No immediate content action. |
| 16 | Verbs | verbs | Grammar | 16 | PRODUCTION READY | 420 | 119 | 119 | 204 | 51 | 51 | 216 | 68 | 68 | 0 | 0 | 0 | 51 | 31 | - | GRAMMAR_IMAGE_CHOICE:51, GRAMMAR_SENTENCE_FIT:68 | 0 | 0 | 0 | 249 | 249 | 0 | 116 | 0 | No immediate content action. |
| 17 | Adjectives | adjectives | Grammar | 17 | PRODUCTION READY | 384 | 112 | 112 | 183 | 46 | 46 | 201 | 66 | 66 | 0 | 0 | 0 | 36 | 23 | - | GRAMMAR_IMAGE_CHOICE:46, GRAMMAR_SENTENCE_FIT:66 | 0 | 0 | 0 | 219 | 219 | 0 | 118 | 0 | No immediate content action. |
| 18 | Prepositions of Place | prepositions_of_place | Grammar | 18 | NEEDS QUESTIONS | 314 | 314 | 214 | 240 | 240 | 200 | 74 | 74 | 14 | 0 | 32 | 0 | 20 | 14 | - | PREPOSITION_TEXT_CHOICE:200, PREPOSITION_SENTENCE_FIT:14 | 0 | 0 | 0 | 30 | 30 | 0 | 39 | 0 | No immediate content action. Generate controlled gap-fill questions from approved media/lexicon. |
| 19 | Plurals | plurals | Grammar | 19 | PRODUCTION READY | 184 | 184 | 138 | 46 | 46 | 46 | 138 | 138 | 92 | 0 | 0 | 0 | 28 | 89 | - | PLURAL_IMAGE_SPELLING:28, GRAMMAR_IMAGE_CHOICE:17, PLURAL_IMAGE_SPELLING:52, PLURAL_TEXT_CHOICE:32, PLURAL_RULE_CHOICE:8 | 0 | 0 | 0 | 28 | 28 | 0 | 47 | 0 | No immediate content action. |
| 20 | Antonyms and Synonyms | antonyms_synonyms | Vocabulary | 20 | PRODUCTION READY | 236 | 236 | 234 | 62 | 62 | 60 | 174 | 174 | 174 | 0 | 0 | 0 | 28 | 114 | - | LANGUAGE_PAIR_TEXT_CHOICE:45, GRAMMAR_IMAGE_CHOICE:15, LANGUAGE_PAIR_TEXT_CHOICE:90, COMPREHENSION:46, ANTONYM_CHOICE:22, SYNONYM_CHOICE:16 | 0 | 0 | 0 | 56 | 56 | 0 | 45 | 0 | No immediate content action. |
| 21 | Homophones and Homonyms | homophones_homonyms | Vocabulary | 21 | PRODUCTION READY | 162 | 162 | 116 | 46 | 46 | 46 | 116 | 116 | 70 | 0 | 0 | 0 | 46 | 68 | - | HOMOPHONE_MEANING:46, HOMOPHONE_CONTEXT_CLOZE:70 | 0 | 0 | 0 | 5 | 5 | 0 | 90 | 0 | No immediate content action. |
| 22 | Prefixes and Suffixes | prefixes_suffixes | Morphology | 22 | PRODUCTION READY | 317 | 317 | 92 | 46 | 46 | 46 | 271 | 271 | 46 | 0 | 0 | 0 | 46 | 46 | - | MORPHEME_MEANING_CONTEXT:46 | 0 | 0 | 0 | 6 | 6 | 0 | 311 | 0 | No immediate content action. |
| 23 | Sentence Comprehension | sentence_comprehension | Comprehension | 23 | PRODUCTION READY | 92 | 92 | 92 | 46 | 46 | 46 | 46 | 46 | 46 | 0 | 0 | 0 | 46 | 46 | - | COMPREHENSION:46 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No immediate content action. |
| 24 | Key Details | key_details | Comprehension | 24 | PRODUCTION READY | 185 | 93 | 93 | 92 | 46 | 46 | 93 | 47 | 47 | 0 | 0 | 0 | 46 | 47 | - | COMPREHENSION:46, COMPREHENSION:47 | 0 | 0 | 0 | 2 | 2 | 0 | 0 | 0 | No immediate content action. |
| 25 | Sequencing | sequencing | Comprehension | 25 | PRODUCTION READY | 92 | 92 | 92 | 46 | 46 | 46 | 46 | 46 | 46 | 0 | 0 | 0 | 46 | 46 | - | COMPREHENSION:46 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No immediate content action. |
| 26 | Main Idea | main_idea | Comprehension | 26 | PRODUCTION READY | 92 | 92 | 92 | 46 | 46 | 46 | 46 | 46 | 46 | 0 | 0 | 0 | 46 | 46 | - | COMPREHENSION:46 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No immediate content action. |
| 27 | Inference | inference | Comprehension | 27 | PRODUCTION READY | 92 | 92 | 92 | 46 | 46 | 46 | 46 | 46 | 46 | 0 | 0 | 0 | 46 | 46 | - | COMPREHENSION:46 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No immediate content action. |
| 28 | Cause and Effect | cause_effect | Comprehension | 28 | PRODUCTION READY | 92 | 92 | 92 | 46 | 46 | 46 | 46 | 46 | 46 | 0 | 0 | 0 | 46 | 46 | - | COMPREHENSION:46 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No immediate content action. |
| 29 | Context Clues | context_clues | Comprehension | 29 | PRODUCTION READY | 92 | 92 | 92 | 46 | 46 | 46 | 46 | 46 | 46 | 0 | 0 | 0 | 46 | 46 | - | COMPREHENSION:46 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No immediate content action. |
| 30 | Theme and Higher Comprehension | theme_higher_comprehension | Comprehension | 30 | PRODUCTION READY | 92 | 92 | 92 | 46 | 46 | 46 | 46 | 46 | 46 | 0 | 0 | 0 | 46 | 46 | - | COMPREHENSION:46 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No immediate content action. |

## Exact Missing Question Needs

| Skill | Level | Missing count | Needed target/type | Existing media? | New media needed? | Recommended source | Recommended action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Prepositions of Place | 2 | 32 | level-tagged multiple-choice or picture-supported items | likely | no obvious true media gap | existing bank or Kimi 500 vocab reserve | Generate controlled gap-fill questions from approved media/lexicon. |

## Exact Missing Media Needs

### Missing Images

| Skill | Level | Question ID | Source file | Target word/sentence | Expected filename | Expected path | Exists elsewhere? | Existing path | Final action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

### Missing Audio

| Skill | Level | Question ID | Source file | Target word/sentence | Expected filename | Expected path | Exists elsewhere? | Existing path | Final action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

### Stale/Unwired Media Warnings

| Skill | Level | Question ID | Source file | Target word/sentence | Expected filename | Expected path | Exists elsewhere? | Existing path | Final action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## Early Phonics Special Checks

### Initial Sounds

- Weak/missing letters: o, x
- Overused letters: -
- Canonical balance gate: PASS

| Level | Published | Max phoneme / cap | Max prompt family / cap | Max response format / cap | Listen and find / cap | Result |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 46 | 8.7% / 20.0% | 60.9% / 62.5% | 60.9% / 62.5% | 39.1% / <62.5% | PASS |
| 2 | 46 | 19.6% / 20.0% | 60.9% / 62.5% | 60.9% / 62.5% | 60.9% / <62.5% | PASS |

### Final Sounds

- Level 1 allowed endings only: yes
- Forbidden Level 1 leaks: -
- /b/ deep enough: yes
- /l/ deep enough: yes
- Unique Level 1 words per sound: {"t":["bat","cart","cat","cot","cut","dart","dot","exit","hat","hit","hot","hut","jet","kit","mat","net","newt","pet","pot","rat","sit","wet"],"g":["bag","big","bug","dig","dog","dug","fig","jug","leg","log","mug","peg","pig","rag","rug","tag","tug","wag","wig"],"d":["bad","bed","dad","kid","lid","mad","mud","pad","red","rod","sad"],"p":["cap","cup","dip","harp","hip","lap","lip","map","mop","nap","pup","sap","sip","tap","top","up","zip"],"n":["bin","bun","can","den","fan","fin","fun","hen","lawn","man","open","pan","pen","pin","run","sun","ten","van","win"],"b":["bib","cab","cob","crab","cub","curb","dab","knob","lab","orb","rib","rub","sub","tab","tub","web"],"m":["gem","gum","ham","jam","palm","ram","yam"],"l":["animal","curl","fossil","hospital","jewel","nail","pencil","pretzel","seal","wheel"]}

### Rhyming

- Rime families with fewer than 3 examples: og:2, ut:2, ink:2, ish:2, uck:2, ouse:2, urn:2, ack:2, ick:2, ill:2, ash:2, ight:2, ird:2, or:2

## HFW Level 2 Decision

The strict audit treats HFW Level 2 as required for production readiness. Recommended Level 2 design: sentence cloze, choose correct word in context, read sentence and find HFW, and audio-supported word recognition.

- **High-Frequency Words 1-25**: Level 2 designed? yes. Proposed Level 2: sentence cloze, choose correct word in context, read sentence and find HFW, and audio-supported word recognition. Missing Level 2 count: 0.
- **High-Frequency Words 26-50**: Level 2 designed? yes. Proposed Level 2: sentence cloze, choose correct word in context, read sentence and find HFW, and audio-supported word recognition. Missing Level 2 count: 0.
- **High-Frequency Words 51-75**: Level 2 designed? yes. Proposed Level 2: sentence cloze, choose correct word in context, read sentence and find HFW, and audio-supported word recognition. Missing Level 2 count: 0.
- **High-Frequency Words 76-100**: Level 2 designed? yes. Proposed Level 2: sentence cloze, choose correct word in context, read sentence and find HFW, and audio-supported word recognition. Missing Level 2 count: 0.
