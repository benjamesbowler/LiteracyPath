# Skills Assessment repair status

Updated 2026-09-22. This supersedes the August numeric snapshot. Runtime authority is the 30 authored v3 skill banks selected by `src/data/loadAssessmentSkillBank.js`, with the shared policy in `src/policy/skillStatusPolicy.js`. The generated gate report and commit verification record establish the current test result.

## Scope and current corpus

The current repair contains 3,031 questions: 2,551 ordinary/exposure items and 480 retention reserves across 30 skills and 60 levels. Every skill has sixteen eligible retention questions for an eight-question check and a fresh eight-question retry. Ordinary phases retain their existing blueprint lengths and pass threshold.

Completed source repairs include longer, more demanding higher-level passages; single-sentence Sentence Comprehension; genuine event-order questions; corrected inference, causality and word-relation options; accurate distractor rationales; removal of noun-count answer-length shortcuts; and pronunciation-safe vowel comparisons. Sixteen new preposition scenes provide independent retention evidence. The damaged pipe illustration was replaced.

The runtime now composes complete phases, separates learners' evidence, excludes abandoned and unscored answers from mastery, preserves the last administered form across reloads, and administers delayed retention. Required audio and images fail closed: failed media cannot become a wrong literacy answer. Actual production preparation retains the current authored Vowel Teams bank instead of applying obsolete legacy filtering.

## Verification and release boundary

The current automated release gate checks all 30 banks, including ordinary and retention fresh retries, reading load, answer shortcuts, media declarations, exact image hashes and required production audio. Focused browser scenarios exercise the real controller and renderer on desktop and mobile sizes: learner isolation, incomplete rounds, restored plans, media failure/replacement, independent assignment and delayed retention. Database parity is exercised against the forward migration in an isolated PostgreSQL-compatible engine.

Generated evidence is retained in ignored `.artifacts/skills-quality/` and `.artifacts/assessment-rebuild/`. These are automated and directly rendered observations, not human listening, physical-device, classroom or psychometric evidence. File decoding and signal checks do not certify pronunciation or naturalness.

The required forward migration is `supabase/migrations/20260922160000_skills_assessment_runtime_validity.sql`. It aligns signed-in completion and prior-evidence contracts with full sittings and unscored media failures. A Git push does not apply this migration. Hosted application and authenticated end-to-end verification must be recorded separately before declaring signed-in parity complete.

## Remaining quality claim

The user requested an expedited push of completed work while usage was low. Broader independent second review was therefore stopped after the completed source checks. This release must not be described as a genuine whole-assessment-area 10/10: the hosted migration, authenticated verification, broader second-reader coverage and actual listening/classroom evidence remain distinct outstanding work. The other assessment products are outside this 30-skill corpus review.
