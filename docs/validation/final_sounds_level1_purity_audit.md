# Final Sounds Level 1 Purity Audit

Date: 2026-05-26

## Summary

- Runtime Final Sounds candidates scanned: 532
- Runtime-selectable Final Sounds candidates: 451
- Clean Level 1 runtime candidates after last-mile guard: 190
- Generated Level 1 candidates scanned: 111
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
| 1 | ending_l1_003_bed | d | bed | d, b, g, l |
| 2 | ending_l1_021_jam | m | jam | m, b, d, g |
| 3 | gen_final_l1_g_peg_11_sound | g | peg | g, b, d, l |
| 4 | ending_l1_009_cup | p | cup | p, b, d, g |
| 5 | ending_l1_041_crab | b | crab | b, d, g, l |
| 6 | ending_l1_051_wheel | l | wheel | l, b, d, g |
| 7 | gen_final_l1_t_sit_17_sound | t | sit | t, b, d, g |
| 8 | ending_l1_029_pen | n | pen | n, b, d, g |
| 9 | gen_final_l1_d_mud_6_sound | d | mud | d, b, g, l |
| 10 | gen_final_l1_g_tag_15_sound | g | tag | g, b, d, l |
| 11 | qb8_final_03 | d | lid | d, b, n, p |
| 12 | ending_l1_011_cub | b | cub | b, d, g, l |
| 13 | gen_final_l1_p_up_15_sound | p | up | p, b, d, g |
| 14 | ending_l1_015_knob | b | knob | b, d, g, l |
| 15 | ending_l1_027_cap | p | cap | p, b, d, g |

## Sample Remediation Round

| # | id | target | word | answer options |
|---:|---|---|---|---|
| 1 | gen_final_l1_l_curl_0_sound | l | curl | l, b, d, g |
| 2 | ending_l1_019_dab | b | dab | b, d, g, l |
| 3 | qb8_final_03 | d | lid | d, b, n, p |
| 4 | qb8_final_07 | g | mug | g, b, n, t |
| 5 | gen_final_l1_m_yam_6_sound | m | yam | m, b, d, g |
| 6 | gen_final_l1_n_van_17_sound | n | van | n, b, d, g |
| 7 | gen_final_l1_p_up_15_sound | p | up | p, b, d, g |
| 8 | qb8_final_15 | t | pot | t, d, n, b |
| 9 | gen_final_l1_l_seal_4_sound | l | seal | l, b, d, g |
| 10 | ending_l1_044_hospital | l | hospital | l, b, d, g |
| 11 | ending_l1_043_fossil | l | fossil | l, b, d, g |
| 12 | ending_l1_046_nail | l | nail | l, b, d, g |
| 13 | ending_l1_045_jewel | l | jewel | l, b, d, g |
| 14 | ending_l1_042_animal | l | animal | l, b, d, g |
| 15 | gen_final_l1_l_wheel_5_sound | l | wheel | l, b, d, g |

## Blocked Runtime Level 1 Candidates

- none

## Failures

- none
