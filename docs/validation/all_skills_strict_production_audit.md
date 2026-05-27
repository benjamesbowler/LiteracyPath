# LiteracyPath Strict Production Assessment Audit

Generated: 2026-05-27T08:01:38.404Z

## Strict Standard

Each designed skill is checked against 60 total strict-usable questions, 30 Level 1, 30 Level 2, 15 questions per phase, at least 20 unique targets per designed level, complete required media, and no target dominating more than 20% of a level unless flagged.

## Top-Level Summary

| Metric | Value |
| --- | --- |
| Total skills audited | 29 |
| Skills fully production-ready | 20 |
| Skills with enough quantity but weak balance | 1 |
| Skills missing Level 1 depth | 3 |
| Skills missing Level 2 depth | 7 |
| Skills missing images | 0 |
| Skills missing audio | 0 |
| Skills with stale media warnings | 0 |
| Skills needing new Kimi image generation | 0 |
| Skills needing new Kimi audio generation | 0 |
| Skills needing Claude-written question content | 3 |
| Skills needing only path/wiring fixes | 0 |
| Total exact missing images | 0 |
| Total exact missing audio | 0 |
| Total exact missing questions | 226 |
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
| 1 | Initial Sounds | initial_sounds | Phonics | 1 | QUANTITY READY BUT WEAK | 134 | 112 | 112 | 99 | 77 | 77 | 35 | 35 | 35 | 0 | 0 | 0 | 29 | 35 | listen_and_find:49 | INITIAL_SOUND_PAIR_SELECT:49, FIRST_SOUND:28, FIRST_SOUND:35 | 134 | 134 | 0 | 134 | 134 | 0 | 0 | 0 | Quantity is present, but rebalance targets before production. No immediate content action. |
| 2 | Final Sounds | final_sounds | Phonics | 2 | PRODUCTION READY | 366 | 314 | 268 | 167 | 124 | 124 | 199 | 190 | 144 | 0 | 0 | 0 | 69 | 109 | - | ENDING_SOUND:124, FINAL_SOUND_PAIR_SELECT:74, ENDING_SOUND:70 | 366 | 366 | 0 | 366 | 366 | 0 | 0 | 0 | No immediate content action. |
| 3 | Rhyming | rhyming | Phonological Awareness | 3 | PRODUCTION READY | 339 | 160 | 160 | 280 | 125 | 125 | 59 | 35 | 35 | 0 | 0 | 0 | 52 | 27 | - | RHYMING_PICTURE:125, RHYMING_PICTURE:35 | 339 | 339 | 0 | 334 | 334 | 0 | 0 | 0 | No immediate content action. |
| 4 | CVC Short Vowels | cvc_short_vowels | Phonics | 4 | PRODUCTION READY | 320 | 313 | 313 | 285 | 278 | 278 | 35 | 35 | 35 | 0 | 0 | 0 | 69 | 35 | - | MISSING_VOWEL_CVC:77, SHORT_VOWEL_WORD:60, HEARD_WORD_TO_PRINT_MINIMAL_PAIR:54, PICTURE_TO_PRINT_MATCH:43, PUT_SOUNDS_IN_ORDER:29, COMPLETE_WORD:15 | 320 | 320 | 0 | 320 | 320 | 0 | 0 | 0 | No immediate content action. |
| 5 | Short Vowel Discrimination | short_vowel_discrimination | Phonics | 5 | PRODUCTION READY | 335 | 285 | 285 | 258 | 250 | 250 | 77 | 35 | 35 | 0 | 0 | 0 | 71 | 35 | - | SHORT_VOWEL_WORD:88, LISTEN_CHOOSE_VOWEL:86, PICTURE_TO_PRINT_MATCH:76, LISTEN_CHOOSE_VOWEL:18, SHORT_VOWEL_WORD:17 | 333 | 333 | 0 | 335 | 335 | 0 | 0 | 0 | No immediate content action. |
| 6 | High-Frequency Words 1-25 | hfw_1_25 | High-Frequency Words | 6 | NEEDS LEVEL 2 DESIGN | 61 | 61 | 21 | 61 | 61 | 21 | 0 | 0 | 0 | 9 | 30 | 39 | 12 | 0 | - | READ_FIND_WORD:12, LISTEN_FIND_WORD:9 | 0 | 0 | 0 | 9 | 9 | 0 | 52 | 0 | Write new level-aligned question content. Define Level 2 design before generating runtime questions. |
| 7 | High-Frequency Words 26-50 | hfw_26_50 | High-Frequency Words | 7 | NEEDS LEVEL 2 DESIGN | 88 | 88 | 48 | 48 | 48 | 48 | 40 | 40 | 0 | 0 | 30 | 12 | 25 | 0 | - | READ_FIND_WORD:37, LISTEN_FIND_WORD:11 | 1 | 1 | 0 | 11 | 11 | 0 | 76 | 0 | No immediate content action. Define Level 2 design before generating runtime questions. |
| 8 | High-Frequency Words 51-100 | hfw_51_100 | High-Frequency Words | 8 | NEEDS LEVEL 2 DESIGN | 105 | 105 | 0 | 35 | 35 | 0 | 70 | 70 | 0 | 30 | 30 | 60 | 0 | 0 | - | - | 1 | 1 | 0 | 0 | 0 | 0 | 104 | 0 | Write new level-aligned question content. Define Level 2 design before generating runtime questions. |
| 9 | Blends | blends | Phonics | 9 | NEEDS QUESTIONS | 101 | 101 | 62 | 68 | 68 | 62 | 33 | 33 | 0 | 0 | 30 | 0 | 16 | 0 | - | PICTURE_AUDIO_TO_PATTERN:22, BLEND_SOUNDS:15, IMAGE_WORD_PATTERN_MATCH:14, HEARD_WORD_TO_PRINT_MINIMAL_PAIR:11 | 89 | 89 | 0 | 89 | 89 | 0 | 12 | 0 | Generate controlled gap-fill questions from approved media/lexicon. |
| 10 | Digraphs | digraphs | Phonics | 10 | NEEDS QUESTIONS | 91 | 91 | 48 | 54 | 54 | 48 | 37 | 37 | 0 | 0 | 30 | 12 | 24 | 0 | - | PICTURE_AUDIO_TO_PATTERN:24, IMAGE_WORD_PATTERN_MATCH:13, HEARD_WORD_TO_PRINT_MINIMAL_PAIR:11 | 81 | 81 | 0 | 82 | 82 | 0 | 9 | 0 | No immediate content action. Generate controlled gap-fill questions from approved media/lexicon. |
| 11 | Long Vowels and Silent E | long_vowels_silent_e | Phonics | 11 | NEEDS QUESTIONS | 95 | 95 | 61 | 35 | 35 | 35 | 60 | 60 | 26 | 0 | 4 | 0 | 35 | 26 | - | DECODING:35, DECODING:26 | 72 | 72 | 0 | 88 | 88 | 0 | 7 | 0 | No immediate content action. Generate controlled gap-fill questions from approved media/lexicon. |
| 12 | Vowel Teams | vowel_teams | Phonics | 12 | PRODUCTION READY | 103 | 103 | 68 | 35 | 35 | 35 | 68 | 68 | 33 | 0 | 0 | 0 | 35 | 33 | - | DECODING:35, DECODING:33 | 78 | 78 | 0 | 80 | 80 | 0 | 22 | 0 | No immediate content action. |
| 13 | R-Controlled Vowels | r_controlled_vowels | Phonics | 13 | NEEDS QUESTIONS | 91 | 91 | 46 | 35 | 35 | 35 | 56 | 56 | 11 | 0 | 19 | 14 | 35 | 11 | - | DECODING:35, DECODING:11 | 73 | 73 | 0 | 84 | 84 | 0 | 7 | 0 | No immediate content action. Generate controlled gap-fill questions from approved media/lexicon. |
| 14 | Nouns | nouns | Grammar | 14 | PRODUCTION READY | 74 | 74 | 74 | 35 | 35 | 35 | 39 | 39 | 39 | 0 | 0 | 0 | 34 | 34 | - | GRAMMAR_BASICS:20, VOCABULARY_CATEGORY:15, MULTIPLE_CHOICE:39 | 20 | 20 | 0 | 2 | 2 | 0 | 37 | 0 | No immediate content action. |
| 15 | Verbs | verbs | Grammar | 15 | PRODUCTION READY | 80 | 80 | 80 | 41 | 41 | 41 | 39 | 39 | 39 | 0 | 0 | 0 | 39 | 30 | - | GRAMMAR_BASICS:41, MULTIPLE_CHOICE:39 | 20 | 20 | 0 | 0 | 0 | 0 | 60 | 0 | No immediate content action. |
| 16 | Adjectives | adjectives | Grammar | 16 | PRODUCTION READY | 81 | 81 | 81 | 42 | 42 | 42 | 39 | 39 | 39 | 0 | 0 | 0 | 36 | 32 | - | GRAMMAR_BASICS:42, MULTIPLE_CHOICE:39 | 20 | 20 | 0 | 2 | 2 | 0 | 59 | 0 | No immediate content action. |
| 17 | Prepositions of Place | prepositions_of_place | Grammar | 17 | NEEDS QUESTIONS | 101 | 101 | 72 | 49 | 49 | 20 | 52 | 52 | 52 | 10 | 0 | 0 | 20 | 21 | - | GRAMMAR_BASICS:20, GRAMMAR_BASICS:52 | 51 | 51 | 0 | 0 | 0 | 0 | 50 | 0 | Generate controlled gap-fill questions from approved media/lexicon. No immediate content action. |
| 18 | Plurals | plurals | Grammar | 18 | PRODUCTION READY | 129 | 129 | 129 | 35 | 35 | 35 | 94 | 94 | 94 | 0 | 0 | 0 | 29 | 40 | - | PLURAL_SPELLING_CONTEXT:28, PLURAL_IMAGE_SPELLING:7, UNKNOWN:68, PLURAL_SPELLING_CONTEXT:18, MULTIPLE_CHOICE:8 | 75 | 75 | 0 | 0 | 0 | 0 | 54 | 0 | No immediate content action. |
| 19 | Prefixes and Suffixes | prefixes_suffixes | Morphology | 19 | PRODUCTION READY | 110 | 110 | 110 | 35 | 35 | 35 | 75 | 75 | 75 | 0 | 0 | 0 | 28 | 45 | - | MORPHEME_MEANING_CONTEXT:35, MORPHEME_MEANING_CONTEXT:38, MULTIPLE_CHOICE:37 | 0 | 0 | 0 | 2 | 2 | 0 | 108 | 0 | No immediate content action. |
| 20 | Antonyms and Synonyms | antonyms_synonyms | Vocabulary | 20 | PRODUCTION READY | 97 | 97 | 97 | 33 | 33 | 33 | 64 | 64 | 64 | 0 | 0 | 0 | 33 | 40 | - | COMPREHENSION:33, UNKNOWN:60, MULTIPLE_CHOICE:4 | 61 | 61 | 0 | 2 | 2 | 0 | 35 | 0 | No immediate content action. |
| 21 | Homophones and Homonyms | homophones_homonyms | Vocabulary | 21 | PRODUCTION READY | 87 | 87 | 87 | 35 | 35 | 35 | 52 | 52 | 52 | 0 | 0 | 0 | 35 | 50 | - | HOMOPHONE_MEANING:35, HOMOPHONE_MEANING:38, MULTIPLE_CHOICE:14 | 2 | 2 | 0 | 2 | 2 | 0 | 83 | 0 | No immediate content action. |
| 22 | Sentence Comprehension | sentence_comprehension | Comprehension | 22 | PRODUCTION READY | 145 | 145 | 135 | 35 | 35 | 35 | 110 | 110 | 100 | 0 | 0 | 0 | 35 | 89 | - | COMPREHENSION:20, SENTENCE_MATCHES_PICTURE:15, UNKNOWN:100 | 115 | 115 | 0 | 17 | 17 | 0 | 30 | 0 | No immediate content action. |
| 23 | Key Details | key_details | Comprehension | 23 | PRODUCTION READY | 94 | 94 | 94 | 35 | 35 | 35 | 59 | 59 | 59 | 0 | 0 | 0 | 20 | 52 | - | COMPREHENSION:35, MULTIPLE_CHOICE:59 | 0 | 0 | 0 | 0 | 0 | 0 | 94 | 0 | No immediate content action. |
| 24 | Sequencing | sequencing | Comprehension | 24 | PRODUCTION READY | 94 | 94 | 93 | 35 | 35 | 35 | 59 | 59 | 58 | 0 | 0 | 0 | 20 | 56 | - | COMPREHENSION:35, MULTIPLE_CHOICE:58 | 0 | 0 | 0 | 0 | 0 | 0 | 94 | 0 | No immediate content action. |
| 25 | Main Idea | main_idea | Comprehension | 25 | PRODUCTION READY | 100 | 100 | 100 | 35 | 35 | 35 | 65 | 65 | 65 | 0 | 0 | 0 | 20 | 60 | - | COMPREHENSION:35, MULTIPLE_CHOICE:59, COMPREHENSION:6 | 0 | 0 | 0 | 0 | 0 | 0 | 100 | 0 | No immediate content action. |
| 26 | Inference | inference | Comprehension | 26 | PRODUCTION READY | 140 | 140 | 140 | 35 | 35 | 35 | 105 | 105 | 105 | 0 | 0 | 0 | 21 | 105 | - | COMPREHENSION:35, UNKNOWN:79, MULTIPLE_CHOICE:20, COMPREHENSION:6 | 79 | 79 | 0 | 0 | 0 | 0 | 61 | 0 | No immediate content action. |
| 27 | Cause and Effect | cause_effect | Comprehension | 27 | PRODUCTION READY | 100 | 100 | 99 | 35 | 35 | 35 | 65 | 65 | 64 | 0 | 0 | 0 | 20 | 61 | - | COMPREHENSION:35, MULTIPLE_CHOICE:58, COMPREHENSION:6 | 0 | 0 | 0 | 0 | 0 | 0 | 100 | 0 | No immediate content action. |
| 28 | Context Clues | context_clues | Comprehension | 28 | PRODUCTION READY | 100 | 100 | 100 | 35 | 35 | 35 | 65 | 65 | 65 | 0 | 0 | 0 | 21 | 60 | - | COMPREHENSION:35, MULTIPLE_CHOICE:59, COMPREHENSION:6 | 0 | 0 | 0 | 0 | 0 | 0 | 100 | 0 | No immediate content action. |
| 29 | Theme and Higher Comprehension | theme_higher_comprehension | Comprehension | 29 | PRODUCTION READY | 100 | 100 | 100 | 35 | 35 | 35 | 65 | 65 | 65 | 0 | 0 | 0 | 20 | 54 | - | COMPREHENSION:35, MULTIPLE_CHOICE:59, COMPREHENSION:6 | 0 | 0 | 0 | 0 | 0 | 0 | 100 | 0 | No immediate content action. |

## Exact Missing Question Needs

| Skill | Level | Missing count | Needed target/type | Existing media? | New media needed? | Recommended source | Recommended action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| High-Frequency Words 1-25 | 1 | 9 | word recognition/listen-find HFW items | likely | no obvious true media gap | Claude writing | Write new level-aligned question content. |
| High-Frequency Words 1-25 | 2 | 30 | sentence cloze and choose-word-in-context HFW items | unknown until design exists | unknown | Claude writing | Mixed sentence-level fluency and cloze tasks using the same 1-25 band. |
| High-Frequency Words 26-50 | 2 | 30 | sentence cloze and choose-word-in-context HFW items | unknown until design exists | unknown | Claude writing | Mixed sentence-level fluency and cloze tasks using the 26-50 band. |
| High-Frequency Words 51-100 | 1 | 30 | word recognition/listen-find HFW items | likely | no obvious true media gap | Claude writing | Write new level-aligned question content. |
| High-Frequency Words 51-100 | 2 | 30 | sentence cloze and choose-word-in-context HFW items | unknown until design exists | unknown | Claude writing | Mixed sentence-level fluency and cloze tasks using the 51-100 band. |
| Blends | 1 | 4 | level-tagged multiple-choice or picture-supported items | likely | no obvious true media gap | existing bank or Kimi 500 vocab reserve | Generate controlled gap-fill questions from approved media/lexicon. |
| Blends | 2 | 30 | level-tagged multiple-choice or picture-supported items | likely | no obvious true media gap | existing bank or Kimi 500 vocab reserve | Generate controlled gap-fill questions from approved media/lexicon. |
| Digraphs | 2 | 30 | level-tagged multiple-choice or picture-supported items | likely | no obvious true media gap | existing bank or Kimi 500 vocab reserve | Generate controlled gap-fill questions from approved media/lexicon. |
| Long Vowels and Silent E | 2 | 4 | level-tagged multiple-choice or picture-supported items | likely | no obvious true media gap | existing bank or Kimi 500 vocab reserve | Generate controlled gap-fill questions from approved media/lexicon. |
| R-Controlled Vowels | 2 | 19 | level-tagged multiple-choice or picture-supported items | likely | no obvious true media gap | existing bank or Kimi 500 vocab reserve | Generate controlled gap-fill questions from approved media/lexicon. |
| Prepositions of Place | 1 | 10 | level-tagged multiple-choice or picture-supported items | likely | no obvious true media gap | existing bank or Kimi 500 vocab reserve | Generate controlled gap-fill questions from approved media/lexicon. |

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

- Weak/missing letters: n, x
- Overused letters: b:31

### Final Sounds

- Level 1 allowed endings only: yes
- Forbidden Level 1 leaks: -
- /b/ deep enough: yes
- /l/ deep enough: yes
- Unique Level 1 words per sound: {"t":["bat","cat","cot","cut","exit","hat","jet","mat","net","newt","pot","rat","sit"],"g":["bag","bug","dog","leg","log","mug","pig","rug","wig"],"d":["bed","kid","lid","red"],"p":["cap","cup","map","tap","top","up","zip"],"n":["fan","fin","hen","man","pan","pen","pin","sun","van"],"b":["bib","cab","cob","crab","cub","dab","knob","lab","rub","sub","tub","web"],"m":["gum","ham","jam","ram","yam"],"l":["animal","fossil","hospital","jewel","nail","owl","pencil","pretzel","seal","wheel"]}

### Rhyming

- Rime families with fewer than 3 examples: at:2, ag:2, ad:2, ed:2, et:2, eg:2, ip:2, it:2, og:2, up:2, ut:2, ock:2, ell:2, ish:2, ake:2, ar:2, ack:2, ick:2, or:2, eep:2, all:2

## HFW Level 2 Decision

The strict audit treats HFW Level 2 as required for production readiness. Recommended Level 2 design: sentence cloze, choose correct word in context, read sentence and find HFW, and audio-supported word recognition.

- **High-Frequency Words 1-25**: Level 2 designed? no. Proposed Level 2: Mixed sentence-level fluency and cloze tasks using the same 1-25 band.. Missing Level 2 count: 30.
- **High-Frequency Words 26-50**: Level 2 designed? no. Proposed Level 2: Mixed sentence-level fluency and cloze tasks using the 26-50 band.. Missing Level 2 count: 30.
- **High-Frequency Words 51-100**: Level 2 designed? no. Proposed Level 2: Mixed sentence-level fluency and cloze tasks using the 51-100 band.. Missing Level 2 count: 30.
