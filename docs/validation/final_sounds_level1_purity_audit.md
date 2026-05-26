# Final Sounds Level 1 Purity Audit

Date: 2026-05-26

## Summary

- Runtime Final Sounds candidates scanned: 351
- Runtime-selectable Final Sounds candidates: 172
- Clean Level 1 runtime candidates after last-mile guard: 102
- Explicit Level 1 candidates blocked by guard: 0
- Fresh Level 1 rounds tested: 100
- Remediation Level 1 rounds tested: 100
- Fatal failures: 0
- Warnings: 0

## Level 1 Rule

- Allowed targets: b, d, g, l, m, n, p, t
- Forbidden targets/options: ch, sh, th, ng, nd, nk, nt, st, sk, ft, lt, ll, ck, ss, ff, zz, mp, rk, lk, f, k, r, s
- Every Level 1 answer option must be one letter.

## Coverage

- Available clean targets: b, d, g, l, m, n, p, t
- Missing clean targets: none

## Sample Fresh Round

| # | id | target | word | answer options |
|---:|---|---|---|---|
| 1 | ending_l1_017_bug | g | bug | g, b, d, l, g, b, d, l |
| 2 | gen_final_l1_d_lid_4_sound | d | lid | d, b, g, l, d, b, g, l |
| 3 | ending_l1_013_sun | n | sun | n, b, d, g, n, b, d, g |
| 4 | ending_l1_007_bat | t | bat | t, b, d, g, t, b, d, g |
| 5 | gen_final_l1_p_tap_5_sound | p | tap | p, b, d, g, p, b, d, g |
| 6 | gen_final_l1_l_girl_0_sound | l | girl | l, b, d, g, l, b, d, g |
| 7 | ixl_ending_sound_10 | b | web | b, m, n, p, b, m, n, p |
| 8 | ending_l1_025_gum | m | gum | m, b, d, g, m, b, d, g |
| 9 | gen_final_l1_t_exit_3_sound | t | exit | t, b, d, g, t, b, d, g |
| 10 | gen_final_l1_n_man_5_sound | n | man | n, b, d, g, n, b, d, g |
| 11 | gen_final_l1_t_rat_12_sound | t | rat | t, b, d, g, t, b, d, g |
| 12 | ending_l1_015_log | g | log | g, b, d, l, g, b, d, l |
| 13 | ixl_ending_sound_17 | g | log | g, t, b, d, g, t, b, d |
| 14 | qb8_final_15 | t | pot | t, d, n, b |
| 15 | ending_l1_001_cat | t | cat | t, b, d, g, t, b, d, g |

## Sample Remediation Round

| # | id | target | word | answer options |
|---:|---|---|---|---|
| 1 | gen_final_l1_l_girl_0_sound | l | girl | l, b, d, g, l, b, d, g |
| 2 | ixl_ending_sound_10 | b | web | b, m, n, p, b, m, n, p |
| 3 | ending_l1_003_bed | d | bed | d, b, g, l, d, b, g, l |
| 4 | ixl_ending_sound_21 | g | wig | g, m, n, p, g, m, n, p |
| 5 | ending_l1_025_gum | m | gum | m, b, d, g, m, b, d, g |
| 6 | ending_l1_005_pan | n | pan | n, b, d, g, n, b, d, g |
| 7 | ending_l1_009_cup | p | cup | p, b, d, g, p, b, d, g |
| 8 | ending_l1_001_cat | t | cat | t, b, d, g, t, b, d, g |
| 9 | gen_final_l1_l_oval_1_sound | l | oval | l, b, d, g, l, b, d, g |
| 10 | qb8_final_04 | b | web | b, d, m, t |
| 11 | gen_final_l1_b_tub_0_sound | b | tub | b, d, g, l, b, d, g, l |
| 12 | gen_final_l1_b_web_1_sound | b | web | b, d, g, l, b, d, g, l |
| 13 | ending_l1_010_web | b | web | b, d, g, l, b, d, g, l |
| 14 | gen_final_l1_d_lid_4_sound | d | lid | d, b, g, l, d, b, g, l |
| 15 | gen_final_l1_d_red_6_sound | d | red | d, b, g, l, d, b, g, l |

## Blocked Runtime Level 1 Candidates

- none

## Failures

- none
