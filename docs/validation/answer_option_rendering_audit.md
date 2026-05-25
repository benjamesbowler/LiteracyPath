# Answer Option Rendering Audit

Generated: 2026-05-25T04:46:10.288Z

This audit checks that active assessment answer options resolve to visible labels for buttons/cards. Image-only questions must opt in explicitly with `imageOnly` or `hideWrittenLabels`.

## Summary

- Active skill-bank items checked: 1765
- Active label failures: 0
- Explicit image-only questions: 113
- Object-option render cases covered by shared helper: 0
- Runtime source warnings: 0

## Active Label Failures

_None._

## Explicit Image-Only Questions

| question id | skill | template | resolved labels |
| --- | --- | --- | --- |
| coverage_final_d_001 | ending_sounds | final_sound_pair | bed, mud, cat |
| coverage_final_d_002 | ending_sounds | final_sound_pair | red, bud, fish |
| coverage_final_d_003 | ending_sounds | final_sound_pair | bid, kid, sun |
| coverage_final_d_004 | ending_sounds | final_sound_pair | seed, hand, dog |
| coverage_final_d_005 | ending_sounds | final_sound_pair | lid, bird, map |
| coverage_final_d_006 | ending_sounds | final_sound_pair | red, bed, cup |
| coverage_final_d_007 | ending_sounds | final_sound_pair | hand, mud, fish |
| coverage_final_g_001 | ending_sounds | final_sound_pair | dog, frog, cat |
| coverage_final_g_002 | ending_sounds | final_sound_pair | bug, mug, sun |
| coverage_final_g_003 | ending_sounds | final_sound_pair | bag, rug, fish |
| coverage_final_g_004 | ending_sounds | final_sound_pair | pig, dig, hat |
| coverage_final_g_005 | ending_sounds | final_sound_pair | leg, egg, map |
| coverage_final_g_006 | ending_sounds | final_sound_pair | log, dog, pen |
| coverage_final_k_001 | ending_sounds | final_sound_pair | book, duck, sun |
| coverage_final_k_002 | ending_sounds | final_sound_pair | sock, rock, fish |
| coverage_final_k_003 | ending_sounds | final_sound_pair | cake, snake, dog |
| coverage_final_k_004 | ending_sounds | final_sound_pair | fork, park, hat |
| coverage_final_k_005 | ending_sounds | final_sound_pair | desk, book, pig |
| coverage_final_k_006 | ending_sounds | final_sound_pair | snake, cake, map |
| coverage_final_k_007 | ending_sounds | final_sound_pair | rock, duck, pen |
| coverage_final_l_001 | ending_sounds | final_sound_pair | ball, seal, dog |
| coverage_final_l_002 | ending_sounds | final_sound_pair | shell, seal, cat |
| coverage_final_l_003 | ending_sounds | final_sound_pair | girl, ball, sun |
| coverage_final_l_004 | ending_sounds | final_sound_pair | ball, shell, fish |
| coverage_final_m_001 | ending_sounds | final_sound_pair | ram, gum, dog |
| coverage_final_m_002 | ending_sounds | final_sound_pair | ham, jam, fish |
| coverage_final_m_003 | ending_sounds | final_sound_pair | farm, worm, cat |
| coverage_final_m_004 | ending_sounds | final_sound_pair | thumb, drum, sun |
| coverage_final_n_001 | ending_sounds | final_sound_pair | fan, ten, dog |
| coverage_final_n_002 | ending_sounds | final_sound_pair | pan, hen, fish |
| coverage_final_n_003 | ending_sounds | final_sound_pair | moon, corn, cat |
| coverage_final_n_004 | ending_sounds | final_sound_pair | lion, pen, sun |
| coverage_final_n_005 | ending_sounds | final_sound_pair | pin, bin, hat |
| coverage_final_n_006 | ending_sounds | final_sound_pair | rain, train, cup |
| coverage_final_p_001 | ending_sounds | final_sound_pair | cap, cup, dog |
| coverage_final_p_002 | ending_sounds | final_sound_pair | mop, top, sun |
| coverage_final_p_003 | ending_sounds | final_sound_pair | ship, shop, cat |
| coverage_final_p_004 | ending_sounds | final_sound_pair | clap, nap, fish |
| coverage_final_p_005 | ending_sounds | final_sound_pair | cup, top, bed |
| coverage_final_r_001 | ending_sounds | final_sound_pair | car, tiger, dog |
| coverage_final_r_002 | ending_sounds | final_sound_pair | fork, park, sun |
| coverage_final_r_003 | ending_sounds | final_sound_pair | star, car, fish |
| coverage_final_r_004 | ending_sounds | final_sound_pair | fork, car, map |
| coverage_final_s_001 | ending_sounds | final_sound_pair | bus, this, dog |
| coverage_final_s_002 | ending_sounds | final_sound_pair | vase, house, cat |
| coverage_final_s_003 | ending_sounds | final_sound_pair | octopus, bus, fish |
| coverage_final_s_004 | ending_sounds | final_sound_pair | bus, vase, sun |
| coverage_final_t_001 | ending_sounds | final_sound_pair | cat, hat, dog |
| coverage_final_t_002 | ending_sounds | final_sound_pair | bat, rat, sun |
| coverage_final_t_003 | ending_sounds | final_sound_pair | jet, net, fish |
| coverage_final_t_004 | ending_sounds | final_sound_pair | pot, cot, map |
| coverage_final_t_005 | ending_sounds | final_sound_pair | feet, tent, dog |
| coverage_final_t_006 | ending_sounds | final_sound_pair | kite, gate, sun |
| coverage_rhyme_at_001 | rhyming | rhyme_pair | cat, hat, dog |
| coverage_rhyme_at_002 | rhyming | rhyme_pair | bat, rat, sun |
| coverage_rhyme_at_003 | rhyming | rhyme_pair | mat, cat, fish |
| coverage_rhyme_at_004 | rhyming | rhyme_pair | hat, bat, cup |
| coverage_rhyme_ap_001 | rhyming | rhyme_pair | cap, nap, dog |
| coverage_rhyme_ap_002 | rhyming | rhyme_pair | map, cap, sun |
| coverage_rhyme_ap_003 | rhyming | rhyme_pair | clap, nap, fish |
| coverage_rhyme_an_001 | rhyming | rhyme_pair | fan, pan, dog |
| coverage_rhyme_an_002 | rhyming | rhyme_pair | man, van, sun |
| coverage_rhyme_an_003 | rhyming | rhyme_pair | pan, can, fish |
| coverage_rhyme_ed_001 | rhyming | rhyme_pair | bed, red, dog |
| coverage_rhyme_ed_002 | rhyming | rhyme_pair | red, bed, sun |
| coverage_rhyme_en_001 | rhyming | rhyme_pair | pen, hen, dog |
| coverage_rhyme_en_002 | rhyming | rhyme_pair | ten, pen, sun |
| coverage_rhyme_en_003 | rhyming | rhyme_pair | hen, ten, map |
| coverage_rhyme_ig_001 | rhyming | rhyme_pair | pig, wig, dog |
| coverage_rhyme_ig_002 | rhyming | rhyme_pair | big, dig, sun |
| coverage_rhyme_ig_003 | rhyming | rhyme_pair | wig, dig, map |
| coverage_rhyme_in_001 | rhyming | rhyme_pair | fin, pin, dog |
| coverage_rhyme_in_002 | rhyming | rhyme_pair | bin, pin, sun |
| coverage_rhyme_in_003 | rhyming | rhyme_pair | fin, bin, map |
| coverage_rhyme_it_001 | rhyming | rhyme_pair | sit, hit, dog |
| coverage_rhyme_it_002 | rhyming | rhyme_pair | hit, sit, sun |
| coverage_rhyme_og_001 | rhyming | rhyme_pair | dog, log, sun |
| coverage_rhyme_og_002 | rhyming | rhyme_pair | frog, dog, cat |
| coverage_rhyme_og_003 | rhyming | rhyme_pair | log, frog, map |
| coverage_rhyme_op_001 | rhyming | rhyme_pair | mop, top, dog |
| coverage_rhyme_op_002 | rhyming | rhyme_pair | shop, mop, sun |
| coverage_rhyme_op_003 | rhyming | rhyme_pair | stop, top, fish |
| coverage_rhyme_ot_001 | rhyming | rhyme_pair | pot, cot, dog |
| coverage_rhyme_ot_002 | rhyming | rhyme_pair | hot, pot, sun |
| coverage_rhyme_ot_003 | rhyming | rhyme_pair | cot, hot, map |
| coverage_rhyme_ug_001 | rhyming | rhyme_pair | bug, rug, dog |
| coverage_rhyme_ug_002 | rhyming | rhyme_pair | mug, bug, sun |
| coverage_rhyme_ug_003 | rhyming | rhyme_pair | rug, mug, fish |
| coverage_rhyme_un_001 | rhyming | rhyme_pair | sun, bun, dog |
| coverage_rhyme_un_002 | rhyming | rhyme_pair | bun, sun, map |
| recovery_final_f_1 | ending_sounds | final_sound_pair | leaf, roof, cat |
| recovery_final_f_2 | ending_sounds | final_sound_pair | roof, leaf, dog, sun |
| recovery_final_sh_1 | ending_sounds | final_sound_pair | fish, dish, cat |
| recovery_final_sh_2 | ending_sounds | final_sound_pair | dish, brush, map |
| recovery_final_sh_3 | ending_sounds | final_sound_pair | fish, brush, sun, dog |
| recovery_final_t_1 | ending_sounds | final_sound_pair | cat, hat, dog |
| recovery_final_t_2 | ending_sounds | final_sound_pair | bat, rat, sun |
| recovery_final_t_3 | ending_sounds | final_sound_pair | mat, hat, fish, cup |
| recovery_final_p_1 | ending_sounds | final_sound_pair | map, cap, dog |
| recovery_final_p_2 | ending_sounds | final_sound_pair | nap, clap, sun |
| recovery_final_p_3 | ending_sounds | final_sound_pair | cap, clap, fish, bed |
| recovery_final_d_1 | ending_sounds | final_sound_pair | bed, red, cat |
| recovery_final_d_2 | ending_sounds | final_sound_pair | mud, red, fish |
| recovery_final_n_1 | ending_sounds | final_sound_pair | pen, hen, dog |
| recovery_final_n_2 | ending_sounds | final_sound_pair | ten, hen, cup |
| recovery_final_n_3 | ending_sounds | final_sound_pair | sun, fin, map |
| recovery_final_g_1 | ending_sounds | final_sound_pair | dog, log, cat |
| recovery_final_g_2 | ending_sounds | final_sound_pair | mug, leg, sun |
| recovery_final_g_3 | ending_sounds | final_sound_pair | pig, egg, map |
| recovery_final_m_1 | ending_sounds | final_sound_pair | drum, jam, cat |
| recovery_final_k_1 | ending_sounds | final_sound_pair | duck, rock, sun |
| recovery_final_k_2 | ending_sounds | final_sound_pair | book, duck, fish |
| kimi7_final_b_1 | ending_sounds | final_sound_pair | crab, web, fan |

## Object Options Covered By Shared Label Helper

_None._

## Runtime Source Warnings

_None._
