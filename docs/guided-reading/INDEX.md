# Guided Reading — index

45 files, 230,934 words.

Guided Reading is the levelled-book side of the app: 176 books with narration,
word-tap audio and quizzes. This folder holds both the systems that produce those
books and the audits of each import batch.

## Runtime audio contract

- Every readable word token on every live page resolves to a current production
  voice clip and plays on the first tap.
- **Read whole book** uses current production narration only. When narration is
  stored as page clips, it plays those clips in order, turns to the matching image
  and text after each clip, and continues without another press.
- Guided Reading narration plays at the child-paced `0.88` rate. Deleted legacy
  whole-book paths must never override the current page-by-page narration.
- `tests/unit/guidedReadingLedaAudioCoverage.test.js` is the release gate for page
  narration, word-token coverage, legacy-path rejection and the continuous-reading
  contract.

## Systems and standards — still current

These describe how books are made and what they must satisfy. Read these.

| File | Words | What it covers |
| --- | ---: | --- |
| [GUIDED_READING_IMAGE_FACTORY](GUIDED_READING_IMAGE_FACTORY.md) | 353 | Guided Reading Image Factory |
| [GUIDED_READING_VISUAL_CONTINUITY_AUDIT](GUIDED_READING_VISUAL_CONTINUITY_AUDIT.md) | 8,345 | Guided Reading Visual Continuity Audit |
| [codex_guided_story_generation_pipeline](codex_guided_story_generation_pipeline.md) | 412 | Codex Guided Story Generation Pipeline |
| [fiction_continuity_checklist](fiction_continuity_checklist.md) | 397 | Fiction Continuity Checklist |
| [guided-story-adaptation-system](guided-story-adaptation-system.md) | 2,506 | Guided Story Adaptation System |
| [guided_reading_question_bank_audit_2026-07-22](guided_reading_question_bank_audit_2026-07-22.md) | 2,931 | Guided Reading Question Bank Audit — 2026-07-22 |
| [guided_reading_question_bank_remediation_evidence_2026-07-22](guided_reading_question_bank_remediation_evidence_2026-07-22.md) | 945 | Guided Reading Question Bank Remediation Evidence — 2026-07-22 |
| [guided_reading_word_audio_inventory](guided_reading_word_audio_inventory.md) | 47,854 | Guided Reading Word Audio Inventory |
| [image_text_artifact_contact_sheet](image_text_artifact_contact_sheet.md) | 5,960 | Guided Reading Image Text Artifact Contact Sheet |
| [kimi_whole_book_audio_import_report](kimi_whole_book_audio_import_report.md) | 2,373 | Kimi Whole-Book Audio Import Report |
| [library_coverage_report](library_coverage_report.md) | 1,296 | Guided Reading Library Coverage Report |
| [manual_image_text_artifact_review](manual_image_text_artifact_review.md) | 49,433 | Manual Guided Reading Image Text Artifact Review |
| [whole_book_audio_coverage_inventory](whole_book_audio_coverage_inventory.md) | 5,002 | Guided Reading Whole-Book Audio Coverage Inventory |
| [whole_book_audio_timing_verification_needed](whole_book_audio_timing_verification_needed.md) | 3,020 | Guided Reading Whole-Book Timing Verification Needed |

## Import and audit receipts — historical

One file per book batch or per audit pass, recording what was imported and what was
wrong at the time. Useful for tracing a specific book's history; not a description of
how things work today.

| File | Words | What it covers |
| --- | ---: | --- |
| [aiden_and_betty_books_6_10_import_audit](aiden_and_betty_books_6_10_import_audit.md) | 380 | Aiden and Betty Level C Books 6-10 Import Audit |
| [aiden_and_betty_import_audit](aiden_and_betty_import_audit.md) | 649 | Aiden and Betty Level C Import Audit |
| [bob_and_nan_books_6_10_import_audit](bob_and_nan_books_6_10_import_audit.md) | 424 | Bob and Nan Level A Books 6-10 Import Audit |
| [bob_and_nan_import_audit](bob_and_nan_import_audit.md) | 381 | Bob and Nan Level A Import Audit |
| [dino_pals_books_11_20_import_audit](dino_pals_books_11_20_import_audit.md) | 790 | Dino Pals Level B Books 11-20 Import Audit |
| [dino_pals_books_1_10_import_audit](dino_pals_books_1_10_import_audit.md) | 662 | Dino Pals Level B Books 1-10 Import Audit |
| [fiction_removal_audit](fiction_removal_audit.md) | 2,342 | Guided Reading Fiction Removal Audit |
| [first_facts_audio_contamination_audit](first_facts_audio_contamination_audit.md) | 654 | First Facts Audio Contamination Audit |
| [first_facts_books_21_25_import_audit](first_facts_books_21_25_import_audit.md) | 323 | First Facts Level A Books 21-25 Import Audit |
| [first_facts_level_a_books_1_20_import_audit](first_facts_level_a_books_1_20_import_audit.md) | 711 | First Facts Level A Books 1-20 Import Audit |
| [guided_reading_audio_replacement_import_audit](guided_reading_audio_replacement_import_audit.md) | 519 | Guided Reading Audio Replacement Import Audit |
| [guided_reading_content_audit](guided_reading_content_audit.md) | 18,629 | Guided Reading Content Audit |
| [guided_reading_cover_audit](guided_reading_cover_audit.md) | 349 | Guided Reading Cover Audit |
| [guided_reading_experience_audit](guided_reading_experience_audit.md) | 5,167 | Guided Reading Experience Audit |
| [guided_reading_image_text_alignment_audit](guided_reading_image_text_alignment_audit.md) | 40,472 | Guided Reading Image/Text Alignment Audit |
| [guided_reading_image_text_artifact_audit](guided_reading_image_text_artifact_audit.md) | 8,039 | Guided Reading Image Text Artifact Audit |
| [guided_reading_layout_audit](guided_reading_layout_audit.md) | 486 | Guided Reading Layout Audit |
| [guided_reading_quality_audit](guided_reading_quality_audit.md) | 400 | Guided Reading Quality Audit |
| [guided_reading_regen_import_audit](guided_reading_regen_import_audit.md) | 2,179 | Guided Reading Regeneration Import Audit |
| [guided_reading_relevel_audit](guided_reading_relevel_audit.md) | 4,335 | Guided Reading Relevel Audit |
| [guided_reading_title_page_audit](guided_reading_title_page_audit.md) | 5,616 | Guided Reading Title Page Audit |
| [guided_reading_typography_audit](guided_reading_typography_audit.md) | 335 | Guided Reading Typography Audit |
| [guided_story_draft_audit](guided_story_draft_audit.md) | 51 | Guided Story Draft Audit |
| [james_and_anna_books_6_10_import_audit](james_and_anna_books_6_10_import_audit.md) | 512 | James and Anna Level B Books 6-10 Import Audit |
| [james_and_anna_import_audit](james_and_anna_import_audit.md) | 548 | James and Anna Level B Import Audit |
| [level_a_nonfiction_import_audit](level_a_nonfiction_import_audit.md) | 1,065 | Level A Nonfiction Import Audit |
| [level_c_nonfiction_import_audit](level_c_nonfiction_import_audit.md) | 669 | Level C Nonfiction Import Audit |
| [meadow_pals_import_audit](meadow_pals_import_audit.md) | 1,335 | Meadow Pals Level A Import Audit |
| [moonwood_tales_books_import_audit](moonwood_tales_books_import_audit.md) | 1,574 | Moonwood Tales Level C Import Audit |
| [nonfiction_transportation_bugs_removal_audit](nonfiction_transportation_bugs_removal_audit.md) | 288 | Transportation and Bugs Nonfiction Removal Audit |
| [public_domain_feature_removal_audit](public_domain_feature_removal_audit.md) | 223 | External Book Shelf Feature Removal Audit |
