# Final Sounds Level 1 Purity Audit

Date: 2026-05-26

## Summary

- Runtime Final Sounds candidates scanned: 533
- Runtime-selectable Final Sounds candidates: 452
- Clean Level 1 runtime candidates after last-mile guard: 191
- Generated Level 1 candidates scanned: 112
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
| 1 | ending_l1_021_jam | m | jam | m, b, d, g |
| 2 | ending_l1_043_fossil | l | fossil | l, b, d, g |
| 3 | gen_final_l1_n_open_10_sound | n | open | n, b, d, g |
| 4 | ending_l1_026_bug | g | bug | g, b, d, l |
| 5 | gen_final_l1_p_zip_16_sound | p | zip | p, b, d, g |
| 6 | ending_l1_012_cab | b | cab | b, d, g, l |
| 7 | ending_l1_020_jet | t | jet | t, b, d, g |
| 8 | gen_final_l1_d_lid_4_sound | d | lid | d, b, g, l |
| 9 | ending_l1_006_pin | n | pin | n, b, d, g |
| 10 | ending_l1_030_hen | n | hen | n, b, d, g |
| 11 | ending_l1_035_fin | n | fin | n, b, d, g |
| 12 | qb8_final_10 | n | sun | n, m, p, d |
| 13 | ixl_ending_sound_17 | g | log | g, t, b, d |
| 14 | ending_l1_016_lab | b | lab | b, d, g, l |
| 15 | ending_l1_019_dab | b | dab | b, d, g, l |

## Sample Remediation Round

| # | id | target | word | answer options |
|---:|---|---|---|---|
| 1 | ending_l1_046_nail | l | nail | l, b, d, g |
| 2 | ending_l1_012_cab | b | cab | b, d, g, l |
| 3 | gen_final_l1_d_pad_7_sound | d | pad | d, b, g, l |
| 4 | ixl_ending_sound_17 | g | log | g, t, b, d |
| 5 | gen_final_l1_m_gum_1_sound | m | gum | m, b, d, g |
| 6 | qb8_final_10 | n | sun | n, m, p, d |
| 7 | qb8_final_12 | p | cup | p, d, m, n |
| 8 | ending_l1_038_cut | t | cut | t, b, d, g |
| 9 | ending_l1_042_animal | l | animal | l, b, d, g |
| 10 | ending_l1_048_pencil | l | pencil | l, b, d, g |
| 11 | ending_l1_051_wheel | l | wheel | l, b, d, g |
| 12 | gen_final_l1_l_nail_2_sound | l | nail | l, b, d, g |
| 13 | ending_l1_044_hospital | l | hospital | l, b, d, g |
| 14 | gen_final_l1_l_curl_0_sound | l | curl | l, b, d, g |
| 15 | gen_final_l1_l_wheel_5_sound | l | wheel | l, b, d, g |

## Blocked Runtime Level 1 Candidates

- none

## Failures

- none
