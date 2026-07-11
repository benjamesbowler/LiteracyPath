# Assessment Mixed Card Audio Audit

Date: 2026-06-10

Scope: Active assessment runtime rows loaded through `loadAssessmentBanksForSkills(getActiveAssessmentSkillIds())`.

Result: 93 mixed image-card option sets across 91 unique active questions have mixed answer-card audio coverage. All flagged rows are in `rhyming`; no other active skill returned mixed coverage in this audit.

These should be fixed through content/media cleanup by either adding the missing answer-card audio or removing all card-level audio for the affected question. Runtime logic was not weakened.

## Rhyming

- `coverage_rhyme_l1_at_008` audio 3/4; missing: pop
- `coverage_rhyme_l1_at_010` audio 3/4; missing: pop
- `coverage_rhyme_l1_at_011` audio 3/4; missing: pop
- `coverage_rhyme_l1_at_023` audio 3/4; missing: pit
- `coverage_rhyme_l1_an_007` audio 3/4; missing: pop
- `coverage_rhyme_l1_an_009` audio 3/4; missing: pop
- `coverage_rhyme_l1_an_010` audio 3/4; missing: pop
- `coverage_rhyme_l1_ap_004` audio 3/4; missing: gap
- `coverage_rhyme_l1_ap_008` audio 3/4; missing: pop
- `coverage_rhyme_l1_ap_009` audio 3/4; missing: gap
- `coverage_rhyme_l1_ap_010` audio 3/4; missing: pop
- `coverage_rhyme_l1_ap_011` audio 3/4; missing: pop
- `coverage_rhyme_l1_ap_014` audio 3/4; missing: gap
- `coverage_rhyme_l1_ap_019` audio 3/4; missing: gap
- `coverage_rhyme_l1_ap_023` audio 3/4; missing: pit
- `coverage_rhyme_l1_am_003` audio 3/4; missing: dam
- `coverage_rhyme_l1_am_007` audio 2/4; missing: dam, pop
- `coverage_rhyme_l1_am_009` audio 3/4; missing: pop
- `coverage_rhyme_l1_am_010` audio 3/4; missing: pop
- `coverage_rhyme_l1_am_011` audio 3/4; missing: dam
- `coverage_rhyme_l1_ed_002` audio 3/4; missing: fed
- `coverage_rhyme_l1_ed_003` audio 3/4; missing: fed
- `coverage_rhyme_l1_ed_005` audio 3/4; missing: fed
- `coverage_rhyme_l1_ed_006` audio 3/4; missing: fed
- `coverage_rhyme_l1_ed_008` audio 3/4; missing: pit
- `coverage_rhyme_l1_ed_009` audio 3/4; missing: pit
- `coverage_rhyme_l1_en_003` audio 3/4; missing: men
- `coverage_rhyme_l1_en_007` audio 2/4; missing: men, pit
- `coverage_rhyme_l1_en_009` audio 3/4; missing: pit
- `coverage_rhyme_l1_en_010` audio 3/4; missing: pit
- `coverage_rhyme_l1_en_011` audio 3/4; missing: men
- `coverage_rhyme_l1_ig_006` audio 3/4; missing: fed
- `coverage_rhyme_l1_in_006` audio 3/4; missing: fed
- `coverage_rhyme_l1_it_002` audio 3/4; missing: pit
- `coverage_rhyme_l1_it_003` audio 3/4; missing: pit
- `coverage_rhyme_l1_it_005` audio 2/4; missing: pit, fed
- `coverage_rhyme_l1_it_006` audio 2/4; missing: pit, fed
- `coverage_rhyme_l1_it_007` audio 3/4; missing: fed
- `coverage_rhyme_l1_op_003` audio 3/4; missing: pop
- `coverage_rhyme_l1_op_006` audio 3/4; missing: fed
- `coverage_rhyme_l1_op_007` audio 3/4; missing: pop
- `coverage_rhyme_l1_op_011` audio 3/4; missing: pop
- `coverage_rhyme_l1_ot_006` audio 3/4; missing: fed
- `coverage_rhyme_l1_ug_006` audio 3/4; missing: fed
- `coverage_rhyme_l1_un_005` audio 3/4; missing: fed
- `coverage_rhyme_l1_un_006` audio 3/4; missing: fed
- `coverage_rhyme_l1_un_007` audio 3/4; missing: fed
- `coverage_rhyme_l2_ing_001` audio 3/4; missing: gain
- `coverage_rhyme_l2_ang_001` audio 2/4; missing: hang, need
- `coverage_rhyme_l2_ang_002` audio 3/4; missing: rang
- `coverage_rhyme_l2_ang_003` audio 2/4; missing: hang, rang
- `coverage_rhyme_l2_ang_004` audio 2/4; missing: bang, sink
- `coverage_rhyme_l2_ang_005` audio 2/4; missing: rang, sink
- `coverage_rhyme_l2_ang_006` audio 2/4; missing: bang, rang
- `coverage_rhyme_l2_ang_007` audio 3/4; missing: bang
- `coverage_rhyme_l2_ang_008` audio 2/4; missing: hang, gong
- `coverage_rhyme_l2_ang_009` audio 1/4; missing: bang, hang, gong
- `coverage_rhyme_l2_ong_001` audio 2/4; missing: gong, gain
- `coverage_rhyme_l2_ong_002` audio 3/4; missing: song
- `coverage_rhyme_l2_ink_001` audio 3/4; missing: gain
- `coverage_rhyme_l2_ink_002` audio 3/4; missing: sink
- `coverage_rhyme_l2_ock_001` audio 3/4; missing: gain
- `coverage_rhyme_l2_all_001` audio 3/4; missing: need
- `coverage_rhyme_l2_all_002` audio 3/4; missing: need
- `coverage_rhyme_l2_ell_001` audio 2/4; missing: fell, gain
- `coverage_rhyme_l2_ell_002` audio 3/4; missing: hang
- `coverage_rhyme_l2_ell_003` audio 3/4; missing: fell
- `coverage_rhyme_l2_ell_004` audio 2/4; missing: hang, bank
- `coverage_rhyme_l2_ell_005` audio 2/4; missing: bank, cash
- `coverage_rhyme_l2_ell_006` audio 3/4; missing: cash
- `coverage_rhyme_l2_ell_008` audio 2/4; missing: fell, truck
- `coverage_rhyme_l2_ell_009` audio 3/4; missing: fell
- `coverage_rhyme_l2_ish_001` audio 3/4; missing: gain
- `coverage_rhyme_l2_uck_001` audio 2/4; missing: truck, gain
- `coverage_rhyme_l2_ake_001` audio 3/4; missing: need
- `coverage_rhyme_l2_ake_002` audio 3/4; missing: truck
- `coverage_rhyme_l2_ame_001` audio 3/4; missing: need
- `coverage_rhyme_l2_ame_002` audio 3/4; missing: need
- `coverage_rhyme_l2_oat_001` audio 3/4; missing: gain
- `coverage_rhyme_l2_oat_004` audio 3/4; missing: rang
- `coverage_rhyme_l2_oat_005` audio 1/4; missing: rang, bank, cash
- `coverage_rhyme_l2_oat_006` audio 2/4; missing: bank, cash
- `coverage_rhyme_l2_oat_007` audio 2/4; missing: bank, cash
- `coverage_rhyme_l2_oat_008` audio 3/4; missing: fell
- `coverage_rhyme_l2_ouse_001` audio 2/4; missing: sight, gain
- `coverage_rhyme_l2_ouse_002` audio 2/4; missing: mouse, gain
- `coverage_rhyme_l2_urn_001` audio 3/4; missing: gain
- `coverage_rhyme_l2_ar_002` audio 3/4; missing: fell
- `p3_rhyme_listen_en_5` visual card audio 3/4; missing: pit
- `p3_rhyme_listen_en_5` IXL image audio 3/4; missing: pit
- `p3_rhyme_read_en_5` visual card audio 3/4; missing: pit
- `p3_rhyme_read_en_5` IXL image audio 3/4; missing: pit
- `ixl_rhyming_picture_30` audio 1/2; missing: mouse
