# Skill Template Routing Audit

Date: 2026-05-25

## Final Sounds Repair

Final Sounds routing was repaired so Level 1 and Level 2 no longer share the same runtime pool.

| Area | Rule |
|---|---|
| Level 1 | Only purpose-built simple final-sound items with IDs `ending_l1_*` are eligible before Level 1 mastery. |
| Level 1 endings | One-letter final sounds only. No `nd`, `sk`, `st`, `mp`, `nk`, `ng`, `sh`, `ch`, `th`, `ll`, `ss`, `ff`, or `ck`. |
| Level 2 | Pair-selection review items and harder `ending_l2_*` items are eligible only after Level 1 simple final sounds are covered/mastered. |
| Prompt routing | Final Sounds accepts only ending/final-sound language. First/start/initial-sound prompts are rejected. |
| Legacy final word-match items | Treated as Level 2 review rather than Level 1 starter content. |

## Active Template Distribution

| Final Sounds Pool | Template/Format | Count | Runtime Role |
|---|---|---:|---|
| Level 1 | `ENDING_SOUND` (`ending_l1_*`) | 25 | Level 1 starter assessment |
| Level 2 | `ENDING_SOUND` (`ending_l2_*`) | 25 | Harder Level 2 assessment |
| Level 2 | `FINAL_SOUND_PAIR_SELECT` | 78 | Level 2/review pair selection |
| Level 2 review | legacy word-match / multiple-choice | existing legacy pool | Held out of Level 1 so it cannot introduce advanced or confusing patterns early |

## Blocked From Final Sounds Level 1

- Initial/start/first-sound prompts.
- Final blends and digraphs: `nd`, `sk`, `st`, `mp`, `nk`, `ng`, `sh`, `ch`, `th`, `ck`.
- Double-letter endings: `ll`, `ss`, `ff`.
- Legacy final-sound word-match items that are not part of the curated `ending_l1_*` set.

## Validation

- `tools/checkFinalSoundProgression.js` now verifies Level 1/Level 2 routing, start-sound prompt leakage, and generated Level 1 round safety.
- `tools/auditSkillBanks.js` now validates Level 1 Final Sounds final-sound type and rejects advanced endings in active Level 1 items.
