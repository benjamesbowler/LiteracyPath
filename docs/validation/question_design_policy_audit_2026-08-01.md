# Question Design Policy Audit

**Policy:** `2026-08-01.1`  
**Generated:** 2026-08-01T03:48:26.340Z  
**Verdict:** **FAIL**  

This report audits real runtime assessment output plus every registered Guided Reading quiz, Story Stop cover question, numbered EL Quest station, every level of all 11 visible arcade literacy games, the Sentence Fix bank and every generated worksheet recipe. It complements the specialist story, phonics, media and mastery gates; it does not replace child observation or claim that software alone proves validity.

## Surface results

| Surface | Questions/tasks | Documents | Result |
|---|---:|---:|---|
| 30 assessment skills | 1751 | — | FAIL (24) |
| Guided Reading quizzes | 528 | — | PASS |
| Story Stop cover questions | 38 | — | PASS |
| EL Quest stations | 1181 | — | PASS |
| Arcade · Rocket Run | 30 | — | PASS |
| Arcade · Letter Leap | 128 | — | PASS |
| Arcade · Sound Racer | 30 | — | PASS |
| Arcade · Word Bridge | 30 | — | PASS |
| Arcade · Sound Beat | 82 | — | PASS |
| Arcade · Rhyme Pop | 30 | — | PASS |
| Arcade · Sound Safari | 90 | — | PASS |
| Arcade · Reel & Read | 30 | — | PASS |
| Arcade · Sentence Grove | 120 | — | PASS |
| Arcade · Sentence Express | 90 | — | PASS |
| Arcade · Spell & Skate | 30 | — | PASS |
| Sentence Fix question bank | 42 | — | PASS |
| Generated worksheets | 320 | 76 | PASS |

## All 30 assessment skills

| Skill | Runtime questions | Result |
|---|---:|---|
| initial_sounds | 150 | PASS |
| final_sounds | 72 | PASS |
| rhyming | 135 | PASS |
| cvc_short_vowels | 60 | PASS |
| short_vowel_discrimination | 60 | PASS |
| hfw_1_25 | 125 | PASS |
| hfw_26_50 | 125 | PASS |
| hfw_51_75 | 125 | PASS |
| hfw_76_100 | 125 | PASS |
| blends | 96 | PASS |
| digraphs | 48 | PASS |
| long_vowels | 52 | PASS |
| vowel_teams | 78 | PASS |
| r_controlled | 60 | PASS |
| nouns | 48 | PASS |
| verbs | 48 | PASS |
| adjectives | 48 | PASS |
| prepositions | 64 | PASS |
| plurals | 50 | PASS |
| prefix_suffix | 66 | PASS |
| antonyms_synonyms | 48 | PASS |
| homophones | 68 | PASS |
| sentence_comprehension | 0 | FAIL (3) |
| key_details | 0 | FAIL (3) |
| sequencing | 0 | FAIL (3) |
| main_idea | 0 | FAIL (3) |
| inference | 0 | FAIL (3) |
| cause_effect | 0 | FAIL (3) |
| context_clues | 0 | FAIL (3) |
| theme | 0 | FAIL (3) |

## Findings

- **Q-EMPTY-SKILL** `Assessment skills/sentence_comprehension`: Published runtime bank is empty.
- **Q-LEVELS** `Assessment skills/sentence_comprehension`: Both Level 1 and Level 2 are required.
- **Q-PHASES** `Assessment skills/sentence_comprehension`: Both Phase 1 and Phase 2 are required.
- **Q-EMPTY-SKILL** `Assessment skills/key_details`: Published runtime bank is empty.
- **Q-LEVELS** `Assessment skills/key_details`: Both Level 1 and Level 2 are required.
- **Q-PHASES** `Assessment skills/key_details`: Both Phase 1 and Phase 2 are required.
- **Q-EMPTY-SKILL** `Assessment skills/sequencing`: Published runtime bank is empty.
- **Q-LEVELS** `Assessment skills/sequencing`: Both Level 1 and Level 2 are required.
- **Q-PHASES** `Assessment skills/sequencing`: Both Phase 1 and Phase 2 are required.
- **Q-EMPTY-SKILL** `Assessment skills/main_idea`: Published runtime bank is empty.
- **Q-LEVELS** `Assessment skills/main_idea`: Both Level 1 and Level 2 are required.
- **Q-PHASES** `Assessment skills/main_idea`: Both Phase 1 and Phase 2 are required.
- **Q-EMPTY-SKILL** `Assessment skills/inference`: Published runtime bank is empty.
- **Q-LEVELS** `Assessment skills/inference`: Both Level 1 and Level 2 are required.
- **Q-PHASES** `Assessment skills/inference`: Both Phase 1 and Phase 2 are required.
- **Q-EMPTY-SKILL** `Assessment skills/cause_effect`: Published runtime bank is empty.
- **Q-LEVELS** `Assessment skills/cause_effect`: Both Level 1 and Level 2 are required.
- **Q-PHASES** `Assessment skills/cause_effect`: Both Phase 1 and Phase 2 are required.
- **Q-EMPTY-SKILL** `Assessment skills/context_clues`: Published runtime bank is empty.
- **Q-LEVELS** `Assessment skills/context_clues`: Both Level 1 and Level 2 are required.
- **Q-PHASES** `Assessment skills/context_clues`: Both Phase 1 and Phase 2 are required.
- **Q-EMPTY-SKILL** `Assessment skills/theme`: Published runtime bank is empty.
- **Q-LEVELS** `Assessment skills/theme`: Both Level 1 and Level 2 are required.
- **Q-PHASES** `Assessment skills/theme`: Both Phase 1 and Phase 2 are required.

## Release interpretation

A PASS means all declared machine-checkable requirements in [the Question Design Bible](../content/QUESTION_DESIGN_BIBLE.md) have evidence at runtime. Routine named human sign-off is not a release gate. New observed ambiguity, access or validity problems must become a policy revision and regression check.
