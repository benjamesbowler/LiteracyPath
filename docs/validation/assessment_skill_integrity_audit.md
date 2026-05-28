# Assessment Skill Integrity Audit

Generated: 2026-05-28T04:54:28.655Z

Strict contract: every assessment skill should have exactly 2 levels, exactly 2 phases, 15 safe questions per phase, and at least 30 unique usable questions per level. This is audit-only and does not modify question content.

## Top-Level Summary

| Metric | Count |
| --- | --- |
| skillsAudited | 29 |
| productionReadySkills | 21 |
| failingPhaseCount | 0 |
| failingLevelCount | 0 |
| belowLevel1Depth | 0 |
| belowLevel2Depth | 0 |
| unableToGenerate15QuestionRound | 0 |
| duplicateIdGroups | 0 |
| missingQuestionIds | 0 |
| missingPrompts | 0 |
| missingAnswerChoices | 0 |
| missingCorrectAnswers | 0 |
| missingSkillIds | 0 |
| missingLevelData | 0 |
| missingPhaseData | 0 |
| unassignedQuestions | 140 |

## Summary By Skill

| # | Skill | Skill ID | Unique total | L1 usable | L2 usable | Phases | Levels | 2 phases | 2 levels | L1 missing | L2 missing | Round risk | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Initial Sounds | initial_sounds | 175 | 140 | 35 | 2 | 2 | yes | yes | 0 | 0 | ok | blocker |
| 2 | Final Sounds | final_sounds | 379 | 178 | 201 | 2 | 2 | yes | yes | 0 | 0 | ok | pass |
| 3 | Rhyming | rhyming | 339 | 280 | 59 | 2 | 2 | yes | yes | 0 | 0 | ok | blocker |
| 4 | CVC Short Vowels | cvc_short_vowels | 413 | 323 | 90 | 2 | 2 | yes | yes | 0 | 0 | ok | pass |
| 5 | Short Vowel Discrimination | short_vowel_discrimination | 306 | 271 | 35 | 2 | 2 | yes | yes | 0 | 0 | ok | blocker |
| 6 | High-Frequency Words 1-25 | hfw_1_25 | 96 | 61 | 35 | 2 | 2 | yes | yes | 0 | 0 | ok | pass |
| 7 | High-Frequency Words 26-50 | hfw_26_50 | 123 | 48 | 75 | 2 | 2 | yes | yes | 0 | 0 | ok | pass |
| 8 | High-Frequency Words 51-100 | hfw_51_100 | 165 | 35 | 130 | 2 | 2 | yes | yes | 0 | 0 | ok | pass |
| 9 | Blends | blends | 122 | 88 | 34 | 2 | 2 | yes | yes | 0 | 0 | ok | pass |
| 10 | Digraphs | digraphs | 126 | 76 | 50 | 2 | 2 | yes | yes | 0 | 0 | ok | blocker |
| 11 | Long Vowels and Silent E | long_vowels_silent_e | 104 | 35 | 69 | 2 | 2 | yes | yes | 0 | 0 | ok | blocker |
| 12 | Vowel Teams | vowel_teams | 111 | 35 | 76 | 2 | 2 | yes | yes | 0 | 0 | ok | blocker |
| 13 | R-Controlled Vowels | r_controlled_vowels | 91 | 35 | 56 | 2 | 2 | yes | yes | 0 | 0 | ok | blocker |
| 14 | Nouns | nouns | 89 | 35 | 54 | 2 | 2 | yes | yes | 0 | 0 | ok | pass |
| 15 | Verbs | verbs | 95 | 41 | 54 | 2 | 2 | yes | yes | 0 | 0 | ok | pass |
| 16 | Adjectives | adjectives | 81 | 42 | 39 | 2 | 2 | yes | yes | 0 | 0 | ok | pass |
| 17 | Prepositions of Place | prepositions_of_place | 109 | 57 | 52 | 2 | 2 | yes | yes | 0 | 0 | ok | pass |
| 18 | Plurals | plurals | 137 | 35 | 102 | 2 | 2 | yes | yes | 0 | 0 | ok | pass |
| 19 | Prefixes and Suffixes | prefixes_suffixes | 111 | 35 | 76 | 2 | 2 | yes | yes | 0 | 0 | ok | blocker |
| 20 | Antonyms and Synonyms | antonyms_synonyms | 100 | 35 | 65 | 2 | 2 | yes | yes | 0 | 0 | ok | pass |
| 21 | Homophones and Homonyms | homophones_homonyms | 87 | 35 | 52 | 2 | 2 | yes | yes | 0 | 0 | ok | pass |
| 22 | Sentence Comprehension | sentence_comprehension | 160 | 35 | 125 | 2 | 2 | yes | yes | 0 | 0 | ok | pass |
| 23 | Key Details | key_details | 94 | 35 | 59 | 2 | 2 | yes | yes | 0 | 0 | ok | pass |
| 24 | Sequencing | sequencing | 94 | 35 | 59 | 2 | 2 | yes | yes | 0 | 0 | ok | pass |
| 25 | Main Idea | main_idea | 100 | 35 | 65 | 2 | 2 | yes | yes | 0 | 0 | ok | pass |
| 26 | Inference | inference | 140 | 35 | 105 | 2 | 2 | yes | yes | 0 | 0 | ok | pass |
| 27 | Cause and Effect | cause_effect | 100 | 35 | 65 | 2 | 2 | yes | yes | 0 | 0 | ok | pass |
| 28 | Context Clues | context_clues | 100 | 35 | 65 | 2 | 2 | yes | yes | 0 | 0 | ok | pass |
| 29 | Theme and Higher Comprehension | theme_higher_comprehension | 100 | 35 | 65 | 2 | 2 | yes | yes | 0 | 0 | ok | pass |

## Red Flags

- Initial Sounds: strict production contract not met
- Rhyming: strict production contract not met
- Short Vowel Discrimination: strict production contract not met
- Digraphs: strict production contract not met
- Long Vowels and Silent E: strict production contract not met
- Vowel Teams: strict production contract not met
- R-Controlled Vowels: strict production contract not met
- Prefixes and Suffixes: strict production contract not met

## Skills Passing All Checks

- Final Sounds
- CVC Short Vowels
- High-Frequency Words 1-25
- High-Frequency Words 26-50
- High-Frequency Words 51-100
- Blends
- Nouns
- Verbs
- Adjectives
- Prepositions of Place
- Plurals
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

## Duplicate IDs

_None._

## Missing Required Fields

_None._

## Progression Logic Concerns

### 1. Initial Sounds

- Skill id: `initial_sounds`
- Unique strict usable questions: 175
- Level 1: 140/30; phases 1, 2; targets 38
- Level 2: 35/30; phases 1, 2; targets 2
- Duplicate IDs: none
- Missing required fields: question ids 0; prompts 0; choices 0; correct answers 0; skill ids 0; levels 0; phases 0
- Runtime risks: none
- Progression concerns: none

### 3. Rhyming

- Skill id: `rhyming`
- Unique strict usable questions: 339
- Level 1: 280/30; phases 1, 2; targets 55
- Level 2: 59/30; phases 1, 2; targets 13
- Duplicate IDs: none
- Missing required fields: question ids 0; prompts 0; choices 0; correct answers 0; skill ids 0; levels 0; phases 0
- Runtime risks: none
- Progression concerns: none

### 5. Short Vowel Discrimination

- Skill id: `short_vowel_discrimination`
- Unique strict usable questions: 306
- Level 1: 271/30; phases 1, 2; targets 5
- Level 2: 35/30; phases 1, 2; targets 5
- Duplicate IDs: none
- Missing required fields: question ids 0; prompts 0; choices 0; correct answers 0; skill ids 0; levels 0; phases 0
- Runtime risks: none
- Progression concerns: none

### 10. Digraphs

- Skill id: `digraphs`
- Unique strict usable questions: 126
- Level 1: 76/30; phases 1, 2; targets 9
- Level 2: 50/30; phases 1, 2; targets 26
- Duplicate IDs: none
- Missing required fields: question ids 0; prompts 0; choices 0; correct answers 0; skill ids 0; levels 0; phases 0
- Runtime risks: none
- Progression concerns: none

### 11. Long Vowels and Silent E

- Skill id: `long_vowels_silent_e`
- Unique strict usable questions: 104
- Level 1: 35/30; phases 1, 2; targets 5
- Level 2: 69/30; phases 1, 2; targets 33
- Duplicate IDs: none
- Missing required fields: question ids 0; prompts 0; choices 0; correct answers 0; skill ids 0; levels 0; phases 0
- Runtime risks: none
- Progression concerns: none

### 12. Vowel Teams

- Skill id: `vowel_teams`
- Unique strict usable questions: 111
- Level 1: 35/30; phases 1, 2; targets 5
- Level 2: 76/30; phases 1, 2; targets 36
- Duplicate IDs: none
- Missing required fields: question ids 0; prompts 0; choices 0; correct answers 0; skill ids 0; levels 0; phases 0
- Runtime risks: none
- Progression concerns: none

### 13. R-Controlled Vowels

- Skill id: `r_controlled_vowels`
- Unique strict usable questions: 91
- Level 1: 35/30; phases 1, 2; targets 4
- Level 2: 56/30; phases 1, 2; targets 28
- Duplicate IDs: none
- Missing required fields: question ids 0; prompts 0; choices 0; correct answers 0; skill ids 0; levels 0; phases 0
- Runtime risks: none
- Progression concerns: none

### 19. Prefixes and Suffixes

- Skill id: `prefixes_suffixes`
- Unique strict usable questions: 111
- Level 1: 35/30; phases 1, 2; targets 10
- Level 2: 76/30; phases 1, 2; targets 44
- Duplicate IDs: none
- Missing required fields: question ids 0; prompts 0; choices 0; correct answers 0; skill ids 0; levels 0; phases 0
- Runtime risks: none
- Progression concerns: none


## Unassigned Questions

| ID | Source | Skill Label | Prompt |
| --- | --- | --- | --- |
| phonics_k_007 | generatedQuestions | phonics | Choose the word that rhymes with 'hat'. |
| phonics_k_008 | generatedQuestions | phonics | Which letter comes at the end of the word 'pig'? |
| phonics_k_017 | generatedQuestions | phonics | Which word rhymes with 'pin'? |
| phonics_k_032 | generatedQuestions | phonics | In stop, which letter comes after s? |
| phonics_k_033 | generatedQuestions | phonics | Which word rhymes with 'cap'? |
| phonics_k_036 | generatedQuestions | phonics | Which word has the long 'a' sound? |
| phonics_k_040 | generatedQuestions | phonics | What sounds do the letters 'th' make together? |
| phonics_k_042 | generatedQuestions | phonics | Which word contains the 'ck' sound at the end? |
| phonics_k_044 | generatedQuestions | phonics | Which letter is the first sound you hear in 'bat'? |
| phonics_k_046 | generatedQuestions | phonics | Which letter is at the end of the word 'fan'? |
| phonics_k_048 | generatedQuestions | phonics | What sound do the letters 'ck' make at the end of a word like 'duck'? |
| phonics_k_052 | generatedQuestions | phonics | What letter do you see at the end of the word 'bag'? |
| phonics_k_062 | generatedQuestions | phonics | What two letters make the sound at the start of the word 'this'? |
| phonics_k_063 | generatedQuestions | phonics | Which letter is at the beginning of the word 'run'? |
| phonics_k_064 | generatedQuestions | phonics | Choose the word that rhymes with 'pig'. |
| phonics_k_072 | generatedQuestions | phonics | What letter is at the end of the word 'zip'? |
| phonics_k_081 | generatedQuestions | phonics | Choose the correct pair that matches the word: 'ship'. |
| phonics_k_085 | generatedQuestions | phonics | Which letter is the last sound you hear in 'cat'? |
| phonics_k_091 | generatedQuestions | phonics | Which word rhymes with 'hat'? |
| phonics_k_094 | generatedQuestions | phonics | Which letter is at the end of the word 'sun'? |
| phonics_k_099 | generatedQuestions | phonics | Which letter comes at the beginning of the word 'pig'? |
| spelling-k-1-002 | generatedQuestions | spelling | Select the word that spells the round, bright ball in the sky. |
| spelling-k-1-003 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-1-005 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-1-006 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-1-007 | generatedQuestions | spelling | Which word is the color of strawberries? |
| spelling-k-1-008 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-1-009 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-1-010 | generatedQuestions | spelling | Which word means to move quickly on foot? |
| spelling-k-1-011 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-1-015 | generatedQuestions | spelling | Which word means to leap into the air? |
| spelling-k-1-016 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-1-017 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-1-018 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-1-020 | generatedQuestions | spelling | Which word means the opposite of East? |
| spelling-k-1-022 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-1-025 | generatedQuestions | spelling | Which word means to move very quickly? |
| spelling-k-1-026 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-1-028 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-1-029 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-1-030 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-032 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-033 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-034 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-035 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-036 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-037 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-038 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-039 | generatedQuestions | spelling | Which word means the early part of the day? |
| spelling-k-2-041 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-042 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-043 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-045 | generatedQuestions | spelling | Which word means to run after something to catch it? |
| spelling-k-2-046 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-047 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-048 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-049 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-050 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-051 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-052 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-053 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-055 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-056 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-057 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-058 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-059 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-060 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-061 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-062 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-063 | generatedQuestions | spelling | Which word means to shut something? |
| spelling-k-2-064 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-065 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-066 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-067 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-070 | generatedQuestions | spelling | Which word means the opposite of cold? |
| spelling-k-2-071 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-075 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-076 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-077 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-078 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-079 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-080 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-081 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-083 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-084 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-085 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-086 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-087 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-088 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-090 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-091 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-092 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-096 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-097 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-098 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-099 | generatedQuestions | spelling | Which word is spelled correctly? |
| spelling-k-2-100 | generatedQuestions | spelling | Which word is spelled correctly? |
| RC001 | generatedQuestions | reading comprehension | Who catches the ball? |
| RC002 | generatedQuestions | reading comprehension | What does Lucy do after breakfast? |
| RC003 | generatedQuestions | reading comprehension | How many apples does Ben have after giving one away? |