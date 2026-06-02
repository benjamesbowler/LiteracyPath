# HFW Runtime Smoke Check

Generated: 2026-06-02T07:44:16.755Z

## Summary

- Checked HFW skills: hfw_1_25, hfw_26_50, hfw_51_75, hfw_76_100
- Round length target: 15
- Fatal failures: 0
- Runtime code changed: no
- Actual HFW lazy loading enabled: no
- HFW-safe loader helper added for Phase 8 readiness: yes

| Skill | Band Words | Raw Loader | Runtime Pool | Selectable | Level 1 | Level 2 | L1 Round | L2 Round | Target Words | Selectable Formats |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hfw_1_25 | 25 | 278 | 218 | 60 | 30 | 30 | 15 | 15 | 25 | HFW_IMAGE_CONTEXT_CLOZE: 30<br>HFW_LETTER_BUILD: 30 |
| hfw_26_50 | 25 | 279 | 219 | 60 | 30 | 30 | 15 | 15 | 25 | HFW_IMAGE_CONTEXT_CLOZE: 30<br>HFW_LETTER_BUILD: 30 |
| hfw_51_75 | 25 | 92 | 92 | 92 | 46 | 46 | 15 | 15 | 25 | HFW_IMAGE_CONTEXT_CLOZE: 46<br>HFW_LETTER_BUILD: 46 |
| hfw_76_100 | 25 | 92 | 92 | 92 | 46 | 46 | 15 | 15 | 25 | HFW_IMAGE_CONTEXT_CLOZE: 46<br>HFW_LETTER_BUILD: 46 |

## No-Audio and Shape Constraints

| Skill | Question Audio Fields | Question Audio Paths | Answer Audio Rows | Audio/Speaker Formats | disableAudio Issues | Skill ID Issues | Eligibility Issues |
| --- | --- | --- | --- | --- | --- | --- | --- |
| hfw_1_25 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| hfw_26_50 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| hfw_51_75 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| hfw_76_100 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## Sample Round Seeds

| Skill | Level | Question ID | Format | Target Word |
| --- | --- | --- | --- | --- |
| hfw_1_25 | Level 1 | hfw_hfw-1-25_01_the_l1_cloze | HFW_IMAGE_CONTEXT_CLOZE | the |
| hfw_1_25 | Level 1 | hfw_hfw-1-25_02_to_l1_cloze | HFW_IMAGE_CONTEXT_CLOZE | to |
| hfw_1_25 | Level 1 | hfw_hfw-1-25_03_and_l1_cloze | HFW_IMAGE_CONTEXT_CLOZE | and |
| hfw_1_25 | Level 2 | hfw_hfw-1-25_01_the_l2_build | HFW_LETTER_BUILD | the |
| hfw_1_25 | Level 2 | hfw_hfw-1-25_02_to_l2_build | HFW_LETTER_BUILD | to |
| hfw_1_25 | Level 2 | hfw_hfw-1-25_03_and_l2_build | HFW_LETTER_BUILD | and |
| hfw_26_50 | Level 1 | hfw_hfw-26-50_01_down_l1_cloze | HFW_IMAGE_CONTEXT_CLOZE | down |
| hfw_26_50 | Level 1 | hfw_hfw-26-50_02_not_l1_cloze | HFW_IMAGE_CONTEXT_CLOZE | not |
| hfw_26_50 | Level 1 | hfw_hfw-26-50_03_play_l1_cloze | HFW_IMAGE_CONTEXT_CLOZE | play |
| hfw_26_50 | Level 2 | hfw_hfw-26-50_01_down_l2_build | HFW_LETTER_BUILD | down |
| hfw_26_50 | Level 2 | hfw_hfw-26-50_02_not_l2_build | HFW_LETTER_BUILD | not |
| hfw_26_50 | Level 2 | hfw_hfw-26-50_03_play_l2_build | HFW_LETTER_BUILD | play |
| hfw_51_75 | Level 1 | hfw_hfw-51-75_01_after_l1_cloze | HFW_IMAGE_CONTEXT_CLOZE | after |
| hfw_51_75 | Level 1 | hfw_hfw-51-75_02_again_l1_cloze | HFW_IMAGE_CONTEXT_CLOZE | again |
| hfw_51_75 | Level 1 | hfw_hfw-51-75_03_an_l1_cloze | HFW_IMAGE_CONTEXT_CLOZE | an |
| hfw_51_75 | Level 2 | hfw_hfw-51-75_01_after_l2_build | HFW_LETTER_BUILD | after |
| hfw_51_75 | Level 2 | hfw_hfw-51-75_02_again_l2_build | HFW_LETTER_BUILD | again |
| hfw_51_75 | Level 2 | hfw_hfw-51-75_03_an_l2_build | HFW_LETTER_BUILD | an |
| hfw_76_100 | Level 1 | hfw_hfw-76-100_01_just_l1_cloze | HFW_IMAGE_CONTEXT_CLOZE | just |
| hfw_76_100 | Level 1 | hfw_hfw-76-100_02_know_l1_cloze | HFW_IMAGE_CONTEXT_CLOZE | know |
| hfw_76_100 | Level 1 | hfw_hfw-76-100_03_let_l1_cloze | HFW_IMAGE_CONTEXT_CLOZE | let |
| hfw_76_100 | Level 2 | hfw_hfw-76-100_01_just_l2_build | HFW_LETTER_BUILD | just |
| hfw_76_100 | Level 2 | hfw_hfw-76-100_02_know_l2_build | HFW_LETTER_BUILD | know |
| hfw_76_100 | Level 2 | hfw_hfw-76-100_03_let_l2_build | HFW_LETTER_BUILD | let |

## Legacy HFW Check

- hfw_51_100 active in skillTree: no
- hfw_51_100 runtime questions: 0

## Failures

- none
