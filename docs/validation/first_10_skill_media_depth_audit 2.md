# First 10 Skill Media Depth Audit

Date: 2026-06-04

Scope: first 10 skills in `src/skillTree.js`.

1. `initial_sounds`
2. `final_sounds`
3. `rhyming`
4. `cvc_short_vowels`
5. `short_vowel_discrimination`
6. `hfw_1_25`
7. `hfw_26_50`
8. `hfw_51_75`
9. `hfw_76_100`
10. `blends`

## Runtime-Selectable Counts

| Skill | Runtime-selectable | Level split | Missing selectable images | Partial image answer sets | Status |
| --- | ---: | --- | ---: | ---: | --- |
| initial_sounds | 108 | L1:54 L2:54 | 0 | 0 | pass |
| final_sounds | 379 | L1:195 L2:184 | 0 | 0 | pass |
| rhyming | 220 | L1:169 L2:51 | 0 | 0 | pass |
| cvc_short_vowels | 395 | L1:258 L2:137 | 0 | 0 | pass |
| short_vowel_discrimination | 132 | L1:86 L2:46 | 0 | 0 | pass |
| hfw_1_25 | 100 | L1:50 L2:50 | 0 | 0 | pass |
| hfw_26_50 | 100 | L1:50 L2:50 | 0 | 0 | pass |
| hfw_51_75 | 100 | L1:50 L2:50 | 0 | 0 | pass |
| hfw_76_100 | 100 | L1:50 L2:50 | 0 | 0 | pass |
| blends | 100 | L1:50 L2:50 | 0 | 0 | pass |

## Fixes Applied

- Increased HFW generated variants so each HFW band now has 100 runtime-selectable questions instead of 60/60/92/92.
- Added a first-10 top-up generated bank for Blends using K3 vocabulary media, with 20 Level 1 image-choice questions and 20 Level 2 complete-the-word questions.
- Tightened media QA image heuristics so blocked terms match real filename/path tokens, not hidden letter strings inside normal words. This unblocked `restaurant` without unblocking intentionally rejected words such as `opera`, `quartz`, `velvet`, or phrase targets.
- Repaired the Initial Sounds `net` pair set by replacing blocked `nut` image usage with approved `nap` media.
- Repaired `qb12_fs_016` into a proper media-backed Final Sounds item for `bed`.
- Updated early-skill generation so Final Sounds word-match rows require a real target image before being generated.
- Updated skill-level gap generation so QA-blocked audio, such as `zip`, is not used as runtime-safe media.

## Blocked-Media Review

The audit separated true media gaps from old or intentionally rejected content:

- No active first-10 question remains blocked only because image/audio media is missing.
- Old disallowed formats were not made selectable by weakening validators.
- Fake or non-child-facing targets such as `ballshell` and `bookdesk` were removed from regenerated runtime content instead of requesting images/audio for non-words.
- QA-blocked audio for `zip` remains blocked; the generator now skips it rather than treating the file as usable because it exists on disk.

## Result

The first 10 skill banks are all above the 100-question floor and the runtime-selectable answer/image checks are clean.
