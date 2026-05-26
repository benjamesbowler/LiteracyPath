# Final Sounds Level 1 Purity Audit

Date: 2026-05-26

## Summary

- Runtime Final Sounds candidates scanned: 351
- Runtime-selectable Final Sounds candidates: 306
- Clean Level 1 runtime candidates after last-mile guard: 107
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
| 1 | ending_l1_002_dog | g | dog | g, b, d, l, g, b, d, l |
| 2 | gen_final_l1_b_web_1_sound | b | web | b, d, g, l, b, d, g, l |
| 3 | ending_l1_012_jam | m | jam | m, b, d, g, m, b, d, g |
| 4 | ixl_ending_sound_3 | d | bed | d, l, m, n, d, l, m, n |
| 5 | gen_final_l1_p_zip_8_sound | p | zip | p, b, d, g, p, b, d, g |
| 6 | ending_l1_011_jet | t | jet | t, b, d, g, t, b, d, g |
| 7 | ending_l1_022_fan | n | fan | n, b, d, g, n, b, d, g |
| 8 | ending_l1_032_ball | l | ball | l, b, d, g, l, b, d, g |
| 9 | ending_l1_016_mug | g | mug | g, b, d, l, g, b, d, l |
| 10 | gen_final_l1_g_log_9_sound | g | log | g, b, d, l, g, b, d, l |
| 11 | ending_l1_008_bag | g | bag | g, b, d, l, g, b, d, l |
| 12 | ending_l1_004_map | p | map | p, b, d, g, p, b, d, g |
| 13 | qb8_final_10 | n | sun | n, m, p, d |
| 14 | gen_final_l1_p_tap_5_sound | p | tap | p, b, d, g, p, b, d, g |
| 15 | qb8_final_14 | t | hat | t, p, m, g |

## Sample Remediation Round

| # | id | target | word | answer options |
|---:|---|---|---|---|
| 1 | ending_l1_032_ball | l | ball | l, b, d, g, l, b, d, g |
| 2 | ixl_ending_sound_10 | b | web | b, m, n, p, b, m, n, p |
| 3 | ending_l1_030_lid | d | lid | d, b, g, l, d, b, g, l |
| 4 | qb8_final_06 | g | log | g, d, m, p |
| 5 | gen_final_l1_m_gum_0_sound | m | gum | m, b, d, g, m, b, d, g |
| 6 | ending_l1_022_fan | n | fan | n, b, d, g, n, b, d, g |
| 7 | gen_final_l1_p_tap_5_sound | p | tap | p, b, d, g, p, b, d, g |
| 8 | gen_final_l1_t_exit_3_sound | t | exit | t, b, d, g, t, b, d, g |
| 9 | gen_final_l1_l_girl_0_sound | l | girl | l, b, d, g, l, b, d, g |
| 10 | ixl_ending_sound_23 | l | bell | l, d, g, m, l, d, g, m |
| 11 | ending_l1_034_doll | l | doll | l, b, d, g, l, b, d, g |
| 12 | gen_final_l1_l_oval_1_sound | l | oval | l, b, d, g, l, b, d, g |
| 13 | ending_l1_033_hill | l | hill | l, b, d, g, l, b, d, g |
| 14 | ending_l1_031_bell | l | bell | l, b, d, g, l, b, d, g |
| 15 | qb8_final_04 | b | web | b, d, m, t |

## Blocked Runtime Level 1 Candidates

- none

## Failures

- none
