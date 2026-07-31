# Independent Skills Assessment v3 audit

Generated 2026-07-31T09:35:03.048Z. This report deliberately does not inherit the verdict from `gate.mjs`.

## Verdict

**NOT RELEASE READY**

- Banks: 30/30
- Items: 2518
- Independently reviewed items recorded in provenance: 0/2518
- Ben sign-offs recorded in provenance: 0/2518
- Cross-skill reused passages: 0

## Systemic gates

| Gate | Result | Requirement |
|---|---|---|
| RUNTIME-LEGACY-MASTERY | PASS | assessmentRoundController must call computeSkillStatus for v3 progression. |
| REPORT-CLASS-ONE-BRAIN | PASS | reportingSystem must call computeSkillStatus for v3 skill status. |
| REPORT-STUDENT-ONE-BRAIN | PASS | studentReportingWorkspaceModel must call computeSkillStatus for v3 skill status. |
| GATE-G6 | PASS | The release gate must include the one-report integration gate. |
| GATE-G7-HARD | PASS | Human sign-off must be a hard release gate, per PLAN G7/G8. |
| GATE-SCANNER-5-PERCENT | PASS | SIM-SCANNER release threshold must be <5%. |
| GATE-GUESS-10000 | PASS | SIM-GUESS must run 10,000 trials. |
| GATE-REGRESSION-ASSERTED | PASS | SIM-REGRESS must change the G4 verdict, not be computed and discarded. |

## Per-skill mechanical audit

| Skill | Items | Signed off | Near-template pairs | Answer-position buckets over cap | Broken cloze speech | Findings |
|---|---:|---:|---:|---:|---:|---|
| adjectives | 60 | 0/60 | 33 | 1 | 0 | Human sign-off is missing on 60/60 items. Independent review is missing on 60/60 items. 33 near-similar item pairs exceed the independent anti-template threshold. 1 level/form buckets exceed the 35% keyed-position cap. 45 items have no author note. 17 Level 2 items do not name a meaningful added demand. |
| antonyms_synonyms | 60 | 0/60 | 0 | 0 | 0 | Human sign-off is missing on 60/60 items. Independent review is missing on 60/60 items. 22 items have no author note. 7 Level 2 items do not name a meaningful added demand. |
| blends | 106 | 0/106 | 0 | 0 | 0 | Human sign-off is missing on 106/106 items. Independent review is missing on 106/106 items. 6 repeated option sets. 27 items have no author note. 4 Level 2 items do not name a meaningful added demand. |
| cause_effect | 64 | 0/64 | 0 | 0 | 0 | Human sign-off is missing on 64/64 items. Independent review is missing on 64/64 items. 57 items have no author note. 19 Level 2 items do not name a meaningful added demand. |
| context_clues | 64 | 0/64 | 0 | 0 | 0 | Human sign-off is missing on 64/64 items. Independent review is missing on 64/64 items. 64 items have no author note. 24 Level 2 items do not name a meaningful added demand. |
| cvc_short_vowels | 70 | 0/70 | 55 | 2 | 0 | Human sign-off is missing on 70/70 items. Independent review is missing on 70/70 items. 4 repeated option sets. 55 near-similar item pairs exceed the independent anti-template threshold. 2 level/form buckets exceed the 35% keyed-position cap. 43 items have no author note. 14 Level 2 items do not name a meaningful added demand. |
| digraphs | 60 | 0/60 | 17 | 0 | 0 | Human sign-off is missing on 60/60 items. Independent review is missing on 60/60 items. 5 repeated option sets. 17 near-similar item pairs exceed the independent anti-template threshold. 18 items have no author note. 8 Level 2 items do not name a meaningful added demand. |
| final_sounds | 82 | 0/82 | 0 | 2 | 0 | Human sign-off is missing on 82/82 items. Independent review is missing on 82/82 items. 2 level/form buckets exceed the 35% keyed-position cap. 13 items have no author note. 3 Level 2 items do not name a meaningful added demand. |
| hfw_1_25 | 135 | 0/135 | 0 | 3 | 0 | Human sign-off is missing on 135/135 items. Independent review is missing on 135/135 items. 3 level/form buckets exceed the 35% keyed-position cap. 95 items have no author note. 49 Level 2 items do not name a meaningful added demand. |
| hfw_26_50 | 135 | 0/135 | 0 | 3 | 0 | Human sign-off is missing on 135/135 items. Independent review is missing on 135/135 items. 3 level/form buckets exceed the 35% keyed-position cap. 71 items have no author note. 33 Level 2 items do not name a meaningful added demand. |
| hfw_51_75 | 135 | 0/135 | 0 | 3 | 0 | Human sign-off is missing on 135/135 items. Independent review is missing on 135/135 items. 3 level/form buckets exceed the 35% keyed-position cap. 68 items have no author note. 29 Level 2 items do not name a meaningful added demand. |
| hfw_76_100 | 135 | 0/135 | 0 | 3 | 0 | Human sign-off is missing on 135/135 items. Independent review is missing on 135/135 items. 3 level/form buckets exceed the 35% keyed-position cap. 66 items have no author note. 30 Level 2 items do not name a meaningful added demand. |
| homophones_homonyms | 80 | 0/80 | 0 | 0 | 0 | Human sign-off is missing on 80/80 items. Independent review is missing on 80/80 items. 30 items have no author note. 13 Level 2 items do not name a meaningful added demand. |
| inference | 64 | 0/64 | 0 | 0 | 0 | Human sign-off is missing on 64/64 items. Independent review is missing on 64/64 items. 16 items have no author note. |
| initial_sounds | 160 | 0/160 | 5460 | 0 | 0 | Human sign-off is missing on 160/160 items. Independent review is missing on 160/160 items. 5460 near-similar item pairs exceed the independent anti-template threshold. 120 items have no author note. 55 Level 2 items do not name a meaningful added demand. |
| key_details | 71 | 0/71 | 0 | 0 | 0 | Human sign-off is missing on 71/71 items. Independent review is missing on 71/71 items. 23 items have no author note. 12 Level 2 items do not name a meaningful added demand. |
| long_vowels_silent_e | 68 | 0/68 | 0 | 0 | 0 | Human sign-off is missing on 68/68 items. Independent review is missing on 68/68 items. 2 repeated option sets. |
| main_idea | 64 | 0/64 | 0 | 0 | 0 | Human sign-off is missing on 64/64 items. Independent review is missing on 64/64 items. 63 items have no author note. 23 Level 2 items do not name a meaningful added demand. |
| nouns | 60 | 0/60 | 19 | 0 | 0 | Human sign-off is missing on 60/60 items. Independent review is missing on 60/60 items. 19 near-similar item pairs exceed the independent anti-template threshold. 49 items have no author note. 18 Level 2 items do not name a meaningful added demand. |
| plurals | 60 | 0/60 | 0 | 0 | 0 | Human sign-off is missing on 60/60 items. Independent review is missing on 60/60 items. 1 repeated option sets. 34 items have no author note. 12 Level 2 items do not name a meaningful added demand. |
| prefixes_suffixes | 78 | 0/78 | 0 | 0 | 0 | Human sign-off is missing on 78/78 items. Independent review is missing on 78/78 items. 78 items have no author note. 36 Level 2 items do not name a meaningful added demand. |
| prepositions_of_place | 76 | 0/76 | 0 | 0 | 0 | Human sign-off is missing on 76/76 items. Independent review is missing on 76/76 items. 11 repeated option sets. 47 items have no author note. 9 Level 2 items do not name a meaningful added demand. |
| r_controlled_vowels | 70 | 0/70 | 157 | 0 | 0 | Human sign-off is missing on 70/70 items. Independent review is missing on 70/70 items. 6 repeated option sets. 157 near-similar item pairs exceed the independent anti-template threshold. 4 items have no author note. 2 Level 2 items do not name a meaningful added demand. |
| rhyming | 145 | 0/145 | 378 | 2 | 0 | Human sign-off is missing on 145/145 items. Independent review is missing on 145/145 items. 378 near-similar item pairs exceed the independent anti-template threshold. 2 level/form buckets exceed the 35% keyed-position cap. 94 items have no author note. 28 Level 2 items do not name a meaningful added demand. |
| sentence_comprehension | 72 | 0/72 | 0 | 0 | 0 | Human sign-off is missing on 72/72 items. Independent review is missing on 72/72 items. 68 items have no author note. 20 Level 2 items do not name a meaningful added demand. |
| sequencing | 62 | 0/62 | 0 | 0 | 0 | Human sign-off is missing on 62/62 items. Independent review is missing on 62/62 items. 61 items have no author note. 23 Level 2 items do not name a meaningful added demand. 30 image-required items have unresolved files. |
| short_vowel_discrimination | 70 | 0/70 | 435 | 0 | 0 | Human sign-off is missing on 70/70 items. Independent review is missing on 70/70 items. 5 repeated option sets. 435 near-similar item pairs exceed the independent anti-template threshold. 34 items have no author note. 16 Level 2 items do not name a meaningful added demand. |
| theme_higher_comprehension | 64 | 0/64 | 0 | 0 | 0 | Human sign-off is missing on 64/64 items. Independent review is missing on 64/64 items. 60 items have no author note. 20 Level 2 items do not name a meaningful added demand. |
| verbs | 58 | 0/58 | 87 | 2 | 0 | Human sign-off is missing on 58/58 items. Independent review is missing on 58/58 items. 87 near-similar item pairs exceed the independent anti-template threshold. 2 level/form buckets exceed the 35% keyed-position cap. 39 items have no author note. 12 Level 2 items do not name a meaningful added demand. |
| vowel_teams | 90 | 0/90 | 9 | 1 | 0 | Human sign-off is missing on 90/90 items. Independent review is missing on 90/90 items. 5 repeated option sets. 9 near-similar item pairs exceed the independent anti-template threshold. 1 level/form buckets exceed the 35% keyed-position cap. 39 items have no author note. 19 Level 2 items do not name a meaningful added demand. |

## Interpretation

Mechanical checks can disprove release readiness; they cannot prove that every answer is pedagogically defensible. The required human review remains a separate hard gate, exactly as AUTHORING_STANDARDS §7 specifies.
