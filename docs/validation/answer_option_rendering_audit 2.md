# Answer Option Rendering Audit

Generated: 2026-07-09T12:23:59.385Z

This audit checks that active assessment answer options resolve to visible labels for buttons/cards. Image-only questions must opt in explicitly with `imageOnly` or `hideWrittenLabels`.

## Summary

- Active skill-bank items checked: 4758
- Active label failures: 0
- Explicit image-only questions: 76
- Object-option render cases covered by shared helper: 0
- Runtime source warnings: 0

## Active Label Failures

_None._

## Explicit Image-Only Questions

| question id | skill | template | resolved labels |
| --- | --- | --- | --- |
| coverage_final_d_001 | ending_sounds | final_sound_pair | bed, mud, cat, dog |
| coverage_final_d_002 | ending_sounds | final_sound_pair | red, lid, fish, cat |
| coverage_final_d_003 | ending_sounds | final_sound_pair | mud, hand, sun, cat |
| coverage_final_d_004 | ending_sounds | final_sound_pair | seed, hand, dog, cat |
| coverage_final_d_005 | ending_sounds | final_sound_pair | lid, bird, map, cat |
| coverage_final_d_006 | ending_sounds | final_sound_pair | red, bed, cup, cat |
| coverage_final_d_007 | ending_sounds | final_sound_pair | hand, mud, fish, cat |
| coverage_final_g_001 | ending_sounds | final_sound_pair | dog, frog, cat, sun |
| coverage_final_g_002 | ending_sounds | final_sound_pair | bug, mug, sun, cat |
| coverage_final_g_003 | ending_sounds | final_sound_pair | bag, rug, fish, cat |
| coverage_final_g_004 | ending_sounds | final_sound_pair | pig, dig, hat, cat |
| coverage_final_g_005 | ending_sounds | final_sound_pair | leg, egg, map, cat |
| coverage_final_g_006 | ending_sounds | final_sound_pair | log, dog, pen, cat |
| coverage_final_k_001 | ending_sounds | final_sound_pair | book, duck, sun, cat |
| coverage_final_k_002 | ending_sounds | final_sound_pair | sock, rock, fish, cat |
| coverage_final_k_003 | ending_sounds | final_sound_pair | cake, snake, dog, cat |
| coverage_final_k_004 | ending_sounds | final_sound_pair | fork, park, hat, cat |
| coverage_final_k_005 | ending_sounds | final_sound_pair | desk, book, pig, cat |
| coverage_final_k_006 | ending_sounds | final_sound_pair | snake, cake, map, cat |
| coverage_final_k_007 | ending_sounds | final_sound_pair | rock, duck, pen, cat |
| coverage_final_l_001 | ending_sounds | final_sound_pair | ball, seal, dog, cat |
| coverage_final_l_002 | ending_sounds | final_sound_pair | shell, seal, cat, dog |
| coverage_final_l_003 | ending_sounds | final_sound_pair | girl, ball, sun, cat |
| coverage_final_l_004 | ending_sounds | final_sound_pair | ball, shell, fish, cat |
| coverage_final_m_001 | ending_sounds | final_sound_pair | ram, gum, dog, cat |
| coverage_final_m_002 | ending_sounds | final_sound_pair | ham, jam, fish, cat |
| coverage_final_m_003 | ending_sounds | final_sound_pair | farm, worm, cat, dog |
| coverage_final_m_004 | ending_sounds | final_sound_pair | thumb, drum, sun, cat |
| coverage_final_n_001 | ending_sounds | final_sound_pair | fan, ten, dog, cat |
| coverage_final_n_002 | ending_sounds | final_sound_pair | pan, hen, fish, cat |
| coverage_final_n_003 | ending_sounds | final_sound_pair | moon, corn, cat, dog |
| coverage_final_n_004 | ending_sounds | final_sound_pair | lion, pen, sun, cat |
| coverage_final_n_005 | ending_sounds | final_sound_pair | pin, bin, hat, cat |
| coverage_final_n_006 | ending_sounds | final_sound_pair | rain, train, cup, cat |
| coverage_final_p_001 | ending_sounds | final_sound_pair | cap, cup, dog, cat |
| coverage_final_p_002 | ending_sounds | final_sound_pair | mop, top, sun, cat |
| coverage_final_p_003 | ending_sounds | final_sound_pair | ship, shop, cat, dog |
| coverage_final_p_004 | ending_sounds | final_sound_pair | clap, nap, fish, cat |
| coverage_final_p_005 | ending_sounds | final_sound_pair | cup, top, bed, cat |
| coverage_final_r_001 | ending_sounds | final_sound_pair | car, tiger, dog, cat |
| coverage_final_r_002 | ending_sounds | final_sound_pair | fork, park, sun, cat |
| coverage_final_r_003 | ending_sounds | final_sound_pair | star, car, fish, cat |
| coverage_final_r_004 | ending_sounds | final_sound_pair | fork, car, map, cat |
| coverage_final_s_001 | ending_sounds | final_sound_pair | bus, this, dog, cat |
| coverage_final_s_002 | ending_sounds | final_sound_pair | vase, house, cat, dog |
| coverage_final_s_003 | ending_sounds | final_sound_pair | octopus, bus, fish, cat |
| coverage_final_s_004 | ending_sounds | final_sound_pair | bus, vase, sun, cat |
| coverage_final_t_001 | ending_sounds | final_sound_pair | cat, hat, dog, sun |
| coverage_final_t_002 | ending_sounds | final_sound_pair | bat, rat, sun, cat |
| coverage_final_t_003 | ending_sounds | final_sound_pair | jet, net, fish, cat |
| coverage_final_t_004 | ending_sounds | final_sound_pair | pot, cot, map, cat |
| coverage_final_t_005 | ending_sounds | final_sound_pair | feet, tent, dog, cat |
| coverage_final_t_006 | ending_sounds | final_sound_pair | kite, gate, sun, cat |
| recovery_final_f_1 | ending_sounds | final_sound_pair | leaf, roof, cat, dog |
| recovery_final_f_2 | ending_sounds | final_sound_pair | roof, leaf, dog, sun |
| recovery_final_sh_1 | ending_sounds | final_sound_pair | fish, dish, cat, dog |
| recovery_final_sh_2 | ending_sounds | final_sound_pair | dish, brush, map, cat |
| recovery_final_sh_3 | ending_sounds | final_sound_pair | fish, brush, sun, dog |
| recovery_final_t_1 | ending_sounds | final_sound_pair | cat, hat, dog, sun |
| recovery_final_t_2 | ending_sounds | final_sound_pair | bat, rat, sun, cat |
| recovery_final_t_3 | ending_sounds | final_sound_pair | mat, hat, fish, cup |
| recovery_final_p_1 | ending_sounds | final_sound_pair | map, cap, dog, cat |
| recovery_final_p_2 | ending_sounds | final_sound_pair | nap, clap, sun, cat |
| recovery_final_p_3 | ending_sounds | final_sound_pair | cap, clap, fish, bed |
| recovery_final_d_1 | ending_sounds | final_sound_pair | bed, red, cat, dog |
| recovery_final_d_2 | ending_sounds | final_sound_pair | mud, red, fish, cat |
| recovery_final_n_1 | ending_sounds | final_sound_pair | pen, hen, dog, cat |
| recovery_final_n_2 | ending_sounds | final_sound_pair | ten, hen, cup, cat |
| recovery_final_n_3 | ending_sounds | final_sound_pair | sun, fin, map, cat |
| recovery_final_g_1 | ending_sounds | final_sound_pair | dog, log, cat, sun |
| recovery_final_g_2 | ending_sounds | final_sound_pair | mug, leg, sun, cat |
| recovery_final_g_3 | ending_sounds | final_sound_pair | pig, egg, map, cat |
| recovery_final_m_1 | ending_sounds | final_sound_pair | drum, jam, cat, dog |
| recovery_final_k_1 | ending_sounds | final_sound_pair | duck, rock, sun, cat |
| recovery_final_k_2 | ending_sounds | final_sound_pair | book, duck, fish, cat |
| kimi7_final_b_1 | ending_sounds | final_sound_pair | crab, web, fan, cat |

## Object Options Covered By Shared Label Helper

_None._

## Runtime Source Warnings

_None._
