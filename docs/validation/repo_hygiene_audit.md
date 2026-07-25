# Repo Hygiene Audit

Date: 2026-07-25T01:04:30.636Z

This guardrail reports temporary, preview, stale request, generated, or accidental files that may be risky to commit. It does not delete or restore anything.

## Summary

| Metric | Count |
| --- | --- |
| Failures | 1 |
| Warnings | 57 |
| Ignored/allowed items | 704 |
| Git status entries | 5 |
| Tracked files inspected | 21376 |
| Untracked files inspected | 1 |

## Result

FAIL

## Failures

| Path | Reason | Suggested cleanup |
| --- | --- | --- |
| docs/.DS_Store | .DS_Store file found. | rm -f docs/.DS_Store |

## Warnings

| Path | Reason | Suggested cleanup |
| --- | --- | --- |
| docs/assets/complete_media_replacement_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/final_sounds_b_media_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_approved_hfw_missing_cartoon_media_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_audio_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_blends_image_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_digraphs_media_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_dino_pals_v2_missing_audio_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_first_facts_21_25_missing_word_audio_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_first_facts_clean_page_audio_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_guided_reading_cover_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_guided_reading_image_replacement_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_guided_reading_missing_word_audio_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_guided_reading_unique_word_audio_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_hfw_bad_audio_replacement_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_hfw_image_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_hfw_question_image_replacement_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_hfw_unique_scene_variants_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_image_replacement_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_image_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_initial_sounds_media_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_language_skill_unique_scene_variants_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_learn_area_image_audio_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_learn_area_missing_visuals_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_long_vowels_media_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_master_missing_media_request_2026-06-05.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_media_qa_replacement_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_media_replacement_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_missing_k3_word_bank_media_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_missing_skill_media_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_missing_whole_book_audio_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_next_asset_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_question_asset_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_rejected_image_replacement_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_rhyming_unique_variant_media_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_story_quest_dewdrop_flint_lost_glow_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_story_quest_luna_burrow_star_shell_door_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_strict_media_replacement_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_strict_missing_audio_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_strict_missing_images_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_strict_missing_media_combined_request.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/kimi_strict_missing_media_import_report.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/missing_media_report.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/assets/next_kimi_media_request_from_skill_audit.md | Existing active docs/assets media request document may be stale. | Review or archive if stale. |
| docs/validation/assessment_runtime_variation_audit.json | Generated/audit file has unstaged working-tree noise. | git restore docs/validation/assessment_runtime_variation_audit.json |
| docs/validation/assessment_runtime_variation_audit.md | Generated/audit file has unstaged working-tree noise. | git restore docs/validation/assessment_runtime_variation_audit.md |
| src/data/generated/hfwApprovedQuestionBank.generated.js | Runtime source contains banned phrase "may choose a book". | Review whether this is validation-only text or selectable content. |
| src/data/assessmentMediaPicker.js | Runtime source mentions photorealistic assessment imagery. | Review asset style and QA status. |
| src/data/hfwQuestionImageReview.js | Runtime source mentions photorealistic assessment imagery. | Review asset style and QA status. |
| src/data/storyQuests.js | Runtime source contains banned phrase "with a smile". | Review whether this is validation-only text or selectable content. |
| public/learn-decks/cycle-01/lesson-01/Cycle-01-Lesson-01.pptx | Large file over 20 MB: 27.3 MB. | Review before committing. |
| public/learn-decks/cycle-01/lesson-02/Cycle-01-Lesson-02.pptx | Large file over 20 MB: 25.0 MB. | Review before committing. |
| public/learn-decks/cycle-01/lesson-03/Cycle-01-Lesson-03.pptx | Large file over 20 MB: 20.1 MB. | Review before committing. |
| docs/guided-reading/guided_reading_word_audio_inventory.json | Large file over 5 MB outside approved media folders: 11.5 MB. | Review before committing. |
| src/data/generated/mediaQaReviewItems.generated.js | Large file over 5 MB outside approved media folders: 10.9 MB. | Review before committing. |
| docs/validation/app_image_inventory_audit.json | Large file over 5 MB outside approved media folders: 7.6 MB. | Review before committing. |
| docs/validation/repo_data_source_audit.json | Large file over 5 MB outside approved media folders: 7.2 MB. | Review before committing. |
| src/data/generated/skillWordBank.generated.js | Large file over 5 MB outside approved media folders: 6.8 MB. | Review before committing. |

## Ignored Or Allowed Items

| Path | Reason | Suggested cleanup |
| --- | --- | --- |
| preview | Intentional preview harness root from tools/hygiene-baseline.json. | Allowed only under the named preview root. |
| public/guided-reading/covers/gr-a-26-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-a-27-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-a-28-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-a-29-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-a-30-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-b-10-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-b-31-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-b-32-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-b-33-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-b-34-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-b-35-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-c-37-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-c-38-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-c-39-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-c-40-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-d-20-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-d-42-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-d-43-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-d-44-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-d-45-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-e-46-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-e-47-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-e-48-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-e-49-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/covers/gr-e-50-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/nonfiction/first-facts-level-a/book-01/source-title.webp | Existing tracked .webp media file has a source/reference/temp/draft-style name. | Allowed unless changed. |
| public/guided-reading/nonfiction/first-facts-level-a/book-02/source-title.webp | Existing tracked .webp media file has a source/reference/temp/draft-style name. | Allowed unless changed. |
| public/guided-reading/nonfiction/first-facts-level-a/book-03/source-title.webp | Existing tracked .webp media file has a source/reference/temp/draft-style name. | Allowed unless changed. |
| public/guided-reading/nonfiction/first-facts-level-a/book-04/source-title.webp | Existing tracked .webp media file has a source/reference/temp/draft-style name. | Allowed unless changed. |
| public/guided-reading/nonfiction/first-facts-level-a/book-05/source-title.webp | Existing tracked .webp media file has a source/reference/temp/draft-style name. | Allowed unless changed. |
| public/guided-reading/nonfiction/first-facts-level-a/book-06/source-title.webp | Existing tracked .webp media file has a source/reference/temp/draft-style name. | Allowed unless changed. |
| public/guided-reading/nonfiction/first-facts-level-a/book-07/source-title.webp | Existing tracked .webp media file has a source/reference/temp/draft-style name. | Allowed unless changed. |
| public/guided-reading/nonfiction/first-facts-level-a/book-08/source-title.webp | Existing tracked .webp media file has a source/reference/temp/draft-style name. | Allowed unless changed. |
| public/guided-reading/nonfiction/first-facts-level-a/book-09/source-title.webp | Existing tracked .webp media file has a source/reference/temp/draft-style name. | Allowed unless changed. |
| public/guided-reading/nonfiction/first-facts-level-a/book-10/source-title.webp | Existing tracked .webp media file has a source/reference/temp/draft-style name. | Allowed unless changed. |
| public/guided-reading/nonfiction/first-facts-level-a/book-11/source-title.webp | Existing tracked .webp media file has a source/reference/temp/draft-style name. | Allowed unless changed. |
| public/guided-reading/nonfiction/first-facts-level-a/book-12/source-title.webp | Existing tracked .webp media file has a source/reference/temp/draft-style name. | Allowed unless changed. |
| public/guided-reading/nonfiction/first-facts-level-a/book-13/source-title.webp | Existing tracked .webp media file has a source/reference/temp/draft-style name. | Allowed unless changed. |
| public/guided-reading/nonfiction/first-facts-level-a/book-14/source-title.webp | Existing tracked .webp media file has a source/reference/temp/draft-style name. | Allowed unless changed. |
| public/guided-reading/nonfiction/first-facts-level-a/book-15/source-title.webp | Existing tracked .webp media file has a source/reference/temp/draft-style name. | Allowed unless changed. |
| public/guided-reading/nonfiction/first-facts-level-a/book-16/source-title.webp | Existing tracked .webp media file has a source/reference/temp/draft-style name. | Allowed unless changed. |
| public/guided-reading/nonfiction/first-facts-level-a/book-17/source-title.webp | Existing tracked .webp media file has a source/reference/temp/draft-style name. | Allowed unless changed. |
| public/guided-reading/nonfiction/first-facts-level-a/book-18/source-title.webp | Existing tracked .webp media file has a source/reference/temp/draft-style name. | Allowed unless changed. |
| public/guided-reading/nonfiction/first-facts-level-a/book-19/source-title.webp | Existing tracked .webp media file has a source/reference/temp/draft-style name. | Allowed unless changed. |
| public/guided-reading/nonfiction/first-facts-level-a/book-20/source-title.webp | Existing tracked .webp media file has a source/reference/temp/draft-style name. | Allowed unless changed. |
| public/guided-reading/pages/gr-a-26-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-26-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-26-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-26-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-26-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-26-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-27-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-27-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-27-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-27-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-27-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-27-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-28-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-28-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-28-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-28-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-28-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-28-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-29-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-29-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-29-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-29-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-29-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-29-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-30-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-30-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-30-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-30-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-30-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-a-30-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-10-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-10-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-10-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-10-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-10-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-10-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-31-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-31-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-31-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-31-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-31-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-31-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-32-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-32-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-32-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-32-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-32-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-32-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-33-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-33-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-33-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-33-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-33-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-33-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-34-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-34-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-34-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-34-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-34-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-34-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-35-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-35-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-35-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-35-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-35-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-b-35-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-37-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-37-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-37-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-37-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-37-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-37-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-38-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-38-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-38-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-38-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-38-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-38-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-39-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-39-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-39-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-39-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-39-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-39-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-40-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-40-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-40-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-40-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-40-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-c-40-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-20-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-20-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-20-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-20-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-20-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-20-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-42-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-42-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-42-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-42-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-42-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-42-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-43-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-43-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-43-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-43-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-43-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-43-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-44-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-44-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-44-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-44-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-44-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-44-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-45-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-45-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-45-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-45-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-45-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-d-45-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-46-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-46-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-46-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-46-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-46-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-46-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-47-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-47-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-47-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-47-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-47-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-47-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-48-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-48-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-48-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-48-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-48-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-48-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-49-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-49-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-49-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-49-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-49-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-49-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-50-page-1.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-50-page-2.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-50-page-3.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-50-page-4.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-50-page-5.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/pages/gr-e-50-page-6.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/covers/gr-a-26-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/covers/gr-a-27-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/covers/gr-a-28-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/covers/gr-a-29-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/covers/gr-b-31-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/covers/gr-b-32-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/covers/gr-b-33-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/covers/gr-b-34-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/covers/gr-b-35-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/covers/gr-c-37-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/covers/gr-c-38-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/covers/gr-c-39-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/covers/gr-d-42-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/covers/gr-d-43-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/covers/gr-d-44-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/covers/gr-d-45-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/covers/gr-e-46-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/covers/gr-e-47-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/covers/gr-e-48-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/covers/gr-e-49-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/covers/gr-e-50-cover.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-26-page-01.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-26-page-02.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-26-page-03.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-26-page-04.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-26-page-05.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-26-page-06.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-27-page-01.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-27-page-02.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-27-page-03.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-27-page-04.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-27-page-05.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-27-page-06.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-28-page-01.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-28-page-02.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-28-page-03.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-28-page-04.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-28-page-05.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-28-page-06.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-29-page-01.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-29-page-02.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-29-page-03.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-29-page-04.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-29-page-05.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-a-29-page-06.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-31-page-01.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-31-page-02.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-31-page-03.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-31-page-04.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-31-page-05.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-31-page-06.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-32-page-01.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-32-page-02.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-32-page-03.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-32-page-04.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-32-page-05.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-32-page-06.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-33-page-01.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-33-page-02.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-33-page-03.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-33-page-04.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-33-page-05.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-33-page-06.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-34-page-01.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-34-page-02.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-34-page-03.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-34-page-04.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-34-page-05.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-34-page-06.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-35-page-01.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-35-page-02.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-35-page-03.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-35-page-04.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-35-page-05.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-b-35-page-06.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-c-37-page-01.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-c-37-page-02.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-c-37-page-03.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-c-37-page-04.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-c-37-page-05.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-c-37-page-06.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-c-38-page-01.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-c-38-page-02.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-c-38-page-03.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-c-38-page-04.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-c-38-page-05.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-c-38-page-06.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-c-39-page-01.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-c-39-page-02.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-c-39-page-03.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-c-39-page-04.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-c-39-page-05.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-c-39-page-06.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-42-page-01.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-42-page-02.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-42-page-03.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-42-page-04.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-42-page-05.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-42-page-06.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-43-page-01.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-43-page-02.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-43-page-03.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-43-page-04.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-43-page-05.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-43-page-06.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-44-page-01.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-44-page-02.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-44-page-03.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-44-page-04.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-44-page-05.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-44-page-06.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-45-page-01.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-45-page-02.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-45-page-03.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-45-page-04.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-45-page-05.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-d-45-page-06.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-46-page-01.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-46-page-02.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-46-page-03.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-46-page-04.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-46-page-05.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-46-page-06.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-47-page-01.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-47-page-02.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-47-page-03.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-47-page-04.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-47-page-05.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-47-page-06.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-48-page-01.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-48-page-02.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-48-page-03.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-48-page-04.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-48-page-05.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-48-page-06.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-49-page-01.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-49-page-02.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-49-page-03.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-49-page-04.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-49-page-05.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-49-page-06.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-50-page-01.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-50-page-02.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-50-page-03.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-50-page-04.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-50-page-05.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/guided-reading/regen/pages/gr-e-50-page-06.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/assessment/hfw/variants/replacement-2026-06-05/hfw_51_75/hfw_workbook_hfw_51_75_into_s08.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/assessment/hfw/variants/replacement-2026-06-05/hfw_51_75/hfw_workbook_hfw_51_75_into_s15.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/assessment/hfw/variants/replacement-2026-06-05/hfw_51_75/hfw_workbook_hfw_51_75_into_s16.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/assessment/hfw/variants/replacement-2026-06-05/hfw_51_75/hfw_workbook_hfw_51_75_into_s17.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/blends/black.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/blends/blue.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/blends/clap.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/blends/cloud.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/blends/drum.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/blends/flag.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/blends/frog.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/blends/slide.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/blends/snake.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/blends/star.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/blends/tree.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/bad.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/bag.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/bat.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/bed.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/bid.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/book.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/bud.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/bug.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/cap.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/cat.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/dig.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/dog.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/dot.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/dug.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/fish.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/hat.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/log.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/man.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/map.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/mug.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/nap.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/pan.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/pot.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/cvc/sun.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/digraphs/chair.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/digraphs/chick.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/digraphs/phone.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/digraphs/shell.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/digraphs/ship.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/digraphs/thumb.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/digraphs/whale.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/digraphs/wheel.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/ant.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/apple.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/axe.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/bad.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/bag.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/ball.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/bat.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/bear.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/bed.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/bell.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/bid.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/big.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/bin.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/bird.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/boat.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/book.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/box.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/brush.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/bud.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/bug.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/bus.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/cake.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/cap.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/car.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/cat.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/chair.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/clap.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/coat.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/corn.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/cot.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/crab.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/cup.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/cut.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/desk.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/dig.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/dish.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/dog.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/drum.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/duck.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/dug.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/egg.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/elephant.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/envelope.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/fan.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/farm.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/feet.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/fin.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/fish.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/flag.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/fork.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/fox.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/frog.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/gate.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/girl.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/gum.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/ham.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/hand.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/hat.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/hen.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/hit.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/hook.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/hop.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/hot.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/house.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/hut.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/igloo.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/ink.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/insect.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/jam.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/jet.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/jug.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/key.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/kid.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/king.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/kite.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/knife.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/lamp.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/leaf.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/leg.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/lid.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/lion.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/log.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/man.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/map.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/mat.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/meat.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/moon.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/mop.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/mud.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/mug.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/nap.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/net.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/nose.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/nut.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/octopus.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/orange.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/ox.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/pan.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/park.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/pen.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/pig.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/pin.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/pot.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/pun.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/queen.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/quilt.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/quiz.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/rain.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/ram.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/rat.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/red.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/ring.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/roof.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/rope.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/rug.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/run.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/sea.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/seal.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/seed.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/shell.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/ship.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/shoe.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/shop.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/sit.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/sled.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/snake.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/sock.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/son.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/spin.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/star.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/stop.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/sun.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/tap.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/ten.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/tent.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/thin.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/this.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/tiger.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/top.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/train.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/tub.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/umbrella.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/uncle.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/under.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/unicorn.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/up.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/van.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/vase.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/vest.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/vet.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/web.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/whale.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/white.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/wig.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/worm.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/yak.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/yarn.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/yo-yo.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/zebra.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/zip.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/initial-sounds/zoo.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/minimal-pairs/bad.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/minimal-pairs/bid.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/minimal-pairs/bud.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/minimal-pairs/cot.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/minimal-pairs/cut.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/minimal-pairs/dug.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/minimal-pairs/hit.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/minimal-pairs/hot.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/minimal-pairs/hut.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/minimal-pairs/pin.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/minimal-pairs/pun.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/plurals/books.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/plurals/boxes.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/plurals/brushes.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/plurals/cats.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/plurals/cups.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/plurals/dishes.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/plurals/dogs.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/plurals/hats.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/r-controlled/bird.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/r-controlled/corn.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/r-controlled/deer.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/r-controlled/horse.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-a/bag.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-a/bat.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-a/cap.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-a/cat.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-a/ham.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-a/hat.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-a/jam.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-a/man.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-a/map.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-a/nap.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-a/pan.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-a/ram.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-e/bed.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-e/jet.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-e/leg.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-e/net.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-e/pen.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-e/red.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-e/web.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-i/big.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-i/bin.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-i/dig.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-i/fin.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-i/fish.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-i/lid.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-i/pig.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-i/sit.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-i/wig.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-i/zip.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-o/box.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-o/dog.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-o/fox.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-o/log.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-o/mop.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-o/pot.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-o/rock.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-o/sock.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-u/bug.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-u/bun.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-u/bus.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-u/cup.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-u/duck.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-u/mud.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-u/mug.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-u/nut.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/short-u/sun.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/ui/cave-button-panel.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/ui/cave-reward-icon.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/ui/crystal-shards.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/ui/crystal-sparkle-particles.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/ui/floating-crystal.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/ui/glow-burst.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/ui/listen-icon.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/ui/magical-particles.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/ui/mastery-badge.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/ui/reward-star.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/ui/success-sparkle.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/vowel-teams/bee.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/vowel-teams/cake.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/vowel-teams/home.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/vowel-teams/nose.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/vowel-teams/tree.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/vowels/boat.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/vowels/coat.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/vowels/goat.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/vowels/road.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/child-mode/vowels/soap.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/comprehension/girl_reading.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/comprehension/paint_flower.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/comprehension/rainy_day.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/emotions/afraid_child.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/emotions/angry_child.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/emotions/calm_child.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/emotions/confused_child.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/emotions/excited_child.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/emotions/happy_child.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/emotions/proud_child.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/emotions/sad_child.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/emotions/surprised_child.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/emotions/tired_child.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/general/cat_sleeping.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/general/dog_running.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/generated/10_phonics_a.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/generated/1_phonics_c.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/generated/2_phonics_g.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/generated/3_phonics_r.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/generated/4_phonics_a.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/generated/5_phonics_p.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/generated/6_phonics_n.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/generated/7_phonics_o.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/generated/8_phonics_t.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/generated/9_phonics_b.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/generated/boy_afraid.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/generated/goat_inside_barn.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/generated/riddle_box.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/learn-games/icon-blend-build.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/learn-games/icon-cvc-builder.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/learn-games/icon-pop-word.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/learn-games/icon-reading-race.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/learn-games/icon-sight-memory.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/learn-games/icon-sound-slide.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/learn-games/icon-word-hopscotch.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/learn-games/phinny-celebrating.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/learn-games/phinny-waving.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/prepositions/ball_on_chair.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/prepositions/bear_behind_tree.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/prepositions/bird_above_tree.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/prepositions/cat_in_box.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/prepositions/cup_between_books.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/prepositions/dog_under_table.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/prepositions/duck_outside_pond.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/prepositions/goat_inside_barn.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/prepositions/rabbit_beside_basket.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/prepositions/shoes_near_door.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/vocabulary/apple.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/vocabulary/backpack.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/vocabulary/barn.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/vocabulary/bicycle.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/vocabulary/book.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/vocabulary/cake.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/vocabulary/dock.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/vocabulary/friends.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/vocabulary/umbrella.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/images/vocabulary/winter.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/media/learn/images/cycle-23/bang.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/media/learn/images/cycle-23/gong.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/media/learn/images/cycle-23/hang.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/media/learn/images/cycle-23/rang.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| public/media/learn/images/cycle-23/song.png | Existing tracked legacy non-webp public media file. | Allowed in this pass unless changed. |
| docs/assets/kimi_story_quest_last_two_books_image_redo_request.md | Approved active request document for current Story Quest image replacement pass. | Allowed. |

## Safe Cleanup Examples

- rm -f docs/.DS_Store
