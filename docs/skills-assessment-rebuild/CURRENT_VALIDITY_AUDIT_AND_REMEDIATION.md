# Skills Assessment repair status

Updated 2026-09-28. This supersedes the earlier numeric snapshots. Runtime authority is the 30 authored v3 skill banks selected by `src/data/loadAssessmentSkillBank.js`, with the shared policy in `src/policy/skillStatusPolicy.js`. The generated gate report and commit verification record establish the current test result.

## Scope and current corpus

The current corpus contains 3,600 questions: 3,120 ordinary/exposure items and 480 retention reserves across 30 skills and 60 levels. Every skill has sixteen eligible retention questions for an eight-question check and a fresh eight-question retry. Ordinary phases retain their existing blueprint lengths and pass threshold.

The September 28 expansion adds 569 original questions across all 30 skills. It includes 200 new recognition/spelling contexts covering all 100 high-frequency words, broader spoken sound comparisons and spelling contrasts, inverse spatial relationships using inspected existing scenes, and 96 new comprehension questions spanning retrieval, integration, inference, causality, context and competing themes. Reusing a scene is not counted as a new picture or unseen retention evidence. The source lives beside each bank; compact phonics/language additions use the `authoring/depth/` modules.

Saved attempts retain the administered construct, target and question format. Teacher reports and downloads show coverage, recorded response contrasts and teaching suggestions while separating independent, supported, unavailable-media and unscored responses. They do not infer a misconception or mastery from participation. Legacy records without detail remain unknown.

Completed source repairs include longer, more demanding higher-level passages; single-sentence Sentence Comprehension; genuine event-order questions; corrected inference, causality and word-relation options; accurate distractor rationales; removal of noun-count answer-length shortcuts; and pronunciation-safe vowel comparisons. Sixteen new preposition scenes provide independent retention evidence. The damaged pipe illustration was replaced.

The runtime now composes complete phases, separates learners' evidence, excludes abandoned and unscored answers from mastery, preserves the last administered form across reloads, and administers delayed retention. Required audio and images fail closed: failed media cannot become a wrong literacy answer. Actual production preparation retains the current authored Vowel Teams bank instead of applying obsolete legacy filtering.

## Verification and release boundary

The current automated release gate checks all 30 banks, including ordinary and retention fresh retries, reading load, answer shortcuts, media declarations, exact image hashes and required production audio. Focused browser scenarios exercise the real controller and renderer on desktop and mobile sizes: learner isolation, incomplete rounds, restored plans, media failure/replacement, independent assignment and delayed retention. Database parity is exercised against the forward migration in an isolated PostgreSQL-compatible engine.

Generated evidence is retained in ignored `.artifacts/learning-depth/`, `.artifacts/reporting-depth/` and `.artifacts/assessment-rebuild/`. These are automated and directly rendered observations, not human listening, physical-device, classroom or psychometric evidence. File decoding and signal checks do not certify pronunciation or naturalness.

The required forward migration is `supabase/migrations/20260922160000_skills_assessment_runtime_validity.sql`. It aligns signed-in completion and prior-evidence contracts with full sittings and unscored media failures. A Git push does not apply this migration. Hosted application and authenticated end-to-end verification must be recorded separately before declaring signed-in parity complete.

## Quality claim boundary

The expansion received a second content review, including all 96 new comprehension questions and the new grammar/vocabulary contrasts. Actual corpus and playable-task counts describe breadth; they do not quantify a percentage gain in educational quality. Human listening, physical-device testing, classroom outcomes and psychometric validation remain separate evidence categories. Historical signed-in assessment verification must be checked independently of the Adventure Map snapshot migration; applying the latter does not prove the former.
