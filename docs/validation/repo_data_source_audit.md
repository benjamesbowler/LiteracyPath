# Repo Data Source Audit

Generated: 2026-07-04T02:26:59.138Z

## Summary

| Metric | Value |
| --- | --- |
| Files audited | 11920 |
| Legacy / stale findings | 457 |
| Recommended keep | 433 |
| Recommended archive | 135 |
| Recommended delete | 0 |
| Recommended block_from_runtime | 0 |
| Recommended manual review | 11352 |

## Category Counts

| Category | Count |
| --- | --- |
| active_runtime | 77 |
| docs_only | 143 |
| generator_source | 33 |
| legacy_candidate | 36 |
| media_asset | 11314 |
| unknown | 31 |
| unused_candidate | 7 |
| validation_only | 279 |

## Legacy / Stale Pattern Findings

| File | Category | Bad patterns | Imported by | Action | Reason |
| --- | --- | --- | --- | --- | --- |
| docs/assets/README.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/archive/clean_audio_replacement_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/archive/complete_audio_replacement_request.md | docs_only | legacy_marker, file_existence_as_approval |  | archive | Docs contain stale/legacy markers. |
| docs/assets/archive/kimi_learn_games_audio_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/archive/kimi_requests/kimi_story_quest_bouncy_speedy_fast_map_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/archive/kimi_requests/kimi_story_quest_brave_tiny_big_little_rescue_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/archive/kimi_requests/kimi_story_quest_dino_pals_chompy_big_lunch_hunt_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/archive/kimi_requests/kimi_story_quest_dino_pals_sunny_rainy_rescue_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/archive/kimi_requests/kimi_story_quest_muddy_splashy_missing_hat_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/archive/kimi_requests/kimi_story_quest_sam_alf_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/archive/kimi_requests/kimi_story_quest_sam_pam_audio_replacement_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/archive/kimi_requests/kimi_story_quest_shy_cuddly_quiet_adventure_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/assessment_asset_coverage.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/assessment_audio_audit_method.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/assessment_audio_inventory.md | docs_only | legacy_marker, file_existence_as_approval |  | archive | Docs contain stale/legacy markers. |
| docs/assets/assessment_audio_replacement_import_report.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/assessment_replacement_image_import_report.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/audio-source-research.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/audio_quality_audit.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/bud_audio_image_status_report.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/child_mode_asset_coverage.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/clean_audio_pack_import.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/complete_media_replacement_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/core_phonics_runtime_depth_audit.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/core_skills_progression_alignment_report.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/final_sounds_b_media_import_audit.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/final_sounds_b_media_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/guided_reading_unique_word_audio_inventory.json | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/guided_reading_unique_word_audio_inventory.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/guided_reading_word_audio_import_plan.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/image_quality_audit.md | docs_only | legacy_marker, file_existence_as_approval |  | archive | Docs contain stale/legacy markers. |
| docs/assets/initial_sounds_500_asset_import_audit.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/initial_sounds_target_word_quality_audit.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/initial_sounds_word_inventory.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi-image-qa-replacements/kimi_image_qa_replacement_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_approved_hfw_missing_cartoon_media_request.csv | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_approved_hfw_missing_cartoon_media_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_assets2_import_report.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_assets3_import_report.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_assets4_import_report.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_assets5_6_import_report.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_assets8_import_report.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_audio_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_blends_image_request.json | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_blends_image_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_digraphs_media_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_first_facts_21_25_missing_word_audio_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_first_facts_clean_page_audio_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_guided_reading_missing_word_audio_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_guided_reading_unique_word_audio_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_hfw_bad_audio_replacement_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_hfw_image_request.json | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_hfw_image_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_hfw_question_image_replacement_request.csv | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_hfw_unique_scene_variants_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_high_quality_media_style_import_audit.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_image_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_initial_sounds_media_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_language_skill_unique_scene_variants_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_learn_area_image_audio_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_long_vowels_media_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_master_missing_media_request_2026-06-05.csv | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_master_missing_media_request_2026-06-05.json | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_master_missing_media_request_2026-06-05.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_master_replacement_queue.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_media_replacement_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_missing_skill_media_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_missing_whole_book_audio_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_next_asset_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_question_asset_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_rejected_image_replacement_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_story_quest_dewdrop_flint_lost_glow_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_story_quest_last_two_books_image_redo_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_story_quest_luna_burrow_star_shell_door_request.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_strict_missing_media_import_report.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_vocab_500_import_audit.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_vocab_500_import_manifest.json | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_vocab_500_lexicon_summary.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_vocab_expansion_500_clean.json | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_vocab_expansion_500_clean.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/kimi_vocab_expansion_500_summary.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/meadow_pals_missing_word_audio_import_report.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/meadow_pals_story_quest_media_pending.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/media_qa_admin_pages_report.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/media_replacement_log.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/rejected_media_manifest.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/replacement_summary.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/stabilization_pass_report.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/story_quest_asset_audit.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/suspect_audio_quarantine.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/unmatched_assessment_replacement_images.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/usable_vocab_media_inventory.json | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/usable_vocab_media_inventory.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/vocab_media_expansion_plan.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/assets/vocab_media_gaps_for_kimi.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/imports/kimi_dataset7_candidates.json | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/imports/kimi_dataset7_validation_report.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/imports/kimi_phonics_dataset7.json | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/imports/kimi_these_still_need_finishing_2026-06-05/plan.md | docs_only | legacy_marker |  | archive | Docs contain stale/legacy markers. |
| docs/validation/all_skill_level_media_audit.json | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/all_skill_level_media_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/all_skills_strict_production_audit.json | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/app_image_inventory.csv | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/app_image_inventory_audit.json | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/approved_hfw_media_coverage_audit.json | validation_only | photorealistic, legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/approved_hfw_media_coverage_audit.md | validation_only | photorealistic, legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/approved_runtime_sources_audit.json | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/assessment_active_media_optimization_report.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/assessment_audio_role_consistency_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/assessment_bank_loader_check.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/assessment_data_loading_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/assessment_level1_content_media_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/assessment_media_registry_audit.json | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/assessment_media_registry_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/assessment_preload_coverage_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/assessment_runtime_variation_audit.json | validation_only | inline_svg_image, legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/assessment_skill_integrity_audit.json | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/assessment_skill_routing_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/assessment_variant_depth_audit.json | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/assessment_variant_depth_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/bundle_size_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/duplicate_question_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/early_skill_runtime_eligibility_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/final_sounds_level1_purity_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/first_10_skill_media_depth_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/full_assessment_production_readiness_audit.json | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/full_assessment_production_readiness_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/full_question_bank_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/grammar_image_coverage_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/guided_reading_cover_page_one_duplication_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/hfw_audio_quality_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/hfw_distractor_ambiguity_audit.json | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/hfw_level_2_import_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/hfw_question_image_pairing_audit.json | validation_only | photorealistic, legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/hfw_question_image_pairing_audit.md | validation_only | photorealistic, legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/hfw_question_quality_audit.md | validation_only | direct_hfw_find_word, legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/hfw_question_review_audit.json | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/hfw_question_review_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/hfw_runtime_smoke_check.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/image_qa_heuristics_audit.json | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/image_qa_heuristics_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/kimi_cartoon_baby_child_voice_import_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/kimi_new_vocab_media_import_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/kimi_question_audit_response.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/media_overwrite_risk_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/new_media_reachability_audit.json | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/new_media_reachability_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/new_vocab_media_usage_audit.json | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/question_bank_quality_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/reading_media_size_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/replacement_skill_round_depth_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/repo_data_source_audit.json | validation_only | banned_before_snack, banned_with_a_smile, banned_train_slowed, banned_ball_bounced, banned_may_choose_book, banned_truck_gate, photorealistic, legacy_marker, banned_phrase:before snack, banned_phrase:with a smile, banned_phrase:When the train slowed, banned_phrase:When the ball bounced, banned_phrase:may choose a book, banned_phrase:truck stopped by the gate |  | keep | Validation or audit tooling/output. |
| docs/validation/repo_data_source_audit.md | validation_only | banned_before_snack, banned_with_a_smile, banned_train_slowed, banned_ball_bounced, banned_may_choose_book, banned_truck_gate, photorealistic, legacy_marker, banned_phrase:before snack, banned_phrase:with a smile, banned_phrase:When the train slowed, banned_phrase:When the ball bounced, banned_phrase:may choose a book, banned_phrase:truck stopped by the gate |  | keep | Validation or audit tooling/output. |
| docs/validation/repo_hygiene_audit.md | validation_only | banned_may_choose_book, photorealistic, legacy_marker, banned_phrase:may choose a book |  | keep | Validation or audit tooling/output. |
| docs/validation/round_selection_audit.md | validation_only | direct_hfw_find_word |  | keep | Validation or audit tooling/output. |
| docs/validation/runtime_template_failures.md | validation_only | direct_hfw_find_word |  | keep | Validation or audit tooling/output. |
| docs/validation/second_block_skill_media_depth_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/skill_level_depth_audit.json | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/skill_template_routing_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/start_end_sound_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| docs/validation/ui_design_audit.md | validation_only | legacy_marker |  | keep | Validation or audit tooling/output. |
| public/audio/choices/public-word-audio-pilot.json | media_asset | legacy_marker |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/above-01-star-tree.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/above-02-lamp-table.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/above-03-balloon-child.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/across-01-bridge-river.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/across-02-road-field.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/across-03-line-page.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/against-01-ladder-wall.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/against-02-bike-fence.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/against-03-pillow-chair.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/around-01-scarf-neck.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/around-02-fence-garden.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/around-03-path-pond.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/behind-01-cat-sofa.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/behind-02-sun-cloud.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/behind-03-child-curtain.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/below-01-ball-shelf.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/below-02-fish-boat.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/below-03-rug-table.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/beside-01-lamp-bed.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/beside-02-dog-child.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/beside-03-cup-plate.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/between-01-ball-box-chair.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/between-02-child-trees.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/between-03-book-pencil-cup.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/in-01-toy-box.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/in-02-fish-bowl.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/in-03-pencil-cup.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/in-front-of-01-dog-house.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/in-front-of-02-child-board.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/in-front-of-03-flower-fence.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/inside-01-goat-barn.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/inside-02-toy-basket.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/inside-03-cat-tent.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/into-01-ball-basket.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/into-02-child-room.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/into-03-letter-mailbox.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/near-01-shoes-door.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/near-02-cup-plate.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/near-03-bird-nest.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/next-to-01-pencil-book.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/next-to-02-cup-bowl.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/next-to-03-chair-desk.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/on-01-cat-mat.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/on-02-book-shelf.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/on-03-hat-head.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/out-of-01-bird-cage.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/out-of-02-toy-box.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/out-of-03-child-tent.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/outside-01-dog-house.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/outside-02-duck-pond.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/outside-03-backpack-classroom.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/over-01-bird-tree.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/over-02-kite-house.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/over-03-plane-clouds.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/through-01-train-tunnel.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/through-02-child-doorway.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/through-03-water-pipe.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/under-01-ball-table.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/under-02-dog-chair.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/assessment/language/variants/prepositions/under-03-shoe-bed.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/child-image-manifest.json | media_asset | legacy_marker |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/cvc/bat.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/cvc/cap.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/cvc/cat.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/cvc/hat.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/cvc/man.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/cvc/map.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/cvc/nap.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/cvc/pan.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/objects/book.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/objects/dog.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/objects/fish.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/vowels/bed.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/vowels/boat.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/vowels/coat.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| public/images/vowels/goat.svg | media_asset | inline_svg_image |  | review_manually | Media asset not directly imported; manifest/reference audit needed. |
| src/data/assessmentMediaPicker.js | active_runtime | direct_hfw_find_word, photorealistic, legacy_marker | tools/auditAssessmentMediaRegistry.js<br>tools/auditHfwQuestionImagePairings.js<br>tools/checkAssessmentRuntimeVariation.js | keep | Listed as active runtime source or imported by runtime loader. |
| src/data/assessmentMediaRegistry.js | active_runtime | legacy_marker | src/data/assessmentMediaPicker.js<br>src/data/hfwRuntimeEligibility.js<br>tools/auditApprovedHfwMediaCoverage.js<br>tools/auditAssessmentMediaRegistry.js<br>tools/auditHfwQuestionImagePairings.js<br>tools/auditNewMediaReachability.js<br>tools/auditSkillWordBankWorkbook.js<br>tools/checkAssessmentRuntimeVariation.js | keep | Listed as active runtime source or imported by runtime loader. |
| src/data/assessmentQaReplacementQuestions.js | active_runtime | legacy_marker | src/data/loadAssessmentSkillBank.js<br>tools/phonicsRuntimeUtils.js | keep | Listed as active runtime source or imported by runtime loader. |
| src/data/assessmentSkillMapping.js | active_runtime | legacy_marker | src/data/loadAssessmentSkillBank.js<br>tools/checkAssessmentActiveMediaSizes.js<br>tools/checkAssessmentAudioRoleConsistency.js<br>tools/checkAssessmentPreloadCoverage.js<br>tools/checkAssessmentRuntimeSafety.js<br>tools/checkRepeatSelection.js<br>tools/checkRuntimeQuestionCoverage.js<br>tools/optimizeAssessmentActiveMedia.js | keep | Listed as active runtime source or imported by runtime loader. |
| src/data/audioManifest.js | legacy_candidate | direct_hfw_find_word, legacy_marker | tools/checkK3WordBankMediaCoverage.js<br>tools/generateAudioBatch.js<br>tools/importPublicWordAudioPilot.js | archive | Matches legacy/outdated source patterns. |
| src/data/audioPreferenceManifest.js | legacy_candidate | legacy_marker | src/data/assessmentMediaRegistry.js<br>src/data/childAssets.js<br>src/data/contentExpansionPass3Questions.js<br>src/data/finalSoundCoverageQuestions.js<br>src/data/generated/grammarAssessmentQuestions.generated.js<br>src/data/hfwRuntimeEligibility.js<br>src/data/initialSoundPairAssets.js<br>src/data/ixlStyleSeedQuestions.js | archive | Matches legacy/outdated source patterns. |
| src/data/childActivityModels.js | legacy_candidate | legacy_marker |  | archive | Matches legacy/outdated source patterns. |
| src/data/childAssets.js | legacy_candidate | legacy_marker | src/data/assessmentMediaRegistry.js<br>src/data/childActivityModels.js<br>src/data/contentExpansionPass3Questions.js<br>src/data/finalSoundCoverageQuestions.js<br>src/data/generated/grammarAssessmentQuestions.generated.js<br>src/data/initialSoundPairAssets.js<br>src/data/ixlStyleSeedQuestions.js<br>src/data/listenAndFindAssets.js | archive | Matches legacy/outdated source patterns. |
| src/data/contentExpansionPass3Questions.js | active_runtime | direct_hfw_find_word, legacy_marker | src/data/loadAssessmentSkillBank.js<br>tools/auditQuestionBank.js<br>tools/checkAssessmentAudioRoleConsistency.js<br>tools/checkAssessmentRuntimeSafety.js<br>tools/checkEarlyPhonicsValidity.js<br>tools/checkRepeatSelection.js<br>tools/checkRuntimeQuestionCoverage.js<br>tools/phonicsRuntimeUtils.js | keep | Listed as active runtime source or imported by runtime loader. |
| src/data/cvcShortVowelExpansionQuestions.js | active_runtime | direct_hfw_find_word | src/data/loadAssessmentSkillBank.js<br>tools/auditQuestionBank.js<br>tools/checkAssessmentAudioRoleConsistency.js<br>tools/checkAssessmentRuntimeSafety.js<br>tools/checkEarlyPhonicsValidity.js<br>tools/checkRepeatSelection.js<br>tools/checkRuntimeQuestionCoverage.js<br>tools/phonicsRuntimeUtils.js | keep | Listed as active runtime source or imported by runtime loader. |
| src/data/elCyclePoems.js | legacy_candidate | direct_hfw_find_word |  | archive | Matches legacy/outdated source patterns. |
| src/data/elSkillsBlockCycles.js | legacy_candidate | direct_hfw_tap_word, legacy_marker | tools/checkGuidedReadingImageQaContracts.js<br>tools/checkLearnAreaContentQuality.js<br>tools/checkLearnAreaContracts.js | archive | Matches legacy/outdated source patterns. |


_Only first 250 findings shown; see JSON for all 457._

## Source Of Truth Areas

| Area | Role | Active runtime files |
| --- | --- | --- |
| hfw | approved workbook only | src/data/generated/hfwApprovedQuestionBank.generated.js<br>src/data/generated/hfwAssessmentQuestions.generated.js<br>src/data/generated/hfwLevel2Questions.generated.js<br>src/data/generated/hfwQuestionReviewBlocklist.generated.js |
| grammar | current sentence-fit grammar banks | src/data/generated/grammarAssessmentQuestions.generated.js<br>src/data/generated/languageSkillQuestions.generated.js<br>src/data/generated/secondBlockSkillTopUpQuestions.generated.js |
| earlyPhonics | current image/audio-backed early phonics banks | src/data/initialSoundCoverageQuestions.js<br>src/data/finalSoundCoverageQuestions.js<br>src/data/rhymingCoverageQuestions.js<br>src/data/cvcShortVowelExpansionQuestions.js<br>src/data/shortVowelDiscriminationPhase2Questions.js<br>src/data/generated/earlySkillQuestions.generated.js<br>src/data/generated/finalSounds.generated.js<br>src/data/generated/cvc.generated.js<br>src/data/generated/rhyming.generated.js<br>src/data/generated/shortVowel.generated.js |
| assessmentReplacements | current replacement/depth banks | src/data/assessmentQaReplacementQuestions.js<br>src/data/highQualityComprehensionReplacements.js<br>src/data/qbAssess_main_idea.js<br>src/data/qbAssess_cause_effect.js<br>src/data/qbAssess_sequencing.js<br>src/data/generated/skillLevelGapQuestions.generated.js<br>src/data/generated/firstTenSkillTopUpQuestions.generated.js<br>src/data/generated/secondBlockSkillTopUpQuestions.generated.js<br>src/data/generated/blendsAssessmentQuestions.generated.js<br>src/data/generated/digraphsAssessmentQuestions.generated.js<br>src/data/generated/longVowelsAssessmentQuestions.generated.js<br>src/data/generated/vowelTeamsVarietyQuestions.generated.js |
| media | current registry and QA controls | src/data/assessmentMediaRegistry.js<br>src/data/assessmentMediaPicker.js<br>src/data/questionMediaResolver.js<br>src/data/mediaQaManifest.js<br>src/data/mediaQaReviewStatus.js<br>src/data/hfwQuestionImageReview.js<br>src/data/generated/assessmentImageVariants.generated.js<br>src/data/generated/hfwQuestionImageReview.generated.js |
| guidedReading | active guided reading source files | src/data/guidedReadingBooks.js<br>src/data/guidedReadingRegenBooks.js<br>src/data/guidedStoryBooks.js<br>src/data/firstFactsActualLevelABooks.js |
| storyQuest | active Story Quest source files | src/data/storyQuests.js<br>src/utils/storyQuestProgress.js |
| validationOnly | audit output and tooling only |  |
| legacyCandidates | not allowed in runtime selection |  |