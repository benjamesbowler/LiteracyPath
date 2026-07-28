# HFW Runtime Smoke Check

Generated: 2026-07-27T22:49:18.551Z

## Summary

- Checked HFW skills: hfw_1_25, hfw_26_50, hfw_51_75, hfw_76_100
- Round length target: 15
- Fatal failures: 0
- Runtime code changed: no
- Actual HFW lazy loading enabled: no
- HFW-safe loader helper added for Phase 8 readiness: yes

| Skill | Band Words | Raw Loader | Runtime Pool | Selectable | Level 1 | Level 2 | L1 Round | L2 Round | Target Words | Selectable Formats |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hfw_1_25 | 25 | 147 | 150 | 147 | 72 | 75 | 15 | 15 | 25 | HFW_SENTENCE_CLOZE_L1P1_01: 23<br>HFW_SENTENCE_CLOZE_L1P2_02: 25<br>HFW_SENTENCE_CLOZE_L1P2_03: 24<br>HFW_SENTENCE_SPELL_L2P1_04: 25<br>HFW_SENTENCE_SPELL_L2P2_05: 25<br>HFW_SENTENCE_SPELL_L2P2_06: 25 |
| hfw_26_50 | 25 | 149 | 150 | 149 | 74 | 75 | 15 | 15 | 25 | HFW_SENTENCE_CLOZE_L1P1_01: 25<br>HFW_SENTENCE_CLOZE_L1P2_02: 24<br>HFW_SENTENCE_CLOZE_L1P2_03: 25<br>HFW_SENTENCE_SPELL_L2P1_04: 25<br>HFW_SENTENCE_SPELL_L2P2_05: 25<br>HFW_SENTENCE_SPELL_L2P2_06: 25 |
| hfw_51_75 | 25 | 148 | 150 | 148 | 73 | 75 | 15 | 15 | 25 | HFW_SENTENCE_CLOZE_L1P1_01: 23<br>HFW_SENTENCE_CLOZE_L1P2_02: 25<br>HFW_SENTENCE_CLOZE_L1P2_03: 25<br>HFW_SENTENCE_SPELL_L2P1_04: 25<br>HFW_SENTENCE_SPELL_L2P2_05: 25<br>HFW_SENTENCE_SPELL_L2P2_06: 25 |
| hfw_76_100 | 25 | 144 | 148 | 144 | 70 | 74 | 15 | 15 | 25 | HFW_SENTENCE_CLOZE_L1P1_01: 24<br>HFW_SENTENCE_CLOZE_L1P2_02: 23<br>HFW_SENTENCE_CLOZE_L1P2_03: 23<br>HFW_SENTENCE_SPELL_L2P1_04: 24<br>HFW_SENTENCE_SPELL_L2P2_05: 25<br>HFW_SENTENCE_SPELL_L2P2_06: 25 |

## No-Audio and Shape Constraints

| Skill | Question Audio Fields | Question Audio Paths | Answer Audio Rows | Audio/Speaker Formats | disableAudio Issues | Skill ID Issues | Eligibility Issues |
| --- | --- | --- | --- | --- | --- | --- | --- |
| hfw_1_25 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| hfw_26_50 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| hfw_51_75 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| hfw_76_100 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## HFW Audio Policy

HFW workbook runtime is intentionally text-only for active rows. Level 1 cloze rows and Level 2 sentence-spell rows require sentence text/context, not playable sentence audio files. Active rows should keep `disableAudio: true` and expose no audio paths.

| Skill | Level 1 Cloze Rows | L1 Playable Audio Required | Level 2 Spell Rows | L2 Playable Audio Required | Missing Sentence Text Rows | Unexpected Audio Path Rows | Kimi Audio Requests Required |
| --- | --- | --- | --- | --- | --- | --- | --- |
| hfw_1_25 | 72 | no | 75 | no | 0 | 0 | 0 |
| hfw_26_50 | 74 | no | 75 | no | 0 | 0 | 0 |
| hfw_51_75 | 73 | no | 75 | no | 0 | 0 | 0 |
| hfw_76_100 | 70 | no | 74 | no | 0 | 0 | 0 |

## Sample Round Seeds

| Skill | Level | Question ID | Format | Target Word |
| --- | --- | --- | --- | --- |
| hfw_1_25 | Level 1 | HFWQ-0001 | HFW_SENTENCE_CLOZE_L1P1_01 | the |
| hfw_1_25 | Level 1 | HFWQ-0007 | HFW_SENTENCE_CLOZE_L1P1_01 | of |
| hfw_1_25 | Level 1 | HFWQ-0013 | HFW_SENTENCE_CLOZE_L1P1_01 | and |
| hfw_1_25 | Level 2 | HFWQ-0004 | HFW_SENTENCE_SPELL_L2P1_04 | the |
| hfw_1_25 | Level 2 | HFWQ-0010 | HFW_SENTENCE_SPELL_L2P1_04 | of |
| hfw_1_25 | Level 2 | HFWQ-0016 | HFW_SENTENCE_SPELL_L2P1_04 | and |
| hfw_26_50 | Level 1 | HFWQ-0151 | HFW_SENTENCE_CLOZE_L1P1_01 | or |
| hfw_26_50 | Level 1 | HFWQ-0157 | HFW_SENTENCE_CLOZE_L1P1_01 | one |
| hfw_26_50 | Level 1 | HFWQ-0163 | HFW_SENTENCE_CLOZE_L1P1_01 | had |
| hfw_26_50 | Level 2 | HFWQ-0154 | HFW_SENTENCE_SPELL_L2P1_04 | or |
| hfw_26_50 | Level 2 | HFWQ-0160 | HFW_SENTENCE_SPELL_L2P1_04 | one |
| hfw_26_50 | Level 2 | HFWQ-0166 | HFW_SENTENCE_SPELL_L2P1_04 | had |
| hfw_51_75 | Level 1 | HFWQ-0301 | HFW_SENTENCE_CLOZE_L1P1_01 | will |
| hfw_51_75 | Level 1 | HFWQ-0307 | HFW_SENTENCE_CLOZE_L1P1_01 | up |
| hfw_51_75 | Level 1 | HFWQ-0313 | HFW_SENTENCE_CLOZE_L1P1_01 | other |
| hfw_51_75 | Level 2 | HFWQ-0304 | HFW_SENTENCE_SPELL_L2P1_04 | will |
| hfw_51_75 | Level 2 | HFWQ-0310 | HFW_SENTENCE_SPELL_L2P1_04 | up |
| hfw_51_75 | Level 2 | HFWQ-0316 | HFW_SENTENCE_SPELL_L2P1_04 | other |
| hfw_76_100 | Level 1 | HFWQ-0451 | HFW_SENTENCE_CLOZE_L1P1_01 | number |
| hfw_76_100 | Level 1 | HFWQ-0457 | HFW_SENTENCE_CLOZE_L1P1_01 | no |
| hfw_76_100 | Level 1 | HFWQ-0463 | HFW_SENTENCE_CLOZE_L1P1_01 | way |
| hfw_76_100 | Level 2 | HFWQ-0454 | HFW_SENTENCE_SPELL_L2P1_04 | number |
| hfw_76_100 | Level 2 | HFWQ-0460 | HFW_SENTENCE_SPELL_L2P1_04 | no |
| hfw_76_100 | Level 2 | HFWQ-0466 | HFW_SENTENCE_SPELL_L2P1_04 | way |

## Legacy HFW Check

- hfw_51_100 active in skillTree: no
- hfw_51_100 runtime questions: 0

## Failures

- none
