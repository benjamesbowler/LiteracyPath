# Guided Reading Question Bank Remediation Evidence — 2026-07-22

## Outcome

The post-book comprehension experience has been rebuilt and audited across every active Guided Reading title.

- 176 active books checked: 100 fiction and 76 nonfiction
- 528 questions checked: 300 fiction and 228 nonfiction
- 528/528 answers tied to exact approved book-page evidence
- 176/176 books pass the strict question-bank gate
- 0 generic prompts
- 0 repeated correct answers within a book
- 0 fiction/character wording in nonfiction quizzes
- 0 conspicuous correct-answer length giveaways

The machine-readable per-book result is in `guided_reading_question_bank_audit_2026-07-22.md`.

## What the original audit found

The earlier bank was largely template-driven rather than a real comprehension check.

- 367 of 528 questions used generic templates:
  - 122 × “Which word was in your book?”
  - 103 × “Who is this story about?”
  - 81 × “What is/was this or your book about?”
  - 61 × generic missing-word prompts
- All 300 fiction questions were generic templates.
- 22 nonfiction books had three wholly templated questions.
- 91 books reused a correct-answer concept within their three-question quiz.
- The old runtime could manufacture random word/picture-recognition questions when a quiz failed to load. That fallback could look valid while testing recall of an arbitrary word rather than comprehension.

This explains both reported symptoms: answers appeared to repeat, and nonfiction books were asked story/character questions that did not fit their content.

## Content remediation

Every active book and its approved page text were brought into one audit scope. Each quiz now contains three book-specific questions with three plausible, non-duplicated choices.

- Fiction questions assess appropriate skills such as character action, setting, sequence, cause and effect, problem/solution, motivation, inference, outcome and theme.
- Nonfiction questions assess main idea, key detail, function, cause and effect, sequence, comparison and vocabulary.
- Correct answers are distinct within each book.
- Distractors are plausible in the context of that book and are kept comparable in form and length to the correct answer.
- Questions are phrased for the book’s Guided Reading level.
- Nonfiction prompts use topic/fact language rather than assuming that the book contains characters or a story.

The editorial work was reviewed in multiple passes:

1. All 100 fiction quizzes and every confirmed generic/broken nonfiction quiz were replaced from source-page evidence.
2. All 76 nonfiction books were reread question-by-question; 51 quiz files received further material refinements.
3. A second fiction critic pass changed 64 files / 192 questions to remove overclaims, awkward grammar, weak distractors, answer-length clues and formulaic “obviously good versus absurd” choices.
4. The evidence validator was then hardened against one-word overlap, unsupported answer clauses, action contradictions and positive/negative inversions. That stricter gate exposed 108 remaining evidence/hash failures rather than allowing weak matches to look complete; every one was remediated from the approved pages.
5. Independent cross-reviewers reread the revised early fiction, Dino Pals, Meadow Pals and Moonwood items. They corrected residual missing evidence anchors, duplicated concepts, inaccurate skill labels, overclaims, pronouns and child-unfriendly wording, then rechecked each correction until no concrete issue remained.

## Evidence and drift protection

Every authored quiz is now schema version 2 and records:

- a stable book/question ID;
- a quiz version;
- the approved comprehension skill;
- the exact evidence page and excerpt;
- additional supporting excerpts when an answer spans pages;
- a traceable human-authored rationale when an inference is not stated verbatim; and
- a SHA-256 content hash of the current approved book text.

The audit fails if page text changes without rechecking its quiz, evidence is invented or incomplete, a compound answer has an unsupported clause, evidence contradicts the answer or reverses its polarity, an inference lacks a meaningful reasoning link and multiple source anchors, a generic prompt returns, answer concepts repeat, a quiz targets the wrong book, or fiction language leaks into nonfiction prompts, choices or answers.

## Runtime and usability fixes

- The app now ships the approved generated question bank with the application instead of fetching individual quiz files at runtime.
- The misleading pseudo-comprehension fallback has been removed. If approved questions are ever unavailable, the child can finish the book without receiving a fabricated score.
- Answer order changes, while each three-question quiz uses all three correct-answer positions once so the answer is not repeatedly in the same place.
- Wrong answers give a clear retry response; a correct answer advances reliably.
- First-try scoring cannot be inflated by repeated taps, and delayed transitions are cleaned up when the quiz closes.
- Opening another book resets the quiz state for that book.
- Page-arrow navigation is blocked while the quiz dialog is open.
- The dialog traps keyboard focus and returns focus when it closes.
- Long choices stack vertically, the dialog remains usable on short screens, and optional audio-help controls are visually attached to their answer rather than resembling extra choices.

## Verification evidence

- Strict bank audit: 176/176 books pass; 528/528 answers evidence-grounded; 478 directly supported and 50 supported through traceable rationale; 0 failures.
- Focused question-bank/runtime tests: 11/11 pass, including adversarial contradiction, polarity, clause-coverage, genre and repeated-concept cases.
- Full unit suite: 890/890 pass.
- Production build: pass.
- Lint: zero errors; 18 remaining hook warnings are pre-existing and outside the new question-bank implementation.
- Permanent browser suite: desktop and phone Guided Reading quiz projects both pass.
- Live browser checks:
  - nonfiction question wording and plausible choices;
  - incorrect-answer retry, correct-answer advance and 2/3 first-try scoring;
  - long Level C fiction choices;
  - 390 px phone layout and short-screen containment;
  - keyboard focus wrapping inside the dialog;
  - seven-page reader-to-quiz handoff;
  - blocked page navigation while the quiz is open; and
  - no browser console errors.
