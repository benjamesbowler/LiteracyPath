# Final Sounds Level 1 Purity Audit

Date: 2026-05-26

## Summary

- Runtime Final Sounds candidates scanned: 346
- Runtime-selectable Final Sounds candidates: 171
- Clean Level 1 runtime candidates after last-mile guard: 101
- Generated Level 1 candidates scanned: 45
- Dirty generated Level 1 candidates: 0
- Explicit Level 1 candidates blocked by guard: 0
- Fresh Level 1 rounds tested: 100
- Remediation Level 1 rounds tested: 100
- Generated candidate samples tested: 100
- Fatal failures: 0
- Warnings: 0

## Level 1 Rule

- Allowed targets: b, d, g, l, m, n, p, t
- Forbidden targets/options: ch, sh, th, ng, nd, nk, nt, st, sk, ft, lt, ll, ck, ss, ff, zz, mp, rk, lk, f, k, r, s
- Every Level 1 answer option must be one letter.

## Leak Source And Fix

- Advanced endings such as `sh`, `th`, and `sk` exist only in the Level 2 Final Sounds pools.
- Level 1 previously had fuzzy validation around double-final spellings such as `bell`, `ball`, `hill`, `doll`, and generated examples such as `egg`; these are now rejected as double consonants.
- A final runtime guard now runs in `src/App.jsx` immediately before early-phonics runtime eligibility filtering. If the current Final Sounds level is 1, any question that fails `getFinalSoundsLevel1QuestionIssues()` is removed before selection.

## Coverage

- Available clean targets: b, d, g, l, m, n, p, t
- Missing clean targets: none

## Sample Fresh Round

| # | id | target | word | answer options |
|---:|---|---|---|---|
| 1 | ending_l1_026_fin | n | fin | n, b, d, g |
| 2 | ending_l1_028_cot | t | cot | t, b, d, g |
| 3 | qb8_final_01 | d | bed | d, g, n, p |
| 4 | ixl_ending_sound_8 | g | bag | g, d, l, m |
| 5 | qb8_final_09 | m | ram | m, g, n, b |
| 6 | gen_final_l1_p_zip_8_sound | p | zip | p, b, d, g |
| 7 | gen_final_l1_b_tub_0_sound | b | tub | b, d, g, l |
| 8 | ending_l1_031_seal | l | seal | l, b, d, g |
| 9 | ending_l1_006_pin | n | pin | n, b, d, g |
| 10 | gen_final_l1_d_kid_3_sound | d | kid | d, b, g, l |
| 11 | qb8_final_10 | n | sun | n, m, p, d |
| 12 | gen_final_l1_g_bag_0_sound | g | bag | g, b, d, l |
| 13 | gen_final_l1_t_mat_9_sound | t | mat | t, b, d, g |
| 14 | gen_final_l1_n_sun_10_sound | n | sun | n, b, d, g |
| 15 | ixl_ending_sound_4 | p | map | p, l, m, n |

## Sample Remediation Round

| # | id | target | word | answer options |
|---:|---|---|---|---|
| 1 | gen_final_l1_l_seal_0_sound | l | seal | l, b, d, g |
| 2 | qb8_final_04 | b | web | b, d, m, t |
| 3 | gen_final_l1_d_red_6_sound | d | red | d, b, g, l |
| 4 | gen_final_l1_g_bag_0_sound | g | bag | g, b, d, l |
| 5 | ending_l1_024_ram | m | ram | m, b, d, g |
| 6 | gen_final_l1_n_pen_7_sound | n | pen | n, b, d, g |
| 7 | gen_final_l1_p_tap_5_sound | p | tap | p, b, d, g |
| 8 | ending_l1_001_cat | t | cat | t, b, d, g |
| 9 | ending_l1_031_seal | l | seal | l, b, d, g |
| 10 | gen_final_l1_b_tub_0_sound | b | tub | b, d, g, l |
| 11 | gen_final_l1_b_web_1_sound | b | web | b, d, g, l |
| 12 | ixl_ending_sound_10 | b | web | b, m, n, p |
| 13 | ending_l1_010_web | b | web | b, d, g, l |
| 14 | qb8_final_01 | d | bed | d, g, n, p |
| 15 | ixl_ending_sound_3 | d | bed | d, l, m, n |

## Blocked Runtime Level 1 Candidates

- none

## Failures

- none
