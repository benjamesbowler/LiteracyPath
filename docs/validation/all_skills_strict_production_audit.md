# LiteracyPath Strict Production Assessment Audit

Generated: 2026-07-24T08:55:07.037Z

## Strict Standard

The audit imports `src/content/releaseStandard.js` version 2026.07.24. Each managed skill requires 92 total strict-usable questions (46 at both Level 1 and Level 2), 15 questions per phase, at least 20 unique targets per level, complete required media, zero accessibility content issues, and no target above 20% of a level.

## Top-Level Summary

| Metric | Value |
| --- | --- |
| Total skills audited | 30 |
| Skills fully production-ready | 19 |
| Skills with enough quantity but weak balance | 1 |
| Skills missing Level 1 depth | 10 |
| Skills missing Level 2 depth | 4 |
| Skills missing images | 0 |
| Skills missing audio | 0 |
| Skills with stale media warnings | 0 |
| Skills needing new Kimi image generation | 0 |
| Skills needing new Kimi audio generation | 0 |
| Skills needing Claude-written question content | 4 |
| Skills needing only path/wiring fixes | 0 |
| Total exact missing images | 0 |
| Total exact missing audio | 0 |
| Total exact missing questions | 566 |
| Total weak but passing warnings | 1 |

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
| 1 | Initial Sounds | initial_sounds | Phonics | 1 | QUANTITY READY BUT WEAK | 150 | 131 | 131 | 97 | 78 | 78 | 53 | 53 | 53 | 0 | 0 | 0 | 29 | 51 | listen_and_find:50 | INITIAL_SOUND_PAIR_SELECT:50, FIRST_SOUND:28, FIRST_SOUND:53 | 150 | 150 | 0 | 150 | 150 | 0 | 0 | 0 | Quantity is present, but rebalance targets before production. No immediate content action. |
| 2 | Final Sounds | final_sounds | Phonics | 2 | PRODUCTION READY | 530 | 457 | 366 | 249 | 189 | 189 | 281 | 268 | 177 | 0 | 0 | 0 | 121 | 141 | - | ENDING_SOUND:189, ENDING_SOUND:103, FINAL_SOUND_PAIR_SELECT:74 | 517 | 517 | 0 | 530 | 530 | 0 | 0 | 0 | No immediate content action. |
| 3 | Rhyming | rhyming | Phonological Awareness | 3 | PRODUCTION READY | 812 | 666 | 666 | 601 | 476 | 476 | 211 | 190 | 190 | 0 | 0 | 0 | 82 | 64 | - | RHYMING_PICTURE:476, RHYMING_PICTURE:190 | 807 | 807 | 0 | 771 | 771 | 0 | 5 | 0 | No immediate content action. |
| 4 | CVC Short Vowels | cvc_short_vowels | Phonics | 4 | PRODUCTION READY | 467 | 412 | 412 | 299 | 266 | 266 | 168 | 146 | 146 | 0 | 0 | 0 | 72 | 50 | - | MISSING_VOWEL_CVC:66, HEARD_WORD_TO_PRINT_MINIMAL_PAIR:54, PICTURE_TO_PRINT_MATCH:52, SHORT_VOWEL_WORD:50, PUT_SOUNDS_IN_ORDER:29, COMPLETE_WORD:15 | 466 | 466 | 0 | 455 | 455 | 0 | 1 | 0 | No immediate content action. |
| 5 | Short Vowel Discrimination | short_vowel_discrimination | Phonics | 5 | PRODUCTION READY | 542 | 314 | 314 | 181 | 118 | 118 | 361 | 196 | 196 | 0 | 0 | 0 | 70 | 95 | - | PICTURE_TO_PRINT_MATCH:73, LISTEN_CHOOSE_VOWEL:45, LISTEN_CHOOSE_VOWEL:98, PICTURE_TO_PRINT_MATCH:98 | 526 | 526 | 0 | 513 | 513 | 0 | 12 | 0 | No immediate content action. |
| 6 | High-Frequency Words 1-25 | hfw_1_25 | High-Frequency Words | 6 | NEEDS QUESTIONS | 150 | 150 | 0 | 75 | 75 | 0 | 75 | 75 | 0 | 46 | 46 | 92 | 0 | 0 | - | - | 0 | 0 | 0 | 150 | 150 | 0 | 0 | 0 | Write new level-aligned question content. |
| 7 | High-Frequency Words 26-50 | hfw_26_50 | High-Frequency Words | 7 | NEEDS QUESTIONS | 150 | 150 | 0 | 75 | 75 | 0 | 75 | 75 | 0 | 46 | 46 | 92 | 0 | 0 | - | - | 0 | 0 | 0 | 150 | 150 | 0 | 0 | 0 | Write new level-aligned question content. |
| 8 | High-Frequency Words 51-75 | hfw_51_75 | High-Frequency Words | 8 | NEEDS QUESTIONS | 150 | 150 | 0 | 75 | 75 | 0 | 75 | 75 | 0 | 46 | 46 | 92 | 0 | 0 | - | - | 0 | 0 | 0 | 150 | 150 | 0 | 0 | 0 | Write new level-aligned question content. |
| 9 | High-Frequency Words 76-100 | hfw_76_100 | High-Frequency Words | 9 | NEEDS QUESTIONS | 148 | 148 | 0 | 73 | 73 | 0 | 75 | 75 | 0 | 46 | 46 | 92 | 0 | 0 | - | - | 0 | 0 | 0 | 148 | 148 | 0 | 0 | 0 | Write new level-aligned question content. |
| 10 | Blends | blends | Phonics | 10 | PRODUCTION READY | 253 | 253 | 97 | 143 | 143 | 47 | 110 | 110 | 50 | 0 | 0 | 0 | 47 | 50 | - | BLEND_IMAGE_CHOICE:47, BLEND_COMPLETE_WORD:50 | 232 | 232 | 0 | 129 | 129 | 0 | 19 | 0 | No immediate content action. |
| 11 | Digraphs | digraphs | Phonics | 11 | PRODUCTION READY | 252 | 252 | 120 | 129 | 129 | 60 | 123 | 123 | 60 | 0 | 0 | 0 | 60 | 60 | - | DIGRAPH_IMAGE_CHOICE:60, DIGRAPH_COMPLETE_WORD:60 | 232 | 232 | 0 | 176 | 176 | 0 | 12 | 0 | No immediate content action. |
| 12 | Long Vowels and Silent E | long_vowels_silent_e | Phonics | 12 | PRODUCTION READY | 226 | 226 | 106 | 80 | 80 | 50 | 146 | 146 | 56 | 0 | 0 | 0 | 44 | 53 | - | LONG_VOWEL_SILENT_E_PATTERN:50, LONG_VOWEL_TEAM_COMPLETE:56 | 205 | 205 | 0 | 185 | 185 | 0 | 7 | 0 | No immediate content action. |
| 13 | Vowel Teams | vowel_teams | Phonics | 13 | NEEDS QUESTIONS | 116 | 116 | 101 | 31 | 31 | 16 | 85 | 85 | 85 | 30 | 0 | 0 | 16 | 76 | - | LONG_VOWEL_TEAM_COMPLETE:16, LONG_VOWEL_TEAM_COMPLETE:85 | 116 | 116 | 0 | 101 | 101 | 0 | 0 | 0 | Generate controlled gap-fill questions from approved media/lexicon. No immediate content action. |
| 14 | R-Controlled Vowels | r_controlled_vowels | Phonics | 14 | NEEDS QUESTIONS | 113 | 113 | 97 | 32 | 32 | 16 | 81 | 81 | 81 | 30 | 0 | 0 | 16 | 40 | - | MULTIPLE_CHOICE:9, DECODING:7, MULTIPLE_CHOICE:70, DECODING:11 | 103 | 103 | 0 | 107 | 107 | 0 | 0 | 0 | Generate controlled gap-fill questions from approved media/lexicon. No immediate content action. |
| 15 | Nouns | nouns | Grammar | 15 | PRODUCTION READY | 382 | 382 | 184 | 199 | 199 | 70 | 183 | 183 | 114 | 0 | 0 | 0 | 70 | 87 | - | GRAMMAR_IMAGE_CHOICE:70, GRAMMAR_SENTENCE_FIT:114 | 0 | 0 | 0 | 217 | 217 | 0 | 95 | 0 | No immediate content action. |
| 16 | Verbs | verbs | Grammar | 16 | PRODUCTION READY | 383 | 383 | 161 | 204 | 204 | 51 | 179 | 179 | 110 | 0 | 0 | 0 | 51 | 98 | - | GRAMMAR_IMAGE_CHOICE:51, GRAMMAR_SENTENCE_FIT:110 | 0 | 0 | 0 | 187 | 187 | 0 | 119 | 0 | No immediate content action. |
| 17 | Adjectives | adjectives | Grammar | 17 | NEEDS QUESTIONS | 333 | 333 | 127 | 173 | 173 | 36 | 160 | 160 | 91 | 10 | 0 | 0 | 36 | 80 | - | GRAMMAR_IMAGE_CHOICE:36, GRAMMAR_SENTENCE_FIT:91 | 0 | 0 | 0 | 158 | 158 | 0 | 120 | 0 | Generate controlled gap-fill questions from approved media/lexicon. No immediate content action. |
| 18 | Prepositions of Place | prepositions_of_place | Grammar | 18 | NEEDS QUESTIONS | 303 | 303 | 46 | 229 | 229 | 0 | 74 | 74 | 46 | 46 | 0 | 46 | 0 | 46 | - | GRAMMAR_BASICS:46 | 0 | 0 | 0 | 30 | 30 | 0 | 39 | 0 | Generate controlled gap-fill questions from approved media/lexicon. No immediate content action. |
| 19 | Plurals | plurals | Grammar | 19 | NEEDS QUESTIONS | 153 | 153 | 96 | 27 | 27 | 10 | 126 | 126 | 86 | 36 | 0 | 0 | 10 | 83 | - | PLURAL_IMAGE_SPELLING:9, PLURAL_SPELLING_CONTEXT:46, PLURAL_IMAGE_SPELLING:40 | 0 | 0 | 0 | 22 | 22 | 0 | 47 | 0 | Generate controlled gap-fill questions from approved media/lexicon. No immediate content action. |
| 20 | Prefixes and Suffixes | prefixes_suffixes | Morphology | 20 | PRODUCTION READY | 317 | 317 | 92 | 46 | 46 | 46 | 271 | 271 | 46 | 0 | 0 | 0 | 46 | 46 | - | MORPHEME_MEANING_CONTEXT:46 | 0 | 0 | 0 | 6 | 6 | 0 | 311 | 0 | No immediate content action. |
| 21 | Antonyms and Synonyms | antonyms_synonyms | Vocabulary | 21 | NEEDS QUESTIONS | 201 | 201 | 46 | 27 | 27 | 0 | 174 | 174 | 46 | 46 | 0 | 46 | 0 | 46 | - | COMPREHENSION:46 | 0 | 0 | 0 | 32 | 32 | 0 | 45 | 0 | Generate controlled gap-fill questions from approved media/lexicon. No immediate content action. |
| 22 | Homophones and Homonyms | homophones_homonyms | Vocabulary | 22 | PRODUCTION READY | 162 | 162 | 92 | 46 | 46 | 46 | 116 | 116 | 46 | 0 | 0 | 0 | 46 | 46 | - | HOMOPHONE_MEANING:46 | 0 | 0 | 0 | 3 | 3 | 0 | 90 | 0 | No immediate content action. |
| 23 | Sentence Comprehension | sentence_comprehension | Comprehension | 23 | PRODUCTION READY | 92 | 92 | 92 | 46 | 46 | 46 | 46 | 46 | 46 | 0 | 0 | 0 | 46 | 46 | - | COMPREHENSION:46 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No immediate content action. |
| 24 | Key Details | key_details | Comprehension | 24 | PRODUCTION READY | 185 | 185 | 185 | 92 | 92 | 92 | 93 | 93 | 93 | 0 | 0 | 0 | 92 | 93 | - | COMPREHENSION:92, COMPREHENSION:93 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No immediate content action. |
| 25 | Sequencing | sequencing | Comprehension | 25 | PRODUCTION READY | 92 | 92 | 92 | 46 | 46 | 46 | 46 | 46 | 46 | 0 | 0 | 0 | 46 | 46 | - | COMPREHENSION:46 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No immediate content action. |
| 26 | Main Idea | main_idea | Comprehension | 26 | PRODUCTION READY | 92 | 92 | 92 | 46 | 46 | 46 | 46 | 46 | 46 | 0 | 0 | 0 | 46 | 46 | - | COMPREHENSION:46 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No immediate content action. |
| 27 | Inference | inference | Comprehension | 27 | PRODUCTION READY | 92 | 92 | 92 | 46 | 46 | 46 | 46 | 46 | 46 | 0 | 0 | 0 | 46 | 46 | - | COMPREHENSION:46 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No immediate content action. |
| 28 | Cause and Effect | cause_effect | Comprehension | 28 | PRODUCTION READY | 92 | 92 | 92 | 46 | 46 | 46 | 46 | 46 | 46 | 0 | 0 | 0 | 46 | 46 | - | COMPREHENSION:46 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No immediate content action. |
| 29 | Context Clues | context_clues | Comprehension | 29 | PRODUCTION READY | 92 | 92 | 92 | 46 | 46 | 46 | 46 | 46 | 46 | 0 | 0 | 0 | 46 | 46 | - | COMPREHENSION:46 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No immediate content action. |
| 30 | Theme and Higher Comprehension | theme_higher_comprehension | Comprehension | 30 | PRODUCTION READY | 92 | 92 | 92 | 46 | 46 | 46 | 46 | 46 | 46 | 0 | 0 | 0 | 46 | 46 | - | COMPREHENSION:46 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No immediate content action. |

## Exact Missing Question Needs

| Skill | Level | Missing count | Needed target/type | Existing media? | New media needed? | Recommended source | Recommended action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| High-Frequency Words 1-25 | 1 | 46 | word recognition/listen-find HFW items | likely | no obvious true media gap | Claude writing | Write new level-aligned question content. |
| High-Frequency Words 1-25 | 2 | 46 | sentence cloze and choose-word-in-context HFW items | likely | no obvious true media gap | Claude writing | Write new level-aligned question content. |
| High-Frequency Words 26-50 | 1 | 46 | word recognition/listen-find HFW items | likely | no obvious true media gap | Claude writing | Write new level-aligned question content. |
| High-Frequency Words 26-50 | 2 | 46 | sentence cloze and choose-word-in-context HFW items | likely | no obvious true media gap | Claude writing | Write new level-aligned question content. |
| High-Frequency Words 51-75 | 1 | 46 | word recognition/listen-find HFW items | likely | no obvious true media gap | Claude writing | Write new level-aligned question content. |
| High-Frequency Words 51-75 | 2 | 46 | sentence cloze and choose-word-in-context HFW items | likely | no obvious true media gap | Claude writing | Write new level-aligned question content. |
| High-Frequency Words 76-100 | 1 | 46 | word recognition/listen-find HFW items | likely | no obvious true media gap | Claude writing | Write new level-aligned question content. |
| High-Frequency Words 76-100 | 2 | 46 | sentence cloze and choose-word-in-context HFW items | likely | no obvious true media gap | Claude writing | Write new level-aligned question content. |
| Vowel Teams | 1 | 30 | level-tagged multiple-choice or picture-supported items | likely | no obvious true media gap | existing bank or Kimi 500 vocab reserve | Generate controlled gap-fill questions from approved media/lexicon. |
| R-Controlled Vowels | 1 | 30 | level-tagged multiple-choice or picture-supported items | likely | no obvious true media gap | existing bank or Kimi 500 vocab reserve | Generate controlled gap-fill questions from approved media/lexicon. |
| Adjectives | 1 | 10 | level-tagged multiple-choice or picture-supported items | likely | no obvious true media gap | existing bank or Kimi 500 vocab reserve | Generate controlled gap-fill questions from approved media/lexicon. |
| Prepositions of Place | 1 | 46 | level-tagged multiple-choice or picture-supported items | likely | no obvious true media gap | existing bank or Kimi 500 vocab reserve | Generate controlled gap-fill questions from approved media/lexicon. |
| Plurals | 1 | 36 | level-tagged multiple-choice or picture-supported items | likely | no obvious true media gap | existing bank or Kimi 500 vocab reserve | Generate controlled gap-fill questions from approved media/lexicon. |
| Antonyms and Synonyms | 1 | 46 | level-tagged multiple-choice or picture-supported items | likely | no obvious true media gap | existing bank or Kimi 500 vocab reserve | Generate controlled gap-fill questions from approved media/lexicon. |

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
- Overused letters: b:50

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

- **High-Frequency Words 1-25**: Level 2 designed? yes. Proposed Level 2: sentence cloze, choose correct word in context, read sentence and find HFW, and audio-supported word recognition. Missing Level 2 count: 46.
- **High-Frequency Words 26-50**: Level 2 designed? yes. Proposed Level 2: sentence cloze, choose correct word in context, read sentence and find HFW, and audio-supported word recognition. Missing Level 2 count: 46.
- **High-Frequency Words 51-75**: Level 2 designed? yes. Proposed Level 2: sentence cloze, choose correct word in context, read sentence and find HFW, and audio-supported word recognition. Missing Level 2 count: 46.
- **High-Frequency Words 76-100**: Level 2 designed? yes. Proposed Level 2: sentence cloze, choose correct word in context, read sentence and find HFW, and audio-supported word recognition. Missing Level 2 count: 46.
