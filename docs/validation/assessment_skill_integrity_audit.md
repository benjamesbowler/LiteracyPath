# Assessment Skill Integrity Audit

Generated: 2026-06-02T00:15:36.738Z

Strict contract: every assessment skill should have exactly 2 levels, exactly 2 phases, 15 safe questions per phase, and at least 30 unique usable questions per level. This is audit-only and does not modify question content.

## Top-Level Summary

| Metric | Count |
| --- | --- |
| skillsAudited | 30 |
| productionReadySkills | 30 |
| failingPhaseCount | 0 |
| failingLevelCount | 0 |
| belowLevel1Depth | 0 |
| belowLevel2Depth | 0 |
| unableToGenerate15QuestionRound | 0 |
| duplicateIdGroups | 0 |
| missingQuestionIds | 0 |
| missingPrompts | 0 |
| missingAnswerChoices | 152 |
| missingCorrectAnswers | 0 |
| missingSkillIds | 0 |
| missingLevelData | 0 |
| missingPhaseData | 0 |
| graphemeChoiceQuestions | 1085 |
| imageChoiceQuestions | 1893 |
| imageChoiceLeaks | 0 |
| unassignedQuestions | 190 |

## Summary By Skill

| # | Skill | Skill ID | Unique total | L1 usable | L2 usable | Phases | Levels | 2 phases | 2 levels | L1 missing | L2 missing | Text-tile questions | Image-choice questions | Image leaks | Round risk | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Initial Sounds | initial_sounds | 197 | 143 | 54 | 2 | 2 | yes | yes | 0 | 0 | 84 | 109 | 0 | ok | pass |
| 2 | Final Sounds | final_sounds | 545 | 265 | 280 | 2 | 2 | yes | yes | 0 | 0 | 318 | 157 | 0 | ok | pass |
| 3 | Rhyming | rhyming | 637 | 486 | 151 | 2 | 2 | yes | yes | 0 | 0 | 0 | 593 | 0 | ok | pass |
| 4 | CVC Short Vowels | cvc_short_vowels | 544 | 326 | 218 | 2 | 2 | yes | yes | 0 | 0 | 180 | 305 | 0 | ok | pass |
| 5 | Short Vowel Discrimination | short_vowel_discrimination | 532 | 212 | 320 | 2 | 2 | yes | yes | 0 | 0 | 195 | 314 | 0 | ok | pass |
| 6 | High-Frequency Words 1-25 | hfw_1_25 | 218 | 123 | 95 | 2 | 2 | yes | yes | 0 | 0 | 0 | 2 | 0 | ok | pass |
| 7 | High-Frequency Words 26-50 | hfw_26_50 | 219 | 84 | 135 | 2 | 2 | yes | yes | 0 | 0 | 0 | 2 | 0 | ok | pass |
| 8 | High-Frequency Words 51-75 | hfw_51_75 | 140 | 70 | 70 | 2 | 2 | yes | yes | 0 | 0 | 0 | 0 | 0 | ok | pass |
| 9 | High-Frequency Words 76-100 | hfw_76_100 | 140 | 70 | 70 | 2 | 2 | yes | yes | 0 | 0 | 0 | 3 | 0 | ok | pass |
| 10 | Blends | blends | 237 | 146 | 91 | 2 | 2 | yes | yes | 0 | 0 | 60 | 90 | 0 | ok | pass |
| 11 | Digraphs | digraphs | 289 | 153 | 136 | 2 | 2 | yes | yes | 0 | 0 | 81 | 99 | 0 | ok | pass |
| 12 | Long Vowels and Silent E | long_vowels_silent_e | 190 | 61 | 128 | 2 | 2 | yes | yes | 0 | 0 | 60 | 0 | 0 | ok | pass |
| 13 | Vowel Teams | vowel_teams | 107 | 46 | 61 | 2 | 2 | yes | yes | 0 | 0 | 107 | 0 | 0 | ok | pass |
| 14 | R-Controlled Vowels | r_controlled_vowels | 140 | 53 | 85 | 2 | 2 | yes | yes | 0 | 0 | 0 | 0 | 0 | ok | pass |
| 15 | Nouns | nouns | 189 | 75 | 114 | 2 | 2 | yes | yes | 0 | 0 | 0 | 90 | 0 | ok | pass |
| 16 | Verbs | verbs | 195 | 81 | 114 | 2 | 2 | yes | yes | 0 | 0 | 0 | 62 | 0 | ok | pass |
| 17 | Adjectives | adjectives | 181 | 82 | 99 | 2 | 2 | yes | yes | 0 | 0 | 0 | 60 | 0 | ok | pass |
| 18 | Prepositions of Place | prepositions_of_place | 92 | 46 | 46 | 2 | 2 | yes | yes | 0 | 0 | 0 | 0 | 0 | ok | pass |
| 19 | Plurals | plurals | 92 | 46 | 46 | 2 | 2 | yes | yes | 0 | 0 | 0 | 0 | 0 | ok | pass |
| 20 | Prefixes and Suffixes | prefixes_suffixes | 92 | 46 | 46 | 2 | 2 | yes | yes | 0 | 0 | 0 | 0 | 0 | ok | pass |
| 21 | Antonyms and Synonyms | antonyms_synonyms | 92 | 46 | 46 | 2 | 2 | yes | yes | 0 | 0 | 0 | 6 | 0 | ok | pass |
| 22 | Homophones and Homonyms | homophones_homonyms | 92 | 46 | 46 | 2 | 2 | yes | yes | 0 | 0 | 0 | 1 | 0 | ok | pass |
| 23 | Sentence Comprehension | sentence_comprehension | 92 | 46 | 46 | 2 | 2 | yes | yes | 0 | 0 | 0 | 0 | 0 | ok | pass |
| 24 | Key Details | key_details | 92 | 46 | 46 | 2 | 2 | yes | yes | 0 | 0 | 0 | 0 | 0 | ok | pass |
| 25 | Sequencing | sequencing | 92 | 46 | 46 | 2 | 2 | yes | yes | 0 | 0 | 0 | 0 | 0 | ok | pass |
| 26 | Main Idea | main_idea | 92 | 46 | 46 | 2 | 2 | yes | yes | 0 | 0 | 0 | 0 | 0 | ok | pass |
| 27 | Inference | inference | 92 | 46 | 46 | 2 | 2 | yes | yes | 0 | 0 | 0 | 0 | 0 | ok | pass |
| 28 | Cause and Effect | cause_effect | 92 | 46 | 46 | 2 | 2 | yes | yes | 0 | 0 | 0 | 0 | 0 | ok | pass |
| 29 | Context Clues | context_clues | 92 | 46 | 46 | 2 | 2 | yes | yes | 0 | 0 | 0 | 0 | 0 | ok | pass |
| 30 | Theme and Higher Comprehension | theme_higher_comprehension | 92 | 46 | 46 | 2 | 2 | yes | yes | 0 | 0 | 0 | 0 | 0 | ok | pass |

## Red Flags

_None._

## Skills Passing All Checks

- Initial Sounds
- Final Sounds
- Rhyming
- CVC Short Vowels
- Short Vowel Discrimination
- High-Frequency Words 1-25
- High-Frequency Words 26-50
- High-Frequency Words 51-75
- High-Frequency Words 76-100
- Blends
- Digraphs
- Long Vowels and Silent E
- Vowel Teams
- R-Controlled Vowels
- Nouns
- Verbs
- Adjectives
- Prepositions of Place
- Plurals
- Prefixes and Suffixes
- Antonyms and Synonyms
- Homophones and Homonyms
- Sentence Comprehension
- Key Details
- Sequencing
- Main Idea
- Inference
- Cause and Effect
- Context Clues
- Theme and Higher Comprehension

## Skills Failing Phase Count

_None._

## Skills Failing Level Count

_None._

## Skills Below 30 Unique Usable Questions For Either Level

_None._

## Skills Unable To Safely Generate 15-Question Rounds

_None._

## Assessment Choice Rendering Diagnostics

- Grapheme/text-choice questions: 1085
- Image-choice questions: 1893
- Image-choice leaks in grapheme/text-choice questions: 0

_No image-choice leaks detected in grapheme/text-choice questions._

## CVC / Short Vowel Rendering Guardrails

- CVC Short Vowels:
  - Short-vowel word-choice prompts requiring option-card rendering: gen_cvc_short_a_bad_0_vowel, gen_cvc_short_a_bag_1_vowel, gen_cvc_short_a_bat_2_vowel, gen_cvc_short_a_cab_3_vowel, gen_cvc_short_a_can_4_vowel, gen_cvc_short_a_cap_5_vowel, gen_cvc_short_a_dab_6_vowel, gen_cvc_short_a_dad_7_vowel, gen_cvc_short_a_fan_8_vowel, gen_cvc_short_a_ham_9_vowel, gen_cvc_short_a_hat_10_vowel, gen_cvc_short_a_jam_11_vowel, gen_cvc_short_a_lab_12_vowel, gen_cvc_short_a_lap_13_vowel, gen_cvc_short_a_mad_14_vowel, gen_cvc_short_a_man_15_vowel +79 more
  - Raw short-vowel word-choice prompts with fewer than 4 options: -
  - Raw central-image + answer-image category prompts: gen_cvc_short_a_bad_0_vowel: raw data has central image + 4 image options; renderer suppresses central image, gen_cvc_short_a_bag_1_vowel: raw data has central image + 4 image options; renderer suppresses central image, gen_cvc_short_a_bat_2_vowel: raw data has central image + 4 image options; renderer suppresses central image, gen_cvc_short_a_cab_3_vowel: raw data has central image + 4 image options; renderer suppresses central image, gen_cvc_short_a_can_4_vowel: raw data has central image + 4 image options; renderer suppresses central image, gen_cvc_short_a_cap_5_vowel: raw data has central image + 4 image options; renderer suppresses central image, gen_cvc_short_a_dab_6_vowel: raw data has central image + 4 image options; renderer suppresses central image, gen_cvc_short_a_dad_7_vowel: raw data has central image + 4 image options; renderer suppresses central image, gen_cvc_short_a_fan_8_vowel: raw data has central image + 4 image options; renderer suppresses central image, gen_cvc_short_a_ham_9_vowel: raw data has central image + 4 image options; renderer suppresses central image, gen_cvc_short_a_hat_10_vowel: raw data has central image + 4 image options; renderer suppresses central image, gen_cvc_short_a_jam_11_vowel: raw data has central image + 4 image options; renderer suppresses central image, gen_cvc_short_a_lab_12_vowel: raw data has central image + 4 image options; renderer suppresses central image, gen_cvc_short_a_lap_13_vowel: raw data has central image + 4 image options; renderer suppresses central image, gen_cvc_short_a_mad_14_vowel: raw data has central image + 4 image options; renderer suppresses central image, gen_cvc_short_a_man_15_vowel: raw data has central image + 4 image options; renderer suppresses central image +78 more
  - Listen-choose-vowel tile issues: -
  - Raw 2-option short-vowel multiple-choice tasks: -
  - Invalid Listen & Find classifications: -
  - Grapheme image leaks: -
- Short Vowel Discrimination:
  - Short-vowel word-choice prompts requiring option-card rendering: ixl_short_vowel_1, ixl_short_vowel_2, ixl_short_vowel_3, ixl_short_vowel_4, ixl_short_vowel_5, ixl_short_vowel_6, ixl_short_vowel_7, ixl_short_vowel_8, ixl_short_vowel_9, ixl_short_vowel_10, ixl_short_vowel_11, ixl_short_vowel_12, ixl_short_vowel_13, ixl_short_vowel_14, ixl_short_vowel_15, ixl_short_vowel_16 +108 more
  - Raw short-vowel word-choice prompts with fewer than 4 options: ixl_short_vowel_1 (2 raw choices; runtime expands to 4), ixl_short_vowel_2 (2 raw choices; runtime expands to 4), ixl_short_vowel_3 (2 raw choices; runtime expands to 4), ixl_short_vowel_4 (2 raw choices; runtime expands to 4), ixl_short_vowel_5 (2 raw choices; runtime expands to 4), ixl_short_vowel_6 (2 raw choices; runtime expands to 4), ixl_short_vowel_7 (2 raw choices; runtime expands to 4), ixl_short_vowel_8 (2 raw choices; runtime expands to 4), ixl_short_vowel_9 (2 raw choices; runtime expands to 4), ixl_short_vowel_10 (2 raw choices; runtime expands to 4), ixl_short_vowel_11 (2 raw choices; runtime expands to 4), ixl_short_vowel_12 (2 raw choices; runtime expands to 4), ixl_short_vowel_13 (2 raw choices; runtime expands to 4), ixl_short_vowel_14 (2 raw choices; runtime expands to 4), ixl_short_vowel_15 (2 raw choices; runtime expands to 4), ixl_short_vowel_16 (2 raw choices; runtime expands to 4) +14 more
  - Raw central-image + answer-image category prompts: ixl_short_vowel_1: raw data has central image + 2 image options; renderer suppresses central image, ixl_short_vowel_2: raw data has central image + 2 image options; renderer suppresses central image, ixl_short_vowel_3: raw data has central image + 2 image options; renderer suppresses central image, ixl_short_vowel_4: raw data has central image + 2 image options; renderer suppresses central image, ixl_short_vowel_5: raw data has central image + 2 image options; renderer suppresses central image, ixl_short_vowel_6: raw data has central image + 2 image options; renderer suppresses central image, ixl_short_vowel_7: raw data has central image + 2 image options; renderer suppresses central image, ixl_short_vowel_8: raw data has central image + 2 image options; renderer suppresses central image, ixl_short_vowel_9: raw data has central image + 2 image options; renderer suppresses central image, ixl_short_vowel_10: raw data has central image + 2 image options; renderer suppresses central image, ixl_short_vowel_11: raw data has central image + 2 image options; renderer suppresses central image, ixl_short_vowel_12: raw data has central image + 2 image options; renderer suppresses central image, ixl_short_vowel_13: raw data has central image + 2 image options; renderer suppresses central image, ixl_short_vowel_14: raw data has central image + 2 image options; renderer suppresses central image, ixl_short_vowel_15: raw data has central image + 2 image options; renderer suppresses central image, ixl_short_vowel_16: raw data has central image + 2 image options; renderer suppresses central image +108 more
  - Listen-choose-vowel tile issues: -
  - Raw 2-option short-vowel multiple-choice tasks: ixl_short_vowel_1:SHORT_VOWEL_WORD, ixl_short_vowel_2:SHORT_VOWEL_WORD, ixl_short_vowel_3:SHORT_VOWEL_WORD, ixl_short_vowel_4:SHORT_VOWEL_WORD, ixl_short_vowel_5:SHORT_VOWEL_WORD, ixl_short_vowel_6:SHORT_VOWEL_WORD, ixl_short_vowel_7:SHORT_VOWEL_WORD, ixl_short_vowel_8:SHORT_VOWEL_WORD, ixl_short_vowel_9:SHORT_VOWEL_WORD, ixl_short_vowel_10:SHORT_VOWEL_WORD, ixl_short_vowel_11:SHORT_VOWEL_WORD, ixl_short_vowel_12:SHORT_VOWEL_WORD, ixl_short_vowel_13:SHORT_VOWEL_WORD, ixl_short_vowel_14:SHORT_VOWEL_WORD, ixl_short_vowel_15:SHORT_VOWEL_WORD, ixl_short_vowel_16:SHORT_VOWEL_WORD +14 more
  - Invalid Listen & Find classifications: -
  - Grapheme image leaks: -

## Duplicate IDs

_None._

## Missing Required Fields

- High-Frequency Words 1-25: ids 0, prompts 0, choices 30, correct 0, skill ids 0, levels 0, phases 0
- High-Frequency Words 26-50: ids 0, prompts 0, choices 30, correct 0, skill ids 0, levels 0, phases 0
- High-Frequency Words 51-75: ids 0, prompts 0, choices 46, correct 0, skill ids 0, levels 0, phases 0
- High-Frequency Words 76-100: ids 0, prompts 0, choices 46, correct 0, skill ids 0, levels 0, phases 0
- Long Vowels and Silent E: ids 0, prompts 0, choices 0, correct 0, skill ids 0, levels 0, phases 0
- R-Controlled Vowels: ids 0, prompts 0, choices 0, correct 0, skill ids 0, levels 0, phases 0

## Progression Logic Concerns

_None._

## Unassigned Questions

| ID | Source | Skill Label | Prompt |
| --- | --- | --- | --- |
| exp2_hfw_51_100_1 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_2 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_3 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_4 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_5 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_6 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_7 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_8 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_9 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_10 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_11 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_12 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_13 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_14 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_15 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_16 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_17 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_18 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_19 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_20 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_21 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_22 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_23 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_24 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp2_hfw_51_100_25 | templateExpansion2 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_1 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_2 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_3 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_4 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_5 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_6 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_7 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_8 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_9 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_10 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_11 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_12 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_13 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_14 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_15 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_16 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_17 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_18 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_19 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_20 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_21 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_22 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_23 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_24 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_25 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_26 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_27 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_28 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_29 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_30 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_31 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_32 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_33 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_34 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_35 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_36 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_37 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_38 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_39 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp6_hfw_extra_40 | templateExpansion6 | high-frequency words 51-100 | Which word best completes the sentence? |
| exp7_hfw_51_100_1 | templateExpansion7 | high-frequency words 51-100 | Complete the sentence about reading. |
| exp7_hfw_51_100_2 | templateExpansion7 | high-frequency words 51-100 | Complete the lunch-time sentence. |
| exp7_hfw_51_100_3 | templateExpansion7 | high-frequency words 51-100 | Complete the sentence about finding. |
| exp7_hfw_51_100_4 | templateExpansion7 | high-frequency words 51-100 | Complete the sentence about giving. |
| exp7_hfw_51_100_5 | templateExpansion7 | high-frequency words 51-100 | Complete the sentence about thinking. |
| qb9_hfw3_001 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'about'? |
| qb9_hfw3_002 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'after'? |
| qb9_hfw3_003 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'again'? |
| qb9_hfw3_004 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'any'? |
| qb9_hfw3_005 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'ask'? |
| qb9_hfw3_006 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'away'? |
| qb9_hfw3_007 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'back'? |
| qb9_hfw3_008 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'because'? |
| qb9_hfw3_009 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'came'? |
| qb9_hfw3_010 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'come'? |
| qb9_hfw3_011 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'day'? |
| qb9_hfw3_012 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'down'? |
| qb9_hfw3_013 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'find'? |
| qb9_hfw3_014 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'first'? |
| qb9_hfw3_015 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'give'? |
| qb9_hfw3_016 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'good'? |
| qb9_hfw3_017 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'here'? |
| qb9_hfw3_018 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'home'? |
| qb9_hfw3_019 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'just'? |
| qb9_hfw3_020 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'know'? |
| qb9_hfw3_021 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'many'? |
| qb9_hfw3_022 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'more'? |
| qb9_hfw3_023 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'said'? |
| qb9_hfw3_024 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'there'? |
| qb9_hfw3_025 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'want'? |
| qb9_hfw3_026 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'was'? |
| qb9_hfw3_027 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'went'? |
| qb9_hfw3_028 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'were'? |
| qb9_hfw3_029 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'what'? |
| qb9_hfw3_030 | questionBankExpansion9 | high-frequency words 51-100 | Which word is 'with'? |